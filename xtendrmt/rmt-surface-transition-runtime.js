(function attachRmtSurfaceTransitionRuntime(globalTarget) {
  const RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA = 'xtend.rmt.surface-transition-runtime.v1';
  const RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA = 'xtend.rmt.surface-transition-diagnostic.v1';

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

  function createDiagnostic(code, severity, message, details = {}) {
    return sanitizeDiagnostic({
      schema: RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      message,
      details
    });
  }

  function normalizeTransition(transition) {
    const source = objectRecord(transition);
    return {
      ...source,
      id: clampString(source.id || source.name),
      name: clampString(source.name || source.id),
      trigger: {
        kind: clampString(source.trigger && source.trigger.kind, 'action'),
        id: clampString(source.trigger && (source.trigger.id || source.trigger.ref || source.trigger.action))
      },
      from: toArray(source.from).map((entry) => clampString(entry)).filter(Boolean),
      to: toArray(source.to).map((entry) => clampString(entry)).filter(Boolean),
      effect: clampString(source.effect, 'fade'),
      durationMs: Math.max(0, Math.min(Math.round(Number(source.durationMs) || 0), 3000)),
      easing: clampString(source.easing, 'ease'),
      lane: clampString(source.lane, 'transition'),
      animation: source.animation || null,
      timeline: source.timeline || null,
      layoutKey: clampString(source.layoutKey, ''),
      interrupt: clampString(source.interrupt, 'replace'),
      reducedMotion: clampString(source.reducedMotion, 'fade'),
      keyframes: toArray(source.keyframes),
      springSamples: toArray(source.springSamples),
      operation: clampString(source.operation, `operation:xtend.rmt/surface-transition/${source.id || source.name || 'transition'}`),
      endpointName: clampString(source.endpointName)
    };
  }

  function normalizePlan(plan) {
    const source = objectRecord(plan);
    const transitions = toArray(source.transitions).map(normalizeTransition).filter((transition) => transition.id);
    return {
      ...source,
      transitions
    };
  }

  function transitionContainsSurface(transition, surfaceId) {
    return toArray(transition.from).includes(surfaceId) || toArray(transition.to).includes(surfaceId);
  }

  function findTransition(plan, metadata = {}) {
    const requestedId = clampString(metadata.transition || metadata.transitionId);
    if (requestedId) {
      const exact = plan.transitions.find((transition) => transition.id === requestedId);
      if (exact) return exact;
    }
    const action = clampString(metadata.action || metadata.actionId);
    const surface = clampString(metadata.surface || metadata.surfaceId);
    return plan.transitions.find((transition) => {
      const actionMatches = action && transition.trigger.kind === 'action' && transition.trigger.id === action;
      return actionMatches && (!surface || transitionContainsSurface(transition, surface));
    }) || null;
  }

  function readHidden(element) {
    if (!element) return false;
    if (typeof element.hasAttribute === 'function') return element.hasAttribute('hidden');
    if (typeof element.getAttribute === 'function') return element.getAttribute('hidden') != null;
    return Boolean(element.hidden);
  }

  function createRmtSurfaceTransitionRuntime(options = {}) {
    const transitionPlan = normalizePlan(options.transitionPlan || options.plan);
    const root = options.root || null;
    const kernelController = options.kernelController || null;
    const transitionStatePort = options.transitionStatePort || options.telemetryPort || null;
    const xUtils = options.xUtils || (globalTarget && globalTarget.XUtils) || null;
    const strict = options.strict === true || options.strictMaraca === true;
    let domRenderer = options.domRenderer || options.renderer || null;
    const diagnostics = toArray(options.diagnostics).map(sanitizeDiagnostic);
    const animationRuntimeFactory = globalTarget
      && globalTarget.XTendRmtAnimationEngineRuntime
      && typeof globalTarget.XTendRmtAnimationEngineRuntime.createRmtAnimationEngineRuntime === 'function'
      ? globalTarget.XTendRmtAnimationEngineRuntime.createRmtAnimationEngineRuntime
      : null;
    const ownsAnimationEngine = !options.animationEngine;
    let animationEngine = options.animationEngine || null;
    const history = [];
    const active = new Map();
    const transitionGroups = new Map();
    const knownVisibility = new Map();
    let fallbackCount = 0;
    let sharedRendererMissingReported = false;
    let compatibilityRendererAttempted = false;
    let compatibilityRendererUnavailableReported = false;
    let ownsDomRenderer = false;
    let disposed = false;

    function dispatchEvent(name, detail) {
      const target = options.windowTarget || globalTarget;
      if (!target || typeof target.dispatchEvent !== 'function' || typeof target.CustomEvent !== 'function') return;
      target.dispatchEvent(new target.CustomEvent(name, { detail }));
    }

    function publishDiagnostic(diagnostic) {
      const safeDiagnostic = sanitizeDiagnostic(diagnostic);
      diagnostics.push(safeDiagnostic);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(safeDiagnostic);
      return safeDiagnostic;
    }

    function sharedRenderer(target = null) {
      if (domRenderer && typeof domRenderer.commit === 'function') return domRenderer;
      if (!sharedRendererMissingReported) {
        sharedRendererMissingReported = true;
        publishDiagnostic(createDiagnostic(
          'rmt.dom.shared-renderer-missing',
          strict ? 'error' : 'warning',
          strict
            ? 'SurfaceTransition requires the shared RMT DOM renderer in strict mode.'
            : 'SurfaceTransition is creating one compatibility renderer because no shared renderer was injected.',
          { adapter: 'surface-transition-runtime' }
        ));
      }
      if (strict) {
        const error = new Error('Strict SurfaceTransition requires the shared RMT DOM renderer.');
        error.code = 'rmt.dom.shared-renderer-missing';
        throw error;
      }
      if (!compatibilityRendererAttempted) {
        compatibilityRendererAttempted = true;
        const factory = globalTarget
          && globalTarget.XTendRmtDomDescriptorRenderer
          && globalTarget.XTendRmtDomDescriptorRenderer.createRmtDomDescriptorRenderer;
        const documentTarget = options.documentTarget
          || target && target.ownerDocument
          || root && root.ownerDocument
          || globalTarget && globalTarget.document
          || null;
        if (typeof factory === 'function' && documentTarget) {
          try {
            domRenderer = factory({
              documentTarget,
              diagnosticsHub: options.diagnosticsHub,
              diagnosticChannel: options.diagnosticChannel
            });
            ownsDomRenderer = Boolean(domRenderer && typeof domRenderer.commit === 'function');
          } catch (_) {
            domRenderer = null;
          }
        }
      }
      if (domRenderer && typeof domRenderer.commit === 'function') return domRenderer;
      if (!compatibilityRendererUnavailableReported) {
        compatibilityRendererUnavailableReported = true;
        publishDiagnostic(createDiagnostic(
          'rmt.dom.compatibility-renderer-unavailable',
          'error',
          'SurfaceTransition could not create the required compatibility DOM renderer.',
          { adapter: 'surface-transition-runtime' }
        ));
      }
      const error = new Error('SurfaceTransition requires a DOM renderer; compatibility renderer creation failed.');
      error.code = 'rmt.dom.compatibility-renderer-unavailable';
      throw error;
    }

    function commitVisibility(element, attributes, sourcePointer) {
      if (!element) return false;
      const renderer = sharedRenderer(element);
      if (!renderer) return false;
      renderer.commit({
        operation: 'merge-element',
        target: element,
        descriptor: {
          type: 'element',
          tag: clampString(element.localName || element.tagName, 'div').toLowerCase(),
          namespace: clampString(element.namespaceURI),
          attributes
        },
        context: {
          source: {
            nodeId: clampString(element.getAttribute && element.getAttribute('data-maraca-surface'), 'surface-transition'),
            pointer: sourcePointer
          }
        },
          ownership: {
            owner: 'transition-runtime',
            domains: {
              attributes: 'transition-runtime',
              styleTokens: 'transition-runtime',
              visibility: 'transition-runtime'
            },
          mode: strict ? 'strict' : 'compatibility'
        }
      });
      return true;
    }

    function writeHidden(element, hidden) {
      if (!element) return;
      commitVisibility(element, {
        hidden: hidden ? '' : null,
        style: {
          display: hidden ? 'none' : ''
        }
      }, '/transition/visibility');
    }

    function writeTransitioning(element, transitioning) {
      if (!element) return;
      commitVisibility(element, {
        'data-xt-surface-transitioning': transitioning ? 'true' : null
      }, '/transition/phase');
    }

    function resetStyles(element) {
      if (!element) return;
      if (typeof element.getAnimations === 'function') {
        try {
          element.getAnimations().forEach((animation) => {
            if (animation && typeof animation.cancel === 'function') animation.cancel();
          });
        } catch (_) {
          // Native animation handles may already have been released.
        }
      }
      commitVisibility(element, {
        'data-xt-surface-transitioning': null,
        style: {
          transition: '',
          opacity: '',
          transform: '',
          filter: ''
        }
      }, '/transition/finalize');
    }

    function ensureAnimationEngine(target = null) {
      if (animationEngine || !animationRuntimeFactory) return animationEngine;
      const renderer = sharedRenderer(target);
      animationEngine = animationRuntimeFactory({
        animationPlan: transitionPlan.animationEngine || transitionPlan,
        xUtils,
        domRenderer: renderer,
        documentTarget: options.documentTarget,
        diagnosticsHub: options.diagnosticsHub,
        diagnosticChannel: options.diagnosticChannel,
        windowTarget: options.windowTarget || globalTarget,
        diagnostics,
        strict,
        publishDiagnostic: options.publishDiagnostic
      });
      return animationEngine;
    }

    if (!animationEngine && animationRuntimeFactory && domRenderer && typeof domRenderer.commit === 'function') {
      ensureAnimationEngine();
    }

    function publishTransitionState(transition, status, detail = {}) {
      if (!transitionStatePort || !transition) return;
      const projection = Object.freeze({
        schema: 'xtend.rmt.surface-transition-state-projection.v1',
        transition: transition.id,
        status,
        effect: transition.effect,
        durationMs: transition.durationMs,
        from: transition.from.slice(),
        to: transition.to.slice(),
        lastResult: sanitizeDiagnostic(detail)
      });
      if (typeof transitionStatePort.apply === 'function') transitionStatePort.apply(projection);
      else if (typeof transitionStatePort.publish === 'function') transitionStatePort.publish(projection);
    }

    function resolveElement(surfaceId, explicitElement = null) {
      if (explicitElement) return explicitElement;
      if (!root || typeof root.querySelectorAll !== 'function') return null;
      return Array.from(root.querySelectorAll('[data-maraca-surface]')).find((element) => (
        element && typeof element.getAttribute === 'function' && element.getAttribute('data-maraca-surface') === surfaceId
      )) || null;
    }

    function getTransitionGroup(transition) {
      const id = transition && transition.id || 'unknown';
      if (!transitionGroups.has(id)) {
        transitionGroups.set(id, {
          id,
          exitPromises: new Set(),
          enterWaiters: []
        });
      }
      return transitionGroups.get(id);
    }

    function hasVisibleFromSurface(transition) {
      return toArray(transition && transition.from).some((surfaceId) => knownVisibility.get(surfaceId) === false);
    }

    function adoptVisibility(input = {}) {
      const surfaceId = clampString(input.surface || input.surfaceId);
      const element = resolveElement(surfaceId, input.element || null);
      if (!element) {
        const error = new Error(`Surface transition adoption could not resolve ${surfaceId || 'surface'}.`);
        error.code = 'rmt.surface_transition.adopt_target_missing';
        throw error;
      }
      const hidden = readHidden(element);
      knownVisibility.set(surfaceId, hidden);
      fallbackCount += 1;
      const diagnostic = publishDiagnostic(createDiagnostic(
        'rmt.surface_transition.dom_visibility_adopted',
        'warning',
        'Surface visibility was adopted from DOM for compatibility; managed transitions must pass previousHidden.',
        { surface: surfaceId, hidden }
      ));
      return Object.freeze({
        schema: 'xtend.rmt.surface-transition-adoption.v1',
        surface: surfaceId,
        hidden,
        diagnostic
      });
    }

    function resolveEnterWaitersIfReady(transition) {
      const group = getTransitionGroup(transition);
      if (group.exitPromises.size > 0 || hasVisibleFromSurface(transition)) return;
      const waiters = group.enterWaiters.splice(0, group.enterWaiters.length);
      waiters.forEach((resolve) => resolve({ status: 'ready' }));
    }

    function waitForExitPhase(transition) {
      const group = getTransitionGroup(transition);
      const exitPromises = Array.from(group.exitPromises);
      if (exitPromises.length > 0) {
        return Promise.allSettled(exitPromises).then(() => ({ status: 'ready' }));
      }
      if (!hasVisibleFromSurface(transition)) {
        return Promise.resolve({ status: 'ready' });
      }
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          const diagnostic = publishDiagnostic(createDiagnostic(
            'rmt.surface_transition.enter_wait_timeout',
            options.strict ? 'error' : 'warning',
            'Surface transition enter phase waited for exit surfaces and used delayed materialization timeout.',
            { transition: transition && transition.id || null }
          ));
          if (!options.strict) fallbackCount += 1;
          resolve({ status: 'timeout', diagnostic });
        }, Math.max(120, Number(transition && transition.durationMs) || 0) + 500);
        group.enterWaiters.push((result) => {
          clearTimeout(timeout);
          resolve(result || { status: 'ready' });
        });
      });
    }

    async function runEffect(element, transition, phase, metadata = {}) {
      ensureAnimationEngine(element);
      const input = {
        target: element,
        effect: transition.effect,
        phase,
        durationMs: transition.durationMs,
        easing: transition.easing,
        transitionId: transition.id,
        metadata
      };
      if (animationEngine && typeof animationEngine.runSurfaceTransitionPhase === 'function') {
        return animationEngine.runSurfaceTransitionPhase({
          target: element,
          transition,
          phase,
          metadata
        });
      }
      if (xUtils && typeof xUtils.runUiTransition === 'function') {
        return xUtils.runUiTransition(input);
      }
      fallbackCount += 1;
      publishDiagnostic(createDiagnostic(
        'rmt.surface_transition.xutils_missing',
        'warning',
        'Surface transition used instant fallback because x-utils transition runner is unavailable.',
        { transition: transition.id, phase }
      ));
      dispatchEvent('xtend-maraca:surface-transition-fallback', {
        schema: 'xtend.rmt.surface-transition-fallback.v1',
        transition: transition.id,
        phase,
        reason: 'xutils-missing'
      });
      return { schema: 'xtend.utility.ui-transition-result.v1', status: 'fallback', instant: true };
    }

    async function runVisibilityPatch(input = {}) {
      const surfaceId = clampString(input.surface || input.surfaceId);
      const element = resolveElement(surfaceId, input.element || null);
      const transition = input.transition || findTransition(transitionPlan, {
        ...input.metadata,
        action: input.action,
        surface: surfaceId
      });
      const nextHidden = input.nextHidden === true;
      let previousHidden;
      if (Object.prototype.hasOwnProperty.call(input, 'previousHidden')) {
        previousHidden = input.previousHidden === true;
        knownVisibility.set(surfaceId, previousHidden);
      } else if (strict) {
        const diagnostic = publishDiagnostic(createDiagnostic(
          'rmt.surface_transition.previous_visibility_required',
          'error',
          'Strict surface transitions require explicit previousHidden from the model patch plan.',
          { surface: surfaceId, transition: transition && transition.id || null }
        ));
        const error = new Error(diagnostic.message);
        error.code = diagnostic.code;
        error.diagnostic = diagnostic;
        throw error;
      } else {
        previousHidden = adoptVisibility({ surfaceId, element }).hidden;
      }

      if (disposed) {
        return {
          schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
          status: 'disposed',
          transition: transition && transition.id || null,
          surface: surfaceId
        };
      }
      if (!transition || !element || nextHidden === previousHidden) {
        if (element) sharedRenderer(element);
        writeHidden(element, nextHidden);
        knownVisibility.set(surfaceId, nextHidden);
        if (!nextHidden) resetStyles(element);
        return {
          schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
          status: transition ? 'unchanged' : 'unmatched',
          surface: surfaceId,
          hidden: nextHidden
        };
      }
      sharedRenderer(element);

      const phase = nextHidden ? 'exit' : 'enter';
      const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
      const previousActive = active.get(surfaceId);
      if (previousActive) {
        previousActive.cancelled = true;
        dispatchEvent('xtend-maraca:surface-transition-cancel', {
          schema: 'xtend.rmt.surface-transition-cancel.v1',
          transition: previousActive.transition,
          surface: surfaceId
        });
      }
      const activeRecord = { token, transition: transition.id, surface: surfaceId, element, cancelled: false };
      active.set(surfaceId, activeRecord);

      let resolveExitPromise = null;
      const transitionGroup = getTransitionGroup(transition);
      const exitPromise = nextHidden ? new Promise((resolve) => {
        resolveExitPromise = resolve;
      }) : null;
      if (exitPromise) transitionGroup.exitPromises.add(exitPromise);
      const completeExitGate = (result) => {
        if (!nextHidden || !exitPromise) return;
        transitionGroup.exitPromises.delete(exitPromise);
        if (resolveExitPromise) resolveExitPromise(result);
        resolveEnterWaitersIfReady(transition);
      };
      activeRecord.completeExitGate = completeExitGate;

      if (!nextHidden) {
        writeHidden(element, true);
        knownVisibility.set(surfaceId, true);
        const waitResult = transition.effect === 'crossfade' ? { status: 'ready' } : await waitForExitPhase(transition);
        if (waitResult && waitResult.status === 'timeout' && options.strict) {
          if (activeRecord.cancelled || active.get(surfaceId) !== activeRecord) {
            active.delete(surfaceId);
            return {
              schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
              status: 'cancelled',
              transition: transition.id,
              surface: surfaceId
            };
          }
          active.delete(surfaceId);
          throw new Error('Surface transition enter phase could not wait for exit surfaces.');
        }
        if (activeRecord.cancelled || active.get(surfaceId) !== activeRecord) {
          return {
            schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
            status: 'cancelled',
            transition: transition.id,
            surface: surfaceId
          };
        }
        writeHidden(element, false);
        knownVisibility.set(surfaceId, false);
      }
      publishTransitionState(transition, 'running', { phase, surface: surfaceId });
      writeTransitioning(element, true);
      const startDetail = {
        schema: 'xtend.rmt.surface-transition-start.v1',
        transition: transition.id,
        surface: surfaceId,
        phase,
        effect: transition.effect,
        durationMs: transition.durationMs,
        correlationId: input.metadata && input.metadata.correlationId || null
      };
      history.push({ ...startDetail, at: Date.now(), status: 'running' });
      dispatchEvent('xtend-maraca:surface-transition-start', startDetail);

      try {
        const effectResult = await runEffect(element, transition, phase, input.metadata || {});
        if (activeRecord.cancelled || active.get(surfaceId) !== activeRecord) {
          if (active.get(surfaceId) === activeRecord) resetStyles(element);
          completeExitGate({
            schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
            status: 'cancelled',
            transition: transition.id,
            surface: surfaceId
          });
          return {
            schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
            status: 'cancelled',
            transition: transition.id,
            surface: surfaceId
          };
        }
        const result = {
          schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
          status: effectResult && effectResult.status === 'fallback' ? 'fallback' : 'complete',
          transition: transition.id,
          surface: surfaceId,
          phase,
          hidden: nextHidden,
          effect: transition.effect
        };
        if (nextHidden) writeHidden(element, true);
        knownVisibility.set(surfaceId, nextHidden);
        resetStyles(element);
        active.delete(surfaceId);
        completeExitGate(result);
        publishTransitionState(transition, result.status, result);
        history.push({ ...result, at: Date.now() });
        dispatchEvent(result.status === 'fallback' ? 'xtend-maraca:surface-transition-fallback' : 'xtend-maraca:surface-transition-complete', result);
        return result;
      } catch (error) {
        active.delete(surfaceId);
        resetStyles(element);
        writeHidden(element, nextHidden);
        knownVisibility.set(surfaceId, nextHidden);
        completeExitGate({
          schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
          status: 'error',
          transition: transition.id,
          surface: surfaceId
        });
        const diagnostic = publishDiagnostic(createDiagnostic(
          'rmt.surface_transition.runtime_error',
          'error',
          error && error.message ? error.message : String(error || 'Surface transition failed.'),
          { transition: transition.id, surface: surfaceId, phase }
        ));
        publishTransitionState(transition, 'error', diagnostic);
        dispatchEvent('xtend-maraca:surface-transition-error', diagnostic);
        if (options.strict) throw error;
        return {
          schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
          status: 'error',
          transition: transition.id,
          surface: surfaceId,
          diagnostic
        };
      }
    }

    function applyVisibilityPatch(input = {}) {
      const transition = input.transition || findTransition(transitionPlan, {
        ...input.metadata,
        action: input.action,
        surface: input.surface || input.surfaceId
      });
      const work = () => runVisibilityPatch({ ...input, transition });
      if (transition && kernelController && kernelController.enabled && typeof kernelController.scheduleWork === 'function') {
        return kernelController.scheduleWork('surface-transition', work, {
          operation: transition.operation,
          transitionId: transition.id,
          action: transition.trigger && transition.trigger.id || input.action || '',
          surface: input.surface || input.surfaceId || '',
          correlationId: input.metadata && input.metadata.correlationId || ''
        });
      }
      return work();
    }

    function listActiveTransitions() {
      return Array.from(active.values()).map((entry) => {
        const { element, completeExitGate, ...safeEntry } = entry;
        return {
          ...cloneSafe(safeEntry, {}),
          targetConnected: Boolean(element && element.isConnected),
          hasExitGate: typeof completeExitGate === 'function'
        };
      });
    }

    function listDiagnostics() {
      return diagnostics.map((entry) => sanitizeDiagnostic(entry));
    }

    function snapshot() {
      return {
        schema: 'xtend.rmt.surface-transition-snapshot.v1',
        planSchema: transitionPlan.schema || null,
        transitionCount: transitionPlan.transitions.length,
        animationEngine: animationEngine && typeof animationEngine.snapshot === 'function' ? animationEngine.snapshot() : null,
        activeTransitions: listActiveTransitions(),
        disposed,
        fallbackCount,
        history: history.slice(-50),
        diagnostics: listDiagnostics()
      };
    }

    function dispose() {
      if (disposed) {
        return {
          schema: 'xtend.rmt.surface-transition-dispose-report.v1',
          disposed: true,
          alreadyDisposed: true,
          cancelledCount: 0
        };
      }
      disposed = true;
      const records = Array.from(active.values());
      records.forEach((record) => {
        record.cancelled = true;
        resetStyles(record.element);
        if (typeof record.completeExitGate === 'function') {
          record.completeExitGate({
            schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
            status: 'disposed',
            transition: record.transition,
            surface: record.surface
          });
        }
      });
      active.clear();
      knownVisibility.clear();
      transitionGroups.forEach((group) => {
        const waiters = group.enterWaiters.splice(0, group.enterWaiters.length);
        waiters.forEach((resolve) => resolve({ status: 'disposed' }));
        group.exitPromises.clear();
      });
      transitionGroups.clear();
      if (ownsAnimationEngine && animationEngine && typeof animationEngine.dispose === 'function') {
        animationEngine.dispose();
      }
      if (ownsDomRenderer && domRenderer && typeof domRenderer.dispose === 'function') {
        try {
          domRenderer.dispose(undefined, { clearOwnedDom: false });
        } catch (_) {
          // Compatibility renderer cleanup is best-effort and idempotent.
        }
      }
      ownsDomRenderer = false;
      return {
        schema: 'xtend.rmt.surface-transition-dispose-report.v1',
        disposed: true,
        alreadyDisposed: false,
        cancelledCount: records.length
      };
    }

    return Object.freeze({
      schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
      transitionPlan,
      adoptVisibility,
      applyVisibilityPatch,
      findTransition: (metadata = {}) => findTransition(transitionPlan, metadata),
      listActiveTransitions,
      listDiagnostics,
      snapshot,
      dispose
    });
  }

  const api = {
    RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA,
    RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
    createRmtSurfaceTransitionRuntime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtSurfaceTransitionRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_SURFACE_TRANSITION_RUNTIME_API__ = globalThis.XTendRmtSurfaceTransitionRuntime;

export const RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_SURFACE_TRANSITION_RUNTIME_API__.RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA;
export const RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA = __XTEND_RMT_SURFACE_TRANSITION_RUNTIME_API__.RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA;
export const createRmtSurfaceTransitionRuntime = __XTEND_RMT_SURFACE_TRANSITION_RUNTIME_API__.createRmtSurfaceTransitionRuntime;

export default __XTEND_RMT_SURFACE_TRANSITION_RUNTIME_API__;
