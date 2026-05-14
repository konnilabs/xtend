'use strict';

const {
  RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_STATE_SCHEMA,
  createKernelPanicMonitor
} = require('./kernel-panic-monitor');

const RMT_KERNEL_ESCALATION_POLICY_SCHEMA = 'xtend.rmt.kernel-escalation-policy.v1';
const RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA = 'xtend.rmt.kernel-escalation-envelope.v1';
const RMT_KERNEL_ESCALATION_REPORT_SCHEMA = 'xtend.rmt.kernel-escalation-report.v1';
const RMT_KERNEL_ESCALATION_SCHEMA = 'xtend.rmt.kernel-escalation.v1';
const RMT_KERNEL_ESCALATION_WORKPACKAGE = 'RKSH-WP-06';
const RMT_KERNEL_ESCALATION_MODULE_PATH = 'tools/rmt-language/kernel-escalation.js';
const RMT_KERNEL_ESCALATION_SUITE_PATH = 'tests/rmt-language/rmt_kernel_escalation_suite.js';
const RMT_KERNEL_ESCALATION_CONTRACT_PATH = 'development/XTendRMT-Kernel-Escalation-Contract.md';
const RMT_KERNEL_ESCALATION_WP_PATH = 'development/WP-RKSH-06-Diagnostics-und-Command-Bus-Eskalation-anbinden.md';
const RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-escalation';
const RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL = 'rmt.kernel.escalation';

const KERNEL_ESCALATION_SOURCES = Object.freeze([
  'diagnostics',
  'command-bus',
  'scheduler',
  'adapter',
  'kernel'
]);

const KERNEL_ESCALATION_EVENT_TYPES = Object.freeze([
  'diagnostics-subscriber-failure',
  'command-handler-failure',
  'command-response-failed',
  'command-missing-handler',
  'command-subscriber-failure',
  'manual'
]);

const KERNEL_ESCALATION_SEVERITIES = Object.freeze([
  'info',
  'warning',
  'error',
  'critical',
  'fatal'
]);

const DEFAULT_KERNEL_ESCALATION_POLICY = Object.freeze({
  diagnosticsSubscriberFailureSeverity: 'warning',
  commandHandlerFailureSeverity: 'error',
  missingCommandHandlerSeverity: 'error',
  commandSubscriberFailureSeverity: 'warning',
  panicSeverityThreshold: 'critical',
  diagnosticsChannel: RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL,
  panicDiagnosticsChannel: RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  escalateCriticalDiagnostics: true,
  escalateCriticalCommandFailures: true,
  passthroughNonCriticalFailures: true,
  redactsPayload: true,
  trustRelevantActivatesPanic: true
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
  const index = KERNEL_ESCALATION_SEVERITIES.indexOf(normalizeString(severity, 'info'));
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
      message: normalizeString(error.message, 'kernel escalation failure'),
      stack: normalizeString(error.stack, '')
    };
  }
  if (typeof error === 'object') {
    return {
      name: normalizeString(error.name, 'Error'),
      message: normalizeString(error.message || error.error || 'kernel escalation failure'),
      stack: normalizeString(error.stack, '')
    };
  }
  return {
    name: 'Error',
    message: normalizeString(error, 'kernel escalation failure'),
    stack: ''
  };
}

function redactEscalationMetadata(value, key = '') {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((entry) => redactEscalationMetadata(entry, key));
  if (typeof value === 'object') {
    return Object.keys(value).reduce((result, entryKey) => {
      result[entryKey] = redactEscalationMetadata(value[entryKey], entryKey);
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

function createKernelEscalationPolicy(input = {}) {
  const rawPolicy = input && typeof input === 'object' ? input : {};
  return {
    schema: RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
    escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
    diagnosticsSubscriberFailureSeverity: normalizeEnum(rawPolicy.diagnosticsSubscriberFailureSeverity, KERNEL_ESCALATION_SEVERITIES, DEFAULT_KERNEL_ESCALATION_POLICY.diagnosticsSubscriberFailureSeverity),
    commandHandlerFailureSeverity: normalizeEnum(rawPolicy.commandHandlerFailureSeverity, KERNEL_ESCALATION_SEVERITIES, DEFAULT_KERNEL_ESCALATION_POLICY.commandHandlerFailureSeverity),
    missingCommandHandlerSeverity: normalizeEnum(rawPolicy.missingCommandHandlerSeverity, KERNEL_ESCALATION_SEVERITIES, DEFAULT_KERNEL_ESCALATION_POLICY.missingCommandHandlerSeverity),
    commandSubscriberFailureSeverity: normalizeEnum(rawPolicy.commandSubscriberFailureSeverity, KERNEL_ESCALATION_SEVERITIES, DEFAULT_KERNEL_ESCALATION_POLICY.commandSubscriberFailureSeverity),
    panicSeverityThreshold: normalizeEnum(rawPolicy.panicSeverityThreshold, KERNEL_ESCALATION_SEVERITIES, DEFAULT_KERNEL_ESCALATION_POLICY.panicSeverityThreshold),
    diagnosticsChannel: normalizeString(rawPolicy.diagnosticsChannel, DEFAULT_KERNEL_ESCALATION_POLICY.diagnosticsChannel),
    panicDiagnosticsChannel: normalizeString(rawPolicy.panicDiagnosticsChannel, DEFAULT_KERNEL_ESCALATION_POLICY.panicDiagnosticsChannel),
    escalateCriticalDiagnostics: rawPolicy.escalateCriticalDiagnostics === false ? false : true,
    escalateCriticalCommandFailures: rawPolicy.escalateCriticalCommandFailures === false ? false : true,
    passthroughNonCriticalFailures: rawPolicy.passthroughNonCriticalFailures === false ? false : true,
    redactsPayload: rawPolicy.redactsPayload === false ? false : true,
    trustRelevantActivatesPanic: rawPolicy.trustRelevantActivatesPanic === false ? false : true
  };
}

function inferDefaultSeverity(input = {}, policy = createKernelEscalationPolicy()) {
  const eventType = normalizeString(input.eventType, '');
  if (eventType === 'diagnostics-subscriber-failure') return policy.diagnosticsSubscriberFailureSeverity;
  if (eventType === 'command-missing-handler') return policy.missingCommandHandlerSeverity;
  if (eventType === 'command-subscriber-failure') return policy.commandSubscriberFailureSeverity;
  if (eventType === 'command-handler-failure' || eventType === 'command-response-failed') return policy.commandHandlerFailureSeverity;
  return 'warning';
}

function createKernelEscalationEnvelope(input = {}, options = {}) {
  const policy = createKernelEscalationPolicy(options.policy || {});
  const source = normalizeEnum(input.source, KERNEL_ESCALATION_SOURCES, 'kernel');
  const eventType = normalizeEnum(input.eventType, KERNEL_ESCALATION_EVENT_TYPES, 'manual');
  const severity = normalizeEnum(input.severity, KERNEL_ESCALATION_SEVERITIES, inferDefaultSeverity({ eventType }, policy));
  const trustRelevant = input.trustRelevant === true;
  const panicRelevant = input.panicRelevant === true
    || input.critical === true
    || input.panicCandidate === true
    || isSeverityAtLeast(severity, policy.panicSeverityThreshold)
    || (trustRelevant && policy.trustRelevantActivatesPanic !== false);
  const trigger = source === 'diagnostics' ? 'diagnostics-failure' : (source === 'command-bus' ? 'command-bus-failure' : 'manual');
  const createdAt = Number.isFinite(input.createdAt) ? input.createdAt : Date.now();
  const scope = normalizeString(input.scope, source);
  return {
    schema: RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
    escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
    policySchema: RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
    envelopeId: normalizeString(input.envelopeId, `${RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA}:${source}:${eventType}:${createdAt}`),
    source,
    eventType,
    severity,
    panicRelevant,
    trustRelevant,
    trigger,
    scope,
    sourceRef: normalizeString(input.sourceRef, null),
    channel: normalizeString(input.channel, null),
    commandName: normalizeString(input.commandName, null),
    correlationId: normalizeString(input.correlationId, null),
    rootId: normalizeString(input.rootId, null),
    responseStatus: normalizeString(input.responseStatus, null),
    reasonCode: normalizeString(input.reasonCode, `${RMT_KERNEL_ESCALATION_SCHEMA}.${eventType}`),
    diagnosticCode: normalizeString(input.diagnosticCode, `rmt.kernel.escalation.${eventType}`),
    error: serializeError(input.error),
    createdAt,
    panicSignal: {
      trigger,
      severity,
      critical: panicRelevant,
      scope,
      sourceRef: normalizeString(input.sourceRef, null),
      reasonCode: normalizeString(input.reasonCode, `${RMT_KERNEL_ESCALATION_SCHEMA}.${eventType}`),
      diagnosticCode: normalizeString(input.diagnosticCode, `rmt.kernel.escalation.${eventType}`),
      correlationId: normalizeString(input.correlationId, null),
      metadata: redactEscalationMetadata({
        escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
        envelopeId: normalizeString(input.envelopeId, null),
        source,
        eventType,
        commandName: normalizeString(input.commandName, null),
        channel: normalizeString(input.channel, null),
        rootId: normalizeString(input.rootId, null)
      })
    },
    metadata: policy.redactsPayload === false
      ? cloneJson(input.metadata || {}, {})
      : redactEscalationMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function createKernelEscalationContract(options = {}) {
  const policy = createKernelEscalationPolicy(options.policy || options.escalationPolicy || {});
  return {
    schema: RMT_KERNEL_ESCALATION_SCHEMA,
    policySchema: RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
    envelopeSchema: RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    reportSchema: RMT_KERNEL_ESCALATION_REPORT_SCHEMA,
    workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
    status: 'completed-diagnostics-command-bus-escalation',
    module: RMT_KERNEL_ESCALATION_MODULE_PATH,
    suite: RMT_KERNEL_ESCALATION_SUITE_PATH,
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-escalation --json',
    packageScript: RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT,
    diagnosticsChannel: RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL,
    hostNeutral: true,
    sources: KERNEL_ESCALATION_SOURCES.slice(),
    eventTypes: KERNEL_ESCALATION_EVENT_TYPES.slice(),
    severities: KERNEL_ESCALATION_SEVERITIES.slice(),
    defaultPolicy: policy,
    runtimeAdapterHooks: [
      'recordEscalation',
      'listEscalations',
      'getEscalationPolicy',
      'recordDiagnosticsSubscriberFailure',
      'recordCommandHandlerFailure',
      'recordCommandResponseFailure'
    ],
    handoff: [
      'RKSH-WP-07',
      'RKSH-WP-08',
      'RKSH-WP-09'
    ]
  };
}

function createKernelEscalationController(options = {}) {
  const policy = createKernelEscalationPolicy(options.policy || options.escalationPolicy || {});
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
  const envelopes = [];

  function publishEnvelope(envelope) {
    if (!diagnosticsHub || typeof diagnosticsHub.publish !== 'function') return;
    try {
      diagnosticsHub.publish(policy.diagnosticsChannel, envelope, {
        source: RMT_KERNEL_ESCALATION_SCHEMA,
        workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
        severity: envelope.severity,
        eventType: envelope.eventType,
        panicRelevant: envelope.panicRelevant === true,
        correlationId: envelope.correlationId || undefined
      });
    } catch (_error) {}
  }

  function signalPanic(envelope) {
    if (!envelope || envelope.panicRelevant !== true || !panicMonitor || typeof panicMonitor.recordSignal !== 'function') {
      return null;
    }
    return panicMonitor.recordSignal({
      ...envelope.panicSignal,
      metadata: {
        ...cloneJson(envelope.panicSignal && envelope.panicSignal.metadata || {}, {}),
        envelopeId: envelope.envelopeId
      }
    });
  }

  function recordEscalation(input = {}) {
    const envelope = createKernelEscalationEnvelope({
      ...input,
      createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now()
    }, { policy });
    const panicState = signalPanic(envelope);
    const finalEnvelope = {
      ...envelope,
      panicState: panicState ? cloneJson(panicState, null) : null
    };
    envelopes.push(finalEnvelope);
    publishEnvelope(finalEnvelope);
    return cloneJson(finalEnvelope, {});
  }

  function recordDiagnosticsSubscriberFailure(input = {}) {
    return recordEscalation({
      ...input,
      source: 'diagnostics',
      eventType: 'diagnostics-subscriber-failure',
      scope: normalizeString(input.scope, 'diagnostics'),
      severity: normalizeString(input.severity, policy.diagnosticsSubscriberFailureSeverity)
    });
  }

  function recordCommandHandlerFailure(input = {}) {
    return recordEscalation({
      ...input,
      source: 'command-bus',
      eventType: 'command-handler-failure',
      scope: normalizeString(input.scope, 'command-bus'),
      severity: normalizeString(input.severity, policy.commandHandlerFailureSeverity),
      responseStatus: normalizeString(input.responseStatus, 'failed')
    });
  }

  function recordCommandResponseFailure(input = {}) {
    return recordEscalation({
      ...input,
      source: 'command-bus',
      eventType: 'command-response-failed',
      scope: normalizeString(input.scope, 'command-bus'),
      severity: normalizeString(input.severity, policy.commandHandlerFailureSeverity),
      responseStatus: normalizeString(input.responseStatus, 'failed')
    });
  }

  function recordCommandSubscriberFailure(input = {}) {
    return recordEscalation({
      ...input,
      source: 'command-bus',
      eventType: 'command-subscriber-failure',
      scope: normalizeString(input.scope, 'command-bus'),
      severity: normalizeString(input.severity, policy.commandSubscriberFailureSeverity)
    });
  }

  return {
    schema: RMT_KERNEL_ESCALATION_SCHEMA,
    contract: createKernelEscalationContract({ policy }),
    policy,
    panicMonitor,
    getEscalationPolicy() {
      return cloneJson(policy, {});
    },
    recordEscalation,
    recordDiagnosticsSubscriberFailure,
    recordCommandHandlerFailure,
    recordCommandResponseFailure,
    recordCommandSubscriberFailure,
    listEscalations() {
      return envelopes.map((envelope) => cloneJson(envelope, {}));
    }
  };
}

function serializeKernelEscalationContract(contract) {
  return JSON.stringify(stableSort(contract));
}

function serializeKernelEscalationEnvelope(envelope) {
  return JSON.stringify(stableSort(envelope));
}

module.exports = {
  DEFAULT_KERNEL_ESCALATION_POLICY,
  KERNEL_ESCALATION_EVENT_TYPES,
  KERNEL_ESCALATION_SEVERITIES,
  KERNEL_ESCALATION_SOURCES,
  RMT_KERNEL_ESCALATION_CONTRACT_PATH,
  RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
  RMT_KERNEL_ESCALATION_MODULE_PATH,
  RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT,
  RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
  RMT_KERNEL_ESCALATION_REPORT_SCHEMA,
  RMT_KERNEL_ESCALATION_SCHEMA,
  RMT_KERNEL_ESCALATION_SUITE_PATH,
  RMT_KERNEL_ESCALATION_WORKPACKAGE,
  RMT_KERNEL_ESCALATION_WP_PATH,
  createKernelEscalationContract,
  createKernelEscalationController,
  createKernelEscalationEnvelope,
  createKernelEscalationPolicy,
  redactEscalationMetadata,
  serializeKernelEscalationContract,
  serializeKernelEscalationEnvelope
};
