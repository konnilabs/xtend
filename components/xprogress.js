import { xstate } from './xstate.js';

const X_PROGRESS_RMT_COMMAND_SCHEMA = 'xtend.rmt.command.v1';

function createRmtCommandDetail(host, eventName, payload = {}, options = {}) {
  const command = host.getAttribute('command')
    || host.dataset.command
    || host.dataset.action
    || host.id
    || eventName;
  const sourceId = host.id || 'x-progress';
  return {
    schema: X_PROGRESS_RMT_COMMAND_SCHEMA,
    id: `rmt.command:${sourceId}:${eventName}:${Date.now()}`,
    source: {
      kind: 'component',
      id: sourceId,
      event: eventName,
      surfaceId: host.dataset.surfaceId || host.getAttribute('surface-id') || ''
    },
    command,
    payload,
    target: options.target || null,
    correlationId: `rmt.correlation:${sourceId}:${Date.now()}`,
    runId: '',
    lane: options.lane || 'visible',
    timestamp: new Date().toISOString()
  };
}

class XProgress extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'max', 'label', 'status', 'indeterminate', 'busy'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-progress',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-progress/x-progress.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xprogress.js',
        declaration: 'components/xprogress.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'background'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-progress',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.progress.update', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'background' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-progress',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-progress',
      role: 'progressbar',
      accessibleName: 'required',
      liveRegion: 'polite',
      screenreader: {
        signalContract: XProgress.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XProgress.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-progress',
      budgetClass: 'feedback-small',
      lane: 'background',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['xstate-subscription']
    };
  }

  static get xtendFeedbackStatusUxProfile() {
    return {
      schema: 'xtend.component.feedback-status-ux-profile.v1',
      componentRef: 'x-progress',
      family: 'progress',
      role: 'progressbar',
      severityModel: 'progress-plus-status',
      liveRegion: 'polite',
      timeoutMode: 'none',
      dismissMode: 'none',
      events: ['xtend-command', 'progress-changed', 'progress-complete'],
      commands: ['set-progress', 'complete', 'snapshot'],
      stateKey: 'xprogress-value-<id>',
      schedule: 'feedback.progress.update',
      fabric: {
        lane: 'background',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XProgress.xtendRmtMetadata,
      statusSemantics: {
        progressValueTextRequired: true,
        noColorOnlyState: true,
        ariaBusyMirroring: true
      }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-progress',
      liveRegion: 'polite',
      signals: ['progress-update', 'progress-complete', 'scheduler-feedback'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: [],
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
      componentRef: 'x-progress',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'indeterminate-without-motion-only-feedback',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'not-applicable',
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
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--text-color, #111827);
        }
        .label-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }
        .track {
          --progress-border: var(--xtend-feedback-border, #93c5fd);
          --progress-track: var(--xtend-feedback-bg, #dbeafe);
          overflow: hidden;
          width: 100%;
          height: var(--progress-height, 0.625rem);
          border: 1px solid var(--progress-border, #93c5fd);
          border-radius: var(--xtend-feedback-radius, var(--border-radius, 4px));
          background: var(--progress-track, #dbeafe);
        }
        .bar {
          width: 0;
          height: 100%;
          background: var(--progress-bar, var(--xtend-feedback-color, #2563eb));
          transition: width 160ms ease;
        }
        :host([indeterminate]) .bar {
          width: 35%;
          animation: progress-indeterminate 1.2s linear infinite;
        }
        @keyframes progress-indeterminate {
          from { transform: translateX(-100%); }
          to { transform: translateX(300%); }
        }
        .status {
          margin-top: 0.25rem;
          color: var(--muted-color, #6b7280);
          font-size: 0.875rem;
        }
        @media (prefers-reduced-motion: reduce) {
          .bar {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
        }
        @media (forced-colors: active) {
          .track,
          .bar,
          .status {
            forced-color-adjust: auto;
          }
          .track {
            border-color: CanvasText;
            background: Canvas;
          }
          .bar {
            background: Highlight;
          }
        }
      </style>
      <div class="label-row" part="label">
        <span id="label"><slot name="label"><span id="label-text"></span></slot></span>
        <span id="value-text" part="value"></span>
      </div>
      <div id="track" class="track" part="root track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-describedby="status">
        <div id="bar" class="bar" part="bar"></div>
      </div>
      <div id="status" class="status" part="content" role="status" aria-live="polite" aria-atomic="true"><slot></slot></div>
    `;
    this._track = this.shadowRoot.querySelector('#track');
    this._bar = this.shadowRoot.querySelector('#bar');
    this._valueText = this.shadowRoot.querySelector('#value-text');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._status = this.shadowRoot.querySelector('#status');
  }

  connectedCallback() {
    if (!this.id) this.id = `xprogress-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncProgress();
    xstate.set(`xprogress-value-${this.id}`, this.value);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xprogress-value-${this.id}` && typeof value === 'number' && value !== this.value) {
        this.setProgress(value);
      }
    }, `xprogress-value-${this.id}`);
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XProgress.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._track || oldValue === newValue) return;
    if (name === 'label') this._labelText.textContent = newValue || '';
    if (name === 'status') this._status.textContent = newValue || '';
    this._syncProgress();
  }

  _syncProgress() {
    const max = this.max;
    const value = Math.min(Math.max(this.value, 0), max);
    const percent = max === 0 ? 0 : Math.round((value / max) * 100);
    const indeterminate = this.indeterminate;

    this._track.setAttribute('aria-busy', String(this.busy || indeterminate));
    this._track.setAttribute('aria-valuemax', String(max));
    if (indeterminate) {
      this._track.removeAttribute('aria-valuenow');
      this._track.setAttribute('aria-valuetext', this.getAttribute('status') || 'In progress');
    } else {
      this._track.setAttribute('aria-valuenow', String(value));
      this._track.setAttribute('aria-valuetext', `${percent}%`);
    }
    this._bar.style.width = indeterminate ? '' : `${percent}%`;
    this._valueText.textContent = indeterminate ? '' : `${percent}%`;
  }

  get value() {
    return Number(this.getAttribute('value') || 0);
  }

  set value(value) {
    this.setProgress(value);
  }

  get max() {
    return Number(this.getAttribute('max') || 100);
  }

  get indeterminate() {
    return this.hasAttribute('indeterminate');
  }

  get busy() {
    return this.hasAttribute('busy');
  }

  setProgress(value) {
    const nextValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    this.setAttribute('value', String(nextValue));
    this._syncProgress();
    this.dispatchEvent(new CustomEvent('progress-changed', {
      detail: { value: this.value, max: this.max, percent: this.percent, source: 'x-progress' },
      bubbles: true,
      composed: true
    }));
    this.dispatchEvent(new CustomEvent('xtend-command', {
      detail: createRmtCommandDetail(this, 'progress-changed', { value: this.value, max: this.max, percent: this.percent, source: 'x-progress' }),
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    xstate.set(`xprogress-value-${this.id}`, this.value);
    if (this.value >= this.max && !this.indeterminate) {
      this.dispatchEvent(new CustomEvent('progress-complete', {
        detail: { value: this.value, max: this.max, percent: 100, source: 'x-progress' },
        bubbles: true,
        composed: true
      }));
      this.dispatchEvent(new CustomEvent('xtend-command', {
        detail: createRmtCommandDetail(this, 'progress-complete', { value: this.value, max: this.max, percent: 100, source: 'x-progress' }),
        bubbles: true,
        composed: true,
        cancelable: true
      }));
    }
  }

  get percent() {
    return this.max === 0 ? 0 : Math.round((Math.min(Math.max(this.value, 0), this.max) / this.max) * 100);
  }

  complete() {
    this.removeAttribute('indeterminate');
    this.setProgress(this.max);
  }

  reset() {
    this.removeAttribute('indeterminate');
    this.setProgress(0);
  }
}

customElements.define('x-progress', XProgress);

export { XProgress };
