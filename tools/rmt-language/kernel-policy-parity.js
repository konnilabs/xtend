'use strict';

const {
  RMT_VNEXT_SECURITY_POLICY_SCHEMA,
  SECURITY_POLICY_CONFLICT_CODE,
  SECURITY_POLICY_DUPLICATE_CODE,
  SECURITY_POLICY_OWNER_MISSING_CODE,
  SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE,
  SECURITY_SANITIZE_MISSING_CODE,
  SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE,
  SECURITY_TRUST_BOUNDARY_MISSING_CODE,
  SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE
} = require('./vnext-security');
const {
  REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE,
  REMOTE_SECURITY_CSP_MISSING_CODE,
  REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE,
  REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE,
  REMOTE_SECURITY_INTEGRITY_MISSING_CODE,
  REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
  REMOTE_SECURITY_SANDBOX_CONFLICT_CODE,
  REMOTE_SECURITY_TRUST_BOUNDARY,
  REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE,
  REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA
} = require('./vnext-remote-security');
const {
  DEGRADATION_CAPABILITY_MISSING_CODE,
  DEGRADATION_EVENT_RESTRICTED_CODE,
  DEGRADATION_FALLBACK_MISSING_CODE,
  DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE,
  DEGRADATION_SURFACE_BLOCKED_CODE,
  DEGRADATION_VERSION_MISMATCH_CODE,
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('./vnext-degradation');
const {
  STREAM_BACKPRESSURE_MISSING_CODE,
  STREAM_CAPABILITY_MISSING_CODE,
  STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE,
  STREAM_DATA_SOURCE_MISSING_CODE,
  STREAM_ERROR_PATH_MISSING_CODE,
  STREAM_SECURITY_MISSING_CODE,
  RMT_VNEXT_STREAMING_SCHEMA
} = require('./vnext-streaming');
const {
  EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE,
  EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
  EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE,
  EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE,
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('./vnext-event-governance');
const {
  RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
  RMT_KERNEL_TRUST_VERDICT_SCHEMA
} = require('./kernel-trust-authority');
const {
  RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
  RMT_KERNEL_RECOVERY_SCHEMA
} = require('./kernel-recovery');
const {
  RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
  RMT_KERNEL_ESCALATION_SCHEMA
} = require('./kernel-escalation');
const {
  RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA
} = require('./kernel-scheduler-failure');

const RMT_KERNEL_POLICY_PARITY_SCHEMA = 'xtend.rmt.kernel-policy-parity.v1';
const RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA = 'xtend.rmt.kernel-policy-parity-matrix.v1';
const RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA = 'xtend.rmt.kernel-policy-parity-report.v1';
const RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA = 'xtend.rmt.kernel-policy-parity-drift.v1';
const RMT_KERNEL_POLICY_PARITY_WORKPACKAGE = 'RKSH-WP-08';
const RMT_KERNEL_POLICY_PARITY_MODULE_PATH = 'tools/rmt-language/kernel-policy-parity.js';
const RMT_KERNEL_POLICY_PARITY_SUITE_PATH = 'tests/rmt-language/rmt_kernel_policy_parity_suite.js';
const RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH = 'development/XTendRMT-Kernel-Policy-Parity-Contract.md';
const RMT_KERNEL_POLICY_PARITY_WP_PATH = 'development/WP-RKSH-08-Compile-Time-Runtime-Policy-Paritaet-herstellen.md';
const RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-policy-parity';
const RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL = 'rmt.kernel.policy_parity';

const KERNEL_POLICY_PARITY_RUNTIME_HOOKS = Object.freeze([
  'recordTrustVerdict',
  'commitTrustedHtml',
  'commitTrustedAttribute',
  'commitTrustedProperty',
  'applyRemoteSurfacePolicy',
  'recoverFromPanic',
  'rememberSafeSnapshot',
  'listRecoveryOutcomes',
  'panicBlockScope',
  'abortScope',
  'reportPerformanceSample',
  'dispatchCommand',
  'recordEscalation',
  'listEscalations'
]);

const KERNEL_POLICY_PARITY_RUNTIME_VERDICTS = Object.freeze([
  'trusted',
  'sanitized',
  'blocked',
  'panic',
  'recovered',
  'drift'
]);

const DEFAULT_KERNEL_POLICY_PARITY_MATRIX = Object.freeze([
  Object.freeze({
    id: 'vnext-security-trust-boundary-runtime-trust-authority',
    sourceSchema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    policyFamily: 'vnext-security',
    compileTimeCodes: Object.freeze([
      SECURITY_POLICY_OWNER_MISSING_CODE,
      SECURITY_TRUST_BOUNDARY_MISSING_CODE,
      SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
      SECURITY_SANITIZE_MISSING_CODE,
      SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE,
      SECURITY_POLICY_DUPLICATE_CODE,
      SECURITY_POLICY_CONFLICT_CODE,
      SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE
    ]),
    compileTimeStatuses: Object.freeze(['blocked']),
    runtimeScope: 'trusted-runtime-output',
    runtimeHooks: Object.freeze(['recordTrustVerdict', 'commitTrustedHtml']),
    runtimeSchemas: Object.freeze([RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, RMT_KERNEL_TRUST_VERDICT_SCHEMA]),
    runtimeVerdicts: Object.freeze(['sanitized', 'blocked', 'panic']),
    panicTrigger: 'trust-verdict-blocked',
    recoveryAction: 'quarantine-scope'
  }),
  Object.freeze({
    id: 'vnext-security-binding-runtime-attribute-property-policy',
    sourceSchema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    policyFamily: 'vnext-security',
    compileTimeCodes: Object.freeze([
      SECURITY_TRUST_BOUNDARY_MISSING_CODE,
      SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE,
      SECURITY_POLICY_CONFLICT_CODE
    ]),
    compileTimeStatuses: Object.freeze(['blocked']),
    runtimeScope: 'binding-output',
    runtimeHooks: Object.freeze(['commitTrustedAttribute', 'commitTrustedProperty', 'recordTrustVerdict']),
    runtimeSchemas: Object.freeze([RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, RMT_KERNEL_TRUST_VERDICT_SCHEMA]),
    runtimeVerdicts: Object.freeze(['trusted', 'blocked', 'panic']),
    panicTrigger: 'trust-verdict-blocked',
    recoveryAction: 'quarantine-scope'
  }),
  Object.freeze({
    id: 'remote-security-runtime-remote-output-trust-scope',
    sourceSchema: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    policyFamily: 'remote-security',
    compileTimeCodes: Object.freeze([
      REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE,
      REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
      REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
      REMOTE_SECURITY_INTEGRITY_MISSING_CODE,
      REMOTE_SECURITY_CSP_MISSING_CODE,
      REMOTE_SECURITY_SANDBOX_CONFLICT_CODE,
      REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE,
      REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE,
      REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE
    ]),
    compileTimeStatuses: Object.freeze(['blocked']),
    runtimeScope: 'remote-output',
    runtimeHooks: Object.freeze(['applyRemoteSurfacePolicy', 'recordTrustVerdict', 'recordEscalation']),
    runtimeSchemas: Object.freeze([RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, RMT_KERNEL_TRUST_VERDICT_SCHEMA, RMT_KERNEL_ESCALATION_SCHEMA]),
    runtimeVerdicts: Object.freeze(['blocked', 'panic']),
    trustBoundary: REMOTE_SECURITY_TRUST_BOUNDARY,
    panicTrigger: 'remote-output-policy-blocked',
    recoveryAction: 'quarantine-scope'
  }),
  Object.freeze({
    id: 'degradation-blocked-runtime-panic-recovery',
    sourceSchema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    policyFamily: 'degradation',
    compileTimeCodes: Object.freeze([
      DEGRADATION_SURFACE_BLOCKED_CODE,
      DEGRADATION_FALLBACK_MISSING_CODE,
      DEGRADATION_CAPABILITY_MISSING_CODE,
      DEGRADATION_VERSION_MISMATCH_CODE,
      DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE,
      DEGRADATION_EVENT_RESTRICTED_CODE
    ]),
    compileTimeStatuses: Object.freeze(['blocked']),
    runtimeScope: 'degraded-or-blocked-surface',
    runtimeHooks: Object.freeze(['recoverFromPanic', 'rememberSafeSnapshot', 'listRecoveryOutcomes', 'panicBlockScope']),
    runtimeSchemas: Object.freeze([RMT_KERNEL_RECOVERY_SCHEMA, RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA, RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA]),
    runtimeVerdicts: Object.freeze(['blocked', 'recovered', 'panic']),
    panicTrigger: 'degradation-blocked',
    recoveryAction: 'render-safe-fallback'
  }),
  Object.freeze({
    id: 'streaming-error-path-runtime-panic-scheduler',
    sourceSchema: RMT_VNEXT_STREAMING_SCHEMA,
    policyFamily: 'streaming',
    compileTimeCodes: Object.freeze([
      STREAM_SECURITY_MISSING_CODE,
      STREAM_ERROR_PATH_MISSING_CODE,
      STREAM_BACKPRESSURE_MISSING_CODE,
      STREAM_DATA_SOURCE_MISSING_CODE,
      STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE,
      STREAM_CAPABILITY_MISSING_CODE
    ]),
    compileTimeStatuses: Object.freeze(['blocked']),
    runtimeScope: 'streaming-output',
    runtimeHooks: Object.freeze(['reportPerformanceSample', 'panicBlockScope', 'recordTrustVerdict']),
    runtimeSchemas: Object.freeze([RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA, RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA, RMT_KERNEL_TRUST_VERDICT_SCHEMA]),
    runtimeVerdicts: Object.freeze(['blocked', 'panic']),
    panicTrigger: 'scheduler-backpressure',
    recoveryAction: 'pause-scheduler-jobs'
  }),
  Object.freeze({
    id: 'event-governance-delivery-block-runtime-signal',
    sourceSchema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    policyFamily: 'event-governance',
    compileTimeCodes: Object.freeze([
      EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
      EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE,
      EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE,
      EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE
    ]),
    compileTimeStatuses: Object.freeze(['blocked']),
    runtimeScope: 'event-delivery',
    runtimeHooks: Object.freeze(['dispatchCommand', 'recordEscalation', 'listEscalations']),
    runtimeSchemas: Object.freeze([RMT_KERNEL_ESCALATION_SCHEMA, RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA]),
    runtimeVerdicts: Object.freeze(['blocked', 'panic']),
    panicTrigger: 'command-bus-failure',
    recoveryAction: 'notify-host'
  })
]);

const SOURCE_SCHEMA_ALIASES = Object.freeze({
  [RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA]: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  [RMT_VNEXT_DEGRADATION_REPORT_SCHEMA]: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  [RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA]: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA
});

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function uniqueList(values) {
  return Array.from(new Set(normalizeArray(values).map((value) => normalizeString(value, '')).filter(Boolean))).sort();
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

function normalizeSourceSchema(report = {}) {
  const raw = normalizeString(report.policySchema || report.sourceSchema || report.schema, '');
  return SOURCE_SCHEMA_ALIASES[raw] || raw;
}

function normalizeMatrixEntry(entry = {}) {
  return {
    id: normalizeString(entry.id, 'policy-parity-rule'),
    sourceSchema: normalizeSourceSchema(entry),
    policyFamily: normalizeString(entry.policyFamily, 'kernel'),
    compileTimeCodes: uniqueList(entry.compileTimeCodes),
    compileTimeStatuses: uniqueList(entry.compileTimeStatuses || ['blocked']),
    runtimeScope: normalizeString(entry.runtimeScope, 'runtime-output'),
    runtimeHooks: uniqueList(entry.runtimeHooks),
    runtimeSchemas: uniqueList(entry.runtimeSchemas),
    runtimeVerdicts: uniqueList(entry.runtimeVerdicts || ['blocked']),
    trustBoundary: normalizeString(entry.trustBoundary, null),
    panicTrigger: normalizeString(entry.panicTrigger, 'trust-verdict-blocked'),
    recoveryAction: normalizeString(entry.recoveryAction, 'quarantine-scope')
  };
}

function createKernelPolicyParityMatrix(input = {}) {
  const customEntries = normalizeArray(input.matrix || input.entries);
  const entries = customEntries.length > 0 ? customEntries : DEFAULT_KERNEL_POLICY_PARITY_MATRIX;
  return {
    schema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
    paritySchema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
    workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
    entryCount: entries.length,
    entries: entries.map(normalizeMatrixEntry)
  };
}

function createKernelPolicyParityContract(options = {}) {
  const matrix = createKernelPolicyParityMatrix(options);
  return {
    schema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
    matrixSchema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
    reportSchema: RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    driftSchema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
    workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
    status: 'completed-compile-runtime-policy-parity',
    module: RMT_KERNEL_POLICY_PARITY_MODULE_PATH,
    suite: RMT_KERNEL_POLICY_PARITY_SUITE_PATH,
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json',
    packageScript: RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
    diagnosticsChannel: RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL,
    hostNeutral: true,
    sourcePolicySchemas: uniqueList(matrix.entries.map((entry) => entry.sourceSchema)),
    runtimeScopes: uniqueList(matrix.entries.map((entry) => entry.runtimeScope)),
    runtimeHooks: uniqueList(matrix.entries.flatMap((entry) => entry.runtimeHooks)),
    runtimeVerdicts: KERNEL_POLICY_PARITY_RUNTIME_VERDICTS.slice(),
    matrix,
    invariants: [
      'compile_time_blocking_rule_has_runtime_counterpart',
      'runtime_report_exposes_applied_policy_and_verdict',
      'contract_runtime_drift_is_reported'
    ],
    handoff: [
      'RKSH-WP-09',
      'RKSH-WP-10',
      'RKSH-WP-11'
    ]
  };
}

function createDiagnosticBlock(report, diagnostic, index) {
  const sourceSchema = normalizeSourceSchema(report);
  const code = normalizeString(diagnostic.code || diagnostic.diagnosticCode, '');
  if (!code) return null;
  const severity = normalizeString(diagnostic.severity || diagnostic.level, 'info');
  const status = severity === 'error' || severity === 'fatal' ? 'blocked' : normalizeString(diagnostic.status, 'ready');
  if (status !== 'blocked') return null;
  return {
    sourceSchema,
    reportSchema: normalizeString(report.schema, sourceSchema),
    code,
    severity,
    status,
    message: normalizeString(diagnostic.message, code),
    sourceRef: normalizeString(diagnostic.sourceRef || diagnostic.path || diagnostic.operationId || diagnostic.surfaceId || diagnostic.eventId, `${sourceSchema}:${index}`),
    metadata: cloneJson(diagnostic.metadata || {}, {})
  };
}

function collectDiagnosticBlocks(report) {
  return normalizeArray(report.diagnostics)
    .map((diagnostic, index) => createDiagnosticBlock(report, diagnostic || {}, index))
    .filter(Boolean);
}

function collectStatusBlocks(report) {
  const sourceSchema = normalizeSourceSchema(report);
  const blocks = [];
  const candidates = []
    .concat(normalizeArray(report.postures))
    .concat(normalizeArray(report.surfaces))
    .concat(normalizeArray(report.streams))
    .concat(normalizeArray(report.events));
  candidates.forEach((record, index) => {
    if (!record || typeof record !== 'object') return;
    const status = normalizeString(record.status || record.state, '');
    if (status !== 'blocked') return;
    const diagnostics = collectDiagnosticBlocks({
      ...record,
      schema: report.schema,
      policySchema: report.policySchema || sourceSchema,
      diagnostics: record.diagnostics || []
    });
    if (diagnostics.length > 0) {
      blocks.push(...diagnostics);
      return;
    }
    blocks.push({
      sourceSchema,
      reportSchema: normalizeString(report.schema, sourceSchema),
      code: `${sourceSchema}.blocked`,
      severity: 'error',
      status: 'blocked',
      message: `Blocked record in ${sourceSchema}`,
      sourceRef: normalizeString(record.id || record.operationId || record.enterpriseSurfaceId || record.eventId, `${sourceSchema}:blocked:${index}`),
      metadata: {}
    });
  });
  return blocks;
}

function collectCompileTimeBlocks(input = {}) {
  const reports = []
    .concat(normalizeArray(input.reports))
    .concat(normalizeArray(input.contracts))
    .concat(normalizeArray(input.securityContract))
    .concat(normalizeArray(input.remoteSecurityReport))
    .concat(normalizeArray(input.degradationReport))
    .concat(normalizeArray(input.streamingContract))
    .concat(normalizeArray(input.eventGovernanceReport));
  const blocks = [];
  reports.forEach((report) => {
    if (!report || typeof report !== 'object') return;
    blocks.push(...collectDiagnosticBlocks(report));
    blocks.push(...collectStatusBlocks(report));
    const status = normalizeString(report.status, '');
    if (status === 'blocked' && !blocks.some((block) => block.reportSchema === report.schema)) {
      blocks.push({
        sourceSchema: normalizeSourceSchema(report),
        reportSchema: normalizeString(report.schema, normalizeSourceSchema(report)),
        code: `${normalizeSourceSchema(report)}.blocked`,
        severity: 'error',
        status: 'blocked',
        message: `Blocked report ${normalizeString(report.schema, 'unknown')}`,
        sourceRef: normalizeString(report.reportId || report.contractId || report.governanceId, normalizeString(report.schema, 'report')),
        metadata: {}
      });
    }
  });
  const seen = new Set();
  return blocks.filter((block) => {
    const key = `${block.sourceSchema}:${block.code}:${block.sourceRef}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createRuntimeCapabilitySnapshot(input = {}, options = {}) {
  const runtime = input.runtime || options.runtime || {};
  const explicitHooks = normalizeArray(input.runtimeHooks || options.runtimeHooks);
  const discoveredHooks = [];
  if (runtime && typeof runtime === 'object') {
    KERNEL_POLICY_PARITY_RUNTIME_HOOKS.forEach((hook) => {
      if (typeof runtime[hook] === 'function') discoveredHooks.push(hook);
    });
    const commandBus = typeof runtime.getCommandBus === 'function' ? runtime.getCommandBus() : null;
    if (commandBus && typeof commandBus === 'object') {
      ['dispatch', 'recordEscalation', 'listEscalations'].forEach((hook) => {
        if (typeof commandBus[hook] === 'function') discoveredHooks.push(hook === 'dispatch' ? 'dispatchCommand' : hook);
      });
    }
    const diagnosticsHub = typeof runtime.getDiagnosticsHub === 'function' ? runtime.getDiagnosticsHub() : null;
    if (diagnosticsHub && typeof diagnosticsHub === 'object') {
      ['recordEscalation', 'listEscalations'].forEach((hook) => {
        if (typeof diagnosticsHub[hook] === 'function') discoveredHooks.push(hook);
      });
    }
  }
  const hooks = uniqueList(explicitHooks.length > 0 ? explicitHooks.concat(discoveredHooks) : discoveredHooks);
  return {
    hooks,
    missingDefaultHooks: KERNEL_POLICY_PARITY_RUNTIME_HOOKS.filter((hook) => !hooks.includes(hook))
  };
}

function findMatrixEntriesForBlock(block, matrixEntries) {
  return matrixEntries.filter((entry) => {
    const sameSource = entry.sourceSchema === block.sourceSchema;
    const codeMatches = entry.compileTimeCodes.includes(block.code);
    const statusMatches = entry.compileTimeStatuses.includes(block.status);
    return sameSource && statusMatches && (codeMatches || block.code === `${entry.sourceSchema}.blocked`);
  });
}

function createAppliedRuntimePolicy(block, entry, runtimeCapabilities) {
  const missingHooks = entry.runtimeHooks.filter((hook) => !runtimeCapabilities.hooks.includes(hook));
  const verdict = missingHooks.length > 0 ? 'drift' : (entry.runtimeVerdicts.includes('blocked') ? 'blocked' : entry.runtimeVerdicts[0]);
  return {
    blockCode: block.code,
    sourceSchema: block.sourceSchema,
    matrixEntryId: entry.id,
    policyFamily: entry.policyFamily,
    runtimeScope: entry.runtimeScope,
    runtimeHooks: entry.runtimeHooks.slice(),
    missingRuntimeHooks: missingHooks,
    runtimeSchemas: entry.runtimeSchemas.slice(),
    runtimeVerdicts: entry.runtimeVerdicts.slice(),
    appliedPolicy: entry.id,
    verdict,
    panicTrigger: entry.panicTrigger,
    recoveryAction: entry.recoveryAction,
    trustBoundary: entry.trustBoundary || null
  };
}

function createKernelPolicyParityRuntimeReport(input = {}, options = {}) {
  const matrix = createKernelPolicyParityMatrix(options.matrix ? { matrix: options.matrix } : input);
  const runtimeCapabilities = createRuntimeCapabilitySnapshot(input, options);
  const compileBlocks = collectCompileTimeBlocks(input);
  const appliedPolicies = [];
  const drift = [];

  compileBlocks.forEach((block) => {
    const entries = findMatrixEntriesForBlock(block, matrix.entries);
    if (entries.length === 0) {
      drift.push({
        schema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
        type: 'missing-runtime-mapping',
        sourceSchema: block.sourceSchema,
        blockCode: block.code,
        sourceRef: block.sourceRef,
        message: `No runtime parity mapping for ${block.code}.`
      });
      return;
    }
    entries.forEach((entry) => {
      const applied = createAppliedRuntimePolicy(block, entry, runtimeCapabilities);
      appliedPolicies.push(applied);
      if (applied.missingRuntimeHooks.length > 0) {
        drift.push({
          schema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
          type: 'missing-runtime-hook',
          sourceSchema: block.sourceSchema,
          blockCode: block.code,
          matrixEntryId: entry.id,
          sourceRef: block.sourceRef,
          missingRuntimeHooks: applied.missingRuntimeHooks.slice(),
          message: `Runtime hook missing for ${entry.id}: ${applied.missingRuntimeHooks.join(', ')}.`
        });
      }
    });
  });

  const status = drift.length > 0 ? 'drift' : 'ready';
  return {
    schema: RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    paritySchema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
    matrixSchema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
    workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
    status,
    ok: status === 'ready',
    compileTimeBlockCount: compileBlocks.length,
    appliedPolicyCount: appliedPolicies.length,
    driftCount: drift.length,
    sourcePolicySchemas: uniqueList(matrix.entries.map((entry) => entry.sourceSchema)),
    runtimeScopes: uniqueList(matrix.entries.map((entry) => entry.runtimeScope)),
    runtimeCapabilities,
    compileTimeBlocks: compileBlocks,
    appliedPolicies,
    drift
  };
}

function createKernelPolicyParityController(options = {}) {
  const diagnosticsHub = options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function'
    ? options.diagnosticsHub
    : null;
  const reports = [];

  function publishReport(report) {
    if (!diagnosticsHub) return;
    try {
      diagnosticsHub.publish(RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL, report, {
        source: RMT_KERNEL_POLICY_PARITY_SCHEMA,
        workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
        status: report.status,
        driftCount: report.driftCount
      });
    } catch (_error) {}
  }

  function createRuntimeReport(input = {}) {
    const report = createKernelPolicyParityRuntimeReport(input, options);
    reports.push(report);
    publishReport(report);
    return cloneJson(report, {});
  }

  return {
    schema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
    contract: createKernelPolicyParityContract(options),
    getMatrix() {
      return cloneJson(createKernelPolicyParityMatrix(options), {});
    },
    createRuntimeReport,
    checkDrift(input = {}) {
      return createRuntimeReport(input).drift;
    },
    listReports() {
      return reports.map((report) => cloneJson(report, {}));
    }
  };
}

function serializeKernelPolicyParityContract(contract) {
  return JSON.stringify(stableSort(contract));
}

function serializeKernelPolicyParityReport(report) {
  return JSON.stringify(stableSort(report));
}

module.exports = {
  DEFAULT_KERNEL_POLICY_PARITY_MATRIX,
  KERNEL_POLICY_PARITY_RUNTIME_HOOKS,
  KERNEL_POLICY_PARITY_RUNTIME_VERDICTS,
  RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH,
  RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_MODULE_PATH,
  RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
  RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_SUITE_PATH,
  RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
  RMT_KERNEL_POLICY_PARITY_WP_PATH,
  collectCompileTimeBlocks,
  createKernelPolicyParityContract,
  createKernelPolicyParityController,
  createKernelPolicyParityMatrix,
  createKernelPolicyParityRuntimeReport,
  createRuntimeCapabilitySnapshot,
  serializeKernelPolicyParityContract,
  serializeKernelPolicyParityReport
};
