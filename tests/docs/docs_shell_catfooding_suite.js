'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  MARACA_BUILD_CONFIG_SCHEMA,
  MARACA_TUNE_REPORT_SCHEMA,
  createMaracaBuildPlan,
  tuneMaracaBuild
} = require('../../xtend-maraca');

let appRuntimePromise = null;

function readText(relativePath, rootDir) {
  return fs.readFileSync(resolveRepoPath(relativePath, rootDir), 'utf8');
}

function readJson(relativePath, rootDir) {
  return JSON.parse(readText(relativePath, rootDir));
}

function loadAppRuntime(rootDir) {
  if (!appRuntimePromise) appRuntimePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-app-runtime.js', rootDir)}`);
  return appRuntimePromise;
}

async function runRmtSearchRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'rmt-search-runtime', label: 'RMT search runtime' });
  const runtime = await loadAppRuntime(rootDir);
  const compact = [
    { id: 'hydration', slug: 'hydration-policies', title: 'Hydration Policies', keywords: ['Hydrierung', 'resume', 'SSR'] },
    { id: 'devtools', slug: 'xtend-dev-surface', title: 'XTend Dev Surface', keywords: ['telemetry', 'Chromium'] },
    { id: 'animation', slug: 'rmt-animation-engine', title: 'RMT AnimationEngine', keywords: ['transition', 'effects'] }
  ];
  const fulltext = compact.concat([{ id: 'fabric', slug: 'xtend-fabric-runtime', title: 'XTend Fabric Runtime', body: 'Backpressure lanes and fibers' }]);

  context.assert(runtime.normalizeSearchText('Hydrierung & XScaler') === 'hydrierung xscaler', 'search normalization folds punctuation and casing');
  context.assert(runtime.normalizeSearchText('serverPrerender-resume') === 'server prerender resume', 'search normalization splits camel and kebab case');
  const typo = runtime.searchEntries(compact, 'hydratoin', { resultLimit: 8 });
  context.assert(typo[0] && typo[0].slug === 'hydration-policies', 'Damerau-Levenshtein ranks hydratoin as Hydration Policies');
  const localized = runtime.searchEntries(compact, 'Hydrierung', { resultLimit: 8 });
  context.assert(localized[0] && localized[0].slug === 'hydration-policies', 'curated locale keyword ranks related article');

  const loads = [];
  const searchRuntime = runtime.createRmtSearchRuntime({
    searchSources: [{
      id: 'docs.search.de',
      resource: 'compact.de',
      fallbackResource: 'fulltext.de',
      resultLimit: 8,
      fallbackThreshold: 0.6
    }],
    resourceResolver(id) {
      loads.push(id);
      return id === 'compact.de' ? compact : fulltext;
    },
    Worker: null
  });
  const prewarm = await searchRuntime.query('docs.search.de', '');
  context.assert(prewarm.results.length === 0 && loads.join(',') === 'compact.de', 'empty prewarm query never loads fulltext');
  const compactResult = await searchRuntime.query('docs.search.de', 'hydratoin');
  context.assert(compactResult.results.some((entry) => entry.slug === 'hydration-policies'), 'runtime query returns typo match');
  const fallbackResult = await searchRuntime.query('docs.search.de', 'backpressure');
  context.assert(fallbackResult.usedFulltext && fallbackResult.results.some((entry) => entry.slug === 'xtend-fabric-runtime'), 'sparse compact search activates body fallback');
  context.assert(searchRuntime.snapshot().resourceCount === 2, 'runtime caches compact and fulltext resources');

  const cachedWorkerEnvelopes = [];
  const cachedWorkerResources = new Map();
  const cachedWorker = {
    available: true,
    dispatchSearchEnvelope(envelope) {
      cachedWorkerEnvelopes.push(envelope);
      if (envelope.resourceId && Array.isArray(envelope.entries)) cachedWorkerResources.set(envelope.resourceId, envelope.entries);
      const entries = envelope.entries || cachedWorkerResources.get(envelope.resourceId) || [];
      return Promise.resolve({ results: runtime.searchEntries(entries, envelope.query, envelope.options) });
    },
    snapshot: () => ({ schema: runtime.RMT_SEARCH_WORKER_SCHEMA, resourceCache: true }),
    terminate() {}
  };
  const cachedRuntime = runtime.createRmtSearchRuntime({
    searchSources: [{ id: 'docs.search.cached', resource: 'compact.cached' }],
    resources: { 'compact.cached': compact },
    prewarmWorker: cachedWorker
  });
  await cachedRuntime.query('docs.search.cached', 'hydration');
  await cachedRuntime.query('docs.search.cached', 'animation');
  context.assert(Array.isArray(cachedWorkerEnvelopes[0].entries) && cachedWorkerEnvelopes[1].entries === undefined, 'worker receives each search index once and reuses its resource cache');

  const delayedWorker = {
    available: true,
    dispatchSearchEnvelope(envelope) {
      return new Promise((resolve) => setTimeout(() => resolve({
        results: runtime.searchEntries(envelope.entries, envelope.query, envelope.options)
      }), envelope.query === 'hydratoin' ? 20 : 0));
    },
    snapshot: () => ({ schema: 'test.worker' }),
    terminate() {}
  };
  const supersessionRuntime = runtime.createRmtSearchRuntime({
    searchSources: [{ id: 'docs.search', resource: 'compact' }],
    resources: { compact },
    prewarmWorker: delayedWorker
  });
  const first = supersessionRuntime.query('docs.search', 'hydratoin');
  const second = supersessionRuntime.query('docs.search', 'animation');
  const [superseded, latest] = await Promise.all([first, second]);
  context.assert(superseded.superseded && superseded.results.length === 0, 'older worker result is superseded');
  context.assert(!latest.superseded && latest.results[0].slug === 'rmt-animation-engine', 'latest worker generation owns result');
  searchRuntime.dispose();
  cachedRuntime.dispose();
  supersessionRuntime.dispose();
  return context.result({ schema: runtime.RMT_SEARCH_RUNTIME_SCHEMA });
}

async function runRmtPrewarmWorkerSearchSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'rmt-prewarm-worker-search', label: 'RMT prewarm worker search' });
  const runtime = await loadAppRuntime(rootDir);
  const source = runtime.createRmtSearchWorkerSource();
  context.assert(source.includes("message.action!=='search_index'"), 'worker source accepts only search_index');
  context.assert(!/\b(document|localStorage|sessionStorage|chrome\.devtools)\b/u.test(source), 'worker source owns no DOM, storage or DevTools API');
  context.assert(source.includes('Unsupported prewarm search action'), 'worker rejects unknown actions');
  context.assert(source.includes('const searchIndexes=new Map()') && source.includes('Search index cache miss.'), 'worker caches allowlisted indexes and reports cache misses');

  const messages = [];
  class FakeWorker {
    postMessage(message) {
      messages.push(message);
      queueMicrotask(() => this.onmessage({
        data: { id: message.id, ok: true, result: { schema: runtime.RMT_SEARCH_RESPONSE_SCHEMA, results: [] } }
      }));
    }
    terminate() {}
  }
  class FakeBlob {}
  const worker = runtime.createRmtSearchPrewarmWorker({
    Worker: FakeWorker,
    Blob: FakeBlob,
    URL: { createObjectURL: () => 'blob:search-worker', revokeObjectURL() {} }
  });
  await worker.dispatchSearchEnvelope({ generation: '1', entries: [], query: 'test', options: {} });
  context.assert(messages.length === 1 && messages[0].action === 'search_index', 'dispatch uses allowlisted worker task');
  const snapshot = worker.snapshot();
  context.assert(snapshot.resourceCache === true && snapshot.cachedResourceCount === 0, 'worker snapshot exposes bounded search-index cache ownership');
  context.assert(snapshot.ownership.dom === false && snapshot.ownership.events === false && snapshot.ownership.state === false, 'worker snapshot denies DOM, event and state ownership');
  worker.terminate('test-complete');
  return context.result({ workerSchema: runtime.RMT_SEARCH_WORKER_SCHEMA });
}

function runXtendLoaderSkeletonProfilesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xtend-loader-skeleton-profiles', label: 'XTend Loader skeleton profiles' });
  const loader = readText('xtend-loader.js', rootDir);
  const types = readText('xtend-loader.d.ts', rootDir);
  const router = readText('components/xrouter.js', rootDir);
  const docsRuntime = readText('docs/utils/docs-shell-runtime.mjs', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  context.assert(loader.includes("SKELETON_PROFILE_CONTRACT = 'xtend.loader.skeleton-profile.v1'"), 'loader declares skeleton profile schema');
  context.assert(loader.includes('registerSkeletonProfile') && loader.includes('getSkeletonProfile') && loader.includes('listSkeletonProfiles'), 'loader exposes profile registry');
  context.assert(loader.includes('data-xtend-skeleton-viewport') && loader.includes('responsiveSource'), 'loader resolves responsive profile geometry');
  context.assert(loader.includes('normalizeSkeletonCount') && loader.includes('Number.isFinite(parsed)'), 'loader converts invalid line and repeat counts to finite fallbacks');
  context.assert(loader.includes("skeletonItem.style.background = 'var(--xtend-skeleton-line-bg") && loader.includes("skeletonItem.style.display = 'block'"), 'profile items retain visible inline geometry without stylesheet timing');
  context.assert(loader.includes('skeletonHasVisualRecords(existing)') && loader.includes('if (existing) existing.remove()'), 'loader replaces stale empty skeleton records');
  context.assert(loader.includes('@media (prefers-reduced-motion: reduce)'), 'loader preserves reduced-motion geometry policy');
  context.assert(types.includes('responsive?:') && types.includes('breakpoint?: string'), 'loader types expose responsive descriptor');
  context.assert(router.includes("getAttribute('skeleton-profile')") && !router.includes('_createFallbackRouteSkeleton'), 'x-router consumes profiles without local skeleton DOM');
  context.assert(docsRuntime.includes("registerProfile('docs-article'") && docsRuntime.includes("registerProfile('docs-navigation'") && docsRuntime.includes("registerProfile('docs-search'"), 'docs registers article, navigation and search profiles');
  const skeletonBlock = pageLoader.slice(pageLoader.indexOf('function showDocsSkeleton'), pageLoader.indexOf('function hideDocsSkeleton'));
  context.assert(!skeletonBlock.includes('document.createElement'), 'Docs skeleton path contains no local DOM builder');
  context.assert(skeletonBlock.includes("data-xtend-skeleton-degraded', 'invalid-geometry'") && skeletonBlock.includes("target.removeAttribute('data-xtend-skeleton-active')"), 'Docs rejects empty loader geometry without obscuring content');
  context.assert(pageLoader.includes("data-docs-stale-content-preserved") && !pageLoader.includes('while (shell.mdContent.firstChild)'), 'Docs preserves committed text when skeleton materialization degrades');
  return context.result({ schema: 'xtend.loader.skeleton-profile.v1' });
}

async function runMaracaTuneSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'maraca-tune', label: 'Maraca deterministic tune' });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-tune-suite-'));
  const configPath = path.join(tempDir, 'maraca.config.json');
  const outDir = path.join(tempDir, 'dist');
  try {
    const writeReport = await tuneMaracaBuild({
      source: 'xtendrmt/rmt-first-demo-app.rmt',
      config: configPath,
      out: outDir,
      write: true
    }, { rootDir });
    context.assert(writeReport.schema === MARACA_TUNE_REPORT_SCHEMA && writeReport.ok, 'tune --write succeeds with report schema');
    context.assert(writeReport.candidateCount === 12, 'tune evaluates all twelve candidates');
    context.assert(writeReport.candidates.every((candidate) => candidate.toolchain === 'rollup-terser'), 'every candidate uses Rollup and Terser');
    context.assert(writeReport.selected && fs.existsSync(configPath), 'tune writes selected config');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    context.assert(config.schema === MARACA_BUILD_CONFIG_SCHEMA && config.configFingerprint, 'written config is fingerprinted');
    const checkReport = await tuneMaracaBuild({
      source: 'xtendrmt/rmt-first-demo-app.rmt',
      config: configPath,
      out: outDir,
      check: true
    }, { rootDir });
    context.assert(checkReport.ok && checkReport.status === 'checked' && checkReport.configMatches, 'tune --check reproduces selection');
    const overridePlan = createMaracaBuildPlan({ config: configPath, profile: 'production' }, { rootDir });
    context.assert(overridePlan.profile === 'production', 'explicit CLI-style option overrides config selection');
    const driftConfigPath = path.join(tempDir, 'drift.config.json');
    fs.writeFileSync(driftConfigPath, `${JSON.stringify({ ...config, sourceFingerprint: '0'.repeat(64) }, null, 2)}\n`);
    const driftPlan = createMaracaBuildPlan({ config: driftConfigPath, source: 'xtendrmt/rmt-first-demo-app.rmt' }, { rootDir });
    context.assert(driftPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.build_config_source_drift'), 'source fingerprint drift blocks build plan');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  return context.result({ schema: MARACA_TUNE_REPORT_SCHEMA });
}

function runDocsShellCatfoodingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'docs-shell-catfooding', label: 'Docs shell catfooding' });
  const menu = readJson('docs/menu.json', rootDir);
  const navigation = readJson('docs/navigation.json', rootDir);
  const performanceBaseline = readJson('tests/docs/fixtures/docs-shell-catfooding-performance-baseline.json', rootDir);
  const trunkSections = new Set(navigation.trunks.flatMap((trunk) => trunk.sections.map((section) => `${trunk.id}:${section.id}`)));
  context.assert(navigation.schema === 'xtend.docs.navigation.v1' && navigation.trunks.length === 6, 'navigation contract exposes six task trunks');
  context.assert(menu.length === 165, 'menu keeps 165 canonical bilingual articles');
  context.assert(menu.every((entry) => entry.trunk && entry.section && trunkSections.has(`${entry.trunk}:${entry.section}`)), 'every article has exactly one valid primary trunk and section');
  context.assert(menu.every((entry) => entry.keywords && entry.keywords.de.length && entry.keywords.en.length), 'every article exposes DE and EN keywords');
  context.assert(performanceBaseline.schema === 'xtend.docs.shell-performance-baseline.v1' && performanceBaseline.regressionLimit === 0.05, 'browser baseline locks the five-percent FCP and transfer regression limit');
  context.assert(['de-desktop', 'en-mobile'].every((id) => performanceBaseline.scenarios[id] && performanceBaseline.scenarios[id].sampleCount === 3), 'browser baseline records three pre-refactor samples per target viewport');

  ['de', 'en'].forEach((locale) => {
    const compactPath = `docs/generated/search/${locale}.compact.json`;
    const fulltextPath = `docs/generated/search/${locale}.fulltext.json`;
    const compactText = readText(compactPath, rootDir);
    const fulltextText = readText(fulltextPath, rootDir);
    const compact = JSON.parse(compactText);
    const fulltext = JSON.parse(fulltextText);
    context.assert(compact.schema === 'xtend.docs.search-index.v1' && compact.entryCount === 165, `${locale} compact index has contract and full inventory`);
    context.assert(fulltext.schema === 'xtend.docs.search-fulltext-index.v1' && fulltext.entryCount === 165, `${locale} fulltext index has contract and full inventory`);
    context.assert(zlib.gzipSync(compactText, { level: 9 }).length <= 25 * 1024, `${locale} compact index stays within 25 KiB gzip`);
    context.assert(zlib.gzipSync(fulltextText, { level: 9 }).length <= 150 * 1024, `${locale} fulltext index stays within 150 KiB gzip`);
  });

  const source = readText('docs/xtendrmt-docs-shell-vnext.rmt', rootDir);
  const compileResult = compileRmtVNextSource({ text: source, filePath: 'docs/xtendrmt-docs-shell-vnext.rmt' });
  const searchSources = compileResult.coreDocument && compileResult.coreDocument.searchSources || [];
  context.assert(compileResult.ok && searchSources.length === 2, 'Docs RMT source compiles two locale search sources');
  context.assert(searchSources.every((entry) => entry.debounceMs === 80 && entry.resultLimit === 8 && entry.fallbackThreshold === 0.6), 'AOT search policy locks debounce, limit and fallback');

  const shellRuntime = readText('docs/utils/docs-shell-runtime.mjs', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const routerSource = readText('components/xrouter.js', rootDir);
  const workflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const browserSmoke = readText('scripts/smoke_docs_shell_catfooding.mjs', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const forbiddenShellPatterns = [/\.addEventListener\s*\(/u, /document\.createElement\s*\(/u, /\.replaceChildren\s*\(/u, /\.innerHTML\s*=/u, /\beval\s*\(/u, /new\s+Function\s*\(/u, /https?:\/\//u];
  context.assert(forbiddenShellPatterns.every((pattern) => !pattern.test(shellRuntime)), 'AppRuntime shell contains no free listeners, DOM builders, HTML sinks, eval or remote code');
  context.assert(!pageLoader.includes('createFallbackSearchShell') && !pageLoader.includes('wireSearchForm') && !pageLoader.includes('renderMenu()'), 'page host no longer owns legacy search or navigation runtimes');
  context.assert(indexPhp.includes('/docs/utils/dev-api.js') && indexPhp.includes('/docs/utils/docs-shell-runtime.mjs'), 'SSR host installs DEV API and AppRuntime shell');
  context.assert(indexPhp.includes('/docs/utils/docs-shell-runtime.mjs?v=<?= $xtendAssetVersionAttr ?>'), 'SSR host cache-busts the Docs shell runtime with the shared asset version');
  context.assert(indexPhp.includes("'data-docs-home-logo' => true") && indexPhp.includes("docsBuildHistoryRoutePath('readme', $pageLocale"), 'SSR header logo uses x-link with a localized Docs home route');
  context.assert(indexPhp.includes('minmax(18.75rem, 1fr) minmax(20rem, 48rem) minmax(15rem, 1fr) 44px') && indexPhp.includes('max-width: 48rem;'), 'Docs header reserves a wide centered desktop search track');
  context.assert(indexPhp.includes('.docs-search-popover::part(trigger)') && indexPhp.includes('.docs-search-popover::part(root)'), 'Docs search expands the visible popover trigger and results panel with the centered track');
  context.assert(indexPhp.includes('--docs-navigation-item-surface:') && indexPhp.includes('.docs-menu-shell x-link[role="menuitem"]'), 'Docs task navigation scopes neutral menuitem surfaces instead of inheriting the global button palette');
  context.assert(indexPhp.includes('@media (max-width: 1100px)') && indexPhp.includes('"brand actions trigger" "search search search"'), 'Docs search moves to a centered full-width row before header actions become constrained');
  context.assert(shellRuntime.includes('window.XTendFabric.createXtendFabric') && shellRuntime.includes('fabric.createTelemetrySnapshot({'), 'AppRuntime shell owns Fabric and telemetry directly');
  context.assert(shellRuntime.includes("XUtils.on(window, 'xtend-api-ready'") && shellRuntime.includes("XUtils.on(document, 'theme-api-ready'"), 'Theme controls defer through XTend readiness events instead of boot-time polling');
  context.assert(shellRuntime.includes('router.registerRoutes(records, {') && shellRuntime.includes("render: false"), 'AppRuntime registers the full route table after SSR without forcing a second render');
  context.assert(shellRuntime.includes("XUtils.on(window, 'xtend-docs-locale-transition'") && pageLoader.includes('shellRuntime.prepareLocaleRoutes(normalized)'), 'locale intent registers target routes before x-router navigation');
  context.assert(pageLoader.includes('function getExactLocalizedDocsMap') && pageLoader.includes("getExactLocalizedDocsMap('xtendDocsLocalizedPages', normalizedLocale)"), 'lazy article cache never treats an unloaded locale as a fallback-locale cache hit');
  const localizedPayloadBlock = pageLoader.slice(pageLoader.indexOf('function loadDocsParsedownContent'), pageLoader.indexOf('function prefetchDocsLocalePage'));
  context.assert(!localizedPayloadBlock.includes('window.xtendDocsPages'), 'localized payload loading never reads the language-neutral legacy page cache');
  context.assert(routerSource.includes('const documentTitle = explicitDocumentTitle || templatedTitle'), 'x-router preserves explicit document titles instead of applying a second template suffix');
  context.assert(indexPhp.includes('$activeMeta = $localizedAllPagesMeta[$pageLocale][$activeSlug]'), 'SSR shell materializes only the active route before hydration');
  context.assert(!indexPhp.includes('/docs/utils/fabric-runtime.js'), 'SSR host does not load the retired Docs Fabric parallel runtime');
  context.assert(!indexPhp.includes("document.addEventListener('DOMContentLoaded'"), 'SSR HTML contains no imperative inline shell controller');
  context.assert(indexPhp.includes('window.xtendDocsLocalizedPages = Object.create(null);') && indexPhp.includes('window.xtendDocsPages = Object.create(null);'), 'SSR bootstrap does not embed the bilingual Parsedown corpus');
  context.assert(indexPhp.includes("worker-src 'self' blob:"), 'CSP permits only local/blob prewarm worker source');
  context.assert(fs.existsSync(resolveRepoPath('scripts/smoke_docs_shell_catfooding.mjs', rootDir)), 'ChromeDriver shell smoke exists');
  context.assert(browserSmoke.includes("process.argv.includes('--capture-baseline')"), 'ChromeDriver shell smoke can reproduce the pre-refactor performance baseline');
  context.assert(browserSmoke.includes('navigateHomeViaLogo') && browserSmoke.includes('exerciseSkeletonHardening') && browserSmoke.includes('switchDocsLocale') && browserSmoke.includes('searchGeometry.centerDelta'), 'ChromeDriver shell smoke covers logo navigation, locale title ownership, centered search geometry and invalid skeleton recovery');
  context.assert(browserSmoke.includes('search.presentation.textContrast >= 4.5') && browserSmoke.includes('fallbackSearch.presentation.maxLongTaskMs <= 120'), 'ChromeDriver shell smoke enforces search contrast and compact/fulltext main-thread budgets');
  context.assert(browserSmoke.includes('exerciseNavigationSurface') && browserSmoke.includes('navigationAppearances.every((entry) => entry && entry.contrast >= 4.5)') && browserSmoke.includes('inactiveUsesPrimarySurface'), 'ChromeDriver shell smoke enforces navigation contrast, active-state distinction and primary-surface isolation');
  context.assert(browserSmoke.includes('runMaracaRouteRegression') && browserSmoke.includes('result.maxLongTaskMs <= 1000') && browserSmoke.includes('activeSkeletonCount === 0'), 'ChromeDriver shell smoke blocks Maraca menu feedback stalls and stale skeleton layers');
  context.assert(workflow.includes('npm run test:docs-shell-catfooding:report') && workflow.includes('xtend-docs-shell-catfooding-report.json'), 'default CI runs and uploads the Catfooding report');
  context.assert(nightlyWorkflow.includes('id: docs_shell_catfooding') && nightlyWorkflow.includes('Docs Shell catfooding gate failed'), 'nightly CI treats Catfooding evidence as required');
  context.assert(packageManifest.xtend.docsPhpSsrPerformanceBudget.htmlBudgetBytes === 256 * 1024, 'package metadata locks the compact 256 KiB SSR HTML budget');
  return context.result({ articleCount: menu.length, trunkCount: navigation.trunks.length });
}

function printDocsShellCatfoodingReport(result) {
  printSuiteReport(result, {
    successTitle: `${result.label} suite passed.`,
    failureTitle: `${result.label} suite failed:`
  });
}

module.exports = {
  printDocsShellCatfoodingReport,
  runDocsShellCatfoodingSuite,
  runMaracaTuneSuite,
  runRmtPrewarmWorkerSearchSuite,
  runRmtSearchRuntimeSuite,
  runXtendLoaderSkeletonProfilesSuite
};
