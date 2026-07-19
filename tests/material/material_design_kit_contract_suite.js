'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { TOKEN_DEFINITIONS } = require('../../design-tokens/xtend-design-tokens');
const { COMPONENT_ALIAS_GROUPS, GLOBAL_ALIASES } = require('../../design-tokens/xtheme-token-alias-layer');
const {
  DESIGN_PRINCIPLES,
  MATERIAL_RECIPE_REGISTRY_SCHEMA,
  MATERIAL_RECIPE_SCHEMA,
  XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA,
  XTEND_MATERIAL_DESIGN_KIT_SCHEMA,
  createMaterialMaracaPreset,
  createMaterialRecipeRegistry,
  createXtendMaterialDesignKit,
  validateXtendMaterialDesignKit
} = require('../../xtend-material');

const PACKAGE_PATH = 'xtend-material/package.json';
const CONTRACT_PATH = 'development/XTend-Material-Design-Kit-Contract.md';
const BACKLOG_PATH = 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-contract scoped-package-readmes package-exports --json';

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function runXtendMaterialPackageExportsSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'package-exports', label: 'XTend Material Package Exports' });
  const manifest = JSON.parse(read(rootDir, PACKAGE_PATH));
  const required = ['.', './recipes', './shell-recipes', './flow-recipes', './maraca-preset', './performance-contract', './styles.css', './tokens.css', './package.json'];
  required.forEach((entry) => context.assert(Boolean(manifest.exports[entry]), `core package exports ${entry}`));
  manifest.files.forEach((file) => context.assert(fs.existsSync(path.resolve(rootDir, 'xtend-material', file)), `pack file exists: ${file}`));
  context.assert(require('../../xtend-material').XTEND_MATERIAL_DESIGN_KIT_SCHEMA === XTEND_MATERIAL_DESIGN_KIT_SCHEMA, 'root CommonJS export resolves');
  context.assert(require('../../xtend-material/recipes').MATERIAL_RECIPE_SCHEMA === MATERIAL_RECIPE_SCHEMA, 'recipes subpath implementation resolves');
  context.assert(require('../../xtend-material/flow-recipes').MATERIAL_FLOW_RECIPES.length === 7, 'flow recipes subpath implementation resolves');
  context.assert(require('../../xtend-material/maraca-preset').createMaterialMaracaPreset().runtimeTailwind === false, 'Maraca preset subpath implementation resolves');
  context.assert(require('../../xtend-material/performance-contract').XTEND_MATERIAL_QUALITY_POLICY_SCHEMA === 'xtend.material.quality-policy.v1', 'performance contract subpath implementation resolves');
  return context.result({ report: { schema: 'xtend.material.package-exports-report.v1', package: manifest.name, exportCount: required.length } });
}

function runMaterialDesignKitContractSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-contract', label: 'XTM-06 Material Design Kit Contract' });
  const manifest = JSON.parse(read(rootDir, PACKAGE_PATH));
  const rootManifest = JSON.parse(read(rootDir, 'package.json'));
  const contractSource = read(rootDir, CONTRACT_PATH);
  const backlog = read(rootDir, BACKLOG_PATH);
  const styles = read(rootDir, 'xtend-material/styles.css');
  const tokens = read(rootDir, 'xtend-material/tokens.css');
  const indexSource = read(rootDir, 'xtend-material/index.js');
  const recipesSource = read(rootDir, 'xtend-material/recipes.js');
  const types = read(rootDir, 'xtend-material/index.d.ts');
  const adapterInventory = read(rootDir, 'xtend-maraca-css-tailwind/source-inventory.js');
  const adapterProvider = read(rootDir, 'xtend-maraca-css-tailwind/index.js');
  const componentManifest = JSON.parse(read(rootDir, 'components/manifest.json'));
  const kit = createXtendMaterialDesignKit();
  const validation = validateXtendMaterialDesignKit(kit, { rootDir });
  const registry = createMaterialRecipeRegistry();
  const preset = createMaterialMaracaPreset();

  context.assert(kit.schema === XTEND_MATERIAL_DESIGN_KIT_SCHEMA && validation.schema === XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA, 'design kit and report expose stable schemas');
  context.assert(validation.ok && validation.status === 'accepted', 'generated design kit passes its validator');
  context.assert(kit.packageName === '@xtend-material/core' && kit.owner === 'CCS Labs (ccslabs)', 'package identity and ownership are stable');
  context.assert(kit.designIntent === 'modern-minimal-enterprise-app-shells', 'design intent targets modern enterprise shells');
  ['surface', 'hierarchy', 'typography', 'shape', 'density', 'motion', 'status'].forEach((id) => context.assert(DESIGN_PRINCIPLES.some((entry) => entry.id === id), `design principle exists: ${id}`));
  context.assert(registry.schema === MATERIAL_RECIPE_REGISTRY_SCHEMA && registry.records.length >= 15, 'single registry preserves the useful foundation vocabulary');
  context.assert(registry.records.every((recipe) => recipe.schema === MATERIAL_RECIPE_SCHEMA && recipe.version === '1.0.0'), 'every recipe uses the versioned recipe contract');
  context.assert(registry.records.every((recipe) => recipe.slots.some((slot) => slot.name === 'root' && slot.required)), 'every recipe has a required root slot');
  context.assert(registry.records.every((recipe) => recipe.responsive.strategy && recipe.responsive.degradation), 'every recipe defines responsive behavior and degradation');
  context.assert(registry.records.every((recipe) => recipe.accessibility.reducedMotion && recipe.accessibility.forcedColors), 'every recipe defines reduced-motion and forced-colors behavior');
  context.assert(registry.records.every((recipe) => recipe.fallback.provider === 'native-css' && recipe.fallback.stylesheet === '@xtend-material/core/styles.css'), 'every recipe has the native CSS exit path');
  context.assert(registry.records.every((recipe) => recipe.components.every((component) => !component.startsWith('x-') || componentManifest[component])), 'recipes reference only existing XTend components');
  const knownTokens = new Set(TOKEN_DEFINITIONS.concat(GLOBAL_ALIASES).map((entry) => entry.name));
  Object.values(COMPONENT_ALIAS_GROUPS).forEach((group) => group.aliases.forEach((entry) => knownTokens.add(entry.name)));
  context.assert(registry.records.every((recipe) => recipe.tokens.every((token) => knownTokens.has(token))), 'recipes reference only known XTend core or alias tokens');
  context.assert(registry.records.every((recipe) => recipe.utilities.every((utility) => !/[\[\]/:]/u.test(utility))), 'private utility sets contain no arbitrary, variant or slash syntax');

  const invalidComponent = createXtendMaterialDesignKit();
  invalidComponent.recipes = invalidComponent.recipes.map((recipe, index) => index === 0 ? { ...recipe, components: ['x-unknown-parallel-component'] } : recipe);
  context.assert(!validateXtendMaterialDesignKit(invalidComponent, { rootDir }).ok, 'validator blocks unknown component references');
  const invalidToken = createXtendMaterialDesignKit();
  invalidToken.recipes = invalidToken.recipes.map((recipe, index) => index === 0 ? { ...recipe, tokens: ['--xtend-unknown-product-token'] } : recipe);
  context.assert(!validateXtendMaterialDesignKit(invalidToken, { rootDir }).ok, 'validator blocks unknown XTend token references');
  const invalidUtility = createXtendMaterialDesignKit();
  invalidUtility.recipes = invalidUtility.recipes.map((recipe, index) => index === 0 ? { ...recipe, utilities: ['bg-[#fff]'] } : recipe);
  context.assert(!validateXtendMaterialDesignKit(invalidUtility, { rootDir }).ok, 'validator blocks unsafe private utilities');
  const invalidBoundary = createXtendMaterialDesignKit();
  invalidBoundary.boundaries = { ...invalidBoundary.boundaries, componentRegistry: true };
  context.assert(!validateXtendMaterialDesignKit(invalidBoundary, { rootDir }).ok, 'validator blocks a parallel component registry');

  context.assert(manifest.name === '@xtend-material/core' && manifest.private !== true, 'core is a public scoped package');
  context.assert(manifest.dependencies.tailwindcss === '4.3.2', 'core pins the accepted Tailwind baseline exactly');
  context.assert(manifest.peerDependencies['@ccslabs/xtend'] === '^0.5.0', 'core declares XTend 0.5 as its semantic peer');
  context.assert(manifest.peerDependenciesMeta['@ccslabs/xtend'].optional === true, 'core keeps the host-owned XTend peer optional for workspace and consumer installs');
  context.assert(manifest.sideEffects.length === 1 && manifest.sideEffects[0] === '*.css', 'only CSS exports are side-effectful');
  context.assert(!fs.existsSync(path.resolve(rootDir, 'xtend-material/components')) && !manifest.files.includes('components'), 'package contains no component catalog or registry directory');
  context.assert(!indexSource.includes('customElements.define') && !recipesSource.includes('customElements.define'), 'core JavaScript defines no custom elements');
  context.assert(!styles.includes('tailwindcss') && !tokens.includes('tailwindcss'), 'public CSS loads no Tailwind browser runtime');
  context.assert(!/(?:#[0-9a-f]{3,8}|rgb\(|hsl\()/iu.test(styles + tokens), 'design-kit CSS contains no competing hard-coded product palette');
  context.assert(styles.includes('.xtm-app-shell') && styles.includes('.xtm-surface') && styles.includes('.xtm-card'), 'native CSS styles elegant shell and surface foundations');
  context.assert(styles.includes('text-wrap: balance') && styles.includes('repeat(auto-fit') && styles.includes('100dvh'), 'native CSS uses modern intrinsic shell and typography patterns');
  context.assert(styles.includes('@media (prefers-reduced-motion: reduce)') && styles.includes('@media (forced-colors: active)') && styles.includes(':focus-visible'), 'native CSS includes accessibility defaults');
  context.assert(Array.from((styles + tokens).matchAll(/var\((--xtend-[a-z0-9-]+),/giu)).every((match) => knownTokens.has(match[1])), 'CSS references only known XTend tokens with fallbacks');

  context.assert(preset.schema === 'xtend.material.maraca-preset.v1' && preset.designKit === '@xtend-material/core', 'Maraca preset identifies the design kit');
  context.assert(preset.materialPack === 'enterprise' && preset.density === 'comfortable', 'Maraca preset selects the enterprise-readable default');
  context.assert(preset.cssPreflight === 'disabled' && preset.runtimeTailwind === false && preset.nativeFallback, 'Maraca preset keeps build and fallback boundaries');
  context.assert(adapterInventory.includes("require('@xtend-material/core/recipes')") && !adapterInventory.includes("{ className: 'xtm-app-shell'"), 'adapter consumes the canonical core Recipe Registry');
  context.assert(adapterProvider.includes('loadDesignKitStyles') && adapterProvider.includes('stylesFingerprint'), 'provider includes design-kit CSS and Evidence');
  context.assert(types.includes('XtendMaterialDesignKit') && types.includes('validateXtendMaterialDesignKit'), 'TypeScript surface describes contract and validator');
  context.assert(!indexSource.includes('xtend-maraca-css-tailwind'), 'core can be introspected independently from the Tailwind adapter');

  context.assert(rootManifest.workspaces.includes('xtend-material'), 'root workspace includes Material core');
  context.assert(rootManifest.scopedPackages.some((entry) => entry.name === '@xtend-material/core' && entry.path === 'xtend-material'), 'scoped package inventory exposes Material core');
  context.assert(rootManifest.xtend.materialDesignKit.schema === XTEND_MATERIAL_DESIGN_KIT_SCHEMA, 'root metadata exposes the design kit contract');
  context.assert(contractSource.includes(LOCAL_GATE) && contractSource.includes('keine zweite Component Registry'), 'contract documents gate and component boundary');
  context.assert(backlog.includes('| `XTM-06` | P1 | completed | WS3 |'), 'backlog marks XTM-06 completed');

  return context.result({ report: { ...validation, package: manifest.name, recipeFingerprint: registry.fingerprint, localGate: LOCAL_GATE } });
}

function printMaterialDesignKitContractReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-06 Material Design Kit contract passed.', failureTitle: 'XTM-06 Material Design Kit contract failed:' });
}

function printXtendMaterialPackageExportsReport(result) {
  printSuiteReport(result, { successTitle: 'XTend Material package exports passed.', failureTitle: 'XTend Material package exports failed:' });
}

module.exports = {
  printMaterialDesignKitContractReport,
  printXtendMaterialPackageExportsReport,
  runMaterialDesignKitContractSuite,
  runXtendMaterialPackageExportsSuite
};
