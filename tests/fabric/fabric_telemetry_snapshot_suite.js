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
  BACKPRESSURE_ACTION_BY_LEVEL,
  BACKPRESSURE_SCORE_THRESHOLDS,
  CONTRACTS,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 6, 14, 0, tick++));
}

function createFakePerformance() {
  const entries = {
    mark: [
      { name: 'xtend.loader.manifest.start', entryType: 'mark', startTime: 1, duration: 0 },
      { name: 'app.unrelated', entryType: 'mark', startTime: 2, duration: 0 }
    ],
    measure: [
      { name: 'xtend.component.hydrate', entryType: 'measure', startTime: 10, duration: 23.5 },
      { name: 'xtend.route.render', entryType: 'measure', startTime: 40, duration: 91.25 }
    ]
  };
  return {
    getEntriesByType(type) {
      return entries[type] ? entries[type].slice() : [];
    }
  };
}

function createFakeKernelPerformanceRuntime() {
  const runReport = {
    kind: 'rmt_performance_run_report',
    runId: 'fabric-kernel-performance',
    summary: {
      sampleCount: 1,
      violationCount: 1
    },
    snapshot: {
      budgets: []
    },
    renderPackages: [],
    roots: []
  };
  return {
    getSnapshot(reason) {
      return {
        runtimeKind: 'fabric-kernel-performance',
        reason,
        pressureLevel: 'high',
        budgetViolations: [{
          budgetId: 'command_turnaround',
          violations: ['duration_ms']
        }],
        backpressureProfile: {
          kind: 'rmt_backpressure_profile',
          pressureLevel: 'high',
          preferIdle: true
        }
      };
    },
    evaluateBudgets(reason) {
      return {
        runtimeKind: 'fabric-kernel-performance',
        reason,
        pressureLevel: 'high',
        totals: {
          sampleCount: 1,
          violationCount: 1
        },
        budgets: [{
          budgetId: 'command_turnaround',
          status: 'budget_miss'
        }],
        violations: [{
          budgetId: 'command_turnaround',
          endpointName: 'fabric.telemetry.snapshot',
          measurementPhase: 'cold',
          durationMs: 64,
          waitMs: 1,
          totalMs: 65,
          violations: ['duration_ms']
        }]
      };
    },
    getBackpressureProfile(reason) {
      return {
        kind: 'rmt_backpressure_profile',
        reason,
        pressureLevel: 'high',
        preferIdle: true,
        yieldActions: ['defer_lazy_hydration']
      };
    },
    exportRunReport() {
      return runReport;
    },
    createRunBaseline() {
      return {
        kind: 'rmt_performance_baseline',
        baselineId: 'fabric-kernel-performance-baseline',
        summary: {
          avgSampleCount: 1,
          avgViolationCount: 1
        }
      };
    },
    compareRunReportToBaseline() {
      return {
        kind: 'rmt_performance_baseline_comparison',
        summary: {
          violationCountDelta: 0
        }
      };
    },
    createCiSummary() {
      return {
        kind: 'rmt_performance_ci_summary',
        text: '# XTend Fabric Kernel Performance Summary\n\n- Violations: 1'
      };
    },
    createFileArtifact() {
      return {
        kind: 'rmt_performance_file_artifact',
        artifactId: 'fabric-kernel-performance-artifact',
        artifactType: 'run_report',
        fileName: 'xtend.fabric.kernel-performance.json',
        contentType: 'application/json',
        payload: runReport,
        text: JSON.stringify(runReport)
      };
    }
  };
}

function runFabricTelemetrySnapshotSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-telemetry-snapshot',
    label: 'XTend-Fabric telemetry snapshots and backpressure'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.telemetry-snapshot.v1', 'Fabric runtime declares telemetry snapshot contract');
  context.assertIncludes(source, 'xtend.fabric.backpressure-signal.v1', 'Fabric runtime declares backpressure signal contract');
  context.assertIncludes(source, 'xtend.performance.measurement.v1', 'Fabric runtime declares performance measurement contract');
  context.assertIncludes(source, 'createTelemetrySnapshot', 'Fabric runtime exposes telemetry snapshot factory');
  context.assertIncludes(source, 'publishTelemetrySnapshot', 'Fabric runtime exposes telemetry snapshot publisher');
  context.assertIncludes(source, 'createBackpressureSignal', 'Fabric runtime exposes backpressure signal factory');
  context.assertIncludes(source, 'recordSnapshotWithRmtBridge', 'Fabric runtime can forward snapshots into an RMT telemetry bridge');
  context.assertIncludes(source, 'xtend.fabric.rmt.telemetry.failed', 'Fabric runtime declares RMT telemetry forwarding diagnostic');
  context.assertIncludes(source, 'kernelPerformanceRuntime', 'Fabric runtime accepts injected Kernel Performance Runtime');
  context.assertIncludes(source, 'getBackpressureProfile', 'Fabric runtime reads Kernel backpressure profiles');
  context.assertIncludes(source, 'createCiSummary', 'Fabric runtime reads Kernel CI summaries');
  context.assertIncludes(source, 'createFileArtifact', 'Fabric runtime reads Kernel file artifacts');
  context.assertIncludes(source, 'BACKPRESSURE_SCORE_THRESHOLDS', 'Fabric runtime declares backpressure score thresholds');
  context.assertIncludes(source, 'xtend.fabric.telemetry.snapshot', 'Fabric runtime declares telemetry snapshot diagnostic');
  assert(!source.includes("require('../../xtendrmt") && !source.includes('rmt-runtime.esm'), 'Telemetry snapshots do not import the RMT runtime');

  assert(CONTRACTS.telemetrySnapshot === 'xtend.fabric.telemetry-snapshot.v1', 'Fabric exports telemetry snapshot contract');
  assert(CONTRACTS.backpressureSignal === 'xtend.fabric.backpressure-signal.v1', 'Fabric exports backpressure signal contract');
  assert(CONTRACTS.performanceMeasurement === 'xtend.performance.measurement.v1', 'Fabric exports performance measurement contract');
  assert(BACKPRESSURE_SCORE_THRESHOLDS.high === 7, 'Fabric exports high backpressure threshold');
  assert(BACKPRESSURE_ACTION_BY_LEVEL.critical === 'protect-user-blocking-work', 'Fabric exports critical backpressure action');

  const fabric = createXtendFabric({
    idPrefix: 'telemetry.fabric',
    now: createIncrementingClock()
  });
  const reporterEvents = [];
  fabric.registerReporter(fabric.createTestReporter({
    id: 'telemetry-reporter',
    events: reporterEvents,
    minimumLevel: 'info'
  }));

  assert(typeof fabric.createTelemetrySnapshot === 'function', 'Fabric instance exposes createTelemetrySnapshot');
  assert(typeof fabric.publishTelemetrySnapshot === 'function', 'Fabric instance exposes publishTelemetrySnapshot');
  assert(typeof fabric.exportTelemetrySnapshot === 'function', 'Fabric instance exposes exportTelemetrySnapshot alias');
  assert(typeof fabric.createBackpressureSignal === 'function', 'Fabric instance exposes createBackpressureSignal');

  const componentFibers = fabric.createComponentFiberInstrumentation('x-alert', {
    correlationId: 'route.alerts'
  });
  componentFibers.hydrate(() => 'hydrated', {
    deadlineMs: 1,
    metadata: {
      token: 'hidden'
    }
  });

  const routeFibers = fabric.createRouteFiberInstrumentation('xtend.xrouter', {
    correlationId: 'route.settings'
  });
  let renderFailed = false;
  try {
    routeFibers.render(() => {
      throw new Error('render pressure');
    }, {
      routeRef: '/settings',
      deadlineMs: 1,
      backpressureSignal: {
        level: 'high',
        reason: 'route-pressure',
        metadata: {
          authorization: 'secret'
        }
      }
    });
  } catch (_) {
    renderFailed = true;
  }
  assert(renderFailed, 'Route render pressure fixture throws as expected');

  const runtimeBridge = fabric.createRuntimeDiagnosticsBridge({
    id: 'telemetry.bridge'
  });
  runtimeBridge.connectApi({
    compliance: {
      version: '2026-05-06',
      getCoreContracts() {
        return { runtime: ['fabric', 'xstate'] };
      },
      getChecklist() {
        return ['Telemetry snapshot gate'];
      }
    }
  });

  const explicitSignal = fabric.createBackpressureSignal({
    lane: 'idle',
    score: 3,
    reason: 'queue-depth',
    metadata: {
      token: 'secret'
    }
  });
  assert(explicitSignal.schema === CONTRACTS.backpressureSignal, 'Backpressure signal carries stable schema');
  assert(explicitSignal.metadata.token === '[redacted]', 'Backpressure signal metadata is redacted');

  const rmtTelemetryRecords = [];
  const rmtBridge = {
    recordTelemetrySnapshot(snapshotRecord, recordOptions) {
      rmtTelemetryRecords.push({ snapshot: snapshotRecord, options: recordOptions });
      return { ok: true, status: 'ok' };
    }
  };

  const snapshot = fabric.createTelemetrySnapshot({
    id: 'telemetry.snapshot.test',
    correlationId: 'route.settings',
    performance: createFakePerformance(),
    kernelPerformanceRuntime: createFakeKernelPerformanceRuntime(),
    runtimeBridge,
    rmtBridge,
    scheduleRef: 'diagnostics.snapshot',
    backpressureSignals: [explicitSignal],
    metadata: {
      token: 'secret',
      safe: 'visible'
    }
  });

  assert(snapshot.schema === CONTRACTS.telemetrySnapshot, 'Telemetry snapshot carries stable schema');
  assert(snapshot.id === 'telemetry.snapshot.test', 'Telemetry snapshot preserves explicit id');
  assert(snapshot.metadata.token === '[redacted]', 'Telemetry snapshot metadata is redacted');
  assert(snapshot.metadata.safe === 'visible', 'Telemetry snapshot metadata preserves safe values');
  assert(snapshot.fiberCount === fabric.getFibers().length, 'Telemetry snapshot counts Fabric fibers');
  assert(snapshot.diagnosticCount === fabric.getDiagnostics().length, 'Telemetry snapshot counts Fabric diagnostics');
  assert(snapshot.totals.failedCount >= 1, 'Telemetry snapshot totals failed fibers');
  assert(snapshot.totals.budgetMissCount >= 2, 'Telemetry snapshot totals budget misses');
  assert(snapshot.lanes.idle.fiberCount >= 1, 'Telemetry snapshot aggregates idle lane');
  assert(snapshot.lanes.transition.failedCount >= 1, 'Telemetry snapshot aggregates transition failures');
  assert(snapshot.lanes.transition.scheduleRefs.includes('route.transition.render'), 'Telemetry snapshot preserves route schedule refs');
  assert(snapshot.backpressure.schema === CONTRACTS.backpressureSignal, 'Backpressure summary carries stable schema');
  assert(snapshot.backpressure.level === 'critical' || snapshot.backpressure.level === 'high', 'Backpressure summary escalates pressure level');
  assert(snapshot.backpressure.action === 'protect-user-blocking-work' || snapshot.backpressure.action === 'defer-background-work', 'Backpressure summary exposes scheduler action');
  assert(snapshot.backpressure.byLane.idle.signalCount >= 1, 'Backpressure summary groups idle lane signals');
  assert(snapshot.backpressure.signals.some((signal) => signal.reason === 'route-pressure'), 'Backpressure summary includes explicit route signal');
  assert(snapshot.performance.supported === true, 'Telemetry snapshot reads performance runtime');
  assert(snapshot.performance.entryCount === 3, 'Telemetry snapshot filters XTend performance entries');
  assert(snapshot.performance.measurementSchema === CONTRACTS.performanceMeasurement, 'Telemetry snapshot exposes performance measurement schema');
  assert(snapshot.performance.measurementCount === 3, 'Telemetry snapshot normalizes performance measurements');
  assert(snapshot.performance.entries.some((entry) => entry.name === 'xtend.route.render'), 'Telemetry snapshot includes route render performance entry');
  assert(snapshot.performance.phaseSummary.route.measurementCount >= 1, 'Telemetry snapshot summarizes route performance phase');
  assert(snapshot.performance.phaseSummary.hydrate.measurementCount >= 1, 'Telemetry snapshot summarizes hydration performance phase');
  assert(snapshot.performance.kernelRuntime && snapshot.performance.kernelRuntime.supported === true, 'Telemetry snapshot includes Kernel Performance Runtime support');
  assert(snapshot.performance.kernelSnapshot && snapshot.performance.kernelSnapshot.runtimeKind === 'fabric-kernel-performance', 'Telemetry snapshot includes Kernel Performance Snapshot');
  assert(snapshot.performance.budgetSnapshot && snapshot.performance.budgetSnapshot.violations[0].budgetId === 'command_turnaround', 'Telemetry snapshot includes Kernel budget snapshot');
  assert(snapshot.performance.backpressureProfile && snapshot.performance.backpressureProfile.kind === 'rmt_backpressure_profile', 'Telemetry snapshot includes Kernel backpressure profile');
  assert(snapshot.performance.ciSummary && snapshot.performance.ciSummary.kind === 'rmt_performance_ci_summary', 'Telemetry snapshot includes Kernel CI summary');
  assert(snapshot.performance.fileArtifact && snapshot.performance.fileArtifact.artifactType === 'run_report', 'Telemetry snapshot includes Kernel performance file artifact');
  assert(snapshot.performance.baselineComparison && snapshot.performance.baselineComparison.kind === 'rmt_performance_baseline_comparison', 'Telemetry snapshot includes Kernel baseline comparison');
  assert(snapshot.runtime && snapshot.runtime.schema === CONTRACTS.runtimeDiagnosticsBridge, 'Telemetry snapshot includes runtime bridge snapshot');
  assert(rmtTelemetryRecords.length === 1, 'Telemetry snapshot forwards into an injected RMT telemetry bridge');
  assert(rmtTelemetryRecords[0].snapshot.id === 'telemetry.snapshot.test', 'RMT telemetry bridge receives the Fabric snapshot');
  assert(rmtTelemetryRecords[0].options.scheduleRef === 'diagnostics.snapshot', 'RMT telemetry bridge receives the diagnostics schedule ref');
  assert(rmtTelemetryRecords[0].options.endpointName === 'xtendrmt.diagnostics.snapshot', 'RMT telemetry bridge receives the diagnostics endpoint hint');

  const diagnostic = fabric.publishTelemetrySnapshot(snapshot);
  assert(diagnostic.code === 'xtend.fabric.telemetry.snapshot', 'Telemetry snapshot publisher emits stable diagnostic');
  assert(diagnostic.lane === 'diagnostics', 'Telemetry snapshot publisher uses diagnostics lane');
  assert(reporterEvents.some((event) => event.code === 'xtend.fabric.telemetry.snapshot'), 'Telemetry snapshot reaches opt-in reporter');
  const reporterSnapshot = reporterEvents.find((event) => event.code === 'xtend.fabric.telemetry.snapshot').metadata.telemetrySnapshot;
  assert(reporterSnapshot.metadata.token === '[redacted]', 'Reporter snapshot metadata remains redacted');

  runtimeBridge.dispose();

  return context.result();
}

function printFabricTelemetrySnapshotReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Telemetry Snapshot erfolgreich.',
    failureTitle: 'XTend-Fabric Telemetry Snapshot fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFabricTelemetrySnapshotSuite();
  printFabricTelemetrySnapshotReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  runFabricTelemetrySnapshotSuite,
  printFabricTelemetrySnapshotReport
};
