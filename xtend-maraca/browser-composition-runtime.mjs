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
  const collisions = Object.keys(options.hostServiceAdapters || {}).filter((id) => Object.prototype.hasOwnProperty.call(adapters, id));
  if (collisions.length) {
    const error = new Error(`Manual AppService adapters collide with generated services: ${collisions.join(', ')}.`);
    publish('xtend-maraca:diagnostic', { schema: 'xtend.maraca.diagnostic.v1', code: 'xtend.maraca.app_services.manual_adapter_collision', severity: servicePlan.strict ? 'error' : 'warning', message: error.message });
    if (servicePlan.strict) throw error;
  }
  const hostServiceAdapters = deepFreeze({ ...adapters, ...(options.hostServiceAdapters || options.serviceAdapters || {}) });
  const dataSourceAdapters = deepFreeze({
    host: { invoke(request = {}) { const source = request.source || {}; return registry.invoke(source.endpoint || source.service || source.id, request.payload, request.context || {}); } },
    ...(options.dataSourceAdapters || {})
  });
  return deepFreeze({
    enabled: true, status: 'booted', hostServiceAdapters, dataSourceAdapters,
    snapshot() { return { schema: 'xtend.maraca.app-services-runtime.v1', enabled: true, status: 'booted', serviceIds: manifestServices.map((entry) => entry.id) }; },
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
    xstate: options.xstate || host.runtimeApi('xstate'),
    fabric: options.fabric || null,
    hostServices: options.hostServices || {},
    hostServiceRegistry: options.hostServiceRegistry || null,
    hostServiceAdapters: handles.appServices.hostServiceAdapters,
    serviceAdapters: handles.appServices.hostServiceAdapters,
    dataSourceAdapters: handles.appServices.dataSourceAdapters,
    resourceManager: options.resourceManager || null,
    resourceAdapters: options.resourceAdapters || {},
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
          stateProjection: host.runtimeApi('XTendRmtXStateHostAdapter'),
          stateBindings: host.runtimeApi('XTendRmtStateBindingViewProjector'),
          action: host.runtimeApi('XTendRmtActionEffectRuntime'),
          app: host.runtimeApi('XTendRmtAppRuntime'),
          events: host.runtimeApi('XTendRmtEventRoutingRuntime'),
          animation: host.runtimeApi('XTendRmtAnimationEngineRuntime'),
          validation: host.runtimeApi('XTendRmtFormValidationRuntime'),
          transitions: host.runtimeApi('XTendRmtSurfaceTransitionRuntime'),
          viewProjection: host.runtimeApi('XTendRmtMaracaViewProjectionAdapter'),
          presentation: host.runtimeApi('XTendRmtPresentationEffectAdapter'),
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
  const host = createMaracaBrowserHostAdapter(config, { ...dependencies, platformTarget, windowTarget, documentTarget });
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

  async function boot(options = {}) {
    if (!documentTarget) return deepFreeze({ ok: false, status: 'no_document', schema: config.schema });
    if (runtime) dispose('XTend Maraca app restarted.');
    const bootGeneration = ++generation;
    root = host.resolveRoot(options.root || null);
    appServices = createAppServicesPort(config, dependencies, options, host.publish);
    renderer = host.createRenderer(options);
    host.attachCss(root);
    const serverPrerenderShell = host.adoptServerShell(root, renderer);
    const payload = serverPrerenderShell.payload;
    const envelope = payload && (payload.resume || payload.response && payload.response.resume || payload) || null;
    const resumeRequested = serverPrerenderShell.active && serverPrerenderShell.executionMode === 'server_prerender_resume';
    let resumePreflight = null;
    const resumeApi = resumeRequested ? host.runtimeApi('XTendRmtResumeRuntime') : null;
    if (resumeRequested && resumeApi && typeof resumeApi.createRmtResumeRuntime === 'function') {
      resume = resumeApi.createRmtResumeRuntime({
        root: envelope && envelope.rootId && host.elementById(envelope.rootId) || root,
        verifyResumeEnvelope: options.verifyResumeEnvelope || options.verify,
        adopters: options.resumeAdopters || options.adopters || {},
        restoreState() { return host.readModelSnapshot(runtime); },
        adoptRoot() { return runtime ? runtime.snapshot() : null; },
        replayIntent(intent) { return runtime.dispatchCommand(intent.action, intent.payload || {}, { operation: 'resume-replay', eventId: intent.eventId }); },
        hydrateResponse() { return runtime && runtime.refresh ? runtime.refresh({ operation: 'maraca.resume-fallback' }) : hydration.hydrate(root, (config.components || []).map((entry) => entry.tag), { operation: 'maraca.resume-fallback' }); },
        publishDiagnostic(value) { host.publish('xtend-maraca:resume-diagnostic', value); }
      });
      if (typeof resume.verifyResponse === 'function') resumePreflight = await resume.verifyResponse(payload.response || payload, {}, { root });
      if (resumePreflight && resumePreflight.ok) options = { ...options, initialState: resumePreflight.state, adoptExisting: true };
    }
    if (!serverPrerenderShell.active && !(config.orchestration && config.orchestration.enabled)) host.renderCompatibility(root, renderer);
    kernel = host.createKernelController(options);
    hydration = host.createHydrationPort(root, options);
    const enabled = config.orchestration && config.orchestration.enabled && config.orchestration.artifact;
    if (enabled) {
      if (typeof dependencies.createPlanRuntime !== 'function') throw new Error('XTend Maraca composition requires createMaracaPlanRuntime.');
      runtime = dependencies.createPlanRuntime(createRuntimeConfiguration(config, options, host, {
        root, renderer, kernel, hydration, appServices, documentTarget, windowTarget, platformTarget, dependencies
      }));
      runtimeUnsubscribe = runtime.subscribe(publishRuntimeEvent);
      await runtime.boot();
      host.publish('xtend-maraca:orchestration-boot', { schema: 'xtend.maraca.orchestration-boot.v1', mode: config.orchestration.mode, summary: config.orchestration.summary || {} });
    } else {
      runtime = disabledRuntime(config.orchestration);
      await hydration.hydrate(root, (config.components || []).map((entry) => entry.tag), { operation: 'maraca.boot.compatibility' });
    }
    if (generation !== bootGeneration) throw new Error('XTend Maraca boot was superseded or disposed.');
    let resumeResult = null;
    if (resumeRequested && resume && typeof resume.resumeResponse === 'function') {
      resumeResult = await resume.resumeResponse(payload.response || payload, {}, { root, preflight: resumePreflight, intentQueue: options.intentQueue || [] });
      host.commitRootMetadata(root, renderer, { 'data-rmt-resume-status': resumeResult.status }, 'maraca.boot.resume-status');
      host.publish('xtend-maraca:resume', resumeResult);
    }
    templateArtifactsRegistration = host.registerTemplateArtifacts(options);
    pwaRegistration = await host.registerPwa(options);
    telemetry = host.createTelemetryPort({ kernel, runtime, hydration });
    const runtimeSnapshot = snapshot();
    bootResult = deepFreeze({
      ...runtimeSnapshot,
      ok: true,
      status: (options.lazyStrategy || config.lazyMode) === 'viewport' ? 'booted_lazy' : 'booted',
      schema: config.schema,
      componentTags: (config.components || []).map((entry) => entry.tag),
      surfaceCount: (config.surfaces || []).length,
      eventCount: (config.events || []).length,
      appServices: appServices.snapshot(),
      orchestration: { enabled: Boolean(runtime.model), mode: config.orchestration && config.orchestration.mode, status: config.orchestration && config.orchestration.status },
      kernel: kernel && typeof kernel.snapshot === 'function' ? deepFreeze(clone(kernel.snapshot())) : null,
      serverPrerenderShell,
      resume: resumeResult,
      templateArtifacts: { plan: config.templateArtifacts || null, registration: templateArtifactsRegistration },
      pwa: { plan: config.pwa || null, registration: pwaRegistration },
      productionClosure: config.productionClosure || null,
      publicNameReservations: config.publicNames || []
    });
    host.installPublicFacades({
      result: bootResult,
      orchestrationFacade: facade,
      kernel,
      hydration,
      resume,
      validation: runtimeSnapshot.validationSnapshot || null,
      animationEngine: runtimeSnapshot.animationEngine || null,
      transitions: runtimeSnapshot.transitionSnapshot || null,
      telemetry,
      templateArtifactsRegistration,
      pwaRegistration
    });
    host.publish('xtend-maraca:boot', bootResult);
    return bootResult;
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
    if (typeof runtimeUnsubscribe === 'function') runtimeUnsubscribe();
    runtimeUnsubscribe = null;
    const disposed = { orchestration: false, resume: false, hydration: false, kernel: false, appServices: false, renderer: false, host: false };
    const close = (key, handle, ...args) => {
      if (!handle || typeof handle.dispose !== 'function') return;
      try { disposed[key] = handle.dispose(...args) !== false; }
      catch (error) { host.publish('xtend-maraca:dispose-error', { schema: 'xtend.maraca.diagnostic.v1', code: 'xtend.maraca.dispose_error', severity: 'error', message: error.message }); }
    };
    close('resume', resume);
    close('hydration', hydration);
    close('orchestration', runtime);
    close('appServices', appServices, reason);
    close('kernel', kernel);
    close('telemetry', telemetry);
    close('renderer', renderer, root || undefined, { clearOwnedDom: false });
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
