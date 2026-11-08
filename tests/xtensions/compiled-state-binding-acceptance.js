'use strict';
const bindingRuntime = require('@ccslabs/xtend/xtensions/state-binding');
const { createReactRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { createFilterPanel } = require('../../development/rmtx-a02/controlled-filters');

async function runCompiledStateBindingAcceptance({ React, ReactDOM, document, test, check, equal, plan }) {
  const { createMaracaPlanRuntime } = await import('../../xtend-maraca/plan-runtime.mjs');
  const modules = {
    state: await import('../../xtendrmt/rmt-state-selector-runtime.js'),
    stateProjection: await import('../../xtendrmt/rmt-state-host-adapter.js'),
    action: await import('../../xtendrmt/rmt-action-effect-runtime.js'),
    app: await import('../../xtendrmt/rmt-app-runtime.js'),
    renderer: await import('../../xtendrmt/rmt-dom-descriptor-renderer.js'),
    viewProjection: await import('../../xtendrmt/rmt-maraca-view-projection-adapter.js'),
    presentation: await import('../../xtendrmt/rmt-presentation-effect-adapter.js'),
    events: await import('../../xtendrmt/rmt-event-routing-runtime.js'),
    surfaces: await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js'),
    surfaceController: await import('../../components/xsurfacemanager-controller.js')
  };
  const { xtendState } = await import('../../components/xtend-state.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
  const within = async (promise) => {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Compiled binding did not settle.')), 1500); })]); }
    finally { clearTimeout(timer); }
  };
  const rejected = async (fn) => { let error; try { await fn(); } catch (caught) { error = caught; } check(!!error, 'operation must reject'); return error; };
  function fixture(extra = {}) {
    const previous = xtendState.snapshot().data;
    const root = document.createElement('main'); root.id = 'xtend-maraca-root'; document.body.append(root);
    const hosts = [];
    const scheduler = createRmtKernelScheduler({ preferPostTask: false });
    let runtime;
    try { runtime = createMaracaPlanRuntime({ plan, root, moduleApis: modules, scheduler, hydrateOnBoot: false, ensureComponentsOnBoot: false,
      stateProjectionTarget: xtendState, xtensionBindingsRuntime: bindingRuntime,
      viewProjectionPort: modules.viewProjection.createRmtMaracaViewProjectionAdapter({ root, documentTarget: document }),
      createXTensionHost(context) {
        const host = createReactRuntimeAdapter({ ...context, component: createFilterPanel(React), peers: { React, ReactDOM }, policy: { events: context.events } });
        hosts.push({ context, host }); return host;
      }, ...extra }); } catch (error) { scheduler.dispose(); root.remove(); throw error; }
    return { root, runtime, hosts, async close() {
      runtime.dispose(); await runtime.whenXTensionsIdle(); scheduler.dispose(); root.remove(); xtendState.clear(); xtendState.batchUpdate(previous);
    } };
  }
  const filter = (query, activeId = null) => ({ filter: { query, selection: { activeId } } });

  await test('A02.2: browser composition transports the compiled sidecar and trusted host ports', async () => {
    const { createMaracaBrowserCompositionRoot } = await import('../../xtend-maraca/browser-composition-runtime.mjs');
    const root = document.createElement('main'); document.body.append(root);
    const previous = xtendState.snapshot().data;
    const sourceNames = { state: 'rmt-state-selector-runtime', stateProjection: 'rmt-state-host-adapter', action: 'rmt-action-effect-runtime',
      app: 'rmt-app-runtime', renderer: 'rmt-dom-descriptor-renderer', viewProjection: 'rmt-maraca-view-projection-adapter',
      presentation: 'rmt-presentation-effect-adapter', events: 'rmt-event-routing-runtime', surfaces: 'rmt-surface-resource-graph-runtime' };
    const runtimeModuleApis = Object.fromEntries(Object.entries(sourceNames).map(([key, name]) => [`xtendrmt/${name}.js`, modules[key]]));
    runtimeModuleApis['components/xsurfacemanager-controller.js'] = modules.surfaceController;
    const composition = createMaracaBrowserCompositionRoot({ ...plan, schema: 'xtend.maraca.bundle-report.v1', components: plan.components.selected }, {
      documentTarget: document, windowTarget: document.defaultView, platformTarget: document.defaultView,
      componentImporters: Object.fromEntries(plan.components.selected.filter((entry) => entry.native).map((entry) => [entry.tag, () => Promise.resolve(entry.tag)])),
      runtimeModuleApis, createPlanRuntime: createMaracaPlanRuntime
    });
    const hosts = [];
    try {
      const bootOptions = { root, stateProjectionTarget: xtendState, xtensionBindingsRuntime: bindingRuntime,
        createXTensionHost(context) {
          const host = createReactRuntimeAdapter({ ...context, component: createFilterPanel(React), peers: { React, ReactDOM }, policy: { events: context.events } });
          hosts.push(host); return host;
        } };
      const facade = await composition.boot(bootOptions);
      // boot returns a snapshot; operations live on the composition facade.
      check(!!facade && composition.facade.getXTensionBindings().length === 2, 'composition exposes compiled bindings');
      equal(composition.schema, 'xtend.maraca.browser-composition-root.v2', 'composition has a distinct current schema');
      equal(composition.facade.apiVersion, '2.0.0', 'browser API version differs from Legacy');
      await composition.facade.dispatchCommand('filter.right.replace', filter('composition', 'right'));
      equal(root.querySelectorAll('output')[1].textContent, 'composition:right', 'browser composition uses the same Action/props barrier');
      composition.dispose(); composition.dispose(); await composition.facade.whenXTensionsIdle();
      check(hosts.every((host) => host.snapshot().disposed), 'composition drain waits for foreign roots');
      await composition.boot(bootOptions);
      equal(hosts.length, 4, 'reboot creates two fresh hosts after cleanup');
    } finally { composition.dispose(); await composition.facade.whenXTensionsIdle(); root.remove(); xtendState.clear(); xtendState.batchUpdate(previous); }
  });

  await test('A02.2: compiled Classic Actions commit once through Maraca, XTend State and two real React roots', async () => {
    const f = fixture();
    try {
      await f.runtime.boot(); const bindings = f.runtime.getXTensionBindings();
      equal(f.runtime.schema, 'xtend.maraca.plan-runtime.v4', 'extended API has its own schema version');
      equal(bindings.length, 2, 'compiled artifact creates exactly two instances');
      const inputs = [...f.root.querySelectorAll('input')], commands = [], changes = [];
      const stopState = f.runtime.model.subscribe((event) => changes.push(event));
      const stopEvents = f.runtime.subscribeEvents((event) => {
        if (event.type === 'command' || event.event === 'command') commands.push(f.root.querySelector('output').textContent);
      });
      try {
        inputs[0].value = 'from-react'; inputs[0].dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
        await within(f.runtime.whenXTensionsIdle());
        equal(changes.length, 1, 'Action publishes one Model transaction');
        equal(f.runtime.model.getState('filter.left').query, 'from-react', 'Action updates authoritative Model');
        equal(xtendState.get('filter.left').query, 'from-react', 'real State projection contains same commit');
        equal([...f.root.querySelectorAll('output')].map((node) => node.textContent), ['from-react:-', 'right:-'], 'only addressed React instance changes');
        const result = await f.runtime.dispatchCommand('filter.left.replace', filter('from-action', '42'));
        equal(result.status, 'success', 'declared Classic Action succeeds');
        equal(f.root.querySelector('output').textContent, 'from-action:42', 'command completion waits for active XTension props');
        check(f.root.querySelector('input') === inputs[0], 'Model/View commits retain the React-owned subtree');
        check(commands.length >= 2 && commands.at(-1) === 'from-action:42', 'command event follows props commit');
      } finally { stopState(); stopEvents(); }
    } finally { await f.close(); }
  });
  await test('A02.2: explicit Maraca refresh preserves keyed foreign roots and their DOM ownership', async () => {
    const f = fixture();
    try {
      await f.runtime.boot(); const inputs = [...f.root.querySelectorAll('input')], identities = f.runtime.getXTensionBindings().map((entry) => entry.instance.identity);
      await f.runtime.dispatchCommand('xtend.system.refresh');
      check([...f.root.querySelectorAll('input')].every((node, index) => node === inputs[index]), 'refresh reuses the foreign DOM nodes');
      equal(f.runtime.getXTensionBindings().map((entry) => entry.instance.identity), identities, 'refresh retains instance incarnations');
      await f.runtime.dispatchCommand('filter.right.replace', filter('after-refresh', 'right'));
      equal(f.root.querySelectorAll('output')[1].textContent, 'after-refresh:right', 'reference still works after full View refresh');
    } finally { await f.close(); }
  });
  await test('A02.2: invalid nested intents never enter the compiled Action transaction', async () => {
    const f = fixture();
    try {
      await f.runtime.boot(); const before = f.runtime.model.snapshot();
      f.hosts[0].host.emit({ type: 'change', payload: { filter: { query: 'bad', selection: { activeId: 5 } } } });
      await f.runtime.whenXTensionsIdle(); equal(f.runtime.model.snapshot(), before, 'typed return guard rejects before Action execution');
      check(f.runtime.getXTensionBindings()[0].instance.snapshot().diagnostics.length === 1, 'binding rejection remains observable');
    } finally { await f.close(); }
  });
  await test('A02.2: unsupported artifacts, undeclared commands and missing runtime authority fail before host creation', async () => {
    for (const change of [
      (value) => { value.xtensionBindings.schema += '.unsupported'; },
      (value) => { value.xtensionBindings.bindings[0].binding.intents.change.command = 'missing'; },
      (value) => { value.xtensionBindings.bindings[0].surface = 'missing'; }
    ]) {
      const bad = copy(plan); change(bad);
      await rejected(() => fixture({ plan: bad }));
    }
    await rejected(() => fixture({ xtensionBindingsRuntime: undefined }));
    await rejected(() => fixture({ createXTensionHost: undefined }));
  });
  await test('A02.2: disposing an instance invalidates an in-flight Action before its Model commit', async () => {
    const entered = deferred(), release = deferred();
    const action = { ...modules.action, createRmtActionEffectRuntime(options) {
      const actual = modules.action.createRmtActionEffectRuntime(options);
      return { ...actual, async runAction(...args) { entered.resolve(); await release.promise; return actual.runAction(...args); } };
    } };
    const f = fixture({ moduleApis: { ...modules, action } });
    try {
      await f.runtime.boot(); const before = f.runtime.model.snapshot();
      f.hosts[0].host.emit({ type: 'change', payload: filter('stale') }); await within(entered.promise);
      await f.runtime.getXTensionBindings()[0].instance.dispose(); release.resolve();
      await within(f.runtime.whenXTensionsIdle()); await f.runtime.dispatchCommand('xtend.system.refresh');
      equal(f.runtime.model.snapshot(), before, 'stale Action cannot mutate Model or replacement state');
    } finally { release.resolve(); await f.close(); }
  });
  await test('A02.2: paused compiled hosts buffer Action commits and resume the latest controlled slice', async () => {
    const f = fixture();
    try {
      await f.runtime.boot(); const left = f.runtime.getXTensionBindings()[0].instance;
      await left.suspend(); await f.runtime.dispatchCommand('filter.left.replace', filter('paused', 'latest'));
      equal(f.root.querySelector('output').textContent, 'left:-', 'paused host does not render');
      await left.resume(); equal(f.root.querySelector('output').textContent, 'paused:latest', 'resume applies latest compiled Action state');
    } finally { await f.close(); }
  });
  await test('A02.2: a failing second host cleans up the first root and the registry', async () => {
    let calls = 0, first;
    const f = fixture({ createXTensionHost(context) {
      if (++calls === 2) throw new Error('second-host-failure');
      first = createReactRuntimeAdapter({ ...context, component: createFilterPanel(React), peers: { React, ReactDOM }, policy: { events: context.events } });
      return first;
    } });
    try {
      await rejected(() => f.runtime.boot()); await within(f.runtime.whenXTensionsIdle());
      check(first.snapshot().disposed && f.root.querySelectorAll('input').length === 0, 'partial boot retains no live foreign roots');
    } finally { await f.close(); }
  });
  await test('A02.2: disposal aborts a held runtime loader without blocking Maraca teardown', async () => {
    const entered = deferred(), load = deferred(); let host;
    const f = fixture({ createXTensionHost(context) {
      host = createReactRuntimeAdapter({ ...context, component: createFilterPanel(React), loadRuntime: () => { entered.resolve(); return load.promise; }, policy: { events: context.events } });
      return host;
    } });
    try {
      const booting = f.runtime.boot(); const outcome = booting.catch((error) => error); await within(entered.promise);
      f.runtime.dispose(); await within(f.runtime.whenXTensionsIdle()); await within(outcome);
      load.resolve({ React, ReactDOM }); await Promise.resolve();
      check(host.snapshot().disposed && !f.root.querySelector('input'), 'late loader cannot resurrect disposed plan');
    } finally { load.resolve({ React, ReactDOM }); await f.close(); }
  });
}
module.exports = { runCompiledStateBindingAcceptance };
