import './xicon.js';

class XSurfaceWindow extends HTMLElement {
  static get observedAttributes() {
    return ['surface-id', 'label', 'open', 'active', 'minimized', 'maximized', 'resizable', 'draggable', 'modal', 'initial-x', 'initial-y', 'initial-width', 'initial-height'];
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
        controller: 'xtend.surface.controller.v1'
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
          --surface-window-z: 1;
          display: none;
          position: absolute;
          left: var(--surface-window-x);
          top: var(--surface-window-y);
          width: var(--surface-window-width);
          height: var(--surface-window-height);
          z-index: var(--surface-window-z);
          min-width: 0;
          min-height: 0;
          color: var(--surface-window-color, #111827);
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
          border: 1px solid var(--surface-window-border, #cbd5e1);
          border-radius: var(--surface-window-radius, 8px);
          background: var(--surface-window-bg, #ffffff);
          box-shadow: var(--surface-window-shadow, 0 20px 50px rgba(15, 23, 42, 0.22));
        }
        :host([active]) .window {
          border-color: var(--surface-window-active-border, #2563eb);
          box-shadow: var(--surface-window-active-shadow, 0 24px 64px rgba(37, 99, 235, 0.22));
        }
        .titlebar {
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 2.5rem;
          padding: 0.375rem 0.5rem 0.375rem 0.75rem;
          border-bottom: 1px solid var(--surface-window-border, #cbd5e1);
          background: var(--surface-window-chrome, #f1f5f9);
          cursor: default;
          user-select: none;
        }
        :host([draggable]) .titlebar {
          cursor: move;
        }
        .titlebar:focus-visible {
          outline: 2px solid var(--surface-window-focus, #2563eb);
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
          border-color: var(--surface-window-border, #94a3b8);
          background: var(--surface-window-button-hover, #e2e8f0);
          outline: none;
        }
        .content {
          flex: 1;
          min-height: 0;
          overflow: auto;
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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'label') this._renderLabel();
    if (name.startsWith('initial-')) this._applyInitialBounds();
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
        source: 'x-surface-window'
      }
    };
  }

  applySurfaceSnapshot(record) {
    this._applyingSnapshot = true;
    this.style.setProperty('--surface-window-x', `${record.bounds.x}px`);
    this.style.setProperty('--surface-window-y', `${record.bounds.y}px`);
    this.style.setProperty('--surface-window-width', `${record.bounds.width}px`);
    this.style.setProperty('--surface-window-height', `${record.bounds.height}px`);
    this.style.setProperty('--surface-window-z', String(record.zIndex || 1));
    this.toggleAttribute('open', record.status !== 'closed');
    this.toggleAttribute('active', Boolean(record.active));
    this.toggleAttribute('minimized', Boolean(record.minimized));
    this.toggleAttribute('maximized', Boolean(record.maximized));
    const windowSurface = this.shadowRoot.querySelector('.window');
    windowSurface.setAttribute('aria-hidden', record.status === 'closed' ? 'true' : 'false');
    windowSurface.setAttribute('aria-modal', record.modal ? 'true' : 'false');
    this._applyingSnapshot = false;
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
      x: Number(this.getAttribute('initial-x') || 64),
      y: Number(this.getAttribute('initial-y') || 64),
      width: Number(this.getAttribute('initial-width') || 640),
      height: Number(this.getAttribute('initial-height') || 420),
      minWidth: 280,
      minHeight: 180
    };
  }

  _applyInitialBounds() {
    const bounds = this._readBounds();
    this.style.setProperty('--surface-window-x', `${bounds.x}px`);
    this.style.setProperty('--surface-window-y', `${bounds.y}px`);
    this.style.setProperty('--surface-window-width', `${bounds.width}px`);
    this.style.setProperty('--surface-window-height', `${bounds.height}px`);
  }

  _renderLabel() {
    if (this._title) this._title.textContent = this.getAttribute('label') || this.surfaceId;
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
    if (this._drag) this._command('move', this._currentBounds());
    if (this._resize) this._command('resize', this._currentBounds());
    this._drag = null;
    this._resize = null;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }

  _currentBounds() {
    const style = getComputedStyle(this);
    return {
      x: Number.parseFloat(style.getPropertyValue('--surface-window-x')) || 0,
      y: Number.parseFloat(style.getPropertyValue('--surface-window-y')) || 0,
      width: Number.parseFloat(style.getPropertyValue('--surface-window-width')) || this.offsetWidth || 640,
      height: Number.parseFloat(style.getPropertyValue('--surface-window-height')) || this.offsetHeight || 420
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
