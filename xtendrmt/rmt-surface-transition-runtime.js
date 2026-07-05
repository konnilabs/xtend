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

  function setHidden(element, hidden) {
    if (!element) return;
    if (hidden) {
      if (typeof element.setAttribute === 'function') element.setAttribute('hidden', '');
      if (element.style) {
        element.style.display = 'none';
        if (typeof element.setAttribute === 'function') element.setAttribute('data-rmt-hidden-display', 'true');
      }
      return;
    }
    if (typeof element.removeAttribute === 'function') element.removeAttribute('hidden');
    if (element.style) {
      element.style.display = '';
      if (typeof element.removeAttribute === 'function') element.removeAttribute('data-rmt-hidden-display');
    }
  }

  function readHidden(element) {
    if (!element) return false;
    if (typeof element.hasAttribute === 'function') return element.hasAttribute('hidden');
    if (typeof element.getAttribute === 'function') return element.getAttribute('hidden') != null;
    return Boolean(element.hidden);
  }

  function setTransitioning(element, transitioning) {
    if (!element || typeof element.setAttribute !== 'function' || typeof element.removeAttribute !== 'function') return;
    if (transitioning) {
      element.setAttribute('data-xt-surface-transitioning', 'true');
      return;
    }
    element.removeAttribute('data-xt-surface-transitioning');
  }

  function resetTransitionStyles(element) {
    if (!element) return;
    if (typeof element.getAnimations === 'function') {
      try {
        element.getAnimations().forEach((animation) => {
          if (animation && typeof animation.cancel === 'function') animation.cancel();
        });
      } catch (_) {
        // Best-effort cleanup: animation handles may be unavailable in test doubles.
      }
    }
    if (element.style) {
      element.style.transition = '';
      element.style.opacity = '';
      element.style.transform = '';
      element.style.filter = '';
    }
    setTransitioning(element, false);
  }

  function createRmtSurfaceTransitionRuntime(options = {}) {
    const transitionPlan = normalizePlan(options.transitionPlan || options.plan);
    const root = options.root || null;
    const kernelController = options.kernelController || null;
    const xstate = options.xstate || (globalTarget && globalTarget.xstate) || null;
    const xUtils = options.xUtils || (globalTarget && globalTarget.XUtils) || null;
    const diagnostics = toArray(options.diagnostics).map(sanitizeDiagnostic);
    const animationRuntimeFactory = globalTarget
      && globalTarget.XTendRmtAnimationEngineRuntime
      && typeof globalTarget.XTendRmtAnimationEngineRuntime.createRmtAnimationEngineRuntime === 'function'
      ? globalTarget.XTendRmtAnimationEngineRuntime.createRmtAnimationEngineRuntime
      : null;
    const animationEngine = options.animationEngine || (animationRuntimeFactory ? animationRuntimeFactory({
      animationPlan: transitionPlan.animationEngine || transitionPlan,
      xUtils,
      windowTarget: options.windowTarget || globalTarget,
      diagnostics,
      strict: options.strict,
      publishDiagnostic: options.publishDiagnostic
    }) : null);
    const history = [];
    const active = new Map();
    const transitionGroups = new Map();
    let fallbackCount = 0;

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

    function writeXState(transition, status, detail = {}) {
      if (!xstate || typeof xstate.set !== 'function' || !transition) return;
      const base = `xtend.surface.transition.${transition.id}`;
      xstate.set(`${base}.status`, status);
      xstate.set(`${base}.effect`, transition.effect);
      xstate.set(`${base}.durationMs`, transition.durationMs);
      xstate.set(`${base}.from`, transition.from.slice());
      xstate.set(`${base}.to`, transition.to.slice());
      xstate.set(`${base}.lastResult`, sanitizeDiagnostic(detail));
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
      return toArray(transition && transition.from).some((surfaceId) => {
        const element = resolveElement(surfaceId);
        return element && !readHidden(element);
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
      const previousHidden = Object.prototype.hasOwnProperty.call(input, 'previousHidden')
        ? input.previousHidden === true
        : readHidden(element);

      if (!transition || !element || nextHidden === previousHidden) {
        setHidden(element, nextHidden);
        if (!nextHidden) resetTransitionStyles(element);
        return {
          schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
          status: transition ? 'unchanged' : 'unmatched',
          surface: surfaceId,
          hidden: nextHidden
        };
      }

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
      const activeRecord = { token, transition: transition.id, surface: surfaceId, cancelled: false };
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

      if (!nextHidden) {
        setHidden(element, true);
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
        setHidden(element, false);
      }
      writeXState(transition, 'running', { phase, surface: surfaceId });
      setTransitioning(element, true);
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
          resetTransitionStyles(element);
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
        if (nextHidden) setHidden(element, true);
        resetTransitionStyles(element);
        active.delete(surfaceId);
        completeExitGate(result);
        writeXState(transition, result.status, result);
        history.push({ ...result, at: Date.now() });
        dispatchEvent(result.status === 'fallback' ? 'xtend-maraca:surface-transition-fallback' : 'xtend-maraca:surface-transition-complete', result);
        return result;
      } catch (error) {
        active.delete(surfaceId);
        resetTransitionStyles(element);
        setHidden(element, nextHidden);
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
        writeXState(transition, 'error', diagnostic);
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
      return Array.from(active.values()).map((entry) => cloneSafe(entry, {}));
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
        fallbackCount,
        history: history.slice(-50),
        diagnostics: listDiagnostics()
      };
    }

    return Object.freeze({
      schema: RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA,
      transitionPlan,
      applyVisibilityPatch,
      findTransition: (metadata = {}) => findTransition(transitionPlan, metadata),
      listActiveTransitions,
      listDiagnostics,
      snapshot
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
