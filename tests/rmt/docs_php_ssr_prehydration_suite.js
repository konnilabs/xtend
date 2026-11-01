const fs = require('fs');
const {JSDOM} = require('jsdom');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
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
const {
  sanitizeTrustedDomHtml
} = require('../../security/trusted-dom-policy');

const DOCS_PHP_SSR_SCHEMA = 'xtend.docs.php-ssr-prehydration.v2';
const DOCS_PHP_SSR_LEGACY_SCHEMA = 'xtend.docs.php-ssr-prehydration.v1';
const DOCS_PHP_SSR_REPORT_SCHEMA = 'xtend.docs.php-ssr-prehydration-report.v2';
const DOCS_PHP_SSR_LEGACY_REPORT_SCHEMA = 'xtend.docs.php-ssr-prehydration-report.v1';
const DOCS_COMPILER_BRIDGE_SCHEMA = 'xtend.docs.rmt-compiler-bridge.v1';
const DOCS_SSR_ENDPOINT_SCHEMA = 'xtend.docs.rmt-ssr-endpoint.v2';
const DOCS_SSR_ENDPOINT_LEGACY_SCHEMA = 'xtend.docs.rmt-ssr-endpoint.v1';
const DOCS_SHELL_PRIMITIVES_SCHEMA = 'xtend.docs.rmt-shell-primitives.v2';
const DOCS_SHELL_PRIMITIVES_LEGACY_SCHEMA = 'xtend.docs.rmt-shell-primitives.v1';
const DOCS_SHELL_SOURCE = 'docs/xtendrmt-docs-shell-vnext.rmt';
const DOCS_DOCUMENT_V2_SOURCE = 'docs/xtendrmt-docs-document-v2.rmt';
const DOCS_DOCUMENT_V2_CORE = 'docs/xtendrmt-docs-document-v2.core.json';
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
  const scripts = Array.from(String(html || '').matchAll(/<script\b(?![^>]*\bsrc=)(?![^>]*\btype=["']application\/json["'])[^>]*>([\s\S]*?)<\/script>/giu))
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

function runDocsIndex(rootDir, getParams = {}, options = {}) {
  const code = [
    `chdir(${JSON.stringify(rootDir)});`,
    `$_SERVER['SCRIPT_NAME'] = '/docs/index.php';`,
    `$_SERVER['REQUEST_URI'] = ${JSON.stringify(options.requestUri || '/docs/de/readme')};`,
    `$_SERVER['HTTP_ACCEPT'] = ${JSON.stringify(options.accept || 'text/html')};`,
    `$_GET = json_decode(${JSON.stringify(JSON.stringify(getParams))}, true);`,
    'include "docs/index.php";'
  ].join(' ');
  return spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    env: {
      ...process.env,
      ...(Object.prototype.hasOwnProperty.call(options, 'documentSsr')
        ? { XTEND_DOCS_DOCUMENT_SSR: options.documentSsr }
        : {}),
      ...(options.env || {})
    },
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024
  });
}

function docsMarkdownSlug(relativePath) {
  return String(relativePath || '')
    .replace(/\.md$/iu, '')
    .replace(/[^a-z0-9]+/giu, '-')
    .toLowerCase();
}

function findLargestLocalizedMarkdownPage(rootDir, locale) {
  const localeDir = resolveRepoPath(`docs/${locale}`, rootDir);
  const pages = [];
  const visit = (directory, prefix = '') => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
      } else if (entry.isFile() && /\.md$/iu.test(entry.name)) {
        pages.push({
          absolutePath,
          relativePath,
          bytes: fs.statSync(absolutePath).size
        });
      }
    });
  };
  visit(localeDir);
  pages.sort((left, right) => right.bytes - left.bytes || left.relativePath.localeCompare(right.relativePath));
  const largest = pages[0];
  if (!largest) return null;
  return {
    ...largest,
    slug: docsMarkdownSlug(largest.relativePath)
  };
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"'
  };
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/giu, (_match, digits) => String.fromCodePoint(Number.parseInt(digits, 16)))
    .replace(/&#([0-9]+);/gu, (_match, digits) => String.fromCodePoint(Number.parseInt(digits, 10)))
    .replace(/&([a-z]+);/giu, (match, name) => namedEntities[name.toLowerCase()] ?? match);
}

function normalizeVisibleText(value) {
  return decodeHtmlEntities(value)
    .replace(/\s+/gu, ' ')
    .replace(/\s+([,.;:!?])/gu, '$1')
    .trim();
}

function htmlVisibleText(value) {
  return normalizeVisibleText(String(value || '').replace(/<[^>]+>/gu, ' '));
}

function markdownInlineText(value) {
  return normalizeVisibleText(String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/[`*_~]/gu, '')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/gu, '$1'));
}

function markdownSeoContent(markdown) {
  const lines = String(markdown || '').split(/\r?\n/gu);
  let title = '';
  let lead = '';
  let insideFence = false;
  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    if (/^```/u.test(line)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence || line === '') continue;
    if (title === '') {
      const titleMatch = line.match(/^#\s+(.+)$/u);
      if (titleMatch) {
        title = markdownInlineText(titleMatch[1]);
        continue;
      }
    }
    if (
      /^#{1,6}\s/u.test(line)
      || /^\|/u.test(line)
      || /^[-*+]\s/u.test(line)
      || /^\d+[.)]\s/u.test(line)
      || /^<!--/u.test(line)
    ) {
      continue;
    }
    const candidate = markdownInlineText(line.replace(/^>\s?/u, ''));
    if (candidate.length >= 24) {
      lead = candidate;
      break;
    }
  }
  return { title, lead };
}

function buildRawHtmlSeoMatrix(rootDir) {
  return ['de', 'en'].flatMap((locale) => {
    const largest = findLargestLocalizedMarkdownPage(rootDir, locale);
    const definitions = [
      { id: 'readme', slug: 'readme', relativePath: 'README.md', requiresInternalLink: true },
      { id: 'manifest', slug: 'manifest', relativePath: 'manifest.md', requiresInternalLink: true },
      {
        id: 'code-table',
        slug: 'rmt-reference-actions-events',
        relativePath: 'rmt-reference-actions-events.md',
        requiresCodeAndTable: true,
        requiresInternalLink: true
      },
      {
        id: 'nested-links',
        slug: 'components-xtend-i18n',
        relativePath: 'components/xtend-i18n.md',
        requiresInternalLink: true,
        expectedLocalizedTargets: ['components', 'public-component-types', 'components-xtend-state', 'components-xrouter']
      },
      {
        id: 'largest',
        slug: largest && largest.slug,
        relativePath: largest && largest.relativePath,
        bytes: largest && largest.bytes
      }
    ];
    return definitions.map((definition) => {
      const markdownPath = definition.relativePath
        ? resolveRepoPath(`docs/${locale}/${definition.relativePath}`, rootDir)
        : null;
      const markdown = markdownPath && fs.existsSync(markdownPath)
        ? fs.readFileSync(markdownPath, 'utf8')
        : '';
      return {
        ...definition,
        requiresInternalLink: definition.requiresInternalLink === true
          || (definition.id === 'largest' && /\]\(\.\/[a-z0-9_./-]+\.md(?:#[^)]+)?\)/iu.test(markdown)),
        locale,
        markdownPath,
        markdown,
        seo: markdownSeoContent(markdown)
      };
    });
  });
}

function runRawHtmlSeoCase(rootDir, fixture) {
  const result = runDocsIndex(rootDir, {}, {
    documentSsr: 'v2',
    requestUri: `/docs/${fixture.locale}/${fixture.slug || ''}`
  });
  const html = result.stdout || '';
  const articles = Array.from(html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/giu));
  const articleAttributes = articles[0] ? articles[0][1] : '';
  const articleHtml = articles[0] ? articles[0][2] : '';
  const articleText = htmlVisibleText(articleHtml);
  const articleHeadingMatch = articleHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu);
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/iu);
  const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/iu);
  const prerenderedRouteTags = Array.from(html.matchAll(/<[a-z][a-z0-9-]*\b[^>]*\bdata-xrouter-prerendered-route(?:="[^"]*")?[^>]*>/giu))
    .map((match) => match[0]);
  const bootSkeletonMatch = html.match(/<[a-z][a-z0-9-]*\b[^>]*\bdata-docs-route-boot-skeleton="true"[^>]*>/iu);
  return {
    ...fixture,
    result,
    html,
    articles,
    articleAttributes,
    articleHtml,
    articleText,
    articleHeading: articleHeadingMatch ? htmlVisibleText(articleHeadingMatch[1]) : '',
    documentTitle: titleMatch ? htmlVisibleText(titleMatch[1]) : '',
    description: descriptionMatch ? decodeHtmlEntities(descriptionMatch[1]).trim() : '',
    prerenderedRouteTags,
    bootSkeletonTag: bootSkeletonMatch ? bootSkeletonMatch[0] : ''
  };
}

function parseJsonl(value) {
  return String(value || '')
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function runDocsSanitizerProbe(rootDir, input) {
  const encodedInput = Buffer.from(String(input || ''), 'utf8').toString('base64');
  const code = [
    `chdir(${JSON.stringify(rootDir)});`,
    `$_SERVER['SCRIPT_NAME'] = '/docs/index.php';`,
    `$_SERVER['REQUEST_URI'] = '/docs/de/readme';`,
    '$_GET = [];',
    'ob_start();',
    'include "docs/index.php";',
    'ob_end_clean();',
    `echo json_encode(['html' => docsSanitizeParsedownHtml(base64_decode(${JSON.stringify(encodedInput)}))]);`
  ].join(' ');
  const result = spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    env: { ...process.env, XTEND_DOCS_DOCUMENT_SSR: 'off' },
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024
  });
  return {
    ...result,
    payload: result.status === 0 ? JSON.parse(result.stdout || '{}') : null
  };
}

function runDocsMarkdownLinkProbe(rootDir) {
  const input = [
    '<a href="./xtendState.md?view=api#events">sibling</a>',
    '<a href="../components.md#overview">parent</a>',
    '<a href="./missing.md">missing</a>',
    '<a href="../../escape.md">escape</a>',
    '<a href="https://example.com/reference.md">external</a>',
    '<a href="/reference.md">absolute</a>'
  ].join('');
  const encodedInput = Buffer.from(input, 'utf8').toString('base64');
  const fileToSlug = {
    'components/xtend-state.md': 'components-xtend-state',
    'components.md': 'components'
  };
  const code = [
    `chdir(${JSON.stringify(rootDir)});`,
    `$_SERVER['SCRIPT_NAME'] = '/docs/index.php';`,
    `$_SERVER['REQUEST_URI'] = '/docs/en/components-xtend-i18n';`,
    '$_GET = [];',
    'ob_start();',
    'include "docs/index.php";',
    'ob_end_clean();',
    `echo json_encode(['html' => docsNormalizeServerMarkdownLinks(base64_decode(${JSON.stringify(encodedInput)}), 'components/xtend-i18n.md', json_decode(${JSON.stringify(JSON.stringify(fileToSlug))}, true), 'en', '/docs')]);`
  ].join(' ');
  const result = spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    env: { ...process.env, XTEND_DOCS_DOCUMENT_SSR: 'off' },
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024
  });
  return {
    ...result,
    input,
    payload: result.status === 0 ? JSON.parse(result.stdout || '{}') : null
  };
}

async function runCompilerBridge(rootDir, source, sourceRef = DOCS_SHELL_SOURCE) {
  const payload = await compileRmtVNextBridgePayload({
      source,
      filePath: sourceRef
  });
  return {
    status: payload.ok ? 0 : 2,
    payload,
    stderr: ''
  };
}

async function runDocsPhpSsrPrehydrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'docs-php-ssr-prehydration',
    label: 'Docs-App PHP SSR Prehydration'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const pageLoader = readText('docs/utils/page/route-controller.mjs', rootDir);
  const routerSource = readText('components/xrouter.js', rootDir);
  const ssrCodeEnhancementSource = (pageLoader.match(
    /function scheduleDocsSsrCodeEnhancement\([\s\S]*?(?=\nfunction bindDocsDemoInteractions)/u
  ) || [''])[0];
  const source = readText(DOCS_SHELL_SOURCE, rootDir);
  const documentV2Source = readText(DOCS_DOCUMENT_V2_SOURCE, rootDir);
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: DOCS_SHELL_SOURCE
  }, {
    filePath: DOCS_SHELL_SOURCE
  });
  const documentV2CompileResult = compileRmtVNextSource({
    text: documentV2Source,
    filePath: DOCS_DOCUMENT_V2_SOURCE
  }, {
    filePath: DOCS_DOCUMENT_V2_SOURCE
  });
  const documentV2Core = readJson(DOCS_DOCUMENT_V2_CORE, rootDir);
  const documentV2SourceSha256 = crypto.createHash('sha256').update(documentV2Source).digest('hex');
  const bridgeResult = await runCompilerBridge(rootDir, source);
  const legacyHtmlResult = runDocsIndex(rootDir, {}, { documentSsr: 'off' });
  const htmlResult = runDocsIndex(rootDir, {});
  const componentsHtmlResult = runDocsIndex(rootDir, {}, { requestUri: '/docs/de/components/' });
  const routeFragmentResult = runDocsIndex(rootDir, {}, {
    requestUri: '/docs/en/components-xbutton',
    accept: 'application/vnd.xtend.rmt-route+json'
  });
  const jsonlResult = runDocsIndex(rootDir, {
    'xtend-docs-rmt-ssr': 'shell',
    format: 'jsonl',
    page: 'readme',
    locale: 'de'
  });
  const documentJsonlResult = runDocsIndex(rootDir, {
    'xtend-docs-rmt-ssr': 'document',
    format: 'jsonl',
    page: 'readme',
    locale: 'de'
  }, { documentSsr: 'v2' });
  const html = htmlResult.stdout || '';
  const componentsHtml = componentsHtmlResult.stdout || '';
  const legacyHtml = legacyHtmlResult.stdout || '';
  const routeFragment = routeFragmentResult.status === 0
    ? JSON.parse(routeFragmentResult.stdout || '{}')
    : null;
  const inlineScriptSyntax = checkInlineScriptSyntax(html, rootDir);
  const jsonl = jsonlResult.stdout || '';
  const frames = jsonlResult.status === 0 ? parseJsonl(jsonl) : [];
  const documentJsonl = documentJsonlResult.stdout || '';
  const documentFrames = documentJsonlResult.status === 0 ? parseJsonl(documentJsonl) : [];
  const frameTypes = frames.map((frame) => frame.type);
  const expectedV1FrameTypes = [
    'start',
    ...Array(15).fill('component'),
    ...Array(11).fill('html'),
    'hydration',
    'complete'
  ];
  const expectedV1ComponentCapabilities = [
    'x-theme', 'x-header', 'x-link', 'x-form', 'x-popover', 'x-input', 'x-status', 'x-icon',
    'x-select', 'x-button', 'x-menu', 'x-summary', 'x-hero', 'x-router', 'x-footer'
  ];
  const expectedV1HtmlDataSources = [
    null,
    'dataSource:xtend.docs.php_ssr_shell/docs.root/critical/0',
    'dataSource:docs.shell.ssr',
    'dataSource:xtend.docs.php_ssr_shell/docs.header/critical/0',
    'dataSource:xtend.docs.php_ssr_shell/docs.hero/visible/0',
    'dataSource:xtend.docs.php_ssr_shell/docs.router/visible/0',
    'dataSource:docs.page.payload',
    'dataSource:xtend.docs.php_ssr_shell/docs.page/visible/0',
    'dataSource:xtend.docs.php_ssr_shell/docs.sidebar/visible/0',
    'dataSource:xtend.docs.php_ssr_shell/docs.footer/visible/0',
    'dataSource:docs.shell.ssr'
  ];
  const hostileMarkup = '<p onclick="alert(1)">safe</p><script>alert(1)</script><iframe src="/bad"></iframe>'
    + '<a href="javascript:alert(1)">js</a><a href="vbscript:msgbox(1)">vbs</a>'
    + '<img src="data:text/html;base64,PHNjcmlwdD4=" onerror="alert(1)">'
    + '<a href="/docs/de/readme">allowed</a>';
  const phpSanitizer = runDocsSanitizerProbe(rootDir, hostileMarkup);
  const markdownLinkProbe = runDocsMarkdownLinkProbe(rootDir);
  const browserWindow = new JSDOM('').window;
  const browserPolicySanitizer = sanitizeTrustedDomHtml(hostileMarkup, { markupClass: 'parsedownHtml', windowTarget: browserWindow });
  const dataImage = '<img src="data:image/png;base64,AA==">';
  const phpDataImage = runDocsSanitizerProbe(rootDir, dataImage);
  const browserDataImage = sanitizeTrustedDomHtml(dataImage, {windowTarget: browserWindow});
  browserWindow.close();
  const rawHtmlSeoMatrix = buildRawHtmlSeoMatrix(rootDir).map((fixture) => runRawHtmlSeoCase(rootDir, fixture));

  context.assert(fileExists(DOCS_SHELL_SOURCE, rootDir), 'Docs vNext shell source exists');
  context.assert(fileExists(DOCS_DOCUMENT_V2_SOURCE, rootDir), 'Docs document-SSR V2 source exists');
  context.assert(fileExists(DOCS_DOCUMENT_V2_CORE, rootDir), 'Docs document-SSR V2 precompiled Core artifact exists');
  context.assert(fileExists('scripts/compile_rmt_vnext_bridge.js', rootDir), 'Docs compiler bridge runner exists');
  context.assert(fileExists('xtendrmt/rmt-php-ssr-adapter.php', rootDir), 'PHP SSR adapter exists for docs host');
  const indexSyntax = phpSyntax('docs/index.php', rootDir);
  context.assert(indexSyntax.ok, `docs/index.php passes PHP syntax${indexSyntax.ok ? '' : ` (${indexSyntax.message})`}`);
  ['docs/de/components/index.php', 'docs/en/components/index.php'].forEach((relativePath) => {
    const syntax = phpSyntax(relativePath, rootDir);
    context.assert(syntax.ok, `${relativePath} passes PHP syntax${syntax.ok ? '' : ` (${syntax.message})`}`);
  });
  const adapterSyntax = phpSyntax('xtendrmt/rmt-php-ssr-adapter.php', rootDir);
  context.assert(adapterSyntax.ok, `PHP SSR adapter passes syntax${adapterSyntax.ok ? '' : ` (${adapterSyntax.message})`}`);
  const bridgeSyntax = nodeCheck('scripts/compile_rmt_vnext_bridge.js', rootDir);
  context.assert(bridgeSyntax.ok, `compiler bridge passes node --check${bridgeSyntax.ok ? '' : ` (${bridgeSyntax.message})`}`);

  context.assert(compileResult.ok === true, 'Docs vNext shell compiles through the JS vNext compiler');
  context.assert(compileResult.coreDocument && compileResult.coreDocument.schema === 'xtend.rmt.core-format.vnext.v1', 'Docs vNext shell emits Core Document schema');
  context.assert(!source.includes('docs.document.ssr') && !source.includes('DocsDocumentSsrFramesV2') && !source.includes('docs-page-document'), 'V1 shell source remains free of V2 document declarations');
  context.assert(source.includes('hydrate docs-page-shell from endpoint xtendrmt.docs.parsedown.parse'), 'V1 shell source retains its legacy page hydration lane');
  context.assert(documentV2Source.includes('datasource docs.document.ssr') && documentV2Source.includes('mount docs-page-document from endpoint xtendrmt.docs.php-ssr.document'), 'Docs V2 source owns the document datasource and critical mount');
  const surfaceIds = (compileResult.coreDocument && compileResult.coreDocument.surfaces || []).map((surface) => surface.id);
  const surfaceNames = (compileResult.coreDocument && compileResult.coreDocument.surfaces || []).map((surface) => surface.name || surface.id);
  ['docs.root', 'docs.header', 'docs.hero', 'docs.router', 'docs.page', 'docs.sidebar', 'docs.footer', 'docs.diagnostics'].forEach((surfaceId) => {
    context.assert(surfaceNames.includes(surfaceId) || surfaceIds.some((id) => String(id).endsWith('/' + surfaceId)), `Docs vNext shell contains ${surfaceId} surface`);
  });
  context.assert(bridgeResult.payload && bridgeResult.payload.schema === DOCS_COMPILER_BRIDGE_SCHEMA, 'Compiler bridge emits docs bridge schema');
  context.assert(bridgeResult.payload && bridgeResult.payload.ok === true, 'Compiler bridge compiles the docs shell source');
  context.assert(bridgeResult.payload && bridgeResult.payload.coreDocument && bridgeResult.payload.coreDocument.schema === 'xtend.rmt.core-format.vnext.v1', 'Compiler bridge returns Core Document data');
  context.assert(documentV2CompileResult.ok === true && documentV2CompileResult.coreDocument && documentV2CompileResult.coreDocument.schema === 'xtend.rmt.core-format.vnext.v1', 'Docs document-SSR V2 source compiles to Core Document schema');
  context.assert(JSON.stringify(documentV2Core) === JSON.stringify(documentV2CompileResult.coreDocument), 'Precompiled document-SSR Core artifact is byte-structurally equivalent to the current compiler output');
  context.assert(indexPhp.includes(`$docsRmtDocumentV2SourceSha256 = '${documentV2SourceSha256}'`), 'Docs host binds the precompiled Core artifact to the exact V2 source SHA-256');
  context.assert(indexPhp.includes('docsCreatePrecompiledRmtCompilerBridge') && indexPhp.includes("'status' => 'compiled-prebuilt'"), 'Docs host uses the source-bound precompiled Core with the Node compiler bridge as fallback');

  context.assert(indexPhp.includes('rmt-php-ssr-adapter.php'), 'Docs host includes the PHP SSR adapter');
  context.assert(indexPhp.includes('tools/tooling-bridge-cli.js'), 'Docs host references the official compiler tooling bridge runner');
  context.assert(indexPhp.includes('createRmtPhpSsrAdapter'), 'Docs host creates the PHP SSR adapter');
  context.assert(indexPhp.includes('compileRmtVNextSource'), 'Docs host injects compileRmtVNextSource through a Node bridge');
  context.assert(indexPhp.includes('xtend-docs-rmt-ssr'), 'Docs host exposes the RMT SSR endpoint');
  context.assert(indexPhp.includes(DOCS_PHP_SSR_SCHEMA), 'Docs host records prehydration schema');
  context.assert(indexPhp.includes(DOCS_SSR_ENDPOINT_SCHEMA), 'Docs host records SSR endpoint schema');
  context.assert(indexPhp.includes(DOCS_SHELL_PRIMITIVES_SCHEMA), 'Docs host records shell primitives schema');
  context.assert(indexPhp.includes(DOCS_PHP_SSR_LEGACY_SCHEMA), 'Docs host retains the V1 prehydration reader and fallback');
  context.assert(indexPhp.includes(DOCS_SSR_ENDPOINT_LEGACY_SCHEMA), 'Docs host retains the V1 shell endpoint contract');
  context.assert(indexPhp.includes(DOCS_SHELL_PRIMITIVES_LEGACY_SCHEMA), 'Docs host retains the V1 shell primitives contract');
  context.assert(indexPhp.includes('docsBuildDocsRootShellDescriptor'), 'Docs host builds the shell as RMT DOM descriptors');
  context.assert(indexPhp.includes('server_prerender_hydrate'), 'Docs host uses server prerender hydrate mode');

  context.assert(htmlResult.status === 0, `Docs initial HTML renders through PHP${htmlResult.status === 0 ? '' : ` (${htmlResult.stderr})`}`);
  context.assert(componentsHtmlResult.status === 0 && componentsHtml.includes('Komponenten-Entwicklung'), 'Physical /docs/de/components/ directory route renders the complete localized article through PHP SSR');
  context.assert(componentsHtml.includes('<link rel="canonical" href="http://localhost/docs/de/components/">'), 'Components article exposes its reachable trailing-slash URL as canonical');
  context.assert(inlineScriptSyntax.ok, `Docs initial inline bootstrap scripts pass node --check${inlineScriptSyntax.ok ? '' : ` (${inlineScriptSyntax.message})`}`);
  context.assert(!html.includes('window.xtendDocsLocalizedPagesMeta = ;'), 'Docs bootstrap never emits an empty localized metadata assignment');
  context.assert(html.includes('window.xtendDocsSsrPrehydration'), 'Initial HTML exposes SSR prehydration payload');
  context.assert(html.includes(DOCS_PHP_SSR_SCHEMA), 'Initial HTML includes docs SSR prehydration schema');
  context.assert(legacyHtml.includes(DOCS_PHP_SSR_LEGACY_SCHEMA), 'Feature flag off keeps the legacy shell-only response available');
  context.assert(html.includes(DOCS_DOCUMENT_V2_SOURCE), 'Document SSR compiles and reports the V2 document source');
  context.assert(routeFragmentResult.status === 0 && routeFragment && routeFragment.schema === 'xtend.docs.route-fragment.v1', 'Canonical route Accept negotiation emits the route-fragment v1 contract');
  context.assert(routeFragment && routeFragment.ok === true && typeof routeFragment.routeHtml === 'string' && routeFragment.routeHtml.includes('data-xrouter-prerendered-route'), 'Route fragment carries one server-rendered adoptable route root');
  context.assert(routeFragment && routeFragment.headPatch && routeFragment.contentProof && routeFragment.islandManifest && Array.isArray(routeFragment.islandManifest.islands), 'Route fragment carries head, content proof and route-local island manifest');
  context.assert(legacyHtml.includes(DOCS_SHELL_SOURCE) && !legacyHtml.includes(DOCS_DOCUMENT_V2_SOURCE), 'Feature flag off compiles and reports only the V1 shell source');
  context.assert(html.includes('rmt_template_chunk'), 'Initial HTML exposes Rmt template chunk shape');
  context.assert(html.includes('server_prerender_hydrate'), 'Initial HTML exposes server prerender hydrate mode');
  context.assert(html.includes('data-rmt-ssr-root="docs.app.root-shell"'), 'Initial HTML marks SSR root shell');
  context.assert(html.includes('data-rmt-shell-prehydrated="true"'), 'Initial HTML marks prehydrated shell');
  context.assert(html.includes('data-rmt-hydration-mode="server_prerender_hydrate"'), 'Initial HTML marks hydration mode');
  context.assert(html.includes('data-docs-route-boot-skeleton'), 'Initial HTML contains a route skeleton before the client runtime upgrades XRouter');
  context.assert(html.includes('data-docs-route-boot-skeleton="true"') && /data-docs-route-boot-skeleton="true"[^>]*hidden/u.test(html), 'Document SSR hides the boot skeleton before hydration');
  context.assert(html.includes('adopt-prerendered-route'), 'Document SSR opts XRouter into prerendered route adoption');
  context.assert(html.includes('data-xrouter-prerendered-route'), 'Document SSR emits one adoptable route node');
  context.assert(html.includes('id="md-content"') && html.includes('<h1'), 'Document SSR includes parsed article content in the raw response');
  context.assert(html.includes('class="docs-sidebar-heading"') && html.includes('Read Further'), 'Document SSR preserves the Read Further heading scaffold');
  context.assert(html.includes('class="docs-related-list"') && html.includes('data-rmt-slot="related-links"'), 'Document SSR preserves the related-link grid needed for stable button spacing');
  context.assert(!html.includes('class="docs-menu-link-icon"'), 'Document SSR keeps main-navigation article links uniformly icon-free');
  context.assert(html.includes('data-rmt-sanitizer="xtend.security.trusted-dom-sanitizer.v1"'), 'Document SSR records its server sanitizer proof');
  context.assert(html.includes('data-xrouter-content-sha256='), 'Document SSR records a route content identity proof');
  context.assert(!html.includes('window.xtendDocsPages = {'), 'Document SSR does not duplicate article HTML in the bootstrap page cache');
  context.assert(html.includes('data-xtend-skeleton-fallback'), 'Initial route skeleton opts into the shared pre-upgrade fallback contract');
  context.assert(html.includes('data-rmt-component-capability="x-router"'), 'Initial HTML includes XRouter capability marker');
  context.assert(html.includes('<x-route path="/docs/de/readme"'), 'Initial HTML renders history route records inside the router shell');
  context.assert(!html.includes('rmt.php_ssr.compiler_required'), 'Initial HTML does not report missing compiler bridge');

  rawHtmlSeoMatrix.forEach((seoCase) => {
    const label = `Raw HTML SEO ${seoCase.locale}/${seoCase.id} (${seoCase.slug || 'missing-slug'})`;
    const routeTag = seoCase.prerenderedRouteTags[0] || '';
    const articleIsVisible = seoCase.articles.length === 1
      && !/(?:^|\s)hidden(?:\s|=|$)/iu.test(seoCase.articleAttributes)
      && !/aria-hidden\s*=\s*["']?true/iu.test(seoCase.articleAttributes)
      && !/display\s*:\s*none/iu.test(seoCase.articleAttributes);
    const internalLinkPattern = new RegExp(`<a\\b(?=[^>]*\\bis-x-link(?:="true")?)(?=[^>]*\\bdata-xtend-component="x-link")(?=[^>]*\\bhref="/docs/${seoCase.locale}/[^"#]+")`, 'iu');
    context.assert(Boolean(seoCase.markdownPath && seoCase.markdown.length > 0 && seoCase.slug), `${label} resolves its localized Markdown source`);
    context.assert(seoCase.result.status === 0, `${label} renders without JavaScript${seoCase.result.status === 0 ? '' : ` (${seoCase.result.stderr})`}`);
    context.assert(seoCase.seo.title.length > 0 && seoCase.seo.lead.length >= 24, `${label} fixture provides an H1 and distinctive lead`);
    context.assert(seoCase.documentTitle.includes(seoCase.seo.title), `${label} emits the route-specific document title`);
    context.assert(seoCase.description.length >= 24, `${label} emits a non-empty meta description`);
    context.assert(articleIsVisible, `${label} emits exactly one visible article`);
    context.assert(seoCase.articleHeading === seoCase.seo.title, `${label} exposes the Markdown H1 in the article`);
    context.assert(seoCase.articleText.includes(seoCase.seo.lead), `${label} exposes the distinctive Markdown lead in the article`);
    context.assert((seoCase.articleHtml.match(/\bid="md-content"/giu) || []).length === 1, `${label} emits exactly one md-content root`);
    context.assert(seoCase.prerenderedRouteTags.length === 1, `${label} emits exactly one adoptable prerendered route`);
    context.assert(routeTag.includes(`data-xrouter-route-path="/docs/${seoCase.locale}/${seoCase.slug}"`), `${label} binds the canonical localized path`);
    context.assert(routeTag.includes(`data-docs-route-slug="${seoCase.slug}"`) && routeTag.includes(`data-docs-route-locale="${seoCase.locale}"`), `${label} binds slug and locale markers`);
    context.assert(routeTag.includes('data-xrouter-content-sha256=') && routeTag.includes('data-xrouter-sanitized="true"'), `${label} carries content and trust proof markers`);
    context.assert(seoCase.html.includes(DOCS_PHP_SSR_SCHEMA), `${label} carries the V2 document prehydration contract`);
    context.assert(/\bhidden(?:="(?:true|hidden)")?/iu.test(seoCase.bootSkeletonTag), `${label} keeps the boot skeleton hidden beside SSR content`);
    if (seoCase.requiresInternalLink) {
      context.assert(internalLinkPattern.test(seoCase.articleHtml), `${label} rewrites an article-internal link to a localized progressive XLink anchor`);
    }
    (seoCase.expectedLocalizedTargets || []).forEach((target) => {
      const canonicalTarget = target === 'components' ? 'components/' : target;
      context.assert(
        new RegExp(`<a\\b(?=[^>]*\\bis-x-link(?:="true")?)(?=[^>]*\\bhref="/docs/${seoCase.locale}/${canonicalTarget}")`, 'iu').test(seoCase.articleHtml),
        `${label} resolves ${target} relative to the current Markdown directory`
      );
    });
    if (seoCase.requiresCodeAndTable) {
      context.assert(/<pre\b[^>]*>\s*<code\b/iu.test(seoCase.articleHtml), `${label} keeps a stable server-rendered code block`);
      context.assert(/<table\b/iu.test(seoCase.articleHtml), `${label} includes the server-rendered Markdown table`);
    }
    if (seoCase.id === 'largest') {
      context.assert(Number.isFinite(seoCase.bytes) && seoCase.bytes > 0, `${label} selects the largest page dynamically by source bytes`);
    }
  });

  context.assert(jsonlResult.status === 0, `Docs JSONL endpoint renders through PHP${jsonlResult.status === 0 ? '' : ` (${jsonlResult.stderr})`}`);
  context.assert(frames.length === 29, 'V1 shell JSONL endpoint remains exactly 29 frames');
  context.assert(JSON.stringify(frameTypes) === JSON.stringify(expectedV1FrameTypes), 'V1 shell preserves its exact frame-type sequence');
  context.assert(
    JSON.stringify(frames.filter((frame) => frame.type === 'component').map((frame) => frame.capability)) === JSON.stringify(expectedV1ComponentCapabilities),
    'V1 shell preserves its exact component capability sequence'
  );
  context.assert(
    JSON.stringify(frames.filter((frame) => frame.type === 'html').map((frame) => frame.payload && frame.payload.dataSourceId || null)) === JSON.stringify(expectedV1HtmlDataSources),
    'V1 shell preserves its exact HTML datasource sequence'
  );
  ['start', 'component', 'html', 'hydration', 'complete'].forEach((type) => {
    context.assert(frameTypes.includes(type), `JSONL endpoint emits ${type} frame`);
  });
  context.assert(frames.every((frame, index) => frame.sequence === index), 'JSONL endpoint sequences frames deterministically');
  context.assert(frames.every((frame) => frame.schema === 'xtend.rmt.node-ssr-jsonl-frame.v1'), 'JSONL endpoint uses Node-compatible frame schema');
  context.assert(!jsonl.includes('rmt.php_ssr.compiler_required'), 'JSONL endpoint does not report missing compiler bridge');
  context.assert(!jsonl.includes('rmt.php_ssr.datasource_missing'), 'JSONL endpoint resolves docs shell data sources explicitly');
  ['docs.document.ssr', 'DocsDocumentSsrFramesV2', 'xtendrmt.docs.php-ssr.document', 'docs-page-document', 'data-xrouter-prerendered-route'].forEach((documentToken) => {
    context.assert(!jsonl.includes(documentToken), `V1 shell JSONL excludes V2 document token ${documentToken}`);
  });
  context.assert(documentJsonlResult.status === 0, `Docs V2 document JSONL endpoint renders through PHP${documentJsonlResult.status === 0 ? '' : ` (${documentJsonlResult.stderr})`}`);
  context.assert(documentFrames.length === 26, 'V2 document JSONL endpoint emits its static-sidebar-free 26-frame document contract');
  context.assert(
    documentFrames.filter((frame) => frame.payload && frame.payload.dataSourceId === 'dataSource:xtend.docs.php_ssr_shell/docs.page/critical/0').length === 1,
    'V2 document JSONL endpoint emits exactly one critical document mount frame'
  );
  ['start', 'component', 'html', 'hydration', 'complete'].forEach((type) => {
    context.assert(documentFrames.some((frame) => frame.type === type), `Document JSONL endpoint emits ${type} frame`);
  });
  context.assert(documentJsonl.includes('data-xrouter-prerendered-route') && documentJsonl.includes('id=\\"md-content\\"'), 'Document JSONL endpoint carries the server-rendered article descriptor');

  context.assert(phpSanitizer.status === 0 && phpSanitizer.payload && typeof phpSanitizer.payload.html === 'string', 'PHP Parsedown sanitizer probe completes');
  const phpSanitizedHtml = phpSanitizer.payload && phpSanitizer.payload.html || '';
  const clientSanitizedHtml = browserPolicySanitizer && browserPolicySanitizer.html || '';
  ['<script', '<iframe', 'onclick=', 'onerror=', 'javascript:', 'vbscript:', 'data:text/html'].forEach((vector) => {
    context.assert(!phpSanitizedHtml.toLowerCase().includes(vector), `PHP sanitizer removes ${vector}`);
    context.assert(!clientSanitizedHtml.toLowerCase().includes(vector), `browser sanitizer removes ${vector}`);
  });
  ['/docs/de/readme'].forEach((safeUrl) => {
    context.assert(phpSanitizedHtml.includes(safeUrl), `PHP sanitizer preserves safe URL ${safeUrl}`);
    context.assert(clientSanitizedHtml.includes(safeUrl), `browser sanitizer preserves safe URL ${safeUrl}`);
  });
  const parsedHtml = html => Array.from(JSDOM.fragment(String(html)).childNodes).map(node => node.outerHTML || node.textContent).join('');
  context.assert(parsedHtml(phpSanitizedHtml) === parsedHtml(clientSanitizedHtml), 'PHP and browser sanitizer outputs agree after actual HTML parsing for the shared fixture');
  context.assert(phpDataImage.payload?.html.includes('data:image/png'), 'Legacy PHP policy still permits its documented data image');
  context.assert(browserDataImage.ok && !String(browserDataImage.html).includes('data:'), 'Parser-based browser policy rejects data URLs explicitly');

  context.assert(markdownLinkProbe.status === 0 && markdownLinkProbe.payload && typeof markdownLinkProbe.payload.html === 'string', 'Server Markdown link resolver probe completes');
  const normalizedMarkdownLinks = markdownLinkProbe.payload && markdownLinkProbe.payload.html || '';
  context.assert(/<a\b(?=[^>]*\bis-x-link(?:="true")?)(?=[^>]*\bhref="\/docs\/en\/components-xtend-state\?view=api#events")[^>]*>sibling<\/a>/iu.test(normalizedMarkdownLinks), 'Server Markdown link resolver preserves query and fragment on a progressive sibling anchor');
  context.assert(/<a\b(?=[^>]*\bis-x-link(?:="true")?)(?=[^>]*\bhref="\/docs\/en\/components\/#overview")[^>]*>parent<\/a>/iu.test(normalizedMarkdownLinks), 'Server Markdown link resolver resolves a progressive parent-directory anchor');
  [
    '<a href="./missing.md">missing</a>',
    '<a href="../../escape.md">escape</a>',
    '<a href="https://example.com/reference.md">external</a>',
    '<a href="/reference.md">absolute</a>'
  ].forEach((unchangedLink) => {
    context.assert(normalizedMarkdownLinks.includes(unchangedLink), `Server Markdown link resolver leaves unsupported target unchanged: ${unchangedLink}`);
  });

  context.assert(pageLoader.includes('getDocsSsrPrehydration'), 'Page loader detects SSR prehydration state');
  context.assert(pageLoader.includes('findPrehydratedDocsShell'), 'Page loader can discover prehydrated docs shells');
  context.assert(pageLoader.includes('adoptPrehydratedDocsShell'), 'Page loader can adopt server-rendered docs shells');
  context.assert(pageLoader.includes('createDocsShellAdoptionDescriptor') && pageLoader.includes('xtend.docs.shell-adoption-error.v1'), 'Page loader exposes a pure, structured shell adoption descriptor');
  context.assert(pageLoader.includes('#md-content[data-rmt-slot="content"]') && pageLoader.includes('#download-link[data-rmt-action="docs.download.markdown"]'), 'Shell adoption validates stable IDs and RMT slot identities');
  const adoptionFunction = pageLoader.slice(pageLoader.indexOf('function adoptPrehydratedDocsShell'), pageLoader.indexOf('function indexRmtRecords'));
  context.assert(!adoptionFunction.includes('document.createElement') && !adoptionFunction.includes('appendChild') && !adoptionFunction.includes('replaceWith'), 'Shell adoption never creates, moves, or replaces nodes');
  ['layout', 'article', 'mdContent', 'download', 'sidebar', 'relatedSlot', 'demoSlot'].forEach((slot) => {
    context.assert(pageLoader.includes(`${slot}: { selector:`), `Shell adoption requires ${slot}`);
  });
  ['pending', 'validated', 'adopted', 'rendered', 'ready', 'failed'].forEach((phase) => {
    context.assert(pageLoader.includes(`'${phase}'`), `Docs route state machine declares ${phase}`);
  });
  context.assert(!pageLoader.includes("removeAttribute('data-xrouter-adoption-pending')"), 'Page controller leaves adoption-pending release exclusively to XRouter');
  context.assert(routerSource.includes('_releasePrerenderedRoutePending(candidate)') && routerSource.includes('xrouter-adoption-pending-released'), 'XRouter owns the exactly-once pending release API');
  context.assert(routerSource.indexOf('const result = await adopt(adoptionContext);') < routerSource.indexOf('this._releasePrerenderedRoutePending(candidate);'), 'XRouter releases pending only after successful adoption');
  context.assert(pageLoader.includes('data-rmt-ssr-reused'), 'Page loader marks reused SSR shells');
  context.assert(pageLoader.includes('createRmtDocsShell'), 'Page loader keeps the client fallback shell');
  context.assert(pageLoader.includes("data-docs-shell-reused', 'ssr'"), 'Page loader prefers SSR shell reuse before fallback');
  context.assert(pageLoader.includes('phpSsrPrehydration: getDocsSsrPrehydration()'), 'Page loader reports SSR prehydration in render telemetry');
  context.assert(pageLoader.includes("source: 'ssr-adopted'"), 'Page loader exposes SSR adoption as an explicit content source');
  context.assert(pageLoader.includes('getAdoptedDocsContentPayload'), 'Page loader validates route, locale, hash and trust proof before adoption');
  context.assert(pageLoader.includes('data-docs-ssr-proof-consumed') && pageLoader.includes('invalidateDocsSsrContentProof'), 'Page loader consumes SSR proofs once and invalidates them before CSR navigation');
  context.assert(
    ssrCodeEnhancementSource.includes('getRmtSchedule(scheduleId)')
      && ssrCodeEnhancementSource.includes('docsBrowserScheduler.scheduleEndpoint(endpointName, window.location.pathname')
      && ssrCodeEnhancementSource.includes("{ kind: 'idle', timeout: deadlineMs }")
      && ssrCodeEnhancementSource.includes("enhance('idle')"),
    'SSR code fences upgrade automatically through the declared idle schedule without user input'
  );
  context.assert(
    ssrCodeEnhancementSource.includes("['pointerdown', 'keydown']")
      && ssrCodeEnhancementSource.includes('interactionRequested = true')
      && ssrCodeEnhancementSource.includes("if (interactionRequested) enhance('interaction')"),
    'SSR code enhancement keeps pointer and keyboard interaction as a fast path, including interaction before component readiness'
  );
  context.assert(
    ssrCodeEnhancementSource.includes('disposed = true;')
      && ssrCodeEnhancementSource.includes('cancelIdleEnhancement();')
      && ssrCodeEnhancementSource.includes('removeListeners();')
      && pageLoader.includes('isActive: () => this.isActiveRouteToken(token)')
      && pageLoader.includes('this.scheduleRouteWork(codeEnhancementDisposer)'),
    'Route disposal cancels pending code idle work and listeners while the route token blocks stale commits'
  );
  context.assert(
    ssrCodeEnhancementSource.includes("data-docs-code-enhancement', 'idle-pending'")
      && ssrCodeEnhancementSource.includes("data-docs-code-enhancement', `${trigger}-committed`")
      && ssrCodeEnhancementSource.includes("data-docs-code-enhancement-trigger', trigger")
      && pageLoader.includes("data-docs-code-enhancement', codeFenceUpgrade.upgraded > 0 ? 'csr-committed' : 'not-needed'")
      && pageLoader.includes("data-docs-code-enhancement-trigger', 'csr'"),
    'Code enhancement reports idle, interaction and CSR commits without retaining a stale SSR marker after navigation'
  );
  context.assert(indexPhp.includes('docsRenderedDocumentMatchesProof') && indexPhp.includes('xtend.docs.document_ssr_adapter_fallback_hydrate'), 'Docs host verifies final renderer output and retains the complete document for controlled hydrate fallback');
  context.assert(indexPhp.includes('xtend.docs.document_ssr_sanitizer_failed') && indexPhp.includes('xtend.docs.document_ssr_structure_proof_failed'), 'Docs host records explicit sanitizer and proof-preparation fallback diagnostics');
  context.assert(indexPhp.includes('xtend.docs.document_ssr_emergency_document') && indexPhp.includes('xtend.docs.document_ssr_adapter_fallback_hydrate'), 'Document preparation and adapter failures retain an emergency complete SSR document');

  context.assert(packageManifest.scripts['test:docs-php-ssr-prehydration'] === 'node scripts/run_xtend_tests.js docs-php-ssr-prehydration', 'package exposes docs PHP SSR prehydration script');
  context.assert(runner.hasSuite("docs-php-ssr-prehydration"), 'test runner registers docs PHP SSR prehydration suite');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.schema === DOCS_PHP_SSR_SCHEMA, 'package metadata records docs SSR schema');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.reportSchema === DOCS_PHP_SSR_REPORT_SCHEMA, 'package metadata records docs SSR report schema');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.legacyReportSchema === DOCS_PHP_SSR_LEGACY_REPORT_SCHEMA, 'package metadata retains the V1 docs SSR report reader');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.compilerBridgeSchema === DOCS_COMPILER_BRIDGE_SCHEMA, 'package metadata records compiler bridge schema');
  context.assert(packageManifest.xtend.docsPhpSsrPrehydration.localGate === DOCS_PHP_SSR_LOCAL_GATE, 'package metadata records local gate');
  context.assert(packageManifest.xtend.rmtPhpSsrAdapter.docsAppIntegrationStatus === 'active-docs-php-ssr-prehydration', 'PHP adapter metadata marks docs app integration active');

  const navigation = runDocsRouterNavigationChecks(rootDir);
  navigation.passes.forEach(message => context.pass(message));
  navigation.failures.forEach(message => context.fail(message));

  return context.result({
    schema: DOCS_PHP_SSR_REPORT_SCHEMA,
    prehydrationSchema: DOCS_PHP_SSR_SCHEMA,
    compilerBridgeSchema: DOCS_COMPILER_BRIDGE_SCHEMA,
    endpointSchema: DOCS_SSR_ENDPOINT_SCHEMA,
    shellPrimitivesSchema: DOCS_SHELL_PRIMITIVES_SCHEMA,
    localGate: DOCS_PHP_SSR_LOCAL_GATE,
    packageScript: DOCS_PHP_SSR_PACKAGE_SCRIPT,
    frameCount: frames.length,
    documentFrameCount: documentFrames.length,
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

// Keep navigation coverage within the existing suite's authenticated source
// membership. Each scenario runs in a fresh child with its own DOM/module state.
const { runDocsRouterNavigationChecks } = (() => {
  // DOM integration, not browser/sandbox evidence. Execute the real page, shell,
  // router, scheduler and trust modules against PHP-generated documents/fragments.
  // Standalone: node tests/rmt/docs_php_ssr_prehydration_suite.js
  const assert = require('node:assert/strict');
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { registerHooks } = require('node:module');
  const { fileURLToPath, pathToFileURL } = require('node:url');
  const { spawnSync } = require('node:child_process');
  const { generateKeyPairSync, webcrypto } = require('node:crypto');
  const { JSDOM, VirtualConsole } = require('jsdom');

  const pause = () => new Promise(resolve => setTimeout(resolve, 10));
  function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
  }
  async function until(predicate, message) {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (predicate()) return;
      await pause();
    }
    assert.fail(typeof message === 'function' ? message() : message);
  }

  async function runChecks(rootDir, scenario) {
    const passes = [], failures = [];
    async function check(name, callback) {
      try { await callback(); passes.push(name); }
      catch (error) { failures.push(`${name}: ${error.stack || error.message}`); }
    }
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-docs-router-'));
    const keyPath = path.join(directory, 'resume.pem');
    const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    fs.writeFileSync(keyPath, pair.privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 });
    const responses = new Map();
    function php(route, fragment = false, signed = false) {
      const key = JSON.stringify([route, fragment, signed]);
      if (responses.has(key)) return responses.get(key);
      const result = spawnSync('php', ['-r', [
        "$_SERVER['SCRIPT_NAME'] = '/docs/index.php';",
        `$_SERVER['REQUEST_URI'] = ${JSON.stringify(route)};`,
        `$_SERVER['HTTP_ACCEPT'] = ${JSON.stringify(fragment ? 'application/vnd.xtend.rmt-route+json' : 'text/html')};`,
        'include "docs/index.php";'
      ].join('\n')], {
        cwd: rootDir, encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, XTEND_DOCS_DOCUMENT_SSR: 'v2', XTEND_DOCS_SSR_MODE: signed ? 'resume' : 'hydrate',
          XTEND_DOCS_RESUME_PRIVATE_KEY_FILE: signed ? keyPath : '', XTEND_DOCS_RESUME_KEY_ID: 'router-test',
          XTEND_DOCS_PUBLIC_ORIGIN: 'http://localhost' }
      });
      assert.equal(result.status, 0, result.stderr || result.error?.message);
      responses.set(key, result.stdout);
      return result.stdout;
    }

    async function boot(route = '/docs/de/readme', signed = false) {
      const errors = [], requests = [], fallbacks = [], verifiedSnapshots = [];
      const virtualConsole = new VirtualConsole();
      virtualConsole.on('jsdomError', error => {
        if (error.type !== 'not-implemented') errors.push(error.message);
      });
      virtualConsole.on('error', (...args) => errors.push(args.map(String).join(' ')));
      const dom = new JSDOM(php(route, false, signed), {
        url: `http://localhost${route}`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
      });
      const { window } = dom;
      const originalPage = window.document.querySelector('xtend-doc-page');
      const originalContent = originalPage.querySelector('#md-content');
      const control = { transport: null, digest: null };
      Object.assign(window, { TextEncoder, TextDecoder, AbortController, AbortSignal });
      Object.defineProperty(window, 'crypto', { value: { subtle: new Proxy(webcrypto.subtle, {
        get(target, name) {
          if (name === 'digest') return (...args) => control.digest
            ? control.digest(...args) : target.digest(...args);
          return typeof target[name] === 'function' ? target[name].bind(target) : target[name];
        }
      }) } });
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = () => {};
      window.fetch = async (input, options = {}) => {
        const url = new URL(input, window.location.href);
        const fragment = options.headers?.Accept === 'application/vnd.xtend.rmt-route+json';
        if (fragment) {
          const request = { path: url.pathname, signal: options.signal };
          requests.push(request);
          if (control.transport) {
            const response = control.transport(request);
            if (response) return response;
          }
          return { ok: true, json: async () => JSON.parse(php(url.pathname, true, signed)) };
        }
        return { ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(rootDir, url.pathname), 'utf8')) };
      };
      window.addEventListener('xtend-docs-document-navigation-fallback', event => fallbacks.push(event.detail));
      for (const script of window.document.scripts) {
        if (!script.src && !script.type) window.eval(script.textContent);
      }
      // Run each scenario in its own process: native ESM avoids experimental VM
      // warnings, and browser globals/module singletons cannot leak across boots.
      const globals = Object.getOwnPropertyDescriptors(globalThis);
      let hooks;
      function close() {
        try {
          window.xtendDocsShellRuntime?.dispose();
          window.dispatchEvent(new window.Event('pagehide'));
        } finally {
          dom.window.close();
          hooks?.deregister();
          for (const name of Reflect.ownKeys(globalThis)) if (!Object.hasOwn(globals, name)) delete globalThis[name];
          Object.defineProperties(globalThis, globals);
        }
      }
      try {
        for (const name of ['window', 'document', 'location', 'history', 'navigator', 'customElements', 'HTMLElement',
          'Element', 'Node', 'NodeFilter', 'DocumentFragment', 'ShadowRoot', 'DOMParser', 'CustomEvent',
          'Event', 'MutationObserver', 'crypto', 'CSS', 'console']) {
          Object.defineProperty(globalThis, name, { value: name === 'window' ? window : window[name], configurable: true, writable: true });
        }
        globalThis.fetch = (...args) => window.fetch(...args);
        globalThis.getComputedStyle = window.getComputedStyle.bind(window);
        const rootURL = pathToFileURL(rootDir + path.sep);
        const isBrowserModule = url => url.protocol === 'file:' && url.href.startsWith(rootURL.href)
          && /\.m?js$/.test(url.pathname);
        hooks = registerHooks({
          resolve(specifier, context, nextResolve) {
            const fromBrowser = context.parentURL && new URL(context.parentURL).searchParams.has('docsNavigationTest');
            if (!fromBrowser && !specifier.includes('docsNavigationTest=')) return nextResolve(specifier, context);
            if (!/^(?:\/|\.\.?\/|file:)/.test(specifier)) return nextResolve(specifier, context);
            const url = specifier.startsWith('/')
              ? new URL(`.${specifier}`, rootURL)
              : new URL(specifier, context.parentURL);
            if (!isBrowserModule(url)) return nextResolve(specifier, context);
            url.searchParams.set('docsNavigationTest', '1');
            return { url: url.href, shortCircuit: true };
          },
          load(url, context, nextLoad) {
            const target = new URL(url);
            if (!isBrowserModule(target) || !target.searchParams.has('docsNavigationTest')) return nextLoad(url, context);
            return { format: 'module', source: fs.readFileSync(fileURLToPath(target), 'utf8'), shortCircuit: true };
          }
        });
        const load = async specifier => ({ namespace: await import(`${new URL(`.${specifier}`, rootURL).href}?docsNavigationTest=1`) });
        if (signed) {
          window.XTendRmtResumeRuntime = (await load('/xtendrmt/rmt-resume-runtime.js')).namespace;
          // Use the production signature verifier; full Maraca/Classic boot remains
          // the browser smoke's responsibility, not a claim made by this DOM test.
          const bootstrap = fs.readFileSync(path.join(rootDir, 'docs/utils/docs-resume-bootstrap.mjs'), 'utf8');
          window.eval(bootstrap.slice(0, bootstrap.indexOf('window.__XTendMaracaDisableAutoBoot')));
          const verify = window.xtendDocsVerifyResumeEnvelope;
          window.xtendDocsVerifyResumeEnvelope = async (...args) => {
            const result = await verify(...args);
            if (result.ok) verifiedSnapshots.push(JSON.parse(args[0]).snapshot);
            return result;
          };
        }
        await load('/docs/utils/trusted-dom-host.mjs');
        await load('/components/xrouter.js');
        await load('/docs/utils/page/index.mjs');
        await load('/docs/utils/docs-shell-runtime.mjs');
        const router = window.document.querySelector('x-router');
        const page = () => router.shadowRoot.querySelector('xtend-doc-page');
        const content = () => page()?.querySelector('#md-content');
        async function ready(slug) {
          await until(() => page()?.getAttribute('data-docs-route-slug') === slug
            && page()?.getAttribute('data-docs-route-phase') === 'ready', () => `Route ${slug} did not finish: ${JSON.stringify({ errors, fallbacks })}`);
          assert(content().textContent.trim().length > 100, `${slug} content must remain visible`);
          assert.equal(page(), originalPage, 'router reuses the adopted page host');
          assert.equal(page().hasAttribute('aria-busy'), false);
        }
        await ready(route.split('/').pop());
        await until(() => window.xtendDocsShellRuntime.snapshot().registeredRouteLocale !== '', 'routes did not register');
        return { window, router, page, content, originalPage, originalContent, ready, requests, errors, fallbacks, verifiedSnapshots, control,
          async navigate(slug, locale = 'de') { router.navigate(`/docs/${locale}/${slug}`); await ready(slug); },
          close
        };
      } catch (error) { close(); throw error; }
    }

    try {
      for (const signed of scenario === 'hydrate' ? [false] : scenario === 'resume' ? [true] : []) {
        const mode = signed ? 'signed resume' : 'hydrate';
        let app;
        try {
          app = await boot('/docs/de/readme', signed);
          await check(`${mode}: SSR takeover preserves article nodes without fetching/replaying`, async () => {
            assert.equal(app.content(), app.originalContent);
            assert.equal(app.page().getAttribute('data-docs-initial-route-replay'), 'skipped');
            assert.equal(app.requests.length, 0);
            assert.equal(app.page().getAttribute('data-xrouter-route-adopted'), 'true');
          });
          await check(`${mode}: first and repeated navigation commit real article content`, async () => {
            const shell = app.page().querySelector('.docs-app-shell');
            await app.navigate('manifest');
            assert.equal(app.page().querySelector('.docs-app-shell'), shell);
            assert.equal(app.content(), app.originalContent);
            if (signed) assert(app.verifiedSnapshots.some(snapshot => snapshot.state['xtend.docs.route'].slug === 'manifest'));
            assert.match(app.content().querySelector('h1').textContent, /Manifest/);
            assert.match(app.window.document.title, /Manifest/);
            const introduction = app.content().querySelector('p').textContent;
            await app.navigate('readme');
            await app.navigate('manifest');
            assert.match(app.content().querySelector('h1').textContent, /Manifest/);
            assert.equal(app.content().querySelector('p').textContent, introduction);
            assert.match(app.content().querySelector('x-code template').content.textContent, /x-button/);
            assert.equal(app.requests.filter(request => request.path.endsWith('/manifest')).length, 1, 'cached route stays usable');
          });
          await check(`${mode}: Back and Forward preserve content and document identity`, async () => {
            const document = app.window.document;
            app.window.history.back();
            await app.ready('readme');
            assert.equal(app.window.location.pathname, '/docs/de/readme');
            app.window.history.forward();
            await app.ready('manifest');
            assert.equal(app.window.location.pathname, '/docs/de/manifest');
            assert.equal(app.window.document, document);
            assert.equal(app.fallbacks.length, 0);
          });
          await check(`${mode}: download interaction remains bound to the current article`, async () => {
            const button = app.page().querySelector('#download-link');
            const requests = [];
            const fetch = app.window.fetch, toast = app.window.xtendShowToast;
            app.window.fetch = async (input, options) => {
              if (!String(input).startsWith('?download=')) return fetch(input, options);
              requests.push(String(input));
              return { ok: false }; // Exercise listener/route ownership; no file download in JSDOM.
            };
            app.window.xtendShowToast = async () => {};
            const activate = async () => {
              button.dispatchEvent(new app.window.CustomEvent('button-interaction', { bubbles: true, composed: true }));
              await until(() => !button.hasAttribute('disabled'), 'download listener did not settle');
            };
            try {
              await activate();
              await app.navigate('readme');
              assert.equal(app.page().querySelector('#download-link'), button);
              await activate();
              assert.deepEqual(requests, ['?download=manifest&locale=de', '?download=readme&locale=de']);
            } finally { app.window.fetch = fetch; app.window.xtendShowToast = toast; }
          });
          await check(`${mode}: trusted HTML is sanitized by the kernel before cached-route commits`, async () => {
            const host = app.window.xtendDocsTrustedDomRuntime;
            const target = app.window.document.createElement('div');
            const result = host.commit(target, '<h1>Kept</h1><script>bad()</script><img src=x onerror=bad()><a href="javascript:bad()">Link</a>');
            assert.equal(result.verdict.commitAllowed, true);
            assert.match(target.textContent, /Kept/);
            assert.equal(target.querySelector('script,[onerror],[href^="javascript:"]'), null);
            assert.equal(host.sanitize('<p>Still here</p>').html, '<p>Still here</p>');
          });
          await check(`${mode}: cancelled verification cannot commit or populate the route cache`, async () => {
            const gate = deferred();
            let started = false;
            app.control.digest = async (...args) => { started = true; await gate.promise; return webcrypto.subtle.digest(...args); };
            app.router.navigate('/docs/de/xtend-maraca');
            await until(() => started, 'fragment verification did not start');
            app.control.digest = null;
            await app.navigate('manifest');
            gate.resolve();
            await until(() => app.requests.find(request => request.path.endsWith('/xtend-maraca'))?.signal.aborted, 'old route not aborted');
            await pause(); await pause();
            assert.equal(app.window.xtendDocsLocalizedPages.de['xtend-maraca'], undefined);
            assert.equal(app.page().getAttribute('data-docs-route-slug'), 'manifest');
            assert.equal(app.fallbacks.length, 0);
          });
          await check(`${mode}: a late failed request cannot hard-navigate over the newer route`, async () => {
            const gate = deferred();
            app.control.transport = request => request.path.endsWith('/hydration-policies') ? gate.promise : null;
            app.router.navigate('/docs/de/hydration-policies');
            await until(() => app.requests.some(request => request.path.endsWith('/hydration-policies')), 'delayed request not started');
            await app.navigate('readme');
            gate.reject(new Error('late network failure'));
            await pause(); await pause();
            app.control.transport = null;
            assert.equal(app.fallbacks.length, 0);
            assert.equal(app.window.location.pathname, '/docs/de/readme');
            assert.equal(app.content().querySelector('h1').textContent, 'XTend Developer Center');
          });
          for (const suppliedHandles of [false, true]) await check(`${mode}: routeHtml tampering${suppliedHandles ? ' with private response keys' : ''} never enters live DOM`, async () => {
            app.control.transport = request => {
              const payload = JSON.parse(php(request.path, true, signed));
              // Keep payload.html, hashes and the signed envelope unchanged.
              payload.routeHtml = payload.routeHtml
                .replace('</h1>', '</h1><img data-injected-content src=x onerror="bad()">')
                .replace('class="docs-shell-toolbar"', 'class="docs-shell-toolbar" data-injected-shell onmouseover="bad()"');
              if (suppliedHandles) {
                payload.__xtendRouteRoot = null;
                payload.__xtendRouteResume = null;
              }
              return { ok: true, json: async () => payload };
            };
            try { await app.navigate(suppliedHandles ? 'rmt-reference-actions-events' : 'api'); }
            finally { app.control.transport = null; }
            assert.equal(app.page().querySelector('[data-injected-content],[data-injected-shell],[onerror],[onmouseover]'), null);
            assert.equal(app.content(), app.originalContent);
            assert.equal(app.fallbacks.length, 0);
          });
          await check(`${mode}: corrupt current fragment still falls back to document navigation`, async () => {
            app.control.transport = request => {
              const payload = JSON.parse(php(request.path, true, signed));
              payload.html += '<p>tampered</p>';
              return { ok: true, json: async () => payload };
            };
            app.router.navigate('/docs/de/xtend-fabric-runtime');
            await until(() => app.fallbacks.length === 1, 'invalid proof did not fall back');
            assert.equal(app.fallbacks[0].reason, 'route-fragment-proof-mismatch');
            assert.equal(app.window.xtendDocsLocalizedPages.de['xtend-fabric-runtime'], undefined);
            assert(!app.content().textContent.includes('tampered'));
            assert.deepEqual(app.errors, []);
          });
          if (signed) await check('signed resume: an altered envelope cannot enter the live route', async () => {
            app.control.transport = request => {
              const payload = JSON.parse(php(request.path, true, true));
              payload.resumeEnvelope.integrity.signature = 'invalid';
              return { ok: true, json: async () => payload };
            };
            app.router.navigate('/docs/de/xtend-maraca');
            await until(() => app.fallbacks.length === 2, 'invalid signature did not fall back');
            assert.equal(app.fallbacks[1].reason, 'route-fragment-resume-proof-rejected');
            assert.equal(app.window.xtendDocsLocalizedPages.de['xtend-maraca'], undefined);
          });
        } catch (error) { failures.push(`${mode}: ${error.stack || error.message}`); }
        finally { if (app) app.close(); }
      }
      for (const locale of scenario.startsWith('reload-') ? [scenario.slice(7)] : []) {
        await check(`${locale}: hard reload retains PHP SSR and adopts that exact document`, async () => {
          const app = await boot(`/docs/${locale}/manifest`);
          try {
            assert.match(app.originalContent.querySelector('h1').textContent, /Manifest/);
            assert.equal(app.content(), app.originalContent);
            assert.equal(app.window.document.documentElement.lang, locale);
            assert.equal(app.requests.length, 0);
            assert.deepEqual(app.errors, []);
          } finally { app.close(); }
        });
      }
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
    return { ok: failures.length === 0, passes, failures };
  }

  function runDocsRouterNavigationChecks(rootDir) {
    const passes = [], failures = [];
    for (const scenario of ['hydrate', 'resume', 'reload-de', 'reload-en']) {
      const result = spawnSync(process.execPath, [__filename, rootDir, scenario], {
        cwd: rootDir, encoding: 'utf8', timeout: 120000, maxBuffer: 2 * 1024 * 1024
      });
      try {
        const report = JSON.parse(result.stdout);
        passes.push(...report.passes);
        failures.push(...report.failures);
        assert.equal(result.status, report.ok ? 0 : 1, 'unexpected navigation-check process exit');
      } catch (error) {
        failures.push(`${scenario}: Docs router checks failed: ${result.error?.message || result.stderr || error.message}`);
      }
    }
    return { ok: failures.length === 0, passes, failures };
  }
  if (require.main === module) {
    const rootDir = process.argv[2] || path.resolve(__dirname, '../..');
    const report = process.argv[3] ? runChecks(rootDir, process.argv[3]) : Promise.resolve(runDocsRouterNavigationChecks(rootDir));
    report.then(result => {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      process.exitCode = result.ok ? (process.exitCode || 0) : 1;
    }, error => { console.error(error); process.exitCode = 1; });
  }
  return { runDocsRouterNavigationChecks };
})();
