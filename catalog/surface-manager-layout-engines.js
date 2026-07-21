const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA = 'xtend.surface.layout-engine.v1';
const SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA = 'xtend.surface.layout-engine-report.v1';
const SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA = 'xtend.surface.layout-engine-diagnostic.v1';
const SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE = 'WP-SM-16';
const SURFACE_MANAGER_LAYOUT_ENGINE_STATUS = 'implemented-docking-split-tile-layout-engines';
const SURFACE_MANAGER_LAYOUT_ENGINE_TARGET = 'surface-layout-engines-ready';
const SURFACE_MANAGER_LAYOUT_ENGINE_MODULE = 'catalog/surface-manager-layout-engines.js';
const SURFACE_MANAGER_LAYOUT_ENGINE_SUITE = 'tests/components/surface_manager_layout_engines_suite.js';
const SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE = 'tests/components/fixtures/xsurfacemanager-layout-engines.component.html';
const SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC = 'development/WP-SM-16-Docking-Split-Panes-Tiling-und-Layout-Engines-ergaenzen.md';
const SURFACE_MANAGER_LAYOUT_ENGINE_DOCS = 'docs/en/components/xsurfacemanager.md';
const SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-layout-engines --json';
const SURFACE_MANAGER_LAYOUT_ENGINE_PACKAGE_SCRIPT = 'npm run test:surface-layout-engines';

const LAYOUT_ENGINES = Object.freeze(['freeform', 'docked', 'split', 'tile', 'stacked', 'document-flow']);
const MANAGER_METHODS = Object.freeze([
  'snapshotSurfaceLayout',
  'applyLayoutEngine',
  'dockSurface',
  'undockSurface'
]);
const LAYOUT_ENGINE_EVENTS = Object.freeze([
  'surface-layout-engine-applied',
  'surface-layout-changed'
]);
const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_LAYOUT_ENGINE_MODULE,
  SURFACE_MANAGER_LAYOUT_ENGINE_SUITE,
  SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE,
  SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG,
  SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_LAYOUT_ENGINE_DOCS,
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'components/xsurfacewindow.js',
  'components/xsidepanel.js',
  'components/xsidepanel.d.ts'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerLayoutEnginesPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA,
    reportSchema: SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA,
    diagnosticSchema: SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA,
    workpackage: SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE,
    status: SURFACE_MANAGER_LAYOUT_ENGINE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_LAYOUT_ENGINE_TARGET,
    module: SURFACE_MANAGER_LAYOUT_ENGINE_MODULE,
    suite: SURFACE_MANAGER_LAYOUT_ENGINE_SUITE,
    fixture: SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE,
    backlog: SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_LAYOUT_ENGINE_DOCS,
    localGate: SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_LAYOUT_ENGINE_PACKAGE_SCRIPT,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    layoutEngines: LAYOUT_ENGINES.slice(),
    managerMethods: MANAGER_METHODS.slice(),
    events: LAYOUT_ENGINE_EVENTS.slice(),
    runtimeBoundary: {
      managerOwnsLayoutPolicy: true,
      controllerOwnsRegistry: true,
      snapshotCompatibleBounds: true,
      visibleDockingRuntime: true,
      splitPaneRuntime: true,
      tileRuntime: true,
      stackedResponsiveFallback: true,
      documentFlowRuntime: true,
      documentFlowCommitsBounds: false,
      viewportConstrainedBounds: true,
      collisionSnapRules: true,
      sidePanelFloatingMode: true,
      createsSecondRegistry: false,
      rmtKernelImportsXtendTypes: false,
      networkRequired: false
    },
    nextWorkpackage: 'WP-SM-17',
    nextDecision: 'remote-surface-trust-policy',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerLayoutEnginesPlan(plan = createSurfaceManagerLayoutEnginesPlan()) {
  const errors = [];
  if (!plan || plan.schema !== SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA}`);
  if (!plan || plan.diagnosticSchema !== SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA) errors.push(`diagnosticSchema must be ${SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_LAYOUT_ENGINE_STATUS) errors.push(`status must be ${SURFACE_MANAGER_LAYOUT_ENGINE_STATUS}`);
  if (!includesAll(plan && plan.layoutEngines, LAYOUT_ENGINES)) errors.push('layout engines missing');
  if (!includesAll(plan && plan.managerMethods, MANAGER_METHODS)) errors.push('layout manager methods missing');
  if (!includesAll(plan && plan.events, LAYOUT_ENGINE_EVENTS)) errors.push('layout engine events missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.managerOwnsLayoutPolicy !== true) errors.push('manager must own layout policy');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.controllerOwnsRegistry !== true) errors.push('controller must own registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.visibleDockingRuntime !== true) errors.push('docking must be visible runtime behavior');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.documentFlowRuntime !== true) errors.push('document-flow must be visible runtime behavior');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.documentFlowCommitsBounds !== false) errors.push('document-flow must not commit surface bounds');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.snapshotCompatibleBounds !== true) errors.push('layout bounds must be snapshot compatible');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('layout engine must not create a second registry');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  return {
    schema: SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_LAYOUT_ENGINE_TARGET
  };
}

function createSurfaceManagerLayoutEnginesReport(options = {}) {
  const plan = options.plan || createSurfaceManagerLayoutEnginesPlan(options);
  const validation = validateSurfaceManagerLayoutEnginesPlan(plan);
  return {
    schema: SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    layoutEngines: plan.layoutEngines.slice(),
    managerMethods: plan.managerMethods.length,
    events: plan.events.length,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  LAYOUT_ENGINES,
  LAYOUT_ENGINE_EVENTS,
  MANAGER_METHODS,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG,
  SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA,
  SURFACE_MANAGER_LAYOUT_ENGINE_DOCS,
  SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE,
  SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE,
  SURFACE_MANAGER_LAYOUT_ENGINE_MODULE,
  SURFACE_MANAGER_LAYOUT_ENGINE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA,
  SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA,
  SURFACE_MANAGER_LAYOUT_ENGINE_STATUS,
  SURFACE_MANAGER_LAYOUT_ENGINE_SUITE,
  SURFACE_MANAGER_LAYOUT_ENGINE_TARGET,
  SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE,
  SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC,
  createSurfaceManagerLayoutEnginesPlan,
  createSurfaceManagerLayoutEnginesReport,
  validateSurfaceManagerLayoutEnginesPlan
};
