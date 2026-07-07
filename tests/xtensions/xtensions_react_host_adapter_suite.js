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
  SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE,
  evaluateXTensionSecurity
} = require('../../tools/xtensions/security-integrity-gate');
const {
  REACT_ADAPTER_CAPABILITIES,
  REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE,
  XTENSIONS_REACT_ADAPTER_CONTRACT_PATH,
  XTENSIONS_REACT_ADAPTER_FIXTURE_PATH,
  XTENSIONS_REACT_ADAPTER_MODULE_PATH,
  XTENSIONS_REACT_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA,
  XTENSIONS_REACT_ADAPTER_SCHEMA,
  XTENSIONS_REACT_ADAPTER_SUITE_PATH,
  XTENSIONS_REACT_ADAPTER_TYPES_PATH,
  XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
  XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
  createReactAdapterContract,
  createReactAdapterReport,
  createReactHostAdapter,
  inspectReactPayloadBoundary,
  normalizeReactRuntimeBoundary,
  serializeReactAdapterReport
} = require('../../tools/xtensions/react-host-adapter');

const REACT_BLOCKED_RUNTIME_FIXTURE_PATH = 'tests/fixtures/xtensions/react-host-adapter-runtime-bundled-blocked.json';
const REACT_BAD_PAYLOAD_FIXTURE_PATH = 'tests/fixtures/xtensions/react-host-adapter-bad-payload.json';
const REACT_MISSING_RUNTIME_FIXTURE_PATH = 'tests/fixtures/xtensions/react-host-adapter-missing-peer-runtime.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-07-08T09:10:${String(tick).padStart(2, '0')}Z`;
  };
}

function loadCommon(rootDir) {
  return {
    packageManifest: readJson('package.json', rootDir),
    runner: readText('scripts/run_xtend_tests.js', rootDir),
    contractDoc: readText(XTENSIONS_REACT_ADAPTER_CONTRACT_PATH, rootDir),
    fixture: readJson(XTENSIONS_REACT_ADAPTER_FIXTURE_PATH, rootDir),
    blockedRuntimeFixture: readJson(REACT_BLOCKED_RUNTIME_FIXTURE_PATH, rootDir),
    badPayloadFixture: readJson(REACT_BAD_PAYLOAD_FIXTURE_PATH, rootDir),
    missingRuntimeFixture: readJson(REACT_MISSING_RUNTIME_FIXTURE_PATH, rootDir),
    moduleText: readText(XTENSIONS_REACT_ADAPTER_MODULE_PATH, rootDir),
    typesText: readText(XTENSIONS_REACT_ADAPTER_TYPES_PATH, rootDir)
  };
}

function assertCommonFiles(context, rootDir) {
  [
    XTENSIONS_REACT_ADAPTER_CONTRACT_PATH,
    XTENSIONS_REACT_ADAPTER_MODULE_PATH,
    XTENSIONS_REACT_ADAPTER_TYPES_PATH,
    XTENSIONS_REACT_ADAPTER_SUITE_PATH,
    XTENSIONS_REACT_ADAPTER_FIXTURE_PATH,
    REACT_BLOCKED_RUNTIME_FIXTURE_PATH,
    REACT_BAD_PAYLOAD_FIXTURE_PATH,
    REACT_MISSING_RUNTIME_FIXTURE_PATH
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });

  const moduleSyntax = syntaxCheckFile(XTENSIONS_REACT_ADAPTER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_REACT_ADAPTER_SUITE_PATH, { rootDir, extension: '.js' });
  context.assert(moduleSyntax.ok, `React Host Adapter module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `React Host Adapter suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
}

function assertPackageWiring(context, common) {
  const packageManifest = common.packageManifest;
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsReactHostAdapter;
  context.assert(metadata && metadata.schema === XTENSIONS_REACT_ADAPTER_SCHEMA, 'package metadata declares React adapter schema');
  context.assert(metadata && metadata.runtimeBoundarySchema === XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA, 'package metadata declares React runtime boundary schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_REACT_ADAPTER_WORKPACKAGE, 'package metadata points to XTN-18');
  context.assert(metadata && metadata.module === XTENSIONS_REACT_ADAPTER_MODULE_PATH, 'package metadata points to React adapter module');
  context.assert(metadata && metadata.types === XTENSIONS_REACT_ADAPTER_TYPES_PATH, 'package metadata points to React adapter types');
  context.assert(metadata && metadata.fixture === XTENSIONS_REACT_ADAPTER_FIXTURE_PATH, 'package metadata points to React adapter fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_REACT_ADAPTER_SUITE_PATH, 'package metadata points to React adapter suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-react-host-adapter xtensions-react-host-controller-poc --json', 'package metadata declares React adapter local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_REACT_ADAPTER_PACKAGE_SCRIPT, 'package metadata declares React adapter package script');
  context.assert(metadata && metadata.runtimeStrategy === 'external-peer-host-provided', 'package metadata declares host-provided React runtime strategy');

  const exportEntry = packageManifest.exports['./xtensions/react-host-adapter'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/react-host-adapter.js', 'package exports React host adapter module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/react-host-adapter.d.ts', 'package exports React host adapter types');
  context.assert(packageManifest.scripts['test:xtensions-react-host-adapter'] === 'node scripts/run_xtend_tests.js xtensions-react-host-adapter', 'package exposes React host adapter test script');
  context.assert(common.runner.includes("id: 'xtensions-react-host-adapter'"), 'runner exposes React host adapter suite');
  context.assert(common.contractDoc.includes('Contract: `xtend.xtensions.react-adapter.v1`'), 'contract document declares React adapter schema');
  context.assert(common.contractDoc.includes('startTransition'), 'contract document names React scheduling boundary');
}

function runXTensionsReactHostAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-react-host-adapter',
    label: 'XTensions React Host Adapter Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);
  context.assert(fixture.schema === 'xtend.xtensions.react-host-adapter.fixture.v1', 'fixture declares React host adapter fixture schema');
  context.assert(fixture.contract === XTENSIONS_REACT_ADAPTER_SCHEMA, 'fixture points to React adapter contract');
  context.assert(fixture.expectedFramework === 'react', 'fixture names React framework');
  context.assert(!('react' in (common.packageManifest.dependencies || {})), 'root package does not depend on React');
  context.assert(!('react-dom' in (common.packageManifest.dependencies || {})), 'root package does not depend on ReactDOM');

  const contract = createReactAdapterContract({ runtimeBoundary: fixture.runtimeBoundary });
  context.assert(contract.schema === XTENSIONS_REACT_ADAPTER_SCHEMA, 'contract factory exposes React adapter schema');
  context.assert(contract.runtimeBoundary.ok === true, 'contract factory accepts host-provided React runtime boundary');
  REACT_ADAPTER_CAPABILITIES.forEach((capability) => {
    context.assert(contract.capabilities.includes(capability), `contract exposes capability ${capability}`);
  });

  const adapter = createReactHostAdapter({
    id: fixture.expectedXtensionId,
    surfaceId: 'surface.react.adapter',
    clock: createClock()
  });
  const target = { id: 'react-suite-target' };
  const mountResult = adapter.mount(target, fixture.payload.props, { lane: 'fabric.interactive' });
  const updateResult = adapter.update({ props: { seed: 'suite-react-next' }, priorityHint: 'background' });
  const suspenseResult = adapter.update({ props: { suspensePending: true }, suspense: true });
  const errorResult = adapter.reportError(new Error('synthetic React adapter error'), { recoverable: true });
  const unmountResult = adapter.unmount('suite-complete');
  const snapshot = adapter.snapshot();

  context.assert(mountResult.schema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA && mountResult.ok === true, 'frameworkless React adapter mounts');
  context.assert(updateResult.ok === true && updateResult.lifecycleRecord.event === 'surface:updated', 'frameworkless React adapter updates');
  context.assert(suspenseResult.status === 'degraded' && suspenseResult.diagnostics.length >= 1, 'frameworkless React adapter emits Suspense diagnostics');
  context.assert(errorResult.status === 'degraded' && errorResult.lifecycleRecord.event === 'surface:error', 'frameworkless React adapter reports degraded errors');
  context.assert(unmountResult.ok === true && unmountResult.cleanupRecords.some((record) => record.resource === 'react-root-stub'), 'frameworkless React adapter releases root stub');
  context.assert(snapshot.state.destroyed === true && snapshot.adapterSchema === XTENSIONS_REACT_ADAPTER_SCHEMA, 'frameworkless React adapter snapshot records adapter schema');

  const boundary = normalizeReactRuntimeBoundary(fixture.runtimeBoundary);
  context.assert(boundary.schema === XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA && boundary.ok === true, 'React runtime boundary normalizes successfully');
  const missingBoundary = normalizeReactRuntimeBoundary(common.missingRuntimeFixture.runtimeBoundary);
  context.assert(missingBoundary.ok === false, 'React runtime boundary blocks missing provider modules');
  context.assert(missingBoundary.diagnostics.some((diagnostic) => diagnostic.code === REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE), 'missing React runtime diagnostic is emitted');

  const badPayload = inspectReactPayloadBoundary(common.badPayloadFixture.payload);
  context.assert(badPayload.ok === false, 'React payload boundary blocks context/store leakage');
  common.badPayloadFixture.expectedDiagnostics.forEach((code) => {
    context.assert(badPayload.diagnostics.some((diagnostic) => diagnostic.code === code), `React bad payload emits ${code}`);
  });

  const securityReport = evaluateXTensionSecurity(fixture.manifest, { artifactText: 'export const XTENSION_CONTRACT = {}; export function createReactLedgerPanel() {}' });
  context.assert(securityReport.status === 'ready', 'React host-provided manifest passes security gate when artifact is externalized');
  context.assert(securityReport.artifactRuntime.runtimeBundled === false, 'React externalized artifact has no runtime signatures');

  const driftReport = evaluateXTensionSecurity(fixture.manifest, { artifactText: common.blockedRuntimeFixture.artifactText });
  context.assert(driftReport.status === 'blocked', 'React manifest/bundle drift is blocked');
  context.assert(driftReport.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE), 'React artifact runtime drift diagnostic is emitted');

  const report = createReactAdapterReport({
    id: fixture.expectedXtensionId,
    runtimeBoundary: fixture.runtimeBoundary,
    dependencyBoundary: {
      packageManifest: common.packageManifest,
      sourceText: `${common.moduleText}\n${common.typesText}`
    },
    payload: fixture.payload
  }, { clock: createClock() });
  context.assert(report.ok === true, 'React adapter report is ok for host-provided runtime');
  context.assert(serializeReactAdapterReport(report).includes(XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA), 'React report serializes schema');

  return context.result({
    schema: XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
    lifecycleCount: snapshot.lifecycleCount || adapter.getLifecycleRecords().length
  });
}

function printXTensionsReactHostAdapterReport(result) {
  printSuiteReport(result);
}

module.exports = {
  printXTensionsReactHostAdapterReport,
  runXTensionsReactHostAdapterSuite
};
