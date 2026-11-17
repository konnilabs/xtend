'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const url = require('../../tools/xtensions/url-state');
const port = url.PROJECTION_URL_STATE_RUNTIME;
const copy = value => structuredClone(value);
const path = (symbol, parts = [], root = 'state') => ({ kind: 'path', root, symbol, path: parts });
function inputs() {
  const state = { items: [{ id: 1, value: 'numeric', private: 'secret-number' }, { id: '1', value: 'textual', private: 'secret-string' }] };
  const program = { schema: 'xtend.rmt.app-orchestration.v2', state: { states: [{ id: 'catalog', initial: state }], selectors: [{ id: 'selected' }] },
    actions: { actions: [], inputContract: { schema: 'xtend.rmt.action-input-contract.v1', actions: [] } }, surfaces: [{ id: 'target' }],
    render: { root: { type: 'element', key: 'root', children: [{ type: 'element', key: 'target', surface: 'target' }] } } };
  const bindings = { schema: 'xtend.xtensions.state-binding-artifact.v4', documentId: 'document', bindings: [{ surface: 'target',
    repeat: [{ state: 'catalog', path: ['items'], key: ['id'] }], binding: { schema: 'xtend.xtensions.state-binding.v3',
      address: { documentId: 'document', declarationId: 'host', keys: [] },
      props: { value: { type: 'string', projection: path('catalog', ['items', { repeat: 0 }, 'value']) } }, intents: {} } }] };
  const policy = { schema: 'xtend.xtensions.url-state-policy.v2', id: 'public', version: 1, documentId: 'document', exposure: 'public-url',
    fields: [{ id: 'value', surface: 'target', prop: 'value', default: '' }], limits: { tokenBytes: 4096, entries: 32, valueBytes: 512, instances: 128 } };
  return { program, bindings, policy, state };
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
test('projection URL profile is explicit and frozen while legacy module keeps API1', () => {
  assert.equal(url.API_VERSION, '1.0.0'); assert.equal(url.PROJECTION_URL_STATE_API_VERSION, '2.0.0');
  assert.equal(port.API_VERSION, '2.0.0'); assert(Object.isFrozen(port));
  const f = inputs(), contract = port.createURLStateContract(f.policy, f);
  assert.equal(contract.apiVersion, '2.0.0'); assert(Object.isFrozen(contract));
  const legacyPolicy = { ...f.policy, schema: 'xtend.xtensions.url-state-policy.v1' };
  assert.throws(() => url.createURLStateContract(legacyPolicy, f), /versioned Model\/binding/);
  assert.throws(() => port.createURLStateContract(f.policy, { ...f, program: { ...f.program, schema: 'xtend.rmt.app-orchestration.v1' } }), /versioned Model\/binding/);
  assert.throws(() => port.createURLStateContract(f.policy, { ...f, bindings: { ...f.bindings, schema: 'xtend.xtensions.state-binding-artifact.v3' } }), /versioned Model\/binding/);
  assert.throws(() => port.createURLStateContract(legacyPolicy, f), /Unsupported policy/);
});
test('four URL2 wire schemas preserve legacy shapes with explicit schema IDs and token prefix2', () => {
  for (const file of ['policy', 'state', 'restore-plan', 'history-proposal']) {
    const legacy = require(`../../tools/xtensions/url-state-contracts/${file}.v1.schema.json`);
    const current = require(`../../tools/xtensions/url-state-contracts/${file}.v2.schema.json`);
    const expected = JSON.parse(JSON.stringify(legacy).replace(/\.v1/g, '.v2').replace(/\^1\\\\\./g, '^2\\\\.'));
    assert.deepEqual(current, expected); assert(current.$id.endsWith('.v2')); assert.equal(current.additionalProperties, false);
  }
  const schema = require('../../tools/xtensions/url-state-contracts/history-proposal.v2.schema.json');
  assert(new RegExp(schema.properties.token.anyOf[1].pattern).test('2.abc'));
  assert(!new RegExp(schema.properties.token.anyOf[1].pattern).test('1.abc'));
});
test('canonical URL2 capture roundtrips typed keys and omits private fields and default values', async () => {
  const f = await fixture(), captured = f.contract.capture(f.model.snapshot()), token = f.contract.encode(captured);
  assert(token.startsWith('2.')); assert.deepEqual(f.contract.decode(token), captured);
  assert.deepEqual(captured.entries.map(row => row.keys), [['1'], [1]]);
  assert(!port.canonical(captured).includes('secret')); assert(!port.canonical(captured).includes('private'));
  assert.deepEqual(f.contract.decode(f.contract.encode(snapshot([entry(1, '')]))).entries, []);
  assert.throws(() => f.contract.decode(token.replace(/^2\./, '1.')));
  assert.throws(() => f.contract.decode(token + '='));
  const reordered = copy(f.state); reordered.items.reverse();
  assert.equal(f.contract.encode(f.contract.capture({ states: { catalog: reordered } })), token);
});
test('URL2 writes both typed addresses atomically through the existing Model port and keeps provenance', async () => {
  const f = await fixture(), wanted = snapshot([entry(1, 'changed-number'), entry('1', 'changed-string')]);
  const plan = f.contract.planRestore(f.contract.encode(wanted), f.model.snapshot(), { navigationId: 'n1' });
  assert.equal(plan.schema, 'xtend.xtensions.url-state-restore-plan.v2'); assert.equal(plan.changes.length, 2);
  let notifications = 0, calls = 0, metadata;
  const unsubscribe = f.model.modelReader.subscribe(() => notifications++);
  const ports = { modelReader: f.model.modelReader, modelCommandPort: { schema: 'xtend.rmt.model-command-port.v1', apply(operations, info) {
    calls++; metadata = info; return f.model.modelCommandPort.apply(operations, info);
  } } };
  assert.equal(f.contract.applyRestore(plan, ports, f.lifetime), true);
  assert.equal(calls, 1); assert.equal(notifications, 1); unsubscribe();
  assert.deepEqual(metadata, { source: 'xtension-url-restore', policyId: 'public', policyVersion: 1, navigationId: 'n1' });
  assert.deepEqual(f.model.getState('catalog').items, [{ id: 1, value: 'changed-number', private: 'secret-number' }, { id: '1', value: 'changed-string', private: 'secret-string' }]);
  assert.throws(() => f.contract.applyRestore(plan, ports, f.lifetime), /consumed/);
});
test('URL2 deferred missing keys cause no partial writes and stable key lookup survives reordering', async () => {
  const f = await fixture(), token = f.contract.encode(snapshot([entry(1, 'known'), entry('future', 'late')]));
  const plan = f.contract.planRestore(token, f.model.snapshot(), { navigationId: 'n1' }), before = copy(f.model.snapshot().states);
  assert.equal(plan.status, 'deferred'); assert.deepEqual(plan.changes, []);
  assert.throws(() => f.contract.applyRestore(plan, f.model, f.lifetime), /no partial/); assert.deepEqual(f.model.snapshot().states, before);
  const next = copy(f.state); next.items.push({ id: 'future', value: '', private: 'future-secret' }); next.items.reverse(); f.model.setState('catalog', next);
  const fresh = f.contract.planRestore(token, f.model.snapshot(), { navigationId: 'n1' });
  f.contract.applyRestore(fresh, f.model, f.lifetime); assert.equal(f.model.getState('catalog').items[0].value, 'late');
  assert.equal(f.model.getState('catalog').items[2].value, 'known');
});
test('URL2 retains Model drift, navigation, abort, serialized-plan and lifetime fences', async () => {
  for (const invalidate of [f => { f.control.navigation = 'next'; }, f => { f.control.current = false; }, f => { const a = new AbortController(); a.abort(); f.lifetime.signal = a.signal; }, f => f.model.setState('catalog', { ...f.state, other: 'new' })]) {
    const f = await fixture(), plan = f.contract.planRestore(null, f.model.snapshot(), { navigationId: 'n1' }); invalidate(f);
    const before = copy(f.model.snapshot().states); assert.throws(() => f.contract.applyRestore(plan, f.model, f.lifetime)); assert.deepEqual(f.model.snapshot().states, before);
  }
  const f = await fixture(), plan = f.contract.planRestore(null, f.model.snapshot(), { navigationId: 'n1' });
  assert.throws(() => f.contract.applyRestore(copy(plan), f.model, f.lifetime)); f.contract.dispose();
  assert.throws(() => f.contract.applyRestore(plan, f.model, f.lifetime), /disposed/);
});
test('URL2 History requires settled restore and actual View/Props commit', async () => {
  const f = await fixture(); assert.throws(() => f.contract.proposeHistory(f.model.snapshot(), { cause: 'commit', currentToken: null, navigationId: 'n1' }), /not settled/);
  const currentToken = f.contract.encode(f.contract.capture(f.model.snapshot()));
  const plan = f.contract.planRestore(currentToken, f.model.snapshot(), { navigationId: 'n1' });
  assert.equal(f.contract.applyRestore(plan, f.model, f.lifetime), false);
  const proposal = f.contract.proposeHistory(f.model.snapshot(), { cause: 'checkpoint', currentToken: null, navigationId: 'n1' });
  assert.equal(proposal.schema, 'xtend.xtensions.url-history-proposal.v2'); assert.equal(proposal.mode, 'push'); assert(proposal.token.startsWith('2.'));
  f.control.committed = false; assert.throws(() => f.contract.checkHistory(proposal, f.model.snapshot(), f.lifetime), /View\/Props commit/);
  f.control.committed = true; assert.equal(f.contract.checkHistory(proposal, f.model.snapshot(), f.lifetime), true);
  assert.throws(() => f.contract.checkHistory(proposal, f.model.snapshot(), f.lifetime), /superseded/);
});
test('URL2 grants reject computed, selector, literal, provider-default, omitted and nonscalar writers', () => {
  for (const projection of [{ kind: 'literal', value: 'provider-default' }, path('selected', [], 'selector'), { kind: 'conditional', test: { kind: 'literal', value: true }, then: path('catalog', ['items', { repeat: 0 }, 'value']), else: { kind: 'literal', value: '' } }, { kind: 'binary', op: '+', left: { kind: 'literal', value: '' }, right: path('catalog', ['items', { repeat: 0 }, 'value']) }]) {
    const f = inputs(); f.bindings.bindings[0].binding.props.value.projection = projection;
    assert.throws(() => port.createURLStateContract(f.policy, f), /direct scalar Model path/);
  }
  const f = inputs(); delete f.bindings.bindings[0].binding.props.value;
  assert.throws(() => port.createURLStateContract(f.policy, f), /direct scalar Model path/);
  const object = inputs(); object.bindings.bindings[0].binding.props.value = { type: 'object', fields: { items: { type: 'json' } }, projection: path('catalog') };
  assert.throws(() => port.createURLStateContract(object.policy, object), /scalar controlled prop/);
});
test('URL2 key and alias writes remain rejected before atomic Model mutation', async () => {
  const f = inputs(); f.state.items = [{ id: 1, value: 'one' }]; f.program.state.states[0].initial = f.state;
  f.bindings.bindings[0].binding.props.value = { type: 'number', projection: path('catalog', ['items', { repeat: 0 }, 'id']) }; f.policy.fields[0].default = 0;
  const contract = port.createURLStateContract(f.policy, f);
  assert.throws(() => contract.capture({ states: { catalog: f.state } }), /instance keys/);
  const a = inputs(); a.bindings.bindings[0].binding.props.alias = copy(a.bindings.bindings[0].binding.props.value); a.policy.fields.push({ id: 'alias', surface: 'target', prop: 'alias', default: '' });
  const alias = port.createURLStateContract(a.policy, a); assert.throws(() => alias.capture({ states: { catalog: a.state } }), /overlap/);
});
test('query helpers preserve unrelated router data and isolate token profiles', () => {
  assert.equal(port.withToken('q=hello%20world&empty=', '2.abc'), 'q=hello%20world&empty=&xtend-state=2.abc');
  assert.equal(port.readQuery(port.withToken('q=1', '2.abc')), '2.abc'); assert.equal(port.withToken('xtend-state=2.abc&q=1', null), 'q=1');
  assert.throws(() => port.withToken('', '1.abc')); assert.throws(() => url.withToken('', '2.abc'));
  assert.equal(url.withToken('', '1.abc'), 'xtend-state=1.abc');
  assert.throws(() => port.withToken('xtend-state=2.a&xtend-state=2.b', '2.c'));
});
test('URL profile selection rejects getters on inputs, bindings and program without execution', () => {
  for (const target of ['inputs', 'bindings', 'program']) {
    const f = inputs(); let calls = 0;
    Object.defineProperty(target === 'inputs' ? f : f[target], target === 'inputs' ? 'bindings' : 'schema', { enumerable: true, get() { calls++; throw new Error('must not execute'); } });
    assert.throws(() => port.createURLStateContract(f.policy, f), /accessor/); assert.equal(calls, 0);
  }
});
