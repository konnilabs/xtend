const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
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

const RMT_PHP_APP_SERVICE_ADAPTER_PATH = 'xtendrmt/rmt-php-app-service-adapter.php';
const RMT_PHP_APP_SERVICE_FIXTURE_PATH = 'tests/rmt-language/fixtures/rmt-php-app-services.php';
const RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA = 'xtend.rmt.php-app-service-adapter.v1';
const RMT_PHP_APP_SERVICE_HTTP_RESPONSE_SCHEMA = 'xtend.rmt.php-app-service-http-response.v1';
const MARACA_APP_SERVICE_MANIFEST_SCHEMA = 'xtend.maraca.app-services-manifest.v1';
const MARACA_APP_SERVICE_REQUEST_SCHEMA = 'xtend.maraca.app-service-request.v1';
const MARACA_APP_SERVICE_RESPONSE_SCHEMA = 'xtend.maraca.app-service-response.v1';
const MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA = 'xtend.maraca.app-service-stream-frame.v1';
const RMT_PHP_APP_SERVICE_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-php-app-service-adapter --json';
const RMT_PHP_APP_SERVICE_PACKAGE_SCRIPT = 'npm run test:rmt-php-app-service-adapter';
const RMT_PHP_APP_SERVICE_WORKSPACE_EXPORT = './php-app-service-adapter.php';

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
  const service = (id, kind) => ({
    id,
    dataSource: id,
    mode: kind === 'stream' ? 'stream' : 'invoke',
    kind,
    target: 'server',
    concurrency: kind === 'command' ? 'serial' : 'latest',
    contract: null,
    actions: [],
    implementations: { browser: true, node: false, php: true }
  });
  const base = {
    schema: MARACA_APP_SERVICE_MANIFEST_SCHEMA,
    sourceDocument: { id: 'fixture.php.services', namespace: 'fixture' },
    targets: ['browser', 'php'],
    transport: {
      schema: 'xtend.maraca.app-service-transport-config.v1',
      kind: 'http-ndjson',
      basePath: '/api/xtend/services',
      credentials: 'same-origin'
    },
    services: [
      service('fixture.fail', 'command'),
      service('fixture.invoke', 'query'),
      service('fixture.stream', 'stream'),
      service('fixture.stream.cancel', 'stream'),
      service('fixture.stream.fail', 'stream')
    ]
  };
  return { ...base, fingerprint: fingerprint(base) };
}

function syntaxCheckPhp(relativePath, rootDir) {
  const result = spawnSync('php', ['-l', resolveRepoPath(relativePath, rootDir)], { encoding: 'utf8' });
  return {
    ok: result.status === 0,
    message: result.stderr.trim() || result.stdout.trim()
  };
}

function writePhpHarness(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  const filePath = path.join(os.tmpdir(), `xtend-rmt-php-app-services-${process.pid}-${Date.now()}.php`);
  const source = `<?php
declare(strict_types=1);

$payload = json_decode(base64_decode('${encoded}'), true);
if (!is_array($payload)) {
    fwrite(STDERR, 'payload decode failed');
    exit(1);
}

require $payload['adapterPath'];
$registry = require $payload['fixturePath'];
$observedErrors = [];
$cleanupErrors = [];
$adapter = createRmtPhpAppServiceAdapter($payload['manifest'], $registry, [
    'detectDisconnect' => false,
    'onError' => static function (Throwable $error, array $context) use (&$observedErrors): void {
        $observedErrors[] = ['message' => $error->getMessage(), 'serviceId' => $context['serviceId'] ?? null];
    },
    'onCleanupError' => static function (Throwable $error, array $context) use (&$cleanupErrors): void {
        $cleanupErrors[] = ['message' => $error->getMessage(), 'serviceId' => $context['serviceId'] ?? null];
    },
]);

function xtend_php_app_service_request(string $serviceId, string $kind, $input = null, ?string $suffix = null): array {
    $token = $suffix ?? str_replace('.', '-', $serviceId);
    return [
        'schema' => RMT_PHP_APP_SERVICE_REQUEST_SCHEMA,
        'serviceId' => $serviceId,
        'kind' => $kind,
        'target' => 'server',
        'invocationId' => 'fixture-invocation:' . $token,
        'correlationId' => 'fixture-correlation:' . $token,
        'input' => $input,
    ];
}

function xtend_php_app_service_collect_body($body): string {
    if (is_string($body)) return $body;
    $output = '';
    foreach ($body as $chunk) $output .= (string) $chunk;
    return $output;
}

$directInvoke = $adapter->invoke('fixture.invoke', ['query' => 'direct'], [
    'invocationId' => 'fixture-invocation:direct',
    'correlationId' => 'fixture-correlation:direct',
]);
$invokeRequest = $adapter->handleInvokeRequest(xtend_php_app_service_request(
    'fixture.invoke',
    'query',
    ['query' => 'request'],
    'request'
));
$invokeHttp = $adapter->handleHttpRequest(json_encode(xtend_php_app_service_request(
    'fixture.invoke',
    'query',
    ['query' => 'http'],
    'http'
)), ['Accept' => 'application/json']);
$invokeHttpBody = json_decode(xtend_php_app_service_collect_body($invokeHttp['body']), true);

$failureHttp = $adapter->handleHttpRequest(json_encode(xtend_php_app_service_request(
    'fixture.fail',
    'command',
    ['secret' => 'not-reflected'],
    'failure'
)));
$failureHttpBody = json_decode(xtend_php_app_service_collect_body($failureHttp['body']), true);

$unknownHttp = $adapter->handleHttpRequest(json_encode(xtend_php_app_service_request(
    'fixture.unknown',
    'query',
    null,
    'unknown'
)));
$unknownHttpBody = json_decode(xtend_php_app_service_collect_body($unknownHttp['body']), true);

$modeMismatchHttp = $adapter->handleHttpRequest(json_encode(xtend_php_app_service_request(
    'fixture.invoke',
    'stream',
    null,
    'mode'
)));
$modeMismatchBody = json_decode(xtend_php_app_service_collect_body($modeMismatchHttp['body']), true);

$invalidJsonHttp = $adapter->handleHttpRequest('{not-json');
$invalidJsonBody = json_decode(xtend_php_app_service_collect_body($invalidJsonHttp['body']), true);
$smallLimitAdapter = createRmtPhpAppServiceAdapter($payload['manifest'], $registry, [
    'detectDisconnect' => false,
    'maxRequestBytes' => 16,
]);
$largeRequestHttp = $smallLimitAdapter->handleHttpRequest(json_encode(xtend_php_app_service_request(
    'fixture.invoke',
    'query',
    ['value' => str_repeat('x', 32)],
    'large'
)));
$largeRequestBody = json_decode(xtend_php_app_service_collect_body($largeRequestHttp['body']), true);
$smallLimitAdapter->dispose();

$streamFrames = iterator_to_array($adapter->stream('fixture.stream', ['topic' => 'direct'], [
    'invocationId' => 'fixture-invocation:stream-direct',
    'correlationId' => 'fixture-correlation:stream-direct',
]));
$streamHttp = $adapter->handleHttpRequest(json_encode(xtend_php_app_service_request(
    'fixture.stream',
    'stream',
    ['topic' => 'http'],
    'stream-http'
)), ['Accept' => 'application/x-ndjson']);
$streamHttpBody = xtend_php_app_service_collect_body($streamHttp['body']);

$streamFailureFrames = iterator_to_array($adapter->stream('fixture.stream.fail', null, [
    'invocationId' => 'fixture-invocation:stream-fail',
    'correlationId' => 'fixture-correlation:stream-fail',
]));
$cancelChecks = 0;
$streamCancelFrames = iterator_to_array($adapter->stream('fixture.stream.cancel', null, [
    'invocationId' => 'fixture-invocation:stream-cancel',
    'correlationId' => 'fixture-correlation:stream-cancel',
    'cancelled' => static function () use (&$cancelChecks): bool {
        $cancelChecks += 1;
        return $cancelChecks > 1;
    },
]));

function xtend_php_app_service_constructor_error(callable $factory): ?string {
    try {
        $factory();
        return null;
    } catch (RmtPhpAppServiceException $error) {
        return $error->serviceCode;
    }
}

$badSchema = $payload['manifest'];
$badSchema['schema'] = 'xtend.maraca.app-services-manifest.' . 'v0';
$badSchemaCode = xtend_php_app_service_constructor_error(static fn () => createRmtPhpAppServiceAdapter($badSchema, $registry));
$badFingerprint = $payload['manifest'];
$badFingerprint['services'][0]['kind'] = 'query';
$badFingerprintCode = xtend_php_app_service_constructor_error(static fn () => createRmtPhpAppServiceAdapter($badFingerprint, $registry));
$missingRegistry = $registry;
unset($missingRegistry['fixture.invoke']);
$missingRegistryCode = xtend_php_app_service_constructor_error(static fn () => createRmtPhpAppServiceAdapter($payload['manifest'], $missingRegistry));
$extraRegistry = $registry;
$extraRegistry['fixture.extra'] = static fn () => null;
$extraRegistryCode = xtend_php_app_service_constructor_error(static fn () => createRmtPhpAppServiceAdapter($payload['manifest'], $extraRegistry));
$invalidIdCode = xtend_php_app_service_constructor_error(static fn () => createRmtPhpAppServiceAdapter($payload['invalidIdManifest'], $registry));

$disposeScopeAdapter = createRmtPhpAppServiceAdapter($payload['manifest'], $registry, ['detectDisconnect' => false]);
$pendingStream = $disposeScopeAdapter->stream('fixture.stream', null, [
    'invocationId' => 'fixture-invocation:dispose-scope',
    'correlationId' => 'fixture-correlation:dispose-scope',
]);
$pendingStream->rewind();
$pendingStream->next();
$activeDuringDispose = $disposeScopeAdapter->listActiveRequests();
$disposeScopeAdapter->dispose();
$activeAfterScopeDispose = $disposeScopeAdapter->listActiveRequests();
unset($pendingStream);
gc_collect_cycles();

$activeBeforeDispose = $adapter->listActiveRequests();
$serviceIds = $adapter->listServices();
$manifestFingerprint = $adapter->getManifest()['fingerprint'] ?? null;
$firstDispose = $adapter->dispose();
$secondDispose = $adapter->dispose();
$disposedCode = null;
try {
    $adapter->invoke('fixture.invoke', null);
} catch (RmtPhpAppServiceException $error) {
    $disposedCode = $error->serviceCode;
}

echo json_encode([
    'directInvoke' => $directInvoke,
    'invokeRequest' => $invokeRequest,
    'invokeHttp' => ['schema' => $invokeHttp['schema'], 'status' => $invokeHttp['status'], 'headers' => $invokeHttp['headers'], 'body' => $invokeHttpBody],
    'failureHttp' => ['status' => $failureHttp['status'], 'body' => $failureHttpBody],
    'unknownHttp' => ['status' => $unknownHttp['status'], 'body' => $unknownHttpBody],
    'modeMismatchHttp' => ['status' => $modeMismatchHttp['status'], 'body' => $modeMismatchBody],
    'invalidJsonHttp' => ['status' => $invalidJsonHttp['status'], 'body' => $invalidJsonBody],
    'largeRequestHttp' => ['status' => $largeRequestHttp['status'], 'body' => $largeRequestBody],
    'streamFrames' => $streamFrames,
    'streamHttp' => ['schema' => $streamHttp['schema'], 'status' => $streamHttp['status'], 'headers' => $streamHttp['headers'], 'body' => $streamHttpBody],
    'streamFailureFrames' => $streamFailureFrames,
    'streamCancelFrames' => $streamCancelFrames,
    'cancelChecks' => $cancelChecks,
    'cleanup' => $GLOBALS['xtendRmtPhpAppServiceFixtureCleanup'],
    'observedErrors' => $observedErrors,
    'cleanupErrors' => $cleanupErrors,
    'validation' => [
        'badSchema' => $badSchemaCode,
        'badFingerprint' => $badFingerprintCode,
        'missingRegistry' => $missingRegistryCode,
        'extraRegistry' => $extraRegistryCode,
        'invalidId' => $invalidIdCode,
    ],
    'serviceIds' => $serviceIds,
    'manifestFingerprint' => $manifestFingerprint,
    'activeBeforeDispose' => $activeBeforeDispose,
    'activeScopeDispose' => ['during' => $activeDuringDispose, 'after' => $activeAfterScopeDispose],
    'dispose' => ['first' => $firstDispose, 'second' => $secondDispose, 'invokeCode' => $disposedCode],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
`;
  fs.writeFileSync(filePath, source);
  return filePath;
}

function runPhpHarness(rootDir, payload) {
  const harnessPath = writePhpHarness(payload);
  try {
    const result = spawnSync('php', [harnessPath], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 8
    });
    if (result.status !== 0) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `PHP harness exited ${result.status}`);
    }
    return JSON.parse(result.stdout);
  } finally {
    try {
      fs.unlinkSync(harnessPath);
    } catch (_) {
      // Temporary harness cleanup must not hide the actual result.
    }
  }
}

function parseNdjson(value) {
  return String(value || '').split(/\r?\n/u).filter((line) => line.trim()).map((line) => JSON.parse(line));
}

function terminalFrames(frames) {
  return frames.filter((frame) => ['complete', 'error', 'cancelled'].includes(frame.type));
}

function runRmtPhpAppServiceAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-php-app-service-adapter',
    label: 'RMT PHP AppService Adapter'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const workspaceManifest = readJson('xtendrmt/package.json', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const adapterSource = readText(RMT_PHP_APP_SERVICE_ADAPTER_PATH, rootDir);
  const manifest = createManifest();
  const invalidIdBase = {
    ...manifest,
    services: manifest.services.map((entry, index) => index === 0 ? { ...entry, id: '../unsafe' } : entry)
  };
  delete invalidIdBase.fingerprint;
  const invalidIdManifest = { ...invalidIdBase, fingerprint: fingerprint(invalidIdBase) };
  const adapterSyntax = syntaxCheckPhp(RMT_PHP_APP_SERVICE_ADAPTER_PATH, rootDir);
  const fixtureSyntax = syntaxCheckPhp(RMT_PHP_APP_SERVICE_FIXTURE_PATH, rootDir);

  context.assert(fs.existsSync(resolveRepoPath(RMT_PHP_APP_SERVICE_ADAPTER_PATH, rootDir)), 'PHP AppService adapter exists');
  context.assert(fs.existsSync(resolveRepoPath(RMT_PHP_APP_SERVICE_FIXTURE_PATH, rootDir)), 'PHP AppService callable fixture exists');
  context.assert(adapterSyntax.ok, `PHP AppService adapter syntax passes${adapterSyntax.ok ? '' : ` (${adapterSyntax.message})`}`);
  context.assert(fixtureSyntax.ok, `PHP AppService fixture syntax passes${fixtureSyntax.ok ? '' : ` (${fixtureSyntax.message})`}`);
  context.assert(adapterSource.includes(`'${RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA}'`), 'adapter declares stable PHP schema');
  context.assert(adapterSource.includes(`'${MARACA_APP_SERVICE_MANIFEST_SCHEMA}'`), 'adapter consumes versioned Maraca service manifest');
  context.assert(adapterSource.includes(`'${MARACA_APP_SERVICE_REQUEST_SCHEMA}'`), 'adapter consumes shared wire request schema');
  context.assert(adapterSource.includes(`'${MARACA_APP_SERVICE_RESPONSE_SCHEMA}'`), 'adapter emits shared wire response schema');
  context.assert(adapterSource.includes(`'${MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA}'`), 'adapter emits shared stream frame schema');
  context.assert(adapterSource.includes('final class RmtPhpAppServiceAdapter'), 'adapter exposes RmtPhpAppServiceAdapter class');
  context.assert(adapterSource.includes('function createRmtPhpAppServiceAdapter'), 'adapter exposes factory');
  context.assert(!adapterSource.includes('php://input'), 'adapter never reads the process-global HTTP body');
  context.assert(!/\bheader\s*\(/u.test(adapterSource), 'adapter never writes process-global HTTP headers');
  context.assert(!/\b(?:eval|include|require)(?:_once)?\s*\(/u.test(adapterSource), 'adapter does not dynamically execute or include application code');
  context.assert(!/Illuminate|Symfony|Laravel/u.test(adapterSource), 'adapter remains HTTP-framework neutral');
  context.assert(!/TypeScript|\.tsx?\b/u.test(adapterSource), 'adapter never executes TypeScript');

  const metadata = packageManifest.xtend && packageManifest.xtend.rmtPhpAppServiceAdapter;
  context.assert(packageManifest.scripts['test:rmt-php-app-service-adapter'] === 'node scripts/run_xtend_tests.js rmt-php-app-service-adapter', 'root package exposes PHP AppService adapter test script');
  context.assert(runner.hasSuite("rmt-php-app-service-adapter"), 'test runner registers PHP AppService adapter suite');
  context.assert(require('../../scripts/test-runner/catalog').select().some(suite => suite.id === 'rmt-php-app-service-adapter'), 'PHP AppService adapter is included in the default runner gate');
  context.assert(metadata && metadata.schema === RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA, 'root metadata records PHP AppService adapter schema');
  context.assert(metadata && metadata.manifestSchema === MARACA_APP_SERVICE_MANIFEST_SCHEMA, 'root metadata records shared service manifest schema');
  context.assert(metadata && metadata.requestSchema === MARACA_APP_SERVICE_REQUEST_SCHEMA && metadata.responseSchema === MARACA_APP_SERVICE_RESPONSE_SCHEMA, 'root metadata records shared invoke wire schemas');
  context.assert(metadata && metadata.streamFrameSchema === MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA, 'root metadata records shared stream frame schema');
  context.assert(metadata && metadata.httpResponseSchema === RMT_PHP_APP_SERVICE_HTTP_RESPONSE_SCHEMA, 'root metadata records framework-neutral HTTP response schema');
  context.assert(metadata && metadata.runtime === RMT_PHP_APP_SERVICE_ADAPTER_PATH, 'root metadata points to packaged PHP runtime');
  context.assert(metadata && metadata.localGate === RMT_PHP_APP_SERVICE_LOCAL_GATE && metadata.packageScript === RMT_PHP_APP_SERVICE_PACKAGE_SCRIPT, 'root metadata records local and npm gates');
  context.assert(metadata && metadata.typescriptExecution === false && metadata.httpServerIncluded === false, 'root metadata keeps TypeScript execution and server ownership outside PHP adapter');
  context.assert(metadata && metadata.laravelComposerPackageIncluded === true, 'root metadata records the PHP runtime in the separately installable Composer package');

  context.assert(Array.isArray(packageManifest.files) && packageManifest.files.includes('xtendrmt'), 'root tarball includes the XTendRMT package boundary');
  context.assert(Array.isArray(workspaceManifest.files) && workspaceManifest.files.includes('rmt-php-app-service-adapter.php'), 'XTendRMT workspace tarball includes PHP AppService adapter');
  context.assert(workspaceManifest.exports[RMT_PHP_APP_SERVICE_WORKSPACE_EXPORT] === './rmt-php-app-service-adapter.php', 'XTendRMT workspace exports PHP adapter as an explicit .php asset');

  const ciGateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;
  context.assert(ciGateMatrix.prFastGate.suites.includes('rmt-php-app-service-adapter'), 'PR fast gate includes PHP AppService adapter suite');
  context.assert(ciGateMatrix.fullReleaseGate.suites.includes('rmt-php-app-service-adapter'), 'full release gate includes PHP AppService adapter suite');
  context.assert(ciGateMatrix.rmtVNextPrimitiveGate.suites.includes('rmt-php-app-service-adapter'), 'RMT vNext primitive gate includes PHP AppService adapter suite');
  context.assert(packageManifest.xtend.releaseGates.includes(RMT_PHP_APP_SERVICE_PACKAGE_SCRIPT), 'release gates include PHP AppService adapter package script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(RMT_PHP_APP_SERVICE_PACKAGE_SCRIPT), 'release candidate gates include PHP AppService adapter package script');
  context.assert(packageManifest.xtend.rmtVNextReleaseHandoff.releaseGateMatrix.includes(RMT_PHP_APP_SERVICE_PACKAGE_SCRIPT), 'RMT vNext handoff gate matrix includes PHP AppService adapter package script');
  ['test:pr', 'test:pr:report', 'test:release:full', 'test:release:full:report', 'release:report'].forEach((scriptName) => {
    context.assert(packageManifest.scripts[scriptName].split(/\s+/u).includes('rmt-php-app-service-adapter'), `${scriptName} executes PHP AppService adapter suite`);
  });

  const fixture = runPhpHarness(rootDir, {
    adapterPath: resolveRepoPath(RMT_PHP_APP_SERVICE_ADAPTER_PATH, rootDir),
    fixturePath: resolveRepoPath(RMT_PHP_APP_SERVICE_FIXTURE_PATH, rootDir),
    manifest,
    invalidIdManifest
  });

  context.assert(fixture.directInvoke.accepted === true && fixture.directInvoke.input.query === 'direct', 'direct invoke returns callable result');
  context.assert(fixture.directInvoke.serviceId === 'fixture.invoke' && fixture.directInvoke.correlationId === 'fixture-correlation:direct', 'direct invoke receives versioned execution context');
  context.assert(fixture.invokeRequest.schema === MARACA_APP_SERVICE_RESPONSE_SCHEMA && fixture.invokeRequest.ok === true, 'invoke request returns shared response envelope');
  context.assert(fixture.invokeRequest.value.input.query === 'request', 'invoke request transports JSON input and output');
  context.assert(fixture.invokeHttp.schema === RMT_PHP_APP_SERVICE_HTTP_RESPONSE_SCHEMA && fixture.invokeHttp.status === 200, 'HTTP invoke returns framework-neutral success response');
  context.assert(fixture.invokeHttp.headers['Content-Type'].startsWith('application/json'), 'HTTP invoke declares JSON content type');
  context.assert(fixture.invokeHttp.headers['Cache-Control'] === 'no-store' && fixture.invokeHttp.headers['X-Content-Type-Options'] === 'nosniff', 'HTTP invoke emits safe cache and MIME headers');
  context.assert(fixture.invokeHttp.body.schema === MARACA_APP_SERVICE_RESPONSE_SCHEMA && fixture.invokeHttp.body.value.input.query === 'http', 'HTTP invoke body uses shared response schema');

  context.assert(fixture.failureHttp.status === 500 && fixture.failureHttp.body.ok === false, 'handler failure returns server error response');
  context.assert(fixture.failureHttp.body.error.code === 'xtend.maraca.app-service.internal_error', 'handler failure uses Node-compatible redacted error code');
  context.assert(!JSON.stringify(fixture.failureHttp).includes('top-secret') && !JSON.stringify(fixture.failureHttp).includes('password'), 'invoke wire error redacts handler secrets');
  context.assert(fixture.unknownHttp.status === 404 && fixture.unknownHttp.body.error.code === 'xtend.maraca.app-service.unknown', 'unknown service returns versioned 404 error');
  context.assert(fixture.modeMismatchHttp.status === 400 && fixture.modeMismatchHttp.body.error.code === 'xtend.maraca.app-service.mode_mismatch', 'mode mismatch returns Node-compatible bad request');
  context.assert(fixture.invalidJsonHttp.status === 400 && fixture.invalidJsonHttp.body.error.code === 'xtend.maraca.app-service.invalid_request', 'invalid JSON returns versioned bad request');
  context.assert(fixture.largeRequestHttp.status === 413 && fixture.largeRequestHttp.body.error.code === 'xtend.maraca.app-service.payload_too_large', 'oversized JSON request returns Node-compatible payload limit response');

  const streamFrames = fixture.streamFrames;
  context.assert(streamFrames.every((frame) => frame.schema === MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA), 'direct stream uses shared frame schema');
  context.assert(streamFrames.map((frame) => frame.type).join(',') === 'start,delta,delta,tool-call,tool-result,complete', 'stream suppresses duplicate and regressing input frames and stops at first terminal');
  context.assert(streamFrames.every((frame, index) => frame.sequence === index + 1), 'stream frames have monotone one-based sequence');
  context.assert(terminalFrames(streamFrames).length === 1, 'direct stream emits exactly one terminal frame');
  context.assert(!JSON.stringify(streamFrames).includes('999') && !JSON.stringify(streamFrames).includes('998') && !JSON.stringify(streamFrames).includes('997') && !JSON.stringify(streamFrames).includes('must never'), 'stream suppresses duplicate, regressing and post-terminal values');
  context.assert(streamFrames[1].id === 'fixture-delta-1' && streamFrames[2].id === 'fixture-delta-2', 'stream preserves accepted producer frame ids');
  context.assert(streamFrames[3].toolCall.name === 'lookup' && streamFrames[4].toolResult.value === 'Ada', 'stream preserves tool-call and tool-result payload fields');

  const streamHttpFrames = parseNdjson(fixture.streamHttp.body);
  context.assert(fixture.streamHttp.status === 200 && fixture.streamHttp.headers['Content-Type'].startsWith('application/x-ndjson'), 'HTTP stream returns NDJSON response boundary');
  context.assert(streamHttpFrames.length === 6 && terminalFrames(streamHttpFrames).length === 1, 'HTTP NDJSON stream preserves tool frames and the exactly-one-terminal invariant');
  context.assert(streamHttpFrames.every((frame) => frame.schema === MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA), 'HTTP NDJSON lines use shared frame schema');

  const failureFrames = fixture.streamFailureFrames;
  context.assert(failureFrames.map((frame) => frame.type).join(',') === 'start,delta,error', 'stream exception emits one error terminal');
  context.assert(terminalFrames(failureFrames).length === 1, 'failed stream emits exactly one terminal frame');
  context.assert(failureFrames[failureFrames.length - 1].error.code === 'xtend.maraca.app-service.stream_failed', 'stream exception uses Node-compatible failure code');
  context.assert(failureFrames[failureFrames.length - 1].error.message === 'App service request failed.', 'stream exception message is redacted');
  context.assert(!JSON.stringify(failureFrames).includes('top-secret') && !JSON.stringify(failureFrames).includes('token='), 'stream wire error redacts handler secrets');

  const cancelFrames = fixture.streamCancelFrames;
  context.assert(cancelFrames.map((frame) => frame.type).join(',') === 'start,cancelled', 'request cancellation emits cancelled terminal before more values');
  context.assert(terminalFrames(cancelFrames).length === 1 && fixture.cancelChecks >= 2, 'cancelled stream emits exactly one terminal and consults host cancellation');

  context.assert(fixture.cleanup['fixture.invoke:deferred'] === 3, 'deferred invoke cleanup runs for direct, request and HTTP calls');
  context.assert(fixture.cleanup['fixture.fail:deferred'] === 1 && fixture.cleanup['fixture.fail:registry'] === 1, 'invoke failure runs deferred and registry cleanup');
  context.assert(fixture.cleanup['fixture.stream:deferred'] === 3 && fixture.cleanup['fixture.stream:registry'] === 3, 'completed and actively disposed streams run deferred and registry cleanup');
  context.assert(fixture.cleanup['fixture.stream.fail:deferred'] === 1, 'stream failure runs request cleanup');
  context.assert(fixture.cleanup['fixture.stream.cancel:deferred'] === 1, 'stream cancellation runs request cleanup');
  context.assert(fixture.activeBeforeDispose.length === 0, 'all request scopes close after success, failure, cancel and stream completion');
  context.assert(fixture.activeScopeDispose.during.length === 1 && fixture.activeScopeDispose.after.length === 0, 'adapter disposal closes an active request scope');
  context.assert(fixture.observedErrors.some((entry) => entry.message.includes('top-secret')), 'host error observer receives original failure outside wire output');
  context.assert(fixture.cleanupErrors.length === 1 && fixture.cleanupErrors[0].message.includes('top-secret'), 'cleanup failure is isolated and reported only to the host observer');
  context.assert(!JSON.stringify(fixture.failureHttp).includes('cleanup'), 'cleanup failure never changes or contaminates the wire response');

  context.assert(fixture.validation.badSchema === 'xtend.maraca.app-service.manifest_schema', 'manifest schema mismatch blocks adapter creation');
  context.assert(fixture.validation.badFingerprint === 'xtend.maraca.app-service.manifest_fingerprint', 'manifest fingerprint mismatch blocks adapter creation');
  context.assert(fixture.validation.missingRegistry === 'xtend.maraca.app-service.handler_missing', 'missing PHP callable blocks adapter creation');
  context.assert(fixture.validation.extraRegistry === 'xtend.maraca.app-service.registry_unknown', 'extra PHP callable blocks adapter creation');
  context.assert(fixture.validation.invalidId === 'xtend.maraca.app-service.manifest_invalid', 'unsafe manifest service ID blocks adapter creation');
  context.assert(fixture.serviceIds.join(',') === 'fixture.fail,fixture.invoke,fixture.stream,fixture.stream.cancel,fixture.stream.fail', 'callable registry exposes deterministic manifest-bound IDs');
  context.assert(fixture.manifestFingerprint === manifest.fingerprint, 'adapter retains verified manifest fingerprint');
  context.assert(fixture.dispose.first === true && fixture.dispose.second === false, 'adapter disposal is idempotent');
  context.assert(fixture.dispose.invokeCode === 'xtend.maraca.app-service.disposed', 'disposed adapter rejects new requests');

  return context.result({
    schema: 'xtend.rmt.php-app-service-adapter-report.v1',
    adapterSchema: RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA,
    manifestSchema: MARACA_APP_SERVICE_MANIFEST_SCHEMA,
    requestSchema: MARACA_APP_SERVICE_REQUEST_SCHEMA,
    responseSchema: MARACA_APP_SERVICE_RESPONSE_SCHEMA,
    streamFrameSchema: MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
    localGate: RMT_PHP_APP_SERVICE_LOCAL_GATE,
    packageScript: RMT_PHP_APP_SERVICE_PACKAGE_SCRIPT,
    assertionCount: context.passes.length,
    workspaceExportRequired: RMT_PHP_APP_SERVICE_WORKSPACE_EXPORT,
    runnerRequired: 'rmt-php-app-service-adapter'
  });
}

function printRmtPhpAppServiceAdapterReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT PHP AppService Adapter erfolgreich.',
    failureTitle: 'RMT PHP AppService Adapter fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtPhpAppServiceAdapterSuite();
  printRmtPhpAppServiceAdapterReport(result);
  if (!result.ok) process.exitCode = 1;
}

module.exports = {
  MARACA_APP_SERVICE_MANIFEST_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  RMT_PHP_APP_SERVICE_ADAPTER_PATH,
  RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA,
  RMT_PHP_APP_SERVICE_FIXTURE_PATH,
  printRmtPhpAppServiceAdapterReport,
  runRmtPhpAppServiceAdapterSuite
};
