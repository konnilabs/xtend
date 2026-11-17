'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const projections = require('../../tools/xtensions/state-binding-projection');
const contracts = require('../../tools/xtensions/state-binding-contract');
const interfaces = require('../../tools/xtensions/component-interface');
const bindings = require('../../tools/xtensions/state-binding');
const artifacts = require('../../tools/xtensions/state-binding-artifact');
const literal = value => ({ kind: 'literal', value });
const path = (symbol, parts = [], root = 'state') => ({ kind: 'path', root, symbol, path: parts });
const identity = { documentId: 'document', declarationId: 'host', keys: [] };
function definition(schema = 'xtend.xtensions.component-interface.v2') {
  return { schema, providerId: 'provider', version: '2.0.0', componentVersion: '1.0.0', framework: 'react',
    entry: { module: './provider.mjs', exportName: 'create', sha256: 'a'.repeat(64) }, peers: { react: '18.3.1', 'react-dom': '18.3.1' },
    props: { value: { type: 'string' }, title: { type: 'string' }, extra: { type: 'number' } },
    intents: { select: { payloadSchema: 'intent.v1', fields: { detail: { type: 'object', fields: { id: { type: 'string' } } }, ignored: { type: 'number' } } } },
    ownership: { attributes: 'declared-props-only', children: 'provider-owned', slots: 'provider-owned' },
    ...(schema.endsWith('v2') ? { optionalProps: ['title', 'extra'], defaults: { title: 'Provider title' } } : {}) };
}
test('closed projections evaluate objects, arrays, typed arithmetic and boolean branches without JS coercion', () => {
  const expression = { kind: 'object', fields: { total: { kind: 'binary', op: '*', left: path('price'), right: literal(2) },
    labels: { kind: 'array', items: [literal('a'), { kind: 'conditional', test: literal(true), then: literal('b'), else: path('missing') }] } } };
  projections.validateProjection(expression);
  assert.deepEqual(projections.evaluateProjection(expression, { states: { price: 3 } }), { total: 6, labels: ['a', 'b'] });
  for (const expression of [
    { kind: 'unary', op: '!', value: literal(1) },
    { kind: 'binary', op: '+', left: literal('1'), right: literal(1) },
    { kind: 'binary', op: '/', left: literal(1), right: literal(0) },
    { kind: 'binary', op: '<', left: literal('1'), right: literal(1) }
  ]) assert.throws(() => projections.evaluateProjection(expression, { states: {} }), TypeError);
});
test('static traversal sees all branches while evaluation retains boolean short circuit', () => {
  const expression = { kind: 'conditional', test: literal(true), then: path('left'), else: path('right') }, reads = [];
  projections.visitProjection(expression, value => { if (value.kind === 'path') reads.push(value.symbol); });
  assert.deepEqual(reads, ['left', 'right']);
  assert.equal(projections.evaluateProjection(expression, { states: { left: 1 } }), 1);
  assert.equal(projections.evaluateProjection({ kind: 'binary', op: '&&', left: literal(false), right: path('absent') }, { states: {} }), false);
});
test('projection inputs reject executable, unsafe and unbounded declarations without evaluating accessors', () => {
  let touched = false;
  const forged = { kind: 'literal', get value() { touched = true; return 1; } };
  assert.throws(() => projections.validateProjection(forged)); assert.equal(touched, false);
  assert.throws(() => projections.validateProjection({ kind: 'call', name: 'run' }));
  assert.throws(() => projections.validateProjection(path('model', ['constructor'])));
  let deep = literal(1); for (let i = 0; i < 66; i++) deep = { kind: 'unary', op: '+', value: deep };
  assert.throws(() => projections.validateProjection(deep), /budget/);
});
test('provider-owned optional/default props apply only to omitted source fields', () => {
  const iface = interfaces.normalizeComponentInterface(definition());
  const resolved = interfaces.resolveProjectedComponentBinding(iface, { address: identity, props: { value: path('text') }, intents: {} });
  assert.equal(contracts.propsFrom({ states: { text: 'Model' } }, resolved.binding).title, 'Provider title');
  assert.equal(Object.hasOwn(resolved.binding.props, 'extra'), false);
  assert.throws(() => interfaces.resolveProjectedComponentBinding(iface, { address: identity, props: {}, intents: {} }), /required/);
  const explicit = interfaces.resolveProjectedComponentBinding(iface, { address: identity, props: { value: path('text'), title: path('absent') }, intents: {} });
  assert.throws(() => contracts.propsFrom({ states: { text: 'Model' } }, explicit.binding), /unavailable/);
  assert.throws(() => interfaces.normalizeComponentInterface({ ...definition(), defaults: { title: 1 } }), /declared type/);
  assert.throws(() => interfaces.normalizeComponentInterface({ ...definition(), optionalProps: 0 }));
  assert.throws(() => interfaces.normalizeComponentInterface({ ...definition(), defaults: null }));
  assert.throws(() => interfaces.assertComponentProps(iface, { value: 'x', unknown: true }));
});
test('legacy interface data remains exact and does not admit optional/default fields', () => {
  const iface = definition('xtend.xtensions.component-interface.v1');
  assert.deepEqual(interfaces.normalizeComponentInterface(iface), iface);
  assert.throws(() => interfaces.normalizeComponentInterface({ ...iface, optionalProps: [] }));
  assert.throws(() => interfaces.assertComponentProps(iface, { value: 'x' }));
});
test('provider payloads are fully typed before safe nested projection and renaming', () => {
  const iface = definition();
  const resolved = interfaces.resolveProjectedComponentBinding(iface, { address: identity, props: { value: literal('x') },
    intents: { select: { command: 'select', payload: { id: 'detail.id' } } } });
  assert.deepEqual(interfaces.mapProjectedComponentIntent(iface, 'select', { detail: { id: 'a' }, ignored: 1 }, resolved.routes.select.payload), { id: 'a' });
  assert.throws(() => interfaces.mapProjectedComponentIntent(iface, 'select', { detail: { id: 'a' }, ignored: 'bad' }, resolved.routes.select.payload));
  assert.throws(() => interfaces.resolveProjectedComponentBinding(iface, { address: identity, props: { value: literal('x') }, intents: { select: { command: 'select', payload: { id: 'detail.constructor' } } } }));
  assert.throws(() => interfaces.resolveProjectedComponentBinding(iface, { address: identity, props: { value: literal('x') }, intents: { select: { command: 'select', payload: false } } }));
});
function fixture(selector = false) {
  const state = { items: [{ id: 1, value: 'number' }, { id: '1', value: 'string' }] };
  const program = { schema: 'xtend.rmt.app-orchestration.v2', state: { states: [{ id: 'catalog', initial: state }], selectors: selector ? [{ id: 'selected' }] : [] },
    actions: { actions: [], inputContract: { schema: 'xtend.rmt.action-input-contract.v1', actions: [] } }, surfaces: [{ id: 'target' }], render: { root: { type: 'element', key: 'root', children: [{ type: 'element', key: 'target', surface: 'target' }] } } };
  const artifact = { schema: 'xtend.xtensions.state-binding-artifact.v4', documentId: 'document', bindings: [{ surface: 'target',
    repeat: [{ state: 'catalog', path: ['items'], key: ['id'] }], binding: { schema: 'xtend.xtensions.state-binding.v3', address: identity,
      props: { value: { type: 'string', projection: selector ? path('selected', [], 'selector') : path('catalog', ['items', { repeat: 0 }, 'value']) } }, intents: {} } }] };
  return { program, artifact, state };
}
test('the existing materializer resolves typed keys inside projection paths and enforces orchestration versions', () => {
  const f = fixture(), validated = artifacts.validateStateBindingArtifact(f.artifact, f.program);
  const rows = artifacts.materializeStateBindingArtifact(validated, { states: { catalog: f.state } });
  assert.deepEqual(rows.map(row => row.binding.address.keys), [[1], ['1']]);
  assert.deepEqual(rows.map(row => contracts.propsFrom({ states: { catalog: f.state } }, row.binding).value), ['number', 'string']);
  assert.throws(() => artifacts.validateStateBindingArtifact(f.artifact, { ...f.program, schema: 'xtend.rmt.app-orchestration.v1' }));
  const bad = structuredClone(f.artifact); bad.bindings[0].binding.props.value.projection.path[1].repeat = 2;
  assert.throws(() => artifacts.validateStateBindingArtifact(bad, f.program));
});
test('selector value validation uses the actual runtime snapshot rather than an invented compile-time evaluator', () => {
  const f = fixture(true), validated = artifacts.validateStateBindingArtifact(f.artifact, f.program);
  assert.throws(() => artifacts.materializeStateBindingArtifact(validated, { states: { catalog: f.state } }), /unavailable/);
  const rows = artifacts.materializeStateBindingArtifact(validated, { states: { catalog: f.state }, selectors: { selected: 'computed' } });
  assert.equal(contracts.propsFrom({ states: {}, selectors: { selected: 'computed' } }, rows[0].binding).value, 'computed');
  assert.throws(() => artifacts.materializeStateBindingArtifact(validated, { states: { catalog: f.state }, selectors: { selected: 1 } }), /declared type/);
});
test('projection bindings require their explicit registry while legacy registries retain their data version', async () => {
  const options = { modelReader: { snapshot: () => ({ states: {} }), subscribe: () => () => {} }, modelCommandPort: { apply() {} } };
  const old = bindings.createXTensionStateRegistry(options), current = bindings.createXTensionProjectionStateRegistry(options);
  assert.equal(old.apiVersion, '2.4.0'); assert.equal(current.apiVersion, '3.0.0');
  assert.throws(() => old.bind({ schema: 'xtend.xtensions.state-binding.v3', address: identity, props: {}, intents: {} }, () => {}), /versioned registry/);
  await old.dispose(); await current.dispose();
});
test('provider intent rules respect required, optional/default and nested typed-array Action inputs', () => {
  const f = fixture();
  f.program.actions.actions = [{ id: 'save', inputs: [{ name: 'names', type: 'string[]' }, { name: 'limit', type: 'number' }] }];
  f.program.actions.inputContract.actions = [{ id: 'save', fields: {
    names: { type: 'array', nullable: false, required: true, items: { type: 'string', nullable: false } },
    limit: { type: 'number', nullable: false, required: false, default: 10 }
  } }];
  const entry = f.artifact.bindings[0];
  entry.binding.intents.select = { command: 'save', payloadSchema: 'intent.v1', fields: { names: { type: 'array', items: { type: 'string' } } } };
  assert.doesNotThrow(() => artifacts.validateStateBindingArtifact(f.artifact, f.program));
  entry.binding.intents.select.fields.names.items.type = 'number';
  assert.throws(() => artifacts.validateStateBindingArtifact(f.artifact, f.program), /Action input contract/);
  entry.binding.intents.select.fields = {};
  assert.throws(() => artifacts.validateStateBindingArtifact(f.artifact, f.program), /Action input contract/);
  entry.binding.intents.select.fields = { names: { type: 'array', items: { type: 'string', nullable: true } } };
  assert.throws(() => artifacts.validateStateBindingArtifact(f.artifact, f.program), /Action input contract/);
  entry.binding.intents.select.fields.names.items.nullable = false;
  entry.binding.intents.select.fields.unknown = { type: 'number' };
  assert.throws(() => artifacts.validateStateBindingArtifact(f.artifact, f.program), /Action input contract/);
});
test('formal provider interface v2 advertises optional/default data while v1 remains closed', () => {
  const current = require('../../tools/xtensions/component-interface.v2.schema.json');
  const legacy = require('../../tools/xtensions/component-interface.v1.schema.json');
  assert.equal(current.$id, interfaces.COMPONENT_INTERFACE_SCHEMA_V2);
  assert.equal(current.additionalProperties, false);
  assert.equal(current.properties.schema.const, current.$id);
  assert(current.properties.optionalProps && current.properties.defaults);
  assert.equal(legacy.properties.optionalProps, undefined);
  assert.equal(legacy.properties.defaults, undefined);
  assert.deepEqual(interfaces.normalizeComponentInterface(definition()), definition());
});
