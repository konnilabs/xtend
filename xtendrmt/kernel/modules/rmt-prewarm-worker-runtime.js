/* modules/rmt-prewarm-worker-runtime.js */
(function registerRmtPrewarmWorkerRuntimeModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    function normalizeTextValue(value, fallback = '') {
        const normalized = String(value == null ? fallback : value).trim();
        return normalized || String(fallback || '').trim();
    }

    function normalizeWorkerType(value, fallback = 'classic') {
        const normalized = normalizeTextValue(value, fallback).toLowerCase();
        return normalized === 'module' || normalized === 'classic'
            ? normalized
            : fallback;
    }

    function cloneSerializable(value, fallback = null) {
        if (value === undefined) return fallback;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallback;
        }
    }

    function serializeError(error) {
        return {
            name: normalizeTextValue(error && error.name, 'Error'),
            message: normalizeTextValue(error && error.message, 'Unbekannter RmtPrewarmWorker-Fehler.'),
            stack: error && typeof error.stack === 'string' ? error.stack : ''
        };
    }

    function normalizeNumber(value, fallback = 0) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : fallback;
    }

    function normalizeInteger(value, fallback = 0) {
        return Math.max(Math.trunc(normalizeNumber(value, fallback)), 0);
    }

    function normalizeUiCoprocessorOptions(input = {}, enabled = false) {
        const source = input && typeof input === 'object' ? input : {};
        const requested = enabled || source.enabled === true;
        const mode = normalizeTextValue(source.mode, 'opportunistic');
        const lifecycle = normalizeTextValue(source.lifecycle, 'runtime');
        return Object.freeze({
            enabled: requested,
            mode: mode === 'alwaysOn' ? 'alwaysOn' : 'opportunistic',
            maxQueueDepth: normalizeInteger(source.maxQueueDepth, 8) || 8,
            stalePolicy: 'discard',
            lifecycle: lifecycle === 'app' ? 'app' : 'runtime'
        });
    }

    function measureTransferBytes(value) {
        try {
            return JSON.stringify(value == null ? null : value).length;
        } catch (_error) {
            return 0;
        }
    }

    appModules.createRmtPrewarmWorkerRuntime = function createRmtPrewarmWorkerRuntime(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const templateApi = deps.templateApi && typeof deps.templateApi === 'object'
            ? deps.templateApi
            : (typeof deps.getTemplateApi === 'function' ? deps.getTemplateApi() : null);
        const buildWorkerSource = typeof deps.buildWorkerSource === 'function'
            ? deps.buildWorkerSource
            : (() => {
                const sourceBuilderFactory = typeof appModules.createRmtPrewarmWorkerSourceBuilder === 'function'
                    ? appModules.createRmtPrewarmWorkerSourceBuilder
                    : (typeof deps.createRmtPrewarmWorkerSourceBuilder === 'function'
                        ? deps.createRmtPrewarmWorkerSourceBuilder
                        : (typeof appModules.createRmtPrewarmWorkerSourceBuilder === 'function'
                            ? appModules.createRmtPrewarmWorkerSourceBuilder
                            : deps.createRmtPrewarmWorkerSourceBuilder));
                if (typeof sourceBuilderFactory !== 'function') {
                    throw new Error('RMT PrewarmWorkerRuntime benoetigt createRmtPrewarmWorkerSourceBuilder().');
                }
                return sourceBuilderFactory(deps).buildSource();
            });
        const BlobCtor = deps.blobCtor || windowTarget.Blob || null;
        const WorkerCtor = deps.workerCtor || windowTarget.Worker || null;
        const urlApi = deps.urlApi || windowTarget.URL || null;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => Date.now());
        const workerName = normalizeTextValue(deps.workerName, 'XTendRMTPrewarmWorker');
        const workerType = normalizeWorkerType(deps.workerType, 'classic');
        const uiCoprocessor = normalizeUiCoprocessorOptions(deps.uiCoprocessor, deps.enableUiCoprocessor === true);

        let worker = null;
        let workerUrl = '';
        let taskCounter = 0;
        let submittedJobs = 0;
        let queueDepthMax = 0;
        let transferBytes = 0;
        let staleResponseCount = 0;
        let supersededResponseCount = 0;
        let uiComputeSequence = 0;
        let syncedTemplateSignature = '';
        let syncedTemplateCount = 0;
        let lastHealthAt = 0;
        let lastError = null;
        let paused = false;
        let pauseReason = '';
        let invalidationCount = 0;
        const latestUiComputeGenerationByKey = new Map();
        const taskResolvers = new Map();

        function getMissingApis() {
            const missingApis = [];
            if (!BlobCtor) missingApis.push('Blob');
            if (!WorkerCtor) missingApis.push('Worker');
            if (!urlApi || typeof urlApi.createObjectURL !== 'function') missingApis.push('URL.createObjectURL');
            return missingApis;
        }

        function createWorkerOptions(type = workerType) {
            return {
                name: workerName,
                type: normalizeWorkerType(type, workerType)
            };
        }

        function createNamedWorker(nextWorkerUrl) {
            let primaryError = null;
            try {
                return new WorkerCtor(nextWorkerUrl, createWorkerOptions(workerType));
            } catch (error) {
                primaryError = error;
            }

            if (workerType === 'module') {
                try {
                    return new WorkerCtor(nextWorkerUrl, createWorkerOptions('classic'));
                } catch (_error) {
                    // fall through to name-only and legacy worker construction
                }
            }

            try {
                return new WorkerCtor(nextWorkerUrl, { name: workerName });
            } catch (_error) {
                // fall through to legacy worker construction
            }

            try {
                return new WorkerCtor(nextWorkerUrl);
            } catch (error) {
                throw primaryError || error;
            }
        }

        function revokeWorkerUrl() {
            if (!workerUrl || !urlApi || typeof urlApi.revokeObjectURL !== 'function') return;
            try {
                urlApi.revokeObjectURL(workerUrl);
            } catch (_error) {
                // ignore revoke failures
            }
            workerUrl = '';
        }

        function rejectPendingTasks(error) {
            taskResolvers.forEach((resolver) => {
                resolver.reject(error);
            });
            taskResolvers.clear();
        }

        function terminateWorker(reason = 'terminated') {
            if (taskResolvers.size > 0) {
                const error = new Error(`RmtPrewarmWorker wurde beendet: ${normalizeTextValue(reason, 'terminated')}.`);
                lastError = serializeError(error);
                rejectPendingTasks(error);
            }
            if (worker && typeof worker.terminate === 'function') {
                worker.terminate();
            }
            worker = null;
            syncedTemplateSignature = '';
            syncedTemplateCount = 0;
            revokeWorkerUrl();
            return true;
        }

        function getWorker() {
            if (worker) return worker;
            if (getMissingApis().length > 0) {
                throw new Error('RmtPrewarmWorker benoetigt WebWorker-, Blob- und URL-APIs.');
            }
            const source = buildWorkerSource();
            const blob = new BlobCtor([source], { type: 'application/javascript' });
            workerUrl = urlApi.createObjectURL(blob);
            worker = createNamedWorker(workerUrl);
            worker.onmessage = function handleWorkerMessage(event) {
                const message = event && event.data && typeof event.data === 'object' ? event.data : {};
                const resolver = taskResolvers.get(message.id);
                if (!resolver) return;
                taskResolvers.delete(message.id);
                transferBytes += measureTransferBytes(message.result !== undefined ? message.result : message);
                if (message.ok === false) {
                    const error = new Error(message.error && message.error.message ? message.error.message : 'RmtPrewarmWorker-Task ist fehlgeschlagen.');
                    error.workerError = message.error || serializeError(error);
                    lastError = serializeError(error);
                    resolver.reject(error);
                    return;
                }
                resolver.resolve(message.result);
            };
            worker.onerror = function handleWorkerError(event) {
                const error = new Error(event && event.message ? event.message : 'RmtPrewarmWorker konnte nicht ausgefuehrt werden.');
                lastError = serializeError(error);
                rejectPendingTasks(error);
                terminateWorker();
            };
            return worker;
        }

        function postWorkerMessage(action, payload = {}, transferables = []) {
            if (paused) {
                const error = new Error(`RmtPrewarmWorker ist pausiert: ${pauseReason || 'backpressure'}.`);
                error.code = 'xtend.rmt.prewarm_worker.paused';
                return Promise.reject(error);
            }
            const currentWorker = getWorker();
            const id = ++taskCounter;
            submittedJobs += 1;
            transferBytes += measureTransferBytes({
                id,
                action,
                ...payload
            });
            return new Promise((resolve, reject) => {
                taskResolvers.set(id, {
                    resolve,
                    reject
                });
                queueDepthMax = Math.max(queueDepthMax, taskResolvers.size);
                try {
                    currentWorker.postMessage({
                        id,
                        action,
                        ...payload
                    }, Array.isArray(transferables) ? transferables : []);
                } catch (error) {
                    taskResolvers.delete(id);
                    lastError = serializeError(error);
                    reject(error);
                }
            });
        }

        function getTemplateSnapshot() {
            if (!templateApi || typeof templateApi.listTemplates !== 'function') return [];
            return templateApi.listTemplates()
                .map((template) => cloneSerializable(template, null))
                .filter(Boolean);
        }

        function buildTemplateSignature(templates = []) {
            return (Array.isArray(templates) ? templates : [])
                .map((template) => [
                    normalizeTextValue(template && template.qualifiedId, ''),
                    normalizeTextValue(template && template.documentId, ''),
                    String(template && template.markup ? template.markup.length : 0),
                    String(Array.isArray(template && template.bindings) ? template.bindings.length : 0),
                    String(Array.isArray(template && template.slots) ? template.slots.length : 0)
                ].join(':'))
                .sort()
                .join('|');
        }

        async function syncTemplates(options = {}) {
            const templates = Array.isArray(options.templates)
                ? options.templates.map((entry) => cloneSerializable(entry, null)).filter(Boolean)
                : getTemplateSnapshot();
            const signature = buildTemplateSignature(templates);
            if (options.force !== true && signature && signature === syncedTemplateSignature) {
                return {
                    status: 'already_synced',
                    templateCount: syncedTemplateCount
                };
            }
            const result = await postWorkerMessage('sync_templates', {
                templates
            });
            syncedTemplateSignature = signature;
            syncedTemplateCount = Number(result && result.templateCount) || templates.length;
            lastHealthAt = now();
            return result;
        }

        async function dispatchPrerenderEnvelope(envelope, options = {}) {
            await syncTemplates({
                force: options.forceTemplateSync === true
            });
            const result = await postWorkerMessage('prerender', {
                envelope: cloneSerializable(envelope, {})
            });
            lastHealthAt = now();
            return result;
        }

        function normalizeUiComputeEnvelope(envelope = {}, options = {}) {
            const source = cloneSerializable(envelope, {});
            const metadata = source.metadata && typeof source.metadata === 'object'
                ? source.metadata
                : {};
            const hydrationKey = normalizeTextValue(
                options.hydrationKey
                || options.supersessionKey
                || source.hydrationKey
                || source.supersessionKey
                || metadata.hydrationKey
                || metadata.supersessionKey
                || source.rootId,
                ''
            );
            const generation = normalizeTextValue(
                options.generation
                || options.hydrationGeneration
                || options.currentGeneration
                || source.generation
                || source.hydrationGeneration
                || metadata.generation
                || metadata.hydrationGeneration
                || (hydrationKey ? String(++uiComputeSequence) : ''),
                ''
            );
            const nextMetadata = {
                ...metadata,
                mainThreadCommitRequired: true,
                trustedDomCommit: 'main-thread',
                stateOwnership: 'main-thread',
                clientDetermined: metadata.clientDetermined !== false,
                ssrRoundtripCount: 0
            };
            if (hydrationKey) nextMetadata.hydrationKey = hydrationKey;
            if (generation) nextMetadata.generation = generation;
            if (generation) nextMetadata.hydrationGeneration = generation;
            return {
                hydrationKey,
                generation,
                envelope: {
                    ...source,
                    action: 'ui_compute',
                    metadata: nextMetadata
                }
            };
        }

        function normalizeUiComputeResponse(result, requestInfo, superseded = false) {
            const response = cloneSerializable(result, {});
            const metadata = response.metadata && typeof response.metadata === 'object'
                ? response.metadata
                : {};
            if (superseded) {
                response.ok = false;
                response.status = 'superseded';
                response.superseded = true;
            }
            response.metadata = {
                ...metadata,
                mainThreadCommitRequired: true,
                trustedDomCommit: 'main-thread',
                stateOwnership: 'main-thread',
                clientDetermined: metadata.clientDetermined !== false,
                ssrRoundtripCount: 0,
                hydrationKey: requestInfo.hydrationKey || metadata.hydrationKey || '',
                generation: requestInfo.generation || metadata.generation || '',
                hydrationGeneration: requestInfo.generation || metadata.hydrationGeneration || metadata.generation || ''
            };
            response.uiCompute = {
                ...(response.uiCompute && typeof response.uiCompute === 'object' ? response.uiCompute : {}),
                mainThreadCommitRequired: true,
                trustedDomCommit: 'main-thread',
                stateOwnership: 'main-thread',
                clientDetermined: true,
                ownership: {
                    dom: false,
                    events: false,
                    state: false
                }
            };
            return response;
        }

        async function dispatchUiComputeEnvelope(envelope, options = {}) {
            const requestInfo = normalizeUiComputeEnvelope(envelope, options);
            if (requestInfo.hydrationKey && requestInfo.generation) {
                latestUiComputeGenerationByKey.set(requestInfo.hydrationKey, requestInfo.generation);
            }
            await syncTemplates({
                force: options.forceTemplateSync === true
            });
            const result = await postWorkerMessage('ui_compute', {
                envelope: requestInfo.envelope
            });
            lastHealthAt = now();
            const latestGeneration = requestInfo.hydrationKey
                ? latestUiComputeGenerationByKey.get(requestInfo.hydrationKey)
                : requestInfo.generation;
            const superseded = Boolean(
                requestInfo.hydrationKey
                && requestInfo.generation
                && latestGeneration
                && latestGeneration !== requestInfo.generation
            );
            if (superseded) supersededResponseCount += 1;
            if (result && result.stale === true) staleResponseCount += 1;
            return normalizeUiComputeResponse(result, requestInfo, superseded);
        }

        async function healthCheck() {
            const result = await postWorkerMessage('health');
            lastHealthAt = now();
            return result;
        }

        function pauseForBackpressure(reason = 'critical_backpressure') {
            paused = true;
            pauseReason = normalizeTextValue(reason, 'critical_backpressure');
            invalidationCount += latestUiComputeGenerationByKey.size;
            latestUiComputeGenerationByKey.clear();
            terminateWorker(pauseReason);
            return true;
        }

        function resume(reason = 'pressure_recovered') {
            paused = false;
            pauseReason = normalizeTextValue(reason, 'pressure_recovered');
            lastError = null;
            return true;
        }

        function getTopologySnapshot() {
            const missingApis = getMissingApis();
            const health = missingApis.length > 0
                ? 'degraded'
                : (lastError ? 'degraded' : (worker ? 'ready' : 'available'));
            return {
                schema: 'xtend.rmt.prewarm-worker-topology.v1',
                kind: 'rmt-prewarm',
                enabled: true,
                status: health,
                health,
                workerName,
                workerType,
                instantiated: !!worker,
                pendingJobs: taskResolvers.size,
                submittedJobs,
                templatesSynced: syncedTemplateCount,
                available: missingApis.length === 0,
                missingApis,
                lastHealthAt,
                lastError: cloneSerializable(lastError, null),
                paused,
                pauseReason,
                invalidationCount,
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
                    queueDepthMax,
                    maxQueueDepth: uiCoprocessor.maxQueueDepth,
                    stalePolicy: uiCoprocessor.stalePolicy,
                    status: !uiCoprocessor.enabled ? 'disabled' : health,
                    pendingJobs: taskResolvers.size,
                    submittedJobs,
                    transferBytes,
                    staleResponses: staleResponseCount,
                    supersededResponses: supersededResponseCount,
                    stateOwnership: 'main-thread',
                    trustedDomCommit: 'main-thread',
                    clientDetermined: true,
                    ssrRoundtripCount: 0
                }
            };
        }

        return Object.freeze({
            dispatchPrerenderEnvelope,
            dispatchUiComputeEnvelope,
            getTopologySnapshot,
            getWorker,
            healthCheck,
            pauseForBackpressure,
            resume,
            syncTemplates,
            terminateWorker
        });
    };
})(__XTENDRMT_GLOBAL__);
