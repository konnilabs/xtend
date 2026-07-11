const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA = 'xtend.surface.window-runtime.v1';
const SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA = 'xtend.surface.window-runtime-report.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE = 'WP-SM-03';
const SURFACE_MANAGER_WINDOW_RUNTIME_STATUS = 'accepted-window-runtime';
const SURFACE_MANAGER_WINDOW_RUNTIME_TARGET = 'multi-window-spa-surface-runtime-ready';
const SURFACE_MANAGER_WINDOW_RUNTIME_MODULE = 'catalog/surface-manager-window-runtime.js';
const SURFACE_MANAGER_WINDOW_RUNTIME_SUITE = 'tests/components/surface_manager_runtime_suite.js';
const SURFACE_MANAGER_WINDOW_RUNTIME_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT = 'development/XTend-SurfaceManager-Window-Runtime-Contract.md';
const SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC = 'development/WP-SM-03-x-surface-manager-und-x-surface-window-implementieren.md';
const SURFACE_MANAGER_WINDOW_RUNTIME_DOCS = 'docs/en/surface-manager-window-runtime.md';
const SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-manager --json';
const SURFACE_MANAGER_WINDOW_RUNTIME_PACKAGE_SCRIPT = 'npm run test:surface-manager';
const NEXT_WORKPACKAGE = 'WP-SM-04';
const NEXT_DECISION = 'x-side-panel-responsive-surface-modes';

const RUNTIME_ARTIFACTS = Object.freeze([
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'components/xsurfacewindow.js',
  'components/xsurfacewindow.d.ts',
  'components/xsurfacemanager-controller.js'
]);

const SOURCE_ARTIFACTS = Object.freeze([
  'src/components/x-surface-manager/x-surface-manager.ts',
  'src/components/x-surface-window/x-surface-window.ts'
]);

const COMPONENT_DOCS = Object.freeze([
  'docs/en/components/xsurfacemanager.md',
  'docs/en/components/xsurfacewindow.md'
]);

const COMPONENT_FIXTURES = Object.freeze([
  'tests/components/fixtures/xsurfacemanager.component.html',
  'tests/components/fixtures/xsurfacewindow.component.html'
]);

const COMPONENT_SUITES = Object.freeze([
  'tests/components/xsurfacemanager.component_suite.js',
  'tests/components/xsurfacewindow.component_suite.js'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_WINDOW_RUNTIME_MODULE,
  SURFACE_MANAGER_WINDOW_RUNTIME_SUITE,
  SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT,
  SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC,
  SURFACE_MANAGER_WINDOW_RUNTIME_DOCS,
  ...RUNTIME_ARTIFACTS,
  ...SOURCE_ARTIFACTS,
  ...COMPONENT_DOCS,
  ...COMPONENT_FIXTURES,
  ...COMPONENT_SUITES
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_WINDOW_RUNTIME_PLAN,
  SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT,
  SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC,
  SURFACE_MANAGER_WINDOW_RUNTIME_DOCS,
  'development/XTend-SurfaceManager-Controller-und-State-Snapshot-Contract.md',
  'docs/en/surface-manager-controller.md',
  ...COMPONENT_DOCS
]);

const COMPONENT_TAGS = Object.freeze([
  'x-surface-manager',
  'x-surface-window'
]);

const REQUIRED_MANAGER_METHODS = Object.freeze([
  'registerSurface',
  'openSurface',
  'closeSurface',
  'focusSurface',
  'updateSurface',
  'moveSurface',
  'resizeSurface',
  'minimizeSurface',
  'maximizeSurface',
  'restoreSurface',
  'materializeSurface',
  'toggleSurface',
  'destroySurface',
  'snapshot'
]);

const REQUIRED_WINDOW_METHODS = Object.freeze([
  'toSurfaceRecord',
  'applySurfaceSnapshot',
  'openWindow',
  'closeWindow',
  'focusWindow',
  'minimizeWindow',
  'maximizeWindow',
  'restoreWindow'
]);

const REQUIRED_EVENTS = Object.freeze([
  'surface-manager-ready',
  'surface-registered',
  'surface-opened',
  'surface-closed',
  'surface-focused',
  'surface-updated',
  'surface-destroyed',
  'surface-destroy-error',
  'surface-layout-changed',
  'surface-window-command'
]);

const REQUIRED_SLOTS = Object.freeze([
  'default',
  'windows',
  'panels',
  'overlays'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerWindowRuntimePlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA,
    reportSchema: SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    workpackage: SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE,
    status: SURFACE_MANAGER_WINDOW_RUNTIME_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_WINDOW_RUNTIME_TARGET,
    module: SURFACE_MANAGER_WINDOW_RUNTIME_MODULE,
    suite: SURFACE_MANAGER_WINDOW_RUNTIME_SUITE,
    planningDocument: SURFACE_MANAGER_WINDOW_RUNTIME_PLAN,
    contract: SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_WINDOW_RUNTIME_DOCS,
    localGate: SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_WINDOW_RUNTIME_PACKAGE_SCRIPT,
    runtimeArtifacts: RUNTIME_ARTIFACTS.slice(),
    sourceArtifacts: SOURCE_ARTIFACTS.slice(),
    componentDocs: COMPONENT_DOCS.slice(),
    componentFixtures: COMPONENT_FIXTURES.slice(),
    componentSuites: COMPONENT_SUITES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    componentTags: COMPONENT_TAGS.slice(),
    managerMethods: REQUIRED_MANAGER_METHODS.slice(),
    windowMethods: REQUIRED_WINDOW_METHODS.slice(),
    events: REQUIRED_EVENTS.slice(),
    slots: REQUIRED_SLOTS.slice(),
    runtimeModel: {
      manager: 'x-surface-manager owns controller-and-slots',
      window: 'x-surface-window visible-managed-surface',
      controller: 'reuses-WP-SM-02-controller',
      registration: 'slotchange-and-window-connected-registration',
      commandBridge: 'surface-window-command-to-controller-operation',
      snapshotBridge: 'controller-snapshot-to-window-attributes-css-vars',
      lifecycleBridge: 'destroySurface-terminal-cleanup-and-tombstone',
      manifestPolicy: 'manifest-loadable-components'
    },
    featureFlags: {
      xSurfaceManagerImplemented: true,
      xSurfaceWindowImplemented: true,
      sidePanelImplemented: false,
      nativeSurfacesDomainImplemented: false,
      externalNetworkAllowedInLocalGate: false,
      browserRequiredInLocalGate: false,
      usesControllerFromWpSm02: true,
      createsSecondRegistry: false,
      rmtKernelImportsXtendTypes: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceManagerWindowRuntimePlan(plan = createSurfaceManagerWindowRuntimePlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA}`);
  if (!plan || plan.surfaceManagerSchema !== SURFACE_MANAGER_SCHEMA) errors.push(`surfaceManagerSchema must be ${SURFACE_MANAGER_SCHEMA}`);
  if (!plan || plan.surfaceRecordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`surfaceRecordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.surfaceControllerSchema !== SURFACE_CONTROLLER_SCHEMA) errors.push(`surfaceControllerSchema must be ${SURFACE_CONTROLLER_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_WINDOW_RUNTIME_STATUS) errors.push(`status must be ${SURFACE_MANAGER_WINDOW_RUNTIME_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_WINDOW_RUNTIME_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_WINDOW_RUNTIME_TARGET}`);
  if (!includesAll(plan && plan.componentTags, COMPONENT_TAGS)) errors.push('component tags missing');
  if (!includesAll(plan && plan.managerMethods, REQUIRED_MANAGER_METHODS)) errors.push('manager methods missing');
  if (!includesAll(plan && plan.windowMethods, REQUIRED_WINDOW_METHODS)) errors.push('window methods missing');
  if (!includesAll(plan && plan.events, REQUIRED_EVENTS)) errors.push('events missing');
  if (!includesAll(plan && plan.slots, REQUIRED_SLOTS)) errors.push('slots missing');
  if (!plan || plan.featureFlags.xSurfaceManagerImplemented !== true) errors.push('x-surface-manager must be implemented');
  if (!plan || plan.featureFlags.xSurfaceWindowImplemented !== true) errors.push('x-surface-window must be implemented');
  if (!plan || plan.featureFlags.sidePanelImplemented !== false) errors.push('x-side-panel remains WP-SM-04');
  if (!plan || plan.featureFlags.usesControllerFromWpSm02 !== true) errors.push('WP-SM-03 must reuse WP-SM-02 controller');
  if (!plan || plan.featureFlags.createsSecondRegistry !== false) errors.push('WP-SM-03 must not create a second registry');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_WINDOW_RUNTIME_TARGET
  };
}

function createSurfaceManagerWindowRuntimeReport(options = {}) {
  const plan = options.plan || createSurfaceManagerWindowRuntimePlan(options);
  const validation = validateSurfaceManagerWindowRuntimePlan(plan);

  return {
    schema: SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    componentTags: plan.componentTags,
    runtimeArtifacts: plan.runtimeArtifacts,
    managerMethodCount: plan.managerMethods.length,
    windowMethodCount: plan.windowMethods.length,
    eventCount: plan.events.length,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    usesControllerFromWpSm02: plan.featureFlags.usesControllerFromWpSm02,
    sidePanelImplemented: plan.featureFlags.sidePanelImplemented,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  COMPONENT_DOCS,
  COMPONENT_FIXTURES,
  COMPONENT_SUITES,
  COMPONENT_TAGS,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_EVENTS,
  REQUIRED_MANAGER_METHODS,
  REQUIRED_SLOTS,
  REQUIRED_WINDOW_METHODS,
  RUNTIME_ARTIFACTS,
  SOURCE_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT,
  SURFACE_MANAGER_WINDOW_RUNTIME_DOCS,
  SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE,
  SURFACE_MANAGER_WINDOW_RUNTIME_MODULE,
  SURFACE_MANAGER_WINDOW_RUNTIME_PACKAGE_SCRIPT,
  SURFACE_MANAGER_WINDOW_RUNTIME_PLAN,
  SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA,
  SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA,
  SURFACE_MANAGER_WINDOW_RUNTIME_STATUS,
  SURFACE_MANAGER_WINDOW_RUNTIME_SUITE,
  SURFACE_MANAGER_WINDOW_RUNTIME_TARGET,
  SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE,
  SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerWindowRuntimePlan,
  createSurfaceManagerWindowRuntimeReport,
  validateSurfaceManagerWindowRuntimePlan
};
