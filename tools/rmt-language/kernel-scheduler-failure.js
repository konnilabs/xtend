'use strict';

const {
  RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_STATE_SCHEMA,
  createKernelPanicMonitor
} = require('./kernel-panic-monitor');

const RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA = 'xtend.rmt.kernel-scheduler-failure-policy.v1';
const RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA = 'xtend.rmt.kernel-scheduler-failure-record.v1';
const RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA = 'xtend.rmt.kernel-scheduler-failure-report.v1';
const RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA = 'xtend.rmt.kernel-scheduler-failure.v1';
const RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE = 'RKSH-WP-07';
const RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH = 'tools/rmt-language/kernel-scheduler-failure.js';
const RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH = 'tests/rmt-language/rmt_kernel_scheduler_failure_suite.js';
const RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH = 'development/XTendRMT-Kernel-Scheduler-Failure-Contract.md';
const RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH = 'development/WP-RKSH-07-Scheduler-Failure-Semantik-korrigieren.md';
const RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-scheduler-failure';
const RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL = 'rmt.kernel.scheduler_failure';
const RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL = 'rmt.kernel.escalation';

const KERNEL_SCHEDULER_FINAL_STATUSES = Object.freeze([
  'scheduled',
  'dispatch_pending',
  'running',
  'executed',
  'failed',
  'cancelled',
  'aborted',
  'stale_scope',
  'stale_root',
  'panic_blocked'
]);

const KERNEL_SCHEDULER_FAILURE_STATUSES = Object.freeze([
  'failed',
  'aborted',
  'panic_blocked'
]);

const KERNEL_SCHEDULER_FAILURE_SEVERITIES = Object.freeze([
  'info',
  'warning',
  'error',
  'critical',
  'fatal'
]);

const DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY = Object.freeze({
  callbackFailureSeverity: 'critical',
  abortSeverity: 'error',
  panicBlockedSeverity: 'critical',
  backpressureSeverity: 'critical',
  panicSeverityThreshold: 'critical',
  diagnosticsChannel: RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL,
  escalationDiagnosticsChannel: RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL,
  panicDiagnosticsChannel: RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  callbackFailureActivatesPanic: true,
  backpressureActivatesPanic: true,
  trustRelevantActivatesPanic: true,
  redactsPayload: true
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

function severityRank(severity) {
  const index = KERNEL_SCHEDULER_FAILURE_SEVERITIES.indexOf(normalizeString(severity, 'info'));
  return index === -1 ? 0 : index;
}

function isSeverityAtLeast(severity, threshold) {
  return severityRank(severity) >= severityRank(threshold);
}

function serializeError(error) {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      name: normalizeString(error.name, 'Error'),
      message: normalizeString(error.message, 'scheduler callback failed'),
      stack: normalizeString(error.stack, '')
    };
  }
  if (typeof error === 'object') {
    return {
      name: normalizeString(error.name, 'Error'),
      message: normalizeString(error.message || error.error || 'scheduler callback failed'),
      stack: normalizeString(error.stack, '')
    };
  }
  return {
    name: 'Error',
    message: normalizeString(error, 'scheduler callback failed'),
    stack: ''
  };
}

function redactSchedulerFailureMetadata(value, key = '') {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((entry) => redactSchedulerFailureMetadata(entry, key));
  if (typeof value === 'object') {
    return Object.keys(value).reduce((result, entryKey) => {
      result[entryKey] = redactSchedulerFailureMetadata(value[entryKey], entryKey);
      return result;
    }, {});
  }
  if (typeof value !== 'string') return value;
  const normalizedKey = normalizeString(key, '').toLowerCase();
  const sensitiveKey = /(payload|value|html|markup|raw|sample|source|script|token|secret|password)/u.test(normalizedKey);
  const unsafeSample = /<\s*script\b|javascript:|vbscript:|srcdoc|onerror\s*=|onclick\s*=/iu.test(value);
  if (sensitiveKey || unsafeSample) {
    return {
      redacted: true,
      length: value.length
    };
  }
  return value.length > 256 ? `${value.slice(0, 253)}...` : value;
}

function createKernelSchedulerFailurePolicy(input = {}) {
  const rawPolicy = input && typeof input === 'object' ? input : {};
  return {
    schema: RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
    schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
    callbackFailureSeverity: normalizeEnum(rawPolicy.callbackFailureSeverity, KERNEL_SCHEDULER_FAILURE_SEVERITIES, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.callbackFailureSeverity),
    abortSeverity: normalizeEnum(rawPolicy.abortSeverity, KERNEL_SCHEDULER_FAILURE_SEVERITIES, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.abortSeverity),
    panicBlockedSeverity: normalizeEnum(rawPolicy.panicBlockedSeverity, KERNEL_SCHEDULER_FAILURE_SEVERITIES, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.panicBlockedSeverity),
    backpressureSeverity: normalizeEnum(rawPolicy.backpressureSeverity, KERNEL_SCHEDULER_FAILURE_SEVERITIES, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.backpressureSeverity),
    panicSeverityThreshold: normalizeEnum(rawPolicy.panicSeverityThreshold, KERNEL_SCHEDULER_FAILURE_SEVERITIES, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.panicSeverityThreshold),
    diagnosticsChannel: normalizeString(rawPolicy.diagnosticsChannel, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.diagnosticsChannel),
    escalationDiagnosticsChannel: normalizeString(rawPolicy.escalationDiagnosticsChannel, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.escalationDiagnosticsChannel),
    panicDiagnosticsChannel: normalizeString(rawPolicy.panicDiagnosticsChannel, DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY.panicDiagnosticsChannel),
    callbackFailureActivatesPanic: rawPolicy.callbackFailureActivatesPanic === false ? false : true,
    backpressureActivatesPanic: rawPolicy.backpressureActivatesPanic === false ? false : true,
    trustRelevantActivatesPanic: rawPolicy.trustRelevantActivatesPanic === false ? false : true,
    redactsPayload: rawPolicy.redactsPayload === false ? false : true
  };
}

function classifySchedulerFinalStatus(input = {}) {
  const source = input && typeof input === 'object' ? input : { status: input };
  const status = normalizeString(source.finalStatus || source.status, '');
  const reason = normalizeString(source.reason || source.reasonCode || source.diagnosticCode, '').toLowerCase();
  if (KERNEL_SCHEDULER_FAILURE_STATUSES.includes(status)) return status;
  if (reason.includes('panic_blocked') || reason.includes('panic-blocked') || reason.includes('panic')) return 'panic_blocked';
  if (reason.includes('callback_error') || reason.includes('callback-error') || reason.includes('exception') || reason.includes('throw') || reason.includes('failed')) return 'failed';
  if (reason.includes('abort') || reason.includes('recovery') || reason.includes('quarantine')) return 'aborted';
  return normalizeEnum(status, KERNEL_SCHEDULER_FINAL_STATUSES, 'cancelled');
}

function inferSchedulerFailureSeverity(status, input = {}, policy = createKernelSchedulerFailurePolicy()) {
  if (input.severity) return normalizeEnum(input.severity, KERNEL_SCHEDULER_FAILURE_SEVERITIES, 'error');
  if (status === 'panic_blocked') return policy.panicBlockedSeverity;
  if (status === 'aborted') return policy.abortSeverity;
  return policy.callbackFailureSeverity;
}

function createKernelSchedulerFailureRecord(input = {}, options = {}) {
  const policy = createKernelSchedulerFailurePolicy(options.policy || options.schedulerFailurePolicy || {});
  const status = classifySchedulerFinalStatus(input);
  const severity = inferSchedulerFailureSeverity(status, input, policy);
  const trustRelevant = input.trustRelevant === true || input.criticalTrustBoundary === true;
  const panicRelevant = input.panicRelevant === true
    || input.critical === true
    || status === 'panic_blocked'
    || (status === 'failed' && policy.callbackFailureActivatesPanic !== false)
    || (normalizeString(input.eventType, '') === 'scheduler-backpressure-critical' && policy.backpressureActivatesPanic !== false)
    || (trustRelevant && policy.trustRelevantActivatesPanic !== false)
    || isSeverityAtLeast(severity, policy.panicSeverityThreshold);
  const createdAt = Number.isFinite(input.createdAt) ? input.createdAt : Date.now();
  const jobId = normalizeString(input.jobId || input.id, normalizeString(input.eventType, 'scheduler-job'));
  const reason = normalizeString(input.reason, status === 'failed' ? 'callback_error' : status);
  return {
    schema: RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
    schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    policySchema: RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
    recordId: normalizeString(input.recordId, `${RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA}:${jobId}:${createdAt}`),
    eventType: normalizeString(input.eventType, 'scheduler-job-failure'),
    jobId,
    status,
    reason,
    severity,
    panicRelevant,
    trustRelevant,
    trigger: normalizeString(input.trigger, status === 'panic_blocked' && input.eventType === 'scheduler-backpressure-critical' ? 'scheduler-backpressure' : 'scheduler-failure'),
    scope: normalizeString(input.scope, 'scheduler-job'),
    sourceRef: normalizeString(input.sourceRef, `scheduler-job:${jobId}`),
    rootId: normalizeString(input.rootId, null),
    rootVersion: Number.isFinite(input.rootVersion) ? input.rootVersion : null,
    lane: normalizeString(input.lane, ''),
    strategy: normalizeString(input.strategy || input.executionStrategy, ''),
    pressureLevel: normalizeString(input.pressureLevel, null),
    waitMs: Math.max(Number(input.waitMs) || 0, 0),
    runMs: Math.max(Number(input.runMs) || 0, 0),
    scheduledAt: Number.isFinite(input.scheduledAt) ? input.scheduledAt : null,
    startedAt: Number.isFinite(input.startedAt) ? input.startedAt : null,
    finishedAt: Number.isFinite(input.finishedAt) ? input.finishedAt : createdAt,
    diagnosticCode: normalizeString(input.diagnosticCode, status === 'panic_blocked' ? 'rmt.kernel.scheduler.panic_blocked' : 'rmt.kernel.scheduler.callback_error'),
    reasonCode: normalizeString(input.reasonCode, status === 'panic_blocked' ? 'xtend.rmt.kernel-scheduler-failure.panic_blocked' : 'xtend.rmt.kernel-scheduler-failure.callback_error'),
    error: serializeError(input.error),
    metadata: policy.redactsPayload === false
      ? cloneJson(input.metadata || {}, {})
      : redactSchedulerFailureMetadata(cloneJson(input.metadata || {}, {})),
    createdAt
  };
}

function createKernelSchedulerFailureContract(options = {}) {
  const policy = createKernelSchedulerFailurePolicy(options.policy || options.schedulerFailurePolicy || {});
  return {
    schema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    policySchema: RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
    recordSchema: RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    reportSchema: RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA,
    workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
    status: 'completed-scheduler-failure-semantics',
    module: RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH,
    suite: RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH,
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json',
    packageScript: RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT,
    diagnosticsChannel: RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL,
    escalationDiagnosticsChannel: RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL,
    hostNeutral: true,
    finalStatuses: KERNEL_SCHEDULER_FINAL_STATUSES.slice(),
    failureStatuses: KERNEL_SCHEDULER_FAILURE_STATUSES.slice(),
    severities: KERNEL_SCHEDULER_FAILURE_SEVERITIES.slice(),
    defaultPolicy: policy,
    runtimeAdapterHooks: [
      'getSchedulerStats',
      'abortScope',
      'panicBlockScope',
      'reportPerformanceSample',
      'recordSchedulerFailure'
    ],
    invariants: [
      'callback_error_finalizes_failed_not_executed',
      'failed_aborted_panic_blocked_are_separate_metrics',
      'critical_scheduler_backpressure_records_panic_signal'
    ],
    handoff: [
      'RKSH-WP-08',
      'RKSH-WP-09'
    ]
  };
}

function createKernelSchedulerFailureController(options = {}) {
  const policy = createKernelSchedulerFailurePolicy(options.policy || options.schedulerFailurePolicy || {});
  const diagnosticsHub = options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function'
    ? options.diagnosticsHub
    : null;
  const panicMonitor = options.panicMonitor && typeof options.panicMonitor.recordSignal === 'function'
    ? options.panicMonitor
    : createKernelPanicMonitor({
      diagnosticsHub,
      escalationPolicy: options.panicEscalationPolicy || {}
    });
  const now = typeof options.now === 'function' ? options.now : (() => Date.now());
  const records = [];

  function publishRecord(record) {
    if (!diagnosticsHub || typeof diagnosticsHub.publish !== 'function') return;
    try {
      diagnosticsHub.publish(policy.diagnosticsChannel, record, {
        source: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
        workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
        status: record.status,
        severity: record.severity,
        panicRelevant: record.panicRelevant,
        jobId: record.jobId,
        scope: record.scope
      });
    } catch (_error) {}
    try {
      diagnosticsHub.publish(policy.escalationDiagnosticsChannel, {
        schema: 'xtend.rmt.kernel-escalation-envelope.v1',
        escalationSchema: 'xtend.rmt.kernel-escalation.v1',
        source: 'scheduler',
        eventType: record.eventType,
        severity: record.severity,
        panicRelevant: record.panicRelevant,
        trustRelevant: record.trustRelevant,
        trigger: record.trigger,
        scope: record.scope,
        sourceRef: record.sourceRef,
        correlationId: record.recordId,
        rootId: record.rootId,
        responseStatus: record.status,
        reasonCode: record.reasonCode,
        diagnosticCode: record.diagnosticCode,
        error: record.error,
        workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
        metadata: {
          schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
          recordId: record.recordId,
          lane: record.lane,
          strategy: record.strategy,
          pressureLevel: record.pressureLevel
        }
      }, {
        source: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
        workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
        severity: record.severity,
        panicRelevant: record.panicRelevant
      });
    } catch (_error) {}
  }

  function signalPanic(record) {
    if (!record || record.panicRelevant !== true || !panicMonitor || typeof panicMonitor.recordSignal !== 'function') {
      return null;
    }
    try {
      return panicMonitor.recordSignal({
        trigger: record.trigger,
        severity: record.severity,
        critical: true,
        scope: record.scope,
        sourceRef: record.sourceRef,
        reasonCode: record.reasonCode,
        diagnosticCode: record.diagnosticCode,
        correlationId: record.recordId,
        affectedJobs: record.jobId ? [String(record.jobId)] : [],
        metadata: {
          schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
          status: record.status,
          reason: record.reason,
          lane: record.lane,
          strategy: record.strategy,
          pressureLevel: record.pressureLevel
        }
      });
    } catch (_error) {
      return null;
    }
  }

  function recordFailure(input = {}) {
    const record = createKernelSchedulerFailureRecord({
      ...input,
      createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now()
    }, { policy });
    const panicState = signalPanic(record);
    const finalRecord = {
      ...record,
      panicState: panicState ? cloneJson(panicState, null) : null
    };
    records.push(finalRecord);
    publishRecord(finalRecord);
    return cloneJson(finalRecord, {});
  }

  function recordCallbackFailure(input = {}) {
    return recordFailure({
      ...input,
      status: 'failed',
      reason: normalizeString(input.reason, 'callback_error'),
      eventType: normalizeString(input.eventType, 'scheduler-job-failure'),
      trigger: normalizeString(input.trigger, 'scheduler-failure')
    });
  }

  function recordAbort(input = {}) {
    return recordFailure({
      ...input,
      status: 'aborted',
      reason: normalizeString(input.reason, 'scheduler_aborted'),
      eventType: normalizeString(input.eventType, 'scheduler-job-aborted'),
      trigger: normalizeString(input.trigger, 'scheduler-failure')
    });
  }

  function recordPanicBlocked(input = {}) {
    return recordFailure({
      ...input,
      status: 'panic_blocked',
      reason: normalizeString(input.reason, 'panic_blocked'),
      eventType: normalizeString(input.eventType, 'scheduler-job-panic-blocked'),
      trigger: normalizeString(input.trigger, 'scheduler-failure')
    });
  }

  function recordBackpressure(input = {}) {
    return recordFailure({
      ...input,
      status: 'panic_blocked',
      reason: normalizeString(input.reason, 'scheduler_backpressure_critical'),
      eventType: 'scheduler-backpressure-critical',
      trigger: 'scheduler-backpressure',
      severity: normalizeString(input.severity, policy.backpressureSeverity),
      pressureLevel: normalizeString(input.pressureLevel, 'critical'),
      scope: normalizeString(input.scope, 'scheduler-backpressure'),
      sourceRef: normalizeString(input.sourceRef, 'scheduler-pressure:critical')
    });
  }

  return {
    schema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    contract: createKernelSchedulerFailureContract({ policy }),
    policy,
    panicMonitor,
    getSchedulerFailurePolicy() {
      return cloneJson(policy, {});
    },
    recordFailure,
    recordCallbackFailure,
    recordAbort,
    recordPanicBlocked,
    recordBackpressure,
    listFailures() {
      return records.map((record) => cloneJson(record, {}));
    }
  };
}

function serializeKernelSchedulerFailureContract(contract) {
  return JSON.stringify(stableSort(contract));
}

function serializeKernelSchedulerFailureRecord(record) {
  return JSON.stringify(stableSort(record));
}

module.exports = {
  DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY,
  KERNEL_SCHEDULER_FAILURE_SEVERITIES,
  KERNEL_SCHEDULER_FAILURE_STATUSES,
  KERNEL_SCHEDULER_FINAL_STATUSES,
  RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT,
  RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
  RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH,
  classifySchedulerFinalStatus,
  createKernelSchedulerFailureContract,
  createKernelSchedulerFailureController,
  createKernelSchedulerFailurePolicy,
  createKernelSchedulerFailureRecord,
  redactSchedulerFailureMetadata,
  serializeKernelSchedulerFailureContract,
  serializeKernelSchedulerFailureRecord
};
