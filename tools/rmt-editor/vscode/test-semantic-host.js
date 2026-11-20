'use strict';
// Run with an isolated VS Code --extensionTestsPath. Never installs or reloads
// the developer's active extension. The caller supplies its temporary workspace.
// Harness revision 2.0.0 waits for a real workspace create event before testing
// the single dependency write; editor startup does not imply watcher readiness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function run() {
  const vscode = require('vscode');
  const checks = [], reportPath = process.env.XTEND_RMTX_SMOKE_REPORT;
  const report = { schema: 'xtend.rmt.editor.semantic-host-smoke.v1', ok: false, node: process.version, vscode: vscode.version, checks };
  const check = (name, value) => { assert(value, name); checks.push(name); };
  async function until(read, predicate, name) {
    const deadline = Date.now() + 30000;
    for (;;) {
      const value = await read();
      if (predicate(value)) return value;
      if (Date.now() >= deadline) throw new Error(`Timed out: ${name}: ${JSON.stringify(value)}`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  try {
    const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'xtend-rmt-language');
    check('packaged extension discovered', Boolean(extension));
    report.extensionPath = extension.extensionPath;
    const clientPackage = JSON.parse(fs.readFileSync(path.join(extension.extensionPath, 'node_modules/vscode-languageclient/package.json'), 'utf8'));
    const tsPackage = JSON.parse(fs.readFileSync(path.join(extension.extensionPath, 'node_modules/typescript/package.json'), 'utf8'));
    check('LanguageClient 9 closure packaged', clientPackage.version.startsWith('9.'));
    check('TypeScript 5.9.3 packaged', tsPackage.version === '5.9.3');
    check('no author NODE_PATH required', !process.env.NODE_PATH);
    await extension.activate();
    const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const uri = vscode.Uri.file(path.join(root, 'view.rmtx')), stateUri = vscode.Uri.file(path.join(root, 'state.rmt'));
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    check('RMTX language selected', document.languageId === 'rmtx');
    const original = document.getText(), point = value => document.positionAt(document.getText().lastIndexOf(value) + value.length);
    const errors = () => vscode.languages.getDiagnostics(uri).filter(item => item.severity === vscode.DiagnosticSeverity.Error);
    const definitions = await until(() => vscode.commands.executeCommand('vscode.executeDefinitionProvider', uri, point('model.product.titl')),
      value => value?.length > 0, 'original Classic definition');
    check('definition routes to real Classic dependency', definitions.some(item => (item.uri || item.targetUri).toString() === stateUri.toString()));
    const rename = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider', uri, point('model.product.titl'), 'heading');
    const editUris = rename.entries().map(([target]) => target.toString());
    check('rename edits both original source files', editUris.includes(uri.toString()) && editUris.includes(stateUri.toString()) && editUris.every(item => !item.includes('__xtend.tsx')));
    async function replace(text) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), text);
      assert(await vscode.workspace.applyEdit(edit));
    }
    await replace(original.replace('model.product.title', 'model.product.'));
    const completions = await until(() => vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, point('model.product.')),
      value => value?.items?.some(item => (typeof item.label === 'string' ? item.label : item.label.label) === 'title'), 'recovery completion');
    check('incomplete RMTX completion uses imported model shape', Boolean(completions));
    await replace(original.replace('model.product.title', 'model.product.missing'));
    const missing = await until(errors, value => value.some(item => /missing/u.test(item.message)), 'model property diagnostic');
    check('diagnostic original UTF16 range', missing.some(item => document.getText(item.range) === 'missing'));
    await replace(original);
    await until(errors, value => value.length === 0, 'restored valid source');
    const probes = new Set(), prefix = `.xtend-rmtx-watch-${Date.now()}-`;
    const readiness = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, prefix + '*.probe'), false, true, true);
    let watcherReady = false;
    const created = readiness.onDidCreate(target => { if (probes.has(target.fsPath)) watcherReady = true; });
    try {
      await until(() => {
        if (!watcherReady) {
          const probe = path.join(root, prefix + probes.size + '.probe');
          probes.add(probe); fs.writeFileSync(probe, 'workspace watcher readiness');
        }
        return watcherReady;
      }, Boolean, 'real workspace watcher create event');
    } finally {
      created.dispose(); readiness.dispose();
      for (const probe of probes) fs.rmSync(probe, { force: true });
    }
    const statePath = stateUri.fsPath, state = fs.readFileSync(statePath, 'utf8');
    try {
      fs.writeFileSync(statePath, state.replace('"one"', '42'));
      await until(errors, value => value.some(item => /not assignable/u.test(item.message)), 'file watcher type invalidation');
      check('closed dependency file watcher invalidates semantic types', true);
    } finally { fs.writeFileSync(statePath, state); }
    await until(errors, value => value.length === 0, 'disk dependency restored');
    report.ok = true;
  } catch (error) {
    report.error = error.stack || String(error);
    throw error;
  } finally {
    if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
}
module.exports = { run };
