'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { createRmtCompilationSession } = require('../../tools/rmt-language/compilation-session');
const { createRmtProjectWatcher } = require('../../tools/rmt-language/project-watch');
const { compileRmtProjectSource } = require('../../tools/rmt-language/rmt-project');
const bridge = require('../../tools/tooling-bridge');
const program = (body, id = 'app') => `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="${id}">${body}</RMT.Program>;`;
function fixture(t, files) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a065-integrations-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  for (const [name, source] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(rootDir, name)), { recursive: true }); fs.writeFileSync(path.join(rootDir, name), source); }
  return { rootDir, file: name => path.join(rootDir, name), input: name => ({ filePath: path.join(rootDir, name), text: fs.readFileSync(path.join(rootDir, name), 'utf8') }) };
}
test('legacy compilation session retains exact counters and readonly facts', t => {
  const f = fixture(t, { 'app.rmt': 'template app { state value type number initial 1 }' });
  const session = createRmtCompilationSession({ root: f.rootDir, readonlyResults: true }); t.after(() => session.dispose());
  const first = session.compileSource(f.input('app.rmt'));
  assert.equal(first.ok, true); assert.strictEqual(session.compileSource(f.input('app.rmt')), first);
  assert.deepEqual(session.snapshot(), { compilations: 1, hits: 1, documents: 1 });
  assert.throws(() => { first.coreDocument.manifest.documentId = 'foreign'; }, TypeError);
});
test('project cache rechecks transitive contents and language/version identity', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./state.rmtx"/>'), 'state.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'state') });
  const session = createRmtCompilationSession({ root: f.rootDir, readonlyResults: true }); t.after(() => session.dispose());
  const first = session.compileProjectSource(f.input('app.rmtx'));
  assert.equal(first.ok, true, JSON.stringify(first.diagnostics));
  assert.strictEqual(session.compileProjectSource(f.input('app.rmtx')), first);
  fs.writeFileSync(f.file('state.rmtx'), program('<RMT.State id="value" type="number" initial={2}/>', 'state'));
  const changed = session.compileProjectSource(f.input('app.rmtx'));
  assert.notStrictEqual(changed, first); assert.equal(changed.orchestrationArtifacts.state.states[0].initial, 2);
  assert.notEqual(changed.project.identity, first.project.identity);
  assert.equal(session.compileProjectSource(f.input('app.rmtx'), { rmtxSyntaxVersion: '7.0.0' }).sourceProfile.version, '7.0.0');
});
test('content watcher observes unchanged graphs, edits, missing files and renames', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./state.rmtx"/>'), 'state.rmtx': program('<RMT.State id="value" type="number" initial={1}/>', 'state') });
  const events = [], watcher = createRmtProjectWatcher({ rootDir: f.rootDir, entryFile: 'app.rmtx', onResult: result => events.push(result) }); t.after(() => watcher.dispose());
  assert.equal(watcher.poll().changed, true); assert.equal(watcher.poll().changed, false);
  assert.equal(watcher.snapshot().compilations, 1); assert.equal(watcher.snapshot().hits, 1);
  fs.writeFileSync(f.file('state.rmtx'), program('<RMT.State id="value" type="number" initial={3}/>', 'state'));
  assert.equal(watcher.poll().result.orchestrationArtifacts.state.states[0].initial, 3);
  assert.equal(watcher.snapshot().documents, 1, 'old AST generations must be released by the long-lived watcher');
  fs.renameSync(f.file('state.rmtx'), f.file('renamed.rmtx'));
  assert.equal(watcher.poll().result.ok, false); assert.equal(watcher.poll().changed, false);
  fs.writeFileSync(f.file('app.rmtx'), program('<RMT.Import path="./renamed.rmtx"/>'));
  assert.equal(watcher.poll().result.ok, true); assert.equal(events.length, 4);
  assert.equal(watcher.snapshot().documents, 1);
});
test('bridge v1 remains legacy and v2 runs typed project compilation', async t => {
  const f = fixture(t, {});
  const legacy = await bridge.executeToolingBridgeOperation({ schema: bridge.TOOLING_BRIDGE_SCHEMA, operation: 'compile', payload: { source: 'template app { state value type number initial 1 }' } }, { rootDir: f.rootDir });
  assert.equal(legacy.schema, 'xtend.compiler.tooling-bridge-response.v1'); assert.equal(legacy.ok, true);
  const modern = await bridge.executeToolingBridgeOperation({ schema: bridge.TOOLING_BRIDGE_SCHEMA_V2, operation: 'compile', payload: { sourceSyntax: 'rmtx', source: program('<RMT.State id="value" type="number" initial={1}/>') } }, { rootDir: f.rootDir });
  assert.equal(modern.schema, 'xtend.compiler.tooling-bridge-response.v2'); assert.equal(modern.ok, true, JSON.stringify(modern.diagnostics)); assert.equal(modern.result.sourceProfile.version, '8.0.0');
  await assert.rejects(bridge.executeToolingBridgeOperation({ schema: bridge.TOOLING_BRIDGE_SCHEMA, operation: 'compile', payload: { sourceSyntax: 'rmtx', source: program('') } }), /requires tooling-bridge.v2/u);
  assert.equal(bridge.normalizeDiagnostics([{ code: 'classic', message: 'source', file: 'state.rmt' }], true)[0].filePath, 'state.rmt');
});
test('bridge diagnostics and compile share original semantic errors without a disable bypass', async t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.State id="person" type="object" initial={{name:"Ada"}}/><RMT.Surface id="root"><RMT.View><RMT.Text value={model.person.missing}/></RMT.View></RMT.Surface>') });
  const payload = { source: f.input('app.rmtx').text, filePath: f.file('app.rmtx'), sourceSyntax: 'rmtx', options: { semanticCheck: false } };
  const compile = await bridge.executeToolingBridgeOperation({ schema: bridge.TOOLING_BRIDGE_SCHEMA_V2, operation: 'compile', payload }, { rootDir: f.rootDir });
  const diagnostics = await bridge.executeToolingBridgeOperation({ schema: bridge.TOOLING_BRIDGE_SCHEMA_V2, operation: 'language-diagnostics', payload }, { rootDir: f.rootDir });
  assert.equal(compile.ok, false); assert.equal(compile.result.coreDocument, null);
  assert.deepEqual(compile.diagnostics, diagnostics.diagnostics);
  const error = compile.diagnostics.find(item => String(item.code).startsWith('rmtx.typescript.'));
  assert.ok(error); assert.equal(error.uri, pathToFileURL(f.file('app.rmtx')).href); assert.ok(error.range); assert.ok(!JSON.stringify(error).includes('.__xtend.tsx'));
});
test('MCP selects explicit RMTX, rejects provider TSX and preserves dependency locations', async t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./bad.rmtx"/>'), 'bad.rmtx': program('<RMT.State id="value" type="number" initial={globalThis.bad()}/>', 'bad'), 'provider.tsx': 'export default () => null;' });
  const api = await import(pathToFileURL(path.resolve(__dirname, '../../products/xtend-mcp/src/tooling.mjs')).href);
  const check = await api.runRmtCompileCheck({ path: 'app.rmtx' }, { workspaceRoots: [f.rootDir] });
  assert.equal(check.schema, 'xtend.mcp.rmt-compile-check.v2'); assert.equal(check.ok, false);
  assert.ok(check.diagnostics.some(item => item.uri?.endsWith('/bad.rmtx'))); assert.ok(!JSON.stringify(check).includes('.__xtend.tsx'));
  assert.throws(() => api.resolveSourceInput({ path: 'provider.tsx' }, { workspaceRoots: [f.rootDir] }), /provider TSX/u);
  assert.throws(() => api.createRmtRepairPlan({ path: 'app.rmtx' }, { workspaceRoots: [f.rootDir] }), /Classic safe-repair/u);
});
test('inline MCP project tooling requires an explicit workspace instead of reading the process CWD', async t => {
  const f = fixture(t, { 'private.rmt': 'template secret { state title type string initial "private from cwd" }' });
  const api = await import(pathToFileURL(path.resolve(__dirname, '../../products/xtend-mcp/src/tooling.mjs')).href);
  const previousCwd = process.cwd();
  try {
    process.chdir(f.rootDir);
    const source = program('<RMT.Import path="./private.rmt"/><RMT.Surface id="root"><RMT.View><RMT.Text value={model.title}/></RMT.View></RMT.Surface>');
    await assert.rejects(api.runRmtCompileCheck({ source, sourceSyntax: 'rmtx' }, { workspaceRoots: [] }), /A workspace root is required for project\/RMTX tooling/u);
    assert.throws(() => api.resolveSourceInput({ source: 'template app {}', project: true }, { workspaceRoots: [] }), /A workspace root is required/u);
    const allowed = await api.runRmtCompileCheck({ source, sourceSyntax: 'rmtx' }, { workspaceRoots: [f.rootDir] });
    assert.equal(allowed.ok, true, JSON.stringify(allowed.diagnostics));
    assert.equal(allowed.schema, 'xtend.mcp.rmt-compile-check.v2');
    assert.equal(allowed.project.dependencies.length, 2);
    assert.ok(allowed.project.dependencies.some(row => row.filePath.endsWith('/private.rmt')));
    const legacy = await api.runRmtCompileCheck({ source: 'template legacy { state value type number initial 1 }' }, { workspaceRoots: [] });
    assert.equal(legacy.ok, true, JSON.stringify(legacy.diagnostics)); assert.equal(legacy.schema, 'xtend.mcp.rmt-compile-check.v1');
  } finally { process.chdir(previousCwd); }
});
test('RMTX scaffold writes an explicit native project config and actually compiles', t => {
  const f = fixture(t, {});
  const { createRmtAppScaffold } = require('../../xtend-builder/generators/rmt-app');
  const result = createRmtAppScaffold({ rootDir: f.rootDir, out: 'app', server: 'none', sourceSyntax: 'rmtx', write: true, title: 'A "quoted" <title>' });
  assert.equal(result.ok, true, JSON.stringify(result.errors)); assert.equal(result.schema, 'xtend.scaffold.app-preset.rmt-report.v2');
  const config = JSON.parse(fs.readFileSync(f.file('app/maraca.config.json'), 'utf8')); assert.equal(config.schema, 'xtend.maraca.project-config.v1'); assert.equal(config.config.options.source, 'src/app.rmtx');
  const manifest = JSON.parse(fs.readFileSync(f.file('app/package.json'), 'utf8'));
  assert.equal(manifest.devDependencies['@ccslabs/xtend-compiler'], '^0.9.0');
  for (const command of ['check', 'watch']) { assert.match(manifest.scripts[command], /--project/u); assert.match(manifest.scripts[command], /--rmtx-syntax-version 8\.0\.0/u); }
  assert.equal(fs.existsSync(f.file('app/src/app.rmt')), false);
  const compiled = compileRmtProjectSource({ filePath: f.file('app/src/app.rmtx'), text: fs.readFileSync(f.file('app/src/app.rmtx'), 'utf8') }, { rootDir: f.file('app') });
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  assert.deepEqual(compiled.orchestrationArtifacts.render.nativeView.surfaces, ['app']);
});

test('Maraca project plans preserve the native wire contract and used imported declarations', t => {
  const f = fixture(t, { 'app.rmt': 'import "./view.rmtx"\ntemplate app { state value type string initial "linked" }',
    'view.rmtx': program('<RMT.Surface id="root"><RMT.View><RMT.Element tag="p"><RMT.Text value={model.value}/></RMT.Element></RMT.View></RMT.Surface>', 'view') });
  const { createMaracaProjectBuildPlan } = require('../../xtend-maraca');
  const result = createMaracaProjectBuildPlan({ source: 'app.rmt', project: true, services: false, css: 'inline', sizeBudget: 'off' }, { rootDir: f.rootDir, inspectToolchain: false });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.schema, 'xtend.maraca.project-build-plan.v1');
  assert.equal(result.project.sourceSyntax, 'rmt-vnext'); assert.equal(result.project.effectiveSourceProfile.syntax, 'rmtx');
  assert.equal(result.plan.schema, 'xtend.maraca.build-plan.v12'); assert.equal(result.plan.orchestration.artifact.schema, 'xtend.rmt.app-orchestration.v6');
  assert.equal(result.project.dependencies.length, 2);
});
test('explicit inline RMTX uses the same synthetic identity for graph and actual native compilation', t => {
  const f = fixture(t, { 'state.rmt': 'template states { state title type string initial "inline" }' });
  const source = program('<RMT.Import path="../state.rmt"/><RMT.Surface id="view"><RMT.View><RMT.Text value={model.title}/></RMT.View></RMT.Surface>');
  const { createMaracaProjectBuildPlan } = require('../../xtend-maraca');
  for (const key of ['sourceText', 'sourceContent']) {
    const result = createMaracaProjectBuildPlan({ [key]: source, sourceSyntax: 'rmtx', orchestration: 'strict', kernel: 'strict', services: false, css: 'inline', sizeBudget: 'off' }, { rootDir: f.rootDir, inspectToolchain: false });
    assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
    assert.equal(result.project.entryFile, f.file('docs/rmt-playground-source.rmtx'));
    assert.equal(result.plan.source, 'docs/rmt-playground-source.rmtx');
    assert.equal(result.plan.rmt.compilerSchema, 'xtend.rmtx.compile-result.v8');
    assert.equal(result.plan.orchestration.artifact.state.states[0].initial, 'inline');
  }
});
test('Maraca project plans share genuine same-root session facts and reject foreign callbacks', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.State id="value" type="number" initial={1}/>') });
  const { createMaracaProjectBuildPlan } = require('../../xtend-maraca');
  const session = createRmtCompilationSession({ root: f.rootDir, applyDefaultDocumentId: false, readonlyResults: true }); t.after(() => session.dispose());
  const input = { source: 'app.rmtx', services: false, css: 'inline', sizeBudget: 'off' };
  const result = createMaracaProjectBuildPlan(input, { rootDir: f.rootDir, inspectToolchain: false, compileSource: session.compileProjectSource });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.ok(session.snapshot().compilations > 0); assert.ok(session.snapshot().documents > 0, 'the adapter must preserve caller-owned session facts');
  const repeated = createMaracaProjectBuildPlan(input, { rootDir: f.rootDir, inspectToolchain: false, compileSource: session.compileProjectSource });
  assert.equal(repeated.ok, true); assert.ok(session.snapshot().hits > 0);
  const forged = createMaracaProjectBuildPlan(input, { rootDir: f.rootDir, inspectToolchain: false, compileSource: () => result });
  assert.equal(forged.ok, false); assert.equal(forged.status, 'project_invalid'); assert.match(forged.diagnostics[0].message, /genuine compilation session/u);
  const differentRoot = createMaracaProjectBuildPlan(input, { rootDir: path.dirname(f.rootDir), inspectToolchain: false, compileSource: session.compileProjectSource });
  assert.equal(differentRoot.ok, false); assert.match(differentRoot.diagnostics[0].message, /same root/u);
});
test('CLI project check and watch-once return the same source-bound graph', t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.State id="value" type="number" initial={1}/>') });
  const cli = path.resolve(__dirname, '../../xtend-builder/scaffold.js');
  const run = subcommand => spawnSync(process.execPath, [cli, 'rmt', subcommand, 'app.rmtx', '--project', '--source-syntax', 'rmtx', '--rmtx-syntax-version', '8.0.0', '--json', ...(subcommand === 'watch' ? ['--once'] : [])], { cwd: f.rootDir, encoding: 'utf8', timeout: 30000 });
  const checked = run('check'), watched = run('watch');
  assert.equal(checked.status, 0, checked.stderr + checked.stdout); assert.equal(watched.status, 0, watched.stderr + watched.stdout);
  const a = JSON.parse(checked.stdout), b = JSON.parse(watched.stdout);
  assert.equal(a.schema, 'xtend.rmt.project-check.v1'); assert.equal(a.project.identity, b.project.identity); assert.equal(a.project.entryFile, f.file('app.rmtx'));
});
test('CLI and MCP report identical imported compiler codes and original ranges', async t => {
  const f = fixture(t, { 'app.rmtx': program('<RMT.Import path="./bad dir/bäd.rmtx"/>'), 'bad dir/bäd.rmtx': program('<RMT.State id="value" type="number" initial={globalThis.bad()}/>', 'bad') });
  const child = spawnSync(process.execPath, [path.resolve(__dirname, '../../xtend-builder/scaffold.js'), 'rmt', 'check', 'app.rmtx', '--project', '--json'], { cwd: f.rootDir, encoding: 'utf8', timeout: 30000 });
  assert.equal(child.status, 1, child.stderr); const cli = JSON.parse(child.stdout);
  const api = await import(pathToFileURL(path.resolve(__dirname, '../../products/xtend-mcp/src/tooling.mjs')).href);
  const mcp = await api.runRmtCompileCheck({ path: 'app.rmtx' }, { workspaceRoots: [f.rootDir] });
  assert.equal(mcp.ok, false);
  assert.deepEqual(mcp.diagnostics.map(item => [item.code, item.range]), cli.diagnostics.map(item => [item.code, item.range]));
  const located = mcp.diagnostics.find(item => item.workspacePath === 'bad dir/bäd.rmtx');
  assert.ok(located); assert.equal(located.uri, 'xtend-workspace:///bad%20dir/b%C3%A4d.rmtx'); assert.equal(located.filePath, 'bad dir/bäd.rmtx');
  assert.ok(!JSON.stringify(mcp).includes('file://[workspace]')); assert.ok(!JSON.stringify(mcp).includes(f.rootDir));
});
test('CLI, MCP and Maraca share the selected provider registry without executing provider code', async t => {
  const digest = text => createHash('sha256').update(text).digest('hex');
  const module = 'throw new Error("Provider code must not execute during project tooling");\nexport function createComponent() {}\n';
  const definition = { schema: 'xtend.xtensions.component-interface.v1', providerId: 'test-provider', version: '1.0.0', componentVersion: '1.0.0', framework: 'react',
    entry: { module: './provider.mjs', exportName: 'createComponent', sha256: digest(module) }, peers: { react: '18.3.1', 'react-dom': '18.3.1' },
    props: { title: { type: 'string' } }, intents: {}, ownership: { attributes: 'declared-props-only', children: 'provider-owned', slots: 'provider-owned' } };
  const json = value => JSON.stringify(value, null, 2) + '\n';
  const interfaceText = json(definition);
  const registry = { schema: 'xtend.maraca.rmtx-providers.v1', interfaces: [{ file: './provider.interface.json', sha256: digest(interfaceText) }] };
  const f = fixture(t, { 'app.rmtx': program('<RMT.State id="title" type="string" initial="Hello"/><RMT.Surface id="root"><RMT.Lane name="visible"><RMT.Mount target="root"/><RMT.Hydrate target="root"/></RMT.Lane><RMT.View><RMT.Text value={model.title}/></RMT.View></RMT.Surface><RMT.Surface id="providerHost"><RMT.XTension id="host" provider="test-provider" owner="root" lane="visible" props={{title:model.title}}/></RMT.Surface>'),
    'provider.mjs': module, 'provider.interface.json': interfaceText, 'registry.json': json(registry) });
  const check = () => spawnSync(process.execPath, [path.resolve(__dirname, '../../xtend-builder/scaffold.js'), 'rmt', 'check', 'app.rmtx', '--project', '--rmtx-providers-file', 'registry.json', '--json'], { cwd: f.rootDir, encoding: 'utf8', timeout: 30000 });
  const cli = check(); assert.equal(cli.status, 0, cli.stderr + cli.stdout);
  const api = await import(pathToFileURL(path.resolve(__dirname, '../../products/xtend-mcp/src/tooling.mjs')).href);
  const mcp = await api.runRmtCompileCheck({ path: 'app.rmtx', rmtxProvidersFile: 'registry.json' }, { workspaceRoots: [f.rootDir] });
  assert.equal(mcp.ok, true, JSON.stringify(mcp.diagnostics)); assert.equal(mcp.project.identity, JSON.parse(cli.stdout).project.identity);
  assert.ok(mcp.project.dependencies.some(item => item.kind === 'provider-module'));
  const plan = require('../../xtend-maraca').createMaracaProjectBuildPlan({ source: 'app.rmtx', rmtxProvidersFile: 'registry.json', orchestration: 'strict', kernel: 'strict', services: false, css: 'inline', sizeBudget: 'off' }, { rootDir: f.rootDir, inspectToolchain: false });
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics)); assert.equal(plan.project.identity, JSON.parse(cli.stdout).project.identity);
  assert.equal(plan.project.rmtxProviders.interfaces[0].sha256, registry.interfaces[0].sha256);
  const identity = mcp.project.identity;
  definition.props.title.type = 'number'; const changed = json(definition);
  registry.interfaces[0].sha256 = digest(changed); fs.writeFileSync(f.file('provider.interface.json'), changed); fs.writeFileSync(f.file('registry.json'), json(registry));
  const invalidCli = check(), invalidMcp = await api.runRmtCompileCheck({ path: 'app.rmtx', rmtxProvidersFile: 'registry.json' }, { workspaceRoots: [f.rootDir] });
  assert.equal(invalidCli.status, 1); assert.equal(invalidMcp.ok, false); assert.notEqual(invalidMcp.project.identity, identity);
  assert.deepEqual(invalidMcp.diagnostics.map(item => [item.code, item.range]), JSON.parse(invalidCli.stdout).diagnostics.map(item => [item.code, item.range]));
  registry.interfaces[0].sha256 = '0'.repeat(64); fs.writeFileSync(f.file('registry.json'), json(registry));
  const invalidPins = require('../../xtend-maraca').createMaracaProjectBuildPlan({ source: 'app.rmtx', rmtxProvidersFile: 'registry.json', orchestration: 'strict', kernel: 'strict', services: false }, { rootDir: f.rootDir, inspectToolchain: false });
  assert.equal(invalidPins.ok, false); assert.ok(invalidPins.project); assert.ok(invalidPins.diagnostics.some(item => item.code === 'rmt.project.providers.invalid'));
});
