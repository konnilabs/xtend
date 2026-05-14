'use strict';

const {
  RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
  RMT_KERNEL_TRUST_VERDICT_SCHEMA
} = require('./kernel-trust-authority');

const RMT_KERNEL_PANIC_MONITOR_SCHEMA = 'xtend.rmt.kernel-panic-monitor.v1';
const RMT_KERNEL_PANIC_STATE_SCHEMA = 'xtend.rmt.kernel-panic-state.v1';
const RMT_KERNEL_PANIC_EVENT_SCHEMA = 'xtend.rmt.kernel-panic-event.v1';
const RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA = 'xtend.rmt.kernel-panic-monitor-report.v1';
const RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE = 'RKSH-WP-04';
const RMT_KERNEL_PANIC_MONITOR_MODULE_PATH = 'tools/rmt-language/kernel-panic-monitor.js';
const RMT_KERNEL_PANIC_MONITOR_SUITE_PATH = 'tests/rmt-language/rmt_kernel_panic_monitor_suite.js';
const RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH = 'development/XTendRMT-Kernel-Panic-Monitor-Contract.md';
const RMT_KERNEL_PANIC_MONITOR_WP_PATH = 'development/WP-RKSH-04-PanicMonitor-State-Machine-bauen.md';
const RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-panic-monitor';
const RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL = 'rmt.kernel.panic';

const KERNEL_PANIC_STATES = Object.freeze([
  'none',
  'suspected',
  'active',
  'recovering',
  'recovered',
  'failed'
]);

const KERNEL_PANIC_SEVERITIES = Object.freeze([
  'info',
  'warning',
  'error',
  'critical',
  'fatal'
]);

const KERNEL_PANIC_TRIGGERS = Object.freeze([
  'trust-verdict-blocked',
  'trust-verdict-panic',
  'scheduler-failure',
  'command-bus-failure',
  'diagnostics-failure',
  'adapter-output-blocked',
  'threshold-breached',
  'recovery-failure',
  'manual'
]);

const KERNEL_PANIC_SCOPES = Object.freeze([
  'binding',
  'slot',
  'template',
  'surface',
  'remote-surface',
  'scheduler',
  'scheduler-job',
  'command-bus',
  'diagnostics',
  'adapter-output',
  'kernel'
]);

const KERNEL_PANIC_EVENT_TYPES = Object.freeze([
  'signal-recorded',
  'state-transition',
  'recovery-started',
  'recovery-completed',
  'recovery-failed',
  'reset'
]);

const KERNEL_PANIC_RECOVERY_ACTIONS = Object.freeze([
  'none',
  'observe',
  'quarantine-scope',
  'pause-scheduler',
  'rollback-last-safe-snapshot',
  'render-safe-fallback',
  'notify-host',
  'manual-intervention'
]);

const DEFAULT_ESCALATION_POLICY = Object.freeze({
  repeatedBlockThreshold: 3,
  recoveryFailureThreshold: 1,
  criticalTrustViolationsActivate: true,
  panicCandidateActivates: true,
  fatalSeverityActivates: true,
  thresholdState: 'active',
  suspectedState: 'suspected',
  diagnosticsChannel: RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  defaultRecoveryAction: 'quarantine-scope',
  redactsRawOutput: true,
  triggerSources: Object.freeze([
    'Trust Authority',
    'Scheduler',
    'Command Bus',
    'Diagnostics',
    'Adapter Outcomes'
  ])
});

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = normalizeString(value, fallback);
  return allowed.includes(normalized) ? normalized : fallback;
}

function cloneJson(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
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

function normalizeNumber(value, fallback, minimum = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(Math.floor(numberValue), minimum);
}

function mergeEscalationPolicy(input = {}) {
  const rawPolicy = input && typeof input === 'object' ? input : {};
  return {
    ...DEFAULT_ESCALATION_POLICY,
    ...cloneJson(rawPolicy, {}),
    repeatedBlockThreshold: normalizeNumber(rawPolicy.repeatedBlockThreshold, DEFAULT_ESCALATION_POLICY.repeatedBlockThreshold, 1),
    recoveryFailureThreshold: normalizeNumber(rawPolicy.recoveryFailureThreshold, DEFAULT_ESCALATION_POLICY.recoveryFailureThreshold, 1),
    diagnosticsChannel: normalizeString(rawPolicy.diagnosticsChannel, DEFAULT_ESCALATION_POLICY.diagnosticsChannel),
    defaultRecoveryAction: normalizeEnum(
      rawPolicy.defaultRecoveryAction,
      KERNEL_PANIC_RECOVERY_ACTIONS,
      DEFAULT_ESCALATION_POLICY.defaultRecoveryAction
    ),
    redactsRawOutput: rawPolicy.redactsRawOutput === false ? false : true
  };
}

function redactPanicMetadata(value, key = '') {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((entry) => redactPanicMetadata(entry, key));
  if (typeof value === 'object') {
    return Object.keys(value).reduce((result, entryKey) => {
      result[entryKey] = redactPanicMetadata(value[entryKey], entryKey);
      return result;
    }, {});
  }
  if (typeof value !== 'string') return value;
  const normalizedKey = normalizeString(key, '').toLowerCase();
  const sensitiveKey = /(value|html|markup|raw|payload|sample|source|script)/u.test(normalizedKey);
  const unsafeSample = /<\s*script\b|javascript:|vbscript:|srcdoc/i.test(value);
  if (sensitiveKey || unsafeSample) {
    return {
      redacted: true,
      length: value.length
    };
  }
  return value.length > 256 ? `${value.slice(0, 253)}...` : value;
}

function createPanicId(input = {}) {
  const seed = normalizeString(input.panicId || input.correlationId, '');
  if (seed) return `panic:${seed}`;
  return `panic:${normalizeString(input.scope, 'kernel')}:${normalizeString(input.trigger, 'manual')}`;
}

function createKernelPanicState(input = {}) {
  const state = normalizeEnum(input.state, KERNEL_PANIC_STATES, 'none');
  const now = Number.isFinite(input.at) ? input.at : Date.now();
  return {
    schema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    monitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
    state,
    previousState: normalizeEnum(input.previousState, KERNEL_PANIC_STATES, state),
    severity: normalizeEnum(input.severity, KERNEL_PANIC_SEVERITIES, state === 'none' ? 'info' : 'warning'),
    trigger: normalizeEnum(input.trigger, KERNEL_PANIC_TRIGGERS, 'manual'),
    panicId: normalizeString(input.panicId, null),
    correlationId: normalizeString(input.correlationId, null),
    sourceRef: normalizeString(input.sourceRef, null),
    scope: normalizeString(input.scope, null),
    sink: normalizeString(input.sink, null),
    reasonCode: normalizeString(input.reasonCode, null),
    diagnosticCode: normalizeString(input.diagnosticCode, null),
    blockedCommitCount: normalizeNumber(input.blockedCommitCount, 0, 0),
    criticalViolationCount: normalizeNumber(input.criticalViolationCount, 0, 0),
    recoveryAttemptCount: normalizeNumber(input.recoveryAttemptCount, 0, 0),
    recoveryFailureCount: normalizeNumber(input.recoveryFailureCount, 0, 0),
    recoveryAction: normalizeEnum(input.recoveryAction, KERNEL_PANIC_RECOVERY_ACTIONS, 'none'),
    affectedScopes: Array.isArray(input.affectedScopes) ? Array.from(new Set(input.affectedScopes.filter(Boolean).map(String))) : [],
    affectedJobs: Array.isArray(input.affectedJobs) ? Array.from(new Set(input.affectedJobs.filter(Boolean).map(String))) : [],
    activeSince: Number.isFinite(input.activeSince) ? input.activeSince : null,
    recoveringSince: Number.isFinite(input.recoveringSince) ? input.recoveringSince : null,
    recoveredAt: Number.isFinite(input.recoveredAt) ? input.recoveredAt : null,
    failedAt: Number.isFinite(input.failedAt) ? input.failedAt : null,
    lastSeenAt: Number.isFinite(input.lastSeenAt) ? input.lastSeenAt : now,
    eventCount: normalizeNumber(input.eventCount, 0, 0),
    lastEventId: normalizeString(input.lastEventId, null),
    lastVerdict: input.lastVerdict ? cloneJson(input.lastVerdict, null) : null,
    metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function createKernelPanicEvent(input = {}) {
  const at = Number.isFinite(input.at) ? input.at : Date.now();
  return {
    schema: RMT_KERNEL_PANIC_EVENT_SCHEMA,
    monitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    stateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
    eventId: normalizeString(input.eventId, `${RMT_KERNEL_PANIC_EVENT_SCHEMA}:${at}`),
    type: normalizeEnum(input.type, KERNEL_PANIC_EVENT_TYPES, 'signal-recorded'),
    previousState: normalizeEnum(input.previousState, KERNEL_PANIC_STATES, 'none'),
    state: normalizeEnum(input.state, KERNEL_PANIC_STATES, 'none'),
    severity: normalizeEnum(input.severity, KERNEL_PANIC_SEVERITIES, 'info'),
    trigger: normalizeEnum(input.trigger, KERNEL_PANIC_TRIGGERS, 'manual'),
    panicId: normalizeString(input.panicId, null),
    correlationId: normalizeString(input.correlationId, null),
    sourceRef: normalizeString(input.sourceRef, null),
    scope: normalizeString(input.scope, null),
    sink: normalizeString(input.sink, null),
    reasonCode: normalizeString(input.reasonCode, null),
    diagnosticCode: normalizeString(input.diagnosticCode, null),
    blockedCommitCount: normalizeNumber(input.blockedCommitCount, 0, 0),
    criticalViolationCount: normalizeNumber(input.criticalViolationCount, 0, 0),
    recoveryAttemptCount: normalizeNumber(input.recoveryAttemptCount, 0, 0),
    recoveryFailureCount: normalizeNumber(input.recoveryFailureCount, 0, 0),
    recoveryAction: normalizeEnum(input.recoveryAction, KERNEL_PANIC_RECOVERY_ACTIONS, 'none'),
    at,
    metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function normalizePanicSignal(input = {}, policy = DEFAULT_ESCALATION_POLICY) {
  const trigger = normalizeEnum(input.trigger, KERNEL_PANIC_TRIGGERS, 'manual');
  const severity = normalizeEnum(input.severity, KERNEL_PANIC_SEVERITIES, input.critical === true ? 'critical' : 'warning');
  const verdict = normalizeString(input.verdict, '');
  const blocked = input.blocked === true
    || input.commitAllowed === false
    || verdict === 'blocked'
    || trigger === 'trust-verdict-blocked'
    || trigger === 'adapter-output-blocked';
  const critical = input.critical === true
    || input.panicCandidate === true
    || verdict === 'panic'
    || trigger === 'trust-verdict-panic'
    || severity === 'critical'
    || severity === 'fatal';
  const recoveryFailure = trigger === 'recovery-failure' || input.recoveryFailure === true;
  return {
    trigger,
    severity,
    verdict,
    blocked,
    critical,
    recoveryFailure,
    sourceRef: normalizeString(input.sourceRef, null),
    scope: normalizeString(input.scope, null),
    sink: normalizeString(input.sink, null),
    reasonCode: normalizeString(input.reasonCode, null),
    diagnosticCode: normalizeString(input.diagnosticCode, null),
    correlationId: normalizeString(input.correlationId, null),
    panicId: normalizeString(input.panicId, '') || (critical ? createPanicId(input) : null),
    recoveryAction: normalizeEnum(input.recoveryAction, KERNEL_PANIC_RECOVERY_ACTIONS, policy.defaultRecoveryAction),
    affectedJobs: Array.isArray(input.affectedJobs) ? input.affectedJobs : [],
    metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function createSignalFromTrustVerdict(verdictInput = {}, overrides = {}) {
  const verdict = verdictInput && typeof verdictInput === 'object' ? verdictInput : {};
  const verdictKind = normalizeString(verdict.verdict, verdict.commitAllowed === false ? 'blocked' : 'trusted');
  if (verdictKind !== 'blocked' && verdictKind !== 'panic' && verdict.panicCandidate !== true) {
    return null;
  }
  return normalizePanicSignal({
    ...overrides,
    trigger: verdictKind === 'panic' || verdict.panicCandidate === true ? 'trust-verdict-panic' : 'trust-verdict-blocked',
    verdict: verdictKind,
    blocked: verdict.commitAllowed === false || verdictKind === 'blocked',
    critical: verdict.panicCandidate === true || verdictKind === 'panic' || overrides.critical === true,
    severity: normalizeString(verdict.severity, verdictKind === 'panic' ? 'fatal' : 'error'),
    sourceRef: verdict.sourceRef,
    scope: verdict.scope,
    sink: verdict.sink,
    reasonCode: verdict.reasonCode,
    diagnosticCode: verdict.diagnosticCode,
    correlationId: verdict.correlationId,
    panicId: overrides.panicId || (verdict.panicCandidate === true || verdictKind === 'panic' ? createPanicId(verdict) : null),
    metadata: {
      ...cloneJson(overrides.metadata || {}, {}),
      verdictSchema: verdict.schema || RMT_KERNEL_TRUST_VERDICT_SCHEMA,
      authoritySchema: verdict.authoritySchema || RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
      trustVerdict: verdictKind,
      commitAllowed: verdict.commitAllowed === true,
      panicCandidate: verdict.panicCandidate === true,
      workpackage: verdict.workpackage || null
    }
  });
}

function createKernelPanicMonitorContract(options = {}) {
  const policy = mergeEscalationPolicy(options.escalationPolicy || options.policy || {});
  return {
    schema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    stateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    eventSchema: RMT_KERNEL_PANIC_EVENT_SCHEMA,
    trustAuthoritySchema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    trustVerdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    reportSchema: RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA,
    workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
    status: 'completed-panic-monitor-state-machine',
    module: RMT_KERNEL_PANIC_MONITOR_MODULE_PATH,
    suite: RMT_KERNEL_PANIC_MONITOR_SUITE_PATH,
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json',
    packageScript: RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT,
    hostNeutral: true,
    states: KERNEL_PANIC_STATES.slice(),
    severities: KERNEL_PANIC_SEVERITIES.slice(),
    triggers: KERNEL_PANIC_TRIGGERS.slice(),
    scopes: KERNEL_PANIC_SCOPES.slice(),
    eventTypes: KERNEL_PANIC_EVENT_TYPES.slice(),
    recoveryActions: KERNEL_PANIC_RECOVERY_ACTIONS.slice(),
    escalationPolicy: {
      repeatedBlockThreshold: policy.repeatedBlockThreshold,
      recoveryFailureThreshold: policy.recoveryFailureThreshold,
      criticalTrustViolationsActivate: policy.criticalTrustViolationsActivate,
      panicCandidateActivates: policy.panicCandidateActivates,
      fatalSeverityActivates: policy.fatalSeverityActivates,
      diagnosticsChannel: policy.diagnosticsChannel,
      defaultRecoveryAction: policy.defaultRecoveryAction,
      redactsRawOutput: policy.redactsRawOutput,
      triggerSources: Array.isArray(policy.triggerSources) ? policy.triggerSources.slice() : DEFAULT_ESCALATION_POLICY.triggerSources.slice()
    },
    runtimeAdapterHooks: [
      'recordTrustVerdict',
      'recordSignal',
      'beginRecovery',
      'completeRecovery',
      'failRecovery',
      'getSnapshot',
      'listEvents'
    ],
    handoff: [
      'RKSH-WP-05',
      'RKSH-WP-06',
      'RKSH-WP-08',
      'RKSH-WP-09'
    ]
  };
}

function createKernelPanicMonitor(options = {}) {
  const policy = mergeEscalationPolicy(options.escalationPolicy || options.policy || {});
  const diagnosticsHub = options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function'
    ? options.diagnosticsHub
    : null;
  const now = typeof options.now === 'function' ? options.now : (() => Date.now());
  const listeners = [];
  const events = [];
  let sequence = 0;
  let snapshot = createKernelPanicState({
    at: now(),
    metadata: {
      policy: {
        repeatedBlockThreshold: policy.repeatedBlockThreshold,
        recoveryFailureThreshold: policy.recoveryFailureThreshold
      }
    }
  });

  function notify(event) {
    if (diagnosticsHub) {
      try {
        diagnosticsHub.publish(policy.diagnosticsChannel, event, {
          source: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
          workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
          state: event.state,
          panicId: event.panicId || undefined,
          correlationId: event.correlationId || undefined
        });
      } catch (_error) {}
    }
    listeners.slice().forEach((listener) => {
      try {
        listener(event, cloneJson(snapshot, {}));
      } catch (_error) {}
    });
  }

  function rememberEvent(input = {}) {
    sequence += 1;
    const event = createKernelPanicEvent({
      ...input,
      eventId: `${RMT_KERNEL_PANIC_EVENT_SCHEMA}:${sequence}`,
      at: now()
    });
    events.push(event);
    notify(event);
    return event;
  }

  function updateSnapshot(next = {}, eventType = 'state-transition') {
    const previous = snapshot;
    const at = now();
    const event = rememberEvent({
      ...next,
      type: eventType,
      previousState: previous.state,
      state: next.state || previous.state,
      blockedCommitCount: next.blockedCommitCount !== undefined ? next.blockedCommitCount : previous.blockedCommitCount,
      criticalViolationCount: next.criticalViolationCount !== undefined ? next.criticalViolationCount : previous.criticalViolationCount,
      recoveryAttemptCount: next.recoveryAttemptCount !== undefined ? next.recoveryAttemptCount : previous.recoveryAttemptCount,
      recoveryFailureCount: next.recoveryFailureCount !== undefined ? next.recoveryFailureCount : previous.recoveryFailureCount
    });
    const nextState = normalizeEnum(next.state, KERNEL_PANIC_STATES, previous.state);
    const nextPanicId = normalizeString(next.panicId, previous.panicId);
    const nextScope = normalizeString(next.scope, previous.scope);
    const affectedScopes = Array.from(new Set([
      ...previous.affectedScopes,
      ...(nextScope ? [nextScope] : []),
      ...(Array.isArray(next.affectedScopes) ? next.affectedScopes : [])
    ].filter(Boolean).map(String)));
    const affectedJobs = Array.from(new Set([
      ...previous.affectedJobs,
      ...(Array.isArray(next.affectedJobs) ? next.affectedJobs : [])
    ].filter(Boolean).map(String)));
    snapshot = createKernelPanicState({
      ...previous,
      ...next,
      at,
      state: nextState,
      previousState: previous.state,
      panicId: nextPanicId,
      affectedScopes,
      affectedJobs,
      activeSince: nextState === 'active' && !previous.activeSince ? at : previous.activeSince,
      recoveringSince: nextState === 'recovering' ? at : (nextState === 'active' ? null : previous.recoveringSince),
      recoveredAt: nextState === 'recovered' ? at : previous.recoveredAt,
      failedAt: nextState === 'failed' ? at : previous.failedAt,
      lastSeenAt: at,
      eventCount: events.length,
      lastEventId: event.eventId
    });
    return cloneJson(snapshot, {});
  }

  function recordSignal(input = {}) {
    const signal = normalizePanicSignal(input, policy);
    const nextBlockedCount = snapshot.blockedCommitCount + (signal.blocked ? 1 : 0);
    const nextCriticalCount = snapshot.criticalViolationCount + (signal.critical ? 1 : 0);
    const nextRecoveryFailures = snapshot.recoveryFailureCount + (signal.recoveryFailure ? 1 : 0);
    let nextState = snapshot.state;
    let nextSeverity = signal.severity;
    let nextTrigger = signal.trigger;
    let eventType = 'signal-recorded';

    if (signal.recoveryFailure || nextRecoveryFailures >= policy.recoveryFailureThreshold && signal.trigger === 'recovery-failure') {
      nextState = 'failed';
      nextSeverity = 'fatal';
      nextTrigger = 'recovery-failure';
      eventType = 'recovery-failed';
    } else if (signal.critical && policy.criticalTrustViolationsActivate !== false) {
      nextState = 'active';
      nextSeverity = signal.severity === 'fatal' ? 'fatal' : 'critical';
      eventType = 'state-transition';
    } else if (signal.blocked && nextBlockedCount >= policy.repeatedBlockThreshold) {
      nextState = normalizeEnum(policy.thresholdState, KERNEL_PANIC_STATES, 'active');
      nextSeverity = nextState === 'active' ? 'critical' : 'error';
      nextTrigger = 'threshold-breached';
      eventType = 'state-transition';
    } else if (signal.blocked && (snapshot.state === 'none' || snapshot.state === 'recovered')) {
      nextState = normalizeEnum(policy.suspectedState, KERNEL_PANIC_STATES, 'suspected');
      nextSeverity = signal.severity === 'info' ? 'warning' : signal.severity;
      eventType = 'state-transition';
    }

    return updateSnapshot({
      state: nextState,
      severity: nextSeverity,
      trigger: nextTrigger,
      panicId: signal.panicId || snapshot.panicId || (nextState === 'active' ? createPanicId(signal) : null),
      correlationId: signal.correlationId || snapshot.correlationId,
      sourceRef: signal.sourceRef || snapshot.sourceRef,
      scope: signal.scope || snapshot.scope,
      sink: signal.sink || snapshot.sink,
      reasonCode: signal.reasonCode || snapshot.reasonCode,
      diagnosticCode: signal.diagnosticCode || snapshot.diagnosticCode,
      blockedCommitCount: nextBlockedCount,
      criticalViolationCount: nextCriticalCount,
      recoveryFailureCount: nextRecoveryFailures,
      recoveryAction: signal.recoveryAction,
      affectedJobs: signal.affectedJobs,
      lastVerdict: input.verdictSnapshot ? redactPanicMetadata(input.verdictSnapshot) : snapshot.lastVerdict,
      metadata: signal.metadata
    }, eventType);
  }

  function recordTrustVerdict(verdict, overrides = {}) {
    const signal = createSignalFromTrustVerdict(verdict, overrides);
    if (!signal) return cloneJson(snapshot, {});
    return recordSignal({
      ...signal,
      verdictSnapshot: {
        schema: verdict.schema || RMT_KERNEL_TRUST_VERDICT_SCHEMA,
        verdict: verdict.verdict,
        scope: verdict.scope,
        sink: verdict.sink,
        severity: verdict.severity,
        reasonCode: verdict.reasonCode,
        diagnosticCode: verdict.diagnosticCode,
        commitAllowed: verdict.commitAllowed,
        panicCandidate: verdict.panicCandidate === true,
        correlationId: verdict.correlationId
      }
    });
  }

  function beginRecovery(input = {}) {
    return updateSnapshot({
      state: 'recovering',
      severity: 'warning',
      trigger: normalizeEnum(input.trigger, KERNEL_PANIC_TRIGGERS, 'manual'),
      recoveryAttemptCount: snapshot.recoveryAttemptCount + 1,
      recoveryAction: normalizeEnum(input.recoveryAction || input.action, KERNEL_PANIC_RECOVERY_ACTIONS, policy.defaultRecoveryAction),
      correlationId: normalizeString(input.correlationId, snapshot.correlationId),
      panicId: normalizeString(input.panicId, snapshot.panicId),
      metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
    }, 'recovery-started');
  }

  function completeRecovery(input = {}) {
    return updateSnapshot({
      state: 'recovered',
      severity: 'info',
      trigger: normalizeEnum(input.trigger, KERNEL_PANIC_TRIGGERS, 'manual'),
      recoveryAction: normalizeEnum(input.recoveryAction || input.action, KERNEL_PANIC_RECOVERY_ACTIONS, snapshot.recoveryAction || policy.defaultRecoveryAction),
      correlationId: normalizeString(input.correlationId, snapshot.correlationId),
      panicId: normalizeString(input.panicId, snapshot.panicId),
      metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
    }, 'recovery-completed');
  }

  function failRecovery(input = {}) {
    return updateSnapshot({
      state: 'failed',
      severity: 'fatal',
      trigger: 'recovery-failure',
      recoveryFailureCount: snapshot.recoveryFailureCount + 1,
      recoveryAction: normalizeEnum(input.recoveryAction || input.action, KERNEL_PANIC_RECOVERY_ACTIONS, snapshot.recoveryAction || policy.defaultRecoveryAction),
      reasonCode: normalizeString(input.reasonCode, 'rmt.kernel.panic.recovery_failed'),
      diagnosticCode: normalizeString(input.diagnosticCode, 'rmt.kernel.panic.recovery_failed'),
      correlationId: normalizeString(input.correlationId, snapshot.correlationId),
      panicId: normalizeString(input.panicId, snapshot.panicId),
      metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
    }, 'recovery-failed');
  }

  function reset(input = {}) {
    const previousState = snapshot.state;
    snapshot = createKernelPanicState({
      at: now(),
      previousState,
      metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
    });
    const event = rememberEvent({
      type: 'reset',
      previousState,
      state: snapshot.state,
      severity: 'info',
      trigger: normalizeEnum(input.trigger, KERNEL_PANIC_TRIGGERS, 'manual'),
      correlationId: normalizeString(input.correlationId, null),
      panicId: normalizeString(input.panicId, null),
      metadata: redactPanicMetadata(cloneJson(input.metadata || {}, {}))
    });
    snapshot.eventCount = events.length;
    snapshot.lastEventId = event.eventId;
    return cloneJson(snapshot, {});
  }

  return {
    schema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    contract: createKernelPanicMonitorContract({ escalationPolicy: policy }),
    getEscalationPolicy() {
      return cloneJson(policy, {});
    },
    getSnapshot() {
      return cloneJson(snapshot, {});
    },
    getState() {
      return snapshot.state;
    },
    listEvents() {
      return events.map((event) => cloneJson(event, {}));
    },
    recordSignal,
    recordTrustVerdict,
    beginRecovery,
    completeRecovery,
    failRecovery,
    reset,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => false;
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index === -1) return false;
        listeners.splice(index, 1);
        return true;
      };
    }
  };
}

function serializeKernelPanicState(state) {
  return JSON.stringify(stableSort(state));
}

function serializeKernelPanicEvent(event) {
  return JSON.stringify(stableSort(event));
}

function serializeKernelPanicMonitorContract(contract) {
  return JSON.stringify(stableSort(contract));
}

module.exports = {
  DEFAULT_ESCALATION_POLICY,
  KERNEL_PANIC_EVENT_TYPES,
  KERNEL_PANIC_RECOVERY_ACTIONS,
  KERNEL_PANIC_SCOPES,
  KERNEL_PANIC_SEVERITIES,
  KERNEL_PANIC_STATES,
  KERNEL_PANIC_TRIGGERS,
  RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_PANIC_EVENT_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH,
  RMT_KERNEL_PANIC_MONITOR_MODULE_PATH,
  RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT,
  RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_SUITE_PATH,
  RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
  RMT_KERNEL_PANIC_MONITOR_WP_PATH,
  RMT_KERNEL_PANIC_STATE_SCHEMA,
  createKernelPanicEvent,
  createKernelPanicMonitor,
  createKernelPanicMonitorContract,
  createKernelPanicState,
  createSignalFromTrustVerdict,
  normalizePanicSignal,
  redactPanicMetadata,
  serializeKernelPanicEvent,
  serializeKernelPanicMonitorContract,
  serializeKernelPanicState
};
