/* modules/rmt-browser-host-adapter.js */
(function registerRmtBrowserHostAdapterModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtBrowserHostAdapter = function createRmtBrowserHostAdapter(deps = {}) {
        const globalTarget = deps.windowTarget || global;
        const documentTarget = deps.documentTarget || globalTarget.document || null;

        function getGlobalMethod(methodName) {
            if (globalTarget && typeof globalTarget[methodName] === 'function') {
                return globalTarget[methodName].bind(globalTarget);
            }
            if (typeof globalThis !== 'undefined' && typeof globalThis[methodName] === 'function') {
                return globalThis[methodName].bind(globalThis);
            }
            return null;
        }

        function scheduleTimeout(callback, delay = 0) {
            const setTimeoutFn = getGlobalMethod('setTimeout');
            if (!setTimeoutFn) {
                throw new Error('RmtBrowserHostAdapter benoetigt setTimeout().');
            }
            return setTimeoutFn(callback, Math.max(Number(delay) || 0, 0));
        }

        function clearTimeoutSafe(handle) {
            const clearTimeoutFn = getGlobalMethod('clearTimeout');
            if (!clearTimeoutFn || handle === null || typeof handle === 'undefined') return false;
            clearTimeoutFn(handle);
            return true;
        }

        function scheduleAnimationFrame(callback) {
            if (globalTarget && typeof globalTarget.requestAnimationFrame === 'function') {
                return globalTarget.requestAnimationFrame(callback);
            }
            return scheduleTimeout(callback, 16);
        }

        function cancelAnimationFrameSafe(handle) {
            if (globalTarget && typeof globalTarget.cancelAnimationFrame === 'function') {
                globalTarget.cancelAnimationFrame(handle);
                return true;
            }
            return clearTimeoutSafe(handle);
        }

        function scheduleIdleCallback(callback, options = {}) {
            if (globalTarget && typeof globalTarget.requestIdleCallback === 'function') {
                return globalTarget.requestIdleCallback(callback, {
                    timeout: Number.isFinite(options.timeout) ? options.timeout : 220
                });
            }
            return scheduleTimeout(callback, 0);
        }

        function cancelIdleCallbackSafe(handle) {
            if (globalTarget && typeof globalTarget.cancelIdleCallback === 'function') {
                globalTarget.cancelIdleCallback(handle);
                return true;
            }
            return clearTimeoutSafe(handle);
        }

        function resolveCtor(ctorName, explicitCtor) {
            if (typeof explicitCtor === 'function') return explicitCtor;
            if (globalTarget && typeof globalTarget[ctorName] === 'function') {
                return globalTarget[ctorName];
            }
            if (typeof globalThis !== 'undefined' && typeof globalThis[ctorName] === 'function') {
                return globalThis[ctorName];
            }
            return null;
        }

        function createAbortController() {
            const AbortControllerCtor = resolveCtor('AbortController', deps.AbortControllerCtor);
            return AbortControllerCtor ? new AbortControllerCtor() : null;
        }

        function createCustomEvent(eventName, init = {}) {
            const CustomEventCtor = resolveCtor('CustomEvent', deps.CustomEventCtor);
            if (!CustomEventCtor) return null;
            return new CustomEventCtor(String(eventName || '').trim(), init);
        }

        function getNow() {
            if (globalTarget && globalTarget.performance && typeof globalTarget.performance.now === 'function') {
                return globalTarget.performance.now();
            }
            if (typeof globalThis !== 'undefined' && globalThis.performance && typeof globalThis.performance.now === 'function') {
                return globalThis.performance.now();
            }
            return Date.now();
        }

        return Object.freeze({
            hostKind: 'browser_dom',
            windowTarget: globalTarget,
            documentTarget,
            now: getNow,
            scheduleTimeout,
            clearTimeout: clearTimeoutSafe,
            scheduleAnimationFrame,
            cancelAnimationFrame: cancelAnimationFrameSafe,
            scheduleIdleCallback,
            cancelIdleCallback: cancelIdleCallbackSafe,
            createAbortController,
            createCustomEvent
        });
    };
})(__XTENDRMT_GLOBAL__);
