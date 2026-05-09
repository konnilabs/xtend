import { xstate } from './xstate.js';

class XCheckbox extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'checked', 'disabled', 'required', 'indeterminate', 'label'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-checkbox',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-checkbox/x-checkbox.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xcheckbox.js',
        declaration: 'components/xcheckbox.d.ts',
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
      tag: 'x-checkbox',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-checkbox',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-checkbox',
      role: 'checkbox',
      accessibleName: 'required',
      focusStrategy: 'native-control-focus',
      keyboard: ['Tab', 'Space'],
      screenreader: { signalContract: XCheckbox.xtendScreenreaderSignals },
      motionContrast: { policy: XCheckbox.xtendMotionContrastPolicy }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-checkbox',
      budgetClass: 'interactive-small',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'event'],
      cleanup: ['xstate-subscription']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-checkbox',
      family: 'selection',
      role: 'checkbox',
      valueMode: 'boolean-or-token',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'control', 'label', 'helper', 'error'],
      events: ['checkbox-changed', 'checkbox-invalid'],
      commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error'],
      stateKey: 'xcheckbox-checked-<id>',
      schedule: 'ui.user-blocking.input',
      fabric: { lane: 'user-blocking', a11yLane: 'a11y' },
      rmt: XCheckbox.xtendRmtMetadata,
      validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-checkbox',
      liveRegion: 'polite',
      signals: ['checked-state', 'indeterminate-state', 'validation-error-summary'],
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
      componentRef: 'x-checkbox',
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
          color: var(--text-color, #111827);
        }
        label {
          display: inline-flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
        }
        input {
          width: 1.125rem;
          height: 1.125rem;
          margin-top: 0.125rem;
          accent-color: var(--xtend-control-color, var(--primary-color, #2563eb));
        }
        input:focus-visible {
          outline: var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb)));
          outline-offset: 2px;
        }
        .hint {
          margin-left: 1.625rem;
          color: var(--muted-color, #6b7280);
          font-size: 0.875rem;
        }
        .error {
          display: none;
          margin-left: 1.625rem;
          color: var(--error-color, #dc2626);
          font-size: 0.875rem;
        }
        :host([invalid]) .error {
          display: block;
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
        <input id="control" part="control" type="checkbox" aria-describedby="hint error">
        <span><slot name="label"><span id="label-text"></span></slot><slot></slot></span>
      </label>
      <div id="hint" class="hint"><slot name="hint"></slot></div>
      <div id="error" class="error" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">This checkbox is required.</slot></div>
    `;
    this._control = this.shadowRoot.querySelector('#control');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._onChange = this._onChange.bind(this);
    this._onInvalid = this._onInvalid.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xcheckbox-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncFormValue();
    this._control.addEventListener('change', this._onChange);
    this._control.addEventListener('invalid', this._onInvalid);
    xstate.set(`xcheckbox-checked-${this.id}`, this.checked);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xcheckbox-checked-${this.id}` && typeof value === 'boolean' && value !== this.checked) {
        this.checked = value;
      }
    }, `xcheckbox-checked-${this.id}`);
  }

  disconnectedCallback() {
    this._control.removeEventListener('change', this._onChange);
    this._control.removeEventListener('invalid', this._onInvalid);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XCheckbox.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._control || oldValue === newValue) return;
    if (name === 'checked') {
      this._control.checked = this.hasAttribute('checked');
      this._syncFormValue();
      return;
    }
    if (name === 'indeterminate') {
      this._control.indeterminate = this.hasAttribute('indeterminate');
      this._control.setAttribute('aria-checked', this._control.indeterminate ? 'mixed' : String(this.checked));
      return;
    }
    if (name === 'required' || name === 'disabled') {
      this._control[name] = this.hasAttribute(name);
      this._syncFormValue();
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

  _onChange() {
    this.checked = this._control.checked;
    this.dispatchEvent(new CustomEvent('checkbox-changed', {
      detail: { checked: this.checked, value: this.value, source: 'x-checkbox' },
      bubbles: true,
      composed: true
    }));
    xstate.set(`xcheckbox-checked-${this.id}`, this.checked);
  }

  _onInvalid() {
    this.setAttribute('invalid', '');
    this.dispatchEvent(new CustomEvent('checkbox-invalid', {
      detail: { checked: this.checked, value: this.value, message: this._control.validationMessage },
      bubbles: true,
      composed: true
    }));
  }

  _syncFormValue() {
    this._control.setAttribute('aria-checked', this._control.indeterminate ? 'mixed' : String(this.checked));
    if (this.hasAttribute('required') && !this.checked) {
      this.setAttribute('invalid', '');
    } else {
      this.removeAttribute('invalid');
    }
    this._internals?.setFormValue(this.checked ? this.value : null);
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

  get indeterminate() {
    return this._control.indeterminate;
  }

  set indeterminate(value) {
    this._control.indeterminate = Boolean(value);
    if (value) this.setAttribute('indeterminate', '');
    else this.removeAttribute('indeterminate');
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

  toggle() {
    this.checked = !this.checked;
    this._onChange();
  }

  reset() {
    this.checked = false;
    this.indeterminate = false;
  }

  focus() {
    this._control.focus();
  }
}

customElements.define('x-checkbox', XCheckbox);

export { XCheckbox };
