'use strict';

const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA
} = require('./runtime-capability-registry');
const {
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  sha256Value
} = require('./maraca-xtension-manifest');

const XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA = 'xtend.xtensions.diagnostic-trail.v1';
const XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA = 'xtend.xtensions.diagnostic-trail-record.v1';
const XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA = 'xtend.xtensions.diagnostic-trail-correlation.v1';
const XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA = 'xtend.xtensions.diagnostic-redaction-policy.v1';
const XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA = 'xtend.xtensions.diagnostic-trail-report.v1';
const XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH = 'tools/xtensions/diagnostic-trail.js';
const XTENSIONS_DIAGNOSTIC_TRAIL_TYPES_PATH = 'tools/xtensions/diagnostic-trail.d.ts';
const XTENSIONS_DIAGNOSTIC_TRAIL_SUITE_PATH = 'tests/xtensions/xtensions_diagnostic_trail_suite.js';
const XTENSIONS_DIAGNOSTIC_TRAIL_CONTRACT_PATH = 'development/XTensions-Diagnostic-Trail-Contract.md';
const XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH = 'tests/fixtures/xtensions/diagnostic-trail-valid.json';
const XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE = 'XTN-10';
const XTENSIONS_DIAGNOSTIC_TRAIL_PACKAGE_SCRIPT = 'npm run test:xtensions-diagnostic-trail';

const DIAGNOSTIC_TRAIL_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.diagnostic_trail.framework_dependency';
const DIAGNOSTIC_TRAIL_ACTION_UNSUPPORTED_CODE = 'xtensions.diagnostic_trail.action_unsupported';
const DIAGNOSTIC_TRAIL_CORRELATION_MISSING_CODE = 'xtensions.diagnostic_trail.correlation_missing';
const DIAGNOSTIC_TRAIL_PAYLOAD_NON_SERIALIZABLE_CODE = 'xtensions.diagnostic_trail.payload_non_serializable';
const DIAGNOSTIC_TRAIL_REDACTION_REQUIRED_CODE = 'xtensions.diagnostic_trail.redaction_required';
const DIAGNOSTIC_TRAIL_REDACTION_POLICY_INVALID_CODE = 'xtensions.diagnostic_trail.redaction_policy_invalid';
const DIAGNOSTIC_TRAIL_SEQUENCE_INVALID_CODE = 'xtensions.diagnostic_trail.sequence_invalid';

const DIAGNOSTIC_TRAIL_ACTIONS = Object.freeze([
  'mount',
  'update',
  'signal.receive',
  'event.emit',
  'suspend',
  'resume',
  'error',
  'unmount'
]);
const DIAGNOSTIC_TRAIL_STATUSES = Object.freeze([
  'observed',
  'ok',
  'skipped',
  'degraded',
  'failed',
  'policy-blocked'
]);
const DIAGNOSTIC_TRAIL_BOUNDARIES = Object.freeze([
  'diagnostic-trail-is-optional',
  'records-are-framework-free',
  'records-correlate-maraca-host-surface-lane-event',
  'payloads-are-redacted-before-ci-or-devtools',
  'redaction-is-policy-and-schema-driven',
  'trail-report-is-byte-stable',
  'raw-framework-objects-never-enter-trail',
  'audit-records-do-not-change-runtime-behavior'
]);
const REQUIRED_CORRELATION_FIELDS = Object.freeze([
  'xtensionId',
  'manifestId',
  'artifactId',
  'hostId',
  'surfaceId',
  'lane'
]);
const SENSITIVE_KEY_PATTERNS = Object.freeze([
  'password',
  'passwd',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'session',
  'apiKey',
  'privateKey',
  'email'
]);
const DEFAULT_REDACTION_POLICY = Object.freeze({
  schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
  mode: 'schema-policy',
  defaultAction: 'shape',
  sensitiveAction: 'hash',
  redactUnknownPayloads: true,
  passthroughSchemas: [
    'xtensions.lifecycle.summary.v1',
    'xtensions.diagnostic.summary.v1'
  ],
  schemaRules: [
    Object.freeze({
      payloadSchema: 'xtensions.user.profile.v1',
      action: 'allowlist',
      allow: ['id', 'role']
    }),
    Object.freeze({
      payloadSchema: 'xtensions.map.viewport-event.v1',
      action: 'shape'
    }),
    Object.freeze({
      payloadSchema: 'xtensions.chart.selection-event.v1',
      action: 'shape'
    }),
    Object.freeze({
      payloadSchema: 'xtensions.error.v1',
      action: 'hash'
    })
  ],
  fieldRules: [
    Object.freeze({ match: 'password', action: 'drop' }),
    Object.freeze({ match: 'token', action: 'hash' }),
    Object.freeze({ match: 'authorization', action: 'hash' }),
    Object.freeze({ match: 'cookie', action: 'hash' }),
    Object.freeze({ match: 'email', action: 'hash' }),
    Object.freeze({ match: 'secret', action: 'drop' })
  ]
});

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

function createDiagnosticTrailDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.xtensions.diagnostic-trail-diagnostic.v1',
    source: XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
    workpackage: XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
    severity,
    code,
    message,
    recordId: subject && subject.recordId || null,
    xtensionId: subject && subject.xtensionId || null,
    surfaceId: subject && subject.surfaceId || null,
    lane: subject && subject.lane || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function mergePolicy(policy = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  return {
    schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
    mode: normalizeString(source.mode || DEFAULT_REDACTION_POLICY.mode) || DEFAULT_REDACTION_POLICY.mode,
    defaultAction: normalizeString(source.defaultAction || DEFAULT_REDACTION_POLICY.defaultAction) || DEFAULT_REDACTION_POLICY.defaultAction,
    sensitiveAction: normalizeString(source.sensitiveAction || DEFAULT_REDACTION_POLICY.sensitiveAction) || DEFAULT_REDACTION_POLICY.sensitiveAction,
    redactUnknownPayloads: source.redactUnknownPayloads !== false,
    passthroughSchemas: toArray(source.passthroughSchemas || DEFAULT_REDACTION_POLICY.passthroughSchemas).map(normalizeString).filter(Boolean),
    schemaRules: toArray(source.schemaRules || DEFAULT_REDACTION_POLICY.schemaRules).map((rule) => ({ ...rule })),
    fieldRules: toArray(source.fieldRules || DEFAULT_REDACTION_POLICY.fieldRules).map((rule) => ({ ...rule }))
  };
}

function keyMatches(ruleMatch, key, path) {
  const match = normalizeString(ruleMatch).toLowerCase();
  if (!match) return false;
  const normalizedKey = normalizeString(key).toLowerCase();
  const normalizedPath = normalizeString(path).toLowerCase();
  return normalizedKey === match || normalizedKey.includes(match) || normalizedPath.endsWith(`.${match}`) || normalizedPath.includes(`.${match}.`);
}

function isSensitiveKey(key, path, policy) {
  const normalizedKey = normalizeString(key).toLowerCase();
  const normalizedPath = normalizeString(path).toLowerCase();
  const patternMatch = SENSITIVE_KEY_PATTERNS.some((pattern) => {
    const normalizedPattern = pattern.toLowerCase();
    return normalizedKey === normalizedPattern || normalizedKey.includes(normalizedPattern) || normalizedPath.includes(`.${normalizedPattern}`);
  });
  const ruleMatch = toArray(policy.fieldRules).some((rule) => keyMatches(rule.match, key, path));
  return patternMatch || ruleMatch;
}

function actionForField(key, path, policy) {
  const rule = toArray(policy.fieldRules).find((candidate) => keyMatches(candidate.match, key, path));
  if (rule && normalizeString(rule.action)) return normalizeString(rule.action);
  if (isSensitiveKey(key, path, policy)) return policy.sensitiveAction;
  return null;
}

function schemaRuleFor(payloadSchema, policy) {
  const schema = normalizeString(payloadSchema);
  return toArray(policy.schemaRules).find((rule) => normalizeString(rule.payloadSchema) === schema) || null;
}

function payloadShape(value) {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length
    };
  }
  if (value && typeof value === 'object') {
    return {
      type: 'object',
      keys: Object.keys(value).sort()
    };
  }
  return {
    type: value === null ? 'null' : typeof value
  };
}

function redactedMarker(action, value) {
  if (action === 'drop') return undefined;
  if (action === 'hash') {
    return {
      redacted: true,
      mode: 'hash',
      sha256: sha256Value(value)
    };
  }
  if (action === 'shape') {
    return {
      redacted: true,
      mode: 'shape',
      shape: payloadShape(value)
    };
  }
  return {
    redacted: true,
    mode: 'masked'
  };
}

function redactValue(value, context) {
  const {
    policy,
    path,
    key,
    seen,
    subject,
    redactions,
    diagnostics
  } = context;
  const valueType = typeof value;
  const fieldAction = key ? actionForField(key, path, policy) : null;

  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createDiagnosticTrailDiagnostic(
      subject,
      DIAGNOSTIC_TRAIL_PAYLOAD_NON_SERIALIZABLE_CODE,
      `Diagnostic trail payload field "${path}" must be serializable before audit.`,
      'error',
      { field: path, valueType }
    ));
    redactions.push({ path, action: 'drop', reason: 'non-serializable' });
    return undefined;
  }

  if (fieldAction) {
    redactions.push({ path, action: fieldAction, reason: 'field-policy' });
    return redactedMarker(fieldAction, value);
  }

  if (!value || valueType !== 'object') return value;
  if (seen.has(value)) {
    diagnostics.push(createDiagnosticTrailDiagnostic(
      subject,
      DIAGNOSTIC_TRAIL_PAYLOAD_NON_SERIALIZABLE_CODE,
      `Diagnostic trail payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    redactions.push({ path, action: 'drop', reason: 'cycle' });
    return undefined;
  }

  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((entry, index) => redactValue(entry, {
      policy,
      path: `${path}[${index}]`,
      key: String(index),
      seen,
      subject,
      redactions,
      diagnostics
    })).filter((entry) => entry !== undefined);
    seen.delete(value);
    return result;
  }

  const result = {};
  Object.keys(value).sort().forEach((entryKey) => {
    const childPath = `${path}.${entryKey}`;
    const redacted = redactValue(value[entryKey], {
      policy,
      path: childPath,
      key: entryKey,
      seen,
      subject,
      redactions,
      diagnostics
    });
    if (redacted !== undefined) result[entryKey] = redacted;
  });
  seen.delete(value);
  return result;
}

function redactPayload(payload = {}, options = {}) {
  const policy = mergePolicy(options.policy || options.redactionPolicy);
  const payloadSchema = normalizeString(options.payloadSchema || 'xtensions.payload.unknown.v1');
  const subject = options.subject || {};
  const diagnostics = [];
  const redactions = [];
  const schemaRule = schemaRuleFor(payloadSchema, policy);
  const passthrough = policy.passthroughSchemas.includes(payloadSchema);
  let action = schemaRule && normalizeString(schemaRule.action) || (passthrough ? 'pass' : policy.defaultAction);

  if (!schemaRule && policy.redactUnknownPayloads && !passthrough) {
    diagnostics.push(createDiagnosticTrailDiagnostic(
      subject,
      DIAGNOSTIC_TRAIL_REDACTION_REQUIRED_CODE,
      `Diagnostic trail payload schema "${payloadSchema}" requires default redaction.`,
      'info',
      { field: 'payloadSchema', payloadSchema, action }
    ));
  }

  if (action === 'allowlist') {
    const allow = toArray(schemaRule && schemaRule.allow).map(normalizeString).filter(Boolean);
    const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
    const redacted = {};
    Object.keys(source).sort().forEach((key) => {
      if (allow.includes(key)) {
        redacted[key] = cloneJson(source[key]);
      } else {
        redactions.push({ path: `payload.${key}`, action: 'drop', reason: 'schema-allowlist' });
      }
    });
    return {
      schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
      ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      payload: redacted,
      payloadSchema,
      policy,
      action,
      redacted: redactions.length > 0,
      redactions,
      diagnostics
    };
  }

  if (action === 'pass' || action === 'none') {
    const redacted = redactValue(payload, {
      policy,
      path: 'payload',
      key: '',
      seen: new Set(),
      subject,
      redactions,
      diagnostics
    });
    return {
      schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
      ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      payload: redacted,
      payloadSchema,
      policy,
      action,
      redacted: redactions.length > 0,
      redactions,
      diagnostics
    };
  }

  if (action === 'hash' || action === 'shape' || action === 'drop') {
    const marker = redactedMarker(action, payload);
    redactions.push({ path: 'payload', action, reason: 'schema-policy' });
    return {
      schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
      ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      payload: marker,
      payloadSchema,
      policy,
      action,
      redacted: true,
      redactions,
      diagnostics
    };
  }

  diagnostics.push(createDiagnosticTrailDiagnostic(
    subject,
    DIAGNOSTIC_TRAIL_REDACTION_POLICY_INVALID_CODE,
    `Diagnostic trail redaction action "${action}" is not supported.`,
    'error',
    { field: 'action', action }
  ));

  return {
    schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
    ok: false,
    payload: undefined,
    payloadSchema,
    policy,
    action,
    redacted: true,
    redactions: [{ path: 'payload', action: 'drop', reason: 'invalid-policy' }],
    diagnostics
  };
}

function createDiagnosticTrailCorrelation(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const correlationId = normalizeString(source.correlationId || options.correlationId || sha256Value({
    xtensionId: source.xtensionId,
    hostId: source.hostId,
    surfaceId: source.surfaceId,
    eventId: source.eventId,
    signalId: source.signalId
  }).slice(0, 24));
  const correlation = {
    schema: XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA,
    xtensionId: normalizeString(source.xtensionId || options.xtensionId),
    framework: normalizeString(source.framework || options.framework || 'frameworkless'),
    manifestId: normalizeString(source.manifestId || source.maracaManifestId || options.manifestId),
    artifactId: normalizeString(source.artifactId || source.maracaArtifactId || options.artifactId),
    artifactFingerprint: normalizeString(source.artifactFingerprint || options.artifactFingerprint || sha256Value(source.artifact || {})),
    buildFingerprint: normalizeString(source.buildFingerprint || options.buildFingerprint || sha256Value(source.build || {})),
    runtimeHostId: normalizeString(source.runtimeHostId || source.hostId || options.runtimeHostId || options.hostId),
    hostId: normalizeString(source.hostId || source.runtimeHostId || options.hostId || options.runtimeHostId),
    surfaceId: normalizeString(source.surfaceId || options.surfaceId),
    lane: normalizeString(source.lane || options.lane || 'fabric.default') || 'fabric.default',
    eventId: normalizeString(source.eventId || options.eventId),
    signalId: normalizeString(source.signalId || options.signalId),
    routeId: normalizeString(source.routeId || options.routeId),
    traceId: normalizeString(source.traceId || options.traceId || correlationId),
    correlationId,
    parentRecordId: normalizeString(source.parentRecordId || options.parentRecordId),
    timestamp: timestampFromOptions(options)
  };
  const diagnostics = REQUIRED_CORRELATION_FIELDS
    .filter((field) => !normalizeString(correlation[field] || (field === 'hostId' ? correlation.runtimeHostId : '')))
    .map((field) => createDiagnosticTrailDiagnostic(
      correlation,
      DIAGNOSTIC_TRAIL_CORRELATION_MISSING_CODE,
      `Diagnostic trail correlation requires "${field}".`,
      'error',
      { field }
    ));

  return {
    ...correlation,
    ok: diagnostics.length === 0,
    diagnostics
  };
}

function createDiagnosticTrailRecord(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const action = normalizeString(source.action || source.operation || 'update');
  const status = DIAGNOSTIC_TRAIL_STATUSES.includes(source.status) ? source.status : 'observed';
  const correlation = createDiagnosticTrailCorrelation(source.correlation || source, options);
  const subject = {
    recordId: source.recordId,
    xtensionId: correlation.xtensionId,
    surfaceId: correlation.surfaceId,
    lane: correlation.lane
  };
  const diagnostics = correlation.diagnostics.slice();
  if (!DIAGNOSTIC_TRAIL_ACTIONS.includes(action)) {
    diagnostics.push(createDiagnosticTrailDiagnostic(
      subject,
      DIAGNOSTIC_TRAIL_ACTION_UNSUPPORTED_CODE,
      `Diagnostic trail action "${action}" is not supported.`,
      'error',
      { field: 'action', action, allowed: DIAGNOSTIC_TRAIL_ACTIONS.slice() }
    ));
  }

  const payloadSchema = normalizeString(source.payloadSchema || source.schemaRef || 'xtensions.payload.unknown.v1') || 'xtensions.payload.unknown.v1';
  const redaction = redactPayload(source.payload || {}, {
    policy: source.redactionPolicy || options.redactionPolicy || options.policy,
    payloadSchema,
    subject
  });
  diagnostics.push(...redaction.diagnostics);
  const sequence = Number.isFinite(source.sequence) ? source.sequence : (Number.isFinite(options.sequence) ? options.sequence : 0);
  if (sequence < 0) {
    diagnostics.push(createDiagnosticTrailDiagnostic(
      subject,
      DIAGNOSTIC_TRAIL_SEQUENCE_INVALID_CODE,
      'Diagnostic trail sequence must be zero or a positive number.',
      'error',
      { field: 'sequence', sequence }
    ));
  }

  const recordId = normalizeString(source.recordId || sha256Value({
    action,
    status,
    sequence,
    correlationId: correlation.correlationId,
    payloadFingerprint: sha256Value(redaction.payload || {})
  }).slice(0, 32));

  return {
    schema: XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA,
    trailSchema: XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
    workpackage: XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
    recordId,
    action,
    status,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    severity: action === 'error' || status === 'failed' ? 'error' : (status === 'degraded' ? 'warning' : 'info'),
    sequence: sequence >= 0 ? sequence : 0,
    timestamp: timestampFromOptions(options),
    correlation,
    payloadSchema,
    payload: cloneJson(redaction.payload || {}),
    payloadFingerprint: sha256Value(redaction.payload || {}),
    rawPayloadFingerprint: sha256Value(source.payload || {}),
    redaction: {
      schema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
      redacted: redaction.redacted,
      action: redaction.action,
      redactionCount: redaction.redactions.length,
      redactions: redaction.redactions.map(cloneJson),
      policyFingerprint: sha256Value(redaction.policy)
    },
    diagnosticCodes: diagnostics.map((diagnostic) => diagnostic.code),
    diagnostics
  };
}

function createDiagnosticTrailContract(options = {}) {
  return {
    schema: XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
    recordSchema: XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA,
    correlationSchema: XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA,
    redactionPolicySchema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
    reportSchema: XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    lifecycleRecordSchema: XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
    signalBridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    kernelSignalSchema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    runtimeReportSchema: XTENSIONS_RUNTIME_REPORT_SCHEMA,
    maracaManifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    workpackage: XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
    status: 'accepted-by-XTN-10',
    optional: true,
    frameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    runtimeExecutionRequired: false,
    actions: DIAGNOSTIC_TRAIL_ACTIONS.slice(),
    statuses: DIAGNOSTIC_TRAIL_STATUSES.slice(),
    requiredCorrelationFields: REQUIRED_CORRELATION_FIELDS.slice(),
    redactionPolicy: mergePolicy(options.redactionPolicy),
    boundaries: DIAGNOSTIC_TRAIL_BOUNDARIES.slice()
  };
}

function createDiagnosticTrailReport(input = {}, options = {}) {
  const contract = createDiagnosticTrailContract(input.contract || input);
  const records = toArray(input.records || input.actions).map((record, index) => createDiagnosticTrailRecord(record, {
    redactionPolicy: input.redactionPolicy || contract.redactionPolicy,
    sequence: Number.isFinite(record && record.sequence) ? record.sequence : index + 1,
    clock: options.clock
  }));
  const dependencyBoundary = assertDiagnosticTrailDependencyBoundary(input);
  const diagnostics = dependencyBoundary.diagnostics.concat(records.flatMap((record) => record.diagnostics || []));
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error' || diagnostic.code === DIAGNOSTIC_TRAIL_FRAMEWORK_DEPENDENCY_CODE);
  const recordsByAction = records.reduce((result, record) => {
    result[record.action] = (result[record.action] || 0) + 1;
    return result;
  }, {});
  const redactionCount = records.reduce((total, record) => total + record.redaction.redactionCount, 0);

  return {
    schema: XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA,
    trailSchema: XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
    recordSchema: XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA,
    correlationSchema: XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA,
    redactionPolicySchema: XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
    workpackage: XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
    ok: blockingDiagnostics.length === 0,
    status: blockingDiagnostics.length === 0 ? 'ready' : 'blocked',
    ciReadable: true,
    devtoolsReadable: true,
    frameworkCodeRequired: false,
    runtimeExecutionRequired: false,
    contract,
    records,
    summary: {
      recordCount: records.length,
      recordsByAction,
      redactionCount,
      diagnosticCount: diagnostics.length,
      blockingDiagnosticCount: blockingDiagnostics.length,
      correlationIds: Array.from(new Set(records.map((record) => record.correlation.correlationId))).sort(),
      traceIds: Array.from(new Set(records.map((record) => record.correlation.traceId))).sort()
    },
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeDiagnosticTrailReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function assertDiagnosticTrailDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      schema: 'xtend.xtensions.diagnostic-trail-diagnostic.v1',
      source: XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
      workpackage: XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
      severity: 'error',
      code: DIAGNOSTIC_TRAIL_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

module.exports = {
  DEFAULT_REDACTION_POLICY,
  DIAGNOSTIC_TRAIL_ACTIONS,
  DIAGNOSTIC_TRAIL_ACTION_UNSUPPORTED_CODE,
  DIAGNOSTIC_TRAIL_BOUNDARIES,
  DIAGNOSTIC_TRAIL_CORRELATION_MISSING_CODE,
  DIAGNOSTIC_TRAIL_FRAMEWORK_DEPENDENCY_CODE,
  DIAGNOSTIC_TRAIL_PAYLOAD_NON_SERIALIZABLE_CODE,
  DIAGNOSTIC_TRAIL_REDACTION_POLICY_INVALID_CODE,
  DIAGNOSTIC_TRAIL_REDACTION_REQUIRED_CODE,
  DIAGNOSTIC_TRAIL_SEQUENCE_INVALID_CODE,
  DIAGNOSTIC_TRAIL_STATUSES,
  REQUIRED_CORRELATION_FIELDS,
  SENSITIVE_KEY_PATTERNS,
  XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_CONTRACT_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_PACKAGE_SCRIPT,
  XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_SUITE_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_TYPES_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
  assertDiagnosticTrailDependencyBoundary,
  createDiagnosticTrailContract,
  createDiagnosticTrailCorrelation,
  createDiagnosticTrailDiagnostic,
  createDiagnosticTrailRecord,
  createDiagnosticTrailReport,
  redactPayload,
  serializeDiagnosticTrailReport
};
