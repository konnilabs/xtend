/* modules/rmt-template-compiler.js */
(function registerRmtTemplateCompilerModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const PREPARED_TEMPLATE_KIND = 'rmt_prepared_template';
    const PREPARED_DOCUMENT_KIND = 'rmt_prepared_document';
    const PREPARED_VERSION = '1.0';

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

    function isObjectLike(value) {
        return !!value && typeof value === 'object';
    }

    function toPlainObject(value) {
        return isObjectLike(value) && !Array.isArray(value) ? value : {};
    }

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function'
            ? appModules[factoryName]
            : null;
    }

    function stableStringify(value) {
        if (Array.isArray(value)) {
            return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
        }
        if (!value || typeof value !== 'object') {
            return JSON.stringify(value);
        }
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }

    function hashString(value) {
        const source = String(value || '');
        let hash = 2166136261;
        for (let index = 0; index < source.length; index += 1) {
            hash ^= source.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
    }

    function normalizeTemplateRef(templateRef) {
        if (!templateRef) return null;
        if (typeof templateRef === 'string') {
            const safeRef = clampString(templateRef, '');
            return safeRef ? Object.freeze({ id: safeRef }) : null;
        }
        const rawTemplateRef = toPlainObject(templateRef);
        if (clampString(rawTemplateRef.qualifiedId, '')) {
            return Object.freeze({
                qualifiedId: clampString(rawTemplateRef.qualifiedId, ''),
                id: clampString(rawTemplateRef.id || rawTemplateRef.templateId, ''),
                namespace: clampString(rawTemplateRef.namespace, '')
            });
        }
        const templateId = clampString(rawTemplateRef.id || rawTemplateRef.templateId || rawTemplateRef.name, '');
        if (!templateId) return null;
        return Object.freeze({
            id: templateId,
            namespace: clampString(rawTemplateRef.namespace, '')
        });
    }

    function collectDependencyRefs(templateRecord) {
        const dependencyMap = new Map();

        function remember(ref, sourceKind = 'template_ref') {
            const normalizedRef = normalizeTemplateRef(ref);
            if (!normalizedRef) return;
            const cacheKey = normalizedRef.qualifiedId
                ? `qualified:${normalizedRef.qualifiedId}`
                : `${normalizedRef.namespace}:${normalizedRef.id}`;
            if (dependencyMap.has(cacheKey)) return;
            dependencyMap.set(cacheKey, Object.freeze({
                kind: sourceKind,
                id: clampString(normalizedRef.id, ''),
                qualifiedId: clampString(normalizedRef.qualifiedId, ''),
                namespace: clampString(normalizedRef.namespace, '')
            }));
        }

        function rememberSource(pathValue, sourceKind = 'template_source') {
            const safePath = clampString(pathValue, '');
            if (!safePath) return;
            if (dependencyMap.has(`source:${safePath}`)) return;
            dependencyMap.set(`source:${safePath}`, Object.freeze({
                kind: sourceKind,
                path: safePath
            }));
        }

        const bindings = Array.isArray(templateRecord && templateRecord.bindings) ? templateRecord.bindings : [];
        bindings.forEach((binding) => {
            const rawBinding = toPlainObject(binding);
            remember(rawBinding.templateRef || rawBinding.template, 'binding_template');
            rememberSource(rawBinding.templateSource, 'binding_template_source');
        });

        const slots = Array.isArray(templateRecord && templateRecord.slots) ? templateRecord.slots : [];
        slots.forEach((slot) => {
            const rawSlot = toPlainObject(slot);
            remember(rawSlot.templateRef || rawSlot.template, 'slot_template');
        });

        return Array.from(dependencyMap.values());
    }

    appModules.createRmtTemplateCompiler = function createRmtTemplateCompiler(deps = {}) {
        const templateApi = deps.templateApi && typeof deps.templateApi === 'object'
            ? deps.templateApi
            : null;
        const createRmtFormatFactory = resolveFactory('createRmtFormat', deps.createRmtFormat);
        const createRmtTemplateRegistryFactory = resolveFactory('createRmtTemplateRegistry', deps.createRmtTemplateRegistry);
        const createRmtTemplateBindingModelFactory = resolveFactory('createRmtTemplateBindingModel', deps.createRmtTemplateBindingModel);

        const rmtFormat = deps.rmtFormat && typeof deps.rmtFormat === 'object'
            ? deps.rmtFormat
            : (typeof createRmtFormatFactory === 'function'
                ? createRmtFormatFactory()
                : null);
        if (!rmtFormat || typeof rmtFormat.normalizeDocument !== 'function') {
            throw new Error('RmtTemplateCompiler benoetigt ein gueltiges RMT-Format.');
        }

        const registry = deps.registry && typeof deps.registry === 'object'
            ? deps.registry
            : (deps.templateRegistry && typeof deps.templateRegistry === 'object'
                ? deps.templateRegistry
                : ((templateApi && typeof templateApi.getRegistry === 'function')
                    ? templateApi.getRegistry()
                    : (typeof createRmtTemplateRegistryFactory === 'function'
                        ? createRmtTemplateRegistryFactory({ rmtFormat })
                        : null)));
        if (!registry || typeof registry.resolveTemplate !== 'function') {
            throw new Error('RmtTemplateCompiler benoetigt eine gueltige TemplateRegistry.');
        }

        const bindingModel = deps.bindingModel && typeof deps.bindingModel === 'object'
            ? deps.bindingModel
            : (deps.templateBindingModel && typeof deps.templateBindingModel === 'object'
                ? deps.templateBindingModel
                : (deps.runtimeRenderer && typeof deps.runtimeRenderer === 'object'
                    ? deps.runtimeRenderer
                    : (typeof createRmtTemplateBindingModelFactory === 'function'
                        ? createRmtTemplateBindingModelFactory()
                        : null)));
        if (!bindingModel || typeof bindingModel.normalizeBindings !== 'function') {
            throw new Error('RmtTemplateCompiler benoetigt ein gueltiges TemplateBindingModel.');
        }

        let logicalClock = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalClock += 1;
                return logicalClock;
            });
        const preparedTemplates = new Map();
        const preparedDocuments = new Map();

        function getStructureSignature(bindings, slots, templateMode) {
            if (typeof bindingModel.createTemplateStructureSignature === 'function') {
                return bindingModel.createTemplateStructureSignature(bindings, slots, templateMode);
            }
            return hashString(stableStringify({
                templateMode: clampString(templateMode, 'html_fragment'),
                bindings: Array.isArray(bindings) ? bindings : [],
                slots: Array.isArray(slots) ? slots : []
            }));
        }

        function getTemplateSourceFingerprint(templateRecord) {
            return hashString(stableStringify({
                id: clampString(templateRecord && templateRecord.id, ''),
                qualifiedId: clampString(templateRecord && templateRecord.qualifiedId, ''),
                namespace: clampString(templateRecord && templateRecord.namespace, ''),
                documentId: clampString(templateRecord && templateRecord.documentId, ''),
                mode: clampString(templateRecord && templateRecord.mode, 'html_fragment'),
                markup: String(templateRecord && templateRecord.markup || ''),
                props: Array.isArray(templateRecord && templateRecord.props) ? templateRecord.props : [],
                bindings: Array.isArray(templateRecord && templateRecord.bindings) ? templateRecord.bindings : [],
                slots: Array.isArray(templateRecord && templateRecord.slots) ? templateRecord.slots : [],
                hydration: cloneSerializable(templateRecord && templateRecord.hydration, {}),
                errorBoundary: cloneSerializable(templateRecord && templateRecord.errorBoundary, {}),
                metadata: cloneSerializable(templateRecord && templateRecord.metadata, {}),
                reactivityHints: cloneSerializable(templateRecord && templateRecord.reactivityHints, {})
            }));
        }

        function createPreparedTemplate(templateRecord, options = {}) {
            const normalizedTemplateRecord = isObjectLike(templateRecord) && clampString(templateRecord.qualifiedId, '')
                ? templateRecord
                : rmtFormat.normalizeTemplateEntry(templateRecord, options);
            const normalizedBindings = bindingModel.normalizeBindings(normalizedTemplateRecord.bindings);
            const normalizedSlots = bindingModel.normalizeSlots(normalizedTemplateRecord.slots);
            const sourceFingerprint = getTemplateSourceFingerprint({
                ...normalizedTemplateRecord,
                bindings: normalizedBindings,
                slots: normalizedSlots
            });
            const structureSignature = getStructureSignature(
                normalizedBindings,
                normalizedSlots,
                normalizedTemplateRecord.mode
            );
            const dependencyRefs = collectDependencyRefs({
                ...normalizedTemplateRecord,
                bindings: normalizedBindings,
                slots: normalizedSlots
            });
            const preparedTemplate = Object.freeze({
                kind: PREPARED_TEMPLATE_KIND,
                version: PREPARED_VERSION,
                preparedAt: now(),
                id: clampString(normalizedTemplateRecord.id, ''),
                qualifiedId: clampString(normalizedTemplateRecord.qualifiedId, ''),
                namespace: clampString(normalizedTemplateRecord.namespace, ''),
                documentId: clampString(normalizedTemplateRecord.documentId, ''),
                sourceUrl: clampString(normalizedTemplateRecord.sourceUrl, ''),
                loaderHint: clampString(normalizedTemplateRecord.loaderHint, ''),
                mode: clampString(normalizedTemplateRecord.mode, 'html_fragment'),
                markup: String(normalizedTemplateRecord.markup || ''),
                props: cloneSerializable(normalizedTemplateRecord.props, []),
                bindings: normalizedBindings,
                slots: normalizedSlots,
                hydration: cloneSerializable(normalizedTemplateRecord.hydration, {}),
                errorBoundary: cloneSerializable(normalizedTemplateRecord.errorBoundary, {}),
                metadata: cloneSerializable(normalizedTemplateRecord.metadata, {}),
                reactivityHints: cloneSerializable(normalizedTemplateRecord.reactivityHints, {}),
                dependencyRefs,
                structureSignature,
                fingerprint: hashString(stableStringify({
                    sourceFingerprint,
                    structureSignature,
                    dependencies: dependencyRefs
                })),
                sourceFingerprint
            });
            if (preparedTemplate.qualifiedId) {
                preparedTemplates.set(preparedTemplate.qualifiedId, preparedTemplate);
            }
            return preparedTemplate;
        }

        function prepareTemplate(templateInput, options = {}) {
            if (isObjectLike(templateInput) && templateInput.kind === PREPARED_TEMPLATE_KIND) {
                return cloneSerializable(templateInput, null);
            }

            const resolvedTemplate = (
                !isObjectLike(templateInput)
                || !Object.prototype.hasOwnProperty.call(templateInput, 'markup')
                || !Object.prototype.hasOwnProperty.call(templateInput, 'id')
            )
                ? registry.resolveTemplate(templateInput, options)
                : null;
            const templateRecord = resolvedTemplate
                || rmtFormat.normalizeTemplateEntry(templateInput, options);
            const preparedTemplate = createPreparedTemplate(templateRecord, options);
            const cachedTemplate = preparedTemplates.get(preparedTemplate.qualifiedId);
            if (
                cachedTemplate
                && cachedTemplate.sourceFingerprint === preparedTemplate.sourceFingerprint
                && options.refresh !== true
            ) {
                return cloneSerializable(cachedTemplate, null);
            }
            preparedTemplates.set(preparedTemplate.qualifiedId, preparedTemplate);
            return cloneSerializable(preparedTemplate, null);
        }

        function resolvePreparedDocumentSource(documentInput, options = {}) {
            if (isObjectLike(documentInput) && documentInput.kind === PREPARED_DOCUMENT_KIND) {
                return cloneSerializable(documentInput, null);
            }

            const rawDocumentId = clampString(
                typeof documentInput === 'string'
                    ? documentInput
                    : (documentInput && documentInput.documentId),
                ''
            );
            if (
                rawDocumentId
                && registry.hasDocument(rawDocumentId)
                && (
                    typeof documentInput === 'string'
                    || !isObjectLike(documentInput)
                    || !Array.isArray(documentInput.templates)
                )
            ) {
                const documentRecord = registry.getDocument(rawDocumentId, null);
                const registeredTemplates = registry.listTemplates().filter((templateRecord) => (
                    clampString(templateRecord && templateRecord.documentId, '') === rawDocumentId
                ));
                return {
                    manifest: {
                        documentId: rawDocumentId,
                        namespace: clampString(documentRecord && documentRecord.namespace, ''),
                        sourceUrl: clampString(documentRecord && documentRecord.sourceUrl, ''),
                        contentType: clampString(documentRecord && documentRecord.contentType, ''),
                        metadata: cloneSerializable(documentRecord && documentRecord.metadata, {}),
                        reactivityHints: cloneSerializable(documentRecord && documentRecord.reactivityHints, {})
                    },
                    templates: registeredTemplates
                };
            }

            return rmtFormat.normalizeDocument(documentInput, options);
        }

        function prepareDocument(documentInput, options = {}) {
            const resolvedDocument = resolvePreparedDocumentSource(documentInput, options);
            if (resolvedDocument && resolvedDocument.kind === PREPARED_DOCUMENT_KIND) {
                return resolvedDocument;
            }

            const normalizedDocument = rmtFormat.normalizeDocument(resolvedDocument, options);
            const documentManifest = normalizedDocument.manifest || rmtFormat.normalizeDocumentManifest({}, options);
            const preparedTemplateEntries = (Array.isArray(normalizedDocument.templates) ? normalizedDocument.templates : [])
                .map((templateEntry) => createPreparedTemplate(templateEntry, {
                    ...options,
                    documentManifest,
                    documentId: documentManifest.documentId,
                    namespace: documentManifest.namespace
                }));
            const documentSourceFingerprint = hashString(stableStringify({
                manifest: documentManifest,
                templates: preparedTemplateEntries.map((entry) => ({
                    qualifiedId: entry.qualifiedId,
                    fingerprint: entry.fingerprint
                }))
            }));
            const preparedDocument = Object.freeze({
                kind: PREPARED_DOCUMENT_KIND,
                version: PREPARED_VERSION,
                preparedAt: now(),
                documentId: clampString(documentManifest.documentId, 'rmt-document'),
                namespace: clampString(documentManifest.namespace, ''),
                sourceUrl: clampString(documentManifest.sourceUrl, ''),
                contentType: clampString(documentManifest.contentType, ''),
                metadata: cloneSerializable(documentManifest.metadata, {}),
                reactivityHints: cloneSerializable(documentManifest.reactivityHints, {}),
                fingerprint: hashString(stableStringify({
                    documentSourceFingerprint,
                    templates: preparedTemplateEntries.map((entry) => entry.fingerprint)
                })),
                sourceFingerprint: documentSourceFingerprint,
                templateCount: preparedTemplateEntries.length,
                templateIds: preparedTemplateEntries.map((entry) => entry.qualifiedId),
                templates: preparedTemplateEntries.map((entry) => cloneSerializable(entry, null))
            });

            const cachedDocument = preparedDocuments.get(preparedDocument.documentId);
            if (
                cachedDocument
                && cachedDocument.sourceFingerprint === preparedDocument.sourceFingerprint
                && options.refresh !== true
            ) {
                return cloneSerializable(cachedDocument, null);
            }

            preparedDocuments.set(preparedDocument.documentId, preparedDocument);
            return cloneSerializable(preparedDocument, null);
        }

        function clearPreparedCache() {
            preparedTemplates.clear();
            preparedDocuments.clear();
            return true;
        }

        return Object.freeze({
            kind: 'rmt_template_compiler',
            version: PREPARED_VERSION,
            clearPreparedCache,
            getPreparedDocument(documentId, fallbackValue = null) {
                const safeDocumentId = clampString(documentId, '');
                if (!safeDocumentId || !preparedDocuments.has(safeDocumentId)) return fallbackValue;
                return cloneSerializable(preparedDocuments.get(safeDocumentId), null);
            },
            getPreparedTemplate(templateRef, fallbackValue = null) {
                const safeTemplateRef = normalizeTemplateRef(templateRef);
                const cacheKey = safeTemplateRef && clampString(safeTemplateRef.qualifiedId, '')
                    ? safeTemplateRef.qualifiedId
                    : '';
                if (!cacheKey || !preparedTemplates.has(cacheKey)) return fallbackValue;
                return cloneSerializable(preparedTemplates.get(cacheKey), null);
            },
            listPreparedDocuments: () => Array.from(preparedDocuments.values())
                .map((documentRecord) => cloneSerializable(documentRecord, null))
                .sort((left, right) => left.documentId.localeCompare(right.documentId)),
            listPreparedTemplates: () => Array.from(preparedTemplates.values())
                .map((templateRecord) => cloneSerializable(templateRecord, null))
                .sort((left, right) => left.qualifiedId.localeCompare(right.qualifiedId)),
            prepareDocument,
            prepareTemplate,
            resolvePreparedTemplate(templateRef, options = {}) {
                const preparedTemplate = prepareTemplate(templateRef, options);
                return preparedTemplate && preparedTemplate.kind === PREPARED_TEMPLATE_KIND
                    ? preparedTemplate
                    : null;
            }
        });
    };
})(__XTENDRMT_GLOBAL__);
