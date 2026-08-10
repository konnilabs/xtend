const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  CONTRACTS,
  ROUTE_FIBER_OPERATION_PROFILES,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 6, 12, 30, tick++));
}

function findFiber(fibers, kind, phase) {
  return fibers.find((fiber) => fiber.kind === kind && (!phase || fiber.phase === phase));
}

async function runFabricRouteFiberSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-route-fibers',
    label: 'XTend-Fabric route navigation and render fibers'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const routerSource = readText('components/xrouter.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.route-fiber-instrumentation.v1', 'Fabric runtime declares route fiber instrumentation contract');
  context.assertIncludes(source, 'createRouteFiberInstrumentation', 'Fabric runtime exposes route fiber instrumentation factory');
  context.assertIncludes(source, 'ROUTE_FIBER_OPERATION_PROFILES', 'Fabric runtime defines stable route operation profiles');
  context.assertIncludes(source, 'ui.user-blocking.input', 'Fabric runtime maps route navigation to user-blocking schedule');
  context.assertIncludes(source, 'route.transition.render', 'Fabric runtime maps route render to transition schedule');
  context.assertIncludes(source, 'xtendrmt.route.render', 'Fabric runtime prepares route render endpoint hint');
  context.assertIncludes(source, 'xtend.fabric.route.navigate.failed', 'Fabric runtime declares route navigation diagnostic code');
  context.assertIncludes(source, 'xtend.fabric.route.render.failed', 'Fabric runtime declares route render diagnostic code');
  assert(!source.includes('rmt-runtime'), 'Route fiber instrumentation does not import the RMT runtime');

  context.assertIncludes(routerSource, 'navigate(to, options = {})', 'XRouter exposes runtime navigate surface');
  context.assertIncludes(routerSource, 'async _handleNavigation(options = {})', 'XRouter keeps navigation handling as an instrumentable boundary');
  context.assertIncludes(routerSource, 'async _renderRoute(match, container, context = {})', 'XRouter keeps contextual route rendering as an instrumentable boundary');
  context.assertIncludes(routerSource, 'router-navigate', 'XRouter keeps xstate navigation input for RMT adapter integration');

  assert(CONTRACTS.routeFiberInstrumentation === 'xtend.fabric.route-fiber-instrumentation.v1', 'Fabric exports route fiber instrumentation contract');
  assert(ROUTE_FIBER_OPERATION_PROFILES.navigate.kind === 'route.navigate', 'Navigate operation profile keeps route.navigate kind');
  assert(ROUTE_FIBER_OPERATION_PROFILES.navigate.lane === 'user-blocking', 'Navigate operation profile defaults to user-blocking lane');
  assert(ROUTE_FIBER_OPERATION_PROFILES.navigate.scheduleRef === 'ui.user-blocking.input', 'Navigate operation profile keeps input schedule');
  assert(ROUTE_FIBER_OPERATION_PROFILES.render.kind === 'route.render', 'Render operation profile keeps route.render kind');
  assert(ROUTE_FIBER_OPERATION_PROFILES.render.lane === 'transition', 'Render operation profile defaults to transition lane');
  assert(ROUTE_FIBER_OPERATION_PROFILES.render.scheduleRef === 'route.transition.render', 'Render operation profile keeps transition render schedule');

  const reporterEvents = [];
  const fabric = createXtendFabric({
    idPrefix: 'route.fabric',
    now: createIncrementingClock()
  });
  fabric.registerReporter(fabric.createTestReporter({
    id: 'route-fiber-reporter',
    events: reporterEvents,
    minimumLevel: 'warn'
  }));

  assert(typeof fabric.createRouteFiberInstrumentation === 'function', 'Fabric instance exposes createRouteFiberInstrumentation');

  const routeFibers = fabric.createRouteFiberInstrumentation('xtend.xrouter', {
    scope: 'x-router#shell',
    adapterRef: 'xtendrmt.xrouter',
    hostRef: 'app-shell'
  });
  assert(routeFibers.schema === CONTRACTS.routeFiberInstrumentation, 'Route instrumentation exposes stable schema');
  assert(routeFibers.routerRef === 'xtend.xrouter', 'Route instrumentation preserves routerRef');
  assert(typeof routeFibers.createFiberInput === 'function', 'Route instrumentation exposes createFiberInput');
  assert(typeof routeFibers.navigate === 'function', 'Route instrumentation exposes navigate');
  assert(typeof routeFibers.render === 'function', 'Route instrumentation exposes render');

  const plannedNavigation = routeFibers.createFiberInput('navigate', {
    from: '/',
    to: '/settings',
    routeId: 'settings',
    params: { tab: 'profile' },
    query: { debug: '1' },
    metadata: {
      token: 'secret'
    }
  });
  assert(plannedNavigation.kind === 'route.navigate', 'Planned navigation uses route.navigate kind');
  assert(plannedNavigation.lane === 'user-blocking', 'Planned navigation uses user-blocking lane');
  assert(plannedNavigation.scheduleRef === 'ui.user-blocking.input', 'Planned navigation carries input scheduleRef');
  assert(plannedNavigation.endpointNameHint === 'xtendrmt.ui.user-blocking', 'Planned navigation carries user-blocking endpoint hint');
  assert(plannedNavigation.routeRef === 'settings', 'Planned navigation derives routeRef from routeId');
  assert(plannedNavigation.metadata.routeFiberInstrumentation === CONTRACTS.routeFiberInstrumentation, 'Planned navigation carries instrumentation metadata');
  assert(plannedNavigation.metadata.metadata.token === 'secret', 'Planned input preserves caller metadata before runtime normalization');

  const navigateResult = routeFibers.navigate((fiber) => {
    assert(fiber.kind === 'route.navigate', 'Navigate task receives running navigation fiber');
    assert(fiber.scheduleRef === 'ui.user-blocking.input', 'Running navigation fiber carries scheduleRef');
    return { navigated: true, to: fiber.metadata.to };
  }, {
    from: '/',
    to: '/settings',
    routeId: 'settings',
    params: { tab: 'profile' },
    metadata: {
      token: 'secret',
      node: { nodeType: 1, nodeName: 'A' }
    }
  });
  assert(navigateResult.navigated === true && navigateResult.to === '/settings', 'Navigation instrumentation returns task result');

  const renderResult = await routeFibers.render((fiber) => Promise.resolve({
    rendered: true,
    fiberId: fiber.id
  }), {
    routeRef: '/settings',
    componentRef: 'x-settings',
    metadata: {
      template: 'settings'
    }
  });
  assert(renderResult.rendered === true, 'Render instrumentation returns async task result');

  const visibleRender = routeFibers.createFiberInput('render', {
    lane: 'visible',
    scheduleRef: 'route.visible.render',
    endpointNameHint: 'xtendrmt.route.render',
    routeRef: '/settings'
  });
  assert(visibleRender.lane === 'visible', 'Route render accepts visible lane override');
  assert(visibleRender.scheduleRef === 'route.visible.render', 'Route render accepts visible render schedule override');
  assert(visibleRender.preferIdle === false, 'Visible route render does not prefer idle work');

  const fibers = fabric.getFibers();
  const navigationFiber = findFiber(fibers, 'route.navigate', 'navigate');
  const renderFiber = findFiber(fibers, 'route.render', 'render');

  assert(navigationFiber && navigationFiber.status === 'completed', 'Navigation fiber is recorded as completed');
  assert(navigationFiber && navigationFiber.durationMs > 0, 'Navigation fiber carries duration');
  assert(navigationFiber && navigationFiber.result === 'ok', 'Navigation fiber carries result');
  assert(navigationFiber && navigationFiber.lane === 'user-blocking', 'Navigation fiber carries lane');
  assert(navigationFiber && navigationFiber.scheduleRef === 'ui.user-blocking.input', 'Navigation fiber carries scheduleRef');
  assert(navigationFiber && navigationFiber.endpointNameHint === 'xtendrmt.ui.user-blocking', 'Navigation fiber carries endpoint hint');
  assert(navigationFiber && navigationFiber.metadata.metadata.token === '[redacted]', 'Navigation fiber metadata is redacted');
  assert(navigationFiber && navigationFiber.metadata.metadata.node === '[redacted:dom-node]', 'Navigation fiber redacts DOM-like metadata');

  assert(renderFiber && renderFiber.status === 'completed', 'Route render fiber is recorded as completed');
  assert(renderFiber && renderFiber.durationMs > 0, 'Route render fiber carries duration');
  assert(renderFiber && renderFiber.lane === 'transition', 'Route render defaults to transition lane');
  assert(renderFiber && renderFiber.scheduleRef === 'route.transition.render', 'Route render carries transition scheduleRef');
  assert(renderFiber && renderFiber.endpointNameHint === 'xtendrmt.route.render', 'Route render carries endpoint hint');
  assert(renderFiber && renderFiber.componentRef === 'x-settings', 'Route render carries rendered componentRef');
  assert(renderFiber && Array.isArray(renderFiber.diagnostics) && renderFiber.diagnostics.length === 0, 'Route render fiber carries diagnostics array');

  let failed = false;
  try {
    await routeFibers.render(() => Promise.reject(new Error('route render failed with token secret')), {
      routeRef: '/broken'
    });
  } catch (_) {
    failed = true;
  }
  assert(failed, 'Failed route render preserves caller failure semantics');

  const failedFiber = fabric.getFibers().find((fiber) => fiber.kind === 'route.render' && fiber.status === 'failed');
  assert(failedFiber && failedFiber.diagnostics.length === 1, 'Failed route render fiber carries diagnostic reference');
  assert(failedFiber && failedFiber.diagnostics[0].code === 'xtend.fabric.route.render.failed', 'Failed route render emits stable diagnostic code');
  assert(failedFiber && failedFiber.diagnostics[0].routeRef === '/broken', 'Failed route render diagnostic carries routeRef');
  assert(failedFiber && failedFiber.diagnostics[0].scheduleRef === 'route.transition.render', 'Failed route render diagnostic carries scheduleRef');
  assert(reporterEvents.some((event) => event.code === 'xtend.fabric.route.render.failed'), 'Failed route render diagnostic reaches opt-in reporter');

  const safeRoutes = fabric.createRouteFiberInstrumentation('x-safe-router', {
    swallowErrors: true,
    fallbackValue: { navigated: false }
  });
  const fallback = safeRoutes.navigate(() => {
    throw new Error('safe navigation failed');
  }, {
    to: '/safe'
  });
  assert(fallback && fallback.navigated === false, 'Route fiber instrumentation can swallow errors when explicitly configured');

  return context.result();
}

function printFabricRouteFiberReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Route Navigation/Render Fibers erfolgreich.',
    failureTitle: 'XTend-Fabric Route Navigation/Render Fibers fehlgeschlagen:'
  });
}

if (require.main === module) {
  runFabricRouteFiberSuite().then((result) => {
    printFabricRouteFiberReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  printFabricRouteFiberReport,
  runFabricRouteFiberSuite
};
