/* modules/rmt-engine-host-adapter.js */
(function registerRmtEngineHostAdapterModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtEngineHostAdapter = function createRmtEngineHostAdapter(options = {}) {
        const adapter = options.adapter || options.hostAdapter || options.host || {};
        const windowTarget = adapter.windowTarget || options.windowTarget || global;
        const documentTarget = adapter.documentTarget || options.documentTarget || windowTarget.document || global.document || null;

        function resolveHostMethod(target, methodName) {
            if (target && typeof target[methodName] === 'function') return target[methodName].bind(target);
            if (global && typeof global[methodName] === 'function') return global[methodName].bind(global);
            return null;
        }

        function scheduleTimeout(callback, delay = 0) {
            if (typeof adapter.scheduleTimeout === 'function') return adapter.scheduleTimeout(callback, delay);
            const schedule = resolveHostMethod(windowTarget, 'setTimeout');
            if (!schedule) throw new Error('Rmt hostAdapter benoetigt scheduleTimeout().');
            return schedule(callback, Math.max(Number(delay) || 0, 0));
        }

        function clearTimeoutSafe(handle) {
            if (typeof adapter.clearTimeout === 'function') {
                adapter.clearTimeout(handle);
                return;
            }
            const clear = resolveHostMethod(windowTarget, 'clearTimeout');
            if (clear && handle !== null && typeof handle !== 'undefined') clear(handle);
        }

        function listen(target, eventType, handler, listenerOptions) {
            if (typeof adapter.listen === 'function') {
                return adapter.listen(target, eventType, handler, listenerOptions);
            }
            if (!target || typeof target.addEventListener !== 'function') {
                throw new Error(`Rmt listener target ist ungueltig fuer ${String(eventType || '').trim() || 'unknown'}`);
            }
            target.addEventListener(eventType, handler, listenerOptions);
            let active = true;
            return function disposeListener() {
                if (!active) return false;
                active = false;
                if (typeof target.removeEventListener === 'function') {
                    target.removeEventListener(eventType, handler, listenerOptions);
                }
                return true;
            };
        }

        function createCustomEvent(eventName, init = {}) {
            return typeof adapter.createCustomEvent === 'function'
                ? adapter.createCustomEvent(eventName, init)
                : (typeof global.CustomEvent === 'function'
                    ? new global.CustomEvent(String(eventName || '').trim(), init)
                    : null);
        }

        function emit(target, eventName, detail, init = {}) {
            if (typeof adapter.emit === 'function') return adapter.emit(target, eventName, detail, init);
            if (!target || typeof target.dispatchEvent !== 'function') return false;
            const eventInstance = createCustomEvent(eventName, { ...init, detail });
            if (!eventInstance) return false;
            target.dispatchEvent(eventInstance);
            return true;
        }

        return {
            hostKind: String(adapter.hostKind || adapter.kind || options.hostKind || 'generic').trim() || 'generic',
            windowTarget,
            documentTarget,
            scheduleTimeout,
            clearTimeout: clearTimeoutSafe,
            scheduleAnimationFrame: typeof adapter.scheduleAnimationFrame === 'function'
                ? adapter.scheduleAnimationFrame.bind(adapter)
                : (callback) => scheduleTimeout(callback, 16),
            cancelAnimationFrame: typeof adapter.cancelAnimationFrame === 'function'
                ? adapter.cancelAnimationFrame.bind(adapter)
                : clearTimeoutSafe,
            scheduleIdleCallback: typeof adapter.scheduleIdleCallback === 'function'
                ? adapter.scheduleIdleCallback.bind(adapter)
                : (callback) => scheduleTimeout(callback, 0),
            cancelIdleCallback: typeof adapter.cancelIdleCallback === 'function'
                ? adapter.cancelIdleCallback.bind(adapter)
                : clearTimeoutSafe,
            createAbortController: typeof adapter.createAbortController === 'function'
                ? adapter.createAbortController.bind(adapter)
                : (() => typeof global.AbortController === 'function' ? new global.AbortController() : null),
            createCustomEvent,
            now: typeof adapter.now === 'function'
                ? adapter.now.bind(adapter)
                : (() => (
                    windowTarget
                    && windowTarget.performance
                    && typeof windowTarget.performance.now === 'function'
                      ? windowTarget.performance.now()
                      : Date.now()
                )),
            listen,
            emit
        };
    };
})(__XTENDRMT_GLOBAL__);
