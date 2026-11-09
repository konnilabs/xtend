'use strict';
const { createReactKernelRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const { createRepeatedFilterPanel } = require('../../development/rmtx-a02/repeated-filters');

async function runResourceGraphMaracaAcceptance({ React, ReactDOM, document, test, check, equal, fixture, plan, modules, xtendState, within }) {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  function make() {
    const fabric = createXtendFabric(), surfaceController = modules.surfaceController.createSurfaceController({ fabric }), hosts = [];
    let graph, kernel, f;
    f = fixture({ plan, surfaceController, fabric,
      moduleApis: { ...modules, surfaces: { ...modules.surfaces, createRmtSurfaceResourceGraphRuntime(options) {
        graph = modules.surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph;
      } } },
      createXTensionHost(context) {
        const host = createReactKernelRuntimeAdapter({ ...context, component: createRepeatedFilterPanel(React), peers: { React, ReactDOM }, fabric,
          policy: { events: context.events }, kernelWork: { scheduler: f.scheduler, rootId: 'compiled-graph', scope: context.xtensionId, work: { scan: { lane: 'background' } } },
          resourceGraph: { kernel, surfaceGraph: graph, surfaceController, surfaceId: 'filter' } });
        hosts.push({ context, host }); return host;
      }
    });
    kernel = createRmtCore({ scheduler: f.scheduler, documentTarget: document, windowTarget: document.defaultView }).rmt;
    kernel.mountRoot('compiled-graph', f.root);
    return { ...f, hosts, kernel, surfaceController, get graph() { return graph; }, async close() { await f.close(); kernel.disposeRoot('compiled-graph'); surfaceController.dispose(); } };
  }
  await test('A03.2: compiled keyed Maraca hosts share the real Surface owner and retain latest Model props while closed', async () => {
    const f = make(); try {
      await f.runtime.boot(); equal(f.kernel.listResources('compiled-graph').length, 3, 'all keyed hosts have distinct owned kernel resources');
      f.graph.closeSurface('filter'); check(f.hosts.every(item => item.host.snapshot().suspended), 'one owning Surface gates all three concrete hosts');
      const groups = JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))); groups.items[0].filters[0].query = 'while-closed';
      await within(f.runtime.dispatchCommand('groups.replace', { groups })); equal(xtendState.get('groups'), groups, 'Model remains the sole State writer');
      equal(f.root.querySelector('input').value, 'numeric', 'closed Surface does not render staged props');
      await f.graph.openSurface('filter'); await within(f.runtime.whenXTensionsIdle());
      equal(f.root.querySelector('input').value, 'while-closed', 'Surface resume delivers the latest controlled state');
    } finally { await f.close(); }
  });
  await test('A03.2: keyed Maraca removal releases exactly one graph edge before a new incarnation binds', async () => {
    const f = make(); try {
      await f.runtime.boot(); const original = f.hosts[0], groups = JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))), removed = groups.items[0].filters.shift();
      await f.runtime.dispatchCommand('groups.replace', { groups }); check(original.host.snapshot().disposed, 'removed host is terminal');
      equal(f.kernel.listResources('compiled-graph').length, 2, 'other host leases survive');
      groups.items[0].filters.unshift(removed); await f.runtime.dispatchCommand('groups.replace', { groups });
      const replacement = f.hosts.at(-1); check(replacement.context.xtensionId !== original.context.xtensionId, 'replacement has its own incarnation');
      equal(f.kernel.listResources('compiled-graph').length, 3, 'exactly one new resource is registered');
      await original.host.unmount(); equal(f.kernel.listResources('compiled-graph').length, 3, 'old cleanup cannot remove the replacement lease');
    } finally { await f.close(); }
  });
}
module.exports = { runResourceGraphMaracaAcceptance };
