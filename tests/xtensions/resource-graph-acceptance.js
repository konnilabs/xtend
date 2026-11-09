'use strict';
const react = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const vue = require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');

async function runResourceGraphAcceptance({ React, ReactDOM, Vue, document, test, check, equal }) {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const { createSurfaceController } = await import('../../components/xsurfacemanager-controller.js');
  const { createRmtSurfaceResourceGraphRuntime } = await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js');
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  async function rejected(promise) { let error; try { await promise; } catch (caught) { error = caught; } check(!!error, 'owned work rejects'); }
  async function until(predicate) { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); } throw new Error('Graph host did not settle.'); }
  function fixture(framework, extra = {}) {
    const root = document.createElement('main'), container = document.createElement('section'); root.append(container); document.body.append(root);
    const scheduler = createRmtKernelScheduler({ preferPostTask: false }), kernel = createRmtCore({ scheduler, documentTarget: document, windowTarget: document.defaultView }).rmt;
    kernel.mountRoot('graph-root', root);
    const fabric = createXtendFabric(), surfaceController = createSurfaceController({ fabric });
    const surfaceGraph = createRmtSurfaceResourceGraphRuntime({ surfaces: [{ id: 'panel', initialState: extra.closed ? 'closed' : 'open' }], surfaceController, strict: true });
    surfaceGraph.materialize();
    const stats = { starts: 0, stops: 0, destroyed: 0, facade: null };
    const register = facade => { stats.facade = facade; return facade.resources.register('subscription', () => {
      stats.starts++; extra.onStart?.(surfaceGraph, stats); return () => { stats.stops++; extra.onStop?.(surfaceGraph, stats); };
    }); };
    const component = framework === 'react' ? function Panel(props) {
      React.useLayoutEffect(() => { const stop = register(props.xtension); return () => { stats.destroyed++; stop(); }; }, []);
      return React.createElement('output', null, props.title);
    } : { props: ['title', 'xtension'], setup(props) {
      let stop; Vue.onMounted(() => { stop = register(props.xtension); }); Vue.onUnmounted(() => { stats.destroyed++; stop?.(); });
      return () => Vue.h('output', props.title);
    } };
    const factory = (framework === 'react' ? react : vue)[framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter'];
    const config = { container, component, peers: framework === 'react' ? { React, ReactDOM } : { Vue }, fabric,
      kernelWork: { scheduler, rootId: 'graph-root', scope: 'graph-instance', work: { held: { lane: 'background' } } },
      resourceGraph: { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' },
      policy: { allowedResources: ['subscription'] }, ...extra.options };
    const adapter = factory(config);
    return { root, container, scheduler, kernel, surfaceGraph, surfaceController, fabric, config, factory, adapter, stats,
      mount: () => adapter.mount(container, { title: 'initial' }),
      async close() { await adapter.unmount(); if (surfaceController.readSnapshot({ includeDestroyed: true }).surfaces.length) surfaceGraph.dispose(); surfaceController.dispose(); kernel.disposeRoot('graph-root'); scheduler.dispose(); root.remove(); }
    };
  }
  for (const framework of ['react', 'vue']) {
    await test(`A03.2: ${framework} owns a real kernel resource linked to a concrete Surface generation`, async () => {
      const f = fixture(framework); try {
        equal(f.kernel.listResources().length, 0, 'construction creates no lease'); check((await f.mount()).ok, 'real mount succeeds');
        equal(f.adapter.apiVersion, '4.0.0', 'graph contract has a separate API major'); equal(f.adapter.schema, 'xtend.xtensions.runtime-host-controller.v4', 'host contract is versioned');
        const binding = f.adapter.snapshot().resourceGraph, resource = f.kernel.listResources('graph-root')[0];
        equal(binding.schema, 'xtend.xtensions.resource-graph-binding.v1', 'owned binding snapshot is versioned');
        equal([resource.id, resource.type, resource.meta.surfaceId, resource.meta.surfaceGeneration], [binding.resourceId, 'xtension-host', 'panel', binding.surfaceGeneration], 'actual resource descriptor carries the owner');
        const fiber = f.fabric.getFibers().find(item => item.phase === 'mount');
        equal([fiber.metadata.kernelResourceId, fiber.metadata.owningSurfaceId], [resource.id, 'panel'], 'Fabric identifies the graph edge');
        equal(f.scheduler.getJob(fiber.metadata.kernelJobId).snapshot().request.metadata.kernelResourceId, resource.id, 'the actual kernel job identifies its resource');
        await f.adapter.unmount(); equal(f.kernel.listResources().length, 0, 'manual cleanup releases only the lease');
        check(f.kernel.hasRoot('graph-root'), 'application root remains mounted'); equal(f.surfaceGraph.getSurface('panel').state, 'open', 'host does not own the Surface lifecycle');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} rejects foreign roots schedulers and missing Surface owners before admission`, async () => {
      const f = fixture(framework); try {
        for (const changed of [
          { resourceGraph: null }, { resourceGraph: { ...f.config.resourceGraph, surfaceId: 'missing' } },
          { kernelWork: { ...f.config.kernelWork, rootId: 'missing' } },
          { resourceGraph: { ...f.config.resourceGraph, kernel: { ...f.kernel, getScheduler: () => ({}) } } },
          { resourceGraph: { ...f.config.resourceGraph, kernel: { ...f.kernel, getRootElement: () => document.createElement('main') } } }
        ]) {
          let host, error; try { host = f.factory({ ...f.config, ...changed }); } catch (caught) { error = caught; }
          if (host) { check(!(await host.mount(f.container, {})).ok, 'invalid owner is rejected'); await host.unmount(); }
          else check(!!error, 'invalid graph config rejects construction');
          equal(f.kernel.listResources().length, 0, 'invalid owners never acquire a resource');
        }
        equal(f.fabric.getFibers().filter(item => item.phase === 'mount').length, 0, 'invalid owners never enter Fabric mount');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} Surface close immediately revokes running cooperative work`, async () => {
      const f = fixture(framework), entered = deferred(), release = deferred(); try {
        await f.mount(); let context, guard, hits = 0;
        const job = f.stats.facade.work.schedule('held', async value => { context = value; guard = value.guard(() => hits++); entered.resolve(); await release.promise; guard(); }); await entered.promise;
        f.surfaceGraph.closeSurface('panel'); check(context.signal.aborted && !context.isCurrent(), 'Surface commit synchronously fences work'); equal(f.stats.stops, 1, 'resource cleanup is synchronous too');
        await rejected(job.result); equal(f.stats.facade.work.schedule('held', () => 1).jobId, null, 'inactive Surface cannot create replacement jobs');
        await f.surfaceGraph.openSurface('panel'); await f.adapter.whenIdle(); release.resolve(); await Promise.resolve(); guard(); equal(hits, 0, 'reopening cannot restore old guards');
        equal(await f.stats.facade.work.schedule('held', context => context.isCurrent()).result, true, 'fresh work resumes through the queue');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.2: ${framework} minimize retains the root and stages latest controlled props for restore`, async () => {
      const f = fixture(framework); try {
        await f.mount(); const output = f.container.firstChild; f.surfaceGraph.minimizeSurface('panel');
        const update = await f.adapter.update({ type: 'props.update', props: { title: 'latest' } }); check(update.ok, 'inactive delivery is accepted as staged controlled props');
        equal(f.container.textContent, 'initial', 'inactive delivery performs no framework render'); equal(f.adapter.snapshot().props.title, 'latest', 'latest controlled replacement is retained');
        f.surfaceGraph.restoreSurface('panel'); await f.adapter.whenIdle();
        check(output === f.container.firstChild, 'retained framework identity survives restore'); equal(f.container.textContent, 'latest', 'restore applies staged props before resources start'); equal(f.stats.starts, 2, 'resources restart once');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} Surface reopening respects an independent explicit suspension`, async () => {
      const f = fixture(framework); try {
        await f.mount(); await f.adapter.suspend(); f.surfaceGraph.closeSurface('panel'); await f.surfaceGraph.openSurface('panel'); await Promise.resolve();
        equal(f.stats.starts, 1, 'Surface opening does not override a host suspension'); check(f.adapter.snapshot().suspended, 'explicit suspension remains');
        await f.adapter.resume(); equal(f.stats.starts, 2, 'explicit resume releases the second reason');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} explicit resume cannot start resources behind a closed Surface`, async () => {
      const f = fixture(framework); try {
        await f.mount(); await f.adapter.suspend(); f.surfaceGraph.closeSurface('panel');
        check((await f.adapter.resume('host', { props: { title: 'resumed' } })).ok, 'explicit resume can stage controlled props'); equal(f.stats.starts, 1, 'Surface still blocks resources');
        await f.surfaceGraph.openSurface('panel'); await f.adapter.whenIdle(); equal(f.container.textContent, 'resumed', 'opening delivers the staged resume');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} destroying and recreating a Surface never revives its old host`, async () => {
      const f = fixture(framework); try {
        await f.mount(); const generation = f.adapter.snapshot().resourceGraph.surfaceGeneration;
        f.surfaceGraph.destroySurface('panel'); check(f.adapter.snapshot().disposed, 'destroy synchronously revokes host authority'); await f.adapter.unmount();
        equal(f.stats.destroyed, 1, 'framework root is destroyed exactly once'); equal(f.kernel.listResources().length, 0, 'owned kernel edge is removed');
        await f.surfaceGraph.openSurface('panel', { recreate: true }); check(f.surfaceController.readSnapshot().surfaces[0].generation > generation, 'Surface has a fresh generation');
        equal(f.stats.starts, 1, 'old host never restarts'); equal(f.container.childNodes.length, 0, 'no orphan root');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} kernel root disposal tears down the host without disposing shared ports`, async () => {
      const f = fixture(framework); try {
        await f.mount(); f.kernel.disposeRoot('graph-root'); check(f.adapter.snapshot().disposed, 'native resource destructor revokes synchronously'); await f.adapter.unmount();
        equal(f.container.childNodes.length, 0, 'actual framework DOM is cleaned'); equal(f.stats.stops, 1, 'cooperative cleanup runs once');
        equal(await f.scheduler.schedule({ rootId: 'other', scope: 'other' }, () => 42).result, 42, 'shared scheduler remains usable'); equal(f.surfaceGraph.getSurface('panel').state, 'open', 'shared Surface is retained');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} replacing a kernel root ends its previous resource lifetime`, async () => {
      const f = fixture(framework), replacement = document.createElement('main'); try {
        await f.mount(); f.kernel.mountRoot('graph-root', replacement); check(f.adapter.snapshot().disposed, 'kernel replacement invokes the owned destructor'); await f.adapter.unmount();
        equal(f.stats.destroyed, 1, 'old framework root is destroyed'); equal(f.kernel.listResources().length, 0, 'no stale lease survives replacement');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} duplicate resource scopes cannot steal another host lease`, async () => {
      const f = fixture(framework), sibling = document.createElement('section'); f.root.append(sibling); let other;
      try {
        await f.mount(); other = f.factory({ ...f.config, container: sibling }); check(!(await other.mount(sibling, {})).ok, 'duplicate scope is denied');
        await other.unmount(); equal(f.kernel.listResources().length, 1, 'failed claimant never releases the original lease'); check(!f.adapter.snapshot().disposed, 'original owner stays live');
        await f.adapter.unmount(); equal(f.kernel.listResources().length, 0, 'original owner still releases its own lease');
      } finally { await other?.unmount(); await f.close(); }
    });
    await test(`A03.2: ${framework} Surface exit fences an unresolved provider before root creation`, async () => {
      const loaded = deferred(), entered = deferred(); let signal;
      const f = fixture(framework, { options: { loadRuntime(context) { signal = context.signal; entered.resolve(); return loaded.promise; } } });
      try {
        const mounting = f.mount(); await entered.promise; f.surfaceGraph.closeSurface('panel'); check(signal.aborted, 'provider authority is revoked before the Surface call returns');
        await f.adapter.unmount(); loaded.resolve(f.config.peers); await mounting; equal(f.stats.starts, 0, 'late provider creates no resource scope'); equal(f.container.childNodes.length, 0, 'late provider cannot create DOM'); equal(f.kernel.listResources().length, 0, 'partial mount releases its lease');
      } finally { loaded.resolve(f.config.peers); await f.close(); }
    });
    await test(`A03.2: ${framework} initially closed Surfaces retain an inactive root until opening`, async () => {
      const f = fixture(framework, { closed: true }); try {
        check((await f.mount()).ok, 'initial inactive mount does not deadlock boot'); check(f.adapter.snapshot().suspended, 'mounted host is inactive'); equal(f.stats.starts, 0, 'cooperative resources do not start');
        const refused = f.stats.facade.work.schedule('held', () => 1); equal(refused.jobId, null, 'inactive work never creates a job'); await rejected(refused.result);
        await f.surfaceGraph.openSurface('panel'); await f.adapter.whenIdle(); equal(f.stats.starts, 1, 'first activation starts resources once');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} Surface Controller disposal releases the host and its subscription`, async () => {
      const f = fixture(framework); try {
        await f.mount(); f.surfaceController.dispose(); check(f.adapter.snapshot().disposed, 'missing owner is terminal'); await f.adapter.unmount();
        equal(f.kernel.listResources().length, 0, 'native lease is removed'); equal(f.adapter.snapshot().resourceGraph.state, 'disposed', 'binding is terminal'); equal(f.stats.destroyed, 1, 'cleanup is complete and idempotent');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} superseded and reentrant Surface resumes cannot activate stale resources`, async () => {
      const f = fixture(framework, { onStart(graph, stats) { if (stats.starts === 2) graph.closeSurface('panel'); } }); try {
        await f.mount(); f.surfaceGraph.closeSurface('panel'); const first = f.surfaceGraph.openSurface('panel');
        f.surfaceGraph.closeSurface('panel'); await f.surfaceGraph.openSurface('panel'); await first;
        await until(() => f.stats.starts === 2); check(f.adapter.snapshot().suspended, 'reentrant close retains the Surface gate'); equal(f.stats.stops, 2, 'reentrant activation releases its partial resources');
        await f.surfaceGraph.openSurface('panel'); await f.adapter.whenIdle(); equal(f.stats.starts, 3, 'only the current reopen establishes resources');
      } finally { await f.close(); }
    });
    await test(`A03.2: ${framework} reentrant Surface opening cannot deliver an older close to another host`, async () => {
      const f = fixture(framework, { onStop(graph, stats) { if (stats.stops === 1) graph.openSurface('panel'); } });
      const container = document.createElement('section'); f.root.append(container); let other, stops = 0;
      const register = facade => facade.resources.register('subscription', () => () => stops++);
      const component = framework === 'react' ? function Other(props) {
        React.useLayoutEffect(() => register(props.xtension), []); return React.createElement('output', null, 'other');
      } : { props: ['xtension'], setup(props) { let stop; Vue.onMounted(() => { stop = register(props.xtension); }); Vue.onUnmounted(() => stop?.()); return () => Vue.h('output', 'other'); } };
      try {
        await f.mount(); other = f.factory({ ...f.config, container, component, kernelWork: { ...f.config.kernelWork, scope: 'other-instance' } });
        await other.mount(container, {}); f.surfaceGraph.closeSurface('panel'); await f.adapter.whenIdle(); await other.whenIdle();
        equal(f.surfaceGraph.getSurface('panel').state, 'open', 'cleanup synchronously committed a newer open');
        check(!other.snapshot().suspended, 'an older close notification cannot supersede current authority'); equal(stops, 0, 'the other active owner is not stopped by a stale notification');
      } finally { await other?.unmount(); await f.close(); }
    });
  }
}
module.exports = { runResourceGraphAcceptance };
