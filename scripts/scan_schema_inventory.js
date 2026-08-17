#!/usr/bin/env node

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ts = require('typescript');

const INVENTORY_PATH = 'tests/schemas/xtend-schema-inventory.json';
const INVENTORY_SUITE_PATH = 'tests/schemas/schema_inventory_suite.js';
const SCANNER_PATH = 'scripts/scan_schema_inventory.js';
const FORMAL_RMT_SCHEMA_FAMILY_ID = 'https://xtendrmt.dev/schemas/rmt.schema.json';
const FORMAL_RMT_SCHEMA_ID = 'https://xtendrmt.dev/schemas/rmt.v2.schema.json';
const JSON_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';
const VERSIONED_IDENTIFIER_SOURCE = '[A-Za-z][A-Za-z0-9_-]*(?:\\.[A-Za-z0-9][A-Za-z0-9_-]*)+\\.v[0-9]+(?:\\.[0-9]+)*';
const VERSIONED_IDENTIFIER_PATTERN = new RegExp(
  '(?<![A-Za-z0-9_-])(' + VERSIONED_IDENTIFIER_SOURCE + ')(?![A-Za-z0-9_-]|\\.[A-Za-z0-9_-])',
  'g'
);
const VERSIONED_IDENTIFIER_EXACT_PATTERN = new RegExp('^' + VERSIONED_IDENTIFIER_SOURCE + '$');
const TEXT_SIZE_LIMIT = 16 * 1024 * 1024;

const SOURCE_EXCLUDES = new Set([
  INVENTORY_PATH,
  INVENTORY_SUITE_PATH,
  SCANNER_PATH,
  'package-lock.json'
]);

// Materialized knowledge aggregates preserve their canonical sources verbatim.
// Scanning those packaged mirrors would manufacture duplicate schema usages and
// make generated output look like an independent source of truth.
const MATERIALIZED_AGGREGATE_EXCLUDED_PREFIXES = Object.freeze([
  'products/xtend-mcp/generated/'
]);

const BINARY_EXTENSIONS = new Set([
  '.gif', '.ico', '.jpeg', '.jpg', '.pdf', '.png', '.ttf', '.vsix', '.webp', '.woff', '.woff2', '.zip'
]);

const INTERFACE_REFERENCE_TYPES = new Set([
  'package-export',
  'symbol',
  'browser-global',
  'browser-event',
  'custom-element',
  'cli',
  'json-pointer',
  'repo-symbol',
  'internal-repo-symbol'
]);

const SHAPE_IGNORED_FIELDS = new Set([
  '$id', '$schema', 'default', 'defaults', 'description', 'descriptions', 'example', 'examples', 'schema', 'title'
]);

const EVIDENCE_TYPES = new Set([
  'formal-schema', 'declared-type', 'runtime-observation', 'test', 'docs', 'generated'
]);

const LIFECYCLE_STATUSES = new Set(['active', 'deprecated', 'retired']);
const ROLLOUT_STATUSES = new Set(['planned', 'dual-read', 'canonical-write', 'complete']);
const CONSOLIDATION_DECISIONS = new Set(['consolidate', 'distinct-contract', 'defer-insufficient-evidence']);

// JSON Schema annotation keywords deliberately do not participate in structural
// equality. All other keywords are retained recursively, including extension
// keywords, because silently dropping a validator constraint could produce a
// false-positive consolidation candidate.
const JSON_SCHEMA_ANNOTATION_KEYWORDS = new Set([
  '$comment', '$id', 'default', 'deprecated', 'description', 'examples', 'readOnly', 'title', 'writeOnly'
]);

const ROLE_ORDER = Object.freeze({
  definition: 0,
  producer: 1,
  consumer: 2,
  metadata: 3,
  fixture: 4,
  'negative-fixture': 5,
  assertion: 6,
  documentation: 7,
  'generated-mirror': 8,
  reference: 9
});

const VISIBILITY_ORDER = Object.freeze({
  public: 0,
  internal: 1,
  test: 2,
  fixture: 3,
  docs: 4,
  generated: 5
});

function resolveRootDir(rootDir) {
  return path.resolve(rootDir || path.join(__dirname, '..'));
}

function toPosixPath(value) {
  return String(value || '').split(path.sep).join('/').replace(/^\.\//u, '');
}

function compareStrings(left, right) {
  const leftValue = String(left);
  const rightValue = String(right);
  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return 0;
}

function uniqueSorted(values) {
  return Array.from(new Set((values || []).filter((value) => value !== null && value !== undefined)))
    .sort(compareStrings);
}

function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort(compareStrings).reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value), null, 2) + '\n';
}

function trackedFiles(rootDir) {
  const output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: rootDir,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024
  });
  return output.toString('utf8').split('\0').filter(Boolean).map(toPosixPath).sort(compareStrings);
}

function isGeneratedPath(relativePath) {
  const value = toPosixPath(relativePath);
  return value.startsWith('.xtend-build/')
    || value.startsWith('dist/')
    || value.startsWith('build/')
    || value.startsWith('generated/')
    || value.startsWith('docs/generated/')
    || value.includes('/site/build/')
    || value.includes('/dist/')
    || value.includes('/.xtend-build/')
    || /(?:^|\/)generated(?:\/|$)/u.test(value)
    || /-build\.(?:js|mjs|cjs|d\.ts|json)$/u.test(value)
    || /\.min\.(?:js|css)$/u.test(value);
}

function shouldReadFile(relativePath, absolutePath) {
  if (SOURCE_EXCLUDES.has(relativePath) || path.posix.basename(relativePath) === 'package-lock.json') return false;
  if (MATERIALIZED_AGGREGATE_EXCLUDED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) return false;
  if (BINARY_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) return false;
  let stat;
  try {
    stat = fs.statSync(absolutePath);
  } catch (error) {
    return false;
  }
  return stat.isFile() && stat.size <= TEXT_SIZE_LIMIT;
}

function readTrackedTextFiles(rootDir) {
  const files = [];
  trackedFiles(rootDir).forEach((relativePath) => {
    const absolutePath = path.join(rootDir, relativePath);
    if (!shouldReadFile(relativePath, absolutePath)) return;
    const buffer = fs.readFileSync(absolutePath);
    if (buffer.includes(0)) return;
    files.push({
      path: relativePath,
      text: buffer.toString('utf8'),
      generated: isGeneratedPath(relativePath)
    });
  });
  return files;
}

function isOwnedIdentifier(schemaId) {
  return /^(?:xtend(?:-llm)?|xtensions?)\./u.test(schemaId);
}

function humanizeIdentifier(schemaId) {
  return String(schemaId || '')
    .replace(/^https?:\/\//u, '')
    .replace(/\.v[0-9]+(?:\.[0-9]+)*$/u, '')
    .replace(/^(?:xtend(?:-llm)?|xtensions?)\./u, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\b(?:wp|vnext)\b/gi, (token) => token.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCasePhrase(value) {
  const smallWords = new Set(['and', 'for', 'of', 'or', 'to', 'with']);
  return String(value || '').split(' ').filter(Boolean).map((word, index) => {
    if (index > 0 && smallWords.has(word.toLowerCase())) return word.toLowerCase();
    if (/^[A-Z0-9]+$/u.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function inferKinds(schemaId, occurrences, formalJsonSchema) {
  if (formalJsonSchema) return ['json-schema'];
  const lower = schemaId.toLowerCase();
  const kinds = [];
  if (lower.includes('fixture')) kinds.push('fixture-id');
  if (lower.includes('report')) kinds.push('report-id');
  if (lower.includes('contract')) kinds.push('contract-id');
  if (lower.includes('policy')) kinds.push('policy-id');
  if (lower.includes('manifest')) kinds.push('manifest-id');
  if (lower.includes('profile')) kinds.push('profile-id');
  if (/(?:^|[._-])event(?:[._-]|$)/u.test(lower)) kinds.push('event-id');
  if (kinds.length === 0 && occurrences.some((occurrence) => Array.isArray(occurrence.contextKinds) && occurrence.contextKinds.includes('event'))) kinds.push('event-id');
  if (/(?:^|[._-])record(?:[._-]|$)/u.test(lower)) kinds.push('record-id');
  if (lower.includes('diagnostic')) kinds.push('diagnostic-id');
  if (lower.includes('schema')) kinds.push('schema-identifier');
  if (occurrences.some((occurrence) => occurrence.role === 'producer')) kinds.push('runtime-discriminator');
  if (kinds.length === 0) kinds.push('identifier-only');
  return uniqueSorted(kinds);
}

function inferStatus(schemaId, occurrences) {
  const visibilities = new Set(occurrences.map((occurrence) => occurrence.visibility));
  const roles = new Set(occurrences.map((occurrence) => occurrence.role));
  if (occurrences.every((occurrence) => occurrence.generated)) return 'generated-mirror';
  if (roles.has('negative-fixture') && Array.from(roles).every((role) => ['negative-fixture', 'assertion', 'documentation', 'generated-mirror'].includes(role))) {
    return 'negative-test-only';
  }
  if (Array.from(visibilities).every((visibility) => ['test', 'fixture', 'docs', 'generated'].includes(visibility))) {
    if (visibilities.has('fixture')) return 'fixture-only';
    if (visibilities.has('test')) return 'test-only';
    return 'docs-example';
  }
  if (!isOwnedIdentifier(schemaId) && Array.from(visibilities).every((visibility) => ['fixture', 'test', 'docs', 'generated'].includes(visibility))) {
    return 'external-reference';
  }
  return 'active';
}

function applicationForPath(relativePath) {
  const value = toPosixPath(relativePath);
  if (value.startsWith('xcommand/')) return 'XCommand';
  if (/^(?:src\/components\/x-keymap|components\/xkeymap)/u.test(value)) return 'XKeymap';
  if (value.startsWith('src/components/')) return 'XTend Components';
  if (value.startsWith('components/')) return 'XTend Components';
  if (value.startsWith('xtendrmt/')) return 'XTendRMT';
  if (value.startsWith('xtend-builder/')) return 'XTend Builder';
  if (value.startsWith('fabric/')) return 'XTend Fabric';
  if (value.startsWith('a11y/')) return 'XTend Accessibility';
  if (value.startsWith('security/')) return 'XTend Security';
  if (value.startsWith('tools/xtensions/')) return 'XTensions';
  if (value.startsWith('tools/')) return 'XTend Tooling';
  if (value.startsWith('products/xtend-llm/')) return 'XTend LLM';
  if (value.startsWith('products/')) return 'XTend Products';
  if (value.startsWith('catalog/')) return 'XTend Catalog';
  if (value.startsWith('design-tokens/')) return 'XTend Design Tokens';
  if (value.startsWith('xsurface-shard/')) return 'XSurface Shard';
  if (value.startsWith('xtend-maraca/')) return 'XTend Maraca';
  if (value.startsWith('tests/')) {
    const domain = value.split('/')[1] || 'repository';
    return 'XTend Tests: ' + titleCasePhrase(domain.replace(/-/g, ' '));
  }
  if (value.startsWith('docs/')) return 'XTend Documentation';
  if (value.startsWith('development/')) return 'XTend Development Contracts';
  if (value === 'package.json' || value.endsWith('/package.json')) return 'Package Metadata';
  if (value.startsWith('scripts/')) return 'XTend Build and Test Tooling';
  return 'XTend Core';
}

function visibilityForPath(relativePath, generated) {
  const value = toPosixPath(relativePath);
  if (generated) return 'generated';
  if (value.startsWith('docs/') || value.startsWith('development/') || value.endsWith('.md')) return 'docs';
  if (value.includes('/fixtures/') || value.startsWith('tests/fixtures/') || /fixture/i.test(path.basename(value))) return 'fixture';
  if (value.startsWith('tests/')) return 'test';
  if (/^(?:components|xcommand|xtendrmt|fabric|a11y|security|catalog|design-tokens|xsurface-shard|xtend-maraca)\//u.test(value)) return 'public';
  return 'internal';
}

function roleForOccurrence(relativePath, context, generated) {
  const value = toPosixPath(relativePath);
  const lowerContext = String(context || '').toLowerCase();
  if (generated) return 'generated-mirror';
  if (value.startsWith('docs/') || value.startsWith('development/') || value.endsWith('.md')) return 'documentation';
  if ((value.includes('/fixtures/') || /fixture/i.test(path.basename(value))) && /(?:bad|blocked|invalid|missing|negative|unknown|unsupported)/iu.test(value + ' ' + lowerContext)) {
    return 'negative-fixture';
  }
  if (value.includes('/fixtures/') || /fixture/i.test(path.basename(value))) return 'fixture';
  if (value.startsWith('tests/')) return 'assertion';
  if (/(?:const|let|var)\s+[A-Z0-9_$]*(?:SCHEMA|CONTRACT)[A-Z0-9_$]*\s*=/u.test(context) || /\$id\s*['"]?\s*:/u.test(context)) return 'definition';
  if (/\b(?:schema|schemaId|contractId|reportSchema)\s*['"]?\s*:/u.test(context)) return 'producer';
  if (value === 'package.json' || value.endsWith('/package.json') || /manifest\.json$/u.test(value)) return 'metadata';
  return 'reference';
}

function symbolFromContext(context) {
  const source = String(context || '');
  const matches = Array.from(source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*['"][^'"\n]+['"]/g));
  return matches.length ? matches[matches.length - 1][1] : null;
}

function lineContext(source, index, radius = 240) {
  const start = Math.max(0, source.lastIndexOf('\n', Math.max(0, index - radius)) + 1);
  const endIndex = source.indexOf('\n', index + radius);
  const end = endIndex < 0 ? source.length : endIndex;
  return source.slice(start, end);
}

function makeOccurrence(relativePath, context, generated, overrides = {}) {
  const role = overrides.role || roleForOccurrence(relativePath, context, generated);
  const sourceContext = String(context || '');
  const contextKinds = [];
  if (/\b(?:emit|emits|emitted|event|eventName|eventType|dispatch|dispatched|eventCoverage)\b/iu.test(sourceContext)) contextKinds.push('event');
  return {
    path: toPosixPath(relativePath),
    application: overrides.application || applicationForPath(relativePath),
    role,
    visibility: overrides.visibility || visibilityForPath(relativePath, generated),
    generated: Boolean(generated),
    symbol: Object.prototype.hasOwnProperty.call(overrides, 'symbol') ? overrides.symbol : symbolFromContext(context),
    contextKinds
  };
}

function occurrenceKey(occurrence) {
  return [
    occurrence.path,
    occurrence.application,
    occurrence.role,
    occurrence.visibility,
    occurrence.symbol || '',
    uniqueSorted(occurrence.contextKinds || []).join('|')
  ].join('\0');
}

function addOccurrence(record, occurrence) {
  const key = occurrenceKey(occurrence);
  if (!record.occurrenceKeys.has(key)) {
    record.occurrenceKeys.add(key);
    record.occurrences.push(occurrence);
  }
}

function recordFor(records, schemaId) {
  if (!records.has(schemaId)) {
    records.set(schemaId, {
      schemaId,
      occurrenceKeys: new Set(),
      occurrences: [],
      shapes: [],
      formalJsonSchema: false,
      formalJsonSchemaPaths: []
    });
  }
  return records.get(schemaId);
}

function constantsByIdentifier(source) {
  const bySymbol = new Map();
  const byId = new Map();
  const patterns = [
    /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(['"])([^'"\n]+)\2/g,
    /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(['"])([^'"\n]+)\2/g
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(source))) {
      if (!VERSIONED_IDENTIFIER_EXACT_PATTERN.test(match[3])) continue;
      bySymbol.set(match[1], match[3]);
      if (!byId.has(match[3])) byId.set(match[3], []);
      byId.get(match[3]).push(match[1]);
    }
  });
  return { bySymbol, byId };
}

function typeSignature(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return '[' + value.map(typeSignature).join(',') + ']';
  if (!value || typeof value !== 'object') return String(value);
  if (Object.prototype.hasOwnProperty.call(value, 'literal')) return 'literal<' + JSON.stringify(value.literal) + '>';
  if (value.array) return 'array<' + value.array.map(typeSignature).join('|') + '>';
  if (value.elementType) return 'array<' + typeSignature(value.elementType) + '>';
  if (value.tuple) return 'tuple<' + value.tuple.map((entry) => typeSignature(entry.type || entry)).join(',') + '>';
  if (value.union) return 'union<' + value.union.map(typeSignature).join('|') + '>';
  if (value.intersection) return 'intersection<' + value.intersection.map(typeSignature).join('&') + '>';
  if (value.reference) return 'ref<' + value.reference + (value.arguments ? ':' + value.arguments.map(typeSignature).join(',') : '') + '>';
  if (value.fields) {
    return '{' + Object.keys(value.fields).sort(compareStrings).map((name) => {
      const field = value.fields[name];
      return name + (field.optional ? '?' : '') + ':' + typeSignature(field.type);
    }).join(',') + '}';
  }
  return JSON.stringify(stableValue(value));
}

function summarizeShape(shape) {
  if (!shape || !shape.fields || Array.isArray(shape.fields)) return shape;
  const fields = Object.keys(shape.fields).sort(compareStrings);
  return {
    fieldCount: fields.length,
    fields,
    signature: fields.map((name) => {
      const field = shape.fields[name];
      return name + (field.optional ? '?' : '') + ':' + typeSignature(field.type);
    }).join('|'),
    normalized: stableValue(shape)
  };
}

function shapeIsComplete(value, seen = new Set()) {
  if (value === 'unknown' || value === 'any' || value === 'unresolved') return false;
  if (!value || typeof value !== 'object') return true;
  if (seen.has(value)) return false;
  seen.add(value);
  if (value.unresolved || value.unresolvedReference || value.unresolvedSpreads || value.partial) return false;
  return Object.keys(value).every((key) => shapeIsComplete(value[key], seen));
}

function evidenceTypeFor(relativePath, generated, declared = false, formal = false) {
  if (generated || isGeneratedPath(relativePath)) return 'generated';
  const visibility = visibilityForPath(relativePath, false);
  if (visibility === 'docs') return 'docs';
  if (visibility === 'test' || visibility === 'fixture') return 'test';
  if (formal) return 'formal-schema';
  if (declared) return 'declared-type';
  return 'runtime-observation';
}

function addShape(record, shape, relativePath, symbol, evidenceOptions = {}) {
  if (!shape || !shape.fields || Object.keys(shape.fields).length === 0) return;
  const normalized = stableValue(shape);
  const persistedShape = summarizeShape(normalized);
  const completeness = shapeIsComplete(normalized) ? 'complete' : 'partial';
  const evidenceType = evidenceTypeFor(
    relativePath,
    Boolean(evidenceOptions.generated),
    Boolean(evidenceOptions.declared),
    Boolean(evidenceOptions.formal)
  );
  const authoritative = completeness === 'complete' && (evidenceType === 'formal-schema' || evidenceType === 'declared-type');
  record.shapes.push({
    hash: 'sha256:' + sha256(stableValue(persistedShape)),
    shape: persistedShape,
    path: toPosixPath(relativePath),
    symbol: symbol || null,
    evidenceType,
    completeness,
    authoritative
  });
}

function tsPropertyName(node, sourceFile) {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    return String(node.text);
  }
  if (ts.isComputedPropertyName(node) && ts.isStringLiteralLike(node.expression)) return node.expression.text;
  try {
    return node.getText(sourceFile).replace(/^(?:['"]|\[\s*['"])/u, '').replace(/(?:['"]|['"]\s*\])$/u, '');
  } catch (error) {
    return null;
  }
}

function normalizedCollection(values) {
  const byValue = new Map();
  (values || []).forEach((value) => byValue.set(JSON.stringify(stableValue(value)), stableValue(value)));
  return Array.from(byValue.entries()).sort((left, right) => compareStrings(left[0], right[0])).map((entry) => entry[1]);
}

function mergeNormalizedObjectShapes(shapes) {
  const fields = {};
  const indexSignatures = [];
  const unresolvedSpreads = [];
  (shapes || []).forEach((shape) => {
    if (!shape || !shape.fields) {
      unresolvedSpreads.push(stableValue(shape || { unresolved: true }));
      return;
    }
    Object.keys(shape.fields).forEach((name) => {
      const incoming = shape.fields[name];
      if (!fields[name]) fields[name] = incoming;
      else if (!stableEqual(fields[name], incoming)) {
        fields[name] = {
          optional: Boolean(fields[name].optional || incoming.optional),
          type: { union: normalizedCollection([fields[name].type, incoming.type]) }
        };
      }
    });
    if (Array.isArray(shape.indexSignatures)) indexSignatures.push(...shape.indexSignatures);
    if (Array.isArray(shape.unresolvedSpreads)) unresolvedSpreads.push(...shape.unresolvedSpreads);
  });
  const result = { fields: stableValue(fields) };
  if (indexSignatures.length > 0) result.indexSignatures = normalizedCollection(indexSignatures);
  if (unresolvedSpreads.length > 0) result.unresolvedSpreads = normalizedCollection(unresolvedSpreads);
  return result;
}

function normalizeTsType(node, sourceFile, context = {}, stack = new Set(), substitutions = new Map()) {
  if (!node) return 'unknown';
  if (ts.isJSDocTypeExpression(node)) return normalizeTsType(node.type, sourceFile, context, stack, substitutions);
  if (node.kind === ts.SyntaxKind.StringKeyword) return 'string';
  if (node.kind === ts.SyntaxKind.NumberKeyword) return 'number';
  if (node.kind === ts.SyntaxKind.BigIntKeyword) return 'bigint';
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return 'boolean';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'null';
  if (node.kind === ts.SyntaxKind.VoidKeyword || node.kind === ts.SyntaxKind.UndefinedKeyword) return 'undefined';
  if (node.kind === ts.SyntaxKind.AnyKeyword) return 'any';
  if (node.kind === ts.SyntaxKind.UnknownKeyword) return 'unknown';
  if (node.kind === ts.SyntaxKind.NeverKeyword) return 'never';
  if (node.kind === ts.SyntaxKind.ObjectKeyword) return 'object';
  if (ts.isLiteralTypeNode(node)) {
    if (ts.isStringLiteralLike(node.literal) || ts.isNoSubstitutionTemplateLiteral(node.literal)) return { literal: node.literal.text };
    if (ts.isNumericLiteral(node.literal)) return { literal: Number(node.literal.text) };
    if (ts.isBigIntLiteral(node.literal)) return { literal: node.literal.text, literalType: 'bigint' };
    if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return { literal: true };
    if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return { literal: false };
    if (node.literal.kind === ts.SyntaxKind.NullKeyword) return { literal: null };
  }
  if (ts.isArrayTypeNode(node)) return { elementType: normalizeTsType(node.elementType, sourceFile, context, stack, substitutions) };
  if (ts.isTupleTypeNode(node)) {
    return {
      tuple: node.elements.map((element) => {
        let current = element;
        let optional = false;
        let rest = false;
        let name = null;
        if (ts.isNamedTupleMember(current)) {
          name = current.name.getText(sourceFile);
          optional = Boolean(current.questionToken);
          rest = Boolean(current.dotDotDotToken);
          current = current.type;
        } else if (ts.isOptionalTypeNode(current)) {
          optional = true;
          current = current.type;
        } else if (ts.isRestTypeNode(current)) {
          rest = true;
          current = current.type;
        }
        return { name, optional, rest, type: normalizeTsType(current, sourceFile, context, stack, substitutions) };
      })
    };
  }
  if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node)) return 'function';
  if (ts.isParenthesizedTypeNode(node) || ts.isOptionalTypeNode(node) || ts.isRestTypeNode(node)) {
    return normalizeTsType(node.type, sourceFile, context, stack, substitutions);
  }
  if (ts.isUnionTypeNode(node)) {
    return { union: normalizedCollection(node.types.map((typeNode) => normalizeTsType(typeNode, sourceFile, context, stack, substitutions))) };
  }
  if (ts.isIntersectionTypeNode(node)) {
    const parts = node.types.map((typeNode) => normalizeTsType(typeNode, sourceFile, context, stack, substitutions));
    if (parts.every((part) => part && part.fields)) return mergeNormalizedObjectShapes(parts);
    return { intersection: normalizedCollection(parts) };
  }
  if (ts.isTypeLiteralNode(node) || ts.isMappedTypeNode(node)) return normalizeTsMembers(node.members || [], sourceFile, context, stack, substitutions);
  if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
    const name = ts.isTypeReferenceNode(node) ? node.typeName.getText(sourceFile) : node.expression.getText(sourceFile);
    if (substitutions.has(name)) return substitutions.get(name);
    const typeArguments = Array.from(node.typeArguments || []).map((argument) => normalizeTsType(argument, sourceFile, context, stack, substitutions));
    if (name === 'Array' || name === 'ReadonlyArray') return { elementType: typeArguments[0] || 'unknown' };
    if (name === 'Record') return { record: { key: typeArguments[0] || 'unknown', value: typeArguments[1] || 'unknown' } };
    if (name === 'Map' || name === 'ReadonlyMap' || name === 'Set' || name === 'ReadonlySet') return { collection: name, arguments: typeArguments };
    if (name === 'Date') return 'timestamp';
    const declaration = context.typeDeclarations && context.typeDeclarations.get(name);
    if (!declaration || stack.has(name)) return { unresolvedReference: name, arguments: typeArguments };
    const nextStack = new Set(stack);
    nextStack.add(name);
    const nextSubstitutions = new Map(substitutions);
    Array.from(declaration.typeParameters || []).forEach((parameter, index) => {
      nextSubstitutions.set(parameter.name.text, typeArguments[index]
        || (parameter.default ? normalizeTsType(parameter.default, sourceFile, context, nextStack, nextSubstitutions) : 'unknown'));
    });
    if (ts.isInterfaceDeclaration(declaration)) {
      const own = normalizeTsMembers(declaration.members, sourceFile, context, nextStack, nextSubstitutions);
      const inherited = Array.from(declaration.heritageClauses || []).flatMap((clause) => Array.from(clause.types || []))
        .map((heritage) => normalizeTsType(heritage, sourceFile, context, nextStack, nextSubstitutions));
      return mergeNormalizedObjectShapes([...inherited, own]);
    }
    if (ts.isTypeAliasDeclaration(declaration)) return normalizeTsType(declaration.type, sourceFile, context, nextStack, nextSubstitutions);
    if (ts.isEnumDeclaration(declaration)) {
      return {
        enum: declaration.members.map((member, index) => {
          if (!member.initializer) return index;
          if (ts.isStringLiteralLike(member.initializer)) return member.initializer.text;
          if (ts.isNumericLiteral(member.initializer)) return Number(member.initializer.text);
          return { unresolved: member.initializer.getText(sourceFile) };
        })
      };
    }
    return { unresolvedReference: name, arguments: typeArguments };
  }
  if (ts.isTypeOperatorNode(node)) return normalizeTsType(node.type, sourceFile, context, stack, substitutions);
  if (ts.isTypeQueryNode(node)) return { unresolvedReference: 'typeof ' + node.exprName.getText(sourceFile) };
  if (ts.isIndexedAccessTypeNode(node)) return {
    indexedAccess: {
      object: normalizeTsType(node.objectType, sourceFile, context, stack, substitutions),
      index: normalizeTsType(node.indexType, sourceFile, context, stack, substitutions)
    }
  };
  if (ts.isTypePredicateNode(node)) return 'boolean';
  return { unresolved: node.getText(sourceFile) };
}

function normalizeTsExpression(node, sourceFile, context = {}, stack = new Set()) {
  if (!node) return 'unknown';
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) {
    return normalizeTsExpression(node.expression, sourceFile, context, stack);
  }
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) return 'string';
  if (ts.isNumericLiteral(node) || ts.isBigIntLiteral(node)) return 'number';
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return 'boolean';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'null';
  if (ts.isArrayLiteralExpression(node)) {
    return {
      array: normalizedCollection(node.elements.map((element) => normalizeTsExpression(element, sourceFile, context, stack)))
    };
  }
  if (ts.isObjectLiteralExpression(node)) return normalizeTsObject(node, sourceFile, context, stack);
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isClassExpression(node)) return 'function';
  if (ts.isConditionalExpression(node)) {
    return {
      union: uniqueSorted([
        normalizeTsExpression(node.whenTrue, sourceFile, context, stack),
        normalizeTsExpression(node.whenFalse, sourceFile, context, stack)
      ])
    };
  }
  if (ts.isCallExpression(node)) {
    const target = node.expression.getText(sourceFile);
    if (/^(?:String|Number|Boolean|Array|Object)$/u.test(target)) return target.toLowerCase();
    if (/^(?:Date\.now|performance\.now)$/u.test(target)) return 'timestamp';
    return 'unknown';
  }
  if (ts.isNewExpression(node)) {
    const target = node.expression.getText(sourceFile);
    if (/^(?:Map|Set|WeakMap|WeakSet)$/u.test(target)) return 'collection';
    if (target === 'Date') return 'timestamp';
    return 'unknown';
  }
  if (ts.isIdentifier(node)) {
    if (stack.has(node.text)) return { unresolvedReference: node.text };
    const declaration = context.valueDeclarations && context.valueDeclarations.get(node.text);
    if (declaration && declaration.initializer) {
      const nextStack = new Set(stack);
      nextStack.add(node.text);
      return normalizeTsExpression(declaration.initializer, sourceFile, context, nextStack);
    }
    return { unresolvedReference: node.text };
  }
  return { unresolved: node.getText(sourceFile) };
}

function normalizeTsMembers(members, sourceFile, context = {}, stack = new Set(), substitutions = new Map()) {
  const fields = {};
  const indexSignatures = [];
  Array.from(members || []).forEach((member) => {
    if (ts.isIndexSignatureDeclaration(member)) {
      const parameter = member.parameters && member.parameters[0];
      indexSignatures.push({
        key: parameter && parameter.type ? normalizeTsType(parameter.type, sourceFile, context, stack, substitutions) : 'unknown',
        value: normalizeTsType(member.type, sourceFile, context, stack, substitutions),
        readonly: Array.from(member.modifiers || []).some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword)
      });
      return;
    }
    if (ts.isCallSignatureDeclaration(member) || ts.isConstructSignatureDeclaration(member)) return;
    const name = tsPropertyName(member.name, sourceFile);
    if (!name || SHAPE_IGNORED_FIELDS.has(name)) return;
    if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
      fields[name] = { optional: Boolean(member.questionToken), type: 'function' };
      return;
    }
    if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
      fields[name] = {
        optional: Boolean(member.questionToken),
        type: member.type
          ? normalizeTsType(member.type, sourceFile, context, stack, substitutions)
          : normalizeTsExpression(member.initializer, sourceFile, context, stack)
      };
    }
  });
  const result = { fields: stableValue(fields) };
  if (indexSignatures.length > 0) result.indexSignatures = normalizedCollection(indexSignatures);
  return result;
}

function normalizeTsObject(node, sourceFile, context = {}, stack = new Set()) {
  const fields = {};
  const unresolvedSpreads = [];
  node.properties.forEach((property) => {
    if (ts.isSpreadAssignment(property)) {
      const spread = normalizeTsExpression(property.expression, sourceFile, context, stack);
      if (spread && spread.fields) Object.assign(fields, spread.fields);
      else unresolvedSpreads.push(spread);
      return;
    }
    const name = tsPropertyName(property.name, sourceFile);
    if (!name || SHAPE_IGNORED_FIELDS.has(name)) return;
    if (ts.isPropertyAssignment(property)) {
      fields[name] = { optional: false, type: normalizeTsExpression(property.initializer, sourceFile, context, stack) };
    } else if (ts.isShorthandPropertyAssignment(property)) {
      fields[name] = { optional: false, type: normalizeTsExpression(property.name, sourceFile, context, stack) };
    } else if (ts.isMethodDeclaration(property) || ts.isGetAccessorDeclaration(property) || ts.isSetAccessorDeclaration(property)) {
      fields[name] = { optional: Boolean(property.questionToken), type: 'function' };
    }
  });
  const result = { fields: stableValue(fields) };
  if (unresolvedSpreads.length > 0) result.unresolvedSpreads = normalizedCollection(unresolvedSpreads);
  return result;
}

function schemaIdFromExpression(node, constants) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return VERSIONED_IDENTIFIER_EXACT_PATTERN.test(node.text) ? node.text : null;
  }
  if (ts.isIdentifier(node)) return constants.bySymbol.get(node.text) || null;
  return null;
}

function schemaIdFromType(node, constants) {
  if (!node) return null;
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteralLike(node.literal)) {
    return VERSIONED_IDENTIFIER_EXACT_PATTERN.test(node.literal.text) ? node.literal.text : null;
  }
  if (ts.isTypeQueryNode(node)) return constants.bySymbol.get(node.exprName.getText()) || null;
  return null;
}

function schemaIdFromMembers(members, constants, sourceFile) {
  for (const member of Array.from(members || [])) {
    const name = tsPropertyName(member.name, sourceFile);
    if (name !== 'schema') continue;
    const schemaId = schemaIdFromType(member.type, constants) || schemaIdFromExpression(member.initializer, constants);
    if (schemaId) return schemaId;
  }
  return null;
}

function schemaIdFromObject(node, constants, sourceFile) {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || tsPropertyName(property.name, sourceFile) !== 'schema') continue;
    const schemaId = schemaIdFromExpression(property.initializer, constants);
    if (schemaId) return schemaId;
  }
  return null;
}

function nearestAstSymbol(node, sourceFile) {
  let current = node;
  while (current) {
    if ((ts.isVariableDeclaration(current) || ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current)
      || ts.isInterfaceDeclaration(current) || ts.isTypeAliasDeclaration(current) || ts.isClassDeclaration(current)) && current.name) {
      return current.name.getText(sourceFile);
    }
    current = current.parent;
  }
  return null;
}

function typeLiteralParts(node) {
  if (!node) return [];
  if (ts.isTypeLiteralNode(node)) return [node];
  if (ts.isIntersectionTypeNode(node)) return node.types.flatMap(typeLiteralParts);
  if (ts.isParenthesizedTypeNode(node)) return typeLiteralParts(node.type);
  return [];
}

function jsDocDeclaredType(node) {
  if (typeof ts.getJSDocType !== 'function') return null;
  let current = node;
  for (let depth = 0; current && depth < 3; depth += 1, current = current.parent) {
    const declared = ts.getJSDocType(current);
    if (declared) return declared;
  }
  return null;
}

function extractCodeShapes(file, records) {
  if (!/\.(?:cjs|d\.ts|js|mjs|ts)$/u.test(file.path)) return;
  const source = file.text;
  const constants = constantsByIdentifier(source);
  const scriptKind = file.path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const sourceFile = ts.createSourceFile(file.path, source, ts.ScriptTarget.Latest, true, scriptKind);
  const context = { typeDeclarations: new Map(), valueDeclarations: new Map() };
  function indexDeclarations(node) {
    if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) && node.name) {
      context.typeDeclarations.set(node.name.text, node);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) context.valueDeclarations.set(node.name.text, node);
    ts.forEachChild(node, indexDeclarations);
  }
  indexDeclarations(sourceFile);
  const seen = new Set();
  function recordShape(schemaId, shape, node, typeSyntax, evidenceSymbol = null) {
    if (!schemaId || !VERSIONED_IDENTIFIER_EXACT_PATTERN.test(schemaId)) return;
    const shapeKey = schemaId + '\0' + node.pos + '\0' + node.end + '\0' + (typeSyntax ? 'declared' : 'runtime');
    if (seen.has(shapeKey)) return;
    seen.add(shapeKey);
    const symbol = evidenceSymbol || nearestAstSymbol(node, sourceFile);
    const record = recordFor(records, schemaId);
    addShape(record, shape, file.path, symbol, { generated: file.generated, declared: typeSyntax });
    addOccurrence(record, makeOccurrence(file.path, lineContext(source, node.getStart(sourceFile)), file.generated, {
      role: file.generated ? 'generated-mirror' : typeSyntax ? 'definition' : 'producer',
      symbol
    }));
  }
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const schemaId = schemaIdFromObject(node, constants, sourceFile);
      recordShape(schemaId, normalizeTsObject(node, sourceFile, context), node, false);
      const declaration = ts.isVariableDeclaration(node.parent) ? node.parent : null;
      let declaredType = declaration && declaration.type;
      if (!declaredType && declaration) declaredType = jsDocDeclaredType(declaration);
      if (schemaId && declaredType) {
        recordShape(schemaId, normalizeTsType(declaredType, sourceFile, context), node, true, nearestAstSymbol(declaration, sourceFile));
      }
    } else if (ts.isInterfaceDeclaration(node)) {
      const own = normalizeTsMembers(node.members, sourceFile, context, new Set([node.name.text]));
      const inherited = Array.from(node.heritageClauses || []).flatMap((clause) => Array.from(clause.types || []))
        .map((heritage) => normalizeTsType(heritage, sourceFile, context, new Set([node.name.text])));
      recordShape(schemaIdFromMembers(node.members, constants, sourceFile), mergeNormalizedObjectShapes([...inherited, own]), node, true);
    } else if (ts.isTypeAliasDeclaration(node)) {
      const parts = typeLiteralParts(node.type);
      if (parts.length > 0) {
        const members = parts.flatMap((part) => Array.from(part.members));
        recordShape(schemaIdFromMembers(members, constants, sourceFile), normalizeTsType(node.type, sourceFile, context, new Set([node.name.text])), node, true);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  constants.byId.forEach((symbols, schemaId) => {
    const record = recordFor(records, schemaId);
    symbols.forEach((symbol) => addOccurrence(record, makeOccurrence(file.path, symbol + ' schema contract constant', file.generated, {
      role: file.generated ? 'generated-mirror' : 'definition',
      symbol
    })));
  });
}

function normalizedJsonValue(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return { array: uniqueSorted(value.map(normalizedJsonValue).map((entry) => JSON.stringify(entry))).map((entry) => JSON.parse(entry)) };
  }
  if (typeof value === 'object') {
    const fields = {};
    Object.keys(value).sort(compareStrings).forEach((key) => {
      if (SHAPE_IGNORED_FIELDS.has(key)) return;
      fields[key] = { optional: false, type: normalizedJsonValue(value[key]) };
    });
    return { fields };
  }
  return typeof value;
}

function jsonSchemaSignature(value) {
  function normalizeSchema(schema) {
    if (typeof schema === 'boolean') return schema;
    if (Array.isArray(schema)) return schema.map(normalizeSchema);
    if (!schema || typeof schema !== 'object') return schema;
    const result = {};
    Object.keys(schema).sort(compareStrings).forEach((key) => {
      if (JSON_SCHEMA_ANNOTATION_KEYWORDS.has(key)) return;
      const child = schema[key];
      if (['allOf', 'anyOf', 'enum', 'oneOf', 'required', 'type'].includes(key)) {
        result[key] = Array.isArray(child)
          ? child.map(normalizeSchema).sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)))
          : normalizeSchema(child);
        return;
      }
      if (key === 'dependentRequired' && child && typeof child === 'object' && !Array.isArray(child)) {
        result[key] = Object.keys(child).sort(compareStrings).reduce((accumulator, dependency) => {
          accumulator[dependency] = Array.isArray(child[dependency]) ? child[dependency].slice().sort(compareStrings) : normalizeSchema(child[dependency]);
          return accumulator;
        }, {});
        return;
      }
      result[key] = normalizeSchema(child);
    });
    return result;
  }
  return stableValue(normalizeSchema(value));
}

function extractJsonShapes(file, records, excludedCandidates) {
  if (!/\.(?:json|rmt)$/u.test(file.path)) return;
  let parsed;
  try {
    parsed = JSON.parse(file.text);
  } catch (error) {
    return;
  }
  if (parsed && typeof parsed === 'object' && typeof parsed.$id === 'string') {
    const record = recordFor(records, parsed.$id);
    record.formalJsonSchema = true;
    record.formalJsonSchemaPaths.push(file.path);
    addOccurrence(record, makeOccurrence(file.path, '$id: ' + parsed.$id, file.generated, {
      role: file.generated ? 'generated-mirror' : 'definition',
      symbol: null
    }));
    const normalizedSchema = jsonSchemaSignature(parsed);
    const shape = {
      fields: {
        '$formalSchema': { optional: false, type: normalizedSchema }
      },
      formalSchema: normalizedSchema
    };
    addShape(record, shape, file.path, null, { generated: file.generated, formal: true });
    if (typeof parsed.$schema === 'string') {
      excludedCandidates.push({
        identifier: parsed.$schema,
        reason: 'External JSON Schema dialect URI; it selects a validator dialect and is not an XTend schema entity.',
        evidencePaths: [file.path]
      });
    }
  }
  function visit(value, pointer) {
    if (!value || typeof value !== 'object') return;
    if (!Array.isArray(value) && typeof value.schema === 'string' && VERSIONED_IDENTIFIER_EXACT_PATTERN.test(value.schema)) {
      const record = recordFor(records, value.schema);
      addShape(record, normalizedJsonValue(value), file.path, pointer || '/', { generated: file.generated });
      addOccurrence(record, makeOccurrence(file.path, 'schema: ' + value.schema, file.generated, {
        role: file.generated ? 'generated-mirror' : roleForOccurrence(file.path, value.schema, file.generated),
        symbol: pointer || '/'
      }));
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, pointer + '/' + index));
    } else {
      Object.keys(value).forEach((key) => visit(value[key], pointer + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1')));
    }
  }
  visit(parsed, '');
}

function collectBroadIdentifiers(file, records) {
  const pattern = new RegExp(VERSIONED_IDENTIFIER_PATTERN.source, 'g');
  let match;
  while ((match = pattern.exec(file.text))) {
    const schemaId = match[1];
    const context = lineContext(file.text, match.index);
    const lineStart = file.text.lastIndexOf('\n', match.index) + 1;
    const lineEndIndex = file.text.indexOf('\n', match.index);
    const exactLine = file.text.slice(lineStart, lineEndIndex < 0 ? file.text.length : lineEndIndex);
    const record = recordFor(records, schemaId);
    addOccurrence(record, makeOccurrence(file.path, context, file.generated, {
      symbol: symbolFromContext(exactLine)
    }));
  }
}

function canonicalScore(occurrence, hasShape) {
  let score = 0;
  if (occurrence.generated) score += 1000;
  score += (VISIBILITY_ORDER[occurrence.visibility] || 0) * 100;
  score += (ROLE_ORDER[occurrence.role] || 0) * 10;
  if (occurrence.path.endsWith('.d.ts')) score += 15;
  if (occurrence.path === 'package.json' || occurrence.path.endsWith('/package.json')) score += 20;
  if (hasShape) score -= 5;
  return score;
}

function definitionTypeFor(record, occurrence) {
  if (record.formalJsonSchema) return 'json-schema';
  if (occurrence.path.endsWith('.d.ts')) return 'typescript-declaration';
  if (occurrence.role === 'definition' && occurrence.symbol) return 'constant';
  if (record.shapes.some((shape) => shape.path === occurrence.path)) return 'object-shape';
  if (occurrence.role === 'metadata') return 'metadata';
  if (occurrence.role === 'documentation') return 'documentation';
  return 'identifier-reference';
}

function selectCanonicalDefinition(record) {
  if (record.formalJsonSchema) {
    const formalPath = uniqueSorted(record.formalJsonSchemaPaths).find((candidate) => !isGeneratedPath(candidate));
    if (!formalPath) return null;
    return {
      path: formalPath,
      symbol: null,
      definitionType: 'json-schema',
      role: 'definition',
      visibility: visibilityForPath(formalPath, isGeneratedPath(formalPath))
    };
  }
  const canonicalOccurrences = record.occurrences.filter((occurrence) => !occurrence.generated);
  if (canonicalOccurrences.length === 0) return null;
  const occurrences = canonicalOccurrences.slice().sort((left, right) => {
    const leftShape = record.shapes.some((shape) => shape.path === left.path);
    const rightShape = record.shapes.some((shape) => shape.path === right.path);
    return canonicalScore(left, leftShape) - canonicalScore(right, rightShape)
      || compareStrings(left.path, right.path)
      || compareStrings(left.symbol || '', right.symbol || '');
  });
  const selected = occurrences[0];
  return {
    path: selected.path,
    symbol: selected.symbol || null,
    definitionType: definitionTypeFor(record, selected),
    role: selected.role,
    visibility: selected.visibility
  };
}

function packageExportMappings(rootDir, files) {
  const mappings = [];
  files.filter((file) => file.path === 'package.json' || file.path.endsWith('/package.json')).forEach((file) => {
    let manifest;
    try {
      manifest = JSON.parse(file.text);
    } catch (error) {
      return;
    }
    if (!manifest || typeof manifest.name !== 'string' || !manifest.exports) return;
    const directory = path.posix.dirname(file.path) === '.' ? '' : path.posix.dirname(file.path);
    function collectTargets(value, targets) {
      if (typeof value === 'string') targets.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach((entry) => collectTargets(entry, targets));
    }
    Object.entries(manifest.exports).forEach(([exportKey, exportValue]) => {
      const targets = [];
      collectTargets(exportValue, targets);
      targets.forEach((target) => {
        const cleanTarget = target.replace(/^\.\//u, '');
        const relativeTarget = toPosixPath(directory ? directory + '/' + cleanTarget : cleanTarget);
        const moduleName = exportKey === '.' ? manifest.name : manifest.name + '/' + exportKey.replace(/^\.\//u, '');
        mappings.push({ target: relativeTarget, module: moduleName });
      });
    });
  });
  return mappings;
}

function exportedModulesForPath(relativePath, mappings) {
  const result = [];
  mappings.forEach((mapping) => {
    if (!mapping.target.includes('*')) {
      if (mapping.target === relativePath) result.push(mapping.module);
      return;
    }
    const escaped = mapping.target.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+)');
    const match = relativePath.match(new RegExp('^' + escaped + '$'));
    if (!match) return;
    let moduleName = mapping.module;
    match.slice(1).forEach((replacement) => {
      moduleName = moduleName.replace('*', replacement);
    });
    result.push(moduleName);
  });
  return uniqueSorted(result);
}

function referenceKey(reference) {
  return JSON.stringify(stableValue(reference));
}

function normalizeInterfaceReference(reference) {
  if (!reference || reference.type !== 'symbol') return reference;
  const symbol = String(reference.symbol || '');
  if (reference.path && /\.(?:json|rmt)$/u.test(reference.path) && symbol.startsWith('/')) {
    return { type: 'json-pointer', path: reference.path, pointer: symbol };
  }
  if (reference.path && /^\$[A-Za-z]?$/u.test(symbol)) {
    return { type: 'repo-symbol', path: reference.path, symbol: null };
  }
  return reference;
}

function uniqueReferences(references) {
  const byKey = new Map();
  references.map(normalizeInterfaceReference).forEach((reference) => byKey.set(referenceKey(reference), reference));
  return Array.from(byKey.values()).sort((left, right) => compareStrings(referenceKey(left), referenceKey(right)));
}

function buildUsages(record, exportMappings) {
  const groups = new Map();
  record.occurrences.forEach((occurrence) => {
    const key = [occurrence.application, occurrence.role, occurrence.visibility].join('\0');
    if (!groups.has(key)) {
      groups.set(key, {
        application: occurrence.application,
        role: occurrence.role,
        visibility: occurrence.visibility,
        sourcePaths: [],
        interfaceReferences: [],
        symbols: []
      });
    }
    const group = groups.get(key);
    group.sourcePaths.push(occurrence.path);
    if (occurrence.symbol) group.symbols.push({ path: occurrence.path, symbol: occurrence.symbol });
  });
  return Array.from(groups.values()).map((group) => {
    const references = [];
    uniqueSorted(group.sourcePaths).forEach((sourcePath) => {
      exportedModulesForPath(sourcePath, exportMappings).forEach((moduleName) => {
        references.push({ type: 'package-export', module: moduleName, path: sourcePath });
      });
    });
    group.symbols.forEach((symbol) => {
      if (isGeneratedPath(symbol.path)) {
        references.push({ type: 'repo-symbol', path: symbol.path, symbol: null });
      } else if (symbol.path.endsWith('.json') && String(symbol.symbol).startsWith('/')) {
        references.push({ type: 'json-pointer', path: symbol.path, pointer: symbol.symbol });
      } else {
        references.push({ type: 'symbol', path: symbol.path, symbol: symbol.symbol });
      }
    });
    if (references.length === 0) {
      const primaryPath = uniqueSorted(group.sourcePaths)[0];
      if (primaryPath.endsWith('.json')) references.push({ type: 'json-pointer', path: primaryPath, pointer: '/' });
      else references.push({ type: 'repo-symbol', path: primaryPath, symbol: null });
    }
    return {
      application: group.application,
      role: group.role,
      visibility: group.visibility,
      sourcePaths: uniqueSorted(group.sourcePaths),
      interfaceReferences: uniqueReferences(references)
    };
  }).sort((left, right) => compareStrings(left.application, right.application)
    || (ROLE_ORDER[left.role] || 0) - (ROLE_ORDER[right.role] || 0)
    || compareStrings(left.visibility, right.visibility));
}

function buildShapeFingerprints(record) {
  const byHash = new Map();
  record.shapes.forEach((shapeRecord) => {
    if (!byHash.has(shapeRecord.hash)) {
      byHash.set(shapeRecord.hash, {
        hash: shapeRecord.hash,
        shape: shapeRecord.shape,
        sourcePaths: [],
        symbols: [],
        evidence: []
      });
    }
    const result = byHash.get(shapeRecord.hash);
    result.sourcePaths.push(shapeRecord.path);
    if (shapeRecord.symbol) result.symbols.push(shapeRecord.symbol);
    result.evidence.push({
      type: shapeRecord.evidenceType || 'runtime-observation',
      completeness: shapeRecord.completeness || 'partial',
      authoritative: shapeRecord.authoritative === true,
      path: shapeRecord.path,
      symbol: shapeRecord.symbol || null
    });
  });
  return Array.from(byHash.values()).map((fingerprint) => ({
    ...fingerprint,
    sourcePaths: uniqueSorted(fingerprint.sourcePaths),
    symbols: uniqueSorted(fingerprint.symbols),
    evidence: Array.from(new Map(fingerprint.evidence.map((evidence) => [
      [evidence.type, evidence.completeness, evidence.authoritative, evidence.path, evidence.symbol || ''].join('\0'),
      evidence
    ])).values()).sort((left, right) => compareStrings(left.path, right.path)
      || compareStrings(left.symbol || '', right.symbol || '') || compareStrings(left.type, right.type)),
    evidenceTypes: uniqueSorted(fingerprint.evidence.map((evidence) => evidence.type)),
    completeness: fingerprint.evidence.every((evidence) => evidence.completeness === 'complete') ? 'complete' : 'partial',
    authoritative: fingerprint.evidence.some((evidence) => evidence.authoritative === true)
  })).sort((left, right) => compareStrings(left.hash, right.hash));
}

function descriptionFor(schemaId, kinds, occurrences, canonicalDefinition) {
  if (schemaId === FORMAL_RMT_SCHEMA_ID) return 'Defines the formal JSON Schema for XTendRMT document validation and tooling.';
  const phrase = humanizeIdentifier(schemaId) || schemaId;
  const canonicalOccurrence = canonicalDefinition
    ? occurrences.find((occurrence) => occurrence.path === canonicalDefinition.path && occurrence.symbol === canonicalDefinition.symbol)
      || occurrences.find((occurrence) => occurrence.path === canonicalDefinition.path)
    : null;
  const application = (canonicalOccurrence || occurrences.find((occurrence) => !occurrence.generated) || occurrences[0]).application;
  const withNoun = (noun) => new RegExp('(?:^| )' + noun + '$', 'iu').test(phrase) ? phrase : phrase + ' ' + noun;
  if (kinds.includes('fixture-id')) return 'Identifies the ' + withNoun('fixture') + ' used by ' + application + '.';
  if (kinds.includes('report-id')) return 'Identifies the ' + withNoun('report') + ' payload produced by ' + application + '.';
  if (kinds.includes('contract-id')) return 'Defines the ' + withNoun('contract') + ' used by ' + application + '.';
  if (kinds.includes('policy-id')) return 'Defines the ' + withNoun('policy') + ' applied by ' + application + '.';
  if (kinds.includes('manifest-id')) return 'Identifies the ' + withNoun('manifest') + ' used by ' + application + '.';
  if (kinds.includes('profile-id')) return 'Defines the ' + withNoun('profile') + ' used by ' + application + '.';
  if (kinds.includes('event-id')) return 'Identifies the ' + withNoun('event') + ' payload used by ' + application + '.';
  if (kinds.includes('record-id')) return 'Identifies the ' + withNoun('record') + ' emitted by ' + application + '.';
  if (kinds.includes('diagnostic-id')) return 'Identifies the ' + withNoun('diagnostic') + ' payload emitted by ' + application + '.';
  return 'Identifies the ' + phrase + ' schema used by ' + application + '.';
}

function parseSchemaVersion(schemaId) {
  const formalMatch = String(schemaId || '').match(/^https:\/\/xtendrmt\.dev\/schemas\/rmt(?:\.v([0-9]+))?\.schema\.json$/u);
  if (formalMatch) {
    return {
      familyId: FORMAL_RMT_SCHEMA_FAMILY_ID,
      version: formalMatch[1] ? Number(formalMatch[1]) : 1,
      explicitlyVersioned: Boolean(formalMatch[1]),
      majorOnly: true
    };
  }
  const match = String(schemaId || '').match(/^(.*)\.v([0-9]+)((?:\.[0-9]+)*)$/u);
  if (!match) return { familyId: String(schemaId || ''), version: 1, explicitlyVersioned: false, majorOnly: true };
  return {
    familyId: match[1],
    version: Number(match[2]),
    explicitlyVersioned: true,
    majorOnly: match[3] === ''
  };
}

function authoritativeFingerprintHashes(shapeFingerprints) {
  return uniqueSorted((shapeFingerprints || [])
    .filter((fingerprint) => fingerprint && fingerprint.authoritative === true)
    .map((fingerprint) => fingerprint.hash));
}

function authoritativeFingerprintSetHash(value) {
  const fingerprints = Array.isArray(value) ? value : value && value.shapeFingerprints;
  const hashes = authoritativeFingerprintHashes(fingerprints);
  return hashes.length > 0 ? 'sha256:' + sha256(hashes) : null;
}

function shapePolicyFor(schemaId, shapeFingerprints) {
  const authoritativeFingerprints = authoritativeFingerprintHashes(shapeFingerprints);
  const releasedFingerprintSetHash = authoritativeFingerprintSetHash(shapeFingerprints);
  if (shapeFingerprints.length > 1) {
    return {
      mode: 'review-required',
      acceptedFingerprints: [],
      authoritativeFingerprints,
      releasedFingerprintSetHash,
      rationale: 'Multiple statically observed shapes require an explicit, fingerprint-bound polymorphism decision.'
    };
  }
  if (shapeFingerprints.length === 1) {
    return {
      mode: 'single',
      acceptedFingerprints: [shapeFingerprints[0].hash],
      authoritativeFingerprints,
      releasedFingerprintSetHash,
      rationale: 'One statically comparable shape is currently observed for this identifier.'
    };
  }
  return {
    mode: 'unresolved',
    acceptedFingerprints: [],
    authoritativeFingerprints,
    releasedFingerprintSetHash,
    rationale: 'No statically comparable object or type shape is available; the identifier remains discoverable but is not structurally comparable.'
  };
}

function entryFromRecord(record, exportMappings) {
  const occurrences = record.occurrences.slice().sort((left, right) => compareStrings(occurrenceKey(left), occurrenceKey(right)));
  const kinds = inferKinds(record.schemaId, occurrences, record.formalJsonSchema);
  const shapeFingerprints = buildShapeFingerprints(record);
  const canonicalDefinition = selectCanonicalDefinition(record);
  const version = parseSchemaVersion(record.schemaId);
  const releasedFingerprintSetHash = authoritativeFingerprintSetHash(shapeFingerprints);
  return {
    schemaId: record.schemaId,
    familyId: version.familyId,
    version: version.version,
    kinds,
    status: inferStatus(record.schemaId, occurrences),
    lifecycle: {
      status: 'active',
      rollout: 'complete'
    },
    aliasOf: null,
    replacedBy: null,
    releasedFingerprintSetHash,
    description: descriptionFor(record.schemaId, kinds, occurrences, canonicalDefinition),
    descriptionStatus: 'generated',
    canonicalDefinition,
    usages: buildUsages(record, exportMappings),
    shapePolicy: shapePolicyFor(record.schemaId, shapeFingerprints),
    shapeFingerprints
  };
}

function reviewKey(review) {
  return [review.type, uniqueSorted(review.schemaIds).join('|'), review.fingerprint || ''].join('\0');
}

function dynamicDuplicateReviews(entries) {
  const reviews = [];
  entries.forEach((entry) => {
    if (entry.shapeFingerprints.length > 1) {
      reviews.push({
        reviewId: 'polymorphic-' + sha256(entry.schemaId).slice(0, 12),
        type: 'same-id-multiple-shapes',
        confidence: 'medium',
        status: 'unreviewed',
        origin: 'scanner',
        baselineAccepted: false,
        resolution: null,
        schemaIds: [entry.schemaId],
        rationale: 'Static analysis observes ' + entry.shapeFingerprints.length + ' normalized shapes for this identifier.',
        recommendation: 'Confirm that the variants are intentional before adding another shape.'
      });
    }
  });
  const byFingerprint = new Map();
  entries.forEach((entry) => {
    entry.shapeFingerprints.forEach((fingerprint) => {
      const fieldCount = fingerprint.shape && Number.isFinite(fingerprint.shape.fieldCount)
        ? fingerprint.shape.fieldCount
        : fingerprint.shape && fingerprint.shape.fields
          ? Object.keys(fingerprint.shape.fields).length
          : 0;
      if (fieldCount < 3) return;
      if (!byFingerprint.has(fingerprint.hash)) byFingerprint.set(fingerprint.hash, []);
      byFingerprint.get(fingerprint.hash).push(entry.schemaId);
    });
  });
  byFingerprint.forEach((schemaIds, fingerprint) => {
    const ids = uniqueSorted(schemaIds);
    if (ids.length < 2) return;
    reviews.push({
      reviewId: 'shape-collision-' + fingerprint.replace(/^sha256:/u, '').slice(0, 12),
      type: 'different-id-same-shape',
      confidence: 'medium',
      status: 'unreviewed',
      origin: 'scanner',
      baselineAccepted: false,
      resolution: null,
      schemaIds: ids,
      fingerprint,
      rationale: 'Static analysis found the same normalized field shape under different identifiers.',
      recommendation: 'Review semantic ownership and record aliasOf or a distinct-contract rationale before adding another matching identifier.'
    });
  });
  return reviews;
}

function entryCompleteFingerprintHashes(entry) {
  return uniqueSorted((entry.shapeFingerprints || [])
    .filter((fingerprint) => fingerprint && fingerprint.completeness === 'complete')
    .map((fingerprint) => fingerprint.hash));
}

function auditDuplicateCandidates(entries, consolidations = []) {
  const exactBySet = new Map();
  const completeFingerprintOwners = new Map();
  const incompleteEvidence = [];
  (entries || []).forEach((entry) => {
    const authoritativeHashes = authoritativeFingerprintHashes(entry.shapeFingerprints);
    const completeHashes = entryCompleteFingerprintHashes(entry);
    const fingerprintSetHash = entry.releasedFingerprintSetHash || (authoritativeHashes.length > 0
      ? 'sha256:' + sha256(authoritativeHashes)
      : null);
    if (fingerprintSetHash) {
      if (!exactBySet.has(fingerprintSetHash)) {
        exactBySet.set(fingerprintSetHash, { fingerprintSetHash, fingerprints: [], schemaIds: [] });
      }
      const releasedGroup = exactBySet.get(fingerprintSetHash);
      releasedGroup.fingerprints.push(...authoritativeHashes);
      releasedGroup.schemaIds.push(entry.schemaId);
    }
    completeHashes.forEach((hash) => {
      if (!completeFingerprintOwners.has(hash)) completeFingerprintOwners.set(hash, []);
      completeFingerprintOwners.get(hash).push(entry.schemaId);
    });
    const partialCount = (entry.shapeFingerprints || []).filter((fingerprint) => fingerprint.completeness !== 'complete').length;
    if (authoritativeHashes.length === 0 || partialCount > 0) {
      incompleteEvidence.push({
        schemaId: entry.schemaId,
        authoritativeFingerprintCount: authoritativeHashes.length,
        partialFingerprintCount: partialCount,
        reason: authoritativeHashes.length === 0
          ? 'No complete authoritative formal-schema or declared-type evidence is available.'
          : 'At least one observed fingerprint is partial and cannot support exact consolidation.'
      });
    }
  });
  const exactAuthoritativeGroups = Array.from(exactBySet.values())
    .map((group) => ({
      ...group,
      fingerprints: uniqueSorted(group.fingerprints),
      schemaIds: uniqueSorted(group.schemaIds)
    }))
    .filter((group) => group.schemaIds.length > 1)
    .map((group) => ({
      groupId: 'exact-authoritative-' + group.fingerprintSetHash.replace(/^sha256:/u, '').slice(0, 12),
      ...group,
      decision: (consolidations || []).find((candidate) => candidate.fingerprintSetHash === group.fingerprintSetHash
        && stableEqual(uniqueSorted(candidate.schemaIds || []), group.schemaIds)) && (consolidations || []).find((candidate) => candidate.fingerprintSetHash === group.fingerprintSetHash
        && stableEqual(uniqueSorted(candidate.schemaIds || []), group.schemaIds)).decision || null
    }))
    .sort((left, right) => compareStrings(left.groupId, right.groupId));

  const pairByKey = new Map();
  completeFingerprintOwners.forEach((owners, fingerprint) => {
    const ids = uniqueSorted(owners);
    for (let left = 0; left < ids.length; left += 1) {
      for (let right = left + 1; right < ids.length; right += 1) {
        const key = ids[left] + '\0' + ids[right];
        if (!pairByKey.has(key)) pairByKey.set(key, { schemaIds: [ids[left], ids[right]], sharedFingerprints: [] });
        pairByKey.get(key).sharedFingerprints.push(fingerprint);
      }
    }
  });
  const entryById = new Map((entries || []).map((entry) => [entry.schemaId, entry]));
  const exactPairKeys = new Set();
  exactAuthoritativeGroups.forEach((group) => {
    for (let left = 0; left < group.schemaIds.length; left += 1) {
      for (let right = left + 1; right < group.schemaIds.length; right += 1) exactPairKeys.add(group.schemaIds[left] + '\0' + group.schemaIds[right]);
    }
  });
  const overlaps = Array.from(pairByKey.entries()).filter(([key, pair]) => {
    if (exactPairKeys.has(key)) return false;
    const left = entryCompleteFingerprintHashes(entryById.get(pair.schemaIds[0]) || {});
    const right = entryCompleteFingerprintHashes(entryById.get(pair.schemaIds[1]) || {});
    return !stableEqual(left, right);
  }).map(([key, pair]) => ({
    overlapId: 'shape-overlap-' + sha256(key).slice(0, 12),
    schemaIds: pair.schemaIds,
    sharedFingerprints: uniqueSorted(pair.sharedFingerprints),
    leftFingerprints: entryCompleteFingerprintHashes(entryById.get(pair.schemaIds[0]) || {}),
    rightFingerprints: entryCompleteFingerprintHashes(entryById.get(pair.schemaIds[1]) || {})
  })).sort((left, right) => compareStrings(left.overlapId, right.overlapId));

  const aliasStatus = (entries || []).filter((entry) => typeof entry.aliasOf === 'string' && entry.aliasOf)
    .map((entry) => ({
      schemaId: entry.schemaId,
      aliasOf: entry.aliasOf,
      lifecycle: entry.lifecycle,
      fingerprintMatch: entry.releasedFingerprintSetHash !== null
        && entry.releasedFingerprintSetHash === (entryById.get(entry.aliasOf) || {}).releasedFingerprintSetHash
    })).sort((left, right) => compareStrings(left.schemaId, right.schemaId));
  const versionFamilies = buildSchemaFamilies(entries, null);
  const legacyReferences = aliasStatus.map((alias) => {
    const entry = entryById.get(alias.schemaId);
    const productiveUsages = (entry.usages || []).filter((usage) => ['public', 'internal'].includes(usage.visibility));
    return {
      schemaId: alias.schemaId,
      aliasOf: alias.aliasOf,
      producerPaths: uniqueSorted(productiveUsages.filter((usage) => usage.role === 'producer').flatMap((usage) => usage.sourcePaths || [])),
      consumerPaths: uniqueSorted(productiveUsages.filter((usage) => usage.role === 'consumer').flatMap((usage) => usage.sourcePaths || []))
    };
  });
  return {
    exactAuthoritativeGroups,
    overlaps,
    incompleteEvidence: incompleteEvidence.sort((left, right) => compareStrings(left.schemaId, right.schemaId)),
    aliasStatus,
    versionFamilies,
    legacyReferences,
    summary: {
      exactAuthoritativeGroups: exactAuthoritativeGroups.length,
      overlaps: overlaps.length,
      incompleteEvidence: incompleteEvidence.length,
      aliases: aliasStatus.length,
      legacyProducers: legacyReferences.filter((reference) => reference.producerPaths.length > 0).length,
      legacyConsumers: legacyReferences.filter((reference) => reference.consumerPaths.length > 0).length
    }
  };
}

function consolidationKey(consolidation) {
  return [consolidation.kind, uniqueSorted(consolidation.schemaIds || []).join('|'), consolidation.fingerprintSetHash || ''].join('\0');
}

function dynamicConsolidations(entries, duplicateReviews, duplicateAudit) {
  const result = [];
  (duplicateAudit.exactAuthoritativeGroups || []).forEach((group) => {
    result.push({
      consolidationId: 'consolidation-' + group.fingerprintSetHash.replace(/^sha256:/u, '').slice(0, 12),
      kind: 'exact-authoritative',
      decision: null,
      canonicalSchemaId: null,
      owner: null,
      rationale: 'Complete authoritative fingerprint sets are identical; a domain owner must consolidate or document why the contracts remain distinct.',
      fingerprintSetHash: group.fingerprintSetHash,
      schemaIds: group.schemaIds,
      rolloutStatus: 'planned'
    });
  });
  (duplicateReviews || []).filter((review) => review.type === 'different-id-same-shape').forEach((review) => {
    const entriesById = new Map(entries.map((entry) => [entry.schemaId, entry]));
    const authoritative = review.schemaIds.every((schemaId) => authoritativeFingerprintHashes((entriesById.get(schemaId) || {}).shapeFingerprints).includes(review.fingerprint));
    if (authoritative) return;
    result.push({
      consolidationId: 'insufficient-' + String(review.fingerprint || sha256(review.schemaIds)).replace(/^sha256:/u, '').slice(0, 12),
      kind: 'insufficient-evidence',
      decision: 'defer-insufficient-evidence',
      canonicalSchemaId: null,
      owner: null,
      rationale: 'The observed collision lacks complete authoritative evidence and cannot be auto-consolidated.',
      fingerprintSetHash: review.fingerprint ? 'sha256:' + sha256([review.fingerprint]) : null,
      schemaIds: uniqueSorted(review.schemaIds),
      rolloutStatus: 'planned'
    });
  });
  return result.sort((left, right) => compareStrings(left.consolidationId, right.consolidationId));
}

function mergeConsolidations(dynamic, existing) {
  const byKey = new Map((dynamic || []).map((item) => [consolidationKey(item), item]));
  const dynamicIds = new Set((dynamic || []).map((item) => item.consolidationId));
  (existing || []).forEach((item) => {
    const key = consolidationKey(item);
    const generated = byKey.get(key);
    // Scanner-generated IDs are fingerprint-stable while their member set can
    // evolve. Once a fresh record with the same ID exists, retaining the old
    // member set would create a duplicate consolidation and keep retired
    // schema IDs alive as false compatibility dependencies.
    if (!generated && dynamicIds.has(item.consolidationId)) return;
    // Curated consolidation history is intentionally retained even after all
    // legacy producers disappear; it documents aliases and rollout state.
    byKey.set(key, { ...(generated || {}), ...item, schemaIds: uniqueSorted(item.schemaIds || generated && generated.schemaIds || []) });
  });
  return Array.from(byKey.values()).sort((left, right) => compareStrings(left.consolidationId, right.consolidationId));
}

function mergeReviews(dynamicReviews, existingReviews) {
  const byKey = new Map();
  dynamicReviews.forEach((review) => byKey.set(reviewKey(review), { ...review, schemaIds: uniqueSorted(review.schemaIds) }));
  (existingReviews || []).forEach((review) => {
    const key = reviewKey(review);
    const generated = byKey.get(key);
    if (!generated && /^(?:polymorphic|shape-collision)-/u.test(String(review.reviewId || ''))) return;
    byKey.set(key, {
      ...(generated || {}),
      ...review,
      origin: generated ? 'scanner' : (review.origin || 'curated'),
      schemaIds: uniqueSorted(review.schemaIds)
    });
  });
  return Array.from(byKey.values()).sort((left, right) => compareStrings(left.reviewId, right.reviewId));
}

function mergeExcludedCandidates(candidates) {
  const byKey = new Map();
  candidates.forEach((candidate) => {
    const key = candidate.identifier + '\0' + candidate.reason;
    if (!byKey.has(key)) byKey.set(key, { ...candidate, evidencePaths: [] });
    byKey.get(key).evidencePaths.push(...(candidate.evidencePaths || []));
  });
  return Array.from(byKey.values()).map((candidate) => ({
    ...candidate,
    evidencePaths: uniqueSorted(candidate.evidencePaths)
  })).sort((left, right) => compareStrings(left.identifier, right.identifier));
}

function scanSchemaInventory(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const files = readTrackedTextFiles(rootDir);
  const records = new Map();
  const excludedCandidates = [];
  files.forEach((file) => {
    collectBroadIdentifiers(file, records);
    extractCodeShapes(file, records);
    extractJsonShapes(file, records, excludedCandidates);
  });
  const exportMappings = packageExportMappings(rootDir, files);
  const entries = Array.from(records.values()).filter((record) => record.occurrences.length > 0)
    .map((record) => entryFromRecord(record, exportMappings))
    .sort((left, right) => compareStrings(left.schemaId, right.schemaId));
  const duplicateReviews = mergeReviews(dynamicDuplicateReviews(entries), []);
  const duplicateAudit = auditDuplicateCandidates(entries, []);
  const excluded = mergeExcludedCandidates(excludedCandidates);
  return {
    rootDir,
    files: files.map((file) => file.path),
    entries,
    duplicateReviews,
    duplicateAudit,
    excludedCandidates: excluded,
    stats: {
      trackedTextFiles: files.length,
      schemaIdentifiers: entries.length,
      formalJsonSchemas: entries.filter((entry) => entry.kinds.includes('json-schema')).length,
      comparableSchemas: entries.filter((entry) => entry.shapeFingerprints.length > 0).length,
      duplicateReviews: duplicateReviews.length,
      exactAuthoritativeGroups: duplicateAudit.exactAuthoritativeGroups.length,
      shapeOverlaps: duplicateAudit.overlaps.length,
      excludedCandidates: excluded.length
    }
  };
}

function mergeExistingEntry(generated, existing) {
  if (!existing) return generated;
  const result = { ...generated };
  ['description', 'descriptionStatus', 'familyId', 'version', 'lifecycle', 'aliasOf', 'replacedBy',
    'replacementDecision', 'releasedFingerprintSetHash', 'distinction', 'notes', 'owners'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(existing, field)) result[field] = existing[field];
  });
  if (existing.shapePolicy && typeof existing.shapePolicy.rationale === 'string' && existing.shapePolicy.rationale.trim()) {
    result.shapePolicy.rationale = existing.shapePolicy.rationale.trim();
  }
  if (existing.shapePolicy && (existing.shapePolicy.decision || Array.isArray(existing.shapePolicy.acceptedFingerprints))) {
    result.shapePolicy = { ...generated.shapePolicy, ...existing.shapePolicy };
  }
  // Usages are scan findings by default. Only explicitly curated interface
  // mappings survive regeneration; ordinary paths are rebuilt so removed
  // producers and consumers cannot linger in the governance index.
  const curatedUsages = (Array.isArray(existing.usages) ? existing.usages : [])
    .filter((usage) => usage && usage.curated === true);
  const matchedCurated = new Set();
  result.usages = generated.usages.map((usage) => {
    const previous = curatedUsages.find((candidate) => candidate.application === usage.application
      && candidate.role === usage.role && candidate.visibility === usage.visibility);
    if (!previous) return usage;
    matchedCurated.add(previous);
    return {
      ...usage,
      sourcePaths: uniqueSorted([...(usage.sourcePaths || []), ...(previous.sourcePaths || [])]),
      interfaceReferences: uniqueReferences([...(usage.interfaceReferences || []), ...(previous.interfaceReferences || [])]),
      curated: true
    };
  });
  curatedUsages.filter((usage) => !matchedCurated.has(usage)).forEach((usage) => {
    result.usages.push({
      ...usage,
      sourcePaths: uniqueSorted(usage.sourcePaths || []),
      interfaceReferences: uniqueReferences(usage.interfaceReferences || []),
      curated: true
    });
  });
  result.usages.sort((left, right) => compareStrings(left.application, right.application)
    || (ROLE_ORDER[left.role] || 0) - (ROLE_ORDER[right.role] || 0)
    || compareStrings(left.visibility, right.visibility));
  return result;
}

function defaultEvolutionPolicy() {
  return {
    versioning: 'major-only',
    structuralChangesRequireNewMajor: true,
    annotationChangesRequireNewMajor: false,
    retiredIdsRemainReserved: true,
    legacyReadWindowMinorReleases: 2,
    allowedLifecycleStatuses: Array.from(LIFECYCLE_STATUSES).sort(compareStrings),
    allowedRolloutStatuses: Array.from(ROLLOUT_STATUSES).sort(compareStrings)
  };
}

function buildSchemaFamilies(entries, existingFamilies) {
  const existingById = new Map((Array.isArray(existingFamilies) ? existingFamilies : []).map((family) => [family.familyId, family]));
  const entryGroups = new Map();
  (entries || []).forEach((entry) => {
    if (!entryGroups.has(entry.familyId)) entryGroups.set(entry.familyId, []);
    entryGroups.get(entry.familyId).push(entry);
  });
  // A retirement record is emitted only alongside an observed successor in
  // the same family. This keeps removed one-off identifiers from becoming
  // empty compatibility families while still reserving every migrated major.
  return Array.from(entryGroups.entries()).map(([familyId, familyEntries]) => {
    const previous = existingById.get(familyId) || {};
    const previousVersions = new Map((previous.versions || []).map((version) => [version.schemaId, version]));
    const versions = familyEntries.map((entry) => ({
      ...(previousVersions.get(entry.schemaId) || {}),
      schemaId: entry.schemaId,
      version: entry.version,
      lifecycle: stableValue(entry.lifecycle),
      releasedFingerprintSetHash: entry.releasedFingerprintSetHash
    })).sort((left, right) => left.version - right.version || compareStrings(left.schemaId, right.schemaId));
    const active = versions.filter((version) => version.lifecycle && version.lifecycle.status === 'active');
    const current = active.slice().sort((left, right) => right.version - left.version || compareStrings(left.schemaId, right.schemaId))[0]
      || versions.slice().sort((left, right) => right.version - left.version || compareStrings(left.schemaId, right.schemaId))[0]
      || null;
    const observedVersionIds = new Set(versions.map((version) => version.schemaId));
    const tombstonesById = new Map((Array.isArray(previous.tombstones) ? previous.tombstones : [])
      .map((tombstone) => [tombstone.schemaId, tombstone]));
    (Array.isArray(previous.versions) ? previous.versions : []).forEach((version) => {
      if (!version || typeof version.schemaId !== 'string' || observedVersionIds.has(version.schemaId)) return;
      if (!tombstonesById.has(version.schemaId)) {
        tombstonesById.set(version.schemaId, {
          schemaId: version.schemaId,
          version: version.version,
          rationale: current
            ? `Retired after ${current.schemaId} became the active major schema; the identifier remains reserved.`
            : 'Retired after its last producer was removed; the identifier remains reserved.'
        });
      }
    });
    return {
      ...previous,
      familyId,
      currentVersion: current ? current.version : null,
      activeSchemaId: current ? current.schemaId : null,
      versions,
      tombstones: Array.from(tombstonesById.values())
        .sort((left, right) => left.version - right.version || compareStrings(left.schemaId, right.schemaId))
    };
  }).sort((left, right) => compareStrings(left.familyId, right.familyId));
}

function createInventoryDocument(scan, existingInventory = null) {
  const existingEntries = new Map((existingInventory && Array.isArray(existingInventory.entries) ? existingInventory.entries : [])
    .map((entry) => [entry.schemaId, entry]));
  const entries = scan.entries.map((entry) => mergeExistingEntry(entry, existingEntries.get(entry.schemaId)))
    .sort((left, right) => compareStrings(left.schemaId, right.schemaId));
  const duplicateAudit = auditDuplicateCandidates(entries, existingInventory && existingInventory.consolidations);
  const generatedConsolidations = dynamicConsolidations(entries, scan.duplicateReviews, duplicateAudit);
  const consolidations = mergeConsolidations(generatedConsolidations, existingInventory && existingInventory.consolidations);
  return {
    inventoryVersion: 2,
    evolutionPolicy: {
      ...defaultEvolutionPolicy(),
      ...(existingInventory && existingInventory.evolutionPolicy || {})
    },
    scanPolicy: {
      source: 'git-tracked-text-files',
      versionedIdentifierPattern: VERSIONED_IDENTIFIER_SOURCE,
      canonicalPrecedence: ['runtime-definition', 'public-declaration', 'package-metadata', 'test-or-fixture', 'documentation', 'generated-mirror'],
      generatedPathsAreCanonical: false,
      executesRepositoryModules: false,
      materializedAggregateExcludedPrefixes: Array.from(MATERIALIZED_AGGREGATE_EXCLUDED_PREFIXES),
      selfExcludedPaths: [INVENTORY_PATH, INVENTORY_SUITE_PATH, SCANNER_PATH]
    },
    relatedRegistries: [
      {
        name: 'Native-First Contract Registry',
        relationship: 'governance-subset',
        path: 'development/XTend-Native-First-Contract-Registry.md',
        contractId: 'xtend.native-first.contract-registry.v1'
      }
    ],
    schemaFamilies: buildSchemaFamilies(entries, existingInventory && existingInventory.schemaFamilies),
    consolidations,
    entries,
    duplicateReviews: mergeReviews(scan.duplicateReviews, existingInventory && existingInventory.duplicateReviews),
    excludedCandidates: scan.excludedCandidates
  };
}

function acceptCurrentBaseline(inventory) {
  const entries = Array.isArray(inventory && inventory.entries) ? inventory.entries : [];
  const releasedDrifts = entries.filter((entry) => {
    if (!entry || entry.aliasOf) return false;
    return entry.releasedFingerprintSetHash !== authoritativeFingerprintSetHash(entry.shapeFingerprints);
  });
  if (releasedDrifts.length > 0) {
    const ids = releasedDrifts.map((entry) => entry.schemaId).sort(compareStrings);
    throw new Error(`Cannot accept a governance baseline with released fingerprint drift. Publish a new major schema ID first: ${ids.join(', ')}`);
  }
  entries.forEach((entry) => {
    // Compatibility aliases inherit the canonical released fingerprint set.
    // Recomputing it from alias-only references would erase that binding.
    if (entry.aliasOf) return;
    const hashes = uniqueSorted((entry.shapeFingerprints || []).map((fingerprint) => fingerprint.hash));
    const authoritativeFingerprints = authoritativeFingerprintHashes(entry.shapeFingerprints);
    const releasedFingerprintSetHash = authoritativeFingerprintSetHash(entry.shapeFingerprints);
    entry.descriptionStatus = 'accepted-initial-audit';
    entry.releasedFingerprintSetHash = releasedFingerprintSetHash;
    if (hashes.length > 1) {
      entry.shapePolicy = {
        mode: 'polymorphic',
        decision: 'accepted-initial-audit',
        acceptedFingerprints: hashes,
        authoritativeFingerprints,
        releasedFingerprintSetHash,
        rationale: entry.shapePolicy && entry.shapePolicy.rationale
          ? entry.shapePolicy.rationale
          : `The initial repository audit records ${hashes.length} statically distinct variants; any fingerprint change requires a new decision.`
      };
    } else if (hashes.length === 1) {
      entry.shapePolicy = {
        mode: 'single',
        acceptedFingerprints: hashes,
        authoritativeFingerprints,
        releasedFingerprintSetHash,
        rationale: 'One statically comparable shape is accepted by the initial repository audit.'
      };
    } else {
      entry.shapePolicy = {
        mode: 'unresolved',
        acceptedFingerprints: [],
        authoritativeFingerprints,
        releasedFingerprintSetHash,
        rationale: 'No statically comparable shape is available; identifier and usage drift remain gated.'
      };
    }
  });
  const entriesByFamily = new Map();
  entries.forEach((entry) => {
    if (!entriesByFamily.has(entry.familyId)) entriesByFamily.set(entry.familyId, []);
    entriesByFamily.get(entry.familyId).push(entry);
  });
  entriesByFamily.forEach((familyEntries) => {
    const active = familyEntries.filter((entry) => entry.lifecycle && entry.lifecycle.status === 'active')
      .sort((left, right) => right.version - left.version || compareStrings(left.schemaId, right.schemaId));
    active.slice(1).forEach((entry) => {
      entry.lifecycle = { ...entry.lifecycle, status: 'deprecated', rollout: 'complete' };
    });
  });
  (Array.isArray(inventory && inventory.duplicateReviews) ? inventory.duplicateReviews : []).forEach((review) => {
    review.baselineAccepted = true;
    review.baseline = 'inventory-v2';
    if (review.type === 'same-id-multiple-shapes') {
      review.status = 'accepted-polymorphic-for-inventory';
      review.resolution = {
        kind: 'accepted-polymorphic',
        rationale: 'All observed fingerprints are bound to the entry shapePolicy and remain subject to drift checks.'
      };
    } else {
      review.status = review.status === 'accepted' ? 'accepted' : 'open';
      review.resolution = review.resolution || {
        kind: 'review-case',
        rationale: 'The initial audit retains the identifiers as separate entities and records the collision for domain-owner review; no runtime or API migration is performed here.'
      };
    }
  });
  (Array.isArray(inventory && inventory.consolidations) ? inventory.consolidations : []).forEach((consolidation) => {
    if (consolidation.kind === 'exact-authoritative' && !consolidation.decision) {
      consolidation.decision = 'distinct-contract';
      consolidation.rationale = consolidation.rationale || 'The initial v2 audit keeps these contracts distinct until a domain-specific consolidation is approved.';
    }
    if (consolidation.kind === 'insufficient-evidence') consolidation.decision = 'defer-insufficient-evidence';
  });
  inventory.schemaFamilies = buildSchemaFamilies(entries, inventory.schemaFamilies);
  return inventory;
}

function issue(code, message, metadata = {}) {
  return { code, message, ...metadata };
}

function allUsagePaths(entry) {
  return uniqueSorted((entry.usages || []).flatMap((usage) => usage.sourcePaths || []));
}

function reviewMatchKey(review) {
  return [review.type, uniqueSorted(review.schemaIds || []).join('|'), review.fingerprint || ''].join('\0');
}

function stableEqual(left, right) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function usageMatchKey(usage) {
  return [usage.application, usage.role, usage.visibility].join('\0');
}

function validRepoPath(rootDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) return false;
  const normalized = path.normalize(relativePath);
  return normalized !== '..' && !normalized.startsWith('..' + path.sep) && fs.existsSync(path.join(rootDir, normalized));
}

function referenceHasTarget(reference) {
  if (!reference || typeof reference !== 'object') return false;
  return ['reference', 'target', 'module', 'export', 'exportName', 'symbol', 'member', 'name', 'path', 'pointer', 'command', 'event', 'global']
    .some((field) => typeof reference[field] === 'string' && reference[field].trim()
      || Array.isArray(reference[field]) && reference[field].some((value) => typeof value === 'string' && value.trim()));
}

function validateInventoryDocument(inventory, scan, options = {}) {
  const rootDir = resolveRootDir(options.rootDir || scan && scan.rootDir);
  const errors = [];
  const warnings = [];
  if (!inventory || inventory.inventoryVersion !== 2) errors.push(issue('invalid-version', 'inventoryVersion must equal 2.'));
  const evolutionPolicy = inventory && inventory.evolutionPolicy;
  const expectedEvolutionPolicy = defaultEvolutionPolicy();
  if (!evolutionPolicy || evolutionPolicy.versioning !== 'major-only'
    || evolutionPolicy.structuralChangesRequireNewMajor !== true
    || evolutionPolicy.annotationChangesRequireNewMajor !== false
    || evolutionPolicy.retiredIdsRemainReserved !== true
    || evolutionPolicy.legacyReadWindowMinorReleases !== 2
    || !stableEqual(uniqueSorted(evolutionPolicy.allowedLifecycleStatuses || []), expectedEvolutionPolicy.allowedLifecycleStatuses)
    || !stableEqual(uniqueSorted(evolutionPolicy.allowedRolloutStatuses || []), expectedEvolutionPolicy.allowedRolloutStatuses)) {
    errors.push(issue('invalid-evolution-policy', 'evolutionPolicy must define major-only versioning, immutable retired IDs, and the supported lifecycle/rollout states.'));
  }
  const scanPolicy = inventory && inventory.scanPolicy;
  if (!scanPolicy || scanPolicy.source !== 'git-tracked-text-files'
    || scanPolicy.executesRepositoryModules !== false
    || scanPolicy.generatedPathsAreCanonical !== false
    || !stableEqual(scanPolicy.materializedAggregateExcludedPrefixes, Array.from(MATERIALIZED_AGGREGATE_EXCLUDED_PREFIXES))
    || scanPolicy.versionedIdentifierPattern !== VERSIONED_IDENTIFIER_SOURCE) {
    errors.push(issue('invalid-scan-policy', 'scanPolicy must describe the static tracked-file scanner and generated-mirror boundary.'));
  }
  const relatedRegistries = inventory && Array.isArray(inventory.relatedRegistries) ? inventory.relatedRegistries : [];
  const nativeRegistry = relatedRegistries.find((registry) => registry && registry.relationship === 'governance-subset');
  if (!nativeRegistry || nativeRegistry.contractId !== 'xtend.native-first.contract-registry.v1'
    || !validRepoPath(rootDir, nativeRegistry.path)) {
    errors.push(issue('invalid-related-registry', 'The Native-First Contract Registry must be a resolvable governance subset.'));
  }
  const expectedExcluded = scan && Array.isArray(scan.excludedCandidates) ? scan.excludedCandidates : [];
  const actualExcluded = inventory && Array.isArray(inventory.excludedCandidates) ? inventory.excludedCandidates : [];
  if (!stableEqual(actualExcluded, expectedExcluded)) {
    errors.push(issue('excluded-candidate-drift', 'Documented non-schema candidates differ from the static scan.'));
  }
  const entries = inventory && Array.isArray(inventory.entries) ? inventory.entries : [];
  if (!Array.isArray(inventory && inventory.entries)) errors.push(issue('invalid-entries', 'entries must be an array.'));
  const inventoryById = new Map();
  entries.forEach((entry, index) => {
    if (!entry || typeof entry.schemaId !== 'string' || !entry.schemaId.trim()) {
      errors.push(issue('invalid-schema-id', 'Every entry must have a non-empty schemaId.', { index }));
      return;
    }
    if (inventoryById.has(entry.schemaId)) errors.push(issue('duplicate-schema-id', 'schemaId is duplicated in the inventory.', { schemaId: entry.schemaId }));
    inventoryById.set(entry.schemaId, entry);
    const parsedVersion = parseSchemaVersion(entry.schemaId);
    if (entry.familyId !== parsedVersion.familyId || !Number.isInteger(entry.version) || entry.version !== parsedVersion.version
      || entry.version < 1 || parsedVersion.explicitlyVersioned && parsedVersion.majorOnly !== true) {
      errors.push(issue('invalid-family-version', 'familyId and numeric version must be derived from the major-only schema identifier.', { schemaId: entry.schemaId }));
    }
    if (!entry.lifecycle || !LIFECYCLE_STATUSES.has(entry.lifecycle.status) || !ROLLOUT_STATUSES.has(entry.lifecycle.rollout)) {
      errors.push(issue('invalid-lifecycle', 'Every entry needs a supported lifecycle status and rollout phase.', { schemaId: entry.schemaId }));
    }
    if (!Array.isArray(entry.kinds) || entry.kinds.length === 0) errors.push(issue('missing-kinds', 'Inventory entry has no kinds.', { schemaId: entry.schemaId }));
    if (typeof entry.description !== 'string' || entry.description.trim().length < 12) errors.push(issue('missing-description', 'Inventory entry needs a human-readable description.', { schemaId: entry.schemaId }));
    if (!['accepted-initial-audit', 'curated'].includes(entry.descriptionStatus)) errors.push(issue('unreviewed-description', 'Inventory descriptions must be accepted or curated in the JSON source of truth.', { schemaId: entry.schemaId }));
    if (entry.canonicalDefinition === null) {
      if (entry.status !== 'generated-mirror') errors.push(issue('missing-canonical-definition', 'Only generated-mirror entries may omit a canonical definition.', { schemaId: entry.schemaId }));
    } else if (!entry.canonicalDefinition || typeof entry.canonicalDefinition.path !== 'string') {
      errors.push(issue('missing-canonical-definition', 'Inventory entry has no canonical definition.', { schemaId: entry.schemaId }));
    } else if (!validRepoPath(rootDir, entry.canonicalDefinition.path)) {
      errors.push(issue('missing-canonical-path', 'Canonical definition path does not exist.', { schemaId: entry.schemaId, path: entry.canonicalDefinition.path }));
    } else if (isGeneratedPath(entry.canonicalDefinition.path)) {
      errors.push(issue('generated-canonical', 'Generated mirrors cannot be canonical definitions.', { schemaId: entry.schemaId, path: entry.canonicalDefinition.path }));
    }
    if (!Array.isArray(entry.usages) || entry.usages.length === 0) {
      errors.push(issue('missing-usages', 'Inventory entry has no usages.', { schemaId: entry.schemaId }));
    } else {
      entry.usages.forEach((usage) => {
        if (!usage || typeof usage.application !== 'string' || typeof usage.role !== 'string' || typeof usage.visibility !== 'string') {
          errors.push(issue('invalid-usage', 'Inventory usage classification is incomplete.', { schemaId: entry.schemaId }));
          return;
        }
        (Array.isArray(usage.sourcePaths) ? usage.sourcePaths : []).forEach((sourcePath) => {
          if (!validRepoPath(rootDir, sourcePath)) errors.push(issue('missing-usage-path', 'Inventory usage path does not exist.', { schemaId: entry.schemaId, path: sourcePath }));
        });
        if (!Array.isArray(usage.sourcePaths) || usage.sourcePaths.length === 0) errors.push(issue('missing-usage-paths', 'Inventory usage has no source paths.', { schemaId: entry.schemaId }));
        if (!Array.isArray(usage.interfaceReferences) || usage.interfaceReferences.length === 0) {
          errors.push(issue('missing-interface-reference', 'Inventory usage has no typed interface reference.', { schemaId: entry.schemaId }));
        } else {
          usage.interfaceReferences.forEach((reference) => {
            if (!reference || !INTERFACE_REFERENCE_TYPES.has(reference.type) || !referenceHasTarget(reference)) {
              errors.push(issue('invalid-interface-reference', 'Inventory interface reference is unsupported or unqualified.', { schemaId: entry.schemaId }));
            }
          });
        }
      });
    }
    const fingerprints = Array.isArray(entry.shapeFingerprints) ? entry.shapeFingerprints : [];
    fingerprints.forEach((fingerprint) => {
      if (!fingerprint || !Object.prototype.hasOwnProperty.call(fingerprint, 'shape')) {
        errors.push(issue('invalid-shape-hash', 'Stored shape fingerprint has no normalized shape content.', { schemaId: entry.schemaId }));
        return;
      }
      const expectedHash = 'sha256:' + sha256(stableValue(fingerprint.shape));
      if (fingerprint.hash !== expectedHash) errors.push(issue('invalid-shape-hash', 'Stored shape content does not match its fingerprint hash.', { schemaId: entry.schemaId }));
      const evidence = Array.isArray(fingerprint.evidence) ? fingerprint.evidence : [];
      if (evidence.length === 0 || evidence.some((item) => !item || !EVIDENCE_TYPES.has(item.type)
        || !['complete', 'partial'].includes(item.completeness) || typeof item.authoritative !== 'boolean'
        || item.authoritative && (!['formal-schema', 'declared-type'].includes(item.type) || item.completeness !== 'complete'))) {
        errors.push(issue('invalid-shape-evidence', 'Each fingerprint needs typed completeness evidence; only complete formal or declared types may be authoritative.', { schemaId: entry.schemaId, fingerprint: fingerprint.hash }));
      }
      const expectedAuthoritative = evidence.some((item) => item.authoritative === true);
      const expectedCompleteness = evidence.every((item) => item.completeness === 'complete') ? 'complete' : 'partial';
      if (fingerprint.authoritative !== expectedAuthoritative || fingerprint.completeness !== expectedCompleteness
        || !stableEqual(uniqueSorted(fingerprint.evidenceTypes || []), uniqueSorted(evidence.map((item) => item.type)))) {
        errors.push(issue('shape-evidence-drift', 'Fingerprint evidence summary differs from its provenance records.', { schemaId: entry.schemaId, fingerprint: fingerprint.hash }));
      }
      (Array.isArray(fingerprint && fingerprint.sourcePaths) ? fingerprint.sourcePaths : []).forEach((sourcePath) => {
        if (!validRepoPath(rootDir, sourcePath)) errors.push(issue('missing-shape-source', 'Shape provenance path does not exist.', { schemaId: entry.schemaId, path: sourcePath }));
      });
    });
    const hashes = uniqueSorted(fingerprints.map((fingerprint) => fingerprint && fingerprint.hash).filter(Boolean));
    const policy = entry.shapePolicy;
    const accepted = uniqueSorted(policy && Array.isArray(policy.acceptedFingerprints) ? policy.acceptedFingerprints : []);
    const authoritative = authoritativeFingerprintHashes(fingerprints);
    const currentReleasedHash = authoritativeFingerprintSetHash(fingerprints);
    if (!policy || typeof policy.rationale !== 'string') errors.push(issue('invalid-shape-policy', 'Inventory entry has no documented shape policy.', { schemaId: entry.schemaId }));
    else if (hashes.length === 0 && (policy.mode !== 'unresolved' || accepted.length !== 0)) errors.push(issue('invalid-shape-policy', 'Entries without shapes must be unresolved.', { schemaId: entry.schemaId }));
    else if (hashes.length === 1 && (policy.mode !== 'single' || !stableEqual(accepted, hashes))) errors.push(issue('invalid-shape-policy', 'Single-shape entries must bind the observed fingerprint.', { schemaId: entry.schemaId }));
    else if (hashes.length > 1 && (policy.mode !== 'polymorphic' || !policy.decision || !stableEqual(accepted, hashes))) {
      errors.push(issue('polymorphism-decision-required', 'Multiple shapes require a fingerprint-bound polymorphic decision.', { schemaId: entry.schemaId }));
    }
    if (policy && (!stableEqual(uniqueSorted(policy.authoritativeFingerprints || []), authoritative)
      || policy.releasedFingerprintSetHash !== entry.releasedFingerprintSetHash)) {
      errors.push(issue('invalid-shape-policy', 'Shape policy authoritative and released fingerprint fields must match the entry.', { schemaId: entry.schemaId }));
    }
    const mayRetainHistoricalReleasedHash = currentReleasedHash === null && entry.releasedFingerprintSetHash
      && (entry.aliasOf || entry.lifecycle && entry.lifecycle.status !== 'active');
    if (entry.releasedFingerprintSetHash !== currentReleasedHash && !mayRetainHistoricalReleasedHash) {
      errors.push(issue('released-fingerprint-drift', 'A released authoritative fingerprint changed in place; publish a new major schema ID.', {
        schemaId: entry.schemaId,
        releasedFingerprintSetHash: entry.releasedFingerprintSetHash,
        observedFingerprintSetHash: currentReleasedHash
      }));
    }
  });
  const sortedIds = entries.map((entry) => entry && entry.schemaId).filter(Boolean);
  const expectedSortedIds = sortedIds.slice().sort(compareStrings);
  if (sortedIds.some((schemaId, index) => schemaId !== expectedSortedIds[index])) errors.push(issue('unstable-order', 'Inventory entries must be sorted by schemaId.'));

  entries.forEach((entry) => {
    if (entry.aliasOf !== null && entry.aliasOf !== undefined) {
      const target = inventoryById.get(entry.aliasOf);
      if (!target) errors.push(issue('alias-target-missing', 'aliasOf must reference an inventoried schema.', { schemaId: entry.schemaId, aliasOf: entry.aliasOf }));
      else {
        if (target.aliasOf) errors.push(issue('alias-chain', 'Alias chains are forbidden; every alias must point directly at a canonical schema.', { schemaId: entry.schemaId, aliasOf: entry.aliasOf }));
        if (!entry.releasedFingerprintSetHash || entry.releasedFingerprintSetHash !== target.releasedFingerprintSetHash) {
          errors.push(issue('alias-fingerprint-mismatch', 'Aliases require an identical non-empty authoritative released fingerprint set.', { schemaId: entry.schemaId, aliasOf: entry.aliasOf }));
        }
      }
      const visited = new Set([entry.schemaId]);
      let current = entry;
      while (current && current.aliasOf) {
        if (visited.has(current.aliasOf)) {
          errors.push(issue('alias-cycle', 'aliasOf relationships must be acyclic.', { schemaId: entry.schemaId }));
          break;
        }
        visited.add(current.aliasOf);
        current = inventoryById.get(current.aliasOf);
      }
    }
    if (entry.replacedBy !== null && entry.replacedBy !== undefined) {
      const target = inventoryById.get(entry.replacedBy);
      if (!target || target.familyId !== entry.familyId || target.version <= entry.version
        || !entry.replacementDecision || typeof entry.replacementDecision.compatibility !== 'string'
        || typeof entry.replacementDecision.rationale !== 'string') {
        errors.push(issue('invalid-replaced-by', 'replacedBy must target a higher version in the same family and include a compatibility/migration decision.', { schemaId: entry.schemaId, replacedBy: entry.replacedBy }));
      }
    }
  });

  const families = inventory && Array.isArray(inventory.schemaFamilies) ? inventory.schemaFamilies : [];
  if (!Array.isArray(inventory && inventory.schemaFamilies)) errors.push(issue('invalid-family', 'schemaFamilies must be an array.'));
  const familyById = new Map();
  const tombstoneIds = new Set();
  families.forEach((family) => {
    if (!family || typeof family.familyId !== 'string' || familyById.has(family.familyId) || !Array.isArray(family.versions) || !Array.isArray(family.tombstones)) {
      errors.push(issue('invalid-family', 'Every schema family must be unique and contain versions and tombstones.', { familyId: family && family.familyId }));
      return;
    }
    familyById.set(family.familyId, family);
    const expectedEntries = entries.filter((entry) => entry.familyId === family.familyId);
    const actualVersionIds = uniqueSorted(family.versions.map((version) => version && version.schemaId).filter(Boolean));
    const expectedVersionIds = uniqueSorted(expectedEntries.map((entry) => entry.schemaId));
    if (!stableEqual(actualVersionIds, expectedVersionIds)) errors.push(issue('invalid-family', 'Family version membership differs from inventory entries.', { familyId: family.familyId }));
    const activeVersions = expectedEntries.filter((entry) => entry.lifecycle && entry.lifecycle.status === 'active');
    if (activeVersions.length > 1) errors.push(issue('multiple-current-family-version', 'A family may have only one active/current version.', { familyId: family.familyId }));
    const current = activeVersions[0] || expectedEntries.slice().sort((left, right) => right.version - left.version)[0] || null;
    if (current && (family.currentVersion !== current.version || family.activeSchemaId !== current.schemaId)) {
      errors.push(issue('invalid-current-family-version', 'Family currentVersion and activeSchemaId must identify its sole active version.', { familyId: family.familyId }));
    }
    family.tombstones.forEach((tombstone) => {
      if (!tombstone || typeof tombstone.schemaId !== 'string' || !Number.isInteger(tombstone.version)
        || typeof tombstone.rationale !== 'string' || tombstone.rationale.trim().length < 8
        || tombstoneIds.has(tombstone.schemaId) || parseSchemaVersion(tombstone.schemaId).familyId !== family.familyId) {
        errors.push(issue('invalid-tombstone', 'Tombstones must be unique, versioned, family-bound, and documented.', { familyId: family.familyId, schemaId: tombstone && tombstone.schemaId }));
      }
      tombstoneIds.add(tombstone.schemaId);
      if (inventoryById.has(tombstone.schemaId) && inventoryById.get(tombstone.schemaId).lifecycle.status !== 'retired') {
        errors.push(issue('tombstone-reuse', 'A retired/tombstoned schema ID cannot be reused by an active or deprecated entry.', { schemaId: tombstone.schemaId }));
      }
    });
    expectedEntries.filter((entry) => entry.lifecycle.status === 'retired').forEach((entry) => {
      if (!family.tombstones.some((tombstone) => tombstone.schemaId === entry.schemaId)) {
        errors.push(issue('invalid-tombstone', 'Every retired schema entry must remain reserved as a family tombstone.', { schemaId: entry.schemaId }));
      }
    });
  });
  entries.forEach((entry) => {
    if (!familyById.has(entry.familyId)) errors.push(issue('invalid-family', 'Inventory entry is missing from schemaFamilies.', { schemaId: entry.schemaId, familyId: entry.familyId }));
  });

  const consolidations = inventory && Array.isArray(inventory.consolidations) ? inventory.consolidations : [];
  if (!Array.isArray(inventory && inventory.consolidations)) errors.push(issue('invalid-consolidation', 'consolidations must be an array.'));
  const consolidationIds = new Set();
  consolidations.forEach((consolidation) => {
    const schemaIds = uniqueSorted(consolidation && consolidation.schemaIds || []);
    if (!consolidation || typeof consolidation.consolidationId !== 'string' || consolidationIds.has(consolidation.consolidationId)
      || !['exact-authoritative', 'overlap', 'insufficient-evidence'].includes(consolidation.kind)
      || consolidation.decision !== null && !CONSOLIDATION_DECISIONS.has(consolidation.decision)
      || schemaIds.length < 2 || schemaIds.some((schemaId) => !inventoryById.has(schemaId))
      || !ROLLOUT_STATUSES.has(consolidation.rolloutStatus) || typeof consolidation.rationale !== 'string') {
      errors.push(issue('invalid-consolidation', 'Consolidations need a unique ID, valid decision, inventoried schemas, rationale, and rollout status.', { consolidationId: consolidation && consolidation.consolidationId }));
      return;
    }
    consolidationIds.add(consolidation.consolidationId);
    if (consolidation.kind === 'exact-authoritative' && !consolidation.decision) {
      errors.push(issue('unresolved-exact-consolidation', 'Every exact authoritative group requires an explicit consolidation or distinct-contract decision.', { consolidationId: consolidation.consolidationId }));
    }
    if (consolidation.decision === 'consolidate') {
      const canonical = inventoryById.get(consolidation.canonicalSchemaId);
      if (!canonical || !schemaIds.includes(consolidation.canonicalSchemaId) || typeof consolidation.owner !== 'string' || !consolidation.owner.trim()) {
        errors.push(issue('invalid-consolidation', 'A consolidate decision requires an inventoried canonical schema in the group and a non-empty owner.', { consolidationId: consolidation.consolidationId }));
      }
      const expectedSet = canonical && canonical.releasedFingerprintSetHash;
      if (!expectedSet || schemaIds.some((schemaId) => inventoryById.get(schemaId).releasedFingerprintSetHash !== expectedSet)
        || consolidation.fingerprintSetHash !== expectedSet) {
        errors.push(issue('invalid-consolidation', 'A consolidate decision requires identical authoritative released fingerprint sets.', { consolidationId: consolidation.consolidationId }));
      }
      if (['canonical-write', 'complete'].includes(consolidation.rolloutStatus)) {
        const legacyProducer = schemaIds.filter((schemaId) => schemaId !== consolidation.canonicalSchemaId).some((schemaId) =>
          (inventoryById.get(schemaId).usages || []).some((usage) => usage.role === 'producer' && ['public', 'internal'].includes(usage.visibility)));
        if (legacyProducer) errors.push(issue('invalid-consolidation-rollout', 'canonical-write/complete consolidations cannot retain productive legacy producers.', { consolidationId: consolidation.consolidationId }));
      }
      if (consolidation.rolloutStatus === 'complete') {
        const legacyRuntime = schemaIds.filter((schemaId) => schemaId !== consolidation.canonicalSchemaId).some((schemaId) =>
          (inventoryById.get(schemaId).usages || []).some((usage) => !['test', 'fixture', 'docs'].includes(usage.visibility)));
        if (legacyRuntime) errors.push(issue('invalid-consolidation-rollout', 'Completed consolidations may retain legacy IDs only in migration tests and documentation.', { consolidationId: consolidation.consolidationId }));
      }
    }
  });
  const duplicateAudit = auditDuplicateCandidates(entries, consolidations);
  duplicateAudit.exactAuthoritativeGroups.forEach((group) => {
    const decision = consolidations.find((consolidation) => consolidation.kind === 'exact-authoritative'
      && consolidation.fingerprintSetHash === group.fingerprintSetHash
      && stableEqual(uniqueSorted(consolidation.schemaIds || []), group.schemaIds));
    if (!decision) {
      errors.push(issue('unresolved-exact-consolidation', 'A newly observed exact authoritative fingerprint-set group needs a consolidation decision.', {
        groupId: group.groupId,
        schemaIds: group.schemaIds
      }));
    }
  });

  const scanEntries = scan && Array.isArray(scan.entries) ? scan.entries : [];
  const scanById = new Map(scanEntries.map((entry) => [entry.schemaId, entry]));
  scanEntries.forEach((scanned) => {
    const inventoried = inventoryById.get(scanned.schemaId);
    if (!inventoried) {
      errors.push(issue('coverage-missing-schema', 'Scanned schema identifier is not inventoried.', { schemaId: scanned.schemaId }));
      return;
    }
    if (!stableEqual(uniqueSorted(inventoried.kinds || []), uniqueSorted(scanned.kinds || []))) {
      errors.push(issue('classification-kind-drift', 'Inventory kinds differ from the static classification.', { schemaId: scanned.schemaId }));
    }
    if (inventoried.status !== scanned.status) {
      errors.push(issue('classification-status-drift', 'Inventory status differs from the static classification.', { schemaId: scanned.schemaId }));
    }
    if (!stableEqual(inventoried.canonicalDefinition, scanned.canonicalDefinition)) {
      errors.push(issue('canonical-definition-drift', 'Canonical definition differs from the static precedence result.', { schemaId: scanned.schemaId }));
    }
    const inventoryPaths = new Set(allUsagePaths(inventoried));
    allUsagePaths(scanned).forEach((sourcePath) => {
      if (!inventoryPaths.has(sourcePath)) errors.push(issue('coverage-missing-source', 'Scanned source path is missing from the inventory usage list.', { schemaId: scanned.schemaId, path: sourcePath }));
    });
    const inventoryUsagesByKey = new Map((inventoried.usages || []).map((usage) => [usageMatchKey(usage), usage]));
    (scanned.usages || []).forEach((scannedUsage) => {
      const inventoriedUsage = inventoryUsagesByKey.get(usageMatchKey(scannedUsage));
      if (!inventoriedUsage) {
        errors.push(issue('usage-classification-drift', 'A statically classified usage is missing from the inventory.', { schemaId: scanned.schemaId }));
        return;
      }
      const inventoriedPaths = new Set(inventoriedUsage.sourcePaths || []);
      (scannedUsage.sourcePaths || []).forEach((sourcePath) => {
        if (!inventoriedPaths.has(sourcePath)) errors.push(issue('usage-classification-drift', 'A classified usage path is missing from its application/role/visibility group.', { schemaId: scanned.schemaId, path: sourcePath }));
      });
    });
    const actualHashes = uniqueSorted((inventoried.shapeFingerprints || []).map((entry) => entry.hash));
    const expectedHashes = uniqueSorted((scanned.shapeFingerprints || []).map((entry) => entry.hash));
    if (JSON.stringify(actualHashes) !== JSON.stringify(expectedHashes)) {
      errors.push(issue('shape-fingerprint-drift', 'Observed shape fingerprints differ from the inventory.', { schemaId: scanned.schemaId }));
    }
  });
  entries.forEach((entry) => {
    if (!scanById.has(entry.schemaId)) errors.push(issue('orphan-entry', 'Inventory entry is no longer observed in tracked sources.', { schemaId: entry.schemaId }));
  });

  const inventoryReviews = Array.isArray(inventory && inventory.duplicateReviews) ? inventory.duplicateReviews : [];
  const inventoriedReviewsByKey = new Map(inventoryReviews.map((review) => [reviewMatchKey(review), review]));
  (scan && Array.isArray(scan.duplicateReviews) ? scan.duplicateReviews : []).forEach((review) => {
    const inventoriedReview = inventoriedReviewsByKey.get(reviewMatchKey(review));
    if (!inventoriedReview) {
      errors.push(issue('unregistered-duplicate-review', 'A new shape collision or polymorphic identifier needs an inventory review.', {
        schemaId: (review.schemaIds || []).join(', '),
        reviewId: review.reviewId
      }));
    } else if (inventoriedReview.baselineAccepted !== true || !inventoriedReview.resolution
      || typeof inventoriedReview.resolution.rationale !== 'string' || inventoriedReview.status === 'unreviewed') {
      errors.push(issue('unconfirmed-duplicate-review', 'A shape collision or polymorphic identifier needs a documented baseline decision.', {
        schemaId: (review.schemaIds || []).join(', '),
        reviewId: inventoriedReview.reviewId
      }));
    }
  });
  inventoryReviews.forEach((review) => {
    if (!review || !Array.isArray(review.schemaIds) || review.schemaIds.length === 0
      || review.schemaIds.some((schemaId) => !inventoryById.has(schemaId))
      || typeof review.rationale !== 'string') {
      errors.push(issue('invalid-duplicate-review', 'Duplicate reviews must reference inventoried IDs and contain a rationale.', { reviewId: review && review.reviewId }));
    }
    if (review.status === 'open') warnings.push(issue('open-duplicate-review', review.rationale || 'Duplicate review remains open.', { reviewId: review.reviewId }));
  });
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    duplicateReviews: scan && scan.duplicateReviews || [],
    duplicateAudit,
    summary: {
      entries: entries.length,
      scannedEntries: scanEntries.length,
      comparableSchemas: entries.filter((entry) => Array.isArray(entry.shapeFingerprints) && entry.shapeFingerprints.length > 0).length,
      duplicateReviews: Array.isArray(inventory && inventory.duplicateReviews) ? inventory.duplicateReviews.length : 0,
      exactAuthoritativeGroups: duplicateAudit.exactAuthoritativeGroups.length,
      shapeOverlaps: duplicateAudit.overlaps.length,
      incompleteEvidence: duplicateAudit.incompleteEvidence.length,
      openReviews: warnings.length,
      errors: errors.length,
      warnings: warnings.length
    }
  };
}

function writeInventory(rootDir, inventory) {
  const resolvedRoot = resolveRootDir(rootDir);
  const targetPath = path.join(resolvedRoot, INVENTORY_PATH);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, stableStringify(inventory), 'utf8');
  return targetPath;
}

function readExistingInventory(rootDir) {
  const targetPath = path.join(resolveRootDir(rootDir), INVENTORY_PATH);
  if (!fs.existsSync(targetPath)) return null;
  return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
}

function parseArgs(argv) {
  const options = { json: false, write: false, check: false, acceptBaseline: false, auditDuplicates: false, rootDir: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') options.json = true;
    else if (argument === '--write') options.write = true;
    else if (argument === '--check') options.check = true;
    else if (argument === '--accept-baseline') options.acceptBaseline = true;
    else if (argument === '--audit-duplicates') options.auditDuplicates = true;
    else if (argument === '--root') options.rootDir = argv[++index];
    else if (argument.startsWith('--root=')) options.rootDir = argument.slice('--root='.length);
    else throw new Error('Unknown argument: ' + argument);
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  const rootDir = resolveRootDir(options.rootDir);
  const scan = scanSchemaInventory({ rootDir });
  const existing = readExistingInventory(rootDir);
  const inventory = createInventoryDocument(scan, existing);
  if (options.auditDuplicates && (options.write || options.acceptBaseline)) {
    console.error('--audit-duplicates is read-only and cannot be combined with --write or --accept-baseline.');
    process.exitCode = 1;
    return;
  }
  if (options.acceptBaseline && !options.write) {
    console.error('--accept-baseline requires --write.');
    process.exitCode = 1;
    return;
  }
  if (options.acceptBaseline) acceptCurrentBaseline(inventory);
  let writtenPath = null;
  if (options.write) writtenPath = writeInventory(rootDir, inventory);
  let validation = null;
  if (options.check) {
    if (!existing && !options.write) {
      validation = { valid: false, errors: [issue('inventory-missing', 'Inventory file does not exist.')], warnings: [], summary: {} };
    } else {
      validation = validateInventoryDocument(options.write ? inventory : existing, scan, { rootDir });
    }
  }
  const result = {
    ok: validation ? validation.valid : true,
    inventoryPath: INVENTORY_PATH,
    writtenPath: writtenPath ? toPosixPath(path.relative(rootDir, writtenPath)) : null,
    stats: scan.stats,
    duplicateAudit: options.auditDuplicates ? auditDuplicateCandidates(inventory.entries, inventory.consolidations) : undefined,
    validation
  };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('XTend schema inventory: ' + scan.stats.schemaIdentifiers + ' identifiers across ' + scan.stats.trackedTextFiles + ' tracked text files.');
    if (options.auditDuplicates) {
      const audit = result.duplicateAudit;
      console.log('Duplicate audit: ' + audit.exactAuthoritativeGroups.length + ' exact authoritative group(s), '
        + audit.overlaps.length + ' overlap(s), ' + audit.incompleteEvidence.length + ' entry/entries with incomplete evidence.');
    }
    if (writtenPath) console.log('Inventory written: ' + path.relative(rootDir, writtenPath));
    if (validation) console.log(validation.valid ? 'Inventory check passed.' : 'Inventory check failed with ' + validation.errors.length + ' error(s).');
  }
  if (validation && !validation.valid) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  FORMAL_RMT_SCHEMA_FAMILY_ID,
  FORMAL_RMT_SCHEMA_ID,
  INVENTORY_PATH,
  auditDuplicateCandidates,
  authoritativeFingerprintSetHash,
  buildSchemaFamilies,
  createInventoryDocument,
  acceptCurrentBaseline,
  defaultEvolutionPolicy,
  parseSchemaVersion,
  scanSchemaInventory,
  stableStringify,
  validateInventoryDocument,
  writeInventory
};
