'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const source = 'development/rmtx-a06/native-view-profile/source.rmtx';
const nativeOnlySource = 'development/rmtx-a06/native-view-profile/native-only.rmtx';
// Preserve the exact provider interfaces and code identities already accepted
// by Source4. The Native profile contributes no new provider authority.
function providers() { return require('../orchestration-profile/reference.cjs').providers(); }
function catalog() { return require('../orchestration-profile/reference.cjs').catalog(); }
function createInput(outputDir, nativeOnly = false) {
  return { source: nativeOnly ? nativeOnlySource : source, out: path.resolve(outputDir), profile: 'production',
    rmtxSyntaxVersion: '5.0.0',
    orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off',
    pwa: false, services: false, lazy: false, ...(nativeOnly ? {} : { rmtxProviders: providers() }) };
}
function compiler() { return require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '5.0.0' }); }
async function build(outputDir, nativeOnly = false) {
  return require('../../../xtend-maraca').buildMaracaBundleAsync(createInput(outputDir, nativeOnly), { rootDir: root, compileSource: compiler().compileSource });
}
function verifyCompileCases() {
  const compile = require('../../../tools/rmt-language/rmtx-compiler').compileRmtxSource;
  const text = fs.readFileSync(path.join(root, source), 'utf8'), componentInterfaceCatalog = catalog(), names = [];
  const check = (name, input, options = {}) => {
    const result = compile({ text: input, filePath: source }, { syntaxVersion: '5.0.0', componentInterfaceCatalog, ...options });
    assert.equal(result.ok, false, name); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null); names.push(name);
  };
  check('native text never runs arbitrary JavaScript', text.replace('value={model.nativeView.title}', 'value={model.nativeView.title.toUpperCase()}'));
  check('native markup cannot create script elements', text.replace('tag="h1"', 'tag="script"'));
  check('native markup cannot forge a Surface owner marker', text.replace("'data-native-heading':'title'", "'data-rmt-surface':'product-details'"));
  check('native markup cannot create DOM event callbacks', text.replace("'data-native-heading':'title'", "onclick:'run()'"));
  check('native markup cannot use raw HTML properties', text.replace('properties={{value:item.slug}}', "properties={{innerHTML:'<script>'}}"));
  check('native loops always require explicit stable keys', text.replace('<RMT.Repeat from={model.catalog.items} keyBy={item.id}>', '<RMT.Repeat from={model.catalog.items}>'));
  check('native loop elements cannot duplicate DOM ids', text.replace("'data-native-slug':item.slug", "id:'repeated'"));
  check('native portal DOM ids cannot be dynamic', text.replace("id:'gallery-target'", 'id:model.nativeView.title'));
  check('native portal DOM ids cannot contain selector punctuation', text.replace("id:'gallery-target'", "id:'gallery.target'"));
  check('provider hosts cannot acquire caller-owned native children', text.replace('<RMT.XTension id="product-gallery"', '<RMT.View><RMT.Text value="forbidden"/></RMT.View><RMT.XTension id="product-gallery"'));
  check('new native source does not silently compile as Source4', text, { syntaxVersion: '4.0.0' });
  check('external provider authority remains pinned', text.replace('provider="react-product-gallery"', 'provider="unknown-provider"'));
  return { passed: true, checks: names.length, names };
}
module.exports = { source, nativeOnlySource, providers, catalog, compiler, createInput, build, verifyCompileCases };
