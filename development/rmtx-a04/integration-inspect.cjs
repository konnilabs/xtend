'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createHash } = require('node:crypto'), { spawnSync } = require('node:child_process');
const maraca = require('../../xtend-maraca'), reference = require('./integration-reference.cjs');
const hash = value => createHash('sha256').update(value).digest('hex');
async function inspect() {
  const root = path.resolve(__dirname, '../..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a042-')), names = [];
  const copy = value => JSON.parse(JSON.stringify(value));
  const check = async (name, fn) => { await fn(); names.push(name); };
  const input = reference.createBuildInput('react', path.join(temp, 'app'));
  try {
    await check('legacy defaults retain build-plan v4 and companion artifact v1', async () => {
      const legacy = require('./reference.cjs').createPlan(); assert.equal(legacy.schema, 'xtend.maraca.build-plan.v4');
      const report = await require('./reference.cjs').buildReference(legacy, path.join(temp, 'legacy'), 'react');
      assert.equal(report.apiVersion, '1.0.0'); assert.equal(report.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v1');
    });
    const plan = maraca.createMaracaBuildPlan(input, { rootDir: root });
    await check('opt-in plan v5 captures a normalized closed composition manifest', () => {
      assert(plan.ok); assert.equal(plan.schema, 'xtend.maraca.build-plan.v5'); assert.deepEqual(plan.xtensionComposition.providers, input.xtensionComposition.providers); assert.equal(plan.xtensionComposition.hosts[0].declarationId, 'filter-panel');
    });
    await check('synchronous builder rejects automatic composition without emitting fallback output', () => {
      const report = maraca.buildMaracaBundle(input, { rootDir: root }); assert(!report.ok); assert.equal(report.status, 'xtension_composition_requires_async_build'); assert(!fs.existsSync(input.out));
    });
    for (const [label, change] of [['kernel disabled', { kernel: 'off' }], ['non-strict orchestration', { orchestration: 'auto' }], ['null manifest', { xtensionComposition: null }], ['unknown owner', { xtensionComposition: { ...copy(input.xtensionComposition), hosts: [{ ...input.xtensionComposition.hosts[0], ownerSurface: 'missing' }] } }]])
      await check(`invalid ${label} fails the plan`, () => { assert(!maraca.createMaracaBuildPlan({ ...input, ...change }, { rootDir: root }).ok); });
    const config = path.join(temp, 'maraca.json');
    for (const version of [4, 5]) await check(`build-config v${version} ${version === 5 ? 'accepts' : 'rejects'} explicit composition`, () => {
      fs.writeFileSync(config, JSON.stringify({ schema: 'xtend.maraca.build-config.v' + version, source: input.source, options: { ...input, out: path.join(temp, 'config-app') } }));
      const configured = maraca.createMaracaBuildPlan({ config }, { rootDir: root }); assert.equal(configured.ok, version === 5); if (version === 5) { assert.equal(configured.schema, plan.schema); assert.equal(maraca.createMaracaTuneConfig({ options: input }).schema, 'xtend.maraca.build-config.v5'); }
    });
    await check('digest mismatch fails the async build before any output mutation', async () => {
      const value = copy(input); value.out = path.join(temp, 'bad-digest'); value.xtensionComposition.providers[0].integrity.sha256 = '0'.repeat(64);
      const report = await maraca.buildMaracaBundleAsync(value, { rootDir: root }); assert(!report.ok); assert(!fs.existsSync(value.out));
    });
    for (const framework of ['react', 'vue', 'mixed']) await check(`${framework}: regular build emits native ESM graph, v2 provenance and exact captured provider bytes`, async () => {
      const out = path.join(temp, framework), report = await reference.buildIntegratedReference(framework, out, { profile: framework === 'vue' ? 'max' : framework === 'mixed' ? 'production' : 'debug' });
      if (!report.ok) { assert.equal(report.status, 'built_over_budget', JSON.stringify(report.plan.diagnostics)); assert.equal(report.sizeBudgetReport.framework.withinBudget, false); assert(report.sizeBudgetReport.framework.bytes > report.sizeBudgetReport.baselineBytes); } else assert(report.ok); assert.equal(report.plan.schema, plan.schema);
      const composition = JSON.parse(fs.readFileSync(path.join(out, 'xtend.xtensions.report.json')));
      assert.equal(composition.schema, 'xtend.maraca.xtension-composition-build-report.v2'); assert.equal(composition.apiVersion, '2.0.0');
      assert.equal(composition.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v2'); assert.equal(composition.runtimeExecutionVerified, false);
      assert.deepEqual(composition.artifact.plan.compositionManifest, composition.artifact.manifest);
      for (const file of composition.files) assert.equal(hash(fs.readFileSync(path.join(out, file.fileName))), file.sha256);
      const platform = fs.readFileSync(path.join(out, 'runtime/xtension-platform.mjs'), 'utf8');
      const ast = require('rollup/parseAst').parseAst(platform); assert(!ast.body.some(node => node.type.startsWith('Import') || node.type === 'ExportAllDeclaration'));
      assert(!platform.includes('from "react"') && !platform.includes('from "vue"'));
      const main = fs.readFileSync(path.join(out, 'xtend.maraca.mjs'), 'utf8'); assert(main.includes(composition.artifact.entryFile)); assert(main.includes('./runtime/xtension-platform.mjs'));
    });
    await check('real CLI consumes build-config v5 and emits its integrated companion', () => {
      const cliOut = path.join(temp, 'cli'); fs.writeFileSync(config, JSON.stringify({ schema: 'xtend.maraca.build-config.v5', source: input.source, options: { ...input, out: cliOut } }));
      const run = spawnSync(process.execPath, [path.join(root, 'xtend-builder/bin/xt.js'), 'maraca', 'build', '--config', config], { cwd: root, env: process.env, encoding: 'utf8', timeout: 60000 });
      assert.equal(run.status, 0, run.stderr + run.stdout); assert(fs.existsSync(path.join(cliOut, 'xtend.xtensions.report.json')));
    });
    const runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs'), contract = await import('../../xtend-maraca/xtension-composition-contract.mjs');
    const artifact = JSON.parse(fs.readFileSync(path.join(temp, 'react/xtend.xtensions.report.json'))).artifact;
    const bindingsRuntime = require('../../tools/xtensions/state-binding');
    await check('v2 identity rejects substituted manifest even with the same compiled bindings', () => {
      const altered = copy(plan); altered.xtensionComposition.providers[0].version = '2.0.0'; assert.throws(() => contract.validateArtifact(artifact, altered, bindingsRuntime));
    });
    await check('prepared port rejects a mismatched or legacy companion before binding internal ports', () => {
      assert.throws(() => runtime.createMaracaXTensionCompositionPort({ plan: { ...plan, xtensionComposition: artifact }, companion: { artifact: { ...artifact, schema: 'xtend.maraca.xtension-composition-artifact.v1' }, createHostFactory() { throw Error('must not run'); } }, bindingsRuntime }));
      const port = runtime.createMaracaXTensionCompositionPort({ plan: { ...plan, xtensionComposition: artifact }, companion: { artifact, createHostFactory() { throw Error('must not run'); } }, bindingsRuntime, loadPeers() {}, grants: { 'filter-panel': {} } });
      const changed = copy(plan); changed.sourceHash = '0'.repeat(64); assert.throws(() => port.bind({ plan: changed }), /different compiled source/);
    });
    const sources = ['xtend-maraca/index.js', 'xtend-maraca/index.d.ts', 'xtend-maraca/package.json', 'xtend-maraca/xtension-platform-build.js', 'xtend-maraca/xtension-composition-contract.mjs', 'xtend-maraca/xtension-composition.js', 'xtend-maraca/xtension-composition-runtime.mjs', 'xtend-maraca/xtension-composition.d.ts', 'xtend-maraca/xtension-composition-runtime.d.ts', 'xtend-maraca/plan-runtime.mjs', 'xtend-maraca/plan-runtime.d.ts', 'xtend-maraca/abort-boundary.d.ts', 'xtend-maraca/browser-composition-runtime.mjs', 'xtend-maraca/browser-composition-runtime.d.ts', 'xtend-maraca/browser-host-adapter.mjs', 'development/rmtx-a04/integration-reference.cjs', 'development/rmtx-a04/integration-inspect.cjs', 'development/rmtx-a04/providers/controlled-react-panel.mjs', 'development/rmtx-a04/providers/controlled-vue-panel.mjs', 'tests/xtensions/integrated-composition-acceptance.js', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/xtensions_consumer_package_suite.js', 'tests/types/xtensions_integrated_composition.mts', 'scripts/test_xtensions_runtime_adapters.cjs', 'scripts/check_release_preparation.cjs', 'tests/release/preparation-gates.test.cjs'];
    const report = { format: 1, stage: 'A04.2-regular-build-and-browser-boot', status: 'integrated-path-implemented', checks: names.length, names,
      buildPlanVersion: 5, buildConfigVersion: 5, compositionApiVersion: '2.0.0', artifactVersion: 2, buildReportVersion: 2, compositionPortVersion: 1, browserApiVersion: '6.0.0', planRuntimeVersion: 8, hostApiVersion: '6.0.0',
      automaticBrowserBootComposition: true, fabricRequired: true, runtimeExecutionInPreparationCheck: false, runtimeExecutionVerified: false, acceptedForRelease: false,
      sources: Object.fromEntries(sources.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
    const output = path.join(__dirname, 'integration-evidence.json'), text = JSON.stringify(report, null, 2) + '\n';
    if (process.argv.includes('--write')) fs.writeFileSync(output, text); if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, 'A04.2 source/contract drift');
    console.log(`A04.2: ${names.length} regular-build/contract checks; actual generated-browser execution has a separate mandatory gate.`); return report;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
