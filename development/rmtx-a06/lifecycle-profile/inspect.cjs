'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../../..'), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = Object.freeze([...new Set([
  ...require('../native-view-profile/inspect.cjs').sourceFiles,
  ...['rmtx-native-lifecycle.js', 'rmtx-native-lifecycle.d.ts'].map(file => 'tools/rmt-language/' + file),
  ...['native-lifecycle.js', 'native-lifecycle.d.ts'].map(file => 'tools/xtensions/' + file),
  ...['native-lifecycle-runtime.mjs', 'native-lifecycle-runtime.d.ts', 'browser-composition-runtime.d.ts', 'browser-host-adapter.d.ts'].map(file => 'xtend-maraca/' + file),
  'tests/rmt-language/rmtx-lifecycle.test.cjs', 'tests/xtensions/native-lifecycle-protocol.test.cjs', 'tests/xtensions/lifecycle-browser-profile.test.cjs',
  'tests/xtensions/lifecycle-composition-profile.test.cjs', 'tests/maraca/rmtx-lifecycle.test.mjs',
  ...['source.rmtx', 'native-only.rmtx', 'reference.cjs', 'runtime-test.cjs', 'runtime-acceptance.mjs', 'inspect.cjs'].map(file => 'development/rmtx-a06/lifecycle-profile/' + file)
])].sort());
async function inspect({ write = false, check = false } = {}) {
  const reference = require('./reference.cjs'), names = [], temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-lifecycle-inspect-'));
  const verify = async (name, execute) => { await execute(); names.push(name); };
  const readSources = () => Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
  const sources = readSources();
  try {
    const compiled = reference.compiler().compileSource({ text: fs.readFileSync(path.join(root, reference.source), 'utf8'), filePath: reference.source }, { componentInterfaceCatalog: reference.catalog() });
    await verify('Source6 composes explicit unchanged View5/Action4 through formal Classic AST1', () => {
      assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics)); assert.equal(compiled.schema, 'xtend.rmtx.compile-result.v6');
      assert.equal(compiled.parserResult.schema, 'xtend.rmtx.parser-result.v6'); assert.equal(compiled.sourceProfile.version, '6.0.0');
      assert.equal(compiled.parserResult.viewProfile.version, '5.0.0'); assert.equal(compiled.parserResult.actionProfile.version, '4.0.0');
      assert.equal(compiled.parserResult.nativeView.sourceProfile.version, '5.0.0'); assert.equal(compiled.parserResult.actionInputRules.sourceProfile.version, '4.0.0');
      assert.deepEqual(require('../../../tools/rmt-language/classic-ast-contract').validateRmtClassicAst(compiled.parserResult.ast), []);
    });
    await verify('Program4 lifecycle retains exact owning operation provenance and closed Scalar IR3', () => {
      const program = compiled.orchestrationArtifacts, plan = require('../../../tools/xtensions/native-lifecycle').validateNativeLifecyclePlan(program);
      assert.equal(program.schema, 'xtend.rmt.app-orchestration.v4'); assert.equal(plan.schema, 'xtend.rmt.native-lifecycle-plan.v1');
      assert.equal(plan.operations.length, 1); assert.equal(plan.operations[0].ownerSurface, 'product-details');
      assert.equal(plan.operations[0].target, 'product-details'); assert.equal(plan.operations[0].lane, 'visible');
      assert.equal(compiled.lifecycleDependencies.schema, 'xtend.rmtx.lifecycle-dependencies.v1');
      assert.equal(compiled.selectorDependencies.schema, 'xtend.rmtx.selector-dependencies.v5');
    });
    await verify('initialfalse whole-group admission excludes native owner and every provider subtree', () => {
      const api = require('../../../tools/xtensions/native-view-projection').NATIVE_LIFECYCLE_VIEW_RUNTIME;
      const program = api.validateNativeViewProgram(compiled.orchestrationArtifacts), states = Object.fromEntries(program.state.states.map(value => [value.id, value.initial]));
      const projection = api.materializeNativeView(program, { states, selectors: { galleryImages: ['front', 'back'] } });
      assert(!JSON.stringify(projection).includes('Product details'));
      assert.equal(compiled.xtensionBindings.schema, 'xtend.xtensions.state-binding-artifact.v6');
      assert.equal(compiled.xtensionComposition.schema, 'xtend.maraca.xtension-composition-manifest.v10');
    });
    const compileChecks = reference.verifyCompileCases();
    await verify('unsupported guard capabilities reject before productive artifacts', () => { assert.equal(compileChecks.passed, true); assert.equal(compileChecks.checks, 7); });
    const mixed = await reference.build(path.join(temporary, 'mixed'));
    await verify('regular mixed FullBuild emits Plan10 and separate lifecycle runtime asset', () => {
      assert.equal(mixed.ok, true, mixed.status + JSON.stringify(mixed.plan.diagnostics)); assert.equal(mixed.plan.schema, 'xtend.maraca.build-plan.v10');
      for (const file of ['runtime/xtend-maraca-native-view.mjs', 'runtime/xtend-maraca-native-lifecycle-runtime.mjs']) assert(fs.existsSync(path.join(mixed.plan.outputDir, file)));
    });
    const composition = JSON.parse(fs.readFileSync(path.join(mixed.plan.outputDir, 'xtend.xtensions.report.json')));
    await verify('Artifact11/Manifest10 keep captured provider interfaces and exact output byte pins', () => {
      assert.equal(composition.artifact.schema, 'xtend.maraca.xtension-composition-artifact.v11');
      assert.equal(composition.artifact.manifest.schema, 'xtend.maraca.xtension-composition-manifest.v10');
      assert.deepEqual(composition.artifact.manifest.interfaces, compiled.xtensionComposition.interfaces);
      for (const file of composition.files) assert.equal(hash(fs.readFileSync(path.join(mixed.plan.outputDir, file.fileName))), file.sha256);
    });
    const native = await reference.build(path.join(temporary, 'native-only'), true);
    await verify('independent native-only FullBuild uses the same Plan10 with no provider composition', () => {
      assert.equal(native.ok, true, native.status + JSON.stringify(native.plan.diagnostics)); assert.equal(native.plan.schema, 'xtend.maraca.build-plan.v10');
      assert.equal(native.plan.xtensionComposition, undefined);
    });
    assert.deepEqual(readSources(), sources, 'Source files changed during static inspection.');
    const report = { schema: 'xtend.rmtx.native-lifecycle-evidence.v1', version: '1.0.0', stage: 'A06.4.2.1-static-native-lifecycle',
      passed: true, checks: names.length, names, compileChecks, sources, runtimeExecutionVerified: false,
      completeA064Implemented: false, acceptedForRelease: false, ssrAcceptancePerformed: false };
    const artifacts = { 'evidence.json': report, 'compiled.json': { schema: compiled.schema, sourceProfile: compiled.sourceProfile,
      sourceContract: compiled.parserResult.nativeLifecycle, program: compiled.orchestrationArtifacts, lifecycleDependencies: compiled.lifecycleDependencies } };
    for (const [file, value] of Object.entries(artifacts)) {
      const text = JSON.stringify(value, null, 2) + '\n', target = path.join(__dirname, file);
      if (write) fs.writeFileSync(target, text);
      if (check) assert.equal(fs.readFileSync(target, 'utf8'), text, file + ' differs from actual Source6 compilation.');
    }
    console.log(JSON.stringify(report)); return report;
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) inspect({ write: process.argv.includes('--write'), check: process.argv.includes('--check') }).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { sourceFiles, inspect };
