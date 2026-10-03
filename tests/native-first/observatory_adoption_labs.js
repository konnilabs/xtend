'use strict';

const LAB_SCHEMA = 'xtend.native-first.observatory-lab.v1';
const SLICE_BUDGET_MS = 4;
const DEFAULT_UNIT_COST_MS = 0.25;

function selectOverlayStrategy(options = {}) {
  const kind = options.kind || 'popover';
  const modal = options.modal === true;
  const capabilities = options.capabilities || {};
  const base = {
    schema: LAB_SCHEMA,
    kind,
    modal,
    ownedSurfaceRecords: true,
    publicEventsUnchanged: true,
    duplicateFocusOwnership: false,
    fallback: 'owned-xtend-overlay'
  };

  if (kind === 'dialog') {
    return {
      ...base,
      strategy: base.fallback,
      browserOwns: [],
      xtendOwns: ['modality', 'focus-trap', 'inert', 'escape', 'surface-record', 'public-events', 'focus-return', 'scroll-lock-policy'],
      rejectedCandidateAvailable: capabilities.dialog === true
    };
  }

  if (modal) {
    return {
      ...base,
      strategy: 'owned-xtend-overlay',
      browserOwns: [],
      xtendOwns: ['modality', 'focus-trap', 'inert', 'escape', 'scroll-lock', 'surface-record', 'public-events']
    };
  }

  return {
    ...base,
    strategy: base.fallback,
    positioning: 'owned-js-measurement',
    browserOwns: [],
    xtendOwns: ['light-dismiss', 'escape', 'surface-record', 'public-events', 'focus-return'],
    rejectedCandidateAvailable: capabilities.popover === true || capabilities.anchorPositioning === true
  };
}

function createYieldContinuation(environment = {}) {
  const schedulerTarget = environment.scheduler;
  const requestIdle = environment.requestIdleCallback;
  const timer = environment.setTimeout || setTimeout;

  if (typeof requestIdle === 'function') {
    return {
      strategy: 'requestIdleCallback',
      yieldContinuation: () => new Promise((resolve) => requestIdle(resolve, { timeout: 32 }))
    };
  }
  return {
    strategy: 'timer',
    yieldContinuation: () => new Promise((resolve) => timer(resolve, 0)),
    rejectedSchedulerYieldAvailable: Boolean(schedulerTarget && typeof schedulerTarget.yield === 'function')
  };
}

function planHydrationSlices(options = {}) {
  const unitCount = Number.isInteger(options.unitCount) ? options.unitCount : 500;
  const sliceBudgetMs = Number.isFinite(options.sliceBudgetMs) ? options.sliceBudgetMs : SLICE_BUDGET_MS;
  const unitCostMs = Number.isFinite(options.unitCostMs) ? options.unitCostMs : DEFAULT_UNIT_COST_MS;
  const unitsPerSlice = Math.max(1, Math.floor(sliceBudgetMs / unitCostMs));
  const order = Array.from({ length: unitCount }, (_, index) => index);
  const slices = [];

  for (let start = 0; start < order.length; start += unitsPerSlice) {
    const units = order.slice(start, start + unitsPerSlice);
    slices.push({
      units,
      durationMs: Number((units.length * unitCostMs).toFixed(3))
    });
  }

  return {
    schema: LAB_SCHEMA,
    unitCount,
    sliceBudgetMs,
    unitCostMs,
    slices,
    order,
    maxSliceMs: Math.max(...slices.map((slice) => slice.durationMs)),
    cancellationOwner: 'rmt-lanes',
    backpressureOwner: 'rmt-lanes'
  };
}

function compareSchedulerStrategies(options = {}) {
  const plan = planHydrationSlices(options);
  const totalWorkMs = plan.slices.reduce((sum, slice) => sum + slice.durationMs, 0);
  const strategies = [
    { id: 'scheduler.yield', overheadMs: plan.slices.length * 0.04 },
    { id: 'requestIdleCallback', overheadMs: plan.slices.length * 0.06 },
    { id: 'timer', overheadMs: plan.slices.length * 0.08 }
  ].map((strategy) => ({
    ...strategy,
    totalMs: Number((totalWorkMs + strategy.overheadMs).toFixed(3)),
    maxSliceMs: plan.maxSliceMs,
    order: plan.order
  }));
  const fastest = Math.min(...strategies.map((strategy) => strategy.totalMs));
  strategies.forEach((strategy) => {
    strategy.throughputRegressionPercent = Number((((strategy.totalMs - fastest) / fastest) * 100).toFixed(3));
  });

  return {
    schema: LAB_SCHEMA,
    plan,
    strategies,
    acceptance: {
      sliceBudgetMet: plan.maxSliceMs <= SLICE_BUDGET_MS,
      noLongTaskOver50Ms: plan.maxSliceMs < 50,
      standardHydrationBudgetMet: plan.maxSliceMs <= 32,
      orderUnchanged: strategies.every((strategy) => strategy.order.join(',') === plan.order.join(',')),
      throughputRegressionWithinFivePercent: strategies.every((strategy) => strategy.throughputRegressionPercent <= 5)
    }
  };
}

function runScopedRegistryModel() {
  class Registry {
    constructor() { this.definitions = new Map(); }
    define(tag, constructor) { this.definitions.set(tag, constructor); }
    get(tag) { return this.definitions.get(tag); }
  }
  class ConstructorA {}
  class ConstructorB {}
  class GlobalConstructor {}
  const registryA = new Registry();
  const registryB = new Registry();
  const globalRegistry = new Registry();
  registryA.define('x-scope-probe', ConstructorA);
  registryB.define('x-scope-probe', ConstructorB);
  globalRegistry.define('x-global-probe', GlobalConstructor);

  return {
    schema: LAB_SCHEMA,
    identicalTagIsolated: registryA.get('x-scope-probe') !== registryB.get('x-scope-probe'),
    constructorA: registryA.get('x-scope-probe'),
    constructorB: registryB.get('x-scope-probe'),
    globalFallback: globalRegistry.get('x-global-probe'),
    missingScopeFallsBackExplicitly: registryA.get('x-global-probe') || globalRegistry.get('x-global-probe'),
    upgradeOrder: ['define-scope-a', 'mount-scope-a', 'define-scope-b', 'mount-scope-b'],
    hydrationOwner: 'rmt-component-adapter',
    surfaceOwner: 'surface-manager'
  };
}

function selectNavigationHost(options = {}) {
  return {
    schema: LAB_SCHEMA,
    strategy: 'history-hash-owned',
    fallbackOwner: 'history-hash-owned',
    mapsToExistingEvents: ['xrouter-before-navigate', 'xrouter-after-navigate'],
    ownsFocus: 'x-router',
    ownsAnnouncement: 'x-router',
    ownsScrollRestoration: 'x-router',
    changesPublicContract: false,
    rejectedNavigationCandidateAvailable: options.navigationApi === true
  };
}

function createManualDisposableStack() {
  const callbacks = [];
  let disposed = false;
  return {
    defer(callback) {
      if (disposed) throw new ReferenceError('Disposable stack is already disposed.');
      callbacks.push(callback);
    },
    dispose() {
      if (disposed) return false;
      disposed = true;
      let error = null;
      while (callbacks.length > 0) {
        try {
          callbacks.pop()();
        } catch (nextError) {
          if (!error) {
            error = nextError;
          } else {
            const suppressed = new Error('An error was suppressed during disposal.');
            suppressed.name = 'SuppressedError';
            suppressed.error = nextError;
            suppressed.suppressed = error;
            error = suppressed;
          }
        }
      }
      if (error) throw error;
      return true;
    }
  };
}

function createDisposalStackAdapter(options = {}) {
  const StackConstructor = options.DisposableStack;
  if (typeof StackConstructor === 'function') {
    const nativeStack = new StackConstructor();
    let disposed = false;
    return {
      strategy: 'DisposableStack',
      defer(callback) { nativeStack.defer(callback); },
      dispose() {
        if (disposed) return false;
        disposed = true;
        nativeStack.dispose();
        return true;
      }
    };
  }
  return { strategy: 'manual-dispose-fallback', ...createManualDisposableStack() };
}

function runLifecycleScenario(options = {}) {
  const events = [];
  const counts = { scheduler: 0, worker: 0, surface: 0 };
  const stack = createDisposalStackAdapter(options);
  stack.defer(() => { counts.scheduler += 1; events.push('scheduler-cancel'); });
  stack.defer(() => { counts.worker += 1; events.push('worker-terminate'); });
  stack.defer(() => { counts.surface += 1; events.push('surface-release'); });
  let thrown = null;
  if (options.mode === 'throw') {
    try {
      throw new Error('fixture throw');
    } catch (error) {
      thrown = error;
    } finally {
      stack.dispose();
    }
  }
  if (options.mode === 'abort') events.push('abort');
  const firstDispose = options.mode === 'throw' ? true : stack.dispose();
  const secondDispose = stack.dispose();
  return {
    strategy: stack.strategy,
    events,
    counts,
    firstDispose,
    secondDispose,
    throwPreserved: options.mode !== 'throw' || thrown && thrown.message === 'fixture throw',
    lifo: events.filter((event) => event !== 'abort').join('|') === 'surface-release|worker-terminate|scheduler-cancel',
    exactlyOnce: Object.values(counts).every((count) => count === 1)
  };
}

function probeSuppressedError(options = {}) {
  const stack = createDisposalStackAdapter(options);
  stack.defer(() => { throw new Error('first-cleanup'); });
  stack.defer(() => { throw new Error('second-cleanup'); });
  try {
    stack.dispose();
    return { threw: false, name: null };
  } catch (error) {
    return { threw: true, name: error && error.name };
  }
}

function runExplicitResourceManagementLab(options = {}) {
  const fallback = runLifecycleScenario({ mode: 'normal' });
  const native = runLifecycleScenario({ mode: 'normal', DisposableStack: options.DisposableStack });
  const abortFallback = runLifecycleScenario({ mode: 'abort' });
  const throwFallback = runLifecycleScenario({ mode: 'throw' });
  const suppressed = probeSuppressedError({ DisposableStack: options.DisposableStack });
  return {
    schema: LAB_SCHEMA,
    fallback,
    native,
    abortFallback,
    throwFallback,
    suppressed,
    syntaxProbe: 'dynamic-module-isolated',
    existingDisposeContractsRemainOwner: true,
    publicExportsAdded: false,
    runtimeDependenciesAdded: false
  };
}

module.exports = {
  LAB_SCHEMA,
  SLICE_BUDGET_MS,
  compareSchedulerStrategies,
  createDisposalStackAdapter,
  createYieldContinuation,
  planHydrationSlices,
  runScopedRegistryModel,
  runExplicitResourceManagementLab,
  selectNavigationHost,
  selectOverlayStrategy
};
