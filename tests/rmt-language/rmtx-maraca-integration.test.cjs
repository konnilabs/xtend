'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const maraca = require('../../xtend-maraca');
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
const root = path.resolve(__dirname, '../..');
const source = `import { RMT, input } from '@ccslabs/xtend/rmt-language/rmtx';
export default (
  <RMT.Program id="integration">
    <RMT.State id="product" type="object" preserve initial={{ title: 'old' }} />
    <RMT.Action id="product.rename">
      <RMT.Input name="title" type="string" />
      <RMT.Reduce state="product" path="title" value={input.title} />
    </RMT.Action>
    <RMT.Portal id="root" root="#app" layer="surface" />
    <RMT.Surface id="panel" kind="region" component="section" portal="root">
      <RMT.Lane name="visible"><RMT.Mount target="panel" /></RMT.Lane>
    </RMT.Surface>
  </RMT.Program>
);`;
const bindings = {
  schema: 'xtend.xtensions.state-binding-artifact.v1', documentId: 'integration',
  bindings: [{ surface: 'panel', binding: {
    schema: 'xtend.xtensions.state-binding.v1',
    address: { documentId: 'integration', declarationId: 'panel', keys: [] },
    props: { title: { state: 'product', path: ['title'], type: 'string' } },
    intents: { rename: { command: 'product.rename', payloadSchema: 'xtend.schemas.xtension.intent.v1', fields: { title: { type: 'string' } } } }
  } }]
};
const input = (sourceText = source, xtensionBindings = bindings) => ({
  sourceText, virtualSourcePath: 'integration.rmtx', xtensionBindings,
  orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off'
});
const options = { rootDir: root, inspectToolchain: false, compileSource: compileRmtxSource };

test('RMTX builds a real Maraca plan through the explicit compiler port and existing XTension sidecar', () => {
  const result = compileRmtxSource({ text: source, filePath: 'integration.rmtx' }, { xtensionBindings: bindings });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const plan = maraca.createMaracaBuildPlan(input(), options);
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  assert.equal(plan.source, 'integration.rmtx');
  assert.deepEqual(plan.xtensionBindings, result.xtensionBindings);
  assert(plan.orchestration.artifact.surfaces.some(surface => surface.id === 'panel'));
  assert.equal(plan.orchestration.artifact.state.states.find(state => state.id === 'product').initial.title, 'old');
});

test('Maraca preserves the injected frontend result schema when it revalidates a binding sidecar', () => {
  const compiled = compileRmtxSource({ text: source, filePath: 'integration.rmtx' }, { xtensionBindings: bindings });
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  const plan = maraca.createMaracaBuildPlan(input(), options);
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  assert.equal(plan.rmt.compilerSchema, compiled.schema);
  assert.notEqual(plan.rmt.compilerSchema, require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILE_RESULT_SCHEMA);
});

test('bad RMTX syntax and invalid XTension bindings block the plan before runtime work', () => {
  const syntax = maraca.createMaracaBuildPlan(input(source.replace('RMT.State', 'RMT.Unknown')), options);
  assert.equal(syntax.ok, false);
  assert.equal(syntax.status, 'compile_failed');
  assert(syntax.diagnostics.some(diagnostic => diagnostic.severity === 'error'));
  const invalid = structuredClone(bindings);
  invalid.bindings[0].binding.intents.rename.command = 'missing';
  const binding = maraca.createMaracaBuildPlan(input(source, invalid), options);
  assert.equal(binding.ok, false);
  assert.equal(binding.status, 'compile_failed');
  assert(binding.diagnostics.some(diagnostic => diagnostic.code === 'rmt.xtensions.binding.invalid'));
});

test('Classic defaults remain Classic and an extension does not silently select a different compiler', () => {
  const classic = compileRmtClassicSource({ text: 'state count type number initial 0', filePath: 'ordinary.rmt' });
  assert.equal(classic.ok, true);
  assert.equal(classic.schema, require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILE_RESULT_SCHEMA);
  const unselected = maraca.createMaracaBuildPlan(input(), { rootDir: root, inspectToolchain: false });
  assert.equal(unselected.ok, false);
  assert.equal(unselected.status, 'compile_failed');
});

let packaging;
function packedPackages() {
  if (packaging) return packaging;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-pack-'));
  const nodeModules = path.join(temporary, 'node_modules', '@ccslabs');
  fs.mkdirSync(nodeModules, { recursive: true });
  const packages = [];
  for (const [name, location] of [['xtend', root], ['xtend-compiler', path.join(root, 'tools')], ['xtend-maraca', path.join(root, 'xtend-maraca')]]) {
    const output = execFileSync('npm', ['pack', location, '--ignore-scripts', '--json', '--pack-destination', temporary], {
      cwd: temporary, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH, npm_config_cache: path.join(temporary, 'npm-cache'), npm_config_offline: 'true' }, timeout: 180000, stdio: ['ignore', 'pipe', 'pipe']
    });
    const [report] = JSON.parse(output);
    const directory = path.join(nodeModules, name);
    fs.mkdirSync(directory);
    execFileSync('tar', ['-xzf', path.join(temporary, report.filename), '--strip-components=1', '-C', directory]);
    packages.push({ directory, report, manifest: JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')) });
  }
  packaging = { temporary, packages };
  return packaging;
}
test.after(() => { if (packaging) fs.rmSync(packaging.temporary, { recursive: true, force: true }); });

test('actual root and compiler tarballs expose typed RMTX entrypoints and declare their parser dependency', () => {
  for (const { directory, report, manifest } of packedPackages().packages.filter(entry => entry.manifest.exports['./rmt-language/rmtx-compiler'])) {
    assert.equal(manifest.dependencies.typescript, '5.9.3');
    assert.equal(manifest.devDependencies?.typescript, undefined);
    for (const name of ['rmtx-parser', 'rmtx-compiler', 'rmtx']) {
      const entry = manifest.exports['./rmt-language/' + name];
      assert(entry && typeof entry.types === 'string' && typeof entry.default === 'string');
      for (const target of [entry.types, entry.default]) {
        assert(report.files.some(file => file.path === target.replace(/^\.\//, '')));
        assert(fs.existsSync(path.join(directory, target)));
      }
    }
    const compiler = require(path.join(directory, manifest.exports['./rmt-language/rmtx-compiler'].default));
    const compiled = compiler.compileRmtxSource({ text: source, filePath: 'packed.rmtx' });
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    for (const framework of ['react', 'react-dom', 'vue']) assert.equal(manifest.dependencies[framework], undefined);
  }
});

test('packed frontend declarations accept the existing Maraca compiler port in both public packages', () => {
  const { temporary } = packedPackages();
  const fixture = path.join(temporary, 'consumer.cts');
  fs.writeFileSync(fixture, `import { compileRmtxSource as rootCompile } from '@ccslabs/xtend/rmt-language/rmtx-compiler';
import { parseRmtxSource } from '@ccslabs/xtend-compiler/rmt-language/rmtx-parser';
import { compileRmtxSource } from '@ccslabs/xtend-compiler/rmt-language/rmtx-compiler';
import { RMT } from '@ccslabs/xtend-compiler/rmt-language/rmtx';
import { createMaracaBuildPlan, type MaracaRunOptions } from '@ccslabs/xtend/maraca';
const left: MaracaRunOptions = { compileSource: rootCompile };
const right: MaracaRunOptions = { compileSource: compileRmtxSource };
const parsed = parseRmtxSource({ text: '', filePath: 'app.rmtx' });
const compiled = compileRmtxSource({ text: '', filePath: 'app.rmtx' });
const ok: boolean = parsed.ok && compiled.ok;
createMaracaBuildPlan({ sourceText: '', virtualSourcePath: 'app.rmtx' }, left);
void [right, RMT, ok];
`);
  const ts = require('typescript');
  const program = ts.createProgram([fixture], { noEmit: true, strict: true, skipLibCheck: true, types: [],
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022 });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => temporary, getCanonicalFileName: file => file, getNewLine: () => '\n'
  }));
});
