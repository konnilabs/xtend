/* modules/rmt-diagnostics.js */
(function registerRmtDiagnosticsModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtDiagnostics = function createRmtDiagnostics(deps = {}) {
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => Date.now());
        const maxSamples = Number.isFinite(deps.maxSamples) && deps.maxSamples > 0
            ? Math.max(Math.floor(deps.maxSamples), 24)
            : 160;
        const maxLifecycleEvents = Number.isFinite(deps.maxLifecycleEvents) && deps.maxLifecycleEvents > 0
            ? Math.max(Math.floor(deps.maxLifecycleEvents), 24)
            : 160;
        const maxPressureTransitions = Number.isFinite(deps.maxPressureTransitions) && deps.maxPressureTransitions > 0
            ? Math.max(Math.floor(deps.maxPressureTransitions), 12)
            : 64;
        const pressureThresholds = normalizePressureThresholds(deps.pressureThresholds || {});
        const performanceSamples = [];
        const lifecycleEvents = [];
        const pressureTransitions = [];
        const laneStats = Object.create(null);
        let queueState = createEmptyQueueState();
        let pressureLevel = 'normal';
        let lastPressureChangedAt = now();

        function normalizeText(value, fallback = '') {
            const safeValue = String(value || '').trim();
            return safeValue || fallback;
        }

        function normalizeNonNegativeNumber(value, fallback = 0) {
            return Number.isFinite(value) && value >= 0 ? value : fallback;
        }

        function createEmptyQueueState() {
            return {
                pending: 0,
                byLane: Object.create(null),
                byStrategy: Object.create(null),
                oldestWaitMs: 0,
                congestionScore: 0,
                updatedAt: now(),
                reason: 'initial'
            };
        }

        function copyPlainRecord(record = {}) {
            const result = {};
            Object.keys(record).forEach((key) => {
                result[key] = record[key];
            });
            return result;
        }

        function normalizeLane(rawLane, fallbackLane = 'visible_commit') {
            const safeLane = normalizeText(rawLane, fallbackLane);
            switch (safeLane) {
            case 'critical_input':
            case 'visible_commit':
            case 'hydration_followup':
            case 'background_prepare':
            case 'idle_maintenance':
                return safeLane;
            default:
                return fallbackLane;
            }
        }

        function normalizePressureThresholds(rawThresholds) {
            const defaults = {
                elevated: {
                    avgDurationMs: 8,
                    avgWaitMs: 18,
                    pending: 4,
                    oldestWaitMs: 40,
                    longTaskRatio: 0.12,
                    congestionScore: 70
                },
                constrained: {
                    avgDurationMs: 14,
                    avgWaitMs: 36,
                    pending: 7,
                    oldestWaitMs: 80,
                    longTaskRatio: 0.24,
                    congestionScore: 120
                },
                critical: {
                    avgDurationMs: 22,
                    avgWaitMs: 64,
                    pending: 10,
                    oldestWaitMs: 130,
                    longTaskRatio: 0.35,
                    congestionScore: 180
                }
            };
            const normalized = {};
            Object.keys(defaults).forEach((level) => {
                const source = rawThresholds && rawThresholds[level] && typeof rawThresholds[level] === 'object'
                    ? rawThresholds[level]
                    : {};
                normalized[level] = {
                    avgDurationMs: normalizeNonNegativeNumber(source.avgDurationMs, defaults[level].avgDurationMs),
                    avgWaitMs: normalizeNonNegativeNumber(source.avgWaitMs, defaults[level].avgWaitMs),
                    pending: normalizeNonNegativeNumber(source.pending, defaults[level].pending),
                    oldestWaitMs: normalizeNonNegativeNumber(source.oldestWaitMs, defaults[level].oldestWaitMs),
                    longTaskRatio: normalizeNonNegativeNumber(source.longTaskRatio, defaults[level].longTaskRatio),
                    congestionScore: normalizeNonNegativeNumber(source.congestionScore, defaults[level].congestionScore)
                };
            });
            return normalized;
        }

        function pushBoundedEntry(buffer, entry, limit) {
            buffer.push(entry);
            if (buffer.length > limit) {
                buffer.splice(0, buffer.length - limit);
            }
        }

        function ensureLaneStatsRecord(lane) {
            const safeLane = normalizeLane(lane, 'visible_commit');
            if (!laneStats[safeLane]) {
                laneStats[safeLane] = {
                    scheduled: 0,
                    started: 0,
                    executed: 0,
                    failed: 0,
                    aborted: 0,
                    panicBlocked: 0,
                    cancelled: 0,
                    stale: 0,
                    lastRequestedAt: 0,
                    lastCompletedAt: 0,
                    totalWaitMs: 0,
                    totalRunMs: 0,
                    externalSamples: 0
                };
            }
            return laneStats[safeLane];
        }

        function summarizePerformanceSamples() {
            if (performanceSamples.length === 0) {
                return {
                    sampleCount: 0,
                    avgDurationMs: 0,
                    avgWaitMs: 0,
                    maxDurationMs: 0,
                    maxWaitMs: 0,
                    longTaskCount: 0,
                    longTaskRatio: 0,
                    droppedFrameCount: 0,
                    lastSampleAt: 0
                };
            }

            let totalDurationMs = 0;
            let totalWaitMs = 0;
            let maxDurationMs = 0;
            let maxWaitMs = 0;
            let longTaskCount = 0;
            let droppedFrameCount = 0;

            performanceSamples.forEach((sample) => {
                totalDurationMs += sample.durationMs;
                totalWaitMs += sample.waitMs;
                if (sample.durationMs > maxDurationMs) maxDurationMs = sample.durationMs;
                if (sample.waitMs > maxWaitMs) maxWaitMs = sample.waitMs;
                if (sample.longTask === true || sample.durationMs >= 50) longTaskCount += 1;
                if (sample.droppedFrameCount > 0) droppedFrameCount += sample.droppedFrameCount;
            });

            return {
                sampleCount: performanceSamples.length,
                avgDurationMs: totalDurationMs / performanceSamples.length,
                avgWaitMs: totalWaitMs / performanceSamples.length,
                maxDurationMs,
                maxWaitMs,
                longTaskCount,
                longTaskRatio: longTaskCount / performanceSamples.length,
                droppedFrameCount,
                lastSampleAt: performanceSamples[performanceSamples.length - 1].at
            };
        }

        function determinePressureLevel(summary, nextQueueState) {
            const critical = pressureThresholds.critical;
            const constrained = pressureThresholds.constrained;
            const elevated = pressureThresholds.elevated;

            const isCritical = (
                summary.avgDurationMs >= critical.avgDurationMs
                || summary.avgWaitMs >= critical.avgWaitMs
                || summary.longTaskRatio >= critical.longTaskRatio
                || nextQueueState.pending >= critical.pending
                || nextQueueState.oldestWaitMs >= critical.oldestWaitMs
                || nextQueueState.congestionScore >= critical.congestionScore
            );
            if (isCritical) return 'critical';

            const isConstrained = (
                summary.avgDurationMs >= constrained.avgDurationMs
                || summary.avgWaitMs >= constrained.avgWaitMs
                || summary.longTaskRatio >= constrained.longTaskRatio
                || nextQueueState.pending >= constrained.pending
                || nextQueueState.oldestWaitMs >= constrained.oldestWaitMs
                || nextQueueState.congestionScore >= constrained.congestionScore
            );
            if (isConstrained) return 'constrained';

            const isElevated = (
                summary.avgDurationMs >= elevated.avgDurationMs
                || summary.avgWaitMs >= elevated.avgWaitMs
                || summary.longTaskRatio >= elevated.longTaskRatio
                || nextQueueState.pending >= elevated.pending
                || nextQueueState.oldestWaitMs >= elevated.oldestWaitMs
                || nextQueueState.congestionScore >= elevated.congestionScore
            );
            if (isElevated) return 'elevated';

            if (nextQueueState.pending === 0 && summary.sampleCount === 0) return 'idle';
            return 'normal';
        }

        function refreshPressure(reason = 'unspecified') {
            const summary = summarizePerformanceSamples();
            const nextPressureLevel = determinePressureLevel(summary, queueState);
            if (nextPressureLevel !== pressureLevel) {
                const previousPressureLevel = pressureLevel;
                pressureLevel = nextPressureLevel;
                lastPressureChangedAt = now();
                pushBoundedEntry(pressureTransitions, {
                    from: previousPressureLevel,
                    to: pressureLevel,
                    at: lastPressureChangedAt,
                    reason: normalizeText(reason, 'unspecified')
                }, maxPressureTransitions);
            }
            return pressureLevel;
        }

        function reportPerformanceSample(sample = {}) {
            const entry = {
                at: now(),
                source: normalizeText(sample.source, 'unknown'),
                sampleType: normalizeText(sample.sampleType || sample.kind, 'external'),
                rootId: normalizeText(sample.rootId, ''),
                lane: normalizeLane(sample.lane, 'visible_commit'),
                durationMs: normalizeNonNegativeNumber(sample.durationMs, 0),
                waitMs: normalizeNonNegativeNumber(sample.waitMs, 0),
                droppedFrameCount: normalizeNonNegativeNumber(sample.droppedFrameCount, 0),
                longTask: sample.longTask === true
            };
            pushBoundedEntry(performanceSamples, entry, maxSamples);
            ensureLaneStatsRecord(entry.lane).externalSamples += 1;
            refreshPressure('performance_sample');
            return getSnapshot();
        }

        function buildQueueSnapshot(snapshot = {}) {
            const byLane = Object.create(null);
            if (snapshot.byLane && typeof snapshot.byLane === 'object') {
                Object.keys(snapshot.byLane).forEach((lane) => {
                    const safeLane = normalizeLane(lane, lane);
                    byLane[safeLane] = normalizeNonNegativeNumber(snapshot.byLane[lane], 0);
                });
            }

            const byStrategy = Object.create(null);
            if (snapshot.byStrategy && typeof snapshot.byStrategy === 'object') {
                Object.keys(snapshot.byStrategy).forEach((strategy) => {
                    const safeStrategy = normalizeText(strategy, 'unknown');
                    byStrategy[safeStrategy] = normalizeNonNegativeNumber(snapshot.byStrategy[strategy], 0);
                });
            }

            const pending = normalizeNonNegativeNumber(snapshot.pending, 0);
            const oldestWaitMs = normalizeNonNegativeNumber(snapshot.oldestWaitMs, 0);
            const congestionScore = normalizeNonNegativeNumber(
                snapshot.congestionScore,
                pending * 12 + Math.min(oldestWaitMs, 240)
            );

            return {
                pending,
                byLane,
                byStrategy,
                oldestWaitMs,
                congestionScore,
                updatedAt: now(),
                reason: normalizeText(snapshot.reason, 'queue_snapshot')
            };
        }

        function updateQueueSnapshot(snapshot = {}) {
            queueState = buildQueueSnapshot(snapshot);
            refreshPressure(queueState.reason);
            return getSnapshot();
        }

        function noteJobLifecycle(event = {}) {
            const phase = normalizeText(event.phase, 'unknown');
            const lane = normalizeLane(event.lane, 'visible_commit');
            const statsRecord = ensureLaneStatsRecord(lane);

            if (phase === 'scheduled') statsRecord.scheduled += 1;
            else if (phase === 'started') statsRecord.started += 1;
            else if (phase === 'executed') statsRecord.executed += 1;
            else if (phase === 'failed') statsRecord.failed += 1;
            else if (phase === 'aborted') statsRecord.aborted += 1;
            else if (phase === 'panic_blocked') statsRecord.panicBlocked += 1;
            else if (phase === 'cancelled') statsRecord.cancelled += 1;
            else if (phase === 'stale_scope' || phase === 'stale_root') statsRecord.stale += 1;

            const waitMs = normalizeNonNegativeNumber(event.waitMs, 0);
            const runMs = normalizeNonNegativeNumber(event.runMs, 0);
            statsRecord.totalWaitMs += waitMs;
            statsRecord.totalRunMs += runMs;

            const timestamp = now();
            if (phase === 'scheduled') statsRecord.lastRequestedAt = timestamp;
            if (phase === 'executed' || phase === 'failed' || phase === 'aborted' || phase === 'panic_blocked' || phase === 'cancelled' || phase === 'stale_scope' || phase === 'stale_root') {
                statsRecord.lastCompletedAt = timestamp;
            }

            pushBoundedEntry(lifecycleEvents, {
                phase,
                lane,
                kind: normalizeText(event.kind, 'task'),
                strategy: normalizeText(event.strategy, 'unknown'),
                rootId: normalizeText(event.rootId, ''),
                scope: normalizeText(event.scope, ''),
                waitMs,
                runMs,
                reason: normalizeText(event.reason, ''),
                at: timestamp
            }, maxLifecycleEvents);

            return {
                lane,
                phase,
                waitMs,
                runMs
            };
        }

        function getBaseLanePolicy(lane) {
            switch (lane) {
            case 'critical_input':
                return {
                    executionStrategy: 'after_paint',
                    delayMs: 0,
                    timeoutMs: 0,
                    preferIdle: false,
                    priority: 500,
                    budgetClass: 'critical_input'
                };
            case 'visible_commit':
                return {
                    executionStrategy: 'after_paint',
                    delayMs: 0,
                    timeoutMs: 0,
                    preferIdle: false,
                    priority: 400,
                    budgetClass: 'visible_commit'
                };
            case 'hydration_followup':
                return {
                    executionStrategy: 'timeout',
                    delayMs: 0,
                    timeoutMs: 48,
                    preferIdle: false,
                    priority: 300,
                    budgetClass: 'hydration_followup'
                };
            case 'idle_maintenance':
                return {
                    executionStrategy: 'idle',
                    delayMs: 80,
                    timeoutMs: 720,
                    preferIdle: true,
                    priority: 120,
                    budgetClass: 'idle_maintenance'
                };
            case 'background_prepare':
            default:
                return {
                    executionStrategy: 'idle',
                    delayMs: 0,
                    timeoutMs: 240,
                    preferIdle: true,
                    priority: 220,
                    budgetClass: 'background_prepare'
                };
            }
        }

        function resolveSchedulingPolicy(request = {}) {
            const requestedKind = normalizeText(request.requestedKind || request.kind, 'deferred') === 'after_paint'
                ? 'after_paint'
                : 'deferred';
            let lane = normalizeLane(
                request.lane,
                requestedKind === 'after_paint' ? 'visible_commit' : 'background_prepare'
            );
            const isVisible = request.isVisible !== false;
            const isUserBlocking = request.userBlocking === true;

            if (!isVisible && lane === 'visible_commit' && (pressureLevel === 'constrained' || pressureLevel === 'critical')) {
                lane = 'hydration_followup';
            }
            if (isUserBlocking && lane !== 'critical_input') {
                lane = requestedKind === 'after_paint' ? 'visible_commit' : 'critical_input';
            }

            const basePolicy = getBaseLanePolicy(lane);
            const policy = {
                requestedKind,
                lane,
                executionStrategy: basePolicy.executionStrategy,
                delayMs: basePolicy.delayMs,
                timeoutMs: basePolicy.timeoutMs,
                preferIdle: basePolicy.preferIdle,
                priority: basePolicy.priority,
                budgetClass: basePolicy.budgetClass,
                coalesceKey: normalizeText(request.coalesceKey, ''),
                deadlineMs: normalizeNonNegativeNumber(request.deadlineMs, 0),
                pressureLevel
            };

            if (requestedKind === 'after_paint' && lane !== 'background_prepare' && lane !== 'idle_maintenance') {
                policy.executionStrategy = 'after_paint';
                policy.preferIdle = false;
                policy.timeoutMs = 0;
            }
            if (requestedKind === 'deferred' && lane === 'critical_input') {
                policy.executionStrategy = 'timeout';
                policy.preferIdle = false;
                policy.timeoutMs = 16;
            }

            if (pressureLevel === 'elevated') {
                if (lane === 'background_prepare') {
                    policy.delayMs = Math.max(policy.delayMs, 24);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 320);
                } else if (lane === 'idle_maintenance') {
                    policy.delayMs = Math.max(policy.delayMs, 140);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 900);
                }
            } else if (pressureLevel === 'constrained') {
                if (lane === 'hydration_followup') {
                    policy.executionStrategy = isVisible ? 'timeout' : 'idle';
                    policy.preferIdle = policy.executionStrategy === 'idle';
                    policy.delayMs = Math.max(policy.delayMs, isVisible ? 8 : 48);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 120);
                } else if (lane === 'background_prepare') {
                    policy.executionStrategy = 'idle';
                    policy.preferIdle = true;
                    policy.delayMs = Math.max(policy.delayMs, 72);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 540);
                } else if (lane === 'idle_maintenance') {
                    policy.delayMs = Math.max(policy.delayMs, 240);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 1200);
                }
            } else if (pressureLevel === 'critical') {
                if (lane === 'hydration_followup') {
                    policy.executionStrategy = isVisible ? 'timeout' : 'idle';
                    policy.preferIdle = policy.executionStrategy === 'idle';
                    policy.delayMs = Math.max(policy.delayMs, isVisible ? 24 : 120);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 220);
                } else if (lane === 'background_prepare') {
                    policy.executionStrategy = 'idle';
                    policy.preferIdle = true;
                    policy.delayMs = Math.max(policy.delayMs, 180);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 900);
                } else if (lane === 'idle_maintenance') {
                    policy.executionStrategy = 'idle';
                    policy.preferIdle = true;
                    policy.delayMs = Math.max(policy.delayMs, 420);
                    policy.timeoutMs = Math.max(policy.timeoutMs, 1600);
                }
            }

            if (Number.isFinite(request.delay) && request.delay >= 0) {
                policy.delayMs = Math.max(policy.delayMs, request.delay);
            }
            if (Number.isFinite(request.timeout) && request.timeout >= 0) {
                policy.timeoutMs = Math.max(policy.timeoutMs, request.timeout);
            }
            if (request.preferIdle === false && policy.executionStrategy === 'idle') {
                policy.executionStrategy = 'timeout';
                policy.preferIdle = false;
            }
            if (request.preferIdle === true && requestedKind !== 'after_paint' && lane !== 'critical_input') {
                policy.executionStrategy = 'idle';
                policy.preferIdle = true;
            }
            if (Number.isFinite(request.priority)) {
                policy.priority = request.priority;
            }
            if (request.budgetClass) {
                policy.budgetClass = normalizeText(request.budgetClass, policy.budgetClass);
            }

            return {
                ...policy,
                queuePending: queueState.pending,
                congestionScore: queueState.congestionScore,
                oldestWaitMs: queueState.oldestWaitMs
            };
        }

        function cloneLaneStats() {
            const result = {};
            Object.keys(laneStats).forEach((lane) => {
                const statsRecord = laneStats[lane];
                result[lane] = {
                    scheduled: statsRecord.scheduled,
                    started: statsRecord.started,
                    executed: statsRecord.executed,
                    failed: statsRecord.failed,
                    aborted: statsRecord.aborted,
                    panicBlocked: statsRecord.panicBlocked,
                    cancelled: statsRecord.cancelled,
                    stale: statsRecord.stale,
                    lastRequestedAt: statsRecord.lastRequestedAt,
                    lastCompletedAt: statsRecord.lastCompletedAt,
                    totalWaitMs: statsRecord.totalWaitMs,
                    totalRunMs: statsRecord.totalRunMs,
                    externalSamples: statsRecord.externalSamples
                };
            });
            return result;
        }

        function getSnapshot() {
            return {
                pressureLevel,
                lastPressureChangedAt,
                pressureThresholds: copyPlainRecord({
                    elevated: copyPlainRecord(pressureThresholds.elevated),
                    constrained: copyPlainRecord(pressureThresholds.constrained),
                    critical: copyPlainRecord(pressureThresholds.critical)
                }),
                queue: {
                    pending: queueState.pending,
                    byLane: copyPlainRecord(queueState.byLane),
                    byStrategy: copyPlainRecord(queueState.byStrategy),
                    oldestWaitMs: queueState.oldestWaitMs,
                    congestionScore: queueState.congestionScore,
                    updatedAt: queueState.updatedAt,
                    reason: queueState.reason
                },
                performance: summarizePerformanceSamples(),
                lanes: cloneLaneStats(),
                recentEvents: lifecycleEvents.slice(),
                transitions: pressureTransitions.slice()
            };
        }

        function reset() {
            performanceSamples.splice(0, performanceSamples.length);
            lifecycleEvents.splice(0, lifecycleEvents.length);
            pressureTransitions.splice(0, pressureTransitions.length);
            Object.keys(laneStats).forEach((lane) => {
                delete laneStats[lane];
            });
            queueState = createEmptyQueueState();
            pressureLevel = 'normal';
            lastPressureChangedAt = now();
            return getSnapshot();
        }

        return Object.freeze({
            getPressureLevel: () => pressureLevel,
            getSnapshot,
            normalizeLane,
            noteJobLifecycle,
            reportPerformanceSample,
            reset,
            resolveSchedulingPolicy,
            updateQueueSnapshot
        });
    };
})(__XTENDRMT_GLOBAL__);
