/* modules/rmt-template-interaction-adapter.js */
(function registerRmtTemplateInteractionAdapterModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const TEMPLATE_BINDING_SESSION_RESOURCE_ID = 'template.runtime-bindings';

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

    function toPlainObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function isElementLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addEventListener === 'function'
            && typeof value.removeEventListener === 'function';
    }

    appModules.createRmtTemplateInteractionAdapter = function createRmtTemplateInteractionAdapter(deps = {}) {
        const globalTarget = deps.windowTarget || global;
        const documentTarget = Object.prototype.hasOwnProperty.call(deps, 'documentTarget')
            ? deps.documentTarget
            : (globalTarget && globalTarget.document ? globalTarget.document : null);
        const executionModel = deps.executionModel;
        const domCompat = deps.domCompat || deps.rmtDomCompat || null;
        const publicApi = deps.publicApi || null;
        const rmt = deps.rmt
            || (deps.rmtCore && typeof deps.rmtCore.getRmt === 'function' ? deps.rmtCore.getRmt() : null)
            || (publicApi && typeof publicApi.getRmt === 'function' ? publicApi.getRmt() : null);
        const runtimeRendererFactory = deps.createRmtTemplateRuntimeRenderer;
        const trustModel = deps.trustModel || null;
        const recoveryModel = deps.recoveryModel || null;
        let runtimeRenderer = deps.runtimeRenderer || null;
        let eventRouter = deps.eventRouter
            || deps.eventRoutingRuntime
            || deps.applicationEventRouter
            || null;
        let missingEventRouterDiagnosed = false;
        let logicalClock = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalClock += 1;
                return logicalClock;
            });
        const insularBindingSessions = new Map();

        if (!executionModel || typeof executionModel.normalizeChunk !== 'function') {
            throw new Error('RmtTemplateInteractionAdapter benoetigt einen gueltigen ExecutionModelPort.');
        }

        function resolvePublicApi() {
            const resolved = publicApi || (typeof deps.getPublicApi === 'function' ? deps.getPublicApi() : null);
            if (!resolved || typeof resolved.mountIsland !== 'function') {
                throw new Error('RmtTemplateExecutionPath benoetigt fuer Render-/Hydration-Pfade eine gueltige PublicApi.');
            }
            return resolved;
        }

        function getRuntimeRenderer() {
            if (runtimeRenderer) return runtimeRenderer;
            if (deps.templateApi && typeof deps.templateApi.getRuntimeRenderer === 'function') {
                runtimeRenderer = deps.templateApi.getRuntimeRenderer();
                if (runtimeRenderer) return runtimeRenderer;
            }
            if (typeof runtimeRendererFactory !== 'function') return null;
            runtimeRenderer = runtimeRendererFactory({
                ...deps,
                windowTarget: globalTarget,
                documentTarget,
                publicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi() : publicApi,
                rmt,
                sanitizeHtmlOutput: trustModel && typeof trustModel.sanitizeHtml === 'function'
                    ? trustModel.sanitizeHtml
                    : deps.sanitizeHtmlOutput
            });
            return runtimeRenderer;
        }

        function publishEventRouterDiagnostic(code, message, severity = 'warning') {
            if (missingEventRouterDiagnosed) return;
            missingEventRouterDiagnosed = true;
            const diagnostic = Object.freeze({
                schema: 'xtend.rmt.template-interaction-diagnostic.v1',
                code,
                message,
                severity,
                details: Object.freeze({ adapter: 'rmt-template-interaction-adapter' })
            });
            if (deps.diagnosticsHub && typeof deps.diagnosticsHub.publish === 'function') {
                deps.diagnosticsHub.publish('rmt.template.interaction', diagnostic, {
                    source: 'rmt-template-interaction-adapter'
                });
            }
            if (typeof deps.publishDiagnostic === 'function') deps.publishDiagnostic(diagnostic);
        }

        function createCompatibilityCommandBus() {
            const injected = deps.commandBus || deps.commandRuntime || null;
            if (injected && typeof injected.dispatchCommand === 'function') return injected;
            if (
                (!publicApi || typeof publicApi.dispatchCommand !== 'function')
                && (!rmt || (typeof rmt.dispatchCommand !== 'function' && typeof rmt.emitRootEvent !== 'function'))
            ) return null;
            return Object.freeze({
                dispatchCommand(commandEnvelope = {}, metadata = {}) {
                    const target = toPlainObject(commandEnvelope.target);
                    if (
                        target.kind === 'rmt-root-event'
                        && rmt
                        && typeof rmt.emitRootEvent === 'function'
                        && clampString(target.rootId, '')
                    ) {
                        return rmt.emitRootEvent(
                            target.rootId,
                            clampString(target.eventName || commandEnvelope.command, ''),
                            cloneSerializable(commandEnvelope.payload, {})
                        );
                    }
                    if (publicApi && typeof publicApi.dispatchCommand === 'function') {
                        return publicApi.dispatchCommand(
                            clampString(commandEnvelope.command, ''),
                            cloneSerializable(commandEnvelope.payload, {}),
                            {
                                rootId: clampString(target.rootId, ''),
                                correlationId: clampString(commandEnvelope.correlationId, ''),
                                lane: clampString(commandEnvelope.lane, ''),
                                meta: cloneSerializable(metadata, {})
                            }
                        );
                    }
                    return rmt.dispatchCommand({
                        commandName: clampString(commandEnvelope.command, ''),
                        rootId: clampString(target.rootId, ''),
                        payload: cloneSerializable(commandEnvelope.payload, {}),
                        meta: cloneSerializable(metadata, {})
                    }, metadata);
                }
            });
        }

        function getEventRouter() {
            if (eventRouter && typeof eventRouter.reconcile === 'function') return eventRouter;
            if (deps.strict === true || deps.strictMaraca === true) {
                const error = new Error('RmtTemplateInteractionAdapter benoetigt im Strict-Pfad einen injizierten EventRouterPort.');
                error.code = 'rmt.template.event-router.missing';
                throw error;
            }
            const factory = typeof deps.createRmtEventRoutingRuntime === 'function'
                ? deps.createRmtEventRoutingRuntime
                : (globalTarget
                    && globalTarget.XTendRmtEventRoutingRuntime
                    && typeof globalTarget.XTendRmtEventRoutingRuntime.createRmtEventRoutingRuntime === 'function'
                    ? globalTarget.XTendRmtEventRoutingRuntime.createRmtEventRoutingRuntime
                    : null);
            if (typeof factory !== 'function') {
                publishEventRouterDiagnostic(
                    'rmt.template.event-router.missing',
                    'Template-Application-Bindings wurden erzeugt, aber kein kanonischer Event Router ist verfuegbar.'
                );
                return null;
            }
            eventRouter = factory({
                commandBus: createCompatibilityCommandBus(),
                domRenderer: deps.domRenderer || deps.renderer || null,
                diagnosticsHub: deps.diagnosticsHub,
                documentTarget,
                strict: false
            });
            publishEventRouterDiagnostic(
                'rmt.template.event-router.compatibility',
                'TemplateInteractionAdapter hat fuer die 0.6-Low-Level-Kompatibilitaet einmalig einen kanonischen Event Router erzeugt.',
                'info'
            );
            return eventRouter;
        }

        function routeBindingSession(bindingSession, rootElement) {
            if (
                !bindingSession
                || typeof bindingSession.getApplicationBindingCommitResult !== 'function'
            ) return bindingSession;
            const router = getEventRouter();
            if (!router) return bindingSession;

            const reconcile = () => router.reconcile(
                rootElement,
                bindingSession.getApplicationBindingCommitResult()
            );
            reconcile();
            let destroyed = false;
            return Object.freeze({
                ...bindingSession,
                destroy() {
                    if (destroyed) return false;
                    destroyed = true;
                    const result = bindingSession.destroy();
                    reconcile();
                    return result;
                },
                rebindChunk(nextChunkInput) {
                    const rebound = bindingSession.rebindChunk(nextChunkInput);
                    if (rebound) reconcile();
                    return rebound;
                },
                updateModel(nextModelSnapshot) {
                    const appliedCount = bindingSession.updateModel(nextModelSnapshot);
                    reconcile();
                    return appliedCount;
                }
            });
        }

        function resolveTarget(target, options = {}) {
            if (isElementLike(target)) return target;
            if (target && isElementLike(target.element)) return target.element;
            if (target && isElementLike(target.resolvedElement)) return target.resolvedElement;
            if (domCompat && typeof domCompat.resolveElement === 'function') {
                const resolved = domCompat.resolveElement(target, options);
                if (resolved) return resolved;
            }
            const elementId = clampString(options.elementId || (target && target.elementId), '');
            if (elementId && documentTarget && typeof documentTarget.getElementById === 'function') {
                const byId = documentTarget.getElementById(elementId);
                if (byId) return byId;
            }
            const selector = clampString(options.selector || (target && target.selector) || target, '');
            if (selector && documentTarget && typeof documentTarget.querySelector === 'function') {
                return documentTarget.querySelector(selector) || null;
            }
            return null;
        }

        function resolveTargetRecord(target, options = {}) {
            const element = resolveTarget(target, options);
            if (!element) return null;
            const elementId = typeof element.id === 'string' ? element.id.trim() : '';
            return Object.freeze({
                element,
                elementId,
                suggestedRootId: elementId ? `template:${elementId}` : ''
            });
        }

        function normalizeChunk(chunkInput, options = {}) {
            return executionModel.normalizeChunk(chunkInput, options);
        }

        function applyPrerenderChunk(target, chunkInput, options = {}) {
            const chunk = normalizeChunk(chunkInput, options);
            const element = resolveTarget(target || chunk.target, {
                elementId: chunk.target && chunk.target.elementId,
                selector: chunk.target && chunk.target.selector
            });
            if (!element) {
                throw new Error('RmtTemplateExecutionPath konnte das Ziel fuer den Prerender-Chunk nicht aufloesen.');
            }
            if (chunk.template.mode === 'text') {
                if ('textContent' in element) {
                    element.textContent = String(chunk.markup.textContent || '');
                    return true;
                }
                if (typeof element.replaceChildren === 'function') {
                    element.replaceChildren(String(chunk.markup.textContent || ''));
                    return true;
                }
                return false;
            }
            if (chunk.template.mode === 'html_fragment') {
                /* <kernel-lab:rmt-template-execution-trusted-dom-delegate> */
                const renderer = getRuntimeRenderer();
                if (!renderer || typeof renderer.commitTrustedHtml !== 'function') return false;
                const committed = renderer.commitTrustedHtml(element, String(chunk.markup.html || ''), {
                    scope: 'template',
                    sink: 'prerender.html',
                    sourceRef: `template:${chunk.template.qualifiedId || chunk.template.id || 'chunk'}:prerender`,
                    metadata: {
                        templateQualifiedId: chunk.template.qualifiedId || '',
                        templateMode: chunk.template.mode || '',
                        rootId: chunk.rootId || '',
                        preferInnerHtml: options.preferInnerHtml !== false
                    }
                });
                /* </kernel-lab:rmt-template-execution-trusted-dom-delegate> */
                return committed;
            }
            if (chunk.template.mode === 'dom_descriptor' && 'textContent' in element) {
                element.textContent = JSON.stringify(chunk.markup.descriptor || {});
                return true;
            }
            return false;
        }

        function applyRuntimeBindings(target, chunkInput, options = {}) {
            const renderer = getRuntimeRenderer();
            if (!renderer || typeof renderer.applyBindings !== 'function') return null;
            const chunk = normalizeChunk(chunkInput, options);
            const element = resolveTarget(target || chunk.target, {
                elementId: options.elementId || (chunk.target && chunk.target.elementId),
                selector: options.selector || (chunk.target && chunk.target.selector)
            });
            if (!element) {
                throw new Error('RmtTemplateExecutionPath konnte das Ziel fuer Runtime-Bindings nicht aufloesen.');
            }
            const bindingSession = renderer.applyBindings({
                rootId: clampString(options.rootId || chunk.rootId, ''),
                element,
                chunk,
                templateQualifiedId: chunk.template && chunk.template.qualifiedId,
                modelSnapshot: cloneSerializable(
                    options.modelSnapshot !== undefined ? options.modelSnapshot : chunk.modelSnapshot,
                    {}
                ),
                reactivityHints: cloneSerializable(chunk.hydration && chunk.hydration.reactivityHints, {})
            }, options);
            return routeBindingSession(bindingSession, element);
        }

        function attachChunkResource(islandHandle, chunk) {
            if (!islandHandle || typeof islandHandle.getRootHandle !== 'function') return null;
            const rootHandle = islandHandle.getRootHandle();
            if (!rootHandle || typeof rootHandle.replaceResource !== 'function') return null;
            return rootHandle.replaceResource(chunk.hydration.resourceId, chunk, {
                type: 'template_chunk',
                templateQualifiedId: chunk.template.qualifiedId,
                executionMode: chunk.executionMode
            });
        }

        function attachBindingSessionResource(islandHandle, bindingSession, chunk) {
            if (!bindingSession || !islandHandle || typeof islandHandle.getRootHandle !== 'function') return null;
            const rootHandle = islandHandle.getRootHandle();
            if (!rootHandle || typeof rootHandle.replaceResource !== 'function') return null;
            return rootHandle.replaceResource(TEMPLATE_BINDING_SESSION_RESOURCE_ID, bindingSession, {
                type: 'template_runtime_bindings',
                templateQualifiedId: chunk && chunk.template ? chunk.template.qualifiedId : '',
                bindingCount: typeof bindingSession.getBindingCount === 'function' ? bindingSession.getBindingCount() : 0,
                executionMode: chunk ? chunk.executionMode : ''
            });
        }

        function emitLifecycle(rootId, eventName, detail) {
            if (!rmt || typeof rmt.emitRootEvent !== 'function') return null;
            return rmt.emitRootEvent(rootId, eventName, detail, { source: 'rmt_template_execution_path' });
        }

        function shouldPreferInsularHydration(request = {}, options = {}) {
            const metadata = toPlainObject(request.metadata);
            const hydration = toPlainObject(
                request.hydration
                || (request.template && request.template.hydration)
                || (request.chunk && request.chunk.hydration && request.chunk.hydration.templateHydration)
            );
            return options.preferInsularHydration === true
                || options.insularHydration === true
                || metadata.preferInsularHydration === true
                || metadata.insularHydration === true
                || hydration.preferInsularHydration === true
                || hydration.insularHydration === true;
        }

        function rememberBindingSession(request, islandHandle, bindingSession, chunk) {
            const rootId = clampString(request.rootId || (chunk && chunk.rootId), '');
            if (!rootId || !islandHandle || !bindingSession || typeof bindingSession.rebindChunk !== 'function') return false;
            const element = typeof islandHandle.getElement === 'function'
                ? islandHandle.getElement()
                : resolveTarget(request.resolvedElement || request.target, request);
            if (!element) return false;
            insularBindingSessions.set(rootId, {
                rootId,
                element,
                islandHandle,
                bindingSession,
                templateQualifiedId: chunk && chunk.template ? chunk.template.qualifiedId : '',
                updatedAt: now()
            });
            return true;
        }

        function tryInsularRebind(request, chunk, options = {}, resultExecutionMode = '') {
            if (!shouldPreferInsularHydration(request, options)) return null;
            const rootId = clampString(request.rootId || (chunk && chunk.rootId), '');
            const record = rootId ? insularBindingSessions.get(rootId) : null;
            if (!record || !record.bindingSession || typeof record.bindingSession.rebindChunk !== 'function') return null;
            const element = resolveTarget(request.resolvedElement || request.target, request);
            if (!element || record.element !== element || !record.bindingSession.rebindChunk(chunk)) {
                insularBindingSessions.delete(rootId);
                return null;
            }
            record.updatedAt = now();
            record.templateQualifiedId = chunk && chunk.template ? chunk.template.qualifiedId : record.templateQualifiedId;
            attachChunkResource(record.islandHandle, chunk);
            emitLifecycle(rootId, 'template:insular-hydrated', {
                templateQualifiedId: chunk.template.qualifiedId,
                executionMode: chunk.executionMode,
                applied: false,
                bindingCount: typeof record.bindingSession.getBindingCount === 'function'
                    ? record.bindingSession.getBindingCount()
                    : 0,
                hydrationStrategy: 'insular_rebind'
            });
            return Object.freeze({
                executionMode: clampString(resultExecutionMode, request.executionMode),
                plan: chunk.plan,
                chunk,
                islandHandle: record.islandHandle,
                bindingSession: record.bindingSession,
                applied: false,
                deferred: false,
                hydrated: true,
                reused: true,
                hydrationStrategy: 'insular_rebind'
            });
        }

        function project(request, chunk, options = {}, hydrate = false) {
            const reused = tryInsularRebind(
                request,
                chunk,
                options,
                hydrate ? 'hydrate_prerendered' : 'runtime_render'
            );
            if (reused) return reused;
            const resolvedPublicApi = resolvePublicApi();
            const hydration = toPlainObject(request.hydration);
            const islandInput = {
                rootId: request.rootId,
                element: request.resolvedElement || request.target,
                elementId: request.elementId,
                selector: request.selector,
                namespace: request.namespace,
                ownershipMode: request.ownershipMode || (hydrate ? 'hydrate_existing' : 'replace_children'),
                clearChildrenBeforeMount: hydrate ? false : hydration.clearChildrenBeforeMount !== false,
                metadata: {
                    templateQualifiedId: chunk.template.qualifiedId,
                    executionMode: chunk.executionMode,
                    ...(hydrate ? { hydratedFromChunk: true } : {})
                }
            };
            const islandHandle = hydrate
                ? resolvedPublicApi.hydrateIsland(islandInput)
                : resolvedPublicApi.mountIsland(islandInput);
            const applied = hydrate && options.ensureMarkup !== true
                ? false
                : applyPrerenderChunk(islandHandle.getElement(), chunk, options);
            attachChunkResource(islandHandle, chunk);
            const bindingSession = applyRuntimeBindings(islandHandle.getElement(), chunk, {
                ...options,
                rootId: request.rootId,
                modelSnapshot: request.model
            });
            attachBindingSessionResource(islandHandle, bindingSession, chunk);
            rememberBindingSession(request, islandHandle, bindingSession, chunk);
            emitLifecycle(request.rootId, hydrate ? 'template:hydrated' : 'template:rendered', {
                templateQualifiedId: chunk.template.qualifiedId,
                executionMode: chunk.executionMode,
                ...(hydrate ? { adoptedMarkup: applied } : { applied }),
                bindingCount: bindingSession && typeof bindingSession.getBindingCount === 'function'
                    ? bindingSession.getBindingCount()
                    : 0
            });
            return Object.freeze({
                executionMode: hydrate ? 'hydrate_prerendered' : 'runtime_render',
                plan: chunk.plan,
                chunk,
                islandHandle,
                bindingSession,
                applied,
                deferred: false
            });
        }

        function createErrorSnapshot(error) {
            return Object.freeze({
                name: clampString(error && error.name, 'Error'),
                message: clampString(error && error.message, String(error || 'Unbekannter Rmt-Template-Fehler.'))
            });
        }

        function projectErrorBoundary(request = {}, chunk = null, error, options = {}, executionMode = '') {
            const boundary = toPlainObject(
                request.errorBoundary
                || (chunk && chunk.hydration && chunk.hydration.errorBoundary)
                || (request.template && request.template.errorBoundary)
            );
            if (boundary.enabled !== true) return null;
            const rootElement = resolveTarget(request.resolvedElement || request.target, request);
            let element = rootElement;
            const boundaryTarget = clampString(boundary.target, '');
            if (boundaryTarget && rootElement && typeof rootElement.querySelector === 'function') {
                element = rootElement.querySelector(boundaryTarget) || resolveTarget(boundaryTarget, { selector: boundaryTarget });
            }
            if (!element) return null;

            let fallbackMarkup = String(boundary.fallbackMarkup || '');
            let fallbackText = String(boundary.fallbackText || '');
            if (!fallbackMarkup && !fallbackText && boundary.fallbackTemplate) {
                try {
                    const boundaryModel = boundary.modelSource
                        ? executionModel.getObjectPathValue(request.model, boundary.modelSource, {})
                        : request.model;
                    const fallbackChunk = executionModel.prerenderTemplate({
                        ...request,
                        executionMode: 'runtime_render',
                        template: boundary.fallbackTemplate,
                        chunk: null,
                        model: boundaryModel
                    }, options);
                    fallbackMarkup = fallbackChunk && fallbackChunk.markup ? String(fallbackChunk.markup.html || '') : '';
                    fallbackText = fallbackChunk && fallbackChunk.markup ? String(fallbackChunk.markup.textContent || '') : '';
                } catch (_error) {
                    fallbackMarkup = '';
                    fallbackText = '';
                }
            }
            if (fallbackMarkup) {
                const renderer = getRuntimeRenderer();
                if (!renderer || typeof renderer.commitTrustedHtml !== 'function' || !renderer.commitTrustedHtml(element, fallbackMarkup, {
                    scope: 'template',
                    sink: 'fallback.html',
                    sourceRef: `template:${request.template && request.template.qualifiedId ? request.template.qualifiedId : 'error-boundary'}:fallback`,
                    metadata: {
                        boundaryName: clampString(boundary.name, ''),
                        boundaryTarget,
                        executionMode
                    }
                })) return null;
            } else if (fallbackText && 'textContent' in element) {
                element.textContent = fallbackText;
            } else return null;

            const errorSnapshot = createErrorSnapshot(error);
            const eventName = clampString(boundary.emitEvent, 'template:error-boundary');
            emitLifecycle(request.rootId, eventName, {
                templateQualifiedId: request.template && request.template.qualifiedId,
                error: errorSnapshot,
                boundary: { name: clampString(boundary.name, ''), target: boundaryTarget }
            });
            return Object.freeze({
                executionMode: clampString(executionMode, request.executionMode || 'runtime_render'),
                plan: chunk && chunk.plan ? chunk.plan : executionModel.createExecutionPlan(request, options),
                chunk,
                islandHandle: null,
                bindingSession: null,
                applied: true,
                deferred: false,
                errorBoundary: Object.freeze({
                    handled: true,
                    name: clampString(boundary.name, ''),
                    target: boundaryTarget,
                    eventName
                }),
                error: errorSnapshot
            });
        }

        const rendererDelegates = [
            'listTrustVerdicts', 'getPanicSnapshot', 'listPanicEvents', 'beginPanicRecovery',
            'completePanicRecovery', 'failPanicRecovery', 'rememberSafeSnapshot',
            'getLastSafeSnapshot', 'listSafeSnapshots', 'quarantineScope',
            'restoreLastSafeSnapshot', 'renderSafeFallback', 'recoverFromPanic',
            'listRecoveryOutcomes', 'listPanicRecoveryRecords', 'getPanicRecoverySnapshot',
            'listQuarantinedScopes', 'isScopeQuarantined'
        ];
        const api = {
            applyPrerenderChunk,
            applyRuntimeBindings,
            getRuntimeRenderer,
            project,
            projectErrorBoundary,
            resolveTarget,
            resolveTargetRecord,
            tryInsularRebind
        };
        rendererDelegates.forEach((methodName) => {
            api[methodName] = (...args) => {
                const renderer = getRuntimeRenderer();
                if (!renderer || typeof renderer[methodName] !== 'function') {
                    if (recoveryModel && typeof recoveryModel[methodName] === 'function') {
                        return recoveryModel[methodName](...args);
                    }
                    if (methodName.startsWith('list')) return [];
                    return methodName.startsWith('is') ? false : null;
                }
                return renderer[methodName](...args);
            };
        });
        return Object.freeze(api);
    };
})(__XTENDRMT_GLOBAL__);
