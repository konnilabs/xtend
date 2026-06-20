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
  RMT_VNEXT_SCHEDULER_SCHEMA
} = require('../../tools/rmt-language/vnext-scheduler');
const {
  BACKPRESSURE_POLICIES,
  DELIVERY_MODES,
  PRIORITY_HINTS,
  SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE,
  SIGNAL_BRIDGE_DEAD_LETTER_REQUIRED_CODE,
  SIGNAL_BRIDGE_DIRECTION_INVALID_CODE,
  SIGNAL_BRIDGE_FRAMEWORK_DEPENDENCY_CODE,
  SIGNAL_BRIDGE_LANE_UNKNOWN_CODE,
  SIGNAL_BRIDGE_OWNER_MISSING_CODE,
  SIGNAL_BRIDGE_PAYLOAD_SCHEMA_MISSING_CODE,
  SIGNAL_BRIDGE_RATE_LIMIT_INVALID_CODE,
  SIGNAL_BRIDGE_TARGET_MISSING_CODE,
  SIGNAL_BRIDGE_TRUST_BOUNDARY_INVALID_CODE,
  SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE,
  TRUST_BOUNDARIES,
  XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH,
  XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH,
  XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH,
  XTENSIONS_SIGNAL_BRIDGE_PACKAGE_SCRIPT,
  XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH,
  XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH,
  XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE,
  XTENSIONS_SURFACE_EVENT_SCHEMA,
  assertSignalBridgeDependencyBoundary,
  createKernelSignal,
  createSignalBridgeReport,
  createSurfaceEvent,
  createXTensionsSignalBridgeContract,
  listGovernedFrameworks,
  normalizeGovernanceMatrix,
  serializeSignalBridgeReport
} = require('../../tools/xtensions/signal-bridge-contract');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';

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
    return `2026-06-20T01:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runXTensionsSignalBridgeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-signal-bridge',
    label: 'XTensions Signal Bridge and Event Governance Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsSignalBridge;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract document exists');
  assertFileExists(context, XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH, rootDir, 'XTensions Signal Bridge module exists');
  assertFileExists(context, XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH, rootDir, 'XTensions Signal Bridge types exist');
  assertFileExists(context, XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH, rootDir, 'XTensions Signal Bridge suite exists');
  assertFileExists(context, XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH, rootDir, 'XTensions Signal Bridge fixture exists');
  context.assert(moduleSyntax.ok, `XTensions Signal Bridge module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions Signal Bridge suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'package metadata declares Signal Bridge schema');
  context.assert(metadata && metadata.kernelSignalSchema === XTENSIONS_KERNEL_SIGNAL_SCHEMA, 'package metadata declares KernelSignal schema');
  context.assert(metadata && metadata.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'package metadata declares SurfaceEvent schema');
  context.assert(metadata && metadata.governanceMatrixSchema === XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA, 'package metadata declares Governance Matrix schema');
  context.assert(metadata && metadata.deadLetterSchema === XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA, 'package metadata declares Dead Letter schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA, 'package metadata declares Signal Bridge report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.schedulerSchema === RMT_VNEXT_SCHEDULER_SCHEMA, 'package metadata links scheduler schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE, 'package metadata points to XTN-02');
  context.assert(metadata && metadata.module === XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH, 'package metadata points to Signal Bridge module');
  context.assert(metadata && metadata.types === XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH, 'package metadata points to Signal Bridge types');
  context.assert(metadata && metadata.fixture === XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH, 'package metadata points to Signal Bridge fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH, 'package metadata points to Signal Bridge suite');
  context.assert(metadata && metadata.contract === XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH, 'package metadata points to Signal Bridge contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-signal-bridge --json', 'package metadata declares Signal Bridge local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_SIGNAL_BRIDGE_PACKAGE_SCRIPT, 'package metadata declares Signal Bridge package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');

  const exportEntry = packageManifest.exports['./xtensions/signal-bridge-contract'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/signal-bridge-contract.js', 'package exports Signal Bridge contract module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/signal-bridge-contract.d.ts', 'package exports Signal Bridge contract types');
  context.assert(packageManifest.scripts['test:xtensions-signal-bridge'] === 'node scripts/run_xtend_tests.js xtensions-signal-bridge', 'package exposes Signal Bridge test script');
  context.assert(runner.includes("id: 'xtensions-signal-bridge'"), 'test runner exposes xtensions-signal-bridge suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-signal-bridge'), 'runner help references Signal Bridge gate');

  context.assert(backlog.includes('| `XTN-02` | P0 | completed | WS2 |'), 'backlog marks XTN-02 completed');
  context.assert(backlog.includes('development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md'), 'backlog references Signal Bridge contract');
  context.assert(architectureContract.includes('no-implicit-global-framework-event-bus'), 'architecture contract keeps global bus boundary');
  context.assert(hostControllerContract.includes('Fabric, Lanes, Fibers, Signals und Reactivity'), 'HostController contract links native orchestration vocabulary');
  context.assert(signalBridgeContract.includes('Contract: `xtend.xtensions.signal-bridge.v1`'), 'Signal Bridge contract declares schema');
  context.assert(signalBridgeContract.includes('Wildcard-, Global- oder Bus-artige Eventnamen sind verboten'), 'Signal Bridge contract bans wildcard events');
  context.assert(signalBridgeContract.includes('node scripts/run_xtend_tests.js xtensions-signal-bridge --json'), 'Signal Bridge contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.signal-bridge.fixture.v1', 'fixture declares Signal Bridge fixture schema');
  context.assert(fixture.contract === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'fixture points to Signal Bridge contract');
  context.assert(fixture.hostControllerContract === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'fixture points to HostController contract');
  context.assert(fixture.dependencyPolicy && fixture.dependencyPolicy.frameworkDependenciesAllowed === false, 'fixture blocks framework dependencies');
  context.assert(fixture.dependencyPolicy && fixture.dependencyPolicy.vendoredFrameworksAllowed === false, 'fixture blocks vendored frameworks');
  context.assert(fixture.kernelSignals.length === 2, 'fixture contains downstream KernelSignals');
  context.assert(fixture.surfaceEvents.length === 2, 'fixture contains upstream SurfaceEvents');
  assertIncludesAll(context, fixture.expectedGovernedFrameworks, ['react', 'vue', 'leaflet', 'chart.js', 'three'], 'fixture names governed framework classes');

  const dependencyCheck = assertSignalBridgeDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  });
  context.assert(dependencyCheck.ok, `Signal Bridge package, module and fixture avoid framework imports${dependencyCheck.ok ? '' : ` (${dependencyCheck.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependencyCheck = assertSignalBridgeDependencyBoundary({
    sourceText: "const React = require('react');"
  });
  context.assert(
    badDependencyCheck.diagnostics.some((diagnostic) => diagnostic.code === SIGNAL_BRIDGE_FRAMEWORK_DEPENDENCY_CODE),
    'Signal Bridge dependency guard rejects framework imports'
  );

  const contract = createXTensionsSignalBridgeContract();
  context.assert(contract.schema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'contract factory exposes Signal Bridge schema');
  context.assert(contract.kernelSignalSchema === XTENSIONS_KERNEL_SIGNAL_SCHEMA, 'contract factory exposes KernelSignal schema');
  context.assert(contract.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'contract factory exposes SurfaceEvent schema');
  context.assert(contract.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'contract factory links HostController schema');
  context.assert(contract.schedulerSchema === RMT_VNEXT_SCHEDULER_SCHEMA, 'contract factory links scheduler schema');
  context.assert(contract.dependencyPolicy.frameworkDependenciesAllowed === false, 'contract factory blocks framework dependencies');
  assertIncludesAll(context, contract.canonicalLanes, ['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics'], 'contract factory exposes canonical lanes');
  assertIncludesAll(context, contract.deliveryModes, DELIVERY_MODES, 'contract factory exposes delivery modes');
  assertIncludesAll(context, contract.trustBoundaries, TRUST_BOUNDARIES, 'contract factory exposes trust boundaries');
  assertIncludesAll(context, contract.backpressurePolicies, BACKPRESSURE_POLICIES, 'contract factory exposes backpressure policies');
  assertIncludesAll(context, listGovernedFrameworks(), fixture.expectedGovernedFrameworks, 'default governance matrix covers expected framework classes');

  const normalizedMatrix = normalizeGovernanceMatrix();
  context.assert(normalizedMatrix.length === 5, 'default governance matrix has five framework classes');
  context.assert(normalizedMatrix.every((entry) => entry.schema === XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA), 'governance matrix entries keep schema');
  context.assert(normalizedMatrix.every((entry) => entry.hostMode === 'frameworkless-contract-stub'), 'governance matrix stays frameworkless');

  const report = createSignalBridgeReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA, 'Signal Bridge report emits report schema');
  context.assert(report.bridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'Signal Bridge report links bridge schema');
  context.assert(report.kernelSignalSchema === XTENSIONS_KERNEL_SIGNAL_SCHEMA, 'Signal Bridge report links KernelSignal schema');
  context.assert(report.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'Signal Bridge report links SurfaceEvent schema');
  context.assert(report.deadLetterSchema === XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA, 'Signal Bridge report links Dead Letter schema');
  context.assert(report.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'Signal Bridge report links HostController schema');
  context.assert(report.schedulerSchema === RMT_VNEXT_SCHEDULER_SCHEMA, 'Signal Bridge report links scheduler schema');
  context.assert(report.ok === true && report.status === 'ready', 'valid Signal Bridge fixture is ready');
  context.assert(report.kernelSignalCount === 2, 'Signal Bridge report includes two KernelSignals');
  context.assert(report.surfaceEventCount === 2, 'Signal Bridge report includes two SurfaceEvents');
  context.assert(report.governanceMatrixCount === 5, 'Signal Bridge report includes governance matrix');
  context.assert(report.deadLetterCount === 0, 'valid Signal Bridge fixture has no dead letters');
  context.assert(report.kernelSignals.every((signal) => signal.schema === XTENSIONS_KERNEL_SIGNAL_SCHEMA), 'KernelSignals keep schema');
  context.assert(report.surfaceEvents.every((event) => event.schema === XTENSIONS_SURFACE_EVENT_SCHEMA), 'SurfaceEvents keep schema');
  context.assert(report.surfaceEvents.every((event) => event.direction === 'upstream'), 'SurfaceEvents are upstream only');
  context.assert(report.surfaceEvents.every((event) => event.owner.known === true), 'SurfaceEvents keep owner');
  context.assert(report.surfaceEvents.every((event) => event.payloadSchema), 'SurfaceEvents keep payload schema');
  context.assert(report.indexes.byLane.transition.includes('signal.react.todo.props.v1'), 'Signal Bridge indexes transition lane');
  context.assert(report.indexes.byLane.diagnostics.includes('event.three.frame.budget.v1'), 'Signal Bridge indexes diagnostics lane');
  context.assert(report.indexes.byFramework.three.backpressure === 'sample', 'Signal Bridge indexes three backpressure policy');

  const aliasedSignal = createKernelSignal({
    type: 'props.update',
    target: {
      hostId: 'host',
      surfaceId: 'surface',
      xtensionId: 'xtension'
    },
    lane: 'critical',
    schemaRef: 'xtend.schemas.props.v1',
    policy: {
      deliveryMode: 'queued',
      ttlMs: 1000,
      correlationId: 'required',
      idempotencyKey: 'required',
      deadLetter: 'required'
    }
  }, { clock: createClock() });
  context.assert(aliasedSignal.lane === 'user-blocking' && aliasedSignal.ok === true, 'KernelSignal normalizes critical lane alias');
  assertIncludesAll(context, PRIORITY_HINTS, ['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics'], 'Signal Bridge priority hints follow canonical lanes');

  const upstreamEvent = createSurfaceEvent(fixture.surfaceEvents[0], { clock: createClock() });
  context.assert(upstreamEvent.ok === true && upstreamEvent.schema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'SurfaceEvent factory accepts valid fixture event');

  const invalidFixture = cloneJson(fixture);
  invalidFixture.surfaceEvents[0].event = '*';
  invalidFixture.surfaceEvents[0].direction = 'sideways';
  invalidFixture.surfaceEvents[0].owner = {};
  invalidFixture.surfaceEvents[0].payloadSchema = '';
  invalidFixture.surfaceEvents[0].lane = 'global-lane';
  invalidFixture.surfaceEvents[0].trustBoundary = 'global';
  const invalidReport = createSignalBridgeReport(invalidFixture, { clock: createClock() });
  const invalidCodes = diagnosticCodes(invalidReport);
  context.assert(invalidReport.ok === false && invalidReport.status === 'blocked', 'invalid SurfaceEvent blocks Signal Bridge report');
  context.assert(invalidCodes.includes(SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE), 'wildcard SurfaceEvent diagnostic is emitted');
  context.assert(invalidCodes.includes(SIGNAL_BRIDGE_DIRECTION_INVALID_CODE), 'invalid SurfaceEvent direction diagnostic is emitted');
  context.assert(invalidCodes.includes(SIGNAL_BRIDGE_OWNER_MISSING_CODE), 'missing SurfaceEvent owner diagnostic is emitted');
  context.assert(invalidCodes.includes(SIGNAL_BRIDGE_PAYLOAD_SCHEMA_MISSING_CODE), 'missing SurfaceEvent payload schema diagnostic is emitted');
  context.assert(invalidCodes.includes(SIGNAL_BRIDGE_LANE_UNKNOWN_CODE), 'unknown SurfaceEvent lane diagnostic is emitted');
  context.assert(invalidCodes.includes(SIGNAL_BRIDGE_TRUST_BOUNDARY_INVALID_CODE), 'invalid SurfaceEvent trust boundary diagnostic is emitted');
  context.assert(invalidReport.deadLetterCount >= 6, 'invalid SurfaceEvent creates dead-letter records');

  const invalidSignalFixture = cloneJson(fixture);
  invalidSignalFixture.kernelSignals[0].target.hostId = '';
  invalidSignalFixture.kernelSignals[0].target.surfaceId = '';
  invalidSignalFixture.kernelSignals[0].target.xtensionId = '';
  invalidSignalFixture.kernelSignals[0].policy.backpressure = 'broadcast';
  invalidSignalFixture.kernelSignals[0].policy.deadLetter = false;
  invalidSignalFixture.kernelSignals[0].policy.rateLimit.windowMs = 0;
  const invalidSignalReport = createSignalBridgeReport(invalidSignalFixture, { clock: createClock() });
  const invalidSignalCodes = diagnosticCodes(invalidSignalReport);
  context.assert(invalidSignalReport.ok === false, 'invalid KernelSignal blocks Signal Bridge report');
  context.assert(invalidSignalCodes.includes(SIGNAL_BRIDGE_TARGET_MISSING_CODE), 'missing KernelSignal target diagnostic is emitted');
  context.assert(invalidSignalCodes.includes(SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE), 'invalid backpressure diagnostic is emitted');
  context.assert(invalidSignalCodes.includes(SIGNAL_BRIDGE_DEAD_LETTER_REQUIRED_CODE), 'missing dead letter diagnostic is emitted');
  context.assert(invalidSignalCodes.includes(SIGNAL_BRIDGE_RATE_LIMIT_INVALID_CODE), 'invalid rate limit diagnostic is emitted');

  const invalidMatrixReport = createSignalBridgeReport({
    kernelSignals: fixture.kernelSignals,
    surfaceEvents: fixture.surfaceEvents,
    governanceMatrix: [
      {
        framework: 'custom',
        defaultLane: 'visible',
        emittedEvents: ['*'],
        backpressure: 'coalesce-by-target',
        trustBoundary: 'same-origin-adapter'
      }
    ]
  }, { clock: createClock() });
  context.assert(invalidMatrixReport.ok === false, 'wildcard governance matrix event blocks Signal Bridge report');
  context.assert(diagnosticCodes(invalidMatrixReport).includes(SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE), 'wildcard governance matrix diagnostic is emitted');

  const serialized = serializeSignalBridgeReport(report);
  const repeat = serializeSignalBridgeReport(createSignalBridgeReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'Signal Bridge report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA, 'serialized Signal Bridge report is parseable JSON');

  return context.result({
    schema: XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA,
    contractSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    workpackage: XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE,
    module: XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH,
    suite: XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH,
    fixture: XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH,
    kernelSignalCount: report.kernelSignalCount,
    surfaceEventCount: report.surfaceEventCount,
    governanceMatrixCount: report.governanceMatrixCount
  });
}

function printXTensionsSignalBridgeReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Signal Bridge and Event Governance Contract erfolgreich.',
    failureTitle: 'XTensions Signal Bridge and Event Governance Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsSignalBridgeReport,
  runXTensionsSignalBridgeSuite
};
