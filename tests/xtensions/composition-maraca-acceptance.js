'use strict';
const bindingRuntime = require('@ccslabs/xtend/xtensions/state-binding');
const reactAdapter = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const vueAdapter = require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const { createRepeatedDataSourceAdapter } = require('../../development/rmtx-a02/repeated-filters');

async function runCompositionMaracaAcceptance({ React, ReactDOM, Vue, document, test, check, equal, plan, compositions }) {
  const compositionRuntime = await import('../../xtend-maraca/xtension-composition-runtime.mjs');
  const { createMaracaPlanRuntime } = await import('../../xtend-maraca/plan-runtime.mjs');
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const modules = {
    state: await import('../../xtendrmt/rmt-state-selector-runtime.js'), stateProjection: await import('../../xtendrmt/rmt-state-host-adapter.js'),
    action: await import('../../xtendrmt/rmt-action-effect-runtime.js'), app: await import('../../xtendrmt/rmt-app-runtime.js'),
    renderer: await import('../../xtendrmt/rmt-dom-descriptor-renderer.js'), viewProjection: await import('../../xtendrmt/rmt-maraca-view-projection-adapter.js'),
    presentation: await import('../../xtendrmt/rmt-presentation-effect-adapter.js'), events: await import('../../xtendrmt/rmt-event-routing-runtime.js'),
    surfaces: await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js'), surfaceController: await import('../../components/xsurfacemanager-controller.js')
  };
  const { xtendState } = await import('../../components/xtend-state.js');
  const copy = value => JSON.parse(JSON.stringify(value));
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  function fixture(framework, extra = {}) {
    const previous = xtendState.snapshot().data, root = document.createElement('main'); document.body.append(root);
    let holding = !!extra.hold; const callbacks = [];
    const scheduler = createRmtKernelScheduler({ preferPostTask: false, hostPort: { queueMicrotask(callback) { if (holding) callbacks.push(callback); else queueMicrotask(callback); } } }), kernel = createRmtCore({ scheduler }).rmt;
    const fabric = createXtendFabric(), surfaceController = modules.surfaceController.createSurfaceController({ fabric });
    kernel.mountRoot('composed-plan', root);
    let graph, factory, loads = 0, factories = 0;
    const hosts = [], peers = framework === 'react' ? { React, ReactDOM } : { Vue };
    const grants = { 'filter-panel': { work: { scan: { lane: 'background', maxChunkMs: 4 } },
      workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1 } } } } };
    if (extra.missingGrant) grants['filter-panel'].work = {};
    if (extra.missingGrant) grants['filter-panel'].workBudget.work = {};
    if (extra.invalidGrants !== undefined) grants['filter-panel'] = extra.invalidGrants;
    const actual = framework === 'react' ? reactAdapter : vueAdapter, method = framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter';
    const adapters = { [framework]: { ...actual, [method](options) {
      const entry = { options }, proxy = options.component;
      const component = framework === 'react' ? props => { entry.facade = props.xtension; return React.createElement(proxy, props); }
        : { inheritAttrs: false, setup(_props, { attrs }) { return () => { entry.facade = attrs.xtension; return Vue.h(proxy, { ...attrs }); }; } };
      entry.host = actual[method]({ ...options, component }); hosts.push(entry); return entry.host;
    } } };
    const runtime = createMaracaPlanRuntime({ plan, root, scheduler, surfaceController, fabric, stateProjectionTarget: xtendState,
      moduleApis: { ...modules, surfaces: { ...modules.surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = modules.surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } } },
      hydrateOnBoot: false, ensureComponentsOnBoot: false, xtensionBindingsRuntime: bindingRuntime, dataSourceAdapters: { rest: createRepeatedDataSourceAdapter() },
      viewProjectionPort: modules.viewProjection.createRmtMaracaViewProjectionAdapter({ root, documentTarget: document }),
      createXTensionHost(context) {
        if (!factory) {
          const ports = { compositionRuntime, plan, bindingsRuntime: bindingRuntime, adapters, fabric,
            kernelWork: { scheduler, rootId: 'composed-plan' }, resourceGraph: { kernel, surfaceGraph: graph, surfaceController }, grants,
            async loadPeers(request) { loads++; extra.entered?.resolve(); if (extra.wait) await extra.wait; return extra.badPeers ? framework === 'react' ? { React: { ...React, version: '19.0.0' }, ReactDOM } : { Vue: { ...Vue, version: '3.0.0' } } : peers; } };
          if (extra.countFactory) {
            const artifact = compositions[framework].artifact, definition = artifact.manifest.providers[0];
            factory = compositionRuntime.createMaracaXTensionHostFactory({ ...ports, artifact,
              providers: { [definition.id]: { createPanel() { factories++; return framework === 'react' ? () => null : { render() { return null; } }; } } } });
          } else factory = compositions[framework].createHostFactory(ports);
          extra.afterFactory?.(grants);
        }
        return factory(context);
      }
    });
    return { root, runtime, kernel, hosts, scheduler, fabric, release() { holding = false; callbacks.splice(0).forEach(callback => queueMicrotask(callback)); }, get graph() { return graph; }, loads: () => loads, factories: () => factories,
      async close() { runtime.dispose(); await runtime.whenXTensionsIdle(); kernel.disposeRoot('composed-plan'); surfaceController.dispose(); scheduler.dispose(); root.remove(); xtendState.clear(); xtendState.batchUpdate(previous); } };
  }
  for (const framework of ['react', 'vue']) {
    await test(`A04.1: ${framework} captured provider graph creates keyed hosts with typed Model intents`, async () => {
      const f = fixture(framework); try {
        await f.runtime.boot(); equal(f.hosts.length, 3, 'one automatic host per concrete keyed binding'); equal(f.root.querySelectorAll('input').length, 3, 'actual framework roots render the captured components');
        check(f.hosts.every(entry => entry.host.apiVersion === '6.0.0' && entry.host.getCapabilityNegotiation().status === 'degraded'), 'optional SSR gap stays explicit on actual v6 adapters');
        equal(f.kernel.listResources('composed-plan').length, 3, 'each incarnation owns a real kernel lease');
        const input = f.root.querySelector('input'); input.value = 'composed-intent'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
        await f.runtime.whenXTensionsIdle(); equal(f.runtime.model.getState('groups').items[0].filters[0].query, 'composed-intent', 'declared Action remains the Model writer'); equal(xtendState.get('groups'), f.runtime.model.getState('groups'), 'State projection follows the Model');
        equal(await f.hosts[0].facade.work.schedule('scan', () => 42).result, 42, 'application grants run actual cooperative kernel work');
      } finally { await f.close(); }
    });
    await test(`A04.1: ${framework} provider peers wait for real Kernel admission and Fabric`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { entered, wait: release.promise, hold: true });
      try {
        const pending = f.runtime.boot(); await new Promise(resolve => setTimeout(resolve, 20));
        equal(f.loads(), 0, 'provider cannot execute before native kernel admission'); f.release(); await entered.promise;
        const host = f.hosts[0].host; check(host.snapshot().kernelWork.pending.some(entry => entry.name === 'mount'), 'provider runs in a retained mount job');
        release.resolve(); await pending; check(f.hosts.every(entry => entry.host.getLifecycleRecords().some(record => record.operation === 'mount')), 'real host lifecycle delivery completes');
        check(f.fabric.getFibers().some(record => record.phase === 'mount' && record.status === 'completed' && record.metadata?.kernelJobId), 'Fabric records the same native mount job');
      } finally { f.release(); release.resolve(); await f.close(); }
    });
    await test(`A04.1: ${framework} manifest requirements never manufacture application grants`, async () => {
      const f = fixture(framework, { missingGrant: true }); try {
        await f.runtime.boot().catch(() => {}); equal(f.loads(), 0, 'missing required work blocks the provider');
        check(f.hosts.length > 0 && f.hosts.every(entry => entry.host.getCapabilityNegotiation().missingRequired.work.includes('scan')), 'required work remains missing');
        equal(f.kernel.listResources('composed-plan').length, 0, 'blocked host acquires no resource lease'); equal(f.root.querySelectorAll('input').length, 0, 'no framework root is mounted');
      } finally { await f.close(); }
      for (const invalidGrants of [{ work: null }, { lifecycle: null }, { workBudget: null }, { allowedResources: null }, { authorize: null }, { validateProps: false }, [], { work: { scan: () => {} } }]) {
        const invalid = fixture(framework, { invalidGrants });
        try {
          let rejected = false; try { await invalid.runtime.boot(); } catch (_) { rejected = true; }
          check(rejected, 'malformed application grants must reject instead of selecting defaults'); equal(invalid.loads(), 0, 'invalid policy cannot load a provider'); equal(invalid.kernel.listResources('composed-plan').length, 0, 'invalid policy acquires no native lease');
        } finally { await invalid.close(); }
      }
    });
    await test(`A04.1: ${framework} exact peer mismatch fails before component factory or render`, async () => {
      const f = fixture(framework, { badPeers: true, countFactory: true }); try {
        await f.runtime.boot().catch(() => {}); equal(f.factories(), 0, 'unverified peers cannot reach the provider factory'); equal(f.kernel.listResources('composed-plan').length, 0, 'failed boot releases owned resources');
        check(f.hosts.some(entry => entry.host.snapshot().diagnostics.length), 'peer failure is visible in actual host diagnostics');
      } finally { await f.close(); }
    });
    await test(`A04.1: ${framework} terminal cleanup fences late peer completion and provider invocation`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { entered, wait: release.promise, countFactory: true });
      try {
        const boot = f.runtime.boot().catch(() => {}); await entered.promise; f.runtime.dispose(); await f.runtime.whenXTensionsIdle();
        equal(f.kernel.listResources('composed-plan').length, 0, 'terminal cleanup does not wait for the peer loader');
        release.resolve(); await boot; await new Promise(resolve => setTimeout(resolve, 0)); equal(f.factories(), 0, 'late peer completion cannot invoke a retired provider');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A04.1: ${framework} shared Surface ownership stages props and resumes through the same graph`, async () => {
      const f = fixture(framework); try {
        await f.runtime.boot(); f.graph.closeSurface('filter'); const groups = copy(f.runtime.model.getState('groups')); groups.items[0].filters[0].query = 'inactive-composed';
        await f.runtime.dispatchCommand('groups.replace', { groups }); check(f.root.querySelector('input').value !== 'inactive-composed', 'closed owner retains the old framework projection');
        await f.graph.openSurface('filter'); await f.runtime.whenXTensionsIdle(); equal(f.root.querySelector('input').value, 'inactive-composed', 'owning Surface resumes latest committed props');
        check(f.hosts.every(entry => entry.host.snapshot().resourceGraph.surfaceId === 'filter'), 'repeated containers share the exact declared Surface owner');
      } finally { await f.close(); }
    });
    await test(`A04.1: ${framework} keyed reincarnation preserves sibling leases and captured host policy`, async () => {
      const f = fixture(framework, { afterFactory(grants) { grants['filter-panel'].work.scan.lane = 'invented'; grants['filter-panel'].allowedResources = ['injected']; } });
      try {
        await f.runtime.boot(); const first = f.hosts[0], groups = copy(f.runtime.model.getState('groups')), removed = groups.items[0].filters.shift();
        await f.runtime.dispatchCommand('groups.replace', { groups }); equal(f.kernel.listResources('composed-plan').length, 2, 'only the removed key loses its native resource');
        groups.items[0].filters.unshift(removed); await f.runtime.dispatchCommand('groups.replace', { groups }); const next = f.hosts.at(-1);
        check(next.options.xtensionId !== first.options.xtensionId, 'reappearing key receives a fresh registry incarnation'); equal(next.options.kernelWork.scope, next.options.xtensionId, 'scope derives only from registry identity');
        equal(next.host.getCapabilities().grants.resources, [], 'later application object mutation cannot widen captured grants');
        equal(await next.facade.work.schedule('scan', () => 17).result, 17, 'original captured work policy remains valid');
        await first.host.unmount(); equal(f.kernel.listResources('composed-plan').length, 3, 'old cleanup cannot revoke replacement or siblings');
      } finally { await f.close(); }
    });
  }
}
module.exports = { runCompositionMaracaAcceptance };
