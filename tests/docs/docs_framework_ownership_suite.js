'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { resolveRepoPath, resolveRootDir } = require('../utils/files');

const RULES = Object.freeze([
  { id: 'local-descriptor-renderer', pattern: /function\s+(?:render|serialize)[A-Za-z0-9]*(?:Descriptor|RmtDescriptor)\s*\(/u },
  { id: 'local-safe-preview-projector', pattern: /function\s+docsRmtPlayground(?:PreviewAttributesForComponent|ComponentDescriptor|InitialDataForSurface|SafePreviewUrl)\s*\(/u },
  { id: 'maraca-mini-runtime', pattern: /function\s+(?:createDocsRmtPlaygroundMaracaKernel|syncDocsRmtPlaygroundMaracaStateAttributes|ensureDocsRmtPlaygroundMaracaModules)\s*\(/u },
  { id: 'runtime-singleton', pattern: /window\.__XTendDocsRmtPlaygroundMaracaRuntime\b/u },
  { id: 'visible-html-sink', pattern: /(?:preview|template|surface|container)\.innerHTML\s*=|insertAdjacentHTML\s*\(|\.srcdoc\s*=/u },
  { id: 'raw-browser-scheduler', pattern: /\b(?:requestIdleCallback|requestAnimationFrame)\s*\(/u },
  { id: 'raw-timer-scheduler', pattern: /\b(?:setTimeout|setInterval)\s*\(/u },
  { id: 'docs-subprocess', pattern: /\bproc_open\s*\(/u },
  { id: 'unmanaged-listener', pattern: /\.addEventListener\s*\(/u }
]);

function scanOwnershipSource(source, filePath = 'inline') {
  return RULES.filter((rule) => rule.pattern.test(String(source || ''))).map((rule) => ({ rule: rule.id, filePath }));
}

async function runDocsFrameworkOwnershipSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'docs-framework-ownership', label: 'Docs Framework Ownership' });
  const read = (file) => fs.readFileSync(resolveRepoPath(file, rootDir), 'utf8');
  const productFiles = [
    'docs/utils/pageloader.js',
    'docs/utils/docs-shell-runtime.mjs',
    'docs/utils/animation-engine-demo.mjs',
    'docs/index.php'
  ];
  const findings = productFiles.flatMap((file) => scanOwnershipSource(read(file), file));
  context.assert(findings.length === 0, `executable Docs product has no parallel runtime structures (${findings.map((entry) => `${entry.filePath}:${entry.rule}`).join(', ') || 'clean'})`);

  const pageLoader = read('docs/utils/pageloader.js');
  const phpHost = read('docs/index.php');
  const animationDemo = read('docs/utils/animation-engine-demo.mjs');
  const maracaPackage = JSON.parse(read('xtend-maraca/package.json'));
  const rmtPackage = JSON.parse(read('xtendrmt/package.json'));
  const compilerPackage = JSON.parse(read('tools/package.json'));
  const compatibilityBridges = [
    'scripts/compile_rmt_vnext_bridge.js',
    'scripts/rmt_playground_lsp_bridge.js',
    'scripts/rmt_playground_maraca_preview_bridge.js'
  ].map(read);
  context.assert(pageLoader.includes("import(docsVersionedModuleUrl('/xtend-maraca/plan-runtime.mjs'))") && pageLoader.includes('createMaracaPlanRuntime({'), 'RMT Playground boots through the cache-versioned public Maraca plan runtime');
  context.assert(pageLoader.includes("import(docsVersionedModuleUrl('/xtendrmt/rmt-dom-descriptor-renderer.js'))") && !pageLoader.includes('renderRmtDescriptorNode'), 'Docs descriptors use the cache-versioned official RMT DOM renderer');
  context.assert(phpHost.includes('xtendToolingBridgeRequest') && !phpHost.includes('proc_open'), 'PHP host delegates all compiler processes to the official tooling bridge client');
  context.assert(phpHost.includes('->renderDescriptor(') && !phpHost.includes('docsFallbackSerializeDescriptor'), 'PHP host serializes descriptors through the RMT SSR adapter');
  context.assert(animationDemo.includes('engine.replaySurfaceTransition({') && !animationDemo.includes('engine.runSurfaceTransitionPhase({'), 'Animation demo uses the framework replay contract');
  context.assert(Boolean(maracaPackage.exports['./plan-runtime']) && maracaPackage.files.includes('plan-runtime.mjs'), 'Maraca plan runtime is a packaged stable export');
  context.assert(Boolean(rmtPackage.exports['./safe-preview']) && Boolean(rmtPackage.exports['./browser-scheduler']), 'RMT packages safe preview and browser scheduling contracts');
  context.assert(Boolean(compilerPackage.exports['./tooling-bridge']) && compilerPackage.files.includes('tooling-bridge-client.php'), 'Compiler packages JS and PHP tooling bridge contracts');
  context.assert(compatibilityBridges.every((source) => source.includes('executeToolingBridgeOperation'))
    && compatibilityBridges.every((source) => !/require\(['"](?:\.\.\/tools\/rmt-language|\.\.\/xtend-maraca)/u.test(source)), 'historical bridge entry points are thin tooling-bridge adapters without duplicate compiler runtimes');

  for (const rule of RULES) {
    const fixture = rule.id === 'local-descriptor-renderer' ? 'function renderLocalDescriptor(node) { return node; }'
      : rule.id === 'local-safe-preview-projector' ? 'function docsRmtPlaygroundComponentDescriptor() {}'
        : rule.id === 'maraca-mini-runtime' ? 'function createDocsRmtPlaygroundMaracaKernel() {}'
          : rule.id === 'runtime-singleton' ? 'window.__XTendDocsRmtPlaygroundMaracaRuntime = runtime;'
        : rule.id === 'visible-html-sink' ? 'preview.innerHTML = payload;'
          : rule.id === 'raw-browser-scheduler' ? 'requestIdleCallback(work);'
            : rule.id === 'raw-timer-scheduler' ? 'setTimeout(work, 50);'
              : rule.id === 'docs-subprocess' ? 'proc_open($command, $spec, $pipes);'
                : "button.addEventListener('click', work);";
    context.assert(scanOwnershipSource(fixture, `negative/${rule.id}`).some((entry) => entry.rule === rule.id), `negative fixture detects ${rule.id}`);
  }

  const safePreview = await import(`file://${resolveRepoPath('xtendrmt/rmt-safe-preview.js', rootDir)}`);
  const projector = safePreview.createRmtSafePreviewProjector({ componentRegistry: ['x-button'] });
  const projected = projector.project({}, { descriptor: { tag: 'script', attributes: { onclick: 'alert(1)' }, children: [] } });
  context.assert(projected.descriptor.tag === 'p' && projected.diagnostics.some((entry) => entry.code === 'rmt.safe-preview.component-unknown'), 'safe preview visibly degrades unknown or unsafe components');
  const allowed = projector.project({}, { descriptor: { tag: 'x-button', attributes: { onclick: 'bad', label: 'Run' }, children: ['Run'] } });
  context.assert(allowed.descriptor.tag === 'x-button' && !Object.prototype.hasOwnProperty.call(allowed.descriptor.attributes, 'onclick'), 'safe preview strips event attributes without emitting HTML strings');

  const maracaRuntimeApi = await import(`file://${resolveRepoPath('xtend-maraca/plan-runtime.mjs', rootDir)}`);
  const fakeModules = {
    state: { createRmtStateSelectorRuntime: () => ({ createRenderContext: () => ({}), snapshot: () => ({ value: 1 }), subscribe: () => () => {} }) },
    renderer: { createRmtDomDescriptorRenderer: () => ({ render(root) { root.replaceChildren({ rendered: true }); return { nodeCount: 1 }; } }) }
  };
  const createRoot = () => ({ children: [], ownerDocument: {}, replaceChildren(...nodes) { this.children = nodes; } });
  const rootA = createRoot();
  const rootB = createRoot();
  const plan = { orchestration: { artifact: { state: {}, render: { root: { type: 'fragment', children: [] } } } } };
  const runtimeA = maracaRuntimeApi.createMaracaPlanRuntime({ plan, root: rootA, loadModules: async () => fakeModules });
  const runtimeB = maracaRuntimeApi.createMaracaPlanRuntime({ plan, root: rootB, loadModules: async () => fakeModules });
  await Promise.all([runtimeA.boot(), runtimeB.boot()]);
  context.assert(runtimeA !== runtimeB && runtimeA.snapshot().phase === 'ready' && runtimeB.snapshot().phase === 'ready', 'plan runtime supports isolated parallel preview instances');
  const snapshot = runtimeA.snapshot();
  snapshot.phase = 'tampered';
  context.assert(runtimeA.snapshot().phase === 'ready', 'plan runtime snapshots are defensive JSON values');
  runtimeA.dispose();
  context.assert(runtimeA.snapshot().phase === 'disposed' && runtimeB.snapshot().phase === 'ready', 'disposing one plan runtime does not affect another instance');
  runtimeB.dispose();

  const createSurfaceNode = (surface) => {
    const attributes = new Map([['data-maraca-surface', surface]]);
    return {
      style: {},
      getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      removeAttribute(name) { attributes.delete(name); },
      toggleAttribute(name, enabled) { if (enabled) attributes.set(name, ''); else attributes.delete(name); },
      hasAttribute(name) { return attributes.has(name); }
    };
  };
  const visibleNode = createSurfaceNode('wizard.contact');
  const hiddenNode = createSurfaceNode('wizard.issue');
  const transitionCalls = [];
  const visibilityState = { contact: { hidden: false }, issue: { hidden: true } };
  const visibilityListeners = new Set();
  const visibilityRoot = {
    ownerDocument: {},
    children: [],
    replaceChildren(...nodes) { this.children = nodes; },
    querySelectorAll(selector) { return selector === '[data-maraca-surface]' ? this.children : []; }
  };
  const visibilityModules = {
    state: { createRmtStateSelectorRuntime: () => ({
      createRenderContext: () => ({}),
      getState: (id) => ({ ...visibilityState[id] }),
      setState(id, value) { visibilityState[id] = value; visibilityListeners.forEach((listener) => listener({ state: id })); },
      snapshot: () => ({ states: {}, selectors: { contact: { ...visibilityState.contact }, issue: { ...visibilityState.issue } } }),
      subscribe(listener) { visibilityListeners.add(listener); return () => visibilityListeners.delete(listener); }
    }) },
    action: { createRmtActionEffectRuntime: () => ({ runAction: async (id, payload) => ({ id, status: 'success', data: payload }) }) },
    transitions: { createRmtSurfaceTransitionRuntime: () => ({
      findTransition: ({ action }) => action === 'wizard.next' ? { id: 'wizard.next-step', from: ['wizard.contact'], to: ['wizard.issue'] } : null,
      applyVisibilityPatch(input) { transitionCalls.push({ surface: input.surface, nextHidden: input.nextHidden }); return Promise.resolve({ status: 'complete' }); }
    }) },
    renderer: { createRmtDomDescriptorRenderer: () => ({ render(root) { root.replaceChildren(visibleNode, hiddenNode); return { nodeCount: 2 }; } }) }
  };
  const visibilityPlan = { orchestration: { artifact: {
    state: { reducers: [
      { id: 'hide-contact', action: 'wizard.next', state: 'contact', path: 'hidden', value: true },
      { id: 'show-issue', action: 'wizard.next', state: 'issue', path: 'hidden', value: false }
    ] },
    actions: { actions: [{ id: 'wizard.next' }] },
    surfaces: [{ id: 'wizard.contact', source: 'contact' }, { id: 'wizard.issue', source: 'issue' }],
    render: { root: { type: 'fragment', children: [] } }
  } }, transitions: { enabled: true, artifact: {} } };
  const visibilityRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: visibilityPlan,
    root: visibilityRoot,
    loadModules: async () => visibilityModules,
    componentRegistry: { async hydrate() { hiddenNode.removeAttribute('hidden'); hiddenNode.style.display = ''; } }
  });
  await visibilityRuntime.boot();
  context.assert(!visibleNode.hasAttribute('hidden') && visibleNode.style.display !== 'none', 'plan runtime keeps the active wizard surface visible');
  context.assert(hiddenNode.hasAttribute('hidden') && hiddenNode.style.display === 'none', 'plan runtime restores hidden wizard surfaces after component hydration');
  await visibilityRuntime.dispatchCommand('wizard.next');
  context.assert(transitionCalls.some((entry) => entry.surface === 'wizard.contact' && entry.nextHidden === true)
    && transitionCalls.some((entry) => entry.surface === 'wizard.issue' && entry.nextHidden === false), 'plan runtime routes wizard reducer visibility changes through the transition runtime');
  visibilityRuntime.dispose();

  const toolingBridge = require('../../tools/tooling-bridge');
  const bridgeResponse = await toolingBridge.executeToolingBridgeOperation({ operation: 'safe-preview', requestId: 'ownership-contract', payload: { coreDocument: {}, project: { descriptor: { tag: 'div', children: ['Safe'] } } } }, { rootDir });
  context.assert(bridgeResponse.schema === 'xtend.compiler.tooling-bridge-response.v1' && bridgeResponse.operation === 'safe-preview' && bridgeResponse.result.descriptor.tag === 'div', 'tooling bridge returns a versioned safe-preview envelope');

  return context.result({ scannedFiles: productFiles.length, ruleCount: RULES.length });
}

function printDocsFrameworkOwnershipReport(result) {
  printSuiteReport(result, { successTitle: `${result.label} suite passed.`, failureTitle: `${result.label} suite failed:` });
}

module.exports = { RULES, scanOwnershipSource, runDocsFrameworkOwnershipSuite, printDocsFrameworkOwnershipReport };
