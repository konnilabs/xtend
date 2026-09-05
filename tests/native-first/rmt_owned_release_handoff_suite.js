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

const SUITE_ID = 'rmt-owned-release-handoff';
const SUITE_LABEL = 'RMT Owned Release Handoff';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-release-handoff.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-release-handoff-decision-matrix.v1';
const DECISION_SCHEMA = 'xtend.rmt-ui-maximality-owned-release-handoff-decision.v1';
const FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-release-handoff-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-release-handoff-fixtures.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-release-handoff-report.v1';
const WORKPACKAGE = 'WP-RMO-09';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-release-handoff --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-release-handoff';
const NEXT_EPIC_BOUNDARY = 'rmt-owned-runtime-components-and-docs-quality-hardening';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Release-Handoff-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Release-Handoff-Decision-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-09-Release-Handoff-und-Next-Epic-Review-abschliessen.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-release-handoff-fixtures.json';
const SUITE_PATH = 'tests/native-first/rmt_owned_release_handoff_suite.js';

const REQUIRED_FIELDS = Object.freeze([
  'handoffId',
  'releaseArea',
  'sourceWorkpackages',
  'sourceContracts',
  'status',
  'releaseDecision',
  'nextEpicBoundary',
  'residuals',
  'blockedClaims',
  'requiredGates',
  'evidenceArtifacts',
  'owner',
  'nextHandoff'
]);

const HANDOFF_STATUSES = Object.freeze([
  'accepted',
  'accepted-with-residuals',
  'needs-next-epic'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-owned-release-handoff',
  'rmt-ui-maximality-owned-surface-baseline',
  'rmt-ui-maximality-owned-surface-gate-hygiene',
  'rmt-owned-data-display-primitives',
  'rmt-owned-command-search-primitives',
  'rmt-owned-recipe-extension',
  'rmt-owned-surface-browser-lab',
  'rmt-owned-contract-budget-runtime-parity',
  'rmt-owned-migration-deprecation-docs-handoff',
  'native-first-mission-handoff',
  'contract-registry',
  'contract-runtime-parity',
  'native-first-evidence-pack',
  'native-first-budget-gates',
  'native-first-docs-authoring',
  'native-first-migration-deprecation',
  'docs-public-quality',
  'type-exports-vendor',
  'type-exports-loader',
  'component-long-tail-migration',
  'references'
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
  'new-runtime-dependency-without-adoption-gate',
  'external-ui-framework-default',
  'rmt-kernel-host-type-import',
  'full-datagrid-parity',
  'framework-table-api-copy',
  'virtualization-default-without-browser-evidence',
  'command-palette-full-parity',
  'framework-command-api-copy',
  'rich-combobox-autocomplete-parity',
  'unregistered-command-execution',
  'free-command-execution-without-action-ref',
  'manual-html-row-renderer',
  'manual-html-command-renderer',
  'visual-claim-without-artifact',
  'pixel-baseline-claim-without-artifact',
  'real-browser-visual-claim-without-artifact',
  'silent-loader-removal',
  'loader-deprecation-without-warning-window',
  'new-vendor-highlighter-default',
  'broad-vendor-export',
  'new-raw-html-conversion-without-trust-boundary',
  'public-deprecation-without-migration-guide',
  'public-docs-new-vendor-default',
  'hidden-release-residual',
  'accepted-without-owner'
]);

const REQUIRED_RESIDUALS = Object.freeze([
  'x-table-runtime-component-evidence',
  'x-tree-runtime-component-evidence',
  'x-virtual-list-browser-performance-evidence',
  'x-command-palette-runtime-component-evidence',
  'x-autocomplete-ime-browser-evidence',
  'x-combobox-aria-browser-evidence',
  'real-browser-pixel-artifacts-owner-run',
  'conditional-browser-artifact',
  'surface-browser-lab-cadence',
  'docs-public-quality-legacy-failures',
  'legacy-loader-warning-window',
  'owned-docs-highlighter-review',
  'runtime-component-evidence-next-epic',
  'docs-quality-owner-review',
  'release-owner-residual-review'
]);

const REQUIRED_HANDOFFS = Object.freeze([
  {
    handoffId: 'RMO-HO-01',
    releaseArea: 'release-boundary-and-dependency-diet',
    status: 'accepted',
    releaseDecision: 'accepted',
    owner: 'release-owner',
    nextEpicBoundary: 'native-first-governance-cadence',
    sourceWorkpackages: ['WP-RMO-01', 'WP-RMO-07', 'WP-RMO-09'],
    requiredGates: ['rmt-ui-maximality-owned-surface-baseline', 'rmt-owned-contract-budget-runtime-parity', 'native-first-budget-gates', 'references'],
    residuals: ['none'],
    blockedClaims: ['new-runtime-dependency-without-adoption-gate', 'external-ui-framework-default', 'rmt-kernel-host-type-import'],
    nextHandoff: ['native-first-governance-cadence']
  },
  {
    handoffId: 'RMO-HO-02',
    releaseArea: 'owned-data-display-surface',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'component-platform-owner',
    nextEpicBoundary: NEXT_EPIC_BOUNDARY,
    sourceWorkpackages: ['WP-RMO-03', 'WP-RMO-05', 'WP-RMO-07'],
    requiredGates: ['rmt-owned-data-display-primitives', 'rmt-owned-recipe-extension', 'rmt-owned-contract-budget-runtime-parity', 'references'],
    residuals: ['x-table-runtime-component-evidence', 'x-tree-runtime-component-evidence', 'x-virtual-list-browser-performance-evidence'],
    blockedClaims: ['full-datagrid-parity', 'framework-table-api-copy', 'virtualization-default-without-browser-evidence'],
    nextHandoff: ['runtime-component-evidence-epic']
  },
  {
    handoffId: 'RMO-HO-03',
    releaseArea: 'owned-command-search-surface',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'component-platform-owner',
    nextEpicBoundary: NEXT_EPIC_BOUNDARY,
    sourceWorkpackages: ['WP-RMO-04', 'WP-RMO-05', 'WP-RMO-07'],
    requiredGates: ['rmt-owned-command-search-primitives', 'rmt-owned-recipe-extension', 'rmt-owned-contract-budget-runtime-parity', 'native-first-overlay-focus', 'references'],
    residuals: ['x-command-palette-runtime-component-evidence', 'x-autocomplete-ime-browser-evidence', 'x-combobox-aria-browser-evidence'],
    blockedClaims: ['command-palette-full-parity', 'framework-command-api-copy', 'rich-combobox-autocomplete-parity', 'unregistered-command-execution', 'free-command-execution-without-action-ref'],
    nextHandoff: ['runtime-component-evidence-epic']
  },
  {
    handoffId: 'RMO-HO-04',
    releaseArea: 'rmt-recipes-browser-lab-and-visual-evidence',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'browser-lab-owner',
    nextEpicBoundary: 'browser-lab-owner-run-cadence',
    sourceWorkpackages: ['WP-RMO-05', 'WP-RMO-06', 'WP-RMO-07'],
    requiredGates: ['rmt-owned-recipe-extension', 'rmt-owned-surface-browser-lab', 'native-first-budget-gates', 'rmt-renderer-dom-descriptor-proofs', 'references'],
    residuals: ['real-browser-pixel-artifacts-owner-run', 'conditional-browser-artifact', 'surface-browser-lab-cadence'],
    blockedClaims: ['manual-html-row-renderer', 'manual-html-command-renderer', 'visual-claim-without-artifact', 'pixel-baseline-claim-without-artifact', 'real-browser-visual-claim-without-artifact'],
    nextHandoff: ['browser-lab-owner-review']
  },
  {
    handoffId: 'RMO-HO-05',
    releaseArea: 'migration-docs-and-vendor-containment',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'docs-authoring-owner',
    nextEpicBoundary: 'docs-quality-owner-review',
    sourceWorkpackages: ['WP-RMO-02', 'WP-RMO-08'],
    requiredGates: ['rmt-ui-maximality-owned-surface-gate-hygiene', 'rmt-owned-migration-deprecation-docs-handoff', 'native-first-migration-deprecation', 'docs-public-quality', 'type-exports-vendor', 'type-exports-loader', 'component-long-tail-migration', 'references'],
    residuals: ['docs-public-quality-legacy-failures', 'legacy-loader-warning-window', 'owned-docs-highlighter-review'],
    blockedClaims: ['silent-loader-removal', 'loader-deprecation-without-warning-window', 'new-vendor-highlighter-default', 'broad-vendor-export', 'new-raw-html-conversion-without-trust-boundary', 'public-deprecation-without-migration-guide', 'public-docs-new-vendor-default'],
    nextHandoff: ['docs-quality-owner-review']
  },
  {
    handoffId: 'RMO-HO-06',
    releaseArea: 'release-next-epic-boundary',
    status: 'needs-next-epic',
    releaseDecision: 'accepted-with-residuals',
    owner: 'release-owner',
    nextEpicBoundary: NEXT_EPIC_BOUNDARY,
    sourceWorkpackages: ['WP-RMO-07', 'WP-RMO-08', 'WP-RMO-09'],
    requiredGates: ['rmt-owned-release-handoff', 'native-first-mission-handoff', 'contract-registry', 'contract-runtime-parity', 'native-first-evidence-pack', 'references'],
    residuals: ['runtime-component-evidence-next-epic', 'docs-quality-owner-review', 'release-owner-residual-review'],
    blockedClaims: ['hidden-release-residual', 'accepted-without-owner', 'new-runtime-dependency-without-adoption-gate', 'external-ui-framework-default'],
    nextHandoff: ['next-epic-intake']
  }
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  BACKLOG_PATH,
  CONTRACT_PATH,
  MATRIX_PATH,
  WORKPACKAGE_PATH,
  FIXTURE_PATH,
  SUITE_PATH,
  'development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Source-of-Truth-Contract.md',
  'development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Gate-Hygiene-Report.md',
  'development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md',
  'development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md',
  'development/XTend-RMT-Owned-Recipe-Extension-Contract.md',
  'development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Contract.md',
  'development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Contract.md',
  'development/XTend-RMT-Owned-Migration-Deprecation-Docs-Handoff-Contract.md',
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

function uniqueRequiredGates(entries) {
  return Array.from(new Set(entries.flatMap((entry) => entry.requiredGates || []))).sort();
}

function runRmtOwnedReleaseHandoffSuite(options = {}) {
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
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const migrationFixtures = readJson('tests/fixtures/native-first/rmt-owned-migration-deprecation-docs-handoff-fixtures.json', rootDir);
  const parityFixtures = readJson('tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json', rootDir);
  const browserFixtures = readJson('tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json', rootDir);
  const nativeMissionFixtures = readJson('tests/fixtures/native-first/native-first-mission-handoff-fixtures.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedReleaseHandoff;
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((relativePath) => {
    assertPathExists(context, rootDir, relativePath, `WP-RMO-09 artifact ${relativePath}`);
  });
  context.assert(suiteSyntax.ok, `WP-RMO-09 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    NEXT_EPIC_BOUNDARY,
    'accepted-with-residuals',
    'needs-next-epic',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'WP-RMO-09 contract');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'WP-RMO-09 contract fields');
  assertIncludesAll(context, contract, HANDOFF_STATUSES, 'WP-RMO-09 status model');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'WP-RMO-09 source gates');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    FIXTURE_PATH,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'Status Summary',
    'Release Decision Summary',
    'Blocked Claim Summary',
    'Final Owner Decision',
    NEXT_EPIC_BOUNDARY
  ], 'WP-RMO-09 matrix');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'WP-RMO-09 matrix fields');
  assertIncludesAll(context, matrix, [
    '`accepted` | 1',
    '`accepted-with-residuals` | 4',
    '`needs-next-epic` | 1',
    '`accepted-with-residuals` | 5'
  ], 'WP-RMO-09 matrix counts');
  assertIncludesAll(context, matrix, REQUIRED_BLOCKED_CLAIMS, 'WP-RMO-09 matrix blocked claims');

  REQUIRED_HANDOFFS.forEach((handoff) => {
    assertIncludesAll(context, matrix, [
      handoff.handoffId,
      handoff.releaseArea,
      handoff.status,
      handoff.releaseDecision,
      handoff.owner,
      handoff.nextEpicBoundary
    ], `Matrix row ${handoff.handoffId}`);
    assertIncludesAll(context, matrix, handoff.sourceWorkpackages, `Matrix row ${handoff.handoffId} workpackages`);
    assertIncludesAll(context, matrix, handoff.requiredGates, `Matrix row ${handoff.handoffId} gates`);
    assertIncludesAll(context, matrix, handoff.residuals, `Matrix row ${handoff.handoffId} residuals`);
    assertIncludesAll(context, matrix, handoff.blockedClaims, `Matrix row ${handoff.handoffId} blocked claims`);
    assertIncludesAll(context, matrix, handoff.nextHandoff, `Matrix row ${handoff.handoffId} next handoff`);
  });

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes fixture schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.decisionSchema === DECISION_SCHEMA, 'Fixture pack references decision schema');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-09');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  context.assert(fixtures.releaseDecision === 'accepted-with-residuals', 'Fixture pack records release decision');
  context.assert(fixtures.nextEpicBoundary === NEXT_EPIC_BOUNDARY, 'Fixture pack records next epic boundary');
  context.assert(fixtures.noRuntimeDependency === true, 'Fixture pack records no runtime dependency');
  context.assert(fixtures.externalUiFrameworkDependencyAllowed === false, 'Fixture pack blocks external framework dependency');
  context.assert(fixtures.unsafeHtmlSinkAllowed === false, 'Fixture pack blocks unsafe HTML sink');
  context.assert(fixtures.createsSecondRegistry === false, 'Fixture pack blocks second registry');
  context.assert(fixtures.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Fixture pack keeps RMT kernel boundary');
  assertArrayIncludesAll(context, fixtures.sourceGates, REQUIRED_SOURCE_GATES, 'Fixture source gates');
  assertArrayIncludesAll(context, fixtures.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Fixture blocked claims');
  assertArrayIncludesAll(context, fixtures.residuals, REQUIRED_RESIDUALS, 'Fixture residuals');

  const entries = fixtures.fixtures || [];
  context.assert(entries.length === REQUIRED_HANDOFFS.length, 'Fixture pack contains one entry per handoff');
  REQUIRED_HANDOFFS.forEach((required) => {
    const entry = entries.find((candidate) => candidate.handoffId === required.handoffId);
    context.assert(Boolean(entry), `Fixture pack contains ${required.handoffId}`);
    if (!entry) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(entry[field]), `${required.handoffId} has ${field}`);
    });
    context.assert(entry.releaseArea === required.releaseArea, `${required.handoffId} has release area`);
    context.assert(entry.status === required.status, `${required.handoffId} has status`);
    context.assert(entry.releaseDecision === required.releaseDecision, `${required.handoffId} has release decision`);
    context.assert(entry.owner === required.owner, `${required.handoffId} has owner`);
    context.assert(entry.nextEpicBoundary === required.nextEpicBoundary, `${required.handoffId} has next epic boundary`);
    assertArrayIncludesAll(context, entry.sourceWorkpackages, required.sourceWorkpackages, `${required.handoffId} workpackages`);
    assertArrayIncludesAll(context, entry.requiredGates, required.requiredGates, `${required.handoffId} gates`);
    assertArrayIncludesAll(context, entry.residuals, required.residuals, `${required.handoffId} residuals`);
    assertArrayIncludesAll(context, entry.blockedClaims, required.blockedClaims, `${required.handoffId} blocked claims`);
    assertArrayIncludesAll(context, entry.nextHandoff, required.nextHandoff, `${required.handoffId} next handoff`);
    context.assert(Array.isArray(entry.sourceContracts) && entry.sourceContracts.length > 0, `${required.handoffId} has source contracts`);
    context.assert(Array.isArray(entry.evidenceArtifacts) && entry.evidenceArtifacts.length > 0, `${required.handoffId} has evidence artifacts`);
    entry.evidenceArtifacts.forEach((relativePath) => {
      assertPathExists(context, rootDir, relativePath, `${required.handoffId} evidence artifact`);
    });
  });

  const statusCounts = countBy(entries, 'status');
  const releaseDecisionCounts = countBy(entries, 'releaseDecision');
  context.assert(statusCounts.accepted === 1, 'Status count accepted is 1');
  context.assert(statusCounts['accepted-with-residuals'] === 4, 'Status count accepted-with-residuals is 4');
  context.assert(statusCounts['needs-next-epic'] === 1, 'Status count needs-next-epic is 1');
  context.assert(releaseDecisionCounts.accepted === 1, 'Release decision count accepted is 1');
  context.assert(releaseDecisionCounts['accepted-with-residuals'] === 5, 'Release decision count accepted-with-residuals is 5');

  const parityResidualIds = (parityFixtures.ownerableResiduals || []).map((entry) => entry.residual);
  const browserBlockedClaims = (browserFixtures.entries || []).flatMap((entry) => entry.blockedClaims || []);

  assertArrayIncludesAll(context, parityResidualIds, [
    'x-table-runtime-component-evidence',
    'x-virtual-list-browser-performance-evidence',
    'x-command-palette-runtime-component-evidence',
    'x-autocomplete-ime-browser-evidence',
    'x-combobox-aria-browser-evidence'
  ], 'WP-RMO-07 residuals feed release handoff');
  assertArrayIncludesAll(context, migrationFixtures.sourceResiduals, [
    'legacy-loader-warning-window',
    'owned-docs-highlighter-review'
  ], 'WP-RMO-08 residuals feed release handoff');
  assertArrayIncludesAll(context, browserBlockedClaims, [
    'visual-claim-without-artifact',
    'pixel-baseline-claim-without-artifact',
    'real-browser-visual-claim-without-artifact'
  ], 'WP-RMO-06 blocked claims feed release handoff');
  context.assert(nativeMissionFixtures.nextEpicBoundary === 'rmt-ui-maximality-and-owned-component-surface-hardening', 'NFM-WP-22 feeds RMO backlog boundary');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    NEXT_EPIC_BOUNDARY,
    'accepted-with-residuals',
    'keine neue Runtime-Dependency'
  ], 'WP-RMO-09 workpackage');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    SUITE_PATH,
    '| `WP-RMO-01` | P0 | completed |',
    '| `WP-RMO-02` | P0 | completed |',
    '| `WP-RMO-03` | P0 | completed |',
    '| `WP-RMO-04` | P0 | completed |',
    '| `WP-RMO-05` | P1 | completed |',
    '| `WP-RMO-06` | P1 | completed |',
    '| `WP-RMO-07` | P1 | completed |',
    '| `WP-RMO-08` | P2 | completed |',
    '| `WP-RMO-09` | P2 | completed |',
    'Release Decision: `accepted-with-residuals`',
    `Next Epic Boundary: \`${NEXT_EPIC_BOUNDARY}\``,
    'rmt-owned-release-handoff'
  ], 'Backlog WP-RMO-09 status');

  context.assert(packageScripts['test:rmt-owned-release-handoff'] === 'node scripts/run_xtend_tests.js rmt-owned-release-handoff', 'Package exposes WP-RMO-09 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/rmt_owned_release_handoff_suite.js" }), 'Runner imports WP-RMO-09 suite');
  context.assert(runner.hasSuite("rmt-owned-release-handoff"), 'Runner registers WP-RMO-09 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    context.assert(runner.hasSuite(gate), `Runner registers source gate ${gate}`);
  });
  uniqueRequiredGates(entries).forEach((gate) => {
    context.assert(runner.hasSuite(gate), `Runner registers handoff gate ${gate}`);
  });

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.decisionSchema === DECISION_SCHEMA, 'Package metadata exposes decision schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-09');
  context.assert(metadata && metadata.status === 'accepted-with-residuals', 'Package metadata marks WP-RMO-09 status');
  context.assert(metadata && metadata.releaseDecision === 'accepted-with-residuals', 'Package metadata exposes release decision');
  context.assert(metadata && metadata.nextEpicBoundary === NEXT_EPIC_BOUNDARY, 'Package metadata exposes next epic boundary');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external framework dependency');
  context.assert(metadata && metadata.unsafeHtmlSinkAllowed === false, 'Package metadata blocks unsafe HTML sink');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata blocks second registry');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.handoffStatuses, HANDOFF_STATUSES, 'Package metadata statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');
  assertArrayIncludesAll(context, metadata && metadata.residuals, REQUIRED_RESIDUALS, 'Package metadata residuals');

  const metadataRows = (metadata && metadata.handoffs) || [];
  context.assert(metadataRows.length === REQUIRED_HANDOFFS.length, 'Package metadata registers all handoffs');
  REQUIRED_HANDOFFS.forEach((required) => {
    const handoff = metadataRows.find((candidate) => candidate.handoffId === required.handoffId);
    context.assert(Boolean(handoff), `Package metadata registers ${required.handoffId}`);
    if (!handoff) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(handoff[field]), `Package metadata ${required.handoffId} has ${field}`);
    });
    context.assert(handoff.status === required.status, `Package metadata ${required.handoffId} has status`);
    context.assert(handoff.releaseDecision === required.releaseDecision, `Package metadata ${required.handoffId} has release decision`);
    context.assert(handoff.owner === required.owner, `Package metadata ${required.handoffId} has owner`);
    context.assert(handoff.nextEpicBoundary === required.nextEpicBoundary, `Package metadata ${required.handoffId} has next epic boundary`);
    assertArrayIncludesAll(context, handoff.sourceWorkpackages, required.sourceWorkpackages, `Package metadata ${required.handoffId} workpackages`);
    assertArrayIncludesAll(context, handoff.requiredGates, required.requiredGates, `Package metadata ${required.handoffId} gates`);
    assertArrayIncludesAll(context, handoff.residuals, required.residuals, `Package metadata ${required.handoffId} residuals`);
    assertArrayIncludesAll(context, handoff.blockedClaims, required.blockedClaims, `Package metadata ${required.handoffId} blocked claims`);
    assertArrayIncludesAll(context, handoff.nextHandoff, required.nextHandoff, `Package metadata ${required.handoffId} handoff`);
  });

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      handoffs: entries.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      blockedClaims: REQUIRED_BLOCKED_CLAIMS.length,
      residuals: REQUIRED_RESIDUALS.length,
      statusCounts,
      releaseDecisionCounts,
      releaseDecision: 'accepted-with-residuals',
      nextEpicBoundary: NEXT_EPIC_BOUNDARY,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true
    }
  });
}

function printRmtOwnedReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Release Handoff erfolgreich.',
    failureTitle: 'RMT Owned Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedReleaseHandoffReport,
  runRmtOwnedReleaseHandoffSuite
};
