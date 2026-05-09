const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA = 'xtend.surface.overlay-stack-bridge.v1';
const SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA = 'xtend.surface.overlay-stack-bridge-report.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE = 'WP-SM-06';
const SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS = 'accepted-overlay-stack-bridge';
const SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET = 'overlay-stack-bridge-ready';
const SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE = 'catalog/surface-manager-overlay-bridge.js';
const SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE = 'tests/components/surface_manager_overlay_bridge_suite.js';
const SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT = 'development/XTend-SurfaceManager-Overlay-Stack-Bridge-Contract.md';
const SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC = 'development/WP-SM-06-Overlay-Kompatibilitaet-und-Stack-Bridge-vorbereiten.md';
const SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS = 'docs/surface-manager-overlay-bridge.md';
const SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE = 'tests/components/fixtures/xsurfaceoverlaybridge.component.html';
const SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-overlay-bridge --json';
const SURFACE_MANAGER_OVERLAY_BRIDGE_PACKAGE_SCRIPT = 'npm run test:surface-overlay-bridge';
const NEXT_WORKPACKAGE = 'WP-SM-07';
const NEXT_DECISION = 'surface-browser-a11y-performance-visual-gates';

const RUNTIME_ARTIFACTS = Object.freeze([
  'components/xsurfaceoverlay-bridge.js',
  'components/xsurfaceoverlay-bridge.d.ts',
  'components/xsurfacemanager.js',
  'components/xsurfacemanager-controller.js',
  'components/xmodal.js',
  'components/xdialog.js',
  'components/xdrawer.js'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT,
  SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS,
  SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE,
  ...RUNTIME_ARTIFACTS
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN,
  SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT,
  SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS,
  'docs/surface-manager-workbench-fixture.md',
  'docs/surface-manager-side-panel-runtime.md',
  'docs/surface-manager-window-runtime.md'
]);

const COMPONENT_TAGS = Object.freeze([
  'x-surface-manager',
  'x-modal',
  'x-dialog',
  'x-drawer'
]);

const OVERLAY_SURFACE_TYPES = Object.freeze([
  'modal',
  'dialog',
  'drawer'
]);

const LEGACY_EVENTS = Object.freeze([
  'modal-opened',
  'modal-closed',
  'dialog-opened',
  'dialog-closed',
  'drawer-opened',
  'drawer-closed',
  'drawer-route-selected'
]);

const BRIDGE_EVENTS = Object.freeze([
  'surface-overlay-command',
  ...LEGACY_EVENTS
]);

const LEGACY_STATE_KEYS = Object.freeze([
  'modal-open-<id>',
  'dialog-open-<id>',
  'xdrawer-open-<id>'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerOverlayBridgePlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA,
    reportSchema: SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    workpackage: SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE,
    status: SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET,
    module: SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE,
    suite: SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE,
    planningDocument: SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN,
    contract: SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS,
    fixture: SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE,
    localGate: SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_OVERLAY_BRIDGE_PACKAGE_SCRIPT,
    runtimeArtifacts: RUNTIME_ARTIFACTS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    componentTags: COMPONENT_TAGS.slice(),
    overlaySurfaceTypes: OVERLAY_SURFACE_TYPES.slice(),
    legacyEvents: LEGACY_EVENTS.slice(),
    bridgeEvents: BRIDGE_EVENTS.slice(),
    legacyStateKeys: LEGACY_STATE_KEYS.slice(),
    runtimeModel: {
      bridge: 'xsurfaceoverlay-bridge-adapts-existing-overlays-to-surface-records',
      managerIntegration: 'x-surface-manager-overlays-slot-auto-registers-x-modal-x-dialog-x-drawer',
      commandBridge: 'surface-overlay-command-to-controller-operation',
      lifecycleBridge: 'legacy-overlay-events-to-surface-controller',
      stackPolicy: 'single-controller-stack-for-windows-panels-and-compatible-overlays',
      legacyApiPolicy: 'preserve-existing-open-close-events-and-state-keys'
    },
    featureFlags: {
      overlayBridgeImplemented: true,
      managerRegistersOverlays: true,
      surfaceOverlayCommandImplemented: true,
      legacyLifecycleEventsPreserved: true,
      legacyStateKeysPreserved: true,
      modalDialogDrawerProfilesImplemented: true,
      controllerReusedFromWpSm02: true,
      createsSecondRegistry: false,
      externalNetworkAllowedInLocalGate: false,
      browserRequiredInLocalGate: false,
      nativeSurfacesDomainImplemented: false,
      rmtKernelImportsXtendTypes: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceManagerOverlayBridgePlan(plan = createSurfaceManagerOverlayBridgePlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA}`);
  if (!plan || plan.surfaceManagerSchema !== SURFACE_MANAGER_SCHEMA) errors.push(`surfaceManagerSchema must be ${SURFACE_MANAGER_SCHEMA}`);
  if (!plan || plan.surfaceRecordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`surfaceRecordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.surfaceControllerSchema !== SURFACE_CONTROLLER_SCHEMA) errors.push(`surfaceControllerSchema must be ${SURFACE_CONTROLLER_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS) errors.push(`status must be ${SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET}`);
  if (!includesAll(plan && plan.componentTags, COMPONENT_TAGS)) errors.push('component tags missing');
  if (!includesAll(plan && plan.overlaySurfaceTypes, OVERLAY_SURFACE_TYPES)) errors.push('overlay surface types missing');
  if (!includesAll(plan && plan.legacyEvents, LEGACY_EVENTS)) errors.push('legacy events missing');
  if (!includesAll(plan && plan.bridgeEvents, BRIDGE_EVENTS)) errors.push('bridge events missing');
  if (!includesAll(plan && plan.legacyStateKeys, LEGACY_STATE_KEYS)) errors.push('legacy state keys missing');
  if (!plan || plan.featureFlags.overlayBridgeImplemented !== true) errors.push('overlay bridge must be implemented');
  if (!plan || plan.featureFlags.managerRegistersOverlays !== true) errors.push('manager must register overlay elements');
  if (!plan || plan.featureFlags.surfaceOverlayCommandImplemented !== true) errors.push('surface-overlay-command must be implemented');
  if (!plan || plan.featureFlags.legacyLifecycleEventsPreserved !== true) errors.push('legacy overlay events must be preserved');
  if (!plan || plan.featureFlags.legacyStateKeysPreserved !== true) errors.push('legacy overlay state keys must be preserved');
  if (!plan || plan.featureFlags.controllerReusedFromWpSm02 !== true) errors.push('WP-SM-06 must reuse WP-SM-02 controller');
  if (!plan || plan.featureFlags.createsSecondRegistry !== false) errors.push('WP-SM-06 must not create a second registry');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET
  };
}

function createSurfaceManagerOverlayBridgeReport(options = {}) {
  const plan = options.plan || createSurfaceManagerOverlayBridgePlan(options);
  const validation = validateSurfaceManagerOverlayBridgePlan(plan);

  return {
    schema: SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    fixture: plan.fixture,
    runtimeArtifacts: plan.runtimeArtifacts.length,
    componentTags: plan.componentTags.length,
    overlaySurfaceTypes: plan.overlaySurfaceTypes.length,
    legacyEvents: plan.legacyEvents.length,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  BRIDGE_EVENTS,
  COMPONENT_TAGS,
  KERNEL_BOUNDARY,
  LEGACY_EVENTS,
  LEGACY_STATE_KEYS,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  OVERLAY_SURFACE_TYPES,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  RUNTIME_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT,
  SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS,
  SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN,
  SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA,
  SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA,
  SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS,
  SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET,
  SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerOverlayBridgePlan,
  createSurfaceManagerOverlayBridgeReport,
  validateSurfaceManagerOverlayBridgePlan
};
