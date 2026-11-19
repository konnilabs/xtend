import { assertSafeFastPassNavigation } from './fastpass.mjs';
import {
  COMPONENT_COMMAND_RESULT_SCHEMA,
  COMPONENT_COMMAND_SCHEMA,
  createMaracaBrowserHostAdapter
} from './browser-host-adapter.mjs';
export const MARACA_BROWSER_API_VERSION = '5.0.0';
export const MARACA_XTENSION_BROWSER_API_VERSION = '13.0.0';
export const LEGACY_BROWSER_COMPOSITION_SCHEMA = 'xtend.maraca.browser-composition-root.v1';

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value); } catch (_) {}
  }
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const RUNTIME_MODULE_API_BINDINGS = Object.freeze({
  XUtils: "components/xutils.js",
  xtendState: "components/xtend-state.js",
  XTendSurfaceController: "components/xsurfacemanager-controller.js",
  XTendRmtResumeRuntime: "xtendrmt/rmt-resume-runtime.js",
  XTendRmtStateBindingViewProjector: "xtendrmt/rmt-state-binding-view-projector.js",
  XTendRmtStateHostAdapter: "xtendrmt/rmt-state-host-adapter.js",
  XTendRmtStateSelectorRuntime: "xtendrmt/rmt-state-selector-runtime.js",
  XTendRmtActionEffectRuntime: "xtendrmt/rmt-action-effect-runtime.js",
  XTendRmtEventRoutingRuntime: "xtendrmt/rmt-event-routing-runtime.js",
  XTendRmtAppRuntime: "xtendrmt/rmt-app-runtime.js",
  XTendRmtAnimationEngineRuntime: "xtendrmt/rmt-animation-engine-runtime.js",
  XTendRmtFormValidationRuntime: "xtendrmt/rmt-form-validation-runtime.js",
  XTendRmtSurfaceTransitionRuntime: "xtendrmt/rmt-surface-transition-runtime.js",
  XTendRmtMaracaViewProjectionAdapter: "xtendrmt/rmt-maraca-view-projection-adapter.js",
  XTendRmtPresentationEffectAdapter: "xtendrmt/rmt-presentation-effect-adapter.js",
  XTendRmtSurfaceResourceGraphRuntime: "xtendrmt/rmt-surface-resource-graph-runtime.js",
  XTendRmtDomDescriptorRenderer: "xtendrmt/rmt-dom-descriptor-renderer.js"
});

function selectRuntimeModuleApi(moduleApi, exportName) {
  if (!moduleApi || (typeof moduleApi !== 'object' && typeof moduleApi !== 'function')) return null;
  if (moduleApi[exportName]) return moduleApi[exportName];
  if (moduleApi.default) return moduleApi.default;
  return Object.keys(moduleApi).length ? moduleApi : null;
}

function createInjectedRuntimeApis(dependencies) {
  const moduleApis = dependencies.runtimeModuleApis && typeof dependencies.runtimeModuleApis === 'object'
    ? dependencies.runtimeModuleApis
    : {};
  const resolved = {};
  Object.entries(RUNTIME_MODULE_API_BINDINGS).forEach(([runtimeName, moduleId]) => {
    const api = selectRuntimeModuleApi(moduleApis[moduleId], runtimeName);
    if (api) resolved[runtimeName] = api;
  });
  if (dependencies.kernelControllerModule) {
    resolved.XTendRmtKernelOrchestrationController = dependencies.kernelControllerModule;
  }
  return Object.freeze({ ...resolved, ...(dependencies.runtimeApis || {}) });
}

export function freezeMaracaConfiguration(value) {
  return deepFreeze(clone(value));
}

function disabledRuntime(plan) {
  const snapshot = () => deepFreeze({
    schema: 'xtend.maraca.plan-runtime.v3',
    phase: 'created',
    enabled: false,
    mode: plan && plan.mode || 'disabled',
    status: plan && plan.status || 'disabled',
    diagnostics: clone(plan && plan.diagnostics || [])
  });
  return deepFreeze({
    schema: 'xtend.maraca.plan-runtime.v3', model: null,
    boot: async () => snapshot(),
    dispatchCommand: async () => { throw new Error('Maraca orchestration is disabled.'); },
    dispatchStreamPatch: async () => { throw new Error('Maraca orchestration is disabled.'); },
    snapshot, subscribe() { return () => {}; }, dispose() { return false; }
  });
}

function createAppServicesPort(config, dependencies, options, publish) {
  const servicePlan = config.appServices || {};
  const definition = dependencies.appServiceDefinition;
  const createRegistry = dependencies.createAppServiceRegistry;
  if (!servicePlan.enabled || !definition || typeof createRegistry !== 'function') {
    return deepFreeze({
      enabled: false,
      status: servicePlan.status || 'disabled',
      hostServiceAdapters: options.hostServiceAdapters || options.serviceAdapters || {},
      dataSourceAdapters: options.dataSourceAdapters || {},
      snapshot() { return { schema: 'xtend.maraca.app-services-runtime.v1', enabled: false, status: servicePlan.status || 'disabled' }; },
      dispose() { return false; }
    });
  }
  const manifestServices = servicePlan.manifest && Array.isArray(servicePlan.manifest.services) ? servicePlan.manifest.services : [];
  const generatedServiceIds = new Set(manifestServices.map((entry) => entry && entry.id).filter(Boolean));
  const manualHostServiceAdapters = options.hostServiceAdapters || options.serviceAdapters || {};
  const hostServiceCollisions = Object.keys(manualHostServiceAdapters)
    .filter((id) => generatedServiceIds.has(id));
  const dataSourceCollisions = Object.keys(options.dataSourceAdapters || {})
    .filter((id) => id === 'host');
  const collisions = [...new Set([...hostServiceCollisions, ...dataSourceCollisions])];
  if (collisions.length) {
    const error = new Error(`Manual AppService adapters collide with generated services: ${collisions.join(', ')}.`);
    error.code = 'xtend.maraca.app_services.manual_adapter_collision';
    publish('xtend-maraca:diagnostic', {
      schema: 'xtend.maraca.diagnostic.v1',
      code: error.code,
      severity: servicePlan.strict ? 'error' : 'warning',
      message: error.message,
      details: {
        collisions,
        hostServiceCollisions,
        dataSourceCollisions,
        winner: servicePlan.strict ? 'none' : 'manual'
      }
    });
    if (servicePlan.strict) throw error;
  }
  const transportFactory = dependencies.createHttpAppServiceTransport;
  const httpTransport = typeof transportFactory === 'function' && manifestServices.some((entry) => entry && entry.target === 'server')
    ? transportFactory({
        baseUrl: options.appServiceBaseUrl || options.serviceBaseUrl || '',
        pathPrefix: options.appServicePath || servicePlan.transport && servicePlan.transport.basePath || '/api/xtend/services',
        credentials: options.appServiceCredentials || 'same-origin',
        fetch: options.appServiceFetch,
        headers: options.appServiceHeaders || options.serviceHeaders || {}
      })
    : null;
  const remote = options.remoteSurfaceTransport || null;
  const transport = deepFreeze({
    invoke(request) {
      const target = request && request.target === 'remote-surface' ? remote : httpTransport;
      if (!target || typeof target.invoke !== 'function') throw new Error(`AppService transport ${request && request.target || 'server'} is not configured.`);
      return target.invoke(request);
    },
    stream(request) {
      const target = request && request.target === 'remote-surface' ? remote : httpTransport;
      if (!target || typeof target.stream !== 'function') throw new Error(`AppService stream transport ${request && request.target || 'server'} is not configured.`);
      return target.stream(request);
    },
    dispose(reason) {
      [httpTransport, remote].forEach((entry) => { if (entry && typeof entry.dispose === 'function') entry.dispose(reason); });
    }
  });
  const registry = createRegistry(definition, { transport, disposeTransport: true, manifest: servicePlan.manifest, inputPolicyPhase: 'browser' });
  const adapters = {};
  manifestServices.forEach((entry) => {
    if (!entry || !entry.id) return;
    adapters[entry.id] = deepFreeze({
      invoke(request = {}) { return registry.invoke(entry.id, request.payload, request.context || {}); },
      stream(request = {}, handlers = {}) { return registry.stream(entry.id, request.payload, handlers, request.context || {}); },
      subscribe(request = {}, handlers = {}) { return registry.stream(entry.id, request.payload, handlers, request.context || {}); }
    });
  });
  const hostServiceAdapters = deepFreeze({ ...adapters, ...manualHostServiceAdapters });
  const dataSourceAdapters = deepFreeze({
    host: { invoke(request = {}) { const source = request.source || {}; return registry.invoke(source.endpoint || source.service || source.id, request.payload, request.context || {}); } },
    ...(options.dataSourceAdapters || {})
  });
  return deepFreeze({
    enabled: true, status: 'booted', hostServiceAdapters, dataSourceAdapters,
    snapshot() {
      const serviceIds = manifestServices.map((entry) => entry.id);
      return {
        schema: 'xtend.maraca.app-services-runtime.v1',
        enabled: true,
        status: 'ready',
        runtimeStatus: 'booted',
        serviceCount: serviceIds.length,
        serviceIds,
        activeCount: registry.listActive().length,
        listenerErrorCount: registry.listListenerErrors().length,
        history: registry.listHistory().map(entry => ({
          serviceId: entry.serviceId, kind: entry.kind, target: entry.target,
          concurrency: entry.concurrency, invocationId: entry.invocationId,
          correlationId: entry.correlationId, sequence: entry.sequence, status: entry.status
        })),
        inputPolicyVerdicts: typeof registry.listInputPolicyVerdicts === 'function'
          ? clone(registry.listInputPolicyVerdicts())
          : []
      };
    },
    dispose(reason) { registry.dispose(reason); return true; }
  });
}

function createRuntimePlan(config, options) {
  return {
    ...(['xtend.maraca.browser-composition-root.v11', 'xtend.maraca.browser-composition-root.v12', 'xtend.maraca.browser-composition-root.v13'].includes(config.schema) ? { schema: config.buildPlanSchema, ok: true, sourceHash: config.sourceHash } : {}),
    ...(Object.hasOwn(config, 'xtensionComposition') ? { schema: config.buildPlanSchema, ok: true, sourceHash: config.sourceHash, xtensionComposition: config.xtensionComposition } : {}),
    orchestration: config.orchestration,
    ...(Object.hasOwn(config, 'xtensionBindings') ? { xtensionBindings: config.xtensionBindings } : {}),
    kernel: config.kernel, hydration: config.hydration, validation: config.validation, transitions: config.transitions,
    components: { selected: config.components || [] }, surfaces: config.surfaces || [], state: options.initialState || config.state || {}
  };
}

function createRuntimeConfiguration(config, options, host, handles) {
  const root = handles.root;
  const viewApi = host.runtimeApi('XTendRmtMaracaViewProjectionAdapter');
  const suppliedView = options.viewProjectionPort || options.viewAdapter || null;
  const viewProjectionPort = suppliedView || (viewApi && typeof viewApi.createRmtMaracaViewProjectionAdapter === 'function'
    ? viewApi.createRmtMaracaViewProjectionAdapter({ root, documentTarget: handles.documentTarget, windowTarget: handles.windowTarget }) : null);
  // Ports and DOM roots are live host handles. Freeze only the composition
  // envelope; immutable Plan data was cloned/frozen when the root was built.
  return Object.freeze({
    plan: createRuntimePlan(config, options),
    ...(handles.compositionPort ? { xtensionCompositionPort: handles.compositionPort } : {}),
    root,
    initialState: options.initialState || config.state || {},
    xtensionBindingsRuntime: options.xtensionBindingsRuntime,
    urlStatePolicy: options.urlStatePolicy,
    urlStateRuntime: options.urlStateRuntime,
    ...(['xtend.maraca.browser-composition-root.v11', 'xtend.maraca.browser-composition-root.v12', 'xtend.maraca.browser-composition-root.v13'].includes(config.schema) ? { nativeViewRuntimePort: options.nativeViewRuntimePort || handles.dependencies.nativeViewRuntimePort } : {}),
    createXTensionHost: options.createXTensionHost,
    fastPassActions: options.fastPassActions || [],
    actionHistoryLimit: options.actionHistoryLimit,
    commandHistoryLimit: options.commandHistoryLimit,
    stateProjectionWriteHistoryLimit: options.stateProjectionWriteHistoryLimit,
    stateProjectionReadHistoryLimit: options.stateProjectionReadHistoryLimit,
    diagnosticLimit: options.diagnosticLimit,
    actionResultDiagnostics: options.actionResultDiagnostics,
    domRenderer: handles.renderer,
    kernelController: handles.kernel,
    kernelRuntime: options.kernelRuntime || null,
    componentRegistry: handles.hydration,
    ensureComponentsOnBoot: false,
    hydrateOnBoot: true,
    adoptExisting: options.adoptExisting === true,
    clearOwnedDom: false,
    documentTarget: handles.documentTarget,
    windowTarget: handles.windowTarget,
    xUtils: options.xUtils || host.runtimeApi('XUtils'),
    stateProjectionTarget: options.stateProjectionTarget || host.runtimeApi('xtendState'),
    fabric: options.fabric || null,
    hostServices: options.hostServices || {},
    hostServiceRegistry: options.hostServiceRegistry || null,
    hostServiceAdapters: handles.appServices.hostServiceAdapters,
    serviceAdapters: handles.appServices.hostServiceAdapters,
    dataSourceAdapters: handles.appServices.dataSourceAdapters,
    resourceManager: options.resourceManager || null,
    resourceAdapters: options.resourceAdapters || {},
    surfaceController: options.surfaceController || null,
    surfaceControllerId: options.surfaceControllerId,
    surfaceStateProjection: options.surfaceStateProjection || null,
    feedbackAdapter: options.feedbackAdapter || null,
    navigationAdapter: options.navigationAdapter || { navigate(path) {
      assertSafeFastPassNavigation(path);
      // Resolve against Location, not a potentially cross-origin document <base>.
      const location = handles.windowTarget.location;
      const destination = new URL(path, location.href);
      if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== location.origin) {
        throw Object.assign(new TypeError('FastPass navigation requires the current HTTP(S) origin.'), { code: 'xtend.maraca.fastpass.unsafe-navigation' });
      }
      location.assign(destination.href);
    } },
    focusAdapter: options.focusAdapter || { focus(id) { return host.focusSurface(root, id, handles.renderer); } },
    effectAdapter: options.effectAdapter || null,
    presentationEffectPort: options.presentationEffectPort || null,
    viewProjectionPort,
    ownsViewProjectionPort: Boolean(viewProjectionPort && !suppliedView),
    invokeComponentCommand: (record) => host.invokeComponentCommand(root, record),
    streamLifecycleActions: options.streamLifecycleActions || {},
    trustedDomRenderer: options.trustedDomRenderer,
    trustedDom: options.trustedDom,
    diagnosticsHub: options.diagnosticsHub,
    diagnosticChannel: options.diagnosticChannel,
    targetResolver: options.targetResolver || (viewProjectionPort ? (binding, target) => viewProjectionPort.resolveBindingTarget(binding, target) : null),
    postCommitEffects: options.postCommitEffects || null,
    moduleLoaderPort: Object.freeze({
      schema: 'xtend.maraca.runtime-module-loader-port.v1',
      async load() {
        return {
          state: host.runtimeApi('XTendRmtStateSelectorRuntime'),
          stateProjection: host.runtimeApi('XTendRmtStateHostAdapter'),
          stateBindings: host.runtimeApi('XTendRmtStateBindingViewProjector'),
          action: host.runtimeApi('XTendRmtActionEffectRuntime'),
          app: host.runtimeApi('XTendRmtAppRuntime'),
          events: host.runtimeApi('XTendRmtEventRoutingRuntime'),
          animation: host.runtimeApi('XTendRmtAnimationEngineRuntime'),
          validation: host.runtimeApi('XTendRmtFormValidationRuntime'),
          transitions: host.runtimeApi('XTendRmtSurfaceTransitionRuntime'),
          viewProjection: host.runtimeApi('XTendRmtMaracaViewProjectionAdapter'),
          presentation: host.runtimeApi('XTendRmtPresentationEffectAdapter'),
          surfaceController: host.runtimeApi('XTendSurfaceController'),
          surfaces: host.runtimeApi('XTendRmtSurfaceResourceGraphRuntime'),
          renderer: host.runtimeApi('XTendRmtDomDescriptorRenderer'),
          kernel: host.runtimeApi('XTendRmtKernelOrchestrationController'),
          kernelRuntime: handles.dependencies.kernelRuntimeModule || null
        };
      }
    })
  });
}

export function createMaracaBrowserCompositionRoot(configuration = {}, dependencies = {}) {
  const schema = Object.getOwnPropertyDescriptor(configuration, 'schema');
  if (schema && !Object.hasOwn(schema, 'value')) throw new TypeError('Browser configuration schema must be an own data field.');
  const orchestratedInput = schema?.value === 'xtend.maraca.browser-composition-root.v13';
  const lifecycleInput = orchestratedInput || schema?.value === 'xtend.maraca.browser-composition-root.v12';
  if (lifecycleInput) {
    const port = dependencies.nativeViewRuntimePort;
    if (port?.NATIVE_VIEW_PROJECTION_API_VERSION !== (orchestratedInput ? '3.0.0' : '2.0.0') || typeof port.assertNativeCanonicalData !== 'function')
      throw new TypeError('Lifecycle browser12 requires its explicit Native View projection API2 port.');
    port.assertNativeCanonicalData(configuration, true);
    if (typeof dependencies[orchestratedInput ? 'createOrchestratedPlanRuntime' : 'createLifecyclePlanRuntime'] !== 'function') throw new TypeError('Lifecycle browser12 requires its explicit createLifecyclePlanRuntime factory.');
  }
  const config = freezeMaracaConfiguration(configuration || {});
  const composed = Object.hasOwn(config, 'xtensionComposition');
  const orchestrated = config.schema === 'xtend.maraca.browser-composition-root.v13';
  const lifecycle = orchestrated || config.schema === 'xtend.maraca.browser-composition-root.v12';
  if (lifecycle && !lifecycleInput) throw new TypeError('Lifecycle browser12 requires an explicit own schema field.');
  const native = lifecycle || config.schema === 'xtend.maraca.browser-composition-root.v11';
  const projected = config.schema === 'xtend.maraca.browser-composition-root.v10', scoped = projected || config.schema === 'xtend.maraca.browser-composition-root.v9', componentProfile = scoped || config.schema === 'xtend.maraca.browser-composition-root.v8';
  if (native ? config.buildPlanSchema !== (orchestrated ? 'xtend.maraca.build-plan.v11' : lifecycle ? 'xtend.maraca.build-plan.v10' : 'xtend.maraca.build-plan.v9') || config.orchestration?.artifact?.schema !== (orchestrated ? 'xtend.rmt.app-orchestration.v5' : lifecycle ? 'xtend.rmt.app-orchestration.v4' : 'xtend.rmt.app-orchestration.v3') || composed && config.xtensionComposition?.schema !== (orchestrated ? 'xtend.maraca.xtension-composition-artifact.v12' : lifecycle ? 'xtend.maraca.xtension-composition-artifact.v11' : 'xtend.maraca.xtension-composition-artifact.v10')
    : ['xtend.maraca.build-plan.v9', 'xtend.maraca.build-plan.v10', 'xtend.maraca.build-plan.v11'].includes(config.buildPlanSchema) || ['xtend.maraca.xtension-composition-artifact.v10', 'xtend.maraca.xtension-composition-artifact.v11', 'xtend.maraca.xtension-composition-artifact.v12'].includes(config.xtensionComposition?.schema) || ['xtend.rmt.app-orchestration.v4','xtend.rmt.app-orchestration.v5'].includes(config.orchestration?.artifact?.schema)) throw new TypeError('Native browser11/12 requires its exact plan9/10, program3/4 and optional composition artifact10/11.');
  if (native && !composed && config.xtensionBindings?.bindings?.length) throw new TypeError('Native provider bindings require the automatic composition artifact10.');
  if (!native && (projected !== (config.xtensionComposition?.schema === 'xtend.maraca.xtension-composition-artifact.v9') || scoped !== ['xtend.maraca.xtension-composition-artifact.v8','xtend.maraca.xtension-composition-artifact.v9'].includes(config.xtensionComposition?.schema) || componentProfile !== ['xtend.maraca.xtension-composition-artifact.v7','xtend.maraca.xtension-composition-artifact.v8','xtend.maraca.xtension-composition-artifact.v9'].includes(config.xtensionComposition?.schema))) throw new TypeError('Component ownership requires the explicit v8 browser contract.');
  const ssrCapable = !projected && (scoped || config.schema === 'xtend.maraca.browser-composition-root.v7');
  if (!native && composed !== (componentProfile || ssrCapable || config.schema === 'xtend.maraca.browser-composition-root.v6') || composed && config.buildPlanSchema !== (orchestrated ? 'xtend.maraca.build-plan.v11' : lifecycle ? 'xtend.maraca.build-plan.v10' : native ? 'xtend.maraca.build-plan.v9' : projected ? 'xtend.maraca.build-plan.v8' : scoped ? 'xtend.maraca.build-plan.v7' : componentProfile ? 'xtend.maraca.build-plan.v6' : 'xtend.maraca.build-plan.v5')) throw new TypeError('Automatic XTension boot requires its version-matched browser configuration and build plan.');
  const apiVersion = orchestrated ? MARACA_XTENSION_BROWSER_API_VERSION : lifecycle ? '12.0.0' : native ? '11.0.0' : composed ? projected ? '10.0.0' : scoped ? '9.0.0' : componentProfile ? '8.0.0' : ssrCapable ? '7.0.0' : '6.0.0' : MARACA_BROWSER_API_VERSION;
  const platformTarget = dependencies.platformTarget || dependencies['global' + 'Target'] || dependencies.windowTarget || {};
  const windowTarget = dependencies.windowTarget || platformTarget['window'] || platformTarget;
  const documentTarget = dependencies.documentTarget || platformTarget['document'] || null;
  const runtimeApis = createInjectedRuntimeApis(dependencies);
  const host = createMaracaBrowserHostAdapter(config, { ...dependencies, runtimeApis, platformTarget, windowTarget, documentTarget });
  let generation = 0;
  let runtime = null;
  let xtensionDrain = Promise.resolve();
  let runtimeUnsubscribe = null;
  const facadeSubscriptions = new Set();
  function attachSubscription(entry, target) {
    entry.unsubscribe?.();
    entry.unsubscribe = target && typeof target[entry.method] === 'function' ? target[entry.method](entry.listener) : null;
  }
  function observe(method, listener) {
    if (typeof listener !== 'function') return () => {};
    const entry = { method, listener, unsubscribe: null };
    facadeSubscriptions.add(entry);
    attachSubscription(entry, runtime || bootAttempt && bootAttempt.runtime);
    return () => { entry.unsubscribe?.(); facadeSubscriptions.delete(entry); };
  }
  let root = null;
  let renderer = null;
  let kernel = null;
  let ownsKernel = true;
  let hydration = null;
  let appServices = null;
  let resume = null;
  let templateArtifactsRegistration = null;
  let pwaRegistration = null;
  let telemetry = null;
  let bootResult = null;
  let bootAttempt = null;

  function bootCancelledError(reason = 'XTend Maraca boot was superseded or disposed.') {
    const error = new Error(reason);
    error.code = 'xtend.maraca.boot_cancelled';
    return error;
  }

  function assertActiveBoot(attempt) {
    if (!attempt || attempt.cancelled || generation !== attempt.generation || bootAttempt !== attempt) {
      throw attempt && attempt.cancelError || bootCancelledError();
    }
  }

  function closeHandle(disposed, key, handle, ...args) {
    if (!handle || typeof handle.dispose !== 'function') return;
    try { disposed[key] = handle.dispose(...args) !== false; }
    catch (error) { host.publish('xtend-maraca:dispose-error', { schema: 'xtend.maraca.diagnostic.v1', code: 'xtend.maraca.dispose_error', severity: 'error', message: error.message }); }
  }

  function closeKernelAndRenderer(disposed, closingRuntime, handles) {
    const { kernel, renderer, root, ownsKernel: owned } = handles;
    const finish = () => {
      if (owned !== false) closeHandle(disposed, 'kernel', kernel);
      closeHandle(disposed, 'renderer', renderer, root || undefined, { clearOwnedDom: false });
    };
    if (composed && closingRuntime && typeof closingRuntime.whenXTensionsIdle === 'function') {
      const retiring = Promise.resolve().then(() => closingRuntime.whenXTensionsIdle()).then(finish, error => { finish(); throw error; });
      xtensionDrain = Promise.all([xtensionDrain, retiring]).then(() => undefined);
      xtensionDrain.catch(() => {});
    } else finish();
  }

  function cleanupBootAttempt(attempt, disposed, reason) {
    if (!attempt || attempt.promoted || attempt.cleaned) return;
    attempt.cleaned = true;
    if (typeof attempt.runtimeUnsubscribe === 'function') attempt.runtimeUnsubscribe();
    attempt.runtimeUnsubscribe = null;
    closeHandle(disposed, 'xtensionSSR', attempt.compositionPort?.ssrSession);
    closeHandle(disposed, 'resume', attempt.resume);
    closeHandle(disposed, 'hydration', attempt.hydration);
    closeHandle(disposed, 'orchestration', attempt.runtime);
    closeHandle(disposed, 'appServices', attempt.appServices, reason);
    closeKernelAndRenderer(disposed, attempt.runtime, attempt);
    closeHandle(disposed, 'telemetry', attempt.telemetry);

    attempt.runtime = null;
    attempt.resume = null;
    attempt.hydration = null;
    attempt.kernel = null;
    attempt.appServices = null;
    attempt.telemetry = null;
    attempt.renderer = null;
    attempt.root = null;
  }

  function snapshot() {
    if (runtime && typeof runtime.snapshot === 'function') return deepFreeze(clone(runtime.snapshot()));
    return deepFreeze({ schema: orchestrated ? 'xtend.maraca.plan-runtime.v16' : lifecycle ? 'xtend.maraca.plan-runtime.v15' : native ? 'xtend.maraca.plan-runtime.v14' : projected ? 'xtend.maraca.plan-runtime.v13' : scoped ? 'xtend.maraca.plan-runtime.v11' : componentProfile ? 'xtend.maraca.plan-runtime.v10' : composed ? 'xtend.maraca.plan-runtime.v8' : 'xtend.maraca.plan-runtime.v3', phase: 'created', enabled: false, status: 'not_booted', diagnostics: [] });
  }

  function subscribe(listener) {
    return observe('subscribe', listener);
  }

  function publishRuntimeEvent(value) {
    const event = value && (value.lastEvent || value);
    if (!event || !event.type) return;
    if (event.type === 'state') host.publish('xtend-maraca:state-change', { schema: 'xtend.maraca.state-change.v1', event: event.event || null, action: event.action || '' });
    else if (event.type === 'surface') host.publish('xtend-maraca:surface-change', { schema: 'xtend.maraca.surface-change.v1', report: event.report || null, metadata: event.metadata || {} });
    else if (event.type === 'diagnostic') host.publish('xtend-maraca:orchestration-diagnostic', event.diagnostic || null);
  }

  async function bootOnce(options, attempt) {
    if (!documentTarget) return deepFreeze({ ok: false, status: 'no_document', schema: config.schema });
    const disposed = {};
    try {
      assertActiveBoot(attempt);
      await xtensionDrain;
      assertActiveBoot(attempt);
      attempt.root = host.resolveRoot(options.root || null);
      if (native) {
        const shell = host.inspectServerShell(attempt.root);
        if (shell.active || shell.hasPayload) throw new TypeError('Source5 native views have no SSR/adoption acceptance contract.');
      }
      if (attempt.compositionPort?.ssrSession) {
        const restored = await attempt.compositionPort.ssrSession.prepare(attempt.root);
        assertActiveBoot(attempt);
        options = { ...options, ...restored };
      }
      attempt.appServices = createAppServicesPort(config, dependencies, options, host.publish);
      attempt.renderer = host.createRenderer(options);
      host.attachCss(attempt.root);
      const serverPrerenderShell = host.adoptServerShell(attempt.root, attempt.renderer, options.ssrResponse);
      const payload = serverPrerenderShell.payload;
      const envelope = payload && (payload.resume || payload.response && payload.response.resume || payload) || null;
      const resumeRequested = serverPrerenderShell.active && serverPrerenderShell.executionMode === 'server_prerender_resume';
      let resumePreflight = null;
      const resumeApi = resumeRequested ? host.runtimeApi('XTendRmtResumeRuntime') : null;
      if (resumeRequested && resumeApi && typeof resumeApi.createRmtResumeRuntime === 'function') {
        attempt.resume = resumeApi.createRmtResumeRuntime({
          root: envelope && envelope.rootId && host.elementById(envelope.rootId) || attempt.root,
          verifyResumeEnvelope: options.verifyResumeEnvelope || options.verify,
          adopters: options.resumeAdopters || options.adopters || {},
          restoreState() { assertActiveBoot(attempt); return host.readModelSnapshot(attempt.runtime); },
          adoptRoot() { assertActiveBoot(attempt); return attempt.runtime ? attempt.runtime.snapshot() : null; },
          replayIntent(intent) {
            assertActiveBoot(attempt);
            return attempt.runtime.dispatchCommand(intent.action, intent.payload || {}, { operation: 'resume-replay', eventId: intent.eventId });
          },
          hydrateResponse() {
            assertActiveBoot(attempt);
            return attempt.runtime && attempt.runtime.refresh
              ? attempt.runtime.refresh({ operation: 'maraca.resume-fallback' })
              : attempt.hydration.hydrate(attempt.root, (config.components || []).map((entry) => entry.tag), { operation: 'maraca.resume-fallback' });
          },
          publishDiagnostic(value) { host.publish('xtend-maraca:resume-diagnostic', value); }
        });
        if (typeof attempt.resume.verifyResponse === 'function') {
          resumePreflight = await attempt.resume.verifyResponse(payload.response || payload, {}, { root: attempt.root });
          assertActiveBoot(attempt);
        }
        if (resumePreflight && resumePreflight.ok) options = { ...options, initialState: resumePreflight.state, adoptExisting: true };
      }
      if (!serverPrerenderShell.active && !(config.orchestration && config.orchestration.enabled)) {
        host.renderCompatibility(attempt.root, attempt.renderer);
      }
      if (composed && serverPrerenderShell.active && !attempt.compositionPort?.ssrSession) throw new TypeError('Automatic XTensions require client rendering; SSR/adoption belongs to the separate restore contract.');
      attempt.ownsKernel = !(composed || native) || !options.kernelController;
      attempt.kernel = (composed || native) && options.kernelController || host.createKernelController(options);
      attempt.hydration = host.createHydrationPort(attempt.root, options);
      const enabled = config.orchestration && config.orchestration.enabled && config.orchestration.artifact;
      if (enabled) {
        const createRuntime = orchestrated ? dependencies.createOrchestratedPlanRuntime : lifecycle ? dependencies.createLifecyclePlanRuntime : dependencies.createPlanRuntime;
        if (typeof createRuntime !== 'function') throw new Error('XTend Maraca composition requires its explicit Plan runtime factory.');
        attempt.runtime = createRuntime(createRuntimeConfiguration(config, options, host, {
          root: attempt.root,
          compositionPort: attempt.compositionPort,
          renderer: attempt.renderer,
          kernel: attempt.kernel,
          hydration: attempt.hydration,
          appServices: attempt.appServices,
          documentTarget,
          windowTarget,
          platformTarget,
          dependencies
        }));
        facadeSubscriptions.forEach(entry => attachSubscription(entry, attempt.runtime));
        attempt.runtimeUnsubscribe = (attempt.runtime.subscribeEvents || attempt.runtime.subscribe).call(attempt.runtime, publishRuntimeEvent);
        await attempt.runtime.boot();
        assertActiveBoot(attempt);
        host.publish('xtend-maraca:orchestration-boot', { schema: 'xtend.maraca.orchestration-boot.v1', mode: config.orchestration.mode, summary: config.orchestration.summary || {} });
      } else {
        attempt.runtime = disabledRuntime(config.orchestration);
        await attempt.hydration.hydrate(attempt.root, (config.components || []).map((entry) => entry.tag), { operation: 'maraca.boot.compatibility' });
        assertActiveBoot(attempt);
      }
      let resumeResult = null;
      if (resumeRequested && attempt.resume && typeof attempt.resume.resumeResponse === 'function') {
        resumeResult = await attempt.resume.resumeResponse(payload.response || payload, {}, { root: attempt.root, preflight: resumePreflight, intentQueue: typeof options.intentQueue === 'function' ? options.intentQueue() : options.intentQueue || [] });
        assertActiveBoot(attempt);
        host.commitRootMetadata(attempt.root, attempt.renderer, { 'data-rmt-resume-status': resumeResult.status }, 'maraca.boot.resume-status');
        host.publish('xtend-maraca:resume', resumeResult);
      }
      attempt.templateArtifactsRegistration = host.registerTemplateArtifacts(options);
      attempt.pwaRegistration = await host.registerPwa(options);
      assertActiveBoot(attempt);
      attempt.telemetry = host.createTelemetryPort({ kernel: attempt.kernel, runtime: attempt.runtime, hydration: attempt.hydration });
      const runtimeSnapshot = attempt.runtime && typeof attempt.runtime.snapshot === 'function'
        ? deepFreeze(clone(attempt.runtime.snapshot()))
        : deepFreeze({ schema: 'xtend.maraca.plan-runtime.v3', phase: 'created', enabled: false, status: 'not_booted', diagnostics: [] });
      const result = deepFreeze({
        ...runtimeSnapshot,
        ok: true,
        status: (options.lazyStrategy || config.lazyMode) === 'viewport' ? 'booted_lazy' : 'booted',
        schema: config.schema,
        componentTags: (config.components || []).map((entry) => entry.tag),
        surfaceCount: (config.surfaces || []).length,
        eventCount: (config.events || []).length,
        appServices: attempt.appServices.snapshot(),
        orchestration: { enabled: Boolean(attempt.runtime.model), mode: config.orchestration && config.orchestration.mode, status: config.orchestration && config.orchestration.status },
        kernel: attempt.kernel && typeof attempt.kernel.snapshot === 'function' ? deepFreeze(clone(attempt.kernel.snapshot())) : null,
        serverPrerenderShell,
        resume: resumeResult,
        templateArtifacts: { plan: config.templateArtifacts || null, registration: attempt.templateArtifactsRegistration },
        pwa: { plan: config.pwa || null, registration: attempt.pwaRegistration },
        productionClosure: config.productionClosure || null,
        publicNameReservations: config.publicNames || []
      });
      assertActiveBoot(attempt);
      host.installPublicFacades({
        result,
        orchestrationFacade: facade,
        kernel: attempt.kernel,
        hydration: attempt.hydration,
        resume: attempt.resume,
        validation: runtimeSnapshot.validationSnapshot || null,
        animationEngine: runtimeSnapshot.animationEngine || null,
        transitions: runtimeSnapshot.transitionSnapshot || null,
        telemetry: attempt.telemetry,
        templateArtifactsRegistration: attempt.templateArtifactsRegistration,
        pwaRegistration: attempt.pwaRegistration
      });
      assertActiveBoot(attempt);
      runtime = attempt.runtime;
      runtimeUnsubscribe = attempt.runtimeUnsubscribe;
      root = attempt.root;
      renderer = attempt.renderer;
      kernel = attempt.kernel;
      ownsKernel = attempt.ownsKernel;
      hydration = attempt.hydration;
      appServices = attempt.appServices;
      resume = attempt.resume;
      templateArtifactsRegistration = attempt.templateArtifactsRegistration;
      pwaRegistration = attempt.pwaRegistration;
      telemetry = attempt.telemetry;
      bootResult = result;
      attempt.promoted = true;
      host.publish('xtend-maraca:boot', result);
      return result;
    } catch (error) {
      cleanupBootAttempt(attempt, disposed, error && error.message || 'XTend Maraca boot failed.');
      throw error;
    }
  }

  function duplicateBootResult(result) {
    return deepFreeze({
      ...clone(result),
      duplicateBootIgnored: true
    });
  }

  async function boot(options = {}) {
    if (native && (options.adoptExisting === true || options.ssrResponse !== undefined || options.ssr !== undefined || options.xtensions?.ssr !== undefined)) throw new TypeError('Source5 native views have no SSR/adoption acceptance contract.');
    if (native && typeof options.fabric?.runFiber !== 'function') throw new TypeError('Native views require the explicit Fabric work port.');
    if (native) {
      const port = options.nativeViewRuntimePort || dependencies.nativeViewRuntimePort;
      if (port?.NATIVE_VIEW_PROJECTION_API_VERSION !== (orchestrated ? '3.0.0' : lifecycle ? '2.0.0' : '1.0.0') || typeof port.validateNativeViewProgram !== 'function' || typeof port.materializeNativeView !== 'function') throw new TypeError('Native views require their explicit profile-matched projection port.');
      if (lifecycle) {
        if (typeof port.assertNativeCanonicalData !== 'function') throw new TypeError('Lifecycle native views require their canonical data boundary.');
        if (options.initialState !== undefined) port.assertNativeCanonicalData(options.initialState);
      }
    }
    if (bootResult && runtime) return duplicateBootResult(bootResult);
    if (bootAttempt) return duplicateBootResult(await bootAttempt.promise);
    let compositionPort = null;
    if (composed) {
      if (options.createXTensionHost !== undefined || options.xtensionBindingsRuntime !== undefined || options.xtensionCompositionPort !== undefined || options.adoptExisting === true) throw new TypeError('Automatic XTensions cannot use manual factories, binding runtimes or adoption.');
      if (!options.fabric || typeof options.fabric.createBoundary !== 'function' || !options.xtensions || Object.keys(options.xtensions).some(key => !['loadPeers', 'loadPeerGroup', 'grants', 'ssr'].includes(key))) throw new TypeError('Automatic XTensions require Fabric and explicit peer-loader/grant options.');
      if (options.xtensions.ssr !== undefined && !ssrCapable) throw new TypeError('SSR requires the v7 browser composition contract.');
      const platform = dependencies.xtensionPlatform;
      if (!(orchestrated ? ['13.0.0'] : lifecycle ? ['12.0.0','13.0.0'] : native ? ['11.0.0','12.0.0','13.0.0'] : projected ? ['10.0.0','11.0.0','12.0.0','13.0.0'] : scoped ? ['9.0.0','10.0.0','11.0.0','12.0.0','13.0.0'] : componentProfile ? ['8.0.0','9.0.0','10.0.0','11.0.0','12.0.0','13.0.0'] : ssrCapable ? ['7.0.0','8.0.0','9.0.0','10.0.0','11.0.0','12.0.0','13.0.0'] : ['6.0.0','7.0.0','8.0.0','9.0.0','10.0.0','11.0.0','12.0.0','13.0.0']).includes(platform?.compositionRuntime?.XTENSION_COMPOSITION_API_VERSION)) throw new TypeError('Automatic XTensions require the version-matched built platform API.');
      compositionPort = platform.compositionRuntime.createMaracaXTensionCompositionPort({ plan: createRuntimePlan(config, {}), companion: dependencies.xtensionCompanion,
        bindingsRuntime: platform.bindingsRuntime, ...(componentProfile || native ? { componentInterfaceRuntime: platform.componentInterfaceRuntime } : {}), resumeBindingsRuntime: platform.resumeBindingsRuntime, ssrRuntime: platform.ssrRuntime, ssr: options.xtensions.ssr, adapters: platform.adapters, loadPeers: options.xtensions.loadPeers, loadPeerGroup: options.xtensions.loadPeerGroup, grants: options.xtensions.grants });
    }
    generation += 1;
    let rejectCancellation;
    const cancellation = new Promise((_, reject) => { rejectCancellation = reject; });
    const attempt = {
      generation, compositionPort,
      cancelled: false,
      cancelError: null,
      cleaned: false,
      promoted: false,
      promise: null,
      cancel(reason) {
        if (attempt.cancelled) return false;
        attempt.cancelled = true;
        attempt.cancelError = bootCancelledError(reason);
        rejectCancellation(attempt.cancelError);
        return true;
      }
    };
    bootAttempt = attempt;
    const pending = Promise.race([bootOnce(options, attempt), cancellation]);
    attempt.promise = pending;
    try {
      return await pending;
    } finally {
      if (bootAttempt === attempt) bootAttempt = null;
    }
  }

  async function dispatchCommand(command, payload = {}, metadata = {}) {
    if (!runtime) throw new Error('XTend Maraca is not booted.');
    return runtime.dispatchCommand(command, payload, metadata);
  }

  async function dispatchStreamPatch(patch, metadata = {}) {
    if (!runtime) throw new Error('XTend Maraca is not booted.');
    return runtime.dispatchStreamPatch(patch, metadata);
  }

  async function invokeComponentCommand(rootTarget, commandRecord) {
    if (!runtime || !root) throw new Error('XTend Maraca is not booted.');
    if (rootTarget && rootTarget !== root) {
      const error = new Error('XTend Maraca component commands are scoped to the registered application root.');
      error.code = 'xtend.maraca.component-command.root-outside-application';
      throw error;
    }
    return host.invokeComponentCommand(root, commandRecord);
  }

  function dispose(reason = 'XTend Maraca app disposed.') {
    generation += 1;
    const pendingAttempt = bootAttempt;
    const closingRuntimes = [...new Set([runtime, pendingAttempt?.runtime].filter(Boolean))];
    if (pendingAttempt) pendingAttempt.cancel(reason);
    if (bootAttempt === pendingAttempt) bootAttempt = null;
    if (typeof runtimeUnsubscribe === 'function') runtimeUnsubscribe();
    runtimeUnsubscribe = null;
    const disposed = { orchestration: false, resume: false, hydration: false, kernel: false, appServices: false, renderer: false, host: false };
    cleanupBootAttempt(pendingAttempt, disposed, reason);
    closeHandle(disposed, 'resume', resume);
    closeHandle(disposed, 'hydration', hydration);
    closeHandle(disposed, 'orchestration', runtime);
    closeHandle(disposed, 'appServices', appServices, reason);
    closeKernelAndRenderer(disposed, runtime, { kernel, ownsKernel, renderer, root });
    closeHandle(disposed, 'telemetry', telemetry);

    disposed.host = host.dispose() > 0;
    xtensionDrain = Promise.all([xtensionDrain, ...closingRuntimes.map((closing) => closing.whenXTensionsIdle?.())]).then(() => undefined);
    xtensionDrain.catch(() => {});
    runtime = null; resume = null; hydration = null; kernel = null; appServices = null; renderer = null; root = null; bootResult = null;
    templateArtifactsRegistration = null; pwaRegistration = null; telemetry = null;
    host.clearPublicFacades();
    const report = deepFreeze({ schema: 'xtend.maraca.dispose.v1', reason, ...disposed });
    host.publish('xtend-maraca:dispose', report);
    return report;
  }

  const facadeMembers = {
    apiVersion,
    schema: config.schema,
    components: config.components || [],
    surfaces: config.surfaces || [],
    events: config.events || [],
    orchestrationPlan: config.orchestration || null,
    kernelPlan: config.kernel || null,
    hydrationPlan: config.hydration || null,
    validationPlan: config.validation || null,
    transitionPlan: config.transitions || null,
    productionClosure: config.productionClosure || null,
    stackModules: config.stackModules || [],
    get kernel() { return host.snapshotHandle(kernel, 'xtend.maraca.kernel-snapshot-facade.v1'); },
    get hydration() { return host.snapshotHandle(hydration, 'xtend.maraca.hydration-snapshot-facade.v1'); },
    get telemetry() { return host.snapshotHandle(telemetry, 'xtend.maraca.telemetry-snapshot-facade.v1'); },
    get appServices() { return host.snapshotHandle(appServices, 'xtend.maraca.app-services-snapshot-facade.v1'); },
    get validation() { return snapshot().validationSnapshot || null; },
    get animationEngine() { return snapshot().animationEngine || null; },
    get transitions() { return snapshot().transitionSnapshot || null; },
    ensureComponent: host.ensureComponent,
    boot,
    dispatchCommand,
    dispatchFastPass(actionId, payload, options) {
      if (!runtime) throw new Error('Maraca orchestration is not booted.');
      return runtime.dispatchFastPass(actionId, payload, options);
    },
    getSurfaceBoundary(id) {
      if (!runtime) throw new Error('Maraca orchestration is not booted.');
      return runtime.getSurfaceBoundary(id);
    },
    captureXTensionSSR() {
      if (!runtime || typeof runtime.captureXTensionSSR !== 'function') throw new Error('A completed server SSR request is required.');
      return runtime.captureXTensionSSR();
    },
    getXTensionBindings() {
      if (!runtime) throw new Error('Maraca orchestration is not booted.');
      return runtime.getXTensionBindings();
    },
    restoreURLState(token, lifetime) {
      if (!runtime) throw new Error('Maraca orchestration is not booted.');
      return runtime.restoreURLState(token, lifetime);
    },
    publishURLState(options) {
      if (!runtime) throw new Error('Maraca orchestration is not booted.');
      return runtime.publishURLState(options);
    },
    whenXTensionsIdle() { return runtime ? runtime.whenXTensionsIdle() : xtensionDrain; },
    dispatchStreamPatch,
    snapshot,
    subscribe,
    subscribeEvents(listener) {
      return observe('subscribeEvents', listener);
    },
    get model() { return runtime && runtime.model || null; },
    dispose
  };
  let facade = null;
  Object.defineProperty(facadeMembers, 'orchestration', {
    configurable: false,
    enumerable: false,
    get() { return facade; }
  });
  facade = deepFreeze(facadeMembers);

  return deepFreeze({
    schema: orchestrated ? 'xtend.maraca.browser-composition-root.v13' : lifecycle ? 'xtend.maraca.browser-composition-root.v12' : native ? 'xtend.maraca.browser-composition-root.v11' : composed ? projected ? 'xtend.maraca.browser-composition-root.v10' : scoped ? 'xtend.maraca.browser-composition-root.v9' : componentProfile ? 'xtend.maraca.browser-composition-root.v8' : ssrCapable ? 'xtend.maraca.browser-composition-root.v7' : 'xtend.maraca.browser-composition-root.v6' : 'xtend.maraca.browser-composition-root.v5',
    apiVersion,
    config,
    facade,
    boot,
    invokeComponentCommand,
    dispose
  });
}

export { COMPONENT_COMMAND_SCHEMA, COMPONENT_COMMAND_RESULT_SCHEMA };
