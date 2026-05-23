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

const RMT_NATIVE_SHELL_MIGRATION_REPORT_SCHEMA = 'xtend.mm-rmt.native-shell-migration-report.v1';

function createFakeText(text) {
  return {
    nodeType: 3,
    textContent: String(text || ''),
    parentNode: null
  };
}

function findNode(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.childNodes || []) {
    const match = findNode(child, predicate);
    if (match) return match;
  }
  return null;
}

function createFakeElement(tagName = 'div') {
  const attributes = {};
  const listeners = new Map();
  const element = {
    nodeType: 1,
    tagName: String(tagName || 'div').toUpperCase(),
    attributes,
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = String(value);
      }
    },
    appendChild(child) {
      if (child && child.nodeType === 11) {
        child.childNodes.slice().forEach((fragmentChild) => this.appendChild(fragmentChild));
        return child;
      }
      this.childNodes.push(child);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = this;
      return child;
    },
    replaceChildren(...nodes) {
      this.childNodes.slice().forEach((child) => {
        if (child) child.parentNode = null;
      });
      this.childNodes = [];
      this.children = [];
      nodes.forEach((node) => this.appendChild(node));
    },
    removeChild(child) {
      this.childNodes = this.childNodes.filter((entry) => entry !== child);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = null;
      return child;
    },
    remove() {
      if (this.parentNode && typeof this.parentNode.removeChild === 'function') this.parentNode.removeChild(this);
    },
    setAttribute(name, value) {
      const key = String(name);
      attributes[key] = String(value);
      if (key.startsWith('data-')) {
        const datasetKey = key.slice(5).replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
        this.dataset[datasetKey] = String(value);
      }
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, String(name)) ? attributes[String(name)] : null;
    },
    removeAttribute(name) {
      delete attributes[String(name)];
    },
    addEventListener(type, listener) {
      listeners.set(String(type), listener);
    },
    dispatchEvent(event) {
      const listener = listeners.get(String(event.type));
      if (listener) listener(event);
      return true;
    },
    matches(selector) {
      const match = String(selector || '').match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/u);
      if (match) {
        const value = this.getAttribute(match[1]);
        return typeof match[2] === 'undefined' ? value != null : value === match[2];
      }
      return String(this.tagName || '').toLowerCase() === String(selector || '').toLowerCase();
    },
    querySelector(selector) {
      const match = String(selector || '').match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/u);
      if (match) {
        const [, name, value] = match;
        return findNode(this, (node) => node.getAttribute && (typeof value === 'undefined' ? node.getAttribute(name) != null : node.getAttribute(name) === value));
      }
      return findNode(this, (node) => node !== this && String(node.tagName || '').toLowerCase() === String(selector || '').toLowerCase());
    },
    _listeners: listeners
  };
  return element;
}

function createFakeFragment() {
  return {
    nodeType: 11,
    childNodes: [],
    appendChild(child) {
      this.childNodes.push(child);
      if (child) child.parentNode = this;
      return child;
    }
  };
}

function createFakeDocument() {
  const body = createFakeElement('body');
  return {
    body,
    createElement: createFakeElement,
    createTextNode: createFakeText,
    createDocumentFragment: createFakeFragment
  };
}

function textContent(root) {
  if (!root) return '';
  if (root.nodeType === 3) return root.textContent || '';
  return (root.childNodes || []).map(textContent).join('');
}

function createFakeEvent(type, options = {}) {
  return {
    type,
    target: options.target || null,
    currentTarget: options.currentTarget || options.target || null,
    detail: options.detail || {},
    dataTransfer: options.dataTransfer,
    returnValue: options.returnValue,
    cancelable: options.cancelable !== false,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
    composedPath() {
      return options.composedPath || [this.target, this.currentTarget].filter(Boolean);
    }
  };
}

async function loadModule(rootDir, relativePath) {
  return import(`file://${resolveRepoPath(relativePath, rootDir)}`);
}

function runTransformAssertions(context, stateRuntimeModule, rendererModule) {
  const assets = [
    { id: 'a', title: 'alpha clip', kind: 'video', size: 1048576, createdAt: '2026-05-20T12:00:00Z', duration: 125 },
    { id: 'b', title: 'beta still', kind: 'image', size: 2048, createdAt: '2026-05-21T12:00:00Z', duration: 0 },
    { id: 'c', title: 'gamma reel', kind: 'video', size: 5242880, createdAt: '2026-05-22T12:00:00Z', duration: 3661 }
  ];
  const runtime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [
      { id: 'state.assets', type: 'collection', initial: assets },
      { id: 'state.selection', type: 'object', initial: { activeIndex: 1 } }
    ],
    selectors: [
      { id: 'selector.videos', from: 'state.assets', filter: { path: 'kind', op: 'equals', value: 'video' }, slice: { start: 0, end: 2 } },
      { id: 'selector.video-titles', from: 'selector.videos', map: { expression: { op: 'uppercase', value: '$item.title' } } },
      { id: 'selector.kind-counts', from: 'state.assets', compute: 'countBy', countBy: 'kind' },
      { id: 'selector.second-title', from: 'state.assets', path: '[1].title' }
    ],
    derive: [
      { id: 'derive.first-size', from: 'state.assets', path: '[0].size', transform: { op: 'formatBytes' } },
      { id: 'derive.first-date', from: 'state.assets', path: '[0].createdAt', transform: { op: 'formatDateShort' } },
      { id: 'derive.long-duration', from: 'state.assets', path: '[2].duration', transform: { op: 'formatDuration' } }
    ]
  });

  context.assert(runtime.select('selector.videos').length === 2, 'Transform DSL filters and slices selector collections');
  context.assert(runtime.select('selector.video-titles')[0] === 'ALPHA CLIP', 'Transform DSL maps and uppercases selector rows');
  context.assert(runtime.select('selector.kind-counts').video === 2, 'Transform DSL countBy groups records');
  context.assert(runtime.select('selector.second-title') === 'beta still', 'Transform DSL resolves array index paths');
  context.assert(runtime.getDerivedValues()['derive.first-size'] === '1.0 MB', 'Derived transform formats byte values');
  context.assert(runtime.getDerivedValues()['derive.first-date'] === '2026-05-20', 'Derived transform formats short dates');
  context.assert(runtime.getDerivedValues()['derive.long-duration'] === '1:01:01', 'Derived transform formats durations');
  context.assert(runtime.resolve({ op: 'fallback', value: '$state.missing', fallback: 'Untitled' }) === 'Untitled', 'Transform DSL applies fallbacks');
  context.assert(runtime.resolve('${derive.first-size} ready') === '1.0 MB ready', 'Transform DSL interpolates derived values');

  const documentTarget = createFakeDocument();
  const renderer = rendererModule.createRmtDomDescriptorRenderer({ documentTarget });
  const root = documentTarget.createElement('main');
  renderer.render(root, {
    type: 'element',
    tag: 'x-summary',
    attributes: {
      title: { op: 'uppercase', value: '$state.assets[0].title' },
      'data-kind': { op: 'replace', value: '$state.assets[0].kind', search: 'video', replacement: 'motion' }
    },
    children: [
      {
        type: 'text',
        text: { op: 'concat', values: ['${state.assets[0].title}', ' ', { op: 'formatBytes', value: '$state.assets[0].size' }] }
      }
    ]
  }, { model: { assets } });
  const summary = root.querySelector('x-summary');
  context.assert(summary.getAttribute('title') === 'ALPHA CLIP', 'DOM Descriptor values run formatting transforms');
  context.assert(summary.getAttribute('data-kind') === 'motion', 'DOM Descriptor values run replace transforms');
  context.assert(textContent(root) === 'alpha clip 1.0 MB', 'DOM Descriptor text interpolates state and formatted values');
  context.assert(renderer.resolveValue({ op: 'contains', value: '$state.assets[0].title', search: 'clip' }, { model: { assets } }) === true, 'DOM Descriptor resolveValue exposes contains transforms');
}

async function runEventAdapterAssertions(context, eventRuntimeModule) {
  const actionCalls = [];
  const actionRuntime = {
    async runAction(action, payload) {
      actionCalls.push({ action, payload });
      return { status: 'success' };
    }
  };
  const runtime = eventRuntimeModule.createRmtEventRoutingRuntime({
    actionRuntime,
    confirmAdapter: {
      confirm(message) {
        return !String(message).includes('Delete');
      }
    },
    events: [
      { id: 'event.dataset', event: 'click', action: 'action.pick', payloadAdapter: { kind: 'dataset', closest: '[data-record-id]' }, payloadContract: { type: 'object', required: ['dataset'] } },
      { id: 'event.file-input', event: 'change', action: 'action.upload', payloadAdapter: 'file-input', postAction: ['reset-file-input'] },
      { id: 'event.drop-files', event: 'drop', action: 'action.drop', payloadAdapter: 'drop-files', preventDefault: true },
      { id: 'event.delete', event: 'click', action: 'action.delete', payloadAdapter: 'dataset', guard: { kind: 'confirm', message: 'Delete selected record?' } },
      { id: 'event.beforeunload', event: 'beforeunload', action: 'action.warn', payloadAdapter: 'beforeunload' }
    ]
  });
  const row = createFakeElement('button');
  row.setAttribute('data-record-id', 'asset-a');
  row.setAttribute('data-action', 'open');
  const child = createFakeElement('span');
  row.appendChild(child);
  const datasetResult = await runtime.routeEvent('event.dataset', createFakeEvent('click', {
    target: child,
    composedPath: [child, row]
  }));
  context.assert(datasetResult.payload.id === 'asset-a' && datasetResult.payload.dataset.recordId === 'asset-a', 'Event adapter reads closest dataset payloads through composed path');

  const fileInput = createFakeElement('input');
  fileInput.name = 'upload';
  fileInput.value = '/tmp/asset.mov';
  fileInput.files = [{ name: 'asset.mov', size: 4096, type: 'video/quicktime', lastModified: 1 }];
  const fileResult = await runtime.routeEvent('event.file-input', createFakeEvent('change', { target: fileInput }));
  context.assert(fileResult.payload.fileCount === 1 && fileResult.payload.files[0].name === 'asset.mov', 'Event adapter normalizes file input FileList payloads');
  context.assert(fileInput.value === '', 'Event adapter runs post-action reset for file inputs');

  const dropResult = await runtime.routeEvent('event.drop-files', createFakeEvent('drop', {
    target: row,
    dataTransfer: {
      files: [{ name: 'drop.png', size: 128, type: 'image/png', lastModified: 2 }],
      types: ['Files']
    }
  }));
  context.assert(dropResult.payload.files[0].name === 'drop.png' && dropResult.payload.types.includes('Files'), 'Event adapter normalizes drag/drop files');
  context.assert(dropResult.governance.preventDefault === true, 'Event adapter preserves drop governance');

  const blocked = await runtime.routeEvent('event.delete', createFakeEvent('click', { target: row }));
  context.assert(blocked.status === 'blocked' && blocked.reason === 'confirm-declined', 'Event adapter confirm guard blocks destructive actions');
  const beforeUnload = await runtime.routeEvent('event.beforeunload', createFakeEvent('beforeunload', { target: row, returnValue: 'stay' }));
  context.assert(beforeUnload.payload.returnValue === 'stay', 'Event adapter carries beforeunload payloads');
  context.assert(actionCalls.some((entry) => entry.action === 'action.upload') && !actionCalls.some((entry) => entry.action === 'action.delete'), 'Blocked guard prevents action invocation');
}

async function runSurfaceAndShellAssertions(context, actionRuntimeModule, rendererModule, surfaceRuntimeModule, nativeShellModule) {
  const objectUrls = [];
  const revokedUrls = [];
  const documentTarget = createFakeDocument();
  const resourceManager = actionRuntimeModule.createRmtResourceManager({
    resources: [
      { id: 'resource.preview-url', kind: 'object-url', source: 'preview-source' }
    ],
    objectUrlFactory: {
      create(value) {
        const url = `blob:test:${value}:${objectUrls.length + 1}`;
        objectUrls.push(url);
        return url;
      },
      revoke(value) {
        revokedUrls.push(value);
      }
    }
  });
  const surfaceRuntime = surfaceRuntimeModule.createRmtSurfaceResourceGraphRuntime({
    documentTarget,
    resourceManager,
    portals: [{ id: 'portal.overlay', policy: 'stacked', zIndexStart: 4000 }],
    surfaces: [
      { id: 'surface.workspace', source: 'records.items', repeat: true, key: '$record.id', owner: '$instance.id', component: 'x-workspace', template: { type: 'element', tag: 'x-workspace', children: [{ type: 'text', text: '$item.title' }] } }
    ],
    overlays: [
      { id: 'overlay.lightbox', kind: 'lightbox', portal: 'portal.overlay', component: 'x-lightbox', resources: ['resource.preview-url'], attributes: { 'data-test-lightbox': 'true' } }
    ]
  });
  surfaceRuntime.mountPortal('portal.overlay', documentTarget.body);
  const firstMaterialize = surfaceRuntime.materialize({ 'records.items': [{ id: 'a', title: 'Alpha' }] });
  context.assert(firstMaterialize.createdCount === 1, 'Surface graph materializes keyed shell surface instances');
  await surfaceRuntime.openSurface('surface.workspace:a');
  const overlay = await surfaceRuntime.openOverlay('overlay.lightbox', { ownerId: 'surface.workspace:a', text: 'Preview' });
  const overlayElement = documentTarget.body.children.find((child) => child.getAttribute && child.getAttribute('data-rmt-overlay-ref') === 'overlay.lightbox');
  context.assert(overlay.elementMounted === true && Boolean(overlayElement), 'Overlay materializer mounts portal DOM elements');
  context.assert(overlayElement && overlayElement.getAttribute('data-rmt-overlay-ref') === 'overlay.lightbox', 'Overlay materializer marks portal ownership');
  context.assert(objectUrls.length === 1, 'Overlay materializer acquires owned object-url resources');
  const closed = surfaceRuntime.closeOverlay(overlay.id);
  context.assert(closed.closed === true && closed.overlay.elementMounted === false, 'Overlay close removes materialized elements from reports');
  context.assert(!documentTarget.body.children.some((child) => child.getAttribute && child.getAttribute('data-rmt-overlay-ref') === 'overlay.lightbox') && revokedUrls.length === 1, 'Overlay close cleans portal DOM and object URLs');
  const ownedOverlay = await surfaceRuntime.openOverlay('overlay.lightbox', { ownerId: 'surface.workspace:a' });
  surfaceRuntime.destroySurface('surface.workspace:a');
  context.assert(surfaceRuntime.listOverlays({ includeClosed: true }).some((entry) => entry.id === ownedOverlay.id && entry.state === 'closed'), 'Surface destroy closes overlays owned by the surface');
  context.assert(revokedUrls.length === 2, 'Surface destroy releases overlay-owned object URLs');

  const renderer = rendererModule.createRmtDomDescriptorRenderer({ documentTarget });
  const shellRuntime = surfaceRuntimeModule.createRmtSurfaceResourceGraphRuntime({
    surfaces: [
      { id: 'surface.workspace', source: 'records.items', repeat: true, key: '$record.id', owner: '$instance.id', component: 'x-workspace' }
    ]
  });
  const shellRoot = documentTarget.createElement('main');
  const controller = nativeShellModule.createRmtNativeShellController({
    renderer,
    surfaceRuntime: shellRuntime,
    root: shellRoot
  });
  const firstSync = controller.syncSurfaces({ 'records.items': [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }] });
  const firstNode = shellRoot.querySelector('[data-rmt-key="surface.workspace:a"]');
  const secondSync = controller.syncSurfaces({ 'records.items': [{ id: 'a', title: 'Alpha changed' }, { id: 'b', title: 'Beta' }] });
  context.assert(firstSync.renderedCount === 2 && secondSync.materializeReport.reusedCount === 2, 'Native shell controller renders and reuses keyed surface islands');
  context.assert(shellRoot.querySelector('[data-rmt-key="surface.workspace:a"]') === firstNode, 'Native shell controller preserves DOM nodes by surface key');
  await controller.openSurface('surface.workspace:a');
  controller.focusSurface('surface.workspace:a');
  controller.minimizeSurface('surface.workspace:a');
  context.assert(controller.getIsland('surface.workspace:a').state === 'minimized', 'Native shell controller mirrors minimized state');
  controller.restoreSurface('surface.workspace:a');
  controller.closeSurface('surface.workspace:a');
  controller.destroySurface('surface.workspace:a');
  context.assert(controller.getIsland('surface.workspace:a').state === 'destroyed', 'Native shell controller mirrors destroy state');
}

function runGateAndContractAssertions(context, rootDir, toolingModule) {
  const packageManifest = readJson('package.json', rootDir);
  const xtendrmtPackage = readJson('xtendrmt/package.json', rootDir);
  const xplayerSource = readText('components/xplayer.js', rootDir);
  const xplayerTypes = readText('components/xplayer.d.ts', rootDir);
  const nativeRuntime = readText('xtendrmt/rmt-native-shell-runtime.js', rootDir);
  const gate = toolingModule.createDownstreamNoManualHtmlGate();
  const badDiagnostics = gate.scanFiles({
    'src/app/media-manager-shell.js': 'root.innerHTML = "<x-player></x-player>";'
  });
  const allowedDiagnostics = gate.scanFiles({
    'components/xplayer.js': xplayerSource
  });
  const analysis = toolingModule.analyzeDownstreamNoManualHtml({
    files: {
      'src/app/media-manager-shell.js': 'element.insertAdjacentHTML("beforeend", "<x-card></x-card>");'
    }
  });

  context.assert(badDiagnostics.some((entry) => entry.code === toolingModule.RMT_APP_PLATFORM_DIAGNOSTIC_CODES.manualHtmlSink), 'Downstream gate rejects manual HTML sinks in app shell code');
  context.assert(allowedDiagnostics.length === 0, 'Downstream gate allows component-owned shadow DOM internals by file exception');
  context.assert(analysis.ok === false && analysis.acceptanceNames.includes('rmt:check'), 'Downstream gate exposes rmt:check acceptance name');
  context.assert(xplayerSource.includes('xtendRmtPlayerContract') && xplayerSource.includes('applyRmtPlayerCommand'), 'x-player exposes public RMT player command contract');
  context.assert(xplayerSource.includes('setMediaState') && xplayerSource.includes('applyRmtThemeTokens'), 'x-player exposes state bridge and theme token API');
  context.assert(xplayerTypes.includes('XPlayerRmtPlayerContract') && xplayerTypes.includes('applyRmtPlayerCommand'), 'x-player types expose RMT player contract');
  context.assert(!/shadowRoot\.(?:querySelector|innerHTML).*media-manager/u.test(xplayerSource), 'x-player contract does not require product shadowRoot patches');
  context.assert(nativeRuntime.includes('createRmtNativeShellController') && !/innerHTML|insertAdjacentHTML|document\.write/u.test(nativeRuntime), 'Native shell runtime is descriptor-based and HTML-sink-free');
  context.assert(packageManifest.scripts['test:rmt-native-shell-migration'] === 'node scripts/run_xtend_tests.js rmt-native-shell-migration', 'Package exposes native shell migration test script');
  context.assert(packageManifest.scripts['rmt:check'] === 'node scripts/run_xtend_tests.js rmt-native-shell-migration', 'Package exposes downstream rmt:check alias');
  context.assert(packageManifest.scripts['check:syntax'] === 'node scripts/check_syntax.js', 'Package exposes downstream check:syntax alias');
  context.assert(packageManifest.exports['./rmt/native-shell-runtime'], 'Package exports native shell runtime');
  context.assert(xtendrmtPackage.exports['./native-shell-runtime'], 'XTendRMT package exports native shell runtime');
}

async function runRmtNativeShellMigrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-native-shell-migration',
    label: 'RMT Native Shell migration gap'
  });
  const syntaxFiles = [
    'xtendrmt/rmt-dom-descriptor-renderer.js',
    'xtendrmt/rmt-state-selector-runtime.js',
    'xtendrmt/rmt-event-routing-runtime.js',
    'xtendrmt/rmt-surface-resource-graph-runtime.js',
    'xtendrmt/rmt-native-shell-runtime.js',
    'components/xplayer.js',
    'tools/rmt-language/app-platform-tooling.js',
    'scripts/check_syntax.js'
  ];
  syntaxFiles.forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const stateRuntimeModule = await loadModule(rootDir, 'xtendrmt/rmt-state-selector-runtime.js');
  const rendererModule = await loadModule(rootDir, 'xtendrmt/rmt-dom-descriptor-renderer.js');
  const eventRuntimeModule = await loadModule(rootDir, 'xtendrmt/rmt-event-routing-runtime.js');
  const actionRuntimeModule = await loadModule(rootDir, 'xtendrmt/rmt-action-effect-runtime.js');
  const surfaceRuntimeModule = await loadModule(rootDir, 'xtendrmt/rmt-surface-resource-graph-runtime.js');
  const nativeShellModule = await loadModule(rootDir, 'xtendrmt/rmt-native-shell-runtime.js');
  const toolingModule = require('../../tools/rmt-language/app-platform-tooling');

  context.assert(nativeShellModule.RMT_NATIVE_SHELL_RUNTIME_SCHEMA === 'xtend.mm-rmt.native-shell-runtime.v1', 'Native shell runtime schema is exported');
  context.assert(typeof nativeShellModule.createRmtNativeShellController === 'function', 'Native shell controller factory is exported');
  runTransformAssertions(context, stateRuntimeModule, rendererModule);
  await runEventAdapterAssertions(context, eventRuntimeModule);
  await runSurfaceAndShellAssertions(context, actionRuntimeModule, rendererModule, surfaceRuntimeModule, nativeShellModule);
  runGateAndContractAssertions(context, rootDir, toolingModule);

  return context.result({
    schema: RMT_NATIVE_SHELL_MIGRATION_REPORT_SCHEMA
  });
}

function printRmtNativeShellMigrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Native Shell Migration Gap erfolgreich.',
    failureTitle: 'RMT Native Shell Migration Gap fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtNativeShellMigrationSuite()
    .then((result) => {
      printRmtNativeShellMigrationReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtNativeShellMigrationReport,
  runRmtNativeShellMigrationSuite
};
