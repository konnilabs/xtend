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
const {
  compileRmtVNextBridgePayload
} = require('../../scripts/compile_rmt_vnext_bridge');

const DOCS_PHP_SSR_SCHEMA = 'xtend.docs.php-ssr-prehydration.v1';
const DOCS_COMPILER_BRIDGE_SCHEMA = 'xtend.docs.rmt-compiler-bridge.v1';
const DOCS_SSR_ENDPOINT_SCHEMA = 'xtend.docs.rmt-ssr-endpoint.v1';
const DOCS_SHELL_PRIMITIVES_SCHEMA = 'xtend.docs.rmt-shell-primitives.v1';
const DOCS_SHELL_SOURCE = 'docs/xtendrmt-docs-shell-vnext.rmt';
const DOCS_PHP_SSR_LOCAL_GATE = 'node scripts/run_xtend_tests.js docs-php-ssr-prehydration --json';
const DOCS_PHP_SSR_PACKAGE_SCRIPT = 'npm run test:docs-php-ssr-prehydration';

function fileExists(relativePath, rootDir) {
  return fs.existsSync(resolveRepoPath(relativePath, rootDir));
}

function phpSyntax(relativePath, rootDir) {
  const result = spawnSync('php', ['-l', resolveRepoPath(relativePath, rootDir)], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  return {
    ok: result.status === 0,
    message: (result.stderr || result.stdout || '').trim()
  };
}

function nodeCheck(relativePath, rootDir) {
  const result = spawnSync(process.execPath, ['--check', resolveRepoPath(relativePath, rootDir)], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  return {
    ok: result.status === 0,
    message: (result.stderr || result.stdout || '').trim()
  };
}

function checkInlineScriptSyntax(html, rootDir) {
  const scripts = Array.from(String(html || '').matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/giu))
    .map((match) => match[1]);
  const failures = [];
  scripts.forEach((script, index) => {
    const tempPath = path.join(os.tmpdir(), `xtend-docs-inline-bootstrap-${index}.js`);
    fs.writeFileSync(tempPath, script);
    const result = spawnSync(process.execPath, ['--check', tempPath], {
      cwd: rootDir,
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      failures.push((result.stderr || result.stdout || `inline script ${index + 1} failed`).trim());
    }
  });
  return {
    ok: failures.length === 0,
    count: scripts.length,
    message: failures.join('\n')
  };
}

function runDocsIndex(rootDir, getParams = {}) {
  const code = [
    `chdir(${JSON.stringify(rootDir)});`,
    `$_GET = json_decode(${JSON.stringify(JSON.stringify(getParams))}, true);`,
    'include "docs/index.php";'
  ].join(' ');
  return spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024
  });
}

function parseJsonl(value) {
  return String(value || '')
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function runCompilerBridge(rootDir, source) {
  const payload = compileRmtVNextBridgePayload({
      source,
      filePath: DOCS_SHELL_SOURCE
  });
  return {
    status: payload.ok ? 0 : 2,
    payload,
    stderr: ''
  };
}

function runDocsPhpSsrPrehydrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'docs-php-ssr-prehydration',
    label: 'Docs-App PHP SSR Prehydration'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const source = readText(DOCS_SHELL_SOURCE, rootDir);
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: DOCS_SHELL_SOURCE
  }, {
    filePath: DOCS_SHELL_SOURCE
  });
  const bridgeResult = runCompilerBridge(rootDir, source);
  const htmlResult = runDocsIndex(rootDir, {});
  const jsonlResult = runDocsIndex(rootDir, {
    'xtend-docs-rmt-ssr': 'shell',
    format: 'jsonl',
    page: 'readme',
    locale: 'de'
  });
  const html = htmlResult.stdout || '';
  const inlineScriptSyntax = checkInlineScriptSyntax(html, rootDir);
  const jsonl = jsonlResult.stdout || '';
  const frames = jsonlResult.status === 0 ? parseJsonl(jsonl) : [];
  const frameTypes = frames.map((frame) => frame.type);

  context.assert(fileExists(DOCS_SHELL_SOURCE, rootDir), 'Docs vNext shell source exists');
  context.assert(fileExists('scripts/compile_rmt_vnext_bridge.js', rootDir), 'Docs compiler bridge runner exists');
  context.assert(fileExists('xtendrmt/rmt-php-ssr-adapter.php', rootDir), 'PHP SSR adapter exists for docs host');
  const indexSyntax = phpSyntax('docs/index.php', rootDir);
  context.assert(indexSyntax.ok, `docs/index.php passes PHP syntax${indexSyntax.ok ? '' : ` (${indexSyntax.message})`}`);
  const adapterSyntax = phpSyntax('xtendrmt/rmt-php-ssr-adapter.php', rootDir);
  context.assert(adapterSyntax.ok, `PHP SSR adapter passes syntax${adapterSyntax.ok ? '' : ` (${adapterSyntax.message})`}`);
  const bridgeSyntax = nodeCheck('scripts/compile_rmt_vnext_bridge.js', rootDir);
  context.assert(bridgeSyntax.ok, `compiler bridge passes node --check${bridgeSyntax.ok ? '' : ` (${bridgeSyntax.message})`}`);

  context.assert(compileResult.ok === true, 'Docs vNext shell compiles through the JS vNext compiler');
  context.assert(compileResult.coreDocument && compileResult.coreDocument.schema === 'xtend.rmt.core-format.vnext.v1', 'Docs vNext shell emits Core Document schema');
  const surfaceIds = (compileResult.coreDocument && compileResult.coreDocument.surfaces || []).map((surface) => surface.id);
  const surfaceNames = (compileResult.coreDocument && compileResult.coreDocument.surfaces || []).map((surface) => surface.name || surface.id);
  ['docs.root', 'docs.header', 'docs.hero', 'docs.router', 'docs.page', 'docs.sidebar', 'docs.footer', 'docs.diagnostics'].forEach((surfaceId) => {
    context.assert(surfaceNames.includes(surfaceId) || surfaceIds.some((id) => String(id).endsWith('/' + surfaceId)), `Docs vNext shell contains ${surfaceId} surface`);
  });
  context.assert(bridgeResult.payload && bridgeResult.payload.schema === DOCS_COMPILER_BRIDGE_SCHEMA, 'Compiler bridge emits docs bridge schema');
  context.assert(bridgeResult.payload && bridgeResult.payload.ok === true, 'Compiler bridge compiles the docs shell source');
  context.assert(bridgeResult.payload && bridgeResult.payload.coreDocument && bridgeResult.payload.coreDocument.schema === 'xtend.rmt.core-format.vnext.v1', 'Compiler bridge returns Core Document data');

  context.assert(indexPhp.includes('rmt-php-ssr-adapter.php'), 'Docs host includes the PHP SSR adapter');
  context.assert(indexPhp.includes('compile_rmt_vnext_bridge.js'), 'Docs host references the compiler bridge runner');
  context.assert(indexPhp.includes('createRmtPhpSsrAdapter'), 'Docs host creates the PHP SSR adapter');
  context.assert(indexPhp.includes('compileRmtVNextSource'), 'Docs host injects compileRmtVNextSource through a Node bridge');
  context.assert(indexPhp.includes('xtend-docs-rmt-ssr'), 'Docs host exposes the RMT SSR endpoint');
  context.assert(indexPhp.includes(DOCS_PHP_SSR_SCHEMA), 'Docs host records prehydration schema');
  context.assert(indexPhp.includes(DOCS_SSR_ENDPOINT_SCHEMA), 'Docs host records SSR endpoint schema');
  context.assert(indexPhp.includes(DOCS_SHELL_PRIMITIVES_SCHEMA), 'Docs host records shell primitives schema');
  context.assert(indexPhp.includes('docsBuildDocsRootShellDescriptor'), 'Docs host builds the shell as RMT DOM descriptors');
  context.assert(indexPhp.includes('server_prerender_hydrate'), 'Docs host uses server prerender hydrate mode');

  context.assert(htmlResult.status === 0, `Docs initial HTML renders through PHP${htmlResult.status === 0 ? '' : ` (${htmlResult.stderr})`}`);
  context.assert(inlineScriptSyntax.ok, `Docs initial inline bootstrap scripts pass node --check${inlineScriptSyntax.ok ? '' : ` (${inlineScriptSyntax.message})`}`);
  context.assert(!html.includes('window.xtendDocsLocalizedPagesMeta = ;'), 'Docs bootstrap never emits an empty localized metadata assignment');
  context.assert(html.includes('window.xtendDocsSsrPrehydration'), 'Initial HTML exposes SSR prehydration payload');
  context.assert(html.includes(DOCS_PHP_SSR_SCHEMA), 'Initial HTML includes docs SSR prehydration schema');
  context.assert(html.includes('rmt_template_chunk'), 'Initial HTML exposes Rmt template chunk shape');
  context.assert(html.includes('server_prerender_hydrate'), 'Initial HTML exposes server prerender hydrate mode');
  context.assert(html.includes('data-rmt-ssr-root="docs.app.root-shell"'), 'Initial HTML marks SSR root shell');
  context.assert(html.includes('data-rmt-shell-prehydrated="true"'), 'Initial HTML marks prehydrated shell');
  context.assert(html.includes('data-rmt-hydration-mode="server_prerender_hydrate"'), 'Initial HTML marks hydration mode');
  context.assert(html.includes('data-docs-route-boot-skeleton'), 'Initial HTML contains a route skeleton before the client runtime upgrades XRouter');
  context.assert(html.includes('data-xtend-skeleton-fallback'), 'Initial route skeleton opts into the shared pre-upgrade fallback contract');
  context.assert(html.includes('data-rmt-component-capability="x-router"'), 'Initial HTML includes XRouter capability marker');
  context.assert(html.includes('<x-route path="/docs/de/readme"'), 'Initial HTML renders history route records inside the router shell');
  context.assert(!html.includes('rmt.php_ssr.compiler_required'), 'Initial HTML does not report missing compiler bridge');

  context.assert(jsonlResult.status === 0, `Docs JSONL endpoint renders through PHP${jsonlResult.status === 0 ? '' : ` (${jsonlResult.stderr})`}`);
  ['start', 'component', 'html', 'hydration', 'complete'].forEach((type) => {
    context.assert(frameTypes.includes(type), `JSONL endpoint emits ${type} frame`);
  });
  context.assert(frames.every((frame, index) => frame.sequence === index), 'JSONL endpoint sequences frames deterministically');
  context.assert(frames.every((frame) => frame.schema === 'xtend.rmt.node-ssr-jsonl-frame.v1'), 'JSONL endpoint uses Node-compatible frame schema');
  context.assert(!jsonl.includes('rmt.php_ssr.compiler_required'), 'JSONL endpoint does not report missing compiler bridge');
  context.assert(!jsonl.includes('rmt.php_ssr.datasource_missing'), 'JSONL endpoint resolves docs shell data sources explicitly');

  context.assert(pageLoader.includes('getDocsSsrPrehydration'), 'Page loader detects SSR prehydration state');
  context.assert(pageLoader.includes('findPrehydratedDocsShell'), 'Page loader can discover prehydrated docs shells');
  context.assert(pageLoader.includes('adoptPrehydratedDocsShell'), 'Page loader can adopt server-rendered docs shells');
  context.assert(pageLoader.includes('data-rmt-ssr-reused'), 'Page loader marks reused SSR shells');
  context.assert(pageLoader.includes('createRmtDocsShell'), 'Page loader keeps the client fallback shell');
  context.assert(pageLoader.includes("data-docs-shell-reused', 'ssr'"), 'Page loader prefers SSR shell reuse before fallback');
  context.assert(pageLoader.includes('phpSsrPrehydration: getDocsSsrPrehydration()'), 'Page loader reports SSR prehydration in render telemetry');

  context.assert(packageManifest.scripts['test:docs-php-ssr-prehydration'] === 'node scripts/run_xtend_tests.js docs-php-ssr-prehydration', 'package exposes docs PHP SSR prehydration script');
  context.assert(runner.includes("id: 'docs-php-ssr-prehydration'"), 'test runner registers docs PHP SSR prehydration suite');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.schema === DOCS_PHP_SSR_SCHEMA, 'package metadata records docs SSR schema');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.compilerBridgeSchema === DOCS_COMPILER_BRIDGE_SCHEMA, 'package metadata records compiler bridge schema');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.localGate === DOCS_PHP_SSR_LOCAL_GATE, 'package metadata records local gate');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.docsAppIntegrationStatus === 'active-docs-php-ssr-prehydration', 'PHP adapter metadata marks docs app integration active');

  return context.result({
    schema: 'xtend.docs.php-ssr-prehydration-report.v1',
    prehydrationSchema: DOCS_PHP_SSR_SCHEMA,
    compilerBridgeSchema: DOCS_COMPILER_BRIDGE_SCHEMA,
    endpointSchema: DOCS_SSR_ENDPOINT_SCHEMA,
    shellPrimitivesSchema: DOCS_SHELL_PRIMITIVES_SCHEMA,
    localGate: DOCS_PHP_SSR_LOCAL_GATE,
    packageScript: DOCS_PHP_SSR_PACKAGE_SCRIPT,
    frameCount: frames.length,
    surfaceCount: surfaceIds.length
  });
}

function printDocsPhpSsrPrehydrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Docs-App PHP SSR Prehydration erfolgreich.',
    failureTitle: 'Docs-App PHP SSR Prehydration fehlgeschlagen:'
  });
}

module.exports = {
  DOCS_COMPILER_BRIDGE_SCHEMA,
  DOCS_PHP_SSR_LOCAL_GATE,
  DOCS_PHP_SSR_PACKAGE_SCRIPT,
  DOCS_PHP_SSR_SCHEMA,
  DOCS_SHELL_PRIMITIVES_SCHEMA,
  DOCS_SSR_ENDPOINT_SCHEMA,
  runDocsPhpSsrPrehydrationSuite,
  printDocsPhpSsrPrehydrationReport
};
