import { a as xstate } from './x-button-DGQY--Wj.mjs';

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
      parts: ["root", "control", "label", "helper", "error", "status"],
      events: ["input-changed", "validation-failed"],
      commands: ["focus", "validate", "reset", "set-value", "announce-error"],
      stateKey: "xinput-value-<id>",
      schedule: "ui.user-blocking.input",
      fabric: { lane: "user-blocking", a11yLane: "a11y" },
      rmt: XInput.xtendRmtMetadata,
      signatureDesign: {
        note: "Precise enterprise text field with calm surface depth, explicit status typography and density-aware rhythm.",
        tokenStrategy: "form tokens map label, control, helper, error, icon, focus, disabled, busy and density states.",
        themeExpectation: "host applications can restyle every visible form role without relying on hardcoded color decisions."
      },
      densityProfiles: ["comfortable", "compact", "dense"],
      states: ["required", "disabled", "busy", "invalid"],
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
          color: var(--xtend-form-text, var(--xtend-text, var(--text-color, #0f172a)));
          font-family: var(--xtend-form-font-family, var(--xtend-font-family-body, inherit));
          font-size: var(--xtend-form-control-font-size, 1rem);
          --xtend-form-control-height: var(--xtend-form-density-control-height, 2.75rem);
          --xtend-form-control-padding: var(--xtend-form-density-padding, 0.65rem 0.85rem);
          --xtend-form-control-gap: var(--xtend-form-gap, 0.35rem);
          --xtend-form-icon-color: var(--xtend-form-control-text, currentColor);
          --xtend-form-status-marker: "";
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
          font-weight: var(--xtend-form-label-font-weight, 650);
          font-size: var(--xtend-form-label-font-size, 0.92rem);
          color: var(--xtend-form-label-text, var(--xtend-control-label-color, var(--xtend-form-text)));
          overflow-wrap: anywhere;
        }

        input {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          min-height: var(--xtend-form-control-height);
          box-sizing: border-box;
          padding: var(--xtend-form-control-padding, var(--padding, 0.5em));
          border: var(--xtend-form-border-width, 1px) solid var(--xtend-form-border-color, var(--xtend-control-border, var(--border-color, var(--xtend-border-color, #9ca3af))));
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.5rem)));
          background: var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, var(--xtend-surface, #fff))));
          color: var(--xtend-form-control-text, var(--xtend-control-color, var(--xtend-form-text)));
          color-scheme: inherit;
          caret-color: var(--xtend-form-caret-color, var(--xtend-form-control-text));
          font: inherit;
          box-shadow: var(--xtend-form-control-shadow, 0 1px 2px rgba(15, 23, 42, 0.06));
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        input::placeholder {
          color: var(--xtend-form-placeholder-text, var(--xtend-control-placeholder-color, var(--muted-text-color, #64748b)));
          opacity: 1;
        }

        :host-context(html[data-theme="dark"]) input,
        :host-context([data-theme="dark"]) input {
          background: var(--xtend-form-control-surface-dark, var(--xtend-control-bg-dark, var(--input-bg-dark, var(--xtend-form-control-surface, var(--xtend-surface, #1f2635)))));
          color: var(--xtend-form-control-text-dark, var(--xtend-control-color-dark, var(--input-color-dark, var(--xtend-form-control-text, #f5f7fb))));
          caret-color: var(--xtend-form-control-text-dark, var(--xtend-control-color-dark, var(--input-color-dark, var(--xtend-form-control-text, #f5f7fb))));
        }

        :host-context(html[data-theme="dark"]) input::placeholder,
        :host-context([data-theme="dark"]) input::placeholder {
          color: var(--xtend-control-placeholder-color-dark, var(--input-placeholder-color-dark, var(--muted-text-color, #b8c4d4)));
        }

        input:focus {
          outline: var(--xtend-form-focus-ring, var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #0056b3))));
          outline-offset: var(--xtend-form-focus-offset, 2px);
          border-color: var(--xtend-form-focus-border-color, var(--primary-color, #0056b3));
        }

        :host([invalid]) input {
          border-color: var(--xtend-form-error-border, var(--error-color, #dc3545));
          box-shadow: var(--xtend-form-error-shadow, inset 0 0 0 1px var(--xtend-form-error-border, var(--error-color, #dc3545)));
        }

        .helper,
        .error {
          font-size: var(--xtend-form-helper-font-size, 0.875em);
          margin-top: var(--xtend-form-control-gap);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .helper {
          color: var(--xtend-form-helper-text, var(--muted-text-color, #64748b));
        }

        .error {
          color: var(--xtend-form-error-text, var(--error-color, #b42318));
          background: var(--xtend-form-error-surface, transparent);
          border-inline-start: var(--xtend-form-error-marker-width, 3px) solid var(--xtend-form-error-border, currentColor);
          border-radius: var(--xtend-form-error-radius, 0.35rem);
          padding: var(--xtend-form-error-padding, 0.25rem 0 0.25rem 0.55rem);
          font-weight: var(--xtend-form-error-font-weight, 600);
          display: none;
        }

        :host([invalid]) .error {
          display: block;
        }

        :host([disabled]),
        :host([busy]) {
          opacity: var(--xtend-form-disabled-opacity, 0.72);
        }

        :host([busy]) input {
          cursor: progress;
          border-style: dashed;
        }

        :host([disabled]) input {
          cursor: not-allowed;
          background: var(--xtend-form-disabled-surface, color-mix(in srgb, var(--xtend-form-control-surface, #fff) 78%, var(--xtend-form-text, #0f172a)));
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
          :host([invalid]) input {
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
      <label id="label" part="label" for="input">
        <slot name="label"></slot>
      </label>
      <input id="input" part="control" aria-describedby="helper error" />
      <div id="helper" class="helper" part="helper"><slot name="hint"></slot></div>
      <div id="error" class="error" part="error status" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Invalid input</slot></div>
    `;

    this._input = this.shadowRoot.querySelector("#input");
    this._unsubscribeState = null;
  }

  static get observedAttributes() {
    return ["type", "name", "value", "placeholder", "required", "disabled", "busy", "invalid", "density"];
  }

  connectedCallback() {
    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xinput-${Math.random().toString(36).slice(2, 10)}`;

    this._upgradeAttributes();

    // Initialen State setzen
    xstate.set(`xinput-value-${this.id}`, this.value);

    this._input.addEventListener("input", () => {
      this._internals?.setFormValue(this.value);
      if (this._input.checkValidity()) this.removeAttribute("invalid");
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
      this.setAttribute("invalid", "");
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
      if (name === "required") this._input.setAttribute("aria-required", String(this.hasAttribute(name)));
      if (name === "disabled") this.setAttribute("aria-disabled", String(this.hasAttribute(name)));
    } else if (name === "busy") {
      this._input.setAttribute("aria-busy", String(this.hasAttribute("busy")));
    } else if (name === "invalid") {
      this._input.setAttribute("aria-invalid", String(this.hasAttribute("invalid")));
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
    const valid = this._input.reportValidity();
    if (valid) this.removeAttribute("invalid");
    else this.setAttribute("invalid", "");
    return valid;
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
//# sourceMappingURL=x-input-3sNyfdfw.mjs.map

