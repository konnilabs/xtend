const path = require('path');

const RMT_VSCODE_BRIDGE_SCHEMA = 'xtend.rmt.editor.vscode-bridge.v1';
const RMT_VSCODE_BRIDGE_WORKPACKAGE = 'WP-E14-12';
const DEFAULT_SERVER_RELATIVE_PATH = '../../rmt-language-server/server.js';

function resolveServerModule(context = {}, options = {}) {
  if (options.serverModule) {
    return path.resolve(options.serverModule);
  }

  const extensionPath = context.extensionPath || __dirname;
  return path.resolve(extensionPath, DEFAULT_SERVER_RELATIVE_PATH);
}

function createServerCommand(context = {}, options = {}) {
  return {
    schema: RMT_VSCODE_BRIDGE_SCHEMA,
    workpackage: RMT_VSCODE_BRIDGE_WORKPACKAGE,
    command: options.command || 'node',
    args: [resolveServerModule(context, options)],
    transport: 'stdio-json-rpc',
    languageId: 'rmt',
    sourceOfTruth: 'tools/rmt-language-server/server.js',
    networkRequired: false,
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  };
}

function activate(context) {
  const vscode = require('vscode');
  const output = vscode.window.createOutputChannel('XTendRMT');
  const serverCommand = createServerCommand(context);
  const disposable = vscode.commands.registerCommand('xtendRmt.showLanguageServerCommand', () => {
    output.clear();
    output.appendLine('XTendRMT Language Server');
    output.appendLine(`${serverCommand.command} ${serverCommand.args.join(' ')}`);
    output.appendLine('Use this command with a generic LSP client until a packaged VS Code LanguageClient is added.');
    output.show(true);
  });

  context.subscriptions.push(output, disposable);
  return serverCommand;
}

function deactivate() {}

module.exports = {
  RMT_VSCODE_BRIDGE_SCHEMA,
  RMT_VSCODE_BRIDGE_WORKPACKAGE,
  activate,
  createServerCommand,
  deactivate,
  resolveServerModule
};
