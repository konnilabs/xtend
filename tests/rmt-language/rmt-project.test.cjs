'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRmtProjectSnapshot, compileRmtProjectSource, createRmtProject } = require('../../tools/rmt-language/rmt-project');
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const prefix = `import { RMT, model, input } from '@ccslabs/xtend/rmt-language/rmtx';\nexport default `;
const program = (body, id = 'app') => prefix + `<RMT.Program id="${id}">${body}</RMT.Program>;`;
function fixture(t, files) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-project-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(rootDir, name)), { recursive: true }); fs.writeFileSync(path.join(rootDir, name), text);
  }
  const input = file => ({ filePath: path.join(rootDir, file), text: fs.readFileSync(path.join(rootDir, file), 'utf8') });
  return { rootDir, input, options: { rootDir, semanticCheck: false, rmtxSyntaxVersion: '8.0.0' } };
}
function providers(f, file = 'rmtx.providers.json') {
  const digest = value => createHash('sha256').update(value).digest('hex');
  const module = 'throw new Error("Provider code must never execute during project compilation");\nexport function createComponent() {}\n';
  const definition = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../development/rmtx-a06/providers/react.interface.json'), 'utf8'));
  Object.assign(definition, { providerId: 'test-provider', entry: { module: './provider.mjs', exportName: 'createComponent', sha256: digest(module) } });
  const text = JSON.stringify(definition);
  fs.writeFileSync(path.join(f.rootDir, 'provider.mjs'), module);
  fs.writeFileSync(path.join(f.rootDir, 'provider.interface.json'), text);
  const pins = { schema: 'xtend.maraca.rmtx-providers.v1', interfaces: [{ file: './provider.interface.json', sha256: digest(text) }] };
  fs.writeFileSync(path.join(f.rootDir, file), JSON.stringify(pins));
  return { pins, definition, digest };
}
test('default provider registries capture interface and module pins without execution', t => {
  const f = fixture(t, { 'app.rmtx': program('') }); const p = providers(f);
  const snapshot = createRmtProjectSnapshot(f.input('app.rmtx'), f.options);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot.diagnostics));
  assert.deepEqual(snapshot.rmtxProviders, p.pins);
  assert.equal(snapshot.rmtxProvidersFile, path.join(f.rootDir, 'rmtx.providers.json'));
  assert.equal(snapshot.componentInterfaceCatalog.records.length, 1);
  assert.deepEqual(snapshot.dependencies.filter(row => row.kind).map(row => row.kind).sort(), ['provider-interface', 'provider-module', 'provider-registry']);
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.project.identity, snapshot.identity);
  fs.appendFileSync(path.join(f.rootDir, 'provider.mjs'), '// changed');
  const changed = createRmtProjectSnapshot(f.input('app.rmtx'), f.options);
  assert.equal(changed.ok, false); assert.notEqual(changed.identity, snapshot.identity);
  assert(changed.diagnostics.some(row => row.code === 'rmt.project.providers.invalid'));
});
test('explicit provider registry selection and inline pins use the same captured metadata', t => {
  const f = fixture(t, { 'app.rmtx': program('') }); const p = providers(f, 'selected.json');
  const selected = createRmtProjectSnapshot(f.input('app.rmtx'), { ...f.options, rmtxProvidersFile: 'selected.json' });
  const inline = createRmtProjectSnapshot(f.input('app.rmtx'), { ...f.options, rmtxProviders: p.pins });
  assert.equal(selected.ok, true, JSON.stringify(selected.diagnostics)); assert.equal(inline.ok, true, JSON.stringify(inline.diagnostics));
  assert.deepEqual(selected.componentInterfaceCatalog, inline.componentInterfaceCatalog);
  assert.equal(inline.rmtxProvidersFile, null); assert.notEqual(selected.identity, inline.identity);
  assert.deepEqual(inline.rmtxProviders, p.pins);
});
test('bad provider registry paths and pins are structured project failures', t => {
  const f = fixture(t, { 'app.rmtx': program('') }); providers(f);
  for (const rmtxProvidersFile of ['', null, [], '../outside.json', 'absent.json']) {
    const result = compileRmtProjectSource(f.input('app.rmtx'), { ...f.options, rmtxProvidersFile });
    assert.equal(result.ok, false); assert.equal(result.coreDocument, null);
    assert.deepEqual(result.sourceProfile, { syntax: 'rmtx', version: '8.0.0' });
    assert(result.diagnostics.some(row => row.code === 'rmt.project.providers.invalid'));
  }
  fs.writeFileSync(path.join(f.rootDir, 'rmtx.providers.json'), JSON.stringify({ schema: 'xtend.maraca.rmtx-providers.v1', interfaces: [{ file: './provider.interface.json', sha256: '0'.repeat(64) }] }));
  assert.equal(compileRmtProjectSource(f.input('app.rmtx'), f.options).ok, false);
});
test('invalid provider metadata does not hide editor import discovery', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./state.rmtx"/>'), 'state.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'shared'), 'rmtx.providers.json': '{}' });
  const result = createRmtProjectSnapshot(f.input('app.rmtx'), { ...f.options, recoverImports: true });
  assert.equal(result.ok, false); assert.equal(result.modules.length, 2);
});
test('a standalone project retains the raw Source8 compiler result', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.State id="value" type="number" initial={1}/>') });
  const { project, ...result } = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.deepEqual(JSON.parse(JSON.stringify(result)), JSON.parse(JSON.stringify(compileRmtxSource(f.input('app.rmtx'), { syntaxVersion: '8.0.0' }))));
  assert.equal(project.dependencies.length, 1);
});
test('untitled documents keep distinct project identities and close their original overlays', t => {
  const f = fixture(t, {}), project = createRmtProject(f.options);
  t.after(() => project.dispose());
  const one = { uri: 'untitled:first.rmtx', text: program('<RMT.State id="one" type="number" initial={1}/>', 'one') };
  const two = { uri: 'untitled:second.rmtx', text: program('<RMT.State id="two" type="number" initial={2}/>', 'two') };
  project.updateDocument(one); project.updateDocument(two);
  const first = project.compileSource({ uri: one.uri }), second = project.compileSource({ uri: two.uri });
  assert.equal(first.ok, true, JSON.stringify(first.diagnostics)); assert.equal(second.ok, true, JSON.stringify(second.diagnostics));
  assert.notEqual(first.project.entryFile, second.project.entryFile); assert.notEqual(first.project.identity, second.project.identity);
  project.removeDocument(one.uri);
  assert.equal(project.compileSource({ uri: one.uri }).ok, false);
  assert.equal(project.compileSource({ uri: two.uri }).orchestrationArtifacts.state.states[0].id, 'two');
});
test('project fusion never lends missing authoring bindings to imported module bodies', t => {
  const missingModel = `import {RMT} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="view"><RMT.Import path="./empty.rmtx"/><RMT.Action id="read"><RMT.Reduce state="value" value={model.value}/></RMT.Action></RMT.Program>;`;
  const f = fixture(t, { 'app.rmtx': missingModel, 'empty.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'state') });
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, false); assert.equal(result.coreDocument, null);
  const error = result.diagnostics.find(row => row.code === 'rmt.project.binding.unbound');
  assert(error); assert.equal(error.file, path.join(f.rootDir, 'app.rmtx'));
  assert.equal(missingModel.slice(error.range.startOffset, error.range.endOffset), 'model');
  const missingNamespace = `import {RMT as O} from '@ccslabs/xtend/rmt-language/rmtx';export default <O.Program id="view"><O.Import path="./empty.rmtx"/><RMT.State id="other" type="number" initial={1}/></O.Program>;`;
  assert.equal(compileRmtProjectSource({ ...f.input('app.rmtx'), text: missingNamespace }, f.options).ok, false);
});
test('RMTX imports are linked into one executable Model and Action plan', t => {
  const f = fixture(t, {
    'state.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'shared'),
    'app.rmtx': program('<RMT.Import path="./state.rmtx"/><RMT.Action id="change"><RMT.Input name="next" type="number"/><RMT.Reduce state="value" value={input.next}/></RMT.Action>')
  });
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.orchestrationArtifacts.state.states[0].id, 'value');
  assert.equal(result.orchestrationArtifacts.actions.actions[0].id, 'change');
  assert.equal(result.project.order[0], path.join(f.rootDir, 'state.rmtx'));
});
test('aliased authoring imports keep their field names and original identity', t => {
  const f = fixture(t, {
    'state.rmtx': `import {RMT as O} from '@ccslabs/xtend/rmt-language/rmtx';export default <O.Program id="shared"><O.State id="value" type="object" initial={{model:'unchanged',O:1}}/></O.Program>;`,
    'app.rmtx': program('<RMT.Import path="./state.rmtx"/>')
  });
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.deepEqual(result.orchestrationArtifacts.state.states[0].initial, { model: 'unchanged', O: 1 });
});
test('classic declarations imported by RMTX participate in the same program', t => {
  const f = fixture(t, {
    'state.rmt': 'template shared {\n state value type number initial 4\n}',
    'app.rmtx': program('<RMT.Import path="./state.rmt"/><RMT.Action id="change"><RMT.Input name="next" type="number"/><RMT.Reduce state="value" value={input.next}/></RMT.Action>')
  });
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.orchestrationArtifacts.state.states[0].initial, 4);
});
test('a Classic entry imports a real RMTX view under an explicit effective profile', t => {
  const f = fixture(t, {
    'app.rmt': 'import "./view.rmtx"\ntemplate app {\n state value type string initial "linked"\n}',
    'view.rmtx': program('<RMT.Surface id="root"><RMT.View><RMT.Element tag="p"><RMT.Text value={model.value}/></RMT.Element></RMT.View></RMT.Surface>', 'view')
  });
  const result = compileRmtProjectSource(f.input('app.rmt'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.project.sourceSyntax, 'rmt-vnext');
  assert.deepEqual(result.project.effectiveSourceProfile, { syntax: 'rmtx', version: '8.0.0' });
  assert.deepEqual(result.orchestrationArtifacts.render.nativeView.surfaces, ['root']);
});
test('dependency-only bytes, deletion, rename and glob membership affect identity', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./parts/*.rmtx"/>'), 'parts/a.rmtx': program('<RMT.State id="a" type="number" initial={1}/>', 'a') });
  const before = createRmtProjectSnapshot(f.input('app.rmtx'), f.options);
  fs.writeFileSync(path.join(f.rootDir, 'parts/a.rmtx'), program('<RMT.State id="a" type="number" initial={2}/>', 'a'));
  const edit = createRmtProjectSnapshot(f.input('app.rmtx'), f.options); assert.notEqual(before.identity, edit.identity);
  fs.renameSync(path.join(f.rootDir, 'parts/a.rmtx'), path.join(f.rootDir, 'parts/b.rmtx'));
  const rename = createRmtProjectSnapshot(f.input('app.rmtx'), f.options); assert.notEqual(edit.identity, rename.identity);
  fs.unlinkSync(path.join(f.rootDir, 'parts/b.rmtx'));
  const removed = createRmtProjectSnapshot(f.input('app.rmtx'), f.options); assert.equal(removed.ok, false); assert.notEqual(rename.identity, removed.identity);
});
test('open overlays are linked and closing restores actual disk data', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./state.rmtx"/>'), 'state.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'shared') });
  const project = createRmtProject(f.options);
  project.updateDocument({ filePath: path.join(f.rootDir, 'state.rmtx'), text: program('<RMT.State id="value" type="number" initial={9}/>', 'shared') });
  assert.equal(project.compileSource(f.input('app.rmtx')).orchestrationArtifacts.state.states[0].initial, 9);
  project.removeDocument(path.join(f.rootDir, 'state.rmtx'));
  assert.equal(project.compileSource(f.input('app.rmtx')).orchestrationArtifacts.state.states[0].initial, 1);
});
test('errors from a dependency map back through aliases, CRLF and astral UTF16', t => {
  const imported = `import {RMT as VeryLongNamespace} from '@ccslabs/xtend/rmt-language/rmtx';\r\n// 😀\r\nexport default <VeryLongNamespace.Program id="dep"><VeryLongNamespace.State id="a" type="number" initial={globalThis.bad()}/></VeryLongNamespace.Program>;`;
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./bad.rmtx"/>'), 'bad.rmtx': imported });
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options); assert.equal(result.ok, false);
  const error = result.diagnostics.find(item => item.code === 'rmtx.expression.unsupported');
  assert.equal(error.file, path.join(f.rootDir, 'bad.rmtx'));
  assert.equal(imported.slice(error.range.startOffset, error.range.endOffset), 'globalThis.bad()');
  assert.equal(error.range.start.line, 2);
});
for (const [name, entry, additional] of [
  ['provider TSX entry', 'provider.tsx', {}],
  ['provider import', 'app.rmtx', { 'app.rmtx': program('<RMT.Import path="./provider.tsx"/>'), 'provider.tsx': 'export default () => null;' }],
  ['cycle', 'app.rmtx', { 'app.rmtx': program('<RMT.Import path="./dep.rmtx"/>'), 'dep.rmtx': program('<RMT.Import path="./app.rmtx"/>') }],
  ['executable statements', 'app.rmtx', { 'app.rmtx': `globalThis.__rmtProjectExecuted = true;${program('')}` }],
  ['foreign source import', 'app.rmtx', { 'app.rmtx': `import {run} from './provider.js';${program('')}` }],
  ['lexical boundary', 'app.rmtx', { 'app.rmtx': program('<RMT.Import path="../foreign.rmt"/>') }],
  ['forged public parser context', 'app.rmtx', { 'app.rmtx': program('<RMT.Action id="bad"><RMT.Reduce state="missing" value={1}/></RMT.Action>') }]
]) test(`project fails closed for ${name}`, t => {
  const f = fixture(t, { 'app.rmtx': program(''), 'provider.tsx': 'export default () => null;', ...additional });
  const result = compileRmtProjectSource(f.input(entry), { ...f.options, projectContext: { declarations: [{ type: 'RmtStateDeclaration', name: 'missing' }] } });
  assert.equal(result.ok, false); assert.equal(result.coreDocument, null); assert.equal(globalThis.__rmtProjectExecuted, undefined);
});
test('physical symlink imports cannot cross the project root', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./escape.rmtx"/>') });
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-foreign-')); t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'state.rmtx'), program('')); fs.symlinkSync(path.join(outside, 'state.rmtx'), path.join(f.rootDir, 'escape.rmtx'));
  const result = createRmtProjectSnapshot(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, false); assert(result.diagnostics.some(item => item.code === 'rmt.project.import.boundary'));
});

test('recursive globs include nested disk and unsaved modules with stable ordering', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./parts/**/*.rmtx"/>'),
    'parts/nested/a.rmtx': program('<RMT.State id="a" type="number" initial={1}/>', 'a') });
  const snapshot = createRmtProjectSnapshot(f.input('app.rmtx'), { ...f.options,
    documents: [{ filePath: path.join(f.rootDir, 'parts/new/b.rmtx'), text: program('<RMT.State id="b" type="number" initial={2}/>', 'b') }] });
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot.diagnostics));
  assert.equal(snapshot.modules.length, 3);
  assert.equal(compileRmtProjectSource(f.input('app.rmtx'), { ...f.options, documents: snapshot.modules }).orchestrationArtifacts.state.states.length, 2);
});
test('a dangling glob symlink is a structured diagnostic, not an uncaught exception', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./parts/*.rmtx"/>') });
  fs.mkdirSync(path.join(f.rootDir, 'parts'));
  fs.symlinkSync(path.join(f.rootDir, 'absent.rmtx'), path.join(f.rootDir, 'parts/broken.rmtx'));
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, false);
  assert(result.diagnostics.some(row => row.code === 'rmt.project.import.missing'));
});
test('per-call document overlays override stale defaults and in-memory buffers', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./state.rmtx"/>'), 'state.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'state') });
  const project = createRmtProject(f.options);
  project.updateDocument({ filePath: path.join(f.rootDir, 'state.rmtx'), text: program('<RMT.State id="value" type="number" initial={2}/>', 'state') });
  const result = project.compileSource(f.input('app.rmtx'), { documents: [{ filePath: 'state.rmtx', text: program('<RMT.State id="value" type="number" initial={7}/>', 'state') }] });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.orchestrationArtifacts.state.states[0].initial, 7);
});
test('Classic-only dependency errors and source witnesses retain the actual imported file', t => {
  const text = 'template shared {\n action broken {\n reduce state.absent = 1\n }\n}';
  const f = fixture(t, { 'app.rmt': 'import "./bad.rmt"\ntemplate app {}', 'bad.rmt': text });
  const result = compileRmtProjectSource(f.input('app.rmt'), f.options);
  assert.equal(result.ok, false);
  const error = result.diagnostics.find(row => row.severity === 'error');
  assert.equal(error.file, path.join(f.rootDir, 'bad.rmt'));
  assert(error.range.endOffset <= text.length);
});
test('mapped errors span the complete expression after an authoring alias replacement', t => {
  const text = `import {RMT as O, model as data} from '@ccslabs/xtend/rmt-language/rmtx';\r\nexport default <O.Program id="dep"><O.State id="value" type="number" initial={1}/><O.Action id="bad"><O.Reduce state="value" value={data.value.bad()}/></O.Action></O.Program>;`;
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./bad.rmtx"/>'), 'bad.rmtx': text });
  const result = compileRmtProjectSource(f.input('app.rmtx'), f.options);
  assert.equal(result.ok, false);
  const error = result.diagnostics.find(row => row.file === path.join(f.rootDir, 'bad.rmtx'));
  assert.equal(text.slice(error.range.startOffset, error.range.endOffset), 'data.value.bad()');
});
test('semantic type errors clear every successful backend artifact and demand', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.State id="data" type="object" initial={{title:1}}/><RMT.Surface id="root"><RMT.View><RMT.Component tag="x-header" properties={{title:model.data.title}}/></RMT.View></RMT.Surface>') });
  const result = compileRmtProjectSource(f.input('app.rmtx'), { ...f.options, semanticCheck: true });
  assert.equal(result.ok, false);
  assert.equal(result.phase, 'semantic');
  for (const key of ['coreDocument', 'coreJson', 'orchestrationArtifacts', 'primitiveArtifacts', 'appServiceDemands',
    'selectorDependencies', 'componentDependencies', 'nativeDependencies', 'lifecycleDependencies', 'xtensionBindings', 'xtensionComposition']) assert.equal(result[key], null, key);
});
test('the public snapshot is a serializable DTO, never a TypeScript parent graph', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./state.rmt"/>'), 'state.rmt': 'template shared {\n state value type number initial 1\n}' });
  const value = JSON.parse(JSON.stringify(createRmtProjectSnapshot(f.input('app.rmtx'), f.options)));
  assert.equal(value.modules.length, 2);
  assert(value.modules.every(row => !('_classic' in row) && !('_rmtx' in row) && !('sourceModel' in row)));
});

test('Classic-only imports build one real state/action plan and retain both source files', t => {
  const f = fixture(t, {
    'app.rmt': 'import "./state.rmt"\ntemplate app {\n action change {\n input next number\n reduce state.value = input.next\n }\n}',
    'state.rmt': 'template shared {\n state value type number initial 4\n}'
  });
  const result = compileRmtProjectSource(f.input('app.rmt'), f.options);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.orchestrationArtifacts.state.states[0].initial, 4);
  assert.equal(result.orchestrationArtifacts.actions.actions[0].id, 'change');
  const state = result.project.sourceMap.find(row => row.nodeType === 'RmtStateDeclaration');
  assert.equal(state.file, path.join(f.rootDir, 'state.rmt'));
  const action = result.project.sourceMap.find(row => row.nodeType === 'RmtActionDeclaration');
  assert.equal(action.file, path.join(f.rootDir, 'app.rmt'));
  assert.equal(f.input('app.rmt').text.slice(action.range.startOffset, action.range.endOffset).startsWith('action change'), true);
});

test('editor recovery retains trusted imports without accepting incomplete JSX as a build', t => {
  const f = fixture(t, { 'state.rmt': 'template shared {\n state data type object { initial { title "known" } }\n}',
    'app.rmtx': program('<RMT.Import path="./state.rmt"/><RMT.Surface id="root"><RMT.View><RMT.Text value={model.data.}/></RMT.View></RMT.Surface>') });
  const project = createRmtProject(f.options);
  const graph = project.analyze(f.input('app.rmtx'), { recoverImports: true });
  assert.equal(graph.ok, false);
  assert.equal(graph.modules.length, 2);
  assert.equal(project.compileSource(f.input('app.rmtx'), { recoverImports: true }).ok, false);
  const truncated = { filePath: path.join(f.rootDir, 'app.rmtx'), text: prefix + '<RMT.Program id="app"><RMT.Import path="./state.rmt"/><RMT.Surface' };
  const recovered = project.analyze(truncated, { recoverImports: true });
  assert.equal(recovered.ok, false);
  assert.equal(recovered.modules.length, 2);
});
