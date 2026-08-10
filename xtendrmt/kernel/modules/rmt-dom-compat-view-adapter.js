/* modules/rmt-dom-compat-view-adapter.js */
(function registerRmtDomCompatViewAdapterModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const PUBLIC_API_VERSION = '{{KERNEL_VERSION}}';
    const OWNERSHIP_MODES = Object.freeze([
        'observe_only',
        'hydrate_existing',
        'replace_children',
        'managed_subtree'
    ]);

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function normalizeOwnershipMode(value, fallbackValue = 'managed_subtree') {
        const safeValue = clampString(value, fallbackValue);
        return OWNERSHIP_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function isElementLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addEventListener === 'function'
            && typeof value.removeEventListener === 'function';
    }

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function' ? appModules[factoryName] : null;
    }

    appModules.createRmtDomCompat = function createRmtDomCompat(deps = {}) {
        const globalTarget = deps.windowTarget || global;
        const documentTarget = Object.prototype.hasOwnProperty.call(deps, 'documentTarget')
            ? deps.documentTarget
            : (Object.prototype.hasOwnProperty.call(deps, 'document')
                ? deps.document
                : (globalTarget && globalTarget.document ? globalTarget.document : null));
        const genericHostAdapterFactory = resolveFactory('createRmtGenericHostAdapter', deps.createRmtGenericHostAdapter);
        const supportsTemplateApi = deps.supportsTemplateApi !== false;
        const supportsTemplateCompiler = deps.supportsTemplateCompiler !== false;
        const supportsTemplateArtifacts = deps.supportsTemplateArtifacts !== false;
        const supportsTemplateRuntimeRenderer = deps.supportsTemplateRuntimeRenderer !== false;
        const rmtCore = deps.rmtCore && typeof deps.rmtCore === 'object' ? deps.rmtCore : null;
        const rmt = deps.rmt
            || (rmtCore && rmtCore.rmt)
            || (rmtCore && typeof rmtCore.getRmt === 'function' ? rmtCore.getRmt() : null);
        const hostAdapter = deps.hostAdapter
            || (rmtCore && rmtCore.hostAdapter)
            || (rmtCore && typeof rmtCore.getHostAdapter === 'function' ? rmtCore.getHostAdapter() : null)
            || (typeof genericHostAdapterFactory === 'function'
                ? genericHostAdapterFactory({ globalTarget, documentTarget })
                : null);

        function resolveElement(target, options = {}) {
            if (isElementLike(target)) return target;
            if (target && isElementLike(target.element)) return target.element;
            const explicitElementId = clampString(options.elementId || (target && target.elementId), '');
            if (explicitElementId && documentTarget && typeof documentTarget.getElementById === 'function') {
                const directMatch = documentTarget.getElementById(explicitElementId);
                if (directMatch) return directMatch;
            }
            const explicitSelector = clampString(options.selector || (target && target.selector), '');
            if (explicitSelector && documentTarget && typeof documentTarget.querySelector === 'function') {
                const selectorMatch = documentTarget.querySelector(explicitSelector);
                if (selectorMatch) return selectorMatch;
            }
            if (typeof target === 'string' && documentTarget) {
                if (typeof documentTarget.getElementById === 'function') {
                    const elementById = documentTarget.getElementById(target);
                    if (elementById) return elementById;
                }
                if (typeof documentTarget.querySelector === 'function') {
                    return documentTarget.querySelector(target);
                }
            }
            return null;
        }

        function prepareIslandMount(contract = {}) {
            const element = contract.element;
            if (!isElementLike(element)) {
                throw new Error(`RmtDomCompat konnte kein gueltiges Root-Element fuer ${contract.rootId || 'unknown'} aufloesen.`);
            }
            if (
                contract.ownershipMode === 'replace_children'
                && contract.clearChildrenBeforeMount !== false
                && typeof element.replaceChildren === 'function'
            ) {
                element.replaceChildren();
            }
            return element;
        }

        function resolveElementRecord(target, options = {}) {
            const element = resolveElement(target, options);
            if (!element) return null;
            return Object.freeze({
                element,
                elementId: typeof element.id === 'string' ? element.id : ''
            });
        }

        function finalizeIslandUnmount(contract = {}, options = {}) {
            const element = contract && contract.element;
            if (
                contract
                && contract.ownershipMode === 'replace_children'
                && options.clearChildren === true
                && isElementLike(element)
                && typeof element.replaceChildren === 'function'
            ) {
                element.replaceChildren();
            }
            return true;
        }

        function getHostContract() {
            return Object.freeze({
                apiVersion: PUBLIC_API_VERSION,
                hostKind: hostAdapter && hostAdapter.hostKind ? hostAdapter.hostKind : 'generic',
                publicEntrypoints: [
                    'createRmtCore', 'createRmtDomCompat', 'createRmtPerformanceRuntime',
                    'createRmtPublicApi', 'createRmtTemplateApi', 'createRmtTemplateCompiler',
                    'createRmtTemplateArtifacts', 'createRmtTemplateRuntimeRenderer',
                    'createRmtTemplateExecutionPath', 'createRmtTemplateWorkerAdapter',
                    'createRmtTemplateServerAdapter', 'createRmtPrewarmWorkerSourceBuilder',
                    'createRmtPrewarmWorkerRuntime'
                ],
                compatEntrypoints: [
                    'createRmtCore', 'createRmtDomCompat', 'createRmtPerformanceRuntime',
                    'createRmtPublicApi', 'createRmtTemplateApi', 'createRmtTemplateCompiler',
                    'createRmtTemplateArtifacts', 'createRmtTemplateRuntimeRenderer',
                    'createRmtTemplateExecutionPath', 'createRmtTemplateWorkerAdapter',
                    'createRmtTemplateServerAdapter', 'createRmtPrewarmWorkerSourceBuilder',
                    'createRmtPrewarmWorkerRuntime'
                ],
                ownershipModes: OWNERSHIP_MODES.slice(),
                defaultOwnershipMode: 'managed_subtree',
                supportsDocumentLookup: !!documentTarget,
                supportsHydration: true,
                supportsReplaceChildren: !!(documentTarget || deps.allowDetachedElements === true),
                supportsCommandTransport: !!(rmt && typeof rmt.dispatchCommand === 'function'),
                supportsDiagnostics: !!(rmtCore && typeof rmtCore.getDiagnosticsHub === 'function'),
                supportsPerformanceBudgeting: true,
                supportsReactivity: !!(rmtCore && typeof rmtCore.getReactivity === 'function'),
                supportsTemplateLoading: supportsTemplateApi,
                supportedTemplateDocumentKinds: ['rmt_document'],
                supportedTemplateFileExtensions: ['.rmt', '.rmt.json', '.json'],
                preferredTemplateFileExtension: '.rmt',
                supportedTemplateBindingKinds: supportsTemplateRuntimeRenderer
                    ? ['text', 'attribute', 'property', 'class_toggle', 'command', 'root_event', 'template_outlet', 'template_repeat']
                    : [],
                supportedTemplateSlotKinds: supportsTemplateRuntimeRenderer
                    ? ['text', 'html_fragment', 'template']
                    : [],
                supportedTemplateExecutionModes: [
                    'runtime_render', 'hydrate_prerendered', 'worker_prerender_hydrate',
                    'server_prerender_hydrate', 'prerender_only'
                ],
                supportedTemplateHydrationModes: [
                    'runtime_render', 'hydrate_prerendered', 'worker_prerender_hydrate',
                    'server_prerender_hydrate', 'prerender_only'
                ],
                supportsTemplatePreparation: supportsTemplateCompiler,
                supportsTemplateArtifacts,
                supportsTemplateRuntimeBindings: supportsTemplateRuntimeRenderer,
                supportsTemplateSlotComposition: supportsTemplateRuntimeRenderer,
                supportsTemplateProps: supportsTemplateRuntimeRenderer,
                supportsTemplateActionBindings: supportsTemplateRuntimeRenderer,
                supportsTemplateHydrationContracts: supportsTemplateRuntimeRenderer,
                supportsTemplateErrorBoundaries: supportsTemplateRuntimeRenderer,
                supportsInsularHydration: supportsTemplateRuntimeRenderer,
                supportsMinimalDomPatching: supportsTemplateRuntimeRenderer,
                supportsWorkerPrerender: supportsTemplateApi,
                supportsPrewarmWorker: deps.supportsPrewarmWorker !== false,
                supportsServerPrerender: supportsTemplateApi
            });
        }

        return Object.freeze({
            apiVersion: PUBLIC_API_VERSION,
            finalizeIslandUnmount,
            getHostContract,
            getHostKind: () => (hostAdapter && hostAdapter.hostKind ? hostAdapter.hostKind : 'generic'),
            prepareIslandMount,
            resolveElement,
            resolveElementRecord,
            supportsOwnershipMode: (mode) => OWNERSHIP_MODES.includes(normalizeOwnershipMode(mode, '')),
            version: PUBLIC_API_VERSION
        });
    };
})(__XTENDRMT_GLOBAL__);
