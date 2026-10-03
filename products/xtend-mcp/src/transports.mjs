import crypto from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';

import { createMcpHandler } from '@modelcontextprotocol/server';
import { localhostHostValidation, localhostOriginValidation, toNodeHandler } from '@modelcontextprotocol/node';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

import { createXtendMcpServerFactory } from './server.mjs';

function tokenMatches(header, expected) {
  const prefix = 'Bearer ';
  if (typeof header !== 'string' || !header.startsWith(prefix)) return false;
  const actual = Buffer.from(header.slice(prefix.length), 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
}

function jsonResponse(response, status, payload) {
  const body = `${JSON.stringify(payload)}\n`;
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  response.end(body);
}

export function startXtendMcpStdio(options = {}) {
  return serveStdio(createXtendMcpServerFactory(options), {
    onerror(error) {
      const message = error instanceof Error ? (error.stack || error.message) : String(error);
      process.stderr.write(`XTend MCP stdio error: ${message}\n`);
    }
  });
}

export async function startXtendMcpHttp(options = {}) {
  const host = '127.0.0.1';
  const port = Number.isInteger(options.port) ? options.port : 0;
  const token = String(options.token || crypto.randomBytes(32).toString('base64url'));
  if (token.length < 24) throw new Error('XTend MCP HTTP Bearer token must contain at least 24 characters.');

  const mcpHandler = createMcpHandler(createXtendMcpServerFactory(options));
  const nodeHandler = toNodeHandler(mcpHandler);
  const validateHost = localhostHostValidation();
  const validateOrigin = localhostOriginValidation();
  const server = createHttpServer((request, response) => {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    if (request.method === 'GET' && requestUrl.pathname === '/health') {
      jsonResponse(response, 200, { schema: 'xtend.mcp.health.v1', ok: true, version: '0.1.0' });
      return;
    }
    if (requestUrl.pathname !== '/mcp') {
      jsonResponse(response, 404, { error: 'not_found' });
      return;
    }
    if (!validateHost(request, response) || !validateOrigin(request, response)) return;
    if (!tokenMatches(request.headers.authorization, token)) {
      response.setHeader('www-authenticate', 'Bearer realm="XTend MCP"');
      jsonResponse(response, 401, { error: 'unauthorized' });
      return;
    }
    Promise.resolve(nodeHandler(request, response)).catch((error) => {
      if (!response.headersSent) jsonResponse(response, 500, { error: 'mcp_handler_failed' });
      else response.destroy(error instanceof Error ? error : new Error(String(error)));
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  const address = server.address();
  const actualPort = address && typeof address === 'object' ? address.port : port;
  let closed = false;
  return {
    schema: 'xtend.mcp.http-handle.v1',
    server,
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/mcp`,
    healthUrl: `http://${host}:${actualPort}/health`,
    token,
    async close() {
      if (closed) return;
      closed = true;
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      if (typeof mcpHandler.close === 'function') await mcpHandler.close();
    }
  };
}
