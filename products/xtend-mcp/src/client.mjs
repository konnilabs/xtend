import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultCli = path.resolve(moduleDir, '..', 'bin', 'xtend-mcp.mjs');
let shared = null;

function clientKey(options = {}) {
  return JSON.stringify({
    command: options.command || process.execPath,
    args: options.args || [],
    cwd: options.cwd || process.cwd(),
    roots: options.workspaceRoots || [],
    bundleDir: options.bundleDir || options.knowledgeDir || ''
  });
}

function createParameters(options = {}) {
  const args = Array.isArray(options.args) && options.args.length
    ? [...options.args]
    : [defaultCli, 'stdio'];
  for (const root of options.workspaceRoots || []) args.push('--workspace', path.resolve(root));
  const bundleDir = options.bundleDir || options.knowledgeDir;
  if (bundleDir) args.push('--knowledge-dir', path.resolve(bundleDir));
  return {
    command: options.command || process.execPath,
    args,
    cwd: options.cwd || process.cwd(),
    env: {
      ...process.env,
      ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
      ...(options.env || {})
    },
    stderr: 'pipe'
  };
}

export async function createXtendMcpClient(options = {}) {
  const client = new Client({ name: 'XTend LLM MCP client', version: '0.1.0' });
  const transport = new StdioClientTransport(createParameters(options));
  await client.connect(transport);
  return {
    client,
    transport,
    async close() {
      await client.close();
    }
  };
}

async function getSharedClient(options = {}) {
  const key = clientKey(options);
  if (shared && shared.key !== key) {
    await shared.handle.close();
    shared = null;
  }
  if (!shared) shared = { key, handle: await createXtendMcpClient(options) };
  return shared.handle;
}

export async function executeRmtKnowledgeViaMcp(request = {}, options = {}) {
  const handle = await getSharedClient(options);
  const result = await handle.client.callTool({
    name: 'xtend_knowledge_context',
    arguments: {
      query: request?.arguments?.query || '',
      domains: request?.arguments?.domains || [],
      maxRecords: request?.arguments?.maxRecords,
      includeRecipes: request?.arguments?.includeRecipes,
      scopes: ['rmt-kit']
    }
  });
  if (result.isError) {
    const message = result.content?.find((entry) => entry.type === 'text')?.text || 'XTend MCP knowledge call failed.';
    throw new Error(message);
  }
  const data = result.structuredContent?.data;
  if (!data || typeof data !== 'object') throw new Error('XTend MCP returned no structured RMT knowledge data.');
  return { ...data, toolCallId: request.toolCallId };
}

export async function closeXtendMcpClient() {
  if (!shared) return;
  const current = shared;
  shared = null;
  await current.handle.close();
}
