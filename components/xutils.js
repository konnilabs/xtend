/**
 * XUtils - XTend Utility-Komponente
 * Vereinigt zentrale Hilfsfunktionen für UI-Komponenten nach XTend-Designrichtlinien.
 * Modular, erweiterbar, und für alle XTend-Komponenten nutzbar.
 */

const XUTILS_UTILITY_CONTRACT_SCHEMA = 'xtend.utility.module-contract.v1';
const XUTILS_IMPORT_POLICY_SCHEMA = 'xtend.utility.import-policy.v1';
const XUTILS_IMPORT_POLICY_RESULT_SCHEMA = 'xtend.utility.import-policy-result.v1';
const XUTILS_BOUNDARY_PROBE_SCHEMA = 'xtend.utility.boundary-probe.v1';
const XUTILS_UI_EFFECTS_SCHEMA = 'xtend.utility.ui-effects.v1';
const XUTILS_UI_TRANSITION_SCHEMA = 'xtend.utility.ui-transition.v1';
const XUTILS_UI_TRANSITION_RESULT_SCHEMA = 'xtend.utility.ui-transition-result.v1';
const XUTILS_UI_EFFECTS_EVENT = 'xutils:ui-effects-change';
const XUTILS_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const XUTILS_FORBIDDEN_IMPORT_PROTOCOLS = Object.freeze(['http:', 'https:', 'data:', 'javascript:']);
const XUTILS_FORBIDDEN_IMPORT_HOSTS = Object.freeze(['cdn.ccs-networks.de']);
const XUTILS_SUPPORTED_UI_EFFECTS = Object.freeze(['fade-in', 'fade', 'crossfade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'scale', 'none']);
const XUTILS_UI_EFFECTS_BODY_ATTR = 'xt-ui-effects';
const XUTILS_UI_EFFECTS_DATA_ATTR = 'data-xt-ui-effects';
const XUTILS_UI_EFFECTS_READY_ATTR = 'data-xt-ui-effects-ready';
const XUTILS_UI_EFFECTS_STATE_ATTR = 'data-xt-ui-effects-state';
const XUTILS_UI_EFFECTS_SOURCE_ATTR = 'data-xt-ui-effects-source';
const XUTILS_UI_EFFECTS_DEFAULT_DURATION_MS = 500;

function normalizeImportSpecifier(specifier) {
  return String(specifier || '').trim();
}

function isProtocolRelativeSpecifier(specifier) {
  return normalizeImportSpecifier(specifier).startsWith('//');
}

function resolveImportPolicyResult(specifier) {
  const normalized = normalizeImportSpecifier(specifier);
  const lower = normalized.toLowerCase();
  const protocol = lower.match(/^([a-z][a-z0-9+.-]*:)/)?.[1] || '';
  const blockedProtocol = protocol ? XUTILS_FORBIDDEN_IMPORT_PROTOCOLS.includes(protocol) : false;
  const blockedHost = XUTILS_FORBIDDEN_IMPORT_HOSTS.some((host) => lower.includes(host));
  const blockedProtocolRelative = isProtocolRelativeSpecifier(normalized);
  const allowed = Boolean(normalized) && !blockedProtocol && !blockedHost && !blockedProtocolRelative;

  return {
    schema: XUTILS_IMPORT_POLICY_RESULT_SCHEMA,
    componentRef: 'x-utils',
    specifier: normalized,
    allowed,
    reason: allowed ? 'local-import' : 'external-import-blocked',
    policy: XUTILS_IMPORT_POLICY_SCHEMA,
    kernelBoundary: XUTILS_KERNEL_BOUNDARY
  };
}

function normalizeUiEffectToken(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (['fadein', 'page-fade-in', 'app-fade-in', 'shell-fade-in'].includes(normalized)) return 'fade-in';
  if (['none', 'off', 'false', '0', 'disabled', 'disable'].includes(normalized)) return 'none';
  return normalized;
}

function collectUiEffectTokens(value, tokens = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectUiEffectTokens(entry, tokens));
    return tokens;
  }

  if (value && typeof value === 'object') {
    collectUiEffectTokens(value.effects, tokens);
    collectUiEffectTokens(value.effect, tokens);
    collectUiEffectTokens(value.mode, tokens);
    collectUiEffectTokens(value.name, tokens);
    collectUiEffectTokens(value.type, tokens);
    return tokens;
  }

  String(value || '')
    .split(/[\s,;|]+/u)
    .map(normalizeUiEffectToken)
    .filter(Boolean)
    .forEach((token) => tokens.push(token));

  return tokens;
}

function uniqueSupportedUiEffects(tokens, disabled = false) {
  if (disabled) return [];
  return Array.from(new Set(tokens.filter((token) => token !== 'none' && XUTILS_SUPPORTED_UI_EFFECTS.includes(token))));
}

function hasSupportedUiEffect(tokens) {
  return tokens.some((token) => token !== 'none' && XUTILS_SUPPORTED_UI_EFFECTS.includes(token));
}

function normalizeUiTransitionEffect(value) {
  const effect = normalizeUiEffectToken(value || 'fade');
  if (effect === 'fade-in') return 'fade';
  if (XUTILS_SUPPORTED_UI_EFFECTS.includes(effect)) return effect;
  return 'fade';
}

function normalizeUiEffectDuration(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return XUTILS_UI_EFFECTS_DEFAULT_DURATION_MS;
  return Math.min(Math.round(parsed), 3000);
}

function readElementAttribute(element, names) {
  if (!element || typeof element.getAttribute !== 'function') return '';
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value !== null && value !== undefined && String(value).trim()) return value;
  }
  return '';
}

function isUiEffectsRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  const tag = normalizeUiEffectToken(record.tag || record.componentTag || record.element);
  const kind = normalizeUiEffectToken(record.kind || record.schema);
  return tag === 'ui-effects' ||
    kind === 'ui-effects' ||
    kind === 'ui_effects' ||
    kind === XUTILS_UI_EFFECTS_SCHEMA;
}

function collectUiEffectsFromRecord(record, tokens) {
  const before = tokens.length;
  collectUiEffectTokens(record.effects, tokens);
  collectUiEffectTokens(record.effect, tokens);
  collectUiEffectTokens(record.mode, tokens);
  collectUiEffectTokens(record.props, tokens);
  collectUiEffectTokens(record.attributes, tokens);
  collectUiEffectTokens(record.metadata, tokens);

  if (isUiEffectsRecord(record) && tokens.length === before) {
    tokens.push('fade-in');
  }
}

function scanRmtUiEffects(value, tokens, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((entry) => scanRmtUiEffects(entry, tokens, seen));
    return;
  }

  if (isUiEffectsRecord(value)) {
    collectUiEffectsFromRecord(value, tokens);
  }

  if (value.uiEffects !== undefined) collectUiEffectTokens(value.uiEffects, tokens);
  if (value['ui-effects'] !== undefined) collectUiEffectTokens(value['ui-effects'], tokens);

  Object.values(value).forEach((entry) => scanRmtUiEffects(entry, tokens, seen));
}

function resolveUiEffectsTarget(input = {}) {
  if (input.target && typeof input.target.setAttribute === 'function') return input.target;
  if (input.element && typeof input.element.setAttribute === 'function') return input.element;
  if (typeof document !== 'undefined' && document.body) return document.body;
  return null;
}

function resolveUiEffectsInput(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { effects: input };
  }
  return input;
}

function dispatchUiEffectsEvent(phase, detail) {
  if (typeof window === 'undefined' || typeof CustomEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(XUTILS_UI_EFFECTS_EVENT, {
    detail: {
      ...detail,
      phase
    }
  }));
}

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {
    return false;
  }
}

function transitionKeyframes(effect, phase) {
  const enter = phase !== 'exit';
  if (effect === 'none') return null;
  if (effect === 'scale') {
    return enter
      ? [{ opacity: 0, transform: 'scale(0.98)' }, { opacity: 1, transform: 'scale(1)' }]
      : [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.98)' }];
  }
  if (effect && effect.startsWith('slide-')) {
    const distance = '16px';
    const axis = effect === 'slide-up' || effect === 'slide-down' ? 'Y' : 'X';
    const sign = effect === 'slide-left' || effect === 'slide-up' ? '-' : '';
    const offset = `translate${axis}(${sign}${distance})`;
    return enter
      ? [{ opacity: 0, transform: offset }, { opacity: 1, transform: 'translate(0, 0)' }]
      : [{ opacity: 1, transform: 'translate(0, 0)' }, { opacity: 0, transform: offset }];
  }
  return enter
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [{ opacity: 1 }, { opacity: 0 }];
}

function runTransitionWithTimeout(target, keyframes, options) {
  if (!target || !keyframes) {
    return Promise.resolve({
      schema: XUTILS_UI_TRANSITION_RESULT_SCHEMA,
      status: 'instant'
    });
  }
  if (typeof target.animate === 'function') {
    const animation = target.animate(keyframes, options);
    return new Promise((resolve) => {
      let settled = false;
      const settle = (status, timedOut = false) => {
        if (settled) return;
        settled = true;
        resolve({
          schema: XUTILS_UI_TRANSITION_RESULT_SCHEMA,
          status,
          engine: 'web-animations',
          timedOut
        });
      };
      animation.onfinish = () => settle('complete');
      animation.oncancel = () => settle('cancelled');
      setTimeout(() => settle('complete', true), Math.max(0, Number(options.duration) || 0) + 80);
    });
  }
  const previousTransition = target.style && target.style.transition || '';
  const previousOpacity = target.style && target.style.opacity || '';
  const previousTransform = target.style && target.style.transform || '';
  const first = keyframes[0] || {};
  const last = keyframes[keyframes.length - 1] || {};
  if (target.style) {
    target.style.transition = `opacity ${options.duration}ms ${options.easing}, transform ${options.duration}ms ${options.easing}`;
    if (first.opacity !== undefined) target.style.opacity = String(first.opacity);
    if (first.transform !== undefined) target.style.transform = String(first.transform);
  }
  const frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (callback) => setTimeout(callback, 0);
  return new Promise((resolve) => {
    frame(() => {
      if (target.style) {
        if (last.opacity !== undefined) target.style.opacity = String(last.opacity);
        if (last.transform !== undefined) target.style.transform = String(last.transform);
      }
      setTimeout(() => {
        if (target.style) {
          target.style.transition = previousTransition;
          target.style.opacity = previousOpacity;
          target.style.transform = previousTransform;
        }
        resolve({
          schema: XUTILS_UI_TRANSITION_RESULT_SCHEMA,
          status: 'complete',
          engine: 'css-timeout'
        });
      }, options.duration);
    });
  });
}

export const XUtils = {
  xtendUtilityContract: {
    schema: XUTILS_UTILITY_CONTRACT_SCHEMA,
    componentRef: 'x-utils',
    moduleRef: 'xutils',
    customElement: false,
    categories: ['dom', 'events', 'animation', 'a11y', 'responsive', 'color', 'format', 'templates', 'ui-effects'],
    exports: ['XUtils'],
    globals: ['window.XUtils'],
    fixtureProbe: XUTILS_BOUNDARY_PROBE_SCHEMA,
    kernelBoundary: XUTILS_KERNEL_BOUNDARY
  },
  xtendImportPolicy: {
    schema: XUTILS_IMPORT_POLICY_SCHEMA,
    componentRef: 'x-utils',
    localOnly: true,
    forbiddenProtocols: XUTILS_FORBIDDEN_IMPORT_PROTOCOLS.slice(),
    forbiddenHosts: XUTILS_FORBIDDEN_IMPORT_HOSTS.slice(),
    cdnPolicy: 'forbidden',
    kernelBoundary: XUTILS_KERNEL_BOUNDARY
  },
  getUtilityContract() {
    return {
      ...this.xtendUtilityContract,
      methods: [
        'find',
        'findAll',
        'create',
        'on',
        'delegate',
        'fadeIn',
        'fadeOut',
        'resolveUiEffects',
        'resolveUiTransition',
        'runUiTransition',
        'prepareUiEffects',
        'releaseUiEffects',
        'setAria',
        'focusTrap',
        'isMobile',
        'hexToRgb',
        'contrastColor',
        'formatDate',
        'formatNumber',
        'uniqueId',
        'deepClone',
        'assertLocalImport',
        'snapshotUtilityContract'
      ]
    };
  },
  snapshotUtilityContract() {
    return {
      schema: XUTILS_BOUNDARY_PROBE_SCHEMA,
      componentRef: 'x-utils',
      utility: this.getUtilityContract(),
      importPolicy: this.xtendImportPolicy,
      customElement: false,
      globalReady: typeof window !== 'undefined' && window.XUtils === this
    };
  },
  assertLocalImport(specifier) {
    const result = resolveImportPolicyResult(specifier);
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('xutils:import-policy-check', { detail: result }));
    }
    return result;
  },
  // DOM-Helpers
  find(selector, root = document) {
    return root.querySelector(selector);
  },
  findAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  },
  create(tag, props = {}) {
    const el = document.createElement(tag);
    Object.assign(el, props);
    return el;
  },
  // Event-Helpers
  on(el, type, handler, opts) {
    el.addEventListener(type, handler, opts);
    return () => el.removeEventListener(type, handler, opts);
  },
  delegate(root, selector, type, handler) {
    const listener = e => {
      if (e.target.closest(selector)) handler(e);
    };
    root.addEventListener(type, listener);
    return () => root.removeEventListener(type, listener);
  },
  // Animation-Helpers
  fadeIn(el, duration = 400) {
    el.style.opacity = 0;
    el.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => { el.style.opacity = 1; });
  },
  fadeOut(el, duration = 400) {
    el.style.opacity = 1;
    el.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => { el.style.opacity = 0; });
  },
  resolveUiEffects(input = {}) {
    const options = resolveUiEffectsInput(input);
    const target = resolveUiEffectsTarget(options);
    const body = options.body === false
      ? null
      : (options.body || (typeof document !== 'undefined' ? document.body : null));
    const script = options.script || null;
    const tokens = [];
    const hostTokens = [];
    const rmtTokens = [];
    const sources = [];

    const addTokens = (source, value) => {
      const before = tokens.length;
      const targetTokens = source === 'rmt' ? rmtTokens : hostTokens;
      const targetBefore = targetTokens.length;
      collectUiEffectTokens(value, tokens);
      collectUiEffectTokens(value, targetTokens);
      if (tokens.length > before || targetTokens.length > targetBefore) sources.push(source);
    };

    addTokens('explicit', options.effects || options.effect || options.mode);
    addTokens('body', readElementAttribute(body, [XUTILS_UI_EFFECTS_BODY_ATTR, XUTILS_UI_EFFECTS_DATA_ATTR]));
    addTokens('script', readElementAttribute(script, ['data-ui-effects', 'data-xt-ui-effects']));

    if (options.rmtDocument) {
      const before = tokens.length;
      const rmtBefore = rmtTokens.length;
      scanRmtUiEffects(options.rmtDocument, tokens);
      scanRmtUiEffects(options.rmtDocument, rmtTokens);
      if (tokens.length > before || rmtTokens.length > rmtBefore) sources.push('rmt');
    }

    const hostDisabled = hostTokens.some((token) => token === 'none');
    const rmtDisabled = rmtTokens.some((token) => token === 'none');
    const disabled = hostDisabled || (rmtDisabled && !hasSupportedUiEffect(hostTokens));
    const effects = uniqueSupportedUiEffects(tokens, disabled);
    const durationMs = normalizeUiEffectDuration(
      options.durationMs ||
      options.duration ||
      readElementAttribute(body, ['data-xt-ui-effects-duration']) ||
      readElementAttribute(script, ['data-ui-effects-duration', 'data-xt-ui-effects-duration'])
    );

    return {
      schema: XUTILS_UI_EFFECTS_SCHEMA,
      componentRef: 'x-utils',
      target,
      targetRef: target === body ? 'document.body' : 'custom-target',
      effects,
      active: effects.length > 0,
      disabled,
      source: sources.length ? Array.from(new Set(sources)).join('+') : 'none',
      bodyAttribute: XUTILS_UI_EFFECTS_BODY_ATTR,
      rmtTag: 'ui-effects',
      supportedEffects: XUTILS_SUPPORTED_UI_EFFECTS.slice(),
      durationMs,
      kernelBoundary: XUTILS_KERNEL_BOUNDARY
    };
  },
  prepareUiEffects(input = {}) {
    const resolved = input && input.schema === XUTILS_UI_EFFECTS_SCHEMA
      ? input
      : this.resolveUiEffects(input);
    const target = resolved.target;
    if (!target || !resolved.active) return resolved;

    target.setAttribute(XUTILS_UI_EFFECTS_DATA_ATTR, resolved.effects.join(' '));
    target.setAttribute(XUTILS_UI_EFFECTS_STATE_ATTR, 'preparing');
    target.setAttribute(XUTILS_UI_EFFECTS_SOURCE_ATTR, resolved.source);
    target.removeAttribute(XUTILS_UI_EFFECTS_READY_ATTR);

    if (resolved.effects.includes('fade-in')) {
      target.style.visibility = 'hidden';
      target.style.opacity = '0';
      if (!target.style.transition) {
        target.style.transition = `opacity ${resolved.durationMs}ms ease`;
      }
    }

    const prepared = {
      ...resolved,
      prepared: true,
      released: false
    };
    dispatchUiEffectsEvent('prepare', prepared);
    return prepared;
  },
  releaseUiEffects(input = {}) {
    const resolved = input && input.schema === XUTILS_UI_EFFECTS_SCHEMA
      ? input
      : this.resolveUiEffects(input);
    const target = resolved.target;
    if (!target || !resolved.active) return resolved;

    target.setAttribute(XUTILS_UI_EFFECTS_READY_ATTR, 'true');
    target.setAttribute(XUTILS_UI_EFFECTS_STATE_ATTR, 'ready');
    target.style.visibility = 'visible';

    const reveal = () => {
      target.style.opacity = '1';
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(reveal);
    } else {
      reveal();
    }

    const released = {
      ...resolved,
      prepared: Boolean(resolved.prepared),
      released: true
    };
    dispatchUiEffectsEvent('release', released);
    return released;
  },
  resolveUiTransition(input = {}) {
    const options = resolveUiEffectsInput(input);
    const resolvedEffects = this.resolveUiEffects({
      ...options,
      effects: options.effect || options.effects || 'fade'
    });
    const effect = normalizeUiTransitionEffect(options.effect || resolvedEffects.effects[0] || 'fade');
    const reducedMotion = prefersReducedMotion();
    const disabled = resolvedEffects.disabled || reducedMotion || effect === 'none';
    const durationMs = disabled ? 0 : normalizeUiEffectDuration(
      options.durationMs ||
      options.duration ||
      resolvedEffects.durationMs
    );
    return {
      schema: XUTILS_UI_TRANSITION_SCHEMA,
      componentRef: 'x-utils',
      target: options.target || options.element || resolvedEffects.target,
      effect,
      phase: options.phase === 'exit' ? 'exit' : 'enter',
      durationMs,
      easing: String(options.easing || 'ease'),
      active: !disabled && durationMs > 0,
      disabled,
      disabledBy: resolvedEffects.disabled ? 'xt-ui-effects' : (reducedMotion ? 'prefers-reduced-motion' : (effect === 'none' ? 'effect-none' : 'none')),
      policy: resolvedEffects,
      kernelBoundary: XUTILS_KERNEL_BOUNDARY
    };
  },
  async runUiTransition(input = {}) {
    const transition = input && input.schema === XUTILS_UI_TRANSITION_SCHEMA
      ? input
      : this.resolveUiTransition(input);
    const target = transition.target;
    if (!target || !transition.active) {
      const result = {
        schema: XUTILS_UI_TRANSITION_RESULT_SCHEMA,
        status: 'fallback',
        instant: true,
        disabledBy: transition.disabledBy || 'no-target',
        transition
      };
      dispatchUiEffectsEvent('transition-fallback', result);
      return result;
    }
    const keyframes = transitionKeyframes(transition.effect, transition.phase);
    const result = await runTransitionWithTimeout(target, keyframes, {
      duration: transition.durationMs,
      easing: transition.easing,
      fill: 'both'
    });
    const completed = {
      ...result,
      transition,
      effect: transition.effect,
      phase: transition.phase,
      durationMs: transition.durationMs
    };
    dispatchUiEffectsEvent('transition-complete', completed);
    return completed;
  },
  // Accessibility-Helpers
  setAria(el, attrs = {}) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(`aria-${k}`, v));
  },
  focusTrap(container) {
    const focusable = container.querySelectorAll('a,button,input,textarea,[tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
  },
  // Responsive-Helpers
  isMobile() {
    return window.matchMedia('(max-width: 600px)').matches;
  },
  // Color-Helpers
  hexToRgb(hex) {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
    const num = parseInt(hex,16);
    return [num>>16&255, num>>8&255, num&255];
  },
  contrastColor(hex) {
    const [r,g,b] = XUtils.hexToRgb(hex);
    return (r*0.299+g*0.587+b*0.114)>186 ? '#000' : '#fff';
  },
  // Format-Helpers
  formatDate(date, locale = 'de-DE') {
    return new Date(date).toLocaleDateString(locale);
  },
  formatNumber(num, locale = 'de-DE') {
    return new Intl.NumberFormat(locale).format(num);
  },
  // Misc
  uniqueId(prefix = 'xutils-') {
    return prefix + Math.random().toString(36).slice(2,10);
  },
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  // LowCode Recipes: XTemplate
  XTemplate: {
    /**
     * Erzeugt eine XTend Card-Komponente
     * @param {Object} opts - Optionen: {title, content, actions, style}
     * @returns {HTMLElement}
     */
    card(opts = {}) {
      const card = XUtils.create('div', { className: 'x-card', style: opts.style || '' });
      if (opts.title) {
        const title = XUtils.create('div', { className: 'x-card-title', textContent: opts.title });
        card.appendChild(title);
      }
      if (opts.content) {
        const content = XUtils.create('div', { className: 'x-card-content', textContent: opts.content });
        card.appendChild(content);
      }
      if (opts.actions && Array.isArray(opts.actions)) {
        const actions = XUtils.create('div', { className: 'x-card-actions' });
        opts.actions.forEach(act => {
          const btn = XUtils.create('button', { className: 'x-card-btn', textContent: act.label });
          if (act.onClick) XUtils.on(btn, 'click', act.onClick);
          actions.appendChild(btn);
        });
        card.appendChild(actions);
      }
      return card;
    },
    /**
     * Erzeugt eine XTend Button-Komponente
     * @param {Object} opts - Optionen: {label, style, onClick}
     * @returns {HTMLElement}
     */
    button(opts = {}) {
      const btn = XUtils.create('button', { className: 'x-btn', textContent: opts.label || 'Button', style: opts.style || '' });
      if (opts.onClick) XUtils.on(btn, 'click', opts.onClick);
      return btn;
    },
    /**
     * Erzeugt ein XTend Modal
     * @param {Object} opts - Optionen: {title, content, actions, style}
     * @returns {HTMLElement}
     */
    modal(opts = {}) {
      const modal = XUtils.create('div', { className: 'x-modal', style: opts.style || '' });
      if (opts.title) {
        const title = XUtils.create('div', { className: 'x-modal-title', textContent: opts.title });
        modal.appendChild(title);
      }
      if (opts.content) {
        const content = XUtils.create('div', { className: 'x-modal-content', textContent: opts.content });
        modal.appendChild(content);
      }
      if (opts.actions && Array.isArray(opts.actions)) {
        const actions = XUtils.create('div', { className: 'x-modal-actions' });
        opts.actions.forEach(act => {
          const btn = XUtils.create('button', { className: 'x-modal-btn', textContent: act.label });
          if (act.onClick) XUtils.on(btn, 'click', act.onClick);
          actions.appendChild(btn);
        });
        modal.appendChild(actions);
      }
      return modal;
    }
  }
};

// Als globale Variable verfügbar machen
if (typeof window !== 'undefined') {
  window.XUtils = XUtils;
}

export {
  XUTILS_BOUNDARY_PROBE_SCHEMA,
  XUTILS_IMPORT_POLICY_RESULT_SCHEMA,
  XUTILS_IMPORT_POLICY_SCHEMA,
  XUTILS_UI_EFFECTS_SCHEMA,
  XUTILS_UI_TRANSITION_RESULT_SCHEMA,
  XUTILS_UI_TRANSITION_SCHEMA,
  XUTILS_UTILITY_CONTRACT_SCHEMA
};
