'use strict';

const crypto = require('crypto');

const SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA = 'xtend.maraca.super-prewarm-worker-experiment.v1';
const SUPER_PREWARM_WORKER_RUN_SCHEMA = 'xtend.maraca.super-prewarm-worker-run.v1';
const SUPER_PREWARM_WORKER_DIAGNOSTIC_SCHEMA = 'xtend.maraca.super-prewarm-worker-diagnostic.v1';
const SUPER_PREWARM_WORKER_EVIDENCE_REPORT_PATH = '.xtend-test-results/xtend-super-prewarm-worker-experiment-report.json';

const RUN_MODES = Object.freeze([
  'baseline',
  'prewarmWorker',
  'superPrewarmWorker'
]);

const CACHE_PASSES = Object.freeze([
  'cold',
  'warm'
]);

const EXPERIMENT_LANES = Object.freeze({
  workerHydrate: 'component.worker_prerender_hydrate',
  prewarm: 'component.prewarm.prepare',
  warmReentry: 'component.warm.reentry',
  diagnostics: 'diagnostics.snapshot'
});

const DEFAULT_PWA_CONTEXT = Object.freeze({
  manifestRef: 'tests/browser/fixtures/super-prewarm-worker-manifest.webmanifest',
  cacheMode: 'fixture-cache-stub',
  serviceWorkerControlled: false,
  offlineEligible: true
});

const DEFAULT_STATE_CONTEXT = Object.freeze({
  stateSnapshotHash: '',
  stateProjectionMode: 'fixture-main-thread-mirror',
  stateOwnership: 'main-thread'
});

const DEFAULT_SSR_CONTEXT = Object.freeze({
  ssrRoundtripCount: 0,
  serverPrerenderUsed: false,
  clientDetermined: true
});

function cloneJson(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeInteger(value, fallback = 0) {
  return Math.max(Math.trunc(normalizeNumber(value, fallback)), 0);
}

function normalizeMode(value) {
  return RUN_MODES.includes(value) ? value : 'baseline';
}

function normalizeCachePass(value) {
  return CACHE_PASSES.includes(value) ? value : 'cold';
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

function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableSort(value))).digest('hex');
}

function createDiagnostic(code, message, severity = 'warning', metadata = {}) {
  return {
    schema: SUPER_PREWARM_WORKER_DIAGNOSTIC_SCHEMA,
    source: SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA,
    severity,
    code,
    message,
    metadata: cloneJson(metadata, {})
  };
}

function median(values) {
  const sorted = values
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function normalizePwaContext(context = {}) {
  const source = context && typeof context === 'object' ? context : {};
  return {
    manifestRef: normalizeString(source.manifestRef, DEFAULT_PWA_CONTEXT.manifestRef),
    cacheMode: normalizeString(source.cacheMode, DEFAULT_PWA_CONTEXT.cacheMode),
    serviceWorkerControlled: normalizeBoolean(source.serviceWorkerControlled, DEFAULT_PWA_CONTEXT.serviceWorkerControlled),
    offlineEligible: normalizeBoolean(source.offlineEligible, DEFAULT_PWA_CONTEXT.offlineEligible)
  };
}

function normalizeStateContext(context = {}) {
  const source = context && typeof context === 'object' ? context : {};
  const snapshot = source.snapshot && typeof source.snapshot === 'object' ? source.snapshot : {};
  return {
    stateSnapshotHash: normalizeString(source.stateSnapshotHash, hashValue(snapshot)),
    stateProjectionMode: normalizeString(source.stateProjectionMode, DEFAULT_STATE_CONTEXT.stateProjectionMode),
    stateOwnership: normalizeString(source.stateOwnership, DEFAULT_STATE_CONTEXT.stateOwnership)
  };
}

function normalizeSsrContext(context = {}) {
  const source = context && typeof context === 'object' ? context : {};
  return {
    ssrRoundtripCount: normalizeInteger(source.ssrRoundtripCount, DEFAULT_SSR_CONTEXT.ssrRoundtripCount),
    serverPrerenderUsed: normalizeBoolean(source.serverPrerenderUsed, DEFAULT_SSR_CONTEXT.serverPrerenderUsed),
    clientDetermined: normalizeBoolean(source.clientDetermined, DEFAULT_SSR_CONTEXT.clientDetermined)
  };
}

function normalizeWorkerMetrics(metrics = {}) {
  const source = metrics && typeof metrics === 'object' ? metrics : {};
  return {
    bootTimeMs: normalizeNumber(source.bootTimeMs),
    templateSyncTimeMs: normalizeNumber(source.templateSyncTimeMs),
    queueDepthMax: normalizeInteger(source.queueDepthMax),
    computeLatencyMs: normalizeNumber(source.computeLatencyMs),
    transferBytes: normalizeInteger(source.transferBytes),
    staleResponses: normalizeInteger(source.staleResponses),
    supersededResponses: normalizeInteger(source.supersededResponses),
    missingApis: Array.isArray(source.missingApis) ? source.missingApis.map(String) : [],
    available: source.available !== false
  };
}

function normalizeUiMetrics(metrics = {}) {
  const source = metrics && typeof metrics === 'object' ? metrics : {};
  return {
    visibleCommitMs: normalizeNumber(source.visibleCommitMs),
    interactionReadyMs: normalizeNumber(source.interactionReadyMs),
    hydrationCommitMs: normalizeNumber(source.hydrationCommitMs),
    longTaskCount: normalizeInteger(source.longTaskCount),
    mainThreadBusyMs: normalizeNumber(source.mainThreadBusyMs)
  };
}

function normalizeBoundaries(boundaries = {}) {
  const source = boundaries && typeof boundaries === 'object' ? boundaries : {};
  return {
    workerDomMutation: source.workerDomMutation === true,
    workerEventBinding: source.workerEventBinding === true,
    workerStateOwnership: source.workerStateOwnership === true,
    trustedDomCommit: normalizeString(source.trustedDomCommit, 'main-thread'),
    stateOwnership: normalizeString(source.stateOwnership, 'main-thread'),
    staleCommitted: source.staleCommitted === true,
    hostServicesExecuted: normalizeInteger(source.hostServicesExecuted)
  };
}

function normalizeRun(input = {}, index = 0) {
  const source = input && typeof input === 'object' ? input : {};
  const samples = Array.isArray(source.samples) ? source.samples : [];
  const uiSamples = samples.map((sample) => normalizeUiMetrics(sample && sample.ui || sample));
  const workerSamples = samples.map((sample) => normalizeWorkerMetrics(sample && sample.worker || {}));
  const uiMetrics = normalizeUiMetrics(source.ui || {});
  const workerMetrics = normalizeWorkerMetrics(source.worker || {});

  if (uiSamples.length) {
    uiMetrics.visibleCommitMs = median(uiSamples.map((sample) => sample.visibleCommitMs));
    uiMetrics.interactionReadyMs = median(uiSamples.map((sample) => sample.interactionReadyMs));
    uiMetrics.hydrationCommitMs = median(uiSamples.map((sample) => sample.hydrationCommitMs));
    uiMetrics.longTaskCount = Math.max(...uiSamples.map((sample) => sample.longTaskCount));
    uiMetrics.mainThreadBusyMs = median(uiSamples.map((sample) => sample.mainThreadBusyMs));
  }

  if (workerSamples.length) {
    workerMetrics.bootTimeMs = median(workerSamples.map((sample) => sample.bootTimeMs));
    workerMetrics.templateSyncTimeMs = median(workerSamples.map((sample) => sample.templateSyncTimeMs));
    workerMetrics.queueDepthMax = Math.max(...workerSamples.map((sample) => sample.queueDepthMax));
    workerMetrics.computeLatencyMs = median(workerSamples.map((sample) => sample.computeLatencyMs));
    workerMetrics.transferBytes = Math.max(...workerSamples.map((sample) => sample.transferBytes));
    workerMetrics.staleResponses = Math.max(...workerSamples.map((sample) => sample.staleResponses));
    workerMetrics.supersededResponses = Math.max(...workerSamples.map((sample) => sample.supersededResponses));
  }

  return {
    schema: SUPER_PREWARM_WORKER_RUN_SCHEMA,
    id: normalizeString(source.id, `run-${index + 1}`),
    mode: normalizeMode(source.mode),
    cachePass: normalizeCachePass(source.cachePass),
    scenario: normalizeString(source.scenario, 'client-driven-ui'),
    sampleCount: Math.max(normalizeInteger(source.sampleCount), samples.length || 1),
    lanes: {
      workerHydrate: normalizeString(source.lanes && source.lanes.workerHydrate, EXPERIMENT_LANES.workerHydrate),
      prewarm: normalizeString(source.lanes && source.lanes.prewarm, EXPERIMENT_LANES.prewarm),
      warmReentry: normalizeString(source.lanes && source.lanes.warmReentry, EXPERIMENT_LANES.warmReentry),
      diagnostics: normalizeString(source.lanes && source.lanes.diagnostics, EXPERIMENT_LANES.diagnostics)
    },
    pwa: normalizePwaContext(source.pwa),
    state: normalizeStateContext(source.state),
    ssr: normalizeSsrContext(source.ssr),
    worker: workerMetrics,
    ui: uiMetrics,
    boundaries: normalizeBoundaries(source.boundaries),
    samples: cloneJson(samples, [])
  };
}

function collectDiagnostics(runs) {
  const diagnostics = [];
  runs.forEach((run) => {
    if (run.boundaries.workerDomMutation) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.worker_dom_owner', 'Super Prewarm Worker may not mutate DOM.', 'error', { runId: run.id }));
    }
    if (run.boundaries.workerEventBinding) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.worker_event_owner', 'Super Prewarm Worker may not bind host events.', 'error', { runId: run.id }));
    }
    if (run.boundaries.workerStateOwnership || run.state.stateOwnership !== 'main-thread' || run.boundaries.stateOwnership !== 'main-thread') {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.worker_state_owner', 'Canonical state ownership must remain on the main thread.', 'error', { runId: run.id }));
    }
    if (run.boundaries.trustedDomCommit !== 'main-thread') {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.trusted_commit_not_main_thread', 'Trusted DOM commit must stay on the main thread.', 'error', { runId: run.id }));
    }
    if (run.boundaries.hostServicesExecuted > 0) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.worker_host_services', 'Worker responses may not execute host services.', 'error', { runId: run.id, hostServicesExecuted: run.boundaries.hostServicesExecuted }));
    }
    if (run.boundaries.staleCommitted) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.stale_response_committed', 'Superseded worker responses must be discarded before commit.', 'error', { runId: run.id }));
    }
    if (run.mode === 'superPrewarmWorker' && run.ssr.ssrRoundtripCount > 0) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.ssr_roundtrip', 'Super Prewarm Worker evidence must not use an SSR roundtrip.', 'error', { runId: run.id, ssrRoundtripCount: run.ssr.ssrRoundtripCount }));
    }
    if (run.mode === 'superPrewarmWorker' && run.ssr.serverPrerenderUsed) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.server_prerender_used', 'Super Prewarm Worker evidence must stay client-determined.', 'error', { runId: run.id }));
    }
    if (run.mode !== 'baseline' && run.worker.available === false) {
      diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.worker_unavailable', 'Worker evidence is degraded because required browser APIs are missing.', 'warning', { runId: run.id, missingApis: run.worker.missingApis }));
    }
  });
  return diagnostics;
}

function summarizeRuns(runs) {
  return RUN_MODES.reduce((summary, mode) => {
    const modeRuns = runs.filter((run) => run.mode === mode);
    summary[mode] = {
      runCount: modeRuns.length,
      sampleCount: modeRuns.reduce((sum, run) => sum + run.sampleCount, 0),
      medianVisibleCommitMs: median(modeRuns.map((run) => run.ui.visibleCommitMs)),
      medianInteractionReadyMs: median(modeRuns.map((run) => run.ui.interactionReadyMs)),
      medianHydrationCommitMs: median(modeRuns.map((run) => run.ui.hydrationCommitMs)),
      longTaskCountMax: modeRuns.length ? Math.max(...modeRuns.map((run) => run.ui.longTaskCount)) : 0,
      mainThreadBusyMsMedian: median(modeRuns.map((run) => run.ui.mainThreadBusyMs)),
      supersededResponseCount: modeRuns.reduce((sum, run) => sum + run.worker.supersededResponses, 0),
      staleResponseCount: modeRuns.reduce((sum, run) => sum + run.worker.staleResponses, 0)
    };
    return summary;
  }, {});
}

function improvementRatio(baseline, candidate) {
  if (!Number.isFinite(baseline) || baseline <= 0 || !Number.isFinite(candidate)) return 0;
  return (baseline - candidate) / baseline;
}

function classifyEvidence(summary, diagnostics) {
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) return 'negative-signal';
  const baseline = summary.baseline;
  const current = summary.prewarmWorker;
  const candidate = summary.superPrewarmWorker;
  if (!baseline || !candidate || baseline.sampleCount === 0 || candidate.sampleCount === 0) return 'inconclusive';
  if (candidate.longTaskCountMax > baseline.longTaskCountMax || candidate.staleResponseCount > 0) return 'negative-signal';
  const visibleImprovement = improvementRatio(baseline.medianVisibleCommitMs, candidate.medianVisibleCommitMs);
  const readyImprovement = improvementRatio(baseline.medianInteractionReadyMs, candidate.medianInteractionReadyMs);
  const currentVisibleImprovement = current && current.sampleCount > 0
    ? improvementRatio(current.medianVisibleCommitMs, candidate.medianVisibleCommitMs)
    : 0;
  if (visibleImprovement >= 0.1 || readyImprovement >= 0.1 || currentVisibleImprovement >= 0.05) return 'positive-signal';
  if (visibleImprovement <= -0.1 || readyImprovement <= -0.1) return 'negative-signal';
  return 'neutral';
}

function createUiComputeEnvelope(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const generation = normalizeInteger(source.generation, 1);
  const hydrationKey = normalizeString(source.hydrationKey, normalizeString(source.rootId, 'super-prewarm-root'));
  return {
    kind: 'rmt_ui_compute_request',
    version: '1.0',
    action: normalizeString(source.action, 'ui_compute'),
    executionMode: normalizeString(source.executionMode, 'worker_prerender_hydrate'),
    prerenderTransport: 'worker',
    rootId: normalizeString(source.rootId, hydrationKey),
    hydrationKey,
    generation,
    expectedGeneration: generation,
    clientDetermined: source.clientDetermined !== false,
    template: cloneJson(source.template, { id: 'super-prewarm-template' }),
    model: cloneJson(source.model, {}),
    metadata: {
      ...(source.metadata && typeof source.metadata === 'object' ? cloneJson(source.metadata, {}) : {}),
      hydrationGeneration: generation,
      stateOwnership: 'main-thread',
      trustedDomCommit: 'main-thread',
      hostServicesAllowed: false
    },
    plan: {
      executionMode: 'worker_prerender_hydrate',
      phases: [
        { id: 'ui_compute', kind: 'compute', transport: 'worker' },
        { id: 'chunk_transfer', kind: 'transfer', transport: 'worker_to_main' },
        { id: 'trusted_main_thread_commit', kind: 'hydrate', transport: 'main' }
      ]
    }
  };
}

function createSuperPrewarmWorkerExperimentReport(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const runs = (Array.isArray(source.runs) ? source.runs : []).map(normalizeRun);
  const diagnostics = collectDiagnostics(runs);
  const summary = summarizeRuns(runs);
  const classification = classifyEvidence(summary, diagnostics);
  const runModes = Array.from(new Set(runs.map((run) => run.mode)));
  const cachePasses = Array.from(new Set(runs.map((run) => run.cachePass)));
  const modeCoverageComplete = RUN_MODES.every((mode) => runModes.includes(mode));
  const cacheCoverageComplete = CACHE_PASSES.every((cachePass) => cachePasses.includes(cachePass));

  if (!modeCoverageComplete) {
    diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.mode_coverage_incomplete', 'Experiment evidence must compare baseline, prewarmWorker and superPrewarmWorker modes.', 'warning', { runModes }));
  }
  if (!cacheCoverageComplete) {
    diagnostics.push(createDiagnostic('xtend.maraca.super_prewarm.cache_coverage_incomplete', 'Experiment evidence should include cold and warm cache passes.', 'warning', { cachePasses }));
  }

  const ok = !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    schema: SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA,
    runSchema: SUPER_PREWARM_WORKER_RUN_SCHEMA,
    diagnosticSchema: SUPER_PREWARM_WORKER_DIAGNOSTIC_SCHEMA,
    status: ok ? 'evidence-collected' : 'evidence-invalid',
    ok,
    classification,
    evidenceMode: 'browser-pwa-first',
    releaseBlocking: false,
    reportPath: normalizeString(options.reportPath, SUPER_PREWARM_WORKER_EVIDENCE_REPORT_PATH),
    runModes,
    cachePasses,
    modeCoverageComplete,
    cacheCoverageComplete,
    pwaAttachment: {
      engineImplemented: false,
      manifestEngineScope: 'attachment-point-only',
      hooks: ['cache-management', 'state-management', 'ssr-metadata', 'prewarm-warm-reentry-policy']
    },
    boundaries: {
      workerDomMutation: false,
      workerEventBinding: false,
      workerStateOwnership: false,
      trustedDomCommit: 'main-thread',
      stateOwnership: 'main-thread'
    },
    lanes: { ...EXPERIMENT_LANES },
    summary,
    runs,
    diagnostics
  };
}

module.exports = {
  CACHE_PASSES,
  DEFAULT_PWA_CONTEXT,
  DEFAULT_SSR_CONTEXT,
  DEFAULT_STATE_CONTEXT,
  EXPERIMENT_LANES,
  RUN_MODES,
  SUPER_PREWARM_WORKER_DIAGNOSTIC_SCHEMA,
  SUPER_PREWARM_WORKER_EVIDENCE_REPORT_PATH,
  SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA,
  SUPER_PREWARM_WORKER_RUN_SCHEMA,
  createSuperPrewarmWorkerExperimentReport,
  createUiComputeEnvelope
};
