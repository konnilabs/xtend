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
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE,
  evaluateXTensionSecurity
} = require('../../tools/xtensions/security-integrity-gate');
const {
  VUE_ADAPTER_CAPABILITIES,
  VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE,
  XTENSIONS_VUE_ADAPTER_CONTRACT_PATH,
  XTENSIONS_VUE_ADAPTER_FIXTURE_PATH,
  XTENSIONS_VUE_ADAPTER_MODULE_PATH,
  XTENSIONS_VUE_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA,
  XTENSIONS_VUE_ADAPTER_SCHEMA,
  XTENSIONS_VUE_ADAPTER_SUITE_PATH,
  XTENSIONS_VUE_ADAPTER_TYPES_PATH,
  XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
  XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
  createVueAdapterContract,
  createVueAdapterReport,
  createVueHostAdapter,
  inspectVuePayloadBoundary,
  normalizeVueRuntimeBoundary,
  serializeVueAdapterReport
} = require('../../tools/xtensions/vue-host-adapter');

const VUE_BLOCKED_RUNTIME_FIXTURE_PATH = 'tests/fixtures/xtensions/vue-host-adapter-runtime-bundled-blocked.json';
const VUE_BAD_PAYLOAD_FIXTURE_PATH = 'tests/fixtures/xtensions/vue-host-adapter-bad-payload.json';
const VUE_MISSING_RUNTIME_FIXTURE_PATH = 'tests/fixtures/xtensions/vue-host-adapter-missing-peer-runtime.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-07-08T09:20:${String(tick).padStart(2, '0')}Z`;
  };
}

function loadCommon(rootDir) {
  return {
    packageManifest: readJson('package.json', rootDir),
    runner: readText('scripts/run_xtend_tests.js', rootDir),
    contractDoc: readText(XTENSIONS_VUE_ADAPTER_CONTRACT_PATH, rootDir),
    fixture: readJson(XTENSIONS_VUE_ADAPTER_FIXTURE_PATH, rootDir),
    blockedRuntimeFixture: readJson(VUE_BLOCKED_RUNTIME_FIXTURE_PATH, rootDir),
    badPayloadFixture: readJson(VUE_BAD_PAYLOAD_FIXTURE_PATH, rootDir),
    missingRuntimeFixture: readJson(VUE_MISSING_RUNTIME_FIXTURE_PATH, rootDir),
    moduleText: readText(XTENSIONS_VUE_ADAPTER_MODULE_PATH, rootDir),
    typesText: readText(XTENSIONS_VUE_ADAPTER_TYPES_PATH, rootDir)
  };
}

function assertCommonFiles(context, rootDir) {
  [
    XTENSIONS_VUE_ADAPTER_CONTRACT_PATH,
    XTENSIONS_VUE_ADAPTER_MODULE_PATH,
    XTENSIONS_VUE_ADAPTER_TYPES_PATH,
    XTENSIONS_VUE_ADAPTER_SUITE_PATH,
    XTENSIONS_VUE_ADAPTER_FIXTURE_PATH,
    VUE_BLOCKED_RUNTIME_FIXTURE_PATH,
    VUE_BAD_PAYLOAD_FIXTURE_PATH,
    VUE_MISSING_RUNTIME_FIXTURE_PATH
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });

  const moduleSyntax = syntaxCheckFile(XTENSIONS_VUE_ADAPTER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_VUE_ADAPTER_SUITE_PATH, { rootDir, extension: '.js' });
  context.assert(moduleSyntax.ok, `Vue Host Adapter module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Vue Host Adapter suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
}

function assertPackageWiring(context, common) {
  const packageManifest = common.packageManifest;
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsVueHostAdapter;
  context.assert(metadata && metadata.schema === XTENSIONS_VUE_ADAPTER_SCHEMA, 'package metadata declares Vue adapter schema');
  context.assert(metadata && metadata.runtimeBoundarySchema === XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA, 'package metadata declares Vue runtime boundary schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_VUE_ADAPTER_WORKPACKAGE, 'package metadata points to XTN-19');
  context.assert(metadata && metadata.module === XTENSIONS_VUE_ADAPTER_MODULE_PATH, 'package metadata points to Vue adapter module');
  context.assert(metadata && metadata.types === XTENSIONS_VUE_ADAPTER_TYPES_PATH, 'package metadata points to Vue adapter types');
  context.assert(metadata && metadata.fixture === XTENSIONS_VUE_ADAPTER_FIXTURE_PATH, 'package metadata points to Vue adapter fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_VUE_ADAPTER_SUITE_PATH, 'package metadata points to Vue adapter suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-vue-host-adapter xtensions-vue-host-controller-poc --json', 'package metadata declares Vue adapter local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_VUE_ADAPTER_PACKAGE_SCRIPT, 'package metadata declares Vue adapter package script');
  context.assert(metadata && metadata.runtimeStrategy === 'external-peer-host-provided', 'package metadata declares host-provided Vue runtime strategy');

  const exportEntry = packageManifest.exports['./xtensions/vue-host-adapter'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/vue-host-adapter.js', 'package exports Vue host adapter module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/vue-host-adapter.d.ts', 'package exports Vue host adapter types');
  context.assert(packageManifest.scripts['test:xtensions-vue-host-adapter'] === 'node scripts/run_xtend_tests.js xtensions-vue-host-adapter', 'package exposes Vue host adapter test script');
  context.assert(common.runner.includes("id: 'xtensions-vue-host-adapter'"), 'runner exposes Vue host adapter suite');
  context.assert(common.contractDoc.includes('Contract: `xtend.xtensions.vue-adapter.v1`'), 'contract document declares Vue adapter schema');
  context.assert(common.contractDoc.includes('globalProperties.$patch'), 'contract document names Vue explicit update boundary');
}

function runXTensionsVueHostAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-vue-host-adapter',
    label: 'XTensions Vue Host Adapter Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);
  context.assert(fixture.schema === 'xtend.xtensions.vue-host-adapter.fixture.v1', 'fixture declares Vue host adapter fixture schema');
  context.assert(fixture.contract === XTENSIONS_VUE_ADAPTER_SCHEMA, 'fixture points to Vue adapter contract');
  context.assert(fixture.expectedFramework === 'vue', 'fixture names Vue framework');
  context.assert(!('vue' in (common.packageManifest.dependencies || {})), 'root package does not depend on Vue');

  const contract = createVueAdapterContract({ runtimeBoundary: fixture.runtimeBoundary });
  context.assert(contract.schema === XTENSIONS_VUE_ADAPTER_SCHEMA, 'contract factory exposes Vue adapter schema');
  context.assert(contract.runtimeBoundary.ok === true, 'contract factory accepts host-provided Vue runtime boundary');
  VUE_ADAPTER_CAPABILITIES.forEach((capability) => {
    context.assert(contract.capabilities.includes(capability), `contract exposes capability ${capability}`);
  });

  const adapter = createVueHostAdapter({
    id: fixture.expectedXtensionId,
    surfaceId: 'surface.vue.adapter',
    clock: createClock()
  });
  const target = { id: 'vue-suite-target' };
  const mountResult = adapter.mount(target, fixture.payload.props, {});
  const updateResult = adapter.update({
    updateAdapter: 'applyPropsUpdate',
    props: { seed: 'suite-vue-next' },
    reason: 'suite-update'
  });
  const missingUpdateAdapter = adapter.update({
    props: { seed: 'suite-vue-implicit' },
    reason: 'implicit-update'
  });
  const eventResult = adapter.emit({
    type: 'vue.fixture.ready',
    payload: { ok: true }
  });
  const errorResult = adapter.reportError(new Error('synthetic Vue adapter error'), { recoverable: true });
  const unmountResult = adapter.unmount('suite-complete');
  const snapshot = adapter.snapshot();

  context.assert(mountResult.schema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA && mountResult.ok === true, 'frameworkless Vue adapter mounts');
  context.assert(updateResult.ok === true && updateResult.lifecycleRecord.event === 'surface:updated', 'frameworkless Vue adapter updates with explicit adapter');
  context.assert(missingUpdateAdapter.status === 'failed' && missingUpdateAdapter.diagnostics.length >= 1, 'frameworkless Vue adapter blocks implicit global patch updates');
  context.assert(eventResult.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA && eventResult.ok === true, 'frameworkless Vue adapter normalizes SurfaceEvents');
  context.assert(errorResult.status === 'degraded' && errorResult.lifecycleRecord.event === 'surface:error', 'frameworkless Vue adapter reports degraded errors');
  context.assert(unmountResult.ok === true && unmountResult.cleanupRecords.some((record) => record.resource === 'vue-app-stub'), 'frameworkless Vue adapter releases app stub');
  context.assert(snapshot.app.unmounted === true && snapshot.adapterSchema === XTENSIONS_VUE_ADAPTER_SCHEMA, 'frameworkless Vue adapter snapshot records adapter schema');

  const boundary = normalizeVueRuntimeBoundary(fixture.runtimeBoundary);
  context.assert(boundary.schema === XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA && boundary.ok === true, 'Vue runtime boundary normalizes successfully');
  const missingBoundary = normalizeVueRuntimeBoundary(common.missingRuntimeFixture.runtimeBoundary);
  context.assert(missingBoundary.ok === false, 'Vue runtime boundary blocks missing provider module');
  context.assert(missingBoundary.diagnostics.some((diagnostic) => diagnostic.code === VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE), 'missing Vue runtime diagnostic is emitted');

  const badPayload = inspectVuePayloadBoundary(common.badPayloadFixture.payload);
  context.assert(badPayload.ok === false, 'Vue payload boundary blocks proxy/store/global patch leakage');
  common.badPayloadFixture.expectedDiagnostics.forEach((code) => {
    context.assert(badPayload.diagnostics.some((diagnostic) => diagnostic.code === code), `Vue bad payload emits ${code}`);
  });

  const securityReport = evaluateXTensionSecurity(fixture.manifest, { artifactText: 'export const XTENSION_CONTRACT = {}; export function createVueProcessSidebar() {}' });
  context.assert(securityReport.status === 'ready', 'Vue host-provided manifest passes security gate when artifact is externalized');
  context.assert(securityReport.artifactRuntime.runtimeBundled === false, 'Vue externalized artifact has no runtime signatures');

  const driftReport = evaluateXTensionSecurity(fixture.manifest, { artifactText: common.blockedRuntimeFixture.artifactText });
  context.assert(driftReport.status === 'blocked', 'Vue manifest/bundle drift is blocked');
  context.assert(driftReport.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE), 'Vue artifact runtime drift diagnostic is emitted');

  const report = createVueAdapterReport({
    id: fixture.expectedXtensionId,
    runtimeBoundary: fixture.runtimeBoundary,
    dependencyBoundary: {
      packageManifest: common.packageManifest,
      sourceText: `${common.moduleText}\n${common.typesText}`
    },
    payload: fixture.payload.props,
    updateAdapter: 'applyPropsUpdate'
  }, { clock: createClock() });
  context.assert(report.ok === true, 'Vue adapter report is ok for host-provided runtime');
  context.assert(serializeVueAdapterReport(report).includes(XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA), 'Vue report serializes schema');

  return context.result({
    schema: XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
    updateRecordCount: snapshot.updateRecordCount || adapter.getUpdateRecords().length
  });
}

function printXTensionsVueHostAdapterReport(result) {
  printSuiteReport(result);
}

module.exports = {
  printXTensionsVueHostAdapterReport,
  runXTensionsVueHostAdapterSuite
};
