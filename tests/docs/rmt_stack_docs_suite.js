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

const RMT_STACK_DOCS_SCHEMA = 'xtend.docs.rmt-stack-docs.v1';
const RMT_STACK_DOCS_REPORT_SCHEMA = 'xtend.docs.rmt-stack-docs-report.v1';
const RMT_STACK_DOCS_SUITE_PATH = 'tests/docs/rmt_stack_docs_suite.js';
const STACK_ROOT_SLUG = 'rmt-stack-topography';
const STACK_LAYER_SLUGS = Object.freeze([
  'rmt-kernel-runtime',
  'xtend-fabric-runtime',
  'xtend-ui-runtime-layer'
]);
const STACK_SLUGS = Object.freeze([
  STACK_ROOT_SLUG,
  ...STACK_LAYER_SLUGS
]);
const LOCALES = Object.freeze(['de', 'en']);

function localizedPathForSlug(locale, slug) {
  return `docs/${locale}/${slug}.md`;
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function assertLayerSections(context, markdown, locale, relativePath) {
  const headings = locale === 'de'
    ? ['## Was diese Schicht weiß', '## Was sie nicht weiß', '## Schnittstellen', '## Kommunikation mit anderen Schichten']
    : ['## What this layer knows', '## What it does not know', '## Interfaces', '## Communication with other layers'];

  assertIncludesAll(context, markdown, headings, relativePath);
}

function runRmtStackDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-stack-docs',
    label: 'RMT Stack Layer Docs'
  });
  const packageManifest = readJson('package.json', rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const runtimeSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const fabricSource = readText('fabric/xtend-fabric.js', rootDir);
  const laneMappingSource = readText('fabric/rmt-lane-mapping.js', rootDir);
  const maracaDocs = LOCALES.map((locale) => readText(`docs/${locale}/xtend-maraca.md`, rootDir)).join('\n\n');
  const suiteSyntax = syntaxCheckFile(RMT_STACK_DOCS_SUITE_PATH, { rootDir, extension: '.js' });
  const menuSlugs = menu.map((entry) => entry.slug);
  const overviewIndex = menuSlugs.indexOf('xtendrmt-overview');
  const stackIndex = menuSlugs.indexOf(STACK_ROOT_SLUG);
  const authoringIndex = menuSlugs.indexOf('rmt-vnext-authoring');

  context.assert(suiteSyntax.ok, `RMT stack docs suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(overviewIndex >= 0, 'Docs menu exposes XTendRMT overview');
  context.assert(stackIndex === overviewIndex + 1, 'RMT stack topography is ordered directly after XTendRMT overview');
  context.assert(stackIndex >= 0 && stackIndex < authoringIndex, 'RMT stack docs are ordered before the RMT authoring references');
  const stackChildren = menu
    .filter((entry) => entry.parent === STACK_ROOT_SLUG)
    .map((entry) => entry.slug);
  context.assert(
    JSON.stringify(stackChildren) === JSON.stringify(STACK_LAYER_SLUGS),
    'RMT stack layer docs preserve their ordered parent-child group'
  );

  STACK_SLUGS.forEach((slug) => {
    const entry = menu.find((candidate) => candidate.slug === slug);
    context.assert(Boolean(entry), `Docs menu exposes ${slug}`);
    context.assert(entry && entry.group === 'rmt', `${slug} belongs to the rmt group`);
    context.assert(entry && entry.labels && entry.labels.de && entry.labels.en, `${slug} has bilingual menu labels`);
    if (slug === STACK_ROOT_SLUG) {
      context.assert(entry && entry.parent === null, `${slug} is a top-level RMT entry`);
    } else {
      context.assert(entry && entry.parent === STACK_ROOT_SLUG, `${slug} hangs below ${STACK_ROOT_SLUG}`);
    }
  });

  context.assert(fs.existsSync(resolveRepoPath('docs/assets/rmt-stack-topography.svg', rootDir)), 'RMT stack SVG diagram exists');

  LOCALES.forEach((locale) => {
    STACK_SLUGS.forEach((slug) => {
      const relativePath = localizedPathForSlug(locale, slug);
      const absolutePath = resolveRepoPath(relativePath, rootDir);
      context.assert(fs.existsSync(absolutePath), `${relativePath} exists`);
      const markdown = readText(relativePath, rootDir);
      context.assert(markdown.startsWith('# '), `${relativePath} starts with a page title`);
      if (slug === STACK_ROOT_SLUG) {
        context.assert(markdown.includes('../assets/rmt-stack-topography.svg'), `${relativePath} references the stack SVG diagram`);
        STACK_LAYER_SLUGS.forEach((layerSlug) => {
          context.assert(markdown.includes(`./${layerSlug}.md`), `${relativePath} links to ${layerSlug}`);
        });
        assertIncludesAll(context, markdown, ['MFE', 'React', 'Vue', 'VanillaJS'], relativePath);
      } else {
        assertLayerSections(context, markdown, locale, relativePath);
      }
    });
  });

  const kernelDocs = LOCALES.map((locale) => readText(localizedPathForSlug(locale, 'rmt-kernel-runtime'), rootDir)).join('\n\n');
  const fabricDocs = LOCALES.map((locale) => readText(localizedPathForSlug(locale, 'xtend-fabric-runtime'), rootDir)).join('\n\n');
  const uiDocs = LOCALES.map((locale) => readText(localizedPathForSlug(locale, 'xtend-ui-runtime-layer'), rootDir)).join('\n\n');

  assertIncludesAll(context, kernelDocs, [
    '@ccslabs/xtend/rmt',
    'createRmtRuntime',
    'createRmtCore',
    'createRmtProductSurface',
    'createRmtBrowserRuntime',
    'createRmtServerRuntime',
    'createRmtWorkerRuntime',
    'createRmtBrowserHostAdapter'
  ], 'Kernel layer docs');
  assertIncludesAll(context, fabricDocs, [
    '@ccslabs/xtend/fabric',
    '@ccslabs/xtend/fabric/rmt-lane-mapping',
    'createXtendFabric',
    'resolveRmtScheduleForFiber',
    'component.visible.hydrate'
  ], 'Fabric layer docs');
  assertIncludesAll(context, uiDocs, [
    '@ccslabs/xtend/components/xsurfacemanager.js',
    '@ccslabs/xtend/components/xsurfacewindow.js',
    '@ccslabs/xtend/components/xstatus.js',
    'createRmtXtendComponentAdapter',
    'createRmtSurfaceAdapter'
  ], 'XTend UI layer docs');
  assertIncludesAll(context, maracaDocs, [
    'productionClosure',
    'kernelFeatureAdoptionClosure',
    'runtimeExpectedStatus',
    'Source-Fingerprint',
    'Bundle-Fingerprints'
  ], 'Maraca production closure docs');

  ['createRmtRuntime', 'createRmtCore', 'createRmtProductSurface', 'createRmtBrowserRuntime', 'createRmtServerRuntime', 'createRmtWorkerRuntime', 'createRmtBrowserHostAdapter'].forEach((exportName) => {
    context.assert(runtimeSource.includes(exportName), `RMT runtime exposes ${exportName}`);
  });
  context.assert(fabricSource.includes('function createXtendFabric'), 'Fabric runtime exposes createXtendFabric');
  context.assert(laneMappingSource.includes('function resolveRmtScheduleForFiber'), 'Fabric lane mapping exposes resolveRmtScheduleForFiber');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt'], 'package exposes @ccslabs/xtend/rmt');
  context.assert(packageManifest.exports && packageManifest.exports['./fabric'], 'package exposes @ccslabs/xtend/fabric');
  context.assert(packageManifest.exports && packageManifest.exports['./fabric/rmt-lane-mapping'], 'package exposes @ccslabs/xtend/fabric/rmt-lane-mapping');
  context.assert(packageManifest.exports && packageManifest.exports['./components/*'], 'package exposes component wildcard imports');
  context.assert(packageManifest.scripts['test:rmt-stack-docs'] === 'node scripts/run_xtend_tests.js rmt-stack-docs', 'package exposes rmt-stack-docs script');
  context.assert(packageManifest.xtend && packageManifest.xtend.rmtStackDocs && packageManifest.xtend.rmtStackDocs.schema === RMT_STACK_DOCS_SCHEMA, 'package metadata records RMT stack docs schema');
  context.assert(runner.includes("id: 'rmt-stack-docs'"), 'test runner exposes rmt-stack-docs suite');

  return context.result({
    report: {
      schema: RMT_STACK_DOCS_REPORT_SCHEMA,
      slugCount: STACK_SLUGS.length,
      locales: LOCALES.slice(),
      docs: LOCALES.flatMap((locale) => STACK_SLUGS.map((slug) => localizedPathForSlug(locale, slug)))
    }
  });
}

function printRmtStackDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT stack layer docs checks passed.',
    failureTitle: 'RMT stack layer docs checks failed:'
  });
}

if (require.main === module) {
  const result = runRmtStackDocsSuite();
  printRmtStackDocsReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  RMT_STACK_DOCS_REPORT_SCHEMA,
  RMT_STACK_DOCS_SCHEMA,
  RMT_STACK_DOCS_SUITE_PATH,
  STACK_SLUGS,
  printRmtStackDocsReport,
  runRmtStackDocsSuite
};
