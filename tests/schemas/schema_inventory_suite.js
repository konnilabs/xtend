const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const schemaInventoryScanner = require('../../scripts/scan_schema_inventory');
const {
  INVENTORY_PATH,
  scanSchemaInventory,
  validateInventoryDocument
} = schemaInventoryScanner;
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');

const SUITE_ID = 'schema-inventory';
const SUITE_LABEL = 'XTend Schema Inventory';
const INVENTORY_VERSION = 2;
const FORMAL_JSON_SCHEMA_ID = 'https://xtendrmt.dev/schemas/rmt.schema.json';
const XCOMMAND_CONTRACT = 'xtend.xcommand.kernel-contract.v1';
const XKEYMAP_CONTRACT = 'xtend.xkeymap.surface-contract.v1';
const INVENTORY_REPORT_PATH = '.xtend-test-results/xtend-schema-inventory-report.json';
const NATIVE_FIRST_REGISTRY_CONTRACT = 'xtend.native-first.contract-registry.v1';
const NATIVE_FIRST_REGISTRY_PATH = 'development/XTend-Native-First-Contract-Registry.md';

const REQUIRED_SELF_EXCLUDED_PATHS = Object.freeze([
  'tests/schemas/xtend-schema-inventory.json',
  'tests/schemas/schema_inventory_suite.js',
  'scripts/scan_schema_inventory.js'
]);

const REQUIRED_CANONICAL_PRECEDENCE = Object.freeze([
  'runtime-definition',
  'public-declaration',
  'package-metadata',
  'test-or-fixture',
  'documentation',
  'generated-mirror'
]);

const INTERFACE_REFERENCE_TYPES = Object.freeze([
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

const HOST_RESOURCE_CLEANUP_SCHEMA = 'xtend.xtensions.host-resource-cleanup-record.v1';
const HOST_CONTROLLER_CLEANUP_SCHEMA = 'xtend.xtensions.host-controller-cleanup-record.v1';
const HOST_RESOURCE_CLEANUP_FAMILY_ID = 'xtend.xtensions.host-resource-cleanup-record';
const HOST_RESOURCE_CLEANUP_RUNTIME_PATH = 'tools/xtensions/host-resource-cleanup-record.js';
const HOST_RESOURCE_CLEANUP_TYPES_PATH = 'tools/xtensions/host-resource-cleanup-record.d.ts';

const HOST_RESOURCE_CLEANUP_LEGACY_ALIASES = Object.freeze([
  'xtend.xtensions.chart-cleanup-record.v1',
  'xtend.xtensions.leaflet-cleanup-record.v1',
  'xtend.xtensions.react-host-controller-cleanup-record.v1',
  'xtend.xtensions.three-cleanup-record.v1',
  'xtend.xtensions.vue-host-controller-cleanup-record.v1'
]);

const HOST_RESOURCE_CLEANUP_PRODUCERS = Object.freeze([
  Object.freeze({
    module: '@ccslabs/xtend/xtensions/imperative-host-pocs',
    path: 'tools/xtensions/imperative-host-pocs.js',
    typesPath: 'tools/xtensions/imperative-host-pocs.d.ts',
    legacySchemaIds: Object.freeze([
      'xtend.xtensions.chart-cleanup-record.v1',
      'xtend.xtensions.leaflet-cleanup-record.v1'
    ])
  }),
  Object.freeze({
    module: '@ccslabs/xtend/xtensions/react-host-controller-poc',
    path: 'tools/xtensions/react-host-controller-poc.js',
    typesPath: 'tools/xtensions/react-host-controller-poc.d.ts',
    legacySchemaIds: Object.freeze(['xtend.xtensions.react-host-controller-cleanup-record.v1'])
  }),
  Object.freeze({
    module: '@ccslabs/xtend/xtensions/three-render-loop-poc',
    path: 'tools/xtensions/three-render-loop-poc.js',
    typesPath: 'tools/xtensions/three-render-loop-poc.d.ts',
    legacySchemaIds: Object.freeze(['xtend.xtensions.three-cleanup-record.v1'])
  }),
  Object.freeze({
    module: '@ccslabs/xtend/xtensions/vue-host-controller-poc',
    path: 'tools/xtensions/vue-host-controller-poc.js',
    typesPath: 'tools/xtensions/vue-host-controller-poc.d.ts',
    legacySchemaIds: Object.freeze(['xtend.xtensions.vue-host-controller-cleanup-record.v1'])
  })
]);

const LIFECYCLE_STATUSES = Object.freeze(['active', 'deprecated', 'retired']);
const ROLLOUT_STATUSES = Object.freeze(['planned', 'dual-read', 'canonical-write', 'complete']);
const AUTHORITATIVE_EVIDENCE_TYPES = Object.freeze(['formal-schema', 'declared-type']);
const NON_AUTHORITATIVE_EVIDENCE_TYPES = Object.freeze(['runtime-observation', 'test', 'docs', 'generated']);

const A11Y_PROFILE_FAMILY = Object.freeze([
  'xtend.a11y.component-profile.v1',
  'xtend.a11y.profile.v1'
]);

const PARALLEL_NEGATIVE_FIXTURE_PAIRS = Object.freeze([
  [
    'xtend.xtensions.react-host-adapter.bad-payload.fixture.v1',
    'xtend.xtensions.vue-host-adapter.bad-payload.fixture.v1'
  ],
  [
    'xtend.xtensions.react-host-adapter.blocked-runtime-bundled.fixture.v1',
    'xtend.xtensions.vue-host-adapter.blocked-runtime-bundled.fixture.v1'
  ],
  [
    'xtend.xtensions.react-host-adapter.missing-peer-runtime.fixture.v1',
    'xtend.xtensions.vue-host-adapter.missing-peer-runtime.fixture.v1'
  ]
]);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasOwn(record, field) {
  return isRecord(record) && Object.prototype.hasOwnProperty.call(record, field);
}

function summarizeIssues(issues, limit = 12) {
  if (!issues.length) return '';
  const visible = issues.slice(0, limit).join('; ');
  const suffix = issues.length > limit ? `; and ${issues.length - limit} more` : '';
  return `${visible}${suffix}`;
}

function assertNoIssues(context, issues, passMessage, failureLabel) {
  context.assert(
    issues.length === 0,
    issues.length === 0 ? passMessage : `${failureLabel}: ${summarizeIssues(issues)}`
  );
}

function relativeInventoryPath(rootDir) {
  const configuredPath = INVENTORY_PATH || 'tests/schemas/xtend-schema-inventory.json';
  return path.isAbsolute(configuredPath)
    ? path.relative(rootDir, configuredPath)
    : configuredPath;
}

function isRepoLocalExistingPath(relativePath, rootDir) {
  if (!isNonEmptyString(relativePath) || path.isAbsolute(relativePath)) return false;
  const normalized = path.normalize(relativePath);
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) return false;
  return fs.existsSync(resolveRepoPath(normalized, rootDir));
}

function toPosixPath(value) {
  return String(value || '').split(path.sep).join('/').replace(/^\.\//u, '');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isRecord(value)) {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  return value;
}

function shapeFingerprint(shape) {
  const digest = crypto.createHash('sha256').update(JSON.stringify(stableValue(shape))).digest('hex');
  return `sha256:${digest}`;
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).filter(isNonEmptyString))).sort();
}

function sameStringSet(left, right) {
  return JSON.stringify(uniqueStrings(left)) === JSON.stringify(uniqueStrings(right));
}

function fingerprintSetHash(hashes) {
  const normalized = uniqueStrings(hashes);
  const digest = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  return `sha256:${digest}`;
}

function parsedSchemaVersion(schemaId) {
  if (typeof schemaInventoryScanner.parseSchemaVersion === 'function') {
    try {
      const parsed = schemaInventoryScanner.parseSchemaVersion(schemaId);
      if (Number.isFinite(parsed)) return { familyId: String(schemaId).replace(/\.v[0-9]+(?:\.[0-9]+)*$/u, ''), version: parsed };
      if (isRecord(parsed) && Number.isFinite(parsed.version)) return parsed;
    } catch (error) {
      // Fall through to the suite-local parser while scanner-v2 exports settle.
    }
  }
  const match = String(schemaId || '').match(/^(.*)\.v([0-9]+(?:\.[0-9]+)*)$/u);
  if (!match) return null;
  const version = Number(match[2]);
  return Number.isFinite(version) ? { familyId: match[1], version } : null;
}

function entryReleasedFingerprint(entry) {
  if (!isRecord(entry)) return null;
  if (hasOwn(entry, 'releasedFingerprintSetHash')) return entry.releasedFingerprintSetHash;
  return isRecord(entry.shapePolicy) && hasOwn(entry.shapePolicy, 'releasedFingerprintSetHash')
    ? entry.shapePolicy.releasedFingerprintSetHash
    : null;
}

function entryAuthoritativeFingerprints(entry) {
  const policyHashes = entry && entry.shapePolicy && entry.shapePolicy.authoritativeFingerprints;
  if (Array.isArray(policyHashes)) return uniqueStrings(policyHashes);
  return uniqueStrings((entry && Array.isArray(entry.shapeFingerprints) ? entry.shapeFingerprints : [])
    .filter((fingerprint) => fingerprint && fingerprint.authoritative === true)
    .map((fingerprint) => fingerprint.hash));
}

function groupSchemaIds(group) {
  if (!isRecord(group)) return [];
  const values = group.schemaIds || group.ids || group.members || group.entries || [];
  return uniqueStrings((Array.isArray(values) ? values : []).map((value) => (
    isNonEmptyString(value) ? value : value && (value.schemaId || value.id)
  )));
}

function groupFingerprintSetHash(group) {
  if (!isRecord(group)) return null;
  return group.fingerprintSetHash || group.releasedFingerprintSetHash || group.fingerprint || group.hash || null;
}

function normalizeDuplicateAudit(scan, entries, consolidations = []) {
  let audit = null;
  if (typeof schemaInventoryScanner.auditDuplicateCandidates === 'function') {
    try {
      audit = schemaInventoryScanner.auditDuplicateCandidates(entries, consolidations);
    } catch (firstError) {
      try {
        audit = schemaInventoryScanner.auditDuplicateCandidates(scan || { entries }, consolidations);
      } catch (secondError) {
        audit = null;
      }
    }
  }
  if (!isRecord(audit)) audit = scan && (scan.duplicateAudit || scan.audit || scan.duplicateCandidates);
  const source = isRecord(audit) ? audit : {};
  return {
    exactGroups: Array.isArray(source.exactAuthoritativeGroups)
      ? source.exactAuthoritativeGroups
      : Array.isArray(source.exactGroups) ? source.exactGroups : [],
    overlaps: Array.isArray(source.overlaps) ? source.overlaps : [],
    insufficientEvidence: Array.isArray(source.incompleteEvidence)
      ? source.incompleteEvidence
      : Array.isArray(source.insufficientEvidence) ? source.insufficientEvidence : [],
    aliases: Array.isArray(source.aliasStatus)
      ? source.aliasStatus
      : Array.isArray(source.aliases) ? source.aliases : [],
    families: Array.isArray(source.versionFamilies)
      ? source.versionFamilies
      : Array.isArray(source.families) ? source.families : [],
    rollout: Array.isArray(source.legacyReferences)
      ? source.legacyReferences
      : Array.isArray(source.rollout) ? source.rollout : [],
    raw: source
  };
}

function isProductiveUsage(usage) {
  return isRecord(usage)
    && ['producer', 'consumer'].includes(usage.role)
    && ['public', 'internal'].includes(usage.visibility);
}

function isProductiveProducer(usage) {
  return isRecord(usage)
    && usage.role === 'producer'
    && ['public', 'internal'].includes(usage.visibility);
}

function flattenExportTargets(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenExportTargets);
  if (isRecord(value)) return Object.values(value).flatMap(flattenExportTargets);
  return [];
}

function wildcardMatch(pattern, value) {
  const parts = String(pattern).split('*');
  const source = parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('(.+)');
  const match = String(value).match(new RegExp(`^${source}$`, 'u'));
  return match ? match.slice(1) : null;
}

function substituteWildcards(pattern, captures) {
  let index = 0;
  return String(pattern).replace(/\*/gu, () => captures[index++] || '');
}

function discoverPackageManifests(rootDir) {
  const manifests = [];
  const skippedDirectories = new Set([
    '.git',
    '.xtend-build',
    '.xtend-test-results',
    'build',
    'dist',
    'node_modules'
  ]);

  function visit(directory, depth) {
    if (depth > 3) return;
    let entries = [];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      return;
    }
    entries.forEach((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) visit(absolutePath, depth + 1);
        return;
      }
      if (!entry.isFile() || entry.name !== 'package.json') return;
      try {
        const manifest = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
        if (isNonEmptyString(manifest.name) && isRecord(manifest.exports)) {
          manifests.push({
            directory,
            manifest,
            path: toPosixPath(path.relative(rootDir, absolutePath))
          });
        }
      } catch (error) {
        // Invalid manifests are covered by their owning package gates.
      }
    });
  }

  visit(rootDir, 0);
  return manifests;
}

function exportedTargetsForModule(moduleName, packageManifests, rootDir) {
  const targets = [];
  packageManifests.forEach(({ directory, manifest }) => {
    if (moduleName !== manifest.name && !moduleName.startsWith(`${manifest.name}/`)) return;
    const requestedKey = moduleName === manifest.name ? '.' : `./${moduleName.slice(manifest.name.length + 1)}`;
    Object.entries(manifest.exports).forEach(([exportKey, exportValue]) => {
      const captures = wildcardMatch(exportKey, requestedKey);
      if (!captures) return;
      flattenExportTargets(exportValue).forEach((target) => {
        const substituted = substituteWildcards(target, captures).replace(/^\.\//u, '');
        targets.push(toPosixPath(path.relative(rootDir, path.resolve(directory, substituted))));
      });
    });
  });
  return uniqueStrings(targets);
}

function readSourceText(relativePath, rootDir, sourceCache) {
  if (!isRepoLocalExistingPath(relativePath, rootDir)) return null;
  const normalized = toPosixPath(relativePath);
  if (!sourceCache.has(normalized)) {
    try {
      sourceCache.set(normalized, fs.readFileSync(path.join(rootDir, normalized), 'utf8'));
    } catch (error) {
      sourceCache.set(normalized, null);
    }
  }
  return sourceCache.get(normalized);
}

function sourceContainsToken(source, token) {
  if (!isNonEmptyString(source) || !isNonEmptyString(token)) return false;
  const identifiers = token.match(/[A-Za-z_$][A-Za-z0-9_$]*/gu);
  if (!identifiers || identifiers.length === 0) return source.includes(token);
  return identifiers.every((identifier) => new RegExp(`\\b${identifier.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\b`, 'u').test(source));
}

function sourceContainsMember(source, member) {
  if (!isNonEmptyString(source) || !isNonEmptyString(member)) return false;
  const escaped = member.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`(?:\\b(?:get|set|readonly|static)\\s+)?\\b${escaped}\\b\\s*(?:\\(|:|=|;|\\{)|\\.\\s*${escaped}\\b`, 'u').test(source);
}

function resolveJsonPointer(document, pointer) {
  if (pointer === '' || pointer === '/') return true;
  if (!isNonEmptyString(pointer) || !pointer.startsWith('/')) return false;
  let value = document;
  for (const rawSegment of pointer.slice(1).split('/')) {
    const segment = rawSegment.replace(/~1/gu, '/').replace(/~0/gu, '~');
    if (Array.isArray(value) && /^\d+$/u.test(segment)) {
      const index = Number(segment);
      if (index >= value.length) return false;
      value = value[index];
    } else if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, segment)) {
      value = value[segment];
    } else {
      return false;
    }
  }
  return true;
}

function createInterfaceResolver(rootDir) {
  const packageManifests = discoverPackageManifests(rootDir);
  const moduleTargetCache = new Map();
  const sourceCache = new Map();
  const jsonCache = new Map();

  function moduleTargets(moduleName) {
    if (!moduleTargetCache.has(moduleName)) {
      moduleTargetCache.set(moduleName, exportedTargetsForModule(moduleName, packageManifests, rootDir));
    }
    return moduleTargetCache.get(moduleName);
  }

  function sourcePathsFor(reference, usage) {
    const paths = [];
    if (isNonEmptyString(reference.path)) paths.push(reference.path);
    if (isNonEmptyString(reference.module)) paths.push(...moduleTargets(reference.module));
    if (Array.isArray(usage.sourcePaths)) paths.push(...usage.sourcePaths);
    return uniqueStrings(paths).filter((sourcePath) => isRepoLocalExistingPath(sourcePath, rootDir));
  }

  function resolve(reference, usage, label) {
    const issues = [];
    const sourcePaths = sourcePathsFor(reference, usage);
    if (reference.type === 'package-export') {
      if (!isNonEmptyString(reference.module)) issues.push(`${label} has no module`);
      if (!isNonEmptyString(reference.path)) issues.push(`${label} has no path`);
      else if (!isRepoLocalExistingPath(reference.path, rootDir)) issues.push(`${label} export target does not exist: ${reference.path}`);
      const exportedTargets = isNonEmptyString(reference.module) ? moduleTargets(reference.module) : [];
      if (isNonEmptyString(reference.path) && !exportedTargets.includes(toPosixPath(reference.path))) {
        issues.push(`${label} does not resolve ${reference.module || '<missing-module>'} to ${reference.path}`);
      }
      return issues;
    }

    if (['symbol', 'repo-symbol', 'internal-repo-symbol'].includes(reference.type)) {
      if (sourcePaths.length === 0) {
        issues.push(`${label} has no resolvable source file`);
        return issues;
      }
      if (reference.type === 'symbol') {
        if (!isNonEmptyString(reference.symbol)) {
          issues.push(`${label} has no symbol`);
        } else {
          const sources = sourcePaths.map((sourcePath) => readSourceText(sourcePath, rootDir, sourceCache)).filter(isNonEmptyString);
          if (!sources.some((source) => sourceContainsToken(source, reference.symbol))) {
            issues.push(`${label} cannot resolve symbol ${reference.symbol}`);
          }
        }
      } else if (reference.symbol !== null && reference.symbol !== undefined && !isNonEmptyString(reference.symbol)) {
        issues.push(`${label} has an invalid optional symbol`);
      } else if (isNonEmptyString(reference.symbol)) {
        const sources = sourcePaths.map((sourcePath) => readSourceText(sourcePath, rootDir, sourceCache)).filter(isNonEmptyString);
        if (!sources.some((source) => sourceContainsToken(source, reference.symbol))) {
          issues.push(`${label} cannot resolve repository symbol ${reference.symbol}`);
        }
      }
      return issues;
    }

    if (reference.type === 'custom-element') {
      if (!isNonEmptyString(reference.name) || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/u.test(reference.name)) {
        issues.push(`${label} has an invalid custom-element name`);
        return issues;
      }
      const sources = sourcePaths.map((sourcePath) => readSourceText(sourcePath, rootDir, sourceCache)).filter(isNonEmptyString);
      const definitionPattern = new RegExp(`customElements\\.define\\(\\s*['\"]${reference.name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}['\"]`, 'u');
      if (!sources.some((source) => definitionPattern.test(source))) {
        issues.push(`${label} cannot resolve custom element ${reference.name}`);
      }
      const members = Array.isArray(reference.member) ? reference.member : isNonEmptyString(reference.member) ? [reference.member] : [];
      members.forEach((member) => {
        if (!sources.some((source) => sourceContainsMember(source, member))) {
          issues.push(`${label} cannot resolve custom-element member ${member}`);
        }
      });
      return issues;
    }

    if (reference.type === 'json-pointer') {
      if (!isNonEmptyString(reference.path) || !isNonEmptyString(reference.pointer)) {
        issues.push(`${label} needs path and pointer`);
        return issues;
      }
      const normalizedPath = toPosixPath(reference.path);
      if (!jsonCache.has(normalizedPath)) {
        try {
          jsonCache.set(normalizedPath, JSON.parse(fs.readFileSync(path.join(rootDir, normalizedPath), 'utf8')));
        } catch (error) {
          jsonCache.set(normalizedPath, null);
        }
      }
      const document = jsonCache.get(normalizedPath);
      if (document === null) issues.push(`${label} path is not readable JSON: ${reference.path}`);
      else if (!resolveJsonPointer(document, reference.pointer)) issues.push(`${label} cannot resolve JSON pointer ${reference.pointer}`);
      return issues;
    }

    if (['browser-global', 'browser-event', 'cli'].includes(reference.type)) {
      const evidenceFields = reference.type === 'browser-global'
        ? ['global', 'name', 'reference', 'target']
        : reference.type === 'browser-event'
          ? ['event', 'name', 'reference', 'target']
          : ['command', 'name', 'reference', 'target'];
      const evidence = evidenceFields.flatMap((field) => Array.isArray(reference[field]) ? reference[field] : [reference[field]])
        .filter(isNonEmptyString);
      const sources = sourcePaths.map((sourcePath) => readSourceText(sourcePath, rootDir, sourceCache)).filter(isNonEmptyString);
      if (evidence.length === 0) issues.push(`${label} has no ${reference.type} evidence value`);
      else if (!evidence.some((value) => sources.some((source) => source.includes(value)))) {
        issues.push(`${label} has no ${reference.type} evidence in its sourcePaths`);
      }
      return issues;
    }

    return issues;
  }

  return { resolve };
}

function looksLikeEnglishDescription(description) {
  if (!isNonEmptyString(description) || description.trim().length < 12) return false;
  if (/[\u00e4\u00f6\u00fc\u00df]/iu.test(description)) return false;
  if (/\b(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|und|oder|fuer|wird|werden|beschreibt|definiert|verwendet)\b/iu.test(description)) return false;
  return /\b(?:a|an|the|and|or|for|from|of|to|with|without|used|defines|describes|represents|captures|provides|documents|schema|contract|record|report|policy|fixture|profile|manifest|runtime|event|command|component|surface|test|metadata|configuration|registry|result|payload|proof|plan|adapter|state|model|boundary|artifact)\b/iu.test(description);
}

function validateInventoryMetadata(inventory, inventoryIds, rootDir) {
  const issues = [];
  const scanPolicy = inventory && inventory.scanPolicy;
  if (!isRecord(scanPolicy)) {
    issues.push('scanPolicy must be an object');
  } else {
    if (scanPolicy.source !== 'git-tracked-text-files') issues.push('scanPolicy.source must be git-tracked-text-files');
    if (scanPolicy.executesRepositoryModules !== false) issues.push('scanPolicy.executesRepositoryModules must be false');
    if (scanPolicy.generatedPathsAreCanonical !== false) issues.push('scanPolicy.generatedPathsAreCanonical must be false');
    if (!isNonEmptyString(scanPolicy.versionedIdentifierPattern)) issues.push('scanPolicy.versionedIdentifierPattern is missing');
    if (JSON.stringify(scanPolicy.canonicalPrecedence) !== JSON.stringify(REQUIRED_CANONICAL_PRECEDENCE)) {
      issues.push('scanPolicy.canonicalPrecedence does not match the documented precedence');
    }
    if (!Array.isArray(scanPolicy.selfExcludedPaths)) {
      issues.push('scanPolicy.selfExcludedPaths must be an array');
    } else {
      REQUIRED_SELF_EXCLUDED_PATHS.forEach((requiredPath) => {
        if (!scanPolicy.selfExcludedPaths.includes(requiredPath)) issues.push(`scanPolicy.selfExcludedPaths is missing ${requiredPath}`);
      });
      scanPolicy.selfExcludedPaths.forEach((excludedPath) => {
        if (!isRepoLocalExistingPath(excludedPath, rootDir)) issues.push(`scanPolicy self-excluded path does not exist: ${excludedPath}`);
      });
    }
  }

  const registries = inventory && inventory.relatedRegistries;
  if (!Array.isArray(registries) || registries.length === 0) {
    issues.push('relatedRegistries must be a non-empty array');
  } else {
    registries.forEach((registry, index) => {
      const label = `relatedRegistries[${index}]`;
      if (!isRecord(registry)) {
        issues.push(`${label} must be an object`);
        return;
      }
      if (!isNonEmptyString(registry.name)) issues.push(`${label}.name is missing`);
      if (!isNonEmptyString(registry.relationship)) issues.push(`${label}.relationship is missing`);
      if (!isNonEmptyString(registry.contractId) || !inventoryIds.has(registry.contractId)) {
        issues.push(`${label}.contractId is not resolvable in the inventory`);
      }
      if (!isRepoLocalExistingPath(registry.path, rootDir)) issues.push(`${label}.path does not exist: ${String(registry.path)}`);
    });
    const nativeFirst = registries.find((registry) => registry && registry.contractId === NATIVE_FIRST_REGISTRY_CONTRACT);
    if (!nativeFirst) {
      issues.push(`relatedRegistries is missing ${NATIVE_FIRST_REGISTRY_CONTRACT}`);
    } else {
      if (nativeFirst.relationship !== 'governance-subset') issues.push('Native-First registry relationship must be governance-subset');
      if (nativeFirst.path !== NATIVE_FIRST_REGISTRY_PATH) issues.push(`Native-First registry path must be ${NATIVE_FIRST_REGISTRY_PATH}`);
    }
  }

  const excludedCandidates = inventory && inventory.excludedCandidates;
  if (!Array.isArray(excludedCandidates)) {
    issues.push('excludedCandidates must be an array');
  } else {
    const exclusionKeys = new Set();
    excludedCandidates.forEach((candidate, index) => {
      const label = `excludedCandidates[${index}]`;
      if (!isRecord(candidate)) {
        issues.push(`${label} must be an object`);
        return;
      }
      if (!isNonEmptyString(candidate.identifier)) issues.push(`${label}.identifier is missing`);
      if (!isNonEmptyString(candidate.reason) || candidate.reason.trim().length < 12) issues.push(`${label}.reason is not documented`);
      if (!Array.isArray(candidate.evidencePaths) || candidate.evidencePaths.length === 0) {
        issues.push(`${label}.evidencePaths must be non-empty`);
      } else {
        candidate.evidencePaths.forEach((evidencePath) => {
          if (!isRepoLocalExistingPath(evidencePath, rootDir)) issues.push(`${label} evidence path does not exist: ${evidencePath}`);
        });
      }
      const key = `${candidate.identifier}\0${candidate.reason}`;
      if (exclusionKeys.has(key)) issues.push(`${label} duplicates an exclusion decision`);
      exclusionKeys.add(key);
    });
  }
  return issues;
}

function validateEvolutionPolicy(inventory) {
  const policy = inventory && inventory.evolutionPolicy;
  if (!isRecord(policy)) return ['evolutionPolicy must be an object'];
  const issues = [];
  if (policy.versioning !== 'major-only') issues.push('evolutionPolicy.versioning must be major-only');
  if (policy.structuralChangesRequireNewMajor !== true) {
    issues.push('evolutionPolicy.structuralChangesRequireNewMajor must be true');
  }
  if (policy.annotationChangesRequireNewMajor !== false) {
    issues.push('evolutionPolicy.annotationChangesRequireNewMajor must be false');
  }
  if (policy.retiredIdsRemainReserved !== true) issues.push('evolutionPolicy.retiredIdsRemainReserved must be true');
  if (policy.legacyReadWindowMinorReleases !== 2) {
    issues.push('evolutionPolicy.legacyReadWindowMinorReleases must be 2');
  }
  if (!sameStringSet(policy.allowedLifecycleStatuses, LIFECYCLE_STATUSES)) {
    issues.push(`evolutionPolicy.allowedLifecycleStatuses must be ${LIFECYCLE_STATUSES.join(', ')}`);
  }
  if (!sameStringSet(policy.allowedRolloutStatuses, ROLLOUT_STATUSES)) {
    issues.push(`evolutionPolicy.allowedRolloutStatuses must be ${ROLLOUT_STATUSES.join(', ')}`);
  }
  return issues;
}

function validateEntryEvolutionFields(entries) {
  const issues = [];
  entries.forEach((entry, index) => {
    if (!isRecord(entry)) return;
    const label = entry.schemaId || `entries[${index}]`;
    const parsed = parsedSchemaVersion(entry.schemaId);
    if (!isNonEmptyString(entry.familyId)) issues.push(`${label} has no familyId`);
    if (!Number.isInteger(entry.version) || entry.version < 1) {
      issues.push(`${label} version must be a positive integer`);
    } else if (parsed && parsed.version !== entry.version) {
      issues.push(`${label} version does not match its .vN identifier suffix`);
    } else if (parsed && parsed.explicitlyVersioned === true && parsed.majorOnly !== true) {
      issues.push(`${label} must use a major-only .vN identifier suffix`);
    } else if (!parsed && entry.schemaId !== FORMAL_JSON_SCHEMA_ID) {
      issues.push(`${label} has no parseable numeric schema version`);
    }
    if (!isRecord(entry.lifecycle)
      || !LIFECYCLE_STATUSES.includes(entry.lifecycle.status)
      || !ROLLOUT_STATUSES.includes(entry.lifecycle.rollout)) {
      issues.push(`${label} has an invalid lifecycle`);
    }
    ['aliasOf', 'replacedBy'].forEach((field) => {
      if (!hasOwn(entry, field) || (entry[field] !== null && !isNonEmptyString(entry[field]))) {
        issues.push(`${label}.${field} must be explicit null or a schemaId`);
      }
    });
    if (!hasOwn(entry, 'releasedFingerprintSetHash')
      || (entry.releasedFingerprintSetHash !== null
        && !/^sha256:[a-f0-9]{64}$/u.test(String(entry.releasedFingerprintSetHash)))) {
      issues.push(`${label}.releasedFingerprintSetHash must be explicit null or a sha256 hash`);
    }
    const policy = entry.shapePolicy;
    if (!isRecord(policy) || !Array.isArray(policy.authoritativeFingerprints)) {
      issues.push(`${label} shapePolicy.authoritativeFingerprints must be an array`);
    } else {
      const observed = new Set((entry.shapeFingerprints || []).map((fingerprint) => fingerprint && fingerprint.hash));
      policy.authoritativeFingerprints.forEach((hash) => {
        if (!isNonEmptyString(hash) || !observed.has(hash)) {
          issues.push(`${label} shapePolicy references an unobserved authoritative fingerprint ${String(hash)}`);
        }
      });
    }
    if (!isRecord(policy) || !hasOwn(policy, 'releasedFingerprintSetHash')
      || policy.releasedFingerprintSetHash !== entry.releasedFingerprintSetHash) {
      issues.push(`${label} entry and shapePolicy released fingerprint hashes must agree`);
    }
    const authoritativeHashes = entryAuthoritativeFingerprints(entry);
    let expectedReleasedHash = authoritativeHashes.length > 0 ? fingerprintSetHash(authoritativeHashes) : null;
    if (typeof schemaInventoryScanner.authoritativeFingerprintSetHash === 'function') {
      try {
        expectedReleasedHash = schemaInventoryScanner.authoritativeFingerprintSetHash(entry);
      } catch (error) {
        // The suite-local deterministic hash is compatible with scanner-v2's public contract.
      }
    }
    const mayRetainHistoricalReleasedHash = expectedReleasedHash === null
      && isNonEmptyString(entry.releasedFingerprintSetHash)
      && (isNonEmptyString(entry.aliasOf) || entry.lifecycle && entry.lifecycle.status !== 'active');
    if (entry.releasedFingerprintSetHash !== expectedReleasedHash && !mayRetainHistoricalReleasedHash) {
      issues.push(`${label}.releasedFingerprintSetHash does not bind its authoritative fingerprints`);
    }

    (Array.isArray(entry.shapeFingerprints) ? entry.shapeFingerprints : []).forEach((fingerprint, fingerprintIndex) => {
      const fingerprintLabel = `${label} shapeFingerprints[${fingerprintIndex}]`;
      const evidence = Array.isArray(fingerprint && fingerprint.evidence) ? fingerprint.evidence : null;
      if (!evidence || evidence.length === 0) {
        issues.push(`${fingerprintLabel} needs classified evidence`);
        return;
      }
      const evidenceTypes = [];
      evidence.forEach((item, evidenceIndex) => {
        const evidenceLabel = `${fingerprintLabel} evidence[${evidenceIndex}]`;
        if (!isRecord(item)
          || ![...AUTHORITATIVE_EVIDENCE_TYPES, ...NON_AUTHORITATIVE_EVIDENCE_TYPES].includes(item.type)
          || !['complete', 'partial'].includes(item.completeness)
          || typeof item.authoritative !== 'boolean'
          || !isNonEmptyString(item.path)) {
          issues.push(`${evidenceLabel} is incomplete`);
          return;
        }
        evidenceTypes.push(item.type);
        if (item.authoritative && (item.completeness !== 'complete' || !AUTHORITATIVE_EVIDENCE_TYPES.includes(item.type))) {
          issues.push(`${evidenceLabel} cannot be authoritative`);
        }
        if (NON_AUTHORITATIVE_EVIDENCE_TYPES.includes(item.type) && item.authoritative) {
          issues.push(`${evidenceLabel} ${item.type} evidence cannot authorize consolidation`);
        }
      });
      if (!sameStringSet(fingerprint.evidenceTypes, evidenceTypes)) {
        issues.push(`${fingerprintLabel}.evidenceTypes does not match its evidence records`);
      }
      if (!['complete', 'partial'].includes(fingerprint.completeness) || typeof fingerprint.authoritative !== 'boolean') {
        issues.push(`${fingerprintLabel} has invalid completeness or authority classification`);
      }
      if (fingerprint.authoritative && fingerprint.completeness !== 'complete') {
        issues.push(`${fingerprintLabel} partial evidence cannot be authoritative`);
      }
      const hasAuthoritativeEvidence = evidence.some((item) => item && item.authoritative === true
        && item.completeness === 'complete' && AUTHORITATIVE_EVIDENCE_TYPES.includes(item.type));
      if (fingerprint.authoritative !== hasAuthoritativeEvidence) {
        issues.push(`${fingerprintLabel} authority does not match its complete authoritative evidence`);
      }
    });
  });
  return issues;
}

function familyVersionSchemaIds(family) {
  return uniqueStrings((family && Array.isArray(family.versions) ? family.versions : [])
    .map((version) => version && version.schemaId));
}

function validateSchemaFamilies(inventory, entries) {
  if (!Array.isArray(inventory && inventory.schemaFamilies)) return ['schemaFamilies must be an array'];
  const issues = [];
  const entryById = new Map(entries.filter(isRecord).map((entry) => [entry.schemaId, entry]));
  const entriesByFamily = new Map();
  entries.filter(isRecord).forEach((entry) => {
    if (!entriesByFamily.has(entry.familyId)) entriesByFamily.set(entry.familyId, []);
    entriesByFamily.get(entry.familyId).push(entry);
  });
  const familyById = new Map();

  inventory.schemaFamilies.forEach((family, index) => {
    const label = isNonEmptyString(family && family.familyId) ? family.familyId : `schemaFamilies[${index}]`;
    if (!isRecord(family) || !isNonEmptyString(family.familyId)) {
      issues.push(`${label} has no familyId`);
      return;
    }
    if (familyById.has(family.familyId)) issues.push(`${label} is declared more than once`);
    familyById.set(family.familyId, family);
    if (!Number.isInteger(family.currentVersion) || family.currentVersion < 1) {
      issues.push(`${label}.currentVersion must be a positive integer`);
    }
    if (!isNonEmptyString(family.activeSchemaId)) issues.push(`${label}.activeSchemaId is missing`);
    if (!Array.isArray(family.versions) || family.versions.length === 0) {
      issues.push(`${label}.versions must be non-empty`);
      return;
    }
    const actualEntries = entriesByFamily.get(family.familyId) || [];
    if (!sameStringSet(familyVersionSchemaIds(family), actualEntries.map((entry) => entry.schemaId))) {
      issues.push(`${label}.versions must be the full authoritative set of family entries`);
    }
    const managedEntries = actualEntries.filter((entry) => entry.aliasOf === null);
    const active = managedEntries.filter((entry) => entry.lifecycle && entry.lifecycle.status === 'active');
    if (managedEntries.length > 0 && active.length !== 1) {
      issues.push(`${label} must have exactly one current non-alias schema`);
    }
    const activeEntry = entryById.get(family.activeSchemaId);
    if (!activeEntry || activeEntry.familyId !== family.familyId
      || managedEntries.length > 0 && (activeEntry.aliasOf !== null
        || !activeEntry.lifecycle || activeEntry.lifecycle.status !== 'active')) {
      issues.push(`${label}.activeSchemaId must identify the family current schema`);
    } else if (activeEntry.version !== family.currentVersion) {
      issues.push(`${label}.currentVersion does not match activeSchemaId`);
    }
    family.versions.forEach((version, versionIndex) => {
      const versionLabel = `${label}.versions[${versionIndex}]`;
      const entry = version && entryById.get(version.schemaId);
      if (!isRecord(version) || !entry || entry.familyId !== family.familyId) {
        issues.push(`${versionLabel} does not resolve to an entry in this family`);
        return;
      }
      if (version.version !== entry.version
        || !isRecord(version.lifecycle)
        || version.lifecycle.status !== entry.lifecycle.status
        || version.lifecycle.rollout !== entry.lifecycle.rollout
        || version.releasedFingerprintSetHash !== entry.releasedFingerprintSetHash) {
        issues.push(`${versionLabel} does not mirror its entry evolution metadata`);
      }
    });

    if (!Array.isArray(family.tombstones)) {
      issues.push(`${label}.tombstones must be an array`);
    } else {
      const tombstoneKeys = new Set();
      family.tombstones.forEach((tombstone, tombstoneIndex) => {
        const tombstoneLabel = `${label}.tombstones[${tombstoneIndex}]`;
        if (!isRecord(tombstone) || !isNonEmptyString(tombstone.schemaId)
          || !Number.isInteger(tombstone.version) || !isNonEmptyString(tombstone.rationale)) {
          issues.push(`${tombstoneLabel} is incomplete`);
          return;
        }
        const key = `${tombstone.schemaId}\0${tombstone.version}`;
        if (tombstoneKeys.has(key)) issues.push(`${tombstoneLabel} reuses a retired tombstone`);
        tombstoneKeys.add(key);
        const retired = entryById.get(tombstone.schemaId);
        if (retired && (retired.familyId !== family.familyId || retired.version !== tombstone.version
          || !retired.lifecycle || retired.lifecycle.status !== 'retired')) {
          issues.push(`${tombstoneLabel} conflicts with a non-retired inventory entry`);
        }
      });
      actualEntries.filter((entry) => entry.lifecycle && entry.lifecycle.status === 'retired').forEach((entry) => {
        if (!family.tombstones.some((tombstone) => tombstone && tombstone.schemaId === entry.schemaId
          && tombstone.version === entry.version)) {
          issues.push(`${label} is missing the reserved tombstone for ${entry.schemaId}`);
        }
      });
    }
  });

  entriesByFamily.forEach((familyEntries, familyId) => {
    if (!familyById.has(familyId)) issues.push(`schemaFamilies is missing ${familyId}`);
    const liveVersions = new Map();
    familyEntries.filter((entry) => entry.aliasOf === null).forEach((entry) => {
      if (liveVersions.has(entry.version)) {
        issues.push(`${familyId} reuses version ${entry.version} for ${liveVersions.get(entry.version)} and ${entry.schemaId}`);
      }
      liveVersions.set(entry.version, entry.schemaId);
    });
  });
  return issues;
}

function validateAliasAndReplacementGraph(entries) {
  const issues = [];
  const byId = new Map(entries.filter(isRecord).map((entry) => [entry.schemaId, entry]));
  entries.filter(isRecord).forEach((entry) => {
    if (isNonEmptyString(entry.aliasOf)) {
      const target = byId.get(entry.aliasOf);
      if (!target) {
        issues.push(`${entry.schemaId} alias target does not exist: ${entry.aliasOf}`);
      } else {
        if (isNonEmptyString(target.aliasOf)) issues.push(`${entry.schemaId} creates an alias chain through ${target.schemaId}`);
        if (!entryReleasedFingerprint(entry)
          || entryReleasedFingerprint(entry) !== entryReleasedFingerprint(target)) {
          issues.push(`${entry.schemaId} alias does not have the exact authoritative fingerprint set of ${target.schemaId}`);
        }
      }
    }
    if (isNonEmptyString(entry.replacedBy)) {
      const replacement = byId.get(entry.replacedBy);
      if (!replacement || replacement.familyId !== entry.familyId || replacement.version <= entry.version) {
        issues.push(`${entry.schemaId}.replacedBy must target a higher version in the same family`);
      }
      if (!isRecord(entry.replacementDecision)
        || !isNonEmptyString(entry.replacementDecision.compatibility)
        || !isNonEmptyString(entry.replacementDecision.rationale)) {
        issues.push(`${entry.schemaId}.replacedBy needs a compatibility and migration decision`);
      }
    }
  });

  entries.filter(isRecord).forEach((entry) => {
    const visited = new Set([entry.schemaId]);
    let cursor = entry;
    while (cursor && isNonEmptyString(cursor.aliasOf)) {
      if (visited.has(cursor.aliasOf)) {
        issues.push(`${entry.schemaId} participates in an alias cycle`);
        break;
      }
      visited.add(cursor.aliasOf);
      cursor = byId.get(cursor.aliasOf);
    }
  });
  return uniqueStrings(issues);
}

function exactGroupMatchesConsolidation(group, consolidation) {
  return isRecord(group) && isRecord(consolidation)
    && groupFingerprintSetHash(group) === consolidation.fingerprintSetHash
    && sameStringSet(groupSchemaIds(group), consolidation.schemaIds);
}

function validateConsolidations(inventory, entries, duplicateAudit) {
  if (!Array.isArray(inventory && inventory.consolidations)) return ['consolidations must be an array'];
  const issues = [];
  const byId = new Map(entries.filter(isRecord).map((entry) => [entry.schemaId, entry]));
  const consolidationIds = new Set();
  const allowedKinds = new Set(['exact-authoritative', 'overlap', 'insufficient-evidence']);
  const allowedDecisions = new Set(['consolidate', 'distinct-contract', 'defer-insufficient-evidence']);

  inventory.consolidations.forEach((consolidation, index) => {
    const label = isNonEmptyString(consolidation && consolidation.consolidationId)
      ? consolidation.consolidationId
      : `consolidations[${index}]`;
    if (!isRecord(consolidation) || !isNonEmptyString(consolidation.consolidationId)) {
      issues.push(`${label} has no consolidationId`);
      return;
    }
    if (consolidationIds.has(consolidation.consolidationId)) issues.push(`${label} is duplicated`);
    consolidationIds.add(consolidation.consolidationId);
    if (!allowedKinds.has(consolidation.kind)) issues.push(`${label} has invalid kind ${String(consolidation.kind)}`);
    if (consolidation.decision !== null && !allowedDecisions.has(consolidation.decision)) {
      issues.push(`${label} has invalid decision ${String(consolidation.decision)}`);
    }
    if (!Array.isArray(consolidation.schemaIds) || uniqueStrings(consolidation.schemaIds).length < 2
      || consolidation.schemaIds.some((schemaId) => !byId.has(schemaId))) {
      issues.push(`${label}.schemaIds must identify at least two inventoried schemas`);
    }
    if (!ROLLOUT_STATUSES.includes(consolidation.rolloutStatus)) issues.push(`${label} has invalid rolloutStatus`);
    if (!isNonEmptyString(consolidation.rationale)) issues.push(`${label} needs a rationale`);

    if (consolidation.kind === 'exact-authoritative') {
      const isCurrentExactGroup = duplicateAudit.exactGroups.some((group) => exactGroupMatchesConsolidation(group, consolidation));
      const isReleasedExactGroup = isNonEmptyString(consolidation.fingerprintSetHash)
        && consolidation.schemaIds.every((schemaId) => entryReleasedFingerprint(byId.get(schemaId)) === consolidation.fingerprintSetHash);
      if (!isCurrentExactGroup && !isReleasedExactGroup) {
        issues.push(`${label} is not the full set of an exact authoritative fingerprint group`);
      }
      if (!['consolidate', 'distinct-contract'].includes(consolidation.decision)) {
        issues.push(`${label} exact authoritative group needs an explicit decision`);
      }
    }
    if (consolidation.kind === 'overlap' && consolidation.decision === 'consolidate') {
      issues.push(`${label} overlap evidence cannot auto-trigger consolidation`);
    }
    if (consolidation.kind === 'insufficient-evidence'
      && consolidation.decision !== 'defer-insufficient-evidence') {
      issues.push(`${label} partial or non-authoritative evidence must remain deferred`);
    }
    if (consolidation.decision === 'consolidate') {
      if (consolidation.kind !== 'exact-authoritative') {
        issues.push(`${label} may consolidate only a full exact-authoritative group`);
      }
      const canonical = byId.get(consolidation.canonicalSchemaId);
      if (!canonical || !consolidation.schemaIds.includes(consolidation.canonicalSchemaId)) {
        issues.push(`${label} canonicalSchemaId must be a member of the exact group`);
      }
      if (!isNonEmptyString(consolidation.owner)) issues.push(`${label} consolidate decision needs an owner`);
      if (!isNonEmptyString(consolidation.fingerprintSetHash)
        || consolidation.schemaIds.some((schemaId) => entryReleasedFingerprint(byId.get(schemaId)) !== consolidation.fingerprintSetHash)) {
        issues.push(`${label} consolidate decision is not bound to one exact released fingerprint set`);
      }
      consolidation.schemaIds.filter((schemaId) => schemaId !== consolidation.canonicalSchemaId).forEach((schemaId) => {
        if (byId.get(schemaId).aliasOf !== consolidation.canonicalSchemaId) {
          issues.push(`${label} legacy schema ${schemaId} must directly alias ${consolidation.canonicalSchemaId}`);
        }
      });
      const allKnownAliases = entries.filter((entry) => entry && entry.aliasOf === consolidation.canonicalSchemaId
        && entryReleasedFingerprint(entry) === consolidation.fingerprintSetHash).map((entry) => entry.schemaId);
      if (!sameStringSet(consolidation.schemaIds, [consolidation.canonicalSchemaId, ...allKnownAliases])) {
        issues.push(`${label} must contain the full released authoritative alias set`);
      }
    }
  });

  duplicateAudit.exactGroups.forEach((group) => {
    const decision = inventory.consolidations.find((consolidation) => (
      consolidation.kind === 'exact-authoritative' && exactGroupMatchesConsolidation(group, consolidation)
    ));
    if (!decision || !['consolidate', 'distinct-contract'].includes(decision.decision)) {
      issues.push(`new exact authoritative group ${group.groupId || groupFingerprintSetHash(group)} has no decision`);
    }
  });
  return issues;
}

function validateRollout(inventory, entries, duplicateAudit) {
  const issues = [];
  const byId = new Map(entries.filter(isRecord).map((entry) => [entry.schemaId, entry]));
  const legacyReferences = new Map(duplicateAudit.rollout.map((reference) => [reference && reference.schemaId, reference]));
  (Array.isArray(inventory && inventory.consolidations) ? inventory.consolidations : [])
    .filter((consolidation) => consolidation && consolidation.decision === 'consolidate')
    .forEach((consolidation) => {
      const phase = consolidation.rolloutStatus;
      const canonical = byId.get(consolidation.canonicalSchemaId);
      const aliases = (consolidation.schemaIds || [])
        .filter((schemaId) => schemaId !== consolidation.canonicalSchemaId)
        .map((schemaId) => byId.get(schemaId))
        .filter(Boolean);
      if (['dual-read', 'canonical-write', 'complete'].includes(phase)
        && (!canonical || !canonical.lifecycle || canonical.lifecycle.status !== 'active')) {
        issues.push(`${consolidation.consolidationId} ${phase} rollout needs an active canonical schema`);
      }
      if (['dual-read', 'canonical-write', 'complete'].includes(phase)
        && aliases.some((entry) => !entry.lifecycle || entry.lifecycle.status === 'active')) {
        issues.push(`${consolidation.consolidationId} ${phase} rollout must deprecate every legacy alias`);
      }
      if (['canonical-write', 'complete'].includes(phase)) {
        aliases.forEach((entry) => {
          const reference = legacyReferences.get(entry.schemaId);
          const producerPaths = uniqueStrings([
            ...(reference && reference.producerPaths || []),
            ...(entry.usages || []).filter(isProductiveProducer).flatMap((usage) => usage.sourcePaths || [])
          ]);
          if (producerPaths.length > 0) {
            issues.push(`${consolidation.consolidationId} retains productive Legacy producer ${entry.schemaId} at ${producerPaths.join(', ')}`);
          }
        });
      }
      if (phase === 'complete') {
        aliases.forEach((entry) => {
          if (!entry.lifecycle || entry.lifecycle.status !== 'retired') {
            issues.push(`${consolidation.consolidationId} complete rollout must retire ${entry.schemaId}`);
          }
          const productivePaths = uniqueStrings((entry.usages || []).filter(isProductiveUsage)
            .flatMap((usage) => usage.sourcePaths || []));
          if (productivePaths.length > 0) {
            issues.push(`${consolidation.consolidationId} complete rollout retains productive Legacy references for ${entry.schemaId}`);
          }
        });
      }
    });
  return issues;
}

function referenceValues(reference) {
  if (!isRecord(reference)) return [];
  const fields = [
    'reference',
    'target',
    'module',
    'export',
    'exportName',
    'symbol',
    'member',
    'name',
    'path',
    'pointer',
    'command',
    'event',
    'global'
  ];
  return fields
    .flatMap((field) => {
      const value = reference[field];
      if (Array.isArray(value)) return value.filter(isNonEmptyString);
      return isNonEmptyString(value) ? [value] : [];
    })
    .map((value) => value.trim());
}

function referenceText(reference) {
  return [reference && reference.type, ...referenceValues(reference)].filter(Boolean).join(' ');
}

function usageReferenceText(usages) {
  return usages
    .flatMap((usage) => Array.isArray(usage.interfaceReferences) ? usage.interfaceReferences : [])
    .map(referenceText)
    .join('\n');
}

function usageHasReferenceType(usages, type) {
  return usages.some((usage) => (
    Array.isArray(usage.interfaceReferences)
    && usage.interfaceReferences.some((reference) => reference && reference.type === type)
  ));
}

function findReviewContaining(reviews, schemaIds) {
  return reviews.find((review) => {
    const reviewedIds = new Set(Array.isArray(review && review.schemaIds) ? review.schemaIds : []);
    return schemaIds.every((schemaId) => reviewedIds.has(schemaId));
  });
}

function isDocumentedReview(review) {
  return isRecord(review)
    && review.baselineAccepted === true
    && isNonEmptyString(review.rationale)
    && isRecord(review.resolution)
    && isNonEmptyString(review.resolution.kind)
    && isNonEmptyString(review.resolution.rationale);
}

function validateShapePolicy(entry, label, fingerprintHashes) {
  const issues = [];
  const policy = entry.shapePolicy;
  const fingerprintSet = new Set(fingerprintHashes);
  if (!isRecord(policy)
    || !['single', 'polymorphic', 'unresolved', 'review-required'].includes(policy.mode)
    || !isNonEmptyString(policy.rationale)) {
    return [`${label} has invalid shapePolicy`];
  }

  const accepted = policy.acceptedFingerprints;
  if (!Array.isArray(accepted) || accepted.some((hash) => !isNonEmptyString(hash))) {
    issues.push(`${label} shapePolicy.acceptedFingerprints must be a string array`);
  }
  const acceptedHashes = Array.isArray(accepted) ? accepted : [];
  if (new Set(acceptedHashes).size !== acceptedHashes.length) {
    issues.push(`${label} shapePolicy.acceptedFingerprints contains duplicates`);
  }
  acceptedHashes.forEach((hash) => {
    if (!fingerprintSet.has(hash)) issues.push(`${label} shapePolicy accepts unknown fingerprint ${hash}`);
  });

  if (fingerprintHashes.length === 0) {
    if (policy.mode !== 'unresolved') issues.push(`${label} with no fingerprints must use shapePolicy.mode unresolved`);
    if (acceptedHashes.length > 0) issues.push(`${label} cannot accept fingerprints when no shape is available`);
  } else if (fingerprintHashes.length === 1) {
    if (policy.mode !== 'single') issues.push(`${label} with one fingerprint must use shapePolicy.mode single`);
    if (acceptedHashes.length !== 1 || acceptedHashes[0] !== fingerprintHashes[0]) {
      issues.push(`${label} single shapePolicy must accept its only fingerprint`);
    }
  } else if (policy.mode === 'review-required') {
    if (acceptedHashes.length > 0) issues.push(`${label} review-required shapePolicy cannot pre-accept fingerprints`);
    issues.push(`${label} has multiple shapes and still requires an explicit polymorphic decision`);
  } else if (policy.mode !== 'polymorphic') {
    issues.push(`${label} with multiple fingerprints must use polymorphic or review-required mode`);
  } else {
    if (!isNonEmptyString(policy.decision)) {
      issues.push(`${label} polymorphic shapePolicy needs an explicit decision`);
    }
    const expected = fingerprintHashes.slice().sort();
    const actual = acceptedHashes.slice().sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      issues.push(`${label} polymorphic decision must list every current hash in acceptedFingerprints`);
    }
  }
  return issues;
}

function validateEntryStructure(entries, rootDir) {
  const fieldIssues = [];
  const descriptionIssues = [];
  const pathIssues = [];
  const referenceIssues = [];
  const fingerprintIssues = [];
  const allowedReferenceTypes = new Set(INTERFACE_REFERENCE_TYPES);
  const interfaceResolver = createInterfaceResolver(rootDir);

  entries.forEach((entry, entryIndex) => {
    const label = isNonEmptyString(entry && entry.schemaId)
      ? entry.schemaId
      : `entries[${entryIndex}]`;

    if (!isRecord(entry)) {
      fieldIssues.push(`${label} is not an object`);
      return;
    }
    if (!isNonEmptyString(entry.schemaId)) fieldIssues.push(`${label} has no schemaId`);
    if (!Array.isArray(entry.kinds) || entry.kinds.length === 0 || entry.kinds.some((kind) => !isNonEmptyString(kind))) {
      fieldIssues.push(`${label} has invalid kinds`);
    }
    if (!isNonEmptyString(entry.status)) fieldIssues.push(`${label} has no status`);
    if (!looksLikeEnglishDescription(entry.description)) descriptionIssues.push(`${label} needs a curated English description`);
    if (!['accepted-initial-audit', 'curated'].includes(entry.descriptionStatus)) {
      descriptionIssues.push(`${label} description is not accepted in the JSON source of truth`);
    }

    const canonical = entry.canonicalDefinition;
    if (canonical === null) {
      if (entry.status !== 'generated-mirror') fieldIssues.push(`${label} may omit canonicalDefinition only as a generated-mirror`);
    } else if (!isRecord(canonical)) {
      fieldIssues.push(`${label} has no canonicalDefinition`);
    } else {
      if (!isNonEmptyString(canonical.path)) fieldIssues.push(`${label} canonicalDefinition has no path`);
      if (!hasOwn(canonical, 'symbol') || (canonical.symbol !== null && !isNonEmptyString(canonical.symbol))) {
        fieldIssues.push(`${label} canonicalDefinition has no explicit symbol`);
      }
      ['definitionType', 'role', 'visibility'].forEach((field) => {
        if (!isNonEmptyString(canonical[field])) fieldIssues.push(`${label} canonicalDefinition has no ${field}`);
      });
      if (isNonEmptyString(canonical.path) && !isRepoLocalExistingPath(canonical.path, rootDir)) {
        pathIssues.push(`${label} canonical path does not exist: ${canonical.path}`);
      }
      if (canonical.visibility === 'generated' || canonical.role === 'generated-mirror') {
        fieldIssues.push(`${label} cannot use a generated mirror as canonicalDefinition`);
      }
    }

    if (!Array.isArray(entry.usages) || entry.usages.length === 0) {
      fieldIssues.push(`${label} has no usages`);
    } else {
      entry.usages.forEach((usage, usageIndex) => {
        const usageLabel = `${label} usage[${usageIndex}]`;
        if (!isRecord(usage)) {
          fieldIssues.push(`${usageLabel} is not an object`);
          return;
        }
        ['application', 'role', 'visibility'].forEach((field) => {
          if (!isNonEmptyString(usage[field])) fieldIssues.push(`${usageLabel} has no ${field}`);
        });
        if (!Array.isArray(usage.sourcePaths) || usage.sourcePaths.length === 0) {
          fieldIssues.push(`${usageLabel} has no sourcePaths`);
        } else {
          usage.sourcePaths.forEach((sourcePath) => {
            if (!isRepoLocalExistingPath(sourcePath, rootDir)) {
              pathIssues.push(`${usageLabel} source path does not exist: ${sourcePath}`);
            }
          });
        }
        if (!Array.isArray(usage.interfaceReferences)) {
          fieldIssues.push(`${usageLabel} has no interfaceReferences array`);
        } else {
          usage.interfaceReferences.forEach((reference, referenceIndex) => {
            const refLabel = `${usageLabel} interfaceReferences[${referenceIndex}]`;
            if (!isRecord(reference)) {
              referenceIssues.push(`${refLabel} is not an object`);
              return;
            }
            if (!allowedReferenceTypes.has(reference.type)) {
              referenceIssues.push(`${refLabel} has unsupported type ${String(reference.type)}`);
            }
            if (referenceValues(reference).length === 0) {
              referenceIssues.push(`${refLabel} has no qualified target`);
            }
            if (allowedReferenceTypes.has(reference.type)) {
              referenceIssues.push(...interfaceResolver.resolve(reference, usage, refLabel));
            }
          });
        }
      });
    }

    if (!Array.isArray(entry.shapeFingerprints)) {
      fieldIssues.push(`${label} has no shapeFingerprints array`);
    } else {
      const fingerprintHashes = [];
      entry.shapeFingerprints.forEach((fingerprint, fingerprintIndex) => {
        const fingerprintLabel = `${label} shapeFingerprints[${fingerprintIndex}]`;
        if (!isRecord(fingerprint) || !isNonEmptyString(fingerprint.hash) || !hasOwn(fingerprint, 'shape')) {
          fieldIssues.push(`${fingerprintLabel} is incomplete`);
          return;
        }
        fingerprintHashes.push(fingerprint.hash);
        const expectedHash = shapeFingerprint(fingerprint.shape);
        if (fingerprint.hash !== expectedHash) {
          fingerprintIssues.push(`${fingerprintLabel} hash does not match its stored shape (expected ${expectedHash})`);
        }
        if (!Array.isArray(fingerprint.sourcePaths) || !Array.isArray(fingerprint.symbols)) {
          fieldIssues.push(`${fingerprintLabel} has invalid provenance`);
          return;
        }
        fingerprint.sourcePaths.forEach((sourcePath) => {
          if (!isRepoLocalExistingPath(sourcePath, rootDir)) {
            pathIssues.push(`${fingerprintLabel} source path does not exist: ${sourcePath}`);
          }
        });
      });
      if (new Set(fingerprintHashes).size !== fingerprintHashes.length) {
        fingerprintIssues.push(`${label} contains duplicate fingerprint hashes`);
      }
      fingerprintIssues.push(...validateShapePolicy(entry, label, fingerprintHashes));
    }
  });

  return { fieldIssues, descriptionIssues, pathIssues, referenceIssues, fingerprintIssues };
}

function validateNativeFirstSubset(inventoryIds, packageManifest) {
  const issues = [];
  const metadata = packageManifest
    && packageManifest.xtend
    && packageManifest.xtend.nativeFirstContractRegistry;
  if (!isRecord(metadata)) return ['package.json has no xtend.nativeFirstContractRegistry metadata'];

  const expected = new Set();
  ['schema', 'entrySchema', 'registrySchema', 'driftReportSchema', 'reportSchema'].forEach((field) => {
    if (isNonEmptyString(metadata[field])) expected.add(metadata[field]);
    else issues.push(`nativeFirstContractRegistry.${field} is missing`);
  });
  (Array.isArray(metadata.entries) ? metadata.entries : []).forEach((entry, index) => {
    ['contractId', 'reportSchema'].forEach((field) => {
      if (isNonEmptyString(entry && entry[field])) expected.add(entry[field]);
      else issues.push(`nativeFirstContractRegistry.entries[${index}].${field} is missing`);
    });
  });
  (Array.isArray(metadata.crossDomainContracts) ? metadata.crossDomainContracts : [])
    .filter(isNonEmptyString)
    .forEach((schemaId) => expected.add(schemaId));

  expected.forEach((schemaId) => {
    if (!inventoryIds.has(schemaId)) issues.push(`inventory is missing Native-First registry schema ${schemaId}`);
  });
  return issues;
}

function validateGateIntegration(packageManifest, rootDir) {
  const issues = [];
  const scripts = isRecord(packageManifest && packageManifest.scripts) ? packageManifest.scripts : {};
  const tokenCount = (scriptName) => String(scripts[scriptName] || '')
    .split(/\s+/u)
    .filter((token) => token === SUITE_ID)
    .length;

  if (scripts['test:schema-inventory'] !== 'node scripts/run_xtend_tests.js schema-inventory') {
    issues.push('test:schema-inventory must expose the isolated runner suite');
  }
  if (!String(scripts['test:schema-inventory:report'] || '').endsWith(`--report ${INVENTORY_REPORT_PATH}`)) {
    issues.push(`test:schema-inventory:report must write ${INVENTORY_REPORT_PATH}`);
  }
  if (scripts['test:schema-inventory:audit'] !== 'node scripts/scan_schema_inventory.js --audit-duplicates --json') {
    issues.push('test:schema-inventory:audit must expose the read-only duplicate audit');
  }
  [
    'test:pr',
    'test:pr:report',
    'test:release:full',
    'test:release:full:report',
    'release:report'
  ].forEach((scriptName) => {
    if (tokenCount(scriptName) !== 1) issues.push(`${scriptName} must include schema-inventory exactly once`);
  });

  const gateMatrix = packageManifest
    && packageManifest.xtend
    && packageManifest.xtend.ciGateMatrix;
  ['prFastGate', 'fullReleaseGate'].forEach((gateName) => {
    const gate = gateMatrix && gateMatrix[gateName];
    const suites = gate && gate.suites;
    if (!Array.isArray(suites) || suites.filter((suiteId) => suiteId === SUITE_ID).length !== 1) {
      issues.push(`xtend.ciGateMatrix.${gateName}.suites must include schema-inventory exactly once`);
    }
    if (!gate || !Array.isArray(gate.additionalReportPaths) || !gate.additionalReportPaths.includes(INVENTORY_REPORT_PATH)) {
      issues.push(`xtend.ciGateMatrix.${gateName}.additionalReportPaths must upload ${INVENTORY_REPORT_PATH}`);
    }
  });
  const workflowPath = '.github/workflows/xtend-default-gates.yml';
  const workflow = isRepoLocalExistingPath(workflowPath, rootDir)
    ? fs.readFileSync(path.join(rootDir, workflowPath), 'utf8')
    : '';
  if (workflow.split(INVENTORY_REPORT_PATH).length - 1 < 2) {
    issues.push(`PR and release workflow artifacts must both upload ${INVENTORY_REPORT_PATH}`);
  }
  return issues;
}

function validateXKeymapInventory(entries) {
  const issues = [];
  const entry = entries.find((candidate) => candidate && candidate.schemaId === XKEYMAP_CONTRACT);
  if (!entry) return [`inventory is missing ${XKEYMAP_CONTRACT}`];

  const usages = Array.isArray(entry.usages) ? entry.usages : [];
  const xcommandUsages = usages.filter((usage) => String(usage && usage.application).toLowerCase() === 'xcommand');
  const xkeymapUsages = usages.filter((usage) => String(usage && usage.application).toLowerCase() === 'xkeymap');
  if (xcommandUsages.length === 0) issues.push(`${XKEYMAP_CONTRACT} has no XCommand application`);
  if (xkeymapUsages.length === 0) issues.push(`${XKEYMAP_CONTRACT} has no XKeymap application`);

  const xcommandRefs = usageReferenceText(xcommandUsages);
  const xkeymapRefs = usageReferenceText(xkeymapUsages);
  [
    '@ccslabs/xtend/xcommand',
    'XKEYMAP_SURFACE_CONTRACT',
    'XKeymapEntry',
    'createXKeymapModel',
    'createXCommandKernel',
    'getKeymap'
  ].forEach((reference) => {
    if (!xcommandRefs.includes(reference)) issues.push(`XCommand usage lacks qualified reference ${reference}`);
  });
  if (!usageHasReferenceType(xcommandUsages, 'package-export')) issues.push('XCommand usage lacks a package-export reference');
  if (!usageHasReferenceType(xcommandUsages, 'symbol')) issues.push('XCommand usage lacks symbol references');

  [
    '@ccslabs/xtend/components/xkeymap.js',
    'XKeymapElement',
    'x-keymap',
    'entries',
    'open',
    'close'
  ].forEach((reference) => {
    if (!xkeymapRefs.includes(reference)) issues.push(`XKeymap usage lacks qualified reference ${reference}`);
  });
  ['package-export', 'symbol', 'custom-element'].forEach((type) => {
    if (!usageHasReferenceType(xkeymapUsages, type)) issues.push(`XKeymap usage lacks a ${type} reference`);
  });
  return issues;
}

function validateCleanupMvp(inventory, entries, packageManifest, rootDir, duplicateAudit) {
  const issues = [];
  const byId = new Map(entries.filter(isRecord).map((entry) => [entry.schemaId, entry]));
  const canonical = byId.get(HOST_RESOURCE_CLEANUP_SCHEMA);
  const separateHostController = byId.get(HOST_CONTROLLER_CLEANUP_SCHEMA);
  const expectedGroup = [HOST_RESOURCE_CLEANUP_SCHEMA, ...HOST_RESOURCE_CLEANUP_LEGACY_ALIASES];

  if (!canonical) {
    issues.push(`inventory is missing ${HOST_RESOURCE_CLEANUP_SCHEMA}`);
  } else {
    if (canonical.familyId !== HOST_RESOURCE_CLEANUP_FAMILY_ID || canonical.version !== 1) {
      issues.push(`${HOST_RESOURCE_CLEANUP_SCHEMA} has invalid family/version metadata`);
    }
    if (canonical.aliasOf !== null || !canonical.lifecycle || canonical.lifecycle.status !== 'active') {
      issues.push(`${HOST_RESOURCE_CLEANUP_SCHEMA} must be the active canonical schema`);
    }
    if (!isNonEmptyString(canonical.releasedFingerprintSetHash)) {
      issues.push(`${HOST_RESOURCE_CLEANUP_SCHEMA} needs a released authoritative fingerprint`);
    }
    const canonicalPath = canonical.canonicalDefinition && canonical.canonicalDefinition.path;
    if (![HOST_RESOURCE_CLEANUP_RUNTIME_PATH, HOST_RESOURCE_CLEANUP_TYPES_PATH].includes(canonicalPath)) {
      issues.push(`${HOST_RESOURCE_CLEANUP_SCHEMA} must be defined by the common cleanup runtime or types`);
    }
  }

  HOST_RESOURCE_CLEANUP_LEGACY_ALIASES.forEach((schemaId) => {
    const alias = byId.get(schemaId);
    if (!alias) {
      issues.push(`inventory is missing cleanup alias ${schemaId}`);
      return;
    }
    if (alias.aliasOf !== HOST_RESOURCE_CLEANUP_SCHEMA) {
      issues.push(`${schemaId} must directly alias ${HOST_RESOURCE_CLEANUP_SCHEMA}`);
    }
    if (!alias.lifecycle || !['deprecated', 'retired'].includes(alias.lifecycle.status)) {
      issues.push(`${schemaId} must be deprecated or retired`);
    }
    if (!canonical || !alias.releasedFingerprintSetHash
      || alias.releasedFingerprintSetHash !== canonical.releasedFingerprintSetHash) {
      issues.push(`${schemaId} must preserve the canonical exact released fingerprint`);
    }
  });

  if (!separateHostController) {
    issues.push(`inventory is missing separate contract ${HOST_CONTROLLER_CLEANUP_SCHEMA}`);
  } else if (separateHostController.aliasOf !== null
    || separateHostController.familyId === HOST_RESOURCE_CLEANUP_FAMILY_ID
    || canonical && separateHostController.releasedFingerprintSetHash === canonical.releasedFingerprintSetHash) {
    issues.push(`${HOST_CONTROLLER_CLEANUP_SCHEMA} must remain a separate, non-alias contract`);
  }

  const cleanupConsolidation = (Array.isArray(inventory && inventory.consolidations) ? inventory.consolidations : [])
    .find((consolidation) => consolidation && consolidation.decision === 'consolidate'
      && consolidation.canonicalSchemaId === HOST_RESOURCE_CLEANUP_SCHEMA);
  if (!cleanupConsolidation || cleanupConsolidation.kind !== 'exact-authoritative'
    || !sameStringSet(cleanupConsolidation.schemaIds, expectedGroup)
    || !canonical || cleanupConsolidation.fingerprintSetHash !== canonical.releasedFingerprintSetHash
    || !['canonical-write', 'complete'].includes(cleanupConsolidation.rolloutStatus)) {
    issues.push('Cleanup MVP needs one exact six-ID consolidation at canonical-write or complete');
  }
  const compatibilityWindow = cleanupConsolidation && cleanupConsolidation.compatibilityWindow;
  if (!isRecord(compatibilityWindow)
    || compatibilityWindow.startsAt !== 'canonical-write-release'
    || compatibilityWindow.requiredMinorReleaseWindows !== 2
    || compatibilityWindow.removalEarliest !== 'next-major-after-two-minor-release-windows') {
    issues.push('Cleanup MVP must reserve both minor compatibility windows and defer removal to the following major');
  }
  const currentExactGroup = duplicateAudit.exactGroups.find((group) => groupSchemaIds(group).includes(HOST_RESOURCE_CLEANUP_SCHEMA));
  if (currentExactGroup && !sameStringSet(groupSchemaIds(currentExactGroup), expectedGroup)) {
    issues.push('Cleanup MVP exact authoritative group is not the full canonical plus five-alias set');
  }

  const packageManifests = discoverPackageManifests(rootDir);
  HOST_RESOURCE_CLEANUP_PRODUCERS.forEach((producer) => {
    const exportedTargets = exportedTargetsForModule(producer.module, packageManifests, rootDir);
    if (!exportedTargets.includes(producer.path) || !exportedTargets.includes(producer.typesPath)) {
      issues.push(`${producer.module} must export its cleanup runtime and types API`);
    }
    const source = readSourceText(producer.path, rootDir, new Map());
    const types = readSourceText(producer.typesPath, rootDir, new Map());
    [
      "require('./host-resource-cleanup-record')",
      'XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA',
      'createHostResourceCleanupRecord',
      'resolveHostResourceCleanupSchema'
    ].forEach((token) => {
      if (!source || !source.includes(token)) issues.push(`${producer.path} does not expose/use ${token}`);
    });
    const factoryCallCount = (source && source.match(/createHostResourceCleanupRecord\s*\(/gu) || []).length;
    if (factoryCallCount < producer.legacySchemaIds.length) {
      issues.push(`${producer.path} does not route every cleanup producer through the canonical factory`);
    }
    producer.legacySchemaIds.forEach((schemaId) => {
      if (source && source.includes(schemaId)) issues.push(`${producer.path} still productively writes Legacy schema ${schemaId}`);
    });
    [
      'HostResourceCleanupRecord',
      'HostResourceCleanupRecordInput',
      'HostResourceCleanupSchemaResolution',
      'XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA',
      'resolveHostResourceCleanupSchema'
    ].forEach((token) => {
      if (!types || !types.includes(token)) issues.push(`${producer.typesPath} does not surface ${token}`);
    });
    try {
      const producerApi = require(resolveRepoPath(producer.path, rootDir));
      if (producerApi.XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA !== HOST_RESOURCE_CLEANUP_SCHEMA
        || typeof producerApi.resolveHostResourceCleanupSchema !== 'function') {
        issues.push(`${producer.module} runtime API does not re-export the canonical constant and resolver`);
      }
    } catch (error) {
      issues.push(`${producer.module} runtime API is not loadable: ${error.message}`);
    }
  });

  const commonTypes = readSourceText(HOST_RESOURCE_CLEANUP_TYPES_PATH, rootDir, new Map());
  [
    'HostResourceCleanupRecord',
    'HostResourceCleanupRecordInput',
    'HostResourceCleanupSchemaResolution',
    'HostResourceCleanupSchemaId',
    'HostResourceCleanupLegacySchemaId'
  ].forEach((symbol) => {
    if (!commonTypes || !sourceContainsToken(commonTypes, symbol)) {
      issues.push(`${HOST_RESOURCE_CLEANUP_TYPES_PATH} is missing ${symbol}`);
    }
  });

  try {
    const cleanupApi = require(resolveRepoPath(HOST_RESOURCE_CLEANUP_RUNTIME_PATH, rootDir));
    if (cleanupApi.XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA !== HOST_RESOURCE_CLEANUP_SCHEMA
      || !sameStringSet(cleanupApi.XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS, HOST_RESOURCE_CLEANUP_LEGACY_ALIASES)) {
      issues.push('cleanup factory exports do not declare the canonical ID and exact five Legacy IDs');
    }
    const record = cleanupApi.createHostResourceCleanupRecord({
      hostId: 'suite-host',
      surfaceId: 'suite-surface',
      xtensionId: 'suite-xtension',
      resource: 'suite-resource',
      sequence: 1,
      timestamp: '2026-07-13T00:00:00.000Z'
    });
    if (JSON.stringify(Object.keys(record)) !== JSON.stringify([
      'schema', 'hostId', 'surfaceId', 'xtensionId', 'resource', 'status', 'sequence', 'timestamp'
    ]) || record.schema !== HOST_RESOURCE_CLEANUP_SCHEMA || record.status !== 'released') {
      issues.push('cleanup factory does not emit the exact canonical eight-field record');
    }
    const canonicalResolution = cleanupApi.resolveHostResourceCleanupSchema(HOST_RESOURCE_CLEANUP_SCHEMA);
    if (!canonicalResolution || canonicalResolution.canonicalSchemaId !== HOST_RESOURCE_CLEANUP_SCHEMA
      || canonicalResolution.isLegacy !== false || canonicalResolution.deprecated !== false) {
      issues.push('cleanup resolver does not preserve the canonical ID');
    }
    HOST_RESOURCE_CLEANUP_LEGACY_ALIASES.forEach((schemaId) => {
      const resolution = cleanupApi.resolveHostResourceCleanupSchema(schemaId);
      if (!resolution || resolution.canonicalSchemaId !== HOST_RESOURCE_CLEANUP_SCHEMA
        || resolution.inputSchemaId !== schemaId || resolution.isLegacy !== true || resolution.deprecated !== true) {
        issues.push(`cleanup resolver does not map Legacy ID ${schemaId}`);
      }
    });
    if (cleanupApi.resolveHostResourceCleanupSchema(HOST_CONTROLLER_CLEANUP_SCHEMA) !== null) {
      issues.push(`cleanup resolver must reject separate contract ${HOST_CONTROLLER_CLEANUP_SCHEMA}`);
    }
  } catch (error) {
    issues.push(`common cleanup factory/resolver is not loadable: ${error.message}`);
  }
  return issues;
}

function validateKnownReviews(inventory, entries) {
  const issues = [];
  const reviews = Array.isArray(inventory.duplicateReviews) ? inventory.duplicateReviews : [];
  if (!Array.isArray(inventory.duplicateReviews)) issues.push('duplicateReviews must be an array');

  [XCOMMAND_CONTRACT, XKEYMAP_CONTRACT].forEach((schemaId) => {
    const entry = entries.find((candidate) => candidate && candidate.schemaId === schemaId);
    if (!entry) {
      issues.push(`inventory is missing ${schemaId}`);
      return;
    }
    if (!entry.shapePolicy || entry.shapePolicy.mode !== 'polymorphic') {
      issues.push(`${schemaId} must document shapePolicy.mode polymorphic`);
    }
    const review = findReviewContaining(reviews, [schemaId]);
    if (!isDocumentedReview(review)) {
      issues.push(`${schemaId} needs a documented duplicate review`);
    }
  });

  const cleanupReview = findReviewContaining(reviews, HOST_RESOURCE_CLEANUP_LEGACY_ALIASES);
  if (!isDocumentedReview(cleanupReview)) {
    issues.push('XTensions cleanup schemas need one documented family review');
  }

  const a11yReview = findReviewContaining(reviews, A11Y_PROFILE_FAMILY);
  if (!isDocumentedReview(a11yReview)) {
    issues.push('A11y component-profile/profile schemas need one documented review');
  }

  PARALLEL_NEGATIVE_FIXTURE_PAIRS.forEach((schemaIds) => {
    const review = findReviewContaining(reviews, schemaIds);
    if (!isDocumentedReview(review)) {
      issues.push(`parallel negative fixtures need a documented review: ${schemaIds.join(', ')}`);
    }
  });
  return issues;
}

function validateFormalJsonSchema(entries) {
  const entry = entries.find((candidate) => candidate && candidate.schemaId === FORMAL_JSON_SCHEMA_ID);
  if (!entry) return [`inventory is missing formal JSON Schema ${FORMAL_JSON_SCHEMA_ID}`];
  const issues = [];
  if (!Array.isArray(entry.kinds) || !entry.kinds.includes('json-schema')) {
    issues.push(`${FORMAL_JSON_SCHEMA_ID} must have kind json-schema`);
  }
  if (!entry.canonicalDefinition || entry.canonicalDefinition.path !== 'xtendrmt/rmt.schema.json') {
    issues.push(`${FORMAL_JSON_SCHEMA_ID} must be canonical at xtendrmt/rmt.schema.json`);
  }
  return issues;
}

function validationIssueText(issue) {
  if (typeof issue === 'string') return issue;
  if (!isRecord(issue)) return String(issue);
  return [issue.code, issue.schemaId, issue.path, issue.message].filter(isNonEmptyString).join(' | ');
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateNegativeGateBehavior(inventory, scan, rootDir) {
  const issues = [];
  const validationErrors = (document, scanned = scan) => {
    const result = validateInventoryDocument(document, scanned, { rootDir });
    return Array.isArray(result && result.errors) ? result.errors : [];
  };
  const rejectsAs = (document, codes, pattern, scanned = scan) => validationErrors(document, scanned).some((entry) => (
    codes.includes(entry && entry.code) || pattern.test(validationIssueText(entry))
  ));

  const missingEntry = cloneJson(inventory);
  missingEntry.entries.shift();
  if (!rejectsAs(missingEntry, ['coverage-missing-schema'], /coverage|missing schema/iu)) {
    issues.push('removing an inventory entry does not fail scan coverage');
  }

  const invalidPath = cloneJson(inventory);
  invalidPath.entries[0].usages[0].sourcePaths.push('does/not/exist.schema-inventory-fixture');
  if (!rejectsAs(invalidPath, ['missing-usage-path'], /usage path/iu)) {
    issues.push('an invalid usage path does not fail validation');
  }

  const fingerprintEntry = inventory.entries.find((entry) => Array.isArray(entry.shapeFingerprints) && entry.shapeFingerprints.length > 0);
  if (fingerprintEntry) {
    const tamperedShape = cloneJson(inventory);
    const target = tamperedShape.entries.find((entry) => entry.schemaId === fingerprintEntry.schemaId);
    target.shapeFingerprints[0].shape.signature = `${target.shapeFingerprints[0].shape.signature}|tampered:unknown`;
    if (!rejectsAs(tamperedShape, ['invalid-shape-hash'], /shape.*hash|fingerprint/iu)) {
      issues.push('tampered normalized shape content does not fail its fingerprint hash');
    }
  }

  const statusDrift = cloneJson(inventory);
  statusDrift.entries[0].status = statusDrift.entries[0].status === 'active' ? 'test-only' : 'active';
  if (!rejectsAs(statusDrift, ['classification-status-drift'], /status.*classification|classification.*status/iu)) {
    issues.push('lifecycle curation can incorrectly overwrite the static scan status');
  }

  const minorVersion = cloneJson(inventory);
  minorVersion.entries[0].schemaId = 'xtend.schema-inventory.invalid-minor-version.v1.2';
  minorVersion.entries[0].familyId = 'xtend.schema-inventory.invalid-minor-version';
  minorVersion.entries[0].version = 1;
  if (!rejectsAs(minorVersion, ['invalid-family-version'], /major-only|family.*version/iu)) {
    issues.push('minor schema version suffixes are not rejected by the major-only policy');
  }

  const exactDecision = (inventory.consolidations || []).find((consolidation) => (
    consolidation && consolidation.kind === 'exact-authoritative' && consolidation.decision
  ));
  if (exactDecision) {
    const unresolvedExact = cloneJson(inventory);
    unresolvedExact.consolidations.find((consolidation) => (
      consolidation.consolidationId === exactDecision.consolidationId
    )).decision = null;
    if (!rejectsAs(unresolvedExact, ['unresolved-exact-consolidation'], /exact.*decision|decision.*exact/iu)) {
      issues.push('removing a new exact-group decision does not block validation');
    }
  } else {
    issues.push('inventory has no decided exact group available for the negative decision probe');
  }

  const insufficient = (inventory.consolidations || []).find((consolidation) => (
    consolidation && consolidation.kind === 'insufficient-evidence'
  ));
  if (insufficient) {
    const unsafeMerge = cloneJson(inventory);
    const target = unsafeMerge.consolidations.find((consolidation) => (
      consolidation.consolidationId === insufficient.consolidationId
    ));
    target.decision = 'consolidate';
    target.canonicalSchemaId = target.schemaIds[0];
    target.owner = 'negative-probe';
    if (!rejectsAs(unsafeMerge, ['invalid-consolidation'], /consolidat|fingerprint|authoritative/iu)) {
      issues.push('partial/test/docs/generated evidence can incorrectly trigger consolidation');
    }
  }

  const aliasIds = inventory.entries.filter((entry) => isNonEmptyString(entry && entry.aliasOf)).map((entry) => entry.schemaId);
  if (aliasIds.length >= 4) {
    const invalidAliases = cloneJson(inventory);
    const aliasEntries = aliasIds.slice(0, 4).map((schemaId) => invalidAliases.entries.find((entry) => entry.schemaId === schemaId));
    aliasEntries[0].aliasOf = 'xtend.schema-inventory.missing-alias-target.v1';
    aliasEntries[1].aliasOf = aliasEntries[2].schemaId;
    const cycleTarget = invalidAliases.entries.find((entry) => entry.schemaId === aliasEntries[3].aliasOf);
    if (cycleTarget) cycleTarget.aliasOf = aliasEntries[3].schemaId;
    const aliasErrors = validationErrors(invalidAliases);
    const aliasCodes = new Set(aliasErrors.map((entry) => entry && entry.code));
    if (!aliasCodes.has('alias-target-missing')) issues.push('missing alias targets are not rejected');
    if (!aliasCodes.has('alias-chain')) issues.push('alias chains are not rejected');
    if (!aliasCodes.has('alias-cycle')) issues.push('alias cycles are not rejected');
  } else {
    issues.push('inventory has too few aliases for target/chain/cycle negative probes');
  }

  const releasedAlias = inventory.entries.find((entry) => isNonEmptyString(entry && entry.aliasOf));
  if (releasedAlias) {
    const fingerprintMismatch = cloneJson(inventory);
    const alias = fingerprintMismatch.entries.find((entry) => entry.schemaId === releasedAlias.schemaId);
    alias.releasedFingerprintSetHash = `sha256:${'0'.repeat(64)}`;
    alias.shapePolicy.releasedFingerprintSetHash = alias.releasedFingerprintSetHash;
    if (!rejectsAs(fingerprintMismatch, ['alias-fingerprint-mismatch'], /alias.*fingerprint|fingerprint.*alias/iu)) {
      issues.push('alias released-fingerprint mismatches are not rejected');
    }

    const invalidReplacement = cloneJson(inventory);
    const replacementEntry = invalidReplacement.entries.find((entry) => entry.schemaId === releasedAlias.schemaId);
    replacementEntry.replacedBy = replacementEntry.aliasOf;
    replacementEntry.replacementDecision = { compatibility: 'negative-probe', rationale: 'Must fail: target is not a higher version in this family.' };
    if (!rejectsAs(invalidReplacement, ['invalid-replaced-by'], /replacedBy|higher version/iu)) {
      issues.push('invalid replacedBy targets are not rejected');
    }
  }

  const multiVersionFamily = (inventory.schemaFamilies || []).find((family) => (
    family && Array.isArray(family.versions) && family.versions.length > 1
      && family.versions.filter((version) => {
        const entry = inventory.entries.find((candidate) => candidate.schemaId === version.schemaId);
        return entry && entry.aliasOf === null;
      }).length > 1
  ));
  if (multiVersionFamily) {
    const multipleCurrent = cloneJson(inventory);
    const family = multipleCurrent.schemaFamilies.find((candidate) => candidate.familyId === multiVersionFamily.familyId);
    const nonAliasVersions = family.versions.filter((version) => {
      const entry = multipleCurrent.entries.find((candidate) => candidate.schemaId === version.schemaId);
      return entry && entry.aliasOf === null;
    });
    nonAliasVersions.forEach((version) => {
      version.lifecycle.status = 'active';
      multipleCurrent.entries.find((entry) => entry.schemaId === version.schemaId).lifecycle.status = 'active';
    });
    if (!rejectsAs(multipleCurrent, ['multiple-current-family-version'], /multiple|only one active|current version/iu)) {
      issues.push('multiple current versions in one managed family are not rejected');
    }
  }

  const tombstoneSource = inventory.entries.find((entry) => entry && entry.lifecycle && entry.lifecycle.status === 'active');
  if (tombstoneSource) {
    const reusedTombstone = cloneJson(inventory);
    const family = reusedTombstone.schemaFamilies.find((candidate) => candidate.familyId === tombstoneSource.familyId);
    if (family) {
      family.tombstones.push({
        schemaId: tombstoneSource.schemaId,
        version: tombstoneSource.version,
        rationale: 'Negative probe reserves an ID that is still active.'
      });
      if (!rejectsAs(reusedTombstone, ['tombstone-reuse'], /tombstone.*reuse|active.*tombstone/iu)) {
        issues.push('reuse of a retired tombstone by an active schema is not rejected');
      }
    }
  }

  const cleanupConsolidation = (inventory.consolidations || []).find((consolidation) => (
    consolidation && consolidation.decision === 'consolidate'
      && consolidation.canonicalSchemaId === HOST_RESOURCE_CLEANUP_SCHEMA
  ));
  if (cleanupConsolidation && releasedAlias) {
    const legacyProducer = cloneJson(inventory);
    const consolidation = legacyProducer.consolidations.find((candidate) => (
      candidate.consolidationId === cleanupConsolidation.consolidationId
    ));
    consolidation.rolloutStatus = 'canonical-write';
    const alias = legacyProducer.entries.find((entry) => entry.schemaId === HOST_RESOURCE_CLEANUP_LEGACY_ALIASES[0]);
    alias.usages.push({
      application: 'Schema Inventory Negative Probe',
      role: 'producer',
      visibility: 'internal',
      sourcePaths: [HOST_RESOURCE_CLEANUP_RUNTIME_PATH],
      interfaceReferences: [{ type: 'repo-symbol', path: HOST_RESOURCE_CLEANUP_RUNTIME_PATH, symbol: 'createHostResourceCleanupRecord' }],
      curated: true
    });
    if (!rejectsAs(legacyProducer, ['invalid-consolidation-rollout'], /legacy producer|productive legacy|canonical-write/iu)) {
      issues.push('canonical-write rollout allows a productive Legacy producer');
    }
  }
  return issues;
}

function runSchemaInventorySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: SUITE_ID, label: SUITE_LABEL });
  const inventoryPath = relativeInventoryPath(rootDir);
  let inventory = null;

  try {
    inventory = readJson(inventoryPath, rootDir);
    context.pass(`${inventoryPath} is valid JSON`);
  } catch (error) {
    context.fail(`${inventoryPath} is not readable JSON: ${error.message}`);
    return context.result({
      report: {
        inventoryVersion: null,
        exactGroups: 0,
        overlaps: 0,
        insufficientEvidence: 0,
        aliases: 0,
        families: 0,
        rollout: {},
        summary: { entries: 0, validationErrors: 1 }
      }
    });
  }

  context.assert(inventory && inventory.inventoryVersion === INVENTORY_VERSION, `inventoryVersion is ${INVENTORY_VERSION}`);
  context.assert(Array.isArray(inventory && inventory.entries), 'entries is an array');
  const entries = Array.isArray(inventory && inventory.entries) ? inventory.entries : [];
  const schemaIds = entries.map((entry) => entry && entry.schemaId);
  const stringSchemaIds = schemaIds.filter(isNonEmptyString);
  const inventoryIds = new Set(stringSchemaIds);
  context.assert(inventoryIds.size === stringSchemaIds.length, 'schemaId values are unique');
  context.assert(
    stringSchemaIds.every((schemaId, index) => index === 0 || stringSchemaIds[index - 1] < schemaId),
    'entries are stably sorted by schemaId'
  );
  assertNoIssues(
    context,
    validateInventoryMetadata(inventory, inventoryIds, rootDir),
    'scan policy, exclusions and related registries are structurally valid',
    'invalid inventory governance metadata'
  );
  assertNoIssues(
    context,
    validateEvolutionPolicy(inventory),
    'evolution policy fixes major-only versioning, lifecycle and rollout semantics',
    'invalid schema evolution policy'
  );

  const structure = validateEntryStructure(entries, rootDir);
  assertNoIssues(context, structure.fieldIssues, 'all entries contain the required typed fields', 'invalid inventory fields');
  assertNoIssues(context, structure.descriptionIssues, 'all entries have curated English descriptions', 'invalid descriptions');
  assertNoIssues(context, structure.pathIssues, 'all canonical and source paths exist in the repository', 'invalid inventory paths');
  assertNoIssues(context, structure.referenceIssues, 'all interface references are typed and qualified', 'invalid interface references');
  assertNoIssues(context, structure.fingerprintIssues, 'all shape fingerprints and shape policies are internally consistent', 'invalid shape fingerprints');
  assertNoIssues(
    context,
    validateEntryEvolutionFields(entries),
    'all entries bind family, version, lifecycle, alias, replacement, evidence and released fingerprints',
    'invalid entry evolution metadata'
  );
  assertNoIssues(
    context,
    validateSchemaFamilies(inventory, entries),
    'schema families have one managed current version and immutable retired tombstones',
    'invalid schema family metadata'
  );
  assertNoIssues(
    context,
    validateAliasAndReplacementGraph(entries),
    'aliases are direct exact-fingerprint mappings and replacements increase the family version',
    'invalid alias or replacement graph'
  );

  const packageManifest = readJson('package.json', rootDir);
  assertNoIssues(
    context,
    validateNativeFirstSubset(inventoryIds, packageManifest),
    'Native-First contract registry metadata is a subset of the master inventory',
    'Native-First registry subset mismatch'
  );
  assertNoIssues(
    context,
    validateGateIntegration(packageManifest, rootDir),
    'schema-inventory is registered in the isolated, PR and release gates',
    'schema-inventory gate integration mismatch'
  );
  assertNoIssues(
    context,
    validateXKeymapInventory(entries),
    'XKeymap contract records the XCommand and XKeymap public interfaces',
    'XKeymap inventory mismatch'
  );
  assertNoIssues(
    context,
    validateKnownReviews(inventory, entries),
    'known polymorphism and duplicate families have documented reviews',
    'known schema review mismatch'
  );
  assertNoIssues(
    context,
    validateFormalJsonSchema(entries),
    'the XTendRMT formal JSON Schema is classified and canonicalized',
    'formal JSON Schema mismatch'
  );

  let scan = null;
  let validation = null;
  let duplicateAudit = normalizeDuplicateAudit(null, entries, inventory.consolidations);
  try {
    scan = scanSchemaInventory({ rootDir });
    validation = validateInventoryDocument(inventory, scan, { rootDir });
    duplicateAudit = normalizeDuplicateAudit(scan, entries, inventory.consolidations);
  } catch (error) {
    context.fail(`schema inventory scanner failed: ${error.message}`);
  }

  assertNoIssues(
    context,
    validateConsolidations(inventory, entries, duplicateAudit),
    'exact authoritative sets have full decisions while overlap and insufficient evidence cannot merge',
    'invalid consolidation governance'
  );
  assertNoIssues(
    context,
    validateRollout(inventory, entries, duplicateAudit),
    'planned, dual-read, canonical-write and complete rollout phases exclude unsafe Legacy producers',
    'invalid consolidation rollout'
  );
  assertNoIssues(
    context,
    validateCleanupMvp(inventory, entries, packageManifest, rootDir, duplicateAudit),
    'Cleanup MVP exposes one canonical factory/resolver/types contract through every migrated producer',
    'Cleanup MVP mismatch'
  );

  const validationErrors = Array.isArray(validation && validation.errors) ? validation.errors : [];
  const hasValidation = isRecord(validation);
  const errorText = validationErrors.map(validationIssueText);
  const coverageErrors = validationErrors.filter((issue) => /missing|coverage|unregistered|uninventoried/iu.test(validationIssueText(issue)));
  const orphanErrors = validationErrors.filter((issue) => /orphan|stale|unobserved|no-source/iu.test(validationIssueText(issue)));
  context.assert(
    Boolean(validation) && validation.valid === true && validationErrors.length === 0,
    validationErrors.length === 0
      ? 'scanner validation accepts the inventory document'
      : `scanner validation errors: ${summarizeIssues(errorText)}`
  );
  context.assert(
    hasValidation && coverageErrors.length === 0,
    hasValidation && coverageErrors.length === 0
      ? 'all scanned schema identifiers are inventoried'
      : coverageErrors.length > 0
        ? `scan coverage gaps: ${summarizeIssues(coverageErrors.map(validationIssueText))}`
        : 'scan coverage could not be validated'
  );
  context.assert(
    hasValidation && orphanErrors.length === 0,
    hasValidation && orphanErrors.length === 0
      ? 'the inventory has no orphaned schema identifiers'
      : orphanErrors.length > 0
        ? `orphaned schema identifiers: ${summarizeIssues(orphanErrors.map(validationIssueText))}`
        : 'orphan checks could not be validated'
  );
  if (scan) {
    assertNoIssues(
      context,
      validateNegativeGateBehavior(inventory, scan, rootDir),
      'negative probes reject missing IDs, invalid paths, shape tampering and new collisions',
      'schema inventory negative gate mismatch'
    );
  }

  const warnings = Array.isArray(validation && validation.warnings) ? validation.warnings : [];
  const validationSummary = isRecord(validation && validation.summary) ? validation.summary : {};
  const rollout = ROLLOUT_STATUSES.reduce((summary, status) => {
    summary[status] = (inventory.consolidations || []).filter((consolidation) => (
      consolidation && consolidation.rolloutStatus === status
    )).length;
    return summary;
  }, {});
  rollout.productiveLegacyProducers = duplicateAudit.rollout.filter((reference) => (
    reference && Array.isArray(reference.producerPaths) && reference.producerPaths.length > 0
  )).length;
  return context.result({
    warnings: warnings.map(validationIssueText),
    report: {
      inventoryVersion: inventory.inventoryVersion,
      exactGroups: duplicateAudit.exactGroups.length,
      overlaps: duplicateAudit.overlaps.length,
      insufficientEvidence: duplicateAudit.insufficientEvidence.length,
      aliases: entries.filter((entry) => isNonEmptyString(entry && entry.aliasOf)).length,
      families: Array.isArray(inventory.schemaFamilies) ? inventory.schemaFamilies.length : 0,
      rollout,
      audit: {
        exactAuthoritativeGroups: duplicateAudit.exactGroups,
        overlaps: duplicateAudit.overlaps,
        incompleteEvidence: duplicateAudit.insufficientEvidence,
        aliasStatus: duplicateAudit.aliases,
        versionFamilies: duplicateAudit.families,
        legacyReferences: duplicateAudit.rollout,
        consolidations: Array.isArray(inventory.consolidations) ? inventory.consolidations : []
      },
      summary: {
        ...validationSummary,
        entries: entries.length,
        scannedEntries: Array.isArray(scan && scan.entries) ? scan.entries.length : 0,
        excludedCandidates: Array.isArray(scan && scan.excludedCandidates) ? scan.excludedCandidates.length : 0,
        duplicateReviews: Array.isArray(inventory.duplicateReviews) ? inventory.duplicateReviews.length : 0,
        exactGroups: duplicateAudit.exactGroups.length,
        overlaps: duplicateAudit.overlaps.length,
        insufficientEvidence: duplicateAudit.insufficientEvidence.length,
        aliases: entries.filter((entry) => isNonEmptyString(entry && entry.aliasOf)).length,
        families: Array.isArray(inventory.schemaFamilies) ? inventory.schemaFamilies.length : 0,
        validationErrors: validationErrors.length,
        validationWarnings: warnings.length
      }
    }
  });
}

function printSchemaInventoryReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Schema Inventory erfolgreich.',
    failureTitle: 'XTend Schema Inventory fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runSchemaInventorySuite();
  printSchemaInventoryReport(result);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = {
  printSchemaInventoryReport,
  runSchemaInventorySuite
};
