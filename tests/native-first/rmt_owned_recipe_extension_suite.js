const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

const SUITE_ID = 'rmt-owned-recipe-extension';
const SUITE_LABEL = 'RMT Owned Recipe Extension';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-recipe-extension.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-recipe-extension-matrix.v1';
const FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-recipe-extension-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-recipe-extension-fixtures.v1';
const RMT_FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-recipe-extension.rmt-fixture.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-recipe-extension-report.v1';
const WORKPACKAGE = 'WP-RMO-05';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-recipe-extension --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-recipe-extension';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Recipe-Extension-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Recipe-Extension-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-05-RMT-Data-Display-und-Command-Search-Recipes-erweitern.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-recipe-extension-fixtures.json';
const RMT_FIXTURE_PATH = 'tests/fixtures/rmt-owned-recipe-extension.rmt';
const SUITE_PATH = 'tests/native-first/rmt_owned_recipe_extension_suite.js';

const REQUIRED_COMMON_FIELDS = Object.freeze([
  'fixtureId',
  'recipeId',
  'recipeClass',
  'sourceRecipes',
  'sourcePackages',
  'status',
  'expectedOutcome',
  'sourceMapPlan',
  'diagnosticPlan',
  'blockedClaims',
  'nextHandoff'
]);

const RECIPE_STATUSES = Object.freeze([
  'recipe-accepted-scoped-owned',
  'recipe-accepted-contract-evidence',
  'migration-fixture-accepted',
  'negative-fixture-accepted'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-owned-recipe-extension',
  'rmt-owned-data-display-primitives',
  'rmt-owned-command-search-primitives',
  'rmt-complete-ui-recipes',
  'rmt-action-effect-data-resource-primitives',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'native-first-overlay-focus',
  'rmt-ui-primitive-gap',
  'references'
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
  'full-datagrid-parity',
  'framework-table-api-copy',
  'virtualization-default-without-browser-evidence',
  'command-palette-full-parity',
  'framework-command-api-copy',
  'rich-combobox-autocomplete-parity',
  'manual-html-row-renderer',
  'manual-html-command-renderer',
  'unregistered-command-execution',
  'free-command-execution-without-action-ref'
]);

const REQUIRED_DIAGNOSTICS = Object.freeze([
  'rmt.recipe.collection.source_missing',
  'rmt.recipe.collection.template_missing',
  'rmt.recipe.command.action_ref_missing',
  'rmt.recipe.search.resource_missing',
  'rmt.recipe.manual_html_sink_forbidden',
  'rmt.recipe.command.unregistered_forbidden',
  'rmt.recipe.action.resource_policy_missing',
  'rmt.recipe.route.adapter_residual'
]);

const REQUIRED_RMT_KEYS = Object.freeze([
  'routes',
  'surfaces',
  'dataSources',
  'resources',
  'state',
  'selectors',
  'components',
  'templates',
  'collectionViews',
  'commandSources',
  'searchSources',
  'events',
  'actions',
  'effects',
  'schedules',
  'recipes',
  'migrationSteps',
  'negativeFixtures',
  'diagnostics',
  'sourceMap'
]);

const OWNED_COMPONENTS = Object.freeze([
  'x-section',
  'x-cards',
  'x-summary',
  'x-status',
  'x-progress',
  'x-alert',
  'x-input',
  'x-button',
  'x-menu',
  'x-popover',
  'x-icon'
]);

const DEFERRED_COMPONENTS = Object.freeze([
  'x-list',
  'x-table',
  'x-tree',
  'x-virtual-list',
  'x-command-palette',
  'x-autocomplete',
  'x-combobox'
]);

const FORBIDDEN_TOKENS = Object.freeze([
  'innerHTML',
  'eval(',
  'function ',
  'for(',
  'while('
]);

function assertIncludesAll(context, content, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(content, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertPathExists(context, rootDir, relativePath, label) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${label} exists at ${relativePath}`);
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    acc[item[field]] = (acc[item[field]] || 0) + 1;
    return acc;
  }, {});
}

function containsForbiddenToken(text) {
  return FORBIDDEN_TOKENS.some((token) => String(text).includes(token));
}

function runRmtOwnedRecipeExtensionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText(CONTRACT_PATH, rootDir);
  const matrix = readText(MATRIX_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const completeRecipeMatrix = readText('development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', rootDir);
  const dataDisplayContract = readText('development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md', rootDir);
  const commandSearchContract = readText('development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md', rootDir);
  const actionResourceMatrix = readText('development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', rootDir);
  const eventRuntime = readText('xtendrmt/rmt-event-routing-runtime.js', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const rmtFixture = readJson(RMT_FIXTURE_PATH, rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedRecipeExtension;
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  [
    BACKLOG_PATH,
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-RMO-05 artifact ${relativePath}`));
  context.assert(suiteSyntax.ok, `WP-RMO-05 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    RMT_FIXTURE_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'owned-dashboard-collection-recipe',
    'owned-command-search-workspace-recipe',
    'owned-crud-navigation-async-recipe',
    'migration-fixture',
    'negative-fixtures',
    'no-runtime-dependency',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'Recipe extension contract');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Recipe extension contract gates');
  assertIncludesAll(context, contract, REQUIRED_BLOCKED_CLAIMS, 'Recipe extension contract blocked claims');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    RMT_FIXTURE_SCHEMA,
    REPORT_SCHEMA,
    'RMO-RCR-10',
    'RMO-RCR-11',
    'RMO-RCR-12',
    'RMO-RCR-13',
    'RMO-RCR-14',
    'recipe-accepted-scoped-owned',
    'recipe-accepted-contract-evidence',
    'migration-fixture-accepted',
    'negative-fixture-accepted',
    'blocked-until-owned-data-display-package',
    'accepted-with-scoped-owned-data-display-package',
    'blocked-until-owned-command-search-package',
    'accepted-with-scoped-owned-command-search-package'
  ], 'Recipe extension matrix');
  assertIncludesAll(context, matrix, REQUIRED_DIAGNOSTICS, 'Recipe extension matrix diagnostics');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    RMT_FIXTURE_SCHEMA,
    LOCAL_GATE,
    CONTRACT_PATH,
    MATRIX_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH,
    'RMO-RCR-10',
    'RMO-RCR-11',
    'RMO-RCR-12',
    'RMO-RCR-13',
    'RMO-RCR-14',
    'WP-RMO-06',
    'WP-RMO-07'
  ], 'WP-RMO-05 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes fixture schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.rmtFixtureSchema === RMT_FIXTURE_SCHEMA, 'Fixture pack references RMT fixture schema');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-05');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  context.assert(fixtures.rmtFixture === RMT_FIXTURE_PATH, 'Fixture pack references RMT fixture path');
  context.assert(fixtures.noRuntimeDependency === true, 'Fixture pack adds no runtime dependency');
  context.assert(fixtures.externalUiFrameworkDependencyAllowed === false, 'Fixture pack blocks external UI framework dependency');
  context.assert(fixtures.freeRuntimeExecutionAllowed === false, 'Fixture pack blocks free runtime execution');
  context.assert(fixtures.manualHtmlRendererAllowed === false, 'Fixture pack blocks manual HTML renderer');
  context.assert(fixtures.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Fixture pack keeps RMT kernel boundary');
  assertArrayIncludesAll(context, fixtures.sourcePackages, [
    'xtend.rmt-ui-maximality-owned-data-display-primitives.v1',
    'xtend.rmt-ui-maximality-owned-command-search-primitives.v1'
  ], 'Fixture pack source packages');
  assertArrayIncludesAll(context, fixtures.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Fixture pack blocked claims');
  assertArrayIncludesAll(context, fixtures.diagnostics, REQUIRED_DIAGNOSTICS, 'Fixture pack diagnostics');

  const fixtureRows = fixtures.fixtures || [];
  context.assert(fixtureRows.length === 5, 'Fixture pack has five RMO recipe extension fixtures');
  fixtureRows.forEach((fixture) => {
    REQUIRED_COMMON_FIELDS.forEach((field) => {
      context.assert(Object.prototype.hasOwnProperty.call(fixture, field), `${fixture.fixtureId} has ${field}`);
    });
    context.assert(!containsForbiddenToken(JSON.stringify(fixture)), `${fixture.fixtureId} avoids forbidden runtime tokens`);
  });
  const statusCounts = countBy(fixtureRows, 'status');
  context.assert(statusCounts['recipe-accepted-scoped-owned'] === 2, 'Status summary accepted scoped owned is 2');
  context.assert(statusCounts['recipe-accepted-contract-evidence'] === 1, 'Status summary contract evidence is 1');
  context.assert(statusCounts['migration-fixture-accepted'] === 1, 'Status summary migration fixture is 1');
  context.assert(statusCounts['negative-fixture-accepted'] === 1, 'Status summary negative fixture is 1');
  Object.entries(fixtures.statusSummary).forEach(([status, count]) => {
    context.assert(statusCounts[status] === count, `Fixture summary ${status} matches entries`);
  });

  const dashboardRecipe = fixtureRows.find((fixture) => fixture.recipeId === 'RMO-RCR-10');
  const commandRecipe = fixtureRows.find((fixture) => fixture.recipeId === 'RMO-RCR-11');
  const crudRecipe = fixtureRows.find((fixture) => fixture.recipeId === 'RMO-RCR-12');
  const migrationRecipe = fixtureRows.find((fixture) => fixture.recipeId === 'RMO-RCR-13');
  const negativeRecipe = fixtureRows.find((fixture) => fixture.recipeId === 'RMO-RCR-14');
  assertArrayIncludesAll(context, dashboardRecipe && dashboardRecipe.coreRecordPlan, ['collectionViews[]', 'dataSources[]', 'resources[]', 'selectors[]'], 'Dashboard recipe core records');
  assertArrayIncludesAll(context, commandRecipe && commandRecipe.coreRecordPlan, ['commandSources[]', 'searchSources[]', 'effects[]', 'resources[]'], 'Command recipe core records');
  assertArrayIncludesAll(context, crudRecipe && crudRecipe.coreRecordPlan, ['routes[]', 'collectionViews[]', 'commandSources[]', 'searchSources[]'], 'CRUD navigation async recipe core records');
  assertArrayIncludesAll(context, migrationRecipe && migrationRecipe.migrationSteps, ['data-display-blocker-to-scoped-package', 'command-search-blocker-to-scoped-package'], 'Migration recipe steps');
  assertArrayIncludesAll(context, negativeRecipe && negativeRecipe.negativeFixtures, ['manual-html-row-renderer', 'manual-html-command-renderer', 'unregistered-command-execution', 'free-command-execution-without-action-ref'], 'Negative recipe fixtures');

  context.assert(rmtFixture.schema === RMT_FIXTURE_SCHEMA, 'RMT fixture exposes schema');
  context.assert(rmtFixture.manifest.metadata.contractVersion === CONTRACT_SCHEMA, 'RMT fixture references contract');
  context.assert(rmtFixture.manifest.metadata.manualHtmlRendererAllowed === false, 'RMT fixture blocks manual HTML renderer');
  context.assert(rmtFixture.manifest.metadata.htmlStringRendererRequired === false, 'RMT fixture avoids HTML string renderer');
  context.assert(rmtFixture.manifest.metadata.externalUiFrameworkDependencyAllowed === false, 'RMT fixture blocks external UI framework dependency');
  context.assert(rmtFixture.manifest.metadata.freeRuntimeExecutionAllowed === false, 'RMT fixture blocks free runtime execution');
  context.assert(rmtFixture.manifest.metadata.runtimeImplementationIncluded === false, 'RMT fixture is evidence, not runtime implementation');
  context.assert(rmtFixture.manifest.metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'RMT fixture keeps kernel boundary');
  assertArrayIncludesAll(context, rmtFixture.manifest.metadata.extendsRecipes, ['NFM-RCR-06', 'NFM-RCR-07'], 'RMT fixture extends NFM recipes');
  REQUIRED_RMT_KEYS.forEach((key) => {
    context.assert(Array.isArray(rmtFixture[key]) && rmtFixture[key].length > 0, `RMT fixture has ${key}`);
  });
  context.assert(rmtFixture.collectionViews[0].id === 'collection.orders', 'RMT fixture has dashboard collection view');
  context.assert(rmtFixture.commandSources[0].id === 'command.global', 'RMT fixture has command source');
  context.assert(rmtFixture.commandSources[0].actionRefRequired === true, 'Command source requires action refs');
  context.assert(rmtFixture.searchSources[0].id === 'search.commands', 'RMT fixture has search source');
  context.assert(rmtFixture.searchSources[0].resource === 'resource.commands', 'Search source binds resource');
  assertArrayIncludesAll(context, rmtFixture.diagnostics, REQUIRED_DIAGNOSTICS, 'RMT fixture diagnostics');
  assertArrayIncludesAll(context, rmtFixture.negativeClaims, REQUIRED_BLOCKED_CLAIMS, 'RMT fixture negative claims');
  context.assert(!containsForbiddenToken(JSON.stringify(rmtFixture)), 'RMT fixture avoids forbidden runtime tokens');

  const manifestTags = new Set((rmtFixture.components || []).map((component) => component.tag));
  OWNED_COMPONENTS.forEach((tag) => {
    context.assert(Object.prototype.hasOwnProperty.call(componentManifest, tag), `Component manifest exposes ${tag}`);
    context.assert(manifestTags.has(tag), `RMT fixture uses owned component ${tag}`);
  });
  DEFERRED_COMPONENTS.forEach((tag) => {
    context.assert(!Object.prototype.hasOwnProperty.call(componentManifest, tag), `Manifest does not claim deferred ${tag}`);
    context.assert(!manifestTags.has(tag), `RMT fixture avoids deferred ${tag}`);
  });

  assertIncludesAll(context, completeRecipeMatrix, [
    'NFM-RCR-06',
    'NFM-RCR-07',
    'blocked-until-owned-data-display-package',
    'blocked-until-owned-command-search-package',
    'WP-RMO-05 Recipe Extension',
    'RMO-RCR-10',
    'RMO-RCR-11',
    'accepted-with-scoped-owned-data-display-package',
    'accepted-with-scoped-owned-command-search-package'
  ], 'Complete UI recipe matrix extension');
  assertIncludesAll(context, dataDisplayContract, [
    'xtend.rmt-ui-maximality-owned-data-display-primitives.v1',
    'collection-view-record',
    'scoped-owned-data-display-package',
    'WP-RMO-05'
  ], 'Data Display source package handoff');
  assertIncludesAll(context, commandSearchContract, [
    'xtend.rmt-ui-maximality-owned-command-search-primitives.v1',
    'command-source-record',
    'search-source-resource-binding',
    'scoped-owned-command-search-package',
    'WP-RMO-05'
  ], 'Command/Search source package handoff');
  assertIncludesAll(context, actionResourceMatrix, [
    'NFM-RAE-06',
    'command-search-resource-binding-record',
    'action-ref-required',
    'resource-query-lifecycle-record'
  ], 'Action/effect/resource compatibility');
  assertIncludesAll(context, eventRuntime, [
    'createRmtEventRoutingRuntime',
    'routeEvent',
    'command'
  ], 'Event routing runtime compatibility');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH,
    '| `WP-RMO-04` | P0 | completed |',
    '| `WP-RMO-05` | P1 | completed |',
    '| `WP-RMO-06` | P1 | completed |',
    '| `WP-RMO-07` | P1 | completed |',
    '| `WP-RMO-08` | P2 | completed |',
    '| `WP-RMO-09` | P2 | completed |',
    'rmt-owned-recipe-extension'
  ], 'Backlog WP-RMO-05 status');

  context.assert(packageManifest.scripts['test:rmt-owned-recipe-extension'] === 'node scripts/run_xtend_tests.js rmt-owned-recipe-extension', 'Package exposes WP-RMO-05 test script');
  context.assertIncludes(runner, "require('../tests/native-first/rmt_owned_recipe_extension_suite')", 'Runner imports WP-RMO-05 suite');
  context.assertIncludes(runner, "id: 'rmt-owned-recipe-extension'", 'Runner registers WP-RMO-05 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    context.assertIncludes(runner, `id: '${gate}'`, `Runner registers source gate ${gate}`);
  });

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.rmtFixtureSchema === RMT_FIXTURE_SCHEMA, 'Package metadata exposes RMT fixture schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-05');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata marks WP-RMO-05 accepted');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixtures path');
  context.assert(metadata && metadata.rmtFixture === RMT_FIXTURE_PATH, 'Package metadata exposes RMT fixture path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework');
  context.assert(metadata && metadata.freeRuntimeExecutionAllowed === false, 'Package metadata blocks free runtime execution');
  context.assert(metadata && metadata.manualHtmlRendererAllowed === false, 'Package metadata blocks manual HTML renderer');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');
  assertArrayIncludesAll(context, metadata && metadata.diagnostics, REQUIRED_DIAGNOSTICS, 'Package metadata diagnostics');
  assertArrayIncludesAll(context, metadata && metadata.recipeIds, ['RMO-RCR-10', 'RMO-RCR-11', 'RMO-RCR-12', 'RMO-RCR-13', 'RMO-RCR-14'], 'Package metadata recipe IDs');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      recipes: fixtureRows.length,
      statusCounts,
      diagnostics: REQUIRED_DIAGNOSTICS.length,
      blockedClaims: REQUIRED_BLOCKED_CLAIMS.length,
      localGate: LOCAL_GATE
    }
  });
}

function printRmtOwnedRecipeExtensionReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Recipe Extension erfolgreich.',
    failureTitle: 'RMT Owned Recipe Extension fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedRecipeExtensionReport,
  runRmtOwnedRecipeExtensionSuite
};
