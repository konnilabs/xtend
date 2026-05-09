const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_RMT_AUTHORING_SCHEMA = 'xtend.rmt.surface-authoring.v1';
const SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA = 'xtend.rmt.surface-authoring-report.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE = 'WP-SM-01';
const SURFACE_MANAGER_RMT_AUTHORING_STATUS = 'accepted-contract';
const SURFACE_MANAGER_RMT_AUTHORING_TARGET = 'rmt-native-surface-authoring-ready';
const SURFACE_MANAGER_RMT_AUTHORING_MODULE = 'catalog/surface-manager-rmt-authoring.js';
const SURFACE_MANAGER_RMT_AUTHORING_SUITE = 'tests/rmt/rmt_surface_manager_authoring_suite.js';
const SURFACE_MANAGER_RMT_AUTHORING_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_RMT_AUTHORING_CONTRACT = 'development/XTend-SurfaceManager-Contract-und-RMT-Authoring-Model.md';
const SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC = 'development/WP-SM-01-SurfaceManager-Contract-und-RMT-Authoring-Model-definieren.md';
const SURFACE_MANAGER_RMT_AUTHORING_DOCS = 'docs/surface-manager-rmt-authoring.md';
const SURFACE_MANAGER_RMT_AUTHORING_FIXTURE = 'tests/fixtures/rmt-surface-manager-workbench.rmt';
const SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-surface-authoring --json';
const SURFACE_MANAGER_RMT_AUTHORING_PACKAGE_SCRIPT = 'npm run test:rmt-surface-authoring';
const NEXT_WORKPACKAGE = 'WP-SM-02';
const NEXT_DECISION = 'surface-controller-state-snapshot';

const REQUIRED_DOMAINS = Object.freeze([
  'manifest',
  'adapters',
  'components',
  'routes',
  'schedules',
  'templates',
  'metadata.surface',
  'metadata.surfaceManager'
]);

const REQUIRED_ADAPTERS = Object.freeze([
  'xtend.component',
  'xtend.xrouter',
  'rmt.state-scheduler-diagnostics'
]);

const RESERVED_ADAPTERS = Object.freeze([
  'xtend.surface'
]);

const REQUIRED_COMPONENTS = Object.freeze([
  'app.shell',
  'workbench.manager',
  'workbench.inspector',
  'workbench.editor',
  'workbench.properties',
  'inspector.content',
  'editor.content',
  'properties.content'
]);

const SURFACE_COMPONENT_TAGS = Object.freeze([
  'x-surface-manager',
  'x-surface-window',
  'x-side-panel'
]);

const COMPATIBILITY_SURFACE_TAGS = Object.freeze([
  'x-modal',
  'x-dialog',
  'x-drawer',
  'x-popover',
  'x-tooltip'
]);

const SURFACE_TYPES = Object.freeze([
  'window',
  'side-panel',
  'modal',
  'dialog',
  'drawer',
  'popover',
  'tooltip'
]);

const MVP_SURFACE_TYPES = Object.freeze([
  'window',
  'side-panel'
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

const REQUIRED_LANES = Object.freeze([
  'user-blocking',
  'visible',
  'transition',
  'idle',
  'background',
  'diagnostics'
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_RMT_AUTHORING_PLAN,
  SURFACE_MANAGER_RMT_AUTHORING_CONTRACT,
  SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC,
  SURFACE_MANAGER_RMT_AUTHORING_DOCS,
  'development/ADR-XTend-Fabric.md',
  'development/XTend-RMT-First-Class-App-Authoring.md',
  'development/XTend-Overlay-und-Interaction-UX-Reife-Contract.md',
  'docs/component-ux-app-authoring.md',
  'docs/xtend-fabric.md'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_RMT_AUTHORING_MODULE,
  SURFACE_MANAGER_RMT_AUTHORING_SUITE,
  SURFACE_MANAGER_RMT_AUTHORING_FIXTURE,
  SURFACE_MANAGER_RMT_AUTHORING_CONTRACT,
  SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC,
  SURFACE_MANAGER_RMT_AUTHORING_DOCS
]);

function unique(values) {
  return [...new Set(values)];
}

function createSurfaceManagerRmtAuthoringPlan(options = {}) {
  const surfaceTypes = unique([
    ...MVP_SURFACE_TYPES,
    ...SURFACE_TYPES
  ]);
  const componentTags = SURFACE_COMPONENT_TAGS.slice();
  const compatibilityTags = COMPATIBILITY_SURFACE_TAGS.slice();
  const requiredSchedules = REQUIRED_SCHEDULES.slice();
  const scheduleLanes = REQUIRED_LANES.slice();

  return {
    schema: SURFACE_MANAGER_RMT_AUTHORING_SCHEMA,
    reportSchema: SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    workpackage: SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE,
    status: SURFACE_MANAGER_RMT_AUTHORING_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_RMT_AUTHORING_TARGET,
    module: SURFACE_MANAGER_RMT_AUTHORING_MODULE,
    suite: SURFACE_MANAGER_RMT_AUTHORING_SUITE,
    planningDocument: SURFACE_MANAGER_RMT_AUTHORING_PLAN,
    contract: SURFACE_MANAGER_RMT_AUTHORING_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_RMT_AUTHORING_DOCS,
    fixture: SURFACE_MANAGER_RMT_AUTHORING_FIXTURE,
    localGate: SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_RMT_AUTHORING_PACKAGE_SCRIPT,
    requiredDomains: REQUIRED_DOMAINS.slice(),
    requiredAdapters: REQUIRED_ADAPTERS.slice(),
    reservedAdapters: RESERVED_ADAPTERS.slice(),
    requiredComponents: REQUIRED_COMPONENTS.slice(),
    componentTags,
    compatibilityTags,
    mvpSurfaceTypes: MVP_SURFACE_TYPES.slice(),
    supportedSurfaceTypes: surfaceTypes,
    requiredSchedules,
    scheduleLanes,
    requiredDocs: REQUIRED_DOCS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    authoringModel: {
      mvpPath: 'component-records-with-metadata.surface',
      futureDomain: 'surfaces',
      futureAdapter: 'xtend.surface',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      statePolicy: 'digital-twin-ssot-xstate',
      componentContract: 'xtend.component.contract.v2',
      fabricApi: '@xtend-fabric',
      loaderPolicy: 'manifest-ensure-through-xtend-loader-policy'
    },
    surfaceLifecycle: [
      'declare',
      'create',
      'mount',
      'hydrate',
      'open',
      'activate',
      'update',
      'deactivate',
      'close',
      'unmount',
      'dispose'
    ],
    windowLifecycle: [
      'move.start',
      'move.commit',
      'resize.start',
      'resize.commit',
      'minimize',
      'restore',
      'maximize',
      'dock',
      'undock'
    ],
    a11yRequirements: [
      'accessible-name-required',
      'focus-restore-required',
      'modal-inert-only-for-modal-surfaces',
      'keyboard-move-resize-alternative',
      'a11y-announcements-user-blocking',
      'reduced-motion-and-forced-colors-aware'
    ],
    securityRequirements: [
      'no-inline-js-events',
      'dom-descriptor-preferred',
      'trusted-dom-boundary-for-html-fragment',
      'no-external-imports',
      'no-dom-node-diagnostics',
      'layout-state-only-persistence'
    ],
    localGateMode: 'static-rmt-surface-authoring-contract',
    runtimeComponentsImplemented: false,
    externalBrowserRequiredInLocalGate: false,
    externalNetworkAllowedInLocalGate: false,
    frameworkAgnostic: true,
    rmtKernelImportsXtendTypes: false,
    adapterBoundary: 'xtend-component-adapter-now-surface-adapter-reserved',
    fabricRelationship: 'surface-manager-consumes-fabric-does-not-replace-fabric',
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceManagerRmtAuthoringPlan(plan = createSurfaceManagerRmtAuthoringPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_RMT_AUTHORING_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_RMT_AUTHORING_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA}`);
  if (!plan || plan.surfaceManagerSchema !== SURFACE_MANAGER_SCHEMA) errors.push(`surfaceManagerSchema must be ${SURFACE_MANAGER_SCHEMA}`);
  if (!plan || plan.surfaceRecordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`surfaceRecordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_RMT_AUTHORING_STATUS) errors.push(`status must be ${SURFACE_MANAGER_RMT_AUTHORING_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_RMT_AUTHORING_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_RMT_AUTHORING_TARGET}`);
  REQUIRED_DOMAINS.forEach((domain) => {
    if (!plan || !plan.requiredDomains.includes(domain)) errors.push(`domain missing: ${domain}`);
  });
  REQUIRED_ADAPTERS.forEach((adapter) => {
    if (!plan || !plan.requiredAdapters.includes(adapter)) errors.push(`adapter missing: ${adapter}`);
  });
  RESERVED_ADAPTERS.forEach((adapter) => {
    if (!plan || !plan.reservedAdapters.includes(adapter)) errors.push(`reserved adapter missing: ${adapter}`);
  });
  REQUIRED_COMPONENTS.forEach((componentId) => {
    if (!plan || !plan.requiredComponents.includes(componentId)) errors.push(`component missing: ${componentId}`);
  });
  SURFACE_COMPONENT_TAGS.forEach((tag) => {
    if (!plan || !plan.componentTags.includes(tag)) errors.push(`surface component tag missing: ${tag}`);
  });
  COMPATIBILITY_SURFACE_TAGS.forEach((tag) => {
    if (!plan || !plan.compatibilityTags.includes(tag)) errors.push(`compatibility tag missing: ${tag}`);
  });
  SURFACE_TYPES.forEach((type) => {
    if (!plan || !plan.supportedSurfaceTypes.includes(type)) errors.push(`surface type missing: ${type}`);
  });
  REQUIRED_SCHEDULES.forEach((scheduleId) => {
    if (!plan || !plan.requiredSchedules.includes(scheduleId)) errors.push(`schedule missing: ${scheduleId}`);
  });
  REQUIRED_LANES.forEach((lane) => {
    if (!plan || !plan.scheduleLanes.includes(lane)) errors.push(`lane missing: ${lane}`);
  });
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.requiredDocs.includes(docPath)) errors.push(`doc missing: ${docPath}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifactPath) => {
    if (!plan || !plan.artifactPaths.includes(artifactPath)) errors.push(`artifact missing: ${artifactPath}`);
  });
  if (!plan || plan.authoringModel.mvpPath !== 'component-records-with-metadata.surface') errors.push('MVP path must use component records with metadata.surface');
  if (!plan || plan.authoringModel.futureDomain !== 'surfaces') errors.push('future domain must be surfaces');
  if (!plan || plan.authoringModel.futureAdapter !== 'xtend.surface') errors.push('future adapter must be xtend.surface');
  if (!plan || plan.authoringModel.templateMode !== 'dom_descriptor') errors.push('template mode must be dom_descriptor');
  if (!plan || plan.authoringModel.eventBindingMode !== 'dom-event-to-rmt-command') errors.push('event binding mode must be dom-event-to-rmt-command');
  if (!plan || plan.runtimeComponentsImplemented !== false) errors.push('WP-SM-01 must not claim runtime components are implemented');
  if (!plan || plan.externalBrowserRequiredInLocalGate !== false || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require browser or network');
  if (!plan || plan.frameworkAgnostic !== true) errors.push('RMT surface authoring must remain framework agnostic');
  if (!plan || plan.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel must not import XTend types');
  if (!plan || plan.adapterBoundary !== 'xtend-component-adapter-now-surface-adapter-reserved') errors.push('adapter boundary must keep surface adapter reserved');
  if (!plan || plan.fabricRelationship !== 'surface-manager-consumes-fabric-does-not-replace-fabric') errors.push('Fabric relationship must remain subordinate');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE
  };
}

function createSurfaceManagerRmtAuthoringReport(options = {}) {
  const plan = options.plan || createSurfaceManagerRmtAuthoringPlan(options);
  const validation = validateSurfaceManagerRmtAuthoringPlan(plan);

  return {
    schema: SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    domainCount: plan.requiredDomains.length,
    componentCount: plan.requiredComponents.length,
    scheduleCount: plan.requiredSchedules.length,
    surfaceTypeCount: plan.supportedSurfaceTypes.length,
    mvpSurfaceTypes: plan.mvpSurfaceTypes.slice(),
    componentTags: plan.componentTags.slice(),
    compatibilityTags: plan.compatibilityTags.slice(),
    futureDomain: plan.authoringModel.futureDomain,
    futureAdapter: plan.authoringModel.futureAdapter,
    runtimeComponentsImplemented: plan.runtimeComponentsImplemented,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision,
    kernelBoundary: plan.kernelBoundary
  };
}

module.exports = {
  COMPATIBILITY_SURFACE_TAGS,
  KERNEL_BOUNDARY,
  MVP_SURFACE_TYPES,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_COMPONENTS,
  REQUIRED_DOCS,
  REQUIRED_DOMAINS,
  REQUIRED_LANES,
  REQUIRED_SCHEDULES,
  RESERVED_ADAPTERS,
  SURFACE_COMPONENT_TAGS,
  SURFACE_MANAGER_RMT_AUTHORING_CONTRACT,
  SURFACE_MANAGER_RMT_AUTHORING_DOCS,
  SURFACE_MANAGER_RMT_AUTHORING_FIXTURE,
  SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE,
  SURFACE_MANAGER_RMT_AUTHORING_MODULE,
  SURFACE_MANAGER_RMT_AUTHORING_PACKAGE_SCRIPT,
  SURFACE_MANAGER_RMT_AUTHORING_PLAN,
  SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA,
  SURFACE_MANAGER_RMT_AUTHORING_SCHEMA,
  SURFACE_MANAGER_RMT_AUTHORING_STATUS,
  SURFACE_MANAGER_RMT_AUTHORING_SUITE,
  SURFACE_MANAGER_RMT_AUTHORING_TARGET,
  SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE,
  SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_TYPES,
  createSurfaceManagerRmtAuthoringPlan,
  createSurfaceManagerRmtAuthoringReport,
  validateSurfaceManagerRmtAuthoringPlan
};
