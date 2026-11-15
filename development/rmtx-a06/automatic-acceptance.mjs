// Tests the generated app/companion/platform, not the manual A06 factory.
export async function runAutomaticAcceptance({ source, document, React, ReactDOM, Vue, createFabric, kernelModule, surfaces, state, peerWait } = {}) {
  const names = [], check = (value, message) => { if (!value) throw Error(message); };
  const test = async (name, fn) => { try { await fn(); names.push(name); } catch(error) { throw new Error(name + ': ' + error.message, { cause:error }); } };
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  function fixture(extra = {}) {
    const root = document.createElement('main'); document.body.append(root);
    const admissions=[],actualFabric=createFabric(),fabric={...actualFabric,createBoundary(...args){const boundary=actualFabric.createBoundary(...args);return {...boundary,run(phase,task,metadata){if(metadata?.kernelJobId)admissions.push(metadata);return boundary.run(phase,task,metadata);}};}};
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
        return context => { contexts.push(context); return factory(context); };
      } } });
    } };
    const app = source.entry.createXtendMaraca({ xtensionCompanion: companion, xtensionPlatform: { ...source.platform, adapters }, windowTarget: document.defaultView, documentTarget: document, platformTarget: {},
      runtimeApis: { XTendRmtSurfaceResourceGraphRuntime: { ...surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph=surfaces.createRmtSurfaceResourceGraphRuntime(options);return graph; } } },
      kernelControllerModule: { ...kernelModule, createRmtKernelOrchestrationController(options) { const controller = kernelModule.createRmtKernelOrchestrationController(options); controllers.push(controller); return controller; } } });
    const grants = { 'product-gallery': { lifecycle: { lane: 'visible' }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } },
      'product-reviews': { lifecycle: { lane: 'idle' }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } } };
    const options = { root, fabric, stateProjectionTarget: state, xtensions: { grants, async loadPeerGroup({ group }) { await peerWait?.(); return group.framework === 'react' ? { React, ReactDOM } : { Vue }; } } };
    return { get graph(){return graph;}, app, root, hosts, contexts, controllers, fabric, options, requests,
      async boot() { await app.boot(options); await app.facade.whenXTensionsIdle(); return this; },
      async idle() { await app.facade.whenXTensionsIdle(); },
      async close() { app.dispose(); await app.facade.whenXTensionsIdle(); root.remove(); state.clear(); state.batchUpdate(previous); } };
  }
  await test('generated v8 browser app boots both providers with exact component interfaces through Kernel/Fabric', async () => {
    const f = fixture(); try { await f.boot();
      check(f.app.apiVersion === '8.0.0' && f.app.facade.snapshot().schema === 'xtend.maraca.plan-runtime.v10', 'new runtime versions');
      check(f.root.querySelectorAll('select').length === 2 && f.controllers.length === 1, 'two real roots, one native Kernel');
      check(f.requests.length === 2 && f.requests.every(row => row.admitted), 'literal provider imports follow actual Fabric admission');
      check(f.contexts[0].container !== f.contexts[1].container, 'separate render targets');
      check(f.hosts.every(entry => entry.host.snapshot().resourceGraph.surfaceId === 'product-details'), 'common owner');
      check(f.controllers[0].core.rmt.listResources().length === 2, 'two native resource leases');
    } finally { await f.close(); }
  });
  await test('provider events update Model/XTend State and preserve the sibling framework root', async () => {
    const f = fixture(); try { await f.boot(); const [gallery,reviews] = f.root.querySelectorAll('select');
      gallery.value = 'back'; gallery.dispatchEvent(new document.defaultView.Event('change', { bubbles: true })); await f.idle();
      check(state.getPath('product.selectedImageId') === 'back', 'gallery state'); check(f.root.querySelectorAll('select')[1] === reviews, 'Vue root retained');
      reviews.value = 'rating'; reviews.dispatchEvent(new document.defaultView.Event('change', { bubbles: true })); await f.idle();
      check(state.getPath('product.reviewsSort') === 'rating' && f.root.querySelectorAll('select')[0] === gallery, 'mapped Vue order reaches Action sort');
    } finally { await f.close(); }
  });
  await test('common owner close/resume controls both hosts and stages the latest controlled values', async () => {
    const f = fixture(); try { await f.boot(); const nodes = [...f.root.querySelectorAll('select')];
      check(f.graph, 'native owner graph');
      f.graph.closeSurface('product-details'); await f.idle(); check(f.hosts.every(entry => entry.host.snapshot().suspended), 'both suspended');
      await f.app.facade.dispatchCommand('product.selectImage', { imageId: 'back' }); await f.idle(); check(nodes[0].value === 'front', 'closed projection held');
      await f.graph.openSurface('product-details'); await f.idle(); check(nodes[0].value === 'back' && f.root.querySelectorAll('select')[1] === nodes[1], 'resume preserves roots');
    } finally { await f.close(); }
  });
  await test('conditional removal retains sibling and revokes the former callback across reincarnation', async () => {
    const f = fixture(); try { await f.boot(); const old = f.contexts[0], sibling = f.root.querySelectorAll('select')[1];
      await f.app.facade.dispatchCommand('hosts.replace', { hosts: { gallery: false, reviews: true } }); await f.idle();
      check(f.root.querySelectorAll('select').length === 1 && f.root.querySelector('select') === sibling, 'sibling retained');
      old.onEvent({ ok:true,direction:'upstream',event:'selectImage',payloadSchema:old.events.selectImage,payload:{imageId:'back'},source:{hostId:old.hostId,surfaceId:old.surfaceId,xtensionId:old.xtensionId} });
      check(state.getPath('product.selectedImageId') === 'front', 'revoked callback');
      await f.app.facade.dispatchCommand('hosts.replace', { hosts: { gallery: true, reviews: true } }); await f.idle(); check(f.root.querySelectorAll('select').length === 2, 'new incarnation mounts');
    } finally { await f.close(); }
  });
  await test('runtime rejects extra props and invalid raw Vue payloads before dispatch', async () => {
    const f = fixture(); try { await f.boot(); const entry=f.hosts.find(entry=>entry.options.expectedVersions.vue), before=state.getPath('product.reviewsSort');
      const update=await entry.host.update({type:'props.update',props:{productId:'p1',sort:'recent',title:'leak'}});check(!update.ok&&!f.root.querySelector('[title]'),'no unknown prop or attribute');
      for(const payload of [{sort:'rating'},{order:42},{order:'rating',extra:true}]){check(entry.host.emit({type:'changeSort',payload}).ok===false,'raw payload rejected');await f.idle();check(state.getPath('product.reviewsSort')===before,'invalid payload rejected');}
    } finally { await f.close(); }
  });
  await test('common owner destruction immediately cancels work and releases both native resource leases', async () => {
    const f=fixture(),release=deferred(),started=[deferred(),deferred()];let writes=0,settled;
    try { await f.boot();const jobs=f.hosts.map((entry,index)=>entry.facade.work.schedule('inspect',async context=>{started[index].resolve();await release.promise;context.guard(()=>{writes++;})();}));settled=Promise.allSettled(jobs.map(job=>job.result));
      await Promise.all(started.map(value=>value.promise));f.graph.destroySurface('product-details');
      check(jobs.every(job=>job.signal.aborted),'both work lifetimes synchronously revoked');check(f.controllers[0].core.rmt.listResources().length===0,'no retained native resource lease');
      release.resolve();await settled;await f.idle();check(writes===0&&f.root.querySelectorAll('select').length===0,'late results and framework roots revoked');
    } finally {release.resolve();await settled;await f.close();}
  });
  await test('destroying the shared owner during native provider loading fences both late roots', async () => {
    const entered=deferred(),release=deferred(),f=fixture({waitForProvider:async()=>{entered.resolve();await release.promise;}});let boot;
    try {boot=f.boot();await entered.promise;f.graph.destroySurface('product-details');check(f.controllers[0].core.rmt.listResources().length===0,'owner immediately releases all leases');release.resolve();await boot.catch(()=>{});await f.idle();check(f.root.querySelectorAll('select').length===0,'late loads cannot mount');}
    finally {release.resolve();await boot?.catch(()=>{});await f.close();}
  });
  await test('disposing a pending automatic boot fences late provider imports and releases native ownership', async () => {
    const entered=deferred(),release=deferred(),f=fixture({waitForProvider:async()=>{entered.resolve();await release.promise;}});
    try { const pending=f.boot();await entered.promise;f.app.dispose();release.resolve();await pending.catch(()=>{});await f.idle();check(f.root.querySelectorAll('select').length===0,'late factories never mount'); }
    finally { release.resolve();await f.close(); }
  });
  return { passed:true,cases:names.length,names,automaticCompositionSupported:true,ssrAcceptancePerformed:false,acceptedForRelease:false };
}
