'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const DEFAULT_INDEX = 'index.html';
const SERVER_CONTRACT = 'xtend.local-dev-server.v1';
const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.rmt': 'application/vnd.xtendrmt.rmt+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
});

function resolveSafePath(rootDir, requestPathname, defaultPath = DEFAULT_INDEX) {
  const pathname = decodeURIComponent(requestPathname || '/');
  const relativePath = pathname === '/' ? defaultPath : pathname.replace(/^\/+/, '');
  const absolutePath = path.resolve(rootDir, relativePath);

  if (absolutePath !== rootDir && !absolutePath.startsWith(`${rootDir}${path.sep}`)) {
    return null;
  }

  return absolutePath;
}

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function pathnameFromRequestUrl(requestUrl) {
  return String(requestUrl || '/').split('?')[0] || '/';
}

function createXtendDevServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const defaultPath = options.defaultPath || DEFAULT_INDEX;
  return http.createServer((request, response) => {
    let filePath = null;
    try {
      filePath = resolveSafePath(rootDir, pathnameFromRequestUrl(request.url), defaultPath);
    } catch (_) {
      filePath = null;
    }

    if (!filePath) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }

      const headers = {
        'cache-control': options.cacheControl || 'no-store',
        'content-type': contentTypeFor(filePath),
        'x-xtend-dev-server': SERVER_CONTRACT
      };
      if (options.contentSecurityPolicy) headers['content-security-policy'] = options.contentSecurityPolicy;
      response.writeHead(200, headers);
      response.end(content);
    });
  });
}

function listenXtendDevServer(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number.isInteger(options.port) ? options.port : DEFAULT_PORT;
  const server = createXtendDevServer(options);

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      resolve({
        schema: SERVER_CONTRACT,
        server,
        host,
        port: address.port,
        origin: `http://${host}:${address.port}`,
        rootDir: path.resolve(options.rootDir || process.cwd()),
        defaultPath: options.defaultPath || DEFAULT_INDEX
      });
    });
  });
}

function normalizeServeOptions(input = {}, options = {}) {
  const rootDir = path.resolve(input.root || input.rootDir || options.rootDir || process.cwd());
  const defaultPath = String(input.default || input.defaultPath || DEFAULT_INDEX);
  const host = String(input.host || DEFAULT_HOST);
  const port = input.port === undefined ? DEFAULT_PORT : Number(input.port);
  const errors = [];
  const allowed = new Set(['root', 'rootDir', 'default', 'defaultPath', 'host', 'port', 'check', 'json']);
  Object.keys(input).filter((key) => key !== '_' && !allowed.has(key)).forEach((key) => errors.push(`Unknown option: --${key}`));
  if (Array.isArray(input._) && input._.length > 0) errors.push(`Unexpected argument: ${input._[0]}`);
  if (!Number.isInteger(port) || port < 0 || port > 65535) errors.push('Port must be an integer between 0 and 65535.');
  if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) errors.push(`Serve root does not exist or is not a directory: ${rootDir}`);
  const defaultFile = resolveSafePath(rootDir, '/', defaultPath);
  if (!defaultFile) errors.push(`Default document must stay inside the serve root: ${defaultPath}`);
  else if (!fs.existsSync(defaultFile) || !fs.statSync(defaultFile).isFile()) errors.push(`Default document does not exist or is not a file: ${defaultFile}`);
  return {
    ok: errors.length === 0,
    errors,
    value: {
      rootDir,
      defaultPath,
      host,
      port,
      check: input.check === true || input.check === 'true',
      json: input.json === true || input.json === 'true'
    }
  };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server || !server.listening) {
      resolve();
      return;
    }
    server.close((error) => error ? reject(error) : resolve());
  });
}

function waitForServerShutdown(server, signalTarget = process) {
  return new Promise((resolve, reject) => {
    let closing = false;
    const cleanup = () => {
      signalTarget.removeListener('SIGINT', shutdown);
      signalTarget.removeListener('SIGTERM', shutdown);
      server.removeListener('error', fail);
      server.removeListener('close', finish);
    };
    const finish = () => { cleanup(); resolve(); };
    const fail = (error) => { cleanup(); reject(error); };
    const shutdown = () => {
      if (closing) return;
      closing = true;
      closeServer(server).catch(fail);
    };
    signalTarget.once('SIGINT', shutdown);
    signalTarget.once('SIGTERM', shutdown);
    server.once('error', fail);
    server.once('close', finish);
  });
}

module.exports = {
  DEFAULT_HOST,
  DEFAULT_INDEX,
  DEFAULT_PORT,
  MIME_TYPES,
  SERVER_CONTRACT,
  closeServer,
  contentTypeFor,
  createXtendDevServer,
  listenXtendDevServer,
  normalizeServeOptions,
  pathnameFromRequestUrl,
  resolveSafePath,
  waitForServerShutdown
};
