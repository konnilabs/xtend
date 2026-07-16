'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { buildMaracaBundleAsync, createMaracaBuildPlan } = require('../../xtend-maraca');
const {
  DEFAULT_MATERIAL_RECIPES,
  MATERIAL_RECIPE_REGISTRY_SCHEMA,
  RMT_CSS_SOURCE_INVENTORY_SCHEMA,
  createMaterialRecipeRegistry,
  createMaterialRecipeStylesheet,
  createRmtCssSourceInventory
} = require('../../xtend-maraca-css-tailwind/source-inventory');

const VALID_FIXTURE = 'tests/rmt-language/fixtures/rmt-tailwind-material-classes-valid.rmt';
const DYNAMIC_FIXTURE = 'tests/rmt-language/fixtures/rmt-tailwind-material-classes-dynamic-invalid.rmt';
const UNSUPPORTED_FIXTURE = 'tests/rmt-language/fixtures/rmt-tailwind-material-classes-unsupported-invalid.rmt';

async function runRmtTailwindSourceInventorySuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'rmt-tailwind-source-inventory', label: 'RMT Tailwind Source Inventory' });
  const validSource = fs.readFileSync(path.join(rootDir, VALID_FIXTURE), 'utf8');
  const rendererSource = fs.readFileSync(path.join(rootDir, 'xtendrmt/rmt-dom-descriptor-renderer.js'), 'utf8');
  const backlog = fs.readFileSync(path.join(rootDir, 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md'), 'utf8');
  const adapterManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'xtend-maraca-css-tailwind/package.json'), 'utf8'));

  const registry = createMaterialRecipeRegistry();
  context.assert(registry.schema === MATERIAL_RECIPE_REGISTRY_SCHEMA && registry.namespace === 'xtm-', 'recipe registry owns the xtm-* namespace');
  context.assert(registry.records.length === DEFAULT_MATERIAL_RECIPES.length && registry.records.length >= 12, 'default Material kit exposes a useful closed recipe vocabulary');
  context.assert(registry.records.every((recipe) => recipe.className.startsWith('xtm-') && recipe.utilities.length > 0), 'every public Material class has a closed utility expansion');
  context.assert(registry.records.every((recipe) => recipe.utilities.every((utility) => !/[\[\]/:]/u.test(utility))), 'recipe registry contains no arbitrary, slash or variant syntax');
  context.assert(adapterManifest.exports['./source-inventory'].default === './source-inventory.js', 'adapter publishes the source-inventory endpoint');

  const direct = createRmtCssSourceInventory({
    sourceText: 'viewTemplate {\n  class "xtm-card xtm-stack"\n}',
    filePath: 'fixture.rmt',
    descriptors: [{ class: { 'xtm-card': { op: 'equals', left: '$model.active', right: true } } }]
  });
  context.assert(direct.schema === RMT_CSS_SOURCE_INVENTORY_SCHEMA && direct.ok, 'inventory emits the stable accepted schema');
  context.assert(direct.materialClasses.join(',') === 'xtm-card,xtm-stack', 'inventory deduplicates source and descriptor classes');
  context.assert(direct.records.some((record) => record.classification === 'literal'), 'literal classes are classified');
  const conditional = createRmtCssSourceInventory({ descriptors: [{ classes: { 'xtm-card': '$model.visible' } }] });
  context.assert(conditional.ok && conditional.records[0].classification === 'conditional-static', 'conditional static class maps remain enumerable');
  context.assert(createMaterialRecipeStylesheet(['xtm-card'], registry).includes('@utility xtm-card'), 'recipes generate semantic Tailwind utilities instead of public utility strings');

  const customRegistry = createMaterialRecipeRegistry([{ className: 'xtm-metric', category: 'data', utilities: ['flex', 'items-baseline', 'gap-2'] }]);
  const custom = createRmtCssSourceInventory({ sourceText: 'class "xtm-metric"', registry: customRegistry });
  context.assert(custom.ok && custom.recipeUtilities[0].className === 'xtm-metric', 'framework-owned extensions can register a reviewed closed recipe');

  const validPlan = createMaracaBuildPlan({
    source: VALID_FIXTURE,
    cssProvider: 'tailwind',
    cssPreflight: 'disabled'
  }, { rootDir });
  context.assert(validPlan.ok && validPlan.cssBuild.inventory.schema === RMT_CSS_SOURCE_INVENTORY_SCHEMA, 'Maraca plan inventories compiled RMT and descriptors');
  context.assert(validPlan.cssBuild.inventory.materialClasses.join(',') === 'xtm-app-shell,xtm-card,xtm-page,xtm-stack', 'valid RMT exposes only structured Material classes');
  context.assert(validPlan.cssBuild.inventory.blockedUtilities.length === 0 && validPlan.cssBuild.inventory.dynamicCandidates.length === 0, 'valid inventory contains no blocked or dynamic candidates');
  context.assert(validPlan.cssBuild.request.metadata.candidates.every((candidate) => candidate.startsWith('xtm-')), 'only semantic Material candidates cross into the provider request');
  context.assert(!/class\s+"(?:grid|flex|p-|m-)/u.test(validSource), 'valid RMT fixture contains no Tailwind class salad');

  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-css-inventory-'));
  const secondOutputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-css-inventory-'));
  try {
    const buildInput = { source: VALID_FIXTURE, profile: 'debug', css: 'external', cssProvider: 'tailwind', cssPreflight: 'disabled' };
    const first = await buildMaracaBundleAsync({ ...buildInput, out: outputRoot }, { rootDir });
    const second = await buildMaracaBundleAsync({ ...buildInput, out: secondOutputRoot }, { rootDir });
    context.assert(first.ok && second.ok, 'static Material RMT classes reach the Tailwind build');
    const firstCss = fs.readFileSync(first.plan.outputs.css, 'utf8');
    const secondCss = fs.readFileSync(second.plan.outputs.css, 'utf8');
    context.assert(firstCss.includes('.xtm-app-shell') && firstCss.includes('.xtm-card') && firstCss.includes('.xtm-stack'), 'build emits semantic xtm-* selectors');
    context.assert(!/\.(?:grid|p-4|p-6|max-w-7xl)\s*\{/u.test(firstCss), 'internal recipe utilities do not leak as public selectors');
    context.assert(first.plan.cssBuild.evidence.outputFingerprint === second.plan.cssBuild.evidence.outputFingerprint && firstCss === secondCss, 'inventory-driven CSS is deterministic');
    context.assert(first.bundleReport.cssBuild.inventory.staticUtilities.includes('grid'), 'bundle evidence reports internal static utilities');
    context.assert(first.bundleReport.cssBuild.inventory.recipeUtilities.length === 4, 'bundle evidence reports recipe utility expansions');
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    fs.rmSync(secondOutputRoot, { recursive: true, force: true });
  }

  const dynamicPlan = createMaracaBuildPlan({ source: DYNAMIC_FIXTURE, cssProvider: 'tailwind' }, { rootDir });
  const dynamicDiagnostic = dynamicPlan.diagnostics.find((entry) => entry.code === 'rmt.css.utility.dynamic_name');
  context.assert(!dynamicPlan.ok && dynamicPlan.status === 'blocked', 'dynamic class names block before CSS build');
  context.assert(dynamicDiagnostic && dynamicDiagnostic.source.line > 0 && dynamicDiagnostic.source.column > 0, 'dynamic diagnostic carries RMT source location');
  context.assert(dynamicDiagnostic && dynamicDiagnostic.repairHint.includes('static xtm-*'), 'dynamic diagnostic includes an actionable repair hint');

  const unsupportedPlan = createMaracaBuildPlan({ source: UNSUPPORTED_FIXTURE, cssProvider: 'tailwind' }, { rootDir });
  const codes = new Set(unsupportedPlan.diagnostics.map((entry) => entry.code));
  context.assert(!unsupportedPlan.ok && codes.has('rmt.css.utility.unsupported_syntax'), 'arbitrary values, variants and slash modifiers are blocked');
  context.assert(codes.has('rmt.css.utility.unowned_safelist'), 'raw utilities and unknown Material classes are blocked');
  context.assert(unsupportedPlan.cssBuild.inventory.blockedUtilities.includes('grid') && unsupportedPlan.cssBuild.inventory.blockedUtilities.includes('w-[42px]'), 'blocked utility report is explicit and reviewable');

  const outsidePlan = createMaracaBuildPlan({ source: VALID_FIXTURE, cssProvider: 'tailwind', cssSources: ['../outside.html'] }, { rootDir });
  context.assert(!outsidePlan.ok && outsidePlan.diagnostics.some((entry) => entry.code === 'rmt.css.utility.source_outside_policy'), 'sources outside the application root are blocked by policy');

  context.assert(rendererSource.includes("if (!/^-?[_a-zA-Z]+[_a-zA-Z0-9-:]*$/u.test(token))"), 'Trusted-DOM renderer class regex is not widened');
  context.assert(!rendererSource.includes('w-\\[') && !rendererSource.includes('text-sm/6'), 'renderer receives no special-case bypass for blocked Tailwind syntax');
  context.assert(backlog.includes('| `XTM-04` | P0 | completed | WS2 |'), 'backlog marks XTM-04 completed');

  return context.result({ report: {
    schema: 'xtend.rmt.css-source-inventory-report.v1',
    status: context.failures.length === 0 ? 'accepted' : 'blocked',
    inventorySchema: RMT_CSS_SOURCE_INVENTORY_SCHEMA,
    recipeCount: registry.records.length,
    authoringContract: 'xtm-material-classes-only'
  } });
}

function printRmtTailwindSourceInventoryReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Tailwind source inventory gate passed.',
    failureTitle: 'RMT Tailwind source inventory gate failed:'
  });
}

if (require.main === module) {
  runRmtTailwindSourceInventorySuite().then((result) => {
    printRmtTailwindSourceInventoryReport(result);
    if (!result.ok) process.exit(1);
  }).catch((error) => {
    console.error(error && error.stack || error);
    process.exit(1);
  });
}

module.exports = { printRmtTailwindSourceInventoryReport, runRmtTailwindSourceInventorySuite };
