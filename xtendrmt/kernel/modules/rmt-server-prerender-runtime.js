/* modules/rmt-server-prerender-runtime.js */
(function registerRmtServerPrerenderRuntimeModule(global) {
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

    appModules.createRmtServerPrerenderRuntime = function createRmtServerPrerenderRuntime(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = resolveDocumentTarget(deps, windowTarget);
        const createRmtBrowserRuntimeFactory = resolveFactory('createRmtBrowserRuntime', deps.createRmtBrowserRuntime);

        if (typeof createRmtBrowserRuntimeFactory !== 'function') {
            throw new Error('RMT ServerRuntime benoetigt createRmtBrowserRuntime().');
        }

        const browserRuntime = deps.browserRuntime
            || deps.baseRuntime
            || createRmtBrowserRuntimeFactory({
                ...deps,
                windowTarget,
                documentTarget
            });
        if (!browserRuntime || typeof browserRuntime.mount !== 'function') {
            throw new Error('RmtServerPrerenderRuntime benoetigt eine gueltige BrowserRuntime.');
        }

        const templateApi = deps.templateApi
            || (typeof browserRuntime.getTemplateApi === 'function' ? browserRuntime.getTemplateApi() : null);
        if (!templateApi || typeof templateApi.createServerAdapter !== 'function') {
            throw new Error('RmtServerPrerenderRuntime benoetigt eine gueltige TemplateApi mit Server-Adapter-Unterstuetzung.');
        }

        const browserDefaults = typeof browserRuntime.getDefaults === 'function'
            ? browserRuntime.getDefaults()
            : {};
        const runtimeDefaults = normalizeDefaults(
            deps.defaults || {
                namespace: deps.namespace || deps.defaultNamespace || browserDefaults.namespace,
                metadata: {
                    ...(isObjectLike(browserDefaults.metadata) ? browserDefaults.metadata : {}),
                    ...(isObjectLike(deps.metadata) ? deps.metadata : {})
                }
            },
            clampString(
                deps.namespace
                || deps.defaultNamespace
                || browserDefaults.namespace,
                ''
            )
        );

        let serverTransport = deps.serverTransport
            || deps.templateServerAdapter
            || null;

        function createServerTransport(options = {}) {
            return templateApi.createServerAdapter({
                ...(isObjectLike(deps.serverTransportOptions) ? deps.serverTransportOptions : {}),
                ...options,
                dispatchPrerenderEnvelope: typeof options.dispatchPrerenderEnvelope === 'function'
                    ? options.dispatchPrerenderEnvelope
                    : deps.dispatchPrerenderEnvelope,
                windowTarget,
                documentTarget
            });
        }

        function getServerTransport() {
            if (serverTransport) return serverTransport;
            serverTransport = createServerTransport();
            return serverTransport;
        }

        function requestPrerender(templateOrRequest, model, options) {
            const invocation = buildPrerenderInvocation(templateOrRequest, model, options, runtimeDefaults);
            return getServerTransport().requestPrerender(invocation.request, invocation.executionOptions);
        }

        function hydrateResponse(responseInput = {}, requestInputOrOptions = {}, explicitOptions = {}) {
            const looksLikeRequest = isTemplateRequestLike(requestInputOrOptions)
                || (
                    isObjectLike(requestInputOrOptions)
                    && (
                        Object.prototype.hasOwnProperty.call(requestInputOrOptions, 'model')
                        || Object.prototype.hasOwnProperty.call(requestInputOrOptions, 'rootId')
                        || Object.prototype.hasOwnProperty.call(requestInputOrOptions, 'target')
                    )
                );
            const requestInput = looksLikeRequest ? requestInputOrOptions : {};
            const options = looksLikeRequest ? explicitOptions : requestInputOrOptions;
            return getServerTransport().hydrateResponse(responseInput, requestInput, options);
        }

        function execute(targetOrRequest, templateRef, model, options) {
            const invocation = buildTemplateInvocation(targetOrRequest, templateRef, model, options, runtimeDefaults);
            return getServerTransport().execute(invocation.request, invocation.executionOptions);
        }

        function withDefaults(nextDefaults = {}) {
            const safeNextDefaults = isObjectLike(nextDefaults) ? nextDefaults : {};
            const mergedDefaults = {
                ...runtimeDefaults,
                ...safeNextDefaults,
                metadata: {
                    ...(isObjectLike(runtimeDefaults.metadata) ? runtimeDefaults.metadata : {}),
                    ...(isObjectLike(safeNextDefaults.metadata) ? safeNextDefaults.metadata : {})
                }
            };
            const nextBrowserRuntime = typeof browserRuntime.withDefaults === 'function'
                ? browserRuntime.withDefaults(safeNextDefaults)
                : createRmtBrowserRuntimeFactory({
                    ...deps,
                    windowTarget,
                    documentTarget,
                    defaults: mergedDefaults
                });
            return appModules.createRmtServerPrerenderRuntime({
                ...deps,
                windowTarget,
                documentTarget,
                browserRuntime: nextBrowserRuntime,
                templateApi: typeof nextBrowserRuntime.getTemplateApi === 'function'
                    ? nextBrowserRuntime.getTemplateApi()
                    : templateApi,
                defaults: mergedDefaults
            });
        }

        return Object.freeze({
            ...browserRuntime,
            runtimeKind: 'server_prerender',
            defaults: runtimeDefaults,
            createServerAdapter: createServerTransport,
            createServerTransport,
            execute,
            executeTemplate: execute,
            getBrowserRuntime: () => browserRuntime,
            getDefaults: () => runtimeDefaults,
            getServerAdapter: getServerTransport,
            getServerTransport,
            getServerTransportDispatcher: () => (
                typeof deps.dispatchPrerenderEnvelope === 'function'
                    ? deps.dispatchPrerenderEnvelope
                    : null
            ),
            hydrateResponse,
            prerender: requestPrerender,
            prerenderTemplate: requestPrerender,
            render: execute,
            renderTemplate: execute,
            requestPrerender,
            withDefaults
        });
    };
})(__XTENDRMT_GLOBAL__);
