'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '../..'), hash = value => createHash('sha256').update(value).digest('hex');
const reference = require('../../development/rmtx-a06/native-orchestration-profile/reference.cjs');
const bindingsRuntime = require('../../tools/xtensions/state-binding').ORCHESTRATED_STATE_BINDING_RUNTIME;
const componentInterfaceRuntime = require('../../tools/xtensions/component-interface');
const reactRuntime = require('../../tools/xtensions/react-runtime-adapter'), vueRuntime = require('../../tools/xtensions/vue-runtime-adapter');
const React = require('react'), ReactDOM = {...require('react-dom/client'), version: require('react-dom').version}, Vue = require('vue');
let prepared;
async function captured() {
  if (!prepared) prepared = (async () => {
    const source = fs.readFileSync(path.join(root, reference.source), 'utf8');
    const catalog = reference.catalog(), compiled = reference.compiler().compileSource({text: source, filePath: reference.source}, {componentInterfaceCatalog: catalog});
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    const plan = {schema: 'xtend.maraca.build-plan.v11', ok: true, sourceHash: hash(source), orchestration: {enabled: true, artifact: compiled.orchestrationArtifacts}, xtensionBindings: compiled.xtensionBindings, xtensionComposition: compiled.xtensionComposition};
    const contract = await import('../../xtend-maraca/xtension-composition-contract.mjs');
    const identity = contract.planIdentity(plan, bindingsRuntime), manifest = contract.normalizeManifest(compiled.xtensionComposition, identity);
    // This is the same pure byte capture used by the companion builder. It
    // executes neither providers nor a bundler and writes no build artifacts.
    const graph = await require('../../xtend-maraca/xtension-provider-graph').captureProviderGraph(root, manifest);
    const artifact = {
      schema: 'xtend.maraca.xtension-composition-artifact.v12', apiVersion: '12.0.0', plan: identity, manifest,
      componentInterfaces: manifest.interfaces.map(pin => {
        const record = catalog.records.find(row => row.definition.providerId === pin.providerId);
        return {definition: record.definition, interfaceSha256: record.interfaceSha256, moduleSha256: record.moduleSha256,
          sourceBytes: fs.readFileSync(path.join(root, pin.file)).length, fileName: `interfaces/${pin.providerId}-${pin.sha256}.json`};
      }), providers: graph.providers, modules: graph.modules,
      loadPlan: contract.createLoadPlan(manifest, graph.modules, graph.providers),
      entryFile: `xtend.xtensions-${hash(contract.canonical({identity, manifest}))}.mjs`, runtimeExecutionVerified: false
    };
    contract.validateArtifact(artifact, plan, bindingsRuntime);
    return {artifact, plan, runtime: await import('../../xtend-maraca/xtension-composition-runtime.mjs')};
  })();
  return prepared;
}
function deferred() { let resolve; const promise = new Promise(done => {resolve = done;}); return {promise, resolve}; }
const turn = () => new Promise(resolve => setImmediate(resolve));
async function fixture({namespaceWait, peerWait, peerEntered} = {}) {
  const {artifact, plan, runtime} = await captured(), stats = {namespace: 0, peers: 0, factory: 0, adapter: 0, boundary: 0, resources: 0};
  const actualFabric = require('../../fabric/xtend-fabric').createXtendFabric();
  const fabric = {...actualFabric, createBoundary(...args) { stats.boundary++; return actualFabric.createBoundary(...args); }};
  const resourcePort = new Proxy({}, {get() {stats.resources++; throw Error('Prewarm cannot access resource ports.');}});
  const options = {artifact, plan, bindingsRuntime, componentInterfaceRuntime,
    fabric, kernelWork: {rootId: 'prewarm.test.root', scheduler: {}}, resourceGraph: {kernel: resourcePort, surfaceGraph: resourcePort, surfaceController: resourcePort},
    resolveHostBinding() { throw Error('Prewarm cannot resolve or mount a concrete host.'); },
    grants: Object.fromEntries(artifact.manifest.hosts.map(host => [host.declarationId, {lifecycle: {lane: 'visible'}}])),
    adapters: {
      react: {normalizeReactPeers: reactRuntime.normalizeReactPeers, createReactKernelRuntimeAdapter() {stats.adapter++; throw Error('Prewarm cannot construct an adapter.');}},
      vue: {normalizeVuePeers: vueRuntime.normalizeVuePeers, createVueKernelRuntimeAdapter() {stats.adapter++; throw Error('Prewarm cannot construct an adapter.');}}
    },
    loadProviders: Object.fromEntries(artifact.manifest.providers.map(provider => [provider.id, async () => {
      stats.namespace++; await namespaceWait?.promise;
      return {[provider.entry.exportName]() {stats.factory++; throw Error('Prewarm cannot invoke a provider factory.');}};
    }])),
    async loadPeerGroup({group}) { stats.peers++; peerEntered?.resolve(); await peerWait?.promise; return group.framework === 'react' ? {React, ReactDOM} : {Vue}; }
  };
  const factory = runtime.createMaracaXTensionHostFactory(options);
  const noMount = () => {assert.equal(stats.factory, 0); assert.equal(stats.adapter, 0); assert.equal(stats.boundary, 0); assert.equal(stats.resources, 0);};
  return {factory, stats, noMount};
}

test('Composer Source7 Prewarm loads verified namespace and peers once without factories, DOM or resource work', async () => {
  const f = await fixture(), control = new AbortController();
  try {
    const first = await f.factory.prewarm({surfaceIds: ['gallery'], signal: control.signal});
    assert.deepEqual(first, {providerIds: ['react-product-gallery'], mounted: false});
    assert.equal(f.stats.namespace, 1); assert.equal(f.stats.peers, 1); f.noMount();
    assert.deepEqual(await f.factory.prewarm({surfaceIds: ['gallery'], signal: control.signal}), first);
    assert.equal(f.stats.namespace, 1); assert.equal(f.stats.peers, 1); f.noMount();
  } finally {control.abort();}
});

test('Composer Prewarm rejects obsolete authority before namespace or peer work', async () => {
  const f = await fixture(), control = new AbortController(); control.abort();
  await assert.rejects(f.factory.prewarm({surfaceIds: ['gallery'], signal: control.signal}), {name: 'AbortError'});
  assert.equal(f.stats.namespace, 0); assert.equal(f.stats.peers, 0); f.noMount();
  await assert.rejects(f.factory.prewarm({surfaceIds: ['unknown'], signal: new AbortController().signal}), /unknown Surface/); f.noMount();
});

test('Composer Prewarm abort during namespace await fences late imports before peers and factories', async () => {
  const namespaceWait = deferred(), f = await fixture({namespaceWait}), control = new AbortController();
  const pending = f.factory.prewarm({surfaceIds: ['gallery'], signal: control.signal});
  assert.equal(f.stats.namespace, 1); control.abort(); namespaceWait.resolve();
  await assert.rejects(pending, {name: 'AbortError'}); await turn();
  assert.equal(f.stats.peers, 0); f.noMount();
});

test('Composer Prewarm abort during verified-peer await cannot continue into a provider lifetime', async () => {
  const peerWait = deferred(), peerEntered = deferred(), f = await fixture({peerWait, peerEntered}), control = new AbortController();
  const pending = f.factory.prewarm({surfaceIds: ['gallery'], signal: control.signal});
  await peerEntered.promise; control.abort(); peerWait.resolve();
  await assert.rejects(pending, {name: 'AbortError'}); await turn();
  assert.equal(f.stats.namespace, 1); assert.equal(f.stats.peers, 1); f.noMount();
});
