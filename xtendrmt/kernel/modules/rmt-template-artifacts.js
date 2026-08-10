/* modules/rmt-template-artifacts.js */
(function registerRmtTemplateArtifactsModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const ARTIFACT_DOCUMENT_KIND = 'rmt_template_artifact_document';
    const ARTIFACT_BUNDLE_KIND = 'rmt_template_artifact_bundle';
    const ARTIFACT_VERSION = '1.0';

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
        return !!value && typeof value === 'object' && !Array.isArray(value);
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

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function'
            ? appModules[factoryName]
            : null;
    }

    function toSourceDocument(preparedDocument) {
        return {
            kind: 'rmt_document',
            version: '1.0',
            manifest: {
                documentId: clampString(preparedDocument && preparedDocument.documentId, 'rmt-document'),
                namespace: clampString(preparedDocument && preparedDocument.namespace, ''),
                sourceUrl: clampString(preparedDocument && preparedDocument.sourceUrl, ''),
                contentType: clampString(preparedDocument && preparedDocument.contentType, ''),
                metadata: cloneSerializable(preparedDocument && preparedDocument.metadata, {}),
                reactivityHints: cloneSerializable(preparedDocument && preparedDocument.reactivityHints, {})
            },
            templates: (Array.isArray(preparedDocument && preparedDocument.templates) ? preparedDocument.templates : []).map((templateEntry) => ({
                id: clampString(templateEntry && templateEntry.id, ''),
                namespace: clampString(templateEntry && templateEntry.namespace, ''),
                mode: clampString(templateEntry && templateEntry.mode, 'html_fragment'),
                markup: String(templateEntry && templateEntry.markup || ''),
                bindings: cloneSerializable(templateEntry && templateEntry.bindings, []),
                slots: cloneSerializable(templateEntry && templateEntry.slots, []),
                metadata: cloneSerializable(templateEntry && templateEntry.metadata, {}),
                reactivityHints: cloneSerializable(templateEntry && templateEntry.reactivityHints, {}),
                sourceUrl: clampString(templateEntry && templateEntry.sourceUrl, ''),
                loaderHint: clampString(templateEntry && templateEntry.loaderHint, '')
            }))
        };
    }

    appModules.createRmtTemplateArtifacts = function createRmtTemplateArtifacts(deps = {}) {
        const templateApi = deps.templateApi && typeof deps.templateApi === 'object'
            ? deps.templateApi
            : null;
        const createRmtTemplateCompilerFactory = resolveFactory('createRmtTemplateCompiler', deps.createRmtTemplateCompiler);
        const createRmtTemplateRegistryFactory = resolveFactory('createRmtTemplateRegistry', deps.createRmtTemplateRegistry);
        const createRmtFormatFactory = resolveFactory('createRmtFormat', deps.createRmtFormat);

        const suppliedRegistry = deps.registry && typeof deps.registry === 'object'
            ? deps.registry
            : (deps.templateRegistry && typeof deps.templateRegistry === 'object'
                ? deps.templateRegistry
                : ((templateApi && typeof templateApi.getRegistry === 'function')
                    ? templateApi.getRegistry()
                    : null));
        const suppliedCompiler = deps.compiler && typeof deps.compiler === 'object'
            ? deps.compiler
            : (deps.templateCompiler && typeof deps.templateCompiler === 'object'
                ? deps.templateCompiler
                : ((templateApi && typeof templateApi.getCompiler === 'function')
                    ? templateApi.getCompiler()
                    : null));
        const needsRmtFormat = !suppliedRegistry || !suppliedCompiler;
        const rmtFormat = deps.rmtFormat && typeof deps.rmtFormat === 'object'
            ? deps.rmtFormat
            : (needsRmtFormat && typeof createRmtFormatFactory === 'function'
                ? createRmtFormatFactory()
                : null);
        const registry = suppliedRegistry
            || (typeof createRmtTemplateRegistryFactory === 'function'
                ? createRmtTemplateRegistryFactory({
                    ...deps,
                    rmtFormat
                })
                : null);
        if (!registry || typeof registry.registerDocument !== 'function') {
            throw new Error('RmtTemplateArtifacts benoetigt eine gueltige TemplateRegistry.');
        }

        const compiler = suppliedCompiler
            || (typeof createRmtTemplateCompilerFactory === 'function'
                ? createRmtTemplateCompilerFactory({
                    ...deps,
                    rmtFormat,
                    registry,
                    templateRegistry: registry
                })
                : null);
        if (!compiler || typeof compiler.prepareDocument !== 'function') {
            throw new Error('RmtTemplateArtifacts benoetigt einen gueltigen TemplateCompiler.');
        }

        let logicalClock = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalClock += 1;
                return logicalClock;
            });

        function createArtifactManifest(options = {}) {
            const profileHints = Array.isArray(options.runtimeProfileHints)
                ? options.runtimeProfileHints.map((entry) => clampString(entry, '')).filter(Boolean)
                : ['browser', 'detached_dom', 'worker_prerender', 'server_prerender'];
            return Object.freeze({
                artifactVersion: ARTIFACT_VERSION,
                bundleId: clampString(options.bundleId, `rmt.bundle.${now()}`),
                createdAt: now(),
                releaseStage: clampString(options.releaseStage, 'pre-release'),
                runtimeProfileHints: profileHints,
                metadata: cloneSerializable(options.metadata, {})
            });
        }

        function createDocumentArtifact(documentInput, options = {}) {
            const preparedDocument = compiler.prepareDocument(documentInput, options);
            const artifactId = clampString(
                options.artifactId,
                `artifact:${preparedDocument.documentId}:${String(preparedDocument.fingerprint || '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(-12) || 'document'}`
            );
            return Object.freeze({
                kind: ARTIFACT_DOCUMENT_KIND,
                version: ARTIFACT_VERSION,
                artifactId,
                documentId: clampString(preparedDocument.documentId, ''),
                namespace: clampString(preparedDocument.namespace, ''),
                sourceUrl: clampString(preparedDocument.sourceUrl, ''),
                contentType: clampString(preparedDocument.contentType, ''),
                templateCount: Number(preparedDocument.templateCount) || 0,
                templateIds: Array.isArray(preparedDocument.templateIds) ? preparedDocument.templateIds.slice() : [],
                metadata: cloneSerializable(preparedDocument.metadata, {}),
                reactivityHints: cloneSerializable(preparedDocument.reactivityHints, {}),
                fingerprint: clampString(preparedDocument.fingerprint, ''),
                sourceFingerprint: clampString(preparedDocument.sourceFingerprint, ''),
                templates: cloneSerializable(preparedDocument.templates, []),
                runtimeProfileHints: Array.isArray(options.runtimeProfileHints)
                    ? options.runtimeProfileHints.map((entry) => clampString(entry, '')).filter(Boolean)
                    : ['browser', 'detached_dom', 'worker_prerender', 'server_prerender'],
                createdAt: now()
            });
        }

        function createArtifactBundle(documentInputs = [], options = {}) {
            const safeDocumentInputs = Array.isArray(documentInputs) ? documentInputs : [documentInputs];
            const documents = safeDocumentInputs
                .filter((entry) => entry !== undefined && entry !== null)
                .map((entry, index) => createDocumentArtifact(entry, {
                    ...options,
                    artifactId: ''
                }));
            const manifest = createArtifactManifest(options);
            const templateIds = documents.flatMap((documentArtifact) => (
                Array.isArray(documentArtifact.templateIds) ? documentArtifact.templateIds : []
            ));
            const fingerprint = hashString(stableStringify({
                manifest,
                documents: documents.map((documentArtifact) => ({
                    artifactId: documentArtifact.artifactId,
                    documentId: documentArtifact.documentId,
                    fingerprint: documentArtifact.fingerprint
                }))
            }));
            return Object.freeze({
                kind: ARTIFACT_BUNDLE_KIND,
                version: ARTIFACT_VERSION,
                manifest: Object.freeze({
                    ...manifest,
                    documentCount: documents.length,
                    templateCount: templateIds.length,
                    fingerprint
                }),
                documents: documents.map((entry) => cloneSerializable(entry, null)),
                templateIds: templateIds.slice()
            });
        }

        function registerArtifactBundle(bundleInput, options = {}) {
            const bundle = isObjectLike(bundleInput) && bundleInput.kind === ARTIFACT_BUNDLE_KIND
                ? cloneSerializable(bundleInput, null)
                : createArtifactBundle(bundleInput, options);
            const documentArtifacts = Array.isArray(bundle && bundle.documents) ? bundle.documents : [];
            const registeredDocuments = documentArtifacts.map((documentArtifact) => {
                const sourceDocument = toSourceDocument(documentArtifact);
                return registry.registerDocument(sourceDocument, {
                    replace: options.replace !== false
                });
            });
            registeredDocuments.forEach((documentRecord) => {
                compiler.prepareDocument(documentRecord.documentId, {
                    refresh: true
                });
            });
            return Object.freeze({
                ok: true,
                bundleId: clampString(bundle && bundle.manifest && bundle.manifest.bundleId, ''),
                documentCount: registeredDocuments.length,
                templateCount: registeredDocuments.reduce((sum, documentRecord) => (
                    sum + (Number(documentRecord && documentRecord.templateCount) || 0)
                ), 0),
                documentIds: registeredDocuments.map((documentRecord) => clampString(documentRecord && documentRecord.documentId, ''))
            });
        }

        return Object.freeze({
            kind: 'rmt_template_artifacts',
            version: ARTIFACT_VERSION,
            createArtifactBundle,
            createArtifactManifest,
            createDocumentArtifact,
            getCompiler: () => compiler,
            registerArtifactBundle,
            resolvePreparedTemplate(templateRef, options = {}) {
                return compiler.resolvePreparedTemplate(templateRef, options);
            }
        });
    };
})(__XTENDRMT_GLOBAL__);
