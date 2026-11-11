'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createHash } = require('node:crypto'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..'), reference = require('./integration-reference.cjs'), bindingsRuntime = require('../../tools/xtensions/state-binding');
const hash = value => createHash('sha256').update(value).digest('hex'), copy = value => JSON.parse(JSON.stringify(value));
async function inspect() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a0432-')), names = [], sizes = {};
  const check = async (name, fn) => { await fn(); names.push(name); };
  const tool = require('../../xtend-maraca/xtension-composition'), { normalizeManifest, validateArtifact, canonical } = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  const plan = require('./reference.cjs').createPlan(), input = reference.withDeferredProviders(reference.createBuildInput('react', path.join(temp, 'unused'))), manifest = input.xtensionComposition;
  let capture;
  try {
    await check('explicit v3 policy builds a v4 companion with only literal deferred provider imports', async () => {
      capture = await tool.buildMaracaXTensionComposition({ plan, manifest, bindingsRuntime, rootDir: root, outputDir: path.join(temp, 'manual') });
      assert.equal(capture.schema, 'xtend.maraca.xtension-composition-build-report.v4'); assert.equal(capture.apiVersion, '4.0.0');
      const ast = require('rollup/parseAst').parseAst(fs.readFileSync(capture.entryPath, 'utf8'));
      assert(!ast.body.some(row => row.type === 'ImportDeclaration'));
      const imports = [];
      function walk(node) { if (!node || typeof node !== 'object') return; if (node.type === 'ImportExpression') imports.push(node.source.value); for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value); }
      walk(ast); assert.deepEqual(imports, capture.artifact.providers.map(row => './' + row.fileName));
      const companion = await import(pathToFileURL(capture.entryPath).href); assert(Object.isFrozen(companion.artifact.loadPlan.providers[0].modules));
      assert.equal(capture.runtimeExecutionVerified, false); assert.equal(capture.frameworkDependenciesBundled, false);
    });
    await check('load plan exactly binds reachable output files, export and external peer versions', () => {
      const artifact = validateArtifact(capture.artifact, plan, bindingsRuntime), load = artifact.loadPlan.providers[0];
      assert.equal(load.phase, 'kernel.fabric.mount'); assert.equal(load.mode, 'on-mount'); assert.equal(load.peers.mode, 'per-host');
      assert.deepEqual(load.modules, artifact.modules.map(row => row.fileName).sort()); assert.deepEqual(load.peers.versions, artifact.manifest.providers[0].peers);
      assert.equal(load.entryFile, artifact.providers[0].fileName); assert.equal(load.exportName, artifact.manifest.providers[0].entry.exportName);
    });
    for (const [label, mutate] of [
      ['missing loading policy', m => { delete m.loading; }],
      ['implicit eager policy', m => { m.loading.provider = 'eager'; }],
      ['unimplemented peer cache', m => { m.loading.peers = 'shared'; }],
      ['injected remote loader', m => { m.loading.url = 'https://example.test/provider.mjs'; }],
      ['legacy v2 cannot accept v3 policy', m => { m.schema = 'xtend.maraca.xtension-composition-manifest.v2'; }]
    ]) await check(`reject ${label} before output`, async () => {
      const value = copy(manifest); mutate(value); const outputDir = path.join(temp, 'reject-' + names.length);
      await assert.rejects(tool.buildMaracaXTensionComposition({ plan, manifest: value, bindingsRuntime, rootDir: root, outputDir })); assert.equal(fs.existsSync(outputDir), false);
    });
    for (const [label, mutate] of [
      ['schema', a => { a.loadPlan.schema += '.unknown'; }],
      ['missing provider', a => { a.loadPlan.providers = []; }],
      ['extra provider', a => { a.loadPlan.providers.push(a.loadPlan.providers[0]); }],
      ['entry path', a => { a.loadPlan.providers[0].entryFile = './other.mjs'; }],
      ['missing transitive member', a => { a.loadPlan.providers[0].modules.pop(); }],
      ['injected transitive member', a => { a.loadPlan.providers[0].modules.push('remote.mjs'); }],
      ['execution phase', a => { a.loadPlan.providers[0].phase = 'before-boot'; }],
      ['peer version', a => { a.loadPlan.providers[0].peers.versions.react = '19.0.0'; }],
      ['factory export', a => { a.loadPlan.providers[0].exportName = 'other'; }]
    ]) await check(`reject forged load-plan ${label} before runtime ports`, () => {
      const artifact = copy(capture.artifact); mutate(artifact); assert.throws(() => validateArtifact(artifact, plan, bindingsRuntime), /load plan/);
    });
    await check('deferred artifacts reject eager namespace authority before grants or runtime ports', async () => {
      const runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs');
      assert.throws(() => runtime.createMaracaXTensionHostFactory({ artifact: capture.artifact, plan, bindingsRuntime, providers: {} }), /ports must match/);
    });
    await check('legacy graph artifacts reject deferred loader authority', async () => {
      const value = copy(manifest); value.schema = 'xtend.maraca.xtension-composition-manifest.v2'; delete value.loading;
      const legacy = await tool.buildMaracaXTensionComposition({ plan, manifest: value, bindingsRuntime, rootDir: root, outputDir: path.join(temp, 'legacy') });
      const runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs');
      assert.throws(() => runtime.createMaracaXTensionHostFactory({ artifact: legacy.artifact, plan, bindingsRuntime, loadProviders: {} }), /ports must match/);
    });
    for (const source of ['export function createPanel() {} export function then(resolve) { resolve({}); }', 'export function createPanel() {} function callback(resolve) { resolve({}); } export { callback as then };']) await check(`deferred graph rejects ${source.includes('export {') ? 'aliased' : 'declared'} then export before output`, async () => {
      const project = path.join(temp, 'then-' + names.length); fs.mkdirSync(project); fs.writeFileSync(path.join(project, 'panel.mjs'), source);
      const value = copy(manifest); value.providers[0].entry.module = './panel.mjs'; value.providers[0].integrity.sha256 = hash(source); value.modules = [{ module: './panel.mjs', sha256: hash(source) }];
      const outputDir = path.join(temp, 'then-output-' + names.length);
      await assert.rejects(tool.buildMaracaXTensionComposition({ plan, manifest: value, bindingsRuntime, rootDir: project, outputDir }), /cannot export then/); assert.equal(fs.existsSync(outputDir), false);
    });
    await check('new manifest normalization is deterministic and retains full graph pins', () => {
      const normalized = normalizeManifest(manifest, { bindings: plan.xtensionBindings }); assert.equal(normalized.schema, manifest.schema);
      assert.equal(canonical(normalized), canonical(normalizeManifest({ ...manifest, modules: [...manifest.modules].reverse() }, { bindings: plan.xtensionBindings })));
    });
    for (const framework of ['react', 'vue', 'mixed']) await check(`${framework}: strict regular build emits a deferred graph and enforces unchanged size limits`, async () => {
      const outputDir = path.join(temp, framework), input = reference.withDeferredProviders(reference.createBuildInput(framework, outputDir, { profile: framework === 'vue' ? 'max' : 'production' }));
      const report = await require('../../xtend-maraca').buildMaracaBundleAsync(input, { rootDir: root }); assert.equal(report.ok, true, JSON.stringify(report.plan.diagnostics));
      const composition = JSON.parse(fs.readFileSync(path.join(outputDir, 'xtend.xtensions.report.json'))), budget = report.sizeBudgetReport;
      assert.equal(composition.artifact.loadPlan.providers.length, framework === 'mixed' ? 2 : 1); assert.equal(composition.schema, 'xtend.maraca.xtension-composition-build-report.v4');
      assert.equal(budget.mode, 'strict'); assert.equal(budget.status, 'within_budget'); assert(budget.xtensions.withinBudget); assert(budget.framework.bytes <= 2200000); assert(budget.xtensions.runtimeBytes <= 240000);
      for (const file of composition.files) assert.equal(hash(fs.readFileSync(path.join(outputDir, file.fileName))), file.sha256);
      const files = composition.artifact.loadPlan.providers.flatMap(row => row.modules); assert.equal(new Set(files).size, composition.artifact.modules.length);
      if (framework === 'mixed') assert(files.length > new Set(files).size, 'shared module remains in both provider closures');
      sizes[framework] = { frameworkBytes: budget.framework.bytes, xtensionRuntimeBytes: budget.xtensions.runtimeBytes };
    });
    await check('real CLI build-config v5 produces the deferred v4 report and load plan', () => {
      const outputDir = path.join(temp, 'cli'), config = path.join(temp, 'config.json'), input = reference.withDeferredProviders(reference.createBuildInput('react', outputDir, { profile: 'production' }));
      fs.writeFileSync(config, JSON.stringify({ schema: 'xtend.maraca.build-config.v5', source: input.source, options: input }));
      const run = require('node:child_process').spawnSync(process.execPath, [path.join(root, 'xtend-builder/bin/xt.js'), 'maraca', 'build', '--config', config], { cwd: root, env: process.env, encoding: 'utf8', timeout: 60000 });
      assert.equal(run.status, 0, run.stderr + run.stdout);
      const report = JSON.parse(fs.readFileSync(path.join(outputDir, 'xtend.xtensions.report.json'))); assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v4'); assert.equal(report.artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v1');
    });
    const sources = ['xtend-maraca/xtension-provider-graph.js', 'xtend-maraca/xtension-composition.js', 'xtend-maraca/xtension-composition-contract.mjs', 'xtend-maraca/xtension-composition-runtime.mjs', 'xtend-maraca/xtension-composition.d.ts', 'xtend-maraca/xtension-composition-runtime.d.ts', 'xtend-maraca/xtension-size-budget.js', 'xtend-maraca/browser-composition-runtime.mjs', 'xtend-maraca/plan-runtime.mjs', 'development/rmtx-a04/loading-inspect.cjs', 'development/rmtx-a04/integration-reference.cjs', 'scripts/test_xtensions_runtime_adapters.cjs', 'tests/xtensions/integrated-composition-acceptance.js', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/xtensions_consumer_package_suite.js', 'tests/types/xtensions_integrated_composition.mts'];
    const evidence = { format: 1, stage: 'A04.3.2-deferred-provider-load-plan', status: 'implemented', manifestVersion: 3, artifactVersion: 4, buildReportVersion: 4, loadPlanVersion: 1, apiVersion: '4.0.0', peerLoading: 'per-host', nativeImportTransportAbortable: false, runtimeExecutionVerified: false, acceptedForRelease: false, checks: names.length, names, sizes,
      sources: Object.fromEntries(sources.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
    const text = JSON.stringify(evidence, null, 2) + '\n', output = path.join(__dirname, 'loading-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(output, text); if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, 'A04.3.2 source/contract drift');
    console.log(`A04.3.2: ${names.length} deferred-load/build/contract checks; actual native imports have a separate mandatory runtime gate.`); return evidence;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
