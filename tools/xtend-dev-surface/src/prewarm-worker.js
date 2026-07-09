'use strict';

function statusForMeasurement(measurement) {
  if (measurement && ['pass', 'warn', 'fail'].includes(measurement.status)) return measurement.status;
  const durationMs = Number(measurement && measurement.durationMs);
  const budgetMs = Number(measurement && measurement.budgetMs);
  if (Number.isFinite(durationMs) && Number.isFinite(budgetMs) && budgetMs > 0) {
    if (durationMs <= budgetMs) return 'pass';
    if (durationMs <= budgetMs * 1.5) return 'warn';
    return 'fail';
  }
  return 'unknown';
}

function gradeForStatus(status) {
  if (status === 'pass') return 'optimal';
  if (status === 'warn') return 'needs-improvement';
  if (status === 'fail') return 'flawed';
  if (status === 'blocked') return 'blocked';
  return 'unknown';
}

function roundNumber(value, digits) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  const factor = 10 ** (digits === undefined ? 2 : digits);
  return Math.round(numberValue * factor) / factor;
}

function createEmptyPhaseBucket(phase) {
  return {
    phase: phase || 'unknown',
    measurementCount: 0,
    passCount: 0,
    warnCount: 0,
    failCount: 0,
    unknownCount: 0,
    budgetMissCount: 0,
    totalDurationMs: 0,
    totalBudgetMs: 0,
    overBudgetMs: 0,
    averageDurationMs: 0,
    budgetUsedPct: 0,
    status: 'unknown',
    grade: 'unknown',
    source: null
  };
}

function finalizePerformanceBucket(bucket) {
  const result = {
    ...bucket,
    totalDurationMs: roundNumber(bucket.totalDurationMs),
    totalBudgetMs: roundNumber(bucket.totalBudgetMs),
    overBudgetMs: roundNumber(bucket.overBudgetMs),
    averageDurationMs: bucket.measurementCount > 0 ? roundNumber(bucket.totalDurationMs / bucket.measurementCount) : 0,
    budgetUsedPct: bucket.totalBudgetMs > 0 ? Math.round((bucket.totalDurationMs / bucket.totalBudgetMs) * 100) : 0
  };
  if (result.failCount > 0) result.status = 'fail';
  else if (result.warnCount > 0) result.status = 'warn';
  else if (result.passCount > 0 && result.unknownCount === 0) result.status = 'pass';
  result.grade = gradeForStatus(result.status);
  return result;
}

function summarizeMeasurements(measurements) {
  const summary = measurements.reduce((result, measurement) => {
    result.totalCount += 1;
    if (measurement.status === 'pass') result.passCount += 1;
    else if (measurement.status === 'warn') result.warnCount += 1;
    else if (measurement.status === 'fail') result.failCount += 1;
    else result.unknownCount += 1;
    result.totalDurationMs += measurement.durationMs || 0;
    result.totalBudgetMs += measurement.budgetMs || 0;
    if (measurement.budgetMs > 0 && measurement.durationMs > measurement.budgetMs) {
      result.budgetMissCount += 1;
      result.overBudgetMs += measurement.durationMs - measurement.budgetMs;
    }
    return result;
  }, {
    totalCount: 0,
    passCount: 0,
    warnCount: 0,
    failCount: 0,
    unknownCount: 0,
    budgetMissCount: 0,
    totalDurationMs: 0,
    totalBudgetMs: 0,
    overBudgetMs: 0,
    averageDurationMs: 0,
    budgetUsedPct: 0,
    status: 'unknown',
    grade: 'unknown'
  });

  summary.totalDurationMs = roundNumber(summary.totalDurationMs);
  summary.totalBudgetMs = roundNumber(summary.totalBudgetMs);
  summary.overBudgetMs = roundNumber(summary.overBudgetMs);
  summary.averageDurationMs = measurements.length > 0 ? roundNumber(summary.totalDurationMs / measurements.length) : 0;
  summary.budgetUsedPct = summary.totalBudgetMs > 0 ? Math.round((summary.totalDurationMs / summary.totalBudgetMs) * 100) : 0;
  if (summary.failCount > 0) summary.status = 'fail';
  else if (summary.warnCount > 0) summary.status = 'warn';
  else if (summary.passCount > 0 && summary.unknownCount === 0) summary.status = 'pass';
  summary.grade = gradeForStatus(summary.status);
  return summary;
}

function normalizePhaseSummary(measurements, providedSummary) {
  const buckets = new Map();
  measurements.forEach((measurement) => {
    const phase = measurement.phase || 'unknown';
    if (!buckets.has(phase)) buckets.set(phase, createEmptyPhaseBucket(phase));
    const bucket = buckets.get(phase);
    bucket.measurementCount += 1;
    if (measurement.status === 'pass') bucket.passCount += 1;
    else if (measurement.status === 'warn') bucket.warnCount += 1;
    else if (measurement.status === 'fail') bucket.failCount += 1;
    else bucket.unknownCount += 1;
    bucket.totalDurationMs += measurement.durationMs || 0;
    bucket.totalBudgetMs += measurement.budgetMs || 0;
    if (measurement.budgetMs > 0 && measurement.durationMs > measurement.budgetMs) {
      bucket.budgetMissCount += 1;
      bucket.overBudgetMs += measurement.durationMs - measurement.budgetMs;
    }
  });

  if (providedSummary && typeof providedSummary === 'object' && !Array.isArray(providedSummary)) {
    Object.keys(providedSummary).forEach((phase) => {
      if (!buckets.has(phase)) buckets.set(phase, createEmptyPhaseBucket(phase));
      buckets.get(phase).source = providedSummary[phase] || {};
    });
  }

  return Array.from(buckets.keys()).sort().map((phase) => finalizePerformanceBucket(buckets.get(phase)));
}

function normalizeTrendSample(sample, index) {
  const source = sample && typeof sample === 'object' ? sample : {};
  const summary = source.summary && typeof source.summary === 'object' ? source.summary : {};
  return {
    id: source.id || `xtend.devsurface.performance-trend.${index + 1}`,
    timestamp: source.timestamp || source.generatedAt || null,
    grade: source.grade || summary.grade || 'unknown',
    totalDurationMs: roundNumber(source.totalDurationMs !== undefined ? source.totalDurationMs : summary.totalDurationMs),
    totalBudgetMs: roundNumber(source.totalBudgetMs !== undefined ? source.totalBudgetMs : summary.totalBudgetMs),
    budgetUsedPct: Number(source.budgetUsedPct !== undefined ? source.budgetUsedPct : summary.budgetUsedPct) || 0,
    budgetMissCount: Number(source.budgetMissCount !== undefined ? source.budgetMissCount : summary.budgetMissCount) || 0
  };
}

function normalizeTrend(source, summary) {
  const rawSamples = Array.isArray(source.samples)
    ? source.samples
    : (Array.isArray(source.trend) ? source.trend : (Array.isArray(source.history) ? source.history : []));
  const samples = rawSamples.map(normalizeTrendSample);
  const currentSample = samples.length > 0 ? samples[samples.length - 1] : normalizeTrendSample({ summary }, 0);
  const previousSample = samples.length > 1 ? samples[samples.length - 2] : null;
  const currentBudgetUsedPct = currentSample.budgetUsedPct || summary.budgetUsedPct || 0;
  const previousBudgetUsedPct = previousSample ? previousSample.budgetUsedPct : null;
  const deltaBudgetUsedPct = previousBudgetUsedPct === null ? 0 : currentBudgetUsedPct - previousBudgetUsedPct;
  let direction = 'stable';
  if (deltaBudgetUsedPct < 0) direction = 'improved';
  else if (deltaBudgetUsedPct > 0) direction = 'regressed';
  return {
    schema: 'xtend.devsurface.performance-view.v1',
    sampleCount: samples.length,
    direction,
    previousBudgetUsedPct,
    currentBudgetUsedPct,
    deltaBudgetUsedPct,
    grade: summary.grade || currentSample.grade || 'unknown',
    samples
  };
}

function normalizeMeasurements(snapshot) {
  const source = snapshot && (snapshot.performanceSnapshot || snapshot.performance) || {};
  const raw = Array.isArray(source.measurements) ? source.measurements : [];
  const measurements = raw.map((measurement, index) => {
    const status = statusForMeasurement(measurement || {});
    const durationMs = Number(measurement.durationMs) || 0;
    const budgetMs = Number(measurement.budgetMs) || 0;
    const budgetDeltaMs = budgetMs > 0 ? roundNumber(durationMs - budgetMs) : 0;
    const budgetUsedPct = budgetMs > 0 ? Math.round((durationMs / budgetMs) * 100) : 0;
    return {
      schema: measurement.schema || 'xtend.performance.measurement.v1',
      id: measurement.id || `xtend.devsurface.measurement.${index + 1}`,
      name: measurement.name || measurement.entryName || `measurement.${index + 1}`,
      phase: measurement.phase || 'unknown',
      profile: measurement.profile || 'unknown',
      lane: measurement.lane || null,
      durationMs,
      budgetMs,
      budgetDeltaMs,
      budgetUsedPct,
      budgetStatus: budgetMs > 0 ? (durationMs > budgetMs ? status : 'pass') : 'unknown',
      status,
      grade: gradeForStatus(status),
      sampleKind: measurement.sampleKind || 'telemetry',
      metadata: measurement.metadata || {}
    };
  });
  const summary = summarizeMeasurements(measurements);
  const phaseSummary = normalizePhaseSummary(measurements, source.phaseSummary);
  const phaseSummaryByPhase = phaseSummary.reduce((result, phase) => {
    result[phase.phase] = phase;
    return result;
  }, {});
  const trend = normalizeTrend(source, summary);
  return {
    schema: 'xtend.devsurface.performance-snapshot.v1',
    viewSchema: 'xtend.devsurface.performance-view.v1',
    measurementSchema: 'xtend.performance.measurement.v1',
    supported: measurements.length > 0,
    measurements,
    phaseSummary,
    phaseSummaryByPhase,
    budget: {
      schema: 'xtend.devsurface.performance-view.v1',
      grade: summary.grade,
      status: summary.status,
      budgetUsedPct: summary.budgetUsedPct,
      budgetMissCount: summary.budgetMissCount,
      totalDurationMs: summary.totalDurationMs,
      totalBudgetMs: summary.totalBudgetMs,
      overBudgetMs: summary.overBudgetMs
    },
    trend,
    summary
  };
}

function normalizeFabric(snapshot) {
  const source = snapshot && (snapshot.fabricTelemetrySnapshot || snapshot.fabric) || {};
  const laneSource = source.lanes || {};

  function normalizeFiber(fiber, laneId, index) {
    if (typeof fiber === 'string') {
      return {
        id: fiber,
        label: fiber,
        lane: laneId,
        status: 'reported',
        durationMs: 0,
        budgetMs: 0,
        budgetUsedPct: 0,
        failed: false,
        budgetMiss: false,
        metadata: {}
      };
    }
    const entry = fiber && typeof fiber === 'object' ? fiber : {};
    const durationMs = Number(entry.durationMs) || 0;
    const budgetMs = Number(entry.budgetMs) || 0;
    const status = entry.status || (entry.failed === true ? 'failed' : 'reported');
    return {
      id: entry.id || entry.fiberId || entry.name || `${laneId}.fiber.${index + 1}`,
      label: entry.label || entry.name || entry.id || entry.fiberId || `${laneId}.fiber.${index + 1}`,
      lane: entry.lane || laneId,
      status,
      durationMs,
      budgetMs,
      budgetUsedPct: budgetMs > 0 ? Math.round((durationMs / budgetMs) * 100) : 0,
      failed: entry.failed === true || status === 'failed',
      budgetMiss: entry.budgetMiss === true || (budgetMs > 0 && durationMs > budgetMs),
      metadata: entry.metadata || {}
    };
  }

  function normalizeLane(laneId, lane) {
    const sourceLane = lane || {};
    const normalizedLaneId = sourceLane.lane || sourceLane.id || laneId;
    const fibers = Array.isArray(sourceLane.fibers)
      ? sourceLane.fibers.map((fiber, index) => normalizeFiber(fiber, normalizedLaneId, index))
      : (Array.isArray(sourceLane.fiberRecords) ? sourceLane.fiberRecords.map((fiber, index) => normalizeFiber(fiber, normalizedLaneId, index)) : []);
    const fiberCount = Number(sourceLane.fiberCount) || fibers.length;
    const failedCount = Number(sourceLane.failedCount) || fibers.filter((fiber) => fiber.failed).length;
    const budgetMissCount = Number(sourceLane.budgetMissCount) || fibers.filter((fiber) => fiber.budgetMiss).length;
    const deadlineMs = Number(sourceLane.deadlineMs) || 0;
    const maxDurationMs = Number(sourceLane.maxDurationMs || sourceLane.averageDurationMs) || 0;
    const averageDurationMs = Number(sourceLane.averageDurationMs) || 0;
    const utilizationRawPct = deadlineMs > 0 ? Math.round((Math.max(maxDurationMs, averageDurationMs) / deadlineMs) * 100) : 0;
    const utilizationPct = Math.min(100, utilizationRawPct);
    const backpressureLevel = sourceLane.backpressureLevel || sourceLane.backpressure && sourceLane.backpressure.level || (
      utilizationRawPct >= 150 || failedCount > 0 ? 'critical' : (utilizationRawPct >= 100 || budgetMissCount > 0 ? 'high' : 'none')
    );
    const health = failedCount > 0 || budgetMissCount > 0 || ['high', 'critical'].includes(backpressureLevel)
      ? (backpressureLevel === 'critical' || failedCount > 0 ? 'degraded' : 'observing')
      : 'healthy';
    return {
      schema: 'xtend.devsurface.fabric-view.v1',
      lane: normalizedLaneId,
      priority: sourceLane.priority || 'normal',
      budgetClass: sourceLane.budgetClass || 'unknown',
      deadlineMs,
      fiberCount,
      activeFiberCount: Number(sourceLane.activeFiberCount) || 0,
      pendingFiberCount: Number(sourceLane.pendingFiberCount || sourceLane.queuedFiberCount) || 0,
      suspendedFiberCount: Number(sourceLane.suspendedFiberCount) || 0,
      completedCount: Number(sourceLane.completedCount) || 0,
      failedCount,
      budgetMissCount,
      failureRatePct: fiberCount > 0 ? Math.round((failedCount / fiberCount) * 100) : 0,
      budgetMissRatePct: fiberCount > 0 ? Math.round((budgetMissCount / fiberCount) * 100) : 0,
      averageDurationMs,
      maxDurationMs,
      utilizationPct,
      utilizationRawPct,
      backpressureLevel,
      health,
      fibers,
      metadata: sourceLane.metadata || {}
    };
  }

  const lanes = Array.isArray(laneSource)
    ? laneSource.map((lane, index) => normalizeLane(lane && (lane.lane || lane.id) || `lane.${index + 1}`, lane))
    : Object.keys(laneSource).sort().map((laneId) => normalizeLane(laneId, laneSource[laneId]));
  const totals = source.totals || {};
  const computedTotals = lanes.reduce((result, lane) => {
    result.fiberCount += lane.fiberCount;
    result.completedCount += lane.completedCount;
    result.failedCount += lane.failedCount;
    result.budgetMissCount += lane.budgetMissCount;
    result.activeFiberCount += lane.activeFiberCount;
    result.pendingFiberCount += lane.pendingFiberCount;
    result.suspendedFiberCount += lane.suspendedFiberCount;
    result.maxUtilizationPct = Math.max(result.maxUtilizationPct, lane.utilizationRawPct);
    result.totalUtilizationPct += lane.utilizationRawPct;
    return result;
  }, {
    fiberCount: 0,
    completedCount: 0,
    failedCount: 0,
    budgetMissCount: 0,
    activeFiberCount: 0,
    pendingFiberCount: 0,
    suspendedFiberCount: 0,
    maxUtilizationPct: 0,
    totalUtilizationPct: 0
  });
  const rawBackpressure = source.backpressure || {};
  const laneIds = Array.isArray(rawBackpressure.laneIds)
    ? rawBackpressure.laneIds
    : (Array.isArray(rawBackpressure.lanes) ? rawBackpressure.lanes : (Array.isArray(rawBackpressure.pressureLaneIds) ? rawBackpressure.pressureLaneIds : []));
  const inferredLevel = lanes.some((lane) => lane.backpressureLevel === 'critical')
    ? 'critical'
    : (lanes.some((lane) => lane.backpressureLevel === 'high') ? 'high' : 'none');
  const backpressure = {
    schema: 'xtend.devsurface.fabric-view.v1',
    level: rawBackpressure.level || rawBackpressure.status || inferredLevel,
    action: rawBackpressure.action || rawBackpressure.recommendedAction || (inferredLevel === 'none' ? 'observe' : 'defer-or-rebalance'),
    laneIds,
    pressureLaneCount: laneIds.length || lanes.filter((lane) => ['high', 'critical'].includes(lane.backpressureLevel)).length,
    reason: rawBackpressure.reason || null,
    metadata: rawBackpressure.metadata || {}
  };
  const criticalLanes = lanes.filter((lane) => lane.health !== 'healthy' || ['high', 'critical'].includes(lane.backpressureLevel));
  const fiberCount = Number(source.fiberCount || totals.fiberCount) || computedTotals.fiberCount;
  const failedCount = Number(totals.failedCount) || computedTotals.failedCount;
  const budgetMissCount = Number(totals.budgetMissCount) || computedTotals.budgetMissCount;
  const health = criticalLanes.length > 0 || ['critical', 'high'].includes(backpressure.level) ? 'degraded' : 'healthy';
  const fiberSummary = {
    schema: 'xtend.devsurface.fabric-view.v1',
    fiberCount,
    completedCount: Number(totals.completedCount) || computedTotals.completedCount,
    failedCount,
    budgetMissCount,
    activeFiberCount: Number(totals.activeFiberCount) || computedTotals.activeFiberCount,
    pendingFiberCount: Number(totals.pendingFiberCount) || computedTotals.pendingFiberCount,
    suspendedFiberCount: Number(totals.suspendedFiberCount) || computedTotals.suspendedFiberCount
  };
  const summary = {
    schema: 'xtend.devsurface.fabric-view.v1',
    health,
    laneCount: lanes.length,
    fiberCount,
    completedCount: fiberSummary.completedCount,
    failedCount,
    budgetMissCount,
    criticalLaneCount: criticalLanes.length,
    degradedLaneCount: lanes.filter((lane) => lane.health !== 'healthy').length,
    backpressureLevel: backpressure.level,
    pressureLaneCount: backpressure.pressureLaneCount,
    averageUtilizationPct: lanes.length > 0 ? Math.round(computedTotals.totalUtilizationPct / lanes.length) : 0,
    maxUtilizationPct: computedTotals.maxUtilizationPct,
    needsAttention: health !== 'healthy' || failedCount > 0 || budgetMissCount > 0
  };

  return {
    schema: 'xtend.devsurface.fabric-snapshot.v1',
    viewSchema: 'xtend.devsurface.fabric-view.v1',
    telemetrySchema: source.schema || 'xtend.fabric.telemetry-snapshot.v1',
    id: source.id || null,
    fiberCount,
    diagnosticCount: Number(source.diagnosticCount) || 0,
    lanes,
    laneCount: lanes.length,
    totals,
    backpressure,
    fiberSummary,
    criticalLanes,
    summary,
    health
  };
}

function normalizeKernel(snapshot) {
  const source = snapshot && (snapshot.kernelSnapshot || snapshot.kernel) || {};
  const state = source.state || source.panicState || 'none';
  const healthByState = {
    none: 'healthy',
    suspected: 'observing',
    active: 'blocked',
    recovering: 'degraded',
    recovered: 'healthy',
    failed: 'blocked'
  };
  const health = healthByState[state] || 'unknown';
  const severity = source.severity || (state === 'none' ? 'info' : 'warning');
  const recoveryAction = source.recoveryAction || source.defaultRecoveryAction || 'none';
  const mitigationStrategy = source.mitigationStrategy || recoveryAction || 'none';
  const blockedCommitCount = Number(source.blockedCommitCount) || 0;
  const criticalViolationCount = Number(source.criticalViolationCount) || 0;
  const recoveryAttemptCount = Number(source.recoveryAttemptCount) || 0;
  const recoveryFailureCount = Number(source.recoveryFailureCount) || 0;
  const recoveryStatus = state === 'failed' || recoveryFailureCount > 0
    ? 'failed'
    : (state === 'recovering'
      ? 'active'
      : (state === 'recovered'
        ? 'completed'
        : (state === 'active' || state === 'suspected' ? 'pending' : 'idle')));

  function normalizeScope(scope, index) {
    if (typeof scope === 'string') {
      return {
        id: scope,
        label: scope,
        kind: 'scope',
        severity,
        status: 'affected',
        mitigationStrategy: null,
        blockedCommitCount: 0,
        criticalViolationCount: 0,
        metadata: {}
      };
    }
    const entry = scope && typeof scope === 'object' ? scope : {};
    const id = entry.id || entry.scopeId || entry.name || `scope.${index + 1}`;
    return {
      id,
      label: entry.label || entry.name || id,
      kind: entry.kind || entry.type || 'scope',
      severity: entry.severity || severity,
      status: entry.status || 'affected',
      mitigationStrategy: entry.mitigationStrategy || entry.strategy || null,
      blockedCommitCount: Number(entry.blockedCommitCount) || 0,
      criticalViolationCount: Number(entry.criticalViolationCount) || 0,
      metadata: entry.metadata || {}
    };
  }

  function normalizeJob(job, index) {
    if (typeof job === 'string') {
      return {
        id: job,
        label: job,
        status: 'affected',
        severity,
        lane: null,
        metadata: {}
      };
    }
    const entry = job && typeof job === 'object' ? job : {};
    const id = entry.id || entry.jobId || entry.name || `job.${index + 1}`;
    return {
      id,
      label: entry.label || entry.name || id,
      status: entry.status || 'affected',
      severity: entry.severity || severity,
      lane: entry.lane || null,
      metadata: entry.metadata || {}
    };
  }

  function normalizeMitigation(mitigation, index) {
    if (typeof mitigation === 'string') {
      return {
        id: `mitigation.${index + 1}`,
        strategy: mitigation,
        action: mitigation,
        status: 'pending',
        scope: null,
        evidence: null,
        metadata: {}
      };
    }
    const entry = mitigation && typeof mitigation === 'object' ? mitigation : {};
    const strategy = entry.strategy || entry.mitigationStrategy || entry.action || 'none';
    return {
      id: entry.id || entry.mitigationId || `mitigation.${index + 1}`,
      strategy,
      action: entry.action || entry.recoveryAction || strategy,
      status: entry.status || 'pending',
      scope: entry.scope || entry.scopeId || null,
      evidence: entry.evidence || null,
      metadata: entry.metadata || {}
    };
  }

  const rawAffectedScopes = Array.isArray(source.affectedScopes)
    ? source.affectedScopes
    : (source.affectedScopes ? [source.affectedScopes] : []);
  const rawAffectedJobs = Array.isArray(source.affectedJobs)
    ? source.affectedJobs
    : (source.affectedJobs ? [source.affectedJobs] : []);
  const affectedScopes = rawAffectedScopes.map(normalizeScope);
  const affectedJobs = rawAffectedJobs.map(normalizeJob);
  const rawMitigations = Array.isArray(source.mitigationStrategies)
    ? source.mitigationStrategies
    : (Array.isArray(source.mitigations) ? source.mitigations : (Array.isArray(source.mitigationPlan) ? source.mitigationPlan : []));
  const mitigationStrategies = rawMitigations.length > 0
    ? rawMitigations.map(normalizeMitigation)
    : (mitigationStrategy && mitigationStrategy !== 'none'
      ? [normalizeMitigation({ strategy: mitigationStrategy, action: recoveryAction, status: recoveryStatus }, 0)]
      : []);
  const panic = {
    schema: 'xtend.devsurface.kernel-monitor.v1',
    state,
    health,
    severity,
    trigger: source.trigger || null,
    panicId: source.panicId || null,
    correlationId: source.correlationId || null,
    detectedAt: source.detectedAt || source.startedAt || null,
    lastSeenAt: source.lastSeenAt || source.updatedAt || null
  };
  const recovery = {
    schema: 'xtend.devsurface.kernel-monitor.v1',
    status: recoveryStatus,
    action: recoveryAction,
    strategy: mitigationStrategy,
    attemptCount: recoveryAttemptCount,
    failureCount: recoveryFailureCount,
    blockedCommitCount,
    lastRecoveredAt: source.lastRecoveredAt || source.recoveredAt || null,
    evidence: source.recoveryEvidence || null
  };
  const mitigation = {
    schema: 'xtend.devsurface.kernel-monitor.v1',
    strategy: mitigationStrategy,
    action: recoveryAction,
    count: mitigationStrategies.length,
    strategies: mitigationStrategies
  };
  const summary = {
    schema: 'xtend.devsurface.kernel-monitor.v1',
    health,
    state,
    severity,
    affectedScopeCount: affectedScopes.length,
    affectedJobCount: affectedJobs.length,
    mitigationCount: mitigationStrategies.length,
    blockedCommitCount,
    criticalViolationCount,
    recoveryAttemptCount,
    recoveryFailureCount,
    recoveryStatus,
    needsAttention: health !== 'healthy' || criticalViolationCount > 0 || recoveryFailureCount > 0
  };

  return {
    schema: 'xtend.devsurface.kernel-snapshot.v1',
    viewSchema: 'xtend.devsurface.kernel-monitor.v1',
    panicSchema: source.schema || 'xtend.rmt.kernel-panic-state.v1',
    state,
    health,
    severity,
    trigger: panic.trigger,
    panicId: panic.panicId,
    correlationId: panic.correlationId,
    recoveryAction,
    mitigationStrategy,
    blockedCommitCount,
    criticalViolationCount,
    recoveryAttemptCount,
    recoveryFailureCount,
    affectedScopes,
    affectedJobs,
    panic,
    recovery,
    mitigation,
    summary,
    metadata: source.metadata || {}
  };
}

function normalizeHydrationTiming(timing) {
  const source = timing && typeof timing === 'object' ? timing : {};
  return {
    schema: 'xtend.devsurface.hydration-view.v1',
    ssrRenderMs: roundNumber(source.ssrRenderMs),
    resumeReadMs: roundNumber(source.resumeReadMs),
    hydrateMs: roundNumber(source.hydrateMs),
    firstInteractiveMs: roundNumber(source.firstInteractiveMs),
    clsValue: roundNumber(source.clsValue, 4)
  };
}

function normalizeHydrationSurface(surface, index, fallbackStrategy) {
  if (typeof surface === 'string') {
    return {
      id: surface,
      label: surface,
      rootId: null,
      strategy: fallbackStrategy || 'unknown',
      status: 'unknown',
      resumeTokenPresent: false,
      lazy: false,
      xscalerState: 'unknown',
      timing: normalizeHydrationTiming({}),
      metadata: {}
    };
  }
  const source = surface && typeof surface === 'object' ? surface : {};
  const id = source.id || source.surfaceId || source.rootId || source.name || `surface.${index + 1}`;
  return {
    id,
    label: source.label || source.title || source.name || id,
    rootId: source.rootId || null,
    strategy: source.strategy || fallbackStrategy || 'unknown',
    status: source.status || source.hydrationStatus || source.resumeStatus || source.lazyState || 'unknown',
    resumeTokenPresent: source.resumeTokenPresent === true || Boolean(source.resumeToken),
    lazy: source.lazy === true,
    xscalerState: source.xscalerState || source.preflightStatus || 'unknown',
    timing: normalizeHydrationTiming(source.timing || {}),
    metadata: source.metadata || {}
  };
}

function normalizeAtcSession(session, index) {
  if (typeof session === 'string') {
    return {
      id: session,
      sessionId: session,
      protocol: null,
      route: null,
      mode: null,
      lifecycleState: null,
      activation: null,
      schedulerLane: null,
      componentMix: [],
      metadata: {}
    };
  }
  const source = session && typeof session === 'object' ? session : {};
  const sessionId = source.sessionId || source.id || `xscaler.atc.${index + 1}`;
  return {
    id: sessionId,
    sessionId,
    protocol: source.protocol || null,
    route: source.route || null,
    mode: source.mode || null,
    lifecycleState: source.lifecycleState || null,
    activation: source.activation || null,
    schedulerLane: source.schedulerLane || null,
    componentMix: Array.isArray(source.componentMix) ? source.componentMix.map(String) : [],
    metadata: source.metadata || {}
  };
}

function normalizeXScaler(sourceValue) {
  const source = sourceValue && typeof sourceValue === 'object' ? sourceValue : {};
  const preflights = (Array.isArray(source.preflights)
    ? source.preflights
    : (Array.isArray(source.preflightRecords) ? source.preflightRecords : (Array.isArray(source.preflightHistory) ? source.preflightHistory : [])))
    .map((preflight, index) => {
      const entry = preflight && typeof preflight === 'object' ? preflight : {};
      return {
        id: entry.id || entry.surface || entry.rmtSurface || `xscaler.preflight.${index + 1}`,
        surface: entry.surface || entry.surfaceId || null,
        accepted: entry.accepted === true || entry.ok === true,
        rejected: entry.accepted === false || entry.ok === false,
        networkDuringRender: entry.networkDuringRender === true,
        lazyAfterHydration: entry.lazyAfterHydration === true,
        reason: entry.reason || null,
        rejection: entry.rejection || null,
        atc: entry.atc ? normalizeAtcSession(entry.atc, index) : null,
        metadata: entry.metadata || {}
      };
    });
  const rawAtc = (Array.isArray(source.atcSessions)
    ? source.atcSessions
    : (Array.isArray(source.handoffs) ? source.handoffs : (source.atc ? [source.atc] : [])))
    .concat(preflights.map((preflight) => preflight.atc).filter(Boolean));
  const atcSessions = rawAtc.map(normalizeAtcSession);
  const preflightCount = Number(source.preflightCount) || preflights.length;
  const acceptedCount = Number(source.acceptedCount) || preflights.filter((preflight) => preflight.accepted).length;
  const rejectedCount = Number(source.rejectedCount) || preflights.filter((preflight) => preflight.rejected).length;
  const networkDuringRender = source.networkDuringRender === true || preflights.some((preflight) => preflight.networkDuringRender);
  const lazyLoadedCount = Number(source.lazyLoadedCount || source.lazySurfaceCount) || 0;
  return {
    schema: 'xtend.devsurface.hydration-view.v1',
    mode: source.mode || 'unknown',
    status: networkDuringRender || rejectedCount > 0 ? 'degraded' : (preflightCount > 0 || lazyLoadedCount > 0 || atcSessions.length > 0 ? 'ready' : 'unknown'),
    preflightEndpoint: source.preflightEndpoint || null,
    lazyEndpoint: source.lazyEndpoint || null,
    preflightCount,
    acceptedCount,
    rejectedCount,
    networkDuringRender,
    lazyLoadedCount,
    atcSessionCount: atcSessions.length,
    atcSessions,
    preflights,
    metadata: source.metadata || {}
  };
}

function normalizeHydrationStep(step, index) {
  if (typeof step === 'string') {
    return {
      id: `hydration.step.${index + 1}`,
      label: step,
      kind: 'custom',
      status: 'unknown',
      durationMs: 0,
      at: null,
      metadata: {}
    };
  }
  const source = step && typeof step === 'object' ? step : {};
  const id = source.id || source.stepId || `hydration.step.${index + 1}`;
  return {
    id,
    label: source.label || source.name || id,
    kind: source.kind || source.type || 'custom',
    status: source.status || 'unknown',
    durationMs: Number(source.durationMs) || 0,
    at: source.at || source.timestamp || null,
    metadata: source.metadata || {}
  };
}

function createHydrationTimeline(source, timing, xscaler) {
  const rawSteps = Array.isArray(source.timeline) ? source.timeline : (Array.isArray(source.steps) ? source.steps : []);
  if (rawSteps.length > 0) return rawSteps.map(normalizeHydrationStep);
  const resumeToken = source.resumeToken || source.token || null;
  const responseKind = source.responseKind || source.response && source.response.kind || null;
  const status = source.status || 'unknown';
  const hydrateStatus = status === 'resumed' || status === 'ready'
    ? 'completed'
    : (status === 'hydrating' ? 'active' : (status === 'blocked' ? 'failed' : 'unknown'));
  return [
    { id: 'hydration.ssr-response', label: 'SSR response', kind: 'ssr-response', status: responseKind ? 'completed' : 'unknown', durationMs: timing.ssrRenderMs, metadata: { responseKind } },
    { id: 'hydration.resume-payload', label: 'Resume payload', kind: 'resume-payload', status: resumeToken ? 'completed' : 'unknown', durationMs: timing.resumeReadMs, metadata: { resumeTokenPresent: Boolean(resumeToken) } },
    { id: 'hydration.token-read', label: 'Resume token read', kind: 'token-read', status: resumeToken ? 'completed' : 'unknown', durationMs: timing.resumeReadMs, metadata: {} },
    { id: 'hydration.resume', label: 'Hydrate / resume', kind: 'hydrate-resume', status: hydrateStatus, durationMs: timing.hydrateMs, metadata: { strategy: source.strategy || 'unknown' } },
    { id: 'hydration.xscaler-preflight', label: 'Lazy surface preflight', kind: 'xscaler-preflight', status: xscaler.preflightCount > 0 ? 'completed' : 'unknown', durationMs: 0, metadata: { preflightCount: xscaler.preflightCount, acceptedCount: xscaler.acceptedCount, rejectedCount: xscaler.rejectedCount } },
    { id: 'hydration.atc-handoff', label: 'ATC handoff', kind: 'atc-handoff', status: xscaler.atcSessionCount > 0 ? 'completed' : 'unknown', durationMs: 0, metadata: { atcSessionCount: xscaler.atcSessionCount } }
  ].map(normalizeHydrationStep);
}

function normalizeHydration(snapshot) {
  const source = snapshot && (snapshot.hydrationSnapshot || snapshot.hydration) || {};
  const timing = normalizeHydrationTiming(source.timing || {});
  const xscaler = normalizeXScaler(source.xscaler || {});
  const strategy = source.strategy || source.hydrationStrategy || 'unknown';
  const status = source.status || source.hydrationStatus || (Object.keys(source).length > 0 ? 'ready' : 'unknown');
  const resumeToken = source.resumeToken || source.token || null;
  const resumeTokenRedacted = source.resumeTokenRedacted === true || /redacted|\*{3,}|\u2026/iu.test(String(resumeToken || ''));
  const surfaces = (Array.isArray(source.surfaces) ? source.surfaces : (Array.isArray(source.roots) ? source.roots : []))
    .map((surface, index) => normalizeHydrationSurface(surface, index, strategy));
  const timeline = createHydrationTimeline({ ...source, status, strategy, resumeToken }, timing, xscaler);
  const diagnostics = Array.isArray(source.diagnostics) ? source.diagnostics.map(normalizeDiagnostic) : [];
  if (xscaler.networkDuringRender) {
    diagnostics.push(normalizeDiagnostic({
      schema: 'xtend.devsurface.diagnostic.v1',
      severity: 'warning',
      code: 'xtend.devsurface.hydration.xscaler_network_during_render',
      message: 'XScaler reported network activity during render.',
      metadata: { field: 'xscaler.networkDuringRender' }
    }));
  }
  const summaryStatus = status === 'blocked' || xscaler.networkDuringRender || xscaler.rejectedCount > 0
    ? (status === 'blocked' ? 'blocked' : 'degraded')
    : status;
  return {
    schema: 'xtend.devsurface.hydration-snapshot.v1',
    viewSchema: 'xtend.devsurface.hydration-view.v1',
    supported: Object.keys(source).length > 0 && source.supported !== false,
    strategy,
    status,
    resumeToken,
    resumeTokenRedacted,
    rootId: source.rootId || source.response && source.response.rootId || null,
    adapterKind: source.adapterKind || source.response && source.response.adapterKind || null,
    responseKind: source.responseKind || source.response && source.response.kind || null,
    hydrationSchema: source.hydrationSchema || source.hydration && source.hydration.schema || null,
    timing,
    surfaces,
    surfaceCount: surfaces.length,
    timeline,
    xscaler,
    diagnostics,
    summary: {
      schema: 'xtend.devsurface.hydration-view.v1',
      strategy,
      status: summaryStatus,
      supported: Object.keys(source).length > 0 && source.supported !== false,
      surfaceCount: surfaces.length,
      resumedSurfaceCount: surfaces.filter((surface) => ['resumed', 'ready', 'loaded'].includes(surface.status)).length,
      pendingSurfaceCount: surfaces.filter((surface) => ['pending', 'unknown'].includes(surface.status)).length,
      preflightCount: xscaler.preflightCount,
      acceptedCount: xscaler.acceptedCount,
      rejectedCount: xscaler.rejectedCount,
      networkDuringRender: xscaler.networkDuringRender,
      lazyLoadedCount: xscaler.lazyLoadedCount,
      atcSessionCount: xscaler.atcSessionCount,
      needsAttention: summaryStatus === 'blocked' || summaryStatus === 'degraded' || diagnostics.some((diagnostic) => diagnostic.severity === 'error')
    },
    metadata: source.metadata || {}
  };
}

function createWorkerPathRecord() {
  return {
    schema: 'xtend.devsurface.worker-path.v1',
    extensionSchema: 'xtend.devsurface.extension.v1',
    workpackage: 'XDS-WP-08',
    mode: 'classic-prewarm-worker',
    source: 'tools/xtend-dev-surface/src/prewarm-worker.js',
    dist: 'tools/xtend-dev-surface/dist/prewarm-worker.js',
    inputSchema: 'xtend.devsurface.runtime-bridge-read.v1',
    outputSchema: 'xtend.devsurface.snapshot.v1',
    chartDataSchema: 'xtend.devsurface.worker-path.v1',
    normalizationOnly: true,
    ownsDom: false,
    ownsHostServices: false,
    ownsCanonicalState: false,
    remoteRuntimeAllowed: false,
    allowedMessageTypes: ['xds:normalize-snapshot'],
    outputSections: ['performance', 'hydration', 'fabric', 'kernel', 'gates', 'diagnostics', 'chartData'],
    boundary: {
      rule: 'worker-normalization-only',
      domAccessAllowed: false,
      hostServiceAccessAllowed: false,
      canonicalStateOwnershipAllowed: false,
      runtimeMutationAllowed: false
    }
  };
}

function createWorkerChartData(performance, hydration, fabric, kernel) {
  const measurements = Array.isArray(performance && performance.measurements) ? performance.measurements : [];
  const phases = Array.isArray(performance && performance.phaseSummary) ? performance.phaseSummary : [];
  const hydrationTimeline = Array.isArray(hydration && hydration.timeline) ? hydration.timeline : [];
  const hydrationSurfaces = Array.isArray(hydration && hydration.surfaces) ? hydration.surfaces : [];
  const xscaler = hydration && hydration.xscaler || {};
  const lanes = Array.isArray(fabric && fabric.lanes) ? fabric.lanes : [];
  return {
    schema: 'xtend.devsurface.worker-path.v1',
    generatedBy: 'classic-prewarm-worker',
    normalizationOnly: true,
    performanceBudgetSeries: measurements.map((measurement) => ({
      id: measurement.id,
      label: measurement.name,
      phase: measurement.phase,
      value: measurement.durationMs || 0,
      budget: measurement.budgetMs || 0,
      percent: measurement.budgetUsedPct || 0,
      grade: measurement.grade || 'unknown'
    })),
    performancePhaseSeries: phases.map((phase) => ({
      id: phase.phase,
      label: phase.phase,
      value: phase.totalDurationMs || 0,
      budget: phase.totalBudgetMs || 0,
      percent: phase.budgetUsedPct || 0,
      grade: phase.grade || 'unknown'
    })),
    hydrationTimelineSeries: hydrationTimeline.map((step) => ({
      id: step.id,
      label: step.label,
      kind: step.kind,
      status: step.status,
      value: step.durationMs || 0
    })),
    hydrationSurfaceSeries: hydrationSurfaces.map((surface) => ({
      id: surface.id,
      label: surface.label,
      status: surface.status,
      strategy: surface.strategy,
      lazy: surface.lazy === true,
      xscalerState: surface.xscalerState || 'unknown'
    })),
    xscalerPreflightSeries: [{
      id: 'xscaler.preflight',
      label: 'XScaler Preflight',
      value: xscaler.preflightCount || 0,
      accepted: xscaler.acceptedCount || 0,
      rejected: xscaler.rejectedCount || 0,
      networkDuringRender: xscaler.networkDuringRender === true,
      lazyLoaded: xscaler.lazyLoadedCount || 0
    }],
    fabricLaneSeries: lanes.map((lane) => ({
      id: lane.lane,
      label: lane.lane,
      value: lane.utilizationPct || 0,
      rawValue: lane.utilizationRawPct || lane.utilizationPct || 0,
      fibers: lane.fiberCount || 0,
      failures: lane.failedCount || 0,
      budgetMisses: lane.budgetMissCount || 0,
      health: lane.health || 'unknown',
      backpressureLevel: lane.backpressureLevel || 'unknown'
    })),
    fabricFiberSeries: lanes.flatMap((lane) => {
      const fibers = Array.isArray(lane.fibers) ? lane.fibers : [];
      return fibers.map((fiber) => ({
        id: fiber.id,
        label: fiber.label,
        lane: lane.lane,
        value: fiber.durationMs || 0,
        budget: fiber.budgetMs || 0,
        percent: fiber.budgetUsedPct || 0,
        status: fiber.status || 'unknown'
      }));
    }),
    kernelHealthSeries: [{
      id: 'kernel.health',
      label: 'Kernel Health',
      state: kernel && kernel.state || 'unknown',
      health: kernel && kernel.health || 'unknown',
      severity: kernel && kernel.severity || 'unknown',
      affectedScopes: kernel && kernel.summary && kernel.summary.affectedScopeCount || 0,
      affectedJobs: kernel && kernel.summary && kernel.summary.affectedJobCount || 0
    }]
  };
}

function normalizeDiagnostic(diagnostic) {
  const source = diagnostic && typeof diagnostic === 'object' ? diagnostic : {};
  return {
    schema: source.schema || 'xtend.devsurface.diagnostic.v1',
    source: source.source || 'xtend.devsurface.extension.v1',
    workpackage: source.workpackage || 'XDS-WP-03',
    severity: source.severity || 'warning',
    code: source.code || 'xtend.devsurface.diagnostic',
    message: source.message || 'XTend Dev Surface diagnostic.',
    boundary: source.boundary || null,
    metadata: source.metadata || {}
  };
}

function normalizeSnapshot(snapshot) {
  const devApiPresent = Boolean(snapshot && snapshot.devApiPresent === true);
  const diagnostics = Array.isArray(snapshot && snapshot.diagnostics)
    ? snapshot.diagnostics.map(normalizeDiagnostic)
    : [];
  if (!devApiPresent && !diagnostics.some((diagnostic) => diagnostic.code === 'xtend.devsurface.dev_api.missing')) {
    diagnostics.push(normalizeDiagnostic({
      schema: 'xtend.devsurface.diagnostic.v1',
      severity: 'warning',
      code: 'xtend.devsurface.dev_api.missing',
      message: 'Inspected page does not expose the XTend DEV API.'
    }));
  }
  const performance = normalizeMeasurements(snapshot);
  const hydration = normalizeHydration(snapshot);
  const fabric = normalizeFabric(snapshot);
  const kernel = normalizeKernel(snapshot);
  const workerPath = createWorkerPathRecord();
  const chartData = createWorkerChartData(performance, hydration, fabric, kernel);
  const snapshotDiagnostics = diagnostics.concat(hydration.diagnostics || []);
  return {
    schema: 'xtend.devsurface.snapshot.v1',
    extensionSchema: 'xtend.devsurface.extension.v1',
    runtimeBridgeSchema: snapshot && snapshot.bridgeSchema || 'xtend.devsurface.runtime-bridge.v1',
    runtimeBridge: snapshot && snapshot.bridge || null,
    generatedAt: new Date().toISOString(),
    devApiGlobal: '__XTEND_DEV_API__',
    devApiPresent,
    devApiVersion: snapshot && (snapshot.devApiVersion || snapshot.version) || null,
    companionOrigin: snapshot && snapshot.companionOrigin || 'http://127.0.0.1:27864',
    performance,
    hydration,
    fabric,
    kernel,
    workerPath,
    chartData,
    gates: Array.isArray(snapshot && snapshot.gates) ? snapshot.gates : [],
    diagnostics: snapshotDiagnostics,
    ok: devApiPresent && snapshotDiagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

self.addEventListener('message', function onMessage(event) {
  if (!event.data || event.data.type !== 'xds:normalize-snapshot') return;
  self.postMessage({
    type: 'xds:normalized-snapshot',
    requestId: event.data.requestId,
    snapshot: normalizeSnapshot(event.data.snapshot || {})
  });
});
