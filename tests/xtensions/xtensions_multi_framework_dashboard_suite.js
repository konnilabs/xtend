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
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA
} = require('../../tools/xtensions/runtime-capability-registry');
const {
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
  XTENSIONS_SECURITY_REPORT_SCHEMA
} = require('../../tools/xtensions/security-integrity-gate');
const {
  XTENSIONS_CHART_UPDATE_RECORD_SCHEMA,
  XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA
} = require('../../tools/xtensions/imperative-host-pocs');
const {
  XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA
} = require('../../tools/xtensions/vue-host-controller-poc');
const {
  XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA
} = require('../../tools/xtensions/react-host-controller-poc');
const {
  XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA,
  XTENSIONS_THREE_FRAME_RECORD_SCHEMA
} = require('../../tools/xtensions/three-render-loop-poc');
const {
  DASHBOARD_BOUNDARIES,
  DASHBOARD_BROWSER_SMOKE_KINDS,
  DASHBOARD_EVENT_FLOW_STAGES,
  DASHBOARD_EVENT_FLOW_TARGET_MISSING_CODE,
  DASHBOARD_FRAMEWORK_DEPENDENCY_CODE,
  DASHBOARD_NETWORK_REQUIRED_CODE,
  DASHBOARD_SMOKE_BLANK_CODE,
  DASHBOARD_SURFACE_ROLES,
  XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA,
  XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA,
  XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA,
  XTENSIONS_DASHBOARD_REPORT_SCHEMA,
  XTENSIONS_DASHBOARD_SURFACE_SCHEMA,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_PACKAGE_SCRIPT,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
  assertMultiFrameworkDashboardDependencyBoundary,
  createDashboardBrowserSmokeRecord,
  createDashboardEventFlow,
  createXTensionsMultiFrameworkDashboardReport,
  normalizeSurface,
  serializeMultiFrameworkDashboardReport
} = require('../../tools/xtensions/multi-framework-dashboard-fixture');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const SECURITY_CONTRACT_PATH = 'development/XTensions-Security-CSP-Supply-Chain-Integrity-Gates-Contract.md';
const RUNTIME_CONTRACT_PATH = 'development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md';
const SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';

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
    return `2026-06-20T10:00:${String(tick).padStart(2, '0')}Z`;
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

function runXTensionsMultiFrameworkDashboardSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-multi-framework-dashboard',
    label: 'XTensions Multi-Framework Dashboard Fixture and Browser Smokes Contract'
  });

  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsMultiFrameworkDashboardFixture;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const securityContract = readText(SECURITY_CONTRACT_PATH, rootDir);
  const runtimeContract = readText(RUNTIME_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const dashboardContract = readText(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, SECURITY_CONTRACT_PATH, rootDir, 'XTensions security contract exists');
  assertFileExists(context, RUNTIME_CONTRACT_PATH, rootDir, 'XTensions runtime contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH, rootDir, 'XTensions dashboard contract exists');
  assertFileExists(context, XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH, rootDir, 'XTensions dashboard module exists');
  assertFileExists(context, XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH, rootDir, 'XTensions dashboard types exist');
  assertFileExists(context, XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH, rootDir, 'XTensions dashboard suite exists');
  assertFileExists(context, XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH, rootDir, 'XTensions dashboard fixture exists');
  context.assert(moduleSyntax.ok, `XTensions dashboard module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions dashboard suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA, 'package metadata declares dashboard schema');
  context.assert(metadata && metadata.surfaceSchema === XTENSIONS_DASHBOARD_SURFACE_SCHEMA, 'package metadata declares dashboard surface schema');
  context.assert(metadata && metadata.eventFlowSchema === XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA, 'package metadata declares dashboard event flow schema');
  context.assert(metadata && metadata.browserSmokeSchema === XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA, 'package metadata declares dashboard browser smoke schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_DASHBOARD_REPORT_SCHEMA, 'package metadata declares dashboard report schema');
  context.assert(metadata && metadata.diagnosticSchema === XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA, 'package metadata declares dashboard diagnostic schema');
  context.assert(metadata && metadata.signalBridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'package metadata links Signal Bridge schema');
  context.assert(metadata && metadata.kernelSignalSchema === XTENSIONS_KERNEL_SIGNAL_SCHEMA, 'package metadata links KernelSignal schema');
  context.assert(metadata && metadata.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'package metadata links SurfaceEvent schema');
  context.assert(metadata && metadata.maracaManifestSchema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata links Maraca manifest schema');
  context.assert(metadata && metadata.maracaBuildPlanSchema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA, 'package metadata links Maraca build plan schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.runtimeReportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata links runtime report schema');
  context.assert(metadata && metadata.securityGateSchema === XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA, 'package metadata links security gate schema');
  context.assert(metadata && metadata.securityReportSchema === XTENSIONS_SECURITY_REPORT_SCHEMA, 'package metadata links security report schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE, 'package metadata points to XTN-12');
  context.assert(metadata && metadata.module === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH, 'package metadata points to dashboard module');
  context.assert(metadata && metadata.types === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH, 'package metadata points to dashboard types');
  context.assert(metadata && metadata.fixture === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH, 'package metadata points to dashboard fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH, 'package metadata points to dashboard suite');
  context.assert(metadata && metadata.contract === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH, 'package metadata points to dashboard contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-multi-framework-dashboard --json', 'package metadata declares dashboard local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_PACKAGE_SCRIPT, 'package metadata declares dashboard package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');
  context.assert(metadata && metadata.localNetworkRequired === false, 'package metadata keeps dashboard offline');

  const exportEntry = packageManifest.exports['./xtensions/multi-framework-dashboard-fixture'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/multi-framework-dashboard-fixture.js', 'package exports XTensions dashboard module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/multi-framework-dashboard-fixture.d.ts', 'package exports XTensions dashboard types');
  context.assert(packageManifest.scripts['test:xtensions-multi-framework-dashboard'] === 'node scripts/run_xtend_tests.js xtensions-multi-framework-dashboard', 'package exposes dashboard test script');
  context.assert(runner.hasSuite("xtensions-multi-framework-dashboard"), 'test runner exposes xtensions-multi-framework-dashboard suite');
  context.assert(runner.hasSuite("xtensions-multi-framework-dashboard"), 'runner help references dashboard gate');

  context.assert(backlog.includes('| `XTN-12` | P2 | completed | WS11 |'), 'backlog marks XTN-12 completed');
  context.assert(backlog.includes('development/XTensions-Multi-Framework-Dashboard-Fixture-and-Browser-Smokes-Contract.md'), 'backlog references dashboard contract');
  context.assert(architectureContract.includes('orchestration targets, not XTend dependencies'), 'architecture contract keeps framework dependency boundary');
  context.assert(securityContract.includes('Framework-Runtimes muessen `peer` oder `optional` bleiben'), 'security contract keeps peer dependency boundary');
  context.assert(runtimeContract.includes('missing-framework-runtime-degrades-not-shell-blocks'), 'runtime contract keeps degraded-shell boundary');
  context.assert(signalBridgeContract.includes('no-implicit-global-framework-event-bus'), 'Signal Bridge contract keeps no global framework event bus boundary');
  context.assert(dashboardContract.includes('Local Gate: `node scripts/run_xtend_tests.js xtensions-multi-framework-dashboard --json`'), 'dashboard contract declares local gate');
  context.assert(dashboardContract.includes('Direkte Framework-zu-Framework-Kopplung ist nicht erlaubt'), 'dashboard contract documents Fabric-mediated event flow');

  context.assert(fixture.schema === 'xtend.xtensions.multi-framework-dashboard.fixture.v1', 'fixture declares dashboard fixture schema');
  context.assert(fixture.expectedDashboardId === 'xtension.dashboard.multi-framework', 'fixture names expected dashboard id');
  context.assert(fixture.expectedStatus === 'degraded', 'fixture names expected degraded status');
  assertIncludesAll(context, fixture.expectedSurfaceRoles, DASHBOARD_SURFACE_ROLES, 'fixture covers all required dashboard surface roles');
  assertIncludesAll(context, fixture.expectedFrameworks, ['native', 'react', 'vue', 'chart.js', 'leaflet', 'three'], 'fixture covers all framework classes');
  context.assert(dependencySectionCount(packageManifest) === 0, 'root package keeps dependency sections empty');

  const dependencyBoundary = assertMultiFrameworkDashboardDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${dashboardContract}`
  });
  context.assert(dependencyBoundary.ok, `dashboard sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependency = assertMultiFrameworkDashboardDependencyBoundary({
    sourceText: "import React from 'react'; import L from 'leaflet';"
  });
  context.assert(
    badDependency.diagnostics.some((diagnostic) => diagnostic.code === DASHBOARD_FRAMEWORK_DEPENDENCY_CODE),
    'dashboard dependency guard rejects framework imports'
  );

  const nativeSurface = normalizeSurface(fixture.dashboard.surfaces[0], {
    dashboardId: fixture.expectedDashboardId,
    hostId: fixture.dashboard.host.hostId,
    clock: createClock()
  });
  context.assert(nativeSurface.schema === XTENSIONS_DASHBOARD_SURFACE_SCHEMA, 'dashboard surface normalizes with schema');
  context.assert(nativeSurface.nativeSurface === true && nativeSurface.framework === 'native', 'native shell surface stays native');

  const report = createXTensionsMultiFrameworkDashboardReport({
    ...fixture,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  }, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_DASHBOARD_REPORT_SCHEMA, 'dashboard report emits schema');
  context.assert(report.dashboardSchema === XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA, 'dashboard report links dashboard schema');
  context.assert(report.ok === true && report.status === fixture.expectedStatus, 'dashboard fixture report is degraded but accepted');
  context.assert(report.appShellResponsive === true && report.appShellBlocked === false, 'dashboard shell remains responsive when one XTension degrades');
  context.assert(report.frameworkCodeRequired === false && report.runtimeExecutionRequired === false, 'dashboard fixture executes no framework runtime');
  context.assert(report.localNetworkRequired === false, 'dashboard fixture requires no network');
  context.assert(report.summary.surfaceCount === 6, 'dashboard report counts six surfaces');
  context.assert(report.summary.xtensionSurfaceCount === 5 && report.summary.nativeSurfaceCount === 1, 'dashboard report separates XTension and native surfaces');
  context.assert(report.summary.manifestCount === 5, 'dashboard report contains five XTension manifests');
  context.assert(report.summary.loadedSurfaceCount === 4 && report.summary.degradedSurfaceCount === 1, 'dashboard runtime degrades exactly one surface');
  context.assert(report.summary.errorCount === 0, 'dashboard accepted report has no blocking errors');
  assertIncludesAll(context, report.summary.frameworks, fixture.expectedFrameworks, 'dashboard report summarizes framework classes');
  assertIncludesAll(context, report.boundaries, DASHBOARD_BOUNDARIES, 'dashboard report exposes boundaries');

  context.assert(report.maracaPlan.schema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA && report.maracaPlan.ok === true, 'dashboard report embeds ready Maraca build plan');
  context.assert(report.maracaPlan.artifactCount === 5, 'Maraca build plan contains five dashboard XTension artifacts');
  context.assert(report.securityReport.schema === XTENSIONS_SECURITY_REPORT_SCHEMA && report.securityReport.ok === true, 'dashboard report embeds passing security gate');
  context.assert(report.runtimeReport.schema === XTENSIONS_RUNTIME_REPORT_SCHEMA && report.runtimeReport.status === 'degraded', 'dashboard report embeds degraded runtime report');
  context.assert(report.runtimeReport.failedCount === 0 && report.runtimeReport.appShellBlocked === false, 'runtime report degrades without blocking shell');

  const flow = report.eventFlows[0];
  context.assert(flow.schema === XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA, 'dashboard event flow emits schema');
  context.assert(flow.status === 'degraded' && flow.degradedCount === 1, 'dashboard event flow records degraded Vue target');
  context.assert(flow.deliveredCount === 2, 'dashboard event flow delivers chart and React updates');
  assertIncludesAll(context, flow.stages, DASHBOARD_EVENT_FLOW_STAGES, 'dashboard event flow exposes stages');
  assertIncludesAll(context, flow.targetRoles, fixture.expectedEventFlow.targetRoles, 'dashboard event flow targets chart, React and Vue');
  context.assert(flow.mapEvent && flow.mapEvent.schema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'dashboard event flow includes Fabric SurfaceEvent');
  context.assert(flow.leafletRecord && flow.leafletRecord.schema === XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA, 'dashboard event flow includes Leaflet normalized event');
  context.assert(flow.targetSignals.length === 3 && flow.targetSignals.every((signal) => signal.schema === XTENSIONS_KERNEL_SIGNAL_SCHEMA), 'dashboard event flow emits KernelSignals for targets');
  context.assert(flow.adapterRecords.some((record) => record.schema === XTENSIONS_CHART_UPDATE_RECORD_SCHEMA), 'dashboard event flow includes Chart update record');
  context.assert(flow.adapterRecords.some((record) => record.schema === XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA), 'dashboard event flow includes React scheduling hint');
  context.assert(flow.adapterRecords.some((record) => record.schema === XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA), 'dashboard event flow includes Vue explicit update adapter');
  context.assert(flow.targetStatuses.some((target) => target.framework === 'vue' && target.fallbackVisible === true), 'dashboard flow keeps Vue fallback visible when degraded');

  assertIncludesAll(context, report.browserSmokeRecords.map((record) => record.kind), DASHBOARD_BROWSER_SMOKE_KINDS, 'dashboard smoke records cover required smoke kinds');
  context.assert(report.browserSmokeRecords.every((record) => record.schema === XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA), 'dashboard smoke records use dashboard smoke schema');
  context.assert(report.browserSmokeRecords.every((record) => record.browserRuntimeRequired === false && record.frameworkRuntimeImported === false), 'dashboard smoke records stay frameworkless');
  context.assert(report.browserSmokeRecords.some((record) => record.kind === 'canvas-pixel' && record.nonBlankPixels > 0), 'dashboard canvas smoke has nonblank pixels');
  context.assert(report.browserSmokeRecords.some((record) => record.kind === 'webgl-pixel' && record.nonBlankPixels > 0), 'dashboard WebGL smoke has nonblank pixels');
  context.assert(report.browserSmokeRecords.some((record) => record.kind === 'teardown' && record.cleanupVerified === true), 'dashboard teardown smoke verifies cleanup');
  context.assert(report.threeSmokeRecords.some((record) => record.schema === XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA && record.ok === true), 'dashboard projects WebGL smoke into Three smoke evidence');
  context.assert(report.threeFrameRecords.some((record) => record.schema === XTENSIONS_THREE_FRAME_RECORD_SCHEMA && record.status === 'rendered'), 'dashboard includes rendered Three frame probe');

  const blankSmoke = createDashboardBrowserSmokeRecord({
    kind: 'webgl-pixel',
    framework: 'three',
    nonBlankPixels: 0,
    cleanupVerified: true
  }, { dashboardId: fixture.expectedDashboardId, clock: createClock() });
  context.assert(blankSmoke.ok === false && diagnosticCodes(blankSmoke).includes(DASHBOARD_SMOKE_BLANK_CODE), 'blank WebGL smoke is diagnosed');

  const missingTargetFlow = createDashboardEventFlow({
    targets: ['missing-panel'],
    selection: { regionId: 'region-north' }
  }, report.surfaces, {
    dashboardId: fixture.expectedDashboardId,
    runtimeStatuses: {},
    clock: createClock()
  });
  context.assert(missingTargetFlow.ok === false && diagnosticCodes(missingTargetFlow).includes(DASHBOARD_EVENT_FLOW_TARGET_MISSING_CODE), 'missing dashboard flow target is diagnosed');

  const networkFixture = cloneJson(fixture);
  networkFixture.dashboard.localNetworkRequired = true;
  const networkReport = createXTensionsMultiFrameworkDashboardReport(networkFixture, { clock: createClock() });
  context.assert(networkReport.ok === false && diagnosticCodes(networkReport).includes(DASHBOARD_NETWORK_REQUIRED_CODE), 'network-required dashboard fixture is blocked');

  const serialized = serializeMultiFrameworkDashboardReport(report);
  const repeat = serializeMultiFrameworkDashboardReport(createXTensionsMultiFrameworkDashboardReport({
    ...fixture,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  }, { clock: createClock() }));
  context.assert(serialized === repeat, 'dashboard report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_DASHBOARD_REPORT_SCHEMA, 'serialized dashboard report is parseable JSON');
  context.assert(!serialized.includes('https://'), 'serialized dashboard fixture contains no CDN or remote URL');
  context.assert(!serialized.includes('node_modules'), 'serialized dashboard fixture contains no vendored module path');

  return context.result({
    schema: XTENSIONS_DASHBOARD_REPORT_SCHEMA,
    dashboardSchema: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA,
    workpackage: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
    module: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH,
    suite: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH,
    fixture: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH,
    surfaceCount: report.summary.surfaceCount,
    browserSmokeCount: report.summary.browserSmokeCount,
    degradedSurfaceCount: report.summary.degradedSurfaceCount,
    diagnosticCount: report.summary.diagnosticCount
  });
}

function printXTensionsMultiFrameworkDashboardReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Multi-Framework Dashboard Fixture and Browser Smokes Contract erfolgreich.',
    failureTitle: 'XTensions Multi-Framework Dashboard Fixture and Browser Smokes Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsMultiFrameworkDashboardReport,
  runXTensionsMultiFrameworkDashboardSuite
};
