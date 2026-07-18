import { createRmtBrowserScheduler } from './xtendrmt/rmt-browser-scheduler.js';
import { createRmtDomDescriptorRenderer } from './xtendrmt/rmt-dom-descriptor-renderer.js';
import { createRmtAppRuntime } from './xtendrmt/rmt-app-runtime.js';
import { createRmtStateSelectorRuntime } from './xtendrmt/rmt-state-selector-runtime.js';
import { createRmtActionEffectRuntime } from './xtendrmt/rmt-action-effect-runtime.js';
import { createRmtEventRoutingRuntime } from './xtendrmt/rmt-event-routing-runtime.js';
import { createRmtAnimationEngineRuntime } from './xtendrmt/rmt-animation-engine-runtime.js';
import { createRmtFormValidationRuntime } from './xtendrmt/rmt-form-validation-runtime.js';
import { createRmtSurfaceTransitionRuntime } from './xtendrmt/rmt-surface-transition-runtime.js';
import { createRmtSurfaceResourceGraphRuntime } from './xtendrmt/rmt-surface-resource-graph-runtime.js';

const legacyGlobals = ['XTendRmtDomDescriptorRenderer', 'XTendRmtAppRuntime', 'XTendRmtStateSelectorRuntime', 'XTendRmtActionEffectRuntime', 'XTendRmtEventRoutingRuntime', 'XTendRmtAnimationEngineRuntime', 'XTendRmtFormValidationRuntime', 'XTendRmtSurfaceTransitionRuntime', 'XTendRmtSurfaceResourceGraphRuntime'];
legacyGlobals.forEach((name) => { try { delete globalThis[name]; } catch (_) {} });

export { createRmtBrowserScheduler, createRmtDomDescriptorRenderer, createRmtAppRuntime, createRmtStateSelectorRuntime, createRmtActionEffectRuntime, createRmtEventRoutingRuntime, createRmtAnimationEngineRuntime, createRmtFormValidationRuntime, createRmtSurfaceTransitionRuntime, createRmtSurfaceResourceGraphRuntime };

const DEFAULT_OPERATIONS = [
  ['schedule', 'xtend.registry.schedule'], ['after-paint', 'xtend.registry.after-paint'],
  ['render', 'xtend.registry.render'], ['render-keyed', 'xtend.registry.render-keyed'],
  ['patch-element', 'xtend.registry.patch-element'], ['state', 'xtend.registry.state'],
  ['command', 'xtend.registry.command'], ['component-load', 'xtend.registry.component-load'],
  ['hydrate', 'xtend.registry.hydrate'], ['dispose', 'xtend.registry.dispose']
];

export function createXTendKernelArtifact(options = {}) {
  const supplied = options.artifact && typeof options.artifact === 'object' ? options.artifact : null;
  const customSchedules = options.schedules || supplied?.scheduler?.schedules || [];
  const customFibers = options.fibers || supplied?.scheduler?.fibers || [];
  const reservedIds = new Set(['xtend.registry.dispose']);
  if (!options.replaceDefaults && [...customSchedules, ...customFibers].some((item) => reservedIds.has(item?.id))) {
    throw new Error('Reserved XTend lifecycle fibers may only be replaced with replaceDefaults: true.');
  }
  const schedules = DEFAULT_OPERATIONS.map(([id, endpointName]) => ({ id: `xtend.registry.${id}`, endpointName, scope: 'xtend.registry', lane: id === 'after-paint' ? 'after_paint' : 'visible' }));
  const fibers = DEFAULT_OPERATIONS.map(([id, endpointName]) => ({ id: `xtend.registry.${id}`, op: id, kind: id, operation: `operation:xtend.registry/${id}`, endpointName, lane: id === 'after-paint' ? 'after_paint' : 'visible' }));
  const mergeById = (defaults, additions) => {
    const map = new Map(defaults.map((item) => [item.id, item]));
    additions.forEach((item) => { if (item?.id) map.set(item.id, { ...map.get(item.id), ...item }); });
    return [...map.values()];
  };
  return {
    schema: supplied?.schema || 'xtend.registry.kernel-artifact.v1',
    version: supplied?.version || 1,
    ...supplied,
    records: Array.isArray(supplied?.records) ? supplied.records : [],
    scheduler: {
      ...(supplied?.scheduler || {}),
      schedules: options.replaceDefaults ? customSchedules : mergeById(schedules, customSchedules),
      fibers: options.replaceDefaults ? customFibers : mergeById(fibers, customFibers)
    }
  };
}

let configuration = Object.create(null);
let schedulerInstance = null;
let rendererInstance = null;
let loaderPromise = null;
let kernelHost = null;
let bootPromise = null;
let bootError = null;
let lifecycle = 'idle';
let generation = 0;
const owned = [];

const browserGlobal = () => typeof window !== 'undefined' ? window : null;
const mode = () => configuration.orchestration || 'kernel';
const schedulerHost = () => configuration.windowTarget || browserGlobal() || globalThis;
const rendererDocument = () => configuration.documentTarget || (typeof document !== 'undefined' ? document : null);
const track = (instance) => { if (instance && !owned.includes(instance)) owned.push(instance); return instance; };

function errorWithCode(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.code = code;
  return error;
}

function assertReady(operation) {
  if (mode() === 'lightweight') return;
  if (lifecycle === 'failed') throw bootError;
  if (lifecycle !== 'ready' || !kernelHost) throw errorWithCode('XTEND_NOT_READY', `${operation} requires await readyXTend() before use.`);
}

function getScheduler() {
  if (!schedulerInstance) schedulerInstance = configuration.scheduler || createRmtBrowserScheduler({ windowTarget: schedulerHost() });
  return schedulerInstance;
}

function getRenderer() {
  if (!rendererInstance) {
    if (configuration.renderer) rendererInstance = configuration.renderer;
    else {
      const documentTarget = rendererDocument();
      if (!documentTarget) throw new Error('XTend render operations require configureXTend({ documentTarget }) when used outside a browser.');
      rendererInstance = createRmtDomDescriptorRenderer({ documentTarget });
    }
  }
  return rendererInstance;
}

export function configureXTend(options = {}) {
  if (lifecycle !== 'idle' || schedulerInstance || rendererInstance) throw new Error('XTend is already initialized. Call disposeXTend() before configuring it again.');
  configuration = { ...options };
  return getXTendConfiguration();
}

export function getXTendConfiguration() {
  return Object.freeze({ ...configuration, orchestration: mode(), windowTarget: configuration.windowTarget || null, documentTarget: configuration.documentTarget || null, scheduler: configuration.scheduler || null, renderer: configuration.renderer || null, fabric: configuration.fabric ?? null });
}

async function instantiateFabric(options) {
  if (options.fabric && typeof options.fabric === 'object') return { fabric: options.fabric, owned: Boolean(options.ownsFabric) };
  if (options.fabric === false) return { fabric: null, owned: false };
  await import('./fabric/xtend-fabric.js');
  const api = globalThis.XTendFabric;
  if (!api?.createXtendFabric) throw new Error('XTend Fabric runtime could not be initialized.');
  return { fabric: api.createXtendFabric(options.fabricOptions || {}), owned: true };
}

export async function readyXTend(options = {}) {
  if (Object.keys(options).length) {
    if (lifecycle !== 'idle') throw new Error('XTend boot has already started. Dispose it before applying another configuration.');
    configuration = { ...configuration, ...options };
  }
  if (mode() === 'lightweight') {
    lifecycle = 'ready';
    kernelHost = Object.freeze({ schema: 'xtend.registry.host.v1', mode: 'lightweight', snapshot: () => getXTendSnapshot() });
    return kernelHost;
  }
  if (kernelHost) return kernelHost;
  if (bootPromise) return bootPromise;
  lifecycle = 'booting';
  const bootGeneration = generation;
  bootPromise = (async () => {
    let fabricResult = { fabric: null, owned: false };
    let controller = null;
    try {
      const [kernelApi, controllerApi] = await Promise.all([
        import('./xtendrmt/rmt-runtime.esm.js'),
        import('./xtendrmt/rmt-kernel-orchestration-controller.js')
      ]);
      fabricResult = await instantiateFabric(configuration);
      const artifact = createXTendKernelArtifact(configuration);
      const productSurface = kernelApi.createRmtProductSurface?.({});
      controller = controllerApi.createRmtKernelOrchestrationController({
        kernelApi, artifact, productSurface, fabric: fabricResult.fabric,
        scheduler: getScheduler(), strict: configuration.strict !== false,
        windowTarget: configuration.windowTarget, documentTarget: configuration.documentTarget,
        runtimeKind: typeof document === 'undefined' ? 'server' : 'browser',
        kernelBootMode: 'productSurface',
        plan: { enabled: true, strict: configuration.strict !== false, mode: 'registry', status: 'ready', bootMode: 'productSurface', summary: { source: 'xtend-registry' } }
      });
      controller.boot();
      if (controller.status !== 'booted') throw new Error(`RMT orchestration controller finished with status ${controller.status}.`);
      if (bootGeneration !== generation) {
        controller.dispose?.();
        if (fabricResult.owned) fabricResult.fabric?.dispose?.();
        throw errorWithCode('XTEND_KERNEL_BOOT_CANCELLED', 'XTend kernel boot was invalidated by disposal.');
      }
      const host = {
        schema: 'xtend.registry.kernel-host.v1', mode: 'kernel', artifact, controller,
        runtime: controller.runtime, core: controller.core, performance: controller.performanceRuntime,
        schedulerBridge: controller.schedulerBridge, fabric: fabricResult.fabric,
        snapshot: () => controller.snapshot()
      };
      Object.defineProperty(host, '_ownsFabric', { value: fabricResult.owned });
      kernelHost = Object.freeze(host);
      lifecycle = 'ready';
      return kernelHost;
    } catch (cause) {
      if (bootGeneration === generation) {
        lifecycle = 'failed';
        bootError = cause?.code === 'XTEND_KERNEL_BOOT_FAILED' ? cause : errorWithCode('XTEND_KERNEL_BOOT_FAILED', `XTend kernel boot failed: ${cause?.message || cause}`, cause);
      }
      if (controller) controller.dispose?.();
      if (fabricResult.owned) fabricResult.fabric?.dispose?.();
      throw bootError || cause;
    }
  })();
  return bootPromise;
}

export function getXTendHost() { assertReady('getXTendHost()'); return kernelHost; }
export function getXTendSnapshot() {
  if (mode() === 'lightweight') return Object.freeze({ schema: 'xtend.registry.snapshot.v1', mode: 'lightweight', status: lifecycle });
  assertReady('getXTendSnapshot()');
  return kernelHost.snapshot();
}

export function schedule(callback, options = {}) {
  if (typeof callback !== 'function') throw new TypeError('schedule(callback) requires a function.');
  if (mode() === 'lightweight') return getScheduler().scheduleEndpoint(options.endpointName || 'xtend.registry.schedule', options.scope || 'xtend.registry', callback, options);
  assertReady('schedule()');
  return kernelHost.controller.scheduleEndpoint(options.endpointName || 'xtend.registry.schedule', options.scope || 'xtend.registry', callback, options);
}

export function afterPaint(callback) {
  if (typeof callback !== 'function') throw new TypeError('afterPaint(callback) requires a function.');
  if (mode() === 'lightweight') return getScheduler().afterPaint(callback);
  assertReady('afterPaint()');
  return kernelHost.controller.scheduleEndpoint('xtend.registry.after-paint', 'xtend.registry', callback, { kind: 'after_paint' });
}

function inline(kind, callback) {
  if (mode() === 'lightweight') return callback();
  assertReady(`${kind}()`);
  return kernelHost.controller.scheduleWork(kind, callback, { inline: true, runInline: true });
}

export function render(root, descriptor, options = {}) { return inline('render', () => getRenderer().render(root, descriptor, options)); }
export function renderNode(descriptor, options = {}) { return inline('render', () => getRenderer().renderNode(descriptor, options)); }
export function renderKeyed(root, descriptors, options = {}) { return inline('render-keyed', () => getRenderer().renderKeyed(root, descriptors, options)); }
export function patchElement(element, descriptor, options = {}) { return inline('patch-element', () => getRenderer().patchElement(element, descriptor, options)); }

function createBound(factory, options, kind) {
  if (mode() !== 'lightweight') assertReady(`${kind}()`);
  const instance = factory(mode() === 'kernel' ? { ...options, fabric: options?.fabric || kernelHost.fabric, kernelController: kernelHost.controller, rmtCore: options?.rmtCore || kernelHost.core } : options);
  return track(instance);
}

export function createApp(options = {}) {
  const runtime = createBound(createRmtAppRuntime, options, 'createApp');
  if (mode() === 'lightweight') return runtime;
  const facade = { ...runtime };
  if (typeof runtime.setState === 'function') facade.setState = (...args) => kernelHost.controller.scheduleWork('state', () => runtime.setState(...args), { inline: true, runInline: true, operation: 'operation:xtend.registry/state/app' });
  if (typeof runtime.command === 'function') facade.command = (...args) => kernelHost.controller.scheduleWork('command', () => runtime.command(...args), { inline: true, runInline: true, operation: 'operation:xtend.registry/command' });
  return Object.freeze(facade);
}
export function createStore(options = {}) {
  const runtime = createBound(createRmtStateSelectorRuntime, options, 'createStore');
  if (mode() === 'lightweight') return runtime;
  const facade = { ...runtime };
  ['setState', 'patchState', 'dispatch'].forEach((method) => {
    if (typeof runtime[method] !== 'function') return;
    facade[method] = (...args) => kernelHost.controller.scheduleWork('state', () => runtime[method](...args), {
      inline: true,
      runInline: true,
      operation: `operation:xtend.registry/state/${method}`,
      correlationId: args.at(-1)?.correlationId
    });
  });
  return Object.freeze(facade);
}
export function createEffects(options = {}) { return createBound(createRmtActionEffectRuntime, options, 'createEffects'); }
export function createRouter(options = {}) { return createBound(createRmtEventRoutingRuntime, options, 'createRouter'); }
export function createAnimator(options = {}) { return createBound(createRmtAnimationEngineRuntime, options, 'createAnimator'); }
export function createValidator(options = {}) { return createBound(createRmtFormValidationRuntime, options, 'createValidator'); }
export function createTransitions(options = {}) { return createBound(createRmtSurfaceTransitionRuntime, options, 'createTransitions'); }
export function createResources(options = {}) { return createBound(createRmtSurfaceResourceGraphRuntime, options, 'createResources'); }

async function getClassicLoader() {
  const target = browserGlobal();
  if (!target || typeof document === 'undefined') throw new Error('XTend loader operations are browser-only. Use the RMT factories for SSR.');
  if (target.XTendLoader) return target.XTendLoader;
  if (!loaderPromise) {
    const hadBootState = Object.prototype.hasOwnProperty.call(target, '__XTendLoaderBootPromise');
    const previousBootState = target.__XTendLoaderBootPromise;
    const needsBootGuard = !previousBootState;
    const bootGuard = Promise.resolve(null);
    const hadAutoBootControl = Object.prototype.hasOwnProperty.call(target, '__XTendLoaderSuppressAutoBoot');
    const previousAutoBootControl = target.__XTendLoaderSuppressAutoBoot;
    target.__XTendLoaderSuppressAutoBoot = true;
    if (needsBootGuard) target.__XTendLoaderBootPromise = bootGuard;
    loaderPromise = import('./xtend-loader.js')
      .then(() => {
        if (!target.XTendLoader) throw new Error('XTend Classic loader did not expose window.XTendLoader.');
        return target.XTendLoader;
      })
      .finally(() => {
        if (needsBootGuard && target.__XTendLoaderBootPromise === bootGuard) {
          if (hadBootState) target.__XTendLoaderBootPromise = previousBootState;
          else delete target.__XTendLoaderBootPromise;
        }
        if (hadAutoBootControl) target.__XTendLoaderSuppressAutoBoot = previousAutoBootControl;
        else delete target.__XTendLoaderSuppressAutoBoot;
      });
  }
  return loaderPromise;
}

async function loaderWork(kind, callback) {
  if (mode() === 'lightweight') return callback();
  assertReady(`${kind}()`);
  return kernelHost.controller.scheduleWork(kind, callback, { inline: true, runInline: true });
}
export async function loadComponent(tag, options = {}) { return loaderWork('component-load', async () => (await getClassicLoader()).ensureComponent(tag, options)); }
export async function hydrate(root = typeof document !== 'undefined' ? document : undefined, options = {}) { return loaderWork('hydrate', async () => (await getClassicLoader()).hydrateTree(root, options)); }
export async function boot(options = {}) {
  return loaderWork('hydrate', async () => {
    const loader = await getClassicLoader();
    const bootPromise = loader.initiateXTend(options);
    const target = browserGlobal();
    if (target) target.__XTendLoaderBootPromise = bootPromise;
    return bootPromise;
  });
}

export async function createFabric(options = {}) {
  if (mode() === 'kernel') { assertReady('createFabric()'); return kernelHost.fabric; }
  return (await instantiateFabric({ ...options, fabricOptions: options })).fabric;
}
export const createXtendFabric = createFabric;

export function disposeXTend() {
  generation += 1;
  [...owned].reverse().forEach((instance) => { try { instance?.dispose?.(); } catch (_) {} });
  owned.length = 0;
  try { kernelHost?.controller?.dispose?.(); } catch (_) {}
  if (kernelHost?._ownsFabric) { try { kernelHost.fabric?.dispose?.(); } catch (_) {} }
  new Set([schedulerInstance, rendererInstance]).forEach((instance) => { try { instance?.dispose?.(); } catch (_) {} });
  schedulerInstance = null; rendererInstance = null; loaderPromise = null; kernelHost = null; bootPromise = null; bootError = null;
  configuration = Object.create(null); lifecycle = 'idle';
}
