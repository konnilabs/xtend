/* modules/rmt-template-execution-path.js */
(function registerRmtTemplateExecutionPathModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function' ? appModules[factoryName] : null;
    }

    appModules.createRmtTemplateExecutionPath = function createRmtTemplateExecutionPath(deps = {}) {
        const templateApi = deps.templateApi && typeof deps.templateApi === 'object'
            ? deps.templateApi
            : null;
        const registry = deps.registry && typeof deps.registry === 'object'
            ? deps.registry
            : (deps.templateRegistry && typeof deps.templateRegistry === 'object'
                ? deps.templateRegistry
                : (templateApi && typeof templateApi.getRegistry === 'function'
                    ? templateApi.getRegistry()
                    : null));
        if (!registry || typeof registry.resolveTemplate !== 'function') {
            throw new Error('RmtTemplateExecutionPath benoetigt eine gueltige TemplateRegistry.');
        }

        const executionModelFactory = resolveFactory(
            'createRmtTemplateExecutionModel',
            deps.createRmtTemplateExecutionModel
        );
        const trustModelFactory = resolveFactory(
            'createRmtTemplateTrustModel',
            deps.createRmtTemplateTrustModel
        );
        const interactionAdapterFactory = resolveFactory(
            'createRmtTemplateInteractionAdapter',
            deps.createRmtTemplateInteractionAdapter
        );
        const recoveryModelFactory = resolveFactory(
            'createRmtTemplateRecoveryModel',
            deps.createRmtTemplateRecoveryModel
        );
        const executionControllerFactory = resolveFactory(
            'createRmtTemplateExecutionController',
            deps.createRmtTemplateExecutionController
        );
        const runtimeRendererFactory = resolveFactory(
            'createRmtTemplateRuntimeRenderer',
            deps.createRmtTemplateRuntimeRenderer
        );
        if (
            typeof executionModelFactory !== 'function'
            || typeof trustModelFactory !== 'function'
            || typeof recoveryModelFactory !== 'function'
            || typeof interactionAdapterFactory !== 'function'
            || typeof executionControllerFactory !== 'function'
        ) {
            throw new Error('RmtTemplateExecutionPath konnte seine MVC-Ports nicht aufloesen.');
        }

        const hostAdapter = deps.hostAdapter
            || (deps.rmtCore && typeof deps.rmtCore.getHostAdapter === 'function'
                ? deps.rmtCore.getHostAdapter()
                : null);
        const now = typeof deps.now === 'function'
            ? deps.now
            : (hostAdapter && typeof hostAdapter.now === 'function'
                ? () => hostAdapter.now()
                : undefined);
        const executionModel = deps.executionModel && typeof deps.executionModel === 'object'
            ? deps.executionModel
            : executionModelFactory({ registry, now });
        const trustModel = deps.trustModel && typeof deps.trustModel === 'object'
            ? deps.trustModel
            : trustModelFactory();
        const recoveryModel = deps.recoveryModel && typeof deps.recoveryModel === 'object'
            ? deps.recoveryModel
            : recoveryModelFactory({ now });
        const interactionAdapter = deps.interactionAdapter && typeof deps.interactionAdapter === 'object'
            ? deps.interactionAdapter
            : interactionAdapterFactory({
                ...deps,
                executionModel,
                trustModel,
                recoveryModel,
                registry,
                templateApi,
                now,
                createRmtTemplateRuntimeRenderer: runtimeRendererFactory
            });
        return executionControllerFactory({
            executionModel,
            interactionAdapter
        });
    };
})(__XTENDRMT_GLOBAL__);
