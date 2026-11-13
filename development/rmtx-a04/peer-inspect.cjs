'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createHash } = require('node:crypto'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..'), reference = require('./integration-reference.cjs'), bindingsRuntime = require('../../tools/xtensions/state-binding');
const hash = value => createHash('sha256').update(value).digest('hex'), copy = value => JSON.parse(JSON.stringify(value));
async function inspect() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a0433-')), names = [], sizes = {};
  const check = async (name, fn) => { await fn(); names.push(name); };
  const tool = require('../../xtend-maraca/xtension-composition'), contract = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  const runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs'), plan = require('./reference.cjs').createPlan();
  const input = reference.withSharedPeers(reference.createBuildInput('react', path.join(temp, 'unused'))), manifest = input.xtensionComposition;
  let capture;
  try {
    await check('v4 shared policy builds v5 artifact/report and v2 immutable derived groups', async () => {
      capture = await tool.buildMaracaXTensionComposition({ plan, manifest, bindingsRuntime, rootDir: root, outputDir: path.join(temp, 'manual') });
      assert.equal(tool.XTENSION_COMPOSITION_BUILD_API_VERSION, '9.0.0'); assert.equal(runtime.XTENSION_COMPOSITION_API_VERSION, '6.0.0');
      assert.equal(capture.schema, 'xtend.maraca.xtension-composition-build-report.v5'); assert.equal(capture.apiVersion, '5.0.0');
      const artifact = contract.validateArtifact(capture.artifact, plan, bindingsRuntime); assert.equal(artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v2');
      const group = artifact.loadPlan.peerGroups[0]; assert.equal(group.framework, 'react'); assert.deepEqual(group.versions, manifest.providers[0].peers);
      assert.deepEqual(group.providerIds, [manifest.providers[0].id]); assert.deepEqual(artifact.loadPlan.providers[0].peers, { mode: 'shared', groupId: group.id });
      assert(Object.isFrozen(group.versions)); const companion = await import(pathToFileURL(capture.entryPath).href); assert(Object.isFrozen(companion.artifact.loadPlan.peerGroups));
      assert.equal(capture.runtimeExecutionVerified, false); assert.equal(capture.frameworkDependenciesBundled, false);
    });
    await check('compatible different providers group deterministically, differing exact versions split', async () => {
      const value = reference.withSharedPeers(reference.createSharedPairInput('react', path.join(temp, 'pair')));
      const pairPlan = require('../../xtend-maraca').createMaracaBuildPlan(value, { rootDir: root }); assert(pairPlan.ok);
      const pair = await tool.buildMaracaXTensionComposition({ plan: pairPlan, manifest: value.xtensionComposition, bindingsRuntime, rootDir: root, outputDir: path.join(temp, 'pair') });
      assert.equal(pair.artifact.loadPlan.peerGroups.length, 1); assert.equal(pair.artifact.loadPlan.peerGroups[0].providerIds.length, 2);
      const normalized = contract.normalizeManifest(value.xtensionComposition, { bindings: pairPlan.xtensionBindings });
      const reversed = contract.normalizeManifest({ ...value.xtensionComposition, providers: [...value.xtensionComposition.providers].reverse(), modules: [...value.xtensionComposition.modules].reverse() }, { bindings: pairPlan.xtensionBindings });
      assert.equal(contract.canonical(contract.createLoadPlan(normalized, pair.artifact.modules, pair.artifact.providers)), contract.canonical(contract.createLoadPlan(reversed, pair.artifact.modules, pair.artifact.providers)));
      const different = copy(normalized); different.providers[1].peers = { react: '19.0.0', 'react-dom': '19.0.0' };
      assert.equal(contract.createLoadPlan(different, pair.artifact.modules, pair.artifact.providers).peerGroups.length, 2);
    });
    for (const [label, mutate] of [
      ['missing group', a => a.loadPlan.peerGroups.pop()],
      ['duplicate group', a => a.loadPlan.peerGroups.push(a.loadPlan.peerGroups[0])],
      ['unknown member', a => a.loadPlan.peerGroups[0].providerIds.push('injected')],
      ['missing member', a => a.loadPlan.peerGroups[0].providerIds.pop()],
      ['group version', a => { a.loadPlan.peerGroups[0].versions.react = '19.0.0'; }],
      ['framework', a => { a.loadPlan.peerGroups[0].framework = 'vue'; }],
      ['group selection', a => { a.loadPlan.providers[0].peers.groupId = 'other'; }],
      ['per-host bypass', a => { a.loadPlan.providers[0].peers.mode = 'per-host'; }],
      ['extra cache authority', a => { a.loadPlan.peerGroups[0].global = true; }],
      ['legacy plan version', a => { a.loadPlan.schema = 'xtend.maraca.xtension-load-plan.v1'; }]
    ]) await check(`reject forged shared ${label}`, () => { const value = copy(capture.artifact); mutate(value); assert.throws(() => contract.validateArtifact(value, plan, bindingsRuntime), /load plan/); });
    for (const [label, mutate] of [
      ['missing policy', m => { delete m.loading; }],
      ['per-host policy in v4', m => { m.loading.peers = 'per-host'; }],
      ['shared policy in v3', m => { m.schema = 'xtend.maraca.xtension-composition-manifest.v3'; }],
      ['undeclared cache scope', m => { m.loading.scope = 'global'; }]
    ]) await check(`reject ${label} before output`, async () => { const value = copy(manifest); mutate(value); const outputDir = path.join(temp, 'reject-' + names.length); await assert.rejects(tool.buildMaracaXTensionComposition({ plan, manifest: value, bindingsRuntime, rootDir: root, outputDir })); assert(!fs.existsSync(outputDir)); });
    for (const [label, ports] of [['missing', {}], ['legacy', { loadPeers() {} }], ['ambiguous', { loadPeers() {}, loadPeerGroup() {} }]]) await check(`shared artifact rejects ${label} peer loader ports`, () => {
      assert.throws(() => runtime.createMaracaXTensionHostFactory({ artifact: capture.artifact, plan, bindingsRuntime, ...ports }), /peer loader port/);
    });
    await check('per-host legacy artifact rejects the shared loader port', async () => {
      const value = copy(manifest); value.schema = 'xtend.maraca.xtension-composition-manifest.v3'; value.loading.peers = 'per-host';
      const previous = await tool.buildMaracaXTensionComposition({ plan, manifest: value, bindingsRuntime, rootDir: root, outputDir: path.join(temp, 'legacy') });
      assert.equal(previous.artifact.apiVersion, '4.0.0'); assert.equal(previous.apiVersion, '4.0.0'); assert.equal(previous.artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v1');
      assert.throws(() => runtime.createMaracaXTensionHostFactory({ artifact: previous.artifact, plan, bindingsRuntime, loadPeerGroup() {} }), /peer loader port/);
    });
    for (const source of ['export function createPanel() {} export function then(resolve) { resolve({}); }', 'export function createPanel() {} function callback(resolve) { resolve({}); } export { callback as then };']) await check(`shared graph rejects ${source.includes('export {') ? 'aliased' : 'declared'} then export before output`, async () => {
      const project = path.join(temp, 'then-' + names.length); fs.mkdirSync(project); fs.writeFileSync(path.join(project, 'panel.mjs'), source);
      const value = copy(manifest); value.providers[0].entry.module = './panel.mjs'; value.providers[0].integrity.sha256 = hash(source); value.modules = [{ module: './panel.mjs', sha256: hash(source) }];
      const outputDir = path.join(temp, 'then-output-' + names.length);
      await assert.rejects(tool.buildMaracaXTensionComposition({ plan, manifest: value, bindingsRuntime, rootDir: project, outputDir }), /cannot export then/); assert(!fs.existsSync(outputDir));
    });
    for (const framework of ['react', 'vue', 'mixed']) await check(`${framework}: strict regular build enforces unchanged size ceilings and exact shared groups`, async () => {
      const outputDir = path.join(temp, framework), input = reference.withSharedPeers(reference.createBuildInput(framework, outputDir, { profile: framework === 'vue' ? 'max' : 'production' }));
      const report = await require('../../xtend-maraca').buildMaracaBundleAsync(input, { rootDir: root }); assert.equal(report.ok, true, JSON.stringify(report.plan.diagnostics));
      const composition = JSON.parse(fs.readFileSync(path.join(outputDir, 'xtend.xtensions.report.json'))), budget = report.sizeBudgetReport;
      assert.equal(composition.artifact.loadPlan.peerGroups.length, framework === 'mixed' ? 2 : 1); assert.equal(composition.schema, 'xtend.maraca.xtension-composition-build-report.v5');
      assert.equal(budget.mode, 'strict'); assert.equal(budget.status, 'within_budget'); assert(budget.xtensions.withinBudget); assert(budget.framework.bytes <= 2200000); assert(budget.xtensions.runtimeBytes <= 240000);
      for (const file of composition.files) assert.equal(hash(fs.readFileSync(path.join(outputDir, file.fileName))), file.sha256);
      sizes[framework] = { frameworkBytes: budget.framework.bytes, xtensionRuntimeBytes: budget.xtensions.runtimeBytes };
    });
    await check('real CLI config v5 emits shared v5 report and v2 load plan', () => {
      const outputDir = path.join(temp, 'cli'), config = path.join(temp, 'config.json'), input = reference.withSharedPeers(reference.createBuildInput('react', outputDir, { profile: 'production' }));
      fs.writeFileSync(config, JSON.stringify({ schema: 'xtend.maraca.build-config.v5', source: input.source, options: input }));
      const run = require('node:child_process').spawnSync(process.execPath, [path.join(root, 'xtend-builder/bin/xt.js'), 'maraca', 'build', '--config', config], { cwd: root, env: process.env, encoding: 'utf8', timeout: 60000 });
      assert.equal(run.status, 0, run.stderr + run.stdout); const report = JSON.parse(fs.readFileSync(path.join(outputDir, 'xtend.xtensions.report.json')));
      assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v5'); assert.equal(report.artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v2');
    });
    const sources = ['xtend-maraca/xtension-provider-graph.js', 'xtend-maraca/xtension-composition.js', 'xtend-maraca/xtension-composition-contract.mjs', 'xtend-maraca/xtension-composition-runtime.mjs', 'xtend-maraca/xtension-composition.d.ts', 'xtend-maraca/xtension-composition-runtime.d.ts', 'xtend-maraca/xtension-size-budget.js', 'xtend-maraca/browser-composition-runtime.mjs', 'xtend-maraca/browser-composition-runtime.d.ts', 'xtend-maraca/plan-runtime.mjs', 'xtend-maraca/plan-runtime.d.ts', 'development/rmtx-a04/peer-inspect.cjs', 'development/rmtx-a04/integration-reference.cjs', 'scripts/test_xtensions_runtime_adapters.cjs', 'tests/xtensions/integrated-composition-acceptance.js', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/xtensions_consumer_package_suite.js', 'tests/types/xtensions_integrated_composition.mts'];
    const evidence = { format: 1, stage: 'A04.3.3-shared-peer-groups', status: 'implemented', manifestVersion: 4, artifactVersion: 5, buildReportVersion: 5, loadPlanVersion: 2, apiVersion: '5.0.0', peerLoading: 'shared', cacheScope: 'host-factory', nativeImportTransportAbortable: false, peerTransportAbortCooperative: true, runtimeExecutionVerified: false, acceptedForRelease: false, checks: names.length, names, sizes,
      sources: Object.fromEntries(sources.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
    const text = JSON.stringify(evidence, null, 2) + '\n', output = path.join(__dirname, 'peer-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(output, text); if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, 'A04.3.3 source/contract drift');
    console.log(`A04.3.3: ${names.length} shared-peer/build/contract checks; real host lifetimes have a separate mandatory runtime gate.`); return evidence;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
