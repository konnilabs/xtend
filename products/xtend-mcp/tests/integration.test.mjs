import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { closeXtendMcpClient, executeRmtKnowledgeViaMcp } from '../src/client.mjs';
import { executeRmtKnowledge as executeDirect } from '../src/knowledge.mjs';

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const vscodeExtension = require(path.join(repoRoot, 'tools', 'rmt-editor', 'vscode', 'extension.js'));

function projection(result) {
  return {
    query: result.query,
    maxRecords: result.maxRecords,
    domains: result.domains,
    includeRecipes: result.includeRecipes,
    sourceHashes: result.sourceHashes,
    records: result.records,
    recipes: result.recipes,
    guardrailsSummary: result.guardrailsSummary,
    promptContext: result.promptContext
  };
}

test('LLM direct and stdio MCP modes are byte-equivalent for a fixed bilingual corpus', async (t) => {
  t.after(() => closeXtendMcpClient());
  const corpus = [
    { query: 'Wie verwende ich @surface mit Maraca?', domains: ['maraca'], maxRecords: 6, includeRecipes: true },
    { query: 'How do I repair an unresolved RMT schedule?', domains: ['repair'], maxRecords: 5, includeRecipes: true },
    { query: 'RMT event syntax and validation', domains: [], maxRecords: 4, includeRecipes: false }
  ];
  for (const [index, args] of corpus.entries()) {
    const request = { toolCallId: `parity-${index}`, arguments: args };
    const direct = await executeDirect(request);
    const mcp = await executeRmtKnowledgeViaMcp(request, { cwd: repoRoot });
    assert.deepEqual(projection(mcp), projection(direct), `direct/MCP divergence for ${args.query}`);
    assert.equal(mcp.toolCallId, request.toolCallId);
  }
});

test('VS Code definition stays read-only by default and adds writes only after user opt-in', () => {
  const folders = [
    { uri: { fsPath: path.join(repoRoot, 'workspace-a') } },
    { uri: { fsPath: path.join(repoRoot, 'workspace-b') } }
  ];
  const base = vscodeExtension.createXtendMcpServerDefinitionConfig(null, { extensionPath: path.join(repoRoot, 'tools', 'rmt-editor', 'vscode') }, {
    workspaceFolders: folders,
    nodePath: process.execPath,
    pathExists: () => true
  });
  assert.equal(base.providerId, 'xtend.mcp');
  assert.equal(base.command, process.execPath);
  assert.deepEqual(base.env, process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {});
  assert.equal(base.workspaceWrites, false);
  assert.ok(!base.args.includes('--allow-workspace-write'));
  assert.equal(base.args.filter((argument) => argument === '--workspace').length, 2);

  const writable = vscodeExtension.createXtendMcpServerDefinitionConfig(null, { extensionPath: path.join(repoRoot, 'tools', 'rmt-editor', 'vscode') }, {
    workspaceFolders: folders,
    nodePath: process.execPath,
    allowWorkspaceWrite: true,
    pathExists: () => true
  });
  assert.equal(writable.workspaceWrites, true);
  assert.ok(writable.args.includes('--allow-workspace-write'));
});

test('VS Code manifest and repository catfooding config expose the stable provider contract', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'rmt-editor', 'vscode', 'package.json'), 'utf8'));
  assert.equal(pkg.engines.vscode, '^1.131.0');
  assert.ok(pkg.activationEvents.includes('onStartupFinished'));
  assert.deepEqual(pkg.contributes.mcpServerDefinitionProviders, [{ id: 'xtend.mcp', label: 'XTend MCP' }]);
  assert.equal(pkg.contributes.configuration.properties['xtend.mcp.enabled'].default, true);
  assert.equal(pkg.contributes.configuration.properties['xtend.mcp.allowWorkspaceWrites'].default, false);

  const catfood = JSON.parse(fs.readFileSync(path.join(repoRoot, '.vscode', 'mcp.json'), 'utf8'));
  assert.equal(catfood.servers.xtend.type, 'stdio');
  assert.equal(catfood.servers.xtend.command, '${execPath}');
  assert.equal(catfood.servers.xtend.env.ELECTRON_RUN_AS_NODE, '1');
  assert.ok(catfood.servers.xtend.args.some((argument) => argument.includes('products/xtend-mcp/bin/xtend-mcp.mjs')));
  assert.ok(!catfood.servers.xtend.args.includes('--allow-workspace-write'));
});
