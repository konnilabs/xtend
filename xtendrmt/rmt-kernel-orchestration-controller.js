(function attachRmtKernelOrchestrationController(globalTarget, factory) {
  const api = factory(globalTarget || {});

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendRmtKernelOrchestrationController = Object.freeze(api);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createKernelOrchestrationControllerModule(globalTarget) {
  const RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA = 'xtend.rmt.kernel-orchestration-controller.v1';
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

  function defaultDispatchEvent(name, detail) {
    const target = globalTarget && globalTarget.window ? globalTarget.window : globalTarget;
    if (!target || typeof target.dispatchEvent !== 'function' || typeof target.CustomEvent !== 'function') return;
    target.dispatchEvent(new target.CustomEvent(name, { detail }));
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
    const scheduler = artifact && artifact.scheduler || options.scheduler || null;
    const schedules = toArray(scheduler && scheduler.schedules);
    const fibers = toArray(scheduler && scheduler.fibers);
    const scheduleByEndpoint = new Map(schedules.map((schedule) => [schedule.endpointName, schedule]));
    const diagnostics = toArray(options.diagnostics || plan.diagnostics).map(sanitizeDiagnostic);
    const dispatchEvent = typeof options.dispatchEvent === 'function' ? options.dispatchEvent : defaultDispatchEvent;
    let runtime = null;
    let core = null;
    let performanceRuntime = null;
    let schedulerBridge = null;
    let hostAdapter = options.hostAdapter || null;
    let runtimeStatus = plan.enabled && artifact ? 'pending' : clampString(plan.status, 'disabled');
    const fiberHistory = [];
    let fallbackCount = 0;

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
      return fibers.find((fiber) => fiber.op === requested || fiber.kind === requested)
        || (requested === 'render' ? fibers.find((fiber) => fiber.op === 'hydrate' || fiber.op === 'mount') : null)
        || null;
    }

    function recordFallback(kind, fiber, metadata) {
      fallbackCount += 1;
      const diagnostic = createDiagnostic(
        'xtend.rmt.kernel_orchestration.fallback',
        strict ? 'error' : 'warning',
        `Kernel orchestration work "${kind}" could not be scheduled and used fallback execution.`,
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

    function scheduleWork(kind, callback, metadata = {}) {
      if (typeof callback !== 'function') return undefined;
      const fiber = resolveFiber(kind, metadata);
      if (!schedulerBridge || !fiber || !fiber.endpointName) {
        recordFallback(kind, fiber, metadata);
        fiberHistory.push({
          fiber: fiber && fiber.id || null,
          kind,
          endpointName: fiber && fiber.endpointName || null,
          status: 'fallback'
        });
        return callback({
          schema: 'xtend.rmt.kernel-orchestration-work.v1',
          scheduled: false,
          kind,
          metadata: cloneSafe(metadata, {})
        });
      }
      const schedule = scheduleByEndpoint.get(fiber.endpointName) || {
        id: fiber.endpointName,
        endpointName: fiber.endpointName,
        scope: fiber.operation || 'rmt.orchestration',
        lane: fiber.lane || 'visible'
      };
      dispatchEvent('xtend-maraca:kernel-schedule', {
        schema: 'xtend.maraca.kernel-schedule.v1',
        endpointName: schedule.endpointName,
        scope: schedule.scope,
        fiber: fiber.id,
        kind,
        correlationId: metadata.correlationId || null
      });
      const result = schedulerBridge.scheduleEndpoint(schedule.endpointName, schedule.scope || 'rmt.orchestration', (jobContext) => callback({
        schema: 'xtend.rmt.kernel-orchestration-work.v1',
        scheduled: true,
        kind,
        fiber,
        schedule,
        jobContext,
        metadata: cloneSafe(metadata, {})
      }), {
        schedule,
        runInline: metadata.runInline === false ? false : true,
        metadata: {
          ...metadata,
          kind,
          fiberId: fiber.id
        }
      });
      const historyEntry = {
        fiber: fiber.id,
        kind,
        endpointName: schedule.endpointName,
        status: result && result.status || 'unknown',
        correlationId: metadata.correlationId || null
      };
      fiberHistory.push(historyEntry);
      dispatchEvent('xtend-maraca:kernel-fiber', {
        schema: 'xtend.maraca.kernel-fiber.v1',
        ...historyEntry
      });
      return result && result.handle && Object.prototype.hasOwnProperty.call(result.handle, 'targetResult')
        ? result.handle.targetResult
        : result;
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
          runInline: true,
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
        performanceRuntime = kernelApi.createRmtPerformanceRuntime({
          windowTarget: options.windowTarget,
          documentTarget: options.documentTarget,
          hostAdapter,
          runtimeKind: options.runtimeKind || 'kernel-orchestration',
          schedules
        });
        schedulerBridge = kernelApi.createRmtStateSchedulerDiagnosticsBridge({
          performanceRuntime,
          schedules
        });
        core = typeof kernelApi.createRmtCore === 'function' ? kernelApi.createRmtCore({
          windowTarget: options.windowTarget,
          documentTarget: options.documentTarget,
          hostAdapter,
          kernelRecords: artifact.records,
          scheduler
        }) : null;
        runtime = typeof kernelApi.createRmtRuntime === 'function' ? kernelApi.createRmtRuntime({
          windowTarget: options.windowTarget,
          documentTarget: options.documentTarget,
          hostAdapter,
          core,
          renderManCore: core,
          performanceRuntime,
          kernelRecords: artifact.records,
          scheduler
        }) : null;
        activateSchedules();
        runtimeStatus = 'booted';
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
      return {
        schema: 'xtend.rmt.kernel-orchestration-snapshot.v1',
        controllerSchema: RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA,
        mode: plan.mode || 'auto',
        status: runtimeStatus,
        planStatus: plan.status || null,
        enabled: Boolean(runtime || core || schedulerBridge),
        summary: cloneSafe(plan.summary, {}),
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
      get hostAdapter() {
        return hostAdapter;
      },
      boot,
      scheduleWork,
      listScheduledEndpoints,
      listDiagnostics,
      snapshot
    };

    return Object.freeze(controller);
  }

  return Object.freeze({
    RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA,
    RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA,
    createRmtKernelOrchestrationController
  });
});

const __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__ = globalThis.XTendRmtKernelOrchestrationController;

export const RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA = __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__.RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA;
export const RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__.RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA;
export const createRmtKernelOrchestrationController = __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__.createRmtKernelOrchestrationController;

export default __XTEND_RMT_KERNEL_ORCHESTRATION_CONTROLLER_API__;
