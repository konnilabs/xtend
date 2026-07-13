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

const XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA = 'xtend.xtensions.three-render-loop-poc.v1';
const XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA = 'xtend.xtensions.three-render-loop-contract.v1';
const XTENSIONS_THREE_FIBER_RECORD_SCHEMA = 'xtend.xtensions.three-fiber-record.v1';
const XTENSIONS_THREE_FRAME_RECORD_SCHEMA = 'xtend.xtensions.three-frame-record.v1';
const XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA = 'xtend.xtensions.three-context-loss-record.v1';
const XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA = 'xtend.xtensions.three-browser-smoke-record.v1';
const XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA = 'xtend.xtensions.three-render-loop-report.v1';
const XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH = 'tools/xtensions/three-render-loop-poc.js';
const XTENSIONS_THREE_RENDER_LOOP_POC_TYPES_PATH = 'tools/xtensions/three-render-loop-poc.d.ts';
const XTENSIONS_THREE_RENDER_LOOP_POC_SUITE_PATH = 'tests/xtensions/xtensions_three_render_loop_poc_suite.js';
const XTENSIONS_THREE_RENDER_LOOP_POC_CONTRACT_PATH = 'development/XTensions-Three-Fiber-Render-Loop-PoC-Contract.md';
const XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH = 'tests/fixtures/xtensions/three-render-loop-poc-valid.json';
const XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE = 'XTN-09';
const XTENSIONS_THREE_RENDER_LOOP_POC_PACKAGE_SCRIPT = 'npm run test:xtensions-three-render-loop-poc';

const THREE_POC_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.three_poc.framework_dependency';
const THREE_POC_FREE_RAF_LOOP_CODE = 'xtensions.three_poc.free_raf_loop';
const THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE = 'xtensions.three_poc.non_serializable_payload';
const THREE_POC_API_LEAK_CODE = 'xtensions.three_poc.api_leak';
const THREE_POC_NOT_MOUNTED_CODE = 'xtensions.three_poc.not_mounted';
const THREE_POC_ALREADY_DESTROYED_CODE = 'xtensions.three_poc.already_destroyed';
const THREE_POC_FIBER_UNREGISTERED_CODE = 'xtensions.three_poc.fiber_unregistered';
const THREE_POC_FRAME_BUDGET_INVALID_CODE = 'xtensions.three_poc.frame_budget_invalid';
const THREE_POC_BACKPRESSURE_CODE = 'xtensions.three_poc.backpressure';
const THREE_POC_CONTEXT_LOST_CODE = 'xtensions.three_poc.context_lost';
const THREE_POC_BROWSER_SMOKE_BLANK_CODE = 'xtensions.three_poc.browser_smoke_blank';
const THREE_POC_CLEANUP_INCOMPLETE_CODE = 'xtensions.three_poc.cleanup_incomplete';

const THREE_RENDER_LOOP_BOUNDARIES = Object.freeze([
  'three-peer-runtime-is-external-opt-in',
  'no-three-imports-in-xtend-core',
  'no-free-request-animation-frame-loop',
  'render-loop-is-host-registered-fiber',
  'frame-budget-and-backpressure-are-host-policy',
  'visibility-pauses-render-loop',
  'low-power-degradation-is-host-observable',
  'context-loss-is-diagnostic-and-recoverable',
  'webgl-resources-cleaned-on-unmount',
  'browser-smoke-evidence-is-recorded-without-three-runtime'
]);
const THREE_RENDER_LOOP_STATES = Object.freeze([
  'idle',
  'registered',
  'running',
  'suspended',
  'hidden',
  'context-lost',
  'destroyed'
]);
const THREE_RENDER_LOOP_LANES = Object.freeze([
  'fabric.render',
  'fabric.visible',
  'fabric.idle',
  'fabric.diagnostics'
]);
const DEFAULT_FRAME_BUDGET_MS = 16.67;
const DEFAULT_LOW_POWER_FRAME_BUDGET_MS = 33.33;
const DEFAULT_THREE_CLEANUP_RESOURCES = Object.freeze([
  'three-renderer-stub',
  'webgl-context-handle',
  'scene-graph-stub',
  'camera-stub',
  'geometry-buffers',
  'materials',
  'textures',
  'event-listeners',
  'scheduled-fiber-endpoint'
]);
const THREE_LEAK_KEYS = Object.freeze([
  'threeRenderer',
  'threeScene',
  'threeCamera',
  'threeMesh',
  'threeGeometry',
  'threeMaterial',
  'threeTexture',
  'webglContext',
  'gl',
  'renderer',
  'object3D',
  'nativeEvent',
  'domEvent',
  'rafId'
]);
const FREE_RAF_PATTERN = /\brequestAnimationFrame\s*\(/u;

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

function createThreePocDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    code,
    message,
    details: cloneJson(metadata) || {},
    schema: 'xtend.xtensions.three-render-loop-diagnostic.v1',
    source: XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    severity,
    xtensionId: subject && (subject.xtensionId || subject.id) || null,
    framework: subject && subject.framework || 'three',
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function collectPayloadDiagnostics(value, path = 'payload', seen = new Set(), subject = {}) {
  const diagnostics = [];
  const valueType = typeof value;
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Three XTension payload field "${path}" must be serializable.`,
      'error',
      { field: path, valueType }
    ));
    return diagnostics;
  }

  if (!value || valueType !== 'object') return diagnostics;
  if (seen.has(value)) {
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Three XTension payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    return diagnostics;
  }
  seen.add(value);

  Object.keys(value).forEach((key) => {
    const childPath = `${path}.${key}`;
    if (THREE_LEAK_KEYS.includes(key)) {
      diagnostics.push(createThreePocDiagnostic(
        subject,
        THREE_POC_API_LEAK_CODE,
        `Three XTension payload must not expose host-owned API object "${key}".`,
        'error',
        { field: childPath, key }
      ));
    }
    diagnostics.push(...collectPayloadDiagnostics(value[key], childPath, seen, subject));
  });
  seen.delete(value);
  return diagnostics;
}

function inspectThreePayloadBoundary(payload = {}, subject = {}) {
  const diagnostics = collectPayloadDiagnostics(payload, 'payload', new Set(), subject);
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    apiBoundary: 'hostcontroller-only',
    serializable: diagnostics.every((diagnostic) => diagnostic.code !== THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE)
  };
}

function normalizeFrameBudget(value, fallback = DEFAULT_FRAME_BUDGET_MS) {
  const budget = Number(value);
  if (Number.isFinite(budget) && budget > 0) return budget;
  return fallback;
}

function normalizeLane(value) {
  const lane = normalizeString(value || 'fabric.render') || 'fabric.render';
  return THREE_RENDER_LOOP_LANES.includes(lane) ? lane : 'fabric.render';
}

function createThreeFiberRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const subject = { id: options.xtensionId || source.xtensionId || 'xtension.three.scene', framework: 'three' };
  const hostRegistered = source.hostRegistered !== false && source.freeRunning !== true;
  const frameBudgetMs = normalizeFrameBudget(source.frameBudgetMs || source.budgetMs, 0);
  const diagnostics = [];

  if (!hostRegistered) {
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_FREE_RAF_LOOP_CODE,
      'Three render loop must be registered as a host-owned Fabric fiber endpoint.',
      'error',
      { field: 'hostRegistered', hostRegistered, freeRunning: source.freeRunning === true }
    ));
  }

  if (!Number.isFinite(frameBudgetMs) || frameBudgetMs <= 0) {
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_FRAME_BUDGET_INVALID_CODE,
      'Three render loop fiber requires a positive frame budget.',
      'error',
      { field: 'frameBudgetMs', value: source.frameBudgetMs || source.budgetMs }
    ));
  }

  return {
    schema: XTENSIONS_THREE_FIBER_RECORD_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    xtensionId: subject.id,
    framework: 'three',
    fiberId: normalizeString(source.fiberId || `${subject.id}:render-loop-fiber`),
    endpointName: normalizeString(source.endpointName || 'three.renderFrame') || 'three.renderFrame',
    lane: normalizeLane(source.lane || options.lane),
    hostRegistered,
    schedulerAuthority: 'host-fiber',
    freeRunningLoopAllowed: false,
    frameBudgetMs: frameBudgetMs > 0 ? frameBudgetMs : DEFAULT_FRAME_BUDGET_MS,
    lowPowerFrameBudgetMs: normalizeFrameBudget(source.lowPowerFrameBudgetMs, DEFAULT_LOW_POWER_FRAME_BUDGET_MS),
    backpressureStrategy: normalizeString(source.backpressureStrategy || 'drop-and-diagnose') || 'drop-and-diagnose',
    visibilityPolicy: normalizeString(source.visibilityPolicy || 'pause-when-hidden') || 'pause-when-hidden',
    contextLossPolicy: normalizeString(source.contextLossPolicy || 'diagnose-and-suspend') || 'diagnose-and-suspend',
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function createThreeFrameRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const subject = { id: options.xtensionId || source.xtensionId || 'xtension.three.scene', framework: 'three' };
  const frameBudgetMs = normalizeFrameBudget(source.frameBudgetMs || options.frameBudgetMs, DEFAULT_FRAME_BUDGET_MS);
  const renderCostMs = Number(source.renderCostMs || source.elapsedMs || 0);
  const visible = source.visible !== false;
  const suspended = source.suspended === true;
  const contextLost = source.contextLost === true;
  const lowPowerMode = source.lowPowerMode === true;
  const diagnostics = [];
  let status = 'rendered';
  let dropped = false;

  if (!visible || suspended) {
    status = !visible ? 'skipped-hidden' : 'skipped-suspended';
  } else if (contextLost) {
    status = 'skipped-context-lost';
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_CONTEXT_LOST_CODE,
      'Three render frame skipped because the WebGL context is lost.',
      'warning',
      { field: 'contextLost', contextLost: true }
    ));
  } else if (renderCostMs > frameBudgetMs) {
    status = 'dropped-over-budget';
    dropped = true;
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_BACKPRESSURE_CODE,
      'Three render frame exceeded host frame budget and must be backpressured.',
      'warning',
      { field: 'renderCostMs', renderCostMs, frameBudgetMs }
    ));
  }

  return {
    schema: XTENSIONS_THREE_FRAME_RECORD_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    xtensionId: subject.id,
    framework: 'three',
    frameId: normalizeString(source.frameId || `${subject.id}:frame:${source.sequence || options.sequence || 1}`),
    sequence: Number.isFinite(source.sequence) ? source.sequence : (Number.isFinite(options.sequence) ? options.sequence : 1),
    lane: normalizeLane(source.lane || options.lane),
    status,
    visible,
    suspended,
    contextLost,
    lowPowerMode,
    frameBudgetMs,
    renderCostMs: Number.isFinite(renderCostMs) ? renderCostMs : 0,
    dropped,
    backpressureStrategy: normalizeString(source.backpressureStrategy || options.backpressureStrategy || 'drop-and-diagnose') || 'drop-and-diagnose',
    nonBlankPixels: Number.isFinite(source.nonBlankPixels) ? source.nonBlankPixels : (status === 'rendered' ? 128 : 0),
    payloadFingerprint: sha256Value({
      sequence: source.sequence || options.sequence || 1,
      status,
      renderCostMs,
      frameBudgetMs,
      visible,
      suspended,
      contextLost,
      lowPowerMode
    }),
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function createThreeContextLossRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const subject = { id: options.xtensionId || source.xtensionId || 'xtension.three.scene', framework: 'three' };
  return {
    schema: XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    xtensionId: subject.id,
    framework: 'three',
    status: source.restored === true ? 'restored' : 'lost',
    reason: normalizeString(source.reason || (source.restored === true ? 'context-restored' : 'webgl-context-lost')),
    action: source.restored === true ? 'resume-after-host-restore' : 'suspend-and-diagnose',
    hostOwned: true,
    diagnostics: source.restored === true ? [] : [
      createThreePocDiagnostic(
        subject,
        THREE_POC_CONTEXT_LOST_CODE,
        'Three WebGL context loss is host-diagnosed and suspends render work.',
        'warning',
        { field: 'contextLost', restored: false }
      )
    ],
    timestamp: timestampFromOptions(options)
  };
}

function createThreeBrowserSmokeRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const subject = { id: options.xtensionId || source.xtensionId || 'xtension.three.scene', framework: 'three' };
  const nonBlankPixels = Number(source.nonBlankPixels || 0);
  const interactionCount = Number(source.interactionCount || 0);
  const cleanupVerified = source.cleanupVerified === true;
  const diagnostics = [];
  if (!Number.isFinite(nonBlankPixels) || nonBlankPixels <= 0) {
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_BROWSER_SMOKE_BLANK_CODE,
      'Three browser smoke requires nonblank render evidence.',
      'error',
      { field: 'nonBlankPixels', nonBlankPixels }
    ));
  }
  if (!cleanupVerified) {
    diagnostics.push(createThreePocDiagnostic(
      subject,
      THREE_POC_CLEANUP_INCOMPLETE_CODE,
      'Three browser smoke requires cleanup verification.',
      'error',
      { field: 'cleanupVerified', cleanupVerified }
    ));
  }
  return {
    schema: XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    xtensionId: subject.id,
    framework: 'three',
    smokeMode: normalizeString(source.smokeMode || 'frameworkless-pixel-probe') || 'frameworkless-pixel-probe',
    browserRuntimeRequired: false,
    threeRuntimeImported: false,
    nonBlankPixels: Number.isFinite(nonBlankPixels) ? nonBlankPixels : 0,
    interactionCount: Number.isFinite(interactionCount) ? interactionCount : 0,
    cleanupVerified,
    evidence: cloneJson(source.evidence || {
      canvasProbe: 'stubbed',
      colorHistogramBuckets: ['background', 'mesh', 'interaction-highlight']
    }),
    ok: diagnostics.length === 0,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function createThreeRenderLoopContract(options = {}) {
  const xtensionId = options.xtensionId || 'xtension.three.scene';
  return {
    schema: XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA,
    pocSchema: XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    fiberRecordSchema: XTENSIONS_THREE_FIBER_RECORD_SCHEMA,
    frameRecordSchema: XTENSIONS_THREE_FRAME_RECORD_SCHEMA,
    contextLossRecordSchema: XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA,
    browserSmokeRecordSchema: XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    status: 'accepted-by-XTN-09',
    framework: 'three',
    peerMode: 'external-opt-in-peer-harness',
    testMode: 'frameworkless-contract-stub',
    frameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    runtimeExecutionRequired: false,
    freeRunningLoopAllowed: false,
    defaultFrameBudgetMs: DEFAULT_FRAME_BUDGET_MS,
    lowPowerFrameBudgetMs: DEFAULT_LOW_POWER_FRAME_BUDGET_MS,
    lanes: THREE_RENDER_LOOP_LANES.slice(),
    states: THREE_RENDER_LOOP_STATES.slice(),
    boundaries: THREE_RENDER_LOOP_BOUNDARIES.slice(),
    staticContract: {
      schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
      id: xtensionId,
      name: options.name || 'Three.js Render Loop XTension PoC',
      framework: 'three',
      version: options.version || '0.1.0-poc',
      accepts: [
        'three.scene.mount',
        'three.render.tick',
        'surface.visibility',
        'surface.low-power',
        'webgl.context-loss',
        'webgl.context-restore'
      ],
      emits: [
        'xtension.three.frame.rendered.v1',
        'xtension.three.frame.dropped.v1',
        'xtension.three.context_lost.v1',
        'xtension.three.browser_smoke.v1'
      ],
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'three.render-loop.fiber',
        'fabric.lane-scheduling',
        'frame.budget',
        'visibility.pause',
        'low-power.degradation',
        'webgl.context-loss',
        'webgl.cleanup',
        'browser-smoke.nonblank'
      ]
    }
  };
}

function createThreeRuntimeAdapterRecord(options = {}) {
  const contract = createThreeRenderLoopContract(options.contract || options);
  return normalizeRuntimeAdapterRecord({
    id: options.xtensionId || contract.staticContract.id,
    framework: 'three',
    version: options.version || contract.staticContract.version,
    entry: options.entry || {
      module: 'external-peer://three/render-loop-poc',
      exportName: 'createThreeRenderLoopHostController',
      format: 'esm',
      dynamicImport: true
    },
    integrity: options.integrity || {
      sha256: 'sha256:three-render-loop-poc-external-peer-placeholder',
      source: 'declared'
    },
    fallback: options.fallback || {
      mode: 'native-placeholder',
      component: 'x-placeholder',
      message: 'Three.js XTension PoC unavailable.',
      degradedStatus: 'xtension-three-poc-unavailable'
    },
    dependencies: options.dependencies || [
      {
        name: 'three',
        versionRange: '^0.160.0',
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
      'three.render-loop.fiber',
      'fabric.lane-scheduling',
      'frame.budget',
      'visibility.pause',
      'low-power.degradation',
      'webgl.context-loss',
      'webgl.cleanup',
      'browser-smoke.nonblank'
    ],
    contract: contract.staticContract,
    source: {
      kind: 'three-render-loop-poc',
      workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE
    }
  }, { sourceKind: 'three-render-loop-poc' });
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

function createFrameworklessThreeRenderLoopPoc(options = {}) {
  const contract = createThreeRenderLoopContract(options.contract || options);
  const hostId = options.hostId || 'three-render-loop-poc-host';
  const surfaceId = options.surfaceId || 'surface.three.poc';
  const xtensionId = options.xtensionId || contract.staticContract.id;
  const lifecycleRecords = [];
  const fiberRecords = [];
  const frameRecords = [];
  const contextLossRecords = [];
  const smokeRecords = [];
  const cleanupRecords = [];
  const state = {
    mounted: false,
    destroyed: false,
    suspended: false,
    visible: true,
    lowPowerMode: false,
    contextLost: false,
    loopRegistered: false,
    frameBudgetMs: normalizeFrameBudget(options.frameBudgetMs, DEFAULT_FRAME_BUDGET_MS),
    lowPowerFrameBudgetMs: normalizeFrameBudget(options.lowPowerFrameBudgetMs, DEFAULT_LOW_POWER_FRAME_BUDGET_MS),
    frameSequence: 0,
    renderedFrames: 0,
    droppedFrames: 0,
    interactionCount: 0
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
    const diagnostic = createThreePocDiagnostic({ id: xtensionId, framework: 'three' }, code, message, 'error', { operation });
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return createResult(operation, 'failed', hostId, surfaceId, lifecycleRecord, {}, [diagnostic], [], options);
  }

  return {
    schema: XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
    id: hostId,
    framework: 'three',
    version: contract.staticContract.version,
    contract: contract.staticContract,

    mount(container = {}, sceneDescriptor = {}, mountOptions = {}) {
      if (state.destroyed) return blocked('mount', THREE_POC_ALREADY_DESTROYED_CODE, 'Three Render Loop PoC has already been destroyed.');
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return createResult('mount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-mounted' }, [], [], options);
      }
      const boundary = inspectThreePayloadBoundary(sceneDescriptor, { id: xtensionId, framework: 'three' });
      if (!boundary.ok) {
        const lifecycleRecord = pushLifecycle('mount', 'failed', { reason: 'three-api-leak' }, boundary.diagnostics);
        return createResult('mount', 'failed', hostId, surfaceId, lifecycleRecord, { boundary }, boundary.diagnostics, [], options);
      }
      state.mounted = true;
      const lifecycleRecord = pushLifecycle('mount', 'ok', {
        containerId: mountOptions.containerId || container.id || 'anonymous-three-container',
        rendererOwnedByHost: true,
        sceneFingerprint: sha256Value(sceneDescriptor || {})
      });
      return createResult('mount', 'ok', hostId, surfaceId, lifecycleRecord, {
        renderer: {
          mode: 'frameworkless-three-renderer-stub',
          hostOwned: true,
          contextOwnedByHost: true
        }
      }, [], [], options);
    },

    registerRenderLoop(input = {}) {
      if (state.destroyed) return blocked('registerRenderLoop', THREE_POC_ALREADY_DESTROYED_CODE, 'Three Render Loop PoC has already been destroyed.');
      if (!state.mounted) return blocked('registerRenderLoop', THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC is not mounted.');
      const record = createThreeFiberRecord({
        ...input,
        frameBudgetMs: input.frameBudgetMs || state.frameBudgetMs,
        lowPowerFrameBudgetMs: input.lowPowerFrameBudgetMs || state.lowPowerFrameBudgetMs
      }, {
        xtensionId,
        clock: options.clock
      });
      fiberRecords.push(record);
      if (record.ok) {
        state.loopRegistered = true;
        state.frameBudgetMs = record.frameBudgetMs;
        state.lowPowerFrameBudgetMs = record.lowPowerFrameBudgetMs;
      }
      const lifecycleRecord = pushLifecycle('registerRenderLoop', record.ok ? 'ok' : 'failed', { fiberRecord: record }, record.diagnostics);
      return createResult('registerRenderLoop', record.ok ? 'ok' : 'failed', hostId, surfaceId, lifecycleRecord, { fiberRecord: record }, record.diagnostics, [], options);
    },

    tick(input = {}) {
      if (state.destroyed) return blocked('tick', THREE_POC_ALREADY_DESTROYED_CODE, 'Three Render Loop PoC has already been destroyed.');
      if (!state.mounted) return blocked('tick', THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC is not mounted.');
      if (!state.loopRegistered) return blocked('tick', THREE_POC_FIBER_UNREGISTERED_CODE, 'Three render loop must be registered before frame ticks.');
      state.frameSequence += 1;
      const frameBudgetMs = state.lowPowerMode ? state.lowPowerFrameBudgetMs : state.frameBudgetMs;
      const record = createThreeFrameRecord({
        ...input,
        sequence: state.frameSequence,
        visible: state.visible,
        suspended: state.suspended,
        contextLost: state.contextLost,
        lowPowerMode: state.lowPowerMode,
        frameBudgetMs
      }, {
        xtensionId,
        lane: input.lane,
        clock: options.clock
      });
      frameRecords.push(record);
      if (record.status === 'rendered') state.renderedFrames += 1;
      if (record.dropped) state.droppedFrames += 1;
      const lifecycleRecord = pushLifecycle('tick', record.dropped ? 'degraded' : (record.status === 'rendered' ? 'ok' : 'skipped'), { frameRecord: record }, record.diagnostics);
      return createResult('tick', record.dropped ? 'degraded' : (record.status === 'rendered' ? 'ok' : 'skipped'), hostId, surfaceId, lifecycleRecord, { frameRecord: record }, record.diagnostics, [], options);
    },

    setVisibility(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('visibility', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot set visibility unless mounted.');
      const visibility = normalizeString(input.visibility || input.state || 'visible') || 'visible';
      state.visible = visibility !== 'hidden';
      state.suspended = visibility === 'hidden';
      const lifecycleRecord = pushLifecycle('visibility', 'ok', {
        visibility: state.visible ? 'visible' : 'hidden',
        action: state.visible ? 'resume-render-loop' : 'pause-render-loop'
      });
      return createResult('visibility', 'ok', hostId, surfaceId, lifecycleRecord, {
        visibility: state.visible ? 'visible' : 'hidden',
        suspended: state.suspended
      }, [], [], options);
    },

    setLowPowerMode(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('lowPowerMode', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot change low power mode unless mounted.');
      state.lowPowerMode = input.enabled !== false;
      const lifecycleRecord = pushLifecycle('lowPowerMode', 'ok', {
        lowPowerMode: state.lowPowerMode,
        frameBudgetMs: state.lowPowerMode ? state.lowPowerFrameBudgetMs : state.frameBudgetMs,
        action: state.lowPowerMode ? 'degrade-frame-rate' : 'restore-frame-rate'
      });
      return createResult('lowPowerMode', 'ok', hostId, surfaceId, lifecycleRecord, {
        lowPowerMode: state.lowPowerMode,
        frameBudgetMs: state.lowPowerMode ? state.lowPowerFrameBudgetMs : state.frameBudgetMs
      }, [], [], options);
    },

    suspend(reason = 'host-policy') {
      if (!state.mounted || state.destroyed) return blocked('suspend', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot suspend unless mounted.');
      state.suspended = true;
      const lifecycleRecord = pushLifecycle('suspend', 'ok', { reason });
      return createResult('suspend', 'ok', hostId, surfaceId, lifecycleRecord, { suspended: true, reason }, [], [], options);
    },

    resume(reason = 'host-policy') {
      if (!state.mounted || state.destroyed) return blocked('resume', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot resume unless mounted.');
      state.suspended = false;
      state.visible = true;
      const lifecycleRecord = pushLifecycle('resume', 'ok', { reason });
      return createResult('resume', 'ok', hostId, surfaceId, lifecycleRecord, { suspended: false, visible: true, reason }, [], [], options);
    },

    reportContextLoss(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('contextLoss', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot report context loss unless mounted.');
      state.contextLost = true;
      state.suspended = true;
      const record = createThreeContextLossRecord(input, { xtensionId, clock: options.clock });
      contextLossRecords.push(record);
      const lifecycleRecord = pushLifecycle('contextLoss', 'degraded', { contextLossRecord: record }, record.diagnostics);
      return createResult('contextLoss', 'degraded', hostId, surfaceId, lifecycleRecord, { contextLossRecord: record }, record.diagnostics, [], options);
    },

    restoreContext(input = {}) {
      if (!state.mounted || state.destroyed) return blocked('restoreContext', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot restore context unless mounted.');
      state.contextLost = false;
      state.suspended = false;
      const record = createThreeContextLossRecord({ ...input, restored: true }, { xtensionId, clock: options.clock });
      contextLossRecords.push(record);
      const lifecycleRecord = pushLifecycle('restoreContext', 'ok', { contextLossRecord: record });
      return createResult('restoreContext', 'ok', hostId, surfaceId, lifecycleRecord, { contextLossRecord: record }, [], [], options);
    },

    interact(event = {}) {
      if (!state.mounted || state.destroyed) return blocked('interact', state.destroyed ? THREE_POC_ALREADY_DESTROYED_CODE : THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC cannot interact unless mounted.');
      const boundary = inspectThreePayloadBoundary(event, { id: xtensionId, framework: 'three' });
      if (!boundary.ok) {
        const lifecycleRecord = pushLifecycle('interact', 'failed', { reason: 'three-api-leak' }, boundary.diagnostics);
        return createResult('interact', 'failed', hostId, surfaceId, lifecycleRecord, { boundary }, boundary.diagnostics, [], options);
      }
      state.interactionCount += 1;
      const lifecycleRecord = pushLifecycle('interact', 'ok', {
        eventName: normalizeString(event.name || 'pointer.select'),
        payloadFingerprint: sha256Value(event)
      });
      return createResult('interact', 'ok', hostId, surfaceId, lifecycleRecord, {
        interactionCount: state.interactionCount,
        eventName: normalizeString(event.name || 'pointer.select')
      }, [], [], options);
    },

    browserSmoke(input = {}) {
      const record = createThreeBrowserSmokeRecord({
        nonBlankPixels: input.nonBlankPixels || (state.renderedFrames > 0 ? 128 : 0),
        interactionCount: input.interactionCount || state.interactionCount,
        cleanupVerified: input.cleanupVerified === true || state.destroyed === true,
        evidence: input.evidence
      }, {
        xtensionId,
        clock: options.clock
      });
      smokeRecords.push(record);
      return record;
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason: 'already-destroyed' });
        return createResult('unmount', 'skipped', hostId, surfaceId, lifecycleRecord, { reason: 'already-destroyed' }, [], [], options);
      }
      if (!state.mounted) return blocked('unmount', THREE_POC_NOT_MOUNTED_CODE, 'Three Render Loop PoC is not mounted.');
      state.mounted = false;
      state.destroyed = true;
      state.suspended = true;
      state.loopRegistered = false;
      DEFAULT_THREE_CLEANUP_RESOURCES.forEach((resource, index) => {
        cleanupRecords.push(createHostResourceCleanupRecord({
          hostId,
          surfaceId,
          xtensionId,
          resource,
          sequence: index + 1,
          timestamp: timestampFromOptions(options)
        }));
      });
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources: DEFAULT_THREE_CLEANUP_RESOURCES.slice() });
      return createResult('unmount', 'ok', hostId, surfaceId, lifecycleRecord, { reason }, [], cleanupRecords, options);
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.three-render-loop-snapshot.v1',
        hostId,
        surfaceId,
        xtensionId,
        framework: 'three',
        state: cloneJson(state),
        fiberRecordCount: fiberRecords.length,
        frameRecordCount: frameRecords.length,
        contextLossRecordCount: contextLossRecords.length,
        browserSmokeRecordCount: smokeRecords.length,
        cleanupCount: cleanupRecords.length,
        freeRunningLoopExternalized: false,
        threeRuntimeImported: false
      };
    },

    getLifecycleRecords() { return lifecycleRecords.map(cloneJson); },
    getFiberRecords() { return fiberRecords.map(cloneJson); },
    getFrameRecords() { return frameRecords.map(cloneJson); },
    getContextLossRecords() { return contextLossRecords.map(cloneJson); },
    getBrowserSmokeRecords() { return smokeRecords.map(cloneJson); },
    getCleanupRecords() { return cleanupRecords.map(cloneJson); }
  };
}

function assertThreeRenderLoopDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  const diagnostics = dependencyCheck.diagnostics.map((diagnostic) => ({
    ...diagnostic,
    code: THREE_POC_FRAMEWORK_DEPENDENCY_CODE
  }));
  const sourceText = input.sourceText || input.text || '';
  if (FREE_RAF_PATTERN.test(sourceText)) {
    diagnostics.push(createThreePocDiagnostic(
      { id: input.xtensionId || 'xtension.three.scene', framework: 'three' },
      THREE_POC_FREE_RAF_LOOP_CODE,
      'Three XTension source must not create a free render loop outside the host fiber scheduler.',
      'error',
      { field: 'sourceText' }
    ));
  }
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createThreeRenderLoopPocReport(input = {}, options = {}) {
  const contract = createThreeRenderLoopContract(input.contract || input);
  const adapter = createThreeRuntimeAdapterRecord(input.adapter || input.three && input.three.adapter || {});
  const runtimeInput = {
    host: input.host || {
      hostId: 'three-render-loop-poc-host',
      capabilities: [
        'host.lifecycle.mount',
        'host.lifecycle.unmount',
        'signal.downstream',
        'event.upstream',
        'loading.dynamic-import',
        'three.render-loop.fiber',
        'fabric.lane-scheduling',
        'frame.budget',
        'visibility.pause',
        'low-power.degradation',
        'webgl.context-loss',
        'webgl.cleanup',
        'browser-smoke.nonblank'
      ],
      providedFrameworks: [
        { name: 'three', version: '0.160.0', source: 'external-peer-harness', available: true }
      ]
    },
    adapters: [adapter],
    requests: input.requests || [
      { xtensionId: adapter.xtensionId, surfaceId: 'surface.three.poc' }
    ]
  };
  const runtimeRegistry = createXTensionsRuntimeCapabilityRegistry(runtimeInput, options);
  const runtimeReport = createXTensionsRuntimeReport({ registry: runtimeRegistry, requests: runtimeInput.requests }, options);
  const host = createFrameworklessThreeRenderLoopPoc({
    xtensionId: contract.staticContract.id,
    hostId: input.hostControllerId || 'three-render-loop-poc-host',
    surfaceId: input.surfaceId || 'surface.three.poc',
    frameBudgetMs: input.frameBudgetMs,
    lowPowerFrameBudgetMs: input.lowPowerFrameBudgetMs,
    clock: options.clock
  });
  const operationResults = [];
  const smokeResults = [];

  toArray(input.operations).forEach((operation) => {
    if (!operation || typeof operation !== 'object') return;
    const kind = normalizeString(operation.kind || operation.operation);
    if (kind === 'mount') operationResults.push(host.mount(operation.container || {}, operation.scene || operation.sceneDescriptor || {}, operation.options || operation));
    if (kind === 'register-loop') operationResults.push(host.registerRenderLoop(operation));
    if (kind === 'tick') operationResults.push(host.tick(operation));
    if (kind === 'visibility') operationResults.push(host.setVisibility(operation));
    if (kind === 'low-power') operationResults.push(host.setLowPowerMode(operation));
    if (kind === 'suspend') operationResults.push(host.suspend(operation.reason || 'fixture'));
    if (kind === 'resume') operationResults.push(host.resume(operation.reason || 'fixture'));
    if (kind === 'context-loss') operationResults.push(host.reportContextLoss(operation));
    if (kind === 'context-restore') operationResults.push(host.restoreContext(operation));
    if (kind === 'interact') operationResults.push(host.interact(operation.event || operation));
    if (kind === 'unmount') operationResults.push(host.unmount(operation.reason || 'fixture'));
    if (kind === 'browser-smoke') smokeResults.push(host.browserSmoke(operation));
  });

  const dependencyBoundary = assertThreeRenderLoopDependencyBoundary(input);
  const diagnostics = dependencyBoundary.diagnostics
    .concat(runtimeReport.diagnostics || [])
    .concat(operationResults.flatMap((result) => result.diagnostics || []))
    .concat(smokeResults.flatMap((result) => result.diagnostics || []));
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error' || diagnostic.code === THREE_POC_FRAMEWORK_DEPENDENCY_CODE || diagnostic.code === THREE_POC_FREE_RAF_LOOP_CODE);

  return {
    schema: XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA,
    pocSchema: XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
    contractSchema: XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA,
    fiberRecordSchema: XTENSIONS_THREE_FIBER_RECORD_SCHEMA,
    frameRecordSchema: XTENSIONS_THREE_FRAME_RECORD_SCHEMA,
    contextLossRecordSchema: XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA,
    browserSmokeRecordSchema: XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
    ok: blockingDiagnostics.length === 0,
    status: blockingDiagnostics.length === 0 ? (runtimeReport.status === 'degraded' ? 'degraded' : 'ready') : 'blocked',
    runtimeExecutionRequired: false,
    threeRuntimeImported: false,
    freeRunningLoopAllowed: false,
    contract,
    adapter,
    runtimeRegistry,
    runtimeReport,
    operationResults,
    smokeResults,
    snapshot: host.snapshot(),
    lifecycleRecords: host.getLifecycleRecords(),
    fiberRecords: host.getFiberRecords(),
    frameRecords: host.getFrameRecords(),
    contextLossRecords: host.getContextLossRecords(),
    browserSmokeRecords: host.getBrowserSmokeRecords(),
    cleanupRecords: host.getCleanupRecords(),
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeThreeRenderLoopPocReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DEFAULT_THREE_CLEANUP_RESOURCES,
  DEFAULT_FRAME_BUDGET_MS,
  DEFAULT_LOW_POWER_FRAME_BUDGET_MS,
  THREE_LEAK_KEYS,
  THREE_POC_ALREADY_DESTROYED_CODE,
  THREE_POC_API_LEAK_CODE,
  THREE_POC_BACKPRESSURE_CODE,
  THREE_POC_BROWSER_SMOKE_BLANK_CODE,
  THREE_POC_CLEANUP_INCOMPLETE_CODE,
  THREE_POC_CONTEXT_LOST_CODE,
  THREE_POC_FIBER_UNREGISTERED_CODE,
  THREE_POC_FRAME_BUDGET_INVALID_CODE,
  THREE_POC_FRAMEWORK_DEPENDENCY_CODE,
  THREE_POC_FREE_RAF_LOOP_CODE,
  THREE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
  THREE_POC_NOT_MOUNTED_CODE,
  THREE_RENDER_LOOP_BOUNDARIES,
  THREE_RENDER_LOOP_LANES,
  THREE_RENDER_LOOP_STATES,
  XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA,
  XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA,
  XTENSIONS_THREE_FIBER_RECORD_SCHEMA,
  XTENSIONS_THREE_FRAME_RECORD_SCHEMA,
  XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA,
  XTENSIONS_THREE_RENDER_LOOP_POC_CONTRACT_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_FIXTURE_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_MODULE_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_PACKAGE_SCRIPT,
  XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA,
  XTENSIONS_THREE_RENDER_LOOP_POC_SUITE_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_TYPES_PATH,
  XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE,
  XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA,
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
  assertThreeRenderLoopDependencyBoundary,
  createFrameworklessThreeRenderLoopPoc,
  createThreeBrowserSmokeRecord,
  createThreeContextLossRecord,
  createThreeFiberRecord,
  createThreeFrameRecord,
  createThreeRenderLoopContract,
  createThreeRenderLoopPocReport,
  createThreeRuntimeAdapterRecord,
  createThreePocDiagnostic,
  inspectThreePayloadBoundary,
  resolveHostResourceCleanupSchema,
  serializeThreeRenderLoopPocReport
};
