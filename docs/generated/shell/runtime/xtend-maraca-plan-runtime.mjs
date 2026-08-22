const PLAN_RUNTIME_SCHEMA = 'xtend.maraca.plan-runtime.v2';
const DOM_COMMIT_SCHEMA = 'xtend.rmt.dom-commit-result.v1';
const DOM_COMMIT_EVENT = 'xtend-maraca:dom-commit';
const SYSTEM_REFRESH_COMMAND = 'xtend.system.refresh';

function clone(value, fallback = null) {
  if (value == null || typeof value !== 'object') return value == null ? fallback : value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function immutableClone(value, fallback = null) {
  const cloned = clone(value, fallback);
  const seen = new WeakSet();
  const freeze = (entry) => {
    if (!entry || typeof entry !== 'object' || seen.has(entry)) return entry;
    seen.add(entry);
    Object.values(entry).forEach(freeze);
    return Object.freeze(entry);
  };
  return freeze(cloned);
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
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
    else {
      if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) cursor[part] = {};
      cursor = cursor[part];
    }
  });
  return source;
}

function stableValue(value) {
  try { return JSON.stringify(value); } catch (_) { return String(value); }
}

function diffKeys(previous, next) {
  const before = asRecord(previous);
  const after = asRecord(next);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => stableValue(before[key]) !== stableValue(after[key]));
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

const VISIBILITY_ATTRIBUTES = new Set(['hidden', 'data-rmt-hidden-display', 'data-xt-surface-transitioning']);
const VALIDATION_ATTRIBUTES = new Set(['invalid', 'aria-invalid', 'aria-errormessage', 'aria-describedby', 'data-rmt-invalid', 'data-validation-message']);
const VISIBILITY_STYLES = new Set([
  'display',
  'visibility',
  'pointer-events',
  'opacity',
  'transform',
  'transform-origin',
  'transition',
  'filter',
  'will-change'
]);

function descriptorForOwners(descriptor, reservations = {}) {
  if (Array.isArray(descriptor)) return descriptor.map((entry) => descriptorForOwners(entry, reservations));
  if (!descriptor || typeof descriptor !== 'object') return descriptor;
  const next = { ...descriptor };
  if (descriptor.attributes && typeof descriptor.attributes === 'object' && !Array.isArray(descriptor.attributes)) {
    next.attributes = {};
    Object.entries(descriptor.attributes).forEach(([name, value]) => {
      const normalized = String(name).toLowerCase();
      if (reservations.visibility && VISIBILITY_ATTRIBUTES.has(normalized)) return;
      if (reservations.validation && VALIDATION_ATTRIBUTES.has(normalized)) return;
      if (normalized === 'style' && value && typeof value === 'object' && !Array.isArray(value)) {
        next.attributes['style'] = Object.fromEntries(Object.entries(value).filter(([styleName]) => (
          !reservations.visibility || !VISIBILITY_STYLES.has(String(styleName).toLowerCase())
        )));
        return;
      }
      next.attributes[name] = value;
    });
  }
  if (reservations.events) delete next.events;
  ['children', 'descriptors', 'nodes'].forEach((key) => {
    if (Array.isArray(descriptor[key])) next[key] = descriptor[key].map((entry) => descriptorForOwners(entry, reservations));
  });
  ['child', 'content', 'fallback', 'then', 'else', 'empty', 'template', 'itemTemplate', 'node', 'descriptor'].forEach((key) => {
    if (descriptor[key] && typeof descriptor[key] === 'object') next[key] = descriptorForOwners(descriptor[key], reservations);
  });
  if (descriptor.slots && typeof descriptor.slots === 'object' && !Array.isArray(descriptor.slots)) {
    next.slots = Object.fromEntries(Object.entries(descriptor.slots).map(([name, value]) => [
      name,
      descriptorForOwners(value, reservations)
    ]));
  }
  return next;
}

export function createMaracaPlanRuntime(inputOptions = {}) {
  const options = Object.freeze({ ...asRecord(inputOptions) });
  const plan = immutableClone(asRecord(options.plan), {});
  const normalizedInitialState = immutableClone(asRecord(options.initialState || plan.state), {});
  const normalizedStreamLifecycleActions = immutableClone(asRecord(options.streamLifecycleActions), {});
  const root = options.root;
  const hostServices = Object.freeze({ ...asRecord(options.hostServices) });
  let hostServiceRegistry = options.hostServiceRegistry || (typeof options.hostServices?.invoke === 'function' ? options.hostServices : null);
  const dataSourceAdapters = Object.freeze({ ...asRecord(options.dataSourceAdapters) });
  const orchestration = asRecord(plan.orchestration);
  const artifact = asRecord(orchestration.artifact || plan.artifact);
  const strict = orchestration.strict === true || orchestration.mode === 'strict';
  const surfaces = asArray(artifact.surfaces).length ? asArray(artifact.surfaces) : asArray(plan.surfaces);
  const declaredActions = asArray(asRecord(artifact.actions).actions);
  const declaredEvents = asArray(artifact.events);
  const declaredPortals = asArray(artifact.portals).length ? asArray(artifact.portals) : asArray(plan.portals);
  const declaredOverlays = asArray(artifact.overlays).length ? asArray(artifact.overlays) : asArray(plan.overlays);
  const transitionsEnabled = asRecord(plan.transitions).enabled === true;
  const requiresActionController = declaredActions.length > 0;
  const requiresEventRouter = declaredEvents.length > 0;
  const requiresSurfaceLifecycle = surfaces.length + declaredPortals.length + declaredOverlays.length > 0;
  const surfaceById = new Map(surfaces.filter(Boolean).map((surface) => [String(surface.id || ''), surface]));
  const surfaceIdsBySource = new Map();
  surfaces.forEach((surface) => {
    const source = String(surface && (surface.source && (surface.source.target || surface.source.ref) || surface.source) || '');
    const surfaceId = String(surface && surface.id || '');
    if (!source || !surfaceId) return;
    sourceCandidates(source).forEach((candidate) => {
      const ids = surfaceIdsBySource.get(candidate) || [];
      ids.push(surfaceId);
      surfaceIdsBySource.set(candidate, ids);
    });
  });

  const diagnostics = [];
  const diagnosticCodes = new Set();
  const subscriptions = new Set();
  const modelSubscriptions = new Set();
  const disposers = new Set();
  const capturedDisposableObjects = new WeakSet();
  const projectedSurfaceVisibility = new Map();
  let generation = 0;
  let phase = 'created';
  let modules = null;
  let runtimes = null;
  let bootPromise = null;
  let renderCount = 0;
  let commitCount = 0;
  let stateCommitCount = 0;
  let lastCommit = null;
  let lastCommitReport = null;
  let lastPublishedEvent = null;
  let activeStateBuffer = null;
  let adaptersDisposed = false;
  let ownsKernel = false;
  let ownsHostServiceRegistry = false;
  let ownsResourceManager = false;
  let ownsSurfaceController = false;
  let ownsPresentationEffectPort = false;
  let ownsViewProjectionPort = false;
  let viewProjectionPort = options.viewProjectionPort || options.viewAdapter || null;
  let commandQueue = Promise.resolve();
  const pendingScheduledWork = new Set();
  let resolveDisposed;
  const disposedSignal = new Promise((resolve) => { resolveDisposed = resolve; });

  function raceDisposed(promise) {
    return Promise.race([
      promise,
      disposedSignal.then((error) => Promise.reject(error))
    ]);
  }

  const reservedOwners = Object.freeze({
    visibility: asRecord(plan.transitions).enabled === true,
    validation: asRecord(plan.validation).enabled === true,
    events: asArray(artifact.events).length > 0
  });
  const ownership = Object.freeze({
    mode: strict ? 'strict' : 'compatibility',
    domains: Object.freeze({
      visibility: reservedOwners.visibility ? 'transition-runtime' : 'descriptor-renderer',
      validation: reservedOwners.validation ? 'validation-runtime' : 'descriptor-renderer',
      events: reservedOwners.events ? 'event-router' : 'descriptor-renderer'
    })
  });

  function projectDescriptor(descriptor) {
    const projected = typeof options.projectDescriptor === 'function'
      ? options.projectDescriptor(descriptor, {
          ownership,
          reservations: reservedOwners,
          strict
        })
      : descriptorForOwners(descriptor, reservedOwners);
    return projected == null ? { type: 'fragment', children: [] } : projected;
  }

  function publish(type, detail = {}) {
    const event = Object.freeze({ schema: PLAN_RUNTIME_SCHEMA, type, generation, ...clone(detail, {}) });
    lastPublishedEvent = event;
    const runtimeSnapshot = snapshot();
    subscriptions.forEach((listener) => { try { listener(runtimeSnapshot); } catch (_) {} });
    return event;
  }

  function recordDiagnostic(code, severity, message, details = {}, once = false) {
    if (once && diagnosticCodes.has(code)) return diagnostics.find((entry) => entry.code === code) || null;
    diagnosticCodes.add(code);
    const diagnostic = Object.freeze({
      schema: 'xtend.maraca.plan-runtime-diagnostic.v1',
      code,
      severity,
      message,
      ...clone(details, {})
    });
    diagnostics.push(diagnostic);
    publish('diagnostic', { diagnostic });
    return diagnostic;
  }

  function recordLegacyAdapter(alias) {
    return recordDiagnostic(
      'xtend.maraca.mvc.legacy-adapter',
      'info',
      'A deprecated Maraca runtime adapter was accessed. Use the application-controller facade and its read-only model port.',
      { alias, removal: '0.7.0' },
      true
    );
  }

  const transitionStatePort = options.transitionStatePort || Object.freeze({
    schema: 'xtend.maraca.transition-state-port.v1',
    apply(projection) {
      publish('transition-state', { projection: immutableClone(projection, {}) });
      return immutableClone(projection, {});
    },
    publish(projection) {
      publish('transition-state', { projection: immutableClone(projection, {}) });
      return immutableClone(projection, {});
    }
  });

  function captureDisposer(value) {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(captureDisposer);
      return;
    }
    if (typeof value === 'function') {
      if (phase === 'disposed') {
        try { value(); } catch (_) {}
      } else {
        disposers.add(value);
      }
      return;
    }
    if (typeof value.dispose === 'function') {
      if (capturedDisposableObjects.has(value)) return;
      capturedDisposableObjects.add(value);
      const dispose = () => value.dispose();
      if (phase === 'disposed') {
        try { dispose(); } catch (_) {}
      } else {
        disposers.add(dispose);
      }
    }
  }

  function dispatchDomEvent(name, detail) {
    return Boolean(viewProjectionPort
      && typeof viewProjectionPort.dispatchHostEvent === 'function'
      && viewProjectionPort.dispatchHostEvent(name, detail));
  }

  function viewDocumentTarget() {
    return viewProjectionPort && typeof viewProjectionPort.getDocumentTarget === 'function'
      ? viewProjectionPort.getDocumentTarget()
      : options.documentTarget || null;
  }

  function viewChildNodes(target = root) {
    return viewProjectionPort && typeof viewProjectionPort.readChildNodes === 'function'
      ? viewProjectionPort.readChildNodes(target)
      : [];
  }

  function validateViewProjectionPort(port) {
    const requiredMethods = [
      'validateRoot',
      'getDocumentTarget',
      'readChildNodes',
      'reindexSurfaces',
      'resolveSurface',
      'resolveTarget',
      'resolveBindingTarget',
      'dispatchHostEvent',
      'clearOwnedDom'
    ];
    if (!port || requiredMethods.some((method) => typeof port[method] !== 'function')) {
      const error = new Error('The Maraca View Projection Port does not implement the complete host projection contract.');
      error.code = 'xtend.maraca.mvc.view-projection-port-invalid';
      throw error;
    }
    port.validateRoot();
    return port;
  }

  async function resolveModules() {
    if (modules) return modules;
    if (options.moduleApis && typeof options.moduleApis === 'object') {
      modules = options.moduleApis;
    } else if (options.moduleLoaderPort && typeof options.moduleLoaderPort.load === 'function') {
      modules = await options.moduleLoaderPort.load(plan, asArray(options.moduleUrls));
    } else if (typeof options.loadModules === 'function') {
      modules = await options.loadModules(plan);
    } else {
      const error = new Error('Maraca requires an injected Runtime Module Loader port or explicit ESM module APIs.');
      error.code = 'xtend.maraca.mvc.module-loader-port-missing';
      throw error;
    }
    return Object.freeze({ ...asRecord(modules) });
  }

  function createMicrotaskKernel() {
    recordDiagnostic(
      'maraca.plan-runtime.scheduler-fallback',
      'info',
      'No kernel scheduler is available; the plan runtime uses one microtask queue.',
      {},
      true
    );
    ownsKernel = true;
    return Object.freeze({
      schema: 'xtend.maraca.plan-runtime.inline-kernel.v1',
      scheduleWork(_lane, work) { return Promise.resolve().then(work); },
      snapshot() { return { schema: this.schema, status: 'ready', fallback: 'microtask' }; },
      dispose() {}
    });
  }

  function createKernel(api, kernelApi = null) {
    const kernelPlan = asRecord(plan.kernel);
    const requiresKernelScheduler = strict && kernelPlan.enabled === true;
    const failMissingKernel = () => {
      const error = new Error('Strict Maraca kernel plans require the injected Host Scheduler controller.');
      error.code = 'xtend.maraca.mvc.kernel-scheduler-port-missing';
      throw error;
    };
    if (options.kernelController) {
      if (requiresKernelScheduler && typeof options.kernelController.scheduleWork !== 'function') {
        return failMissingKernel();
      }
      ownsKernel = false;
      return options.kernelController;
    }
    const factory = runtimeFactory(api, 'createRmtKernelOrchestrationController');
    if (factory) {
      ownsKernel = true;
      const controller = factory({
        kernelApi: options.kernelApi || options.kernelRuntimeApi || kernelApi,
        fabric: options.fabric,
        hostServices,
        diagnostics,
        plan: kernelPlan,
        artifact: kernelPlan.artifact,
        strict,
        scheduler: options.scheduler,
        hostScheduler: options.hostScheduler,
        schedulerTarget: options.schedulerTarget,
        hostAdapter: options.kernelHostAdapter || options.hostAdapter,
        windowTarget: options.windowTarget || null,
        documentTarget: viewDocumentTarget()
      });
      if (controller && typeof controller.boot === 'function') controller.boot();
      if (controller
        && controller.schema === 'xtend.rmt.kernel-orchestration-controller.v1'
        && !controller.schedulerBridge
        && controller.status !== 'booted') {
        if (typeof controller.dispose === 'function') controller.dispose();
        if (requiresKernelScheduler) return failMissingKernel();
        return createMicrotaskKernel();
      }
      if (requiresKernelScheduler && (!controller || typeof controller.scheduleWork !== 'function')) {
        if (controller && typeof controller.dispose === 'function') controller.dispose();
        return failMissingKernel();
      }
      return controller;
    }
    if (requiresKernelScheduler) return failMissingKernel();
    return createMicrotaskKernel();
  }

  function componentTags(surfaceIds = null) {
    const selected = asRecord(plan.components).selected;
    const scopedSurfaces = surfaceIds instanceof Set
      ? surfaces.filter((surface) => surface && surfaceIds.has(String(surface.id || '')))
      : surfaces;
    const tags = [
      ...(surfaceIds instanceof Set
        ? []
        : (Array.isArray(selected) ? selected.map((entry) => entry && entry.tag) : [])),
      ...scopedSurfaces.map((entry) => entry && entry.component)
    ];
    return [...new Set(tags.map((tag) => String(tag || '').toLowerCase()).filter(Boolean))];
  }

  async function ensureComponents() {
    if (options.ensureComponentsOnBoot === false) return componentTags();
    const registry = options.componentRegistry;
    const tags = componentTags();
    let result = null;
    if (registry && typeof registry.ensureTags === 'function') result = await registry.ensureTags(tags);
    else if (registry && typeof registry.ensure === 'function') result = await Promise.all(tags.map((tag) => registry.ensure(tag)));
    captureDisposer(result);
    return tags;
  }

  function reindexSurfaces() {
    return viewProjectionPort && typeof viewProjectionPort.reindexSurfaces === 'function'
      ? viewProjectionPort.reindexSurfaces()
      : null;
  }

  function surfaceElement(surfaceId) {
    return viewProjectionPort && typeof viewProjectionPort.resolveSurface === 'function'
      ? viewProjectionPort.resolveSurface(String(surfaceId || ''))
      : null;
  }

  function materializeSurfaces(stateSnapshot = null, metadata = {}) {
    const surfaceGraph = runtimes && runtimes.surfaceGraph;
    if (!surfaceGraph || typeof surfaceGraph.materialize !== 'function') return null;
    const snapshot = stateSnapshot || (runtimes.state && typeof runtimes.state.snapshot === 'function'
      ? runtimes.state.snapshot()
      : {});
    const records = {};
    const addRecords = (values, prefixes) => {
      Object.entries(asRecord(values)).forEach(([id, value]) => {
        if (!hasOwn(records, id)) records[id] = value;
        prefixes.forEach((prefix) => { records[`${prefix}${id}`] = value; });
      });
    };
    addRecords(snapshot.states, ['state.']);
    addRecords(snapshot.derived, ['derive.', 'derived.']);
    addRecords(snapshot.selectors, ['selector.']);
    const report = surfaceGraph.materialize(records, {
      operation: metadata.operation || 'maraca.surface.materialize',
      correlationId: metadata.correlationId || ''
    });
    publish('surface', { report, metadata });
    return report;
  }

  function sourceCandidates(source) {
    const value = String(source && (source.target || source.ref) || source || '');
    const candidates = [value];
    if (value.startsWith('selector.')) candidates.push(value.slice(9));
    if (value.startsWith('derive.')) candidates.push(value.slice(7));
    if (value.startsWith('derived.')) candidates.push(value.slice(8));
    if (value.startsWith('state.')) candidates.push(value.slice(6));
    return [...new Set(candidates.filter(Boolean))];
  }

  function surfaceRecord(snapshot, surface) {
    const current = asRecord(snapshot);
    const selectors = asRecord(current.selectors);
    const derived = asRecord(current.derived);
    const states = asRecord(current.states);
    const candidates = sourceCandidates(surface && surface.source);
    for (const candidate of candidates) if (hasOwn(selectors, candidate)) return asRecord(selectors[candidate]);
    for (const candidate of candidates) if (hasOwn(derived, candidate)) return asRecord(derived[candidate]);
    for (const candidate of candidates) if (hasOwn(states, candidate)) return asRecord(states[candidate]);
    for (const candidate of candidates) {
      const value = readPath(current.model, candidate);
      if (value && typeof value === 'object') return asRecord(value);
    }
    return {};
  }

  function surfaceHidden(snapshot, surface) {
    const record = surfaceRecord(snapshot, surface);
    return hasOwn(record, 'hidden') ? record.hidden === true : null;
  }

  async function applyProjectedVisibility(input) {
    const result = await runtimes.transitions.applyVisibilityPatch(input);
    projectedSurfaceVisibility.set(String(input.surface || ''), input.nextHidden === true);
    return result;
  }

  async function runTransitionSurfaces(transition, surfaceIds, nextHidden, previousSnapshot, nextSnapshot, metadata) {
    if (!transition || !runtimes.transitions || typeof runtimes.transitions.applyVisibilityPatch !== 'function') return [];
    const work = asArray(surfaceIds).map((surfaceId) => {
      const surface = surfaceById.get(String(surfaceId));
      const element = surfaceElement(surfaceId);
      if (!surface || !element) return null;
      const previousHidden = surfaceHidden(previousSnapshot, surface);
      const modelNextHidden = surfaceHidden(nextSnapshot, surface);
      if (modelNextHidden !== null && modelNextHidden !== nextHidden) return null;
      if (previousHidden === nextHidden) {
        projectedSurfaceVisibility.set(String(surfaceId), nextHidden);
        return null;
      }
      return applyProjectedVisibility({
        transition,
        surface: String(surfaceId),
        element,
        previousHidden: previousHidden === null
          ? (projectedSurfaceVisibility.has(String(surfaceId))
              ? projectedSurfaceVisibility.get(String(surfaceId))
              : !nextHidden)
          : previousHidden,
        nextHidden,
        action: metadata.action,
        metadata
      });
    }).filter(Boolean);
    return Promise.all(work);
  }

  async function syncOwnedVisibility(stateSnapshot, surfaceIds = null, metadata = {}, previousSnapshot = null) {
    if (!reservedOwners.visibility || !runtimes.transitions || typeof runtimes.transitions.applyVisibilityPatch !== 'function') return [];
    const scoped = surfaceIds instanceof Set
      ? surfaces.filter((surface) => surface && surfaceIds.has(String(surface.id || '')))
      : surfaces;
    return Promise.all(scoped.map((surface) => {
      const element = surfaceElement(surface && surface.id);
      const record = surfaceRecord(stateSnapshot, surface);
      if (!element || !hasOwn(record, 'hidden')) return null;
      const surfaceId = String(surface.id || '');
      const nextHidden = record.hidden === true;
      const modelPreviousHidden = previousSnapshot ? surfaceHidden(previousSnapshot, surface) : null;
      const previousHidden = modelPreviousHidden === null
        ? (projectedSurfaceVisibility.has(surfaceId) ? projectedSurfaceVisibility.get(surfaceId) : false)
        : modelPreviousHidden;
      return applyProjectedVisibility({
        surface: surfaceId,
        element,
        previousHidden,
        nextHidden,
        action: metadata.action || '',
        metadata: { ...metadata, phase: metadata.phase || 'visibility-sync' }
      });
    }).filter(Boolean));
  }

  function createRenderContext(metadata = {}, stateSnapshot = null) {
    const trustedDomRenderer = options.trustedDomRenderer || options.trustedDom;
    const extra = {
      components: componentTags().map((tag) => ({ id: tag, tag })),
      componentRegistry: options.componentRegistry,
      trustedDomRenderer,
      metadata: clone(metadata, {})
    };
    if (stateSnapshot) {
      return {
        ...extra,
        model: clone(stateSnapshot.model, {}),
        selectorValues: clone(stateSnapshot.selectors, {}),
        derivedValues: clone(stateSnapshot.derived, {})
      };
    }
    return runtimes.state && typeof runtimes.state.createRenderContext === 'function'
      ? runtimes.state.createRenderContext(extra)
      : { ...extra, model: clone(plan.state, {}) };
  }

  function normalizeRendererReport(report, request, defaults = {}) {
    const value = asRecord(report);
    const nodes = Array.isArray(value.nodes)
      ? value.nodes
      : (request.operation === 'replace-children' ? viewChildNodes(request.target) : []);
    return {
      schema: value.schema || DOM_COMMIT_SCHEMA,
      operation: value.operation || request.operation,
      target: hasOwn(value, 'target') ? value.target : request.target || null,
      nodes,
      nodeCount: Number.isInteger(value.nodeCount) ? value.nodeCount : nodes.length,
      changed: typeof value.changed === 'boolean' ? value.changed : defaults.changed !== false,
      structural: typeof value.structural === 'boolean' ? value.structural : defaults.structural === true,
      diagnostics: asArray(value.diagnostics),
      metadata: clone(value.metadata, clone(request.context && request.context.metadata, null))
    };
  }

  function legacyFullRender(request, metadata = {}) {
    if (strict) {
      throw new Error('Strict Maraca requires renderer.commit().');
    }
    if (!runtimes.renderer || typeof runtimes.renderer.render !== 'function') {
      throw new Error('The DOM descriptor renderer exposes neither commit() nor the compatibility render() API.');
    }
    recordDiagnostic(
      'rmt.dom.legacy-commit-fallback',
      'warning',
      'The shared DOM renderer has no commit() API; compatibility mode uses a full render.',
      {},
      true
    );
    const report = runtimes.renderer.render(request.target, request.descriptor, request.context);
    return normalizeRendererReport(report, request, { changed: true, structural: true, metadata });
  }

  function rendererCommit(request, metadata = {}) {
    if (runtimes.renderer && typeof runtimes.renderer.commit === 'function') {
      return normalizeRendererReport(runtimes.renderer.commit(request), request, {
        changed: true,
        structural: request.operation === 'replace-children'
      });
    }
    return legacyFullRender({
      operation: 'replace-children',
      target: root,
      descriptor: projectDescriptor(
        asRecord(artifact.render).root || { type: 'fragment', children: [] }
      ),
      context: createRenderContext(metadata),
      ownership
    }, metadata);
  }

  function fullRender(metadata = {}, stateSnapshot = null, validationStage = null) {
    const descriptor = descriptorForCommit(
      asRecord(artifact.render).root || { type: 'fragment', children: [] },
      validationStage
    );
    const report = rendererCommit({
      operation: 'replace-children',
      target: root,
      descriptor,
      context: createRenderContext(metadata, stateSnapshot),
      ownership: ownershipForCommit(validationStage)
    }, metadata);
    renderCount += 1;
    reindexSurfaces();
    return report;
  }

  function safeCommitSummary(report) {
    return immutableClone({
      schema: report.schema || DOM_COMMIT_SCHEMA,
      operation: report.operation || 'reconcile-element',
      nodeCount: Number(report.nodeCount) || 0,
      changed: report.changed === true,
      structural: report.structural === true,
      diagnostics: clone(asArray(report.diagnostics), []),
      metadata: clone(report.metadata, {})
    }, {});
  }

  function recordDomCommit(report, metadata = {}) {
    commitCount += 1;
    if (metadata.stateCommit === true) stateCommitCount += 1;
    lastCommit = safeCommitSummary({
      ...report,
      metadata: {
        ...clone(report.metadata, {}),
        ...clone(metadata, {}),
        commit: commitCount,
        stateCommit: metadata.stateCommit === true,
        stateCommitCount
      }
    });
    lastCommitReport = report;
    publish(DOM_COMMIT_EVENT, { commit: lastCommit });
    dispatchDomEvent(DOM_COMMIT_EVENT, lastCommit);
    return report;
  }

  function reconcileEvents(commitReport) {
    const events = runtimes && runtimes.events;
    if (!events) return null;
    if (typeof events.reconcile === 'function') return events.reconcile(root, commitReport);
    recordDiagnostic(
      'rmt.events.legacy-reconcile-fallback',
      'info',
      'The event runtime has no reconcile() API; compatibility attachment is used.',
      {},
      true
    );
    if (typeof events.detachAll === 'function') events.detachAll();
    return typeof events.attach === 'function' ? events.attach(root) : null;
  }

  function attachEvents(commitReport = lastCommitReport) {
    const report = commitReport || {
      schema: DOM_COMMIT_SCHEMA,
      operation: 'reconcile-children',
      target: root,
      nodes: viewChildNodes(root),
      nodeCount: viewChildNodes(root).length,
      changed: false,
      structural: false,
      diagnostics: [],
      metadata: { operation: 'maraca.events.attach' }
    };
    return reconcileEvents(report);
  }

  async function hydrate(surfaceIds = null, metadata = {}) {
    const registry = options.componentRegistry;
    if (!registry || typeof registry.hydrate !== 'function') return null;
    const result = await registry.hydrate(root, componentTags(surfaceIds), metadata);
    captureDisposer(result);
    return result;
  }

  async function runDeferredPlanEffects(actionResult, context = {}) {
    const effects = asArray(actionResult && actionResult.postCommitEffects).length
      ? asArray(actionResult.postCommitEffects)
      : asArray(actionResult && actionResult.effects);
    const deferred = effects.filter((entry) => entry && entry.value && entry.value.deferred === true);
    const results = [];
    for (const entry of deferred) {
      const effect = immutableClone(entry.value.effect || { id: entry.id, kind: entry.kind }, {});
      const declaredContext = asRecord(entry.value.context);
      const effectContext = immutableClone({
        schema: 'xtend.maraca.presentation-effect-context.v1',
        action: context.action || '',
        payload: context.payload || declaredContext.payload || {},
        result: actionResult && hasOwn(actionResult, 'data') ? actionResult.data : actionResult,
        actionResult,
        metadata: context.metadata || declaredContext.metadata || {},
        commitResult: context.commitResult || null,
        modelSnapshot: context.modelSnapshot || null,
        surfaceSnapshot: context.surfaceSnapshot || null,
        ownerId: declaredContext.ownerId || null,
        phase: 'after-render'
      }, {});
      const presentationEffectPort = runtimes && runtimes.presentationEffectPort;
      if (!presentationEffectPort || typeof presentationEffectPort.invoke !== 'function') {
        const diagnostic = recordDiagnostic(
          'xtend.maraca.mvc.presentation-port-missing',
          'error',
          'A deferred presentation effect cannot run without the PresentationEffectPort.',
          { effect: String(effect && (effect.id || effect.kind) || '') },
          true
        );
        if (strict) {
          const error = new Error(diagnostic.message);
          error.code = diagnostic.code;
          error.diagnostic = diagnostic;
          throw error;
        }
        results.push({ id: entry.id, kind: entry.kind, result: undefined });
        continue;
      }
      const result = await presentationEffectPort.invoke(effect, effectContext);
      const completedEntries = [
        entry,
        ...asArray(actionResult && actionResult.effects).filter((candidate) => (
          candidate
          && candidate !== entry
          && candidate.id === entry.id
          && candidate.kind === entry.kind
        ))
      ];
      completedEntries.forEach((completedEntry) => {
        try {
          completedEntry.value.result = clone(result, result);
          completedEntry.value.deferred = false;
        } catch (_) {}
      });
      results.push({ id: entry.id, kind: entry.kind, result });
    }
    return results;
  }

  function planStatePatch(previousSnapshot, nextSnapshot, fallback = null) {
    if (runtimes.state && typeof runtimes.state.planPatch === 'function') {
      return runtimes.state.planPatch(previousSnapshot, nextSnapshot);
    }
    const previous = asRecord(previousSnapshot);
    const next = asRecord(nextSnapshot);
    const changedStates = diffKeys(previous.states, next.states);
    const changedSelectors = diffKeys(previous.selectors, next.selectors);
    const changedDerived = diffKeys(previous.derived, next.derived);
    const provided = asRecord(fallback);
    return {
      schema: 'xtend.epic18.rmt-state-patch-plan.v1',
      strategy: provided.strategy || (changedStates.length || changedSelectors.length || changedDerived.length ? 'rerender' : 'attribute-sync'),
      preserveDom: provided.preserveDom === true,
      structural: typeof provided.structural === 'boolean'
        ? provided.structural
        : changedStates.length + changedSelectors.length + changedDerived.length > 0,
      changedStates,
      changedSelectors,
      changedDerived,
      structuralStates: asArray(provided.structuralStates),
      structuralSelectors: asArray(provided.structuralSelectors),
      structuralDerived: asArray(provided.structuralDerived)
    };
  }

  function createActionModelReaderPort(stateRuntime) {
    const modelReader = stateRuntime.modelReader || stateRuntime.model || stateRuntime;
    return Object.freeze({
      schema: 'xtend.maraca.action-model-reader.v1',
      getState: (id) => modelReader.getState(id),
      select: (id, params) => modelReader.select(id, params),
      getSelectorValues: () => modelReader.getSelectorValues(),
      getDerivedValues: () => modelReader.getDerivedValues(),
      getRenderModel: () => typeof stateRuntime.getRenderModel === 'function'
        ? stateRuntime.getRenderModel()
        : asRecord(modelReader.snapshot()).model,
      createRenderContext: (extra) => typeof stateRuntime.createRenderContext === 'function'
        ? stateRuntime.createRenderContext(extra)
        : { ...asRecord(extra), model: asRecord(modelReader.snapshot()).model || {} },
      resolve: (expression, item, payload, params) => typeof stateRuntime.resolve === 'function'
        ? stateRuntime.resolve(expression, item, payload, params)
        : expression,
      snapshot: () => modelReader.snapshot(),
      subscribe() { return () => {}; }
    });
  }

  function transactionState(reducers, commandId, payload, actionResult, metadata, validationStage = null) {
    const modelCommandPort = runtimes.state && runtimes.state.modelCommandPort;
    if (!modelCommandPort || typeof modelCommandPort.apply !== 'function') {
      const error = new Error('Managed commands require the RMT Model command port.');
      error.code = 'xtend.maraca.mvc.model-command-port-missing';
      throw error;
    }
    const transactionMetadata = {
      operation: metadata.transactionOperation || 'maraca.command.transaction',
      action: commandId,
      reducerCount: reducers.length,
      correlationId: metadata.correlationId || ''
    };
    const previousSnapshot = runtimes.state.modelReader && typeof runtimes.state.modelReader.snapshot === 'function'
      ? runtimes.state.modelReader.snapshot()
      : runtimes.state.snapshot();
    const plannedModelOperations = asArray(actionResult && actionResult.modelOperations).map((operation) => clone(operation, operation));
    const modelOperations = plannedModelOperations.slice();
    let workingStates = clone(asRecord(previousSnapshot.states), {});

    if (plannedModelOperations.length > 0) {
      const planningFactory = runtimes.modelPlanningFactory;
      if (typeof planningFactory !== 'function') {
        const error = new Error('Managed commands require an isolated RMT Model planning factory.');
        error.code = 'xtend.maraca.mvc.model-planning-port-missing';
        throw error;
      }
      const planningRuntime = planningFactory({
        states: runtimes.state.stateDefinitions || [],
        selectors: runtimes.state.selectorDefinitions || [],
        derive: runtimes.state.derivedDefinitions || [],
        reducers: runtimes.state.reducers || [],
        initialState: workingStates,
        stateProjectionPort: null,
        strict: false
      });
      if (!planningRuntime.modelCommandPort || typeof planningRuntime.modelCommandPort.apply !== 'function') {
        const error = new Error('The isolated RMT Model planning runtime does not provide a command port.');
        error.code = 'xtend.maraca.mvc.model-planning-port-missing';
        throw error;
      }
      planningRuntime.modelCommandPort.apply(plannedModelOperations, {
        operation: 'maraca.command.preflight',
        action: commandId,
        correlationId: metadata.correlationId || ''
      });
      const projectedSnapshot = planningRuntime.modelReader && typeof planningRuntime.modelReader.snapshot === 'function'
        ? planningRuntime.modelReader.snapshot()
        : planningRuntime.snapshot();
      workingStates = clone(asRecord(projectedSnapshot.states), workingStates);
    }

    reducers.forEach((reducer) => {
      const value = reducerValue(reducer.value, payload, actionResult && actionResult.data || actionResult);
      const next = reducer.path
        ? writePath(clone(workingStates[reducer.state], {}), reducer.path, value)
        : clone(value, value);
      modelOperations.push({
        operation: 'set',
        state: reducer.state,
        value: clone(next, next)
      });
      workingStates[reducer.state] = clone(next, next);
    });

    if (modelOperations.length > 0
      && validationStage && validationStage.split === true && validationStage.evaluation) {
      const gateReport = validationStage.report;
      const prospectiveSnapshot = {
        ...clone(previousSnapshot, {}),
        states: clone(workingStates, {})
      };
      const refreshedValidationStage = evaluateCommandValidation(commandId, metadata, prospectiveSnapshot);
      if (refreshedValidationStage && refreshedValidationStage.evaluation) {
        validationStage = {
          ...refreshedValidationStage,
          report: gateReport
        };
      }
    }

    let validationOperationCount = 0;
    if (validationStage && validationStage.evaluation) {
      if (validationStage.split === true) {
        const validationOperations = asArray(validationStage.evaluation.modelOperations)
          .map((operation) => clone(operation, operation));
        modelOperations.push(...validationOperations);
        validationOperationCount = validationOperations.length;
      } else {
        const projectionPlan = planValidationStateProjection(validationStage, workingStates, metadata);
        modelOperations.push(...projectionPlan.operations);
        validationOperationCount = projectionPlan.operations.length;
        validationStage.application = projectionPlan.application;
      }
    }

    const event = modelCommandPort.apply(modelOperations, {
      ...transactionMetadata,
      actionOperationCount: plannedModelOperations.length,
      validationOperationCount
    });
    if (validationStage && validationStage.evaluation && validationStage.split === true) {
      validationStage.application = {
        schema: 'xtend.maraca.validation-model-application.v1',
        operationCount: validationOperationCount,
        transaction: event
      };
    }
    const nextSnapshot = event && event.next
      ? event.next
      : runtimes.state.snapshot();
    const committedPreviousSnapshot = event && event.previous
      ? event.previous
      : previousSnapshot;
    const patchPlan = planStatePatch(committedPreviousSnapshot, nextSnapshot, event && event.patchPlan);
    return {
      schema: 'xtend.maraca.state-transaction.v1',
      event,
      previous: committedPreviousSnapshot,
      next: nextSnapshot,
      patchPlan,
      metadata: transactionMetadata,
      validationStage
    };
  }

  function collectValidationResults(results, target = new Map()) {
    asArray(results).forEach((result) => {
      if (!result || !result.group || target.has(result.group)) return;
      target.set(result.group, result);
      collectValidationResults(result.included, target);
    });
    return target;
  }

  function validationFieldResults(validationStage) {
    const fields = [];
    const visit = (results) => asArray(results).forEach((result) => {
      asArray(result && result.fields).forEach((field) => fields.push(field));
      visit(result && result.included);
    });
    visit(validationStage && validationStage.evaluation && validationStage.evaluation.results);
    return fields;
  }

  function validationFieldSurface(field) {
    return field && (field.surface || asRecord(field.target).surface) || '';
  }

  function validationProjectionRecords(validationStage) {
    const prepared = asArray(validationStage && validationStage.projectionPlan && validationStage.projectionPlan.projections);
    if (prepared.length) return prepared;
    const evaluated = asArray(validationStage && validationStage.evaluation && validationStage.evaluation.viewProjection);
    if (evaluated.length) return evaluated;
    return validationFieldResults(validationStage).map((field) => ({
      target: asRecord(field.target).surface || asRecord(field.target).field
        ? asRecord(field.target)
        : {
            surface: field.surface || null,
            component: field.component || null,
            field: field.field || null
          },
      invalid: field.valid === false,
      revealed: field.revealed !== false,
      report: false,
      message: field.message || ''
    }));
  }

  function descriptorMatchesValidationTarget(descriptor, projection) {
    const target = asRecord(projection && projection.target);
    const surfaceId = String(descriptor && descriptor.surface || '');
    if (target.surface) return surfaceId === String(target.surface);
    const attributes = asRecord(descriptor && descriptor.attributes);
    if (target.field && hasOwn(attributes, 'data-field')) {
      return String(attributes['data-field']) === String(target.field);
    }
    return false;
  }

  function decorateValidationDescriptor(descriptor, validationStage) {
    const projections = validationProjectionRecords(validationStage);
    if (!projections.length) return descriptor;
    const decorate = (value) => {
      if (Array.isArray(value)) return value.map(decorate);
      if (!value || typeof value !== 'object') return value;
      const next = { ...value };
      const matches = projections.filter((projection) => descriptorMatchesValidationTarget(value, projection));
      if (matches.length) {
        const invalidFields = matches.filter((projection) => projection.revealed !== false && projection.invalid === true);
        const message = invalidFields.find((projection) => projection.message);
        next.attributes = {
          ...asRecord(value.attributes),
          invalid: invalidFields.length ? '' : null,
          'aria-invalid': invalidFields.length ? 'true' : null,
          'data-validation-message': message ? message.message : null
        };
      }
      ['children', 'descriptors', 'nodes'].forEach((key) => {
        if (Array.isArray(value[key])) next[key] = value[key].map(decorate);
      });
      ['child', 'content', 'fallback', 'then', 'else', 'empty', 'template', 'itemTemplate', 'node', 'descriptor'].forEach((key) => {
        if (value[key] && typeof value[key] === 'object') next[key] = decorate(value[key]);
      });
      if (value.slots && typeof value.slots === 'object' && !Array.isArray(value.slots)) {
        next.slots = Object.fromEntries(Object.entries(value.slots).map(([name, slot]) => [name, decorate(slot)]));
      }
      return next;
    };
    return decorate(descriptor);
  }

  function descriptorForCommit(descriptor, validationStage = null) {
    return decorateValidationDescriptor(projectDescriptor(descriptor), validationStage);
  }

  function ownershipForCommit(validationStage = null) {
    if (!validationStage || !validationProjectionRecords(validationStage).length) return ownership;
    return {
      ...ownership,
      claims: {
        ...asRecord(ownership.claims),
        validation: 'validation-runtime'
      }
    };
  }

  function planValidationStateProjection(validationStage, stateValues, metadata = {}) {
    if (!validationStage || !validationStage.evaluation) {
      return {
        operations: [],
        application: null
      };
    }
    const resultsByGroup = collectValidationResults(validationStage.evaluation.results);
    const patches = asArray(asRecord(asRecord(plan.validation).artifact).statePatches);
    const changedPatches = [];
    const operations = [];
    patches.forEach((patch) => {
      if (!patch || !patch.group || !patch.targetState) return;
      const result = resultsByGroup.get(patch.group);
      if (!result) return;
      const current = asRecord(stateValues[patch.targetState]);
      const nextValue = result.valid === false ? patch.invalidValue : patch.validValue;
      if (stableValue(readPath(current, patch.path || 'disabled')) === stableValue(nextValue)) return;
      const next = clone(current, {});
      writePath(next, patch.path || 'disabled', clone(nextValue, nextValue));
      operations.push({ operation: 'set', state: patch.targetState, value: next });
      stateValues[patch.targetState] = clone(next, next);
      changedPatches.push(patch.id || `${patch.group}:${patch.targetState}:${patch.path || 'disabled'}`);
    });
    return {
      operations,
      application: {
        schema: 'xtend.maraca.validation-projection.v1',
        valid: validationStage.evaluation.valid !== false,
        fieldCount: validationFieldResults(validationStage).length,
        operationCount: operations.length,
        changedPatches,
        metadata: clone(metadata, {})
      }
    };
  }

  function evaluateCommandValidation(commandId, metadata, suppliedModelSnapshot = null) {
    if (!runtimes.validationEvaluator && !runtimes.validation) return null;
    const validationMetadata = {
      ...metadata,
      action: commandId,
      report: true,
      reveal: true
    };
    if (runtimes.validationEvaluator && typeof runtimes.validationEvaluator.evaluate === 'function') {
      const validationPlan = asRecord(asRecord(plan.validation).artifact);
      const gates = asArray(validationPlan.actionGates).filter((gate) => gate && gate.action === commandId);
      const groupIds = [...new Set([
        ...gates.map((gate) => gate.group),
        ...asArray(validationPlan.statePatches).map((patch) => patch && patch.group)
      ].filter(Boolean))];
      const modelSnapshot = suppliedModelSnapshot || (
        runtimes.state.modelReader && typeof runtimes.state.modelReader.snapshot === 'function'
          ? runtimes.state.modelReader.snapshot()
          : runtimes.state.snapshot()
      );
      const evaluation = runtimes.validationEvaluator.evaluate(immutableClone({
        ...validationMetadata,
        snapshot: modelSnapshot,
        states: asRecord(modelSnapshot).states
      }, {}), groupIds.length ? groupIds : null);
      const projectionMetadata = {
        operation: 'maraca.validation.view-projection.prepare',
        action: commandId,
        correlationId: metadata.correlationId || ''
      };
      const projectionPlan = runtimes.validationViewProjector
        && typeof runtimes.validationViewProjector.prepare === 'function'
        ? runtimes.validationViewProjector.prepare(evaluation, projectionMetadata)
        : immutableClone({
            schema: 'xtend.rmt.form-validation-view-projection-plan.v1',
            valid: evaluation && evaluation.valid !== false,
            projectionCount: asArray(evaluation && evaluation.viewProjection).length,
            projections: asArray(evaluation && evaluation.viewProjection),
            metadata: projectionMetadata
          }, {});
      const resultsByGroup = collectValidationResults(evaluation && evaluation.results);
      const gateResults = gates.map((gate) => resultsByGroup.get(gate.group)).filter(Boolean);
      const valid = gateResults.every((result) => result.valid !== false);
      return {
        modern: true,
        split: true,
        evaluation,
        application: null,
        projection: null,
        projectionPlan,
        metadata: validationMetadata,
        report: {
          schema: 'xtend.rmt.form-validation-action-gate.v1',
          action: commandId,
          valid,
          gated: gates.length > 0,
          gateCount: gates.length,
          results: gateResults
        }
      };
    }
    if (typeof runtimes.validation.evaluate === 'function') {
      const validationPlan = asRecord(asRecord(plan.validation).artifact);
      const gates = asArray(validationPlan.actionGates).filter((gate) => gate && gate.action === commandId);
      const groupIds = [...new Set([
        ...gates.map((gate) => gate.group),
        ...asArray(validationPlan.statePatches).map((patch) => patch && patch.group)
      ].filter(Boolean))];
      const evaluation = runtimes.validation.evaluate(validationMetadata, groupIds.length ? groupIds : null);
      const resultsByGroup = collectValidationResults(evaluation && evaluation.results);
      const gateResults = gates.map((gate) => resultsByGroup.get(gate.group)).filter(Boolean);
      const valid = gateResults.every((result) => result.valid !== false);
      return {
        modern: true,
        split: false,
        evaluation,
        application: null,
        metadata: validationMetadata,
        report: {
          schema: 'xtend.rmt.form-validation-action-gate.v1',
          action: commandId,
          valid,
          gated: gates.length > 0,
          gateCount: gates.length,
          results: gateResults
        }
      };
    }
    if (typeof runtimes.validation.validateAction === 'function') {
      return {
        modern: false,
        split: false,
        evaluation: null,
        application: null,
        metadata: validationMetadata,
        report: runtimes.validation.validateAction(commandId, validationMetadata)
      };
    }
    return null;
  }

  function commandPatchRecords(commandId, reducers) {
    const reducerIds = new Set(reducers.map((reducer) => reducer && reducer.id).filter(Boolean));
    return asArray(asRecord(artifact.patchPlan).reducers).filter((patch) => (
      patch
      && patch.action === commandId
      && (!patch.reducer || reducerIds.has(patch.reducer))
    ));
  }

  function affectedSurfaceIds(commandId, reducers, patchPlan, validationStage = null) {
    const ids = new Set();
    const changedSources = [
      ...asArray(patchPlan.changedSelectors),
      ...asArray(patchPlan.changedDerived),
      ...asArray(patchPlan.changedStates)
    ];
    changedSources.forEach((source) => {
      sourceCandidates(source).forEach((candidate) => {
        asArray(surfaceIdsBySource.get(candidate)).forEach((surfaceId) => ids.add(surfaceId));
      });
    });
    commandPatchRecords(commandId, reducers).forEach((patch) => {
      if (patch.surface) ids.add(String(patch.surface));
    });
    const sourceToSurface = new Map(surfaces.map((surface) => [
      String(surface && (surface.source && (surface.source.target || surface.source.ref) || surface.source) || ''),
      String(surface && surface.id || '')
    ]));
    asArray(asRecord(artifact.patchPlan).validation).forEach((patch) => {
      const surfaceId = patch && (patch.surface || sourceToSurface.get(String(patch.targetState || '')));
      if (surfaceId) ids.add(String(surfaceId));
    });
    validationFieldResults(validationStage).forEach((field) => {
      const surfaceId = validationFieldSurface(field);
      if (surfaceId) ids.add(String(surfaceId));
    });
    validationProjectionRecords(validationStage).forEach((projection) => {
      const surfaceId = asRecord(projection && projection.target).surface;
      if (surfaceId) ids.add(String(surfaceId));
    });
    return ids;
  }

  function stateDomCommit(commandId, reducers, transaction, metadata) {
    const validationStage = transaction.validationStage;
    const surfaceIds = affectedSurfaceIds(commandId, reducers, transaction.patchPlan, validationStage);
    if (!runtimes.renderer || typeof runtimes.renderer.commit !== 'function') {
      return {
        report: fullRender(
          { operation: 'maraca.state-commit', action: commandId, ...metadata },
          transaction.next,
          validationStage
        ),
        surfaceIds,
        fullRender: true
      };
    }
    const context = createRenderContext(
      { operation: 'maraca.state-commit', action: commandId, ...metadata },
      transaction.next
    );
    const projectedRoot = descriptorForCommit(
      asRecord(artifact.render).root || { type: 'fragment', children: [] },
      validationStage
    );
    const report = rendererCommit({
      operation: 'reconcile-children',
      target: root,
      descriptors: Array.isArray(projectedRoot) ? projectedRoot : [projectedRoot],
      context,
      ownership: ownershipForCommit(validationStage)
    }, metadata);
    if (report.structural) reindexSurfaces();
    return { report, surfaceIds, fullRender: false };
  }

  function finalizeValidationProjection(validationStage, metadata = {}) {
    if (!validationStage
      || validationStage.split !== true
      || !validationStage.projectionPlan
      || !runtimes.validationViewProjector
      || typeof runtimes.validationViewProjector.finalize !== 'function') return null;
    try {
      validationStage.projection = runtimes.validationViewProjector.finalize(
        validationStage.projectionPlan,
        metadata
      );
      return validationStage.projection;
    } catch (error) {
      validationStage.projection = {
        schema: 'xtend.rmt.form-validation-view-finalize-report.v1',
        status: 'failed',
        retryable: true
      };
      recordDiagnostic(
        'xtend.maraca.mvc.validation-projection-failed',
        'error',
        error && error.message ? error.message : 'Validation View finalization failed after the DOM commit.',
        {
          action: metadata.action || '',
          correlationId: metadata.correlationId || '',
          retryable: true
        }
      );
      return validationStage.projection;
    }
  }

  async function scheduleWork(kind, work, metadata = {}) {
    if (!runtimes || !runtimes.kernel || typeof runtimes.kernel.scheduleWork !== 'function') {
      return Promise.resolve().then(work);
    }
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (callback, value) => {
        if (settled) return;
        settled = true;
        pendingScheduledWork.delete(cancel);
        callback(value);
      };
      const complete = (value) => settle(resolve, value);
      const fail = (error) => settle(reject, error);
      const cancel = () => fail(runtimeDisposedError());
      const scheduledWork = async (jobContext) => {
        if (settled || phase === 'disposed') {
          cancel();
          return undefined;
        }
        try {
          const result = await work(jobContext);
          complete(result);
          return result;
        } catch (error) {
          fail(error);
          return undefined;
        }
      };
      pendingScheduledWork.add(cancel);
      try {
        const scheduled = runtimes.kernel.scheduleWork(kind, scheduledWork, {
          ...metadata,
          runInline: false
        });
        if (scheduled && typeof scheduled.then === 'function') scheduled.catch(fail);
      } catch (error) {
        fail(error);
      }
    });
  }

  function runtimeDisposedError() {
    const error = new Error('Maraca plan runtime was disposed before the command completed.');
    error.code = 'maraca.plan-runtime.disposed';
    return error;
  }

  async function prepareCommand(commandId, payload, metadata, commandGeneration) {
    const reducers = asArray(asRecord(artifact.state).reducers)
      .filter((entry) => entry && entry.action === commandId && entry.state);
    const stateBuffer = { events: [] };
    activeStateBuffer = stateBuffer;
    let result;
    let blocked = false;
    let validation = null;
    let validationStage = null;
    try {
      validationStage = evaluateCommandValidation(commandId, metadata);
      validation = validationStage && validationStage.report;
      blocked = validation && validation.valid === false;
      if (blocked) {
        recordDiagnostic(
          'rmt.form_validation.action_blocked',
          'warning',
          `RMT action ${commandId} was blocked by form validation.`,
          {
            action: commandId,
            groups: asArray(validation.results).map((resultEntry) => resultEntry && resultEntry.group).filter(Boolean)
          }
        );
        publish('validation-blocked', { report: validation, action: commandId });
        dispatchDomEvent('xtend-maraca:validation-blocked', validation);
        result = { status: 'blocked', command: commandId, validation };
      } else {
        if (strict && (!runtimes.action || typeof runtimes.action.runAction !== 'function')) {
          const error = new Error('Strict Maraca commands require the injected Action command port.');
          error.code = 'xtend.maraca.mvc.action-command-port-missing';
          throw error;
        }
        result = runtimes.action && typeof runtimes.action.runAction === 'function'
          ? await runtimes.action.runAction(commandId, clone(payload, {}), metadata)
          : await Promise.resolve(hostServices.dispatchCommand
              ? hostServices.dispatchCommand(commandId, payload, metadata)
              : { status: 'success', data: payload });
      }
      if (phase === 'disposed' || generation !== commandGeneration) throw runtimeDisposedError();
      const resultRecord = asRecord(result);
      const actionSucceeded = !blocked
        && (!hasOwn(resultRecord, 'status') || resultRecord.status === 'success');
      const successfulReducers = actionSucceeded ? reducers : [];
      const transaction = transactionState(
        successfulReducers,
        commandId,
        payload,
        result,
        metadata,
        validationStage
      );
      validationStage = transaction.validationStage;
      validation = validationStage && validationStage.report;
      const transition = actionSucceeded && runtimes.transitions && typeof runtimes.transitions.findTransition === 'function'
        ? runtimes.transitions.findTransition({ action: commandId })
        : null;
      const transitionMetadata = { ...metadata, action: commandId };
      if (transition) {
        await runTransitionSurfaces(
          transition,
          transition.from || [],
          true,
          transaction.previous,
          transaction.next,
          transitionMetadata
        );
      }
      return {
        commandId,
        payload: clone(payload, {}),
        reducers: successfulReducers,
        result,
        blocked,
        actionSucceeded,
        validation,
        validationStage,
        transition,
        transitionMetadata,
        transaction,
        stateEvents: stateBuffer.events
      };
    } finally {
      if (activeStateBuffer === stateBuffer) activeStateBuffer = null;
    }
  }

  async function commitCommand(prepared, metadata, commandGeneration) {
    if (phase === 'disposed' || generation !== commandGeneration) throw runtimeDisposedError();
    materializeSurfaces(prepared.transaction.next, {
      operation: 'maraca.command.surface-materialize',
      action: prepared.commandId,
      correlationId: metadata.correlationId || ''
    });
    const committed = stateDomCommit(prepared.commandId, prepared.reducers, prepared.transaction, metadata);
    const transitionSurfaceIds = new Set(prepared.transition
      ? [...asArray(prepared.transition.from), ...asArray(prepared.transition.to)].map(String)
      : []);
    const visibilitySurfaceIds = new Set(
      [...committed.surfaceIds].filter((surfaceId) => !transitionSurfaceIds.has(String(surfaceId)))
    );
    await syncOwnedVisibility(prepared.transaction.next, visibilitySurfaceIds, {
      operation: 'maraca.command.visibility',
      action: prepared.commandId,
      correlationId: metadata.correlationId || ''
    }, prepared.transaction.previous);
    recordDomCommit(committed.report, {
      stateCommit: true,
      action: prepared.commandId,
      status: prepared.result && prepared.result.status || (prepared.blocked ? 'blocked' : 'success')
    });
    finalizeValidationProjection(prepared.validationStage, {
      operation: 'maraca.validation.view-projection.finalize',
      action: prepared.commandId,
      correlationId: metadata.correlationId || ''
    });
    reconcileEvents(committed.report);
    if (prepared.transition) {
      await runTransitionSurfaces(
        prepared.transition,
        prepared.transition.to || [],
        false,
        prepared.transaction.previous,
        prepared.transaction.next,
        prepared.transitionMetadata
      );
    }
    await hydrate(committed.surfaceIds, {
      operation: 'maraca.command.post-commit',
      action: prepared.commandId,
      correlationId: metadata.correlationId || ''
    });
    if (prepared.actionSucceeded) {
      const postCommitContext = {
        schema: 'xtend.maraca.post-commit-context.v1',
        action: prepared.commandId,
        payload: clone(prepared.payload, {}),
        metadata: clone(metadata, {}),
        commitResult: safeCommitSummary(committed.report),
        modelSnapshot: runtimes.state && runtimes.state.modelReader
          ? runtimes.state.modelReader.snapshot()
          : runtimes.state && typeof runtimes.state.snapshot === 'function'
            ? runtimes.state.snapshot()
            : null,
        surfaceSnapshot: runtimes.surfaceController && typeof runtimes.surfaceController.readSnapshot === 'function'
          ? runtimes.surfaceController.readSnapshot()
          : runtimes.surfaceGraph && typeof runtimes.surfaceGraph.getSnapshot === 'function'
            ? runtimes.surfaceGraph.getSnapshot()
            : null
      };
      const defaultEffects = await runDeferredPlanEffects(prepared.result, postCommitContext);
      if (typeof options.postCommitEffects === 'function') {
        await options.postCommitEffects(immutableClone(prepared.result, {}), immutableClone({
          ...postCommitContext,
          defaultEffects
        }, {}));
      }
    }
    const stateEvent = prepared.transaction.event || {
      schema: 'xtend.epic18.rmt-state-change.v1',
      previous: prepared.transaction.previous,
      next: prepared.transaction.next,
      patchPlan: prepared.transaction.patchPlan,
      metadata: prepared.transaction.metadata
    };
    publish('state', {
      event: stateEvent,
      action: prepared.commandId,
      bufferedEventCount: prepared.stateEvents.length
    });
    notifyModelSubscribers(stateEvent);
    publish('command', {
      command: prepared.commandId,
      status: prepared.result && prepared.result.status || (prepared.blocked ? 'blocked' : 'success')
    });
    return immutableClone(prepared.result, null);
  }

  async function dispatchCommandNow(command, payload = {}, metadata = {}) {
    if (phase !== 'ready') throw new Error('Maraca plan runtime is not booted.');
    const commandRecord = typeof command === 'string' ? null : asRecord(command);
    const commandId = typeof command === 'string'
      ? command
      : String(commandRecord.command || commandRecord.id || commandRecord.action || '');
    if (!commandId) throw new TypeError('dispatchCommand() requires a command id.');
    const envelopeCall = Boolean(commandRecord && (commandRecord.schema === 'xtend.rmt.command.v1' || hasOwn(commandRecord, 'command')));
    const commandPayload = envelopeCall && hasOwn(commandRecord, 'payload') ? commandRecord.payload : payload;
    const commandMetadata = envelopeCall && !Object.keys(asRecord(metadata)).length
      ? { ...asRecord(commandRecord.metadata), ...asRecord(payload) }
      : { ...asRecord(commandRecord && commandRecord.metadata), ...asRecord(metadata) };
    const commandGeneration = generation;
    const actionMetadata = {
      operation: 'operation:xtend.rmt/action/' + commandId,
      command: commandId,
      correlationId: commandRecord && commandRecord.correlationId || commandMetadata.correlationId || '',
      ...commandMetadata
    };
    if (commandId === SYSTEM_REFRESH_COMMAND) {
      const commit = await renderView({
        ...actionMetadata,
        operation: commandMetadata.operation || 'maraca.system.refresh',
        systemCommand: SYSTEM_REFRESH_COMMAND
      });
      publish('command', {
        command: SYSTEM_REFRESH_COMMAND,
        status: 'success',
        system: true
      });
      return commit;
    }
    const prepared = await scheduleWork(
      'action',
      () => prepareCommand(commandId, commandPayload, actionMetadata, commandGeneration),
      actionMetadata
    );
    return scheduleWork(
      'state-change',
      () => commitCommand(prepared, actionMetadata, commandGeneration),
      {
        operation: 'operation:xtend.rmt/state-change/' + commandId,
        command: commandId,
        correlationId: actionMetadata.correlationId || ''
      }
    );
  }

  function dispatchCommand(command, payload = {}, metadata = {}) {
    const queued = commandQueue.then(async () => {
      if (phase === 'booting' && bootPromise) await bootPromise;
      if (phase === 'disposed') throw runtimeDisposedError();
      return dispatchCommandNow(command, payload, metadata);
    });
    commandQueue = queued.then(() => undefined, () => undefined);
    return queued;
  }

  async function dispatchStreamPatchNow(patchInput, metadata = {}) {
    if (phase !== 'ready') throw new Error('Maraca plan runtime is not booted.');
    if (!runtimes.app
      || typeof runtimes.app.planStreamPatch !== 'function'
      || typeof runtimes.app.commitStreamPatchPlan !== 'function') {
      const error = new Error('The Maraca plan does not provide a stream-patch controller.');
      error.code = 'xtend.maraca.stream-patch.unavailable';
      throw error;
    }
    const patch = immutableClone(asRecord(patchInput), {});
    const streamMetadata = {
      operation: 'operation:xtend.maraca/stream-patch',
      correlationId: patch.correlationId || metadata.correlationId || '',
      ...asRecord(metadata)
    };
    const modelSnapshot = runtimes.state.modelReader && typeof runtimes.state.modelReader.snapshot === 'function'
      ? runtimes.state.modelReader.snapshot()
      : runtimes.state.snapshot();
    const planResult = runtimes.app.planStreamPatch(patch, modelSnapshot, streamMetadata);
    asArray(planResult && planResult.diagnostics).forEach((diagnostic) => recordDiagnostic(
      diagnostic && diagnostic.code || 'xtend.maraca.stream-patch.plan',
      diagnostic && diagnostic.severity || 'error',
      diagnostic && diagnostic.message || 'The stream patch plan emitted a diagnostic.',
      diagnostic && (diagnostic.details || diagnostic.metadata) || {}
    ));
    if (!planResult || planResult.accepted !== true) {
      const rejected = runtimes.app.commitStreamPatchPlan(planResult, streamMetadata);
      publish('stream-patch', { result: rejected, metadata: streamMetadata });
      return immutableClone(rejected, null);
    }
    const streamGeneration = generation;
    const result = await scheduleWork('state-change', async () => {
      if (phase === 'disposed' || generation !== streamGeneration) throw runtimeDisposedError();
      const stateBuffer = { events: [] };
      activeStateBuffer = stateBuffer;
      let transaction;
      let validationStage;
      try {
        validationStage = evaluateCommandValidation('xtend.stream.patch', {
          ...streamMetadata,
          reveal: false
        });
        transaction = transactionState(
          [],
          'xtend.stream.patch',
          {},
          { modelOperations: asArray(planResult.modelOperations) },
          {
            ...streamMetadata,
            transactionOperation: 'maraca.stream-patch.transaction'
          },
          validationStage
        );
      } finally {
        if (activeStateBuffer === stateBuffer) activeStateBuffer = null;
      }
      materializeSurfaces(transaction.next, {
        ...streamMetadata,
        operation: 'maraca.stream-patch.surface-materialize'
      });
      const committed = stateDomCommit('xtend.stream.patch', [], transaction, {
        ...streamMetadata,
        operation: 'maraca.stream-patch'
      });
      await syncOwnedVisibility(transaction.next, committed.surfaceIds, {
        ...streamMetadata,
        operation: 'maraca.stream-patch.visibility'
      }, transaction.previous);
      recordDomCommit(committed.report, {
        ...streamMetadata,
        stateCommit: true,
        operation: 'maraca.stream-patch',
        status: 'applied'
      });
      const applied = runtimes.app.commitStreamPatchPlan(planResult, streamMetadata);
      finalizeValidationProjection(transaction.validationStage, {
        ...streamMetadata,
        operation: 'maraca.stream-patch.validation-view-projection.finalize',
        action: 'xtend.stream.patch'
      });
      reconcileEvents(committed.report);
      await hydrate(committed.surfaceIds, {
        ...streamMetadata,
        operation: 'maraca.stream-patch.post-commit'
      });
      const stateEvent = transaction.event || {
        schema: 'xtend.epic18.rmt-state-change.v1',
        previous: transaction.previous,
        next: transaction.next,
        patchPlan: transaction.patchPlan,
        metadata: transaction.metadata
      };
      publish('state', {
        event: stateEvent,
        streamPatch: planResult.patch,
        bufferedEventCount: stateBuffer.events.length
      });
      notifyModelSubscribers(stateEvent);
      return immutableClone({
        ...asRecord(applied),
        transaction: {
          schema: transaction.schema,
          patchPlan: transaction.patchPlan,
          metadata: transaction.metadata
        },
        commit: safeCommitSummary(committed.report)
      }, {});
    }, streamMetadata);
    for (const effect of asArray(planResult.postCommitEffects)) {
      if (!effect || effect.type !== 'dispatch-command' || !effect.command) continue;
      await dispatchCommandNow(effect.command, asRecord(effect.payload), {
        ...asRecord(effect.metadata),
        parentOperation: 'maraca.stream-patch'
      });
    }
    publish('stream-patch', { result, metadata: streamMetadata });
    return immutableClone(result, null);
  }

  function dispatchStreamPatch(patchInput, metadata = {}) {
    const queued = commandQueue.then(async () => {
      if (phase === 'booting' && bootPromise) await bootPromise;
      if (phase === 'disposed') throw runtimeDisposedError();
      return dispatchStreamPatchNow(patchInput, metadata);
    });
    commandQueue = queued.then(() => undefined, () => undefined);
    return queued;
  }

  function createScheduledAppFacade(appRuntime) {
    if (!appRuntime) return null;
    const scheduleAppWork = (kind, work, metadata = {}) => scheduleWork(kind, work, metadata);
    const facade = {
      schema: appRuntime.schema,
      rawSchema: appRuntime.schema,
      facade: 'xtend.maraca.scheduled-app-runtime.v1',
      hostServices: appRuntime.hostServices || hostServiceRegistry,
      createCommandEnvelope: appRuntime.createCommandEnvelope,
      command(commandName, payload = {}, commandOptions = {}) {
        const command = commandName && commandName.schema === 'xtend.rmt.command.v1'
          ? commandName
          : appRuntime.createCommandEnvelope({
              command: commandName,
              payload,
              target: hasOwn(asRecord(commandOptions), 'target') ? commandOptions.target : null
            }, {
              source: {
                kind: commandOptions.sourceKind || 'app-runtime',
                id: commandOptions.sourceId || 'maracaPlanRuntime.appRuntime.command',
                event: commandOptions.event || 'command',
                surfaceId: commandOptions.surfaceId || ''
              },
              lane: commandOptions.lane || 'user-blocking',
              correlationId: commandOptions.correlationId || '',
              runId: commandOptions.runId || ''
            });
        return facade.dispatchCommand(command, commandOptions.metadata || commandOptions);
      },
      refreshSnapshot(commandName = 'xtend.app.applySnapshot', payload = {}, commandOptions = {}) {
        return facade.command(commandName, {
          reason: commandOptions.reason || 'app-runtime-refresh',
          ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : { value: payload })
        }, {
          ...commandOptions,
          lane: commandOptions.lane || 'visible',
          sourceId: commandOptions.sourceId || 'maracaPlanRuntime.appRuntime.refreshSnapshot',
          event: commandOptions.event || 'snapshot-refresh'
        });
      },
      dispatchCommand(commandEnvelope, metadata = {}) {
        const command = commandEnvelope && commandEnvelope.schema === 'xtend.rmt.command.v1'
          ? commandEnvelope
          : appRuntime.createCommandEnvelope(commandEnvelope, metadata);
        return appRuntime.dispatchCommand(command, {
          ...metadata,
          operation: metadata.eventId
            ? `operation:xtend.rmt/event/${metadata.eventId}`
            : metadata.operation || 'operation:xtend.maraca/orchestration/event',
          correlationId: command && command.correlationId || metadata.correlationId || ''
        });
      },
      invokeService(serviceId, payload = {}, context = {}) {
        return scheduleAppWork('action', () => appRuntime.invokeService(serviceId, payload, context), {
          operation: 'operation:xtend.maraca/orchestration/action',
          serviceId,
          correlationId: context.correlationId || context.command && context.command.correlationId || ''
        });
      },
      streamService(serviceId, payload = {}, streamOptions = {}) {
        return scheduleAppWork('action', () => appRuntime.streamService(serviceId, payload, streamOptions), {
          operation: 'operation:xtend.maraca/orchestration/action',
          serviceId,
          correlationId: streamOptions.correlationId || streamOptions.command && streamOptions.command.correlationId || ''
        });
      },
      applyStreamPatch(patchInput, reducerOptions = {}) {
        return dispatchStreamPatch(patchInput, reducerOptions);
      },
      handleStreamPatch(patchInput, reducerOptions = {}) {
        return dispatchStreamPatch(patchInput, reducerOptions);
      },
      getState: () => runtimes && runtimes.state && runtimes.state.modelReader
        ? runtimes.state.modelReader.snapshot().states
        : {},
      listCommands: () => appRuntime.listCommands(),
      listStreamPatches: () => typeof appRuntime.listStreamPatches === 'function' ? appRuntime.listStreamPatches() : [],
      listStreams: () => typeof appRuntime.listStreams === 'function' ? appRuntime.listStreams() : [],
      listStreamPressureRecords: () => typeof appRuntime.listStreamPressureRecords === 'function' ? appRuntime.listStreamPressureRecords() : [],
      listYieldActions: () => typeof appRuntime.listYieldActions === 'function' ? appRuntime.listYieldActions() : [],
      listSchedulerPressureSamples: () => typeof appRuntime.listSchedulerPressureSamples === 'function' ? appRuntime.listSchedulerPressureSamples() : [],
      listDiagnostics: () => typeof appRuntime.listDiagnostics === 'function' ? appRuntime.listDiagnostics() : []
    };
    return Object.freeze(facade);
  }

  async function renderView(metadata = {}) {
    if (phase === 'disposed') throw new Error('Disposed Maraca plan runtimes cannot render.');
    const performRender = async () => {
      const stateSnapshot = runtimes.state.snapshot();
      materializeSurfaces(stateSnapshot, metadata);
      const report = fullRender(
        { operation: metadata.operation || 'maraca.render', ...metadata },
        stateSnapshot
      );
      recordDomCommit(report, {
        ...metadata,
        stateCommit: metadata.stateCommit === true,
        operation: metadata.operation || 'maraca.render'
      });
      reconcileEvents(report);
      await hydrate(null, {
        operation: metadata.operation || 'maraca.render',
        correlationId: metadata.correlationId || ''
      });
      return immutableClone(lastCommit, {});
    };
    return phase === 'ready'
      ? scheduleWork('render', performRender, {
          operation: metadata.operation || 'maraca.render',
          action: metadata.action || '',
          correlationId: metadata.correlationId || ''
        })
      : performRender();
  }

  function render(metadata = {}) {
    recordLegacyAdapter('render');
    return dispatchCommand({
      schema: 'xtend.rmt.command.v1',
      command: SYSTEM_REFRESH_COMMAND,
      metadata: {
        ...asRecord(metadata),
        operation: asRecord(metadata).operation || 'maraca.render'
      }
    });
  }

  function refresh(metadata = {}) {
    recordLegacyAdapter('refresh');
    return dispatchCommand({
      schema: 'xtend.rmt.command.v1',
      command: SYSTEM_REFRESH_COMMAND,
      metadata: {
        ...asRecord(metadata),
        operation: asRecord(metadata).operation || 'maraca.refresh'
      }
    });
  }

  function requireModelRuntime(operation) {
    const state = runtimes && runtimes.state;
    if (!state) throw new Error(`${operation} requires a booted Maraca plan runtime.`);
    return state;
  }

  function modelSnapshot() {
    const state = runtimes && runtimes.state;
    const reader = state && (state.modelReader || state.model);
    return immutableClone(
      reader && typeof reader.snapshot === 'function'
        ? reader.snapshot()
        : state && typeof state.snapshot === 'function'
          ? state.snapshot()
          : null,
      null
    );
  }

  function notifyModelSubscribers(event = null) {
    if (!modelSubscriptions.size) return;
    const safeEvent = immutableClone(event || {
      schema: 'xtend.epic18.rmt-state-change.v1',
      pending: false,
      previous: null,
      next: modelSnapshot(),
      patchPlan: null,
      metadata: {}
    }, {});
    modelSubscriptions.forEach((listener) => {
      try { listener(safeEvent); } catch (_) {}
    });
  }

  const modelReader = Object.freeze({
    schema: 'xtend.rmt.model-reader.v1',
    getState(id) {
      const state = requireModelRuntime('model.getState()');
      const reader = state.modelReader || state.model || state;
      const value = reader.getState(id);
      return immutableClone(value, null);
    },
    select(id, params = {}) {
      const state = requireModelRuntime('model.select()');
      const reader = state.modelReader || state.model || state;
      return immutableClone(reader.select(id, immutableClone(params, {})), null);
    },
    getSelectorValues() {
      const state = requireModelRuntime('model.getSelectorValues()');
      const reader = state.modelReader || state.model || state;
      return immutableClone(reader.getSelectorValues(), {});
    },
    getDerivedValues() {
      const state = requireModelRuntime('model.getDerivedValues()');
      const reader = state.modelReader || state.model || state;
      return immutableClone(reader.getDerivedValues(), {});
    },
    snapshot: modelSnapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      modelSubscriptions.add(listener);
      return () => { modelSubscriptions.delete(listener); };
    }
  });

  const legacyActionRuntime = Object.freeze({
    schema: 'xtend.maraca.action-runtime-compat.v1',
    runAction(id, input = {}, metadata = {}) {
      return dispatchCommand(id, input, metadata);
    }
  });

  async function boot() {
    if (phase === 'ready') return snapshot();
    if (phase === 'booting') return bootPromise;
    if (phase === 'disposed') throw new Error('Disposed Maraca plan runtimes cannot be booted again.');
    phase = 'booting';
    generation += 1;
    const bootGeneration = generation;
    const assertCurrentBoot = () => {
      if (phase === 'disposed' || generation !== bootGeneration) throw runtimeDisposedError();
    };
    const pendingBoot = (async () => {
      let viewProjectionValidated = false;
      if (strict && !viewProjectionPort) {
        const error = new Error('Strict Maraca requires an injected Maraca View Projection Port.');
        error.code = 'xtend.maraca.mvc.view-projection-port-missing';
        throw error;
      }
      if (viewProjectionPort) {
        validateViewProjectionPort(viewProjectionPort);
        viewProjectionValidated = true;
      }
      const api = await resolveModules();
      assertCurrentBoot();
      const viewProjectionFactory = runtimeFactory(
        api.viewProjection || api.view || api.hostView,
        'createRmtMaracaViewProjectionAdapter'
      );
      if (!viewProjectionPort) {
        if (!viewProjectionFactory) {
          const error = new Error('Maraca compatibility mode could not construct the canonical View Projection Port.');
          error.code = 'xtend.maraca.mvc.view-projection-port-missing';
          throw error;
        }
        viewProjectionPort = viewProjectionFactory({
          root,
          documentTarget: options.documentTarget || null,
          windowTarget: options.windowTarget || null,
          publishDiagnostic(diagnostic) {
            recordDiagnostic(
              diagnostic && diagnostic.code || 'xtend.maraca.mvc.view-projection-adapter',
              diagnostic && diagnostic.severity || 'info',
              diagnostic && diagnostic.message || 'Maraca View Projection Adapter diagnostic.',
              asRecord(diagnostic && diagnostic.details)
            );
          }
        });
        ownsViewProjectionPort = true;
        recordDiagnostic(
          'xtend.maraca.mvc.view-projection-port-compatibility',
          'info',
          'Compatibility mode composed the canonical Maraca View Projection Port. Inject it from the composition root for strict operation.',
          { removal: '0.7.0' },
          true
        );
      } else {
        ownsViewProjectionPort = options.ownsViewProjectionPort === true;
      }
      if (!viewProjectionValidated) validateViewProjectionPort(viewProjectionPort);
      runtimes = { viewProjectionPort };
      await ensureComponents();
      assertCurrentBoot();
      const rendererFactory = runtimeFactory(api.renderer, 'createRmtDomDescriptorRenderer');
      const stateFactory = runtimeFactory(api.state, 'createRmtStateSelectorRuntime');
      const stateProjectionFactory = options.createStateProjectionPort
        || runtimeFactory(api.stateProjection, 'createRmtStateHostAdapter');
      if (strict && options.stateProjectionTarget && typeof options.stateProjectionTarget.batchUpdate !== 'function') {
        const error = new Error('Strict Maraca requires batchUpdate() for atomic Model projection.');
        error.code = 'rmt.state.projection-batch-required';
        throw error;
      }
      if (strict && options.surfaceStateProjection) {
        const error = new Error('Strict Maraca forbids a Surface-owned State projection; RMT Model is the sole application-state authority.');
        error.code = 'xtend.maraca.mvc.surface-state-writer-forbidden';
        throw error;
      }
      if (!stateFactory || (!options.domRenderer && !rendererFactory)) {
        throw new Error('The plan requires the official RMT state and DOM descriptor runtimes.');
      }
      const trustedDomRenderer = options.trustedDomRenderer || options.trustedDom;
      if (!options.trustedDomRenderer && options.trustedDom) {
        recordDiagnostic(
          'rmt.dom.trusted-dom.legacy-option',
          'info',
          'trustedDom is deprecated; use trustedDomRenderer.',
          {},
          true
        );
      }
      const renderer = options.domRenderer || rendererFactory({
          documentTarget: viewDocumentTarget(),
          componentRegistry: options.componentRegistry,
          trustedDomRenderer,
          trustedDom: options.trustedDom,
          diagnostics
        });
      runtimes = { viewProjectionPort, renderer };
      adaptersDisposed = false;
      if (strict && (!renderer || typeof renderer.commit !== 'function' || typeof renderer.dispose !== 'function')) {
        const error = new Error('Strict Maraca requires createRmtDomDescriptorRenderer().commit() and dispose().');
        error.code = 'rmt.dom.renderer-contract-incomplete';
        throw error;
      }
      if (!strict && renderer && typeof renderer.dispose !== 'function') {
        recordDiagnostic(
          'rmt.dom.renderer-dispose-missing',
          'warning',
          'The shared DOM renderer has no dispose() API; owned-root cleanup may require the compatibility facade.',
          {},
          true
        );
      }
      const state = stateFactory({
        states: asRecord(artifact.state).states || [],
        selectors: asRecord(artifact.state).selectors || [],
        derive: asRecord(artifact.state).derive || asRecord(artifact.state).derived || [],
        reducers: asRecord(artifact.state).reducers || [],
        initialState: normalizedInitialState,
        domRenderer: renderer,
        documentTarget: viewDocumentTarget(),
        strict,
        stateProjectionPort: options.stateProjectionPort || null,
        createStateProjectionPort: stateProjectionFactory,
        stateProjectionTarget: options.stateProjectionTarget || null
      });
      if (strict && (
        !state
        || !state.modelReader
        || typeof state.modelReader.getState !== 'function'
        || typeof state.modelReader.select !== 'function'
        || typeof state.modelReader.snapshot !== 'function'
        || typeof state.modelReader.subscribe !== 'function'
        || !state.modelCommandPort
        || typeof state.modelCommandPort.apply !== 'function'
      )) {
        const error = new Error('Strict Maraca requires the complete read-only Model and Model command ports.');
        error.code = 'xtend.maraca.mvc.model-ports-incomplete';
        throw error;
      }
      const kernel = createKernel(api.kernel, api.kernelRuntime || api.kernelApi);
      const actionFactory = runtimeFactory(api.action, 'createRmtActionEffectRuntime');
      const resourceFactory = runtimeFactory(api.action, 'createRmtResourceManager');
      const appFactory = runtimeFactory(api.app, 'createRmtAppRuntime');
      const hostServiceFactory = runtimeFactory(api.app, 'createRmtHostServiceRegistry');
      const animationFactory = runtimeFactory(api.animation, 'createRmtAnimationEngineRuntime');
      const transitionFactory = runtimeFactory(api.transitions, 'createRmtSurfaceTransitionRuntime');
      const validationEvaluatorFactory = runtimeFactory(api.validation, 'createRmtFormValidationEvaluator');
      const validationViewProjectorFactory = runtimeFactory(api.validation, 'createRmtFormValidationViewProjector');
      const validationFactory = runtimeFactory(api.validation, 'createRmtFormValidationRuntime');
      const eventFactory = runtimeFactory(api.events, 'createRmtEventRoutingRuntime');
      const surfaceFactory = runtimeFactory(api.surfaces || api.surface, 'createRmtSurfaceResourceGraphRuntime');
      const surfaceControllerFactory = runtimeFactory(api.surfaceController, 'createSurfaceController');
      const presentationEffectFactory = runtimeFactory(api.presentation, 'createRmtPresentationEffectAdapter');
      const resourceManager = options.resourceManager || (resourceFactory ? resourceFactory({
        resources: artifact.resources || [],
        resourceAdapters: options.resourceAdapters || {}
      }) : null);
      ownsResourceManager = Boolean(!options.resourceManager && resourceManager);
      if (!hostServiceRegistry && hostServiceFactory) {
        hostServiceRegistry = hostServiceFactory({
          services: artifact.hostServices || artifact.services || [],
          adapters: options.hostServiceAdapters || options.serviceAdapters || {},
          diagnosticsHub: options.diagnosticsHub
        });
        ownsHostServiceRegistry = true;
      }
      const actionModelReaderPort = createActionModelReaderPort(state);
      const action = actionFactory ? actionFactory({
        actions: asRecord(artifact.actions).actions || [],
        dataSources: asRecord(artifact.actions).dataSources || [],
        effects: asRecord(artifact.actions).effects || [],
        resources: artifact.resources || [],
        stateRuntime: actionModelReaderPort,
        resourceManager,
        hostServiceRegistry,
        dataSourceAdapters,
        feedbackAdapter: options.feedbackAdapter,
        navigationAdapter: options.navigationAdapter,
        focusAdapter: options.focusAdapter,
        componentCommandAdapter: options.componentCommandAdapter,
        effectAdapter: options.effectAdapter,
        deferCustomEffects: true,
        planningOnly: true,
        domRenderer: renderer
      }) : null;
      const animation = animationFactory && asRecord(plan.transitions).enabled ? animationFactory({
        animationPlan: asRecord(plan.transitions).artifact && (
          asRecord(plan.transitions).artifact.animationEngine || asRecord(plan.transitions).artifact
        ),
        xUtils: options.xUtils,
        windowTarget: options.windowTarget || null,
        diagnostics: asRecord(plan.transitions).diagnostics || [],
        strict: asRecord(plan.transitions).strict === true,
        domRenderer: renderer,
        publishDiagnostic: (diagnostic) => recordDiagnostic(
          diagnostic && diagnostic.code || 'maraca.plan-runtime.animation',
          diagnostic && diagnostic.severity || 'info',
          diagnostic && diagnostic.message || 'Animation runtime diagnostic.',
          diagnostic
        )
      }) : null;
      const transitions = transitionFactory && asRecord(plan.transitions).enabled ? transitionFactory({
        transitionPlan: asRecord(plan.transitions).artifact,
        animationEngine: animation,
        root,
        kernelController: kernel,
        xUtils: options.xUtils,
        transitionStatePort,
        windowTarget: options.windowTarget || null,
        diagnostics: asRecord(plan.transitions).diagnostics || [],
        strict: asRecord(plan.transitions).strict === true,
        domRenderer: renderer
      }) : null;
      const validationEnabled = asRecord(plan.validation).enabled === true;
      const splitValidationAvailable = Boolean(validationEvaluatorFactory && validationViewProjectorFactory);
      if (validationEnabled && strict && !splitValidationAvailable) {
        const error = new Error('Strict Maraca validation requires separate evaluator and View projector ports.');
        error.code = 'xtend.maraca.mvc.validation-ports-missing';
        throw error;
      }
      const validationEvaluator = validationEnabled && splitValidationAvailable
        ? validationEvaluatorFactory({
            validationPlan: asRecord(plan.validation).artifact,
            modelReader: state.modelReader || state.model
          })
        : null;
      const validationViewProjector = validationEnabled && splitValidationAvailable
        ? validationViewProjectorFactory({
            root,
            domRenderer: renderer,
            strict: asRecord(plan.validation).strict === true || strict,
            resolveTarget(target) { return viewProjectionPort.resolveTarget(target); }
          })
        : null;
      const validation = validationEnabled && !strict && !splitValidationAvailable && validationFactory ? validationFactory({
          validationPlan: asRecord(plan.validation).artifact,
          stateRuntime: state,
          root,
          windowTarget: options.windowTarget || null,
          diagnostics: asRecord(plan.validation).diagnostics || [],
          strict: asRecord(plan.validation).strict === true || strict,
          domRenderer: renderer
        }) : null;
      if (validationEnabled && strict && (
        !validationEvaluator
        || !validationViewProjector
        || typeof validationViewProjector.prepare !== 'function'
        || typeof validationViewProjector.finalize !== 'function'
      )) {
        const error = new Error('Strict Maraca validation requires the evaluator and View projector ports.');
        error.code = 'xtend.maraca.mvc.validation-ports-missing';
        throw error;
      }
      const actionFacade = Object.freeze({
        ...(action || {}),
        runAction: (id, input, actionMetadata) => dispatchCommand(id, input, actionMetadata),
        cancelAction: (id) => action && action.cancelAction ? action.cancelAction(id) : { status: 'cancelled', action: id }
      });
      const app = appFactory ? appFactory({
        actionRuntime: actionFacade,
        hostServices: hostServiceRegistry,
        managedModel: true,
        managedController: true,
        modelReader: state.modelReader || state.model,
        dispatchStreamPatch,
        fabric: options.fabric || null,
        kernelRuntime: options.kernelRuntime,
        kernelOrchestrationController: kernel,
        streamLifecycleActions: normalizedStreamLifecycleActions
      }) : null;
      const appFacade = createScheduledAppFacade(app);
      const dispatchEventCommand = (commandEnvelope, eventMetadata = {}) => {
        if (appFacade && typeof appFacade.dispatchCommand === 'function') {
          return appFacade.dispatchCommand(commandEnvelope, eventMetadata);
        }
        const envelope = asRecord(commandEnvelope);
        return dispatchCommand(
          envelope.command || envelope.id || envelope.action,
          clone(envelope.payload, {}),
          {
            ...eventMetadata,
            commandEnvelope: clone(envelope, {}),
            correlationId: envelope.correlationId || eventMetadata.correlationId || ''
          }
        );
      };
      const eventActionFacade = Object.freeze({
        ...actionFacade,
        dispatchCommand: dispatchEventCommand,
        runAction: (id, input, eventMetadata = {}) => dispatchCommand(id, input, eventMetadata)
      });
      const events = eventFactory ? eventFactory({
        events: artifact.events || [],
        commandBus: eventActionFacade,
        actionRuntime: eventActionFacade,
        root,
        domRenderer: renderer,
        targetResolver: typeof options.targetResolver === 'function'
          ? options.targetResolver
          : (binding, rootTarget) => viewProjectionPort.resolveBindingTarget(binding, rootTarget)
      }) : null;
      const surfaceController = options.surfaceController || (surfaceControllerFactory ? surfaceControllerFactory({
        managerId: options.surfaceControllerId || 'xtend.maraca.surface-controller',
        stateProjection: strict ? null : options.surfaceStateProjection,
        strict,
        fabric: options.fabric || null
      }) : null);
      ownsSurfaceController = Boolean(!options.surfaceController && surfaceController);
      if (strict && requiresSurfaceLifecycle && !surfaceController) {
        const error = new Error('Strict Maraca requires the Surface Controller lifecycle port.');
        error.code = 'xtend.maraca.mvc.surface-controller-missing';
        throw error;
      }
      const surfaceGraph = surfaceFactory ? surfaceFactory({
        surfaces,
        portals: asArray(artifact.portals).length ? artifact.portals : asArray(plan.portals),
        overlays: asArray(artifact.overlays).length ? artifact.overlays : asArray(plan.overlays),
        resourceManager: resourceManager || action && action.resourceManager || null,
        eventRuntime: events,
        domRenderer: renderer,
        documentTarget: viewDocumentTarget(),
        diagnosticsHub: options.diagnosticsHub,
        diagnosticChannel: options.diagnosticChannel,
        surfaceController,
        managerId: surfaceController && surfaceController.managerId
          || options.surfaceControllerId
          || 'xtend.maraca.surface-controller',
        strict
      }) : null;
      const injectedPresentationEffectPort = options.presentationEffectPort || options.presentationAdapter || null;
      let presentationEffectPort = injectedPresentationEffectPort;
      if (!presentationEffectPort && presentationEffectFactory) {
        presentationEffectPort = presentationEffectFactory({
          root,
          modelReader: state.modelReader || state.model || state,
          domRenderer: renderer,
          componentRegistry: options.componentRegistry,
          transitionRuntime: transitions,
          surfaceRuntime: surfaceGraph,
          surfaceLifecyclePort: surfaceController,
          componentCommandPort: options.invokeComponentCommand,
          customEffectAdapter: options.effectAdapter,
          resolveSurface: surfaceElement,
          refreshSurfaceIndex: reindexSurfaces,
          readProjectedVisibility(surfaceId, nextHidden) {
            const normalizedSurfaceId = String(surfaceId || '');
            if (projectedSurfaceVisibility.has(normalizedSurfaceId)) {
              return projectedSurfaceVisibility.get(normalizedSurfaceId);
            }
            const surface = surfaceById.get(normalizedSurfaceId);
            const stateSnapshot = typeof state.snapshot === 'function' ? state.snapshot() : null;
            const modelHidden = surface && stateSnapshot ? surfaceHidden(stateSnapshot, surface) : null;
            return modelHidden === null ? !nextHidden : modelHidden;
          },
          writeProjectedVisibility(surfaceId, nextHidden) {
            projectedSurfaceVisibility.set(String(surfaceId || ''), nextHidden === true);
          },
          captureDisposer,
          publishDiagnostic(diagnostic) {
            const details = asRecord(diagnostic && diagnostic.details);
            recordDiagnostic(
              diagnostic && diagnostic.code || 'xtend.maraca.mvc.presentation-adapter',
              diagnostic && diagnostic.severity || 'info',
              diagnostic && diagnostic.message || 'Presentation adapter diagnostic.',
              details
            );
          },
          windowTarget: options.windowTarget || null,
          strict
        });
        ownsPresentationEffectPort = Boolean(presentationEffectPort);
      }
      if (!presentationEffectPort && !strict && (options.effectAdapter || options.invokeComponentCommand)) {
        recordDiagnostic(
          'xtend.maraca.mvc.presentation-port-compatibility',
          'warning',
          'Compatibility mode wrapped legacy effect hooks in a PresentationEffectPort. Load the canonical presentation adapter instead.',
          { removal: '0.7.0' },
          true
        );
        presentationEffectPort = Object.freeze({
          schema: 'xtend.maraca.presentation-effect-port-compat.v1',
          async invoke(effect, effectContext) {
            let result;
            if (options.effectAdapter && typeof options.effectAdapter.invoke === 'function') {
              result = await options.effectAdapter.invoke(effect, effectContext);
            } else if (typeof options.effectAdapter === 'function') {
              result = await options.effectAdapter(effect, effectContext);
            }
            if (typeof result !== 'undefined') return result;
            if (effect && effect.componentCommand && typeof options.invokeComponentCommand === 'function') {
              return options.invokeComponentCommand(effect.componentCommand, immutableClone({
                schema: 'xtend.maraca.component-command-context.v1',
                phase: effectContext && effectContext.phase || 'after-render',
                action: effectContext && effectContext.action || '',
                metadata: effectContext && effectContext.metadata || {}
              }, {}));
            }
            return undefined;
          }
        });
      }
      if (presentationEffectPort && typeof presentationEffectPort.invoke !== 'function') {
        const error = new TypeError('The injected PresentationEffectPort must expose invoke(effect, context).');
        error.code = 'xtend.maraca.mvc.presentation-port-invalid';
        throw error;
      }
      if (!presentationEffectPort) {
        const diagnostic = recordDiagnostic(
          'xtend.maraca.mvc.presentation-port-missing',
          strict ? 'error' : 'warning',
          'The Maraca composition root could not construct a PresentationEffectPort.',
          {},
          true
        );
        if (strict) {
          const error = new Error(diagnostic.message);
          error.code = diagnostic.code;
          error.diagnostic = diagnostic;
          throw error;
        }
      }
      if (strict && requiresActionController && (!action || typeof action.runAction !== 'function')) {
        const error = new Error('Strict Maraca plans with actions require the Action command port.');
        error.code = 'xtend.maraca.mvc.action-command-port-missing';
        throw error;
      }
      if (strict && requiresActionController && (!app || typeof app.dispatchCommand !== 'function')) {
        const error = new Error('Strict Maraca plans with actions require the Application Controller port.');
        error.code = 'xtend.maraca.mvc.application-controller-port-missing';
        throw error;
      }
      if (strict && requiresEventRouter && (
        !events
        || typeof events.reconcile !== 'function'
        || typeof events.dispose !== 'function'
      )) {
        const error = new Error('Strict Maraca plans with application events require the Event Router port.');
        error.code = 'xtend.maraca.mvc.event-router-port-missing';
        throw error;
      }
      if (strict && requiresSurfaceLifecycle && (
        !surfaceController
        || typeof surfaceController.apply !== 'function'
        || typeof surfaceController.readSnapshot !== 'function'
        || typeof surfaceController.subscribe !== 'function'
        || typeof surfaceController.dispose !== 'function'
      )) {
        const error = new Error('Strict Maraca plans with surfaces require the complete Surface Controller lifecycle port.');
        error.code = 'xtend.maraca.mvc.surface-controller-port-incomplete';
        throw error;
      }
      if (strict && requiresSurfaceLifecycle && (
        !surfaceGraph
        || typeof surfaceGraph.materialize !== 'function'
        || typeof surfaceGraph.dispose !== 'function'
      )) {
        const error = new Error('Strict Maraca plans with surfaces require the Surface projection port.');
        error.code = 'xtend.maraca.mvc.surface-projection-port-missing';
        throw error;
      }
      if (strict && transitionsEnabled && !animation) {
        const error = new Error('Strict Maraca transition plans require the Animation adapter port.');
        error.code = 'xtend.maraca.mvc.animation-port-missing';
        throw error;
      }
      if (strict && transitionsEnabled && (
        !transitions
        || typeof transitions.findTransition !== 'function'
        || typeof transitions.applyVisibilityPatch !== 'function'
      )) {
        const error = new Error('Strict Maraca transition plans require the Transition Controller port.');
        error.code = 'xtend.maraca.mvc.transition-port-missing';
        throw error;
      }
      runtimes = {
        state,
        modelPlanningFactory: stateFactory,
        kernel,
        action,
        actionFacade,
        actionModelReaderPort,
        app,
        appFacade,
        hostServiceRegistry,
        resourceManager,
        animation,
        transitions,
        validationEvaluator,
        validationViewProjector,
        validation,
        events,
        surfaceController,
        surfaceGraph,
        presentationEffectPort,
        renderer
      };
      if (state && typeof state.subscribe === 'function') {
        const unsubscribe = state.subscribe((event) => {
          if (activeStateBuffer) {
            activeStateBuffer.events.push(event);
            return;
          }
          publish('state', { event });
          notifyModelSubscribers(event);
        });
        if (typeof unsubscribe === 'function') disposers.add(unsubscribe);
      }
      if (surfaceController && typeof surfaceController.subscribe === 'function') {
        const unsubscribe = surfaceController.subscribe((surfaceSnapshot) => {
          publish('surface-controller', { snapshot: immutableClone(surfaceSnapshot, {}) });
        });
        if (typeof unsubscribe === 'function') disposers.add(unsubscribe);
      }
      const initialStateSnapshot = state.snapshot();
      materializeSurfaces(initialStateSnapshot, {
        operation: options.adoptExisting === true
          ? 'maraca.boot.adopt-existing.surface-materialize'
          : 'maraca.boot.surface-materialize'
      });
      let initialCommit;
      if (options.adoptExisting === true) {
        reindexSurfaces();
        const adoptedNodes = viewChildNodes(root);
        initialCommit = {
          schema: DOM_COMMIT_SCHEMA,
          operation: 'reconcile-children',
          target: root,
          nodes: adoptedNodes,
          nodeCount: adoptedNodes.length,
          changed: false,
          structural: false,
          diagnostics: [],
          metadata: { operation: 'maraca.boot.adopt-existing' }
        };
      } else {
        initialCommit = fullRender({ operation: 'maraca.boot' }, initialStateSnapshot);
        recordDomCommit(initialCommit, { stateCommit: false, operation: 'maraca.boot' });
      }
      lastCommitReport = initialCommit;
      if (options.adoptExisting === true
        && runtimes.transitions
        && typeof runtimes.transitions.adoptVisibility === 'function') {
        surfaces.forEach((surface) => {
          const surfaceId = String(surface && surface.id || '');
          const element = surfaceElement(surfaceId);
          if (!surfaceId || !element) return;
          const adoption = runtimes.transitions.adoptVisibility({ surface: surfaceId, element });
          if (adoption && typeof adoption.hidden === 'boolean') {
            projectedSurfaceVisibility.set(surfaceId, adoption.hidden);
          }
        });
      }
      await syncOwnedVisibility(initialStateSnapshot, null, {
        operation: options.adoptExisting === true ? 'maraca.boot.adopt-existing.visibility' : 'maraca.boot.visibility',
        phase: 'boot'
      });
      assertCurrentBoot();
      reconcileEvents(initialCommit);
      if (options.hydrateOnBoot !== false) {
        await hydrate(null, { operation: options.adoptExisting === true ? 'maraca.boot.adopt-existing' : 'maraca.boot' });
        assertCurrentBoot();
      }
      phase = 'ready';
      publish('ready');
      return snapshot();
    })().catch((error) => {
      if (phase !== 'disposed' && generation === bootGeneration) {
        phase = 'failed';
        recordDiagnostic('maraca.plan-runtime.boot-failed', 'error', error.message);
        teardownAdapters(false);
      }
      throw error;
    });
    bootPromise = raceDisposed(pendingBoot);
    return bootPromise;
  }

  function snapshot() {
    return immutableClone({
      schema: PLAN_RUNTIME_SCHEMA,
      phase,
      generation,
      renderCount,
      commitCount,
      stateCommitCount,
      lastCommit,
      lastEvent: lastPublishedEvent,
      domWriterSchema: runtimes && runtimes.renderer && runtimes.renderer.schema || null,
      diagnostics,
      state: runtimes && runtimes.state && runtimes.state.snapshot ? runtimes.state.snapshot() : null,
      actions: runtimes && runtimes.action && runtimes.action.listHistory ? runtimes.action.listHistory() : [],
      events: runtimes && runtimes.events && runtimes.events.listRoutes ? runtimes.events.listRoutes() : [],
      appRuntime: runtimes && runtimes.app && runtimes.app.listCommands ? {
        schema: runtimes.appFacade && runtimes.appFacade.schema || runtimes.app.schema,
        rawSchema: runtimes.app.schema,
        facade: runtimes.appFacade && runtimes.appFacade.facade || null,
        capabilities: {
          commandFacade: Boolean(runtimes.appFacade && typeof runtimes.appFacade.command === 'function'),
          streamLifecycle: Boolean(runtimes.appFacade && typeof runtimes.appFacade.handleStreamPatch === 'function'),
          reducerRecipes: Boolean(runtimes.appFacade && typeof runtimes.appFacade.applyRecipe === 'function')
        },
        commands: runtimes.app.listCommands(),
        streamPatches: typeof runtimes.app.listStreamPatches === 'function' ? runtimes.app.listStreamPatches() : [],
        streams: typeof runtimes.app.listStreams === 'function' ? runtimes.app.listStreams() : [],
        streamPressureRecords: typeof runtimes.app.listStreamPressureRecords === 'function' ? runtimes.app.listStreamPressureRecords() : [],
        yieldActions: typeof runtimes.app.listYieldActions === 'function' ? runtimes.app.listYieldActions() : [],
        performanceTelemetry: typeof runtimes.app.getPerformanceTelemetrySnapshot === 'function' ? runtimes.app.getPerformanceTelemetrySnapshot() : null,
        panicRecovery: typeof runtimes.app.getPanicRecoverySnapshot === 'function' ? runtimes.app.getPanicRecoverySnapshot() : null,
        diagnostics: typeof runtimes.app.listDiagnostics === 'function' ? runtimes.app.listDiagnostics() : []
      } : null,
      surfaces: runtimes && runtimes.surfaceGraph && runtimes.surfaceGraph.getSnapshot
        ? runtimes.surfaceGraph.getSnapshot()
        : null,
      surfaceController: runtimes && runtimes.surfaceController && runtimes.surfaceController.readSnapshot
        ? runtimes.surfaceController.readSnapshot()
        : null,
      kernel: runtimes && runtimes.kernel && runtimes.kernel.snapshot ? runtimes.kernel.snapshot() : null,
      validation: Boolean(runtimes && (runtimes.validationEvaluator || runtimes.validation)),
      validationMode: runtimes && runtimes.validationEvaluator ? 'ports' : (runtimes && runtimes.validation ? 'compatibility' : 'disabled'),
      validationSnapshot: runtimes && runtimes.validationEvaluator && runtimes.validationEvaluator.snapshot
        ? runtimes.validationEvaluator.snapshot()
        : (runtimes && runtimes.validation && runtimes.validation.snapshot
            ? runtimes.validation.snapshot()
            : null),
      animationEngine: runtimes && runtimes.animation && runtimes.animation.snapshot
        ? runtimes.animation.snapshot()
        : null,
      transitions: Boolean(runtimes && runtimes.transitions),
      transitionSnapshot: runtimes && runtimes.transitions && runtimes.transitions.snapshot
        ? runtimes.transitions.snapshot()
        : null,
      surfaceGraph: Boolean(runtimes && runtimes.surfaceGraph)
    }, {});
  }

  function teardownAdapters(clearOwnedDom) {
    if (adaptersDisposed) return;
    adaptersDisposed = true;
    [...pendingScheduledWork].forEach((cancel) => cancel());
    pendingScheduledWork.clear();
    [...disposers].forEach((disposeHandle) => { try { disposeHandle(); } catch (_) {} });
    disposers.clear();
    const adapters = runtimes || {};
    const disposeOrder = ['presentationEffectPort', 'surfaceGraph', 'surfaceController', 'events', 'validationViewProjector', 'validationEvaluator', 'validation', 'transitions', 'animation', 'app', 'action', 'state'];
    disposeOrder.forEach((name) => {
      const adapter = adapters[name];
      if (!adapter) return;
      if (name === 'surfaceController' && !ownsSurfaceController) return;
      if (name === 'presentationEffectPort' && !ownsPresentationEffectPort) return;
      try {
        if (typeof adapter.dispose === 'function') adapter.dispose();
        else if (name === 'events' && typeof adapter.detachAll === 'function') adapter.detachAll();
      } catch (_) {}
    });
    if (ownsResourceManager && adapters.resourceManager
      && typeof adapters.resourceManager.listAcquisitions === 'function'
      && typeof adapters.resourceManager.releaseOwner === 'function') {
      const owners = new Set(adapters.resourceManager.listAcquisitions()
        .map((entry) => entry && entry.owner)
        .filter(Boolean));
      owners.forEach((owner) => {
        try { adapters.resourceManager.releaseOwner(owner); } catch (_) {}
      });
    }
    if (ownsHostServiceRegistry && adapters.hostServiceRegistry
      && typeof adapters.hostServiceRegistry.listSubscriptions === 'function'
      && typeof adapters.hostServiceRegistry.cancel === 'function') {
      adapters.hostServiceRegistry.listSubscriptions().forEach((subscription) => {
        try { adapters.hostServiceRegistry.cancel(subscription.id, 'maraca-plan-runtime-disposed'); } catch (_) {}
      });
    }
    let rendererDisposed = false;
    if (adapters.renderer && typeof adapters.renderer.dispose === 'function') {
      try {
        adapters.renderer.dispose(root, { clearOwnedDom });
        rendererDisposed = true;
      } catch (error) {
        recordDiagnostic(
          'rmt.dom.renderer-dispose-failed',
          'error',
          'The shared DOM renderer failed while disposing the Maraca root.',
          {
            clearOwnedDom,
            error: {
              name: String(error && error.name || 'Error'),
              message: String(error && error.message || error || 'Unknown renderer dispose failure')
            }
          }
        );
      }
    }
    if (!rendererDisposed && clearOwnedDom) {
      recordDiagnostic(
        'rmt.dom.dispose-root-clear-fallback',
        'warning',
        'The compatibility facade cleared owned root DOM because the shared renderer has no usable dispose() API.',
        {},
        true
      );
      try {
        if (!viewProjectionPort || typeof viewProjectionPort.clearOwnedDom !== 'function') {
          const error = new Error('The Maraca View Projection Port cannot clear owned DOM.');
          error.code = 'xtend.maraca.mvc.view-projection-port-invalid';
          throw error;
        }
        viewProjectionPort.clearOwnedDom();
      } catch (error) {
        recordDiagnostic(
          'rmt.dom.root-clear-failed',
          'error',
          'The Maraca compatibility facade failed to clear owned root DOM.',
          {
            clearOwnedDom: true,
            error: {
              name: String(error && error.name || 'Error'),
              message: String(error && error.message || error || 'Unknown root clear failure')
            }
          }
        );
      }
    }
    if (ownsKernel && adapters.kernel && typeof adapters.kernel.dispose === 'function') {
      try { adapters.kernel.dispose(); } catch (_) {}
    }
    if (viewProjectionPort && typeof viewProjectionPort.resetSurfaceIndex === 'function') {
      try { viewProjectionPort.resetSurfaceIndex(); } catch (_) {}
    }
    if (ownsViewProjectionPort && viewProjectionPort && typeof viewProjectionPort.dispose === 'function') {
      try { viewProjectionPort.dispose(); } catch (_) {}
    }
    projectedSurfaceVisibility.clear();
    ownsSurfaceController = false;
    ownsPresentationEffectPort = false;
    ownsViewProjectionPort = false;
  }

  function dispose() {
    if (phase === 'disposed') return false;
    phase = 'disposed';
    generation += 1;
    if (resolveDisposed) {
      resolveDisposed(runtimeDisposedError());
      resolveDisposed = null;
    }
    teardownAdapters(options.clearOwnedDom !== false);
    subscriptions.clear();
    modelSubscriptions.clear();
    return true;
  }

  const runtime = Object.freeze({
    schema: PLAN_RUNTIME_SCHEMA,
    boot,
    dispatchCommand,
    dispatchStreamPatch,
    render,
    refresh,
    snapshot,
    dispose,
    model: modelReader,
    get stateRuntime() {
      recordLegacyAdapter('stateRuntime');
      return modelReader;
    },
    get actionRuntime() {
      recordLegacyAdapter('actionRuntime');
      return legacyActionRuntime;
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      subscriptions.add(listener);
      return () => { subscriptions.delete(listener); };
    }
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
