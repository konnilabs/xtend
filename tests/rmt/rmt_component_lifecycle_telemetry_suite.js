const vm = require('vm');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  CONTRACTS,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

const LIFECYCLE_TELEMETRY_SCHEMA = 'xtend.component.lifecycle-telemetry.v1';
const WORKPACKAGE_PATH = 'development/WP-E10-06-Telemetry-API-Anschluss-fuer-Component-Lifecycle-standardisieren.md';
const CONTRACT_PATH = 'development/XTend-Component-Lifecycle-Telemetry-Contract.md';
const FIXTURE_PATH = 'tests/fixtures/rmt-first-class-xtend-app.rmt';

function createFakeElement(tagName) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    attributes: {},
    children: [],
    listeners: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    addEventListener(eventName, handler, options) {
      this.listeners[eventName] = { handler, options };
    },
    querySelector(selector) {
      if (selector.startsWith('[data-rmt-component-id=')) {
        const componentId = selector.match(/"([^"]+)"/);
        return this.children.find((child) => child.attributes && child.attributes['data-rmt-component-id'] === (componentId && componentId[1])) || null;
      }
      return this.children.find((child) => child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()) || null;
    },
    hydrate(model, details) {
      this.hydrateCall = { model, details };
    }
  };
}

function createFakeDocument() {
  return {
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    createTextNode(text) {
      return { textContent: String(text) };
    }
  };
}

function createRuntimeModules(context, rootDir, artifactPath) {
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = artifactPath.endsWith('.esm.js')
    ? source
      .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/^\s*import\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
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
    navigator: { userAgent: 'xtend-component-lifecycle-telemetry-test' },
    CustomEvent,
    document: createFakeDocument()
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, { filename: artifactPath });
  } catch (error) {
    context.fail(`${artifactPath} evaluates for Component Lifecycle Telemetry (${error.message})`);
    return null;
  }
  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules.createRmtXtendComponentAdapter === 'function', `${artifactPath} exposes createRmtXtendComponentAdapter`)) {
    return null;
  }
  return sandbox.AppModules;
}

function createCanonicalStateTelemetryModules(context, rootDir) {
  const sourcePath = 'xtendrmt/kernel/modules/rmt-state-telemetry-adapter.js';
  const sandbox = { AppModules: {} };
  sandbox.__XTENDRMT_GLOBAL__ = sandbox;
  try {
    vm.runInNewContext(readText(sourcePath, rootDir), sandbox, { filename: sourcePath });
  } catch (error) {
    context.fail(`Canonical State Telemetry Adapter evaluates for telemetry probe (${error.message})`);
    return null;
  }
  context.assert(
    typeof sandbox.AppModules.createRmtStateSchedulerDiagnosticsBridge === 'function',
    'Canonical State Telemetry Adapter exposes its bridge factory for telemetry projection'
  );
  return sandbox.AppModules;
}

function createAdapterFixture(context, rootDir, artifactPath) {
  const modules = createRuntimeModules(context, rootDir, artifactPath);
  if (!modules) return null;
  const fixture = readJson(FIXTURE_PATH, rootDir);
  const format = modules.createRmtFormat();
  const registry = format.createRuntimeRegistries(fixture);
  const fakeDocument = createFakeDocument();
  const fakeRoot = createFakeElement('main');
  fakeRoot.ownerDocument = fakeDocument;
  const telemetryCollector = [];
  let nowTick = 0;
  const adapter = modules.createRmtXtendComponentAdapter({
    document: fakeDocument,
    telemetryCollector,
    now() {
      nowTick += 7;
      return nowTick;
    },
    customElements: {
      get(tagName) {
        return tagName ? function XtendComponent() {} : undefined;
      }
    }
  });
  const mapping = adapter.mapComponents(registry, {
    schedules: fixture.schedules
  });
  return { adapter, fakeRoot, fixture, mapping, telemetryCollector };
}

function assertRuntimeArtifact(context, rootDir, artifactPath) {
  const fixture = createAdapterFixture(context, rootDir, artifactPath);
  if (!fixture) return;
  const { adapter, fakeRoot, mapping, telemetryCollector } = fixture;

  context.assert(adapter.runtimeSurface.includes('recordComponentTelemetry'), `${artifactPath}: adapter exposes recordComponentTelemetry`);
  context.assert(adapter.capabilities.providedCapabilities.includes('componentTelemetry'), `${artifactPath}: adapter exposes componentTelemetry capability`);
  context.assert(adapter.definition.metadata.componentLifecycleTelemetry === LIFECYCLE_TELEMETRY_SCHEMA, `${artifactPath}: adapter definition exposes Lifecycle Telemetry schema`);

  const mountResult = adapter.mountComponent(fakeRoot, 'dashboard.health', {}, { mapping });
  context.assert(mountResult.metadata.telemetry.schema === LIFECYCLE_TELEMETRY_SCHEMA, `${artifactPath}: mount result carries telemetry record`);
  context.assert(mountResult.metadata.telemetry.operation === 'mount', `${artifactPath}: mount telemetry normalizes operation`);
  context.assert(mountResult.metadata.telemetry.componentId === 'dashboard.health', `${artifactPath}: mount telemetry preserves component id`);
  context.assert(mountResult.metadata.telemetry.scheduleRef === 'component.visible.mount', `${artifactPath}: mount telemetry preserves schedule ref`);
  context.assert(mountResult.metadata.telemetry.fabricLane === 'visible', `${artifactPath}: mount telemetry preserves Fabric lane`);
  context.assert(telemetryCollector.some((record) => record.operation === 'mount'), `${artifactPath}: mount telemetry reaches collector`);

  const mountedElement = fakeRoot.children[0];
  const applicationBindings = mountResult.handle && mountResult.handle.applicationBindings;
  context.assert(
    Array.isArray(applicationBindings)
      && applicationBindings.some((binding) => (
        binding.target === mountedElement
          && binding.event === 'alert-dismissed'
          && binding.command
      )),
    `${artifactPath}: component mount hands validated application bindings to the Event Router`
  );
  context.assert(
    mountedElement && !mountedElement.listeners['alert-dismissed'],
    `${artifactPath}: component adapter does not install application listeners`
  );
  adapter.recordComponentTelemetry({
    componentId: 'dashboard.health',
    operation: 'event',
    status: 'ok',
    fabricContext: mountResult.metadata.fabric,
    metadata: { eventName: 'alert-dismissed', routeOwner: 'event-router' }
  }, { mapping });
  context.assert(telemetryCollector.some((record) => record.operation === 'event' && record.metadata.eventName === 'alert-dismissed'), `${artifactPath}: event telemetry reaches collector`);

  const manualResult = adapter.recordComponentTelemetry({
    componentId: 'dashboard.health',
    operation: 'render',
    status: 'failed',
    durationMs: 640,
    fabricContext: mountResult.metadata.fabric,
    backpressureSignal: {
      level: 'high',
      reason: 'render-pressure',
      metadata: {
        token: 'secret'
      }
    },
    metadata: {
      routeRef: 'dashboard',
      correlationId: 'route.dashboard'
    }
  }, { mapping });
  context.assert(manualResult.metadata.telemetry.operation === 'render', `${artifactPath}: manual render telemetry is normalized`);
  context.assert(manualResult.metadata.telemetry.status === 'failed', `${artifactPath}: manual telemetry preserves failed status`);
  context.assert(telemetryCollector.some((record) => record.operation === 'render' && record.status === 'failed'), `${artifactPath}: manual telemetry reaches collector`);

  const fabric = createXtendFabric({
    idPrefix: 'component.lifecycle.telemetry',
    now: () => new Date(Date.UTC(2026, 4, 7, 10, 0, 0))
  });
  const snapshot = fabric.createTelemetrySnapshot({
    componentTelemetry: telemetryCollector,
    correlationId: 'route.dashboard',
    prewarmWorkerTopology: {
      schema: 'xtend.rmt.prewarm-worker-topology.v1',
      kind: 'rmt-prewarm',
      enabled: true,
      health: 'degraded',
      status: 'degraded',
      workerName: 'XTendRMTPrewarmWorker',
      workerType: 'classic',
      instantiated: false,
      pendingJobs: 2,
      submittedJobs: 7,
      templatesSynced: 3,
      available: false,
      missingApis: ['Worker'],
      lastHealthAt: 0,
      lastError: null,
      responsibilities: ['template_prerender_compute', 'chunk_serialization'],
      supportedSignals: ['start', 'continue', 'rebatch'],
      excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership']
    }
  });
  context.assert(snapshot.componentTelemetry.schema === LIFECYCLE_TELEMETRY_SCHEMA, `${artifactPath}: Fabric snapshot exposes component telemetry schema`);
  context.assert(snapshot.componentTelemetry.recordCount >= 3, `${artifactPath}: Fabric snapshot counts component lifecycle records`);
  context.assert(snapshot.componentTelemetry.operations.mount.recordCount >= 1, `${artifactPath}: Fabric snapshot aggregates mount operations`);
  context.assert(snapshot.componentTelemetry.operations.event.recordCount >= 1, `${artifactPath}: Fabric snapshot aggregates event operations`);
  context.assert(snapshot.componentTelemetry.operations.render.failedCount >= 1, `${artifactPath}: Fabric snapshot aggregates failed render operations`);
  context.assert(snapshot.componentTelemetry.components['dashboard.health'].recordCount >= 3, `${artifactPath}: Fabric snapshot aggregates per component`);
  context.assert(snapshot.componentTelemetry.lanes.visible.recordCount >= 1, `${artifactPath}: Fabric snapshot aggregates per lane`);
  context.assert(snapshot.backpressure.signalCount >= 1, `${artifactPath}: Component telemetry contributes to backpressure signals`);
  context.assert(snapshot.backpressure.signals.some((signal) => signal.reason === 'render-pressure'), `${artifactPath}: explicit component backpressure signal is preserved`);
  context.assert(snapshot.backpressure.signals.some((signal) => signal.metadata.token === '[redacted]'), `${artifactPath}: component backpressure metadata is redacted`);
  context.assert(snapshot.prewarmWorker.schema === 'xtend.rmt.prewarm-worker-topology.v1', `${artifactPath}: Fabric snapshot exposes Prewarm Worker topology schema`);
  context.assert(snapshot.prewarmWorker.pendingJobs === 2 && snapshot.prewarmWorker.submittedJobs === 7, `${artifactPath}: Fabric snapshot preserves Prewarm Worker counters`);
  context.assert(snapshot.prewarmWorker.excludedResponsibilities.includes('dom_mutation'), `${artifactPath}: Fabric snapshot preserves no-DOM-ownership contract`);

  const fabricStore = createXtendFabric({
    idPrefix: 'component.lifecycle.store',
    now: () => new Date(Date.UTC(2026, 4, 7, 11, 0, 0))
  });
  const storeRoot = createFakeElement('main');
  storeRoot.ownerDocument = createFakeDocument();
  adapter.mountComponent(storeRoot, 'pages.dashboard', {}, {
    mapping,
    fabric: fabricStore
  });
  context.assert(fabricStore.getComponentTelemetry().some((record) => record.componentId === 'pages.dashboard'), `${artifactPath}: Fabric instance ingests adapter component telemetry`);
  const storeSnapshot = fabricStore.createTelemetrySnapshot();
  context.assert(storeSnapshot.componentTelemetry.recordCount >= 1, `${artifactPath}: Fabric snapshot can read stored component telemetry without explicit option`);
  const runtimeDrivenSnapshot = fabricStore.createTelemetrySnapshot({
    enablePrewarmWorker: true,
    kernelRuntime: {
      getPrewarmWorkerTopology() {
        return {
          schema: 'xtend.rmt.prewarm-worker-topology.v1',
          kind: 'rmt-prewarm',
          enabled: true,
          health: 'degraded',
          status: 'degraded',
          workerName: 'XTendRMTPrewarmWorker',
          workerType: 'classic',
          instantiated: false,
          pendingJobs: 0,
          submittedJobs: 0,
          templatesSynced: 0,
          available: false,
          missingApis: ['Blob', 'Worker', 'URL.createObjectURL'],
          lastHealthAt: 0,
          lastError: null,
          responsibilities: ['template_prerender_compute', 'chunk_serialization'],
          supportedSignals: ['start', 'continue', 'rebatch'],
          excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership']
        };
      }
    }
  });
  context.assert(runtimeDrivenSnapshot.prewarmWorker.missingApis.includes('Worker'), `${artifactPath}: Fabric snapshot reads runtime Prewarm Worker missing APIs`);
}

function assertTelemetryBridgeEndToEnd(context, rootDir) {
  const modules = createRuntimeModules(context, rootDir, 'xtendrmt/rmt-runtime.esm.js');
  if (!modules || typeof modules.createRmtStateSchedulerDiagnosticsBridge !== 'function') return;
  const canonicalModules = createCanonicalStateTelemetryModules(context, rootDir);
  if (!canonicalModules) return;

  const stateValues = {};
  const schedulerPressureSamples = [];
  const scheduledEndpoints = [];
  const bridge = canonicalModules.createRmtStateSchedulerDiagnosticsBridge({
    stateProjectionPort: {
      batchUpdate(updates) {
        Object.assign(stateValues, updates);
      },
      get() {
        throw new Error('State Projection Ports are output-only and must never be read as model authority.');
      }
    },
    scheduler: {
      scheduleEndpoint(endpointName, scope, callback, options = {}) {
        scheduledEndpoints.push({ endpointName, scope, options });
        return typeof callback === 'function'
          ? callback({ endpointName, scope, options })
          : { endpointName, scope };
      },
      reportPerformanceSample(sample) {
        schedulerPressureSamples.push(sample);
        return {
          pressureLevel: sample.longTask === true ? 'critical' : 'constrained',
          performance: {
            sampleCount: schedulerPressureSamples.length
          }
        };
      }
    },
    schedules: [{
      id: 'diagnostics.snapshot',
      endpointName: 'xtendrmt.diagnostics.snapshot',
      scope: 'rmt.telemetry.snapshot',
      lane: 'diagnostics',
      budgetClass: 'diagnostics',
      deadlineMs: 64
    }]
  });

  const fabric = createXtendFabric({
    idPrefix: 'telemetry.e2e',
    now: () => new Date(Date.UTC(2026, 5, 18, 12, 0, 0))
  });
  fabric.recordComponentTelemetry({
    schema: LIFECYCLE_TELEMETRY_SCHEMA,
    componentId: 'surface.chat',
    operation: 'hydrate',
    status: 'degraded',
    durationMs: 48,
    scheduleRef: 'component.visible.hydrate',
    fabricLane: 'visible',
    backpressureSignal: {
      schema: 'xtend.fabric.backpressure-signal.v1',
      level: 'high',
      score: 8,
      action: 'defer-background-work',
      lane: 'idle',
      reason: 'ui-hydration-pressure',
      componentRef: 'surface.chat',
      metadata: {
        token: 'secret'
      }
    },
    metadata: {
      routeRef: 'chat',
      correlationId: 'chat.telemetry.e2e'
    }
  });

  const snapshot = fabric.createTelemetrySnapshot({
    id: 'telemetry.e2e.snapshot',
    correlationId: 'chat.telemetry.e2e',
    componentTelemetry: fabric.getComponentTelemetry(),
    rmtBridge: bridge,
    scheduleRef: 'diagnostics.snapshot',
    metadata: {
      activeRoute: 'chat',
      token: 'secret'
    }
  });

  context.assert(snapshot.componentTelemetry.recordCount === 1, 'Telemetry E2E snapshot carries component lifecycle telemetry');
  context.assert(snapshot.backpressure.signals.some((signal) => signal.reason === 'ui-hydration-pressure'), 'Telemetry E2E Fabric snapshot aggregates component backpressure');
  context.assert(bridge.listTelemetrySnapshots().some((record) => record.id === 'telemetry.e2e.snapshot'), 'Telemetry E2E RMT bridge lists received snapshots');
  context.assert(bridge.listTelemetrySnapshots()[0].metadata.token === '[redacted]', 'Telemetry E2E RMT bridge redacts snapshot metadata');
  context.assert(bridge.listBackpressureSignals().some((record) => (
    record.schedulerPressureSampled === true
    && Array.isArray(record.signals)
    && record.signals.some((signal) => signal.reason === 'ui-hydration-pressure')
  )), 'Telemetry E2E RMT bridge lists scheduler-coupled backpressure');
  context.assert(schedulerPressureSamples.some((sample) => sample.source === 'rmt.bridge.fabric-backpressure' && sample.lane === 'idle_maintenance'), 'Telemetry E2E scheduler receives Fabric pressure sample');
  context.assert(scheduledEndpoints.some((entry) => entry.endpointName === 'xtendrmt.diagnostics.snapshot'), 'Telemetry E2E diagnostics endpoint is scheduled');
  context.assert(stateValues['rmt.telemetry.lastSnapshot'] && stateValues['rmt.telemetry.lastSnapshot'].id === 'telemetry.e2e.snapshot', 'Telemetry E2E state mirror exposes last snapshot');
  context.assert(stateValues['rmt.backpressure.lastYieldHint'] && stateValues['rmt.backpressure.lastYieldHint'].schedulerPressureLevel === 'constrained', 'Telemetry E2E state mirror exposes scheduler yield hint');
  const debugSnapshot = bridge.getTelemetryDebugSnapshot();
  context.assert(debugSnapshot.schema === 'xtend.rmt.telemetry-debug-snapshot.v1', 'Telemetry E2E dev API exposes debug snapshot schema');
  context.assert(debugSnapshot.telemetrySnapshotCount === 1 && debugSnapshot.backpressureSignalCount >= 1, 'Telemetry E2E dev API exposes usable record counts');
}

function assertAppRuntimePerformanceDevApi(context, rootDir) {
  const artifactPath = 'xtendrmt/rmt-app-runtime.js';
  const source = readText(artifactPath, rootDir);
  const runtimeSource = `${source
    .replace(/^export const ([A-Za-z0-9_$]+) =/gmu, 'const $1 =')
    .replace(/^export default __XTEND_RMT_APP_RUNTIME_API__;\s*$/mu, '')}\nthis.XTendRmtAppRuntime = __XTEND_RMT_APP_RUNTIME_API__;`;
  const sandbox = {
    console,
    setTimeout,
    clearTimeout
  };
  sandbox.globalThis = sandbox;

  try {
    vm.runInNewContext(runtimeSource, sandbox, { filename: artifactPath });
  } catch (error) {
    context.fail(`${artifactPath} evaluates for Performance Telemetry Dev API (${error.message})`);
    return;
  }

  const modules = sandbox.XTendRmtAppRuntime;
  if (!context.assert(modules && typeof modules.createRmtAppRuntime === 'function', `${artifactPath}: exposes createRmtAppRuntime`)) return;
  const emittedDiagnostics = [];
  const schedulerPressureSamples = [];
  const appRuntime = modules.createRmtAppRuntime({
    initialState: {
      transcript: ''
    },
    scheduler: {
      reportPerformanceSample(sample) {
        schedulerPressureSamples.push(sample);
        return {
          pressureLevel: sample.longTask === true ? 'critical' : 'constrained',
          action: sample.pressureLevel === 'critical' ? 'protect-visible-work' : 'defer-idle-work',
          performance: {
            sampleCount: schedulerPressureSamples.length
          }
        };
      }
    },
    fabric: {
      createBackpressureSignal(input = {}) {
        return {
          schema: CONTRACTS.backpressureSignal,
          level: 'high',
          score: 9,
          action: 'defer-background-work',
          ...input
        };
      },
      emitDiagnostic(diagnostic) {
        emittedDiagnostics.push(diagnostic);
        return diagnostic;
      }
    }
  });

  appRuntime.applyStreamPatch({
    type: 'delta',
    streamId: 'llm.chat',
    target: 'transcript',
    correlationId: 'chat.telemetry.e2e',
    delta: 'hello'
  });
  for (let index = 0; index < 8; index += 1) {
    appRuntime.applyStreamPatch({
      type: 'delta',
      streamId: 'llm.chat',
      target: 'transcript',
      correlationId: 'chat.telemetry.e2e',
      delta: `-${index}`
    });
  }
  appRuntime.applyStreamPatch({
    type: 'error',
    streamId: 'llm.chat',
    target: 'transcript',
    correlationId: 'chat.telemetry.e2e',
    error: {
      message: 'stream pressure smoke'
    }
  });
  const snapshot = appRuntime.getPerformanceTelemetrySnapshot();
  context.assert(typeof appRuntime.getPerformanceTelemetrySnapshot === 'function', `${artifactPath}: app runtime exposes performance telemetry dev API`);
  context.assert(snapshot.schema === 'xtend.rmt.app-runtime-performance-telemetry.v1', `${artifactPath}: performance telemetry snapshot schema is stable`);
  context.assert(snapshot.streamPatchCount === 10 && snapshot.streamCount === 1, `${artifactPath}: performance telemetry snapshot exposes stream counters`);
  context.assert(snapshot.backpressureSignalCount >= 1, `${artifactPath}: performance telemetry snapshot exposes backpressure signal count`);
  context.assert(snapshot.backpressureSignals.some((signal) => signal.reason === 'stream-delta'), `${artifactPath}: performance telemetry snapshot exposes stream-delta backpressure`);
  context.assert(typeof appRuntime.listStreamPressureRecords === 'function', `${artifactPath}: app runtime exposes stream pressure record dev API`);
  context.assert(typeof appRuntime.listYieldActions === 'function', `${artifactPath}: app runtime exposes yield action dev API`);
  context.assert(snapshot.streamPressureRecordCount === snapshot.streamPatchCount, `${artifactPath}: performance telemetry snapshot mirrors stream pressure records`);
  context.assert(snapshot.highestStreamPressureLevel === 'critical', `${artifactPath}: performance telemetry captures critical stream pressure`);
  context.assert(snapshot.yieldActionCount >= 1, `${artifactPath}: performance telemetry exposes yield actions`);
  context.assert(snapshot.yieldActions.some((action) => action.action === 'protect-visible-work' || action.reason === 'stream-error'), `${artifactPath}: yield actions protect visible work under critical pressure`);
  context.assert(snapshot.schedulerSampleCount === snapshot.streamPressureRecordCount, `${artifactPath}: stream pressure is mirrored into scheduler samples`);
  context.assert(schedulerPressureSamples.some((sample) => sample.source === 'rmt.app_runtime.stream-pressure' && sample.lane === 'idle_maintenance'), `${artifactPath}: scheduler receives stream pressure performance samples`);
  context.assert(snapshot.schedulerPressureSamples.some((sample) => sample.terminal === true && sample.patchType === 'error'), `${artifactPath}: terminal stream lifecycle is mirrored as a scheduler sample`);
  context.assert(snapshot.streams.some((stream) => stream.streamId === 'llm.chat' && stream.status === 'error'), `${artifactPath}: stream lifecycle snapshot preserves terminal error state`);
  context.assert(emittedDiagnostics.some((diagnostic) => diagnostic.code === 'rmt.stream.patch'), `${artifactPath}: Fabric still receives stream diagnostics`);

  const streamPressureFabric = createXtendFabric({
    idPrefix: 'app.runtime.stream.pressure',
    now: () => new Date(Date.UTC(2026, 5, 18, 13, 0, 0))
  });
  const streamPressureSnapshot = streamPressureFabric.createTelemetrySnapshot({
    appRuntime,
    correlationId: 'chat.telemetry.e2e'
  });
  context.assert(streamPressureSnapshot.streamPressure.schema === CONTRACTS.streamPressure, `${artifactPath}: Fabric snapshot exposes stream pressure schema`);
  context.assert(streamPressureSnapshot.streamPressure.recordCount === snapshot.streamPressureRecordCount, `${artifactPath}: Fabric snapshot consumes App Runtime stream pressure records`);
  context.assert(streamPressureSnapshot.streamPressure.yieldActionCount === snapshot.yieldActionCount, `${artifactPath}: Fabric snapshot consumes App Runtime yield actions`);
  context.assert(streamPressureSnapshot.backpressure.signals.some((signal) => signal.reason === 'stream-terminal'), `${artifactPath}: Fabric backpressure summary includes terminal stream pressure`);

  const panicAppRuntime = modules.createRmtAppRuntime({
    kernelRuntime: {
      listPanicRecoveryRecords() {
        return [{
          schema: 'xtend.rmt.kernel-panic-recovery-record.v1',
          kind: 'safeSnapshot',
          lane: 'diagnostics',
          status: 'captured',
          scope: 'surface.chat',
          record: {
            schema: 'xtend.rmt.kernel-safe-snapshot.v1',
            scope: 'surface.chat'
          }
        }];
      },
      getPanicRecoverySnapshot() {
        return {
          schema: 'xtend.rmt.kernel-panic-recovery-snapshot.v1',
          safeSnapshotCount: 1,
          quarantineScopes: ['surface.chat']
        };
      }
    },
    fabric: {
      getKernelPanicRecoveryRecords() {
        return [{
          schema: CONTRACTS.kernelPanicRecovery,
          kind: 'recoveryOutcome',
          lane: 'diagnostics',
          status: 'recovered',
          scope: 'surface.chat',
          quarantineScope: 'surface.chat',
          record: {
            schema: 'xtend.rmt.kernel-recovery-outcome.v1',
            status: 'recovered',
            scope: 'surface.chat'
          }
        }];
      },
      getPanicRecoverySnapshot() {
        return {
          schema: CONTRACTS.kernelPanicRecovery,
          recoveryOutcomeCount: 1,
          quarantineScopes: ['surface.chat']
        };
      }
    }
  });
  const panicSnapshot = panicAppRuntime.getPanicRecoverySnapshot();
  context.assert(typeof panicAppRuntime.listPanicRecoveryRecords === 'function', `${artifactPath}: app runtime exposes Panic/Recovery record dev API`);
  context.assert(panicSnapshot.schema === 'xtend.rmt.app-runtime-panic-recovery-snapshot.v1', `${artifactPath}: Panic/Recovery snapshot schema is stable`);
  context.assert(panicSnapshot.recordCount === 2, `${artifactPath}: Panic/Recovery snapshot merges kernel and Fabric records`);
  context.assert(panicSnapshot.kernel && panicSnapshot.kernel.safeSnapshotCount === 1, `${artifactPath}: Panic/Recovery snapshot exposes kernel Safe Snapshot counters`);
  context.assert(panicSnapshot.fabric && panicSnapshot.fabric.recoveryOutcomeCount === 1, `${artifactPath}: Panic/Recovery snapshot exposes Fabric Recovery counters`);
  context.assert(panicAppRuntime.listPanicRecoveryRecords().some((record) => record.kind === 'safeSnapshot'), `${artifactPath}: Panic/Recovery record API lists Safe Snapshots`);
}

function runRmtComponentLifecycleTelemetrySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-component-lifecycle-telemetry',
    label: 'RMT XTend component lifecycle telemetry'
  });
  const contract = readText(CONTRACT_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const fabricSource = readText('fabric/xtend-fabric.js', rootDir);
  const runtimeSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const browserSource = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const appRuntimeSource = readText('xtendrmt/rmt-app-runtime.js', rootDir);
  const typesSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const appRuntimeTypesSource = readText('xtendrmt/rmt-app-runtime.d.ts', rootDir);
  const schemaSource = readText('xtendrmt/rmt.schema.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLifecycleTelemetry;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);

  context.assert(CONTRACTS.componentLifecycleTelemetry === LIFECYCLE_TELEMETRY_SCHEMA, 'Fabric exports Component Lifecycle Telemetry contract');
  context.assertIncludes(contract, LIFECYCLE_TELEMETRY_SCHEMA, 'Lifecycle Telemetry contract declares stable schema');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Lifecycle Telemetry contract keeps RMT boundary visible');
  context.assertIncludes(contract, 'mount', 'Lifecycle Telemetry contract documents mount operation');
  context.assertIncludes(contract, 'hydrate', 'Lifecycle Telemetry contract documents hydrate operation');
  context.assertIncludes(contract, 'event', 'Lifecycle Telemetry contract documents event operation');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-06 is completed');
  context.assertIncludes(workpackage, 'xtend.epic10.wp06.component-lifecycle-telemetry.v1', 'WP-E10-06 declares workpackage contract');
  context.assertIncludes(fabricSource, 'componentLifecycleTelemetry', 'Fabric runtime declares componentLifecycleTelemetry contract key');
  context.assertIncludes(fabricSource, 'summarizeComponentLifecycleTelemetry', 'Fabric runtime summarizes Component Lifecycle Telemetry');
  context.assertIncludes(fabricSource, 'componentTelemetry:', 'Fabric snapshot returns componentTelemetry section');
  context.assertIncludes(fabricSource, 'prewarmWorker:', 'Fabric snapshot returns Prewarm Worker topology section');
  context.assertIncludes(fabricSource, 'kernelPanicRecovery', 'Fabric runtime declares kernel Panic/Recovery contract key');
  context.assertIncludes(fabricSource, 'recordKernelPanicRecovery', 'Fabric runtime records kernel Panic/Recovery telemetry');
  context.assertIncludes(fabricSource, 'panicRecovery:', 'Fabric telemetry snapshot returns Panic/Recovery section');
  context.assertIncludes(fabricSource, 'streamPressure:', 'Fabric telemetry snapshot returns Stream Pressure section');
  context.assertIncludes(fabricSource, 'summarizeStreamPressure', 'Fabric runtime summarizes App Runtime Stream Pressure');
  context.assertIncludes(fabricSource, 'xtend.rmt.prewarm-worker-topology.v1', 'Fabric runtime declares Prewarm Worker topology contract');
  context.assertIncludes(runtimeSource, 'XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'ESM runtime declares Lifecycle Telemetry schema constant');
  context.assertIncludes(browserSource, 'XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'Browser runtime declares Lifecycle Telemetry schema constant');
  context.assertIncludes(runtimeSource, 'enablePrewarmWorker === true', 'ESM runtime treats Prewarm Worker as explicit opt-in');
  context.assertIncludes(browserSource, 'enablePrewarmWorker === true', 'Browser runtime treats Prewarm Worker as explicit opt-in');
  context.assertIncludes(runtimeSource, 'terminatePrewarmWorker', 'ESM runtime exposes Prewarm Worker termination API');
  context.assertIncludes(browserSource, 'terminatePrewarmWorker', 'Browser runtime exposes Prewarm Worker termination API');
  context.assertIncludes(runtimeSource, 'recordComponentTelemetry', 'ESM runtime exposes recordComponentTelemetry');
  context.assertIncludes(browserSource, 'recordComponentTelemetry', 'Browser runtime exposes recordComponentTelemetry');
  context.assertIncludes(runtimeSource, 'listPanicRecoveryRecords', 'ESM runtime exposes Panic/Recovery record dev API');
  context.assertIncludes(browserSource, 'listPanicRecoveryRecords', 'Browser runtime exposes Panic/Recovery record dev API');
  context.assertIncludes(runtimeSource, 'getPanicRecoverySnapshot', 'ESM runtime exposes Panic/Recovery snapshot dev API');
  context.assertIncludes(browserSource, 'getPanicRecoverySnapshot', 'Browser runtime exposes Panic/Recovery snapshot dev API');
  context.assertIncludes(appRuntimeSource, 'getPerformanceTelemetrySnapshot', 'App Runtime exposes performance telemetry dev API');
  context.assertIncludes(appRuntimeSource, 'xtend.rmt.app-runtime-performance-telemetry.v1', 'App Runtime declares performance telemetry snapshot schema');
  context.assertIncludes(appRuntimeSource, 'xtend.rmt.app-runtime-stream-pressure.v1', 'App Runtime declares Stream Pressure telemetry schema');
  context.assertIncludes(appRuntimeSource, 'xtend.rmt.app-runtime-yield-action.v1', 'App Runtime declares Yield Action telemetry schema');
  context.assertIncludes(appRuntimeSource, 'listStreamPressureRecords', 'App Runtime exposes Stream Pressure record dev API');
  context.assertIncludes(appRuntimeSource, 'listYieldActions', 'App Runtime exposes Yield Action dev API');
  context.assertIncludes(appRuntimeSource, 'xtend.rmt.app-runtime-panic-recovery-snapshot.v1', 'App Runtime declares Panic/Recovery snapshot schema');
  context.assertIncludes(typesSource, 'RmtXtendComponentLifecycleTelemetry', 'Types expose Component Lifecycle Telemetry');
  context.assertIncludes(typesSource, 'RmtKernelRuntimePanicRecoverySnapshot', 'Types expose Kernel Panic/Recovery snapshot');
  context.assertIncludes(appRuntimeTypesSource, 'getPerformanceTelemetrySnapshot', 'App Runtime types expose performance telemetry dev API');
  context.assertIncludes(appRuntimeTypesSource, 'RmtAppRuntimePerformanceTelemetrySnapshot', 'App Runtime types expose performance telemetry snapshot type');
  context.assertIncludes(appRuntimeTypesSource, 'RmtStreamPressureRecord', 'App Runtime types expose Stream Pressure record type');
  context.assertIncludes(appRuntimeTypesSource, 'RmtAppRuntimeYieldAction', 'App Runtime types expose Yield Action record type');
  context.assertIncludes(appRuntimeTypesSource, 'RmtAppRuntimePanicRecoverySnapshot', 'App Runtime types expose Panic/Recovery snapshot type');
  context.assertIncludes(schemaSource, 'componentLifecycleTelemetry', 'RMT schema exposes componentLifecycleTelemetry section');
  context.assert(metadata && metadata.schema === LIFECYCLE_TELEMETRY_SCHEMA, 'Package metadata exposes Component Lifecycle Telemetry schema');
  context.assert(metadata.localGate === 'node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json', 'Package metadata exposes local gate');
  context.assertIncludes(scaffoldConfig, 'componentLifecycleTelemetry', 'Scaffold config exposes Component Lifecycle Telemetry section');

  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.esm.js');
  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.browser.js');
  assertTelemetryBridgeEndToEnd(context, rootDir);
  assertAppRuntimePerformanceDevApi(context, rootDir);

  return context.result({
    report: {
      schema: 'xtend.component.lifecycle-telemetry-report.v1',
      fixture: FIXTURE_PATH,
      artifacts: ['fabric/xtend-fabric.js', 'xtendrmt/rmt-runtime.esm.js', 'xtendrmt/rmt-runtime.browser.js']
    }
  });
}

function printRmtComponentLifecycleTelemetryReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT XTend Component Lifecycle Telemetry erfolgreich.',
    failureTitle: 'RMT XTend Component Lifecycle Telemetry fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtComponentLifecycleTelemetrySuite();
  printRmtComponentLifecycleTelemetryReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printRmtComponentLifecycleTelemetryReport,
  runRmtComponentLifecycleTelemetrySuite
};
