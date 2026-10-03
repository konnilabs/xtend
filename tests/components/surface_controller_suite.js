const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_DIAGNOSTIC_CODES,
  REQUIRED_DOCS,
  REQUIRED_LANES,
  REQUIRED_METHODS,
  REQUIRED_STATE_KEYS,
  REQUIRED_SURFACE_TYPES,
  SOURCE_ARTIFACTS,
  SURFACE_CONTROLLER_CONTRACT,
  SURFACE_CONTROLLER_DIAGNOSTIC_SCHEMA,
  SURFACE_CONTROLLER_DOCS,
  SURFACE_CONTROLLER_LOCAL_GATE,
  SURFACE_CONTROLLER_MODULE,
  SURFACE_CONTROLLER_PACKAGE_SCRIPT,
  SURFACE_CONTROLLER_PLAN,
  SURFACE_CONTROLLER_REPORT_SCHEMA,
  SURFACE_CONTROLLER_RUNTIME,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_CONTROLLER_SNAPSHOT_SCHEMA,
  SURFACE_CONTROLLER_STATUS,
  SURFACE_CONTROLLER_SUITE,
  SURFACE_CONTROLLER_TARGET,
  SURFACE_CONTROLLER_TYPES,
  SURFACE_CONTROLLER_WORKPACKAGE,
  SURFACE_CONTROLLER_WORKPACKAGE_DOC,
  SURFACE_OPERATION_RESULT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  createSurfaceControllerPlan,
  createSurfaceControllerReport,
  validateSurfaceControllerPlan
} = require('../../catalog/surface-manager-controller');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function collectSurfaceFixtureRecords(fixture) {
  return (fixture.components || []).filter((component) => component.metadata && component.metadata.surface);
}

function createStateProbe() {
  const data = {};
  const setCalls = [];
  const batches = [];
  return {
    data,
    setCalls,
    batches,
    set(key, value) {
      setCalls.push({ key, value });
      data[key] = value;
    },
    batchUpdate(updates) {
      batches.push({ ...updates });
      Object.assign(data, updates);
    },
    get(key) {
      return data[key];
    }
  };
}

async function importEsm(rootDir, relativePath) {
  return import(pathToFileURL(resolveRepoPath(relativePath, rootDir)).href);
}

async function loadSurfaceControllerRuntime(rootDir) {
  const moduleApi = await importEsm(rootDir, SURFACE_CONTROLLER_RUNTIME);
  if (moduleApi && typeof moduleApi.createSurfaceController === 'function') return moduleApi;
  return globalThis.XTendSurfaceController || {};
}

async function exerciseRuntime(context, rootDir) {
  const runtime = await loadSurfaceControllerRuntime(rootDir);
  const projectionRuntime = await importEsm(rootDir, 'components/xsurfacemanager-state-projection-adapter.js');
  const clockRuntime = await importEsm(rootDir, 'components/xsurfacemanager-host-clock-adapter.js');
  const fixture = readJson('tests/fixtures/rmt-surface-manager-workbench.rmt', rootDir);
  const state = createStateProbe();
  const fabricEvents = [];
  const controller = runtime.createSurfaceController({
    managerId: 'workbench.manager',
    stateKey: 'xtend.surface.registry',
    stateProjection: projectionRuntime.createSurfaceStateProjectionAdapter(state, { strict: true }),
    fabric: {
      emitDiagnostic(event) {
        fabricEvents.push(event);
      }
    },
    clock: clockRuntime.createSurfaceHostClockAdapter(() => '2026-05-09T00:00:00.000Z'),
    baseZIndex: 100,
    maxDiagnostics: 40
  });
  const records = collectSurfaceFixtureRecords(fixture);
  const subscriberSnapshots = [];
  const unsubscribe = controller.subscribe((surfaceSnapshot) => {
    subscriberSnapshots.push(surfaceSnapshot);
  }, { emitCurrent: true });

  context.assert(runtime.SURFACE_CONTROLLER_SCHEMA === SURFACE_CONTROLLER_SCHEMA, 'Runtime exposes Surface Controller schema');
  context.assert(runtime.SURFACE_RECORD_SCHEMA === SURFACE_RECORD_SCHEMA, 'Runtime exposes Surface Record schema');
  context.assert(runtime.SURFACE_SNAPSHOT_SCHEMA === SURFACE_CONTROLLER_SNAPSHOT_SCHEMA, 'Runtime exposes Surface Snapshot schema');
  context.assert(runtime.SURFACE_DIAGNOSTIC_SCHEMA === SURFACE_CONTROLLER_DIAGNOSTIC_SCHEMA, 'Runtime exposes Surface Diagnostic schema');
  context.assert(runtime.SURFACE_OPERATION_RESULT_SCHEMA === SURFACE_OPERATION_RESULT_SCHEMA, 'Runtime exposes operation result schema');
  context.assert(controller.schema === SURFACE_CONTROLLER_SCHEMA, 'Controller instance carries stable schema');
  context.assert(controller.managerId === 'workbench.manager', 'Controller owns expected manager id');
  REQUIRED_METHODS.forEach((method) => {
    context.assert(typeof controller[method] === 'function', `Controller method exists: ${method}`);
  });
  REQUIRED_STATE_KEYS.forEach((key) => {
    context.assert(Object.values(runtime.STATE_KEYS).includes(key), `Runtime state key exists: ${key}`);
  });
  REQUIRED_SURFACE_TYPES.forEach((type) => {
    context.assert(runtime.SURFACE_TYPES.includes(type), `Runtime surface type exists: ${type}`);
  });
  REQUIRED_DIAGNOSTIC_CODES.forEach((code) => {
    context.assert(runtime.DIAGNOSTIC_CODES.includes(code), `Runtime diagnostic code exists: ${code}`);
  });

  context.assert(records.length === 3, 'Surface fixture exposes two windows and one side-panel for controller runtime');
  records.forEach((record) => {
    const registration = controller.registerSurface(record);
    context.assert(registration.ok === true, `${record.id}: registerSurface succeeds`);
  });

  const inspectorOpen = controller.openSurface('workbench.inspector');
  const editorOpen = controller.openSurface('workbench.editor');
  const inspectorFocus = controller.focusSurface('workbench.inspector');
  const inspectorMove = controller.moveSurface('workbench.inspector', { x: 128, y: 96 });
  const inspectorResize = controller.resizeSurface('workbench.inspector', { width: 700, height: 460 });
  const inspectorMaximize = controller.maximizeSurface('workbench.inspector');
  const inspectorRestore = controller.restoreSurface('workbench.inspector');
  const propertiesOpen = controller.openSurface('workbench.properties');
  const propertiesResize = controller.resizeSurface('workbench.properties', { width: 360 });
  const editorMinimize = controller.minimizeSurface('workbench.editor');
  const editorMaterialize = controller.materializeSurface('workbench.editor');
  const editorToggle = controller.toggleSurface('workbench.editor');
  const minimizedSnapshot = controller.snapshot();
  const editorToggleRestore = controller.toggleSurface('workbench.editor');
  const inspectorClose = controller.closeSurface('workbench.inspector', 'test-close');
  const missing = controller.openSurface('workbench.missing');
  const snapshot = controller.snapshot();

  [
    inspectorOpen,
    editorOpen,
    inspectorFocus,
    inspectorMove,
    inspectorResize,
    inspectorMaximize,
    inspectorRestore,
    propertiesOpen,
    propertiesResize,
    editorMinimize,
    editorMaterialize,
    editorToggle,
    editorToggleRestore,
    inspectorClose
  ].forEach((result) => {
    context.assert(result.ok === true, `${result.operation}: operation succeeds`);
    context.assert(result.schema === SURFACE_OPERATION_RESULT_SCHEMA, `${result.operation}: operation result schema is stable`);
    context.assert(result.diagnostic && result.diagnostic.schema === SURFACE_CONTROLLER_DIAGNOSTIC_SCHEMA, `${result.operation}: emits Surface diagnostic`);
  });

  context.assert(missing.ok === false && missing.code === 'xtend.surface.not-found', 'Missing surface emits deterministic not-found result');
  context.assert(snapshot.schema === SURFACE_CONTROLLER_SNAPSHOT_SCHEMA, 'Snapshot schema is stable');
  context.assert(minimizedSnapshot.openSurfaceCount === 2, 'Snapshot excludes minimized surfaces from open count');
  context.assert(!minimizedSnapshot.stack.includes('workbench.editor'), 'Snapshot stack excludes minimized editor before restore');
  context.assert(snapshot.surfaceCount === 3, 'Snapshot keeps all registered surfaces');
  context.assert(snapshot.openSurfaceCount === 2, 'Snapshot counts materialized open surfaces only');
  context.assert(snapshot.activeSurfaceId === 'workbench.editor', 'Controller restores the toggled editor as active');
  context.assert(snapshot.stack.includes('workbench.properties'), 'Snapshot stack includes open side-panel');
  context.assert(snapshot.stack.includes('workbench.editor'), 'Snapshot stack includes restored editor window');
  context.assert(!snapshot.stack.includes('workbench.inspector'), 'Snapshot stack excludes closed inspector window');

  const inspectorState = state.get('xtend.surface.workbench.inspector.state');
  const inspectorBounds = state.get('xtend.surface.workbench.inspector.bounds');
  const inspectorLifecycle = state.get('xtend.surface.workbench.inspector.lifecycle');
  const active = state.get('xtend.surface.active');
  const mirroredSnapshot = state.get('xtend.surface.snapshot');
  const registry = state.get('xtend.surface.registry');
  const diagnostics = state.get('xtend.surface.diagnostics');

  context.assert(Array.isArray(registry) && registry.length === 3, 'state registry mirror contains three surface states');
  context.assert(active === 'workbench.editor', 'state active mirror contains active surface id');
  context.assert(inspectorState && inspectorState.status === 'closed', 'state surface state mirror closes inspector');
  context.assert(inspectorState && !Object.prototype.hasOwnProperty.call(inspectorState, 'metadata'), 'state surface state mirror omits raw metadata payload');
  context.assert(inspectorBounds && inspectorBounds.x === 128 && inspectorBounds.y === 96, 'state bounds mirror stores moved window position');
  context.assert(inspectorBounds && inspectorBounds.width === 700 && inspectorBounds.height === 460, 'state bounds mirror restores resized window size after maximize/restore');
  context.assert(inspectorLifecycle && inspectorLifecycle.phase === 'close', 'state lifecycle mirror stores last phase');
  context.assert(mirroredSnapshot && mirroredSnapshot.schema === SURFACE_CONTROLLER_SNAPSHOT_SCHEMA, 'state snapshot mirror stores full Surface snapshot');
  context.assert(Array.isArray(diagnostics) && diagnostics.some((event) => event.code === 'xtend.surface.closed'), 'state diagnostics mirror stores lifecycle diagnostics');
  context.assert(fabricEvents.some((event) => event.code === 'xtend.surface.opened'), 'Fabric diagnostic bridge receives open diagnostics');
  context.assert(fabricEvents.every((event) => event.schema === SURFACE_CONTROLLER_DIAGNOSTIC_SCHEMA), 'Fabric diagnostic bridge receives Surface diagnostic schema only');
  context.assert(snapshot.surfaces.every((surface) => !Object.prototype.hasOwnProperty.call(surface, 'metadata')), 'Snapshot omits raw metadata payloads');
  context.assert(state.setCalls.length === 0, 'Surface Controller projects each lifecycle snapshot through batchUpdate without per-key XTend State writes');
  context.assert(state.batches.length > 0 && state.batches.every((batch) => Object.prototype.hasOwnProperty.call(batch, 'xtend.surface.snapshot')), 'Every Surface state projection is one complete batch containing the final snapshot');
  context.assert(subscriberSnapshots.length > 1 && subscriberSnapshots.every((entry) => entry.schema === SURFACE_CONTROLLER_SNAPSHOT_SCHEMA), 'Surface Controller subscribers observe only complete lifecycle snapshots');

  const removedRuntimeName = ['x', 'state'].join('');
  const previousGlobalState = globalThis[removedRuntimeName];
  let implicitGlobalWrites = 0;
  globalThis[removedRuntimeName] = { batchUpdate() { implicitGlobalWrites += 1; } };
  try {
    const isolatedController = runtime.createSurfaceController({
      managerId: 'isolated.manager',
      clock: clockRuntime.createSurfaceHostClockAdapter(() => '2026-05-09T00:00:00.000Z')
    });
    isolatedController.registerSurface({ id: 'isolated.surface', type: 'window' });
    isolatedController.dispose();
  } finally {
    if (typeof previousGlobalState === 'undefined') delete globalThis[removedRuntimeName];
    else globalThis[removedRuntimeName] = previousGlobalState;
  }
  context.assert(implicitGlobalWrites === 0, 'Surface Controller never auto-adopts the removed global runtime');

  let removedOptionWrites = 0;
  const removedOptionName = ['x', 'state'].join('');
  const removedOptionController = runtime.createSurfaceController({
    managerId: 'removed-option.manager',
    [removedOptionName]: { set() { removedOptionWrites += 1; } },
    clock: clockRuntime.createSurfaceHostClockAdapter(() => '2026-05-09T00:00:00.000Z')
  });
  removedOptionController.registerSurface({ id: 'removed-option.surface', type: 'window' });
  const removedOptionSnapshot = removedOptionController.readSnapshot();
  context.assert(removedOptionWrites === 0, 'Removed host option has no adapter effect');
  context.assert(removedOptionSnapshot.diagnostics.every((entry) => entry.code !== 'xtend.surface.state-projection.batch-required'), 'Removed host option installs no compatibility adapter or diagnostic');
  removedOptionController.dispose();

  const legacyProjectionDiagnostics = [];
  const unsafeLegacyProjection = projectionRuntime.createSurfaceStateProjectionAdapter({ set() {} }, {
    diagnose(event) { legacyProjectionDiagnostics.push(event); }
  });
  context.assert(unsafeLegacyProjection === null, 'Compatibility adapter refuses legacy per-key state writers');
  context.assert(legacyProjectionDiagnostics.length === 1 && legacyProjectionDiagnostics[0].code === 'xtend.surface.state-projection.batch-required', 'Compatibility adapter diagnoses a missing batchUpdate port exactly once');
  let strictProjectionError = null;
  try {
    projectionRuntime.createSurfaceStateProjectionAdapter({ set() {} }, { strict: true });
  } catch (error) {
    strictProjectionError = error;
  }
  context.assert(strictProjectionError && strictProjectionError.code === 'xtend.surface.state-projection.batch-required', 'Strict Surface projection fails closed without batchUpdate');

  const atomicVersionBefore = controller.readSnapshot({ includeDestroyed: true }).version;
  const atomicBatchesBefore = state.batches.length;
  const atomicNotificationsBefore = subscriberSnapshots.length;
  const atomicApply = controller.apply([
    { operation: 'updateSurface', id: 'workbench.inspector', patch: { label: 'Atomic Inspector' } },
    { operation: 'closeSurface', id: 'workbench.properties', reason: 'atomic-close' }
  ], { commandId: 'surface.atomic.success' });
  const atomicSnapshot = controller.readSnapshot({ includeDestroyed: true });
  context.assert(atomicApply.ok === true && atomicApply.operationCount === 2, 'Surface Controller apply atomically accepts multiple lifecycle operations');
  context.assert(atomicSnapshot.version === atomicVersionBefore + 1, 'Surface Controller apply advances the authoritative snapshot exactly once');
  context.assert(state.batches.length === atomicBatchesBefore + 1, 'Surface Controller apply projects exactly one final XTend State batch');
  context.assert(subscriberSnapshots.length === atomicNotificationsBefore + 1, 'Surface Controller apply publishes exactly one complete subscriber snapshot');
  context.assert(atomicSnapshot.surfaces.some((entry) => entry.id === 'workbench.inspector' && entry.label === 'Atomic Inspector'), 'Surface Controller apply includes every successful operation in its final snapshot');

  const rollbackSnapshotBefore = controller.readSnapshot({ includeDestroyed: true });
  const rollbackInspectorBefore = rollbackSnapshotBefore.surfaces.find((entry) => entry.id === 'workbench.inspector');
  const failedApply = controller.apply([
    { operation: 'updateSurface', id: 'workbench.inspector', patch: { bounds: { x: 999 } } },
    { operation: 'openSurface', id: 'workbench.missing' }
  ], { commandId: 'surface.atomic.failure' });
  const rollbackSnapshotAfter = controller.readSnapshot({ includeDestroyed: true });
  const rollbackInspectorAfter = rollbackSnapshotAfter.surfaces.find((entry) => entry.id === 'workbench.inspector');
  context.assert(failedApply.ok === false && failedApply.changed === false, 'Surface Controller apply fails closed when one operation is refused');
  context.assert(rollbackInspectorAfter.bounds.x === rollbackInspectorBefore.bounds.x, 'Failed Surface Controller apply exposes no partial lifecycle mutation');

  const propertiesDestroy = controller.destroySurface('workbench.properties', {
    reason: 'test-destroy',
    releasedResources: ['rmt://resource/workbench.properties']
  });
  const activeAfterDestroySnapshot = controller.snapshot();
  const diagnosticAfterDestroySnapshot = controller.snapshot({ includeDestroyed: true });
  const destroyedOpen = controller.openSurface('workbench.properties');
  const propertiesRecreate = controller.openSurface('workbench.properties', { recreate: true });
  const recreatedSnapshot = controller.snapshot({ includeDestroyed: true });

  context.assert(propertiesDestroy.ok === true, 'destroySurface succeeds for registered surface');
  context.assert(propertiesDestroy.operation === 'destroySurface', 'destroySurface result uses destroySurface operation');
  context.assert(propertiesDestroy.status === 'ok', 'destroySurface result marks successful operation status');
  context.assert(propertiesDestroy.diagnostic && propertiesDestroy.diagnostic.detail && propertiesDestroy.diagnostic.detail.status === 'destroyed', 'destroySurface diagnostic marks terminal surface status');
  context.assert(propertiesDestroy.tombstone && propertiesDestroy.tombstone.schema === 'xtend.surface.tombstone.v1', 'destroySurface returns tombstone contract');
  context.assert(Array.isArray(propertiesDestroy.tombstone.releasedResources) && propertiesDestroy.tombstone.releasedResources.includes('rmt://resource/workbench.properties'), 'destroySurface tombstone records released resources');
  context.assert(activeAfterDestroySnapshot.surfaceCount === 2, 'Default snapshot excludes destroyed surface tombstones');
  context.assert(activeAfterDestroySnapshot.destroyedSurfaceCount === 1, 'Default snapshot reports destroyed surface count');
  context.assert(!activeAfterDestroySnapshot.surfaces.some((surface) => surface.id === 'workbench.properties'), 'Default snapshot omits destroyed surface record');
  context.assert(diagnosticAfterDestroySnapshot.surfaceCount === 3, 'Diagnostic snapshot includes destroyed tombstones when requested');
  context.assert(diagnosticAfterDestroySnapshot.surfaces.some((surface) => surface.id === 'workbench.properties' && surface.status === 'destroyed' && surface.tombstone), 'Diagnostic snapshot exposes destroyed tombstone');
  context.assert(destroyedOpen.ok === false && destroyedOpen.code === 'xtend.surface.already-destroyed', 'openSurface refuses destroyed surface without recreate');
  context.assert(propertiesRecreate.ok === true && propertiesRecreate.generation > propertiesDestroy.generation, 'openSurface recreate creates a new surface generation');
  context.assert(recreatedSnapshot.surfaces.some((surface) => surface.id === 'workbench.properties' && surface.status === 'open' && !surface.tombstone), 'Recreated surface is active without tombstone');
  context.assert(Array.isArray(state.get('xtend.surface.diagnostics')) && state.get('xtend.surface.diagnostics').some((event) => event.code === 'xtend.surface.destroyed'), 'state diagnostics mirror stores destroy diagnostics');
  context.assert(fabricEvents.some((event) => event.code === 'xtend.surface.destroyed'), 'Fabric diagnostic bridge receives destroy diagnostics');

  const notificationsBeforeUnsubscribe = subscriberSnapshots.length;
  unsubscribe();
  const disposeResult = controller.dispose();
  context.assert(disposeResult.ok === true, 'Controller dispose succeeds');
  context.assert(state.get('xtend.surface.snapshot').surfaceCount === 0, 'Dispose mirrors empty snapshot');
  context.assert(subscriberSnapshots.length === notificationsBeforeUnsubscribe, 'Unsubscribed Surface observers receive no disposal projection');
}

async function runSurfaceControllerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-controller',
    label: 'Surface Controller and state snapshot contract'
  });
  const plan = createSurfaceControllerPlan({ rootDir });
  const validation = validateSurfaceControllerPlan(plan);
  const report = createSurfaceControllerReport({ rootDir, plan });
  const runtimeText = readText(SURFACE_CONTROLLER_RUNTIME, rootDir);
  const typesText = readText(SURFACE_CONTROLLER_TYPES, rootDir);
  const sourceTexts = SOURCE_ARTIFACTS.map((filePath) => readText(filePath, rootDir)).join('\n');
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerController;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const planningDoc = readText(SURFACE_CONTROLLER_PLAN, rootDir);
  const contractDoc = readText(SURFACE_CONTROLLER_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_CONTROLLER_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_CONTROLLER_DOCS, rootDir);
  const moduleSyntax = syntaxCheckFile(SURFACE_CONTROLLER_MODULE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(SURFACE_CONTROLLER_RUNTIME, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(SURFACE_CONTROLLER_SUITE, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface Controller artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface Controller doc`);
  });

  context.assert(moduleSyntax.ok, `Surface Controller catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `Surface Controller runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Surface Controller suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === SURFACE_CONTROLLER_SCHEMA, 'Surface Controller schema is stable');
  context.assert(plan.reportSchema === SURFACE_CONTROLLER_REPORT_SCHEMA, 'Surface Controller report schema is stable');
  context.assert(plan.recordSchema === SURFACE_RECORD_SCHEMA, 'Surface Controller reuses Surface Record schema');
  context.assert(plan.snapshotSchema === SURFACE_CONTROLLER_SNAPSHOT_SCHEMA, 'Surface Controller snapshot schema is stable');
  context.assert(plan.diagnosticSchema === SURFACE_CONTROLLER_DIAGNOSTIC_SCHEMA, 'Surface Controller diagnostic schema is stable');
  context.assert(plan.workpackage === SURFACE_CONTROLLER_WORKPACKAGE, 'Surface Controller belongs to WP-SM-02');
  context.assert(plan.status === SURFACE_CONTROLLER_STATUS, 'Surface Controller contract is accepted');
  context.assert(plan.targetReadiness === SURFACE_CONTROLLER_TARGET, 'Surface Controller target readiness is accepted');
  context.assert(plan.featureFlags.customElementsImplemented === false, 'WP-SM-02 does not claim custom elements');
  context.assert(plan.featureFlags.visibleSurfaceChromeImplemented === false, 'WP-SM-02 does not claim visible Surface chrome');
  context.assert(plan.featureFlags.runtimeHasDomDependency === false, 'WP-SM-02 runtime is DOM-free');
  context.assert(plan.featureFlags.runtimeHasRmtKernelImport === false, 'WP-SM-02 runtime has no RMT kernel import');
  context.assert(plan.featureFlags.runtimeHasFabricHardDependency === false, 'WP-SM-02 runtime has optional Fabric diagnostics only');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Surface Controller keeps RMT kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'Surface Controller hands off to WP-SM-03');
  context.assert(plan.nextDecision === NEXT_DECISION, 'Surface Controller exposes next decision');
  context.assert(validation.ok === true, 'Surface Controller plan validates');
  context.assert(report.ok === true, 'Surface Controller report validates');
  context.assert(report.methodCount === REQUIRED_METHODS.length, 'Surface Controller report counts methods');
  context.assert(report.stateKeyCount === REQUIRED_STATE_KEYS.length, 'Surface Controller report counts state keys');
  context.assert(report.diagnosticCount === REQUIRED_DIAGNOSTIC_CODES.length, 'Surface Controller report counts diagnostics');
  assertIncludesAll(context, plan.requiredMethods, REQUIRED_METHODS, 'Surface Controller methods');
  assertIncludesAll(context, plan.stateKeys, REQUIRED_STATE_KEYS, 'Surface Controller state keys');
  assertIncludesAll(context, plan.surfaceTypes, REQUIRED_SURFACE_TYPES, 'Surface Controller surface types');
  assertIncludesAll(context, plan.diagnosticCodes, REQUIRED_DIAGNOSTIC_CODES, 'Surface Controller diagnostic codes');
  assertIncludesAll(context, plan.lanes, REQUIRED_LANES, 'Surface Controller lanes');

  assertTextIncludesAll(context, runtimeText, [
    'createSurfaceController',
    'normalizeSurfaceRecord',
    'normalizeSurfaceBounds',
    '__XTEND_SURFACE_CONTROLLER_API__',
    'xtend.surface.registry',
    'xtend.surface.snapshot',
    'xtend.surface.diagnostics',
    'destroySurface',
    'xtend.surface.tombstone.v1',
    'includeDestroyed',
    'destroyedSurfaceCount',
    'emitDiagnostic',
    'runFiber',
    'metadataKeys'
  ], 'Runtime source');
  assertTextIncludesAll(context, typesText, [
    'interface XtendSurfaceController',
    'interface XtendSurfaceSnapshot',
    'interface XtendSurfaceDiagnostic',
    'registerSurface',
    'maximizeSurface',
    'restoreSurface',
    'materializeSurface',
    'toggleSurface',
    'destroySurface',
    'tombstone',
    'destroyedSurfaceCount'
  ], 'Runtime types');
  assertTextIncludesAll(context, sourceTexts, [
    'export interface XtendSurfaceController',
    'export function createSurfaceController',
    'export function normalizeSurfaceBounds',
    'destroySurface',
    'tombstone',
    'XTEND_SURFACE_STATE_KEYS',
    'xtend.surface.<surfaceId>.lifecycle',
    'xtend.surface.snapshot'
  ], 'TypeScript source');
  [
    'document.',
    'customElements',
    'HTMLElement',
    'attachShadow',
    'querySelector',
    'innerHTML'
  ].forEach((forbidden) => {
    context.assert(!runtimeText.includes(forbidden), `Runtime source omits DOM dependency: ${forbidden}`);
  });
  context.assert(!runtimeText.includes('globalTarget && globalTarget.state'), 'Surface Controller source omits implicit global XTend State adoption');
  context.assert(!runtimeText.includes('target.set(') && !runtimeText.includes('target.setState('), 'Surface Controller source omits direct per-key state writers');

  await exerciseRuntime(context, rootDir);

  context.assert(metadata && metadata.schema === SURFACE_CONTROLLER_SCHEMA, 'Package metadata exposes Surface Controller schema');
  context.assert(metadata && metadata.workpackage === SURFACE_CONTROLLER_WORKPACKAGE, 'Package metadata exposes WP-SM-02');
  context.assert(metadata && metadata.runtime === SURFACE_CONTROLLER_RUNTIME, 'Package metadata exposes runtime artifact');
  context.assert(metadata && metadata.types === SURFACE_CONTROLLER_TYPES, 'Package metadata exposes type artifact');
  context.assert(metadata && metadata.localGate === SURFACE_CONTROLLER_LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_CONTROLLER_PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.customElementsImplemented === false, 'Package metadata keeps custom elements in WP-SM-03');
  context.assert(metadata && metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata exposes kernel boundary');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerController', 'Scaffold config exposes surfaceManagerController');
  context.assertIncludes(scaffoldConfig, SURFACE_CONTROLLER_RUNTIME, 'Scaffold config references Surface Controller runtime');
  context.assert(runner.hasImplementation({ path: "tests/components/surface_controller_suite.js" }), 'Runner imports Surface Controller suite');
  context.assert(runner.hasSuite("surface-controller"), 'Runner registers surface-controller suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-controller'] === 'node scripts/run_xtend_tests.js surface-controller', 'Package script test:surface-controller exists');
  context.assertIncludes(docsReadme, 'SurfaceManager Controller', 'Docs README links SurfaceManager Controller');
  context.assertIncludes(docsMenu, 'surface-manager-controller', 'Docs menu contains SurfaceManager Controller page');
  context.assertIncludes(referenceRegistry, 'WP-SM-02', 'Reference registry contains WP-SM-02');
  context.assertIncludes(referenceRegistry, SURFACE_CONTROLLER_RUNTIME, 'Reference registry contains Surface Controller runtime');
  context.assertIncludes(planningDoc, '`WP-SM-02` | P0 | completed', 'Planning doc marks WP-SM-02 completed');
  context.assertIncludes(planningDoc, '`WP-SM-03` | P0 | completed', 'Planning doc records WP-SM-03 completion');
  assertTextIncludesAll(context, contractDoc, [
    SURFACE_CONTROLLER_SCHEMA,
    SURFACE_CONTROLLER_SNAPSHOT_SCHEMA,
    'state Mirror',
    'Fabric Diagnostics',
    'controller-only-no-custom-element'
  ], 'Surface Controller contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    SURFACE_CONTROLLER_WORKPACKAGE,
    SURFACE_CONTROLLER_LOCAL_GATE,
    SURFACE_CONTROLLER_RUNTIME,
    'Done Criteria'
  ], 'Surface Controller workpackage doc');
  assertTextIncludesAll(context, docs, [
    SURFACE_CONTROLLER_SCHEMA,
    SURFACE_CONTROLLER_RUNTIME,
    'registerSurface',
    'destroySurface',
    'xtend.surface.tombstone.v1',
    'xtend.surface.snapshot',
    'user-blocking'
  ], 'Surface Controller public docs');

  return context.result({
    schema: SURFACE_CONTROLLER_REPORT_SCHEMA,
    workpackage: SURFACE_CONTROLLER_WORKPACKAGE,
    targetReadiness: SURFACE_CONTROLLER_TARGET,
    methods: REQUIRED_METHODS.length,
    stateKeys: REQUIRED_STATE_KEYS.length,
    diagnostics: REQUIRED_DIAGNOSTIC_CODES.length
  });
}

function printSurfaceControllerReport(result) {
  printSuiteReport(result, {
    successTitle: 'Surface Controller und State Snapshot Contract erfolgreich.',
    failureTitle: 'Surface Controller und State Snapshot Contract fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceControllerReport,
  runSurfaceControllerSuite
};

if (require.main === module) {
  runSurfaceControllerSuite()
    .then((result) => {
      printSurfaceControllerReport(result);
      process.exit(result.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
