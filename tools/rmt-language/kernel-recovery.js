'use strict';

const {
  RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_STATE_SCHEMA,
  createKernelPanicMonitor
} = require('./kernel-panic-monitor');

const RMT_KERNEL_RECOVERY_POLICY_SCHEMA = 'xtend.rmt.kernel-recovery-policy.v1';
const RMT_KERNEL_RECOVERY_PLAN_SCHEMA = 'xtend.rmt.kernel-recovery-plan.v1';
const RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA = 'xtend.rmt.kernel-recovery-outcome.v1';
const RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA = 'xtend.rmt.kernel-recovery-safe-snapshot.v1';
const RMT_KERNEL_RECOVERY_REPORT_SCHEMA = 'xtend.rmt.kernel-recovery-report.v1';
const RMT_KERNEL_RECOVERY_SCHEMA = 'xtend.rmt.kernel-recovery.v1';
const RMT_KERNEL_RECOVERY_WORKPACKAGE = 'RKSH-WP-05';
const RMT_KERNEL_RECOVERY_MODULE_PATH = 'tools/rmt-language/kernel-recovery.js';
const RMT_KERNEL_RECOVERY_SUITE_PATH = 'tests/rmt-language/rmt_kernel_recovery_suite.js';
const RMT_KERNEL_RECOVERY_CONTRACT_PATH = 'development/XTendRMT-Kernel-Recovery-Contract.md';
const RMT_KERNEL_RECOVERY_WP_PATH = 'development/WP-RKSH-05-Quarantaene-Rollback-und-sicheren-Fallback-modellieren.md';
const RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-recovery';
const RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL = 'rmt.kernel.recovery';

const KERNEL_RECOVERY_ACTIONS = Object.freeze([
  'quarantine-scope',
  'pause-scheduler-jobs',
  'restore-last-safe-snapshot',
  'render-safe-fallback',
  'notify-host',
  'mark-recovered',
  'mark-failed'
]);

const KERNEL_RECOVERY_OUTCOME_STATUSES = Object.freeze([
  'planned',
  'recovering',
  'recovered',
  'failed',
  'skipped'
]);

const KERNEL_RECOVERY_SAFE_FALLBACK_POLICY = Object.freeze([
  'text-only',
  'trusted-html',
  'sanitized-html'
]);

const DEFAULT_RECOVERY_POLICY = Object.freeze({
  quarantineAffectedScope: true,
  pausePendingSchedulerJobs: true,
  restoreLastSafeSnapshot: true,
  renderSafeFallback: true,
  notifyHost: true,
  failWithoutRestoreOrFallback: true,
  fallbackPolicy: 'sanitized-html',
  safeFallbackText: 'XTendRMT recovery fallback',
  safeFallbackHtml: '',
  diagnosticsChannel: RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL,
  panicDiagnosticsChannel: RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  recoveryFailureEscalatesPanic: true,
  redactsRawOutput: true
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

function redactRecoveryMetadata(value, key = '') {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((entry) => redactRecoveryMetadata(entry, key));
  if (typeof value === 'object') {
    return Object.keys(value).reduce((result, entryKey) => {
      result[entryKey] = redactRecoveryMetadata(value[entryKey], entryKey);
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

function sanitizeRecoveryHtml(html) {
  let output = String(html || '');
  const removed = [];
  ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form'].forEach((tagName) => {
    const paired = new RegExp('<\\s*' + tagName + '\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*' + tagName + '\\s*>', 'gi');
    output = output.replace(paired, (match) => {
      removed.push({ type: 'element', name: tagName, sampleLength: match.length });
      return '';
    });
    const single = new RegExp('<\\s*' + tagName + '\\b[^>]*\\/?\\s*>', 'gi');
    output = output.replace(single, (match) => {
      removed.push({ type: 'element', name: tagName, sampleLength: match.length });
      return '';
    });
  });
  output = output.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (match) => {
    removed.push({ type: 'attribute', name: match.trim().split('=')[0] });
    return '';
  });
  output = output.replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, () => {
    removed.push({ type: 'attribute', name: 'srcdoc' });
    return '';
  });
  output = output.replace(/\s+(href|src|srcset|action|formaction|poster|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (match, _name, rawValue) => {
    const unquoted = String(rawValue || '').replace(/^["']|["']$/g, '').replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
    if (
      unquoted.startsWith('javascript:')
      || unquoted.startsWith('vbscript:')
      || unquoted.startsWith('data:text/html')
      || unquoted.startsWith('data:text/javascript')
      || unquoted.startsWith('data:application/javascript')
    ) {
      removed.push({ type: 'url', valueLength: unquoted.length });
      return '';
    }
    return match;
  });
  return {
    html: output,
    sanitized: true,
    removed,
    removedCount: removed.length
  };
}

function createSnapshotKey(input = {}) {
  return normalizeString(
    input.snapshotKey
    || input.rootId
    || input.scope
    || input.sourceRef
    || input.templateQualifiedId,
    'kernel'
  );
}

function createScopeKey(input = {}) {
  return normalizeString(
    input.scope
    || input.rootId
    || input.sourceRef
    || input.templateQualifiedId,
    'kernel'
  );
}

function createKernelRecoverySafeSnapshot(input = {}, options = {}) {
  const now = typeof options.now === 'function' ? options.now : (() => Date.now());
  const scope = createScopeKey(input);
  const snapshotKey = createSnapshotKey(input);
  return {
    schema: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
    snapshotId: normalizeString(input.snapshotId, `${RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA}:${snapshotKey}`),
    snapshotKey,
    rootId: normalizeString(input.rootId, null),
    scope,
    sourceRef: normalizeString(input.sourceRef, null),
    templateQualifiedId: normalizeString(input.templateQualifiedId, null),
    trustBoundary: normalizeString(input.trustBoundary, 'xtend.security.sanitizing-boundary.v1'),
    commitAllowed: input.commitAllowed === false ? false : true,
    sanitized: input.sanitized === true || input.trusted === true,
    html: normalizeString(input.html, ''),
    textContent: normalizeString(input.textContent, ''),
    modelSnapshot: cloneJson(input.modelSnapshot || {}, {}),
    capturedAt: Number.isFinite(input.capturedAt) ? input.capturedAt : now(),
    metadata: redactRecoveryMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function createKernelRecoveryPolicy(options = {}) {
  const policy = {
    ...DEFAULT_RECOVERY_POLICY,
    ...cloneJson(options.policy || options, {})
  };
  policy.fallbackPolicy = normalizeEnum(
    policy.fallbackPolicy,
    KERNEL_RECOVERY_SAFE_FALLBACK_POLICY,
    DEFAULT_RECOVERY_POLICY.fallbackPolicy
  );
  policy.diagnosticsChannel = normalizeString(policy.diagnosticsChannel, RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL);
  return {
    schema: RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
    ...policy
  };
}

function createKernelRecoveryContract(options = {}) {
  const policy = createKernelRecoveryPolicy(options);
  return {
    schema: RMT_KERNEL_RECOVERY_SCHEMA,
    policySchema: RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
    planSchema: RMT_KERNEL_RECOVERY_PLAN_SCHEMA,
    outcomeSchema: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
    safeSnapshotSchema: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    reportSchema: RMT_KERNEL_RECOVERY_REPORT_SCHEMA,
    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
    status: 'completed-kernel-recovery-policy',
    module: RMT_KERNEL_RECOVERY_MODULE_PATH,
    suite: RMT_KERNEL_RECOVERY_SUITE_PATH,
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-recovery --json',
    packageScript: RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT,
    hostNeutral: true,
    actions: KERNEL_RECOVERY_ACTIONS.slice(),
    outcomeStatuses: KERNEL_RECOVERY_OUTCOME_STATUSES.slice(),
    fallbackPolicies: KERNEL_RECOVERY_SAFE_FALLBACK_POLICY.slice(),
    defaultPolicy: policy,
    runtimeAdapterHooks: [
      'rememberSafeSnapshot',
      'recoverFromPanic',
      'restoreLastSafeSnapshot',
      'renderSafeFallback',
      'listRecoveryOutcomes',
      'listQuarantinedScopes'
    ],
    handoff: [
      'RKSH-WP-06',
      'RKSH-WP-07',
      'RKSH-WP-08',
      'RKSH-WP-09'
    ]
  };
}

function createKernelRecoveryPlan(input = {}, options = {}) {
  const policy = createKernelRecoveryPolicy(options.policy || options);
  const panicSnapshot = cloneJson(input.panicSnapshot || {}, {});
  const scope = createScopeKey({
    ...panicSnapshot,
    ...input
  });
  const planId = normalizeString(input.planId, `${RMT_KERNEL_RECOVERY_PLAN_SCHEMA}:${scope}`);
  const actions = [];
  if (policy.quarantineAffectedScope !== false) actions.push('quarantine-scope');
  if (policy.pausePendingSchedulerJobs !== false) actions.push('pause-scheduler-jobs');
  if (policy.restoreLastSafeSnapshot !== false) actions.push('restore-last-safe-snapshot');
  if (policy.renderSafeFallback !== false) actions.push('render-safe-fallback');
  if (policy.notifyHost !== false) actions.push('notify-host');
  return {
    schema: RMT_KERNEL_RECOVERY_PLAN_SCHEMA,
    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
    policySchema: RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
    planId,
    scope,
    rootId: normalizeString(input.rootId || panicSnapshot.rootId, null),
    templateQualifiedId: normalizeString(input.templateQualifiedId || panicSnapshot.templateQualifiedId, null),
    panicId: normalizeString(input.panicId || panicSnapshot.panicId, null),
    correlationId: normalizeString(input.correlationId || panicSnapshot.correlationId, null),
    actions,
    forceFallback: input.forceFallback === true,
    safeFallbackText: normalizeString(input.safeFallbackText, policy.safeFallbackText),
    safeFallbackHtml: normalizeString(input.safeFallbackHtml, policy.safeFallbackHtml),
    panicSnapshot,
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : (typeof options.now === 'function' ? options.now() : Date.now()),
    metadata: redactRecoveryMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function createKernelRecoveryOutcome(input = {}) {
  return {
    schema: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
    planSchema: RMT_KERNEL_RECOVERY_PLAN_SCHEMA,
    safeSnapshotSchema: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
    outcomeId: normalizeString(input.outcomeId, `${RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA}:${normalizeString(input.scope, 'kernel')}`),
    planId: normalizeString(input.planId, null),
    status: normalizeEnum(input.status, KERNEL_RECOVERY_OUTCOME_STATUSES, 'planned'),
    scope: normalizeString(input.scope, null),
    rootId: normalizeString(input.rootId, null),
    panicId: normalizeString(input.panicId, null),
    correlationId: normalizeString(input.correlationId, null),
    quarantined: input.quarantined === true,
    schedulerPaused: input.schedulerPaused === true,
    restoredSnapshotId: normalizeString(input.restoredSnapshotId, null),
    fallbackRendered: input.fallbackRendered === true,
    hostNotified: input.hostNotified === true,
    actions: Array.isArray(input.actions) ? input.actions.slice() : [],
    failures: Array.isArray(input.failures) ? input.failures.slice() : [],
    panicState: input.panicState ? cloneJson(input.panicState, null) : null,
    completedAt: Number.isFinite(input.completedAt) ? input.completedAt : Date.now(),
    metadata: redactRecoveryMetadata(cloneJson(input.metadata || {}, {}))
  };
}

function createKernelRecoveryController(options = {}) {
  const diagnosticsHub = options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function'
    ? options.diagnosticsHub
    : null;
  const now = typeof options.now === 'function' ? options.now : (() => Date.now());
  const policy = createKernelRecoveryPolicy(options.policy || {});
  const panicMonitor = options.panicMonitor && typeof options.panicMonitor.getSnapshot === 'function'
    ? options.panicMonitor
    : createKernelPanicMonitor({
      diagnosticsHub,
      now
    });
  const safeSnapshots = new Map();
  const quarantinedScopes = new Set();
  const pendingJobs = new Map();
  const outcomes = [];

  function publishOutcome(outcome) {
    if (diagnosticsHub) {
      try {
        diagnosticsHub.publish(policy.diagnosticsChannel, outcome, {
          source: RMT_KERNEL_RECOVERY_SCHEMA,
          workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
          status: outcome.status,
          scope: outcome.scope || undefined,
          panicId: outcome.panicId || undefined,
          correlationId: outcome.correlationId || undefined
        });
      } catch (_error) {}
    }
  }

  function rememberSafeSnapshot(input = {}) {
    const snapshot = createKernelRecoverySafeSnapshot(input, { now });
    if (snapshot.commitAllowed !== true) return null;
    safeSnapshots.set(snapshot.snapshotKey, snapshot);
    safeSnapshots.set(snapshot.scope, snapshot);
    return cloneJson(snapshot, {});
  }

  function getLastSafeSnapshot(input = {}) {
    const key = createSnapshotKey(input);
    const scope = createScopeKey(input);
    return cloneJson(safeSnapshots.get(key) || safeSnapshots.get(scope) || null, null);
  }

  function registerPendingJob(input = {}) {
    const jobId = normalizeString(input.jobId || input.id, '');
    if (!jobId) return null;
    const job = {
      jobId,
      scope: createScopeKey(input),
      status: 'pending',
      metadata: redactRecoveryMetadata(cloneJson(input.metadata || {}, {}))
    };
    pendingJobs.set(jobId, job);
    return cloneJson(job, {});
  }

  function pausePendingJobs(scopeInput = {}) {
    const scope = createScopeKey(scopeInput);
    const paused = [];
    pendingJobs.forEach((job) => {
      if (job.scope !== scope || job.status !== 'pending') return;
      job.status = 'paused';
      paused.push(job.jobId);
    });
    return paused;
  }

  function quarantineScope(input = {}) {
    const scope = createScopeKey(input);
    quarantinedScopes.add(scope);
    return scope;
  }

  function listQuarantinedScopes() {
    return Array.from(quarantinedScopes);
  }

  function isScopeQuarantined(input = {}) {
    return quarantinedScopes.has(createScopeKey(input));
  }

  function listSafeSnapshots() {
    return Array.from(new Set(Array.from(safeSnapshots.values()))).map((snapshot) => cloneJson(snapshot, {}));
  }

  function listPendingJobs() {
    return Array.from(pendingJobs.values()).map((job) => cloneJson(job, {}));
  }

  function listRecoveryOutcomes() {
    return outcomes.map((outcome) => cloneJson(outcome, {}));
  }

  function executeRecoveryPlan(planInput = {}, adapter = {}) {
    const plan = planInput && planInput.schema === RMT_KERNEL_RECOVERY_PLAN_SCHEMA
      ? cloneJson(planInput, {})
      : createKernelRecoveryPlan(planInput, { policy, now });
    const actionResults = [];
    const failures = [];
    let restoredSnapshotId = null;
    let fallbackRendered = false;
    let hostNotified = false;
    let schedulerPaused = false;
    let quarantined = false;

    if (panicMonitor && typeof panicMonitor.beginRecovery === 'function') {
      panicMonitor.beginRecovery({
        recoveryAction: 'quarantine-scope',
        panicId: plan.panicId,
        correlationId: plan.correlationId,
        metadata: {
          planId: plan.planId,
          scope: plan.scope
        }
      });
    }

    plan.actions.forEach((action) => {
      try {
        if (action === 'quarantine-scope') {
          quarantineScope(plan);
          quarantined = true;
          actionResults.push(action);
          return;
        }
        if (action === 'pause-scheduler-jobs') {
          const paused = pausePendingJobs(plan);
          schedulerPaused = paused.length > 0;
          actionResults.push(action);
          return;
        }
        if (action === 'restore-last-safe-snapshot') {
          const snapshot = getLastSafeSnapshot(plan);
          if (!snapshot) return;
          if (adapter && typeof adapter.restoreSnapshot === 'function' && adapter.restoreSnapshot(snapshot, plan) === false) {
            throw new Error('restore-snapshot-refused');
          }
          restoredSnapshotId = snapshot.snapshotId;
          actionResults.push(action);
          return;
        }
        if (action === 'render-safe-fallback') {
          if (restoredSnapshotId && plan.forceFallback !== true) return;
          const rawHtml = normalizeString(plan.safeFallbackHtml, '');
          const rawText = normalizeString(plan.safeFallbackText, '');
          const sanitized = rawHtml ? sanitizeRecoveryHtml(rawHtml) : { html: '', removedCount: 0, removed: [] };
          if (!rawHtml && !rawText) return;
          if (adapter && typeof adapter.renderSafeFallback === 'function' && adapter.renderSafeFallback({
            html: sanitized.html,
            textContent: rawText,
            sanitized: rawHtml ? true : false,
            removedCount: sanitized.removedCount
          }, plan) === false) {
            throw new Error('safe-fallback-refused');
          }
          fallbackRendered = true;
          actionResults.push(action);
          return;
        }
        if (action === 'notify-host') {
          actionResults.push(action);
        }
      } catch (error) {
        failures.push({
          action,
          message: normalizeString(error && error.message, 'recovery-action-failed')
        });
      }
    });

    if (policy.failWithoutRestoreOrFallback !== false && !restoredSnapshotId && !fallbackRendered) {
      failures.push({
        action: 'restore-last-safe-snapshot',
        message: 'no-safe-restore-or-fallback'
      });
    }

    const status = failures.length > 0 ? 'failed' : 'recovered';
    const panicState = status === 'failed'
      ? (panicMonitor && typeof panicMonitor.failRecovery === 'function'
        ? panicMonitor.failRecovery({
          recoveryAction: 'manual-intervention',
          panicId: plan.panicId,
          correlationId: plan.correlationId,
          metadata: {
            planId: plan.planId,
            failures
          }
        })
        : null)
      : (panicMonitor && typeof panicMonitor.completeRecovery === 'function'
        ? panicMonitor.completeRecovery({
          recoveryAction: restoredSnapshotId ? 'rollback-last-safe-snapshot' : 'render-safe-fallback',
          panicId: plan.panicId,
          correlationId: plan.correlationId,
          metadata: {
            planId: plan.planId,
            restoredSnapshotId,
            fallbackRendered
          }
        })
        : null);

    const outcome = createKernelRecoveryOutcome({
      outcomeId: `${RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA}:${outcomes.length + 1}`,
      planId: plan.planId,
      status,
      scope: plan.scope,
      rootId: plan.rootId,
      panicId: plan.panicId,
      correlationId: plan.correlationId,
      quarantined,
      schedulerPaused,
      restoredSnapshotId,
      fallbackRendered,
      hostNotified,
      actions: actionResults,
      failures,
      panicState,
      completedAt: now(),
      metadata: {
        safeFallbackPolicy: policy.fallbackPolicy,
        diagnosticsChannel: policy.diagnosticsChannel
      }
    });
    if (actionResults.includes('notify-host')) {
      try {
        const notificationOutcome = cloneJson({
          ...outcome,
          hostNotified: true
        }, outcome);
        if (adapter && typeof adapter.notifyHost === 'function') {
          adapter.notifyHost(notificationOutcome);
          hostNotified = true;
        } else if (options.hostAdapter && typeof options.hostAdapter.notifyRecoveryOutcome === 'function') {
          options.hostAdapter.notifyRecoveryOutcome(notificationOutcome);
          hostNotified = true;
        }
        outcome.hostNotified = hostNotified;
      } catch (error) {
        hostNotified = false;
        outcome.hostNotified = false;
        outcome.failures.push({
          action: 'notify-host',
          message: normalizeString(error && error.message, 'notify-host-failed')
        });
      }
    }
    outcomes.push(outcome);
    publishOutcome(outcome);
    return cloneJson(outcome, {});
  }

  function recover(input = {}, adapter = {}) {
    return executeRecoveryPlan(createKernelRecoveryPlan({
      ...input,
      panicSnapshot: input.panicSnapshot || (panicMonitor && typeof panicMonitor.getSnapshot === 'function' ? panicMonitor.getSnapshot() : {})
    }, {
      policy,
      now
    }), adapter);
  }

  return {
    schema: RMT_KERNEL_RECOVERY_SCHEMA,
    contract: createKernelRecoveryContract({ policy }),
    policy,
    panicMonitor,
    rememberSafeSnapshot,
    getLastSafeSnapshot,
    listSafeSnapshots,
    registerPendingJob,
    pausePendingJobs,
    listPendingJobs,
    quarantineScope,
    listQuarantinedScopes,
    isScopeQuarantined,
    createPlan(input = {}) {
      return createKernelRecoveryPlan({
        ...input,
        panicSnapshot: input.panicSnapshot || (panicMonitor && typeof panicMonitor.getSnapshot === 'function' ? panicMonitor.getSnapshot() : {})
      }, {
        policy,
        now
      });
    },
    executeRecoveryPlan,
    recover,
    listRecoveryOutcomes
  };
}

function serializeKernelRecoveryContract(contract) {
  return JSON.stringify(stableSort(contract));
}

function serializeKernelRecoveryOutcome(outcome) {
  return JSON.stringify(stableSort(outcome));
}

function serializeKernelRecoveryPlan(plan) {
  return JSON.stringify(stableSort(plan));
}

module.exports = {
  DEFAULT_RECOVERY_POLICY,
  KERNEL_RECOVERY_ACTIONS,
  KERNEL_RECOVERY_OUTCOME_STATUSES,
  KERNEL_RECOVERY_SAFE_FALLBACK_POLICY,
  RMT_KERNEL_RECOVERY_CONTRACT_PATH,
  RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_RECOVERY_MODULE_PATH,
  RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
  RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT,
  RMT_KERNEL_RECOVERY_PLAN_SCHEMA,
  RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
  RMT_KERNEL_RECOVERY_REPORT_SCHEMA,
  RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
  RMT_KERNEL_RECOVERY_SCHEMA,
  RMT_KERNEL_RECOVERY_SUITE_PATH,
  RMT_KERNEL_RECOVERY_WORKPACKAGE,
  RMT_KERNEL_RECOVERY_WP_PATH,
  createKernelRecoveryContract,
  createKernelRecoveryController,
  createKernelRecoveryOutcome,
  createKernelRecoveryPlan,
  createKernelRecoveryPolicy,
  createKernelRecoverySafeSnapshot,
  redactRecoveryMetadata,
  sanitizeRecoveryHtml,
  serializeKernelRecoveryContract,
  serializeKernelRecoveryOutcome,
  serializeKernelRecoveryPlan
};
