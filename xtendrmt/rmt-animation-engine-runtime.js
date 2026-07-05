(function attachRmtAnimationEngineRuntime(globalTarget) {
  const RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA = 'xtend.rmt.animation-engine-runtime.v1';
  const RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA = 'xtend.rmt.animation-engine-diagnostic.v1';

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
      schema: RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      message,
      details
    });
  }

  function normalizeMotionTransition(transition) {
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
      animation: clampString(source.animation, ''),
      effect: clampString(source.effect, 'fade'),
      durationMs: Math.max(0, Math.min(Math.round(Number(source.durationMs) || 0), 3000)),
      easing: clampString(source.easing, 'ease'),
      lane: clampString(source.lane, 'transition'),
      layoutKey: clampString(source.layoutKey, ''),
      interrupt: clampString(source.interrupt, 'replace'),
      reducedMotion: clampString(source.reducedMotion, 'fade'),
      timeline: source.timeline || null,
      phasing: clampString(source.phasing, source.effect === 'crossfade' ? 'overlap' : 'serial'),
      keyframes: toArray(source.keyframes),
      springSamples: toArray(source.springSamples),
      operation: clampString(source.operation),
      endpointName: clampString(source.endpointName)
    };
  }

  function normalizeAnimationPlan(plan) {
    const source = objectRecord(plan);
    return {
      ...source,
      animations: toArray(source.animations).map((animation) => objectRecord(animation)).filter((animation) => animation.id),
      transitions: toArray(source.transitions).map(normalizeMotionTransition).filter((transition) => transition.id)
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

  function prefersReducedMotion(windowTarget) {
    const target = windowTarget || globalTarget;
    if (!target || typeof target.matchMedia !== 'function') return false;
    try {
      return target.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
    } catch (_) {
      return false;
    }
  }

  function resolveReducedMotion(transition, phase, windowTarget) {
    if (!prefersReducedMotion(windowTarget)) return transition;
    const policy = transition.reducedMotion || 'fade';
    if (policy === 'none') {
      return {
        ...transition,
        effect: 'none',
        durationMs: 0
      };
    }
    if (policy === 'instant') {
      return {
        ...transition,
        effect: 'none',
        durationMs: 0,
        instant: true
      };
    }
    return {
      ...transition,
      effect: phase === 'exit' || phase === 'enter' ? 'fade' : transition.effect,
      durationMs: Math.min(transition.durationMs, 120)
    };
  }

  function createRmtAnimationEngineRuntime(options = {}) {
    const animationPlan = normalizeAnimationPlan(options.animationPlan || options.plan || options.transitionPlan);
    const xUtils = options.xUtils || (globalTarget && globalTarget.XUtils) || null;
    const windowTarget = options.windowTarget || globalTarget;
    const diagnostics = toArray(options.diagnostics).map(sanitizeDiagnostic);
    const active = new Map();
    const history = [];
    let fallbackCount = 0;

    function dispatchEvent(name, detail) {
      const target = windowTarget || globalTarget;
      if (!target || typeof target.dispatchEvent !== 'function' || typeof target.CustomEvent !== 'function') return;
      target.dispatchEvent(new target.CustomEvent(name, { detail }));
    }

    function publishDiagnostic(diagnostic) {
      const safeDiagnostic = sanitizeDiagnostic(diagnostic);
      diagnostics.push(safeDiagnostic);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(safeDiagnostic);
      return safeDiagnostic;
    }

    function activeKey(input = {}) {
      const target = input.target || input.element || null;
      if (target) return target;
      return clampString(input.surface || input.surfaceId || input.transitionId || input.transition && input.transition.id, 'global');
    }

    async function runSurfaceTransitionPhase(input = {}) {
      const transition = input.transition
        ? normalizeMotionTransition(input.transition)
        : findTransition(animationPlan, input.metadata || input) || null;
      const target = input.target || input.element || null;
      const phase = clampString(input.phase, 'enter');
      if (!transition || !target) {
        return {
          schema: RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA,
          status: transition ? 'unmatched-target' : 'unmatched-transition',
          phase
        };
      }

      const key = activeKey({ ...input, transition });
      const previous = active.get(key);
      if (previous) {
        previous.cancelled = true;
        dispatchEvent('xtend-rmt:animation-interrupt', {
          schema: 'xtend.rmt.animation-interrupt.v1',
          transition: previous.transition,
          phase: previous.phase,
          policy: transition.interrupt
        });
        if (transition.interrupt === 'finish' && previous.promise && typeof previous.promise.then === 'function') {
          await previous.promise.catch(() => null);
        }
      }

      const resolved = resolveReducedMotion(transition, phase, windowTarget);
      const activeRecord = {
        transition: transition.id,
        phase,
        cancelled: false,
        startedAt: Date.now()
      };
      active.set(key, activeRecord);
      const startDetail = {
        schema: 'xtend.rmt.animation-start.v1',
        transition: transition.id,
        animation: transition.animation || null,
        effect: resolved.effect,
        phase,
        durationMs: resolved.durationMs,
        layoutKey: transition.layoutKey || null,
        correlationId: input.metadata && input.metadata.correlationId || null
      };
      history.push({ ...startDetail, status: 'running', at: activeRecord.startedAt });
      dispatchEvent('xtend-rmt:animation-start', startDetail);
      dispatchEvent('xtend-rmt:animation-phase', {
        schema: 'xtend.rmt.animation-phase.v1',
        transition: transition.id,
        phase,
        timeline: cloneSafe(transition.timeline, null)
      });

      const work = (async () => {
        try {
          if (!xUtils || typeof xUtils.runUiTransition !== 'function') {
            fallbackCount += 1;
            publishDiagnostic(createDiagnostic(
              'rmt.animation_engine.xutils_missing',
              'warning',
              'AnimationEngine used instant fallback because x-utils transition runner is unavailable.',
              { transition: transition.id, phase }
            ));
            dispatchEvent('xtend-rmt:animation-fallback', {
              schema: 'xtend.rmt.animation-fallback.v1',
              transition: transition.id,
              phase,
              reason: 'xutils-missing'
            });
            return {
              schema: 'xtend.utility.ui-transition-result.v1',
              status: 'fallback',
              instant: true
            };
          }

          const result = await xUtils.runUiTransition({
            target,
            effect: resolved.effect,
            phase,
            durationMs: resolved.durationMs,
            easing: resolved.easing,
            transitionId: transition.id,
            animationId: transition.animation || '',
            layoutKey: transition.layoutKey || '',
            timeline: cloneSafe(transition.timeline, null),
            keyframes: cloneSafe(transition.keyframes, []),
            springSamples: cloneSafe(transition.springSamples, []),
            allowFilter: resolved.effect === 'fade-blur',
            metadata: input.metadata || {}
          });
          return result || {
            schema: 'xtend.utility.ui-transition-result.v1',
            status: 'complete'
          };
        } catch (error) {
          const diagnostic = publishDiagnostic(createDiagnostic(
            'rmt.animation_engine.runtime_error',
            options.strict ? 'error' : 'warning',
            error && error.message ? error.message : String(error || 'AnimationEngine transition failed.'),
            { transition: transition.id, phase }
          ));
          if (options.strict) throw error;
          return {
            schema: 'xtend.utility.ui-transition-result.v1',
            status: 'fallback',
            diagnostic
          };
        }
      })();
      activeRecord.promise = work;
      const effectResult = await work;

      if (activeRecord.cancelled || active.get(key) !== activeRecord) {
        return {
          schema: RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA,
          status: 'cancelled',
          transition: transition.id,
          phase
        };
      }

      active.delete(key);
      const result = {
        schema: RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA,
        status: effectResult && effectResult.status === 'fallback' ? 'fallback' : 'complete',
        transition: transition.id,
        phase,
        effect: resolved.effect,
        durationMs: resolved.durationMs,
        fallback: effectResult && effectResult.status === 'fallback' || false,
        result: cloneSafe(effectResult, {})
      };
      history.push({ ...result, at: Date.now() });
      dispatchEvent(result.status === 'fallback' ? 'xtend-rmt:animation-fallback' : 'xtend-rmt:animation-complete', result);
      return result;
    }

    function listActiveAnimations() {
      return Array.from(active.values()).map((entry) => cloneSafe(entry, {}));
    }

    function listDiagnostics() {
      return diagnostics.map((entry) => sanitizeDiagnostic(entry));
    }

    function snapshot() {
      return {
        schema: 'xtend.rmt.animation-engine-snapshot.v1',
        planSchema: animationPlan.schema || null,
        animationCount: animationPlan.animations.length,
        transitionCount: animationPlan.transitions.length,
        activeAnimations: listActiveAnimations(),
        fallbackCount,
        history: history.slice(-50),
        diagnostics: listDiagnostics()
      };
    }

    return Object.freeze({
      schema: RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA,
      animationPlan,
      runSurfaceTransitionPhase,
      runTransition: runSurfaceTransitionPhase,
      findTransition: (metadata = {}) => findTransition(animationPlan, metadata),
      listActiveAnimations,
      listDiagnostics,
      snapshot
    });
  }

  const api = {
    RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA,
    RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA,
    createRmtAnimationEngineRuntime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtAnimationEngineRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_ANIMATION_ENGINE_RUNTIME_API__ = globalThis.XTendRmtAnimationEngineRuntime;

export const RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA = __XTEND_RMT_ANIMATION_ENGINE_RUNTIME_API__.RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA;
export const RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA = __XTEND_RMT_ANIMATION_ENGINE_RUNTIME_API__.RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA;
export const createRmtAnimationEngineRuntime = __XTEND_RMT_ANIMATION_ENGINE_RUNTIME_API__.createRmtAnimationEngineRuntime;

export default __XTEND_RMT_ANIMATION_ENGINE_RUNTIME_API__;
