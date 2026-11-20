'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { createRmtLanguageServer } = require('../../tools/rmt-language-server/server');
const { encodeProtocolMessage, parseProtocolMessages } = require('../../tools/rmt-language-server/protocol');
const header = `import {RMT,model} from '@ccslabs/xtend/rmt-language/rmtx';\nexport default `;
function workspace(t) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmtx-lsp-')); t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  const state = `template states { state product type object { initial { title "one" } } }`;
  const view = header + `<RMT.Program id="app"><RMT.Import path="./state.rmt"/>
<RMT.Surface id="view"><RMT.View><RMT.Component tag="x-input" properties={{value:model.product.title}}/></RMT.View></RMT.Surface></RMT.Program>`;
  fs.writeFileSync(path.join(rootDir, 'state.rmt'), state); fs.writeFileSync(path.join(rootDir, 'view.rmtx'), view);
  return { rootDir, state, view, uri: pathToFileURL(path.join(rootDir, 'view.rmtx')).href, stateUri: pathToFileURL(path.join(rootDir, 'state.rmt')).href };
}
function point(text, needle, after = false) { const at = text.lastIndexOf(needle) + (after ? needle.length : 0), lines = text.slice(0, at).split('\n'); return { line: lines.length - 1, character: lines.at(-1).length }; }

test('LSP routes RMTX to semantic tooling and invalidates open consumers on Classic dependency edits', t => {
  const fixture = workspace(t), server = createRmtLanguageServer({ rootDir: fixture.rootDir }); t.after(() => server.dispose());
  const init = server.initialize({ rootUri: pathToFileURL(fixture.rootDir).href });
  assert.deepEqual(init.xtend.languageIds, ['rmt', 'rmtx']); assert(init.capabilities.renameProvider.prepareProvider);
  const first = server.openDocument({ textDocument: { uri: fixture.uri, text: fixture.view, languageId: 'rmtx', version: 1 } });
  assert(first.every(notification => notification.params.diagnostics.every(item => item.severity !== 1)), JSON.stringify(first));
  assert.equal(server.projectIndex.overlays.has(fixture.uri), false, 'No RMTX source enters Classic analysis');
  const position = point(fixture.view, 'title'); const definition = server.definition({ textDocument: { uri: fixture.uri }, position });
  assert.equal(definition.uri, fixture.stateUri);
  const rename = server.handleRequest({ id: 10, method: 'textDocument/rename', params: { textDocument: { uri: fixture.uri }, position, newName: 'heading' } });
  assert(rename.result.changes[fixture.stateUri]); assert(rename.result.changes[fixture.uri]);
  const notifications = server.openDocument({ textDocument: { uri: fixture.stateUri, text: fixture.state.replace('"one"', '42'), languageId: 'rmt', version: 2 } });
  assert(notifications.some(item => item.params.uri === fixture.uri && item.params.diagnostics.some(diagnostic => /not assignable/u.test(diagnostic.message))), JSON.stringify(notifications));
  const close = server.closeDocument({ textDocument: { uri: fixture.stateUri } });
  assert(close.some(item => item.params.uri === fixture.uri && item.params.diagnostics.every(diagnostic => diagnostic.severity !== 1)), JSON.stringify(close));
});

test('actual stdio server supplies original-file diagnostics, completion and navigation', t => {
  const fixture = workspace(t), source = fixture.view.replace('model.product.title', 'model.product.'), position = point(source, 'model.product.', true);
  const messages = [
    { id: 1, method: 'initialize', params: { rootUri: pathToFileURL(fixture.rootDir).href } },
    { method: 'textDocument/didOpen', params: { textDocument: { uri: fixture.uri, languageId: 'rmtx', version: 1, text: source } } },
    { id: 2, method: 'textDocument/completion', params: { textDocument: { uri: fixture.uri }, position } },
    { method: 'textDocument/didChange', params: { textDocument: { uri: fixture.uri, version: 2 }, contentChanges: [{ text: fixture.view }] } },
    { id: 3, method: 'textDocument/definition', params: { textDocument: { uri: fixture.uri }, position: point(fixture.view, 'title') } },
    { id: 4, method: 'shutdown', params: {} }, { method: 'exit' }
  ].map(message => ({ jsonrpc: '2.0', ...message }));
  const child = spawnSync(process.execPath, ['--max-old-space-size=1024', path.resolve(__dirname, '../../tools/rmt-language-server/server.js')], {
    cwd: fixture.rootDir, input: messages.map(encodeProtocolMessage).join(''), timeout: 60000, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024
  });
  assert.equal(child.status, 0, child.stderr); assert.equal(child.signal, null);
  const outputs = parseProtocolMessages(Buffer.from(child.stdout)).messages;
  assert(!outputs.some(item => item.error), JSON.stringify(outputs));
  assert(outputs.find(item => item.id === 2).result.items.some(item => item.label === 'title'), JSON.stringify(outputs));
  assert.equal(outputs.find(item => item.id === 3).result.uri, fixture.stateUri);
  assert(outputs.filter(item => item.method === 'textDocument/publishDiagnostics').every(item => !JSON.stringify(item).includes('__xtend.tsx')));
});

test('independent workspace roots retain separate models, original navigation and folder-change overlays', t => {
  const first = workspace(t), second = workspace(t), server = createRmtLanguageServer({ rootDir: first.rootDir });
  t.after(() => server.dispose());
  fs.writeFileSync(path.join(second.rootDir, 'state.rmt'), second.state.replace('title "one"', 'heading "two"'));
  const secondView = second.view.replace('model.product.title', 'model.product.heading');
  server.initialize({ workspaceFolders: [first, second].map((item, index) => ({ uri: pathToFileURL(item.rootDir).href, name: 'root' + index })) });
  for (const [fixture, text] of [[first, first.view], [second, secondView]]) {
    const notifications = server.openDocument({ textDocument: { uri: fixture.uri, languageId: 'rmtx', version: 1, text } });
    assert(notifications.every(item => item.params.diagnostics.every(diagnostic => diagnostic.severity !== 1)), JSON.stringify(notifications));
  }
  const definition = server.definition({ textDocument: { uri: second.uri }, position: point(secondView, 'heading') });
  assert.equal(definition.uri, second.stateUri);
  const notifications = server.openDocument({ textDocument: { uri: second.stateUri, languageId: 'rmt', version: 2, text: second.state.replace('title "one"', 'heading 42') } });
  assert(notifications.some(item => item.params.uri === second.uri && item.params.diagnostics.some(diagnostic => /not assignable/u.test(diagnostic.message))));
  assert(notifications.filter(item => item.params.uri === first.uri).every(item => item.params.diagnostics.every(diagnostic => diagnostic.severity !== 1)));
  const after = server.workspaceFolders({ event: { removed: [{ uri: pathToFileURL(first.rootDir).href }], added: [] } });
  assert(after.some(item => item.params.uri === second.uri && item.params.diagnostics.some(diagnostic => /not assignable/u.test(diagnostic.message))), JSON.stringify(after));
  assert.equal(server.rmtxServices.size, 1);
  for (const uri of [first.uri, second.uri, second.stateUri]) server.closeDocument({ textDocument: { uri } });
  assert.equal(server.rmtxDiagnosticUris.size, 0, 'Cleared documents must not remain in the publication cache');
});
