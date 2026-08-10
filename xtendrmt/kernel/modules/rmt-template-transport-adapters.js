/* modules/rmt-template-transport-adapters.js */
(function registerRmtTemplateTransportAdaptersModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const PRERENDER_REQUEST_KIND = 'rmt_template_prerender_request';
    const PRERENDER_RESPONSE_KIND = 'rmt_template_prerender_response';
    const PRERENDER_RESPONSE_VERSION = '1.0';

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function cloneSerializable(value, fallbackValue = null) {
        if (value === undefined) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallbackValue;
        }
    }

    function normalizeError(errorInput) {
        if (!errorInput) {
            return {
                name: 'Error',
                message: 'Unbekannter Rmt-Template-Transportfehler.'
            };
        }
        if (typeof errorInput === 'string') {
            return {
                name: 'Error',
                message: errorInput
            };
        }
        const sourceError = errorInput && errorInput.error ? errorInput.error : errorInput;
        return {
            name: clampString(sourceError.name, 'Error'),
            message: clampString(sourceError.message, 'Unbekannter Rmt-Template-Transportfehler.'),
            code: clampString(sourceError.code || sourceError.status || sourceError.reason, '')
        };
    }

    function parseMaybeJson(value) {
        if (typeof value !== 'string') return value;
        return JSON.parse(value);
    }

    function defaultExecutionModeForTransport(transportKind) {
        return transportKind === 'server'
            ? 'server_prerender_hydrate'
            : 'worker_prerender_hydrate';
    }

    function resolveExecutionPath(deps = {}) {
        if (deps.executionPath && typeof deps.executionPath === 'object') {
            return deps.executionPath;
        }
        if (deps.templateApi && typeof deps.templateApi.getExecutionPath === 'function') {
            const executionPath = deps.templateApi.getExecutionPath();
            if (executionPath) return executionPath;
        }
        const createRmtTemplateExecutionPathFactory = typeof appModules.createRmtTemplateExecutionPath === 'function'
            ? appModules.createRmtTemplateExecutionPath
            : (typeof deps.createRmtTemplateExecutionPath === 'function'
                ? deps.createRmtTemplateExecutionPath
                : null);
        return typeof createRmtTemplateExecutionPathFactory === 'function'
            ? createRmtTemplateExecutionPathFactory(deps)
            : null;
    }

    function buildTransportAdapter(transportKind, deps = {}) {
        const safeTransportKind = clampString(transportKind, 'worker');
        const executionPath = resolveExecutionPath(deps);
        if (!executionPath || typeof executionPath.createPrerenderEnvelope !== 'function') {
            throw new Error('RmtTemplateTransportAdapter benoetigt einen gueltigen TemplateExecutionPath.');
        }

        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => Date.now());
        const dispatchPrerenderEnvelope = typeof deps.dispatchPrerenderEnvelope === 'function'
            ? deps.dispatchPrerenderEnvelope
            : null;
        const latestPendingBySupersessionKey = new Map();
        const latestHydrationGenerationByKey = new Map();
        let pendingRequestSequence = 0;

        function normalizeExecutionMode(value) {
            const fallbackValue = defaultExecutionModeForTransport(safeTransportKind);
            const normalizedValue = typeof executionPath.normalizeExecutionMode === 'function'
                ? executionPath.normalizeExecutionMode(value, fallbackValue)
                : clampString(value, fallbackValue);
            if (normalizedValue === 'prerender_only') return normalizedValue;
            if (safeTransportKind === 'worker') {
                return normalizedValue === 'worker_prerender_hydrate'
                    ? normalizedValue
                    : fallbackValue;
            }
            return normalizedValue === 'server_prerender_hydrate'
                ? normalizedValue
                : fallbackValue;
        }

        function normalizeRequestInput(requestInput = {}, options = {}) {
            const source = parseMaybeJson(requestInput) || {};
            const executionMode = normalizeExecutionMode(
                options.executionMode
                || source.executionMode
            );

            if (source && source.kind === PRERENDER_REQUEST_KIND) {
                return {
                    executionMode,
                    template: cloneSerializable(source.template, null),
                    target: cloneSerializable(source.target, {}),
                    rootId: clampString(source.rootId, ''),
                    namespace: clampString(source.template && source.template.namespace, ''),
                    model: cloneSerializable(source.model, {}),
                    metadata: cloneSerializable(source.metadata, {})
                };
            }

            return {
                ...(source && typeof source === 'object' ? source : {}),
                executionMode
            };
        }

        function normalizeSupersessionKey(requestInput = {}, options = {}) {
            const source = parseMaybeJson(requestInput) || {};
            return clampString(
                options.supersessionKey
                || source.supersessionKey
                || (source.metadata && source.metadata.supersessionKey)
                || (source.meta && source.meta.supersessionKey),
                ''
            );
        }

        function normalizeHydrationGeneration(value, fallbackValue = '') {
            if (value === undefined || value === null) return fallbackValue;
            const normalized = String(value).trim();
            return normalized || fallbackValue;
        }

        function readMetadataGeneration(metadata = {}) {
            if (!metadata || typeof metadata !== 'object') return '';
            return normalizeHydrationGeneration(
                metadata.hydrationGeneration
                || metadata.generation
                || metadata.workerGeneration
                || metadata.prerenderGeneration,
                ''
            );
        }

        function readResponseHydrationGeneration(responseEnvelope = {}, requestInput = {}, options = {}) {
            const requestSource = parseMaybeJson(requestInput) || {};
            const chunk = responseEnvelope && responseEnvelope.chunk ? responseEnvelope.chunk : null;
            return normalizeHydrationGeneration(
                options.generation
                || options.hydrationGeneration
                || readMetadataGeneration(responseEnvelope && responseEnvelope.metadata)
                || readMetadataGeneration(responseEnvelope && responseEnvelope.worker)
                || readMetadataGeneration(responseEnvelope && responseEnvelope.request && responseEnvelope.request.metadata)
                || readMetadataGeneration(chunk && chunk.hydration && chunk.hydration.metadata)
                || readMetadataGeneration(requestSource && requestSource.metadata),
                ''
            );
        }

        function normalizeHydrationKey(responseEnvelope = {}, requestInput = {}, options = {}) {
            const requestSource = parseMaybeJson(requestInput) || {};
            const chunk = responseEnvelope && responseEnvelope.chunk ? responseEnvelope.chunk : null;
            return clampString(
                options.hydrationKey
                || options.supersessionKey
                || (responseEnvelope && responseEnvelope.metadata && responseEnvelope.metadata.supersessionKey)
                || (responseEnvelope && responseEnvelope.request && responseEnvelope.request.metadata && responseEnvelope.request.metadata.supersessionKey)
                || (requestSource && requestSource.metadata && requestSource.metadata.supersessionKey)
                || (chunk && chunk.rootId ? `root:${chunk.rootId}` : '')
                || (responseEnvelope && responseEnvelope.rootId ? `root:${responseEnvelope.rootId}` : ''),
                ''
            );
        }

        function countBlockedHostServiceRequests(source) {
            if (!source || typeof source !== 'object') return 0;
            let count = 0;
            [
                'hostServices',
                'hostServiceRequests',
                'serviceRequests',
                'services',
                'effects',
                'commands'
            ].forEach((key) => {
                if (!Object.prototype.hasOwnProperty.call(source, key)) return;
                const value = source[key];
                count += Array.isArray(value) ? value.length : 1;
            });
            return count;
        }

        function inspectWorkerHostServicePayload(responseEnvelope = {}) {
            const chunk = responseEnvelope && responseEnvelope.chunk ? responseEnvelope.chunk : null;
            const blocked = countBlockedHostServiceRequests(responseEnvelope)
                + countBlockedHostServiceRequests(responseEnvelope && responseEnvelope.metadata)
                + countBlockedHostServiceRequests(responseEnvelope && responseEnvelope.worker)
                + countBlockedHostServiceRequests(chunk)
                + countBlockedHostServiceRequests(chunk && chunk.hydration && chunk.hydration.metadata);
            const diagnostics = blocked > 0 ? [{
                level: 'info',
                code: 'xtend.rmt.worker_prerender.host_services_blocked',
                message: 'Worker prerender responses may not execute host services during hydrateResponse().',
                metadata: {
                    blocked
                }
            }] : [];
            return {
                blocked,
                diagnostics
            };
        }

        function createSupersededHydrationResult(responseEnvelope, generationInfo, hostServiceInspection) {
            const diagnostics = [{
                level: 'info',
                code: 'xtend.rmt.worker_prerender.generation_superseded',
                message: 'Worker prerender hydration response was discarded because its generation is no longer current.',
                metadata: {
                    hydrationKey: generationInfo.hydrationKey,
                    expectedGeneration: generationInfo.expectedGeneration,
                    actualGeneration: generationInfo.actualGeneration
                }
            }].concat(hostServiceInspection.diagnostics);
            return Object.freeze({
                ok: false,
                status: 'superseded',
                transport: safeTransportKind,
                request: responseEnvelope.request || null,
                response: responseEnvelope,
                executionResult: null,
                chunk: responseEnvelope.chunk || null,
                islandHandle: null,
                bindingSession: null,
                applied: false,
                hydrated: false,
                superseded: true,
                deferred: false,
                hydrationGeneration: generationInfo.actualGeneration || null,
                expectedGeneration: generationInfo.expectedGeneration || null,
                hydrationKey: generationInfo.hydrationKey || null,
                trustedDomCommit: {
                    required: true,
                    status: 'skipped',
                    mainThread: true,
                    reason: 'generation_superseded'
                },
                blockedHostServiceRequests: hostServiceInspection.blocked,
                hostServicesExecuted: 0,
                diagnostics,
                error: {
                    name: 'SupersededError',
                    message: 'Worker prerender hydration response generation was superseded.',
                    code: 'superseded'
                }
            });
        }

        function evaluateHydrationGeneration(responseEnvelope = {}, requestInput = {}, options = {}) {
            const hydrationKey = normalizeHydrationKey(responseEnvelope, requestInput, options);
            const actualGeneration = readResponseHydrationGeneration(responseEnvelope, requestInput, options);
            const expectedGeneration = normalizeHydrationGeneration(
                options.currentGeneration
                || options.expectedGeneration
                || (hydrationKey ? latestHydrationGenerationByKey.get(hydrationKey) : ''),
                ''
            );
            const hasExpectedGeneration = expectedGeneration !== '';
            const matches = !hasExpectedGeneration || (actualGeneration !== '' && actualGeneration === expectedGeneration);
            if (matches && hydrationKey && actualGeneration) {
                latestHydrationGenerationByKey.set(hydrationKey, actualGeneration);
            }
            return {
                hydrationKey,
                actualGeneration,
                expectedGeneration,
                matches
            };
        }

        function createRequestSnapshot(envelope) {
            if (!envelope) return null;
            return Object.freeze({
                kind: PRERENDER_REQUEST_KIND,
                version: clampString(envelope.version, '1.0'),
                executionMode: clampString(envelope.executionMode, defaultExecutionModeForTransport(safeTransportKind)),
                prerenderTransport: clampString(envelope.prerenderTransport, safeTransportKind),
                rootId: clampString(envelope.rootId, ''),
                template: cloneSerializable(envelope.template, null),
                target: cloneSerializable(envelope.target, {}),
                requestedAt: Number.isFinite(envelope.requestedAt) ? envelope.requestedAt : 0
            });
        }

        function createPrerenderEnvelope(requestInput = {}, options = {}) {
            const normalizedRequest = normalizeRequestInput(requestInput, options);
            return executionPath.createPrerenderEnvelope(normalizedRequest, options);
        }

        function createErrorResponseEnvelope(errorInput, options = {}) {
            const requestEnvelope = options.requestEnvelope
                ? createRequestSnapshot(options.requestEnvelope)
                : null;
            const safeError = normalizeError(errorInput);
            return Object.freeze({
                kind: PRERENDER_RESPONSE_KIND,
                version: PRERENDER_RESPONSE_VERSION,
                ok: false,
                transport: safeTransportKind,
                executionMode: requestEnvelope
                    ? requestEnvelope.executionMode
                    : defaultExecutionModeForTransport(safeTransportKind),
                rootId: requestEnvelope ? requestEnvelope.rootId : '',
                template: requestEnvelope ? cloneSerializable(requestEnvelope.template, null) : null,
                plan: options.plan ? cloneSerializable(options.plan, null) : null,
                request: requestEnvelope,
                metadata: cloneSerializable(options.metadata, {}),
                chunk: null,
                superseded: options.superseded === true,
                error: safeError,
                requestedAt: requestEnvelope ? requestEnvelope.requestedAt : 0,
                respondedAt: now()
            });
        }

        function createSupersededResponseEnvelope(options = {}) {
            return createErrorResponseEnvelope({
                name: 'SupersededError',
                message: 'Rmt-Template-Transportanfrage wurde durch eine neuere Anfrage ersetzt.',
                code: 'superseded'
            }, {
                ...options,
                superseded: true
            });
        }

        function createPrerenderResponseEnvelope(responseInput = {}, options = {}) {
            const source = parseMaybeJson(responseInput) || {};
            if (source && source.kind === PRERENDER_RESPONSE_KIND && source.ok === false) {
                return createErrorResponseEnvelope(source.error || source, {
                    requestEnvelope: options.requestEnvelope || source.request,
                    metadata: source.metadata,
                    plan: source.plan
                });
            }

            const requestEnvelope = options.requestEnvelope
                ? createPrerenderEnvelope(options.requestEnvelope, options)
                : (source.request && source.request.kind === PRERENDER_REQUEST_KIND
                    ? createPrerenderEnvelope(source.request, options)
                    : null);
            const chunkSource = source && source.chunk
                ? source.chunk
                : (source && Array.isArray(source.chunks) && source.chunks[0] ? source.chunks[0] : source);
            const chunk = executionPath.normalizeChunk(chunkSource, options);

            return Object.freeze({
                kind: PRERENDER_RESPONSE_KIND,
                version: PRERENDER_RESPONSE_VERSION,
                ok: true,
                transport: safeTransportKind,
                executionMode: clampString(chunk.executionMode, defaultExecutionModeForTransport(safeTransportKind)),
                rootId: clampString(chunk.rootId, requestEnvelope ? requestEnvelope.rootId : ''),
                template: cloneSerializable(chunk.template, null),
                plan: cloneSerializable(chunk.plan, null),
                request: requestEnvelope ? createRequestSnapshot(requestEnvelope) : null,
                metadata: cloneSerializable(
                    source.metadata !== undefined
                        ? source.metadata
                        : (requestEnvelope ? requestEnvelope.metadata : {}),
                    {}
                ),
                chunk,
                superseded: false,
                error: null,
                worker: cloneSerializable(source.worker, null),
                requestedAt: requestEnvelope ? requestEnvelope.requestedAt : 0,
                respondedAt: now()
            });
        }

        function normalizePrerenderResponse(responseInput = {}, options = {}) {
            const source = parseMaybeJson(responseInput) || {};
            if (source && source.kind === PRERENDER_RESPONSE_KIND) {
                return source.ok === false
                    ? createErrorResponseEnvelope(source.error || source, {
                        requestEnvelope: options.requestEnvelope || source.request,
                        metadata: source.metadata,
                        plan: source.plan,
                        superseded: source.superseded === true
                    })
                    : createPrerenderResponseEnvelope(source, {
                        ...options,
                        requestEnvelope: options.requestEnvelope || source.request
                    });
            }
            if (source && source.ok === false) {
                return createErrorResponseEnvelope(source.error || source, {
                    requestEnvelope: options.requestEnvelope,
                    metadata: source.metadata,
                    plan: source.plan,
                    superseded: source.superseded === true
                });
            }
            return createPrerenderResponseEnvelope(source, options);
        }

        function handlePrerenderEnvelope(envelopeInput = {}, options = {}) {
            let requestEnvelope = null;
            try {
                requestEnvelope = createPrerenderEnvelope(envelopeInput, options);
                const chunk = executionPath.prerenderTemplate({
                    executionMode: requestEnvelope.executionMode,
                    template: cloneSerializable(requestEnvelope.template, null),
                    target: cloneSerializable(requestEnvelope.target, {}),
                    rootId: requestEnvelope.rootId,
                    model: cloneSerializable(requestEnvelope.model, {}),
                    metadata: cloneSerializable(requestEnvelope.metadata, {})
                }, options);
                return createPrerenderResponseEnvelope({
                    chunk,
                    metadata: cloneSerializable(options.metadata, {})
                }, {
                    ...options,
                    requestEnvelope
                });
            } catch (error) {
                return createErrorResponseEnvelope(error, {
                    requestEnvelope,
                    metadata: cloneSerializable(options.metadata, {})
                });
            }
        }

        async function requestPrerender(requestInput = {}, options = {}) {
            const requestEnvelope = requestInput && requestInput.kind === PRERENDER_REQUEST_KIND
                ? createPrerenderEnvelope(requestInput, options)
                : createPrerenderEnvelope(requestInput, options);
            const supersessionKey = normalizeSupersessionKey(requestInput, options);
            const hydrationGeneration = normalizeHydrationGeneration(
                options.generation
                || options.hydrationGeneration
                || readMetadataGeneration(requestEnvelope.metadata),
                supersessionKey ? String(pendingRequestSequence + 1) : ''
            );
            const requestRecord = supersessionKey
                ? {
                    id: ++pendingRequestSequence,
                    supersessionKey,
                    hydrationGeneration
                }
                : null;
            if (requestRecord) {
                latestPendingBySupersessionKey.set(supersessionKey, requestRecord);
                latestHydrationGenerationByKey.set(supersessionKey, hydrationGeneration || String(requestRecord.id));
            }
            const effectiveDispatcher = typeof options.dispatchPrerenderEnvelope === 'function'
                ? options.dispatchPrerenderEnvelope
                : dispatchPrerenderEnvelope;
            if (typeof effectiveDispatcher !== 'function') {
                if (options.handleLocally === true || options.localFallback === true) {
                    return handlePrerenderEnvelope(requestEnvelope, options);
                }
                throw new Error(`RmtTemplate${safeTransportKind === 'server' ? 'Server' : 'Worker'}Adapter benoetigt dispatchPrerenderEnvelope() oder handleLocally.`);
            }
            let response;
            try {
                response = await effectiveDispatcher(requestEnvelope, {
                    ...options,
                    transportKind: safeTransportKind
                });
            } catch (error) {
                response = createErrorResponseEnvelope(error, {
                    ...options,
                    requestEnvelope
                });
            }
            let normalizedResponse;
            try {
                normalizedResponse = normalizePrerenderResponse(response, {
                    ...options,
                    requestEnvelope
                });
            } catch (error) {
                normalizedResponse = createErrorResponseEnvelope(error, {
                    ...options,
                    requestEnvelope
                });
            }
            if (
                requestRecord
                && latestPendingBySupersessionKey.get(supersessionKey) !== requestRecord
            ) {
                return createSupersededResponseEnvelope({
                    ...options,
                    requestEnvelope
                });
            }
            if (
                requestRecord
                && latestPendingBySupersessionKey.get(supersessionKey) === requestRecord
            ) {
                latestPendingBySupersessionKey.delete(supersessionKey);
            }
            return normalizedResponse;
        }

        function buildHydrationRequest(requestInput = {}, responseEnvelope, options = {}) {
            const source = parseMaybeJson(requestInput) || {};
            const requestSnapshot = responseEnvelope && responseEnvelope.request
                ? responseEnvelope.request
                : null;
            const chunk = responseEnvelope && responseEnvelope.chunk
                ? responseEnvelope.chunk
                : null;
            return {
                ...(source && source.kind !== PRERENDER_REQUEST_KIND ? source : {}),
                executionMode: 'hydrate_prerendered',
                template: (
                    source && source.kind !== PRERENDER_REQUEST_KIND && source.template
                        ? source.template
                        : (requestSnapshot ? requestSnapshot.template : (chunk ? chunk.template : null))
                ),
                target: (
                    options.target !== undefined
                        ? options.target
                        : (source && source.kind !== PRERENDER_REQUEST_KIND && Object.prototype.hasOwnProperty.call(source, 'target')
                            ? source.target
                            : (requestSnapshot ? requestSnapshot.target : undefined))
                ),
                rootId: clampString(
                    options.rootId
                    || (source && source.kind !== PRERENDER_REQUEST_KIND ? source.rootId : '')
                    || (requestSnapshot ? requestSnapshot.rootId : '')
                    || (chunk ? chunk.rootId : ''),
                    ''
                ),
                model: cloneSerializable(
                    source && source.kind !== PRERENDER_REQUEST_KIND && Object.prototype.hasOwnProperty.call(source, 'model')
                        ? source.model
                        : (chunk ? chunk.modelSnapshot : {}),
                    {}
                ),
                metadata: cloneSerializable(
                    source && source.kind !== PRERENDER_REQUEST_KIND && Object.prototype.hasOwnProperty.call(source, 'metadata')
                        ? source.metadata
                        : (responseEnvelope ? responseEnvelope.metadata : {}),
                    {}
                ),
                chunk
            };
        }

        function hydrateResponse(responseInput = {}, requestInput = {}, options = {}) {
            let responseEnvelope;
            try {
                responseEnvelope = normalizePrerenderResponse(responseInput, {
                    ...options,
                    requestEnvelope: options.requestEnvelope
                });
            } catch (error) {
                responseEnvelope = createErrorResponseEnvelope(error, {
                    ...options,
                    requestEnvelope: options.requestEnvelope
                });
            }
            if (responseEnvelope.ok !== true || !responseEnvelope.chunk) {
                return Object.freeze({
                    ok: false,
                    status: responseEnvelope.superseded === true ? 'superseded' : 'error',
                    transport: safeTransportKind,
                    request: responseEnvelope.request || null,
                    response: responseEnvelope,
                    executionResult: null,
                    chunk: null,
                    islandHandle: null,
                    bindingSession: null,
                    applied: false,
                    hydrated: false,
                    superseded: responseEnvelope.superseded === true,
                    deferred: false,
                    hydrationGeneration: null,
                    expectedGeneration: null,
                    hydrationKey: null,
                    trustedDomCommit: {
                        required: true,
                        status: 'skipped',
                        mainThread: true,
                        reason: 'invalid_response'
                    },
                    blockedHostServiceRequests: 0,
                    hostServicesExecuted: 0,
                    diagnostics: [],
                    error: cloneSerializable(responseEnvelope.error, null)
                });
            }
            const hostServiceInspection = inspectWorkerHostServicePayload(responseEnvelope);
            const generationInfo = evaluateHydrationGeneration(responseEnvelope, requestInput, options);
            if (!generationInfo.matches) {
                return createSupersededHydrationResult(responseEnvelope, generationInfo, hostServiceInspection);
            }
            if (options.autoHydrate === false) {
                return Object.freeze({
                    ok: true,
                    status: 'deferred',
                    transport: safeTransportKind,
                    request: responseEnvelope.request || null,
                    response: responseEnvelope,
                    executionResult: null,
                    chunk: responseEnvelope.chunk,
                    islandHandle: null,
                    bindingSession: null,
                    applied: false,
                    hydrated: false,
                    superseded: false,
                    deferred: true,
                    hydrationGeneration: generationInfo.actualGeneration || null,
                    expectedGeneration: generationInfo.expectedGeneration || null,
                    hydrationKey: generationInfo.hydrationKey || null,
                    trustedDomCommit: {
                        required: true,
                        status: 'deferred',
                        mainThread: true,
                        reason: 'auto_hydrate_disabled'
                    },
                    blockedHostServiceRequests: hostServiceInspection.blocked,
                    hostServicesExecuted: 0,
                    diagnostics: hostServiceInspection.diagnostics,
                    error: null
                });
            }

            const executionResult = executionPath.hydrateTemplate(
                buildHydrationRequest(requestInput, responseEnvelope, options),
                options
            );
            return Object.freeze({
                ok: true,
                status: 'hydrated',
                transport: safeTransportKind,
                request: responseEnvelope.request || null,
                response: responseEnvelope,
                executionResult,
                chunk: executionResult && executionResult.chunk ? executionResult.chunk : responseEnvelope.chunk,
                islandHandle: executionResult ? executionResult.islandHandle : null,
                bindingSession: executionResult ? executionResult.bindingSession : null,
                applied: !!(executionResult && executionResult.applied),
                hydrated: true,
                superseded: false,
                deferred: false,
                hydrationGeneration: generationInfo.actualGeneration || null,
                expectedGeneration: generationInfo.expectedGeneration || null,
                hydrationKey: generationInfo.hydrationKey || null,
                trustedDomCommit: {
                    required: true,
                    status: executionResult && executionResult.applied ? 'committed' : 'bindings-only',
                    mainThread: true
                },
                blockedHostServiceRequests: hostServiceInspection.blocked,
                hostServicesExecuted: 0,
                diagnostics: hostServiceInspection.diagnostics,
                error: null
            });
        }

        async function execute(requestInput = {}, options = {}) {
            const requestEnvelope = createPrerenderEnvelope(requestInput, options);
            const responseEnvelope = await requestPrerender(requestEnvelope, options);
            return hydrateResponse(responseEnvelope, requestInput, {
                ...options,
                requestEnvelope
            });
        }

        return Object.freeze({
            createErrorResponseEnvelope,
            createPrerenderEnvelope,
            createPrerenderResponseEnvelope,
            execute,
            getSupportedExecutionModes: () => [
                defaultExecutionModeForTransport(safeTransportKind),
                'prerender_only'
            ],
            getTransportKind: () => safeTransportKind,
            getLatestHydrationGeneration: (hydrationKey) => latestHydrationGenerationByKey.get(clampString(hydrationKey, '')) || null,
            handlePrerenderEnvelope,
            hydrateResponse,
            rememberHydrationGeneration: (hydrationKey, generation) => {
                const safeKey = clampString(hydrationKey, '');
                const safeGeneration = normalizeHydrationGeneration(generation, '');
                if (!safeKey || !safeGeneration) return false;
                latestHydrationGenerationByKey.set(safeKey, safeGeneration);
                return true;
            },
            normalizeExecutionMode,
            normalizePrerenderResponse,
            requestPrerender
        });
    }

    appModules.createRmtTemplateWorkerAdapter = function createRmtTemplateWorkerAdapter(deps = {}) {
        return buildTransportAdapter('worker', deps);
    };

    appModules.createRmtTemplateServerAdapter = function createRmtTemplateServerAdapter(deps = {}) {
        return buildTransportAdapter('server', deps);
    };

})(__XTENDRMT_GLOBAL__);
