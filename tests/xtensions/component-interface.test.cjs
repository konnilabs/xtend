'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), { createHash } = require('node:crypto');
const api = require('../../tools/xtensions/component-interface');
const build = require('../../tools/xtensions/component-interface-build');
const reference = require('../../development/rmtx-a06/two-host-reference.cjs');
const root = path.resolve(__dirname, '../..'), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const prepared = reference.prepareCase();
const request = (host, documentId) => ({ address: { documentId, declarationId: host.declarationId, keys: [] }, props: host.props, intents: host.intents });
test('provider interfaces produce immutable versioned catalog entries independent of call-site data', async () => {
  const { capture, lowered } = await prepared;
  assert.equal(api.COMPONENT_INTERFACE_API_VERSION, '1.0.0'); assert.equal(lowered.contractVersion, '2.0.0');
  assert.equal(capture.records.length, 2); assert(capture.records.every(record => Object.isFrozen(record.definition.props)));
  for (const host of lowered.hosts) assert.equal(capture.catalog.resolve(hostReference(host)).definition.componentVersion, '2.0.0');
});
function hostReference(host) { return { providerId: host.providerId, interfaceVersion: host.interfaceVersion, interfaceSha256: host.interfaceSha256, componentVersion: host.componentVersion }; }
for (const [label, mutate] of [
  ['unknown provider', h => { h.providerId = 'unknown'; }], ['wrong interface version', h => { h.interfaceVersion = '9.0.0'; }],
  ['wrong interface hash', h => { h.interfaceSha256 = '0'.repeat(64); }], ['old component version', h => { h.componentVersion = '1.0.0'; }]
]) test('catalog rejects ' + label, async () => {
  const { capture, lowered } = await prepared, host = structuredClone(lowered.hosts[0]); mutate(host);
  assert.throws(() => capture.catalog.resolve(hostReference(host)));
});
for (const [label, mutate] of [
  ['added title attribute', host => { host.props.title = { state: 'product', path: ['id'] }; }],
  ['caller-defined prop type', host => { host.props.selectedImageId.type = 'json'; }],
  ['missing required prop', host => { delete host.props.images; }],
  ['unknown event', host => { host.intents.unknown = { command: 'product.selectImage' }; }],
  ['caller-defined intent fields', host => { host.intents.selectImage.fields = { imageId: { type: 'json' } }; }],
  ['unknown mapped source', host => { host.intents.selectImage.payload = { imageId: 'missing' }; }],
  ['duplicate mapped source', host => { host.intents.selectImage.payload = { a: 'imageId', b: 'imageId' }; }]
]) test('provider contract rejects ' + label, async () => {
  const { capture, lowered } = await prepared, host = structuredClone(lowered.hosts[0]); mutate(host);
  assert.throws(() => api.resolveComponentBinding(capture.records[0].definition, request(host, lowered.documentId)));
});
test('Vue payload mapping derives Action field types from provider fields', async () => {
  const { capture, lowered } = await prepared, host = lowered.hosts[1], iface = capture.records[1].definition;
  const resolved = api.resolveComponentBinding(iface, request(host, lowered.documentId));
  assert.deepEqual(resolved.binding.intents.changeSort.fields, { sort: { type: 'string' } });
  assert.deepEqual(api.mapComponentIntent(iface, 'changeSort', { order: 'rating' }, resolved.routes.changeSort.payload), { sort: 'rating' });
  for (const value of [{ sort: 'rating' }, { order: 42 }, { order: 'rating', command: 'other' }, {}]) assert.throws(() => api.mapComponentIntent(iface, 'changeSort', value, { sort: 'order' }));
});
test('runtime prop guard rejects undeclared attributes and malformed nested values', async () => {
  const { capture } = await prepared, iface = capture.records[0].definition;
  assert(api.assertComponentProps(iface, { images: ['front'], selectedImageId: 'front' }));
  for (const value of [{ images: ['front'], selectedImageId: 'front', title: 'leak' }, { images: [42], selectedImageId: 'front' }, { images: [], selectedImageId: null }]) assert.throws(() => api.assertComponentProps(iface, value));
});
for (const [label, mutate] of [
  ['grants', value => { value.grants = { scheduler: true }; }], ['native children', value => { value.props.children = { type: 'json' }; }],
  ['capability prop', value => { value.props.xtension = { type: 'json' }; }], ['unbounded attributes', value => { value.ownership.attributes = 'all'; }],
  ['peer/framework mismatch', value => { value.framework = 'vue'; }], ['unknown value type', value => { value.props.images = { type: 'function' }; }]
]) test('interface rejects ' + label, async () => {
  const { capture } = await prepared, value = structuredClone(capture.records[0].definition); mutate(value); assert.throws(() => api.normalizeComponentInterface(value));
});
test('interface accessors are rejected without executing them', async () => {
  const { capture } = await prepared, value = structuredClone(capture.records[0].definition); let calls = 0;
  Object.defineProperty(value, 'props', { enumerable: true, get() { calls++; return {}; } });
  assert.throws(() => api.normalizeComponentInterface(value)); assert.equal(calls, 0);
});
test('formal declaration and runtime validator identify the same closed v1 profile', async () => {
  const schema = require('../../tools/xtensions/component-interface.v1.schema.json');
  const { capture } = await prepared;
  assert.equal(schema.$id, api.COMPONENT_INTERFACE_SCHEMA); assert.equal(schema.additionalProperties, false);
  for (const record of capture.records) {
    assert.deepEqual(Object.keys(record.definition).sort(), [...schema.required].sort());
    assert.equal(api.normalizeComponentInterface(record.definition).schema, schema.$id);
  }
  assert(!schema.definitions.valueRule.properties.type.enum.includes('function'));
  const invalid = structuredClone(capture.records[0].definition); invalid.props.title = { type: 'function' }; assert.throws(() => api.normalizeComponentInterface(invalid));
});
test('generated provider map typechecks actual providers, actual TSX candidate and negative call-sites', async () => {
  const { capture } = await prepared, ts = require('typescript');
  assert.equal(fs.readFileSync(path.join(root, 'development/rmtx-a06/two-host.types.d.ts'), 'utf8'), reference.renderTypes(capture.catalog));
  const files = capture.providers.map(row => path.join(root, row.entry.module)).concat(['tests/types/xtensions_component_interface.tsx', 'tests/types/xtensions_component_candidate.d.ts', 'development/rmtx-a06/two-host.candidate.tsx'].map(file => path.join(root, file)));
  const program = ts.createProgram(files, { noEmit: true, strict: true, allowJs: true, checkJs: true, jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022, types: [], skipLibCheck: true });
  const diagnostics = ts.getPreEmitDiagnostics(program); assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => '\n' }));
});
test('archived case v1 cannot silently acquire interface v2 semantics', async () => {
  const { capture } = await prepared; assert.throws(() => reference.lowerContract(require('../../development/rmtx-a06/two-host.contract.v1.json'), capture.catalog), /contract 2/);
});
test('capture binds metadata and code bytes; post-capture source replacement cannot change a factory', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-component-capture-'));
  try {
    const { capture } = await prepared, definition = structuredClone(capture.records[0].definition);
    const source = 'export function createComponent() { globalThis.__a06CaptureFactoryCalls = (globalThis.__a06CaptureFactoryCalls || 0) + 1; return function Original() {}; }';
    definition.entry = { module: './panel.mjs', exportName: 'createComponent', sha256: hash(source) };
    const text = JSON.stringify(definition); fs.writeFileSync(path.join(directory, 'panel.mjs'), source); fs.writeFileSync(path.join(directory, 'interface.json'), text);
    const options = { rootDir: directory, interfaces: [{ file: './interface.json', sha256: hash(text) }] };
    const snapshot = await build.captureComponentInterfaces(options);
    fs.writeFileSync(path.join(directory, 'panel.mjs'), 'throw new Error("replacement must never execute");');
    const factories = await snapshot.loadFactories(); assert.equal(globalThis.__a06CaptureFactoryCalls, undefined, 'capture and module loading do not initialize a component');
    assert.equal(factories[definition.providerId]({}).name, 'Original'); assert.equal(globalThis.__a06CaptureFactoryCalls, 1);
    await assert.rejects(build.captureComponentInterfaces(options), /code differs/);
    await assert.rejects(build.captureComponentInterfaces({ ...options, interfaces: [{ file: './interface.json', sha256: '0'.repeat(64) }] }), /interface bytes differ/);
    assert.throws(() => build.capturedComponentPlugin(JSON.parse(JSON.stringify(snapshot))), /actual component build capture/);
  } finally { delete globalThis.__a06CaptureFactoryCalls; fs.rmSync(directory, { recursive: true, force: true }); }
});
