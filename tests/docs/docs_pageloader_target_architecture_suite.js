const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');

const PAGE_LOADER = 'docs/utils/pageloader.js';
const CENTRAL_RENDERER = 'xtendrmt/rmt-dom-descriptor-renderer.js';
const BROWSER_SMOKE = 'scripts/smoke_docs_shell_catfooding.mjs';

const FORBIDDEN_DOM = Object.freeze([
  ['document.createElement', /\bdocument\s*\.\s*createElement\s*\(/u],
  ['document.createElementNS', /\bdocument\s*\.\s*createElementNS\s*\(/u],
  ['document.createDocumentFragment', /\bdocument\s*\.\s*createDocumentFragment\s*\(/u],
  ['document.createTextNode', /\bdocument\s*\.\s*createTextNode\s*\(/u],
  ['appendChild', /\.\s*appendChild\s*\(/u],
  ['insertBefore', /\.\s*insertBefore\s*\(/u],
  ['replaceChildren', /\.\s*replaceChildren\s*\(/u]
]);
const FORBIDDEN_FACTORIES = /\b(?:createRmtDomDescriptorRenderer|createRmtBrowserScheduler)\s*\(/u;
const WINDOW_ASSIGNMENT = /\bwindow\s*\.\s*[A-Za-z_$][\w$]*\s*=(?!=)/u;

/** Static policy used by this suite and by focused unit checks below. */
function inspectPageLoaderSource(source, options = {}) {
  const allowRendererFactory = options.allowRendererFactory === true;
  const diagnostics = [];
  FORBIDDEN_DOM.forEach(([rule, expression]) => {
    if (expression.test(source)) diagnostics.push(rule);
  });
  if (!allowRendererFactory && FORBIDDEN_FACTORIES.test(source)) diagnostics.push('direct-runtime-factory');
  if (WINDOW_ASSIGNMENT.test(source)) diagnostics.push('window-assignment');
  return diagnostics;
}

function runDocsPageLoaderTargetArchitectureSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'docs-pageloader-target-architecture',
    label: 'Docs PageLoader target architecture'
  });
  const pageLoader = readText(PAGE_LOADER, rootDir);
  const renderer = readText(CENTRAL_RENDERER, rootDir);
  const browserSmoke = readText(BROWSER_SMOKE, rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const resumeBootstrap = readText('docs/utils/docs-resume-bootstrap.mjs', rootDir);
  const packageJson = readText('package.json', rootDir);

  // Prove every prohibited spelling is executable policy, rather than a passive
  // documentation list. The productive migration is guarded incrementally below.
  FORBIDDEN_DOM.forEach(([rule, expression]) => {
    context.assert(inspectPageLoaderSource(`node${expression.source.includes('document') ? '; document.createElement("x")' : '.appendChild(child)'}`).length > 0,
      `static policy rejects ${rule}`);
  });
  context.assert(inspectPageLoaderSource('createRmtBrowserScheduler({});').includes('direct-runtime-factory'), 'static policy rejects direct renderer/scheduler factories');
  context.assert(inspectPageLoaderSource('window.newDocsEscapeHatch = true;').includes('window-assignment'), 'static policy rejects new window.* assignments');
  context.assert(inspectPageLoaderSource('renderer.render(root, descriptor);').length === 0, 'static policy accepts descriptor rendering');

  context.assert(renderer.includes('documentTarget.createElement(') && renderer.includes('function createFragment('), 'DOM primitives stay centralized in the XTend descriptor renderer');
  context.assert(pageLoader.includes("import(docsVersionedModuleUrl('/xtendrmt/rmt-dom-descriptor-renderer.js'))"), 'PageLoader imports the central renderer');
  context.assert(pageLoader.includes('docsRmtDescriptorRenderer.render('), 'PageLoader routes page structures through render');
  context.assert(pageLoader.includes('docsRmtDescriptorRenderer.renderNode('), 'PageLoader represents child structures as descriptors');
  context.assert(!pageLoader.includes('new MutationObserver('), 'PageLoader does not introduce an unmanaged observer/listener lifecycle');

  context.assert(`${indexPhp}\n${resumeBootstrap}`.includes('/xtend.js'), 'Docs production host loads /xtend.js');
  ['render(', 'renderKeyed(', 'patchElement('].forEach((operation) => {
    context.assert(renderer.includes(operation), `central renderer exposes ${operation.slice(0, -1)}`);
  });

  [
    'sameNodeAfterDefinition',
    'data-xrouter-adoption-pending',
    'rapidNavigationRace',
    'localeSwitch',
    'rejected SSR proof',
    'rmt.dom.slot.missing',
    'sanitize',
    'listener',
    'lazy',
    'trusted-dom',
    'production-hardening',
    'Parsedown'
  ].forEach((proof) => {
    context.assert(`${browserSmoke}\n${pageLoader}\n${renderer}`.toLowerCase().includes(proof.toLowerCase()), `browser/regression evidence retains ${proof}`);
  });
  ['docs-php-ssr-cls-budget', 'epic13-trusted-dom-boundary', 'epic13-docs-rmt-production-hardening', 'docs-rmt-pilot'].forEach((gate) => {
    context.assert(packageJson.includes(gate), `existing regression gate remains registered: ${gate}`);
  });

  return context.result();
}

function printDocsPageLoaderTargetArchitectureReport(result) {
  printSuiteReport(result);
}

module.exports = {
  inspectPageLoaderSource,
  printDocsPageLoaderTargetArchitectureReport,
  runDocsPageLoaderTargetArchitectureSuite
};
