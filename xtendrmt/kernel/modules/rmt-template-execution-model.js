/* modules/rmt-template-execution-model.js */
(function registerRmtTemplateExecutionModelModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const EXECUTION_MODES = Object.freeze([
        'runtime_render',
        'hydrate_prerendered',
        'worker_prerender_hydrate',
        'server_prerender_hydrate',
        'prerender_only'
    ]);
    const PRERENDER_REQUEST_KIND = 'rmt_template_prerender_request';
    const PRERENDER_REQUEST_VERSION = '1.0';
    const CHUNK_KIND = 'rmt_template_chunk';
    const CHUNK_VERSION = '1.0';
    const MISSING_VALUE = Symbol('rmt_template_execution_missing_value');

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

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeExecutionMode(value, fallbackValue = 'runtime_render') {
        const safeValue = clampString(value, fallbackValue);
        return EXECUTION_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function inferTransportFromExecutionMode(executionMode) {
        if (executionMode === 'worker_prerender_hydrate') return 'worker';
        if (executionMode === 'server_prerender_hydrate') return 'server';
        return 'main';
    }

    function isPreparedTemplate(value) {
        return !!value
            && typeof value === 'object'
            && clampString(value.kind, '') === 'rmt_prepared_template'
            && clampString(value.qualifiedId, '');
    }

    function getObjectPathValue(source, path, fallbackValue = MISSING_VALUE) {
        const safePath = clampString(path, '');
        if (!safePath) return source === undefined ? fallbackValue : source;
        const segments = safePath.split('.').map((segment) => clampString(segment, ''));
        let currentValue = source;
        for (let index = 0; index < segments.length; index += 1) {
            const segment = segments[index];
            if (!segment || currentValue === null || currentValue === undefined) return fallbackValue;
            if (typeof currentValue !== 'object' && typeof currentValue !== 'function') return fallbackValue;
            if (!Object.prototype.hasOwnProperty.call(currentValue, segment)) return fallbackValue;
            currentValue = currentValue[segment];
        }
        return currentValue;
    }

    function setObjectPathValue(target, path, value) {
        const safePath = clampString(path, '');
        if (!safePath || !target || typeof target !== 'object') return false;
        const segments = safePath.split('.').map((segment) => clampString(segment, '')).filter(Boolean);
        if (segments.length === 0) return false;
        let currentTarget = target;
        for (let index = 0; index < segments.length - 1; index += 1) {
            const segment = segments[index];
            if (!currentTarget[segment] || typeof currentTarget[segment] !== 'object' || Array.isArray(currentTarget[segment])) {
                currentTarget[segment] = {};
            }
            currentTarget = currentTarget[segment];
        }
        currentTarget[segments[segments.length - 1]] = value;
        return true;
    }

    appModules.createRmtTemplateExecutionModel = function createRmtTemplateExecutionModel(deps = {}) {
        const registry = deps.registry || deps.templateRegistry || null;
        if (!registry || typeof registry.resolveTemplate !== 'function') {
            throw new Error('RmtTemplateExecutionModel benoetigt einen gueltigen TemplateRegistryPort.');
        }
        let autoRootIdCounter = 0;
        let logicalClock = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalClock += 1;
                return logicalClock;
            });

        function resolveTemplate(templateRef, options = {}) {
            if (isPreparedTemplate(templateRef)) return cloneSerializable(templateRef, null);
            if (templateRef && typeof templateRef === 'object') {
                if (isPreparedTemplate(templateRef.preparedTemplate)) {
                    return cloneSerializable(templateRef.preparedTemplate, null);
                }
                if (isPreparedTemplate(templateRef.template)) {
                    return cloneSerializable(templateRef.template, null);
                }
            }
            const resolvedTemplate = registry.resolveTemplate(templateRef, options);
            if (!resolvedTemplate) {
                throw new Error('RmtTemplateExecutionPath konnte das angeforderte Template nicht aufloesen.');
            }
            return resolvedTemplate;
        }

        function applyTemplatePropDefaults(templateRecord, modelInput = {}) {
            const modelSnapshot = cloneSerializable(modelInput, {});
            const props = Array.isArray(templateRecord && templateRecord.props) ? templateRecord.props : [];
            props.forEach((prop) => {
                const rawProp = toPlainObject(prop);
                if (rawProp.hasDefault !== true) return;
                const propName = clampString(rawProp.name || rawProp.prop, '');
                const targetPath = clampString(rawProp.source || rawProp.path, propName ? `props.${propName}` : '');
                if (!targetPath || getObjectPathValue(modelSnapshot, targetPath, MISSING_VALUE) !== MISSING_VALUE) return;
                setObjectPathValue(modelSnapshot, targetPath, cloneSerializable(rawProp.defaultValue, null));
            });
            return modelSnapshot;
        }

        function resolveOpaqueElement(target, rawRequest = {}) {
            if (rawRequest.resolvedElement && typeof rawRequest.resolvedElement === 'object') {
                return rawRequest.resolvedElement;
            }
            if (target && typeof target === 'object' && target.element) return target.element;
            return target && typeof target === 'object' ? target : null;
        }

        function resolveRootId(request = {}, resolvedElement = null) {
            const explicitRootId = clampString(request.rootId || (request.target && request.target.rootId), '');
            if (explicitRootId) return explicitRootId;
            if (resolvedElement && typeof resolvedElement.id === 'string' && resolvedElement.id.trim()) {
                return `template:${resolvedElement.id.trim()}`;
            }
            autoRootIdCounter += 1;
            return `rmt:template:${autoRootIdCounter}`;
        }

        function normalizeRequest(requestInput = {}, options = {}) {
            const rawRequest = requestInput && typeof requestInput === 'object' ? requestInput : {};
            const target = options.target !== undefined ? options.target : rawRequest.target;
            const resolvedElement = resolveOpaqueElement(target, rawRequest);
            const rootId = resolveRootId(rawRequest, resolvedElement);
            const namespace = clampString(
                options.namespace || rawRequest.namespace || (rawRequest.template && rawRequest.template.namespace),
                ''
            );
            const templateRef = rawRequest.template !== undefined ? rawRequest.template : rawRequest.templateRef;
            const resolvedTemplate = resolveTemplate(templateRef, { namespace });
            const templateHydration = toPlainObject(resolvedTemplate.hydration);
            const executionMode = normalizeExecutionMode(
                options.executionMode || rawRequest.executionMode || templateHydration.executionMode || templateHydration.mode,
                'runtime_render'
            );
            return Object.freeze({
                executionMode,
                prerenderTransport: clampString(
                    options.prerenderTransport || rawRequest.prerenderTransport || templateHydration.transport,
                    inferTransportFromExecutionMode(executionMode)
                ),
                rootId,
                target,
                resolvedElement,
                elementId: clampString(
                    options.elementId || rawRequest.elementId || (resolvedElement && resolvedElement.id) || (target && target.elementId),
                    ''
                ),
                selector: clampString(options.selector || rawRequest.selector || (target && target.selector), ''),
                namespace: namespace || resolvedTemplate.namespace || '',
                ownershipMode: clampString(
                    options.ownershipMode || rawRequest.ownershipMode || templateHydration.ownershipMode,
                    executionMode === 'runtime_render' ? 'replace_children' : 'hydrate_existing'
                ),
                template: resolvedTemplate,
                props: cloneSerializable(resolvedTemplate.props, []),
                hydration: cloneSerializable(templateHydration, {}),
                errorBoundary: cloneSerializable(resolvedTemplate.errorBoundary, {}),
                model: applyTemplatePropDefaults(
                    resolvedTemplate,
                    options.model !== undefined ? options.model : rawRequest.model
                ),
                metadata: cloneSerializable(options.metadata !== undefined ? options.metadata : rawRequest.metadata, {}),
                chunk: rawRequest.chunk || null
            });
        }

        function createExecutionPlan(requestInput = {}, options = {}) {
            const request = normalizeRequest(requestInput, options);
            const phases = [];
            if (request.executionMode === 'runtime_render') {
                phases.push({ id: 'main_render', kind: 'render', transport: 'main' });
            } else if (request.executionMode === 'hydrate_prerendered') {
                phases.push({ id: 'client_hydrate', kind: 'hydrate', transport: 'main' });
            } else if (request.executionMode === 'worker_prerender_hydrate') {
                phases.push({ id: 'worker_prerender', kind: 'prerender', transport: 'worker' });
                phases.push({ id: 'chunk_transfer', kind: 'transfer', transport: 'worker_to_main' });
                phases.push({ id: 'client_hydrate', kind: 'hydrate', transport: 'main' });
            } else if (request.executionMode === 'server_prerender_hydrate') {
                phases.push({ id: 'server_prerender', kind: 'prerender', transport: 'server' });
                phases.push({ id: 'html_delivery', kind: 'transfer', transport: 'server_to_client' });
                phases.push({ id: 'client_hydrate', kind: 'hydrate', transport: 'main' });
            } else {
                phases.push({
                    id: `${request.prerenderTransport}_prerender`,
                    kind: 'prerender',
                    transport: request.prerenderTransport
                });
            }
            return Object.freeze({
                executionMode: request.executionMode,
                rootId: request.rootId,
                templateQualifiedId: request.template.qualifiedId,
                namespace: request.namespace,
                phases
            });
        }

        function createPrerenderEnvelope(requestInput = {}, options = {}) {
            const request = normalizeRequest(requestInput, options);
            return Object.freeze({
                kind: PRERENDER_REQUEST_KIND,
                version: PRERENDER_REQUEST_VERSION,
                executionMode: request.executionMode,
                prerenderTransport: request.prerenderTransport,
                rootId: request.rootId,
                template: {
                    id: request.template.id,
                    qualifiedId: request.template.qualifiedId,
                    namespace: request.template.namespace,
                    documentId: request.template.documentId,
                    props: cloneSerializable(request.props, []),
                    hydration: cloneSerializable(request.hydration, {}),
                    errorBoundary: cloneSerializable(request.errorBoundary, {})
                },
                target: {
                    elementId: request.elementId,
                    selector: request.selector,
                    ownershipMode: request.ownershipMode
                },
                model: cloneSerializable(request.model, {}),
                metadata: cloneSerializable(request.metadata, {}),
                plan: createExecutionPlan(request, options),
                requestedAt: now()
            });
        }

        function renderMarkup(templateRecord, model = {}) {
            if (templateRecord.mode === 'text') {
                const textValue = String(templateRecord.markup || '');
                return { html: escapeHtml(textValue), textContent: textValue, descriptor: null };
            }
            if (templateRecord.mode === 'dom_descriptor') {
                return {
                    html: '',
                    textContent: '',
                    descriptor: cloneSerializable(model && model.descriptor ? model.descriptor : templateRecord.metadata, {})
                };
            }
            return { html: String(templateRecord.markup || ''), textContent: '', descriptor: null };
        }

        function prerenderTemplate(requestInput = {}, options = {}) {
            const request = normalizeRequest(requestInput, options);
            const rendered = renderMarkup(request.template, request.model);
            return Object.freeze({
                kind: CHUNK_KIND,
                version: CHUNK_VERSION,
                executionMode: request.executionMode,
                transport: request.prerenderTransport,
                rootId: request.rootId,
                template: {
                    id: request.template.id,
                    qualifiedId: request.template.qualifiedId,
                    namespace: request.template.namespace,
                    documentId: request.template.documentId,
                    mode: request.template.mode,
                    props: cloneSerializable(request.props, [])
                },
                target: {
                    elementId: request.elementId,
                    selector: request.selector,
                    ownershipMode: request.ownershipMode,
                    namespace: request.namespace
                },
                markup: {
                    html: rendered.html,
                    textContent: rendered.textContent,
                    descriptor: cloneSerializable(rendered.descriptor, null)
                },
                hydration: {
                    bindings: cloneSerializable(request.template.bindings, []),
                    slots: cloneSerializable(request.template.slots, []),
                    props: cloneSerializable(request.props, []),
                    templateHydration: cloneSerializable(request.hydration, {}),
                    errorBoundary: cloneSerializable(request.errorBoundary, {}),
                    reactivityHints: cloneSerializable(request.template.reactivityHints, {}),
                    ownershipMode: request.ownershipMode,
                    resourceId: `template.chunk:${request.template.qualifiedId}`,
                    metadata: cloneSerializable(request.metadata, {})
                },
                modelSnapshot: cloneSerializable(request.model, {}),
                plan: createExecutionPlan(request, options),
                renderedAt: now()
            });
        }

        function normalizeChunk(chunkInput, options = {}) {
            if (typeof chunkInput === 'string') return JSON.parse(chunkInput);
            if (chunkInput && chunkInput.kind === CHUNK_KIND) return cloneSerializable(chunkInput, null);
            return prerenderTemplate(normalizeRequest(chunkInput, options), options);
        }

        return Object.freeze({
            kind: 'rmt_template_execution_model',
            version: '1.0',
            createExecutionPlan,
            createPrerenderEnvelope,
            getObjectPathValue,
            getSupportedExecutionModes: () => EXECUTION_MODES.slice(),
            normalizeChunk,
            normalizeExecutionMode,
            normalizeRequest,
            prerenderTemplate
        });
    };
})(__XTENDRMT_GLOBAL__);
