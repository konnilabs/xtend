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
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA
} = require('../../tools/xtensions/runtime-capability-registry');
const {
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  VUE_POC_BOUNDARIES,
  VUE_POC_EVENT_PAYLOAD_INVALID_CODE,
  VUE_POC_FRAMEWORK_DEPENDENCY_CODE,
  VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE,
  VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  VUE_POC_PROXY_LEAK_CODE,
  VUE_POC_STORE_LEAK_CODE,
  VUE_UPDATE_ADAPTER_KINDS,
  XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA,
  XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_CONTRACT_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_PACKAGE_SCRIPT,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_SUITE_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_TYPES_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
  XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA,
  XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
  applyVueExplicitUpdateAdapter,
  assertVuePocDependencyBoundary,
  createFrameworklessVueHostControllerPoc,
  createVueHostControllerPocContract,
  createVueHostControllerPocReport,
  createVueRuntimeAdapterRecord,
  createVueUpdateAdapterRecord,
  inspectVuePayloadBoundary,
  normalizeVueSurfaceEvent,
  serializeVueHostControllerPocReport
} = require('../../tools/xtensions/vue-host-controller-poc');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';
const SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';
const RUNTIME_REGISTRY_CONTRACT_PATH = 'development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md';

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
    return `2026-06-20T06:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runXTensionsVueHostControllerPocSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-vue-host-controller-poc',
    label: 'XTensions Vue HostController PoC and Explicit Update Adapter Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsVueHostControllerPoc;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const runtimeRegistryContract = readText(RUNTIME_REGISTRY_CONTRACT_PATH, rootDir);
  const vueContract = readText(XTENSIONS_VUE_HOST_CONTROLLER_POC_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_VUE_HOST_CONTROLLER_POC_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_VUE_HOST_CONTROLLER_POC_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, RUNTIME_REGISTRY_CONTRACT_PATH, rootDir, 'XTensions runtime registry contract exists');
  assertFileExists(context, XTENSIONS_VUE_HOST_CONTROLLER_POC_CONTRACT_PATH, rootDir, 'XTensions Vue HostController PoC contract exists');
  assertFileExists(context, XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH, rootDir, 'XTensions Vue HostController PoC module exists');
  assertFileExists(context, XTENSIONS_VUE_HOST_CONTROLLER_POC_TYPES_PATH, rootDir, 'XTensions Vue HostController PoC types exist');
  assertFileExists(context, XTENSIONS_VUE_HOST_CONTROLLER_POC_SUITE_PATH, rootDir, 'XTensions Vue HostController PoC suite exists');
  assertFileExists(context, XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH, rootDir, 'XTensions Vue HostController PoC fixture exists');
  context.assert(moduleSyntax.ok, `XTensions Vue HostController PoC module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions Vue HostController PoC suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA, 'package metadata declares Vue HostController PoC schema');
  context.assert(metadata && metadata.contractSchema === XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA, 'package metadata declares Vue HostController contract schema');
  context.assert(metadata && metadata.updateAdapterRecordSchema === XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA, 'package metadata declares Vue update adapter record schema');
  context.assert(metadata && metadata.eventRecordSchema === XTENSIONS_VUE_EVENT_RECORD_SCHEMA, 'package metadata declares Vue event record schema');
  context.assert(metadata && metadata.boundaryRecordSchema === XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA, 'package metadata declares Vue boundary record schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA, 'package metadata declares Vue report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'package metadata links Surface Event schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.runtimeReportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata links runtime report schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE, 'package metadata points to XTN-07');
  context.assert(metadata && metadata.module === XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH, 'package metadata points to Vue PoC module');
  context.assert(metadata && metadata.types === XTENSIONS_VUE_HOST_CONTROLLER_POC_TYPES_PATH, 'package metadata points to Vue PoC types');
  context.assert(metadata && metadata.fixture === XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH, 'package metadata points to Vue PoC fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_VUE_HOST_CONTROLLER_POC_CONTRACT_PATH, 'package metadata points to Vue PoC contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_VUE_HOST_CONTROLLER_POC_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids Vue runtime execution');
  context.assert(metadata && metadata.peerHarness === 'external-opt-in', 'package metadata marks external opt-in peer harness');
  context.assert(metadata && metadata.updateAdapter === 'explicit-only', 'package metadata requires explicit update adapter');

  const exportEntry = packageManifest.exports['./xtensions/vue-host-controller-poc'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/vue-host-controller-poc.js', 'package exports Vue HostController PoC module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/vue-host-controller-poc.d.ts', 'package exports Vue HostController PoC types');
  context.assert(packageManifest.scripts['test:xtensions-vue-host-controller-poc'] === 'node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc', 'package exposes Vue HostController PoC script');
  context.assert(runner.includes("id: 'xtensions-vue-host-controller-poc'"), 'test runner exposes xtensions-vue-host-controller-poc suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc'), 'runner help references Vue HostController PoC gate');

  context.assert(backlog.includes('| `XTN-07` | P1/P2 | completed | WS6 |'), 'backlog marks XTN-07 completed');
  context.assert(backlog.includes('development/XTensions-Vue-HostController-PoC-and-Explicit-Update-Adapter-Contract.md'), 'backlog references Vue HostController PoC contract');
  context.assert(architectureContract.includes('keine fremden Proxy-/Store-Objekte uebergeben'), 'architecture contract keeps Vue proxy/store boundary');
  context.assert(hostControllerContract.includes('createFrameworklessHostControllerStub()'), 'HostController contract remains linked');
  context.assert(signalBridgeContract.includes('SurfaceEvent'), 'Signal Bridge contract remains linked');
  context.assert(runtimeRegistryContract.includes('external-peer'), 'Runtime registry contract keeps peer dependency classification');
  context.assert(vueContract.includes('Vue `globalProperties.$patch` ist kein XTensions-Vertrag'), 'Vue contract rejects globalProperties patch as contract');
  context.assert(vueContract.includes('node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc --json'), 'Vue contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.vue-host-controller-poc.fixture.v1', 'fixture declares Vue HostController PoC fixture schema');
  context.assert(fixture.expectedXtensionId === 'xtension.vue.panel', 'fixture names expected XTension id');
  context.assert(fixture.expectedFramework === 'vue', 'fixture names Vue framework');
  assertIncludesAll(context, fixture.expectedUpdateAdapters, VUE_UPDATE_ADAPTER_KINDS, 'fixture names all expected update adapters');

  const dependencyBoundary = assertVuePocDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  });
  context.assert(dependencyBoundary.ok, `Vue HostController PoC sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependencyBoundary = assertVuePocDependencyBoundary({
    sourceText: "import { createApp } from 'vue';"
  });
  context.assert(
    badDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === VUE_POC_FRAMEWORK_DEPENDENCY_CODE),
    'Vue HostController PoC dependency guard rejects Vue imports'
  );

  const contract = createVueHostControllerPocContract(fixture.contract);
  context.assert(contract.schema === XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA, 'Vue PoC contract emits schema');
  context.assert(contract.framework === 'vue', 'Vue PoC contract names Vue as data');
  context.assert(contract.peerMode === 'external-opt-in-peer-harness', 'Vue PoC contract keeps peer harness external');
  context.assert(contract.frameworkDependenciesAllowed === false, 'Vue PoC contract blocks framework dependencies');
  assertIncludesAll(context, contract.updateAdapters, VUE_UPDATE_ADAPTER_KINDS, 'Vue PoC contract exposes update adapters');
  assertIncludesAll(context, contract.boundaries, VUE_POC_BOUNDARIES, 'Vue PoC contract exposes boundaries');

  const adapter = createVueRuntimeAdapterRecord({
    ...fixture.adapter,
    contract: fixture.contract,
    xtensionId: fixture.expectedXtensionId
  });
  context.assert(adapter.framework === 'vue', 'Vue runtime adapter record names Vue as data');
  context.assert(adapter.dependencies.every((dependency) => dependency.classification === 'external-peer'), 'Vue runtime adapter dependencies stay external-peer');
  context.assert(adapter.dependencies.every((dependency) => dependency.bundled === false && dependency.packageIncluded === false), 'Vue runtime adapter dependencies are not bundled or packaged');
  context.assert(adapter.requiredHostCapabilities.includes('vue.explicit-update-adapter'), 'Vue runtime adapter requires explicit update adapter capability');

  const propsRecord = createVueUpdateAdapterRecord('applyPropsUpdate', { title: 'Inbox' }, { clock: createClock() });
  context.assert(propsRecord.schema === XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA, 'Vue props update adapter record emits schema');
  context.assert(propsRecord.ok === true && propsRecord.adapterFunction === 'applyPropsUpdate', 'Vue props update adapter is accepted');
  const statePatch = applyVueExplicitUpdateAdapter({ props: {}, localState: {} }, {
    updateAdapter: 'applyStatePatch',
    payload: { selectedId: 'alpha' }
  }, { clock: createClock() });
  context.assert(statePatch.ok === true && statePatch.state.localState.selectedId === 'alpha', 'Vue explicit state patch updates local state');
  const commandDispatch = applyVueExplicitUpdateAdapter({ props: {}, localState: {} }, {
    updateAdapter: 'dispatchCommand',
    payload: { command: 'focus-item', id: 'alpha' }
  }, { clock: createClock() });
  context.assert(commandDispatch.ok === true && commandDispatch.state.lastCommand.command === 'focus-item', 'Vue explicit command dispatch records command');
  const missingAdapter = applyVueExplicitUpdateAdapter({}, {
    payload: { title: 'No adapter' }
  }, { clock: createClock() });
  context.assert(missingAdapter.ok === false, 'Vue update without explicit adapter is blocked');
  context.assert(diagnosticCodes(missingAdapter).includes(VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE), 'missing explicit adapter diagnostic is emitted');

  const safePayload = inspectVuePayloadBoundary({ items: ['alpha'], state: { selected: true } });
  context.assert(safePayload.ok === true && safePayload.proxyBoundary === 'internal-only', 'safe Vue payload stays serializable and proxy-internal');
  const proxyLeak = inspectVuePayloadBoundary({ __v_isReactive: true, value: 'proxy' });
  context.assert(proxyLeak.ok === false && diagnosticCodes(proxyLeak).includes(VUE_POC_PROXY_LEAK_CODE), 'Vue proxy leak is diagnosed');
  const storeLeak = inspectVuePayloadBoundary({ piniaStore: { state: {} } });
  context.assert(storeLeak.ok === false && diagnosticCodes(storeLeak).includes(VUE_POC_STORE_LEAK_CODE), 'Vue store leak is diagnosed');
  const patchLeak = inspectVuePayloadBoundary({ globalProperties: { $patch: true } });
  context.assert(patchLeak.ok === false && diagnosticCodes(patchLeak).includes(VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE), 'Vue globalProperties patch leak is diagnosed');
  const functionLeak = inspectVuePayloadBoundary({ onClick() {} });
  context.assert(functionLeak.ok === false && diagnosticCodes(functionLeak).includes(VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE), 'non-serializable Vue payload is diagnosed');

  const normalizedEvent = normalizeVueSurfaceEvent({
    name: 'xtension.vue.panel.changed.v1',
    lane: 'fabric.default',
    payload: { selectedId: 'alpha' }
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(normalizedEvent.schema === XTENSIONS_VUE_EVENT_RECORD_SCHEMA, 'Vue event normalization emits schema');
  context.assert(normalizedEvent.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'Vue event normalization links SurfaceEvent schema');
  context.assert(normalizedEvent.ok === true && normalizedEvent.direction === 'upstream', 'Vue event normalization creates upstream event');
  const badEvent = normalizeVueSurfaceEvent({
    name: 'xtension.vue.panel.changed.v1',
    payload: { onClick() {} }
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(badEvent.ok === false && diagnosticCodes(badEvent).includes(VUE_POC_EVENT_PAYLOAD_INVALID_CODE), 'Vue event normalization diagnoses bad payload');

  const hostController = createFrameworklessVueHostControllerPoc({
    xtensionId: fixture.expectedXtensionId,
    hostId: 'vue-poc-test-host',
    surfaceId: 'surface.vue.panel',
    clock: createClock()
  });
  const mount = hostController.mount({ id: 'vue-poc-container' }, { title: 'Inbox' });
  context.assert(mount.status === 'ok', 'Vue frameworkless HostController PoC mounts');
  context.assert(mount.metadata.updateAdapter === 'explicit', 'Vue mount records explicit update adapter mode');
  const propsUpdate = hostController.update({
    updateAdapter: 'applyPropsUpdate',
    payload: { title: 'Inbox', items: ['alpha', 'beta'] }
  });
  context.assert(propsUpdate.status === 'ok' && propsUpdate.metadata.updateRecord.kind === 'applyPropsUpdate', 'Vue props update uses explicit adapter');
  const localPatch = hostController.update({
    updateAdapter: 'applyStatePatch',
    payload: { selectedId: 'beta' }
  });
  context.assert(localPatch.status === 'ok' && localPatch.metadata.state.localState.selectedId === 'beta', 'Vue state patch stays host-internal');
  const commandUpdate = hostController.update({
    updateAdapter: 'dispatchCommand',
    payload: { command: 'focus-item', id: 'beta' }
  });
  context.assert(commandUpdate.status === 'ok' && commandUpdate.metadata.state.lastCommand.command === 'focus-item', 'Vue command update stays serializable');
  const emitted = hostController.emit({
    name: 'xtension.vue.panel.changed.v1',
    payload: { selectedId: 'beta' }
  });
  context.assert(emitted.ok === true && emitted.owner === fixture.expectedXtensionId, 'Vue emitted event is owner-normalized');
  const leakUpdate = hostController.update({
    updateAdapter: 'applyStatePatch',
    payload: { __v_raw: { selectedId: 'beta' } }
  });
  context.assert(leakUpdate.status === 'failed', 'Vue proxy leak fails update');
  context.assert(diagnosticCodes(leakUpdate).includes(VUE_POC_PROXY_LEAK_CODE), 'Vue proxy leak diagnostic is emitted on update');
  const implicitPatchUpdate = hostController.update({
    payload: { title: 'No adapter' }
  });
  context.assert(implicitPatchUpdate.status === 'failed', 'Vue implicit patch update fails');
  context.assert(diagnosticCodes(implicitPatchUpdate).includes(VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE), 'Vue implicit patch diagnostic is emitted on update');
  const unmount = hostController.unmount('suite-complete');
  context.assert(unmount.status === 'ok', 'Vue frameworkless HostController PoC unmounts');
  context.assert(unmount.cleanupRecords.length >= 5, 'Vue frameworkless HostController PoC releases cleanup resources');
  const unmountAgain = hostController.unmount('suite-complete-repeat');
  context.assert(unmountAgain.status === 'skipped', 'Vue frameworkless HostController PoC unmount is idempotent');
  const snapshot = hostController.snapshot();
  context.assert(snapshot.vueProxyExternalized === false, 'Vue proxy remains host-internal in snapshot');
  context.assert(snapshot.globalPropertiesPatchUsed === false, 'Vue globalProperties patch is never used');
  context.assert(hostController.getUpdateRecords().length >= 5, 'Vue frameworkless HostController PoC exposes update records');
  context.assert(hostController.getEventRecords().length >= 1, 'Vue frameworkless HostController PoC exposes event records');
  context.assert(hostController.getCleanupRecords().length >= 5, 'Vue frameworkless HostController PoC exposes cleanup records');

  const report = createVueHostControllerPocReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA, 'Vue PoC report emits schema');
  context.assert(report.ok === true && report.status === 'ready', 'Vue PoC fixture report is ready');
  context.assert(report.runtimeExecutionRequired === false && report.vueRuntimeImported === false, 'Vue PoC report requires no Vue runtime import');
  context.assert(report.globalPropertiesPatchUsed === false, 'Vue PoC report never uses globalProperties patch');
  context.assert(report.runtimeReport.status === 'ready', 'Vue PoC runtime report is ready with external peer available');
  context.assert(report.runtimeRegistry.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'Vue PoC report embeds runtime registry');
  context.assert(report.updateRecords.some((record) => record.kind === 'applyPropsUpdate'), 'Vue PoC report includes props update record');
  context.assert(report.updateRecords.some((record) => record.kind === 'applyStatePatch'), 'Vue PoC report includes state patch record');
  context.assert(report.updateRecords.some((record) => record.kind === 'dispatchCommand'), 'Vue PoC report includes command dispatch record');
  context.assert(report.eventRecords.some((record) => record.name === 'xtension.vue.panel.changed.v1'), 'Vue PoC report includes normalized event record');
  context.assert(report.cleanupRecords.length > 0, 'Vue PoC report includes cleanup records');

  const serialized = serializeVueHostControllerPocReport(report);
  const repeat = serializeVueHostControllerPocReport(createVueHostControllerPocReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'Vue HostController PoC report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA, 'serialized Vue HostController PoC report is parseable JSON');

  return context.result({
    schema: XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA,
    pocSchema: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    module: XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH,
    suite: XTENSIONS_VUE_HOST_CONTROLLER_POC_SUITE_PATH,
    fixture: XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH,
    updateRecordCount: report.updateRecords.length,
    eventRecordCount: report.eventRecords.length,
    cleanupCount: report.cleanupRecords.length
  });
}

function printXTensionsVueHostControllerPocReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Vue HostController PoC and Explicit Update Adapter Contract erfolgreich.',
    failureTitle: 'XTensions Vue HostController PoC and Explicit Update Adapter Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsVueHostControllerPocReport,
  runXTensionsVueHostControllerPocSuite
};
