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
  XTENSIONS_HOST_CONTROLLER_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  XTENSIONS_MARACA_MANIFEST_SCHEMA
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  XTENSIONS_STATIC_CONTRACT_SCHEMA
} = require('../../tools/xtensions/static-contract-introspection');
const {
  RUNTIME_CAPABILITY_MISSING_CODE,
  RUNTIME_FALLBACK_MISSING_CODE,
  RUNTIME_FRAMEWORK_DEPENDENCY_CODE,
  RUNTIME_GLOBAL_REGISTRY_FORBIDDEN_CODE,
  RUNTIME_INTEGRITY_MISSING_CODE,
  RUNTIME_LOAD_STATUSES,
  RUNTIME_PEER_MISSING_CODE,
  RUNTIME_REGISTRY_BOUNDARIES,
  RUNTIME_VERSION_INCOMPATIBLE_CODE,
  XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA,
  XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_CONTRACT_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_PACKAGE_SCRIPT,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SUITE_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_TYPES_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
  XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA,
  XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA,
  XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA,
  assertRuntimeCapabilityDependencyBoundary,
  createXTensionsRuntimeCapabilityRegistry,
  createXTensionsRuntimeReport,
  negotiateRuntimeCapabilities,
  normalizeRuntimeAdapterRecord,
  normalizeRuntimeHostCapabilities,
  resolveAdapterLoadingPolicy,
  serializeRuntimeCapabilityRegistryReport,
  versionSatisfies
} = require('../../tools/xtensions/runtime-capability-registry');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';
const MARACA_CONTRACT_PATH = 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';
const STATIC_INTROSPECTION_CONTRACT_PATH = 'development/XTensions-Static-Contract-Introspection-Contract.md';

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
    return `2026-06-20T04:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function decisionById(report, xtensionId) {
  return report.decisions.find((decision) => decision.xtensionId === xtensionId) || null;
}

function runXTensionsRuntimeCapabilityRegistrySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-runtime-capability-registry',
    label: 'XTensions Runtime Capability Registry and Loading Policy Contract'
  });

  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsRuntimeCapabilityRegistry;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const maracaContract = readText(MARACA_CONTRACT_PATH, rootDir);
  const staticContract = readText(STATIC_INTROSPECTION_CONTRACT_PATH, rootDir);
  const runtimeContract = readText(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, MARACA_CONTRACT_PATH, rootDir, 'XTensions Maraca contract exists');
  assertFileExists(context, STATIC_INTROSPECTION_CONTRACT_PATH, rootDir, 'XTensions static introspection contract exists');
  assertFileExists(context, XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_CONTRACT_PATH, rootDir, 'XTensions runtime capability registry contract exists');
  assertFileExists(context, XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH, rootDir, 'XTensions runtime capability registry module exists');
  assertFileExists(context, XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_TYPES_PATH, rootDir, 'XTensions runtime capability registry types exist');
  assertFileExists(context, XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SUITE_PATH, rootDir, 'XTensions runtime capability registry suite exists');
  assertFileExists(context, XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH, rootDir, 'XTensions runtime capability registry fixture exists');
  context.assert(moduleSyntax.ok, `XTensions runtime capability registry module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions runtime capability registry suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata declares runtime capability registry schema');
  context.assert(metadata && metadata.hostCapabilitiesSchema === XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA, 'package metadata declares host capabilities schema');
  context.assert(metadata && metadata.adapterRecordSchema === XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA, 'package metadata declares adapter record schema');
  context.assert(metadata && metadata.loadingPolicySchema === XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA, 'package metadata declares loading policy schema');
  context.assert(metadata && metadata.negotiationSchema === XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA, 'package metadata declares negotiation schema');
  context.assert(metadata && metadata.loadDecisionSchema === XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA, 'package metadata declares load decision schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata declares runtime report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.maracaManifestSchema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata links Maraca manifest schema');
  context.assert(metadata && metadata.staticContractSchema === XTENSIONS_STATIC_CONTRACT_SCHEMA, 'package metadata links static contract schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE, 'package metadata points to XTN-05');
  context.assert(metadata && metadata.module === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH, 'package metadata points to runtime capability registry module');
  context.assert(metadata && metadata.types === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_TYPES_PATH, 'package metadata points to runtime capability registry types');
  context.assert(metadata && metadata.fixture === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH, 'package metadata points to runtime capability registry fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_CONTRACT_PATH, 'package metadata points to runtime capability registry contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-runtime-capability-registry --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.hostLocalRegistryOnly === true, 'package metadata keeps registry host-local');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids runtime execution during policy resolution');

  const exportEntry = packageManifest.exports['./xtensions/runtime-capability-registry'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/runtime-capability-registry.js', 'package exports runtime capability registry module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/runtime-capability-registry.d.ts', 'package exports runtime capability registry types');
  context.assert(packageManifest.scripts['test:xtensions-runtime-capability-registry'] === 'node scripts/run_xtend_tests.js xtensions-runtime-capability-registry', 'package exposes runtime capability registry script');
  context.assert(runner.hasSuite("xtensions-runtime-capability-registry"), 'test runner exposes xtensions-runtime-capability-registry suite');
  context.assert(runner.hasSuite("xtensions-runtime-capability-registry"), 'runner help references runtime capability registry gate');

  context.assert(backlog.includes('| `XTN-05` | P1 | completed | WS5 |'), 'backlog marks XTN-05 completed');
  context.assert(backlog.includes('development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md'), 'backlog references runtime capability registry contract');
  context.assert(architectureContract.includes('orchestration targets, not XTend dependencies'), 'architecture contract keeps framework dependency boundary');
  context.assert(hostControllerContract.includes('HostController'), 'HostController contract remains linked');
  context.assert(maracaContract.includes('createMaracaXTensionsBundleReport()'), 'Maraca contract remains linked');
  context.assert(staticContract.includes('XTENSION_CONTRACT'), 'Static contract remains linked');
  context.assert(runtimeContract.includes('host-lokale Registry'), 'runtime contract documents host-local registry');
  context.assert(runtimeContract.includes('node scripts/run_xtend_tests.js xtensions-runtime-capability-registry --json'), 'runtime contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.runtime-capability-registry.fixture.v1', 'fixture declares runtime capability registry fixture schema');
  context.assert(fixture.expectedHostId === 'xtend-app-shell.host', 'fixture names expected host');
  assertIncludesAll(context, fixture.expectedStatuses, ['loaded', 'degraded', 'skipped'], 'fixture names expected load statuses');

  const dependencyBoundary = assertRuntimeCapabilityDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  });
  context.assert(dependencyBoundary.ok, `runtime capability registry sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependencyBoundary = assertRuntimeCapabilityDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(
    badDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === RUNTIME_FRAMEWORK_DEPENDENCY_CODE),
    'runtime capability registry dependency guard rejects framework imports'
  );

  const host = normalizeRuntimeHostCapabilities(fixture.host);
  context.assert(host.schema === XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA, 'host capabilities emit schema');
  context.assert(host.hostId === fixture.expectedHostId, 'host capabilities keep host id');
  context.assert(host.scope === 'host-local' && host.globalRegistry === false, 'host capabilities stay host-local');
  context.assert(host.loadingPolicy.allowGlobalRegistry === false, 'host loading policy forbids global registry');
  assertIncludesAll(context, host.capabilities, ['host.lifecycle.mount', 'signal.downstream', 'loading.dynamic-import'], 'host capabilities keep required Fabric and loading capabilities');

  const registry = createXTensionsRuntimeCapabilityRegistry(fixture, { clock: createClock() });
  context.assert(registry.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'runtime capability registry emits schema');
  context.assert(registry.ok === true && registry.status === 'ready', 'runtime capability registry is ready');
  context.assert(registry.scope === 'host-local' && registry.globalRegistry === false, 'runtime capability registry is host-local');
  context.assert(registry.adapterCount === 3, 'runtime capability registry contains fixture adapters');
  context.assert(registry.indexes.byFramework.react.includes('xtension.react.todo'), 'runtime capability registry indexes React data');
  context.assert(typeof registry.registryFingerprint === 'string' && registry.registryFingerprint.startsWith('sha256:'), 'runtime capability registry emits stable fingerprint');
  assertIncludesAll(context, RUNTIME_REGISTRY_BOUNDARIES, ['host-local-registry-only', 'no-second-global-surface-registry'], 'runtime registry boundaries include host-local rules');
  assertIncludesAll(context, RUNTIME_LOAD_STATUSES, ['loaded', 'skipped', 'failed', 'degraded', 'policy-blocked'], 'runtime load statuses include report states');

  const reactAdapter = registry.adapters.find((adapter) => adapter.xtensionId === 'xtension.react.todo');
  const vueAdapter = registry.adapters.find((adapter) => adapter.xtensionId === 'xtension.vue.panel');
  const chartAdapter = registry.adapters.find((adapter) => adapter.xtensionId === 'xtension.chart.preview');
  context.assert(reactAdapter && reactAdapter.schema === XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA, 'React adapter normalizes to runtime adapter record');
  context.assert(vueAdapter && vueAdapter.schema === XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA, 'Vue adapter normalizes to runtime adapter record');
  context.assert(chartAdapter && chartAdapter.status === 'disabled', 'Chart adapter keeps disabled status for skip policy');

  const reactNegotiation = negotiateRuntimeCapabilities(reactAdapter, host);
  context.assert(reactNegotiation.schema === XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA, 'React negotiation emits schema');
  context.assert(reactNegotiation.ok === true && reactNegotiation.status === 'ready', 'React negotiation is ready');

  const vueNegotiation = negotiateRuntimeCapabilities(vueAdapter, host);
  context.assert(vueNegotiation.ok === true && vueNegotiation.status === 'degraded', 'Vue negotiation degrades missing peer with fallback');
  context.assert(diagnosticCodes(vueNegotiation).includes(RUNTIME_PEER_MISSING_CODE), 'Vue negotiation emits missing peer diagnostic');

  const missingCapability = cloneJson(reactAdapter);
  missingCapability.requiredHostCapabilities.push('fabric.lane.nonexistent');
  const missingCapabilityNegotiation = negotiateRuntimeCapabilities(missingCapability, host);
  context.assert(missingCapabilityNegotiation.ok === false, 'missing host capability blocks negotiation');
  context.assert(diagnosticCodes(missingCapabilityNegotiation).includes(RUNTIME_CAPABILITY_MISSING_CODE), 'missing capability diagnostic is emitted');

  const reactDecision = resolveAdapterLoadingPolicy(reactAdapter, host, fixture.requests[0], { clock: createClock() });
  context.assert(reactDecision.schema === XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA, 'React load decision emits schema');
  context.assert(reactDecision.ok === true && reactDecision.status === 'loaded', 'React adapter load decision is loaded');
  context.assert(reactDecision.dynamicImportAllowed === true, 'React dynamic import is policy-allowed after integrity and negotiation');
  context.assert(reactDecision.runtimeExecutionRequired === false, 'React load decision records no runtime execution during policy resolution');

  const repeatDecision = resolveAdapterLoadingPolicy(reactAdapter, host, fixture.requests[0], { clock: createClock() });
  context.assert(reactDecision.loadToken === repeatDecision.loadToken, 'adapter loading decision is idempotent for same host, adapter and surface');

  const vueDecision = resolveAdapterLoadingPolicy(vueAdapter, host, fixture.requests[1], { clock: createClock() });
  context.assert(vueDecision.ok === true && vueDecision.status === 'degraded', 'Vue adapter degrades when peer runtime is missing');
  context.assert(vueDecision.fallback && vueDecision.fallback.mode === 'native-placeholder', 'Vue degraded decision carries native fallback');

  const chartDecision = resolveAdapterLoadingPolicy(chartAdapter, host, fixture.requests[2], { clock: createClock() });
  context.assert(chartDecision.ok === true && chartDecision.status === 'skipped', 'disabled Chart adapter is skipped without shell failure');

  const noIntegrity = cloneJson(reactAdapter);
  noIntegrity.integrity.sha256 = '';
  const noIntegrityDecision = resolveAdapterLoadingPolicy(noIntegrity, host, fixture.requests[0], { clock: createClock() });
  context.assert(noIntegrityDecision.ok === false && noIntegrityDecision.status === 'failed', 'missing integrity fails dynamic adapter loading');
  context.assert(diagnosticCodes(noIntegrityDecision).includes(RUNTIME_INTEGRITY_MISSING_CODE), 'missing integrity diagnostic is emitted');

  const noFallback = cloneJson(vueAdapter);
  noFallback.fallback.message = '';
  const noFallbackDecision = resolveAdapterLoadingPolicy(noFallback, host, fixture.requests[1], { clock: createClock() });
  context.assert(noFallbackDecision.ok === false && noFallbackDecision.status === 'failed', 'missing fallback fails degraded loading');
  context.assert(diagnosticCodes(noFallbackDecision).includes(RUNTIME_FALLBACK_MISSING_CODE), 'missing fallback diagnostic is emitted');

  const globalAdapter = cloneJson(reactAdapter);
  globalAdapter.globalRegistry = true;
  const globalDecision = resolveAdapterLoadingPolicy(globalAdapter, host, fixture.requests[0], { clock: createClock() });
  context.assert(globalDecision.status === 'policy-blocked', 'global adapter registry is policy-blocked');
  context.assert(diagnosticCodes(globalDecision).includes(RUNTIME_GLOBAL_REGISTRY_FORBIDDEN_CODE), 'global registry diagnostic is emitted');

  const vendoredAdapter = normalizeRuntimeAdapterRecord({
    ...cloneJson(reactAdapter),
    dependencies: [
      {
        name: 'react',
        versionRange: '^18.0.0',
        classification: 'vendored',
        bundled: true,
        packageIncluded: true
      }
    ]
  });
  const vendoredNegotiation = negotiateRuntimeCapabilities(vendoredAdapter, host);
  context.assert(vendoredNegotiation.ok === false, 'vendored framework dependency blocks negotiation');
  context.assert(diagnosticCodes(vendoredNegotiation).includes(RUNTIME_FRAMEWORK_DEPENDENCY_CODE), 'vendored framework diagnostic is emitted');

  const versionMismatch = cloneJson(reactAdapter);
  versionMismatch.dependencies[0].versionRange = '^19.0.0';
  const versionDecision = resolveAdapterLoadingPolicy(versionMismatch, host, fixture.requests[0], { clock: createClock() });
  context.assert(versionDecision.status === 'degraded', 'peer version mismatch degrades when fallback exists');
  context.assert(diagnosticCodes(versionDecision).includes(RUNTIME_VERSION_INCOMPATIBLE_CODE), 'version mismatch diagnostic is emitted');
  context.assert(versionSatisfies('18.3.1', '^18.0.0') === true, 'versionSatisfies accepts compatible caret range');
  context.assert(versionSatisfies('18.3.1', '^19.0.0') === false, 'versionSatisfies rejects incompatible caret range');

  const report = createXTensionsRuntimeReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'runtime report emits schema');
  context.assert(report.ok === true && report.status === 'degraded', 'runtime report degrades without app shell block');
  context.assert(report.appShellBlocked === false, 'missing framework runtime does not block whole app shell');
  context.assert(report.loadedCount === 1, 'runtime report counts loaded adapter');
  context.assert(report.degradedCount === 1, 'runtime report counts degraded adapter');
  context.assert(report.skippedCount === 1, 'runtime report counts skipped adapter');
  context.assert(report.failedCount === 0, 'runtime report has no failed adapters for valid fixture');
  context.assert(decisionById(report, 'xtension.vue.panel').fallback.mode === 'native-placeholder', 'runtime report carries degraded fallback row');

  const missingAdapterReport = createXTensionsRuntimeReport({
    host: fixture.host,
    adapters: fixture.adapters,
    requests: [{ xtensionId: 'xtension.missing', surfaceId: 'surface.missing' }]
  }, { clock: createClock() });
  context.assert(missingAdapterReport.ok === false && missingAdapterReport.status === 'blocked', 'missing adapter blocks only the requested load report');

  const serialized = serializeRuntimeCapabilityRegistryReport(report);
  const repeat = serializeRuntimeCapabilityRegistryReport(createXTensionsRuntimeReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'runtime capability registry report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'serialized runtime capability registry report is parseable JSON');

  return context.result({
    schema: XTENSIONS_RUNTIME_REPORT_SCHEMA,
    registrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
    module: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH,
    suite: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SUITE_PATH,
    fixture: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH,
    adapterCount: registry.adapterCount,
    loadedCount: report.loadedCount,
    degradedCount: report.degradedCount,
    skippedCount: report.skippedCount
  });
}

function printXTensionsRuntimeCapabilityRegistryReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Runtime Capability Registry and Loading Policy Contract erfolgreich.',
    failureTitle: 'XTensions Runtime Capability Registry and Loading Policy Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsRuntimeCapabilityRegistryReport,
  runXTensionsRuntimeCapabilityRegistrySuite
};
