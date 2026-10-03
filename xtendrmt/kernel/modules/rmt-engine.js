/* modules/rmt-engine.js */
(function registerRmtEngineModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtEngine = function createRmtEngine(deps = {}) {
        if (typeof appModules.createRmtEngineController !== 'function') {
            throw new Error('RMT Core benoetigt createRmtEngineController().');
        }
        if (typeof appModules.createRmtEngineHostAdapter !== 'function') {
            throw new Error('RMT Core benoetigt createRmtEngineHostAdapter().');
        }

        const hostAdapter = appModules.createRmtEngineHostAdapter({
            ...deps,
            adapter: deps.hostAdapter || deps.renderHostAdapter || deps.hostRuntime || deps.host || null
        });
        const now = hostAdapter.now;
        const diagnosticsHub = deps.diagnosticsHub || deps.rmtDiagnosticsHub || deps.schedulerDiagnosticsHub || null;
        const panicMonitor = deps.panicMonitor || deps.kernelPanicMonitor || null;
        const diagnostics = deps.schedulerDiagnostics
            || deps.rmtDiagnostics
            || deps.renderDiagnostics
            || deps.diagnostics
            || (typeof appModules.createRmtDiagnostics === 'function'
                ? appModules.createRmtDiagnostics({ now })
                : null);
        const reactivity = deps.reactivity
            || deps.rmtReactivity
            || deps.stateReactivity
            || (typeof appModules.createRmtReactivity === 'function'
                ? appModules.createRmtReactivity({ now, diagnosticsHub })
                : null);
        const commandBus = deps.commandBus
            || deps.rmtCommandBus
            || deps.commands
            || (typeof appModules.createRmtCommandBus === 'function'
                ? appModules.createRmtCommandBus({
                    hostPort: {
                        schema: 'xtend.rmt.command-host-port.v1',
                        now,
                        createAbortController: hostAdapter.createAbortController
                    },
                    diagnosticsHub,
                    panicMonitor
                })
                : null);

        return appModules.createRmtEngineController({
            ...deps,
            hostAdapter,
            diagnostics,
            schedulerDiagnostics: diagnostics,
            diagnosticsHub,
            panicMonitor,
            reactivity,
            commandBus
        });
    };
})(__XTENDRMT_GLOBAL__);
