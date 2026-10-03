import { xtendState } from './xtend-state.js';

class XRadio extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'checked', 'disabled', 'required', 'label', 'busy', 'invalid', 'density'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-radio',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-radio/x-radio.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xradio.js',
        declaration: 'components/xradio.d.ts',
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
      tag: 'x-radio',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-radio',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-radio',
      role: 'radio',
      accessibleName: 'required',
      focusStrategy: 'radio-group-roving-focus',
      keyboard: ['Tab', 'Space', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'],
      screenreader: { signalContract: XRadio.xtendScreenreaderSignals },
      motionContrast: { policy: XRadio.xtendMotionContrastPolicy }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-radio',
      budgetClass: 'interactive-small',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'event'],
      cleanup: ['xtend-state-subscription']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-radio',
      family: 'selection',
      role: 'radio',
      valueMode: 'group-token',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'control', 'label', 'helper', 'error'],
      events: ['radio-changed', 'radio-invalid'],
      commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error'],
      stateKey: 'xradio-value-<name>',
      schedule: 'ui.user-blocking.input',
      fabric: { lane: 'user-blocking', a11yLane: 'a11y' },
      rmt: XRadio.xtendRmtMetadata,
      signatureDesign: {
        note: 'Enterprise radio option with robust native focus, group-aware validation and density-safe alignment.',
        tokenStrategy: 'form tokens map label, control, helper, error, icon, focus, disabled, busy and density states.',
        themeExpectation: 'host applications can restyle the selection glyph, option text and validation surfaces independently.'
      },
      densityProfiles: ['comfortable', 'compact', 'dense'],
      states: ['required', 'disabled', 'busy', 'invalid', 'checked'],
      validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-radio',
      liveRegion: 'polite',
      signals: ['checked-state', 'radio-group-selection', 'validation-error-summary'],
      statusRegions: [],
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
      componentRef: 'x-radio',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'state-change-without-motion-only-feedback',
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
    this._internals = this.attachInternals?.();
    this._unsubscribeState = null;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          color: var(--xtend-form-text, var(--text-color, #111827));
          font-family: var(--xtend-form-font-family, var(--xtend-font-family-body, inherit));
          font-size: var(--xtend-form-control-font-size, 1rem);
          --xtend-form-control-size: var(--xtend-form-density-control-size, 1.125rem);
          --xtend-form-control-gap: var(--xtend-form-gap, 0.5rem);
          --xtend-form-helper-indent: calc(var(--xtend-form-control-size) + var(--xtend-form-control-gap));
          --xtend-form-icon-color: var(--xtend-form-accent-color, var(--xtend-control-color, var(--primary-color, #2563eb)));
          --xtend-form-control-surface: var(--xtend-control-bg, transparent);
          --xtend-form-control-text: var(--xtend-form-text);
          --xtend-form-radius: var(--xtend-control-radius, 999px);
        }
        :host([density="comfortable"]) {
          --xtend-form-density-control-size: 1.25rem;
          --xtend-form-gap: 0.6rem;
        }
        :host([density="compact"]) {
          --xtend-form-density-control-size: 1.05rem;
          --xtend-form-gap: 0.45rem;
        }
        :host([density="dense"]) {
          --xtend-form-density-control-size: 0.95rem;
          --xtend-form-gap: 0.35rem;
          font-size: var(--xtend-form-dense-font-size, 0.92rem);
        }
        label {
          display: inline-flex;
          align-items: flex-start;
          gap: var(--xtend-form-control-gap);
          cursor: pointer;
          color: var(--xtend-form-label-text, var(--xtend-form-text));
          font-size: var(--xtend-form-label-font-size, 0.95rem);
          font-weight: var(--xtend-form-label-font-weight, 600);
          overflow-wrap: anywhere;
        }
        input {
          width: var(--xtend-form-control-size);
          height: var(--xtend-form-control-size);
          margin-top: 0.125rem;
          accent-color: var(--xtend-form-icon-color);
          color: var(--xtend-form-icon-color);
          background: var(--xtend-form-control-surface);
          border-radius: var(--xtend-form-radius);
          flex: 0 0 auto;
        }
        input:focus-visible {
          outline: var(--xtend-form-focus-ring, var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb))));
          outline-offset: var(--xtend-form-focus-offset, 2px);
        }
        .hint {
          margin-left: var(--xtend-form-helper-indent);
          color: var(--xtend-form-helper-text, var(--muted-color, #6b7280));
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .error {
          display: none;
          margin-left: var(--xtend-form-helper-indent);
          color: var(--xtend-form-error-text, var(--error-color, #b42318));
          background: var(--xtend-form-error-surface, transparent);
          border-inline-start: var(--xtend-form-error-marker-width, 3px) solid var(--xtend-form-error-border, currentColor);
          border-radius: var(--xtend-form-error-radius, 0.35rem);
          padding: var(--xtend-form-error-padding, 0.25rem 0 0.25rem 0.55rem);
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          font-weight: var(--xtend-form-error-font-weight, 600);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        :host([invalid]) .error {
          display: block;
        }
        :host([invalid]) input {
          outline: var(--xtend-form-error-outline, 2px solid var(--xtend-form-error-border, var(--error-color, #dc2626)));
          outline-offset: 2px;
        }
        :host([disabled]),
        :host([busy]) {
          opacity: var(--xtend-form-disabled-opacity, 0.72);
        }
        :host([busy]) label {
          cursor: progress;
        }
        :host([disabled]) label {
          cursor: not-allowed;
        }
        @media (prefers-reduced-motion: reduce) {
          input,
          .error,
          .hint {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          input,
          .error,
          .hint {
            forced-color-adjust: auto;
          }
          .error {
            color: MarkText;
            background: Mark;
            border: 1px solid MarkText;
            padding: 0.25rem;
          }
        }
      </style>
      <label id="label" for="control">
        <input id="control" part="control icon" type="radio" role="radio" aria-describedby="hint error">
        <span part="label"><slot name="label"><span id="label-text"></span></slot><slot></slot></span>
      </label>
      <div id="hint" class="hint" part="helper"><slot name="hint"></slot></div>
      <div id="error" class="error" part="error status" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Select an option.</slot></div>
    `;
    this._control = this.shadowRoot.querySelector('#control');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._onChange = this._onChange.bind(this);
    this._onInvalid = this._onInvalid.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xradio-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncFormValue();
    this._control.addEventListener('change', this._onChange);
    this._control.addEventListener('invalid', this._onInvalid);
    this._control.addEventListener('keydown', this._onKeydown);
    xtendState.set(`xradio-checked-${this.id}`, this.checked);
    if (this.checked && this.name) xtendState.set(`xradio-value-${this.name}`, this.value);
    this._unsubscribeState = xtendState.subscribe((key, value) => {
      if (key === `xradio-value-${this.name}` && typeof value === 'string') {
        this.checked = value === this.value;
      }
    }, this.name ? `xradio-value-${this.name}` : undefined);
  }

  disconnectedCallback() {
    this._control.removeEventListener('change', this._onChange);
    this._control.removeEventListener('invalid', this._onInvalid);
    this._control.removeEventListener('keydown', this._onKeydown);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XRadio.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._control || oldValue === newValue) return;
    if (name === 'checked') {
      this._control.checked = this.hasAttribute('checked');
      if (this._control.checked) this._uncheckGroup();
      this._syncFormValue();
      return;
    }
    if (name === 'required' || name === 'disabled') {
      this._control[name] = this.hasAttribute(name);
      if (name === 'required') this._control.setAttribute('aria-required', String(this.hasAttribute(name)));
      if (name === 'disabled') this.setAttribute('aria-disabled', String(this.hasAttribute(name)));
      this._syncFormValue();
      return;
    }
    if (name === 'busy') {
      this._control.setAttribute('aria-busy', String(this.hasAttribute('busy')));
      return;
    }
    if (name === 'invalid') {
      this._control.setAttribute('aria-invalid', String(this.hasAttribute('invalid')));
      return;
    }
    if (name === 'name') {
      this._control.name = newValue || '';
      return;
    }
    if (name === 'value') {
      this._control.value = newValue || 'on';
      this._syncFormValue();
      return;
    }
    if (name === 'label') {
      this._labelText.textContent = newValue || '';
    }
  }

  _groupRadios() {
    if (!this.name) return [this];
    return Array.from(this.getRootNode().querySelectorAll('x-radio'))
      .filter((radio) => radio.name === this.name && !radio.disabled);
  }

  _uncheckGroup() {
    this._groupRadios().forEach((radio) => {
      if (radio !== this) radio.checked = false;
    });
  }

  _onChange() {
    if (this._control.checked) {
      this._uncheckGroup();
      this.checked = true;
      if (this.name) xtendState.set(`xradio-value-${this.name}`, this.value);
    }
    xtendState.set(`xradio-checked-${this.id}`, this.checked);
    this.dispatchEvent(new CustomEvent('radio-changed', {
      detail: { checked: this.checked, value: this.value, name: this.name, source: 'x-radio' },
      bubbles: true,
      composed: true
    }));
  }

  _onInvalid() {
    this.setAttribute('invalid', '');
    this.dispatchEvent(new CustomEvent('radio-invalid', {
      detail: { checked: this.checked, value: this.value, name: this.name, message: this._control.validationMessage },
      bubbles: true,
      composed: true
    }));
  }

  _onKeydown(event) {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const group = this._groupRadios();
    const index = group.indexOf(this);
    const next = group[(index + direction + group.length) % group.length];
    if (next) {
      next.check();
      next.focus();
    }
  }

  _syncFormValue() {
    this._control.setAttribute('aria-checked', String(this.checked));
    if (this.hasAttribute('required') && !this._groupRadios().some((radio) => radio.checked)) {
      this.setAttribute('invalid', '');
      this._control.setAttribute('aria-invalid', 'true');
    } else {
      this.removeAttribute('invalid');
      this._control.setAttribute('aria-invalid', 'false');
    }
    this._internals?.setFormValue(this.checked ? this.value : null);
  }

  get name() {
    return this.getAttribute('name') || '';
  }

  get checked() {
    return this._control.checked;
  }

  set checked(value) {
    const nextChecked = Boolean(value);
    this._control.checked = nextChecked;
    if (nextChecked) {
      if (!this.hasAttribute('checked')) this.setAttribute('checked', '');
    } else {
      if (this.hasAttribute('checked')) this.removeAttribute('checked');
    }
    this._syncFormValue();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  get value() {
    return this.getAttribute('value') || 'on';
  }

  set value(value) {
    this.setAttribute('value', value == null ? 'on' : String(value));
  }

  checkValidity() {
    return this._control.checkValidity();
  }

  reportValidity() {
    const valid = this._control.reportValidity();
    if (!valid) this._onInvalid();
    return valid;
  }

  validate() {
    return this.reportValidity();
  }

  check() {
    this.checked = true;
    this._onChange();
  }

  reset() {
    this.checked = false;
  }

  focus() {
    this._control.focus();
  }
}

customElements.define('x-radio', XRadio);

export { XRadio };
