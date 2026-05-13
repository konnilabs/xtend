import { xstate } from './xstate.js';

class XTooltip extends HTMLElement {
  static get observedAttributes() {
    return ['for', 'placement', 'open', 'delay', 'label'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-tooltip',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-tooltip/x-tooltip.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xtooltip.js',
        declaration: 'components/xtooltip.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'visible'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-tooltip',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'overlay.tooltip.position', 'diagnostics.snapshot'],
      hydration: { policy: 'idle', lane: 'visible' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-tooltip',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-tooltip',
      role: 'tooltip',
      accessibleName: 'required',
      liveRegion: 'none',
      screenreader: {
        signalContract: XTooltip.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XTooltip.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-tooltip',
      budgetClass: 'overlay-small',
      lane: 'visible',
      hydrationPolicy: 'idle',
      criticalMeasurements: ['mount', 'event'],
      cleanup: ['anchor-listeners', 'document-keydown']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-tooltip',
      liveRegion: 'none',
      signals: ['describedby-link', 'tooltip-context', 'dismiss-on-escape'],
      statusRegions: ['role=tooltip'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.describe',
        scheduleRef: 'a11y.user-blocking.describe'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-tooltip',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'instant-tooltip-open-close',
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
      componentRef: 'x-tooltip',
      family: 'tooltip',
      role: 'tooltip',
      modality: 'non-modal',
      focusTrap: 'not-applicable',
      inertStrategy: 'not-applicable',
      escapeBehavior: 'dismiss-visible-tooltip',
      outsideClick: 'anchor-blur-or-hover-leave',
      scrollLock: 'not-applicable',
      portalStrategy: 'anchor-local-layer',
      events: ['tooltip-opened', 'tooltip-closed'],
      commands: ['show', 'hide', 'toggle', 'snapshot'],
      stateKey: 'xtooltip-open-<id>',
      schedule: 'overlay.position.update',
      fabric: {
        lane: 'visible',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: {
        adapter: 'xtend.component',
        scheduleRefs: ['overlay.position.update', 'overlay.stack.close', 'diagnostics.snapshot'],
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      overlaySemantics: {
        escapeDismissesVisibleTooltip: true,
        describedbyRequired: true,
        anchorLocalPortal: true
      }
    };
  }

  constructor() {
    super();
    this._anchor = null;
    this._open = false;
    this._showTimer = 0;
    this._hideTimer = 0;
    this._unsubscribeState = null;
    this._synchronizingAttribute = false;
    this._onAnchorEnter = () => this.show({ source: 'anchor' });
    this._onAnchorLeave = () => this.hide({ source: 'anchor' });
    this._onAnchorFocus = () => this.show({ source: 'focus' });
    this._onAnchorBlur = () => this.hide({ source: 'blur' });
    this._onKeyDown = this._handleKeyDown.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xtend-overlay-surface: var(--xtend-surface-inverse, #111827);
          --xtend-overlay-text: var(--xtend-text-inverse, #ffffff);
          --xtend-overlay-elevation: var(--xtend-shadow-overlay, 0 10px 24px rgba(15, 23, 42, 0.22));
          --xtend-overlay-radius: var(--xtend-radius, 4px);
          --xtend-overlay-z: var(--surface-overlay-tooltip-z, 2147483600);
          --xtooltip-bg: var(--tooltip-bg, var(--xtend-overlay-surface));
          --xtooltip-color: var(--tooltip-color, var(--xtend-overlay-text));
          --xtooltip-shadow: var(--tooltip-shadow, var(--xtend-overlay-elevation));
          --xtooltip-radius: var(--tooltip-radius, var(--xtend-overlay-radius));
          --xtooltip-font: var(--tooltip-font, 0.875rem/1.4 system-ui, sans-serif);
          display: inline-block;
          position: relative;
          color: var(--xtend-text, var(--text-color, #111827));
        }
        .trigger {
          display: inline-flex;
        }
        .backdrop,
        .close-sentinel {
          display: none;
        }
        .tooltip {
          position: absolute;
          z-index: var(--xtend-overlay-z);
          max-width: min(18rem, 80vw);
          padding: 0.5rem 0.625rem;
          border-radius: var(--xtooltip-radius);
          background: var(--xtooltip-bg);
          color: var(--xtooltip-color);
          box-shadow: var(--xtooltip-shadow);
          font: var(--xtooltip-font);
          opacity: 0;
          pointer-events: none;
          transform: translateY(2px);
          transition: opacity 120ms ease, transform 120ms ease;
        }
        :host([open]) .tooltip {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        :host([placement="bottom"]) .tooltip {
          top: calc(100% + 0.5rem);
          left: 50%;
          transform: translate(-50%, 2px);
        }
        :host([placement="bottom"][open]) .tooltip {
          transform: translate(-50%, 0);
        }
        :host([placement="top"]) .tooltip,
        .tooltip {
          bottom: calc(100% + 0.5rem);
          left: 50%;
          transform: translate(-50%, 2px);
        }
        :host([placement="top"][open]) .tooltip,
        :host([open]) .tooltip {
          transform: translate(-50%, 0);
        }
        :host([placement="left"]) .tooltip {
          right: calc(100% + 0.5rem);
          top: 50%;
          bottom: auto;
          left: auto;
          transform: translate(-2px, -50%);
        }
        :host([placement="left"][open]) .tooltip {
          transform: translate(0, -50%);
        }
        :host([placement="right"]) .tooltip {
          left: calc(100% + 0.5rem);
          top: 50%;
          bottom: auto;
          transform: translate(2px, -50%);
        }
        :host([placement="right"][open]) .tooltip {
          transform: translate(0, -50%);
        }
        .tooltip:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .tooltip {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .tooltip {
            forced-color-adjust: auto;
            background: Canvas;
            color: CanvasText;
            border: 1px solid CanvasText;
            box-shadow: none;
          }
        }
      </style>
      <span class="trigger" part="trigger"><slot name="trigger"></slot></span>
      <span class="backdrop" part="backdrop" aria-hidden="true"></span>
      <span class="close-sentinel" part="close" aria-hidden="true"></span>
      <div id="tooltip" class="tooltip" part="root surface overlay-surface content" role="tooltip" aria-hidden="true">
        <slot></slot>
      </div>
    `;
    this._tooltip = this.shadowRoot.querySelector('#tooltip');
  }

  connectedCallback() {
    if (!this.id) this.id = `xtooltip-${Math.random().toString(36).slice(2, 10)}`;
    this._tooltip.id = `${this.id}-tooltip`;
    this._bindAnchor();
    document.addEventListener('keydown', this._onKeyDown);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xtooltip-open-${this.id}` && typeof value === 'boolean') {
        value ? this.show({ source: 'xstate' }) : this.hide({ source: 'xstate' });
      }
    }, `xtooltip-open-${this.id}`);
    if (this.hasAttribute('open')) {
      this.show({ source: 'attribute', immediate: true });
    } else {
      this.hide({ source: 'initial', immediate: true });
    }
  }

  disconnectedCallback() {
    this._unbindAnchor();
    document.removeEventListener('keydown', this._onKeyDown);
    if (this._unsubscribeState) this._unsubscribeState();
    window.clearTimeout(this._showTimer);
    window.clearTimeout(this._hideTimer);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'for' && this.isConnected) {
      this._bindAnchor();
    }
    if (name === 'open' && !this._synchronizingAttribute) {
      newValue === null ? this.hide({ source: 'attribute' }) : this.show({ source: 'attribute' });
    }
    if (name === 'label') {
      this._tooltip.setAttribute('aria-label', this.label);
    }
  }

  get open() {
    return this._open;
  }

  set open(value) {
    value ? this.show() : this.hide();
  }

  get label() {
    return this.getAttribute('label') || '';
  }

  get delay() {
    const delay = Number(this.getAttribute('delay') || 120);
    return Number.isFinite(delay) ? Math.max(delay, 0) : 120;
  }

  show(options = {}) {
    window.clearTimeout(this._hideTimer);
    const run = () => this._setOpen(true, options.source || 'programmatic');
    if (options.immediate) {
      run();
    } else {
      this._showTimer = window.setTimeout(run, this.delay);
    }
  }

  hide(options = {}) {
    window.clearTimeout(this._showTimer);
    const run = () => this._setOpen(false, options.source || 'programmatic');
    if (options.immediate) {
      run();
    } else {
      this._hideTimer = window.setTimeout(run, 40);
    }
  }

  toggle() {
    this.open ? this.hide() : this.show();
  }

  snapshot() {
    return {
      schema: 'xtend.component.overlay-interaction-snapshot.v1',
      componentRef: 'x-tooltip',
      id: this.id || null,
      open: this._open,
      placement: this.getAttribute('placement') || 'top',
      stateKey: this.id ? `xtooltip-open-${this.id}` : 'xtooltip-open-<id>',
      schedule: 'diagnostics.snapshot',
      fabric: {
        lane: 'diagnostics'
      }
    };
  }

  _setOpen(isOpen, source) {
    if (this._open === isOpen) return;
    this._open = isOpen;
    this._synchronizingAttribute = true;
    this.toggleAttribute('open', isOpen);
    this._synchronizingAttribute = false;
    this._tooltip.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    xstate.set(`xtooltip-open-${this.id}`, isOpen);
    this.dispatchEvent(new CustomEvent(isOpen ? 'tooltip-opened' : 'tooltip-closed', {
      detail: { id: this.id, open: isOpen, source, placement: this.getAttribute('placement') || 'top' },
      bubbles: true,
      composed: true
    }));
  }

  _bindAnchor() {
    this._unbindAnchor();
    const anchorId = this.getAttribute('for');
    this._anchor = anchorId ? document.getElementById(anchorId) : this.shadowRoot.querySelector('.trigger');
    if (!this._anchor) return;
    this._anchor.addEventListener('mouseenter', this._onAnchorEnter);
    this._anchor.addEventListener('mouseleave', this._onAnchorLeave);
    this._anchor.addEventListener('focus', this._onAnchorFocus);
    this._anchor.addEventListener('blur', this._onAnchorBlur);
    this._anchor.setAttribute('aria-describedby', this._tooltip.id);
  }

  _unbindAnchor() {
    if (!this._anchor) return;
    this._anchor.removeEventListener('mouseenter', this._onAnchorEnter);
    this._anchor.removeEventListener('mouseleave', this._onAnchorLeave);
    this._anchor.removeEventListener('focus', this._onAnchorFocus);
    this._anchor.removeEventListener('blur', this._onAnchorBlur);
    if (this._anchor.getAttribute('aria-describedby') === this._tooltip.id) {
      this._anchor.removeAttribute('aria-describedby');
    }
    this._anchor = null;
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && this.open) {
      this.hide({ source: 'escape', immediate: true });
    }
  }
}

if (!customElements.get('x-tooltip')) {
  customElements.define('x-tooltip', XTooltip);
}
