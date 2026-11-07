import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { registerXtendMcpServerDefinitionProvider } = require('../../../tools/rmt-editor/vscode/extension.js');

// Match VS Code's public positional constructor; an options object is not a label.
class McpStdioServerDefinition {
  constructor(label, command, args = [], env = {}, version) {
    assert.equal(typeof label, 'string');
    assert.equal(typeof command, 'string');
    Object.assign(this, { label, command, args, env, version });
  }
}

function register(enabled = true) {
  let provider;
  const api = {
    McpStdioServerDefinition,
    Uri: { file: (fsPath) => ({ scheme: 'file', fsPath }) },
    lm: {
      registerMcpServerDefinitionProvider(id, value) {
        assert.equal(id, 'xtend.mcp');
        provider = value;
        return { dispose() {} };
      }
    },
    workspace: {
      workspaceFolders: [{ uri: { fsPath: repoRoot } }],
      getConfiguration: () => ({ get: (key) => key === 'mcp.enabled' ? enabled : undefined })
    }
  };
  const state = registerXtendMcpServerDefinitionProvider(api, {}, null, {
    serverModule: path.join(repoRoot, 'products/xtend-mcp/bin/xtend-mcp.mjs'),
    electronNodeMode: true
  });
  return { state, provider };
}

test('VS Code receives a valid MCP definition with workspace and read-only defaults', async (t) => {
  const { state, provider } = register();
  t.after(() => state.dispose());
  const servers = await provider.provideMcpServerDefinitions();
  assert.equal(servers.length, 1);
  const [server] = servers;
  assert.ok(server instanceof McpStdioServerDefinition);
  assert.equal(server.label, 'XTend MCP');
  assert.equal(server.command, process.execPath);
  assert.deepEqual(server.args, [path.join(repoRoot, 'products/xtend-mcp/bin/xtend-mcp.mjs'), 'stdio', '--workspace', repoRoot]);
  assert.deepEqual(server.cwd, { scheme: 'file', fsPath: repoRoot });
  assert.equal(server.env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal(server.version, '0.1.0');
});

test('disabled XTend MCP does not register a server definition', async (t) => {
  const { state, provider } = register(false);
  t.after(() => state.dispose());
  assert.deepEqual(await provider.provideMcpServerDefinitions(), []);
});
