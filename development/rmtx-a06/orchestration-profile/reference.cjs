'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const source = 'development/rmtx-a06/orchestration-profile/source.rmtx';
function providers() { return JSON.parse(fs.readFileSync(path.join(__dirname, 'providers.json'))); }
function createInput(outputDir) { return { source, out: path.resolve(outputDir), profile: 'production', orchestration: 'strict', kernel: 'strict',
  hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false, lazy: false, rmtxProviders: providers() }; }
function catalog() { return require('../../../tools/xtensions/component-interface-build').captureComponentInterfaceMetadata({ rootDir: root, interfaces: providers().interfaces }); }
async function build(outputDir) {
  return require('../../../xtend-maraca').buildMaracaBundleAsync(createInput(outputDir), { rootDir: root,
    compileSource: require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '4.0.0' }).compileSource });
}
function verifyCompileCases() {
  const compile = require('../../../tools/rmt-language/rmtx-compiler').compileRmtxSource;
  const text = fs.readFileSync(path.join(root, source), 'utf8'), componentInterfaceCatalog = catalog();
  const names = [], check = (name, input, options = {}) => {
    const result = compile({ text: input, filePath: source }, { syntaxVersion: '4.0.0', componentInterfaceCatalog, ...options });
    assert.equal(result.ok, false, name); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null);
    names.push(name);
  };
  check('source cannot select an uncaptured provider', text.replace('provider="react-product-gallery"', 'provider="untrusted-gallery"'));
  check('unknown props cannot fall through provider interfaces', text.replace('images: selectors.galleryImages', 'unknown: selectors.galleryImages'));
  check('inline props cannot execute arbitrary source calls', text.replace('images: selectors.galleryImages', 'images: selectors.galleryImages.filter(x => x)'));
  check('trusted parent keys cannot be replaced by provider fields', text.replace("payload: { imageId: 'imageId' }", "payload: { productId: 'imageId' }"));
  check('missing required props fail before a build', text.replace('productId: item.slug, sort: item.reviewsSort', 'productId: item.slug'));
  check('source declarations cannot be mixed with binding sidecars', text, { xtensionBindings: {} });
  check('host slots remain provider-owned', text.replace('intents={{ changeSort:', 'children="caller" intents={{ changeSort:'));
  check('keyless repeats have no positional fallback', text.replace(' keyBy={item.id}', ''));
  check('unknown selector reads are rejected', text.replace('selectors.galleryImages', 'selectors.missing'));
  check('native events cannot acquire a provider host', text.replace('<RMT.XTension id="product-reviews"', '<RMT.On event="click" action="reviews.sort" payload={{groupId:"detail.g",productId:"detail.p",sort:"detail.s"}}/><RMT.XTension id="product-reviews"'));
  return { passed: true, checks: names.length, names };
}
module.exports = { source, providers, catalog, createInput, build, verifyCompileCases };
