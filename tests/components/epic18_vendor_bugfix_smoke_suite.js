const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

const EPIC18_VENDOR_BUGFIX_SCHEMA = 'xtend.epic18.vendor-component-bugfix-smokes.v1';
const EPIC18_VENDOR_BUGFIX_BROWSER_SCHEMA = 'xtend.epic18.vendor-component-bugfix.browser-smoke.v1';
const EPIC18_VENDOR_BUGFIX_FIXTURE = 'tests/browser/fixtures/epic18-vendor-bugfix-smoke.html';
const EPIC18_VENDOR_BUGFIX_SUITE = 'tests/components/epic18_vendor_bugfix_smoke_suite.js';
const EPIC18_VENDOR_BUGFIX_WORKPACKAGE_DOC = 'development/WP-E18-03-Bugfix-Contract-und-Browser-Smokes-bauen.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function createStateProbe() {
  const data = {};
  return {
    data,
    set(key, value) {
      data[key] = value;
    },
    get(key) {
      return data[key];
    }
  };
}

function surfaceById(snapshot, id) {
  return (snapshot.surfaces || []).find((surface) => surface.id === id);
}

async function importEsm(rootDir, relativePath) {
  return import(pathToFileURL(resolveRepoPath(relativePath, rootDir)).href);
}

async function loadSurfaceControllerRuntime(rootDir) {
  const moduleApi = await importEsm(rootDir, 'components/xsurfacemanager-controller.js');
  if (moduleApi && typeof moduleApi.createSurfaceController === 'function') return moduleApi;
  return globalThis.XTendSurfaceController || {};
}

async function exerciseControllerReregisterPreserve(context, rootDir) {
  const {
    createSurfaceController
  } = await loadSurfaceControllerRuntime(rootDir);
  const state = createStateProbe();
  const controller = createSurfaceController({
    managerId: 'epic18.manager',
    stateKey: 'xtend.epic18.surface.registry',
    xstate: state,
    now: () => '2026-05-19T00:00:00.000Z',
    baseZIndex: 200
  });

  controller.registerSurface({
    id: 'epic18.window',
    type: 'window',
    manager: 'epic18.manager',
    label: 'Window',
    initialBounds: {
      x: 24,
      y: 32,
      width: 420,
      height: 300
    },
    defaultOpen: true,
    capabilities: ['open', 'focus', 'move', 'resize', 'minimize', 'maximize', 'restore', 'close']
  });
  controller.openSurface('epic18.window');
  controller.moveSurface('epic18.window', { x: 144, y: 96 });
  controller.resizeSurface('epic18.window', { width: 640, height: 360 });
  controller.maximizeSurface('epic18.window');
  const beforeWindow = surfaceById(controller.snapshot(), 'epic18.window');

  controller.registerSurface({
    id: 'epic18.window',
    type: 'window',
    manager: 'epic18.manager',
    label: 'Window re-registered',
    initialBounds: {
      x: 0,
      y: 0,
      width: 240,
      height: 180
    },
    capabilities: ['open', 'focus', 'move', 'resize', 'minimize', 'maximize', 'restore', 'close']
  });
  const afterWindow = surfaceById(controller.snapshot(), 'epic18.window');

  controller.registerSurface({
    id: 'epic18.panel',
    type: 'side-panel',
    manager: 'epic18.manager',
    label: 'Panel',
    placement: 'right',
    mode: 'docked',
    initialBounds: {
      width: 320,
      height: 720
    },
    defaultOpen: true,
    capabilities: ['open', 'focus', 'resize', 'dock', 'collapse', 'restore', 'close']
  });
  controller.openSurface('epic18.panel');
  controller.updateSurface('epic18.panel', {
    placement: 'bottom',
    mode: 'collapsed',
    pinned: true,
    collapsed: true,
    bounds: {
      width: 480,
      height: 190
    }
  });
  const beforePanel = surfaceById(controller.snapshot(), 'epic18.panel');

  controller.registerSurface({
    id: 'epic18.panel',
    type: 'side-panel',
    manager: 'epic18.manager',
    label: 'Panel re-registered',
    placement: 'right',
    mode: 'docked',
    initialBounds: {
      width: 260,
      height: 640
    },
    capabilities: ['open', 'focus', 'resize', 'dock', 'collapse', 'restore', 'close']
  });
  const afterPanel = surfaceById(controller.snapshot(), 'epic18.panel');

  context.assert(afterWindow && afterWindow.status === beforeWindow.status, 'Controller re-register preserves window status');
  context.assert(afterWindow && afterWindow.active === beforeWindow.active, 'Controller re-register preserves active window state');
  context.assert(afterWindow && afterWindow.maximized === true, 'Controller re-register preserves maximized state');
  context.assert(afterWindow && afterWindow.bounds.width === beforeWindow.bounds.width && afterWindow.bounds.height === beforeWindow.bounds.height, 'Controller re-register preserves current window bounds');
  context.assert(afterWindow && afterWindow.previousBounds && afterWindow.previousBounds.x === 144 && afterWindow.previousBounds.width === 640, 'Controller re-register preserves previous bounds for restore');
  context.assert(afterWindow && afterWindow.zIndex >= beforeWindow.zIndex, 'Controller re-register keeps managed z-order instead of resetting to default');
  context.assert(afterPanel && afterPanel.placement === 'bottom', 'Controller re-register preserves side-panel placement');
  context.assert(afterPanel && afterPanel.mode === 'collapsed', 'Controller re-register preserves side-panel mode');
  context.assert(afterPanel && afterPanel.pinned === true, 'Controller re-register preserves pinned state');
  context.assert(afterPanel && afterPanel.collapsed === true, 'Controller re-register preserves collapsed state');
  context.assert(afterPanel && afterPanel.bounds.width === beforePanel.bounds.width && afterPanel.bounds.height === beforePanel.bounds.height, 'Controller re-register preserves side-panel bounds');
}

async function runEpic18VendorBugfixSmokeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic18-vendor-bugfix-smokes',
    label: 'Epic 18 vendor component bugfix contract and browser smokes'
  });

  const tooltipSource = readText('components/xtooltip.js', rootDir);
  const playerSource = readText('components/xplayer.js', rootDir);
  const surfaceWindowSource = readText('components/xsurfacewindow.js', rootDir);
  const sidePanelSource = readText('components/xsidepanel.js', rootDir);
  const controllerSource = readText('components/xsurfacemanager-controller.js', rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const fixture = readText(EPIC18_VENDOR_BUGFIX_FIXTURE, rootDir);

  [
    EPIC18_VENDOR_BUGFIX_SUITE,
    'components/xtooltip.js',
    'components/xplayer.js',
    'components/xsurfacewindow.js',
    'components/xsidepanel.js',
    'components/xsurfacemanager-controller.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });
  assertFileExists(context, EPIC18_VENDOR_BUGFIX_FIXTURE, rootDir, 'Epic 18 browser smoke fixture exists');

  assertTextIncludesAll(context, tooltipSource, [
    'viewportFixedLayer: true',
    'anchorLocalPortal: false',
    'position: fixed',
    '--xtooltip-left',
    '--xtooltip-top',
    '_schedulePositionUpdate()',
    "window.addEventListener('scroll', this._onViewportChange, true)",
    "if (!customElements.get('x-tooltip'))"
  ], 'x-tooltip vendor regression contract');

  assertTextIncludesAll(context, playerSource, [
    '_observePlayerResize()',
    'new ResizeObserver',
    'container-type: inline-size',
    'text-overflow: ellipsis',
    'source: "media-event"',
    'media.addEventListener("play", () => {',
    'media.addEventListener("pause", () => {',
    'if (!customElements.get("x-player"))'
  ], 'x-player vendor regression contract');
  context.assert(!playerSource.includes('Array.from(this.shadowRoot && this.shadowRoot.querySelectorAll'), 'x-player has no module-scope shadowRoot title cleanup');

  assertTextIncludesAll(context, surfaceWindowSource, [
    'overflow-y: auto;',
    'overflow-x: hidden;'
  ], 'x-surface-window scrollbar regression contract');

  assertTextIncludesAll(context, sidePanelSource, [
    'overflow-y: auto;',
    'overflow-x: hidden;',
    '_collapseIconName(collapsed, placement)',
    "if (placement === 'right' || placement === 'inline') return collapsed ? 'chevron-right' : 'chevron-left';",
    "if (placement === 'bottom') return collapsed ? 'chevron-down' : 'chevron-up';"
  ], 'x-side-panel placement icon regression contract');

  assertTextIncludesAll(context, controllerSource, [
    'record.bounds = normalizeSurfaceBounds(previous.bounds, record.type);',
    'record.previousBounds = previous.previousBounds',
    'record.zIndex = previous.zIndex;',
    'record.active = previous.active;',
    'record.status = previous.status;',
    'record.minimized = previous.minimized;',
    'record.maximized = previous.maximized;',
    'record.pinned = previous.pinned;',
    'record.collapsed = previous.collapsed;',
    'record.placement = previous.placement;',
    'record.mode = previous.mode;'
  ], 'Surface Controller re-register preserve contract');
  await exerciseControllerReregisterPreserve(context, rootDir);

  assertTextIncludesAll(context, fixture, [
    EPIC18_VENDOR_BUGFIX_BROWSER_SCHEMA,
    '__xtendEpic18VendorBugfixSmokeResult',
    '/components/xsurfacemanager-controller.js',
    '/components/xsurfacemanager.js',
    '/components/xsurfacewindow.js',
    '/components/xsidepanel.js',
    '/components/xtooltip.js',
    '/components/xplayer.js',
    "recordCheck('epic18 all custom elements defined'",
    "recordCheck('epic18 xplayer import is idempotent'",
    "recordCheck('epic18 tooltip uses fixed viewport layer'",
    "recordCheck('epic18 tooltip positions within viewport after scroll'",
    "recordCheck('epic18 xplayer media events are canonical'",
    "recordCheck('epic18 xplayer remote-play is event-driven'",
    "recordCheck('epic18 xplayer remote-play normalizes audio media type'",
    "recordCheck('epic18 xplayer keeps click and keyboard controls bound after remote-play'",
    "recordCheck('epic18 xplayer ignores stale pause during remote source swap'",
    "recordCheck('epic18 xplayer control handlers are single-bound after source swaps'",
    "recordCheck('epic18 xplayer fullscreen control handles user click'",
    "recordCheck('epic18 xplayer pauses when its surface lifecycle closes'",
    "recordCheck('epic18 xplayer stays contained in surface'",
    "recordCheck('epic18 surface content blocks horizontal scrollbars'",
    "recordCheck('epic18 side panel icon follows placement'",
    "recordCheck('epic18 controller preserves re-register state'",
    "recordCheck('epic18 no external network dependency'"
  ], 'Epic 18 browser fixture contract');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'Epic 18 browser fixture has no XTend CDN dependency');
  context.assertIncludes(browserSuite, 'EPIC18_VENDOR_BUGFIX_FIXTURE_PATH', 'Browser harness knows Epic 18 fixture path');
  context.assertIncludes(browserSuite, 'assertEpic18VendorBugfixFixtureContract(context, rootDir)', 'Browser harness validates Epic 18 fixture contract');
  context.assertIncludes(runner, "require('../tests/components/epic18_vendor_bugfix_smoke_suite')", 'Runner imports Epic 18 vendor bugfix smoke suite');
  context.assertIncludes(runner, "id: 'epic18-vendor-bugfix-smokes'", 'Runner registers Epic 18 vendor bugfix smoke suite');

  return context.result({
    schema: EPIC18_VENDOR_BUGFIX_SCHEMA,
    fixture: EPIC18_VENDOR_BUGFIX_FIXTURE,
    workpackageDoc: EPIC18_VENDOR_BUGFIX_WORKPACKAGE_DOC
  });
}

function printEpic18VendorBugfixSmokeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 Vendor Bugfix Smokes erfolgreich.',
    failureTitle: 'Epic 18 Vendor Bugfix Smokes fehlgeschlagen:'
  });
}

if (require.main === module) {
  runEpic18VendorBugfixSmokeSuite()
    .then((result) => {
      printEpic18VendorBugfixSmokeReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  EPIC18_VENDOR_BUGFIX_BROWSER_SCHEMA,
  EPIC18_VENDOR_BUGFIX_FIXTURE,
  EPIC18_VENDOR_BUGFIX_SCHEMA,
  printEpic18VendorBugfixSmokeReport,
  runEpic18VendorBugfixSmokeSuite
};
