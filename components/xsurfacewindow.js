import './xicon.js';

const SURFACE_BOUNDS_INITIAL_OPERATIONS = new Set(['register', 'open', 'focus']);
const SURFACE_BOUNDS_CSS_UNITS = '(?:px|rem|em|ch|ex|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|svi|svb|lvw|lvh|lvi|lvb|dvw|dvh|dvi|dvb|cqw|cqh|cqi|cqb|cqmin|cqmax|%)';
const SURFACE_BOUNDS_CSS_FUNCTIONS = new Set(['calc', 'clamp', 'min', 'max']);

function isSurfaceCssLength(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return true;
  if (new RegExp(`^-?\\d+(?:\\.\\d+)?${SURFACE_BOUNDS_CSS_UNITS}$`, 'u').test(raw)) return true;
  const functionMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\((.*)\)$/u);
  if (!functionMatch) return false;
  const functionName = functionMatch[1].toLowerCase();
  const body = functionMatch[2].trim();
  if (!SURFACE_BOUNDS_CSS_FUNCTIONS.has(functionName) || !body) return false;
  if (/[;{}]/u.test(body) || /url\s*\(|var\s*\(|env\s*\(|attr\s*\(/iu.test(body)) return false;
  return /^[0-9A-Za-z\s.,+\-*/()%]+$/u.test(body);
}

function surfaceCssLength(value, fallback) {
  if (value === undefined || value === null || value === '') return `${fallback}px`;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const raw = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return `${Number(raw)}px`;
  return isSurfaceCssLength(raw) ? raw : `${fallback}px`;
}

function optionalSurfaceCssLength(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const raw = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return `${Number(raw)}px`;
  return isSurfaceCssLength(raw) ? raw : null;
}

function numericAttribute(element, name, fallback) {
  const numeric = Number(element.getAttribute(name));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function numericStyleValue(style, property, fallback = 0) {
  if (!style || typeof style.getPropertyValue !== 'function') return fallback;
  const numeric = Number.parseFloat(style.getPropertyValue(property));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function surfaceBoundsContainerHost(element) {
  const manager = element.closest && element.closest('x-surface-manager');
  if (manager) return manager;
  const portal = element.closest && element.closest('x-surface-portal');
  if (portal) return portal.closest('x-surface-manager') || portal.parentElement || portal;
  return element.parentElement || null;
}

function syncSurfaceBoundsContainerScope(element, active) {
  element.toggleAttribute('data-surface-bounds-scope-container', Boolean(active));
  const host = active ? surfaceBoundsContainerHost(element) : element._boundsContainerHost || surfaceBoundsContainerHost(element);
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

class XSurfaceWindow extends HTMLElement {
  static get observedAttributes() {
    return ['surface-id', 'label', 'open', 'active', 'minimized', 'maximized', 'resizable', 'draggable', 'modal', 'bounds-mode', 'bounds-scope', 'initial-x', 'initial-y', 'initial-width', 'initial-height', 'initial-min-width', 'initial-min-height', 'initial-max-width', 'initial-max-height'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-surface-window',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-surface-window/x-surface-window.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsurfacewindow.js',
        declaration: 'components/xsurfacewindow.d.ts',
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
        defaultLane: 'user-blocking',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-surface-window',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['surface.user-blocking.open', 'surface.user-blocking.close', 'surface.transition.layout', 'surface.diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      surface: {
        schema: 'xtend.surface.record.v1',
        type: 'window',
        controller: 'xtend.surface.controller.v2'
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-surface-window',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'unmount'],
      snapshotPath: 'snapshot.surfaceWindow'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-surface-window',
      role: 'dialog',
      accessibleName: 'required',
      keyboard: ['focus', 'move', 'resize', 'close'],
      screenreader: {
        signalContract: XSurfaceWindow.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XSurfaceWindow.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-surface-window',
      budgetClass: 'interactive-overlay',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['open', 'focus', 'move', 'resize'],
      cleanup: ['pointer-capture', 'window-pointermove']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-surface-window',
      liveRegion: 'polite',
      signals: ['window-opened', 'window-closed', 'window-focused', 'window-layout-changed'],
      statusRegions: ['role=dialog', 'aria-labelledby'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.surface-window',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-surface-window',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'instant-window-state',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      }
    };
  }

  constructor() {
    super();
    this.surfaceManager = null;
    this._applyingSnapshot = false;
    this._boundsCommitted = false;
    this._drag = null;
    this._resize = null;
    this._onTitlePointerDown = this._startDrag.bind(this);
    this._onResizePointerDown = this._startResize.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --surface-window-x: 64px;
          --surface-window-y: 64px;
          --surface-window-width: 640px;
          --surface-window-height: 420px;
          --surface-window-min-width: 0;
          --surface-window-min-height: 0;
          --surface-window-max-width: none;
          --surface-window-max-height: none;
          --surface-window-z: 1;
          display: none;
          position: absolute;
          left: var(--surface-window-x);
          top: var(--surface-window-y);
          width: var(--surface-window-width);
          height: var(--surface-window-height);
          z-index: var(--surface-window-z);
          min-width: var(--surface-window-min-width);
          min-height: var(--surface-window-min-height);
          max-width: var(--surface-window-max-width);
          max-height: var(--surface-window-max-height);
          color: var(--surface-window-color, var(--xtend-text, var(--text-color, #111827)));
        }
        :host([open]) {
          display: block;
        }
        :host([minimized]) {
          display: none;
        }
        :host([maximized]) {
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }
        .window {
          box-sizing: border-box;
          display: flex;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--surface-window-border, var(--xtend-border-color, var(--border-color, #cbd5e1)));
          border-radius: var(--surface-window-radius, 8px);
          background: var(--surface-window-bg, var(--xtend-surface, var(--section-bg, #ffffff)));
          box-shadow: var(--surface-window-shadow, var(--xtend-shadow-overlay, var(--xtend-elevation-2, 0 20px 50px rgba(15, 23, 42, 0.22))));
        }
        :host([active]) .window {
          border-color: var(--surface-window-active-border, var(--xtend-color-primary, var(--primary-color, #2563eb)));
          box-shadow: var(--surface-window-active-shadow, var(--surface-window-shadow, 0 24px 64px rgba(37, 99, 235, 0.22)));
        }
        .titlebar {
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 2.5rem;
          padding: 0.375rem 0.5rem 0.375rem 0.75rem;
          border-bottom: 1px solid var(--surface-window-border, var(--xtend-border-color, var(--border-color, #cbd5e1)));
          background: var(--surface-window-chrome, var(--xtend-surface-muted, var(--surface-muted, #f1f5f9)));
          cursor: default;
          user-select: none;
        }
        :host([draggable]) .titlebar {
          cursor: move;
        }
        .titlebar:focus-visible {
          outline: 2px solid var(--surface-window-focus, var(--xtend-focus-color, var(--focus-color, #2563eb)));
          outline-offset: -2px;
        }
        .title {
          min-width: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font: 600 0.875rem/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .actions {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        button {
          inline-size: 1.75rem;
          block-size: 1.75rem;
          display: inline-grid;
          place-items: center;
          border: 1px solid transparent;
          border-radius: 4px;
          background: transparent;
          color: inherit;
          font: 700 0.75rem/1 system-ui, sans-serif;
          cursor: pointer;
        }
        button x-icon {
          pointer-events: none;
        }
        button:hover,
        button:focus-visible {
          border-color: var(--surface-window-border, var(--xtend-border-color, var(--border-color, #94a3b8)));
          background: var(--surface-window-button-hover, var(--xtend-color-action-subtle, var(--surface-muted, #e2e8f0)));
          outline: none;
        }
        .content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: var(--surface-window-content-padding, 1rem);
        }
        .resize {
          position: absolute;
          right: 0;
          bottom: 0;
          inline-size: 1rem;
          block-size: 1rem;
          cursor: nwse-resize;
        }
        :host(:not([resizable])) .resize,
        :host([maximized]) .resize {
          display: none;
        }
        @media (max-width: 640px) {
          :host {
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
          .window {
            border-radius: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .window {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .window {
            forced-color-adjust: auto;
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
            box-shadow: none;
          }
          .titlebar,
          button:hover,
          button:focus-visible {
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
          }
        }
      </style>
      <section class="window" part="root surface" role="dialog" aria-modal="false" aria-labelledby="title">
        <header class="titlebar" part="titlebar" tabindex="0">
          <span id="title" class="title" part="title"></span>
          <span class="actions" part="actions">
            <button type="button" data-action="minimize" part="minimize control" aria-label="Minimize">
              <x-icon name="minus" decorative size="1rem" part="minimize-icon control icon"></x-icon>
            </button>
            <button type="button" data-action="maximize" part="maximize control" aria-label="Maximize">
              <x-icon name="maximize" decorative size="1rem" part="maximize-icon control icon"></x-icon>
            </button>
            <button type="button" data-action="close" part="close control" aria-label="Close">
              <x-icon name="close" decorative size="1rem" part="close-icon control icon"></x-icon>
            </button>
          </span>
        </header>
        <div class="content" part="content"><slot></slot></div>
        <span class="resize" part="resize-handle" aria-hidden="true"></span>
      </section>
    `;
    this._titlebar = this.shadowRoot.querySelector('.titlebar');
    this._title = this.shadowRoot.querySelector('#title');
    this._resizeHandle = this.shadowRoot.querySelector('.resize');
  }

  connectedCallback() {
    if (!this.hasAttribute('surface-id') && this.id) this.setAttribute('surface-id', this.id);
    if (!this.hasAttribute('draggable')) this.setAttribute('draggable', '');
    if (!this.hasAttribute('resizable')) this.setAttribute('resizable', '');
    this._renderLabel();
    this._syncBoundsContainerScope();
    this._applyInitialBounds();
    this._titlebar.addEventListener('pointerdown', this._onTitlePointerDown);
    this._titlebar.addEventListener('keydown', this._onKeyDown);
    this._resizeHandle.addEventListener('pointerdown', this._onResizePointerDown);
    this.shadowRoot.addEventListener('click', (event) => this._handleActionClick(event));
    this.addEventListener('pointerdown', () => this.focusWindow());
    this.surfaceManager = this.closest('x-surface-manager');
    if (this.surfaceManager && typeof this.surfaceManager.registerSurface === 'function') {
      this.surfaceManager.registerSurface(this);
    }
  }

  disconnectedCallback() {
    this._titlebar.removeEventListener('pointerdown', this._onTitlePointerDown);
    this._titlebar.removeEventListener('keydown', this._onKeyDown);
    this._resizeHandle.removeEventListener('pointerdown', this._onResizePointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this._syncBoundsContainerScope(false);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'label') this._renderLabel();
    if (name.startsWith('initial-') || name === 'bounds-mode' || name === 'bounds-scope') {
      if (name === 'bounds-mode' || name === 'bounds-scope') this._syncBoundsContainerScope();
      this._applyInitialBounds();
    }
    if (this._applyingSnapshot || !this.isConnected) return;
    if (name === 'open') {
      this.hasAttribute('open') ? this.openWindow() : this.closeWindow();
    }
  }

  get surfaceId() {
    return this.getAttribute('surface-id') || this.id || 'surface.window';
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', Boolean(value));
  }

  get active() {
    return this.hasAttribute('active');
  }

  toSurfaceRecord(managerId) {
    return {
      schema: 'xtend.surface.record.v1',
      id: this.surfaceId,
      type: 'window',
      manager: managerId,
      label: this.getAttribute('label') || this.surfaceId,
      initialBounds: this._readBounds(),
      capabilities: this._capabilities(),
      defaultOpen: this.hasAttribute('open'),
      modal: this.hasAttribute('modal'),
      metadata: {
        source: 'x-surface-window',
        boundsMode: this._boundsMode(),
        boundsScope: this._boundsScope(),
        initialBoundsCss: this._initialBoundsCss()
      }
    };
  }

  applySurfaceSnapshot(record) {
    this._applyingSnapshot = true;
    const shouldApplyBounds = !this._preserveResponsiveInitialBounds(record);
    if (shouldApplyBounds) {
      this._boundsCommitted = true;
      this._clearResponsiveMaxBounds();
      this.style.setProperty('--surface-window-x', `${record.bounds.x}px`);
      this.style.setProperty('--surface-window-y', `${record.bounds.y}px`);
      this.style.setProperty('--surface-window-width', `${record.bounds.width}px`);
      this.style.setProperty('--surface-window-height', `${record.bounds.height}px`);
      if (record.bounds.minWidth !== undefined) this.style.setProperty('--surface-window-min-width', `${record.bounds.minWidth}px`);
      if (record.bounds.minHeight !== undefined) this.style.setProperty('--surface-window-min-height', `${record.bounds.minHeight}px`);
    }
    this.style.setProperty('--surface-window-z', String(record.zIndex || 1));
    const minimized = record.status === 'minimized' || record.minimized === true;
    this.toggleAttribute('open', record.status !== 'closed' && !minimized);
    this.toggleAttribute('active', Boolean(record.active));
    this.toggleAttribute('minimized', minimized);
    this.toggleAttribute('maximized', Boolean(record.maximized));
    const windowSurface = this.shadowRoot.querySelector('.window');
    windowSurface.setAttribute('aria-hidden', record.status === 'closed' || minimized ? 'true' : 'false');
    windowSurface.setAttribute('aria-modal', record.modal ? 'true' : 'false');
    this._applyingSnapshot = false;
    this._publishSurfaceLifecycle(record, minimized);
  }

  openWindow() {
    return this._command('open');
  }

  closeWindow(reason) {
    return this._command('close', { reason });
  }

  focusWindow() {
    return this._command('focus');
  }

  minimizeWindow() {
    return this._command('minimize');
  }

  maximizeWindow() {
    return this.hasAttribute('maximized') ? this._command('restore') : this._command('maximize');
  }

  restoreWindow() {
    return this._command('restore');
  }

  _capabilities() {
    const capabilities = ['open', 'focus', 'close', 'snapshot'];
    if (this.hasAttribute('draggable')) capabilities.push('move');
    if (this.hasAttribute('resizable')) capabilities.push('resize');
    capabilities.push('minimize', 'maximize', 'restore');
    return capabilities;
  }

  _readBounds() {
    return {
      x: numericAttribute(this, 'initial-x', 64),
      y: numericAttribute(this, 'initial-y', 64),
      width: numericAttribute(this, 'initial-width', 640),
      height: numericAttribute(this, 'initial-height', 420),
      minWidth: 280,
      minHeight: 180
    };
  }

  _boundsMode() {
    return this.getAttribute('bounds-mode') === 'responsive' ? 'responsive' : 'fixed';
  }

  _boundsScope() {
    return this.getAttribute('bounds-scope') === 'container' ? 'container' : 'viewport';
  }

  _syncBoundsContainerScope(active = this._boundsMode() === 'responsive' && this._boundsScope() === 'container') {
    syncSurfaceBoundsContainerScope(this, active);
  }

  _initialBoundsCss() {
    return {
      x: surfaceCssLength(this.getAttribute('initial-x'), 64),
      y: surfaceCssLength(this.getAttribute('initial-y'), 64),
      width: surfaceCssLength(this.getAttribute('initial-width'), 640),
      height: surfaceCssLength(this.getAttribute('initial-height'), 420),
      minWidth: optionalSurfaceCssLength(this.getAttribute('initial-min-width')),
      minHeight: optionalSurfaceCssLength(this.getAttribute('initial-min-height')),
      maxWidth: optionalSurfaceCssLength(this.getAttribute('initial-max-width')),
      maxHeight: optionalSurfaceCssLength(this.getAttribute('initial-max-height'))
    };
  }

  _preserveResponsiveInitialBounds(record = {}) {
    if (this._boundsMode() !== 'responsive' || this._boundsCommitted) return false;
    const operation = record && record.lifecycle && record.lifecycle.operation || '';
    return !operation || SURFACE_BOUNDS_INITIAL_OPERATIONS.has(operation);
  }

  _applyInitialBounds() {
    if (this.hasAttribute('maximized')) return;
    const bounds = this._initialBoundsCss();
    this.style.setProperty('--surface-window-x', bounds.x);
    this.style.setProperty('--surface-window-y', bounds.y);
    this.style.setProperty('--surface-window-width', bounds.width);
    this.style.setProperty('--surface-window-height', bounds.height);
    ['minWidth', 'minHeight', 'maxWidth', 'maxHeight'].forEach((field) => {
      const property = `--surface-window-${field.replace(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`)}`;
      if (bounds[field]) this.style.setProperty(property, bounds[field]);
      else this.style.removeProperty(property);
    });
  }

  _clearResponsiveMaxBounds() {
    this.style.removeProperty('--surface-window-max-width');
    this.style.removeProperty('--surface-window-max-height');
  }

  _renderLabel() {
    if (this._title) this._title.textContent = this.getAttribute('label') || this.surfaceId;
  }

  _publishSurfaceLifecycle(record = {}, minimized = false) {
    const detail = {
      schema: 'xtend.surface.lifecycle-change.v1',
      surfaceId: this.surfaceId,
      status: record.status || (this.hasAttribute('open') ? 'open' : 'closed'),
      open: record.status !== 'closed' && !minimized,
      minimized,
      maximized: record.maximized === true,
      active: record.active === true,
      source: 'x-surface-window'
    };
    this.dispatchEvent(new CustomEvent('surface-lifecycle-change', {
      bubbles: true,
      composed: true,
      detail
    }));
    this.querySelectorAll('*').forEach((element) => {
      if (typeof element.surfaceLifecycleChanged === 'function') {
        element.surfaceLifecycleChanged(detail);
      } else if (typeof element.dispatchEvent === 'function') {
        element.dispatchEvent(new CustomEvent('surface-lifecycle-change', {
          bubbles: false,
          composed: true,
          detail
        }));
      }
    });
  }

  _handleActionClick(event) {
    const control = event.target && event.target.closest && event.target.closest('button[data-action]');
    const action = control && control.getAttribute('data-action');
    if (!action) return;
    event.preventDefault();
    if (action === 'close') this.closeWindow('button');
    if (action === 'minimize') this.minimizeWindow();
    if (action === 'maximize') this.maximizeWindow();
  }

  _handleKeyDown(event) {
    const step = event.shiftKey ? 24 : 8;
    const bounds = this._currentBounds();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeWindow('escape');
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusWindow();
    }
    if (event.key === 'ArrowLeft') this._keyboardMove(event, { x: bounds.x - step, y: bounds.y });
    if (event.key === 'ArrowRight') this._keyboardMove(event, { x: bounds.x + step, y: bounds.y });
    if (event.key === 'ArrowUp') this._keyboardMove(event, { x: bounds.x, y: bounds.y - step });
    if (event.key === 'ArrowDown') this._keyboardMove(event, { x: bounds.x, y: bounds.y + step });
  }

  _keyboardMove(event, bounds) {
    event.preventDefault();
    if (!this.hasAttribute('draggable')) return;
    this._boundsCommitted = true;
    this._clearResponsiveMaxBounds();
    this._command('move', bounds);
  }

  _startDrag(event) {
    if (!this.hasAttribute('draggable') || this.hasAttribute('maximized') || event.target.closest('button')) return;
    const bounds = this._currentBounds();
    this._drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      bounds
    };
    this._titlebar.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    this.focusWindow();
  }

  _startResize(event) {
    if (!this.hasAttribute('resizable') || this.hasAttribute('maximized')) return;
    const bounds = this._currentBounds();
    this._clearResponsiveMaxBounds();
    this._resize = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      bounds
    };
    this._resizeHandle.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    event.preventDefault();
  }

  _handlePointerMove(event) {
    if (this._drag) {
      const x = Math.max(0, this._drag.bounds.x + event.clientX - this._drag.startX);
      const y = Math.max(0, this._drag.bounds.y + event.clientY - this._drag.startY);
      this.style.setProperty('--surface-window-x', `${x}px`);
      this.style.setProperty('--surface-window-y', `${y}px`);
    }
    if (this._resize) {
      const width = Math.max(280, this._resize.bounds.width + event.clientX - this._resize.startX);
      const height = Math.max(180, this._resize.bounds.height + event.clientY - this._resize.startY);
      this.style.setProperty('--surface-window-width', `${width}px`);
      this.style.setProperty('--surface-window-height', `${height}px`);
    }
  }

  _handlePointerUp() {
    if (this._drag || this._resize) this._boundsCommitted = true;
    if (this._drag) this._command('move', this._currentBounds());
    if (this._resize) this._command('resize', this._currentBounds());
    this._drag = null;
    this._resize = null;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }

  _currentBounds() {
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(this) : null;
    const rect = typeof this.getBoundingClientRect === 'function' ? this.getBoundingClientRect() : null;
    const fallback = this._readBounds();
    return {
      x: numericStyleValue(style, 'left', numericStyleValue(style, '--surface-window-x', fallback.x)),
      y: numericStyleValue(style, 'top', numericStyleValue(style, '--surface-window-y', fallback.y)),
      width: rect && rect.width ? rect.width : numericStyleValue(style, 'width', this.offsetWidth || fallback.width),
      height: rect && rect.height ? rect.height : numericStyleValue(style, 'height', this.offsetHeight || fallback.height),
      minWidth: fallback.minWidth,
      minHeight: fallback.minHeight
    };
  }

  _command(command, payload = {}) {
    this.dispatchEvent(new CustomEvent('surface-window-command', {
      bubbles: true,
      composed: true,
      detail: {
        surfaceId: this.surfaceId,
        command,
        payload
      }
    }));
  }
}

if (!customElements.get('x-surface-window')) {
  customElements.define('x-surface-window', XSurfaceWindow);
}

export { XSurfaceWindow };
