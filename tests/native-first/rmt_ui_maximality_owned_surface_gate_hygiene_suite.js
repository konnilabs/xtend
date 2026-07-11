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

const SUITE_ID = 'rmt-ui-maximality-owned-surface-gate-hygiene';
const SUITE_LABEL = 'RMT UI Maximality Owned Surface Gate Hygiene';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.gate-hygiene-report.v1';
const FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.gate-hygiene-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-component-surface-hardening.gate-hygiene-fixtures.v1';
const WORKPACKAGE = 'WP-RMO-02';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-gate-hygiene --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-ui-maximality-owned-surface-gate-hygiene';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const REPORT_PATH = 'development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Gate-Hygiene-Report.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-02-Docs-TypeExports-und-Component-Long-Tail-Gate-Residuals-schliessen.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-ui-maximality-owned-surface-gate-hygiene-fixtures.json';
const SUITE_PATH = 'tests/native-first/rmt_ui_maximality_owned_surface_gate_hygiene_suite.js';

const CLOSED_RESIDUALS = Object.freeze([
  'component-long-tail-migration-docs-file',
  'type-exports-docs-links'
]);

const OWNER_HANDOFFS = Object.freeze([
  'docs-public-quality-legacy-failures'
]);

const PASSED_GATES = Object.freeze([
  'component-long-tail-migration',
  'type-exports-vendor',
  'type-exports-loader',
  'references'
]);

const TARGET_COMPONENTS = Object.freeze([
  'xstate',
  'x-utils',
  'xtend-i18n'
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

function findGate(fixtures, id) {
  return (fixtures.gates || []).find((gate) => gate.id === id);
}

function runRmtUiMaximalityOwnedSurfaceGateHygieneSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const backlog = readText(BACKLOG_PATH, rootDir);
  const report = readText(REPORT_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const longTailDocs = readText('docs/en/component-long-tail-migration.md', rootDir);
  const componentUxGates = readText('development/docs-evidence/root/component-ux-gates.md', rootDir);
  const catalogDocs = readText('development/docs-evidence/root/component-catalog-coverage.md', rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtUiMaximalityOwnedSurfaceGateHygiene;
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  [
    BACKLOG_PATH,
    REPORT_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    SUITE_PATH,
    'docs/en/component-long-tail-migration.md',
    'development/docs-evidence/root/component-ux-gates.md',
    'development/docs-evidence/root/component-catalog-coverage.md',
    'docs/de/component-long-tail-migration.md',
    'docs/en/component-long-tail-migration.md'
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-RMO-02 artifact ${relativePath}`));

  context.assert(suiteSyntax.ok, `WP-RMO-02 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, report, [
    REPORT_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'accepted-with-owner-handoff',
    'component-long-tail-migration-docs-file',
    'type-exports-docs-links',
    'docs-public-quality-legacy-failures',
    'docs-authoring-owner',
    '`21` bekannte Legacy-Befunde',
    '`xstate`, `x-utils`, `xtend-i18n`',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'Gate hygiene report');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    REPORT_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    LOCAL_GATE,
    REPORT_PATH,
    FIXTURE_PATH,
    SUITE_PATH,
    'docs/en/component-long-tail-migration.md',
    'development/docs-evidence/root/component-ux-gates.md',
    'development/docs-evidence/root/component-catalog-coverage.md',
    'WP-RMO-03',
    'WP-RMO-04'
  ], 'WP-RMO-02 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes fixture schema');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-02');
  context.assert(fixtures.status === 'accepted-with-owner-handoff', 'Fixture pack records owner handoff status');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack records local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack records package script');
  context.assert(fixtures.noRuntimeDependency === true, 'Fixture pack adds no runtime dependency');
  context.assert(fixtures.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Fixture pack keeps RMT kernel boundary');
  assertArrayIncludesAll(context, fixtures.closedResiduals, CLOSED_RESIDUALS, 'Fixture closed residuals');
  assertArrayIncludesAll(context, fixtures.nextWorkpackages, ['WP-RMO-03', 'WP-RMO-04'], 'Fixture next workpackages');

  PASSED_GATES.forEach((gateId) => {
    const gate = findGate(fixtures, gateId);
    context.assert(gate && gate.status === 'passed', `${gateId} is marked passed`);
  });
  const docsGate = findGate(fixtures, 'docs-public-quality');
  context.assert(docsGate && docsGate.status === 'owner-handoff', 'docs-public-quality is owner handoff');
  context.assert(docsGate && docsGate.failureCount === 19, 'docs-public-quality handoff records 19 failures');
  context.assert(docsGate && docsGate.owner === 'docs-authoring-owner', 'docs-public-quality handoff has docs owner');
  TARGET_COMPONENTS.forEach((tag) => {
    const gate = findGate(fixtures, 'component-long-tail-migration');
    context.assert(gate && Array.isArray(gate.targetComponents) && gate.targetComponents.includes(tag), `Long-tail gate tracks ${tag}`);
  });
  fixtures.fixedArtifacts.forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `Fixed artifact ${relativePath}`));

  assertIncludesAll(context, docsReadme, [
    './component-long-tail-migration.md',
    './xtend-loader-types.md',
    './xtend-vendor-types.md'
  ], 'Docs README');
  assertIncludesAll(context, longTailDocs, [
    'node scripts/run_xtend_tests.js component-long-tail-migration --json',
    '`xstate`',
    '`x-utils`',
    '`xtend-i18n` stays an integration service'
  ], 'Component Long-Tail docs');
  assertIncludesAll(context, componentUxGates, [
    'component-long-tail-migration',
    'node scripts/run_xtend_tests.js component-ux-authoring-docs component-long-tail-migration references --json'
  ], 'Component UX Gates docs');
  assertIncludesAll(context, catalogDocs, [
    'xtend.docs.component-catalog-coverage.v1',
    'WP-E11-17',
    '`xstate`, `x-utils` and `xtend-i18n`'
  ], 'Component Catalog Coverage docs');
  const menuEntry = menu.find((entry) => entry.slug === 'component-long-tail-migration');
  context.assert(menuEntry && menuEntry.labels && menuEntry.labels.de && menuEntry.labels.en, 'Docs menu exposes localized Component Long-Tail Migration entry');

  assertIncludesAll(context, backlog, [
    REPORT_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    SUITE_PATH,
    '| `WP-RMO-02` | P0 | completed |',
    '| `WP-RMO-03` | P0 | completed |',
    '| `WP-RMO-04` | P0 | completed |',
    'docs-public-quality --json` bleibt mit `19` Legacy-Befunden',
    'rmt-ui-maximality-owned-surface-gate-hygiene'
  ], 'Backlog WP-RMO-02 status');

  context.assert(packageManifest.scripts['test:rmt-ui-maximality-owned-surface-gate-hygiene'] === 'node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-gate-hygiene', 'Package exposes WP-RMO-02 test script');
  context.assertIncludes(runner, "require('../tests/native-first/rmt_ui_maximality_owned_surface_gate_hygiene_suite')", 'Runner imports WP-RMO-02 suite');
  context.assertIncludes(runner, "id: 'rmt-ui-maximality-owned-surface-gate-hygiene'", 'Runner registers WP-RMO-02 suite');

  context.assert(metadata && metadata.schema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-02');
  context.assert(metadata && metadata.status === 'accepted-with-owner-handoff', 'Package metadata records owner handoff status');
  context.assert(metadata && metadata.report === REPORT_PATH, 'Package metadata exposes report path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixtures path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.docsPublicQualityFailureCount === 19, 'Package metadata records docs-public-quality failure count');
  assertArrayIncludesAll(context, metadata && metadata.closedResiduals, CLOSED_RESIDUALS, 'Package metadata closed residuals');
  assertArrayIncludesAll(context, metadata && metadata.ownerHandoffs, OWNER_HANDOFFS, 'Package metadata owner handoffs');
  assertArrayIncludesAll(context, metadata && metadata.nextWorkpackages, ['WP-RMO-03', 'WP-RMO-04'], 'Package metadata next workpackages');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      closedResiduals: CLOSED_RESIDUALS.length,
      ownerHandoffs: OWNER_HANDOFFS.length,
      docsPublicQualityFailureCount: 19,
      passedGates: PASSED_GATES,
      nextWorkpackages: ['WP-RMO-03', 'WP-RMO-04']
    }
  });
}

function printRmtUiMaximalityOwnedSurfaceGateHygieneReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT UI Maximality Owned Surface Gate Hygiene erfolgreich.',
    failureTitle: 'RMT UI Maximality Owned Surface Gate Hygiene fehlgeschlagen:'
  });
}

module.exports = {
  printRmtUiMaximalityOwnedSurfaceGateHygieneReport,
  runRmtUiMaximalityOwnedSurfaceGateHygieneSuite
};
