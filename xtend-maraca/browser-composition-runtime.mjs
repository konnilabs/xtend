import {
  COMPONENT_COMMAND_RESULT_SCHEMA,
  COMPONENT_COMMAND_SCHEMA,
  createMaracaBrowserHostAdapter
} from './browser-host-adapter.mjs';

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
  XUtils: Object.freeze(['components/xutils.js', 'XUtils']),
  xtendState: Object.freeze(['components/xtend-state.js', 'xtendState']),
  XTendSurfaceController: Object.freeze(['components/xsurfacemanager-controller.js', 'XTendSurfaceController']),
  XTendRmtResumeRuntime: Object.freeze(['xtendrmt/rmt-resume-runtime.js', 'XTendRmtResumeRuntime']),
  XTendRmtStateBindingViewProjector: Object.freeze(['xtendrmt/rmt-state-binding-view-projector.js', 'XTendRmtStateBindingViewProjector']),
  XTendRmtStateHostAdapter: Object.freeze(['xtendrmt/rmt-state-host-adapter.js', 'XTendRmtStateHostAdapter']),
  XTendRmtStateSelectorRuntime: Object.freeze(['xtendrmt/rmt-state-selector-runtime.js', 'XTendRmtStateSelectorRuntime']),
  XTendRmtActionEffectRuntime: Object.freeze(['xtendrmt/rmt-action-effect-runtime.js', 'XTendRmtActionEffectRuntime']),
  XTendRmtEventRoutingRuntime: Object.freeze(['xtendrmt/rmt-event-routing-runtime.js', 'XTendRmtEventRoutingRuntime']),
  XTendRmtAppRuntime: Object.freeze(['xtendrmt/rmt-app-runtime.js', 'XTendRmtAppRuntime']),
  XTendRmtAnimationEngineRuntime: Object.freeze(['xtendrmt/rmt-animation-engine-runtime.js', 'XTendRmtAnimationEngineRuntime']),
  XTendRmtFormValidationRuntime: Object.freeze(['xtendrmt/rmt-form-validation-runtime.js', 'XTendRmtFormValidationRuntime']),
  XTendRmtSurfaceTransitionRuntime: Object.freeze(['xtendrmt/rmt-surface-transition-runtime.js', 'XTendRmtSurfaceTransitionRuntime']),
  XTendRmtMaracaViewProjectionAdapter: Object.freeze(['xtendrmt/rmt-maraca-view-projection-adapter.js', 'XTendRmtMaracaViewProjectionAdapter']),
  XTendRmtPresentationEffectAdapter: Object.freeze(['xtendrmt/rmt-presentation-effect-adapter.js', 'XTendRmtPresentationEffectAdapter']),
  XTendRmtSurfaceResourceGraphRuntime: Object.freeze(['xtendrmt/rmt-surface-resource-graph-runtime.js', 'XTendRmtSurfaceResourceGraphRuntime']),
  XTendRmtDomDescriptorRenderer: Object.freeze(['xtendrmt/rmt-dom-descriptor-renderer.js', 'XTendRmtDomDescriptorRenderer'])
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
  Object.entries(RUNTIME_MODULE_API_BINDINGS).forEach(([runtimeName, [moduleId, exportName]]) => {
    const api = selectRuntimeModuleApi(moduleApis[moduleId], exportName);
    if (api) resolved[runtimeName] = api;
  });
  return Object.freeze({ ...resolved, ...(dependencies.runtimeApis || {}) });
}

export function freezeMaracaConfiguration(value) {
  return deepFreeze(clone(value));
}

function disabledRuntime(plan) {
  const snapshot = () => deepFreeze({
    schema: 'xtend.maraca.plan-runtime.v2',
    phase: 'created',
    enabled: false,
    mode: plan && plan.mode || 'disabled',
    status: plan && plan.status || 'disabled',
    diagnostics: clone(plan && plan.diagnostics || [])
  });
  return deepFreeze({
    schema: 'xtend.maraca.plan-runtime.v2', model: null,
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
        inputPolicyVerdicts: typeof registry.listInputPolicyVerdicts === 'function'
          ? clone(registry.listInputPolicyVerdicts())
          : []
      };
    },
    dispose(reason) { registry.dispose(reason); return true; }
  });
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
    plan: {
      orchestration: config.orchestration,
      kernel: config.kernel,
      hydration: config.hydration,
      validation: config.validation,
      transitions: config.transitions,
      components: { selected: config.components || [] },
      surfaces: config.surfaces || [],
      state: options.initialState || config.state || {}
    },
    root,
    initialState: options.initialState || config.state || {},
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
    navigationAdapter: options.navigationAdapter || null,
    focusAdapter: options.focusAdapter || null,
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
  const config = freezeMaracaConfiguration(configuration || {});
  const platformTarget = dependencies.platformTarget || dependencies['global' + 'Target'] || dependencies.windowTarget || {};
  const windowTarget = dependencies.windowTarget || platformTarget['window'] || platformTarget;
  const documentTarget = dependencies.documentTarget || platformTarget['document'] || null;
  const runtimeApis = createInjectedRuntimeApis(dependencies);
  const host = createMaracaBrowserHostAdapter(config, { ...dependencies, runtimeApis, platformTarget, windowTarget, documentTarget });
  let generation = 0;
  let runtime = null;
  let runtimeUnsubscribe = null;
  let root = null;
  let renderer = null;
  let kernel = null;
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

  function cleanupBootAttempt(attempt, disposed, reason) {
    if (!attempt || attempt.promoted || attempt.cleaned) return;
    attempt.cleaned = true;
    if (typeof attempt.runtimeUnsubscribe === 'function') attempt.runtimeUnsubscribe();
    attempt.runtimeUnsubscribe = null;
    closeHandle(disposed, 'resume', attempt.resume);
    closeHandle(disposed, 'hydration', attempt.hydration);
    closeHandle(disposed, 'orchestration', attempt.runtime);
    closeHandle(disposed, 'appServices', attempt.appServices, reason);
    closeHandle(disposed, 'kernel', attempt.kernel);
    closeHandle(disposed, 'telemetry', attempt.telemetry);
    closeHandle(disposed, 'renderer', attempt.renderer, attempt.root || undefined, { clearOwnedDom: false });
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
    return deepFreeze({ schema: 'xtend.maraca.plan-runtime.v2', phase: 'created', enabled: false, status: 'not_booted', diagnostics: [] });
  }

  function subscribe(listener) {
    if (!runtime || typeof runtime.subscribe !== 'function') return () => {};
    return runtime.subscribe((value) => listener(deepFreeze(clone(value))));
  }

  function publishRuntimeEvent(value) {
    const event = value && value.lastEvent;
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
      attempt.root = host.resolveRoot(options.root || null);
      attempt.appServices = createAppServicesPort(config, dependencies, options, host.publish);
      attempt.renderer = host.createRenderer(options);
      host.attachCss(attempt.root);
      const serverPrerenderShell = host.adoptServerShell(attempt.root, attempt.renderer);
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
      attempt.kernel = host.createKernelController(options);
      attempt.hydration = host.createHydrationPort(attempt.root, options);
      const enabled = config.orchestration && config.orchestration.enabled && config.orchestration.artifact;
      if (enabled) {
        if (typeof dependencies.createPlanRuntime !== 'function') throw new Error('XTend Maraca composition requires createMaracaPlanRuntime.');
        attempt.runtime = dependencies.createPlanRuntime(createRuntimeConfiguration(config, options, host, {
          root: attempt.root,
          renderer: attempt.renderer,
          kernel: attempt.kernel,
          hydration: attempt.hydration,
          appServices: attempt.appServices,
          documentTarget,
          windowTarget,
          platformTarget,
          dependencies
        }));
        attempt.runtimeUnsubscribe = attempt.runtime.subscribe(publishRuntimeEvent);
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
        resumeResult = await attempt.resume.resumeResponse(payload.response || payload, {}, { root: attempt.root, preflight: resumePreflight, intentQueue: options.intentQueue || [] });
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
        : deepFreeze({ schema: 'xtend.maraca.plan-runtime.v2', phase: 'created', enabled: false, status: 'not_booted', diagnostics: [] });
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
    if (bootResult && runtime) return duplicateBootResult(bootResult);
    if (bootAttempt) return duplicateBootResult(await bootAttempt.promise);
    generation += 1;
    let rejectCancellation;
    const cancellation = new Promise((_, reject) => { rejectCancellation = reject; });
    const attempt = {
      generation,
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
    closeHandle(disposed, 'kernel', kernel);
    closeHandle(disposed, 'telemetry', telemetry);
    closeHandle(disposed, 'renderer', renderer, root || undefined, { clearOwnedDom: false });
    disposed.host = host.dispose() > 0;
    runtime = null; resume = null; hydration = null; kernel = null; appServices = null; renderer = null; root = null; bootResult = null;
    templateArtifactsRegistration = null; pwaRegistration = null; telemetry = null;
    host.clearPublicFacades();
    const report = deepFreeze({ schema: 'xtend.maraca.dispose.v1', reason, ...disposed });
    host.publish('xtend-maraca:dispose', report);
    return report;
  }

  const facadeMembers = {
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
    dispatchStreamPatch,
    snapshot,
    subscribe,
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
    schema: 'xtend.maraca.browser-composition-root.v1',
    config,
    facade,
    boot,
    invokeComponentCommand,
    dispose
  });
}

export { COMPONENT_COMMAND_SCHEMA, COMPONENT_COMMAND_RESULT_SCHEMA };
