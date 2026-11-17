'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compileRmtClassicSource, RMT_CLASSIC_COMPILER_API_VERSION } = require('../../tools/rmt-language/classic-compiler');
const { RMT_VNEXT_COMPILER_API_VERSION } = require('../../tools/rmt-language/vnext-compiler');
const compile = body => compileRmtClassicSource(`
  state flags type object initial { saved false }
  state original type string initial "expected"
  portal app root "#app" layer surface
  overlay notice kind toast portal app
  action save {
    input id string
    ${body}
  }
`);

test('compiler API versions identify the restored Action/Event semantics without changing the input AST', () => {
  assert.equal(RMT_CLASSIC_COMPILER_API_VERSION, '4.5.0'); assert.equal(RMT_VNEXT_COMPILER_API_VERSION, '1.6.0');
  assert.equal(compile('reduce state.flags.saved = true').parserResult.ast.schema, 'xtend.rmt.vnext.ast.v1');
});
test('all result phases survive lowering as closed execution data, including overlay options', () => {
  const result = compile(`
    on success -> reduce state.flags.saved = true
    on success -> emit saved with id input.id
    on error -> overlay notice message error.message tone "danger"
  `);
  assert(result.ok, JSON.stringify(result.diagnostics));
  const action = result.orchestrationArtifacts.actions.actions[0];
  assert.deepEqual(action.handlers, [
    { phase: 'success', kind: 'reduce', reducer: { state: 'flags', path: 'saved', target: 'state.flags.saved', value: true, valueKind: 'literal' } },
    { phase: 'success', kind: 'emit', emit: { event: 'saved', payload: [{ name: 'id', value: 'input.id', valueKind: 'reference' }] } },
    { phase: 'error', kind: 'overlay', target: 'notice', options: { message: { value: 'error.message', valueKind: 'reference' }, tone: { value: 'danger', valueKind: 'literal' } } }
  ]);
});
test('literal reference spellings and actual references retain distinct execution metadata', () => {
  const result = compile('reduce state.original = "state.original"\non success -> reduce state.original = state.original\nemit saved with literal "input.id" actual input.id');
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.equal(result.orchestrationArtifacts.state.reducers[0].valueKind, 'literal');
  const action = result.orchestrationArtifacts.actions.actions[0];
  assert.equal(action.handlers[0].reducer.valueKind, 'reference');
  assert.deepEqual(action.emits[0].payload, [{ name: 'literal', value: 'input.id', valueKind: 'literal' }, { name: 'actual', value: 'input.id', valueKind: 'reference' }]);
});
test('nested Emit payloads retain explicit reference leaves instead of ambiguous strings', () => {
  const result = compile('emit saved with data { rows [input.id "input.id"] }');
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.deepEqual(result.orchestrationArtifacts.actions.actions[0].emits[0].payload, [{ name: 'data', valueKind: 'template', value: { kind: 'object', fields: [{ key: 'rows', value: { kind: 'array', items: [{ kind: 'path', value: 'input.id' }, { kind: 'literal', value: 'input.id' }] } }] } }]);
});
for (const [name, body] of [
  ['unknown phase', 'on finally -> reduce state.flags.saved = true'],
  ['unknown operation', 'on success -> navigation "/unknown"'],
  ['unresolved overlay', 'on error -> overlay missing'],
  ['unknown overlay option', 'on error -> overlay notice html "<script>"'],
  ['duplicate overlay option', 'on error -> overlay notice tone "danger" tone "info"'],
  ['unknown overlay tone', 'on error -> overlay notice tone "unknown"'],
  ['unknown emitted input', 'on success -> emit saved with id input.missing'],
  ['duplicate emitted field', 'emit saved with id input.id id "again"'],
  ['unsafe emitted field', 'emit saved with constructor input.id'],
  ['unsafe nested field', 'emit saved with data { constructor input.id }'],
  ['unsafe nested reference', 'emit saved with data [input.constructor]'],
  ['nonfinite numeric reducer', 'reduce state.flags.value = ' + '9'.repeat(400)]
]) test('compiler rejects ' + name + ' before producing executable artifacts', () => {
  const result = compile(body); assert.equal(result.ok, false, name); assert(result.diagnostics.some(d => d.severity === 'error'));
});
