'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { TOKEN_DEFINITIONS } = require('../../design-tokens/xtend-design-tokens');
const { COMPONENT_ALIAS_GROUPS, GLOBAL_ALIASES } = require('../../design-tokens/xtheme-token-alias-layer');
const { buildMaracaBundleAsync, createMaracaBuildPlan } = require('../../xtend-maraca');
const { MATERIAL_SHELL_RECIPES, MATERIAL_SHELL_RECIPE_REPORT_SCHEMA, validateMaterialShellRecipes } = require('../../xtend-material/shell-recipes');
const { createMaterialRecipeRegistry } = require('../../xtend-material/recipes');

const FIXTURE = 'tests/fixtures/material/material-app-shell.rmt';
const BACKLOG = 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-shell-recipes rmt-component-template-primitives layout-display-media-ux --json';
const RECIPE_IDS = ['material.app-shell', 'material.workspace', 'material.navigation-rail', 'material.top-app-bar', 'material.detail-pane'];
const PREFERRED_COMPONENTS = ['x-header', 'x-drawer', 'x-side-panel', 'x-section', 'x-router', 'x-menu', 'x-icon', 'x-button', 'x-surface-manager', 'x-surface-region'];

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function knownTokenNames() {
  const names = TOKEN_DEFINITIONS.concat(GLOBAL_ALIASES).map((entry) => entry.name);
  Object.values(COMPONENT_ALIAS_GROUPS).forEach((group) => group.aliases.forEach((entry) => names.push(entry.name)));
  return new Set(names);
}

async function createCapabilityRegistry(rootDir, tags) {
  const api = await import(pathToFileURL(path.resolve(rootDir, 'xtendrmt/rmt-component-capability-registry.js')).href);
  const completeManifest = JSON.parse(read(rootDir, 'components/manifest.json'));
  const manifest = {};
  const sourceTexts = {};
  tags.forEach((tag) => {
    manifest[tag] = completeManifest[tag];
    sourceTexts[tag] = read(rootDir, `components/${completeManifest[tag].slice(2)}`);
  });
  return api.createRmtComponentCapabilityRegistry({ manifest, sourceTexts });
}

async function runMaterialShellRecipesSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-shell-recipes', label: 'XTM-07 Material Shell Recipes' });
  const manifest = JSON.parse(read(rootDir, 'components/manifest.json'));
  const styles = read(rootDir, 'xtend-material/styles.css');
  const tokens = read(rootDir, 'xtend-material/tokens.css');
  const recipeSource = read(rootDir, 'xtend-material/shell-recipes.js');
  const recipeTypes = read(rootDir, 'xtend-material/shell-recipes.d.ts');
  const fixtureSource = read(rootDir, FIXTURE);
  const backlog = read(rootDir, BACKLOG);
  const knownComponents = new Set(Object.keys(manifest));
  const knownTokens = knownTokenNames();
  const report = validateMaterialShellRecipes(MATERIAL_SHELL_RECIPES, { knownComponents, knownTokens });
  const registry = createMaterialRecipeRegistry();

  context.assert(report.schema === MATERIAL_SHELL_RECIPE_REPORT_SCHEMA && report.ok, 'all generated shell recipes pass the XTM-07 validator');
  context.assert(MATERIAL_SHELL_RECIPES.length === 5 && MATERIAL_SHELL_RECIPES.map((recipe) => recipe.id).join(',') === RECIPE_IDS.join(','), 'registry exposes the five scoped shell recipes in stable order');
  context.assert(RECIPE_IDS.every((id) => registry.byId.has(id)), 'canonical core registry indexes every composite shell recipe');
  context.assert(new Set(MATERIAL_SHELL_RECIPES.map((recipe) => recipe.className)).size === 5, 'each shell recipe owns one semantic xtm-* class');
  MATERIAL_SHELL_RECIPES.forEach((recipe) => {
    context.assert(recipe.slots.some((slot) => slot.name === 'root' && slot.required), `${recipe.id}: required root slot is stable`);
    context.assert(recipe.parts.includes('root') && recipe.slots.every((slot) => recipe.parts.includes(slot.name)), `${recipe.id}: public parts mirror stable slots`);
    context.assert(recipe.composition.every((entry) => recipe.components.includes(entry.component) && recipe.slots.some((slot) => slot.name === entry.slot)), `${recipe.id}: composition resolves components and slots`);
    context.assert(recipe.responsive.strategy === 'container-first-with-viewport-fallback' && recipe.responsive.breakpoints.map((entry) => entry.name).join(',') === 'mobile,tablet,desktop', `${recipe.id}: responsive matrix covers all device classes`);
    context.assert(recipe.accessibility.landmarks.length > 0 && recipe.accessibility.keyboard.order && recipe.accessibility.focus.initial && recipe.accessibility.focus.restore, `${recipe.id}: landmark, keyboard and focus plans are complete`);
    context.assert(recipe.accessibility.reducedMotion && recipe.accessibility.forcedColors && recipe.accessibility.visibleFocus, `${recipe.id}: accessibility modes remain mandatory`);
    context.assert(recipe.tokens.every((token) => knownTokens.has(token)), `${recipe.id}: token references resolve to XTend SSOT`);
    context.assert(recipe.utilities.every((utility) => !/[\[\]/:]/u.test(utility)), `${recipe.id}: utility expansion remains static and closed`);
    context.assert(recipe.fallback.provider === 'native-css' && recipe.boundaries.shadowRootAccess === false && recipe.boundaries.manualHostDomWiring === false, `${recipe.id}: native fallback and DOM boundaries are closed`);
  });

  const usedComponents = new Set(MATERIAL_SHELL_RECIPES.flatMap((recipe) => recipe.components));
  PREFERRED_COMPONENTS.forEach((tag) => context.assert(usedComponents.has(tag), `shell composition uses existing ${tag}`));
  const capabilities = await createCapabilityRegistry(rootDir, PREFERRED_COMPONENTS);
  PREFERRED_COMPONENTS.forEach((tag) => {
    const capability = capabilities.resolveComponentCapability(tag);
    context.assert(capability && capability.customElement && capability.componentContract && capability.rmt, `${tag}: component and RMT capability contracts resolve`);
    context.assert(capability && capability.diagnostics.length === 0, `${tag}: capability registry reports no contract diagnostics`);
  });
  context.assert(capabilities.resolveComponentCapability('x-header').slots.includes('title') && capabilities.resolveComponentCapability('x-header').parts.includes('actions'), 'top app bar relies on public x-header slots and parts');
  context.assert(capabilities.resolveComponentCapability('x-surface-manager').slots.includes('overlays') && capabilities.resolveComponentCapability('x-surface-manager').parts.includes('workspace'), 'app shell relies on public surface-manager composition points');
  context.assert(capabilities.resolveComponentCapability('x-section').slots.includes('header') && capabilities.resolveComponentCapability('x-section').parts.includes('content'), 'detail and workspace rely on public x-section composition points');

  const badSlots = MATERIAL_SHELL_RECIPES.map((recipe, index) => index === 0 ? { ...recipe, slots: recipe.slots.filter((slot) => slot.name !== 'root') } : recipe);
  context.assert(!validateMaterialShellRecipes(badSlots, { knownComponents, knownTokens }).ok, 'validator blocks missing required root slots');
  const badComponent = MATERIAL_SHELL_RECIPES.map((recipe, index) => index === 0 ? { ...recipe, components: ['x-private-shell'] } : recipe);
  context.assert(!validateMaterialShellRecipes(badComponent, { knownComponents, knownTokens }).ok, 'validator blocks unknown parallel components');
  const badResponsive = MATERIAL_SHELL_RECIPES.map((recipe, index) => index === 0 ? { ...recipe, responsive: { ...recipe.responsive, breakpoints: recipe.responsive.breakpoints.slice(0, 2) } } : recipe);
  context.assert(!validateMaterialShellRecipes(badResponsive, { knownComponents, knownTokens }).ok, 'validator blocks incomplete responsive matrices');
  const badBoundary = MATERIAL_SHELL_RECIPES.map((recipe, index) => index === 0 ? { ...recipe, boundaries: { ...recipe.boundaries, shadowRootAccess: true } } : recipe);
  context.assert(!validateMaterialShellRecipes(badBoundary, { knownComponents, knownTokens }).ok, 'validator blocks Shadow DOM internal access');

  ['.xtm-app-shell', '.xtm-workspace', '.xtm-navigation-rail', '.xtm-top-app-bar', '.xtm-detail-pane'].forEach((selector) => context.assert(styles.includes(selector), `native stylesheet includes ${selector}`));
  context.assert(styles.includes('container: xtm-shell / inline-size') && styles.includes('@container xtm-shell (min-width: 48rem)') && styles.includes('@container xtm-shell (min-width: 80rem)'), 'native CSS implements container-first tablet and desktop layouts');
  context.assert(styles.includes('@media (min-width: 48rem)') && styles.includes('@media (min-width: 80rem)'), 'native CSS includes viewport fallback breakpoints');
  context.assert(styles.includes('grid-template-areas: "primary"') && styles.includes('grid-template-areas: "navigation primary detail"'), 'mobile and desktop workspace degradation is explicit');
  context.assert(tokens.includes('--xtm-navigation-rail-width') && tokens.includes('--xtm-detail-pane-width') && tokens.includes('--xtm-top-app-bar-height'), 'shell dimensions remain semantic implementation tokens');
  context.assert(!/\.shadowRoot\b/u.test(recipeSource) && !styles.includes('::part('), 'recipes never pierce component Shadow Roots or style internal parts');
  context.assert(recipeTypes.includes('MaterialShellRecipeId') && recipeTypes.includes('MaterialShellBreakpoint'), 'TypeScript surface exposes shell IDs and responsive records');

  const plan = createMaracaBuildPlan({ source: FIXTURE, cssProvider: 'tailwind', cssPreflight: 'disabled' }, { rootDir });
  context.assert(plan.ok && plan.status === 'planned', 'complete Material shell compiles from declarative RMT');
  context.assert(plan.cssBuild.inventory.materialClasses.join(',') === 'xtm-app-shell,xtm-detail-pane,xtm-navigation-rail,xtm-top-app-bar,xtm-workspace', 'RMT inventories only the five semantic shell classes');
  ['x-surface-manager', 'x-header', 'x-drawer', 'x-surface-region', 'x-side-panel'].forEach((tag) => context.assert(plan.components.requiredTags.includes(tag), `RMT shell selects ${tag}`));
  context.assert(!fixtureSource.includes('<') && !fixtureSource.includes('innerHTML') && fixtureSource.includes('portal material.shell.root'), 'fixture declares host composition through RMT without manual HTML');

  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-material-shell-'));
  try {
    const build = await buildMaracaBundleAsync({ source: FIXTURE, out: outputRoot, profile: 'debug', css: 'external', cssProvider: 'tailwind', cssPreflight: 'disabled' }, { rootDir });
    context.assert(build.ok, 'Material shell reaches a complete Maraca bundle');
    const css = fs.readFileSync(build.plan.outputs.css, 'utf8');
    context.assert(css.includes('.xtm-app-shell') && css.includes('.xtm-workspace') && css.includes('.xtm-detail-pane'), 'built CSS contains semantic shell selectors');
    context.assert(build.plan.cssBuild.evidence.designKit.stylesFingerprint && build.plan.cssBuild.evidence.inventory.recipeUtilities.length === 5, 'build Evidence fingerprints styles and five Recipe expansions');
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }

  context.assert(backlog.includes('| `XTM-07` | P1 | completed | WS4 |'), 'backlog marks XTM-07 completed');
  context.assert(backlog.includes(LOCAL_GATE), 'backlog exposes the complete XTM-07 gate');

  return context.result({ report: { ...report, recipeIds: RECIPE_IDS, preferredComponentCount: PREFERRED_COMPONENTS.length, localGate: LOCAL_GATE } });
}

function printMaterialShellRecipesReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-07 Material shell recipes passed.', failureTitle: 'XTM-07 Material shell recipes failed:' });
}

module.exports = { printMaterialShellRecipesReport, runMaterialShellRecipesSuite };
