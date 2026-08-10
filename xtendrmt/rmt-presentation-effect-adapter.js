(function attachRmtPresentationEffectAdapter(globalTarget) {
  const RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA = 'xtend.rmt.presentation-effect-adapter.v1';
  const RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA = 'xtend.rmt.presentation-effect-diagnostic.v1';

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
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

  function immutableClone(value, fallback = null) {
    const cloned = cloneSafe(value, fallback);
    const seen = new WeakSet();
    const freeze = (entry) => {
      if (!entry || typeof entry !== 'object' || seen.has(entry)) return entry;
      seen.add(entry);
      Object.values(entry).forEach(freeze);
      return Object.freeze(entry);
    };
    return freeze(cloned);
  }

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function createRmtPresentationEffectAdapter(options = {}) {
    const root = options.root || null;
    const modelReader = options.modelReader || null;
    const domRenderer = options.domRenderer || null;
    const componentRegistry = options.componentRegistry || null;
    const transitionRuntime = options.transitionRuntime || null;
    const surfaceRuntime = options.surfaceRuntime || null;
    const surfaceLifecyclePort = options.surfaceLifecyclePort || null;
    const customEffectAdapter = options.customEffectAdapter || options.effectAdapter || null;
    const componentCommandPort = options.componentCommandPort || options.invokeComponentCommand || null;
    const windowTarget = options.windowTarget || globalTarget || null;
    const strict = options.strict === true || options.strictMaraca === true;
    const diagnostics = [];
    const onceCodes = new Set();
    let disposed = false;

    function diagnostic(code, severity, message, details = {}, once = false) {
      if (once && onceCodes.has(code)) {
        return diagnostics.find((entry) => entry.code === code) || null;
      }
      onceCodes.add(code);
      const entry = Object.freeze({
        schema: RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA,
        code,
        severity,
        message,
        details: cloneSafe(details, {})
      });
      diagnostics.push(entry);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(entry);
      return entry;
    }

    function fail(code, message, details = {}) {
      const entry = diagnostic(code, 'error', message, details);
      const error = new Error(message);
      error.code = code;
      error.diagnostic = entry;
      throw error;
    }

    function assertActive(operation) {
      if (!disposed) return;
      fail(
        'rmt.presentation.disposed',
        `The Presentation Effect Adapter cannot ${operation} after disposal.`,
        { operation }
      );
    }

    function cssString(value) {
      const raw = String(value || '');
      if (windowTarget && windowTarget.CSS && typeof windowTarget.CSS.escape === 'function') {
        return windowTarget.CSS.escape(raw);
      }
      return raw.replace(/["\\]/gu, '\\$&');
    }

    function isInsideRoot(element) {
      if (!element || !root) return false;
      return element === root || typeof root.contains === 'function' && root.contains(element);
    }

    function resolveSurface(surfaceId) {
      const normalized = clampString(surfaceId);
      if (!normalized) return null;
      const injected = typeof options.resolveSurface === 'function'
        ? options.resolveSurface(normalized)
        : null;
      if (injected && isInsideRoot(injected)) return injected;
      if (root && typeof root.getAttribute === 'function'
        && root.getAttribute('data-maraca-surface') === normalized) return root;
      if (!root || typeof root.querySelector !== 'function') return null;
      const resolved = root.querySelector(`[data-maraca-surface="${cssString(normalized)}"]`);
      return isInsideRoot(resolved) ? resolved : null;
    }

    function nearestSurfaceManager(element) {
      let current = element || null;
      while (current) {
        if (current.localName === 'x-surface-manager') return isInsideRoot(current) ? current : null;
        if (typeof current.closest === 'function') {
          const manager = current.closest('x-surface-manager');
          if (manager && isInsideRoot(manager)) return manager;
        }
        if (current === root) break;
        const owner = typeof current.getRootNode === 'function' ? current.getRootNode() : null;
        current = owner && owner.host || current.parentElement || null;
      }
      if (!root || typeof root.querySelector !== 'function') return null;
      const manager = root.querySelector('x-surface-manager');
      return isInsideRoot(manager) ? manager : null;
    }

    function surfaceRecord(manager, surfaceId) {
      const reader = manager && (typeof manager.readSnapshot === 'function'
        ? manager.readSnapshot.bind(manager)
        : typeof manager.snapshot === 'function'
          ? manager.snapshot.bind(manager)
          : null);
      if (!reader) return null;
      try {
        const snapshot = reader();
        return toArray(snapshot && snapshot.surfaces)
          .find((record) => record && record.id === surfaceId) || null;
      } catch (_) {
        return null;
      }
    }

    function waitForPresentationTurn() {
      if (windowTarget && typeof windowTarget.requestAnimationFrame === 'function') {
        return new Promise((resolve) => windowTarget.requestAnimationFrame(() => resolve()));
      }
      if (windowTarget && typeof windowTarget.setTimeout === 'function') {
        return new Promise((resolve) => windowTarget.setTimeout(resolve, 0));
      }
      return Promise.resolve();
    }

    async function ensureComponent(tag) {
      if (!componentRegistry) return null;
      const result = typeof componentRegistry.ensureTags === 'function'
        ? await componentRegistry.ensureTags([tag])
        : typeof componentRegistry.ensure === 'function'
          ? await componentRegistry.ensure(tag)
          : null;
      if (typeof options.captureDisposer === 'function') options.captureDisposer(result);
      return result;
    }

    function assertAllowedUrl(value, effectKind) {
      const allowed = domRenderer
        && typeof domRenderer.isUrlAllowed === 'function'
        && domRenderer.isUrlAllowed(value);
      if (allowed) return value;
      return fail(
        'rmt.dom.url.unsafe',
        `The ${effectKind} presentation effect rejected an unsafe URL before invoking the component API.`,
        { effectKind }
      );
    }

    function commitElement(element, attributes, metadata = {}) {
      if (!element || !domRenderer || typeof domRenderer.commit !== 'function') {
        if (strict) {
          return fail(
            'rmt.presentation.dom-renderer-missing',
            'Strict presentation effects require the shared DOM renderer.',
            { operation: metadata.operation || 'rmt.presentation.effect' }
          );
        }
        diagnostic(
          'rmt.presentation.dom-renderer-missing',
          'warning',
          'A presentation fallback was skipped because no shared DOM renderer was injected.',
          { operation: metadata.operation || 'rmt.presentation.effect' },
          true
        );
        return null;
      }
      return domRenderer.commit({
        operation: 'merge-element',
        target: element,
        descriptor: {
          type: 'element',
          tag: element.localName || 'div',
          attributes
        },
        context: {
          metadata: {
            operation: metadata.operation || 'rmt.presentation.effect',
            surface: metadata.surface || '',
            phase: metadata.phase || 'fallback'
          }
        },
        ownership: {
          owner: 'presentation-adapter',
          mode: strict ? 'strict' : 'compatibility',
          domains: {
            visibility: transitionRuntime ? 'transition-runtime' : 'descriptor-renderer',
            events: 'event-router'
          }
        }
      });
    }

    async function applyVisibility(element, nextHidden, surfaceId) {
      if (transitionRuntime && typeof transitionRuntime.applyVisibilityPatch === 'function') {
        const previousHidden = typeof options.readProjectedVisibility === 'function'
          ? options.readProjectedVisibility(surfaceId, nextHidden)
          : !nextHidden;
        const result = await transitionRuntime.applyVisibilityPatch({
          surface: surfaceId,
          element,
          previousHidden,
          nextHidden,
          metadata: {
            operation: 'rmt.presentation.visibility',
            phase: 'fallback'
          }
        });
        if (typeof options.writeProjectedVisibility === 'function') {
          options.writeProjectedVisibility(surfaceId, nextHidden);
        }
        return result;
      }
      return commitElement(element, {
        hidden: nextHidden ? true : null,
        'data-rmt-hidden-display': nextHidden ? true : null,
        style: {
          display: nextHidden ? 'none' : '',
          visibility: nextHidden ? 'hidden' : '',
          'pointer-events': nextHidden ? 'none' : ''
        }
      }, {
        operation: 'rmt.presentation.visibility',
        surface: surfaceId
      });
    }

    function lifecycleMaterialize(surfaceId) {
      if (!surfaceLifecyclePort || typeof surfaceLifecyclePort.materializeSurface !== 'function') return null;
      const result = surfaceLifecyclePort.materializeSurface(surfaceId, {
        reason: 'presentation-effect',
        source: RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA
      });
      if (result == null) {
        if (strict) {
          return fail(
            'rmt.presentation.surface-lifecycle-invalid-result',
            `The Surface Controller returned no materialization result for ${surfaceId}.`,
            { surfaceId }
          );
        }
        diagnostic(
          'rmt.presentation.surface-lifecycle-compatibility',
          'warning',
          'The Surface Controller returned no result; compatibility component materialization may be used.',
          { surfaceId },
          true
        );
      }
      if (result && result.ok === false) {
        return fail(
          result.code || 'rmt.presentation.surface-lifecycle-failed',
          `The Surface Controller rejected presentation materialization for ${surfaceId}.`,
          { surfaceId }
        );
      }
      return result;
    }

    async function materializeSurface(surfaceId, initialSurface = null) {
      if (!surfaceId) return { materialized: false, reason: 'missing-surface' };
      const lifecycleResult = lifecycleMaterialize(surfaceId);
      const surface = initialSurface || resolveSurface(surfaceId);
      const manager = nearestSurfaceManager(surface);
      if (!manager) {
        return {
          schema: 'xtend.rmt.presentation-surface-materialization.v1',
          materialized: Boolean(lifecycleResult),
          reason: lifecycleResult ? 'surface-controller' : 'no-surface-manager',
          surfaceId
        };
      }
      const before = surfaceRecord(manager, surfaceId);
      if (lifecycleResult) {
        await waitForPresentationTurn();
        const after = surfaceRecord(manager, surfaceId);
        return {
          schema: 'xtend.rmt.presentation-surface-materialization.v1',
          materialized: true,
          reason: 'surface-controller',
          surfaceId,
          beforeStatus: before && before.status || null,
          afterStatus: after && after.status || null
        };
      }
      const needsMaterialization = !before
        || before.status === 'closed'
        || before.status === 'minimized'
        || before.minimized === true
        || before.active !== true;
      if (!needsMaterialization) {
        return { materialized: Boolean(lifecycleResult), reason: 'already-active', surfaceId };
      }
      const payload = { reason: 'presentation-effect', source: RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA };
      if (typeof manager.materializeSurface === 'function') manager.materializeSurface(surfaceId, payload);
      else if (before && before.status === 'closed' && typeof manager.openSurface === 'function') manager.openSurface(surfaceId, payload);
      else if (typeof manager.restoreSurface === 'function') manager.restoreSurface(surfaceId);
      else if (typeof manager.openSurface === 'function') manager.openSurface(surfaceId, payload);
      else if (typeof manager.focusSurface === 'function') manager.focusSurface(surfaceId);
      else return { materialized: false, reason: 'unsupported-surface-manager', surfaceId };
      await waitForPresentationTurn();
      const after = surfaceRecord(manager, surfaceId);
      return {
        schema: 'xtend.rmt.presentation-surface-materialization.v1',
        materialized: true,
        surfaceId,
        beforeStatus: before && before.status || null,
        afterStatus: after && after.status || null
      };
    }

    function effectState(effect, effectContext, resultKey) {
      const sourceId = clampString(effect && effect.source && effect.source.target || effect && effect.target);
      const fromModel = modelReader && typeof modelReader.getState === 'function'
        ? modelReader.getState(sourceId)
        : null;
      const result = objectRecord(effectContext && effectContext.result);
      return {
        sourceId,
        detail: fromModel && typeof fromModel === 'object'
          ? fromModel
          : objectRecord(result[resultKey])
      };
    }

    function createEffectEvent(name, detail) {
      const CustomEventCtor = windowTarget && windowTarget.CustomEvent || globalTarget && globalTarget.CustomEvent;
      return typeof CustomEventCtor === 'function'
        ? new CustomEventCtor(name, { detail, bubbles: true, composed: true, cancelable: true })
        : null;
    }

    async function runRemotePlay(effect, effectContext) {
      const { sourceId, detail } = effectState(effect, effectContext, 'player');
      if (!detail || detail.hidden === true || detail.open === false || !detail.src) return null;
      assertAllowedUrl(detail.src, 'remote-play');
      if (detail.poster) assertAllowedUrl(detail.poster, 'remote-play-poster');
      await ensureComponent('x-player');
      await Promise.resolve();
      const surfaceId = detail.surfaceId || sourceId;
      let surface = resolveSurface(surfaceId);
      const materialization = await materializeSurface(surfaceId, surface);
      if (!surface && typeof options.refreshSurfaceIndex === 'function') {
        options.refreshSurfaceIndex();
        surface = resolveSurface(surfaceId);
      }
      await waitForPresentationTurn();
      const player = surface && surface.localName === 'x-player'
        ? surface
        : surface && typeof surface.querySelector === 'function' && surface.querySelector('x-player');
      if (!player || !isInsideRoot(player)) return null;
      const kind = clampString(detail.kind).toLowerCase();
      const mediaType = clampString(detail.mediaType || detail.type);
      const invalidType = ['n/a', 'unknown', 'null', 'undefined'].includes(mediaType.toLowerCase());
      const normalizedType = mediaType && !invalidType ? mediaType : kind === 'audio' ? 'audio' : 'video';
      const payload = {
        schema: 'xtend.maraca.remote-play.v1',
        src: detail.src,
        source: detail.src,
        type: normalizedType,
        mediaType: detail.mediaType || '',
        poster: detail.poster || '',
        title: detail.title || detail.label || 'Media',
        label: detail.title || detail.label || 'Media',
        kind: detail.kind || 'video',
        requestedBy: 'presentation-effect'
      };
      const event = createEffectEvent('xplayer-remote-play', payload);
      if (event && typeof player.dispatchEvent === 'function') {
        const accepted = player.dispatchEvent(event);
        if (!accepted || event.defaultPrevented) return payload;
      }
      if (typeof player.applyRmtPlayerCommand === 'function') {
        return { payload, result: await player.applyRmtPlayerCommand('remote-play', payload), materialization };
      }
      if (typeof player.remotePlay === 'function') {
        return { payload, result: await player.remotePlay(payload), materialization };
      }
      return { payload, materialization };
    }

    async function closeLightboxOverlays(surfaceId) {
      if (!surfaceRuntime
        || typeof surfaceRuntime.listOverlays !== 'function'
        || typeof surfaceRuntime.closeOverlay !== 'function') return;
      const overlays = surfaceRuntime.listOverlays()
        .filter((overlay) => overlay && (
          overlay.kind === 'lightbox'
          || overlay.overlayId === 'media.manager.lightboxOverlay'
          || overlay.surface === surfaceId
        ));
      for (const overlay of overlays) {
        await surfaceRuntime.closeOverlay(overlay.id, { reason: 'presentation-lightbox-close' });
      }
    }

    async function runLightbox(effect, effectContext) {
      const { sourceId, detail } = effectState(effect, effectContext, 'lightbox');
      const surfaceId = detail.surfaceId || sourceId;
      if (!surfaceId) return null;
      await ensureComponent('x-lightbox');
      await Promise.resolve();
      let surface = resolveSurface(surfaceId);
      const materialization = await materializeSurface(surfaceId, surface);
      if (!surface && typeof options.refreshSurfaceIndex === 'function') {
        options.refreshSurfaceIndex();
        surface = resolveSurface(surfaceId);
      }
      const lightbox = surface && surface.localName === 'x-lightbox'
        ? surface
        : surface && typeof surface.querySelector === 'function' && surface.querySelector('x-lightbox');
      if (!lightbox || !isInsideRoot(lightbox)) return null;
      const shouldOpen = Boolean(detail.hidden !== true && detail.open !== false && detail.src);
      if (!shouldOpen) {
        await closeLightboxOverlays(surfaceId);
        if (typeof lightbox.close === 'function') {
          lightbox.close({ source: 'presentation-effect', immediate: true, silent: true });
        } else {
          commitElement(lightbox, { open: null, src: null }, {
            operation: 'rmt.presentation.lightbox.close',
            surface: surfaceId
          });
          await applyVisibility(lightbox, true, surfaceId);
        }
        return { schema: 'xtend.maraca.lightbox-effect.v1', open: false, surfaceId, materialization };
      }
      assertAllowedUrl(detail.src, 'lightbox');
      if (typeof lightbox.open === 'function') {
        lightbox.open(detail.src, { source: 'presentation-effect', silent: true });
      } else {
        commitElement(lightbox, {
          src: detail.src,
          alt: detail.alt || detail.title || detail.label || null,
          open: true
        }, {
          operation: 'rmt.presentation.lightbox.open',
          surface: surfaceId
        });
        await applyVisibility(lightbox, false, surfaceId);
      }
      return {
        schema: 'xtend.maraca.lightbox-effect.v1',
        open: true,
        surfaceId,
        src: detail.src,
        materialization
      };
    }

    async function invokeCustom(effect, effectContext) {
      if (customEffectAdapter && typeof customEffectAdapter.invoke === 'function') {
        return customEffectAdapter.invoke(effect, effectContext);
      }
      if (typeof customEffectAdapter === 'function') return customEffectAdapter(effect, effectContext);
      return undefined;
    }

    async function invoke(effectInput, effectContext = {}) {
      assertActive('invoke effects');
      const effect = objectRecord(effectInput);
      const customResult = await invokeCustom(effect, effectContext);
      if (typeof customResult !== 'undefined') return customResult;
      if (effect.componentCommand && typeof componentCommandPort === 'function') {
        return componentCommandPort(effect.componentCommand, immutableClone({
          schema: 'xtend.rmt.presentation-component-command-context.v1',
          phase: clampString(effectContext && effectContext.phase, 'after-render'),
          action: clampString(effectContext && effectContext.action),
          metadata: effectContext && effectContext.metadata || {}
        }, {}));
      }
      const kind = clampString(effect.kind).toLowerCase();
      if (kind === 'remote-play') return runRemotePlay(effect, effectContext);
      if (['lightbox', 'open-lightbox', 'lightbox-open'].includes(kind)) {
        return runLightbox(effect, effectContext);
      }
      return undefined;
    }

    function snapshot() {
      return Object.freeze({
        schema: RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA,
        disposed,
        diagnosticCount: diagnostics.length,
        strict,
        capabilities: Object.freeze({
          componentCommands: typeof componentCommandPort === 'function',
          customEffects: Boolean(customEffectAdapter),
          domRenderer: Boolean(domRenderer && typeof domRenderer.commit === 'function'),
          surfaceLifecycle: Boolean(surfaceLifecyclePort),
          transitions: Boolean(transitionRuntime)
        })
      });
    }

    function dispose() {
      if (disposed) return false;
      disposed = true;
      return true;
    }

    return Object.freeze({
      schema: RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA,
      invoke,
      snapshot,
      listDiagnostics: () => diagnostics.slice(),
      dispose
    });
  }

  const api = {
    RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA,
    RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA,
    createRmtPresentationEffectAdapter
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalTarget) globalTarget.XTendRmtPresentationEffectAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_PRESENTATION_EFFECT_ADAPTER_API__ = globalThis.XTendRmtPresentationEffectAdapter;

export const RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA = __XTEND_RMT_PRESENTATION_EFFECT_ADAPTER_API__.RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA;
export const RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA = __XTEND_RMT_PRESENTATION_EFFECT_ADAPTER_API__.RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA;
export const createRmtPresentationEffectAdapter = __XTEND_RMT_PRESENTATION_EFFECT_ADAPTER_API__.createRmtPresentationEffectAdapter;

export default __XTEND_RMT_PRESENTATION_EFFECT_ADAPTER_API__;
