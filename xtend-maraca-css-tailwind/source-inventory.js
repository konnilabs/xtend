'use strict';

const crypto = require('crypto');
let materialCore;
try {
  materialCore = require('@xtend-material/core/recipes');
} catch (_error) {
  materialCore = require('../xtend-material/recipes');
}

const RMT_CSS_SOURCE_INVENTORY_SCHEMA = 'xtend.rmt.css-source-inventory.v1';
const { MATERIAL_RECIPE_REGISTRY_SCHEMA, createMaterialRecipeRegistry } = materialCore;
const MATERIAL_CLASS_PATTERN = /^xtm-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const FRAMEWORK_CLASS_PATTERN = /^xtend-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const DEFAULT_MATERIAL_RECIPES = Object.freeze(createMaterialRecipeRegistry().records.slice());

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((record, key) => {
    if (value[key] !== undefined && typeof value[key] !== 'function') record[key] = stableValue(value[key]);
    return record;
  }, {});
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function sourceLocation(sourceText, offset, filePath) {
  const before = String(sourceText || '').slice(0, Math.max(0, offset));
  const lines = before.split(/\r?\n/u);
  return { file: filePath || null, line: lines.length, column: lines[lines.length - 1].length + 1, offset };
}

function rawClassRecords(sourceText, filePath) {
  const records = [];
  const patterns = [
    /\b(?:class|className|classes)\s*=\s*["']([^"']*)["']/giu,
    /["']?(?:class|className|classes)["']?\s*:\s*["']([^"']*)["']/giu,
    /\b(?:class|className|classes)\s+["']([^"']*)["']/giu
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(String(sourceText || '')))) {
      const valueOffset = match.index + match[0].indexOf(match[1]);
      records.push({ value: match[1], classification: 'literal', origin: 'rmt-source', source: sourceLocation(sourceText, valueOffset, filePath) });
    }
  });
  return records;
}

function descriptorClassRecords(node, pointer = '$', target = []) {
  if (!node || typeof node !== 'object') return target;
  if (Array.isArray(node)) {
    node.forEach((entry, index) => descriptorClassRecords(entry, `${pointer}/${index}`, target));
    return target;
  }
  ['class', 'className', 'classes'].forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(node, key)) return;
    const value = node[key];
    if (typeof value === 'string') {
      target.push({ value, classification: value.startsWith('$') ? 'dynamic' : 'literal', origin: 'descriptor', source: { file: null, line: null, column: null, pointer: `${pointer}/${key}` } });
    } else if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (typeof entry === 'string') target.push({ value: entry, classification: entry.startsWith('$') ? 'dynamic' : 'literal', origin: 'descriptor', source: { file: null, line: null, column: null, pointer: `${pointer}/${key}/${index}` } });
      });
    } else if (value && typeof value === 'object') {
      Object.keys(value).forEach((className) => target.push({ value: className, classification: 'conditional-static', origin: 'descriptor', source: { file: null, line: null, column: null, pointer: `${pointer}/${key}/${className}` } }));
    }
  });
  ['children', 'nodes', 'then', 'else', 'fallback', 'template', 'node', 'descriptor'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(node, key)) descriptorClassRecords(node[key], `${pointer}/${key}`, target);
  });
  Object.entries(node.slots || {}).forEach(([key, value]) => descriptorClassRecords(value, `${pointer}/slots/${key}`, target));
  return target;
}

function diagnostic(code, message, record, repairHint) {
  return { code, severity: 'error', message, classification: record.classification, candidate: record.value, source: record.source, repairHint };
}

function classifyRecord(record, registry) {
  const value = String(record.value || '').trim();
  if (!value) return { accepted: [], diagnostics: [] };
  if (record.classification === 'dynamic' || /\$\{|\{\{|\$[a-z_.]|\s\+\s|`/iu.test(value)) {
    return { accepted: [], diagnostics: [diagnostic(
      'rmt.css.utility.dynamic_name',
      `Dynamic CSS class candidate is not build-time enumerable: ${value}`,
      { ...record, classification: 'dynamic' },
      'Choose a static xtm-* recipe class and express state through a conditional class map.'
    )] };
  }
  const accepted = [];
  const diagnostics = [];
  value.split(/\s+/u).filter(Boolean).forEach((candidate) => {
    const entry = { ...record, value: candidate };
    if (/[\[\]/:]/u.test(candidate)) {
      diagnostics.push(diagnostic(
        'rmt.css.utility.unsupported_syntax',
        `Unsupported Tailwind syntax is not part of the Material authoring contract: ${candidate}`,
        { ...entry, classification: 'unsupported-syntax' },
        'Replace arbitrary values, slash modifiers or variants with a reviewed xtm-* recipe.'
      ));
    } else if (!MATERIAL_CLASS_PATTERN.test(candidate)) {
      if (!(record.origin === 'descriptor' && FRAMEWORK_CLASS_PATTERN.test(candidate))) diagnostics.push(diagnostic(
        'rmt.css.utility.unowned_safelist',
        `Unowned class is not allowed in Material RMT authoring: ${candidate}`,
        entry,
        'Use a registered xtm-* Material class or register a closed recipe during framework development.'
      ));
    } else if (!registry.byClass.has(candidate)) {
      diagnostics.push(diagnostic(
        'rmt.css.utility.unowned_safelist',
        `Material class has no registered recipe: ${candidate}`,
        entry,
        'Select an existing xtm-* recipe or add a reviewed recipe with a closed utility set.'
      ));
    } else {
      accepted.push({ ...entry, recipe: registry.byClass.get(candidate) });
    }
  });
  return { accepted, diagnostics };
}

function createMaterialRecipeStylesheet(classNames, registry = createMaterialRecipeRegistry()) {
  const selected = Array.from(new Set(Array.isArray(classNames) ? classNames : [])).sort();
  return selected.map((className) => {
    const recipe = registry.byClass.get(className);
    if (!recipe) throw new Error(`Cannot emit unregistered Material recipe ${className}.`);
    return `@utility ${className} { @apply ${recipe.utilities.join(' ')}; }`;
  }).join('\n');
}

function createRmtCssSourceInventory(input = {}) {
  const registry = input.registry || createMaterialRecipeRegistry(input.recipes);
  const records = rawClassRecords(input.sourceText, input.filePath);
  (Array.isArray(input.sources) ? input.sources : []).forEach((source) => {
    if (!source || typeof source.content !== 'string') return;
    records.push(...rawClassRecords(source.content, source.path || null));
  });
  const rawValues = new Set(records.map((record) => String(record.value || '').trim()));
  records.push(...descriptorClassRecords(input.descriptors || []).filter((record) => !rawValues.has(String(record.value || '').trim())));
  const accepted = [];
  const diagnostics = [];
  records.forEach((record) => {
    const result = classifyRecord(record, registry);
    accepted.push(...result.accepted);
    diagnostics.push(...result.diagnostics);
  });
  diagnostics.push(...(Array.isArray(input.diagnostics) ? input.diagnostics : []));
  const materialClasses = Array.from(new Set(accepted.map((entry) => entry.value))).sort();
  const recipeUtilities = materialClasses.map((className) => ({
    className,
    category: registry.byClass.get(className).category,
    utilities: registry.byClass.get(className).utilities.slice()
  }));
  const report = {
    schema: RMT_CSS_SOURCE_INVENTORY_SCHEMA,
    ok: diagnostics.length === 0,
    status: diagnostics.length === 0 ? 'ready' : 'blocked',
    authoringContract: 'xtm-material-classes-only',
    registryFingerprint: registry.fingerprint,
    materialClasses,
    candidates: materialClasses,
    staticUtilities: Array.from(new Set(recipeUtilities.flatMap((entry) => entry.utilities))).sort(),
    recipeUtilities,
    blockedUtilities: diagnostics.filter((entry) => entry.code !== 'rmt.css.utility.dynamic_name').map((entry) => entry.candidate),
    dynamicCandidates: diagnostics.filter((entry) => entry.code === 'rmt.css.utility.dynamic_name').map((entry) => entry.candidate),
    records: accepted.map((entry) => ({ className: entry.value, classification: entry.classification, origin: entry.origin, source: entry.source })),
    diagnostics
  };
  report.recipeStylesheet = createMaterialRecipeStylesheet(materialClasses, registry);
  report.fingerprint = fingerprint({ ...report, fingerprint: undefined });
  return report;
}

module.exports = {
  DEFAULT_MATERIAL_RECIPES,
  MATERIAL_RECIPE_REGISTRY_SCHEMA,
  RMT_CSS_SOURCE_INVENTORY_SCHEMA,
  createMaterialRecipeRegistry,
  createMaterialRecipeStylesheet,
  createRmtCssSourceInventory,
  descriptorClassRecords,
  rawClassRecords
};
