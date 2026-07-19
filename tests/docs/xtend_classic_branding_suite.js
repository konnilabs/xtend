'use strict';

const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  executableCodeBlocks,
  markdownTargets
} = require('./scoped_package_readmes_suite');

const GUIDE_PATHS = ['docs/en/xtend-classic.md', 'docs/de/xtend-classic.md'];
const BRAND_ENTRY_PATHS = [
  'README.md',
  'index.html',
  'docs/en/README.md',
  'docs/de/README.md',
  'docs/en/quick-start-guide.md',
  'docs/de/quick-start-guide.md',
  'docs/en/xtend-maraca.md',
  'docs/de/xtend-maraca.md',
  'xtend-maraca/README.md',
  'xtend-builder/README.md',
  'tools/README.md'
];

function readText(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function missingRelativeLinks(rootDir, relativePath, text) {
  return markdownTargets(text).filter((target) => {
    const absolute = path.resolve(rootDir, path.dirname(relativePath), target);
    return !absolute.startsWith(rootDir) || !fs.existsSync(absolute);
  });
}

function runXtendClassicBrandingSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'xtend-classic-branding',
    label: 'XTend Classic product branding'
  });
  const packageManifest = JSON.parse(readText(rootDir, 'package.json'));
  const menu = JSON.parse(readText(rootDir, 'docs/menu.json'));
  const classicMenu = menu.find((entry) => entry.slug === 'xtend-classic');
  const englishGuide = readText(rootDir, GUIDE_PATHS[0]);
  const germanGuide = readText(rootDir, GUIDE_PATHS[1]);

  context.assert(Boolean(classicMenu), 'Docs menu exposes the canonical xtend-classic entry');
  context.assert(classicMenu && classicMenu.id === 'docs.xtend.classic' && classicMenu.label === 'XTend Classic', 'Canonical menu identity uses XTend Classic');
  context.assert(classicMenu && Array.isArray(classicMenu.aliases) && classicMenu.aliases.includes('xtend-loader'), 'Legacy docs slug remains a redirect alias');
  context.assert(!menu.some((entry) => entry.slug === 'xtend-loader'), 'Alias does not create an additional docs article');
  context.assert(GUIDE_PATHS.every((entry) => fs.existsSync(path.join(rootDir, entry))), 'English and German canonical guides exist');
  context.assert(!fs.existsSync(path.join(rootDir, 'docs/en/xtend-loader.md')) && !fs.existsSync(path.join(rootDir, 'docs/de/xtend-loader.md')), 'Old authored guide paths are replaced by the canonical guide');

  ['XTend Classic', 'xtend-loader.js', 'components/manifest.json', 'xtend-preload', 'data-dev-api="true"', 'XTend Maraca', 'No XTend application build required'].forEach((anchor) => {
    context.assert(englishGuide.includes(anchor), `English Classic guide contains ${anchor}`);
  });
  ['XTend Classic', 'xtend-loader.js', 'components/manifest.json', 'xtend-preload', 'data-dev-api="true"', 'XTend Maraca', 'Kein XTend-Application-Build erforderlich'].forEach((anchor) => {
    context.assert(germanGuide.includes(anchor), `German Classic guide contains ${anchor}`);
  });
  context.assert(JSON.stringify(executableCodeBlocks(englishGuide)) === JSON.stringify(executableCodeBlocks(germanGuide)), 'Classic guide code examples remain synchronized across languages');

  BRAND_ENTRY_PATHS.forEach((entry) => {
    const text = readText(rootDir, entry);
    context.assert(text.includes('XTend Classic'), `${entry} exposes XTend Classic branding`);
    const missing = entry.endsWith('.md') ? missingRelativeLinks(rootDir, entry, text) : [];
    context.assert(missing.length === 0, `${entry} has valid relative links${missing.length ? ` (${missing.join(', ')})` : ''}`);
  });

  const forbiddenPatterns = [
    /legacy\s+`xtend-loader\.js`/iu,
    /Legacy-Pfad[^\n]*`xtend-loader\.js`/iu,
    /classic loader remains the compatibility path/iu,
    /klassische Loader bleibt der Kompatibilitätspfad/iu
  ];
  const brandingCorpus = BRAND_ENTRY_PATHS.concat(GUIDE_PATHS)
    .map((entry) => readText(rootDir, entry))
    .join('\n');
  forbiddenPatterns.forEach((pattern) => {
    context.assert(!pattern.test(brandingCorpus), `Canonical loader is not misbranded by ${pattern}`);
  });

  const classic = packageManifest.xtend && packageManifest.xtend.classic;
  context.assert(classic && classic.schema === 'xtend.classic.product-surface.v1' && classic.label === 'XTend Classic' && classic.status === 'supported', 'Package metadata declares the supported XTend Classic product surface');
  context.assert(classic && classic.canonicalLoader === 'xtend-loader.js' && classic.manifest === 'components/manifest.json' && classic.applicationBuildRequired === false, 'Classic metadata preserves loader, manifest, and build boundary');
  context.assert(classic && classic.devApiOptIn === 'data-dev-api=true' && classic.parallelDeliveryAlternative === 'XTend Maraca', 'Classic metadata declares DEV API opt-in and parallel Maraca path');
  context.assert(packageManifest.keywords.includes('xtend-classic') && packageManifest.description.includes('XTend Classic'), 'Package discovery metadata contains XTend Classic');
  context.assert(packageManifest.xtend.maraca.compatibilityBoundary === 'xtend-classic-and-maraca-are-supported-delivery-paths', 'Maraca metadata records two supported delivery paths');
  const rootExport = packageManifest.exports['.'];
  context.assert(
    rootExport &&
      rootExport.node &&
      rootExport.node.types === './xtend.ssr.d.ts' &&
      rootExport.node.import === './xtend.ssr.mjs' &&
      rootExport.node.default === './xtend.ssr.mjs' &&
      rootExport.types === './xtend.d.ts' &&
      rootExport.browser === './xtend.js' &&
      rootExport.import === './xtend.ssr.mjs' &&
      rootExport.default === './xtend.ssr.mjs',
    '. keeps the conditional Registry and SSR export contract'
  );
  const loaderExport = packageManifest.exports['./loader'];
  context.assert(loaderExport && loaderExport.types === './xtend-loader.d.ts' && loaderExport.browser === './xtend-loader.js' && loaderExport.default === './xtend-loader.js', './loader keeps the canonical loader export');
  context.assert(packageManifest.exports['./legacy-loader'].default === './xtend-dev.js', 'Only the explicit legacy-loader export retains the legacy runtime');

  const generatedNavigation = readText(rootDir, 'docs/menu.json');
  const compactSearch = `${readText(rootDir, 'docs/generated/search/en.compact.json')}\n${readText(rootDir, 'docs/generated/search/de.compact.json')}`;
  context.assert(generatedNavigation.includes('"slug": "xtend-classic"') && generatedNavigation.includes('"xtend-loader"'), 'Generated navigation contains canonical Classic entry and alias');
  ['XTend Classic', 'buildless', 'HTML-first', 'manifest', 'xtend-loader'].forEach((term) => {
    context.assert(compactSearch.includes(term), `Generated search indexes expose ${term}`);
  });

  const scripts = packageManifest.scripts || {};
  context.assert(scripts['test:xtend-classic-branding'] === 'node scripts/run_xtend_tests.js xtend-classic-branding', 'Package exposes isolated Classic branding gate');
  context.assert(scripts['test:xtend-classic-branding:report'].includes('xtend-classic-branding'), 'Package exposes Classic branding JSON report');
  ['test:pr', 'test:pr:report', 'test:release:full', 'test:release:full:report', 'release:report', 'test:docs-quality:report'].forEach((script) => {
    context.assert(scripts[script].includes('xtend-classic-branding'), `${script} includes Classic branding gate`);
  });
  context.assert(packageManifest.xtend.ciGateMatrix.prFastGate.suites.includes('xtend-classic-branding') && packageManifest.xtend.ciGateMatrix.fullReleaseGate.suites.includes('xtend-classic-branding'), 'CI metadata includes the Classic branding gate');

  return context.result({
    report: {
      schema: 'xtend.classic.branding-report.v1',
      canonicalSlug: 'xtend-classic',
      alias: 'xtend-loader',
      guides: GUIDE_PATHS.slice()
    }
  });
}

function printXtendClassicBrandingReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Classic branding gate passed.',
    failureTitle: 'XTend Classic branding gate failed:'
  });
}

if (require.main === module) {
  const result = runXtendClassicBrandingSuite();
  printXtendClassicBrandingReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  BRAND_ENTRY_PATHS,
  GUIDE_PATHS,
  printXtendClassicBrandingReport,
  runXtendClassicBrandingSuite
};
