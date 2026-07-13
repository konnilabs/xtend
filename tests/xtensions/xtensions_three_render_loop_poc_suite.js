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
  XTENSIONS_STATIC_CONTRACT_SCHEMA
} = require('../../tools/xtensions/static-contract-introspection');
const {
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  DEFAULT_THREE_CLEANUP_RESOURCES,
  THREE_POC_API_LEAK_CODE,
  THREE_POC_BACKPRESSURE_CODE,
  THREE_POC_BROWSER_SMOKE_BLANK_CODE,
  THREE_POC_CLEANUP_INCOMPLETE_CODE,
  THREE_POC_CONTEXT_LOST_CODE,
  THREE_POC_FIBER_UNREGISTERED_CODE,
  THREE_POC_FRAME_BUDGET_INVALID_CODE,
  THREE_POC_FRAMEWORK_DEPENDENCY_CODE,
  THREE_POC_FREE_RAF_LOOP_CODE,
  THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  THREE_POC_NOT_MOUNTED_CODE,
  THREE_RENDER_LOOP_BOUNDARIES,
  THREE_RENDER_LOOP_LANES,
  THREE_RENDER_LOOP_STATES,
  XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA,
  XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA,
  XTENSIONS_THREE_FIBER_RECORD_SCHEMA,
  XTENSIONS_THREE_FRAME_RECORD_SCHEMA,
  XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA,
  XTENSIONS_THREE_RENDER_LOOP_POC_CONTRACT_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_PACKAGE_SCRIPT,
  XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
  XTENSIONS_THREE_RENDER_LOOP_POC_SUITE_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_TYPES_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
  XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA,
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
  assertThreeRenderLoopDependencyBoundary,
  createFrameworklessThreeRenderLoopPoc,
  createThreeBrowserSmokeRecord,
  createThreeContextLossRecord,
  createThreeFiberRecord,
  createThreeFrameRecord,
  createThreeRenderLoopContract,
  createThreeRenderLoopPocReport,
  createThreeRuntimeAdapterRecord,
  inspectThreePayloadBoundary,
  resolveHostResourceCleanupSchema,
  serializeThreeRenderLoopPocReport
} = require('../../tools/xtensions/three-render-loop-poc');

const HOST_RESOURCE_CLEANUP_FIELDS = Object.freeze([
  'hostId', 'resource', 'schema', 'sequence', 'status', 'surfaceId', 'timestamp', 'xtensionId'
]);

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
    return `2026-06-20T09:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function allDependencies(record) {
  return (record && Array.isArray(record.dependencies)) ? record.dependencies : [];
}

function runXTensionsThreeRenderLoopPocSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-three-render-loop-poc',
    label: 'XTensions Three.js Fiber Render Loop PoC Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsThreeRenderLoopPoc;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const runtimeRegistryContract = readText(RUNTIME_REGISTRY_CONTRACT_PATH, rootDir);
  const threeContract = readText(XTENSIONS_THREE_RENDER_LOOP_POC_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_THREE_RENDER_LOOP_POC_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_THREE_RENDER_LOOP_POC_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, RUNTIME_REGISTRY_CONTRACT_PATH, rootDir, 'XTensions runtime registry contract exists');
  assertFileExists(context, XTENSIONS_THREE_RENDER_LOOP_POC_CONTRACT_PATH, rootDir, 'XTensions Three render loop PoC contract exists');
  assertFileExists(context, XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH, rootDir, 'XTensions Three render loop PoC module exists');
  assertFileExists(context, XTENSIONS_THREE_RENDER_LOOP_POC_TYPES_PATH, rootDir, 'XTensions Three render loop PoC types exist');
  assertFileExists(context, XTENSIONS_THREE_RENDER_LOOP_POC_SUITE_PATH, rootDir, 'XTensions Three render loop PoC suite exists');
  assertFileExists(context, XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH, rootDir, 'XTensions Three render loop PoC fixture exists');
  context.assert(moduleSyntax.ok, `XTensions Three render loop PoC module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions Three render loop PoC suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(typesText.includes('HostResourceCleanupRecord[]'), 'Three declarations expose the precise shared cleanup record type');
  const threeCleanupAlias = resolveHostResourceCleanupSchema('xtend.xtensions.three-cleanup-record.v1');
  context.assert(
    threeCleanupAlias && threeCleanupAlias.canonicalSchemaId === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA
      && threeCleanupAlias.isLegacy === true && threeCleanupAlias.deprecated === true,
    'Three module exports the shared legacy cleanup resolver'
  );

  context.assert(metadata && metadata.schema === XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA, 'package metadata declares Three render loop PoC schema');
  context.assert(metadata && metadata.contractSchema === XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA, 'package metadata declares Three render loop contract schema');
  context.assert(metadata && metadata.fiberRecordSchema === XTENSIONS_THREE_FIBER_RECORD_SCHEMA, 'package metadata declares Three fiber record schema');
  context.assert(metadata && metadata.frameRecordSchema === XTENSIONS_THREE_FRAME_RECORD_SCHEMA, 'package metadata declares Three frame record schema');
  context.assert(metadata && metadata.contextLossRecordSchema === XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA, 'package metadata declares Three context loss record schema');
  context.assert(metadata && metadata.browserSmokeRecordSchema === XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA, 'package metadata declares Three browser smoke record schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA, 'package metadata declares Three report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'package metadata links Surface Event schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.runtimeReportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata links runtime report schema');
  context.assert(metadata && metadata.staticContractSchema === XTENSIONS_STATIC_CONTRACT_SCHEMA, 'package metadata links static contract schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE, 'package metadata points to XTN-09');
  context.assert(metadata && metadata.module === XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH, 'package metadata points to Three PoC module');
  context.assert(metadata && metadata.types === XTENSIONS_THREE_RENDER_LOOP_POC_TYPES_PATH, 'package metadata points to Three PoC types');
  context.assert(metadata && metadata.fixture === XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH, 'package metadata points to Three PoC fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_THREE_RENDER_LOOP_POC_CONTRACT_PATH, 'package metadata points to Three PoC contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-three-render-loop-poc --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_THREE_RENDER_LOOP_POC_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.framework === 'three', 'package metadata names Three framework');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids runtime execution');
  context.assert(metadata && metadata.peerHarness === 'external-opt-in', 'package metadata marks external opt-in peer harness');
  context.assert(metadata && metadata.freeRunningLoopAllowed === false, 'package metadata blocks free running loops');
  context.assert(metadata && metadata.renderLoopAuthority === 'host-fiber', 'package metadata assigns render loop authority to host fiber');

  const exportEntry = packageManifest.exports['./xtensions/three-render-loop-poc'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/three-render-loop-poc.js', 'package exports Three render loop PoC module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/three-render-loop-poc.d.ts', 'package exports Three render loop PoC types');
  context.assert(packageManifest.scripts['test:xtensions-three-render-loop-poc'] === 'node scripts/run_xtend_tests.js xtensions-three-render-loop-poc', 'package exposes Three render loop PoC script');
  context.assert(runner.includes("id: 'xtensions-three-render-loop-poc'"), 'test runner exposes xtensions-three-render-loop-poc suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-three-render-loop-poc'), 'runner help references Three render loop PoC gate');

  context.assert(backlog.includes('| `XTN-09` | P1 | completed | WS8 |'), 'backlog marks XTN-09 completed');
  context.assert(backlog.includes('development/XTensions-Three-Fiber-Render-Loop-PoC-Contract.md'), 'backlog references Three render loop PoC contract');
  context.assert(architectureContract.includes('no-framework-test-fixture-dependencies-in-xtend-package'), 'architecture contract keeps no framework fixture dependency boundary');
  context.assert(hostControllerContract.includes('framework-pocs-use-contract-stubs-or-external-opt-in-peer-harnesses'), 'HostController contract keeps external peer harness boundary');
  context.assert(signalBridgeContract.includes('SurfaceEvent'), 'Signal Bridge contract remains linked');
  context.assert(runtimeRegistryContract.includes('external-peer'), 'Runtime registry contract keeps peer dependency classification');
  context.assert(threeContract.includes('Three.js bleibt eine externe opt-in Peer-Runtime'), 'Three contract keeps runtime external');
  context.assert(threeContract.includes('node scripts/run_xtend_tests.js xtensions-three-render-loop-poc --json'), 'Three contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.three-render-loop-poc.fixture.v1', 'fixture declares Three render loop fixture schema');
  context.assert(fixture.expectedXtensionId === 'xtension.three.scene', 'fixture names expected Three XTension id');
  context.assert(fixture.expectedFramework === 'three', 'fixture names Three framework');
  assertIncludesAll(context, fixture.expectedFrameStatuses, ['rendered', 'dropped-over-budget', 'skipped-hidden'], 'fixture names expected frame statuses');

  const dependencyBoundary = assertThreeRenderLoopDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${threeContract}`
  });
  context.assert(dependencyBoundary.ok, `Three render loop sources avoid real framework imports and free RAF loops${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badThreeDependency = assertThreeRenderLoopDependencyBoundary({
    sourceText: "import * as THREE from 'three';"
  });
  context.assert(
    badThreeDependency.diagnostics.some((diagnostic) => diagnostic.code === THREE_POC_FRAMEWORK_DEPENDENCY_CODE),
    'Three dependency guard rejects three imports'
  );
  const badFiberDependency = assertThreeRenderLoopDependencyBoundary({
    sourceText: "import { Canvas } from '@react-three/fiber';"
  });
  context.assert(
    badFiberDependency.diagnostics.some((diagnostic) => diagnostic.code === THREE_POC_FRAMEWORK_DEPENDENCY_CODE),
    'Three dependency guard rejects @react-three/fiber imports'
  );
  const badRafLoop = assertThreeRenderLoopDependencyBoundary({
    sourceText: 'function loop(){ requestAnimationFrame(loop); render(); }'
  });
  context.assert(
    badRafLoop.diagnostics.some((diagnostic) => diagnostic.code === THREE_POC_FREE_RAF_LOOP_CODE),
    'Three dependency guard rejects free requestAnimationFrame loops'
  );

  const contract = createThreeRenderLoopContract(fixture.contract);
  context.assert(contract.schema === XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA, 'Three render loop contract emits schema');
  context.assert(contract.framework === 'three', 'Three render loop contract names Three framework');
  context.assert(contract.peerMode === 'external-opt-in-peer-harness', 'Three render loop contract keeps peer harness external');
  context.assert(contract.frameworkDependenciesAllowed === false, 'Three render loop contract blocks framework dependencies');
  context.assert(contract.vendoredFrameworksAllowed === false, 'Three render loop contract blocks vendored frameworks');
  context.assert(contract.runtimeExecutionRequired === false, 'Three render loop contract avoids runtime execution');
  context.assert(contract.freeRunningLoopAllowed === false, 'Three render loop contract forbids free loops');
  assertIncludesAll(context, contract.lanes, THREE_RENDER_LOOP_LANES, 'Three render loop contract exposes lanes');
  assertIncludesAll(context, contract.states, THREE_RENDER_LOOP_STATES, 'Three render loop contract exposes states');
  assertIncludesAll(context, contract.boundaries, THREE_RENDER_LOOP_BOUNDARIES, 'Three render loop contract exposes boundaries');

  const adapter = createThreeRuntimeAdapterRecord({
    ...fixture.adapter,
    contract: fixture.contract,
    xtensionId: fixture.expectedXtensionId
  });
  context.assert(adapter.framework === 'three', 'Three runtime adapter record names Three as data');
  context.assert(allDependencies(adapter).every((dependency) => dependency.classification === 'external-peer'), 'Three runtime adapter dependencies stay external-peer');
  context.assert(allDependencies(adapter).every((dependency) => dependency.bundled === false && dependency.packageIncluded === false), 'Three runtime adapter dependencies are not bundled or packaged');
  context.assert(adapter.requiredHostCapabilities.includes('three.render-loop.fiber'), 'Three adapter requires render-loop fiber capability');
  context.assert(adapter.requiredHostCapabilities.includes('frame.budget'), 'Three adapter requires frame budget capability');
  context.assert(adapter.requiredHostCapabilities.includes('webgl.cleanup'), 'Three adapter requires WebGL cleanup capability');

  const registeredFiber = createThreeFiberRecord({
    hostRegistered: true,
    frameBudgetMs: 16.67,
    lane: 'fabric.render'
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(registeredFiber.schema === XTENSIONS_THREE_FIBER_RECORD_SCHEMA, 'Three fiber record emits schema');
  context.assert(registeredFiber.ok === true && registeredFiber.hostRegistered === true, 'host-registered Three fiber is accepted');
  const freeFiber = createThreeFiberRecord({
    hostRegistered: false,
    frameBudgetMs: 16.67
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(freeFiber.ok === false && diagnosticCodes(freeFiber).includes(THREE_POC_FREE_RAF_LOOP_CODE), 'free Three render loop fiber is rejected');
  const badBudgetFiber = createThreeFiberRecord({
    hostRegistered: true,
    frameBudgetMs: 0
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(badBudgetFiber.ok === false && diagnosticCodes(badBudgetFiber).includes(THREE_POC_FRAME_BUDGET_INVALID_CODE), 'invalid Three frame budget is diagnosed');

  const renderedFrame = createThreeFrameRecord({
    sequence: 1,
    renderCostMs: 8,
    frameBudgetMs: 16.67,
    nonBlankPixels: 144
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(renderedFrame.schema === XTENSIONS_THREE_FRAME_RECORD_SCHEMA, 'Three frame record emits schema');
  context.assert(renderedFrame.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'Three frame record links SurfaceEvent schema');
  context.assert(renderedFrame.ok === true && renderedFrame.status === 'rendered' && renderedFrame.nonBlankPixels > 0, 'budgeted Three frame renders nonblank evidence');
  const backpressuredFrame = createThreeFrameRecord({
    sequence: 2,
    renderCostMs: 24,
    frameBudgetMs: 16.67
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(backpressuredFrame.ok === true && backpressuredFrame.status === 'dropped-over-budget', 'over-budget Three frame is dropped as warning');
  context.assert(diagnosticCodes(backpressuredFrame).includes(THREE_POC_BACKPRESSURE_CODE), 'over-budget Three frame emits backpressure diagnostic');
  const hiddenFrame = createThreeFrameRecord({
    sequence: 3,
    visible: false,
    renderCostMs: 0
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(hiddenFrame.ok === true && hiddenFrame.status === 'skipped-hidden', 'hidden Three frame is skipped');
  const contextLostFrame = createThreeFrameRecord({
    sequence: 4,
    contextLost: true,
    renderCostMs: 0
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(contextLostFrame.ok === true && contextLostFrame.status === 'skipped-context-lost', 'context-lost Three frame is skipped');
  context.assert(diagnosticCodes(contextLostFrame).includes(THREE_POC_CONTEXT_LOST_CODE), 'context-lost Three frame emits diagnostic');

  const contextLoss = createThreeContextLossRecord({ reason: 'webglcontextlost' }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(contextLoss.schema === XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA, 'Three context loss record emits schema');
  context.assert(contextLoss.status === 'lost' && diagnosticCodes(contextLoss).includes(THREE_POC_CONTEXT_LOST_CODE), 'Three context loss is diagnosed');
  const contextRestore = createThreeContextLossRecord({ restored: true, reason: 'webglcontextrestored' }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(contextRestore.status === 'restored' && contextRestore.diagnostics.length === 0, 'Three context restore clears diagnostics');

  const smoke = createThreeBrowserSmokeRecord({
    nonBlankPixels: 192,
    interactionCount: 1,
    cleanupVerified: true
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(smoke.schema === XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA, 'Three browser smoke record emits schema');
  context.assert(smoke.ok === true && smoke.browserRuntimeRequired === false && smoke.threeRuntimeImported === false, 'Three browser smoke evidence stays frameworkless');
  const blankSmoke = createThreeBrowserSmokeRecord({
    nonBlankPixels: 0,
    interactionCount: 1,
    cleanupVerified: true
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(blankSmoke.ok === false && diagnosticCodes(blankSmoke).includes(THREE_POC_BROWSER_SMOKE_BLANK_CODE), 'blank Three smoke evidence is diagnosed');
  const dirtySmoke = createThreeBrowserSmokeRecord({
    nonBlankPixels: 12,
    interactionCount: 1,
    cleanupVerified: false
  }, {
    xtensionId: fixture.expectedXtensionId,
    clock: createClock()
  });
  context.assert(dirtySmoke.ok === false && diagnosticCodes(dirtySmoke).includes(THREE_POC_CLEANUP_INCOMPLETE_CODE), 'incomplete Three smoke cleanup is diagnosed');

  const safePayload = inspectThreePayloadBoundary({ nodes: [{ id: 'cube', kind: 'mesh' }] }, { id: fixture.expectedXtensionId, framework: 'three' });
  context.assert(safePayload.ok === true && safePayload.apiBoundary === 'hostcontroller-only', 'safe Three scene descriptor stays serializable');
  const rendererLeak = inspectThreePayloadBoundary({ threeRenderer: { id: 'native-renderer' } }, { id: fixture.expectedXtensionId, framework: 'three' });
  context.assert(rendererLeak.ok === false && diagnosticCodes(rendererLeak).includes(THREE_POC_API_LEAK_CODE), 'Three renderer leak is diagnosed');
  const functionPayload = inspectThreePayloadBoundary({ onFrame() {} }, { id: fixture.expectedXtensionId, framework: 'three' });
  context.assert(functionPayload.ok === false && diagnosticCodes(functionPayload).includes(THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE), 'non-serializable Three payload is diagnosed');

  const hostController = createFrameworklessThreeRenderLoopPoc({
    xtensionId: fixture.expectedXtensionId,
    hostId: 'three-poc-test-host',
    surfaceId: 'surface.three.scene',
    clock: createClock()
  });
  const tickBeforeRegister = hostController.tick({ renderCostMs: 1 });
  context.assert(tickBeforeRegister.status === 'failed' && diagnosticCodes(tickBeforeRegister).includes(THREE_POC_NOT_MOUNTED_CODE), 'Three HostController blocks tick before mount');
  const mount = hostController.mount({ id: 'three-container' }, { nodes: [{ id: 'cube' }] });
  context.assert(mount.status === 'ok', 'Three frameworkless HostController PoC mounts');
  const tickWithoutFiber = hostController.tick({ renderCostMs: 1 });
  context.assert(tickWithoutFiber.status === 'failed' && diagnosticCodes(tickWithoutFiber).includes(THREE_POC_FIBER_UNREGISTERED_CODE), 'Three HostController blocks tick before fiber registration');
  const registerLoop = hostController.registerRenderLoop({
    hostRegistered: true,
    frameBudgetMs: 16.67,
    lowPowerFrameBudgetMs: 33.33
  });
  context.assert(registerLoop.status === 'ok' && registerLoop.metadata.fiberRecord.hostRegistered === true, 'Three HostController registers host-owned render loop');
  const rendered = hostController.tick({ renderCostMs: 8, nonBlankPixels: 144 });
  context.assert(rendered.status === 'ok' && rendered.metadata.frameRecord.status === 'rendered', 'Three HostController renders budgeted frame');
  const dropped = hostController.tick({ renderCostMs: 21 });
  context.assert(dropped.status === 'degraded' && diagnosticCodes(dropped).includes(THREE_POC_BACKPRESSURE_CODE), 'Three HostController degrades over-budget frame');
  const hidden = hostController.setVisibility({ visibility: 'hidden' });
  context.assert(hidden.status === 'ok' && hidden.metadata.suspended === true, 'Three HostController pauses on hidden visibility');
  const hiddenTick = hostController.tick({ renderCostMs: 0 });
  context.assert(hiddenTick.status === 'skipped' && hiddenTick.metadata.frameRecord.status === 'skipped-hidden', 'Three HostController skips hidden frame');
  const resumed = hostController.resume('visible-again');
  context.assert(resumed.status === 'ok' && resumed.metadata.visible === true, 'Three HostController resumes render loop');
  const lowPower = hostController.setLowPowerMode({ enabled: true });
  context.assert(lowPower.status === 'ok' && lowPower.metadata.lowPowerMode === true, 'Three HostController enters low-power mode');
  const lowPowerFrame = hostController.tick({ renderCostMs: 28, nonBlankPixels: 128 });
  context.assert(lowPowerFrame.status === 'ok' && lowPowerFrame.metadata.frameRecord.lowPowerMode === true, 'Three HostController uses low-power frame budget');
  const contextLossResult = hostController.reportContextLoss({ reason: 'webglcontextlost' });
  context.assert(contextLossResult.status === 'degraded' && diagnosticCodes(contextLossResult).includes(THREE_POC_CONTEXT_LOST_CODE), 'Three HostController records context loss');
  const restored = hostController.restoreContext({ reason: 'webglcontextrestored' });
  context.assert(restored.status === 'ok', 'Three HostController restores context');
  const interaction = hostController.interact({ name: 'pointer.select', payload: { objectId: 'cube' } });
  context.assert(interaction.status === 'ok' && interaction.metadata.interactionCount === 1, 'Three HostController records interaction');
  const interactionLeak = hostController.interact({ name: 'pointer.select', threeMesh: { id: 'native-mesh' } });
  context.assert(interactionLeak.status === 'failed' && diagnosticCodes(interactionLeak).includes(THREE_POC_API_LEAK_CODE), 'Three HostController blocks native mesh leak');
  const unmount = hostController.unmount('suite-complete');
  context.assert(unmount.status === 'ok' && unmount.cleanupRecords.length >= DEFAULT_THREE_CLEANUP_RESOURCES.length, 'Three HostController releases WebGL cleanup resources');
  context.assert(unmount.cleanupRecords.every((record) => record.schema === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA), 'Three cleanup producer emits only the canonical cleanup schema');
  context.assert(unmount.cleanupRecords.every((record) => JSON.stringify(Object.keys(record).sort()) === JSON.stringify(HOST_RESOURCE_CLEANUP_FIELDS)), 'Three cleanup producer emits the shared eight-field shape');
  const smokeAfterUnmount = hostController.browserSmoke({ nonBlankPixels: 192, interactionCount: 1, cleanupVerified: true });
  context.assert(smokeAfterUnmount.ok === true, 'Three HostController records browser smoke after cleanup');
  const unmountAgain = hostController.unmount('suite-complete-repeat');
  context.assert(unmountAgain.status === 'skipped', 'Three HostController unmount is idempotent');
  const snapshot = hostController.snapshot();
  context.assert(snapshot.freeRunningLoopExternalized === false, 'Three free-running loop is never externalized');
  context.assert(snapshot.threeRuntimeImported === false, 'Three runtime is never imported in snapshot');
  context.assert(hostController.getFrameRecords().length >= 4, 'Three HostController exposes frame records');
  context.assert(hostController.getContextLossRecords().length >= 2, 'Three HostController exposes context loss records');
  context.assert(hostController.getCleanupRecords().length >= DEFAULT_THREE_CLEANUP_RESOURCES.length, 'Three HostController exposes cleanup records');

  const report = createThreeRenderLoopPocReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA, 'Three render loop PoC report emits schema');
  context.assert(report.ok === true && report.status === 'ready', 'Three render loop fixture report is ready');
  context.assert(report.runtimeExecutionRequired === false && report.threeRuntimeImported === false, 'Three render loop report imports no framework runtime');
  context.assert(report.freeRunningLoopAllowed === false, 'Three render loop report forbids free loops');
  context.assert(report.runtimeReport.status === 'ready', 'Three render loop runtime report is ready with external peer available');
  context.assert(report.runtimeRegistry.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'Three render loop report embeds runtime registry');
  context.assert(report.adapter.framework === 'three', 'Three render loop report embeds adapter');
  context.assert(report.fiberRecords.some((record) => record.hostRegistered === true), 'Three render loop report includes host-registered fiber record');
  context.assert(report.frameRecords.some((record) => record.status === 'rendered'), 'Three render loop report includes rendered frame');
  context.assert(report.frameRecords.some((record) => record.status === 'dropped-over-budget'), 'Three render loop report includes dropped frame');
  context.assert(report.frameRecords.some((record) => record.status === 'skipped-hidden'), 'Three render loop report includes hidden skipped frame');
  context.assert(report.contextLossRecords.some((record) => record.status === 'lost'), 'Three render loop report includes context loss record');
  context.assert(report.contextLossRecords.some((record) => record.status === 'restored'), 'Three render loop report includes context restore record');
  context.assert(report.browserSmokeRecords.some((record) => record.ok === true && record.nonBlankPixels > 0), 'Three render loop report includes nonblank browser smoke evidence');
  context.assert(report.diagnostics.some((diagnostic) => diagnostic.code === THREE_POC_BACKPRESSURE_CODE && diagnostic.severity === 'warning'), 'Three render loop report includes backpressure warning');
  context.assert(report.diagnostics.some((diagnostic) => diagnostic.code === THREE_POC_CONTEXT_LOST_CODE && diagnostic.severity === 'warning'), 'Three render loop report includes context loss warning');
  context.assert(report.cleanupRecords.length >= DEFAULT_THREE_CLEANUP_RESOURCES.length, 'Three render loop report includes cleanup records');
  context.assert(report.cleanupRecords.every((record) => record.schema === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA), 'Three render loop report contains only canonical cleanup records');
  context.assert(report.snapshot.freeRunningLoopExternalized === false, 'report keeps free-running loop internal');
  context.assert(report.snapshot.threeRuntimeImported === false, 'report keeps Three runtime external');

  const serialized = serializeThreeRenderLoopPocReport(report);
  const repeat = serializeThreeRenderLoopPocReport(createThreeRenderLoopPocReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'Three render loop PoC report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA, 'serialized Three render loop PoC report is parseable JSON');

  return context.result({
    schema: XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA,
    pocSchema: XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    module: XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH,
    suite: XTENSIONS_THREE_RENDER_LOOP_POC_SUITE_PATH,
    fixture: XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH,
    fiberRecordCount: report.fiberRecords.length,
    frameRecordCount: report.frameRecords.length,
    contextLossRecordCount: report.contextLossRecords.length,
    cleanupCount: report.cleanupRecords.length
  });
}

function printXTensionsThreeRenderLoopPocReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Three.js Fiber Render Loop PoC Contract erfolgreich.',
    failureTitle: 'XTensions Three.js Fiber Render Loop PoC Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsThreeRenderLoopPocReport,
  runXTensionsThreeRenderLoopPocSuite
};
