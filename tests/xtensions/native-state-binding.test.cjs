'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../tools/xtensions/state-binding');
const { propsFrom } = require('../../tools/xtensions/state-binding-contract');
const copy = value => structuredClone(value);
const path = parts => ({ kind: 'path', root: 'state', symbol: 'catalog', path: parts });
function fixture(native = true) {
  const state = { groups: [
    { id: 'g', products: [{ id: 1, label: 'number', enabled: true }, { id: '1', label: 'string', enabled: true }] },
    { id: 'h', products: [{ id: 1, label: 'other parent', enabled: true }] }
  ] };
  const program = { schema: native ? 'xtend.rmt.app-orchestration.v3' : 'xtend.rmt.app-orchestration.v2',
    state: { states: [{ id: 'catalog', initial: state }], selectors: [] }, surfaces: [{ id: 'host' }],
    actions: { actions: [], inputContract: { schema: 'xtend.rmt.action-input-contract.v1', actions: [] } },
    render: { ...(native ? { nativeView: { schema: 'xtend.rmt.native-view.v1', documentId: 'document', surfaces: [] } } : {}),
      root: { type: 'element', tag: 'div', surface: 'host', key: 'host' } } };
  const artifact = { schema: native ? api.NATIVE_STATE_BINDING_ARTIFACT_SCHEMA : api.PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA,
    documentId: 'document', bindings: [{ surface: 'host',
      repeat: [{ state: 'catalog', path: ['groups'], key: ['id'] }, { path: ['products'], key: ['id'] }],
      presence: { state: 'catalog', path: ['groups', { repeat: 0 }, 'products', { repeat: 1 }, 'enabled'] },
      binding: { schema: 'xtend.xtensions.state-binding.v3', address: { documentId: 'document', declarationId: 'provider', keys: [] },
        props: { label: { type: 'string', projection: path(['groups', { repeat: 0 }, 'products', { repeat: 1 }, 'label']) } }, intents: {} }
    }] };
  return { program, artifact, state, snapshot: { states: { catalog: state } } };
}

test('Native BindingArtifact5 requires Program3 while Source4 artifact4 remains strictly Program2', () => {
  const current = fixture(), previous = fixture(false);
  assert.equal(api.NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, 'xtend.xtensions.state-binding-artifact.v5');
  assert.equal(api.PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, 'xtend.xtensions.state-binding-artifact.v4');
  assert.doesNotThrow(() => api.validateStateBindingArtifact(current.artifact, current.program));
  assert.doesNotThrow(() => api.validateStateBindingArtifact(previous.artifact, previous.program));
  assert.throws(() => api.validateStateBindingArtifact(current.artifact, previous.program), /artifact v3/);
  assert.throws(() => api.validateStateBindingArtifact(previous.artifact, current.program), /artifact v2/);
});

test('native header provenance and Binding3 remain closed without importing Native View IR into legacy bindings', () => {
  for (const change of [
    f => { delete f.program.render.nativeView; },
    f => { f.program.render.nativeView.schema = 'invalid-native-view-header'; },
    f => { f.program.render.nativeView.documentId = 'other'; },
    f => { f.program.render.nativeView.surfaces = ['missing']; },
    f => { f.program.render.nativeView.surfaces = ['host', 'host']; },
    f => { f.artifact.bindings[0].binding.schema = 'xtend.xtensions.state-binding.v2'; },
    f => { f.program.actions.inputContract = null; }
  ]) { const f = fixture(); change(f); assert.throws(() => api.validateStateBindingArtifact(f.artifact, f.program), TypeError); }
});

test('native bindings share exact typed-key materialization and stable props with the existing projection profile', () => {
  const next = fixture(), old = fixture(false);
  const current = api.validateStateBindingArtifact(next.artifact, next.program), prior = api.validateStateBindingArtifact(old.artifact, old.program);
  const rows = api.materializeStateBindingArtifact(current, next.snapshot);
  assert.deepEqual(rows, api.materializeStateBindingArtifact(prior, old.snapshot));
  assert.deepEqual(rows.map(row => row.binding.address.keys), [['g', 1], ['g', '1'], ['h', 1]]);
  assert.notEqual(rows[0].hostSurface, rows[1].hostSurface); assert.notEqual(rows[0].hostSurface, rows[2].hostSurface);
  assert.deepEqual(rows.map(row => propsFrom(next.snapshot, row.binding)), [{ label: 'number' }, { label: 'string' }, { label: 'other parent' }]);
  const reordered = copy(next.snapshot); reordered.states.catalog.groups.reverse(); reordered.states.catalog.groups[1].products.reverse();
  assert.deepEqual(api.materializeStateBindingArtifact(current, reordered).map(row => row.hostSurface), [rows[2].hostSurface, rows[1].hostSurface, rows[0].hostSurface]);
});

test('shared scope extraction preserves depth-first legacy error ordering', () => {
  for (const native of [false, true]) {
    const f = fixture(native), validated = api.validateStateBindingArtifact(f.artifact, f.program);
    const next = copy(f.snapshot);
    // The first item has an invalid prop, and a later parent has a malformed
    // collection. Existing semantics report the first boundary error first.
    next.states.catalog.groups[0].products[0].label = 1;
    next.states.catalog.groups[1].products = {};
    assert.throws(() => api.materializeStateBindingArtifact(validated, next), /declared type/);
  }
});

test('native binding presence, malformed collections and duplicated typed keys reject through the existing validator', () => {
  for (const [label, update, message] of [
    ['presence', state => { state.groups[0].products[0].enabled = 'true'; }, /boolean/],
    ['duplicate', state => { state.groups[0].products[1].id = 1; }, /unique/],
    ['negative zero', state => { state.groups[0].products[0].id = -0; }, /nonnegative/],
    ['collection', state => { state.groups[0].products = {}; }, /Model arrays/]
  ]) {
    const f = fixture(), validated = api.validateStateBindingArtifact(f.artifact, f.program); update(f.state);
    assert.throws(() => api.materializeStateBindingArtifact(validated, f.snapshot), message, label);
  }
  const f = fixture(), validated = api.validateStateBindingArtifact(f.artifact, f.program);
  f.state.groups[0].products[0].enabled = false;
  assert.deepEqual(api.materializeStateBindingArtifact(validated, f.snapshot).map(row => row.binding.address.keys), [['g', '1'], ['h', 1]]);
  f.state.groups = []; assert.deepEqual(api.materializeStateBindingArtifact(validated, f.snapshot), []);
});

test('serialized artifacts require real revalidation and Model getters cannot cross the boundary', () => {
  const f = fixture(), validated = api.validateStateBindingArtifact(f.artifact, f.program);
  assert.throws(() => api.materializeStateBindingArtifact(copy(validated), f.snapshot), /validated binding artifact/);
  const fresh = api.validateStateBindingArtifact(copy(validated), f.program);
  assert.equal(api.materializeStateBindingArtifact(fresh, f.snapshot).length, 3);
  let getters = 0;
  const snapshot = { get states() { getters++; return f.snapshot.states; } };
  assert.throws(() => api.materializeStateBindingArtifact(fresh, snapshot), /plain Model/); assert.equal(getters, 0);
});

test('Native Registry advertises API4 and leaves the existing factories and Binding3 data unchanged', async () => {
  const { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const model = createRmtStateSelectorRuntime({ states: [{ id: 'label', initial: 'value', type: 'string' }] });
  const options = { modelReader: model.modelReader, modelCommandPort: model.modelCommandPort };
  const old = api.createXTensionStateRegistry(options), projection = api.createXTensionProjectionStateRegistry(options), native = api.createXTensionNativeStateRegistry(options);
  try {
    assert.equal(old.apiVersion, '2.4.0'); assert.equal(projection.apiVersion, '3.0.0'); assert.equal(native.apiVersion, '4.0.0');
    const projectionBinding = { schema: 'xtend.xtensions.state-binding.v3', address: { documentId: 'document', declarationId: 'host', keys: [] }, props: {}, intents: {} };
    const legacyBinding = { ...projectionBinding, schema: 'xtend.xtensions.state-binding.v1' };
    assert.deepEqual(api.validateStateBinding(projectionBinding), projectionBinding);
    let calls = 0; const neverCreateHost = () => { calls++; throw new Error('Wrong schema must fail before factory'); };
    assert.throws(() => old.bind(projectionBinding, neverCreateHost), /versioned registry/);
    assert.throws(() => native.bind(legacyBinding, neverCreateHost), /versioned registry/);
    assert.equal(calls, 0);
  } finally { await old.dispose(); await projection.dispose(); await native.dispose(); }
});

test('Native Registry validates raw Model snapshots before projection cloning without changing the legacy reader contract', () => {
  let reads = 0;
  const badSnapshot = { states: { value: -0 }, selectors: {} };
  const modelReader = { snapshot: () => badSnapshot, subscribe: () => () => {} }, modelCommandPort = { apply() {} };
  assert.throws(() => api.createXTensionNativeStateRegistry({ modelReader, modelCommandPort }), /negative zero/);
  Object.defineProperty(badSnapshot.states, 'value', { enumerable: true, get() { reads++; return 0; } });
  assert.throws(() => api.createXTensionNativeStateRegistry({ modelReader, modelCommandPort }), /accessor/); assert.equal(reads, 0);
  assert.doesNotThrow(() => api.createXTensionProjectionStateRegistry({ modelReader, modelCommandPort }));
});
