/* modules/rmt-priority-queue.js */
(function registerRmtPriorityQueueModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtQueue = function createRmtQueue(deps = {}) {
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => Date.now());
        const pendingJobs = new Map();
        const coalesceIndex = new Map();
        const rootStats = new Map();
        let enqueueSequence = 0;
        let totalEnqueued = 0;
        let totalDequeued = 0;
        let totalRemoved = 0;
        let totalCoalesced = 0;
        let lastDispatchedRootKey = '';

        function normalizeText(value, fallback = '') {
            const safeValue = String(value || '').trim();
            return safeValue || fallback;
        }

        function normalizeNonNegativeNumber(value, fallback = 0) {
            return Number.isFinite(value) && value >= 0 ? value : fallback;
        }

        function normalizeLane(lane, fallbackLane = 'visible_commit') {
            const safeLane = normalizeText(lane, fallbackLane);
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

        function normalizePressureLevel(rawPressureLevel) {
            const safePressureLevel = normalizeText(rawPressureLevel, 'normal');
            switch (safePressureLevel) {
            case 'idle':
            case 'normal':
            case 'elevated':
            case 'constrained':
            case 'critical':
                return safePressureLevel;
            default:
                return 'normal';
            }
        }

        function resolvePressureProfile(rawPressureLevel) {
            const pressureLevel = normalizePressureLevel(rawPressureLevel);
            switch (pressureLevel) {
            case 'idle':
                return {
                    pressureLevel,
                    agingStepMs: 56,
                    agingWeight: 5,
                    agingCap: 72,
                    parityPenalty: 5,
                    parityWindow: 32,
                    repeatRootPenalty: 12,
                    implicitCoalesceLanes: new Set()
                };
            case 'elevated':
                return {
                    pressureLevel,
                    agingStepMs: 40,
                    agingWeight: 8,
                    agingCap: 112,
                    parityPenalty: 7,
                    parityWindow: 24,
                    repeatRootPenalty: 18,
                    implicitCoalesceLanes: new Set(['background_prepare', 'idle_maintenance'])
                };
            case 'constrained':
                return {
                    pressureLevel,
                    agingStepMs: 32,
                    agingWeight: 10,
                    agingCap: 144,
                    parityPenalty: 9,
                    parityWindow: 18,
                    repeatRootPenalty: 24,
                    implicitCoalesceLanes: new Set(['hydration_followup', 'background_prepare', 'idle_maintenance'])
                };
            case 'critical':
                return {
                    pressureLevel,
                    agingStepMs: 24,
                    agingWeight: 12,
                    agingCap: 180,
                    parityPenalty: 11,
                    parityWindow: 12,
                    repeatRootPenalty: 30,
                    implicitCoalesceLanes: new Set(['hydration_followup', 'background_prepare', 'idle_maintenance'])
                };
            case 'normal':
            default:
                return {
                    pressureLevel: 'normal',
                    agingStepMs: 48,
                    agingWeight: 6,
                    agingCap: 88,
                    parityPenalty: 6,
                    parityWindow: 28,
                    repeatRootPenalty: 14,
                    implicitCoalesceLanes: new Set()
                };
            }
        }

        function getDiagnosticsPressureLevel(context = {}) {
            const diagnostics = context.diagnostics && typeof context.diagnostics === 'object'
                ? context.diagnostics
                : {};
            return normalizePressureLevel(context.pressureLevel || diagnostics.pressureLevel || '');
        }

        function getRootKey(job) {
            const rootId = normalizeText(job && job.rootId ? job.rootId : '', '');
            if (rootId) return `root:${rootId}`;
            const scope = normalizeText(job && job.scope ? job.scope : '', 'default');
            return `scope:${scope}`;
        }

        function ensureRootStats(rootKey) {
            const safeRootKey = normalizeText(rootKey, 'scope:default');
            if (!rootStats.has(safeRootKey)) {
                rootStats.set(safeRootKey, {
                    dispatchCount: 0,
                    completedCount: 0,
                    lastStartedAt: 0,
                    lastCompletedAt: 0
                });
            }
            return rootStats.get(safeRootKey);
        }

        function getReadyAt(job) {
            const delayMs = normalizeNonNegativeNumber(job && job.meta ? job.meta.delay : 0, 0);
            return normalizeNonNegativeNumber(job && job.scheduledAt ? job.scheduledAt : now(), now()) + delayMs;
        }

        function getCoalesceToken(job, pressureProfile) {
            const rootKey = getRootKey(job);
            const scope = normalizeText(job && job.scope ? job.scope : '', 'default');
            const lane = normalizeLane(job && job.meta ? job.meta.lane : '', 'visible_commit');
            const explicitCoalesceKey = normalizeText(job && job.meta ? job.meta.coalesceKey : '', '');
            if (explicitCoalesceKey) {
                return `explicit:${rootKey}:${scope}:${lane}:${explicitCoalesceKey}`;
            }
            if (pressureProfile.implicitCoalesceLanes.has(lane)) {
                return `implicit:${rootKey}:${scope}:${normalizeText(job && job.kind ? job.kind : '', 'task')}:${lane}`;
            }
            return '';
        }

        function removePendingRecord(jobId) {
            if (!pendingJobs.has(jobId)) return null;
            const record = pendingJobs.get(jobId);
            pendingJobs.delete(jobId);
            if (record && record.coalesceToken && coalesceIndex.get(record.coalesceToken) === jobId) {
                coalesceIndex.delete(record.coalesceToken);
            }
            return record.job;
        }

        function shouldReplaceExistingJob(nextJob, existingJob, options = {}) {
            const nextScheduledAt = normalizeNonNegativeNumber(nextJob && nextJob.scheduledAt, 0);
            const existingScheduledAt = normalizeNonNegativeNumber(existingJob && existingJob.scheduledAt, 0);
            const nextPriority = normalizeNonNegativeNumber(nextJob && nextJob.meta ? nextJob.meta.priority : 0, 0);
            const existingPriority = normalizeNonNegativeNumber(existingJob && existingJob.meta ? existingJob.meta.priority : 0, 0);

            if (options.requeue === true) {
                if (existingScheduledAt > nextScheduledAt) return false;
                if (existingScheduledAt === nextScheduledAt && existingPriority > nextPriority) return false;
            }

            if (nextScheduledAt > existingScheduledAt) return true;
            if (nextScheduledAt < existingScheduledAt) return false;
            if (nextPriority > existingPriority) return true;
            if (nextPriority < existingPriority) return options.requeue !== true;
            return options.requeue !== true;
        }

        function enqueue(job, context = {}) {
            if (!job || !Number.isFinite(job.id) || job.finished === true) {
                return {
                    accepted: false,
                    reason: 'invalid_job',
                    replacedJobs: []
                };
            }

            const pressureProfile = resolvePressureProfile(getDiagnosticsPressureLevel(context));
            const coalesceToken = getCoalesceToken(job, pressureProfile);
            const replacedJobs = [];

            if (coalesceToken && coalesceIndex.has(coalesceToken)) {
                const existingJob = pendingJobs.get(coalesceIndex.get(coalesceToken));
                if (existingJob && shouldReplaceExistingJob(job, existingJob.job, context)) {
                    const removedJob = removePendingRecord(existingJob.job.id);
                    if (removedJob) {
                        totalCoalesced += 1;
                        replacedJobs.push(removedJob);
                    }
                } else if (existingJob) {
                    return {
                        accepted: false,
                        reason: 'coalesced_by_existing_job',
                        keptJob: existingJob.job,
                        replacedJobs: []
                    };
                }
            }

            enqueueSequence += 1;
            pendingJobs.set(job.id, {
                job,
                enqueueOrder: enqueueSequence,
                queuedAt: now(),
                rootKey: getRootKey(job),
                coalesceToken
            });
            if (coalesceToken) {
                coalesceIndex.set(coalesceToken, job.id);
            }
            totalEnqueued += 1;

            return {
                accepted: true,
                reason: 'enqueued',
                coalesceToken,
                replacedJobs
            };
        }

        function calculateAgingBoost(job, pressureProfile, waitMs) {
            const lane = normalizeLane(job && job.meta ? job.meta.lane : '', 'visible_commit');
            const laneFactor = lane === 'critical_input'
                ? 0.5
                : (lane === 'background_prepare' || lane === 'idle_maintenance' ? 1.15 : 1);
            const rawBoost = Math.floor(waitMs / pressureProfile.agingStepMs) * pressureProfile.agingWeight * laneFactor;
            return Math.min(rawBoost, pressureProfile.agingCap);
        }

        function compareCandidate(left, right) {
            if (left.score !== right.score) return right.score - left.score;
            if (left.effectivePriority !== right.effectivePriority) return right.effectivePriority - left.effectivePriority;
            if (left.dispatchCount !== right.dispatchCount) return left.dispatchCount - right.dispatchCount;
            if (left.lastStartedAt !== right.lastStartedAt) return left.lastStartedAt - right.lastStartedAt;
            if (left.waitMs !== right.waitMs) return right.waitMs - left.waitMs;
            return left.enqueueOrder - right.enqueueOrder;
        }

        function dequeueNext(context = {}) {
            const nowMs = typeof context.now === 'function'
                ? context.now()
                : normalizeNonNegativeNumber(context.now, now());
            const pressureProfile = resolvePressureProfile(getDiagnosticsPressureLevel(context));
            if (pendingJobs.size === 0) {
                return {
                    job: null,
                    delayMs: 0,
                    reason: 'empty'
                };
            }

            const readyCandidates = [];
            let earliestDelayMs = Infinity;

            pendingJobs.forEach((record) => {
                const readyAt = getReadyAt(record.job);
                const remainingDelayMs = Math.max(readyAt - nowMs, 0);
                if (remainingDelayMs > 0) {
                    if (remainingDelayMs < earliestDelayMs) earliestDelayMs = remainingDelayMs;
                    return;
                }

                const rootKey = record.rootKey;
                const rootDispatchStats = ensureRootStats(rootKey);
                const waitMs = Math.max(nowMs - normalizeNonNegativeNumber(record.job.scheduledAt, nowMs), 0);
                const basePriority = normalizeNonNegativeNumber(record.job.meta && record.job.meta.priority, 0);
                const agingBoost = calculateAgingBoost(record.job, pressureProfile, waitMs);

                readyCandidates.push({
                    job: record.job,
                    rootKey,
                    enqueueOrder: record.enqueueOrder,
                    waitMs,
                    effectivePriority: basePriority + agingBoost,
                    dispatchCount: rootDispatchStats.dispatchCount,
                    lastStartedAt: rootDispatchStats.lastStartedAt
                });
            });

            if (readyCandidates.length === 0) {
                return {
                    job: null,
                    delayMs: Number.isFinite(earliestDelayMs) ? earliestDelayMs : 0,
                    reason: 'await_ready'
                };
            }

            const bestCandidateByRoot = new Map();
            readyCandidates.forEach((candidate) => {
                const existing = bestCandidateByRoot.get(candidate.rootKey);
                if (!existing || compareCandidate(candidate, existing) < 0) {
                    bestCandidateByRoot.set(candidate.rootKey, candidate);
                }
            });

            const rootCandidates = Array.from(bestCandidateByRoot.values());
            const minDispatchCount = rootCandidates.reduce((result, candidate) => {
                return Math.min(result, candidate.dispatchCount);
            }, Number.POSITIVE_INFINITY);

            rootCandidates.forEach((candidate) => {
                const parityPenalty = Math.max(candidate.dispatchCount - minDispatchCount, 0) * pressureProfile.parityPenalty;
                const repeatRootPenalty = candidate.rootKey === lastDispatchedRootKey
                    ? pressureProfile.repeatRootPenalty
                    : 0;
                candidate.score = candidate.effectivePriority - parityPenalty - repeatRootPenalty;
            });

            rootCandidates.sort(compareCandidate);

            let selectedCandidate = rootCandidates[0];
            if (
                selectedCandidate
                && selectedCandidate.rootKey === lastDispatchedRootKey
                && rootCandidates.length > 1
            ) {
                const alternateCandidate = rootCandidates.find((candidate) => {
                    return candidate.rootKey !== lastDispatchedRootKey
                        && candidate.score >= selectedCandidate.score - pressureProfile.parityWindow;
                });
                if (alternateCandidate) {
                    selectedCandidate = alternateCandidate;
                }
            }

            const selectedJob = removePendingRecord(selectedCandidate.job.id);
            if (!selectedJob) {
                return {
                    job: null,
                    delayMs: 0,
                    reason: 'selection_evicted'
                };
            }

            totalDequeued += 1;
            return {
                job: selectedJob,
                delayMs: 0,
                reason: 'ready',
                rootKey: selectedCandidate.rootKey,
                effectivePriority: selectedCandidate.effectivePriority,
                pressureLevel: pressureProfile.pressureLevel
            };
        }

        function remove(jobId) {
            const removedJob = removePendingRecord(jobId);
            if (removedJob) totalRemoved += 1;
            return removedJob;
        }

        function noteJobStarted(job, context = {}) {
            if (!job) return null;
            const statsRecord = ensureRootStats(getRootKey(job));
            statsRecord.dispatchCount += 1;
            statsRecord.lastStartedAt = typeof context.now === 'function'
                ? context.now()
                : normalizeNonNegativeNumber(context.now, now());
            lastDispatchedRootKey = getRootKey(job);
            return {
                rootKey: lastDispatchedRootKey,
                dispatchCount: statsRecord.dispatchCount,
                lastStartedAt: statsRecord.lastStartedAt
            };
        }

        function noteJobCompleted(job, context = {}) {
            if (!job) return null;
            const statsRecord = ensureRootStats(getRootKey(job));
            statsRecord.completedCount += 1;
            statsRecord.lastCompletedAt = typeof context.now === 'function'
                ? context.now()
                : normalizeNonNegativeNumber(context.now, now());
            return {
                rootKey: getRootKey(job),
                completedCount: statsRecord.completedCount,
                lastCompletedAt: statsRecord.lastCompletedAt
            };
        }

        function listPending() {
            return Array.from(pendingJobs.values()).map((record) => ({
                id: record.job.id,
                kind: record.job.kind,
                lane: record.job.meta && record.job.meta.lane ? record.job.meta.lane : '',
                priority: record.job.meta && Number.isFinite(record.job.meta.priority) ? record.job.meta.priority : 0,
                scope: record.job.scope,
                rootId: record.job.rootId,
                readyAt: getReadyAt(record.job),
                coalesceToken: record.coalesceToken
            }));
        }

        function getStats() {
            const roots = {};
            rootStats.forEach((statsRecord, rootKey) => {
                roots[rootKey] = {
                    dispatchCount: statsRecord.dispatchCount,
                    completedCount: statsRecord.completedCount,
                    lastStartedAt: statsRecord.lastStartedAt,
                    lastCompletedAt: statsRecord.lastCompletedAt
                };
            });

            return {
                pending: pendingJobs.size,
                totalEnqueued,
                totalDequeued,
                totalRemoved,
                totalCoalesced,
                lastDispatchedRootKey,
                roots,
                pendingJobs: listPending()
            };
        }

        return Object.freeze({
            dequeueNext,
            enqueue,
            getStats,
            hasPending: () => pendingJobs.size > 0,
            listPending,
            noteJobCompleted,
            noteJobStarted,
            remove,
            size: () => pendingJobs.size
        });
    };
})(__XTENDRMT_GLOBAL__);
