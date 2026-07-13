'use strict';

const {
  DEFAULT_CLEANUP_RESOURCES,
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
  sha256Value
} = require('./maraca-xtension-manifest');

const XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA = 'xtend.xtensions.react-host-controller-poc.v1';
const XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA = 'xtend.xtensions.react-host-controller-contract.v1';
const XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA = 'xtend.xtensions.react-scheduling-decision.v1';
const XTENSIONS_REACT_RENDER_RECORD_SCHEMA = 'xtend.xtensions.react-render-record.v1';
const XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA = 'xtend.xtensions.react-boundary-record.v1';
const XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA = 'xtend.xtensions.react-host-controller-report.v1';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH = 'tools/xtensions/react-host-controller-poc.js';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_TYPES_PATH = 'tools/xtensions/react-host-controller-poc.d.ts';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_SUITE_PATH = 'tests/xtensions/xtensions_react_host_controller_poc_suite.js';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_CONTRACT_PATH = 'development/XTensions-React-HostController-PoC-and-Scheduling-Hints-Contract.md';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH = 'tests/fixtures/xtensions/react-host-controller-poc-valid.json';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE = 'XTN-06';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_PACKAGE_SCRIPT = 'npm run test:xtensions-react-host-controller-poc';

const REACT_POC_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.react_poc.framework_dependency';
const REACT_POC_CONTEXT_LEAK_CODE = 'xtensions.react_poc.context_leak';
const REACT_POC_STORE_LEAK_CODE = 'xtensions.react_poc.store_leak';
const REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE = 'xtensions.react_poc.non_serializable_payload';
const REACT_POC_ERROR_BOUNDARY_CODE = 'xtensions.react_poc.error_boundary';
const REACT_POC_SUSPENSE_BOUNDARY_CODE = 'xtensions.react_poc.suspense_boundary';
const REACT_POC_NOT_MOUNTED_CODE = 'xtensions.react_poc.not_mounted';
const REACT_POC_ALREADY_DESTROYED_CODE = 'xtensions.react_poc.already_destroyed';
const REACT_RENDER_OUTCOME_RENDERED = 'rendered';
const REACT_RENDER_OUTCOME_BLOCKED = 'blocked';

const REACT_SCHEDULING_HINTS = Object.freeze([
  'sync-render-hint',
  'startTransition-hint',
  'idle-defer-hint',
  'suspense-placeholder-hint'
]);

const REACT_POC_BOUNDARIES = Object.freeze([
  'react-peer-runtime-is-external-opt-in',
  'no-react-imports-in-xtend-core',
  'startTransition-is-scheduling-hint-not-kernel-priority',
  'react-context-store-stays-inside-host',
  'mount-update-unmount-observable-through-hostcontroller',
  'error-and-suspense-boundaries-emit-diagnostics'
]);

const DEFAULT_REACT_CLEANUP_RESOURCES = Object.freeze([
  'react-root-stub',
  'event-listeners',
  'timers',
  'suspense-boundary',
  'error-boundary'
]);

const REACT_LEAK_KEYS = Object.freeze([
  'reactContext',
  '$reactContext',
  'ReactContext',
  'providerValue',
  'reduxStore',
  'zustandStore',
  'reactStore',
  '_owner',
  '$$typeof'
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

// Deterministic key order for report serialization and fingerprint-friendly snapshots.
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

function createReactPocDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  const diagnosticMetadata = cloneJson(metadata) || {};
  return {
    code,
    message,
    // `details` is retained as the legacy HostController diagnostic alias.
    details: diagnosticMetadata,
    schema: 'xtend.xtensions.react-host-controller-diagnostic.v1',
    source: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    severity,
    xtensionId: subject && (subject.xtensionId || subject.id) || null,
    framework: 'react',
    field: diagnosticMetadata.field || null,
    metadata: diagnosticMetadata
  };
}

function normalizeLane(lane) {
  const normalized = normalizeString(lane || 'fabric.default');
  if (!normalized) return 'fabric.default';
  return normalized;
}

function normalizePriorityHint(priorityHint) {
  return normalizeString(priorityHint || 'default') || 'default';
}

function decideReactSchedulingHint(input = {}, options = {}) {
  const operation = normalizeString(input.operation || options.operation || 'update');
  const lane = normalizeLane(input.lane || options.lane);
  const priorityHint = normalizePriorityHint(input.priorityHint || input.priority || options.priorityHint);
  const budgetMs = Number.isFinite(input.budgetMs) ? input.budgetMs : (Number.isFinite(options.budgetMs) ? options.budgetMs : 16);
  const suspense = input.suspense === true || input.suspensePending === true;
  const priorityText = `${lane} ${priorityHint}`.toLowerCase();
  let hint = 'startTransition-hint';
  let renderMode = 'transition-render';
  let reason = 'default-lane-allows-transition-hint';

  if (suspense) {
    hint = 'suspense-placeholder-hint';
    renderMode = 'degraded-placeholder-render';
    reason = 'suspense-boundary-placeholder';
  } else if (
    priorityText.includes('sync')
    || priorityText.includes('urgent')
    || priorityText.includes('immediate')
    || priorityText.includes('user-blocking')
    || priorityText.includes('input')
    || priorityText.includes('high')
  ) {
    hint = 'sync-render-hint';
    renderMode = 'sync-render';
    reason = 'interactive-lane-prefers-sync-render-hint';
  } else if (
    priorityText.includes('idle')
    || priorityText.includes('background')
    || priorityText.includes('low')
    || budgetMs <= 4
  ) {
    hint = 'idle-defer-hint';
    renderMode = 'deferred-render';
    reason = budgetMs <= 4 ? 'budget-prefers-deferral-hint' : 'background-lane-prefers-idle-deferral';
  }

  return {
    schema: XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    operation,
    lane,
    priorityHint,
    budgetMs,
    hint,
    renderMode,
    reason,
    startTransitionEligible: hint === 'startTransition-hint',
    syncRenderEligible: hint === 'sync-render-hint',
    hardKernelPriorityControl: false,
    schedulerAuthority: 'fabric-lane-budget-hint',
    timestamp: timestampFromOptions(options)
  };
}

function collectPayloadDiagnostics(value, path = 'payload', seen = new Set()) {
  const diagnostics = [];
  const valueType = typeof value;
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createReactPocDiagnostic(
      { id: 'xtension.react.poc' },
      REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `React XTension payload field "${path}" must be serializable.`,
      'error',
      { field: path, valueType }
    ));
    return diagnostics;
  }

  if (!value || valueType !== 'object') return diagnostics;
  if (seen.has(value)) {
    diagnostics.push(createReactPocDiagnostic(
      { id: 'xtension.react.poc' },
      REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `React XTension payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    return diagnostics;
  }
  seen.add(value);

  Object.keys(value).forEach((key) => {
    const childPath = `${path}.${key}`;
    if (REACT_LEAK_KEYS.includes(key)) {
      diagnostics.push(createReactPocDiagnostic(
        { id: 'xtension.react.poc' },
        key.toLowerCase().includes('store') ? REACT_POC_STORE_LEAK_CODE : REACT_POC_CONTEXT_LEAK_CODE,
        `React XTension payload must not expose host-internal React context or store field "${key}".`,
        'error',
        { field: childPath, key }
      ));
    }
    diagnostics.push(...collectPayloadDiagnostics(value[key], childPath, seen));
  });
  seen.delete(value);
  return diagnostics;
}

function inspectReactPayloadBoundary(payload = {}) {
  const diagnostics = collectPayloadDiagnostics(payload, 'payload');
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    contextBoundary: 'internal-only',
    serializable: diagnostics.every((diagnostic) => diagnostic.code !== REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE)
  };
}

function createRenderRecord(operation, decision, payload = {}, options = {}) {
  return {
    schema: XTENSIONS_REACT_RENDER_RECORD_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    xtensionId: options.xtensionId || 'xtension.react.poc',
    framework: 'react',
    operation,
    rootMode: 'frameworkless-react-root-stub',
    renderMode: decision.renderMode,
    schedulingHint: decision.hint,
    startTransitionHint: decision.hint === 'startTransition-hint',
    syncRenderHint: decision.hint === 'sync-render-hint',
    hardKernelPriorityControl: false,
    contextBoundary: 'internal-only',
    payloadFingerprint: sha256Value(payload || {}),
    timestamp: timestampFromOptions(options)
  };
}

function createBoundaryRecord(kind, status, diagnostics = [], options = {}) {
  return {
    schema: XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    kind,
    status,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    xtensionId: options.xtensionId || 'xtension.react.poc',
    framework: 'react',
    fallback: cloneJson(options.fallback || {}),
    diagnostics: diagnostics.map(cloneJson),
    timestamp: timestampFromOptions(options)
  };
}

function createReactHostControllerPocContract(options = {}) {
  const xtensionId = options.xtensionId || 'xtension.react.todo';
  return {
    schema: XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA,
    pocSchema: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    status: 'accepted-by-XTN-06',
    framework: 'react',
    peerMode: 'external-opt-in-peer-harness',
    testMode: 'frameworkless-contract-stub',
    frameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    runtimeExecutionRequired: false,
    schedulingHints: REACT_SCHEDULING_HINTS.slice(),
    boundaries: REACT_POC_BOUNDARIES.slice(),
    staticContract: {
      schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
      id: xtensionId,
      name: options.name || 'React Todo XTension PoC',
      framework: 'react',
      version: options.version || '0.1.0-poc',
      accepts: [
        'props.update',
        'state.patch',
        'command.dispatch',
        'react.suspense.pending'
      ],
      emits: [
        'xtension.react.todo.changed.v1',
        'xtension.react.todo.submitted.v1',
        'xtension.react.boundary.error.v1',
        'xtension.react.boundary.suspense.v1'
      ],
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'react.root.lifecycle',
        'react.scheduling.hints',
        'react.error-boundary.diagnostics',
        'react.suspense.diagnostics'
      ]
    }
  };
}

function createReactRuntimeAdapterRecord(options = {}) {
  const contract = createReactHostControllerPocContract(options.contract || options);
  return normalizeRuntimeAdapterRecord({
    id: options.xtensionId || contract.staticContract.id,
    framework: 'react',
    version: options.version || contract.staticContract.version,
    entry: options.entry || {
      module: 'external-peer://react/host-controller-poc',
      exportName: 'createReactHostController',
      format: 'esm',
      dynamicImport: true
    },
    integrity: options.integrity || {
      sha256: 'sha256:react-host-controller-poc-external-peer-placeholder',
      source: 'declared'
    },
    fallback: options.fallback || {
      mode: 'native-placeholder',
      component: 'x-placeholder',
      message: 'React XTension PoC unavailable.',
      degradedStatus: 'xtension-react-poc-unavailable'
    },
    dependencies: options.dependencies || [
      {
        name: 'react',
        versionRange: '^18.0.0',
        classification: 'external-peer',
        bundled: false,
        packageIncluded: false
      },
      {
        name: 'react-dom',
        versionRange: '^18.0.0',
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
      'react.scheduling.hints'
    ],
    contract: contract.staticContract,
    source: {
      kind: 'react-host-controller-poc',
      workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE
    }
  }, { sourceKind: 'react-host-controller-poc' });
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

function createRenderedReactOutcome(payloadBoundary, decision, renderRecord) {
  return {
    kind: REACT_RENDER_OUTCOME_RENDERED,
    ok: true,
    payloadBoundary,
    decision,
    renderRecord
  };
}

function createBlockedReactOutcome(result) {
  return {
    kind: REACT_RENDER_OUTCOME_BLOCKED,
    ok: false,
    result
  };
}

function createFrameworklessReactHostControllerPoc(options = {}) {
  const contract = createReactHostControllerPocContract(options.contract || options);
  const hostId = options.hostId || 'react-host-controller-poc';
  const surfaceId = options.surfaceId || 'surface.react.poc';
  const xtensionId = options.xtensionId || contract.staticContract.id;
  const cleanupResources = options.cleanupResources || DEFAULT_REACT_CLEANUP_RESOURCES;
  const lifecycleRecords = [];
  const schedulingDecisions = [];
  const renderRecords = [];
  const boundaryRecords = [];
  const cleanupRecords = [];
  const root = {
    id: `${xtensionId}:react-root-stub`,
    mode: 'frameworkless-react-root-stub',
    mounted: false,
    renderCount: 0,
    internalContextKeys: ['theme', 'actions'],
    externalContextExposed: false
  };
  const state = {
    mounted: false,
    suspended: false,
    destroyed: false,
    props: {},
    lastSignal: null
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
    const diagnostic = createReactPocDiagnostic({ id: xtensionId }, code, message, 'error', { operation });
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return createResult(operation, 'failed', hostId, surfaceId, lifecycleRecord, {}, [diagnostic], [], options);
  }

  function render(operation, payload = {}, renderOptions = {}) {
    const payloadBoundary = inspectReactPayloadBoundary(payload);
    if (!payloadBoundary.ok) {
      const lifecycleRecord = pushLifecycle(operation, 'failed', { reason: 'react-boundary-leak' }, payloadBoundary.diagnostics);
      return createBlockedReactOutcome(createResult(operation, 'failed', hostId, surfaceId, lifecycleRecord, {
        contextBoundary: 'internal-only',
        payloadBoundary
      }, payloadBoundary.diagnostics, [], options));
    }

    const decision = decideReactSchedulingHint({
      operation,
      lane: renderOptions.lane || payload.lane,
      priorityHint: renderOptions.priorityHint || payload.priorityHint,
      budgetMs: renderOptions.budgetMs,
      suspense: renderOptions.suspense === true || payload.suspensePending === true
    }, options);
    schedulingDecisions.push(decision);
    const renderRecord = createRenderRecord(operation, decision, payload, {
      hostId,
      surfaceId,
      xtensionId,
      clock: options.clock
    });
    root.renderCount += 1;
    renderRecords.push(renderRecord);
    return createRenderedReactOutcome(payloadBoundary, decision, renderRecord);
  }

  return {
    schema: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    id: hostId,
    framework: 'react',
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
        return blocked('mount', REACT_POC_ALREADY_DESTROYED_CODE, 'React HostController PoC has already been destroyed.');
      }
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return createResult('mount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-mounted' }, [], [], options);
      }
      const rendered = render('mount', initialProps, mountOptions);
      if (rendered.kind === REACT_RENDER_OUTCOME_BLOCKED) return rendered.result;
      state.mounted = true;
      state.suspended = false;
      state.props = cloneJson(initialProps) || {};
      root.mounted = true;
      const lifecycleRecord = pushLifecycle('mount', 'ok', {
        containerId: mountOptions.containerId || container.id || 'anonymous-react-host-container',
        renderRecord: rendered.renderRecord
      });
      return createResult('mount', 'ok', hostId, surfaceId, lifecycleRecord, {
        root: cloneJson(root),
        schedulingDecision: rendered.decision,
        renderRecord: rendered.renderRecord,
        contextBoundary: 'internal-only'
      }, [], [], options);
    },

    update(signal = {}) {
      if (state.destroyed) {
        return blocked('update', REACT_POC_ALREADY_DESTROYED_CODE, 'React HostController PoC has already been destroyed.');
      }
      if (!state.mounted) {
        return blocked('update', REACT_POC_NOT_MOUNTED_CODE, 'React HostController PoC is not mounted.');
      }
      if (state.suspended) {
        const lifecycleRecord = pushLifecycle('update', 'skipped', { reason: 'suspended' });
        return createResult('update', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'suspended' }, [], [], options);
      }

      const payload = signal.payload || signal.props || {};
      const rendered = render('update', payload, signal);
      if (rendered.kind === REACT_RENDER_OUTCOME_BLOCKED) return rendered.result;
      state.lastSignal = cloneJson(signal) || {};
      if (payload.suspensePending === true) {
        const diagnostic = createReactPocDiagnostic(
          { id: xtensionId },
          REACT_POC_SUSPENSE_BOUNDARY_CODE,
          'React HostController PoC observed a Suspense boundary fallback.',
          'warning',
          { field: 'payload.suspensePending' }
        );
        const boundaryRecord = createBoundaryRecord('suspense', 'degraded', [diagnostic], {
          hostId,
          surfaceId,
          xtensionId,
          fallback: { mode: 'native-placeholder', reason: 'suspense-pending' },
          clock: options.clock
        });
        boundaryRecords.push(boundaryRecord);
        const lifecycleRecord = pushLifecycle('update', 'degraded', {
          renderRecord: rendered.renderRecord,
          boundaryRecord
        }, [diagnostic]);
        return createResult('update', 'degraded', hostId, surfaceId, lifecycleRecord, {
          schedulingDecision: rendered.decision,
          renderRecord: rendered.renderRecord,
          boundaryRecord
        }, [diagnostic], [], options);
      }

      const lifecycleRecord = pushLifecycle('update', 'ok', { renderRecord: rendered.renderRecord });
      return createResult('update', 'ok', hostId, surfaceId, lifecycleRecord, {
        schedulingDecision: rendered.decision,
        renderRecord: rendered.renderRecord,
        contextBoundary: 'internal-only'
      }, [], [], options);
    },

    suspend(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) {
        return blocked('suspend', state.destroyed ? REACT_POC_ALREADY_DESTROYED_CODE : REACT_POC_NOT_MOUNTED_CODE, 'React HostController PoC cannot suspend unless mounted.');
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
        return blocked('resume', state.destroyed ? REACT_POC_ALREADY_DESTROYED_CODE : REACT_POC_NOT_MOUNTED_CODE, 'React HostController PoC cannot resume unless mounted.');
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
      const diagnostic = createReactPocDiagnostic(
        { id: xtensionId },
        REACT_POC_ERROR_BOUNDARY_CODE,
        error && error.message ? error.message : 'React HostController PoC error boundary captured an error.',
        'error',
        {
          name: error && error.name || 'Error',
          metadata
        }
      );
      const boundaryRecord = createBoundaryRecord('error', 'degraded', [diagnostic], {
        hostId,
        surfaceId,
        xtensionId,
        fallback: { mode: 'host-error-boundary', reason: 'error-captured' },
        clock: options.clock
      });
      boundaryRecords.push(boundaryRecord);
      const lifecycleRecord = pushLifecycle('reportError', 'degraded', { boundaryRecord }, [diagnostic]);
      return createResult('reportError', 'degraded', hostId, surfaceId, lifecycleRecord, {
        boundaryRecord
      }, [diagnostic], [], options);
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason: 'already-destroyed' });
        return createResult('unmount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-destroyed' }, [], [], options);
      }
      if (!state.mounted) {
        return blocked('unmount', REACT_POC_NOT_MOUNTED_CODE, 'React HostController PoC is not mounted.');
      }
      state.mounted = false;
      state.suspended = false;
      state.destroyed = true;
      root.mounted = false;
      cleanupResources.forEach((resource, index) => {
        cleanupRecords.push(createHostResourceCleanupRecord({
          hostId,
          surfaceId,
          xtensionId,
          resource,
          sequence: index + 1,
          timestamp: timestampFromOptions(options)
        }));
      });
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources: cleanupResources.slice() });
      return createResult('unmount', 'ok', hostId, surfaceId, lifecycleRecord, {
        reason,
        root: cloneJson(root)
      }, [], cleanupRecords, options);
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.react-host-controller-snapshot.v1',
        hostId,
        surfaceId,
        xtensionId,
        framework: 'react',
        state: cloneJson(state),
        root: cloneJson(root),
        schedulingDecisionCount: schedulingDecisions.length,
        renderRecordCount: renderRecords.length,
        boundaryRecordCount: boundaryRecords.length,
        cleanupCount: cleanupRecords.length,
        reactContextExternalized: false
      };
    },

    getLifecycleRecords() {
      return lifecycleRecords.map(cloneJson);
    },

    getSchedulingDecisions() {
      return schedulingDecisions.map(cloneJson);
    },

    getRenderRecords() {
      return renderRecords.map(cloneJson);
    },

    getBoundaryRecords() {
      return boundaryRecords.map(cloneJson);
    },

    getCleanupRecords() {
      return cleanupRecords.map(cloneJson);
    }
  };
}

function assertReactPocDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      code: REACT_POC_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createReactHostControllerPocReport(input = {}, options = {}) {
  const contract = createReactHostControllerPocContract(input.contract || input);
  const adapter = createReactRuntimeAdapterRecord(input.adapter || {
    xtensionId: contract.staticContract.id,
    version: contract.staticContract.version
  });
  const runtimeInput = {
    host: input.host || {
      hostId: 'react-poc-host',
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'react.scheduling.hints'
      ],
      providedFrameworks: [
        { name: 'react', version: '18.3.1', source: 'external-peer-harness', available: true },
        { name: 'react-dom', version: '18.3.1', source: 'external-peer-harness', available: true }
      ]
    },
    adapters: [adapter],
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: 'surface.react.poc' }
    ]
  };
  const runtimeRegistry = createXTensionsRuntimeCapabilityRegistry(runtimeInput, options);
  const runtimeReport = createXTensionsRuntimeReport({
    registry: runtimeRegistry,
    requests: runtimeInput.requests
  }, options);
  const hostController = createFrameworklessReactHostControllerPoc({
    xtensionId: contract.staticContract.id,
    hostId: input.hostControllerId || 'react-host-controller-poc',
    surfaceId: input.surfaceId || 'surface.react.poc',
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

  const dependencyBoundary = assertReactPocDependencyBoundary(input);
  const diagnostics = dependencyBoundary.diagnostics
    .concat(runtimeReport.diagnostics || [])
    .concat(operationResults.flatMap((result) => result.diagnostics || []));
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error' || diagnostic.code === REACT_POC_FRAMEWORK_DEPENDENCY_CODE);

  return {
    schema: XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA,
    pocSchema: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    contractSchema: XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA,
    schedulingDecisionSchema: XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA,
    renderRecordSchema: XTENSIONS_REACT_RENDER_RECORD_SCHEMA,
    boundaryRecordSchema: XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    ok: blockingDiagnostics.length === 0,
    status: blockingDiagnostics.length === 0 ? (runtimeReport.status === 'degraded' ? 'degraded' : 'ready') : 'blocked',
    framework: 'react',
    runtimeExecutionRequired: false,
    reactRuntimeImported: false,
    contract,
    adapter,
    runtimeRegistry,
    runtimeReport,
    operationResults,
    snapshot: hostController.snapshot(),
    lifecycleRecords: hostController.getLifecycleRecords(),
    schedulingDecisions: hostController.getSchedulingDecisions(),
    renderRecords: hostController.getRenderRecords(),
    boundaryRecords: hostController.getBoundaryRecords(),
    cleanupRecords: hostController.getCleanupRecords(),
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeReactHostControllerPocReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DEFAULT_REACT_CLEANUP_RESOURCES,
  REACT_LEAK_KEYS,
  REACT_POC_ALREADY_DESTROYED_CODE,
  REACT_POC_BOUNDARIES,
  REACT_POC_CONTEXT_LEAK_CODE,
  REACT_POC_ERROR_BOUNDARY_CODE,
  REACT_POC_FRAMEWORK_DEPENDENCY_CODE,
  REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  REACT_POC_NOT_MOUNTED_CODE,
  REACT_POC_STORE_LEAK_CODE,
  REACT_POC_SUSPENSE_BOUNDARY_CODE,
  REACT_SCHEDULING_HINTS,
  XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_CONTRACT_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_FIXTURE_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_MODULE_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_PACKAGE_SCRIPT,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_SUITE_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_TYPES_PATH,
  XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
  XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA,
  XTENSIONS_REACT_RENDER_RECORD_SCHEMA,
  XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA,
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
  assertReactPocDependencyBoundary,
  createFrameworklessReactHostControllerPoc,
  createReactHostControllerPocContract,
  createReactHostControllerPocReport,
  createReactPocDiagnostic,
  createReactRuntimeAdapterRecord,
  decideReactSchedulingHint,
  inspectReactPayloadBoundary,
  resolveHostResourceCleanupSchema,
  serializeReactHostControllerPocReport
};
