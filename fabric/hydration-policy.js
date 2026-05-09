(function attachXtendHydrationPolicy(globalTarget, factory) {
  const laneMapping = typeof module === 'object' && module.exports
    ? require('./rmt-lane-mapping')
    : (globalTarget && globalTarget.XTendFabricRmtLaneMapping);
  const api = factory(laneMapping || {});

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendFabricHydrationPolicy = Object.freeze({
      schema: api.CONTRACTS.hydrationPolicy,
      contracts: api.CONTRACTS,
      policies: api.HYDRATION_POLICIES,
      resolveHydrationPolicy: api.resolveHydrationPolicy,
      createHydrationFiberInput: api.createHydrationFiberInput,
      createHydrationPolicyController: api.createHydrationPolicyController,
      createHydrationScheduleRecords: api.createHydrationScheduleRecords
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendHydrationPolicyModule(laneMappingApi) {
  const CONTRACTS = Object.freeze({
    hydrationPolicy: 'xtend.fabric.hydration-policy.v1',
    hydrationDecision: 'xtend.fabric.hydration-decision.v1',
    fiber: 'xtend.fabric.fiber.v1',
    laneMapping: 'xtend.fabric.rmt-lane-mapping.v1',
    rmtSchedule: 'xtend.fabric.rmt-lane-schedule.v1',
    performanceRegression: 'xtend.performance.regression-gate.v1'
  });
  const BROWSER_NAMESPACE = 'window.XTendFabricHydrationPolicy';
  const HYDRATION_POLICY_IDS = Object.freeze(['visible', 'idle', 'lazy']);
  const NON_BLOCKING_LANES = Object.freeze(['idle', 'background', 'diagnostics']);
  const BACKPRESSURE_LEVEL_ORDER = Object.freeze({
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  });

  const HYDRATION_POLICIES = Object.freeze({
    visible: Object.freeze({
      schema: CONTRACTS.hydrationPolicy,
      id: 'visible',
      mode: 'visible',
      trigger: 'immediate-visible',
      lane: 'visible',
      scheduleRef: 'component.visible.hydrate',
      endpointNameHint: 'xtendrmt.component.hydrate',
      preferIdle: false,
      deadlineMs: 160,
      budgetClass: 'interactive',
      coalesceKey: 'xtend.fabric.component.visible.hydrate',
      rmtDelegation: true,
      userBlockingAllowed: false,
      description: 'Visible hydration is reserved for already visible or focus-critical component work.'
    }),
    idle: Object.freeze({
      schema: CONTRACTS.hydrationPolicy,
      id: 'idle',
      mode: 'idle',
      trigger: 'idle-callback',
      lane: 'idle',
      scheduleRef: 'component.idle.hydrate',
      endpointNameHint: 'xtendrmt.component.hydrate',
      preferIdle: true,
      deadlineMs: 500,
      budgetClass: 'background',
      coalesceKey: 'xtend.fabric.component.idle.hydrate',
      rmtDelegation: true,
      userBlockingAllowed: false,
      description: 'Idle hydration is the default for non-critical hydration work.'
    }),
    lazy: Object.freeze({
      schema: CONTRACTS.hydrationPolicy,
      id: 'lazy',
      mode: 'lazy',
      trigger: 'visible-or-idle',
      lane: 'idle',
      scheduleRef: 'component.lazy.hydrate',
      endpointNameHint: 'xtendrmt.component.hydrate',
      preferIdle: true,
      deadlineMs: 750,
      budgetClass: 'background',
      coalesceKey: 'xtend.fabric.component.lazy.hydrate',
      rmtDelegation: true,
      userBlockingAllowed: false,
      description: 'Lazy hydration waits for visibility or an idle scheduler slot and never blocks user input.'
    })
  });

  function asObject(value) {
    return value && typeof value === 'object' ? value : {};
  }

  function clampString(value, fallback) {
    return typeof value === 'string' && value.length > 0 ? value : fallback;
  }

  function normalizePolicyId(value) {
    const candidate = clampString(value, '').toLowerCase();
    return HYDRATION_POLICY_IDS.includes(candidate) ? candidate : null;
  }

  function backpressureValue(level) {
    return BACKPRESSURE_LEVEL_ORDER[clampString(level, 'none')] || 0;
  }

  function createDiagnostic(code, message, metadata = {}) {
    return {
      level: code.includes('refused') ? 'warn' : 'info',
      code,
      message,
      source: 'fabric.hydration-policy',
      phase: 'hydrate',
      metadata
    };
  }

  function selectPolicyId(options = {}, diagnostics = []) {
    const forced = normalizePolicyId(options.policy || options.hydrationPolicy || options.mode);
    if (forced) {
      diagnostics.push(createDiagnostic('xtend.fabric.hydration_policy.forced', `Hydration policy forced to ${forced}.`, { policy: forced }));
      return forced;
    }

    if (options.critical === true || options.focusRequired === true || options.a11yRepair === true || options.isVisible === true || options.visible === true) {
      return 'visible';
    }

    if (options.lazy === true || options.deferUntilVisible === true || options.loading === 'lazy' || options.isVisible === false || options.visible === false) {
      return 'lazy';
    }

    if (backpressureValue(options.backpressureLevel) >= BACKPRESSURE_LEVEL_ORDER.high) {
      diagnostics.push(createDiagnostic('xtend.fabric.hydration_policy.backpressure_deferred', 'Hydration policy deferred to lazy because backpressure is high.', {
        backpressureLevel: options.backpressureLevel
      }));
      return 'lazy';
    }

    return 'idle';
  }

  function getRmtScheduleResolution(fiberInput) {
    if (laneMappingApi && typeof laneMappingApi.resolveRmtScheduleForFiber === 'function') {
      return laneMappingApi.resolveRmtScheduleForFiber(fiberInput);
    }
    return {
      schema: CONTRACTS.laneMapping,
      ok: true,
      fabricLane: fiberInput.lane,
      rmtLane: fiberInput.lane === 'a11y' ? 'user-blocking' : fiberInput.lane,
      scheduleRef: fiberInput.scheduleRef,
      endpointName: fiberInput.endpointNameHint,
      diagnostics: []
    };
  }

  function resolveHydrationPolicy(options = {}) {
    const safeOptions = asObject(options);
    const diagnostics = [];
    const policyId = selectPolicyId(safeOptions, diagnostics);
    const policy = HYDRATION_POLICIES[policyId] || HYDRATION_POLICIES.idle;
    const componentRef = clampString(safeOptions.componentRef || safeOptions.tag, 'xtend.component');
    const lane = clampString(safeOptions.lane, policy.lane);
    const scheduleRef = clampString(safeOptions.scheduleRef, policy.scheduleRef);
    const endpointNameHint = clampString(safeOptions.endpointNameHint, policy.endpointNameHint);
    const preferIdle = typeof safeOptions.preferIdle === 'boolean' ? safeOptions.preferIdle : policy.preferIdle;

    if ((safeOptions.isVisible === false || safeOptions.visible === false || policyId !== 'visible') && lane === 'user-blocking') {
      diagnostics.push(createDiagnostic('xtend.fabric.hydration_policy.user_blocking_refused', 'Non-visible hydration may not use the user-blocking lane.', {
        requestedLane: lane,
        fallbackLane: policy.lane
      }));
    }

    const safeLane = lane === 'user-blocking' && policyId !== 'visible' ? policy.lane : lane;
    const fiberInput = {
      schema: CONTRACTS.fiber,
      kind: 'component.hydrate',
      phase: 'hydrate',
      source: 'component',
      componentRef,
      scope: clampString(safeOptions.scope, `${componentRef}.hydrate`),
      lane: safeLane,
      scheduleRef,
      endpointNameHint,
      preferIdle,
      deadlineMs: safeOptions.deadlineMs || policy.deadlineMs,
      budgetClass: safeOptions.budgetClass || policy.budgetClass,
      coalesceKey: safeOptions.coalesceKey || `${policy.coalesceKey}.${componentRef}`,
      correlationId: safeOptions.correlationId || `${componentRef}.${policyId}.hydrate`,
      metadata: {
        hydrationPolicy: CONTRACTS.hydrationPolicy,
        hydrationPolicyId: policy.id,
        trigger: policy.trigger,
        rmtDelegation: policy.rmtDelegation,
        visible: safeOptions.visible,
        isVisible: safeOptions.isVisible,
        backpressureLevel: safeOptions.backpressureLevel,
        metadata: safeOptions.metadata
      }
    };
    const scheduleResolution = getRmtScheduleResolution(fiberInput);
    diagnostics.push(...(Array.isArray(scheduleResolution.diagnostics) ? scheduleResolution.diagnostics : []));

    return Object.freeze({
      schema: CONTRACTS.hydrationDecision,
      policyContract: CONTRACTS.hydrationPolicy,
      policy: policy.id,
      mode: policy.mode,
      trigger: policy.trigger,
      componentRef,
      lane: safeLane,
      rmtLane: scheduleResolution.rmtLane || safeLane,
      scheduleRef: scheduleResolution.scheduleRef || scheduleRef,
      endpointNameHint: scheduleResolution.endpointName || endpointNameHint,
      preferIdle,
      deadlineMs: fiberInput.deadlineMs,
      budgetClass: fiberInput.budgetClass,
      coalesceKey: fiberInput.coalesceKey,
      nonBlocking: NON_BLOCKING_LANES.includes(safeLane) || safeLane === 'visible',
      userBlockingAllowed: false,
      rmtDelegation: true,
      diagnostics,
      fiberInput: Object.freeze({
        ...fiberInput,
        scheduleRef: scheduleResolution.scheduleRef || scheduleRef,
        endpointNameHint: scheduleResolution.endpointName || endpointNameHint
      })
    });
  }

  function createHydrationFiberInput(componentRef, options = {}) {
    return resolveHydrationPolicy({
      ...asObject(options),
      componentRef: componentRef || options.componentRef
    }).fiberInput;
  }

  function createHydrationPolicyController(componentRef, controllerOptions = {}) {
    const resolvedComponentRef = clampString(componentRef || controllerOptions.componentRef, 'xtend.component');
    return Object.freeze({
      schema: CONTRACTS.hydrationPolicy,
      componentRef: resolvedComponentRef,
      resolve(options = {}) {
        return resolveHydrationPolicy({
          ...asObject(controllerOptions),
          ...asObject(options),
          componentRef: resolvedComponentRef
        });
      },
      createFiberInput(options = {}) {
        return createHydrationFiberInput(resolvedComponentRef, {
          ...asObject(controllerOptions),
          ...asObject(options)
        });
      },
      hydrate(instrumentation, task, options = {}) {
        if (!instrumentation || typeof instrumentation.hydrate !== 'function') {
          throw new TypeError('Hydration policy controller requires component fiber instrumentation.');
        }
        const decision = this.resolve(options);
        return instrumentation.hydrate(task, decision.fiberInput);
      }
    });
  }

  function createHydrationScheduleRecords() {
    return Object.freeze(Object.keys(HYDRATION_POLICIES).map((policyId) => {
      const policy = HYDRATION_POLICIES[policyId];
      return Object.freeze({
        schema: CONTRACTS.rmtSchedule,
        id: policy.scheduleRef,
        endpointName: policy.endpointNameHint,
        scope: `xtend.fabric.component.${policy.id}.hydrate`,
        lane: policy.lane === 'a11y' ? 'user-blocking' : policy.lane,
        priority: policy.id === 'visible' ? 80 : 35,
        deadlineMs: policy.deadlineMs,
        preferIdle: policy.preferIdle,
        coalesceKey: policy.coalesceKey,
        budgetClass: policy.budgetClass,
        metadata: {
          contract: CONTRACTS.hydrationPolicy,
          hydrationPolicy: policy.id,
          trigger: policy.trigger,
          kernelBoundary: 'RMT sees schedule policy records only; XTend hydration execution stays in Fabric or host adapters.'
        }
      });
    }));
  }

  return Object.freeze({
    CONTRACTS,
    BROWSER_NAMESPACE,
    HYDRATION_POLICIES,
    HYDRATION_POLICY_IDS,
    NON_BLOCKING_LANES,
    resolveHydrationPolicy,
    createHydrationFiberInput,
    createHydrationPolicyController,
    createHydrationScheduleRecords
  });
});
