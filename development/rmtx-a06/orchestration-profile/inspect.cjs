'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const sourceFiles = [
  'package.json', 'tools/package.json',
  ...['rmtx-parser.js', 'rmtx-parser.d.ts', 'rmtx-compiler.js', 'rmtx-compiler.d.ts', 'rmtx-host-scopes.js',
    'rmtx-operator-profiles.js', 'rmtx-operator-profiles.d.ts', 'rmtx-operator-coverage.js', 'rmtx-operator-coverage.json',
    'rmtx-extended-operators.js', 'rmtx.js', 'rmtx.d.ts', 'rmtx-component-bindings.js', 'rmtx-component-bindings.d.ts',
    'rmtx-selector-dependencies.js', 'rmtx-selector-dependencies.d.ts', 'action-input-contract.js', 'action-input-contract.d.ts',
    'action-execution-lowering.js', 'classic-semantic-rules.js', 'classic-compiler.js', 'classic-compiler.d.ts', 'vnext-compiler.js', 'vnext-compiler.d.ts',
    'contracts/classic-ast.v1.schema.json', 'contracts/action-input-contract.v1.schema.json', 'vendor/fastpass-contract.js', 'vendor/manifest.json',
    'rmtx-component-bindings.js', 'rmtx-component-bindings.d.ts', 'rmtx-selector-dependencies.js', 'rmtx-selector-dependencies.d.ts', 'scheduler-lanes.js'].map(file => 'tools/rmt-language/' + file),
  ...['component-interface.js', 'component-interface.d.ts', 'component-interface-build.js',
    'state-binding-artifact.js', 'state-binding-artifact.d.ts', 'state-binding-contract.js', 'state-binding-projection.js', 'state-binding.js', 'state-binding.d.ts'].map(file => 'tools/xtensions/' + file),
  ...['component-interface.v1.schema.json', 'component-interface.v2.schema.json', 'runtime-host-controller.js', 'runtime-host-controller.d.ts',
    'host-controller-contract.js', 'host-controller-contract.d.ts', 'cooperative-resource-scope.js', 'framework-ssr.js', 'host-capability-negotiation.js',
    'host-resource-cleanup-record.js', 'kernel-work-scope.js', 'react-runtime-adapter.js', 'react-runtime-adapter.d.ts', 'react-runtime-boundary.js',
    'react-payload-boundary.js', 'resource-graph-binding.js', 'signal-bridge-contract.js', 'vue-runtime-adapter.js', 'vue-runtime-adapter.d.ts',
    'vue-runtime-boundary.js', 'vue-payload-boundary.js', 'work-budget-policy.js'].map(file => 'tools/xtensions/' + file),
  'tools/xtensions/url-state.js', 'tools/xtensions/url-state.d.ts', 'tools/xtensions/state-binding-projection-disabled.js',
  ...['policy', 'state', 'restore-plan', 'history-proposal'].flatMap(name => [1, 2].map(version => `tools/xtensions/url-state-contracts/${name}.v${version}.schema.json`)),
  ...['index.js', 'index.d.ts', 'plan-runtime.mjs', 'xtension-component-binding.mjs', 'xtension-composition-contract.mjs',
    'xtension-composition.js', 'xtension-composition.d.ts', 'browser-composition-runtime.mjs', 'xtension-composition-runtime.mjs', 'xtension-composition-runtime.d.ts',
    'xtension-platform-build.js', 'xtension-platform-esm.js', 'xtension-ssr-runtime.mjs', 'browser-host-adapter.mjs', 'fastpass-contract.js',
    'plan-runtime.d.ts', 'browser-composition-runtime.d.ts', 'xtension-component-binding-disabled.mjs', 'package.json'].map(file => 'xtend-maraca/' + file),
  'xtendrmt/rmt-action-effect-runtime.js', 'xtendrmt/rmt-event-routing-runtime.js',
  'components/xrouter-url-state.js', 'components/xrouter-url-state.d.ts', 'components/xrouter.js', 'components/xrouter.d.ts',
  ...['source.rmtx', 'reference.cjs', 'providers.json', 'react.interface.v2.json', 'runtime-test.cjs', 'runtime-acceptance.mjs', 'inspect.cjs'].map(file => 'development/rmtx-a06/orchestration-profile/' + file),
  ...['providers/vue.interface.json', 'scoped-fixture.mjs', 'scoped-model.cjs', 'scoped-reference.cjs', 'automatic-reference.cjs',
    'two-host-reference.cjs', 'keyed-profile/runtime-acceptance.mjs'].map(file => 'development/rmtx-a06/' + file),
  ...['rmtx-operator-profiles.test.cjs', 'rmtx-extended-operators.test.cjs', 'rmtx-orchestration.test.cjs', 'action-input-contract.test.cjs',
    'rmtx-inline-components.test.cjs', 'rmtx-maraca-integration.test.cjs', 'fixtures/rmtx-host-scopes-consumer.ts'].map(file => 'tests/rmt-language/' + file),
  'tests/xtensions/projected-state-binding.test.cjs', 'tests/xtensions/projected-url-state.test.cjs', 'tests/xtensions/runtime-adapter-exports.cjs',
  'tests/xtensions/compiled-state-binding-compiler.cjs', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/platform-projection-profile.test.cjs', 'tests/xtensions/projected-xrouter-url-state.test.cjs',
  'scripts/check_release_preparation.cjs', 'scripts/sync_rmt_compiler_contracts.cjs', 'tests/release/preparation-gates.test.cjs', 'scripts/test-runner/catalog.json',
  ...['xtend-default-gates.yml', 'xtend-migration-completion.yml', 'xtend-nightly-build.yml'].map(file => '.github/workflows/' + file)
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function inspect({ write = false, check = false } = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-orchestration-inspect-')), names = [];
  const verify = async (name, callback) => { await callback(); names.push(name); };
  try {
    const readSources = () => Object.fromEntries([...new Set(sourceFiles)].sort().map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
    const sources = readSources();
    const reference = require('./reference.cjs');
    const { getRmtxOperatorProfile } = require('../../../tools/rmt-language/rmtx-operator-profiles');
    const { RMTX_CLASSIC_AST_COVERAGE: coverage } = require('../../../tools/rmt-language/rmtx-operator-coverage');
    const compiler = require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '4.0.0' });
    const sourcePath = path.join(root, reference.source), text = fs.readFileSync(sourcePath, 'utf8');
    const input = reference.createInput(temporary), compiled = compiler.compileSource({ text, filePath: sourcePath }, { componentInterfaceCatalog: reference.catalog() });
    await verify('actual source4 file compiles through its explicit productive compiler and closed Classic AST port', () => {
      assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics)); assert.equal(compiled.schema, 'xtend.rmtx.compile-result.v4');
      assert.equal(compiled.apiVersion, '4.0.0'); assert.equal(compiled.parserResult.schema, 'xtend.rmtx.parser-result.v4');
      assert.equal(compiled.sourceProfile.version, '4.0.0');
      assert.deepEqual(require('../../../tools/rmt-language/classic-ast-contract').validateRmtClassicAst(compiled.parserResult.ast), []);
      assert.equal(compiled.coreDocument.manifest.sourceSyntax, 'rmtx');
    });
    await verify('new source4 catalogue versions classify all 122 Classic nodes without a raw source escape hatch', () => {
      const profile = getRmtxOperatorProfile('4.0.0');
      assert.equal(profile.schema, 'xtend.rmtx.operator-profile.v3'); assert.equal(profile.apiVersion, '3.0.0');
      assert.equal(Object.keys(profile.operators).length, 110); assert.equal(coverage.nodes.length, 122);
      assert.deepEqual(coverage.counts, { 'helper-or-attribute': 21, 'source-operator': 99, 'deferred-native-ui': 2 });
      assert.equal(profile.semantics.operators.rawAstEscapeHatch, false); assert.equal(profile.semantics.operators.classicSourceStringEscapeHatch, false);
      assert.equal(profile.operators.Mount.attributes.when, undefined); assert.equal(profile.semantics.nativeUIChildren, false);
      // Global module capability; the explicit Source3/4 contracts above remain unchanged.
      assert.equal(require('../../../tools/rmt-language/rmtx').RMTX_AUTHORING_API_VERSION, '7.0.0');
    });
    await verify('legacy source defaults and catalogue records1, 2 and 3 remain exactly available', () => {
      assert.equal(require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler().apiVersion, '1.0.0');
      const expected = { '1.0.0': 'd40079c970f88ee4c66e547f81d1d35052643a86c3d79712b79d4e8cc4aff4ec',
        '2.0.0': '27f9d25ba4e730b0db9812a451af631d14bb1fa11cd16abd9ef35d19002f55c1',
        '3.0.0': '5185b4cee48e10a0300b0dbb693a6b6ee5ec135f9ad09b0aa8f51f8c74afb434' };
      for (const [version, sha] of Object.entries(expected)) assert.equal(hash(JSON.stringify(getRmtxOperatorProfile(version))), sha);
    });
    await verify('inline provider declarations replace external binding and composition sidecars', () => {
      assert.equal(input.xtensionBindings, undefined); assert.equal(input.xtensionComposition, undefined);
      assert.equal(compiled.parserResult.components.schema, 'xtend.rmtx.components.v1');
      assert.equal(compiled.parserResult.components.hosts.length, 2);
      assert.equal(compiled.xtensionBindings.schema, 'xtend.xtensions.state-binding-artifact.v4');
      assert.equal(compiled.xtensionComposition.schema, 'xtend.maraca.xtension-composition-manifest.v8');
      assert(compiled.xtensionBindings.bindings.every(entry => entry.binding.schema === 'xtend.xtensions.state-binding.v3'));
    });
    await verify('closed source props retain both direct reads and transitive selector Model dependencies', () => {
      assert.equal(compiled.selectorDependencies.schema, 'xtend.rmtx.selector-dependencies.v3');
      assert.equal(compiled.componentDependencies.schema, 'xtend.rmtx.component-dependencies.v1');
      assert.equal(compiled.componentDependencies.runtimeTracking, false);
      const gallery = compiled.componentDependencies.declarations.find(entry => entry.declarationId === 'product-gallery');
      assert(gallery.reads.some(read => read.root === 'selector' && read.symbol === 'galleryImages'));
      assert(gallery.transitiveStateReads.some(read => read.root === 'state' && read.symbol === 'sharedImages'));
      assert(gallery.allSyntacticBranches);
    });
    await verify('typed action contracts and source host scope versions are explicit, preserving typed key ancestry', () => {
      assert.equal(compiled.orchestrationArtifacts.schema, 'xtend.rmt.app-orchestration.v2');
      assert.equal(compiled.orchestrationArtifacts.actions.schema, 'xtend.rmt.action-plan.v2');
      assert.equal(compiled.orchestrationArtifacts.actions.inputContract.schema, 'xtend.rmt.action-input-contract.v1');
      assert.equal(compiled.parserResult.hostScopes.schema, 'xtend.rmtx.host-scopes.v2');
      assert(compiled.xtensionBindings.bindings.every(entry => entry.repeat.length === 2 && entry.presence));
      assert(!JSON.stringify(compiled.parserResult.ast).includes('RmtSurfaceRepeatClause'));
    });
    const compileChecks = reference.verifyCompileCases();
    await verify('unknown providers, props, selectors, source calls and sidecar conflicts fail closed', () => {
      assert.equal(compileChecks.passed, true); assert.equal(compileChecks.checks, 10);
    });
    const build = await reference.build(temporary);
    await verify('regular Maraca build captures exact source bytes and emits build plan8', () => {
      assert.equal(build.ok, true, build.status + JSON.stringify(build.plan.diagnostics));
      assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v8'); assert.equal(build.plan.rmt.compilerSchema, compiled.schema);
      assert.equal(build.plan.sourceHash, hash(text)); assert.equal(build.plan.source, reference.source);
    });
    const composition = JSON.parse(fs.readFileSync(path.join(temporary, 'xtend.xtensions.report.json'), 'utf8'));
    await verify('actual generated composition has new manifest8, artifact9 and version9 build report', () => {
      assert.equal(composition.schema, 'xtend.maraca.xtension-composition-build-report.v9');
      assert.equal(composition.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v9');
      assert.equal(composition.artifact.manifest.schema, 'xtend.maraca.xtension-composition-manifest.v8');
      for (const entry of composition.files) {
        const bytes = fs.readFileSync(path.join(temporary, entry.fileName)); assert.equal(bytes.length, entry.bytes); assert.equal(hash(bytes), entry.sha256);
      }
    });
    await verify('source4 passes the unchanged strict production source and contract budget algorithm', () => {
      const budget = build.sizeBudgetReport;
      assert.equal(budget.ok, true); assert.equal(budget.mode, 'strict');
      assert(budget.xtensions.enforced && budget.xtensions.withinBudget && budget.framework.withinBudget);
      assert(budget.framework.bytes < budget.framework.baselineBytes);
      assert(budget.xtensions.runtimeBytes < budget.xtensions.baselineBytes);
    });
    await verify('runtime gates and every GitHub workflow demand newly generated source4 node and browser reports', () => {
      const gate = fs.readFileSync(path.join(root, 'tests/xtensions/xtensions_runtime_gate_suite.js'), 'utf8');
      assert(gate.includes('orchestration-profile/runtime-test.cjs'));
      const catalog = fs.readFileSync(path.join(root, 'scripts/test-runner/catalog.json'), 'utf8');
      for (const mode of ['node', 'browser']) {
        const name = 'xtend-rmtx-orchestration-runtime-' + mode + '-report.json'; assert(catalog.includes(name));
        for (const workflow of ['xtend-default-gates.yml', 'xtend-migration-completion.yml', 'xtend-nightly-build.yml'])
          assert(fs.readFileSync(path.join(root, '.github/workflows', workflow), 'utf8').includes(name));
      }
    });
    assert.deepEqual(readSources(), sources, 'RMTX orchestration inputs changed during inspection.');
    const evidence = { format: 1, version: '1.0.0', date: '2026-11-17', stage: 'A06.3-orchestration-profile', passed: true,
      sourceProfile: compiled.sourceProfile, parserSchema: compiled.parserResult.schema, compilerSchema: compiled.schema,
      operatorProfileSchema: getRmtxOperatorProfile('4.0.0').schema, operatorTags: 110, classicAstCoverage: coverage.counts,
      checks: names.length, names, compileChecks, inlineProviders: true, typedNativeActionInputs: true,
      productionBudget: { schema: build.sizeBudgetReport.schema, mode: build.sizeBudgetReport.mode,
        unchangedSourceAndContractBaselineRule: true, frameworkBytes: build.sizeBudgetReport.framework.bytes,
        frameworkBaselineBytes: build.sizeBudgetReport.framework.baselineBytes,
        xtensionRuntimeBytes: build.sizeBudgetReport.xtensions.runtimeBytes, xtensionBaselineBytes: build.sizeBudgetReport.xtensions.baselineBytes,
        sourceBytes: build.sizeBudgetReport.xtensions.sourceBytes, contractBytes: build.sizeBudgetReport.xtensions.contractBytes },
      nativeRepeatSupported: false, lifecycleWhenSupported: false, nativeRuntimeExecutionInStaticCheck: false,
      generalNativeUiImplemented: false, semanticProjectToolingImplemented: false, ssrAcceptancePerformed: false, acceptedForRelease: false,
      sources };
    const outputs = { 'evidence.json': evidence, 'compiled-core.json': compiled.coreDocument, 'compiled-orchestration.json': compiled.orchestrationArtifacts };
    for (const [file, value] of Object.entries(outputs)) {
      const bytes = JSON.stringify(value, null, 2) + '\n', output = path.join(__dirname, file);
      if (write) fs.writeFileSync(output, bytes);
      if (check) assert.equal(fs.readFileSync(output, 'utf8'), bytes, `RMTX orchestration ${file} drift`);
    }
    return evidence;
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) inspect({ write: process.argv.includes('--write'), check: process.argv.includes('--check') })
  .then(result => console.log(JSON.stringify({ passed: result.passed, stage: result.stage, checks: result.checks, sources: Object.keys(result.sources).length })))
  .catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect, sourceFiles: Object.freeze([...new Set(sourceFiles)].sort()) };
