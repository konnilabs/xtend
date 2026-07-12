const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_WORKBENCH_SCHEMA = 'xtend.surface.workbench-fixture.v1';
const SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA = 'xtend.surface.workbench-fixture-report.v1';
const SURFACE_AUTHORING_SCHEMA = 'xtend.rmt.surface-authoring.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_MANAGER_WORKBENCH_WORKPACKAGE = 'WP-SM-05';
const SURFACE_MANAGER_WORKBENCH_STATUS = 'accepted-rmt-first-workbench-fixture';
const SURFACE_MANAGER_WORKBENCH_TARGET = 'rmt-first-surface-workbench-fixture-ready';
const SURFACE_MANAGER_WORKBENCH_MODULE = 'catalog/surface-manager-workbench-fixture.js';
const SURFACE_MANAGER_WORKBENCH_SUITE = 'tests/rmt/surface_manager_workbench_fixture_suite.js';
const SURFACE_MANAGER_WORKBENCH_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_WORKBENCH_CONTRACT = 'development/XTend-SurfaceManager-RMT-Workbench-Fixture-Contract.md';
const SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC = 'development/WP-SM-05-RMT-first-Workbench-Fixture-bauen.md';
const SURFACE_MANAGER_WORKBENCH_DOCS = 'docs/en/surface-manager-workbench-fixture.md';
const SURFACE_MANAGER_WORKBENCH_FIXTURE = 'xtendrmt/surface-workbench.rmt';
const SURFACE_MANAGER_WORKBENCH_RUNTIME = 'xtendrmt/surface-workbench.js';
const SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE = 'tests/browser/fixtures/rmt-surface-workbench-smoke.html';
const SURFACE_MANAGER_WORKBENCH_HOST = SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE;
const SURFACE_MANAGER_WORKBENCH_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-workbench-fixture --json';
const SURFACE_MANAGER_WORKBENCH_PACKAGE_SCRIPT = 'npm run test:surface-workbench-fixture';
const NEXT_WORKPACKAGE = 'WP-SM-06';
const NEXT_DECISION = 'overlay-stack-bridge';

const RUNTIME_COMPONENT_ARTIFACTS = Object.freeze([
  'components/xsurfacemanager.js',
  'components/xsurfacewindow.js',
  'components/xsidepanel.js',
  'components/xsurfacemanager-controller.js'
]);

const WORKBENCH_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_WORKBENCH_FIXTURE,
  SURFACE_MANAGER_WORKBENCH_HOST,
  SURFACE_MANAGER_WORKBENCH_RUNTIME,
  SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_WORKBENCH_MODULE,
  SURFACE_MANAGER_WORKBENCH_SUITE,
  SURFACE_MANAGER_WORKBENCH_CONTRACT,
  SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC,
  SURFACE_MANAGER_WORKBENCH_DOCS,
  ...WORKBENCH_ARTIFACTS,
  ...RUNTIME_COMPONENT_ARTIFACTS
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_WORKBENCH_PLAN,
  SURFACE_MANAGER_WORKBENCH_CONTRACT,
  SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC,
  SURFACE_MANAGER_WORKBENCH_DOCS,
  'development/docs-evidence/root/surface-manager-rmt-authoring.md',
  'docs/en/surface-manager-window-runtime.md',
  'docs/en/surface-manager-side-panel-runtime.md'
]);

const REQUIRED_ADAPTERS = Object.freeze([
  'xtend.component',
  'xtend.xrouter',
  'rmt.state-scheduler-diagnostics'
]);

const REQUIRED_COMPONENTS = Object.freeze([
  'app.shell',
  'app.router',
  'workbench.manager',
  'workbench.inspector',
  'workbench.editor',
  'workbench.properties',
  'inspector.content',
  'editor.content',
  'properties.content'
]);

const SURFACE_COMPONENTS = Object.freeze([
  'workbench.inspector',
  'workbench.editor',
  'workbench.properties'
]);

const COMPONENT_TAGS = Object.freeze([
  'x-section',
  'x-router',
  'x-surface-manager',
  'x-surface-window',
  'x-side-panel',
  'x-code',
  'x-form'
]);

const REQUIRED_SCHEDULES = Object.freeze([
  'app.shell.render',
  'route.visible.render',
  'surface.visible.render',
  'surface.user-blocking.open',
  'surface.user-blocking.close',
  'surface.transition.layout',
  'surface.background.persist',
  'surface.diagnostics.snapshot',
  'component.visible.mount',
  'component.idle.hydrate',
  'a11y.user-blocking.announce',
  'diagnostics.snapshot'
]);

const REQUIRED_TEMPLATES = Object.freeze([
  'app.shell.template',
  'workbench.route.template',
  'inspector.content.template',
  'properties.content.template'
]);

const REQUIRED_ROUTE_IDS = Object.freeze([
  'workbench'
]);

const REQUIRED_SURFACE_TYPES = Object.freeze([
  'window',
  'side-panel'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerWorkbenchFixturePlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_WORKBENCH_SCHEMA,
    reportSchema: SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA,
    surfaceAuthoringSchema: SURFACE_AUTHORING_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    workpackage: SURFACE_MANAGER_WORKBENCH_WORKPACKAGE,
    status: SURFACE_MANAGER_WORKBENCH_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_WORKBENCH_TARGET,
    module: SURFACE_MANAGER_WORKBENCH_MODULE,
    suite: SURFACE_MANAGER_WORKBENCH_SUITE,
    planningDocument: SURFACE_MANAGER_WORKBENCH_PLAN,
    contract: SURFACE_MANAGER_WORKBENCH_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_WORKBENCH_DOCS,
    fixture: SURFACE_MANAGER_WORKBENCH_FIXTURE,
    host: SURFACE_MANAGER_WORKBENCH_HOST,
    runtime: SURFACE_MANAGER_WORKBENCH_RUNTIME,
    browserSmoke: SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE,
    localGate: SURFACE_MANAGER_WORKBENCH_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_WORKBENCH_PACKAGE_SCRIPT,
    runtimeComponentArtifacts: RUNTIME_COMPONENT_ARTIFACTS.slice(),
    workbenchArtifacts: WORKBENCH_ARTIFACTS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    requiredAdapters: REQUIRED_ADAPTERS.slice(),
    requiredComponents: REQUIRED_COMPONENTS.slice(),
    surfaceComponents: SURFACE_COMPONENTS.slice(),
    componentTags: COMPONENT_TAGS.slice(),
    requiredSchedules: REQUIRED_SCHEDULES.slice(),
    requiredTemplates: REQUIRED_TEMPLATES.slice(),
    routeIds: REQUIRED_ROUTE_IDS.slice(),
    surfaceTypes: REQUIRED_SURFACE_TYPES.slice(),
    runtimeModel: {
      renderMode: 'shell-first-rmt-document-to-dom-descriptor',
      host: 'generic-rmt-root-no-manual-surface-markup',
      routeBinding: 'x-router-route-record-mounts-workbench-manager',
      surfaceComposition: 'two-x-surface-window-one-x-side-panel',
      snapshot: 'shared-x-surface-manager-snapshot',
      loader: 'xtend-loader-manifest-preload-for-surface-components',
      eventBinding: 'dom-event-to-rmt-command',
      browserGate: 'prepared-smoke-fixture-static-local-gate',
      nativeSurfacesDomain: 'reserved-not-implemented'
    },
    featureFlags: {
      rmtFirstWorkbenchFixtureImplemented: true,
      twoWindowsImplemented: true,
      sidePanelImplemented: true,
      routeBoundContentImplemented: true,
      sharedSurfaceSnapshotImplemented: true,
      hostHasNoManualShell: true,
      usesXtendLoaderManifest: true,
      browserSmokePrepared: true,
      browserRequiredInLocalGate: false,
      externalNetworkAllowedInLocalGate: false,
      nativeSurfacesDomainImplemented: false,
      rmtKernelImportsXtendTypes: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceManagerWorkbenchFixturePlan(plan = createSurfaceManagerWorkbenchFixturePlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_WORKBENCH_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_WORKBENCH_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA}`);
  if (!plan || plan.surfaceAuthoringSchema !== SURFACE_AUTHORING_SCHEMA) errors.push(`surfaceAuthoringSchema must be ${SURFACE_AUTHORING_SCHEMA}`);
  if (!plan || plan.surfaceManagerSchema !== SURFACE_MANAGER_SCHEMA) errors.push(`surfaceManagerSchema must be ${SURFACE_MANAGER_SCHEMA}`);
  if (!plan || plan.surfaceRecordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`surfaceRecordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.surfaceControllerSchema !== SURFACE_CONTROLLER_SCHEMA) errors.push(`surfaceControllerSchema must be ${SURFACE_CONTROLLER_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_WORKBENCH_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_WORKBENCH_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_WORKBENCH_STATUS) errors.push(`status must be ${SURFACE_MANAGER_WORKBENCH_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_WORKBENCH_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_WORKBENCH_TARGET}`);
  if (!includesAll(plan && plan.requiredAdapters, REQUIRED_ADAPTERS)) errors.push('required adapters missing');
  if (!includesAll(plan && plan.requiredComponents, REQUIRED_COMPONENTS)) errors.push('required components missing');
  if (!includesAll(plan && plan.surfaceComponents, SURFACE_COMPONENTS)) errors.push('surface components missing');
  if (!includesAll(plan && plan.componentTags, COMPONENT_TAGS)) errors.push('component tags missing');
  if (!includesAll(plan && plan.requiredSchedules, REQUIRED_SCHEDULES)) errors.push('required schedules missing');
  if (!includesAll(plan && plan.requiredTemplates, REQUIRED_TEMPLATES)) errors.push('required templates missing');
  if (!includesAll(plan && plan.surfaceTypes, REQUIRED_SURFACE_TYPES)) errors.push('surface types missing');
  if (!plan || plan.featureFlags.rmtFirstWorkbenchFixtureImplemented !== true) errors.push('RMT-first Workbench fixture must be implemented');
  if (!plan || plan.featureFlags.twoWindowsImplemented !== true) errors.push('Workbench fixture must include two windows');
  if (!plan || plan.featureFlags.sidePanelImplemented !== true) errors.push('Workbench fixture must include a side panel');
  if (!plan || plan.featureFlags.routeBoundContentImplemented !== true) errors.push('Workbench fixture must include route-bound content');
  if (!plan || plan.featureFlags.sharedSurfaceSnapshotImplemented !== true) errors.push('Workbench fixture must expose a shared surface snapshot');
  if (!plan || plan.featureFlags.hostHasNoManualShell !== true) errors.push('Workbench host must have no manual shell markup');
  if (!plan || plan.featureFlags.usesXtendLoaderManifest !== true) errors.push('Workbench fixture must use XTendLoader manifest policy');
  if (!plan || plan.featureFlags.browserRequiredInLocalGate !== false) errors.push('local gate must remain browser-free');
  if (!plan || plan.featureFlags.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must remain network-free');
  if (!plan || plan.featureFlags.nativeSurfacesDomainImplemented !== false) errors.push('native surfaces domain remains reserved');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_WORKBENCH_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_WORKBENCH_TARGET
  };
}

function createSurfaceManagerWorkbenchFixtureReport(options = {}) {
  const plan = options.plan || createSurfaceManagerWorkbenchFixturePlan(options);
  const validation = validateSurfaceManagerWorkbenchFixturePlan(plan);

  return {
    schema: SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    fixture: plan.fixture,
    host: plan.host,
    runtime: plan.runtime,
    browserSmoke: plan.browserSmoke,
    componentCount: plan.requiredComponents.length,
    surfaceCount: plan.surfaceComponents.length,
    routeCount: plan.routeIds.length,
    scheduleCount: plan.requiredSchedules.length,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    sharedSurfaceSnapshot: plan.featureFlags.sharedSurfaceSnapshotImplemented,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  COMPONENT_TAGS,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_COMPONENTS,
  REQUIRED_DOCS,
  REQUIRED_ROUTE_IDS,
  REQUIRED_SCHEDULES,
  REQUIRED_SURFACE_TYPES,
  REQUIRED_TEMPLATES,
  RUNTIME_COMPONENT_ARTIFACTS,
  SURFACE_AUTHORING_SCHEMA,
  SURFACE_COMPONENTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE,
  SURFACE_MANAGER_WORKBENCH_CONTRACT,
  SURFACE_MANAGER_WORKBENCH_DOCS,
  SURFACE_MANAGER_WORKBENCH_FIXTURE,
  SURFACE_MANAGER_WORKBENCH_HOST,
  SURFACE_MANAGER_WORKBENCH_LOCAL_GATE,
  SURFACE_MANAGER_WORKBENCH_MODULE,
  SURFACE_MANAGER_WORKBENCH_PACKAGE_SCRIPT,
  SURFACE_MANAGER_WORKBENCH_PLAN,
  SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA,
  SURFACE_MANAGER_WORKBENCH_RUNTIME,
  SURFACE_MANAGER_WORKBENCH_SCHEMA,
  SURFACE_MANAGER_WORKBENCH_STATUS,
  SURFACE_MANAGER_WORKBENCH_SUITE,
  SURFACE_MANAGER_WORKBENCH_TARGET,
  SURFACE_MANAGER_WORKBENCH_WORKPACKAGE,
  SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  WORKBENCH_ARTIFACTS,
  createSurfaceManagerWorkbenchFixturePlan,
  createSurfaceManagerWorkbenchFixtureReport,
  validateSurfaceManagerWorkbenchFixturePlan
};
