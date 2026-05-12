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
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  DEGRADATION_CAPABILITY_MISSING_CODE,
  DEGRADATION_EVENT_RESTRICTED_CODE,
  DEGRADATION_FALLBACK_MISSING_CODE,
  DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE,
  DEGRADATION_STATES,
  DEGRADATION_SURFACE_BLOCKED_CODE,
  DEGRADATION_VERSION_MISMATCH_CODE,
  RMT_VNEXT_DEGRADATION_CONTRACT_PATH,
  RMT_VNEXT_DEGRADATION_MODULE_PATH,
  RMT_VNEXT_DEGRADATION_PACKAGE_SCRIPT,
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  RMT_VNEXT_DEGRADATION_SUITE_PATH,
  RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
  RMT_VNEXT_DEGRADATION_WORKPACKAGE,
  RMT_VNEXT_DEGRADATION_WP_PATH,
  createDegradationReport,
  createRmtVNextDegradationAdapter,
  satisfiesRange,
  serializeDegradationReport
} = require('../../tools/rmt-language/vnext-degradation');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const ENTERPRISE_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const LOCAL_SURFACES_FIXTURE = 'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const DEGRADATION_FIXTURE = 'tests/rmt-language/fixtures/vnext-degradation-policy-fixture.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(result) {
  return (result.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function createEnterpriseRegistryFromFixtures(rootDir) {
  const fixture = readJson(ENTERPRISE_FIXTURE, rootDir);
  const localCompile = compileFixture(LOCAL_SURFACES_FIXTURE, rootDir);
  const remoteManifest = readJson(REMOTE_MANIFEST_FIXTURE, rootDir);
  return createEnterpriseSurfaceRegistry({
    ...fixture,
    coreDocument: localCompile.coreDocument,
    remoteManifests: [remoteManifest]
  });
}

function createReportFromFixtures(rootDir, overrides = {}) {
  const fixture = {
    ...readJson(DEGRADATION_FIXTURE, rootDir),
    ...overrides
  };
  return createDegradationReport({
    ...fixture,
    enterpriseRegistry: overrides.enterpriseRegistry || createEnterpriseRegistryFromFixtures(rootDir)
  });
}

function findSurface(report, name) {
  return report.surfaces.find((surface) => surface.name === name);
}

function runRmtVNextDegradationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-degradation',
    label: 'Epic 16 RMT vNext Degradation Policy Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextDegradation;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_DEGRADATION_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_DEGRADATION_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_DEGRADATION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_DEGRADATION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_DEGRADATION_MODULE_PATH, rootDir, 'degradation module exists');
  assertFileExists(context, RMT_VNEXT_DEGRADATION_SUITE_PATH, rootDir, 'degradation suite exists');
  assertFileExists(context, RMT_VNEXT_DEGRADATION_CONTRACT_PATH, rootDir, 'degradation contract exists');
  assertFileExists(context, RMT_VNEXT_DEGRADATION_WP_PATH, rootDir, 'WP-E16-04 workpackage document exists');
  assertFileExists(context, DEGRADATION_FIXTURE, rootDir, 'degradation fixture exists');
  context.assert(moduleSyntax.ok, `degradation module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `degradation suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_DEGRADATION_POLICY_SCHEMA, 'package metadata declares degradation policy schema');
  context.assert(metadata && metadata.degradationSurfaceSchema === RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA, 'package metadata declares degradation surface schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'package metadata declares degradation report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_DEGRADATION_WORKPACKAGE, 'package metadata points to WP-E16-04');
  context.assert(metadata && metadata.module === RMT_VNEXT_DEGRADATION_MODULE_PATH, 'package metadata points to degradation module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_DEGRADATION_SUITE_PATH, 'package metadata points to degradation suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_DEGRADATION_CONTRACT_PATH, 'package metadata points to degradation contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-degradation --json', 'package metadata declares degradation local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_DEGRADATION_PACKAGE_SCRIPT, 'package metadata declares degradation package script');
  context.assert(packageManifest.exports['./rmt-language/vnext-degradation'] === './tools/rmt-language/vnext-degradation.js', 'package exports vNext degradation contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-degradation'] === 'node scripts/run_xtend_tests.js rmt-vnext-degradation', 'package exposes vNext degradation script');
  context.assert(runner.includes("id: 'rmt-vnext-degradation'"), 'test runner exposes rmt-vnext-degradation suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js rmt-vnext-degradation'), 'runner help references degradation gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-04` | P1 | completed | WS2 |'), 'Epic marks WP-E16-04 completed');
  context.assert(epic.includes('| `WP-E16-05` | P1 | completed | WS2 |'), 'Epic marks WP-E16-05 completed');
  context.assert(epic.includes('| `WP-E16-06` | P1 | completed | WS3 |'), 'Epic marks WP-E16-06 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-degradation-policy.v1"'), 'contract document declares degradation schema');
  context.assert(workpackage.includes('WP-E16-04` ist abgeschlossen'), 'workpackage records handoff completion');

  assertIncludesAll(context, DEGRADATION_STATES, ['full', 'compatible', 'degraded', 'blocked'], 'degradation state model');
  context.assert(satisfiesRange('2.4.3', '^2.4.0') === true, 'caret range accepts compatible version');
  context.assert(satisfiesRange('3.0.0', '^2.4.0') === false, 'caret range rejects next major');
  context.assert(satisfiesRange('1.5.0', '>=1.4.0') === true, 'minimum range accepts newer shell');

  const enterpriseRegistry = createEnterpriseRegistryFromFixtures(rootDir);
  context.assert(enterpriseRegistry.ok === true, 'enterprise registry fixture is ready');
  const compatibleReport = createReportFromFixtures(rootDir, { enterpriseRegistry });
  context.assert(compatibleReport.schema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'degradation report emits report schema');
  context.assert(compatibleReport.policySchema === RMT_VNEXT_DEGRADATION_POLICY_SCHEMA, 'degradation report records policy schema');
  context.assert(compatibleReport.degradationSurfaceSchema === RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA, 'degradation report records surface schema');
  context.assert(compatibleReport.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'degradation report records enterprise registry schema');
  context.assert(compatibleReport.workpackage === RMT_VNEXT_DEGRADATION_WORKPACKAGE, 'degradation report records WP-E16-04');
  context.assert(compatibleReport.ok === true && compatibleReport.status === 'compatible', 'missing optional capability yields compatible report');
  context.assert(compatibleReport.surfaceCount === 7, 'degradation report includes all enterprise surfaces');
  context.assert(compatibleReport.stateCounts.compatible === 1, 'one surface is compatible');
  context.assert(compatibleReport.stateCounts.full === 6, 'six surfaces are full');
  const compatibleCheckout = findSurface(compatibleReport, 'checkout.cart');
  context.assert(compatibleCheckout && compatibleCheckout.state === 'compatible', 'checkout is compatible when optional capability is missing');
  context.assert(compatibleCheckout && compatibleCheckout.capabilities.missingOptional.includes('data.prefetch'), 'compatible checkout records missing optional capability');

  const fullReport = createReportFromFixtures(rootDir, {
    enterpriseRegistry,
    availableCapabilities: ['surface.mount', 'event.emit', 'event.consume', 'data.prefetch']
  });
  context.assert(fullReport.status === 'full' && fullReport.stateCounts.full === 7, 'all capabilities yield full report');

  const versionMismatchRegistry = cloneJson(enterpriseRegistry);
  versionMismatchRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').version.active = '3.0.0';
  const degradedReport = createReportFromFixtures(rootDir, { enterpriseRegistry: versionMismatchRegistry });
  const degradedCheckout = findSurface(degradedReport, 'checkout.cart');
  context.assert(degradedReport.ok === true && degradedReport.status === 'degraded', 'version mismatch with fallback yields degraded report');
  context.assert(degradedCheckout && degradedCheckout.state === 'degraded', 'checkout is degraded for version mismatch');
  context.assert(diagnosticCodes(degradedReport).includes(DEGRADATION_VERSION_MISMATCH_CODE), 'version mismatch diagnostic is emitted');
  context.assert(degradedCheckout.diagnostics.some((diagnostic) => diagnostic.code === DEGRADATION_VERSION_MISMATCH_CODE && diagnostic.severity === 'error'), 'version mismatch is not hidden as warning');
  context.assert(diagnosticCodes(degradedReport).includes(DEGRADATION_EVENT_RESTRICTED_CODE), 'degraded event restriction diagnostic is emitted');
  context.assert(degradedCheckout.events.blocked.includes('user.session.changed.v1'), 'degraded checkout blocks unlisted event');

  const missingCapabilityReport = createReportFromFixtures(rootDir, {
    enterpriseRegistry,
    availableCapabilities: ['surface.mount']
  });
  context.assert(missingCapabilityReport.status === 'degraded', 'missing required capability yields degraded report');
  context.assert(diagnosticCodes(missingCapabilityReport).includes(DEGRADATION_CAPABILITY_MISSING_CODE), 'missing required capability diagnostic is emitted');

  const oldShellReport = createReportFromFixtures(rootDir, {
    enterpriseRegistry,
    shellVersion: '1.0.0'
  });
  context.assert(oldShellReport.status === 'degraded', 'unsupported shell version yields degraded report');
  context.assert(diagnosticCodes(oldShellReport).includes(DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE), 'unsupported shell diagnostic is emitted');

  const missingFallbackRegistry = cloneJson(enterpriseRegistry);
  missingFallbackRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').fallback = null;
  const missingFallbackPolicies = cloneJson(readJson(DEGRADATION_FIXTURE, rootDir).policies);
  delete missingFallbackPolicies['checkout.cart'].fallback;
  const blockedReport = createReportFromFixtures(rootDir, {
    enterpriseRegistry: missingFallbackRegistry,
    policies: missingFallbackPolicies
  });
  context.assert(blockedReport.ok === false && blockedReport.status === 'blocked', 'remote surface without fallback is blocked');
  context.assert(diagnosticCodes(blockedReport).includes(DEGRADATION_FALLBACK_MISSING_CODE), 'missing fallback diagnostic is emitted');

  const blockedRegistry = cloneJson(enterpriseRegistry);
  blockedRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').status = 'blocked';
  const registryBlockedReport = createReportFromFixtures(rootDir, { enterpriseRegistry: blockedRegistry });
  context.assert(registryBlockedReport.status === 'blocked', 'already blocked registry surface stays blocked');
  context.assert(diagnosticCodes(registryBlockedReport).includes(DEGRADATION_SURFACE_BLOCKED_CODE), 'registry blocked diagnostic is emitted');

  const serialized = serializeDegradationReport(compatibleReport);
  const repeat = serializeDegradationReport(createReportFromFixtures(rootDir, { enterpriseRegistry }));
  context.assert(serialized === repeat, 'degradation report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'serialized degradation report is parseable JSON');

  const adapter = createRmtVNextDegradationAdapter();
  context.assert(adapter.schema === RMT_VNEXT_DEGRADATION_POLICY_SCHEMA, 'adapter exposes degradation policy schema');
  context.assert(adapter.reportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'adapter exposes degradation report schema');
  context.assert(adapter.degradationSurfaceSchema === RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA, 'adapter exposes degradation surface schema');
  context.assert(adapter.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'adapter exposes enterprise registry schema');
  context.assert(adapter.createReport({
    ...readJson(DEGRADATION_FIXTURE, rootDir),
    enterpriseRegistry
  }).status === 'compatible', 'adapter creates degradation report');

  return context.result({
    schema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    policySchema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    degradationSurfaceSchema: RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_DEGRADATION_WORKPACKAGE,
    module: RMT_VNEXT_DEGRADATION_MODULE_PATH,
    suite: RMT_VNEXT_DEGRADATION_SUITE_PATH,
    stateCount: DEGRADATION_STATES.length
  });
}

function printRmtVNextDegradationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Degradation Policy Contract erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Degradation Policy Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextDegradationReport,
  runRmtVNextDegradationSuite
};
