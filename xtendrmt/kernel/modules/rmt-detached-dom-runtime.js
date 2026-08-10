/* modules/rmt-detached-dom-runtime.js */
(function registerRmtDetachedDomRuntimeModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function'
            ? appModules[factoryName]
            : null;
    }

    function resolveDetachedDocumentTarget(deps = {}) {
        if (Object.prototype.hasOwnProperty.call(deps, 'documentTarget')) {
            return deps.documentTarget || null;
        }
        return null;
    }

    function wrapHostAdapter(hostAdapter, overrides = {}) {
        if (!hostAdapter || typeof hostAdapter !== 'object') return null;
        return Object.freeze({
            ...hostAdapter,
            hostKind: clampString(overrides.hostKind, 'detached_dom'),
            windowTarget: Object.prototype.hasOwnProperty.call(overrides, 'windowTarget')
                ? overrides.windowTarget
                : hostAdapter.windowTarget,
            documentTarget: Object.prototype.hasOwnProperty.call(overrides, 'documentTarget')
                ? overrides.documentTarget
                : (hostAdapter.documentTarget || null)
        });
    }

    function wrapDetachedRuntime(runtime) {
        if (!runtime || typeof runtime !== 'object') {
            throw new Error('RmtDetachedDomRuntime konnte keine gueltige BrowserRuntime aufloesen.');
        }

        return Object.freeze({
            ...runtime,
            runtimeKind: 'detached_dom',
            withDefaults: (nextDefaults = {}) => wrapDetachedRuntime(runtime.withDefaults(nextDefaults))
        });
    }

    appModules.createRmtDetachedRuntime = function createRmtDetachedRuntime(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = resolveDetachedDocumentTarget(deps);
        const createRmtBrowserRuntimeFactory = resolveFactory('createRmtBrowserRuntime', deps.createRmtBrowserRuntime);
        const createRmtBrowserHostAdapterFactory = resolveFactory('createRmtBrowserHostAdapter', deps.createRmtBrowserHostAdapter);

        if (typeof createRmtBrowserRuntimeFactory !== 'function') {
            throw new Error('RMT DetachedRuntime benoetigt createRmtBrowserRuntime().');
        }

        const baseHostAdapter = deps.hostAdapter
            || deps.detachedHostAdapter
            || deps.browserHostAdapter
            || (typeof createRmtBrowserHostAdapterFactory === 'function'
                ? createRmtBrowserHostAdapterFactory({
                    windowTarget,
                    documentTarget
                })
                : null);
        const hostAdapter = wrapHostAdapter(baseHostAdapter, {
            hostKind: clampString(deps.hostKind, 'detached_dom'),
            windowTarget,
            documentTarget
        });

        if (!hostAdapter || typeof hostAdapter !== 'object') {
            throw new Error('RMT DetachedRuntime benoetigt einen gueltigen HostAdapter.');
        }

        const browserRuntime = createRmtBrowserRuntimeFactory({
            ...deps,
            windowTarget,
            documentTarget,
            hostAdapter,
            allowDetachedElements: true
        });

        return wrapDetachedRuntime(browserRuntime);
    };
})(__XTENDRMT_GLOBAL__);
