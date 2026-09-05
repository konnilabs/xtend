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

const SUITE_ID = 'rmt-owned-data-display-primitives';
const SUITE_LABEL = 'RMT Owned Data Display Primitives';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-data-display-primitives.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-data-display-primitives-matrix.v1';
const FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-data-display-primitives-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-data-display-primitives-fixtures.v1';
const RMT_FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-data-display-primitives.rmt-fixture.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-data-display-primitives-report.v1';
const WORKPACKAGE = 'WP-RMO-03';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-data-display-primitives --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-data-display-primitives';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Data-Display-Primitives-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-03-Owned-Data-Display-Primitive-Package-schneiden.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-data-display-primitives-fixtures.json';
const RMT_FIXTURE_PATH = 'tests/fixtures/rmt-owned-data-display-primitives.rmt';
const SUITE_PATH = 'tests/native-first/rmt_owned_data_display_primitives_suite.js';

const REQUIRED_FIELDS = Object.freeze([
  'primitiveId',
  'primitive',
  'surfaceClass',
  'status',
  'sourceResidual',
  'sourceGaps',
  'ownedComponents',
  'rmtRecords',
  'stateCoverage',
  'a11yCoverage',
  'budgetPolicy',
  'allowedClaims',
  'blockedClaims',
  'nextHandoff'
]);

const ACCEPTED_COMPONENTS = Object.freeze([
  'x-section',
  'x-cards',
  'x-masonry',
  'x-summary',
  'x-type',
  'x-code',
  'x-status',
  'x-progress',
  'x-alert'
]);

const DEFERRED_COMPONENTS = Object.freeze([
  'x-list',
  'x-table',
  'x-tree',
  'x-virtual-list'
]);

const REQUIRED_RECORDS = Object.freeze([
  'collectionViews[]',
  'templates[]',
  'dataSources[]',
  'resources[]',
  'selectors[]',
  'state[]',
  'events[]',
  'actions[]',
  'schedules[]',
  'sourceMap[]'
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
  'full-datagrid-parity',
  'framework-table-api-copy',
  'virtualization-default-without-browser-evidence'
]);

const REQUIRED_GATES = Object.freeze([
  'rmt-owned-data-display-primitives',
  'rmt-ui-primitive-gap',
  'native-first-market-pattern-parity',
  'rmt-complete-ui-recipes',
  'rmt-component-template-primitives',
  'rmt-surface-resource-graph-runtime',
  'rmt-action-effect-data-resource-primitives',
  'catalog-coverage',
  'references'
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

function runRmtOwnedDataDisplayPrimitivesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText(CONTRACT_PATH, rootDir);
  const matrix = readText(MATRIX_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const gapAnalysis = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', rootDir);
  const marketParity = readText('development/XTend-Native-First-Market-Pattern-Parity-Matrix.md', rootDir);
  const completeRecipes = readText('development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const rmtFixture = readJson(RMT_FIXTURE_PATH, rootDir);
  const rmtFixtureSource = readText(RMT_FIXTURE_PATH, rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedDataDisplayPrimitives;
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  [
    BACKLOG_PATH,
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-RMO-03 artifact ${relativePath}`));
  context.assert(suiteSyntax.ok, `WP-RMO-03 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    RMT_FIXTURE_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'display-foundation-owned',
    'collection-view-record',
    'no-runtime-dependency',
    'no-rmt-kernel-import-of-xtend-types',
    'full-datagrid-parity',
    'framework-table-api-copy',
    'virtualization-default-without-browser-evidence',
    'scoped-owned-data-display-package'
  ], 'Data Display contract');
  assertIncludesAll(context, contract, REQUIRED_GATES, 'Data Display contract gates');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    'RMO-DD-01',
    'RMO-DD-02',
    'RMO-DD-03',
    'RMO-DD-04',
    'RMO-DD-05',
    'RMO-DD-06',
    'accepted-foundation',
    'accepted-collection-record',
    'accepted-state-policy',
    'deferred-owned-component',
    'browser-evidence-required',
    'scoped-owned-data-display-package'
  ], 'Data Display matrix');
  ACCEPTED_COMPONENTS.slice(0, 6).forEach((tag) => context.assertIncludes(matrix, tag, `Matrix includes ${tag}`));
  REQUIRED_BLOCKED_CLAIMS.forEach((claim) => context.assertIncludes(matrix, claim, `Matrix blocks ${claim}`));

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
    'data-display-parity',
    'WP-RMO-04',
    'WP-RMO-05'
  ], 'WP-RMO-03 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes fixture schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.rmtFixtureSchema === RMT_FIXTURE_SCHEMA, 'Fixture pack references RMT fixture schema');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-03');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  context.assert(fixtures.rmtFixture === RMT_FIXTURE_PATH, 'Fixture pack references RMT fixture path');
  context.assert(fixtures.noRuntimeDependency === true, 'Fixture pack adds no runtime dependency');
  context.assert(fixtures.externalUiFrameworkDependencyAllowed === false, 'Fixture pack blocks external UI framework dependency');
  context.assert(fixtures.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Fixture pack keeps RMT kernel boundary');

  const entries = fixtures.entries || [];
  context.assert(entries.length === 6, 'Fixture pack has six data display decisions');
  entries.forEach((entry) => {
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Object.prototype.hasOwnProperty.call(entry, field), `${entry.primitiveId} has ${field}`);
    });
    context.assert(entry.sourceResidual === 'data-display-parity', `${entry.primitiveId} traces data-display-parity`);
    context.assert(Array.isArray(entry.sourceGaps) && entry.sourceGaps.includes('NFM-RUG-11'), `${entry.primitiveId} traces NFM-RUG-11`);
  });
  const statusCounts = countBy(entries, 'status');
  context.assert(statusCounts['accepted-foundation'] === 1, 'Status summary accepted-foundation is 1');
  context.assert(statusCounts['accepted-collection-record'] === 1, 'Status summary accepted-collection-record is 1');
  context.assert(statusCounts['accepted-state-policy'] === 1, 'Status summary accepted-state-policy is 1');
  context.assert(statusCounts['deferred-owned-component'] === 3, 'Status summary deferred-owned-component is 3');
  Object.entries(fixtures.statusSummary).forEach(([status, count]) => {
    context.assert(statusCounts[status] === count, `Fixture summary ${status} matches entries`);
  });
  assertArrayIncludesAll(context, fixtures.residualDecision.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Residual blocked claims');
  context.assert(fixtures.residualDecision.status === 'scoped-owned-data-display-package', 'Residual decision scopes data-display-parity');

  context.assert(rmtFixture.schema === RMT_FIXTURE_SCHEMA, 'RMT fixture exposes schema');
  context.assert(rmtFixture.manifest.metadata.contractVersion === CONTRACT_SCHEMA, 'RMT fixture references contract');
  context.assert(rmtFixture.manifest.metadata.manualHtmlRendererAllowed === false, 'RMT fixture blocks manual HTML renderer');
  context.assert(rmtFixture.manifest.metadata.htmlStringRendererRequired === false, 'RMT fixture avoids HTML string renderer');
  context.assert(rmtFixture.manifest.metadata.externalUiFrameworkDependencyAllowed === false, 'RMT fixture blocks external UI framework dependency');
  context.assert(rmtFixture.manifest.metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'RMT fixture keeps kernel boundary');
  context.assert(Array.isArray(rmtFixture.collectionViews) && rmtFixture.collectionViews.length === 1, 'RMT fixture has one collection view');
  const collection = rmtFixture.collectionViews[0];
  context.assert(collection.id === 'collection.orders', 'Collection view has stable id');
  context.assert(collection.source === 'selector.visibleOrders', 'Collection view uses selector source');
  context.assert(collection.key === '$record.id', 'Collection view uses keyed records');
  context.assert(collection.emptyTemplate === 'template.collection.empty', 'Collection view defines empty template');
  context.assert(collection.loadingTemplate === 'template.collection.loading', 'Collection view defines loading template');
  context.assert(collection.errorTemplate === 'template.collection.error', 'Collection view defines error template');
  context.assert(collection.selection === 'state.orders.selection', 'Collection view binds selection state');
  context.assert(collection.sorting === 'state.orders.sort', 'Collection view binds sorting state');
  context.assert(collection.virtualization === 'deferred-to-WP-RMO-06', 'Collection view defers virtualization');
  context.assert(collection.maxItemsPerFrame === 50, 'Collection view has maxItemsPerFrame budget');
  REQUIRED_RECORDS.forEach((record) => {
    const key = record.replace('[]', '');
    context.assert(rmtFixture[key] || (record === 'sourceMap[]' && rmtFixture.sourceMap), `RMT fixture includes ${record}`);
  });
  fixtures.forbiddenTokens.forEach((token) => {
    context.assert(!rmtFixtureSource.includes(token), `RMT fixture avoids ${token}`);
  });
  assertArrayIncludesAll(context, rmtFixture.negativeClaims, REQUIRED_BLOCKED_CLAIMS, 'RMT fixture negative claims');

  ACCEPTED_COMPONENTS.forEach((tag) => {
    context.assert(Boolean(componentManifest[tag]), `Component manifest includes accepted foundation ${tag}`);
  });
  DEFERRED_COMPONENTS.forEach((tag) => {
    context.assert(!componentManifest[tag], `Component manifest does not claim deferred ${tag}`);
  });

  assertIncludesAll(context, gapAnalysis, [
    'NFM-RUG-11',
    'Data Display Collections',
    'owned-primitive-needed',
    'no-table-tree-data-grid-virtual-list-claim'
  ], 'RMT UI primitive gap analysis');
  assertIncludesAll(context, marketParity, [
    'Data Grid',
    'Virtual List',
    'blocked-negative-claim',
    'Table/Tree/DataGrid/VirtualList Parity'
  ], 'Market Pattern Parity matrix');
  assertIncludesAll(context, completeRecipes, [
    'data-display-collection',
    'owned-data-display-package',
    'no-table-tree-data-grid-virtual-list-claim'
  ], 'Complete UI Recipe matrix');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH,
    '| `WP-RMO-03` | P0 | completed |',
    '| `WP-RMO-04` | P0 | completed |',
    'scoped-owned-data-display-package',
    'rmt-owned-data-display-primitives'
  ], 'Backlog WP-RMO-03 status');

  context.assert(packageManifest.scripts['test:rmt-owned-data-display-primitives'] === 'node scripts/run_xtend_tests.js rmt-owned-data-display-primitives', 'Package exposes WP-RMO-03 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/rmt_owned_data_display_primitives_suite.js" }), 'Runner imports WP-RMO-03 suite');
  context.assert(runner.hasSuite("rmt-owned-data-display-primitives"), 'Runner registers WP-RMO-03 suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.rmtFixtureSchema === RMT_FIXTURE_SCHEMA, 'Package metadata exposes RMT fixture schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-03');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata marks WP-RMO-03 accepted');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixtures path');
  context.assert(metadata && metadata.rmtFixture === RMT_FIXTURE_PATH, 'Package metadata exposes RMT fixture path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.residualDecision === 'scoped-owned-data-display-package', 'Package metadata scopes data-display residual');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework');
  assertArrayIncludesAll(context, metadata && metadata.acceptedComponents, ACCEPTED_COMPONENTS, 'Package metadata accepted components');
  assertArrayIncludesAll(context, metadata && metadata.deferredComponents, DEFERRED_COMPONENTS, 'Package metadata deferred components');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_GATES, 'Package metadata source gates');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      decisions: entries.length,
      acceptedDecisions: 3,
      deferredComponents: DEFERRED_COMPONENTS,
      residualDecision: fixtures.residualDecision.status,
      localGate: LOCAL_GATE
    }
  });
}

function printRmtOwnedDataDisplayPrimitivesReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Data Display Primitives erfolgreich.',
    failureTitle: 'RMT Owned Data Display Primitives fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedDataDisplayPrimitivesReport,
  runRmtOwnedDataDisplayPrimitivesSuite
};
