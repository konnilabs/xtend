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
  CHART_UPDATE_MODE_UNSUPPORTED_CODE,
  CHART_UPDATE_MODES,
  IMPERATIVE_POC_API_LEAK_CODE,
  IMPERATIVE_POC_BOUNDARIES,
  IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE,
  IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  IMPERATIVE_RESIZE_INVALID_CODE,
  IMPERATIVE_VISIBILITY_INVALID_CODE,
  LEAFLET_EVENT_RATE_LIMIT_CODE,
  LEAFLET_EVENT_TYPES,
  LEAFLET_EVENT_UNSUPPORTED_CODE,
  XTENSIONS_CHART_UPDATE_RECORD_SCHEMA,
  XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA,
  XTENSIONS_IMPERATIVE_HOST_POCS_CONTRACT_PATH,
  XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH,
  XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH,
  XTENSIONS_IMPERATIVE_HOST_POCS_PACKAGE_SCRIPT,
  XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
  XTENSIONS_IMPERATIVE_HOST_POCS_SUITE_PATH,
  XTENSIONS_IMPERATIVE_HOST_POCS_TYPES_PATH,
  XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
  XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA,
  XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA,
  XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA,
  XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA,
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
  assertImperativePocDependencyBoundary,
  createChartRuntimeAdapterRecord,
  createChartUpdateRecord,
  createFrameworklessChartHostControllerPoc,
  createFrameworklessLeafletHostControllerPoc,
  createImperativeHostPocContract,
  createImperativeHostPocReport,
  createLeafletEventRecord,
  createLeafletRuntimeAdapterRecord,
  inspectImperativePayloadBoundary,
  normalizeResizeRecord,
  normalizeVisibilityRecord,
  resolveHostResourceCleanupSchema,
  serializeImperativeHostPocReport
} = require('../../tools/xtensions/imperative-host-pocs');
const {
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS,
  createHostResourceCleanupRecord
} = require('../../tools/xtensions/host-resource-cleanup-record');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';
const SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';
const RUNTIME_REGISTRY_CONTRACT_PATH = 'development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md';
const HOST_RESOURCE_CLEANUP_MODULE_PATH = 'tools/xtensions/host-resource-cleanup-record.js';
const HOST_RESOURCE_CLEANUP_TYPES_PATH = 'tools/xtensions/host-resource-cleanup-record.d.ts';
const HOST_RESOURCE_CLEANUP_FIELDS = Object.freeze([
  'hostId',
  'resource',
  'schema',
  'sequence',
  'status',
  'surfaceId',
  'timestamp',
  'xtensionId'
]);
const EXPECTED_LEGACY_CLEANUP_SCHEMAS = Object.freeze([
  'xtend.xtensions.chart-cleanup-record.v1',
  'xtend.xtensions.leaflet-cleanup-record.v1',
  'xtend.xtensions.react-host-controller-cleanup-record.v1',
  'xtend.xtensions.three-cleanup-record.v1',
  'xtend.xtensions.vue-host-controller-cleanup-record.v1'
]);

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
    return `2026-06-20T08:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function allDependencies(record) {
  return (record && Array.isArray(record.dependencies)) ? record.dependencies : [];
}

function runXTensionsImperativeHostPocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-imperative-host-pocs',
    label: 'XTensions Chart.js and Leaflet Imperative Host PoCs Contract'
  });

  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsImperativeHostPocs;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const runtimeRegistryContract = readText(RUNTIME_REGISTRY_CONTRACT_PATH, rootDir);
  const imperativeContract = readText(XTENSIONS_IMPERATIVE_HOST_POCS_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_IMPERATIVE_HOST_POCS_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH, { rootDir, extension: '.js' });
  const cleanupModuleSyntax = syntaxCheckFile(HOST_RESOURCE_CLEANUP_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_IMPERATIVE_HOST_POCS_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, RUNTIME_REGISTRY_CONTRACT_PATH, rootDir, 'XTensions runtime registry contract exists');
  assertFileExists(context, XTENSIONS_IMPERATIVE_HOST_POCS_CONTRACT_PATH, rootDir, 'XTensions imperative host PoCs contract exists');
  assertFileExists(context, XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH, rootDir, 'XTensions imperative host PoCs module exists');
  assertFileExists(context, XTENSIONS_IMPERATIVE_HOST_POCS_TYPES_PATH, rootDir, 'XTensions imperative host PoCs types exist');
  assertFileExists(context, XTENSIONS_IMPERATIVE_HOST_POCS_SUITE_PATH, rootDir, 'XTensions imperative host PoCs suite exists');
  assertFileExists(context, XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH, rootDir, 'XTensions imperative host PoCs fixture exists');
  assertFileExists(context, HOST_RESOURCE_CLEANUP_MODULE_PATH, rootDir, 'shared host resource cleanup module exists');
  assertFileExists(context, HOST_RESOURCE_CLEANUP_TYPES_PATH, rootDir, 'shared host resource cleanup types exist');
  context.assert(moduleSyntax.ok, `XTensions imperative host PoCs module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(cleanupModuleSyntax.ok, `shared host resource cleanup module syntax passes${cleanupModuleSyntax.ok ? '' : ` (${cleanupModuleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions imperative host PoCs suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(typesText.includes('HostResourceCleanupRecord[]'), 'imperative host declarations expose precise shared cleanup record types');

  context.assert(
    JSON.stringify(XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS) === JSON.stringify(EXPECTED_LEGACY_CLEANUP_SCHEMAS),
    'shared cleanup contract declares exactly the five migrated legacy schema IDs'
  );
  const canonicalResolution = resolveHostResourceCleanupSchema(XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA);
  context.assert(
    canonicalResolution && canonicalResolution.canonicalSchemaId === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA
      && canonicalResolution.inputSchemaId === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA
      && canonicalResolution.isLegacy === false && canonicalResolution.deprecated === false,
    'cleanup resolver recognizes the canonical schema without deprecation'
  );
  EXPECTED_LEGACY_CLEANUP_SCHEMAS.forEach((legacySchemaId) => {
    const resolution = resolveHostResourceCleanupSchema(legacySchemaId);
    context.assert(
      resolution && resolution.canonicalSchemaId === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA
        && resolution.inputSchemaId === legacySchemaId
        && resolution.isLegacy === true && resolution.deprecated === true,
      `cleanup resolver maps deprecated legacy schema ${legacySchemaId}`
    );
  });
  context.assert(resolveHostResourceCleanupSchema('xtend.xtensions.host-controller-cleanup-record.v1') === null, 'cleanup resolver keeps the six-field HostController record separate');
  context.assert(resolveHostResourceCleanupSchema('xtend.xtensions.unknown-cleanup-record.v1') === null, 'cleanup resolver rejects unknown schema IDs');
  const factoryRecord = createHostResourceCleanupRecord({
    hostId: 'factory-host',
    surfaceId: 'factory-surface',
    xtensionId: 'factory-xtension',
    resource: 'factory-resource',
    sequence: 1,
    timestamp: '2026-06-20T00:00:00Z'
  });
  context.assert(factoryRecord.schema === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA, 'shared cleanup factory always emits the canonical schema ID');
  context.assert(JSON.stringify(Object.keys(factoryRecord).sort()) === JSON.stringify(HOST_RESOURCE_CLEANUP_FIELDS), 'shared cleanup factory emits exactly the eight contract fields');

  context.assert(metadata && metadata.schema === XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA, 'package metadata declares imperative host PoCs schema');
  context.assert(metadata && metadata.contractSchema === XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA, 'package metadata declares imperative host contract schema');
  context.assert(metadata && metadata.chartUpdateRecordSchema === XTENSIONS_CHART_UPDATE_RECORD_SCHEMA, 'package metadata declares Chart update record schema');
  context.assert(metadata && metadata.leafletEventRecordSchema === XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA, 'package metadata declares Leaflet event record schema');
  context.assert(metadata && metadata.resizeRecordSchema === XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA, 'package metadata declares resize record schema');
  context.assert(metadata && metadata.visibilityRecordSchema === XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA, 'package metadata declares visibility record schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA, 'package metadata declares imperative host report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'package metadata links Surface Event schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.runtimeReportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata links runtime report schema');
  context.assert(metadata && metadata.staticContractSchema === XTENSIONS_STATIC_CONTRACT_SCHEMA, 'package metadata links static contract schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE, 'package metadata points to XTN-08');
  context.assert(metadata && metadata.module === XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH, 'package metadata points to imperative host PoCs module');
  context.assert(metadata && metadata.types === XTENSIONS_IMPERATIVE_HOST_POCS_TYPES_PATH, 'package metadata points to imperative host PoCs types');
  context.assert(metadata && metadata.fixture === XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH, 'package metadata points to imperative host PoCs fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_IMPERATIVE_HOST_POCS_CONTRACT_PATH, 'package metadata points to imperative host PoCs contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-imperative-host-pocs --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_IMPERATIVE_HOST_POCS_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids runtime execution');
  context.assert(metadata && metadata.peerHarness === 'external-opt-in', 'package metadata marks external opt-in peer harness');
  context.assert(metadata && metadata.imperativeApiBoundary === 'hostcontroller-only', 'package metadata keeps imperative API behind HostController');
  assertIncludesAll(context, metadata && metadata.frameworks, fixture.expectedFrameworks, 'package metadata names imperative PoC frameworks');

  const exportEntry = packageManifest.exports['./xtensions/imperative-host-pocs'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/imperative-host-pocs.js', 'package exports imperative host PoCs module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/imperative-host-pocs.d.ts', 'package exports imperative host PoCs types');
  context.assert(packageManifest.scripts['test:xtensions-imperative-host-pocs'] === 'node scripts/run_xtend_tests.js xtensions-imperative-host-pocs', 'package exposes imperative host PoCs script');
  context.assert(runner.hasSuite("xtensions-imperative-host-pocs"), 'test runner exposes xtensions-imperative-host-pocs suite');
  context.assert(runner.hasSuite("xtensions-imperative-host-pocs"), 'runner help references imperative host PoCs gate');

  context.assert(backlog.includes('| `XTN-08` | P1/P2 | completed | WS7 |'), 'backlog marks XTN-08 completed');
  context.assert(backlog.includes('development/XTensions-Chart-Leaflet-Imperative-Host-PoCs-Contract.md'), 'backlog references Chart/Leaflet imperative host PoCs contract');
  context.assert(architectureContract.includes('no-framework-test-fixture-dependencies-in-xtend-package'), 'architecture contract keeps no framework fixture dependency boundary');
  context.assert(hostControllerContract.includes('framework-pocs-use-contract-stubs-or-external-opt-in-peer-harnesses'), 'HostController contract keeps external peer harness boundary');
  context.assert(signalBridgeContract.includes('SurfaceEvent'), 'Signal Bridge contract remains linked');
  context.assert(runtimeRegistryContract.includes('external-peer'), 'Runtime registry contract keeps peer dependency classification');
  context.assert(imperativeContract.includes('Chart.js und Leaflet sind nur deklarierte `external-peer` Dependencies.'), 'imperative host PoCs contract rejects bundled framework dependencies');
  context.assert(imperativeContract.includes('node scripts/run_xtend_tests.js xtensions-imperative-host-pocs --json'), 'imperative host PoCs contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.imperative-host-pocs.fixture.v1', 'fixture declares imperative host PoCs fixture schema');
  context.assert(fixture.expectedChartId === 'xtension.chart.sales', 'fixture names expected Chart XTension id');
  context.assert(fixture.expectedLeafletId === 'xtension.leaflet.map', 'fixture names expected Leaflet XTension id');
  assertIncludesAll(context, fixture.expectedChartUpdateModes, CHART_UPDATE_MODES, 'fixture names all expected Chart update modes');
  assertIncludesAll(context, fixture.expectedLeafletEvents, LEAFLET_EVENT_TYPES, 'fixture names all expected Leaflet events');

  const dependencyBoundary = assertImperativePocDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${imperativeContract}`
  });
  context.assert(dependencyBoundary.ok, `imperative host PoC sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badChartDependencyBoundary = assertImperativePocDependencyBoundary({
    sourceText: "import Chart from 'chart.js';"
  });
  context.assert(
    badChartDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE),
    'imperative dependency guard rejects Chart.js imports'
  );
  const badLeafletDependencyBoundary = assertImperativePocDependencyBoundary({
    sourceText: "const L = require('leaflet');"
  });
  context.assert(
    badLeafletDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE),
    'imperative dependency guard rejects Leaflet imports'
  );

  const contract = createImperativeHostPocContract(fixture.contract);
  context.assert(contract.schema === XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA, 'imperative host PoCs contract emits schema');
  context.assert(contract.peerMode === 'external-opt-in-peer-harness', 'imperative host PoCs contract keeps peer harness external');
  context.assert(contract.frameworkDependenciesAllowed === false, 'imperative host PoCs contract blocks framework dependencies');
  context.assert(contract.vendoredFrameworksAllowed === false, 'imperative host PoCs contract blocks vendored frameworks');
  context.assert(contract.runtimeExecutionRequired === false, 'imperative host PoCs contract avoids runtime execution');
  assertIncludesAll(context, contract.chartUpdateModes, CHART_UPDATE_MODES, 'imperative host PoCs contract exposes Chart update modes');
  assertIncludesAll(context, contract.leafletEventTypes, LEAFLET_EVENT_TYPES, 'imperative host PoCs contract exposes Leaflet event types');
  assertIncludesAll(context, contract.boundaries, IMPERATIVE_POC_BOUNDARIES, 'imperative host PoCs contract exposes boundaries');
  context.assert(contract.staticContracts.length === 2, 'imperative host PoCs contract has Chart and Leaflet static contracts');

  const chartAdapter = createChartRuntimeAdapterRecord({
    ...fixture.chart.adapter,
    contract: fixture.contract,
    xtensionId: fixture.expectedChartId
  });
  const leafletAdapter = createLeafletRuntimeAdapterRecord({
    ...fixture.leaflet.adapter,
    contract: fixture.contract,
    xtensionId: fixture.expectedLeafletId
  });
  context.assert(chartAdapter.framework === 'chart.js', 'Chart runtime adapter record names Chart.js as data');
  context.assert(leafletAdapter.framework === 'leaflet', 'Leaflet runtime adapter record names Leaflet as data');
  context.assert(allDependencies(chartAdapter).every((dependency) => dependency.classification === 'external-peer'), 'Chart runtime adapter dependencies stay external-peer');
  context.assert(allDependencies(leafletAdapter).every((dependency) => dependency.classification === 'external-peer'), 'Leaflet runtime adapter dependencies stay external-peer');
  context.assert(allDependencies(chartAdapter).every((dependency) => dependency.bundled === false && dependency.packageIncluded === false), 'Chart runtime adapter dependencies are not bundled or packaged');
  context.assert(allDependencies(leafletAdapter).every((dependency) => dependency.bundled === false && dependency.packageIncluded === false), 'Leaflet runtime adapter dependencies are not bundled or packaged');
  context.assert(chartAdapter.requiredHostCapabilities.includes('chart.update.policy'), 'Chart adapter requires update policy capability');
  context.assert(leafletAdapter.requiredHostCapabilities.includes('leaflet.event-normalization'), 'Leaflet adapter requires event normalization capability');
  context.assert(leafletAdapter.requiredHostCapabilities.includes('event.rate-limit'), 'Leaflet adapter requires event rate limit capability');

  const activeUpdate = createChartUpdateRecord({
    mode: 'active',
    payload: { selection: { seriesId: 'sales' } }
  }, {
    xtensionId: fixture.expectedChartId,
    clock: createClock()
  });
  context.assert(activeUpdate.schema === XTENSIONS_CHART_UPDATE_RECORD_SCHEMA, 'Chart update record emits schema');
  context.assert(activeUpdate.ok === true && activeUpdate.mode === 'active' && activeUpdate.animationAllowed === true, 'Chart active update is accepted as animation policy hint');
  const noneUpdate = createChartUpdateRecord({
    mode: 'none',
    payload: { data: { values: [1, 2, 3] } }
  }, {
    xtensionId: fixture.expectedChartId,
    clock: createClock()
  });
  context.assert(noneUpdate.ok === true && noneUpdate.mode === 'none' && noneUpdate.animationAllowed === false, 'Chart none update is accepted as fast path policy hint');
  const badUpdate = createChartUpdateRecord({ mode: 'animate', payload: {} }, {
    xtensionId: fixture.expectedChartId,
    clock: createClock()
  });
  context.assert(badUpdate.ok === false && diagnosticCodes(badUpdate).includes(CHART_UPDATE_MODE_UNSUPPORTED_CODE), 'unsupported Chart update mode is diagnosed');

  const safePayload = inspectImperativePayloadBoundary({ selection: { id: 'district-a' } });
  context.assert(safePayload.ok === true && safePayload.apiBoundary === 'hostcontroller-only', 'safe imperative payload stays serializable behind HostController');
  const chartLeak = inspectImperativePayloadBoundary({ chartInstance: { id: 'native-chart' } }, { id: fixture.expectedChartId, framework: 'chart.js' });
  context.assert(chartLeak.ok === false && diagnosticCodes(chartLeak).includes(IMPERATIVE_POC_API_LEAK_CODE), 'Chart API object leak is diagnosed');
  const leafletLeak = inspectImperativePayloadBoundary({ leafletMap: { id: 'native-map' } }, { id: fixture.expectedLeafletId, framework: 'leaflet' });
  context.assert(leafletLeak.ok === false && diagnosticCodes(leafletLeak).includes(IMPERATIVE_POC_API_LEAK_CODE), 'Leaflet API object leak is diagnosed');
  const functionPayload = inspectImperativePayloadBoundary({ onClick() {} }, { id: fixture.expectedChartId, framework: 'chart.js' });
  context.assert(functionPayload.ok === false && diagnosticCodes(functionPayload).includes(IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE), 'non-serializable imperative payload is diagnosed');

  const resizeRecord = normalizeResizeRecord({ width: 640, height: 320 }, {
    xtensionId: fixture.expectedChartId,
    framework: 'chart.js',
    clock: createClock()
  });
  context.assert(resizeRecord.schema === XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA, 'resize record emits schema');
  context.assert(resizeRecord.ok === true && resizeRecord.hostOwned === true, 'valid resize is host-owned and accepted');
  const badResize = normalizeResizeRecord({ width: 0, height: 320 }, {
    xtensionId: fixture.expectedChartId,
    framework: 'chart.js',
    clock: createClock()
  });
  context.assert(badResize.ok === false && diagnosticCodes(badResize).includes(IMPERATIVE_RESIZE_INVALID_CODE), 'invalid resize is diagnosed');
  const hiddenRecord = normalizeVisibilityRecord({ visibility: 'hidden' }, {
    xtensionId: fixture.expectedLeafletId,
    framework: 'leaflet',
    clock: createClock()
  });
  context.assert(hiddenRecord.schema === XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA, 'visibility record emits schema');
  context.assert(hiddenRecord.ok === true && hiddenRecord.action === 'pause-imperative-work', 'hidden visibility pauses imperative work');
  const badVisibility = normalizeVisibilityRecord({ visibility: 'collapsed' }, {
    xtensionId: fixture.expectedLeafletId,
    framework: 'leaflet',
    clock: createClock()
  });
  context.assert(badVisibility.ok === false && diagnosticCodes(badVisibility).includes(IMPERATIVE_VISIBILITY_INVALID_CODE), 'invalid visibility is diagnosed');

  LEAFLET_EVENT_TYPES.forEach((eventType) => {
    const eventRecord = createLeafletEventRecord({
      type: eventType,
      payload: eventType === 'layer.click' ? { layer: { id: 'district-a' } } : { viewport: { center: [52.5, 13.4], zoom: 12 } }
    }, {
      xtensionId: fixture.expectedLeafletId,
      clock: createClock()
    });
    context.assert(eventRecord.ok === true && eventRecord.type === eventType, `Leaflet ${eventType} event is normalized`);
  });
  const panRecord = createLeafletEventRecord({ type: 'pan', payload: { viewport: { zoom: 12 } } }, {
    xtensionId: fixture.expectedLeafletId,
    clock: createClock()
  });
  context.assert(panRecord.schema === XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA, 'Leaflet event record emits schema');
  context.assert(panRecord.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'Leaflet event record links SurfaceEvent schema');
  context.assert(panRecord.payloadSchema === 'xtensions.leaflet.viewport-event.v1', 'Leaflet pan event uses viewport payload schema');
  const layerRecord = createLeafletEventRecord({ type: 'layer.click', payload: { layer: { id: 'district-a' } } }, {
    xtensionId: fixture.expectedLeafletId,
    clock: createClock()
  });
  context.assert(layerRecord.payloadSchema === 'xtensions.leaflet.layer-selection-event.v1', 'Leaflet layer click event uses selection payload schema');
  const unsupportedEvent = createLeafletEventRecord({ type: 'mousemove', payload: {} }, {
    xtensionId: fixture.expectedLeafletId,
    clock: createClock()
  });
  context.assert(unsupportedEvent.ok === false && diagnosticCodes(unsupportedEvent).includes(LEAFLET_EVENT_UNSUPPORTED_CODE), 'unsupported Leaflet event is diagnosed');
  const limitedEvent = createLeafletEventRecord({
    type: 'pan',
    eventCount: 25,
    maxEventsPerWindow: 20,
    payload: { viewport: { zoom: 13 } }
  }, {
    xtensionId: fixture.expectedLeafletId,
    clock: createClock()
  });
  context.assert(limitedEvent.ok === true && limitedEvent.rateLimit.limited === true, 'rate-limited Leaflet event remains non-blocking warning');
  context.assert(diagnosticCodes(limitedEvent).includes(LEAFLET_EVENT_RATE_LIMIT_CODE), 'rate-limited Leaflet event emits diagnostic');

  const chartHost = createFrameworklessChartHostControllerPoc({
    xtensionId: fixture.expectedChartId,
    hostId: 'chart-poc-test-host',
    surfaceId: 'surface.chart.sales',
    clock: createClock()
  });
  const chartMount = chartHost.mount({ id: 'chart-container' }, { labels: ['Q1'], datasets: [{ id: 'sales', points: [12] }] });
  context.assert(chartMount.status === 'ok', 'Chart frameworkless HostController PoC mounts');
  const chartActive = chartHost.update({ mode: 'active', payload: { selection: { seriesId: 'sales' } } });
  context.assert(chartActive.status === 'ok' && chartActive.metadata.updateRecord.mode === 'active', 'Chart HostController accepts active update');
  const chartNone = chartHost.update({ mode: 'none', payload: { data: { values: [12, 18] } } });
  context.assert(chartNone.status === 'ok' && chartNone.metadata.updateRecord.mode === 'none', 'Chart HostController accepts none update');
  const chartBad = chartHost.update({ mode: 'spin', payload: {} });
  context.assert(chartBad.status === 'failed' && diagnosticCodes(chartBad).includes(CHART_UPDATE_MODE_UNSUPPORTED_CODE), 'Chart HostController blocks unsupported update mode');
  const chartLeakUpdate = chartHost.update({ mode: 'none', payload: { canvasElement: { id: 'canvas' } } });
  context.assert(chartLeakUpdate.status === 'failed' && diagnosticCodes(chartLeakUpdate).includes(IMPERATIVE_POC_API_LEAK_CODE), 'Chart HostController blocks canvas leak');
  const chartResize = chartHost.resize({ width: 640, height: 320 });
  context.assert(chartResize.status === 'ok', 'Chart HostController resizes through host-owned record');
  const chartVisibility = chartHost.setVisibility({ visibility: 'hidden' });
  context.assert(chartVisibility.status === 'ok', 'Chart HostController applies visibility through host-owned record');
  const chartUnmount = chartHost.unmount('suite-complete');
  context.assert(chartUnmount.status === 'ok' && chartUnmount.cleanupRecords.length >= 5, 'Chart HostController unmount releases cleanup resources');
  context.assert(chartUnmount.cleanupRecords.every((record) => record.schema === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA), 'Chart cleanup producer emits only the canonical cleanup schema');
  context.assert(chartUnmount.cleanupRecords.every((record) => JSON.stringify(Object.keys(record).sort()) === JSON.stringify(HOST_RESOURCE_CLEANUP_FIELDS)), 'Chart cleanup producer emits the shared eight-field shape');
  const chartUnmountAgain = chartHost.unmount('suite-complete-repeat');
  context.assert(chartUnmountAgain.status === 'skipped', 'Chart HostController unmount is idempotent');
  const chartSnapshot = chartHost.snapshot();
  context.assert(chartSnapshot.imperativeApiExternalized === false, 'Chart native API remains host-internal in snapshot');
  context.assert(chartHost.getUpdateRecords().length >= 4, 'Chart HostController exposes update records');
  context.assert(chartHost.getCleanupRecords().length >= 5, 'Chart HostController exposes cleanup records');

  const leafletHost = createFrameworklessLeafletHostControllerPoc({
    xtensionId: fixture.expectedLeafletId,
    hostId: 'leaflet-poc-test-host',
    surfaceId: 'surface.leaflet.map',
    clock: createClock()
  });
  const leafletMount = leafletHost.mount({ id: 'map-container' }, { center: [52.52, 13.405], zoom: 12 });
  context.assert(leafletMount.status === 'ok', 'Leaflet frameworkless HostController PoC mounts');
  LEAFLET_EVENT_TYPES.forEach((eventType) => {
    const eventRecord = leafletHost.emit({
      type: eventType,
      payload: eventType === 'marker.drag' ? { marker: { id: 'marker-1', lat: 52.5, lng: 13.4 } } : { viewport: { center: [52.5, 13.4], zoom: 12 } }
    });
    context.assert(eventRecord.ok === true && eventRecord.owner === fixture.expectedLeafletId, `Leaflet HostController emits normalized ${eventType} event`);
  });
  const leafletLimited = leafletHost.emit({
    type: 'pan',
    eventCount: 25,
    maxEventsPerWindow: 20,
    payload: { viewport: { center: [52.5, 13.39], zoom: 13 } }
  });
  context.assert(leafletLimited.ok === true && diagnosticCodes(leafletLimited).includes(LEAFLET_EVENT_RATE_LIMIT_CODE), 'Leaflet HostController reports rate-limited event warning');
  const leafletInvalid = leafletHost.emit({ type: 'mousemove', payload: {} });
  context.assert(leafletInvalid.ok === false && diagnosticCodes(leafletInvalid).includes(LEAFLET_EVENT_UNSUPPORTED_CODE), 'Leaflet HostController diagnoses unsupported event');
  const leafletLeakEvent = leafletHost.emit({ type: 'pan', payload: { leafletMap: { id: 'native-map' } } });
  context.assert(leafletLeakEvent.ok === false && diagnosticCodes(leafletLeakEvent).includes(IMPERATIVE_POC_API_LEAK_CODE), 'Leaflet HostController blocks map leak');
  const leafletResize = leafletHost.resize({ width: 640, height: 480 });
  context.assert(leafletResize.status === 'ok', 'Leaflet HostController resizes through host-owned record');
  const leafletVisibility = leafletHost.setVisibility({ visibility: 'visible' });
  context.assert(leafletVisibility.status === 'ok', 'Leaflet HostController applies visibility through host-owned record');
  const leafletUnmount = leafletHost.unmount('suite-complete');
  context.assert(leafletUnmount.status === 'ok' && leafletUnmount.cleanupRecords.length >= 7, 'Leaflet HostController unmount releases cleanup resources');
  context.assert(leafletUnmount.cleanupRecords.every((record) => record.schema === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA), 'Leaflet cleanup producer emits only the canonical cleanup schema');
  context.assert(leafletUnmount.cleanupRecords.every((record) => JSON.stringify(Object.keys(record).sort()) === JSON.stringify(HOST_RESOURCE_CLEANUP_FIELDS)), 'Leaflet cleanup producer emits the shared eight-field shape');
  const leafletUnmountAgain = leafletHost.unmount('suite-complete-repeat');
  context.assert(leafletUnmountAgain.status === 'skipped', 'Leaflet HostController unmount is idempotent');
  const leafletSnapshot = leafletHost.snapshot();
  context.assert(leafletSnapshot.imperativeApiExternalized === false, 'Leaflet native API remains host-internal in snapshot');
  context.assert(leafletHost.getEventRecords().length >= 8, 'Leaflet HostController exposes event records');
  context.assert(leafletHost.getCleanupRecords().length >= 7, 'Leaflet HostController exposes cleanup records');

  const report = createImperativeHostPocReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA, 'imperative host PoCs report emits schema');
  context.assert(report.ok === true && report.status === 'ready', 'imperative host PoCs fixture report is ready');
  context.assert(report.runtimeExecutionRequired === false && report.chartRuntimeImported === false && report.leafletRuntimeImported === false, 'imperative host PoCs report imports no framework runtime');
  context.assert(report.runtimeReport.status === 'ready', 'imperative host PoCs runtime report is ready with external peers available');
  context.assert(report.runtimeRegistry.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'imperative host PoCs report embeds runtime registry');
  context.assert(report.adapters.length === 2, 'imperative host PoCs report embeds Chart and Leaflet adapters');
  context.assert(report.chartUpdateRecords.some((record) => record.mode === 'active'), 'imperative host PoCs report includes active Chart update record');
  context.assert(report.chartUpdateRecords.some((record) => record.mode === 'none'), 'imperative host PoCs report includes none Chart update record');
  assertIncludesAll(context, report.leafletEventRecords.map((record) => record.type), LEAFLET_EVENT_TYPES, 'imperative host PoCs report includes all Leaflet event types');
  context.assert(report.diagnostics.some((diagnostic) => diagnostic.code === LEAFLET_EVENT_RATE_LIMIT_CODE && diagnostic.severity === 'warning'), 'imperative host PoCs report includes rate limit warning');
  context.assert(report.cleanupRecords.length >= 12, 'imperative host PoCs report includes cleanup records for Chart and Leaflet');
  context.assert(report.cleanupRecords.every((record) => record.schema === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA), 'imperative host report contains only canonical cleanup records');
  context.assert(report.chartSnapshot.imperativeApiExternalized === false, 'report keeps Chart native API internal');
  context.assert(report.leafletSnapshot.imperativeApiExternalized === false, 'report keeps Leaflet native API internal');

  const serialized = serializeImperativeHostPocReport(report);
  const repeat = serializeImperativeHostPocReport(createImperativeHostPocReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'imperative host PoCs report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA, 'serialized imperative host PoCs report is parseable JSON');

  return context.result({
    schema: XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA,
    pocSchema: XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    module: XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH,
    suite: XTENSIONS_IMPERATIVE_HOST_POCS_SUITE_PATH,
    fixture: XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH,
    chartUpdateRecordCount: report.chartUpdateRecords.length,
    leafletEventRecordCount: report.leafletEventRecords.length,
    cleanupCount: report.cleanupRecords.length
  });
}

function printXTensionsImperativeHostPocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Chart.js and Leaflet Imperative Host PoCs Contract erfolgreich.',
    failureTitle: 'XTensions Chart.js and Leaflet Imperative Host PoCs Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsImperativeHostPocsReport,
  runXTensionsImperativeHostPocsSuite
};
