/* modules/rmt-generic-host-adapter.js */
(function registerRmtGenericHostAdapterModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtGenericHostAdapter = function createRmtGenericHostAdapter(options = {}) {
        const hostGlobal = options.hostGlobal || global;
        const documentTarget = Object.prototype.hasOwnProperty.call(options, 'documentTarget')
            ? options.documentTarget
            : (hostGlobal && hostGlobal.document ? hostGlobal.document : null);

        function scheduleTimeout(callback, delay = 0) {
            const schedule = hostGlobal ? Reflect.get(hostGlobal, 'setTimeout') : null;
            if (typeof schedule === 'function') {
                return schedule.call(hostGlobal, callback, Math.max(Number(delay) || 0, 0));
            }
            throw new Error('RmtGenericHostAdapter konnte keinen gueltigen setTimeout()-Host aufloesen.');
        }

        function clearTimeoutSafe(handle) {
            const cancel = hostGlobal ? Reflect.get(hostGlobal, 'clearTimeout') : null;
            if (typeof cancel === 'function') {
                cancel.call(hostGlobal, handle);
                return true;
            }
            return false;
        }

        return Object.freeze({
            hostKind: documentTarget ? 'generic_dom' : 'generic',
            windowTarget: hostGlobal,
            documentTarget,
            now: () => {
                if (
                    hostGlobal
                    && hostGlobal.performance
                    && typeof hostGlobal.performance.now === 'function'
                ) {
                    return hostGlobal.performance.now();
                }
                if (hostGlobal && hostGlobal.Date && typeof hostGlobal.Date.now === 'function') {
                    return hostGlobal.Date.now();
                }
                return 0;
            },
            scheduleTimeout,
            clearTimeout: clearTimeoutSafe,
            scheduleAnimationFrame: (callback) => scheduleTimeout(callback, 16),
            cancelAnimationFrame: clearTimeoutSafe,
            scheduleIdleCallback: (callback) => scheduleTimeout(callback, 0),
            cancelIdleCallback: clearTimeoutSafe,
            createAbortController: () => (
                hostGlobal && typeof hostGlobal.AbortController === 'function'
                    ? new hostGlobal.AbortController()
                    : null
            ),
            createCustomEvent: (eventName, init = {}) => (
                hostGlobal && typeof hostGlobal.CustomEvent === 'function'
                    ? new hostGlobal.CustomEvent(String(eventName || '').trim(), init)
                    : null
            )
        });
    };
})(__XTENDRMT_GLOBAL__);
