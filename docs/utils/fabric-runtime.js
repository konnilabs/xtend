(function attachXtendDocsFabricRuntime(globalTarget) {
  'use strict';

  const DOCS_FABRIC_RUNTIME_SCHEMA = 'xtend.docs.fabric-runtime.v1';
  const DOCS_FABRIC_SNAPSHOT_EVENT = 'xtend-docs-fabric-snapshot';
  const DOCS_FABRIC_READY_EVENT = 'xtend-docs-fabric-ready';
  const SNAPSHOT_LIMIT = 24;
  const LOADER_EVENT_LIMIT = 80;
  const CONNECTION_RETRY_DELAYS = [0, 50, 160, 420, 1000, 2000];

  if (!globalTarget || globalTarget.xtendDocsFabric) return;

  const state = {
    schema: DOCS_FABRIC_RUNTIME_SCHEMA,
    status: 'booting',
    initializedAt: null,
    ready: false,
    fabric: null,
    bridge: null,
    rmtBridge: null,
    rmtStateBridge: null,
    rmtBridgeStatus: 'idle',
    rmtDiagnosticsHub: null,
    routeFibers: null,
    pageFibers: null,
    codeFibers: null,
    snapshots: [],
    loaderDiagnostics: [],
    loaderPerformance: [],
    routeLanes: [],
    consoleReporterDisposer: null,
    connections: {
      xstate: false,
      api: false
    },
    pendingNavigation: null,
    lastRoute: null,
    lastSnapshot: null
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function asObject(value) {
    return value && typeof value === 'object' ? value : {};
  }

  function pushLimited(collection, value, limit) {
    collection.push(value);
    while (collection.length > limit) collection.shift();
    return value;
  }

  function safeDetail(event) {
    return asObject(event && event.detail);
  }

  function routeRefFromDetail(detail) {
    return detail.routeId || detail.routeRef || detail.path || (detail.slug ? `docs.${String(detail.slug).replace(/-/g, '.')}` : 'docs.unknown');
  }

  function getRmtDocument() {
    return asObject(globalTarget.xtendDocsRmtDocument);
  }

  function getRmtSchedule(scheduleId) {
    const schedules = Array.isArray(getRmtDocument().schedules) ? getRmtDocument().schedules : [];
    return schedules.find((schedule) => schedule && schedule.id === scheduleId) || null;
  }

  function getRmtRuntimeModuleUrl() {
    return globalTarget.xtendDocsRmtRuntimeModule
      || (globalTarget.xtendDocsRmtPilot && globalTarget.xtendDocsRmtPilot.fabricRuntime && globalTarget.xtendDocsRmtPilot.fabricRuntime.rmtBridgeModule)
      || '/xtendrmt/rmt-runtime.esm.js';
  }

  function scheduleMetadata(scheduleId) {
    const schedule = getRmtSchedule(scheduleId);
    return schedule ? {
      scheduleRef: schedule.id,
      endpointNameHint: schedule.endpointName,
      lane: schedule.lane,
      budgetClass: schedule.budgetClass,
      deadlineMs: schedule.deadlineMs,
      preferIdle: schedule.preferIdle === true
    } : {};
  }

  function stateSet(key, value) {
    if (globalTarget.xstate && typeof globalTarget.xstate.set === 'function') {
      globalTarget.xstate.set(key, value);
      return true;
    }
    return false;
  }

  function emitFabricDiagnostic(code, message, metadata = {}, level = 'info') {
    if (!state.fabric || typeof state.fabric.emitDiagnostic !== 'function') return null;
    return state.fabric.emitDiagnostic({
      level,
      code,
      message,
      source: 'docs-spa',
      phase: metadata.phase || 'runtime',
      lane: metadata.lane || 'diagnostics',
      routeRef: metadata.routeRef,
      scheduleRef: metadata.scheduleRef,
      correlationId: metadata.correlationId || state.lastRoute || 'docs-spa',
      metadata
    });
  }

  function createSnapshot(reason = 'manual', metadata = {}) {
    if (!state.fabric || typeof state.fabric.createTelemetrySnapshot !== 'function') return null;
    const snapshot = state.fabric.createTelemetrySnapshot({
      runtimeBridge: state.bridge,
      rmtBridge: state.rmtBridge,
      xstate: globalTarget.xstate,
      diagnosticsHub: state.rmtDiagnosticsHub,
      scheduleRef: metadata.scheduleRef || 'docs.diagnostics.snapshot',
      endpointName: 'xtendrmt.diagnostics.snapshot',
      scope: 'docs.fabric.telemetry',
      routeRef: metadata.routeRef || state.lastRoute || 'docs-spa',
      runInline: true,
      performance: globalTarget.performance,
      source: 'docs-spa',
      correlationId: metadata.routeRef || state.lastRoute || 'docs-spa',
      metadata: {
        reason,
        runtime: DOCS_FABRIC_RUNTIME_SCHEMA,
        documentId: getRmtDocument().manifest && getRmtDocument().manifest.documentId,
        activeRoute: state.lastRoute,
        loaderDiagnostics: state.loaderDiagnostics.slice(-10),
        loaderPerformance: state.loaderPerformance.slice(-20),
        routeLanes: state.routeLanes.slice(-20),
        rmtLastRender: globalTarget.xtendDocsRmtLastRender || null,
        productionLastRender: globalTarget.xtendDocsRmtProductionLastRender || null,
        ...metadata
      }
    });

    state.lastSnapshot = snapshot;
    pushLimited(state.snapshots, snapshot, SNAPSHOT_LIMIT);
    globalTarget.xtendDocsFabricLastSnapshot = snapshot;
    stateSet('xtend.docs.fabric.snapshot', snapshot);
    globalTarget.dispatchEvent(new CustomEvent(DOCS_FABRIC_SNAPSHOT_EVENT, { detail: snapshot }));
    return snapshot;
  }

  let snapshotTimer = null;
  function scheduleSnapshot(reason, metadata = {}) {
    if (snapshotTimer) globalTarget.clearTimeout(snapshotTimer);
    snapshotTimer = globalTarget.setTimeout(() => {
      snapshotTimer = null;
      createSnapshot(reason, metadata);
    }, 0);
  }

  function publishSnapshot(reason = 'manual-publish', metadata = {}) {
    const snapshot = createSnapshot(reason, metadata);
    if (snapshot && state.fabric && typeof state.fabric.publishTelemetrySnapshot === 'function') {
      return state.fabric.publishTelemetrySnapshot(snapshot, {
        code: 'xtend.docs.fabric.telemetry.snapshot',
        message: 'Docs-SPA Fabric telemetry snapshot exported.',
        correlationId: snapshot.correlationId
      });
    }
    return null;
  }

  function runRouteFiber(operation, detail = {}) {
    if (!state.routeFibers || typeof state.routeFibers[operation] !== 'function') return null;
    const schedule = scheduleMetadata(detail.scheduleRef || detail.schedule || (operation === 'navigate' ? 'ui.user-blocking.navigation' : 'docs.route.render'));
    const metadata = {
      ...schedule,
      path: detail.path,
      from: detail.from,
      to: detail.to || detail.path,
      routeId: detail.routeId,
      routeRef: routeRefFromDetail(detail),
      componentRef: detail.component || 'xtend-doc-page',
      metadata: detail
    };
    if (operation === 'render' && state.pendingNavigation && state.pendingNavigation.startedAt) {
      metadata.startedAt = state.pendingNavigation.startedAt;
    }
    if (detail.startedAt) {
      metadata.startedAt = detail.startedAt;
    }
    if (
      state.fabric &&
      typeof state.fabric.runFiber === 'function' &&
      typeof state.routeFibers.createFiberInput === 'function'
    ) {
      const fiberInput = state.routeFibers.createFiberInput(operation, metadata);
      if (metadata.startedAt) fiberInput.startedAt = metadata.startedAt;
      return state.fabric.runFiber(fiberInput, () => detail);
    }
    return state.routeFibers[operation](() => detail, metadata);
  }

  function runPageHydration(detail = {}) {
    if (!state.pageFibers || typeof state.pageFibers.hydrate !== 'function') return null;
    const scheduleId = detail.hydrateSchedule || detail.schedule || 'docs.page.hydrate';
    const schedule = scheduleMetadata(scheduleId);
    const routeRef = routeRefFromDetail(detail);
    const metadata = {
      ...schedule,
      routeRef,
      metadata: detail
    };
    if (detail.startedAt) metadata.startedAt = detail.startedAt;
    const result = (
      state.fabric &&
      typeof state.fabric.runFiber === 'function' &&
      typeof state.pageFibers.createFiberInput === 'function'
    )
      ? (() => {
        const fiberInput = state.pageFibers.createFiberInput('hydrate', metadata);
        if (metadata.startedAt) fiberInput.startedAt = metadata.startedAt;
        return state.fabric.runFiber(fiberInput, () => detail);
      })()
      : state.pageFibers.hydrate(() => detail, metadata);
    if (state.fabric && typeof state.fabric.recordComponentTelemetry === 'function') {
      state.fabric.recordComponentTelemetry({
        operation: 'hydrate',
        phase: 'hydrate',
        status: 'ok',
        source: 'docs-spa',
        componentId: 'docs.page',
        rmtComponentId: 'docs.page',
        tag: 'xtend-doc-page',
        routeRef,
        scheduleRef: schedule.scheduleRef || scheduleId,
        fabricLane: schedule.lane || 'idle',
        rmtLane: schedule.lane || 'idle',
        fiberKind: 'component.hydrate',
        endpointNameHint: schedule.endpointNameHint || 'xtendrmt.component.hydrate',
        metadata: detail
      });
    }
    return result;
  }

  function runCodeHydration(detail = {}) {
    if (!state.codeFibers || typeof state.codeFibers.hydrate !== 'function') return null;
    const scheduleId = detail.schedule || 'docs.page.hydrate';
    const schedule = scheduleMetadata(scheduleId);
    const routeRef = routeRefFromDetail(detail);
    const result = state.codeFibers.hydrate(() => detail, {
      ...schedule,
      routeRef,
      metadata: detail
    });
    if (state.fabric && typeof state.fabric.recordComponentTelemetry === 'function') {
      state.fabric.recordComponentTelemetry({
        operation: 'hydrate',
        phase: 'hydrate',
        status: detail.hydrated === 0 && detail.count > 0 ? 'degraded' : 'ok',
        source: 'docs-spa',
        componentId: 'docs.componentDemo',
        rmtComponentId: 'docs.componentDemo',
        tag: 'x-code',
        routeRef,
        scheduleRef: schedule.scheduleRef || scheduleId,
        fabricLane: schedule.lane || 'idle',
        rmtLane: schedule.lane || 'idle',
        fiberKind: 'component.hydrate',
        endpointNameHint: schedule.endpointNameHint || 'xtendrmt.component.hydrate',
        metadata: detail
      });
    }
    return result;
  }

  function connectBridgeTargets() {
    if (!state.bridge) return;
    if (!state.connections.xstate && globalTarget.xstate) {
      state.bridge.connectXState(globalTarget.xstate, {
        targetRef: 'window.xstate',
        correlationId: 'docs-spa'
      });
      state.connections.xstate = true;
    }
    if (!state.connections.api && globalTarget.XTend) {
      state.bridge.connectApi(globalTarget.XTend, {
        targetRef: 'window.XTend',
        correlationId: 'docs-spa'
      });
      state.connections.api = true;
    }
    if (state.connections.xstate && state.connections.api) {
      stateSet('xtend.docs.fabric.ready', {
        schema: DOCS_FABRIC_RUNTIME_SCHEMA,
        connected: true,
        initializedAt: state.initializedAt
      });
    }
  }

  function scheduleBridgeConnections() {
    CONNECTION_RETRY_DELAYS.forEach((delay) => {
      globalTarget.setTimeout(connectBridgeTargets, delay);
    });
  }

  function bindRuntimeEvents() {
    globalTarget.addEventListener('xtend-loader-diagnostic', (event) => {
      const detail = safeDetail(event);
      pushLimited(state.loaderDiagnostics, detail, LOADER_EVENT_LIMIT);
      emitFabricDiagnostic(detail.code || 'xtend.loader.diagnostic', detail.message || 'XTend loader diagnostic.', {
        phase: detail.phase || 'load',
        lane: 'diagnostics',
        payload: detail,
        source: 'xtend-loader'
      }, detail.level || 'info');
    });

    globalTarget.addEventListener('xtend-loader-performance', (event) => {
      const detail = safeDetail(event);
      pushLimited(state.loaderPerformance, detail, LOADER_EVENT_LIMIT);
      stateSet('xtend.docs.fabric.loader.lastMeasurement', detail);
      scheduleSnapshot('loader-performance', { scheduleRef: detail.name, loaderMeasurement: detail });
    });

    globalTarget.addEventListener('xrouter-before-navigate', (event) => {
      const detail = safeDetail(event);
      state.pendingNavigation = {
        startedAt: nowIso(),
        detail
      };
      runRouteFiber('navigate', detail);
    });

    globalTarget.addEventListener('xrouter-after-navigate', (event) => {
      const detail = safeDetail(event);
      state.lastRoute = routeRefFromDetail(detail);
      runRouteFiber('render', detail);
      state.pendingNavigation = null;
      scheduleSnapshot('route-render', {
        routeRef: state.lastRoute,
        scheduleRef: detail.scheduleRef || 'docs.route.render'
      });
    });

    globalTarget.addEventListener('xtend-docs-route-transition', (event) => {
      const detail = safeDetail(event);
      state.lastRoute = routeRefFromDetail(detail);
      runPageHydration(detail);
      if (state.rmtDiagnosticsHub) {
        state.rmtDiagnosticsHub.record({
          code: 'xtend.docs.route.transition',
          message: 'Docs route transition completed.',
          phase: 'route',
          routeRef: state.lastRoute,
          scheduleRef: detail.schedule || detail.routeSchedule,
          metadata: detail
        });
      }
      scheduleSnapshot('docs-route-transition', {
        routeRef: state.lastRoute,
        scheduleRef: detail.schedule || detail.routeSchedule,
        laneDurations: detail.laneDurations || []
      });
    });

    globalTarget.addEventListener('xtend-docs-lane-complete', (event) => {
      const detail = safeDetail(event);
      pushLimited(state.routeLanes, detail, LOADER_EVENT_LIMIT);
      stateSet('xtend.docs.route.lastLane', detail);
      if (state.rmtDiagnosticsHub) {
        state.rmtDiagnosticsHub.record({
          code: 'xtend.docs.route.lane.complete',
          message: 'Docs route lane completed.',
          phase: detail.operation || 'route-lane',
          routeRef: routeRefFromDetail(detail),
          scheduleRef: detail.schedule,
          metadata: detail
        });
      }
      scheduleSnapshot('docs-route-lane', {
        routeRef: routeRefFromDetail(detail),
        scheduleRef: detail.schedule,
        lane: detail.lane,
        durationMs: detail.durationMs
      });
    });

    globalTarget.addEventListener('xtend-docs-content-ready', (event) => {
      const detail = safeDetail(event);
      scheduleSnapshot('docs-content-ready', {
        routeRef: routeRefFromDetail(detail),
        scheduleRef: detail.schedule || 'docs.page.hydrate',
        syntaxSchedule: detail.syntaxSchedule || 'docs.syntax.highlight',
        insularHydration: detail.insularHydration === true
      });
    });

    globalTarget.addEventListener('xtend-docs-code-hydrated', (event) => {
      const detail = safeDetail(event);
      runCodeHydration(detail);
      scheduleSnapshot('code-hydration', {
        routeRef: routeRefFromDetail(detail),
        scheduleRef: detail.schedule || 'docs.page.hydrate'
      });
    });

    globalTarget.addEventListener('xtend-api-ready', connectBridgeTargets);
    globalTarget.addEventListener('DOMContentLoaded', connectBridgeTargets);
    globalTarget.addEventListener('load', () => {
      connectBridgeTargets();
      scheduleSnapshot('window-load', { routeRef: state.lastRoute || 'docs-spa' });
    });
  }

  function enableConsoleReporter(options = {}) {
    if (!state.fabric || typeof state.fabric.createConsoleReporter !== 'function') return false;
    if (state.consoleReporterDisposer) return true;
    const reporter = state.fabric.createConsoleReporter({
      id: 'docs.fabric.console',
      minimumLevel: options.minimumLevel || options.level || 'warn'
    });
    state.consoleReporterDisposer = state.fabric.registerReporter(reporter);
    return true;
  }

  function disableConsoleReporter() {
    if (typeof state.consoleReporterDisposer === 'function') {
      state.consoleReporterDisposer();
      state.consoleReporterDisposer = null;
      return true;
    }
    return false;
  }

  function createPublicApi() {
    return {
      schema: DOCS_FABRIC_RUNTIME_SCHEMA,
      get ready() {
        return state.ready;
      },
      get fabric() {
        return state.fabric;
      },
      get bridge() {
        return state.bridge;
      },
      get rmtBridge() {
        return state.rmtBridge;
      },
      status() {
        return {
          schema: DOCS_FABRIC_RUNTIME_SCHEMA,
          status: state.status,
          ready: state.ready,
          initializedAt: state.initializedAt,
          rmtBridgeStatus: state.rmtBridgeStatus,
          rmtBridgeReady: !!state.rmtBridge,
          connections: { ...state.connections },
          fiberCount: state.fabric && typeof state.fabric.getFibers === 'function' ? state.fabric.getFibers().length : 0,
          diagnosticCount: state.fabric && typeof state.fabric.getDiagnostics === 'function' ? state.fabric.getDiagnostics().length : 0,
          snapshotCount: state.snapshots.length,
          lastRoute: state.lastRoute
        };
      },
      snapshot: createSnapshot,
      publishSnapshot,
      enableConsoleReporter,
      disableConsoleReporter,
      getSnapshots() {
        return state.snapshots.slice();
      },
      getDiagnostics() {
        return state.fabric && typeof state.fabric.getDiagnostics === 'function' ? state.fabric.getDiagnostics() : [];
      },
      getFibers() {
        return state.fabric && typeof state.fabric.getFibers === 'function' ? state.fabric.getFibers() : [];
      },
      getComponentTelemetry() {
        return state.fabric && typeof state.fabric.getComponentTelemetry === 'function' ? state.fabric.getComponentTelemetry() : [];
      },
      recordDiagnostic(code, message, metadata = {}, level = 'info') {
        return emitFabricDiagnostic(code, message, metadata, level);
      }
    };
  }

  function connectRmtBridge(factory, source = 'module') {
    if (!factory || typeof factory !== 'function' || state.rmtBridge) return false;
    const documentRecord = getRmtDocument();
    try {
      state.rmtBridge = factory({
        xstate: globalTarget.xstate,
        diagnosticsHub: state.rmtDiagnosticsHub,
        schedules: Array.isArray(documentRecord.schedules) ? documentRecord.schedules : [],
        document: documentRecord
      });
    } catch (error) {
      state.rmtBridgeStatus = 'failed';
      emitFabricDiagnostic('xtend.docs.rmt.bridge.failed', 'Docs-SPA could not initialize XTendRMT telemetry bridge.', {
        phase: 'bootstrap',
        source,
        error: error && error.message ? error.message : String(error)
      }, 'warn');
      return false;
    }
    if (!state.rmtBridge) return false;
    if (typeof state.rmtBridge.createStateBridge === 'function') {
      const stateBridgeResult = state.rmtBridge.createStateBridge({ xstate: globalTarget.xstate });
      state.rmtStateBridge = stateBridgeResult && stateBridgeResult.handle ? stateBridgeResult.handle : null;
    }
    state.rmtBridgeStatus = 'ready';
    globalTarget.xtendDocsRmtBridge = state.rmtBridge;
    stateSet('xtend.docs.rmt.bridge.ready', {
      schema: 'xtend.docs.rmt-bridge.v1',
      source,
      telemetrySnapshot: typeof state.rmtBridge.recordTelemetrySnapshot === 'function',
      backpressureSignal: typeof state.rmtBridge.recordBackpressureSignal === 'function'
    });
    emitFabricDiagnostic('xtend.docs.rmt.bridge.ready', 'Docs-SPA connected XTendRMT telemetry bridge.', {
      phase: 'bootstrap',
      source,
      scheduleRef: 'docs.diagnostics.snapshot'
    });
    if (state.lastSnapshot && typeof state.rmtBridge.recordTelemetrySnapshot === 'function') {
      state.rmtBridge.recordTelemetrySnapshot(state.lastSnapshot, {
        xstate: globalTarget.xstate,
        diagnosticsHub: state.rmtDiagnosticsHub,
        scheduleRef: 'docs.diagnostics.snapshot',
        endpointName: 'xtendrmt.diagnostics.snapshot',
        scope: 'docs.fabric.telemetry',
        routeRef: state.lastRoute || 'docs-spa',
        correlationId: state.lastSnapshot.correlationId || state.lastRoute || 'docs-spa',
        source: 'docs-spa',
        runInline: true
      });
    }
    return true;
  }

  function initializeRmtBridge() {
    if (state.rmtBridge || state.rmtBridgeStatus === 'loading') return;
    const globalFactory = globalTarget.XTendRMT && globalTarget.XTendRMT.createRmtStateSchedulerDiagnosticsBridge;
    if (connectRmtBridge(globalFactory, 'global')) return;
    state.rmtBridgeStatus = 'loading';
    import(getRmtRuntimeModuleUrl())
      .then((module) => {
        state.rmtBridgeStatus = 'loaded';
        if (!connectRmtBridge(module && module.createRmtStateSchedulerDiagnosticsBridge, 'module')) {
          state.rmtBridgeStatus = 'unavailable';
        }
      })
      .catch((error) => {
        state.rmtBridgeStatus = 'failed';
        emitFabricDiagnostic('xtend.docs.rmt.bridge.failed', 'Docs-SPA could not load XTendRMT telemetry bridge.', {
          phase: 'bootstrap',
          error: error && error.message ? error.message : String(error)
        }, 'warn');
      });
  }

  function scheduleRmtBridgeInitialization() {
    const run = () => initializeRmtBridge();
    if (typeof globalTarget.requestIdleCallback === 'function') {
      globalTarget.requestIdleCallback(run, { timeout: 1500 });
      return;
    }
    globalTarget.setTimeout(run, 0);
  }

  function initializeFabricRuntime() {
    if (!globalTarget.XTendFabric || typeof globalTarget.XTendFabric.createXtendFabric !== 'function') {
      state.status = 'unavailable';
      return false;
    }

    state.fabric = globalTarget.XTendFabric.createXtendFabric({
      idPrefix: 'xtend.docs.fabric',
      window: globalTarget,
      performance: globalTarget.performance
    });
    state.bridge = state.fabric.createRuntimeDiagnosticsBridge({
      id: 'xtend.docs.fabric.runtime-bridge',
      statePrefix: 'xtend.docs.fabric',
      xstate: globalTarget.xstate,
      api: globalTarget.XTend,
      correlationId: 'docs-spa'
    });
    state.rmtDiagnosticsHub = state.bridge.createRmtDiagnosticsHub({
      source: 'docs-spa',
      bridge: 'xtend.docs.fabric.runtime-bridge'
    });
    state.routeFibers = state.fabric.createRouteFiberInstrumentation('xtend.xrouter', {
      scope: 'docs.xrouter',
      adapterRef: 'xtend.xrouter',
      hostRef: 'docs/index.php',
      renderScheduleRef: 'docs.route.render',
      renderEndpointNameHint: 'xtendrmt.route.render',
      renderLane: 'visible',
      navigateScheduleRef: 'ui.user-blocking.navigation',
      navigateEndpointNameHint: 'xtendrmt.ui.user-blocking',
      navigateLane: 'user-blocking',
      swallowErrors: true
    });
    state.pageFibers = state.fabric.createComponentFiberInstrumentation('xtend-doc-page', {
      scope: 'docs.page',
      adapterRef: 'xtend.component',
      hostRef: 'docs/index.php',
      hydrateScheduleRef: 'docs.page.hydrate',
      hydrateEndpointNameHint: 'xtendrmt.component.hydrate',
      hydrateLane: 'idle',
      swallowErrors: true
    });
    state.codeFibers = state.fabric.createComponentFiberInstrumentation('x-code', {
      scope: 'docs.componentDemo',
      adapterRef: 'xtend.component',
      hostRef: 'docs/index.php',
      hydrateScheduleRef: 'docs.demo.prepare',
      hydrateEndpointNameHint: 'xtendrmt.docs.demo.prepare',
      hydrateLane: 'idle',
      swallowErrors: true
    });

    state.status = 'ready';
    state.ready = true;
    state.initializedAt = nowIso();
    globalTarget.document.documentElement.setAttribute('data-xtend-docs-fabric', 'ready');
    bindRuntimeEvents();
    scheduleBridgeConnections();
    scheduleRmtBridgeInitialization();
    emitFabricDiagnostic('xtend.docs.fabric.ready', 'Docs-SPA Fabric runtime initialized.', {
      phase: 'bootstrap',
      runtime: DOCS_FABRIC_RUNTIME_SCHEMA,
      scheduleRef: 'docs.diagnostics.snapshot'
    });
    scheduleSnapshot('bootstrap', { routeRef: 'docs-spa' });
    globalTarget.dispatchEvent(new CustomEvent(DOCS_FABRIC_READY_EVENT, { detail: globalTarget.xtendDocsFabric.status() }));
    return true;
  }

  globalTarget.xtendDocsFabric = createPublicApi();
  if (!initializeFabricRuntime()) {
    CONNECTION_RETRY_DELAYS.forEach((delay) => {
      globalTarget.setTimeout(() => {
        if (!state.ready) initializeFabricRuntime();
      }, delay);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
