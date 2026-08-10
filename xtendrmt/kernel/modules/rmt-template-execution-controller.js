/* modules/rmt-template-execution-controller.js */
(function registerRmtTemplateExecutionControllerModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtTemplateExecutionController = function createRmtTemplateExecutionController(deps = {}) {
        const executionModel = deps.executionModel;
        const interaction = deps.interactionAdapter;
        if (!executionModel || typeof executionModel.normalizeRequest !== 'function') {
            throw new Error('RmtTemplateExecutionController benoetigt einen gueltigen ExecutionModelPort.');
        }
        if (!interaction || typeof interaction.project !== 'function') {
            throw new Error('RmtTemplateExecutionController benoetigt einen gueltigen TemplateInteractionPort.');
        }

        function prepareRequestInput(requestInput = {}, options = {}) {
            const rawRequest = requestInput && typeof requestInput === 'object' ? requestInput : {};
            const target = options.target !== undefined ? options.target : rawRequest.target;
            const targetRecord = interaction.resolveTargetRecord(target, {
                elementId: options.elementId || rawRequest.elementId || (target && target.elementId),
                selector: options.selector || rawRequest.selector || (target && target.selector)
            });
            if (!targetRecord) return rawRequest;
            const rootId = rawRequest.rootId
                || (rawRequest.target && rawRequest.target.rootId)
                || targetRecord.suggestedRootId
                || undefined;
            return {
                ...rawRequest,
                target,
                resolvedElement: targetRecord.element,
                ...(rootId ? { rootId } : {})
            };
        }

        function normalizeControllerRequest(requestInput = {}, options = {}) {
            return executionModel.normalizeRequest(prepareRequestInput(requestInput, options), options);
        }

        function renderTemplate(requestInput = {}, options = {}) {
            let request = null;
            let chunk = null;
            try {
                request = normalizeControllerRequest(requestInput, {
                    ...options,
                    executionMode: 'runtime_render'
                });
                chunk = request.chunk
                    ? executionModel.normalizeChunk(request.chunk, options)
                    : executionModel.prerenderTemplate(request, options);
                return interaction.project(request, chunk, options, false);
            } catch (error) {
                const boundaryResult = request
                    ? interaction.projectErrorBoundary(request, chunk, error, options, 'runtime_render')
                    : null;
                if (boundaryResult) return boundaryResult;
                throw error;
            }
        }

        function hydrateTemplate(requestInput = {}, options = {}) {
            let request = null;
            let chunk = null;
            try {
                request = normalizeControllerRequest(requestInput, {
                    ...options,
                    executionMode: 'hydrate_prerendered'
                });
                chunk = request.chunk
                    ? executionModel.normalizeChunk(request.chunk, options)
                    : executionModel.prerenderTemplate(request, options);
                return interaction.project(request, chunk, options, true);
            } catch (error) {
                const boundaryResult = request
                    ? interaction.projectErrorBoundary(request, chunk, error, options, 'hydrate_prerendered')
                    : null;
                if (boundaryResult) return boundaryResult;
                throw error;
            }
        }

        function executeTemplate(requestInput = {}, options = {}) {
            const request = normalizeControllerRequest(requestInput, options);
            if (request.executionMode === 'runtime_render') return renderTemplate(request, options);
            if (request.executionMode === 'hydrate_prerendered') return hydrateTemplate(request, options);
            if (request.executionMode === 'prerender_only') {
                const chunk = executionModel.prerenderTemplate(request, options);
                return Object.freeze({
                    executionMode: 'prerender_only',
                    plan: chunk.plan,
                    chunk,
                    islandHandle: null,
                    bindingSession: null,
                    applied: false,
                    deferred: false
                });
            }
            if (request.chunk) return hydrateTemplate({ ...request, chunk: request.chunk }, options);

            const prerenderEnvelope = executionModel.createPrerenderEnvelope(request, options);
            if (options.performLocalPrerender === true) {
                const chunk = executionModel.prerenderTemplate(request, options);
                const hydration = request.hydration && typeof request.hydration === 'object'
                    ? request.hydration
                    : {};
                if (options.autoHydrate !== false && hydration.autoHydrate !== false) {
                    return hydrateTemplate({ ...request, chunk }, options);
                }
                return Object.freeze({
                    executionMode: request.executionMode,
                    plan: chunk.plan,
                    chunk,
                    prerenderEnvelope,
                    islandHandle: null,
                    bindingSession: null,
                    applied: false,
                    deferred: false
                });
            }
            return Object.freeze({
                executionMode: request.executionMode,
                plan: prerenderEnvelope.plan,
                chunk: null,
                prerenderEnvelope,
                islandHandle: null,
                bindingSession: null,
                applied: false,
                deferred: true
            });
        }

        const api = {
            applyPrerenderChunk: interaction.applyPrerenderChunk,
            applyRuntimeBindings: interaction.applyRuntimeBindings,
            createExecutionPlan: (requestInput = {}, options = {}) => executionModel.createExecutionPlan(
                prepareRequestInput(requestInput, options),
                options
            ),
            createPrerenderEnvelope: (requestInput = {}, options = {}) => executionModel.createPrerenderEnvelope(
                prepareRequestInput(requestInput, options),
                options
            ),
            executeTemplate,
            getRuntimeRenderer: interaction.getRuntimeRenderer,
            getSupportedExecutionModes: executionModel.getSupportedExecutionModes,
            hydrateTemplate,
            normalizeChunk: (chunkInput, options = {}) => executionModel.normalizeChunk(chunkInput, options),
            normalizeExecutionMode: executionModel.normalizeExecutionMode,
            prerenderTemplate: (requestInput = {}, options = {}) => executionModel.prerenderTemplate(
                prepareRequestInput(requestInput, options),
                options
            ),
            renderTemplate
        };
        [
            'listTrustVerdicts', 'getPanicSnapshot', 'listPanicEvents', 'beginPanicRecovery',
            'completePanicRecovery', 'failPanicRecovery', 'rememberSafeSnapshot',
            'getLastSafeSnapshot', 'listSafeSnapshots', 'quarantineScope',
            'restoreLastSafeSnapshot', 'renderSafeFallback', 'recoverFromPanic',
            'listRecoveryOutcomes', 'listPanicRecoveryRecords', 'getPanicRecoverySnapshot',
            'listQuarantinedScopes', 'isScopeQuarantined'
        ].forEach((methodName) => {
            api[methodName] = interaction[methodName];
        });
        return Object.freeze(api);
    };
})(__XTENDRMT_GLOBAL__);
