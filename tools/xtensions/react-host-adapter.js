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
  XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
  XTENSIONS_REACT_RENDER_RECORD_SCHEMA,
  XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA,
  assertReactPocDependencyBoundary,
  createFrameworklessReactHostControllerPoc,
  createReactPocDiagnostic,
  decideReactSchedulingHint,
  inspectReactPayloadBoundary
} = require('./react-host-controller-poc');
const {
  sha256Value
} = require('./maraca-xtension-manifest');

const {
  XTENSIONS_REACT_ADAPTER_SCHEMA,
  XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
  XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA,
  XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
  REACT_ADAPTER_RUNTIME_BOUNDARY_CODE,
  REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE,
  REACT_ADAPTER_CAPABILITIES,
  REACT_HOST_PROVIDED_DEPENDENCIES,
  REACT_RUNTIME_PROVIDER_MODULES,
  normalizeReactRuntimeBoundary,
  createReactAdapterDiagnostic
} = require('./react-runtime-boundary');

const XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA = 'xtend.xtensions.react-adapter-report.v1';
const XTENSIONS_REACT_ADAPTER_MODULE_PATH = 'tools/xtensions/react-host-adapter.js';
const XTENSIONS_REACT_ADAPTER_TYPES_PATH = 'tools/xtensions/react-host-adapter.d.ts';
const XTENSIONS_REACT_ADAPTER_SUITE_PATH = 'tests/xtensions/xtensions_react_host_adapter_suite.js';
const XTENSIONS_REACT_ADAPTER_FIXTURE_PATH = 'tests/fixtures/xtensions/react-host-adapter-valid.json';
const XTENSIONS_REACT_ADAPTER_CONTRACT_PATH = 'development/XTensions-React-Host-Adapter-Contract.md';
const XTENSIONS_REACT_ADAPTER_PACKAGE_SCRIPT = 'npm run test:xtensions-react-host-adapter';

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

function createReactAdapterContract(options = {}) {
  const runtimeBoundary = normalizeReactRuntimeBoundary(options.runtimeBoundary || options);
  return {
    schema: XTENSIONS_REACT_ADAPTER_SCHEMA,
    pocCompatibilitySchema: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    reactHostControllerContractSchema: XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA,
    schedulingDecisionSchema: XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA,
    renderRecordSchema: XTENSIONS_REACT_RENDER_RECORD_SCHEMA,
    boundaryRecordSchema: XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
    status: 'accepted-by-XTN-18',
    framework: 'react',
    hostNeutral: true,
    runtimeStrategy: 'external-peer-host-provided',
    runtimeBoundary,
    capabilities: REACT_ADAPTER_CAPABILITIES.slice(),
    requiredMethods: ['mount', 'update', 'suspend', 'resume', 'reportError', 'unmount', 'snapshot'],
    updatePolicy: {
      startTransitionAuthority: 'scheduling-hint-only',
      hardKernelPriorityControl: false,
      contextStoreFiberLeaksAllowed: false,
      errorBoundaryDiagnosticsRequired: true,
      suspenseBoundaryDiagnosticsRequired: true
    }
  };
}

function createReactRuntimeAdapterRecord(input = {}, options = {}) {
  const runtimeBoundary = normalizeReactRuntimeBoundary(input.runtimeBoundary || {});
  return normalizeRuntimeAdapterRecord({
    id: input.id || input.xtensionId || 'xtension.react.host-adapter',
    framework: 'react',
    version: input.version || '0.0.0-contract',
    status: runtimeBoundary.ok ? 'ready' : 'blocked',
    entry: input.entry || {
      module: './xtensions/react-host-adapter',
      exportName: 'createReactHostAdapter',
      dynamicImport: true
    },
    integrity: input.integrity || {
      sha256: sha256Value({
        schema: XTENSIONS_REACT_ADAPTER_SCHEMA,
        id: input.id || input.xtensionId || 'xtension.react.host-adapter',
        version: input.version || '0.0.0-contract'
      }),
      source: 'contract-adapter'
    },
    dependencies: runtimeBoundary.dependencies,
    requiredHostCapabilities: REACT_ADAPTER_CAPABILITIES,
    contract: {
      schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
      id: input.id || input.xtensionId || 'xtension.react.host-adapter',
      framework: 'react',
      version: input.version || '0.0.0-contract',
      hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
      accepts: input.accepts || ['react.adapter.props'],
      emits: input.emits || ['react.adapter.lifecycle'],
      capabilities: REACT_ADAPTER_CAPABILITIES
    },
    policy: {
      scope: 'host-provided-runtime',
      fallbackRequired: true,
      remoteArtifactsAllowed: false
    },
    fallback: input.fallback || {
      mode: 'native-placeholder',
      message: 'React host runtime unavailable'
    },
    source: {
      kind: 'contract-adapter',
      path: XTENSIONS_REACT_ADAPTER_MODULE_PATH
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
      adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA
    }
  }, options);
}

function createReactHostAdapter(options = {}) {
  const hostId = options.hostId || 'react-host-adapter';
  const surfaceId = options.surfaceId || options.id || 'surface.react.adapter';
  const delegate = createFrameworklessReactHostControllerPoc({
    ...options,
    hostId,
    surfaceId,
    xtensionId: options.xtensionId || options.id || 'xtension.react.host-adapter'
  });

  function runtimeBoundaryFor(input = {}) {
    return normalizeReactRuntimeBoundary(input.runtimeBoundary || options.runtimeBoundary || {});
  }

  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
    framework: 'react',
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
        adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA
      });
    },
    unmount(reason = 'host-dispose') {
      return delegate.unmount(reason);
    },
    snapshot() {
      return {
        ...delegate.snapshot(),
        adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA,
        runtimeBoundary: runtimeBoundaryFor({})
      };
    },
    getLifecycleRecords() {
      return delegate.getLifecycleRecords();
    },
    getSchedulingDecisions() {
      return delegate.getSchedulingDecisions();
    },
    getRenderRecords() {
      return delegate.getRenderRecords();
    },
    getBoundaryRecords() {
      return delegate.getBoundaryRecords();
    },
    getCleanupRecords() {
      return delegate.getCleanupRecords();
    }
  };
}

function createReactAdapterReport(input = {}, options = {}) {
  const runtimeBoundary = normalizeReactRuntimeBoundary(input.runtimeBoundary || {});
  const dependencyBoundary = assertReactPocDependencyBoundary(input.dependencyBoundary || input);
  const adapter = createReactRuntimeAdapterRecord(input.adapter || input, options);
  const runtimeRegistry = createXTensionsRuntimeCapabilityRegistry({
    host: {
      id: input.hostId || 'react-host-adapter-gate',
      capabilities: REACT_ADAPTER_CAPABILITIES,
      providedFrameworks: [
        { name: 'react', version: '18.3.1', source: 'host-provided-local', available: runtimeBoundary.ok },
        { name: 'react-dom', version: '18.3.1', source: 'host-provided-local', available: runtimeBoundary.ok }
      ]
    },
    adapters: [adapter],
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: input.surfaceId || 'surface.react.adapter' }
    ]
  }, options);
  const runtimeReport = createXTensionsRuntimeReport({
    registry: runtimeRegistry,
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: input.surfaceId || 'surface.react.adapter' }
    ]
  }, options);
  const schedulingDecision = decideReactSchedulingHint(input.scheduling || { operation: 'update', priorityHint: 'default' }, options);
  const payloadBoundary = inspectReactPayloadBoundary(input.payload || {});
  const diagnostics = runtimeBoundary.diagnostics
    .concat(dependencyBoundary.diagnostics || [])
    .concat(runtimeReport.diagnostics || [])
    .concat(payloadBoundary.diagnostics || []);
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');

  return {
    schema: XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA,
    pocCompatibilitySchema: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    runtimeBoundarySchema: XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
    generatedAt: timestampFromOptions(options),
    framework: 'react',
    runtimeExecutionRequired: false,
    runtimeBoundary,
    dependencyBoundary,
    adapter,
    runtimeRegistry,
    runtimeReport,
    schedulingDecision,
    payloadBoundary,
    reportFingerprint: sha256Value({
      adapterSchema: XTENSIONS_REACT_ADAPTER_SCHEMA,
      runtimeBoundary,
      dependencyBoundaryOk: dependencyBoundary.ok,
      schedulingHint: schedulingDecision.hint
    }),
    diagnostics,
    ok: blockingDiagnostics.length === 0
  };
}

function serializeReactAdapterReport(report = {}) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function printReactHostAdapterReport(report = {}) {
  console.log(serializeReactAdapterReport(report));
}

module.exports = {
  XTENSIONS_REACT_ADAPTER_CONTRACT_PATH,
  XTENSIONS_REACT_ADAPTER_FIXTURE_PATH,
  XTENSIONS_REACT_ADAPTER_MODULE_PATH,
  XTENSIONS_REACT_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA,
  XTENSIONS_REACT_ADAPTER_SUITE_PATH,
  XTENSIONS_REACT_ADAPTER_TYPES_PATH,
  REACT_ADAPTER_CAPABILITIES,
  REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE,
  REACT_ADAPTER_RUNTIME_BOUNDARY_CODE,
  REACT_HOST_PROVIDED_DEPENDENCIES,
  REACT_RUNTIME_PROVIDER_MODULES,
  XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA,
  XTENSIONS_REACT_ADAPTER_SCHEMA,
  XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
  XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
  createReactAdapterContract,
  createReactAdapterDiagnostic,
  createReactAdapterReport,
  createReactHostAdapter,
  createReactRuntimeAdapterRecord,
  inspectReactPayloadBoundary,
  normalizeReactRuntimeBoundary,
  printReactHostAdapterReport,
  serializeReactAdapterReport,
  createReactPocDiagnostic
};
