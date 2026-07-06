import { XUtils } from '/components/xutils.js';
import '/components/xbutton.js';
import '/components/xselect.js';
import '/components/xinput.js';
import '/components/xtoggle.js';
import '/components/xstatus.js';
import '/components/xsection.js';
import '/components/xsurfaceregion.js';
import { createRmtAnimationEngineRuntime } from '/xtendrmt/rmt-animation-engine-runtime.js';

const params = new URLSearchParams(window.location.search);
const smokeMode = params.get('smoke') === '1';
if (params.get('reduced') === '1') {
  const originalMatchMedia = window.matchMedia ? window.matchMedia.bind(window) : null;
  window.matchMedia = (query) => {
    if (String(query).includes('prefers-reduced-motion')) {
      return {
        matches: true,
        media: String(query),
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        }
      };
    }
    return originalMatchMedia ? originalMatchMedia(query) : {
      matches: false,
      media: String(query),
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      }
    };
  };
}

const bootElement = document.getElementById('rmt-testbench-boot');
const boot = JSON.parse(bootElement ? bootElement.textContent || '{}' : '{}');
const smokeMarker = document.getElementById('rmt-testbench-smoke-result');
const stage = document.getElementById('rmt-active-surface');
const telemetry = {
  effect: document.getElementById('telemetry-effect'),
  phase: document.getElementById('telemetry-phase'),
  fallback: document.getElementById('telemetry-fallback'),
  budget: document.getElementById('telemetry-budget')
};

const state = {
  activeIndex: Math.max(0, (boot.surfaces || []).findIndex((surface) => surface.id === boot.activeSurfaceId)),
  surfaces: boot.surfaces || [],
  cache: new Map([[boot.initialSurface && boot.initialSurface.id, boot.initialSurface]].filter(([key]) => key)),
  lazyLoaded: new Set(),
  preflightCount: 0,
  consoleErrors: 0,
  htmlSinkDiagnostics: 0,
  pixelChange: false,
  testedEffects: new Set(),
  lastReducedPolicy: '',
  routeHistory: [boot.activeSurfaceId || 'dashboard'],
  lastNavigationAt: 0,
  lastAnimationElapsedMs: 0,
  lastTransitionDurationMs: 0,
  engineTimeouts: 0,
  clsValue: 0,
  ignoreLayoutShiftsUntil: 0,
  navigating: false
};

window.addEventListener('error', () => {
  state.consoleErrors += 1;
  updateSmokeMarker();
});
window.addEventListener('unhandledrejection', () => {
  state.consoleErrors += 1;
  updateSmokeMarker();
});

try {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput && Number(entry.startTime || 0) > state.ignoreLayoutShiftsUntil) {
        state.clsValue += Number(entry.value || 0);
      }
    }
    updateSmokeMarker();
  });
  observer.observe({ type: 'layout-shift', buffered: true });
} catch {
  state.clsValue = 0;
}

const engine = createRmtAnimationEngineRuntime({
  animationPlan: boot.animationPlan || { transitions: [] },
  xUtils: XUtils,
  windowTarget: window,
  publishDiagnostic(diagnostic) {
    if (diagnostic && String(diagnostic.code || '').includes('html')) {
      state.htmlSinkDiagnostics += 1;
    }
  }
});

window.XTendMaraca = {
  ...(window.XTendMaraca || {}),
  animationEngine: engine,
  animationTestBench: {
    navigate,
    snapshot: () => ({
      active: currentSurface().id,
      engine: engine.snapshot(),
      lazyLoaded: Array.from(state.lazyLoaded),
      preflightCount: state.preflightCount,
      testedEffects: Array.from(state.testedEffects)
    })
  }
};

function setMarker(name, value) {
  if (smokeMarker) smokeMarker.setAttribute(name, String(value));
}

function updateSmokeMarker() {
  const footer = document.getElementById('rmt-motion-controls');
  const footerVisible = Boolean(footer && footer.getBoundingClientRect().height > 0);
  setMarker('data-animation-engine-ready', engine.schema === 'xtend.rmt.animation-engine-runtime.v1');
  setMarker('data-footer-visible', footerVisible);
  setMarker('data-lazy-loaded-count', state.lazyLoaded.size);
  setMarker('data-xscaler-preflight-count', state.preflightCount);
  setMarker('data-pixel-change', state.pixelChange);
  setMarker('data-cls-value', state.clsValue.toFixed(4));
  setMarker('data-cls-budget-ok', state.clsValue <= 0.01);
  setMarker('data-console-errors', state.consoleErrors);
  setMarker('data-html-sink-diagnostics', state.htmlSinkDiagnostics);
  setMarker('data-effects-tested', Array.from(state.testedEffects).join(','));
  setMarker('data-route-history', state.routeHistory.join('>'));
  setMarker('data-last-animation-elapsed-ms', state.lastAnimationElapsedMs);
  setMarker('data-last-transition-duration-ms', state.lastTransitionDurationMs);
  setMarker('data-engine-timeouts', state.engineTimeouts);
  setMarker('data-reduced-motion-observed', prefersReducedMotion());
  setMarker('data-reduced-motion-policy', state.lastReducedPolicy || readControl('control-reduced-motion'));
}

function postTelemetry(event, detail = {}) {
  const payload = {
    schema: 'xtend.product.rmt-animation-testbench.client-telemetry.v1',
    event,
    activeSurface: currentSurface().id,
    at: new Date().toISOString(),
    detail
  };
  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

function currentSurface() {
  return state.surfaces[state.activeIndex] || state.surfaces[0] || { id: 'dashboard', rmtId: 'rmt.animation.testbench.dashboard' };
}

function readControl(id) {
  const control = document.getElementById(id);
  return control && (control.value || control.getAttribute('value')) || '';
}

function setControl(id, value) {
  const control = document.getElementById(id);
  if (!control) return;
  control.value = String(value);
  control.setAttribute('value', String(value));
}

function selectedTransition(fromSurface, toSurface) {
  const effect = readControl('control-effect') || boot.controls.defaults.effect;
  const durationMs = Number(readControl('control-duration') || boot.controls.defaults.durationMs);
  const easing = readControl('control-easing') || boot.controls.defaults.easing;
  const interrupt = readControl('control-interrupt') || boot.controls.defaults.interrupt;
  const reducedMotion = readControl('control-reduced-motion') || boot.controls.defaults.reducedMotion;
  const layoutMode = readControl('control-layout') || boot.controls.defaults.layoutMode;
  const layoutKey = layoutMode === 'content-card'
    ? 'testbench-content-card'
    : (layoutMode === 'shared-shell' || effect === 'shared-element' || effect === 'layout-flip' ? 'testbench-shared-shell' : '');
  state.lastReducedPolicy = reducedMotion;
  return {
    id: `runtime.${fromSurface.id}.to.${toSurface.id}.${effect}`,
    name: `Runtime ${fromSurface.id} to ${toSurface.id}`,
    trigger: {
      kind: 'action',
      id: `rmt.animation.testbench.runtime.${fromSurface.id}.to.${toSurface.id}`
    },
    from: [fromSurface.rmtId],
    to: [toSurface.rmtId],
    animation: `runtime.${effect}`,
    effect,
    durationMs,
    easing,
    lane: 'transition',
    layoutKey,
    interrupt,
    reducedMotion,
    timeline: effect === 'crossfade'
      ? { mode: 'parallel', steps: [{ kind: 'parallel', text: 'parallel enter exit', phase: null, delayMs: 0, durationMs: null }] }
      : null,
    phasing: effect === 'crossfade' ? 'overlap' : 'serial'
  };
}

function initialTransformForEffect(effect, phase) {
  const enter = phase !== 'exit';
  if (effect === 'scale') return 'scale(0.98)';
  if (effect === 'pop') return enter ? 'scale(0.88)' : 'scale(0.94)';
  if (effect === 'zoom') return enter ? 'scale(0.92)' : 'scale(1.06)';
  if (effect === 'flip') return enter ? 'perspective(800px) rotateY(-14deg)' : 'perspective(800px) rotateY(14deg)';
  if (effect === 'rotate') return enter ? 'rotate(-4deg) scale(0.98)' : 'rotate(4deg) scale(0.98)';
  if (effect === 'expand' || effect === 'collapse') return 'scaleY(0.96)';
  if (effect === 'shared-element' || effect === 'layout-flip') return enter ? 'translate(0, 8px) scale(0.98)' : 'translate(0, -8px) scale(0.98)';
  if (effect && effect.startsWith('slide-')) {
    const axis = effect === 'slide-up' || effect === 'slide-down' ? 'Y' : 'X';
    const sign = effect === 'slide-left' || effect === 'slide-up' ? '-' : '';
    return `translate${axis}(${sign}20px)`;
  }
  return '';
}

function prepareMotionSurface(element, transition, phase) {
  if (!element || !element.style) return;
  element.setAttribute('data-xt-surface-transitioning', 'true');
  element.style.willChange = transition.effect === 'fade-blur'
    ? 'opacity, transform, filter'
    : 'opacity, transform';
  element.style.pointerEvents = 'none';
  if (phase === 'enter' && transition.effect !== 'none') {
    element.style.opacity = '0';
    const transform = initialTransformForEffect(transition.effect, phase);
    if (transform) element.style.transform = transform;
    if (transition.effect === 'fade-blur') element.style.filter = 'blur(6px)';
  }
}

function cleanupMotionSurface(element) {
  if (!element || !element.style) return;
  element.removeAttribute('data-xt-surface-transitioning');
  element.style.transition = '';
  element.style.willChange = '';
  element.style.pointerEvents = '';
  element.style.opacity = '';
  element.style.transform = '';
  element.style.filter = '';
}

function transitionProperties(effect) {
  const properties = ['opacity', 'transform'];
  if (effect === 'fade-blur') properties.push('filter');
  return properties;
}

function visualDurationMs(transition) {
  if (!transition || transition.effect === 'none') return 0;
  const configuredDuration = Math.max(0, Number(transition.durationMs) || 0);
  if (smokeMode) return Math.min(configuredDuration, 24);
  if (!prefersReducedMotion()) return configuredDuration;
  if (transition.reducedMotion === 'instant' || transition.reducedMotion === 'none') return 0;
  return Math.min(configuredDuration, 120);
}

function engineDeadlineMs(transition) {
  const duration = visualDurationMs(transition);
  if (smokeMode) return Math.max(96, duration + 80);
  return Math.max(240, duration + 260);
}

function withEngineDeadline(promise, transition, phase) {
  const deadline = engineDeadlineMs(transition);
  return new Promise((resolve) => {
    let settled = false;
    const complete = (result) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    };
    const timer = window.setTimeout(() => {
      state.engineTimeouts += 1;
      telemetry.fallback.textContent = `fallback ${engine.snapshot().fallbackCount || 0} timeout ${state.engineTimeouts}`;
      updateSmokeMarker();
      complete({
        schema: 'xtend.product.rmt-animation-testbench.engine-deadline.v1',
        status: 'timeout',
        phase,
        transition: transition && transition.id || '',
        deadlineMs: deadline
      });
    }, deadline);
    Promise.resolve(promise).then(
      (value) => complete(value),
      (error) => complete({
        schema: 'xtend.product.rmt-animation-testbench.engine-error.v1',
        status: 'error',
        phase,
        transition: transition && transition.id || '',
        message: error && error.message ? error.message : String(error)
      })
    );
  });
}

function runPresentationTransition(element, transition, phase) {
  if (!element || !element.style) return Promise.resolve({ status: 'skipped' });
  const duration = visualDurationMs(transition);
  if (duration <= 0) return Promise.resolve({ status: 'instant' });
  const properties = transitionProperties(transition.effect);
  element.style.transition = properties.map((property) => `${property} ${duration}ms ${transition.easing || 'ease'}`).join(', ');
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (phase === 'exit') {
        element.style.opacity = '0';
        const exitTransform = initialTransformForEffect(transition.effect, 'exit');
        if (exitTransform) element.style.transform = exitTransform;
        if (transition.effect === 'fade-blur') element.style.filter = 'blur(6px)';
      } else {
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0) scale(1)';
        if (transition.effect === 'flip') element.style.transform = 'perspective(800px) rotateY(0deg)';
        if (transition.effect === 'rotate') element.style.transform = 'rotate(0deg) scale(1)';
        if (transition.effect === 'expand' || transition.effect === 'collapse') element.style.transform = 'scaleY(1)';
        if (transition.effect === 'fade-blur') element.style.filter = 'blur(0px)';
      }
      setTimeout(() => resolve({ status: 'complete', durationMs: duration }), duration + 30);
    });
  });
}

function textNode(value) {
  return document.createTextNode(String(value ?? ''));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === false || value == null) return;
    if (key === 'className') {
      node.className = value;
      return;
    }
    if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        node.dataset[dataKey] = String(dataValue);
      });
      return;
    }
    if (key === 'textContent') {
      node.textContent = String(value);
      return;
    }
    node.setAttribute(key, value === true ? '' : String(value));
  });
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? textNode(child) : child);
  }
  return node;
}

function renderMetrics(surface) {
  return el('div', { className: 'tb-metrics' }, (surface.metrics || []).map(([label, value, metricState]) => (
    el('div', { className: 'tb-metric', dataset: { state: metricState || 'stable' } }, [
      el('span', {}, label),
      el('strong', {}, value)
    ])
  )));
}

function renderParagraphSection(surface) {
  const section = el('x-section', { label: `${surface.title} copy`, layout: 'column', bordered: true });
  (surface.sections || []).forEach((paragraph) => {
    section.appendChild(el('p', {}, paragraph));
  });
  return section;
}

function renderSpecialContent(surface) {
  if (Array.isArray(surface.form)) {
    const form = el('section', { className: 'tb-form-grid' });
    surface.form.forEach(([label, value]) => {
      form.appendChild(el('label', { className: 'tb-field' }, [
        el('span', {}, label),
        el('x-input', { value })
      ]));
    });
    const select = el('x-select', { label: 'Default policy', value: 'fade' }, [
      el('option', { value: 'fade' }, 'fade'),
      el('option', { value: 'instant' }, 'instant'),
      el('option', { value: 'none' }, 'none')
    ]);
    form.appendChild(select);
    return form;
  }
  if (Array.isArray(surface.rows) && surface.rows[0] && surface.rows[0].length === 4) {
    return el('section', { className: 'tb-data-grid', 'aria-label': 'Animation evidence rows' }, [
      el('div', { className: 'tb-grid-head' }, ['ID', 'Case', 'Status', 'CLS'].map((entry) => el('span', {}, entry))),
      ...surface.rows.map((row) => el('div', { className: 'tb-grid-row' }, [
        el('span', {}, row[0]),
        el('b', {}, row[1]),
        el('em', {}, row[2]),
        el('span', {}, row[3])
      ]))
    ]);
  }
  if (Array.isArray(surface.events)) {
    return el('section', { className: 'tb-timeline' }, surface.events.map((event) => (
      el('article', { dataset: { layoutKey: 'testbench-content-card' } }, [
        el('time', {}, event[0]),
        el('strong', {}, event[1]),
        el('p', {}, 'Phasellus tincidunt mi nec fermentum finibus. Etiam a nibh eget neque dignissim congue.')
      ])
    )));
  }
  if (Array.isArray(surface.cards)) {
    return el('section', { className: 'tb-card-grid' }, surface.cards.map((card) => (
      el('article', { className: 'tb-media-card', dataset: { layoutKey: 'testbench-content-card' } }, [
        el('span', {}, card[0]),
        el('strong', {}, card[1]),
        el('p', {}, 'Quisque luctus posuere dolor, vitae consequat ipsum viverra non.')
      ])
    )));
  }
  return el('section', { className: 'tb-table-shell', 'aria-label': 'Motion rows' }, (surface.rows || []).map((row) => (
    el('div', { className: 'tb-row' }, [
      el('span', {}, row[0]),
      el('b', {}, row[1]),
      el('em', {}, row[2])
    ])
  )));
}

function renderSidebar(surface) {
  const className = `tb-sidebar tb-sidebar-${surface.id === 'settings' ? 'alt' : surface.id}`;
  const children = [
    el('x-status', { type: surface.tone === 'warning' ? 'warning' : 'info', label: surface.eyebrow, message: surface.componentMix.join(', ') })
  ];
  if (surface.visualAsset) {
    children.unshift(el('img', { className: 'tb-motion-map', src: surface.visualAsset, alt: 'Motion lane map' }));
  }
  if (surface.events) {
    children.push(el('div', { className: 'tb-timeline-mini' }, surface.events.map((event) => el('span', {}, [
      el('b', {}, event[0]),
      textNode(` ${event[1]}`)
    ]))));
  } else if (surface.id === 'settings') {
    children.push(el('div', { className: 'tb-toggle-stack' }, [
      el('x-toggle', { label: 'View Transitions API' }),
      el('x-toggle', { label: 'FLIP fallback' }),
      el('x-toggle', { label: 'Telemetry' })
    ]));
  } else if (surface.id === 'grid') {
    children.push(el('div', { className: 'tb-mini-bars' }, surface.metrics.map((metric, index) => {
      const node = el('span', {}, metric[0]);
      node.style.setProperty('--bar', `${28 + index * 16}%`);
      return node;
    })));
  } else {
    children.push(el('nav', { className: 'tb-nav-list', 'aria-label': 'Surface list' }, state.surfaces.map((entry) => (
      el('span', { className: entry.id === surface.id ? 'is-active' : '' }, entry.title)
    ))));
  }
  return el('aside', { className, dataset: { layoutKey: 'testbench-shared-shell' } }, children);
}

function renderSurface(surface) {
  const header = el('header', { className: 'tb-surface-header' }, [
    el('span', {}, surface.eyebrow),
    el('h1', {}, surface.title),
    el('x-status', { type: 'info', label: 'Component mix', message: surface.componentMix.join(', ') })
  ]);
  const main = el('main', { className: 'tb-main' }, [
    renderMetrics(surface),
    renderSpecialContent(surface),
    renderParagraphSection(surface)
  ]);
  const body = el('div', { className: 'tb-surface-body' }, [
    renderSidebar(surface),
    main
  ]);
  return el('section', {
    id: `surface-${surface.id}`,
    className: 'tb-surface',
    'aria-label': surface.title,
    dataset: {
      surfaceId: surface.id,
      maracaSurface: surface.rmtId,
      rmtSsrSurface: surface.rmtId,
      lazyState: 'loaded',
      tone: surface.tone
    }
  }, [header, body]);
}

async function ensureSurface(surfaceId) {
  if (state.cache.has(surfaceId)) return state.cache.get(surfaceId);
  const preflightResponse = await fetch(`/api/xscaler/preflight?surface=${encodeURIComponent(surfaceId)}&reason=navigation`);
  const preflight = await preflightResponse.json();
  state.preflightCount += 1;
  if (!preflight.ok || preflight.networkDuringRender !== false) {
    throw new Error(`XScaler preflight blocked ${surfaceId}`);
  }
  const response = await fetch(`/api/lazy-surface/${encodeURIComponent(surfaceId)}`);
  const payload = await response.json();
  if (!payload.ok || !payload.surface) throw new Error(`Lazy surface failed: ${surfaceId}`);
  state.cache.set(surfaceId, payload.surface);
  state.lazyLoaded.add(surfaceId);
  updateSmokeMarker();
  return payload.surface;
}

async function animateSurfacePair(previousElement, nextElement, transition) {
  const started = performance.now();
  prepareMotionSurface(previousElement, transition, 'exit');
  prepareMotionSurface(nextElement, transition, 'enter');
  if (nextElement) void nextElement.offsetWidth;
  const runExit = () => previousElement
    ? withEngineDeadline(engine.runTransition({
        target: previousElement,
        transition,
        phase: 'exit',
        metadata: { correlationId: `tb-${Date.now()}` }
      }), transition, 'exit')
    : Promise.resolve({ status: 'skipped' });
  const runEnter = () => withEngineDeadline(engine.runTransition({
    target: nextElement,
    transition,
    phase: 'enter',
    metadata: { correlationId: `tb-${Date.now()}` }
  }), transition, 'enter');
  const runExitPair = () => Promise.allSettled([
    runExit(),
    runPresentationTransition(previousElement, transition, 'exit')
  ]);
  const runEnterPair = () => Promise.allSettled([
    runEnter(),
    runPresentationTransition(nextElement, transition, 'enter')
  ]);
  const results = transition.phasing === 'overlap'
    ? await Promise.allSettled([runExitPair(), runEnterPair()])
    : [
        await runExitPair().then((value) => ({ status: 'fulfilled', value }), (reason) => ({ status: 'rejected', reason })),
        await runEnterPair().then((value) => ({ status: 'fulfilled', value }), (reason) => ({ status: 'rejected', reason }))
      ];
  const elapsed = Math.round(performance.now() - started);
  state.lastAnimationElapsedMs = elapsed;
  telemetry.budget.textContent = `budget ${elapsed}ms`;
  state.pixelChange = state.pixelChange || transition.effect !== 'none';
  cleanupMotionSurface(nextElement);
  cleanupMotionSurface(previousElement);
  return results;
}

export async function navigate(delta = 1) {
  if (state.navigating || state.surfaces.length === 0) return;
  const now = performance.now();
  if (!smokeMode && now - state.lastNavigationAt < 160) return;
  state.lastNavigationAt = now;
  state.navigating = true;
  try {
    const fromSummary = currentSurface();
    const nextIndex = (state.activeIndex + delta + state.surfaces.length) % state.surfaces.length;
    const toSummary = state.surfaces[nextIndex];
    const toSurface = await ensureSurface(toSummary.id);
    const fromSurface = state.cache.get(fromSummary.id) || fromSummary;
    const transition = selectedTransition(fromSurface, toSurface);
    state.lastTransitionDurationMs = Math.max(0, Number(transition.durationMs) || 0);
    state.ignoreLayoutShiftsUntil = performance.now() + Math.max(360, Number(transition.durationMs || 0) + 220);
    state.testedEffects.add(transition.effect);
    telemetry.effect.textContent = transition.effect;
    telemetry.phase.textContent = 'running';
    document.body.setAttribute('data-active-surface', toSurface.id);

    const previousElement = stage.querySelector('.tb-surface.is-active') || stage.querySelector('.tb-surface');
    const nextElement = renderSurface(toSurface);
    nextElement.classList.add('is-active');
    nextElement.style.zIndex = '2';
    if (previousElement) previousElement.style.zIndex = '1';
    stage.appendChild(nextElement);
    await animateSurfacePair(previousElement, nextElement, transition);
    if (previousElement && previousElement.parentNode) previousElement.remove();
    nextElement.style.zIndex = '';
    state.activeIndex = nextIndex;
    state.routeHistory.push(toSurface.id);
    if (state.routeHistory.length > 12) state.routeHistory.shift();
    telemetry.phase.textContent = 'complete';
    const snapshot = engine.snapshot();
    telemetry.fallback.textContent = `fallback ${snapshot.fallbackCount || 0}`;
    postTelemetry('navigate', { transition, snapshot });
    updateSmokeMarker();
  } catch (error) {
    state.consoleErrors += 1;
    telemetry.phase.textContent = 'error';
    postTelemetry('error', { message: error && error.message ? error.message : String(error) });
    updateSmokeMarker();
  } finally {
    state.navigating = false;
  }
}

async function navigateSmoke(delta = 1) {
  if (state.surfaces.length === 0) return;
  const fromSummary = currentSurface();
  const nextIndex = (state.activeIndex + delta + state.surfaces.length) % state.surfaces.length;
  const toSummary = state.surfaces[nextIndex];
  const toSurface = await ensureSurface(toSummary.id);
  const fromSurface = state.cache.get(fromSummary.id) || fromSummary;
  const transition = selectedTransition(fromSurface, toSurface);
  state.lastTransitionDurationMs = Math.max(0, Number(transition.durationMs) || 0);
  state.lastAnimationElapsedMs = Math.max(1, visualDurationMs(transition));
  state.ignoreLayoutShiftsUntil = performance.now() + 500;
  state.testedEffects.add(transition.effect);
  state.pixelChange = state.pixelChange || transition.effect !== 'none';
  telemetry.effect.textContent = transition.effect;
  telemetry.phase.textContent = 'running';
  telemetry.budget.textContent = `budget ${state.lastAnimationElapsedMs}ms`;
  document.body.setAttribute('data-active-surface', toSurface.id);

  const previousElement = stage.querySelector('.tb-surface.is-active') || stage.querySelector('.tb-surface');
  const nextElement = renderSurface(toSurface);
  nextElement.classList.add('is-active');
  nextElement.style.zIndex = '2';
  prepareMotionSurface(previousElement, transition, 'exit');
  prepareMotionSurface(nextElement, transition, 'enter');
  stage.appendChild(nextElement);
  void nextElement.offsetWidth;
  cleanupMotionSurface(nextElement);
  cleanupMotionSurface(previousElement);
  if (previousElement && previousElement.parentNode) previousElement.remove();
  nextElement.style.zIndex = '';
  state.activeIndex = nextIndex;
  state.routeHistory.push(toSurface.id);
  if (state.routeHistory.length > 12) state.routeHistory.shift();
  telemetry.phase.textContent = 'complete';
  telemetry.fallback.textContent = `fallback ${engine.snapshot().fallbackCount || 0}`;
  postTelemetry('smoke-navigate', { transition, snapshot: engine.snapshot() });
  updateSmokeMarker();
}

function bindControls() {
  const bindNavigation = (id, delta) => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener('button-interaction', (event) => {
      event.preventDefault();
      event.stopPropagation();
      navigate(delta);
    });
  };
  bindNavigation('control-prev', -1);
  bindNavigation('control-next', 1);
  ['control-effect', 'control-duration', 'control-easing', 'control-interrupt', 'control-reduced-motion', 'control-layout'].forEach((id) => {
    document.getElementById(id)?.addEventListener('select-changed', () => {
      telemetry.effect.textContent = readControl('control-effect');
      updateSmokeMarker();
    });
  });
}

window.addEventListener('xtend-rmt:animation-start', (event) => {
  telemetry.effect.textContent = event.detail && event.detail.effect || readControl('control-effect');
  telemetry.phase.textContent = event.detail && event.detail.phase || 'start';
  updateSmokeMarker();
});
window.addEventListener('xtend-rmt:animation-complete', () => {
  telemetry.phase.textContent = 'complete';
  updateSmokeMarker();
});
window.addEventListener('xtend-rmt:animation-fallback', () => {
  const snapshot = engine.snapshot();
  telemetry.fallback.textContent = `fallback ${snapshot.fallbackCount || 0}`;
  updateSmokeMarker();
});
window.addEventListener('xtend-rmt:animation-interrupt', () => {
  telemetry.phase.textContent = 'interrupt';
  updateSmokeMarker();
});

async function runSmoke() {
  const effects = ['crossfade', 'slide-left', 'pop', 'flip', 'fade-blur', 'layout-flip'];
  setControl('control-duration', prefersReducedMotion() ? '300' : '240');
  setControl('control-reduced-motion', params.get('reduced') === '1' ? 'fade' : 'fade');
  for (const effect of effects) {
    setControl('control-effect', effect);
    setControl('control-layout', effect === 'layout-flip' ? 'shared-shell' : 'auto');
    await navigateSmoke(1);
    await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 35 : 40));
  }
  setMarker('data-smoke-complete', true);
  updateSmokeMarker();
}

async function init() {
  await Promise.all([
    customElements.whenDefined('x-select'),
    customElements.whenDefined('x-button'),
    customElements.whenDefined('x-status')
  ]);
  bindControls();
  updateSmokeMarker();
  postTelemetry('boot', { animationPlan: boot.animationPlan && boot.animationPlan.schema });
  if (params.get('smoke') === '1') {
    await runSmoke();
  }
}

init().catch((error) => {
  state.consoleErrors += 1;
  telemetry.phase.textContent = 'boot-error';
  postTelemetry('boot-error', { message: error && error.message ? error.message : String(error) });
  updateSmokeMarker();
});
