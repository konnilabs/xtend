'use strict';
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
async function createInput(outputDir) {
  const input = await require('../scoped-reference.cjs').createInput(outputDir);
  input.source = 'development/rmtx-a06/keyed-profile/source.rmtx';
  input.xtensionBindings.documentId = 'rmtx-keyed-products';
  for (const entry of input.xtensionBindings.bindings) {
    delete entry.repeat;
    delete entry.presence;
    entry.binding.address.documentId = input.xtensionBindings.documentId;
  }
  return input;
}
async function build(outputDir) {
  const compiler = require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '3.0.0' });
  return require('../../../xtend-maraca').buildMaracaBundleAsync(await createInput(outputDir), { rootDir: root, compileSource: compiler.compileSource });
}
function verifyCompileCases(compiler, text, filePath, xtensionBindings) {
  const assert = require('node:assert/strict'), ts = require('typescript');
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initial;
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'RMT.State') {
      const attributes = node.attributes.properties;
      if (attributes.some(attribute => attribute.name?.text === 'id' && attribute.initializer?.text === 'catalog'))
        initial = attributes.find(attribute => attribute.name?.text === 'initial').initializer.expression;
    }
    ts.forEachChild(node, visit);
  }
  visit(source); assert(initial);
  const base = compiler.compileSource({ text, filePath }, { xtensionBindings }); assert.equal(base.ok, true);
  const catalog = base.orchestrationArtifacts.state.states.find(state => state.id === 'catalog').initial;
  const names = [];
  function probe(name, change, valid) {
    const value = structuredClone(catalog); change(value);
    const candidate = text.slice(0, initial.getStart(source)) + JSON.stringify(value) + text.slice(initial.end);
    const result = compiler.compileSource({ text: candidate, filePath }, { xtensionBindings });
    assert.equal(result.ok, valid, name + ': ' + JSON.stringify(result.diagnostics));
    if (!valid) {
      assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null); assert.equal(result.xtensionBindings, null);
    } else {
      const states = Object.fromEntries(result.orchestrationArtifacts.state.states.map(state => [state.id, state.initial]));
      assert.equal(require('../../../tools/xtensions/state-binding-artifact').materializeStateBindingArtifact(result.xtensionBindings, { states }).length, 0);
    }
    names.push(name);
  }
  probe('duplicate keys in one parent fail before any executable artifact escapes', value => value.items[0].products.push(structuredClone(value.items[0].products[0])), false);
  probe('boolean item keys are outside the existing typed key contract', value => { value.items[0].products[0].id = true; }, false);
  probe('missing item keys fail closed', value => { delete value.items[0].products[0].id; }, false);
  probe('presence requires an actual boolean Model value', value => { value.items[0].products[0].enabled = 'true'; }, false);
  probe('empty root collections retain valid source scopes without hosts', value => { value.items = []; }, true);
  probe('empty nested collections retain valid source scopes without hosts', value => { value.items.forEach(group => { group.products = []; }); }, true);
  const unbound = compiler.compileSource({ text, filePath });
  assert.equal(unbound.ok, false); assert.equal(unbound.orchestrationArtifacts, null);
  names.push('source host scopes cannot silently become unbound native repeats');
  return { passed: true, checks: names.length, names };
}
module.exports = { createInput, build, verifyCompileCases };
