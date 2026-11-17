'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const reference = require('../../development/rmtx-a06/orchestration-profile/reference.cjs');
const { compileRmtxSource, createRmtxCompiler } = require('../../tools/rmt-language/rmtx-compiler');
const { createMaracaBuildPlan, createMaracaTuneConfig } = require('../../xtend-maraca');
const { materializeStateBindingArtifact } = require('../../tools/xtensions/state-binding-artifact');
const rootDir = path.resolve(__dirname, '../..'), filePath = path.join(rootDir, reference.source);
const text = fs.readFileSync(filePath, 'utf8'), componentInterfaceCatalog = reference.catalog();
const compile = (source = text, options = {}) => compileRmtxSource({ text: source, filePath }, { syntaxVersion: '4.0.0', componentInterfaceCatalog, ...options });
const accepted = value => { assert.equal(value.ok, true, JSON.stringify(value.diagnostics)); return value; };
function plan(source = text, extra = {}, callback = createRmtxCompiler({ syntaxVersion: '4.0.0' }).compileSource) {
  return createMaracaBuildPlan({ ...reference.createInput('/tmp/xtend-rmtx-inline-unit'), sourceText: source, virtualSourcePath: reference.source, ...extra },
    { rootDir, inspectToolchain: false, compileSource: callback });
}

test('inline declarations produce pinned manifests and bindings without host sidecars', async () => {
  const result = accepted(compile()), buildPlan = accepted(plan());
  assert.equal(result.xtensionBindings.schema, 'xtend.xtensions.state-binding-artifact.v4');
  assert.equal(result.xtensionComposition.schema, 'xtend.maraca.xtension-composition-manifest.v8');
  assert.equal(buildPlan.schema, 'xtend.maraca.build-plan.v8');
  assert.deepEqual(buildPlan.xtensionBindings, result.xtensionBindings);
  assert.deepEqual(buildPlan.xtensionComposition, require('../../xtend-maraca/xtension-composition-contract.mjs').normalizeManifest(result.xtensionComposition,
    { program: result.orchestrationArtifacts, bindings: result.xtensionBindings }));
  assert.equal(result.parserResult.components.hosts.length, 2);
  assert(result.xtensionBindings.bindings.every(entry => entry.repeat.length === 2 && entry.presence && entry.binding.schema === 'xtend.xtensions.state-binding.v3'));
  const { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const model = createRmtStateSelectorRuntime({ states: result.orchestrationArtifacts.state.states, selectors: result.orchestrationArtifacts.state.selectors });
  const snapshot = model.snapshot(), entries = materializeStateBindingArtifact(result.xtensionBindings, snapshot);
  assert.equal(entries.length, 6);
  assert.deepEqual(entries.filter(entry => entry.binding.address.declarationId === 'product-gallery').map(entry => entry.binding.address.keys), [['g', 1], ['g', '1'], ['h', 1]]);
  model.dispose?.();
});

test('props readsets include all conditional branches and transitive selector state reads', () => {
  const result = accepted(compile()), dependencies = result.componentDependencies;
  assert.equal(dependencies.runtimeTracking, false); assert.equal(dependencies.runtimeSubscriptionsChanged, false);
  const gallery = dependencies.declarations.find(entry => entry.declarationId === 'product-gallery');
  assert(gallery.reads.some(read => read.root === 'selector' && read.symbol === 'galleryImages'));
  assert(gallery.reads.some(read => read.root === 'state' && read.path.at(-1) === 'enabled'));
  assert(gallery.reads.some(read => read.root === 'state' && read.path.at(-1) === 'selectedImageId'));
  assert(gallery.transitiveStateReads.some(read => read.symbol === 'sharedImages'));
  assert.equal(Object.isFrozen(dependencies.declarations), true);
});

test('inline source rejects unsupported capabilities, expressions and ownership before build', () => {
  assert.equal(reference.verifyCompileCases().checks, 10);
  for (const source of [
    text.replace('selectedImageId: item.enabled', 'selectedImageId: item["enabled"]'),
    text.replace('selectedImageId: item.enabled', 'selectedImageId: item?.enabled'),
    text.replace('owner="product-details"', 'owner="missing"'),
    text.replace("props={{ productId: item.slug, sort: item.reviewsSort }}", "props={{ __proto__: item.slug, sort: item.reviewsSort }}"),
    text.replace('props={{ productId: item.slug', 'module="./untrusted.mjs" props={{ productId: item.slug')
  ]) assert.equal(compile(source).ok, false);
});

test('Maraca captures exact provider bytes and reparses actual source before authorizing inline hosts', () => {
  const compiled = accepted(compile());
  const forged = { ...compiled, xtensionBindings: {}, xtensionComposition: {} };
  assert.deepEqual(accepted(plan(text, {}, () => forged)).xtensionBindings, compiled.xtensionBindings);
  assert.equal(plan('not source', {}, () => compiled).ok, false);
  const pins = structuredClone(reference.providers()); pins.interfaces[0].sha256 = '0'.repeat(64);
  assert.equal(plan(text, { rmtxProviders: pins }).ok, false);
  assert.equal(plan(text, { xtensionComposition: compiled.xtensionComposition }).ok, false);
  assert.equal(plan(text, { xtensionBindings: compiled.xtensionBindings }).ok, false);
  let reads = 0;
  const accessor = Object.defineProperty({}, 'schema', { enumerable: true, get() { reads++; return 'xtend.maraca.rmtx-providers.v1'; } });
  assert.equal(plan(text, { rmtxProviders: accessor }).ok, false); assert.equal(reads, 0);
});

test('pinned source registries require the new config and frontend profile', () => {
  const config = createMaracaTuneConfig({ options: { rmtxProviders: reference.providers() } });
  assert.equal(config.schema, 'xtend.maraca.build-config.v8');
  const compiled = accepted(compile());
  const downgrade = plan(text, {}, () => ({ ...compiled, schema: 'xtend.rmtx.compile-result.v3', sourceProfile: { syntax: 'rmtx', version: '3.0.0' } }));
  assert.equal(downgrade.ok, false);
});
