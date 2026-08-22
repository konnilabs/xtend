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

const RMT_PLAYGROUND_DOCS_SCHEMA = 'xtend.docs.rmt-playground-docs.v1';
const RMT_PLAYGROUND_DOCS_REPORT_SCHEMA = 'xtend.docs.rmt-playground-docs-report.v1';
const LEARN_RMT_SLUGS = Object.freeze([
  'learn-rmt',
  'learn-rmt-syntax-basics',
  'learn-rmt-templates-surfaces',
  'learn-rmt-state-selectors',
  'learn-rmt-actions-events',
  'learn-rmt-data-resources',
  'learn-rmt-scheduling-lanes',
  'learn-rmt-security-preview',
  'learn-rmt-playground',
  'learn-rmt-next-steps'
]);
const LOCALES = Object.freeze(['de', 'en']);

function localizedPathForSlug(locale, slug) {
  return `docs/${locale}/${slug}.md`;
}

function extractRmtBlocks(markdown) {
  const blocks = [];
  const pattern = /```rmt\s*([\s\S]*?)```/gu;
  let match;
  while ((match = pattern.exec(markdown))) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function runRmtPlaygroundDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-playground-docs',
    label: 'Learn RMT Playground Docs'
  });
  const packageManifest = readJson('package.json', rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const pageLoader = [
    readText('docs/utils/pageloader.js', rootDir),
    readText('docs/utils/page/route-controller.mjs', rootDir)
  ].join('\n');
  const indexPhp = readText('docs/index.php', rootDir);
  const xTextarea = readText('components/xtextarea.js', rootDir);
  const xSurfaceManager = readText('components/xsurfacemanager.js', rootDir);
  const xSurfaceWindow = readText('components/xsurfacewindow.js', rootDir);
  const xSidePanel = readText('components/xsidepanel.js', rootDir);
  const menuSlugs = menu.map((entry) => entry.slug);
  const firstLearnIndex = menuSlugs.indexOf('learn-rmt');
  const lastStartIndex = Math.max(...menu.map((entry, index) => entry.group === 'start' ? index : -1));
  const firstRmtReferenceIndex = menuSlugs.indexOf('xtendrmt-overview');
  const loaderSyntax = syntaxCheckFile('docs/utils/pageloader.js', { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile('tests/docs/rmt_playground_docs_suite.js', { rootDir, extension: '.js' });

  context.assert(loaderSyntax.ok, `Docs page loader syntax passes${loaderSyntax.ok ? '' : ` (${loaderSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT playground docs suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(firstLearnIndex > lastStartIndex, 'Learn RMT menu tree is ordered after Start');
  context.assert(firstLearnIndex >= 0 && firstLearnIndex < firstRmtReferenceIndex, 'Learn RMT menu tree is ordered before RMT reference docs');

  LEARN_RMT_SLUGS.forEach((slug, expectedIndex) => {
    const entry = menu.find((candidate) => candidate.slug === slug);
    context.assert(Boolean(entry), `Docs menu exposes ${slug}`);
    context.assert(entry && entry.group === 'learn-rmt', `${slug} belongs to learn-rmt group`);
    context.assert(entry && entry.labels && entry.labels.de && entry.labels.en, `${slug} has bilingual menu labels`);
    if (expectedIndex === 0) {
      context.assert(entry && !entry.parent, 'Learn RMT root is a top-level menu entry');
    } else {
      context.assert(entry && entry.parent === 'learn-rmt', `${slug} hangs below Learn RMT root`);
    }
  });

  LOCALES.forEach((locale) => {
    LEARN_RMT_SLUGS.forEach((slug, index) => {
      const relativePath = localizedPathForSlug(locale, slug);
      const absolutePath = resolveRepoPath(relativePath, rootDir);
      context.assert(fs.existsSync(absolutePath), `${relativePath} exists`);
      const markdown = readText(relativePath, rootDir);
      context.assert(markdown.startsWith('# '), `${relativePath} starts with a page title`);
      if (index < LEARN_RMT_SLUGS.length - 1) {
        context.assert(markdown.includes(`./${LEARN_RMT_SLUGS[index + 1]}.md`), `${relativePath} links to the next tutorial page`);
      }
      extractRmtBlocks(markdown).forEach((source, blockIndex) => {
        const result = compileRmtVNextSource({
          text: source,
          filePath: `${relativePath}#${blockIndex + 1}.rmt`
        });
        const diagnostics = (result.diagnostics || result.compilerDiagnostics || [])
          .map((diagnostic) => diagnostic.message)
          .join('; ');
        context.assert(result.ok === true, `${relativePath} RMT block ${blockIndex + 1} compiles${result.ok ? '' : ` (${diagnostics})`}`);
      });
    });
  });

  context.assert(pageLoader.includes('renderDocsRmtPlayground'), 'Page loader renders the RMT playground route');
  context.assert(pageLoader.includes('x-surface-manager'), 'Playground client uses x-surface-manager');
  context.assert(pageLoader.includes("'surface-skeleton': 'false'"), 'Playground disables redundant SurfaceManager skeletons for its synchronously materialized surfaces');
  context.assert(pageLoader.includes('x-textarea'), 'Playground client uses x-textarea as the first editor');
  context.assert(pageLoader.includes('x-select') && pageLoader.includes('docs-rmt-playground-template-bar') && pageLoader.includes('select-changed'), 'Playground uses x-select in a dedicated template bar above the editor');
  context.assert(pageLoader.includes("'syntax-highlight': true") && pageLoader.includes("'line-numbering': 'true'") && pageLoader.includes("lang: 'rmt'"), 'Playground editor enables Prism RMT syntax highlighting with line numbering');
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_RENDERER_MODULE') && pageLoader.includes('rmt-dom-descriptor-renderer'), 'Playground preview uses the RMT DOM descriptor renderer');
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_MARACA_MODE') && pageLoader.includes('DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES'), 'Playground exposes Maraca runtime preview mode and module whitelist');
  [
    '/components/xsurfacemanager-controller.js',
    '/xtendrmt/rmt-app-runtime.js',
    '/xtendrmt/rmt-state-host-adapter.js',
    '/xtendrmt/rmt-presentation-effect-adapter.js'
  ].forEach((modulePath) => {
    context.assert(pageLoader.includes(`'${modulePath}'`), `Playground Maraca module whitelist includes ${modulePath}`);
  });
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_PRESETS') && pageLoader.includes('customer-service-kernel'), 'Playground exposes Maraca-oriented presets');
  context.assert(pageLoader.includes('createDocsRmtPlaygroundDescriptorPreviewFrame'), 'Playground client renders structured descriptor previews');
  context.assert(pageLoader.includes('bootDocsRmtPlaygroundMaracaPreview') && pageLoader.includes('window.xtendDocsRmtPlaygroundLastMaraca'), 'Playground boots Maraca preview telemetry for browser tests');
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_RUNTIME_API_BINDINGS') && pageLoader.includes('createDocsRmtPlaygroundRuntimeApis(loadedModules)'), 'Playground resolves runtime ports from imported ESM module APIs');
  context.assert(pageLoader.includes('moduleApi: await import(String(url))') && pageLoader.includes('if (moduleApi.default) return moduleApi.default'), 'Playground retains imported module namespaces and supports default runtime API exports');
  context.assert(pageLoader.includes('return window.XTendLoader.hydrateTree(root, {'), 'Playground awaits component hydration before booting the Maraca runtime');
  context.assert(pageLoader.includes('createDocsRmtPlaygroundXUtilsAdapter') && pageLoader.includes('xUtils.runUiTransition({ ...input, body: false })'), 'Playground opts into scoped RMT motion without enabling effects on the Docs shell');
  context.assert(pageLoader.includes('data-maraca-phase') && pageLoader.includes("phase: 'runtime'") && pageLoader.includes('maracaRunning'), 'Playground distinguishes planned Maraca build status from booted runtime status');
  context.assert(pageLoader.includes('docs-rmt-playground-preview-app') && pageLoader.includes('__xtendRmtPreviewBounds'), 'Playground preview renders compiled surfaces in an app-like bounded root');
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_HYDRATION_TAGS') && pageLoader.includes("'x-progress'"), 'Playground hydrates public XTend component previews');
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_LAYOUT_TAGS') && pageLoader.includes('prepareDocsRmtPlaygroundLayoutElements') && pageLoader.includes('prepare: prepareDocsRmtPlaygroundLayoutElements'), 'Playground defines layout-owning custom elements before replacing the visible article workspace');
  context.assert(pageLoader.includes('getDocsRmtPlaygroundDiagnosticsEndpoint') && pageLoader.includes('runDocsRmtPlaygroundLanguageDiagnostics'), 'Playground client runs live RMT Language Server diagnostics');
  context.assert(pageLoader.includes('setDocsRmtPlaygroundEditorDiagnosticState') && pageLoader.includes("editor.toggleAttribute('invalid'"), 'Playground mirrors LSP errors into the editor invalid state');
  context.assert(pageLoader.includes('DOCS_RMT_PLAYGROUND_ISLANDS') && pageLoader.includes('data-rmt-hydration-island'), 'Playground declares SurfaceManager hydration islands');
  context.assert(pageLoader.includes('data-fabric-lane') && pageLoader.includes('docs.rmt-playground.preview.hydrate') && pageLoader.includes('docs.rmt-playground.diagnostics.hydrate'), 'Playground maps hydration islands to Fabric lanes and schedules');
  context.assert(pageLoader.includes('dispatchDocsRmtPlaygroundSourceChanged') && pageLoader.includes('docs-rmt-playground-cross-surface-event'), 'Playground emits cross-surface events when the RMT source changes');
  context.assert(pageLoader.includes('updateDocsRmtPlaygroundIslandState') && pageLoader.includes('dispatchDocsLaneComplete'), 'Playground records island rehydration through Docs/Fabric lane completion events');
  context.assert(pageLoader.includes('editor.shadowRoot.contains(control)'), 'Playground avoids duplicate refreshes from native textarea input bubbling');
  context.assert(pageLoader.includes('data-rmt-playground-article'), 'Playground moves guide copy into a managed surface');
  context.assert(pageLoader.includes('data-rmt-playground-related-panel'), 'Playground keeps read-further links inside SurfaceManager');
  context.assert(pageLoader.includes('x-textarea::part(control)') && pageLoader.includes('--textarea-resize: none'), 'Playground editor scrolls instead of resizing surfaces');
  context.assert(pageLoader.includes('grid-template-rows: auto minmax(0, 1fr) minmax(3.35rem, auto)') && pageLoader.includes('grid-template-columns: auto auto minmax(14rem, 1fr)'), 'Playground editor keeps template selection above the textarea and action buttons in a stable lower band');
  context.assert(pageLoader.includes('getDocsRmtPlaygroundNativeTextarea'), 'Playground reads the upgraded native textarea value');
  context.assert(pageLoader.includes('setDocsRmtPlaygroundEditorValue'), 'Playground syncs textarea value across upgrade timing');
  context.assert(pageLoader.includes('hashDocsRmtPlaygroundSource') && pageLoader.includes('sourceHash'), 'Playground tracks editor source identity for compile output updates');
  context.assert(pageLoader.includes('setDocsRmtPlaygroundOutputPending') && pageLoader.includes('pending_compile'), 'Playground marks Core JSON as pending while source changes are waiting for compilation');
  context.assert(pageLoader.includes('__xtendDocsRmtPlaygroundCompileRequestId') && pageLoader.includes('stale_compile_ignored'), 'Playground ignores stale compile responses instead of overwriting newer output');
  context.assert(pageLoader.includes('resetDocsRmtPlaygroundLayout'), 'Playground exposes a layout reset path');
  context.assert(pageLoader.includes('container.replaceChildren(root)'), 'Playground owns the route content workspace');
  context.assert(pageLoader.includes('activateDocsPlaygroundIsland({ root, locale, relatedLinks, signal })') && pageLoader.includes('relatedLinks,'), 'Playground receives localized related links');
  context.assert(xTextarea.includes('_upgradeProperty') && xTextarea.includes(":host([fill])"), 'x-textarea supports pre-upgrade values and fill layout');
  context.assert(xTextarea.includes('syntaxHighlighting') && xTextarea.includes('tokenParity') && xTextarea.includes('x-code'), 'x-textarea exposes syntax highlighting as XCode-compatible UX metadata');
  context.assert(xTextarea.includes("'line-numbering'") && xTextarea.includes('part="line-numbers"') && xTextarea.includes('lineNumbering: this.lineNumbering'), 'x-textarea exposes optional editor-style line numbering');
  context.assert(xTextarea.includes('XTendRmtPrism') && xTextarea.includes('Prism') && xTextarea.includes('registerHighlighter(provider)'), 'x-textarea supports Prism and registered highlighters');
  context.assert(xTextarea.includes('part="highlight syntax"') && xTextarea.includes('.token.rmt-primitive') && xTextarea.includes('--x-code-token-keyword'), 'x-textarea ships an XCode-color-compatible highlight layer');
  context.assert(xSurfaceManager.includes('var(--xtend-surface-muted') && xSurfaceManager.includes('var(--xtend-text'), 'x-surface-manager inherits XTend theme tokens');
  context.assert(xSurfaceManager.includes('data-surface-tray') && xSurfaceManager.includes('_renderSurfaceTray'), 'x-surface-manager exposes a taskbar-style surface tray');
  context.assert(xSurfaceManager.includes('.surface-tray::before') && xSurfaceManager.includes('surface-manager-tray-hover-bridge-height'), 'surface tray hover bridge keeps the popover reachable');
  context.assert(xSurfaceManager.includes('restoreSurface(record.id)') && xSurfaceManager.includes('openSurface(record.id)'), 'surface tray restores minimized and closed surfaces');
  context.assert(xSurfaceWindow.includes('var(--xtend-surface') && xSurfaceWindow.includes('var(--xtend-surface-muted'), 'x-surface-window inherits XTend theme tokens');
  context.assert(xSidePanel.includes('var(--xtend-surface') && xSidePanel.includes('var(--xtend-surface-muted'), 'x-side-panel inherits XTend theme tokens');
  context.assert(pageLoader.includes('xtend-rmt-playground=compile'), 'Playground client calls the compile endpoint');
  context.assert(pageLoader.includes('xtend-rmt-playground=preset'), 'Playground client can load whitelisted server-side presets');
  context.assert(indexPhp.includes('docsRmtPlaygroundHandleCompile'), 'Docs host exposes the playground compile handler');
  context.assert(indexPhp.includes('docsRmtPlaygroundCompileMaracaPreview'), 'Docs host exposes the Maraca preview compile path');
  context.assert(indexPhp.includes("String(xtendDocsBootConfiguration.basePath || '')") && !indexPhp.includes('descriptor.configuration.basePath'), 'Docs boot resolves its base path from the declared boot configuration');
  context.assert(indexPhp.includes('docsRmtPlaygroundHandleDiagnostics') && indexPhp.includes("'language-diagnostics' : 'compile'"), 'Docs host exposes LSP diagnostics through the official tooling bridge');
  context.assert(indexPhp.includes('tools/tooling-bridge-cli.js'), 'Docs host uses the official compiler tooling bridge');
  context.assert(indexPhp.includes("'operation' => 'maraca-plan'"), 'Docs host uses the tooling bridge for Maraca preview plans');
  context.assert(indexPhp.includes('docsRmtPlaygroundProjectSafePreview') && indexPhp.includes("'renderMode' => 'dom_descriptor'"), 'Docs host returns officially projected DOM descriptor preview data');
  context.assert(packageManifest.scripts['test:rmt-playground-docs'] === 'node scripts/run_xtend_tests.js rmt-playground-docs', 'package exposes rmt-playground-docs script');
  context.assert(packageManifest.xtend && packageManifest.xtend.rmtPlaygroundDocs && packageManifest.xtend.rmtPlaygroundDocs.schema === RMT_PLAYGROUND_DOCS_SCHEMA, 'package metadata records RMT playground docs schema');
  context.assert(runner.includes("id: 'rmt-playground-docs'"), 'test runner exposes rmt-playground-docs suite');

  return context.result({
    report: {
      schema: RMT_PLAYGROUND_DOCS_REPORT_SCHEMA,
      slugCount: LEARN_RMT_SLUGS.length,
      locales: LOCALES.slice(),
      docs: LOCALES.flatMap((locale) => LEARN_RMT_SLUGS.map((slug) => localizedPathForSlug(locale, slug)))
    }
  });
}

function printRmtPlaygroundDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Learn RMT playground docs checks passed.',
    failureTitle: 'Learn RMT playground docs checks failed:'
  });
}

if (require.main === module) {
  const result = runRmtPlaygroundDocsSuite();
  printRmtPlaygroundDocsReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  LEARN_RMT_SLUGS,
  printRmtPlaygroundDocsReport,
  runRmtPlaygroundDocsSuite
};
