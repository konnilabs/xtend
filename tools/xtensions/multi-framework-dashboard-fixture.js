'use strict';

const {
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA,
  createKernelSignal,
  createSurfaceEvent
} = require('./signal-bridge-contract');
const {
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  createMaracaXTensionBuildPlan,
  sha256Value
} = require('./maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA,
  createXTensionsRuntimeReport
} = require('./runtime-capability-registry');
const {
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
  XTENSIONS_SECURITY_REPORT_SCHEMA,
  createXTensionsSecurityIntegrityGate
} = require('./security-integrity-gate');
const {
  createChartUpdateRecord,
  createLeafletEventRecord
} = require('./imperative-host-pocs');
const {
  decideReactSchedulingHint
} = require('./react-host-controller-poc');
const {
  createVueUpdateAdapterRecord
} = require('./vue-host-controller-poc');
const {
  createThreeBrowserSmokeRecord,
  createThreeFrameRecord
} = require('./three-render-loop-poc');

const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA = 'xtend.xtensions.multi-framework-dashboard.v1';
const XTENSIONS_DASHBOARD_SURFACE_SCHEMA = 'xtend.xtensions.dashboard-surface.v1';
const XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA = 'xtend.xtensions.dashboard-event-flow.v1';
const XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA = 'xtend.xtensions.dashboard-browser-smoke.v1';
const XTENSIONS_DASHBOARD_REPORT_SCHEMA = 'xtend.xtensions.dashboard-report.v1';
const XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.dashboard-diagnostic.v1';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH = 'tools/xtensions/multi-framework-dashboard-fixture.js';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH = 'tools/xtensions/multi-framework-dashboard-fixture.d.ts';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH = 'tests/xtensions/xtensions_multi_framework_dashboard_suite.js';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH = 'tests/fixtures/xtensions/multi-framework-dashboard-valid.json';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH = 'development/XTensions-Multi-Framework-Dashboard-Fixture-and-Browser-Smokes-Contract.md';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE = 'XTN-12';
const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_PACKAGE_SCRIPT = 'npm run test:xtensions-multi-framework-dashboard';

const DASHBOARD_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.dashboard.framework_dependency';
const DASHBOARD_SURFACE_MISSING_CODE = 'xtensions.dashboard.surface_missing';
const DASHBOARD_EVENT_FLOW_TARGET_MISSING_CODE = 'xtensions.dashboard.event_flow_target_missing';
const DASHBOARD_SMOKE_BLANK_CODE = 'xtensions.dashboard.smoke_blank';
const DASHBOARD_SMOKE_INTERACTION_MISSING_CODE = 'xtensions.dashboard.smoke_interaction_missing';
const DASHBOARD_SMOKE_LAZY_MISSING_CODE = 'xtensions.dashboard.smoke_lazy_missing';
const DASHBOARD_SMOKE_SUSPEND_MISSING_CODE = 'xtensions.dashboard.smoke_suspend_missing';
const DASHBOARD_SMOKE_CLEANUP_MISSING_CODE = 'xtensions.dashboard.smoke_cleanup_missing';
const DASHBOARD_NETWORK_REQUIRED_CODE = 'xtensions.dashboard.network_required';

const DASHBOARD_SURFACE_ROLES = Object.freeze([
  'native-shell',
  'react-panel',
  'vue-panel',
  'chart',
  'map',
  'three-scene'
]);

const DASHBOARD_BROWSER_SMOKE_KINDS = Object.freeze([
  'mount',
  'interaction',
  'lazy-load',
  'suspend',
  'teardown',
  'canvas-pixel',
  'webgl-pixel'
]);

const DASHBOARD_EVENT_FLOW_STAGES = Object.freeze([
  'map-selection-event',
  'fabric-route',
  'chart-update',
  'react-panel-update',
  'vue-panel-update',
  'degraded-fallback-visible'
]);

const DASHBOARD_BOUNDARIES = Object.freeze([
  'dashboard-fixture-is-frameworkless-contract-data',
  'no-react-vue-chart-leaflet-three-imports-in-xtend',
  'cross-surface-events-route-through-fabric',
  'no-framework-to-framework-direct-coupling',
  'browser-smokes-use-frameworkless-evidence-records',
  'canvas-and-webgl-nonblank-probes-are-local',
  'degraded-xtension-does-not-block-shell',
  'local-fixture-requires-no-network-or-cdn'
]);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createDashboardDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA,
    workpackage: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
    severity,
    code,
    message,
    dashboardId: subject && subject.dashboardId || subject && subject.id || null,
    surfaceId: subject && subject.surfaceId || null,
    xtensionId: subject && subject.xtensionId || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeSurface(surface = {}, options = {}) {
  const source = surface && typeof surface === 'object' ? surface : {};
  const manifest = source.manifest && typeof source.manifest === 'object' ? source.manifest : null;
  const xtensionId = normalizeString(source.xtensionId || manifest && (manifest.id || manifest.xtensionId));
  const framework = normalizeString(source.framework || manifest && manifest.framework || 'native');
  const surfaceId = normalizeString(source.surfaceId || source.id || `surface.${xtensionId || framework}`);
  const role = normalizeString(source.role || source.kind || framework);

  return {
    schema: XTENSIONS_DASHBOARD_SURFACE_SCHEMA,
    dashboardId: normalizeString(options.dashboardId),
    surfaceId,
    xtensionId,
    role,
    framework,
    hostId: normalizeString(source.hostId || options.hostId || 'xtend-dashboard.host'),
    nativeSurface: source.nativeSurface === true || framework === 'native',
    lazy: cloneJson(source.lazy || manifest && manifest.lazy || {}),
    fallback: cloneJson(source.fallback || manifest && manifest.fallback || {}),
    manifest,
    expectedRuntimeStatus: normalizeString(source.expectedRuntimeStatus || 'loaded') || 'loaded',
    ownsContainer: source.ownsContainer !== false,
    diagnostics: [],
    timestamp: timestampFromOptions(options)
  };
}

function manifestsFromSurfaces(surfaces) {
  return surfaces
    .filter((surface) => !surface.nativeSurface && surface.manifest)
    .map((surface) => surface.manifest);
}

function requestsFromSurfaces(surfaces) {
  return surfaces
    .filter((surface) => !surface.nativeSurface && surface.xtensionId)
    .map((surface) => ({
      xtensionId: surface.xtensionId,
      surfaceId: surface.surfaceId,
      enabled: true
    }));
}

function surfaceByRole(surfaces, role) {
  return surfaces.find((surface) => surface.role === role) || null;
}

function runtimeStatusByXtension(runtimeReport) {
  return (runtimeReport.decisions || []).reduce((result, decision) => {
    result[decision.xtensionId] = decision.status;
    return result;
  }, {});
}

function createDashboardBrowserSmokeRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const kind = normalizeString(source.kind || source.smoke || 'mount') || 'mount';
  const framework = normalizeString(source.framework || options.framework || 'native');
  const nonBlankPixels = Number(source.nonBlankPixels || 0);
  const interactionCount = Number(source.interactionCount || 0);
  const cleanupVerified = source.cleanupVerified === true;
  const lazyLoaded = source.lazyLoaded === true;
  const suspended = source.suspended === true;
  const diagnostics = [];
  const subject = {
    dashboardId: options.dashboardId,
    surfaceId: source.surfaceId || options.surfaceId,
    xtensionId: source.xtensionId || options.xtensionId,
    framework
  };

  if ((kind === 'canvas-pixel' || kind === 'webgl-pixel') && (!Number.isFinite(nonBlankPixels) || nonBlankPixels <= 0)) {
    diagnostics.push(createDashboardDiagnostic(
      subject,
      DASHBOARD_SMOKE_BLANK_CODE,
      `${kind} smoke requires nonblank pixel evidence.`,
      'error',
      { field: 'nonBlankPixels', nonBlankPixels }
    ));
  }

  if (kind === 'interaction' && (!Number.isFinite(interactionCount) || interactionCount <= 0)) {
    diagnostics.push(createDashboardDiagnostic(
      subject,
      DASHBOARD_SMOKE_INTERACTION_MISSING_CODE,
      'Interaction smoke requires at least one recorded interaction.',
      'error',
      { field: 'interactionCount', interactionCount }
    ));
  }

  if (kind === 'lazy-load' && !lazyLoaded) {
    diagnostics.push(createDashboardDiagnostic(
      subject,
      DASHBOARD_SMOKE_LAZY_MISSING_CODE,
      'Lazy-load smoke requires explicit lazyLoaded evidence.',
      'error',
      { field: 'lazyLoaded', lazyLoaded }
    ));
  }

  if (kind === 'suspend' && !suspended) {
    diagnostics.push(createDashboardDiagnostic(
      subject,
      DASHBOARD_SMOKE_SUSPEND_MISSING_CODE,
      'Suspend smoke requires suspended evidence.',
      'error',
      { field: 'suspended', suspended }
    ));
  }

  if (kind === 'teardown' && !cleanupVerified) {
    diagnostics.push(createDashboardDiagnostic(
      subject,
      DASHBOARD_SMOKE_CLEANUP_MISSING_CODE,
      'Teardown smoke requires cleanup verification.',
      'error',
      { field: 'cleanupVerified', cleanupVerified }
    ));
  }

  return {
    schema: XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA,
    workpackage: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
    dashboardId: subject.dashboardId || null,
    surfaceId: subject.surfaceId || null,
    xtensionId: subject.xtensionId || null,
    framework,
    kind,
    smokeMode: normalizeString(source.smokeMode || 'frameworkless-browser-evidence') || 'frameworkless-browser-evidence',
    browserRuntimeRequired: false,
    frameworkRuntimeImported: false,
    localNetworkRequired: false,
    nonBlankPixels: Number.isFinite(nonBlankPixels) ? nonBlankPixels : 0,
    interactionCount: Number.isFinite(interactionCount) ? interactionCount : 0,
    lazyLoaded,
    suspended,
    cleanupVerified,
    evidence: cloneJson(source.evidence || {}),
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function signalTypeForRole(role) {
  if (role === 'chart') return 'dashboard.selection.chart.update';
  if (role === 'react-panel') return 'dashboard.selection.react.props';
  if (role === 'vue-panel') return 'dashboard.selection.vue.state';
  if (role === 'three-scene') return 'dashboard.selection.scene.highlight';
  return 'dashboard.selection.update';
}

function createDashboardEventFlow(input = {}, surfaces = [], options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const mapSurface = surfaceByRole(surfaces, source.sourceRole || 'map');
  const targetRoles = toArray(source.targets || ['chart', 'react-panel', 'vue-panel']).map(normalizeString).filter(Boolean);
  const selection = cloneJson(source.selection || source.payload || {}) || {};
  const runtimeStatuses = options.runtimeStatuses || {};
  const diagnostics = [];

  if (!mapSurface) {
    diagnostics.push(createDashboardDiagnostic(
      { dashboardId: options.dashboardId },
      DASHBOARD_SURFACE_MISSING_CODE,
      'Dashboard event flow requires a map source surface.',
      'error',
      { field: 'sourceRole', role: source.sourceRole || 'map' }
    ));
  }

  const mapEvent = mapSurface ? createSurfaceEvent({
    eventId: source.eventId || 'dashboard-flow:map-selection',
    event: source.event || 'map.selection.changed',
    source: {
      hostId: mapSurface.hostId,
      surfaceId: mapSurface.surfaceId,
      xtensionId: mapSurface.xtensionId,
      framework: mapSurface.framework
    },
    owner: source.owner || 'xtend-dashboard',
    lane: source.lane || 'interactive',
    payloadSchema: source.payloadSchema || 'xtensions.dashboard.selection.v1',
    payload: selection,
    trustBoundary: 'same-origin-adapter',
    policy: {
      deliveryMode: 'queued',
      correlationId: 'required',
      idempotencyKey: 'required',
      deadLetter: 'required',
      backpressure: 'coalesce-by-target',
      coalescePolicy: 'target',
      coalesceKey: source.coalesceKey || 'dashboard.selection'
    }
  }, options) : null;
  if (mapEvent) diagnostics.push(...(mapEvent.diagnostics || []));

  const leafletRecord = mapSurface ? createLeafletEventRecord({
    type: 'layer.click',
    payload: selection,
    eventCount: 1,
    maxEventsPerWindow: 20
  }, {
    xtensionId: mapSurface.xtensionId,
    clock: options.clock
  }) : null;
  if (leafletRecord) diagnostics.push(...(leafletRecord.diagnostics || []));

  const targetSignals = [];
  const adapterRecords = [];
  const targetStatuses = [];

  targetRoles.forEach((role) => {
    const target = surfaceByRole(surfaces, role);
    if (!target) {
      diagnostics.push(createDashboardDiagnostic(
        { dashboardId: options.dashboardId },
        DASHBOARD_EVENT_FLOW_TARGET_MISSING_CODE,
        `Dashboard event flow target role "${role}" is missing.`,
        'error',
        { field: 'targets', role }
      ));
      return;
    }

    const runtimeStatus = runtimeStatuses[target.xtensionId] || target.expectedRuntimeStatus || 'loaded';
    const signal = createKernelSignal({
      signalId: `dashboard-flow:${source.flowId || 'selection'}:${role}`,
      type: signalTypeForRole(role),
      target: {
        hostId: target.hostId,
        surfaceId: target.surfaceId,
        xtensionId: target.xtensionId
      },
      lane: role === 'chart' ? 'visible' : 'interactive',
      payloadSchema: source.payloadSchema || 'xtensions.dashboard.selection.v1',
      payload: {
        selection,
        sourceSurfaceId: mapSurface && mapSurface.surfaceId || null,
        targetRole: role
      },
      policy: {
        deliveryMode: 'queued',
        correlationId: 'required',
        idempotencyKey: 'required',
        deadLetter: 'required',
        backpressure: 'coalesce-by-target',
        coalescePolicy: 'target',
        coalesceKey: `dashboard.selection:${role}`
      }
    }, options);
    diagnostics.push(...(signal.diagnostics || []));
    targetSignals.push(signal);
    targetStatuses.push({
      role,
      surfaceId: target.surfaceId,
      xtensionId: target.xtensionId,
      framework: target.framework,
      runtimeStatus,
      delivered: runtimeStatus === 'loaded',
      degraded: runtimeStatus === 'degraded',
      fallbackVisible: runtimeStatus === 'degraded'
    });

    if (role === 'chart') {
      const chartRecord = createChartUpdateRecord({
        mode: 'active',
        payload: {
          selection,
          series: source.chartSeries || 'regionalRevenue'
        }
      }, {
        xtensionId: target.xtensionId,
        clock: options.clock
      });
      diagnostics.push(...(chartRecord.diagnostics || []));
      adapterRecords.push(chartRecord);
    }

    if (role === 'react-panel') {
      adapterRecords.push(decideReactSchedulingHint({
        operation: 'update',
        lane: 'interactive',
        priorityHint: 'user-blocking',
        budgetMs: 12
      }, {
        clock: options.clock
      }));
    }

    if (role === 'vue-panel') {
      const vueRecord = createVueUpdateAdapterRecord('applyStatePatch', {
        selectedRegion: selection.regionId || selection.id || null,
        status: runtimeStatus === 'degraded' ? 'fallback-visible' : 'updated'
      }, {
        xtensionId: target.xtensionId,
        clock: options.clock
      });
      diagnostics.push(...(vueRecord.diagnostics || []));
      adapterRecords.push(vueRecord);
    }
  });

  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const degradedCount = targetStatuses.filter((target) => target.degraded).length;

  return {
    schema: XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    kernelSignalSchema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    workpackage: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
    flowId: normalizeString(source.flowId || 'map-selection-updates-dashboard'),
    dashboardId: options.dashboardId || null,
    sourceRole: source.sourceRole || 'map',
    targetRoles,
    stages: DASHBOARD_EVENT_FLOW_STAGES.slice(),
    mapEvent,
    leafletRecord,
    targetSignals,
    adapterRecords,
    targetStatuses,
    deliveredCount: targetStatuses.filter((target) => target.delivered).length,
    degradedCount,
    ok: blockingDiagnostics.length === 0,
    status: blockingDiagnostics.length > 0 ? 'blocked' : (degradedCount > 0 ? 'degraded' : 'ready'),
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function assertMultiFrameworkDashboardDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      schema: XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA,
      source: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA,
      workpackage: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
      severity: 'error',
      code: DASHBOARD_FRAMEWORK_DEPENDENCY_CODE,
      message: diagnostic.message,
      dashboardId: null,
      surfaceId: null,
      xtensionId: null,
      framework: null,
      field: diagnostic.details && (diagnostic.details.section || diagnostic.details.name) || null,
      metadata: cloneJson(diagnostic.details || {})
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createXTensionsMultiFrameworkDashboardReport(input = {}, options = {}) {
  const dashboard = input.dashboard && typeof input.dashboard === 'object' ? input.dashboard : input;
  const dashboardId = normalizeString(dashboard.id || input.id || 'xtension.dashboard.fixture');
  const host = dashboard.host || input.host || {};
  const hostId = normalizeString(host.hostId || 'xtend-dashboard.host');
  const surfaces = toArray(dashboard.surfaces || input.surfaces).map((surface) => normalizeSurface(surface, {
    ...options,
    dashboardId,
    hostId
  }));
  const manifests = manifestsFromSurfaces(surfaces);
  const requests = requestsFromSurfaces(surfaces);
  const missingRoles = DASHBOARD_SURFACE_ROLES.filter((role) => !surfaceByRole(surfaces, role));
  const surfaceDiagnostics = missingRoles.map((role) => createDashboardDiagnostic(
    { dashboardId },
    DASHBOARD_SURFACE_MISSING_CODE,
    `Dashboard fixture is missing required surface role "${role}".`,
    'error',
    { field: 'surfaces.role', role }
  ));
  const dependencyBoundary = assertMultiFrameworkDashboardDependencyBoundary({
    packageManifest: input.packageManifest || options.packageManifest || {},
    sourceText: input.sourceText || options.sourceText || ''
  });
  const maracaPlan = createMaracaXTensionBuildPlan({ xtensions: manifests }, options);
  const securityReport = createXTensionsSecurityIntegrityGate({
    policy: dashboard.securityPolicy || input.securityPolicy || {},
    xtensions: manifests,
    packageManifest: input.packageManifest || options.packageManifest || {},
    sourceText: input.sourceText || options.sourceText || ''
  }, options);
  const runtimeReport = createXTensionsRuntimeReport({
    host,
    artifacts: maracaPlan.artifacts,
    requests
  }, options);
  const runtimeStatuses = runtimeStatusByXtension(runtimeReport);
  const eventFlows = toArray(dashboard.eventFlows || input.eventFlows).map((flow) => createDashboardEventFlow(flow, surfaces, {
    ...options,
    dashboardId,
    runtimeStatuses
  }));
  const browserSmokeRecords = toArray(dashboard.browserSmokes || input.browserSmokes).map((smoke) => createDashboardBrowserSmokeRecord(smoke, {
    ...options,
    dashboardId
  }));

  const threeSurface = surfaceByRole(surfaces, 'three-scene');
  const threeSmokeInputs = browserSmokeRecords
    .filter((record) => record.kind === 'webgl-pixel')
    .map((record) => createThreeBrowserSmokeRecord({
      xtensionId: record.xtensionId || threeSurface && threeSurface.xtensionId,
      nonBlankPixels: record.nonBlankPixels,
      interactionCount: record.interactionCount,
      cleanupVerified: record.cleanupVerified,
      evidence: record.evidence
    }, options));
  const threeFrameRecords = toArray(dashboard.frameProbes || input.frameProbes).map((frame, index) => createThreeFrameRecord(frame, {
    xtensionId: threeSurface && threeSurface.xtensionId || 'xtension.three.scene',
    sequence: index + 1,
    clock: options.clock
  }));

  const diagnostics = []
    .concat(surfaceDiagnostics)
    .concat(dependencyBoundary.diagnostics || [])
    .concat(maracaPlan.diagnostics || [])
    .concat(securityReport.diagnostics || [])
    .concat(runtimeReport.diagnostics || [])
    .concat(eventFlows.flatMap((flow) => flow.diagnostics || []))
    .concat(browserSmokeRecords.flatMap((record) => record.diagnostics || []))
    .concat(threeSmokeInputs.flatMap((record) => record.diagnostics || []))
    .concat(threeFrameRecords.flatMap((record) => record.diagnostics || []));
  const networkRequired = dashboard.localNetworkRequired === true || input.localNetworkRequired === true;
  if (networkRequired) {
    diagnostics.push(createDashboardDiagnostic(
      { dashboardId },
      DASHBOARD_NETWORK_REQUIRED_CODE,
      'XTensions dashboard fixture must run locally without network access.',
      'error',
      { field: 'localNetworkRequired', localNetworkRequired: true }
    ));
  }
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const degradedRuntime = runtimeReport.status === 'degraded' || eventFlows.some((flow) => flow.status === 'degraded');
  const appShellBlocked = runtimeReport.appShellBlocked === true || blockingDiagnostics.length > 0;
  const status = appShellBlocked ? 'blocked' : (degradedRuntime ? 'degraded' : 'ready');

  return {
    schema: XTENSIONS_DASHBOARD_REPORT_SCHEMA,
    dashboardSchema: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA,
    surfaceSchema: XTENSIONS_DASHBOARD_SURFACE_SCHEMA,
    eventFlowSchema: XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA,
    browserSmokeSchema: XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA,
    diagnosticSchema: XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA,
    signalBridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    kernelSignalSchema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    maracaManifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    maracaBuildPlanSchema: XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    runtimeReportSchema: XTENSIONS_RUNTIME_REPORT_SCHEMA,
    securityGateSchema: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    securityReportSchema: XTENSIONS_SECURITY_REPORT_SCHEMA,
    workpackage: XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
    ok: !appShellBlocked,
    status,
    dashboardId,
    hostId,
    frameworkCodeRequired: false,
    runtimeExecutionRequired: false,
    localNetworkRequired: false,
    appShellBlocked,
    appShellResponsive: !appShellBlocked,
    surfaces,
    manifests,
    maracaPlan,
    securityReport,
    runtimeReport,
    eventFlows,
    browserSmokeRecords,
    threeSmokeRecords: threeSmokeInputs,
    threeFrameRecords,
    dependencyBoundary,
    diagnostics,
    summary: {
      surfaceCount: surfaces.length,
      xtensionSurfaceCount: surfaces.filter((surface) => !surface.nativeSurface).length,
      nativeSurfaceCount: surfaces.filter((surface) => surface.nativeSurface).length,
      manifestCount: manifests.length,
      eventFlowCount: eventFlows.length,
      browserSmokeCount: browserSmokeRecords.length,
      nonBlankSmokeCount: browserSmokeRecords.filter((record) => record.nonBlankPixels > 0).length,
      degradedSurfaceCount: Object.values(runtimeStatuses).filter((statusValue) => statusValue === 'degraded').length,
      loadedSurfaceCount: Object.values(runtimeStatuses).filter((statusValue) => statusValue === 'loaded').length,
      diagnosticCount: diagnostics.length,
      errorCount: blockingDiagnostics.length,
      frameworks: Array.from(new Set(surfaces.map((surface) => surface.framework))).sort()
    },
    boundaries: DASHBOARD_BOUNDARIES.slice(),
    dashboardFingerprint: sha256Value({
      dashboardId,
      surfaces: surfaces.map((surface) => ({
        surfaceId: surface.surfaceId,
        xtensionId: surface.xtensionId,
        role: surface.role,
        framework: surface.framework
      })),
      maracaFingerprints: maracaPlan.artifacts.map((artifact) => artifact.artifactFingerprint),
      securityFingerprint: securityReport.gateFingerprint,
      runtimeStatus: runtimeReport.status,
      smokeFingerprints: browserSmokeRecords.map((record) => sha256Value({
        surfaceId: record.surfaceId,
        kind: record.kind,
        nonBlankPixels: record.nonBlankPixels,
        interactionCount: record.interactionCount,
        cleanupVerified: record.cleanupVerified
      }))
    }),
    timestamp: timestampFromOptions(options)
  };
}

function serializeMultiFrameworkDashboardReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DASHBOARD_BOUNDARIES,
  DASHBOARD_BROWSER_SMOKE_KINDS,
  DASHBOARD_EVENT_FLOW_STAGES,
  DASHBOARD_EVENT_FLOW_TARGET_MISSING_CODE,
  DASHBOARD_FRAMEWORK_DEPENDENCY_CODE,
  DASHBOARD_NETWORK_REQUIRED_CODE,
  DASHBOARD_SMOKE_BLANK_CODE,
  DASHBOARD_SMOKE_CLEANUP_MISSING_CODE,
  DASHBOARD_SMOKE_INTERACTION_MISSING_CODE,
  DASHBOARD_SMOKE_LAZY_MISSING_CODE,
  DASHBOARD_SMOKE_SUSPEND_MISSING_CODE,
  DASHBOARD_SURFACE_MISSING_CODE,
  DASHBOARD_SURFACE_ROLES,
  XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA,
  XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA,
  XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA,
  XTENSIONS_DASHBOARD_REPORT_SCHEMA,
  XTENSIONS_DASHBOARD_SURFACE_SCHEMA,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_PACKAGE_SCRIPT,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH,
  XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE,
  assertMultiFrameworkDashboardDependencyBoundary,
  createDashboardBrowserSmokeRecord,
  createDashboardDiagnostic,
  createDashboardEventFlow,
  createXTensionsMultiFrameworkDashboardReport,
  normalizeSurface,
  serializeMultiFrameworkDashboardReport
};
