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
  REACT_POC_BOUNDARIES,
  REACT_POC_CONTEXT_LEAK_CODE,
  REACT_POC_ERROR_BOUNDARY_CODE,
  REACT_POC_FRAMEWORK_DEPENDENCY_CODE,
  REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  REACT_POC_STORE_LEAK_CODE,
  REACT_POC_SUSPENSE_BOUNDARY_CODE,
  REACT_SCHEDULING_HINTS,
  XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_CONTRACT_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_PACKAGE_SCRIPT,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_SUITE_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_TYPES_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
  XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA,
  XTENSIONS_REACT_RENDER_RECORD_SCHEMA,
  XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA,
  assertReactPocDependencyBoundary,
  createFrameworklessReactHostControllerPoc,
  createReactHostControllerPocContract,
  createReactHostControllerPocReport,
  createReactRuntimeAdapterRecord,
  decideReactSchedulingHint,
  inspectReactPayloadBoundary,
  serializeReactHostControllerPocReport
} = require('../../tools/xtensions/react-host-controller-poc');

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
    return `2026-06-20T05:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runXTensionsReactHostControllerPocSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-react-host-controller-poc',
    label: 'XTensions React HostController PoC and Scheduling Hints Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsReactHostControllerPoc;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const runtimeRegistryContract = readText(RUNTIME_REGISTRY_CONTRACT_PATH, rootDir);
  const reactContract = readText(XTENSIONS_REACT_HOST_CONTROLLER_POC_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_REACT_HOST_CONTROLLER_POC_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_REACT_HOST_CONTROLLER_POC_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, RUNTIME_REGISTRY_CONTRACT_PATH, rootDir, 'XTensions runtime registry contract exists');
  assertFileExists(context, XTENSIONS_REACT_HOST_CONTROLLER_POC_CONTRACT_PATH, rootDir, 'XTensions React HostController PoC contract exists');
  assertFileExists(context, XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH, rootDir, 'XTensions React HostController PoC module exists');
  assertFileExists(context, XTENSIONS_REACT_HOST_CONTROLLER_POC_TYPES_PATH, rootDir, 'XTensions React HostController PoC types exist');
  assertFileExists(context, XTENSIONS_REACT_HOST_CONTROLLER_POC_SUITE_PATH, rootDir, 'XTensions React HostController PoC suite exists');
  assertFileExists(context, XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH, rootDir, 'XTensions React HostController PoC fixture exists');
  context.assert(moduleSyntax.ok, `XTensions React HostController PoC module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions React HostController PoC suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(moduleText.includes("kind: REACT_RENDER_OUTCOME_RENDERED"), 'React render helper uses explicit rendered union outcome');
  context.assert(moduleText.includes("kind: REACT_RENDER_OUTCOME_BLOCKED"), 'React render helper uses explicit blocked union outcome');
  context.assert(!moduleText.includes('rendered.schema'), 'React render callers do not infer blocked results from schema presence');
  context.assert(moduleText.includes('Deterministic key order for report serialization'), 'React report serialization documents deterministic key order');
  context.assert(moduleText.includes('legacy HostController diagnostic alias'), 'React diagnostics document legacy details alias');

  context.assert(metadata && metadata.schema === XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA, 'package metadata declares React HostController PoC schema');
  context.assert(metadata && metadata.contractSchema === XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA, 'package metadata declares React HostController contract schema');
  context.assert(metadata && metadata.schedulingDecisionSchema === XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA, 'package metadata declares scheduling decision schema');
  context.assert(metadata && metadata.renderRecordSchema === XTENSIONS_REACT_RENDER_RECORD_SCHEMA, 'package metadata declares render record schema');
  context.assert(metadata && metadata.boundaryRecordSchema === XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA, 'package metadata declares boundary record schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA, 'package metadata declares React report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.runtimeReportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata links runtime report schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE, 'package metadata points to XTN-06');
  context.assert(metadata && metadata.module === XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH, 'package metadata points to React PoC module');
  context.assert(metadata && metadata.types === XTENSIONS_REACT_HOST_CONTROLLER_POC_TYPES_PATH, 'package metadata points to React PoC types');
  context.assert(metadata && metadata.fixture === XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH, 'package metadata points to React PoC fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_REACT_HOST_CONTROLLER_POC_CONTRACT_PATH, 'package metadata points to React PoC contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-react-host-controller-poc --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_REACT_HOST_CONTROLLER_POC_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids React runtime execution');
  context.assert(metadata && metadata.peerHarness === 'external-opt-in', 'package metadata marks external opt-in peer harness');

  const exportEntry = packageManifest.exports['./xtensions/react-host-controller-poc'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/react-host-controller-poc.js', 'package exports React HostController PoC module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/react-host-controller-poc.d.ts', 'package exports React HostController PoC types');
  context.assert(packageManifest.scripts['test:xtensions-react-host-controller-poc'] === 'node scripts/run_xtend_tests.js xtensions-react-host-controller-poc', 'package exposes React HostController PoC script');
  context.assert(runner.includes("id: 'xtensions-react-host-controller-poc'"), 'test runner exposes xtensions-react-host-controller-poc suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-react-host-controller-poc'), 'runner help references React HostController PoC gate');

  context.assert(backlog.includes('| `XTN-06` | P1 | completed | WS6 |'), 'backlog marks XTN-06 completed');
  context.assert(backlog.includes('development/XTensions-React-HostController-PoC-and-Scheduling-Hints-Contract.md'), 'backlog references React HostController PoC contract');
  context.assert(architectureContract.includes('External frameworks are orchestration targets, not XTend dependencies.'), 'architecture contract keeps React dependency boundary');
  context.assert(hostControllerContract.includes('createFrameworklessHostControllerStub()'), 'HostController contract remains linked');
  context.assert(signalBridgeContract.includes('KernelSignal'), 'Signal Bridge contract remains linked');
  context.assert(runtimeRegistryContract.includes('external-peer'), 'Runtime registry contract keeps peer dependency classification');
  context.assert(reactContract.includes('startTransition` ist in XTensions nie harte Kernel-Prioritaetskontrolle'), 'React contract documents startTransition as hint only');
  context.assert(reactContract.includes('node scripts/run_xtend_tests.js xtensions-react-host-controller-poc --json'), 'React contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.react-host-controller-poc.fixture.v1', 'fixture declares React HostController PoC fixture schema');
  context.assert(fixture.expectedXtensionId === 'xtension.react.todo', 'fixture names expected XTension id');
  context.assert(fixture.expectedFramework === 'react', 'fixture names React framework');
  assertIncludesAll(context, fixture.expectedHints, REACT_SCHEDULING_HINTS, 'fixture names all expected scheduling hints');

  const dependencyBoundary = assertReactPocDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  });
  context.assert(dependencyBoundary.ok, `React HostController PoC sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependencyBoundary = assertReactPocDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(
    badDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === REACT_POC_FRAMEWORK_DEPENDENCY_CODE),
    'React HostController PoC dependency guard rejects React imports'
  );

  const contract = createReactHostControllerPocContract(fixture.contract);
  context.assert(contract.schema === XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA, 'React PoC contract emits schema');
  context.assert(contract.framework === 'react', 'React PoC contract names React as data');
  context.assert(contract.peerMode === 'external-opt-in-peer-harness', 'React PoC contract keeps peer harness external');
  context.assert(contract.frameworkDependenciesAllowed === false, 'React PoC contract blocks framework dependencies');
  assertIncludesAll(context, contract.schedulingHints, REACT_SCHEDULING_HINTS, 'React PoC contract exposes scheduling hints');
  assertIncludesAll(context, contract.boundaries, REACT_POC_BOUNDARIES, 'React PoC contract exposes boundaries');

  const adapter = createReactRuntimeAdapterRecord({
    ...fixture.adapter,
    contract: fixture.contract,
    xtensionId: fixture.expectedXtensionId
  });
  context.assert(adapter.framework === 'react', 'React runtime adapter record names React as data');
  context.assert(adapter.dependencies.every((dependency) => dependency.classification === 'external-peer'), 'React runtime adapter dependencies stay external-peer');
  context.assert(adapter.dependencies.every((dependency) => dependency.bundled === false && dependency.packageIncluded === false), 'React runtime adapter dependencies are not bundled or packaged');
  context.assert(adapter.requiredHostCapabilities.includes('react.scheduling.hints'), 'React runtime adapter requires scheduling hints capability');

  const defaultDecision = decideReactSchedulingHint({ lane: 'fabric.default', priorityHint: 'transition', budgetMs: 16 }, { clock: createClock() });
  const syncDecision = decideReactSchedulingHint({ lane: 'fabric.input', priorityHint: 'user-blocking', budgetMs: 8 }, { clock: createClock() });
  const idleDecision = decideReactSchedulingHint({ lane: 'fabric.background', priorityHint: 'low', budgetMs: 4 }, { clock: createClock() });
  const suspenseDecision = decideReactSchedulingHint({ lane: 'fabric.default', priorityHint: 'transition', suspense: true }, { clock: createClock() });
  context.assert(defaultDecision.hint === 'startTransition-hint' && defaultDecision.startTransitionEligible === true, 'default lane emits startTransition hint');
  context.assert(syncDecision.hint === 'sync-render-hint' && syncDecision.syncRenderEligible === true, 'input lane emits sync render hint');
  context.assert(idleDecision.hint === 'idle-defer-hint', 'background lane emits idle defer hint');
  context.assert(suspenseDecision.hint === 'suspense-placeholder-hint', 'suspense state emits placeholder hint');
  context.assert([defaultDecision, syncDecision, idleDecision, suspenseDecision].every((decision) => decision.hardKernelPriorityControl === false), 'React scheduling hints never claim hard kernel priority control');

  const safePayload = inspectReactPayloadBoundary({ items: ['alpha'], state: { selected: true } });
  context.assert(safePayload.ok === true && safePayload.contextBoundary === 'internal-only', 'safe React payload stays serializable and context-internal');
  const contextLeak = inspectReactPayloadBoundary({ reactContext: { theme: 'dark' } });
  context.assert(contextLeak.ok === false && diagnosticCodes(contextLeak).includes(REACT_POC_CONTEXT_LEAK_CODE), 'React context leak is diagnosed');
  const storeLeak = inspectReactPayloadBoundary({ reduxStore: { dispatch: 'forbidden' } });
  context.assert(storeLeak.ok === false && diagnosticCodes(storeLeak).includes(REACT_POC_STORE_LEAK_CODE), 'React store leak is diagnosed');
  const functionLeak = inspectReactPayloadBoundary({ onClick() {} });
  context.assert(functionLeak.ok === false && diagnosticCodes(functionLeak).includes(REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE), 'non-serializable React payload is diagnosed');

  const hostController = createFrameworklessReactHostControllerPoc({
    xtensionId: fixture.expectedXtensionId,
    hostId: 'react-poc-test-host',
    surfaceId: 'surface.react.todo',
    clock: createClock()
  });
  const mount = hostController.mount({ id: 'react-poc-container' }, { items: ['alpha'] }, {
    lane: 'fabric.default',
    priorityHint: 'transition',
    budgetMs: 16
  });
  context.assert(mount.status === 'ok', 'React frameworkless HostController PoC mounts');
  context.assert(mount.metadata.schedulingDecision.hint === 'startTransition-hint', 'mount records startTransition hint');
  const inputUpdate = hostController.update({
    lane: 'fabric.input',
    priorityHint: 'user-blocking',
    budgetMs: 8,
    payload: { items: ['alpha', 'beta'] }
  });
  context.assert(inputUpdate.status === 'ok' && inputUpdate.metadata.schedulingDecision.hint === 'sync-render-hint', 'input update records sync render hint');
  const idleUpdate = hostController.update({
    lane: 'fabric.background',
    priorityHint: 'low',
    budgetMs: 4,
    payload: { items: ['alpha', 'beta', 'gamma'] }
  });
  context.assert(idleUpdate.status === 'ok' && idleUpdate.metadata.schedulingDecision.hint === 'idle-defer-hint', 'background update records idle defer hint');
  const suspenseUpdate = hostController.update({
    lane: 'fabric.default',
    priorityHint: 'transition',
    payload: { suspensePending: true, fallbackLabel: 'Loading' }
  });
  context.assert(suspenseUpdate.status === 'degraded', 'Suspense update degrades through boundary');
  context.assert(diagnosticCodes(suspenseUpdate).includes(REACT_POC_SUSPENSE_BOUNDARY_CODE), 'Suspense boundary diagnostic is emitted');
  const errorBoundary = hostController.reportError(new Error('fixture error'), { phase: 'render' });
  context.assert(errorBoundary.status === 'degraded', 'Error boundary reports degraded result');
  context.assert(diagnosticCodes(errorBoundary).includes(REACT_POC_ERROR_BOUNDARY_CODE), 'Error boundary diagnostic is emitted');
  const leakUpdate = hostController.update({
    lane: 'fabric.default',
    payload: { providerValue: { theme: 'dark' } }
  });
  context.assert(leakUpdate.status === 'failed', 'React context/provider leak fails update');
  context.assert(diagnosticCodes(leakUpdate).includes(REACT_POC_CONTEXT_LEAK_CODE), 'Provider leak diagnostic is emitted');
  const unmount = hostController.unmount('suite-complete');
  context.assert(unmount.status === 'ok', 'React frameworkless HostController PoC unmounts');
  context.assert(unmount.cleanupRecords.length >= 4, 'React frameworkless HostController PoC releases cleanup resources');
  const unmountAgain = hostController.unmount('suite-complete-repeat');
  context.assert(unmountAgain.status === 'skipped', 'React frameworkless HostController PoC unmount is idempotent');
  const snapshot = hostController.snapshot();
  context.assert(snapshot.reactContextExternalized === false, 'React context remains host-internal in snapshot');
  context.assert(hostController.getSchedulingDecisions().length >= 4, 'React frameworkless HostController PoC exposes scheduling decisions');
  context.assert(hostController.getRenderRecords().every((record) => record.hardKernelPriorityControl === false), 'React render records keep kernel priority hard-control false');
  context.assert(hostController.getBoundaryRecords().length >= 2, 'React frameworkless HostController PoC exposes boundary records');

  const report = createReactHostControllerPocReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA, 'React PoC report emits schema');
  context.assert(report.ok === true && report.status === 'ready', 'React PoC fixture report is ready');
  context.assert(report.runtimeExecutionRequired === false && report.reactRuntimeImported === false, 'React PoC report requires no React runtime import');
  context.assert(report.runtimeReport.status === 'ready', 'React PoC runtime report is ready with external peers available');
  context.assert(report.runtimeRegistry.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'React PoC report embeds runtime registry');
  context.assert(report.schedulingDecisions.some((decision) => decision.hint === 'startTransition-hint'), 'React PoC report includes startTransition hint');
  context.assert(report.schedulingDecisions.some((decision) => decision.hint === 'sync-render-hint'), 'React PoC report includes sync render hint');
  context.assert(report.schedulingDecisions.some((decision) => decision.hint === 'idle-defer-hint'), 'React PoC report includes idle defer hint');
  context.assert(report.schedulingDecisions.some((decision) => decision.hint === 'suspense-placeholder-hint'), 'React PoC report includes suspense placeholder hint');
  context.assert(report.boundaryRecords.some((record) => record.kind === 'suspense'), 'React PoC report includes Suspense boundary record');
  context.assert(report.cleanupRecords.length > 0, 'React PoC report includes cleanup records');

  const serialized = serializeReactHostControllerPocReport(report);
  const repeat = serializeReactHostControllerPocReport(createReactHostControllerPocReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'React HostController PoC report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA, 'serialized React HostController PoC report is parseable JSON');

  return context.result({
    schema: XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA,
    pocSchema: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    module: XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH,
    suite: XTENSIONS_REACT_HOST_CONTROLLER_POC_SUITE_PATH,
    fixture: XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH,
    schedulingDecisionCount: report.schedulingDecisions.length,
    renderRecordCount: report.renderRecords.length,
    boundaryRecordCount: report.boundaryRecords.length
  });
}

function printXTensionsReactHostControllerPocReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions React HostController PoC and Scheduling Hints Contract erfolgreich.',
    failureTitle: 'XTensions React HostController PoC and Scheduling Hints Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsReactHostControllerPocReport,
  runXTensionsReactHostControllerPocSuite
};
