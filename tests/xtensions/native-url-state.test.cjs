'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const url = require('../../tools/xtensions/url-state');
const port = url.NATIVE_URL_STATE_RUNTIME;
const copy = value => structuredClone(value);
const path = (symbol, parts = [], root = 'state') => ({ kind: 'path', root, symbol, path: parts });
function inputs() {
  const state = { items: [{ id: 1, value: 'numeric', private: 'secret-number' }, { id: '1', value: 'textual', private: 'secret-string' }] };
  const program = { schema: 'xtend.rmt.app-orchestration.v3', state: { states: [{ id: 'catalog', initial: state }], selectors: [{ id: 'selected' }] },
    actions: { actions: [], inputContract: { schema: 'xtend.rmt.action-input-contract.v1', actions: [] } }, surfaces: [{ id: 'target' }],
    render: { nativeView: { schema: 'xtend.rmt.native-view.v1', documentId: 'document', surfaces: [] },
      root: { type: 'element', key: 'root', children: [{ type: 'element', key: 'target', surface: 'target' }] } } };
  const bindings = { schema: 'xtend.xtensions.state-binding-artifact.v5', documentId: 'document', bindings: [{ surface: 'target',
    repeat: [{ state: 'catalog', path: ['items'], key: ['id'] }], binding: { schema: 'xtend.xtensions.state-binding.v3',
      address: { documentId: 'document', declarationId: 'host', keys: [] },
      props: { value: { type: 'string', projection: path('catalog', ['items', { repeat: 0 }, 'value']) } }, intents: {} } }] };
  const policy = { schema: 'xtend.xtensions.url-state-policy.v2', id: 'public', version: 1, documentId: 'document', exposure: 'public-url',
    fields: [{ id: 'value', surface: 'target', prop: 'value', default: '' }], limits: { tokenBytes: 4096, entries: 32, valueBytes: 512, instances: 128 } };
  return { program, bindings, policy, state };
}
function projected(f) {
  const source = copy({ program: f.program, bindings: f.bindings, policy: f.policy, state: f.state }); source.program.schema = 'xtend.rmt.app-orchestration.v2'; delete source.program.render.nativeView;
  source.bindings.schema = 'xtend.xtensions.state-binding-artifact.v4'; return source;
}
async function fixture() {
  const f = inputs(), { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const model = createRmtStateSelectorRuntime({ states: f.program.state.states });
  const contract = port.createURLStateContract(f.policy, f);
  const control = { navigation: 'n1', current: true, committed: true };
  const lifetime = { navigationId: () => control.navigation, isCurrent: () => control.current, isViewCommitted: () => control.committed };
  return { ...f, model, contract, control, lifetime };
}
const entry = (key, value) => ({ declarationId: 'host', keys: [key], values: { value } });
const snapshot = entries => ({ schema: 'xtend.xtensions.url-state.v2', documentId: 'document', policyId: 'public', policyVersion: 1, entries });
test('native URL capability3 is explicit, frozen, and keeps legacy/projection profile pairs closed', () => {
  assert.equal(url.API_VERSION, '1.0.0'); assert.equal(url.PROJECTION_URL_STATE_RUNTIME.API_VERSION, '2.0.0');
  assert.equal(url.NATIVE_URL_STATE_API_VERSION, '3.0.0'); assert.equal(port.API_VERSION, '3.0.0'); assert(Object.isFrozen(port));
  const f = inputs(), old = projected(f), native = port.createURLStateContract(f.policy, f);
  assert.equal(native.apiVersion, '3.0.0'); assert(Object.isFrozen(native));
  assert.equal(url.PROJECTION_URL_STATE_RUNTIME.createURLStateContract(old.policy, old).apiVersion, '2.0.0');
  for (const value of [old, { ...f, program: old.program }, { ...f, bindings: old.bindings }])
    assert.throws(() => port.createURLStateContract(f.policy, value), /versioned Model\/binding/);
  for (const value of [f, { ...old, program: f.program }, { ...old, bindings: f.bindings }])
    assert.throws(() => url.PROJECTION_URL_STATE_RUNTIME.createURLStateContract(f.policy, value), /versioned Model\/binding/);
  assert.throws(() => url.createURLStateContract({ ...f.policy, schema: 'xtend.xtensions.url-state-policy.v1' }, f), /versioned Model\/binding/);
  assert.throws(() => port.createURLStateContract({ ...f.policy, schema: 'xtend.xtensions.url-state-policy.v1' }, f), /Unsupported policy/);
});
test('native and projection capabilities produce identical URL2 wires for the same logical state', async () => {
  const f = await fixture(), old = projected(f), previous = url.PROJECTION_URL_STATE_RUNTIME.createURLStateContract(f.policy, old);
  const captured = f.contract.capture(f.model.snapshot()), token = f.contract.encode(captured);
  assert.deepEqual(captured, previous.capture(f.model.snapshot())); assert.equal(token, previous.encode(captured)); assert(token.startsWith('2.'));
  assert.deepEqual(f.contract.decode(token), previous.decode(token)); assert.deepEqual(captured.entries.map(row => row.keys), [['1'], [1]]);
  assert.equal(port.readQuery, url.PROJECTION_URL_STATE_RUNTIME.readQuery); assert.equal(port.withToken, url.PROJECTION_URL_STATE_RUNTIME.withToken);
  assert(!port.canonical(captured).includes('secret')); assert(!port.canonical(captured).includes('private'));
  const reordered = copy(f.state); reordered.items.reverse(); assert.equal(f.contract.encode(f.contract.capture({ states: { catalog: reordered } })), token);
  assert.deepEqual(f.contract.decode(f.contract.encode(snapshot([entry(1, '')]))).entries, []);
  assert.throws(() => f.contract.decode(token.replace(/^2\./, '3.'))); assert.throws(() => f.contract.decode(token.replace(/^2\./, '1.')));
});
test('native restore commits typed keys atomically through the original Model port and keeps URL2 provenance', async () => {
  const f = await fixture(), token = f.contract.encode(snapshot([entry(1, 'changed-number'), entry('1', 'changed-string')]));
  const plan = f.contract.planRestore(token, f.model.snapshot(), { navigationId: 'n1' });
  assert.equal(plan.schema, 'xtend.xtensions.url-state-restore-plan.v2'); assert.equal(plan.changes.length, 2);
  let notifications = 0, calls = 0, metadata;
  const unsubscribe = f.model.modelReader.subscribe(() => notifications++);
  const ports = { modelReader: f.model.modelReader, modelCommandPort: { schema: 'xtend.rmt.model-command-port.v1', apply(operations, info) {
    calls++; metadata = info; return f.model.modelCommandPort.apply(operations, info);
  } } };
  assert.equal(f.contract.applyRestore(plan, ports, f.lifetime), true); assert.equal(calls, 1); assert.equal(notifications, 1); unsubscribe();
  assert.deepEqual(metadata, { source: 'xtension-url-restore', policyId: 'public', policyVersion: 1, navigationId: 'n1' });
  assert.deepEqual(f.model.getState('catalog').items, [{ id: 1, value: 'changed-number', private: 'secret-number' }, { id: '1', value: 'changed-string', private: 'secret-string' }]);
  assert.throws(() => f.contract.applyRestore(plan, ports, f.lifetime), /consumed/);
});
test('native restore retains deferred missing-key and stable reordering behavior without partial writes', async () => {
  const f = await fixture(), token = f.contract.encode(snapshot([entry(1, 'known'), entry('future', 'late')]));
  const deferred = f.contract.planRestore(token, f.model.snapshot(), { navigationId: 'n1' }), before = copy(f.model.snapshot().states);
  assert.equal(deferred.status, 'deferred'); assert.deepEqual(deferred.changes, []);
  assert.throws(() => f.contract.applyRestore(deferred, f.model, f.lifetime), /no partial/); assert.deepEqual(f.model.snapshot().states, before);
  const next = copy(f.state); next.items.push({ id: 'future', value: '', private: 'future-secret' }); next.items.reverse(); f.model.setState('catalog', next);
  const plan = f.contract.planRestore(token, f.model.snapshot(), { navigationId: 'n1' });
  f.contract.applyRestore(plan, f.model, f.lifetime); assert.equal(f.model.getState('catalog').items[0].value, 'late'); assert.equal(f.model.getState('catalog').items[2].value, 'known');
});
test('native restore keeps navigation, abort, Model drift, serialization and contract-session fences', async () => {
  for (const invalidate of [f => { f.control.navigation = 'next'; }, f => { f.control.current = false; }, f => { const a = new AbortController(); a.abort(); f.lifetime.signal = a.signal; }, f => f.model.setState('catalog', { ...f.state, other: 'new' })]) {
    const f = await fixture(), plan = f.contract.planRestore(null, f.model.snapshot(), { navigationId: 'n1' }); invalidate(f);
    const before = copy(f.model.snapshot().states); assert.throws(() => f.contract.applyRestore(plan, f.model, f.lifetime)); assert.deepEqual(f.model.snapshot().states, before);
  }
  const f = await fixture(), plan = f.contract.planRestore(null, f.model.snapshot(), { navigationId: 'n1' });
  assert.throws(() => f.contract.applyRestore(copy(plan), f.model, f.lifetime));
  const old = projected(f), oldContract = url.PROJECTION_URL_STATE_RUNTIME.createURLStateContract(old.policy, old);
  const foreign = oldContract.planRestore(null, f.model.snapshot(), { navigationId: 'n1' });
  assert.throws(() => f.contract.applyRestore(foreign, f.model, f.lifetime), /untrusted/);
  f.contract.dispose(); assert.throws(() => f.contract.applyRestore(plan, f.model, f.lifetime), /disposed/);
});
test('native History still requires settled restore and the actual View/Props commit', async () => {
  const f = await fixture(); assert.throws(() => f.contract.proposeHistory(f.model.snapshot(), { cause: 'commit', currentToken: null, navigationId: 'n1' }), /not settled/);
  const token = f.contract.encode(f.contract.capture(f.model.snapshot())), plan = f.contract.planRestore(token, f.model.snapshot(), { navigationId: 'n1' });
  assert.equal(f.contract.applyRestore(plan, f.model, f.lifetime), false);
  const proposal = f.contract.proposeHistory(f.model.snapshot(), { cause: 'checkpoint', currentToken: null, navigationId: 'n1' });
  assert.equal(proposal.schema, 'xtend.xtensions.url-history-proposal.v2'); assert.equal(proposal.mode, 'push'); assert(proposal.token.startsWith('2.'));
  f.control.committed = false; assert.throws(() => f.contract.checkHistory(proposal, f.model.snapshot(), f.lifetime), /View\/Props commit/);
  f.control.committed = true; assert.equal(f.contract.checkHistory(proposal, f.model.snapshot(), f.lifetime), true);
  assert.throws(() => f.contract.checkHistory(proposal, f.model.snapshot(), f.lifetime), /superseded/);
});
test('native capability cannot turn computed, selector, omitted, default or nonscalar props into URL writers', () => {
  for (const projection of [{ kind: 'literal', value: 'default' }, path('selected', [], 'selector'), { kind: 'conditional', test: { kind: 'literal', value: true }, then: path('catalog', ['items', { repeat: 0 }, 'value']), else: { kind: 'literal', value: '' } }, { kind: 'binary', op: '+', left: { kind: 'literal', value: '' }, right: path('catalog', ['items', { repeat: 0 }, 'value']) }]) {
    const f = inputs(); f.bindings.bindings[0].binding.props.value.projection = projection;
    assert.throws(() => port.createURLStateContract(f.policy, f), /direct scalar Model path/);
  }
  const omitted = inputs(); delete omitted.bindings.bindings[0].binding.props.value;
  assert.throws(() => port.createURLStateContract(omitted.policy, omitted), /direct scalar Model path/);
  const object = inputs(); object.bindings.bindings[0].binding.props.value = { type: 'object', fields: { items: { type: 'json' } }, projection: path('catalog') };
  assert.throws(() => port.createURLStateContract(object.policy, object), /scalar controlled prop/);
});
test('native capability retains key-field, alias-write and accessor defenses', async () => {
  const key = inputs(); key.state.items = [key.state.items[0]];
  key.bindings.bindings[0].binding.props.value = { type: 'number', projection: path('catalog', ['items', { repeat: 0 }, 'id']) }; key.policy.fields[0].default = 0;
  assert.throws(() => port.createURLStateContract(key.policy, key).capture({ states: { catalog: key.state } }), /instance keys/);
  const alias = inputs(); alias.bindings.bindings[0].binding.props.alias = copy(alias.bindings.bindings[0].binding.props.value); alias.policy.fields.push({ id: 'alias', surface: 'target', prop: 'alias', default: '' });
  assert.throws(() => port.createURLStateContract(alias.policy, alias).capture({ states: { catalog: alias.state } }), /overlap/);
  for (const target of ['inputs', 'bindings', 'program']) {
    const f = inputs(); let calls = 0;
    Object.defineProperty(target === 'inputs' ? f : f[target], target === 'inputs' ? 'bindings' : 'schema', { enumerable: true, get() { calls++; throw new Error('must not execute'); } });
    assert.throws(() => port.createURLStateContract(f.policy, f), /accessor/); assert.equal(calls, 0);
  }
});

function routeFixture(mode = 'history') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><body></body>', { url: mode === 'hash' ? 'http://xtend.test/shell?locale=de#/filters?x=a+b&xtend-state=2.initial' : 'http://xtend.test/filters?locale=de&x=a%20b&xtend-state=2.initial#anchor' });
  const calls = [], control = { token: '2.changed', status: 'restored', owner: true, gate: null };
  // Actual Model/View/Framework acceptance belongs to the separate Source5 runner.
  const runtime = { async restoreURLState(token, lifetime) { calls.push({ kind: 'restore', token, lifetime }); if (control.gate) await control.gate; return { status: control.status }; },
    async publishURLState({ cause, currentToken, lifetime, write }) {
      calls.push({ kind: 'publish', cause, currentToken, lifetime }); if (!lifetime.isCurrent()) return { status: 'superseded' };
      const mode = currentToken === control.token || cause === 'traverse' ? 'none' : cause === 'checkpoint' ? 'push' : 'replace';
      if (mode !== 'none') write({ schema: 'xtend.xtensions.url-history-proposal.v2', mode, token: control.token }); return { status: 'published', mode };
    } };
  return { dom, win: dom.window, calls, control, runtime, async host(extra = {}) { const api = await import('../../components/xrouter-url-state.js');
    return api.createXRouterNativeURLStateHost({ runtime, codec: port, windowTarget: dom.window, mode, isOwnerCurrent: () => control.owner, ...extra }); } };
}
test('native route-host3 keeps both older host factories closed and retains their port shape', async () => {
  const api = await import('../../components/xrouter-url-state.js'), f = routeFixture();
  try {
    assert.equal(api.XROUTER_URL_STATE_API_VERSION, '1.0.0'); assert.equal(api.XROUTER_PROJECTION_URL_STATE_API_VERSION, '2.0.0'); assert.equal(api.XROUTER_NATIVE_URL_STATE_API_VERSION, '3.0.0');
    for (const factory of [api.createXRouterURLStateHost, api.createXRouterProjectionURLStateHost]) assert.throws(() => factory({ runtime: f.runtime, codec: port, windowTarget: f.win }), /codec/);
    for (const codec of [url, url.PROJECTION_URL_STATE_RUNTIME]) assert.throws(() => api.createXRouterNativeURLStateHost({ runtime: f.runtime, codec, windowTarget: f.win }), /v3 codec/);
    const host = await f.host(), old = api.createXRouterProjectionURLStateHost({ runtime: f.runtime, codec: url.PROJECTION_URL_STATE_RUNTIME, windowTarget: f.win });
    assert.equal(host.schema, 'xtend.router.url-state-host.v3'); assert.equal(host.apiVersion, '3.0.0'); assert(Object.isFrozen(host));
    assert.deepEqual(Object.keys(host).sort(), Object.keys(old).sort()); old.dispose(); host.dispose();
  } finally { f.dom.window.close(); }
});
for (const mode of ['history', 'hash']) test(`native ${mode} route host preserves route-owned bytes and URL2 History`, async () => {
  const f = routeFixture(mode), host = await f.host();
  try {
    f.win.history.replaceState({ unrelated: 'owned' }, '', f.win.location.href);
    assert.equal((await host.navigate('initialize')).status, 'restored'); assert.equal(f.calls[0].token, '2.initial');
    assert(f.win.location.href.includes(mode === 'hash' ? '?locale=de#/filters?x=a+b&xtend-state=2.changed' : '/filters?locale=de&x=a%20b&xtend-state=2.changed#anchor'));
    assert.deepEqual(f.win.history.state, { unrelated: 'owned' }); const count = f.win.history.length;
    f.control.token = '2.checkpoint'; await host.publish('checkpoint'); assert.equal(f.win.history.length, count + 1); await host.publish('checkpoint'); assert.equal(f.win.history.length, count + 1);
  } finally { host.dispose(); f.dom.window.close(); }
});
test('native route retirement and disposal revoke pending URL authority', async () => {
  const f = routeFixture(), host = await f.host({ listen: true });
  try {
    let release; f.control.gate = new Promise(resolve => { release = resolve; });
    const pending = host.navigate('initialize'), old = f.calls[0].lifetime;
    f.control.owner = false; release(); assert.equal((await pending).status, 'superseded'); assert.equal(old.isCurrent(), false);
    assert.equal(f.calls.filter(call => call.kind === 'publish').length, 0); assert.equal(host.dispose(), true); assert.equal(host.dispose(), false); assert(old.signal.aborted);
    const count = f.calls.length; f.win.dispatchEvent(new f.win.PopStateEvent('popstate')); await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(f.calls.length, count);
  } finally { host.dispose(); f.dom.window.close(); }
});
test('actual x-router selects native host3 while query navigation preserves content identity', async () => {
  const f = routeFixture(), saved = new Map();
  for (const key of ['window', 'document', 'HTMLElement', 'CustomEvent', 'customElements', 'history', 'location', 'xtendState']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'xtendState' ? { subscribe: () => () => {} } : f.win[key] });
  }
  let router, host;
  try {
    await import('../../components/xrouter.js?native-url-state-test'); router = f.win.document.createElement('x-router'); router.setAttribute('mode', 'history'); f.win.document.body.append(router);
    host = router.connectURLState(f.runtime, port); await host.whenIdle(); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(host.schema, 'xtend.router.url-state-host.v3'); assert.equal(host.apiVersion, '3.0.0');
    const content = f.win.document.createElement('input'); router.shadowRoot.querySelector('#outlet').append(content);
    assert.equal(router.navigate('/filters?locale=de&x=a%20b&xtend-state=2.router'), true); await host.whenIdle();
    assert.equal(f.calls.filter(call => call.kind === 'restore').at(-1).token, '2.router'); assert.equal(router.shadowRoot.querySelector('input'), content);
    router.remove(); assert.equal((await host.publish()).status, 'superseded');
  } finally {
    host?.dispose(); router?.remove(); f.dom.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});
