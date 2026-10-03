const toastState = {
  set: (key, value) => {
    const stateApi = globalThis.XTend?.state;
    if (stateApi && typeof stateApi.set === 'function') {
      stateApi.set(key, value);
    }
  }
};

class XToast extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'tone', 'duration', 'open', 'hidden'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-toast',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-esm.component-source',
        state: 'js-runtime',
        sourcePath: 'components/xtoast.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xtoast.js',
        declaration: 'components/xtoast.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'a11y'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-toast',
      schedules: ['component.visible.mount', 'a11y.announce', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'a11y' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-toast',
      operations: ['mount', 'hydrate', 'render', 'event', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-toast',
      role: 'status',
      accessibleName: 'optional',
      liveRegion: 'polite-or-assertive',
      screenreader: {
        signalContract: XToast.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XToast.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-toast',
      budgetClass: 'feedback-small',
      lane: 'a11y',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['timeout']
    };
  }

  static get xtendFeedbackStatusUxProfile() {
    return {
      schema: 'xtend.component.feedback-status-ux-profile.v1',
      componentRef: 'x-toast',
      family: 'toast',
      role: 'status',
      severityModel: 'info-success-warning-error',
      liveRegion: 'polite-or-assertive',
      timeoutMode: 'default-duration',
      dismissMode: 'button-timeout-or-programmatic',
      events: ['toast-shown', 'toast-dismissed'],
      commands: ['announce', 'dismiss', 'snapshot'],
      stateKey: 'xtoast-state-<id>',
      schedule: 'a11y.announce',
      fabric: {
        lane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XToast.xtendRmtMetadata,
      statusSemantics: {
        noColorOnlyState: true,
        assertiveForError: true
      }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-toast',
      liveRegion: 'polite',
      signals: ['status-announcement', 'dismissal-announcement'],
      statusRegions: ['role=status', 'aria-live=polite|assertive'],
      errorRegions: ['aria-live=assertive'],
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
      componentRef: 'x-toast',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'announcement-without-motion-dependency',
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
    this.attachShadow({ mode: 'open' });
    this._timeout = null;
    this._dismissed = false;
  }

  connectedCallback() {
    if (!this.id) {
      this.id = `toast-${Math.random().toString(36).slice(2, 10)}`;
    }

    this._dismissed = false;
    if (this._isRmtOwned() && this._getType() !== 'info') {
      this.removeAttribute('hidden');
      if (!this.hasAttribute('open')) this.setAttribute('open', '');
    }
    this._render();
    this._scheduleDismiss();
    this._syncState(false, 'connected');
    this._emitToastEvent('toast-shown', 'connected');
  }

  disconnectedCallback() {
    clearTimeout(this._timeout);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;

    const shouldReopenRmtToast = this._isRmtOwned() && ['type', 'tone', 'duration', 'hidden'].includes(name) && this._getType() !== 'info';
    if (shouldReopenRmtToast && !this.hasAttribute('open')) {
      this.setAttribute('open', '');
    }
    if (this.hasAttribute('open') || shouldReopenRmtToast) {
      this._dismissed = false;
      this.removeAttribute('hidden');
    }
    this._render();
    if (name === 'duration') {
      this._scheduleDismiss();
    }
  }

  dismiss(reason = 'manual') {
    if (this._dismissed) return;

    this._dismissed = true;
    clearTimeout(this._timeout);
    this._syncState(true, reason);
    this._emitToastEvent('toast-dismissed', reason);
    if (this._isRmtOwned()) {
      this.removeAttribute('open');
      this.setAttribute('hidden', '');
      return;
    }
    this.remove();
  }

  _isRmtOwned() {
    return this.hasAttribute('data-maraca-surface') || this.hasAttribute('data-rmt-component');
  }

  _getType() {
    const type = this.getAttribute('type') || this.getAttribute('tone') || 'info';
    return ['info', 'success', 'warning', 'error'].includes(type) ? type : 'info';
  }

  _getDuration() {
    const duration = Number.parseInt(this.getAttribute('duration') || '', 10);
    const fallback = this._isRmtOwned() && this._getType() !== 'info' ? 15000 : 3000;
    return Number.isFinite(duration) && duration >= 0 ? duration : fallback;
  }

  _getDetail(reason) {
    return {
      id: this.id,
      message: (this.textContent || '').trim(),
      type: this._getType(),
      duration: this._getDuration(),
      dismissed: this._dismissed,
      reason,
      source: 'x-toast',
      stateKey: `xtoast-state-${this.id}`
    };
  }

  _syncState(dismissed, reason) {
    toastState.set(`xtoast-state-${this.id}`, {
      ...this._getDetail(reason),
      open: !dismissed
    });
  }

  _emitToastEvent(name, reason) {
    this.dispatchEvent(new CustomEvent(name, {
      detail: this._getDetail(reason),
      bubbles: true,
      composed: true
    }));
  }

  _scheduleDismiss() {
    clearTimeout(this._timeout);

    const duration = this._getDuration();
    if (duration > 0) {
      this._timeout = window.setTimeout(() => {
        this.dismiss('timeout');
      }, duration);
    }
  }

  _render() {
    const type = this._getType();
    const role = type === 'error' ? 'alert' : 'status';
    const live = type === 'error' ? 'assertive' : 'polite';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          animation: fadein var(--toast-animation-duration, 0.32s) cubic-bezier(.4,0,.2,1);
          margin-bottom: 0.7em;
          width: var(--toast-width, min(100%, 370px));
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          font-family: var(--xtend-font-family, 'Inter', 'Segoe UI', Arial, sans-serif);
        }
        .toast {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: var(--toast-padding, 1.1em 3.6em 1.1em 1.2em);
          border-radius: var(--toast-radius, var(--xtend-feedback-radius, var(--xtend-radius, 18px)));
          color: var(--toast-fg, var(--xtend-feedback-color, #222));
          background: var(--toast-bg, var(--xtend-feedback-bg, var(--xtend-surface-muted, rgba(255,255,255,0.82))));
          box-shadow: var(--xtend-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.18));
          backdrop-filter: blur(16px);
          position: relative;
          font-size: 1.08rem;
          transition: box-shadow 0.22s, background 0.22s, color 0.22s;
          overflow: hidden;
          overflow-wrap: anywhere;
          border: var(--xtend-feedback-border, var(--xtend-border, 1.5px solid rgba(255,255,255,0.12)));
        }
        .toast.info {
          --toast-bg: var(--xtend-info-bg, rgba(33, 150, 243, 0.92));
          --toast-fg: var(--xtend-info-fg, #fff);
        }
        .toast.success {
          --toast-bg: var(--xtend-success-bg, rgba(56, 200, 120, 0.92));
          --toast-fg: var(--xtend-success-fg, #fff);
        }
        .toast.warning {
          --toast-bg: var(--xtend-warning-bg, rgba(255, 193, 7, 0.92));
          --toast-fg: var(--xtend-warning-fg, #212529);
        }
        .toast.error {
          --toast-bg: var(--xtend-error-bg, rgba(220, 53, 69, 0.92));
          --toast-fg: var(--xtend-error-fg, #fff);
        }
        .toast:focus-within {
          outline: var(--xtend-focus-outline, 2px solid #4fc3f7);
          outline-offset: 2px;
        }
        .close {
          background: rgba(255,255,255,0.12);
          border: none;
          color: inherit;
          position: absolute;
          top: 0.35em;
          right: 0.55em;
          cursor: pointer;
          line-height: 1;
          border-radius: 50%;
          transition: background 0.18s, transform 0.15s;
          width: 2.6em;
          height: 2.6em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .close:hover,
        .close:focus-visible {
          background: rgba(79,195,247,0.13);
          transform: scale(1.08);
        }
        .close:focus-visible {
          outline: var(--xtend-focus-outline, 2px solid #4fc3f7);
          outline-offset: 2px;
        }
        .close svg {
          width: 1.05em;
          height: 1.05em;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          :host {
            animation: none !important;
          }
          .toast,
          .close {
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          .toast {
            forced-color-adjust: auto;
            color: CanvasText;
            background: Canvas;
            border: 1px solid CanvasText;
            box-shadow: none;
          }
          .close {
            color: ButtonText;
            background: ButtonFace;
            border: 1px solid ButtonText;
          }
          .close:focus-visible {
            outline-color: Highlight;
          }
        }
      </style>
      <div class="toast ${type}" part="root content" role="${role}" aria-live="${live}" aria-atomic="true">
        <slot></slot>
        <button class="close" part="close control" type="button" aria-label="Schliessen">
          <svg part="close-icon control icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.10)"></circle>
            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
          </svg>
        </button>
      </div>
    `;

    const closeButton = this.shadowRoot.querySelector('.close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.dismiss('button'));
    }
  }
}

if (!customElements.get('x-toast')) {
  customElements.define('x-toast', XToast);
}
