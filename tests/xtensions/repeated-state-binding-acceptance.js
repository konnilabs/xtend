'use strict';
const { createReactRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { createRepeatedFilterPanel, createRepeatedDataSourceAdapter } = require('../../development/rmtx-a02/repeated-filters');
async function runRepeatedStateBindingAcceptance({ React, ReactDOM, document, test, check, equal, fixture, plan, modules, bindingRuntime, xtendState, within, rejected, deferred }) {
  const copy = value => JSON.parse(JSON.stringify(value));
  const component = createRepeatedFilterPanel(React);
  const make = extra => fixture({ plan, component, dataSourceAdapters: { rest: createRepeatedDataSourceAdapter() }, ...extra });
  const model = f => copy(f.runtime.model.getState('groups'));
  const replace = (f, groups) => f.runtime.dispatchCommand('groups.replace', { groups });
  const address = entry => JSON.stringify(entry.instance.identity.address.keys);
  // Resolve through actual containers; JSON addresses contain quotes and brackets.
  const containers = f => new Map(f.hosts.filter(({ host }) => !host.snapshot().disposed).map(({ context }) => [JSON.stringify(context.identity.address.keys), context.container]));
  const liveInputs = f => new Map([...containers(f)].map(([key, node]) => [key, node.querySelector('input')]));

  await test('A02.4: nested typed keys create three distinct real roots and concrete host identities', async () => {
    const f = make();
    try {
      await f.runtime.boot();
      equal(f.runtime.getXTensionBindings().map(address), ['["a",1]', '["a","1"]', '["b",1]'], 'ancestor scope and key type define identity');
      equal(new Set(f.runtime.getXTensionBindings().map(entry => entry.hostSurface)).size, 3, 'each instance has a concrete host surface');
      equal([...f.root.querySelectorAll('output')].map(node => node.textContent), ['numeric:-', 'string:-', 'other-parent:-'], 'all real roots receive their scoped Model props');
    } finally { await f.close(); }
  });
  await test('A02.4: reordering parents and items preserves roots while props follow keys', async () => {
    const f = make();
    try {
      await f.runtime.boot(); const before = liveInputs(f), identities = f.runtime.getXTensionBindings().map(entry => entry.instance.identity);
      const groups = model(f); groups.items[0].filters.reverse(); groups.items.reverse();
      groups.items[1].filters[0].query = 'updated-string'; await replace(f, groups);
      check([...f.root.querySelectorAll('input')].every((node, i) => node === [before.get('["b",1]'), before.get('["a","1"]'), before.get('["a",1]')][i]), 'DOM is reordered rather than recreated');
      equal(f.runtime.getXTensionBindings().map(entry => entry.instance.identity), identities, 'reordering keeps every incarnation');
      equal([...f.root.querySelectorAll('output')].map(node => node.textContent), ['other-parent:-', 'updated-string:-', 'numeric:-'], 'scoped reads never retain an obsolete array index');
      await f.runtime.dispatchCommand('xtend.system.refresh');
      check([...liveInputs(f)].every(([key, node]) => node === before.get(key)), 'full refresh also retains roots');
    } finally { await f.close(); }
  });
  await test('A02.4: real input after reorder injects trusted keys and commits only its own Model item', async () => {
    const f = make();
    try {
      await f.runtime.boot(); const groups = model(f); groups.items.reverse(); groups.items[1].filters.reverse(); await replace(f, groups);
      const events = []; const stop = f.runtime.model.subscribe(event => events.push(event));
      try {
        const input = liveInputs(f).get('["a",1]'); input.value = 'from-address'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
        await within(f.runtime.whenXTensionsIdle());
        equal(events.length, 1, 'one declared Action produces one Model transaction');
        equal(model(f).items[1].filters.map(item => item.query), ['string', 'from-address'], 'numeric and string keys stay distinct after reorder');
        equal(model(f).items[0].filters[0].query, 'other-parent', 'same local key in another parent is isolated');
        equal(xtendState.get('groups'), model(f), 'State projection equals authoritative Model');
        equal(input.nextSibling.textContent, 'from-address:-', 'idle includes the controlled React commit');
      } finally { stop(); }
    } finally { await f.close(); }
  });
  await test('A02.4: event payloads cannot substitute address keys or target another item', async () => {
    const f = make();
    try {
      await f.runtime.boot(); const before = model(f);
      f.hosts[0].host.emit({ type: 'change', payload: { query: 'forged', groupId: 'b', filterId: 1 } });
      await f.runtime.whenXTensionsIdle(); equal(model(f), before, 'key fields are excluded from untrusted payload authority');
      check(f.runtime.getXTensionBindings()[0].instance.snapshot().diagnostics.length === 1, 'forgery is diagnosed');
    } finally { await f.close(); }
  });
  await test('A02.4: removing and readding a key revokes callbacks and creates a new incarnation', async () => {
    const f = make();
    try {
      await f.runtime.boot(); const old = f.runtime.getXTensionBindings()[0].instance, host = f.hosts[0];
      const original = model(f), groups = copy(original); groups.items[0].filters.shift(); await replace(f, groups);
      check(host.host.snapshot().disposed && !host.context.container.isConnected, 'root is disposed and its host removed');
      check(host.context.onEvent({}) === false, 'old callback has no authority');
      await replace(f, original);
      const replacement = f.runtime.getXTensionBindings().find(entry => address(entry) === '["a",1]').instance;
      equal(replacement.identity.address, old.identity.address, 'logical address is reusable');
      check(replacement.identity.incarnation !== old.identity.incarnation, 'replacement has fresh authority');
      const input = liveInputs(f).get('["a",1]'); input.value = 'replacement'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
      await f.runtime.whenXTensionsIdle(); equal(model(f).items[0].filters[0].query, 'replacement', 'new lifetime routes its own intent');
    } finally { await f.close(); }
  });
  await test('A02.4: changing an ancestor or item key ends the corresponding scoped lifetime', async () => {
    const f = make();
    try {
      await f.runtime.boot(); const originals = [...f.hosts]; const groups = model(f);
      groups.items[0].id = 'renamed'; groups.items[1].filters[0].id = 2; await replace(f, groups);
      check(originals.every(({ host }) => host.snapshot().disposed), 'identity changes are lifetime changes');
      equal(f.runtime.getXTensionBindings().map(address), ['["renamed",1]', '["renamed","1"]', '["b",2]'], 'new scopes produce unambiguous addresses');
    } finally { await f.close(); }
  });
  await test('A02.4: initially empty collections create no hosts and can later become populated', async () => {
    const f = make({ initialState: { groups: { items: [] } } });
    try {
      await f.runtime.boot(); equal(f.hosts.length, 0, 'empty collections create no factory or placeholder root');
      const initial = copy(plan.orchestration.artifact.state.states.find(state => state.id === 'groups').initial);
      await replace(f, initial); equal(f.root.querySelectorAll('input').length, 3, 'appearance creates all keyed scopes');
      await replace(f, { items: [] }); equal(f.runtime.getXTensionBindings().length, 0, 'removal releases every address');
      check(f.hosts.every(({ host }) => host.snapshot().disposed), 'emptying releases all foreign roots');
    } finally { await f.close(); }
  });
  await test('A02.4: duplicate, absent and malformed keys fail closed before partial View reconciliation', async () => {
    for (const mutate of [
      groups => { groups.items[0].filters[1].id = 1; },
      groups => { groups.items[1].id = 'a'; },
      groups => { delete groups.items[0].filters[0].id; },
      groups => { groups.items[0].filters[0].id = null; },
      groups => { groups.items[0].filters[0].id = {}; },
      groups => { groups.items[0].filters[0].id = -1; },
      groups => { groups.items[0].filters[0].id = 0.5; },
      groups => { groups.items[0].filters = {}; }
    ]) {
      const f = make();
      try {
        await f.runtime.boot(); const groups = model(f); mutate(groups);
        await rejected(() => replace(f, groups)); await within(f.runtime.whenXTensionsIdle());
        equal(f.runtime.snapshot().phase, 'failed', 'invalid collection cannot retain active authority');
        equal(f.hosts.length, 3, 'failure creates no partially materialized new hosts');
        check(f.hosts.every(({ host }) => host.snapshot().disposed), 'failure revokes all previous roots');
      } finally { await f.close(); }
    }
  });
  await test('A02.4: per-item presence removes one lifetime and preserves unaffected roots', async () => {
    const f = make();
    try {
      await f.runtime.boot(); const before = liveInputs(f), groups = model(f);
      groups.items[0].filters[0].enabled = false; await replace(f, groups);
      equal(f.runtime.getXTensionBindings().length, 2, 'false item presence retires only that item');
      check(liveInputs(f).get('["a","1"]') === before.get('["a","1"]'), 'sibling root is retained');
      groups.items[0].filters[0].enabled = true; groups.items[0].filters[0].query = 'resurfaced'; await replace(f, groups);
      check(liveInputs(f).get('["a",1]') !== before.get('["a",1]'), 'presence appearance has a fresh root');
      equal(liveInputs(f).get('["a",1]').value, 'resurfaced', 'appearance reads current scoped props');
    } finally { await f.close(); }
  });
  await test('A02.4: queued intents cannot cross removal into an equal key in another parent', async () => {
    const entered = deferred(), release = deferred();
    const action = { ...modules.action, createRmtActionEffectRuntime(options) {
      const actual = modules.action.createRmtActionEffectRuntime(options);
      return { ...actual, async runAction(id, ...args) { if (id === 'groups.replace') { entered.resolve(); await release.promise; } return actual.runAction(id, ...args); } };
    } };
    const f = make({ moduleApis: { ...modules, action } });
    try {
      await f.runtime.boot(); const groups = model(f); groups.items.shift();
      const removing = replace(f, groups); await within(entered.promise);
      f.hosts[0].host.emit({ type: 'change', payload: { query: 'late' } });
      release.resolve(); await within(removing); await within(f.runtime.whenXTensionsIdle());
      equal(model(f).items[0].filters[0].query, 'other-parent', 'revoked command cannot retarget the surviving local key');
    } finally { release.resolve(); await f.close(); }
  });
  await test('A02.4: a partial repeated host factory failure cleans every mounted root', async () => {
    const hosts = [];
    const f = make({ createXTensionHost(context) {
      if (hosts.length === 2) throw new Error('repeated-third-host-failure');
      const host = createReactRuntimeAdapter({ ...context, component, peers: { React, ReactDOM }, policy: { events: context.events } }); hosts.push(host); return host;
    } });
    try {
      await rejected(() => f.runtime.boot()); await within(f.runtime.whenXTensionsIdle());
      check(hosts.every(host => host.snapshot().disposed), 'partial initialization retains no root authority');
    } finally { await f.close(); }
  });
  await test('A02.4: retiring roots unmount while their keyed hosts are still connected', async () => {
    const observed = [];
    const f = make({ createXTensionHost(context) {
      const host = createReactRuntimeAdapter({ ...context, component, peers: { React, ReactDOM }, policy: { events: context.events } });
      return { ...host, async unmount(reason) { observed.push(context.container.isConnected && !!context.container.querySelector('input')); return host.unmount(reason); } };
    } });
    try { await f.runtime.boot(); await replace(f, { items: [] }); equal(observed, [true, true, true], 'all foreign roots unmount before RMT removes keyed DOM'); }
    finally { await f.close(); }
  });
  await test('A02.4: superseded Views revoke removed keys and defer new scopes until refresh', async () => {
    const entered = deferred(), release = deferred();
    const action = { ...modules.action, createRmtActionEffectRuntime(options) {
      const actual = modules.action.createRmtActionEffectRuntime(options);
      return { ...actual, async runAction(id, ...args) { if (id === 'groups.replace') { entered.resolve(); await release.promise; } return actual.runAction(id, ...args); } };
    } };
    const f = make({ moduleApis: { ...modules, action } });
    try {
      await f.runtime.boot(); const groups = model(f); groups.items[0].filters[0].id = 'new-key';
      const changing = replace(f, groups); await within(entered.promise); f.runtime.getSurfaceBoundary('filter').invalidate('route-left');
      release.resolve(); await within(changing);
      check(f.hosts[0].host.snapshot().disposed, 'removed scoped lifetime is revoked even when the View is superseded');
      equal(f.hosts.length, 3, 'new keys cannot bind against an obsolete View');
      await f.runtime.dispatchCommand('xtend.system.refresh');
      equal(f.hosts.length, 4, 'current refresh mounts the deferred scope');
      equal(f.root.querySelectorAll('input').length, 3, 'exactly the desired roots remain');
    } finally { release.resolve(); await f.close(); }
  });
  await test('A02.4: disposal during an added scoped loader cannot resurrect a removed root', async () => {
    const entered = deferred(), load = deferred(), hosts = [];
    const f = make({ createXTensionHost(context) {
      const host = createReactRuntimeAdapter({ ...context, component,
        ...(context.identity.address.keys.at(-1) === 'lazy' ? { loadRuntime: () => { entered.resolve(); return load.promise; } } : { peers: { React, ReactDOM } }),
        policy: { events: context.events } }); hosts.push(host); return host;
    } });
    try {
      await f.runtime.boot(); const groups = model(f); groups.items[0].filters.push({ id: 'lazy', query: 'late', selection: { activeId: null }, enabled: true });
      const adding = replace(f, groups).catch(error => error); await within(entered.promise);
      f.runtime.dispose(); await within(f.runtime.whenXTensionsIdle()); await within(adding);
      load.resolve({ React, ReactDOM }); await Promise.resolve();
      check(hosts.every(host => host.snapshot().disposed), 'every current or loading scope stays disposed');
    } finally { load.resolve({ React, ReactDOM }); await f.close(); }
  });
  await test('A02.4: browser composition transports repeated scopes through real Action and Model ports', async () => {
    const { createMaracaBrowserCompositionRoot } = await import('../../xtend-maraca/browser-composition-runtime.mjs');
    const { createMaracaPlanRuntime } = await import('../../xtend-maraca/plan-runtime.mjs');
    const sourceNames = { state: 'rmt-state-selector-runtime', stateProjection: 'rmt-state-host-adapter', action: 'rmt-action-effect-runtime',
      app: 'rmt-app-runtime', renderer: 'rmt-dom-descriptor-renderer', viewProjection: 'rmt-maraca-view-projection-adapter',
      presentation: 'rmt-presentation-effect-adapter', events: 'rmt-event-routing-runtime', surfaces: 'rmt-surface-resource-graph-runtime' };
    const runtimeModuleApis = Object.fromEntries(Object.entries(sourceNames).map(([key, name]) => [`xtendrmt/${name}.js`, modules[key]]));
    runtimeModuleApis['components/xsurfacemanager-controller.js'] = modules.surfaceController;
    const root = document.createElement('main'); document.body.append(root); const previous = xtendState.snapshot().data;
    const composition = createMaracaBrowserCompositionRoot({ ...plan, schema: 'xtend.maraca.bundle-report.v1', components: plan.components.selected }, {
      documentTarget: document, windowTarget: document.defaultView, platformTarget: document.defaultView, runtimeModuleApis,
      componentImporters: Object.fromEntries(plan.components.selected.filter(entry => entry.native).map(entry => [entry.tag, () => Promise.resolve(entry.tag)])),
      createPlanRuntime: createMaracaPlanRuntime });
    try {
      await composition.boot({ root, stateProjectionTarget: xtendState, xtensionBindingsRuntime: bindingRuntime,
        dataSourceAdapters: { rest: createRepeatedDataSourceAdapter() },
        createXTensionHost(context) { return createReactRuntimeAdapter({ ...context, component, peers: { React, ReactDOM }, policy: { events: context.events } }); } });
      equal(composition.facade.getXTensionBindings().length, 3, 'composition creates all typed scopes');
      const input = root.querySelector('input'); input.value = 'composition'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
      await within(composition.facade.whenXTensionsIdle());
      equal(root.querySelector('output').textContent, 'composition:-', 'controlled Action loop works through the composition root');
    } finally { composition.dispose(); await composition.facade.whenXTensionsIdle(); root.remove(); xtendState.clear(); xtendState.batchUpdate(previous); }
  });

}
module.exports = { runRepeatedStateBindingAcceptance };
