const COMPONENT_COMMAND_SCHEMA = 'xtend.rmt.component-command.v1';
const COMPONENT_COMMAND_RESULT_SCHEMA = 'xtend.maraca.component-command-result.v1';

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value); } catch (_) {}
  }
  return JSON.parse(JSON.stringify(value));
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

function diagnostic(code, error) {
  return freeze({
    schema: 'xtend.maraca.diagnostic.v1',
    code,
    severity: 'error',
    message: error && error.message ? error.message : String(error || code),
    error: { name: error && error.name || 'Error', code: error && error.code || code }
  });
}

export function createMaracaBrowserHostAdapter(configuration = {}, dependencies = {}) {
  const config = freeze(clone(configuration) || {});
  const globalTarget = dependencies.platformTarget || dependencies.globalTarget || globalThis;
  const windowTarget = dependencies.windowTarget || globalTarget.window || globalTarget;
  const documentTarget = dependencies.documentTarget || globalTarget.document || null;
  const runtimeApis = dependencies.runtimeApis && typeof dependencies.runtimeApis === 'object' ? dependencies.runtimeApis : {};
  const importers = dependencies.componentImporters || {};
  const handles = new Set();

  function publish(name, detail) {
    if (!windowTarget || typeof windowTarget.dispatchEvent !== 'function') return;
    const EventType = windowTarget.CustomEvent || globalTarget.CustomEvent;
    if (typeof EventType !== 'function') return;
    windowTarget.dispatchEvent(new EventType(name, { detail: freeze(clone(detail)) }));
  }

  function runtimeApi(name) {
    if (Object.prototype.hasOwnProperty.call(runtimeApis, name)) return runtimeApis[name];
    return globalTarget && globalTarget[name] || null;
  }

  function readOnlySnapshotHandle(handle, schema) {
    if (!handle || typeof handle.snapshot !== 'function') return null;
    return freeze({ schema, snapshot: () => freeze(clone(handle.snapshot())) });
  }

  function readModelSnapshot(runtime) {
    const modelPort = runtime && runtime.model;
    return modelPort && typeof modelPort.snapshot === 'function'
      ? freeze(clone(modelPort.snapshot()))
      : null;
  }

  function installPublicFacades(values = {}) {
    if (!windowTarget) return false;
    windowTarget.__XTendMaracaResult = freeze(clone(values.result));
    windowTarget.__XTendMaracaOrchestration = values.orchestrationFacade || null;
    windowTarget.__XTendMaracaKernel = readOnlySnapshotHandle(values.kernel, 'xtend.maraca.kernel-snapshot-facade.v1');
    windowTarget.__XTendMaracaHydration = readOnlySnapshotHandle(values.hydration, 'xtend.maraca.hydration-snapshot-facade.v1');
    windowTarget.__XTendMaracaResume = readOnlySnapshotHandle(values.resume, 'xtend.maraca.resume-snapshot-facade.v1');
    windowTarget.__XTendMaracaValidation = freeze(clone(values.validation));
    windowTarget.__XTendMaracaAnimationEngine = freeze(clone(values.animationEngine));
    windowTarget.__XTendMaracaTransitions = freeze(clone(values.transitions));
    windowTarget.__XTendMaracaTelemetry = readOnlySnapshotHandle(values.telemetry, 'xtend.maraca.telemetry-snapshot-facade.v1');
    windowTarget.__XTendMaracaTemplateArtifactsRegistration = freeze(clone(values.templateArtifactsRegistration));
    windowTarget.__XTendMaracaPwaRegistration = freeze(clone(values.pwaRegistration));
    return true;
  }

  function clearPublicFacades() {
    if (!windowTarget) return false;
    [
      '__XTendMaracaResult', '__XTendMaracaOrchestration', '__XTendMaracaKernel', '__XTendMaracaHydration',
      '__XTendMaracaResume', '__XTendMaracaValidation', '__XTendMaracaAnimationEngine', '__XTendMaracaTransitions',
      '__XTendMaracaTelemetry', '__XTendMaracaTemplateArtifactsRegistration', '__XTendMaracaPwaRegistration'
    ].forEach((key) => { windowTarget[key] = null; });
    return true;
  }

  async function ensureComponent(tag) {
    const load = importers[tag];
    if (typeof load !== 'function') throw new Error(`XTend Maraca has no component registry entry for ${tag}.`);
    await load();
    return tag;
  }

  async function ensureComponents(tags) {
    const loaded = [];
    for (const tag of Array.from(new Set((tags || []).filter(Boolean)))) loaded.push(await ensureComponent(tag));
    return loaded;
  }

  function attachCss(root) {
    if (!documentTarget) return false;
    const css = config.css || {};
    const selector = css.mode === 'inline' ? 'style[data-maraca-style]' : 'link[data-maraca-style]';
    if (documentTarget.querySelector(selector)) return false;
    const node = documentTarget.createElement(css.mode === 'inline' ? 'style' : 'link');
    node.setAttribute('data-maraca-style', css.mode === 'inline' ? 'inline' : 'external');
    if (css.mode === 'inline') node.textContent = String(css.text || '');
    else {
      node.rel = 'stylesheet';
      node.href = String(css.href || '');
    }
    (documentTarget.head || root || documentTarget.documentElement).appendChild(node);
    return true;
  }

  function resolveRoot(candidate = null) {
    if (candidate) return candidate;
    if (!documentTarget) return null;
    return documentTarget.querySelector('[data-maraca-root]')
      || documentTarget.getElementById('xtend-maraca-root')
      || documentTarget.body;
  }

  function elementById(id) {
    return documentTarget && id ? documentTarget.getElementById(id) : null;
  }

  function createRenderer(options = {}) {
    if (options.domRenderer) return options.domRenderer;
    const api = runtimeApi('XTendRmtDomDescriptorRenderer');
    if (!api || typeof api.createRmtDomDescriptorRenderer !== 'function') {
      throw new Error('XTend Maraca requires the official RMT DOM descriptor renderer.');
    }
    return api.createRmtDomDescriptorRenderer({
      documentTarget,
      componentRegistry: options.componentRegistry || null,
      trustedDomRenderer: options.trustedDomRenderer,
      trustedDom: options.trustedDom
    });
  }

  function commitRootMetadata(root, renderer, attributes, operation) {
    return renderer.commit({
      operation: 'merge-element',
      target: root,
      descriptor: { type: 'element', tag: String(root.localName || root.tagName || 'div').toLowerCase(), attributes },
      context: { metadata: { operation } },
      ownership: { owner: 'descriptor-renderer', mode: config.orchestration && config.orchestration.strict ? 'strict' : 'compatibility', domains: { attributes: 'descriptor-renderer' } }
    });
  }

  function renderCompatibility(root, renderer) {
    if (!config.compatibilityRenderDescriptor) return null;
    return renderer.commit({
      operation: 'replace-children',
      target: root,
      descriptor: config.compatibilityRenderDescriptor,
      context: { model: config.state || {}, metadata: { operation: 'maraca.boot.static-surfaces' } },
      ownership: { owner: 'descriptor-renderer', mode: config.orchestration && config.orchestration.strict ? 'strict' : 'compatibility', domains: { events: 'event-router' } }
    });
  }

  function readResumePayload() {
    if (!documentTarget) return null;
    const node = documentTarget.getElementById('xtend-llm-ssr-hydration')
      || documentTarget.querySelector('[data-rmt-ssr-resume]')
      || documentTarget.querySelector('[data-rmt-ssr-hydration]');
    if (!node || typeof node.textContent !== 'string') return null;
    try { return JSON.parse(node.textContent); }
    catch (error) { return { schema: 'xtend.maraca.server-prerender-shell.v1', ok: false, status: 'parse_failed', message: error.message }; }
  }

  function adoptServerShell(root, renderer) {
    if (!root || typeof root.querySelector !== 'function') return freeze({ schema: 'xtend.maraca.server-prerender-shell.v1', active: false, status: 'absent' });
    const shell = root.getAttribute && root.getAttribute('data-rmt-resume-root') === 'true'
      ? root
      : root.querySelector('[data-rmt-resume-root="true"], [data-maraca-ssr-shell]');
    const payload = readResumePayload();
    if (!shell) return freeze({ schema: 'xtend.maraca.server-prerender-shell.v1', active: false, status: payload ? 'payload_only' : 'absent', payload });
    const envelope = payload && (payload.resume || payload.response && payload.response.resume || payload.schema === 'xtend.rmt.ssr-resume-envelope.v1' && payload) || null;
    const executionMode = envelope && envelope.executionMode || payload && payload.executionMode || 'server_prerender_hydrate';
    commitRootMetadata(root, renderer, { 'data-rmt-ssr-preserved': 'true', 'data-rmt-hydration-mode': executionMode }, 'maraca.boot.ssr-adoption');
    return freeze({
      schema: 'xtend.maraca.server-prerender-shell.v1', active: true, status: 'preserved', transport: 'node-ssr', executionMode,
      resumeEnvelopeSchema: envelope && envelope.schema || null,
      resumeRootId: shell.getAttribute && shell.getAttribute('id') || null,
      surfaceCount: typeof shell.querySelectorAll === 'function' ? shell.querySelectorAll('[data-rmt-ssr-surface]').length : 0,
      payload
    });
  }

  function resolveSurface(root, surfaceId) {
    const matches = (node) => Boolean(node && typeof node.getAttribute === 'function' && node.getAttribute('data-maraca-surface') === surfaceId);
    if (matches(root)) return root;
    if (!root || typeof root.querySelectorAll !== 'function') return null;
    return Array.from(root.querySelectorAll('[data-maraca-surface]')).find(matches) || null;
  }

  async function invokeComponentCommand(root, record) {
    if (!record || record.schema !== COMPONENT_COMMAND_SCHEMA) throw new Error(`XTend Maraca component command requires schema ${COMPONENT_COMMAND_SCHEMA}.`);
    const command = String(record.command || '').trim();
    if (!['focus', 'reset', 'snapshot'].includes(command)) throw new Error(`XTend Maraca component command ${command || '(missing)'} is not allowed.`);
    const target = record.target && typeof record.target === 'object' ? record.target : null;
    const surfaceId = target && String(target.id || '').trim();
    const component = target && String(target.component || '').trim().toLowerCase();
    if (!target || target.kind !== 'surface' || !surfaceId || !component) throw new Error('XTend Maraca component command requires a statically compiled surface target.');
    await ensureComponent(component);
    const element = resolveSurface(root, surfaceId);
    if (!element) throw new Error(`XTend Maraca component command surface ${surfaceId} is not materialized inside the orchestration root.`);
    const localName = String(element.localName || '').trim().toLowerCase();
    const declared = String(element.getAttribute && element.getAttribute('data-rmt-component') || '').trim().toLowerCase();
    if (localName !== component && declared !== component) throw new Error(`XTend Maraca component command surface ${surfaceId} is not the compiled ${component} component.`);
    let result = null;
    if (typeof element[command] !== 'function') throw new Error(`XTend Maraca component ${component} does not expose ${command}().`);
    result = await element[command]();
    return freeze({ schema: COMPONENT_COMMAND_RESULT_SCHEMA, command, surfaceId, component, result: command === 'snapshot' ? clone(result) : null });
  }

  function createHydrationPort(root, options = {}) {
    const supplied = options.componentRegistry || null;
    let observer = null;
    const history = [];
    async function hydrate(rootTarget, tags, metadata = {}) {
      const unique = Array.from(new Set((tags || []).filter(Boolean)));
      history.push(freeze({ tags: unique.slice(), metadata: clone(metadata), status: 'pending' }));
      publish('xtend-maraca:hydration-start', { schema: 'xtend.maraca.hydration-history-entry.v1', tags: unique, metadata });
      if (supplied && typeof supplied.hydrate === 'function') return supplied.hydrate(rootTarget, unique, metadata);
      const viewport = (options.lazyStrategy || config.lazyMode) === 'viewport' && typeof windowTarget.IntersectionObserver === 'function';
      if (viewport && String(metadata.operation || '').startsWith('maraca.boot')) {
        const elements = rootTarget && typeof rootTarget.querySelectorAll === 'function'
          ? Array.from(rootTarget.querySelectorAll('[data-rmt-component], [data-maraca-surface]')) : [];
        observer = new windowTarget.IntersectionObserver((records) => records.forEach((entry) => {
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) return;
          observer.unobserve(entry.target);
          const tag = entry.target.getAttribute('data-rmt-component') || entry.target.localName;
          ensureComponent(tag).then(() => publish('xtend-maraca:component-load', { tag, strategy: 'viewport' }), (error) => publish('xtend-maraca:component-error', diagnostic('xtend.maraca.component_load_error', error)));
        }), { root: options.viewportRoot || null, rootMargin: options.rootMargin || '160px', threshold: options.threshold || 0 });
        elements.forEach((element) => observer.observe(element));
        handles.add({ dispose() { observer && observer.disconnect(); observer = null; } });
        return freeze({ strategy: 'viewport', observedCount: elements.length });
      }
      const result = supplied && typeof supplied.ensureTags === 'function' ? await supplied.ensureTags(unique) : await ensureComponents(unique);
      history[history.length - 1] = freeze({ tags: unique.slice(), metadata: clone(metadata), status: 'hydrated' });
      publish('xtend-maraca:hydration-complete', { schema: 'xtend.maraca.hydration-history-entry.v1', tags: unique, metadata });
      return result;
    }
    return freeze({
      ensureTags: ensureComponents,
      hydrate,
      snapshot() {
        return freeze({ schema: 'xtend.maraca.hydration-snapshot.v1', enabled: Boolean(config.hydration && config.hydration.enabled), status: config.hydration && config.hydration.status || 'disabled', history: clone(history), diagnostics: clone(config.hydration && config.hydration.diagnostics || []) });
      },
      dispose() { if (!observer) return false; observer.disconnect(); observer = null; return true; }
    });
  }

  function createKernelController(options = {}) {
    const plan = config.kernel || {};
    const api = runtimeApi('XTendRmtKernelOrchestrationController');
    if (!plan.enabled) return freeze({ enabled: false, status: plan.status || 'disabled', scheduleWork(_kind, callback, metadata) { return Promise.resolve().then(() => callback({ scheduled: false, metadata })); }, listScheduledEndpoints() { return []; }, listDiagnostics() { return []; }, snapshot() { return { schema: 'xtend.maraca.kernel-snapshot.v1', enabled: false, status: plan.status || 'disabled' }; }, dispose() { return false; } });
    if (!api || typeof api.createRmtKernelOrchestrationController !== 'function') {
      if (plan.strict) throw new Error('XTend Maraca strict kernel requires the kernel orchestration controller port.');
      return freeze({ enabled: false, status: 'degraded', scheduleWork(_kind, callback, metadata) { return Promise.resolve().then(() => callback({ scheduled: false, metadata })); }, listScheduledEndpoints() { return []; }, listDiagnostics() { return [diagnostic('xtend.maraca.kernel_controller_missing', new Error('Kernel controller port is unavailable.'))]; }, snapshot() { return { schema: 'xtend.maraca.kernel-snapshot.v1', enabled: false, status: 'degraded' }; }, dispose() { return false; } });
    }
    const controller = api.createRmtKernelOrchestrationController({
      kernelApi: dependencies.kernelRuntimeModule || null,
      artifact: plan.artifact || null,
      plan,
      strict: Boolean(plan.strict),
      hostAdapter: options.kernelHostAdapter || options.schedulerAdapter,
      windowTarget,
      documentTarget,
      runtimeKind: 'maraca-kernel',
      dispatchEvent: publish
    });
    controller.boot();
    return controller;
  }

  function registerTemplateArtifacts(options = {}) {
    const report = config.templateArtifacts;
    const bundle = report && report.artifactBundle;
    const base = { schema: 'xtend.maraca.template-artifacts-registration.v1', ok: false, status: 'not_eligible' };
    if (!report || !bundle || report.trusted !== true || !report.registration || report.registration.eligible !== true) return freeze(base);
    const api = dependencies.kernelRuntimeModule;
    if (!api || typeof api.createRmtTemplateArtifacts !== 'function') return freeze({ ...base, status: 'runtime_factory_unavailable' });
    try {
      const registry = api.createRmtTemplateArtifacts({ now: () => 0, ...(options.templateArtifactsOptions || {}) });
      const registered = registry.registerArtifactBundle(bundle, { replace: true, trusted: true });
      const result = freeze({ ...base, ok: Boolean(registered && registered.ok), status: registered && registered.ok ? 'registered' : 'failed', registered });
      publish('xtend-maraca:template-artifacts', result);
      return result;
    } catch (error) {
      const result = freeze({ ...base, status: 'failed', diagnostic: diagnostic('xtend.maraca.template_artifacts_registration_error', error) });
      publish('xtend-maraca:template-artifacts', result);
      if (config.orchestration && config.orchestration.strict) throw error;
      return result;
    }
  }

  async function registerPwa(options = {}) {
    const plan = config.pwa || {};
    if (!plan.enabled || options.registerServiceWorker === false) return freeze({ schema: 'xtend.maraca.pwa-registration.v1', status: 'disabled', registered: false });
    const serviceWorker = windowTarget.navigator && windowTarget.navigator.serviceWorker;
    if (!serviceWorker || typeof serviceWorker.register !== 'function') return freeze({ schema: 'xtend.maraca.pwa-registration.v1', status: 'unsupported', registered: false });
    try {
      const serviceWorkerPlan = plan.serviceWorker && typeof plan.serviceWorker === 'object'
        ? plan.serviceWorker
        : {};
      const registrationUrl = options.serviceWorkerUrl
        || serviceWorkerPlan.registrationUrl
        || plan.serviceWorkerRef
        || './xtend.service-worker.js';
      const registrationOptions = {
        scope: options.serviceWorkerScope || serviceWorkerPlan.scope || './'
      };
      if (serviceWorkerPlan.type === 'module') registrationOptions.type = 'module';
      const registration = await serviceWorker.register(registrationUrl, registrationOptions);
      const result = freeze({ schema: 'xtend.maraca.pwa-registration.v1', status: 'registered', registered: true, scope: registration && registration.scope || null });
      publish('xtend-maraca:pwa', result);
      return result;
    } catch (error) {
      const result = freeze({ schema: 'xtend.maraca.pwa-registration.v1', status: 'failed', registered: false, diagnostic: diagnostic('xtend.maraca.pwa_registration_error', error) });
      publish('xtend-maraca:pwa', result);
      return result;
    }
  }

  function createTelemetryPort(readers = {}) {
    const history = [];
    let disposed = false;
    return freeze({
      publish(type, payload) {
        if (disposed) return false;
        history.push(freeze({ type: String(type || 'event'), payload: clone(payload) }));
        if (history.length > 50) history.shift();
        return true;
      },
      snapshot() {
        return freeze({
          schema: 'xtend.maraca.telemetry-snapshot.v1',
          kernel: readers.kernel && typeof readers.kernel.snapshot === 'function' ? clone(readers.kernel.snapshot()) : null,
          orchestration: readers.runtime && typeof readers.runtime.snapshot === 'function' ? clone(readers.runtime.snapshot()) : null,
          history: clone(history)
        });
      },
      dispose() { if (disposed) return false; disposed = true; history.length = 0; return true; }
    });
  }

  function dispose() {
    let count = 0;
    [...handles].reverse().forEach((handle) => {
      try { if (handle && typeof handle.dispose === 'function' && handle.dispose() !== false) count += 1; } catch (error) { publish('xtend-maraca:dispose-error', diagnostic('xtend.maraca.dispose_error', error)); }
    });
    handles.clear();
    return count;
  }

  return freeze({
    schema: 'xtend.maraca.browser-host-adapter.v2', config, publish, runtimeApi, readModelSnapshot, snapshotHandle: readOnlySnapshotHandle, installPublicFacades, clearPublicFacades,
    attachCss, resolveRoot, elementById, createRenderer,
    commitRootMetadata, renderCompatibility, readResumePayload, adoptServerShell, ensureComponent, ensureComponents,
    invokeComponentCommand, createHydrationPort, createKernelController, registerTemplateArtifacts, registerPwa, createTelemetryPort,
    registerHandle(handle) { if (handle) handles.add(handle); return handle; }, dispose
  });
}

export { COMPONENT_COMMAND_SCHEMA, COMPONENT_COMMAND_RESULT_SCHEMA };
