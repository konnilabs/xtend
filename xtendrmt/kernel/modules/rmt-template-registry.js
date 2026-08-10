/* modules/rmt-template-registry.js */
(function registerRmtTemplateRegistryModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

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
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return value;
    }

    appModules.createRmtTemplateRegistry = function createRmtTemplateRegistry(deps = {}) {
        const rmtFormat = deps.rmtFormat && typeof deps.rmtFormat === 'object'
            ? deps.rmtFormat
            : null;
        const documents = new Map();
        const templates = new Map();
        const templateAliases = new Map();

        function normalizeDocument(documentInput, options = {}) {
            if (rmtFormat && typeof rmtFormat.normalizeDocument === 'function') {
                return rmtFormat.normalizeDocument(documentInput, options);
            }
            return cloneSerializable(documentInput, {});
        }

        function normalizeTemplateEntry(templateInput, options = {}) {
            if (rmtFormat && typeof rmtFormat.normalizeTemplateEntry === 'function') {
                return rmtFormat.normalizeTemplateEntry(templateInput, options);
            }
            const rawTemplate = toPlainObject(templateInput);
            const namespace = clampString(options.namespace || rawTemplate.namespace, '');
            const templateId = clampString(rawTemplate.id || rawTemplate.templateId, '');
            if (!templateId) {
                throw new Error('RmtTemplateRegistry benoetigt template.id.');
            }
            const qualifiedId = namespace ? `${namespace}:${templateId}` : templateId;
            return Object.freeze({
                id: templateId,
                qualifiedId,
                namespace,
                mode: clampString(rawTemplate.mode, 'html_fragment'),
                markup: String(rawTemplate.markup || ''),
                props: cloneSerializable(rawTemplate.props || rawTemplate.properties, []),
                bindings: cloneSerializable(rawTemplate.bindings, []),
                slots: cloneSerializable(rawTemplate.slots, []),
                hydration: cloneSerializable(rawTemplate.hydration || rawTemplate.hydrate || rawTemplate.rendering, {}),
                errorBoundary: cloneSerializable(rawTemplate.errorBoundary || rawTemplate.error || rawTemplate.boundary, {}),
                metadata: cloneSerializable(rawTemplate.metadata, {}),
                reactivityHints: cloneSerializable(rawTemplate.reactivityHints, {}),
                documentId: clampString(options.documentId || rawTemplate.documentId, ''),
                sourceUrl: clampString(options.sourceUrl || rawTemplate.sourceUrl, ''),
                loaderHint: clampString(rawTemplate.loaderHint, '')
            });
        }

        function cloneTemplate(templateRecord) {
            return cloneSerializable(templateRecord, null);
        }

        function cloneDocumentRecord(documentRecord) {
            return cloneSerializable(documentRecord, null);
        }

        function addAlias(templateRecord) {
            const templateId = clampString(templateRecord && templateRecord.id, '');
            if (!templateId) return;
            if (!templateAliases.has(templateId)) {
                templateAliases.set(templateId, new Set());
            }
            templateAliases.get(templateId).add(templateRecord.qualifiedId);
        }

        function removeAlias(templateRecord) {
            const templateId = clampString(templateRecord && templateRecord.id, '');
            if (!templateId || !templateAliases.has(templateId)) return;
            const aliasBucket = templateAliases.get(templateId);
            aliasBucket.delete(templateRecord.qualifiedId);
            if (aliasBucket.size === 0) {
                templateAliases.delete(templateId);
            }
        }

        function removeTemplateInternal(qualifiedId) {
            const existingTemplate = templates.get(qualifiedId);
            if (!existingTemplate) return false;
            templates.delete(qualifiedId);
            removeAlias(existingTemplate);
            return true;
        }

        function registerTemplate(templateInput, options = {}) {
            const safeTemplate = normalizeTemplateEntry(templateInput, options);
            if (options.replace !== true && templates.has(safeTemplate.qualifiedId)) {
                throw new Error(`RmtTemplateRegistry kennt ${safeTemplate.qualifiedId} bereits.`);
            }
            removeTemplateInternal(safeTemplate.qualifiedId);
            templates.set(safeTemplate.qualifiedId, safeTemplate);
            addAlias(safeTemplate);
            return cloneTemplate(safeTemplate);
        }

        function registerDocument(documentInput, options = {}) {
            const safeDocument = normalizeDocument(documentInput, options);
            const documentId = clampString(
                safeDocument && safeDocument.manifest ? safeDocument.manifest.documentId : '',
                'rmt-document'
            );
            if (options.replace !== true && documents.has(documentId)) {
                throw new Error(`RmtTemplateRegistry kennt Dokument ${documentId} bereits.`);
            }

            if (documents.has(documentId)) {
                const existingDocument = documents.get(documentId);
                (Array.isArray(existingDocument.templateIds) ? existingDocument.templateIds : []).forEach((qualifiedId) => {
                    removeTemplateInternal(qualifiedId);
                });
            }

            const templateIds = [];
            (Array.isArray(safeDocument.templates) ? safeDocument.templates : []).forEach((templateInput) => {
                const registeredTemplate = registerTemplate(templateInput, {
                    ...options,
                    documentId,
                    sourceUrl: safeDocument.manifest && safeDocument.manifest.sourceUrl,
                    replace: true
                });
                templateIds.push(registeredTemplate.qualifiedId);
            });

            const documentRecord = Object.freeze({
                documentId,
                namespace: clampString(safeDocument.manifest && safeDocument.manifest.namespace, ''),
                sourceUrl: clampString(safeDocument.manifest && safeDocument.manifest.sourceUrl, ''),
                contentType: clampString(safeDocument.manifest && safeDocument.manifest.contentType, ''),
                metadata: cloneSerializable(safeDocument.manifest && safeDocument.manifest.metadata, {}),
                reactivityHints: cloneSerializable(safeDocument.manifest && safeDocument.manifest.reactivityHints, {}),
                templateCount: templateIds.length,
                templateIds: templateIds.slice()
            });
            documents.set(documentId, documentRecord);

            return Object.freeze({
                documentId,
                namespace: documentRecord.namespace,
                sourceUrl: documentRecord.sourceUrl,
                contentType: documentRecord.contentType,
                metadata: cloneSerializable(documentRecord.metadata, {}),
                reactivityHints: cloneSerializable(documentRecord.reactivityHints, {}),
                templateCount: templateIds.length,
                templateIds: templateIds.slice()
            });
        }

        function resolveTemplateReference(templateRef, options = {}) {
            const rawRef = templateRef && typeof templateRef === 'object'
                ? templateRef
                : { id: templateRef };
            const directQualifiedId = clampString(rawRef.qualifiedId, '');
            if (directQualifiedId && templates.has(directQualifiedId)) {
                return directQualifiedId;
            }
            const namespace = clampString(options.namespace || rawRef.namespace, '');
            const templateId = clampString(rawRef.id || rawRef.templateId || rawRef.name, '');
            if (!templateId) return '';
            if (namespace) {
                const candidateId = `${namespace}:${templateId}`;
                if (templates.has(candidateId)) return candidateId;
            }
            if (templates.has(templateId)) return templateId;
            if (!templateAliases.has(templateId)) return '';
            const candidates = Array.from(templateAliases.get(templateId));
            return candidates.length === 1 ? candidates[0] : '';
        }

        function resolveTemplate(templateRef, options = {}) {
            const qualifiedId = resolveTemplateReference(templateRef, options);
            return qualifiedId ? cloneTemplate(templates.get(qualifiedId)) : null;
        }

        function getDocument(documentId, fallbackValue = null) {
            const safeDocumentId = clampString(documentId, '');
            if (!safeDocumentId || !documents.has(safeDocumentId)) return fallbackValue;
            return cloneDocumentRecord(documents.get(safeDocumentId));
        }

        function listDocuments() {
            return Array.from(documents.values())
                .map((documentRecord) => cloneDocumentRecord(documentRecord))
                .sort((left, right) => left.documentId.localeCompare(right.documentId));
        }

        function listTemplates() {
            return Array.from(templates.values())
                .map((templateRecord) => cloneTemplate(templateRecord))
                .sort((left, right) => left.qualifiedId.localeCompare(right.qualifiedId));
        }

        function removeTemplate(templateRef, options = {}) {
            const qualifiedId = resolveTemplateReference(templateRef, options);
            return qualifiedId ? removeTemplateInternal(qualifiedId) : false;
        }

        function removeDocument(documentId) {
            const safeDocumentId = clampString(documentId, '');
            if (!safeDocumentId || !documents.has(safeDocumentId)) return false;
            const documentRecord = documents.get(safeDocumentId);
            (Array.isArray(documentRecord.templateIds) ? documentRecord.templateIds : []).forEach((qualifiedId) => {
                removeTemplateInternal(qualifiedId);
            });
            documents.delete(safeDocumentId);
            return true;
        }

        function reset() {
            documents.clear();
            templates.clear();
            templateAliases.clear();
            return true;
        }

        return Object.freeze({
            getDocument,
            getTemplate: resolveTemplate,
            hasDocument: (documentId) => documents.has(clampString(documentId, '')),
            hasTemplate: (templateRef, options = {}) => !!resolveTemplateReference(templateRef, options),
            listDocuments,
            listTemplates,
            registerDocument,
            registerTemplate,
            removeDocument,
            removeTemplate,
            reset,
            resolveTemplate
        });
    };
})(__XTENDRMT_GLOBAL__);
