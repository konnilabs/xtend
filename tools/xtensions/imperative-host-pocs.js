'use strict';

const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  assertNoFrameworkDependencies,
  createLifecycleRecord,
  normalizeHostControllerResult
} = require('./host-controller-contract');
const {
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
  createHostResourceCleanupRecord,
  resolveHostResourceCleanupSchema
} = require('./host-resource-cleanup-record');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  createXTensionsRuntimeCapabilityRegistry,
  createXTensionsRuntimeReport,
  normalizeRuntimeAdapterRecord
} = require('./runtime-capability-registry');
const {
  XTENSIONS_STATIC_CONTRACT_SCHEMA
} = require('./static-contract-introspection');
const {
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');
const {
  sha256Value
} = require('./maraca-xtension-manifest');

const XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA = 'xtend.xtensions.imperative-host-pocs.v1';
const XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA = 'xtend.xtensions.imperative-host-contract.v1';
const XTENSIONS_CHART_UPDATE_RECORD_SCHEMA = 'xtend.xtensions.chart-update-record.v1';
const XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA = 'xtend.xtensions.leaflet-normalized-event.v1';
const XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA = 'xtend.xtensions.imperative-resize-record.v1';
const XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA = 'xtend.xtensions.imperative-visibility-record.v1';
const XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA = 'xtend.xtensions.imperative-host-report.v1';
const XTENSIONS_IMPERATIVE_HOST_POCS_MODULE_PATH = 'tools/xtensions/imperative-host-pocs.js';
const XTENSIONS_IMPERATIVE_HOST_POCS_TYPES_PATH = 'tools/xtensions/imperative-host-pocs.d.ts';
const XTENSIONS_IMPERATIVE_HOST_POCS_SUITE_PATH = 'tests/xtensions/xtensions_imperative_host_pocs_suite.js';
const XTENSIONS_IMPERATIVE_HOST_POCS_CONTRACT_PATH = 'development/XTensions-Chart-Leaflet-Imperative-Host-PoCs-Contract.md';
const XTENSIONS_IMPERATIVE_HOST_POCS_FIXTURE_PATH = 'tests/fixtures/xtensions/imperative-host-pocs-valid.json';
const XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE = 'XTN-08';
const XTENSIONS_IMPERATIVE_HOST_POCS_PACKAGE_SCRIPT = 'npm run test:xtensions-imperative-host-pocs';

const IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.imperative_poc.framework_dependency';
const IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE = 'xtensions.imperative_poc.non_serializable_payload';
const IMPERATIVE_POC_API_LEAK_CODE = 'xtensions.imperative_poc.api_leak';
const IMPERATIVE_POC_NOT_MOUNTED_CODE = 'xtensions.imperative_poc.not_mounted';
const IMPERATIVE_POC_ALREADY_DESTROYED_CODE = 'xtensions.imperative_poc.already_destroyed';
const CHART_UPDATE_MODE_UNSUPPORTED_CODE = 'xtensions.chart_poc.update_mode_unsupported';
const LEAFLET_EVENT_UNSUPPORTED_CODE = 'xtensions.leaflet_poc.event_unsupported';
const LEAFLET_EVENT_RATE_LIMIT_CODE = 'xtensions.leaflet_poc.event_rate_limited';
const IMPERATIVE_RESIZE_INVALID_CODE = 'xtensions.imperative_poc.resize_invalid';
const IMPERATIVE_VISIBILITY_INVALID_CODE = 'xtensions.imperative_poc.visibility_invalid';

const CHART_UPDATE_MODES = Object.freeze(['active', 'none']);
const LEAFLET_EVENT_TYPES = Object.freeze([
  'pan',
  'zoom',
  'layer.click',
  'marker.drag',
  'popup.open'
]);
const IMPERATIVE_VISIBILITY_STATES = Object.freeze(['visible', 'hidden']);
const IMPERATIVE_POC_BOUNDARIES = Object.freeze([
  'chart-leaflet-peer-runtimes-are-external-opt-in',
  'no-chart-leaflet-imports-in-xtend-core',
  'imperative-apis-only-through-hostcontroller',
  'chart-update-mode-is-policy-hint',
  'leaflet-events-normalized-through-fabric',
  'event-flood-is-rate-limitable-and-diagnostic',
  'resize-visibility-and-teardown-are-host-owned',
  'canvas-map-listeners-cleaned-on-unmount'
]);
const DEFAULT_CHART_CLEANUP_RESOURCES = Object.freeze([
  'chart-instance-stub',
  'canvas',
  'event-listeners',
  'resize-observer',
  'tooltip-state'
]);
const DEFAULT_LEAFLET_CLEANUP_RESOURCES = Object.freeze([
  'leaflet-map-stub',
  'map-container',
  'event-listeners',
  'layers',
  'markers',
  'popups',
  'resize-observer'
]);
const IMPERATIVE_LEAK_KEYS = Object.freeze([
  'chartInstance',
  'chart',
  'canvasElement',
  'canvas',
  'ctx',
  'renderingContext',
  'leafletMap',
  'leafletLayer',
  'leafletMarker',
  'leafletPopup',
  '_leaflet_id',
  '_map',
  'nativeEvent',
  'domEvent',
  'target'
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

function createImperativePocDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    code,
    message,
    details: cloneJson(metadata) || {},
    schema: 'xtend.xtensions.imperative-host-diagnostic.v1',
    source: XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    severity,
    xtensionId: subject && (subject.xtensionId || subject.id) || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function collectPayloadDiagnostics(value, path = 'payload', seen = new Set(), subject = {}) {
  const diagnostics = [];
  const valueType = typeof value;
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createImperativePocDiagnostic(
      subject,
      IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Imperative XTension payload field "${path}" must be serializable.`,
      'error',
      { field: path, valueType }
    ));
    return diagnostics;
  }

  if (!value || valueType !== 'object') return diagnostics;
  if (seen.has(value)) {
    diagnostics.push(createImperativePocDiagnostic(
      subject,
      IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Imperative XTension payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    return diagnostics;
  }
  seen.add(value);

  Object.keys(value).forEach((key) => {
    const childPath = `${path}.${key}`;
    if (IMPERATIVE_LEAK_KEYS.includes(key)) {
      diagnostics.push(createImperativePocDiagnostic(
        subject,
        IMPERATIVE_POC_API_LEAK_CODE,
        `Imperative XTension payload must not expose host-owned API object "${key}".`,
        'error',
        { field: childPath, key }
      ));
    }
    diagnostics.push(...collectPayloadDiagnostics(value[key], childPath, seen, subject));
  });
  seen.delete(value);
  return diagnostics;
}

function inspectImperativePayloadBoundary(payload = {}, subject = {}) {
  const diagnostics = collectPayloadDiagnostics(payload, 'payload', new Set(), subject);
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    apiBoundary: 'hostcontroller-only',
    serializable: diagnostics.every((diagnostic) => diagnostic.code !== IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE)
  };
}

function normalizeChartUpdateMode(mode) {
  const normalized = normalizeString(mode || 'none');
  return CHART_UPDATE_MODES.includes(normalized) ? normalized : '';
}

function createChartUpdateRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const mode = normalizeChartUpdateMode(source.mode || source.updateMode);
  const payload = source.payload || source.data || {};
  const subject = { id: options.xtensionId || 'xtension.chart.poc', framework: 'chart.js' };
  const payloadBoundary = inspectImperativePayloadBoundary(payload, subject);
  const diagnostics = payloadBoundary.diagnostics.slice();

  if (!mode) {
    diagnostics.push(createImperativePocDiagnostic(
      subject,
      CHART_UPDATE_MODE_UNSUPPORTED_CODE,
      'Chart.js XTension update mode must be "active" or "none".',
      'error',
      { field: 'mode', value: source.mode || source.updateMode, allowed: CHART_UPDATE_MODES.slice() }
    ));
  }

  return {
    schema: XTENSIONS_CHART_UPDATE_RECORD_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    xtensionId: subject.id,
    framework: 'chart.js',
    mode: mode || 'unsupported',
    policyHint: mode === 'active' ? 'animated-update-if-budget-allows' : 'no-animation-fast-path',
    animationAllowed: mode === 'active',
    payloadFingerprint: sha256Value(payload || {}),
    payloadSchema: source.payloadSchema || 'xtensions.chart.selection-or-dataset.v1',
    apiBoundary: 'hostcontroller-only',
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function normalizeResizeRecord(input = {}, options = {}) {
  const width = Number(input.width);
  const height = Number(input.height);
  const diagnostics = [];
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    diagnostics.push(createImperativePocDiagnostic(
      { id: options.xtensionId || 'xtension.imperative.poc', framework: options.framework || null },
      IMPERATIVE_RESIZE_INVALID_CODE,
      'Imperative XTension resize requires positive width and height.',
      'error',
      { field: 'resize', width: input.width, height: input.height }
    ));
  }
  return {
    schema: XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    xtensionId: options.xtensionId || null,
    framework: options.framework || null,
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0,
    reason: normalizeString(input.reason || 'host-resize') || 'host-resize',
    hostOwned: true,
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function normalizeVisibilityRecord(input = {}, options = {}) {
  const visibility = normalizeString(input.visibility || input.state || 'visible') || 'visible';
  const diagnostics = [];
  if (!IMPERATIVE_VISIBILITY_STATES.includes(visibility)) {
    diagnostics.push(createImperativePocDiagnostic(
      { id: options.xtensionId || 'xtension.imperative.poc', framework: options.framework || null },
      IMPERATIVE_VISIBILITY_INVALID_CODE,
      'Imperative XTension visibility must be "visible" or "hidden".',
      'error',
      { field: 'visibility', value: visibility, allowed: IMPERATIVE_VISIBILITY_STATES.slice() }
    ));
  }
  return {
    schema: XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    xtensionId: options.xtensionId || null,
    framework: options.framework || null,
    visibility: IMPERATIVE_VISIBILITY_STATES.includes(visibility) ? visibility : 'invalid',
    action: visibility === 'hidden' ? 'pause-imperative-work' : 'resume-imperative-work',
    hostOwned: true,
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function normalizeLeafletEventType(type) {
  const normalized = normalizeString(type || 'pan');
  if (LEAFLET_EVENT_TYPES.includes(normalized)) return normalized;
  if (normalized === 'layerClick') return 'layer.click';
  if (normalized === 'markerDrag') return 'marker.drag';
  if (normalized === 'popupOpen') return 'popup.open';
  return '';
}

function createLeafletEventRecord(event = {}, options = {}) {
  const type = normalizeLeafletEventType(event.type || event.name);
  const payload = event.payload || {};
  const subject = { id: options.xtensionId || 'xtension.leaflet.poc', framework: 'leaflet' };
  const payloadBoundary = inspectImperativePayloadBoundary(payload, subject);
  const diagnostics = payloadBoundary.diagnostics.slice();
  const maxEvents = Number.isFinite(event.maxEventsPerWindow) ? event.maxEventsPerWindow : (Number.isFinite(options.maxEventsPerWindow) ? options.maxEventsPerWindow : 20);
  const eventCount = Number.isFinite(event.eventCount) ? event.eventCount : 1;

  if (!type) {
    diagnostics.push(createImperativePocDiagnostic(
      subject,
      LEAFLET_EVENT_UNSUPPORTED_CODE,
      'Leaflet XTension event must be one of pan, zoom, layer.click, marker.drag or popup.open.',
      'error',
      { field: 'type', value: event.type || event.name, allowed: LEAFLET_EVENT_TYPES.slice() }
    ));
  }

  if (eventCount > maxEvents) {
    diagnostics.push(createImperativePocDiagnostic(
      subject,
      LEAFLET_EVENT_RATE_LIMIT_CODE,
      'Leaflet XTension event rate exceeds host policy window.',
      'warning',
      { field: 'eventCount', eventCount, maxEvents }
    ));
  }

  return {
    schema: XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    xtensionId: subject.id,
    framework: 'leaflet',
    owner: normalizeString(event.owner || subject.id),
    name: type ? `xtension.leaflet.${type.replace('.', '_')}.v1` : 'xtension.leaflet.unsupported.v1',
    type: type || 'unsupported',
    direction: 'upstream',
    lane: normalizeString(event.lane || options.lane || 'fabric.default') || 'fabric.default',
    trustBoundary: 'adapter-normalized',
    payload: cloneJson(payload) || {},
    payloadFingerprint: sha256Value(payload || {}),
    payloadSchema: event.payloadSchema || payloadSchemaForLeafletEvent(type),
    rateLimit: {
      maxEventsPerWindow: maxEvents,
      eventCount,
      windowMs: Number.isFinite(event.windowMs) ? event.windowMs : 1000,
      limited: eventCount > maxEvents
    },
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function payloadSchemaForLeafletEvent(type) {
  if (type === 'pan' || type === 'zoom') return 'xtensions.leaflet.viewport-event.v1';
  if (type === 'layer.click') return 'xtensions.leaflet.layer-selection-event.v1';
  if (type === 'marker.drag') return 'xtensions.leaflet.marker-drag-event.v1';
  if (type === 'popup.open') return 'xtensions.leaflet.popup-event.v1';
  return 'xtensions.leaflet.event.v1';
}

function createImperativeHostPocContract(options = {}) {
  const chartId = options.chartId || 'xtension.chart.sales';
  const leafletId = options.leafletId || 'xtension.leaflet.map';
  return {
    schema: XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA,
    pocSchema: XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    chartUpdateRecordSchema: XTENSIONS_CHART_UPDATE_RECORD_SCHEMA,
    leafletEventRecordSchema: XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA,
    resizeRecordSchema: XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA,
    visibilityRecordSchema: XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    status: 'accepted-by-XTN-08',
    peerMode: 'external-opt-in-peer-harness',
    testMode: 'frameworkless-contract-stub',
    frameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    runtimeExecutionRequired: false,
    chartUpdateModes: CHART_UPDATE_MODES.slice(),
    leafletEventTypes: LEAFLET_EVENT_TYPES.slice(),
    boundaries: IMPERATIVE_POC_BOUNDARIES.slice(),
    staticContracts: [
      {
        schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
        id: chartId,
        name: options.chartName || 'Chart.js Sales XTension PoC',
        framework: 'chart.js',
        version: options.chartVersion || '0.1.0-poc',
        accepts: ['chart.data.update', 'chart.selection.update', 'surface.resize', 'surface.visibility'],
        emits: ['xtension.chart.selection.changed.v1', 'xtension.chart.rendered.v1'],
        capabilities: [
          'host.lifecycle.mount',
          'host.lifecycle.unmount',
          'signal.downstream',
          'event.upstream',
          'loading.dynamic-import',
          'chart.update.policy',
          'imperative.resize',
          'imperative.visibility'
        ]
      },
      {
        schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
        id: leafletId,
        name: options.leafletName || 'Leaflet Map XTension PoC',
        framework: 'leaflet',
        version: options.leafletVersion || '0.1.0-poc',
        accepts: ['map.viewport.update', 'map.layers.update', 'surface.resize', 'surface.visibility'],
        emits: [
          'xtension.leaflet.pan.v1',
          'xtension.leaflet.zoom.v1',
          'xtension.leaflet.layer_click.v1',
          'xtension.leaflet.marker_drag.v1',
          'xtension.leaflet.popup_open.v1'
        ],
        capabilities: [
          'host.lifecycle.mount',
          'host.lifecycle.unmount',
          'signal.downstream',
          'event.upstream',
          'loading.dynamic-import',
          'leaflet.event-normalization',
          'event.rate-limit',
          'imperative.resize',
          'imperative.visibility'
        ]
      }
    ]
  };
}

function createChartRuntimeAdapterRecord(options = {}) {
  const contract = createImperativeHostPocContract(options.contract || options);
  const chartContract = contract.staticContracts[0];
  return normalizeRuntimeAdapterRecord({
    id: options.xtensionId || chartContract.id,
    framework: 'chart.js',
    version: options.version || chartContract.version,
    entry: options.entry || {
      module: 'external-peer://chart.js/host-controller-poc',
      exportName: 'createChartHostController',
      format: 'esm',
      dynamicImport: true
    },
    integrity: options.integrity || {
      sha256: 'sha256:chart-host-controller-poc-external-peer-placeholder',
      source: 'declared'
    },
    fallback: options.fallback || {
      mode: 'native-placeholder',
      component: 'x-placeholder',
      message: 'Chart.js XTension PoC unavailable.',
      degradedStatus: 'xtension-chart-poc-unavailable'
    },
    dependencies: options.dependencies || [
      {
        name: 'chart.js',
        versionRange: '^4.0.0',
        classification: 'external-peer',
        bundled: false,
        packageIncluded: false
      }
    ],
    requiredHostCapabilities: [
      'host.lifecycle.mount',
      'host.lifecycle.unmount',
      'signal.downstream',
      'event.upstream',
      'loading.dynamic-import',
      'chart.update.policy',
      'imperative.resize',
      'imperative.visibility'
    ],
    contract: chartContract,
    source: {
      kind: 'chart-imperative-host-poc',
      workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE
    }
  }, { sourceKind: 'chart-imperative-host-poc' });
}

function createLeafletRuntimeAdapterRecord(options = {}) {
  const contract = createImperativeHostPocContract(options.contract || options);
  const leafletContract = contract.staticContracts[1];
  return normalizeRuntimeAdapterRecord({
    id: options.xtensionId || leafletContract.id,
    framework: 'leaflet',
    version: options.version || leafletContract.version,
    entry: options.entry || {
      module: 'external-peer://leaflet/host-controller-poc',
      exportName: 'createLeafletHostController',
      format: 'esm',
      dynamicImport: true
    },
    integrity: options.integrity || {
      sha256: 'sha256:leaflet-host-controller-poc-external-peer-placeholder',
      source: 'declared'
    },
    fallback: options.fallback || {
      mode: 'native-placeholder',
      component: 'x-placeholder',
      message: 'Leaflet XTension PoC unavailable.',
      degradedStatus: 'xtension-leaflet-poc-unavailable'
    },
    dependencies: options.dependencies || [
      {
        name: 'leaflet',
        versionRange: '^1.9.0',
        classification: 'external-peer',
        bundled: false,
        packageIncluded: false
      }
    ],
    requiredHostCapabilities: [
      'host.lifecycle.mount',
      'host.lifecycle.unmount',
      'signal.downstream',
      'event.upstream',
      'loading.dynamic-import',
      'leaflet.event-normalization',
      'event.rate-limit',
      'imperative.resize',
      'imperative.visibility'
    ],
    contract: leafletContract,
    source: {
      kind: 'leaflet-imperative-host-poc',
      workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE
    }
  }, { sourceKind: 'leaflet-imperative-host-poc' });
}

function createResult(operation, status, hostId, surfaceId, lifecycleRecord, metadata = {}, diagnostics = [], cleanupRecords = [], options = {}) {
  return normalizeHostControllerResult(operation, {
    status,
    hostId,
    surfaceId,
    lifecycleRecord,
    metadata,
    diagnostics,
    cleanupRecords
  }, {
    hostId,
    surfaceId,
    clock: options.clock
  });
}

function createFrameworklessChartHostControllerPoc(options = {}) {
  const contract = createImperativeHostPocContract(options.contract || options);
  const chartContract = contract.staticContracts[0];
  const hostId = options.hostId || 'chart-host-controller-poc';
  const surfaceId = options.surfaceId || 'surface.chart.poc';
  const xtensionId = options.xtensionId || chartContract.id;
  const lifecycleRecords = [];
  const updateRecords = [];
  const resizeRecords = [];
  const visibilityRecords = [];
  const cleanupRecords = [];
  const chart = {
    id: `${xtensionId}:chart-stub`,
    mode: 'frameworkless-chart-stub',
    mounted: false,
    canvasOwnedByHost: true,
    updateCount: 0,
    lastMode: null
  };
  const state = {
    mounted: false,
    destroyed: false,
    visible: true,
    dataset: {},
    selection: null
  };
  let sequence = 0;

  function pushLifecycle(operation, status, payload = {}, diagnostics = []) {
    sequence += 1;
    const record = createLifecycleRecord(operation, null, {
      hostId,
      surfaceId,
      operation,
      status,
      sequence,
      payload,
      diagnostics,
      clock: options.clock
    });
    lifecycleRecords.push(record);
    return record;
  }

  function blocked(operation, code, message) {
    const diagnostic = createImperativePocDiagnostic({ id: xtensionId, framework: 'chart.js' }, code, message, 'error', { operation });
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return createResult(operation, 'failed', hostId, surfaceId, lifecycleRecord, {}, [diagnostic], [], options);
  }

  return {
    schema: XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
    id: hostId,
    framework: 'chart.js',
    version: chartContract.version,
    contract: chartContract,

    mount(container = {}, initialData = {}, mountOptions = {}) {
      if (state.destroyed) return blocked('mount', IMPERATIVE_POC_ALREADY_DESTROYED_CODE, 'Chart HostController PoC has already been destroyed.');
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return createResult('mount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-mounted' }, [], [], options);
      }
      const boundary = inspectImperativePayloadBoundary(initialData, { id: xtensionId, framework: 'chart.js' });
      if (!boundary.ok) {
        const lifecycleRecord = pushLifecycle('mount', 'failed', { reason: 'imperative-api-leak' }, boundary.diagnostics);
        return createResult('mount', 'failed', hostId, surfaceId, lifecycleRecord, { boundary }, boundary.diagnostics, [], options);
      }
      state.mounted = true;
      state.dataset = cloneJson(initialData) || {};
      chart.mounted = true;
      const lifecycleRecord = pushLifecycle('mount', 'ok', {
        containerId: mountOptions.containerId || container.id || 'anonymous-chart-container',
        canvasOwnedByHost: true
      });
      return createResult('mount', 'ok', hostId, surfaceId, lifecycleRecord, { chart: cloneJson(chart) }, [], [], options);
    },

    update(signal = {}) {
      if (state.destroyed) return blocked('update', IMPERATIVE_POC_ALREADY_DESTROYED_CODE, 'Chart HostController PoC has already been destroyed.');
      if (!state.mounted) return blocked('update', IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Chart HostController PoC is not mounted.');
      const record = createChartUpdateRecord({
        mode: signal.mode || signal.updateMode,
        payload: signal.payload || signal.data || signal.selection || {}
      }, {
        xtensionId,
        clock: options.clock
      });
      updateRecords.push(record);
      if (!record.ok) {
        const lifecycleRecord = pushLifecycle('update', 'failed', { updateRecord: record }, record.diagnostics);
        return createResult('update', 'failed', hostId, surfaceId, lifecycleRecord, { updateRecord: record }, record.diagnostics, [], options);
      }
      chart.updateCount += 1;
      chart.lastMode = record.mode;
      if (signal.selection) state.selection = cloneJson(signal.selection);
      if (signal.data || signal.payload) state.dataset = cloneJson(signal.data || signal.payload) || {};
      const lifecycleRecord = pushLifecycle('update', 'ok', { updateRecord: record });
      return createResult('update', 'ok', hostId, surfaceId, lifecycleRecord, {
        updateRecord: record,
        chart: cloneJson(chart)
      }, [], [], options);
    },

    resize(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('resize', state.destroyed ? IMPERATIVE_POC_ALREADY_DESTROYED_CODE : IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Chart HostController PoC cannot resize unless mounted.');
      const record = normalizeResizeRecord(input, { xtensionId, framework: 'chart.js', clock: options.clock });
      resizeRecords.push(record);
      const lifecycleRecord = pushLifecycle('resize', record.ok ? 'ok' : 'failed', { resizeRecord: record }, record.diagnostics);
      return createResult('resize', record.ok ? 'ok' : 'failed', hostId, surfaceId, lifecycleRecord, { resizeRecord: record }, record.diagnostics, [], options);
    },

    setVisibility(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('visibility', state.destroyed ? IMPERATIVE_POC_ALREADY_DESTROYED_CODE : IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Chart HostController PoC cannot set visibility unless mounted.');
      const record = normalizeVisibilityRecord(input, { xtensionId, framework: 'chart.js', clock: options.clock });
      visibilityRecords.push(record);
      if (record.ok) state.visible = record.visibility === 'visible';
      const lifecycleRecord = pushLifecycle('visibility', record.ok ? 'ok' : 'failed', { visibilityRecord: record }, record.diagnostics);
      return createResult('visibility', record.ok ? 'ok' : 'failed', hostId, surfaceId, lifecycleRecord, { visibilityRecord: record }, record.diagnostics, [], options);
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason: 'already-destroyed' });
        return createResult('unmount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-destroyed' }, [], [], options);
      }
      if (!state.mounted) return blocked('unmount', IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Chart HostController PoC is not mounted.');
      state.mounted = false;
      state.destroyed = true;
      chart.mounted = false;
      DEFAULT_CHART_CLEANUP_RESOURCES.forEach((resource, index) => {
        cleanupRecords.push(createHostResourceCleanupRecord({
          hostId,
          surfaceId,
          xtensionId,
          resource,
          sequence: index + 1,
          timestamp: timestampFromOptions(options)
        }));
      });
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources: DEFAULT_CHART_CLEANUP_RESOURCES.slice() });
      return createResult('unmount', 'ok', hostId, surfaceId, lifecycleRecord, { reason, chart: cloneJson(chart) }, [], cleanupRecords, options);
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.chart-host-controller-snapshot.v1',
        hostId,
        surfaceId,
        xtensionId,
        framework: 'chart.js',
        state: cloneJson(state),
        chart: cloneJson(chart),
        updateRecordCount: updateRecords.length,
        resizeRecordCount: resizeRecords.length,
        visibilityRecordCount: visibilityRecords.length,
        cleanupCount: cleanupRecords.length,
        imperativeApiExternalized: false
      };
    },

    getLifecycleRecords() { return lifecycleRecords.map(cloneJson); },
    getUpdateRecords() { return updateRecords.map(cloneJson); },
    getResizeRecords() { return resizeRecords.map(cloneJson); },
    getVisibilityRecords() { return visibilityRecords.map(cloneJson); },
    getCleanupRecords() { return cleanupRecords.map(cloneJson); }
  };
}

function createFrameworklessLeafletHostControllerPoc(options = {}) {
  const contract = createImperativeHostPocContract(options.contract || options);
  const leafletContract = contract.staticContracts[1];
  const hostId = options.hostId || 'leaflet-host-controller-poc';
  const surfaceId = options.surfaceId || 'surface.leaflet.poc';
  const xtensionId = options.xtensionId || leafletContract.id;
  const lifecycleRecords = [];
  const eventRecords = [];
  const resizeRecords = [];
  const visibilityRecords = [];
  const cleanupRecords = [];
  const map = {
    id: `${xtensionId}:leaflet-map-stub`,
    mode: 'frameworkless-leaflet-map-stub',
    mounted: false,
    containerOwnedByHost: true,
    eventCount: 0
  };
  const state = {
    mounted: false,
    destroyed: false,
    visible: true,
    viewport: null,
    selectedLayer: null
  };
  let sequence = 0;

  function pushLifecycle(operation, status, payload = {}, diagnostics = []) {
    sequence += 1;
    const record = createLifecycleRecord(operation, null, {
      hostId,
      surfaceId,
      operation,
      status,
      sequence,
      payload,
      diagnostics,
      clock: options.clock
    });
    lifecycleRecords.push(record);
    return record;
  }

  function blocked(operation, code, message) {
    const diagnostic = createImperativePocDiagnostic({ id: xtensionId, framework: 'leaflet' }, code, message, 'error', { operation });
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return createResult(operation, 'failed', hostId, surfaceId, lifecycleRecord, {}, [diagnostic], [], options);
  }

  return {
    schema: XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
    id: hostId,
    framework: 'leaflet',
    version: leafletContract.version,
    contract: leafletContract,

    mount(container = {}, initialViewport = {}, mountOptions = {}) {
      if (state.destroyed) return blocked('mount', IMPERATIVE_POC_ALREADY_DESTROYED_CODE, 'Leaflet HostController PoC has already been destroyed.');
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return createResult('mount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-mounted' }, [], [], options);
      }
      const boundary = inspectImperativePayloadBoundary(initialViewport, { id: xtensionId, framework: 'leaflet' });
      if (!boundary.ok) {
        const lifecycleRecord = pushLifecycle('mount', 'failed', { reason: 'imperative-api-leak' }, boundary.diagnostics);
        return createResult('mount', 'failed', hostId, surfaceId, lifecycleRecord, { boundary }, boundary.diagnostics, [], options);
      }
      state.mounted = true;
      state.viewport = cloneJson(initialViewport) || {};
      map.mounted = true;
      const lifecycleRecord = pushLifecycle('mount', 'ok', {
        containerId: mountOptions.containerId || container.id || 'anonymous-map-container',
        containerOwnedByHost: true
      });
      return createResult('mount', 'ok', hostId, surfaceId, lifecycleRecord, { map: cloneJson(map) }, [], [], options);
    },

    emit(event = {}) {
      if (!state.mounted || state.destroyed) {
        return createLeafletEventRecord(event, { xtensionId, clock: options.clock });
      }
      const record = createLeafletEventRecord(event, {
        xtensionId,
        maxEventsPerWindow: options.maxEventsPerWindow,
        clock: options.clock
      });
      eventRecords.push(record);
      map.eventCount += 1;
      if (record.type === 'pan' || record.type === 'zoom') state.viewport = cloneJson(record.payload.viewport || record.payload);
      if (record.type === 'layer.click') state.selectedLayer = cloneJson(record.payload.layer || record.payload);
      return record;
    },

    resize(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('resize', state.destroyed ? IMPERATIVE_POC_ALREADY_DESTROYED_CODE : IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Leaflet HostController PoC cannot resize unless mounted.');
      const record = normalizeResizeRecord(input, { xtensionId, framework: 'leaflet', clock: options.clock });
      resizeRecords.push(record);
      const lifecycleRecord = pushLifecycle('resize', record.ok ? 'ok' : 'failed', { resizeRecord: record }, record.diagnostics);
      return createResult('resize', record.ok ? 'ok' : 'failed', hostId, surfaceId, lifecycleRecord, { resizeRecord: record }, record.diagnostics, [], options);
    },

    setVisibility(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('visibility', state.destroyed ? IMPERATIVE_POC_ALREADY_DESTROYED_CODE : IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Leaflet HostController PoC cannot set visibility unless mounted.');
      const record = normalizeVisibilityRecord(input, { xtensionId, framework: 'leaflet', clock: options.clock });
      visibilityRecords.push(record);
      if (record.ok) state.visible = record.visibility === 'visible';
      const lifecycleRecord = pushLifecycle('visibility', record.ok ? 'ok' : 'failed', { visibilityRecord: record }, record.diagnostics);
      return createResult('visibility', record.ok ? 'ok' : 'failed', hostId, surfaceId, lifecycleRecord, { visibilityRecord: record }, record.diagnostics, [], options);
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason: 'already-destroyed' });
        return createResult('unmount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-destroyed' }, [], [], options);
      }
      if (!state.mounted) return blocked('unmount', IMPERATIVE_POC_NOT_MOUNTED_CODE, 'Leaflet HostController PoC is not mounted.');
      state.mounted = false;
      state.destroyed = true;
      map.mounted = false;
      DEFAULT_LEAFLET_CLEANUP_RESOURCES.forEach((resource, index) => {
        cleanupRecords.push(createHostResourceCleanupRecord({
          hostId,
          surfaceId,
          xtensionId,
          resource,
          sequence: index + 1,
          timestamp: timestampFromOptions(options)
        }));
      });
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources: DEFAULT_LEAFLET_CLEANUP_RESOURCES.slice() });
      return createResult('unmount', 'ok', hostId, surfaceId, lifecycleRecord, { reason, map: cloneJson(map) }, [], cleanupRecords, options);
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.leaflet-host-controller-snapshot.v1',
        hostId,
        surfaceId,
        xtensionId,
        framework: 'leaflet',
        state: cloneJson(state),
        map: cloneJson(map),
        eventRecordCount: eventRecords.length,
        resizeRecordCount: resizeRecords.length,
        visibilityRecordCount: visibilityRecords.length,
        cleanupCount: cleanupRecords.length,
        imperativeApiExternalized: false
      };
    },

    getLifecycleRecords() { return lifecycleRecords.map(cloneJson); },
    getEventRecords() { return eventRecords.map(cloneJson); },
    getResizeRecords() { return resizeRecords.map(cloneJson); },
    getVisibilityRecords() { return visibilityRecords.map(cloneJson); },
    getCleanupRecords() { return cleanupRecords.map(cloneJson); }
  };
}

function assertImperativePocDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      code: IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createImperativeHostPocReport(input = {}, options = {}) {
  const contract = createImperativeHostPocContract(input.contract || input);
  const chartAdapter = createChartRuntimeAdapterRecord(input.chart && input.chart.adapter || input.chartAdapter || {});
  const leafletAdapter = createLeafletRuntimeAdapterRecord(input.leaflet && input.leaflet.adapter || input.leafletAdapter || {});
  const runtimeInput = {
    host: input.host || {
      hostId: 'imperative-poc-host',
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'chart.update.policy',
        'leaflet.event-normalization',
        'event.rate-limit',
        'imperative.resize',
        'imperative.visibility'
      ],
      providedFrameworks: [
        { name: 'chart.js', version: '4.4.0', source: 'external-peer-harness', available: true },
        { name: 'leaflet', version: '1.9.4', source: 'external-peer-harness', available: true }
      ]
    },
    adapters: [chartAdapter, leafletAdapter],
    requests: input.requests || [
      { xtensionId: chartAdapter.xtensionId, surfaceId: 'surface.chart.poc' },
      { xtensionId: leafletAdapter.xtensionId, surfaceId: 'surface.leaflet.poc' }
    ]
  };
  const runtimeRegistry = createXTensionsRuntimeCapabilityRegistry(runtimeInput, options);
  const runtimeReport = createXTensionsRuntimeReport({ registry: runtimeRegistry, requests: runtimeInput.requests }, options);
  const chartHost = createFrameworklessChartHostControllerPoc({
    xtensionId: contract.staticContracts[0].id,
    hostId: input.chartHostId || 'chart-host-controller-poc',
    surfaceId: input.chartSurfaceId || 'surface.chart.poc',
    clock: options.clock
  });
  const leafletHost = createFrameworklessLeafletHostControllerPoc({
    xtensionId: contract.staticContracts[1].id,
    hostId: input.leafletHostId || 'leaflet-host-controller-poc',
    surfaceId: input.leafletSurfaceId || 'surface.leaflet.poc',
    maxEventsPerWindow: input.maxEventsPerWindow,
    clock: options.clock
  });
  const operationResults = [];

  toArray(input.operations).forEach((operation) => {
    if (!operation || typeof operation !== 'object') return;
    const target = normalizeString(operation.target || operation.host);
    const kind = normalizeString(operation.kind || operation.operation);
    const host = target === 'leaflet' ? leafletHost : chartHost;
    if (kind === 'mount') operationResults.push(host.mount(operation.container || {}, operation.data || operation.viewport || operation.props || {}, operation.options || operation));
    if (kind === 'update' && target !== 'leaflet') operationResults.push(chartHost.update(operation.signal || operation));
    if (kind === 'emit' && target === 'leaflet') operationResults.push(leafletHost.emit(operation.event || operation));
    if (kind === 'resize') operationResults.push(host.resize(operation));
    if (kind === 'visibility') operationResults.push(host.setVisibility(operation));
    if (kind === 'unmount') operationResults.push(host.unmount(operation.reason || 'fixture'));
  });

  const dependencyBoundary = assertImperativePocDependencyBoundary(input);
  const diagnostics = dependencyBoundary.diagnostics
    .concat(runtimeReport.diagnostics || [])
    .concat(operationResults.flatMap((result) => result.diagnostics || []));
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error' || diagnostic.code === IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE);

  return {
    schema: XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA,
    pocSchema: XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA,
    contractSchema: XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA,
    chartUpdateRecordSchema: XTENSIONS_CHART_UPDATE_RECORD_SCHEMA,
    leafletEventRecordSchema: XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA,
    resizeRecordSchema: XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA,
    visibilityRecordSchema: XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE,
    ok: blockingDiagnostics.length === 0,
    status: blockingDiagnostics.length === 0 ? (runtimeReport.status === 'degraded' ? 'degraded' : 'ready') : 'blocked',
    runtimeExecutionRequired: false,
    chartRuntimeImported: false,
    leafletRuntimeImported: false,
    contract,
    adapters: [chartAdapter, leafletAdapter],
    runtimeRegistry,
    runtimeReport,
    operationResults,
    chartSnapshot: chartHost.snapshot(),
    leafletSnapshot: leafletHost.snapshot(),
    chartUpdateRecords: chartHost.getUpdateRecords(),
    leafletEventRecords: leafletHost.getEventRecords(),
    resizeRecords: chartHost.getResizeRecords().concat(leafletHost.getResizeRecords()),
    visibilityRecords: chartHost.getVisibilityRecords().concat(leafletHost.getVisibilityRecords()),
    cleanupRecords: chartHost.getCleanupRecords().concat(leafletHost.getCleanupRecords()),
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeImperativeHostPocReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  CHART_UPDATE_MODES,
  DEFAULT_CHART_CLEANUP_RESOURCES,
  DEFAULT_LEAFLET_CLEANUP_RESOURCES,
  IMPERATIVE_LEAK_KEYS,
  IMPERATIVE_POC_API_LEAK_CODE,
  IMPERATIVE_POC_ALREADY_DESTROYED_CODE,
  IMPERATIVE_POC_BOUNDARIES,
  IMPERATIVE_POC_FRAMEWORK_DEPENDENCY_CODE,
  IMPERATIVE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  IMPERATIVE_POC_NOT_MOUNTED_CODE,
  IMPERATIVE_RESIZE_INVALID_CODE,
  IMPERATIVE_VISIBILITY_INVALID_CODE,
  LEAFLET_EVENT_RATE_LIMIT_CODE,
  LEAFLET_EVENT_TYPES,
  LEAFLET_EVENT_UNSUPPORTED_CODE,
  CHART_UPDATE_MODE_UNSUPPORTED_CODE,
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
  createImperativePocDiagnostic,
  createLeafletEventRecord,
  createLeafletRuntimeAdapterRecord,
  inspectImperativePayloadBoundary,
  normalizeResizeRecord,
  normalizeVisibilityRecord,
  resolveHostResourceCleanupSchema,
  serializeImperativeHostPocReport
};
