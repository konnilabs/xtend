'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const sourceFiles = [
  'tools/rmt-language/rmtx-parser.js', 'tools/rmt-language/rmtx-parser.d.ts',
  'tools/rmt-language/rmtx-compiler.js', 'tools/rmt-language/rmtx-compiler.d.ts',
  'tools/rmt-language/rmtx-host-scopes.js', 'tools/rmt-language/rmtx-operator-profiles.js', 'tools/rmt-language/rmtx-operator-profiles.d.ts',
  'tools/rmt-language/rmtx.js', 'tools/rmt-language/rmtx.d.ts', 'tools/rmt-language/classic-compiler.js', 'tools/rmt-language/vnext-compiler.js',
  'tools/xtensions/state-binding-artifact.js', 'tools/xtensions/state-binding-contract.js',
  'tests/rmt-language/rmtx-host-scopes.test.cjs', 'tests/rmt-language/fixtures/rmtx-host-scopes-consumer.ts',
  'tests/xtensions/xtensions_runtime_gate_suite.js', 'scripts/test-runner/catalog.json',
  'scripts/check_release_preparation.cjs', 'tests/release/preparation-gates.test.cjs',
  '.github/workflows/xtend-default-gates.yml', '.github/workflows/xtend-migration-completion.yml', '.github/workflows/xtend-nightly-build.yml',
  'xtend-maraca/index.js', 'xtend-maraca/xtension-component-binding.mjs', 'xtend-maraca/xtension-composition-contract.mjs',
  'xtend-maraca/xtension-composition.js', 'xtend-maraca/browser-composition-runtime.mjs', 'xtend-maraca/plan-runtime.mjs',
  'tests/rmt-language/rmtx-host-scopes.test.cjs', 'tests/rmt-language/rmtx-operator-profiles.test.cjs',
  'tests/xtensions/xtensions_runtime_gate_suite.js', 'scripts/check_release_preparation.cjs', 'tests/release/preparation-gates.test.cjs',
  'scripts/test-runner/catalog.json', ...['xtend-default-gates.yml', 'xtend-migration-completion.yml', 'xtend-nightly-build.yml'].map(file => '.github/workflows/' + file),
  ...['source.rmtx', 'reference.cjs', 'inspect.cjs', 'runtime-test.cjs', 'runtime-acceptance.mjs'].map(file => 'development/rmtx-a06/keyed-profile/' + file),
  ...['scoped-reference.cjs', 'scoped-fixture.mjs', 'scoped-model.cjs', 'automatic-reference.cjs', 'two-host-reference.cjs',
    'providers/catalog.json', 'providers/react.interface.json', 'providers/vue.interface.json'].map(file => 'development/rmtx-a06/' + file)
];
const hash = value => createHash('sha256').update(value).digest('hex');
async function inspect({ write = false, check = false } = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-keyed-inspect-')), names = [];
  const verify = async (name, callback) => { await callback(); names.push(name); };
  try {
    const reference = require('./reference.cjs');
    const compiler = require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '3.0.0' });
    const input = await reference.createInput(temporary), sourcePath = path.join(root, input.source), text = fs.readFileSync(sourcePath, 'utf8');
    const compiled = compiler.compileSource({ text, filePath: sourcePath }, { xtensionBindings: input.xtensionBindings });
    await verify('actual file source compiles only through the explicit v3 frontend', () => {
      assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics)); assert.equal(compiled.schema, 'xtend.rmtx.compile-result.v3');
      assert.equal(compiled.sourceProfile.version, '3.0.0'); assert.equal(compiled.coreDocument.manifest.sourceSyntax, 'rmtx');
      const profile = require('../../../tools/rmt-language/rmtx-operator-profiles').getRmtxOperatorProfile('3.0.0');
      assert.equal(profile.schema, 'xtend.rmtx.operator-profile.v2'); assert.equal(profile.apiVersion, '2.0.0');
      assert.equal(Object.keys(profile.operators).length, 16);
      // Global module capability; the explicit Source3/4 contracts above remain unchanged.
      assert.equal(require('../../../tools/rmt-language/rmtx').RMTX_AUTHORING_API_VERSION, '8.0.0');
    });
    await verify('source host scopes supplement the static Classic AST without native repeat clauses', () => {
      assert.equal(compiled.parserResult.hostScopes.schema, 'xtend.rmtx.host-scopes.v1');
      assert.equal(compiled.parserResult.hostScopes.hosts.length, 2);
      const ast = JSON.stringify(compiled.parserResult.ast);
      assert(!ast.includes('RmtxHostRepeatScope') && !ast.includes('RmtSurfaceRepeatClause'));
      assert.equal(compiled.parserResult.ast.body[0].body.filter(node => node.type === 'RmtSurfaceDeclaration').length, 3);
    });
    await verify('source repeat and presence are projected into v3 bindings without predeclared sidecar scopes', () => {
      assert(input.xtensionBindings.bindings.every(entry => !Object.hasOwn(entry, 'repeat') && !Object.hasOwn(entry, 'presence')));
      assert(compiled.xtensionBindings.bindings.every(entry => entry.repeat.length === 2 && entry.presence));
    });
    const compileChecks = reference.verifyCompileCases(compiler, text, sourcePath, input.xtensionBindings);
    await verify('invalid keys and nonboolean presence fail closed while empty scopes remain valid', () => {
      assert.equal(compileChecks.passed, true); assert.equal(compileChecks.checks, 7);
    });
    const build = await reference.build(temporary);
    await verify('regular Maraca build retains the actual v3 file hash and compiler schema', () => {
      assert.equal(build.ok, true, build.status + JSON.stringify(build.plan.diagnostics));
      assert.equal(build.plan.rmt.compilerSchema, compiled.schema); assert.equal(build.plan.sourceHash, hash(text));
      assert.equal(build.plan.source, input.source);
    });
    const composition = JSON.parse(fs.readFileSync(path.join(temporary, 'xtend.xtensions.report.json'))), artifact = composition.artifact;
    await verify('existing scoped component manifest and artifact versions remain authoritative', () => {
      assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v7'); assert.equal(artifact.schema, 'xtend.maraca.xtension-composition-artifact.v8');
      assert.equal(artifact.manifest.schema, 'xtend.maraca.xtension-composition-manifest.v7');
      assert.equal(composition.schema, 'xtend.maraca.xtension-composition-build-report.v8');
    });
    const bindings = require('../../../tools/xtensions/state-binding-artifact');
    const validated = bindings.validateStateBindingArtifact(artifact.plan.bindings, artifact.plan.program);
    await verify('shared materialization produces six parent-scoped typed addresses', () => {
      const rows = bindings.materializeStateBindingArtifact(validated, { states: build.plan.state });
      assert.equal(rows.length, 6); assert.equal(new Set(rows.map(row => JSON.stringify(row.binding.address))).size, 6);
      assert(rows.some(row => JSON.stringify(row.binding.address.keys) === JSON.stringify(['g', 1])));
      assert(rows.some(row => JSON.stringify(row.binding.address.keys) === JSON.stringify(['g', '1'])));
      assert(rows.some(row => JSON.stringify(row.binding.address.keys) === JSON.stringify(['h', 1])));
    });
    await verify('all emitted composition files retain their captured exact sizes and hashes', () => {
      for (const entry of composition.files) {
        const bytes = fs.readFileSync(path.join(temporary, entry.fileName)); assert.equal(bytes.length, entry.bytes); assert.equal(hash(bytes), entry.sha256);
      }
    });
    await verify('strict production accounting retains existing scoped framework and runtime ceilings', () => {
      const budget = build.sizeBudgetReport; assert(budget.xtensions.enforced && budget.xtensions.withinBudget);
      assert(budget.framework.bytes <= 2200000); assert(budget.xtensions.runtimeBytes <= 280000);
    });
    await verify('runtime gates and all GitHub workflows require fresh keyed node and browser reports', () => {
      const gate = fs.readFileSync(path.join(root, 'tests/xtensions/xtensions_runtime_gate_suite.js'), 'utf8'); assert(gate.includes('keyed-profile/runtime-test.cjs'));
      const catalog = fs.readFileSync(path.join(root, 'scripts/test-runner/catalog.json'), 'utf8');
      for (const mode of ['node', 'browser']) {
        const name = 'xtend-rmtx-keyed-runtime-' + mode + '-report.json'; assert(catalog.includes(name));
        for (const file of ['xtend-default-gates.yml', 'xtend-migration-completion.yml', 'xtend-nightly-build.yml'])
          assert(fs.readFileSync(path.join(root, '.github/workflows', file), 'utf8').includes(name));
      }
    });
    const evidence = { format: 1, version: '1.0.0', date: '2026-11-17', stage: 'A06.3.2-keyed-profile', passed: true,
      sourceProfile: compiled.sourceProfile, compilerSchema: compiled.schema, hostScopesSchema: compiled.parserResult.hostScopes.schema,
      checks: names.length, names, compileChecks, typedKeyScopes: true, nativeRepeatSupported: false,
      nativeRuntimeExecutionInStaticCheck: false, completeA063Implemented: false, acceptedForRelease: false,
      sources: Object.fromEntries(sourceFiles.slice().sort().map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
    const bytes = JSON.stringify(evidence, null, 2) + '\n', output = path.join(__dirname, 'evidence.json');
    if (write) fs.writeFileSync(output, bytes);
    if (check) assert.equal(fs.readFileSync(output, 'utf8'), bytes, 'RMTX keyed source/evidence drift');
    return evidence;
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) inspect({ write: process.argv.includes('--write'), check: process.argv.includes('--check') })
  .then(result => console.log(JSON.stringify({ passed: result.passed, stage: result.stage, checks: result.checks, sources: Object.keys(result.sources).length })))
  .catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
