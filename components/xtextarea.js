import { xstate } from './xstate.js';

class XTextarea extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label'];
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
          color: var(--text-color, #111827);
        }
        label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }
        textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: var(--textarea-min-height, 7rem);
          padding: 0.625rem 0.75rem;
          border: 1px solid var(--xtend-control-border, var(--border-color, #9ca3af));
          border-radius: var(--xtend-control-radius, var(--border-radius, 4px));
          background: var(--xtend-control-bg, var(--input-bg, #fff));
          color: var(--xtend-control-color, var(--text-color, #111827));
          font: inherit;
          resize: var(--textarea-resize, vertical);
        }
        textarea:focus {
          outline: var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb)));
          outline-offset: 2px;
        }
        textarea:invalid {
          border-color: var(--error-color, #dc2626);
        }
        .meta {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: var(--muted-color, #6b7280);
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
      <label id="label" for="control"><slot name="label"><span id="label-text"></span></slot></label>
      <textarea id="control" part="control" aria-describedby="hint counter error"></textarea>
      <div class="meta">
        <div id="hint"><slot name="hint"></slot></div>
        <div id="counter" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
      <div id="error" class="error" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Enter a valid value.</slot></div>
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
      this._syncFormValue();
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
    if (this.checkValidity()) this.removeAttribute('invalid');
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
