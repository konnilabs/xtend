'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const { spawnSync } = require('node:child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  defineServerServices,
  service
} = require('../../xtend-maraca/app-services');
const {
  createNodeAppServiceHost
} = require('../../xtend-maraca/node-app-service-host');

const PHP_ADAPTER_PATH = 'xtendrmt/rmt-php-app-service-adapter.php';
const PHP_FIXTURE_PATH = 'tests/rmt-language/fixtures/rmt-php-app-services.php';
const APP_SERVICE_MANIFEST_SCHEMA = 'xtend.maraca.app-services-manifest.v1';
const TERMINAL_TYPES = new Set(['complete', 'error', 'cancelled']);
const BODY_LIMIT = 512;
const SECRET = 'database password=top-secret invoke failure';

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

function createManifest() {
  const definition = (id, kind) => ({
    id,
    dataSource: id,
    mode: kind === 'stream' ? 'stream' : 'invoke',
    kind,
    target: 'server',
    concurrency: kind === 'command' ? 'serial' : 'latest',
    contract: null,
    actions: [],
    implementations: { browser: true, node: true, php: true }
  });
  const base = {
    schema: APP_SERVICE_MANIFEST_SCHEMA,
    sourceDocument: { id: 'fixture.cross-runtime.services', namespace: 'fixture' },
    targets: ['browser', 'node', 'php'],
    transport: {
      schema: 'xtend.maraca.app-service-transport-config.v1',
      kind: 'http-ndjson',
      basePath: '/api/xtend/services',
      credentials: 'same-origin'
    },
    services: [
      definition('fixture.fail', 'command'),
      definition('fixture.invoke', 'query'),
      definition('fixture.stream', 'stream'),
      definition('fixture.stream.cancel', 'stream'),
      definition('fixture.stream.fail', 'stream')
    ]
  };
  return { ...base, fingerprint: fingerprint(base) };
}

function wireRequest(id, serviceId, kind, input = null) {
  return {
    schema: MARACA_APP_SERVICE_REQUEST_SCHEMA,
    serviceId,
    kind,
    target: 'server',
    invocationId: `parity-invocation:${id}`,
    correlationId: `parity-correlation:${id}`,
    input
  };
}

function createFixtureMatrix() {
  const json = [
    {
      id: 'invoke-success',
      request: wireRequest('invoke-success', 'fixture.invoke', 'query', { query: 'cross-runtime' }),
      expectedStatus: 200,
      expectedErrorCode: null
    },
    {
      id: 'invoke-handler-failure',
      request: wireRequest('invoke-handler-failure', 'fixture.fail', 'command', { secret: 'must-not-leak' }),
      expectedStatus: 500,
      expectedErrorCode: 'xtend.maraca.app-service.internal_error'
    },
    {
      id: 'unknown-service',
      request: wireRequest('unknown-service', 'fixture.unknown', 'query'),
      expectedStatus: 404,
      expectedErrorCode: 'xtend.maraca.app-service.unknown'
    },
    {
      id: 'mode-mismatch',
      request: wireRequest('mode-mismatch', 'fixture.invoke', 'stream'),
      expectedStatus: 400,
      expectedErrorCode: 'xtend.maraca.app-service.mode_mismatch'
    },
    {
      id: 'target-mismatch',
      request: { ...wireRequest('target-mismatch', 'fixture.invoke', 'query'), target: 'local' },
      expectedStatus: 400,
      expectedErrorCode: 'xtend.maraca.app-service.target_mismatch'
    },
    {
      id: 'kind-missing',
      request: { ...wireRequest('kind-missing', 'fixture.invoke', 'query'), kind: '' },
      expectedStatus: 400,
      expectedErrorCode: 'xtend.maraca.app-service.mode_mismatch'
    },
    {
      id: 'invocation-id-invalid',
      request: { ...wireRequest('invocation-id-invalid', 'fixture.invoke', 'query'), invocationId: 'invalid id with spaces' },
      expectedStatus: 400,
      expectedErrorCode: 'xtend.maraca.app-service.invalid_request'
    },
    {
      id: 'schema-mismatch',
      request: { ...wireRequest('schema-mismatch', 'fixture.invoke', 'query'), schema: 'xtend.maraca.app-service-request.invalid' },
      expectedStatus: 400,
      expectedErrorCode: 'xtend.maraca.app-service.invalid_request'
    },
    {
      id: 'invalid-json',
      rawBody: '{not-json',
      routeServiceId: 'fixture.invoke',
      expectedStatus: 400,
      expectedErrorCode: 'xtend.maraca.app-service.invalid_request'
    },
    {
      id: 'payload-too-large',
      request: wireRequest('payload-too-large', 'fixture.invoke', 'query', { value: 'x'.repeat(BODY_LIMIT * 4) }),
      expectedStatus: 413,
      expectedErrorCode: 'xtend.maraca.app-service.payload_too_large'
    }
  ];
  const streams = [
    {
      id: 'stream-success',
      request: wireRequest('stream-success', 'fixture.stream', 'stream', { topic: 'cross-runtime' }),
      expectedTypes: ['start', 'delta', 'delta', 'tool-call', 'tool-result', 'complete'],
      expectedErrorCode: null
    },
    {
      id: 'stream-failure',
      request: wireRequest('stream-failure', 'fixture.stream.fail', 'stream'),
      expectedTypes: ['start', 'delta', 'error'],
      expectedErrorCode: 'xtend.maraca.app-service.stream_failed'
    },
    {
      id: 'stream-cancelled',
      request: wireRequest('stream-cancelled', 'fixture.stream.cancel', 'stream'),
      expectedTypes: ['start', 'delta', 'cancelled'],
      expectedErrorCode: null
    }
  ];
  const disposed = {
    id: 'disposed-host',
    request: wireRequest('disposed-host', 'fixture.invoke', 'query'),
    expectedStatus: 503,
    expectedErrorCode: 'xtend.maraca.app-service.disposed'
  };
  return { json, streams, disposed };
}

function createNodeServices() {
  return defineServerServices({
    'fixture.invoke': service({
      kind: 'query',
      target: 'server',
      invoke(input, context) {
        return {
          accepted: true,
          input,
          serviceId: context.serviceId,
          invocationId: context.invocationId,
          correlationId: context.correlationId
        };
      }
    }),
    'fixture.fail': service({
      kind: 'command',
      target: 'server',
      invoke() {
        throw new Error(SECRET);
      }
    }),
    'fixture.stream': service({
      kind: 'stream',
      target: 'server',
      async *stream(input) {
        yield { id: 'fixture-delta-1', sequence: 7, type: 'delta', value: { index: 1 } };
        yield { id: 'fixture-delta-1', sequence: 8, type: 'delta', value: { index: 999 } };
        yield { id: 'fixture-delta-2', sequence: 7, type: 'delta', value: { index: 998 } };
        yield { id: 'fixture-delta-2', sequence: 9, type: 'delta', value: { index: 2 } };
        yield { id: 'fixture-tool-call', sequence: 10, type: 'tool-call', toolCall: { name: 'lookup', arguments: { id: 7 } } };
        yield { id: 'fixture-tool-result', sequence: 11, type: 'tool-result', toolResult: { ok: true, value: 'Ada' } };
        yield { id: 'fixture-late-sequence', sequence: 10, type: 'delta', value: { index: 997 } };
        yield { type: 'complete', value: { count: 2, input } };
        yield { type: 'error', error: { message: 'must never be emitted' } };
      }
    }),
    'fixture.stream.fail': service({
      kind: 'stream',
      target: 'server',
      async *stream() {
        yield { type: 'delta', value: { visible: true } };
        throw new Error('token=top-secret stream failure');
      }
    }),
    'fixture.stream.cancel': service({
      kind: 'stream',
      target: 'server',
      async *stream() {
        yield { type: 'delta', value: { index: 1 } };
        yield { type: 'cancelled', value: 'fixture-cancelled' };
        yield { type: 'complete', value: 'must-never-be-emitted' };
      }
    })
  });
}

class MemoryNodeResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.headersSent = false;
    this.writableEnded = false;
    this.chunks = [];
  }

  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = String(value);
  }

  write(chunk) {
    this.headersSent = true;
    this.chunks.push(String(chunk));
    return true;
  }

  end(chunk = '') {
    if (chunk) this.chunks.push(String(chunk));
    this.headersSent = true;
    this.writableEnded = true;
    this.emit('finish');
  }

  body() {
    return this.chunks.join('');
  }
}

async function collectAsync(iterable) {
  const values = [];
  for await (const value of iterable) values.push(value);
  return values;
}

function mediaType(headers) {
  const entries = Object.entries(headers || {});
  const contentType = entries.find(([name]) => name.toLowerCase() === 'content-type');
  return contentType ? String(contentType[1]).split(';')[0].trim().toLowerCase() : null;
}

function parseNdjson(value) {
  return String(value || '').split(/\r?\n/u).filter((line) => line.trim()).map((line) => JSON.parse(line));
}

function normalizeJsonEnvelope(value) {
  const body = typeof value === 'string' ? JSON.parse(value) : value;
  return {
    schema: body && body.schema || null,
    ok: body && body.ok === true,
    value: body && body.ok === true ? body.value : null,
    errorCode: body && body.error && body.error.code || null,
    errorMessage: body && body.error && /internal_error|stream_failed/u.test(String(body.error.code || ''))
      ? body.error.message
      : null
  };
}

function normalizeStreamFrame(frame) {
  return {
    schema: frame.schema || null,
    id: frame.id || null,
    streamId: frame.streamId || null,
    serviceId: frame.serviceId || null,
    invocationId: frame.invocationId || null,
    correlationId: frame.correlationId || null,
    sequence: frame.sequence,
    type: frame.type,
    value: Object.prototype.hasOwnProperty.call(frame, 'value') ? frame.value : null,
    delta: Object.prototype.hasOwnProperty.call(frame, 'delta') ? frame.delta : null,
    toolCall: Object.prototype.hasOwnProperty.call(frame, 'toolCall') ? frame.toolCall : null,
    toolResult: Object.prototype.hasOwnProperty.call(frame, 'toolResult') ? frame.toolResult : null,
    errorCode: frame.error && frame.error.code || null,
    errorMessage: frame.error && frame.error.message || null
  };
}

function normalizeHttpJson(record) {
  return {
    status: record.status,
    contentType: mediaType(record.headers),
    body: normalizeJsonEnvelope(record.body)
  };
}

function normalizeHttpStream(record) {
  return {
    status: record.status,
    contentType: mediaType(record.headers),
    frames: parseNdjson(record.body).map(normalizeStreamFrame)
  };
}

function terminalFrames(frames) {
  return frames.filter((frame) => TERMINAL_TYPES.has(frame.type));
}

async function runNodeHttp(host, operation) {
  const body = Object.prototype.hasOwnProperty.call(operation, 'rawBody')
    ? operation.rawBody
    : JSON.stringify(operation.request);
  const serviceId = operation.routeServiceId || operation.request && operation.request.serviceId || 'fixture.invoke';
  const request = Readable.from([body]);
  request.method = 'POST';
  request.url = `/api/xtend/services/${encodeURIComponent(serviceId)}`;
  const response = new MemoryNodeResponse();
  const handled = await host.handle(request, response);
  assert.equal(handled, true);
  return { status: response.statusCode, headers: response.headers, body: response.body() };
}

function createPhpHarness(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  const harnessPath = path.join(os.tmpdir(), `xtend-app-services-parity-${process.pid}-${Date.now()}.php`);
  const source = `<?php
declare(strict_types=1);

$payload = json_decode(base64_decode('${encoded}'), true, 64, JSON_THROW_ON_ERROR);
require $payload['adapterPath'];
$registry = require $payload['fixturePath'];

function xtend_parity_collect_body($body): string {
    if (is_string($body)) return $body;
    $result = '';
    foreach ($body as $chunk) $result .= (string) $chunk;
    return $result;
}

function xtend_parity_http_record(array $response): array {
    return [
        'status' => $response['status'],
        'headers' => $response['headers'],
        'body' => xtend_parity_collect_body($response['body']),
    ];
}

$adapter = createRmtPhpAppServiceAdapter($payload['manifest'], $registry, [
    'detectDisconnect' => false,
    'maxRequestBytes' => $payload['bodyLimit'],
]);

$json = [];
foreach ($payload['matrix']['json'] as $operation) {
    $body = array_key_exists('rawBody', $operation)
        ? $operation['rawBody']
        : json_encode($operation['request'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $json[$operation['id']] = xtend_parity_http_record($adapter->handleHttpRequest($body, ['Accept' => 'application/json']));
}

$streams = [];
$directStreams = [];
foreach ($payload['matrix']['streams'] as $operation) {
    $body = json_encode($operation['request'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $streams[$operation['id']] = xtend_parity_http_record($adapter->handleHttpRequest($body, ['Accept' => 'application/x-ndjson']));
    $directStreams[$operation['id']] = iterator_to_array($adapter->handleStreamRequest($operation['request']));
}

$directInvoke = $adapter->handleInvokeRequest($payload['directInvoke']);
$disposedAdapter = createRmtPhpAppServiceAdapter($payload['manifest'], $registry, ['detectDisconnect' => false]);
$disposedAdapter->dispose();
$disposedBody = json_encode($payload['matrix']['disposed']['request'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
$disposed = xtend_parity_http_record($disposedAdapter->handleHttpRequest($disposedBody, ['Accept' => 'application/json']));
$adapter->dispose();

echo json_encode([
    'json' => $json,
    'streams' => $streams,
    'directInvoke' => $directInvoke,
    'directStreams' => $directStreams,
    'disposed' => $disposed,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
`;
  fs.writeFileSync(harnessPath, source, 'utf8');
  return harnessPath;
}

function runPhpFixture(rootDir, payload) {
  const harnessPath = createPhpHarness(payload);
  try {
    const result = spawnSync('php', [harnessPath], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `PHP parity harness exited ${result.status}`);
    }
    return JSON.parse(result.stdout);
  } finally {
    fs.rmSync(harnessPath, { force: true });
  }
}

function assertDeepParity(context, actual, expected, message) {
  try {
    assert.deepEqual(actual, expected);
    context.pass(message);
  } catch (error) {
    context.fail(`${message}: ${error.message}`);
  }
}

async function runMaracaAppServicesCrossRuntimeParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-app-services-cross-runtime',
    label: 'XTend Maraca AppServices Node/PHP Cross-Runtime Parity'
  });
  const adapterPath = resolveRepoPath(PHP_ADAPTER_PATH, rootDir);
  const fixturePath = resolveRepoPath(PHP_FIXTURE_PATH, rootDir);
  const matrix = createFixtureMatrix();
  const manifest = createManifest();

  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.maracaAppServices;
  const gateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;
  context.assert(runner.hasSuite("maraca-app-services-cross-runtime"), 'central runner registers the cross-runtime suite');
  context.assert(packageManifest.scripts['test:maraca-app-services-cross-runtime'] === 'node scripts/run_xtend_tests.js maraca-app-services-cross-runtime', 'root package exposes the focused cross-runtime script');
  context.assert(packageManifest.scripts['test:maraca-app-services'].includes('maraca-app-services-cross-runtime'), 'AppServices aggregate includes cross-runtime parity');
  context.assert(packageManifest.scripts['test:pr'].includes('maraca-app-services-cross-runtime') && packageManifest.scripts['test:release:full'].includes('maraca-app-services-cross-runtime'), 'PR and release scripts execute cross-runtime parity');
  context.assert(gateMatrix.prFastGate.suites.includes('maraca-app-services-cross-runtime') && gateMatrix.fullReleaseGate.suites.includes('maraca-app-services-cross-runtime'), 'CI matrices require cross-runtime parity');
  context.assert(metadata && metadata.crossRuntimeSuiteId === 'maraca-app-services-cross-runtime' && metadata.workpackages.includes('XMS-06'), 'AppServices metadata owns XMS-06 cross-runtime parity');
  context.assert(require("../utils/test-catalog").workflowHasScript(defaultWorkflow, "test:maraca-app-services-cross-runtime:report") && require("../utils/test-catalog").workflowHasScript(nightlyWorkflow, "test:maraca-app-services-cross-runtime:report"), 'default and nightly workflows emit the dedicated parity report');

  context.assert(fs.existsSync(adapterPath), 'uses the packaged RmtPhpAppServiceAdapter implementation');
  context.assert(fs.existsSync(fixturePath), 'uses the existing PHP AppService callable fixture');
  const phpSyntax = spawnSync('php', ['-l', adapterPath], { cwd: rootDir, encoding: 'utf8' });
  context.assert(phpSyntax.status === 0, `PHP adapter syntax passes${phpSyntax.status === 0 ? '' : ` (${phpSyntax.stderr || phpSyntax.stdout})`}`);

  let php;
  try {
    php = runPhpFixture(rootDir, {
      adapterPath,
      fixturePath,
      manifest,
      bodyLimit: BODY_LIMIT,
      matrix,
      directInvoke: matrix.json[0].request
    });
  } catch (error) {
    context.fail(`PHP parity fixture executes through RmtPhpAppServiceAdapter: ${error && error.stack || error}`);
    return context.result({ runtimePair: ['node', 'php'] });
  }

  const host = createNodeAppServiceHost({
    services: createNodeServices(),
    bodyLimit: BODY_LIMIT
  });
  try {
    const directInvoke = await host.handleEnvelope(matrix.json[0].request);
    assertDeepParity(
      context,
      normalizeJsonEnvelope(directInvoke),
      normalizeJsonEnvelope(php.directInvoke),
      'direct invoke envelopes are identical after runtime-id normalization'
    );
    context.assert(
      directInvoke.invocationId === matrix.json[0].request.invocationId
        && directInvoke.correlationId === matrix.json[0].request.correlationId
        && directInvoke.value.invocationId === matrix.json[0].request.invocationId
        && directInvoke.value.correlationId === matrix.json[0].request.correlationId,
      'direct Node/PHP invoke fixtures preserve client identity through the handler context'
    );

    for (const operation of matrix.json) {
      const nodeRecord = await runNodeHttp(host, operation);
      const phpRecord = php.json[operation.id];
      const normalizedNode = normalizeHttpJson(nodeRecord);
      const normalizedPhp = normalizeHttpJson(phpRecord);
      assertDeepParity(context, normalizedNode, normalizedPhp, `${operation.id} JSON/status parity`);
      context.assert(normalizedNode.status === operation.expectedStatus, `${operation.id} uses HTTP ${operation.expectedStatus} in both runtimes`);
      context.assert(normalizedNode.body.schema === MARACA_APP_SERVICE_RESPONSE_SCHEMA, `${operation.id} uses the versioned response schema`);
      context.assert(normalizedNode.body.errorCode === operation.expectedErrorCode, `${operation.id} exposes the expected stable error code`);
      if (operation.request && !['payload-too-large'].includes(operation.id)) {
        const nodeBody = JSON.parse(nodeRecord.body);
        const phpBody = JSON.parse(phpRecord.body);
        context.assert(
          nodeBody.serviceId === phpBody.serviceId
            && nodeBody.invocationId === phpBody.invocationId
            && nodeBody.correlationId === phpBody.correlationId,
          `${operation.id} preserves the same versioned request identity`
        );
      }
    }

    for (const operation of matrix.streams) {
      const nodeDirect = await collectAsync(host.streamEnvelope(operation.request));
      const phpDirect = php.directStreams[operation.id];
      assertDeepParity(
        context,
        nodeDirect.map(normalizeStreamFrame),
        phpDirect.map(normalizeStreamFrame),
        `${operation.id} direct stream frame parity`
      );

      const nodeRecord = await runNodeHttp(host, operation);
      const phpRecord = php.streams[operation.id];
      const normalizedNode = normalizeHttpStream(nodeRecord);
      const normalizedPhp = normalizeHttpStream(phpRecord);
      assertDeepParity(context, normalizedNode, normalizedPhp, `${operation.id} NDJSON/status parity`);
      const frames = normalizedNode.frames;
      context.assert(normalizedNode.status === 200 && normalizedNode.contentType === 'application/x-ndjson', `${operation.id} uses HTTP 200 NDJSON in both runtimes`);
      context.assert(frames.every((frame) => frame.schema === MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA), `${operation.id} uses the versioned stream-frame schema`);
      context.assert(frames.map((frame) => frame.type).join('|') === operation.expectedTypes.join('|'), `${operation.id} has the expected lifecycle sequence`);
      context.assert(frames.every((frame, index) => frame.sequence === index + 1), `${operation.id} has a monotone one-based output sequence`);
      context.assert(terminalFrames(frames).length === 1, `${operation.id} emits exactly one terminal frame`);
      context.assert((frames.at(-1).errorCode || null) === operation.expectedErrorCode, `${operation.id} terminal error code is runtime-identical`);
      context.assert(
        frames.every((frame) => frame.streamId === operation.request.invocationId
          && frame.invocationId === operation.request.invocationId
          && frame.correlationId === operation.request.correlationId),
        `${operation.id} preserves client identity on every stream frame`
      );
      if (operation.id === 'stream-success') {
        context.assert(
          !JSON.stringify(frames).includes('997')
            && frames.some((frame) => frame.type === 'tool-call' && frame.toolCall.name === 'lookup')
            && frames.some((frame) => frame.type === 'tool-result' && frame.toolResult.value === 'Ada'),
          'stream-success suppresses regressing input sequences and preserves tool fields in both runtimes'
        );
      }
    }

    const disposedHost = createNodeAppServiceHost({ services: createNodeServices() });
    disposedHost.dispose();
    const nodeDisposed = await runNodeHttp(disposedHost, matrix.disposed);
    const normalizedNodeDisposed = normalizeHttpJson(nodeDisposed);
    const normalizedPhpDisposed = normalizeHttpJson(php.disposed);
    assertDeepParity(context, normalizedNodeDisposed, normalizedPhpDisposed, 'disposed host JSON/status parity');
    context.assert(normalizedNodeDisposed.status === matrix.disposed.expectedStatus, 'disposed adapters use HTTP 503');
    context.assert(normalizedNodeDisposed.body.errorCode === matrix.disposed.expectedErrorCode, 'disposed adapters expose the stable disposed code');

    const serializedEvidence = JSON.stringify({ php, matrix });
    context.assert(!serializedEvidence.includes('database password=') && !serializedEvidence.includes('token=top-secret'), 'both wire boundaries redact fixture secrets');
  } finally {
    host.dispose();
  }

  return context.result({
    runtimePair: ['node', 'php'],
    invokeFixtureCount: matrix.json.length + 1,
    streamFixtureCount: matrix.streams.length
  });
}

function printMaracaAppServicesCrossRuntimeParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca AppServices Node/PHP Cross-Runtime-Parität erfolgreich.',
    failureTitle: 'XTend Maraca AppServices Node/PHP Cross-Runtime-Parität fehlgeschlagen:'
  });
}

if (require.main === module) {
  runMaracaAppServicesCrossRuntimeParitySuite().then((result) => {
    printMaracaAppServicesCrossRuntimeParityReport(result);
    process.exitCode = result.ok ? 0 : 1;
  }).catch((error) => {
    process.stderr.write(`${error && error.stack || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  printMaracaAppServicesCrossRuntimeParityReport,
  runMaracaAppServicesCrossRuntimeParitySuite
};
