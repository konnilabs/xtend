'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { TOKEN_DEFINITIONS } = require('../../design-tokens/xtend-design-tokens');
const { COMPONENT_ALIAS_GROUPS, GLOBAL_ALIASES } = require('../../design-tokens/xtheme-token-alias-layer');
const { buildMaracaBundleAsync, createMaracaBuildPlan } = require('../../xtend-maraca');
const {
  BLOCKED_PARITY_CLAIMS,
  COMPONENT_OWNED_STATES,
  MATERIAL_FLOW_RECIPES,
  MATERIAL_FLOW_RECIPE_REPORT_SCHEMA,
  validateMaterialFlowRecipes
} = require('../../xtend-material/flow-recipes');
const { createMaterialRecipeRegistry } = require('../../xtend-material/recipes');

const FIXTURE = 'tests/fixtures/material/material-flow-recipes.rmt';
const FREE_UTILITY_FIXTURE = 'tests/fixtures/material/material-flow-free-utility-invalid.rmt';
const MISSING_COMPONENT_FIXTURE = 'tests/fixtures/material/material-flow-missing-component.json';
const UNKNOWN_SLOT_FIXTURE = 'tests/fixtures/material/material-flow-unknown-slot.json';
const DOC = 'development/XTend-Material-Flow-Recipes.md';
const BACKLOG = 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-flow-recipes form-controls-ux feedback-status-ux overlay-interaction-ux --json';
const RECIPE_IDS = ['material.form-flow', 'material.feedback-stack', 'material.dashboard', 'material.content-page', 'material.settings-page', 'material.empty-state', 'material.confirmation-flow'];
const RECIPE_CLASSES = ['xtm-form-flow', 'xtm-feedback-stack', 'xtm-dashboard', 'xtm-content-page', 'xtm-settings-page', 'xtm-empty-state', 'xtm-confirmation-flow'];
const PREFERRED_COMPONENTS = ['x-form', 'x-input', 'x-textarea', 'x-select', 'x-checkbox', 'x-radio', 'x-toggle', 'x-button', 'x-status', 'x-alert', 'x-progress', 'x-cards', 'x-summary', 'x-dialog', 'x-toast'];

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

function applyNegativeFixture(recipes, fixture) {
  return recipes.map((recipe) => {
    if (recipe.id !== fixture.recipeId) return recipe;
    if (fixture.mutation === 'missing-component') return { ...recipe, components: recipe.components.concat(fixture.component) };
    if (fixture.mutation === 'unknown-slot') return { ...recipe, slots: recipe.slots.concat({ name: fixture.slot, required: false, semanticRole: 'grid' }) };
    return recipe;
  });
}

async function runMaterialFlowRecipesSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-flow-recipes', label: 'XTM-08 Material Flow Recipes' });
  const manifest = JSON.parse(read(rootDir, 'components/manifest.json'));
  const styles = read(rootDir, 'xtend-material/styles.css');
  const tokens = read(rootDir, 'xtend-material/tokens.css');
  const recipeSource = read(rootDir, 'xtend-material/flow-recipes.js');
  const recipeTypes = read(rootDir, 'xtend-material/flow-recipes.d.ts');
  const fixtureSource = read(rootDir, FIXTURE);
  const docs = read(rootDir, DOC);
  const backlog = read(rootDir, BACKLOG);
  const knownComponents = new Set(Object.keys(manifest));
  const knownTokens = knownTokenNames();
  const report = validateMaterialFlowRecipes(MATERIAL_FLOW_RECIPES, { knownComponents, knownTokens });
  const registry = createMaterialRecipeRegistry();

  context.assert(report.schema === MATERIAL_FLOW_RECIPE_REPORT_SCHEMA && report.ok, 'all seven flow recipes pass the XTM-08 validator');
  context.assert(MATERIAL_FLOW_RECIPES.length === 7 && MATERIAL_FLOW_RECIPES.map((recipe) => recipe.id).join(',') === RECIPE_IDS.join(','), 'flow registry exposes the scoped recipes in stable order');
  context.assert(RECIPE_IDS.every((id) => registry.byId.has(id)) && RECIPE_CLASSES.every((className) => registry.byClass.has(className)), 'canonical registry indexes every XTM-08 id and semantic class');
  MATERIAL_FLOW_RECIPES.forEach((recipe) => {
    context.assert(recipe.slots.some((slot) => slot.name === 'root' && slot.required), `${recipe.id}: required root slot is stable`);
    context.assert(recipe.parts.includes('root') && recipe.slots.every((slot) => recipe.parts.includes(slot.name)), `${recipe.id}: public parts mirror all stable slots`);
    context.assert(recipe.composition.every((entry) => recipe.components.includes(entry.component) && recipe.slots.some((slot) => slot.name === entry.slot)), `${recipe.id}: composition resolves components and recipe slots`);
    context.assert(recipe.responsive.strategy === 'intrinsic-first-with-container-enhancement' && recipe.responsive.breakpoints.map((entry) => entry.name).join(',') === 'compact,wide', `${recipe.id}: compact and wide degradation is explicit`);
    context.assert(recipe.behaviorOwnership.owner === 'component-and-rmt' && COMPONENT_OWNED_STATES.every((state) => recipe.behaviorOwnership.states.includes(state)), `${recipe.id}: validation and interactive states remain component/RMT owned`);
    context.assert(recipe.accessibility.statusSemantics.nonColor && recipe.accessibility.statusSemantics.liveRegionsOwnedByComponents, `${recipe.id}: status never relies on color and live regions remain component-owned`);
    context.assert(recipe.accessibility.visibleFocus && recipe.accessibility.reducedMotion && recipe.accessibility.forcedColors, `${recipe.id}: focus and preference modes remain mandatory`);
    context.assert(BLOCKED_PARITY_CLAIMS.every((claim) => recipe.claims.blockedParity.includes(claim)), `${recipe.id}: unsupported parity claims remain blocked`);
    context.assert(recipe.tokens.every((token) => knownTokens.has(token)) && recipe.utilities.every((utility) => !/[\[\]/:]/u.test(utility)), `${recipe.id}: tokens resolve and utility expansion stays closed`);
    context.assert(recipe.fallback.provider === 'native-css' && Object.values(recipe.boundaries).every((value) => value === false), `${recipe.id}: native fallback and implementation boundaries are closed`);
  });

  const usedComponents = new Set(MATERIAL_FLOW_RECIPES.flatMap((recipe) => recipe.components));
  PREFERRED_COMPONENTS.forEach((tag) => context.assert(usedComponents.has(tag), `flow composition uses existing ${tag}`));
  const capabilities = await createCapabilityRegistry(rootDir, PREFERRED_COMPONENTS);
  PREFERRED_COMPONENTS.forEach((tag) => {
    const capability = capabilities.resolveComponentCapability(tag);
    context.assert(capability && capability.customElement && capability.componentContract && capability.rmt, `${tag}: component and RMT capability contracts resolve`);
    context.assert(capability && capability.diagnostics.length === 0, `${tag}: capability registry reports no diagnostics`);
  });
  MATERIAL_FLOW_RECIPES.flatMap((recipe) => recipe.composition).filter((entry) => entry.componentSlot).forEach((entry) => {
    const capability = capabilities.resolveComponentCapability(entry.component);
    context.assert(capability.slots.includes(entry.componentSlot), `${entry.component}: referenced public slot ${entry.componentSlot} exists`);
  });
  context.assert(capabilities.resolveComponentCapability('x-form').parts.includes('error') && capabilities.resolveComponentCapability('x-input').parts.includes('status'), 'form recipes rely on public validation and status parts');
  context.assert(capabilities.resolveComponentCapability('x-dialog').parts.includes('actions') && capabilities.resolveComponentCapability('x-toast').parts.includes('content'), 'confirmation flow relies on public overlay and feedback parts');

  const missingComponent = JSON.parse(read(rootDir, MISSING_COMPONENT_FIXTURE));
  const unknownSlot = JSON.parse(read(rootDir, UNKNOWN_SLOT_FIXTURE));
  context.assert(!validateMaterialFlowRecipes(applyNegativeFixture(MATERIAL_FLOW_RECIPES, missingComponent), { knownComponents, knownTokens }).ok, 'missing-component fixture blocks invented autocomplete parity');
  context.assert(!validateMaterialFlowRecipes(applyNegativeFixture(MATERIAL_FLOW_RECIPES, unknownSlot), { knownComponents, knownTokens }).ok, 'unknown-slot fixture blocks invented data-grid composition');
  const badOwnership = MATERIAL_FLOW_RECIPES.map((recipe, index) => index === 0 ? { ...recipe, behaviorOwnership: { ...recipe.behaviorOwnership, owner: 'material-css' } } : recipe);
  context.assert(!validateMaterialFlowRecipes(badOwnership, { knownComponents, knownTokens }).ok, 'validator blocks CSS ownership of validation behavior');
  const badClaim = MATERIAL_FLOW_RECIPES.map((recipe, index) => index === 0 ? { ...recipe, claims: { blockedParity: ['data-grid'] } } : recipe);
  context.assert(!validateMaterialFlowRecipes(badClaim, { knownComponents, knownTokens }).ok, 'validator blocks incomplete negative parity claims');

  RECIPE_CLASSES.forEach((className) => context.assert(styles.includes(`.${className}`), `native stylesheet includes .${className}`));
  context.assert(styles.includes('x-form.xtm-form-flow') && styles.includes('x-form.xtm-settings-page'), 'native CSS leaves RMT form-host layout component-owned while wrapper recipes retain structural layout');
  context.assert(styles.includes('container: xtm-flow / inline-size') && styles.includes('@container xtm-flow (min-width: 48rem)'), 'native CSS enhances intrinsic flow layouts through a container query');
  context.assert(styles.includes('grid-template-areas: "summary" "primary" "secondary"') && styles.includes('grid-template-areas: "header header" "body aside" "footer footer"'), 'dashboard and content page have explicit compact and wide compositions');
  context.assert(tokens.includes('--xtm-flow-content-width') && tokens.includes('--xtm-flow-reading-width') && tokens.includes('--xtm-flow-field-min-width'), 'flow sizing remains semantic implementation tokens');
  context.assert(!/\.shadowRoot\b/u.test(recipeSource) && !styles.includes('::part('), 'flow recipes never pierce component Shadow Roots');
  context.assert(recipeTypes.includes('MaterialFlowRecipeId') && recipeTypes.includes('MaterialFlowBlockedParityClaim'), 'TypeScript surface exposes flow ids and explicit non-claims');

  const plan = createMaracaBuildPlan({ source: FIXTURE, cssProvider: 'tailwind', cssPreflight: 'disabled' }, { rootDir });
  context.assert(plan.ok && plan.status === 'planned' && plan.diagnostics.length === 0, 'form-to-confirmation and content flows compile from declarative RMT');
  context.assert(plan.cssBuild.inventory.materialClasses.join(',') === RECIPE_CLASSES.slice().sort().join(','), 'RMT inventories only the seven semantic flow classes');
  ['x-form', 'x-input', 'x-button', 'x-status', 'x-cards', 'x-summary', 'x-alert', 'x-dialog', 'x-toast'].forEach((tag) => context.assert(plan.components.requiredTags.includes(tag), `RMT flow fixture selects ${tag}`));
  context.assert(fixtureSource.includes('validation material.flow.contact') && fixtureSource.includes('target action material.flow.confirm') && fixtureSource.includes('reduce state.material.flow.confirmation.open = true'), 'RMT owns blocking validation and the transition to confirmation');
  context.assert(fixtureSource.includes('feedback.text = "Ready for confirmation."') && fixtureSource.includes('feedback.tone = "success"'), 'success feedback combines text and tone instead of color alone');
  context.assert(!fixtureSource.includes('innerHTML') && !fixtureSource.includes('.shadowRoot'), 'flow fixture contains no host DOM wiring');

  const invalidPlan = createMaracaBuildPlan({ source: FREE_UTILITY_FIXTURE, cssProvider: 'tailwind', cssPreflight: 'disabled' }, { rootDir });
  context.assert(!invalidPlan.ok && invalidPlan.status === 'blocked' && invalidPlan.diagnostics.some((entry) => entry.code === 'rmt.css.utility.unowned_safelist'), 'free-utility RMT fixture is blocked with the owned-safelist diagnostic');

  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-material-flow-'));
  try {
    const build = await buildMaracaBundleAsync({ source: FIXTURE, out: outputRoot, profile: 'debug', css: 'external', cssProvider: 'tailwind', cssPreflight: 'disabled' }, { rootDir });
    context.assert(build.ok, 'complete flow fixture reaches a Maraca bundle');
    const css = fs.readFileSync(build.plan.outputs.css, 'utf8');
    context.assert(RECIPE_CLASSES.every((className) => css.includes(`.${className}`)), 'built CSS contains every semantic flow selector');
    context.assert(build.plan.cssBuild.evidence.inventory.recipeUtilities.length === 7, 'build Evidence records exactly seven flow Recipe expansions');
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }

  context.assert(docs.includes('## Form to confirmation') && docs.includes('## Dashboard and content') && BLOCKED_PARITY_CLAIMS.every((claim) => docs.toLowerCase().includes(claim)), 'Recipe documentation includes RMT snippets and explicit non-claims');
  context.assert(backlog.includes('| `XTM-08` | P1 | completed | WS4 |'), 'backlog marks XTM-08 completed');
  context.assert(backlog.includes(LOCAL_GATE), 'backlog exposes the complete XTM-08 gate');

  return context.result({ report: { ...report, recipeIds: RECIPE_IDS, preferredComponentCount: PREFERRED_COMPONENTS.length, localGate: LOCAL_GATE } });
}

function printMaterialFlowRecipesReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-08 Material flow recipes passed.', failureTitle: 'XTM-08 Material flow recipes failed:' });
}

module.exports = { printMaterialFlowRecipesReport, runMaterialFlowRecipesSuite };
