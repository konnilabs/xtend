/* modules/rmt-template-loader.js */
(function registerRmtTemplateLoaderModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function isObject(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function looksLikeInlineJson(value) {
        const safeValue = clampString(value, '');
        return safeValue.startsWith('{') || safeValue.startsWith('[');
    }

    async function resolveAsyncValue(factory, ...args) {
        return factory(...args);
    }

    appModules.createRmtTemplateLoader = function createRmtTemplateLoader(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const rmtFormat = deps.rmtFormat && typeof deps.rmtFormat === 'object'
            ? deps.rmtFormat
            : null;
        const registry = deps.registry && typeof deps.registry === 'object'
            ? deps.registry
            : deps.templateRegistry;

        if (!registry || typeof registry.registerDocument !== 'function') {
            throw new Error('RmtTemplateLoader benoetigt eine gueltige TemplateRegistry.');
        }
        if (!rmtFormat || typeof rmtFormat.parseDocument !== 'function') {
            throw new Error('RmtTemplateLoader benoetigt ein gueltiges RMT-Format.');
        }

        function resolveSourceUrl(source, options = {}) {
            if (typeof source === 'string' && !looksLikeInlineJson(source)) {
                return clampString(source, '');
            }
            if (isObject(source)) {
                return clampString(
                    options.sourceUrl
                    || source.sourceUrl
                    || source.url
                    || source.href
                    || source.path,
                    ''
                );
            }
            return clampString(options.sourceUrl, '');
        }

        function resolveSourceId(source, options = {}) {
            if (isObject(source)) {
                return clampString(
                    options.sourceId
                    || source.sourceId
                    || source.id
                    || source.documentId,
                    ''
                );
            }
            return clampString(options.sourceId, '');
        }

        async function readSourceText(source, options = {}) {
            if (typeof source === 'string' && looksLikeInlineJson(source)) {
                return source;
            }
            if (isObject(source) && typeof source.text === 'string') {
                return source.text;
            }
            if (isObject(source) && typeof source.content === 'string') {
                return source.content;
            }

            const readText = typeof options.readText === 'function'
                ? options.readText
                : (typeof deps.readText === 'function' ? deps.readText : null);
            if (typeof readText === 'function') {
                return resolveAsyncValue(readText, source, options);
            }

            const sourceUrl = resolveSourceUrl(source, options);
            if (
                sourceUrl
                && windowTarget
                && typeof windowTarget.fetch === 'function'
            ) {
                const response = await windowTarget.fetch(sourceUrl);
                if (!response || response.ok === false) {
                    throw new Error(`RmtTemplateLoader konnte ${sourceUrl} nicht laden.`);
                }
                return response.text();
            }

            throw new Error('RmtTemplateLoader benoetigt readText() oder eine fetch()-faehige Quelle.');
        }

        async function loadRmtDocument(source, options = {}) {
            const sourceUrl = resolveSourceUrl(source, options);
            const sourceId = resolveSourceId(source, options);
            const documentRecord = isObject(source) && isObject(source.document)
                ? rmtFormat.normalizeDocument(source.document, {
                    documentId: sourceId,
                    sourceUrl
                })
                : (isObject(source) && Array.isArray(source.templates)
                    ? rmtFormat.normalizeDocument(source, {
                        documentId: sourceId,
                        sourceUrl
                    })
                    : rmtFormat.parseDocument(await readSourceText(source, options), {
                        documentId: sourceId,
                        sourceUrl
                    }));
            return registry.registerDocument(documentRecord, {
                replace: options.replace === true,
                sourceUrl
            });
        }

        async function loadTemplateSource(source, options = {}) {
            if (isObject(source) && !Array.isArray(source.templates) && !isObject(source.document) && (source.id || source.templateId)) {
                return registry.registerTemplate(source, {
                    replace: options.replace === true,
                    sourceUrl: resolveSourceUrl(source, options),
                    documentId: resolveSourceId(source, options),
                    namespace: options.namespace
                });
            }
            return loadRmtDocument(source, options);
        }

        return Object.freeze({
            loadRmtDocument,
            loadTemplateSource,
            readSourceText
        });
    };
})(__XTENDRMT_GLOBAL__);
