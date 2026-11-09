'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const compiler = require('../../tools/rmt-language/classic-compiler');
const { validateStateBindingArtifact } = require('../../tools/xtensions/state-binding');
function runCompilerChecks() {
  const root = path.resolve(__dirname, '../..');
  const input = { text: fs.readFileSync(path.join(root, 'development/rmtx-a02/controlled-filters.rmt'), 'utf8'), filePath: 'controlled-filters.rmt' };
  const declarations = require('../../development/rmtx-a02/bindings.v1.json');
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const plain = compiler.compileRmtClassicSource(input), result = compiler.compileRmtClassicSource(input, { xtensionBindings: declarations });
  let checks = 0;
  assert(result.ok); assert.equal(result.coreJson, plain.coreJson, 'Binding sidecar does not grow the Classic Core/AST contract'); checks++;
  const ast = compiler.compileRmtClassicAstWithBindings(result.parserResult.ast, declarations, { sourceModel: result.parserResult.sourceModel });
  assert.equal(ast.coreJson, result.coreJson); assert.deepEqual(ast.xtensionBindings, result.xtensionBindings); checks++;
  const reloaded = JSON.parse(JSON.stringify(result.xtensionBindings));
  assert.deepEqual(validateStateBindingArtifact(reloaded, result.orchestrationArtifacts), result.xtensionBindings); checks++;
  for (const mutate of [
    (value) => { value.schema += '.unsupported'; },
    (value) => { value.extra = true; },
    (value) => { value.bindings[0].provider = () => {}; },
    (value) => { value.bindings[0].surface = 'missing'; },
    (value) => { value.bindings[1].surface = value.bindings[0].surface; },
    (value) => { value.bindings[1].binding.address = value.bindings[0].binding.address; },
    (value) => { value.bindings[0].binding.address.documentId = 'another-document'; },
    (value) => { value.bindings[0].binding.props.query.state = 'missing'; },
    (value) => { value.bindings[0].binding.props.query.path = ['missing']; },
    (value) => { value.bindings[0].binding.props.query.type = 'number'; },
    (value) => { value.bindings[0].binding.intents.change.command = 'missing'; },
    (value) => { value.bindings[0].binding.intents.change.fields = {}; },
    (value) => { value.bindings[0].binding.intents.change.fields.filter = { type: 'string' }; },
    (value) => { value.bindings[0].binding.props.query.path = ['constructor']; }
  ]) {
    const value = copy(declarations); mutate(value);
    const rejected = compiler.compileRmtClassicSource(input, { xtensionBindings: value });
    assert.equal(rejected.ok, false); assert.equal(rejected.phase, 'xtension-bindings');
    assert.equal(rejected.coreDocument, null); assert.equal(rejected.coreJson, null); assert.equal(rejected.orchestrationArtifacts, null);
    assert(rejected.diagnostics.some((entry) => entry.code === 'rmt.xtensions.binding.invalid'));
    assert.throws(() => compiler.compileRmtClassicAstWithBindings(result.parserResult.ast, value)); checks++;
  }
  for (const mutate of [
    (program) => { program.render.root.children[0].children = [{ type: 'text', text: 'owned elsewhere' }]; },
    (program) => { program.render.root.children[0].text = 'owned elsewhere'; },
    (program) => { program.surfaces[0].repeat = { key: 'item.id' }; },
    (program) => { program.render.root = { type: 'when', then: program.render.root }; },
    (program) => { program.actions.actions[0].execution = 'fastpass'; },
    (program) => { program.state.states.push(program.state.states[0]); },
    (program) => { program.actions.actions.push(program.actions.actions[0]); },
    (program) => { program.surfaces.push(program.surfaces[0]); }
  ]) {
    const program = copy(result.orchestrationArtifacts); mutate(program);
    assert.throws(() => validateStateBindingArtifact(declarations, program), { code: 'rmt.xtensions.binding.invalid' }); checks++;
  }
  let getterCalls = 0;
  const unsafe = copy(declarations); Object.defineProperty(unsafe.bindings[0], 'surface', { enumerable: true, get() { getterCalls++; return 'filter.left'; } });
  assert.equal(compiler.compileRmtClassicSource(input, { xtensionBindings: unsafe }).ok, false);
  assert.equal(getterCalls, 0); checks++;
  const enlarged = copy(result.parserResult.ast); enlarged.xtensionBindings = declarations;
  assert.throws(() => compiler.compileRmtClassicAst(enlarged)); checks++;
  assert.throws(() => compiler.compileRmtClassicAst(result.parserResult.ast, { xtensionBindings: declarations })); checks++;
  assert.equal(result.schema, 'xtend.rmt.classic.compile-result.v3');
  assert.equal(compiler.createRmtClassicCompiler().apiVersion, '3.0.0');
  assert.equal(compiler.RMT_CLASSIC_COMPILER_CONTRACT.version, '1.0.0'); checks++;
  const conditionalInput = { text: fs.readFileSync(path.join(root, 'development/rmtx-a02/conditional-filters.rmt'), 'utf8'), filePath: 'conditional-filters.rmt' };
  const conditionalBindings = require('../../development/rmtx-a02/conditional-bindings.v2.json');
  const conditional = compiler.compileRmtClassicSource(conditionalInput, { xtensionBindings: conditionalBindings });
  assert(conditional.ok, JSON.stringify(conditional.diagnostics));
  assert.equal(conditional.xtensionBindings.schema, 'xtend.xtensions.state-binding-artifact.v2'); checks++;
  const conditionalAst = compiler.compileRmtClassicAstWithBindings(conditional.parserResult.ast, conditionalBindings, { sourceModel: conditional.parserResult.sourceModel });
  assert.equal(conditionalAst.coreJson, conditional.coreJson);
  assert.deepEqual(conditionalAst.xtensionBindings, conditional.xtensionBindings); checks++;
  for (const mutate of [
    (value) => { value.schema = 'xtend.xtensions.state-binding-artifact.v1'; },
    (value) => { value.bindings[0].presence = null; },
    (value) => { value.bindings[0].presence = { state: 'missing', path: [] }; },
    (value) => { value.bindings[0].presence.path = ['missing']; },
    (value) => { value.bindings[0].presence = { state: 'filter.left', path: ['query'] }; },
    (value) => { value.bindings[0].presence.default = false; },
    (value) => { delete value.bindings[0].presence.path; },
    (value) => { value.bindings[0].presence.path = ['__proto__']; },
    (value) => { value.bindings[0].presence.path = [0.5]; },
    (value) => { value.bindings[0].presence.test = () => true; }
  ]) {
    const value = copy(conditionalBindings); mutate(value);
    const rejected = compiler.compileRmtClassicSource(conditionalInput, { xtensionBindings: value });
    assert.equal(rejected.ok, false); assert.equal(rejected.coreDocument, null); assert.equal(rejected.xtensionBindings, null);
    assert.throws(() => compiler.compileRmtClassicAstWithBindings(conditional.parserResult.ast, value)); checks++;
  }
  const maraca = require('../../xtend-maraca');
  const temp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'xtend-a022-config-'));
  try {
    for (const [schema, withBindings, accepted] of [['xtend.maraca.build-config.v1', false, true],
      ['xtend.maraca.build-config.v1', true, false], ['xtend.maraca.build-config.v2', true, true], ['xtend.maraca.build-config.v3', true, true]]) {
      const file = path.join(temp, 'config.json');
      fs.writeFileSync(file, JSON.stringify({ schema, options: withBindings ? { xtensionBindings: declarations } : {} }));
      const plan = maraca.createMaracaBuildPlan({ sourceText: input.text, virtualSourcePath: input.filePath, configPath: file,
        orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
      assert.equal(plan.ok, accepted, JSON.stringify(plan.diagnostics));
      assert.equal(plan.schema, 'xtend.maraca.build-plan.v3');
      if (!accepted) assert(plan.diagnostics.some((item) => item.code === 'xtend.maraca.xtension_config_version'));
      checks++;
    }
    for (const [schema, accepted] of [['xtend.maraca.build-config.v2', false], ['xtend.maraca.build-config.v3', true]]) {
      const file = path.join(temp, 'config.json');
      fs.writeFileSync(file, JSON.stringify({ schema, options: { xtensionBindings: conditionalBindings } }));
      const plan = maraca.createMaracaBuildPlan({ sourceText: conditionalInput.text, virtualSourcePath: conditionalInput.filePath, configPath: file,
        orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
      assert.equal(plan.ok, accepted, JSON.stringify(plan.diagnostics));
      if (!accepted) assert(plan.diagnostics.some((item) => item.code === 'xtend.maraca.xtension_config_version')); checks++;
    }
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  return { ok: true, checks };
}
module.exports = { runCompilerChecks };
