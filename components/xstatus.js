import { xstate } from './xstate.js';

class XStatus extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'state', 'message', 'dismissible', 'busy', 'polite', 'label'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-status',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-status/x-status.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xstatus.js',
        declaration: 'components/xstatus.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'feedback'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-status',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.status.update', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'feedback' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-status',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-status',
      role: 'status',
      accessibleName: 'optional',
      liveRegion: 'polite',
      screenreader: {
        signalContract: XStatus.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XStatus.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-status',
      budgetClass: 'feedback-small',
      lane: 'feedback',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['xstate-subscription']
    };
  }

  static get xtendFeedbackStatusUxProfile() {
    return {
      schema: 'xtend.component.feedback-status-ux-profile.v1',
      componentRef: 'x-status',
      family: 'inline-status',
      role: 'status-or-alert',
      severityModel: 'type-plus-state',
      liveRegion: 'polite-or-assertive',
      timeoutMode: 'none',
      dismissMode: 'dismissible-attribute',
      events: ['status-changed', 'status-dismissed'],
      commands: ['announce', 'dismiss', 'update-status', 'snapshot'],
      stateKey: 'xstatus-state-<id>',
      schedule: 'feedback.status.update',
      fabric: {
        lane: 'feedback',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XStatus.xtendRmtMetadata,
      statusSemantics: {
        noColorOnlyState: true,
        assertiveForError: true,
        ariaBusyMirroring: true
      }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-status',
      liveRegion: 'polite',
      signals: ['status-update', 'validation-feedback', 'scheduler-feedback'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: ['role=alert', 'aria-live=assertive'],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.announce',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-status',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'status-without-motion-only-feedback',
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

  constructor() {
    super();
    this._unsubscribeState = null;
    this._syncingFromXstate = false;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--text-color, #111827);
        }
        .status {
          --status-border: var(--xtend-feedback-border, #bfdbfe);
          --status-bg: var(--xtend-feedback-bg, #eff6ff);
          --status-color: var(--xtend-feedback-color, #1e3a8a);
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: var(--status-padding, 0.75rem);
          border: 1px solid var(--status-border, #bfdbfe);
          border-radius: var(--xtend-feedback-radius, var(--border-radius, 4px));
          background: var(--status-bg, #eff6ff);
          color: var(--status-color, #1e3a8a);
        }
        :host([type="success"]) .status {
          --status-border: #bbf7d0;
          --status-bg: #f0fdf4;
          --status-color: #14532d;
        }
        :host([type="warning"]) .status {
          --status-border: #fde68a;
          --status-bg: #fffbeb;
          --status-color: #78350f;
        }
        :host([type="error"]) .status {
          --status-border: #fecaca;
          --status-bg: #fef2f2;
          --status-color: #7f1d1d;
        }
        .content {
          flex: 1;
          min-width: 0;
        }
        .label {
          font-weight: 700;
        }
        .message {
          margin-top: 0.125rem;
        }
        button {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: inherit;
          padding: 0.125rem 0.25rem;
        }
        button:focus-visible {
          outline: var(--xtend-feedback-focus, 2px solid currentColor);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .status,
          button {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .status,
          button {
            forced-color-adjust: auto;
          }
          .status {
            border-color: CanvasText;
            background: Canvas;
            color: CanvasText;
          }
        }
      </style>
      <div id="status" class="status" part="root content" role="status" aria-live="polite" aria-atomic="true">
        <span id="icon" part="icon" aria-hidden="true">*</span>
        <div class="content" part="content">
          <div id="label" class="label" part="label"><slot name="label"><span id="label-text"></span></slot></div>
          <div id="message" class="message" part="message"><slot></slot></div>
        </div>
        <button id="dismiss" part="close control" type="button" aria-label="Dismiss status" hidden>x</button>
      </div>
    `;
    this._status = this.shadowRoot.querySelector('#status');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._message = this.shadowRoot.querySelector('#message');
    this._dismissButton = this.shadowRoot.querySelector('#dismiss');
    this._onDismiss = this._onDismiss.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xstatus-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncState();
    this._dismissButton.addEventListener('click', this._onDismiss);
    xstate.set(`xstatus-state-${this.id}`, this.state);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xstatus-state-${this.id}` && value && typeof value === 'object') {
        this._syncingFromXstate = true;
        try {
          this.setStatus(value);
        } finally {
          this._syncingFromXstate = false;
        }
      }
    }, `xstatus-state-${this.id}`);
  }

  disconnectedCallback() {
    this._dismissButton.removeEventListener('click', this._onDismiss);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XStatus.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._status || oldValue === newValue) return;
    if (name === 'message') {
      this._message.textContent = newValue || '';
    }
    if (name === 'label') {
      this._labelText.textContent = newValue || '';
    }
    this._syncState();
  }

  _syncState() {
    const isAlert = this.type === 'error' || this.hasAttribute('polite') === false && this.type === 'warning';
    this._status.setAttribute('role', isAlert ? 'alert' : 'status');
    this._status.setAttribute('aria-live', isAlert ? 'assertive' : 'polite');
    this._status.setAttribute('aria-busy', String(this.busy));
    this._dismissButton.hidden = !this.dismissible;
    this.dispatchEvent(new CustomEvent('status-changed', {
      detail: this.state,
      bubbles: true,
      composed: true
    }));
    if (this.id && !this._syncingFromXstate) xstate.set(`xstatus-state-${this.id}`, this.state);
  }

  _onDismiss() {
    this.hidden = true;
    this.dispatchEvent(new CustomEvent('status-dismissed', {
      detail: this.state,
      bubbles: true,
      composed: true
    }));
  }

  get type() {
    return this.getAttribute('type') || 'info';
  }

  get busy() {
    return this.hasAttribute('busy');
  }

  get dismissible() {
    return this.hasAttribute('dismissible');
  }

  get state() {
    return {
      type: this.type,
      status: this.getAttribute('state') || this.type,
      message: this.getAttribute('message') || this.textContent.trim(),
      busy: this.busy,
      source: 'x-status'
    };
  }

  setStatus(nextState = {}) {
    if (nextState.type) this.setAttribute('type', nextState.type);
    if (nextState.status) this.setAttribute('state', nextState.status);
    if (nextState.message) this.setAttribute('message', nextState.message);
    if (typeof nextState.busy === 'boolean') {
      if (nextState.busy) this.setAttribute('busy', '');
      else this.removeAttribute('busy');
    }
    this.hidden = false;
    this._syncState();
  }

  dismiss() {
    this._onDismiss();
  }

  announce(message = this.state.message) {
    if (message) this.setAttribute('message', message);
    this._syncState();
  }
}

customElements.define('x-status', XStatus);

export { XStatus };
