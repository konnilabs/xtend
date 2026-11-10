'use strict';

const { createXTensionStateRegistry, validateStateBinding } = require('@ccslabs/xtend/xtensions/state-binding');
const { createReactRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { filterBinding, filterModelOptions, createFilterPanel } = require('../../development/rmtx-a02/controlled-filters');

// Runs unchanged in jsdom and Chromium alongside actual adapter acceptance.
async function runStateBindingAcceptance({ React, ReactDOM, document, test, check, equal }) {
  const { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const { createRmtStateHostAdapter } = await import('../../xtendrmt/rmt-state-host-adapter.js');
  const { xtendState } = await import('../../components/xtend-state.js');
  const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
  const rejects = async (fn, label) => { let caught = false; try { await fn(); } catch { caught = true; } check(caught, label); };
  const within = async (promise) => {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Binding operation did not settle.')), 1200); })]); }
    finally { clearTimeout(timer); }
  };
  function fixture(beforeRegistry) {
    const previous = xtendState.snapshot().data;
    const model = createRmtStateSelectorRuntime({ ...filterModelOptions(), stateProjectionTarget: xtendState,
      createStateProjectionPort: createRmtStateHostAdapter, strictMaraca: true });
    const stop = beforeRegistry?.(model);
    const diagnostics = [], nodes = [], handles = [];
    const registry = createXTensionStateRegistry({ modelReader: model.modelReader, modelCommandPort: model.modelCommandPort,
      onDiagnostic: (item) => diagnostics.push(item) });
    function bind(key, extra = {}, declaration = filterBinding(key)) {
      const container = document.createElement('section'); document.body.append(container); nodes.push(container);
      let host, context;
      const binding = registry.bind(declaration, (input) => {
        context = input;
        host = createReactRuntimeAdapter({ container, component: createFilterPanel(React), peers: { React, ReactDOM }, ...extra,
          hostId: input.hostId, surfaceId: input.surfaceId, xtensionId: input.xtensionId,
          policy: { ...extra.policy, events: input.events }, onEvent: input.onEvent });
        return extra.wrapHost ? extra.wrapHost(host) : host;
      });
      const handle = { binding, host, context, container }; handles.push(handle); return handle;
    }
    const intent = (handle, payload, overrides = {}) => handle.context.onEvent({ ok: true, direction: 'upstream', event: 'change',
      source: { hostId: handle.context.hostId, surfaceId: handle.context.surfaceId, xtensionId: handle.context.xtensionId },
      payloadSchema: handle.context.events.change, payload, ...overrides });
    return { model, registry, diagnostics, bind, intent, async close() {
      stop?.(); await registry.dispose(); nodes.forEach((node) => node.remove()); xtendState.clear(); xtendState.batchUpdate(previous);
    } };
  }

  await test('A02: two real React instances isolate Model, deep State projection, props and return intents', async () => {
    const f = fixture();
    try {
      const a = f.bind('left'), b = f.bind('right');
      await Promise.all([a.binding.mount(), b.binding.mount()]);
      const commits = [];
      const unsubscribe = f.model.modelReader.subscribe((change) => {
        equal(xtendState.get('filter_left'), change.next.states['filter.left'], 'State projection precedes binding delivery');
        commits.push(change);
      });
      try {
        const input = a.container.querySelector('input'); input.value = 'changed';
        input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
        await a.binding.whenIdle(); await b.binding.whenIdle();
        equal(commits.length, 1, 'one intent produces one transactional Model commit');
        equal(f.model.getState('filter.left').query, 'changed', 'left Model is authoritative');
        equal(xtendState.getPath('filter_left.query'), 'changed', 'deep State path shares the committed value');
        equal(a.container.querySelector('output').textContent, 'changed:-', 'controlled React props follow the commit');
        equal(b.container.querySelector('output').textContent, 'right:-', 'other instance is unaffected');
        f.model.modelCommandPort.apply([
          { operation: 'set', state: 'filter.left', value: { query: 'batch', selection: { activeId: '42' } } },
          { operation: 'set', state: 'filter.right', value: { query: 'other', selection: { activeId: '43' } } }
        ]);
        await Promise.all([a.binding.whenIdle(), b.binding.whenIdle()]);
        equal(commits.length, 2, 'multi-state changes retain one commit');
        equal(a.binding.snapshot().props, { query: 'batch', activeId: '42' }, 'complete props use one snapshot');
        equal(xtendState.getPath('filter_left.selection.activeId'), '42', 'nested selection is projected');
        // Moving keyed containers preserves logical identity and existing React roots.
        const identity = a.binding.identity; document.body.append(a.container);
        check(a.binding.identity === identity && a.container.querySelector('input') === input, 'reorder preserves identity and DOM');
      } finally { unsubscribe(); }
    } finally { await f.close(); }
  });
  await test('A02: duplicate addresses fail; structural keys avoid collisions and distinguish numeric keys', async () => {
    const f = fixture();
    try {
      const a = f.bind('left');
      equal(f.registry.apiVersion, '2.4.0', 'extended registry API is explicitly versioned');
      const legacyDeclaration = filterBinding('left'); legacyDeclaration.address.keys = ['legacy-host'];
      await rejects(() => f.bind('left', { wrapHost: (host) => ({ ...host,
        schema: require('../../tools/xtensions/host-controller-contract').XTENSIONS_HOST_CONTROLLER_SCHEMA, apiVersion: '1.0.0'
      }) }, legacyDeclaration), 'Legacy host API cannot impersonate the asynchronous v2 runtime host');
      await rejects(() => f.bind('left'), 'duplicate address is rejected before creating a second host');
      const other = (keys) => ({ ...filterBinding('left'), address: { ...filterBinding('left').address, keys } });
      const keys = [['a.b'], ['a', 'b'], [1], ['1']].map((segments) => f.bind('left', {}, other(segments)).binding.identity.key);
      equal(new Set([a.binding.identity.key, ...keys]).size, 5, 'tuple keys retain boundaries and types');
    } finally { await f.close(); }
  });
  await test('A02: reentrant Model commits cannot replay an older snapshot over a newer one', async () => {
    let nested = false;
    const f = fixture((model) => model.modelReader.subscribe(() => {
      if (nested) return; nested = true;
      model.setState('filter.left', { query: 'newer', selection: { activeId: 'newer' } });
    }));
    try {
      const a = f.bind('left'); await a.binding.mount();
      f.model.setState('filter.left', { query: 'older', selection: { activeId: null } }); await a.binding.whenIdle();
      equal(a.binding.snapshot().props, { query: 'newer', activeId: 'newer' }, 'reentrant final Model snapshot wins');
      equal(xtendState.getPath('filter_left.query'), 'newer', 'State projection and props remain consistent');
    } finally { await f.close(); }
  });
  await test('A02: undeclared, forged, extra-field and mistyped nested intents never reach the Model', async () => {
    const f = fixture();
    try {
      const a = f.bind('left'); await a.binding.mount();
      const before = f.model.snapshot();
      for (const payload of [{ filter: { query: 3, selection: { activeId: null } } },
        { filter: { query: 'bad', selection: { activeId: [] } } },
        { filter: { query: 'bad', selection: { activeId: null }, injected: true } },
        { filter: { query: 'bad', selection: { activeId: null } }, command: 'other' }]) {
        check(!f.intent(a, payload), 'typed intent rejected');
      }
      const valid = { filter: { query: 'valid', selection: { activeId: null } } };
      check(!f.intent(a, valid, { event: 'missing' }), 'undeclared intent rejected');
      check(!f.intent(a, valid, { source: { xtensionId: 'forged' } }), 'forged source rejected');
      equal(f.model.snapshot(), before, 'invalid intents produce no Model mutation');
      check(f.intent(a, valid), 'valid intent accepted'); await a.binding.whenIdle();
      equal(a.container.querySelector('output').textContent, 'valid:-', 'rejection does not poison the instance');
    } finally { await f.close(); }
  });
  await test('A02: loading coalesces commits and mount settles only after latest props catch up', async () => {
    const f = fixture(), load = deferred();
    try {
      const a = f.bind('left', { loadRuntime: () => load.promise });
      const mounting = a.binding.mount(); await Promise.resolve();
      for (const query of ['intermediate', 'latest']) f.model.setState('filter.left', { query, selection: { activeId: query } });
      load.resolve({ React, ReactDOM }); await within(mounting);
      equal(a.binding.snapshot().props, { query: 'latest', activeId: 'latest' }, 'latest complete snapshot delivered before readiness');
      equal(a.container.querySelector('output').textContent, 'latest:latest', 'actual React catches up');
      equal(a.host.getLifecycleRecords().filter((item) => item.operation === 'update').length, 1, 'intermediate loading commits coalesced');
    } finally { await f.close(); }
  });
  await test('A02: suspension retains latest commit and resumes props before cooperative resources', async () => {
    const f = fixture(), starts = [];
    function ResourcePanel({ query, activeId, xtension }) {
      React.useLayoutEffect(() => xtension.resources.register('probe', () => { starts.push(document.querySelector('[data-a02-resource]')?.textContent); return () => {}; }), []);
      return React.createElement('output', { 'data-a02-resource': '' }, `${query}:${activeId}`);
    }
    try {
      const a = f.bind('left', { component: ResourcePanel, policy: { allowedResources: ['probe'] } }); await a.binding.mount();
      await a.binding.suspend();
      const old = a.container.textContent;
      for (const query of ['one', 'two']) f.model.setState('filter.left', { query, selection: { activeId: query } });
      await a.binding.whenIdle(); equal(a.container.textContent, old, 'no rendering while suspended');
      check(!f.intent(a, { filter: { query: 'late', selection: { activeId: null } } }), 'suspended intent rejected');
      await a.binding.resume();
      equal(starts, ['left:null', 'two:two'], 'resource restarts after latest suspended props commit');
      equal(a.binding.snapshot().deliveredRevision, a.binding.snapshot().desiredRevision, 'resume caught up');
    } finally { await f.close(); }
  });
  await test('A02: commits arriving during async delivery retain the latest full snapshot', async () => {
    const f = fixture(), gate = deferred(); let entered = false;
    try {
      const b = f.bind('right', { wrapHost: (host) => ({ ...host,
        async update(signal) { entered = true; await gate.promise; return host.update(signal); }
      }) });
      await b.binding.mount();
      f.model.setState('filter.right', { query: 'middle', selection: { activeId: null } });
      await Promise.resolve(); check(entered, 'delivery entered');
      f.model.setState('filter.right', { query: 'final', selection: { activeId: 'final' } });
      gate.resolve(); await within(b.binding.whenIdle());
      equal(b.binding.snapshot().props, { query: 'final', activeId: 'final' }, 'async delivery uses latest snapshot');
    } finally { gate.resolve(); await f.close(); }
  });
  await test('A02: disposing a pending load settles promptly and old incarnation cannot affect replacement', async () => {
    const f = fixture(), load = deferred();
    try {
      const old = f.bind('left', { loadRuntime: () => load.promise }); const pending = old.binding.mount(); await Promise.resolve();
      await within(old.binding.dispose()); await within(pending);
      const next = f.bind('left'); await next.binding.mount();
      equal(next.binding.identity.key, old.binding.identity.key, 'logical address survives replacement');
      check(next.binding.identity.incarnation > old.binding.identity.incarnation, 'replacement has a fresh lifetime token');
      check(!f.intent(old, { filter: { query: 'stale', selection: { activeId: null } } }), 'late old callback rejected');
      load.resolve({ React, ReactDOM }); await Promise.resolve();
      equal(next.container.querySelector('output').textContent, 'left:-', 'old loader cannot resurrect or update replacement');
    } finally { load.resolve({ React, ReactDOM }); await f.close(); }
  });
  await test('A02: missing or invalid controlled slices fail closed and detach the subscriber', async () => {
    const f = fixture();
    try {
      const a = f.bind('left'); await a.binding.mount();
      f.model.setState('filter.left', { query: 8, selection: { activeId: null } });
      await rejects(() => a.binding.whenIdle(), 'invalid controlled type observable');
      await within(a.binding.dispose());
      equal(a.binding.snapshot().phase, 'failed', 'binding remains visibly failed');
      check(a.host.snapshot().disposed, 'invalid slice tears down host');
      f.model.setState('filter.left', { query: 'restored', selection: { activeId: null } });
      const next = f.bind('left'); await next.binding.mount();
      equal(next.binding.snapshot().props.query, 'restored', 'a fresh incarnation can recover');
    } finally { await f.close(); }
  });
  await test('A02: render-time emissions do not echo Model-driven props back as commands', async () => {
    const f = fixture(); let commits = 0;
    const unsubscribe = f.model.modelReader.subscribe(() => commits++);
    function EchoPanel({ query, activeId, xtension }) {
      const first = React.useRef(true);
      React.useLayoutEffect(() => {
        if (first.current) { first.current = false; return; }
        xtension.emit({ type: 'change', payload: { filter: { query: `${query}!`, selection: { activeId } } } });
      }, [query]);
      return React.createElement('output', null, query);
    }
    try {
      const a = f.bind('left', { component: EchoPanel }); await within(a.binding.mount());
      equal(commits, 0, 'initial delivery does not echo');
      f.model.setState('filter.left', { query: 'host', selection: { activeId: null } }); await within(a.binding.whenIdle());
      equal(commits, 1, 'controlled update does not dispatch an echo command');
      equal(a.container.textContent, 'host', 'props remain Model-owned');
    } finally { unsubscribe(); await f.close(); }
  });
  await test('A02: JSON declarations reject authority, unsupported versions, accessors and unsafe paths', async () => {
    const cases = [];
    const change = (fn) => { const value = filterBinding('left'); fn(value); cases.push(value); };
    change((value) => { value.schema += '.unsupported'; });
    change((value) => { value.onEvent = () => {}; });
    change((value) => { value.props.xtension = value.props.query; });
    change((value) => { value.props.query.path = ['constructor']; });
    change((value) => { value.address.keys = [-0]; });
    change((value) => { value.address.keys = new Array(1); });
    change((value) => { Object.defineProperty(value.props.query, 'state', { enumerable: true, get() { throw new Error('Accessor must not execute'); } }); });
    for (const value of cases) await rejects(() => validateStateBinding(value), 'invalid declaration rejected');
    const value = validateStateBinding(filterBinding('left'));
    check(Object.isFrozen(value) && Object.isFrozen(value.props.query.path), 'validated declarations are deeply immutable');
  });
  await test('A02: registry disposal unsubscribes once, closes every host and prevents further binding', async () => {
    const f = fixture();
    const a = f.bind('left'), b = f.bind('right'); await Promise.all([a.binding.mount(), b.binding.mount()]);
    const first = f.registry.dispose(); check(first === f.registry.dispose(), 'registry disposal is single-flight'); await first;
    check(a.host.snapshot().disposed && b.host.snapshot().disposed, 'all owned hosts disposed');
    await rejects(() => f.bind('left'), 'closed registry rejects new bindings'); await f.close();
  });
}
module.exports = { runStateBindingAcceptance };
