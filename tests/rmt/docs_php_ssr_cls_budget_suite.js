const path = require('path');
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

const DOCS_PHP_SSR_CLS_SCHEMA = 'xtend.docs.php-ssr-cls-budget.v1';
const DOCS_PHP_SSR_CLS_LOCAL_GATE = 'node scripts/run_xtend_tests.js docs-php-ssr-cls-budget --json';

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

function extractBodyShell(html) {
  const match = String(html || '').match(/<body[^>]*>\s*([\s\S]*?)<script\b(?=[^>]*\bsrc="\/docs\/utils\/pageloader\.js(?:\?[^" ]*)?")[^>]*>/su);
  return match ? match[1] : '';
}

function runDocsPhpSsrClsBudgetSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'docs-php-ssr-cls-budget',
    label: 'Docs-App PHP SSR CLS Budget'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const result = runDocsIndex(rootDir, {});
  const html = result.stdout || '';
  const shell = extractBodyShell(html);

  context.assert(result.status === 0, `Docs HTML renders through PHP${result.status === 0 ? '' : ` (${result.stderr})`}`);
  context.assert(indexPhp.includes('--docs-route-reserved-block-size: max(42rem, calc(100svh - 12rem));'), 'Docs app defines a desktop route reserve that keeps the footer below the initial viewport');
  context.assert(indexPhp.includes('--docs-header-reserved-block-size: 7.55rem;') && indexPhp.includes('--docs-header-reserved-block-size: 11.75rem;'), 'Docs app reserves measured desktop and compact header geometry');
  context.assert(indexPhp.includes('--docs-hero-reserved-block-size: 11rem;') && indexPhp.includes('--docs-hero-reserved-block-size: 12rem;'), 'Docs app reserves desktop and wrapped mobile hero geometry');
  context.assert(indexPhp.includes('--docs-footer-reserved-block-size: clamp(4.75rem, 7vw, 6.5rem);'), 'Docs app defines a footer reserve matching hydrated footer geometry');
  context.assert(indexPhp.includes('--docs-route-reserved-block-size: max(48rem, calc(100svh - 10rem));'), 'Docs app defines a stronger mobile route reserve');
  context.assert(indexPhp.includes('--docs-footer-reserved-block-size: 7.5rem;'), 'Docs app reserves mobile footer wrapping height');
  context.assert(indexPhp.includes('main > x-router::part(outlet)') && indexPhp.includes('min-block-size: var(--docs-route-reserved-block-size);'), 'Docs router outlet reserves route geometry');
  context.assert(indexPhp.includes('x-footer') && indexPhp.includes('contain-intrinsic-size: auto var(--docs-footer-reserved-block-size);'), 'Docs footer reserves intrinsic geometry before hydration');
  context.assert(shell.includes('data-xtend-cls-anchor="docs.main"'), 'Initial SSR shell marks main CLS anchor');
  context.assert(shell.includes('data-xtend-cls-anchor="docs.router"'), 'Initial SSR shell marks router CLS anchor');
  context.assert(shell.includes('data-xtend-cls-anchor="docs.footer"'), 'Initial SSR shell marks footer CLS anchor');
  context.assert(shell.includes('data-xtend-layout-reserve="shell route"'), 'Initial SSR shell reserves main route geometry');
  context.assert(shell.includes('data-xtend-layout-reserve="router route"'), 'Initial SSR shell reserves router geometry');
  context.assert(shell.includes('data-xtend-layout-reserve="footer"'), 'Initial SSR shell reserves footer geometry');
  context.assert(!shell.includes('<x-footer') || !shell.includes('data-xtend-skeleton="inline"'), 'SSR footer no longer uses inline skeleton geometry');
  context.assert(shell.includes('--footer-reserved-block-size: var(--docs-footer-reserved-block-size);'), 'SSR footer maps docs reserve into x-footer token');
  context.assert(shell.includes('--xtend-router-reserved-block-size: var(--docs-route-reserved-block-size);'), 'SSR router maps docs reserve into x-router token');
  context.assert(shell.includes('--header-reserved-block-size: var(--docs-header-reserved-block-size);'), 'SSR header maps the measured reserve into x-header');
  context.assert(shell.includes('--hero-reserved-block-size: var(--docs-hero-reserved-block-size);'), 'SSR hero maps the responsive reserve into x-hero');
  context.assert(indexPhp.includes('--hero-padding: 0;'), 'Docs hero avoids duplicate root and content padding after upgrade');

  context.assert(pageLoader.includes("section.setAttribute('data-xtend-layout-reserve', 'shell route')"), 'Client fallback shell reserves page geometry');
  context.assert(pageLoader.includes("article.setAttribute('data-xtend-layout-reserve', 'route content')"), 'Client fallback article reserves content geometry');
  context.assert(pageLoader.includes("mdContent.setAttribute('data-xtend-layout-reserve', 'content')"), 'Client content slot preserves layout reserve');
  context.assert(pageLoader.includes("section.setAttribute('data-xtend-cls-anchor'"), 'Client shell preserves CLS anchor metadata');

  context.assert(packageManifest.scripts['test:docs-php-ssr-cls-budget'] === 'node scripts/run_xtend_tests.js docs-php-ssr-cls-budget', 'package exposes docs PHP SSR CLS budget script');
  context.assert(packageManifest.xtend.docsPhpSsrClsBudget.schema === DOCS_PHP_SSR_CLS_SCHEMA, 'package metadata records docs CLS budget schema');
  context.assert(packageManifest.xtend.docsPhpSsrClsBudget.localGate === DOCS_PHP_SSR_CLS_LOCAL_GATE, 'package metadata records docs CLS budget local gate');
  context.assert(runner.includes("id: 'docs-php-ssr-cls-budget'"), 'test runner registers docs PHP SSR CLS budget suite');

  return context.result({
    schema: 'xtend.docs.php-ssr-cls-budget-report.v1',
    clsSchema: DOCS_PHP_SSR_CLS_SCHEMA,
    localGate: DOCS_PHP_SSR_CLS_LOCAL_GATE
  });
}

function printDocsPhpSsrClsBudgetReport(result) {
  printSuiteReport(result, {
    successTitle: 'Docs-App PHP SSR CLS Budget erfolgreich.',
    failureTitle: 'Docs-App PHP SSR CLS Budget fehlgeschlagen:'
  });
}

module.exports = {
  DOCS_PHP_SSR_CLS_LOCAL_GATE,
  DOCS_PHP_SSR_CLS_SCHEMA,
  runDocsPhpSsrClsBudgetSuite,
  printDocsPhpSsrClsBudgetReport
};
