#!/usr/bin/env node

import path from 'node:path';

import { startXtendMcpHttp, startXtendMcpStdio } from '../src/transports.mjs';

function usage() {
  return [
    'XTend MCP 0.1',
    '',
    'Usage:',
    '  xtend-mcp stdio [--workspace <root>] [--allow-workspace-write] [--knowledge-dir <dir>]',
    '  xtend-mcp http [--port <0-65535>] [--workspace <root>] [--allow-workspace-write] [--knowledge-dir <dir>]',
    '',
    'HTTP always binds to 127.0.0.1 and uses XTEND_MCP_HTTP_TOKEN or an ephemeral token.'
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    transport: 'stdio',
    workspaceRoots: [],
    allowWorkspaceWrite: false,
    port: 0,
    knowledgeDir: ''
  };
  let index = 0;
  if (argv[0] === 'stdio' || argv[0] === 'http') {
    options.transport = argv[0];
    index = 1;
  }
  for (; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--workspace') {
      const value = argv[index + 1];
      if (!value) throw new Error('--workspace requires a directory.');
      options.workspaceRoots.push(path.resolve(value));
      index += 1;
    } else if (argument === '--knowledge-dir') {
      const value = argv[index + 1];
      if (!value) throw new Error('--knowledge-dir requires a directory.');
      options.bundleDir = path.resolve(value);
      options.knowledgeDir = path.resolve(value, 'rmt-ai-kit');
      index += 1;
    } else if (argument === '--port') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 0 || value > 65535) throw new Error('--port must be an integer from 0 to 65535.');
      options.port = value;
      index += 1;
    } else if (argument === '--allow-workspace-write') {
      options.allowWorkspaceWrite = true;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--version' || argument === '-v') {
      options.version = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function assertRuntime() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error(`XTend MCP requires Node.js >=24; current runtime is ${process.versions.node}.`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.version) {
    process.stdout.write('0.1.0\n');
    return;
  }
  assertRuntime();
  if (options.transport === 'stdio') {
    const handle = startXtendMcpStdio(options);
    const close = () => Promise.resolve(handle.close()).finally(() => process.exit(0));
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
    console.error(JSON.stringify({
      schema: 'xtend.mcp.connection.v1',
      transport: 'stdio',
      version: '0.1.0',
      workspaceWrites: options.allowWorkspaceWrite
    }));
    return;
  }
  const handle = await startXtendMcpHttp({
    ...options,
    token: process.env.XTEND_MCP_HTTP_TOKEN || undefined
  });
  const close = () => handle.close().finally(() => process.exit(0));
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  console.error(JSON.stringify({
    schema: 'xtend.mcp.connection.v1',
    transport: 'streamable-http',
    version: '0.1.0',
    url: handle.url,
    healthUrl: handle.healthUrl,
    bearerToken: handle.token,
    ephemeralToken: !process.env.XTEND_MCP_HTTP_TOKEN,
    workspaceWrites: options.allowWorkspaceWrite
  }));
}

main().catch((error) => {
  console.error(`XTend MCP failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
