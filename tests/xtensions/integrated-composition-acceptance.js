'use strict';
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const { createRepeatedDataSourceAdapter } = require('../../development/rmtx-a02/repeated-filters');

async function runIntegratedCompositionAcceptance({ React, ReactDOM, Vue, document, test, check, equal, integratedApps, compositions }) {
  const controllerApi = await import('../../xtendrmt/rmt-kernel-orchestration-controller.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const { xtendState } = await import('../../components/xtend-state.js');
  const copy = value => JSON.parse(JSON.stringify(value));
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  function fixture(framework, extra = {}) {
    const root = document.createElement('main'); document.body.append(root);
    const previous = xtendState.snapshot().data, actualFabric = createXtendFabric(), admissions = [], fabric = { ...actualFabric, createBoundary(...args) {
      const boundary = actualFabric.createBoundary(...args);
      return { ...boundary, run(phase, task, metadata) { if (metadata?.kernelJobId) admissions.push(metadata); return boundary.run(phase, task, metadata); } };
    } }, controllers = [], hosts = [], lifecycle = [];
    const platform = integratedApps[framework].platform, adapters = {};
    for (const [kind, api] of Object.entries(platform.adapters)) {
      const method = kind === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter';
      adapters[kind] = { ...api, [method](options) {
        const entry = { options }, proxy = options.component;
        const component = kind === 'react' ? props => { entry.facade = props.xtension; return React.createElement(proxy, props); }
          : { inheritAttrs: false, setup(_props, { attrs }) { return () => { entry.facade = attrs.xtension; return Vue.h(proxy, { ...attrs }); }; } };
        entry.host = api[method]({ ...options, component }); hosts.push(entry); return entry.host;
      } };
    }
    const dependencies = { windowTarget: document.defaultView, documentTarget: document, platformTarget: {},
      xtensionPlatform: { ...platform, adapters },
      kernelControllerModule: { ...controllerApi, createRmtKernelOrchestrationController(options) {
        const controller = controllerApi.createRmtKernelOrchestrationController(options), record = { controller, disposed: false, native: null, scheduler: null };
        controllers.push(record);
        const observed = {};
        for (const key of Object.keys(controller)) Object.defineProperty(observed, key, { enumerable: true, get() {
          if (key === 'dispose') return () => { record.native = controller.core?.rmt || record.native; record.scheduler = controller.scheduler; record.disposed = true; lifecycle.push({ operation: 'kernel-dispose', resources: record.native?.listResources().length }); return controller.dispose(); };
          if (key === 'core') record.native = controller.core?.rmt || record.native;
          if (key === 'scheduler') record.scheduler = controller.scheduler;
          return controller[key];
        } });
        return Object.freeze(observed);
      } }, ...extra.dependencies };
    const app = integratedApps[framework].entry.createXtendMaraca(dependencies);
    const ids = framework === 'mixed' ? ['mixed-filter-0', 'mixed-filter-1'] : ['filter-panel'];
    const grants = Object.fromEntries(ids.map(id => [id, { work: extra.missingGrant ? {} : { scan: { lane: 'background', maxChunkMs: 4 } },
      workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: extra.missingGrant ? {} : { scan: { maxPending: 1 } } } }]));
    const stats = { loads: 0, badPeers: !!extra.badPeers };
    const options = { root, fabric, stateProjectionTarget: xtendState, dataSourceAdapters: { rest: createRepeatedDataSourceAdapter() }, xtensions: {
      grants, async loadPeers({ provider }) {
        stats.loads++; extra.entered?.resolve(); if (extra.wait) await extra.wait;
        return provider.framework === 'react' ? { React: stats.badPeers ? { ...React, version: '19.0.0' } : React, ReactDOM }
          : { Vue: stats.badPeers ? { ...Vue, version: '3.0.0' } : Vue };
      }
    } };
    return { app, root, hosts, controllers, options, stats, lifecycle, grants, fabric, admissions,
      async close() { app.dispose(); await app.facade.whenXTensionsIdle(); root.remove(); xtendState.clear(); xtendState.batchUpdate(previous); } };
  }
  for (const framework of ['react', 'vue']) {
    await test(`A04.3.1: ${framework} native multi-module graph waits for admitted peer loading before factory execution`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { entered, wait: release.promise }), calls = [];
      globalThis.__XTendA043Observe = () => calls.push(f.admissions.length);
      try {
        const artifact = integratedApps[framework].companion.artifact;
        equal(artifact.schema, 'xtend.maraca.xtension-composition-artifact.v3', 'native companion uses the new graph artifact');
        equal(artifact.modules.length, 3, 'entry, component and transitive helper remain separate native modules');
        check(Object.isFrozen(artifact.modules[0].imports), 'module provenance is immutable');
        equal(calls.length, 0, 'importing modules and constructing the app executes no factory');
        const boot = f.app.boot(f.options); await entered.promise;
        equal(calls.length, 0, 'admitted loader cannot run the component factory before exact peers arrive');
        release.resolve(); await boot;
        equal(calls.length, 3, 'factory executes once per keyed host'); check(calls.every(count => count > 0), 'factories execute after real Kernel/Fabric admission');
        equal(f.root.querySelectorAll('output').length, 3, 'shared transitive helper participates in actual framework rendering');
      } finally { release.resolve(); delete globalThis.__XTendA043Observe; await f.close(); }
    });
    await test(`A04.3.1: ${framework} revoked peer load cannot enter a transitive component factory`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { entered, wait: release.promise }); let calls = 0;
      globalThis.__XTendA043Observe = () => calls++;
      try {
        const boot = f.app.boot(f.options).catch(() => {}); await entered.promise; f.app.dispose(); await f.app.facade.whenXTensionsIdle();
        release.resolve(); await boot; await Promise.resolve();
        equal(calls, 0, 'late peers cannot execute the captured factory after revocation'); equal(f.root.querySelectorAll('input').length, 0, 'no framework root survives');
      } finally { release.resolve(); delete globalThis.__XTendA043Observe; await f.close(); }
    });
  }
  await test('A04.3.1: mixed native React/Vue graph shares a single transitive module and native owner', async () => {
    const artifact = integratedApps.mixed.companion.artifact, f = fixture('mixed');
    try {
      equal(artifact.modules.length, 5, 'two entries/components share one helper');
      equal(artifact.modules.filter(row => row.module.endsWith('/format.mjs')).length, 1, 'shared helper has one source identity');
      await f.app.boot(f.options); equal(f.root.querySelectorAll('input').length, 2, 'both frameworks render through the transitive graph');
      equal(f.controllers.length, 1, 'the graph shares one actual kernel controller');
    } finally { await f.close(); }
  });
  for (const framework of ['react', 'vue']) {
    await test(`A04.2: ${framework} regular generated ESM boot composes real internal ports and typed Model delivery`, async () => {
      const f = fixture(framework); try {
        equal([f.app.schema, f.app.apiVersion], ['xtend.maraca.browser-composition-root.v6', '6.0.0'], 'integrated browser contract is versioned');
        await f.app.boot(f.options); equal(f.app.facade.snapshot().schema, 'xtend.maraca.plan-runtime.v8', 'integrated plan runtime has its own major');
        equal(f.root.querySelectorAll('input').length, 3, 'real generated output mounts all keyed roots');
        const controller = f.controllers[0], native = controller.native;
        check(f.hosts.every(entry => entry.options.resourceGraph.kernel === native && entry.options.kernelWork.scheduler === controller.scheduler), 'hosts use the actual orchestration Core and its native scheduler');
        equal(native.listRoots().length, 1, 'one private root per composition lifetime'); equal(native.listResources().length, 3, 'one resource per concrete host');
        const input = f.root.querySelector('input'); input.value = 'integrated-intent'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true })); await f.app.facade.whenXTensionsIdle();
        equal(f.app.facade.model.getState('groups').items[0].filters[0].query, 'integrated-intent', 'typed intent reaches the Model writer'); equal(xtendState.get('groups'), f.app.facade.model.getState('groups'), 'State remains the Model projection');
        const job = f.hosts[0].facade.work.schedule('scan', () => 71); equal(await job.result, 71, 'named work uses the composed kernel grants');
        check(f.fabric.getFibers().some(fiber => fiber.metadata?.kernelJobId === job.jobId), 'actual work enters Fabric with its kernel job ID');
      } finally { await f.close(); }
      check(f.controllers.every(record => record.disposed && record.native.listRoots().length === 0 && record.scheduler.snapshot().disposed), 'owned root and scheduler are retired');
      check(f.lifecycle.every(record => record.resources === 0), 'kernel retirement follows host-resource cleanup');
    });
    await test(`A04.2: ${framework} actual internal Surface graph stages and resumes controlled props`, async () => {
      const f = fixture(framework); try {
        await f.app.boot(f.options); const graph = f.hosts[0].options.resourceGraph.surfaceGraph;
        check(f.hosts.every(entry => entry.options.resourceGraph.surfaceGraph === graph), 'all hosts use one internal graph');
        graph.closeSurface('filter'); const groups = copy(f.app.facade.model.getState('groups')); groups.items[0].filters[0].query = 'integrated-staged';
        await f.app.facade.dispatchCommand('groups.replace', { groups }); check(f.root.querySelector('input').value !== 'integrated-staged', 'closed Surface retains the prior framework projection');
        await graph.openSurface('filter'); await f.app.facade.whenXTensionsIdle(); equal(f.root.querySelector('input').value, 'integrated-staged', 'same internal graph resumes the latest committed props');
      } finally { await f.close(); }
    });
    await test(`A04.2: ${framework} required capability rejection cleans the owned boot without peer loading`, async () => {
      const f = fixture(framework, { missingGrant: true }); try {
        let failed = false; try { await f.app.boot(f.options); } catch (_) { failed = true; } check(failed, 'required missing grant fails boot'); await f.app.facade.whenXTensionsIdle();
        equal(f.stats.loads, 0, 'declarations cannot manufacture work authority'); equal(f.root.querySelectorAll('input').length, 0, 'no framework root was mounted');
        check(f.controllers.every(record => record.disposed && record.native.listResources().length === 0 && record.native.listRoots().length === 0), 'failed boot retires its root and kernel');
      } finally { await f.close(); }
    });
    await test(`A04.2: ${framework} pending peer loader is fenced by dispose and an immediate reboot`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { entered, wait: release.promise });
      try {
        const first = f.app.boot(f.options).catch(error => error); await entered.promise; const old = f.controllers[0]; f.app.dispose(); await f.app.facade.whenXTensionsIdle();
        check(old.disposed && old.native.listResources().length === 0 && old.native.listRoots().length === 0, 'terminal cleanup completes without waiting for the peer promise');
        const reboot = f.app.boot(f.options); release.resolve(); await first; await reboot;
        equal(f.root.querySelectorAll('input').length, 3, 'new boot owns exactly three fresh roots'); equal(f.controllers.length, 2, 'reboot gets a fresh owned kernel');
        check(f.hosts[0].host.snapshot().disposed, 'late completion cannot revive the old host');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A04.2: ${framework} peer failure permits a fresh boot after complete cleanup`, async () => {
      const f = fixture(framework, { badPeers: true }); try {
        let failed = false; try { await f.app.boot(f.options); } catch (_) { failed = true; } check(failed, 'incorrect actual peers reject'); await f.app.facade.whenXTensionsIdle();
        check(f.controllers[0].disposed && f.controllers[0].native.listRoots().length === 0, 'failed owner is fully retired before retry');
        f.stats.badPeers = false; await f.app.boot(f.options); equal(f.root.querySelectorAll('input').length, 3, 'retry creates clean hosts');
      } finally { await f.close(); }
    });
    await test(`A04.2: ${framework} boot captures grants and keyed reincarnation retains exclusive ownership`, async () => {
      const f = fixture(framework); try {
        const boot = f.app.boot(f.options); f.grants['filter-panel'].work.scan.lane = 'invented'; f.grants['filter-panel'].allowedResources = ['injected']; await boot;
        const first = f.hosts[0], groups = copy(f.app.facade.model.getState('groups')), removed = groups.items[0].filters.shift();
        await f.app.facade.dispatchCommand('groups.replace', { groups }); groups.items[0].filters.unshift(removed); await f.app.facade.dispatchCommand('groups.replace', { groups });
        const replacement = f.hosts.at(-1); check(replacement.options.xtensionId !== first.options.xtensionId, 'keyed replacement has a new incarnation');
        equal(replacement.host.getCapabilities().grants.resources, [], 'asynchronous boot cannot widen the captured grants'); equal(await replacement.facade.work.schedule('scan', () => 9).result, 9, 'captured work policy remains valid');
        await first.host.unmount(); equal(f.controllers[0].native.listResources().length, 3, 'old cleanup preserves sibling and replacement resources');
      } finally { await f.close(); }
    });
    await test(`A04.2: ${framework} borrowed controller and scheduler retain foreign roots and resources`, async () => {
      const f = fixture(framework), scheduler = createRmtKernelScheduler({ preferPostTask: false }); let external;
      try {
        const kernelApi = await import('../../xtendrmt/rmt-runtime.esm.js');
        external = controllerApi.createRmtKernelOrchestrationController({ kernelApi, kernelScheduler: scheduler, plan: integratedApps[framework].entry.MARACA_KERNEL, artifact: integratedApps[framework].entry.MARACA_KERNEL.artifact, strict: true, documentTarget: document, windowTarget: document.defaultView }); external.boot();
        const native = external.core.rmt, foreign = document.createElement('aside'); native.mountRoot('foreign-application', foreign); native.attachResource('foreign-application', 'foreign-resource', {});
        await f.app.boot({ ...f.options, kernelController: external }); equal(native.listRoots().length, 2, 'composition mounts its own root beside the foreign root');
        f.app.dispose(); await f.app.facade.whenXTensionsIdle(); equal(native.listRoots().map(entry => entry.id), ['foreign-application'], 'only the composition root is retired'); equal(native.listResources().length, 1, 'foreign resource survives');
        check(external.status === 'booted' && !scheduler.snapshot().disposed, 'borrowed owner and scheduler remain available');
        equal(await scheduler.schedule({ schema: 'xtend.rmt.kernel-work.v1', scope: 'foreign', endpointName: 'foreign', rootId: 'foreign-application' }, () => 42).result, 42, 'foreign application can still schedule work');
        native.disposeRoot('foreign-application');
      } finally { await f.close(); external?.dispose(); scheduler.dispose(); }
    });
    await test(`A04.2: ${framework} manual bypasses, adoption and stale companions reject before kernel boot`, async () => {
      for (const change of [{ createXTensionHost() {} }, { xtensionBindingsRuntime: {} }, { adoptExisting: true }, { fabric: null }, { xtensions: { loadPeers() {}, grants: {}, unknown: true } }]) {
        const f = fixture(framework); try { let failed = false; try { await f.app.boot({ ...f.options, ...change }); } catch (_) { failed = true; } check(failed, 'unsupported composition cannot fall back to a manual path'); equal(f.stats.loads, 0, 'no peer loader is reached'); equal(f.controllers.length, 0, 'no kernel owner is created'); } finally { await f.close(); }
      }
      const stale = fixture(framework, { dependencies: { xtensionCompanion: compositions[framework] } });
      try { let failed = false; try { await stale.app.boot(stale.options); } catch (_) { failed = true; } check(failed, 'legacy companion cannot replace a v2 build artifact'); equal(stale.controllers.length, 0, 'mismatch rejects before kernel boot'); } finally { await stale.close(); }
    });
  }
  await test('A04.2: one regular generated application orchestrates React and Vue through the same kernel and graph', async () => {
    const f = fixture('mixed'); try {
      await f.app.boot(f.options); equal(f.root.querySelectorAll('input').length, 2, 'both real frameworks mount');
      equal(f.hosts.map(entry => entry.host.framework).sort(), ['react', 'vue'], 'provider declarations select the reviewed actual adapters');
      check(f.hosts[0].options.resourceGraph.surfaceGraph === f.hosts[1].options.resourceGraph.surfaceGraph && f.hosts[0].options.resourceGraph.kernel === f.hosts[1].options.resourceGraph.kernel, 'frameworks share the actual graph and native Core');
      await f.app.facade.dispatchCommand('filter.left.replace', { filter: { query: 'mixed-react', selection: { activeId: null } } });
      await f.app.facade.dispatchCommand('filter.right.replace', { filter: { query: 'mixed-vue', selection: { activeId: null } } });
      equal([...f.root.querySelectorAll('input')].map(input => input.value), ['mixed-react', 'mixed-vue'], 'both frameworks receive their own committed Model slice');
    } finally { await f.close(); }
  });
}
module.exports = { runIntegratedCompositionAcceptance };
