'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const classic = require('../../tools/rmt-language/classic-compiler');
const backend = require('../../tools/rmt-language/vnext-compiler');
const { parseRmtClassicSource } = require('../../tools/rmt-language/classic-parser');
const { createRmtSourceModel } = require('../../tools/rmt-language/source-model');
const profile = Object.freeze({ syntax: 'rmtx', version: '1.0.0' });
const source = 'state label type string initial "before"\naction rename { input next string\n reduce state.label = input.next\n}';
const parse = () => parseRmtClassicSource({ text: source, filePath: 'example.rmt' });
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

test('full AST result uses the shared Source pipeline and leaves the declarative input unchanged', () => {
  const parsed = parse(); assert(parsed.ok);
  const before = JSON.stringify(parsed.ast); freeze(parsed.ast);
  const result = classic.compileRmtClassicAstResult(parsed.ast, { sourceModel: parsed.sourceModel });
  const normal = classic.compileRmtClassicSource({ text: source, filePath: 'example.rmt' });
  assert(result.ok, JSON.stringify(result.diagnostics));
  for (const key of ['coreDocument', 'coreJson', 'orchestrationArtifacts', 'appServiceDemands', 'diagnostics', 'compilerDiagnostics']) {
    assert.deepEqual(result[key], normal[key], key);
  }
  assert.equal(JSON.stringify(parsed.ast), before);
  assert.equal(classic.RMT_CLASSIC_COMPILER_API_VERSION, '4.8.0');
  assert.equal(backend.RMT_VNEXT_COMPILER_API_VERSION, '1.9.0');
});

test('RMTX source profile reaches Core, AppPlatform and orchestration before artifact serialization', () => {
  const parsed = parse();
  const result = classic.compileRmtClassicAstResult(parsed.ast, { sourceProfile: profile, sourceModel: parsed.sourceModel });
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.equal(result.coreDocument.manifest.sourceSyntax, 'rmtx');
  assert.equal(result.coreDocument.appPlatform.sourceSyntax, 'rmtx');
  assert.equal(result.orchestrationArtifacts.sourceSyntax, 'rmtx');
  assert.equal(JSON.parse(result.coreJson).manifest.sourceSyntax, 'rmtx');
  assert.equal(result.coreDocument.schema, 'xtend.rmt.core-format.vnext.v1');
  assert.equal(result.parserResult.ast.schema, 'xtend.rmt.vnext.ast.v1');
  assert.deepEqual(result.orchestrationArtifacts, backend.createRmtAppOrchestrationArtifacts(result.coreDocument));
  assert.equal(result.parserResult.sourceModel, parsed.sourceModel);
});

test('lowered AST ranges and RMTX URI survive semantic errors and source maps without reparsing Classic text', () => {
  const text = '<RMT.Template name="app">\r\n  <RMT.State name="label" type="string" initial="before" />\r\n  <RMT.Action name="rename"><RMT.Reduce target="state.label" value={input.absent} /></RMT.Action>\r\n</RMT.Template>';
  const model = createRmtSourceModel({ text, uri: 'untitled:rmtx-example', languageId: 'rmtx' });
  const at = fragment => { const start = text.indexOf(fragment); return model.rangeForOffsets(start, start + fragment.length); };
  const stateRange = at('<RMT.State name="label" type="string" initial="before" />');
  const reducerRange = at('input.absent');
  const ast = { schema: 'xtend.rmt.vnext.ast.v1', type: 'RmtVNextDocument', body: [
    { type: 'RmtStateDeclaration', name: 'label', dataType: { type: 'RmtTypeReference', value: 'string' },
      initial: { type: 'RmtPrimitiveValue', kind: 'literal', value: 'before' }, body: [], range: stateRange },
    { type: 'RmtActionDeclaration', name: 'rename', body: [
      { type: 'RmtReducerStatement', target: 'state.label', expression: 'input.absent', range: reducerRange }
    ], range: at('<RMT.Action name="rename">') }
  ] };
  const rejected = classic.compileRmtClassicAstResult(ast, { sourceModel: model, sourceProfile: profile });
  assert.equal(rejected.ok, false); assert.equal(rejected.coreDocument, null); assert.equal(rejected.orchestrationArtifacts, null);
  const missing = rejected.diagnostics.find(diagnostic => diagnostic.range?.startOffset === reducerRange.startOffset);
  assert(missing, JSON.stringify(rejected.diagnostics)); assert.equal(missing.uri, model.uri); assert.deepEqual(missing.range, reducerRange);
  ast.body.pop();
  const accepted = classic.compileRmtClassicAstResult(ast, { sourceModel: model, sourceProfile: profile });
  assert(accepted.ok, JSON.stringify(accepted.diagnostics));
  assert.deepEqual(accepted.coreDocument.sourceMap.find(entry => entry.nodeType === 'RmtStateDeclaration').range, stateRange);
  assert.equal(accepted.parserResult.sourceModel.text, text);
});

test('new AST result validates structure and rejects executable data before producing plans', () => {
  for (const mutate of [ast => { ast.body[0].unknown = true; }, ast => { ast.body[0].initial.value = () => 'bad'; }]) {
    const ast = parse().ast; mutate(ast);
    const result = classic.compileRmtClassicAstResult(ast, { sourceProfile: profile });
    assert.equal(result.ok, false); assert.equal(result.phase, 'ast');
    assert.equal(result.coreDocument, null); assert.equal(result.coreJson, null); assert.equal(result.orchestrationArtifacts, null);
  }
});

test('unsupported source profiles fail closed and do not execute accessor metadata', () => {
  let accessed = false;
  const accessor = Object.defineProperty({ version: '1.0.0' }, 'syntax', { enumerable: true, get() { accessed = true; return 'rmtx'; } });
  const hidden = Object.defineProperty({ syntax: 'rmtx' }, 'version', { value: '1.0.0', enumerable: false });
  for (const sourceProfile of [null, '', [], {}, { syntax: 'rmtx' }, { syntax: 'tsx', version: '1.0.0' },
    { syntax: 'rmtx', version: '8.0.0' }, { ...profile, execute: true }, accessor, hidden,
    Object.assign(Object.create({ inherited: true }), profile), { ...profile, [Symbol('extra')]: true }]) {
    assert.throws(() => classic.compileRmtClassicAstResult(parse().ast, { sourceProfile }), { code: 'rmt.compiler.source-profile.unsupported' });
  }
  assert.equal(accessed, false);
});

test('legacy Source and Core-only AST APIs retain their Classic identity and throwing contract', () => {
  const parsed = parse();
  const normal = classic.compileRmtClassicAst(parsed.ast);
  assert.deepEqual(classic.compileRmtClassicAst(parsed.ast, { sourceProfile: profile }), normal);
  assert.equal(classic.compileRmtClassicSource(source, { sourceProfile: profile }).coreDocument.manifest.sourceSyntax, 'rmt-vnext');
  const invalid = parse().ast; invalid.body[0].unexpected = true;
  assert.throws(() => classic.compileRmtClassicAst(invalid), { code: 'rmt.vnext.ast.compilation_failed', phase: 'ast' });
});

test('the standalone result APIs do not expand the existing compiler factory ports', () => {
  const ast = parse().ast;
  for (const compiler of [classic.createRmtClassicCompiler({ sourceProfile: profile }), backend.createRmtVNextCompiler({ sourceProfile: profile })]) {
    assert.equal(Object.hasOwn(compiler, 'compileAstResult'), false);
    assert.equal(compiler.compileAst(ast).manifest.sourceSyntax, 'rmt-vnext');
  }
  for (const compile of [classic.compileRmtClassicAstResult, backend.compileRmtVNextAstResult]) {
    const result = compile(ast, { sourceProfile: profile });
    assert.equal(result.ok, true); assert.equal(result.coreDocument.manifest.sourceSyntax, 'rmtx');
  }
});

test('full AST result retains valid binding sidecars and rejects invalid bindings before use', () => {
  const root = path.resolve(__dirname, '../..');
  const text = fs.readFileSync(path.join(root, 'development/rmtx-a02/controlled-filters.rmt'), 'utf8');
  const bindings = JSON.parse(fs.readFileSync(path.join(root, 'development/rmtx-a02/bindings.v1.json'), 'utf8'));
  const parsed = parseRmtClassicSource({ text }); assert(parsed.ok);
  const result = classic.compileRmtClassicAstResult(parsed.ast, { xtensionBindings: bindings, sourceProfile: profile });
  assert(result.ok, JSON.stringify(result.diagnostics)); assert.deepEqual(result.xtensionBindings, bindings);
  const invalid = JSON.parse(JSON.stringify(bindings)); invalid.bindings[0].binding.props.query.state = 'missing';
  const rejected = classic.compileRmtClassicAstResult(parsed.ast, { xtensionBindings: invalid, sourceProfile: profile });
  assert.equal(rejected.ok, false); assert.equal(rejected.phase, 'xtension-bindings');
  assert.equal(rejected.coreDocument, null); assert.equal(rejected.coreJson, null); assert.equal(rejected.orchestrationArtifacts, null);
});
