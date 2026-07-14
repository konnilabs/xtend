'use strict';

const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');

const LANDING_PAGE_PATH = 'index.html';
const LANDING_STYLE_PATH = 'landing.css';
const LANDING_BROWSER_SMOKE_PATH = 'scripts/smoke_landing_page.mjs';
const PRELOADED_TAGS = ['xstate', 'x-theme', 'x-icon', 'x-header', 'x-hero', 'x-type'];
const LAZY_TAGS = ['x-section', 'x-cards', 'x-code', 'x-footer'];

function readText(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function countMatches(source, pattern) {
  return Array.from(String(source || '').matchAll(pattern)).length;
}

function extractPreloadTags(html) {
  const match = html.match(/<meta\s+name="xtend-preload"\s+content="([^"]+)"/u);
  if (!match) return [];
  return match[1].split(',').map((tag) => tag.trim()).filter(Boolean);
}

function runLandingPageSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'landing-page',
    label: 'XTend project landing page'
  });
  const html = readText(rootDir, LANDING_PAGE_PATH);
  const css = readText(rootDir, LANDING_STYLE_PATH);
  const manifest = JSON.parse(readText(rootDir, 'components/manifest.json'));
  const browserSmoke = readText(rootDir, LANDING_BROWSER_SMOKE_PATH);
  const apiSource = readText(rootDir, 'api.js');
  const loaderSource = readText(rootDir, 'xtend-loader.js');
  const classicDevApiSource = readText(rootDir, 'xtend-classic-dev-api.js');
  const packageManifest = JSON.parse(readText(rootDir, 'package.json'));
  const preloadTags = extractPreloadTags(html);

  context.assert(/^<!DOCTYPE html>/u.test(html), 'Landing page remains an authored HTML document');
  context.assert(html.includes('<html lang="en" data-theme="dark">'), 'Landing page is English and starts with the branded dark theme');
  context.assert(countMatches(html, /<h1(?:\s|>)/gu) === 1, 'Landing page exposes exactly one H1');
  context.assert(html.includes('<main id="main-content">') && html.includes('class="skip-link" href="#main-content"'), 'Landing page exposes a main landmark and skip link');
  context.assert(html.includes('type="module" src="xtend-loader.js" data-manifest="components/manifest.json" data-dev-api="true"'), 'Landing page uses the canonical local loader, explicit manifest and Classic DEV API opt-in');
  context.assert(JSON.stringify(preloadTags) === JSON.stringify(PRELOADED_TAGS), 'Landing page preloads the complete first-viewport component set in deterministic order');
  context.assert(PRELOADED_TAGS.every((tag) => Object.prototype.hasOwnProperty.call(manifest, tag)), 'Every preloaded tag resolves through the local component manifest');
  context.assert(LAZY_TAGS.every((tag) => !preloadTags.includes(tag) && html.includes(`<${tag}`)), 'Below-the-fold component families remain loader-lazy');
  context.assert(html.includes('background-image="background.webp"') && html.includes('src="landing-assets/xtend-scaffold.webp"'), 'XHero background and XTend logo preserve the corporate design');
  context.assert(html.includes('rel="preload" href="background.webp" as="image"') && html.includes('rel="preload" href="landing-assets/xtend-scaffold.webp" as="image"'), 'First-viewport image assets are preloaded');
  context.assert(fs.existsSync(path.join(rootDir, 'background.webp')) && fs.existsSync(path.join(rootDir, 'landing-assets/xtend-scaffold.webp')), 'First-viewport image assets exist locally');
  context.assert(html.includes('rel="preload" href="landing-assets/github-invertocat-white.svg" as="image"') && fs.existsSync(path.join(rootDir, 'landing-assets/github-invertocat-white.svg')), 'Official local GitHub Invertocat asset is preloaded and present');
  context.assert(!html.includes('src="icons/') && !html.includes('href="icons/'), 'Landing assets avoid the Apache-reserved /icons alias');
  context.assert(html.includes('href="landing.css"') && fs.existsSync(path.join(rootDir, LANDING_STYLE_PATH)), 'Landing design is isolated in a local stylesheet');
  context.assert(!html.includes('icons/speed.png') && !html.includes('icons/simplicity.png') && !html.includes('icons/security.png'), 'Landing page no longer references missing feature icons');
  context.assert(!html.includes('https://cdn.ccs-networks.de/xtend') && !html.includes('type="importmap"'), 'Landing page has no XTend CDN or import-map bridge');
  context.assert(!/<script[^>]+(?:maraca|xtendrmt|rmt-runtime)/iu.test(html), 'Landing runtime does not load Maraca, RMT App Runtime, or SSR code');
  context.assert(countMatches(html, /<script[^>]+src="xtend-loader\.js"/gu) === 1 && !/<script[^>]+src="xtend-classic-dev-api\.js"/u.test(html), 'Classic DEV API remains owned by the single loader script');
  context.assert(loaderSource.includes('Promise.all([') && loaderSource.includes('prepareClassicDevApi(options, loaderScript)') && loaderSource.includes('fetchManifest(manifestUrl, { moduleCacheBust })'), 'Loader starts the opt-in DEV service and manifest in parallel');
  context.assert(loaderSource.includes("Object.prototype.hasOwnProperty.call(options, 'devApi')") && loaderSource.includes('return options.devApi === true') && loaderSource.includes("getAttribute('data-dev-api')"), 'Programmatic boolean DEV API option takes precedence over the declarative opt-in');
  context.assert(loaderSource.includes('xtend.loader.dev_api.init_failed') && loaderSource.includes('return null;'), 'DEV API initialization failure degrades without blocking loader boot');
  context.assert(classicDevApiSource.includes('existingApi') && classicDevApiSource.includes('createNoopController(existingApi)'), 'Classic DEV service preserves an existing host-owned API');
  ['Web Components', 'RMT', 'Maraca', 'Fabric', 'XScaler', 'XSurface Shard'].forEach((term) => {
    context.assert(html.includes(term), `Landing content represents ${term}`);
  });
  context.assert(html.includes('XTend Classic') && !html.includes('>Classic HTML<') && !html.includes('uses the classic path'), 'Landing page uses the visible XTend Classic product brand');
  context.assert(html.includes('docs/index.php?xtend-docs-page=xtend-classic&amp;locale=en'), 'Landing Classic path links to the canonical English guide');
  ['#why-xtend', '#runtime-paths', '#platform-stack'].forEach((target) => {
    context.assert(html.includes(`href="${target}"`) && html.includes(`id="${target.slice(1)}"`), `Landing navigation target ${target} is stable`);
  });
  context.assert(html.includes('docs/index.php?xtend-docs-page=quick-start-guide&amp;locale=en'), 'Primary CTA targets the English Quick Start');
  context.assert(html.includes('https://github.com/konnilabs/xtend') && html.includes('https://www.npmjs.com/package/@ccslabs/xtend'), 'Landing page exposes GitHub and npm destinations');
  context.assert(countMatches(html, /<x-icon class="github-icon" src="landing-assets\/github-invertocat-white\.svg"/gu) === 3 && countMatches(html, /class="[^"]*github-link[^"]*" href="https:\/\/github\.com\/konnilabs\/xtend"/gu) === 3, 'Every GitHub destination uses the local Invertocat through XIcon');
  context.assert(html.includes('<x-type') && html.includes('hero-static-text') && html.includes('hero-animated-text'), 'Hero retains XType with a static motion-safe fallback');
  context.assert(html.includes('<template data-x-code-mode="text">') && html.includes('&lt;meta name="xtend-preload"'), 'Classic example uses XCode text mode without double escaping');
  context.assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('.hero-animated-text') && css.includes('.hero-static-text'), 'Landing stylesheet switches XType off for reduced motion');
  context.assert(css.includes('min-width: 18ch') && css.includes('--hero-reserved-block-size: calc(100svh - var(--landing-header-height))'), 'Hero reserves rotating text and first-viewport geometry');
  context.assert(css.includes('.landing-header:not(:defined)') && css.includes('.landing-hero:not(:defined) > *'), 'Undefined first-viewport components reserve geometry without exposing light DOM');
  context.assert(css.includes('@media (max-width: 700px)') && css.includes('overflow-x'), 'Landing stylesheet owns responsive and overflow-safe presentation');
  context.assert(css.includes('.landing-code-section::part(container)') && css.includes('.landing-code-section::part(content)') && css.includes('--x-code-bg: #050506') && css.includes('--x-code-padding: 1.2rem 1.5rem 1.35rem'), 'Classic example reuses the Docs XCode surface and spacing through public styling contracts');
  context.assert(css.includes('--footer-content-max: 100%') && css.includes('.landing-footer::part(root)') && css.includes('.github-link'), 'Footer owns a full-bleed surface and aligned icon links');
  context.assert(browserSmoke.includes('RUNS_PER_SCENARIO = 3'), 'Browser smoke uses three cold-cache runs per viewport');
  context.assert(browserSmoke.includes("fcpBudgetMs: 1500") && browserSmoke.includes("fcpBudgetMs: 2000"), 'Browser smoke enforces desktop and mobile FCP budgets');
  context.assert(browserSmoke.includes('LCP_BUDGET_MS = 2500') && browserSmoke.includes('CLS_BUDGET = 0.05'), 'Browser smoke enforces LCP and CLS budgets');
  context.assert(browserSmoke.includes('classicCodeSectionOverflowX') && browserSmoke.includes('double-escaped markup'), 'Browser smoke guards the classic code rendering and overflow regression');
  context.assert(browserSmoke.includes('footerFullBleed') && browserSmoke.includes('githubIconsReady'), 'Browser smoke guards footer width and GitHub icon loading');
  context.assert(browserSmoke.includes('devApiPresent') && browserSmoke.includes('fabricSupported') && browserSmoke.includes('kernelSupported'), 'Browser smoke validates the Classic DEV API and honest unsupported runtime capabilities');
  context.assert(browserSmoke.includes('classicBrandVisible') && browserSmoke.includes('classicGuideLinked'), 'Browser smoke validates visible Classic branding and canonical guide navigation');
  context.assert(apiSource.includes('customElements.whenDefined(tag)') && apiSource.includes('await waitForRuntimeReady(tag)'), 'Browser API waits for asynchronous Custom Element registration before validating runtime readiness');
  context.assert(!browserSmoke.includes('knownLoaderDiagnostics') && browserSmoke.includes('severeLogs.length === 0'), 'Browser smoke rejects every severe loader or asset diagnostic');
  context.assert(browserSmoke.includes("['xstate', 'x-theme', 'x-icon', 'x-header', 'x-hero', 'x-type']") && browserSmoke.includes("['x-section', 'x-cards', 'x-code', 'x-footer']"), 'Browser smoke covers the complete preload and lazy component boundaries');
  context.assert(packageManifest.scripts['test:landing-page'] === 'node scripts/run_xtend_tests.js landing-page', 'Package exposes the isolated landing-page gate');
  context.assert(packageManifest.scripts['test:landing-page:browser'] === 'node scripts/smoke_landing_page.mjs', 'Package exposes the real landing browser smoke');
  context.assert(packageManifest.scripts['test:pr'].includes('landing-page') && packageManifest.scripts['test:pr:report'].includes('landing-page'), 'PR aggregates include the landing-page gate');
  context.assert(packageManifest.scripts['test:release:full'].includes('landing-page') && packageManifest.scripts['test:release:full:report'].includes('landing-page'), 'Full-release aggregates include the landing-page gate');
  context.assert(packageManifest.xtend.ciGateMatrix.prFastGate.suites.includes('landing-page') && packageManifest.xtend.ciGateMatrix.fullReleaseGate.suites.includes('landing-page'), 'CI gate metadata includes the landing-page suite');
  context.assert(packageManifest.files.includes('xtend-classic-dev-api.js') && packageManifest.files.includes('xtend-classic-dev-api.d.ts'), 'Root package publishes the internal Classic DEV API service and declarations');
  context.assert(!Object.keys(packageManifest.exports || {}).some((entry) => entry.includes('dev-api')), 'Classic DEV API adds no direct package export');

  return context.result({
    report: {
      schema: 'xtend.landing-page.report.v1',
      preloadTags,
      lazyTags: LAZY_TAGS.slice(),
      browserSmoke: LANDING_BROWSER_SMOKE_PATH
    }
  });
}

function printLandingPageReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend project landing page gate passed.',
    failureTitle: 'XTend project landing page gate failed:'
  });
}

if (require.main === module) {
  const result = runLandingPageSuite();
  printLandingPageReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  LANDING_BROWSER_SMOKE_PATH,
  LANDING_PAGE_PATH,
  LANDING_STYLE_PATH,
  printLandingPageReport,
  runLandingPageSuite
};
