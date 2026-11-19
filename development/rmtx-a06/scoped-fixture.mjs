import scopedModel from './scoped-model.cjs';
export function createScopedFixture({source,document,React,ReactDOM,Vue,createFabric,kernelModule,surfaces,state,peerWait}, extra = {}) {
    const root = document.createElement('main'); document.body.append(root);
    const admissions=[],actualFabric=createFabric(),fabric={...actualFabric,runFiber(input,callback){return actualFabric.runFiber(input,fiber=>{if(input.metadata?.schedulerJobId)admissions.push({schedulerJobId:input.metadata.schedulerJobId,operation:input.operation});return callback(fiber);});},createBoundary(...args){const boundary=actualFabric.createBoundary(...args);return {...boundary,run(phase,task,metadata){if(metadata?.kernelJobId)admissions.push(metadata);return boundary.run(phase,task,metadata);}};}};
    const previous = state.snapshot().data, hosts = [], contexts = [], controllers = [], requests = [];let graph;
    const adapters = Object.fromEntries(Object.entries(source.platform.adapters).map(([framework, api]) => {
      const method = framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter';
      return [framework, { ...api, [method](options) { const entry = { options }; const proxy = options.component;
        const component = framework === 'react' ? props => { entry.facade = props.xtension; return React.createElement(proxy, props); }
          : { inheritAttrs: false, setup(_props, { attrs }) { return () => { entry.facade = attrs.xtension; return Vue.h(proxy, { ...attrs }); }; } };
        entry.host = api[method]({ ...options, component }); hosts.push(entry); return entry.host; } }];
    }));
    const companion = { ...source.companion, createHostFactory(ports) {
      return source.companion.createHostFactory({ ...ports, compositionRuntime: { createMaracaXTensionHostFactory(options) {
        const loadProviders = Object.fromEntries(Object.entries(options.loadProviders).map(([id, load]) => [id, async () => {
          requests.push({ id, admitted: admissions.length > 0 });
          if (extra.waitForProvider) await extra.waitForProvider(id); return load();
        }]));
        const factory = ports.compositionRuntime.createMaracaXTensionHostFactory({ ...options, loadProviders });
        const createHost = context => { contexts.push(context); return factory(context); };
        if (typeof factory.prewarm === 'function') Object.defineProperty(createHost, 'prewarm', { value: request => factory.prewarm(request) });
        return createHost;
      } } });
    } };
    const app = source.entry.createXtendMaraca({ xtensionCompanion: companion, xtensionPlatform: { ...source.platform, adapters }, windowTarget: document.defaultView, documentTarget: document, platformTarget: {},
      runtimeApis: { XTendRmtSurfaceResourceGraphRuntime: { ...surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph=surfaces.createRmtSurfaceResourceGraphRuntime(options);return graph; } } },
      kernelControllerModule: { ...kernelModule, createRmtKernelOrchestrationController(options) { const controller = kernelModule.createRmtKernelOrchestrationController(options); controllers.push(controller); return controller; } } });
    const grants = { 'product-gallery': { lifecycle: { lane: 'visible' }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } },
      'product-reviews': { lifecycle: { lane: 'idle' }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } } };
    const options = { root, fabric, stateProjectionTarget: state, dataSourceAdapters:{rest:scopedModel.createDataSourceAdapter()}, xtensions: { grants, async loadPeerGroup({ group }) { await peerWait?.(); return group.framework === 'react' ? { React, ReactDOM } : { Vue }; } } };
    return { get graph(){return graph;}, app, root, hosts, contexts, controllers, fabric, options, requests,
      async boot() { await app.boot(options); await app.facade.whenXTensionsIdle(); return this; },
      async idle() { await app.facade.whenXTensionsIdle(); },
      async close() { app.dispose(); await app.facade.whenXTensionsIdle(); root.remove(); state.clear(); state.batchUpdate(previous); } };
  }
