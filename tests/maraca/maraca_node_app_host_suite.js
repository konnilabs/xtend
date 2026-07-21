'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const {
  MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA
} = require('../../xtend-maraca/app-services');
const { SANITIZING_BOUNDARY_CONTRACT } = require('../../xtend-maraca/trusted-text-sanitizer');
const {
  MARACA_NODE_APP_HOST_SCHEMA,
  MARACA_NODE_APP_HOST_STARTUP_SCHEMA,
  createNodeAppHost,
  listenNodeAppHost
} = require('../../xtend-maraca/node-app-host');
const {
  defineServerServices,
  service
} = require('../../xtend-maraca/server-services');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

function request(origin, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined
      ? null
      : (typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    const outgoing = http.request(`${origin}${pathname}`, {
      method: options.method || 'GET',
      headers: {
        ...(body === null ? {} : {
          'content-length': Buffer.byteLength(body),
          'content-type': 'application/json'
        }),
        ...(options.headers || {})
      }
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    outgoing.once('error', reject);
    outgoing.end(body || undefined);
  });
}

function wireRequest(input, suffix = '1') {
  return {
    schema: MARACA_APP_SERVICE_REQUEST_SCHEMA,
    serviceId: 'test.echo',
    kind: 'command',
    target: 'server',
    invocationId: `host-test-${suffix}`,
    correlationId: `host-test-${suffix}`,
    input
  };
}

async function runMaracaNodeAppHostSuite() {
  const context = createSuiteContext({
    id: 'maraca-node-app-host',
    label: 'XTend Maraca Node App Host'
  });
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-node-app-host-'));
  const signalTarget = new EventEmitter();
  let cleanupCount = 0;
  let activeSerialInvocations = 0;
  let peakSerialInvocations = 0;
  let app = null;
  try {
    fs.mkdirSync(path.join(rootDir, 'site'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'dist', 'server'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'site', 'index.html'), '<!doctype html><title>Node host proof</title>', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'xtend.maraca.mjs'), 'export const ready = true;\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'xtend.maraca.mjs.map'), '{"sources":["src/server-services.ts"]}\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'xtend.maraca.report.json'), '{"serverEntry":"src/server-services.ts"}\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'xtend.maraca.size.json'), '{"absolutePath":"/private/build/root"}\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'xtend.maraca.services.d.ts'), 'export type PrivateServerShape = unknown;\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'xtend.maraca.services.json'), '{"schema":"xtend.maraca.app-services-manifest.v1","services":[]}\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'dist', 'server', 'secret.mjs'), 'server-secret\n', 'utf8');
    fs.writeFileSync(path.join(rootDir, 'src', 'server-services.ts'), 'server-secret\n', 'utf8');
    let symlinkAvailable = true;
    try {
      fs.symlinkSync(path.join(rootDir, 'src', 'server-services.ts'), path.join(rootDir, 'site', 'server-source-alias.ts'));
    } catch (error) {
      if (error && (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOSYS')) symlinkAvailable = false;
      else throw error;
    }
    fs.writeFileSync(path.join(rootDir, 'app-services.manifest.json'), JSON.stringify({
      schema: 'xtend.maraca.app-services-manifest.v1',
      services: [{
        id: 'test.echo',
        inputPolicy: {
          schema: MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA,
          fields: [{
            name: 'value',
            type: 'string',
            boundary: SANITIZING_BOUNDARY_CONTRACT,
            sanitize: 'text'
          }]
        }
      }]
    }), 'utf8');

    const services = defineServerServices({
      'test.echo': service({
        kind: 'command',
        target: 'server',
        concurrency: 'serial',
        async invoke(input, { defer, signal }) {
          signal.throwIfAborted();
          defer(() => { cleanupCount += 1; });
          activeSerialInvocations += 1;
          peakSerialInvocations = Math.max(peakSerialInvocations, activeSerialInvocations);
          try {
            if (input && input.value && input.value.startsWith('serial-')) {
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
            return { echoed: input };
          } finally {
            activeSerialInvocations -= 1;
          }
        }
      })
    });
    app = await listenNodeAppHost({
      rootDir,
      defaultPath: 'site/index.html',
      publicPaths: ['site/', 'dist/'],
      services,
      manifestPath: 'app-services.manifest.json',
      host: '127.0.0.1',
      port: 0,
      bodyLimit: 512,
      signalTarget,
      shutdownSignals: true
    });

    assert.equal(app.schema, MARACA_NODE_APP_HOST_SCHEMA);
    assert.equal(app.startupSchema, MARACA_NODE_APP_HOST_STARTUP_SCHEMA);
    assert.equal(app.status, 'listening');
    assert.equal(app.host, '127.0.0.1');
    assert.ok(app.port > 0);
    assert.equal(app.origin, `http://127.0.0.1:${app.port}`);
    context.pass('host binds to loopback and exposes a stable dynamic-port startup contract');

    const documentResponse = await request(app.origin, '/?theme=dark');
    const moduleResponse = await request(app.origin, '/dist/xtend.maraca.mjs');
    const headResponse = await request(app.origin, '/dist/xtend.maraca.mjs', { method: 'HEAD' });
    assert.equal(documentResponse.statusCode, 200);
    assert.match(documentResponse.body, /Node host proof/u);
    assert.equal(moduleResponse.statusCode, 200);
    assert.equal(moduleResponse.headers['content-type'], 'text/javascript; charset=utf-8');
    assert.equal(headResponse.statusCode, 200);
    assert.equal(headResponse.body, '');
    context.pass('host serves the generated document and allowlisted browser artifacts with GET/HEAD semantics');

    const serviceResponse = await request(app.origin, '/api/xtend/services/test.echo', {
      method: 'POST',
      body: wireRequest({ value: 'round\r\ntrip' })
    });
    assert.equal(serviceResponse.statusCode, 200, serviceResponse.body);
    assert.deepEqual(JSON.parse(serviceResponse.body).value, { echoed: { value: 'round\ntrip' } });
    assert.equal(cleanupCount, 1);
    context.pass('host loads the relative AppService manifest, re-sanitizes HTTP input and completes request-scoped cleanup');

    const serialResponses = await Promise.all([
      request(app.origin, '/api/xtend/services/test.echo', {
        method: 'POST',
        body: wireRequest({ value: 'serial-first' }, 'serial-first')
      }),
      request(app.origin, '/api/xtend/services/test.echo', {
        method: 'POST',
        body: wireRequest({ value: 'serial-second' }, 'serial-second')
      })
    ]);
    assert.equal(serialResponses.every((response) => response.statusCode === 200), true);
    assert.equal(peakSerialInvocations, 1);
    context.pass('serial server commands remain service-wide serial across independent HTTP correlations');

    const traversalResponse = await request(app.origin, '/..%2Fpackage.json');
    const serverBundleResponse = await request(app.origin, '/dist/server/secret.mjs');
    const serverSourceResponse = await request(app.origin, '/src/server-services.ts');
    const browserSourceMapResponse = await request(app.origin, '/dist/xtend.maraca.mjs.map');
    const buildReportResponse = await request(app.origin, '/dist/xtend.maraca.report.json');
    const sizeReportResponse = await request(app.origin, '/dist/xtend.maraca.size.json');
    const declarationResponse = await request(app.origin, '/dist/xtend.maraca.services.d.ts');
    const publicManifestResponse = await request(app.origin, '/dist/xtend.maraca.services.json');
    const serverSourceAliasResponse = symlinkAvailable
      ? await request(app.origin, '/site/server-source-alias.ts')
      : null;
    assert.equal(traversalResponse.statusCode, 403);
    assert.equal(serverBundleResponse.statusCode, 403);
    assert.equal(serverSourceResponse.statusCode, 403);
    assert.equal(browserSourceMapResponse.statusCode, 403);
    assert.equal(buildReportResponse.statusCode, 403);
    assert.equal(sizeReportResponse.statusCode, 403);
    assert.equal(declarationResponse.statusCode, 403);
    assert.equal(publicManifestResponse.statusCode, 200);
    if (serverSourceAliasResponse) assert.equal(serverSourceAliasResponse.statusCode, 403);
    context.pass('static host blocks traversal, Node bundles, source maps, build-only metadata, server source and supported symlink aliases beneath public roots');

    const oversizedResponse = await request(app.origin, '/api/xtend/services/test.echo', {
      method: 'POST',
      body: wireRequest({ value: 'x'.repeat(800) })
    });
    assert.equal(oversizedResponse.statusCode, 413);
    assert.equal(JSON.parse(oversizedResponse.body).error.code, 'xtend.maraca.app-service.payload_too_large');
    context.pass('AppService body limits fail closed with a redacted wire error');

    signalTarget.emit('SIGTERM');
    await app.whenClosed();
    assert.equal(app.status, 'closed');
    assert.equal(signalTarget.listenerCount('SIGINT'), 0);
    assert.equal(signalTarget.listenerCount('SIGTERM'), 0);
    context.pass('SIGTERM closes HTTP, disposes AppServices and removes process listeners');
    app = null;

    const occupiedServer = http.createServer();
    await new Promise((resolve, reject) => {
      occupiedServer.once('error', reject);
      occupiedServer.listen(0, '127.0.0.1', resolve);
    });
    try {
      const occupiedAddress = occupiedServer.address();
      const failedApp = createNodeAppHost({
        rootDir,
        services,
        host: '127.0.0.1',
        port: occupiedAddress.port
      });
      const listenError = await failedApp.listen().then(() => null, (error) => error);
      await failedApp.whenClosed();
      assert.equal(listenError && listenError.code, 'EADDRINUSE');
      assert.equal(failedApp.status, 'failed');
      assert.equal(failedApp.serviceHost.disposed, true);
      context.pass('bind failures reject deterministically and dispose the AppService host without leaking lifecycle work');
    } finally {
      await new Promise((resolve) => occupiedServer.close(resolve));
    }
  } catch (error) {
    context.fail(error && error.stack || String(error));
  } finally {
    if (app) await app.close('suite-cleanup').catch(() => {});
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
  return context.result({
    report: {
      schema: 'xtend.maraca.node-app-host-suite-report.v1',
      hostSchema: MARACA_NODE_APP_HOST_SCHEMA,
      startupSchema: MARACA_NODE_APP_HOST_STARTUP_SCHEMA
    }
  });
}

function printMaracaNodeAppHostReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Node App Host passed.',
    failureTitle: 'XTend Maraca Node App Host failed:'
  });
}

if (require.main === module) {
  runMaracaNodeAppHostSuite().then((result) => {
    printMaracaNodeAppHostReport(result);
    process.exitCode = result.ok ? 0 : 1;
  });
}

module.exports = {
  printMaracaNodeAppHostReport,
  runMaracaNodeAppHostSuite
};
