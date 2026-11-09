'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const compiler = require('../../tools/rmt-language/classic-compiler');
const runtime = require('../../tools/xtensions/state-binding');
function runRepeatedCompilerChecks() {
  const root = path.resolve(__dirname, '../..'), copy = value => JSON.parse(JSON.stringify(value));
  const input = { text: fs.readFileSync(path.join(root, 'development/rmtx-a02/repeated-filters.rmt'), 'utf8'), filePath: 'repeated-filters.rmt' };
  const declarations = require('../../development/rmtx-a02/repeated-filters').repeatedBindings();
  const compiled = compiler.compileRmtClassicSource(input, { xtensionBindings: declarations });
  assert(compiled.ok, JSON.stringify(compiled.diagnostics)); let checks = 1;
  const ast = compiler.compileRmtClassicAstWithBindings(compiled.parserResult.ast, declarations, { sourceModel: compiled.parserResult.sourceModel });
  assert.equal(ast.coreJson, compiled.coreJson); assert.deepEqual(ast.xtensionBindings, compiled.xtensionBindings); checks++;
  const states = Object.fromEntries(compiled.orchestrationArtifacts.state.states.map(state => [state.id, state.initial]));
  const rows = runtime.materializeStateBindingArtifact(compiled.xtensionBindings, { states });
  assert.equal(rows.length, 3); assert.notEqual(rows[0].hostSurface, rows[1].hostSurface);
  assert.deepEqual(rows.map(row => row.binding.address.keys), [['a', 1], ['a', '1'], ['b', 1]]); checks++;
  assert.throws(() => runtime.materializeStateBindingArtifact(copy(compiled.xtensionBindings), { states }), /validated/); checks++;
  const reordered = copy(states); reordered.groups.items.reverse(); reordered.groups.items[1].filters.reverse();
  const again = runtime.materializeStateBindingArtifact(compiled.xtensionBindings, { states: reordered });
  assert.deepEqual(again.map(row => row.hostSurface), [rows[2].hostSurface, rows[1].hostSurface, rows[0].hostSurface]);
  assert.deepEqual(again[2].binding, rows[0].binding, 'same keys lower to exactly the same selectors and intent targets'); checks++;
  const empty = copy(compiled.orchestrationArtifacts); empty.state.states[0].initial = { items: [] };
  const emptyArtifact = runtime.validateStateBindingArtifact(declarations, empty);
  assert.deepEqual(runtime.materializeStateBindingArtifact(emptyArtifact, { states: { groups: { items: [] } } }), []); checks++;
  for (const mutate of [
    v => { v.schema = 'xtend.xtensions.state-binding-artifact.v2'; },
    v => { v.bindings[0].binding.schema = 'xtend.xtensions.state-binding.v1'; },
    v => { v.bindings[0].repeat = []; },
    v => { v.bindings[0].repeat[0].state = 'missing'; },
    v => { v.bindings[0].repeat[0].key = []; },
    v => { delete v.bindings[0].repeat[0].key; },
    v => { v.bindings[0].repeat[0].key = ['constructor']; },
    v => { v.bindings[0].repeat[1].state = 'groups'; },
    v => { v.bindings[0].repeat[1].path = ['missing']; },
    v => { v.bindings[0].repeat[0].indexFallback = true; },
    v => { v.bindings[0].binding.props.query.path[1] = { repeat: 2 }; },
    v => { v.bindings[0].binding.props.query.path[1] = { repeat: -0 }; },
    v => { v.bindings[0].binding.props.query.path = [{ repeat: 1 }, 'query']; },
    v => { v.bindings[0].binding.props.query.path[0] = 'wrong-collection'; },
    v => { v.bindings[0].binding.props.query.path[1].extra = true; },
    v => { v.bindings[0].binding.intents.change.keyFields.filterId.index = 2; },
    v => { v.bindings[0].binding.intents.change.keyFields.filterId.index = -0; v.bindings[0].binding.intents.change.keyFields.filterId.type = 'string'; },
    v => { v.bindings[0].binding.intents.change.keyFields.query = { index: 0, type: 'string' }; },
    v => { v.bindings[0].binding.intents.change.keyFields.filterId.type = 'string'; },
    v => { delete v.bindings[0].binding.intents.change.keyFields.groupId; },
    v => { v.bindings[0].presence.path = ['items', { repeat: 1 }, 'enabled']; },
    v => { v.bindings[0].binding.address.keys = [-0]; }
  ]) {
    const value = copy(declarations); mutate(value);
    const rejected = compiler.compileRmtClassicSource(input, { xtensionBindings: value });
    assert.equal(rejected.ok, false, JSON.stringify(value)); assert.equal(rejected.xtensionBindings, null); assert.equal(rejected.coreDocument, null);
    assert.throws(() => compiler.compileRmtClassicAstWithBindings(compiled.parserResult.ast, value)); checks++;
  }
  for (const mutate of [
    p => { p.render.root.children[0].attributes.id = 'duplicate-dom-id'; },
    p => { p.surfaces[0].events = ['event']; },
    p => { p.surfaces[0].resources = ['resource']; },
    p => { p.render.root.children[0].bindings = ['binding']; },
    p => { p.surfaces.push({ ...p.surfaces[0], id: 'xtension:reserved' }); },
    p => { p.state.states[0].initial.items[0].filters[1].id = 1; },
    p => { p.state.states[0].initial.items[0].filters[0].id = null; },
    p => { delete p.state.states[0].initial.items[0].filters[0].id; }
  ]) { const program = copy(compiled.orchestrationArtifacts); mutate(program); assert.throws(() => runtime.validateStateBindingArtifact(declarations, program)); checks++; }
  const legacy = copy(rows[0].binding); legacy.schema = 'xtend.xtensions.state-binding.v1';
  assert.throws(() => runtime.validateStateBinding(legacy), /path|unsupported/i); checks++;
  const badSelector = copy(rows[0].binding); badSelector.props.query.path[1].key.path = ['__proto__'];
  assert.throws(() => runtime.validateStateBinding(badSelector)); checks++;
  let calls = 0;
  const snapshot = {}; Object.defineProperty(snapshot, 'states', { get() { calls++; return states; } });
  assert.throws(() => runtime.materializeStateBindingArtifact(compiled.xtensionBindings, snapshot)); assert.equal(calls, 0); checks++;
  return { ok: true, checks };
}
module.exports = { runRepeatedCompilerChecks };
