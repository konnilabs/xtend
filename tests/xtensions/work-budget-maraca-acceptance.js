'use strict';
const { createReactKernelRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const { createRepeatedFilterPanel } = require('../../development/rmtx-a02/repeated-filters');

async function runWorkBudgetMaracaAcceptance({ React, ReactDOM, document, test, check, equal, fixture, plan, modules, xtendState, within }) {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  function make() {
    const fabric = createXtendFabric(), surfaceController = modules.surfaceController.createSurfaceController({ fabric }), hosts = [];
    let graph, kernel, f;
    f = fixture({ plan, surfaceController, fabric,
      moduleApis: { ...modules, surfaces: { ...modules.surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = modules.surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } } },
      createXTensionHost(context) {
        const entry = { context }, Panel = createRepeatedFilterPanel(React);
        function Component(props) { entry.facade = props.xtension; return React.createElement(Panel, props); }
        const host = createReactKernelRuntimeAdapter({ ...context, component: Component, peers: { React, ReactDOM }, fabric,
          policy: { events: context.events }, kernelWork: { scheduler: f.scheduler, rootId: 'compiled-budget', scope: context.xtensionId, work: { scan: { lane: 'background', maxChunkMs: 4 } } },
          resourceGraph: { kernel, surfaceGraph: graph, surfaceController, surfaceId: 'filter' },
          workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1, pressure: { critical: { admission: 'reject', maxChunkMs: 1 } } } } } });
        entry.host = host; hosts.push(entry); return host;
      }
    });
    kernel = createRmtCore({ scheduler: f.scheduler, documentTarget: document, windowTarget: document.defaultView }).rmt; kernel.mountRoot('compiled-budget', f.root);
    return { ...f, hosts, kernel, get graph() { return graph; }, async close() { await f.close(); kernel.disposeRoot('compiled-budget'); surfaceController.dispose(); } };
  }
  await test('A03.3: compiled keyed Maraca hosts retain Model delivery and Surface barriers under native pressure', async () => {
    const f = make(); try {
      await f.runtime.boot(); f.scheduler.updatePressure('critical'); let calls = 0;
      for (const entry of f.hosts) {
        const work = entry.facade.work.schedule('scan', () => calls++); equal(work.jobId, null, 'all hosts read the shared native pressure');
        await work.result.then(() => { throw new Error('expected refusal'); }, error => equal(error.reason, 'kernel-pressure', 'typed refusal'));
      }
      f.graph.closeSurface('filter'); const groups = JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))); groups.items[0].filters[0].query = 'budget-model';
      await within(f.runtime.dispatchCommand('groups.replace', { groups })); equal(xtendState.get('groups'), groups, 'Model remains the sole State writer under pressure');
      await f.graph.openSurface('filter'); await within(f.runtime.whenXTensionsIdle()); equal(f.root.querySelector('input').value, 'budget-model', 'v5 idle barrier includes Surface resume and latest props');
      equal(calls, 0, 'recovery never replays rejected business callbacks'); f.scheduler.updatePressure('normal');
      equal(await f.hosts[0].facade.work.schedule('scan', () => 42).result, 42, 'fresh explicit business work recovers');
    } finally { await f.close(); }
  });
  await test('A03.3: compiled keyed removal cancels only its bounded work and replacement starts a fresh budget', async () => {
    const f = make(), release = deferred(); try {
      await f.runtime.boot(); const entered = [deferred(), deferred()], jobs = f.hosts.slice(0, 2).map((entry, i) => entry.facade.work.schedule('scan', async () => { entered[i].resolve(); await release.promise; }));
      await Promise.all(entered.map(entry => entry.promise)); check(f.hosts.slice(0, 2).every(entry => entry.host.snapshot().workBudget.pending === 1), 'per-host capacity is independent on the shared kernel');
      const original = f.hosts[0], groups = JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))), removed = groups.items[0].filters.shift();
      await f.runtime.dispatchCommand('groups.replace', { groups }); check(jobs[0].signal.aborted && !jobs[1].signal.aborted, 'key removal cancels only its host work');
      await jobs[0].result.catch(() => {}); groups.items[0].filters.unshift(removed); await f.runtime.dispatchCommand('groups.replace', { groups });
      const replacement = f.hosts.at(-1); check(replacement.context.xtensionId !== original.context.xtensionId, 'new incarnation owns a fresh scope');
      equal(replacement.host.snapshot().workBudget.pending, 0, 'replacement inherits no pending reservations'); equal(await replacement.facade.work.schedule('scan', () => 42).result, 42, 'fresh incarnation admits native work');
      await original.host.unmount(); check(!jobs[1].signal.aborted && !replacement.host.snapshot().disposed, 'old cleanup cannot cancel survivors or new work');
    } finally { release.resolve(); await f.close(); }
  });
}
module.exports = { runWorkBudgetMaracaAcceptance };
