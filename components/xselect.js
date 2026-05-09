import { xstate } from './xstate.js';

class XSelect extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'disabled', 'required', 'multiple', 'placeholder', 'label'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-select',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-select/x-select.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xselect.js',
        declaration: 'components/xselect.d.ts',
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
      tag: 'x-select',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-select',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-select',
      role: 'combobox',
      accessibleName: 'required',
      focusStrategy: 'native-select-focus',
      keyboard: ['Tab', 'ArrowDown', 'ArrowUp', 'Enter', 'Escape'],
      screenreader: {
        signalContract: XSelect.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XSelect.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-select',
      budgetClass: 'interactive-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['option-mutation-observer', 'xstate-subscription']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-select',
      family: 'selection',
      role: 'combobox',
      valueMode: 'string-or-list',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'control', 'label', 'helper', 'error'],
      events: ['select-changed', 'select-invalid'],
      commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error'],
      stateKey: 'xselect-value-<id>',
      schedule: 'ui.user-blocking.input',
      fabric: { lane: 'user-blocking', a11yLane: 'a11y' },
      rmt: XSelect.xtendRmtMetadata,
      validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-select',
      liveRegion: 'polite',
      signals: ['validation-error-summary', 'selected-option-announcement'],
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
      componentRef: 'x-select',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'validation-without-motion-only-feedback',
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
    this._observer = null;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--text-color, #111827);
        }
        label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }
        select {
          width: 100%;
          min-height: 2.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--xtend-control-border, var(--border-color, #9ca3af));
          border-radius: var(--xtend-control-radius, var(--border-radius, 4px));
          background: var(--xtend-control-bg, var(--input-bg, #fff));
          color: var(--xtend-control-color, var(--text-color, #111827));
          font: inherit;
        }
        select:focus {
          outline: var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb)));
          outline-offset: 2px;
        }
        select:invalid {
          border-color: var(--error-color, #dc2626);
        }
        .hint {
          margin-top: 0.25rem;
          color: var(--muted-color, #6b7280);
          font-size: 0.875rem;
        }
        .error {
          display: none;
          margin-top: 0.25rem;
          color: var(--error-color, #dc2626);
          font-size: 0.875rem;
        }
        :host([invalid]) .error {
          display: block;
        }
        @media (prefers-reduced-motion: reduce) {
          select,
          .error,
          .hint {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          select,
          .error,
          .hint {
            forced-color-adjust: auto;
          }
          select {
            color: FieldText;
            background: Field;
            border-color: FieldText;
          }
          select:focus {
            outline-color: Highlight;
          }
          .error {
            color: MarkText;
            background: Mark;
            border: 1px solid MarkText;
            padding: 0.25rem;
          }
        }
      </style>
      <label id="label" for="control"><slot name="label"><span id="label-text"></span></slot></label>
      <select id="control" part="control" role="combobox" aria-describedby="hint error"></select>
      <div id="hint" class="hint"><slot name="hint"></slot></div>
      <div id="error" class="error" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Select a valid option.</slot></div>
    `;
    this._control = this.shadowRoot.querySelector('#control');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._onChange = this._onChange.bind(this);
    this._onInvalid = this._onInvalid.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xselect-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncOptions();
    this._syncFormValue();
    this._control.addEventListener('change', this._onChange);
    this._control.addEventListener('invalid', this._onInvalid);
    this._observer = new MutationObserver(() => this._syncOptions());
    this._observer.observe(this, { childList: true, subtree: true, attributes: true });
    xstate.set(`xselect-value-${this.id}`, this.value);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xselect-value-${this.id}` && typeof value === 'string' && value !== this.value) {
        this.value = value;
      }
    }, `xselect-value-${this.id}`);
  }

  disconnectedCallback() {
    this._control.removeEventListener('change', this._onChange);
    this._control.removeEventListener('invalid', this._onInvalid);
    this._observer?.disconnect();
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XSelect.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._control || oldValue === newValue) return;
    if (name === 'value') {
      this._control.value = newValue || '';
      this._syncFormValue();
      return;
    }
    if (name === 'required' || name === 'disabled' || name === 'multiple') {
      this._control[name] = this.hasAttribute(name);
      this._syncFormValue();
      return;
    }
    if (name === 'name') {
      this._control.name = newValue || '';
      return;
    }
    if (name === 'placeholder') {
      this._syncOptions();
      return;
    }
    if (name === 'label') {
      this._labelText.textContent = newValue || '';
    }
  }

  _syncOptions() {
    const selectedValue = this.getAttribute('value') || this._control.value || '';
    const placeholder = this.getAttribute('placeholder');
    this._control.replaceChildren();
    if (placeholder && !this.hasAttribute('multiple')) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = placeholder;
      option.disabled = this.hasAttribute('required');
      this._control.appendChild(option);
    }
    this.querySelectorAll('option').forEach((sourceOption) => {
      this._control.appendChild(sourceOption.cloneNode(true));
    });
    this._control.value = selectedValue;
    this._syncFormValue();
  }

  _onChange() {
    this.value = this._control.value;
    this.dispatchEvent(new CustomEvent('select-changed', {
      detail: { value: this.value, values: this.values, source: 'x-select' },
      bubbles: true,
      composed: true
    }));
    xstate.set(`xselect-value-${this.id}`, this.value);
  }

  _onInvalid() {
    this.setAttribute('invalid', '');
    this.dispatchEvent(new CustomEvent('select-invalid', {
      detail: { value: this.value, message: this._control.validationMessage },
      bubbles: true,
      composed: true
    }));
  }

  _syncFormValue() {
    const hasValue = this.hasAttribute('multiple') ? this.values.length > 0 : this.value !== '';
    if (this.hasAttribute('required') && !hasValue) {
      this.setAttribute('invalid', '');
    } else {
      this.removeAttribute('invalid');
    }
    this._internals?.setFormValue(this.hasAttribute('multiple') ? this.values.join(',') : this.value);
  }

  get values() {
    return Array.from(this._control.selectedOptions).map((option) => option.value);
  }

  get selectedOptions() {
    return Array.from(this._control.selectedOptions);
  }

  get value() {
    return this._control.value;
  }

  set value(value) {
    const nextValue = value == null ? '' : String(value);
    this._control.value = nextValue;
    if (this.getAttribute('value') !== nextValue) {
      this.setAttribute('value', nextValue);
    }
    this._syncFormValue();
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

  reset() {
    this.value = '';
  }

  focus() {
    this._control.focus();
  }
}

customElements.define('x-select', XSelect);

export { XSelect };
