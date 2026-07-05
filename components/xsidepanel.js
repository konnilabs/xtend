import './xicon.js';

const SIDE_PANEL_INITIAL_OPERATIONS = new Set(['register', 'open', 'focus']);
const SIDE_PANEL_CSS_UNITS = '(?:px|rem|em|ch|ex|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|svi|svb|lvw|lvh|lvi|lvb|dvw|dvh|dvi|dvb|cqw|cqh|cqi|cqb|cqmin|cqmax|%)';
const SIDE_PANEL_CSS_FUNCTIONS = new Set(['calc', 'clamp', 'min', 'max']);

function isSidePanelCssLength(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return true;
  if (new RegExp(`^-?\\d+(?:\\.\\d+)?${SIDE_PANEL_CSS_UNITS}$`, 'u').test(raw)) return true;
  const functionMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\((.*)\)$/u);
  if (!functionMatch) return false;
  const functionName = functionMatch[1].toLowerCase();
  const body = functionMatch[2].trim();
  if (!SIDE_PANEL_CSS_FUNCTIONS.has(functionName) || !body) return false;
  if (/[;{}]/u.test(body) || /url\s*\(|var\s*\(|env\s*\(|attr\s*\(/iu.test(body)) return false;
  return /^[0-9A-Za-z\s.,+\-*/()%]+$/u.test(body);
}

function sidePanelCssLength(value, fallback) {
  if (value === undefined || value === null || value === '') return `${fallback}px`;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const raw = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return `${Number(raw)}px`;
  return isSidePanelCssLength(raw) ? raw : `${fallback}px`;
}

function optionalSidePanelCssLength(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const raw = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return `${Number(raw)}px`;
  return isSidePanelCssLength(raw) ? raw : null;
}

function sidePanelNumericAttribute(element, name, fallback) {
  const numeric = Number(element.getAttribute(name));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sidePanelNumericStyle(style, property, fallback = 0) {
  if (!style || typeof style.getPropertyValue !== 'function') return fallback;
  const numeric = Number.parseFloat(style.getPropertyValue(property));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sidePanelBoundsContainerHost(element) {
  const manager = element.closest && element.closest('x-surface-manager');
  if (manager) return manager;
  const portal = element.closest && element.closest('x-surface-portal');
  if (portal) return portal.closest('x-surface-manager') || portal.parentElement || portal;
  return element.parentElement || null;
}

function syncSidePanelBoundsContainerScope(element, active) {
  element.toggleAttribute('data-surface-bounds-scope-container', Boolean(active));
  const host = active ? sidePanelBoundsContainerHost(element) : element._boundsContainerHost || sidePanelBoundsContainerHost(element);
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

class XSidePanel extends HTMLElement {
  static get observedAttributes() {
    return [
      'surface-id',
      'label',
      'open',
      'active',
      'minimized',
      'collapsed',
      'pinned',
      'mode',
      'placement',
      'bounds-mode',
      'bounds-scope',
      'responsive-mode',
      'resizable',
      'collapsible',
      'collapsable',
      'closable',
      'pinnable',
      'route-aware',
      'modal',
      'initial-x',
      'initial-y',
      'initial-width',
      'initial-height',
      'initial-min-width',
      'initial-min-height',
      'initial-max-width',
      'initial-max-height'
    ];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-side-panel',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-side-panel/x-side-panel.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsidepanel.js',
        declaration: 'components/xsidepanel.d.ts',
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
      tag: 'x-side-panel',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['surface.visible.render', 'surface.user-blocking.open', 'surface.user-blocking.close', 'surface.transition.layout', 'surface.diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'visible' },
      surface: {
        schema: 'xtend.surface.record.v1',
        type: 'side-panel',
        responsiveModes: ['docked', 'overlay', 'pinned', 'collapsed', 'fullscreen'],
        controller: 'xtend.surface.controller.v1'
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-side-panel',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'unmount'],
      snapshotPath: 'snapshot.sidePanel'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-side-panel',
      role: 'complementary',
      accessibleName: 'required',
      keyboard: ['focus', 'close', 'collapse', 'resize'],
      screenreader: {
        signalContract: XSidePanel.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XSidePanel.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-side-panel',
      budgetClass: 'interactive-shell-panel',
      lane: 'visible',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['open', 'collapse', 'dock', 'resize'],
      cleanup: ['pointer-capture', 'window-pointermove', 'route-listeners']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-side-panel',
      liveRegion: 'polite',
      signals: ['side-panel-opened', 'side-panel-closed', 'side-panel-focused', 'side-panel-collapsed', 'side-panel-expanded'],
      statusRegions: ['role=complementary', 'aria-labelledby', 'aria-expanded'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.side-panel',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-side-panel',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'instant-side-panel-state',
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
    this._resize = null;
    this._onResizePointerDown = this._startResize.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onActionClick = this._handleActionClick.bind(this);
    this._onRouteChanged = this._handleRouteChanged.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xtend-overlay-surface: var(--xtend-surface, var(--section-bg, #ffffff));
          --xtend-overlay-text: var(--xtend-text, var(--text-color, #111827));
          --xtend-overlay-border-color: var(--xtend-border-color, var(--border-color, #cbd5e1));
          --xtend-overlay-elevation: var(--xtend-shadow-overlay, var(--xtend-elevation-2, -18px 0 44px rgba(15, 23, 42, 0.16)));
          --xtend-overlay-backdrop: var(--xtend-overlay-bg, rgba(15, 23, 42, 0.38));
          --xtend-overlay-focus-ring: 2px solid var(--xtend-focus-color, var(--xtend-color-primary, var(--primary-color, #2563eb)));
          --xtend-overlay-z: var(--surface-overlay-z, var(--side-panel-z, 1));
          --side-panel-width: 320px;
          --side-panel-height: 100%;
          --side-panel-min-width: 0;
          --side-panel-min-height: 0;
          --side-panel-max-width: none;
          --side-panel-max-height: none;
          --side-panel-z: 1;
          --side-panel-bg: var(--xtend-overlay-surface);
          --side-panel-color: var(--xtend-overlay-text);
          --side-panel-border: var(--xtend-overlay-border-color);
          --side-panel-shadow: var(--xtend-overlay-elevation);
          --side-panel-backdrop: var(--xtend-overlay-backdrop);
          --side-panel-focus: var(--xtend-focus-color, var(--xtend-color-primary, var(--primary-color, #2563eb)));
          --surface-layout-x: 0px;
          --surface-layout-y: 0px;
          display: none;
          position: absolute;
          inset-block: 0;
          inline-size: var(--side-panel-width);
          block-size: var(--side-panel-height);
          z-index: var(--xtend-overlay-z);
          min-inline-size: var(--side-panel-min-width);
          min-block-size: var(--side-panel-min-height);
          max-inline-size: var(--side-panel-max-width);
          max-block-size: var(--side-panel-max-height);
          color: var(--side-panel-color);
        }
        :host([open]) {
          display: block;
        }
        :host([minimized]) {
          display: none;
        }
        :host([placement="left"]) {
          inset-inline-start: 0;
        }
        :host(:not([placement="left"])) {
          inset-inline-end: 0;
        }
        :host([placement="bottom"]) {
          inset-inline: 0;
          inset-block-start: auto;
          inset-block-end: 0;
          inline-size: 100%;
          block-size: var(--side-panel-height, 320px);
        }
        :host([placement="inline"]) {
          position: relative;
          inset: auto;
          inline-size: var(--side-panel-width);
          block-size: 100%;
        }
        :host([mode="floating"]) {
          position: absolute;
          inset: auto;
          inset-inline-start: var(--surface-layout-x);
          inset-block-start: var(--surface-layout-y);
          inline-size: var(--side-panel-width);
          block-size: var(--side-panel-height);
        }
        :host([collapsed]) {
          inline-size: var(--side-panel-collapsed-width, 3rem);
        }
        :host([placement="bottom"][collapsed]) {
          inline-size: 100%;
          block-size: var(--side-panel-collapsed-height, 3rem);
        }
        .scrim {
          position: fixed;
          inset: 0;
          display: none;
          background: var(--side-panel-backdrop);
        }
        :host([mode="overlay"]) .scrim,
        :host([modal]) .scrim {
          display: block;
        }
        .panel {
          box-sizing: border-box;
          display: flex;
          position: relative;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--side-panel-border);
          background: var(--side-panel-bg);
          box-shadow: var(--side-panel-shadow);
          transition: width 160ms ease, height 160ms ease, transform 160ms ease;
        }
        :host([placement="left"]) .panel {
          box-shadow: var(--side-panel-shadow-left, 18px 0 44px rgba(15, 23, 42, 0.16));
        }
        :host([placement="bottom"]) .panel {
          box-shadow: var(--side-panel-shadow-bottom, 0 -18px 44px rgba(15, 23, 42, 0.16));
        }
        :host([mode="docked"]) .panel,
        :host([mode="pinned"]) .panel {
          box-shadow: var(--side-panel-docked-shadow, none);
        }
        :host([active]) .panel {
          border-color: var(--side-panel-active-border, #2563eb);
        }
        header {
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 2.75rem;
          padding: 0.375rem 0.5rem 0.375rem 0.75rem;
          border-bottom: 1px solid var(--side-panel-border, var(--xtend-border-color, var(--border-color, #cbd5e1)));
          background: var(--side-panel-chrome, var(--xtend-surface-muted, var(--surface-muted, #f8fafc)));
        }
        header:focus-visible {
          outline: var(--xtend-overlay-focus-ring);
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
        :host([collapsed]) .title {
          writing-mode: vertical-rl;
          text-overflow: clip;
        }
        .actions {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .actions[hidden],
        button[hidden] {
          display: none;
        }
        :host([collapsed]) .actions button[data-action="pin"],
        :host([collapsed]) .actions button[data-action="close"] {
          display: none;
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
          border-color: var(--side-panel-border-strong, var(--side-panel-border, #94a3b8));
          background: var(--side-panel-button-hover, var(--xtend-color-action-subtle, var(--surface-muted, #e2e8f0)));
          outline: none;
        }
        .content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: var(--side-panel-content-padding, 1rem);
        }
        :host([collapsed]) .content {
          display: none;
        }
        .resize {
          position: absolute;
          inset-block: 0;
          inline-size: 0.75rem;
          cursor: ew-resize;
        }
        :host([placement="right"]) .resize,
        :host(:not([placement])) .resize {
          inset-inline-start: 0;
        }
        :host([placement="left"]) .resize {
          inset-inline-end: 0;
        }
        :host([placement="bottom"]) .resize {
          inset-block-start: 0;
          inset-inline: 0;
          block-size: 0.75rem;
          inline-size: 100%;
          cursor: ns-resize;
        }
        :host(:not([resizable])) .resize,
        :host([collapsed]) .resize {
          display: none;
        }
        @media (max-width: 720px) {
          :host(:not([placement="inline"])) {
            inset: 0;
            inline-size: 100%;
            block-size: 100%;
          }
          :host(:not([placement="inline"])) .panel {
            border-radius: 0;
          }
          :host([collapsed]) {
            inline-size: 100%;
            block-size: var(--side-panel-collapsed-height, 3rem);
            inset-block-start: auto;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .panel {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .scrim {
            background: Canvas;
            opacity: 0.6;
          }
          .panel {
            forced-color-adjust: auto;
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
            box-shadow: none;
          }
          header,
          button:hover,
          button:focus-visible {
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
          }
        }
      </style>
      <div class="scrim" part="backdrop scrim" data-action="close"></div>
      <aside class="panel" part="root surface overlay-surface" role="complementary" aria-labelledby="title" aria-expanded="true">
        <header part="header" tabindex="0">
          <span id="title" class="title" part="title"></span>
          <span class="actions" part="actions">
            <button type="button" data-action="pin" part="pin control" aria-label="Pin panel">
              <x-icon name="pin" decorative size="1rem" part="pin-icon control icon"></x-icon>
            </button>
            <button type="button" data-action="collapse" part="collapse control" aria-label="Collapse panel">
              <x-icon name="chevron-left" decorative size="1rem" part="collapse-icon control icon"></x-icon>
            </button>
            <button type="button" data-action="close" part="close control" aria-label="Close panel">
              <x-icon name="close" decorative size="1rem" part="close-icon control icon"></x-icon>
            </button>
          </span>
        </header>
        <div class="content" part="content"><slot></slot></div>
        <span class="resize" part="resize-handle" aria-hidden="true"></span>
      </aside>
    `;
    this._panel = this.shadowRoot.querySelector('.panel');
    this._header = this.shadowRoot.querySelector('header');
    this._title = this.shadowRoot.querySelector('#title');
    this._resizeHandle = this.shadowRoot.querySelector('.resize');
    this._actions = this.shadowRoot.querySelector('.actions');
    this._collapseButton = this.shadowRoot.querySelector('button[data-action="collapse"]');
    this._collapseIcon = this.shadowRoot.querySelector('button[data-action="collapse"] x-icon');
    this._pinButton = this.shadowRoot.querySelector('button[data-action="pin"]');
    this._closeButton = this.shadowRoot.querySelector('button[data-action="close"]');
  }

  connectedCallback() {
    if (!this.hasAttribute('surface-id') && this.id) this.setAttribute('surface-id', this.id);
    if (!this.hasAttribute('placement')) this.setAttribute('placement', 'right');
    if (!this.hasAttribute('mode')) this.setAttribute('mode', 'docked');
    if (!this.hasAttribute('resizable')) this.setAttribute('resizable', '');
    this._renderLabel();
    this._syncBoundsContainerScope();
    this._applyInitialSize();
    this._syncA11y();
    this._resizeHandle.addEventListener('pointerdown', this._onResizePointerDown);
    this._header.addEventListener('keydown', this._onKeyDown);
    this.shadowRoot.addEventListener('click', this._onActionClick);
    this.addEventListener('pointerdown', () => this.focusPanel());
    window.addEventListener('xtend-route-changed', this._onRouteChanged);
    window.addEventListener('popstate', this._onRouteChanged);
    this.surfaceManager = this.closest('x-surface-manager');
    if (this.surfaceManager && typeof this.surfaceManager.registerSurface === 'function') {
      this.surfaceManager.registerSurface(this);
    }
  }

  disconnectedCallback() {
    this._resizeHandle.removeEventListener('pointerdown', this._onResizePointerDown);
    this._header.removeEventListener('keydown', this._onKeyDown);
    this.shadowRoot.removeEventListener('click', this._onActionClick);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('xtend-route-changed', this._onRouteChanged);
    window.removeEventListener('popstate', this._onRouteChanged);
    this._syncBoundsContainerScope(false);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'label' || name === 'surface-id') this._renderLabel();
    if (name.startsWith('initial-') || name === 'bounds-mode' || name === 'bounds-scope') {
      if (name === 'bounds-mode' || name === 'bounds-scope') this._syncBoundsContainerScope();
      this._applyInitialSize();
    }
    if (['collapsed', 'pinned', 'mode', 'placement', 'modal', 'open', 'minimized', 'collapsible', 'collapsable', 'closable', 'pinnable'].includes(name)) this._syncA11y();
    if (this._applyingSnapshot || !this.isConnected) return;
    if (name === 'open') {
      this.hasAttribute('open') ? this.openPanel() : this.closePanel('attribute');
    }
  }

  get surfaceId() {
    return this.getAttribute('surface-id') || this.id || 'surface.panel';
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
    const mode = this._mode();
    return {
      schema: 'xtend.surface.record.v1',
      id: this.surfaceId,
      type: 'side-panel',
      manager: managerId,
      label: this.getAttribute('label') || this.surfaceId,
      placement: this._placement(),
      mode,
      initialBounds: this._readBounds(),
      capabilities: this._capabilities(),
      disabledCapabilities: this._disabledCapabilities(),
      defaultOpen: this.hasAttribute('open'),
      pinned: this.hasAttribute('pinned') || mode === 'pinned',
      collapsed: this.hasAttribute('collapsed') || mode === 'collapsed',
      modal: this.hasAttribute('modal') || mode === 'overlay',
      metadata: {
        source: 'x-side-panel',
        boundsMode: this._boundsMode(),
        boundsScope: this._boundsScope(),
        initialBoundsCss: this._initialBoundsCss(),
        responsiveMode: this.getAttribute('responsive-mode') || 'fullscreen-under-720',
        controls: {
          collapsible: this._collapsible(),
          closable: this._closable(),
          pinnable: this._pinnable()
        }
      }
    };
  }

  applySurfaceSnapshot(record) {
    this._applyingSnapshot = true;
    const shouldApplyBounds = !this._preserveResponsiveInitialBounds(record);
    if (shouldApplyBounds) {
      this._boundsCommitted = true;
      this._clearResponsiveMaxBounds();
      this.style.setProperty('--side-panel-width', `${record.bounds.width}px`);
      this.style.setProperty('--side-panel-height', `${record.bounds.height}px`);
      if (record.bounds.minWidth !== undefined) this.style.setProperty('--side-panel-min-width', `${record.bounds.minWidth}px`);
      if (record.bounds.minHeight !== undefined) this.style.setProperty('--side-panel-min-height', `${record.bounds.minHeight}px`);
    }
    this.style.setProperty('--side-panel-z', String(record.zIndex || 1));
    if (shouldApplyBounds) {
      this.style.setProperty('--surface-layout-x', `${record.bounds.x || 0}px`);
      this.style.setProperty('--surface-layout-y', `${record.bounds.y || 0}px`);
    }
    const minimized = record.status === 'minimized' || record.minimized === true;
    this.toggleAttribute('open', record.status !== 'closed' && !minimized);
    this.toggleAttribute('active', Boolean(record.active));
    this.toggleAttribute('minimized', minimized);
    this.toggleAttribute('collapsed', Boolean(record.collapsed) || record.mode === 'collapsed');
    this.toggleAttribute('pinned', Boolean(record.pinned) || record.mode === 'pinned');
    this.toggleAttribute('modal', Boolean(record.modal));
    if (record.placement) {
      this.setAttribute('placement', record.placement);
    } else {
      this.removeAttribute('placement');
    }
    if (record.mode) this.setAttribute('mode', record.mode);
    this._syncA11y(record);
    this._applyingSnapshot = false;
  }

  openPanel() {
    return this._command('open');
  }

  closePanel(reason) {
    return this._command('close', { reason });
  }

  focusPanel() {
    return this._command('focus');
  }

  minimizePanel() {
    return this._command('minimize');
  }

  pinPanel() {
    return this.hasAttribute('pinned') ? this._command('unpin') : this._command('pin', { pinned: true });
  }

  collapsePanel() {
    return this.hasAttribute('collapsed') ? this._command('expand', { mode: this.hasAttribute('pinned') ? 'pinned' : 'docked' }) : this._command('collapse');
  }

  expandPanel(mode = 'docked') {
    return this._command('expand', { mode });
  }

  setPanelMode(mode, placement = this._placement()) {
    return this._command('dock', { mode, placement });
  }

  resizePanel(bounds) {
    this._boundsCommitted = true;
    this._clearResponsiveMaxBounds();
    return this._command('resize', bounds);
  }

  restorePanel() {
    return this._command('restore');
  }

  _placement() {
    const placement = this.getAttribute('placement') || 'right';
    return ['left', 'right', 'bottom', 'inline'].includes(placement) ? placement : 'right';
  }

  _mode() {
    const mode = this.getAttribute('mode') || 'docked';
    return ['docked', 'overlay', 'pinned', 'collapsed', 'fullscreen', 'floating'].includes(mode) ? mode : 'docked';
  }

  _capabilities() {
    const capabilities = ['open', 'focus', 'dock', 'minimize', 'restore', 'snapshot'];
    if (this._closable()) capabilities.push('close');
    if (this._collapsible()) capabilities.push('collapse', 'expand');
    if (this._pinnable()) capabilities.push('pin', 'unpin');
    if (this.hasAttribute('resizable')) capabilities.push('resize');
    return capabilities;
  }

  _disabledCapabilities() {
    const disabled = [];
    if (!this._closable()) disabled.push('close');
    if (!this._collapsible()) disabled.push('collapse', 'expand');
    if (!this._pinnable()) disabled.push('pin', 'unpin');
    if (!this.hasAttribute('resizable')) disabled.push('resize');
    return disabled;
  }

  _booleanOption(name, fallback = true) {
    if (!this.hasAttribute(name)) return fallback;
    const value = String(this.getAttribute(name) || '').trim().toLowerCase();
    return !['false', '0', 'no', 'off'].includes(value);
  }

  _collapsible() {
    if (this.hasAttribute('collapsible')) return this._booleanOption('collapsible', true);
    if (this.hasAttribute('collapsable')) return this._booleanOption('collapsable', true);
    return true;
  }

  _closable() {
    return this._booleanOption('closable', true);
  }

  _pinnable() {
    return this._booleanOption('pinnable', true);
  }

  _readBounds() {
    const x = sidePanelNumericAttribute(this, 'initial-x', 0);
    const y = sidePanelNumericAttribute(this, 'initial-y', 0);
    const width = sidePanelNumericAttribute(this, 'initial-width', 320);
    const height = sidePanelNumericAttribute(this, 'initial-height', 720);
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      width: Number.isFinite(width) ? width : 320,
      height: Number.isFinite(height) ? height : 720,
      minWidth: 240,
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
    syncSidePanelBoundsContainerScope(this, active);
  }

  _initialBoundsCss() {
    return {
      x: sidePanelCssLength(this.getAttribute('initial-x'), 0),
      y: sidePanelCssLength(this.getAttribute('initial-y'), 0),
      width: sidePanelCssLength(this.getAttribute('initial-width'), 320),
      height: sidePanelCssLength(this.getAttribute('initial-height'), 720),
      minWidth: optionalSidePanelCssLength(this.getAttribute('initial-min-width')),
      minHeight: optionalSidePanelCssLength(this.getAttribute('initial-min-height')),
      maxWidth: optionalSidePanelCssLength(this.getAttribute('initial-max-width')),
      maxHeight: optionalSidePanelCssLength(this.getAttribute('initial-max-height'))
    };
  }

  _preserveResponsiveInitialBounds(record = {}) {
    if (this._boundsMode() !== 'responsive' || this._boundsCommitted) return false;
    const operation = record && record.lifecycle && record.lifecycle.operation || '';
    return !operation || SIDE_PANEL_INITIAL_OPERATIONS.has(operation);
  }

  _currentBounds() {
    const fallback = this._readBounds();
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(this) : null;
    const rect = typeof this.getBoundingClientRect === 'function' ? this.getBoundingClientRect() : null;
    const width = rect && rect.width ? rect.width : sidePanelNumericStyle(style, 'width', sidePanelNumericStyle(style, '--side-panel-width', fallback.width));
    const height = rect && rect.height ? rect.height : sidePanelNumericStyle(style, 'height', sidePanelNumericStyle(style, '--side-panel-height', fallback.height));
    return { ...fallback, width, height };
  }

  _applyInitialSize() {
    const bounds = this._readBounds();
    const cssBounds = this._initialBoundsCss();
    this.style.setProperty('--surface-layout-x', cssBounds.x || `${bounds.x}px`);
    this.style.setProperty('--surface-layout-y', cssBounds.y || `${bounds.y}px`);
    this.style.setProperty('--side-panel-width', cssBounds.width || `${bounds.width}px`);
    this.style.setProperty('--side-panel-height', cssBounds.height || `${bounds.height}px`);
    ['minWidth', 'minHeight', 'maxWidth', 'maxHeight'].forEach((field) => {
      const property = `--side-panel-${field.replace(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`)}`;
      if (cssBounds[field]) this.style.setProperty(property, cssBounds[field]);
      else this.style.removeProperty(property);
    });
  }

  _clearResponsiveMaxBounds() {
    this.style.removeProperty('--side-panel-max-width');
    this.style.removeProperty('--side-panel-max-height');
  }

  _renderLabel() {
    if (this._title) this._title.textContent = this.getAttribute('label') || this.surfaceId;
  }

  _syncA11y(record) {
    if (!this._panel) return;
    const mode = record && record.mode || this._mode();
    const placement = record && record.placement || this._placement();
    const collapsed = Boolean(record && record.collapsed) || this.hasAttribute('collapsed') || mode === 'collapsed';
    const modal = Boolean(record && record.modal) || this.hasAttribute('modal') || mode === 'overlay';
    this._panel.setAttribute('role', modal ? 'dialog' : 'complementary');
    this._panel.setAttribute('aria-modal', modal ? 'true' : 'false');
    this._panel.setAttribute('aria-hidden', this.hasAttribute('open') ? 'false' : 'true');
    this._panel.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (this._collapseButton) this._collapseButton.setAttribute('aria-label', collapsed ? 'Expand panel' : 'Collapse panel');
    if (this._collapseIcon) this._collapseIcon.setAttribute('name', this._collapseIconName(collapsed, placement));
    if (this._pinButton) this._pinButton.setAttribute('aria-pressed', this.hasAttribute('pinned') ? 'true' : 'false');
    this._syncControls();
  }

  _syncControls() {
    if (this._collapseButton) {
      const hidden = !this._collapsible();
      this._collapseButton.toggleAttribute('hidden', hidden);
      this._collapseButton.hidden = hidden;
    }
    if (this._pinButton) {
      const hidden = !this._pinnable();
      this._pinButton.toggleAttribute('hidden', hidden);
      this._pinButton.hidden = hidden;
    }
    if (this._closeButton) {
      const hidden = !this._closable();
      this._closeButton.toggleAttribute('hidden', hidden);
      this._closeButton.hidden = hidden;
    }
    if (this._actions) {
      const hidden = !this._collapsible() && !this._pinnable() && !this._closable();
      this._actions.toggleAttribute('hidden', hidden);
      this._actions.hidden = hidden;
    }
  }

  _collapseIconName(collapsed, placement) {
    if (placement === 'right' || placement === 'inline') return collapsed ? 'chevron-right' : 'chevron-left';
    if (placement === 'bottom') return collapsed ? 'chevron-down' : 'chevron-up';
    return collapsed ? 'chevron-left' : 'chevron-right';
  }

  _handleActionClick(event) {
    const control = event.target && event.target.closest && event.target.closest('button[data-action]');
    const action = control && control.getAttribute('data-action');
    if (!action) return;
    if (control.hidden || control.hasAttribute('hidden')) return;
    event.preventDefault();
    if (action === 'close') this.closePanel('button');
    if (action === 'collapse') this.collapsePanel();
    if (action === 'pin') this.pinPanel();
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && (this._mode() === 'overlay' || this.hasAttribute('modal'))) {
      event.preventDefault();
      this.closePanel('escape');
    }
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') && event.altKey) {
      event.preventDefault();
      const bounds = this._currentBounds();
      const step = event.shiftKey ? 32 : 12;
      if (event.key === 'ArrowLeft') bounds.width -= step;
      if (event.key === 'ArrowRight') bounds.width += step;
      if (event.key === 'ArrowUp') bounds.height -= step;
      if (event.key === 'ArrowDown') bounds.height += step;
      this.resizePanel(bounds);
    }
  }

  _handleRouteChanged() {
    if (!this.hasAttribute('route-aware') || !this.hasAttribute('open')) return;
    if (this.surfaceManager && typeof this.surfaceManager.applyRouteLifecycle === 'function') return;
    if (this._mode() === 'overlay') {
      this.closePanel('route-change');
      return;
    }
    this._command('collapse');
  }

  _startResize(event) {
    if (!this.hasAttribute('resizable')) return;
    event.preventDefault();
    this.focusPanel();
    const bounds = this._currentBounds();
    this._clearResponsiveMaxBounds();
    this._resize = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      bounds,
      placement: this._placement()
    };
    this._resizeHandle.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  _handlePointerMove(event) {
    if (!this._resize) return;
    const dx = event.clientX - this._resize.startX;
    const dy = event.clientY - this._resize.startY;
    const next = { ...this._resize.bounds };
    if (this._resize.placement === 'left' || this._resize.placement === 'inline') {
      next.width = this._resize.bounds.width + dx;
    } else if (this._resize.placement === 'bottom') {
      next.height = this._resize.bounds.height - dy;
    } else {
      next.width = this._resize.bounds.width - dx;
    }
    next.width = Math.max(next.minWidth, next.width);
    next.height = Math.max(next.minHeight, next.height);
    this.style.setProperty('--side-panel-width', `${next.width}px`);
    this.style.setProperty('--side-panel-height', `${next.height}px`);
  }

  _handlePointerUp(event) {
    if (!this._resize) return;
    const bounds = this._currentBounds();
    try {
      this._resizeHandle.releasePointerCapture(this._resize.pointerId || event.pointerId);
    } catch (error) {
      // Pointer capture can already be released by the browser during route changes.
    }
    this._resize = null;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.resizePanel(bounds);
  }

  _command(command, payload = {}) {
    if (!this._commandAllowed(command)) {
      return {
        surfaceId: this.surfaceId,
        command,
        payload,
        refused: true
      };
    }
    const detail = {
      surfaceId: this.surfaceId,
      command,
      payload
    };
    this.dispatchEvent(new CustomEvent('surface-panel-command', {
      bubbles: true,
      composed: true,
      detail
    }));
    if (!this._hasSurfaceManager()) this._applyLocalCommand(command, payload);
    return detail;
  }

  _commandAllowed(command) {
    if (command === 'close') return this._closable();
    if (command === 'pin' || command === 'unpin') return this._pinnable();
    if (command === 'collapse') return this._collapsible();
    if (command === 'expand') return this._collapsible() || this.hasAttribute('collapsed');
    if (command === 'resize') return this.hasAttribute('resizable');
    return true;
  }

  _hasSurfaceManager() {
    return Boolean(this.surfaceManager && typeof this.surfaceManager.registerSurface === 'function');
  }

  _applyLocalCommand(command, payload = {}) {
    this._applyingSnapshot = true;
    if (command === 'open') {
      this.toggleAttribute('open', true);
      this.toggleAttribute('minimized', false);
    }
    if (command === 'close') {
      this.toggleAttribute('open', false);
      this.toggleAttribute('active', false);
      this.toggleAttribute('minimized', false);
    }
    if (command === 'focus') {
      this.toggleAttribute('active', true);
      this.toggleAttribute('open', true);
      this.toggleAttribute('minimized', false);
    }
    if (command === 'minimize') {
      this.toggleAttribute('minimized', true);
      this.toggleAttribute('active', false);
    }
    if (command === 'restore') {
      this.toggleAttribute('open', true);
      this.toggleAttribute('minimized', false);
    }
    if (command === 'collapse') {
      this.toggleAttribute('collapsed', true);
      this.setAttribute('mode', 'collapsed');
    }
    if (command === 'expand') {
      this.toggleAttribute('collapsed', false);
      this.setAttribute('mode', payload.mode || (this.hasAttribute('pinned') ? 'pinned' : 'docked'));
    }
    if (command === 'pin') {
      this.toggleAttribute('pinned', true);
      this.setAttribute('mode', 'pinned');
    }
    if (command === 'unpin') {
      this.toggleAttribute('pinned', false);
      this.setAttribute('mode', 'docked');
    }
    if (command === 'dock') {
      if (payload.placement) this.setAttribute('placement', payload.placement);
      this.setAttribute('mode', payload.mode || 'docked');
      this.toggleAttribute('collapsed', false);
    }
    if (command === 'resize') {
      if (Number.isFinite(Number(payload.width))) this.style.setProperty('--side-panel-width', `${Number(payload.width)}px`);
      if (Number.isFinite(Number(payload.height))) this.style.setProperty('--side-panel-height', `${Number(payload.height)}px`);
    }
    this._syncA11y();
    this._applyingSnapshot = false;
  }
}

if (!customElements.get('x-side-panel')) {
  customElements.define('x-side-panel', XSidePanel);
}

export { XSidePanel };
