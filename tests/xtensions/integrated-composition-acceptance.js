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
    const source = integratedApps[(extra.sourceKey || (extra.shared ? 'shared-' : extra.deferred ? 'deferred-' : '') + framework)], platform = source.platform, adapters = {};
    const stats = { loads: 0, providerLoads: 0, providerCalls: [], contexts: [], badPeers: !!extra.badPeers };
    for (const [kind, api] of Object.entries(platform.adapters)) {
      const method = kind === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter';
      adapters[kind] = { ...api, [method](options) {
        const entry = { options }, proxy = options.component;
        const component = kind === 'react' ? props => { entry.facade = props.xtension; return React.createElement(proxy, props); }
          : { inheritAttrs: false, setup(_props, { attrs }) { return () => { entry.facade = attrs.xtension; return Vue.h(proxy, { ...attrs }); }; } };
        entry.host = api[method]({ ...options, component }); hosts.push(entry); return entry.host;
      } };
    }
    const dependencies = { xtensionCompanion: extra.deferred || extra.shared ? { ...source.companion, createHostFactory(ports) {
      return source.companion.createHostFactory({ ...ports, compositionRuntime: { ...ports.compositionRuntime, createMaracaXTensionHostFactory(options) {
        const loadProviders = Object.fromEntries(Object.entries(options.loadProviders).map(([id, load]) => [id, async () => {
          stats.providerLoads++; stats.providerCalls.push({ id, admissions: admissions.length }); extra.providerEntered?.resolve();
          if (extra.providerWait) await extra.providerWait;
          if (extra.providerFailure?.()) throw new Error('provider transport failure');
          return extra.missingExport ? {} : load();
        }]));
        stats.providerOptions = { ...options, loadProviders };
        const factory = ports.compositionRuntime.createMaracaXTensionHostFactory(stats.providerOptions);
        return context => { stats.contexts.push(context); return factory(context); };
      } } });
    } } : source.companion, windowTarget: document.defaultView, documentTarget: document, platformTarget: {},
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
    const app = source.entry.createXtendMaraca(dependencies);
    const ids = framework === 'mixed' || extra.sourceKey?.includes('pair-') ? ['mixed-filter-0', 'mixed-filter-1'] : ['filter-panel'];
    const grants = Object.fromEntries(ids.map(id => [id, { work: extra.missingGrant ? {} : { scan: { lane: 'background', maxChunkMs: 4 } },
      workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: extra.missingGrant ? {} : { scan: { maxPending: 1 } } } }]));
    const options = { root, fabric, stateProjectionTarget: xtendState, dataSourceAdapters: { rest: createRepeatedDataSourceAdapter() }, xtensions: {
      grants, async [extra.shared ? 'loadPeerGroup' : 'loadPeers']({ provider, group, signal }) {
        stats.loads++; (stats.peerCalls ||= []).push({ provider, group, signal, admissions: admissions.length }); extra.entered?.resolve(); if (extra.wait) await extra.wait;
        if (extra.peerFailure?.()) throw new Error('peer load failure');
        return (group || provider).framework === 'react' ? { React: stats.badPeers ? { ...React, version: '19.0.0' } : React, ReactDOM }
          : { Vue: stats.badPeers ? { ...Vue, version: '3.0.0' } : Vue };
      }
    } };
    return { app, root, hosts, controllers, options, stats, lifecycle, grants, fabric, admissions,
      async close() { app.dispose(); await app.facade.whenXTensionsIdle(); root.remove(); xtendState.clear(); xtendState.batchUpdate(previous); } };
  }
  function additionalHosts(f, framework, overrides) {
    const hosts = [], options = f.stats.providerOptions;
    const factory = integratedApps[f.optionsKey || 'shared-' + framework].platform.compositionRuntime.createMaracaXTensionHostFactory({ ...options, ...overrides });
    return { create(index = 0) {
      const context = f.stats.contexts[index], container = document.createElement('section'); f.root.append(container);
      const suffix = '.shared-test-' + hosts.length;
      const host = factory({ ...context, container, hostId: context.hostId + suffix, xtensionId: context.xtensionId + suffix }); hosts.push(host);
      return { host, container, mount: () => host.mount(container, { query: 'shared', activeId: null }) };
    }, async close() { for (const host of hosts) await host.unmount(); } };
  }
  for (const framework of ['react', 'vue']) {
    await test(`A04.3.3: ${framework} keyed hosts load exact shared peers only after native admission`, async () => {
      const source = integratedApps['shared-' + framework], f = fixture(framework, { shared: true });
      try {
        equal(f.stats.loads, 0, 'preloading companion does not resolve peers');
        if (source.readProviderRequests) equal((await source.readProviderRequests()).length, 0, 'preloading requests no provider modules');
        await f.app.boot(f.options);
        equal(f.stats.loads, 1, 'one shared group serves three keyed hosts'); equal(f.stats.providerLoads, 1, 'one native provider import');
        const call = f.stats.peerCalls[0]; check(call.admissions > 0, 'actual Kernel/Fabric admission precedes resolution');
        check(Object.isFrozen(call.group) && Object.isFrozen(call.group.versions) && Object.isFrozen(call.group.providerIds), 'group descriptor is deeply immutable');
        check(!call.provider && !call.signal.aborted, 'loader receives a live group lifetime'); equal(f.root.querySelectorAll('input').length, 3, 'independent framework roots render');
        if (source.readProviderRequests) equal(new Set(await source.readProviderRequests()).size, 3, 'native HTTP imports preserve the complete pinned graph');
      } finally { await f.close(); }
    });
    await test(`A04.3.3: ${framework} distinct compatible providers share peers and retain independent roots`, async () => {
      const f = fixture(framework, { shared: true, sourceKey: 'shared-pair-' + framework });
      try {
        await f.app.boot(f.options); equal(f.stats.providerLoads, 2, 'both declared provider loaders execute'); equal(f.stats.loads, 1, 'distinct compatible providers share one group');
        equal(f.stats.peerCalls[0].group.providerIds.length, 2, 'both provider identities are declared members'); equal(f.root.querySelectorAll('input').length, 2, 'each provider owns a framework root');
        equal(f.controllers.length, 1, 'one native Kernel owns both hosts');
      } finally { await f.close(); }
    });
    await test(`A04.3.3: ${framework} revoking one pending consumer preserves its sibling's shared peers`, async () => {
      const f = fixture(framework, { shared: true, sourceKey: 'shared-pair-' + framework }), entered = deferred(), release = deferred(); let extra;
      try {
        await f.app.boot(f.options); f.optionsKey = 'shared-pair-' + framework; let calls = 0, signal;
        extra = additionalHosts(f, framework, { loadPeerGroup: async context => { calls++; signal = context.signal; entered.resolve(); await release.promise; return framework === 'react' ? { React, ReactDOM } : { Vue }; } });
        const first = extra.create(0), second = extra.create(1), a = first.mount(), b = second.mount();
        await entered.promise; await new Promise(resolve => setTimeout(resolve, 0)); await first.host.unmount();
        check(!signal.aborted, 'surviving consumer keeps group authority'); release.resolve(); await a; check((await b).ok, 'surviving mount succeeds');
        equal(calls, 1, 'one pending attempt serves both providers'); equal(first.container.childElementCount, 0, 'revoked root stays empty'); equal(second.container.querySelectorAll('input').length, 1, 'sibling renders');
        await second.host.unmount(); check(signal.aborted, 'last mounted consumer releases group lifetime');
      } finally { release.resolve(); await extra?.close(); await f.close(); }
    });
    await test(`A04.3.3: ${framework} successful cache survives one dispose and expires with its last host`, async () => {
      const f = fixture(framework, { shared: true }); let extra;
      try {
        await f.app.boot(f.options); const signals = [];
        extra = additionalHosts(f, framework, { loadPeerGroup: ({ signal }) => { signals.push(signal); return framework === 'react' ? { React, ReactDOM } : { Vue }; } });
        const a = extra.create(), b = extra.create(); check((await a.mount()).ok && (await b.mount()).ok, 'both actual hosts mount');
        equal(signals.length, 1, 'successful group is cached'); await a.host.unmount(); check(!signals[0].aborted, 'one dispose preserves sibling lifetime');
        const c = extra.create(); check((await c.mount()).ok, 'later host joins successful cache'); equal(signals.length, 1, 'mounted sibling retains cache');
        await b.host.unmount(); await c.host.unmount(); check(signals[0].aborted, 'last consumer evicts cache');
        const d = extra.create(); check((await d.mount()).ok, 'later incarnation mounts'); equal(signals.length, 2, 'fresh lifetime resolves peers again');
      } finally { await extra?.close(); await f.close(); }
    });
    await test(`A04.3.3: ${framework} final pending abort fences late peers and permits a fresh attempt`, async () => {
      const f = fixture(framework, { shared: true }), entered = deferred(), release = deferred(); let extra, factories = 0;
      try {
        await f.app.boot(f.options); let attempts = 0, firstSignal;
        extra = additionalHosts(f, framework, { loadPeerGroup: async ({ signal }) => { attempts++; if (attempts === 1) { firstSignal = signal; entered.resolve(); await release.promise; } return framework === 'react' ? { React, ReactDOM } : { Vue }; } });
        globalThis.__XTendA043Observe = () => factories++;
        const first = extra.create(), pending = first.mount(); await entered.promise; await first.host.unmount(); await pending;
        check(firstSignal.aborted, 'logical drain aborts last pending group without awaiting transport');
        const next = extra.create(); check((await next.mount()).ok, 'new host resolves an independent attempt'); equal(attempts, 2, 'retired cache is not reused');
        release.resolve(); await new Promise(resolve => setTimeout(resolve, 0)); equal(factories, 1, 'late completion cannot initialize a revoked host');
        const sibling = extra.create(); check((await sibling.mount()).ok, 'new successful cache remains usable'); equal(attempts, 2, 'late old completion cannot replace the current cache');
      } finally { release.resolve(); delete globalThis.__XTendA043Observe; await extra?.close(); await f.close(); }
    });
    for (const failure of ['rejection', 'version']) await test(`A04.3.3: ${framework} shared ${failure} evicts the attempt before retry in the same factory`, async () => {
      const f = fixture(framework, { shared: true }); let extra;
      try {
        await f.app.boot(f.options); let attempts = 0;
        extra = additionalHosts(f, framework, { loadPeerGroup: () => { attempts++; if (attempts === 1 && failure === 'rejection') throw new Error('trusted loader failed');
          return framework === 'react' ? { React: attempts === 1 ? { ...React, version: '19.0.0' } : React, ReactDOM } : { Vue: attempts === 1 ? { ...Vue, version: '3.0.0' } : Vue }; } });
        const first = extra.create(); let result; try { result = await first.mount(); } catch (_) {} check(!result?.ok, 'invalid peer result fails mount'); equal(first.container.childElementCount, 0, 'no invalid framework root');
        const second = extra.create(); check((await second.mount()).ok, 'same factory retries after failure'); equal(attempts, 2, 'failure is never cached');
      } finally { await extra?.close(); await f.close(); }
    });
    await test(`A04.3.3: ${framework} late rejected transport cannot evict its replacement`, async () => {
      const f = fixture(framework, { shared: true }), entered = deferred(), release = deferred(); let extra;
      try {
        await f.app.boot(f.options); let attempts = 0, normalizations = 0;
        const options = f.stats.providerOptions, method = framework === 'react' ? 'normalizeReactPeers' : 'normalizeVuePeers';
        extra = additionalHosts(f, framework, { adapters: { ...options.adapters, [framework]: { ...options.adapters[framework], [method](loaded) { normalizations++; return options.adapters[framework][method](loaded); } } },
          loadPeerGroup: async () => { attempts++; if (attempts === 1) { entered.resolve(); await release.promise; throw new Error('retired transport failure'); } return framework === 'react' ? { React, ReactDOM } : { Vue }; } });
        const first = extra.create(), pending = first.mount(); await entered.promise; await first.host.unmount(); await pending;
        equal(normalizations, 0, 'retired pending result is never normalized');
        const next = extra.create(); check((await next.mount()).ok, 'replacement mounts'); const before = normalizations;
        release.resolve(); await new Promise(resolve => setTimeout(resolve, 0)); equal(normalizations, before, 'late failure has no peer continuation');
        const sibling = extra.create(); check((await sibling.mount()).ok, 'replacement remains cached'); equal(attempts, 2, 'old failure cannot delete the new entry');
      } finally { release.resolve(); await extra?.close(); await f.close(); }
    });
    await test(`A04.3.3: ${framework} cached versions are rechecked before each host factory`, async () => {
      const f = fixture(framework, { shared: true }); let extra, factories = 0;
      try {
        await f.app.boot(f.options); const runtime = { ...(framework === 'react' ? React : Vue) }, version = runtime.version; let attempts = 0;
        extra = additionalHosts(f, framework, { loadPeerGroup: () => { attempts++; return framework === 'react' ? { React: runtime, ReactDOM } : { Vue: runtime }; } });
        globalThis.__XTendA043Observe = () => factories++;
        const first = extra.create(); check((await first.mount()).ok, 'initial exact version mounts');
        runtime.version = framework === 'react' ? '19.0.0' : '3.0.0'; const second = extra.create(); let result;
        try { result = await second.mount(); } catch (_) {} check(!result?.ok, 'mutated cached version is rejected'); equal(factories, 1, 'invalid cached peers never reach the factory'); equal(attempts, 1, 'existing group is reused and revalidated');
        runtime.version = version;
      } finally { delete globalThis.__XTendA043Observe; await extra?.close(); await f.close(); }
    });
    await test(`A04.3.3: ${framework} denied capabilities prevent shared resolution`, async () => {
      const f = fixture(framework, { shared: true, missingGrant: true });
      try { let failed = false; try { await f.app.boot(f.options); } catch (_) { failed = true; } check(failed, 'missing authority rejects boot'); equal(f.stats.loads, 0, 'no shared peer loader'); equal(f.stats.providerLoads, 0, 'no provider loader'); }
      finally { await f.close(); }
    });
    await test(`A04.3.3: ${framework} boot captures the loader and creates a fresh cache after dispose`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { shared: true, providerEntered: entered, providerWait: release.promise });
      try {
        const original = f.options.xtensions.loadPeerGroup, boot = f.app.boot(f.options); await entered.promise;
        f.options.xtensions.loadPeerGroup = () => { throw new Error('mutated loader must not run'); }; release.resolve(); await boot;
        equal(f.stats.loads, 1, 'synchronous capture preserves original application loader'); const old = f.stats.peerCalls[0].signal;
        f.app.dispose(); await f.app.facade.whenXTensionsIdle(); check(old.aborted, 'boot dispose drains shared group');
        f.options.xtensions.loadPeerGroup = original; await f.app.boot(f.options); equal(f.stats.loads, 2, 'new boot owns its own cache');
      } finally { release.resolve(); await f.close(); }
    });
  }
  await test('A04.3.3: mixed React/Vue resolution uses separate exact groups', async () => {
    const f = fixture('mixed', { shared: true });
    try { await f.app.boot(f.options); equal(f.stats.loads, 2, 'one group per framework/version tuple'); equal(f.root.querySelectorAll('input').length, 2, 'both actual roots render'); check(f.stats.peerCalls[0].group.id !== f.stats.peerCalls[1].group.id, 'groups have separate identities'); }
    finally { await f.close(); }
  });
  for (const framework of ['react', 'vue']) {
    await test(`A04.3.2: ${framework} native provider import waits for admitted mount and is shared across keyed hosts`, async () => {
      const source = integratedApps['deferred-' + framework], entered = deferred(), release = deferred(), f = fixture(framework, { deferred: true, providerEntered: entered, providerWait: release.promise }); let factories = 0;
      globalThis.__XTendA043Observe = () => factories++;
      try {
        equal(source.companion.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v4', 'deferred artifact is explicitly versioned');
        equal(source.companion.artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v1', 'exact provider/module/peer load plan is present');
        equal(f.stats.providerLoads, 0, 'loading app and companion creates no provider import');
        if (source.readProviderRequests) equal((await source.readProviderRequests()).length, 0, 'native HTTP module graph has no provider requests before mount');
        const boot = f.app.boot(f.options); await entered.promise;
        equal(f.stats.loads, 0, 'peers wait for successful provider loading'); equal(factories, 0, 'pending imports cannot create components');
        check(f.stats.providerCalls.every(row => row.admissions > 0), 'real kernel/Fabric admission precedes provider imports');
        release.resolve(); await boot;
        equal(f.stats.providerLoads, 1, 'one provider load serves all three keyed hosts in this factory'); equal(f.stats.loads, 3, 'explicit peer loading remains per host');
        equal(factories, 3, 'each actual host initializes its own component'); equal(f.root.querySelectorAll('input').length, 3, 'all framework roots render');
        if (source.readProviderRequests) equal(new Set(await source.readProviderRequests()).size, 3, 'HTTP fetches exactly entry, component and shared helper');
      } finally { release.resolve(); delete globalThis.__XTendA043Observe; await f.close(); }
    });
    await test(`A04.3.2: ${framework} one revoked native host cannot cancel a sibling sharing the provider import`, async () => {
      const f = fixture(framework, { deferred: true }), entered = deferred(), release = deferred(); const extra = [];
      try {
        await f.app.boot(f.options); let loads = 0, peers = 0;
        const options = f.stats.providerOptions, id = options.artifact.manifest.providers[0].id, original = options.loadProviders[id];
        const factory = integratedApps['deferred-' + framework].platform.compositionRuntime.createMaracaXTensionHostFactory({ ...options,
          loadProviders: { [id]: async () => { loads++; entered.resolve(); await release.promise; return original(); } },
          loadPeers: context => { peers++; return options.loadPeers(context); } });
        const context = f.stats.contexts[0];
        function create(suffix) { const container = document.createElement('section'); f.root.append(container); const host = factory({ ...context, container, hostId: context.hostId + suffix, xtensionId: context.xtensionId + suffix }); extra.push(host); return { host, container }; }
        const first = create('.first'), second = create('.second');
        const a = first.host.mount(first.container, { query: 'first', activeId: null }), b = second.host.mount(second.container, { query: 'second', activeId: null });
        await entered.promise; await first.host.unmount(); release.resolve(); await a; check((await b).ok, 'sibling mount completes');
        equal(loads, 1, 'one pending provider load serves both real hosts'); equal(peers, 1, 'only the surviving host loads peers');
        equal(first.container.querySelectorAll('input').length, 0, 'revoked host remains empty'); equal(second.container.querySelectorAll('input').length, 1, 'sibling renders actual framework root');
      } finally { release.resolve(); for (const host of extra) await host.unmount(); await f.close(); }
    });
    await test(`A04.3.2: ${framework} denied capabilities prevent provider and peer loading`, async () => {
      const f = fixture(framework, { deferred: true, missingGrant: true });
      try { let failed = false; try { await f.app.boot(f.options); } catch (_) { failed = true; } check(failed, 'missing authority blocks boot'); equal(f.stats.providerLoads, 0, 'no provider loader'); equal(f.stats.loads, 0, 'no peer loader'); }
      finally { await f.close(); }
    });
    await test(`A04.3.2: ${framework} dispose fences pending import before peers and permits a fresh boot`, async () => {
      const entered = deferred(), release = deferred(), f = fixture(framework, { deferred: true, providerEntered: entered, providerWait: release.promise }); let factories = 0;
      globalThis.__XTendA043Observe = () => factories++;
      try {
        const boot = f.app.boot(f.options).catch(() => {}); await entered.promise; f.app.dispose(); await f.app.facade.whenXTensionsIdle();
        equal(f.stats.loads, 0, 'no peer load before cancellation'); equal(factories, 0, 'no component factory');
        const reboot = f.app.boot(f.options); release.resolve(); await boot; await reboot;
        equal(f.stats.loads, 3, 'only the fresh lifetime loads peers'); equal(factories, 3, 'old import continuation never creates a component');
        equal(f.root.querySelectorAll('input').length, 3, 'fresh boot exclusively owns the roots'); equal(f.stats.providerLoads, 2, 'new boot has a new factory load cache');
      } finally { release.resolve(); delete globalThis.__XTendA043Observe; await f.close(); }
    });
    await test(`A04.3.2: ${framework} failed provider loader cannot load peers and allows a fresh attempt`, async () => {
      let failure = true; const f = fixture(framework, { deferred: true, providerFailure: () => failure });
      try {
        let failed = false; try { await f.app.boot(f.options); } catch (_) { failed = true; } check(failed, 'provider failure rejects boot'); equal(f.stats.loads, 0, 'provider failure precedes peer loading');
        await f.app.facade.whenXTensionsIdle(); check(f.controllers.every(row => row.disposed && !row.native.listResources().length), 'failed boot drains resources');
        failure = false; await f.app.boot(f.options); equal(f.root.querySelectorAll('input').length, 3, 'new boot retries trusted loader');
      } finally { await f.close(); }
    });
    await test(`A04.3.2: ${framework} missing deferred factory export fails before peers`, async () => {
      const f = fixture(framework, { deferred: true, missingExport: true });
      try { let failed = false; try { await f.app.boot(f.options); } catch (_) { failed = true; } check(failed, 'invalid namespace is rejected'); equal(f.stats.loads, 0, 'no peers for invalid namespace'); equal(f.root.querySelectorAll('input').length, 0, 'no framework root'); }
      finally { await f.close(); }
    });
  }
  await test('A04.3.2: mixed deferred React/Vue providers share their transitive module but keep peer requests separate', async () => {
    const f = fixture('mixed', { deferred: true });
    try { await f.app.boot(f.options); equal(f.stats.providerLoads, 2, 'one loader per provider'); equal(f.stats.loads, 2, 'exact framework-specific peer requests'); equal(f.root.querySelectorAll('input').length, 2, 'both frameworks render'); equal(f.controllers.length, 1, 'one native kernel owner'); }
    finally { await f.close(); }
  });
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
        equal([f.app.schema, f.app.apiVersion], ['xtend.maraca.browser-composition-root.v7', '7.0.0'], 'integrated browser contract is versioned');
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
