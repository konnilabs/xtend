'use strict';

const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
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
  XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA,
  XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA,
  XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
  XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
  VUE_UPDATE_ADAPTER_KINDS,
  assertVuePocDependencyBoundary,
  createFrameworklessVueHostControllerPoc,
  createVuePocDiagnostic,
  createVueUpdateAdapterRecord,
  inspectVuePayloadBoundary,
  normalizeVueSurfaceEvent
} = require('./vue-host-controller-poc');
const {
  sha256Value
} = require('./maraca-xtension-manifest');

const XTENSIONS_VUE_ADAPTER_SCHEMA = 'xtend.xtensions.vue-adapter.v1';
const XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA = 'xtend.xtensions.vue-runtime-boundary.v1';
const XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA = 'xtend.xtensions.vue-adapter-report.v1';
const XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.vue-adapter-diagnostic.v1';
const XTENSIONS_VUE_ADAPTER_MODULE_PATH = 'tools/xtensions/vue-host-adapter.js';
const XTENSIONS_VUE_ADAPTER_TYPES_PATH = 'tools/xtensions/vue-host-adapter.d.ts';
const XTENSIONS_VUE_ADAPTER_SUITE_PATH = 'tests/xtensions/xtensions_vue_host_adapter_suite.js';
const XTENSIONS_VUE_ADAPTER_FIXTURE_PATH = 'tests/fixtures/xtensions/vue-host-adapter-valid.json';
const XTENSIONS_VUE_ADAPTER_CONTRACT_PATH = 'development/XTensions-Vue-Host-Adapter-Contract.md';
const XTENSIONS_VUE_ADAPTER_WORKPACKAGE = 'XTN-19';
const XTENSIONS_VUE_ADAPTER_PACKAGE_SCRIPT = 'npm run test:xtensions-vue-host-adapter';

const VUE_ADAPTER_RUNTIME_BOUNDARY_CODE = 'xtensions.vue.runtime_boundary';
const VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE = 'xtensions.vue.host_runtime_missing';

const VUE_ADAPTER_CAPABILITIES = Object.freeze([
  'vue.app.lifecycle',
  'vue.explicit-update-adapter',
  'vue.event-normalization',
  'host.lifecycle.mount',
  'host.lifecycle.update',
  'host.lifecycle.suspend',
  'host.lifecycle.resume',
  'host.lifecycle.unmount',
  'signal.downstream',
  'event.upstream',
  'loading.dynamic-import',
  'fallback.native-placeholder',
  'scheduler.hints',
  'dom.boundary.host-owned-container',
  'style.boundary.host-css-owned'
]);

const VUE_HOST_PROVIDED_DEPENDENCIES = Object.freeze([
  Object.freeze({
    name: 'vue',
    versionRange: '^3.5.0',
    classification: 'host-provided',
    bundled: false,
    packageIncluded: false
  })
]);

const VUE_RUNTIME_PROVIDER_MODULES = Object.freeze([
  '/dist/xtensions/frameworks/vue/index.mjs'
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

function createVueAdapterDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_VUE_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && (subject.id || subject.xtensionId) || null,
    framework: 'vue',
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeDependency(dependency = {}) {
  const source = dependency && typeof dependency === 'object' ? dependency : {};
  return {
    name: normalizeString(source.name || source.package),
    versionRange: normalizeString(source.versionRange || source.version || source.range),
    classification: normalizeString(source.classification || source.kind || 'host-provided') || 'host-provided',
    bundled: source.bundled === true || source.vendored === true,
    packageIncluded: source.packageIncluded === true || source.rootDependency === true
  };
}

function normalizeRuntimeProvider(provider = {}) {
  const source = provider && typeof provider === 'object' ? provider : {};
  return {
    mode: normalizeString(source.mode || 'host-provided-local'),
    framework: 'vue',
    modules: toArray(source.modules || VUE_RUNTIME_PROVIDER_MODULES).map(normalizeString).filter(Boolean),
    bundledInXtension: source.bundledInXtension === true,
    remoteAllowed: source.remoteAllowed === true,
    evidence: normalizeString(source.evidence || 'local-runtime-provider')
  };
}

function normalizeVueRuntimeBoundary(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const dependencies = (source.dependencies ? toArray(source.dependencies) : VUE_HOST_PROVIDED_DEPENDENCIES)
    .map(normalizeDependency)
    .filter((dependency) => dependency.name);
  const runtimeProvider = normalizeRuntimeProvider(source.runtimeProvider || source.provider);
  const diagnostics = [];

  dependencies.forEach((dependency) => {
    if (!['host-provided', 'external-peer'].includes(dependency.classification) || dependency.bundled || dependency.packageIncluded) {
      diagnostics.push(createVueAdapterDiagnostic(
        { id: source.xtensionId || source.id || 'xtension.vue.adapter' },
        VUE_ADAPTER_RUNTIME_BOUNDARY_CODE,
        `Vue runtime dependency "${dependency.name}" must be host-provided/external-peer and excluded from the XTension bundle.`,
        'error',
        { field: 'dependencies', dependency }
      ));
    }
  });

  if (runtimeProvider.mode !== 'host-provided-local' || runtimeProvider.modules.length < 1 || runtimeProvider.remoteAllowed || runtimeProvider.bundledInXtension) {
    diagnostics.push(createVueAdapterDiagnostic(
      { id: source.xtensionId || source.id || 'xtension.vue.adapter' },
      VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE,
      'Vue adapter requires a local host-provided Vue runtime provider module.',
      'error',
      { field: 'runtimeProvider', runtimeProvider }
    ));
  }

  return {
    schema: XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
    runtimeClass: 'vue',
    dependencyClassification: 'host-provided',
    dependencies,
    runtimeProvider,
    hostProvided: true,
    bundledInXtension: false,
    remoteArtifactsAllowed: false,
    domBoundary: 'host-owned-container',
    styleBoundary: 'host-css-owned',
    sameRealmHardSecurity: false,
    explicitUpdateAdapterRequired: true,
    globalPropertiesPatchAllowed: false,
    proxyRefStoreBoundary: 'internal-only',
    capabilities: VUE_ADAPTER_CAPABILITIES.slice(),
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

function createVueAdapterContract(options = {}) {
  const runtimeBoundary = normalizeVueRuntimeBoundary(options.runtimeBoundary || options);
  return {
    schema: XTENSIONS_VUE_ADAPTER_SCHEMA,
    pocCompatibilitySchema: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    vueHostControllerContractSchema: XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA,
    updateAdapterRecordSchema: XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA,
    eventRecordSchema: XTENSIONS_VUE_EVENT_RECORD_SCHEMA,
    boundaryRecordSchema: XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
    status: 'accepted-by-XTN-19',
    framework: 'vue',
    hostNeutral: true,
    runtimeStrategy: 'external-peer-host-provided',
    runtimeBoundary,
    capabilities: VUE_ADAPTER_CAPABILITIES.slice(),
    requiredMethods: ['mount', 'update', 'suspend', 'resume', 'reportError', 'unmount', 'snapshot'],
    updatePolicy: {
      allowedAdapters: VUE_UPDATE_ADAPTER_KINDS.slice(),
      explicitUpdateAdapterRequired: true,
      globalPropertiesPatchAllowed: false,
      proxyRefStoreLeaksAllowed: false,
      surfaceEventsNormalized: true
    }
  };
}

function createVueRuntimeAdapterRecord(input = {}, options = {}) {
  const runtimeBoundary = normalizeVueRuntimeBoundary(input.runtimeBoundary || {});
  return normalizeRuntimeAdapterRecord({
    id: input.id || input.xtensionId || 'xtension.vue.host-adapter',
    framework: 'vue',
    version: input.version || '0.0.0-contract',
    status: runtimeBoundary.ok ? 'ready' : 'blocked',
    entry: input.entry || {
      module: './xtensions/vue-host-adapter',
      exportName: 'createVueHostAdapter',
      dynamicImport: true
    },
    integrity: input.integrity || {
      sha256: sha256Value({
        schema: XTENSIONS_VUE_ADAPTER_SCHEMA,
        id: input.id || input.xtensionId || 'xtension.vue.host-adapter',
        version: input.version || '0.0.0-contract'
      }),
      source: 'contract-adapter'
    },
    dependencies: runtimeBoundary.dependencies,
    requiredHostCapabilities: VUE_ADAPTER_CAPABILITIES,
    contract: {
      schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
      id: input.id || input.xtensionId || 'xtension.vue.host-adapter',
      framework: 'vue',
      version: input.version || '0.0.0-contract',
      hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
      accepts: input.accepts || ['vue.adapter.props'],
      emits: input.emits || ['vue.adapter.lifecycle'],
      capabilities: VUE_ADAPTER_CAPABILITIES
    },
    policy: {
      scope: 'host-provided-runtime',
      fallbackRequired: true,
      remoteArtifactsAllowed: false
    },
    fallback: input.fallback || {
      mode: 'native-placeholder',
      message: 'Vue host runtime unavailable'
    },
    source: {
      kind: 'contract-adapter',
      path: XTENSIONS_VUE_ADAPTER_MODULE_PATH
    }
  }, options);
}

function createBlockedResult(operation, diagnostics, options = {}) {
  const lifecycleRecord = createLifecycleRecord(operation, operation === 'mount' ? 'surface:blocked' : 'surface:error', {
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    status: 'policy-blocked',
    phase: 'degraded',
    diagnostics
  });
  return normalizeHostControllerResult(operation, {
    status: 'policy-blocked',
    lifecycleRecord,
    diagnostics,
    metadata: {
      adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA
    }
  }, options);
}

function createVueHostAdapter(options = {}) {
  const hostId = options.hostId || 'vue-host-adapter';
  const surfaceId = options.surfaceId || options.id || 'surface.vue.adapter';
  const delegate = createFrameworklessVueHostControllerPoc({
    ...options,
    hostId,
    surfaceId,
    xtensionId: options.xtensionId || options.id || 'xtension.vue.host-adapter'
  });

  function runtimeBoundaryFor(input = {}) {
    return normalizeVueRuntimeBoundary(input.runtimeBoundary || options.runtimeBoundary || {});
  }

  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
    framework: 'vue',
    mount(target = {}, initialProps = {}, mountOptions = {}) {
      const runtimeBoundary = runtimeBoundaryFor(mountOptions);
      if (!runtimeBoundary.ok) return createBlockedResult('mount', runtimeBoundary.diagnostics, { hostId, surfaceId, clock: options.clock });
      return delegate.mount(target, initialProps, {
        ...mountOptions,
        runtimeBoundary
      });
    },
    update(signal = {}) {
      return delegate.update(signal);
    },
    suspend(reason = 'host-policy') {
      return delegate.suspend(reason);
    },
    resume(reason = 'host-policy') {
      return delegate.resume(reason);
    },
    reportError(error, metadata = {}) {
      return delegate.reportError(error, {
        ...metadata,
        adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA
      });
    },
    unmount(reason = 'host-dispose') {
      return delegate.unmount(reason);
    },
    emit(event = {}) {
      return delegate.emit(event);
    },
    snapshot() {
      return {
        ...delegate.snapshot(),
        adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA,
        runtimeBoundary: runtimeBoundaryFor({})
      };
    },
    getLifecycleRecords() {
      return delegate.getLifecycleRecords();
    },
    getUpdateRecords() {
      return delegate.getUpdateRecords();
    },
    getEventRecords() {
      return delegate.getEventRecords();
    },
    getBoundaryRecords() {
      return delegate.getBoundaryRecords();
    },
    getCleanupRecords() {
      return delegate.getCleanupRecords();
    }
  };
}

function createVueAdapterReport(input = {}, options = {}) {
  const runtimeBoundary = normalizeVueRuntimeBoundary(input.runtimeBoundary || {});
  const dependencyBoundary = assertVuePocDependencyBoundary(input.dependencyBoundary || input);
  const adapter = createVueRuntimeAdapterRecord(input.adapter || input, options);
  const runtimeRegistry = createXTensionsRuntimeCapabilityRegistry({
    host: {
      id: input.hostId || 'vue-host-adapter-gate',
      capabilities: VUE_ADAPTER_CAPABILITIES,
      providedFrameworks: [
        { name: 'vue', version: '3.5.0', source: 'host-provided-local', available: runtimeBoundary.ok }
      ]
    },
    adapters: [adapter],
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: input.surfaceId || 'surface.vue.adapter' }
    ]
  }, options);
  const runtimeReport = createXTensionsRuntimeReport({
    registry: runtimeRegistry,
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: input.surfaceId || 'surface.vue.adapter' }
    ]
  }, options);
  const updateRecord = createVueUpdateAdapterRecord(input.updateAdapter || 'applyPropsUpdate', input.payload || {}, {
    ...options,
    xtensionId: input.id || input.xtensionId || 'xtension.vue.host-adapter'
  });
  const normalizedEvent = normalizeVueSurfaceEvent(input.event || {
    type: 'vue.adapter.lifecycle',
    payload: { status: 'ready' }
  }, options);
  const payloadBoundary = inspectVuePayloadBoundary(input.payload || {});
  const diagnostics = runtimeBoundary.diagnostics
    .concat(dependencyBoundary.diagnostics || [])
    .concat(runtimeReport.diagnostics || [])
    .concat(updateRecord.diagnostics || [])
    .concat(normalizedEvent.diagnostics || [])
    .concat(payloadBoundary.diagnostics || []);
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');

  return {
    schema: XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA,
    pocCompatibilitySchema: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
    generatedAt: timestampFromOptions(options),
    framework: 'vue',
    runtimeExecutionRequired: false,
    runtimeBoundary,
    dependencyBoundary,
    adapter,
    runtimeRegistry,
    runtimeReport,
    updateRecord,
    normalizedEvent,
    payloadBoundary,
    reportFingerprint: sha256Value({
      adapterSchema: XTENSIONS_VUE_ADAPTER_SCHEMA,
      runtimeBoundary,
      dependencyBoundaryOk: dependencyBoundary.ok,
      updateAdapter: updateRecord.kind
    }),
    diagnostics,
    ok: blockingDiagnostics.length === 0
  };
}

function serializeVueAdapterReport(report = {}) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function printVueHostAdapterReport(report = {}) {
  console.log(serializeVueAdapterReport(report));
}

module.exports = {
  VUE_ADAPTER_CAPABILITIES,
  VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE,
  VUE_ADAPTER_RUNTIME_BOUNDARY_CODE,
  VUE_HOST_PROVIDED_DEPENDENCIES,
  VUE_RUNTIME_PROVIDER_MODULES,
  XTENSIONS_VUE_ADAPTER_CONTRACT_PATH,
  XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA,
  XTENSIONS_VUE_ADAPTER_FIXTURE_PATH,
  XTENSIONS_VUE_ADAPTER_MODULE_PATH,
  XTENSIONS_VUE_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA,
  XTENSIONS_VUE_ADAPTER_SCHEMA,
  XTENSIONS_VUE_ADAPTER_SUITE_PATH,
  XTENSIONS_VUE_ADAPTER_TYPES_PATH,
  XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
  XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
  createVueAdapterContract,
  createVueAdapterDiagnostic,
  createVueAdapterReport,
  createVueHostAdapter,
  createVuePocDiagnostic,
  createVueRuntimeAdapterRecord,
  inspectVuePayloadBoundary,
  normalizeVueRuntimeBoundary,
  printVueHostAdapterReport,
  serializeVueAdapterReport
};
