'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { buildXTensionPlatform } = require('../../xtend-maraca/xtension-platform-build');
const root = path.resolve(__dirname, '../..');
let directory;
const platforms = new Map();
test.before(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-platform-profiles-')); });
test.after(() => { fs.rmSync(directory, { recursive: true, force: true }); });
async function platform(version) {
  if (!platforms.has(version)) platforms.set(version, (async () => {
    const built = await buildXTensionPlatform({ rootDir: root, outputDir: path.join(directory, String(version)),
      xtensionComposition: { schema: `xtend.maraca.xtension-composition-manifest.v${version}`, providers: [] } }, require('rollup'));
    return { built, api: (await import(pathToFileURL(built.path).href)).default };
  })());
  return platforms.get(version);
}

test('legacy manifest profiles expose no projection capability and capture only its fail-closed guard', async () => {
  for (let version = 1; version <= 7; version++) {
    const { built, api } = await platform(version);
    assert.equal(api.bindingsRuntime.XTENSION_PROJECTION_STATE_BINDING_API_VERSION, undefined);
    assert.equal(api.bindingsRuntime.createXTensionProjectionStateRegistry, undefined);
    assert.equal(built.sourceFiles.some(file => file.source === 'compiler/xtensions/state-binding-projection.js'), false);
    assert.equal(built.sourceFiles.some(file => file.source === 'compiler/xtensions/state-binding-projection-disabled.js'), true);
    assert.equal(built.sourceFiles.some(file => file.source === 'maraca/xtension-component-binding.mjs'), version >= 6);
    assert.equal(built.sourceFiles.some(file => file.source === 'maraca/xtension-component-binding-disabled.mjs'), version <= 5);
  }
});

test('legacy platform still materializes typed nested binding3 hosts and rejects Source4 projection data', async () => {
  const { api } = await platform(7);
  const input = await require('../../development/rmtx-a06/keyed-profile/reference.cjs').createInput(path.join(directory, 'unused'));
  const { createRmtxCompiler } = require('../../tools/rmt-language/rmtx-compiler');
  const result = require('../../xtend-maraca').createMaracaBuildPlan(input, { rootDir: root, inspectToolchain: false,
    compileSource: createRmtxCompiler({ syntaxVersion: '3.0.0' }).compileSource });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const validated = api.bindingsRuntime.validateStateBindingArtifact(result.xtensionBindings, result.orchestration.artifact);
  const states = Object.fromEntries(result.orchestration.artifact.state.states.map(state => [state.id, state.initial]));
  const entries = api.bindingsRuntime.materializeStateBindingArtifact(validated, { states });
  assert.equal(entries.length, 6); assert(entries.some(entry => entry.binding.address.keys[1] === 1));
  assert(entries.some(entry => entry.binding.address.keys[1] === '1'));
  const reference = require('../../development/rmtx-a06/orchestration-profile/reference.cjs');
  const projected = createRmtxCompiler({ syntaxVersion: '4.0.0', componentInterfaceCatalog: reference.catalog() }).compileSource(
    { text: fs.readFileSync(path.join(root, reference.source), 'utf8'), filePath: reference.source });
  assert.equal(projected.ok, true, JSON.stringify(projected.diagnostics));
  assert.throws(() => api.bindingsRuntime.validateStateBindingArtifact(projected.xtensionBindings, projected.orchestrationArtifacts), /Source4 platform profile/);
});

test('only manifest8 captures the real evaluator and materializes actual Source4 selector projections', async () => {
  const { built, api } = await platform(8);
  assert.equal(api.bindingsRuntime.XTENSION_PROJECTION_STATE_BINDING_API_VERSION, '3.0.0');
  assert.equal(typeof api.bindingsRuntime.createXTensionProjectionStateRegistry, 'function');
  assert.equal(built.sourceFiles.some(file => file.source === 'compiler/xtensions/state-binding-projection.js'), true);
  assert.equal(built.sourceFiles.some(file => file.source === 'compiler/xtensions/state-binding-projection-disabled.js'), false);
  assert.equal(built.sourceFiles.some(file => file.source === 'maraca/xtension-component-binding.mjs'), true);
  assert.equal(built.sourceFiles.some(file => file.source === 'maraca/xtension-component-binding-disabled.mjs'), false);
  const reference = require('../../development/rmtx-a06/orchestration-profile/reference.cjs');
  const compiled = require('../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '4.0.0', componentInterfaceCatalog: reference.catalog() })
    .compileSource({ text: fs.readFileSync(path.join(root, reference.source), 'utf8'), filePath: reference.source });
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  const model = (await import('../../xtendrmt/rmt-state-selector-runtime.js')).createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state);
  const bindings = api.bindingsRuntime.validateStateBindingArtifact(compiled.xtensionBindings, compiled.orchestrationArtifacts);
  const entries = api.bindingsRuntime.materializeStateBindingArtifact(bindings, model.modelReader.snapshot());
  assert.equal(entries.length, 6);
  const registry = api.bindingsRuntime.createXTensionProjectionStateRegistry({ modelReader: model.modelReader,
    commandDispatcher: { dispatch() { throw Error('no intent is emitted by this projection probe'); } } });
  let props;
  const gallery = entries.find(entry => Object.hasOwn(entry.binding.props, 'images'));
  const instance = registry.bind(gallery.binding, () => ({ schema: 'xtend.xtensions.runtime-host-controller.v2', apiVersion: '2.0.0',
    mount(_target, initial) { props = initial; return { status: 'ok' }; }, update() { return { status: 'ok' }; },
    suspend() { return { status: 'ok' }; }, resume() { return { status: 'ok' }; }, unmount() { return { status: 'ok' }; } }));
  try { await instance.mount({}); assert.deepEqual(props.images, ['front', 'back']); }
  finally { await registry.dispose(); }
});
