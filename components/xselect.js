import { xstate } from './xstate.js';

class XSelect extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'disabled', 'required', 'multiple', 'placeholder', 'label', 'busy', 'invalid', 'density'];
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
      signatureDesign: {
        note: 'Enterprise selection control with clear native affordance, status-safe validation and density-aware rhythm.',
        tokenStrategy: 'form tokens map label, control, helper, error, icon, focus, disabled, busy and density states.',
        themeExpectation: 'host applications can restyle select surfaces and validation without browser-default visual debt.'
      },
      densityProfiles: ['comfortable', 'compact', 'dense'],
      states: ['required', 'disabled', 'busy', 'invalid'],
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
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          color: var(--xtend-form-text, var(--text-color, #111827));
          font-family: var(--xtend-form-font-family, var(--xtend-font-family-body, inherit));
          font-size: var(--xtend-form-control-font-size, 1rem);
          --xtend-form-control-height: var(--xtend-form-density-control-height, 2.75rem);
          --xtend-form-control-padding: var(--xtend-form-density-padding, 0.65rem 0.85rem);
          --xtend-form-control-gap: var(--xtend-form-gap, 0.35rem);
          --xtend-form-icon-color: var(--xtend-form-control-text, currentColor);
        }
        :host([density="comfortable"]) {
          --xtend-form-density-control-height: 3rem;
          --xtend-form-density-padding: 0.75rem 0.95rem;
          --xtend-form-gap: 0.45rem;
        }
        :host([density="compact"]) {
          --xtend-form-density-control-height: 2.5rem;
          --xtend-form-density-padding: 0.55rem 0.75rem;
          --xtend-form-gap: 0.3rem;
        }
        :host([density="dense"]) {
          --xtend-form-density-control-height: 2.15rem;
          --xtend-form-density-padding: 0.4rem 0.65rem;
          --xtend-form-gap: 0.2rem;
          font-size: var(--xtend-form-dense-font-size, 0.92rem);
        }
        label {
          display: block;
          margin-bottom: var(--xtend-form-control-gap);
          color: var(--xtend-form-label-text, var(--xtend-form-text));
          font-size: var(--xtend-form-label-font-size, 0.92rem);
          font-weight: var(--xtend-form-label-font-weight, 650);
          overflow-wrap: anywhere;
        }
        select {
          width: 100%;
          min-height: var(--xtend-form-control-height);
          padding: var(--xtend-form-control-padding);
          border: var(--xtend-form-border-width, 1px) solid var(--xtend-form-border-color, var(--xtend-control-border, var(--border-color, #9ca3af)));
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.5rem)));
          background: var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, #fff)));
          color: var(--xtend-form-control-text, var(--xtend-control-color, var(--text-color, #111827)));
          accent-color: var(--xtend-form-icon-color);
          font: inherit;
          color-scheme: inherit;
          box-shadow: var(--xtend-form-control-shadow, 0 1px 2px rgba(15, 23, 42, 0.06));
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        option {
          background: var(--xtend-form-option-surface, var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, #fff))));
          color: var(--xtend-form-option-text, var(--xtend-form-control-text, var(--xtend-control-color, var(--text-color, #111827))));
        }
        option:checked {
          background: var(--xtend-form-option-selected-surface, var(--xtend-form-option-surface, var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, #fff)))));
          color: var(--xtend-form-option-selected-text, var(--xtend-form-option-text, var(--xtend-form-control-text, var(--xtend-control-color, var(--text-color, #111827)))));
        }
        :host-context(html[data-theme="dark"]) select,
        :host-context([data-theme="dark"]) select {
          background: var(--xtend-form-control-surface-dark, var(--xtend-control-bg-dark, var(--input-bg-dark, var(--xtend-form-control-surface, #1f2635))));
          color: var(--xtend-form-control-text-dark, var(--xtend-control-color-dark, var(--input-color-dark, var(--xtend-form-control-text, #f5f7fb))));
        }
        :host-context(html[data-theme="dark"]) option,
        :host-context([data-theme="dark"]) option {
          background: var(--xtend-form-option-surface-dark, var(--xtend-form-control-surface-dark, var(--xtend-control-bg-dark, var(--input-bg-dark, #1f2635))));
          color: var(--xtend-form-option-text-dark, var(--xtend-form-control-text-dark, var(--xtend-control-color-dark, var(--input-color-dark, #f5f7fb))));
        }
        :host-context(html[data-theme="dark"]) option:checked,
        :host-context([data-theme="dark"]) option:checked {
          background: var(--xtend-form-option-selected-surface-dark, var(--xtend-form-option-surface-dark, var(--xtend-form-control-surface-dark, var(--xtend-control-bg-dark, var(--input-bg-dark, #1f2635)))));
          color: var(--xtend-form-option-selected-text-dark, var(--xtend-form-option-text-dark, var(--xtend-form-control-text-dark, var(--xtend-control-color-dark, var(--input-color-dark, #f5f7fb)))));
        }
        select:focus {
          outline: var(--xtend-form-focus-ring, var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb))));
          outline-offset: var(--xtend-form-focus-offset, 2px);
          border-color: var(--xtend-form-focus-border-color, var(--primary-color, #2563eb));
        }
        :host([invalid]) select {
          border-color: var(--xtend-form-error-border, var(--error-color, #dc2626));
          box-shadow: var(--xtend-form-error-shadow, inset 0 0 0 1px var(--xtend-form-error-border, var(--error-color, #dc2626)));
        }
        .hint {
          margin-top: var(--xtend-form-control-gap);
          color: var(--xtend-form-helper-text, var(--muted-color, #6b7280));
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .error {
          display: none;
          margin-top: var(--xtend-form-control-gap);
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
        :host([disabled]),
        :host([busy]) {
          opacity: var(--xtend-form-disabled-opacity, 0.72);
        }
        :host([busy]) select {
          cursor: progress;
          border-style: dashed;
        }
        :host([disabled]) select {
          cursor: not-allowed;
          background: var(--xtend-form-disabled-surface, color-mix(in srgb, var(--xtend-form-control-surface, #fff) 78%, var(--xtend-form-text, #111827)));
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
      <label id="label" part="label" for="control"><slot name="label"><span id="label-text"></span></slot></label>
      <select id="control" part="control icon" role="combobox" aria-describedby="hint error"></select>
      <div id="hint" class="hint" part="helper"><slot name="hint"></slot></div>
      <div id="error" class="error" part="error status" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Select a valid option.</slot></div>
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
    if (!this.hasAttribute('required') || hasValue) {
      this.removeAttribute('invalid');
      this._control.setAttribute('aria-invalid', 'false');
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
