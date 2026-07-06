const fs = require('fs');
const path = require('path');
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
  syntaxCheckFile
} = require('../utils/process');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');

const RMT_NODE_SSR_ADAPTER_PATH = 'xtendrmt/rmt-node-ssr-adapter.js';
const RMT_NODE_SSR_ADAPTER_TYPES = 'xtendrmt/rmt-node-ssr-adapter.d.ts';
const RMT_NODE_SSR_ADAPTER_SCHEMA = 'xtend.rmt.node-ssr-adapter.v1';
const RMT_NODE_SSR_RENDER_RESULT_SCHEMA = 'xtend.rmt.node-ssr-render-result.v1';
const RMT_NODE_SSR_JSONL_FRAME_SCHEMA = 'xtend.rmt.node-ssr-jsonl-frame.v1';
const RMT_SSR_CSP_POLICY_SCHEMA = 'xtend.rmt.ssr-csp-policy.v1';
const RMT_NODE_SSR_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-node-ssr-adapter --json';
const RMT_NODE_SSR_PACKAGE_SCRIPT = 'npm run test:rmt-node-ssr-adapter';
const RMT_NODE_SSR_ROOT_EXPORT = './rmt/node-ssr-adapter';
const RMT_NODE_SSR_RUNTIME_EXPORT = './node-ssr-adapter';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createSourceTexts(manifest, rootDir) {
  return Object.fromEntries(Object.entries(manifest).map(([tag, modulePath]) => [
    tag,
    readText(path.join('components', modulePath.replace(/^\.\//u, '')), rootDir)
  ]));
}

function parseJsonl(lines) {
  return lines
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function collectJsonl(iterable) {
  const chunks = [];
  for await (const chunk of iterable) chunks.push(chunk);
  return parseJsonl(chunks.join(''));
}

async function runRmtNodeSsrAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-node-ssr-adapter',
    label: 'RMT Node SSR Adapter'
  });
  const packageManifest = readJson('package.json', rootDir);
  const xtendrmtManifest = readJson('xtendrmt/package.json', rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const sourceTexts = createSourceTexts(manifest, rootDir);
  const adapterSource = readText(RMT_NODE_SSR_ADAPTER_PATH, rootDir);
  const adapterTypes = readText(RMT_NODE_SSR_ADAPTER_TYPES, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const syntax = syntaxCheckFile(RMT_NODE_SSR_ADAPTER_PATH, { rootDir, extension: '.js' });
  const adapterApi = await import(`file://${resolveRepoPath(RMT_NODE_SSR_ADAPTER_PATH, rootDir)}`);

  assertFileExists(context, RMT_NODE_SSR_ADAPTER_PATH, rootDir, 'Node SSR adapter runtime exists');
  assertFileExists(context, RMT_NODE_SSR_ADAPTER_TYPES, rootDir, 'Node SSR adapter declarations exist');
  context.assert(syntax.ok, `Node SSR adapter syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assert(adapterApi.RMT_NODE_SSR_ADAPTER_SCHEMA === RMT_NODE_SSR_ADAPTER_SCHEMA, 'adapter exposes stable schema');
  context.assert(adapterApi.RMT_NODE_SSR_RENDER_RESULT_SCHEMA === RMT_NODE_SSR_RENDER_RESULT_SCHEMA, 'adapter exposes render result schema');
  context.assert(adapterApi.RMT_NODE_SSR_JSONL_FRAME_SCHEMA === RMT_NODE_SSR_JSONL_FRAME_SCHEMA, 'adapter exposes JSONL frame schema');
  context.assert(adapterApi.RMT_SSR_CSP_POLICY_SCHEMA === RMT_SSR_CSP_POLICY_SCHEMA, 'adapter exposes automatic SSR CSP policy schema');
  context.assert(typeof adapterApi.createRmtNodeSsrAdapter === 'function', 'adapter exposes createRmtNodeSsrAdapter');
  context.assert(!adapterSource.includes('shadowRoot'), 'adapter does not patch component internals');
  context.assert(!adapterSource.includes('innerHTML'), 'adapter runtime does not use manual HTML sinks');
  context.assert(!/from ['"]\.\.?\/components|import\(['"]\.\.?\/components/u.test(adapterSource), 'adapter does not import XTend components directly');
  context.assert(!adapterSource.includes('globalThis.fetch'), 'adapter does not use implicit global network access');
  context.assert(adapterTypes.includes('RmtNodeSsrAdapter'), 'declarations expose RmtNodeSsrAdapter');
  context.assert(adapterTypes.includes('RmtNodeSsrRenderResult'), 'declarations expose RmtNodeSsrRenderResult');
  context.assert(adapterTypes.includes('RmtNodeSsrJsonlFrame'), 'declarations expose RmtNodeSsrJsonlFrame');
  context.assert(adapterTypes.includes('RmtSsrCspPolicy'), 'declarations expose RmtSsrCspPolicy');
  context.assert(adapterTypes.includes('toHttpResponse'), 'declarations expose Node HTTP response helper');

  const adapter = adapterApi.createRmtNodeSsrAdapter({ manifest, sourceTexts });
  const descriptorRender = await adapter.render({
    descriptor: {
      type: 'component',
      tag: 'x-select',
      id: 'plan-select',
      key: 'plan-select',
      attributes: {
        name: 'plan'
      },
      properties: {
        value: 'pro'
      },
      slots: {
        label: { text: 'Plan' }
      },
      parts: ['control'],
      events: {
        'select-changed': 'plan.changed'
      }
    }
  }, { requestId: 'node-ssr-descriptor' });
  context.assert(descriptorRender.schema === RMT_NODE_SSR_RENDER_RESULT_SCHEMA, 'descriptor render uses render result schema');
  context.assert(descriptorRender.ok === true, 'descriptor render succeeds');
  context.assert(descriptorRender.html.includes('<x-select'), 'descriptor render serializes XTend custom element');
  context.assert(descriptorRender.html.includes('data-rmt-component-capability="x-select"'), 'descriptor render includes capability marker');
  context.assert(descriptorRender.html.includes('data-rmt-lazy-import="./xselect.js"'), 'descriptor render includes lazy import hint');
  context.assert(descriptorRender.html.includes('part="control"'), 'descriptor render includes part tokens');
  context.assert(descriptorRender.html.includes('data-rmt-event-select-changed="plan.changed"'), 'descriptor render includes safe event binding marker');
  context.assert(descriptorRender.html.includes('slot="label"'), 'descriptor render serializes slots');
  context.assert(descriptorRender.html.includes('value="pro"'), 'descriptor render serializes primitive properties as attributes');
  context.assert(descriptorRender.chunks[0].kind === 'rmt_template_chunk', 'descriptor render emits rmt template chunk');
  context.assert(descriptorRender.response.kind === 'rmt_template_prerender_response', 'descriptor render emits prerender response shape');
  context.assert(descriptorRender.response.ok === true, 'descriptor prerender response reports successful envelope status');
  context.assert(descriptorRender.response.transport === 'server', 'descriptor prerender response records server transport');
  context.assert(descriptorRender.response.chunk && descriptorRender.response.chunk.kind === 'rmt_template_chunk', 'descriptor prerender response exposes hydrateResponse-compatible chunk');
  context.assert(descriptorRender.response.metadata && descriptorRender.response.metadata.adapterKind === 'node-ssr', 'descriptor prerender response records Node SSR adapter kind');
  context.assert(descriptorRender.response.request && descriptorRender.response.request.executionMode === 'server_prerender_hydrate', 'descriptor prerender response carries server prerender request snapshot');
  context.assert(descriptorRender.cspPolicy && descriptorRender.cspPolicy.schema === RMT_SSR_CSP_POLICY_SCHEMA, 'descriptor render creates automatic SSR CSP policy');
  context.assert(descriptorRender.cspPolicy.automatic === true && descriptorRender.cspPolicy.mode === 'framework-default', 'descriptor render uses framework-default CSP without host input');
  context.assert(descriptorRender.headers['Content-Security-Policy'].includes("object-src 'none'"), 'descriptor render emits CSP object-src header');
  context.assert(descriptorRender.headers['Content-Security-Policy'].includes("base-uri 'self'"), 'descriptor render emits CSP base-uri header');
  context.assert(descriptorRender.head.csp.header === descriptorRender.headers['Content-Security-Policy'], 'descriptor render mirrors CSP in head metadata');
  context.assert(descriptorRender.response.headers['Content-Security-Policy'] === descriptorRender.headers['Content-Security-Policy'], 'prerender response envelope carries CSP header');
  context.assert(descriptorRender.hydration.cspPolicy.header === descriptorRender.headers['Content-Security-Policy'], 'hydration payload carries CSP policy metadata');
  context.assert(JSON.stringify(descriptorRender.hydration).includes('xtend.rmt.node-ssr-hydration-payload.v1'), 'descriptor render emits hydration payload');
  const httpResponse = await adapter.toHttpResponse({
    descriptor: { type: 'text', text: 'HTTP response' }
  }, { requestId: 'node-ssr-http-response' });
  context.assert(httpResponse.headers['Content-Security-Policy'].includes("script-src 'self'"), 'Node HTTP response helper emits automatic CSP header');
  context.assert(httpResponse.headers['X-XTend-RMT-SSR-Adapter'] === RMT_NODE_SSR_ADAPTER_SCHEMA, 'Node HTTP response helper emits adapter header');

  const source = readText('tests/rmt-language/fixtures/vnext-source-to-sea.rmt', rootDir);
  const sourceRender = await adapter.render({
    source,
    filePath: 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt'
  }, { requestId: 'node-ssr-source' });
  context.assert(sourceRender.ok === true, 'source render succeeds with full-package compiler wiring');
  context.assert(sourceRender.html.includes('<x-status'), 'source render serializes source-to-sea XTend status component');
  context.assert(sourceRender.html.includes('data-rmt-primitive-id="demo.feedback.status"'), 'source render preserves primitive surface marker');
  context.assert(JSON.stringify(sourceRender.chunks).includes('server_prerender_hydrate'), 'source render keeps server prerender hydrate chunk shape');

  const compiled = compileRmtVNextSource(source, {
    filePath: 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt'
  });
  const coreRender = await adapter.render({
    coreDocument: compiled.coreDocument
  }, { requestId: 'node-ssr-core' });
  context.assert(coreRender.ok === true, 'core document render succeeds');
  context.assert(coreRender.hydration.coreDocumentSchema === 'xtend.rmt.core-format.vnext.v1', 'core render records core document schema');

  const runtimeOnlyAdapter = adapterApi.createRmtNodeSsrAdapter({ disableAutoCompiler: true });
  const missingCompiler = await runtimeOnlyAdapter.render({
    source,
    filePath: 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt'
  }, { requestId: 'node-ssr-runtime-only' });
  context.assert(missingCompiler.ok === false, 'runtime-only source render blocks without compiler');
  context.assert(missingCompiler.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.node_ssr.compiler_required'), 'runtime-only source render reports compiler required diagnostic');

  const streamingSource = readText('tests/rmt-language/fixtures/vnext-streaming-progressive.rmt', rootDir);
  const streamingFrames = await collectJsonl(adapter.streamJsonl({
    source: streamingSource,
    filePath: 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt'
  }, {
    requestId: 'node-ssr-jsonl',
    endpointHandlers: {
      'ssr.hero': () => ({ html: '<x-hero data-rmt-stream="hero">Hero</x-hero>', trustBoundary: 'xtend.security.sanitizing-boundary.v1' }),
      'ssr.fragments': () => ({ html: '<x-section data-rmt-stream="fragment">Fragment</x-section>', trustBoundary: 'xtend.security.streaming-boundary.v1' }),
      'feed.live': () => ({ html: '<x-status data-rmt-stream="feed">Live</x-status>', trustBoundary: 'xtend.security.streaming-boundary.v1' }),
      'preview.render': () => ({ html: '<x-code data-rmt-stream="preview">Preview</x-code>', trustBoundary: 'xtend.security.streaming-boundary.v1' }),
      'panel.chunk': () => ({ html: '<x-summary data-rmt-stream="panel">Panel</x-summary>', trustBoundary: 'xtend.security.streaming-boundary.v1' })
    }
  }));
  const frameTypes = streamingFrames.map((frame) => frame.type);
  context.assert(streamingFrames.every((frame) => frame.schema === RMT_NODE_SSR_JSONL_FRAME_SCHEMA), 'JSONL stream uses stable frame schema');
  context.assert(frameTypes[0] === 'start', 'JSONL stream starts with start frame');
  context.assert(frameTypes.includes('html'), 'JSONL stream emits HTML frames');
  context.assert(frameTypes.includes('hydration'), 'JSONL stream emits hydration frame');
  context.assert(frameTypes[frameTypes.length - 1] === 'complete', 'JSONL stream completes deterministically');
  context.assert(streamingFrames.every((frame, index) => frame.sequence === index), 'JSONL stream sequence is deterministic');
  context.assert(streamingFrames[0].payload.cspPolicy && streamingFrames[0].payload.cspPolicy.schema === RMT_SSR_CSP_POLICY_SCHEMA, 'JSONL stream start frame carries CSP policy');
  context.assert(streamingFrames[0].payload.headers['Content-Security-Policy'].includes("object-src 'none'"), 'JSONL stream start frame carries CSP header');
  context.assert(streamingFrames.some((frame) => frame.variant === 'ssr' && frame.capability === 'stream.ssr.incremental'), 'JSONL stream exposes SSR incremental capability');
  context.assert(streamingFrames.some((frame) => frame.variant === 'hydration' && frame.capability === 'stream.hydration.chunked'), 'JSONL stream exposes chunked hydration capability');

  const missingResolverFrames = await collectJsonl(adapter.streamJsonl({
    source: streamingSource,
    filePath: 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt'
  }, { requestId: 'node-ssr-jsonl-missing' }));
  context.assert(missingResolverFrames.some((frame) => frame.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.node_ssr.datasource_missing')), 'JSONL stream reports missing explicit data source resolver');

  const unsafeRender = await adapter.render({
    descriptor: {
      type: 'html',
      trustBoundary: 'xtend.security.sanitizing-boundary.v1',
      html: '<img src="javascript:alert(1)" onerror="bad"><script>alert(1)</script><style>body{background:url(javascript:alert(1))}</style><svg onload="bad()"></svg><template><img src=x onerror="bad()"></template><x-status>Safe</x-status>'
    }
  }, { requestId: 'node-ssr-unsafe' });
  context.assert(!unsafeRender.html.includes('javascript:'), 'sanitizer removes unsafe URL protocols');
  context.assert(!unsafeRender.html.toLowerCase().includes('<script'), 'sanitizer removes blocked markup tags');
  context.assert(!/<\s*(style|svg|template)\b/iu.test(unsafeRender.html), 'sanitizer removes active style/svg/template markup');
  context.assert(!unsafeRender.html.includes('onerror'), 'sanitizer removes event attributes');
  context.assert(unsafeRender.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.node_ssr.html_sanitized'), 'sanitizer reports fallback cleanup diagnostic');

  const missingTrust = await adapter.render({
    descriptor: {
      type: 'html',
      html: '<x-status>Needs boundary</x-status>'
    }
  }, { requestId: 'node-ssr-missing-trust' });
  context.assert(missingTrust.ok === false, 'HTML fragments without trust boundary block render result');
  context.assert(missingTrust.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.node_ssr.trust_boundary_missing'), 'missing trust boundary diagnostic is emitted');

  context.assert(packageManifest.exports[RMT_NODE_SSR_ROOT_EXPORT].types === './xtendrmt/rmt-node-ssr-adapter.d.ts', 'root package exports Node SSR adapter types');
  context.assert(packageManifest.exports[RMT_NODE_SSR_ROOT_EXPORT].default === './xtendrmt/rmt-node-ssr-adapter.js', 'root package exports Node SSR adapter runtime');
  context.assert(xtendrmtManifest.exports[RMT_NODE_SSR_RUNTIME_EXPORT].types === './rmt-node-ssr-adapter.d.ts', 'runtime package exports Node SSR adapter types');
  context.assert(xtendrmtManifest.exports[RMT_NODE_SSR_RUNTIME_EXPORT].default === './rmt-node-ssr-adapter.js', 'runtime package exports Node SSR adapter runtime');
  context.assert(packageManifest.scripts['test:rmt-node-ssr-adapter'] === 'node scripts/run_xtend_tests.js rmt-node-ssr-adapter', 'package exposes Node SSR adapter test script');
  context.assert(packageManifest.scripts['test:rmt-vnext-primitives'].includes('rmt-node-ssr-adapter'), 'primitive aggregate includes Node SSR adapter suite');
  context.assert(packageManifest.scripts['test:rmt-vnext-primitives:report'].includes('rmt-node-ssr-adapter'), 'primitive report includes Node SSR adapter suite');
  context.assert((packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.suites || []).includes('rmt-node-ssr-adapter'), 'CI primitive gate includes Node SSR adapter suite');
  context.assert(runner.includes("id: 'rmt-node-ssr-adapter'"), 'test runner registers Node SSR adapter suite');
  context.assert(packageManifest.xtend.rmtNodeSsrAdapter.schema === RMT_NODE_SSR_ADAPTER_SCHEMA, 'package metadata records Node SSR adapter schema');
  context.assert(packageManifest.xtend.rmtNodeSsrAdapter.localGate === RMT_NODE_SSR_LOCAL_GATE, 'package metadata records Node SSR adapter local gate');
  context.assert(packageManifest.xtend.rmtNodeSsrAdapter.packageScript === RMT_NODE_SSR_PACKAGE_SCRIPT, 'package metadata records Node SSR adapter package script');

  ['docs/rmt-node-ssr-adapter.md', 'docs/de/rmt-node-ssr-adapter.md', 'docs/en/rmt-node-ssr-adapter.md'].forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists`);
    const doc = readText(docPath, rootDir);
    context.assert(doc.includes(RMT_NODE_SSR_ADAPTER_SCHEMA), `${docPath} documents adapter schema`);
    context.assert(doc.includes('JSONL'), `${docPath} documents JSONL streaming`);
    context.assert(doc.includes('Content-Security-Policy'), `${docPath} documents automatic CSP`);
    context.assert(doc.includes('createRmtNodeSsrAdapter'), `${docPath} documents public API`);
  });
  context.assert(readText('docs/quick-start-guide.md', rootDir).includes('rmt-node-ssr-adapter'), 'root quick start links Node SSR adapter');
  context.assert(readText('docs/de/quick-start-guide.md', rootDir).includes('rmt-node-ssr-adapter'), 'German quick start links Node SSR adapter');
  context.assert(readText('docs/en/quick-start-guide.md', rootDir).includes('rmt-node-ssr-adapter'), 'English quick start links Node SSR adapter');

  return context.result({
    schema: 'xtend.rmt.node-ssr-adapter-report.v1',
    adapterSchema: RMT_NODE_SSR_ADAPTER_SCHEMA,
    localGate: RMT_NODE_SSR_LOCAL_GATE,
    packageScript: RMT_NODE_SSR_PACKAGE_SCRIPT,
    renderAssertions: context.passes.length,
    diagnostics: {
      descriptor: descriptorRender.diagnostics.length,
      source: sourceRender.diagnostics.length,
      streamingFrames: streamingFrames.length
    }
  });
}

function printRmtNodeSsrAdapterReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Node SSR Adapter erfolgreich.',
    failureTitle: 'RMT Node SSR Adapter fehlgeschlagen:'
  });
}

module.exports = {
  RMT_NODE_SSR_ADAPTER_PATH,
  RMT_NODE_SSR_ADAPTER_SCHEMA,
  RMT_NODE_SSR_JSONL_FRAME_SCHEMA,
  RMT_NODE_SSR_RENDER_RESULT_SCHEMA,
  printRmtNodeSsrAdapterReport,
  runRmtNodeSsrAdapterSuite
};
