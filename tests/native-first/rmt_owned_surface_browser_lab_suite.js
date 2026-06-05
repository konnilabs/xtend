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

const SUITE_ID = 'rmt-owned-surface-browser-lab';
const SUITE_LABEL = 'RMT Owned Surface Browser Lab Visual Evidence';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-matrix.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-fixtures.v1';
const BROWSER_FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab.fixture.v1';
const VISUAL_BASELINE_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab.visual-baseline.v1';
const PERFORMANCE_REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab.performance-report.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-report.v1';
const WORKPACKAGE = 'WP-RMO-06';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-surface-browser-lab';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-06-Surface-Browser-Lab-und-Visual-Evidence-fuer-App-Flows-ausbauen.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json';
const BROWSER_FIXTURE_PATH = 'tests/browser/fixtures/rmt-owned-surface-browser-lab.html';
const VISUAL_BASELINE_PATH = 'tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json';
const SUITE_PATH = 'tests/native-first/rmt_owned_surface_browser_lab_suite.js';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-owned-surface-browser-lab',
  'rmt-owned-recipe-extension',
  'rmt-owned-data-display-primitives',
  'rmt-owned-command-search-primitives',
  'surface-browser-lab',
  'native-first-budget-gates',
  'rmt-renderer-dom-descriptor-proofs',
  'native-first-overlay-focus',
  'references'
]);

const REQUIRED_EVIDENCE_IDS = Object.freeze([
  'RMO-BL-01',
  'RMO-BL-02',
  'RMO-BL-03',
  'RMO-BL-04',
  'RMO-BL-05'
]);

const REQUIRED_STATUSES = Object.freeze([
  'browser-lab-fixture-accepted',
  'visual-dom-baseline-accepted',
  'performance-budget-accepted',
  'conditional-pixel-artifact',
  'negative-claim-blocked'
]);

const REQUIRED_VISUAL_SNAPSHOTS = Object.freeze([
  'rmo-dashboard-collection-ready',
  'rmo-dashboard-empty-state',
  'rmo-command-open',
  'rmo-command-results',
  'rmo-crud-route-feedback'
]);

const REQUIRED_BROWSER_STATES = Object.freeze([
  'collection-ready',
  'collection-empty',
  'command-open',
  'command-results',
  'route-feedback'
]);

const REQUIRED_BROWSER_PRIMITIVES = Object.freeze([
  'PerformanceObserver',
  'MutationObserver',
  'requestAnimationFrame',
  'DocumentFragment',
  'replaceChildren'
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
  'visual-claim-without-artifact',
  'pixel-baseline-claim-without-artifact',
  'real-browser-visual-claim-without-artifact'
]);

const REQUIRED_FIXTURE_CHECKS = Object.freeze([
  'rmo dashboard collection ready',
  'rmo dashboard empty state stable',
  'rmo command search opens',
  'rmo command search results registered',
  'rmo crud navigation route feedback',
  'rmo no external network dependency',
  'rmo no second registry',
  'rmo performance observer plan available',
  'rmo mutation observer plan available',
  'rmo requestAnimationFrame plan available',
  'rmo layout shift budget visible',
  'rmo mutation budget visible',
  'rmo unstyled content blocked'
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

function runRmtOwnedSurfaceBrowserLabSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText(CONTRACT_PATH, rootDir);
  const matrix = readText(MATRIX_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const recipeContract = readText('development/XTend-RMT-Owned-Recipe-Extension-Contract.md', rootDir);
  const recipeMatrix = readText('development/XTend-RMT-Owned-Recipe-Extension-Matrix.md', rootDir);
  const existingSurfaceBrowserLab = readText('catalog/surface-manager-browser-lab.js', rootDir);
  const nativeBudgetFixtures = readJson('tests/fixtures/native-first/native-first-budget-gate-fixtures.json', rootDir);
  const rendererProofMatrix = readText('development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const browserFixture = readText(BROWSER_FIXTURE_PATH, rootDir);
  const visualBaseline = readJson(VISUAL_BASELINE_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedSurfaceBrowserLabVisualEvidence;
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  [
    BACKLOG_PATH,
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    BROWSER_FIXTURE_PATH,
    VISUAL_BASELINE_PATH,
    SUITE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-RMO-06 artifact ${relativePath}`));
  context.assert(suiteSyntax.ok, `WP-RMO-06 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    BROWSER_FIXTURE_SCHEMA,
    VISUAL_BASELINE_SCHEMA,
    PERFORMANCE_REPORT_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'surface-browser-lab',
    'visual-evidence-artifacts',
    'performance-budget-report',
    'browser-native-observer-plan',
    'conditional-pixel-artifact',
    'no-runtime-dependency',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'Browser Lab contract');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Browser Lab contract gates');
  assertIncludesAll(context, contract, REQUIRED_BROWSER_PRIMITIVES, 'Browser Lab contract primitives');
  assertIncludesAll(context, contract, REQUIRED_BLOCKED_CLAIMS, 'Browser Lab contract blocked claims');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    BROWSER_FIXTURE_SCHEMA,
    VISUAL_BASELINE_SCHEMA,
    PERFORMANCE_REPORT_SCHEMA,
    REPORT_SCHEMA,
    'RMO-BL-01',
    'RMO-BL-02',
    'RMO-BL-03',
    'RMO-BL-04',
    'RMO-BL-05',
    'dashboard-collection',
    'command-search-workspace',
    'crud-navigation-async',
    '.xtend-test-results/visual-snapshots/rmo/{flow}/{viewport}.png'
  ], 'Browser Lab matrix');
  assertIncludesAll(context, matrix, REQUIRED_STATUSES, 'Browser Lab matrix statuses');
  assertIncludesAll(context, matrix, REQUIRED_VISUAL_SNAPSHOTS, 'Browser Lab matrix snapshots');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    BROWSER_FIXTURE_SCHEMA,
    VISUAL_BASELINE_SCHEMA,
    PERFORMANCE_REPORT_SCHEMA,
    LOCAL_GATE,
    CONTRACT_PATH,
    MATRIX_PATH,
    FIXTURE_PATH,
    BROWSER_FIXTURE_PATH,
    VISUAL_BASELINE_PATH,
    SUITE_PATH,
    'WP-RMO-07',
    'WP-RMO-09'
  ], 'WP-RMO-06 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.browserFixtureSchema === BROWSER_FIXTURE_SCHEMA, 'Fixture pack references browser fixture schema');
  context.assert(fixtures.visualBaselineSchema === VISUAL_BASELINE_SCHEMA, 'Fixture pack references visual baseline schema');
  context.assert(fixtures.performanceReportSchema === PERFORMANCE_REPORT_SCHEMA, 'Fixture pack references performance report schema');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-06');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  context.assert(fixtures.browserFixture === BROWSER_FIXTURE_PATH, 'Fixture pack references browser fixture path');
  context.assert(fixtures.visualBaseline === VISUAL_BASELINE_PATH, 'Fixture pack references visual baseline path');
  assertArrayIncludesAll(context, fixtures.sourceRecipes, ['RMO-RCR-10', 'RMO-RCR-11', 'RMO-RCR-12', 'RMO-RCR-14'], 'Fixture pack source recipes');
  assertArrayIncludesAll(context, fixtures.sourceGates, REQUIRED_SOURCE_GATES, 'Fixture pack source gates');
  assertArrayIncludesAll(context, fixtures.browserPrimitives, REQUIRED_BROWSER_PRIMITIVES, 'Fixture pack browser primitives');
  context.assert(fixtures.runtimeBoundary.browserRequiredInLocalGate === false, 'Fixture pack keeps browser optional in local gate');
  context.assert(fixtures.runtimeBoundary.externalNetworkAllowedInLocalGate === false, 'Fixture pack blocks external network in local gate');
  context.assert(fixtures.runtimeBoundary.createsSecondRegistry === false, 'Fixture pack blocks second registry');
  context.assert(fixtures.runtimeBoundary.rmtKernelImportsXtendTypes === false, 'Fixture pack keeps kernel type boundary');
  context.assert(fixtures.runtimeBoundary.noRuntimeDependency === true, 'Fixture pack adds no runtime dependency');
  context.assert(fixtures.performanceBudgets.openMs === 16, 'Fixture pack records open budget');
  context.assert(fixtures.performanceBudgets.queryMs === 50, 'Fixture pack records query budget');
  context.assert(fixtures.performanceBudgets.routeMs === 120, 'Fixture pack records route budget');
  context.assert(fixtures.performanceBudgets.maxCumulativeLayoutShift === 0.01, 'Fixture pack records CLS budget');
  context.assert(fixtures.performanceBudgets.maxMutationCount === 20, 'Fixture pack records mutation budget');
  context.assert(fixtures.conditionalPixelArtifacts.screenshotRequiredInLocalGate === false, 'Conditional pixel screenshot is not local default');
  context.assert(fixtures.conditionalPixelArtifacts.pixelDiffRequiredInLocalGate === false, 'Conditional pixel diff is not local default');
  context.assert(fixtures.conditionalPixelArtifacts.binaryBaselineCommitted === false, 'Conditional pixel does not commit binary baseline');

  const entries = fixtures.entries || [];
  context.assert(entries.length === 5, 'Fixture pack has five Browser Lab evidence rows');
  const statusCounts = countBy(entries, 'status');
  REQUIRED_STATUSES.forEach((status) => {
    context.assert(statusCounts[status] === 1, `Status ${status} appears once`);
  });
  Object.entries(fixtures.statusSummary).forEach(([status, count]) => {
    context.assert(statusCounts[status] === count, `Fixture summary ${status} matches entries`);
  });
  assertArrayIncludesAll(context, entries.map((entry) => entry.evidenceId), REQUIRED_EVIDENCE_IDS, 'Fixture pack evidence IDs');

  assertIncludesAll(context, browserFixture, [
    BROWSER_FIXTURE_SCHEMA,
    '__xtendRmoBrowserLabResult',
    'data-rmo-browser-lab="wp-rmo-06"',
    'data-quality-gate="rmt-owned-surface-browser-lab"',
    'data-rmo-flow="dashboard-collection"',
    'data-rmo-flow="command-search-workspace"',
    'data-rmo-flow="crud-navigation-async"',
    'data-rmo-visual-state="collection-ready"',
    'data-rmo-visual-state="collection-empty"',
    'data-rmo-visual-state="command-open"',
    'data-rmo-visual-state="command-results"',
    'data-rmo-visual-state="route-feedback"',
    'collection.orders',
    'command.global',
    'search.commands',
    'action.command.openAudit',
    'action.command.runGate',
    'PerformanceObserver',
    'MutationObserver',
    'requestAnimationFrame',
    'document.createDocumentFragment',
    'replaceChildren'
  ], 'Browser fixture contract');
  REQUIRED_FIXTURE_CHECKS.forEach((check) => {
    context.assertIncludes(browserFixture, `recordCheck('${check}'`, `Browser fixture records ${check}`);
  });
  REQUIRED_VISUAL_SNAPSHOTS.forEach((snapshot) => {
    context.assertIncludes(browserFixture, snapshot, `Browser fixture includes snapshot ${snapshot}`);
  });
  context.assert(!browserFixture.includes('fetch('), 'Browser fixture does not fetch external data');
  context.assert(!browserFixture.includes('import('), 'Browser fixture does not lazy import modules');
  context.assert(!browserFixture.includes('https://cdn.ccs-networks.de'), 'Browser fixture has no XTend CDN dependency');
  context.assert(!browserFixture.includes('innerHTML'), 'Browser fixture avoids innerHTML sink token');

  context.assert(visualBaseline.schema === VISUAL_BASELINE_SCHEMA, 'Visual baseline exposes schema');
  context.assert(visualBaseline.workpackage === WORKPACKAGE, 'Visual baseline references WP-RMO-06');
  context.assert(visualBaseline.fixture === BROWSER_FIXTURE_PATH, 'Visual baseline references browser fixture');
  context.assert(visualBaseline.binaryBaselines === false, 'Visual baseline is JSON-only');
  context.assert(visualBaseline.pixelReady === true, 'Visual baseline is pixel-ready');
  context.assert(visualBaseline.snapshotCount === REQUIRED_VISUAL_SNAPSHOTS.length, 'Visual baseline snapshot count matches');
  assertArrayIncludesAll(context, visualBaseline.states, REQUIRED_BROWSER_STATES, 'Visual baseline states');
  assertArrayIncludesAll(context, (visualBaseline.records || []).map((record) => record.id), REQUIRED_VISUAL_SNAPSHOTS, 'Visual baseline records');
  context.assert(visualBaseline.budgets.maxCumulativeLayoutShift === 0.01, 'Visual baseline records CLS budget');
  context.assert(visualBaseline.budgets.maxMutationCount === 20, 'Visual baseline records mutation budget');
  context.assert(visualBaseline.budgets.unstyledContentPopInCount === 0, 'Visual baseline records pop-in budget');
  context.assert(visualBaseline.budgets.textFlashAllowed === false, 'Visual baseline blocks text flash');
  (visualBaseline.records || []).forEach((record) => {
    context.assert(record.root && Array.isArray(record.children) && record.children.length >= 2, `${record.id}: has DOM signature`);
    context.assert(Array.isArray(record.assertions) && record.assertions.length >= 3, `${record.id}: has assertions`);
  });

  assertIncludesAll(context, recipeContract, [
    'xtend.rmt-ui-maximality-owned-recipe-extension.v1',
    'WP-RMO-06',
    'Browser-Lab',
    'Visual Evidence'
  ], 'Recipe extension handoff');
  assertIncludesAll(context, recipeMatrix, [
    'RMO-RCR-10',
    'RMO-RCR-11',
    'RMO-RCR-12',
    'WP-RMO-06'
  ], 'Recipe matrix handoff');
  assertIncludesAll(context, existingSurfaceBrowserLab, [
    'xtend.surface.browser-lab.v1',
    'xtend.surface.browser-lab.visual-baseline.v1',
    'xtend.surface.browser-lab.performance-report.v1',
    'xtend.surface.browser-lab.cls-report.v1'
  ], 'Existing SurfaceManager Browser Lab source');
  const browserBudget = (nativeBudgetFixtures.fixtures || []).find((fixture) => fixture.budgetId === 'NFM-BGT-05');
  context.assert(browserBudget && browserBudget.enforcementMode === 'conditional-browser-gate', 'Native budget gate keeps conditional browser evidence');
  assertArrayIncludesAll(context, browserBudget && browserBudget.evidenceArtifacts, ['tests/browser/fixtures', 'tests/browser/visual-baselines'], 'Native budget evidence artifacts');
  assertIncludesAll(context, rendererProofMatrix, [
    'browser-lab-proof-budget-handoff',
    'PerformanceObserver',
    'MutationObserver',
    'visual-baseline-plan'
  ], 'Renderer proof browser-lab handoff');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    BROWSER_FIXTURE_PATH,
    VISUAL_BASELINE_PATH,
    SUITE_PATH,
    '| `WP-RMO-05` | P1 | completed |',
    '| `WP-RMO-06` | P1 | completed |',
    '| `WP-RMO-07` | P1 | completed |',
    '| `WP-RMO-08` | P2 | completed |',
    '| `WP-RMO-09` | P2 | completed |',
    'rmt-owned-surface-browser-lab'
  ], 'Backlog WP-RMO-06 status');

  context.assert(packageManifest.scripts['test:rmt-owned-surface-browser-lab'] === 'node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab', 'Package exposes WP-RMO-06 test script');
  context.assertIncludes(runner, "require('../tests/native-first/rmt_owned_surface_browser_lab_suite')", 'Runner imports WP-RMO-06 suite');
  context.assertIncludes(runner, "id: 'rmt-owned-surface-browser-lab'", 'Runner registers WP-RMO-06 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    context.assertIncludes(runner, `id: '${gate}'`, `Runner registers source gate ${gate}`);
  });

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.browserFixtureSchema === BROWSER_FIXTURE_SCHEMA, 'Package metadata exposes browser fixture schema');
  context.assert(metadata && metadata.visualBaselineSchema === VISUAL_BASELINE_SCHEMA, 'Package metadata exposes visual baseline schema');
  context.assert(metadata && metadata.performanceReportSchema === PERFORMANCE_REPORT_SCHEMA, 'Package metadata exposes performance report schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-06');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata marks WP-RMO-06 accepted');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.browserFixture === BROWSER_FIXTURE_PATH, 'Package metadata exposes browser fixture path');
  context.assert(metadata && metadata.visualBaseline === VISUAL_BASELINE_PATH, 'Package metadata exposes visual baseline path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.browserRequiredInLocalGate === false, 'Package metadata keeps browser optional locally');
  context.assert(metadata && metadata.externalNetworkAllowedInLocalGate === false, 'Package metadata blocks external network');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata blocks second registry');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.visualSnapshotIds, REQUIRED_VISUAL_SNAPSHOTS, 'Package metadata visual snapshots');
  assertArrayIncludesAll(context, metadata && metadata.browserPrimitives, REQUIRED_BROWSER_PRIMITIVES, 'Package metadata browser primitives');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      evidenceRows: entries.length,
      visualSnapshots: REQUIRED_VISUAL_SNAPSHOTS.length,
      statusCounts,
      localGate: LOCAL_GATE
    }
  });
}

function printRmtOwnedSurfaceBrowserLabReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Surface Browser Lab erfolgreich.',
    failureTitle: 'RMT Owned Surface Browser Lab fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedSurfaceBrowserLabReport,
  runRmtOwnedSurfaceBrowserLabSuite
};
