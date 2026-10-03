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
const {
  EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
  EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
  EPIC14_RMT_TOOLING_CONTRACT,
  EPIC14_RMT_TOOLING_DOCS,
  EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA,
  EPIC14_RMT_TOOLING_LOCAL_GATE,
  EPIC14_RMT_TOOLING_MODULE,
  EPIC14_RMT_TOOLING_PACKAGE_SCRIPT,
  EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT,
  EPIC14_RMT_TOOLING_PR_SCRIPT,
  EPIC14_RMT_TOOLING_REPORT_SCHEMA,
  EPIC14_RMT_TOOLING_SCHEMA,
  EPIC14_RMT_TOOLING_STATUS,
  EPIC14_RMT_TOOLING_SUITE,
  EPIC14_RMT_TOOLING_WORKPACKAGE,
  EPIC14_RMT_TOOLING_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  RMT_KERNEL_POLICY_PARITY_LOCAL_GATE,
  RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
  RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES,
  RMT_KERNEL_POLICY_PARITY_SCHEMA,
  RMT_TOOLING_EXPORTS,
  RMT_TOOLING_OPTIONAL_PR_SUITE_IDS,
  RMT_TOOLING_SUITE_IDS,
  createEpic14RmtToolingGatePlan,
  createEpic14RmtToolingGateReport,
  validateEpic14RmtToolingGatePlan
} = require('../../catalog/epic14-rmt-tooling');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const REFERENCE_REGISTRY_PATH = 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md';
const SCAFFOLD_CONFIG_PATH = 'xtend-builder/scaffold.config.js';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runPlanChecks(context, plan, report) {
  const validation = validateEpic14RmtToolingGatePlan(plan);

  context.assert(plan.schema === EPIC14_RMT_TOOLING_SCHEMA, 'Gate plan exposes Epic 14 RMT tooling schema');
  context.assert(plan.gateRecordSchema === EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA, 'Gate plan exposes gate record schema');
  context.assert(plan.reportSchema === EPIC14_RMT_TOOLING_REPORT_SCHEMA, 'Gate plan exposes report schema');
  context.assert(plan.workpackage === EPIC14_RMT_TOOLING_WORKPACKAGE, 'Gate plan belongs to WP-E14-15');
  context.assert(plan.status === EPIC14_RMT_TOOLING_STATUS, 'Gate plan is accepted');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Gate plan keeps kernel boundary');
  context.assert(plan.networkRequired === false, 'Gate plan stays network-free');
  context.assert(validation.schema === EPIC14_RMT_TOOLING_REPORT_SCHEMA, 'Validator emits report schema');
  context.assert(validation.ok === true, 'Gate plan validates');
  context.assert(report.ok === true, 'Gate report passes');
  context.assert(report.localGate === EPIC14_RMT_TOOLING_LOCAL_GATE, 'Gate report exposes local gate');
  context.assert(report.policyParity && report.policyParity.reportSchema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'Gate report exposes Policy Parity report schema');
  context.assert(report.policyParity && report.policyParity.requiredFactories.includes('commitTrustedHtml'), 'Gate report exposes Policy Parity required factories');
  context.assert(plan.localGate === EPIC14_RMT_TOOLING_LOCAL_GATE, 'Gate plan exposes local gate');
  context.assert(plan.packageScript === EPIC14_RMT_TOOLING_PACKAGE_SCRIPT, 'Gate plan exposes package script');
  context.assert(plan.bundleScript === EPIC14_RMT_TOOLING_BUNDLE_SCRIPT, 'Gate plan exposes bundled RMT tooling script');
  context.assert(plan.bundleReportScript === EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT, 'Gate plan exposes bundled report script');
  context.assert(plan.optionalPrCommand === EPIC14_RMT_TOOLING_PR_SCRIPT, 'Gate plan exposes optional PR command');
  context.assert(plan.optionalPrReportCommand === EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT, 'Gate plan exposes optional PR report command');
  context.assert(plan.ciHandoff.defaultReleaseGate === 'npm test', 'Gate plan keeps full release default as npm test');
  context.assert(plan.summary.gateCount === 4, 'Gate plan exposes four handoff records including Policy Parity');
  context.assert(plan.policyParity && plan.policyParity.schema === RMT_KERNEL_POLICY_PARITY_SCHEMA, 'Gate plan exposes Policy Parity schema');
  context.assert(plan.policyParity && plan.policyParity.reportSchema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'Gate plan exposes Policy Parity report schema');
  context.assert(plan.policyParity && plan.policyParity.ok === true && plan.policyParity.driftCount === 0, 'Gate plan requires zero Policy Parity drift');
  assertArrayIncludesAll(context, plan.policyParity && plan.policyParity.requiredFactories, RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES, 'Gate plan Policy Parity factories');

  assertArrayIncludesAll(context, plan.primarySuiteIds, RMT_TOOLING_SUITE_IDS, 'Release RMT tooling suites');
  assertArrayIncludesAll(context, plan.optionalPrSuiteIds, RMT_TOOLING_OPTIONAL_PR_SUITE_IDS, 'Optional PR RMT tooling suites');
  assertArrayIncludesAll(context, plan.exportSurface, RMT_TOOLING_EXPORTS, 'RMT tooling export surface');
  assertArrayIncludesAll(context, plan.requiredPackageScripts, [
    'test:rmt-linter',
    'test:rmt-language-server',
    'test:rmt-tooling',
    'test:rmt-tooling:report',
    'test:rmt-ai-developer-kit',
    'test:rmt-kernel-policy-parity',
    'test:pr:rmt',
    'test:pr:rmt:report',
    'test:epic14-rmt-tooling'
  ], 'Required package scripts');

  plan.gates.forEach((gate) => {
    context.assert(gate.schema === EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA, `${gate.id} exposes gate record schema`);
    context.assert(gate.localOnly === true, `${gate.id} stays local-only`);
    context.assert(Array.isArray(gate.suiteIds), `${gate.id} declares suite ids`);
    context.assert(Array.isArray(gate.validates) && gate.validates.length > 0, `${gate.id} declares validation targets`);
    context.assert(gate.command.includes('npm run') || gate.command.includes('node scripts/run_xtend_tests.js'), `${gate.id} exposes executable command`);
  });
}

function runPackageChecks(context, rootDir, plan) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic14RmtTooling;

  context.assert((packageManifest.exports['./catalog/epic14-rmt-tooling'] === './catalog/epic14-rmt-tooling.js' || (packageManifest.exports['./catalog/epic14-rmt-tooling'] && packageManifest.exports['./catalog/epic14-rmt-tooling'].default === './catalog/epic14-rmt-tooling.js')), 'Package exports Epic 14 RMT tooling module');
  RMT_TOOLING_EXPORTS.filter((exportKey) => exportKey !== './catalog/epic14-rmt-tooling').forEach((exportKey) => {
    context.assert(Boolean(packageManifest.exports[exportKey]), `Package keeps ${exportKey} export`);
  });
  context.assert(packageManifest.scripts['test:rmt-linter'] === 'node scripts/run_xtend_tests.js rmt-linter-cli', 'Package exposes test:rmt-linter shortcut');
  context.assert(packageManifest.scripts['test:rmt-language-server'] === 'node scripts/run_xtend_tests.js rmt-language-server', 'Package exposes test:rmt-language-server script');
  context.assert(packageManifest.scripts['test:rmt-tooling'] && packageManifest.scripts['test:rmt-tooling'].includes('rmt-source-model'), 'Package exposes bundled RMT tooling script');
  context.assert(packageManifest.scripts['test:rmt-ai-developer-kit'] === 'node scripts/run_xtend_tests.js rmt-ai-developer-kit', 'Package exposes RMT AI Developer Kit script');
  context.assert(packageManifest.scripts['test:rmt-tooling'].includes('rmt-tooling-docs'), 'Bundled RMT tooling script includes docs gate');
  context.assert(packageManifest.scripts['test:rmt-kernel-policy-parity'] === 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity', 'Package exposes Kernel Policy Parity script');
  context.assert(packageManifest.scripts['test:rmt-tooling:report'] && packageManifest.scripts['test:rmt-tooling:report'].includes('.xtend-test-results/xtend-rmt-tooling-gate-report.json'), 'Package exposes RMT tooling report script');
  context.assert(packageManifest.scripts['test:pr:rmt'] && packageManifest.scripts['test:pr:rmt'].includes('rmt-linter-cli'), 'Package exposes optional PR RMT script');
  context.assert(packageManifest.scripts['test:pr:rmt:report'] && packageManifest.scripts['test:pr:rmt:report'].includes('.xtend-test-results/xtend-rmt-pr-gate-report.json'), 'Package exposes optional PR RMT report script');
  context.assert(packageManifest.scripts['test:epic14-rmt-tooling'] === 'node scripts/run_xtend_tests.js epic14-rmt-tooling', 'Package exposes Epic 14 RMT tooling suite script');
  context.assert(Array.isArray(packageManifest.xtend.releaseGates) && packageManifest.xtend.releaseGates.includes(EPIC14_RMT_TOOLING_BUNDLE_SCRIPT), 'Release gates include bundled RMT tooling script');

  context.assert(metadata && metadata.schema === EPIC14_RMT_TOOLING_SCHEMA, 'Package metadata declares Epic 14 RMT tooling schema');
  context.assert(metadata && metadata.reportSchema === EPIC14_RMT_TOOLING_REPORT_SCHEMA, 'Package metadata declares report schema');
  context.assert(metadata && metadata.gateRecordSchema === EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA, 'Package metadata declares gate record schema');
  context.assert(metadata && metadata.workpackage === EPIC14_RMT_TOOLING_WORKPACKAGE, 'Package metadata points to WP-E14-15');
  context.assert(metadata && metadata.status === EPIC14_RMT_TOOLING_STATUS, 'Package metadata exposes accepted status');
  context.assert(metadata && metadata.module === EPIC14_RMT_TOOLING_MODULE, 'Package metadata points to catalog module');
  context.assert(metadata && metadata.suite === EPIC14_RMT_TOOLING_SUITE, 'Package metadata points to suite');
  context.assert(metadata && metadata.localGate === EPIC14_RMT_TOOLING_LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === EPIC14_RMT_TOOLING_PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.policyParity && metadata.policyParity.schema === RMT_KERNEL_POLICY_PARITY_SCHEMA, 'Package metadata exposes Policy Parity schema');
  context.assert(metadata && metadata.policyParity && metadata.policyParity.localGate === RMT_KERNEL_POLICY_PARITY_LOCAL_GATE, 'Package metadata exposes Policy Parity local gate');
  assertArrayIncludesAll(context, metadata && metadata.policyParity && metadata.policyParity.requiredFactories, RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES, 'Package metadata Policy Parity factories');
  assertArrayIncludesAll(context, metadata && metadata.primarySuiteIds, plan.primarySuiteIds, 'Package metadata primary suites');
  assertArrayIncludesAll(context, metadata && metadata.optionalPrSuiteIds, plan.optionalPrSuiteIds, 'Package metadata optional PR suites');
  assertArrayIncludesAll(context, metadata && metadata.exportSurface, plan.exportSurface, 'Package metadata export surface');
  context.assert(metadata && metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps kernel boundary');
  context.assert(Array.isArray(metadata && metadata.handoff) && metadata.handoff.includes('WP-E14-16'), 'Package metadata hands off to WP-E14-16');
}

function runDocumentationChecks(context, rootDir) {
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const scaffold = readText(SCAFFOLD_CONFIG_PATH, rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const contract = readText(EPIC14_RMT_TOOLING_CONTRACT, rootDir);
  const docs = readText(EPIC14_RMT_TOOLING_DOCS, rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const workpackage = readText(EPIC14_RMT_TOOLING_WORKPACKAGE_DOC, rootDir);

  context.assert(runner.hasSuite("epic14-rmt-tooling"), 'Runner registers Epic 14 RMT tooling suite');
  context.assert(runner.hasSuite("epic14-rmt-tooling"), 'Runner help references Epic 14 RMT tooling suite');
  context.assertIncludes(scaffold, 'epic14RmtTooling', 'Scaffold config exposes Epic 14 RMT tooling metadata');
  context.assertIncludes(scaffold, EPIC14_RMT_TOOLING_SCHEMA, 'Scaffold config declares Epic 14 RMT tooling schema');
  context.assertIncludes(scaffold, EPIC14_RMT_TOOLING_BUNDLE_SCRIPT, 'Scaffold config declares bundled RMT tooling script');
  context.assertIncludes(scaffold, RMT_KERNEL_POLICY_PARITY_SCHEMA, 'Scaffold config declares Policy Parity schema');
  context.assertIncludes(scaffold, RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT, 'Scaffold config declares Policy Parity package script');
  context.assertIncludes(epic, '| `WP-E14-15` | P2 | completed | WS10 |', 'Epic marks WP-E14-15 completed');
  context.assertIncludes(epic, '| `WP-E14-16` | P2 | completed | WS11 |', 'Epic records WP-E14-16 completion after handoff');
  context.assertIncludes(architecture, 'Implementierungsstand nach `WP-E14-15`', 'Architecture documents WP-E14-15 status');
  context.assertIncludes(architecture, EPIC14_RMT_TOOLING_SCHEMA, 'Architecture documents Epic 14 RMT tooling schema');
  assertIncludesAll(context, registry, [
    EPIC14_RMT_TOOLING_MODULE,
    EPIC14_RMT_TOOLING_CONTRACT,
    EPIC14_RMT_TOOLING_SUITE,
    EPIC14_RMT_TOOLING_DOCS
  ], 'Reference registry');
  assertIncludesAll(context, contract, [
    EPIC14_RMT_TOOLING_SCHEMA,
    EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
    EPIC14_RMT_TOOLING_PR_SCRIPT,
    EPIC14_RMT_TOOLING_LOCAL_GATE,
    KERNEL_BOUNDARY
  ], 'Release gate contract');
  assertIncludesAll(context, docs, [
    EPIC14_RMT_TOOLING_SCHEMA,
    EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
    EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
    EPIC14_RMT_TOOLING_PR_SCRIPT,
    EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT,
    EPIC14_RMT_TOOLING_LOCAL_GATE,
    'xtend.maraca.production-bundle-closure.v1',
    'productionClosure',
    'kernelFeatureAdoptionClosure'
  ], 'Release gate docs');
  context.assertIncludes(docsReadme, './rmt-tooling-release-gates.md', 'Docs README links RMT tooling release gates');
  context.assertIncludes(docsMenu, 'rmt-tooling-release-gates', 'Docs menu links RMT tooling release gates');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E14-15 workpackage is completed');
  context.assertIncludes(workpackage, EPIC14_RMT_TOOLING_LOCAL_GATE, 'WP-E14-15 documents local gate');
  context.assertIncludes(workpackage, 'WP-E14-16', 'WP-E14-15 hands off to WP-E14-16');
}

function runEpic14RmtToolingReleaseGatesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic14-rmt-tooling',
    label: 'Epic 14 RMT Tooling Release Gates'
  });
  const plan = createEpic14RmtToolingGatePlan({ rootDir });
  const report = createEpic14RmtToolingGateReport({ rootDir, plan });
  const moduleSyntax = syntaxCheckFile(EPIC14_RMT_TOOLING_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC14_RMT_TOOLING_SUITE, { rootDir, extension: '.js' });

  [
    EPIC14_RMT_TOOLING_MODULE,
    EPIC14_RMT_TOOLING_SUITE,
    EPIC14_RMT_TOOLING_CONTRACT,
    EPIC14_RMT_TOOLING_WORKPACKAGE_DOC,
    EPIC14_RMT_TOOLING_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Epic 14 RMT tooling module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 14 RMT tooling suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  runPlanChecks(context, plan, report);
  runPackageChecks(context, rootDir, plan);
  runDocumentationChecks(context, rootDir);

  return context.result({
    report: {
      schema: EPIC14_RMT_TOOLING_REPORT_SCHEMA,
      workpackage: EPIC14_RMT_TOOLING_WORKPACKAGE,
      localGate: EPIC14_RMT_TOOLING_LOCAL_GATE,
      primarySuiteIds: plan.primarySuiteIds,
      optionalPrSuiteIds: plan.optionalPrSuiteIds
    }
  });
}

function printEpic14RmtToolingReleaseGatesReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Tooling Release Gates erfolgreich.',
    failureTitle: 'Epic 14 RMT Tooling Release Gates fehlgeschlagen:'
  });
}

module.exports = {
  printEpic14RmtToolingReleaseGatesReport,
  runEpic14RmtToolingReleaseGatesSuite
};
