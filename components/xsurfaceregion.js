const SURFACE_REGION_INITIAL_OPERATIONS = new Set(['register', 'open', 'focus']);
const SURFACE_REGION_CSS_UNITS = '(?:px|rem|em|ch|ex|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|svi|svb|lvw|lvh|lvi|lvb|dvw|dvh|dvi|dvb|cqw|cqh|cqi|cqb|cqmin|cqmax|%)';
const SURFACE_REGION_CSS_FUNCTIONS = new Set(['calc', 'clamp', 'min', 'max']);

function isSurfaceRegionCssLength(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return true;
  if (new RegExp(`^-?\\d+(?:\\.\\d+)?${SURFACE_REGION_CSS_UNITS}$`, 'u').test(raw)) return true;
  const functionMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\((.*)\)$/u);
  if (!functionMatch) return false;
  const functionName = functionMatch[1].toLowerCase();
  const body = functionMatch[2].trim();
  if (!SURFACE_REGION_CSS_FUNCTIONS.has(functionName) || !body) return false;
  if (/[;{}]/u.test(body) || /url\s*\(|var\s*\(|env\s*\(|attr\s*\(/iu.test(body)) return false;
  return /^[0-9A-Za-z\s.,+\-*/()%]+$/u.test(body);
}

function surfaceRegionCssLength(value, fallback) {
  if (value === undefined || value === null || value === '') return `${fallback}px`;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const raw = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return `${Number(raw)}px`;
  return isSurfaceRegionCssLength(raw) ? raw : `${fallback}px`;
}

function optionalSurfaceRegionCssLength(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const raw = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return `${Number(raw)}px`;
  return isSurfaceRegionCssLength(raw) ? raw : null;
}

function surfaceRegionNumericAttribute(element, name, fallback) {
  const numeric = Number(element.getAttribute(name));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function surfaceRegionBoundsContainerHost(element) {
  const manager = element.closest && element.closest('x-surface-manager');
  if (manager) return manager;
  const portal = element.closest && element.closest('x-surface-portal');
  if (portal) return portal.closest('x-surface-manager') || portal.parentElement || portal;
  return element.parentElement || null;
}

function syncSurfaceRegionBoundsContainerScope(element, active) {
  element.toggleAttribute('data-surface-bounds-scope-container', Boolean(active));
  const host = active ? surfaceRegionBoundsContainerHost(element) : element._boundsContainerHost || surfaceRegionBoundsContainerHost(element);
  if (!host || typeof host.setAttribute !== 'function') return;
  if (active) {
    element._boundsContainerHost = host;
    host.setAttribute('surface-bounds-container', '');
    host.setAttribute('data-surface-bounds-container', 'true');
    if (host.style && !host.style.getPropertyValue('container-type')) {
      host.setAttribute('data-surface-bounds-container-type-owner', 'true');
      host.style.setProperty('container-type', 'inline-size');
    }
    if (host.style && !host.style.getPropertyValue('container-name')) {
      host.setAttribute('data-surface-bounds-container-name-owner', 'true');
      host.style.setProperty('container-name', 'xtend-surface-bounds');
    }
    return;
  }
  const hasActiveChild = typeof host.querySelector === 'function' && host.querySelector('[data-surface-bounds-scope-container]');
  if (host.getAttribute('data-surface-bounds-container') === 'true' && !hasActiveChild) {
    host.removeAttribute('surface-bounds-container');
    host.removeAttribute('data-surface-bounds-container');
    if (host.getAttribute('data-surface-bounds-container-type-owner') === 'true' && host.style) {
      host.style.removeProperty('container-type');
      host.removeAttribute('data-surface-bounds-container-type-owner');
    }
    if (host.getAttribute('data-surface-bounds-container-name-owner') === 'true' && host.style) {
      host.style.removeProperty('container-name');
      host.removeAttribute('data-surface-bounds-container-name-owner');
    }
  }
  if (element._boundsContainerHost === host) element._boundsContainerHost = null;
}

class XSurfaceRegion extends HTMLElement {
  static get observedAttributes() {
    return [
      'surface-id',
      'label',
      'kind',
      'open',
      'active',
      'hidden',
      'mode',
      'placement',
      'bounds-mode',
      'bounds-scope',
      'initial-x',
      'initial-y',
      'initial-width',
      'initial-height',
      'initial-min-width',
      'initial-min-height',
      'initial-max-width',
      'initial-max-height',
      'role'
    ];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-surface-region',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.legacy-esm.component-source',
        state: 'js-runtime',
        sourcePath: 'components/xsurfaceregion.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsurfaceregion.js',
        declaration: 'components/xsurfaceregion.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        surfaceContract: 'xtend.surface.record.v1',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'visible',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-surface-region',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['surface.visible.render', 'surface.user-blocking.open', 'surface.transition.layout', 'surface.diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'visible' },
      surface: {
        schema: 'xtend.surface.record.v1',
        type: 'region',
        kinds: ['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'],
        controller: 'xtend.surface.controller.v2'
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      budgetClass: 'surface-content',
      lane: 'surface.region.visible',
      hydrationPolicy: 'visible',
      measurements: ['surface-record-sync', 'bounds-application', 'command-dispatch']
    };
  }

  constructor() {
    super();
    this.surfaceManager = null;
    this._applyingSnapshot = false;
    this._boundsCommitted = false;
    this._onPointerDown = this.focusRegion.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --surface-region-x: 0px;
          --surface-region-y: 0px;
          --surface-region-width: auto;
          --surface-region-height: auto;
          --surface-region-min-width: 0;
          --surface-region-min-height: 0;
          --surface-region-max-width: none;
          --surface-region-max-height: none;
          --surface-region-z: 0;
          display: block;
          position: relative;
          min-width: var(--surface-region-min-width);
          min-height: var(--surface-region-min-height);
          max-width: var(--surface-region-max-width);
          max-height: var(--surface-region-max-height);
          z-index: var(--surface-region-z);
          box-sizing: border-box;
        }
        :host([mode="floating"]) {
          position: absolute;
          left: var(--surface-region-x);
          top: var(--surface-region-y);
          width: var(--surface-region-width);
          height: var(--surface-region-height);
        }
        :host([hidden]),
        :host(:not([open])) {
          display: none;
        }
        :host([active]) {
          outline: var(--surface-region-active-outline, 0);
        }
        .region {
          box-sizing: border-box;
          min-width: 0;
          min-height: 0;
          width: 100%;
          height: 100%;
        }
        :host(:not([mode="floating"])) .region {
          width: auto;
          height: auto;
        }
      </style>
      <section class="region" part="region" tabindex="-1">
        <slot></slot>
      </section>
    `;
    this._region = this.shadowRoot.querySelector('.region');
  }

  connectedCallback() {
    if (!this.hasAttribute('surface-id') && this.id) this.setAttribute('surface-id', this.id);
    if (!this.hasAttribute('kind')) this.setAttribute('kind', this.getAttribute('data-surface-kind') || 'region');
    if (!this.hasAttribute('open') && !this.hasAttribute('hidden')) this.setAttribute('open', '');
    this._syncA11y();
    this._syncBoundsContainerScope();
    this._applyInitialBounds();
    this.addEventListener('pointerdown', this._onPointerDown);
    this.surfaceManager = this.closest('x-surface-manager');
    if (this.surfaceManager && typeof this.surfaceManager.registerSurface === 'function') {
      this.surfaceManager.registerSurface(this);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('pointerdown', this._onPointerDown);
    this._syncBoundsContainerScope(false);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'label' || name === 'surface-id' || name === 'role') this._syncA11y();
    if (name.startsWith('initial-') || name === 'bounds-mode' || name === 'bounds-scope') {
      if (name === 'bounds-mode' || name === 'bounds-scope') this._syncBoundsContainerScope();
      this._applyInitialBounds();
    }
    if (this._applyingSnapshot || !this.isConnected) return;
    if (name === 'open') {
      this.hasAttribute('open') ? this.openRegion() : this.closeRegion('attribute');
    }
  }

  get surfaceId() {
    return this.getAttribute('surface-id') || this.id || 'surface.region';
  }

  get kind() {
    return this.getAttribute('kind') || this.getAttribute('data-surface-kind') || 'region';
  }

  get open() {
    return this.hasAttribute('open') && !this.hasAttribute('hidden');
  }

  set open(value) {
    this.toggleAttribute('open', Boolean(value));
    this.toggleAttribute('hidden', !value);
  }

  toSurfaceRecord(managerId) {
    const mode = this.getAttribute('mode') || 'region';
    return {
      schema: 'xtend.surface.record.v1',
      id: this.surfaceId,
      type: 'region',
      kind: this.kind,
      manager: managerId,
      label: this.getAttribute('label') || this.surfaceId,
      placement: this.getAttribute('placement') || null,
      mode,
      initialBounds: this._readBounds(),
      capabilities: ['open', 'focus', 'close', 'update', 'restore', 'snapshot'],
      defaultOpen: this.open,
      modal: false,
      metadata: {
        source: 'x-surface-region',
        surfaceKind: this.kind,
        boundsMode: this._boundsMode(),
        boundsScope: this._boundsScope(),
        initialBoundsCss: this._initialBoundsCss()
      }
    };
  }

  applySurfaceSnapshot(record) {
    this._applyingSnapshot = true;
    const bounds = record.bounds || this._readBounds();
    if (!this._preserveResponsiveInitialBounds(record)) {
      this._boundsCommitted = true;
      this._clearResponsiveMaxBounds();
      this.style.setProperty('--surface-region-x', `${Number(bounds.x) || 0}px`);
      this.style.setProperty('--surface-region-y', `${Number(bounds.y) || 0}px`);
      this.style.setProperty('--surface-region-width', `${Number(bounds.width) || 640}px`);
      this.style.setProperty('--surface-region-height', `${Number(bounds.height) || 360}px`);
      if (bounds.minWidth !== undefined) this.style.setProperty('--surface-region-min-width', `${Number(bounds.minWidth) || 0}px`);
      if (bounds.minHeight !== undefined) this.style.setProperty('--surface-region-min-height', `${Number(bounds.minHeight) || 0}px`);
    }
    this.style.setProperty('--surface-region-z', String(record.zIndex || 0));
    this.toggleAttribute('open', record.status !== 'closed');
    this.toggleAttribute('hidden', record.status === 'closed');
    this.toggleAttribute('active', Boolean(record.active));
    if (record.kind) this.setAttribute('kind', record.kind);
    if (record.mode) this.setAttribute('mode', record.mode);
    if (record.placement) this.setAttribute('placement', record.placement);
    this._syncA11y(record);
    this._applyingSnapshot = false;
  }

  openRegion() {
    return this._command('open');
  }

  closeRegion(reason) {
    return this._command('close', { reason });
  }

  focusRegion() {
    return this._command('focus');
  }

  restoreRegion() {
    return this._command('restore');
  }

  updateRegion(payload = {}) {
    return this._command('update', payload);
  }

  _readBounds() {
    return {
      x: surfaceRegionNumericAttribute(this, 'initial-x', 0),
      y: surfaceRegionNumericAttribute(this, 'initial-y', 0),
      width: surfaceRegionNumericAttribute(this, 'initial-width', 640),
      height: surfaceRegionNumericAttribute(this, 'initial-height', 360),
      minWidth: 160,
      minHeight: 96
    };
  }

  _boundsMode() {
    return this.getAttribute('bounds-mode') === 'responsive' ? 'responsive' : 'fixed';
  }

  _boundsScope() {
    return this.getAttribute('bounds-scope') === 'container' ? 'container' : 'viewport';
  }

  _syncBoundsContainerScope(active = this._boundsMode() === 'responsive' && this._boundsScope() === 'container') {
    syncSurfaceRegionBoundsContainerScope(this, active);
  }

  _initialBoundsCss() {
    return {
      x: surfaceRegionCssLength(this.getAttribute('initial-x'), 0),
      y: surfaceRegionCssLength(this.getAttribute('initial-y'), 0),
      width: surfaceRegionCssLength(this.getAttribute('initial-width'), 640),
      height: surfaceRegionCssLength(this.getAttribute('initial-height'), 360),
      minWidth: optionalSurfaceRegionCssLength(this.getAttribute('initial-min-width')),
      minHeight: optionalSurfaceRegionCssLength(this.getAttribute('initial-min-height')),
      maxWidth: optionalSurfaceRegionCssLength(this.getAttribute('initial-max-width')),
      maxHeight: optionalSurfaceRegionCssLength(this.getAttribute('initial-max-height'))
    };
  }

  _preserveResponsiveInitialBounds(record = {}) {
    if (this._boundsMode() !== 'responsive' || this._boundsCommitted) return false;
    const operation = record && record.lifecycle && record.lifecycle.operation || '';
    return !operation || SURFACE_REGION_INITIAL_OPERATIONS.has(operation);
  }

  _applyInitialBounds() {
    const bounds = this._readBounds();
    const cssBounds = this._initialBoundsCss();
    this.style.setProperty('--surface-region-x', cssBounds.x || `${bounds.x}px`);
    this.style.setProperty('--surface-region-y', cssBounds.y || `${bounds.y}px`);
    this.style.setProperty('--surface-region-width', cssBounds.width || `${bounds.width}px`);
    this.style.setProperty('--surface-region-height', cssBounds.height || `${bounds.height}px`);
    ['minWidth', 'minHeight', 'maxWidth', 'maxHeight'].forEach((field) => {
      const property = `--surface-region-${field.replace(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`)}`;
      if (cssBounds[field]) this.style.setProperty(property, cssBounds[field]);
      else this.style.removeProperty(property);
    });
  }

  _clearResponsiveMaxBounds() {
    this.style.removeProperty('--surface-region-max-width');
    this.style.removeProperty('--surface-region-max-height');
  }

  _syncA11y(record = null) {
    if (!this._region) return;
    const label = this.getAttribute('label') || this.surfaceId;
    const role = this.getAttribute('role') || (this.kind === 'page' ? 'main' : 'region');
    this._region.setAttribute('role', role);
    this._region.setAttribute('aria-label', label);
    this._region.setAttribute('aria-hidden', record && record.status === 'closed' || this.hasAttribute('hidden') ? 'true' : 'false');
  }

  _command(command, payload = {}) {
    const detail = {
      surfaceId: this.surfaceId,
      command,
      payload
    };
    this.dispatchEvent(new CustomEvent('surface-region-command', {
      bubbles: true,
      composed: true,
      detail
    }));
    return detail;
  }
}

if (!customElements.get('x-surface-region')) {
  customElements.define('x-surface-region', XSurfaceRegion);
}

export { XSurfaceRegion };
