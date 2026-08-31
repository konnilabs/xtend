'use strict';

const fs = require('fs');
const path = require('path');
const {
  MATERIAL_FOUNDATION_RECIPES,
  MATERIAL_RECIPE_REGISTRY_SCHEMA,
  MATERIAL_RECIPE_SCHEMA,
  createMaterialRecipeRegistry
} = require('./recipes');
const { createMaterialMaracaPreset } = require('./maraca-preset');
const { MATERIAL_SHELL_RECIPES, MATERIAL_SHELL_RECIPE_REPORT_SCHEMA, validateMaterialShellRecipes } = require('./shell-recipes');
const { MATERIAL_FLOW_RECIPES, MATERIAL_FLOW_RECIPE_REPORT_SCHEMA, validateMaterialFlowRecipes } = require('./flow-recipes');
const {
  MONKEYPATCH_RULES,
  XTEND_MATERIAL_BUDGETS,
  XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA,
  XTEND_MATERIAL_QUALITY_POLICY_SCHEMA,
  auditXtendMaterialMonkeypatching,
  createXtendMaterialQualityPolicy,
  validateXtendMaterialPerformanceReport
} = require('./performance-contract');

const XTEND_MATERIAL_DESIGN_KIT_SCHEMA = 'xtend.material.design-kit.v1';
const XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA = 'xtend.material.design-kit-report.v1';
const XTEND_MATERIAL_VERSION = '0.1.0';
const DESIGN_PRINCIPLES = Object.freeze([
  { id: 'surface', intent: 'quiet-layered-surfaces', rule: 'Hierarchy is expressed through XTend surfaces, borders and restrained elevation.' },
  { id: 'hierarchy', intent: 'task-first-information-architecture', rule: 'Primary work stays visually dominant while chrome remains calm.' },
  { id: 'typography', intent: 'high-legibility', rule: 'A compact type scale and semantic headings support dense enterprise content.' },
  { id: 'shape', intent: 'modern-controlled-softness', rule: 'Consistent XTend radii soften containers without decorative excess.' },
  { id: 'density', intent: 'adaptive-productivity', rule: 'Comfortable, compact and dense modes preserve control usability.' },
  { id: 'motion', intent: 'functional-continuity', rule: 'Motion explains state and respects reduced-motion preferences.' },
  { id: 'status', intent: 'accessible-semantic-feedback', rule: 'Status never depends on color alone and remains legible in forced colors.' }
]);

const COMPATIBILITY = Object.freeze({
  xtend: '^0.8.0',
  tailwindcss: '4.3.2',
  maracaCssProvider: 'xtend.maraca.css-provider.v1',
  tokenBridge: 'xtend.material.tailwind-token-bridge.v1',
  node: '>=24',
  preflight: 'disabled'
});

const NATIVE_TAGS = new Set(['a', 'article', 'aside', 'button', 'div', 'footer', 'h1', 'h2', 'h3', 'header', 'main', 'nav', 'p', 'section', 'span']);

function loadKnownComponents(rootDir) {
  const manifestPath = path.resolve(rootDir || path.resolve(__dirname, '..'), 'components', 'manifest.json');
  if (fs.existsSync(manifestPath)) return new Set(Object.keys(JSON.parse(fs.readFileSync(manifestPath, 'utf8'))));
  try {
    const installedManifest = require.resolve('@ccslabs/xtend/components/manifest.json', { paths: [__dirname] });
    return new Set(Object.keys(JSON.parse(fs.readFileSync(installedManifest, 'utf8'))));
  } catch (_error) {
    return new Set(['x-button', 'x-header', 'x-section']);
  }
}

function loadKnownTokens() {
  try {
    const designTokens = require('@ccslabs/xtend/design-tokens');
    const aliases = require('@ccslabs/xtend/design-tokens/xtheme-token-alias-layer');
    const names = designTokens.TOKEN_DEFINITIONS.map((entry) => entry.name).concat(aliases.GLOBAL_ALIASES.map((entry) => entry.name));
    Object.values(aliases.COMPONENT_ALIAS_GROUPS).forEach((group) => group.aliases.forEach((entry) => names.push(entry.name)));
    return new Set(names);
  } catch (_error) {
    const designTokens = require('../design-tokens/xtend-design-tokens');
    const aliases = require('../design-tokens/xtheme-token-alias-layer');
    const names = designTokens.TOKEN_DEFINITIONS.map((entry) => entry.name).concat(aliases.GLOBAL_ALIASES.map((entry) => entry.name));
    Object.values(aliases.COMPONENT_ALIAS_GROUPS).forEach((group) => group.aliases.forEach((entry) => names.push(entry.name)));
    return new Set(names);
  }
}

function createXtendMaterialDesignKit(options = {}) {
  const registry = createMaterialRecipeRegistry(options.recipes);
  return {
    schema: XTEND_MATERIAL_DESIGN_KIT_SCHEMA,
    reportSchema: XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA,
    name: 'XTend Material',
    packageName: '@xtend-material/core',
    version: XTEND_MATERIAL_VERSION,
    owner: 'CCS Labs (ccslabs)',
    designIntent: 'modern-minimal-enterprise-app-shells',
    principles: DESIGN_PRINCIPLES,
    recipes: registry.records,
    recipeRegistry: registry,
    themePacks: ['light', 'dark', 'high-contrast', 'forced-colors'],
    densityPacks: ['comfortable', 'compact', 'dense'],
    experiencePacks: ['enterprise', 'utility'],
    compatibility: COMPATIBILITY,
    exports: ['.', './recipes', './shell-recipes', './flow-recipes', './maraca-preset', './performance-contract', './styles.css', './tokens.css'],
    boundaries: {
      browserTailwindRuntime: false,
      componentDefinitions: false,
      componentRegistry: false,
      tokenSourceOfTruth: '--xtend-*',
      rmtKernelImport: false
    },
    maracaPreset: createMaterialMaracaPreset()
  };
}

function validateXtendMaterialDesignKit(input, options = {}) {
  const kit = input || {};
  const errors = [];
  const knownComponents = options.knownComponents || loadKnownComponents(options.rootDir);
  const knownTokens = options.knownTokens || loadKnownTokens();
  if (kit.schema !== XTEND_MATERIAL_DESIGN_KIT_SCHEMA) errors.push('invalid design kit schema');
  if (kit.packageName !== '@xtend-material/core') errors.push('invalid package identity');
  if (!Array.isArray(kit.principles) || DESIGN_PRINCIPLES.some((principle) => !kit.principles.some((entry) => entry.id === principle.id))) errors.push('incomplete design principles');
  const ids = new Set();
  const classes = new Set();
  (Array.isArray(kit.recipes) ? kit.recipes : []).forEach((recipe) => {
    if (recipe.schema !== MATERIAL_RECIPE_SCHEMA) errors.push(`invalid recipe schema ${recipe.id || ''}`);
    if (!/^material\.[a-z0-9.-]+$/u.test(String(recipe.id || ''))) errors.push(`invalid recipe id ${recipe.id || ''}`);
    if (ids.has(recipe.id)) errors.push(`duplicate recipe id ${recipe.id}`);
    if (classes.has(recipe.className)) errors.push(`duplicate recipe class ${recipe.className}`);
    ids.add(recipe.id);
    classes.add(recipe.className);
    if (!/^xtm-[a-z0-9-]+$/u.test(String(recipe.className || ''))) errors.push(`invalid recipe class ${recipe.className || ''}`);
    if (!Array.isArray(recipe.slots) || !recipe.slots.some((slot) => slot.name === 'root' && slot.required)) errors.push(`recipe ${recipe.id} misses root slot`);
    if (!Array.isArray(recipe.components) || recipe.components.some((component) => !NATIVE_TAGS.has(component) && !knownComponents.has(component))) errors.push(`recipe ${recipe.id} references unknown component`);
    if (!Array.isArray(recipe.tokens) || recipe.tokens.some((token) => !knownTokens.has(token))) errors.push(`recipe ${recipe.id} references unknown XTend token`);
    if (!Array.isArray(recipe.utilities) || recipe.utilities.length === 0 || recipe.utilities.some((utility) => /[\[\]/:]/u.test(utility))) errors.push(`recipe ${recipe.id} has an unsafe utility set`);
    if (!recipe.responsive || !recipe.accessibility || !recipe.fallback) errors.push(`recipe ${recipe.id} misses behavior contracts`);
  });
  if ((kit.recipes || []).length === 0) errors.push('recipe registry must not be empty');
  if (!kit.boundaries || kit.boundaries.browserTailwindRuntime !== false || kit.boundaries.componentRegistry !== false) errors.push('runtime or component registry boundary is open');
  return {
    schema: XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA,
    ok: errors.length === 0,
    status: errors.length === 0 ? 'accepted' : 'blocked',
    errors,
    recipeCount: Array.isArray(kit.recipes) ? kit.recipes.length : 0,
    principleCount: Array.isArray(kit.principles) ? kit.principles.length : 0,
    componentDefinitionCount: 0
  };
}

module.exports = {
  COMPATIBILITY,
  DESIGN_PRINCIPLES,
  MATERIAL_FOUNDATION_RECIPES,
  MATERIAL_FLOW_RECIPES,
  MATERIAL_SHELL_RECIPES,
  MATERIAL_RECIPE_REGISTRY_SCHEMA,
  MATERIAL_RECIPE_SCHEMA,
  MATERIAL_SHELL_RECIPE_REPORT_SCHEMA,
  MATERIAL_FLOW_RECIPE_REPORT_SCHEMA,
  XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA,
  XTEND_MATERIAL_DESIGN_KIT_SCHEMA,
  XTEND_MATERIAL_VERSION,
  createMaterialMaracaPreset,
  createMaterialRecipeRegistry,
  createXtendMaterialDesignKit,
  validateMaterialShellRecipes,
  validateMaterialFlowRecipes,
  validateXtendMaterialDesignKit,
  MONKEYPATCH_RULES,
  XTEND_MATERIAL_BUDGETS,
  XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA,
  XTEND_MATERIAL_QUALITY_POLICY_SCHEMA,
  auditXtendMaterialMonkeypatching,
  createXtendMaterialQualityPolicy,
  validateXtendMaterialPerformanceReport
};
