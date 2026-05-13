// Selbst-ausfuehrende asynchrone Funktion statt direktem Import
(async function() {
  let xstate;

  if (window.xstate) {
    xstate = window.xstate;
  } else {
    try {
      const module = await import('./xstate.js');
      xstate = module.xstate;
    } catch (e) {
      console.error('Fehler beim Laden von xstate in xalert.js:', e);
      xstate = {
        get: () => null,
        set: () => {},
        subscribe: () => () => {}
      };
    }
  }

  function getAlertStateKeys(id) {
    return [
      `xtend.component.x-alert.${id}`,
      `xalert-state-${id}`
    ];
  }

  function setAlertState(id, state) {
    if (!id) return;
    getAlertStateKeys(id).forEach((key) => xstate.set(key, state));
  }

  class XAlert extends HTMLElement {
    static get observedAttributes() {
      return ['type', 'closable', 'duration', 'overlay', 'aria-label'];
    }

    static get xtendComponentContract() {
      return {
        schema: 'xtend.component.contract.v2',
        tag: 'x-alert',
        maturity: 'stable',
        source: {
          strategy: 'xtend.legacy-esm.component-source',
          state: 'js-runtime',
          sourcePath: 'components/xalert.js'
        },
        runtime: {
          format: 'esm',
          artifact: 'components/xalert.js',
          declaration: 'components/xalert.d.ts',
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
        tag: 'x-alert',
        schedules: ['component.visible.mount', 'a11y.announce', 'diagnostics.snapshot'],
        hydration: { policy: 'visible', lane: 'a11y' },
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      };
    }

    static get xtendComponentLifecycleTelemetry() {
      return {
        schema: 'xtend.component.lifecycle-telemetry.v1',
        componentRef: 'x-alert',
        operations: ['mount', 'hydrate', 'render', 'event', 'unmount'],
        snapshotPath: 'snapshot.componentTelemetry'
      };
    }

    static get xtendScaffoldA11yProfile() {
      return {
        schema: 'xtend.a11y.profile.v1',
        componentRef: 'x-alert',
        role: 'alert-or-status',
        accessibleName: 'optional',
        liveRegion: 'polite-or-assertive',
        screenreader: {
          signalContract: XAlert.xtendScreenreaderSignals
        },
        motionContrast: {
          policy: XAlert.xtendMotionContrastPolicy
        }
      };
    }

    static get xtendScaffoldPerformanceProfile() {
      return {
        schema: 'xtend.performance.component-profile.v1',
        componentRef: 'x-alert',
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
        componentRef: 'x-alert',
        family: 'alert',
        role: 'alert-or-status',
        severityModel: 'info-success-warning-error',
        liveRegion: 'polite-or-assertive',
        timeoutMode: 'optional-duration',
        dismissMode: 'closable-or-programmatic',
        events: ['alert-shown', 'alert-dismissed'],
        commands: ['announce', 'dismiss', 'snapshot'],
        stateKey: 'xalert-state-<id>',
        schedule: 'a11y.announce',
        fabric: {
          lane: 'a11y',
          diagnosticsLane: 'diagnostics'
        },
        rmt: XAlert.xtendRmtMetadata,
        statusSemantics: {
          noColorOnlyState: true,
          assertiveForError: true,
          gradientFree: true,
          solidContrastPalette: true
        }
      };
    }

    static get xtendScreenreaderSignals() {
      return {
        schema: 'xtend.a11y.screenreader-signals.v1',
        componentRef: 'x-alert',
        liveRegion: 'polite',
        signals: ['status-announcement', 'dismissal-announcement'],
        statusRegions: ['role=alert', 'aria-live=polite|assertive'],
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
        componentRef: 'x-alert',
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
        this.id = `alert-${Math.random().toString(36).slice(2, 10)}`;
      }

      this._dismissed = false;
      this._render();
      this._scheduleDismiss();
      this._syncState(false, 'connected');
      this._emitAlertEvent('alert-shown', 'connected');

      queueMicrotask(() => {
        const container = this.shadowRoot.querySelector('.alert');
        if (container instanceof HTMLElement) {
          container.focus();
        }
      });
    }

    disconnectedCallback() {
      clearTimeout(this._timeout);
      if (!this._dismissed) {
        this._syncState(false, 'disconnected');
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this.isConnected) return;

      this._render();
      this._scheduleDismiss();
      this._syncState(false, `attribute:${name}`);
    }

    dismiss(reason = 'manual') {
      if (this._dismissed) return;

      this._dismissed = true;
      clearTimeout(this._timeout);
      this._syncState(true, reason);
      this._emitAlertEvent('alert-dismissed', reason);
      this.remove();
    }

    _getType() {
      const type = this.getAttribute('type') || 'info';
      return ['info', 'success', 'warning', 'error'].includes(type) ? type : 'info';
    }

    _getDuration() {
      const duration = Number.parseInt(this.getAttribute('duration') || '0', 10);
      return Number.isFinite(duration) && duration >= 0 ? duration : 0;
    }

    _getDetail(reason) {
      return {
        id: this.id,
        message: (this.textContent || '').trim(),
        type: this._getType(),
        closable: this.hasAttribute('closable'),
        duration: this._getDuration(),
        overlay: this.hasAttribute('overlay'),
        ariaLabel: this.getAttribute('aria-label') || null,
        dismissed: this._dismissed,
        reason,
        source: 'x-alert',
        stateKey: `xalert-state-${this.id}`
      };
    }

    _syncState(dismissed, reason) {
      setAlertState(this.id, {
        ...this._getDetail(reason),
        open: !dismissed
      });
    }

    _emitAlertEvent(name, reason) {
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
      const overlay = this.hasAttribute('overlay');
      const closable = this.hasAttribute('closable');
      const ariaLabel = this.getAttribute('aria-label');
      const isAssertive = type === 'error' || type === 'warning';
      const ariaLive = isAssertive ? 'assertive' : 'polite';
      const role = isAssertive ? 'alert' : 'status';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--xtend-font-family, 'Inter', 'Segoe UI', Arial, sans-serif);
          }
          .alert-overlay {
            position: fixed;
            inset: 0;
            background: var(--xtend-overlay-bg, rgba(30, 34, 44, 0.55));
            backdrop-filter: blur(var(--xtend-glass-blur, 18px));
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeInOverlay 0.22s cubic-bezier(.4,1.4,.6,1);
          }
          .alert {
            --xalert-bg: var(--xtend-alert-bg, #f8fafc);
            --xalert-fg: var(--xtend-alert-fg, #0f172a);
            --xalert-border-color: var(--xtend-alert-border, #cbd5e1);
            --xalert-accent: var(--xtend-alert-accent, #64748b);
            --xalert-close-bg: rgba(255, 255, 255, 0.78);
            --xalert-close-border: rgba(15, 23, 42, 0.18);
            position: relative;
            min-width: 240px;
            max-width: 90vw;
            padding: 1.2em 1.5em;
            border-radius: var(--xtend-feedback-radius, var(--xtend-radius, 18px));
            margin: 1.2em 0;
            color: var(--xalert-fg);
            font-size: 1.08rem;
            line-height: 1.55;
            box-shadow: var(--xtend-feedback-shadow, 0 14px 36px rgba(15, 23, 42, 0.16));
            background: var(--xalert-bg);
            border: 1.5px solid var(--xalert-border-color);
            border-left: 0.42rem solid var(--xalert-accent);
            transition: box-shadow 0.22s cubic-bezier(.4,0,.2,1), background 0.22s, color 0.22s, border-color 0.22s, opacity 0.2s;
            display: flex;
            align-items: center;
            gap: 1em;
            outline: none;
          }
          .alert.is-closable {
            padding-right: 4em;
          }
          .info {
            --xalert-bg: var(--xtend-alert-info-bg, #e0f2fe);
            --xalert-fg: var(--xtend-alert-info-fg, #0c4a6e);
            --xalert-border-color: var(--xtend-alert-info-border, #38bdf8);
            --xalert-accent: var(--xtend-alert-info-accent, #0284c7);
          }
          .success {
            --xalert-bg: var(--xtend-alert-success-bg, #dcfce7);
            --xalert-fg: var(--xtend-alert-success-fg, #14532d);
            --xalert-border-color: var(--xtend-alert-success-border, #4ade80);
            --xalert-accent: var(--xtend-alert-success-accent, #16a34a);
          }
          .warning {
            --xalert-bg: var(--xtend-alert-warning-bg, #fef3c7);
            --xalert-fg: var(--xtend-alert-warning-fg, #78350f);
            --xalert-border-color: var(--xtend-alert-warning-border, #fbbf24);
            --xalert-accent: var(--xtend-alert-warning-accent, #d97706);
          }
          .error {
            --xalert-bg: var(--xtend-alert-error-bg, #fee2e2);
            --xalert-fg: var(--xtend-alert-error-fg, #7f1d1d);
            --xalert-border-color: var(--xtend-alert-error-border, #f87171);
            --xalert-accent: var(--xtend-alert-error-accent, #dc2626);
          }
          .close {
            position: absolute;
            top: 50%;
            right: 0.7em;
            transform: translateY(-50%);
            background: var(--xalert-close-bg);
            border: 1px solid var(--xalert-close-border);
            border-radius: 50%;
            width: 2.6em;
            height: 2.6em;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: background 0.18s, color 0.18s, transform 0.15s;
            color: var(--xalert-fg);
            z-index: 2;
            padding: 0;
          }
          .close:focus-visible {
            outline: var(--xtend-focus-outline, 2px solid #4fc3f7);
            outline-offset: 2px;
          }
          .close:hover {
            background: var(--xalert-hover-bg, rgba(255, 255, 255, 0.94));
            color: var(--xalert-fg);
            transform: translateY(-50%) scale(1.08);
          }
          .close svg {
            width: 1.05em;
            height: 1.05em;
          }
          :host([data-theme="dark"]) .alert,
          :host-context(html[data-theme="dark"]) .alert,
          :host-context([data-theme="dark"]) .alert {
            --xalert-close-bg: rgba(255, 255, 255, 0.12);
            --xalert-close-border: rgba(255, 255, 255, 0.24);
            --xalert-hover-bg: rgba(255, 255, 255, 0.18);
            box-shadow: var(--xtend-feedback-shadow, 0 18px 42px rgba(0, 0, 0, 0.42));
          }
          :host([data-theme="dark"]) .info,
          :host-context(html[data-theme="dark"]) .info,
          :host-context([data-theme="dark"]) .info {
            --xalert-bg: var(--xtend-alert-info-bg-dark, #082f49);
            --xalert-fg: var(--xtend-alert-info-fg-dark, #e0f2fe);
            --xalert-border-color: var(--xtend-alert-info-border-dark, #0ea5e9);
            --xalert-accent: var(--xtend-alert-info-accent-dark, #38bdf8);
          }
          :host([data-theme="dark"]) .success,
          :host-context(html[data-theme="dark"]) .success,
          :host-context([data-theme="dark"]) .success {
            --xalert-bg: var(--xtend-alert-success-bg-dark, #052e16);
            --xalert-fg: var(--xtend-alert-success-fg-dark, #dcfce7);
            --xalert-border-color: var(--xtend-alert-success-border-dark, #16a34a);
            --xalert-accent: var(--xtend-alert-success-accent-dark, #4ade80);
          }
          :host([data-theme="dark"]) .warning,
          :host-context(html[data-theme="dark"]) .warning,
          :host-context([data-theme="dark"]) .warning {
            --xalert-bg: var(--xtend-alert-warning-bg-dark, #451a03);
            --xalert-fg: var(--xtend-alert-warning-fg-dark, #fef3c7);
            --xalert-border-color: var(--xtend-alert-warning-border-dark, #d97706);
            --xalert-accent: var(--xtend-alert-warning-accent-dark, #fbbf24);
          }
          :host([data-theme="dark"]) .error,
          :host-context(html[data-theme="dark"]) .error,
          :host-context([data-theme="dark"]) .error {
            --xalert-bg: var(--xtend-alert-error-bg-dark, #450a0a);
            --xalert-fg: var(--xtend-alert-error-fg-dark, #fee2e2);
            --xalert-border-color: var(--xtend-alert-error-border-dark, #dc2626);
            --xalert-accent: var(--xtend-alert-error-accent-dark, #f87171);
          }
          @keyframes fadeInOverlay {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .alert-overlay,
            .alert {
              animation: none !important;
              transition: none !important;
            }
            .close {
              transition: none !important;
            }
          }
          @media (forced-colors: active) {
            .alert {
              forced-color-adjust: auto;
              color: CanvasText;
              background: Canvas;
              border: 1px solid CanvasText;
              box-shadow: none;
            }
            .info,
            .success,
            .warning,
            .error {
              color: CanvasText;
              background: Canvas;
            }
            .close {
              color: ButtonText;
              background: ButtonFace;
              border: 1px solid ButtonText;
              box-shadow: none;
            }
            .close:focus-visible {
              outline-color: Highlight;
            }
          }
          @media (max-width: 600px) {
            .alert {
              padding: 0.8em 1em;
              font-size: 0.98rem;
            }
            .alert.is-closable {
              padding-right: 3.6em;
            }
            .close {
              right: 0.3em;
            }
          }
        </style>
        ${overlay ? '<div class="alert-overlay"></div>' : ''}
      `;

      const container = document.createElement('div');
      container.className = `alert ${type}${closable ? ' is-closable' : ''}`;
      container.setAttribute('part', 'root content');
      container.setAttribute('role', role);
      container.setAttribute('aria-live', ariaLive);
      container.setAttribute('aria-atomic', 'true');
      container.setAttribute('aria-busy', 'false');
      container.setAttribute('tabindex', '-1');
      if (ariaLabel) {
        container.setAttribute('aria-label', ariaLabel);
      }

      const slot = document.createElement('slot');
      container.appendChild(slot);

      if (closable) {
        const button = document.createElement('button');
        button.className = 'close';
        button.setAttribute('part', 'close control');
        button.type = 'button';
        button.setAttribute('aria-label', 'Schliessen');
        button.innerHTML = `
          <svg part="close-icon control icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.10)"></circle>
            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
          </svg>
        `;
        button.addEventListener('click', () => this.dismiss('button'));
        container.appendChild(button);
      }

      const overlayContainer = this.shadowRoot.querySelector('.alert-overlay');
      if (overlayContainer) {
        overlayContainer.appendChild(container);
      } else {
        this.shadowRoot.appendChild(container);
      }
    }
  }

  if (!customElements.get('x-alert')) {
    customElements.define('x-alert', XAlert);
  }
})();
