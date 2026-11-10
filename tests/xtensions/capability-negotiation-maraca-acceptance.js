'use strict';
const { createReactKernelRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const { createRepeatedFilterPanel, createRepeatedDataSourceAdapter } = require('../../development/rmtx-a02/repeated-filters');

async function runCapabilityNegotiationMaracaAcceptance({ React, ReactDOM, document, test, check, equal, fixture, plan, modules, xtendState, within }) {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  function make(extra = {}) {
    let loads = 0;
    const fabric = createXtendFabric(), surfaceController = modules.surfaceController.createSurfaceController({ fabric }), hosts = [];
    let graph, kernel, f;
    f = fixture({ plan, surfaceController, fabric, dataSourceAdapters: { rest: createRepeatedDataSourceAdapter() },
      moduleApis: { ...modules, surfaces: { ...modules.surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = modules.surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } } },
      createXTensionHost(context) {
        const entry = { context }, Panel = createRepeatedFilterPanel(React);
        function Component(props) { entry.facade = props.xtension; return React.createElement(Panel, props); }
        const host = createReactKernelRuntimeAdapter({ ...context, component: Component, peers: { React, ReactDOM }, fabric, loadRuntime() { loads++; return { React, ReactDOM }; },
          policy: { events: context.events }, kernelWork: { scheduler: f.scheduler, rootId: 'compiled-negotiation', scope: context.xtensionId, work: { scan: { lane: 'background', maxChunkMs: 4 } } },
          resourceGraph: { kernel, surfaceGraph: graph, surfaceController, surfaceId: 'filter' },
          capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', framework: 'react',
            required: { features: extra.blocked ? ['execution.preemption'] : ['kernel.lifecycle', 'surface.lifecycle', 'work.bounded'], work: ['scan'], events: ['change'] },
            ...(extra.optional ? { optional: { features: ['render.ssr'] } } : {}) },
          workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1, pressure: { critical: { admission: 'reject', maxChunkMs: 1 } } } } } });
        entry.host = host; hosts.push(entry); return host;
      }
    });
    kernel = createRmtCore({ scheduler: f.scheduler, documentTarget: document, windowTarget: document.defaultView }).rmt; kernel.mountRoot('compiled-negotiation', f.root);
    return { ...f, hosts, kernel, loads: () => loads, get graph() { return graph; }, async close() { await f.close(); kernel.disposeRoot('compiled-negotiation'); surfaceController.dispose(); } };
  }
  await test('A03.4: compiled keyed Maraca hosts negotiate actual grants and preserve typed intent Model delivery', async () => {
    const f = make(); try {
      await f.runtime.boot(); check(f.hosts.every(entry => entry.host.getCapabilityNegotiation().status === 'matched'), 'each concrete host negotiates its own captured grants');
      const input = f.root.querySelector('input'); input.value = 'negotiated-intent'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
      await within(f.runtime.whenXTensionsIdle()); equal(f.runtime.model.getState('groups').items[0].filters[0].query, 'negotiated-intent', 'typed intent reaches the declared Action and Model writer');
      equal(xtendState.get('groups'), f.runtime.model.getState('groups'), 'XTend State remains the committed Model projection');
      f.graph.closeSurface('filter'); const groups = JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))); groups.items[0].filters[0].query = 'negotiated-staged';
      await f.runtime.dispatchCommand('groups.replace', { groups }); await f.graph.openSurface('filter'); await within(f.runtime.whenXTensionsIdle());
      equal(f.root.querySelector('input').value, 'negotiated-staged', 'v6 registry/Maraca idle includes Surface resume');
    } finally { await f.close(); }
  });
  await test('A03.4: compiled required capability rejection never loads providers or registers native host resources', async () => {
    const f = make({ blocked: true }); try {
      let failed = false; try { await f.runtime.boot(); await f.runtime.whenXTensionsIdle(); } catch (_) { failed = true; }
      check(failed || f.hosts.some(entry => entry.host.snapshot().disposed), 'binding delivery rejects a blocked host');
      check(f.hosts.length > 0 && f.hosts.every(entry => entry.host.getCapabilityNegotiation().status === 'blocked'), 'actual capability rejection is inspectable per concrete host');
      equal(f.loads(), 0, 'required missing preemption blocks all framework providers'); equal(f.kernel.listResources().length, 0, 'no XTension leases survive blocked boot');
      equal(f.root.querySelectorAll('input').length, 0, 'no framework root was mounted');
    } finally { await f.close().catch(() => {}); }
  });
  await test('A03.4: compiled optional gaps preserve keyed ownership and fresh negotiation on reincarnation', async () => {
    const f = make({ optional: true }), release = deferred(); try {
      await f.runtime.boot(); check(f.hosts.every(entry => entry.host.getCapabilityNegotiation().status === 'degraded'), 'optional unsupported SSR is visible on each host');
      const original = f.hosts[0], entered = deferred(); const job = original.facade.work.schedule('scan', async context => { entered.resolve(); await release.promise; return context.isCurrent(); }); await entered.promise;
      const groups = JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))), removed = groups.items[0].filters.shift(); await f.runtime.dispatchCommand('groups.replace', { groups });
      check(job.signal.aborted, 'key removal still revokes the owning work generation'); await job.result.catch(() => {});
      groups.items[0].filters.unshift(removed); await f.runtime.dispatchCommand('groups.replace', { groups }); const replacement = f.hosts.at(-1);
      check(replacement.context.xtensionId !== original.context.xtensionId, 'same key gets a fresh host incarnation');
      equal(replacement.host.getCapabilityNegotiation().missingOptional.features, ['render.ssr'], 'replacement independently negotiates the optional gap');
      equal(await replacement.facade.work.schedule('scan', () => 42).result, 42, 'fresh captured grants execute through the real kernel');
      await original.host.unmount(); equal(f.kernel.listResources().length, 3, 'old host cleanup cannot remove replacement or sibling ownership');
    } finally { release.resolve(); await f.close(); }
  });
}
module.exports = { runCapabilityNegotiationMaracaAcceptance };
