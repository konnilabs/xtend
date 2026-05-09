import { xstate } from './xstate.js';

// <x-input>
class XInput extends HTMLElement {
  static formAssociated = true; // Enable native form association

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-input",
      maturity: "stable",
      source: {
        strategy: "xtend.legacy-js-with-enterprise-profile.v1",
        state: "js-runtime-profiled",
        sourcePath: "components/xinput.js"
      },
      runtime: {
        format: "esm",
        artifact: "components/xinput.js",
        declaration: "components/xinput.d.ts",
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: "xtend.component",
        kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
      },
      fabric: {
        api: "@xtend-fabric",
        defaultLane: "user-blocking"
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      tag: "x-input",
      schedules: ["component.visible.mount", "component.idle.hydrate", "ui.user-blocking.input", "a11y.announce", "diagnostics.snapshot"],
      hydration: { policy: "visible", lane: "user-blocking" },
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: "xtend.component.lifecycle-telemetry.v1",
      componentRef: "x-input",
      operations: ["mount", "hydrate", "render", "update", "event", "error", "unmount"],
      snapshotPath: "snapshot.componentTelemetry"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.profile.v1",
      componentRef: "x-input",
      role: "textbox",
      accessibleName: "required",
      focusStrategy: "native-input-focus",
      keyboard: ["Tab", "Shift+Tab", "Enter"],
      screenreader: { signalContract: XInput.xtendScreenreaderSignals },
      motionContrast: { policy: XInput.xtendMotionContrastPolicy }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      componentRef: "x-input",
      budgetClass: "interactive-small",
      lane: "user-blocking",
      hydrationPolicy: "visible",
      criticalMeasurements: ["mount", "event"],
      cleanup: ["xstate-subscription", "input-listeners"]
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: "xtend.component.form-control-ux-profile.v1",
      componentRef: "x-input",
      family: "text-entry",
      role: "textbox",
      valueMode: "string",
      slots: ["label", "hint", "error"],
      parts: ["root", "control", "label", "helper", "error"],
      events: ["input-changed", "validation-failed"],
      commands: ["focus", "validate", "reset", "set-value", "announce-error"],
      stateKey: "xinput-value-<id>",
      schedule: "ui.user-blocking.input",
      fabric: { lane: "user-blocking", a11yLane: "a11y" },
      rmt: XInput.xtendRmtMetadata,
      validation: { validityApi: true, errorRegion: "role=alert aria-live=assertive" }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      componentRef: "x-input",
      liveRegion: "polite",
      signals: ["validation-error-summary"],
      statusRegions: [],
      errorRegions: ["role=alert", "aria-live=assertive"],
      fabric: {
        lane: "a11y",
        fiberKind: "a11y.announce",
        scheduleRef: "a11y.user-blocking.announce"
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: "xtend.a11y.motion-contrast-policy.v1",
      componentRef: "x-input",
      motion: {
        schema: "xtend.a11y.motion-policy.v1",
        mediaQuery: "(prefers-reduced-motion: reduce)",
        reducedMotion: "required",
        animationPolicy: "validation-without-motion-only-feedback",
        noMotionOnlyState: true
      },
      contrast: {
        schema: "xtend.a11y.contrast-policy.v1",
        mediaQuery: "(forced-colors: active)",
        highContrast: "required",
        forcedColorAdjust: "auto",
        focusVisible: "required",
        nonColorStatus: "required"
      },
      fabric: {
        lane: "a11y",
        fiberKind: "a11y.preference",
        scheduleRef: "a11y.user-blocking.preference"
      }
    };
  }

  constructor() {
    super();
    this._internals = this.attachInternals?.();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          color: var(--xtend-text, var(--text-color, #000));
        }

        label {
          display: block;
          margin-bottom: 0.25em;
          font-weight: 500;
          color: var(--xtend-control-label-color, var(--text-color, var(--xtend-text, #000)));
        }

        input {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: var(--padding, 0.5em);
          border: 1px solid var(--xtend-control-border, var(--border-color, var(--xtend-border-color, #ccc)));
          border-radius: var(--xtend-control-radius, var(--border-radius, 4px));
          background: var(--xtend-control-bg, var(--input-bg, var(--xtend-surface, #fff)));
          color: var(--xtend-control-color, var(--text-color, var(--xtend-text, #000)));
          color-scheme: inherit;
          caret-color: var(--xtend-control-color, var(--text-color, var(--xtend-text, #000)));
          font-size: 1em;
        }

        input::placeholder {
          color: var(--xtend-control-placeholder-color, var(--muted-text-color, #64748b));
          opacity: 1;
        }

        :host-context(html[data-theme="dark"]) input,
        :host-context([data-theme="dark"]) input {
          background: var(--xtend-control-bg-dark, var(--input-bg-dark, var(--xtend-control-bg, var(--xtend-surface, #1f2635))));
          color: var(--xtend-control-color-dark, var(--input-color-dark, var(--xtend-control-color, var(--xtend-text, var(--text-color, #f5f7fb)))));
          caret-color: var(--xtend-control-color-dark, var(--input-color-dark, var(--xtend-control-color, var(--xtend-text, var(--text-color, #f5f7fb)))));
        }

        :host-context(html[data-theme="dark"]) input::placeholder,
        :host-context([data-theme="dark"]) input::placeholder {
          color: var(--xtend-control-placeholder-color-dark, var(--input-placeholder-color-dark, var(--muted-text-color, #b8c4d4)));
        }

        input:focus {
          outline: var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #0056b3)));
        }

        input:invalid {
          border-color: var(--error-color, #dc3545);
        }

        .error {
          color: var(--error-color, #dc3545);
          font-size: 0.875em;
          margin-top: 0.25em;
          display: none;
        }

        input:invalid + .error {
          display: block;
        }

        @media (prefers-reduced-motion: reduce) {
          input,
          .error {
            transition: none !important;
            animation: none !important;
          }
        }

        @media (forced-colors: active) {
          input,
          .error {
            forced-color-adjust: auto;
          }
          input {
            color: FieldText;
            background: Field;
            border-color: FieldText;
          }
          input:focus {
            outline-color: Highlight;
          }
          input:invalid {
            border-color: Mark;
          }
          .error {
            color: MarkText;
            background: Mark;
            border: 1px solid MarkText;
            padding: 0.25em;
          }
        }
      </style>
      <template id="label-template">
        <label id="label" for="input">
          <slot name="label"></slot>
        </label>
      </template>
      <input id="input" part="control" aria-describedby="error" />
      <div id="error" class="error" part="error" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Invalid input</slot></div>
    `;

    this._input = this.shadowRoot.querySelector("#input");
    this._unsubscribeState = null;
    // Label-Logik: Nur anzeigen, wenn Slot belegt
    const tmpl = this.shadowRoot.getElementById('label-template');
    const slot = tmpl.content.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      if (slot.assignedNodes().length === 0) {
        tmpl.parentNode && tmpl.parentNode.removeChild(tmpl);
      } else {
        if (!tmpl.parentNode) this.shadowRoot.insertBefore(tmpl.content.cloneNode(true), this._input);
      }
    });
    // Initial prüfen
    setTimeout(() => {
      if (slot.assignedNodes().length === 0) {
        tmpl.parentNode && tmpl.parentNode.removeChild(tmpl);
      } else {
        if (!tmpl.parentNode) this.shadowRoot.insertBefore(tmpl.content.cloneNode(true), this._input);
      }
    }, 0);
  }

  static get observedAttributes() {
    return ["type", "name", "value", "placeholder", "required", "disabled"];
  }

  connectedCallback() {
    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xinput-${Math.random().toString(36).slice(2, 10)}`;

    this._upgradeAttributes();

    // Initialen State setzen
    xstate.set(`xinput-value-${this.id}`, this.value);

    this._input.addEventListener("input", () => {
      this._internals?.setFormValue(this.value);
      this.dispatchEvent(new CustomEvent("input-changed", {
        detail: { value: this.value, source: "x-input" },
        bubbles: true,
        composed: true
      }));
      // State aktualisieren
      xstate.set(`xinput-value-${this.id}`, this.value);
    });

    this._input.addEventListener("blur", () => {
      this.reportValidity();
    });

    this._input.addEventListener("invalid", () => {
      this.dispatchEvent(new CustomEvent("validation-failed", {
        detail: { value: this.value, source: "x-input", message: this._input.validationMessage },
        bubbles: true,
        composed: true
      }));
    });

    // State-Änderungen abonnieren (z.B. externes Setzen des Werts)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xinput-value-${this.id}` && typeof value === "string" && value !== this.value) {
        this.value = value;
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    for (const attr of XInput.observedAttributes) {
      if (this.hasAttribute(attr)) {
        this.attributeChangedCallback(attr, null, this.getAttribute(attr));
      }
    }
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "value") {
      this._input.value = newValue;
      // State aktualisieren
      if (this.id) xstate.set(`xinput-value-${this.id}`, newValue);
    } else if (name === "required" || name === "disabled") {
      this._input[name] = this.hasAttribute(name);
    } else if (["type", "name", "placeholder"].includes(name)) {
      this._input.setAttribute(name, newValue);
    }
  }

  get value() {
    return this._input.value;
  }

  set value(val) {
    this._input.value = val;
    this.setAttribute("value", val);
    this._internals?.setFormValue(val);
    // State aktualisieren
    if (this.id) xstate.set(`xinput-value-${this.id}`, val);
  }

  checkValidity() {
    return this._input.checkValidity();
  }

  reportValidity() {
    return this._input.reportValidity();
  }

  validate() {
    return this.reportValidity();
  }

  reset() {
    this.value = "";
  }

  focus() {
    this._input.focus();
  }
}

customElements.define("x-input", XInput);
