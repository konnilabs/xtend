'use strict';

const crypto = require('crypto');
const { MATERIAL_SHELL_RECIPES } = require('./shell-recipes');
const { MATERIAL_FLOW_RECIPES } = require('./flow-recipes');

const MATERIAL_RECIPE_SCHEMA = 'xtend.material.recipe.v1';
const MATERIAL_RECIPE_REGISTRY_SCHEMA = 'xtend.material.recipe-registry.v1';
const MATERIAL_RECIPE_VERSION = '1.0.0';

const DEFINITIONS = Object.freeze([
  ['page', 'layout', ['mx-auto', 'w-full', 'max-w-7xl'], ['main', 'section'], ['--xtend-density-spacing', '--xtend-space-4'], 'region'],
  ['stack', 'layout', ['flex', 'flex-col'], ['div', 'section'], ['--xtend-density-spacing'], 'group'],
  ['stack-compact', 'layout', ['flex', 'flex-col'], ['div', 'section'], ['--xtend-density-spacing'], 'group'],
  ['cluster', 'layout', ['flex', 'flex-wrap', 'items-center'], ['div', 'nav'], ['--xtend-density-spacing'], 'group'],
  ['grid', 'layout', ['grid', 'grid-cols-1'], ['div', 'section'], ['--xtend-density-spacing'], 'list'],
  ['surface', 'surface', ['border'], ['section', 'article', 'aside', 'x-section'], ['--xtend-surface-panel', '--xtend-border-subtle', '--xtend-radius-panel', '--xtend-elevation-1'], 'region'],
  ['card', 'surface', ['border'], ['article', 'section', 'x-section'], ['--xtend-surface-panel', '--xtend-border-subtle', '--xtend-radius-panel', '--xtend-elevation-1'], 'article'],
  ['toolbar', 'surface', ['flex', 'items-center', 'justify-between'], ['header', 'nav', 'div', 'x-header'], ['--xtend-surface-panel', '--xtend-border-subtle', '--xtend-density-spacing'], 'toolbar'],
  ['actions', 'action', ['flex', 'flex-wrap', 'items-center', 'justify-end'], ['div', 'footer'], ['--xtend-density-spacing'], 'group'],
  ['title', 'typography', ['text-2xl', 'font-semibold', 'tracking-tight'], ['h1'], ['--xtend-font-family-heading', '--xtend-text-primary'], 'heading'],
  ['heading', 'typography', ['text-lg', 'font-semibold'], ['h2', 'h3'], ['--xtend-font-family-heading', '--xtend-text-primary'], 'heading'],
  ['body', 'typography', ['text-base', 'leading-6'], ['p', 'div'], ['--xtend-font-size-body', '--xtend-text-primary'], 'text'],
  ['muted', 'typography', ['text-sm', 'opacity-70'], ['p', 'span'], ['--xtend-font-size-label', '--xtend-text-muted'], 'note'],
  ['plain-text', 'typography', ['whitespace-pre-wrap', 'break-words'], ['p', 'div', 'span'], ['--xtend-font-size-body', '--xtend-text-primary'], 'text'],
  ['primary-action', 'action', ['inline-flex', 'items-center', 'justify-center', 'font-medium'], ['button', 'a', 'x-button'], ['--xtend-color-action', '--xtend-text-on-action', '--xtend-radius-control', '--xtend-control-height', '--xtend-focus-ring'], 'button']
]);

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

function foundationRecipe(definition) {
  const [name, category, utilities, components, tokens, semanticRole] = definition;
  const className = `xtm-${name}`;
  return Object.freeze({
    schema: MATERIAL_RECIPE_SCHEMA,
    id: `material.foundation.${name}`,
    version: MATERIAL_RECIPE_VERSION,
    status: 'foundation',
    className,
    category,
    slots: Object.freeze([{ name: 'root', required: true, className, semanticRole }]),
    components: Object.freeze(components.slice()),
    tokens: Object.freeze(tokens.slice()),
    utilities: Object.freeze(utilities.slice()),
    responsive: Object.freeze({ strategy: 'intrinsic-first', breakpoints: Object.freeze([]), degradation: 'single-column-readable-flow' }),
    accessibility: Object.freeze({ semanticRole, visibleFocus: category === 'action', reducedMotion: true, forcedColors: true }),
    fallback: Object.freeze({ provider: 'native-css', stylesheet: '@xtend-material/core/styles.css', className })
  });
}

const MATERIAL_FOUNDATION_RECIPES = Object.freeze(DEFINITIONS.map(foundationRecipe));

function normalizeExtension(input) {
  const recipe = input && typeof input === 'object' ? input : {};
  const className = String(recipe.className || '').trim();
  if (!/^xtm-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(className)) throw new Error(`Material recipe class must use the xtm-* namespace: ${className}`);
  const utilities = Array.from(new Set((recipe.utilities || []).map((value) => String(value).trim()).filter(Boolean))).sort();
  if (utilities.length === 0 || utilities.some((value) => /[\[\]/:]/u.test(value))) throw new Error(`Material recipe ${className} needs a closed safe utility set.`);
  return {
    schema: MATERIAL_RECIPE_SCHEMA,
    id: String(recipe.id || `material.extension.${className.slice(4)}`),
    version: String(recipe.version || MATERIAL_RECIPE_VERSION),
    status: 'extension',
    className,
    category: String(recipe.category || 'custom'),
    slots: recipe.slots || [{ name: 'root', required: true, className, semanticRole: 'group' }],
    components: recipe.components || ['div'],
    tokens: recipe.tokens || ['--xtend-surface-page'],
    utilities,
    responsive: recipe.responsive || { strategy: 'intrinsic-first', breakpoints: [], degradation: 'readable-flow' },
    accessibility: recipe.accessibility || { semanticRole: 'group', visibleFocus: false, reducedMotion: true, forcedColors: true },
    fallback: recipe.fallback || { provider: 'native-css', stylesheet: '@xtend-material/core/styles.css', className }
  };
}

function createMaterialRecipeRegistry(extensions = []) {
  const records = MATERIAL_FOUNDATION_RECIPES.concat(MATERIAL_SHELL_RECIPES, MATERIAL_FLOW_RECIPES, (Array.isArray(extensions) ? extensions : []).map(normalizeExtension));
  const ids = new Set();
  const classes = new Set();
  records.forEach((recipe) => {
    if (ids.has(recipe.id)) throw new Error(`Duplicate Material recipe id ${recipe.id}.`);
    if (classes.has(recipe.className)) throw new Error(`Duplicate Material recipe class ${recipe.className}.`);
    ids.add(recipe.id);
    classes.add(recipe.className);
  });
  const sorted = records.slice().sort((left, right) => left.className.localeCompare(right.className));
  return {
    schema: MATERIAL_RECIPE_REGISTRY_SCHEMA,
    namespace: 'xtm-',
    records: sorted,
    byClass: new Map(sorted.map((recipe) => [recipe.className, recipe])),
    byId: new Map(sorted.map((recipe) => [recipe.id, recipe])),
    fingerprint: fingerprint(sorted)
  };
}

module.exports = {
  MATERIAL_FOUNDATION_RECIPES,
  MATERIAL_FLOW_RECIPES,
  MATERIAL_SHELL_RECIPES,
  MATERIAL_RECIPE_REGISTRY_SCHEMA,
  MATERIAL_RECIPE_SCHEMA,
  MATERIAL_RECIPE_VERSION,
  createMaterialRecipeRegistry
};
