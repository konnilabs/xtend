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

const SUITE_ID = 'native-first-budget-gates';
const SUITE_LABEL = 'Native-First Performance Complexity Bundle Budget Gates';
const CONTRACT_SCHEMA = 'xtend.native-first.performance-complexity-bundle-budget-gates.v1';
const MATRIX_SCHEMA = 'xtend.native-first.performance-complexity-bundle-budget-gate-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.performance-complexity-bundle-budget-gate.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.performance-complexity-bundle-budget-gate-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.performance-complexity-bundle-budget-gate-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.performance-complexity-bundle-budget-gates-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-budget-gates --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-budget-gates';
const FIXTURE_PATH = 'tests/fixtures/native-first/native-first-budget-gate-fixtures.json';

const REQUIRED_FIELDS = Object.freeze([
  'budgetId',
  'budgetClass',
  'sourceWorkpackages',
  'sourceRecipes',
  'sourceProofs',
  'status',
  'measuredSurface',
  'budgetMetric',
  'threshold',
  'requiredGates',
  'evidenceArtifacts',
  'enforcementMode',
  'residual',
  'owner',
  'nextHandoff'
]);

const BUDGET_STATUSES = Object.freeze([
  'budget-accepted',
  'budget-accepted-with-existing-gate',
  'budget-accepted-with-browser-lab-residual',
  'budget-handoff-to-release-owner'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'budget-gate-before-native-first-claim',
  'no-production-budget-claim-without-gate',
  'no-new-runtime-dependency',
  'complexity-budget-before-abstraction',
  'browser-lab-evidence-is-conditional',
  'visual-evidence-before-release-claim',
  'rmt-kernel-remains-host-neutral'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'native-first-budget-gates',
  'rmt-renderer-dom-descriptor-proofs',
  'rmt-complete-ui-recipes',
  'native-first-evidence-pack',
  'contract-registry',
  'contract-runtime-parity',
  'supply-chain',
  'performance-regression',
  'component-ux-performance',
  'docs-php-ssr-performance-budget',
  'docs-php-ssr-cls-budget',
  'maraca-size-budget',
  'browser',
  'rmt-vnext-source-to-sea',
  'rmt-dom-descriptor-renderer',
  'rmt-event-routing-runtime',
  'rmt-action-effect-runtime',
  'references'
]);

const REQUIRED_BUDGETS = Object.freeze([
  {
    budgetId: 'NFM-BGT-01',
    budgetClass: 'bundle-dependency-delta',
    sourceWorkpackages: ['NFM-WP-04', 'NFM-WP-17', 'NFM-WP-18'],
    sourceRecipes: ['NFM-RCR-01', 'NFM-RCR-09'],
    sourceProofs: ['NFM-RDP-01', 'NFM-RDP-06'],
    status: 'budget-accepted-with-existing-gate',
    measuredSurface: ['runtime-dependencies', 'production-bundle', 'docs-progressive-boot'],
    budgetMetric: ['runtime-dependency-delta', 'external-ui-framework-dependency-delta', 'production-bundle-claim'],
    threshold: {
      runtimeDependenciesAddedMax: 0,
      externalUiFrameworkDependenciesAddedMax: 0,
      productionBundleClaimRequiresGate: true
    },
    requiredGates: ['supply-chain', 'maraca-size-budget', 'native-first-evidence-pack'],
    evidenceArtifacts: ['package-lock.json', '.xtend-build/maraca/source-to-sea/xtend.maraca.report.json', '.xtend-test-results/xtend-npm-audit-report.json'],
    enforcementMode: 'hard-local-gate',
    residual: 'network sbom bleibt conditional',
    owner: 'supply-chain-owner',
    nextHandoff: ['NFM-WP-21', 'NFM-WP-22']
  },
  {
    budgetId: 'NFM-BGT-02',
    budgetClass: 'mount-hydration-render',
    sourceWorkpackages: ['NFM-WP-17', 'NFM-WP-18'],
    sourceRecipes: ['NFM-RCR-01', 'NFM-RCR-02', 'NFM-RCR-09'],
    sourceProofs: ['NFM-RDP-01', 'NFM-RDP-06'],
    status: 'budget-accepted-with-existing-gate',
    measuredSurface: ['app-shell', 'dashboard-layout', 'docs-progressive-boot'],
    budgetMetric: ['component-hydrate', 'docs-prehydration-bytes', 'cls-reserve'],
    threshold: {
      componentHydrateBudgetMs: 16,
      docsPrehydrationBytesMax: 256000,
      clsBudget: 0.01
    },
    requiredGates: ['performance-regression', 'component-ux-performance', 'docs-php-ssr-performance-budget', 'docs-php-ssr-cls-budget'],
    evidenceArtifacts: ['tests/performance/baselines/local-performance-baseline.json', 'docs/index.php', 'xtend-builder/performance/component-ux-performance-contract.js'],
    enforcementMode: 'hard-local-gate',
    residual: 'real browser timings bleiben optional browser-lab evidence',
    owner: 'performance-owner',
    nextHandoff: ['NFM-WP-20', 'NFM-WP-22']
  },
  {
    budgetId: 'NFM-BGT-03',
    budgetClass: 'interaction-scheduler-lane',
    sourceWorkpackages: ['NFM-WP-09', 'NFM-WP-16', 'NFM-WP-18'],
    sourceRecipes: ['NFM-RCR-03', 'NFM-RCR-05', 'NFM-RCR-07'],
    sourceProofs: ['NFM-RDP-05', 'NFM-RDP-06'],
    status: 'budget-accepted',
    measuredSurface: ['form-submit', 'navigation-feedback', 'command-search', 'action-ref'],
    budgetMetric: ['event-action', 'route-render', 'scheduler-lane', 'listener-cleanup'],
    threshold: {
      eventActionBudgetMs: 16,
      routeRenderBudgetMs: 120,
      listenerCleanupRequired: true
    },
    requiredGates: ['component-ux-performance', 'performance-regression', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime'],
    evidenceArtifacts: ['xtend-builder/performance/component-ux-performance-contract.js', 'xtendrmt/rmt-event-routing-runtime.js', 'xtendrmt/rmt-action-effect-runtime.js'],
    enforcementMode: 'hard-local-gate',
    residual: 'command-search maximality bleibt product residual',
    owner: 'rmt-event-action-owner',
    nextHandoff: ['NFM-WP-20', 'owned-command-search-package']
  },
  {
    budgetId: 'NFM-BGT-04',
    budgetClass: 'adapter-complexity-framework-leverage',
    sourceWorkpackages: ['NFM-WP-09', 'NFM-WP-14', 'NFM-WP-18'],
    sourceRecipes: ['NFM-RCR-04', 'NFM-RCR-06', 'NFM-RCR-09'],
    sourceProofs: ['NFM-RDP-02', 'NFM-RDP-03', 'NFM-RDP-04'],
    status: 'budget-accepted',
    measuredSurface: ['rmt-adapters', 'framework-leverage-layer', 'dom-descriptor-renderer'],
    budgetMetric: ['adapter-layer-count', 'source-map-coverage', 'trust-boundary-coverage', 'kernel-import-boundary'],
    threshold: {
      adapterLayerMax: 1,
      sourceMapRequired: true,
      kernelHostImportMax: 0,
      freeHtmlSinkMax: 0
    },
    requiredGates: ['contract-runtime-parity', 'rmt-dom-descriptor-renderer', 'rmt-renderer-dom-descriptor-proofs', 'references'],
    evidenceArtifacts: ['development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md', 'docs/en/rmt-dom-descriptor-renderer.md', 'tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json'],
    enforcementMode: 'hard-local-gate',
    residual: 'surface maximality bleibt surface-browser-lab residual',
    owner: 'framework-leverage-owner',
    nextHandoff: ['NFM-WP-20', 'surface-browser-lab']
  },
  {
    budgetId: 'NFM-BGT-05',
    budgetClass: 'browser-smoke-visual-evidence',
    sourceWorkpackages: ['NFM-WP-17', 'NFM-WP-18'],
    sourceRecipes: ['NFM-RCR-01', 'NFM-RCR-04', 'NFM-RCR-08', 'NFM-RCR-09'],
    sourceProofs: ['NFM-RDP-02', 'NFM-RDP-04', 'NFM-RDP-06'],
    status: 'budget-accepted-with-browser-lab-residual',
    measuredSurface: ['browser-smokes', 'source-to-sea', 'media-preview', 'docs-visual-baseline'],
    budgetMetric: ['browser-smoke-result', 'viewport-correlation', 'visual-baseline', 'layout-shift'],
    threshold: {
      browserSmokeRequired: true,
      visualBaselineRequiredForRelease: true,
      layoutShiftBudgetPx: 1,
      externalBrowserRequiredInLocalGate: false
    },
    requiredGates: ['browser', 'rmt-vnext-source-to-sea', 'docs-php-ssr-cls-budget', 'rmt-renderer-dom-descriptor-proofs'],
    evidenceArtifacts: ['tests/browser/fixtures', 'tests/browser/visual-baselines', 'scripts/capture_rmt_vnext_source_to_sea_evidence.js'],
    enforcementMode: 'conditional-browser-gate',
    residual: 'real browser artifact storage bleibt owner-controlled',
    owner: 'browser-lab-owner',
    nextHandoff: ['NFM-WP-20', 'NFM-WP-22', 'surface-browser-lab']
  },
  {
    budgetId: 'NFM-BGT-06',
    budgetClass: 'regression-release-handoff',
    sourceWorkpackages: ['NFM-WP-11', 'NFM-WP-13', 'NFM-WP-18', 'NFM-WP-19'],
    sourceRecipes: ['NFM-RCR-01', 'NFM-RCR-09'],
    sourceProofs: ['NFM-RDP-06'],
    status: 'budget-handoff-to-release-owner',
    measuredSurface: ['contract-registry', 'audit-evidence-pack', 'release-owner-report'],
    budgetMetric: ['registry-discoverability', 'audit-evidence', 'budget-report', 'release-residual'],
    threshold: {
      budgetGateEntryRequired: true,
      releaseResidualRequired: true,
      nonNativeFeatureWithoutBudget: 'blocked'
    },
    requiredGates: ['native-first-budget-gates', 'contract-registry', 'native-first-evidence-pack', 'references'],
    evidenceArtifacts: ['development/XTend-Native-First-Contract-Registry.md', 'development/XTend-Native-First-Audit-Evidence-Pack.md', 'package.json'],
    enforcementMode: 'release-owner-review',
    residual: 'final release acceptance bleibt NFM-WP-22',
    owner: 'release-owner',
    nextHandoff: ['NFM-WP-22']
  }
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

function assertRunnerGate(context, runner, gate) {
  context.assert(runner.hasSuite(gate), `Runner registers ${gate}`);
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function assertThresholdSubset(context, actual, expected, label) {
  Object.keys(expected).forEach((key) => {
    context.assert(actual && actual[key] === expected[key], `${label} threshold ${key}`);
  });
}

function runNativeFirstBudgetGateSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-19-Native-First-Performance-Complexity-und-Bundle-Budget-Gates-definieren.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const rendererProofContract = readText('development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md', rootDir);
  const rendererProofFixtures = readJson('tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json', rootDir);
  const recipeFixtures = readJson('tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstBudgetGates;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1',
    'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1',
    'xtend.native-first.audit-evidence-pack.v1',
    LOCAL_GATE,
    PACKAGE_SCRIPT
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, BUDGET_STATUSES, 'Contract status model');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'keine neue produktive Performance-Messruntime',
    'keine Freigabe von echten Browser-Lab- oder Visual-Claims ohne Artefakte',
    'keine neue Bundler- oder UI-Framework-Dependency'
  ], 'Contract non-goals');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    'Status Summary',
    'Coverage Summary',
    'Blocked Claims',
    'NFM-WP-20',
    'NFM-WP-21',
    'NFM-WP-22',
    'surface-browser-lab'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix fields');
  assertIncludesAll(context, matrix, [
    '`budget-accepted` | 2',
    '`budget-accepted-with-existing-gate` | 2',
    '`budget-accepted-with-browser-lab-residual` | 1',
    '`budget-handoff-to-release-owner` | 1'
  ], 'Matrix status counts');

  REQUIRED_BUDGETS.forEach((budget) => {
    assertIncludesAll(context, matrix, [
      budget.budgetId,
      budget.budgetClass,
      budget.status,
      budget.enforcementMode,
      budget.residual,
      budget.owner
    ], `Matrix row ${budget.budgetId}`);
    assertIncludesAll(context, matrix, budget.sourceWorkpackages, `Matrix row ${budget.budgetId} source workpackages`);
    assertIncludesAll(context, matrix, budget.sourceRecipes, `Matrix row ${budget.budgetId} source recipes`);
    assertIncludesAll(context, matrix, budget.sourceProofs, `Matrix row ${budget.budgetId} source proofs`);
    assertIncludesAll(context, matrix, budget.requiredGates, `Matrix row ${budget.budgetId} gates`);
    budget.nextHandoff.forEach((handoff) => context.assertIncludes(matrix, handoff, `Matrix row ${budget.budgetId} handoff ${handoff}`));
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-19 contract');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-19', 'Fixture pack references WP-19');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_BUDGETS.length, 'Fixture pack contains one fixture per budget');

  REQUIRED_BUDGETS.forEach((budget) => {
    const fixture = fixtureRows.find((candidate) => candidate.budgetId === budget.budgetId);
    context.assert(Boolean(fixture), `Fixture pack contains ${budget.budgetId}`);
    if (!fixture) return;
    context.assert(fixture.budgetClass === budget.budgetClass, `${budget.budgetId} has budget class`);
    context.assert(fixture.status === budget.status, `${budget.budgetId} has status`);
    context.assert(fixture.enforcementMode === budget.enforcementMode, `${budget.budgetId} has enforcement mode`);
    context.assert(fixture.residual === budget.residual, `${budget.budgetId} has residual`);
    context.assert(fixture.owner === budget.owner, `${budget.budgetId} has owner`);
    assertArrayIncludesAll(context, fixture.sourceWorkpackages, budget.sourceWorkpackages, `${budget.budgetId} source workpackages`);
    assertArrayIncludesAll(context, fixture.sourceRecipes, budget.sourceRecipes, `${budget.budgetId} source recipes`);
    assertArrayIncludesAll(context, fixture.sourceProofs, budget.sourceProofs, `${budget.budgetId} source proofs`);
    assertArrayIncludesAll(context, fixture.measuredSurface, budget.measuredSurface, `${budget.budgetId} measured surface`);
    assertArrayIncludesAll(context, fixture.budgetMetric, budget.budgetMetric, `${budget.budgetId} metrics`);
    assertArrayIncludesAll(context, fixture.requiredGates, budget.requiredGates, `${budget.budgetId} gates`);
    assertArrayIncludesAll(context, fixture.evidenceArtifacts, budget.evidenceArtifacts, `${budget.budgetId} evidence artifacts`);
    assertArrayIncludesAll(context, fixture.nextHandoff, budget.nextHandoff, `${budget.budgetId} handoff`);
    assertThresholdSubset(context, fixture.threshold, budget.threshold, budget.budgetId);
  });

  assertIncludesAll(context, `${rendererProofContract}\n${JSON.stringify(rendererProofFixtures)}`, [
    'proof-handoff-to-budget-gate',
    'browser-lab-budget-claim-deferred-to-wp19',
    'no-production-budget-claim-before-nfm-wp19',
    'NFM-WP-19'
  ], 'WP-18 proof fixture budget handoff');
  assertIncludesAll(context, JSON.stringify(recipeFixtures), [
    'no-production-bundle-claim-without-release-gate',
    'NFM-WP-19',
    'visualEvidencePlan'
  ], 'WP-17 recipe budget inputs');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    FIXTURE_PATH,
    'NFM-WP-20',
    'NFM-WP-21',
    'NFM-WP-22'
  ], 'Workpackage schemas, gate and handoff');

  context.assertIncludes(roadmap, '| `NFM-WP-19` | P1 | completed |', 'Roadmap marks NFM-WP-19 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-20` | P2 | ready |') || roadmap.includes('| `NFM-WP-20` | P2 | completed |'),
    'Roadmap marks NFM-WP-20 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md', 'Roadmap references WP-19 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-19 gate');

  context.assertIncludes(mission, 'Performance Complexity Bundle Budget Gates Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`', 'Mission references WP-19 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md', 'Mission source-of-truth lists WP-19 matrix');
  context.assertIncludes(mission, '`NFM-WP-19` | completed', 'Mission handoff marks WP-19 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'performance-owner',
    'NFM-WP-19',
    REPORT_SCHEMA,
    'native-first-budget-gates',
    'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md',
    'performance-complexity-bundle-budget-gates',
    'gate-plan'
  ], 'Registry WP-19 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-19',
    'native-first-budget-gates',
    CONTRACT_SCHEMA,
    'accepted-with-budget-gates'
  ], 'Registry contract WP-19 extension');

  context.assert(packageScripts['test:native-first-budget-gates'] === 'node scripts/run_xtend_tests.js native-first-budget-gates', 'Package exposes WP-19 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/native_first_budget_gate_suite.js" }), 'Runner imports WP-19 suite');
  context.assert(runner.hasSuite("native-first-budget-gates"), 'Runner registers WP-19 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-19 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-19 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-19 item schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-19 fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-19 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-19 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-19-Native-First-Performance-Complexity-und-Bundle-Budget-Gates-definieren.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework dependency');
  context.assert(metadata && metadata.budgetClaimGateDefined === true, 'Package metadata defines budget claim gate');
  context.assert(metadata && metadata.realBrowserEvidenceRequiredForVisualClaim === true, 'Package metadata requires browser evidence for visual claim');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.budgetStatuses, BUDGET_STATUSES, 'Package metadata budget statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  const budgetRows = (metadata && metadata.budgets) || [];
  context.assert(budgetRows.length === REQUIRED_BUDGETS.length, 'Package metadata registers all budget rows');
  REQUIRED_BUDGETS.forEach((required) => {
    const budget = budgetRows.find((candidate) => candidate.budgetId === required.budgetId);
    context.assert(Boolean(budget), `Package metadata registers ${required.budgetId}`);
    if (!budget) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(budget[field]), `Package metadata ${required.budgetId} has ${field}`);
    });
    context.assert(budget.budgetClass === required.budgetClass, `Package metadata ${required.budgetId} has class`);
    context.assert(budget.status === required.status, `Package metadata ${required.budgetId} has status`);
    context.assert(budget.enforcementMode === required.enforcementMode, `Package metadata ${required.budgetId} has enforcement mode`);
    context.assert(budget.residual === required.residual, `Package metadata ${required.budgetId} has residual`);
    context.assert(budget.owner === required.owner, `Package metadata ${required.budgetId} has owner`);
    assertThresholdSubset(context, budget.threshold, required.threshold, `Package metadata ${required.budgetId}`);
    assertArrayIncludesAll(context, budget.sourceWorkpackages, required.sourceWorkpackages, `Package metadata ${required.budgetId} workpackages`);
    assertArrayIncludesAll(context, budget.sourceRecipes, required.sourceRecipes, `Package metadata ${required.budgetId} recipes`);
    assertArrayIncludesAll(context, budget.sourceProofs, required.sourceProofs, `Package metadata ${required.budgetId} proofs`);
    assertArrayIncludesAll(context, budget.requiredGates, required.requiredGates, `Package metadata ${required.budgetId} gates`);
    assertArrayIncludesAll(context, budget.nextHandoff, required.nextHandoff, `Package metadata ${required.budgetId} handoffs`);
  });

  context.assert(registryMetadata && Array.isArray(registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('native-first-budget-gates'), 'Registry metadata source gates include WP-19');
  context.assert(registryMetadata && Array.isArray(registryMetadata.entries) && registryMetadata.entries.some((entry) => entry.contractId === CONTRACT_SCHEMA), 'Registry metadata entries include WP-19');
  [
    'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md',
    'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md',
    'development/NFM-WP-19-Native-First-Performance-Complexity-und-Bundle-Budget-Gates-definieren.md',
    FIXTURE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-19 artifact ${relativePath}`));

  const statusCounts = countBy(fixtureRows, 'status');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-19',
      contract: CONTRACT_SCHEMA,
      budgets: REQUIRED_BUDGETS.length,
      fixtures: fixtureRows.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      statusCounts,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      budgetClaimGateDefined: true,
      realBrowserEvidenceRequiredForVisualClaim: true
    }
  });
}

function printNativeFirstBudgetGateReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Budget Gates erfolgreich.',
    failureTitle: 'Native-First Budget Gates fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstBudgetGateReport,
  runNativeFirstBudgetGateSuite
};
