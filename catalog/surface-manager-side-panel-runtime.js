const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_SIDE_PANEL_SCHEMA = 'xtend.surface.side-panel-runtime.v1';
const SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA = 'xtend.surface.side-panel-runtime-report.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE = 'WP-SM-04';
const SURFACE_MANAGER_SIDE_PANEL_STATUS = 'accepted-side-panel-runtime';
const SURFACE_MANAGER_SIDE_PANEL_TARGET = 'responsive-side-panel-surface-runtime-ready';
const SURFACE_MANAGER_SIDE_PANEL_MODULE = 'catalog/surface-manager-side-panel-runtime.js';
const SURFACE_MANAGER_SIDE_PANEL_SUITE = 'tests/components/surface_manager_side_panel_suite.js';
const SURFACE_MANAGER_SIDE_PANEL_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_SIDE_PANEL_CONTRACT = 'development/XTend-SurfaceManager-SidePanel-Runtime-Contract.md';
const SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC = 'development/WP-SM-04-x-side-panel-und-responsive-surface-modes-umsetzen.md';
const SURFACE_MANAGER_SIDE_PANEL_DOCS = 'docs/en/surface-manager-side-panel-runtime.md';
const SURFACE_MANAGER_SIDE_PANEL_DOCS_DE = 'docs/de/surface-manager-side-panel-runtime.md';
const SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-side-panel --json';
const SURFACE_MANAGER_SIDE_PANEL_PACKAGE_SCRIPT = 'npm run test:surface-side-panel';
const NEXT_WORKPACKAGE = 'WP-SM-05';
const NEXT_DECISION = 'rmt-first-workbench-fixture';

const RUNTIME_ARTIFACTS = Object.freeze([
  'components/xsurfacemanager.js',
  'components/xsidepanel.js',
  'components/xsidepanel.d.ts',
  'components/xsurfacemanager-controller.js'
]);

const SOURCE_ARTIFACTS = Object.freeze([
  'src/components/x-surface-manager/x-surface-manager.ts',
  'src/components/x-side-panel/x-side-panel.ts'
]);

const COMPONENT_DOCS = Object.freeze([
  'docs/components/xsidepanel.md'
]);

const COMPONENT_FIXTURES = Object.freeze([
  'tests/components/fixtures/xsidepanel.component.html'
]);

const COMPONENT_SUITES = Object.freeze([
  'tests/components/xsidepanel.component_suite.js'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_SIDE_PANEL_MODULE,
  SURFACE_MANAGER_SIDE_PANEL_SUITE,
  SURFACE_MANAGER_SIDE_PANEL_CONTRACT,
  SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SIDE_PANEL_DOCS,
  SURFACE_MANAGER_SIDE_PANEL_DOCS_DE,
  ...RUNTIME_ARTIFACTS,
  ...SOURCE_ARTIFACTS,
  ...COMPONENT_DOCS,
  ...COMPONENT_FIXTURES,
  ...COMPONENT_SUITES
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_SIDE_PANEL_PLAN,
  SURFACE_MANAGER_SIDE_PANEL_CONTRACT,
  SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SIDE_PANEL_DOCS,
  'development/XTend-SurfaceManager-Window-Runtime-Contract.md',
  'docs/en/surface-manager-window-runtime.md',
  ...COMPONENT_DOCS
]);

const COMPONENT_TAGS = Object.freeze([
  'x-surface-manager',
  'x-side-panel'
]);

const REQUIRED_MANAGER_METHODS = Object.freeze([
  'registerSurface',
  'openSurface',
  'closeSurface',
  'focusSurface',
  'updateSurface',
  'resizeSurface',
  'pinSurface',
  'collapseSurface',
  'expandSurface',
  'dockSurface',
  'restoreSurface',
  'materializeSurface',
  'toggleSurface',
  'snapshot'
]);

const REQUIRED_PANEL_METHODS = Object.freeze([
  'toSurfaceRecord',
  'applySurfaceSnapshot',
  'openPanel',
  'closePanel',
  'focusPanel',
  'minimizePanel',
  'pinPanel',
  'collapsePanel',
  'expandPanel',
  'setPanelMode',
  'resizePanel',
  'restorePanel'
]);

const REQUIRED_EVENTS = Object.freeze([
  'surface-manager-ready',
  'surface-registered',
  'surface-opened',
  'surface-closed',
  'surface-focused',
  'surface-updated',
  'surface-layout-changed',
  'surface-panel-command'
]);

const REQUIRED_PLACEMENTS = Object.freeze([
  'left',
  'right',
  'bottom',
  'inline'
]);

const REQUIRED_MODES = Object.freeze([
  'docked',
  'overlay',
  'pinned',
  'collapsed',
  'fullscreen'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerSidePanelPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_SIDE_PANEL_SCHEMA,
    reportSchema: SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    workpackage: SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE,
    status: SURFACE_MANAGER_SIDE_PANEL_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_SIDE_PANEL_TARGET,
    module: SURFACE_MANAGER_SIDE_PANEL_MODULE,
    suite: SURFACE_MANAGER_SIDE_PANEL_SUITE,
    planningDocument: SURFACE_MANAGER_SIDE_PANEL_PLAN,
    contract: SURFACE_MANAGER_SIDE_PANEL_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_SIDE_PANEL_DOCS,
    localizedDocs: {
      de: SURFACE_MANAGER_SIDE_PANEL_DOCS_DE,
      en: SURFACE_MANAGER_SIDE_PANEL_DOCS
    },
    localGate: SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_SIDE_PANEL_PACKAGE_SCRIPT,
    runtimeArtifacts: RUNTIME_ARTIFACTS.slice(),
    sourceArtifacts: SOURCE_ARTIFACTS.slice(),
    componentDocs: COMPONENT_DOCS.slice(),
    componentFixtures: COMPONENT_FIXTURES.slice(),
    componentSuites: COMPONENT_SUITES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    componentTags: COMPONENT_TAGS.slice(),
    managerMethods: REQUIRED_MANAGER_METHODS.slice(),
    panelMethods: REQUIRED_PANEL_METHODS.slice(),
    events: REQUIRED_EVENTS.slice(),
    placements: REQUIRED_PLACEMENTS.slice(),
    modes: REQUIRED_MODES.slice(),
    runtimeModel: {
      manager: 'x-surface-manager owns controller-and-panel-slot',
      panel: 'x-side-panel visible-managed-side-panel-surface',
      controller: 'reuses-WP-SM-02-controller',
      registration: 'slotchange-and-panel-connected-registration',
      commandBridge: 'surface-panel-command-to-controller-update-and-resize',
      snapshotBridge: 'controller-snapshot-to-panel-attributes-css-vars',
      responsivePolicy: 'fullscreen-under-720-and-bottom-sheet-compatible',
      manifestPolicy: 'manifest-loadable-components'
    },
    featureFlags: {
      xSurfaceManagerImplemented: true,
      xSurfaceWindowImplemented: true,
      xSidePanelImplemented: true,
      dockedModeImplemented: true,
      overlayModeImplemented: true,
      pinnedModeImplemented: true,
      collapsedModeImplemented: true,
      responsiveFullscreenImplemented: true,
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

function validateSurfaceManagerSidePanelPlan(plan = createSurfaceManagerSidePanelPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_SIDE_PANEL_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_SIDE_PANEL_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA}`);
  if (!plan || plan.surfaceManagerSchema !== SURFACE_MANAGER_SCHEMA) errors.push(`surfaceManagerSchema must be ${SURFACE_MANAGER_SCHEMA}`);
  if (!plan || plan.surfaceRecordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`surfaceRecordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.surfaceControllerSchema !== SURFACE_CONTROLLER_SCHEMA) errors.push(`surfaceControllerSchema must be ${SURFACE_CONTROLLER_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_SIDE_PANEL_STATUS) errors.push(`status must be ${SURFACE_MANAGER_SIDE_PANEL_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_SIDE_PANEL_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_SIDE_PANEL_TARGET}`);
  if (!includesAll(plan && plan.componentTags, COMPONENT_TAGS)) errors.push('component tags missing');
  if (!includesAll(plan && plan.managerMethods, REQUIRED_MANAGER_METHODS)) errors.push('manager methods missing');
  if (!includesAll(plan && plan.panelMethods, REQUIRED_PANEL_METHODS)) errors.push('panel methods missing');
  if (!includesAll(plan && plan.events, REQUIRED_EVENTS)) errors.push('events missing');
  if (!includesAll(plan && plan.placements, REQUIRED_PLACEMENTS)) errors.push('placements missing');
  if (!includesAll(plan && plan.modes, REQUIRED_MODES)) errors.push('modes missing');
  if (!plan || plan.featureFlags.xSidePanelImplemented !== true) errors.push('x-side-panel must be implemented');
  if (!plan || plan.featureFlags.dockedModeImplemented !== true) errors.push('docked mode must be implemented');
  if (!plan || plan.featureFlags.overlayModeImplemented !== true) errors.push('overlay mode must be implemented');
  if (!plan || plan.featureFlags.pinnedModeImplemented !== true) errors.push('pinned mode must be implemented');
  if (!plan || plan.featureFlags.collapsedModeImplemented !== true) errors.push('collapsed mode must be implemented');
  if (!plan || plan.featureFlags.responsiveFullscreenImplemented !== true) errors.push('responsive fullscreen mode must be implemented');
  if (!plan || plan.featureFlags.usesControllerFromWpSm02 !== true) errors.push('WP-SM-04 must reuse WP-SM-02 controller');
  if (!plan || plan.featureFlags.createsSecondRegistry !== false) errors.push('WP-SM-04 must not create a second registry');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_SIDE_PANEL_TARGET
  };
}

function createSurfaceManagerSidePanelReport(options = {}) {
  const plan = options.plan || createSurfaceManagerSidePanelPlan(options);
  const validation = validateSurfaceManagerSidePanelPlan(plan);

  return {
    schema: SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    componentTags: plan.componentTags,
    runtimeArtifacts: plan.runtimeArtifacts,
    managerMethodCount: plan.managerMethods.length,
    panelMethodCount: plan.panelMethods.length,
    eventCount: plan.events.length,
    placements: plan.placements,
    modes: plan.modes,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    usesControllerFromWpSm02: plan.featureFlags.usesControllerFromWpSm02,
    sidePanelImplemented: plan.featureFlags.xSidePanelImplemented,
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
  REQUIRED_MODES,
  REQUIRED_PANEL_METHODS,
  REQUIRED_PLACEMENTS,
  RUNTIME_ARTIFACTS,
  SOURCE_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MANAGER_SIDE_PANEL_CONTRACT,
  SURFACE_MANAGER_SIDE_PANEL_DOCS,
  SURFACE_MANAGER_SIDE_PANEL_DOCS_DE,
  SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE,
  SURFACE_MANAGER_SIDE_PANEL_MODULE,
  SURFACE_MANAGER_SIDE_PANEL_PACKAGE_SCRIPT,
  SURFACE_MANAGER_SIDE_PANEL_PLAN,
  SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA,
  SURFACE_MANAGER_SIDE_PANEL_SCHEMA,
  SURFACE_MANAGER_SIDE_PANEL_STATUS,
  SURFACE_MANAGER_SIDE_PANEL_SUITE,
  SURFACE_MANAGER_SIDE_PANEL_TARGET,
  SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE,
  SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerSidePanelPlan,
  createSurfaceManagerSidePanelReport,
  validateSurfaceManagerSidePanelPlan
};
