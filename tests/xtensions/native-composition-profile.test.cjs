'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { createHash } = require('node:crypto'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-native-composition-'));
const bindingsRuntime = require('../../tools/xtensions/state-binding');
const reference = require('../../development/rmtx-a06/orchestration-profile/reference.cjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const copy = value => structuredClone(value);
function compiled() {
  const text = fs.readFileSync(path.join(root, reference.source), 'utf8');
  const result = require('../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '5.0.0', componentInterfaceCatalog: reference.catalog() }).compileSource({ text, filePath: reference.source });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  return { schema: 'xtend.maraca.build-plan.v9', ok: true, sourceHash: sha(text), orchestration: { enabled: true, artifact: result.orchestrationArtifacts },
    xtensionBindings: result.xtensionBindings, xtensionComposition: result.xtensionComposition };
}
let built;
async function companion() {
  if (!built) built = (async () => {
    const plan = compiled(), report = await require('../../xtend-maraca/xtension-composition').buildMaracaXTensionComposition({ plan, manifest: plan.xtensionComposition, bindingsRuntime, rootDir: root, outputDir: path.join(temporary, 'companion') });
    return { plan, report };
  })();
  return built;
}
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
test('actual Source5 compilation builds captured native manifest9/artifact10 through the existing provider graph', async () => {
  const { plan, report } = await companion(), contract = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  assert.equal(require('../../xtend-maraca/xtension-composition').XTENSION_COMPOSITION_BUILD_API_VERSION, '14.0.0');
  assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v10'); assert.equal(report.apiVersion, '10.0.0');
  assert.equal(report.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v10');
  assert.equal(report.artifact.plan.schema, 'xtend.maraca.build-plan.v9'); assert.equal(report.artifact.plan.program.schema, 'xtend.rmt.app-orchestration.v3');
  assert.equal(report.artifact.plan.bindings.schema, 'xtend.xtensions.state-binding-artifact.v5'); assert.equal(report.artifact.manifest.schema, 'xtend.maraca.xtension-composition-manifest.v9');
  assert.equal(report.runtimeExecutionVerified, false); assert.equal(report.artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v2');
  assert(report.artifact.loadPlan.providers.every(row => row.phase === 'kernel.fabric.mount')); assert(report.deliveryFile);
  assert(report.files.some(row => row.fileName.startsWith('interfaces/'))); assert(report.files.some(row => row.fileName.startsWith('providers/modules/')));
  assert.deepEqual(contract.validateArtifact(report.artifact, plan, bindingsRuntime), report.artifact);
});
test('native composition profile requires registry4 and refuses every mixed plan/artifact/manifest pair', async () => {
  const { plan, report } = await companion(), contract = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  for (const runtime of [{ ...bindingsRuntime, XTENSION_NATIVE_STATE_BINDING_API_VERSION: undefined }, { ...bindingsRuntime, createXTensionNativeStateRegistry: undefined }])
    assert.throws(() => contract.planIdentity(plan, runtime), /native state-binding API4/);
  for (const change of [value => { value.schema = 'xtend.maraca.xtension-composition-artifact.v9'; }, value => { value.apiVersion = '9.0.0'; }, value => { value.plan.schema = 'xtend.maraca.build-plan.v8'; }, value => { value.manifest.schema = 'xtend.maraca.xtension-composition-manifest.v8'; }]) {
    const invalid = copy(report.artifact); change(invalid); assert.throws(() => contract.validateArtifact(invalid, plan, bindingsRuntime));
  }
  const identity = contract.planIdentity(plan, bindingsRuntime);
  assert.throws(() => contract.normalizeManifest({ ...plan.xtensionComposition, schema: 'xtend.maraca.xtension-composition-manifest.v8' }, identity), /matching build-plan/);
  assert.throws(() => contract.normalizeManifest(plan.xtensionComposition, { ...identity, schema: 'xtend.maraca.build-plan.v8' }), /matching build-plan/);
  assert.throws(() => contract.normalizeManifest(plan.xtensionComposition, { ...identity, program: { ...identity.program, schema: 'xtend.rmt.app-orchestration.v2' } }), /program3/);
});
test('native port7 uses the captured provider interface and rejects SSR before constructing provider hosts', async () => {
  const { plan, report } = await companion(), runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs');
  const installedPlan = { ...plan, xtensionComposition: report.artifact }, actualCompanion = await import(pathToFileURL(report.entryPath).href);
  const options = { plan: installedPlan, companion: actualCompanion, bindingsRuntime, componentInterfaceRuntime: require('../../tools/xtensions/component-interface'),
    adapters: {}, loadPeerGroup() { throw new Error('Contract creation must not load peers.'); }, grants: Object.fromEntries(report.artifact.manifest.hosts.map(host => [host.declarationId, {}])) };
  assert.equal(runtime.XTENSION_COMPOSITION_API_VERSION, '11.0.0');
  assert.throws(() => runtime.createMaracaXTensionCompositionPort({ ...options, ssr: {} }), /Source5.*SSR/);
  const port = runtime.createMaracaXTensionCompositionPort(options); assert.equal(port.schema, 'xtend.maraca.xtension-composition-port.v7'); assert(Object.isFrozen(port));
  const forged = copy(report.artifact); forged.manifest.hosts[0].intents.unknown = {};
  assert.throws(() => runtime.createMaracaXTensionCompositionPort({ ...options, companion: { ...actualCompanion, artifact: forged } }));
});
test('only native manifest9 exposes registry4; manifest8 keeps projection3 and neither captures the native projector', async () => {
  const { buildXTensionPlatform } = require('../../xtend-maraca/xtension-platform-build');
  for (const version of [8, 9]) {
    const result = await buildXTensionPlatform({ rootDir: root, outputDir: path.join(temporary, 'platform-' + version), xtensionComposition: { schema: 'xtend.maraca.xtension-composition-manifest.v' + version, providers: [] } }, require('rollup'));
    const api = (await import(pathToFileURL(result.path).href)).default;
    assert.equal(api.bindingsRuntime.XTENSION_STATE_BINDING_API_VERSION, '2.4.0'); assert.equal(api.bindingsRuntime.XTENSION_PROJECTION_STATE_BINDING_API_VERSION, '3.0.0');
    assert.equal(api.bindingsRuntime.XTENSION_NATIVE_STATE_BINDING_API_VERSION, version === 9 ? '4.0.0' : undefined);
    assert.equal(typeof api.bindingsRuntime.createXTensionNativeStateRegistry, version === 9 ? 'function' : 'undefined');
    assert(result.sourceFiles.some(file => file.source === 'compiler/xtensions/state-binding-projection.js'));
    assert(!result.sourceFiles.some(file => file.source.includes('native-view-projection')));
  }
});
test('deferred projection/native provider graphs reject namespace then before emitting any code', async () => {
  const directory = path.join(temporary, 'thenable'); fs.mkdirSync(directory);
  const source = Buffer.from('export function createPanel() {}\nexport function then() {}\n'), file = './provider.mjs'; fs.writeFileSync(path.join(directory, file), source);
  for (const version of [8, 9]) {
    const manifest = { schema: 'xtend.maraca.xtension-composition-manifest.v' + version, modules: [{ module: file, sha256: sha(source) }], providers: [{ id: 'panel', entry: { module: file, exportName: 'createPanel' } }] };
    await assert.rejects(require('../../xtend-maraca/xtension-provider-graph').captureProviderGraph(directory, manifest), /cannot export then/);
  }
});
function nativeConfig() {
  const plan = compiled();
  return { schema: 'xtend.maraca.browser-composition-root.v11', buildPlanSchema: 'xtend.maraca.build-plan.v9', sourceHash: plan.sourceHash,
    orchestration: { enabled: true, artifact: plan.orchestration.artifact }, components: [], surfaces: [] };
}
test('native-only browser11 keeps its profile without composition and older browser5 stays unchanged', async () => {
  const runtime = await import('../../xtend-maraca/browser-composition-runtime.mjs');
  const native = runtime.createMaracaBrowserCompositionRoot(nativeConfig()), old = runtime.createMaracaBrowserCompositionRoot({});
  assert.equal(runtime.MARACA_XTENSION_BROWSER_API_VERSION, '11.0.0'); assert.equal(native.schema, 'xtend.maraca.browser-composition-root.v11'); assert.equal(native.apiVersion, '11.0.0');
  assert.equal(native.facade.snapshot().schema, 'xtend.maraca.plan-runtime.v14'); assert.equal(old.schema, 'xtend.maraca.browser-composition-root.v5'); assert.equal(old.apiVersion, '5.0.0');
  assert.throws(() => runtime.createMaracaBrowserCompositionRoot({ ...nativeConfig(), buildPlanSchema: 'xtend.maraca.build-plan.v8' }), /Native browser11/);
  assert.throws(() => runtime.createMaracaBrowserCompositionRoot({ ...nativeConfig(), schema: 'xtend.maraca.browser-composition-root.v10' }), /Native browser11/);
});
test('native browser rejects explicit and implicit SSR before renderer or DOM metadata mutation', async () => {
  const { JSDOM } = require('jsdom'), runtime = await import('../../xtend-maraca/browser-composition-runtime.mjs');
  const dom = new JSDOM('<!doctype html><main data-maraca-root data-rmt-resume-root="true"><span>preserved</span></main>'), element = dom.window.document.querySelector('main');
  const before = dom.window.document.documentElement.outerHTML; let rendererCalls = 0;
  const native = runtime.createMaracaBrowserCompositionRoot(nativeConfig(), { windowTarget: dom.window, documentTarget: dom.window.document, nativeViewRuntimePort: require('../../tools/xtensions/native-view-projection') });
  try {
    const options = { root: element, fabric: { runFiber() {} }, get domRenderer() { rendererCalls++; throw new Error('must not create renderer'); } };
    await assert.rejects(native.boot(options), /Source5.*SSR/); assert.equal(rendererCalls, 0); assert.equal(dom.window.document.documentElement.outerHTML, before);
    for (const override of [{ adoptExisting: true }, { ssrResponse: {} }, { ssr: {} }, { xtensions: { ssr: {} } }]) await assert.rejects(native.boot({ ...override }), /Source5.*SSR/);
    assert.equal(dom.window.document.documentElement.outerHTML, before);
  } finally { dom.window.close(); }
});
test('native browser forwards plan9/native-view/Fabric ports without inventing a composition', async () => {
  const { JSDOM } = require('jsdom'), runtime = await import('../../xtend-maraca/browser-composition-runtime.mjs');
  const dom = new JSDOM('<!doctype html><main data-maraca-root></main>'), element = dom.window.document.querySelector('main');
  const nativeView = require('../../tools/xtensions/native-view-projection'), stop = new Error('configuration-seam-observed'); let received, externalKernelDisposed = false;
  const fabric = { runFiber() {} }, kernel = { dispose() { externalKernelDisposed = true; } }, renderer = { commit() { throw new Error('No View commit is needed at this configuration seam.'); }, dispose() {} };
  const namedState = { selection: 'named' }, defaultAction = { selection: 'default' }, namespaceEvents = { selection: 'namespace' };
  const native = runtime.createMaracaBrowserCompositionRoot(nativeConfig(), { windowTarget: dom.window, documentTarget: dom.window.document, nativeViewRuntimePort: nativeView,
    runtimeModuleApis: {
      'xtendrmt/rmt-state-selector-runtime.js': { XTendRmtStateSelectorRuntime: namedState },
      'xtendrmt/rmt-action-effect-runtime.js': { default: defaultAction },
      'xtendrmt/rmt-event-routing-runtime.js': namespaceEvents
    },
    createPlanRuntime(options) { received = options; throw stop; } });
  try {
    await assert.rejects(native.boot({ root: element, fabric, kernelController: kernel, domRenderer: renderer }), error => error === stop);
    assert.equal(received.plan.schema, 'xtend.maraca.build-plan.v9'); assert.equal(received.plan.orchestration.artifact.schema, 'xtend.rmt.app-orchestration.v3');
    assert.equal(Object.hasOwn(received.plan, 'xtensionComposition'), false); assert.equal(received.nativeViewRuntimePort, nativeView); assert.equal(received.fabric, fabric); assert.equal(received.kernelController, kernel); assert.equal(externalKernelDisposed, false);
    const loaded = await received.moduleLoaderPort.load();
    assert.equal(loaded.state, namedState); assert.equal(loaded.action, defaultAction); assert.equal(loaded.events, namespaceEvents);
  } finally { dom.window.close(); }
});
test('native host adapter exposes read-only SSR inspection and forwards the same Fabric scheduler authority', async () => {
  const { JSDOM } = require('jsdom'), api = await import('../../xtend-maraca/browser-host-adapter.mjs');
  const dom = new JSDOM('<!doctype html><main data-rmt-resume-root="true"></main>'); const element = dom.window.document.querySelector('main'); let received;
  try {
    const dependencies = { windowTarget: dom.window, documentTarget: dom.window.document, runtimeApis: { XTendRmtKernelOrchestrationController: { createRmtKernelOrchestrationController(options) { received = options; return { boot() {} }; } } } };
    const native = api.createMaracaBrowserHostAdapter({ schema: 'xtend.maraca.browser-composition-root.v11', kernel: { enabled: true, artifact: {} } }, dependencies);
    const old = api.createMaracaBrowserHostAdapter({}, dependencies), before = dom.window.document.documentElement.outerHTML;
    assert.equal(api.MARACA_BROWSER_HOST_API_VERSION, '3.0.0'); assert.equal(native.schema, 'xtend.maraca.browser-host-adapter.v3'); assert.equal(old.schema, 'xtend.maraca.browser-host-adapter.v2'); assert.equal(old.inspectServerShell, undefined);
    assert.equal(native.inspectServerShell(element).active, true); assert.equal(dom.window.document.documentElement.outerHTML, before);
    const fabric = { runFiber() {} }, scheduler = { schedule() {} }; native.createKernelController({ fabric, kernelScheduler: scheduler }); assert.equal(received.fabric, fabric); assert.equal(received.kernelScheduler, scheduler);
  } finally { dom.window.close(); }
});
