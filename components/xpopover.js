import { xtendState } from './xtend-state.js';
import './xicon.js';

class XPopover extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'placement', 'modal', 'anchor', 'label'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-popover',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-popover/x-popover.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xpopover.js',
        declaration: 'components/xpopover.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'user-blocking'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-popover',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'overlay.popover.position', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-popover',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-popover',
      role: 'dialog',
      accessibleName: 'required',
      liveRegion: 'none',
      screenreader: {
        signalContract: XPopover.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XPopover.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-popover',
      budgetClass: 'overlay-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['document-click', 'document-keydown']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-popover',
      liveRegion: 'none',
      signals: ['accessible-name-required', 'focus-return', 'modal-state'],
      statusRegions: ['role=dialog'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.dialog',
        scheduleRef: 'a11y.user-blocking.dialog'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-popover',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'instant-popover-open-close',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      },
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.preference',
        scheduleRef: 'a11y.user-blocking.preference'
      }
    };
  }

  static get xtendOverlayInteractionUxProfile() {
    return {
      schema: 'xtend.component.overlay-interaction-ux-profile.v1',
      componentRef: 'x-popover',
      family: 'popover',
      role: 'dialog',
      modality: 'modal-optional',
      focusTrap: 'conditional-when-modal',
      inertStrategy: 'none-by-default',
      escapeBehavior: 'close-topmost',
      outsideClick: 'outside-click-close',
      scrollLock: 'none-by-default',
      portalStrategy: 'anchor-local-layer',
      events: ['popover-opened', 'popover-closed'],
      commands: ['show', 'hide', 'toggle', 'focus-trap', 'release-focus', 'snapshot'],
      stateKey: 'xpopover-open-<id>',
      schedule: 'overlay.position.update',
      fabric: {
        lane: 'user-blocking',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: {
        adapter: 'xtend.component',
        scheduleRefs: ['overlay.stack.open', 'overlay.stack.close', 'overlay.focus.trap', 'overlay.position.update', 'diagnostics.snapshot'],
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      overlaySemantics: {
        topmostEscapeOnly: true,
        modalFocusTrapOnly: true,
        anchorLocalPortal: true
      }
    };
  }

  constructor() {
    super();
    this._open = false;
    this._lastFocusedElement = null;
    this._unsubscribeState = null;
    this._synchronizingAttribute = false;
    this._onDocumentClick = this._handleOutsideClick.bind(this);
    this._onDocumentKeyDown = this._handleKeyDown.bind(this);
    this._onShadowKeyDown = this._handleFocusTrap.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xtend-overlay-surface: var(--xtend-surface, #ffffff);
          --xtend-overlay-text: var(--xtend-text, #111827);
          --xtend-overlay-border-color: var(--xtend-border-color, #d1d5db);
          --xtend-overlay-elevation: var(--xtend-shadow-overlay, 0 20px 48px rgba(15, 23, 42, 0.2));
          --xtend-overlay-radius: var(--xtend-radius, 6px);
          --xtend-overlay-backdrop: var(--xtend-overlay-bg, rgba(15, 23, 42, 0.32));
          --xtend-overlay-focus-ring: 2px solid var(--xtend-focus-color, var(--xtend-color-primary, #2563eb));
          --xtend-overlay-z: var(--surface-overlay-popover-z, 2147483601);
          --xpopover-bg: var(--popover-bg, var(--xtend-overlay-surface));
          --xpopover-color: var(--popover-color, var(--xtend-overlay-text));
          --xpopover-border: var(--popover-border, var(--xtend-overlay-border-color));
          --xpopover-radius: var(--popover-radius, var(--xtend-overlay-radius));
          --xpopover-shadow: var(--popover-shadow, var(--xtend-overlay-elevation));
          --xpopover-backdrop: var(--popover-backdrop, var(--xtend-overlay-backdrop));
          --xpopover-close-display: var(--popover-close-display, inline-grid);
          --xpopover-close-bg: var(--popover-close-bg, transparent);
          --xpopover-close-hover-bg: var(--popover-close-hover-bg, rgba(37, 99, 235, 0.10));
          display: inline-block;
          position: relative;
          color: var(--xpopover-color);
        }
        .trigger {
          display: inline-flex;
        }
        .backdrop {
          position: fixed;
          inset: 0;
          z-index: calc(var(--xtend-overlay-z) - 1);
          display: none;
          background: var(--xpopover-backdrop);
        }
        :host([open][modal]) .backdrop {
          display: block;
        }
        .panel {
          position: absolute;
          z-index: var(--xtend-overlay-z);
          min-width: min(20rem, 86vw);
          max-width: min(28rem, 90vw);
          padding: 0.875rem;
          border: 1px solid var(--xpopover-border);
          border-radius: var(--xpopover-radius);
          background: var(--xpopover-bg);
          color: var(--xpopover-color);
          box-shadow: var(--xpopover-shadow);
          opacity: 0;
          pointer-events: none;
          transform: translateY(4px);
          transition: opacity 140ms ease, transform 140ms ease;
        }
        :host([open]) .panel {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        :host([placement="bottom"]) .panel,
        .panel {
          top: calc(100% + 0.5rem);
          left: 0;
        }
        :host([placement="top"]) .panel {
          top: auto;
          bottom: calc(100% + 0.5rem);
        }
        :host([placement="right"]) .panel {
          top: 0;
          left: calc(100% + 0.5rem);
        }
        :host([placement="left"]) .panel {
          top: 0;
          left: auto;
          right: calc(100% + 0.5rem);
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .close {
          position: absolute;
          inset-block-start: 0.45rem;
          inset-inline-end: 0.45rem;
          inline-size: 1.9rem;
          block-size: 1.9rem;
          display: var(--xpopover-close-display);
          place-items: center;
          border: 1px solid transparent;
          border-radius: 999px;
          background: var(--xpopover-close-bg);
          color: inherit;
          cursor: pointer;
        }
        .close:hover {
          background: var(--xpopover-close-hover-bg);
        }
        .close x-icon {
          pointer-events: none;
        }
        .close + .content {
          padding-inline-end: 2rem;
        }
        .panel:focus-visible {
          outline: var(--xtend-overlay-focus-ring);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .panel {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .backdrop {
            background: Canvas;
            opacity: 0.7;
          }
          .panel {
            forced-color-adjust: auto;
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
            box-shadow: none;
          }
          .close {
            color: ButtonText;
            background: ButtonFace;
            border-color: ButtonText;
          }
        }
      </style>
      <span class="trigger" part="trigger"><slot name="trigger"></slot></span>
      <div class="backdrop" part="backdrop" aria-hidden="true"></div>
      <section id="panel" class="panel" part="root surface overlay-surface" role="dialog" aria-modal="false" aria-hidden="true" tabindex="-1">
        <button type="button" class="close" part="close control" aria-label="Close popover">
          <x-icon name="close" part="close-icon control icon" decorative size="1rem"></x-icon>
        </button>
        <div class="content" part="content"><slot></slot></div>
        <div class="actions" part="actions"><slot name="actions"></slot></div>
      </section>
    `;
    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._panel = this.shadowRoot.querySelector('#panel');
    this._trigger.addEventListener('click', () => this.toggle());
    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.hide({ source: 'backdrop' }));
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.hide({ source: 'button' }));
  }

  connectedCallback() {
    if (!this.id) this.id = `xpopover-${Math.random().toString(36).slice(2, 10)}`;
    this._panel.id = `${this.id}-panel`;
    this._trigger.setAttribute('aria-controls', this._panel.id);
    this._trigger.setAttribute('aria-expanded', this.hasAttribute('open') ? 'true' : 'false');
    document.addEventListener('click', this._onDocumentClick);
    document.addEventListener('keydown', this._onDocumentKeyDown);
    this.shadowRoot.addEventListener('keydown', this._onShadowKeyDown);
    this._unsubscribeState = xtendState.subscribe((key, value) => {
      if (key === `xpopover-open-${this.id}` && typeof value === 'boolean') {
        value ? this.show({ source: 'xtend-state' }) : this.hide({ source: 'xtend-state' });
      }
    }, `xpopover-open-${this.id}`);
    this.hasAttribute('open') ? this.show({ source: 'attribute', silent: true }) : this.hide({ source: 'initial', silent: true });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocumentClick);
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    this.shadowRoot.removeEventListener('keydown', this._onShadowKeyDown);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'open' && !this._synchronizingAttribute) {
      newValue === null ? this.hide({ source: 'attribute' }) : this.show({ source: 'attribute' });
    }
    this._syncA11y();
  }

  get open() {
    return this._open;
  }

  set open(value) {
    value ? this.show() : this.hide();
  }

  get modal() {
    return this.hasAttribute('modal');
  }

  show(options = {}) {
    if (this._open) return;
    this._lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._setOpen(true, options.source || 'programmatic', options.silent);
    queueMicrotask(() => {
      if (this.modal) this._panel.focus();
    });
  }

  hide(options = {}) {
    if (!this._open && !this.hasAttribute('open')) {
      this._syncA11y();
      return;
    }
    this._setOpen(false, options.source || 'programmatic', options.silent);
    if (this._lastFocusedElement && typeof this._lastFocusedElement.focus === 'function') {
      queueMicrotask(() => this._lastFocusedElement.focus());
    }
  }

  toggle() {
    this.open ? this.hide() : this.show();
  }

  snapshot() {
    return {
      schema: 'xtend.component.overlay-interaction-snapshot.v1',
      componentRef: 'x-popover',
      id: this.id || null,
      open: this._open,
      modal: this.modal,
      placement: this.getAttribute('placement') || 'bottom',
      stateKey: this.id ? `xpopover-open-${this.id}` : 'xpopover-open-<id>',
      schedule: 'diagnostics.snapshot',
      fabric: {
        lane: 'diagnostics'
      }
    };
  }

  _setOpen(isOpen, source, silent = false) {
    this._open = isOpen;
    this._synchronizingAttribute = true;
    this.toggleAttribute('open', isOpen);
    this._synchronizingAttribute = false;
    this._syncA11y();
    xtendState.set(`xpopover-open-${this.id}`, isOpen);
    if (!silent) {
      this.dispatchEvent(new CustomEvent(isOpen ? 'popover-opened' : 'popover-closed', {
        detail: { id: this.id, open: isOpen, source, placement: this.getAttribute('placement') || 'bottom', modal: this.modal },
        bubbles: true,
        composed: true
      }));
    }
  }

  _syncA11y() {
    const label = this.getAttribute('label') || 'Popover';
    this._panel.setAttribute('aria-label', label);
    this._panel.setAttribute('aria-modal', this.modal ? 'true' : 'false');
    this._panel.setAttribute('aria-hidden', this._open ? 'false' : 'true');
    this._trigger.setAttribute('aria-expanded', this._open ? 'true' : 'false');
  }

  _handleOutsideClick(event) {
    if (!this._open) return;
    const path = event.composedPath ? event.composedPath() : [];
    if (path.includes(this)) return;
    this.hide({ source: 'outside-click' });
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && this._open) {
      this.hide({ source: 'escape' });
    }
  }

  _handleFocusTrap(event) {
    if (!this._open || !this.modal || event.key !== 'Tab') return;
    const focusable = this.shadowRoot.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = this.shadowRoot.activeElement || document.activeElement;
    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

if (!customElements.get('x-popover')) {
  customElements.define('x-popover', XPopover);
}
