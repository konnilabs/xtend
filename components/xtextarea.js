import { xstate } from './xstate.js';

class XTextarea extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-textarea',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-textarea/x-textarea.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xtextarea.js',
        declaration: 'components/xtextarea.d.ts',
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
      tag: 'x-textarea',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-textarea',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-textarea',
      role: 'textbox',
      accessibleName: 'required',
      focusStrategy: 'native-textarea-focus',
      keyboard: ['Tab', 'Shift+Tab', 'Enter'],
      screenreader: {
        signalContract: XTextarea.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XTextarea.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-textarea',
      budgetClass: 'interactive-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['xstate-subscription', 'input-listeners']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-textarea',
      family: 'text-entry',
      role: 'textbox',
      valueMode: 'string',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'control', 'label', 'helper', 'error'],
      events: ['textarea-changed', 'textarea-invalid'],
      commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error'],
      stateKey: 'xtextarea-value-<id>',
      schedule: 'ui.user-blocking.input',
      fabric: { lane: 'user-blocking', a11yLane: 'a11y' },
      rmt: XTextarea.xtendRmtMetadata,
      signatureDesign: {
        note: 'Enterprise multiline field with measured writing surface, live status rhythm and density-safe metadata.',
        tokenStrategy: 'form tokens map label, control, helper, error, status, focus, disabled, busy and density states.',
        themeExpectation: 'host applications can restyle writing surface, helper, counter and validation independently.'
      },
      densityProfiles: ['comfortable', 'compact', 'dense'],
      states: ['required', 'disabled', 'readonly', 'busy', 'invalid'],
      validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-textarea',
      liveRegion: 'polite',
      signals: ['validation-error-summary', 'character-count-announcement'],
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
      componentRef: 'x-textarea',
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
          --xtend-form-control-min-height: var(--xtend-form-density-control-min-height, var(--textarea-min-height, 7rem));
          --xtend-form-control-padding: var(--xtend-form-density-padding, 0.7rem 0.85rem);
          --xtend-form-control-gap: var(--xtend-form-gap, 0.35rem);
          --xtend-form-icon-color: var(--xtend-form-control-text, currentColor);
        }
        :host([density="comfortable"]) {
          --xtend-form-density-control-min-height: 8rem;
          --xtend-form-density-padding: 0.85rem 1rem;
          --xtend-form-gap: 0.45rem;
        }
        :host([density="compact"]) {
          --xtend-form-density-control-min-height: 6.25rem;
          --xtend-form-density-padding: 0.6rem 0.75rem;
          --xtend-form-gap: 0.3rem;
        }
        :host([density="dense"]) {
          --xtend-form-density-control-min-height: 4.75rem;
          --xtend-form-density-padding: 0.45rem 0.65rem;
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
        textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: var(--xtend-form-control-min-height);
          padding: var(--xtend-form-control-padding);
          border: var(--xtend-form-border-width, 1px) solid var(--xtend-form-border-color, var(--xtend-control-border, var(--border-color, #9ca3af)));
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.5rem)));
          background: var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, #fff)));
          color: var(--xtend-form-control-text, var(--xtend-control-color, var(--text-color, #111827)));
          font: inherit;
          color-scheme: inherit;
          box-shadow: var(--xtend-form-control-shadow, 0 1px 2px rgba(15, 23, 42, 0.06));
          resize: var(--textarea-resize, vertical);
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        textarea:focus {
          outline: var(--xtend-form-focus-ring, var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb))));
          outline-offset: var(--xtend-form-focus-offset, 2px);
          border-color: var(--xtend-form-focus-border-color, var(--primary-color, #2563eb));
        }
        :host([invalid]) textarea,
        textarea:invalid {
          border-color: var(--xtend-form-error-border, var(--error-color, #dc2626));
          box-shadow: var(--xtend-form-error-shadow, inset 0 0 0 1px var(--xtend-form-error-border, var(--error-color, #dc2626)));
        }
        .meta {
          display: flex;
          justify-content: space-between;
          gap: var(--xtend-form-gap, 1rem);
          margin-top: var(--xtend-form-control-gap);
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          color: var(--xtend-form-helper-text, var(--muted-color, #6b7280));
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
        :host([busy]) textarea {
          cursor: progress;
          border-style: dashed;
        }
        :host([disabled]) textarea,
        :host([readonly]) textarea {
          background: var(--xtend-form-disabled-surface, color-mix(in srgb, var(--xtend-form-control-surface, #fff) 78%, var(--xtend-form-text, #111827)));
        }
        @media (prefers-reduced-motion: reduce) {
          textarea,
          .error,
          .meta {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          textarea,
          .error,
          .meta {
            forced-color-adjust: auto;
          }
          textarea {
            color: FieldText;
            background: Field;
            border-color: FieldText;
          }
          textarea:focus {
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
      <textarea id="control" part="control" aria-describedby="hint counter error"></textarea>
      <div class="meta" part="helper">
        <div id="hint"><slot name="hint"></slot></div>
        <div id="counter" part="status" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
      <div id="error" class="error" part="error status" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Enter a valid value.</slot></div>
    `;
    this._control = this.shadowRoot.querySelector('#control');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._counter = this.shadowRoot.querySelector('#counter');
    this._onInput = this._onInput.bind(this);
    this._onInvalid = this._onInvalid.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xtextarea-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncFormValue();
    this._syncCounter();
    this._control.addEventListener('input', this._onInput);
    this._control.addEventListener('invalid', this._onInvalid);
    xstate.set(`xtextarea-value-${this.id}`, this.value);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xtextarea-value-${this.id}` && typeof value === 'string' && value !== this.value) {
        this.value = value;
      }
    }, `xtextarea-value-${this.id}`);
  }

  disconnectedCallback() {
    this._control.removeEventListener('input', this._onInput);
    this._control.removeEventListener('invalid', this._onInvalid);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XTextarea.observedAttributes.forEach((attribute) => {
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
      this._syncCounter();
      return;
    }
    if (['required', 'disabled', 'readonly'].includes(name)) {
      const propertyName = name === 'readonly' ? 'readOnly' : name;
      this._control[propertyName] = this.hasAttribute(name);
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
    if (['name', 'placeholder', 'maxlength', 'minlength', 'rows'].includes(name)) {
      if (newValue == null) this._control.removeAttribute(name);
      else this._control.setAttribute(name, newValue);
      this._syncFormValue();
      this._syncCounter();
      return;
    }
    if (name === 'label') {
      this._labelText.textContent = newValue || '';
    }
  }

  _onInput() {
    this._syncFormValue();
    this._syncCounter();
    this.dispatchEvent(new CustomEvent('textarea-changed', {
      detail: { value: this.value, length: this.value.length, maxLength: this.maxLength, source: 'x-textarea' },
      bubbles: true,
      composed: true
    }));
    xstate.set(`xtextarea-value-${this.id}`, this.value);
  }

  _onInvalid() {
    this.setAttribute('invalid', '');
    this._control.setAttribute('aria-invalid', 'true');
    this.dispatchEvent(new CustomEvent('textarea-invalid', {
      detail: { value: this.value, message: this._control.validationMessage, source: 'x-textarea' },
      bubbles: true,
      composed: true
    }));
  }

  _syncCounter() {
    const max = this.maxLength;
    const length = this.value.length;
    this._counter.textContent = max > -1 ? `${length}/${max}` : `${length}`;
  }

  _syncFormValue() {
    if (this.checkValidity()) {
      this.removeAttribute('invalid');
      this._control.setAttribute('aria-invalid', 'false');
    }
    this._internals?.setFormValue(this.value);
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
    this._syncCounter();
  }

  get maxLength() {
    return this._control.maxLength;
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

customElements.define('x-textarea', XTextarea);

export { XTextarea };
