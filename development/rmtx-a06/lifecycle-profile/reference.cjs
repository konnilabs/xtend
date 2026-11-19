'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const source = 'development/rmtx-a06/lifecycle-profile/source.rmtx';
const nativeOnlySource = 'development/rmtx-a06/lifecycle-profile/native-only.rmtx';
function providers() { return require('../orchestration-profile/reference.cjs').providers(); }
function catalog() { return require('../orchestration-profile/reference.cjs').catalog(); }
function createInput(outputDir, nativeOnly = false) {
  return { source: nativeOnly ? nativeOnlySource : source, out: path.resolve(outputDir), profile: 'production', rmtxSyntaxVersion: '6.0.0',
    orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false, lazy: false,
    ...(nativeOnly ? {} : { rmtxProviders: providers() }) };
}
function compiler() { return require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '6.0.0' }); }
function build(outputDir, nativeOnly = false) {
  return require('../../../xtend-maraca').buildMaracaBundleAsync(createInput(outputDir, nativeOnly), { rootDir: root, compileSource: compiler().compileSource });
}
function verifyCompileCases() {
  const text = fs.readFileSync(path.join(root, source), 'utf8'), names = [];
  const check = (name, input, options = {}) => {
    const result = compiler().compileSource({ text: input, filePath: source }, { componentInterfaceCatalog: catalog(), ...options });
    assert.equal(result.ok, false, name); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null); names.push(name);
  };
  check('Source5 cannot opt into lifecycle guards', text, { syntaxVersion: '5.0.0' });
  check('a guard cannot target an inner DOM node', text.replace('target="product-details" when=', 'target="product-header" when='));
  check('lifecycle guards cannot execute source calls', text.replace('when={model.nativeView.show}', 'when={model.nativeView.show.valueOf()}'));
  check('nonboolean literal guards fail before artifacts', text.replace('when={model.nativeView.show}', 'when={1}'));
  check('guarded content admission uses the visible lane', text.replace('name="visible"><RMT.Mount target="product-details"', 'name="idle"><RMT.Mount target="product-details"'));
  check('guarded Mount has no Source child', text.replace('when={model.nativeView.show} />', 'when={model.nativeView.show}><RMT.Source kind="state" target="nativeView"/></RMT.Mount>'));
  check('provider interfaces stay captured', text.replace('provider="react-product-gallery"', 'provider="unknown-gallery"'));
  return { passed: true, checks: names.length, names };
}
module.exports = { source, nativeOnlySource, providers, catalog, createInput, compiler, build, verifyCompileCases };
