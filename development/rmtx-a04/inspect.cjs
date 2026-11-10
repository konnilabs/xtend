'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createHash } = require('node:crypto'), { pathToFileURL } = require('node:url');
const reference = require('./reference.cjs'), { buildMaracaXTensionComposition } = require('../../xtend-maraca/xtension-composition');
const bindingsRuntime = require('../../tools/xtensions/state-binding');
const hash = value => createHash('sha256').update(value).digest('hex');
async function inspect() {
  const root = path.resolve(__dirname, '../..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a041-')), names = [];
  const plan = reference.createPlan(), manifest = reference.createManifest('react');
  const input = { rootDir: root, plan, manifest, bindingsRuntime };
  const copy = value => JSON.parse(JSON.stringify(value));
  const check = async (name, fn) => { await fn(); names.push(name); };
  try {
    for (const framework of ['react', 'vue']) await check(`${framework}: source bytes, graph imports and immutable compiled identity`, async () => {
      const report = await reference.buildReference(plan, path.join(temp, framework), framework);
      assert.equal(report.runtimeExecutionVerified, false); assert.equal(report.frameworkDependenciesBundled, false);
      for (const file of report.files) assert.equal(hash(fs.readFileSync(path.join(temp, framework, file.fileName))), file.sha256);
      const built = await import(pathToFileURL(report.entryPath).href);
      assert(Object.isFrozen(built.artifact.plan.bindings)); assert(Object.isFrozen(built.artifact.manifest.providers[0].peers));
      assert.equal(typeof built.createHostFactory, 'function'); assert.equal(built.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v1');
      const second = await reference.buildReference(plan, path.join(temp, framework), framework); assert.deepEqual(report, second);
    });
    for (const [label, mutate] of [
      ['unsupported manifest schema', m => { m.schema += '.unknown'; }],
      ['unknown manifest authority', m => { m.scheduler = {}; }],
      ['duplicate provider', m => { m.providers.push(m.providers[0]); }],
      ['unbound declaration', m => { m.hosts[0].declarationId = 'absent'; }],
      ['duplicate host mapping', m => { m.hosts.push(m.hosts[0]); }],
      ['missing host mapping', m => { m.hosts = []; }],
      ['wrong owning Surface', m => { m.hosts[0].ownerSurface = 'sibling'; }],
      ['unknown provider', m => { m.hosts[0].providerId = 'absent'; }],
      ['unsupported framework', m => { m.providers[0].framework = 'angular'; }],
      ['framework mismatch', m => { m.hosts[0].capabilityRequirements.framework = 'vue'; }],
      ['legacy capability contract', m => { m.hosts[0].capabilityRequirements.schema += '.legacy'; }],
      ['null request array', m => { m.hosts[0].capabilityRequirements.required.work = null; }],
      ['overlapping requirements', m => { m.hosts[0].capabilityRequirements.optional.work = ['scan']; }],
      ['unreviewed feature', m => { m.hosts[0].capabilityRequirements.required.features = ['invented']; }],
      ['inline provider function', m => { m.providers[0].factory = () => {}; }],
      ['remote source', m => { m.providers[0].entry.module = 'https://provider.test/panel.mjs'; }],
      ['path traversal', m => { m.providers[0].entry.module = './../panel.mjs'; }],
      ['external peer range', m => { m.providers[0].peers.react = '^18'; }],
      ['peer pair mismatch', m => { m.providers[0].peers['react-dom'] = '19.0.0'; }],
      ['declared export absent', m => { m.providers[0].entry.exportName = 'absent'; }],
      ['forged declared integrity', m => { m.providers[0].integrity.sha256 = '0'.repeat(64); }]
    ]) await check(`reject ${label} before output mutation`, async () => {
      const value = copy(manifest); mutate(value); const outputDir = path.join(temp, 'reject-' + names.length);
      await assert.rejects(buildMaracaXTensionComposition({ ...input, manifest: value, outputDir })); assert.equal(fs.existsSync(outputDir), false);
    });
    await check('JSON accessors are rejected without invocation', async () => {
      let calls = 0; const value = copy(manifest); Object.defineProperty(value.providers[0], 'id', { enumerable: true, get() { calls++; return 'react-filter'; } });
      await assert.rejects(buildMaracaXTensionComposition({ ...input, manifest: value, outputDir: path.join(temp, 'accessor') })); assert.equal(calls, 0);
    });
    for (const [label, source] of [
      ['static dependency', "import { x } from './dependency.mjs'; export function createPanel() { return x; }"],
      ['dynamic dependency', "export function createPanel() { return import('./dependency.mjs'); }"],
      ['require dependency', "export function createPanel() { return require('react'); }"],
      ['top-level side effect', 'globalThis.executed = true; export function createPanel() {}'],
      ['top-level initializer', 'const x = alert(); export function createPanel() {}'],
      ['async factory', 'export async function createPanel() {}'],
      ['invalid syntax', 'export function createPanel( {']
    ]) await check(`reject ${label} in the captured module graph`, async () => {
      const localRoot = path.join(temp, 'source-' + names.length); fs.mkdirSync(localRoot); fs.writeFileSync(path.join(localRoot, 'panel.mjs'), source);
      const value = copy(manifest); value.providers[0].entry.module = './panel.mjs'; value.providers[0].integrity.sha256 = hash(source);
      const outputDir = path.join(temp, 'invalid-source-' + names.length);
      await assert.rejects(buildMaracaXTensionComposition({ ...input, rootDir: localRoot, manifest: value, outputDir })); assert.equal(fs.existsSync(outputDir), false);
    });
    await check('symlink escape does not read a provider outside the project', async () => {
      const localRoot = path.join(temp, 'linked-source'); fs.mkdirSync(localRoot); fs.symlinkSync(path.join(root, manifest.providers[0].entry.module), path.join(localRoot, 'panel.mjs'));
      const value = copy(manifest); value.providers[0].entry.module = './panel.mjs';
      await assert.rejects(buildMaracaXTensionComposition({ ...input, rootDir: localRoot, manifest: value, outputDir: path.join(temp, 'escape') }));
    });
    await check('captured imports remain bound to verified bytes after source replacement', async () => {
      const localRoot = path.join(temp, 'replacement'); fs.mkdirSync(localRoot); const file = path.join(localRoot, 'panel.mjs');
      const source = 'export function createPanel() { return function Captured() {}; }'; fs.writeFileSync(file, source);
      const value = copy(manifest); value.providers[0].entry.module = './panel.mjs'; value.providers[0].integrity.sha256 = hash(source);
      const report = await buildMaracaXTensionComposition({ ...input, rootDir: localRoot, manifest: value, outputDir: path.join(temp, 'captured') });
      fs.writeFileSync(file, 'throw new Error("replacement must never execute")');
      const captured = await import(pathToFileURL(path.join(temp, 'captured', report.artifact.providers[0].fileName)).href);
      assert.equal(captured.createPanel().name, 'Captured');
      await assert.rejects(buildMaracaXTensionComposition({ ...input, rootDir: localRoot, manifest: value, outputDir: path.join(temp, 'after-replacement') }));
    });
    const runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs');
    const built = await reference.buildReference(plan, path.join(temp, 'identity'), 'react');
    for (const [label, mutate] of [
      ['source hash', p => { p.sourceHash = '0'.repeat(64); }],
      ['binding contract', p => { p.xtensionBindings.bindings[0].binding.intents.change.payloadSchema += '.changed'; }],
      ['compiled program', p => { p.orchestration.artifact.diagnostics = [{ code: 'changed' }]; }]
    ]) await check(`reject mismatched ${label} before any provider port`, () => {
      const value = copy(plan); mutate(value);
      assert.throws(() => runtime.createMaracaXTensionHostFactory({ artifact: built.artifact, plan: value, bindingsRuntime }));
    });
    const sources = ['xtend-maraca/xtension-composition-contract.mjs', 'xtend-maraca/xtension-composition.js', 'xtend-maraca/xtension-composition-runtime.mjs', 'xtend-maraca/xtension-composition.d.ts', 'xtend-maraca/xtension-composition-runtime.d.ts', 'xtend-maraca/package.json', 'development/rmtx-a04/reference.cjs', 'development/rmtx-a04/providers/react-panel.mjs', 'development/rmtx-a04/providers/vue-panel.mjs', 'development/rmtx-a04/inspect.cjs', 'tests/xtensions/xtensions_consumer_package_suite.js', 'tests/xtensions/composition-maraca-acceptance.js', 'tests/types/xtensions_composition.mts', 'scripts/test_xtensions_runtime_adapters.cjs', 'tests/xtensions/xtensions_runtime_gate_suite.js'];
    const report = { format: 1, stage: 'A04.1-local-provider-build-and-host-composition', status: 'first-companion-path-implemented', apiVersion: '1.0.0', hostApiVersion: '6.0.0',
      maracaBuildPlanVersion: 4, automaticBrowserBootComposition: false, runtimeExecutionInPreparationCheck: false, runtimeExecutionVerified: false, fabricRequired: true,
      checks: names.length, names, sources: Object.fromEntries(sources.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
    const text = JSON.stringify(report, null, 2) + '\n', output = path.join(__dirname, 'evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(output, text);
    if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, 'A04.1 contract/source drift');
    console.log(`A04.1: ${names.length} build/contract checks; actual React/Vue and Kernel/Fabric execution is a separate mandatory gate.`);
    return report;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
