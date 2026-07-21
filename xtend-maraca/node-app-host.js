'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { createNodeAppServiceHost } = require('./node-app-service-host');

const MARACA_NODE_APP_HOST_SCHEMA = 'xtend.maraca.node-app-host.v1';
const MARACA_NODE_APP_HOST_STARTUP_SCHEMA = 'xtend.maraca.node-app-host-startup.v1';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const DEFAULT_DOCUMENT = 'site/index.html';
const DEFAULT_PUBLIC_PATHS = Object.freeze(['site/', 'dist/']);
const MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp'
});

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function filesystemPath(value, fallback) {
  if (value instanceof URL) {
    if (value.protocol !== 'file:') throw new TypeError('Node app host paths must use file: URLs.');
    return path.resolve(fileURLToPath(value));
  }
  return path.resolve(value === undefined || value === null || value === '' ? fallback : String(value));
}

function normalizePort(value) {
  const port = value === undefined ? DEFAULT_PORT : Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new RangeError('Node app host port must be an integer between 0 and 65535.');
  }
  return port;
}

function normalizeRelativePath(value, label) {
  const raw = String(value || '').replace(/\\/gu, '/').replace(/^\/+/, '');
  const normalized = path.posix.normalize(raw);
  if (!raw || normalized === '.' || normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
    throw new TypeError(`${label} must stay inside the Node app host root.`);
  }
  return normalized;
}

function normalizePublicPaths(value) {
  const entries = Array.isArray(value) && value.length > 0 ? value : DEFAULT_PUBLIC_PATHS;
  return Object.freeze(entries.map((entry) => {
    const raw = String(entry || '').replace(/\\/gu, '/');
    const directory = raw.endsWith('/');
    const normalized = normalizeRelativePath(raw, 'Node app host public path');
    return directory ? `${normalized.replace(/\/+$/u, '')}/` : normalized;
  }));
}

function readManifest(value, rootDir) {
  if (value === undefined || value === null || value === '') return null;
  const manifestPath = value instanceof URL || path.isAbsolute(String(value))
    ? filesystemPath(value, rootDir)
    : path.resolve(rootDir, String(value));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new TypeError('Node app host manifest must be a JSON object.');
  }
  return manifest;
}

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function writeText(response, statusCode, body, headers = {}) {
  if (response.writableEnded) return;
  response.writeHead(statusCode, {
    'cache-control': 'no-store',
    'content-type': 'text/plain; charset=utf-8',
    'x-content-type-options': 'nosniff',
    ...headers
  });
  response.end(body);
}

function requestPathname(requestUrl) {
  return new URL(String(requestUrl || '/'), 'http://xtend.local').pathname;
}

function hasPrivateSegment(relativePath) {
  const normalizedPath = String(relativePath || '').toLowerCase();
  const segments = normalizedPath.split('/');
  const fileName = segments[segments.length - 1] || '';
  return segments.some((segment) => !segment
    || segment.startsWith('.')
    || segment === 'server'
    || segment === 'node_modules'
    || segment === 'test')
    || fileName.endsWith('.map')
    || fileName.endsWith('.ts')
    || /(?:^|[.-])report\.json$/u.test(fileName)
    || /(?:^|[.-])size\.json$/u.test(fileName);
}

function matchesPublicPath(relativePath, publicPaths, defaultPath) {
  if (relativePath === defaultPath) return true;
  return publicPaths.some((entry) => entry.endsWith('/')
    ? relativePath.startsWith(entry)
    : relativePath === entry);
}

function resolveStaticFile(rootDir, pathname, defaultPath, publicPaths) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname || '/');
  } catch (_) {
    return { status: 403, path: null };
  }
  const relativePath = decoded === '/'
    ? defaultPath
    : path.posix.normalize(decoded.replace(/^\/+/, ''));
  if (!relativePath || relativePath === '.' || relativePath === '..' || relativePath.startsWith('../')) {
    return { status: 403, path: null };
  }
  if (hasPrivateSegment(relativePath) || !matchesPublicPath(relativePath, publicPaths, defaultPath)) {
    return { status: 403, path: null };
  }
  const absolutePath = path.resolve(rootDir, relativePath);
  if (absolutePath !== rootDir && !absolutePath.startsWith(`${rootDir}${path.sep}`)) {
    return { status: 403, path: null };
  }
  return { status: 200, path: absolutePath };
}

function createNodeAppHost(options = {}) {
  const rootDir = filesystemPath(options.rootDir, process.cwd());
  const canonicalRootDir = fs.realpathSync(rootDir);
  if (!fs.statSync(canonicalRootDir).isDirectory()) {
    throw new TypeError('Node app host rootDir must resolve to a directory.');
  }
  const defaultPath = normalizeRelativePath(options.defaultPath || DEFAULT_DOCUMENT, 'Node app host default document');
  const publicPaths = normalizePublicPaths(options.publicPaths);
  const configuredHost = String(options.host || DEFAULT_HOST).trim();
  if (!configuredHost) throw new TypeError('Node app host requires a non-empty host.');
  const configuredPort = normalizePort(options.port);
  const manifest = options.manifest || readManifest(options.manifestPath, rootDir);
  const appServiceOptions = objectRecord(options.appServices);
  const serviceHost = options.serviceHost || createNodeAppServiceHost({
    ...appServiceOptions,
    services: options.services === undefined ? appServiceOptions.services : options.services,
    registry: options.registry === undefined ? appServiceOptions.registry : options.registry,
    manifest,
    pathPrefix: options.pathPrefix || appServiceOptions.pathPrefix,
    bodyLimit: options.bodyLimit || appServiceOptions.bodyLimit,
    exposeErrors: options.exposeErrors === true || appServiceOptions.exposeErrors === true
  });
  let state = 'created';
  let boundHost = configuredHost;
  let boundPort = configuredPort;
  let closePromise = null;
  let closedResolve;
  const closedPromise = new Promise((resolve) => { closedResolve = resolve; });
  const signalTarget = options.signalTarget || process;
  let signalsInstalled = false;

  async function serveStatic(request, response) {
    const method = String(request.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      writeText(response, 405, 'Method not allowed', { allow: 'GET, HEAD' });
      return;
    }
    let pathname;
    try {
      pathname = requestPathname(request.url);
    } catch (_) {
      writeText(response, 400, 'Bad request');
      return;
    }
    const resolved = resolveStaticFile(rootDir, pathname, defaultPath, publicPaths);
    if (!resolved.path) {
      writeText(response, resolved.status, resolved.status === 403 ? 'Forbidden' : 'Not found');
      return;
    }
    let canonicalPath;
    try {
      canonicalPath = await fs.promises.realpath(resolved.path);
    } catch (_) {
      writeText(response, 404, 'Not found');
      return;
    }
    const canonicalRelativePath = path.relative(canonicalRootDir, canonicalPath).split(path.sep).join('/');
    if (!canonicalRelativePath
      || canonicalRelativePath === '..'
      || canonicalRelativePath.startsWith('../')
      || hasPrivateSegment(canonicalRelativePath)
      || !matchesPublicPath(canonicalRelativePath, publicPaths, defaultPath)) {
      writeText(response, 403, 'Forbidden');
      return;
    }
    let stat;
    try {
      stat = await fs.promises.stat(canonicalPath);
    } catch (_) {
      writeText(response, 404, 'Not found');
      return;
    }
    if (!stat.isFile()) {
      writeText(response, 404, 'Not found');
      return;
    }
    const headers = {
      'cache-control': options.cacheControl || 'no-store',
      'content-length': String(stat.size),
      'content-type': contentTypeFor(canonicalPath),
      'x-content-type-options': 'nosniff',
      'x-xtend-node-app-host': MARACA_NODE_APP_HOST_SCHEMA
    };
    if (options.contentSecurityPolicy) headers['content-security-policy'] = String(options.contentSecurityPolicy);
    response.writeHead(200, headers);
    if (method === 'HEAD') {
      response.end();
      return;
    }
    const stream = fs.createReadStream(canonicalPath);
    stream.once('error', () => {
      if (!response.headersSent) writeText(response, 500, 'App host request failed');
      else if (!response.writableEnded) response.destroy();
    });
    stream.pipe(response);
  }

  const server = http.createServer((request, response) => {
    Promise.resolve(serviceHost.handle(request, response))
      .then((handled) => handled || serveStatic(request, response))
      .catch((error) => {
        if (typeof options.onError === 'function') {
          try { options.onError(error, { phase: 'request', request }); } catch (_) {}
        }
        if (!response.headersSent && !response.writableEnded) writeText(response, 500, 'App host request failed');
        else if (!response.writableEnded) response.end();
      });
  });

  function removeSignalHandlers() {
    if (!signalsInstalled) return false;
    signalsInstalled = false;
    signalTarget.removeListener('SIGINT', onSigint);
    signalTarget.removeListener('SIGTERM', onSigterm);
    return true;
  }

  function onSigint() { void close('SIGINT'); }
  function onSigterm() { void close('SIGTERM'); }

  function installSignalHandlers() {
    if (signalsInstalled) return false;
    signalsInstalled = true;
    signalTarget.once('SIGINT', onSigint);
    signalTarget.once('SIGTERM', onSigterm);
    return true;
  }

  async function finalizeClose(reason) {
    removeSignalHandlers();
    serviceHost.dispose(`Node app host closed: ${reason}`);
    await serviceHost.whenDisposed();
    state = 'closed';
    closedResolve();
  }

  function close(reason = 'close') {
    if (closePromise) return closePromise;
    state = 'closing';
    serviceHost.dispose(`Node app host closing: ${reason}`);
    closePromise = new Promise((resolve, reject) => {
      const complete = () => finalizeClose(reason).then(resolve, reject);
      if (!server.listening) {
        void complete();
        return;
      }
      if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
      server.close((error) => error ? reject(error) : void complete());
    });
    return closePromise;
  }

  function listen() {
    if (state !== 'created') {
      return state === 'listening'
        ? Promise.resolve(api)
        : Promise.reject(new Error(`Node app host cannot listen while ${state}.`));
    }
    state = 'starting';
    return new Promise((resolve, reject) => {
      const onError = (error) => {
        server.removeListener('listening', onListening);
        state = 'failed';
        if (typeof options.onError === 'function') {
          try { options.onError(error, { phase: 'listen' }); } catch (_) {}
        }
        serviceHost.dispose('Node app host failed to listen.');
        Promise.resolve(serviceHost.whenDisposed()).then(
          () => { closedResolve(); reject(error); },
          () => { closedResolve(); reject(error); }
        );
      };
      const onListening = () => {
        server.removeListener('error', onError);
        const address = server.address();
        boundHost = address && typeof address === 'object' ? address.address : configuredHost;
        boundPort = address && typeof address === 'object' ? address.port : configuredPort;
        state = 'listening';
        if (options.shutdownSignals === true) installSignalHandlers();
        resolve(api);
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(configuredPort, configuredHost);
    });
  }

  server.once('close', () => {
    if (state !== 'closed' && state !== 'closing') void close('server-close');
  });

  const api = Object.freeze({
    schema: MARACA_NODE_APP_HOST_SCHEMA,
    startupSchema: MARACA_NODE_APP_HOST_STARTUP_SCHEMA,
    server,
    serviceHost,
    rootDir,
    defaultPath,
    publicPaths,
    listen,
    close,
    installSignalHandlers,
    removeSignalHandlers,
    whenClosed() { return closedPromise; },
    get host() { return boundHost; },
    get port() { return boundPort; },
    get origin() {
      const host = boundHost.includes(':') && !boundHost.startsWith('[') ? `[${boundHost}]` : boundHost;
      return `http://${host}:${boundPort}`;
    },
    get status() { return state; }
  });
  return api;
}

async function listenNodeAppHost(options = {}) {
  const host = createNodeAppHost(options);
  await host.listen();
  return host;
}

module.exports = {
  DEFAULT_HOST,
  DEFAULT_PORT,
  MARACA_NODE_APP_HOST_SCHEMA,
  MARACA_NODE_APP_HOST_STARTUP_SCHEMA,
  createNodeAppHost,
  listenNodeAppHost
};
