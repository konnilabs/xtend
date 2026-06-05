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

const SUITE_ID = 'rmt-ui-maximality-owned-surface-baseline';
const SUITE_LABEL = 'RMT UI Maximality Owned Surface Baseline';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.source-of-truth.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-matrix.v1';
const RESIDUAL_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.residual.v1';
const FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixtures.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.baseline-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-ui-maximality-owned-surface-baseline';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-ui-maximality-owned-surface-residual-fixtures.json';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Source-of-Truth-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Residual-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-01-Epic-Scope-Residual-Baseline-und-Source-of-Truth-einfrieren.md';
const NEXT_EPIC_BOUNDARY = 'rmt-ui-maximality-and-owned-component-surface-hardening';

const REQUIRED_FIELDS = Object.freeze([
  'residualId',
  'residual',
  'sourceHandoffs',
  'residualClass',
  'priority',
  'owner',
  'targetWorkpackage',
  'targetStatus',
  'claimBoundary',
  'requiredGates',
  'sourceArtifacts',
  'blockedClaims',
  'nextHandoff'
]);

const TARGET_STATUSES = Object.freeze([
  'gate-residual-ready',
  'implementation-ready',
  'browser-evidence-planned',
  'migration-handoff-planned'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-ui-maximality-owned-surface-baseline',
  'native-first-mission-handoff',
  'contract-registry',
  'docs-public-quality',
  'component-long-tail-migration',
  'type-exports-vendor',
  'type-exports-loader',
  'native-first-market-pattern-parity',
  'rmt-ui-primitive-gap',
  'native-first-framework-leverage',
  'native-first-overlay-focus',
  'rmt-action-effect-data-resource-primitives',
  'native-first-budget-gates',
  'rmt-renderer-dom-descriptor-proofs',
  'native-first-migration-deprecation',
  'rmt-native-shell-migration',
  'surface-browser-lab',
  'native-first-docs-authoring',
  'references'
]);

const REQUIRED_RESIDUALS = Object.freeze([
  {
    residualId: 'RMO-RES-01',
    residual: 'surface-browser-lab',
    priority: 'P1',
    owner: 'rmt-ui-authoring-owner',
    targetWorkpackage: 'WP-RMO-06',
    targetStatus: 'browser-evidence-planned',
    sourceHandoffs: ['NFM-HO-05', 'NFM-HO-06'],
    requiredGates: ['surface-browser-lab', 'native-first-budget-gates', 'rmt-renderer-dom-descriptor-proofs', 'references'],
    blockedClaims: ['complete-surface-browser-claim', 'visual-claim-without-artifact']
  },
  {
    residualId: 'RMO-RES-02',
    residual: 'data-display-parity',
    priority: 'P0',
    owner: 'component-platform-owner',
    targetWorkpackage: 'WP-RMO-03',
    targetStatus: 'implementation-ready',
    sourceHandoffs: ['NFM-HO-03', 'NFM-HO-05'],
    requiredGates: ['native-first-market-pattern-parity', 'rmt-ui-primitive-gap', 'contract-registry', 'references'],
    blockedClaims: ['full-datagrid-parity', 'framework-table-api-copy']
  },
  {
    residualId: 'RMO-RES-03',
    residual: 'command-search-parity',
    priority: 'P0',
    owner: 'component-platform-owner',
    targetWorkpackage: 'WP-RMO-04',
    targetStatus: 'implementation-ready',
    sourceHandoffs: ['NFM-HO-03', 'NFM-HO-05'],
    requiredGates: ['native-first-framework-leverage', 'native-first-overlay-focus', 'rmt-action-effect-data-resource-primitives', 'rmt-ui-primitive-gap', 'references'],
    blockedClaims: ['command-palette-full-parity', 'unregistered-command-execution']
  },
  {
    residualId: 'RMO-RES-04',
    residual: 'visual-evidence-artifacts',
    priority: 'P1',
    owner: 'performance-owner',
    targetWorkpackage: 'WP-RMO-06',
    targetStatus: 'browser-evidence-planned',
    sourceHandoffs: ['NFM-HO-05', 'NFM-HO-06'],
    requiredGates: ['native-first-budget-gates', 'rmt-renderer-dom-descriptor-proofs', 'surface-browser-lab', 'references'],
    blockedClaims: ['visual-regression-complete', 'pixel-baseline-claim-without-artifact']
  },
  {
    residualId: 'RMO-RES-05',
    residual: 'docs-public-quality-legacy-failures',
    priority: 'P0',
    owner: 'docs-authoring-owner',
    targetWorkpackage: 'WP-RMO-02',
    targetStatus: 'gate-residual-ready',
    sourceHandoffs: ['NFM-HO-04', 'NFM-HO-06'],
    requiredGates: ['docs-public-quality', 'native-first-docs-authoring', 'references'],
    blockedClaims: ['public-docs-complete', 'localized-docs-clean']
  },
  {
    residualId: 'RMO-RES-06',
    residual: 'component-long-tail-migration-docs-file',
    priority: 'P0',
    owner: 'migration-owner',
    targetWorkpackage: 'WP-RMO-02',
    targetStatus: 'gate-residual-ready',
    sourceHandoffs: ['NFM-HO-06'],
    requiredGates: ['component-long-tail-migration', 'references'],
    blockedClaims: ['long-tail-migration-complete']
  },
  {
    residualId: 'RMO-RES-07',
    residual: 'type-exports-docs-links',
    priority: 'P0',
    owner: 'migration-owner',
    targetWorkpackage: 'WP-RMO-02',
    targetStatus: 'gate-residual-ready',
    sourceHandoffs: ['NFM-HO-06'],
    requiredGates: ['type-exports-vendor', 'type-exports-loader', 'references'],
    blockedClaims: ['type-exports-release-clean']
  },
  {
    residualId: 'RMO-RES-08',
    residual: 'legacy-loader-warning-window',
    priority: 'P2',
    owner: 'migration-owner',
    targetWorkpackage: 'WP-RMO-08',
    targetStatus: 'migration-handoff-planned',
    sourceHandoffs: ['NFM-HO-02'],
    requiredGates: ['native-first-migration-deprecation', 'type-exports-loader', 'rmt-native-shell-migration', 'references'],
    blockedClaims: ['silent-loader-removal', 'loader-deprecation-without-warning-window']
  },
  {
    residualId: 'RMO-RES-09',
    residual: 'owned-docs-highlighter-review',
    priority: 'P2',
    owner: 'docs-authoring-owner',
    targetWorkpackage: 'WP-RMO-08',
    targetStatus: 'migration-handoff-planned',
    sourceHandoffs: ['NFM-HO-02'],
    requiredGates: ['native-first-migration-deprecation', 'type-exports-vendor', 'docs-public-quality', 'references'],
    blockedClaims: ['new-vendor-highlighter-default', 'broad-vendor-export']
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
  context.assertIncludes(runner, `id: '${gate}'`, `Runner registers ${gate}`);
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function runRmtUiMaximalityOwnedSurfaceBaselineSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText(CONTRACT_PATH, rootDir);
  const matrix = readText(MATRIX_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const missionHandoff = readText('development/XTend-Native-First-Mission-Handoff-Contract.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtUiMaximalityOwnedSurfaceBaseline;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    RESIDUAL_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    NEXT_EPIC_BOUNDARY,
    'no-external-ui-framework-default',
    'no-new-runtime-dependency-before-adoption-gate',
    'no-datagrid-or-command-parity-claim-before-owned-package',
    'browser-and-visual-claims-require-evidence',
    'rmt-kernel-remains-host-neutral'
  ], 'Contract header and boundaries');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract residual fields');
  assertIncludesAll(context, contract, TARGET_STATUSES, 'Contract target statuses');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    CONTRACT_SCHEMA,
    RESIDUAL_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'Priority Summary',
    'Target Workpackage Summary',
    'Target Status Summary',
    '`P0` | 5',
    '`P1` | 2',
    '`P2` | 2',
    '`WP-RMO-02` | 3',
    '`WP-RMO-03` | 1',
    '`WP-RMO-04` | 1',
    '`WP-RMO-06` | 2',
    '`WP-RMO-08` | 2',
    '`implementation-ready` | 2'
  ], 'Matrix header and summaries');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix residual fields');

  REQUIRED_RESIDUALS.forEach((residual) => {
    assertIncludesAll(context, matrix, [
      residual.residualId,
      residual.residual,
      residual.priority,
      residual.owner,
      residual.targetWorkpackage,
      residual.targetStatus
    ], `Matrix row ${residual.residualId}`);
    assertIncludesAll(context, matrix, residual.sourceHandoffs, `Matrix row ${residual.residualId} source handoffs`);
    assertIncludesAll(context, matrix, residual.requiredGates, `Matrix row ${residual.residualId} gates`);
    assertIncludesAll(context, matrix, residual.blockedClaims, `Matrix row ${residual.residualId} blocked claims`);
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures && fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures && fixtures.workpackage === 'WP-RMO-01', 'Fixture pack references WP-RMO-01');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures && fixtures.nextEpicBoundary === NEXT_EPIC_BOUNDARY, 'Fixture pack records next epic boundary');
  context.assert(fixtures && fixtures.noRuntimeDependency === true, 'Fixture pack keeps no runtime dependency boundary');
  context.assert(fixtures && fixtures.externalUiFrameworkDependencyAllowed === false, 'Fixture pack blocks external UI framework default');

  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_RESIDUALS.length, 'Fixture pack contains one row per residual');
  REQUIRED_RESIDUALS.forEach((required) => {
    const fixture = fixtureRows.find((candidate) => candidate.residualId === required.residualId);
    context.assert(Boolean(fixture), `Fixture pack contains ${required.residualId}`);
    if (!fixture) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(fixture[field]), `Fixture ${required.residualId} has ${field}`);
    });
    context.assert(fixture.residual === required.residual, `${required.residualId} has residual`);
    context.assert(fixture.priority === required.priority, `${required.residualId} has priority`);
    context.assert(fixture.owner === required.owner, `${required.residualId} has owner`);
    context.assert(fixture.targetWorkpackage === required.targetWorkpackage, `${required.residualId} has target workpackage`);
    context.assert(fixture.targetStatus === required.targetStatus, `${required.residualId} has target status`);
    assertArrayIncludesAll(context, fixture.sourceHandoffs, required.sourceHandoffs, `${required.residualId} source handoffs`);
    assertArrayIncludesAll(context, fixture.requiredGates, required.requiredGates, `${required.residualId} required gates`);
    assertArrayIncludesAll(context, fixture.blockedClaims, required.blockedClaims, `${required.residualId} blocked claims`);
    fixture.sourceArtifacts.forEach((relativePath) => {
      assertPathExists(context, rootDir, relativePath, `${required.residualId} source artifact`);
    });
  });

  const priorityCounts = countBy(fixtureRows, 'priority');
  const targetWorkpackageCounts = countBy(fixtureRows, 'targetWorkpackage');
  const targetStatusCounts = countBy(fixtureRows, 'targetStatus');
  context.assert(priorityCounts.P0 === 5, 'Priority count P0 is 5');
  context.assert(priorityCounts.P1 === 2, 'Priority count P1 is 2');
  context.assert(priorityCounts.P2 === 2, 'Priority count P2 is 2');
  context.assert(targetWorkpackageCounts['WP-RMO-02'] === 3, 'Target WP-RMO-02 count is 3');
  context.assert(targetWorkpackageCounts['WP-RMO-03'] === 1, 'Target WP-RMO-03 count is 1');
  context.assert(targetWorkpackageCounts['WP-RMO-04'] === 1, 'Target WP-RMO-04 count is 1');
  context.assert(targetWorkpackageCounts['WP-RMO-06'] === 2, 'Target WP-RMO-06 count is 2');
  context.assert(targetWorkpackageCounts['WP-RMO-08'] === 2, 'Target WP-RMO-08 count is 2');
  context.assert(targetStatusCounts['gate-residual-ready'] === 3, 'Target status gate-residual-ready count is 3');
  context.assert(targetStatusCounts['implementation-ready'] === 2, 'Target status implementation-ready count is 2');
  context.assert(targetStatusCounts['browser-evidence-planned'] === 2, 'Target status browser-evidence-planned count is 2');
  context.assert(targetStatusCounts['migration-handoff-planned'] === 2, 'Target status migration-handoff-planned count is 2');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    CONTRACT_PATH,
    MATRIX_PATH,
    FIXTURE_PATH,
    'WP-RMO-02',
    'WP-RMO-03',
    'WP-RMO-04'
  ], 'Workpackage completion');

  assertIncludesAll(context, backlog, [
    '- Status: `completed`',
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    '| `WP-RMO-01` | P0 | completed |',
    '| `WP-RMO-02` | P0 | completed |',
    '| `WP-RMO-03` | P0 | completed |',
    '| `WP-RMO-04` | P0 | completed |',
    'Status: `completed`',
    'rmt-ui-maximality-owned-surface-baseline'
  ], 'Backlog WP-RMO-01 status and artifacts');

  assertIncludesAll(context, missionHandoff, [
    BACKLOG_PATH,
    NEXT_EPIC_BOUNDARY
  ], 'Mission handoff references backlog boundary');

  context.assert(packageScripts['test:rmt-ui-maximality-owned-surface-baseline'] === 'node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline', 'Package exposes WP-RMO-01 test script');
  context.assertIncludes(runner, "require('../tests/native-first/rmt_ui_maximality_owned_surface_baseline_suite')", 'Runner imports WP-RMO-01 suite');
  context.assertIncludes(runner, "id: 'rmt-ui-maximality-owned-surface-baseline'", 'Runner registers WP-RMO-01 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.residualSchema === RESIDUAL_SCHEMA, 'Package metadata exposes residual schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.backlog === BACKLOG_PATH, 'Package metadata exposes backlog path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.nextEpicBoundary === NEXT_EPIC_BOUNDARY, 'Package metadata exposes next epic boundary');
  context.assert(metadata && metadata.residualCount === REQUIRED_RESIDUALS.length, 'Package metadata exposes residual count');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework default');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.targetStatuses, TARGET_STATUSES, 'Package metadata target statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  [
    BACKLOG_PATH,
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-RMO-01 artifact ${relativePath}`));

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'WP-RMO-01',
      contract: CONTRACT_SCHEMA,
      residuals: REQUIRED_RESIDUALS.length,
      priorityCounts,
      targetWorkpackageCounts,
      targetStatusCounts,
      nextEpicBoundary: NEXT_EPIC_BOUNDARY,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true
    }
  });
}

function printRmtUiMaximalityOwnedSurfaceBaselineReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT UI Maximality Owned Surface Baseline erfolgreich.',
    failureTitle: 'RMT UI Maximality Owned Surface Baseline fehlgeschlagen:'
  });
}

module.exports = {
  printRmtUiMaximalityOwnedSurfaceBaselineReport,
  runRmtUiMaximalityOwnedSurfaceBaselineSuite
};
