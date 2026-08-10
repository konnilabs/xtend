/* modules/rmt-prewarm-worker-source.js */
(function registerRmtPrewarmWorkerSourceModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtPrewarmWorkerSourceBuilder = function createRmtPrewarmWorkerSourceBuilder(options = {}) {
        const workerName = String(options.workerName || 'XTendRMTPrewarmWorker').trim() || 'XTendRMTPrewarmWorker';

        function buildSource() {
            return `
                const WORKER_NAME = ${JSON.stringify(workerName)};
                const PRERENDER_RESPONSE_KIND = 'rmt_template_prerender_response';
                const UI_COMPUTE_RESPONSE_KIND = 'rmt_ui_compute_response';
                const CHUNK_KIND = 'rmt_template_chunk';
                const CHUNK_VERSION = '1.0';
                const templatesByQualifiedId = new Map();
                const templateAliases = new Map();

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

                function toPlainTemplate(templateInput) {
                    const source = templateInput && typeof templateInput === 'object' ? templateInput : {};
                    return {
                        id: clampString(source.id || source.templateId, ''),
                        qualifiedId: clampString(source.qualifiedId, ''),
                        namespace: clampString(source.namespace, ''),
                        documentId: clampString(source.documentId, ''),
                        mode: clampString(source.mode, 'html_fragment'),
                        markup: String(source.markup || ''),
                        bindings: cloneSerializable(source.bindings, []),
                        slots: cloneSerializable(source.slots, []),
                        metadata: cloneSerializable(source.metadata, {}),
                        reactivityHints: cloneSerializable(source.reactivityHints, {})
                    };
                }

                function registerTemplate(templateInput) {
                    const template = toPlainTemplate(templateInput);
                    if (!template.id || !template.qualifiedId) return false;
                    templatesByQualifiedId.set(template.qualifiedId, template);
                    if (!templateAliases.has(template.id)) {
                        templateAliases.set(template.id, new Set());
                    }
                    templateAliases.get(template.id).add(template.qualifiedId);
                    return true;
                }

                function syncTemplates(templates) {
                    templatesByQualifiedId.clear();
                    templateAliases.clear();
                    (Array.isArray(templates) ? templates : []).forEach(registerTemplate);
                    return templatesByQualifiedId.size;
                }

                function resolveTemplate(templateRef) {
                    const source = templateRef && typeof templateRef === 'object'
                        ? templateRef
                        : { id: templateRef };
                    const qualifiedId = clampString(source.qualifiedId, '');
                    if (qualifiedId && templatesByQualifiedId.has(qualifiedId)) {
                        return templatesByQualifiedId.get(qualifiedId);
                    }
                    const templateId = clampString(source.id || source.templateId || source.name, '');
                    const namespace = clampString(source.namespace, '');
                    if (namespace && templateId) {
                        const candidateId = namespace + ':' + templateId;
                        if (templatesByQualifiedId.has(candidateId)) {
                            return templatesByQualifiedId.get(candidateId);
                        }
                    }
                    if (templateId && templatesByQualifiedId.has(templateId)) {
                        return templatesByQualifiedId.get(templateId);
                    }
                    if (templateId && templateAliases.has(templateId)) {
                        const candidates = Array.from(templateAliases.get(templateId));
                        if (candidates.length === 1 && templatesByQualifiedId.has(candidates[0])) {
                            return templatesByQualifiedId.get(candidates[0]);
                        }
                    }
                    return null;
                }

                function createPlan(envelope, template) {
                    if (envelope && envelope.plan && typeof envelope.plan === 'object') {
                        return cloneSerializable(envelope.plan, {});
                    }
                    return {
                        executionMode: clampString(envelope && envelope.executionMode, 'worker_prerender_hydrate'),
                        rootId: clampString(envelope && envelope.rootId, ''),
                        templateQualifiedId: clampString(template && template.qualifiedId, ''),
                        namespace: clampString(template && template.namespace, ''),
                        phases: [
                            { id: 'worker_prerender', kind: 'prerender', transport: 'worker' },
                            { id: 'chunk_transfer', kind: 'transfer', transport: 'worker_to_main' },
                            { id: 'client_hydrate', kind: 'hydrate', transport: 'main' }
                        ]
                    };
                }

                function normalizeSignals(envelope) {
                    const metadata = envelope && envelope.metadata && typeof envelope.metadata === 'object'
                        ? envelope.metadata
                        : {};
                    return cloneSerializable(envelope && envelope.signals ? envelope.signals : metadata.prewarmSignals, null);
                }

                function createChunk(envelope) {
                    const template = resolveTemplate(envelope && envelope.template);
                    if (!template) {
                        throw new Error('RmtPrewarmWorker konnte das Template nicht aufloesen.');
                    }
                    const target = envelope && envelope.target && typeof envelope.target === 'object'
                        ? envelope.target
                        : {};
                    const metadata = cloneSerializable(envelope && envelope.metadata, {});
                    const signals = normalizeSignals(envelope);
                    return {
                        kind: CHUNK_KIND,
                        version: CHUNK_VERSION,
                        executionMode: clampString(envelope && envelope.executionMode, 'worker_prerender_hydrate'),
                        transport: clampString(envelope && envelope.prerenderTransport, 'worker'),
                        rootId: clampString(envelope && envelope.rootId, ''),
                        template: {
                            id: template.id,
                            qualifiedId: template.qualifiedId,
                            namespace: template.namespace,
                            documentId: template.documentId,
                            mode: template.mode
                        },
                        target: {
                            elementId: clampString(target.elementId, ''),
                            selector: clampString(target.selector, ''),
                            ownershipMode: clampString(target.ownershipMode, 'hydrate_existing'),
                            namespace: template.namespace
                        },
                        markup: {
                            html: template.mode === 'text' ? '' : String(template.markup || ''),
                            textContent: template.mode === 'text' ? String(template.markup || '') : '',
                            descriptor: null
                        },
                        hydration: {
                            bindings: cloneSerializable(template.bindings, []),
                            slots: cloneSerializable(template.slots, []),
                            reactivityHints: cloneSerializable(template.reactivityHints, {}),
                            ownershipMode: 'hydrate_existing',
                            resourceId: 'template.chunk:' + template.qualifiedId,
                            metadata: signals
                                ? { ...metadata, prewarmSignals: signals }
                                : metadata
                        },
                        modelSnapshot: cloneSerializable(envelope && envelope.model, {}),
                        plan: createPlan(envelope, template),
                        renderedAt: Date.now()
                    };
                }

                function serializeError(error) {
                    return {
                        name: clampString(error && error.name, 'Error'),
                        message: clampString(error && error.message, 'Unbekannter RmtPrewarmWorker-Fehler.'),
                        stack: error && typeof error.stack === 'string' ? error.stack : ''
                    };
                }

                function createResponse(envelope, options = {}) {
                    const chunk = options.chunk || null;
                    const signals = normalizeSignals(envelope);
                    return {
                        kind: options.responseKind || PRERENDER_RESPONSE_KIND,
                        version: '1.0',
                        ok: options.ok !== false,
                        transport: 'worker',
                        executionMode: chunk ? chunk.executionMode : clampString(envelope && envelope.executionMode, 'worker_prerender_hydrate'),
                        rootId: chunk ? chunk.rootId : clampString(envelope && envelope.rootId, ''),
                        template: chunk ? cloneSerializable(chunk.template, null) : cloneSerializable(envelope && envelope.template, null),
                        plan: chunk ? cloneSerializable(chunk.plan, null) : cloneSerializable(envelope && envelope.plan, null),
                        request: cloneSerializable(envelope, null),
                        metadata: cloneSerializable(envelope && envelope.metadata, {}),
                        chunk,
                        uiCompute: {
                            kind: 'rmt_ui_compute_result',
                            action: clampString(envelope && envelope.action, options.responseKind === UI_COMPUTE_RESPONSE_KIND ? 'ui_compute' : 'prerender'),
                            mainThreadCommitRequired: true,
                            trustedDomCommit: 'main-thread',
                            stateOwnership: 'main-thread',
                            ownership: {
                                dom: false,
                                events: false,
                                state: false
                            }
                        },
                        superseded: false,
                        error: options.error || null,
                        requestedAt: Number(envelope && envelope.requestedAt) || 0,
                        respondedAt: Date.now(),
                        worker: {
                            name: WORKER_NAME,
                            templateCount: templatesByQualifiedId.size,
                            durationMs: Math.max((options.completedAt || Date.now()) - (options.startedAt || Date.now()), 0),
                            signals
                        }
                    };
                }

                function postResult(id, result) {
                    self.postMessage({ id, ok: true, result });
                }

                function postFailure(id, error) {
                    self.postMessage({ id, ok: false, error: serializeError(error) });
                }

                self.onmessage = function handleRmtPrewarmWorkerMessage(event) {
                    const message = event && event.data && typeof event.data === 'object' ? event.data : {};
                    const id = message.id;
                    const action = clampString(message.action, '');
                    try {
                        if (action === 'sync_templates') {
                            const count = syncTemplates(message.templates);
                            postResult(id, {
                                status: 'synced',
                                templateCount: count
                            });
                            return;
                        }
                        if (action === 'health') {
                            postResult(id, {
                                status: 'ready',
                                templateCount: templatesByQualifiedId.size
                            });
                            return;
                        }
                        if (action === 'prerender' || action === 'ui_compute') {
                            const startedAt = Date.now();
                            const envelope = message.envelope && typeof message.envelope === 'object'
                                ? message.envelope
                                : {};
                            const chunk = createChunk(envelope);
                            postResult(id, createResponse(envelope, {
                                chunk,
                                responseKind: action === 'ui_compute' ? UI_COMPUTE_RESPONSE_KIND : PRERENDER_RESPONSE_KIND,
                                startedAt,
                                completedAt: Date.now()
                            }));
                            return;
                        }
                        throw new Error('Unbekannte RmtPrewarmWorker-Action: ' + action);
                    } catch (error) {
                        postFailure(id, error);
                    }
                };
            `;
        }

        return Object.freeze({
            buildSource
        });
    };
})(__XTENDRMT_GLOBAL__);
