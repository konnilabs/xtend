/* modules/rmt-engine-controller.js */
(function registerRmtEngineControllerModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA = 'xtend.rmt.kernel-scheduler-failure.v1';
    const RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA = 'xtend.rmt.kernel-scheduler-failure-policy.v1';
    const RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA = 'xtend.rmt.kernel-scheduler-failure-record.v1';
    const RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE = 'RKSH-WP-07';
    const RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL = 'rmt.kernel.scheduler_failure';
    const RMT_KERNEL_ESCALATION_SCHEMA_FOR_SCHEDULER = 'xtend.rmt.kernel-escalation.v1';
    const RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA_FOR_SCHEDULER = 'xtend.rmt.kernel-escalation-envelope.v1';
    const RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL_FOR_SCHEDULER = 'rmt.kernel.escalation';
    const RMT_KERNEL_PANIC_MONITOR_SCHEMA_FOR_SCHEDULER = 'xtend.rmt.kernel-panic-monitor.v1';
    const RMT_KERNEL_PANIC_STATE_SCHEMA_FOR_SCHEDULER = 'xtend.rmt.kernel-panic-state.v1';
    const RMT_KERNEL_SCHEDULER_FAILURE_STATUSES = Object.freeze(['failed', 'aborted', 'panic_blocked']);
    const RMT_KERNEL_SCHEDULER_FAILURE_SEVERITIES = Object.freeze(['info', 'warning', 'error', 'critical', 'fatal']);

    appModules.createRmtEngineController = function createRmtEngineController(deps = {}) {
        const compatibilityAdapters = normalizeCompatibilityAdapters(
            deps.compatibilityAdapters
            || deps.compatibilityLayers
            || deps.compatibilityAdapter
            || deps.compatibilityLayer
            || deps.adapters
        );
        const hostAdapter = deps.hostAdapter || deps.renderHostAdapter || deps.hostRuntime || deps.host || {};
        const windowTarget = hostAdapter.windowTarget || null;
        const documentTarget = hostAdapter.documentTarget || null;
        const schedulerNow = typeof hostAdapter.now === 'function'
            ? hostAdapter.now
            : (() => 0);
        const schedulerDiagnostics = normalizeSchedulerDiagnostics(
            deps.schedulerDiagnostics
            || deps.rmtDiagnostics
            || deps.renderDiagnostics
            || deps.diagnostics
            || null,
            { now: schedulerNow }
        );
        const priorityQueue = normalizePriorityQueue(
            deps.priorityQueue
            || deps.schedulerQueue
            || deps.renderPriorityQueue
            || null,
            { now: schedulerNow }
        );
        const diagnosticsHub = normalizeDiagnosticsHub(
            deps.diagnosticsHub
            || deps.rmtDiagnosticsHub
            || deps.schedulerDiagnosticsHub
            || null
        );
        const schedulerPanicMonitor = deps.panicMonitor && typeof deps.panicMonitor.recordSignal === 'function'
            ? deps.panicMonitor
            : (deps.kernelPanicMonitor && typeof deps.kernelPanicMonitor.recordSignal === 'function' ? deps.kernelPanicMonitor : null);
        const schedulerFailurePolicy = {
            callbackFailureSeverity: normalizeSchedulerFailureSeverity(deps.schedulerCallbackFailureSeverity || deps.schedulerFailureSeverity, 'critical'),
            abortSeverity: normalizeSchedulerFailureSeverity(deps.schedulerAbortSeverity, 'error'),
            panicBlockedSeverity: normalizeSchedulerFailureSeverity(deps.schedulerPanicBlockedSeverity, 'critical'),
            backpressureSeverity: normalizeSchedulerFailureSeverity(deps.schedulerBackpressureSeverity, 'critical'),
            panicSeverityThreshold: normalizeSchedulerFailureSeverity(deps.schedulerPanicSeverityThreshold, 'critical'),
            diagnosticsChannel: String(deps.schedulerFailureDiagnosticsChannel || RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL).trim() || RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL,
            escalationDiagnosticsChannel: String(deps.schedulerEscalationDiagnosticsChannel || RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL_FOR_SCHEDULER).trim() || RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL_FOR_SCHEDULER,
            callbackFailureActivatesPanic: deps.schedulerCallbackFailureActivatesPanic === false ? false : true,
            backpressureActivatesPanic: deps.schedulerBackpressureActivatesPanic === false ? false : true,
            trustRelevantActivatesPanic: deps.schedulerTrustRelevantActivatesPanic === false ? false : true,
            redactsPayload: deps.schedulerFailureRedactsPayload === false ? false : true
        };
        const reactivity = normalizeReactivity(
            deps.reactivity
            || deps.rmtReactivity
            || deps.stateReactivity
            || null
        );
        const commandBus = normalizeCommandBus(
            deps.commandBus
            || deps.rmtCommandBus
            || deps.commands
            || null
        );
        const scopeTokens = new Map();
        const rootRegistry = new Map();
        const globalListenerRegistry = new Map();
        const scheduledJobs = new Map();
        const scheduledJobsByScope = new Map();
        const scheduledJobsByRoot = new Map();
        let queuePumpHandle = null;
        let queuePumpHandleKind = '';
        let queuePumpReason = '';
        let dispatchPendingJob = null;
        let activeRunningJob = null;
        let lastSchedulerBackpressurePanicKey = '';
        let queueDispatchLocked = false;
        let delegatedHandlerOrder = 0;
        let delegatedHandlerIdCounter = 0;
        let globalListenerIdCounter = 0;
        let scheduledJobIdCounter = 0;
        const schedulerTelemetry = {
            scheduled: 0,
            executed: 0,
            failed: 0,
            aborted: 0,
            panicBlocked: 0,
            cancelled: 0,
            staleScope: 0,
            staleRoot: 0,
            pending: 0,
            pressureLevel: typeof schedulerDiagnostics.getPressureLevel === 'function'
                ? schedulerDiagnostics.getPressureLevel()
                : 'normal',
            totalWaitMs: 0,
            totalRunMs: 0,
            maxWaitMs: 0,
            maxRunMs: 0,
            byReason: Object.create(null),
            failures: [],
            byLane: Object.create(null),
            pendingByLane: Object.create(null),
            pendingByStrategy: Object.create(null),
            history: []
        };
        const SCHEDULER_HISTORY_LIMIT = 160;
        const SCHEDULER_FAILURE_HISTORY_LIMIT = 80;
        const SCHEDULER_DIAGNOSTICS_CHANNEL = 'rmt.scheduler.snapshot';

        function normalizeCompatibilityAdapters(rawAdapters) {
            if (!rawAdapters) return [];
            const adapters = Array.isArray(rawAdapters) ? rawAdapters : [rawAdapters];
            return adapters.filter((adapter) => !!adapter && typeof adapter === 'object');
        }

        function normalizeSchedulerDiagnostics(diagnostics, defaults = {}) {
            const normalizedDiagnostics = diagnostics && typeof diagnostics === 'object'
                ? diagnostics
                : {};
            const fallbackNow = typeof defaults.now === 'function' ? defaults.now : schedulerNow;

            function buildFallbackSnapshot() {
                return {
                    pressureLevel: 'normal',
                    queue: {
                        pending: 0,
                        byLane: {},
                        byStrategy: {},
                        oldestWaitMs: 0,
                        congestionScore: 0,
                        updatedAt: fallbackNow(),
                        reason: 'fallback'
                    },
                    performance: {
                        sampleCount: 0,
                        avgDurationMs: 0,
                        avgWaitMs: 0,
                        maxDurationMs: 0,
                        maxWaitMs: 0,
                        longTaskCount: 0,
                        longTaskRatio: 0,
                        droppedFrameCount: 0,
                        lastSampleAt: 0
                    },
                    lanes: {},
                    recentEvents: [],
                    transitions: []
                };
            }

            function normalizeRequestedKind(rawKind) {
                return String(rawKind || '').trim() === 'after_paint'
                    ? 'after_paint'
                    : 'deferred';
            }

            function normalizeLane(lane, fallbackLane = 'visible_commit') {
                if (typeof normalizedDiagnostics.normalizeLane === 'function') {
                    return normalizedDiagnostics.normalizeLane(lane, fallbackLane);
                }
                const safeLane = String(lane || '').trim();
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

            function resolveFallbackPolicy(request = {}) {
                const requestedKind = normalizeRequestedKind(request.requestedKind || request.kind);
                const fallbackLane = requestedKind === 'after_paint'
                    ? 'visible_commit'
                    : 'background_prepare';
                const lane = normalizeLane(request.lane, fallbackLane);
                return {
                    requestedKind,
                    lane,
                    executionStrategy: requestedKind === 'after_paint'
                        ? 'after_paint'
                        : (request.preferIdle === false ? 'timeout' : 'idle'),
                    delayMs: Number.isFinite(request.delay) && request.delay >= 0 ? request.delay : 0,
                    timeoutMs: Number.isFinite(request.timeout) && request.timeout >= 0 ? request.timeout : 220,
                    preferIdle: request.preferIdle !== false && requestedKind !== 'after_paint',
                    priority: Number.isFinite(request.priority) ? request.priority : 100,
                    budgetClass: String(request.budgetClass || '').trim()
                        || (requestedKind === 'after_paint' ? 'visible_commit' : 'background_prepare'),
                    coalesceKey: String(request.coalesceKey || '').trim() || '',
                    deadlineMs: Number.isFinite(request.deadlineMs) && request.deadlineMs >= 0 ? request.deadlineMs : 0,
                    pressureLevel: typeof normalizedDiagnostics.getPressureLevel === 'function'
                        ? String(normalizedDiagnostics.getPressureLevel() || 'normal').trim() || 'normal'
                        : 'normal'
                };
            }

            return {
                normalizeLane,
                reportPerformanceSample: typeof normalizedDiagnostics.reportPerformanceSample === 'function'
                    ? normalizedDiagnostics.reportPerformanceSample.bind(normalizedDiagnostics)
                    : (() => buildFallbackSnapshot()),
                updateQueueSnapshot: typeof normalizedDiagnostics.updateQueueSnapshot === 'function'
                    ? normalizedDiagnostics.updateQueueSnapshot.bind(normalizedDiagnostics)
                    : (() => buildFallbackSnapshot()),
                noteJobLifecycle: typeof normalizedDiagnostics.noteJobLifecycle === 'function'
                    ? normalizedDiagnostics.noteJobLifecycle.bind(normalizedDiagnostics)
                    : (() => null),
                resolveSchedulingPolicy: typeof normalizedDiagnostics.resolveSchedulingPolicy === 'function'
                    ? normalizedDiagnostics.resolveSchedulingPolicy.bind(normalizedDiagnostics)
                    : resolveFallbackPolicy,
                getPressureLevel: typeof normalizedDiagnostics.getPressureLevel === 'function'
                    ? normalizedDiagnostics.getPressureLevel.bind(normalizedDiagnostics)
                    : (() => 'normal'),
                getSnapshot: typeof normalizedDiagnostics.getSnapshot === 'function'
                    ? normalizedDiagnostics.getSnapshot.bind(normalizedDiagnostics)
                    : buildFallbackSnapshot
            };
        }

        function normalizeDiagnosticsHub(hub) {
            const normalizedHub = hub && typeof hub === 'object'
                ? hub
                : {};
            return {
                publish: typeof normalizedHub.publish === 'function'
                    ? normalizedHub.publish.bind(normalizedHub)
                    : (() => null),
                subscribe: typeof normalizedHub.subscribe === 'function'
                    ? normalizedHub.subscribe.bind(normalizedHub)
                    : (() => function unsubscribeNoop() {}),
                getChannelSnapshot: typeof normalizedHub.getChannelSnapshot === 'function'
                    ? normalizedHub.getChannelSnapshot.bind(normalizedHub)
                    : (() => null),
                listChannels: typeof normalizedHub.listChannels === 'function'
                    ? normalizedHub.listChannels.bind(normalizedHub)
                    : (() => []),
                getHistory: typeof normalizedHub.getHistory === 'function'
                    ? normalizedHub.getHistory.bind(normalizedHub)
                    : (() => []),
                createPublisher: typeof normalizedHub.createPublisher === 'function'
                    ? normalizedHub.createPublisher.bind(normalizedHub)
                    : (() => function noopPublisher() { return null; })
            };
        }

        function normalizeCommandBus(bus) {
            const normalizedBus = bus && typeof bus === 'object'
                ? bus
                : {};
            return {
                cancel: typeof normalizedBus.cancel === 'function'
                    ? normalizedBus.cancel.bind(normalizedBus)
                    : (() => null),
                cancelByRoot: typeof normalizedBus.cancelByRoot === 'function'
                    ? normalizedBus.cancelByRoot.bind(normalizedBus)
                    : (() => 0),
                dispatch: typeof normalizedBus.dispatch === 'function'
                    ? normalizedBus.dispatch.bind(normalizedBus)
                    : (() => Promise.resolve({
                        status: 'failed',
                        correlationId: '',
                        commandName: '',
                        rootId: '',
                        result: null,
                        error: { name: 'RmtCommandBusMissing', message: 'RmtCommandBus ist nicht verfuegbar.', stack: '' },
                        superseded: false,
                        metrics: { startedAt: schedulerNow(), completedAt: schedulerNow(), requestedAt: schedulerNow(), durationMs: 0 },
                        issuedCommands: []
                    })),
                getHistory: typeof normalizedBus.getHistory === 'function'
                    ? normalizedBus.getHistory.bind(normalizedBus)
                    : (() => []),
                getSnapshot: typeof normalizedBus.getSnapshot === 'function'
                    ? normalizedBus.getSnapshot.bind(normalizedBus)
                    : (() => ({
                        counters: {
                            issued: 0,
                            succeeded: 0,
                            failed: 0,
                            cancelled: 0,
                            superseded: 0,
                            progressEvents: 0,
                            pending: 0
                        },
                        pendingCommands: [],
                        handlers: [],
                        recentHistory: []
                    })),
                listHandlers: typeof normalizedBus.listHandlers === 'function'
                    ? normalizedBus.listHandlers.bind(normalizedBus)
                    : (() => []),
                listPendingCommands: typeof normalizedBus.listPendingCommands === 'function'
                    ? normalizedBus.listPendingCommands.bind(normalizedBus)
                    : (() => []),
                registerHandler: typeof normalizedBus.registerHandler === 'function'
                    ? normalizedBus.registerHandler.bind(normalizedBus)
                    : (() => false),
                registerHandlers: typeof normalizedBus.registerHandlers === 'function'
                    ? normalizedBus.registerHandlers.bind(normalizedBus)
                    : (() => false),
                subscribe: typeof normalizedBus.subscribe === 'function'
                    ? normalizedBus.subscribe.bind(normalizedBus)
                    : (() => function unsubscribeNoop() {}),
                createCommandEnvelope(commandName, payload = {}, options = {}) {
                    const safeCommandName = String(commandName || '').trim().toLowerCase();
                    return {
                        type: 'command',
                        commandName: safeCommandName,
                        correlationId: '',
                        rootId: String(options.rootId || '').trim(),
                        payload: payload && typeof payload === 'object' ? payload : {},
                        meta: options.meta && typeof options.meta === 'object' ? options.meta : {},
                        requestedAt: schedulerNow()
                    };
                }
            };
        }

        function normalizeReactivity(reactivityRuntime) {
            const normalizedReactivity = reactivityRuntime && typeof reactivityRuntime === 'object'
                ? reactivityRuntime
                : {};
            return {
                disposeRoot: typeof normalizedReactivity.disposeRoot === 'function'
                    ? normalizedReactivity.disposeRoot.bind(normalizedReactivity)
                    : (() => 0),
                ensureSource: typeof normalizedReactivity.ensureSource === 'function'
                    ? normalizedReactivity.ensureSource.bind(normalizedReactivity)
                    : (() => null),
                getHistory: typeof normalizedReactivity.getHistory === 'function'
                    ? normalizedReactivity.getHistory.bind(normalizedReactivity)
                    : (() => []),
                getSourceEnvelope: typeof normalizedReactivity.getSourceEnvelope === 'function'
                    ? normalizedReactivity.getSourceEnvelope.bind(normalizedReactivity)
                    : (() => null),
                getSourceSnapshot: typeof normalizedReactivity.getSourceSnapshot === 'function'
                    ? normalizedReactivity.getSourceSnapshot.bind(normalizedReactivity)
                    : (() => null),
                listSources: typeof normalizedReactivity.listSources === 'function'
                    ? normalizedReactivity.listSources.bind(normalizedReactivity)
                    : (() => []),
                mutate: typeof normalizedReactivity.mutate === 'function'
                    ? normalizedReactivity.mutate.bind(normalizedReactivity)
                    : (() => null),
                publish: typeof normalizedReactivity.publish === 'function'
                    ? normalizedReactivity.publish.bind(normalizedReactivity)
                    : (() => null),
                read: typeof normalizedReactivity.read === 'function'
                    ? normalizedReactivity.read.bind(normalizedReactivity)
                    : ((_sourceName, _selector, fallbackValue = null) => fallbackValue),
                subscribe: typeof normalizedReactivity.subscribe === 'function'
                    ? normalizedReactivity.subscribe.bind(normalizedReactivity)
                    : (() => function unsubscribeNoop() {}),
                watch: typeof normalizedReactivity.watch === 'function'
                    ? normalizedReactivity.watch.bind(normalizedReactivity)
                    : (() => function disposeWatchNoop() {}),
                watchRoot: typeof normalizedReactivity.watchRoot === 'function'
                    ? normalizedReactivity.watchRoot.bind(normalizedReactivity)
                    : (() => function disposeRootWatchNoop() {})
            };
        }

        function normalizePriorityQueue(queue, defaults = {}) {
            const fallbackNow = typeof defaults.now === 'function' ? defaults.now : schedulerNow;
            const normalizedQueue = queue && typeof queue === 'object'
                ? queue
                : null;

            function buildFallbackQueueStats() {
                return {
                    pending: 0,
                    totalEnqueued: 0,
                    totalDequeued: 0,
                    totalRemoved: 0,
                    totalCoalesced: 0,
                    lastDispatchedRootKey: '',
                    roots: {},
                    pendingJobs: []
                };
            }

            if (!normalizedQueue) {
                return {
                    dequeueNext: () => ({ job: null, delayMs: 0, reason: 'queue_unavailable' }),
                    enqueue: () => ({ accepted: true, reason: 'queue_passthrough', replacedJobs: [] }),
                    getStats: buildFallbackQueueStats,
                    hasPending: () => false,
                    listPending: () => [],
                    noteJobCompleted: () => null,
                    noteJobStarted: () => null,
                    remove: () => null,
                    size: () => 0
                };
            }

            return {
                dequeueNext: typeof normalizedQueue.dequeueNext === 'function'
                    ? normalizedQueue.dequeueNext.bind(normalizedQueue)
                    : (() => ({ job: null, delayMs: 0, reason: 'queue_missing_dequeue' })),
                enqueue: typeof normalizedQueue.enqueue === 'function'
                    ? normalizedQueue.enqueue.bind(normalizedQueue)
                    : (() => ({ accepted: true, reason: 'queue_missing_enqueue', replacedJobs: [] })),
                getStats: typeof normalizedQueue.getStats === 'function'
                    ? normalizedQueue.getStats.bind(normalizedQueue)
                    : buildFallbackQueueStats,
                hasPending: typeof normalizedQueue.hasPending === 'function'
                    ? normalizedQueue.hasPending.bind(normalizedQueue)
                    : (() => false),
                listPending: typeof normalizedQueue.listPending === 'function'
                    ? normalizedQueue.listPending.bind(normalizedQueue)
                    : (() => []),
                noteJobCompleted: typeof normalizedQueue.noteJobCompleted === 'function'
                    ? normalizedQueue.noteJobCompleted.bind(normalizedQueue)
                    : (() => null),
                noteJobStarted: typeof normalizedQueue.noteJobStarted === 'function'
                    ? normalizedQueue.noteJobStarted.bind(normalizedQueue)
                    : (() => null),
                remove: typeof normalizedQueue.remove === 'function'
                    ? normalizedQueue.remove.bind(normalizedQueue)
                    : (() => null),
                size: typeof normalizedQueue.size === 'function'
                    ? normalizedQueue.size.bind(normalizedQueue)
                    : (() => 0),
                now: fallbackNow
            };
        }

        function resolveCompatibilityHook(hookName, args = [], fallbackValue = undefined) {
            for (let index = 0; index < compatibilityAdapters.length; index += 1) {
                const adapter = compatibilityAdapters[index];
                const hook = adapter && typeof adapter[hookName] === 'function'
                    ? adapter[hookName]
                    : null;
                if (!hook) continue;
                const resolvedValue = hook(...args);
                if (typeof resolvedValue !== 'undefined') {
                    return resolvedValue;
                }
            }
            return fallbackValue;
        }

        function extendDelegatedHandlerContext(baseContext, details = {}) {
            let nextContext = baseContext;
            compatibilityAdapters.forEach((adapter) => {
                const hook = adapter && typeof adapter.extendDelegatedHandlerContext === 'function'
                    ? adapter.extendDelegatedHandlerContext
                    : null;
                if (!hook) return;
                const extension = hook(nextContext, details);
                if (extension && typeof extension === 'object') {
                    nextContext = { ...nextContext, ...extension };
                }
            });
            return nextContext;
        }

        function applyCompatibilityExtensions(rmtApi) {
            compatibilityAdapters.forEach((adapter) => {
                const hook = adapter && typeof adapter.extendRmt === 'function'
                    ? adapter.extendRmt
                    : null;
                if (!hook) return;
                const extension = hook(rmtApi, {
                    windowTarget,
                    documentTarget,
                    hostAdapter,
                    attachResource,
                    replaceResource,
                    disposeResource,
                    listResources,
                    getRootElement,
                    getRootState,
                    getRootVersion,
                    emitRootEvent: emitRootCustomEvent
                });
                if (!extension || typeof extension !== 'object') return;
                Object.keys(extension).forEach((key) => {
                    if (!key || Object.prototype.hasOwnProperty.call(rmtApi, key)) return;
                    if (typeof extension[key] === 'undefined') return;
                    rmtApi[key] = extension[key];
                });
            });
        }

        function normalizeRootId(rootId) {
            return String(rootId || '').trim();
        }

        function resolveListenerOptions(options = {}) {
            if (options.listenerOptions && typeof options.listenerOptions === 'object') {
                return options.listenerOptions;
            }
            if (options.capture === true || options.passive === true) {
                return {
                    capture: options.capture === true,
                    passive: options.passive === true
                };
            }
            return undefined;
        }

        function describeListenerTarget(target, fallbackTargetName = '') {
            const explicitTargetName = String(fallbackTargetName || '').trim();
            if (explicitTargetName) return explicitTargetName;
            if (target === windowTarget) return 'window';
            if (documentTarget && target === documentTarget) return 'document';
            if (target && target.id) return `#${target.id}`;
            if (target && target.tagName) return String(target.tagName || '').toLowerCase();
            return 'unknown';
        }

        function ensureIndexSet(indexMap, key) {
            const safeKey = String(key || '').trim();
            if (!safeKey) return null;
            if (!indexMap.has(safeKey)) {
                indexMap.set(safeKey, new Set());
            }
            return indexMap.get(safeKey);
        }

        function removeIndexedJob(indexMap, key, jobId) {
            const safeKey = String(key || '').trim();
            if (!safeKey || !indexMap.has(safeKey)) return;
            const bucket = indexMap.get(safeKey);
            bucket.delete(jobId);
            if (bucket.size === 0) indexMap.delete(safeKey);
        }

        function cancelAnimationFrameSafe(handle) {
            if (handle === null || typeof handle === 'undefined') return;
            hostAdapter.cancelAnimationFrame(handle);
        }

        function cancelIdleCallbackSafe(handle) {
            if (handle === null || typeof handle === 'undefined') return;
            hostAdapter.cancelIdleCallback(handle);
        }

        function normalizeScheduledKind(rawKind) {
            return String(rawKind || '').trim() === 'after_paint'
                ? 'after_paint'
                : 'deferred';
        }

        function normalizeExecutionStrategy(strategy, fallbackStrategy = 'timeout') {
            const safeStrategy = String(strategy || '').trim();
            switch (safeStrategy) {
            case 'after_paint':
            case 'idle':
            case 'timeout':
                return safeStrategy;
            default:
                return fallbackStrategy;
            }
        }

        function normalizeScheduledLane(lane, fallbackLane = 'visible_commit') {
            return schedulerDiagnostics.normalizeLane(lane, fallbackLane);
        }

        function normalizeSchedulerFailureSeverity(value, fallback = 'error') {
            const normalized = String(value || '').trim().toLowerCase();
            return RMT_KERNEL_SCHEDULER_FAILURE_SEVERITIES.includes(normalized) ? normalized : fallback;
        }

        function schedulerFailureSeverityRank(severity) {
            const index = RMT_KERNEL_SCHEDULER_FAILURE_SEVERITIES.indexOf(normalizeSchedulerFailureSeverity(severity, 'info'));
            return index === -1 ? 0 : index;
        }

        function isSchedulerFailureSeverityAtLeast(severity, threshold) {
            return schedulerFailureSeverityRank(severity) >= schedulerFailureSeverityRank(threshold);
        }

        function serializeSchedulerFailureError(error) {
            if (!error) return null;
            if (error instanceof Error) {
                return {
                    name: String(error.name || 'Error'),
                    message: String(error.message || 'scheduler callback failed'),
                    stack: String(error.stack || '')
                };
            }
            if (typeof error === 'object') {
                return {
                    name: String(error.name || 'Error'),
                    message: String(error.message || error.error || 'scheduler callback failed'),
                    stack: String(error.stack || '')
                };
            }
            return {
                name: 'Error',
                message: String(error || 'scheduler callback failed'),
                stack: ''
            };
        }

        function cloneSchedulerFailureValue(value, fallback = null) {
            if (value === undefined) return fallback;
            try {
                return JSON.parse(JSON.stringify(value));
            } catch (_error) {
                return fallback;
            }
        }

        function redactSchedulerFailureValue(value, key = '') {
            if (value === null || value === undefined) return value;
            if (Array.isArray(value)) return value.map((entry) => redactSchedulerFailureValue(entry, key));
            if (typeof value === 'object') {
                return Object.keys(value).reduce((result, entryKey) => {
                    result[entryKey] = redactSchedulerFailureValue(value[entryKey], entryKey);
                    return result;
                }, {});
            }
            if (typeof value !== 'string') return value;
            const normalizedKey = String(key || '').toLowerCase();
            const sensitiveKey = /(payload|value|html|markup|raw|sample|source|script|token|secret|password)/u.test(normalizedKey);
            const unsafeSample = /<\s*script\b|javascript:|vbscript:|srcdoc|onerror\s*=|onclick\s*=/iu.test(value);
            if (sensitiveKey || unsafeSample) {
                return {
                    redacted: true,
                    length: value.length
                };
            }
            return value.length > 256 ? value.slice(0, 253) + '...' : value;
        }

        function normalizeScheduledFinalStatus(status, reason = '') {
            const safeStatus = String(status || '').trim();
            if (RMT_KERNEL_SCHEDULER_FAILURE_STATUSES.includes(safeStatus)) return safeStatus;
            const safeReason = String(reason || '').trim().toLowerCase();
            if (safeReason === 'panic_blocked' || safeReason.indexOf('panic_blocked') !== -1) return 'panic_blocked';
            if (safeReason.indexOf('recovery') !== -1 || safeReason.indexOf('abort') !== -1) return 'aborted';
            return safeStatus || 'cancelled';
        }

        function isSchedulerFailureStatus(status) {
            return RMT_KERNEL_SCHEDULER_FAILURE_STATUSES.includes(String(status || '').trim());
        }

        function createSchedulerFailureRecord(job, status, reason = '', options = {}) {
            const safeStatus = normalizeScheduledFinalStatus(status, reason);
            const severity = normalizeSchedulerFailureSeverity(
                options.severity
                || (job.meta && job.meta.failureSeverity)
                || (safeStatus === 'panic_blocked' ? schedulerFailurePolicy.panicBlockedSeverity : (safeStatus === 'aborted' ? schedulerFailurePolicy.abortSeverity : schedulerFailurePolicy.callbackFailureSeverity)),
                safeStatus === 'aborted' ? 'error' : 'critical'
            );
            const trustRelevant = options.trustRelevant === true || !!(job.meta && job.meta.trustRelevant === true);
            const panicRelevant = options.panicRelevant === true
                || !!(job.meta && (job.meta.panicRelevant === true || job.meta.panicCritical === true))
                || (safeStatus === 'failed' && schedulerFailurePolicy.callbackFailureActivatesPanic !== false)
                || safeStatus === 'panic_blocked'
                || (trustRelevant && schedulerFailurePolicy.trustRelevantActivatesPanic !== false)
                || isSchedulerFailureSeverityAtLeast(severity, schedulerFailurePolicy.panicSeverityThreshold);
            const completedAt = Number.isFinite(job.finishedAt) ? job.finishedAt : schedulerNow();
            return {
                schema: RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
                schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
                policySchema: RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
                panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA_FOR_SCHEDULER,
                panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA_FOR_SCHEDULER,
                workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
                recordId: RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA + ':' + job.id + ':' + completedAt,
                jobId: job.id,
                status: safeStatus,
                reason: String(reason || safeStatus || 'unknown').trim() || 'unknown',
                severity,
                panicRelevant,
                trustRelevant,
                trigger: 'scheduler-failure',
                scope: job.scope,
                rootId: job.rootId,
                rootVersion: job.rootVersion,
                lane: job.meta && job.meta.lane ? job.meta.lane : '',
                strategy: job.meta && job.meta.executionStrategy ? job.meta.executionStrategy : '',
                waitMs: Math.max(Number(job.waitMs) || 0, 0),
                runMs: Math.max(Number(job.runDurationMs) || 0, 0),
                scheduledAt: job.scheduledAt,
                startedAt: job.startedAt,
                finishedAt: completedAt,
                diagnosticCode: String(options.diagnosticCode || (job.meta && job.meta.diagnosticCode) || 'rmt.kernel.scheduler.failure').trim() || 'rmt.kernel.scheduler.failure',
                reasonCode: String(options.reasonCode || (job.meta && job.meta.reasonCode) || 'xtend.rmt.kernel-scheduler-failure.job_failed').trim() || 'xtend.rmt.kernel-scheduler-failure.job_failed',
                error: serializeSchedulerFailureError(options.error || job.error),
                metadata: schedulerFailurePolicy.redactsPayload === false
                    ? cloneSchedulerFailureValue(options.metadata || {}, {})
                    : redactSchedulerFailureValue(cloneSchedulerFailureValue(options.metadata || {}, {}))
            };
        }

        function publishSchedulerFailureRecord(record) {
            schedulerTelemetry.failures.push(record);
            if (schedulerTelemetry.failures.length > SCHEDULER_FAILURE_HISTORY_LIMIT) {
                schedulerTelemetry.failures.splice(0, schedulerTelemetry.failures.length - SCHEDULER_FAILURE_HISTORY_LIMIT);
            }
            try {
                diagnosticsHub.publish(schedulerFailurePolicy.diagnosticsChannel, record, {
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
                diagnosticsHub.publish(schedulerFailurePolicy.escalationDiagnosticsChannel, {
                    schema: RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA_FOR_SCHEDULER,
                    escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA_FOR_SCHEDULER,
                    source: 'scheduler',
                    eventType: 'scheduler-job-failure',
                    severity: record.severity,
                    panicRelevant: record.panicRelevant,
                    trustRelevant: record.trustRelevant,
                    trigger: 'scheduler-failure',
                    scope: 'scheduler-job',
                    sourceRef: 'scheduler-job:' + record.jobId,
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
                        strategy: record.strategy
                    }
                }, {
                    source: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
                    workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
                    severity: record.severity,
                    panicRelevant: record.panicRelevant
                });
            } catch (_error) {}
            if (schedulerPanicMonitor && record.panicRelevant === true) {
                try {
                    record.panicState = schedulerPanicMonitor.recordSignal({
                        trigger: 'scheduler-failure',
                        severity: record.severity,
                        critical: true,
                        scope: 'scheduler-job',
                        sourceRef: 'scheduler-job:' + record.jobId,
                        reasonCode: record.reasonCode,
                        diagnosticCode: record.diagnosticCode,
                        correlationId: record.recordId,
                        affectedJobs: [String(record.jobId)],
                        metadata: {
                            schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
                            status: record.status,
                            reason: record.reason,
                            lane: record.lane,
                            strategy: record.strategy,
                            rootId: record.rootId
                        }
                    });
                } catch (_error) {
                    record.panicState = null;
                }
            } else {
                record.panicState = null;
            }
            return record;
        }

        function recordSchedulerBackpressurePanic(diagnosticsSnapshot, reason = 'scheduler_backpressure', queueSnapshot = null, previousPressureLevel = '') {
            if (!schedulerPanicMonitor || schedulerFailurePolicy.backpressureActivatesPanic === false) return null;
            const pressureLevel = String(
                (diagnosticsSnapshot && diagnosticsSnapshot.pressureLevel)
                || schedulerTelemetry.pressureLevel
                || ''
            ).trim();
            if (pressureLevel !== 'critical') return null;
            const queue = queueSnapshot || (diagnosticsSnapshot && diagnosticsSnapshot.queue) || {};
            const safeReason = String(reason || 'scheduler_backpressure').trim() || 'scheduler_backpressure';
            const signalKey = [
                pressureLevel,
                safeReason,
                Number(queue.pending) || 0,
                Number(queue.oldestWaitMs) || 0,
                Number(queue.congestionScore) || 0
            ].join(':');
            if (previousPressureLevel === 'critical' && signalKey === lastSchedulerBackpressurePanicKey) return null;
            lastSchedulerBackpressurePanicKey = signalKey;
            const diagnosticRecord = {
                schema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
                policySchema: RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
                panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA_FOR_SCHEDULER,
                panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA_FOR_SCHEDULER,
                workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
                eventType: 'scheduler-backpressure-critical',
                status: 'panic_blocked',
                severity: schedulerFailurePolicy.backpressureSeverity,
                panicRelevant: true,
                trustRelevant: true,
                trigger: 'scheduler-backpressure',
                scope: 'scheduler-backpressure',
                reason: safeReason,
                reasonCode: 'xtend.rmt.kernel-scheduler-failure.backpressure_critical',
                diagnosticCode: 'rmt.kernel.scheduler.backpressure_critical',
                pressureLevel,
                pending: Number(queue.pending) || 0,
                oldestWaitMs: Number(queue.oldestWaitMs) || 0,
                congestionScore: Number(queue.congestionScore) || 0,
                recordedAt: schedulerNow()
            };
            try {
                diagnosticRecord.panicState = schedulerPanicMonitor.recordSignal({
                    trigger: 'scheduler-backpressure',
                    severity: diagnosticRecord.severity,
                    critical: true,
                    scope: 'scheduler-backpressure',
                    sourceRef: 'scheduler-pressure:critical',
                    reasonCode: diagnosticRecord.reasonCode,
                    diagnosticCode: diagnosticRecord.diagnosticCode,
                    correlationId: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA + ':backpressure:' + diagnosticRecord.recordedAt,
                    metadata: {
                        schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
                        pressureLevel,
                        pending: diagnosticRecord.pending,
                        oldestWaitMs: diagnosticRecord.oldestWaitMs,
                        congestionScore: diagnosticRecord.congestionScore,
                        reason: safeReason
                    }
                });
            } catch (_error) {
                diagnosticRecord.panicState = null;
            }
            try {
                diagnosticsHub.publish(schedulerFailurePolicy.diagnosticsChannel, diagnosticRecord, {
                    source: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
                    workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
                    severity: diagnosticRecord.severity,
                    panicRelevant: true,
                    status: 'panic_blocked',
                    pressureLevel
                });
            } catch (_error) {}
            return diagnosticRecord;
        }

        function ensureSchedulerLaneTelemetry(lane) {
            const safeLane = normalizeScheduledLane(lane, 'visible_commit');
            if (!schedulerTelemetry.byLane[safeLane]) {
                schedulerTelemetry.byLane[safeLane] = {
                    scheduled: 0,
                    executed: 0,
                    failed: 0,
                    aborted: 0,
                    panicBlocked: 0,
                    cancelled: 0,
                    staleScope: 0,
                    staleRoot: 0,
                    pending: 0,
                    totalWaitMs: 0,
                    totalRunMs: 0,
                    maxWaitMs: 0,
                    maxRunMs: 0
                };
            }
            return schedulerTelemetry.byLane[safeLane];
        }

        function cloneSchedulerLaneTelemetry() {
            const result = {};
            Object.keys(schedulerTelemetry.byLane).forEach((lane) => {
                const stats = schedulerTelemetry.byLane[lane];
                result[lane] = {
                    scheduled: stats.scheduled,
                    executed: stats.executed,
                    failed: stats.failed,
                    aborted: stats.aborted,
                    panicBlocked: stats.panicBlocked,
                    cancelled: stats.cancelled,
                    staleScope: stats.staleScope,
                    staleRoot: stats.staleRoot,
                    pending: stats.pending,
                    totalWaitMs: stats.totalWaitMs,
                    totalRunMs: stats.totalRunMs,
                    maxWaitMs: stats.maxWaitMs,
                    maxRunMs: stats.maxRunMs
                };
            });
            return result;
        }

        function buildSchedulerQueueSnapshot() {
            const byLane = Object.create(null);
            const byStrategy = Object.create(null);
            const currentNow = schedulerNow();
            let oldestWaitMs = 0;
            let pendingCount = 0;

            scheduledJobs.forEach((job) => {
                if (!job || job.running === true) return;
                const lane = normalizeScheduledLane(
                    job.meta && job.meta.lane,
                    job.kind === 'after_paint' ? 'visible_commit' : 'background_prepare'
                );
                const strategy = normalizeExecutionStrategy(
                    job.meta && job.meta.executionStrategy,
                    job.kind === 'after_paint' ? 'after_paint' : 'timeout'
                );
                pendingCount += 1;
                byLane[lane] = (byLane[lane] || 0) + 1;
                byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
                const waitMs = Math.max(currentNow - (job.scheduledAt || currentNow), 0);
                if (waitMs > oldestWaitMs) oldestWaitMs = waitMs;
            });

            return {
                pending: pendingCount,
                byLane,
                byStrategy,
                oldestWaitMs,
                congestionScore: pendingCount * 12 + Math.min(oldestWaitMs, 240)
            };
        }

        function syncSchedulerDiagnostics(reason = 'scheduler_state_changed') {
            const snapshot = buildSchedulerQueueSnapshot();
            const previousPressureLevel = schedulerTelemetry.pressureLevel;
            schedulerTelemetry.pending = snapshot.pending;
            schedulerTelemetry.pendingByLane = { ...snapshot.byLane };
            schedulerTelemetry.pendingByStrategy = { ...snapshot.byStrategy };
            Object.keys(schedulerTelemetry.byLane).forEach((lane) => {
                schedulerTelemetry.byLane[lane].pending = snapshot.byLane[lane] || 0;
            });
            const diagnosticsSnapshot = schedulerDiagnostics.updateQueueSnapshot({
                reason,
                pending: snapshot.pending,
                byLane: snapshot.byLane,
                byStrategy: snapshot.byStrategy,
                oldestWaitMs: snapshot.oldestWaitMs,
                congestionScore: snapshot.congestionScore
            });
            if (diagnosticsSnapshot && diagnosticsSnapshot.pressureLevel) {
                schedulerTelemetry.pressureLevel = diagnosticsSnapshot.pressureLevel;
            } else if (typeof schedulerDiagnostics.getPressureLevel === 'function') {
                schedulerTelemetry.pressureLevel = schedulerDiagnostics.getPressureLevel();
            }
            recordSchedulerBackpressurePanic(diagnosticsSnapshot, reason, snapshot, previousPressureLevel);
            publishSchedulerSnapshot(reason);
            return snapshot;
        }

        function publishSchedulerSnapshot(reason = 'scheduler_state_changed') {
            return diagnosticsHub.publish(SCHEDULER_DIAGNOSTICS_CHANNEL, {
                reason: String(reason || 'scheduler_state_changed').trim() || 'scheduler_state_changed',
                recordedAt: schedulerNow(),
                hostKind: hostAdapter.hostKind || 'generic',
                stats: getSchedulerStats(),
                pendingJobs: listScheduledJobs()
            }, {
                source: 'rmt',
                category: 'scheduler_snapshot'
            });
        }

        function clearQueuePumpHandle() {
            if (!queuePumpHandleKind || !hasScheduledHandle(queuePumpHandle)) {
                queuePumpHandle = null;
                queuePumpHandleKind = '';
                queuePumpReason = '';
                return false;
            }
            if (queuePumpHandleKind === 'timeout') {
                hostAdapter.clearTimeout(queuePumpHandle);
            } else if (queuePumpHandleKind === 'raf') {
                cancelAnimationFrameSafe(queuePumpHandle);
            } else if (queuePumpHandleKind === 'idle') {
                cancelIdleCallbackSafe(queuePumpHandle);
            }
            queuePumpHandle = null;
            queuePumpHandleKind = '';
            queuePumpReason = '';
            return true;
        }

        function scheduleQueuePumpTimeout(delayMs, reason = 'queue_recheck') {
            clearQueuePumpHandle();
            queuePumpReason = String(reason || 'queue_recheck').trim() || 'queue_recheck';
            queuePumpHandleKind = 'timeout';
            queuePumpHandle = hostAdapter.scheduleTimeout(() => {
                queuePumpHandle = null;
                queuePumpHandleKind = '';
                queuePumpReason = '';
                pumpPriorityQueue(queuePumpReason || reason);
            }, Math.max(Number(delayMs) || 0, 0));
        }

        function queueEnqueueJob(job, options = {}) {
            if (!job || job.finished) return false;
            const enqueueResult = priorityQueue.enqueue(job, {
                diagnostics: schedulerDiagnostics.getSnapshot(),
                pressureLevel: schedulerTelemetry.pressureLevel,
                now: schedulerNow(),
                requeue: options.requeue === true
            });
            const replacedJobs = Array.isArray(enqueueResult.replacedJobs)
                ? enqueueResult.replacedJobs
                : [];

            replacedJobs.forEach((replacedJob) => {
                if (!replacedJob || replacedJob.id === job.id) return;
                if (dispatchPendingJob && dispatchPendingJob.id === replacedJob.id) {
                    dispatchPendingJob = null;
                }
                cancelScheduledJob(replacedJob, 'coalesced_replaced');
            });

            if (enqueueResult.accepted === false) {
                finalizeScheduledJob(job, 'cancelled', enqueueResult.reason || 'coalesced_superseded');
                return false;
            }

            if (options.suppressPump !== true) {
                pumpPriorityQueue(options.reason || 'queue_enqueued');
            }
            return true;
        }

        function requeueDispatchPendingJob(reason = 'dispatch_requeued') {
            if (!dispatchPendingJob || dispatchPendingJob.finished || dispatchPendingJob.running) return false;
            const pendingJob = dispatchPendingJob;
            dispatchPendingJob = null;
            clearScheduledJobHandles(pendingJob);
            pendingJob.status = 'scheduled';
            return queueEnqueueJob(pendingJob, {
                requeue: true,
                suppressPump: true,
                reason
            });
        }

        function scheduleSelectedJob(job) {
            if (!job || job.finished) return false;
            dispatchPendingJob = job;
            job.status = 'dispatch_pending';
            clearQueuePumpHandle();
            executeScheduledPlan(job, job.callback, {
                executionStrategy: job.meta && job.meta.executionStrategy ? job.meta.executionStrategy : 'timeout',
                delayMs: 0,
                timeoutMs: job.meta && Number.isFinite(job.meta.timeout) ? job.meta.timeout : 220
            });
            return true;
        }

        function pumpPriorityQueue(reason = 'queue_changed') {
            if (queueDispatchLocked) return false;
            if (activeRunningJob && !activeRunningJob.finished) return false;

            queueDispatchLocked = true;
            try {
                if (dispatchPendingJob && !dispatchPendingJob.finished && !dispatchPendingJob.running) {
                    requeueDispatchPendingJob('queue_preempted');
                }
                clearQueuePumpHandle();

                const selection = priorityQueue.dequeueNext({
                    diagnostics: schedulerDiagnostics.getSnapshot(),
                    pressureLevel: schedulerTelemetry.pressureLevel,
                    now: schedulerNow()
                });

                if (!selection || !selection.job) {
                    if (selection && Number.isFinite(selection.delayMs) && selection.delayMs > 0) {
                        scheduleQueuePumpTimeout(selection.delayMs, selection.reason || reason);
                    }
                    return false;
                }

                if (selection.pressureLevel) {
                    schedulerTelemetry.pressureLevel = selection.pressureLevel;
                }
                if (Number.isFinite(selection.effectivePriority) && selection.job.meta) {
                    selection.job.meta.effectivePriority = selection.effectivePriority;
                }

                return scheduleSelectedJob(selection.job);
            } finally {
                queueDispatchLocked = false;
            }
        }

        function pushSchedulerHistory(entry) {
            schedulerTelemetry.history.push(entry);
            if (schedulerTelemetry.history.length > SCHEDULER_HISTORY_LIMIT) {
                schedulerTelemetry.history.splice(0, schedulerTelemetry.history.length - SCHEDULER_HISTORY_LIMIT);
            }
        }

        function recordSchedulerOutcome(job, status, reason = '') {
            if (status === 'executed') schedulerTelemetry.executed += 1;
            else if (status === 'failed') schedulerTelemetry.failed += 1;
            else if (status === 'aborted') schedulerTelemetry.aborted += 1;
            else if (status === 'panic_blocked') schedulerTelemetry.panicBlocked += 1;
            else if (status === 'cancelled') schedulerTelemetry.cancelled += 1;
            else if (status === 'stale_scope') schedulerTelemetry.staleScope += 1;
            else if (status === 'stale_root') schedulerTelemetry.staleRoot += 1;

            const safeReason = String(reason || status || 'unknown').trim() || 'unknown';
            const laneStats = ensureSchedulerLaneTelemetry(job.meta && job.meta.lane);
            const waitMs = Math.max(Number(job.waitMs) || 0, 0);
            const runMs = Math.max(Number(job.runDurationMs) || 0, 0);

            if (status === 'executed') laneStats.executed += 1;
            else if (status === 'failed') laneStats.failed += 1;
            else if (status === 'aborted') laneStats.aborted += 1;
            else if (status === 'panic_blocked') laneStats.panicBlocked += 1;
            else if (status === 'cancelled') laneStats.cancelled += 1;
            else if (status === 'stale_scope') laneStats.staleScope += 1;
            else if (status === 'stale_root') laneStats.staleRoot += 1;

            laneStats.totalWaitMs += waitMs;
            laneStats.totalRunMs += runMs;
            laneStats.maxWaitMs = Math.max(laneStats.maxWaitMs, waitMs);
            laneStats.maxRunMs = Math.max(laneStats.maxRunMs, runMs);

            schedulerTelemetry.totalWaitMs += waitMs;
            schedulerTelemetry.totalRunMs += runMs;
            schedulerTelemetry.maxWaitMs = Math.max(schedulerTelemetry.maxWaitMs, waitMs);
            schedulerTelemetry.maxRunMs = Math.max(schedulerTelemetry.maxRunMs, runMs);
            schedulerTelemetry.byReason[safeReason] = (schedulerTelemetry.byReason[safeReason] || 0) + 1;
            schedulerDiagnostics.noteJobLifecycle({
                phase: status,
                kind: job.kind,
                lane: job.meta && job.meta.lane,
                strategy: job.meta && job.meta.executionStrategy,
                rootId: job.rootId,
                scope: job.scope,
                waitMs,
                runMs,
                reason: safeReason
            });
            pushSchedulerHistory({
                id: job.id,
                kind: job.kind,
                scope: job.scope,
                rootId: job.rootId,
                rootVersion: job.rootVersion,
                lane: job.meta && job.meta.lane ? job.meta.lane : '',
                strategy: job.meta && job.meta.executionStrategy ? job.meta.executionStrategy : '',
                status,
                reason: safeReason,
                scheduledAt: job.scheduledAt,
                finishedAt: job.finishedAt,
                pressureLevel: job.meta && job.meta.pressureLevel ? job.meta.pressureLevel : schedulerTelemetry.pressureLevel,
                waitMs,
                runMs,
                durationMs: Math.max((job.finishedAt || schedulerNow()) - (job.scheduledAt || schedulerNow()), 0)
            });
        }

        function indexScheduledJob(job) {
            scheduledJobs.set(job.id, job);
            ensureIndexSet(scheduledJobsByScope, job.scope).add(job.id);
            if (job.rootId) {
                ensureIndexSet(scheduledJobsByRoot, job.rootId).add(job.id);
            }
            schedulerTelemetry.scheduled += 1;
            ensureSchedulerLaneTelemetry(job.meta && job.meta.lane).scheduled += 1;
            schedulerDiagnostics.noteJobLifecycle({
                phase: 'scheduled',
                kind: job.kind,
                lane: job.meta && job.meta.lane,
                strategy: job.meta && job.meta.executionStrategy,
                rootId: job.rootId,
                scope: job.scope,
                reason: job.meta && job.meta.coalesceKey ? `coalesce:${job.meta.coalesceKey}` : ''
            });
            syncSchedulerDiagnostics('job_scheduled');
            return job;
        }

        function unindexScheduledJob(job) {
            if (!job) return;
            if (dispatchPendingJob && dispatchPendingJob.id === job.id) {
                dispatchPendingJob = null;
            }
            if (activeRunningJob && activeRunningJob.id === job.id) {
                activeRunningJob = null;
            }
            priorityQueue.remove(job.id);
            scheduledJobs.delete(job.id);
            removeIndexedJob(scheduledJobsByScope, job.scope, job.id);
            if (job.rootId) {
                removeIndexedJob(scheduledJobsByRoot, job.rootId, job.id);
            }
            syncSchedulerDiagnostics('job_finished');
        }

        function createScheduledJob(kind, scope, token, options = {}, rootSnapshot = null, plan = {}) {
            const safeScope = String(scope || 'default');
            const safeRootId = normalizeRootId(options.rootId || (rootSnapshot ? rootSnapshot.id : '')) || null;
            const requestedKind = normalizeScheduledKind(kind);
            const laneFallback = requestedKind === 'after_paint'
                ? 'visible_commit'
                : 'background_prepare';
            const executionStrategy = normalizeExecutionStrategy(
                plan.executionStrategy,
                requestedKind === 'after_paint'
                    ? 'after_paint'
                    : (options.preferIdle !== false ? 'idle' : 'timeout')
            );
            const delayMs = Number.isFinite(plan.delayMs)
                ? Math.max(plan.delayMs, 0)
                : (Number.isFinite(options.delay) ? Math.max(options.delay, 0) : 0);
            const timeoutMs = Number.isFinite(plan.timeoutMs)
                ? Math.max(plan.timeoutMs, 0)
                : (Number.isFinite(options.timeout) ? Math.max(options.timeout, 0) : 220);
            const lane = normalizeScheduledLane(plan.lane || options.lane, laneFallback);
            return indexScheduledJob({
                id: ++scheduledJobIdCounter,
                kind: requestedKind,
                scope: safeScope,
                token,
                rootId: safeRootId,
                rootVersion: rootSnapshot ? rootSnapshot.version : null,
                rootSnapshot: rootSnapshot || null,
                status: 'scheduled',
                scheduledAt: schedulerNow(),
                startedAt: 0,
                finishedAt: 0,
                waitMs: 0,
                runDurationMs: 0,
                callback: null,
                finished: false,
                running: false,
                handles: {
                    timeouts: new Set(),
                    rafs: new Set(),
                    idles: new Set()
                },
                meta: {
                    delay: delayMs,
                    timeout: timeoutMs,
                    preferIdle: executionStrategy === 'idle',
                    lane,
                    priority: Number.isFinite(plan.priority)
                        ? plan.priority
                        : (Number.isFinite(options.priority) ? options.priority : 100),
                    budgetClass: String(plan.budgetClass || options.budgetClass || '').trim()
                        || (requestedKind === 'after_paint' ? 'visible_commit' : 'background_prepare'),
                    coalesceKey: String(plan.coalesceKey || options.coalesceKey || '').trim() || '',
                    deadlineMs: Number.isFinite(plan.deadlineMs)
                        ? Math.max(plan.deadlineMs, 0)
                        : (Number.isFinite(options.deadlineMs) ? Math.max(options.deadlineMs, 0) : 0),
                    executionStrategy,
                    pressureLevel: String(plan.pressureLevel || schedulerTelemetry.pressureLevel || 'normal').trim() || 'normal',
                    failureSeverity: normalizeSchedulerFailureSeverity(plan.failureSeverity || options.failureSeverity, ''),
                    panicRelevant: plan.panicRelevant === true || options.panicRelevant === true,
                    panicCritical: plan.panicCritical === true || options.panicCritical === true,
                    trustRelevant: plan.trustRelevant === true || options.trustRelevant === true,
                    reasonCode: String(plan.reasonCode || options.reasonCode || '').trim(),
                    diagnosticCode: String(plan.diagnosticCode || options.diagnosticCode || '').trim()
                }
            });
        }

        function hasScheduledHandle(handle) {
            return handle !== null && typeof handle !== 'undefined';
        }

        function addScheduledHandle(job, kind, handle) {
            if (!job || !hasScheduledHandle(handle) || !job.handles[kind]) return handle;
            job.handles[kind].add(handle);
            return handle;
        }

        function removeScheduledHandle(job, kind, handle) {
            if (!job || !job.handles[kind]) return;
            job.handles[kind].delete(handle);
        }

        function clearScheduledJobHandles(job) {
            if (!job || !job.handles) return;
            job.handles.timeouts.forEach((handle) => {
                hostAdapter.clearTimeout(handle);
            });
            job.handles.rafs.forEach((handle) => {
                cancelAnimationFrameSafe(handle);
            });
            job.handles.idles.forEach((handle) => {
                cancelIdleCallbackSafe(handle);
            });
            job.handles.timeouts.clear();
            job.handles.rafs.clear();
            job.handles.idles.clear();
        }

        function finalizeScheduledJob(job, status, reason = '', options = {}) {
            if (!job || job.finished) return false;
            const finalStatus = normalizeScheduledFinalStatus(status, reason);
            job.finished = true;
            job.running = false;
            job.status = finalStatus;
            job.finishedAt = schedulerNow();
            if (options && options.error) {
                job.error = options.error;
            }
            if (!job.waitMs && job.startedAt) {
                job.waitMs = Math.max(job.startedAt - job.scheduledAt, 0);
            }
            if (job.startedAt && !job.runDurationMs) {
                job.runDurationMs = Math.max(job.finishedAt - job.startedAt, 0);
            }
            clearScheduledJobHandles(job);
            unindexScheduledJob(job);
            priorityQueue.noteJobCompleted(job, { now: schedulerNow() });
            if (isSchedulerFailureStatus(finalStatus)) {
                job.failureRecord = publishSchedulerFailureRecord(createSchedulerFailureRecord(job, finalStatus, reason, options));
            }
            recordSchedulerOutcome(job, finalStatus, reason);
            if (!activeRunningJob && !dispatchPendingJob) {
                pumpPriorityQueue('finalized:' + (reason || finalStatus));
            }
            return true;
        }

        function cancelScheduledJob(job, reason = 'manual_cancel') {
            if (!job || job.finished || job.running) return false;
            return finalizeScheduledJob(job, normalizeScheduledFinalStatus('cancelled', reason), reason);
        }

        function cancelScheduledJobsByScope(scope, reason = 'scope_cancelled') {
            const safeScope = String(scope || 'default');
            const bucket = scheduledJobsByScope.get(safeScope);
            if (!bucket || bucket.size === 0) return 0;
            let cancelledCount = 0;
            Array.from(bucket).forEach((jobId) => {
                const job = scheduledJobs.get(jobId);
                if (cancelScheduledJob(job, reason)) cancelledCount += 1;
            });
            return cancelledCount;
        }

        function finalizeScheduledJobsByScope(scope, status, reason = 'scope_finalized') {
            const safeScope = String(scope || 'default');
            const bucket = scheduledJobsByScope.get(safeScope);
            if (!bucket || bucket.size === 0) return 0;
            let finalizedCount = 0;
            Array.from(bucket).forEach((jobId) => {
                const job = scheduledJobs.get(jobId);
                if (job && !job.finished && !job.running && finalizeScheduledJob(job, status, reason)) finalizedCount += 1;
            });
            return finalizedCount;
        }

        function abortScheduledJobsByScope(scope, reason = 'scheduler_aborted') {
            return finalizeScheduledJobsByScope(scope, 'aborted', reason);
        }

        function panicBlockScheduledJobsByScope(scope, reason = 'panic_blocked') {
            return finalizeScheduledJobsByScope(scope, 'panic_blocked', reason);
        }

        function cancelScheduledJobsByRoot(rootId, reason = 'root_cancelled') {
            const safeRootId = normalizeRootId(rootId);
            if (!safeRootId) return 0;
            const bucket = scheduledJobsByRoot.get(safeRootId);
            if (!bucket || bucket.size === 0) return 0;
            let cancelledCount = 0;
            Array.from(bucket).forEach((jobId) => {
                const job = scheduledJobs.get(jobId);
                if (cancelScheduledJob(job, reason)) cancelledCount += 1;
            });
            return cancelledCount;
        }

        function scheduleTimeoutHandle(job, callback, delay) {
            let handle = null;
            handle = hostAdapter.scheduleTimeout(() => {
                removeScheduledHandle(job, 'timeouts', handle);
                if (!job || job.finished) return;
                callback();
            }, Math.max(Number(delay) || 0, 0));
            addScheduledHandle(job, 'timeouts', handle);
            return handle;
        }

        function scheduleRafHandle(job, callback) {
            let handle = null;
            handle = hostAdapter.scheduleAnimationFrame(() => {
                removeScheduledHandle(job, 'rafs', handle);
                if (!job || job.finished) return;
                callback();
            });
            addScheduledHandle(job, 'rafs', handle);
            return handle;
        }

        function scheduleIdleHandle(job, callback, timeout) {
            let handle = null;
            handle = hostAdapter.scheduleIdleCallback(() => {
                removeScheduledHandle(job, 'idles', handle);
                if (!job || job.finished) return;
                callback();
            }, { timeout: timeout || 220 });
            addScheduledHandle(job, 'idles', handle);
            return handle;
        }

        function runScheduledJob(job, callback) {
            if (!job || job.finished) return;
            if (!isScopeTokenCurrent(job.scope, job.token)) {
                finalizeScheduledJob(job, 'stale_scope', 'scope_token_mismatch');
                return;
            }
            if (job.rootId) {
                if (!job.rootSnapshot || !isRootSnapshotCurrent(job.rootSnapshot)) {
                    finalizeScheduledJob(job, 'stale_root', 'root_version_mismatch');
                    return;
                }
            }

            job.running = true;
            if (dispatchPendingJob && dispatchPendingJob.id === job.id) {
                dispatchPendingJob = null;
            }
            activeRunningJob = job;
            job.startedAt = schedulerNow();
            job.waitMs = Math.max(job.startedAt - (job.scheduledAt || job.startedAt), 0);
            priorityQueue.noteJobStarted(job, { now: job.startedAt });
            schedulerDiagnostics.noteJobLifecycle({
                phase: 'started',
                kind: job.kind,
                lane: job.meta && job.meta.lane,
                strategy: job.meta && job.meta.executionStrategy,
                rootId: job.rootId,
                scope: job.scope,
                waitMs: job.waitMs
            });
            try {
                const runStartedAt = schedulerNow();
                callback({
                    token: job.token,
                    scope: job.scope,
                    rootId: job.rootId,
                    rootVersion: job.rootVersion
                });
                job.runDurationMs = Math.max(schedulerNow() - runStartedAt, 0);
            } catch (error) {
                job.runDurationMs = Math.max(schedulerNow() - (job.startedAt || schedulerNow()), 0);
                finalizeScheduledJob(job, 'failed', 'callback_error', {
                    error,
                    severity: error && error.severity || schedulerFailurePolicy.callbackFailureSeverity,
                    panicRelevant: error && error.panicRelevant === true || schedulerFailurePolicy.callbackFailureActivatesPanic !== false,
                    trustRelevant: error && error.trustRelevant === true || job.meta && job.meta.trustRelevant === true,
                    reasonCode: error && error.reasonCode || job.meta && job.meta.reasonCode || 'xtend.rmt.kernel-scheduler-failure.callback_error',
                    diagnosticCode: error && error.diagnosticCode || job.meta && job.meta.diagnosticCode || 'rmt.kernel.scheduler.callback_error'
                });
                throw error;
            }
            finalizeScheduledJob(job, 'executed', 'callback_completed');
        }

        function createScheduledJobHandle(job) {
            return {
                cancel: (reason = 'manual_cancel') => cancelScheduledJob(job, reason),
                getId: () => job.id,
                getLane: () => job.meta && job.meta.lane,
                getPriority: () => (job.meta && Number.isFinite(job.meta.priority) ? job.meta.priority : 0),
                getRootId: () => job.rootId,
                getScope: () => job.scope,
                getStrategy: () => job.meta && job.meta.executionStrategy,
                getStatus: () => job.status,
                isPending: () => !job.finished,
                token: job.token
            };
        }

        function getSchedulerStats() {
            const completedCount = schedulerTelemetry.executed + schedulerTelemetry.failed + schedulerTelemetry.aborted + schedulerTelemetry.panicBlocked + schedulerTelemetry.cancelled + schedulerTelemetry.staleScope + schedulerTelemetry.staleRoot;
            return {
                scheduled: schedulerTelemetry.scheduled,
                executed: schedulerTelemetry.executed,
                failed: schedulerTelemetry.failed,
                aborted: schedulerTelemetry.aborted,
                panicBlocked: schedulerTelemetry.panicBlocked,
                cancelled: schedulerTelemetry.cancelled,
                staleScope: schedulerTelemetry.staleScope,
                staleRoot: schedulerTelemetry.staleRoot,
                pending: schedulerTelemetry.pending,
                pressureLevel: schedulerTelemetry.pressureLevel,
                averageWaitMs: completedCount > 0 ? schedulerTelemetry.totalWaitMs / completedCount : 0,
                averageRunMs: completedCount > 0 ? schedulerTelemetry.totalRunMs / completedCount : 0,
                maxWaitMs: schedulerTelemetry.maxWaitMs,
                maxRunMs: schedulerTelemetry.maxRunMs,
                byReason: { ...schedulerTelemetry.byReason },
                byLane: cloneSchedulerLaneTelemetry(),
                pendingByLane: { ...schedulerTelemetry.pendingByLane },
                pendingByStrategy: { ...schedulerTelemetry.pendingByStrategy },
                priorityQueue: priorityQueue.getStats(),
                diagnostics: schedulerDiagnostics.getSnapshot(),
                failures: schedulerTelemetry.failures.map((entry) => cloneSchedulerFailureValue(entry, {})),
                history: schedulerTelemetry.history.slice()
            };
        }

        function listScheduledJobs() {
            return Array.from(scheduledJobs.values()).map((job) => ({
                id: job.id,
                kind: job.kind,
                lane: job.meta && job.meta.lane ? job.meta.lane : '',
                strategy: job.meta && job.meta.executionStrategy ? job.meta.executionStrategy : '',
                effectivePriority: job.meta && Number.isFinite(job.meta.effectivePriority) ? job.meta.effectivePriority : 0,
                priority: job.meta && Number.isFinite(job.meta.priority) ? job.meta.priority : 0,
                scope: job.scope,
                rootId: job.rootId,
                rootVersion: job.rootVersion,
                status: job.status,
                scheduledAt: job.scheduledAt,
                pending: !job.finished
            }));
        }

        function createAbortController() {
            return hostAdapter.createAbortController();
        }

        function createRootState(rootId) {
            return {
                id: rootId,
                element: null,
                mounted: false,
                namespace: '',
                version: 0,
                options: {},
                abortController: createAbortController(),
                eventBindings: new Map(),
                resources: new Map()
            };
        }

        function normalizeResourceId(resourceId) {
            return String(resourceId || '').trim();
        }

        function getOrCreateRootState(rootId) {
            const safeRootId = normalizeRootId(rootId);
            if (!safeRootId) throw new Error('Rmt rootId ist erforderlich.');
            if (!rootRegistry.has(safeRootId)) {
                rootRegistry.set(safeRootId, createRootState(safeRootId));
            }
            return rootRegistry.get(safeRootId);
        }

        function getRootState(rootId) {
            const safeRootId = normalizeRootId(rootId);
            return safeRootId ? rootRegistry.get(safeRootId) || null : null;
        }

        function destroyManagedResource(resourceRecord, reason = 'resource_disposed') {
            if (!resourceRecord || resourceRecord.disposed) return false;
            resourceRecord.disposed = true;
            resourceRecord.disposedAt = schedulerNow();
            resourceRecord.disposeReason = String(reason || 'resource_disposed');

            const destroyFn = typeof resourceRecord.destroy === 'function'
                ? resourceRecord.destroy
                : (resourceRecord.value && typeof resourceRecord.value.destroy === 'function'
                    ? resourceRecord.value.destroy.bind(resourceRecord.value)
                    : null);

            if (!destroyFn) return false;

            try {
                destroyFn(resourceRecord.value, {
                    rootId: resourceRecord.rootId,
                    resourceId: resourceRecord.id,
                    reason: resourceRecord.disposeReason,
                    meta: resourceRecord.meta
                });
            } catch (_) {}
            return true;
        }

        function disposeRootResources(rootId, reason = 'root_resource_disposed') {
            const rootState = getRootState(rootId);
            if (!rootState || !rootState.resources || rootState.resources.size === 0) return 0;
            let disposedCount = 0;
            Array.from(rootState.resources.values()).forEach((resourceRecord) => {
                if (destroyManagedResource(resourceRecord, reason)) disposedCount += 1;
            });
            rootState.resources.clear();
            return disposedCount;
        }

        function listResources(rootId = '') {
            const safeRootId = normalizeRootId(rootId);
            if (safeRootId) {
                const rootState = getRootState(safeRootId);
                if (!rootState) return [];
                return Array.from(rootState.resources.values()).map((resourceRecord) => ({
                    id: resourceRecord.id,
                    rootId: resourceRecord.rootId,
                    type: resourceRecord.type,
                    attachedAt: resourceRecord.attachedAt,
                    meta: { ...resourceRecord.meta }
                }));
            }

            const result = [];
            rootRegistry.forEach((rootState) => {
                rootState.resources.forEach((resourceRecord) => {
                    result.push({
                        id: resourceRecord.id,
                        rootId: resourceRecord.rootId,
                        type: resourceRecord.type,
                        attachedAt: resourceRecord.attachedAt,
                        meta: { ...resourceRecord.meta }
                    });
                });
            });
            return result;
        }

        function attachResource(rootId, resourceId, resourceValue, options = {}) {
            const rootState = getOrCreateRootState(rootId);
            const safeResourceId = normalizeResourceId(resourceId);
            if (!safeResourceId) throw new Error('Rmt resourceId ist erforderlich.');

            const existing = rootState.resources.get(safeResourceId);
            if (existing) return existing.handle;

            const resourceRecord = {
                id: safeResourceId,
                rootId: rootState.id,
                value: resourceValue,
                type: String(options.type || '').trim() || 'resource',
                destroy: typeof options.destroy === 'function' ? options.destroy : null,
                meta: options.meta && typeof options.meta === 'object' ? { ...options.meta } : {},
                attachedAt: schedulerNow(),
                disposed: false,
                disposedAt: 0,
                disposeReason: ''
            };
            resourceRecord.handle = {
                dispose: (reason = 'manual_dispose') => disposeResource(rootState.id, safeResourceId, reason),
                getId: () => safeResourceId,
                getRootId: () => rootState.id,
                getValue: () => resourceRecord.value,
                getMeta: () => ({ ...resourceRecord.meta })
            };

            rootState.resources.set(safeResourceId, resourceRecord);
            return resourceRecord.handle;
        }

        function replaceResource(rootId, resourceId, resourceValue, options = {}) {
            const rootState = getOrCreateRootState(rootId);
            const safeResourceId = normalizeResourceId(resourceId);
            if (!safeResourceId) throw new Error('Rmt resourceId ist erforderlich.');
            disposeResource(rootState.id, safeResourceId, options.disposeReason || 'resource_replaced');
            return attachResource(rootState.id, safeResourceId, resourceValue, options);
        }

        function disposeResource(rootId, resourceId, reason = 'resource_disposed') {
            const rootState = getRootState(rootId);
            const safeResourceId = normalizeResourceId(resourceId);
            if (!rootState || !safeResourceId || !rootState.resources.has(safeResourceId)) return false;
            const resourceRecord = rootState.resources.get(safeResourceId);
            rootState.resources.delete(safeResourceId);
            return destroyManagedResource(resourceRecord, reason);
        }

        function emitRootCustomEvent(rootId, eventName, detail = {}) {
            const rootElement = getRootElement(rootId);
            const safeEventName = String(eventName || '').trim();
            if (!rootElement || !safeEventName || typeof hostAdapter.emit !== 'function') return false;
            return hostAdapter.emit(rootElement, safeEventName, detail, { bubbles: false });
        }

        function nextScopeToken(scope) {
            const safeScope = String(scope || 'default');
            const nextToken = (scopeTokens.get(safeScope) || 0) + 1;
            scopeTokens.set(safeScope, nextToken);
            return nextToken;
        }

        function isScopeTokenCurrent(scope, token) {
            return scopeTokens.get(String(scope || 'default')) === token;
        }

        function getRootSnapshot(rootId) {
            const rootState = getRootState(rootId);
            if (!rootState || !rootState.mounted || !rootState.element) return null;
            return {
                id: rootState.id,
                version: rootState.version
            };
        }

        function isRootSnapshotCurrent(snapshot) {
            if (!snapshot || !snapshot.id) return true;
            const rootState = getRootState(snapshot.id);
            return !!(rootState && rootState.mounted && rootState.version === snapshot.version && rootState.element);
        }

        function withScopedExecution(scope, runner) {
            const safeScope = String(scope || 'default');
            cancelScheduledJobsByScope(safeScope, 'scope_superseded');
            const token = nextScopeToken(safeScope);
            return runner(token, safeScope);
        }

        function detachEventBinding(rootState, binding) {
            if (!rootState || !binding || !binding.attachedElement) return;
            if (typeof binding.detach === 'function') binding.detach();
            binding.detach = null;
            binding.attachedElement = null;
        }

        function matchesDelegatedKeyFilter(event, keyFilter) {
            if (!keyFilter) return true;
            if (Array.isArray(keyFilter)) return keyFilter.includes(event.key);
            if (typeof keyFilter === 'function') return !!keyFilter(event);
            return event.key === keyFilter;
        }

        function invokeRootCompatMethod(methodName, rootId, args = []) {
            if (!rmtApi || typeof rmtApi[methodName] !== 'function') return null;
            return rmtApi[methodName](rootId, ...args);
        }

        function resolveDelegatedAction(rootState, matchedElement, event, handlerDef) {
            const explicitAction = String(handlerDef && handlerDef.action ? handlerDef.action : '').trim();
            if (explicitAction) return explicitAction;
            const resolvedAction = resolveCompatibilityHook('resolveDelegatedAction', [{
                rootState,
                matchedElement,
                event,
                handlerDef,
                rmt: rmtApi
            }], '');
            return String(resolvedAction || '').trim();
        }

        function cloneDelegatedDataset(dataset) {
            const result = {};
            if (!dataset || typeof dataset !== 'object') return result;
            Object.keys(dataset).forEach((key) => {
                result[key] = dataset[key];
            });
            return result;
        }

        function readDelegatedTargetValue(target) {
            if (!target || typeof target !== 'object') return null;
            if (typeof target.value === 'string' || typeof target.value === 'number' || typeof target.value === 'boolean') {
                return target.value;
            }
            return null;
        }

        function buildDelegatedCommandPayload(ctx, handlerDef) {
            if (handlerDef && typeof handlerDef.buildCommandPayload === 'function') {
                const customPayload = handlerDef.buildCommandPayload(ctx);
                return customPayload && typeof customPayload === 'object' ? customPayload : {};
            }
            return {
                action: String(ctx.action || '').trim(),
                eventType: ctx.event && ctx.event.type ? String(ctx.event.type || '').trim() : '',
                key: ctx.event && ctx.event.key ? String(ctx.event.key || '').trim() : '',
                dataset: cloneDelegatedDataset(ctx.dataset),
                targetId: ctx.target && ctx.target.id ? String(ctx.target.id) : '',
                targetName: ctx.target && ctx.target.name ? String(ctx.target.name) : '',
                targetValue: readDelegatedTargetValue(ctx.target),
                checked: !!(ctx.target && typeof ctx.target.checked === 'boolean' ? ctx.target.checked : false)
            };
        }

        function buildDelegatedCommandMeta(ctx, handlerDef) {
            const baseMeta = handlerDef && typeof handlerDef.buildCommandMeta === 'function'
                ? handlerDef.buildCommandMeta(ctx)
                : {};
            return {
                source: 'rmt.delegated_ui',
                eventType: ctx.event && ctx.event.type ? String(ctx.event.type || '').trim() : '',
                action: String(ctx.action || '').trim(),
                handlerId: Number.isFinite(handlerDef && handlerDef.id) ? handlerDef.id : 0,
                ...(baseMeta && typeof baseMeta === 'object' ? baseMeta : {})
            };
        }

        function resolveDelegatedCommandSupersessionKey(ctx, handlerDef) {
            if (handlerDef && typeof handlerDef.resolveCommandSupersessionKey === 'function') {
                return String(handlerDef.resolveCommandSupersessionKey(ctx) || '').trim();
            }
            return '';
        }

        function dispatchDelegatedCommand(ctx, handlerDef, commandName, options = {}) {
            const safeCommandName = String(commandName || '').trim().toLowerCase();
            if (!safeCommandName) {
                return Promise.resolve({
                    status: 'failed',
                    correlationId: '',
                    commandName: '',
                    rootId: ctx.rootId,
                    result: null,
                    error: { name: 'RmtCommandNameMissing', message: 'Rmt commandName fehlt.', stack: '' },
                    superseded: false,
                    metrics: { startedAt: schedulerNow(), completedAt: schedulerNow(), requestedAt: schedulerNow(), durationMs: 0 },
                    issuedCommands: []
                });
            }

            return commandBus.dispatch({
                type: 'command',
                commandName: safeCommandName,
                rootId: ctx.rootId,
                payload: buildDelegatedCommandPayload(ctx, handlerDef),
                meta: buildDelegatedCommandMeta(ctx, handlerDef),
                requestedAt: schedulerNow()
            }, {
                runtimeContext: ctx,
                supersessionKey: resolveDelegatedCommandSupersessionKey(ctx, handlerDef),
                ...(options && typeof options === 'object' ? options : {})
            });
        }

        function createDelegatedCommandHandler(commandName, handlerDef = {}) {
            const safeCommandName = String(commandName || '').trim().toLowerCase();
            return function delegatedCommandHandler(ctx) {
                const dispatchPromise = dispatchDelegatedCommand(ctx, handlerDef, safeCommandName);
                dispatchPromise.then((response) => {
                    try {
                        if (response && response.status === 'failed') {
                            if (typeof handlerDef.onCommandError === 'function') {
                                handlerDef.onCommandError({ ...ctx, response });
                            }
                            return;
                        }
                        if (typeof handlerDef.onCommandResponse === 'function') {
                            handlerDef.onCommandResponse({ ...ctx, response });
                        }
                    } catch (_error) {
                        // Command response hooks must not destabilize delegation.
                    }
                });
                return dispatchPromise;
            };
        }

        function resolveDelegatedCommandName(config = {}) {
            const commandConfig = config.command && typeof config.command === 'object'
                ? config.command
                : null;
            return String(
                config.commandName
                || (commandConfig && (commandConfig.commandName || commandConfig.name))
                || ''
            ).trim().toLowerCase();
        }

        function createDelegatedHandlerContext(rootState, matchedElement, event, handlerDef) {
            const matchedDataset = matchedElement && matchedElement.dataset ? matchedElement.dataset : {};
            const baseContext = {
                action: resolveDelegatedAction(rootState, matchedElement, event, handlerDef),
                attachResource: (resourceId, resourceValue, options = {}) => attachResource(rootState.id, resourceId, resourceValue, options),
                currentTarget: rootState.element,
                dataset: matchedDataset,
                disposeResource: (resourceId, reason = 'resource_disposed') => disposeResource(rootState.id, resourceId, reason),
                disposeRoot: () => disposeRoot(rootState.id),
                event,
                invalidateRoot: () => invalidateRoot(rootState.id),
                listResources: () => listResources(rootState.id),
                matchedElement,
                rmt: rmtApi,
                replaceResource: (resourceId, resourceValue, options = {}) => replaceResource(rootState.id, resourceId, resourceValue, options),
                root: rootState.element,
                rootId: rootState.id,
                rootVersion: rootState.version,
                scheduler: {
                    abortScope,
                    afterPaint,
                    cancel,
                    cancelRoot,
                    cancelScope,
                    deferred,
                    panicBlockScope,
                    getDiagnostics: getSchedulerDiagnostics,
                    getPressureLevel: () => schedulerTelemetry.pressureLevel,
                    getPriorityQueueStats,
                    reportPerformanceSample,
                    schedule
                },
                signal: rootState.abortController ? rootState.abortController.signal : null,
                target: matchedElement
            };
            baseContext.commands = {
                cancel: commandBus.cancel,
                dispatch: (commandName, payload = {}, options = {}) => commandBus.dispatch({
                    type: 'command',
                    commandName: String(commandName || '').trim().toLowerCase(),
                    rootId: rootState.id,
                    payload: payload && typeof payload === 'object' ? payload : {},
                    meta: options.meta && typeof options.meta === 'object' ? options.meta : {},
                    requestedAt: schedulerNow()
                }, {
                    runtimeContext: baseContext,
                    ...(options && typeof options === 'object' ? options : {})
                }),
                getSnapshot: commandBus.getSnapshot,
                listHandlers: commandBus.listHandlers,
                listPending: commandBus.listPendingCommands
            };
            baseContext.commandBus = commandBus;
            baseContext.dispatchCommand = (commandName, payload = {}, options = {}) => baseContext.commands.dispatch(commandName, payload, options);
            if (rmtApi && typeof rmtApi.attachSortable === 'function') {
                baseContext.attachSortable = (resourceId, element, sortableOptions = {}, options = {}) => invokeRootCompatMethod(
                    'attachSortable',
                    rootState.id,
                    [resourceId, element, sortableOptions, options]
                );
            }
            return extendDelegatedHandlerContext(baseContext, {
                rootState,
                matchedElement,
                event,
                handlerDef,
                rmt: rmtApi
            });
        }

        function createDelegatedListener(rootState, binding) {
            return function delegatedEventListener(event) {
                if (!rootState || !rootState.mounted || !rootState.element) return;
                const rootElement = rootState.element;
                const rawTarget = event && event.target ? event.target : null;
                const eventTarget = rawTarget && rawTarget.nodeType === 1
                    ? rawTarget
                    : (rawTarget && rawTarget.parentElement ? rawTarget.parentElement : null);
                const handlerDefs = Array.isArray(binding.handlers) ? [...binding.handlers] : [];

                for (let index = 0; index < handlerDefs.length; index += 1) {
                    const handlerDef = handlerDefs[index];
                    if (!handlerDef || typeof handlerDef.handler !== 'function') continue;
                    if (!matchesDelegatedKeyFilter(event, handlerDef.keyFilter)) continue;

                    let matchedElement = rootElement;
                    if (handlerDef.selector) {
                        if (!eventTarget || typeof eventTarget.closest !== 'function') continue;
                        matchedElement = eventTarget.closest(handlerDef.selector);
                        if (!matchedElement || !rootElement.contains(matchedElement)) continue;
                    }

                    const ctx = createDelegatedHandlerContext(rootState, matchedElement, event, handlerDef);
                    if (typeof handlerDef.guard === 'function' && !handlerDef.guard(ctx)) continue;

                    if (handlerDef.preventDefault && event && typeof event.preventDefault === 'function') {
                        event.preventDefault();
                    }
                    handlerDef.handler(ctx);

                    if (handlerDef.once) {
                        removeDelegatedHandler(rootState.id, handlerDef.id);
                    }
                    if (handlerDef.stop) {
                        event.stopPropagation();
                        break;
                    }
                }
            };
        }

        function getDelegatedBinding(rootState, eventType, options = {}) {
            const safeEventType = String(eventType || '').trim();
            if (!safeEventType) throw new Error('Rmt eventType ist erforderlich.');

            const capture = !!options.capture;
            const passive = !!options.passive;
            const key = `${safeEventType}::${capture ? 'capture' : 'bubble'}::${passive ? 'passive' : 'active'}`;

            if (!rootState.eventBindings.has(key)) {
                const binding = {
                    key,
                    eventType: safeEventType,
                    capture,
                    passive,
                    listener: null,
                    handlers: [],
                    detach: null,
                    attachedElement: null
                };
                binding.listener = createDelegatedListener(rootState, binding);
                rootState.eventBindings.set(key, binding);
            }

            return rootState.eventBindings.get(key);
        }

        function attachEventBinding(rootState, binding) {
            if (!rootState || !binding || !rootState.mounted || !rootState.element || typeof hostAdapter.listen !== 'function') return;
            if (binding.attachedElement === rootState.element) return;
            detachEventBinding(rootState, binding);
            binding.detach = hostAdapter.listen(rootState.element, binding.eventType, binding.listener, {
                capture: !!binding.capture,
                passive: !!binding.passive
            });
            binding.attachedElement = rootState.element;
        }

        function attachAllEventBindings(rootState) {
            if (!rootState) return;
            rootState.eventBindings.forEach((binding) => {
                attachEventBinding(rootState, binding);
            });
        }

        function refreshRootAbortController(rootState) {
            if (!rootState) return;
            if (rootState.abortController && typeof rootState.abortController.abort === 'function') {
                try {
                    rootState.abortController.abort();
                } catch (_) {}
            }
            rootState.abortController = createAbortController();
        }

        function createRootHandle(rootId) {
            const rootHandle = {
                dispose: () => disposeRoot(rootId),
                disposeResource: (resourceId, reason = 'resource_disposed') => disposeResource(rootId, resourceId, reason),
                getElement: () => getRootElement(rootId),
                getId: () => normalizeRootId(rootId),
                getResources: () => listResources(rootId),
                getVersion: () => getRootVersion(rootId),
                invalidate: () => invalidateRoot(rootId),
                attachResource: (resourceId, resourceValue, options = {}) => attachResource(rootId, resourceId, resourceValue, options),
                cancelScheduledWork: () => cancelRoot(rootId),
                off: (handlerRef) => off(rootId, null, handlerRef),
                on: (eventType, config) => on(rootId, eventType, config),
                once: (eventType, config) => once(rootId, eventType, config),
                replaceResource: (resourceId, resourceValue, options = {}) => replaceResource(rootId, resourceId, resourceValue, options)
            };
            if (rmtApi && typeof rmtApi.attachSortable === 'function') {
                rootHandle.attachSortable = (resourceId, element, sortableOptions = {}, options = {}) => invokeRootCompatMethod(
                    'attachSortable',
                    rootId,
                    [resourceId, element, sortableOptions, options]
                );
            }
            return rootHandle;
        }

        function mountRoot(rootId, element, options = {}) {
            const rootState = getOrCreateRootState(rootId);
            const nextElement = element || null;
            const shouldRefreshVersion = !rootState.mounted || rootState.element !== nextElement;

            if (shouldRefreshVersion) {
                cancelScheduledJobsByRoot(rootState.id, 'root_refresh');
            }

            if (rootState.element && rootState.element !== nextElement) {
                disposeRootResources(rootState.id, 'root_element_replaced');
                rootState.eventBindings.forEach((binding) => {
                    detachEventBinding(rootState, binding);
                });
            }

            rootState.element = nextElement;
            rootState.mounted = !!nextElement;
            rootState.options = { ...rootState.options, ...options };
            rootState.namespace = String(rootState.options.namespace || rootState.namespace || '').trim();

            if (shouldRefreshVersion) {
                rootState.version = rootState.version > 0 ? rootState.version + 1 : 1;
                refreshRootAbortController(rootState);
            } else if (!rootState.abortController) {
                rootState.abortController = createAbortController();
            }

            if (rootState.mounted) {
                attachAllEventBindings(rootState);
            }

            return createRootHandle(rootState.id);
        }

        function getRootElement(rootId) {
            const rootState = getRootState(rootId);
            return rootState && rootState.element ? rootState.element : null;
        }

        function getRootVersion(rootId) {
            const rootState = getRootState(rootId);
            return rootState ? rootState.version : 0;
        }

        function hasRoot(rootId) {
            const rootState = getRootState(rootId);
            return !!(rootState && rootState.mounted && rootState.element);
        }

        function invalidateRoot(rootId) {
            const rootState = getRootState(rootId);
            if (!rootState) return 0;
            cancelScheduledJobsByRoot(rootState.id, 'root_invalidated');
            rootState.version = rootState.version > 0 ? rootState.version + 1 : 1;
            refreshRootAbortController(rootState);
            return rootState.version;
        }

        function disposeRoot(rootId, options = {}) {
            const rootState = getRootState(rootId);
            if (!rootState) return false;

            cancelScheduledJobsByRoot(rootState.id, 'root_disposed');
            commandBus.cancelByRoot(rootState.id, 'root_disposed');
            reactivity.disposeRoot(rootState.id);
            disposeRootResources(rootState.id, 'root_disposed');
            rootState.eventBindings.forEach((binding) => {
                detachEventBinding(rootState, binding);
            });
            rootState.mounted = false;
            rootState.element = null;
            rootState.version = rootState.version > 0 ? rootState.version + 1 : 1;
            refreshRootAbortController(rootState);

            if (options.clearHandlers === true) {
                rootState.eventBindings.clear();
            }
            if (options.removeState === true) {
                rootRegistry.delete(rootState.id);
            }

            return true;
        }

        function storeGlobalListenerEntry(entry) {
            globalListenerRegistry.set(entry.id, entry);
            return entry;
        }

        function describeGlobalListener(config = {}) {
            const entry = {
                id: ++globalListenerIdCounter,
                eventType: String(config.eventType || '').trim() || 'unknown',
                targetName: describeListenerTarget(config.target || null, config.targetName || ''),
                owner: String(config.owner || '').trim() || '',
                reason: String(config.reason || '').trim() || '',
                phase: String(config.phase || '').trim() || '',
                attached: false,
                managedByRmt: false,
                target: null,
                handler: null,
                listenerOptions: null,
                unsubscribe: null
            };
            storeGlobalListenerEntry(entry);
            return entry.id;
        }

        function removeGlobalListener(listenerRef) {
            const listenerId = typeof listenerRef === 'function' && listenerRef.listenerId
                ? listenerRef.listenerId
                : (Number.isFinite(listenerRef) ? listenerRef : Number(listenerRef) || 0);
            if (!listenerId || !globalListenerRegistry.has(listenerId)) return false;

            const entry = globalListenerRegistry.get(listenerId);
            if (entry && entry.attached && typeof entry.unsubscribe === 'function') entry.unsubscribe();
            globalListenerRegistry.delete(listenerId);
            return true;
        }

        function listenGlobal(target, eventType, handler, options = {}) {
            if (!target || typeof hostAdapter.listen !== 'function') {
                throw new Error(`Rmt global listener target ist ungueltig fuer ${String(eventType || '').trim() || 'unknown'}`);
            }
            if (typeof handler !== 'function') {
                throw new Error(`Rmt global listener handler fehlt fuer ${String(eventType || '').trim() || 'unknown'}`);
            }

            const listenerOptions = resolveListenerOptions(options);
            const entry = storeGlobalListenerEntry({
                id: ++globalListenerIdCounter,
                eventType: String(eventType || '').trim() || 'unknown',
                targetName: describeListenerTarget(target, options.targetName || ''),
                owner: String(options.owner || '').trim() || '',
                reason: String(options.reason || '').trim() || '',
                phase: String(options.phase || '').trim() || '',
                attached: true,
                managedByRmt: true,
                target,
                handler,
                listenerOptions: listenerOptions,
                unsubscribe: null
            });

            entry.unsubscribe = hostAdapter.listen(target, entry.eventType, handler, listenerOptions);

            const unsubscribe = () => removeGlobalListener(entry.id);
            unsubscribe.listenerId = entry.id;
            unsubscribe.eventType = entry.eventType;
            unsubscribe.targetName = entry.targetName;
            return unsubscribe;
        }

        function listGlobalListeners() {
            return Array.from(globalListenerRegistry.values()).map((entry) => ({
                id: entry.id,
                eventType: entry.eventType,
                targetName: entry.targetName,
                owner: entry.owner,
                reason: entry.reason,
                phase: entry.phase,
                attached: entry.attached === true,
                managedByRmt: entry.managedByRmt === true
            }));
        }

        function buildDelegatedSelector(config = {}) {
            const explicitSelector = String(config.selector || '').trim();
            if (explicitSelector) return explicitSelector;
            const compatSelector = resolveCompatibilityHook('buildDelegatedSelector', [
                config,
                {
                    documentTarget,
                    hostAdapter,
                    rmt: rmtApi,
                    windowTarget
                }
            ], null);
            return typeof compatSelector === 'string'
                ? compatSelector.trim() || null
                : null;
        }

        function sortDelegatedHandlers(binding) {
            if (!binding || !Array.isArray(binding.handlers)) return;
            binding.handlers.sort((left, right) => {
                const leftPriority = Number.isFinite(left.priority) ? left.priority : 100;
                const rightPriority = Number.isFinite(right.priority) ? right.priority : 100;
                if (leftPriority !== rightPriority) return leftPriority - rightPriority;
                return left.order - right.order;
            });
        }

        function on(rootId, eventType, config = {}) {
            const rootState = getOrCreateRootState(rootId);
            const binding = getDelegatedBinding(rootState, eventType, config);
            const selector = buildDelegatedSelector(config);
            const actionName = String(config.action || '').trim();
            const commandName = resolveDelegatedCommandName(config);
            if (actionName && !selector) {
                throw new Error(`Rmt action contract fehlt fuer ${rootState.id}:${eventType}:${actionName}`);
            }
            const handlerDef = {
                action: actionName || null,
                buildCommandMeta: typeof config.buildCommandMeta === 'function' ? config.buildCommandMeta : null,
                buildCommandPayload: typeof config.buildCommandPayload === 'function' ? config.buildCommandPayload : null,
                commandName: commandName || null,
                guard: typeof config.guard === 'function' ? config.guard : null,
                handler: null,
                id: ++delegatedHandlerIdCounter,
                keyFilter: config.keyFilter || null,
                onCommandError: typeof config.onCommandError === 'function' ? config.onCommandError : null,
                onCommandResponse: typeof config.onCommandResponse === 'function' ? config.onCommandResponse : null,
                once: config.once === true,
                order: ++delegatedHandlerOrder,
                preventDefault: config.preventDefault === true,
                priority: Number.isFinite(config.priority) ? config.priority : 100,
                resolveCommandSupersessionKey: typeof config.resolveCommandSupersessionKey === 'function'
                    ? config.resolveCommandSupersessionKey
                    : null,
                selector,
                stop: config.stop === true
            };
            handlerDef.handler = typeof config.handler === 'function'
                ? config.handler
                : (commandName ? createDelegatedCommandHandler(commandName, handlerDef) : null);

            if (!handlerDef.handler) {
                throw new Error(`Rmt Handler fehlt fuer ${rootState.id}:${eventType}`);
            }

            binding.handlers.push(handlerDef);
            sortDelegatedHandlers(binding);
            attachEventBinding(rootState, binding);

            const unsubscribe = () => removeDelegatedHandler(rootState.id, handlerDef.id);
            unsubscribe.handlerId = handlerDef.id;
            unsubscribe.rootId = rootState.id;
            unsubscribe.eventType = binding.eventType;
            return unsubscribe;
        }

        function removeDelegatedHandler(rootId, handlerId) {
            const rootState = getRootState(rootId);
            if (!rootState || !handlerId) return false;

            let removed = false;
            rootState.eventBindings.forEach((binding) => {
                const nextHandlers = binding.handlers.filter((handlerDef) => handlerDef.id !== handlerId);
                if (nextHandlers.length !== binding.handlers.length) {
                    binding.handlers = nextHandlers;
                    removed = true;
                }
                if (binding.handlers.length === 0) {
                    detachEventBinding(rootState, binding);
                }
            });
            return removed;
        }

        function off(rootId, eventType, handlerRef) {
            const rootState = getRootState(rootId);
            if (!rootState || !handlerRef) return false;

            const targetId = typeof handlerRef === 'function' && handlerRef.handlerId
                ? handlerRef.handlerId
                : (Number.isFinite(handlerRef) ? handlerRef : Number(handlerRef) || 0);
            if (targetId) return removeDelegatedHandler(rootState.id, targetId);

            let removed = false;
            rootState.eventBindings.forEach((binding) => {
                if (eventType && binding.eventType !== eventType) return;
                const nextHandlers = binding.handlers.filter((handlerDef) => handlerDef.handler !== handlerRef);
                if (nextHandlers.length !== binding.handlers.length) {
                    binding.handlers = nextHandlers;
                    removed = true;
                }
                if (binding.handlers.length === 0) {
                    detachEventBinding(rootState, binding);
                }
            });
            return removed;
        }

        function once(rootId, eventType, config = {}) {
            return on(rootId, eventType, { ...config, once: true });
        }

        function registerBindings(bindingGroups = []) {
            const groups = Array.isArray(bindingGroups) ? bindingGroups : [bindingGroups];
            const unsubscribers = [];

            groups.forEach((group) => {
                if (!group) return;
                const rootId = group.rootId;
                const eventType = String(group.eventType || '').trim();
                const handlers = Array.isArray(group.handlers) ? group.handlers : [];
                if (!rootId || !eventType || handlers.length === 0) return;
                handlers.forEach((handlerConfig) => {
                    unsubscribers.push(on(rootId, eventType, handlerConfig));
                });
            });

            const unsubscribe = () => {
                unsubscribers.forEach((offHandler) => {
                    if (typeof offHandler === 'function') offHandler();
                });
            };
            unsubscribe.handlers = unsubscribers;
            return unsubscribe;
        }

        function getRootHandle(rootId) {
            return createRootHandle(rootId);
        }

        function mountRoots(rootDefinitions = []) {
            const definitions = Array.isArray(rootDefinitions) ? rootDefinitions : [rootDefinitions];
            return definitions.map((definition) => {
                if (!definition) return null;
                const rootId = normalizeRootId(definition.rootId || definition.id || '');
                if (!rootId) return null;
                const element = definition.element || null;
                return mountRoot(rootId, element, definition.options || {
                    namespace: definition.namespace || ''
                });
            }).filter(Boolean);
        }

        function listRoots() {
            return Array.from(rootRegistry.values()).map((rootState) => ({
                id: rootState.id,
                mounted: rootState.mounted,
                namespace: rootState.namespace || '',
                version: rootState.version,
                elementId: rootState.element && rootState.element.id ? rootState.element.id : '',
                scheduledJobCount: scheduledJobsByRoot.has(rootState.id) ? scheduledJobsByRoot.get(rootState.id).size : 0,
                resourceCount: rootState.resources ? rootState.resources.size : 0
            }));
        }

        function resolveSchedulingPlan(requestedKind, options = {}, rootSnapshot = null) {
            const safeKind = normalizeScheduledKind(requestedKind);
            const fallbackLane = safeKind === 'after_paint'
                ? 'visible_commit'
                : 'background_prepare';
            const resolvedPlan = schedulerDiagnostics.resolveSchedulingPolicy({
                requestedKind: safeKind,
                kind: safeKind,
                lane: options.lane,
                rootId: options.rootId || (rootSnapshot ? rootSnapshot.id : ''),
                rootVersion: rootSnapshot ? rootSnapshot.version : 0,
                isVisible: options.isVisible,
                userBlocking: options.userBlocking === true,
                delay: options.delay,
                timeout: options.timeout,
                preferIdle: options.preferIdle,
                priority: options.priority,
                budgetClass: options.budgetClass,
                coalesceKey: options.coalesceKey,
                deadlineMs: options.deadlineMs
            });

            return {
                requestedKind: safeKind,
                lane: normalizeScheduledLane(resolvedPlan.lane || options.lane, fallbackLane),
                executionStrategy: normalizeExecutionStrategy(
                    resolvedPlan.executionStrategy,
                    safeKind === 'after_paint'
                        ? 'after_paint'
                        : (options.preferIdle !== false ? 'idle' : 'timeout')
                ),
                delayMs: Number.isFinite(resolvedPlan.delayMs)
                    ? Math.max(resolvedPlan.delayMs, 0)
                    : (Number.isFinite(options.delay) ? Math.max(options.delay, 0) : 0),
                timeoutMs: Number.isFinite(resolvedPlan.timeoutMs)
                    ? Math.max(resolvedPlan.timeoutMs, 0)
                    : (Number.isFinite(options.timeout) ? Math.max(options.timeout, 0) : 220),
                priority: Number.isFinite(resolvedPlan.priority)
                    ? resolvedPlan.priority
                    : (Number.isFinite(options.priority) ? options.priority : 100),
                budgetClass: String(resolvedPlan.budgetClass || options.budgetClass || '').trim()
                    || (safeKind === 'after_paint' ? 'visible_commit' : 'background_prepare'),
                coalesceKey: String(resolvedPlan.coalesceKey || options.coalesceKey || '').trim() || '',
                deadlineMs: Number.isFinite(resolvedPlan.deadlineMs)
                    ? Math.max(resolvedPlan.deadlineMs, 0)
                    : (Number.isFinite(options.deadlineMs) ? Math.max(options.deadlineMs, 0) : 0),
                pressureLevel: String(resolvedPlan.pressureLevel || schedulerTelemetry.pressureLevel || 'normal').trim() || 'normal'
            };
        }

        function executeScheduledPlan(job, callback, plan) {
            const run = () => runScheduledJob(job, callback);
            if (plan.executionStrategy === 'after_paint') {
                const scheduleRaf = () => {
                    scheduleRafHandle(job, () => {
                        scheduleRafHandle(job, () => {
                            run();
                        });
                    });
                };
                if (plan.delayMs > 0) {
                    scheduleTimeoutHandle(job, scheduleRaf, plan.delayMs);
                } else {
                    scheduleRaf();
                }
                return;
            }

            if (plan.executionStrategy === 'idle') {
                if (plan.delayMs > 0) {
                    scheduleTimeoutHandle(job, () => {
                        scheduleIdleHandle(job, run, plan.timeoutMs || 220);
                    }, plan.delayMs);
                    return;
                }
                scheduleIdleHandle(job, run, plan.timeoutMs || 220);
                return;
            }

            scheduleTimeoutHandle(job, run, plan.delayMs || 0);
        }

        function schedule(scope, callback, options = {}) {
            return withScopedExecution(scope, (token, safeScope) => {
                const rootSnapshot = options.rootId ? getRootSnapshot(options.rootId) : null;
                const requestedKind = normalizeScheduledKind(options.kind || options.requestedKind || 'deferred');
                const plan = resolveSchedulingPlan(requestedKind, options, rootSnapshot);
                const job = createScheduledJob(requestedKind, safeScope, token, options, rootSnapshot, plan);
                job.callback = callback;
                queueEnqueueJob(job, { reason: 'job_scheduled' });
                return createScheduledJobHandle(job);
            });
        }

        function afterPaint(scope, callback, options = {}) {
            return schedule(scope, callback, {
                ...options,
                kind: 'after_paint'
            });
        }

        function deferred(scope, callback, options = {}) {
            return schedule(scope, callback, {
                ...options,
                kind: 'deferred'
            });
        }

        function reportPerformanceSample(sample = {}) {
            const previousPressureLevel = schedulerTelemetry.pressureLevel;
            const diagnosticsSnapshot = schedulerDiagnostics.reportPerformanceSample(sample);
            if (diagnosticsSnapshot && diagnosticsSnapshot.pressureLevel) {
                schedulerTelemetry.pressureLevel = diagnosticsSnapshot.pressureLevel;
            } else if (typeof schedulerDiagnostics.getPressureLevel === 'function') {
                schedulerTelemetry.pressureLevel = schedulerDiagnostics.getPressureLevel();
            }
            recordSchedulerBackpressurePanic(diagnosticsSnapshot, 'performance_sample', null, previousPressureLevel);
            publishSchedulerSnapshot('performance_sample');
            return diagnosticsSnapshot;
        }

        function getSchedulerDiagnostics() {
            return schedulerDiagnostics.getSnapshot();
        }

        function getPriorityQueueStats() {
            return priorityQueue.getStats();
        }

        function dispatchCommand(command, options = {}) {
            const rawCommand = command && typeof command === 'object'
                ? command
                : {
                    commandName: String(command || '').trim().toLowerCase(),
                    payload: options.payload && typeof options.payload === 'object' ? options.payload : {}
                };
            return commandBus.dispatch({
                type: 'command',
                ...rawCommand,
                commandName: String(rawCommand.commandName || rawCommand.name || '').trim().toLowerCase(),
                rootId: String(rawCommand.rootId || options.rootId || '').trim(),
                payload: rawCommand.payload && typeof rawCommand.payload === 'object' ? rawCommand.payload : {},
                meta: rawCommand.meta && typeof rawCommand.meta === 'object' ? rawCommand.meta : (options.meta && typeof options.meta === 'object' ? options.meta : {}),
                requestedAt: Number.isFinite(rawCommand.requestedAt) ? rawCommand.requestedAt : schedulerNow()
            }, options);
        }

        function cancelScope(scope, reason = 'scope_cancelled') {
            const safeScope = String(scope || 'default');
            const cancelledCount = cancelScheduledJobsByScope(safeScope, reason);
            nextScopeToken(safeScope);
            return cancelledCount;
        }

        function abortScope(scope, reason = 'scheduler_aborted') {
            const safeScope = String(scope || 'default');
            const abortedCount = abortScheduledJobsByScope(safeScope, reason);
            nextScopeToken(safeScope);
            return abortedCount;
        }

        function panicBlockScope(scope, reason = 'panic_blocked') {
            const safeScope = String(scope || 'default');
            const blockedCount = panicBlockScheduledJobsByScope(safeScope, reason);
            nextScopeToken(safeScope);
            return blockedCount;
        }

        function cancelRoot(rootId) {
            const safeRootId = normalizeRootId(rootId);
            if (!safeRootId) return 0;
            const cancelledScheduledJobs = cancelScheduledJobsByRoot(safeRootId, 'root_cancelled');
            const cancelledCommands = commandBus.cancelByRoot(safeRootId, 'root_cancelled');
            return cancelledScheduledJobs + cancelledCommands;
        }

        function cancel(scope, reason = 'scope_cancelled') {
            return cancelScope(scope, reason);
        }

        const rmtApi = {
            abortScope,
            afterPaint,
            attachResource,
            cancel,
            cancelRoot,
            cancelScope,
            deferred,
            panicBlockScope,
            describeGlobalListener,
            dispatchCommand,
            disposeResource,
            disposeRoot,
            emitRootEvent: emitRootCustomEvent,
            getCommandBus: () => commandBus,
            getDiagnosticsHub: () => diagnosticsHub,
            getHostAdapter: () => hostAdapter,
            getPriorityQueueStats,
            getReactivity: () => reactivity,
            getSchedulerDiagnostics,
            getSchedulerPressureLevel: () => schedulerTelemetry.pressureLevel,
            getRootHandle,
            getRootElement,
            getRootState,
            getRootVersion,
            getSchedulerStats,
            hasRoot,
            invalidateRoot,
            isCurrent: isScopeTokenCurrent,
            listGlobalListeners,
            listResources,
            listScheduledJobs,
            listRoots,
            listenGlobal,
            mountRoot,
            mountRoots,
            nextToken: nextScopeToken,
            off,
            on,
            once,
            reportPerformanceSample,
            registerBindings,
            removeGlobalListener,
            replaceResource,
            schedule
        };
        applyCompatibilityExtensions(rmtApi);
        publishSchedulerSnapshot('initialized');

        return rmtApi;
    };

})(__XTENDRMT_GLOBAL__);
