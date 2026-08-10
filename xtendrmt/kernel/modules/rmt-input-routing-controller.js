/* modules/rmt-input-routing-controller.js */
(function registerRmtInputRoutingController(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const DOCUMENT_VERSION = '1.0';
    const RUNTIME_REGISTRY_SCHEMA = 'xtend.rmt.runtime-registry.v1';
    const XROUTER_ADAPTER_SCHEMA = 'xtend.rmt.xrouter-adapter.v1';
    const XROUTER_ADAPTER_ID = 'xtend.xrouter';
    const XROUTER_ADAPTER_DIAGNOSTIC_CODES = Object.freeze([
        'rmt.xrouter.route.missing_path',
        'rmt.xrouter.route.missing_component',
        'rmt.xrouter.target.missing',
        'rmt.xrouter.navigation.skipped'
    ]);

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
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : {};
    }

    function uniqueValues(values = []) {
        return Array.from(new Set(values
            .map((value) => clampString(value, ''))
            .filter(Boolean)));
    }

    function normalizeScheduleReference(scheduleRef) {
        if (typeof scheduleRef === 'string') return clampString(scheduleRef, '');
        const schedule = toPlainObject(scheduleRef);
        return clampString(schedule.ref || schedule.id || schedule.name, '');
    }

    function normalizeTemplateReference(templateRef) {
        if (typeof templateRef === 'string') return clampString(templateRef, '');
        const template = toPlainObject(templateRef);
        const namespace = clampString(template.namespace, '');
        const id = clampString(template.id || template.ref || template.template, '');
        if (!id) return '';
        if (id.includes(':') || !namespace) return id;
        return namespace + ':' + id;
    }

    function createXRouterDiagnostic(code, message, operation, phase, metadata = {}, level = 'warn') {
        return Object.freeze({
            level: clampString(level, 'warn'),
            code: clampString(code, ''),
            message: clampString(message, ''),
            adapterId: XROUTER_ADAPTER_ID,
            operation: clampString(operation, ''),
            phase: clampString(phase, ''),
            metadata: cloneSerializable(metadata, {})
        });
    }

    function createXRouterResult(options = {}) {
        return Object.freeze({
            ok: options.ok !== false,
            status: clampString(options.status, options.ok === false ? 'failed' : 'ok'),
            adapterId: clampString(options.adapterId, XROUTER_ADAPTER_ID),
            operation: clampString(options.operation, ''),
            phase: clampString(options.phase, ''),
            handle: cloneSerializable(options.handle, null),
            diagnostics: Object.freeze((Array.isArray(options.diagnostics) ? options.diagnostics : []).map((entry) => Object.freeze(entry))),
            metadata: cloneSerializable(options.metadata, {})
        });
    }

    function hasSerializableKeys(value) {
        return !!value && typeof value === 'object' && Object.keys(value).length > 0;
    }

    function normalizeXRouterRouteEntry(routeEntry = {}, options = {}) {
        const entry = toPlainObject(routeEntry);
        const record = toPlainObject(entry.record || entry);
        const metadata = toPlainObject(record.metadata);
        const seo = toPlainObject(metadata.seo);
        const lifecycle = toPlainObject(record.lifecycle);
        const id = clampString(entry.id || record.id, '');
        const path = clampString(entry.path || record.path, '');
        const component = clampString(entry.componentId || record.component || record.tag || record.renderer, '');
        const template = normalizeTemplateReference(entry.templateRef || record.template);
        const schedule = normalizeScheduleReference(entry.scheduleRef || record.schedule);
        const redirect = clampString(entry.redirect || record.redirect, '');
        const mappedRoute = {
            id,
            path,
            router: clampString(entry.routerId || record.router, XROUTER_ADAPTER_ID),
            component,
            title: clampString(record.title || metadata.title || seo.title, ''),
            documentTitle: clampString(record.documentTitle || record.document_title || metadata.documentTitle || metadata.document_title || seo.documentTitle || seo.document_title, ''),
            titleTemplate: clampString(record.titleTemplate || record.documentTitleTemplate || record.title_template || record.document_title_template || metadata.titleTemplate || metadata.documentTitleTemplate || metadata.title_template || metadata.document_title_template || seo.titleTemplate || seo.documentTitleTemplate, ''),
            metaDescription: clampString(record.metaDescription || record.description || metadata.metaDescription || metadata.description || seo.metaDescription || seo.description, ''),
            metaKeywords: Array.isArray(record.metaKeywords || record.keywords || metadata.metaKeywords || metadata.keywords || seo.metaKeywords || seo.keywords)
                ? (record.metaKeywords || record.keywords || metadata.metaKeywords || metadata.keywords || seo.metaKeywords || seo.keywords).join(', ')
                : clampString(record.metaKeywords || record.keywords || metadata.metaKeywords || metadata.keywords || seo.metaKeywords || seo.keywords, ''),
            redirect,
            template,
            schedule,
            params: cloneSerializable(record.params, {}),
            query: cloneSerializable(record.query, {}),
            metadata: cloneSerializable(metadata, {}),
            lifecycle: cloneSerializable(lifecycle, {}),
            import: clampString(record.import || record.importUrl || record.moduleRef || metadata.import || metadata.importUrl, ''),
            targetKind: clampString(entry.targetKind || (component ? 'component' : (template ? 'template' : (redirect ? 'redirect' : 'none'))), 'none'),
            sourceRoute: cloneSerializable(record, {})
        };
        const attributes = {
            path: mappedRoute.path,
            component: mappedRoute.component,
            title: mappedRoute.title,
            'document-title': mappedRoute.documentTitle,
            'title-template': mappedRoute.titleTemplate,
            'meta-description': mappedRoute.metaDescription,
            'meta-keywords': mappedRoute.metaKeywords,
            redirect: mappedRoute.redirect,
            import: mappedRoute.import,
            'data-rmt-route-id': mappedRoute.id,
            'data-rmt-router': mappedRoute.router,
            'data-rmt-template': mappedRoute.template,
            'data-rmt-schedule': mappedRoute.schedule
        };
        if (hasSerializableKeys(mappedRoute.params)) {
            attributes['data-rmt-params'] = JSON.stringify(mappedRoute.params);
        }
        if (hasSerializableKeys(mappedRoute.query)) {
            attributes['data-rmt-query'] = JSON.stringify(mappedRoute.query);
        }
        if (hasSerializableKeys(mappedRoute.metadata)) {
            attributes['data-rmt-metadata'] = JSON.stringify(mappedRoute.metadata);
        }
        if (lifecycle.beforeEnter && typeof lifecycle.beforeEnter === 'object') {
            attributes['before-enter'] = clampString(lifecycle.beforeEnter.commandName || lifecycle.beforeEnter.handler || '', '');
        }
        Object.keys(attributes).forEach((key) => {
            if (!attributes[key]) delete attributes[key];
        });
        return Object.freeze({
            ...mappedRoute,
            attributes: Object.freeze(attributes),
            scheduleRef: mappedRoute.schedule,
            routeId: mappedRoute.id,
            adapterId: XROUTER_ADAPTER_ID,
            registryIndex: typeof entry.index === 'number' ? entry.index : -1,
            children: Object.freeze((Array.isArray(record.children) ? record.children : [])
                .map((child, childIndex) => normalizeXRouterRouteEntry({
                    ...child,
                    index: childIndex
                }, options)))
        });
    }

    function resolveXRouterRegistry(routesInput, rmtFormat, options = {}) {
        if (Array.isArray(routesInput)) {
            return Object.freeze({
                schema: RUNTIME_REGISTRY_SCHEMA,
                status: routesInput.length > 0 ? 'ready' : 'empty',
                routes: Object.freeze(routesInput),
                routeRegistry: Object.freeze({ byRouter: {}, byId: {}, byPath: {}, byComponent: {} }),
                diagnostics: Object.freeze([]),
                sourceDiagnostics: Object.freeze([])
            });
        }
        const rawInput = routesInput && typeof routesInput === 'object' ? routesInput : {};
        if (rawInput.schema === RUNTIME_REGISTRY_SCHEMA || (Array.isArray(rawInput.routes) && rawInput.routeRegistry)) {
            return rawInput;
        }
        return rmtFormat.createRuntimeRegistries(rawInput, options);
    }

    function selectXRouterRouteEntries(registry, adapterId = XROUTER_ADAPTER_ID) {
        const routes = Array.isArray(registry.routes) ? registry.routes : [];
        const routeIds = registry.routeRegistry
            && registry.routeRegistry.byRouter
            && Array.isArray(registry.routeRegistry.byRouter[adapterId])
            ? registry.routeRegistry.byRouter[adapterId]
            : null;
        if (routeIds) {
            return routeIds
                .map((routeId) => registry.routeRegistry.byId && registry.routeRegistry.byId[routeId])
                .filter(Boolean);
        }
        return routes.filter((entry) => clampString(entry.routerId || (entry.record && entry.record.router) || entry.router, adapterId) === adapterId);
    }

    function normalizeXRouterRouteMapping(routesInput, rmtFormat, options = {}) {
        const adapterId = clampString(options.adapterId, XROUTER_ADAPTER_ID);
        const registry = resolveXRouterRegistry(routesInput, rmtFormat, options);
        const diagnostics = [];
        const mappedRoutes = Object.freeze(selectXRouterRouteEntries(registry, adapterId)
            .map((entry) => normalizeXRouterRouteEntry(entry, options)));
        mappedRoutes.forEach((route, index) => {
            if (!route.path) {
                diagnostics.push(createXRouterDiagnostic(
                    'rmt.xrouter.route.missing_path',
                    `XRouter route "${route.id || index}" has no path.`,
                    'registerRoutes',
                    'mount',
                    { routeId: route.id, index }
                ));
            }
            if (!route.component && !route.redirect) {
                diagnostics.push(createXRouterDiagnostic(
                    'rmt.xrouter.route.missing_component',
                    `XRouter route "${route.id || route.path || index}" has no component or redirect target.`,
                    'registerRoutes',
                    'mount',
                    { routeId: route.id, path: route.path, index }
                ));
            }
        });
        return Object.freeze({
            schema: XROUTER_ADAPTER_SCHEMA,
            adapterId,
            status: diagnostics.length > 0 ? 'mapped_with_diagnostics' : 'mapped',
            routes: mappedRoutes,
            diagnostics: Object.freeze(diagnostics),
            sourceDiagnostics: Object.freeze(cloneSerializable(registry.sourceDiagnostics || registry.diagnostics, [])),
            routeCount: mappedRoutes.length,
            scheduleRefs: uniqueValues(mappedRoutes.map((route) => route.scheduleRef)),
            modelFields: Object.freeze(['routeId', 'path', 'component', 'title', 'documentTitle', 'params', 'query', 'template', 'scheduleRef', 'metadata'])
        });
    }

    function normalizeXRouterNavigationTarget(target, mapping = null) {
        if (typeof target === 'string') {
            return Object.freeze({
                path: target.startsWith('/') ? target : `/${target}`,
                routeId: '',
                params: Object.freeze({}),
                query: Object.freeze({}),
                metadata: Object.freeze({})
            });
        }
        const rawTarget = toPlainObject(target);
        const routeId = clampString(rawTarget.routeId || rawTarget.id || rawTarget.route, '');
        let path = clampString(rawTarget.path || rawTarget.to || rawTarget.href, '');
        if (!path && mapping && routeId) {
            const mappedRoute = Array.isArray(mapping.routes)
                ? mapping.routes.find((route) => route.id === routeId)
                : null;
            path = mappedRoute ? mappedRoute.path : '';
        }
        return Object.freeze({
            path: path && path.startsWith('/') ? path : (path ? `/${path}` : ''),
            routeId,
            params: cloneSerializable(rawTarget.params, {}),
            query: cloneSerializable(rawTarget.query, {}),
            metadata: cloneSerializable(rawTarget.metadata, {})
        });
    }

    appModules.createRmtXRouterAdapter = function createRmtXRouterAdapter(deps = {}) {
        const rmtFormat = deps.rmtFormat || appModules.createRmtFormat();
        const adapterId = clampString(deps.adapterId, XROUTER_ADAPTER_ID);

        function getRouterTarget(options = {}) {
            return options.routerElement || options.target || deps.routerElement || deps.target || null;
        }

        function mapRoutes(routesInput = {}, options = {}) {
            return normalizeXRouterRouteMapping(routesInput, rmtFormat, {
                ...deps,
                ...options,
                adapterId
            });
        }

        function registerRoutes(routesInput = {}, options = {}) {
            const mapping = mapRoutes(routesInput, options);
            const diagnostics = mapping.diagnostics.slice();
            const target = getRouterTarget(options);
            let targetResult = null;
            if (target && typeof target.registerRoutes === 'function') {
                targetResult = target.registerRoutes(mapping.routes, {
                    ...options,
                    adapterId,
                    source: XROUTER_ADAPTER_SCHEMA
                });
            } else if (!target) {
                diagnostics.push(createXRouterDiagnostic(
                    'rmt.xrouter.target.missing',
                    'XRouter adapter mapped routes without a router target; adapter returned a transferable route configuration.',
                    'registerRoutes',
                    'mount',
                    { routeCount: mapping.routeCount },
                    'info'
                ));
            }
            return createXRouterResult({
                ok: mapping.routeCount > 0,
                status: diagnostics.some((entry) => entry.level === 'warn' || entry.level === 'error')
                    ? 'degraded'
                    : 'ok',
                adapterId,
                operation: 'registerRoutes',
                phase: 'mount',
                handle: {
                    mapping,
                    targetResult
                },
                diagnostics,
                metadata: {
                    routeCount: mapping.routeCount,
                    scheduleRefs: mapping.scheduleRefs,
                    registeredOnTarget: !!target && typeof target.registerRoutes === 'function'
                }
            });
        }

        function navigate(to, options = {}) {
            const mapping = options.mapping || null;
            const target = getRouterTarget(options);
            const normalizedTarget = normalizeXRouterNavigationTarget(to, mapping);
            const diagnostics = [];
            let targetResult = null;
            if (target && typeof target.navigate === 'function') {
                targetResult = target.navigate(normalizedTarget.path || normalizedTarget, options);
            } else if (target && typeof target._navigateTo === 'function' && normalizedTarget.path) {
                targetResult = target._navigateTo(normalizedTarget.path, {
                    routeId: normalizedTarget.routeId,
                    params: normalizedTarget.params,
                    query: normalizedTarget.query,
                    metadata: normalizedTarget.metadata
                });
            } else if ((options.navigationPort || deps.navigationPort) && typeof (options.navigationPort || deps.navigationPort).navigate === 'function' && normalizedTarget.path) {
                targetResult = (options.navigationPort || deps.navigationPort).navigate(normalizedTarget, {
                    adapterId,
                    operation: 'navigate'
                });
            } else {
                diagnostics.push(createXRouterDiagnostic(
                    'rmt.xrouter.navigation.skipped',
                    'XRouter adapter could not execute navigation because no router target or navigation port was available.',
                    'navigate',
                    'activate',
                    { target: normalizedTarget }
                ));
            }
            return createXRouterResult({
                ok: diagnostics.length === 0,
                status: diagnostics.length > 0 ? 'skipped' : 'ok',
                adapterId,
                operation: 'navigate',
                phase: 'activate',
                handle: {
                    target: normalizedTarget,
                    targetResult
                },
                diagnostics,
                metadata: {
                    routeId: normalizedTarget.routeId,
                    path: normalizedTarget.path,
                    params: normalizedTarget.params,
                    query: normalizedTarget.query
                }
            });
        }

        function emitDiagnostic(event = {}, payload = {}) {
            return createXRouterResult({
                ok: true,
                status: 'ok',
                adapterId,
                operation: 'emitDiagnostic',
                phase: 'diagnostics',
                handle: {
                    event: cloneSerializable(event, {}),
                    payload: cloneSerializable(payload, {})
                },
                diagnostics: [createXRouterDiagnostic(
                    clampString(event.code, 'rmt.xrouter.diagnostic'),
                    clampString(event.message, 'XRouter adapter diagnostic.'),
                    'emitDiagnostic',
                    'diagnostics',
                    payload,
                    clampString(event.level, 'info')
                )],
                metadata: payload
            });
        }

        return Object.freeze({
            id: adapterId,
            schema: XROUTER_ADAPTER_SCHEMA,
            kind: 'router_adapter',
            version: DOCUMENT_VERSION,
            runtimeSurface: Object.freeze(['registerRoutes', 'navigate', 'emitDiagnostic']),
            capabilities: Object.freeze({
                providedCapabilities: Object.freeze(['routes', 'navigation', 'params', 'query', 'diagnostics', 'scheduleRefs']),
                requiredCapabilities: Object.freeze([]),
                preferredCapabilities: Object.freeze(['history', 'hash', 'routeLifecycle'])
            }),
            definition: Object.freeze({
                id: adapterId,
                kind: 'router_adapter',
                version: DOCUMENT_VERSION,
                runtimeSurface: Object.freeze(['registerRoutes', 'navigate', 'emitDiagnostic']),
                capabilities: Object.freeze({
                    providedCapabilities: Object.freeze(['routes', 'navigation', 'params', 'query', 'diagnostics', 'scheduleRefs'])
                }),
                kernelVisible: false,
                metadata: Object.freeze({
                    schema: XROUTER_ADAPTER_SCHEMA,
                    inputContract: RUNTIME_REGISTRY_SCHEMA
                })
            }),
            mapRoute: (routeEntry, options = {}) => normalizeXRouterRouteEntry(routeEntry, options),
            mapRoutes,
            registerRoutes,
            navigate,
            emitDiagnostic,
            listDiagnosticCodes: () => XROUTER_ADAPTER_DIAGNOSTIC_CODES.slice()
        });
    };

})(__XTENDRMT_GLOBAL__);
