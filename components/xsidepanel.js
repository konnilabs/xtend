import './xicon.js';

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
      'responsive-mode',
      'resizable',
      'route-aware',
      'modal',
      'initial-width',
      'initial-height'
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
          min-inline-size: 0;
          min-block-size: 0;
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
    this._collapseButton = this.shadowRoot.querySelector('[data-action="collapse"]');
    this._collapseIcon = this.shadowRoot.querySelector('[data-action="collapse"] x-icon');
    this._pinButton = this.shadowRoot.querySelector('[data-action="pin"]');
  }

  connectedCallback() {
    if (!this.hasAttribute('surface-id') && this.id) this.setAttribute('surface-id', this.id);
    if (!this.hasAttribute('placement')) this.setAttribute('placement', 'right');
    if (!this.hasAttribute('mode')) this.setAttribute('mode', 'docked');
    if (!this.hasAttribute('resizable')) this.setAttribute('resizable', '');
    this._renderLabel();
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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'label' || name === 'surface-id') this._renderLabel();
    if (name.startsWith('initial-')) this._applyInitialSize();
    if (['collapsed', 'pinned', 'mode', 'placement', 'modal', 'open', 'minimized'].includes(name)) this._syncA11y();
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
      defaultOpen: this.hasAttribute('open'),
      pinned: this.hasAttribute('pinned') || mode === 'pinned',
      collapsed: this.hasAttribute('collapsed') || mode === 'collapsed',
      modal: this.hasAttribute('modal') || mode === 'overlay',
      metadata: {
        source: 'x-side-panel',
        responsiveMode: this.getAttribute('responsive-mode') || 'fullscreen-under-720'
      }
    };
  }

  applySurfaceSnapshot(record) {
    this._applyingSnapshot = true;
    this.style.setProperty('--side-panel-width', `${record.bounds.width}px`);
    this.style.setProperty('--side-panel-height', `${record.bounds.height}px`);
    this.style.setProperty('--side-panel-z', String(record.zIndex || 1));
    this.style.setProperty('--surface-layout-x', `${record.bounds.x || 0}px`);
    this.style.setProperty('--surface-layout-y', `${record.bounds.y || 0}px`);
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
    const capabilities = ['open', 'focus', 'close', 'dock', 'collapse', 'minimize', 'restore', 'snapshot'];
    if (this.hasAttribute('resizable')) capabilities.push('resize');
    return capabilities;
  }

  _readBounds() {
    const width = Number(this.getAttribute('initial-width') || 320);
    const height = Number(this.getAttribute('initial-height') || 720);
    return {
      x: 0,
      y: 0,
      width: Number.isFinite(width) ? width : 320,
      height: Number.isFinite(height) ? height : 720,
      minWidth: 240,
      minHeight: 180
    };
  }

  _currentBounds() {
    const width = parseFloat(getComputedStyle(this).getPropertyValue('--side-panel-width')) || this._readBounds().width;
    const height = parseFloat(getComputedStyle(this).getPropertyValue('--side-panel-height')) || this._readBounds().height;
    return { ...this._readBounds(), width, height };
  }

  _applyInitialSize() {
    const bounds = this._readBounds();
    this.style.setProperty('--side-panel-width', `${bounds.width}px`);
    this.style.setProperty('--side-panel-height', `${bounds.height}px`);
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
  }

  _collapseIconName(collapsed, placement) {
    if (placement === 'right' || placement === 'inline') return collapsed ? 'chevron-left' : 'chevron-right';
    if (placement === 'bottom') return collapsed ? 'chevron-up' : 'chevron-down';
    return collapsed ? 'chevron-right' : 'chevron-left';
  }

  _handleActionClick(event) {
    const control = event.target && event.target.closest && event.target.closest('button[data-action]');
    const action = control && control.getAttribute('data-action');
    if (!action) return;
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
    return detail;
  }
}

if (!customElements.get('x-side-panel')) {
  customElements.define('x-side-panel', XSidePanel);
}

export { XSidePanel };
