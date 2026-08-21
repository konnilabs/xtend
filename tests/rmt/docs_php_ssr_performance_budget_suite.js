const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');

const DOCS_PHP_SSR_PERFORMANCE_SCHEMA = 'xtend.docs.php-ssr-performance-budget.v2';
const DOCS_PHP_SSR_PERFORMANCE_LEGACY_SCHEMA = 'xtend.docs.php-ssr-performance-budget.v1';
const DOCS_PHP_SSR_PERFORMANCE_REPORT_SCHEMA = 'xtend.docs.php-ssr-performance-budget-report.v2';
const DOCS_PHP_SSR_PERFORMANCE_LEGACY_REPORT_SCHEMA = 'xtend.docs.php-ssr-performance-budget-report.v1';
const DOCS_HTML_BUDGET_BYTES = 256 * 1024;
const DOCS_PREHYDRATION_BUDGET_BYTES = 250 * 1024;
// V2 includes the active article, whose internal Markdown links are upgraded to
// x-link on the server. Keep a document-wide ceiling while the shell-only
// endpoint retains its existing compatibility budget independently.
const DOCS_SSR_XLINK_BUDGET = 160;
const DOCS_RMT_METADATA_ATTR_BUDGET = 20;
const DOCS_PHP_SSR_PERFORMANCE_LOCAL_GATE = 'node scripts/run_xtend_tests.js docs-php-ssr-performance-budget --json';

function runDocsIndex(rootDir, getParams = {}, route = {}) {
  const locale = route.locale || 'de';
  const slug = route.slug || 'readme';
  const code = [
    `chdir(${JSON.stringify(rootDir)});`,
    `$_SERVER['SCRIPT_NAME'] = '/docs/index.php';`,
    `$_SERVER['REQUEST_URI'] = ${JSON.stringify(`/docs/${locale}/${slug}`)};`,
    `$_GET = json_decode(${JSON.stringify(JSON.stringify(getParams))}, true);`,
    'include "docs/index.php";'
  ].join(' ');
  return spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    env: { ...process.env, XTEND_DOCS_DOCUMENT_SSR: 'v2' },
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024
  });
}

function slugifyMarkdownPath(relativePath) {
  return String(relativePath || '').replace(/\.md$/iu, '').replace(/[^a-z0-9]+/giu, '-').toLowerCase();
}

function largestMarkdownRoute(rootDir, locale) {
  const localeRoot = path.join(rootDir, 'docs', locale);
  const visit = (directory, prefix = '') => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return visit(absolutePath, relativePath);
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) return [];
    return [{ relativePath, bytes: fs.statSync(absolutePath).size }];
  });
  const largest = visit(localeRoot).sort((left, right) => right.bytes - left.bytes || left.relativePath.localeCompare(right.relativePath))[0];
  return {
    locale,
    slug: slugifyMarkdownPath(largest.relativePath),
    source: `docs/${locale}/${largest.relativePath}`,
    markdownBytes: largest.bytes
  };
}

function byteLength(value) {
  return Buffer.byteLength(String(value || ''), 'utf8');
}

function countMatches(value, pattern) {
  return (String(value || '').match(pattern) || []).length;
}

function extractInitialPrehydration(html) {
  const match = String(html || '').match(/<script\b(?=[^>]*\bid="xtend-docs-boot")[^>]*>([\s\S]*?)<\/script>/su);
  if (!match) return { json: '', payload: null };
  const descriptor = JSON.parse(match[1]);
  const payload = descriptor && descriptor.document && descriptor.document.ssrPrehydration || null;
  return {
    json: payload ? JSON.stringify(payload) : '',
    payload
  };
}

function extractSsrBody(html) {
  const match = String(html || '').match(/<body[^>]*>\s*([\s\S]*?)<script\b(?=[^>]*\bsrc="\/docs\/utils\/(?:pageloader\.js|page\/index\.mjs)(?:\?[^" ]*)?")[^>]*>/su);
  return match ? match[1] : '';
}

function runDocsPhpSsrPerformanceBudgetSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'docs-php-ssr-performance-budget',
    label: 'Docs-App PHP SSR Performance Budget'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const xlinkSource = readText('components/xlink.js', rootDir);
  const result = runDocsIndex(rootDir, {});
  const html = result.stdout || '';
  const ssrBody = extractSsrBody(html);
  const prehydration = extractInitialPrehydration(html);
  const htmlBytes = byteLength(html);
  const prehydrationBytes = byteLength(prehydration.json);
  const ssrXLinkCount = countMatches(ssrBody, /<x-link\b/gu);
  const ssrTrunkLinkCount = countMatches(ssrBody, /data-docs-trunk-link=/gu);
  const ssrActiveTrunkContentCount = countMatches(ssrBody, /data-docs-active-trunk-content=/gu);
  const rmtMetadataAttrCount = countMatches(html, /data-rmt-metadata=/gu);
  const prehydrationText = prehydration.json || '';
  const largestRouteMeasurements = ['de', 'en'].map((locale) => {
    const route = largestMarkdownRoute(rootDir, locale);
    const routeResult = runDocsIndex(rootDir, {}, route);
    const routeHtml = routeResult.stdout || '';
    const routePrehydration = extractInitialPrehydration(routeHtml);
    return {
      ...route,
      status: routeResult.status,
      stderr: routeResult.stderr || '',
      htmlBytes: byteLength(routeHtml),
      prehydrationBytes: byteLength(routePrehydration.json),
      prehydrationSchema: routePrehydration.payload && routePrehydration.payload.schema,
      articleCount: countMatches(routeHtml, /<article\b/gu)
    };
  });

  context.assert(result.status === 0, `Docs HTML renders through PHP${result.status === 0 ? '' : ` (${result.stderr})`}`);
  context.assert(htmlBytes < DOCS_HTML_BUDGET_BYTES, `Initial docs HTML stays below ${DOCS_HTML_BUDGET_BYTES} bytes (${htmlBytes})`);
  context.assert(prehydration.payload && prehydration.payload.schema === 'xtend.docs.php-ssr-prehydration.v2', 'Initial prehydration payload is parseable and uses the document SSR schema');
  context.assert(prehydrationBytes < DOCS_PREHYDRATION_BUDGET_BYTES, `Initial prehydration payload stays below ${DOCS_PREHYDRATION_BUDGET_BYTES} bytes (${prehydrationBytes})`);
  context.assert(prehydration.payload && prehydration.payload.htmlAlreadyInDom === true, 'Prehydration payload references existing SSR DOM instead of embedding duplicate HTML');
  context.assert(prehydration.payload && prehydration.payload.renderResult && prehydration.payload.renderResult.htmlAlreadyInDom === true, 'Render result summary references existing SSR DOM');
  context.assert(!Object.prototype.hasOwnProperty.call(prehydration.payload || {}, 'html'), 'Prehydration payload omits full html');
  context.assert(!(prehydration.payload && prehydration.payload.renderResult && Object.prototype.hasOwnProperty.call(prehydration.payload.renderResult, 'html')), 'Render result summary omits full html');
  context.assert(!/"markup"\s*:\s*\{[^}]*"html"\s*:/su.test(prehydrationText), 'Chunk summaries omit markup.html while retaining chunk metadata');
  context.assert(prehydration.payload && prehydration.payload.document && prehydration.payload.document.htmlAlreadyInDom === true, 'Prehydration stores a compact document proof instead of duplicate article HTML');
  largestRouteMeasurements.forEach((measurement) => {
    context.assert(measurement.status === 0, `${measurement.locale.toUpperCase()} largest Markdown route renders through PHP (${measurement.source})`);
    context.assert(measurement.prehydrationSchema === DOCS_PHP_SSR_PERFORMANCE_SCHEMA.replace('-performance-budget', '-prehydration'), `${measurement.locale.toUpperCase()} largest route uses document SSR V2`);
    context.assert(measurement.htmlBytes < DOCS_HTML_BUDGET_BYTES, `${measurement.locale.toUpperCase()} largest-route HTML stays below ${DOCS_HTML_BUDGET_BYTES} bytes (${measurement.htmlBytes})`);
    context.assert(measurement.prehydrationBytes < DOCS_PREHYDRATION_BUDGET_BYTES, `${measurement.locale.toUpperCase()} largest-route prehydration stays below ${DOCS_PREHYDRATION_BUDGET_BYTES} bytes (${measurement.prehydrationBytes})`);
    context.assert(measurement.articleCount === 1, `${measurement.locale.toUpperCase()} largest route renders exactly one article (${measurement.articleCount})`);
  });
  context.assert(ssrBody.includes('data-xrouter-prerendered-route') && ssrBody.includes('id="md-content"'), 'Initial SSR body contains the active documentation article');
  context.assert(prehydrationText.includes('rmt_template_chunk'), 'Chunk summaries retain Rmt template chunk schema');
  context.assert(ssrXLinkCount < DOCS_SSR_XLINK_BUDGET, `SSR document x-link count stays below ${DOCS_SSR_XLINK_BUDGET} (${ssrXLinkCount})`);
  context.assert(ssrBody.includes('data-docs-menu-shell="true"') && ssrBody.includes('<x-menu'), 'SSR header renders the task-trunk navigation with XTend menu components');
  context.assert(ssrTrunkLinkCount === 6, `SSR header renders exactly six task trunks (${ssrTrunkLinkCount})`);
  context.assert(ssrActiveTrunkContentCount === 1, `SSR shell renders only the active trunk content (${ssrActiveTrunkContentCount})`);
  context.assert(!ssrBody.includes('data-rmt-menu-placeholder="true"'), 'SSR header no longer emits the retired menu placeholder');
  context.assert(!ssrBody.includes('x-link class="docs-nav-link"'), 'SSR header no longer emits disposable docs nav x-link records');
  context.assert(rmtMetadataAttrCount <= DOCS_RMT_METADATA_ATTR_BUDGET, `data-rmt-metadata attributes stay below ${DOCS_RMT_METADATA_ATTR_BUDGET} (${rmtMetadataAttrCount})`);
  context.assert(indexPhp.includes('docsCompactDocsSsrPrehydrationForBootstrap'), 'Docs host compacts SSR prehydration before exposing it to the browser');
  context.assert(indexPhp.includes('docsCompactPageMetaForBootstrap'), 'Docs host compacts page metadata before exposing it to the browser');

  context.assert(xlinkSource.includes('__shadowTemplate'), 'x-link caches its shadow DOM template');
  context.assert(xlinkSource.includes('__navigationRegistry'), 'x-link uses a shared navigation listener registry');
  context.assert(xlinkSource.includes('_registerNavigationLink'), 'x-link registers instances with the shared navigation registry');
  context.assert(!xlinkSource.includes("window.addEventListener('popstate', this._updateActive)"), 'x-link no longer installs popstate per instance');
  context.assert(!xlinkSource.includes("window.addEventListener('hashchange', this._updateActive)"), 'x-link no longer installs hashchange per instance');
  context.assert(!xlinkSource.includes("document.body.addEventListener('x-navigate', this._onNavigationChange)"), 'x-link no longer installs body navigation listeners per instance');
  context.assert(xlinkSource.includes('previousActive === active'), 'x-link skips unchanged active-state syncs');
  context.assert(xlinkSource.includes('active || previousActive !== undefined'), 'x-link avoids initial inactive xstate writes');

  context.assert(packageManifest.scripts['test:docs-php-ssr-performance-budget'] === 'node scripts/run_xtend_tests.js docs-php-ssr-performance-budget', 'package exposes docs PHP SSR performance budget script');
  context.assert(runner.includes("id: 'docs-php-ssr-performance-budget'"), 'test runner registers docs PHP SSR performance budget suite');
  context.assert(packageManifest.xtend.docsPhpSsrPerformanceBudget.schema === DOCS_PHP_SSR_PERFORMANCE_SCHEMA, 'package metadata records docs SSR performance budget schema');
  context.assert(packageManifest.xtend.docsPhpSsrPerformanceBudget.legacySchema === DOCS_PHP_SSR_PERFORMANCE_LEGACY_SCHEMA, 'package metadata retains the V1 performance budget reader');
  context.assert(packageManifest.xtend.docsPhpSsrPerformanceBudget.reportSchema === DOCS_PHP_SSR_PERFORMANCE_REPORT_SCHEMA, 'package metadata records docs SSR performance report schema');
  context.assert(packageManifest.xtend.docsPhpSsrPerformanceBudget.legacyReportSchema === DOCS_PHP_SSR_PERFORMANCE_LEGACY_REPORT_SCHEMA, 'package metadata retains the V1 performance report reader');
  context.assert(packageManifest.xtend.docsPhpSsrPerformanceBudget.localGate === DOCS_PHP_SSR_PERFORMANCE_LOCAL_GATE, 'package metadata records docs SSR performance budget local gate');

  return context.result({
    schema: DOCS_PHP_SSR_PERFORMANCE_REPORT_SCHEMA,
    performanceSchema: DOCS_PHP_SSR_PERFORMANCE_SCHEMA,
    localGate: DOCS_PHP_SSR_PERFORMANCE_LOCAL_GATE,
    budgets: {
      htmlBytes: DOCS_HTML_BUDGET_BYTES,
      prehydrationBytes: DOCS_PREHYDRATION_BUDGET_BYTES,
      ssrXLinkCount: DOCS_SSR_XLINK_BUDGET,
      rmtMetadataAttributeCount: DOCS_RMT_METADATA_ATTR_BUDGET
    },
    measurements: {
      htmlBytes,
      prehydrationBytes,
      ssrXLinkCount,
      ssrTrunkLinkCount,
      ssrActiveTrunkContentCount,
      rmtMetadataAttrCount,
      largestRoutes: largestRouteMeasurements
    }
  });
}

function printDocsPhpSsrPerformanceBudgetReport(result) {
  printSuiteReport(result, {
    successTitle: 'Docs-App PHP SSR Performance Budget erfolgreich.',
    failureTitle: 'Docs-App PHP SSR Performance Budget fehlgeschlagen:'
  });
}

module.exports = {
  DOCS_PHP_SSR_PERFORMANCE_LOCAL_GATE,
  DOCS_PHP_SSR_PERFORMANCE_SCHEMA,
  runDocsPhpSsrPerformanceBudgetSuite,
  printDocsPhpSsrPerformanceBudgetReport
};
