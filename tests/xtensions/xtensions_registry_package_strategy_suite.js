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
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA
} = require('../../tools/xtensions/runtime-capability-registry');
const {
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
  XTENSIONS_SECURITY_REPORT_SCHEMA
} = require('../../tools/xtensions/security-integrity-gate');
const {
  DEFAULT_PACKAGE_STRATEGY,
  REGISTRY_ALLOWED_DISTRIBUTION_MODES,
  REGISTRY_BOUNDARIES,
  REGISTRY_COMPATIBILITY_STATUSES,
  REGISTRY_COMPATIBILITY_UNSUPPORTED_CODE,
  REGISTRY_DEPRECATION_POLICY_MISSING_CODE,
  REGISTRY_DEPRECATION_STATUSES,
  REGISTRY_DISTRIBUTION_MODES,
  REGISTRY_FRAMEWORK_DEPENDENCY_CODE,
  REGISTRY_GLOBAL_REGISTRY_FORBIDDEN_CODE,
  REGISTRY_NPM_SUBPACKAGE_DEFERRED_CODE,
  REGISTRY_OWNER_MISSING_CODE,
  REGISTRY_PACKAGE_NAME_INVALID_CODE,
  REGISTRY_PACKAGED_FRAMEWORK_CODE,
  REGISTRY_RELEASE_POLICY_INVALID_CODE,
  REGISTRY_REMOTE_DISTRIBUTION_BLOCKED_CODE,
  REGISTRY_RUNTIME_SOURCE_OF_TRUTH_CODE,
  REGISTRY_SECURITY_REVIEW_MISSING_CODE,
  XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA,
  XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA,
  XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA,
  XTENSIONS_REGISTRY_ENTRY_SCHEMA,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_PACKAGE_SCRIPT,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE,
  XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA,
  XTENSIONS_REGISTRY_REPORT_SCHEMA,
  assertRegistryPackageStrategyDependencyBoundary,
  createXTensionsRegistryPackageStrategyReport,
  normalizeCompatibilityMatrix,
  normalizeDeprecationPolicy,
  normalizePackageStrategy,
  normalizeRegistryEntry,
  serializeRegistryPackageStrategyReport
} = require('../../tools/xtensions/registry-package-strategy');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const MARACA_CONTRACT_PATH = 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';
const SECURITY_CONTRACT_PATH = 'development/XTensions-Security-CSP-Supply-Chain-Integrity-Gates-Contract.md';
const DASHBOARD_CONTRACT_PATH = 'development/XTensions-Multi-Framework-Dashboard-Fixture-and-Browser-Smokes-Contract.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-06-20T11:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function dependencySectionCount(packageManifest) {
  return [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ].reduce((count, section) => count + Object.keys(packageManifest[section] || {}).length, 0);
}

function runXTensionsRegistryPackageStrategySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-registry-package-strategy',
    label: 'XTensions Registry and Package Strategy Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtensionsRegistryPackageStrategy;
  const xtendMetadata = packageManifest.xtend && packageManifest.xtend.xtensionsRegistryPackageStrategy;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const maracaContract = readText(MARACA_CONTRACT_PATH, rootDir);
  const securityContract = readText(SECURITY_CONTRACT_PATH, rootDir);
  const dashboardContract = readText(DASHBOARD_CONTRACT_PATH, rootDir);
  const registryContract = readText(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, MARACA_CONTRACT_PATH, rootDir, 'XTensions Maraca contract exists');
  assertFileExists(context, SECURITY_CONTRACT_PATH, rootDir, 'XTensions security contract exists');
  assertFileExists(context, DASHBOARD_CONTRACT_PATH, rootDir, 'XTensions dashboard contract exists');
  assertFileExists(context, XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH, rootDir, 'XTensions registry strategy contract exists');
  assertFileExists(context, XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH, rootDir, 'XTensions registry strategy module exists');
  assertFileExists(context, XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH, rootDir, 'XTensions registry strategy types exist');
  assertFileExists(context, XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH, rootDir, 'XTensions registry strategy suite exists');
  assertFileExists(context, XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH, rootDir, 'XTensions registry strategy fixture exists');
  context.assert(moduleSyntax.ok, `XTensions registry strategy module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions registry strategy suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(!metadata, 'registry package strategy metadata is stored under package.xtend only');
  context.assert(xtendMetadata && xtendMetadata.schema === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA, 'package metadata declares registry package strategy schema');
  context.assert(xtendMetadata && xtendMetadata.entrySchema === XTENSIONS_REGISTRY_ENTRY_SCHEMA, 'package metadata declares registry entry schema');
  context.assert(xtendMetadata && xtendMetadata.compatibilityMatrixSchema === XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA, 'package metadata declares compatibility matrix schema');
  context.assert(xtendMetadata && xtendMetadata.releasePolicySchema === XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA, 'package metadata declares release policy schema');
  context.assert(xtendMetadata && xtendMetadata.deprecationPolicySchema === XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA, 'package metadata declares deprecation policy schema');
  context.assert(xtendMetadata && xtendMetadata.reportSchema === XTENSIONS_REGISTRY_REPORT_SCHEMA, 'package metadata declares registry report schema');
  context.assert(xtendMetadata && xtendMetadata.diagnosticSchema === XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA, 'package metadata declares registry diagnostic schema');
  context.assert(xtendMetadata && xtendMetadata.maracaManifestSchema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata links Maraca manifest schema');
  context.assert(xtendMetadata && xtendMetadata.maracaBuildPlanSchema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA, 'package metadata links Maraca build plan schema');
  context.assert(xtendMetadata && xtendMetadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(xtendMetadata && xtendMetadata.securityGateSchema === XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA, 'package metadata links security gate schema');
  context.assert(xtendMetadata && xtendMetadata.securityReportSchema === XTENSIONS_SECURITY_REPORT_SCHEMA, 'package metadata links security report schema');
  context.assert(xtendMetadata && xtendMetadata.workpackage === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE, 'package metadata points to XTN-13');
  context.assert(xtendMetadata && xtendMetadata.module === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH, 'package metadata points to registry strategy module');
  context.assert(xtendMetadata && xtendMetadata.types === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH, 'package metadata points to registry strategy types');
  context.assert(xtendMetadata && xtendMetadata.fixture === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH, 'package metadata points to registry strategy fixture');
  context.assert(xtendMetadata && xtendMetadata.suite === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH, 'package metadata points to registry strategy suite');
  context.assert(xtendMetadata && xtendMetadata.contract === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH, 'package metadata points to registry strategy contract');
  context.assert(xtendMetadata && xtendMetadata.localGate === 'node scripts/run_xtend_tests.js xtensions-registry-package-strategy --json', 'package metadata declares registry strategy local gate');
  context.assert(xtendMetadata && xtendMetadata.packageScript === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_PACKAGE_SCRIPT, 'package metadata declares registry strategy package script');
  context.assert(xtendMetadata && xtendMetadata.primaryDistribution === 'project-local-manifest', 'package metadata records project-local manifest decision');
  context.assert(xtendMetadata && xtendMetadata.npmSubpackages === 'reserved-deferred', 'package metadata defers npm subpackages');
  context.assert(xtendMetadata && xtendMetadata.noSecondRuntimeSourceOfTruth === true, 'package metadata blocks second runtime source of truth');
  context.assert(xtendMetadata && xtendMetadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');

  const exportEntry = packageManifest.exports['./xtensions/registry-package-strategy'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/registry-package-strategy.js', 'package exports XTensions registry strategy module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/registry-package-strategy.d.ts', 'package exports XTensions registry strategy types');
  context.assert(packageManifest.scripts['test:xtensions-registry-package-strategy'] === 'node scripts/run_xtend_tests.js xtensions-registry-package-strategy', 'package exposes registry strategy test script');
  context.assert(runner.includes("id: 'xtensions-registry-package-strategy'"), 'test runner exposes xtensions-registry-package-strategy suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-registry-package-strategy'), 'runner help references registry strategy gate');

  context.assert(backlog.includes('| `XTN-13` | P2 | completed | WS12 |'), 'backlog marks XTN-13 completed');
  context.assert(backlog.includes('development/XTensions-Registry-and-Package-Strategy-Contract.md'), 'backlog references registry strategy contract');
  context.assert(architectureContract.includes('orchestration targets, not XTend dependencies'), 'architecture contract keeps framework dependency boundary');
  context.assert(maracaContract.includes('Manifest Schema: `xtend.maraca.xtension-manifest.v1`'), 'Maraca contract remains linked');
  context.assert(securityContract.includes('Framework-Runtimes muessen `peer` oder `optional` bleiben'), 'security contract keeps peer dependency boundary');
  context.assert(dashboardContract.includes('React-, Vue-, Chart.js-, Leaflet- und Three.js-aehnlichen XTension-Surfaces'), 'dashboard contract feeds registry strategy context');
  context.assert(registryContract.includes('XTensions starten als projekt-lokale Maraca-Manifeste'), 'registry contract documents project-local decision');
  context.assert(registryContract.includes('NPM-Subpackages werden nicht automatisch erzeugt'), 'registry contract documents deferred npm packages');
  context.assert(registryContract.includes('Die Registry ist ein Index, keine Runtime-Registry'), 'registry contract blocks second runtime source of truth');
  context.assert(registryContract.includes('Local Gate: `node scripts/run_xtend_tests.js xtensions-registry-package-strategy --json`'), 'registry contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.registry-package-strategy.fixture.v1', 'fixture declares registry strategy fixture schema');
  context.assert(fixture.expectedRegistryId === 'xtensions.project-local.registry', 'fixture names expected registry id');
  context.assert(fixture.expectedStatus === 'ready', 'fixture names expected ready status');
  context.assert(fixture.expectedBlockedStatus === 'blocked', 'fixture names expected blocked status');
  context.assert(dependencySectionCount(packageManifest) === 0, 'root package keeps dependency sections empty');

  const dependencyBoundary = assertRegistryPackageStrategyDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${registryContract}`
  });
  context.assert(dependencyBoundary.ok, `registry strategy sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependency = assertRegistryPackageStrategyDependencyBoundary({
    sourceText: "const React = require('react');"
  });
  context.assert(
    badDependency.diagnostics.some((diagnostic) => diagnostic.code === REGISTRY_FRAMEWORK_DEPENDENCY_CODE),
    'registry strategy dependency guard rejects framework imports'
  );

  const strategy = normalizePackageStrategy(fixture.strategy);
  context.assert(strategy.schema === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA, 'strategy normalizes with schema');
  context.assert(strategy.primaryDistribution === 'project-local-manifest', 'strategy keeps project-local manifests as primary');
  context.assert(strategy.packageNamePattern === '@xtend/xtension-*', 'strategy reserves @xtend/xtension-* package names');
  context.assert(strategy.npmSubpackages === 'reserved-deferred', 'strategy defers npm subpackages');
  context.assert(strategy.marketplaceEntries === 'metadata-only', 'strategy keeps marketplace metadata-only');
  context.assert(strategy.registrySourceOfTruth === 'maraca-manifest', 'strategy anchors registry in Maraca manifests');
  context.assert(strategy.runtimeSourceOfTruth === 'host-local-runtime-capability-registry', 'strategy anchors runtime decisions in host-local registry');
  assertIncludesAll(context, strategy.boundaries, REGISTRY_BOUNDARIES, 'strategy exposes registry boundaries');
  assertIncludesAll(context, REGISTRY_DISTRIBUTION_MODES, ['project-local-manifest', 'npm-subpackage', 'marketplace-entry', 'remote-artifact'], 'distribution modes enumerate strategy choices');
  assertIncludesAll(context, REGISTRY_ALLOWED_DISTRIBUTION_MODES, ['project-local-manifest', 'workspace-local-adapter', 'marketplace-entry'], 'allowed modes exclude default npm and remote distribution');
  assertIncludesAll(context, REGISTRY_COMPATIBILITY_STATUSES, ['supported', 'deprecated', 'blocked'], 'compatibility statuses are gateable');
  assertIncludesAll(context, REGISTRY_DEPRECATION_STATUSES, ['active', 'deprecated', 'removed'], 'deprecation statuses are gateable');
  context.assert(DEFAULT_PACKAGE_STRATEGY.primaryDistribution === 'project-local-manifest', 'default package strategy matches accepted decision');

  const compatibility = normalizeCompatibilityMatrix(fixture.entries[0].compatibility);
  context.assert(compatibility.schema === XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA, 'compatibility matrix normalizes with schema');
  context.assert(compatibility.status === 'supported', 'compatibility matrix keeps supported status');
  const deprecation = normalizeDeprecationPolicy(fixture.entries[1].deprecation);
  context.assert(deprecation.schema === XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA, 'deprecation policy normalizes with schema');
  context.assert(deprecation.status === 'deprecated' && Boolean(deprecation.replacement), 'deprecated entry includes replacement');

  const reactEntry = normalizeRegistryEntry(fixture.entries[0], {
    registryId: fixture.expectedRegistryId,
    strategy,
    clock: createClock()
  });
  context.assert(reactEntry.schema === XTENSIONS_REGISTRY_ENTRY_SCHEMA, 'registry entry normalizes with schema');
  context.assert(reactEntry.ok === true && reactEntry.status === 'ready', 'React registry entry is ready');
  context.assert(reactEntry.packageName === '@xtend/xtension-dashboard-react-panel', 'React registry entry keeps reserved package name');
  context.assert(reactEntry.sourceOfTruth === 'maraca-manifest', 'React registry entry uses Maraca source of truth');
  context.assert(reactEntry.runtimeRegistryRef === 'host-local-runtime-capability-registry', 'React registry entry points to host-local runtime registry');
  context.assert(reactEntry.package.frameworkRuntimeIncluded === false, 'React registry entry packages no framework runtime');
  context.assert(reactEntry.marketplace.runtimeSource === 'none', 'React marketplace entry has no runtime source');

  const vueEntry = normalizeRegistryEntry(fixture.entries[1], {
    registryId: fixture.expectedRegistryId,
    strategy,
    clock: createClock()
  });
  context.assert(vueEntry.ok === true && vueEntry.status === 'deprecated', 'Vue registry entry is deprecated but gateable');
  context.assert(vueEntry.compatibility.status === 'deprecated', 'Vue compatibility status is deprecated');
  context.assert(vueEntry.deprecation.replacement === '@xtend/xtension-dashboard-native-inspector', 'Vue deprecation names replacement');

  const report = createXTensionsRegistryPackageStrategyReport({
    ...fixture,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  }, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_REGISTRY_REPORT_SCHEMA, 'registry strategy report emits schema');
  context.assert(report.ok === true && report.status === fixture.expectedStatus, 'valid registry strategy report is ready');
  context.assert(report.registryId === fixture.expectedRegistryId, 'registry report keeps registry id');
  context.assert(report.registryScope === 'project-local', 'registry report keeps project-local scope');
  context.assert(report.noSecondRuntimeSourceOfTruth === true, 'registry report blocks second runtime source of truth');
  context.assert(report.frameworkCodeRequired === false && report.runtimeExecutionRequired === false, 'registry report executes no framework code');
  context.assert(report.packageFrameworkDependenciesAllowed === false && report.vendoredFrameworksAllowed === false, 'registry report blocks packaged frameworks');
  context.assert(report.summary.entryCount === fixture.entries.length, 'registry report counts fixture entries');
  context.assert(report.summary.readyCount === 2 && report.summary.deprecatedCount === 1, 'registry report counts ready and deprecated entries');
  context.assert(report.summary.npmSubpackageCount === 0 && report.summary.remoteArtifactCount === 0, 'registry report contains no default npm or remote packages');
  context.assert(report.summary.marketplaceEntryCount === 1, 'registry report allows metadata-only marketplace entry');
  context.assert(report.summary.errorCount === 0, 'valid registry report has no blocking errors');
  assertIncludesAll(context, report.summary.frameworks, ['chart.js', 'react', 'vue'], 'registry report summarizes frameworks as metadata');
  assertIncludesAll(context, report.summary.packageNames, [
    '@xtend/xtension-dashboard-chart',
    '@xtend/xtension-dashboard-react-panel',
    '@xtend/xtension-dashboard-vue-panel'
  ], 'registry report summarizes reserved package names');
  context.assert(report.maracaPlan.schema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA && report.maracaPlan.ok === true, 'registry report embeds ready Maraca plan');
  context.assert(report.securityReport.schema === XTENSIONS_SECURITY_REPORT_SCHEMA && report.securityReport.ok === true, 'registry report embeds passing security gate');
  context.assert(typeof report.registryFingerprint === 'string' && report.registryFingerprint.startsWith('sha256:'), 'registry report emits fingerprint');

  const blockedReport = createXTensionsRegistryPackageStrategyReport({
    strategy,
    entries: fixture.blockedEntries
  }, { clock: createClock() });
  const blockedCodes = diagnosticCodes(blockedReport);
  context.assert(blockedReport.ok === false && blockedReport.status === fixture.expectedBlockedStatus, 'blocked registry strategy report is blocked');
  context.assert(blockedReport.summary.blockedCount === fixture.blockedEntries.length, 'blocked registry report counts blocked entries');
  fixture.expectedDiagnostics.forEach((code) => {
    context.assert(blockedCodes.includes(code), `${code} diagnostic is emitted`);
  });
  context.assert(blockedCodes.includes(REGISTRY_PACKAGE_NAME_INVALID_CODE), 'package name diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_OWNER_MISSING_CODE), 'owner diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_SECURITY_REVIEW_MISSING_CODE), 'security review diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_COMPATIBILITY_UNSUPPORTED_CODE), 'compatibility diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_DEPRECATION_POLICY_MISSING_CODE), 'deprecation diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_RELEASE_POLICY_INVALID_CODE), 'release diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_RUNTIME_SOURCE_OF_TRUTH_CODE), 'runtime source diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_GLOBAL_REGISTRY_FORBIDDEN_CODE), 'global registry diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_REMOTE_DISTRIBUTION_BLOCKED_CODE), 'remote distribution diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_NPM_SUBPACKAGE_DEFERRED_CODE), 'npm subpackage diagnostic constant is wired');
  context.assert(blockedCodes.includes(REGISTRY_PACKAGED_FRAMEWORK_CODE), 'packaged framework diagnostic constant is wired');

  const serialized = serializeRegistryPackageStrategyReport(report);
  const repeat = serializeRegistryPackageStrategyReport(createXTensionsRegistryPackageStrategyReport({
    ...fixture,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  }, { clock: createClock() }));
  context.assert(serialized === repeat, 'registry strategy report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_REGISTRY_REPORT_SCHEMA, 'serialized registry report is parseable JSON');
  context.assert(!serialized.includes('"dependencies":{"react"'), 'serialized registry report does not add package dependencies');
  context.assert(!serialized.includes('node_modules'), 'serialized registry report contains no vendored module path');

  return context.result({
    schema: XTENSIONS_REGISTRY_REPORT_SCHEMA,
    strategySchema: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
    workpackage: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE,
    module: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH,
    suite: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH,
    fixture: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH,
    entryCount: report.summary.entryCount,
    deprecatedCount: report.summary.deprecatedCount,
    diagnosticCount: report.summary.diagnosticCount,
    blockedDiagnosticCount: blockedReport.summary.diagnosticCount
  });
}

function printXTensionsRegistryPackageStrategyReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Registry and Package Strategy Contract erfolgreich.',
    failureTitle: 'XTensions Registry and Package Strategy Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsRegistryPackageStrategyReport,
  runXTensionsRegistryPackageStrategySuite
};
