/* modules/rmt-browser-runtime.js */
(function registerRmtBrowserRuntimeModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function isElementLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addEventListener === 'function'
            && typeof value.removeEventListener === 'function';
    }

    function isObjectLike(value) {
        return !!value && typeof value === 'object';
    }

    function cloneSerializable(value, fallbackValue = null) {
        if (value === undefined) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallbackValue;
        }
    }

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function'
            ? appModules[factoryName]
            : null;
    }

    function resolveDocumentTarget(deps, windowTarget) {
        if (deps && Object.prototype.hasOwnProperty.call(deps, 'documentTarget')) {
            return deps.documentTarget || null;
        }
        return (windowTarget && windowTarget.document) || null;
    }

    function normalizeDefaults(defaultsInput = {}, fallbackNamespace = '') {
        const source = isObjectLike(defaultsInput) ? defaultsInput : {};
        return Object.freeze({
            namespace: clampString(source.namespace || source.defaultNamespace, fallbackNamespace),
            metadata: cloneSerializable(source.metadata, {})
        });
    }

    function normalizeSchedulerLane(value, fallbackValue = 'visible') {
        const lane = clampString(value, fallbackValue);
        const legacy = {
            critical_input: 'user-blocking',
            visible_commit: 'visible',
            hydration_followup: 'visible',
            background_prepare: 'background',
            idle_maintenance: 'idle'
        };
        return legacy[lane] || lane;
    }

    function mergeRequestDefaults(requestInput = {}, runtimeDefaults = {}) {
        const request = isObjectLike(requestInput) ? { ...requestInput } : {};
        const defaults = isObjectLike(runtimeDefaults) ? runtimeDefaults : {};
        const mergedRequest = {
            ...defaults,
            ...request
        };
        mergedRequest.metadata = {
            ...(isObjectLike(defaults.metadata) ? defaults.metadata : {}),
            ...(isObjectLike(request.metadata) ? request.metadata : {})
        };
        if (!clampString(mergedRequest.namespace, '') && clampString(defaults.namespace, '')) {
            mergedRequest.namespace = defaults.namespace;
        }
        return mergedRequest;
    }

    function normalizeIslandInput(inputOrTarget, options = {}) {
        if (!isObjectLike(inputOrTarget) || isElementLike(inputOrTarget)) {
            return {
                input: inputOrTarget,
                options
            };
        }

        const rawInput = { ...inputOrTarget };
        if (!Object.prototype.hasOwnProperty.call(rawInput, 'target')) {
            return {
                input: rawInput,
                options
            };
        }

        const target = rawInput.target;
        delete rawInput.target;

        if (isElementLike(target) && rawInput.element === undefined) {
            rawInput.element = target;
        } else if (typeof target === 'string') {
            if (!rawInput.elementId && !rawInput.selector) {
                if (/^[#.[\]]/.test(target)) rawInput.selector = target;
                else rawInput.elementId = target;
            }
        } else if (isObjectLike(target)) {
            if (rawInput.element === undefined && isElementLike(target.element)) {
                rawInput.element = target.element;
            }
            if (!rawInput.elementId && clampString(target.elementId, '')) {
                rawInput.elementId = clampString(target.elementId, '');
            }
            if (!rawInput.selector && clampString(target.selector, '')) {
                rawInput.selector = clampString(target.selector, '');
            }
        }

        return {
            input: rawInput,
            options
        };
    }

    function isTemplateRequestLike(value) {
        return isObjectLike(value)
            && !isElementLike(value)
            && (
                Object.prototype.hasOwnProperty.call(value, 'template')
                || Object.prototype.hasOwnProperty.call(value, 'templateRef')
                || Object.prototype.hasOwnProperty.call(value, 'target')
                || Object.prototype.hasOwnProperty.call(value, 'chunk')
                || Object.prototype.hasOwnProperty.call(value, 'executionMode')
                || Object.prototype.hasOwnProperty.call(value, 'rootId')
            );
    }

    function buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults = {}) {
        if (isTemplateRequestLike(targetOrRequest)) {
            return {
                request: mergeRequestDefaults(targetOrRequest, runtimeDefaults),
                executionOptions: isObjectLike(templateRef) && model === undefined && options === undefined
                    ? { ...templateRef }
                    : (isObjectLike(options) ? { ...options } : {})
            };
        }

        return {
            request: mergeRequestDefaults({
                target: targetOrRequest,
                template: templateRef,
                model: model === undefined ? {} : model,
                ...(isObjectLike(options) ? options : {})
            }, runtimeDefaults),
            executionOptions: isObjectLike(options) ? { ...options } : {}
        };
    }

    function buildPrerenderInvocation(templateOrRequest, model, options, runtimeDefaults = {}) {
        if (isTemplateRequestLike(templateOrRequest)) {
            return {
                request: mergeRequestDefaults(templateOrRequest, runtimeDefaults),
                executionOptions: isObjectLike(model) && options === undefined
                    ? { ...model }
                    : (isObjectLike(options) ? { ...options } : {})
            };
        }
        return {
            request: mergeRequestDefaults({
                template: templateOrRequest,
                model: model === undefined ? {} : model,
                ...(isObjectLike(options) ? options : {})
            }, runtimeDefaults),
            executionOptions: isObjectLike(options) ? { ...options } : {}
        };
    }

    function isStorageLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.getItem === 'function'
            && typeof value.setItem === 'function'
            && typeof value.removeItem === 'function';
    }

    function createJsonStorageAdapter(options = {}) {
        const storageTarget = isStorageLike(options.storageTarget) ? options.storageTarget : null;
        const memoryStore = options.memoryStore instanceof Map ? options.memoryStore : new Map();

        function readJson(key, fallbackValue = null) {
            const safeKey = clampString(key, '');
            if (!safeKey) return fallbackValue;
            let rawValue = null;
            if (storageTarget) {
                try {
                    rawValue = storageTarget.getItem(safeKey);
                } catch (_error) {
                    rawValue = null;
                }
            }
            if (rawValue == null && memoryStore.has(safeKey)) {
                rawValue = memoryStore.get(safeKey);
            }
            if (rawValue == null) return fallbackValue;
            try {
                return JSON.parse(String(rawValue));
            } catch (_error) {
                return fallbackValue;
            }
        }

        function writeJson(key, value) {
            const safeKey = clampString(key, '');
            if (!safeKey) {
                return {
                    ok: false,
                    backend: 'memory',
                    persistentAvailable: false,
                    memoryFallbackActive: true
                };
            }
            const serialized = JSON.stringify(value);
            memoryStore.set(safeKey, serialized);
            if (storageTarget) {
                try {
                    storageTarget.setItem(safeKey, serialized);
                    return {
                        ok: true,
                        backend: 'localStorage',
                        persistentAvailable: true,
                        memoryFallbackActive: false
                    };
                } catch (_error) {
                    return {
                        ok: true,
                        backend: 'memory',
                        persistentAvailable: false,
                        memoryFallbackActive: true
                    };
                }
            }
            return {
                ok: true,
                backend: 'memory',
                persistentAvailable: false,
                memoryFallbackActive: true
            };
        }

        function remove(key) {
            const safeKey = clampString(key, '');
            if (!safeKey) return false;
            memoryStore.delete(safeKey);
            if (storageTarget) {
                try {
                    storageTarget.removeItem(safeKey);
                } catch (_error) {
                    return false;
                }
            }
            return true;
        }

        function getBackendInfo() {
            if (!storageTarget) {
                return {
                    backend: 'memory',
                    persistentAvailable: false,
                    memoryFallbackActive: true
                };
            }
            try {
                const probeKey = '__rmt_storage_probe__';
                storageTarget.setItem(probeKey, '1');
                storageTarget.removeItem(probeKey);
                return {
                    backend: 'localStorage',
                    persistentAvailable: true,
                    memoryFallbackActive: false
                };
            } catch (_error) {
                return {
                    backend: 'memory',
                    persistentAvailable: false,
                    memoryFallbackActive: true
                };
            }
        }

        return Object.freeze({
            readJson,
            writeJson,
            remove,
            getBackendInfo
        });
    }

    appModules.createRmtBrowserRuntime = function createRmtBrowserRuntime(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = resolveDocumentTarget(deps, windowTarget);
        const createRmtBrowserHostAdapterFactory = resolveFactory('createRmtBrowserHostAdapter', deps.createRmtBrowserHostAdapter);
        const createRmtCoreFactory = resolveFactory('createRmtCore', deps.createRmtCore);
        const createRmtPublicApiFactory = resolveFactory('createRmtPublicApi', deps.createRmtPublicApi);
        const createRmtPerformanceRuntimeFactory = resolveFactory('createRmtPerformanceRuntime', deps.createRmtPerformanceRuntime);
        const createRmtPrewarmWorkerRuntimeFactory = resolveFactory('createRmtPrewarmWorkerRuntime', deps.createRmtPrewarmWorkerRuntime);
        const createRmtTemplateApiFactory = resolveFactory('createRmtTemplateApi', deps.createRmtTemplateApi);

        if (typeof createRmtCoreFactory !== 'function') {
            throw new Error('RMT BrowserRuntime benoetigt createRmtCore().');
        }
        if (typeof createRmtPublicApiFactory !== 'function') {
            throw new Error('RMT BrowserRuntime benoetigt createRmtPublicApi().');
        }

        const hostAdapter = deps.hostAdapter
            || deps.browserHostAdapter
            || (typeof createRmtBrowserHostAdapterFactory === 'function'
                ? createRmtBrowserHostAdapterFactory({
                    windowTarget,
                    documentTarget
                })
                : null);
        if (!hostAdapter || typeof hostAdapter !== 'object') {
            throw new Error('RMT BrowserRuntime benoetigt einen gueltigen BrowserHostAdapter.');
        }

        const rmtCore = deps.core
            || deps.rmtCore
            || createRmtCoreFactory({
                ...deps,
                windowTarget,
                documentTarget,
                hostAdapter
            });
        const kernelScheduler = deps.scheduler
            || deps.kernelScheduler
            || (rmtCore && typeof rmtCore.getScheduler === 'function' ? rmtCore.getScheduler() : null)
            || (rmtCore && rmtCore.scheduler) || null;
        if (!kernelScheduler || typeof kernelScheduler.schedule !== 'function') {
            throw new Error('RMT BrowserRuntime benoetigt den injizierten Kernel-Scheduler.');
        }
        const publicApi = deps.publicApi
            || (typeof createRmtPublicApiFactory === 'function'
                ? createRmtPublicApiFactory({
                    ...deps,
                    windowTarget,
                    documentTarget,
                    hostAdapter,
                    rmtCore
                })
                : null);
        if (!publicApi || typeof publicApi.mountIsland !== 'function') {
            throw new Error('RMT BrowserRuntime benoetigt eine gueltige PublicApi.');
        }

        const templateApi = deps.templateApi
            || (typeof publicApi.getTemplateApi === 'function' ? publicApi.getTemplateApi() : null)
            || (typeof createRmtTemplateApiFactory === 'function'
                ? createRmtTemplateApiFactory({
                    ...deps,
                    windowTarget,
                    documentTarget,
                    hostAdapter,
                    rmtCore,
                    publicApi
                })
                : null);
        if (!templateApi || typeof templateApi.renderTemplate !== 'function') {
            throw new Error('RMT BrowserRuntime benoetigt eine gueltige TemplateApi.');
        }

        const uiCoprocessor = (() => {
            const source = deps.uiCoprocessor && typeof deps.uiCoprocessor === 'object' ? deps.uiCoprocessor : {};
            const mode = clampString(source.mode, 'opportunistic');
            const lifecycle = clampString(source.lifecycle, 'runtime');
            const maxQueueDepth = Math.max(Math.trunc(Number(source.maxQueueDepth) || 8), 1);
            return Object.freeze({
                enabled: deps.enableUiCoprocessor === true || source.enabled === true,
                mode: mode === 'alwaysOn' ? 'alwaysOn' : 'opportunistic',
                maxQueueDepth,
                stalePolicy: 'discard',
                lifecycle: lifecycle === 'app' ? 'app' : 'runtime'
            });
        })();
        const enablePrewarmWorker = deps.enablePrewarmWorker === true || uiCoprocessor.enabled;
        const prewarmWorkerEnabledBy = deps.enablePrewarmWorker === true
            ? 'prewarmWorker'
            : (uiCoprocessor.enabled ? 'uiCoprocessor' : 'none');
        let prewarmWorkerBootError = null;

        function resolvePrewarmWorkerMissingApis() {
            const missingApis = [];
            if (!windowTarget || !windowTarget.Blob) missingApis.push('Blob');
            if (!windowTarget || !windowTarget.Worker) missingApis.push('Worker');
            if (!windowTarget || !windowTarget.URL || typeof windowTarget.URL.createObjectURL !== 'function') missingApis.push('URL.createObjectURL');
            return missingApis;
        }

        function createPrewarmWorkerTopologyFallback(reason = 'disabled', error = null) {
            const missingApis = resolvePrewarmWorkerMissingApis();
            const health = reason === 'disabled'
                ? 'disabled'
                : (missingApis.length > 0 || error ? 'degraded' : 'available');
            return {
                schema: 'xtend.rmt.prewarm-worker-topology.v1',
                kind: 'rmt-prewarm',
                enabled: enablePrewarmWorker,
                enabledBy: prewarmWorkerEnabledBy,
                status: health,
                health,
                reason,
                workerName: deps.prewarmWorkerName || 'XTendRMTPrewarmWorker',
                workerType: deps.prewarmWorkerType || 'classic',
                instantiated: false,
                pendingJobs: 0,
                submittedJobs: 0,
                templatesSynced: 0,
                available: enablePrewarmWorker && missingApis.length === 0 && !error && typeof createRmtPrewarmWorkerRuntimeFactory === 'function',
                missingApis,
                lastHealthAt: 0,
                lastError: error ? {
                    name: error && error.name || 'Error',
                    message: error && error.message || String(error),
                    stack: error && typeof error.stack === 'string' ? error.stack : ''
                } : null,
                responsibilities: [
                    'template_prerender_compute',
                    'chunk_serialization',
                    'ui_compute',
                    'layout_precompute',
                    'analytics_precompute'
                ],
                supportedSignals: [
                    'start',
                    'continue',
                    'rebatch',
                    'compute',
                    'ui_compute',
                    'prerender',
                    'invalidate'
                ],
                excludedResponsibilities: [
                    'dom_mutation',
                    'event_binding',
                    'state_ownership'
                ],
                coprocessor: {
                    enabled: uiCoprocessor.enabled,
                    mode: uiCoprocessor.mode,
                    lifecycle: uiCoprocessor.lifecycle,
                    queueDepthMax: 0,
                    maxQueueDepth: uiCoprocessor.maxQueueDepth,
                    stalePolicy: uiCoprocessor.stalePolicy,
                    status: !uiCoprocessor.enabled ? 'disabled' : health,
                    pendingJobs: 0,
                    submittedJobs: 0,
                    transferBytes: 0,
                    staleResponses: 0,
                    supersededResponses: 0,
                    stateOwnership: 'main-thread',
                    trustedDomCommit: 'main-thread',
                    clientDetermined: true,
                    ssrRoundtripCount: 0
                },
                diagnostics: enablePrewarmWorker && typeof createRmtPrewarmWorkerRuntimeFactory !== 'function'
                    ? [{
                        schema: 'xtend.rmt.prewarm-worker-diagnostic.v1',
                        code: 'xtend.rmt.prewarm_worker.factory_missing',
                        severity: 'warning',
                        message: 'RMT Prewarm Worker wurde angefordert, aber keine Runtime-Factory ist verfuegbar.'
                    }]
                    : []
            };
        }

        const prewarmWorkerRuntime = deps.prewarmWorkerRuntime
            || deps.rmtPrewarmWorkerRuntime
            || (() => {
                if (!enablePrewarmWorker || typeof createRmtPrewarmWorkerRuntimeFactory !== 'function') return null;
                try {
                    return createRmtPrewarmWorkerRuntimeFactory({
                        ...deps,
                        windowTarget,
                        documentTarget,
                        templateApi,
                        workerName: deps.prewarmWorkerName || 'XTendRMTPrewarmWorker',
                        workerType: deps.prewarmWorkerType || 'classic',
                        enableUiCoprocessor: uiCoprocessor.enabled,
                        uiCoprocessor
                    });
                } catch (error) {
                    prewarmWorkerBootError = error;
                    return null;
                }
            })();

        const performanceHistoryStorage = deps.performanceHistoryStorage
            || deps.historyStorage
            || createJsonStorageAdapter({
                storageTarget: deps.performanceHistoryStorageTarget
                    || deps.historyStorageTarget
                    || (windowTarget && windowTarget.localStorage)
                    || null,
                memoryStore: deps.performanceHistoryMemoryStore instanceof Map
                    ? deps.performanceHistoryMemoryStore
                    : null
            });
        const performanceArtifactWriter = deps.performanceArtifactWriter
            || deps.artifactWriter
            || null;

        const performanceRuntime = deps.performanceRuntime
            || (typeof createRmtPerformanceRuntimeFactory === 'function'
                ? createRmtPerformanceRuntimeFactory({
                    ...deps,
                    windowTarget,
                    documentTarget,
                    hostAdapter,
                    rmtCore,
                    publicApi,
                    templateApi,
                    historyStorage: performanceHistoryStorage,
                    artifactWriter: performanceArtifactWriter,
                    runtimeKind: 'browser'
                })
                : null);

        const runtimeDefaults = normalizeDefaults(
            deps.defaults || {
                namespace: deps.namespace || deps.defaultNamespace,
                metadata: deps.metadata
            },
            clampString(deps.namespace || deps.defaultNamespace, '')
        );

        let workerAdapter = null;
        let serverAdapter = null;

        function createWorkerTransport(options = {}) {
            return templateApi.createWorkerAdapter({
                ...options,
                dispatchPrerenderEnvelope: typeof options.dispatchPrerenderEnvelope === 'function'
                    ? options.dispatchPrerenderEnvelope
                    : (
                        typeof deps.dispatchPrerenderEnvelope === 'function'
                            ? deps.dispatchPrerenderEnvelope
                            : (
                                prewarmWorkerRuntime && typeof prewarmWorkerRuntime.dispatchPrerenderEnvelope === 'function'
                                    ? prewarmWorkerRuntime.dispatchPrerenderEnvelope
                                    : undefined
                            )
                    ),
                windowTarget,
                documentTarget
            });
        }

        function createServerTransport(options = {}) {
            return templateApi.createServerAdapter({
                ...options,
                windowTarget,
                documentTarget
            });
        }

        function getWorkerTransport() {
            if (workerAdapter) return workerAdapter;
            workerAdapter = createWorkerTransport();
            return workerAdapter;
        }

        function getServerTransport() {
            if (serverAdapter) return serverAdapter;
            serverAdapter = createServerTransport();
            return serverAdapter;
        }

        function getPrewarmWorkerTopologySnapshot() {
            return prewarmWorkerRuntime && typeof prewarmWorkerRuntime.getTopologySnapshot === 'function'
                ? {
                    ...prewarmWorkerRuntime.getTopologySnapshot(),
                    enabledBy: prewarmWorkerEnabledBy
                }
                : createPrewarmWorkerTopologyFallback(
                    enablePrewarmWorker
                        ? (prewarmWorkerBootError ? 'boot_failed' : (typeof createRmtPrewarmWorkerRuntimeFactory === 'function' ? 'degraded' : 'factory_missing'))
                        : 'disabled',
                    prewarmWorkerBootError
                );
        }

        function getUiCoprocessorSnapshot() {
            const topology = getPrewarmWorkerTopologySnapshot();
            return topology && topology.coprocessor ? topology.coprocessor : createPrewarmWorkerTopologyFallback('disabled').coprocessor;
        }

        async function requestUiCompute(envelope = {}, options = {}) {
            if (!uiCoprocessor.enabled) {
                return {
                    ok: false,
                    status: 'disabled',
                    transport: 'main-thread',
                    reason: 'ui_coprocessor_disabled',
                    metadata: {
                        mainThreadCommitRequired: true,
                        trustedDomCommit: 'main-thread',
                        stateOwnership: 'main-thread',
                        clientDetermined: true,
                        ssrRoundtripCount: 0
                    }
                };
            }
            if (!prewarmWorkerRuntime || typeof prewarmWorkerRuntime.dispatchUiComputeEnvelope !== 'function') {
                return {
                    ok: false,
                    status: 'degraded',
                    transport: 'main-thread',
                    reason: 'ui_coprocessor_worker_unavailable',
                    topology: getPrewarmWorkerTopologySnapshot(),
                    metadata: {
                        mainThreadCommitRequired: true,
                        trustedDomCommit: 'main-thread',
                        stateOwnership: 'main-thread',
                        clientDetermined: true,
                        ssrRoundtripCount: 0
                    }
                };
            }
            return prewarmWorkerRuntime.dispatchUiComputeEnvelope(envelope, options);
        }

        function withDefaults(nextDefaults = {}) {
            return appModules.createRmtBrowserRuntime({
                ...deps,
                windowTarget,
                documentTarget,
                hostAdapter,
                rmtCore,
                publicApi,
                performanceRuntime,
                prewarmWorkerRuntime,
                templateApi,
                performanceHistoryStorage,
                enableUiCoprocessor: uiCoprocessor.enabled,
                uiCoprocessor,
                defaults: {
                    ...runtimeDefaults,
                    ...(isObjectLike(nextDefaults) ? nextDefaults : {}),
                    metadata: {
                        ...(isObjectLike(runtimeDefaults.metadata) ? runtimeDefaults.metadata : {}),
                        ...(isObjectLike(nextDefaults.metadata) ? nextDefaults.metadata : {})
                    }
                }
            });
        }

        const runtime = Object.freeze({
            apiVersion: rmtCore.apiVersion || publicApi.apiVersion || templateApi.apiVersion || '0.0.0',
            runtimeKind: 'browser',
            version: rmtCore.version || publicApi.version || templateApi.version || '0.0.0',
            defaults: runtimeDefaults,
            createServerAdapter: createServerTransport,
            createServerTransport,
            createWorkerAdapter: createWorkerTransport,
            createWorkerTransport,
            dispatchCommand: (commandName, payload = {}, options = {}) => publicApi.dispatchCommand(commandName, payload, options),
            execute: (targetOrRequest, templateRef, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults);
                return templateApi.executeTemplate(invocation.request, invocation.executionOptions);
            },
            executeTemplate: (targetOrRequest, templateRef, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults);
                return templateApi.executeTemplate(invocation.request, invocation.executionOptions);
            },
            getCapabilities: () => (typeof rmtCore.getCapabilities === 'function' ? rmtCore.getCapabilities() : {}),
            getCore: () => rmtCore,
            getDefaults: () => runtimeDefaults,
            getCompiler: () => (typeof templateApi.getCompiler === 'function' ? templateApi.getCompiler() : null),
            getExecutionPath: () => (typeof templateApi.getExecutionPath === 'function' ? templateApi.getExecutionPath() : null),
            getHostAdapter: () => hostAdapter,
            getHostContract: () => (typeof publicApi.getHostContract === 'function' ? publicApi.getHostContract() : {}),
            getManifest: () => (
                typeof publicApi.getManifest === 'function'
                    ? publicApi.getManifest()
                    : (typeof rmtCore.getManifest === 'function' ? rmtCore.getManifest() : null)
            ),
            getPublicApi: () => publicApi,
            getRmt: () => (typeof publicApi.getRmt === 'function' ? publicApi.getRmt() : rmtCore.rmt),
            getRuntimeRenderer: () => (typeof templateApi.getRuntimeRenderer === 'function' ? templateApi.getRuntimeRenderer() : null),
            getPerformanceRuntime: () => performanceRuntime,
            getScheduler: () => kernelScheduler,
            getPrewarmWorkerRuntime: () => prewarmWorkerRuntime,
            getPrewarmWorkerTopology: getPrewarmWorkerTopologySnapshot,
            getUiCoprocessorSnapshot,
            requestUiCompute,
            dispatchUiComputeEnvelope: requestUiCompute,
            terminatePrewarmWorker: (reason = 'runtime_terminate') => (
                prewarmWorkerRuntime && typeof prewarmWorkerRuntime.terminateWorker === 'function'
                    ? prewarmWorkerRuntime.terminateWorker(reason)
                    : false
            ),
            terminateUiCoprocessor: (reason = 'ui_coprocessor_terminate') => (
                prewarmWorkerRuntime && typeof prewarmWorkerRuntime.terminateWorker === 'function'
                    ? prewarmWorkerRuntime.terminateWorker(reason)
                    : false
            ),
            getPerformanceSnapshot: (reason = 'read') => (
                performanceRuntime && typeof performanceRuntime.getSnapshot === 'function'
                    ? performanceRuntime.getSnapshot(reason)
                    : null
            ),
            getBrowserSignalSnapshot: (reason = 'read') => (
                performanceRuntime && typeof performanceRuntime.getBrowserSignalSnapshot === 'function'
                    ? performanceRuntime.getBrowserSignalSnapshot(reason)
                    : null
            ),
            getBackpressureProfile: (reason = 'read') => (
                performanceRuntime && typeof performanceRuntime.getBackpressureProfile === 'function'
                    ? performanceRuntime.getBackpressureProfile(reason)
                    : null
            ),
            sampleBrowserNativeState: (reason = 'manual', options = {}) => (
                performanceRuntime && typeof performanceRuntime.sampleBrowserNativeState === 'function'
                    ? performanceRuntime.sampleBrowserNativeState(reason, options)
                    : null
            ),
            startBrowserSignalCollection: (options = {}) => (
                performanceRuntime && typeof performanceRuntime.startBrowserSignalCollection === 'function'
                    ? performanceRuntime.startBrowserSignalCollection(options)
                    : null
            ),
            stopBrowserSignalCollection: (reason = 'manual') => (
                performanceRuntime && typeof performanceRuntime.stopBrowserSignalCollection === 'function'
                    ? performanceRuntime.stopBrowserSignalCollection(reason)
                    : null
            ),
            recordBrowserSignalSample: (sample = {}, options = {}) => (
                performanceRuntime && typeof performanceRuntime.recordBrowserSignalSample === 'function'
                    ? performanceRuntime.recordBrowserSignalSample(sample, options)
                    : null
            ),
            evaluatePerformanceBudget: (endpointName, sample = {}, options = {}) => (
                performanceRuntime && typeof performanceRuntime.evaluateBudget === 'function'
                    ? performanceRuntime.evaluateBudget(endpointName, sample, options)
                    : null
            ),
            evaluatePerformanceBudgets: (reasonOrOptions = 'read', maybeOptions = {}) => (
                performanceRuntime && typeof performanceRuntime.evaluateBudgets === 'function'
                    ? performanceRuntime.evaluateBudgets(reasonOrOptions, maybeOptions)
                    : null
            ),
            exportPerformanceRunReport: (reasonOrOptions = 'export', maybeOptions = {}) => (
                performanceRuntime && typeof performanceRuntime.exportRunReport === 'function'
                    ? performanceRuntime.exportRunReport(reasonOrOptions, maybeOptions)
                    : null
            ),
            comparePerformanceRunReports: (baseReport, targetReport, options = {}) => (
                performanceRuntime && typeof performanceRuntime.compareRunReports === 'function'
                    ? performanceRuntime.compareRunReports(baseReport, targetReport, options)
                    : null
            ),
            createPerformanceBaseline: (reportInputs = [], options = {}) => (
                performanceRuntime && typeof performanceRuntime.createRunBaseline === 'function'
                    ? performanceRuntime.createRunBaseline(reportInputs, options)
                    : null
            ),
            createPerformanceTrendSeries: (reportInputs = [], options = {}) => (
                performanceRuntime && typeof performanceRuntime.createTrendSeries === 'function'
                    ? performanceRuntime.createTrendSeries(reportInputs, options)
                    : null
            ),
            comparePerformanceReportToBaseline: (report, baseline, options = {}) => (
                performanceRuntime && typeof performanceRuntime.compareRunReportToBaseline === 'function'
                    ? performanceRuntime.compareRunReportToBaseline(report, baseline, options)
                    : null
            ),
            createPerformanceHarnessOutput: (reasonOrOptions = 'harness_export', maybeOptions = {}) => (
                performanceRuntime && typeof performanceRuntime.createHarnessOutput === 'function'
                    ? performanceRuntime.createHarnessOutput(reasonOrOptions, maybeOptions)
                    : null
            ),
            createPerformanceBatchSeries: (outputInputs = [], options = {}) => (
                performanceRuntime && typeof performanceRuntime.createBatchSeries === 'function'
                    ? performanceRuntime.createBatchSeries(outputInputs, options)
                    : null
            ),
            createPerformanceNightlyTrendlines: (outputInputs = [], options = {}) => (
                performanceRuntime && typeof performanceRuntime.createNightlyTrendlines === 'function'
                    ? performanceRuntime.createNightlyTrendlines(outputInputs, options)
                    : null
            ),
            createPerformanceCiSummary: (sourceOrOptions = {}, maybeOptions = {}) => (
                performanceRuntime && typeof performanceRuntime.createCiSummary === 'function'
                    ? performanceRuntime.createCiSummary(sourceOrOptions, maybeOptions)
                    : null
            ),
            exportPerformanceFileArtifact: (sourceOrOptions = {}, maybeOptions = {}) => (
                performanceRuntime && typeof performanceRuntime.createFileArtifact === 'function'
                    ? performanceRuntime.createFileArtifact(sourceOrOptions, maybeOptions)
                    : null
            ),
            writePerformanceArtifact: (artifactOrSource = {}, options = {}) => (
                performanceRuntime && typeof performanceRuntime.writeArtifact === 'function'
                    ? performanceRuntime.writeArtifact(artifactOrSource, options)
                    : null
            ),
            publishPerformanceArtifactToTarget: async (artifactOrSource = {}, options = {}) => (
                performanceRuntime && typeof performanceRuntime.publishArtifactToTarget === 'function'
                    ? performanceRuntime.publishArtifactToTarget(artifactOrSource, options)
                    : null
            ),
            writePerformanceBatchArtifacts: (seriesOrOutputs = [], options = {}) => (
                performanceRuntime && typeof performanceRuntime.writeBatchArtifacts === 'function'
                    ? performanceRuntime.writeBatchArtifacts(seriesOrOutputs, options)
                    : null
            ),
            publishPerformanceBatchToTarget: async (seriesOrOutputs = [], options = {}) => (
                performanceRuntime && typeof performanceRuntime.publishBatchToTarget === 'function'
                    ? performanceRuntime.publishBatchToTarget(seriesOrOutputs, options)
                    : null
            ),
            writePerformanceCiSummary: (summaryOrSource = {}, options = {}) => (
                performanceRuntime && typeof performanceRuntime.writeCiSummary === 'function'
                    ? performanceRuntime.writeCiSummary(summaryOrSource, options)
                    : null
            ),
            persistPerformanceHarnessOutput: (outputOrReason = 'harness_export', maybeOptions = {}) => (
                performanceRuntime && typeof performanceRuntime.persistHarnessOutput === 'function'
                    ? performanceRuntime.persistHarnessOutput(outputOrReason, maybeOptions)
                    : null
            ),
            exportStoredPerformanceHistory: (options = {}) => (
                performanceRuntime && typeof performanceRuntime.exportPersistedHistory === 'function'
                    ? performanceRuntime.exportPersistedHistory(options)
                    : null
            ),
            listStoredPerformanceHarnessOutputs: (limit) => (
                performanceRuntime && typeof performanceRuntime.listPersistedHarnessOutputs === 'function'
                    ? performanceRuntime.listPersistedHarnessOutputs(limit)
                    : []
            ),
            clearStoredPerformanceHistory: () => (
                performanceRuntime && typeof performanceRuntime.clearPersistedHistory === 'function'
                    ? performanceRuntime.clearPersistedHistory()
                    : true
            ),
            getPerformanceHistoryStorageStatus: () => (
                performanceRuntime && typeof performanceRuntime.getHistoryStorageStatus === 'function'
                    ? performanceRuntime.getHistoryStorageStatus()
                    : null
            ),
            runPerformanceBatchHarness: (runInputs = [], runner, options = {}) => (
                performanceRuntime && typeof performanceRuntime.runBatchHarness === 'function'
                    ? performanceRuntime.runBatchHarness(runInputs, runner, options)
                    : Promise.resolve(null)
            ),
            runPerformanceAutomationHarness: (runInputs = [], automationAdapter, options = {}) => (
                performanceRuntime && typeof performanceRuntime.runAutomationHarness === 'function'
                    ? performanceRuntime.runAutomationHarness(runInputs, automationAdapter, options)
                    : Promise.resolve(null)
            ),
            getTemplateArtifacts: () => (typeof templateApi.getArtifactApi === 'function' ? templateApi.getArtifactApi() : null),
            getServerAdapter: getServerTransport,
            getServerTransport,
            getTemplateApi: () => templateApi,
            getWorkerAdapter: getWorkerTransport,
            getWorkerTransport,
            listPerformanceBudgets: () => (
                performanceRuntime && typeof performanceRuntime.listBudgetProfiles === 'function'
                    ? performanceRuntime.listBudgetProfiles()
                    : []
            ),
            listPerformanceMeasurementPhases: () => (
                performanceRuntime && typeof performanceRuntime.listMeasurementPhases === 'function'
                    ? performanceRuntime.listMeasurementPhases()
                    : []
            ),
            listPerformanceProfiles: () => (
                performanceRuntime && typeof performanceRuntime.listEndpointProfiles === 'function'
                    ? performanceRuntime.listEndpointProfiles()
                    : []
            ),
            hostKind: hostAdapter.hostKind || 'browser_dom',
            hydrate: (targetOrInput, options = {}) => {
                const normalized = normalizeIslandInput(targetOrInput, options);
                return publicApi.hydrateIsland(normalized.input, normalized.options);
            },
            hydrateTemplate: (targetOrRequest, templateRef, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults);
                return templateApi.hydrateTemplate(invocation.request, invocation.executionOptions);
            },
            invalidate: (islandRef) => publicApi.invalidateIsland(islandRef),
            listDocuments: () => (typeof templateApi.listDocuments === 'function' ? templateApi.listDocuments() : []),
            listIslands: () => (typeof publicApi.listIslands === 'function' ? publicApi.listIslands() : []),
            listSupportedBindingKinds: () => (typeof templateApi.listSupportedBindingKinds === 'function' ? templateApi.listSupportedBindingKinds() : []),
            listSupportedExecutionModes: () => (typeof templateApi.listSupportedExecutionModes === 'function' ? templateApi.listSupportedExecutionModes() : []),
            listSupportedHydrationModes: () => (typeof templateApi.listSupportedHydrationModes === 'function' ? templateApi.listSupportedHydrationModes() : []),
            listSupportedSlotKinds: () => (typeof templateApi.listSupportedSlotKinds === 'function' ? templateApi.listSupportedSlotKinds() : []),
            listTrustVerdicts: () => (typeof templateApi.listTrustVerdicts === 'function' ? templateApi.listTrustVerdicts() : []),
            getPanicSnapshot: () => (typeof templateApi.getPanicSnapshot === 'function' ? templateApi.getPanicSnapshot() : null),
            listPanicEvents: () => (typeof templateApi.listPanicEvents === 'function' ? templateApi.listPanicEvents() : []),
            listSafeSnapshots: () => (typeof templateApi.listSafeSnapshots === 'function' ? templateApi.listSafeSnapshots() : []),
            listRecoveryOutcomes: () => (typeof templateApi.listRecoveryOutcomes === 'function' ? templateApi.listRecoveryOutcomes() : []),
            listQuarantinedScopes: () => (typeof templateApi.listQuarantinedScopes === 'function' ? templateApi.listQuarantinedScopes() : []),
            listPanicRecoveryRecords: () => (typeof templateApi.listPanicRecoveryRecords === 'function' ? templateApi.listPanicRecoveryRecords() : []),
            getPanicRecoverySnapshot: () => (typeof templateApi.getPanicRecoverySnapshot === 'function' ? templateApi.getPanicRecoverySnapshot() : {
                schema: 'xtend.rmt.kernel-panic-recovery-snapshot.v1',
                lane: 'diagnostics',
                trustVerdictCount: 0,
                blockedTrustVerdictCount: 0,
                panicEventCount: 0,
                recoveryOutcomeCount: 0,
                safeSnapshotCount: 0,
                quarantineScopeCount: 0,
                panicState: 'none',
                recoveryStatus: 'none',
                quarantineScopes: [],
                panicSnapshot: null
            }),
            listTemplates: () => (typeof templateApi.listTemplates === 'function' ? templateApi.listTemplates() : []),
            prepareDocument: (documentInput, options = {}) => templateApi.prepareDocument(documentInput, options),
            prepareTemplate: (templateRef, options = {}) => templateApi.prepareTemplate(templateRef, {
                namespace: runtimeDefaults.namespace,
                ...options
            }),
            loadDocument: (source, options = {}) => templateApi.loadRmtDocument(source, options),
            loadRmtDocument: (source, options = {}) => templateApi.loadRmtDocument(source, options),
            loadTemplateSource: (source, options = {}) => templateApi.loadTemplateSource(source, options),
            mount: (targetOrInput, options = {}) => {
                const normalized = normalizeIslandInput(targetOrInput, options);
                return publicApi.mountIsland(normalized.input, normalized.options);
            },
            observe: (targetOrInput, options = {}) => {
                const normalized = normalizeIslandInput(targetOrInput, options);
                return publicApi.observeIsland(normalized.input, normalized.options);
            },
            prerender: (templateOrRequest, model, options) => {
                const invocation = buildPrerenderInvocation(templateOrRequest, model, options, runtimeDefaults);
                return templateApi.prerenderTemplate(invocation.request, invocation.executionOptions);
            },
            prerenderTemplate: (templateOrRequest, model, options) => {
                const invocation = buildPrerenderInvocation(templateOrRequest, model, options, runtimeDefaults);
                return templateApi.prerenderTemplate(invocation.request, invocation.executionOptions);
            },
            prerenderPrepared: (preparedTemplateOrRequest, model, options) => {
                const invocation = buildPrerenderInvocation(preparedTemplateOrRequest, model, options, runtimeDefaults);
                return templateApi.prerenderTemplate(invocation.request, invocation.executionOptions);
            },
            createArtifactBundle: (documentInputs = [], options = {}) => templateApi.createArtifactBundle(documentInputs, options),
            registerDocument: (documentInput, options = {}) => templateApi.registerDocument(documentInput, options),
            registerArtifactBundle: (bundleInput, options = {}) => templateApi.registerArtifactBundle(bundleInput, options),
            registerTemplate: (templateInput, options = {}) => templateApi.registerTemplate(templateInput, options),
            resolvePerformancePlan: (endpointName, options = {}) => (
                performanceRuntime && typeof performanceRuntime.resolveEndpointPlan === 'function'
                    ? performanceRuntime.resolveEndpointPlan(endpointName, options)
                    : null
            ),
            resolvePerformanceBudget: (endpointName, options = {}) => (
                performanceRuntime && typeof performanceRuntime.resolveBudgetProfile === 'function'
                    ? performanceRuntime.resolveBudgetProfile(endpointName, options)
                    : null
            ),
            render: (targetOrRequest, templateRef, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults);
                return templateApi.renderTemplate(invocation.request, invocation.executionOptions);
            },
            renderPrepared: (targetOrRequest, preparedTemplate, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, preparedTemplate, model, options, runtimeDefaults);
                return templateApi.renderTemplate(invocation.request, invocation.executionOptions);
            },
            renderTemplate: (targetOrRequest, templateRef, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults);
                return templateApi.renderTemplate(invocation.request, invocation.executionOptions);
            },
            hydratePrepared: (targetOrRequest, preparedTemplate, model, options) => {
                const invocation = buildTemplateInvocation(targetOrRequest, preparedTemplate, model, options, runtimeDefaults);
                return templateApi.hydrateTemplate(invocation.request, invocation.executionOptions);
            },
            resolvePreparedTemplate: (templateRef, options = {}) => templateApi.resolvePreparedTemplate(templateRef, {
                namespace: runtimeDefaults.namespace,
                ...options
            }),
            resolveTemplate: (templateRef, options = {}) => templateApi.resolveTemplate(templateRef, {
                namespace: runtimeDefaults.namespace,
                ...options
            }),
            runEndpoint: (endpointName, callback, options = {}) => (
                performanceRuntime && typeof performanceRuntime.runEndpoint === 'function'
                    ? performanceRuntime.runEndpoint(endpointName, callback, options)
                    : callback(null)
            ),
            scheduleEndpoint: (endpointName, scope, callback, options = {}) => kernelScheduler.schedule({
                endpointName,
                scope: String(scope || 'default').trim() || 'default',
                rootId: options.rootId,
                lane: normalizeSchedulerLane(options.lane, 'visible'),
                priority: options.priority,
                deadlineMs: options.deadlineMs,
                timeoutMs: options.timeoutMs,
                delayMs: options.delayMs,
                budgetClass: options.budgetClass,
                maxChunkMs: options.maxChunkMs,
                coalesceKey: options.coalesceKey,
                strategy: options.strategy,
                metadata: options.metadata
            }, callback),
            unmount: (islandRef, options = {}) => {
                const shouldTerminatePrewarmWorker = options && (options.hard === true || options.appUnmount === true || options.disposeRoot === true);
                try {
                    return publicApi.unmountIsland(islandRef, options);
                } finally {
                    if (shouldTerminatePrewarmWorker && prewarmWorkerRuntime && typeof prewarmWorkerRuntime.terminateWorker === 'function') {
                        prewarmWorkerRuntime.terminateWorker('hard_unmount');
                    }
                }
            },
            disposeRoot: (rootId, options = {}) => {
                if (prewarmWorkerRuntime && typeof prewarmWorkerRuntime.terminateWorker === 'function') {
                    prewarmWorkerRuntime.terminateWorker('root_dispose');
                }
                return rmtCore && typeof rmtCore.disposeRoot === 'function'
                    ? rmtCore.disposeRoot(rootId, options)
                    : false;
            },
            dispose: (options = {}) => {
                const prewarmWorkerTerminated = prewarmWorkerRuntime && typeof prewarmWorkerRuntime.terminateWorker === 'function'
                    ? prewarmWorkerRuntime.terminateWorker('runtime_dispose')
                    : false;
                const coreDisposed = rmtCore && typeof rmtCore.dispose === 'function'
                    ? rmtCore.dispose(options)
                    : false;
                return {
                    schema: 'xtend.rmt.browser-runtime-dispose.v1',
                    ok: true,
                    prewarmWorkerTerminated,
                    coreDisposed
                };
            },
            withDefaults
        });

        return runtime;
    };
})(__XTENDRMT_GLOBAL__);
