/* modules/rmt-engine-controller.js */
(function registerRmtEngineControllerModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
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
        const schedulerAuthority = deps.scheduler && typeof deps.scheduler.schedule === 'function'
            ? deps.scheduler
            : (deps.kernelScheduler && typeof deps.kernelScheduler.schedule === 'function' ? deps.kernelScheduler : null);
        if (!schedulerAuthority) {
            throw new Error('RMT Engine 0.8 benoetigt genau eine injizierte Kernel-Scheduler-Instanz.');
        }
        const diagnosticsHub = normalizeDiagnosticsHub(
            deps.diagnosticsHub
            || deps.rmtDiagnosticsHub
            || deps.schedulerDiagnosticsHub
            || null
        );
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
        const authorityJobs = new Map();
        const authorityJobsByScope = new Map();
        const authorityJobsByRoot = new Map();
        let delegatedHandlerOrder = 0;
        let delegatedHandlerIdCounter = 0;
        let globalListenerIdCounter = 0;

        function normalizeCompatibilityAdapters(rawAdapters) {
            if (!rawAdapters) return [];
            const adapters = Array.isArray(rawAdapters) ? rawAdapters : [rawAdapters];
            return adapters.filter((adapter) => !!adapter && typeof adapter === 'object');
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
            if (!indexMap.has(safeKey)) indexMap.set(safeKey, new Set());
            return indexMap.get(safeKey);
        }

        function removeIndexedJob(indexMap, key, jobId) {
            const safeKey = String(key || '').trim();
            const bucket = indexMap.get(safeKey);
            if (!bucket) return;
            bucket.delete(jobId);
            if (bucket.size === 0) indexMap.delete(safeKey);
        }

        function normalizeScheduledKind(rawKind) {
            return String(rawKind || '').trim() === 'after_paint' ? 'after_paint' : 'deferred';
        }

        function indexAuthorityHandle(handle, scope, rootId) {
            const entry = { handle, scope, rootId };
            authorityJobs.set(handle.id, entry);
            ensureIndexSet(authorityJobsByScope, scope).add(handle.id);
            if (rootId) ensureIndexSet(authorityJobsByRoot, rootId).add(handle.id);
            const removeEntry = () => {
                authorityJobs.delete(handle.id);
                removeIndexedJob(authorityJobsByScope, scope, handle.id);
                if (rootId) removeIndexedJob(authorityJobsByRoot, rootId, handle.id);
            };
            handle.result.then(removeEntry, removeEntry);
            return handle;
        }

        function cancelIndexedAuthorityJobs(indexMap, key, reason) {
            const bucket = indexMap.get(String(key || '').trim());
            if (!bucket) return 0;
            let count = 0;
            Array.from(bucket).forEach((jobId) => {
                const entry = authorityJobs.get(jobId);
                if (entry && entry.handle.cancel(reason)) count += 1;
            });
            return count;
        }

        function cancelScheduledJobsByScope(scope, reason = 'scope_cancelled') {
            return cancelIndexedAuthorityJobs(authorityJobsByScope, String(scope || 'default'), reason);
        }

        function abortScheduledJobsByScope(scope, reason = 'scheduler_aborted') {
            return cancelIndexedAuthorityJobs(authorityJobsByScope, String(scope || 'default'), reason);
        }

        function panicBlockScheduledJobsByScope(scope, reason = 'panic_blocked') {
            return cancelIndexedAuthorityJobs(authorityJobsByScope, String(scope || 'default'), reason);
        }

        function cancelScheduledJobsByRoot(rootId, reason = 'root_cancelled') {
            const safeRootId = normalizeRootId(rootId);
            return safeRootId ? cancelIndexedAuthorityJobs(authorityJobsByRoot, safeRootId, reason) : 0;
        }

        function getSchedulerStats() {
            const snapshot = schedulerAuthority.snapshot();
            return {
                scheduled: snapshot.telemetry.scheduled,
                executed: snapshot.telemetry.completed,
                failed: snapshot.telemetry.failed,
                aborted: snapshot.telemetry.aborted,
                panicBlocked: snapshot.telemetry.panicBlocked,
                cancelled: snapshot.telemetry.cancelled,
                staleScope: 0,
                staleRoot: 0,
                pending: snapshot.pendingJobIds.length + (snapshot.activeJobId ? 1 : 0),
                pressureLevel: snapshot.pressureLevel,
                averageWaitMs: 0,
                averageRunMs: 0,
                maxWaitMs: 0,
                maxRunMs: 0,
                byReason: {},
                byLane: {},
                pendingByLane: {},
                pendingByStrategy: {},
                scheduler: snapshot,
                diagnostics: snapshot,
                failures: [],
                history: []
            };
        }

        function listScheduledJobs() {
            return Array.from(authorityJobs.values()).map((entry) => {
                const snapshot = entry.handle.snapshot();
                return {
                    id: snapshot.id,
                    kind: snapshot.request.strategy,
                    lane: snapshot.request.lane,
                    strategy: snapshot.request.strategy,
                    effectivePriority: snapshot.request.priority,
                    priority: snapshot.request.priority,
                    scope: snapshot.request.scope,
                    rootId: snapshot.request.rootId,
                    rootVersion: 0,
                    status: snapshot.status,
                    scheduledAt: snapshot.createdAt,
                    pending: !['completed', 'failed', 'cancelled', 'aborted', 'panic_blocked'].includes(snapshot.status)
                };
            });
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
                    getPressureLevel: () => schedulerAuthority.snapshot().pressureLevel,
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
                scheduledJobCount: authorityJobsByRoot.has(rootState.id) ? authorityJobsByRoot.get(rootState.id).size : 0,
                resourceCount: rootState.resources ? rootState.resources.size : 0
            }));
        }

        function normalizeSchedulerLane(rawLane, requestedKind) {
            const lane = String(rawLane || '').trim();
            if (lane === 'critical_input') return 'user-blocking';
            if (lane === 'visible_commit' || lane === 'hydration_followup') return 'visible';
            if (lane === 'background_prepare') return 'background';
            if (lane === 'idle_maintenance') return 'idle';
            if (['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics'].includes(lane)) return lane;
            return requestedKind === 'after_paint' ? 'visible' : 'background';
        }

        function resolveSchedulingPlan(requestedKind, options = {}) {
            const safeKind = normalizeScheduledKind(requestedKind);
            const legacyLane = String(options.lane || '').trim();
            return {
                requestedKind: safeKind,
                lane: normalizeSchedulerLane(legacyLane, safeKind),
                legacyLane,
                executionStrategy: safeKind === 'after_paint'
                    ? 'after_paint'
                    : (options.preferIdle === true ? 'idle' : 'microtask'),
                delayMs: Number.isFinite(options.delayMs)
                    ? Math.max(options.delayMs, 0)
                    : (Number.isFinite(options.delay) ? Math.max(options.delay, 0) : 0),
                timeoutMs: Number.isFinite(options.timeoutMs)
                    ? Math.max(options.timeoutMs, 0)
                    : (Number.isFinite(options.timeout) ? Math.max(options.timeout, 0) : 0),
                priority: Number.isFinite(options.priority) ? options.priority : 50,
                budgetClass: String(options.budgetClass || '').trim() || normalizeSchedulerLane(legacyLane, safeKind),
                coalesceKey: String(options.coalesceKey || '').trim(),
                deadlineMs: Number.isFinite(options.deadlineMs) ? Math.max(options.deadlineMs, 0) : 0
            };
        }

        function schedule(scope, callback, options = {}) {
            const requestedKind = normalizeScheduledKind(options.kind || options.requestedKind || 'deferred');
            const plan = resolveSchedulingPlan(requestedKind, options);
            const legacyLane = plan.legacyLane;
            const lane = plan.lane;
            const safeScope = String(scope || 'default');
            const rootId = String(options.rootId || '').trim();
            const handle = schedulerAuthority.schedule({
                endpointName: String(options.endpointName || requestedKind || 'rmt.engine.work'),
                scope: safeScope,
                rootId,
                lane,
                priority: plan.priority,
                deadlineMs: plan.deadlineMs,
                timeoutMs: Number.isFinite(options.timeoutMs) ? Math.max(options.timeoutMs, 0) : 0,
                delayMs: plan.delayMs,
                budgetClass: plan.budgetClass,
                coalesceKey: plan.coalesceKey,
                strategy: plan.executionStrategy,
                metadata: {
                    ...(options.metadata && typeof options.metadata === 'object' ? options.metadata : {}),
                    requestedKind,
                    legacyLane: legacyLane || null
                }
            }, callback);
            return indexAuthorityHandle(handle, safeScope, rootId);
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
            const pressureLevel = sample && (sample.pressureLevel || sample.level)
                ? (sample.pressureLevel || sample.level)
                : schedulerAuthority.snapshot().pressureLevel;
            schedulerAuthority.updatePressure(pressureLevel);
            return schedulerAuthority.snapshot();
        }

        function getSchedulerDiagnostics() {
            return schedulerAuthority.snapshot();
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
            getScheduler: () => schedulerAuthority,
            getReactivity: () => reactivity,
            getSchedulerDiagnostics,
            getSchedulerPressureLevel: () => schedulerAuthority.snapshot().pressureLevel,
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

        return rmtApi;
    };

})(__XTENDRMT_GLOBAL__);
