#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const extensionRoot = path.join(repoRoot, 'tools', 'rmt-editor', 'vscode');
const require = createRequire(import.meta.url);
const { unpackVsix, smokeLanguageServer } = require(path.join(repoRoot, 'scripts/test-runner/vsix-smoke'));
const extensionPackage = JSON.parse(fs.readFileSync(path.join(extensionRoot, 'package.json')));
const vsixPath = process.argv[process.argv.indexOf('--vsix') + 1] && process.argv.includes('--vsix')
  ? path.resolve(process.argv[process.argv.indexOf('--vsix') + 1])
  : path.join(extensionRoot, `${extensionPackage.name}-${extensionPackage.version}.vsix`);
const unpacked = unpackVsix(vsixPath);
process.on('exit', unpacked.cleanup);
const stageRoot = unpacked.extensionRoot;
const workspace = path.join(unpacked.directory, 'workspace');
fs.mkdirSync(workspace);
const languageServer = await smokeLanguageServer(stageRoot, workspace);
const projectIndexPath = path.join(stageRoot, 'tools', 'project-index');
fs.renameSync(projectIndexPath, `${projectIndexPath}.missing`);
try {
  const missingDependency = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(path.join(stageRoot, 'tools/rmt-language-server/server.js'))})`], {
    cwd: workspace, env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' }, encoding: 'utf8', timeout: 10000
  });
  assert.notEqual(missingDependency.status, 0, 'Workspace modules rescued an incomplete VSIX.');
  assert.match(missingDependency.stderr, /Cannot find module.*project-index/);
} finally { fs.renameSync(`${projectIndexPath}.missing`, projectIndexPath); }
const stagedMcpRoot = path.join(stageRoot, 'products', 'xtend-mcp');
const evidencePath = path.join(repoRoot, '.xtend-test-results', 'xtend-mcp-vsix-smoke.json');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

assert.ok(fs.existsSync(path.join(stagedMcpRoot, 'bin', 'xtend-mcp.mjs')), 'VSIX stage has no bundled xtend-mcp CLI.');
const pkg = JSON.parse(fs.readFileSync(path.join(stagedMcpRoot, 'package.json'), 'utf8'));
const manifestBytes = fs.readFileSync(path.join(stagedMcpRoot, 'generated', 'knowledge-manifest.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const docsBytes = fs.readFileSync(path.join(stagedMcpRoot, 'generated', manifest.docs.artifact));
assert.equal(pkg.version, '0.1.0');
assert.equal(manifest.version, pkg.version);
assert.equal(sha256(docsBytes), manifest.docs.artifactSha256);

const stagedClientModule = await import(pathToFileURL(path.join(stagedMcpRoot, 'src', 'client.mjs')).href);
const readOnly = await stagedClientModule.createXtendMcpClient({ cwd: workspace });
const readOnlyTools = (await readOnly.client.listTools()).tools;
assert.ok(readOnlyTools.some((tool) => tool.name === 'xtend_knowledge_search'));
assert.ok(!readOnlyTools.some((tool) => tool.name === 'xtend_rmt_apply_safe_repairs'));
await readOnly.close();

const cliPath = path.join(stagedMcpRoot, 'bin', 'xtend-mcp.mjs');
const writable = await stagedClientModule.createXtendMcpClient({
  cwd: workspace,
  args: [cliPath, 'stdio', '--workspace', workspace, '--allow-workspace-write']
});
const writableTools = (await writable.client.listTools()).tools;
assert.ok(writableTools.some((tool) => tool.name === 'xtend_rmt_apply_safe_repairs'));
await writable.close();

const extension = require(path.join(stageRoot, 'extension.js'));
const configuration = extension.createXtendMcpServerDefinitionConfig(null, { extensionPath: stageRoot }, {
  workspaceFolders: [{ uri: { fsPath: workspace } }],
  nodePath: process.execPath,
  pathExists: fs.existsSync
});
assert.equal(configuration.workspaceWrites, false);
assert.ok(!configuration.args.includes('--allow-workspace-write'));
assert.equal(configuration.args[0], cliPath);
const missingNode = extension.probeXtendMcpNode('missing-node', {
  spawnSync: () => ({ status: 127, stdout: '', stderr: '', error: new Error('not found') })
});
assert.equal(missingNode.ok, false);

const evidence = {
  schema: 'xtend.mcp.vsix-smoke.v1',
  ok: true,
  platform: process.platform,
  node: process.versions.node,
  packageVersion: pkg.version,
  knowledgeManifestSha256: sha256(manifestBytes),
  docsArtifactSha256: manifest.docs.artifactSha256,
  readOnlyToolCount: readOnlyTools.length,
  writableToolCount: writableTools.length,
  missingNodeDiagnostic: missingNode.error
};
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
fs.writeFileSync(path.join(path.dirname(evidencePath), 'xtend-rmt-editor-vsix-smoke.json'), `${JSON.stringify({
  schema: 'xtend.rmt.editor.vsix-smoke.v1', ok: true, platform: process.platform, node: process.versions.node,
  languageServer, packedArtifactSha256: sha256(fs.readFileSync(vsixPath)), missingDependencyRejected: true
}, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  ...evidence,
  evidence: path.relative(repoRoot, evidencePath)
}, null, 2)}\n`);
