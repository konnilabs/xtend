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

const SUITE_ID = 'rmt-owned-migration-deprecation-docs-handoff';
const SUITE_LABEL = 'RMT Owned Migration Deprecation Docs Handoff';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-matrix.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-fixtures.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-report.v1';
const WORKPACKAGE = 'WP-RMO-08';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-migration-deprecation-docs-handoff';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Migration-Deprecation-Docs-Handoff-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Migration-Deprecation-Docs-Handoff-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-08-Migration-Deprecation-und-Docs-Handoff-fuer-Legacy-Highlighter-Residuals-finalisieren.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-migration-deprecation-docs-handoff-fixtures.json';
const PUBLIC_DOC_PATH = 'docs/en/native-first-migration-guide.md';
const SUITE_PATH = 'tests/native-first/rmt_owned_migration_deprecation_docs_handoff_suite.js';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-owned-migration-deprecation-docs-handoff',
  'native-first-migration-deprecation',
  'type-exports-loader',
  'rmt-native-shell-migration',
  'component-long-tail-migration',
  'type-exports-vendor',
  'docs-public-quality',
  'rmt-owned-contract-budget-runtime-parity',
  'references'
]);

const REQUIRED_ENTRY_IDS = Object.freeze([
  'RMO-MIG-01',
  'RMO-MIG-02',
  'RMO-MIG-03',
  'RMO-MIG-04',
  'RMO-MIG-05'
]);

const REQUIRED_STATUSES = Object.freeze([
  'deprecation-handoff-accepted',
  'highlighter-decision-accepted',
  'vendor-containment-accepted',
  'docs-handoff-accepted',
  'release-residuals-ownerable'
]);

const REQUIRED_RESIDUALS = Object.freeze([
  'legacy-loader-warning-window',
  'owned-docs-highlighter-review'
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
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

const REQUIRED_PUBLIC_DOCS = Object.freeze([
  'docs/de/native-first-migration-guide.md',
  PUBLIC_DOC_PATH
]);

const REQUIRED_SEMVER_RULES = Object.freeze([
  'major-removal-only-after-two-minor-warnings',
  'minor-warning-before-public-surface-change',
  'blocked-for-new-raw-html-conversion-without-trust-boundary',
  'new-owned-implementation-requires-docs-public-quality-and-type-exports-vendor'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  BACKLOG_PATH,
  CONTRACT_PATH,
  MATRIX_PATH,
  WORKPACKAGE_PATH,
  FIXTURE_PATH,
  SUITE_PATH,
  'development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md',
  'development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md',
  'development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md',
  'development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Contract.md',
  'docs/de/native-first-migration-guide.md',
  'docs/en/native-first-migration-guide.md',
  'docs/de/xtend-vendor-types.md',
  'docs/en/xtend-vendor-types.md',
  'xtend-loader.js'
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
  return Array.from(new Set((entries || []).flatMap((entry) => entry.requiredGates || [])));
}

function runRmtOwnedMigrationDeprecationDocsHandoffSuite(options = {}) {
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
  const publicDoc = readText(PUBLIC_DOC_PATH, rootDir);
  const migrationGuideDe = readText('docs/de/native-first-migration-guide.md', rootDir);
  const migrationGuideEn = readText('docs/en/native-first-migration-guide.md', rootDir);
  const vendorTypesDe = readText('docs/de/xtend-vendor-types.md', rootDir);
  const vendorTypesEn = readText('docs/en/xtend-vendor-types.md', rootDir);
  const nativeMigrationContract = readText('development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md', rootDir);
  const nativeMigrationMatrix = readText('development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md', rootDir);
  const vendorMatrix = readText('development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md', rootDir);
  const parityContract = readText('development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Contract.md', rootDir);
  const residualFixtures = readJson('tests/fixtures/native-first/rmt-ui-maximality-owned-surface-residual-fixtures.json', rootDir);
  const nativeMigrationFixtures = readJson('tests/fixtures/native-first/native-first-migration-deprecation-fixtures.json', rootDir);
  const loaderRuntime = readText('xtend-loader.js', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedMigrationDeprecationDocsHandoff;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((relativePath) => {
    assertPathExists(context, rootDir, relativePath, `WP-RMO-08 artifact ${relativePath}`);
  });
  context.assert(suiteSyntax.ok, `WP-RMO-08 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'legacy-loader-warning-window',
    'owned-docs-highlighter-review',
    'compatibility-warning-window-accepted',
    'owned-docs-highlighter-roadmap-accepted',
    'contained-facade-no-broad-export',
    'trust-boundary-before-new-use',
    'public-docs-handoff-accepted',
    'no-silent-loader-removal',
    'no-new-vendor-highlighter-default',
    'no-broad-vendor-export',
    'no-new-raw-html-conversion-without-trust-boundary'
  ], 'WP-RMO-08 contract');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'WP-RMO-08 contract source gates');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'Handoff-Matrix',
    'Public Docs Handoff',
    'SemVer- und Removal-Regeln',
    'major-removal-only-after-two-minor-warnings',
    'minor-warning-before-public-surface-change',
    'blocked-for-new-raw-html-conversion-without-trust-boundary',
    'release-owner'
  ], 'WP-RMO-08 matrix');
  assertIncludesAll(context, matrix, REQUIRED_ENTRY_IDS, 'WP-RMO-08 matrix entry IDs');
  assertIncludesAll(context, matrix, REQUIRED_STATUSES, 'WP-RMO-08 matrix statuses');
  assertIncludesAll(context, matrix, REQUIRED_BLOCKED_CLAIMS, 'WP-RMO-08 matrix blocked claims');

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
    'docs/de/native-first-migration-guide.md',
    PUBLIC_DOC_PATH,
    SUITE_PATH,
    '`native-first-migration-deprecation` bleibt gruen',
    'WP-RMO-09'
  ], 'WP-RMO-08 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-08');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  assertArrayIncludesAll(context, fixtures.sourceGates, REQUIRED_SOURCE_GATES, 'Fixture source gates');
  assertArrayIncludesAll(context, fixtures.sourceResiduals, REQUIRED_RESIDUALS, 'Fixture source residuals');
  assertArrayIncludesAll(context, fixtures.publicDocs, REQUIRED_PUBLIC_DOCS, 'Fixture public docs');
  assertArrayIncludesAll(context, fixtures.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Fixture blocked claims');

  REQUIRED_SEMVER_RULES.forEach((rule) => {
    context.assert(Object.values(fixtures.semverRules || {}).includes(rule), `Fixture semver rules include ${rule}`);
  });
  context.assert(fixtures.runtimeBoundary.silentRemovalAllowed === false, 'Fixture blocks silent removal');
  context.assert(fixtures.runtimeBoundary.newVendorHighlighterDefaultAllowed === false, 'Fixture blocks new vendor highlighter default');
  context.assert(fixtures.runtimeBoundary.broadVendorExportAllowed === false, 'Fixture blocks broad vendor export');
  context.assert(fixtures.runtimeBoundary.newRawHtmlConversionWithoutTrustBoundaryAllowed === false, 'Fixture blocks unsafe raw HTML conversion');
  context.assert(fixtures.runtimeBoundary.noRuntimeDependency === true, 'Fixture adds no runtime dependency');
  context.assert(fixtures.runtimeBoundary.externalNetworkAllowedInLocalGate === false, 'Fixture blocks external network');

  const entries = fixtures.entries || [];
  context.assert(entries.length === REQUIRED_ENTRY_IDS.length, 'Fixture pack has five handoff entries');
  assertArrayIncludesAll(context, entries.map((entry) => entry.entryId), REQUIRED_ENTRY_IDS, 'Fixture handoff IDs');
  assertArrayIncludesAll(context, entries.map((entry) => entry.status), REQUIRED_STATUSES, 'Fixture handoff statuses');
  const statusCounts = countBy(entries, 'status');
  Object.entries(fixtures.statusSummary || {}).forEach(([status, count]) => {
    context.assert(statusCounts[status] === count, `Fixture summary ${status} matches entries`);
  });
  entries.forEach((entry) => {
    context.assert(entry.owner && entry.decision && entry.warningWindow && entry.semverPolicy, `${entry.entryId}: decision fields are present`);
    context.assert(Array.isArray(entry.nextHandoff) && entry.nextHandoff.includes('WP-RMO-09'), `${entry.entryId}: hands off to WP-RMO-09`);
    assertArrayIncludesAll(context, fixtures.blockedClaims, entry.blockedClaims || [], `${entry.entryId} blocked claim registry`);
    (entry.docs || []).forEach((docPath) => assertPathExists(context, rootDir, docPath, `${entry.entryId} docs`));
  });

  assertArrayIncludesAll(context, uniqueRequiredGates(entries), [
    'native-first-migration-deprecation',
    'type-exports-loader',
    'rmt-native-shell-migration',
    'component-long-tail-migration',
    'type-exports-vendor',
    'docs-public-quality',
    'native-first-docs-authoring',
    'rmt-owned-contract-budget-runtime-parity',
    'references'
  ], 'Handoff entry required gates');

  assertIncludesAll(context, publicDoc, [
    '# Native-First Migration Guide',
    'Prism And Turndown',
    'remain narrow local utilities',
    'owned docs highlighter',
    'RMT-aware semantic tokens',
    'Turndown',
    'trust boundary',
    'structured writer',
    'Both paths remain free of new runtime dependencies',
    'Legacy Loader',
    'are legacy compatibility surfaces',
    'major window',
    'two earlier minor warnings',
    'type-exports-loader',
    'native-first-migration-deprecation'
  ], 'Public RMO migration handoff doc');
  context.assert(!publicDoc.includes('Prism is the default'), 'Public doc does not claim Prism as default');
  context.assert(!publicDoc.includes('may remove it silently'), 'Public doc does not permit silent removal');

  assertIncludesAll(context, migrationGuideDe, [
    'Prism und Turndown',
    'owned Docs-Highlighter',
    'RMT-aware Semantic Tokens',
    'structured writer',
    'Sanitizing Boundary',
    'native-first-migration-deprecation'
  ], 'German migration guide');
  assertIncludesAll(context, migrationGuideEn, [
    'Prism And Turndown',
    'owned docs highlighter',
    'RMT-aware semantic tokens',
    'structured writer',
    'sanitizing boundary',
    'native-first-migration-deprecation'
  ], 'English migration guide');
  assertIncludesAll(context, vendorTypesDe, ['Prism', 'Turndown', 'breite Runtime'], 'German vendor type docs');
  assertIncludesAll(context, vendorTypesEn, ['Prism', 'Turndown', 'broad runtime dependencies'], 'English vendor type docs');

  assertIncludesAll(context, nativeMigrationContract, [
    'xtend.native-first.migration-deprecation-plan.v1',
    'no-silent-deprecation',
    'migration-guide-before-public-deprecation'
  ], 'Native-First migration contract');
  assertIncludesAll(context, nativeMigrationMatrix, [
    'NFM-MIG-02',
    'NFM-MIG-03',
    'NFM-MIG-06',
    'owned-docs-highlighter-review',
    'compatibility-warning-before-removal',
    'freeze-facade-no-broad-export'
  ], 'Native-First migration matrix');
  assertIncludesAll(context, vendorMatrix, [
    'PrismJS Vendor Highlighter',
    'Turndown-kompatibler lokaler Helper',
    'contain-with-exit-plan',
    'accepted-contained-vendor-utility'
  ], 'Vendor replacement matrix');
  assertIncludesAll(context, parityContract, [
    'WP-RMO-08',
    'Contract Registry',
    'Runtime Parity',
    'Budget Gates'
  ], 'WP-RMO-07 parity handoff');
  assertIncludesAll(context, loaderRuntime, [
    'XTendLoader',
    'xtend.loader'
  ], 'Loader compatibility runtime');

  const residuals = residualFixtures.fixtures || residualFixtures.residuals || [];
  assertArrayIncludesAll(context, residuals.map((entry) => entry.residual), REQUIRED_RESIDUALS, 'RMO residual baseline');
  const nativeMigrationRows = nativeMigrationFixtures.fixtures || nativeMigrationFixtures.migrations || [];
  assertArrayIncludesAll(context, nativeMigrationRows.map((entry) => entry.migrationId), ['NFM-MIG-02', 'NFM-MIG-03', 'NFM-MIG-06'], 'Native migration fixtures');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    PUBLIC_DOC_PATH,
    SUITE_PATH,
    '| `WP-RMO-07` | P1 | completed |',
    '| `WP-RMO-08` | P2 | completed |',
    '| `WP-RMO-09` | P2 | completed |',
    'rmt-owned-migration-deprecation-docs-handoff'
  ], 'Backlog WP-RMO-08 status');

  context.assert(packageScripts['test:rmt-owned-migration-deprecation-docs-handoff'] === 'node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff', 'Package exposes WP-RMO-08 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/rmt_owned_migration_deprecation_docs_handoff_suite.js" }), 'Runner imports WP-RMO-08 suite');
  context.assert(runner.hasSuite("rmt-owned-migration-deprecation-docs-handoff"), 'Runner registers WP-RMO-08 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    context.assert(runner.hasSuite(gate), `Runner registers source gate ${gate}`);
  });
  uniqueRequiredGates(entries).forEach((gate) => {
    context.assert(runner.hasSuite(gate), `Runner registers handoff gate ${gate}`);
  });

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-08');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata marks WP-RMO-08 accepted');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.publicDocs === PUBLIC_DOC_PATH, 'Package metadata exposes public docs path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.silentRemovalAllowed === false, 'Package metadata blocks silent removal');
  context.assert(metadata && metadata.newVendorHighlighterDefaultAllowed === false, 'Package metadata blocks vendor highlighter default');
  context.assert(metadata && metadata.broadVendorExportAllowed === false, 'Package metadata blocks broad vendor export');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.sourceResiduals, REQUIRED_RESIDUALS, 'Package metadata residuals');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      handoffEntries: entries.length,
      publicDocs: REQUIRED_PUBLIC_DOCS.length,
      blockedClaims: REQUIRED_BLOCKED_CLAIMS.length,
      sourceResiduals: REQUIRED_RESIDUALS.length,
      localGate: LOCAL_GATE
    }
  });
}

function printRmtOwnedMigrationDeprecationDocsHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Migration Deprecation Docs Handoff erfolgreich.',
    failureTitle: 'RMT Owned Migration Deprecation Docs Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedMigrationDeprecationDocsHandoffReport,
  runRmtOwnedMigrationDeprecationDocsHandoffSuite
};
