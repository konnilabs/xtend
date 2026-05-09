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
  PERFORMANCE_BUDGET_MS_BY_MEASURE,
  PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND,
  PERFORMANCE_MEASURE_PHASES,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 6, 15, 0, tick++));
}

function createRecordingPerformance() {
  const entries = {
    mark: [],
    measure: []
  };
  let nowValue = 0;

  function now() {
    nowValue += 6;
    return nowValue;
  }

  return {
    now,
    mark(name) {
      entries.mark.push({
        name,
        entryType: 'mark',
        startTime: now(),
        duration: 0
      });
    },
    measure(name, startMark, endMark) {
      entries.measure.push({
        name,
        entryType: 'measure',
        startTime: now(),
        duration: name === 'xtend.component.hydrate' ? 36 : 18,
        detail: {
          startMark,
          endMark
        }
      });
    },
    addMeasure(name, duration) {
      entries.measure.push({
        name,
        entryType: 'measure',
        startTime: now(),
        duration
      });
    },
    getEntriesByType(type) {
      return entries[type] ? entries[type].slice() : [];
    }
  };
}

async function runFabricPerformanceMeasurementSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-performance-measurements',
    label: 'XTend-Fabric loader and hydration performance measurements'
  });
  const { assert } = context;
  const fabricSource = readText('fabric/xtend-fabric.js', rootDir);
  const loaderSource = readText('xtend-loader.js', rootDir);
  const fabricSyntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });
  const loaderSyntax = syntaxCheckFile('xtend-loader.js', { rootDir, extension: '.js' });

  assert(fabricSyntax.ok, `Fabric runtime syntax check passes${fabricSyntax.ok ? '' : ` (${fabricSyntax.message})`}`);
  assert(loaderSyntax.ok, `XTend loader syntax check passes${loaderSyntax.ok ? '' : ` (${loaderSyntax.message})`}`);
  context.assertIncludes(fabricSource, 'xtend.performance.measurement.v1', 'Fabric runtime declares the performance measurement contract');
  context.assertIncludes(fabricSource, 'PERFORMANCE_MEASURE_PHASES', 'Fabric runtime declares stable performance phase mapping');
  context.assertIncludes(fabricSource, 'PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND', 'Fabric runtime maps fiber kinds to performance measure names');
  context.assertIncludes(fabricSource, 'startPerformanceMeasurement', 'Fabric runtime marks fiber performance starts');
  context.assertIncludes(fabricSource, 'finishPerformanceMeasurement', 'Fabric runtime measures fiber performance completions');
  context.assertIncludes(fabricSource, 'phaseSummary', 'Telemetry performance snapshot exposes phase summary');
  context.assertIncludes(loaderSource, 'measureLoaderPhase', 'XTend loader measures loader phases');
  context.assertIncludes(loaderSource, 'xtend.loader.manifest', 'XTend loader marks manifest load');
  context.assertIncludes(loaderSource, 'xtend.loader.module', 'XTend loader marks module load');
  context.assertIncludes(loaderSource, 'xtend.component.define', 'XTend loader marks custom element definition');
  context.assertIncludes(loaderSource, 'CUSTOM_ELEMENT_DEFINE_TIMEOUT_MS', 'XTend loader keeps component define measurement bounded');
  context.assertIncludes(loaderSource, 'xtend-loader-performance', 'XTend loader emits local performance measurement events');

  assert(CONTRACTS.performanceMeasurement === 'xtend.performance.measurement.v1', 'Fabric exports the performance measurement contract');
  assert(PERFORMANCE_MEASURE_PHASES['xtend.loader.manifest'] === 'load', 'Manifest performance phase maps to load');
  assert(PERFORMANCE_MEASURE_PHASES['xtend.component.hydrate'] === 'hydrate', 'Hydration performance phase maps to hydrate');
  assert(PERFORMANCE_MEASURE_PHASES['xtend.route.render'] === 'route', 'Route render performance phase maps to route');
  assert(PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND['component.hydrate'] === 'xtend.component.hydrate', 'Hydration fiber maps to stable performance measure name');
  assert(PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND['route.render'] === 'xtend.route.render', 'Route render fiber maps to stable performance measure name');
  assert(PERFORMANCE_BUDGET_MS_BY_MEASURE['xtend.component.hydrate'] === 32, 'Hydration measure keeps initial budget from Performance Matrix');

  const performance = createRecordingPerformance();
  performance.addMeasure('xtend.loader.manifest', 12);

  const fabric = createXtendFabric({
    idPrefix: 'performance.fabric',
    now: createIncrementingClock(),
    performance
  });

  const componentFibers = fabric.createComponentFiberInstrumentation('x-alert');
  await componentFibers.hydrate(() => Promise.resolve('hydrated'));

  fabric.runFiber({
    kind: 'component.render',
    phase: 'render',
    componentRef: 'x-alert',
    lane: 'visible'
  }, () => 'rendered');

  const routeFibers = fabric.createRouteFiberInstrumentation('xtend.xrouter');
  await routeFibers.render(() => Promise.resolve('route-rendered'), {
    routeRef: '/alerts',
    componentRef: 'x-alert'
  });

  const performanceEntries = performance.getEntriesByType('measure');
  assert(performanceEntries.some((entry) => entry.name === 'xtend.component.hydrate'), 'Fabric records hydration performance measure');
  assert(performanceEntries.some((entry) => entry.name === 'xtend.component.render'), 'Fabric records component render performance measure');
  assert(performanceEntries.some((entry) => entry.name === 'xtend.route.render'), 'Fabric records route render performance measure');

  const snapshot = fabric.createTelemetrySnapshot({
    id: 'performance.snapshot.test',
    performance,
    performanceEntryLimit: 40
  });

  assert(snapshot.performance.measurementSchema === CONTRACTS.performanceMeasurement, 'Snapshot performance section exposes measurement schema');
  assert(snapshot.performance.measurementCount >= 4, 'Snapshot performance section converts entries into measurements');
  assert(snapshot.performance.measurements.some((measurement) => measurement.name === 'xtend.loader.manifest' && measurement.phase === 'load'), 'Snapshot captures loader manifest phase');
  assert(snapshot.performance.measurements.some((measurement) => measurement.name === 'xtend.component.hydrate' && measurement.phase === 'hydrate'), 'Snapshot captures component hydration phase');
  assert(snapshot.performance.measurements.some((measurement) => measurement.name === 'xtend.route.render' && measurement.phase === 'route'), 'Snapshot captures route render phase');
  assert(snapshot.performance.phaseSummary.load.measurementCount >= 1, 'Snapshot summarizes loader load phase');
  assert(snapshot.performance.phaseSummary.hydrate.measurementCount >= 1, 'Snapshot summarizes hydration phase');
  assert(snapshot.performance.phaseSummary.route.measurementCount >= 1, 'Snapshot summarizes route phase');

  const hydrationMeasurement = snapshot.performance.measurements.find((measurement) => (
    measurement.name === 'xtend.component.hydrate' && measurement.entryType === 'measure'
  ));
  assert(hydrationMeasurement.schema === CONTRACTS.performanceMeasurement, 'Hydration measurement carries stable schema');
  assert(hydrationMeasurement.budgetMs === 32, 'Hydration measurement carries initial budget');
  assert(hydrationMeasurement.status === 'warn', 'Hydration measurement classifies budget overshoot as warning');
  assert(hydrationMeasurement.sampleKind === 'telemetry', 'Hydration measurement defaults to telemetry sample kind');

  return context.result();
}

function printFabricPerformanceMeasurementReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Performance Measurements erfolgreich.',
    failureTitle: 'XTend-Fabric Performance Measurements fehlgeschlagen:'
  });
}

if (require.main === module) {
  runFabricPerformanceMeasurementSuite().then((result) => {
    printFabricPerformanceMeasurementReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  runFabricPerformanceMeasurementSuite,
  printFabricPerformanceMeasurementReport
};
