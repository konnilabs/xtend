const vm = require('vm');
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

const DOCS_RMT_PILOT_SCHEMA = 'xtend.docs.parsedown-rmt-pilot.v1';
const DOCS_RMT_PAGE_SCHEMA = 'xtend.docs.parsedown-rmt-page.v1';
const DOCS_RMT_RENDER_SCHEMA = 'xtend.docs.parsedown-rmt-render.v1';
const RMT_VNEXT_CORE_SCHEMA = 'xtend.rmt.core-format.vnext.v1';
const PILOT_DOCUMENT_PATH = 'docs/xtendrmt-parsedown-docs.rmt';
const PILOT_CORE_PATH = 'docs/xtendrmt-parsedown-docs.core.json';
const PILOT_VNEXT_CORE_PATH = 'docs/xtendrmt-parsedown-docs.vnext.core.json';
const PILOT_SCAFFOLD_PATH = 'docs/xtendrmt-parsedown-docs.scaffold.json';
const PARSEDOWN_ADAPTER_ID = 'docs.parsedown';
const PARSEDOWN_ENDPOINT = 'xtendrmt.docs.parsedown.parse';
const TRUST_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
const SHELL_TEMPLATE_ID = 'docs.app.shell';
const SEARCH_TEMPLATE_ID = 'docs.header.search';

function createRmtFormatFromBundle(context, rootDir) {
  const artifactPath = 'xtendrmt/rmt-core.esm.js';
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = source
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*$/gmu, '')
    .replace(/^\s*import\s+['"][^'"]+['"];\s*$/gmu, '')
    .replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '');
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-docs-rmt-pilot-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      createElement(tagName) {
        return {
          tagName: String(tagName || '').toUpperCase(),
          attributes: {},
          children: [],
          setAttribute(name, value) {
            this.attributes[name] = String(value);
          },
          appendChild(child) {
            this.children.push(child);
            return child;
          }
        };
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, {
      filename: artifactPath
    });
  } catch (error) {
    context.fail(`RMT core bundle evaluates for Docs RMT pilot (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for Docs RMT pilot')) {
    return null;
  }

  return factory();
}

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runDocsRmtPilotSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'docs-rmt-pilot',
    label: 'Docs-App RMT Parsedown scheduling pilot'
  });

  const source = readText(PILOT_DOCUMENT_PATH, rootDir);
  const pilot = readJson(PILOT_DOCUMENT_PATH, rootDir);
  const runtimeCore = readJson(PILOT_CORE_PATH, rootDir);
  const vnextCore = readJson(PILOT_VNEXT_CORE_PATH, rootDir);
  const scaffold = readJson(PILOT_SCAFFOLD_PATH, rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const docsShellRuntime = readText('docs/utils/docs-shell-runtime.mjs', rootDir);
  const xtendLoader = readText('xtend-loader.js', rootDir);
  const xrouterSource = readText('components/xrouter.js', rootDir);
  const xcodeSource = readText('components/xcode.js', rootDir);
  const xtendCss = readText('xtend.css', rootDir);
  const parsedownAdapter = readText('docs/utils/parsedown.php', rootDir);
  const parsedownDocs = readText('docs/en/xtendrmt-parsedown-scheduling.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.docsRmtPilot;

  context.assert(source.includes('template docs.xtend.parsedownPilot'), 'Docs RMT pilot source uses vNext template authoring');
  context.assert(!source.trimStart().startsWith('{'), 'Docs RMT pilot source is not legacy JSON authoring');
  context.assert(runtimeCore.manifest.sourceSyntax === 'rmt-vnext', 'Docs RMT pilot runtime core records vNext source syntax');
  context.assert(runtimeCore.manifest.authoringSource === PILOT_DOCUMENT_PATH, 'Docs RMT pilot runtime core points to authoring source');
  context.assert(vnextCore.schema === RMT_VNEXT_CORE_SCHEMA, 'Docs RMT pilot vNext core uses vNext core schema');
  context.assert(vnextCore.manifest.sourceSyntax === 'rmt-vnext', 'Docs RMT pilot vNext core records source syntax');
  context.assert(scaffold.source === PILOT_DOCUMENT_PATH, 'Docs RMT pilot scaffold links source');
  context.assert(scaffold.runtimeCore === PILOT_CORE_PATH, 'Docs RMT pilot scaffold links runtime core');
  context.assert(scaffold.vnextCore === PILOT_VNEXT_CORE_PATH, 'Docs RMT pilot scaffold links vNext core');
  context.assert(scaffold.sourceSyntax === 'rmt-vnext', 'Docs RMT pilot scaffold records source syntax');
  context.assert(scaffold.compilerStatus === 'compiled', 'Docs RMT pilot scaffold records compiled vNext core');
  context.assert(pilot.manifest.documentId === runtimeCore.manifest.documentId, 'Docs RMT pilot readJson fallback returns runtime core parity');
  context.assert(pilot.kind === 'rmt_document', 'Docs RMT pilot is an RMT document');
  context.assert(pilot.manifest && pilot.manifest.metadata && pilot.manifest.metadata.contractVersion === DOCS_RMT_PILOT_SCHEMA, 'Docs RMT pilot declares stable pilot contract');
  context.assert(pilot.manifest.metadata.workpackage === 'ER-WP-40', 'Docs RMT pilot is owned by ER-WP-40');
  context.assert(pilot.manifest.metadata.activeHost === 'docs/index.php', 'Docs RMT pilot keeps docs/index.php as active host');
  context.assert(pilot.manifest.metadata.renderMode === 'shell-first', 'Docs RMT pilot declares shell-first render mode');
  context.assert(pilot.manifest.metadata.insularHydration === true, 'Docs RMT pilot declares insular hydration for route updates');
  context.assert(pilot.manifest.metadata.shellTemplate === SHELL_TEMPLATE_ID, 'Docs RMT pilot declares the app shell template');
  context.assert(pilot.manifest.metadata.searchTemplate === SEARCH_TEMPLATE_ID, 'Docs RMT pilot declares the header search template');
  context.assert(pilot.manifest.metadata.kernelBoundary.includes('RMT only sees shell records'), 'Docs RMT pilot keeps Parsedown outside the RMT kernel');
  context.assert(pilot.manifest.metadata.fabricRuntime && pilot.manifest.metadata.fabricRuntime.rmtTelemetryBridge === 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', 'Docs RMT pilot declares the Fabric-to-RMT telemetry bridge');
  context.assert(pilot.manifest.metadata.fabricRuntime && pilot.manifest.metadata.fabricRuntime.backpressureSignal === 'xtend.fabric.backpressure-signal.v1', 'Docs RMT pilot declares Fabric backpressure signal consumption');

  const adapters = indexById(pilot.adapters);
  const schedules = indexById(pilot.schedules);
  const routes = indexById(pilot.routes);
  const templates = indexById(pilot.templates);
  const components = indexById(pilot.components);
  const docsParsedown = adapters.get(PARSEDOWN_ADAPTER_ID);
  const docsRichContent = adapters.get('docs.rich-content');

  context.assert(docsParsedown && docsParsedown.kind === 'template_adapter', 'Docs RMT pilot declares docs.parsedown template adapter');
  context.assert(docsParsedown && docsParsedown.kernelVisible === false, 'Docs Parsedown adapter remains outside the kernel');
  assertIncludesAll(context, docsParsedown && docsParsedown.providedCapabilities, ['markdown', 'htmlFragments', 'slugIndex', 'scheduleRefs'], 'Docs Parsedown adapter capabilities');
  context.assert(docsParsedown && docsParsedown.metadata && docsParsedown.metadata.trustBoundary === TRUST_BOUNDARY, 'Docs Parsedown adapter metadata declares Trusted DOM boundary');
  context.assert(docsRichContent && docsRichContent.kind === 'template_adapter', 'Docs RMT pilot declares docs.rich-content template adapter');
  assertIncludesAll(context, docsRichContent && docsRichContent.providedCapabilities, ['domDescriptor', 'richHtml', 'lazyMedia', 'xplayerTutorial'], 'Docs rich content adapter capabilities');
  context.assert(components.get('docs.shell') && components.get('docs.shell').schedule === 'docs.shell.render', 'Docs RMT pilot declares shell component schedule');
  context.assert(components.get('docs.search') && components.get('docs.search').schedule === 'docs.search.index', 'Docs RMT pilot declares search component schedule');
  context.assert(components.get('docs.downloadAction') && components.get('docs.downloadAction').tag === 'x-button', 'Docs RMT pilot declares download action component');
  context.assert(components.get('docs.sidebar') && components.get('docs.sidebar').schedule === 'docs.shell.render', 'Docs RMT pilot declares sidebar shell component');
  context.assert(components.get('docs.relatedLinks') && components.get('docs.relatedLinks').tag === 'x-link', 'Docs RMT pilot declares related link component collection');
  context.assert(components.get('docs.componentDemo') && components.get('docs.componentDemo').tag === 'x-code', 'Docs RMT pilot declares component demo code areas');
  context.assert(components.get('docs.media.player') && components.get('docs.media.player').tag === 'x-player', 'Docs RMT pilot prepares XPlayer tutorial component');
  context.assert(schedules.get('docs.shell.render') && schedules.get('docs.shell.render').endpointName === 'xtendrmt.shell.render', 'Docs RMT pilot schedules shell render endpoint');
  context.assert(schedules.get('docs.shell.render') && schedules.get('docs.shell.render').lane === 'visible', 'Docs shell render runs in visible lane');
  context.assert(schedules.get('docs.markdown.parse') && schedules.get('docs.markdown.parse').endpointName === PARSEDOWN_ENDPOINT, 'Docs RMT pilot schedules Parsedown endpoint');
  context.assert(schedules.get('docs.markdown.parse') && schedules.get('docs.markdown.parse').lane === 'background', 'Docs Parsedown parse schedule runs in background lane');
  context.assert(schedules.get('docs.route.render') && schedules.get('docs.route.render').lane === 'visible', 'Docs route render schedule runs in visible lane');
  context.assert(schedules.get('docs.page.hydrate') && schedules.get('docs.page.hydrate').preferIdle === true, 'Docs page hydration schedule prefers idle');
  context.assert(schedules.get('docs.syntax.highlight') && schedules.get('docs.syntax.highlight').endpointName === 'xtendrmt.docs.syntax.highlight', 'Docs RMT pilot schedules scoped syntax highlighting');
  context.assert(schedules.get('docs.syntax.highlight') && schedules.get('docs.syntax.highlight').lane === 'idle', 'Docs syntax highlighting runs in the idle lane');
  context.assert(schedules.get('docs.syntax.highlight') && schedules.get('docs.syntax.highlight').preferIdle === true, 'Docs syntax highlighting prefers idle work');
  context.assert(schedules.get('docs.search.index') && schedules.get('docs.search.index').endpointName === 'xtendrmt.docs.search.index', 'Docs RMT pilot schedules search index endpoint');
  context.assert(schedules.get('docs.related.prepare') && schedules.get('docs.related.prepare').endpointName === 'xtendrmt.docs.related.prepare', 'Docs RMT pilot schedules related link preparation');
  context.assert(schedules.get('docs.demo.prepare') && schedules.get('docs.demo.prepare').endpointName === 'xtendrmt.docs.demo.prepare', 'Docs RMT pilot schedules hands-on component demos');
  context.assert(schedules.get('docs.media.lazy') && schedules.get('docs.media.lazy').preferIdle === true, 'Docs RMT pilot prepares lazy media schedule');
  context.assert(routes.get('docs.readme') && routes.get('docs.readme').template === 'docs.readme.markdown', 'Docs readme route points to Parsedown template');
  context.assert(routes.get('docs.readme') && routes.get('docs.readme').documentTitle === 'XTend Developer Documentation | XTend Dokumentation', 'Docs readme route declares RMT document title metadata');
  context.assert(routes.get('docs.readme') && routes.get('docs.readme').shell === SHELL_TEMPLATE_ID, 'Docs readme route points to shell template');
  context.assert(routes.get('docs.enterprise-adoption') && routes.get('docs.enterprise-adoption').schedule === 'docs.route.render', 'Docs enterprise route uses route render schedule');
  context.assert(routes.get('docs.enterprise-adoption') && routes.get('docs.enterprise-adoption').titleTemplate === '{{title}} | XTend Dokumentation', 'Docs enterprise route declares RMT title template');
  context.assert(templates.get(SHELL_TEMPLATE_ID) && templates.get(SHELL_TEMPLATE_ID).mode === 'dom_descriptor', 'Docs app shell is a dom_descriptor template');
  context.assert(templates.get(SHELL_TEMPLATE_ID) && Array.isArray(templates.get(SHELL_TEMPLATE_ID).nodes), 'Docs app shell owns descriptor nodes');
  context.assert(JSON.stringify(templates.get(SHELL_TEMPLATE_ID)).includes('data-rmt-shell-mode'), 'Docs app shell marks shell-first mode');
  context.assert(JSON.stringify(templates.get(SHELL_TEMPLATE_ID)).includes('docs-shell-layout'), 'Docs app shell declares main/sidebar layout');
  context.assert(JSON.stringify(templates.get(SHELL_TEMPLATE_ID)).includes('docs-page-sidebar'), 'Docs app shell declares RMT sidebar slot');
  context.assert(JSON.stringify(templates.get(SHELL_TEMPLATE_ID)).includes('docs-component-demo'), 'Docs app shell declares component demo slot');
  context.assert(templates.get(SEARCH_TEMPLATE_ID) && templates.get(SEARCH_TEMPLATE_ID).mode === 'dom_descriptor', 'Docs header search is a dom_descriptor template');
  context.assert(JSON.stringify(templates.get(SEARCH_TEMPLATE_ID)).includes('search-results'), 'Docs header search declares result slot');
  context.assert(templates.get('docs.media.tutorial-placeholder') && templates.get('docs.media.tutorial-placeholder').schedule === 'docs.media.lazy', 'Docs RMT pilot prepares media placeholder template');
  context.assert(templates.get('docs.readme.markdown') && templates.get('docs.readme.markdown').adapter === PARSEDOWN_ADAPTER_ID, 'Docs readme template uses Parsedown adapter');
  context.assert(templates.get('docs.enterprise-adoption.markdown') && templates.get('docs.enterprise-adoption.markdown').security.trustBoundary === TRUST_BOUNDARY, 'Docs enterprise template declares Trusted DOM boundary');
  context.assert(templates.get('docs.xtendrmt-parsedown-scheduling.markdown') && templates.get('docs.xtendrmt-parsedown-scheduling.markdown').hydration.metadata.endpointHint === PARSEDOWN_ENDPOINT, 'Docs Parsedown scheduling template forwards parse endpoint hint');

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(pilot);
    const registries = rmtFormat.createRuntimeRegistries(pilot);
    context.assert(normalizedDocument.manifest.documentId === 'docs.xtend.parsedown-pilot', 'RMT format normalizes Docs pilot document id');
    context.assert(normalizedDocument.routes.length === 3, 'RMT format normalizes Docs pilot routes');
    context.assert(normalizedDocument.components.length === 9, 'RMT format normalizes Docs pilot components');
    context.assert(normalizedDocument.schedules.length === 12, 'RMT format normalizes Docs pilot schedules');
    context.assert(normalizedDocument.templates.length === 6, 'RMT format normalizes Docs pilot templates');
    context.assert(registries.status === 'ready', 'Docs RMT pilot creates ready runtime registries');
    context.assert(registries.diagnosticCount === 0, 'Docs RMT pilot creates runtime registries without diagnostics');
    context.assert(Array.isArray(registries.routeRegistry.ids) && registries.routeRegistry.ids.includes('docs.xtendrmt-parsedown-scheduling'), 'Docs RMT pilot indexes Parsedown scheduling route');
    context.assert(Array.isArray(registries.componentRegistry.ids) && registries.componentRegistry.ids.includes('docs.page'), 'Docs RMT pilot indexes docs.page component');
    context.assert(Array.isArray(registries.componentRegistry.ids) && registries.componentRegistry.ids.includes('docs.shell'), 'Docs RMT pilot indexes docs.shell component');
  }

  context.assert(indexPhp.includes('window.xtendDocsRmtPilot'), 'Docs app exposes RMT pilot metadata');
  context.assert(indexPhp.includes("'mode' => 'history'") && indexPhp.includes("'reuse-component' => true"), 'Docs app opts XRouter into History API route component reuse');
  context.assert(indexPhp.includes('insularHydration: true'), 'Docs app exposes insular hydration metadata');
  context.assert(docsShellRuntime.includes('function schedulePrismHighlight(root = document)'), 'Docs AppRuntime exposes the scoped syntax highlighting scheduler');
  context.assert(docsShellRuntime.includes('window.Prism.highlightAllUnder(root)'), 'Docs AppRuntime highlights only the active content scope');
  context.assert(indexPhp.includes('window.xtendDocsRmtDocument'), 'Docs app exposes the RMT shell document');
  context.assert(indexPhp.includes('<body xt-ui-effects="none">'), 'Docs app explicitly disables shell-blocking UI effects');
  context.assert(indexPhp.includes('window.xtendDocsRmtRuntimeModule'), 'Docs app exposes the XTendRMT runtime module for the Fabric telemetry bridge');
  context.assert(indexPhp.includes("schema: 'xtend.docs.app-runtime-fabric.v1'") && indexPhp.includes("ownership: 'rmt-app-runtime'"), 'Docs app declares AppRuntime as the persistent Fabric telemetry owner');
  context.assert(indexPhp.includes('window.xtendDocsPagesMeta'), 'Docs app exposes per-page RMT metadata');
  context.assert(indexPhp.includes('window.xtendDocsPageEndpoint'), 'Docs app exposes lazy Parsedown page payload endpoint');
  context.assert(indexPhp.includes("lazyParsedownRoutes: true"), 'Docs app declares lazy Parsedown route payloads');
  context.assert(indexPhp.includes('skeleton="article"') || indexPhp.includes("'skeleton' => 'article'"), 'Docs app marks XRouter routes for native skeleton loading');
  context.assert(indexPhp.includes('data-xtend-skeleton'), 'Docs app opts shell custom elements into framework skeleton loading');
  context.assert(indexPhp.includes('--xtend-skeleton-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));'), 'Docs route skeleton aligns to the shared viewport gutter');
  context.assert(indexPhp.includes('--xtend-skeleton-margin-inline: var(--docs-viewport-gutter);'), 'Docs route skeleton uses the same inline gutter as the rendered shell');
  context.assert(indexPhp.includes('docsMergeRmtRoutes'), 'Docs app merges generated page routes into the exposed RMT document');
  context.assert(indexPhp.includes('docsRenderXRoute'), 'Docs app renders XRouter routes from RMT page route records');
  context.assert(indexPhp.includes('document-title=') || indexPhp.includes("'document-title' =>"), 'Docs app forwards RMT document titles into XRouter routes');
  context.assert(indexPhp.includes('xtendrmt-parsedown-docs.rmt'), 'Docs app points to pilot RMT document');
  context.assert(indexPhp.includes('xtendrmt-parsedown-docs.core.json'), 'Docs app loads pilot runtime core document');
  context.assert(indexPhp.includes("sourceSyntax: 'rmt-vnext'"), 'Docs app exposes vNext source syntax metadata');
  context.assert(indexPhp.includes('__DIR__ . \'/../xtend.css\''), 'Docs app includes XTend base CSS in the asset version hash');
  context.assert(indexPhp.includes('__DIR__ . \'/../icons/favicon.ico\''), 'Docs app includes the favicon in the asset version hash');
  context.assert(indexPhp.includes('function docsServeAsset'), 'Docs app serves parent-level brand assets through a local whitelist endpoint');
  context.assert(indexPhp.includes('xtend-docs-asset='), 'Docs app uses a route-local asset endpoint instead of parent-root asset URLs');
  context.assert(indexPhp.includes("docsAssetUrl('favicon.ico'"), 'Docs app wires the ICO favicon through the hardened docs asset endpoint');
  context.assert(indexPhp.includes("docsAssetUrl('apple-touch-icon.png'"), 'Docs app wires the Apple touch icon through the hardened docs asset endpoint');
  context.assert(indexPhp.includes("docsAssetUrl('xtend-scaffold.webp'"), 'Docs app wires shell logos through the hardened docs asset endpoint');
  context.assert(indexPhp.includes("header_remove('X-Powered-By')"), 'Docs app removes PHP technology disclosure headers before serving assets');
  context.assert(indexPhp.includes('window.xtendDocsAssetUrls'), 'Docs app exposes hardened asset URLs for routed demos');
  context.assert(indexPhp.includes('rel="icon" href="<?= $docsFaviconIcoUrl ?>"'), 'Docs app wires the ICO favicon into the SPA shell');
  context.assert(indexPhp.includes('rel="apple-touch-icon" href="<?= $docsAppleTouchIconUrl ?>"'), 'Docs app wires the Apple touch icon into the SPA shell');
  context.assert(indexPhp.includes('href="/xtend.css?v='), 'Docs app loads XTend base CSS with cache busting');
  context.assert(indexPhp.includes('src="/xtend-loader.js?v='), 'Docs app uses versioned root-local canonical loader URL');
  context.assert(indexPhp.includes('import\' => \'/docs/utils/pageloader.js?v=\''), 'Docs app routes import the absolute versioned page loader module');
  context.assert(indexPhp.includes('src="/docs/utils/pageloader.js?v='), 'Docs app loads the absolute page loader with cache busting');
  context.assert(!indexPhp.includes('components/xtend-doc-page.js'), 'Docs app avoids stale missing route component imports');
  context.assert(indexPhp.includes('data-manifest="/components/manifest.json?v='), 'Docs app uses versioned root-local manifest URL accepted by loader policy');
  context.assert(indexPhp.includes('data-module-cache-bust='), 'Docs app forwards module cache busting to the loader');
  const xtendMainRule = xtendCss.match(/(?:^|\n)main\s*\{([\s\S]*?)\n\}/u);
  const xtendMainCss = xtendMainRule ? xtendMainRule[1] : '';
  context.assert(xtendMainCss.includes('width: 100%;'), 'XTend base CSS keeps semantic main full-width by default');
  context.assert(!/max-width\s*:/u.test(xtendMainCss), 'XTend base CSS avoids global main max-width compensation');
  context.assert(!/margin\s*:/u.test(xtendMainCss), 'XTend base CSS avoids global main margin compensation');
  context.assert(xtendLoader.includes('main {\n  box-sizing: border-box;\n  min-width: 0;\n  width: 100%;\n  padding: var(--xtend-main-padding, 0);'), 'XTend loader runtime CSS keeps main neutral without max-width or margin compensation');
  context.assert(xtendCss.includes('overflow-x: clip'), 'XTend base CSS clips page-level horizontal overflow');
  context.assert(xtendCss.includes('*,\n*::before,\n*::after'), 'XTend base CSS applies border-box sizing globally');
  context.assert(xtendCss.includes('[data-xtend-skeleton]:not(:defined)'), 'XTend base CSS provides pre-hydration skeletons for custom elements');
  context.assert(xtendCss.includes('x-router:not(:defined):not([data-xtend-skeleton])'), 'XTend base CSS hides unstyled router light DOM until definition');
  context.assert(!/(?:^|[\n}])\s*main\s*\{[^}]*max-width:\s*800px/u.test(xtendCss), 'XTend base CSS avoids hard-coded global main max-width');
  context.assert(!/(?:^|[\n}])\s*main:not\([^)]*\)\s*\{[^}]*max-width:\s*800px/u.test(xtendCss), 'XTend base CSS avoids legacy hard-coded main:not layout');
  const docsMainRule = indexPhp.match(/(?:^|\n)\s*main\s*\{([\s\S]*?)\n\s*\}/u);
  const docsMainCss = docsMainRule ? docsMainRule[1] : '';
  context.assert(indexPhp.includes('--docs-layout-gap'), 'Docs app exposes a shared layout gap token for viewport and sidebar spacing');
  context.assert(indexPhp.includes('--docs-shell-vertical-gap: 1.2rem;'), 'Docs app exposes a shared vertical gap token for header/main/footer spacing');
  context.assert(indexPhp.includes('--docs-viewport-gutter: 0.5rem;'), 'Docs app exposes a shared viewport gutter token for shell edges');
  context.assert(docsMainCss.includes('width: 100%;'), 'Docs main remains a neutral full-width router host');
  context.assert(!/max-width\s*:/u.test(docsMainCss), 'Docs main avoids local max-width compensation');
  context.assert(!/margin\s*:/u.test(docsMainCss), 'Docs main avoids local margin compensation');
  context.assert(!/padding\s*:/u.test(docsMainCss), 'Docs main avoids local padding compensation');
  context.assert(indexPhp.includes('margin: var(--docs-shell-vertical-gap) var(--docs-viewport-gutter) 0;'), 'Docs footer spacing shares the vertical rhythm and viewport gutter token');
  context.assert(indexPhp.includes('x-header::part(root)'), 'Docs app aligns the XHeader root part to the shared viewport gutter');
  context.assert(indexPhp.includes('margin: 0 var(--docs-viewport-gutter);'), 'Docs hero aligns to the shared viewport gutter');
  context.assert(indexPhp.includes('margin-inline: var(--docs-viewport-gutter);'), 'Docs RMT shell layout aligns article/sidebar to the shared viewport gutter');
  context.assert(indexPhp.includes('max-width: none'), 'Docs app content shell uses full viewport real estate instead of a centered max-width');
  context.assert(indexPhp.includes('--docs-shell-vertical-gap: 1rem;'), 'Docs app mobile shell spacing uses the same shared vertical gap token');
  context.assert(indexPhp.includes('max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));'), 'Docs hero keeps its viewport gutter inside the page width');
  context.assert(!indexPhp.includes('padding: 0 clamp(0.5rem, 3vw, 0.75rem);'), 'Docs app uses the shared viewport gutter instead of a separate mobile padding value');
  context.assert(docsShellRuntime.includes("schema: 'xtend.docs.viewport-overflow.v1'"), 'Docs AppRuntime exposes a viewport overflow diagnostic snapshot');
  context.assert(docsShellRuntime.includes('function checkViewportOverflow()'), 'Docs AppRuntime owns the targeted viewport overflow check');
  context.assert(docsShellRuntime.includes('overflowX <= 1'), 'Docs AppRuntime treats horizontal overflow as a viewport safety failure');
  context.assert(indexPhp.includes('main > x-router::part(outlet)'), 'Docs app widens the XRouter outlet part for full-width route layouts');
  context.assert(indexPhp.includes('--hero-content-max-width: none'), 'Docs hero content can use the same wide page real estate');
  context.assert(indexPhp.includes('max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));'), 'Docs hero host accounts for its shared horizontal margin');
  context.assert(!/\.docs-page-sidebar\s*\{[^}]*position:\s*sticky/u.test(indexPhp), 'Docs app sidebar scrolls with the page instead of sticking to the viewport');
  context.assert(indexPhp.includes('x-button,x-icon'), 'Docs app preloads icon button shell components');
  context.assert(indexPhp.includes('id="theme-toggle-icon" name="moon" pack="core"') || (indexPhp.includes("'id' => 'theme-toggle-icon'") && indexPhp.includes("'name' => 'moon'") && indexPhp.includes("'pack' => 'core'")), 'Docs theme toggle uses the bundled core icon pack');
  context.assert(indexPhp.includes('docsMenuIconForSlug'), 'Docs server-rendered fallback nav assigns icons to menu links');
  context.assert(indexPhp.includes("'class' => 'docs-menu-link-icon'"), 'Docs SSR task navigation renders x-icon icons for initial menu links');
  context.assert(indexPhp.includes('.docs-menu-section x-link::part(link)'), 'Docs menu styles the x-link part inside constrained menu cards');
  context.assert(indexPhp.includes('overflow-wrap: anywhere'), 'Docs menu wraps long navigation labels instead of overflowing cards');
  context.assert(indexPhp.includes('x-link,x-input,x-form,x-header,x-hero,x-router,x-footer'), 'Docs app preloads shell components without stale x-tabs preload');
  context.assert(docsShellRuntime.includes("'--input-bg-dark': '#0f0f12'"), 'Docs AppRuntime dark theme exposes black-weighted x-input dark background token');
  context.assert(docsShellRuntime.includes("'--input-placeholder-color-dark': '#a1a1aa'"), 'Docs AppRuntime dark theme exposes x-input placeholder token');
  context.assert(docsShellRuntime.includes("'--xtend-surface': '#0b0b0d'"), 'Docs AppRuntime dark theme overrides canonical XTend surface token');
  context.assert(docsShellRuntime.includes("'--xtend-text': '#f4f4f5'"), 'Docs AppRuntime dark theme overrides canonical XTend text token');
  context.assert(docsShellRuntime.includes("'--xtend-overlay-bg': 'rgba(0, 0, 0, 0.72)'"), 'Docs AppRuntime dark theme overrides canonical XTend overlay token');
  context.assert(indexPhp.includes('x-code,x-modal,x-dialog'), 'Docs app preloads hands-on demo components');
  context.assert(docsShellRuntime.includes("'--body-bg': '#050506'"), 'Docs AppRuntime dark theme uses a black-weighted body background');
  context.assert(!indexPhp.includes('data-manifest="../components/manifest.json"'), 'Docs app avoids path traversal-like manifest URL');
  context.assert(indexPhp.includes(DOCS_RMT_PAGE_SCHEMA), 'Docs app emits per-page RMT schema');
  context.assert(
    indexPhp.includes("renderMode: <?= docsJsonEncodeForHtml($initialDocumentSsr ? 'document-first' : 'shell-first'); ?>"),
    'Docs app exposes the dynamic document-first or shell-first render mode'
  );
  context.assert(indexPhp.includes("shellTemplate: 'docs.app.shell'"), 'Docs app exposes shell template metadata');
  context.assert(indexPhp.includes('$Parsedown->setSafeMode(true);'), 'Docs app keeps Parsedown SafeMode enabled');
  context.assert(parsedownAdapter.includes('isHorizontalRule'), 'Docs Parsedown adapter recognizes Markdown horizontal rules');
  context.assert(parsedownAdapter.includes("$html[] = '<hr>';"), 'Docs Parsedown adapter emits semantic hr elements for Markdown rules');
  context.assert(indexPhp.includes(TRUST_BOUNDARY), 'Docs app exposes Trusted DOM boundary');
  context.assert(pageLoader.includes(DOCS_RMT_RENDER_SCHEMA), 'Docs page loader emits RMT render metadata');
  context.assert(docsShellRuntime.includes('window.XTendFabric.createXtendFabric'), 'Docs shell creates the productive XTend Fabric instance directly');
  context.assert(docsShellRuntime.includes('createRmtAppRuntime({') && docsShellRuntime.includes('fabric,'), 'Docs shell gives Fabric ownership to the RMT AppRuntime');
  context.assert(docsShellRuntime.includes('fabric.createTelemetrySnapshot({') && docsShellRuntime.includes('appRuntime,'), 'Docs shell derives DEV API telemetry from the shared AppRuntime Fabric instance');
  context.assert(!indexPhp.includes('/docs/utils/fabric-runtime.js'), 'Docs host no longer loads the retired parallel Fabric runtime');
  context.assert(pageLoader.includes('createRmtDocsShell'), 'Docs page loader renders the RMT app shell');
  context.assert(pageLoader.includes('showDocsSkeleton'), 'Docs page loader uses the framework SkeletonLoader for Parsedown content');
  context.assert(pageLoader.includes('loadDocsParsedownContent'), 'Docs page loader lazy-loads Parsedown payloads per route');
  context.assert(pageLoader.includes('xtend.loader.skeleton-loader.v1'), 'Docs page loader records the native SkeletonLoader contract');
  context.assert(xtendLoader.includes('SKELETON_LOADER_CONTRACT'), 'XTend loader exposes the native SkeletonLoader contract');
  context.assert(xtendLoader.includes('STYLE_REGISTRY_CONTRACT'), 'XTend loader exposes the native StyleRegistry contract');
  context.assert(xtendLoader.includes('createRuntimeCriticalCss'), 'XTend loader owns runtime-critical CSS without requiring xtend.css');
  context.assert(xtendLoader.includes('STANDARD_THEME_STYLESHEET'), 'XTend loader treats xtend.css as the optional standard theme stylesheet');
  context.assert(xtendLoader.includes("ensureRuntimeStyles({ source: 'loader.evaluate' })"), 'XTend loader initializes runtime styles before boot');
  context.assert(xtendLoader.includes('window.XTendStyleRegistry'), 'XTend loader publishes the StyleRegistry namespace');
  context.assert(xtendLoader.includes('showSkeleton'), 'XTend loader exposes a native showSkeleton API');
  context.assert(xtendLoader.includes('width: var(--xtend-skeleton-width, 100%);'), 'XTend loader skeleton width can be scoped through a host token');
  context.assert(xtendLoader.includes('margin-inline: var(--xtend-skeleton-margin-inline, 0);'), 'XTend loader skeleton inline margin can be scoped through a host token');
  context.assert(xrouterSource.includes('xrouter-skeleton-shown'), 'XRouter emits route skeleton lifecycle events');
  context.assert(xrouterSource.includes('max-width: var(--xtend-skeleton-max-width, 100%);'), 'XRouter fallback skeleton respects scoped skeleton max-width tokens');
  context.assert(xrouterSource.includes('window.XTendLoader.ensureComponent'), 'XRouter can lazy-load route components through the framework loader');
  context.assert(pageLoader.includes('renderDocsRelatedSidebar'), 'Docs page loader moves read-further links into the RMT sidebar');
  context.assert(pageLoader.includes('isDocsTrustedDomUrlAllowed(href)'), 'Docs page loader preserves routable and safe related links in the sidebar');
  context.assert(pageLoader.includes('missing-sidebar-slots'), 'Docs page loader falls back to a complete shell when sidebar slots are missing');
  context.assert(pageLoader.includes('ensureDocsShellScopedStyles(this.getRootNode())'), 'Docs page loader injects shell styles into the XRouter shadow route root');
  context.assert(pageLoader.includes('DOCS_SHELL_SHADOW_STYLE_ID'), 'Docs page loader de-duplicates scoped shadow styles');
  context.assert(docsShellRuntime.includes('function iconFor(entry)'), 'Docs AppRuntime maps every menu entry to an icon');
  context.assert(docsShellRuntime.includes("class: 'docs-menu-link-icon'"), 'Docs AppRuntime renders x-icon elements inside routed menu links');
  context.assert(indexPhp.includes("docsDescriptorComponent('x-summary'") && docsShellRuntime.includes("component('x-summary'"), 'Docs task navigation uses x-summary for collapsible sections in SSR and hydration');
  context.assert(docsShellRuntime.includes("open: section.id === activeSection ? '' : null"), 'Docs task navigation opens only the active branch');
  context.assert(docsShellRuntime.includes("entries.filter((entry) => entry.trunk === activeTrunk"), 'Docs task navigation renders only the active trunk instead of legacy Deep Dive trees');
  context.assert(pageLoader.includes('var(--docs-layout-gap'), 'Docs shadow-scoped shell styles use the shared layout gap token');
  context.assert(pageLoader.includes('var(--docs-sidebar-width'), 'Docs shadow-scoped shell styles use the shared sidebar width token');
  context.assert(pageLoader.includes('margin-inline: var(--docs-viewport-gutter, 0.5rem);'), 'Docs shadow-scoped shell styles keep article/sidebar inside the shared viewport gutter');
  context.assert(pageLoader.includes('#md-content {\n    min-width: 0;\n    max-width: 100%;'), 'Docs page loader keeps rendered Markdown content viewport-bound');
  context.assert(pageLoader.includes('x-section.docs-app-shell::part(container)'), 'Docs shadow-scoped shell styles widen x-section shell parts');
  context.assert(!/\.docs-page-sidebar\s*\{[^}]*position:\s*sticky/u.test(pageLoader), 'Docs shadow-scoped sidebar scrolls with the page instead of sticking to the viewport');
  context.assert(pageLoader.includes('renderDocsComponentDemo'), 'Docs page loader renders hands-on component demos');
  context.assert(pageLoader.includes('DOCS_COMPONENT_DEMOS'), 'Docs page loader declares component demo registry');
  context.assert(pageLoader.includes("getDocsAssetUrl('lightboxLogo'"), 'Docs page loader uses the hardened docs asset endpoint for media demos');
  context.assert(!pageLoader.includes('src="/XTend-Logo.png"'), 'Docs page loader avoids root-relative parent asset URLs in demos');
  context.assert(pageLoader.includes('resolveDocsToastApi'), 'Docs page loader routes toast actions through the framework toast API');
  context.assert(pageLoader.includes('xtend-docs-toast-dropped'), 'Docs page loader emits a diagnostic when the framework toast API is unavailable');
  context.assert(!pageLoader.includes('XTend Toast Middleware'), 'Docs page loader no longer owns a custom toast middleware');
  context.assert(!pageLoader.includes("document.createElement('x-toast')"), 'Docs page loader does not duplicate native x-toast container creation');
  context.assert(!pageLoader.includes('container.style.right'), 'Docs page loader does not hard-code toast viewport positioning');
  context.assert(!pageLoader.includes('window.showToast'), 'Docs page loader avoids legacy global toast helper paths');
  context.assert(pageLoader.includes("template.setAttribute('data-x-code-mode'"), 'Docs demo code blocks mark template content mode');
  context.assert(pageLoader.includes('template.content.appendChild(document.createTextNode(snippetCode))'), 'Docs demo RMT snippets preserve plain text template content');
  context.assert(pageLoader.includes('ensureDocsDemoScaffold'), 'Docs page loader repairs incomplete RMT demo slots before rendering snippets');
  context.assert(pageLoader.includes('hydrateDocsCodeBlocks(shell.demoSlot'), 'Docs page loader hydrates x-code demo blocks after each route render');
  context.assert(pageLoader.includes('window.XTendLoader.hydrateTree'), 'Docs page loader delegates dynamic component hydration to the XTend loader');
  context.assert(pageLoader.includes('xtend-docs-code-hydrated'), 'Docs page loader emits a code hydration route diagnostic event');
  context.assert(xcodeSource.includes('_readTemplateCode'), 'x-code reads templates through a shared code extraction helper');
  context.assert(xcodeSource.includes("data-x-code-mode') === 'text'"), 'x-code supports text-mode templates for RMT snippets');
  context.assert(xcodeSource.includes('hydrate()'), 'x-code exposes a public hydrate method for routed dynamic content');
  context.assert(xcodeSource.includes('MutationObserver'), 'x-code observes dynamic light DOM changes instead of requiring host monkeypatching');
  context.assert(!pageLoader.includes('._render('), 'Docs page loader avoids private x-code render monkeypatches');
  context.assert(pageLoader.includes("pack: 'core'"), 'Docs page loader uses the bundled core icon pack for shell icon actions');
  context.assert(pageLoader.includes('renderRmtDomTemplate'), 'Docs page loader renders RMT DOM descriptors');
  context.assert(pageLoader.includes('data-rmt-shell'), 'Docs page loader marks the RMT shell');
  context.assert(pageLoader.includes('shellFirst'), 'Docs page loader exposes shell-first render metadata');
  context.assert(pageLoader.includes('data-rmt-template'), 'Docs page loader marks rendered template');
  context.assert(pageLoader.includes('data-rmt-parse-schedule'), 'Docs page loader marks Parsedown parse schedule');
  context.assert(pageLoader.includes('normalizeDocsParsedownCodeEntities'), 'Docs page loader normalizes Parsedown inline code entity output');
  context.assert(pageLoader.includes('normalizedCodeEntityCount'), 'Docs page loader exposes Parsedown code normalization diagnostics');
  context.assert(pageLoader.includes('#md-content hr'), 'Docs page loader styles semantic Parsedown horizontal rules');
  context.assert(pageLoader.includes('data-rmt-trust-boundary'), 'Docs page loader marks Trusted DOM boundary');
  context.assert(pageLoader.includes('xtendDocsRmtLastRender'), 'Docs page loader exposes last RMT render metadata');
  context.assert(pageLoader.includes('updateRoute(context = {})'), 'Docs page component supports XRouter route reuse updates');
  context.assert(pageLoader.includes('DOCS_ROUTE_CONTENT_CACHE'), 'Docs page loader caches sanitized route content');
  context.assert(pageLoader.includes('scheduleDocsAfterPaint'), 'Docs page loader moves secondary route work after paint');
  context.assert(pageLoader.includes('scheduleDocsIdle'), 'Docs page loader moves demo hydration into idle work');
  context.assert(pageLoader.includes('xtend-docs-lane-complete'), 'Docs page loader emits per-lane route telemetry');
  context.assert(pageLoader.includes('data-rmt-document-title'), 'Docs page loader mirrors RMT document title metadata on the shell');
  context.assert(parsedownDocs.includes('docs/xtendrmt-docs-shell-vnext.rmt'), 'Parsedown scheduling docs link the current AOT shell document');
  context.assert(parsedownDocs.includes('createRmtTemplateRuntimeRenderer()'), 'Parsedown scheduling docs explain the Trusted DOM host boundary');
  context.assert(parsedownDocs.includes('docs/utils/docs-shell-runtime.mjs'), 'Parsedown scheduling docs identify AppRuntime as shell owner');
  context.assert(parsedownDocs.includes('XRouter keeps one shell owner'), 'Parsedown scheduling docs explain shell reuse across routes');
  context.assert(parsedownDocs.includes('node scripts/run_xtend_tests.js docs-rmt-pilot docs-shell-catfooding'), 'Parsedown scheduling docs provide the current aggregate gate');
  context.assert(JSON.stringify(templates.get(SHELL_TEMPLATE_ID)).includes('"tag":"x-icon"'), 'Docs RMT app shell renders download as an x-icon action');
  context.assert(JSON.stringify(templates.get(SHELL_TEMPLATE_ID)).includes('"pack":"core"'), 'Docs RMT app shell uses the bundled core icon pack for shell actions');
  context.assert(metadata && metadata.schema === DOCS_RMT_PILOT_SCHEMA, 'Package metadata exposes Docs RMT pilot schema');
  context.assert(metadata && metadata.document === PILOT_DOCUMENT_PATH, 'Package metadata exposes Docs RMT pilot document path');
  context.assert(metadata && metadata.activeHost === 'docs/index.php', 'Package metadata exposes Docs RMT pilot host');
  context.assert(metadata && metadata.renderMode === 'shell-first', 'Package metadata exposes Docs RMT shell-first mode');
  context.assert(metadata && metadata.shellTemplate === SHELL_TEMPLATE_ID, 'Package metadata exposes Docs RMT shell template');
  context.assert(metadata && metadata.searchTemplate === SEARCH_TEMPLATE_ID, 'Package metadata exposes Docs RMT search template');
  context.assert(Array.isArray(metadata.futureContentKinds) && metadata.futureContentKinds.includes('xplayerTutorial'), 'Package metadata exposes future XPlayer content kind');
  context.assert(Array.isArray(metadata.requiredGates) && metadata.requiredGates.includes('npm run test:docs-rmt-pilot'), 'Package metadata requires Docs RMT pilot gate');
  context.assert(packageManifest.scripts['test:docs-rmt-pilot'] === 'node scripts/run_xtend_tests.js docs-rmt-pilot', 'Package exposes Docs RMT pilot script');

  return context.result({
    report: {
      schema: 'xtend.docs.parsedown-rmt-pilot-report.v1',
      document: PILOT_DOCUMENT_PATH,
      routes: Array.isArray(pilot.routes) ? pilot.routes.length : 0,
      templates: Array.isArray(pilot.templates) ? pilot.templates.length : 0,
      schedules: Array.isArray(pilot.schedules) ? pilot.schedules.length : 0,
      shellTemplate: SHELL_TEMPLATE_ID,
      adapter: PARSEDOWN_ADAPTER_ID,
      endpoint: PARSEDOWN_ENDPOINT
    }
  });
}

function printDocsRmtPilotReport(result) {
  printSuiteReport(result, {
    successTitle: 'Docs-App RMT Parsedown Scheduling Pilot Gates erfolgreich.',
    failureTitle: 'Docs-App RMT Parsedown Scheduling Pilot Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runDocsRmtPilotSuite();
  printDocsRmtPilotReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printDocsRmtPilotReport,
  runDocsRmtPilotSuite
};
