'use strict';

const {
  CANONICAL_SCHEDULER_LANES,
  RMT_VNEXT_SCHEDULER_SCHEMA,
  normalizeLaneName
} = require('../rmt-language/vnext-scheduler');
const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');

const XTENSIONS_SIGNAL_BRIDGE_SCHEMA = 'xtend.xtensions.signal-bridge.v1';
const XTENSIONS_KERNEL_SIGNAL_SCHEMA = 'xtend.xtensions.kernel-signal.v1';
const XTENSIONS_SURFACE_EVENT_SCHEMA = 'xtend.xtensions.surface-event.v1';
const XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA = 'xtend.xtensions.event-governance-matrix.v1';
const XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA = 'xtend.xtensions.signal-bridge-dead-letter.v1';
const XTENSIONS_SIGNAL_BRIDGE_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.signal-bridge-diagnostic.v1';
const XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA = 'xtend.xtensions.signal-bridge-report.v1';
const XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH = 'tools/xtensions/signal-bridge-contract.js';
const XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH = 'tools/xtensions/signal-bridge-contract.d.ts';
const XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH = 'tests/xtensions/xtensions_signal_bridge_suite.js';
const XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH = 'tests/fixtures/xtensions/signal-bridge-valid.json';
const XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';
const XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE = 'XTN-02';
const XTENSIONS_SIGNAL_BRIDGE_PACKAGE_SCRIPT = 'npm run test:xtensions-signal-bridge';

const SIGNAL_BRIDGE_TARGET_MISSING_CODE = 'xtensions.signal_bridge.target_missing';
const SIGNAL_BRIDGE_SIGNAL_TYPE_MISSING_CODE = 'xtensions.signal_bridge.signal_type_missing';
const SIGNAL_BRIDGE_OWNER_MISSING_CODE = 'xtensions.signal_bridge.owner_missing';
const SIGNAL_BRIDGE_DIRECTION_INVALID_CODE = 'xtensions.signal_bridge.direction_invalid';
const SIGNAL_BRIDGE_PAYLOAD_SCHEMA_MISSING_CODE = 'xtensions.signal_bridge.payload_schema_missing';
const SIGNAL_BRIDGE_LANE_UNKNOWN_CODE = 'xtensions.signal_bridge.lane_unknown';
const SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE = 'xtensions.signal_bridge.wildcard_event_forbidden';
const SIGNAL_BRIDGE_TRUST_BOUNDARY_INVALID_CODE = 'xtensions.signal_bridge.trust_boundary_invalid';
const SIGNAL_BRIDGE_DELIVERY_POLICY_MISSING_CODE = 'xtensions.signal_bridge.delivery_policy_missing';
const SIGNAL_BRIDGE_RATE_LIMIT_INVALID_CODE = 'xtensions.signal_bridge.rate_limit_invalid';
const SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE = 'xtensions.signal_bridge.backpressure_invalid';
const SIGNAL_BRIDGE_DEAD_LETTER_REQUIRED_CODE = 'xtensions.signal_bridge.dead_letter_required';
const SIGNAL_BRIDGE_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.signal_bridge.framework_dependency';

const SIGNAL_BRIDGE_DIRECTIONS = Object.freeze(['downstream', 'upstream']);
const SURFACE_EVENT_DIRECTIONS = Object.freeze(['upstream']);
const DELIVERY_MODES = Object.freeze(['sync', 'queued', 'replayable', 'drop-if-stale']);
const TRUST_BOUNDARIES = Object.freeze([
  'same-origin-adapter',
  'sandboxed-adapter',
  'remote-surface-adapter',
  'trusted-native-host'
]);
const BACKPRESSURE_POLICIES = Object.freeze([
  'none',
  'coalesce-by-target',
  'coalesce-by-event',
  'coalesce-by-route',
  'sample',
  'drop-stale',
  'dead-letter'
]);
const COALESCE_POLICIES = Object.freeze(['none', 'target', 'event', 'route', 'payload-schema']);
const PRIORITY_HINTS = Object.freeze(Object.keys(CANONICAL_SCHEDULER_LANES));
const WILDCARD_EVENT_NAMES = Object.freeze(['*', 'global', 'event.bus', 'window.*', 'document.*']);

const DEFAULT_EVENT_GOVERNANCE_MATRIX = Object.freeze([
  Object.freeze({
    framework: 'react',
    runtimeClass: 'declarative-vdom',
    hostMode: 'frameworkless-contract-stub',
    defaultLane: 'transition',
    acceptedSignals: ['props.update', 'state.patch', 'command.dispatch'],
    emittedEvents: ['intent.submit', 'form.change', 'boundary.error'],
    payloadSchemas: ['xtend.schemas.xtension.react.props.v1', 'xtend.schemas.xtension.intent.v1'],
    requiredControls: ['owner', 'payloadSchema', 'lane', 'correlationId', 'idempotencyKey'],
    schedulingNotes: 'scheduler-hint-only',
    backpressure: 'coalesce-by-target',
    trustBoundary: 'same-origin-adapter'
  }),
  Object.freeze({
    framework: 'vue',
    runtimeClass: 'declarative-reactive',
    hostMode: 'frameworkless-contract-stub',
    defaultLane: 'visible',
    acceptedSignals: ['props.update', 'reactive.patch', 'command.dispatch'],
    emittedEvents: ['intent.submit', 'model.change', 'boundary.error'],
    payloadSchemas: ['xtend.schemas.xtension.vue.patch.v1', 'xtend.schemas.xtension.intent.v1'],
    requiredControls: ['owner', 'payloadSchema', 'lane', 'explicit-update-adapter'],
    schedulingNotes: 'explicit-update-adapter',
    backpressure: 'coalesce-by-target',
    trustBoundary: 'same-origin-adapter'
  }),
  Object.freeze({
    framework: 'leaflet',
    runtimeClass: 'imperative-map',
    hostMode: 'frameworkless-contract-stub',
    defaultLane: 'visible',
    acceptedSignals: ['viewport.update', 'layer.patch', 'marker.sync'],
    emittedEvents: ['map.viewport.changed', 'marker.selected', 'boundary.error'],
    payloadSchemas: ['xtend.schemas.xtension.map.viewport.v1', 'xtend.schemas.xtension.map.marker.v1'],
    requiredControls: ['owner', 'payloadSchema', 'lane', 'rateLimit', 'deadLetter'],
    schedulingNotes: 'imperative-api-throttled',
    backpressure: 'coalesce-by-target',
    trustBoundary: 'same-origin-adapter'
  }),
  Object.freeze({
    framework: 'chart.js',
    runtimeClass: 'imperative-chart',
    hostMode: 'frameworkless-contract-stub',
    defaultLane: 'transition',
    acceptedSignals: ['dataset.update', 'options.patch', 'selection.sync'],
    emittedEvents: ['chart.point.selected', 'chart.range.changed', 'boundary.error'],
    payloadSchemas: ['xtend.schemas.xtension.chart.dataset.v1', 'xtend.schemas.xtension.chart.selection.v1'],
    requiredControls: ['owner', 'payloadSchema', 'lane', 'coalesceKey'],
    schedulingNotes: 'dataset-updates-coalesced',
    backpressure: 'coalesce-by-event',
    trustBoundary: 'same-origin-adapter'
  }),
  Object.freeze({
    framework: 'three',
    runtimeClass: 'render-loop-3d',
    hostMode: 'frameworkless-contract-stub',
    defaultLane: 'background',
    acceptedSignals: ['scene.patch', 'camera.update', 'render.tick'],
    emittedEvents: ['scene.object.selected', 'frame.budget.exceeded', 'boundary.error'],
    payloadSchemas: ['xtend.schemas.xtension.three.scene.v1', 'xtend.schemas.xtension.three.frame.v1'],
    requiredControls: ['owner', 'payloadSchema', 'lane', 'frameBudget', 'visibilityPolicy', 'cancellation'],
    schedulingNotes: 'fiber-controlled-render-loop',
    backpressure: 'sample',
    trustBoundary: 'same-origin-adapter'
  })
]);

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
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

function createSignalBridgeDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_SIGNAL_BRIDGE_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    workpackage: XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE,
    severity,
    code,
    message,
    signalId: subject && subject.signalId || null,
    eventId: subject && subject.eventId || null,
    event: subject && subject.event || null,
    target: subject && subject.target ? cloneJson(subject.target) : null,
    owner: subject && subject.owner && subject.owner.id || null,
    lane: subject && subject.lane || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeOwner(owner) {
  if (typeof owner === 'string') {
    const id = normalizeString(owner);
    return {
      kind: 'team',
      id,
      known: Boolean(id)
    };
  }

  const source = owner && typeof owner === 'object' ? owner : {};
  const id = normalizeString(source.id || source.team || source.name || source.owner);
  return {
    kind: normalizeString(source.kind || source.type || 'team') || 'team',
    id,
    known: Boolean(id)
  };
}

function normalizeTarget(target = {}) {
  const source = target && typeof target === 'object' ? target : {};
  return {
    hostId: normalizeString(source.hostId || source.host || source.adapterId),
    surfaceId: normalizeString(source.surfaceId || source.surface || source.target),
    xtensionId: normalizeString(source.xtensionId || source.extensionId || source.id),
    containerId: normalizeString(source.containerId || source.container)
  };
}

function targetIsKnown(target) {
  return Boolean(target && target.hostId && target.surfaceId && target.xtensionId);
}

function normalizeBridgeLane(lane) {
  const raw = normalizeString(lane || 'visible');
  const normalized = normalizeLaneName(raw);
  return {
    raw,
    lane: normalized.schedulerLane,
    known: normalized.known,
    alias: normalized.alias
  };
}

function normalizePayloadSchema(value) {
  if (typeof value === 'string') return normalizeString(value);
  if (value && typeof value === 'object') {
    return normalizeString(value.schema || value.id || value.ref || value.payloadSchema);
  }
  return '';
}

function isRequiredFact(value) {
  return value === true || value === 'required' || value === 'mandatory';
}

function eventNameIsWildcard(eventName) {
  const normalized = normalizeString(eventName);
  if (!normalized) return false;
  return WILDCARD_EVENT_NAMES.includes(normalized) || normalized.includes('*') || normalized.startsWith('global.');
}

function normalizeRateLimit(rateLimit = {}) {
  const source = rateLimit && typeof rateLimit === 'object' ? rateLimit : {};
  return {
    windowMs: Number.isFinite(source.windowMs) ? source.windowMs : null,
    maxEvents: Number.isFinite(source.maxEvents) ? source.maxEvents : null,
    overflow: normalizeString(source.overflow || 'dead-letter')
  };
}

function normalizeBridgePolicy(policy = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  return {
    deliveryMode: normalizeString(source.deliveryMode || source.mode || 'queued'),
    ttlMs: Number.isFinite(source.ttlMs) ? source.ttlMs : 30000,
    correlationId: source.correlationId === undefined ? 'required' : source.correlationId,
    idempotencyKey: source.idempotencyKey === undefined ? 'required' : source.idempotencyKey,
    coalesceKey: normalizeString(source.coalesceKey || source.coalesce || ''),
    coalescePolicy: normalizeString(source.coalescePolicy || (source.coalesceKey ? 'target' : 'none')),
    backpressure: normalizeString(source.backpressure || 'coalesce-by-target'),
    deadLetter: source.deadLetter === undefined ? 'required' : source.deadLetter,
    rateLimit: normalizeRateLimit(source.rateLimit || {})
  };
}

function validateBridgePolicy(record, policy, diagnostics) {
  if (!DELIVERY_MODES.includes(policy.deliveryMode)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_DELIVERY_POLICY_MISSING_CODE,
      `Unsupported delivery mode "${policy.deliveryMode || 'missing'}".`,
      'error',
      { field: 'policy.deliveryMode', allowedModes: DELIVERY_MODES.slice() }
    ));
  }

  if (!Number.isFinite(policy.ttlMs) || policy.ttlMs <= 0) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_DELIVERY_POLICY_MISSING_CODE,
      'Bridge policy must declare a positive ttlMs.',
      'error',
      { field: 'policy.ttlMs' }
    ));
  }

  if (!isRequiredFact(policy.correlationId)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_DELIVERY_POLICY_MISSING_CODE,
      'Bridge policy must require correlationId.',
      'error',
      { field: 'policy.correlationId' }
    ));
  }

  if (!isRequiredFact(policy.idempotencyKey)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_DELIVERY_POLICY_MISSING_CODE,
      'Bridge policy must require idempotencyKey.',
      'error',
      { field: 'policy.idempotencyKey' }
    ));
  }

  if (!BACKPRESSURE_POLICIES.includes(policy.backpressure)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE,
      `Unsupported backpressure policy "${policy.backpressure || 'missing'}".`,
      'error',
      { field: 'policy.backpressure', allowedPolicies: BACKPRESSURE_POLICIES.slice() }
    ));
  }

  if (!COALESCE_POLICIES.includes(policy.coalescePolicy)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE,
      `Unsupported coalesce policy "${policy.coalescePolicy || 'missing'}".`,
      'error',
      { field: 'policy.coalescePolicy', allowedPolicies: COALESCE_POLICIES.slice() }
    ));
  }

  const hasRateLimit = policy.rateLimit.windowMs !== null || policy.rateLimit.maxEvents !== null;
  if (hasRateLimit && (!Number.isFinite(policy.rateLimit.windowMs) || policy.rateLimit.windowMs <= 0 || !Number.isFinite(policy.rateLimit.maxEvents) || policy.rateLimit.maxEvents <= 0)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_RATE_LIMIT_INVALID_CODE,
      'Rate limit must declare positive windowMs and maxEvents.',
      'error',
      { field: 'policy.rateLimit' }
    ));
  }

  if (!isRequiredFact(policy.deadLetter)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_DEAD_LETTER_REQUIRED_CODE,
      'Bridge policy violations must be dead-letter reportable.',
      'error',
      { field: 'policy.deadLetter' }
    ));
  }
}

function createKernelSignal(input = {}, options = {}) {
  const target = normalizeTarget(input.target || input);
  const laneInfo = normalizeBridgeLane(input.lane || input.priorityHint);
  const policy = normalizeBridgePolicy(input.policy || input.delivery || {});
  const record = {
    schema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    signalId: normalizeString(input.signalId || input.id) || `kernel-signal:${target.surfaceId || 'unknown'}:${normalizeString(input.type || input.signal || 'unknown')}`,
    direction: 'downstream',
    type: normalizeString(input.type || input.signal || input.kind),
    target,
    lane: laneInfo.lane,
    rawLane: laneInfo.raw,
    priorityHint: PRIORITY_HINTS.includes(normalizeString(input.priorityHint)) ? normalizeString(input.priorityHint) : laneInfo.lane,
    payload: cloneJson(input.payload || {}),
    schemaRef: normalizePayloadSchema(input.schemaRef || input.payloadSchema || input.payload),
    policy,
    timestamp: timestampFromOptions(options),
    diagnostics: []
  };
  const diagnostics = record.diagnostics;

  if (!record.type) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_SIGNAL_TYPE_MISSING_CODE,
      'KernelSignal must declare a signal type.',
      'error',
      { field: 'type' }
    ));
  }

  if (!targetIsKnown(record.target)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_TARGET_MISSING_CODE,
      'KernelSignal target must include hostId, surfaceId and xtensionId.',
      'error',
      { field: 'target' }
    ));
  }

  if (!record.schemaRef) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_PAYLOAD_SCHEMA_MISSING_CODE,
      'KernelSignal must declare schemaRef for payload validation.',
      'error',
      { field: 'schemaRef' }
    ));
  }

  if (!laneInfo.known) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_LANE_UNKNOWN_CODE,
      `KernelSignal lane "${laneInfo.raw || 'missing'}" is not a canonical Fabric lane.`,
      'error',
      { field: 'lane', canonicalLanes: PRIORITY_HINTS.slice() }
    ));
  }

  validateBridgePolicy(record, policy, diagnostics);
  record.ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  return record;
}

function normalizeSource(source = {}) {
  const input = source && typeof source === 'object' ? source : {};
  return {
    hostId: normalizeString(input.hostId || input.host),
    surfaceId: normalizeString(input.surfaceId || input.surface),
    xtensionId: normalizeString(input.xtensionId || input.extensionId || input.id),
    framework: normalizeString(input.framework || input.runtime)
  };
}

function createSurfaceEvent(input = {}, options = {}) {
  const laneInfo = normalizeBridgeLane(input.lane);
  const owner = normalizeOwner(input.owner);
  const source = normalizeSource(input.source || input);
  const policy = normalizeBridgePolicy(input.policy || input.delivery || {});
  const direction = normalizeString(input.direction || 'upstream');
  const record = {
    schema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    eventId: normalizeString(input.eventId || input.id) || `surface-event:${source.surfaceId || 'unknown'}:${normalizeString(input.event || 'unknown')}`,
    direction,
    event: normalizeString(input.event || input.type || input.name),
    owner,
    source,
    lane: laneInfo.lane,
    rawLane: laneInfo.raw,
    payloadSchema: normalizePayloadSchema(input.payloadSchema || input.payload),
    payload: cloneJson(input.payload || {}),
    trustBoundary: normalizeString(input.trustBoundary || 'same-origin-adapter'),
    policy,
    timestamp: timestampFromOptions(options),
    diagnostics: []
  };
  const diagnostics = record.diagnostics;

  if (!SURFACE_EVENT_DIRECTIONS.includes(direction)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_DIRECTION_INVALID_CODE,
      `SurfaceEvent direction must be upstream, got "${direction || 'missing'}".`,
      'error',
      { field: 'direction', allowedDirections: SURFACE_EVENT_DIRECTIONS.slice() }
    ));
  }

  if (!record.event || eventNameIsWildcard(record.event)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE,
      `SurfaceEvent "${record.event || 'missing'}" must not be wildcard or global.`,
      'error',
      { field: 'event' }
    ));
  }

  if (!owner.known) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_OWNER_MISSING_CODE,
      'SurfaceEvent must declare an owner.',
      'error',
      { field: 'owner' }
    ));
  }

  if (!record.payloadSchema) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_PAYLOAD_SCHEMA_MISSING_CODE,
      'SurfaceEvent must declare payloadSchema.',
      'error',
      { field: 'payloadSchema' }
    ));
  }

  if (!laneInfo.known) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_LANE_UNKNOWN_CODE,
      `SurfaceEvent lane "${laneInfo.raw || 'missing'}" is not a canonical Fabric lane.`,
      'error',
      { field: 'lane', canonicalLanes: PRIORITY_HINTS.slice() }
    ));
  }

  if (!TRUST_BOUNDARIES.includes(record.trustBoundary)) {
    diagnostics.push(createSignalBridgeDiagnostic(
      record,
      SIGNAL_BRIDGE_TRUST_BOUNDARY_INVALID_CODE,
      `SurfaceEvent trustBoundary "${record.trustBoundary || 'missing'}" is unsupported.`,
      'error',
      { field: 'trustBoundary', allowedTrustBoundaries: TRUST_BOUNDARIES.slice() }
    ));
  }

  validateBridgePolicy(record, policy, diagnostics);
  record.ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  return record;
}

function createDeadLetterRecord(record, diagnostic, options = {}) {
  return {
    schema: XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA,
    sourceSchema: record && record.schema || null,
    sourceId: record && (record.signalId || record.eventId) || null,
    reasonCode: diagnostic && diagnostic.code || 'xtensions.signal_bridge.unknown',
    severity: diagnostic && diagnostic.severity || 'error',
    lane: record && record.lane || null,
    owner: record && record.owner && record.owner.id || null,
    target: record && record.target ? cloneJson(record.target) : null,
    timestamp: timestampFromOptions(options),
    diagnostic: cloneJson(diagnostic || {})
  };
}

function normalizeGovernanceMatrix(matrix) {
  const source = Array.isArray(matrix) ? matrix : DEFAULT_EVENT_GOVERNANCE_MATRIX;
  return source.map((entry) => ({
    schema: XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA,
    framework: normalizeString(entry.framework),
    runtimeClass: normalizeString(entry.runtimeClass),
    hostMode: normalizeString(entry.hostMode || 'frameworkless-contract-stub'),
    defaultLane: normalizeBridgeLane(entry.defaultLane).lane,
    acceptedSignals: toArray(entry.acceptedSignals).map(normalizeString).filter(Boolean),
    emittedEvents: toArray(entry.emittedEvents).map(normalizeString).filter(Boolean),
    payloadSchemas: toArray(entry.payloadSchemas).map(normalizeString).filter(Boolean),
    requiredControls: toArray(entry.requiredControls).map(normalizeString).filter(Boolean),
    schedulingNotes: normalizeString(entry.schedulingNotes),
    backpressure: normalizeString(entry.backpressure || 'coalesce-by-target'),
    trustBoundary: normalizeString(entry.trustBoundary || 'same-origin-adapter')
  }));
}

function validateGovernanceMatrix(matrix) {
  const diagnostics = [];
  matrix.forEach((entry) => {
    const matrixSubject = {
      eventId: `matrix:${entry.framework}`,
      event: entry.framework,
      lane: entry.defaultLane
    };

    if (!entry.framework) {
      diagnostics.push(createSignalBridgeDiagnostic(
        matrixSubject,
        SIGNAL_BRIDGE_OWNER_MISSING_CODE,
        'Governance matrix entry must declare framework.',
        'error',
        { field: 'framework' }
      ));
    }

    entry.emittedEvents.forEach((eventName) => {
      if (eventNameIsWildcard(eventName)) {
        diagnostics.push(createSignalBridgeDiagnostic(
          {
            ...matrixSubject,
            event: eventName
          },
          SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE,
          `Governance matrix event "${eventName}" must not be wildcard or global.`,
          'error',
          { field: 'emittedEvents' }
        ));
      }
    });

    if (!BACKPRESSURE_POLICIES.includes(entry.backpressure)) {
      diagnostics.push(createSignalBridgeDiagnostic(
        matrixSubject,
        SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE,
        `Governance matrix backpressure "${entry.backpressure}" is unsupported.`,
        'error',
        { field: 'backpressure' }
      ));
    }

    if (!TRUST_BOUNDARIES.includes(entry.trustBoundary)) {
      diagnostics.push(createSignalBridgeDiagnostic(
        matrixSubject,
        SIGNAL_BRIDGE_TRUST_BOUNDARY_INVALID_CODE,
        `Governance matrix trustBoundary "${entry.trustBoundary}" is unsupported.`,
        'error',
        { field: 'trustBoundary' }
      ));
    }
  });
  return diagnostics;
}

function createSignalBridgeReport(input = {}, options = {}) {
  const kernelSignals = toArray(input.kernelSignals || input.signals).map((signal) => createKernelSignal(signal, options));
  const surfaceEvents = toArray(input.surfaceEvents || input.events).map((event) => createSurfaceEvent(event, options));
  const governanceMatrix = normalizeGovernanceMatrix(input.governanceMatrix);
  const matrixDiagnostics = validateGovernanceMatrix(governanceMatrix);
  const diagnostics = kernelSignals.flatMap((signal) => signal.diagnostics)
    .concat(surfaceEvents.flatMap((event) => event.diagnostics))
    .concat(matrixDiagnostics);
  const deadLetters = kernelSignals.concat(surfaceEvents).flatMap((record) => (
    record.diagnostics
      .filter((diagnostic) => diagnostic.severity === 'error')
      .map((diagnostic) => createDeadLetterRecord(record, diagnostic, options))
  )).concat(matrixDiagnostics.map((diagnostic) => createDeadLetterRecord({ schema: XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA }, diagnostic, options)));
  const byLane = {};
  kernelSignals.concat(surfaceEvents).forEach((record) => {
    const lane = record.lane || 'unknown';
    byLane[lane] = byLane[lane] || [];
    byLane[lane].push(record.signalId || record.eventId);
  });
  const byFramework = {};
  governanceMatrix.forEach((entry) => {
    byFramework[entry.framework] = {
      defaultLane: entry.defaultLane,
      acceptedSignals: entry.acceptedSignals.slice(),
      emittedEvents: entry.emittedEvents.slice(),
      backpressure: entry.backpressure
    };
  });
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA,
    bridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    kernelSignalSchema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    governanceMatrixSchema: XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA,
    deadLetterSchema: XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    schedulerSchema: RMT_VNEXT_SCHEDULER_SCHEMA,
    workpackage: XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    kernelSignalCount: kernelSignals.length,
    surfaceEventCount: surfaceEvents.length,
    governanceMatrixCount: governanceMatrix.length,
    deadLetterCount: deadLetters.length,
    canonicalLanes: PRIORITY_HINTS.slice(),
    directions: SIGNAL_BRIDGE_DIRECTIONS.slice(),
    deliveryModes: DELIVERY_MODES.slice(),
    trustBoundaries: TRUST_BOUNDARIES.slice(),
    backpressurePolicies: BACKPRESSURE_POLICIES.slice(),
    kernelSignals,
    surfaceEvents,
    governanceMatrix,
    deadLetters,
    diagnostics,
    indexes: {
      byLane,
      byFramework
    }
  };
}

function serializeSignalBridgeReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function createXTensionsSignalBridgeContract(options = {}) {
  return {
    schema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    kernelSignalSchema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    governanceMatrixSchema: XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA,
    deadLetterSchema: XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA,
    diagnosticSchema: XTENSIONS_SIGNAL_BRIDGE_DIAGNOSTIC_SCHEMA,
    reportSchema: XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    schedulerSchema: RMT_VNEXT_SCHEDULER_SCHEMA,
    workpackage: XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE,
    status: 'accepted-by-XTN-02',
    directionModel: {
      downstream: 'KernelSignal from RMT/Fabric to HostController',
      upstream: 'SurfaceEvent from HostController to Fabric'
    },
    canonicalLanes: PRIORITY_HINTS.slice(),
    deliveryModes: DELIVERY_MODES.slice(),
    trustBoundaries: TRUST_BOUNDARIES.slice(),
    backpressurePolicies: BACKPRESSURE_POLICIES.slice(),
    coalescePolicies: COALESCE_POLICIES.slice(),
    governanceMatrix: normalizeGovernanceMatrix(options.governanceMatrix),
    dependencyPolicy: {
      frameworkDependenciesAllowed: false,
      vendoredFrameworksAllowed: false,
      networkRequired: false,
      allowedTestModes: [
        'frameworkless-contract-stub',
        'external-opt-in-peer-harness'
      ]
    },
    boundaries: [
      'no-rmt-kernel-import-of-framework-runtime-types',
      'no-implicit-global-framework-event-bus',
      'no-shared-framework-state-across-xtension-boundaries',
      'events-are-owner-and-payload-schema-bound',
      'fabric-can-report-without-framework-runtime'
    ]
  };
}

function assertSignalBridgeDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      code: SIGNAL_BRIDGE_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function listGovernedFrameworks(matrix) {
  return normalizeGovernanceMatrix(matrix).map((entry) => entry.framework);
}

module.exports = {
  BACKPRESSURE_POLICIES,
  COALESCE_POLICIES,
  DEFAULT_EVENT_GOVERNANCE_MATRIX,
  DELIVERY_MODES,
  PRIORITY_HINTS,
  SIGNAL_BRIDGE_BACKPRESSURE_INVALID_CODE,
  SIGNAL_BRIDGE_DEAD_LETTER_REQUIRED_CODE,
  SIGNAL_BRIDGE_DELIVERY_POLICY_MISSING_CODE,
  SIGNAL_BRIDGE_DIRECTION_INVALID_CODE,
  SIGNAL_BRIDGE_FRAMEWORK_DEPENDENCY_CODE,
  SIGNAL_BRIDGE_LANE_UNKNOWN_CODE,
  SIGNAL_BRIDGE_OWNER_MISSING_CODE,
  SIGNAL_BRIDGE_PAYLOAD_SCHEMA_MISSING_CODE,
  SIGNAL_BRIDGE_RATE_LIMIT_INVALID_CODE,
  SIGNAL_BRIDGE_SIGNAL_TYPE_MISSING_CODE,
  SIGNAL_BRIDGE_TARGET_MISSING_CODE,
  SIGNAL_BRIDGE_TRUST_BOUNDARY_INVALID_CODE,
  SIGNAL_BRIDGE_WILDCARD_EVENT_FORBIDDEN_CODE,
  SIGNAL_BRIDGE_DIRECTIONS,
  SURFACE_EVENT_DIRECTIONS,
  TRUST_BOUNDARIES,
  WILDCARD_EVENT_NAMES,
  XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH,
  XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_DIAGNOSTIC_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH,
  XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH,
  XTENSIONS_SIGNAL_BRIDGE_PACKAGE_SCRIPT,
  XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH,
  XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH,
  XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE,
  XTENSIONS_SURFACE_EVENT_SCHEMA,
  assertSignalBridgeDependencyBoundary,
  createDeadLetterRecord,
  createKernelSignal,
  createSignalBridgeReport,
  createSurfaceEvent,
  createXTensionsSignalBridgeContract,
  listGovernedFrameworks,
  normalizeGovernanceMatrix,
  serializeSignalBridgeReport
};
