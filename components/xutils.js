/**
 * XUtils - XTend Utility-Komponente
 * Vereinigt zentrale Hilfsfunktionen für UI-Komponenten nach XTend-Designrichtlinien.
 * Modular, erweiterbar, und für alle XTend-Komponenten nutzbar.
 */

const XUTILS_UTILITY_CONTRACT_SCHEMA = 'xtend.utility.module-contract.v1';
const XUTILS_IMPORT_POLICY_SCHEMA = 'xtend.utility.import-policy.v1';
const XUTILS_IMPORT_POLICY_RESULT_SCHEMA = 'xtend.utility.import-policy-result.v1';
const XUTILS_BOUNDARY_PROBE_SCHEMA = 'xtend.utility.boundary-probe.v1';
const XUTILS_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const XUTILS_FORBIDDEN_IMPORT_PROTOCOLS = Object.freeze(['http:', 'https:', 'data:', 'javascript:']);
const XUTILS_FORBIDDEN_IMPORT_HOSTS = Object.freeze(['cdn.ccs-networks.de']);

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

export const XUtils = {
  xtendUtilityContract: {
    schema: XUTILS_UTILITY_CONTRACT_SCHEMA,
    componentRef: 'x-utils',
    moduleRef: 'xutils',
    customElement: false,
    categories: ['dom', 'events', 'animation', 'a11y', 'responsive', 'color', 'format', 'templates'],
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
  XUTILS_UTILITY_CONTRACT_SCHEMA
};
