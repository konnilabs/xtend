const PLAN_RUNTIME_SCHEMA = 'xtend.maraca.plan-runtime.v1';

function clone(value, fallback = null) {
  if (value == null || typeof value !== 'object') return value == null ? fallback : value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function runtimeFactory(api, name) {
  return api && typeof api[name] === 'function' ? api[name] : null;
}

function readPath(source, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (parts.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) return undefined;
  return parts.reduce((value, part) => value == null ? undefined : value[part], source);
}

function writePath(source, path, value) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (parts.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) return source;
  let cursor = source;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) cursor[part] = value;
    else { if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) cursor[part] = {}; cursor = cursor[part]; }
  });
  return source;
}

function reducerValue(value, payload, result) {
  if (typeof value !== 'string') return clone(value, value);
  if (value === 'input' || value === 'payload') return clone(payload, {});
  if (value.startsWith('input.')) return readPath(payload, value.slice(6));
  if (value.startsWith('payload.')) return readPath(payload, value.slice(8));
  if (value === 'result') return clone(result, {});
  if (value.startsWith('result.')) return readPath(result, value.slice(7));
  return value;
}

function defaultModuleApis(target = globalThis) {
  return {
    state: target.XTendRmtStateSelectorRuntime,
    action: target.XTendRmtActionEffectRuntime,
    events: target.XTendRmtEventRoutingRuntime,
    validation: target.XTendRmtFormValidationRuntime,
    transitions: target.XTendRmtSurfaceTransitionRuntime,
    renderer: target.XTendRmtDomDescriptorRenderer,
    kernel: target.XTendRmtKernelOrchestrationController
  };
}

export function createMaracaPlanRuntime(options = {}) {
  const plan = asRecord(options.plan);
  const root = options.root;
  const hostServices = Object.freeze({ ...asRecord(options.hostServices) });
  const diagnostics = [];
  const subscriptions = new Set();
  const disposers = new Set();
  let generation = 0;
  let phase = 'created';
  let modules = null;
  let runtimes = null;
  let renderCount = 0;
  let renderSuspended = 0;

  if (!root || typeof root.replaceChildren !== 'function') {
    throw new TypeError('createMaracaPlanRuntime() requires a DOM root with replaceChildren().');
  }

  const orchestration = asRecord(plan.orchestration);
  const artifact = asRecord(orchestration.artifact || plan.artifact);

  function publish(type, detail = {}) {
    const event = Object.freeze({ schema: PLAN_RUNTIME_SCHEMA, type, generation, ...clone(detail, {}) });
    subscriptions.forEach((listener) => { try { listener(event); } catch (_) {} });
    return event;
  }

  async function resolveModules() {
    if (modules) return modules;
    if (typeof options.loadModules === 'function') {
      modules = await options.loadModules(plan);
    } else {
      const moduleUrls = Array.isArray(options.moduleUrls) ? options.moduleUrls : [];
      if (moduleUrls.length) await Promise.all(moduleUrls.map((url) => import(String(url))));
      modules = defaultModuleApis(options.globalTarget || globalThis);
    }
    return modules;
  }

  function createKernel(api) {
    const factory = runtimeFactory(api, 'createRmtKernelOrchestrationController');
    if (factory) return factory({ fabric: options.fabric, hostServices, diagnostics });
    return Object.freeze({
      schema: 'xtend.maraca.plan-runtime.inline-kernel.v1',
      scheduleWork(_lane, work) { return Promise.resolve().then(work); },
      snapshot() { return { schema: this.schema, status: 'ready' }; },
      dispose() {}
    });
  }

  function componentTags() {
    const selected = asRecord(plan.components).selected;
    const tags = [
      ...(Array.isArray(selected) ? selected.map((entry) => entry && entry.tag) : []),
      ...(Array.isArray(plan.surfaces) ? plan.surfaces.map((entry) => entry && entry.component) : [])
    ];
    return [...new Set(tags.map((tag) => String(tag || '').toLowerCase()).filter(Boolean))];
  }

  async function ensureComponents() {
    const registry = options.componentRegistry;
    const tags = componentTags();
    if (registry && typeof registry.ensureTags === 'function') await registry.ensureTags(tags);
    else if (registry && typeof registry.ensure === 'function') await Promise.all(tags.map((tag) => registry.ensure(tag)));
    return tags;
  }

  function syncSurfaceVisibility() {
    if (!runtimes || !runtimes.state || typeof runtimes.state.snapshot !== 'function' || typeof root.querySelectorAll !== 'function') return;
    const snapshot = asRecord(runtimes.state.snapshot());
    const states = asRecord(snapshot.states);
    const selectors = asRecord(snapshot.selectors);
    const surfaces = Array.isArray(artifact.surfaces)
      ? artifact.surfaces
      : (Array.isArray(plan.surfaces) ? plan.surfaces : []);
    const surfaceById = new Map(surfaces.filter(Boolean).map((surface) => [String(surface.id || ''), surface]));
    root.querySelectorAll('[data-maraca-surface]').forEach((element) => {
      const surface = surfaceById.get(String(element.getAttribute && element.getAttribute('data-maraca-surface') || ''));
      if (!surface || !surface.source) return;
      const record = asRecord(Object.prototype.hasOwnProperty.call(selectors, surface.source) ? selectors[surface.source] : states[surface.source]);
      if (!Object.prototype.hasOwnProperty.call(record, 'hidden')) return;
      const hidden = record.hidden === true;
      if (typeof element.toggleAttribute === 'function') element.toggleAttribute('hidden', hidden);
      else if (hidden && typeof element.setAttribute === 'function') element.setAttribute('hidden', '');
      else if (!hidden && typeof element.removeAttribute === 'function') element.removeAttribute('hidden');
      if (!element.style) return;
      if (hidden) {
        element.style.display = 'none';
        if (typeof element.setAttribute === 'function') element.setAttribute('data-maraca-hidden-display', 'true');
      } else if (element.getAttribute && element.getAttribute('data-maraca-hidden-display') === 'true') {
        element.style.display = '';
        if (typeof element.removeAttribute === 'function') element.removeAttribute('data-maraca-hidden-display');
      }
    });
  }

  function surfaceRecord(snapshot, surface) {
    const current = asRecord(snapshot);
    const selectors = asRecord(current.selectors);
    const states = asRecord(current.states);
    return asRecord(Object.prototype.hasOwnProperty.call(selectors, surface.source) ? selectors[surface.source] : states[surface.source]);
  }

  function surfaceElement(surfaceId) {
    if (typeof root.querySelectorAll !== 'function') return null;
    return Array.from(root.querySelectorAll('[data-maraca-surface]')).find((element) => (
      element && typeof element.getAttribute === 'function' && element.getAttribute('data-maraca-surface') === surfaceId
    )) || null;
  }

  async function runTransitionSurfaces(transition, surfaceIds, nextHidden, stateSnapshot, metadata) {
    if (!transition || !runtimes.transitions || typeof runtimes.transitions.applyVisibilityPatch !== 'function') return [];
    const surfaces = Array.isArray(artifact.surfaces) ? artifact.surfaces : [];
    const surfaceById = new Map(surfaces.filter(Boolean).map((surface) => [surface.id, surface]));
    const work = surfaceIds.map((surfaceId) => {
      const surface = surfaceById.get(surfaceId);
      const element = surfaceElement(surfaceId);
      if (!surface || !element) return null;
      const record = surfaceRecord(stateSnapshot, surface);
      const stateHidden = Object.prototype.hasOwnProperty.call(record, 'hidden') ? record.hidden === true : null;
      if (nextHidden && stateHidden === true) return null;
      if (!nextHidden && stateHidden !== false) return null;
      return runtimes.transitions.applyVisibilityPatch({
        transition,
        surface: surfaceId,
        element,
        previousHidden: !nextHidden,
        nextHidden,
        action: metadata.action,
        metadata
      });
    }).filter(Boolean);
    return Promise.all(work);
  }

  function render() {
    const descriptor = asRecord(artifact.render).root || { type: 'fragment', children: [] };
    const context = runtimes.state && typeof runtimes.state.createRenderContext === 'function'
      ? runtimes.state.createRenderContext({ components: componentTags().map((tag) => ({ id: tag, tag })) })
      : { model: clone(plan.state, {}) };
    const report = runtimes.renderer.render(root, descriptor, context);
    syncSurfaceVisibility();
    renderCount += 1;
    if (runtimes.events && typeof runtimes.events.detachAll === 'function') runtimes.events.detachAll();
    if (runtimes.events && typeof runtimes.events.attach === 'function') runtimes.events.attach(root);
    publish('render', { renderCount });
    return report;
  }

  async function dispatchCommand(command, payload = {}, metadata = {}) {
    if (phase !== 'ready') throw new Error('Maraca plan runtime is not booted.');
    const commandId = typeof command === 'string' ? command : String(command && (command.id || command.action) || '');
    if (!commandId) throw new TypeError('dispatchCommand() requires a command id.');
    const run = async () => {
      if (runtimes.validation && typeof runtimes.validation.validateAction === 'function') {
        const validation = await runtimes.validation.validateAction(commandId, { ...metadata, report: true, reveal: true });
        if (validation && validation.valid === false) return { status: 'blocked', command: commandId, validation };
      }
      const result = runtimes.action && typeof runtimes.action.runAction === 'function'
        ? await runtimes.action.runAction(commandId, clone(payload, {}), metadata)
        : await Promise.resolve(hostServices.dispatchCommand ? hostServices.dispatchCommand(commandId, payload, metadata) : { status: 'success', data: payload });
      const reducers = (Array.isArray(asRecord(artifact.state).reducers) ? asRecord(artifact.state).reducers : []).filter((entry) => entry && entry.action === commandId && entry.state);
      const transition = runtimes.transitions && typeof runtimes.transitions.findTransition === 'function'
        ? runtimes.transitions.findTransition({ action: commandId })
        : null;
      const transitionMetadata = { ...metadata, action: commandId };
      const previousSnapshot = runtimes.state.snapshot();
      if (transition) await runTransitionSurfaces(transition, transition.from || [], true, previousSnapshot, transitionMetadata);
      renderSuspended += 1;
      try {
        reducers.forEach((reducer) => {
          const value = reducerValue(reducer.value, payload, result && result.data || result);
          if (!reducer.path) runtimes.state.setState(reducer.state, value, { operation: 'maraca.reducer', action: commandId, reducer: reducer.id });
          else {
            const next = clone(runtimes.state.getState(reducer.state), {});
            runtimes.state.setState(reducer.state, writePath(next, reducer.path, value), { operation: 'maraca.reducer', action: commandId, reducer: reducer.id });
          }
        });
      } finally {
        renderSuspended -= 1;
      }
      if (reducers.length > 0) render();
      if (transition) await runTransitionSurfaces(transition, transition.to || [], false, runtimes.state.snapshot(), transitionMetadata);
      publish('command', { command: commandId, status: result && result.status || 'success' });
      return result;
    };
    return runtimes.kernel.scheduleWork('action', run, { command: commandId, ...metadata });
  }

  async function boot() {
    if (phase === 'ready') return runtime;
    if (phase === 'booting') return bootPromise;
    phase = 'booting';
    generation += 1;
    bootPromise = (async () => {
      const api = await resolveModules();
      await ensureComponents();
      const rendererFactory = runtimeFactory(api.renderer, 'createRmtDomDescriptorRenderer');
      const stateFactory = runtimeFactory(api.state, 'createRmtStateSelectorRuntime');
      if (!rendererFactory || !stateFactory) throw new Error('The plan requires the official RMT state and DOM descriptor runtimes.');
      const state = stateFactory({
        states: asRecord(artifact.state).states || [], selectors: asRecord(artifact.state).selectors || [],
        reducers: asRecord(artifact.state).reducers || [], initialState: asRecord(plan.state)
      });
      const kernel = createKernel(api.kernel);
      const actionFactory = runtimeFactory(api.action, 'createRmtActionEffectRuntime');
      const transitionFactory = runtimeFactory(api.transitions, 'createRmtSurfaceTransitionRuntime');
      const validationFactory = runtimeFactory(api.validation, 'createRmtFormValidationRuntime');
      const eventFactory = runtimeFactory(api.events, 'createRmtEventRoutingRuntime');
      const action = actionFactory ? actionFactory({
        actions: asRecord(artifact.actions).actions || [], dataSources: asRecord(artifact.actions).dataSources || [],
        effects: asRecord(artifact.actions).effects || [], resources: artifact.resources || [], stateRuntime: state,
        hostServices
      }) : null;
      const transitions = transitionFactory && asRecord(plan.transitions).enabled ? transitionFactory({
        transitionPlan: asRecord(plan.transitions).artifact, root, kernelController: kernel,
        xUtils: options.xUtils, xstate: options.xstate, windowTarget: options.windowTarget || globalThis,
        diagnostics: asRecord(plan.transitions).diagnostics || [], strict: asRecord(plan.transitions).strict === true
      }) : null;
      const validation = validationFactory && asRecord(plan.validation).enabled ? validationFactory({
        validationPlan: asRecord(plan.validation).artifact, stateRuntime: state, root,
        windowTarget: options.windowTarget || globalThis, diagnostics: asRecord(plan.validation).diagnostics || []
      }) : null;
      const actionFacade = Object.freeze({
        runAction: (id, payload, metadata) => dispatchCommand(id, payload, metadata),
        cancelAction: (id) => action && action.cancelAction ? action.cancelAction(id) : { status: 'cancelled', action: id }
      });
      const events = eventFactory ? eventFactory({ events: artifact.events || [], actionRuntime: actionFacade, root }) : null;
      runtimes = { state, kernel, action, transitions, validation, events, renderer: rendererFactory({ documentTarget: options.documentTarget || root.ownerDocument, trustedDom: options.trustedDom }) };
      if (state && typeof state.subscribe === 'function') {
        const unsubscribe = state.subscribe((event) => {
          publish('state', { event });
          if (phase === 'ready' && renderSuspended === 0) render();
          if (runtimes.validation && typeof runtimes.validation.refresh === 'function') runtimes.validation.refresh({ reason: 'state-change' });
        });
        if (typeof unsubscribe === 'function') disposers.add(unsubscribe);
      }
      render();
      phase = 'ready';
      if (options.componentRegistry && typeof options.componentRegistry.hydrate === 'function') {
        await options.componentRegistry.hydrate(root, componentTags());
        syncSurfaceVisibility();
      }
      publish('ready');
      return runtime;
    })().catch((error) => {
      phase = 'failed';
      diagnostics.push({ code: 'maraca.plan-runtime.boot-failed', severity: 'error', message: error.message });
      publish('diagnostic', { diagnostic: diagnostics[diagnostics.length - 1] });
      throw error;
    });
    return bootPromise;
  }

  function snapshot() {
    return clone({
      schema: PLAN_RUNTIME_SCHEMA, phase, generation, renderCount, diagnostics,
      state: runtimes && runtimes.state && runtimes.state.snapshot ? runtimes.state.snapshot() : null,
      kernel: runtimes && runtimes.kernel && runtimes.kernel.snapshot ? runtimes.kernel.snapshot() : null,
      validation: Boolean(runtimes && runtimes.validation), transitions: Boolean(runtimes && runtimes.transitions)
    }, {});
  }

  function dispose() {
    if (phase === 'disposed') return;
    generation += 1;
    [...disposers].forEach((dispose) => { try { dispose(); } catch (_) {} });
    disposers.clear();
    if (runtimes) Object.values(runtimes).forEach((entry) => { if (entry && typeof entry.dispose === 'function') entry.dispose(); });
    subscriptions.clear();
    root.replaceChildren();
    phase = 'disposed';
  }

  let bootPromise = null;
  const runtime = Object.freeze({
    schema: PLAN_RUNTIME_SCHEMA, boot, dispatchCommand, snapshot, dispose,
    subscribe(listener) { if (typeof listener !== 'function') return () => {}; subscriptions.add(listener); return () => subscriptions.delete(listener); }
  });
  return runtime;
}

export async function bootMaracaPlan(options = {}) {
  const runtime = createMaracaPlanRuntime(options);
  await runtime.boot();
  return runtime;
}

export { PLAN_RUNTIME_SCHEMA };
export default Object.freeze({ PLAN_RUNTIME_SCHEMA, createMaracaPlanRuntime, bootMaracaPlan });
