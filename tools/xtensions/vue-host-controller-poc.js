'use strict';

const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  assertNoFrameworkDependencies,
  createLifecycleRecord,
  normalizeHostControllerResult
} = require('./host-controller-contract');
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

const XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA = 'xtend.xtensions.vue-host-controller-poc.v1';
const XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA = 'xtend.xtensions.vue-host-controller-contract.v1';
const XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA = 'xtend.xtensions.vue-update-adapter-record.v1';
const XTENSIONS_VUE_EVENT_RECORD_SCHEMA = 'xtend.xtensions.vue-normalized-event.v1';
const XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA = 'xtend.xtensions.vue-boundary-record.v1';
const XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA = 'xtend.xtensions.vue-host-controller-report.v1';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH = 'tools/xtensions/vue-host-controller-poc.js';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_TYPES_PATH = 'tools/xtensions/vue-host-controller-poc.d.ts';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_SUITE_PATH = 'tests/xtensions/xtensions_vue_host_controller_poc_suite.js';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_CONTRACT_PATH = 'development/XTensions-Vue-HostController-PoC-and-Explicit-Update-Adapter-Contract.md';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH = 'tests/fixtures/xtensions/vue-host-controller-poc-valid.json';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE = 'XTN-07';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_PACKAGE_SCRIPT = 'npm run test:xtensions-vue-host-controller-poc';

const VUE_POC_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.vue_poc.framework_dependency';
const VUE_POC_PROXY_LEAK_CODE = 'xtensions.vue_poc.proxy_leak';
const VUE_POC_STORE_LEAK_CODE = 'xtensions.vue_poc.store_leak';
const VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE = 'xtensions.vue_poc.non_serializable_payload';
const VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE = 'xtensions.vue_poc.implicit_global_patch';
const VUE_POC_EVENT_PAYLOAD_INVALID_CODE = 'xtensions.vue_poc.event_payload_invalid';
const VUE_POC_NOT_MOUNTED_CODE = 'xtensions.vue_poc.not_mounted';
const VUE_POC_ALREADY_DESTROYED_CODE = 'xtensions.vue_poc.already_destroyed';

const VUE_UPDATE_ADAPTER_KINDS = Object.freeze([
  'applyPropsUpdate',
  'applyStatePatch',
  'dispatchCommand'
]);

const VUE_POC_BOUNDARIES = Object.freeze([
  'vue-peer-runtime-is-external-opt-in',
  'no-vue-imports-in-xtend-core',
  'explicit-update-adapter-required',
  'no-globalproperties-patch-contract',
  'vue-proxy-store-stays-inside-host',
  'vue-events-normalized-through-fabric'
]);

const DEFAULT_VUE_CLEANUP_RESOURCES = Object.freeze([
  'vue-app-stub',
  'event-listeners',
  'watchers',
  'timers',
  'effect-scope',
  'explicit-update-adapter'
]);

const VUE_LEAK_KEYS = Object.freeze([
  '__v_isReactive',
  '__v_isReadonly',
  '__v_isRef',
  '__v_raw',
  '_isVue',
  '$el',
  '$data',
  '$props',
  '$refs',
  '$store',
  'vuexStore',
  'pinia',
  'piniaStore',
  'reactiveState',
  'globalProperties',
  '$patch'
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

function createVuePocDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    code,
    message,
    details: cloneJson(metadata) || {},
    schema: 'xtend.xtensions.vue-host-controller-diagnostic.v1',
    source: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    severity,
    xtensionId: subject && (subject.xtensionId || subject.id) || null,
    framework: 'vue',
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function leakCodeForKey(key) {
  if (key === 'globalProperties' || key === '$patch') return VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE;
  if (key.toLowerCase().includes('store') || key === 'pinia' || key === 'piniaStore') return VUE_POC_STORE_LEAK_CODE;
  return VUE_POC_PROXY_LEAK_CODE;
}

function collectVuePayloadDiagnostics(value, path = 'payload', seen = new Set()) {
  const diagnostics = [];
  const valueType = typeof value;
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createVuePocDiagnostic(
      { id: 'xtension.vue.poc' },
      VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Vue XTension payload field "${path}" must be serializable.`,
      'error',
      { field: path, valueType }
    ));
    return diagnostics;
  }

  if (!value || valueType !== 'object') return diagnostics;
  if (seen.has(value)) {
    diagnostics.push(createVuePocDiagnostic(
      { id: 'xtension.vue.poc' },
      VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Vue XTension payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    return diagnostics;
  }
  seen.add(value);

  Object.keys(value).forEach((key) => {
    const childPath = `${path}.${key}`;
    if (VUE_LEAK_KEYS.includes(key)) {
      diagnostics.push(createVuePocDiagnostic(
        { id: 'xtension.vue.poc' },
        leakCodeForKey(key),
        `Vue XTension payload must not expose host-internal Vue proxy, store or global patch field "${key}".`,
        'error',
        { field: childPath, key }
      ));
    }
    diagnostics.push(...collectVuePayloadDiagnostics(value[key], childPath, seen));
  });
  seen.delete(value);
  return diagnostics;
}

function inspectVuePayloadBoundary(payload = {}) {
  const diagnostics = collectVuePayloadDiagnostics(payload, 'payload');
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    proxyBoundary: 'internal-only',
    serializable: diagnostics.every((diagnostic) => diagnostic.code !== VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE)
  };
}

function normalizeVueUpdateKind(kind, signal = {}) {
  const candidate = normalizeString(kind || signal.updateAdapter || signal.adapter || signal.kind || signal.operation);
  if (VUE_UPDATE_ADAPTER_KINDS.includes(candidate)) return candidate;
  if (candidate === 'props.update' || candidate === 'update-props') return 'applyPropsUpdate';
  if (candidate === 'state.patch' || candidate === 'patch-state') return 'applyStatePatch';
  if (candidate === 'command.dispatch' || candidate === 'dispatch-command') return 'dispatchCommand';
  return '';
}

function createVueUpdateAdapterRecord(kind, payload = {}, options = {}) {
  const updateKind = normalizeVueUpdateKind(kind);
  const payloadBoundary = inspectVuePayloadBoundary(payload);
  const diagnostics = payloadBoundary.diagnostics.slice();

  if (!updateKind) {
    diagnostics.push(createVuePocDiagnostic(
      { id: options.xtensionId || 'xtension.vue.poc' },
      VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE,
      'Vue XTension updates must use an explicit adapter function instead of globalProperties.$patch.',
      'error',
      { field: 'updateAdapter', allowed: VUE_UPDATE_ADAPTER_KINDS.slice() }
    ));
  }

  return {
    schema: XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    xtensionId: options.xtensionId || 'xtension.vue.poc',
    framework: 'vue',
    kind: updateKind || 'missing-explicit-update-adapter',
    adapterFunction: updateKind || null,
    payloadFingerprint: sha256Value(payload || {}),
    proxyBoundary: 'internal-only',
    globalPropertiesPatchUsed: false,
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function applyVueExplicitUpdateAdapter(currentState = {}, signal = {}, options = {}) {
  const payload = cloneJson(signal.payload || signal.props || signal.state || {}) || {};
  const updateKind = normalizeVueUpdateKind(signal.updateAdapter || signal.adapter || signal.kind || signal.operation, signal);
  const record = createVueUpdateAdapterRecord(updateKind, payload, options);
  const nextState = cloneJson(currentState || {}) || {};

  if (!record.ok) {
    return {
      ok: false,
      status: 'failed',
      state: nextState,
      record,
      diagnostics: record.diagnostics.slice()
    };
  }

  if (record.kind === 'applyPropsUpdate') {
    nextState.props = {
      ...(nextState.props || {}),
      ...payload
    };
  } else if (record.kind === 'applyStatePatch') {
    nextState.localState = {
      ...(nextState.localState || {}),
      ...payload
    };
  } else if (record.kind === 'dispatchCommand') {
    nextState.lastCommand = cloneJson(payload);
  }

  return {
    ok: true,
    status: 'ok',
    state: nextState,
    record,
    diagnostics: []
  };
}

function normalizeVueSurfaceEvent(event = {}, options = {}) {
  const rawPayload = event.payload || {};
  const payloadBoundary = inspectVuePayloadBoundary(rawPayload);
  const payload = cloneJson(rawPayload) || {};
  const diagnostics = payloadBoundary.diagnostics.map((diagnostic) => ({
    ...diagnostic,
    code: diagnostic.code === VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE ? VUE_POC_EVENT_PAYLOAD_INVALID_CODE : diagnostic.code
  }));
  const eventName = normalizeString(event.name || event.type || 'xtension.vue.event.v1');
  return {
    schema: XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    xtensionId: options.xtensionId || event.xtensionId || 'xtension.vue.poc',
    framework: 'vue',
    owner: normalizeString(event.owner || options.owner || options.xtensionId || 'xtension.vue.poc'),
    name: eventName,
    direction: 'upstream',
    lane: normalizeString(event.lane || options.lane || 'fabric.default') || 'fabric.default',
    trustBoundary: 'adapter-normalized',
    payload,
    payloadFingerprint: sha256Value(payload),
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function createVueBoundaryRecord(kind, status, diagnostics = [], options = {}) {
  return {
    schema: XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    kind,
    status,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    xtensionId: options.xtensionId || 'xtension.vue.poc',
    framework: 'vue',
    diagnostics: diagnostics.map(cloneJson),
    timestamp: timestampFromOptions(options)
  };
}

function createVueHostControllerPocContract(options = {}) {
  const xtensionId = options.xtensionId || 'xtension.vue.panel';
  return {
    schema: XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA,
    pocSchema: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    updateAdapterRecordSchema: XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
    eventRecordSchema: XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    status: 'accepted-by-XTN-07',
    framework: 'vue',
    peerMode: 'external-opt-in-peer-harness',
    testMode: 'frameworkless-contract-stub',
    frameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    runtimeExecutionRequired: false,
    updateAdapters: VUE_UPDATE_ADAPTER_KINDS.slice(),
    boundaries: VUE_POC_BOUNDARIES.slice(),
    staticContract: {
      schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
      id: xtensionId,
      name: options.name || 'Vue Panel XTension PoC',
      framework: 'vue',
      version: options.version || '0.1.0-poc',
      accepts: [
        'props.update',
        'state.patch',
        'command.dispatch'
      ],
      emits: [
        'xtension.vue.panel.changed.v1',
        'xtension.vue.panel.commanded.v1',
        'xtension.vue.boundary.error.v1'
      ],
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'vue.app.lifecycle',
        'vue.explicit-update-adapter',
        'vue.event-normalization',
        'vue.proxy-leak-diagnostics'
      ]
    }
  };
}

function createVueRuntimeAdapterRecord(options = {}) {
  const contract = createVueHostControllerPocContract(options.contract || options);
  return normalizeRuntimeAdapterRecord({
    id: options.xtensionId || contract.staticContract.id,
    framework: 'vue',
    version: options.version || contract.staticContract.version,
    entry: options.entry || {
      module: 'external-peer://vue/host-controller-poc',
      exportName: 'createVueHostController',
      format: 'esm',
      dynamicImport: true
    },
    integrity: options.integrity || {
      sha256: 'sha256:vue-host-controller-poc-external-peer-placeholder',
      source: 'declared'
    },
    fallback: options.fallback || {
      mode: 'native-placeholder',
      component: 'x-placeholder',
      message: 'Vue XTension PoC unavailable.',
      degradedStatus: 'xtension-vue-poc-unavailable'
    },
    dependencies: options.dependencies || [
      {
        name: 'vue',
        versionRange: '^3.0.0',
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
      'vue.explicit-update-adapter'
    ],
    contract: contract.staticContract,
    source: {
      kind: 'vue-host-controller-poc',
      workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE
    }
  }, { sourceKind: 'vue-host-controller-poc' });
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

function createFrameworklessVueHostControllerPoc(options = {}) {
  const contract = createVueHostControllerPocContract(options.contract || options);
  const hostId = options.hostId || 'vue-host-controller-poc';
  const surfaceId = options.surfaceId || 'surface.vue.poc';
  const xtensionId = options.xtensionId || contract.staticContract.id;
  const cleanupResources = options.cleanupResources || DEFAULT_VUE_CLEANUP_RESOURCES;
  const lifecycleRecords = [];
  const updateRecords = [];
  const eventRecords = [];
  const boundaryRecords = [];
  const cleanupRecords = [];
  const app = {
    id: `${xtensionId}:vue-app-stub`,
    mode: 'frameworkless-vue-app-stub',
    createAppCalled: false,
    mounted: false,
    unmounted: false,
    globalPropertiesPatchUsed: false,
    internalProxyKeys: ['props', 'localState', 'emit']
  };
  const state = {
    mounted: false,
    suspended: false,
    destroyed: false,
    props: {},
    localState: {},
    lastCommand: null
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
    const diagnostic = createVuePocDiagnostic({ id: xtensionId }, code, message, 'error', { operation });
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return createResult(operation, 'failed', hostId, surfaceId, lifecycleRecord, {}, [diagnostic], [], options);
  }

  return {
    schema: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    id: hostId,
    framework: 'vue',
    version: contract.staticContract.version,
    hostNeutral: true,
    contract,
    dependencyPolicy: {
      frameworkDependenciesAllowed: false,
      vendoredFrameworksAllowed: false,
      allowedTestModes: ['frameworkless-contract-stub', 'external-opt-in-peer-harness']
    },
    methods: ['mount', 'update', 'suspend', 'resume', 'reportError', 'unmount'],

    mount(container = {}, initialProps = {}, mountOptions = {}) {
      if (state.destroyed) {
        return blocked('mount', VUE_POC_ALREADY_DESTROYED_CODE, 'Vue HostController PoC has already been destroyed.');
      }
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return createResult('mount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-mounted' }, [], [], options);
      }

      const boundary = inspectVuePayloadBoundary(initialProps);
      if (!boundary.ok) {
        const lifecycleRecord = pushLifecycle('mount', 'failed', { reason: 'vue-proxy-boundary-leak' }, boundary.diagnostics);
        return createResult('mount', 'failed', hostId, surfaceId, lifecycleRecord, { boundary }, boundary.diagnostics, [], options);
      }

      state.mounted = true;
      state.suspended = false;
      state.props = cloneJson(initialProps) || {};
      app.createAppCalled = true;
      app.mounted = true;
      const lifecycleRecord = pushLifecycle('mount', 'ok', {
        containerId: mountOptions.containerId || container.id || 'anonymous-vue-host-container',
        app: cloneJson(app)
      });
      return createResult('mount', 'ok', hostId, surfaceId, lifecycleRecord, {
        app: cloneJson(app),
        proxyBoundary: 'internal-only',
        updateAdapter: 'explicit'
      }, [], [], options);
    },

    update(signal = {}) {
      if (state.destroyed) {
        return blocked('update', VUE_POC_ALREADY_DESTROYED_CODE, 'Vue HostController PoC has already been destroyed.');
      }
      if (!state.mounted) {
        return blocked('update', VUE_POC_NOT_MOUNTED_CODE, 'Vue HostController PoC is not mounted.');
      }
      if (state.suspended) {
        const lifecycleRecord = pushLifecycle('update', 'skipped', { reason: 'suspended' });
        return createResult('update', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'suspended' }, [], [], options);
      }

      const update = applyVueExplicitUpdateAdapter(state, signal, {
        hostId,
        surfaceId,
        xtensionId,
        clock: options.clock
      });
      updateRecords.push(update.record);
      if (!update.ok) {
        const boundaryRecord = createVueBoundaryRecord('update-adapter', 'failed', update.diagnostics, {
          hostId,
          surfaceId,
          xtensionId,
          clock: options.clock
        });
        boundaryRecords.push(boundaryRecord);
        const lifecycleRecord = pushLifecycle('update', 'failed', { updateRecord: update.record, boundaryRecord }, update.diagnostics);
        return createResult('update', 'failed', hostId, surfaceId, lifecycleRecord, {
          updateRecord: update.record,
          boundaryRecord
        }, update.diagnostics, [], options);
      }

      state.props = update.state.props || {};
      state.localState = update.state.localState || {};
      state.lastCommand = update.state.lastCommand || null;
      const lifecycleRecord = pushLifecycle('update', 'ok', { updateRecord: update.record });
      return createResult('update', 'ok', hostId, surfaceId, lifecycleRecord, {
        updateRecord: update.record,
        state: cloneJson(state),
        proxyBoundary: 'internal-only'
      }, [], [], options);
    },

    emit(event = {}) {
      if (!state.mounted || state.destroyed) {
        return normalizeVueSurfaceEvent({
          ...event,
          payload: event.payload || {}
        }, {
          hostId,
          surfaceId,
          xtensionId,
          owner: xtensionId,
          clock: options.clock
        });
      }
      const normalized = normalizeVueSurfaceEvent(event, {
        hostId,
        surfaceId,
        xtensionId,
        owner: xtensionId,
        clock: options.clock
      });
      eventRecords.push(normalized);
      return normalized;
    },

    suspend(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) {
        return blocked('suspend', state.destroyed ? VUE_POC_ALREADY_DESTROYED_CODE : VUE_POC_NOT_MOUNTED_CODE, 'Vue HostController PoC cannot suspend unless mounted.');
      }
      if (state.suspended) {
        const lifecycleRecord = pushLifecycle('suspend', 'skipped', { reason: 'already-suspended' });
        return createResult('suspend', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-suspended' }, [], [], options);
      }
      state.suspended = true;
      const lifecycleRecord = pushLifecycle('suspend', 'ok', { reason });
      return createResult('suspend', 'ok', hostId, surfaceId, lifecycleRecord, { reason }, [], [], options);
    },

    resume(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) {
        return blocked('resume', state.destroyed ? VUE_POC_ALREADY_DESTROYED_CODE : VUE_POC_NOT_MOUNTED_CODE, 'Vue HostController PoC cannot resume unless mounted.');
      }
      if (!state.suspended) {
        const lifecycleRecord = pushLifecycle('resume', 'skipped', { reason: 'not-suspended' });
        return createResult('resume', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'not-suspended' }, [], [], options);
      }
      state.suspended = false;
      const lifecycleRecord = pushLifecycle('resume', 'ok', { reason });
      return createResult('resume', 'ok', hostId, surfaceId, lifecycleRecord, { reason }, [], [], options);
    },

    reportError(error, metadata = {}) {
      const diagnostic = createVuePocDiagnostic(
        { id: xtensionId },
        'xtensions.vue_poc.error_boundary',
        error && error.message ? error.message : 'Vue HostController PoC captured an error.',
        'error',
        { name: error && error.name || 'Error', metadata }
      );
      const boundaryRecord = createVueBoundaryRecord('error', 'degraded', [diagnostic], {
        hostId,
        surfaceId,
        xtensionId,
        clock: options.clock
      });
      boundaryRecords.push(boundaryRecord);
      const lifecycleRecord = pushLifecycle('reportError', 'degraded', { boundaryRecord }, [diagnostic]);
      return createResult('reportError', 'degraded', hostId, surfaceId, lifecycleRecord, { boundaryRecord }, [diagnostic], [], options);
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason: 'already-destroyed' });
        return createResult('unmount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-destroyed' }, [], [], options);
      }
      if (!state.mounted) {
        return blocked('unmount', VUE_POC_NOT_MOUNTED_CODE, 'Vue HostController PoC is not mounted.');
      }
      state.mounted = false;
      state.suspended = false;
      state.destroyed = true;
      app.mounted = false;
      app.unmounted = true;
      cleanupResources.forEach((resource, index) => {
        cleanupRecords.push({
          schema: 'xtend.xtensions.vue-host-controller-cleanup-record.v1',
          hostId,
          surfaceId,
          xtensionId,
          resource,
          status: 'released',
          sequence: index + 1,
          timestamp: timestampFromOptions(options)
        });
      });
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources: cleanupResources.slice() });
      return createResult('unmount', 'ok', hostId, surfaceId, lifecycleRecord, {
        reason,
        app: cloneJson(app)
      }, [], cleanupRecords, options);
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.vue-host-controller-snapshot.v1',
        hostId,
        surfaceId,
        xtensionId,
        framework: 'vue',
        state: cloneJson(state),
        app: cloneJson(app),
        updateRecordCount: updateRecords.length,
        eventRecordCount: eventRecords.length,
        boundaryRecordCount: boundaryRecords.length,
        cleanupCount: cleanupRecords.length,
        vueProxyExternalized: false,
        globalPropertiesPatchUsed: app.globalPropertiesPatchUsed
      };
    },

    getLifecycleRecords() {
      return lifecycleRecords.map(cloneJson);
    },

    getUpdateRecords() {
      return updateRecords.map(cloneJson);
    },

    getEventRecords() {
      return eventRecords.map(cloneJson);
    },

    getBoundaryRecords() {
      return boundaryRecords.map(cloneJson);
    },

    getCleanupRecords() {
      return cleanupRecords.map(cloneJson);
    }
  };
}

function assertVuePocDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      code: VUE_POC_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createVueHostControllerPocReport(input = {}, options = {}) {
  const contract = createVueHostControllerPocContract(input.contract || input);
  const adapter = createVueRuntimeAdapterRecord(input.adapter || {
    xtensionId: contract.staticContract.id,
    version: contract.staticContract.version
  });
  const runtimeInput = {
    host: input.host || {
      hostId: 'vue-poc-host',
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'vue.explicit-update-adapter'
      ],
      providedFrameworks: [
        { name: 'vue', version: '3.5.0', source: 'external-peer-harness', available: true }
      ]
    },
    adapters: [adapter],
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: 'surface.vue.poc' }
    ]
  };
  const runtimeRegistry = createXTensionsRuntimeCapabilityRegistry(runtimeInput, options);
  const runtimeReport = createXTensionsRuntimeReport({
    registry: runtimeRegistry,
    requests: runtimeInput.requests
  }, options);
  const hostController = createFrameworklessVueHostControllerPoc({
    xtensionId: contract.staticContract.id,
    hostId: input.hostControllerId || 'vue-host-controller-poc',
    surfaceId: input.surfaceId || 'surface.vue.poc',
    clock: options.clock
  });

  const operations = toArray(input.operations);
  const operationResults = [];
  operations.forEach((operation) => {
    if (!operation || typeof operation !== 'object') return;
    const kind = normalizeString(operation.kind || operation.operation);
    if (kind === 'mount') {
      operationResults.push(hostController.mount(operation.container || {}, operation.props || {}, operation.options || operation));
    } else if (kind === 'update') {
      operationResults.push(hostController.update(operation.signal || operation));
    } else if (kind === 'emit') {
      operationResults.push(hostController.emit(operation.event || operation));
    } else if (kind === 'suspend') {
      operationResults.push(hostController.suspend(operation.reason || 'fixture'));
    } else if (kind === 'resume') {
      operationResults.push(hostController.resume(operation.reason || 'fixture'));
    } else if (kind === 'error') {
      operationResults.push(hostController.reportError(new Error(operation.message || 'fixture error'), operation.metadata || {}));
    } else if (kind === 'unmount') {
      operationResults.push(hostController.unmount(operation.reason || 'fixture'));
    }
  });

  const dependencyBoundary = assertVuePocDependencyBoundary(input);
  const diagnostics = dependencyBoundary.diagnostics
    .concat(runtimeReport.diagnostics || [])
    .concat(operationResults.flatMap((result) => result.diagnostics || []));
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error' || diagnostic.code === VUE_POC_FRAMEWORK_DEPENDENCY_CODE);

  return {
    schema: XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA,
    pocSchema: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    contractSchema: XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA,
    updateAdapterRecordSchema: XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
    eventRecordSchema: XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
    boundaryRecordSchema: XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    ok: blockingDiagnostics.length === 0,
    status: blockingDiagnostics.length === 0 ? (runtimeReport.status === 'degraded' ? 'degraded' : 'ready') : 'blocked',
    framework: 'vue',
    runtimeExecutionRequired: false,
    vueRuntimeImported: false,
    globalPropertiesPatchUsed: false,
    contract,
    adapter,
    runtimeRegistry,
    runtimeReport,
    operationResults,
    snapshot: hostController.snapshot(),
    lifecycleRecords: hostController.getLifecycleRecords(),
    updateRecords: hostController.getUpdateRecords(),
    eventRecords: hostController.getEventRecords(),
    boundaryRecords: hostController.getBoundaryRecords(),
    cleanupRecords: hostController.getCleanupRecords(),
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeVueHostControllerPocReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DEFAULT_VUE_CLEANUP_RESOURCES,
  VUE_LEAK_KEYS,
  VUE_POC_ALREADY_DESTROYED_CODE,
  VUE_POC_BOUNDARIES,
  VUE_POC_EVENT_PAYLOAD_INVALID_CODE,
  VUE_POC_FRAMEWORK_DEPENDENCY_CODE,
  VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE,
  VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  VUE_POC_NOT_MOUNTED_CODE,
  VUE_POC_PROXY_LEAK_CODE,
  VUE_POC_STORE_LEAK_CODE,
  VUE_UPDATE_ADAPTER_KINDS,
  XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA,
  XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_CONTRACT_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_FIXTURE_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_MODULE_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_PACKAGE_SCRIPT,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_SUITE_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_TYPES_PATH,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
  XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA,
  XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
  applyVueExplicitUpdateAdapter,
  assertVuePocDependencyBoundary,
  createFrameworklessVueHostControllerPoc,
  createVueHostControllerPocContract,
  createVueHostControllerPocReport,
  createVuePocDiagnostic,
  createVueRuntimeAdapterRecord,
  createVueUpdateAdapterRecord,
  inspectVuePayloadBoundary,
  normalizeVueSurfaceEvent,
  serializeVueHostControllerPocReport
};
