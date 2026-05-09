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
  COMPONENT_FIBER_OPERATION_PROFILES,
  CONTRACTS,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 6, 12, 0, tick++));
}

function findFiber(fibers, kind, phase) {
  return fibers.find((fiber) => fiber.kind === kind && (!phase || fiber.phase === phase));
}

async function runFabricComponentFiberSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-component-fibers',
    label: 'XTend-Fabric component mount and hydration fibers'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.component-fiber-instrumentation.v1', 'Fabric runtime declares component fiber instrumentation contract');
  context.assertIncludes(source, 'createComponentFiberInstrumentation', 'Fabric runtime exposes component fiber instrumentation factory');
  context.assertIncludes(source, 'COMPONENT_FIBER_OPERATION_PROFILES', 'Fabric runtime defines stable component operation profiles');
  context.assertIncludes(source, 'component.visible.mount', 'Fabric runtime maps mount fibers to visible mount schedule');
  context.assertIncludes(source, 'component.idle.hydrate', 'Fabric runtime maps hydration fibers to idle hydration schedule');
  context.assertIncludes(source, 'xtendrmt.component.mount', 'Fabric runtime prepares component mount endpoint hint');
  context.assertIncludes(source, 'xtendrmt.component.hydrate', 'Fabric runtime prepares component hydration endpoint hint');
  assert(!source.includes('rmt-runtime'), 'Component fiber instrumentation does not import the RMT runtime');

  assert(CONTRACTS.componentFiberInstrumentation === 'xtend.fabric.component-fiber-instrumentation.v1', 'Fabric exports component fiber instrumentation contract');
  assert(COMPONENT_FIBER_OPERATION_PROFILES.mount.scheduleRef === 'component.visible.mount', 'Mount operation profile keeps visible mount schedule');
  assert(COMPONENT_FIBER_OPERATION_PROFILES.hydrate.scheduleRef === 'component.idle.hydrate', 'Hydration operation profile keeps idle hydration schedule');
  assert(COMPONENT_FIBER_OPERATION_PROFILES.preload.kind === 'loader.module', 'Preload operation profile uses loader.module fiber kind');

  const reporterEvents = [];
  const fabric = createXtendFabric({
    idPrefix: 'component.fabric',
    now: createIncrementingClock()
  });
  fabric.registerReporter(fabric.createTestReporter({
    id: 'component-fiber-reporter',
    events: reporterEvents,
    minimumLevel: 'warn'
  }));

  assert(typeof fabric.createComponentFiberInstrumentation === 'function', 'Fabric instance exposes createComponentFiberInstrumentation');

  const instrumentation = fabric.createComponentFiberInstrumentation('x-alert', {
    scope: 'x-alert#primary',
    routeRef: '/alerts',
    correlationId: 'route.alerts',
    adapterRef: 'xtend.component'
  });
  assert(instrumentation.schema === CONTRACTS.componentFiberInstrumentation, 'Component instrumentation exposes stable schema');
  assert(instrumentation.componentRef === 'x-alert', 'Component instrumentation preserves componentRef');
  assert(typeof instrumentation.createFiberInput === 'function', 'Component instrumentation exposes createFiberInput');
  assert(typeof instrumentation.mount === 'function', 'Component instrumentation exposes mount');
  assert(typeof instrumentation.hydrate === 'function', 'Component instrumentation exposes hydrate');
  assert(typeof instrumentation.preload === 'function', 'Component instrumentation exposes preload');

  const plannedMount = instrumentation.createFiberInput('mount', {
    hostRef: 'shell',
    metadata: {
      token: 'secret',
      visible: true
    }
  });
  assert(plannedMount.kind === 'component.mount', 'Planned mount uses component.mount kind');
  assert(plannedMount.lane === 'visible', 'Planned mount uses visible lane');
  assert(plannedMount.scheduleRef === 'component.visible.mount', 'Planned mount carries visible mount scheduleRef');
  assert(plannedMount.endpointNameHint === 'xtendrmt.component.mount', 'Planned mount carries mount endpoint hint');
  assert(plannedMount.metadata.componentFiberInstrumentation === CONTRACTS.componentFiberInstrumentation, 'Planned mount carries instrumentation metadata');
  assert(plannedMount.metadata.metadata.token === 'secret', 'Planned input preserves caller metadata before runtime normalization');

  const mountedElement = instrumentation.mount((fiber) => {
    assert(fiber.kind === 'component.mount', 'Mount task receives running mount fiber');
    assert(fiber.scheduleRef === 'component.visible.mount', 'Running mount fiber carries scheduleRef');
    return { tagName: 'X-ALERT', mounted: true };
  }, {
    hostRef: 'shell',
    metadata: {
      token: 'secret',
      node: { nodeType: 1, nodeName: 'SECTION' }
    }
  });
  assert(mountedElement.mounted === true, 'Mount instrumentation returns task result');

  const hydratedElement = await instrumentation.hydrate((fiber) => Promise.resolve({
    hydrated: true,
    fiberId: fiber.id
  }), {
    metadata: {
      mode: 'idle-hydration'
    }
  });
  assert(hydratedElement.hydrated === true, 'Hydration instrumentation returns async task result');

  instrumentation.preload((fiber) => {
    assert(fiber.kind === 'loader.module', 'Preload task receives loader.module fiber');
    return 'preloaded';
  }, {
    metadata: {
      module: 'components/xalert.js'
    }
  });

  const visibleHydration = instrumentation.createFiberInput('hydrate', {
    lane: 'visible',
    scheduleRef: 'component.visible.hydrate',
    endpointNameHint: 'xtendrmt.component.hydrate'
  });
  assert(visibleHydration.lane === 'visible', 'Hydration input accepts visible lane override');
  assert(visibleHydration.scheduleRef === 'component.visible.hydrate', 'Hydration input accepts visible hydration schedule override');
  assert(visibleHydration.preferIdle === false, 'Visible hydration override clears idle preference');

  const fibers = fabric.getFibers();
  const mountFiber = findFiber(fibers, 'component.mount', 'mount');
  const hydrateFiber = findFiber(fibers, 'component.hydrate', 'hydrate');
  const preloadFiber = findFiber(fibers, 'loader.module', 'preload');

  assert(mountFiber && mountFiber.status === 'completed', 'Mount fiber is recorded as completed');
  assert(mountFiber && mountFiber.durationMs > 0, 'Mount fiber carries duration');
  assert(mountFiber && mountFiber.result === 'ok', 'Mount fiber carries result');
  assert(mountFiber && mountFiber.lane === 'visible', 'Mount fiber carries lane');
  assert(mountFiber && mountFiber.scheduleRef === 'component.visible.mount', 'Mount fiber carries scheduleRef');
  assert(mountFiber && mountFiber.endpointNameHint === 'xtendrmt.component.mount', 'Mount fiber carries endpoint hint');
  assert(mountFiber && Array.isArray(mountFiber.diagnostics) && mountFiber.diagnostics.length === 0, 'Mount fiber carries diagnostics array');
  assert(mountFiber && mountFiber.metadata.metadata.token === '[redacted]', 'Mount fiber metadata is redacted');
  assert(mountFiber && mountFiber.metadata.metadata.node === '[redacted:dom-node]', 'Mount fiber redacts DOM-like metadata');

  assert(hydrateFiber && hydrateFiber.status === 'completed', 'Hydration fiber is recorded as completed');
  assert(hydrateFiber && hydrateFiber.durationMs > 0, 'Hydration fiber carries duration');
  assert(hydrateFiber && hydrateFiber.lane === 'idle', 'Hydration fiber defaults to idle lane');
  assert(hydrateFiber && hydrateFiber.preferIdle === true, 'Hydration fiber prefers idle by default');
  assert(hydrateFiber && hydrateFiber.scheduleRef === 'component.idle.hydrate', 'Hydration fiber carries idle scheduleRef');
  assert(hydrateFiber && hydrateFiber.endpointNameHint === 'xtendrmt.component.hydrate', 'Hydration fiber carries endpoint hint');

  assert(preloadFiber && preloadFiber.status === 'completed', 'Preload fiber is recorded as completed');
  assert(preloadFiber && preloadFiber.source === 'loader', 'Preload fiber keeps loader source');
  assert(preloadFiber && preloadFiber.componentRef === 'x-alert', 'Preload fiber keeps componentRef');

  let failed = false;
  try {
    await instrumentation.hydrate(() => Promise.reject(new Error('hydrate failed because token secret')));
  } catch (_) {
    failed = true;
  }
  assert(failed, 'Failed hydration preserves caller failure semantics');

  const failedFiber = fabric.getFibers().find((fiber) => fiber.kind === 'component.hydrate' && fiber.status === 'failed');
  assert(failedFiber && failedFiber.diagnostics.length === 1, 'Failed hydration fiber carries diagnostic reference');
  assert(failedFiber && failedFiber.diagnostics[0].code === 'xtend.fabric.component.hydrate.failed', 'Failed hydration emits stable diagnostic code');
  assert(failedFiber && failedFiber.diagnostics[0].componentRef === 'x-alert', 'Failed hydration diagnostic carries componentRef');
  assert(failedFiber && failedFiber.diagnostics[0].scheduleRef === 'component.idle.hydrate', 'Failed hydration diagnostic carries scheduleRef');
  assert(reporterEvents.some((event) => event.code === 'xtend.fabric.component.hydrate.failed'), 'Failed hydration diagnostic reaches opt-in reporter');

  const safeInstrumentation = fabric.createComponentFiberInstrumentation('x-safe', {
    swallowErrors: true,
    fallbackValue: 'fallback'
  });
  const fallback = safeInstrumentation.mount(() => {
    throw new Error('safe mount failed');
  });
  assert(fallback === 'fallback', 'Component fiber instrumentation can swallow errors when explicitly configured');

  return context.result();
}

function printFabricComponentFiberReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Component Mount/Hydration Fibers erfolgreich.',
    failureTitle: 'XTend-Fabric Component Mount/Hydration Fibers fehlgeschlagen:'
  });
}

if (require.main === module) {
  runFabricComponentFiberSuite().then((result) => {
    printFabricComponentFiberReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  printFabricComponentFiberReport,
  runFabricComponentFiberSuite
};
