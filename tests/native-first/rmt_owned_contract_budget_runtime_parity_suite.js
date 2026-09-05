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

const SUITE_ID = 'rmt-owned-contract-budget-runtime-parity';
const SUITE_LABEL = 'RMT Owned Contract Budget Runtime Parity';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-matrix.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-fixtures.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-report.v1';
const WORKPACKAGE = 'WP-RMO-07';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-contract-budget-runtime-parity';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-07-Contract-Budget-und-Runtime-Parity-fuer-neue-Primitives-produktisieren.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json';
const SUITE_PATH = 'tests/native-first/rmt_owned_contract_budget_runtime_parity_suite.js';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-owned-contract-budget-runtime-parity',
  'contract-registry',
  'contract-runtime-parity',
  'native-first-evidence-pack',
  'native-first-budget-gates',
  'rmt-owned-data-display-primitives',
  'rmt-owned-command-search-primitives',
  'rmt-owned-recipe-extension',
  'rmt-owned-surface-browser-lab',
  'references'
]);

const REQUIRED_CONTRACT_IDS = Object.freeze([
  'xtend.rmt-ui-maximality-owned-data-display-primitives.v1',
  'xtend.rmt-ui-maximality-owned-command-search-primitives.v1',
  'xtend.rmt-ui-maximality-owned-recipe-extension.v1',
  'xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1',
  CONTRACT_SCHEMA
]);

const REQUIRED_UPDATE_IDS = Object.freeze([
  'RMO-PAR-01',
  'RMO-PAR-02',
  'RMO-PAR-03',
  'RMO-PAR-04',
  'RMO-PAR-05'
]);

const REQUIRED_UPDATE_STATUSES = Object.freeze([
  'registry-update-accepted',
  'runtime-parity-update-accepted',
  'audit-evidence-update-accepted',
  'budget-update-accepted',
  'ownerable-residuals-accepted'
]);

const REQUIRED_BUDGETS = Object.freeze([
  ['RMO-BGT-01', 'collectionRenderMs', 16],
  ['RMO-BGT-02', 'commandQueryMs', 50],
  ['RMO-BGT-03', 'routeFeedbackMs', 120],
  ['RMO-BGT-04', 'maxCumulativeLayoutShift', 0.01],
  ['RMO-BGT-05', 'runtimeDependenciesAddedMax', 0]
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'registry-is-index-not-runtime-manager',
  'rmt-kernel-remains-host-neutral',
  'redacted-public-contract-evidence',
  'no-production-budget-claim-without-gate',
  'no-full-parity-claim-without-runtime-component-evidence',
  'no-runtime-dependency'
]);

const REQUIRED_RESIDUALS = Object.freeze([
  'x-table-runtime-component-evidence',
  'x-virtual-list-browser-performance-evidence',
  'x-command-palette-runtime-component-evidence',
  'x-autocomplete-ime-browser-evidence',
  'x-combobox-aria-browser-evidence'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  BACKLOG_PATH,
  CONTRACT_PATH,
  MATRIX_PATH,
  WORKPACKAGE_PATH,
  FIXTURE_PATH,
  SUITE_PATH,
  'development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md',
  'development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md',
  'development/XTend-RMT-Owned-Recipe-Extension-Contract.md',
  'development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Contract.md',
  'development/XTend-Native-First-Contract-Registry-Contract.md',
  'development/XTend-Native-First-Contract-Runtime-Parity-Contract.md',
  'development/XTend-Native-First-Audit-Evidence-Pack-Contract.md',
  'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md',
  'tests/fixtures/rmt-owned-data-display-primitives.rmt',
  'tests/fixtures/rmt-owned-command-search-primitives.rmt',
  'tests/fixtures/rmt-owned-recipe-extension.rmt',
  'tests/browser/fixtures/rmt-owned-surface-browser-lab.html',
  'tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json'
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
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function assertArtifactListExists(context, rootDir, artifacts, label) {
  (artifacts || []).forEach((artifact) => {
    assertPathExists(context, rootDir, artifact, `${label} artifact`);
  });
}

function runRmtOwnedContractBudgetRuntimeParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText(CONTRACT_PATH, rootDir);
  const matrix = readText(MATRIX_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const dataDisplayContract = readText('development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md', rootDir);
  const commandSearchContract = readText('development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md', rootDir);
  const recipeContract = readText('development/XTend-RMT-Owned-Recipe-Extension-Contract.md', rootDir);
  const browserLabContract = readText('development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Contract.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const parityContract = readText('development/XTend-Native-First-Contract-Runtime-Parity-Contract.md', rootDir);
  const evidenceContract = readText('development/XTend-Native-First-Audit-Evidence-Pack-Contract.md', rootDir);
  const budgetContract = readText('development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md', rootDir);
  const browserLabFixtures = readJson('tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json', rootDir);
  const visualBaseline = readJson('tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedContractBudgetRuntimeParity;
  const packageScripts = packageManifest.scripts || {};
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((relativePath) => {
    assertPathExists(context, rootDir, relativePath, `WP-RMO-07 artifact ${relativePath}`);
  });
  context.assert(suiteSyntax.ok, `WP-RMO-07 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'Contract Registry',
    'Runtime Parity',
    'Audit Evidence',
    'Budget Gates',
    'collectionRenderMs',
    'commandQueryMs',
    'routeFeedbackMs',
    'maxCumulativeLayoutShift',
    'runtimeDependenciesAddedMax'
  ], 'WP-RMO-07 contract');
  assertIncludesAll(context, contract, REQUIRED_CONTRACT_IDS, 'WP-RMO-07 contract IDs');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'WP-RMO-07 source gates');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'WP-RMO-07 boundaries');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'Registry Entries',
    'Residual Owner',
    'component-platform-owner',
    'browser-lab-owner',
    'contract-parity-owner',
    'performance-owner'
  ], 'WP-RMO-07 matrix');
  assertIncludesAll(context, matrix, REQUIRED_UPDATE_IDS, 'WP-RMO-07 matrix IDs');
  assertIncludesAll(context, matrix, REQUIRED_UPDATE_STATUSES, 'WP-RMO-07 matrix statuses');
  assertIncludesAll(context, matrix, REQUIRED_CONTRACT_IDS, 'WP-RMO-07 matrix contract IDs');
  assertIncludesAll(context, matrix, REQUIRED_RESIDUALS, 'WP-RMO-07 matrix residuals');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    CONTRACT_PATH,
    MATRIX_PATH,
    FIXTURE_PATH,
    SUITE_PATH,
    '`contract-registry` bleibt gruen',
    '`contract-runtime-parity` bleibt gruen',
    '`native-first-evidence-pack` bleibt gruen',
    '`native-first-budget-gates` bleibt gruen',
    'WP-RMO-08',
    'WP-RMO-09'
  ], 'WP-RMO-07 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-07');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  assertArrayIncludesAll(context, fixtures.sourceGates, REQUIRED_SOURCE_GATES, 'Fixture pack source gates');
  assertArrayIncludesAll(context, fixtures.sourceContracts, REQUIRED_CONTRACT_IDS, 'Fixture pack source contracts');

  const entries = fixtures.entries || [];
  context.assert(entries.length === REQUIRED_UPDATE_IDS.length, 'Fixture pack has five update entries');
  assertArrayIncludesAll(context, entries.map((entry) => entry.entryId), REQUIRED_UPDATE_IDS, 'Fixture pack update IDs');
  const statusCounts = countBy(entries, 'status');
  Object.entries(fixtures.statusSummary || {}).forEach(([status, count]) => {
    context.assert(statusCounts[status] === count, `Fixture summary ${status} matches entries`);
  });
  REQUIRED_UPDATE_STATUSES.forEach((status) => {
    context.assert(statusCounts[status] === 1, `Status ${status} appears once`);
  });
  assertIncludesAll(context, entries.map((entry) => entry.boundary).join('\n'), REQUIRED_BOUNDARIES.slice(0, 5), 'Fixture update boundaries');

  context.assert(fixtures.runtimeBoundary.createsSecondRegistry === false, 'Fixture blocks second registry');
  context.assert(fixtures.runtimeBoundary.createsRuntimeRegistry === false, 'Fixture blocks runtime registry');
  context.assert(fixtures.runtimeBoundary.rmtKernelImportsXtendTypes === false, 'Fixture keeps RMT kernel boundary');
  context.assert(fixtures.runtimeBoundary.externalNetworkAllowedInLocalGate === false, 'Fixture blocks external network');
  context.assert(fixtures.runtimeBoundary.browserRequiredInLocalGate === false, 'Fixture keeps browser optional locally');
  context.assert(fixtures.runtimeBoundary.noRuntimeDependency === true, 'Fixture adds no runtime dependency');
  context.assert(fixtures.runtimeBoundary.externalUiFrameworkDependencyAllowed === false, 'Fixture blocks external UI framework dependency');

  const registryEntries = fixtures.registryEntries || [];
  context.assert(registryEntries.length === REQUIRED_CONTRACT_IDS.length, 'Fixture pack has registry entries for all RMO contracts');
  assertArrayIncludesAll(context, registryEntries.map((entry) => entry.contractId), REQUIRED_CONTRACT_IDS, 'Registry entries contract IDs');
  registryEntries.forEach((entry) => {
    ['contractId', 'owner', 'workpackage', 'status', 'localGate', 'docsPath', 'reportSchema', 'domain', 'evidenceRole'].forEach((field) => {
      context.assert(Boolean(entry[field]), `Registry entry ${entry.contractId} has ${field}`);
    });
    assertPathExists(context, rootDir, entry.docsPath, `Registry entry ${entry.contractId} docs path`);
  });

  const parityEntries = fixtures.runtimeParityEntries || [];
  context.assert(parityEntries.length === 4, 'Fixture pack has four runtime parity entries');
  assertArrayIncludesAll(context, parityEntries.map((entry) => entry.contractId), REQUIRED_CONTRACT_IDS.slice(0, 4), 'Runtime parity contract IDs');
  parityEntries.forEach((entry) => {
    context.assert(entry.parityId && entry.testGate && entry.parityStatus && entry.nextHandoff, `${entry.contractId}: parity fields are present`);
    assertArtifactListExists(context, rootDir, entry.runtimeArtifacts, `${entry.parityId} runtime`);
  });

  const auditEvidenceEntries = fixtures.auditEvidenceEntries || [];
  context.assert(auditEvidenceEntries.length === 3, 'Fixture pack has three audit evidence entries');
  assertArrayIncludesAll(context, auditEvidenceEntries.map((entry) => entry.evidenceId), ['RMO-AEP-01', 'RMO-AEP-02', 'RMO-AEP-03'], 'Audit evidence IDs');
  auditEvidenceEntries.forEach((entry) => {
    context.assert(entry.redactionClass === 'public-contract', `${entry.evidenceId}: redaction class is public-contract`);
    context.assert(entry.releaseOwnerUse && entry.nextHandoff, `${entry.evidenceId}: release owner fields are present`);
    assertArtifactListExists(context, rootDir, entry.artifacts, `${entry.evidenceId} audit`);
  });

  const budgetEntries = fixtures.budgetEntries || [];
  context.assert(budgetEntries.length === REQUIRED_BUDGETS.length, 'Fixture pack has five budget entries');
  REQUIRED_BUDGETS.forEach(([budgetId, metric, threshold]) => {
    const entry = budgetEntries.find((candidate) => candidate.budgetId === budgetId);
    context.assert(entry && entry.metric === metric, `${budgetId}: metric matches ${metric}`);
    context.assert(entry && entry.threshold === threshold, `${budgetId}: threshold matches ${threshold}`);
    assertArrayIncludesAll(context, entry && entry.requiredGates, ['native-first-budget-gates'], `${budgetId} required gates`);
    assertArtifactListExists(context, rootDir, entry && entry.evidenceArtifacts, `${budgetId} budget`);
  });
  const dependencyBudget = budgetEntries.find((entry) => entry.metric === 'runtimeDependenciesAddedMax');
  context.assert(dependencyBudget && dependencyBudget.threshold === 0, 'Runtime dependency budget remains zero');

  const residuals = fixtures.ownerableResiduals || [];
  context.assert(residuals.length === REQUIRED_RESIDUALS.length, 'Fixture pack has five ownerable residuals');
  assertArrayIncludesAll(context, residuals.map((entry) => entry.residual), REQUIRED_RESIDUALS, 'Ownerable residual IDs');
  residuals.forEach((entry) => {
    context.assert(entry.owner && entry.status === 'ownerable-residual' && entry.blockedClaim && entry.nextHandoff === 'WP-RMO-09', `${entry.residual}: residual is ownerable`);
  });

  assertIncludesAll(context, dataDisplayContract, [
    'xtend.rmt-ui-maximality-owned-data-display-primitives.v1',
    'rmt-owned-data-display-primitives',
    'WP-RMO-07'
  ], 'Data Display source contract');
  assertIncludesAll(context, commandSearchContract, [
    'xtend.rmt-ui-maximality-owned-command-search-primitives.v1',
    'rmt-owned-command-search-primitives',
    'WP-RMO-07'
  ], 'Command/Search source contract');
  assertIncludesAll(context, recipeContract, [
    'xtend.rmt-ui-maximality-owned-recipe-extension.v1',
    'rmt-owned-recipe-extension',
    'WP-RMO-07'
  ], 'Recipe source contract');
  assertIncludesAll(context, browserLabContract, [
    'xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1',
    'rmt-owned-surface-browser-lab',
    'WP-RMO-07'
  ], 'Browser Lab source contract');
  assertIncludesAll(context, registryContract, [
    'xtend.native-first.contract-registry.v1',
    'contract-registry',
    'registry-is-index-not-runtime-manager'
  ], 'Native-First registry source contract');
  assertIncludesAll(context, parityContract, [
    'xtend.native-first.contract-runtime-parity.v1',
    'contract-runtime-parity',
    'rmt-kernel-remains-host-neutral'
  ], 'Native-First parity source contract');
  assertIncludesAll(context, evidenceContract, [
    'xtend.native-first.audit-evidence-pack.v1',
    'native-first-evidence-pack',
    'redaction'
  ], 'Native-First evidence source contract');
  assertIncludesAll(context, budgetContract, [
    'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
    'native-first-budget-gates',
    'no-production-budget-claim-without-gate'
  ], 'Native-First budget source contract');

  context.assert(browserLabFixtures.performanceBudgets.openMs === 16, 'Browser Lab fixture open budget feeds WP-RMO-07');
  context.assert(browserLabFixtures.performanceBudgets.queryMs === 50, 'Browser Lab fixture query budget feeds WP-RMO-07');
  context.assert(browserLabFixtures.performanceBudgets.routeMs === 120, 'Browser Lab fixture route budget feeds WP-RMO-07');
  context.assert(browserLabFixtures.performanceBudgets.maxCumulativeLayoutShift === 0.01, 'Browser Lab fixture CLS budget feeds WP-RMO-07');
  context.assert(browserLabFixtures.performanceBudgets.maxMutationCount === 20, 'Browser Lab fixture mutation budget feeds WP-RMO-07');
  context.assert(visualBaseline.budgets.maxCumulativeLayoutShift === 0.01, 'Visual baseline CLS budget feeds WP-RMO-07');
  context.assert(visualBaseline.budgets.maxMutationCount === 20, 'Visual baseline mutation budget feeds WP-RMO-07');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    SUITE_PATH,
    '| `WP-RMO-06` | P1 | completed |',
    '| `WP-RMO-07` | P1 | completed |',
    '| `WP-RMO-08` | P2 | completed |',
    '| `WP-RMO-09` | P2 | completed |',
    'rmt-owned-contract-budget-runtime-parity'
  ], 'Backlog WP-RMO-07 status');

  context.assert(packageScripts['test:rmt-owned-contract-budget-runtime-parity'] === 'node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity', 'Package exposes WP-RMO-07 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/rmt_owned_contract_budget_runtime_parity_suite.js" }), 'Runner imports WP-RMO-07 suite');
  context.assert(runner.hasSuite("rmt-owned-contract-budget-runtime-parity"), 'Runner registers WP-RMO-07 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    context.assert(runner.hasSuite(gate), `Runner registers source gate ${gate}`);
  });

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-07');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata marks WP-RMO-07 accepted');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata blocks second registry');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.sourceContracts, REQUIRED_CONTRACT_IDS, 'Package metadata source contracts');
  assertArrayIncludesAll(context, metadata && metadata.ownerableResiduals, REQUIRED_RESIDUALS, 'Package metadata ownerable residuals');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      updateEntries: entries.length,
      registryEntries: registryEntries.length,
      runtimeParityEntries: parityEntries.length,
      auditEvidenceEntries: auditEvidenceEntries.length,
      budgetEntries: budgetEntries.length,
      ownerableResiduals: residuals.length,
      localGate: LOCAL_GATE
    }
  });
}

function printRmtOwnedContractBudgetRuntimeParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Contract Budget Runtime Parity erfolgreich.',
    failureTitle: 'RMT Owned Contract Budget Runtime Parity fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedContractBudgetRuntimeParityReport,
  runRmtOwnedContractBudgetRuntimeParitySuite
};
