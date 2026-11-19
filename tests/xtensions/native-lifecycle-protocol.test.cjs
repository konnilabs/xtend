'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const native = require('../../tools/xtensions/native-view-projection');
const bindingsApi = require('../../tools/xtensions/state-binding');
const url = require('../../tools/xtensions/url-state');
const copy = value => structuredClone(value);
const path = (symbol, parts = []) => ({ kind: 'path', root: 'state', symbol, path: parts });
const literal = value => ({ op: 'literal', value });
function surface(id, component, children) {
  return { type: 'element', tag: component, key: id, surface: id,
    attributes: Object.fromEntries(Object.entries({ 'data-rmt-surface': id, 'data-maraca-surface': id,
      'data-rmt-primitive-id': id, 'data-rmt-component': component, 'data-maraca-kind': 'region' }).map(([key, value]) => [key, literal(value)])),
    ...(children === undefined ? {} : { children }) };
}
function fixture() {
  const state = { enabled: true, text: 'current', items: [{ id: 1, value: 'number', private: 'private-number' }, { id: '1', value: 'string', private: 'private-string' }] };
  const owner = surface('owner', 'section', [
    { type: 'text', nativeDeclarationId: 'native:text', value: { op: 'native-projection', projection: path('catalog', ['text']) } },
    surface('host', 'div')
  ]);
  const program = { schema: 'xtend.rmt.app-orchestration.v4',
    state: { states: [{ id: 'catalog', initial: state }], selectors: [] },
    actions: { actions: [], inputContract: { schema: 'xtend.rmt.action-input-contract.v1', actions: [] } },
    surfaces: [{ id: 'owner', component: 'section', kind: 'region' }, { id: 'host', component: 'div', kind: 'region' }],
    render: { nativeView: { schema: 'xtend.rmt.native-view.v1', documentId: 'document', surfaces: ['owner'] }, root: { type: 'fragment', children: [owner] } },
    lifecycle: { schema: 'xtend.rmt.native-lifecycle-plan.v1', documentId: 'document', sourceProfile: { syntax: 'rmtx', version: '6.0.0' }, viewProfile: { syntax: 'rmtx', version: '5.0.0' }, actionProfile: { syntax: 'rmtx', version: '4.0.0' },
      operations: [{ id: 'operation:document/owner/visible/0', astPointer: '/body/0/body/0/body/0', ownerSurface: 'owner', target: 'owner', op: 'mount', lane: 'visible', when: path('catalog', ['enabled']) }] }
  };
  const bindings = { schema: 'xtend.xtensions.state-binding-artifact.v6', documentId: 'document', bindings: [{ surface: 'host',
    repeat: [{ state: 'catalog', path: ['items'], key: ['id'] }], binding: { schema: 'xtend.xtensions.state-binding.v3',
      address: { documentId: 'document', declarationId: 'provider', keys: [] },
      props: { value: { type: 'string', projection: path('catalog', ['items', { repeat: 0 }, 'value']) } }, intents: {} } }] };
  const policy = { schema: 'xtend.xtensions.url-state-policy.v2', id: 'public', version: 1, documentId: 'document', exposure: 'public-url',
    fields: [{ id: 'value', surface: 'host', prop: 'value', default: '' }], limits: { tokenBytes: 4096, entries: 32, valueBytes: 512, instances: 128 } };
  return { state, program, bindings, policy, snapshot: { states: { catalog: state }, selectors: {} } };
}
function previous(f) {
  const result = copy(f); result.program.schema = 'xtend.rmt.app-orchestration.v3'; delete result.program.lifecycle;
  result.bindings.schema = 'xtend.xtensions.state-binding-artifact.v5'; return result;
}

test('Source6 projection API2 is separate and both Native program capabilities remain closed', () => {
  const f = fixture(), old = previous(f), port = native.NATIVE_LIFECYCLE_VIEW_RUNTIME;
  assert.equal(native.NATIVE_VIEW_PROJECTION_API_VERSION, '1.0.0');
  assert.equal(port.NATIVE_VIEW_PROJECTION_API_VERSION, '2.0.0'); assert.equal(port.API_VERSION, '2.0.0'); assert(Object.isFrozen(port));
  assert.throws(() => native.validateNativeViewProgram(f.program), /versioned/);
  assert.throws(() => port.validateNativeViewProgram(old.program), /versioned/);
  const validated = port.validateNativeViewProgram(f.program);
  assert.equal(validated.schema, 'xtend.rmt.app-orchestration.v4'); assert(Object.isFrozen(validated.lifecycle.operations));
  assert.deepEqual(port.materializeNativeView(validated, f.snapshot), native.materializeNativeView(old.program, old.snapshot));
});

test('guard and authoritative parent restriction filter complete Surface subtrees before sink evaluation', () => {
  const f = fixture(), port = native.NATIVE_LIFECYCLE_VIEW_RUNTIME;
  f.state.enabled = false; delete f.state.text;
  // A hidden branch must not attempt to read a currently unavailable text sink.
  assert.deepEqual(port.materializeNativeView(f.program, f.snapshot).children, []);
  f.state.enabled = true;
  assert.deepEqual(port.materializeNativeView(f.program, f.snapshot, undefined, { owner: false }).children, []);
  assert.throws(() => port.materializeNativeView(f.program, f.snapshot), /missing|path|unavailable/i);
  f.state.text = 'latest';
  const rendered = port.materializeNativeView(f.program, f.snapshot);
  assert.equal(rendered.children[0].children[0].text.value, 'latest');
  assert.equal(rendered.children[0].children[1].surface, 'host');
  f.state.enabled = false;
  assert.deepEqual(port.materializeNativeView(f.program, f.snapshot, undefined, { owner: true, host: true }).children, []);
});

test('bad guard values, accessors and malformed plan provenance are rejected before projection', () => {
  const port = native.NATIVE_LIFECYCLE_VIEW_RUNTIME;
  for (const enabled of [undefined, null, 0, 'true', {}, []]) {
    const f = fixture(); if (enabled === undefined) delete f.state.enabled; else f.state.enabled = enabled;
    assert.throws(() => port.materializeNativeView(f.program, f.snapshot), TypeError);
  }
  for (const mutate of [
    p => { p.lifecycle.documentId = 'other'; }, p => { p.lifecycle.viewProfile.version = '6.0.0'; },
    p => { p.lifecycle.operations[0].target = 'host'; }, p => { p.lifecycle.operations[0].op = 'resume'; }
  ]) { const f = fixture(); mutate(f.program); assert.throws(() => port.validateNativeViewProgram(f.program), TypeError); }
  const f = fixture(); let calls = 0;
  Object.defineProperty(f.state, 'enabled', { enumerable: true, get() { calls++; return true; } });
  assert.throws(() => port.materializeNativeView(f.program, f.snapshot), /accessor/); assert.equal(calls, 0);
});

test('lifecycle admission reads only own restrictions and supports ordinary Object prototype names', () => {
  const { nativeLifecycleAdmission } = require('../../tools/xtensions/native-lifecycle');
  const f = fixture(); let inheritedReads = 0;
  const previousOwner = Object.getOwnPropertyDescriptor(Object.prototype, 'owner');
  Object.defineProperty(Object.prototype, 'owner', { configurable: true, get() { inheritedReads++; throw new Error('inherited owner restriction'); } });
  try {
    const admitted = nativeLifecycleAdmission(f.program, f.snapshot, {});
    assert.equal(admitted.owner, true); assert.equal(admitted.host, true);
  } finally { if (previousOwner) Object.defineProperty(Object.prototype, 'owner', previousOwner); else delete Object.prototype.owner; }
  assert.equal(inheritedReads, 0);
  const named = fixture(), wrapper = named.program.render.root.children[0];
  named.program.surfaces[0].id = 'toString'; named.program.render.nativeView.surfaces = ['toString'];
  wrapper.key = wrapper.surface = 'toString';
  for (const key of ['data-rmt-surface', 'data-maraca-surface', 'data-rmt-primitive-id']) wrapper.attributes[key].value = 'toString';
  named.program.lifecycle.operations[0].ownerSurface = named.program.lifecycle.operations[0].target = 'toString';
  const admitted = nativeLifecycleAdmission(named.program, named.snapshot);
  assert.equal(Object.hasOwn(admitted, 'toString'), true); assert.equal(admitted.toString, true); assert.equal(admitted.host, true);
});

test('BindingArtifact6 is exact Program4 and retains independently typed host keys and Binding3', () => {
  const f = fixture(), old = previous(f);
  assert.equal(bindingsApi.LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA, 'xtend.xtensions.state-binding-artifact.v6');
  assert.throws(() => bindingsApi.validateStateBindingArtifact(f.bindings, f.program), /Unsupported/);
  assert.throws(() => bindingsApi.validateLifecycleStateBindingArtifact(old.bindings, old.program), /Unsupported/);
  const artifact = bindingsApi.validateLifecycleStateBindingArtifact(f.bindings, f.program);
  const rows = bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot);
  assert.deepEqual(rows.map(row => row.binding.address.keys), [[1], ['1']]);
  assert.notEqual(rows[0].hostSurface, rows[1].hostSurface);
  assert(rows.every(row => row.binding.schema === 'xtend.xtensions.state-binding.v3'));
  assert.throws(() => bindingsApi.validateLifecycleStateBindingArtifact(f.bindings, old.program), /orchestration/);
  assert.throws(() => bindingsApi.validateStateBindingArtifact(old.bindings, f.program), /orchestration/);
  const malformed = copy(f); malformed.program.lifecycle.actionProfile.version = '6.0.0';
  assert.throws(() => bindingsApi.validateLifecycleStateBindingArtifact(malformed.bindings, malformed.program), /Action4/);
  const negative = copy(f); negative.bindings.bindings[0].binding.props.value = { type: 'number', projection: { kind: 'literal', value: -0 } };
  assert.throws(() => bindingsApi.validateLifecycleStateBindingArtifact(negative.bindings, negative.program), /negative zero/);
});

test('Artifact6 skips denied host collections and props before expansion while active data remains validated', () => {
  const f = fixture(); f.state.enabled = false; f.state.items = null;
  // Schema/intent/key-path structure is still validated; inactive dynamic data
  // is interpreted only after the actual Model snapshot admits its owner.
  const artifact = bindingsApi.validateLifecycleStateBindingArtifact(f.bindings, f.program);
  assert.deepEqual(bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot, { owner: false, host: false }), []);
  assert.throws(() => bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot, { host: true }), /Model arrays/);
  f.state.items = [{ id: 1, value: 7 }];
  assert.deepEqual(bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot, { host: false }), []);
  assert.throws(() => bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot, { host: true }), /declared type/);
  assert.throws(() => bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot, { host: 'false' }), /boolean/);
  let inheritedReads = 0;
  const previousHost = Object.getOwnPropertyDescriptor(Object.prototype, 'host');
  Object.defineProperty(Object.prototype, 'host', { configurable: true, get() { inheritedReads++; throw new Error('inherited admission getter'); } });
  try { assert.throws(() => bindingsApi.materializeStateBindingArtifact(artifact, f.snapshot, {}), /declared type/); }
  finally { if (previousHost) Object.defineProperty(Object.prototype, 'host', previousHost); else delete Object.prototype.host; }
  assert.equal(inheritedReads, 0);
  const old = previous(f); old.state.items = []; old.program.state.states[0].initial = old.state;
  const oldArtifact = bindingsApi.validateStateBindingArtifact(old.bindings, old.program);
  assert.throws(() => bindingsApi.materializeStateBindingArtifact(oldArtifact, { states: { catalog: old.state } }, { host: false }), /artifact6/);
});

test('Registry5 preserves the older Registry4 capability and rejects unsafe Model data before subscription', async () => {
  const snapshot = { states: { value: 'current' }, selectors: {} }; let subscriptions = 0;
  const options = { modelReader: { snapshot: () => snapshot, subscribe: () => { subscriptions++; return () => {}; } }, modelCommandPort: { apply() {} } };
  const current = bindingsApi.createXTensionLifecycleStateRegistry(options), old = bindingsApi.createXTensionNativeStateRegistry(options);
  try {
    assert.equal(current.apiVersion, '5.0.0'); assert.equal(old.apiVersion, '4.0.0'); assert.equal(subscriptions, 2);
    let hosts = 0;
    assert.throws(() => current.bind({ schema: 'xtend.xtensions.state-binding.v3',
      address: { documentId: 'document', declarationId: 'host', keys: [] },
      props: { value: { type: 'number', projection: { kind: 'literal', value: -0 } } }, intents: {}
    }, () => { hosts++; throw new Error('must not create'); }), /negative zero/);
    assert.equal(hosts, 0);
  }
  finally { await current.dispose(); await old.dispose(); }
  snapshot.states.value = -0;
  assert.throws(() => bindingsApi.createXTensionLifecycleStateRegistry(options), /negative zero/); assert.equal(subscriptions, 2);
});

test('URL capability4 accepts only Program4/Binding6 while preserving URL2 token bytes and typed keys', () => {
  const f = fixture(), old = previous(f), port = url.LIFECYCLE_URL_STATE_RUNTIME;
  assert.equal(port.API_VERSION, '4.0.0'); assert(Object.isFrozen(port));
  const current = port.createURLStateContract(f.policy, f), previousContract = url.NATIVE_URL_STATE_RUNTIME.createURLStateContract(old.policy, old);
  try {
    assert.equal(current.apiVersion, '4.0.0');
    const captured = current.capture(f.snapshot), token = current.encode(captured);
    assert.equal(token, previousContract.encode(previousContract.capture(old.snapshot))); assert(token.startsWith('2.'));
    assert.deepEqual(current.decode(token).entries.map(entry => entry.keys), [['1'], [1]]);
    assert(!JSON.stringify(captured).includes('private-'));
    for (const input of [old, { ...f, program: old.program }, { ...f, bindings: old.bindings }])
      assert.throws(() => port.createURLStateContract(f.policy, input), /versioned Model\/binding/);
    assert.throws(() => url.NATIVE_URL_STATE_RUNTIME.createURLStateContract(f.policy, f), /versioned Model\/binding/);
  } finally { current.dispose(); previousContract.dispose(); }
});

test('URL4 restores independently typed keys through the actual atomic Model writer', async () => {
  const f = fixture(), { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const model = createRmtStateSelectorRuntime({ states: f.program.state.states });
  const contract = url.LIFECYCLE_URL_STATE_RUNTIME.createURLStateContract(f.policy, f);
  try {
    const captured = copy(contract.capture(model.snapshot()));
    captured.entries.find(entry => typeof entry.keys[0] === 'number').values.value = 'updated-number';
    captured.entries.find(entry => typeof entry.keys[0] === 'string').values.value = 'updated-string';
    const plan = contract.planRestore(contract.encode(captured), model.snapshot(), { navigationId: 'navigation' });
    assert.equal(contract.applyRestore(plan, { modelReader: model.modelReader, modelCommandPort: model.modelCommandPort },
      { navigationId: () => 'navigation', isCurrent: () => true, isViewCommitted: () => true }), true);
    assert.deepEqual(model.snapshot().states.catalog.items, [
      { id: 1, value: 'updated-number', private: 'private-number' }, { id: '1', value: 'updated-string', private: 'private-string' }
    ]);
    assert.equal(model.snapshot().states.catalog.enabled, true);
  } finally { contract.dispose(); }
});

test('Router4 owns the existing URL2 route lifetime and rejects every older codec', async () => {
  const { JSDOM } = require('jsdom'), api = await import('../../components/xrouter-url-state.js');
  const dom = new JSDOM('<!doctype html>', { url: 'https://xtend.test/products?keep=a%20b&xtend-state=2.old#anchor' });
  let release; const gate = new Promise(resolve => { release = resolve; }), calls = [];
  const runtime = { async restoreURLState(token, lifetime) { calls.push({ token, lifetime }); await gate; return { status: 'restored' }; },
    async publishURLState({ write }) { write({ mode: 'replace', token: '2.new' }); return { status: 'published' }; } };
  let host;
  try {
    for (const codec of [url, url.PROJECTION_URL_STATE_RUNTIME, url.NATIVE_URL_STATE_RUNTIME])
      assert.throws(() => api.createXRouterLifecycleURLStateHost({ runtime, codec, windowTarget: dom.window }), /v4 codec/);
    assert.throws(() => api.createXRouterNativeURLStateHost({ runtime, codec: url.LIFECYCLE_URL_STATE_RUNTIME, windowTarget: dom.window }), /v3 codec/);
    host = api.createXRouterLifecycleURLStateHost({ runtime, codec: url.LIFECYCLE_URL_STATE_RUNTIME, windowTarget: dom.window });
    assert.equal(host.schema, 'xtend.router.url-state-host.v4'); assert.equal(host.apiVersion, '4.0.0');
    const pending = host.navigate('initialize'); release(); assert.equal((await pending).status, 'restored');
    assert.equal(dom.window.location.href, 'https://xtend.test/products?keep=a%20b&xtend-state=2.new#anchor');
    const old = calls[0].lifetime; host.dispose(); assert.equal(old.isCurrent(), false); assert(old.signal.aborted);
  } finally { release(); host?.dispose(); dom.window.close(); }
});

test('actual x-router selects host4 and retains content while navigating a URL2 query', async () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://xtend.test/products?keep=a%20b&xtend-state=2.old' });
  const saved = new Map(), calls = [];
  for (const key of ['window', 'document', 'HTMLElement', 'CustomEvent', 'customElements', 'history', 'location', 'xtendState']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'xtendState' ? { subscribe: () => () => {} } : dom.window[key] });
  }
  const runtime = { async restoreURLState(token) { calls.push(token); return { status: 'restored' }; }, async publishURLState() { return { status: 'published' }; } };
  let router, host;
  try {
    await import('../../components/xrouter.js?lifecycle-url-state-test');
    router = dom.window.document.createElement('x-router'); router.setAttribute('mode', 'history'); dom.window.document.body.append(router);
    host = router.connectURLState(runtime, url.LIFECYCLE_URL_STATE_RUNTIME); await host.whenIdle();
    assert.equal(host.schema, 'xtend.router.url-state-host.v4');
    const input = dom.window.document.createElement('input'); router.shadowRoot.querySelector('#outlet').append(input);
    assert.equal(router.navigate('/products?keep=a%20b&xtend-state=2.latest'), true); await host.whenIdle();
    assert.equal(calls.at(-1), '2.latest'); assert.equal(router.shadowRoot.querySelector('input'), input);
    router.remove(); assert.equal((await host.publish()).status, 'superseded');
  } finally {
    host?.dispose(); router?.remove(); dom.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});
