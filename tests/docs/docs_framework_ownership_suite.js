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
  context.assert(pageLoader.includes("from '/xtend-maraca/plan-runtime.mjs'") && pageLoader.includes('createMaracaPlanRuntime({'), 'RMT Playground boots through the public Maraca plan runtime');
  context.assert(pageLoader.includes("from '/xtendrmt/rmt-dom-descriptor-renderer.js'") && !pageLoader.includes('renderRmtDescriptorNode'), 'Docs descriptors use the official RMT DOM renderer');
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

  const toolingBridge = require('../../tools/tooling-bridge');
  const bridgeResponse = await toolingBridge.executeToolingBridgeOperation({ operation: 'safe-preview', requestId: 'ownership-contract', payload: { coreDocument: {}, project: { descriptor: { tag: 'div', children: ['Safe'] } } } }, { rootDir });
  context.assert(bridgeResponse.schema === 'xtend.compiler.tooling-bridge-response.v1' && bridgeResponse.operation === 'safe-preview' && bridgeResponse.result.descriptor.tag === 'div', 'tooling bridge returns a versioned safe-preview envelope');

  return context.result({ scannedFiles: productFiles.length, ruleCount: RULES.length });
}

function printDocsFrameworkOwnershipReport(result) {
  printSuiteReport(result, { successTitle: `${result.label} suite passed.`, failureTitle: `${result.label} suite failed:` });
}

module.exports = { RULES, scanOwnershipSource, runDocsFrameworkOwnershipSuite, printDocsFrameworkOwnershipReport };
