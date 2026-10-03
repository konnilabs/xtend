const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA,
  RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA,
  RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX,
  RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
  RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA,
  RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER,
  RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES,
  RMT_VNEXT_SOURCE_TO_SEA_BROWSER_RESULT_VALIDATION_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_OBJECT_MATRIX_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
  RMT_VNEXT_SOURCE_TO_SEA_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_SUITE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS,
  RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
  createRmtVNextSourceToSeaBrowserResultValidation,
  createRmtVNextSourceToSeaCiArtifactValidation,
  createRmtVNextSourceToSeaEvidenceReport,
  createRmtVNextSourceToSeaEvidence,
  createRmtVNextSourceToSeaObjectMatrix,
  runRmtVNextSourceToSeaBrowserExecution,
  validateRmtVNextSourceToSeaCiArtifactFile
} = require('../../tools/rmt-language/vnext-source-to-sea');

const SOURCE_TO_SEA_DOC_PATHS = Object.freeze([
  'docs/de/rmt-vnext-source-to-sea-gate.md',
  'docs/en/rmt-vnext-source-to-sea-gate.md'
]);
const SOURCE_TO_SEA_EVIDENCE_SCRIPT_PATH = 'scripts/capture_rmt_vnext_source_to_sea_evidence.js';
const SOURCE_TO_SEA_CLEANUP_INVALID_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt';
const SOURCE_TO_SEA_CLEANUP_OWNER_INVALID_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt';
const SOURCE_TO_SEA_CLEANUP_RESOURCE_MISSING_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt';
const SOURCE_TO_SEA_CLEANUP_KIND_INVALID_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt';
const SOURCE_TO_SEA_CROSS_ROUTE_INVALID_BROWSER_FIXTURE_PATH = 'tests/browser/fixtures/rmt-vnext-source-to-sea-cross-route-invalid.html';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function readDocs(paths, rootDir) {
  return paths.map((relativePath) => readText(relativePath, rootDir)).join('\n\n');
}

async function runRmtVNextSourceToSeaSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-source-to-sea',
    label: 'RMT vNext Source-to-Sea Browser Gate'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_SOURCE_TO_SEA_SUITE_PATH, { rootDir, extension: '.js' });
  const evidenceScriptSyntax = syntaxCheckFile(SOURCE_TO_SEA_EVIDENCE_SCRIPT_PATH, { rootDir, extension: '.js' });
  const fatalReplayPath = path.join(os.tmpdir(), `xtend-rmt-vnext-source-to-sea-fatal-${process.pid}.json`);

  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH, rootDir, 'source-to-sea module exists');
  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_SUITE_PATH, rootDir, 'source-to-sea suite exists');
  assertFileExists(context, SOURCE_TO_SEA_EVIDENCE_SCRIPT_PATH, rootDir, 'source-to-sea evidence capture script exists');
  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH, rootDir, 'source-to-sea vNext fixture exists');
  assertFileExists(context, SOURCE_TO_SEA_CLEANUP_INVALID_FIXTURE_PATH, rootDir, 'source-to-sea cleanup invalid fixture exists');
  assertFileExists(context, SOURCE_TO_SEA_CLEANUP_OWNER_INVALID_FIXTURE_PATH, rootDir, 'source-to-sea cleanup owner invalid fixture exists');
  assertFileExists(context, SOURCE_TO_SEA_CLEANUP_RESOURCE_MISSING_FIXTURE_PATH, rootDir, 'source-to-sea cleanup resource missing fixture exists');
  assertFileExists(context, SOURCE_TO_SEA_CLEANUP_KIND_INVALID_FIXTURE_PATH, rootDir, 'source-to-sea cleanup kind invalid fixture exists');
  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH, rootDir, 'source-to-sea browser fixture exists');
  assertFileExists(context, SOURCE_TO_SEA_CROSS_ROUTE_INVALID_BROWSER_FIXTURE_PATH, rootDir, 'source-to-sea cross-route invalid browser fixture exists');
  SOURCE_TO_SEA_DOC_PATHS.forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });
  context.assert(moduleSyntax.ok, `source-to-sea module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `source-to-sea suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(evidenceScriptSyntax.ok, `source-to-sea evidence script syntax passes${evidenceScriptSyntax.ok ? '' : ` (${evidenceScriptSyntax.message})`}`);

  try {
    fs.unlinkSync(fatalReplayPath);
  } catch (_) {}
  const fatalReplay = spawnSync(process.execPath, [
    resolveRepoPath(SOURCE_TO_SEA_EVIDENCE_SCRIPT_PATH, rootDir),
    '--engine',
    'chromium',
    '--simulate-fatal-before-report',
    '--output',
    fatalReplayPath
  ], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  const fatalReplayReport = fs.existsSync(fatalReplayPath)
    ? JSON.parse(fs.readFileSync(fatalReplayPath, 'utf8'))
    : null;
  context.assert(fatalReplay.status === 1, 'source-to-sea fatal capture simulation fails the step');
  context.assert(fatalReplayReport && fatalReplayReport.schema === RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA, 'source-to-sea fatal capture simulation writes evidence report artifact');
  context.assert(fatalReplayReport && fatalReplayReport.status === 'failed' && fatalReplayReport.ok === false, 'source-to-sea fatal capture artifact records failed status');
  context.assert(fatalReplayReport && fatalReplayReport.browserExecution && fatalReplayReport.browserExecution.mode === 'fatal-error', 'source-to-sea fatal capture artifact records fatal browser execution mode');

  const fixturePath = resolveRepoPath(RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH, rootDir);
  const sourceToSeaModule = readText(RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH, rootDir);
  const source = readText(RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH, rootDir);
  const cleanupInvalidSource = readText(SOURCE_TO_SEA_CLEANUP_INVALID_FIXTURE_PATH, rootDir);
  const cleanupOwnerInvalidSource = readText(SOURCE_TO_SEA_CLEANUP_OWNER_INVALID_FIXTURE_PATH, rootDir);
  const cleanupResourceMissingSource = readText(SOURCE_TO_SEA_CLEANUP_RESOURCE_MISSING_FIXTURE_PATH, rootDir);
  const cleanupKindInvalidSource = readText(SOURCE_TO_SEA_CLEANUP_KIND_INVALID_FIXTURE_PATH, rootDir);
  const browserFixture = readText(RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH, rootDir);
  const crossRouteInvalidBrowserFixture = readText(SOURCE_TO_SEA_CROSS_ROUTE_INVALID_BROWSER_FIXTURE_PATH, rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const workflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const packageManifest = JSON.parse(readText('package.json', rootDir));
  const evidence = createRmtVNextSourceToSeaEvidence({
    text: source,
    filePath: fixturePath
  }, {
    browserFixtureText: browserFixture,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH
  });
  const browserExecution = await runRmtVNextSourceToSeaBrowserExecution(evidence, {
    rootDir,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
    engine: options.engine || options.browserDriver,
    requireBrowserExecution: options.requireBrowserExecution,
    timeoutMs: options.timeoutMs
  });
  const unsupportedEngineExecution = await runRmtVNextSourceToSeaBrowserExecution(evidence, {
    rootDir,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
    engine: 'unsupported-engine',
    requireBrowserExecution: true,
    timeoutMs: 10
  });
  const evidenceReport = await createRmtVNextSourceToSeaEvidenceReport({
    rootDir,
    sourcePath: RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
    evidence,
    browserExecution
  });
  const objectMatrix = evidenceReport.objectMatrix;
  const cleanupInvalidObjectMatrix = createRmtVNextSourceToSeaObjectMatrix({
    text: cleanupInvalidSource,
    filePath: resolveRepoPath(SOURCE_TO_SEA_CLEANUP_INVALID_FIXTURE_PATH, rootDir)
  }, {
    browserFixtureText: browserFixture,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH
  });
  const cleanupOwnerInvalidObjectMatrix = createRmtVNextSourceToSeaObjectMatrix({
    text: cleanupOwnerInvalidSource,
    filePath: resolveRepoPath(SOURCE_TO_SEA_CLEANUP_OWNER_INVALID_FIXTURE_PATH, rootDir)
  }, {
    browserFixtureText: browserFixture,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH
  });
  const cleanupResourceMissingObjectMatrix = createRmtVNextSourceToSeaObjectMatrix({
    text: cleanupResourceMissingSource,
    filePath: resolveRepoPath(SOURCE_TO_SEA_CLEANUP_RESOURCE_MISSING_FIXTURE_PATH, rootDir)
  }, {
    browserFixtureText: browserFixture,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH
  });
  const cleanupKindInvalidObjectMatrix = createRmtVNextSourceToSeaObjectMatrix({
    text: cleanupKindInvalidSource,
    filePath: resolveRepoPath(SOURCE_TO_SEA_CLEANUP_KIND_INVALID_FIXTURE_PATH, rootDir)
  }, {
    browserFixtureText: browserFixture,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH
  });
  const crossRouteInvalidObjectMatrix = createRmtVNextSourceToSeaObjectMatrix({
    text: source,
    filePath: fixturePath
  }, {
    browserFixtureText: crossRouteInvalidBrowserFixture,
    browserFixturePath: SOURCE_TO_SEA_CROSS_ROUTE_INVALID_BROWSER_FIXTURE_PATH
  });

  context.assert(evidence.schema === RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_SCHEMA, 'evidence declares PRIM-06 evidence schema');
  context.assert(evidence.gateSchema === RMT_VNEXT_SOURCE_TO_SEA_SCHEMA, 'evidence declares PRIM-06 gate schema');
  context.assert(evidence.workpackage === RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE, 'evidence belongs to PRIM-06');
  context.assert(evidence.ok === true, `source-to-sea evidence passes${evidence.ok ? '' : ` (${evidence.checks.filter((check) => !check.ok).map((check) => check.name).join(', ')})`}`);
  context.assert(evidence.primitiveId === 'demo.feedback.status', 'evidence tracks visible primitive id');
  context.assert(evidence.sourcePointer === '/events/0', 'evidence source pointer traces back to event source map');
  context.assert(evidence.sourceMap && evidence.sourceMap.astPointer, 'evidence includes AST source pointer');
  context.assert(evidence.compiler.ok === true && evidence.compiler.artifactCount >= 6, 'compiler artifacts are present in evidence');
  context.assert(evidence.kernel.ingested === true, 'kernel ingestion is reconstructed');
  context.assert(evidence.kernel.scheduleRef === 'schedule:demo.feedback/demo.feedback.status/visible', 'kernel schedule ref is stable');
  context.assert(evidence.fabric.lane === 'visible', 'fabric lane is derived from vNext lane');
  context.assert(evidence.fabric.schema === RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA, 'fabric bridge evidence declares PRIM-05 schema');
  context.assert(evidence.fabric.workpackage === RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE, 'fabric bridge evidence belongs to PRIM-05');
  context.assert(evidence.fabric.fiber === 'fiber:demo.feedback/demo.feedback.status/visible/0', 'fabric fiber is derived from vNext lifecycle op');
  context.assert(evidence.fabric.sourceKind === 'selector', 'fabric fiber keeps selector source');
  context.assert(evidence.fabric.rmtLane === 'visible', 'fabric bridge maps visible lane back to RMT visible lane');
  context.assert(evidence.fabric.scheduleRef === 'component.visible.hydrate', 'fabric bridge resolves component hydration schedule');
  context.assert(evidence.fabric.endpointName === 'xtendrmt.component.hydrate', 'fabric bridge resolves component hydration endpoint');
  context.assert(evidence.fabric.bridge.ok === true, 'fabric bridge evidence passes');
  context.assert(evidence.fabric.bridge.mapping.schema === 'xtend.fabric.rmt-lane-mapping.v1', 'fabric bridge uses Fabric/RMT lane mapping contract');
  context.assert(evidence.fabric.bridge.fiber.schema === 'xtend.fabric.fiber.v1', 'fabric bridge records a Fabric fiber');
  context.assert(evidence.fabric.bridge.fiber.status === 'completed', 'fabric bridge fiber completes');
  context.assert(evidence.fabric.bridge.fiber.metadata.kernelScheduleRef === 'schedule:demo.feedback/demo.feedback.status/visible', 'fabric bridge fiber keeps kernel schedule correlation');
  context.assert(evidence.fabric.telemetry.schema === 'xtend.fabric.telemetry-snapshot.v1', 'fabric bridge records telemetry snapshot');
  context.assert(evidence.fabric.telemetry.fiberCount >= 1 + RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX.length, 'fabric telemetry includes the vNext fiber and lane matrix fibers');
  context.assert(evidence.fabric.telemetry.lane && evidence.fabric.telemetry.lane.scheduleRefs.includes('component.visible.hydrate'), 'fabric telemetry lane includes hydration schedule');
  context.assert(Array.isArray(evidence.fabric.bridge.laneMatrix) && evidence.fabric.bridge.laneMatrix.length === RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX.length, 'fabric bridge records the target lane matrix');
  context.assert(evidence.fabric.bridge.laneMatrix.every((entry) => entry.ok === true), 'fabric bridge lane matrix passes');
  context.assert(evidence.fabric.bridge.laneMatrix.map((entry) => entry.lane).join('>') === 'user-blocking>transition>idle>background>diagnostics', 'fabric bridge lane matrix covers non-visible target lanes');
  context.assert(evidence.fabric.bridge.laneMatrix.some((entry) => entry.lane === 'user-blocking' && entry.mapping.scheduleRef === 'ui.user-blocking.input'), 'fabric bridge matrix maps user-blocking lane');
  context.assert(evidence.fabric.bridge.laneMatrix.some((entry) => entry.lane === 'transition' && entry.mapping.scheduleRef === 'route.transition.render'), 'fabric bridge matrix maps transition lane');
  context.assert(evidence.fabric.bridge.laneMatrix.some((entry) => entry.lane === 'idle' && entry.mapping.scheduleRef === 'component.idle.hydrate'), 'fabric bridge matrix maps idle lane');
  context.assert(evidence.fabric.bridge.laneMatrix.some((entry) => entry.lane === 'background' && entry.mapping.scheduleRef === 'ui.background.work'), 'fabric bridge matrix maps background lane');
  context.assert(evidence.fabric.bridge.laneMatrix.some((entry) => entry.lane === 'diagnostics' && entry.mapping.scheduleRef === 'diagnostics.snapshot'), 'fabric bridge matrix maps diagnostics lane');
  context.assert(evidence.fabric.bridge.laneMatrix.every((entry) => entry.fiber && entry.fiber.schema === 'xtend.fabric.fiber.v1' && entry.fiber.status === 'completed'), 'fabric bridge lane matrix records completed Fabric fibers');
  context.assert(evidence.fabric.bridge.laneMatrix.every((entry) => entry.telemetry && entry.telemetry.scheduleRefs.includes(entry.mapping.scheduleRef)), 'fabric bridge lane matrix records telemetry schedules');
  context.assert(evidence.fabric.bridge.hostAdapter.schema === RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA, 'fabric bridge records host adapter telemetry schema');
  context.assert(evidence.fabric.bridge.hostAdapter.source === 'xtend.component-adapter', 'fabric bridge records XTend component adapter telemetry source');
  context.assert(evidence.fabric.bridge.hostAdapter.operation === 'hydrate', 'host adapter telemetry records hydration operation');
  context.assert(evidence.fabric.bridge.hostAdapter.scheduleRef === 'component.visible.hydrate', 'host adapter telemetry records hydration schedule');
  context.assert(evidence.fabric.bridge.hostAdapter.fabricLane === 'visible', 'host adapter telemetry records Fabric lane');
  context.assert(evidence.fabric.bridge.hostAdapter.fiberKind === 'component.hydrate', 'host adapter telemetry records Fiber kind');
  context.assert(evidence.fabric.bridge.hostAdapter.summary && evidence.fabric.bridge.hostAdapter.summary.recordCount >= 1, 'Fabric snapshot summarizes host adapter telemetry');
  context.assert(evidence.fabric.bridge.hostAdapter.summary.lane && evidence.fabric.bridge.hostAdapter.summary.lane.scheduleRefs.includes('component.visible.hydrate'), 'host adapter telemetry summary keeps hydration schedule');
  context.assert(evidence.fabric.bridge.browser.hostAdapterTelemetryVisible === true, 'browser exposes host adapter telemetry marker');
  context.assert(evidence.fabric.bridge.routeComponentFibers.schema === RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA, 'route/component fiber evidence declares schema');
  context.assert(evidence.fabric.bridge.routeComponentFibers.ok === true, 'route/component fiber evidence passes');
  context.assert(evidence.fabric.bridge.routeComponentFibers.counts.component === 2, 'component fiber evidence records mount and hydrate');
  context.assert(evidence.fabric.bridge.routeComponentFibers.counts.route === 2, 'route fiber evidence records navigate and render');
  context.assert(evidence.fabric.bridge.routeComponentFibers.component.some((entry) => entry.kind === 'component.mount' && entry.fiber.scheduleRef === 'component.visible.mount'), 'component fiber evidence records mount schedule');
  context.assert(evidence.fabric.bridge.routeComponentFibers.component.some((entry) => entry.kind === 'component.hydrate' && entry.fiber.scheduleRef === 'component.idle.hydrate'), 'component fiber evidence records hydrate schedule');
  context.assert(evidence.fabric.bridge.routeComponentFibers.route.some((entry) => entry.kind === 'route.navigate' && entry.fiber.scheduleRef === 'ui.user-blocking.input'), 'route fiber evidence records navigation schedule');
  context.assert(evidence.fabric.bridge.routeComponentFibers.route.some((entry) => entry.kind === 'route.render' && entry.fiber.scheduleRef === 'route.transition.render'), 'route fiber evidence records render schedule');
  context.assert(evidence.fabric.bridge.routeComponentFibers.component.every((entry) => entry.fiber && entry.fiber.source === 'component'), 'component fiber evidence uses component instrumentation source');
  context.assert(evidence.fabric.bridge.routeComponentFibers.route.every((entry) => entry.fiber && entry.fiber.source === 'router'), 'route fiber evidence uses route instrumentation source');
  context.assert(evidence.fabric.bridge.routeComponentFibers.component.every((entry) => entry.telemetry && entry.telemetry.scheduleRefs.includes(entry.expectedScheduleRef)), 'component fiber evidence reaches telemetry summary');
  context.assert(evidence.fabric.bridge.routeComponentFibers.route.every((entry) => entry.telemetry && entry.telemetry.scheduleRefs.includes(entry.expectedScheduleRef)), 'route fiber evidence reaches telemetry summary');
  context.assert(evidence.fabric.bridge.browser.laneVisible === true, 'browser exposes Fabric lane metadata');
  context.assert(evidence.fabric.bridge.browser.fiberVisible === true, 'browser exposes Fabric fiber metadata');
  context.assert(evidence.fabric.bridge.browser.scheduleVisible === true, 'browser exposes Fabric schedule metadata');
  context.assert(evidence.ui.selector === '[data-rmt-primitive-id="demo.feedback.status"]', 'UI selector carries primitive id');
  context.assert(evidence.ui.visible === true && evidence.ui.text === 'Saved', 'UI viewport evidence observes visible state');
  context.assert(evidence.browser.fixture === RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH, 'browser fixture is recorded');
  context.assert(evidence.browser.resultKey === RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY, 'browser result key is stable');
  context.assert(evidence.browser.viewportAsserted === true, 'browser fixture asserts viewport visibility');
  context.assert(evidence.browser.eventObserved === true, 'browser fixture observes user-facing event');
  context.assert(browserExecution.schema === RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA, 'browser execution evidence declares schema');
  context.assert(browserExecution.ok === true, `browser execution evidence is gate-compatible${browserExecution.ok ? '' : ` (${browserExecution.reason || browserExecution.checks.filter((check) => !check.ok).map((check) => check.name).join(', ')})`}`);
  context.assert(browserExecution.resultKey === RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY, 'browser execution targets the source-to-sea result key');
  context.assert(unsupportedEngineExecution.schema === RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA, 'unsupported engine path declares browser execution schema');
  context.assert(unsupportedEngineExecution.driver === 'unsupported-engine', 'unsupported engine path records the requested provider');
  context.assert(unsupportedEngineExecution.required === true && unsupportedEngineExecution.status === 'failed', 'unsupported engine path fails closed');
  context.assert(evidenceReport.schema === RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA, 'source-to-sea evidence report declares artifact schema');
  context.assert(evidenceReport.ok === true, `source-to-sea evidence report passes${evidenceReport.ok ? '' : ` (${evidenceReport.checks.filter((check) => !check.ok).map((check) => check.name).join(', ')})`}`);
  context.assert(evidenceReport.artifact.path === RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH, 'source-to-sea evidence report uses stable artifact path');
  context.assert(evidenceReport.ciArtifactValidation && evidenceReport.ciArtifactValidation.schema === RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA, 'source-to-sea evidence report declares CI artifact validation schema');
  context.assert(evidenceReport.ciArtifactValidation && (browserExecution.status === 'skipped' ? evidenceReport.ciArtifactValidation.status === 'skipped' : evidenceReport.ciArtifactValidation.status === 'passed'), 'source-to-sea evidence report carries CI artifact validation status');
  context.assert(objectMatrix && objectMatrix.schema === RMT_VNEXT_SOURCE_TO_SEA_OBJECT_MATRIX_SCHEMA, 'source-to-sea object matrix declares schema');
  context.assert(objectMatrix && objectMatrix.ok === true, `source-to-sea object matrix passes${objectMatrix && objectMatrix.ok ? '' : ` (${objectMatrix && objectMatrix.checks.filter((check) => !check.ok).map((check) => check.name).join(', ')})`}`);
  context.assert(objectMatrix && objectMatrix.objectCount === 4, 'source-to-sea object matrix covers four visible primitives');
  context.assert(objectMatrix && objectMatrix.primitiveIds.join('>') === 'demo.feedback.status>demo.feedback.toast>demo.feedback.detail>demo.feedback.audit', 'source-to-sea object matrix keeps stable primitive order');
  context.assert(objectMatrix && objectMatrix.lanes.join('>') === 'visible>idle>transition>transition', 'source-to-sea object matrix covers visible, idle and repeated transition lanes');
  const toastObject = objectMatrix && objectMatrix.objects.find((entry) => entry.primitiveId === 'demo.feedback.toast');
  context.assert(toastObject && toastObject.actionId === 'demo.feedback.dismiss', 'source-to-sea object matrix tracks toast action');
  context.assert(toastObject && toastObject.kernel.scheduleRef === 'schedule:demo.feedback/demo.feedback.toast/idle', 'source-to-sea object matrix tracks toast kernel schedule');
  context.assert(toastObject && toastObject.fabric.fiber === 'fiber:demo.feedback/demo.feedback.toast/idle/0', 'source-to-sea object matrix tracks toast Fabric fiber');
  context.assert(toastObject && toastObject.fabric.lane === 'idle', 'source-to-sea object matrix tracks toast idle Fabric lane');
  context.assert(toastObject && toastObject.fabric.scheduleRef === 'component.idle.hydrate', 'source-to-sea object matrix tracks toast idle Fabric schedule');
  context.assert(toastObject && toastObject.ui.selector === '[data-rmt-primitive-id="demo.feedback.toast"]', 'source-to-sea object matrix tracks toast UI selector');
  context.assert(toastObject && toastObject.ui.text === 'Dismissed', 'source-to-sea object matrix tracks toast visible state');
  const detailObject = objectMatrix && objectMatrix.objects.find((entry) => entry.primitiveId === 'demo.feedback.detail');
  context.assert(detailObject && detailObject.actionId === 'demo.feedback.detail.ack', 'source-to-sea object matrix tracks route target action');
  context.assert(detailObject && detailObject.kernel.scheduleRef === 'schedule:demo.feedback/demo.feedback.detail/transition', 'source-to-sea object matrix tracks route target kernel schedule');
  context.assert(detailObject && detailObject.fabric.fiber === 'fiber:demo.feedback/demo.feedback.detail/transition/0', 'source-to-sea object matrix tracks route target Fabric fiber');
  context.assert(detailObject && detailObject.fabric.lane === 'transition', 'source-to-sea object matrix tracks route target transition Fabric lane');
  context.assert(detailObject && detailObject.fabric.scheduleRef === 'route.transition.render', 'source-to-sea object matrix tracks route target render schedule');
  context.assert(detailObject && detailObject.ui.selector === '[data-rmt-primitive-id="demo.feedback.detail"]', 'source-to-sea object matrix tracks route target UI selector');
  context.assert(detailObject && detailObject.ui.text === 'Detail acknowledged', 'source-to-sea object matrix tracks route target visible state');
  const auditObject = objectMatrix && objectMatrix.objects.find((entry) => entry.primitiveId === 'demo.feedback.audit');
  context.assert(auditObject && auditObject.actionId === 'demo.feedback.audit.review', 'source-to-sea object matrix tracks second route target action');
  context.assert(auditObject && auditObject.kernel.scheduleRef === 'schedule:demo.feedback/demo.feedback.audit/transition', 'source-to-sea object matrix tracks second route target kernel schedule');
  context.assert(auditObject && auditObject.fabric.fiber === 'fiber:demo.feedback/demo.feedback.audit/transition/0', 'source-to-sea object matrix tracks second route target Fabric fiber');
  context.assert(auditObject && auditObject.fabric.lane === 'transition', 'source-to-sea object matrix tracks second route target transition Fabric lane');
  context.assert(auditObject && auditObject.fabric.scheduleRef === 'route.transition.render', 'source-to-sea object matrix tracks second route target render schedule');
  context.assert(auditObject && auditObject.ui.selector === '[data-rmt-primitive-id="demo.feedback.audit"]', 'source-to-sea object matrix tracks second route target UI selector');
  context.assert(auditObject && auditObject.ui.text === 'Audit reviewed', 'source-to-sea object matrix tracks second route target visible state');
  const crossPrimitiveEvent = objectMatrix && objectMatrix.crossPrimitiveEvents.find((entry) => entry.sourcePrimitiveId === 'demo.feedback.status' && entry.targetPrimitiveId === 'demo.feedback.toast');
  context.assert(objectMatrix && objectMatrix.crossPrimitiveEvents.length === 2, 'source-to-sea object matrix tracks two staged cross-primitive events');
  context.assert(crossPrimitiveEvent && crossPrimitiveEvent.status === 'passed', 'source-to-sea object matrix tracks cross-primitive event');
  context.assert(crossPrimitiveEvent && crossPrimitiveEvent.actionId === 'demo.feedback.save', 'source-to-sea object matrix tracks cross-primitive source action');
  context.assert(crossPrimitiveEvent && crossPrimitiveEvent.eventId === 'demo.feedback.toast.promoted', 'source-to-sea object matrix tracks cross-primitive emitted event');
  context.assert(crossPrimitiveEvent && crossPrimitiveEvent.targetState === 'state.demo.feedback.toast.text', 'source-to-sea object matrix tracks cross-primitive target state');
  context.assert(crossPrimitiveEvent && crossPrimitiveEvent.targetLane === 'idle', 'source-to-sea object matrix tracks cross-primitive target lane');
  const crossRouteEvent = objectMatrix && objectMatrix.crossPrimitiveEvents.find((entry) => entry.sourcePrimitiveId === 'demo.feedback.detail' && entry.targetPrimitiveId === 'demo.feedback.audit');
  context.assert(crossRouteEvent && crossRouteEvent.status === 'passed', 'source-to-sea object matrix tracks cross-route primitive event');
  context.assert(crossRouteEvent && crossRouteEvent.stage === 'route-target', 'source-to-sea object matrix marks cross-route event stage');
  context.assert(crossRouteEvent && crossRouteEvent.actionId === 'demo.feedback.detail.ack', 'source-to-sea object matrix tracks cross-route source action');
  context.assert(crossRouteEvent && crossRouteEvent.eventId === 'demo.feedback.audit.escalated', 'source-to-sea object matrix tracks cross-route emitted event');
  context.assert(crossRouteEvent && crossRouteEvent.targetState === 'state.demo.feedback.audit.text', 'source-to-sea object matrix tracks cross-route target state');
  context.assert(crossRouteEvent && crossRouteEvent.sourceLane === 'transition' && crossRouteEvent.targetLane === 'transition', 'source-to-sea object matrix tracks cross-route transition lanes');
  const crossRouteInvalidEvent = crossRouteInvalidObjectMatrix && crossRouteInvalidObjectMatrix.crossPrimitiveEvents.find((entry) => entry.sourcePrimitiveId === 'demo.feedback.detail' && entry.targetPrimitiveId === 'demo.feedback.toast' && entry.stage === 'route-target');
  context.assert(crossRouteInvalidObjectMatrix && crossRouteInvalidObjectMatrix.status === 'failed', 'source-to-sea cross-route invalid browser fixture fails object matrix');
  context.assert(crossRouteInvalidEvent && crossRouteInvalidEvent.status === 'failed', 'source-to-sea cross-route invalid browser fixture marks event failed');
  context.assert(crossRouteInvalidEvent && crossRouteInvalidEvent.checks.some((check) => check.name === 'cross event route-target state belongs to target primitive' && check.ok === false), 'source-to-sea cross-route invalid fixture detects target state drift');
  context.assert(crossRouteInvalidEvent && crossRouteInvalidEvent.checks.some((check) => check.name === 'cross event route-target event belongs to target primitive' && check.ok === false), 'source-to-sea cross-route invalid fixture detects target event drift');
  context.assert(crossRouteInvalidEvent && crossRouteInvalidEvent.checks.some((check) => check.name === 'cross event route-target stage uses transition lanes' && check.ok === false), 'source-to-sea cross-route invalid fixture detects transition lane drift');
  const routeSwitch = objectMatrix && objectMatrix.routeSwitches.find((entry) => entry.sourcePrimitiveId === 'demo.feedback.status' && entry.targetPrimitiveId === 'demo.feedback.detail');
  context.assert(routeSwitch && routeSwitch.status === 'passed', 'source-to-sea object matrix tracks route switch');
  context.assert(routeSwitch && routeSwitch.from === '/rmt-vnext-source-to-sea', 'source-to-sea object matrix tracks route switch origin');
  context.assert(routeSwitch && routeSwitch.to === '/rmt-vnext-source-to-sea/toast', 'source-to-sea object matrix tracks route switch target');
  context.assert(routeSwitch && routeSwitch.scheduleRef === 'ui.user-blocking.input', 'source-to-sea object matrix tracks route switch navigation schedule');
  context.assert(routeSwitch && routeSwitch.renderScheduleRef === 'route.transition.render', 'source-to-sea object matrix tracks route switch render schedule');
  context.assert(routeSwitch && routeSwitch.lane === 'transition', 'source-to-sea object matrix tracks route switch transition lane');
  context.assert(routeSwitch && routeSwitch.targetFiberRef === 'fiber:demo.feedback/demo.feedback.detail/transition/0', 'source-to-sea object matrix tracks route switch mounted target fiber');
  const auditRouteSwitch = objectMatrix && objectMatrix.routeSwitches.find((entry) => entry.sourcePrimitiveId === 'demo.feedback.status' && entry.targetPrimitiveId === 'demo.feedback.audit');
  context.assert(objectMatrix && objectMatrix.routeSwitches.length === 2, 'source-to-sea object matrix tracks two sequential route switches');
  context.assert(auditRouteSwitch && auditRouteSwitch.status === 'passed', 'source-to-sea object matrix tracks second route switch');
  context.assert(auditRouteSwitch && auditRouteSwitch.from === '/rmt-vnext-source-to-sea/toast', 'source-to-sea object matrix tracks second route switch origin');
  context.assert(auditRouteSwitch && auditRouteSwitch.to === '/rmt-vnext-source-to-sea/audit', 'source-to-sea object matrix tracks second route switch target');
  context.assert(auditRouteSwitch && auditRouteSwitch.targetFiberRef === 'fiber:demo.feedback/demo.feedback.audit/transition/0', 'source-to-sea object matrix tracks second route switch mounted target fiber');
  const routeLifecycleCycle = objectMatrix && objectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.detail');
  context.assert(objectMatrix && objectMatrix.routeLifecycleCycles.length === 2, 'source-to-sea object matrix tracks lifecycle cycles for two route targets');
  context.assert(routeLifecycleCycle && routeLifecycleCycle.status === 'passed', 'source-to-sea object matrix tracks route lifecycle cycle');
  context.assert(routeLifecycleCycle && routeLifecycleCycle.unmountScheduleRef === 'ui.background.work', 'source-to-sea object matrix tracks lifecycle unmount schedule');
  context.assert(routeLifecycleCycle && routeLifecycleCycle.remountScheduleRef === 'route.transition.render', 'source-to-sea object matrix tracks lifecycle remount schedule');
  context.assert(routeLifecycleCycle && routeLifecycleCycle.resourceId === 'demo.feedback.detailTimer', 'source-to-sea object matrix tracks lifecycle cleanup resource');
  context.assert(routeLifecycleCycle && routeLifecycleCycle.resource && routeLifecycleCycle.resource.dispose.text === 'on surface.destroy', 'source-to-sea object matrix tracks surface destroy cleanup policy');
  context.assert(routeLifecycleCycle && routeLifecycleCycle.expectedUnmountCount === 1 && routeLifecycleCycle.expectedRemountCount === 1, 'source-to-sea object matrix tracks detail lifecycle counts');
  const auditRouteLifecycleCycle = objectMatrix && objectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.audit');
  context.assert(auditRouteLifecycleCycle && auditRouteLifecycleCycle.status === 'passed', 'source-to-sea object matrix tracks second route lifecycle cycle');
  context.assert(auditRouteLifecycleCycle && auditRouteLifecycleCycle.resourceId === 'demo.feedback.auditTimer', 'source-to-sea object matrix tracks second lifecycle cleanup resource');
  context.assert(auditRouteLifecycleCycle && Array.isArray(auditRouteLifecycleCycle.resourceIds) && auditRouteLifecycleCycle.resourceIds.join('>') === 'demo.feedback.auditTimer>demo.feedback.auditSubscription', 'source-to-sea object matrix tracks multiple lifecycle cleanup resources');
  context.assert(auditRouteLifecycleCycle && Array.isArray(auditRouteLifecycleCycle.resourceKinds) && auditRouteLifecycleCycle.resourceKinds.includes('timer') && auditRouteLifecycleCycle.resourceKinds.includes('subscription'), 'source-to-sea object matrix tracks lifecycle resource kinds');
  const auditSubscriptionResource = auditRouteLifecycleCycle && auditRouteLifecycleCycle.resources.find((entry) => entry.resourceId === 'demo.feedback.auditSubscription');
  context.assert(auditSubscriptionResource && auditSubscriptionResource.resource && auditSubscriptionResource.resource.kind === 'subscription', 'source-to-sea object matrix tracks subscription cleanup resource');
  context.assert(auditSubscriptionResource && auditSubscriptionResource.resource && auditSubscriptionResource.resource.dispose.text === 'on surface.destroy', 'source-to-sea object matrix tracks subscription cleanup policy');
  context.assert(auditRouteLifecycleCycle && auditRouteLifecycleCycle.resource && auditRouteLifecycleCycle.resource.owner && auditRouteLifecycleCycle.resource.owner.id === 'demo.feedback.audit', 'source-to-sea object matrix tracks second lifecycle cleanup owner');
  context.assert(auditRouteLifecycleCycle && auditRouteLifecycleCycle.expectedUnmountCount === 1 && auditRouteLifecycleCycle.expectedRemountCount === 1, 'source-to-sea object matrix tracks audit lifecycle counts');
  const browserResultFixture = {
    schema: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_RESULT_VALIDATION_SCHEMA,
    status: 'passed',
    primitiveId: evidence.primitiveId,
    scheduleRef: evidence.kernel.scheduleRef,
    fiberRef: evidence.fabric.fiber,
    lane: evidence.fabric.lane,
    fabricScheduleRef: evidence.fabric.scheduleRef,
    hostAdapterTelemetrySchema: RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA,
    events: [
      { action: evidence.browser.expectedAction }
    ],
    checks: [
      { name: 'viewport visible', ok: true }
    ],
    objects: objectMatrix.objects.map((entry) => ({
      primitiveId: entry.primitiveId,
      status: 'passed'
    })),
    crossPrimitiveEvents: objectMatrix.crossPrimitiveEvents.map((entry) => ({
      ...entry,
      status: 'passed'
    })),
    routeSwitches: objectMatrix.routeSwitches.map((entry) => ({
      ...entry,
      status: 'passed',
      targetMounted: true,
      targetVisible: true
    })),
    routeLifecycleCycles: objectMatrix.routeLifecycleCycles.map((entry) => ({
      ...entry,
      status: 'passed',
      unmounted: true,
      remounted: true,
      resourceDisposed: true,
      countsMatch: true,
      unmountCount: 1,
      remountCount: 1
    }))
  };
  const browserResultValidation = createRmtVNextSourceToSeaBrowserResultValidation(browserResultFixture, evidence);
  const browserRouteSwitchDriftValidation = createRmtVNextSourceToSeaBrowserResultValidation({
    ...browserResultFixture,
    routeSwitches: browserResultFixture.routeSwitches.map((entry, index) => index === 0
      ? {
        ...entry,
        status: 'failed',
        targetMounted: false,
        targetVisible: false
      }
      : entry)
  }, evidence);
  const browserLifecycleCountDriftValidation = createRmtVNextSourceToSeaBrowserResultValidation({
    ...browserResultFixture,
    routeLifecycleCycles: browserResultFixture.routeLifecycleCycles.map((entry, index) => index === 0
      ? {
        ...entry,
        status: 'failed',
        countsMatch: false,
        unmountCount: 2,
        remountCount: 1
      }
      : entry)
  }, evidence);
  const browserCrossPrimitiveDriftValidation = createRmtVNextSourceToSeaBrowserResultValidation({
    ...browserResultFixture,
    crossPrimitiveEvents: browserResultFixture.crossPrimitiveEvents.map((entry, index) => index === 0
      ? {
        ...entry,
        status: 'failed',
        observedText: 'Queued'
      }
      : entry)
  }, evidence);
  const browserObjectStatusDriftValidation = createRmtVNextSourceToSeaBrowserResultValidation({
    ...browserResultFixture,
    objects: browserResultFixture.objects.map((entry, index) => index === 0
      ? {
        ...entry,
        status: 'failed',
        errors: ['viewport hidden']
      }
      : entry)
  }, evidence);
  context.assert(browserResultValidation.schema === RMT_VNEXT_SOURCE_TO_SEA_BROWSER_RESULT_VALIDATION_SCHEMA, 'source-to-sea browser result validation declares schema');
  context.assert(browserResultValidation.ok === true && browserResultValidation.status === 'passed', 'source-to-sea browser result validation accepts route/lifecycle success result');
  context.assert(browserRouteSwitchDriftValidation.status === 'failed', 'source-to-sea browser result validation fails route switch drift');
  context.assert(browserRouteSwitchDriftValidation.failedChecks.includes('browser execution route switches pass'), 'source-to-sea browser result validation reports route switch drift');
  context.assert(browserLifecycleCountDriftValidation.status === 'failed', 'source-to-sea browser result validation fails lifecycle count drift');
  context.assert(browserLifecycleCountDriftValidation.failedChecks.includes('browser execution route lifecycle cycles pass'), 'source-to-sea browser result validation reports lifecycle count drift');
  context.assert(browserCrossPrimitiveDriftValidation.status === 'failed', 'source-to-sea browser result validation fails cross-primitive event drift');
  context.assert(browserCrossPrimitiveDriftValidation.failedChecks.includes('browser execution cross-primitive events pass'), 'source-to-sea browser result validation reports cross-primitive event drift');
  context.assert(browserObjectStatusDriftValidation.status === 'failed', 'source-to-sea browser result validation fails object status drift');
  context.assert(browserObjectStatusDriftValidation.failedChecks.includes('browser execution object matrix passes'), 'source-to-sea browser result validation reports object status drift');
  const ciArtifactFixtureReport = {
    ...evidenceReport,
    ok: true,
    status: 'passed',
    artifact: {
      ...evidenceReport.artifact,
      browserExecutionRequired: true,
      browserExecutionStatus: 'passed'
    },
    browserExecution: {
      schema: RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA,
      workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
      resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
      fixture: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
      driver: RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER,
      required: true,
      ok: true,
      status: 'passed',
      result: {
        objectCount: objectMatrix.objectCount,
        crossPrimitiveEvents: objectMatrix.crossPrimitiveEvents.map((entry) => ({
          ...entry,
          status: 'passed'
        })),
        routeSwitches: objectMatrix.routeSwitches.map((entry) => ({
          ...entry,
          status: 'passed',
          targetMounted: true,
          targetVisible: true
        })),
        routeLifecycleCycles: objectMatrix.routeLifecycleCycles.map((entry) => ({
          ...entry,
          status: 'passed',
          unmounted: true,
          remounted: true,
          resourceDisposed: true,
          countsMatch: true,
          unmountCount: 1,
          remountCount: 1
        }))
      }
    }
  };
  const ciArtifactValidation = createRmtVNextSourceToSeaCiArtifactValidation(ciArtifactFixtureReport);
  const ciArtifactBrokenValidation = createRmtVNextSourceToSeaCiArtifactValidation({
    ...ciArtifactFixtureReport,
    browserExecution: {
      ...ciArtifactFixtureReport.browserExecution,
      result: {
        ...ciArtifactFixtureReport.browserExecution.result,
        objectCount: 3
      }
    }
  });
  context.assert(ciArtifactValidation.schema === RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA, 'source-to-sea CI artifact validation declares schema');
  context.assert(ciArtifactValidation.ok === true && ciArtifactValidation.status === 'passed', 'source-to-sea CI artifact validation accepts complete ChromeDriver artifact');
  context.assert(ciArtifactValidation.driver === RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER, 'source-to-sea CI artifact validation records ChromeDriver');
  context.assert(ciArtifactBrokenValidation.status === 'failed', 'source-to-sea CI artifact validation fails closed on object-count drift');
  const ciArtifactReplayPath = path.join(os.tmpdir(), `xtend-rmt-vnext-source-to-sea-ci-artifact-replay-${process.pid}.json`);
  const ciArtifactMissingReplayPath = path.join(os.tmpdir(), `xtend-rmt-vnext-source-to-sea-ci-artifact-missing-${process.pid}.json`);
  try {
    fs.unlinkSync(ciArtifactMissingReplayPath);
  } catch (_) {
    // Missing is the expected setup for the fail-closed replay path.
  }
  fs.writeFileSync(ciArtifactReplayPath, `${JSON.stringify(ciArtifactFixtureReport, null, 2)}\n`, 'utf8');
  const ciArtifactReplayValidation = validateRmtVNextSourceToSeaCiArtifactFile(ciArtifactReplayPath, { rootDir });
  const ciArtifactMissingReplayValidation = validateRmtVNextSourceToSeaCiArtifactFile(ciArtifactMissingReplayPath, { rootDir });
  try {
    fs.unlinkSync(ciArtifactReplayPath);
  } catch (_) {
    // Best-effort temp cleanup.
  }
  context.assert(ciArtifactReplayValidation.ok === true && ciArtifactReplayValidation.status === 'passed', 'source-to-sea CI artifact replay accepts stored ChromeDriver artifact');
  context.assert(ciArtifactReplayValidation.replayed === true, 'source-to-sea CI artifact replay marks replayed artifact');
  context.assert(ciArtifactMissingReplayValidation.status === 'failed', 'source-to-sea CI artifact replay fails closed for missing artifact');
  const cleanupInvalidLifecycleCycle = cleanupInvalidObjectMatrix && cleanupInvalidObjectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.detail');
  context.assert(cleanupInvalidObjectMatrix && cleanupInvalidObjectMatrix.status === 'failed', 'source-to-sea cleanup invalid fixture fails lifecycle matrix');
  context.assert(cleanupInvalidLifecycleCycle && cleanupInvalidLifecycleCycle.status === 'failed', 'source-to-sea cleanup invalid fixture marks lifecycle cycle failed');
  context.assert(cleanupInvalidLifecycleCycle && Array.isArray(cleanupInvalidLifecycleCycle.diagnostics) && cleanupInvalidLifecycleCycle.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.disposePolicyMissing), 'source-to-sea cleanup invalid fixture reports missing dispose policy diagnostic');
  context.assert(cleanupInvalidLifecycleCycle && cleanupInvalidLifecycleCycle.resource && cleanupInvalidLifecycleCycle.resource.dispose === null, 'source-to-sea cleanup invalid fixture exposes missing dispose policy evidence');
  const cleanupOwnerInvalidLifecycleCycle = cleanupOwnerInvalidObjectMatrix && cleanupOwnerInvalidObjectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.detail');
  context.assert(cleanupOwnerInvalidObjectMatrix && cleanupOwnerInvalidObjectMatrix.status === 'failed', 'source-to-sea cleanup owner invalid fixture fails lifecycle matrix');
  context.assert(cleanupOwnerInvalidLifecycleCycle && cleanupOwnerInvalidLifecycleCycle.status === 'failed', 'source-to-sea cleanup owner invalid fixture marks lifecycle cycle failed');
  context.assert(cleanupOwnerInvalidLifecycleCycle && Array.isArray(cleanupOwnerInvalidLifecycleCycle.diagnostics) && cleanupOwnerInvalidLifecycleCycle.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.ownerMismatch), 'source-to-sea cleanup owner invalid fixture reports owner mismatch diagnostic');
  context.assert(cleanupOwnerInvalidLifecycleCycle && cleanupOwnerInvalidLifecycleCycle.resource && cleanupOwnerInvalidLifecycleCycle.resource.owner && cleanupOwnerInvalidLifecycleCycle.resource.owner.id === 'demo.feedback.toast', 'source-to-sea cleanup owner invalid fixture exposes wrong resource owner');
  const cleanupResourceMissingDetailCycle = cleanupResourceMissingObjectMatrix && cleanupResourceMissingObjectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.detail');
  const cleanupResourceMissingLifecycleCycle = cleanupResourceMissingObjectMatrix && cleanupResourceMissingObjectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.audit');
  context.assert(cleanupResourceMissingObjectMatrix && cleanupResourceMissingObjectMatrix.status === 'failed', 'source-to-sea cleanup resource missing fixture fails lifecycle matrix');
  context.assert(cleanupResourceMissingDetailCycle && cleanupResourceMissingDetailCycle.status === 'passed', 'source-to-sea cleanup resource missing fixture keeps unrelated detail lifecycle passing');
  context.assert(cleanupResourceMissingLifecycleCycle && cleanupResourceMissingLifecycleCycle.status === 'failed', 'source-to-sea cleanup resource missing fixture marks audit lifecycle failed');
  context.assert(cleanupResourceMissingLifecycleCycle && Array.isArray(cleanupResourceMissingLifecycleCycle.diagnostics) && cleanupResourceMissingLifecycleCycle.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.resourceMissing), 'source-to-sea cleanup resource missing fixture reports missing resource diagnostic');
  context.assert(cleanupResourceMissingLifecycleCycle && cleanupResourceMissingLifecycleCycle.resource === null, 'source-to-sea cleanup resource missing fixture exposes missing resource evidence');
  context.assert(cleanupResourceMissingLifecycleCycle && cleanupResourceMissingLifecycleCycle.resourceId === 'demo.feedback.auditTimer', 'source-to-sea cleanup resource missing fixture targets audit cleanup resource');
  context.assert(cleanupResourceMissingLifecycleCycle && Array.isArray(cleanupResourceMissingLifecycleCycle.resources) && cleanupResourceMissingLifecycleCycle.resources.some((entry) => entry.resourceId === 'demo.feedback.auditSubscription' && entry.resource && entry.resource.kind === 'subscription'), 'source-to-sea cleanup resource missing fixture keeps secondary subscription resource visible');
  const cleanupKindInvalidDetailCycle = cleanupKindInvalidObjectMatrix && cleanupKindInvalidObjectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.detail');
  const cleanupKindInvalidLifecycleCycle = cleanupKindInvalidObjectMatrix && cleanupKindInvalidObjectMatrix.routeLifecycleCycles.find((entry) => entry.targetPrimitiveId === 'demo.feedback.audit');
  const cleanupKindInvalidResource = cleanupKindInvalidLifecycleCycle && cleanupKindInvalidLifecycleCycle.resources.find((entry) => entry.resourceId === 'demo.feedback.auditSubscription');
  context.assert(cleanupKindInvalidObjectMatrix && cleanupKindInvalidObjectMatrix.status === 'failed', 'source-to-sea cleanup kind invalid fixture fails lifecycle matrix');
  context.assert(cleanupKindInvalidDetailCycle && cleanupKindInvalidDetailCycle.status === 'passed', 'source-to-sea cleanup kind invalid fixture keeps unrelated detail lifecycle passing');
  context.assert(cleanupKindInvalidLifecycleCycle && cleanupKindInvalidLifecycleCycle.status === 'failed', 'source-to-sea cleanup kind invalid fixture marks audit lifecycle failed');
  context.assert(cleanupKindInvalidLifecycleCycle && Array.isArray(cleanupKindInvalidLifecycleCycle.diagnostics) && cleanupKindInvalidLifecycleCycle.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.kindMismatch), 'source-to-sea cleanup kind invalid fixture reports kind mismatch diagnostic');
  context.assert(cleanupKindInvalidResource && cleanupKindInvalidResource.expectedKind === 'subscription', 'source-to-sea cleanup kind invalid fixture keeps expected subscription kind');
  context.assert(cleanupKindInvalidResource && cleanupKindInvalidResource.resource && cleanupKindInvalidResource.resource.kind === 'cache', 'source-to-sea cleanup kind invalid fixture exposes wrong resource kind');
  context.assert(evidenceReport.browserExecution.status === browserExecution.status, 'source-to-sea evidence report carries browser execution evidence');
  if (browserExecution.status === 'skipped') {
    context.skip(`browser execution skipped: ${browserExecution.reason}`);
  } else {
    context.assert(browserExecution.status === 'passed', 'browser execution reads passed fixture result');
    context.assert(browserExecution.result && browserExecution.result.primitiveId === evidence.primitiveId, 'browser execution primitive matches source evidence');
    context.assert(browserExecution.result && browserExecution.result.scheduleRef === evidence.kernel.scheduleRef, 'browser execution schedule matches kernel evidence');
    context.assert(browserExecution.result && browserExecution.result.fiberRef === evidence.fabric.fiber, 'browser execution fiber matches Fabric evidence');
    context.assert(browserExecution.result && browserExecution.result.fabricScheduleRef === evidence.fabric.scheduleRef, 'browser execution Fabric schedule matches bridge evidence');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.events) && browserExecution.result.events.some((event) => event.action === evidence.browser.expectedAction), 'browser execution observes source action event');
    context.assert(browserExecution.result && browserExecution.result.objectCount === 4, 'browser execution observes four visible primitives');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.objects) && browserExecution.result.objects.every((entry) => entry.status === 'passed'), 'browser execution object matrix passes');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.crossPrimitiveEvents) && browserExecution.result.crossPrimitiveEvents.length === 2 && browserExecution.result.crossPrimitiveEvents.every((entry) => entry.status === 'passed'), 'browser execution cross-primitive events pass');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.crossPrimitiveEvents) && browserExecution.result.crossPrimitiveEvents.some((entry) => entry.stage === 'route-target' && entry.sourcePrimitiveId === 'demo.feedback.detail' && entry.targetPrimitiveId === 'demo.feedback.audit' && entry.sourceLane === 'transition' && entry.targetLane === 'transition'), 'browser execution records cross-route primitive event');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.routeSwitches) && browserExecution.result.routeSwitches.length === 2 && browserExecution.result.routeSwitches.every((entry) => entry.status === 'passed' && entry.targetMounted === true && entry.targetVisible === true), 'browser execution route switches pass');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.routeLifecycleCycles) && browserExecution.result.routeLifecycleCycles.length === 2 && browserExecution.result.routeLifecycleCycles.every((entry) => entry.status === 'passed' && entry.unmounted === true && entry.remounted === true && entry.resourceDisposed === true && entry.countsMatch === true), 'browser execution route lifecycle cycles pass');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.routeLifecycleCycles) && browserExecution.result.routeLifecycleCycles.some((entry) => entry.targetPrimitiveId === 'demo.feedback.audit' && entry.unmountCount === 1 && entry.remountCount === 1), 'browser execution records audit lifecycle counts');
    context.assert(browserExecution.result && Array.isArray(browserExecution.result.routeLifecycleCycles) && browserExecution.result.routeLifecycleCycles.some((entry) => entry.targetPrimitiveId === 'demo.feedback.audit' && Array.isArray(entry.resourceIds) && entry.resourceIds.includes('demo.feedback.auditSubscription') && Array.isArray(entry.resourceKinds) && entry.resourceKinds.includes('subscription')), 'browser execution records subscription cleanup resource');
  }
  context.assert(evidence.correlation.map((entry) => entry.layer).join('>') === 'source>compiler>kernel>fabric>ui>browser', 'correlation spans source to browser');
  context.assert(evidence.fabric.bridge.correlation.map((entry) => entry.layer).join('>') === 'source>kernel.schedule>kernel.fiber>fabric.mapping>fabric.fiber>host.adapter>component.fibers>route.fibers>fabric.telemetry>browser', 'fabric bridge correlation spans source to host adapter, route/component fibers and Fabric telemetry');
  context.assert(runner.hasSuite("rmt-vnext-source-to-sea"), 'test runner exposes PRIM-06 source-to-sea suite');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:evidence'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js', 'package exposes source-to-sea evidence artifact script');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:browser-required'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js --require-browser', 'package exposes source-to-sea browser-required evidence script');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:chromium'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js --engine chromium', 'package exposes source-to-sea Chromium Hypervisor script');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:firefox'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js --engine firefox', 'package exposes source-to-sea Firefox Hypervisor script');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:webkit'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js --engine webkit', 'package exposes source-to-sea WebKit Hypervisor script');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:validate-artifact'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js --validate-artifact', 'package exposes source-to-sea CI artifact replay script');
  context.assert(packageManifest.scripts['test:rmt-vnext-source-to-sea:validate-artifact:firefox'] === 'node scripts/capture_rmt_vnext_source_to_sea_evidence.js --validate-artifact --engine firefox', 'package exposes source-to-sea Firefox artifact replay script');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaCiBrowserDriver === RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER, 'package metadata records source-to-sea CI browser driver');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaCiMode === 'workflow_dispatch_optional', 'package metadata marks source-to-sea CI evidence optional');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaCiWorkflowDispatchInput === 'run_source_to_sea', 'package metadata records source-to-sea workflow dispatch input');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaRequiredInDefaultCi === false, 'package metadata excludes source-to-sea from default CI');
  context.assert(!packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.suites.includes('rmt-vnext-source-to-sea'), 'package metadata excludes source-to-sea from primitive default suites');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.optionalSuites.includes('rmt-vnext-source-to-sea'), 'package metadata keeps source-to-sea as optional primitive suite');
  context.assert(Array.isArray(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaHypervisorEngines) && packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaHypervisorEngines.includes('firefox') && packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.sourceToSeaHypervisorEngines.includes('webkit'), 'package metadata records platform-neutral Hypervisor engines');
  context.assert(Array.isArray(RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS) && RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS.includes('firefox') && RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS.includes('webkit'), 'source-to-sea module exposes engine-neutral adapter support');
  context.assert(workflow.includes('run_source_to_sea:'), 'CI workflow exposes optional source-to-sea dispatch input');
  context.assert(workflow.includes("github.event_name == 'workflow_dispatch' && inputs.run_source_to_sea == true"), 'CI workflow gates source-to-sea execution behind manual dispatch input');
  context.assert(require("../utils/test-catalog").workflowHasScript(workflow, "test:rmt-vnext-source-to-sea:chromium"), 'CI workflow exposes optional source-to-sea Hypervisor execution');
  context.assert(workflow.includes('- name: Capture RMT vNext source-to-sea browser evidence'), 'CI workflow keeps optional source-to-sea capture step');
  context.assert(workflow.includes('xtend-rmt-vnext-source-to-sea-capture.exitcode'), 'CI workflow records source-to-sea capture exit status');
  context.assert(workflow.includes('rm -f .xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json'), 'CI workflow removes stale source-to-sea artifacts before capture');
  context.assert(workflow.includes('exit "$status"'), 'CI workflow fails the source-to-sea capture step when browser evidence capture fails');
  context.assert(workflow.includes('[ "$capture_status" != "0" ]'), 'CI workflow rewrites failed fallback source-to-sea artifact when capture fails');
  context.assert(workflow.includes('Ensure RMT vNext source-to-sea evidence artifact'), 'CI workflow creates a failed fallback source-to-sea artifact when capture exits early');
  context.assert(workflow.includes('Validate RMT vNext source-to-sea evidence'), 'CI workflow validates source-to-sea evidence after upload');
  context.assert(workflow.includes('XTEND_BROWSER_HYPERVISOR_ENGINE: chromium'), 'CI workflow selects only the source-to-sea Hypervisor engine');
  context.assert(workflow.includes(RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH), 'CI workflow uploads source-to-sea evidence artifact');
  context.assert(sourceToSeaModule.includes("require('../browser-hypervisor')"), 'source-to-sea execution delegates browser lifecycle to the shared Hypervisor');
  context.assert(sourceToSeaModule.includes('runFixture({'), 'source-to-sea execution uses the shared fixture contract');
  context.assert(!sourceToSeaModule.includes('DriverPath') && !sourceToSeaModule.includes('WebDriverPort') && !sourceToSeaModule.includes('BrowserName'), 'source-to-sea consumer owns no driver, executable, port or browser-name special case');
  context.assert(sourceToSeaModule.includes('normalizeEngine'), 'source-to-sea supports engine-neutral adapter selection');

  const sourceToSeaDoc = readDocs(SOURCE_TO_SEA_DOC_PATHS, rootDir);
  const backlog = sourceToSeaDoc;
  context.assert(source.includes('surface demo.feedback.toast'), 'source-to-sea fixture includes toast primitive surface');
  context.assert(source.includes('surface demo.feedback.detail'), 'source-to-sea fixture includes route target primitive surface');
  context.assert(source.includes('surface demo.feedback.audit'), 'source-to-sea fixture includes second route target primitive surface');
  context.assert(source.includes('resource demo.feedback.detailTimer'), 'source-to-sea fixture includes route target cleanup resource');
  context.assert(source.includes('resource demo.feedback.auditTimer'), 'source-to-sea fixture includes second route target cleanup resource');
  context.assert(source.includes('resource demo.feedback.auditSubscription kind subscription owner surface.demo.feedback.audit'), 'source-to-sea fixture includes subscription cleanup resource');
  context.assert(source.includes('destroy releases resource demo.feedback.auditSubscription'), 'source-to-sea fixture releases subscription cleanup resource');
  context.assert(source.includes('reduce state.demo.feedback.audit.text = "Audit escalated"'), 'source-to-sea fixture includes cross-route audit reducer');
  context.assert(source.includes('emit demo.feedback.audit.escalated with label input.label'), 'source-to-sea fixture includes cross-route audit event');
  context.assert(cleanupInvalidSource.includes('resource demo.feedback.detailTimer kind timer owner surface.demo.feedback.detail'), 'source-to-sea cleanup invalid fixture keeps target cleanup resource');
  context.assert(!cleanupInvalidSource.includes('resource demo.feedback.detailTimer kind timer owner surface.demo.feedback.detail {\n    dispose on surface.destroy\n  }'), 'source-to-sea cleanup invalid fixture omits target dispose policy');
  context.assert(cleanupOwnerInvalidSource.includes('resource demo.feedback.detailTimer kind timer owner surface.demo.feedback.toast'), 'source-to-sea cleanup owner invalid fixture binds cleanup resource to wrong owner');
  context.assert(cleanupOwnerInvalidSource.includes('dispose on surface.destroy'), 'source-to-sea cleanup owner invalid fixture keeps dispose policy for owner-only diagnosis');
  context.assert(cleanupResourceMissingSource.includes('surface demo.feedback.audit'), 'source-to-sea cleanup resource missing fixture keeps audit route target');
  context.assert(!cleanupResourceMissingSource.includes('resource demo.feedback.auditTimer'), 'source-to-sea cleanup resource missing fixture omits audit cleanup resource');
  context.assert(!cleanupResourceMissingSource.includes('destroy releases resource demo.feedback.auditTimer'), 'source-to-sea cleanup resource missing fixture omits audit destroy release');
  context.assert(cleanupResourceMissingSource.includes('resource demo.feedback.auditSubscription kind subscription owner surface.demo.feedback.audit'), 'source-to-sea cleanup resource missing fixture keeps subscription cleanup resource');
  context.assert(cleanupKindInvalidSource.includes('resource demo.feedback.auditSubscription kind cache owner surface.demo.feedback.audit'), 'source-to-sea cleanup kind invalid fixture uses wrong subscription resource kind');
  context.assert(cleanupKindInvalidSource.includes('destroy releases resource demo.feedback.auditSubscription'), 'source-to-sea cleanup kind invalid fixture still releases subscription resource');
  context.assert(source.includes('reduce state.demo.feedback.toast.text = "Saved notification"'), 'source-to-sea fixture includes cross-primitive reducer');
  context.assert(source.includes('lane idle weight 40'), 'source-to-sea fixture includes idle lane primitive');
  context.assert(source.includes('lane transition weight 60'), 'source-to-sea fixture includes transition route target lane');
  context.assert(browserFixture.includes('data-rmt-primitive-id="demo.feedback.toast"'), 'browser fixture includes toast primitive marker');
  context.assert(browserFixture.includes('data-rmt-primitive-id="demo.feedback.detail"'), 'browser fixture includes route target primitive marker');
  context.assert(browserFixture.includes('data-rmt-primitive-id="demo.feedback.audit"'), 'browser fixture includes second route target primitive marker');
  context.assert(browserFixture.includes('"crossPrimitiveEvents"'), 'browser fixture declares cross-primitive event matrix');
  context.assert(browserFixture.includes('"stage": "route-target"'), 'browser fixture declares cross-route event stage');
  context.assert(browserFixture.includes('"eventId": "demo.feedback.audit.escalated"'), 'browser fixture declares cross-route audit event');
  context.assert(crossRouteInvalidBrowserFixture.includes('"targetPrimitiveId": "demo.feedback.toast"'), 'cross-route invalid browser fixture declares wrong target primitive');
  context.assert(browserFixture.includes('"resourceId": "demo.feedback.auditSubscription"'), 'browser fixture declares subscription cleanup resource');
  context.assert(browserFixture.includes('"kind": "subscription"'), 'browser fixture declares subscription cleanup kind');
  context.assert(browserFixture.includes('"routeSwitches"'), 'browser fixture declares route switch matrix');
  context.assert(browserFixture.includes('"routeLifecycleCycles"'), 'browser fixture declares route lifecycle matrix');
  context.assert(backlog.includes('| `RMT-VNEXT-PRIM-05` | P0 | completed |'), 'backlog marks PRIM-05 completed');
  context.assert(backlog.includes('| `RMT-VNEXT-PRIM-06` | P0 | completed |'), 'backlog marks PRIM-06 completed');
  context.assert(backlog.includes('vnext-source-to-sea-cleanup-owner-invalid.rmt'), 'backlog records cleanup owner invalid fixture');
  context.assert(backlog.includes('rmt.vnext.source_to_sea.cleanup_owner_mismatch'), 'backlog records cleanup owner mismatch diagnostic');
  context.assert(backlog.includes('vnext-source-to-sea-cleanup-resource-missing.rmt'), 'backlog records cleanup resource missing fixture');
  context.assert(backlog.includes('rmt.vnext.source_to_sea.cleanup_resource_missing'), 'backlog records cleanup resource missing diagnostic');
  context.assert(backlog.includes('vnext-source-to-sea-cleanup-kind-invalid.rmt'), 'backlog records cleanup kind invalid fixture');
  context.assert(backlog.includes('rmt.vnext.source_to_sea.cleanup_kind_mismatch'), 'backlog records cleanup kind mismatch diagnostic');
  context.assert(backlog.includes('xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1'), 'backlog records CI artifact validation schema');
  context.assert(backlog.includes('demo.feedback.detail.ack -> demo.feedback.audit'), 'backlog records cross-route event slice');
  context.assert(backlog.includes('demo.feedback.auditSubscription'), 'backlog records subscription cleanup resource');
  context.assert(backlog.includes('ChromeDriver-Auto-Cleanup'), 'backlog records chromedriver auto cleanup');
  context.assert(backlog.includes('test:rmt-vnext-source-to-sea:validate-artifact'), 'backlog records CI artifact replay gate');
  context.assert(backlog.includes('rmt-vnext-source-to-sea-cross-route-invalid.html'), 'backlog records cross-route invalid browser fixture');
  context.assert(backlog.includes('xtend.rmt.vnext.source-to-sea-browser-result-validation.v1'), 'backlog records browser result validation schema');
  context.assert(backlog.includes('browser execution route switches pass'), 'backlog records route switch result drift guard');
  context.assert(backlog.includes('browser execution cross-primitive events pass'), 'backlog records cross-primitive result drift guard');
  context.assert(backlog.includes('browser execution object matrix passes'), 'backlog records object status result drift guard');
  context.assert(backlog.includes('demo.feedback.audit'), 'backlog records second route target');
  context.assert(backlog.includes('countsMatch'), 'backlog records route lifecycle count evidence');
  context.assert(sourceToSeaDoc.includes('xtend.rmt.vnext.source-to-sea-evidence.v1'), 'doc records evidence contract');
  context.assert(sourceToSeaDoc.includes('xtend.rmt.vnext.source-to-sea-evidence-report.v1'), 'doc records evidence report contract');
  context.assert(sourceToSeaDoc.includes('xtend.rmt.vnext.source-to-sea-object-matrix.v1'), 'doc records object matrix contract');
  context.assert(sourceToSeaDoc.includes('demo.feedback.toast'), 'doc records second visible primitive');
  context.assert(sourceToSeaDoc.includes('demo.feedback.audit'), 'doc records second route target primitive');
  context.assert(sourceToSeaDoc.includes('"objectCount": 4'), 'doc records four-object source-to-sea matrix');
  context.assert(sourceToSeaDoc.includes('countsMatch'), 'doc records route lifecycle count evidence');
  context.assert(sourceToSeaDoc.includes('vnext-source-to-sea-cleanup-owner-invalid.rmt'), 'doc records cleanup owner invalid fixture');
  context.assert(sourceToSeaDoc.includes('rmt.vnext.source_to_sea.cleanup_owner_mismatch'), 'doc records cleanup owner mismatch diagnostic');
  context.assert(sourceToSeaDoc.includes('vnext-source-to-sea-cleanup-resource-missing.rmt'), 'doc records cleanup resource missing fixture');
  context.assert(sourceToSeaDoc.includes('rmt.vnext.source_to_sea.cleanup_resource_missing'), 'doc records cleanup resource missing diagnostic');
  context.assert(sourceToSeaDoc.includes('vnext-source-to-sea-cleanup-kind-invalid.rmt'), 'doc records cleanup kind invalid fixture');
  context.assert(sourceToSeaDoc.includes('rmt.vnext.source_to_sea.cleanup_kind_mismatch'), 'doc records cleanup kind mismatch diagnostic');
  context.assert(sourceToSeaDoc.includes('xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1'), 'doc records CI artifact validation schema');
  context.assert(sourceToSeaDoc.includes('demo.feedback.detail.ack -> demo.feedback.audit'), 'doc records cross-route event slice');
  context.assert(sourceToSeaDoc.includes('demo.feedback.auditSubscription'), 'doc records subscription cleanup resource');
  context.assert(sourceToSeaDoc.includes('ChromeDriver-Auto-Cleanup'), 'doc records chromedriver auto cleanup');
  context.assert(sourceToSeaDoc.includes('rmt-vnext-source-to-sea-cross-route-invalid.html'), 'doc records cross-route invalid browser fixture');
  context.assert(sourceToSeaDoc.includes('cross event route-target state belongs to target primitive'), 'doc records cross-route target state guard');
  context.assert(sourceToSeaDoc.includes('xtend.rmt.vnext.source-to-sea-browser-result-validation.v1'), 'doc records browser result validation schema');
  context.assert(sourceToSeaDoc.includes('browser execution route lifecycle cycles pass'), 'doc records lifecycle result drift guard');
  context.assert(sourceToSeaDoc.includes('browser execution cross-primitive events pass'), 'doc records cross-primitive result drift guard');
  context.assert(sourceToSeaDoc.includes('browser execution object matrix passes'), 'doc records object status result drift guard');
  context.assert(sourceToSeaDoc.includes('test:rmt-vnext-source-to-sea:validate-artifact'), 'doc records CI artifact replay script');
  context.assert(sourceToSeaDoc.includes('--validate-artifact'), 'doc records CI artifact replay CLI flag');
  context.assert(sourceToSeaDoc.includes(RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH), 'doc records source-to-sea evidence report path');
  context.assert(sourceToSeaModule.includes('createRmtVNextSourceToSeaCiArtifactValidation'), 'source-to-sea module exposes CI artifact validation helper');
  context.assert(sourceToSeaModule.includes('createRmtVNextSourceToSeaBrowserResultValidation'), 'source-to-sea module exposes browser result validation helper');
  context.assert(sourceToSeaModule.includes('validateRmtVNextSourceToSeaCiArtifactFile'), 'source-to-sea module exposes CI artifact replay helper');
  context.assert(sourceToSeaDoc.includes('source -> kernel -> Fabric -> UI -> Browser'), 'doc records source-to-sea chain');

  return context.result({
    schema: RMT_VNEXT_SOURCE_TO_SEA_SCHEMA,
    evidenceSchema: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    fixture: RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH,
    browserFixture: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
    evidenceReportPath: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
    objectCount: objectMatrix && objectMatrix.objectCount,
    primitiveId: evidence.primitiveId,
    browserExecution
  });
}

function printRmtVNextSourceToSeaReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT vNext Source-to-Sea Browser Gate erfolgreich.',
    failureTitle: 'RMT vNext Source-to-Sea Browser Gate fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextSourceToSeaReport,
  runRmtVNextSourceToSeaSuite
};
