'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-lifecycle-composition-'));
const bindingsRuntime = require('../../tools/xtensions/state-binding');
const reference = require('../../development/rmtx-a06/native-view-profile/reference.cjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const copy = value => structuredClone(value);
function compiled(version = '6.0.0') {
  let text = fs.readFileSync(path.join(root, reference.source), 'utf8');
  if (version === '6.0.0') text = text.replace('<RMT.Mount target="product-header" />', '<RMT.Mount target="product-details" when={model.nativeView.show} />');
  const result = require('../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: version, componentInterfaceCatalog: reference.catalog() })
    .compileSource({ text, filePath: reference.source });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  return { schema: version === '6.0.0' ? 'xtend.maraca.build-plan.v10' : 'xtend.maraca.build-plan.v9', ok: true, sourceHash: sha(text),
    orchestration: { enabled: true, artifact: result.orchestrationArtifacts }, xtensionBindings: result.xtensionBindings, xtensionComposition: result.xtensionComposition };
}
let built;
async function companion() {
  if (!built) built = (async () => {
    const plan = compiled(), report = await require('../../xtend-maraca/xtension-composition').buildMaracaXTensionComposition({
      plan, manifest: plan.xtensionComposition, bindingsRuntime, rootDir: root, outputDir: path.join(temporary, 'companion') });
    return { plan, report };
  })();
  return built;
}
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

test('actual Source6 compiles and captures exact Manifest10/Artifact11 with unchanged provider contracts', async () => {
  const { plan, report } = await companion(), api = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  assert.equal(require('../../xtend-maraca/xtension-composition').XTENSION_COMPOSITION_BUILD_API_VERSION, '17.0.0');
  assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v11'); assert.equal(report.apiVersion, '11.0.0');
  assert.equal(report.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v11');
  assert.equal(report.artifact.plan.schema, 'xtend.maraca.build-plan.v10');
  assert.equal(report.artifact.plan.program.schema, 'xtend.rmt.app-orchestration.v4');
  assert.equal(report.artifact.plan.program.lifecycle.schema, 'xtend.rmt.native-lifecycle-plan.v1');
  assert.equal(report.artifact.plan.bindings.schema, 'xtend.xtensions.state-binding-artifact.v6');
  assert.equal(report.artifact.manifest.schema, 'xtend.maraca.xtension-composition-manifest.v10');
  assert.equal(report.artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v2');
  assert(report.artifact.loadPlan.providers.every(row => row.phase === 'kernel.fabric.mount'));
  assert(report.deliveryFile); assert.equal(report.runtimeExecutionVerified, false);
  assert.deepEqual(api.validateArtifact(report.artifact, plan, bindingsRuntime), report.artifact);
  const old = compiled('5.0.0');
  assert.deepEqual(report.artifact.manifest.providers, old.xtensionComposition.providers);
  assert.deepEqual(report.artifact.manifest.interfaces, old.xtensionComposition.interfaces);
});

test('Plan10 requires the named Binder6 and Registry5 without widening old Native profile pairs', async () => {
  const { plan, report } = await companion(), api = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  for (const name of ['XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION', 'createXTensionLifecycleStateRegistry', 'validateLifecycleStateBindingArtifact']) {
    assert.throws(() => api.planIdentity(plan, { ...bindingsRuntime, [name]: undefined }), /API5/);
  }
  const identity = api.planIdentity(plan, bindingsRuntime);
  const old = compiled('5.0.0'), oldIdentity = api.planIdentity(old, bindingsRuntime);
  assert.throws(() => api.normalizeManifest(plan.xtensionComposition, oldIdentity), /matching build-plan/);
  assert.throws(() => api.normalizeManifest(old.xtensionComposition, identity), /matching build-plan/);
  for (const mutate of [
    p => { p.orchestration.artifact.schema = 'xtend.rmt.app-orchestration.v3'; },
    p => { p.xtensionBindings.schema = 'xtend.xtensions.state-binding-artifact.v5'; },
    p => { p.orchestration.artifact.lifecycle.viewProfile.version = '6.0.0'; }
  ]) { const malformed = copy(plan); mutate(malformed); assert.throws(() => api.planIdentity(malformed, bindingsRuntime)); }
  for (const mutate of [
    a => { a.schema = 'xtend.maraca.xtension-composition-artifact.v10'; }, a => { a.apiVersion = '10.0.0'; },
    a => { a.plan.schema = 'xtend.maraca.build-plan.v9'; }, a => { a.manifest.schema = 'xtend.maraca.xtension-composition-manifest.v9'; }
  ]) { const malformed = copy(report.artifact); mutate(malformed); assert.throws(() => api.validateArtifact(malformed, plan, bindingsRuntime)); }
});

test('Source6 provider interface pinning fails before output writes', async () => {
  const plan = copy(compiled()); plan.xtensionComposition.interfaces[0].sha256 = '0'.repeat(64);
  plan.xtensionComposition.hosts.filter(host => host.providerId === plan.xtensionComposition.interfaces[0].providerId).forEach(host => { host.interfaceSha256 = '0'.repeat(64); });
  const outputDir = path.join(temporary, 'invalid-interface');
  await assert.rejects(require('../../xtend-maraca/xtension-composition').buildMaracaXTensionComposition({
    plan, manifest: plan.xtensionComposition, bindingsRuntime, rootDir: root, outputDir }));
  assert.equal(fs.existsSync(outputDir), false);
});

test('Source6 deferred providers reject namespace then before emitting a companion', async () => {
  const directory = path.join(temporary, 'thenable'); fs.mkdirSync(directory);
  const bytes = Buffer.from('export function createPanel() {}\nexport function then() {}\n'); fs.writeFileSync(path.join(directory, 'provider.mjs'), bytes);
  const manifest = { schema: 'xtend.maraca.xtension-composition-manifest.v10', modules: [{ module: './provider.mjs', sha256: sha(bytes) }],
    providers: [{ id: 'panel', entry: { module: './provider.mjs', exportName: 'createPanel' } }] };
  await assert.rejects(require('../../xtend-maraca/xtension-provider-graph').captureProviderGraph(directory, manifest), /cannot export then/);
});
