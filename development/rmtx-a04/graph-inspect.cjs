'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createHash } = require('node:crypto'), { pathToFileURL } = require('node:url');
const { buildMaracaXTensionComposition } = require('../../xtend-maraca/xtension-composition'), bindingsRuntime = require('../../tools/xtensions/state-binding');
const reference = require('./reference.cjs'), integrated = require('./integration-reference.cjs');
const hash = value => createHash('sha256').update(value).digest('hex'), copy = value => JSON.parse(JSON.stringify(value));
async function inspect() {
  const root = path.resolve(__dirname, '../..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a043-')), names = [], sizes = {};
  const plan = reference.createPlan();
  const check = async (name, fn) => { await fn(); names.push(name); };
  function fixture(files, pins = Object.keys(files)) {
    const localRoot = path.join(temp, 'source-' + names.length); fs.mkdirSync(localRoot);
    for (const [file, source] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(localRoot, file)), { recursive: true }); fs.writeFileSync(path.join(localRoot, file), source); }
    const manifest = copy(reference.createManifest('react')); manifest.schema = 'xtend.maraca.xtension-composition-manifest.v2';
    manifest.providers[0].entry.module = './panel.mjs'; manifest.providers[0].integrity.sha256 = hash(files['panel.mjs']);
    manifest.modules = pins.map(module => ({ module: './' + module, sha256: hash(files[module]) }));
    return { plan, manifest, bindingsRuntime, rootDir: localRoot, outputDir: path.join(temp, 'out-' + names.length) };
  }
  const valid = {
    'panel.mjs': "import { createComponent as create } from './component.mjs'; export function createPanel(peers) { return create(peers); }",
    'component.mjs': "import * as shared from './common/format.mjs'; function component() { return shared.format(); } export { component as createComponent };",
    'common/format.mjs': "export function format() { return 'captured'; }"
  };
  try {
    await check('pinned multi-level ESM, named aliases, namespace imports, separate source/output digests and deterministic graph', async () => {
      const options = fixture(valid), report = await buildMaracaXTensionComposition(options);
      assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v3'); assert.equal(report.apiVersion, '3.0.0'); assert.equal(report.artifact.modules.length, 3);
      assert.equal(report.runtimeExecutionVerified, false); assert.equal(report.frameworkDependenciesBundled, false);
      for (const row of report.artifact.modules) {
        assert.equal(row.sha256, hash(fs.readFileSync(path.join(options.rootDir, row.module))));
        const emitted = fs.readFileSync(path.join(options.outputDir, row.fileName)); assert.equal(row.outputSha256, hash(emitted)); assert.equal(row.outputBytes, emitted.length);
        if (row.imports.length) assert.notEqual(row.sha256, row.outputSha256);
      }
      const provider = await import(pathToFileURL(path.join(options.outputDir, report.artifact.providers[0].fileName)).href); assert.equal(provider.createPanel({}), 'captured');
      const second = await buildMaracaXTensionComposition({ ...options, manifest: { ...options.manifest, modules: [...options.manifest.modules].reverse() } }); assert.deepEqual(second, report);
      for (const file of Object.keys(valid)) fs.writeFileSync(path.join(options.rootDir, file), 'throw new Error("replacement")');
      assert.equal(provider.createPanel({}), 'captured');
      await assert.rejects(buildMaracaXTensionComposition({ ...options, outputDir: path.join(temp, 'replaced') }), /integrity mismatch/);
    });
    for (const [label, files, pins] of [
      ['unpinned transitive import', valid, ['panel.mjs', 'component.mjs']],
      ['unused pinned module', { ...valid, 'unused.mjs': 'export function unused() {}' }],
      ['missing named export', { ...valid, 'component.mjs': 'export function absent() {}' }],
      ['cycle', { 'panel.mjs': "import { other } from './other.mjs'; export function createPanel() { return other(); }", 'other.mjs': "import { createPanel } from './panel.mjs'; export function other() { return createPanel(); }" }],
      ...[
        ['bare peer import', "import { createElement } from 'react'; export function createComponent() { return createElement; }"],
        ['remote import', "import { x } from 'https://example.test/x.mjs'; export function createComponent() { return x; }"],
        ['root escape', "import { x } from '../outside.mjs'; export function createComponent() { return x; }"],
        ['encoded path', "import { x } from './%66ormat.mjs'; export function createComponent() { return x; }"],
        ['query suffix', "import { x } from './format.mjs?x'; export function createComponent() { return x; }"],
        ['implicit extension', "import { x } from './format'; export function createComponent() { return x; }"],
        ['side-effect-only import', "import './common/format.mjs'; export function createComponent() {}"],
        ['default import', "import value from './common/format.mjs'; export function createComponent() { return value; }"],
        ['reexport', "export { format as createComponent } from './common/format.mjs';"],
        ['default export', "export default function createComponent() {}"],
        ['top-level call', "globalThis.__a043Executed = true; export function createComponent() {}"],
        ['top-level initializer', "const value = globalThis.alert(); export function createComponent() {}"],
        ['top-level class', "class Example { static value = globalThis.alert(); } export function createComponent() {}"],
        ['dynamic import in nested body', "export function createComponent() { return () => import('./common/format.mjs'); }"],
        ['require in nested body', "export function createComponent() { return () => require('react'); }"],
        ['import.meta', "export function createComponent() { return import.meta.url; }"],
        ['async function', "export async function createComponent() {}"],
        ['generator function', "export function* createComponent() {}"],
        ['invalid JavaScript', "export function createComponent( {"],
        ['import attributes', "import { format } from './common/format.mjs' with { type: 'json' }; export function createComponent() { return format(); }"]
      ].map(([label, source]) => [label, { ...valid, 'component.mjs': source }])
    ]) await check(`reject ${label} before output mutation`, async () => {
      const options = fixture(files, pins); await assert.rejects(buildMaracaXTensionComposition(options)); assert.equal(fs.existsSync(options.outputDir), false); assert.equal(globalThis.__a043Executed, undefined);
    });
    for (const [label, mutate] of [
      ['missing module inventory', m => { delete m.modules; }],
      ['duplicate module pin', m => m.modules.push(m.modules[0])],
      ['entry pin mismatch', m => { m.modules.find(row => row.module === './panel.mjs').sha256 = '0'.repeat(64); }],
      ['unknown module authority', m => { m.modules[0].loader = 'remote'; }],
      ['noncanonical pinned path', m => { m.modules[0].module = './common/../component.mjs'; }],
      ['legacy manifest cannot opt into imports implicitly', m => { m.schema = 'xtend.maraca.xtension-composition-manifest.v1'; delete m.modules; }]
    ]) await check(`reject ${label}`, async () => {
      const options = fixture(valid); mutate(options.manifest); await assert.rejects(buildMaracaXTensionComposition(options)); assert.equal(fs.existsSync(options.outputDir), false);
    });
    await check('UTF-8 BOM and Unicode offsets survive import rewriting', async () => {
      const options = fixture({ ...valid, 'panel.mjs': '\uFEFF/* 😀 */ ' + valid['panel.mjs'] }), report = await buildMaracaXTensionComposition(options);
      const emitted = fs.readFileSync(path.join(options.outputDir, report.artifact.providers[0].fileName));
      assert.equal(emitted.subarray(0, 3).toString('hex'), 'efbbbf');
      assert.equal((await import(pathToFileURL(path.join(options.outputDir, report.artifact.providers[0].fileName)).href)).createPanel(), 'captured');
    });
    await check('invalid UTF-8 in a pinned dependency is rejected before output', async () => {
      const options = fixture({ ...valid, 'common/format.mjs': Buffer.from([0xff]) });
      await assert.rejects(buildMaracaXTensionComposition(options)); assert.equal(fs.existsSync(options.outputDir), false);
    });
    await check('transitive source integrity is mandatory even when entry bytes are unchanged', async () => {
      const options = fixture(valid); fs.appendFileSync(path.join(options.rootDir, 'common/format.mjs'), '\n');
      await assert.rejects(buildMaracaXTensionComposition(options), /integrity mismatch/); assert.equal(fs.existsSync(options.outputDir), false);
    });
    await check('dependency symlink escape and internal aliases are rejected', async () => {
      const options = fixture(valid), file = path.join(options.rootDir, 'common/format.mjs'); fs.unlinkSync(file); fs.symlinkSync(path.join(root, 'development/rmtx-a04/providers/react-panel.mjs'), file);
      await assert.rejects(buildMaracaXTensionComposition(options), /canonical regular files/); assert.equal(fs.existsSync(options.outputDir), false);
      fs.unlinkSync(file); fs.writeFileSync(path.join(options.rootDir, 'other.mjs'), valid['common/format.mjs']); fs.symlinkSync('../other.mjs', file);
      await assert.rejects(buildMaracaXTensionComposition(options), /canonical regular files/);
    });
    await check('relative parent imports resolve inside the same pinned root', async () => {
      const files = { ...valid, 'component.mjs': "import { format } from './common/format.mjs'; export function createComponent() { return format(); }", 'common/format.mjs': "import { value } from '../value.mjs'; export function format() { return value(); }", 'value.mjs': "export function value() { return 'parent'; }" };
      const options = fixture(files), report = await buildMaracaXTensionComposition(options);
      assert.equal((await import(pathToFileURL(path.join(options.outputDir, report.artifact.providers[0].fileName)).href)).createPanel(), 'parent');
    });
    await check('byte-identical distinct modules retain ESM identity while shared imports reuse one module', async () => {
      const source = 'export function value() {}';
      const options = fixture({ 'panel.mjs': "import { value as first } from './first.mjs'; import { value as second } from './second.mjs'; import * as shared from './first.mjs'; export function createPanel() { return [first === second, first === shared.value]; }", 'first.mjs': source, 'second.mjs': source });
      const report = await buildMaracaXTensionComposition(options);
      const records = report.artifact.modules.filter(row => row.module !== './panel.mjs');
      assert.equal(records[0].outputSha256, records[1].outputSha256); assert.notEqual(records[0].fileName, records[1].fileName);
      const provider = await import(pathToFileURL(path.join(options.outputDir, report.artifact.providers[0].fileName)).href); assert.deepEqual(provider.createPanel(), [false, true]);
    });
    await check('all captured dependency bytes survive source replacement before first execution', async () => {
      const options = fixture(valid), report = await buildMaracaXTensionComposition(options);
      for (const module of Object.keys(valid)) fs.writeFileSync(path.join(options.rootDir, module), 'throw new Error("changed")');
      const provider = await import(pathToFileURL(path.join(options.outputDir, report.artifact.providers[0].fileName)).href); assert.equal(provider.createPanel(), 'captured');
    });
    await check('changing a leaf changes ancestor output identities and the companion identity', async () => {
      const options = fixture(valid), before = await buildMaracaXTensionComposition(options), source = "export function format() { return 'changed'; }";
      fs.writeFileSync(path.join(options.rootDir, 'common/format.mjs'), source); options.manifest.modules.find(row => row.module === './common/format.mjs').sha256 = hash(source);
      const after = await buildMaracaXTensionComposition(options); assert.notEqual(before.artifact.entryFile, after.artifact.entryFile);
      assert.notEqual(before.artifact.providers[0].fileName, after.artifact.providers[0].fileName);
      assert.equal((await import(pathToFileURL(path.join(options.outputDir, before.artifact.providers[0].fileName)).href)).createPanel(), 'captured');
      assert.equal((await import(pathToFileURL(path.join(options.outputDir, after.artifact.providers[0].fileName)).href)).createPanel(), 'changed');
    });
    await check('immutable addressed outputs cannot be replaced', async () => {
      const options = fixture(valid), report = await buildMaracaXTensionComposition(options); fs.writeFileSync(path.join(options.outputDir, report.files[0].fileName), 'forged');
      await assert.rejects(buildMaracaXTensionComposition(options));
    });
    await check('artifact graph tampering is rejected before runtime ports', async () => {
      const options = fixture(valid), built = await buildMaracaXTensionComposition(options), { validateArtifact } = await import('../../xtend-maraca/xtension-composition-contract.mjs');
      for (const mutate of [a => a.modules.pop(), a => a.modules[0].sha256 = '0'.repeat(64), a => a.modules[0].imports.push({ specifier: '../outside.mjs', module: './outside.mjs' }), a => a.providers[0].outputSha256 = '0'.repeat(64), a => a.manifest.schema = 'xtend.maraca.xtension-composition-manifest.v1']) {
        const artifact = copy(built.artifact); mutate(artifact); assert.throws(() => validateArtifact(artifact, plan, bindingsRuntime));
      }
    });
    for (const framework of ['react', 'vue', 'mixed']) await check(`${framework}: regular strict graph build, shared source/output accounting and actual digests`, async () => {
      const out = path.join(temp, 'integrated-' + framework), input = integrated.withProviderGraph(integrated.createBuildInput(framework, out, { profile: framework === 'vue' ? 'max' : 'production' }));
      const report = await require('../../xtend-maraca').buildMaracaBundleAsync(input, { rootDir: root }); assert.equal(report.ok, true, JSON.stringify(report.plan.diagnostics));
      const composition = JSON.parse(fs.readFileSync(path.join(out, 'xtend.xtensions.report.json'))), budget = report.sizeBudgetReport;
      assert.equal(composition.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v3'); assert.equal(budget.mode, 'strict'); assert.equal(budget.status, 'within_budget'); assert(budget.xtensions.withinBudget);
      assert(budget.framework.bytes <= 2200000); assert(budget.xtensions.runtimeBytes <= 240000);
      assert.equal(composition.artifact.modules.length, framework === 'mixed' ? 5 : 3);
      assert.equal(budget.xtensions.sourceFiles.filter(row => row.source.endsWith('/graph/format.mjs')).length, 1);
      const unique = new Set(composition.artifact.modules.map(row => row.fileName));
      assert.equal(budget.xtensions.runtimeFiles.filter(row => row.fileName.startsWith('providers/')).length, unique.size);
      for (const row of composition.artifact.modules) {
        const actual = fs.readFileSync(path.join(out, row.fileName)); assert.equal(hash(actual), row.outputSha256); assert.equal(actual.length, row.outputBytes);
        const source = budget.xtensions.sourceFiles.find(file => file.source === 'provider/' + row.module.slice(2)); assert.equal(source.bytes, row.sourceBytes); assert.equal(source.sha256, row.sha256);
      }
      sizes[framework] = { frameworkBytes: budget.framework.bytes, xtensionRuntimeBytes: budget.xtensions.runtimeBytes };
    });
    const sources = ['xtend-maraca/xtension-provider-graph.js', 'xtend-maraca/xtension-composition.js', 'xtend-maraca/xtension-composition-contract.mjs', 'xtend-maraca/xtension-composition-runtime.mjs', 'xtend-maraca/xtension-size-budget.js', 'xtend-maraca/xtension-composition.d.ts', 'xtend-maraca/xtension-composition-runtime.d.ts', 'xtend-maraca/package.json', 'development/rmtx-a04/graph-inspect.cjs', 'development/rmtx-a04/integration-reference.cjs', ...fs.readdirSync(path.join(__dirname, 'providers/graph')).sort().map(file => 'development/rmtx-a04/providers/graph/' + file), 'scripts/test_xtensions_runtime_adapters.cjs', 'tests/xtensions/integrated-composition-acceptance.js', 'tests/xtensions/xtensions_consumer_package_suite.js', 'tests/types/xtensions_integrated_composition.mts'];
    const evidence = { format: 1, stage: 'A04.3.1-local-static-provider-graphs', status: 'implemented', manifestVersion: 2, artifactVersion: 3, buildReportVersion: 3, apiVersion: '3.0.0', cycles: 'rejected', runtimeExecutionVerified: false, acceptedForRelease: false, checks: names.length, names, sizes,
      sources: Object.fromEntries(sources.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
    const text = JSON.stringify(evidence, null, 2) + '\n', output = path.join(__dirname, 'graph-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(output, text); if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, 'A04.3.1 source/contract drift');
    console.log(`A04.3.1: ${names.length} graph/build/contract checks; actual browser execution has a separate mandatory gate.`); return evidence;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
