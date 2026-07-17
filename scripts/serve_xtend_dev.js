#!/usr/bin/env node

const path = require('path');
const {
  DEFAULT_HOST,
  DEFAULT_INDEX,
  DEFAULT_PORT,
  SERVER_CONTRACT,
  contentTypeFor,
  createXtendDevServer,
  listenXtendDevServer,
  pathnameFromRequestUrl,
  resolveSafePath
} = require('../xtend-builder/lib/dev-server');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const PROD_LIKE_CSP_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'nonce-xtend-e13-prod-csp-smoke'",
  "connect-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "frame-ancestors 'none'"
].join('; ');


function parseArgs(args) {
  const options = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    rootDir: DEFAULT_ROOT,
    defaultPath: DEFAULT_INDEX,
    contentSecurityPolicy: '',
    json: false,
    check: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--check') {
      options.check = true;
    } else if (arg === '--host') {
      options.host = args[index + 1] || DEFAULT_HOST;
      index += 1;
    } else if (arg.startsWith('--host=')) {
      options.host = arg.slice('--host='.length);
    } else if (arg === '--port') {
      options.port = Number(args[index + 1]);
      index += 1;
    } else if (arg.startsWith('--port=')) {
      options.port = Number(arg.slice('--port='.length));
    } else if (arg === '--root') {
      options.rootDir = path.resolve(args[index + 1] || DEFAULT_ROOT);
      index += 1;
    } else if (arg.startsWith('--root=')) {
      options.rootDir = path.resolve(arg.slice('--root='.length));
    } else if (arg === '--default') {
      options.defaultPath = args[index + 1] || DEFAULT_INDEX;
      index += 1;
    } else if (arg.startsWith('--default=')) {
      options.defaultPath = arg.slice('--default='.length);
    } else if (arg === '--csp') {
      options.contentSecurityPolicy = args[index + 1] || '';
      index += 1;
    } else if (arg.startsWith('--csp=')) {
      options.contentSecurityPolicy = arg.slice('--csp='.length);
    } else if (arg === '--prod-csp') {
      options.contentSecurityPolicy = PROD_LIKE_CSP_POLICY;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error('Port must be an integer between 0 and 65535.');
  }

  return options;
}

function printHelp() {
  console.log(`XTend Local Dev Server

Usage:
  node scripts/serve_xtend_dev.js [options]

Options:
  --host <host>       Host to bind. Default: ${DEFAULT_HOST}
  --port <port>       Port to bind. Use 0 for test mode. Default: ${DEFAULT_PORT}
  --root <path>       Repository root to serve. Default: repo root
  --default <path>    File served for /. Default: ${DEFAULT_INDEX}
  --csp <policy>      Send a Content-Security-Policy response header.
  --prod-csp          Send the EPIC-13 PROD-like CSP smoke policy.
  --check             Start and close immediately after binding.
  --json              Print machine-readable startup info.
  --help              Show this help.
`);
}

async function runCli() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (options.help) {
    printHelp();
    return;
  }

  const handle = await listenXtendDevServer(options);
  const payload = {
    schema: SERVER_CONTRACT,
    origin: handle.origin,
    host: handle.host,
    port: handle.port,
    rootDir: handle.rootDir,
    defaultPath: handle.defaultPath,
    contentSecurityPolicy: options.contentSecurityPolicy || '',
    check: options.check
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`XTend dev server running at ${handle.origin}/`);
    console.log(`Serving ${handle.rootDir}`);
  }

  if (options.check) {
    await new Promise((resolve) => handle.server.close(resolve));
  }
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  });
}

module.exports = {
  PROD_LIKE_CSP_POLICY,
  SERVER_CONTRACT,
  createXtendDevServer,
  listenXtendDevServer,
  contentTypeFor,
  pathnameFromRequestUrl,
  resolveSafePath
};
