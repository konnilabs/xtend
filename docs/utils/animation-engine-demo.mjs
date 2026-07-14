import { XUtils } from '/components/xutils.js';
import { createRmtAnimationEngineRuntime } from '/xtendrmt/rmt-animation-engine-runtime.js';

const DEMO_SCHEMA = 'xtend.docs.animation-engine-demo.v1';
const DEMO_RUNTIME_SCHEMA = 'xtend.docs.animation-engine-demo-runtime.v1';
const STYLE_ID = 'xtend-docs-animation-engine-demo-styles';
const COPY = Object.freeze({
  de: Object.freeze({
    title: 'AnimationEngine ausprobieren',
    effect: 'Effekt',
    duration: 'Dauer',
    easing: 'Easing',
    reducedMotion: 'Bewegungsreduktion',
    system: 'Systemeinstellung',
    fade: 'Fade-Vorschau',
    instant: 'Sofort-Vorschau',
    none: 'Ohne Bewegung',
    replay: 'Animation wiederholen',
    ready: 'AOT-Plan bereit',
    running: 'Animation läuft',
    complete: 'Animation abgeschlossen',
    fallback: 'AnimationEngine hat den sicheren Fallback verwendet',
    failed: 'Die Animation konnte nicht ausgeführt werden'
  }),
  en: Object.freeze({
    title: 'Try AnimationEngine',
    effect: 'Effect',
    duration: 'Duration',
    easing: 'Easing',
    reducedMotion: 'Reduced motion',
    system: 'System preference',
    fade: 'Preview fade',
    instant: 'Preview instant',
    none: 'Preview no motion',
    replay: 'Replay animation',
    ready: 'AOT plan ready',
    running: 'Animation running',
    complete: 'Animation complete',
    fallback: 'AnimationEngine used the safe fallback',
    failed: 'The animation could not run'
  })
});

const DEMO_CSS = `
  .docs-animation-engine-demo {
    --docs-animation-field-slot-size: 4.55rem;
    --docs-animation-action-slot-size: 4rem;
    --docs-animation-replay-slot-inline-size: 13rem;
    --docs-animation-status-slot-size: 5.5rem;
    display: grid;
    gap: 0.8rem;
    min-block-size: 15.1rem;
    margin: 0 0 1.25rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: color-mix(in srgb, var(--surface-muted) 84%, var(--section-bg));
    color: var(--text-color);
    box-sizing: border-box;
    contain: layout style;
  }
  .docs-animation-engine-demo-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0;
    font-size: 1rem;
    line-height: 1.35;
    letter-spacing: 0;
  }
  .docs-animation-engine-demo-controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(8.5rem, 1fr)) var(--docs-animation-replay-slot-inline-size);
    grid-template-areas:
      "effect duration easing motion replay"
      "status status status status status";
    grid-template-rows: minmax(var(--docs-animation-field-slot-size), auto) var(--docs-animation-status-slot-size);
    gap: 0.7rem;
    align-items: stretch;
    min-width: 0;
  }
  .docs-animation-engine-demo-control-slot {
    display: flex;
    align-items: flex-end;
    min-width: 0;
    min-block-size: var(--docs-animation-field-slot-size);
  }
  .docs-animation-engine-demo-control-slot[data-slot="effect"] {
    grid-area: effect;
  }
  .docs-animation-engine-demo-control-slot[data-slot="duration"] {
    grid-area: duration;
  }
  .docs-animation-engine-demo-control-slot[data-slot="easing"] {
    grid-area: easing;
  }
  .docs-animation-engine-demo-control-slot[data-slot="motion"] {
    grid-area: motion;
  }
  .docs-animation-engine-demo-control-slot[data-slot="replay"] {
    grid-area: replay;
    inline-size: var(--docs-animation-replay-slot-inline-size);
    max-inline-size: 100%;
    min-block-size: var(--docs-animation-action-slot-size);
  }
  .docs-animation-engine-demo-control-slot[data-slot="status"] {
    grid-area: status;
    align-items: stretch;
    block-size: var(--docs-animation-status-slot-size);
    min-block-size: var(--docs-animation-status-slot-size);
  }
  .docs-animation-engine-demo-controls x-select {
    display: block;
    width: 100%;
    min-width: 0;
    --xtend-form-control-surface: var(--docs-code-bg);
    --xtend-form-control-text: #f8fafc;
    --xtend-form-label-text: var(--text-color);
  }
  .docs-animation-engine-demo-controls x-button {
    width: 100%;
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
  .docs-animation-engine-demo-status {
    display: block;
    width: 100%;
    block-size: 100%;
    min-width: 0;
  }
  .docs-animation-engine-demo-status::part(root) {
    align-items: center;
    box-sizing: border-box;
    block-size: 100%;
    min-block-size: 100%;
  }
  .docs-animation-engine-demo-status::part(label),
  .docs-animation-engine-demo-status::part(message) {
    overflow-wrap: anywhere;
  }
  .docs-animation-engine-demo-ghost {
    position: absolute;
    z-index: 2;
    margin: 0;
    pointer-events: none;
    user-select: none;
    transform-origin: top center;
    box-sizing: border-box;
    overflow: hidden;
  }
  #md-content[data-docs-animation-engine-target="true"] {
    position: relative;
    z-index: 1;
    transform-origin: top center;
  }
  @media (max-width: 880px) {
    .docs-animation-engine-demo {
      min-block-size: 25rem;
    }
    .docs-animation-engine-demo-controls {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        "effect duration"
        "easing motion"
        "replay replay"
        "status status";
      grid-template-rows:
        repeat(2, minmax(var(--docs-animation-field-slot-size), auto))
        minmax(var(--docs-animation-action-slot-size), auto)
        var(--docs-animation-status-slot-size);
    }
  }
  @media (max-width: 520px) {
    .docs-animation-engine-demo {
      min-block-size: 35.5rem;
    }
    .docs-animation-engine-demo-controls {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "effect"
        "duration"
        "easing"
        "motion"
        "replay"
        "status";
      grid-template-rows:
        repeat(4, minmax(var(--docs-animation-field-slot-size), auto))
        minmax(var(--docs-animation-action-slot-size), auto)
        var(--docs-animation-status-slot-size);
    }
    .docs-animation-engine-demo-control-slot[data-slot="replay"] {
      inline-size: 100%;
    }
  }
`;

function normalizeLocale(value) {
  return String(value || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

function createElement(tag, attributes = {}, text = '') {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    element.setAttribute(name, value === true ? '' : String(value));
  });
  if (text !== '') element.textContent = String(text);
  return element;
}

function createControlSlot(name, control) {
  const slot = createElement('div', {
    class: 'docs-animation-engine-demo-control-slot',
    'data-slot': name,
    'data-rmt-slot': `docs.animation-engine.demo.controls.${name}`
  });
  slot.appendChild(control);
  return slot;
}

function ensureStyles(root) {
  const scope = root && root.getRootNode ? root.getRootNode() : document;
  if (!scope || typeof scope.getElementById !== 'function' || typeof scope.appendChild !== 'function') return;
  if (scope.getElementById(STYLE_ID)) return;
  const style = createElement('style', { id: STYLE_ID, 'data-rmt-style-scope': 'docs.animation-engine-demo' });
  style.textContent = DEMO_CSS;
  scope.appendChild(style);
}

async function ensureComponents(root) {
  if (window.XTendLoader && typeof window.XTendLoader.hydrateTree === 'function') {
    await window.XTendLoader.hydrateTree(root, {
      tags: ['x-select', 'x-button', 'x-status'],
      source: 'docs.animation-engine-demo',
      reason: 'insular-demo-hydration',
      schedule: 'docs.animation-engine-demo.hydrate'
    });
    return;
  }
  throw new Error('XTend Loader component hydration is required by the AnimationEngine demo.');
}

function appendOptions(select, values, labelForValue = (value) => value) {
  values.forEach((value) => {
    select.appendChild(createElement('option', { value }, labelForValue(value)));
  });
}

function createSelect(id, label, values, selected, labelForValue) {
  const select = createElement('x-select', {
    id,
    label,
    value: selected,
    density: 'compact',
    'data-animation-control': id
  });
  appendOptions(select, values, labelForValue);
  return select;
}

function setStatus(status, copy, state, detail = '') {
  if (!status) return;
  const messages = {
    ready: copy.ready,
    running: copy.running,
    complete: copy.complete,
    fallback: copy.fallback,
    failed: copy.failed
  };
  status.setAttribute('state', state === 'failed' || state === 'fallback' ? 'warning' : (state === 'complete' ? 'success' : 'info'));
  status.setAttribute('type', state === 'failed' || state === 'fallback' ? 'warning' : (state === 'complete' ? 'success' : 'info'));
  status.setAttribute('label', messages[state] || copy.ready);
  status.setAttribute('message', detail);
  status.toggleAttribute('busy', state === 'running');
}

function createMotionPreviewWindow(state) {
  return {
    CustomEvent: window.CustomEvent,
    dispatchEvent(event) {
      return window.dispatchEvent(event);
    },
    matchMedia(query) {
      const actual = window.matchMedia(query);
      if (!String(query).includes('prefers-reduced-motion') || state.reducedMotionPreview === 'system') return actual;
      return {
        media: actual.media,
        matches: true,
        onchange: null,
        addEventListener: actual.addEventListener ? actual.addEventListener.bind(actual) : () => {},
        removeEventListener: actual.removeEventListener ? actual.removeEventListener.bind(actual) : () => {},
        addListener: actual.addListener ? actual.addListener.bind(actual) : () => {},
        removeListener: actual.removeListener ? actual.removeListener.bind(actual) : () => {},
        dispatchEvent: actual.dispatchEvent ? actual.dispatchEvent.bind(actual) : () => false
      };
    }
  };
}

function scrubPresentationClone(clone) {
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  clone.setAttribute('data-docs-animation-engine-ghost', 'true');
  clone.classList.add('docs-animation-engine-demo-ghost');
  clone.querySelectorAll('[id], [name], [for], [href], [tabindex], [aria-live]').forEach((node) => {
    node.removeAttribute('id');
    node.removeAttribute('name');
    node.removeAttribute('for');
    node.removeAttribute('href');
    node.removeAttribute('aria-live');
    node.setAttribute('tabindex', '-1');
  });
  return clone;
}

function cancelAnimations(target) {
  if (!target || typeof target.getAnimations !== 'function') return;
  target.getAnimations().forEach((animation) => {
    if (animation && typeof animation.cancel === 'function') animation.cancel();
  });
}

function transitionForEffect(animationPlan, effect) {
  return (animationPlan.transitions || []).find((transition) => transition.effect === effect) || null;
}

function reducedMotionPolicy(state, transition) {
  return state.reducedMotionPreview === 'system'
    ? (transition.reducedMotion || 'fade')
    : state.reducedMotionPreview;
}

function resourceCount() {
  return typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('resource').length
    : 0;
}

function createDemoXUtilsAdapter() {
  return Object.freeze({
    runUiTransition(input = {}) {
      return XUtils.runUiTransition({ ...input, body: false });
    }
  });
}

export async function hydrateDocsAnimationEngineDemo(options = {}) {
  const root = options.root;
  const target = options.target;
  const artifact = options.artifact;
  if (!root || !target) throw new Error('AnimationEngine demo requires root and target elements.');
  if (!artifact || artifact.schema !== DEMO_SCHEMA || !artifact.animationPlan) {
    throw new Error(`AnimationEngine demo expected ${DEMO_SCHEMA}.`);
  }

  const locale = normalizeLocale(options.locale || document.documentElement.lang);
  const copy = COPY[locale];
  const controls = artifact.controls || {};
  const defaults = controls.defaults || {};
  const state = {
    effect: defaults.effect || 'crossfade',
    durationMs: Number(defaults.durationMs) || 280,
    easing: defaults.easing || 'ease-out',
    reducedMotionPreview: defaults.reducedMotionPreview || 'system'
  };
  const smokeParams = new URL(window.location.href).searchParams;
  const smokeTheme = smokeParams.get('animation-engine-theme');
  if (smokeParams.get('animation-engine-smoke') === '1' && ['light', 'dark'].includes(smokeTheme)) {
    document.documentElement.setAttribute('data-theme', smokeTheme);
    root.setAttribute('data-browser-theme', smokeTheme);
  }
  const smokeReducedMotion = smokeParams.get('animation-engine-reduced');
  if ((controls.reducedMotionPreviews || []).includes(smokeReducedMotion)) {
    state.reducedMotionPreview = smokeReducedMotion;
  }
  const previewWindow = createMotionPreviewWindow(state);
  const engine = createRmtAnimationEngineRuntime({
    animationPlan: artifact.animationPlan,
    xUtils: createDemoXUtilsAdapter(),
    windowTarget: previewWindow
  });
  let disposed = false;
  let generation = 0;
  let activeClone = null;
  let activeTargetStyle;
  let activeParentStyle;

  ensureStyles(root);
  root.setAttribute('data-rmt-hydration-state', 'hydrating');
  await ensureComponents(root);
  if (disposed) return { dispose() {} };

  const heading = createElement('h2', { class: 'docs-animation-engine-demo-heading' }, copy.title);
  const controlStrip = createElement('div', {
    class: 'docs-animation-engine-demo-controls',
    role: 'group',
    'aria-label': copy.title,
    'data-slot-layout': 'fixed-responsive-grid'
  });
  const effectSelect = createSelect('docs-animation-effect', copy.effect, controls.effects || [], state.effect);
  const durationSelect = createSelect(
    'docs-animation-duration',
    copy.duration,
    controls.durations || [],
    state.durationMs,
    (value) => `${value} ms`
  );
  const easingSelect = createSelect('docs-animation-easing', copy.easing, controls.easings || [], state.easing);
  const reducedSelect = createSelect(
    'docs-animation-reduced-motion',
    copy.reducedMotion,
    controls.reducedMotionPreviews || [],
    state.reducedMotionPreview,
    (value) => copy[value] || value
  );
  const replayButton = createElement('x-button', {
    id: 'docs-animation-replay',
    label: copy.replay,
    'aria-label': copy.replay,
    title: copy.replay,
    variant: 'primary',
    size: 'small',
    'icon-name': 'rotate-cw',
    'icon-pack': 'lucide',
    'data-animation-replay': ''
  });
  const status = createElement('x-status', {
    class: 'docs-animation-engine-demo-status',
    polite: '',
    state: 'info',
    type: 'info',
    label: copy.ready,
    message: `${state.effect} · ${state.durationMs} ms`
  });

  controlStrip.append(
    createControlSlot('effect', effectSelect),
    createControlSlot('duration', durationSelect),
    createControlSlot('easing', easingSelect),
    createControlSlot('motion', reducedSelect),
    createControlSlot('replay', replayButton),
    createControlSlot('status', status)
  );
  root.replaceChildren(heading, controlStrip);
  root.classList.add('docs-animation-engine-demo');
  root.removeAttribute('tabindex');
  root.setAttribute('aria-busy', 'false');
  root.setAttribute('data-rmt-hydration-state', 'hydrated');
  root.setAttribute('data-animation-engine-ready', 'true');
  root.setAttribute('data-plan-fingerprint', artifact.planFingerprint || '');
  target.setAttribute('data-docs-animation-engine-target', 'true');
  const replayGeometry = {
    rootHeight: root.getBoundingClientRect().height,
    controlsHeight: controlStrip.getBoundingClientRect().height,
    slots: new Map(),
    maxDelta: 0
  };

  function captureSlotGeometry() {
    return new Map(Array.from(controlStrip.querySelectorAll('.docs-animation-engine-demo-control-slot')).map((slot) => {
      const rect = slot.getBoundingClientRect();
      return [slot.getAttribute('data-slot') || '', {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }];
    }));
  }

  function resetReplayGeometry() {
    replayGeometry.rootHeight = root.getBoundingClientRect().height;
    replayGeometry.controlsHeight = controlStrip.getBoundingClientRect().height;
    replayGeometry.slots = captureSlotGeometry();
    replayGeometry.maxDelta = 0;
    root.setAttribute('data-replay-layout-baseline', String(Math.round(replayGeometry.rootHeight * 100) / 100));
    root.setAttribute('data-replay-layout-delta', '0');
    root.setAttribute('data-replay-layout-stable', 'true');
  }

  function recordReplayGeometry(stage) {
    const rootDelta = Math.abs(root.getBoundingClientRect().height - replayGeometry.rootHeight);
    const controlsDelta = Math.abs(controlStrip.getBoundingClientRect().height - replayGeometry.controlsHeight);
    const slotDelta = Math.max(0, ...Array.from(captureSlotGeometry()).map(([name, current]) => {
      const baseline = replayGeometry.slots.get(name) || current;
      return Math.max(
        Math.abs(current.x - baseline.x),
        Math.abs(current.y - baseline.y),
        Math.abs(current.width - baseline.width),
        Math.abs(current.height - baseline.height)
      );
    }));
    replayGeometry.maxDelta = Math.max(replayGeometry.maxDelta, rootDelta, controlsDelta, slotDelta);
    root.setAttribute('data-replay-layout-stage', stage);
    root.setAttribute('data-replay-layout-delta', String(Math.round(replayGeometry.maxDelta * 100) / 100));
    root.setAttribute('data-replay-layout-stable', String(replayGeometry.maxDelta <= 0.5));
  }

  resetReplayGeometry();

  function restorePresentation(localClone = activeClone) {
    if (localClone) {
      cancelAnimations(localClone);
      if (localClone.isConnected) localClone.remove();
    }
    cancelAnimations(target);
    if (activeTargetStyle === null) target.removeAttribute('style');
    else if (activeTargetStyle !== undefined) target.setAttribute('style', activeTargetStyle);
    const parent = target.parentElement;
    if (parent) {
      if (activeParentStyle === null) parent.removeAttribute('style');
      else if (activeParentStyle !== undefined) parent.setAttribute('style', activeParentStyle);
    }
    if (activeClone === localClone) activeClone = null;
    activeTargetStyle = undefined;
    activeParentStyle = undefined;
  }

  async function replay(reason = 'user') {
    if (disposed) return { schema: DEMO_RUNTIME_SCHEMA, status: 'disposed' };
    const baseTransition = transitionForEffect(artifact.animationPlan, state.effect);
    if (!baseTransition) throw new Error(`No AOT transition exists for effect ${state.effect}.`);

    generation += 1;
    const replayGeneration = generation;
    restorePresentation();
    const parent = target.parentElement;
    if (!parent) throw new Error('AnimationEngine article target is detached.');
    activeTargetStyle = target.getAttribute('style');
    activeParentStyle = parent.getAttribute('style');
    if (window.getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

    const rect = target.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const clone = scrubPresentationClone(target.cloneNode(true));
    clone.style.insetInlineStart = `${rect.left - parentRect.left}px`;
    clone.style.insetBlockStart = `${rect.top - parentRect.top}px`;
    clone.style.inlineSize = `${rect.width}px`;
    clone.style.blockSize = `${rect.height}px`;
    parent.insertBefore(clone, target);
    activeClone = clone;

    const transition = {
      ...baseTransition,
      durationMs: state.effect === 'none' ? 0 : state.durationMs,
      easing: state.easing,
      interrupt: defaults.interrupt || 'replace',
      layoutKey: defaults.layoutKey || 'docs-animation-article',
      lane: defaults.lane || 'transition',
      reducedMotion: reducedMotionPolicy(state, baseTransition)
    };
    const resourcesBefore = resourceCount();
    const startedAt = performance.now();
    resetReplayGeometry();
    replayButton.setAttribute('loading', '');
    replayButton.setAttribute('aria-busy', 'true');
    root.setAttribute('aria-busy', 'true');
    root.setAttribute('data-replay-complete', 'false');
    setStatus(status, copy, 'running', `${state.effect} · ${state.durationMs} ms`);
    recordReplayGeometry('running');

    try {
      const replayResult = await engine.replaySurfaceTransition({
        target,
        exitTarget: clone,
        transition,
        metadata: { source: 'docs-animation-engine-demo', reason }
      });
      const exitResult = replayResult.exit;
      const enterResult = replayResult.enter;
      if (disposed || replayGeneration !== generation) {
        return { schema: DEMO_RUNTIME_SCHEMA, status: 'cancelled' };
      }
      const fallback = [exitResult, enterResult].some((result) => result && result.status === 'fallback');
      const elapsedMs = Math.round((performance.now() - startedAt) * 100) / 100;
      const result = {
        schema: DEMO_RUNTIME_SCHEMA,
        status: fallback ? 'fallback' : 'complete',
        effect: state.effect,
        durationMs: state.durationMs,
        elapsedMs,
        easing: state.easing,
        reducedMotionPreview: state.reducedMotionPreview,
        networkDuringReplay: resourceCount() > resourcesBefore,
        exit: exitResult,
        enter: enterResult,
        engine: engine.snapshot()
      };
      root.setAttribute('data-replay-complete', 'true');
      root.setAttribute('data-replay-status', result.status);
      root.setAttribute('data-replay-effect', result.effect);
      root.setAttribute('data-replay-duration-ms', String(result.durationMs));
      root.setAttribute('data-replay-elapsed-ms', String(result.elapsedMs));
      root.setAttribute('data-reduced-motion-preview', result.reducedMotionPreview);
      root.setAttribute('data-network-during-replay', String(result.networkDuringReplay));
      root.setAttribute('data-animation-observed', String(result.effect !== 'none' && result.durationMs > 0));
      setStatus(status, copy, result.status, `${result.effect} · ${result.elapsedMs} ms`);
      recordReplayGeometry(result.status);
      window.xtendDocsAnimationEngineDemoLastSnapshot = result;
      window.dispatchEvent(new CustomEvent('xtend-docs-animation-engine-demo-replay', { detail: result }));
      return result;
    } catch (error) {
      if (!disposed && replayGeneration === generation) {
        root.setAttribute('data-replay-complete', 'true');
        root.setAttribute('data-replay-status', 'failed');
        setStatus(status, copy, 'failed', error && error.message ? error.message : String(error));
        recordReplayGeometry('failed');
      }
      throw error;
    } finally {
      if (!disposed && replayGeneration === generation) {
        replayButton.removeAttribute('loading');
        replayButton.setAttribute('aria-busy', 'false');
        root.setAttribute('aria-busy', 'false');
        restorePresentation(clone);
      }
    }
  }

  function onSelectChanged(event) {
    const control = event.target && event.target.getAttribute ? event.target.getAttribute('data-animation-control') : '';
    const value = event.detail && event.detail.value;
    if (!control || value === undefined) return;
    if (control === 'docs-animation-effect') state.effect = String(value);
    if (control === 'docs-animation-duration') state.durationMs = Number(value) || 280;
    if (control === 'docs-animation-easing') state.easing = String(value);
    if (control === 'docs-animation-reduced-motion') state.reducedMotionPreview = String(value);
    setStatus(status, copy, 'ready', `${state.effect} · ${state.durationMs} ms`);
  }

  function onReplay() {
    replay('control').catch(() => {});
  }

  const disposeSelect = XUtils.on(root, 'select-changed', onSelectChanged);
  const disposeReplay = XUtils.on(replayButton, 'button-interaction', onReplay);

  const controller = {
    schema: DEMO_RUNTIME_SCHEMA,
    replay,
    snapshot() {
      return {
        schema: DEMO_RUNTIME_SCHEMA,
        status: disposed ? 'disposed' : 'ready',
        state: { ...state },
        engine: engine.snapshot()
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      engine.cancelReplay();
      disposeSelect();
      disposeReplay();
      restorePresentation();
      target.removeAttribute('data-docs-animation-engine-target');
      root.setAttribute('data-rmt-hydration-state', 'disposed');
    }
  };
  root.__xtendDocsAnimationEngineDemo = controller;
  window.xtendDocsAnimationEngineDemoLastController = controller;
  window.dispatchEvent(new CustomEvent('xtend-docs-animation-engine-demo-ready', {
    detail: {
      schema: DEMO_RUNTIME_SCHEMA,
      planFingerprint: artifact.planFingerprint || '',
      locale
    }
  }));
  if (smokeParams.get('animation-engine-smoke') === '1') {
    root.setAttribute('data-browser-smoke', 'running');
    const runSmoke = () => {
      replay('browser-smoke').then(() => {
        if (!disposed) root.setAttribute('data-browser-smoke', 'complete');
      }).catch((error) => {
        if (!disposed) {
          root.setAttribute('data-browser-smoke', 'failed');
          root.setAttribute('data-browser-smoke-error', error && error.message ? error.message : String(error));
        }
      });
    };
    Promise.resolve().then(runSmoke);
  }
  return controller;
}

export { DEMO_RUNTIME_SCHEMA, DEMO_SCHEMA };
