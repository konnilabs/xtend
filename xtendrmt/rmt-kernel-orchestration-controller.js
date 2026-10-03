import { createRmtKernelScheduler as createDefaultRmtKernelScheduler } from './rmt-kernel-scheduler.js';

function createKernelOrchestrationControllerModule() {
  const RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA = 'xtend.rmt.kernel-orchestration-controller.v2';
  const RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA = 'xtend.rmt.kernel-orchestration-diagnostic.v1';

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function cloneSafe(value, fallback = null) {
    if (value === undefined) return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function normalizeKernelBootMode(value) {
    return value === 'productSurface' ? 'productSurface' : 'direct';
  }

  function createFallbackOptionalCompat() {
    return {
      browserHostAdapter: null
    };
  }

  function sanitizeDiagnostic(value) {
    if (Array.isArray(value)) return value.map(sanitizeDiagnostic);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    Object.entries(value).forEach(([key, entry]) => {
      const normalized = key.toLowerCase();
      if (
        normalized.includes('payload')
        || normalized.includes('secret')
        || normalized.includes('token')
        || normalized.includes('password')
        || normalized.includes('html')
        || normalized === 'stack'
      ) {
        result[key] = '[redacted]';
        return;
      }
      result[key] = sanitizeDiagnostic(entry);
    });
    return result;
  }

  function createDiagnostic(code, severity, message, metadata = {}) {
    return sanitizeDiagnostic({
      schema: RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      message,
      metadata
    });
  }

  function createRmtKernelOrchestrationController(options = {}) {
    const kernelApi = options.kernelApi || null;
    const artifact = options.artifact || null;
    const plan = options.plan || {};
    const strict = options.strict === true || plan.strict === true;
    const schedulerPlan = artifact && artifact.scheduler || null;
    const schedules = toArray(schedulerPlan && schedulerPlan.schedules);
    const fibers = toArray(schedulerPlan && schedulerPlan.fibers);
    const scheduleByEndpoint = new Map(schedules.map((schedule) => [schedule.endpointName, schedule]));
    const diagnostics = toArray(options.diagnostics || plan.diagnostics).map(sanitizeDiagnostic);
    // Browser event publication belongs to the injected host/event port. The
    // application controller intentionally has no concrete DOM-event fallback.
    const dispatchEvent = typeof options.dispatchEvent === 'function'
      ? options.dispatchEvent
      : (() => undefined);
    const injectedHostPort = options.hostPort || options.orchestrationHostPort || options.clock || options.hostAdapter || {};
    const readHostTime = typeof injectedHostPort.now === 'function'
      ? injectedHostPort.now.bind(injectedHostPort)
      : (() => 0);
    const nowIso = typeof injectedHostPort.nowIso === 'function'
      ? injectedHostPort.nowIso.bind(injectedHostPort)
      : (() => {
          const value = readHostTime();
          if (value instanceof Date) return value.toISOString();
          if (typeof value === 'string' && value) return value;
          if (Number.isFinite(value)) return new Date(value).toISOString();
          return '1970-01-01T00:00:00.000Z';
        });
    const injectedScheduler = options.kernelScheduler
      || (options.scheduler && options.scheduler.kernelScheduler)
      || (options.scheduler && typeof options.scheduler.schedule === 'function' ? options.scheduler : null);
    const schedulerFactory = typeof options.schedulerFactory === 'function'
      ? options.schedulerFactory
      : createDefaultRmtKernelScheduler;
    const ownsKernelScheduler = !injectedScheduler;
    const kernelScheduler = injectedScheduler || schedulerFactory({
      hostPort: options.schedulerHostPort,
      panicMonitor: options.panicMonitor || options.kernelPanicMonitor,
      strict,
      observer: {
        onJobEvent(event) {
          const fabric = options.fabric || options.fabricRuntime || null;
          if (fabric && typeof fabric.recordKernelSchedulerEvent === 'function') {
            fabric.recordKernelSchedulerEvent(event, {
              source: RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA
            });
          }
        }
      }
    });
    let runtime = null;
    let core = null;
    let performanceRuntime = null;
    let schedulerBridge = null;
    let productSurface = options.productSurface || null;
    let hostAdapter = options.hostAdapter || null;
    let bridgedPanicRecoveryRecordCount = 0;
    const bootMode = normalizeKernelBootMode(options.kernelBootMode || plan.bootMode || plan.productSurface && plan.productSurface.bootMode);
    let runtimeStatus = plan.enabled && artifact ? 'pending' : clampString(plan.status, 'disabled');
    const fiberHistory = [];
    const appRuntimeBackpressureRecords = [];
    const appRuntimeYieldActions = [];
    const appRuntimeSchedulerSamples = [];
    let fallbackCount = 0;

    if (!kernelScheduler || typeof kernelScheduler.schedule !== 'function') {
      throw new TypeError('RMT Kernel Orchestration requires one kernel scheduler authority.');
    }

    function publishDiagnostic(diagnostic) {
      const safeDiagnostic = sanitizeDiagnostic(diagnostic);
      diagnostics.push(safeDiagnostic);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(safeDiagnostic);
      return safeDiagnostic;
    }

    function listDiagnostics() {
      return diagnostics.map((entry) => sanitizeDiagnostic(entry));
    }

    function listScheduledEndpoints() {
      return schedulerBridge && typeof schedulerBridge.listScheduledEndpoints === 'function'
        ? schedulerBridge.listScheduledEndpoints()
        : [];
    }

    function createProductSurfaceSnapshot() {
      const planned = plan.productSurface && typeof plan.productSurface === 'object'
        ? cloneSafe(plan.productSurface, {})
        : null;
      if (!productSurface || typeof productSurface !== 'object') {
        return planned || {
          schema: 'xtend.maraca.kernel-product-surface-bootstrap.v1',
          bootMode,
          supported: false,
          status: bootMode === 'productSurface' ? 'blocked' : 'unavailable',
          entryPoints: [],
          entryPointCount: 0,
          entryPointNames: [],
          optionalCompat: createFallbackOptionalCompat(),
          runtimeFactories: {},
          diagnostics: bootMode === 'productSurface' ? [{
            code: 'xtend.rmt.kernel_orchestration.product_surface_missing',
            severity: 'error',
            message: 'Product Surface boot was requested, but createRmtProductSurface is not available.'
          }] : []
        };
      }
      const entryPoints = typeof productSurface.listEntryPoints === 'function'
        ? productSurface.listEntryPoints()
        : [];
      return {
        schema: 'xtend.maraca.kernel-product-surface-bootstrap.v1',
        bootMode,
        supported: true,
        status: bootMode === 'productSurface' ? 'active' : 'available',
        entryPoints,
        entryPointCount: entryPoints.length,
        entryPointNames: entryPoints.map((entry) => entry && entry.name).filter(Boolean),
        optionalCompat: typeof productSurface.listOptionalCompat === 'function'
          ? productSurface.listOptionalCompat()
          : createFallbackOptionalCompat(),
        runtimeFactories: {
          createRuntime: typeof productSurface.createRuntime === 'function',
          createCore: typeof productSurface.createCore === 'function',
          createPerformanceRuntime: typeof productSurface.createPerformanceRuntime === 'function',
          createTemplateArtifacts: typeof productSurface.createTemplateArtifacts === 'function',
          createWorkerRuntime: typeof productSurface.createWorkerRuntime === 'function',
          createServerRuntime: typeof productSurface.createServerRuntime === 'function',
          createDetachedDomRuntime: typeof productSurface.createDetachedDomRuntime === 'function'
        },
        diagnostics: []
      };
    }

    function createFeatureAdoptionSnapshot() {
      const prewarmWorkerEnabled = isPrewarmWorkerEnabled();
      if (options.featureAdoptionRegistry && typeof options.featureAdoptionRegistry.snapshot === 'function') {
        return cloneSafe(options.featureAdoptionRegistry.snapshot(), {});
      }
      const registryFactory = options.featureAdoptionRegistryFactory;
      if (typeof registryFactory === 'function') {
        const registry = registryFactory({
          manifest: options.manifest || null,
          kernelApi,
          runtimeModules: plan.runtimeModules || [],
          planFeatureAdoption: plan.featureAdoption || null,
          activeCapabilities: {
            productSurface: bootMode === 'productSurface' && Boolean(productSurface),
            performanceAdvancedReports: Boolean(performanceRuntime),
            prewarmWorker: prewarmWorkerEnabled,
            uiCoprocessor: isUiCoprocessorEnabled(),
            warmReentry: prewarmWorkerEnabled,
            panicRecovery: Boolean(runtime || core)
          }
        });
        if (registry && typeof registry.snapshot === 'function') return registry.snapshot();
      }
      if (plan.featureAdoption && typeof plan.featureAdoption === 'object') {
        const snapshot = cloneSafe(plan.featureAdoption, {});
        const activeCapabilities = {
          productSurface: bootMode === 'productSurface' && Boolean(productSurface),
          performanceAdvancedReports: Boolean(performanceRuntime),
          prewarmWorker: prewarmWorkerEnabled,
          uiCoprocessor: isUiCoprocessorEnabled(),
          warmReentry: prewarmWorkerEnabled,
          panicRecovery: Boolean(runtime || core)
        };
        if (Array.isArray(snapshot.capabilities)) {
          snapshot.capabilities = snapshot.capabilities.map((capability) => {
            const key = capability && capability.key;
            return Object.prototype.hasOwnProperty.call(activeCapabilities, key)
              ? { ...capability, active: activeCapabilities[key] }
              : capability;
          });
        }
        return snapshot;
      }
      return {
        schema: 'xtend.rmt-kernel-feature-adoption-report.v1',
        contract: 'xtend.rmt-kernel-feature-adoption.v1',
        status: 'unavailable',
        ok: false,
        capabilityKeys: [],
        capabilities: [],
        diagnostics: [{
          schema: 'xtend.rmt-kernel-feature-adoption-diagnostic.v1',
          code: 'xtend.rmt.kernel_feature_adoption.registry_missing',
          severity: 'warning',
          message: 'RMT kernel feature adoption registry is not available.'
        }]
      };
    }

    function isPrewarmWorkerEnabled() {
      return options.enablePrewarmWorker === true
        || plan.enablePrewarmWorker === true
        || isUiCoprocessorEnabled()
        || Boolean(plan.prewarmWorker && plan.prewarmWorker.enabled === true);
    }

    function isUiCoprocessorEnabled() {
      return options.enableUiCoprocessor === true
        || plan.enableUiCoprocessor === true
        || Boolean(plan.uiCoprocessor && plan.uiCoprocessor.enabled === true)
        || Boolean(plan.prewarmWorker && plan.prewarmWorker.coprocessor && plan.prewarmWorker.coprocessor.enabled === true);
    }

    function normalizeUiCoprocessorPlan() {
      const source = plan.uiCoprocessor && typeof plan.uiCoprocessor === 'object'
        ? plan.uiCoprocessor
        : (plan.prewarmWorker && plan.prewarmWorker.coprocessor && typeof plan.prewarmWorker.coprocessor === 'object' ? plan.prewarmWorker.coprocessor : {});
      const mode = clampString(options.uiCoprocessorMode || source.mode, 'opportunistic');
      const lifecycle = clampString(options.uiCoprocessorLifecycle || source.lifecycle, 'runtime');
      return {
        enabled: isUiCoprocessorEnabled(),
        mode: mode === 'alwaysOn' ? 'alwaysOn' : 'opportunistic',
        lifecycle: lifecycle === 'app' ? 'app' : 'runtime',
        maxQueueDepth: Math.max(Math.trunc(Number(options.uiCoprocessorMaxQueueDepth || source.maxQueueDepth) || 8), 1),
        stalePolicy: 'discard'
      };
    }

    function createPrewarmWorkerFallbackSnapshot(reason = 'disabled') {
      const planned = plan.prewarmWorker && typeof plan.prewarmWorker === 'object'
        ? cloneSafe(plan.prewarmWorker, {})
        : {};
      const enabled = isPrewarmWorkerEnabled();
      const coprocessor = normalizeUiCoprocessorPlan();
      return {
        ...planned,
        schema: 'xtend.rmt.prewarm-worker-topology.v1',
        kind: 'rmt-prewarm',
        enabled,
        enabledBy: options.enablePrewarmWorker === true || plan.enablePrewarmWorker === true || planned.enabled === true ? 'prewarmWorker' : (coprocessor.enabled ? 'uiCoprocessor' : 'none'),
        status: enabled ? 'degraded' : 'disabled',
        health: enabled ? 'degraded' : 'disabled',
        reason,
        workerName: options.prewarmWorkerName || planned.workerName || 'XTendRMTPrewarmWorker',
        workerType: options.prewarmWorkerType || planned.workerType || 'classic',
        instantiated: false,
        pendingJobs: 0,
        submittedJobs: 0,
        templatesSynced: 0,
        available: false,
        missingApis: [],
        lastHealthAt: 0,
        lastError: null,
        responsibilities: ['template_prerender_compute', 'chunk_serialization', 'ui_compute', 'layout_precompute', 'analytics_precompute'],
        supportedSignals: ['start', 'continue', 'rebatch', 'compute', 'ui_compute', 'prerender', 'invalidate'],
        excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership'],
        coprocessor: {
          ...coprocessor,
          queueDepthMax: 0,
          status: coprocessor.enabled ? (enabled ? 'degraded' : 'disabled') : 'disabled',
          pendingJobs: 0,
          submittedJobs: 0,
          transferBytes: 0,
          staleResponses: 0,
          supersededResponses: 0,
          stateOwnership: 'main-thread',
          trustedDomCommit: 'main-thread',
          clientDetermined: true,
          ssrRoundtripCount: 0
        },
        diagnostics: enabled && !runtime ? [{
          schema: RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA,
          code: 'xtend.rmt.kernel_orchestration.prewarm_worker_runtime_missing',
          severity: 'warning',
          message: 'Prewarm Worker is enabled, but the kernel runtime has not exposed topology yet.'
        }] : []
      };
    }

    function createPrewarmWorkerSnapshot() {
      if (runtime && typeof runtime.getPrewarmWorkerTopology === 'function') {
        const topology = runtime.getPrewarmWorkerTopology();
        if (topology && typeof topology === 'object') {
          return {
            ...cloneSafe(plan.prewarmWorker, {}),
            ...cloneSafe(topology, {}),
            runtimeExpectedStatus: isPrewarmWorkerEnabled() ? 'booted' : 'disabled'
          };
        }
      }
      return createPrewarmWorkerFallbackSnapshot(runtimeStatus === 'pending' ? 'pending' : 'runtime_unavailable');
    }

    function resolvePanicRecoverySource() {
      if (runtime && typeof runtime.getPanicRecoverySnapshot === 'function') return runtime;
      if (core && typeof core.getPanicRecoverySnapshot === 'function') return core;
      if (runtime && typeof runtime.getTemplateApi === 'function') {
        const templateApi = runtime.getTemplateApi();
        if (templateApi && typeof templateApi.getPanicRecoverySnapshot === 'function') return templateApi;
      }
      return null;
    }

    function listPanicRecoveryRecords() {
      const source = resolvePanicRecoverySource();
      if (source && typeof source.listPanicRecoveryRecords === 'function') {
        return source.listPanicRecoveryRecords().map((record) => cloneSafe(record, {}));
      }
      return [];
    }

    function createPanicRecoverySnapshot() {
      const source = resolvePanicRecoverySource();
      const sourceSnapshot = source && typeof source.getPanicRecoverySnapshot === 'function'
        ? source.getPanicRecoverySnapshot()
        : null;
      const records = listPanicRecoveryRecords();
      const trustVerdicts = source && typeof source.listTrustVerdicts === 'function' ? source.listTrustVerdicts() : [];
      const panicEvents = source && typeof source.listPanicEvents === 'function' ? source.listPanicEvents() : [];
      const safeSnapshots = source && typeof source.listSafeSnapshots === 'function' ? source.listSafeSnapshots() : [];
      const recoveryOutcomes = source && typeof source.listRecoveryOutcomes === 'function' ? source.listRecoveryOutcomes() : [];
      const quarantineScopes = source && typeof source.listQuarantinedScopes === 'function' ? source.listQuarantinedScopes() : [];
      return {
        schema: 'xtend.rmt.kernel-orchestration-panic-recovery.v1',
        supported: Boolean(source),
        status: source ? 'available' : 'unavailable',
        lane: 'diagnostics',
        trustVerdictCount: trustVerdicts.length,
        blockedTrustVerdictCount: trustVerdicts.filter((record) => record && record.commitAllowed === false).length,
        panicEventCount: panicEvents.length,
        safeSnapshotCount: safeSnapshots.length,
        recoveryOutcomeCount: recoveryOutcomes.length,
        quarantineScopeCount: quarantineScopes.length,
        quarantineScopes: cloneSafe(quarantineScopes, []),
        records,
        snapshot: cloneSafe(sourceSnapshot, null),
        fabricMirroredRecordCount: bridgedPanicRecoveryRecordCount
      };
    }

    function bridgePanicRecoveryRecordsToFabric() {
      const fabric = options.fabric || options.fabricRuntime || null;
      if (!fabric || typeof fabric.recordKernelPanicRecovery !== 'function') return 0;
      const records = listPanicRecoveryRecords().slice(bridgedPanicRecoveryRecordCount);
      records.forEach((record) => {
        fabric.recordKernelPanicRecovery(record, {
          source: 'rmt-kernel-orchestration-controller',
          metadata: {
            controllerSchema: RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA
          }
        });
      });
      bridgedPanicRecoveryRecordCount += records.length;
      return records.length;
    }

    function summarizePerformanceFileArtifact(fileArtifact) {
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

    function createPerformanceSnapshot() {
      if (!performanceRuntime || typeof performanceRuntime !== 'object') {
        return plan.performance && typeof plan.performance === 'object'
          ? cloneSafe(plan.performance, {})
          : {
              schema: 'xtend.rmt.kernel-performance-snapshot.v1',
              supported: false,
              status: 'unavailable',
              runtimeExpectedStatus: plan.enabled ? 'booted' : 'disabled',
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
          diagnostics.push(createDiagnostic(
            `xtend.rmt.kernel_orchestration.performance_${label}_failed`,
            'warning',
            error && error.message ? error.message : String(error)
          ));
          return fallback;
        }
      }
      const runtimeSnapshot = typeof performanceRuntime.getSnapshot === 'function'
        ? guarded('snapshot', null, () => performanceRuntime.getSnapshot('kernel-orchestration-snapshot'))
        : null;
      const budgetSnapshot = typeof performanceRuntime.evaluateBudgets === 'function'
        ? guarded('budgets', null, () => performanceRuntime.evaluateBudgets('kernel-orchestration-snapshot'))
        : null;
      const backpressureProfile = typeof performanceRuntime.getBackpressureProfile === 'function'
        ? guarded('backpressure', runtimeSnapshot && runtimeSnapshot.backpressureProfile || null, () => performanceRuntime.getBackpressureProfile('kernel-orchestration-snapshot'))
        : (runtimeSnapshot && runtimeSnapshot.backpressureProfile || null);
      const runReport = typeof performanceRuntime.exportRunReport === 'function'
        ? guarded('run_report', null, () => performanceRuntime.exportRunReport('kernel-orchestration-snapshot', {
            runId: 'kernel-orchestration',
            label: 'XTend Kernel Orchestration Runtime'
          }))
        : null;
      const baseline = runReport && typeof performanceRuntime.createRunBaseline === 'function'
        ? guarded('baseline', null, () => performanceRuntime.createRunBaseline([runReport], {
            baselineId: 'kernel-orchestration-baseline',
            label: 'XTend Kernel Orchestration Baseline'
          }))
        : null;
      const baselineComparison = runReport && baseline && typeof performanceRuntime.compareRunReportToBaseline === 'function'
        ? guarded('baseline_comparison', null, () => performanceRuntime.compareRunReportToBaseline(runReport, baseline, {
            label: 'XTend Kernel Orchestration Baseline Comparison'
          }))
        : null;
      const ciSummary = runReport && typeof performanceRuntime.createCiSummary === 'function'
        ? guarded('ci_summary', null, () => performanceRuntime.createCiSummary(runReport, {
            summaryId: 'kernel-orchestration-summary',
            title: 'XTend Kernel Orchestration Performance Summary'
          }))
        : null;
      const fileArtifact = runReport && typeof performanceRuntime.createFileArtifact === 'function'
        ? guarded('file_artifact', null, () => summarizePerformanceFileArtifact(performanceRuntime.createFileArtifact(runReport, {
            artifactId: 'kernel-orchestration-performance',
            artifactType: 'run_report',
            fileName: 'xtend.kernel-orchestration.performance.json'
          })))
        : null;
      return {
        schema: 'xtend.rmt.kernel-performance-snapshot.v1',
        supported: true,
        status: 'available',
        runtimeExpectedStatus: plan.enabled ? 'booted' : 'disabled',
        runtimeKind: runtimeSnapshot && runtimeSnapshot.runtimeKind || '',
        pressureLevel: backpressureProfile && backpressureProfile.pressureLevel || runtimeSnapshot && runtimeSnapshot.pressureLevel || 'normal',
        runtimeSnapshot,
        budgetSnapshot,
        backpressureProfile,
        ciSummary,
        fileArtifact,
        baselineComparison,
        diagnostics
      };
    }

    function trimControllerTelemetry(store) {
      const limit = Number.isInteger(options.telemetryLimit) && options.telemetryLimit > 0 ? options.telemetryLimit : 200;
      while (store.length > limit) store.shift();
    }

    function recordAppRuntimeBackpressure(recordInput = {}, metadataInput = {}) {
      const record = cloneSafe(recordInput, {});
      const metadata = cloneSafe(metadataInput, {});
      const streamPressure = record.streamPressure && typeof record.streamPressure === 'object' ? record.streamPressure : record;
      const normalized = {
        schema: 'xtend.rmt.kernel-orchestration-app-runtime-backpressure.v1',
        id: record.id || `app-runtime-backpressure.${appRuntimeBackpressureRecords.length + 1}`,
        timestamp: record.timestamp || nowIso(),
        source: record.source || 'rmt-app-runtime',
        streamId: streamPressure.streamId || '',
        patchType: streamPressure.patchType || '',
        terminal: streamPressure.terminal === true,
        pressureLevel: streamPressure.level || streamPressure.pressureLevel || 'none',
        score: Number.isFinite(Number(streamPressure.score)) ? Number(streamPressure.score) : 0,
        action: streamPressure.action || '',
        lane: streamPressure.lane || 'idle',
        schedulerLane: streamPressure.schedulerLane || 'idle_maintenance',
        scheduleRef: streamPressure.scheduleRef || 'rmt.stream.patch',
        correlationId: streamPressure.correlationId || record.correlationId || null,
        streamPressure,
        metadata
      };
      appRuntimeBackpressureRecords.push(normalized);
      trimControllerTelemetry(appRuntimeBackpressureRecords);

      const yieldAction = record.yieldAction || metadata.yieldAction || null;
      if (yieldAction) {
        appRuntimeYieldActions.push(cloneSafe(yieldAction, yieldAction));
        trimControllerTelemetry(appRuntimeYieldActions);
      }

      const performanceSample = record.performanceSample || {
        schema: 'xtend.rmt.app-runtime-stream-pressure-sample.v1',
        source: 'rmt.app_runtime.stream-pressure',
        phase: normalized.terminal ? 'stream-terminal' : 'stream-pressure',
        lane: 'idle_maintenance',
        scheduleRef: normalized.scheduleRef,
        durationMs: Math.max(1, normalized.score * (normalized.pressureLevel === 'critical' ? 10 : 6)),
        longTask: normalized.pressureLevel === 'critical',
        pressureLevel: normalized.pressureLevel,
        streamId: normalized.streamId,
        patchType: normalized.patchType,
        terminal: normalized.terminal,
        correlationId: normalized.correlationId
      };
      let schedulerResult = null;
      if (kernelScheduler && typeof kernelScheduler.updatePressure === 'function') {
        const schedulerPressure = {
          none: 'normal',
          low: 'normal',
          medium: 'elevated',
          high: 'constrained',
          critical: 'critical'
        }[normalized.pressureLevel] || 'normal';
        kernelScheduler.updatePressure(schedulerPressure);
      }
      const prewarmWorker = runtime && typeof runtime.getPrewarmWorkerRuntime === 'function'
        ? runtime.getPrewarmWorkerRuntime()
        : null;
      if (normalized.pressureLevel === 'critical' && prewarmWorker && typeof prewarmWorker.pauseForBackpressure === 'function') {
        prewarmWorker.pauseForBackpressure('critical_backpressure');
      } else if ((normalized.pressureLevel === 'none' || normalized.pressureLevel === 'low') && prewarmWorker && typeof prewarmWorker.resume === 'function') {
        prewarmWorker.resume('pressure_recovered');
      }
      if (performanceRuntime && typeof performanceRuntime.reportPerformanceSample === 'function') {
        try {
          schedulerResult = performanceRuntime.reportPerformanceSample(performanceSample);
        } catch (error) {
          schedulerResult = {
            ok: false,
            error: error && error.message ? error.message : String(error)
          };
        }
      }
      appRuntimeSchedulerSamples.push({
        ...performanceSample,
        schedulerPressureSampled: Boolean(schedulerResult),
        schedulerResult: cloneSafe(schedulerResult, schedulerResult)
      });
      trimControllerTelemetry(appRuntimeSchedulerSamples);
      return {
        ...normalized,
        schedulerResult: cloneSafe(schedulerResult, schedulerResult)
      };
    }

    function createAppRuntimeBackpressureSnapshot() {
      const highest = appRuntimeBackpressureRecords.reduce((current, record) => {
        const levelScore = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
        return (levelScore[record.pressureLevel] || 0) > (levelScore[current] || 0) ? record.pressureLevel : current;
      }, 'none');
      return {
        schema: 'xtend.rmt.kernel-orchestration-app-runtime-backpressure-snapshot.v1',
        recordCount: appRuntimeBackpressureRecords.length,
        yieldActionCount: appRuntimeYieldActions.length,
        schedulerSampleCount: appRuntimeSchedulerSamples.length,
        highestPressureLevel: highest,
        records: appRuntimeBackpressureRecords.slice(-50),
        yieldActions: appRuntimeYieldActions.slice(-50),
        schedulerSamples: appRuntimeSchedulerSamples.slice(-50)
      };
    }

    function resolveFiber(kind, metadata = {}) {
      const requested = clampString(kind);
      if (metadata.fiberId) {
        const exact = fibers.find((fiber) => fiber.id === metadata.fiberId);
        if (exact) return exact;
      }
      if (metadata.operation) {
        const operation = fibers.find((fiber) => fiber.operation === metadata.operation);
        if (operation) return operation;
      }
      if (metadata.action) {
        const action = fibers.find((fiber) => fiber.kind === 'action' && fiber.target && fiber.target.ref === metadata.action);
        if (action) return action;
      }
      if (metadata.eventId) {
        const event = fibers.find((fiber) => fiber.kind === 'event' && fiber.target && fiber.target.ref === metadata.eventId);
        if (event) return event;
      }
      if (metadata.hydrationId) {
        const hydration = fibers.find((fiber) => fiber.kind === 'hydration' && fiber.target && String(fiber.target.ref || '').includes(metadata.hydrationId));
        if (hydration) return hydration;
      }
      if (requested === 'destroy' || requested === 'dispose' || metadata.lifecycleOperation === 'destroy' || metadata.lifecycleOperation === 'dispose') {
        const lifecycle = fibers.find((fiber) => (
          fiber.kind === 'lifecycle'
          && (
            fiber.op === 'dispose'
            || fiber.op === 'destroy'
            || String(fiber.operation || '').includes('/dispose')
            || String(fiber.operation || '').includes('/destroy')
          )
          && (!metadata.targetRef || fiber.target && String(fiber.target.ref || '').includes(metadata.targetRef))
        ));
        if (lifecycle) return lifecycle;
      }
      return fibers.find((fiber) => fiber.op === requested || fiber.kind === requested)
        || (requested === 'render' ? fibers.find((fiber) => fiber.op === 'hydrate' || fiber.op === 'mount') : null)
        || null;
    }

    function recordFallback(kind, fiber, metadata) {
      fallbackCount += 1;
      const diagnostic = createDiagnostic(
        'xtend.rmt.kernel_orchestration.fallback',
        strict ? 'error' : 'warning',
        `Kernel orchestration work "${kind}" has no declared fiber and requires a synthetic work intent.`,
        {
          kind,
          fiber: fiber && fiber.id || null,
          metadata
        }
      );
      publishDiagnostic(diagnostic);
      if (strict) {
        const error = new Error(diagnostic.message);
        error.code = diagnostic.code;
        error.diagnostic = diagnostic;
        throw error;
      }
      return diagnostic;
    }

    function canonicalSchedulerLane(value, kind = '') {
      const lane = clampString(value, 'visible');
      if (lane === 'user-blocking' || lane === 'visible' || lane === 'transition' || lane === 'idle' || lane === 'background' || lane === 'diagnostics') return lane;
      if (lane === 'after_paint') return 'visible';
      if (kind === 'dispose' || kind === 'destroy' || kind === 'command' || kind === 'state') return 'user-blocking';
      return 'visible';
    }

    function assertNoInlineBypass(kind, metadata) {
      if (metadata.inline !== true && metadata.runInline !== true) return;
      const diagnostic = publishDiagnostic(createDiagnostic(
        'xtend.rmt.kernel_orchestration.inline_removed',
        strict ? 'error' : 'warning',
        `Kernel orchestration work "${kind}" requested removed inline scheduling and will use the kernel queue.`,
        { kind, inline: metadata.inline === true, runInline: metadata.runInline === true }
      ));
      if (strict) {
        const error = new Error(diagnostic.message);
        error.code = diagnostic.code;
        error.diagnostic = diagnostic;
        throw error;
      }
    }

    function trackScheduledHandle(handle, entry) {
      fiberHistory.push(entry);
      handle.result.then(
        () => {
          entry.status = handle.status;
          entry.reason = handle.reason;
          bridgePanicRecoveryRecordsToFabric();
        },
        () => {
          entry.status = handle.status;
          entry.reason = handle.reason;
          bridgePanicRecoveryRecordsToFabric();
        }
      );
      return handle;
    }

    function runFabricFiber(fiber, schedule, kind, jobContext, callback, metadata) {
      const fabric = options.fabric || options.fabricRuntime || null;
      const workContext = {
        schema: 'xtend.rmt.kernel-orchestration-work.v2',
        scheduled: true,
        kind,
        fiber,
        schedule,
        jobContext,
        metadata: cloneSafe(metadata, {})
      };
      if (!fabric || typeof fabric.runFiber !== 'function') return callback(workContext);
      return fabric.runFiber({
        ...cloneSafe(fiber, {}),
        id: fiber.id || `rmt.orchestration.${kind}`,
        kind: fiber.kind || kind,
        operation: fiber.operation || `operation:rmt.orchestration/${kind}`,
        lane: schedule.lane,
        scheduleRef: schedule.id,
        endpointName: schedule.endpointName,
        correlationId: metadata.correlationId || null,
        metadata: { ...cloneSafe(fiber.metadata, {}), schedulerJobId: jobContext.jobId }
      }, () => callback(workContext));
    }

    function scheduleWork(kind, callback, metadata = {}) {
      if (typeof callback !== 'function') return undefined;
      assertNoInlineBypass(kind, metadata);
      const resolvedFiber = resolveFiber(kind, metadata);
      if (!resolvedFiber) recordFallback(kind, null, metadata);
      const fiber = resolvedFiber || {
        id: `rmt.orchestration.${kind}`,
        kind,
        op: kind,
        operation: metadata.operation || `operation:rmt.orchestration/${kind}`,
        endpointName: metadata.endpointName || `rmt.orchestration.${kind}`,
        lane: metadata.lane || 'visible'
      };
      const schedule = scheduleByEndpoint.get(fiber.endpointName) || {
        id: fiber.endpointName,
        endpointName: fiber.endpointName,
        scope: fiber.operation || 'rmt.orchestration',
        lane: fiber.lane || 'visible'
      };
      dispatchEvent('xtend-maraca:kernel-schedule', {
        schema: 'xtend.maraca.kernel-schedule.v2',
        endpointName: schedule.endpointName,
        scope: schedule.scope,
        fiber: fiber.id,
        kind,
        correlationId: metadata.correlationId || null
      });
      const handle = kernelScheduler.schedule({
        endpointName: schedule.endpointName,
        scope: schedule.scope || 'rmt.orchestration',
        rootId: metadata.rootId,
        lane: canonicalSchedulerLane(metadata.lane || schedule.lane || fiber.lane, kind),
        priority: metadata.priority != null ? metadata.priority : schedule.priority,
        deadlineMs: metadata.deadlineMs != null ? metadata.deadlineMs : schedule.deadlineMs,
        timeoutMs: metadata.timeoutMs,
        delayMs: metadata.delayMs,
        budgetClass: metadata.budgetClass || schedule.budgetClass,
        maxChunkMs: metadata.maxChunkMs,
        coalesceKey: metadata.coalesceKey || schedule.coalesceKey,
        strategy: metadata.strategy || (kind === 'after-paint' || fiber.lane === 'after_paint' ? 'after_paint' : 'microtask'),
        metadata: {
          ...metadata,
          kind,
          fiberId: fiber.id
        }
      }, (jobContext) => runFabricFiber(fiber, schedule, kind, jobContext, callback, metadata));
      const historyEntry = {
        fiber: fiber.id,
        kind,
        endpointName: schedule.endpointName,
        schedulerJobId: handle.id,
        status: handle.status,
        correlationId: metadata.correlationId || null
      };
      dispatchEvent('xtend-maraca:kernel-fiber', {
        schema: 'xtend.maraca.kernel-fiber.v2',
        ...historyEntry
      });
      return trackScheduledHandle(handle, historyEntry);
    }

    function scheduleEndpoint(endpointName, scope, callback, metadata = {}) {
      if (typeof callback !== 'function') throw new TypeError('scheduleEndpoint() requires a callback.');
      assertNoInlineBypass('endpoint', metadata);
      const schedule = scheduleByEndpoint.get(endpointName) || {
        id: endpointName,
        endpointName,
        scope: scope || 'xtend.registry',
        lane: metadata.lane || 'visible',
        timeout: metadata.timeout
      };
      const handle = kernelScheduler.schedule({
        endpointName,
        scope: scope || schedule.scope,
        rootId: metadata.rootId,
        lane: canonicalSchedulerLane(metadata.lane || schedule.lane, metadata.kind || 'endpoint'),
        priority: metadata.priority != null ? metadata.priority : schedule.priority,
        deadlineMs: metadata.deadlineMs != null ? metadata.deadlineMs : (schedule.deadlineMs || metadata.timeout),
        timeoutMs: metadata.timeoutMs,
        delayMs: metadata.delayMs,
        budgetClass: metadata.budgetClass || schedule.budgetClass,
        maxChunkMs: metadata.maxChunkMs,
        coalesceKey: metadata.coalesceKey || schedule.coalesceKey,
        strategy: metadata.strategy || (metadata.kind === 'after_paint' ? 'after_paint' : 'microtask'),
        metadata: { ...metadata, endpointName, scope: scope || schedule.scope }
      }, callback);
      const historyEntry = {
        fiber: metadata.fiberId || null,
        kind: metadata.kind || 'endpoint',
        endpointName,
        schedulerJobId: handle.id,
        status: handle.status,
        correlationId: metadata.correlationId || null
      };
      return trackScheduledHandle(handle, historyEntry);
    }

    let disposed = false;
    function dispose() {
      if (disposed) return;
      disposed = true;
      [runtime, schedulerBridge, performanceRuntime].forEach((instance) => {
        if (instance && typeof instance.dispose === 'function') instance.dispose();
      });
      if (ownsKernelScheduler && kernelScheduler && typeof kernelScheduler.dispose === 'function') {
        kernelScheduler.dispose('orchestration_controller_disposed');
      }
      runtime = null;
      core = null;
      schedulerBridge = null;
      performanceRuntime = null;
      runtimeStatus = 'disposed';
    }

    function activateSchedules() {
      if (!schedulerBridge) return;
      schedules.forEach((schedule) => {
        if (!schedule || !schedule.endpointName) return;
        schedulerBridge.scheduleEndpoint(schedule.endpointName, schedule.scope || 'rmt.orchestration', () => ({
          schema: 'xtend.rmt.kernel-orchestration-endpoint-activation.v1',
          endpointName: schedule.endpointName
        }), {
          schedule,
          metadata: {
            operation: 'kernel.activate',
            schedule: schedule.id
          }
        });
      });
    }

    function boot() {
      if (!plan.enabled || !artifact) {
        return snapshot();
      }
      try {
        if (!kernelApi || typeof kernelApi.createRmtPerformanceRuntime !== 'function' || typeof kernelApi.createRmtStateSchedulerDiagnosticsBridge !== 'function') {
          throw new Error('XTend RMT kernel runtime module is not available.');
        }
        if (bootMode === 'productSurface') {
          if (!productSurface) {
            if (!kernelApi || typeof kernelApi.createRmtProductSurface !== 'function') {
              throw new Error('XTend RMT Product Surface is not available for productSurface kernel boot.');
            }
            productSurface = kernelApi.createRmtProductSurface(options.productSurfaceOptions || {});
          }
          if (!productSurface || typeof productSurface.createPerformanceRuntime !== 'function' || typeof productSurface.createCore !== 'function' || typeof productSurface.createRuntime !== 'function') {
            throw new Error('XTend RMT Product Surface does not expose runtime/core/performance factories.');
          }
          performanceRuntime = productSurface.createPerformanceRuntime({
            windowTarget: options.windowTarget,
            documentTarget: options.documentTarget,
            hostAdapter,
            runtimeKind: options.runtimeKind || 'kernel-orchestration',
            schedules
          });
          schedulerBridge = kernelApi.createRmtStateSchedulerDiagnosticsBridge({
            performanceRuntime,
            schedules,
            scheduler: kernelScheduler
          });
          core = productSurface.createCore({
            windowTarget: options.windowTarget,
            documentTarget: options.documentTarget,
            hostAdapter,
            kernelRecords: artifact.records,
            scheduler: kernelScheduler
          });
          runtime = productSurface.createRuntime({
            windowTarget: options.windowTarget,
            documentTarget: options.documentTarget,
            hostAdapter,
            core,
            rmtCore: core,
            performanceRuntime,
            kernelRecords: artifact.records,
            scheduler: kernelScheduler,
            enablePrewarmWorker: isPrewarmWorkerEnabled(),
            enableUiCoprocessor: isUiCoprocessorEnabled(),
            uiCoprocessor: normalizeUiCoprocessorPlan(),
            prewarmWorkerName: options.prewarmWorkerName || plan.prewarmWorker && plan.prewarmWorker.workerName,
            prewarmWorkerType: options.prewarmWorkerType || plan.prewarmWorker && plan.prewarmWorker.workerType
          });
        } else {
          performanceRuntime = kernelApi.createRmtPerformanceRuntime({
          windowTarget: options.windowTarget,
          documentTarget: options.documentTarget,
          hostAdapter,
          runtimeKind: options.runtimeKind || 'kernel-orchestration',
          schedules
          });
          schedulerBridge = kernelApi.createRmtStateSchedulerDiagnosticsBridge({
            performanceRuntime,
            schedules,
            scheduler: kernelScheduler
          });
          core = typeof kernelApi.createRmtCore === 'function' ? kernelApi.createRmtCore({
            windowTarget: options.windowTarget,
            documentTarget: options.documentTarget,
            hostAdapter,
            kernelRecords: artifact.records,
            scheduler: kernelScheduler
          }) : null;
          runtime = typeof kernelApi.createRmtRuntime === 'function' ? kernelApi.createRmtRuntime({
            windowTarget: options.windowTarget,
            documentTarget: options.documentTarget,
            hostAdapter,
            core,
            rmtCore: core,
            performanceRuntime,
            kernelRecords: artifact.records,
            scheduler: kernelScheduler,
            enablePrewarmWorker: isPrewarmWorkerEnabled(),
            enableUiCoprocessor: isUiCoprocessorEnabled(),
            uiCoprocessor: normalizeUiCoprocessorPlan(),
            prewarmWorkerName: options.prewarmWorkerName || plan.prewarmWorker && plan.prewarmWorker.workerName,
            prewarmWorkerType: options.prewarmWorkerType || plan.prewarmWorker && plan.prewarmWorker.workerType
          }) : null;
        }
        activateSchedules();
        runtimeStatus = 'booted';
        bridgePanicRecoveryRecordsToFabric();
        dispatchEvent('xtend-maraca:kernel-boot', {
          schema: 'xtend.maraca.kernel-boot.v1',
          mode: plan.mode,
          status: runtimeStatus,
          summary: plan.summary || {},
          scheduledEndpointCount: listScheduledEndpoints().length
        });
      } catch (error) {
        runtimeStatus = 'error';
        const diagnostic = publishDiagnostic(createDiagnostic('xtend.rmt.kernel_orchestration.boot_failed', 'error', error && error.message ? error.message : String(error)));
        dispatchEvent('xtend-maraca:kernel-error', diagnostic);
        if (strict) throw error;
      }
      return snapshot();
    }

    function snapshot() {
      bridgePanicRecoveryRecordsToFabric();
      return {
        schema: 'xtend.rmt.kernel-orchestration-snapshot.v1',
        controllerSchema: RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA,
        mode: plan.mode || 'auto',
        bootMode,
        status: runtimeStatus,
        planStatus: plan.status || null,
        enabled: Boolean(runtime || core || schedulerBridge),
        summary: cloneSafe(plan.summary, {}),
        featureAdoption: createFeatureAdoptionSnapshot(),
        productSurface: createProductSurfaceSnapshot(),
        performance: createPerformanceSnapshot(),
        appRuntimeBackpressure: createAppRuntimeBackpressureSnapshot(),
        prewarmWorker: createPrewarmWorkerSnapshot(),
        panicRecovery: createPanicRecoverySnapshot(),
        scheduler: kernelScheduler.snapshot(),
        scheduledEndpoints: listScheduledEndpoints(),
        fibers: fiberHistory.slice(),
        fallbackCount,
        diagnostics: listDiagnostics()
      };
    }

    const controller = {
      schema: RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA,
      enabled: Boolean(plan.enabled && artifact),
      mode: plan.mode || 'auto',
      get status() {
        return runtimeStatus;
      },
      get runtime() {
        return runtime;
      },
      get core() {
        return core;
      },
      get performanceRuntime() {
        return performanceRuntime;
      },
      get schedulerBridge() {
        return schedulerBridge;
      },
      get scheduler() {
        return kernelScheduler;
      },
      get hostAdapter() {
        return hostAdapter;
      },
      boot,
      scheduleWork,
      scheduleEndpoint,
      dispose,
      recordAppRuntimeBackpressure,
      listScheduledEndpoints,
      listDiagnostics,
      listPanicRecoveryRecords,
      getPanicRecoverySnapshot: createPanicRecoverySnapshot,
      snapshot
    };

    return Object.freeze(controller);
  }

  return Object.freeze({
    RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA,
    RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA,
    createRmtKernelOrchestrationController
  });
}

const __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__ = createKernelOrchestrationControllerModule();

export const RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA = __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__.RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA;
export const RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__.RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA;
export const createRmtKernelOrchestrationController = __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__.createRmtKernelOrchestrationController;

export default __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__;
