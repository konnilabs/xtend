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
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');

const RMT_PHP_SSR_ADAPTER_PATH = 'xtendrmt/rmt-php-ssr-adapter.php';
const RMT_PHP_SSR_ADAPTER_SCHEMA = 'xtend.rmt.php-ssr-adapter.v1';
const RMT_PHP_SSR_RENDER_RESULT_SCHEMA = 'xtend.rmt.node-ssr-render-result.v1';
const RMT_PHP_SSR_JSONL_FRAME_SCHEMA = 'xtend.rmt.node-ssr-jsonl-frame.v1';
const RMT_PHP_SSR_HYDRATION_SCHEMA = 'xtend.rmt.node-ssr-hydration-payload.v1';
const RMT_SSR_CSP_POLICY_SCHEMA = 'xtend.rmt.ssr-csp-policy.v1';
const RMT_PHP_SSR_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-php-ssr-adapter --json';
const RMT_PHP_SSR_PACKAGE_SCRIPT = 'npm run test:rmt-php-ssr-adapter';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function parseJsonl(lines) {
  return lines
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function syntaxCheckPhp(relativePath, rootDir) {
  const result = spawnSync('php', ['-l', resolveRepoPath(relativePath, rootDir)], {
    encoding: 'utf8'
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    message: result.stderr.trim() || result.stdout.trim()
  };
}

function writePhpFixture(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const fixturePath = path.join(os.tmpdir(), `xtend-rmt-php-ssr-${process.pid}-${Date.now()}.php`);
  const source = `<?php
declare(strict_types=1);

$payload = json_decode(base64_decode('${encodedPayload}'), true);
if (!is_array($payload)) {
    fwrite(STDERR, 'fixture payload decode failed');
    exit(1);
}

require $payload['adapterPath'];

function xtend_rmt_fixture_response_content($response): ?string {
    if (is_object($response) && method_exists($response, 'getContent')) {
        return (string) $response->getContent();
    }
    if (is_object($response) && property_exists($response, 'content')) {
        return (string) $response->content;
    }
    if (is_array($response) && array_key_exists('body', $response)) {
        return (string) $response['body'];
    }
    return null;
}

function xtend_rmt_fixture_response_headers($response): array {
    if (is_object($response) && property_exists($response, 'headers') && is_array($response->headers)) {
        return $response->headers;
    }
    if (is_array($response) && array_key_exists('headers', $response) && is_array($response['headers'])) {
        return $response['headers'];
    }
    return [];
}

$adapter = createRmtPhpSsrAdapter([
    'manifest' => $payload['manifest'],
    'compileRmtVNextSource' => function ($source, array $context = []) use ($payload): array {
        return $payload['sourceCompileResult'];
    },
]);

$descriptor = [
    'type' => 'component',
    'tag' => 'x-select',
    'id' => 'plan-select',
    'key' => 'plan-select',
    'attributes' => [
        'name' => 'plan',
    ],
    'properties' => [
        'value' => 'pro',
        'items' => ['free', 'pro'],
    ],
    'slots' => [
        'label' => ['text' => 'Plan'],
    ],
    'parts' => ['control'],
    'events' => [
        'select-changed' => 'plan.changed',
    ],
];

$descriptorRender = $adapter->render(['descriptor' => $descriptor], ['requestId' => 'php-ssr-descriptor']);
$sourceRender = $adapter->render([
    'source' => $payload['source'],
    'filePath' => 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt',
], ['requestId' => 'php-ssr-source']);
$coreRender = $adapter->render(['coreDocument' => $payload['coreDocument']], ['requestId' => 'php-ssr-core']);
$preparedRender = $adapter->render([
    'preparedTemplate' => [
        'descriptor' => [
            'type' => 'component',
            'tag' => 'x-status',
            'attributes' => ['data-prepared' => 'true'],
            'children' => [['type' => 'text', 'text' => 'Prepared']],
        ],
    ],
], ['requestId' => 'php-ssr-prepared']);

$runtimeOnlyAdapter = createRmtPhpSsrAdapter(['manifest' => $payload['manifest']]);
$missingCompiler = $runtimeOnlyAdapter->render([
    'source' => $payload['source'],
    'filePath' => 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt',
], ['requestId' => 'php-ssr-runtime-only']);
$missingCompilerFrames = iterator_to_array($runtimeOnlyAdapter->streamJsonl([
    'source' => $payload['source'],
    'filePath' => 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt',
], ['requestId' => 'php-ssr-error-frame']));

$streamFrames = iterator_to_array($runtimeOnlyAdapter->streamJsonl([
    'coreDocument' => $payload['streamingCoreDocument'],
], [
    'requestId' => 'php-ssr-jsonl',
    'endpointHandlers' => [
        'ssr.hero' => fn () => ['html' => '<x-hero data-rmt-stream="hero">Hero</x-hero>', 'trustBoundary' => 'xtend.security.sanitizing-boundary.v1'],
        'ssr.fragments' => fn () => ['html' => '<x-section data-rmt-stream="fragment">Fragment</x-section>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'feed.live' => fn () => ['html' => '<x-status data-rmt-stream="feed">Live</x-status>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'preview.render' => fn () => ['html' => '<x-code data-rmt-stream="preview">Preview</x-code>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'panel.chunk' => fn () => ['html' => '<x-summary data-rmt-stream="panel">Panel</x-summary>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
    ],
]));
$missingResolverFrames = iterator_to_array($runtimeOnlyAdapter->streamJsonl([
    'coreDocument' => $payload['streamingCoreDocument'],
], ['requestId' => 'php-ssr-jsonl-missing']));

$unsafeRender = $runtimeOnlyAdapter->render([
    'descriptor' => [
        'type' => 'html',
        'trustBoundary' => 'xtend.security.sanitizing-boundary.v1',
        'html' => '<img src="javascript:alert(1)" onerror="bad"><script>alert(1)</script><style>body{background:url(javascript:alert(1))}</style><svg onload="bad()"></svg><template><img src=x onerror="bad()"></template><x-status>Safe</x-status>',
    ],
], ['requestId' => 'php-ssr-unsafe']);
$missingTrust = $runtimeOnlyAdapter->render([
    'descriptor' => [
        'type' => 'html',
        'html' => '<x-status>Needs boundary</x-status>',
    ],
], ['requestId' => 'php-ssr-missing-trust']);
$blockedAttribute = $runtimeOnlyAdapter->render([
    'descriptor' => [
        'type' => 'component',
        'tag' => 'x-link',
        'attributes' => [
            'href' => 'javascript:alert(1)',
            'onclick' => 'bad()',
            'srcdoc' => '<script>bad()</script>',
        ],
    ],
], ['requestId' => 'php-ssr-blocked-attribute']);
$fetchAdapterFrames = iterator_to_array($runtimeOnlyAdapter->streamJsonl([
    'coreDocument' => $payload['streamingCoreDocument'],
], [
    'requestId' => 'php-ssr-fetch-adapter',
    'fetchAdapter' => fn ($record, array $context = []) => ['html' => '<x-section data-fetch-adapter="true">Fetch bridge</x-section>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
]));

$fallbackResponse = $runtimeOnlyAdapter->toLaravelResponse($descriptorRender);

if (!class_exists('\\\\Illuminate\\\\Http\\\\Response')) {
    eval('namespace Illuminate\\\\Http; class Response { public string $content; public int $status; public array $headers; public function __construct($content = "", int $status = 200, array $headers = []) { $this->content = (string) $content; $this->status = $status; $this->headers = $headers; } public function getContent(): string { return $this->content; } }');
}
if (!class_exists('\\\\Symfony\\\\Component\\\\HttpFoundation\\\\StreamedResponse')) {
    eval('namespace Symfony\\\\Component\\\\HttpFoundation; class StreamedResponse { public $callback; public int $status; public array $headers; public function __construct($callback = null, int $status = 200, array $headers = []) { $this->callback = $callback; $this->status = $status; $this->headers = $headers; } public function sendContent(): void { $callback = $this->callback; if (is_callable($callback)) { $callback(); } } }');
}

$laravelResponse = $runtimeOnlyAdapter->toLaravelResponse($descriptorRender, ['status' => 202]);
$streamedResponse = $runtimeOnlyAdapter->toLaravelStreamedResponse([
    'coreDocument' => $payload['streamingCoreDocument'],
], [
    'requestId' => 'php-ssr-laravel-stream',
    'endpointHandlers' => [
        'ssr.hero' => fn () => ['html' => '<x-hero>Hero</x-hero>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'ssr.fragments' => fn () => ['html' => '<x-section>Fragment</x-section>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'feed.live' => fn () => ['html' => '<x-status>Live</x-status>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'preview.render' => fn () => ['html' => '<x-code>Preview</x-code>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
        'panel.chunk' => fn () => ['html' => '<x-summary>Panel</x-summary>', 'trustBoundary' => 'xtend.security.streaming-boundary.v1'],
    ],
]);
ob_start();
if (is_object($streamedResponse) && method_exists($streamedResponse, 'sendContent')) {
    $streamedResponse->sendContent();
}
$streamedOutput = ob_get_clean();

echo json_encode([
    'descriptorRender' => $descriptorRender,
    'sourceRender' => $sourceRender,
    'coreRender' => $coreRender,
    'preparedRender' => $preparedRender,
    'missingCompiler' => $missingCompiler,
    'missingCompilerFrames' => $missingCompilerFrames,
    'streamFrames' => $streamFrames,
    'missingResolverFrames' => $missingResolverFrames,
    'unsafeRender' => $unsafeRender,
    'missingTrust' => $missingTrust,
    'blockedAttribute' => $blockedAttribute,
    'fetchAdapterFrames' => $fetchAdapterFrames,
    'fallbackResponse' => [
        'isArray' => is_array($fallbackResponse),
        'status' => is_array($fallbackResponse) ? ($fallbackResponse['status'] ?? null) : null,
        'headers' => xtend_rmt_fixture_response_headers($fallbackResponse),
        'content' => xtend_rmt_fixture_response_content($fallbackResponse),
    ],
    'laravelResponse' => [
        'class' => is_object($laravelResponse) ? get_class($laravelResponse) : gettype($laravelResponse),
        'status' => is_object($laravelResponse) && property_exists($laravelResponse, 'status') ? $laravelResponse->status : null,
        'headers' => xtend_rmt_fixture_response_headers($laravelResponse),
        'content' => xtend_rmt_fixture_response_content($laravelResponse),
    ],
    'streamedResponse' => [
        'class' => is_object($streamedResponse) ? get_class($streamedResponse) : gettype($streamedResponse),
        'headers' => xtend_rmt_fixture_response_headers($streamedResponse),
        'content' => $streamedOutput,
    ],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
`;
  fs.writeFileSync(fixturePath, source);
  return fixturePath;
}

function runPhpAdapterFixture(rootDir, payload) {
  const fixturePath = writePhpFixture(payload);
  try {
    const result = spawnSync('php', [fixturePath], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 12
    });
    if (result.status !== 0) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `php fixture exited ${result.status}`);
    }
    return JSON.parse(result.stdout);
  } finally {
    try {
      fs.unlinkSync(fixturePath);
    } catch (error) {
      // Temp cleanup should never hide the PHP fixture result.
    }
  }
}

async function runRmtPhpSsrAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-php-ssr-adapter',
    label: 'RMT PHP/Laravel SSR Adapter'
  });
  const packageManifest = readJson('package.json', rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const adapterSource = readText(RMT_PHP_SSR_ADAPTER_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const syntax = syntaxCheckPhp(RMT_PHP_SSR_ADAPTER_PATH, rootDir);
  const source = readText('tests/rmt-language/fixtures/vnext-source-to-sea.rmt', rootDir);
  const sourceCompileResult = compileRmtVNextSource(source, {
    filePath: 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt'
  });
  const streamingSource = readText('tests/rmt-language/fixtures/vnext-streaming-progressive.rmt', rootDir);
  const streamingCompileResult = compileRmtVNextSource(streamingSource, {
    filePath: 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt'
  });
  const streamingCoreDocument = JSON.parse(JSON.stringify(streamingCompileResult.coreDocument));
  streamingCoreDocument.surfaces = (streamingCoreDocument.surfaces || []).map((surface, index) => ({
    ...surface,
    component: index === 0 ? 'x-section' : surface.component
  }));

  assertFileExists(context, RMT_PHP_SSR_ADAPTER_PATH, rootDir, 'PHP SSR adapter runtime exists');
  context.assert(syntax.ok, `PHP SSR adapter syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assert(adapterSource.includes('RMT_PHP_SSR_ADAPTER_SCHEMA'), 'adapter declares PHP SSR schema constant');
  context.assert(adapterSource.includes(RMT_PHP_SSR_ADAPTER_SCHEMA), 'adapter source records stable PHP schema');
  context.assert(adapterSource.includes(RMT_PHP_SSR_RENDER_RESULT_SCHEMA), 'adapter reuses Node render result schema');
  context.assert(adapterSource.includes(RMT_PHP_SSR_JSONL_FRAME_SCHEMA), 'adapter reuses Node JSONL frame schema');
  context.assert(adapterSource.includes(RMT_SSR_CSP_POLICY_SCHEMA), 'adapter source records automatic SSR CSP policy schema');
  context.assert(adapterSource.includes('RMT_SSR_CSP_HEADER'), 'adapter source declares CSP header constant');
  context.assert(adapterSource.includes('function createRmtPhpSsrAdapter'), 'adapter exposes createRmtPhpSsrAdapter factory');
  context.assert(adapterSource.includes('final class RmtPhpSsrAdapter'), 'adapter exposes RmtPhpSsrAdapter class');
  context.assert(!adapterSource.includes('shadowRoot'), 'adapter does not patch component shadow roots');
  context.assert(!adapterSource.includes('innerHTML'), 'adapter runtime avoids manual browser HTML sinks');
  context.assert(!adapterSource.includes('window.'), 'adapter avoids browser window global');
  context.assert(!adapterSource.includes('document.'), 'adapter avoids browser document global');
  context.assert(!adapterSource.includes('globalThis'), 'adapter avoids JS globals');
  context.assert(!/require\\s+['"].*components|include\\s+['"].*components/u.test(adapterSource), 'adapter does not import XTend components directly');
  context.assert(!adapterSource.includes('docs/index.php'), 'adapter is not coupled to the docs app');
  context.assert(!adapterSource.includes('Parsedown'), 'adapter does not reuse docs markdown infrastructure');

  const fixture = runPhpAdapterFixture(rootDir, {
    adapterPath: resolveRepoPath(RMT_PHP_SSR_ADAPTER_PATH, rootDir),
    manifest,
    source,
    sourceCompileResult,
    coreDocument: sourceCompileResult.coreDocument,
    streamingCoreDocument
  });

  const descriptorRender = fixture.descriptorRender;
  context.assert(descriptorRender.schema === RMT_PHP_SSR_RENDER_RESULT_SCHEMA, 'descriptor render uses Node-compatible render result schema');
  context.assert(descriptorRender.adapterSchema === RMT_PHP_SSR_ADAPTER_SCHEMA, 'descriptor render records PHP adapter schema');
  context.assert(descriptorRender.ok === true, 'descriptor render succeeds');
  context.assert(descriptorRender.html.includes('<x-select'), 'descriptor render serializes XTend custom element');
  context.assert(descriptorRender.html.includes('data-rmt-component-capability="x-select"'), 'descriptor render includes capability marker');
  context.assert(descriptorRender.html.includes('data-rmt-lazy-import="./xselect.js"'), 'descriptor render includes lazy import hint');
  context.assert(descriptorRender.html.includes('part="control"'), 'descriptor render includes part tokens');
  context.assert(descriptorRender.html.includes('data-rmt-event-select-changed="plan.changed"'), 'descriptor render includes event binding marker');
  context.assert(descriptorRender.html.includes('slot="label"'), 'descriptor render serializes named slot content');
  context.assert(descriptorRender.html.includes('value="pro"'), 'descriptor render serializes primitive property attributes');
  context.assert(descriptorRender.html.includes('data-rmt-prop-items='), 'descriptor render preserves non-primitive properties as data attributes');
  context.assert(descriptorRender.chunks[0].kind === 'rmt_template_chunk', 'descriptor render emits rmt template chunk');
  context.assert(descriptorRender.response.kind === 'rmt_template_prerender_response', 'descriptor render emits prerender response shape');
  context.assert(descriptorRender.response.ok === true, 'descriptor prerender response reports successful envelope status');
  context.assert(descriptorRender.response.transport === 'server', 'descriptor prerender response records server transport');
  context.assert(descriptorRender.response.chunk && descriptorRender.response.chunk.kind === 'rmt_template_chunk', 'descriptor prerender response exposes hydrateResponse-compatible chunk');
  context.assert(descriptorRender.response.metadata && descriptorRender.response.metadata.adapterKind === 'php-ssr', 'descriptor prerender response records PHP SSR adapter kind');
  context.assert(descriptorRender.response.request && descriptorRender.response.request.executionMode === 'server_prerender_hydrate', 'descriptor prerender response carries server prerender request snapshot');
  context.assert(descriptorRender.cspPolicy && descriptorRender.cspPolicy.schema === RMT_SSR_CSP_POLICY_SCHEMA, 'descriptor render creates automatic SSR CSP policy');
  context.assert(descriptorRender.cspPolicy.automatic === true && descriptorRender.cspPolicy.mode === 'framework-default', 'descriptor render uses framework-default CSP without host input');
  context.assert(descriptorRender.headers['Content-Security-Policy'].includes("object-src 'none'"), 'descriptor render emits CSP object-src header');
  context.assert(descriptorRender.headers['Content-Security-Policy'].includes("base-uri 'self'"), 'descriptor render emits CSP base-uri header');
  context.assert(descriptorRender.head.csp.header === descriptorRender.headers['Content-Security-Policy'], 'descriptor render mirrors CSP in head metadata');
  context.assert(descriptorRender.response.headers['Content-Security-Policy'] === descriptorRender.headers['Content-Security-Policy'], 'prerender response envelope carries CSP header');
  context.assert(descriptorRender.hydration.cspPolicy.header === descriptorRender.headers['Content-Security-Policy'], 'hydration payload carries CSP policy metadata');
  context.assert(descriptorRender.hydration.schema === RMT_PHP_SSR_HYDRATION_SCHEMA, 'descriptor render emits Node-compatible hydration payload');
  context.assert(JSON.stringify(descriptorRender.hydration).includes('server_prerender_hydrate'), 'descriptor render records server prerender hydrate mode');

  const sourceRender = fixture.sourceRender;
  context.assert(sourceRender.ok === true, 'source render succeeds with injected compiler bridge');
  context.assert(sourceRender.html.includes('<x-status'), 'source render serializes source-to-sea XTend status component');
  context.assert(sourceRender.html.includes('data-rmt-primitive-id="demo.feedback.status"'), 'source render preserves primitive marker');
  context.assert(JSON.stringify(sourceRender.chunks).includes('server_prerender_hydrate'), 'source render keeps server prerender hydrate chunk shape');

  const coreRender = fixture.coreRender;
  context.assert(coreRender.ok === true, 'core document render succeeds');
  context.assert(coreRender.hydration.coreDocumentSchema === 'xtend.rmt.core-format.vnext.v1', 'core render records core document schema');
  context.assert(coreRender.componentCapabilities.some((capability) => capability.tag === 'x-status'), 'core render records XTend component capabilities');

  const preparedRender = fixture.preparedRender;
  context.assert(preparedRender.ok === true, 'prepared template render succeeds');
  context.assert(preparedRender.html.includes('<x-status'), 'prepared template render serializes descriptor content');

  const missingCompiler = fixture.missingCompiler;
  context.assert(missingCompiler.ok === false, 'source render without compiler blocks');
  context.assert(missingCompiler.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.compiler_required'), 'source render without compiler reports PHP compiler bridge diagnostic');
  const missingCompilerFrames = parseJsonl(fixture.missingCompilerFrames.join(''));
  context.assert(missingCompilerFrames.some((frame) => frame.type === 'error' && frame.payload.code === 'rmt.php_ssr.compiler_required'), 'JSONL source without compiler emits error frame');

  const streamFrames = parseJsonl(fixture.streamFrames.join(''));
  const frameTypes = streamFrames.map((frame) => frame.type);
  context.assert(streamFrames.every((frame) => frame.schema === RMT_PHP_SSR_JSONL_FRAME_SCHEMA), 'JSONL stream uses stable Node-compatible frame schema');
  context.assert(frameTypes[0] === 'start', 'JSONL stream starts with start frame');
  context.assert(streamFrames[0].payload.cspPolicy && streamFrames[0].payload.cspPolicy.schema === RMT_SSR_CSP_POLICY_SCHEMA, 'JSONL stream start frame carries CSP policy');
  context.assert(streamFrames[0].payload.headers['Content-Security-Policy'].includes("object-src 'none'"), 'JSONL stream start frame carries CSP header');
  context.assert(frameTypes.includes('component'), 'JSONL stream emits component frames');
  context.assert(frameTypes.includes('html'), 'JSONL stream emits HTML frames');
  context.assert(frameTypes.includes('hydration'), 'JSONL stream emits hydration frame');
  context.assert(frameTypes[frameTypes.length - 1] === 'complete', 'JSONL stream completes deterministically');
  context.assert(streamFrames.every((frame, index) => frame.sequence === index), 'JSONL stream sequence is deterministic');
  context.assert(streamFrames.some((frame) => frame.variant === 'ssr' && frame.capability === 'stream.ssr.incremental'), 'JSONL stream exposes SSR incremental capability');
  context.assert(streamFrames.some((frame) => frame.variant === 'hydration' && frame.capability === 'stream.hydration.chunked'), 'JSONL stream exposes chunked hydration capability');

  const missingResolverFrames = parseJsonl(fixture.missingResolverFrames.join(''));
  context.assert(missingResolverFrames.some((frame) => frame.type === 'diagnostic' && frame.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.datasource_missing')), 'JSONL stream reports missing explicit data source resolver');
  context.assert(missingResolverFrames.some((frame) => frame.type === 'error' && frame.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.datasource_missing')), 'JSONL stream emits error frame for missing resolver');
  const fetchAdapterFrames = parseJsonl(fixture.fetchAdapterFrames.join(''));
  context.assert(fetchAdapterFrames.some((frame) => frame.type === 'html' && JSON.stringify(frame.payload).includes('data-fetch-adapter')), 'fetchAdapter resolver can provide streaming HTML');

  const unsafeRender = fixture.unsafeRender;
  context.assert(!unsafeRender.html.includes('javascript:'), 'sanitizer removes unsafe URL protocols');
  context.assert(!unsafeRender.html.toLowerCase().includes('<script'), 'sanitizer removes blocked markup tags');
  context.assert(!unsafeRender.html.includes('alert(1)'), 'sanitizer removes blocked script contents');
  context.assert(!/<\s*(style|svg|template)\b/iu.test(unsafeRender.html), 'sanitizer removes active style/svg/template markup');
  context.assert(!unsafeRender.html.includes('onerror'), 'sanitizer removes event attributes');
  context.assert(unsafeRender.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.html_sanitized'), 'sanitizer reports fallback cleanup diagnostic');

  const missingTrust = fixture.missingTrust;
  context.assert(missingTrust.ok === false, 'HTML fragments without trust boundary block render result');
  context.assert(missingTrust.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.trust_boundary_missing'), 'missing trust boundary diagnostic is emitted');
  const blockedAttribute = fixture.blockedAttribute;
  context.assert(blockedAttribute.ok === false, 'unsafe attributes block component serialization');
  context.assert(blockedAttribute.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.attribute_blocked'), 'unsafe event/srcdoc attributes are diagnosed');
  context.assert(blockedAttribute.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.php_ssr.url_blocked'), 'unsafe javascript URL is diagnosed');

  context.assert(fixture.fallbackResponse.isArray === true, 'response helper degrades to array without Laravel/Symfony classes');
  context.assert(fixture.fallbackResponse.headers['Content-Security-Policy'].includes("script-src 'self'"), 'fallback response helper emits automatic CSP header');
  context.assert(fixture.fallbackResponse.content.includes('<x-select'), 'fallback response carries rendered HTML');
  context.assert(fixture.laravelResponse.class === 'Illuminate\\Http\\Response', 'Laravel response helper uses Illuminate response when available');
  context.assert(fixture.laravelResponse.status === 202, 'Laravel response helper preserves status');
  context.assert(fixture.laravelResponse.headers['Content-Security-Policy'].includes("object-src 'none'"), 'Laravel response helper emits automatic CSP header');
  context.assert(fixture.laravelResponse.content.includes('<x-select'), 'Laravel response helper carries rendered HTML');
  context.assert(fixture.streamedResponse.class === 'Symfony\\Component\\HttpFoundation\\StreamedResponse', 'Laravel streamed helper uses Symfony streamed response when available');
  context.assert(fixture.streamedResponse.headers['Content-Security-Policy'].includes("object-src 'none'"), 'Laravel streamed helper emits automatic CSP header');
  context.assert(parseJsonl(fixture.streamedResponse.content)[0].type === 'start', 'Laravel streamed helper emits JSONL content');

  context.assert(packageManifest.scripts['test:rmt-php-ssr-adapter'] === 'node scripts/run_xtend_tests.js rmt-php-ssr-adapter', 'package exposes PHP SSR adapter test script');
  context.assert(runner.includes("id: 'rmt-php-ssr-adapter'"), 'test runner registers PHP SSR adapter suite');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.schema === RMT_PHP_SSR_ADAPTER_SCHEMA, 'package metadata records PHP SSR adapter schema');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.renderResultSchema === RMT_PHP_SSR_RENDER_RESULT_SCHEMA, 'package metadata records shared render result schema');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.jsonlFrameSchema === RMT_PHP_SSR_JSONL_FRAME_SCHEMA, 'package metadata records shared JSONL frame schema');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.localGate === RMT_PHP_SSR_LOCAL_GATE, 'package metadata records PHP SSR adapter local gate');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.packageScript === RMT_PHP_SSR_PACKAGE_SCRIPT, 'package metadata records PHP SSR adapter package script');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.docsAppIntegrationStatus === 'active-docs-php-ssr-prehydration', 'package metadata marks docs app integration active after adapter gates');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.laravelComposerPackageIncluded === false, 'package metadata records no Composer package in this slice');

  ['docs/rmt-php-ssr-adapter.md', 'docs/de/rmt-php-ssr-adapter.md', 'docs/en/rmt-php-ssr-adapter.md'].forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists`);
    const doc = readText(docPath, rootDir);
    context.assert(doc.includes(RMT_PHP_SSR_ADAPTER_SCHEMA), `${docPath} documents adapter schema`);
    context.assert(doc.includes('JSONL'), `${docPath} documents JSONL streaming`);
    context.assert(doc.includes('Content-Security-Policy'), `${docPath} documents automatic CSP`);
    context.assert(doc.includes('Laravel'), `${docPath} documents Laravel helpers`);
    context.assert(doc.includes('createRmtPhpSsrAdapter'), `${docPath} documents public factory`);
  });
  context.assert(readText('docs/quick-start-guide.md', rootDir).includes('rmt-php-ssr-adapter'), 'root quick start links PHP SSR adapter');
  context.assert(readText('docs/de/quick-start-guide.md', rootDir).includes('rmt-php-ssr-adapter'), 'German quick start links PHP SSR adapter');
  context.assert(readText('docs/en/quick-start-guide.md', rootDir).includes('rmt-php-ssr-adapter'), 'English quick start links PHP SSR adapter');
  context.assert(readText('docs/rmt-node-ssr-adapter.md', rootDir).includes('rmt-php-ssr-adapter'), 'Node SSR docs link PHP backend alternative');
  context.assert(readText('docs/de/rmt-node-ssr-adapter.md', rootDir).includes('rmt-php-ssr-adapter'), 'German Node SSR docs link PHP backend alternative');
  context.assert(readText('docs/en/rmt-node-ssr-adapter.md', rootDir).includes('rmt-php-ssr-adapter'), 'English Node SSR docs link PHP backend alternative');
  context.assert(readText('docs/menu.json', rootDir).includes('"slug": "rmt-php-ssr-adapter"'), 'docs menu exposes PHP SSR adapter article');

  return context.result({
    schema: 'xtend.rmt.php-ssr-adapter-report.v1',
    adapterSchema: RMT_PHP_SSR_ADAPTER_SCHEMA,
    renderResultSchema: RMT_PHP_SSR_RENDER_RESULT_SCHEMA,
    jsonlFrameSchema: RMT_PHP_SSR_JSONL_FRAME_SCHEMA,
    localGate: RMT_PHP_SSR_LOCAL_GATE,
    packageScript: RMT_PHP_SSR_PACKAGE_SCRIPT,
    renderAssertions: context.passes.length,
    diagnostics: {
      descriptor: descriptorRender.diagnostics.length,
      source: sourceRender.diagnostics.length,
      streamingFrames: streamFrames.length
    }
  });
}

function printRmtPhpSsrAdapterReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT PHP/Laravel SSR Adapter erfolgreich.',
    failureTitle: 'RMT PHP/Laravel SSR Adapter fehlgeschlagen:'
  });
}

module.exports = {
  RMT_PHP_SSR_ADAPTER_PATH,
  RMT_PHP_SSR_ADAPTER_SCHEMA,
  RMT_PHP_SSR_JSONL_FRAME_SCHEMA,
  RMT_PHP_SSR_RENDER_RESULT_SCHEMA,
  printRmtPhpSsrAdapterReport,
  runRmtPhpSsrAdapterSuite
};
