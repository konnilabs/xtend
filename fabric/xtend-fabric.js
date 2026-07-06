(function attachXtendFabric(globalTarget, factory) {
  const api = factory(globalTarget);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendFabric = Object.freeze({
      schema: api.CONTRACTS.api,
      contracts: api.CONTRACTS,
      createXtendFabric: api.createXtendFabric,
      createNoopReporter: api.createNoopReporter,
      createReporterAdapter: api.createReporterAdapter,
      createConsoleReporter: api.createConsoleReporter,
      createTestReporter: api.createTestReporter,
      normalizeComponentLifecycleTelemetry: api.normalizeComponentLifecycleTelemetry,
      summarizeComponentLifecycleTelemetry: api.summarizeComponentLifecycleTelemetry,
      normalizeKernelPanicRecoveryRecord: api.normalizeKernelPanicRecoveryRecord,
      summarizeKernelPanicRecovery: api.summarizeKernelPanicRecovery,
      summarizeStreamPressure: api.summarizeStreamPressure
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendFabricModule(globalTarget) {
  const CONTRACTS = Object.freeze({
    api: 'xtend.fabric.api.v1',
    diagnostic: 'xtend.fabric.diagnostic.v1',
    reporter: 'xtend.fabric.reporter.v1',
    redaction: 'xtend.fabric.redaction.v1',
    fiber: 'xtend.fabric.fiber.v1',
    lane: 'xtend.fabric.lane.v1',
    lifecycleBoundary: 'xtend.fabric.lifecycle-error-boundary.v1',
    componentFiberInstrumentation: 'xtend.fabric.component-fiber-instrumentation.v1',
    routeFiberInstrumentation: 'xtend.fabric.route-fiber-instrumentation.v1',
    runtimeDiagnosticsBridge: 'xtend.fabric.runtime-diagnostics-bridge.v1',
    telemetrySnapshot: 'xtend.fabric.telemetry-snapshot.v1',
    kernelPanicRecovery: 'xtend.fabric.kernel-panic-recovery.v1',
    prewarmWorkerTopology: 'xtend.rmt.prewarm-worker-topology.v1',
    backpressureSignal: 'xtend.fabric.backpressure-signal.v1',
    streamPressure: 'xtend.rmt.app-runtime-stream-pressure.v1',
    yieldAction: 'xtend.rmt.app-runtime-yield-action.v1',
    appRuntimeFiberInstrumentation: 'xtend.fabric.app-runtime-fiber-instrumentation.v1',
    performanceMeasurement: 'xtend.performance.measurement.v1',
    componentLifecycleTelemetry: 'xtend.component.lifecycle-telemetry.v1'
  });
  const BROWSER_NAMESPACE = 'window.XTendFabric';

  const DEFAULT_LANE_BY_KIND = Object.freeze({
    'loader.manifest': 'user-blocking',
    'loader.module': 'visible',
    'component.mount': 'visible',
    'component.hydrate': 'visible',
    'component.render': 'visible',
    'component.update': 'visible',
    'component.disconnect': 'background',
    'component.unmount': 'background',
    'component.dispose': 'background',
    'surface.destroy': 'background',
    'surface.cleanup': 'background',
    'resource.release': 'background',
    'event.handler': 'user-blocking',
    'rmt.command': 'user-blocking',
    'rmt.action': 'user-blocking',
    'rmt.service.invoke': 'user-blocking',
    'rmt.service.subscribe': 'background',
    'rmt.stream.patch': 'visible',
    'rmt.stream.delta': 'visible',
    'rmt.reducer': 'user-blocking',
    'route.navigate': 'user-blocking',
    'route.render': 'transition',
    'theme.apply': 'visible',
    'state.sync': 'user-blocking',
    'api.call': 'user-blocking',
    'a11y.announce': 'a11y',
    'diagnostics.snapshot': 'diagnostics',
    'rmt.adapter-result': 'diagnostics',
    'kernel.trust': 'diagnostics',
    'kernel.panic': 'diagnostics',
    'kernel.recovery': 'diagnostics',
    'kernel.safe_snapshot': 'diagnostics'
  });

  const CANONICAL_LANES = Object.freeze({
    'user-blocking': Object.freeze({
      schema: CONTRACTS.lane,
      id: 'user-blocking',
      priority: 100,
      budgetClass: 'critical',
      deadlineMs: 80,
      preferIdle: false,
      coalescePolicy: 'none'
    }),
    a11y: Object.freeze({
      schema: CONTRACTS.lane,
      id: 'a11y',
      priority: 95,
      budgetClass: 'critical',
      deadlineMs: 80,
      preferIdle: false,
      coalescePolicy: 'stale-announcements'
    }),
    visible: Object.freeze({
      schema: CONTRACTS.lane,
      id: 'visible',
      priority: 80,
      budgetClass: 'interactive',
      deadlineMs: 160,
      preferIdle: false,
      coalescePolicy: 'scope'
    }),
    transition: Object.freeze({
      schema: CONTRACTS.lane,
      id: 'transition',
      priority: 65,
      budgetClass: 'interactive',
      deadlineMs: 240,
      preferIdle: false,
      coalescePolicy: 'route-or-scope'
    }),
    idle: Object.freeze({
      schema: CONTRACTS.lane,
      id: 'idle',
      priority: 35,
      budgetClass: 'background',
      deadlineMs: 500,
      preferIdle: true,
      coalescePolicy: 'coalesce'
    }),
    background: Object.freeze({
      schema: CONTRACTS.lane,
      id: 'background',
      priority: 25,
      budgetClass: 'best_effort',
      deadlineMs: 1000,
      preferIdle: true,
      coalescePolicy: 'coalesce'
    }),
    diagnostics: Object.freeze({
      schema: CONTRACTS.lane,
      id: 'diagnostics',
      priority: 20,
      budgetClass: 'diagnostics',
      deadlineMs: 750,
      preferIdle: true,
      coalescePolicy: 'coalesce'
    })
  });

  const LIFECYCLE_METHODS = Object.freeze([
    'connectedCallback',
    'attributeChangedCallback',
    'render',
    'hydrate',
    'disconnectedCallback'
  ]);
  const COMPONENT_LIFECYCLE_OPERATIONS = Object.freeze([
    'mount',
    'hydrate',
    'render',
    'update',
    'event',
    'unmount',
    'dispose',
    'error'
  ]);

  const LIFECYCLE_PHASES = Object.freeze({
    connectedCallback: Object.freeze({
      phase: 'connectedCallback',
      fiberKind: 'component.mount',
      lane: 'visible',
      severity: 'error'
    }),
    attributeChangedCallback: Object.freeze({
      phase: 'attributeChangedCallback',
      fiberKind: 'component.update',
      lane: 'visible',
      severity: 'error'
    }),
    render: Object.freeze({
      phase: 'render',
      fiberKind: 'component.render',
      lane: 'visible',
      severity: 'error'
    }),
    hydrate: Object.freeze({
      phase: 'hydrate',
      fiberKind: 'component.hydrate',
      lane: 'visible',
      severity: 'error'
    }),
    disconnectedCallback: Object.freeze({
      phase: 'disconnectedCallback',
      fiberKind: 'component.disconnect',
      lane: 'background',
      severity: 'error'
    }),
    eventHandler: Object.freeze({
      phase: 'eventHandler',
      fiberKind: 'event.handler',
      lane: 'user-blocking',
      severity: 'error'
    })
  });

  const COMPONENT_FIBER_OPERATION_PROFILES = Object.freeze({
    mount: Object.freeze({
      operation: 'mount',
      kind: 'component.mount',
      phase: 'mount',
      source: 'component',
      lane: 'visible',
      scheduleRef: 'component.visible.mount',
      endpointNameHint: 'xtendrmt.component.mount',
      diagnosticCode: 'xtend.fabric.component.mount.failed',
      diagnosticMessage: 'XTend component mount failed',
      coalesceSuffix: 'mount'
    }),
    hydrate: Object.freeze({
      operation: 'hydrate',
      kind: 'component.hydrate',
      phase: 'hydrate',
      source: 'component',
      lane: 'idle',
      scheduleRef: 'component.idle.hydrate',
      endpointNameHint: 'xtendrmt.component.hydrate',
      diagnosticCode: 'xtend.fabric.component.hydrate.failed',
      diagnosticMessage: 'XTend component hydration failed',
      coalesceSuffix: 'hydrate'
    }),
    unmount: Object.freeze({
      operation: 'unmount',
      kind: 'component.unmount',
      phase: 'unmount',
      source: 'component',
      lane: 'background',
      scheduleRef: 'ui.background.work',
      endpointNameHint: 'xtendrmt.ui.background',
      diagnosticCode: 'xtend.fabric.component.unmount.failed',
      diagnosticMessage: 'XTend component unmount failed',
      coalesceSuffix: 'unmount'
    }),
    dispose: Object.freeze({
      operation: 'dispose',
      kind: 'component.dispose',
      phase: 'dispose',
      source: 'component',
      lane: 'background',
      scheduleRef: 'ui.background.work',
      endpointNameHint: 'xtendrmt.ui.background',
      diagnosticCode: 'xtend.fabric.component.dispose.failed',
      diagnosticMessage: 'XTend component dispose failed',
      coalesceSuffix: 'dispose'
    }),
    preload: Object.freeze({
      operation: 'preload',
      kind: 'loader.module',
      phase: 'preload',
      source: 'loader',
      lane: 'visible',
      scheduleRef: 'component.visible.mount',
      endpointNameHint: 'xtendrmt.component.mount',
      diagnosticCode: 'xtend.fabric.component.preload.failed',
      diagnosticMessage: 'XTend component preload failed',
      coalesceSuffix: 'preload'
    })
  });

  const ROUTE_FIBER_OPERATION_PROFILES = Object.freeze({
    navigate: Object.freeze({
      operation: 'navigate',
      kind: 'route.navigate',
      phase: 'navigate',
      source: 'router',
      lane: 'user-blocking',
      scheduleRef: 'ui.user-blocking.input',
      endpointNameHint: 'xtendrmt.ui.user-blocking',
      diagnosticCode: 'xtend.fabric.route.navigate.failed',
      diagnosticMessage: 'XTend route navigation failed',
      coalesceSuffix: 'navigate'
    }),
    render: Object.freeze({
      operation: 'render',
      kind: 'route.render',
      phase: 'render',
      source: 'router',
      lane: 'transition',
      scheduleRef: 'route.transition.render',
      endpointNameHint: 'xtendrmt.route.render',
      diagnosticCode: 'xtend.fabric.route.render.failed',
      diagnosticMessage: 'XTend route render failed',
      coalesceSuffix: 'render'
    })
  });

  const BACKPRESSURE_SCORE_THRESHOLDS = Object.freeze({
    none: 0,
    low: 1,
    medium: 3,
    high: 7,
    critical: 12
  });

  const BACKPRESSURE_ACTION_BY_LEVEL = Object.freeze({
    none: 'continue',
    low: 'observe',
    medium: 'coalesce-idle-work',
    high: 'defer-background-work',
    critical: 'protect-user-blocking-work'
  });

  const PERFORMANCE_MEASURE_PHASES = Object.freeze({
    'xtend.loader.manifest': 'load',
    'xtend.loader.module': 'load',
    'xtend.component.define': 'define',
    'xtend.component.mount': 'mount',
    'xtend.component.hydrate': 'hydrate',
    'xtend.component.render': 'render',
    'xtend.component.update': 'update',
    'xtend.component.unmount': 'unmount',
    'xtend.component.dispose': 'dispose',
    'xtend.surface.destroy': 'destroy',
    'xtend.surface.cleanup': 'cleanup',
    'xtend.resource.release': 'release',
    'xtend.event.handler': 'event',
    'xtend.route.navigate': 'route',
    'xtend.route.render': 'route',
    'xtend.diagnostics.snapshot': 'diagnostics'
  });

  const PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND = Object.freeze({
    'loader.manifest': 'xtend.loader.manifest',
    'loader.module': 'xtend.loader.module',
    'component.define': 'xtend.component.define',
    'component.mount': 'xtend.component.mount',
    'component.hydrate': 'xtend.component.hydrate',
    'component.render': 'xtend.component.render',
    'component.update': 'xtend.component.update',
    'component.unmount': 'xtend.component.unmount',
    'component.dispose': 'xtend.component.dispose',
    'surface.destroy': 'xtend.surface.destroy',
    'surface.cleanup': 'xtend.surface.cleanup',
    'resource.release': 'xtend.resource.release',
    'event.handler': 'xtend.event.handler',
    'route.navigate': 'xtend.route.navigate',
    'route.render': 'xtend.route.render',
    'diagnostics.snapshot': 'xtend.diagnostics.snapshot'
  });

  const PERFORMANCE_BUDGET_MS_BY_MEASURE = Object.freeze({
    'xtend.loader.manifest': 40,
    'xtend.loader.module': 50,
    'xtend.component.define': 40,
    'xtend.component.mount': 24,
    'xtend.component.hydrate': 32,
    'xtend.component.render': 24,
    'xtend.component.update': 24,
    'xtend.component.unmount': 40,
    'xtend.component.dispose': 80,
    'xtend.surface.destroy': 120,
    'xtend.surface.cleanup': 160,
    'xtend.resource.release': 160,
    'xtend.event.handler': 16,
    'xtend.route.navigate': 80,
    'xtend.route.render': 48,
    'xtend.diagnostics.snapshot': 750
  });

  const SENSITIVE_KEY_PATTERN = /(authorization|cookie|csrf|credential|form|header|password|query|secret|session|token)/i;
  const REPORTER_LEVEL_ORDER = Object.freeze({
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50
  });

  let diagnosticCounter = 0;
  let fiberCounter = 0;

  function nowIso(clock) {
    const value = typeof clock === 'function' ? clock() : new Date();
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    return new Date(value || Date.now()).toISOString();
  }

  function asObject(value) {
    return value && typeof value === 'object' ? value : {};
  }

  function clampString(value, fallback) {
    return typeof value === 'string' && value.length > 0 ? value : fallback;
  }

  function normalizeDiagnosticCode(code, fallback = 'xtend.fabric.diagnostic') {
    const value = clampString(code, fallback);
    if (value.startsWith('xtend.')) return value;
    if (value.startsWith('rmt.')) return `xtend.${value}`;
    return value.includes('.') ? value : `xtend.fabric.${value}`;
  }

  function normalizeError(error, options = {}) {
    if (!error) {
      return null;
    }

    if (error instanceof Error) {
      const normalized = {
        name: error.name || 'Error',
        message: error.message || 'Unknown error'
      };
      if (options.includeStack !== false && error.stack) {
        normalized.stack = error.stack;
      }
      return normalized;
    }

    return {
      name: typeof error,
      message: String(error)
    };
  }

  function isDomNode(value) {
    return value && typeof value === 'object' && typeof value.nodeType === 'number';
  }

  function redactValue(value, seen = new WeakSet()) {
    if (value == null) {
      return value;
    }

    if (typeof value === 'function') {
      return '[redacted:function]';
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (value instanceof Error) {
      return normalizeError(value);
    }

    if (isDomNode(value)) {
      return '[redacted:dom-node]';
    }

    if (seen.has(value)) {
      return '[redacted:circular]';
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((entry) => redactValue(entry, seen));
    }

    return Object.keys(value).reduce((safe, key) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        safe[key] = '[redacted]';
        return safe;
      }
      safe[key] = redactValue(value[key], seen);
      return safe;
    }, {});
  }

  function redactDiagnostic(event) {
    return {
      ...event,
      schema: CONTRACTS.diagnostic,
      metadata: redactValue(event.metadata || {}),
      cause: event.cause ? redactValue(event.cause) : undefined
    };
  }

  function toFiniteDuration(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function resolvePerformanceMeasureName(name) {
    const entryName = clampString(name, '');
    if (!entryName) return undefined;
    return Object.keys(PERFORMANCE_MEASURE_PHASES).find((measureName) => (
      entryName === measureName || entryName.startsWith(`${measureName}.`)
    ));
  }

  function resolvePerformancePhase(name, fallback) {
    const measureName = resolvePerformanceMeasureName(name);
    return measureName ? PERFORMANCE_MEASURE_PHASES[measureName] : clampString(fallback, 'runtime');
  }

  function resolvePerformanceProfile(measureName, options = {}) {
    if (options.performanceProfile) return options.performanceProfile;
    if (!measureName) return 'runtime';
    if (measureName.startsWith('xtend.route.')) return 'routing';
    if (measureName.startsWith('xtend.event.')) return 'interactive';
    if (measureName.startsWith('xtend.component.')) return 'display';
    return 'runtime';
  }

  function resolvePerformanceBudgetMs(measureName, phase, options = {}) {
    const budgetsByName = asObject(options.performanceBudgetByName);
    const budgetsByPhase = asObject(options.performanceBudgetByPhase);
    const explicit = measureName && Number(budgetsByName[measureName]);
    if (Number.isFinite(explicit)) return explicit;
    const phaseBudget = phase && Number(budgetsByPhase[phase]);
    if (Number.isFinite(phaseBudget)) return phaseBudget;
    const defaultBudget = measureName && PERFORMANCE_BUDGET_MS_BY_MEASURE[measureName];
    return Number.isFinite(Number(defaultBudget)) ? Number(defaultBudget) : 0;
  }

  function classifyPerformanceStatus(durationMs, budgetMs) {
    if (!Number.isFinite(Number(budgetMs)) || Number(budgetMs) <= 0) return 'pass';
    if (durationMs <= budgetMs) return 'pass';
    if (durationMs <= budgetMs * 1.5) return 'warn';
    return 'fail';
  }

  function normalizePerformanceEntry(entry) {
    const safeEntry = asObject(entry);
    return {
      name: safeEntry.name,
      entryType: safeEntry.entryType || safeEntry.type,
      startTime: toFiniteDuration(safeEntry.startTime),
      duration: toFiniteDuration(safeEntry.duration)
    };
  }

  function createPerformanceMeasurement(entry, options = {}, index = 0) {
    const normalized = normalizePerformanceEntry(entry);
    const measureName = resolvePerformanceMeasureName(normalized.name) || normalized.name;
    const phase = resolvePerformancePhase(normalized.name, normalized.entryType);
    const durationMs = toFiniteDuration(normalized.duration);
    const budgetMs = resolvePerformanceBudgetMs(measureName, phase, options);
    return {
      schema: CONTRACTS.performanceMeasurement,
      id: `${options.performanceMeasurementIdPrefix || 'xtend.performance.measurement'}.${index + 1}`,
      name: measureName,
      entryName: normalized.name,
      entryType: normalized.entryType,
      profile: resolvePerformanceProfile(measureName, options),
      componentRef: options.componentRef,
      fiberId: options.fiberId,
      lane: options.lane,
      phase,
      durationMs: Number(durationMs.toFixed(2)),
      budgetMs,
      status: classifyPerformanceStatus(durationMs, budgetMs),
      sampleKind: clampString(options.performanceSampleKind, 'telemetry'),
      metadata: redactValue({
        startTime: Number(toFiniteDuration(normalized.startTime).toFixed(2)),
        source: 'performance-runtime',
        metadata: options.performanceMetadata
      })
    };
  }

  function summarizePerformanceMeasurements(measurements = []) {
    return measurements.reduce((summary, measurement) => {
      const phase = measurement.phase || 'runtime';
      if (!summary[phase]) {
        summary[phase] = {
          schema: CONTRACTS.performanceMeasurement,
          phase,
          measurementCount: 0,
          durationMs: 0,
          maxDurationMs: 0,
          warnCount: 0,
          failCount: 0,
          names: []
        };
      }
      const phaseSummary = summary[phase];
      const durationMs = toFiniteDuration(measurement.durationMs);
      phaseSummary.measurementCount += 1;
      phaseSummary.durationMs = Number((phaseSummary.durationMs + durationMs).toFixed(2));
      phaseSummary.maxDurationMs = Math.max(phaseSummary.maxDurationMs, durationMs);
      if (measurement.status === 'warn') phaseSummary.warnCount += 1;
      if (measurement.status === 'fail') phaseSummary.failCount += 1;
      if (measurement.name && !phaseSummary.names.includes(measurement.name)) {
        phaseSummary.names.push(measurement.name);
      }
      return summary;
    }, {});
  }

  function normalizeComponentLifecycleOperation(operation, fallbackOperation = 'update') {
    const requested = clampString(operation, '');
    const aliases = {
      mountComponent: 'mount',
      hydrateComponent: 'hydrate',
      renderComponent: 'render',
      updateComponent: 'update',
      unmountComponent: 'unmount',
      disconnectComponent: 'unmount',
      registerComponent: 'mount',
      connectedCallback: 'mount',
      hydrate: 'hydrate',
      render: 'render',
      attributeChangedCallback: 'update',
      disconnectedCallback: 'unmount',
      eventHandler: 'event',
      emitDiagnostic: 'error',
      captureError: 'error'
    };
    const normalized = aliases[requested] || requested;
    return COMPONENT_LIFECYCLE_OPERATIONS.includes(normalized) ? normalized : fallbackOperation;
  }

  function normalizeComponentLifecycleStatus(status, ok) {
    const requested = clampString(status, '');
    if (['ok', 'degraded', 'skipped', 'failed'].includes(requested)) {
      return requested;
    }
    if (requested === 'error') return 'failed';
    if (ok === false) return 'failed';
    return 'ok';
  }

  function normalizeComponentLifecycleTelemetry(recordInput = {}, defaultsInput = {}) {
    const record = asObject(recordInput);
    const defaults = asObject(defaultsInput);
    const fabricContext = asObject(record.fabricContext || record.fabric || defaults.fabricContext || defaults.fabric);
    const metadata = asObject(record.metadata);
    const operation = normalizeComponentLifecycleOperation(record.operation || defaults.operation, 'update');
    const status = normalizeComponentLifecycleStatus(record.status || defaults.status, record.ok);
    const diagnostics = Array.isArray(record.diagnostics)
      ? record.diagnostics
      : (Array.isArray(defaults.diagnostics) ? defaults.diagnostics : []);
    const durationMs = Number(toFiniteDuration(
      Object.prototype.hasOwnProperty.call(record, 'durationMs') ? record.durationMs : defaults.durationMs
    ).toFixed(2));
    const backpressureSignal = record.backpressureSignal
      || defaults.backpressureSignal
      || metadata.backpressureSignal
      || null;

    return Object.freeze({
      schema: CONTRACTS.componentLifecycleTelemetry,
      id: clampString(record.id, defaults.id || `${defaults.idPrefix || 'xtend.component.telemetry'}.${defaults.index != null ? defaults.index + 1 : 'record'}`),
      timestamp: record.timestamp || defaults.timestamp || nowIso(defaults.clock),
      source: clampString(record.source, defaults.source || 'xtend.component-adapter'),
      operation,
      phase: clampString(record.phase || defaults.phase, operation),
      status,
      ok: status === 'ok' || status === 'degraded',
      adapterId: clampString(record.adapterId || defaults.adapterId, 'xtend.component'),
      componentId: clampString(record.componentId || record.componentRef || defaults.componentId || fabricContext.componentId, ''),
      rmtComponentId: clampString(record.rmtComponentId || record.rmtId || defaults.rmtComponentId || record.componentId || fabricContext.componentId, ''),
      tag: clampString(record.tag || defaults.tag || fabricContext.tag, ''),
      routeRef: clampString(record.routeRef || record.routeId || defaults.routeRef || fabricContext.routeRef, ''),
      scheduleRef: clampString(record.scheduleRef || defaults.scheduleRef || fabricContext.scheduleRef, ''),
      fabricLane: clampString(record.fabricLane || record.lane || defaults.fabricLane || fabricContext.fabricLane || fabricContext.lane, ''),
      rmtLane: clampString(record.rmtLane || defaults.rmtLane || fabricContext.rmtLane || fabricContext.lane, ''),
      fiberKind: clampString(record.fiberKind || defaults.fiberKind || fabricContext.fiberKind, ''),
      endpointNameHint: clampString(record.endpointNameHint || defaults.endpointNameHint || fabricContext.endpointNameHint, ''),
      durationMs,
      diagnosticCount: Number.isFinite(Number(record.diagnosticCount))
        ? Number(record.diagnosticCount)
        : diagnostics.length,
      diagnostics: redactValue(diagnostics),
      backpressureSignal: backpressureSignal ? redactValue(backpressureSignal) : null,
      correlationId: record.correlationId || defaults.correlationId,
      metadata: redactValue(metadata)
    });
  }

  function normalizeComponentLifecycleTelemetryCollection(records = [], defaults = {}) {
    return (Array.isArray(records) ? records : [])
      .map((record, index) => normalizeComponentLifecycleTelemetry(record, { ...defaults, index }));
  }

  function createComponentTelemetryBucket(id) {
    return {
      schema: CONTRACTS.componentLifecycleTelemetry,
      id,
      recordCount: 0,
      okCount: 0,
      degradedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      diagnosticCount: 0,
      backpressureSignalCount: 0,
      durationMs: 0,
      maxDurationMs: 0,
      averageDurationMs: 0,
      scheduleRefs: []
    };
  }

  function summarizeComponentLifecycleTelemetry(records = []) {
    const normalizedRecords = normalizeComponentLifecycleTelemetryCollection(records);
    const summary = {
      schema: CONTRACTS.componentLifecycleTelemetry,
      recordCount: normalizedRecords.length,
      operations: {},
      components: {},
      lanes: {},
      statusCounts: {
        ok: 0,
        degraded: 0,
        skipped: 0,
        failed: 0
      },
      diagnosticCount: 0,
      backpressureSignalCount: 0,
      durationMs: 0,
      maxDurationMs: 0,
      averageDurationMs: 0,
      records: normalizedRecords.slice(-50)
    };

    COMPONENT_LIFECYCLE_OPERATIONS.forEach((operation) => {
      summary.operations[operation] = createComponentTelemetryBucket(operation);
    });

    normalizedRecords.forEach((record) => {
      const operationBucket = summary.operations[record.operation] || (summary.operations[record.operation] = createComponentTelemetryBucket(record.operation));
      const componentId = record.componentId || record.tag || 'unknown-component';
      const componentBucket = summary.components[componentId] || (summary.components[componentId] = createComponentTelemetryBucket(componentId));
      const laneId = record.fabricLane || record.rmtLane || 'unassigned';
      const laneBucket = summary.lanes[laneId] || (summary.lanes[laneId] = createComponentTelemetryBucket(laneId));
      const buckets = [operationBucket, componentBucket, laneBucket];
      const durationMs = toFiniteDuration(record.durationMs);
      const statusKey = ['ok', 'degraded', 'skipped', 'failed'].includes(record.status) ? record.status : 'failed';

      summary.statusCounts[statusKey] += 1;
      summary.diagnosticCount += Number(record.diagnosticCount) || 0;
      summary.backpressureSignalCount += record.backpressureSignal ? 1 : 0;
      summary.durationMs = Number((summary.durationMs + durationMs).toFixed(2));
      summary.maxDurationMs = Math.max(summary.maxDurationMs, durationMs);

      buckets.forEach((bucket) => {
        bucket.recordCount += 1;
        bucket[`${statusKey}Count`] += 1;
        bucket.diagnosticCount += Number(record.diagnosticCount) || 0;
        bucket.backpressureSignalCount += record.backpressureSignal ? 1 : 0;
        bucket.durationMs = Number((bucket.durationMs + durationMs).toFixed(2));
        bucket.maxDurationMs = Math.max(bucket.maxDurationMs, durationMs);
        if (record.scheduleRef && !bucket.scheduleRefs.includes(record.scheduleRef)) {
          bucket.scheduleRefs.push(record.scheduleRef);
        }
      });
    });

    Object.keys(summary.operations).forEach((key) => {
      const bucket = summary.operations[key];
      bucket.averageDurationMs = bucket.recordCount > 0 ? Number((bucket.durationMs / bucket.recordCount).toFixed(2)) : 0;
    });
    Object.keys(summary.components).forEach((key) => {
      const bucket = summary.components[key];
      bucket.averageDurationMs = bucket.recordCount > 0 ? Number((bucket.durationMs / bucket.recordCount).toFixed(2)) : 0;
    });
    Object.keys(summary.lanes).forEach((key) => {
      const bucket = summary.lanes[key];
      bucket.averageDurationMs = bucket.recordCount > 0 ? Number((bucket.durationMs / bucket.recordCount).toFixed(2)) : 0;
    });
    summary.averageDurationMs = summary.recordCount > 0 ? Number((summary.durationMs / summary.recordCount).toFixed(2)) : 0;

    return Object.freeze(summary);
  }

  function normalizeKernelPanicRecoveryKind(kind, fallback = 'panicEvent') {
    const requested = clampString(kind, fallback);
    const aliases = {
      trust: 'trustVerdict',
      trust_verdict: 'trustVerdict',
      trustVerdict: 'trustVerdict',
      panic: 'panicEvent',
      panic_event: 'panicEvent',
      panicEvent: 'panicEvent',
      recovery: 'recoveryOutcome',
      recovery_outcome: 'recoveryOutcome',
      recoveryOutcome: 'recoveryOutcome',
      snapshot: 'safeSnapshot',
      safe_snapshot: 'safeSnapshot',
      safeSnapshot: 'safeSnapshot'
    };
    return aliases[requested] || requested;
  }

  function kernelPanicRecoveryStatusForRecord(record, kind) {
    if (record.status) return String(record.status);
    if (record.state) return String(record.state);
    if (kind === 'trustVerdict') return record.commitAllowed === false ? 'blocked' : 'recorded';
    if (kind === 'safeSnapshot') return 'captured';
    return 'recorded';
  }

  function kernelPanicRecoveryFiberKind(kind) {
    if (kind === 'trustVerdict') return 'kernel.trust';
    if (kind === 'recoveryOutcome') return 'kernel.recovery';
    if (kind === 'safeSnapshot') return 'kernel.safe_snapshot';
    return 'kernel.panic';
  }

  function normalizeKernelPanicRecoveryRecord(recordInput = {}, defaultsInput = {}) {
    const input = asObject(recordInput);
    const defaults = asObject(defaultsInput);
    const record = asObject(input.record || input.payload || input);
    const kind = normalizeKernelPanicRecoveryKind(input.kind || defaults.kind || record.kind || record.type);
    const status = kernelPanicRecoveryStatusForRecord(record, kind);
    return Object.freeze({
      schema: CONTRACTS.kernelPanicRecovery,
      id: clampString(input.id, defaults.id || `${defaults.idPrefix || 'xtend.fabric.kernelPanicRecovery'}.${defaults.index != null ? defaults.index + 1 : 'record'}`),
      timestamp: input.timestamp || record.timestamp || record.at || record.completedAt || record.capturedAt || defaults.timestamp || nowIso(defaults.clock),
      source: clampString(input.source, defaults.source || 'rmt-kernel'),
      kind,
      lane: 'diagnostics',
      fiberKind: kernelPanicRecoveryFiberKind(kind),
      status,
      severity: clampString(input.severity || record.severity, status === 'failed' || status === 'active' || status === 'blocked' ? 'error' : 'info'),
      code: normalizeDiagnosticCode(input.code || record.diagnosticCode || record.reasonCode || `rmt.kernel.${kind}`),
      message: clampString(input.message || record.message, `RMT kernel ${kind} record observed.`),
      scope: clampString(input.scope || record.scope, ''),
      quarantineScope: clampString(input.quarantineScope || record.quarantineScope || record.scope, ''),
      panicId: input.panicId || record.panicId || null,
      correlationId: input.correlationId || record.correlationId || defaults.correlationId,
      record: redactValue(record),
      metadata: redactValue({
        ...(asObject(defaults.metadata)),
        ...(asObject(input.metadata)),
        panicRecoverySchema: CONTRACTS.kernelPanicRecovery
      })
    });
  }

  function summarizeKernelPanicRecovery(records = []) {
    const normalizedRecords = (Array.isArray(records) ? records : []).map((record, index) => (
      normalizeKernelPanicRecoveryRecord(record, { index })
    ));
    const summary = {
      schema: CONTRACTS.kernelPanicRecovery,
      recordCount: normalizedRecords.length,
      trustVerdictCount: 0,
      blockedTrustVerdictCount: 0,
      panicEventCount: 0,
      recoveryOutcomeCount: 0,
      recoveredCount: 0,
      failedRecoveryCount: 0,
      safeSnapshotCount: 0,
      quarantineScopeCount: 0,
      quarantineScopes: [],
      lastRecord: normalizedRecords.length > 0 ? normalizedRecords[normalizedRecords.length - 1] : null,
      records: normalizedRecords.slice(-50)
    };

    normalizedRecords.forEach((record) => {
      if (record.kind === 'trustVerdict') {
        summary.trustVerdictCount += 1;
        if (record.status === 'blocked' || record.record && record.record.commitAllowed === false) summary.blockedTrustVerdictCount += 1;
      } else if (record.kind === 'panicEvent') {
        summary.panicEventCount += 1;
      } else if (record.kind === 'recoveryOutcome') {
        summary.recoveryOutcomeCount += 1;
        if (record.status === 'recovered') summary.recoveredCount += 1;
        if (record.status === 'failed') summary.failedRecoveryCount += 1;
      } else if (record.kind === 'safeSnapshot') {
        summary.safeSnapshotCount += 1;
      }
      const scope = record.quarantineScope || record.scope;
      if (scope && !summary.quarantineScopes.includes(scope)) summary.quarantineScopes.push(scope);
    });
    summary.quarantineScopeCount = summary.quarantineScopes.length;
    return Object.freeze(summary);
  }

  function normalizeStreamPressureRecord(recordInput = {}, defaultsInput = {}) {
    const record = asObject(recordInput);
    const defaults = asObject(defaultsInput);
    const score = Number.isFinite(Number(record.score)) ? Number(record.score) : 0;
    const level = backpressureLevelForScore(score, record.level || defaults.level);
    return Object.freeze({
      schema: CONTRACTS.streamPressure,
      id: clampString(record.id, defaults.id || `${defaults.idPrefix || 'xtend.rmt.streamPressure'}.${defaults.index != null ? defaults.index + 1 : 'record'}`),
      timestamp: record.timestamp || defaults.timestamp || nowIso(defaults.clock),
      source: clampString(record.source, defaults.source || 'rmt-app-runtime'),
      phase: clampString(record.phase, record.terminal === true ? 'stream-terminal' : 'stream'),
      streamId: clampString(record.streamId, ''),
      target: clampString(record.target, ''),
      correlationId: record.correlationId || defaults.correlationId,
      patchId: clampString(record.patchId, ''),
      patchType: clampString(record.patchType, ''),
      terminal: record.terminal === true,
      level,
      score: Math.max(score, severityScoreForBackpressureLevel(level)),
      action: record.action || BACKPRESSURE_ACTION_BY_LEVEL[level],
      lane: inferLane('rmt.stream.patch', record.lane || defaults.lane || 'idle'),
      schedulerLane: clampString(record.schedulerLane, 'idle_maintenance'),
      scheduleRef: clampString(record.scheduleRef, 'rmt.stream.patch'),
      patchCount: Number.isFinite(Number(record.patchCount)) ? Number(record.patchCount) : 0,
      deltaCount: Number.isFinite(Number(record.deltaCount)) ? Number(record.deltaCount) : 0,
      finalState: record.finalState || null,
      cancellationReason: clampString(record.cancellationReason, ''),
      metadata: redactValue({
        ...(asObject(defaults.metadata)),
        ...(asObject(record.metadata))
      })
    });
  }

  function normalizeStreamPressureCollection(records = [], defaults = {}) {
    return (Array.isArray(records) ? records : [])
      .map((record, index) => normalizeStreamPressureRecord(record, { ...defaults, index }));
  }

  function normalizeYieldAction(recordInput = {}, defaultsInput = {}) {
    const record = asObject(recordInput);
    const defaults = asObject(defaultsInput);
    return Object.freeze({
      schema: CONTRACTS.yieldAction,
      id: clampString(record.id, defaults.id || `${defaults.idPrefix || 'xtend.rmt.yieldAction'}.${defaults.index != null ? defaults.index + 1 : 'record'}`),
      timestamp: record.timestamp || defaults.timestamp || nowIso(defaults.clock),
      source: clampString(record.source, defaults.source || 'rmt-app-runtime'),
      reason: clampString(record.reason, 'stream-pressure'),
      action: clampString(record.action, 'defer-background-work'),
      lane: clampString(record.lane, 'idle_maintenance'),
      targetLane: clampString(record.targetLane, 'visible'),
      pressureLevel: clampString(record.pressureLevel, ''),
      schedulerPressureLevel: clampString(record.schedulerPressureLevel, ''),
      streamId: clampString(record.streamId, ''),
      patchType: clampString(record.patchType, ''),
      terminal: record.terminal === true,
      scheduleRef: clampString(record.scheduleRef, ''),
      correlationId: record.correlationId || defaults.correlationId,
      metadata: redactValue({
        ...(asObject(defaults.metadata)),
        ...(asObject(record.metadata))
      })
    });
  }

  function summarizeStreamPressure(records = [], yieldActionRecords = []) {
    const normalizedRecords = normalizeStreamPressureCollection(records);
    const normalizedYieldActions = (Array.isArray(yieldActionRecords) ? yieldActionRecords : [])
      .map((record, index) => normalizeYieldAction(record, { index }));
    const summary = {
      schema: CONTRACTS.streamPressure,
      recordCount: normalizedRecords.length,
      terminalCount: 0,
      deltaCount: 0,
      yieldActionCount: normalizedYieldActions.length,
      highestLevel: 'none',
      score: 0,
      actionCounts: {},
      byLevel: {
        none: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byPatchType: {},
      streams: {},
      records: normalizedRecords.slice(-50),
      yieldActions: normalizedYieldActions.slice(-50)
    };

    normalizedRecords.forEach((record) => {
      summary.score += Number(record.score) || 0;
      summary.highestLevel = severityScoreForBackpressureLevel(record.level) > severityScoreForBackpressureLevel(summary.highestLevel)
        ? record.level
        : summary.highestLevel;
      summary.byLevel[record.level] = (summary.byLevel[record.level] || 0) + 1;
      summary.byPatchType[record.patchType] = (summary.byPatchType[record.patchType] || 0) + 1;
      summary.actionCounts[record.action] = (summary.actionCounts[record.action] || 0) + 1;
      if (record.terminal) summary.terminalCount += 1;
      if (record.patchType === 'delta') summary.deltaCount += 1;
      const streamKey = record.streamId || record.correlationId || 'unknown-stream';
      if (!summary.streams[streamKey]) {
        summary.streams[streamKey] = {
          schema: CONTRACTS.streamPressure,
          streamId: streamKey,
          recordCount: 0,
          terminalCount: 0,
          highestLevel: 'none',
          score: 0,
          lastPatchType: ''
        };
      }
      const stream = summary.streams[streamKey];
      stream.recordCount += 1;
      stream.score += Number(record.score) || 0;
      stream.lastPatchType = record.patchType;
      stream.highestLevel = severityScoreForBackpressureLevel(record.level) > severityScoreForBackpressureLevel(stream.highestLevel)
        ? record.level
        : stream.highestLevel;
      if (record.terminal) stream.terminalCount += 1;
    });

    summary.score = Number(summary.score.toFixed(2));
    return Object.freeze(summary);
  }

  function createNoopReporter() {
    return Object.freeze({
      id: 'noop',
      schema: CONTRACTS.reporter,
      kind: 'noop',
      delivery: 'none',
      external: false,
      publish() {},
      flush() {},
      dispose() {}
    });
  }

  function normalizeReporterLevel(level, fallback = 'debug') {
    return Object.prototype.hasOwnProperty.call(REPORTER_LEVEL_ORDER, level) ? level : fallback;
  }

  function shouldPublishForLevel(eventLevel, minimumLevel) {
    const eventValue = REPORTER_LEVEL_ORDER[normalizeReporterLevel(eventLevel, 'info')];
    const minimumValue = REPORTER_LEVEL_ORDER[normalizeReporterLevel(minimumLevel, 'debug')];
    return eventValue >= minimumValue;
  }

  function createReporterAdapter(options = {}) {
    const adapterOptions = asObject(options);
    const sink = adapterOptions.sink || adapterOptions.publish || (adapterOptions.transport && adapterOptions.transport.publish);
    if (typeof sink !== 'function') {
      throw new TypeError('XTend-Fabric reporter adapter requires a sink(event, context) function.');
    }

    const id = clampString(adapterOptions.id, `reporter.${Date.now()}`);
    const kind = clampString(adapterOptions.kind, 'custom');
    const minimumLevel = normalizeReporterLevel(adapterOptions.minimumLevel || adapterOptions.minLevel || 'debug');
    const enabled = adapterOptions.enabled !== false;
    const filter = typeof adapterOptions.filter === 'function' ? adapterOptions.filter : () => true;
    const mapEvent = typeof adapterOptions.mapEvent === 'function' ? adapterOptions.mapEvent : (event) => event;
    const flush = adapterOptions.flush || (adapterOptions.transport && adapterOptions.transport.flush);
    const dispose = adapterOptions.dispose || (adapterOptions.transport && adapterOptions.transport.dispose);

    return Object.freeze({
      id,
      schema: CONTRACTS.reporter,
      kind,
      delivery: clampString(adapterOptions.delivery, 'adapter'),
      external: adapterOptions.external === true,
      minimumLevel,
      capabilities: Array.isArray(adapterOptions.capabilities) ? adapterOptions.capabilities.slice() : ['diagnostics'],
      publish(event, context = {}) {
        if (!enabled) return false;
        if (!shouldPublishForLevel(event && (event.severity || event.level), minimumLevel)) return false;
        if (!filter(event, context)) return false;
        const mapped = mapEvent(event, {
          ...context,
          reporterId: id,
          reporterKind: kind,
          reporterSchema: CONTRACTS.reporter
        });
        const safeEvent = redactDiagnostic(asObject(mapped));
        return sink(safeEvent, {
          ...context,
          reporterId: id,
          reporterKind: kind,
          reporterSchema: CONTRACTS.reporter
        });
      },
      flush(reason) {
        return typeof flush === 'function' ? flush(reason) : undefined;
      },
      dispose() {
        return typeof dispose === 'function' ? dispose() : undefined;
      }
    });
  }

  function createConsoleReporter(options = {}) {
    const reporterOptions = asObject(options);
    const targetConsole = reporterOptions.console || (globalTarget && globalTarget.console);
    const methodByLevel = {
      debug: 'debug',
      info: 'info',
      warn: 'warn',
      error: 'error',
      fatal: 'error',
      ...(reporterOptions.methodByLevel || {})
    };

    return createReporterAdapter({
      id: reporterOptions.id || 'console',
      kind: 'console',
      delivery: 'local-console',
      external: false,
      minimumLevel: reporterOptions.minimumLevel || reporterOptions.minLevel || 'debug',
      filter: reporterOptions.filter,
      mapEvent: reporterOptions.mapEvent,
      capabilities: ['diagnostics', 'local-console'],
      sink(event) {
        if (!targetConsole) return false;
        const method = methodByLevel[normalizeReporterLevel(event.severity || event.level, 'info')] || 'log';
        const writer = typeof targetConsole[method] === 'function' ? targetConsole[method] : targetConsole.log;
        if (typeof writer !== 'function') return false;
        writer.call(targetConsole, event);
        return true;
      }
    });
  }

  function createTestReporter(options = {}) {
    const reporterOptions = asObject(options);
    const events = Array.isArray(reporterOptions.events) ? reporterOptions.events : [];
    const adapter = createReporterAdapter({
      id: reporterOptions.id || 'test',
      kind: 'test',
      delivery: 'memory',
      external: false,
      minimumLevel: reporterOptions.minimumLevel || reporterOptions.minLevel || 'debug',
      filter: reporterOptions.filter,
      mapEvent: reporterOptions.mapEvent,
      capabilities: ['diagnostics', 'memory'],
      sink(event) {
        events.push(event);
        return true;
      },
      flush() {
        return events.slice();
      },
      dispose() {
        if (reporterOptions.clearOnDispose === true) {
          events.splice(0, events.length);
        }
      }
    });

    return Object.freeze({
      ...adapter,
      getEvents() {
        return events.slice();
      },
      clear() {
        events.splice(0, events.length);
      }
    });
  }

  function normalizeReporter(reporter) {
    if (!reporter || typeof reporter.publish !== 'function') {
      throw new TypeError('XTend-Fabric reporter requires a publish(event, context) function.');
    }

    return {
      id: clampString(reporter.id, `reporter.${Date.now()}`),
      schema: clampString(reporter.schema, CONTRACTS.reporter),
      kind: clampString(reporter.kind, 'custom'),
      delivery: clampString(reporter.delivery, 'adapter'),
      external: reporter.external === true,
      capabilities: Array.isArray(reporter.capabilities) ? reporter.capabilities.slice() : ['diagnostics'],
      publish: reporter.publish.bind(reporter),
      flush: typeof reporter.flush === 'function' ? reporter.flush.bind(reporter) : () => {},
      dispose: typeof reporter.dispose === 'function' ? reporter.dispose.bind(reporter) : () => {}
    };
  }

  function normalizeDiagnostic(input = {}, defaults = {}, clock) {
    const event = asObject(input);
    const context = asObject(defaults);
    const severity = ['debug', 'info', 'warn', 'error', 'fatal'].includes(event.severity)
      ? event.severity
      : (['debug', 'info', 'warn', 'error', 'fatal'].includes(event.level) ? event.level : (context.severity || context.level || 'info'));

    return {
      schema: CONTRACTS.diagnostic,
      id: clampString(event.id, `${context.idPrefix || 'fabric.diagnostic'}.${++diagnosticCounter}`),
      timestamp: clampString(event.timestamp, nowIso(clock)),
      level: severity,
      severity,
      code: normalizeDiagnosticCode(event.code, context.code || 'xtend.fabric.diagnostic'),
      message: clampString(event.message, context.message || 'XTend-Fabric diagnostic'),
      source: clampString(event.source, context.source || 'fabric'),
      phase: clampString(event.phase, context.phase || 'diagnose'),
      component: event.component || context.component || event.componentRef || context.componentRef,
      componentRef: event.componentRef || context.componentRef,
      fiberId: event.fiberId || context.fiberId,
      lane: event.lane || context.lane,
      correlationId: event.correlationId || context.correlationId,
      routeRef: event.routeRef || context.routeRef,
      scheduleRef: event.scheduleRef || context.scheduleRef,
      metadata: event.metadata || context.metadata || {},
      cause: event.cause || context.cause
    };
  }

  function inferLane(kind, lane) {
    if (lane && CANONICAL_LANES[lane]) {
      return lane;
    }
    return DEFAULT_LANE_BY_KIND[kind] || 'visible';
  }

  function backpressureLevelForScore(score, explicitLevel) {
    const requestedLevel = clampString(explicitLevel, '');
    if (Object.prototype.hasOwnProperty.call(BACKPRESSURE_SCORE_THRESHOLDS, requestedLevel)) {
      return requestedLevel;
    }
    const numericScore = Number.isFinite(Number(score)) ? Number(score) : 0;
    if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.critical) return 'critical';
    if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.high) return 'high';
    if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.medium) return 'medium';
    if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.low) return 'low';
    return 'none';
  }

  function severityScoreForBackpressureLevel(level) {
    switch (level) {
      case 'critical':
        return 12;
      case 'high':
        return 7;
      case 'medium':
        return 3;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }

  function resolveComponentFiberOperationProfile(operation) {
    const operationName = clampString(operation, 'mount');
    if (COMPONENT_FIBER_OPERATION_PROFILES[operationName]) {
      return COMPONENT_FIBER_OPERATION_PROFILES[operationName];
    }
    return Object.freeze({
      operation: operationName,
      kind: `component.${operationName}`,
      phase: operationName,
      source: 'component',
      lane: DEFAULT_LANE_BY_KIND[`component.${operationName}`] || 'visible',
      scheduleRef: undefined,
      endpointNameHint: undefined,
      diagnosticCode: `xtend.fabric.component.${operationName}.failed`,
      diagnosticMessage: `XTend component ${operationName} failed`,
      coalesceSuffix: operationName
    });
  }

  function resolveRouteFiberOperationProfile(operation) {
    const operationName = clampString(operation, 'render');
    if (ROUTE_FIBER_OPERATION_PROFILES[operationName]) {
      return ROUTE_FIBER_OPERATION_PROFILES[operationName];
    }
    return Object.freeze({
      operation: operationName,
      kind: operationName === 'navigate' ? 'route.navigate' : `route.${operationName}`,
      phase: operationName,
      source: 'router',
      lane: DEFAULT_LANE_BY_KIND[`route.${operationName}`] || 'transition',
      scheduleRef: undefined,
      endpointNameHint: undefined,
      diagnosticCode: `xtend.fabric.route.${operationName}.failed`,
      diagnosticMessage: `XTend route ${operationName} failed`,
      coalesceSuffix: operationName
    });
  }

  function normalizeFiber(input = {}, defaults = {}, clock) {
    const candidate = asObject(input);
    const context = asObject(defaults);
    const kind = clampString(candidate.kind, context.kind || 'app.task');
    const lane = inferLane(kind, candidate.lane || context.lane);

    return {
      schema: CONTRACTS.fiber,
      id: clampString(candidate.id, `${context.idPrefix || 'fiber'}.${++fiberCounter}`),
      kind,
      lane,
      phase: clampString(candidate.phase, context.phase || 'run'),
      status: clampString(candidate.status, context.status || 'planned'),
      source: clampString(candidate.source, context.source || 'app'),
      scope: clampString(candidate.scope, context.scope || kind),
      componentRef: candidate.componentRef || context.componentRef,
      routeRef: candidate.routeRef || context.routeRef,
      scheduleRef: candidate.scheduleRef || context.scheduleRef,
      endpointNameHint: candidate.endpointNameHint || context.endpointNameHint,
      fiberParentId: candidate.fiberParentId || context.fiberParentId,
      correlationId: candidate.correlationId || context.correlationId,
      budgetClass: candidate.budgetClass || context.budgetClass || CANONICAL_LANES[lane].budgetClass,
      deadlineMs: candidate.deadlineMs || context.deadlineMs || CANONICAL_LANES[lane].deadlineMs,
      preferIdle: typeof candidate.preferIdle === 'boolean' ? candidate.preferIdle : CANONICAL_LANES[lane].preferIdle,
      coalesceKey: candidate.coalesceKey || context.coalesceKey,
      startedAt: candidate.startedAt || context.startedAt,
      endedAt: candidate.endedAt || context.endedAt,
      durationMs: candidate.durationMs || context.durationMs,
      result: candidate.result || context.result,
      severity: candidate.severity || context.severity,
      diagnosticCode: candidate.diagnosticCode || context.diagnosticCode,
      diagnosticMessage: candidate.diagnosticMessage || context.diagnosticMessage,
      diagnostics: Array.isArray(candidate.diagnostics) ? candidate.diagnostics.slice() : [],
      metadata: redactValue(candidate.metadata || context.metadata || {})
    };
  }

  function resolveLifecyclePhase(phase) {
    const phaseName = clampString(phase, 'lifecycle');
    if (LIFECYCLE_PHASES[phaseName]) {
      return LIFECYCLE_PHASES[phaseName];
    }
    if (phaseName === 'event' || phaseName === 'event.handler' || phaseName.startsWith('on') || phaseName.startsWith('handle')) {
      return {
        ...LIFECYCLE_PHASES.eventHandler,
        phase: phaseName
      };
    }
    return Object.freeze({
      phase: phaseName,
      fiberKind: `component.${phaseName}`,
      lane: 'visible',
      severity: 'error'
    });
  }

  function createXtendFabric(options = {}) {
    const config = {
      idPrefix: options.idPrefix || 'xtend.fabric',
      storeLimit: Number.isInteger(options.storeLimit) ? options.storeLimit : 200,
      clock: options.clock || options.now,
      includeStack: options.includeStack !== false,
      performance: options.performance || options.performanceTarget || null,
      markPerformance: options.markPerformance !== false,
      window: options.window || (globalTarget && globalTarget.window ? globalTarget.window : null)
    };
    const diagnostics = [];
    const fibers = [];
    const componentTelemetry = [];
    const kernelPanicRecoveryRecords = [];
    const reporters = [createNoopReporter()];
    let telemetrySnapshotCounter = 0;

    function trimStore(store) {
      while (store.length > config.storeLimit) {
        store.shift();
      }
    }

    function dispatchDiagnostic(event) {
      const targetWindow = config.window;
      if (!targetWindow || typeof targetWindow.dispatchEvent !== 'function' || typeof targetWindow.CustomEvent !== 'function') {
        return;
      }
      targetWindow.dispatchEvent(new targetWindow.CustomEvent('xtend-fabric-diagnostic', { detail: event }));
    }

    function emitDiagnostic(event = {}) {
      const normalized = redactDiagnostic(normalizeDiagnostic(event, { idPrefix: config.idPrefix }, config.clock));
      diagnostics.push(normalized);
      trimStore(diagnostics);
      dispatchDiagnostic(normalized);

      reporters.forEach((reporter) => {
        try {
          reporter.publish(normalized, { fabric, reporterId: reporter.id });
        } catch (error) {
          diagnostics.push(redactDiagnostic(normalizeDiagnostic({
            level: 'error',
            code: 'xtend.fabric.reporter.failed',
            message: `Fabric reporter ${reporter.id} failed`,
            source: 'fabric',
            phase: 'report',
            cause: normalizeError(error, { includeStack: config.includeStack })
          }, { idPrefix: config.idPrefix }, config.clock)));
          trimStore(diagnostics);
        }
      });

      return normalized;
    }

    function captureError(error, context = {}) {
      const safeContext = asObject(context);
      return emitDiagnostic({
        level: safeContext.level || 'error',
        severity: safeContext.severity || safeContext.level || 'error',
        code: safeContext.code || 'xtend.fabric.error.captured',
        message: safeContext.message || (error && error.message ? error.message : 'XTend-Fabric captured an error'),
        source: safeContext.source || 'fabric',
        phase: safeContext.phase || 'error',
        componentRef: safeContext.componentRef,
        fiberId: safeContext.fiberId,
        lane: safeContext.lane,
        correlationId: safeContext.correlationId,
        routeRef: safeContext.routeRef,
        scheduleRef: safeContext.scheduleRef,
        metadata: safeContext.metadata || {},
        cause: normalizeError(error, { includeStack: config.includeStack })
      });
    }

    function getPerformanceTarget() {
      return config.performance
        || (config.window && config.window.performance)
        || null;
    }

    function startPerformanceMeasurement(fiber) {
      if (!config.markPerformance) return null;
      const target = getPerformanceTarget();
      const measureName = PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND[fiber.kind];
      if (!target || !measureName || typeof target.mark !== 'function') {
        return null;
      }

      const startMark = `${measureName}.start.${fiber.id}`;
      try {
        target.mark(startMark);
        return { target, measureName, startMark };
      } catch (_) {
        return null;
      }
    }

    function finishPerformanceMeasurement(measurement, fiber) {
      if (!measurement || !measurement.target) return;
      const { target, measureName, startMark } = measurement;
      const endMark = `${measureName}.end.${fiber.id}`;
      try {
        if (typeof target.mark === 'function') {
          target.mark(endMark);
        }
        if (typeof target.measure === 'function') {
          target.measure(measureName, startMark, endMark);
        }
      } catch (_) {
        // Embedded hosts may provide partial Performance APIs; Fibers remain authoritative.
      }
    }

    function finishFiber(fiber, status, result, diagnosticsForFiber = []) {
      const endedAt = nowIso(config.clock);
      const started = Date.parse(fiber.startedAt || endedAt);
      const ended = Date.parse(endedAt);
      const completed = {
        ...fiber,
        status,
        endedAt,
        durationMs: Number.isFinite(started) && Number.isFinite(ended) ? Math.max(0, ended - started) : 0,
        result,
        diagnostics: diagnosticsForFiber
      };
      fibers.push(completed);
      trimStore(fibers);
      return completed;
    }

    function runFiber(fiberInput, callback) {
      if (typeof callback !== 'function') {
        throw new TypeError('fabric.runFiber requires a callback.');
      }

      const runningFiber = normalizeFiber(fiberInput, {
        idPrefix: `${config.idPrefix}.fiber`,
        status: 'running'
      }, config.clock);
      runningFiber.startedAt = runningFiber.startedAt || nowIso(config.clock);
      const performanceMeasurement = startPerformanceMeasurement(runningFiber);

      try {
        const value = callback(runningFiber);
        if (value && typeof value.then === 'function') {
          return value.then((resolved) => {
            const completedFiber = finishFiber(runningFiber, 'completed', 'ok');
            finishPerformanceMeasurement(performanceMeasurement, completedFiber);
            return resolved;
          }, (error) => {
            const diagnostic = captureError(error, {
              code: runningFiber.diagnosticCode || 'xtend.fabric.fiber.failed',
              message: runningFiber.diagnosticMessage || `Fabric fiber ${runningFiber.id} failed`,
              level: runningFiber.severity || 'error',
              severity: runningFiber.severity || 'error',
              source: runningFiber.source,
              phase: runningFiber.phase,
              componentRef: runningFiber.componentRef,
              fiberId: runningFiber.id,
              lane: runningFiber.lane,
              correlationId: runningFiber.correlationId,
              routeRef: runningFiber.routeRef,
              scheduleRef: runningFiber.scheduleRef,
              metadata: runningFiber.metadata
            });
            const failedFiber = finishFiber(runningFiber, 'failed', 'error', [diagnostic]);
            finishPerformanceMeasurement(performanceMeasurement, failedFiber);
            throw error;
          });
        }
        const completedFiber = finishFiber(runningFiber, 'completed', 'ok');
        finishPerformanceMeasurement(performanceMeasurement, completedFiber);
        return value;
      } catch (error) {
        const diagnostic = captureError(error, {
          code: runningFiber.diagnosticCode || 'xtend.fabric.fiber.failed',
          message: runningFiber.diagnosticMessage || `Fabric fiber ${runningFiber.id} failed`,
          level: runningFiber.severity || 'error',
          severity: runningFiber.severity || 'error',
          source: runningFiber.source,
          phase: runningFiber.phase,
          componentRef: runningFiber.componentRef,
          fiberId: runningFiber.id,
          lane: runningFiber.lane,
          correlationId: runningFiber.correlationId,
          routeRef: runningFiber.routeRef,
          scheduleRef: runningFiber.scheduleRef,
          metadata: runningFiber.metadata
        });
        const failedFiber = finishFiber(runningFiber, 'failed', 'error', [diagnostic]);
        finishPerformanceMeasurement(performanceMeasurement, failedFiber);
        throw error;
      }
    }

    function backpressureLevelForScore(score, explicitLevel) {
      const requestedLevel = clampString(explicitLevel, '');
      if (Object.prototype.hasOwnProperty.call(BACKPRESSURE_SCORE_THRESHOLDS, requestedLevel)) {
        return requestedLevel;
      }
      const numericScore = Number.isFinite(Number(score)) ? Number(score) : 0;
      if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.critical) return 'critical';
      if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.high) return 'high';
      if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.medium) return 'medium';
      if (numericScore >= BACKPRESSURE_SCORE_THRESHOLDS.low) return 'low';
      return 'none';
    }

    function severityScoreForBackpressureLevel(level) {
      switch (level) {
        case 'critical':
          return 12;
        case 'high':
          return 7;
        case 'medium':
          return 3;
        case 'low':
          return 1;
        default:
          return 0;
      }
    }

    function createBackpressureSignal(signalInput = {}, signalDefaults = {}) {
      const signal = asObject(signalInput);
      const defaults = asObject(signalDefaults);
      const lane = inferLane(signal.kind || defaults.kind || 'diagnostics.snapshot', signal.lane || defaults.lane);
      const score = Number.isFinite(Number(signal.score))
        ? Number(signal.score)
        : Number.isFinite(Number(defaults.score)) ? Number(defaults.score) : 0;
      const level = backpressureLevelForScore(score, signal.level || defaults.level);
      return Object.freeze({
        schema: CONTRACTS.backpressureSignal,
        id: clampString(signal.id, `${config.idPrefix}.backpressure.${++telemetrySnapshotCounter}`),
        timestamp: signal.timestamp || nowIso(config.clock),
        level,
        score: Math.max(score, severityScoreForBackpressureLevel(level)),
        action: signal.action || defaults.action || BACKPRESSURE_ACTION_BY_LEVEL[level],
        lane,
        source: clampString(signal.source, defaults.source || 'fabric'),
        reason: clampString(signal.reason, defaults.reason || 'backpressure'),
        componentRef: signal.componentRef || defaults.componentRef,
        routeRef: signal.routeRef || defaults.routeRef,
        scheduleRef: signal.scheduleRef || defaults.scheduleRef,
        fiberId: signal.fiberId || defaults.fiberId,
        correlationId: signal.correlationId || defaults.correlationId,
        metadata: redactValue(signal.metadata || defaults.metadata || {})
      });
    }

    function recordComponentTelemetry(recordInput = {}, defaultsInput = {}) {
      const input = asObject(recordInput);
      const record = normalizeComponentLifecycleTelemetry(input, {
        idPrefix: `${config.idPrefix}.componentTelemetry`,
        id: input.id || `${config.idPrefix}.componentTelemetry.${++telemetrySnapshotCounter}`,
        clock: config.clock,
        source: input.source || 'fabric',
        ...asObject(defaultsInput)
      });
      componentTelemetry.push(record);
      trimStore(componentTelemetry);
      return record;
    }

    function recordKernelPanicRecovery(recordInput = {}, defaultsInput = {}) {
      const input = asObject(recordInput);
      const record = normalizeKernelPanicRecoveryRecord(input, {
        idPrefix: `${config.idPrefix}.kernelPanicRecovery`,
        id: input.id || `${config.idPrefix}.kernelPanicRecovery.${++telemetrySnapshotCounter}`,
        clock: config.clock,
        ...asObject(defaultsInput)
      });
      kernelPanicRecoveryRecords.push(record);
      trimStore(kernelPanicRecoveryRecords);

      const diagnostic = emitDiagnostic({
        level: record.severity,
        severity: record.severity,
        code: record.code,
        message: record.message,
        source: record.source,
        phase: 'panic-recovery',
        lane: 'diagnostics',
        correlationId: record.correlationId,
        metadata: {
          kernelPanicRecovery: record,
          kind: record.kind,
          status: record.status,
          scope: record.scope,
          quarantineScope: record.quarantineScope,
          panicId: record.panicId
        }
      });
      const fiber = normalizeFiber({
        kind: record.fiberKind,
        lane: 'diagnostics',
        phase: 'panic-recovery',
        status: record.status === 'failed' || record.status === 'blocked' || record.status === 'active' ? 'failed' : 'completed',
        source: record.source,
        scope: record.scope || record.kind,
        correlationId: record.correlationId,
        diagnosticCode: record.code,
        diagnosticMessage: record.message,
        diagnostics: [diagnostic],
        metadata: {
          kernelPanicRecovery: record
        }
      }, {
        idPrefix: config.idPrefix,
        source: 'rmt-kernel',
        lane: 'diagnostics'
      }, config.clock);
      fibers.push(fiber);
      trimStore(fibers);
      return record;
    }

    function numericDuration(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    }

    function createLaneTelemetrySummary(laneId) {
      const lane = CANONICAL_LANES[laneId] || CANONICAL_LANES.visible;
      return {
        schema: CONTRACTS.lane,
        lane: laneId,
        priority: lane.priority,
        budgetClass: lane.budgetClass,
        deadlineMs: lane.deadlineMs,
        preferIdle: lane.preferIdle,
        fiberCount: 0,
        completedCount: 0,
        failedCount: 0,
        lifecycleCount: 0,
        cleanupCount: 0,
        tombstoneCount: 0,
        budgetMissCount: 0,
        durationMs: 0,
        cleanupDurationMs: 0,
        maxDurationMs: 0,
        averageDurationMs: 0,
        scheduleRefs: []
      };
    }

    function summarizeFibersForTelemetry(fiberRecords = []) {
      const lanes = {};
      Object.keys(CANONICAL_LANES).forEach((laneId) => {
        lanes[laneId] = createLaneTelemetrySummary(laneId);
      });
      const totals = {
        fiberCount: 0,
        completedCount: 0,
        failedCount: 0,
        lifecycleCount: 0,
        cleanupCount: 0,
        tombstoneCount: 0,
        budgetMissCount: 0,
        durationMs: 0,
        cleanupDurationMs: 0,
        maxDurationMs: 0,
        averageDurationMs: 0
      };

      fiberRecords.forEach((fiberRecord) => {
        const fiber = asObject(fiberRecord);
        const laneId = inferLane(fiber.kind, fiber.lane);
        const lane = lanes[laneId] || (lanes[laneId] = createLaneTelemetrySummary(laneId));
        const durationMs = numericDuration(fiber.durationMs);
        const deadlineMs = Number.isFinite(Number(fiber.deadlineMs))
          ? Number(fiber.deadlineMs)
          : (CANONICAL_LANES[laneId] || CANONICAL_LANES.visible).deadlineMs;
        const budgetMiss = durationMs > deadlineMs;
        const kind = clampString(fiber.kind, '');
        const isLifecycle = kind.startsWith('component.') || kind.startsWith('surface.') || kind.startsWith('resource.');
        const isCleanup = ['component.unmount', 'component.dispose', 'surface.destroy', 'surface.cleanup', 'resource.release'].includes(kind);
        const tombstoneCount = Number.isFinite(Number(fiber.tombstoneCount))
          ? Math.max(0, Number(fiber.tombstoneCount))
          : (kind === 'surface.destroy' && fiber.tombstone ? 1 : 0);

        lane.fiberCount += 1;
        lane.durationMs += durationMs;
        lane.maxDurationMs = Math.max(lane.maxDurationMs, durationMs);
        if (fiber.status === 'failed') lane.failedCount += 1;
        if (fiber.status === 'completed') lane.completedCount += 1;
        if (isLifecycle) lane.lifecycleCount += 1;
        if (isCleanup) {
          lane.cleanupCount += 1;
          lane.cleanupDurationMs += durationMs;
        }
        lane.tombstoneCount += tombstoneCount;
        if (budgetMiss) lane.budgetMissCount += 1;
        if (fiber.scheduleRef && !lane.scheduleRefs.includes(fiber.scheduleRef)) {
          lane.scheduleRefs.push(fiber.scheduleRef);
        }

        totals.fiberCount += 1;
        totals.durationMs += durationMs;
        totals.maxDurationMs = Math.max(totals.maxDurationMs, durationMs);
        if (fiber.status === 'failed') totals.failedCount += 1;
        if (fiber.status === 'completed') totals.completedCount += 1;
        if (isLifecycle) totals.lifecycleCount += 1;
        if (isCleanup) {
          totals.cleanupCount += 1;
          totals.cleanupDurationMs += durationMs;
        }
        totals.tombstoneCount += tombstoneCount;
        if (budgetMiss) totals.budgetMissCount += 1;
      });

      Object.keys(lanes).forEach((laneId) => {
        const lane = lanes[laneId];
        lane.averageDurationMs = lane.fiberCount > 0 ? Number((lane.durationMs / lane.fiberCount).toFixed(2)) : 0;
      });
      totals.averageDurationMs = totals.fiberCount > 0 ? Number((totals.durationMs / totals.fiberCount).toFixed(2)) : 0;

      return { lanes, totals };
    }

    function collectBackpressureSignals(fiberRecords = [], diagnosticRecords = [], snapshotOptions = {}) {
      const options = asObject(snapshotOptions);
      const signals = [];

      fiberRecords.forEach((fiberRecord) => {
        const fiber = asObject(fiberRecord);
        const durationMs = numericDuration(fiber.durationMs);
        const lane = inferLane(fiber.kind, fiber.lane);
        const deadlineMs = Number.isFinite(Number(fiber.deadlineMs))
          ? Number(fiber.deadlineMs)
          : (CANONICAL_LANES[lane] || CANONICAL_LANES.visible).deadlineMs;
        const base = {
          lane,
          fiberId: fiber.id,
          componentRef: fiber.componentRef,
          routeRef: fiber.routeRef,
          scheduleRef: fiber.scheduleRef,
          correlationId: fiber.correlationId,
          metadata: {
            kind: fiber.kind,
            phase: fiber.phase,
            durationMs,
            deadlineMs
          }
        };

        if (fiber.status === 'failed') {
          signals.push(createBackpressureSignal({
            ...base,
            source: fiber.source || 'fiber',
            reason: 'fiber-failed',
            score: 4,
            level: 'medium'
          }));
        }

        if (durationMs > deadlineMs) {
          const overshootRatio = deadlineMs > 0 ? durationMs / deadlineMs : durationMs;
          signals.push(createBackpressureSignal({
            ...base,
            source: fiber.source || 'fiber',
            reason: 'deadline-exceeded',
            score: Math.max(1, Math.ceil(overshootRatio)),
            level: overshootRatio >= 3 ? 'high' : 'medium'
          }));
        }

        const signalMetadata = asObject(fiber.metadata).backpressureSignal;
        if (signalMetadata) {
          signals.push(createBackpressureSignal(
            typeof signalMetadata === 'object' ? signalMetadata : { reason: String(signalMetadata) },
            {
              ...base,
              source: fiber.source || 'fiber',
              reason: 'fiber-backpressure-signal',
              score: 2
            }
          ));
        }
      });

      diagnosticRecords.forEach((record) => {
        const diagnostic = asObject(record);
        const metadata = asObject(diagnostic.metadata);
        const signal = diagnostic.backpressureSignal || metadata.backpressureSignal || metadata.metadata && metadata.metadata.backpressureSignal;
        if (signal) {
          signals.push(createBackpressureSignal(
            typeof signal === 'object' ? signal : { reason: String(signal) },
            {
              source: diagnostic.source || 'diagnostic',
              lane: diagnostic.lane || metadata.lane,
              reason: 'diagnostic-backpressure-signal',
              score: 2,
              componentRef: diagnostic.componentRef || metadata.componentRef,
              routeRef: diagnostic.routeRef || metadata.routeRef || metadata.routeId,
              scheduleRef: diagnostic.scheduleRef || metadata.scheduleRef,
              fiberId: diagnostic.fiberId || metadata.fiberId,
              correlationId: diagnostic.correlationId || metadata.correlationId,
              metadata: {
                diagnosticCode: diagnostic.code
              }
            }
          ));
        }
      });

      const componentTelemetryRecords = normalizeComponentLifecycleTelemetryCollection(
        options.componentTelemetry || options.componentLifecycle || options.componentLifecycleTelemetry,
        {
          idPrefix: `${config.idPrefix}.componentTelemetry`,
          clock: config.clock
        }
      );
      componentTelemetryRecords.forEach((record) => {
        const lane = inferLane(record.fiberKind || 'component.update', record.fabricLane || record.rmtLane);
        const laneDeadline = (CANONICAL_LANES[lane] || CANONICAL_LANES.visible).deadlineMs;
        const base = {
          lane,
          componentRef: record.componentId,
          routeRef: record.routeRef,
          scheduleRef: record.scheduleRef,
          fiberId: record.fiberKind,
          correlationId: record.correlationId,
          metadata: {
            operation: record.operation,
            phase: record.phase,
            durationMs: record.durationMs,
            deadlineMs: laneDeadline,
            telemetryId: record.id
          }
        };

        if (record.status === 'failed') {
          signals.push(createBackpressureSignal({
            ...base,
            source: record.source || 'component-telemetry',
            reason: 'component-lifecycle-failed',
            score: 4,
            level: 'medium'
          }));
        }

        if (record.durationMs > laneDeadline) {
          const overshootRatio = laneDeadline > 0 ? record.durationMs / laneDeadline : record.durationMs;
          signals.push(createBackpressureSignal({
            ...base,
            source: record.source || 'component-telemetry',
            reason: 'component-lifecycle-deadline-exceeded',
            score: Math.max(1, Math.ceil(overshootRatio)),
            level: overshootRatio >= 3 ? 'high' : 'medium'
          }));
        }

        if (record.backpressureSignal) {
          signals.push(createBackpressureSignal(record.backpressureSignal, {
            ...base,
            source: record.source || 'component-telemetry',
            reason: 'component-lifecycle-backpressure-signal',
            score: 2
          }));
        }
      });

      const streamPressureRecords = normalizeStreamPressureCollection(options.streamPressureRecords || options.streamPressure, {
        idPrefix: `${config.idPrefix}.streamPressure`,
        clock: config.clock,
        correlationId: options.correlationId
      });
      streamPressureRecords.forEach((record) => {
        if (record.terminal !== true && severityScoreForBackpressureLevel(record.level) < severityScoreForBackpressureLevel('high')) return;
        signals.push(createBackpressureSignal({
          source: record.source || 'rmt-app-runtime',
          reason: record.terminal ? 'stream-terminal' : 'stream-pressure',
          lane: record.lane || 'idle',
          score: record.score,
          level: record.level,
          action: record.action,
          scheduleRef: record.scheduleRef,
          correlationId: record.correlationId,
          metadata: {
            streamId: record.streamId,
            patchType: record.patchType,
            terminal: record.terminal,
            schedulerLane: record.schedulerLane
          }
        }));
      });

      if (Array.isArray(options.backpressureSignals)) {
        options.backpressureSignals.forEach((signal) => {
          signals.push(createBackpressureSignal(signal, { source: 'snapshot-options' }));
        });
      }

      return signals;
    }

    function createBackpressureSummary(signals = [], laneSummaries = {}) {
      const byLane = {};
      Object.keys(CANONICAL_LANES).forEach((laneId) => {
        const lane = laneSummaries[laneId] || {};
        const laneScore = (lane.failedCount || 0) * 4 + (lane.budgetMissCount || 0) * 2;
        byLane[laneId] = {
          schema: CONTRACTS.backpressureSignal,
          lane: laneId,
          score: laneScore,
          level: backpressureLevelForScore(laneScore),
          action: BACKPRESSURE_ACTION_BY_LEVEL[backpressureLevelForScore(laneScore)],
          signalCount: 0
        };
      });

      let score = 0;
      signals.forEach((signal) => {
        const safeSignal = asObject(signal);
        const laneId = inferLane('diagnostics.snapshot', safeSignal.lane);
        if (!byLane[laneId]) {
          byLane[laneId] = {
            schema: CONTRACTS.backpressureSignal,
            lane: laneId,
            score: 0,
            level: 'none',
            action: BACKPRESSURE_ACTION_BY_LEVEL.none,
            signalCount: 0
          };
        }
        byLane[laneId].score += numericDuration(safeSignal.score);
        byLane[laneId].signalCount += 1;
        score += numericDuration(safeSignal.score);
      });

      Object.keys(byLane).forEach((laneId) => {
        const lane = byLane[laneId];
        lane.level = backpressureLevelForScore(lane.score);
        lane.action = BACKPRESSURE_ACTION_BY_LEVEL[lane.level];
      });

      const level = backpressureLevelForScore(score);
      return {
        schema: CONTRACTS.backpressureSignal,
        level,
        score,
        action: BACKPRESSURE_ACTION_BY_LEVEL[level],
        signalCount: signals.length,
        signals: signals.slice(-20),
        byLane
      };
    }

    function summarizeKernelPerformanceFileArtifact(fileArtifact) {
      if (!fileArtifact || typeof fileArtifact !== 'object') return null;
      return {
        kind: fileArtifact.kind || 'rmt_performance_file_artifact',
        artifactId: fileArtifact.artifactId || '',
        artifactType: fileArtifact.artifactType || '',
        fileName: fileArtifact.fileName || '',
        contentType: fileArtifact.contentType || 'application/json',
        bytes: typeof fileArtifact.text === 'string' ? fileArtifact.text.length : 0,
        payloadKind: fileArtifact.payload && fileArtifact.payload.kind || ''
      };
    }

    function readKernelPerformanceRuntimeSnapshot(snapshotOptions = {}) {
      const options = asObject(snapshotOptions);
      const runtime = options.kernelPerformanceRuntime
        || options.rmtPerformanceRuntime
        || (options.performanceRuntime && typeof options.performanceRuntime.getSnapshot === 'function' ? options.performanceRuntime : null)
        || null;
      if (!runtime || typeof runtime.getSnapshot !== 'function') {
        return {
          supported: false,
          snapshot: null,
          budgetSnapshot: null,
          backpressureProfile: null,
          ciSummary: null,
          fileArtifact: null,
          baselineComparison: null,
          diagnostics: []
        };
      }

      const diagnostics = [];
      function guarded(label, fallback, callback) {
        try {
          return callback();
        } catch (error) {
          diagnostics.push({
            code: `xtend.fabric.kernel_performance.${label}_failed`,
            message: error && error.message ? error.message : String(error)
          });
          return fallback;
        }
      }

      const snapshot = guarded('snapshot', null, () => runtime.getSnapshot('fabric.telemetry.snapshot'));
      const budgetSnapshot = typeof runtime.evaluateBudgets === 'function'
        ? guarded('budgets', null, () => runtime.evaluateBudgets('fabric.telemetry.snapshot'))
        : null;
      const backpressureProfile = typeof runtime.getBackpressureProfile === 'function'
        ? guarded('backpressure', snapshot && snapshot.backpressureProfile || null, () => runtime.getBackpressureProfile('fabric.telemetry.snapshot'))
        : (snapshot && snapshot.backpressureProfile || null);
      const runReport = typeof runtime.exportRunReport === 'function'
        ? guarded('run_report', null, () => runtime.exportRunReport('fabric.telemetry.snapshot', {
            runId: `${config.idPrefix}.kernel-performance`,
            label: 'XTend Fabric Kernel Performance'
          }))
        : null;
      const baseline = runReport && typeof runtime.createRunBaseline === 'function'
        ? guarded('baseline', null, () => runtime.createRunBaseline([runReport], {
            baselineId: `${config.idPrefix}.kernel-performance.baseline`,
            label: 'XTend Fabric Kernel Performance Baseline'
          }))
        : null;
      const baselineComparison = runReport && baseline && typeof runtime.compareRunReportToBaseline === 'function'
        ? guarded('baseline_comparison', null, () => runtime.compareRunReportToBaseline(runReport, baseline, {
            label: 'XTend Fabric Kernel Performance Baseline Comparison'
          }))
        : null;
      const ciSummary = runReport && typeof runtime.createCiSummary === 'function'
        ? guarded('ci_summary', null, () => runtime.createCiSummary(runReport, {
            summaryId: `${config.idPrefix}.kernel-performance.summary`,
            title: 'XTend Fabric Kernel Performance Summary'
          }))
        : null;
      const fileArtifact = runReport && typeof runtime.createFileArtifact === 'function'
        ? guarded('file_artifact', null, () => summarizeKernelPerformanceFileArtifact(runtime.createFileArtifact(runReport, {
            artifactId: `${config.idPrefix}.kernel-performance.artifact`,
            artifactType: 'run_report',
            fileName: 'xtend.fabric.kernel-performance.json'
          })))
        : null;

      return {
        supported: true,
        snapshot,
        budgetSnapshot,
        backpressureProfile,
        ciSummary,
        fileArtifact,
        baselineComparison,
        diagnostics,
        budgetViolationCount: budgetSnapshot && Array.isArray(budgetSnapshot.violations) ? budgetSnapshot.violations.length : 0,
        pressureLevel: backpressureProfile && backpressureProfile.pressureLevel || snapshot && snapshot.pressureLevel || 'normal'
      };
    }

    function readPrewarmWorkerTopologySnapshot(snapshotOptions = {}) {
      const options = asObject(snapshotOptions);
      const explicitTopology = options.prewarmWorkerTopology || options.prewarmWorker;
      if (explicitTopology && typeof explicitTopology === 'object' && explicitTopology.schema === CONTRACTS.prewarmWorkerTopology) {
        return redactValue(explicitTopology);
      }

      const runtime = options.prewarmWorkerRuntime
        || options.rmtPrewarmWorkerRuntime
        || options.kernelRuntime
        || options.rmtRuntime
        || (options.runtime && typeof options.runtime.getPrewarmWorkerTopology === 'function' ? options.runtime : null)
        || null;
      if (runtime && typeof runtime.getPrewarmWorkerTopology === 'function') {
        try {
          const topology = runtime.getPrewarmWorkerTopology();
          if (topology && typeof topology === 'object') return redactValue(topology);
        } catch (error) {
          return {
            schema: CONTRACTS.prewarmWorkerTopology,
            kind: 'rmt-prewarm',
            enabled: options.enablePrewarmWorker === true,
            status: 'degraded',
            health: 'degraded',
            reason: 'topology_read_failed',
            workerName: options.prewarmWorkerName || 'XTendRMTPrewarmWorker',
            workerType: options.prewarmWorkerType || 'classic',
            pendingJobs: 0,
            submittedJobs: 0,
            templatesSynced: 0,
            available: false,
            missingApis: [],
            lastHealthAt: 0,
            lastError: {
              name: error && error.name || 'Error',
              message: error && error.message || String(error)
            },
            responsibilities: ['template_prerender_compute', 'chunk_serialization'],
            supportedSignals: ['start', 'continue', 'rebatch'],
            excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership'],
            diagnostics: [{
              code: 'xtend.fabric.prewarm_worker.topology_failed',
              severity: 'warning',
              message: 'XTend-Fabric could not read RMT Prewarm Worker topology.'
            }]
          };
        }
      }

      return {
        schema: CONTRACTS.prewarmWorkerTopology,
        kind: 'rmt-prewarm',
        enabled: options.enablePrewarmWorker === true,
        status: options.enablePrewarmWorker === true ? 'degraded' : 'disabled',
        health: options.enablePrewarmWorker === true ? 'degraded' : 'disabled',
        reason: options.enablePrewarmWorker === true ? 'runtime_unavailable' : 'disabled',
        workerName: options.prewarmWorkerName || 'XTendRMTPrewarmWorker',
        workerType: options.prewarmWorkerType || 'classic',
        pendingJobs: 0,
        submittedJobs: 0,
        templatesSynced: 0,
        available: false,
        missingApis: [],
        lastHealthAt: 0,
        lastError: null,
        responsibilities: ['template_prerender_compute', 'chunk_serialization'],
        supportedSignals: ['start', 'continue', 'rebatch'],
        excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership'],
        diagnostics: []
      };
    }

    function readPerformanceRuntimeSnapshot(snapshotOptions = {}) {
      const options = asObject(snapshotOptions);
      const target = options.performance
        || options.performanceTarget
        || (config.window && config.window.performance)
        || (globalTarget && globalTarget.performance)
        || null;
      const kernelRuntime = readKernelPerformanceRuntimeSnapshot(options);
      const entryLimit = Number.isInteger(options.performanceEntryLimit) ? options.performanceEntryLimit : 20;
      const prefix = Object.prototype.hasOwnProperty.call(options, 'performancePrefix')
        ? options.performancePrefix
        : 'xtend.';
      let entries = Array.isArray(options.performanceEntries) ? options.performanceEntries.slice() : [];

      if (target && typeof target.getEntriesByType === 'function') {
        ['mark', 'measure'].forEach((type) => {
          try {
            entries = entries.concat(target.getEntriesByType(type) || []);
          } catch (_) {
            // Performance targets in tests or embedded hosts may expose partial APIs.
          }
        });
      } else if (target && typeof target.getEntries === 'function') {
        try {
          entries = entries.concat(target.getEntries() || []);
        } catch (_) {
          // Ignore partial host performance APIs.
        }
      }

      const normalizedEntries = entries
        .map((entry) => asObject(entry))
        .filter((entry) => !prefix || String(entry.name || '').startsWith(prefix))
        .map(normalizePerformanceEntry);

      const slicedEntries = normalizedEntries.slice(-entryLimit);
      const measurements = slicedEntries.map((entry, index) => createPerformanceMeasurement(entry, options, index));
      const phaseSummary = summarizePerformanceMeasurements(measurements);
      const totalDurationMs = slicedEntries.reduce((total, entry) => total + numericDuration(entry.duration), 0);
      const maxDurationMs = slicedEntries.reduce((max, entry) => Math.max(max, numericDuration(entry.duration)), 0);

      return {
        supported: !!target || entries.length > 0,
        entryCount: normalizedEntries.length,
        entries: slicedEntries,
        measurementSchema: CONTRACTS.performanceMeasurement,
        measurementCount: measurements.length,
        measurements,
        phaseSummary,
        totalDurationMs: Number(totalDurationMs.toFixed(2)),
        maxDurationMs: Number(maxDurationMs.toFixed(2)),
        kernelRuntime,
        kernelSnapshot: kernelRuntime.snapshot,
        budgetSnapshot: kernelRuntime.budgetSnapshot,
        backpressureProfile: kernelRuntime.backpressureProfile,
        ciSummary: kernelRuntime.ciSummary,
        fileArtifact: kernelRuntime.fileArtifact,
        baselineComparison: kernelRuntime.baselineComparison
      };
    }

    function recordSnapshotWithRmtBridge(snapshot, snapshotOptions = {}) {
      const options = asObject(snapshotOptions);
      const target = options.rmtTelemetryBridge
        || options.rmtBridge
        || options.rmt
        || (options.runtimeBridge && typeof options.runtimeBridge.recordTelemetrySnapshot === 'function' ? options.runtimeBridge : null);
      if (!target || typeof target.recordTelemetrySnapshot !== 'function' || options.recordRmtTelemetry === false) {
        return null;
      }
      try {
        return target.recordTelemetrySnapshot(snapshot, {
          xstate: options.xstate,
          diagnosticsHub: options.diagnosticsHub,
          scheduler: options.scheduler,
          schedule: options.schedule,
          scheduleRef: options.scheduleRef || 'diagnostics.snapshot',
          endpointName: options.endpointName || 'xtendrmt.diagnostics.snapshot',
          scope: options.scope || 'fabric.telemetry.snapshot',
          routeRef: options.routeRef || snapshot.routeRef || (snapshot.metadata && snapshot.metadata.activeRoute),
          correlationId: options.correlationId || snapshot.correlationId,
          source: options.source || snapshot.source || 'fabric',
          metadata: {
            bridge: options.bridge,
            snapshotId: snapshot.id
          }
        });
      } catch (error) {
        return emitDiagnostic({
          level: 'warn',
          code: 'xtend.fabric.rmt.telemetry.failed',
          message: 'XTend-Fabric could not forward telemetry snapshot to XTendRMT.',
          source: 'fabric',
          phase: 'telemetry',
          lane: 'diagnostics',
          correlationId: snapshot.correlationId || options.correlationId,
          metadata: {
            snapshotId: snapshot.id,
            error: error && error.message ? error.message : String(error)
          }
        });
      }
    }

    function createTelemetrySnapshot(snapshotOptions = {}) {
      const options = asObject(snapshotOptions);
      const snapshotFibers = Array.isArray(options.fibers) ? options.fibers.slice() : fibers.slice();
      const snapshotDiagnostics = Array.isArray(options.diagnostics) ? options.diagnostics.slice() : diagnostics.slice();
      const appRuntime = options.appRuntime || options.rmtAppRuntime || null;
      let appRuntimePerformance = null;
      if (appRuntime && typeof appRuntime.getPerformanceTelemetrySnapshot === 'function') {
        try {
          appRuntimePerformance = appRuntime.getPerformanceTelemetrySnapshot();
        } catch (_) {
          appRuntimePerformance = null;
        }
      }
      const componentTelemetryInput = Array.isArray(options.componentTelemetry)
        ? options.componentTelemetry
        : (Array.isArray(options.componentLifecycle)
          ? options.componentLifecycle
          : (Array.isArray(options.componentLifecycleTelemetry) ? options.componentLifecycleTelemetry : componentTelemetry.slice()));
      const componentTelemetryRecords = normalizeComponentLifecycleTelemetryCollection(
        componentTelemetryInput,
        {
          idPrefix: `${config.idPrefix}.componentTelemetry`,
          clock: config.clock,
          correlationId: options.correlationId
        }
      );
      const kernelPanicRecoveryInput = Array.isArray(options.kernelPanicRecovery)
        ? options.kernelPanicRecovery
        : (Array.isArray(options.kernelPanicRecoveryRecords) ? options.kernelPanicRecoveryRecords : kernelPanicRecoveryRecords.slice());
      const kernelPanicRecoverySummary = summarizeKernelPanicRecovery(kernelPanicRecoveryInput);
      const streamPressureRecords = Array.isArray(options.streamPressureRecords)
        ? options.streamPressureRecords
        : (Array.isArray(options.streamPressure)
          ? options.streamPressure
          : (appRuntime && typeof appRuntime.listStreamPressureRecords === 'function'
            ? appRuntime.listStreamPressureRecords()
            : (appRuntimePerformance && Array.isArray(appRuntimePerformance.streamPressureRecords) ? appRuntimePerformance.streamPressureRecords : [])));
      const yieldActionRecords = Array.isArray(options.yieldActions)
        ? options.yieldActions
        : (appRuntime && typeof appRuntime.listYieldActions === 'function'
          ? appRuntime.listYieldActions()
          : (appRuntimePerformance && Array.isArray(appRuntimePerformance.yieldActions) ? appRuntimePerformance.yieldActions : []));
      const streamPressureSummary = summarizeStreamPressure(streamPressureRecords, yieldActionRecords);
      const fiberSummary = summarizeFibersForTelemetry(snapshotFibers);
      const signals = collectBackpressureSignals(snapshotFibers, snapshotDiagnostics, {
        ...options,
        componentTelemetry: componentTelemetryRecords,
        streamPressureRecords
      });
      const runtimeBridge = options.runtimeBridge || options.bridge || null;
      const runtimeSnapshot = runtimeBridge && typeof runtimeBridge.getSnapshot === 'function'
        ? runtimeBridge.getSnapshot({ source: 'telemetry-snapshot' })
        : options.runtimeSnapshot;

      const snapshot = Object.freeze({
        schema: CONTRACTS.telemetrySnapshot,
        id: clampString(options.id, `${config.idPrefix}.telemetry.${++telemetrySnapshotCounter}`),
        timestamp: options.timestamp || nowIso(config.clock),
        source: clampString(options.source, 'fabric'),
        correlationId: options.correlationId,
        fiberCount: snapshotFibers.length,
        diagnosticCount: snapshotDiagnostics.length,
        reporterCount: reporters.length,
        totals: fiberSummary.totals,
        lanes: fiberSummary.lanes,
        componentTelemetry: summarizeComponentLifecycleTelemetry(componentTelemetryRecords),
        panicRecovery: kernelPanicRecoverySummary,
        streamPressure: streamPressureSummary,
        backpressure: createBackpressureSummary(signals, fiberSummary.lanes),
        performance: readPerformanceRuntimeSnapshot(options),
        prewarmWorker: readPrewarmWorkerTopologySnapshot(options),
        runtime: runtimeSnapshot || null,
        metadata: redactValue(options.metadata || {})
      });
      recordSnapshotWithRmtBridge(snapshot, options);
      return snapshot;
    }

    function publishTelemetrySnapshot(snapshotOrOptions = {}, publishOptions = {}) {
      const options = asObject(publishOptions);
      const snapshot = snapshotOrOptions && snapshotOrOptions.schema === CONTRACTS.telemetrySnapshot
        ? snapshotOrOptions
        : createTelemetrySnapshot(snapshotOrOptions);
      if (options.rmtBridge || options.rmtTelemetryBridge || options.rmt) {
        recordSnapshotWithRmtBridge(snapshot, options);
      }
      const level = options.level
        || (snapshot.backpressure.level === 'critical' || snapshot.backpressure.level === 'high' ? 'warn' : 'info');
      return emitDiagnostic({
        level,
        code: options.code || 'xtend.fabric.telemetry.snapshot',
        message: options.message || 'XTend-Fabric telemetry snapshot exported.',
        source: 'fabric',
        phase: 'telemetry',
        lane: 'diagnostics',
        correlationId: snapshot.correlationId || options.correlationId,
        metadata: {
          telemetrySnapshot: snapshot,
          snapshotId: snapshot.id,
          backpressureLevel: snapshot.backpressure.level,
          backpressureScore: snapshot.backpressure.score
        }
      });
    }

    function createComponentFiberInstrumentation(componentRef, instrumentationOptions = {}) {
      const options = asObject(instrumentationOptions);
      const resolvedComponentRef = clampString(componentRef || options.componentRef || options.tag, 'xtend.component');
      const baseScope = clampString(options.scope, resolvedComponentRef);
      const swallowErrors = options.swallowErrors === true;
      const fallbackValue = Object.prototype.hasOwnProperty.call(options, 'fallbackValue')
        ? options.fallbackValue
        : undefined;

      function optionFor(operation, suffix, fallback) {
        const key = `${operation}${suffix}`;
        return Object.prototype.hasOwnProperty.call(options, key) ? options[key] : fallback;
      }

      function createFiberInput(operation, metadata = {}) {
        const profile = resolveComponentFiberOperationProfile(operation);
        const safeMetadata = asObject(metadata);
        const lane = inferLane(
          safeMetadata.kind || profile.kind,
          safeMetadata.lane || optionFor(profile.operation, 'Lane', options.lane || profile.lane)
        );
        const scheduleRef = safeMetadata.scheduleRef
          || optionFor(profile.operation, 'ScheduleRef', options.scheduleRef || profile.scheduleRef);
        const endpointNameHint = safeMetadata.endpointNameHint
          || optionFor(profile.operation, 'EndpointNameHint', options.endpointNameHint || profile.endpointNameHint);
        const coalesceKey = safeMetadata.coalesceKey
          || optionFor(profile.operation, 'CoalesceKey', options.coalesceKey || `${resolvedComponentRef}.${profile.coalesceSuffix}`);
        const scope = safeMetadata.scope || optionFor(profile.operation, 'Scope', `${baseScope}.${profile.operation}`);

        return {
          kind: safeMetadata.kind || profile.kind,
          lane,
          phase: safeMetadata.phase || profile.phase,
          source: safeMetadata.source || profile.source,
          scope,
          componentRef: safeMetadata.componentRef || resolvedComponentRef,
          routeRef: safeMetadata.routeRef || options.routeRef,
          scheduleRef,
          endpointNameHint,
          fiberParentId: safeMetadata.fiberParentId || options.fiberParentId,
          correlationId: safeMetadata.correlationId || options.correlationId || `${resolvedComponentRef}.${profile.operation}`,
          budgetClass: safeMetadata.budgetClass || options.budgetClass,
          deadlineMs: safeMetadata.deadlineMs || options.deadlineMs,
          preferIdle: typeof safeMetadata.preferIdle === 'boolean'
            ? safeMetadata.preferIdle
            : (typeof options.preferIdle === 'boolean' ? options.preferIdle : CANONICAL_LANES[lane].preferIdle),
          coalesceKey,
          severity: safeMetadata.severity || options.severity || 'error',
          diagnosticCode: safeMetadata.diagnosticCode || options.diagnosticCode || profile.diagnosticCode,
          diagnosticMessage: safeMetadata.diagnosticMessage
            || options.diagnosticMessage
            || `${profile.diagnosticMessage}: ${resolvedComponentRef}`,
          metadata: {
            componentFiberInstrumentation: CONTRACTS.componentFiberInstrumentation,
            contract: CONTRACTS.componentFiberInstrumentation,
            operation: profile.operation,
            component: resolvedComponentRef,
            adapterRef: safeMetadata.adapterRef || options.adapterRef,
            hostRef: safeMetadata.hostRef || options.hostRef,
            scheduleRef,
            endpointNameHint,
            metadata: safeMetadata.metadata
          }
        };
      }

      function runOperation(operation, task, metadata = {}) {
        if (typeof task !== 'function') {
          throw new TypeError('fabric component fiber instrumentation requires a task function.');
        }
        try {
          const value = runFiber(createFiberInput(operation, metadata), (fiber) => task(fiber));
          if (value && typeof value.then === 'function' && swallowErrors) {
            return value.catch(() => fallbackValue);
          }
          return value;
        } catch (error) {
          if (swallowErrors) {
            return fallbackValue;
          }
          throw error;
        }
      }

      return Object.freeze({
        schema: CONTRACTS.componentFiberInstrumentation,
        componentRef: resolvedComponentRef,
        scope: baseScope,
        createFiberInput,
        runOperation,
        mount(task, metadata) {
          return runOperation('mount', task, metadata);
        },
        hydrate(task, metadata) {
          return runOperation('hydrate', task, metadata);
        },
        preload(task, metadata) {
          return runOperation('preload', task, metadata);
        }
      });
    }

    function createRouteFiberInstrumentation(routerRef, instrumentationOptions = {}) {
      const options = asObject(instrumentationOptions);
      const resolvedRouterRef = clampString(routerRef || options.routerRef || options.adapterRef, 'xtend.xrouter');
      const baseScope = clampString(options.scope, resolvedRouterRef);
      const swallowErrors = options.swallowErrors === true;
      const fallbackValue = Object.prototype.hasOwnProperty.call(options, 'fallbackValue')
        ? options.fallbackValue
        : undefined;

      function optionFor(operation, suffix, fallback) {
        const key = `${operation}${suffix}`;
        return Object.prototype.hasOwnProperty.call(options, key) ? options[key] : fallback;
      }

      function resolveRouteRef(profile, metadata) {
        return metadata.routeRef
          || metadata.routeId
          || metadata.path
          || metadata.to
          || metadata.href
          || optionFor(profile.operation, 'RouteRef', options.routeRef);
      }

      function createFiberInput(operation, metadata = {}) {
        const profile = resolveRouteFiberOperationProfile(operation);
        const safeMetadata = asObject(metadata);
        const routeRef = resolveRouteRef(profile, safeMetadata);
        const lane = inferLane(
          safeMetadata.kind || profile.kind,
          safeMetadata.lane || optionFor(profile.operation, 'Lane', options.lane || profile.lane)
        );
        const scheduleRef = safeMetadata.scheduleRef
          || optionFor(profile.operation, 'ScheduleRef', options.scheduleRef || profile.scheduleRef);
        const endpointNameHint = safeMetadata.endpointNameHint
          || optionFor(profile.operation, 'EndpointNameHint', options.endpointNameHint || profile.endpointNameHint);
        const coalesceKey = safeMetadata.coalesceKey
          || optionFor(profile.operation, 'CoalesceKey', options.coalesceKey || `${resolvedRouterRef}.${profile.coalesceSuffix}.${routeRef || 'route'}`);
        const scope = safeMetadata.scope || optionFor(profile.operation, 'Scope', `${baseScope}.${profile.operation}`);

        return {
          kind: safeMetadata.kind || profile.kind,
          lane,
          phase: safeMetadata.phase || profile.phase,
          source: safeMetadata.source || profile.source,
          scope,
          componentRef: safeMetadata.componentRef || options.componentRef,
          routeRef,
          scheduleRef,
          endpointNameHint,
          fiberParentId: safeMetadata.fiberParentId || options.fiberParentId,
          correlationId: safeMetadata.correlationId
            || options.correlationId
            || `${resolvedRouterRef}.${profile.operation}.${routeRef || 'route'}`,
          budgetClass: safeMetadata.budgetClass || options.budgetClass,
          deadlineMs: safeMetadata.deadlineMs || options.deadlineMs,
          preferIdle: typeof safeMetadata.preferIdle === 'boolean'
            ? safeMetadata.preferIdle
            : (typeof options.preferIdle === 'boolean' ? options.preferIdle : CANONICAL_LANES[lane].preferIdle),
          coalesceKey,
          severity: safeMetadata.severity || options.severity || 'error',
          diagnosticCode: safeMetadata.diagnosticCode || options.diagnosticCode || profile.diagnosticCode,
          diagnosticMessage: safeMetadata.diagnosticMessage
            || options.diagnosticMessage
            || `${profile.diagnosticMessage}: ${routeRef || resolvedRouterRef}`,
          metadata: {
            routeFiberInstrumentation: CONTRACTS.routeFiberInstrumentation,
            contract: CONTRACTS.routeFiberInstrumentation,
            operation: profile.operation,
            router: resolvedRouterRef,
            routeId: safeMetadata.routeId || options.routeId,
            path: safeMetadata.path || options.path,
            from: safeMetadata.from,
            to: safeMetadata.to || safeMetadata.href,
            params: safeMetadata.params,
            query: safeMetadata.query,
            componentRef: safeMetadata.componentRef || options.componentRef,
            adapterRef: safeMetadata.adapterRef || options.adapterRef,
            hostRef: safeMetadata.hostRef || options.hostRef,
            scheduleRef,
            endpointNameHint,
            backpressureSignal: safeMetadata.backpressureSignal || options.backpressureSignal,
            metadata: safeMetadata.metadata
          }
        };
      }

      function runOperation(operation, task, metadata = {}) {
        if (typeof task !== 'function') {
          throw new TypeError('fabric route fiber instrumentation requires a task function.');
        }
        try {
          const value = runFiber(createFiberInput(operation, metadata), (fiber) => task(fiber));
          if (value && typeof value.then === 'function' && swallowErrors) {
            return value.catch(() => fallbackValue);
          }
          return value;
        } catch (error) {
          if (swallowErrors) {
            return fallbackValue;
          }
          throw error;
        }
      }

      return Object.freeze({
        schema: CONTRACTS.routeFiberInstrumentation,
        routerRef: resolvedRouterRef,
        scope: baseScope,
        createFiberInput,
        runOperation,
        navigate(task, metadata) {
          return runOperation('navigate', task, metadata);
        },
        render(task, metadata) {
          return runOperation('render', task, metadata);
        }
      });
    }

    function createComponentLifecycleBoundary(componentRef, lifecycleOptions = {}) {
      const resolvedComponentRef = clampString(componentRef || lifecycleOptions.componentRef || lifecycleOptions.tag, 'xtend.component');
      const boundaryScope = clampString(lifecycleOptions.scope, resolvedComponentRef);
      const swallowErrors = lifecycleOptions.swallowErrors !== false;
      const fallbackValue = Object.prototype.hasOwnProperty.call(lifecycleOptions, 'fallbackValue')
        ? lifecycleOptions.fallbackValue
        : undefined;

      function createLifecycleFiberInput(phase, metadata = {}) {
        const phaseContract = resolveLifecyclePhase(phase);
        const lane = inferLane(phaseContract.fiberKind, metadata.lane || lifecycleOptions.lane || phaseContract.lane);
        const normalizedPhase = phaseContract.phase || phase;
        return {
          kind: phaseContract.fiberKind,
          lane,
          phase: normalizedPhase,
          source: 'component',
          scope: boundaryScope,
          componentRef: resolvedComponentRef,
          routeRef: lifecycleOptions.routeRef,
          scheduleRef: lifecycleOptions.scheduleRef || metadata.scheduleRef,
          correlationId: lifecycleOptions.correlationId || metadata.correlationId,
          severity: metadata.severity || lifecycleOptions.severity || phaseContract.severity || 'error',
          diagnosticCode: metadata.diagnosticCode || lifecycleOptions.diagnosticCode || 'xtend.fabric.component.lifecycle.failed',
          diagnosticMessage: metadata.diagnosticMessage || lifecycleOptions.diagnosticMessage || `XTend component ${resolvedComponentRef} failed during ${normalizedPhase}`,
          metadata: {
            lifecycleBoundary: CONTRACTS.lifecycleBoundary,
            component: resolvedComponentRef,
            method: metadata.method || normalizedPhase,
            eventName: metadata.eventName,
            eventType: metadata.eventType,
            phase: normalizedPhase,
            contract: CONTRACTS.lifecycleBoundary,
            metadata: metadata.metadata
          }
        };
      }

      function runPhase(phase, task, metadata = {}) {
        if (typeof task !== 'function') {
          throw new TypeError('fabric lifecycle boundary requires a task function.');
        }

        try {
          const value = runFiber(createLifecycleFiberInput(phase, metadata), () => task());
          if (value && typeof value.then === 'function' && swallowErrors) {
            return value.catch(() => fallbackValue);
          }
          return value;
        } catch (error) {
          if (swallowErrors) {
            return fallbackValue;
          }
          throw error;
        }
      }

      function wrapMethod(target, method, methodOptions = {}) {
        const original = target && target[method];
        if (typeof original !== 'function') {
          return target;
        }
        target[method] = function wrappedFabricLifecycleMethod(...args) {
          return runPhase(methodOptions.phase || method, () => original.apply(this, args), {
            method,
            metadata: methodOptions.metadata
          });
        };
        return target;
      }

      function wrapEventHandler(handler, handlerOptions = {}) {
        if (typeof handler !== 'function') {
          throw new TypeError('fabric.wrapEventHandler requires a function.');
        }
        return function wrappedFabricEventHandler(...args) {
          const event = args[0];
          const eventType = event && typeof event.type === 'string' ? event.type : handlerOptions.eventType;
          return runPhase(handlerOptions.phase || 'eventHandler', () => handler.apply(this, args), {
            method: handlerOptions.method || handler.name || 'eventHandler',
            eventName: handlerOptions.eventName || eventType || handlerOptions.method || handler.name,
            eventType,
            metadata: handlerOptions.metadata
          });
        };
      }

      function captureLifecycleError(error, context = {}) {
        const phaseContract = resolveLifecyclePhase(context.phase || 'lifecycle');
        return captureError(error, {
          code: context.code || 'xtend.fabric.component.lifecycle.failed',
          message: context.message || `XTend component ${resolvedComponentRef} failed during ${phaseContract.phase}`,
          source: 'component',
          phase: phaseContract.phase,
          componentRef: resolvedComponentRef,
          fiberId: context.fiberId,
          lane: context.lane || phaseContract.lane,
          correlationId: context.correlationId || lifecycleOptions.correlationId,
          routeRef: context.routeRef || lifecycleOptions.routeRef,
          scheduleRef: context.scheduleRef || lifecycleOptions.scheduleRef,
          severity: context.severity || phaseContract.severity,
          metadata: {
            lifecycleBoundary: CONTRACTS.lifecycleBoundary,
            component: resolvedComponentRef,
            method: context.method || phaseContract.phase,
            eventName: context.eventName,
            contract: CONTRACTS.lifecycleBoundary,
            metadata: context.metadata
          }
        });
      }

      return Object.freeze({
        schema: CONTRACTS.lifecycleBoundary,
        componentRef: resolvedComponentRef,
        scope: boundaryScope,
        runPhase,
        wrapMethod,
        wrapEventHandler,
        capture: captureLifecycleError
      });
    }

    function createBoundary(scope, boundaryOptions = {}) {
      const boundaryScope = clampString(scope, boundaryOptions.scope || 'fabric.boundary');
      const swallowErrors = boundaryOptions.swallowErrors === true;
      const fallbackValue = Object.prototype.hasOwnProperty.call(boundaryOptions, 'fallbackValue')
        ? boundaryOptions.fallbackValue
        : undefined;

      function run(phase, task, metadata = {}) {
        const fiberInput = {
          kind: boundaryOptions.fiberKind || `${boundaryOptions.source || 'fabric'}.${phase || 'run'}`,
          lane: boundaryOptions.lane,
          phase: phase || boundaryOptions.phase || 'run',
          source: boundaryOptions.source || 'fabric',
          scope: boundaryScope,
          componentRef: boundaryOptions.componentRef,
          routeRef: boundaryOptions.routeRef,
          scheduleRef: boundaryOptions.scheduleRef,
          correlationId: boundaryOptions.correlationId,
          metadata
        };

        try {
          const value = runFiber(fiberInput, () => task());
          if (value && typeof value.then === 'function' && swallowErrors) {
            return value.catch(() => fallbackValue);
          }
          return value;
        } catch (error) {
          if (swallowErrors) {
            return fallbackValue;
          }
          throw error;
        }
      }

      return Object.freeze({
        schema: CONTRACTS.api,
        scope: boundaryScope,
        run,
        wrap(phase, task, metadata) {
          return (...args) => run(phase, () => task(...args), metadata);
        },
        capture(error, context = {}) {
          return captureError(error, {
            source: boundaryOptions.source || 'fabric',
            phase: context.phase || boundaryOptions.phase || 'error',
            componentRef: boundaryOptions.componentRef,
            routeRef: boundaryOptions.routeRef,
            scheduleRef: boundaryOptions.scheduleRef,
            correlationId: boundaryOptions.correlationId,
            metadata: context.metadata || {}
          });
        }
      });
    }

    function wrapComponent(componentClassOrInstance, wrapOptions = {}) {
      const componentRef = wrapOptions.componentRef || wrapOptions.tag || (componentClassOrInstance && componentClassOrInstance.name) || 'xtend.component';
      const lifecycleBoundary = createComponentLifecycleBoundary(componentRef, {
        scope: wrapOptions.scope,
        lane: wrapOptions.lane,
        routeRef: wrapOptions.routeRef,
        scheduleRef: wrapOptions.scheduleRef,
        correlationId: wrapOptions.correlationId,
        swallowErrors: wrapOptions.swallowErrors !== false,
        fallbackValue: wrapOptions.fallbackValue,
        severity: wrapOptions.severity
      });
      const eventHandlers = Array.isArray(wrapOptions.eventHandlers) ? wrapOptions.eventHandlers.slice() : [];

      function wrapMethod(target, method) {
        const original = target && target[method];
        if (typeof original !== 'function') {
          return;
        }
        lifecycleBoundary.wrapMethod(target, method);
      }

      function wrapEventMethod(target, method) {
        const original = target && target[method];
        if (typeof original !== 'function') {
          return;
        }
        target[method] = lifecycleBoundary.wrapEventHandler(original, {
          method,
          eventName: method
        });
      }

      if (typeof componentClassOrInstance === 'function') {
        const BaseComponent = componentClassOrInstance;
        class FabricWrappedComponent extends BaseComponent {}
        LIFECYCLE_METHODS.forEach((method) => {
          const original = BaseComponent.prototype[method];
          if (typeof original === 'function') {
            FabricWrappedComponent.prototype[method] = function fabricWrappedLifecycle(...args) {
              return lifecycleBoundary.runPhase(method, () => original.apply(this, args), { method });
            };
          }
        });
        eventHandlers.forEach((method) => {
          const original = BaseComponent.prototype[method];
          if (typeof original === 'function') {
            FabricWrappedComponent.prototype[method] = lifecycleBoundary.wrapEventHandler(function fabricWrappedEventMethod(...args) {
              return original.apply(this, args);
            }, {
              method,
              eventName: method
            });
          }
        });
        Object.defineProperty(FabricWrappedComponent, 'name', {
          value: `${BaseComponent.name || 'XTend'}FabricWrapped`
        });
        FabricWrappedComponent.xtendFabricBoundary = lifecycleBoundary;
        return FabricWrappedComponent;
      }

      LIFECYCLE_METHODS.forEach((method) => wrapMethod(componentClassOrInstance, method));
      eventHandlers.forEach((method) => wrapEventMethod(componentClassOrInstance, method));
      return componentClassOrInstance;
    }

    function registerReporter(reporter) {
      const normalized = normalizeReporter(reporter);
      reporters.push(normalized);
      return () => {
        const index = reporters.indexOf(normalized);
        if (index >= 0) {
          reporters.splice(index, 1);
          normalized.dispose();
        }
      };
    }

    function writeStateValue(stateTarget, key, value) {
      const safeKey = clampString(key, '');
      if (!stateTarget || !safeKey) return false;
      if (typeof stateTarget.set === 'function') {
        stateTarget.set(safeKey, value);
        return true;
      }
      if (typeof stateTarget.setState === 'function') {
        stateTarget.setState(safeKey, value);
        return true;
      }
      return false;
    }

    function readStateValue(stateTarget, key, fallbackValue) {
      const safeKey = clampString(key, '');
      if (!stateTarget || !safeKey) return fallbackValue;
      if (typeof stateTarget.get === 'function') {
        const value = stateTarget.get(safeKey);
        return value === undefined ? fallbackValue : value;
      }
      return fallbackValue;
    }

    function createRuntimeDiagnosticsSnapshot(bridgeId, extra = {}) {
      return Object.freeze({
        schema: CONTRACTS.runtimeDiagnosticsBridge,
        bridgeId,
        diagnosticCount: diagnostics.length,
        fiberCount: fibers.length,
        reporterCount: reporters.length,
        lastDiagnostic: diagnostics.length > 0 ? diagnostics[diagnostics.length - 1] : null,
        timestamp: nowIso(config.clock),
        ...extra
      });
    }

    function publishRmtDiagnosticEntry(entry, connectionOptions = {}) {
      const event = entry && entry.detail ? entry.detail : entry;
      const diagnostic = asObject(event);
      const metadata = asObject(diagnostic.metadata);
      return emitDiagnostic({
        level: diagnostic.level || connectionOptions.level || 'info',
        code: diagnostic.code || 'xtend.rmt.diagnostic',
        message: diagnostic.message || 'RMT diagnostic consumed by XTend-Fabric',
        source: 'rmt',
        phase: diagnostic.phase || diagnostic.operation || 'diagnose',
        componentRef: diagnostic.componentRef || metadata.componentRef || metadata.componentId,
        fiberId: diagnostic.fiberId || metadata.fiberId,
        lane: diagnostic.lane || metadata.lane,
        correlationId: diagnostic.correlationId || metadata.correlationId,
        routeRef: diagnostic.routeRef || metadata.routeRef || metadata.routeId,
        scheduleRef: diagnostic.scheduleRef || metadata.scheduleRef || metadata.schedule,
        metadata: {
          adapterId: diagnostic.adapterId || metadata.adapterId,
          bridge: diagnostic.bridge || connectionOptions.bridge || connectionOptions.bridgeId,
          operation: diagnostic.operation || metadata.operation,
          payload: diagnostic.payload,
          metadata
        }
      });
    }

    function connectRmtDiagnostics(source, connectionOptions = {}) {
      const connection = {
        schema: 'xtend.fabric.rmt-diagnostics-connection.v1',
        source: 'rmt',
        disposed: false,
        dispose() {
          connection.disposed = true;
          if (typeof connection.unsubscribe === 'function') {
            connection.unsubscribe();
          }
          if (connection.target && typeof connection.target.removeEventListener === 'function') {
            connection.target.removeEventListener(connection.eventName, connection.listener);
          }
        }
      };

      function publishRmtDiagnostic(entry) {
        if (connection.disposed) return null;
        return publishRmtDiagnosticEntry(entry, connectionOptions);
      }

      if (Array.isArray(source)) {
        source.forEach(publishRmtDiagnostic);
        return Object.freeze(connection);
      }

      if (source && Array.isArray(source.diagnostics)) {
        source.diagnostics.forEach(publishRmtDiagnostic);
      }

      if (source && typeof source.listDiagnostics === 'function') {
        const listedDiagnostics = source.listDiagnostics();
        if (Array.isArray(listedDiagnostics)) {
          listedDiagnostics.forEach(publishRmtDiagnostic);
        }
      }

      if (source && typeof source.subscribe === 'function') {
        connection.unsubscribe = source.subscribe(publishRmtDiagnostic);
      }

      if (source && typeof source.addEventListener === 'function') {
        connection.target = source;
        connection.eventName = connectionOptions.eventName || 'rmt-diagnostic';
        connection.listener = publishRmtDiagnostic;
        source.addEventListener(connection.eventName, connection.listener);
      }

      return Object.freeze(connection);
    }

    function createRuntimeDiagnosticsBridge(bridgeOptions = {}) {
      const options = asObject(bridgeOptions);
      const bridgeId = clampString(options.id || options.bridgeId, 'xtend.fabric.runtime-diagnostics');
      const statePrefix = clampString(options.statePrefix, 'xtend.fabric');
      const bridgeReadyKey = clampString(options.bridgeReadyKey, `${statePrefix}.bridge.ready`);
      const diagnosticStateKey = clampString(options.diagnosticStateKey, `${statePrefix}.diagnostics.last`);
      const snapshotStateKey = clampString(options.snapshotStateKey, `${statePrefix}.diagnostics.snapshot`);
      const ignoredStatePrefixes = Array.isArray(options.ignoredStatePrefixes)
        ? options.ignoredStatePrefixes.slice()
        : [statePrefix];
      const connections = [];
      let disposed = false;

      function isIgnoredStateKey(key) {
        return !key || ignoredStatePrefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}.`));
      }

      function getStateTarget(stateTarget) {
        return stateTarget || options.xstate || (config.window && config.window.xstate) || (globalTarget && globalTarget.xstate) || null;
      }

      function mirrorDiagnosticToState(diagnostic, stateTarget = null, mirrorOptions = {}) {
        const target = getStateTarget(stateTarget);
        if (!target) return false;
        const safeDiagnostic = redactDiagnostic(asObject(diagnostic));
        const wroteLast = writeStateValue(target, mirrorOptions.diagnosticStateKey || diagnosticStateKey, safeDiagnostic);
        const wroteSnapshot = writeStateValue(target, mirrorOptions.snapshotStateKey || snapshotStateKey, createRuntimeDiagnosticsSnapshot(bridgeId, {
          mirroredToState: wroteLast,
          source: safeDiagnostic.source,
          code: safeDiagnostic.code
        }));
        return wroteLast || wroteSnapshot;
      }

      function connectXState(stateTarget = null, connectionOptions = {}) {
        const target = getStateTarget(stateTarget);
        const connection = {
          schema: CONTRACTS.runtimeDiagnosticsBridge,
          kind: 'xstate',
          targetRef: connectionOptions.targetRef || 'xstate',
          disposed: false,
          dispose() {
            connection.disposed = true;
            if (typeof connection.unsubscribe === 'function') {
              connection.unsubscribe();
            }
            if (typeof connection.unregisterReporter === 'function') {
              connection.unregisterReporter();
            }
          }
        };
        connections.push(connection);

        if (!target) {
          emitDiagnostic({
            level: 'warn',
            code: 'xtend.fabric.xstate.unavailable',
            message: 'XTend-Fabric runtime diagnostics bridge could not find an xstate target.',
            source: 'fabric',
            phase: 'state',
            metadata: {
              bridgeId,
              targetRef: connection.targetRef
            }
          });
          return Object.freeze(connection);
        }

        connection.unregisterReporter = registerReporter(createReporterAdapter({
          id: connectionOptions.reporterId || `${bridgeId}.xstate-reporter`,
          kind: 'xstate',
          delivery: 'xstate',
          external: false,
          minimumLevel: connectionOptions.minimumLevel || 'debug',
          capabilities: ['diagnostics', 'stateMirror'],
          sink(event) {
            return mirrorDiagnosticToState(event, target, connectionOptions);
          }
        }));

        writeStateValue(target, connectionOptions.bridgeReadyKey || bridgeReadyKey, {
          schema: CONTRACTS.runtimeDiagnosticsBridge,
          bridgeId,
          connected: true,
          targetRef: connection.targetRef
        });

        if (typeof target.subscribe === 'function') {
          connection.unsubscribe = target.subscribe((key, value, allData) => {
            if (connection.disposed || disposed || !key || isIgnoredStateKey(key)) return;
            emitDiagnostic({
              level: connectionOptions.level || 'debug',
              code: 'xtend.fabric.xstate.changed',
              message: `XTend xstate changed "${key}".`,
              source: 'xstate',
              phase: 'state',
              correlationId: connectionOptions.correlationId,
              metadata: {
                bridgeId,
                key,
                value,
                stateSize: allData && typeof allData === 'object' ? Object.keys(allData).length : undefined
              }
            });
          }, connectionOptions.keyFilter);
        }

        emitDiagnostic({
          level: 'info',
          code: 'xtend.fabric.xstate.connected',
          message: 'XTend-Fabric runtime diagnostics bridge connected xstate.',
          source: 'fabric',
          phase: 'state',
          correlationId: connectionOptions.correlationId,
          metadata: {
            bridgeId,
            targetRef: connection.targetRef,
            bridgeReadyKey,
            diagnosticStateKey,
            snapshotStateKey
          }
        });

        return Object.freeze(connection);
      }

      function connectApi(apiTarget = null, connectionOptions = {}) {
        const apiTargetCandidate = apiTarget || options.api || (config.window && config.window.XTend) || (globalTarget && globalTarget.XTend) || null;
        const api = asObject(apiTargetCandidate);
        const compliance = asObject(api.compliance);
        const hasApi = !!apiTargetCandidate;
        let coreContracts = null;
        let checklist = null;
        try {
          coreContracts = typeof compliance.getCoreContracts === 'function' ? compliance.getCoreContracts() : undefined;
          checklist = typeof compliance.getChecklist === 'function' ? compliance.getChecklist() : undefined;
        } catch (error) {
          captureError(error, {
            code: 'xtend.fabric.api.inspect.failed',
            message: 'XTend-Fabric could not inspect XTend API compliance metadata.',
            source: 'api',
            phase: 'connect',
            metadata: {
              bridgeId
            }
          });
        }

        const diagnostic = emitDiagnostic({
          level: hasApi ? 'info' : 'warn',
          code: hasApi ? 'xtend.fabric.api.connected' : 'xtend.fabric.api.unavailable',
          message: hasApi
            ? 'XTend-Fabric runtime diagnostics bridge connected XTend API metadata.'
            : 'XTend-Fabric runtime diagnostics bridge could not find XTend API metadata.',
          source: 'api',
          phase: 'connect',
          correlationId: connectionOptions.correlationId || options.correlationId,
          metadata: {
            bridgeId,
            namespacePresent: hasApi,
            complianceVersion: compliance.version,
            coreContracts,
            checklist,
            capabilities: Object.keys(api).filter((key) => typeof api[key] !== 'function')
          }
        });

        const connection = Object.freeze({
          schema: CONTRACTS.runtimeDiagnosticsBridge,
          kind: 'api',
          targetRef: connectionOptions.targetRef || 'window.XTend',
          diagnostic,
          dispose() {}
        });
        connections.push(connection);
        return connection;
      }

      function connectRmtDiagnosticsBridge(source = null, connectionOptions = {}) {
        const target = source || options.rmt || options.rmtBridge || options.rmtDiagnostics || null;
        const connection = connectRmtDiagnostics(target, {
          bridge: bridgeId,
          ...connectionOptions
        });
        connections.push(connection);
        emitDiagnostic({
          level: target ? 'info' : 'warn',
          code: target ? 'xtend.fabric.rmt.connected' : 'xtend.fabric.rmt.unavailable',
          message: target
            ? 'XTend-Fabric runtime diagnostics bridge connected XTendRMT diagnostics.'
            : 'XTend-Fabric runtime diagnostics bridge could not find XTendRMT diagnostics.',
          source: 'fabric',
          phase: 'rmt',
          correlationId: connectionOptions.correlationId || options.correlationId,
          metadata: {
            bridgeId,
            sourceKind: Array.isArray(target) ? 'array' : typeof target
          }
        });
        return connection;
      }

      function createRmtDiagnosticsHub(hubOptions = {}) {
        return Object.freeze({
          schema: 'xtend.fabric.rmt-diagnostics-hub.v1',
          bridgeId,
          publish(event, context = {}) {
            return publishRmtDiagnosticEntry({
              ...asObject(event),
              payload: asObject(context)
            }, {
              bridge: bridgeId,
              ...hubOptions
            });
          },
          emit(eventName, event = {}) {
            return publishRmtDiagnosticEntry({
              ...asObject(event),
              phase: eventName || event.phase || event.operation
            }, {
              bridge: bridgeId,
              ...hubOptions
            });
          },
          record(event) {
            return publishRmtDiagnosticEntry(event, {
              bridge: bridgeId,
              ...hubOptions
            });
          }
        });
      }

      function connectAll(connectionOptions = {}) {
        const activeConnections = [];
        if (connectionOptions.xstate !== false) {
          activeConnections.push(connectXState(connectionOptions.xstate || options.xstate, connectionOptions.xstateOptions || {}));
        }
        if (connectionOptions.api !== false) {
          activeConnections.push(connectApi(connectionOptions.api || options.api, connectionOptions.apiOptions || {}));
        }
        if (connectionOptions.rmt !== false && (connectionOptions.rmt || options.rmt || options.rmtBridge || options.rmtDiagnostics)) {
          activeConnections.push(connectRmtDiagnosticsBridge(connectionOptions.rmt || options.rmt || options.rmtBridge || options.rmtDiagnostics, connectionOptions.rmtOptions || {}));
        }
        return Object.freeze(activeConnections);
      }

      return Object.freeze({
        schema: CONTRACTS.runtimeDiagnosticsBridge,
        id: bridgeId,
        statePrefix,
        connectXState,
        connectApi,
        connectRmtDiagnostics: connectRmtDiagnosticsBridge,
        createRmtDiagnosticsHub,
        mirrorDiagnosticToState,
        connectAll,
        getSnapshot(extra = {}) {
          return createRuntimeDiagnosticsSnapshot(bridgeId, extra);
        },
        readState(key, fallbackValue = undefined, stateTarget = null) {
          return readStateValue(getStateTarget(stateTarget), key, fallbackValue);
        },
        dispose() {
          disposed = true;
          connections.forEach((connection) => {
            if (connection && typeof connection.dispose === 'function') {
              connection.dispose();
            }
          });
          connections.splice(0, connections.length);
        }
      });
    }

    const fabric = {
      schema: CONTRACTS.api,
      contracts: CONTRACTS,
      lanes: CANONICAL_LANES,
      createBoundary,
      createComponentLifecycleBoundary,
      createReporterAdapter,
      createConsoleReporter,
      createTestReporter,
      createComponentFiberInstrumentation,
      createRouteFiberInstrumentation,
      createRuntimeDiagnosticsBridge,
      createBackpressureSignal,
      recordComponentTelemetry,
      recordKernelPanicRecovery,
      normalizeKernelPanicRecoveryRecord,
      summarizeKernelPanicRecovery,
      summarizeStreamPressure,
      normalizeComponentLifecycleTelemetry,
      summarizeComponentLifecycleTelemetry,
      createTelemetrySnapshot,
      publishTelemetrySnapshot,
      exportTelemetrySnapshot: publishTelemetrySnapshot,
      wrapComponent,
      runFiber,
      emitDiagnostic,
      registerReporter,
      captureError,
      connectRmtDiagnostics,
      getDiagnostics() {
        return diagnostics.slice();
      },
      getFibers() {
        return fibers.slice();
      },
      getComponentTelemetry() {
        return componentTelemetry.slice();
      },
      getKernelPanicRecoveryRecords() {
        return kernelPanicRecoveryRecords.slice();
      },
      getPanicRecoverySnapshot() {
        return summarizeKernelPanicRecovery(kernelPanicRecoveryRecords);
      },
      getReporters() {
        return reporters.slice();
      },
      clearDiagnostics() {
        diagnostics.splice(0, diagnostics.length);
      },
      clearFibers() {
        fibers.splice(0, fibers.length);
      },
      clearComponentTelemetry() {
        componentTelemetry.splice(0, componentTelemetry.length);
      },
      clearKernelPanicRecoveryRecords() {
        kernelPanicRecoveryRecords.splice(0, kernelPanicRecoveryRecords.length);
      },
      dispose() {
        reporters.splice(1).forEach((reporter) => reporter.dispose());
        diagnostics.splice(0, diagnostics.length);
        fibers.splice(0, fibers.length);
        componentTelemetry.splice(0, componentTelemetry.length);
        kernelPanicRecoveryRecords.splice(0, kernelPanicRecoveryRecords.length);
      }
    };

    return Object.freeze(fabric);
  }

  return Object.freeze({
    CONTRACTS,
    BROWSER_NAMESPACE,
    DEFAULT_LANE_BY_KIND,
    CANONICAL_LANES,
    LIFECYCLE_METHODS,
    LIFECYCLE_PHASES,
    COMPONENT_FIBER_OPERATION_PROFILES,
    ROUTE_FIBER_OPERATION_PROFILES,
    COMPONENT_LIFECYCLE_OPERATIONS,
    BACKPRESSURE_SCORE_THRESHOLDS,
    BACKPRESSURE_ACTION_BY_LEVEL,
    PERFORMANCE_MEASURE_PHASES,
    PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND,
    PERFORMANCE_BUDGET_MS_BY_MEASURE,
    createXtendFabric,
    createNoopReporter,
    createReporterAdapter,
    createConsoleReporter,
    createTestReporter,
    normalizeComponentLifecycleTelemetry,
    summarizeComponentLifecycleTelemetry,
    summarizeStreamPressure,
    normalizeDiagnostic,
    normalizeDiagnosticCode,
    normalizeError,
    normalizeFiber,
    redactDiagnostic,
    redactValue
  });
});
