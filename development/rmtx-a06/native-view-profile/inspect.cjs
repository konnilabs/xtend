'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../../..'), hash = value => createHash('sha256').update(value).digest('hex');
const sourceFiles = Object.freeze([...new Set([
  ...require('../orchestration-profile/inspect.cjs').sourceFiles,
  'tools/rmt-language/rmtx-native-view.js', 'tools/rmt-language/rmtx-native-view.d.ts',
  'tools/rmt-language/semantic-graph.js',
  'tools/xtensions/repeat-scopes.js', 'tools/xtensions/native-data.js', 'tools/xtensions/native-view-projection.js', 'tools/xtensions/native-view-projection.d.ts',
  ...['rmt-dom-descriptor-renderer.js', 'rmt-dom-descriptor-renderer.d.ts', 'rmt-state-selector-runtime.js', 'rmt-state-selector-runtime.d.ts',
    'rmt-maraca-view-projection-adapter.js', 'rmt-maraca-view-projection-adapter.d.ts', 'rmt-surface-resource-graph-runtime.js',
    'rmt-surface-resource-graph-runtime.d.ts', 'rmt-kernel-orchestration-controller.js', 'rmt-kernel-scheduler.js'].map(file => 'xtendrmt/' + file),
  'fabric/xtend-fabric.js', 'components/xsurfacemanager-controller.js',
  'tests/rmt-language/rmtx-native-view.test.cjs', 'tests/xtensions/native-view-projection.test.cjs', 'tests/xtensions/native-state-binding.test.cjs',
  'tests/xtensions/native-url-state.test.cjs',
  'tests/maraca/rmtx-native-boundaries.test.mjs', 'tests/xtensions/native-composition-profile.test.cjs', 'tests/rmt/renderer-preflight.test.cjs',
  ...['xtension-deployment.js', 'xtension-size-budget.js', 'xtension-provider-graph.js'].map(file => 'xtend-maraca/' + file),
  ...['rmt-core.esm.js', 'rmt-core.d.ts', 'rmt-runtime.esm.js', 'rmt-runtime.browser.js', 'rmt-kernel-module-manifest.json'].map(file => 'xtendrmt/' + file),
  ...['source.rmtx', 'native-only.rmtx', 'reference.cjs', 'inspect.cjs', 'runtime-test.cjs', 'runtime-acceptance.mjs'].map(file => 'development/rmtx-a06/native-view-profile/' + file)
])].sort());
async function inspect({ write = false, check = false } = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-native-view-inspect-')), names = [];
  const verify = async (name, execute) => { await execute(); names.push(name); };
  try {
    const readSources = () => Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
    const sources = readSources(), reference = require('./reference.cjs'), compiler = reference.compiler();
    const text = fs.readFileSync(path.join(root, reference.source), 'utf8');
    const compiled = compiler.compileSource({ text, filePath: reference.source }, { componentInterfaceCatalog: reference.catalog() });
    await verify('actual Source5 produces Program3 through the unchanged Classic AST1 and Action4 subprofile', () => {
      assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
      assert.equal(compiled.schema, 'xtend.rmtx.compile-result.v5'); assert.equal(compiled.parserResult.schema, 'xtend.rmtx.parser-result.v5');
      assert.equal(compiled.sourceProfile.version, '5.0.0'); assert.equal(compiled.apiVersion, '5.0.0');
      assert.equal(compiled.orchestrationArtifacts.schema, 'xtend.rmt.app-orchestration.v3');
      assert.equal(compiled.orchestrationArtifacts.actions.schema, 'xtend.rmt.action-plan.v2');
      assert.equal(compiled.orchestrationArtifacts.actions.inputContract.schema, 'xtend.rmt.action-input-contract.v1');
      assert.deepEqual(require('../../../tools/rmt-language/classic-ast-contract').validateRmtClassicAst(compiled.parserResult.ast), []);
    });
    await verify('native source contracts and readsets explicitly name their own schema versions', () => {
      assert.equal(compiled.parserResult.nativeView.schema, 'xtend.rmtx.native-view.v1');
      assert.equal(compiled.orchestrationArtifacts.render.nativeView.schema, 'xtend.rmt.native-view.v1');
      assert.equal(compiled.nativeDependencies.schema, 'xtend.rmtx.native-view-dependencies.v1');
      assert.equal(compiled.selectorDependencies.schema, 'xtend.rmtx.selector-dependencies.v4');
      assert.equal(compiled.parserResult.hostScopes.schema, 'xtend.rmtx.host-scopes.v3');
      assert.equal(compiled.parserResult.components.schema, 'xtend.rmtx.components.v2');
      const reads = compiled.nativeDependencies.surfaces.find(surface => surface.surface === 'product-details');
      assert(reads.reads.some(read => read.symbol === 'galleryImages'));
      assert(reads.transitiveStateReads.some(read => read.symbol === 'sharedImages'));
    });
    await verify('Source5 uses the explicit Native binding artifact and the original provider identities', () => {
      assert.equal(compiled.xtensionBindings.schema, 'xtend.xtensions.state-binding-artifact.v5');
      assert.equal(compiled.xtensionComposition.schema, 'xtend.maraca.xtension-composition-manifest.v9');
      assert(compiled.xtensionBindings.bindings.every(entry => entry.binding.schema === 'xtend.xtensions.state-binding.v3'));
      assert.deepEqual(reference.providers(), require('../orchestration-profile/reference.cjs').providers());
      for (const pin of reference.providers().interfaces) assert.equal(hash(fs.readFileSync(path.resolve(root, pin.file))), pin.sha256);
    });
    await verify('Native View data materializes through the shared key-scope engine before the existing renderer', () => {
      const runtime = require('../../../tools/xtensions/native-view-projection'), program = runtime.validateNativeViewProgram(compiled.orchestrationArtifacts);
      const states = Object.fromEntries(program.state.states.map(state => [state.id, state.initial]));
      const descriptor = runtime.materializeNativeView(program, { states, selectors: { galleryImages: ['front', 'back'] } });
      assert(!JSON.stringify(descriptor).includes('native-projection')); assert(!JSON.stringify(descriptor).includes('nativeDeclarationId'));
      assert(!JSON.stringify(descriptor).includes('"type":"native-repeat"'));
      assert.equal(typeof require('../../../tools/xtensions/repeat-scopes').expandRepeatScopes, 'function');
    });
    const compileChecks = reference.verifyCompileCases();
    await verify('native executable escapes, reserved markers, unsafe ids and keyless loops fail before artifacts', () => { assert.equal(compileChecks.checks, 12); });
    await verify('Source4 and the default Source1 remain explicit retained profiles', () => {
      const profiles = require('../../../tools/rmt-language/rmtx-operator-profiles');
      assert.equal(profiles.getRmtxOperatorProfile('4.0.0').semantics.nativeUIChildren, false);
      assert.equal(profiles.getRmtxOperatorProfile('5.0.0').semantics.nativeUIChildren, true);
      assert.equal(compiler.sourceProfile.version, '5.0.0');
      assert.equal(require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler().sourceProfile.version, '1.0.0');
    });
    const build = await reference.build(path.join(temporary, 'mixed'));
    await verify('regular Maraca emits plan9 and its exact separately verifiable native projection ESM asset', () => {
      assert.equal(build.ok, true, build.status + JSON.stringify(build.plan.diagnostics));
      assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v9'); assert.equal(build.plan.sourceHash, hash(text));
      assert.equal(build.plan.rmt.compilerSchema, 'xtend.rmtx.compile-result.v5');
      assert(fs.existsSync(path.join(build.plan.outputDir, 'runtime/xtend-maraca-native-view.mjs')));
    });
    const report = JSON.parse(fs.readFileSync(path.join(build.plan.outputDir, 'xtend.xtensions.report.json')));
    await verify('Native composition artifact10 retains exact provider, peer, source and output byte pins', () => {
      assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v10');
      assert.equal(report.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v10');
      assert.equal(report.artifact.manifest.schema, 'xtend.maraca.xtension-composition-manifest.v9');
      for (const file of report.files) { const bytes = fs.readFileSync(path.join(build.plan.outputDir, file.fileName)); assert.equal(hash(bytes), file.sha256); assert.equal(bytes.length, file.bytes); }
    });
    const native = await reference.build(path.join(temporary, 'native-only'), true);
    await verify('native-only source takes the same regular plan9 build without provider configuration or sidecars', () => {
      assert.equal(native.ok, true, native.status + JSON.stringify(native.plan.diagnostics));
      assert.equal(native.plan.schema, 'xtend.maraca.build-plan.v9'); assert.equal(native.plan.xtensionComposition, undefined);
      assert.equal(reference.createInput(temporary, true).rmtxProviders, undefined);
      assert(fs.existsSync(path.join(native.plan.outputDir, 'runtime/xtend-maraca-native-view.mjs')));
    });
    await verify('new native data passes strict official production size budgets without raising legacy caps', () => {
      const budget = build.sizeBudgetReport;
      assert.equal(budget.ok, true); assert.equal(budget.mode, 'strict');
      assert(budget.xtensions.enforced && budget.xtensions.withinBudget && budget.framework.withinBudget);
    });
    await verify('all runtime lanes and GitHub workflows require the new Native node/browser reports', () => {
      const gate = fs.readFileSync(path.join(root, 'tests/xtensions/xtensions_runtime_gate_suite.js'), 'utf8');
      assert(gate.includes('native-view-profile/runtime-test.cjs'));
      const catalog = fs.readFileSync(path.join(root, 'scripts/test-runner/catalog.json'), 'utf8');
      for (const mode of ['node', 'browser']) {
        const file = `xtend-rmtx-native-view-runtime-${mode}-report.json`; assert(catalog.includes(file));
        for (const workflow of ['xtend-default-gates.yml', 'xtend-migration-completion.yml', 'xtend-nightly-build.yml']) assert(fs.readFileSync(path.join(root, '.github/workflows', workflow), 'utf8').includes(file));
      }
    });
    assert.deepEqual(readSources(), sources, 'Native profile sources changed during the actual inspection.');
    const evidence = { format: 1, version: '1.0.0', date: '2026-11-18', stage: 'A06.4.1-native-html-view', passed: true,
      sourceProfile: compiled.sourceProfile, parserSchema: compiled.parserResult.schema, compilerSchema: compiled.schema,
      nativeViewSchema: compiled.orchestrationArtifacts.render.nativeView.schema, nativeSourceSchema: compiled.parserResult.nativeView.schema,
      nativeDependenciesSchema: compiled.nativeDependencies.schema, checks: names.length, names, compileChecks,
      nativeRepeatSupported: true, nativeOnlyBuildVerified: true, runtimeExecutionInStaticCheck: false,
      nativeHtmlViewImplemented: true, lifecycleWhenSupported: false, completeA064Implemented: false,
      semanticProjectToolingImplemented: false, ssrAcceptancePerformed: false, acceptedForRelease: false, sources };
    const outputs = { 'compiled-core.json': compiled.coreDocument, 'compiled-orchestration.json': compiled.orchestrationArtifacts, 'evidence.json': evidence };
    for (const [file, value] of Object.entries(outputs)) {
      const bytes = JSON.stringify(value, null, 2) + '\n', output = path.join(__dirname, file);
      if (write) fs.writeFileSync(output, bytes);
      if (check) assert.equal(fs.readFileSync(output, 'utf8'), bytes, `Native View ${file} drift`);
    }
    return evidence;
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) inspect({ write: process.argv.includes('--write'), check: process.argv.includes('--check') })
  .then(result => console.log(JSON.stringify({ passed: result.passed, stage: result.stage, checks: result.checks, sources: Object.keys(result.sources).length })))
  .catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect, sourceFiles };
