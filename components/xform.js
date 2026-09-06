import { componentStyleNonce } from './style-nonce.js';
import { xtendState } from './xtend-state.js';

// <x-form>
class XForm extends HTMLElement {
  static get observedAttributes() {
    return ["density", "busy", "invalid", "disabled"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-form",
      maturity: "stable",
      source: {
        strategy: "xtend.legacy-js-with-enterprise-profile.v1",
        state: "js-runtime-profiled",
        sourcePath: "components/xform.js"
      },
      runtime: {
        format: "esm",
        artifact: "components/xform.js",
        declaration: "components/xform.d.ts",
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
      tag: "x-form",
      schedules: ["component.visible.mount", "ui.user-blocking.input", "a11y.announce", "diagnostics.snapshot"],
      hydration: { policy: "visible", lane: "user-blocking" },
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: "xtend.component.lifecycle-telemetry.v1",
      componentRef: "x-form",
      operations: ["mount", "hydrate", "render", "update", "event", "error", "unmount"],
      snapshotPath: "snapshot.componentTelemetry"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.profile.v1",
      componentRef: "x-form",
      role: "form",
      accessibleName: "recommended",
      focusStrategy: "managed-child-control-focus",
      keyboard: ["Tab", "Shift+Tab", "Enter", "Escape"],
      screenreader: { signalContract: XForm.xtendScreenreaderSignals },
      motionContrast: { policy: XForm.xtendMotionContrastPolicy }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      componentRef: "x-form",
      budgetClass: "interactive-medium",
      lane: "user-blocking",
      hydrationPolicy: "visible",
      criticalMeasurements: ["mount", "event", "validation"],
      cleanup: ["mutation-observer", "xtend-state-subscription", "field-listeners"]
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: "xtend.component.form-control-ux-profile.v1",
      componentRef: "x-form",
      family: "form-host",
      role: "form",
      valueMode: "record",
      slots: ["default", "status", "error"],
      parts: ["root", "form", "helper", "error"],
      events: ["submit", "invalid", "reset"],
      commands: ["submit", "validate", "reset", "snapshot", "announce-error"],
      stateKey: "xform-data-<id>",
      schedule: "component.visible.mount",
      fabric: { lane: "user-blocking", a11yLane: "a11y", diagnosticsLane: "diagnostics" },
      rmt: XForm.xtendRmtMetadata,
      signatureDesign: {
        note: "Enterprise form host with premium surface rhythm, aggregate status regions and density-aware control composition.",
        tokenStrategy: "form tokens cascade to child controls for label, helper, error, icon, focus, disabled, busy and density states.",
        themeExpectation: "host applications can rebrand full form surfaces and nested control roles without component-specific overrides."
      },
      densityProfiles: ["comfortable", "compact", "dense"],
      states: ["disabled", "busy", "invalid"],
      validation: { aggregateChildren: true, errorRegion: "role=alert aria-live=assertive" }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      componentRef: "x-form",
      liveRegion: "polite",
      signals: ["validation-error-summary", "submit-status"],
      statusRegions: ["role=status", "aria-live=polite"],
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
      componentRef: "x-form",
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
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style${componentStyleNonce(this.ownerDocument)}>
        :host {
          display: block;
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          color: var(--xtend-form-text, var(--text-color, #0f172a));
          font-family: var(--xtend-form-font-family, var(--xtend-font-family-body, inherit));
          --xtend-form-control-height: var(--xtend-form-density-control-height, 2.75rem);
          --xtend-form-control-padding: var(--xtend-form-density-padding, 0.65rem 0.85rem);
          --xtend-form-control-gap: var(--xtend-form-gap, 0.35rem);
          --xtend-form-control-surface: var(--xtend-control-bg, var(--xtend-form-surface, #fff));
          --xtend-form-control-text: var(--xtend-form-text);
          --xtend-form-label-text: var(--xtend-form-text);
          --xtend-form-helper-text: var(--muted-text-color, #64748b);
          --xtend-form-helper-font-size: 0.875rem;
          --xtend-form-error-text: var(--error-color, #b42318);
          --xtend-form-error-surface: transparent;
          --xtend-form-focus-ring: var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb)));
          --xtend-form-icon-color: var(--primary-color, #2563eb);
        }

        :host([density="comfortable"]) {
          --xtend-form-density-control-height: 3rem;
          --xtend-form-density-padding: 0.75rem 0.95rem;
          --xtend-form-gap: 0.65rem;
        }

        :host([density="compact"]) {
          --xtend-form-density-control-height: 2.5rem;
          --xtend-form-density-padding: 0.55rem 0.75rem;
          --xtend-form-gap: 0.45rem;
        }

        :host([density="dense"]) {
          --xtend-form-density-control-height: 2.15rem;
          --xtend-form-density-padding: 0.4rem 0.65rem;
          --xtend-form-gap: 0.3rem;
          --xtend-form-control-font-size: var(--xtend-form-dense-font-size, 0.92rem);
        }

        form {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          gap: var(--form-gap, var(--xtend-form-gap, 1em));
          padding: var(--form-padding, var(--xtend-form-surface-padding, 1em));
          border: var(--form-border, var(--xtend-form-border-width, 1px) solid var(--xtend-form-border-color, transparent));
          background: var(--xtend-form-surface, var(--xtend-control-bg, var(--form-background, #fff)));
          color: var(--xtend-form-text, var(--xtend-control-color, var(--text-color, #000)));
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.65rem)));
          box-shadow: var(--form-shadow, var(--xtend-form-surface-shadow, 0 12px 32px rgba(15, 23, 42, 0.08)));
        }

        ::slotted(*) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          --xtend-form-font-family: inherit;
        }

        :host([busy]) form,
        :host([disabled]) form {
          opacity: var(--xtend-form-disabled-opacity, 0.72);
        }

        :host([busy]) form {
          cursor: progress;
          border-style: dashed;
        }

        :host([invalid]) form {
          border-color: var(--xtend-form-error-border, var(--error-color, #dc2626));
          box-shadow: var(--xtend-form-error-shadow, inset 0 0 0 1px var(--xtend-form-error-border, var(--error-color, #dc2626)));
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          form,
          ::slotted(*) {
            transition: none !important;
            animation: none !important;
            scroll-behavior: auto !important;
          }
        }

        @media (forced-colors: active) {
          form {
            forced-color-adjust: auto;
            color: CanvasText;
            background: Canvas;
            border: 1px solid CanvasText;
            box-shadow: none;
          }
          ::slotted(*) {
            forced-color-adjust: auto;
          }
        }
      </style>
      <form part="root form" role="form">
        <slot part="label control icon"></slot>
      </form>
      <div id="status" class="sr-only" part="helper status" role="status" aria-live="polite" aria-atomic="true"></div>
      <div id="error" class="sr-only" part="error status" role="alert" aria-live="assertive" aria-atomic="true"></div>
    `;

    this._form = this.shadowRoot.querySelector("form");
    this._statusRegion = this.shadowRoot.querySelector("#status");
    this._errorRegion = this.shadowRoot.querySelector("#error");
    this._elements = [];
    this._fieldEvents = ["input-changed", "select-changed", "checkbox-changed", "toggle-changed", "radio-changed", "textarea-changed", "date-select", "writer:change"];
    this._supportedSelector = "x-input, x-slider, x-calendar, x-select, x-checkbox, x-toggle, x-radio, x-textarea, x-writer";
    this._unsubscribeState = null;
  }

  attributeChangedCallback(name) {
    if (!this._form) return;
    if (name === "busy") this._form.setAttribute("aria-busy", String(this.hasAttribute("busy")));
    if (name === "disabled") this.setAttribute("aria-disabled", String(this.hasAttribute("disabled")));
    if (name === "invalid") this._form.setAttribute("aria-invalid", String(this.hasAttribute("invalid")));
  }

  connectedCallback() {
    XForm.observedAttributes.forEach((attribute) => this.attributeChangedCallback(attribute));
    this._form.addEventListener("submit", this._onSubmit.bind(this));
    this._form.addEventListener("reset", this._onReset.bind(this));

    this._observer = new MutationObserver(() => this._updateElements());
    this._observer.observe(this, { childList: true, subtree: true });
    this._updateElements();

    // Unique ID for state management
    if (!this.id) this.id = `xform-${Math.random().toString(36).slice(2, 10)}`;

    // Set initial state
    xtendState.set(`xform-data-${this.id}`, this.getFormData());

    // Subscribe to state changes, for example external form data updates
    this._unsubscribeState = xtendState.subscribe((key, value) => {
      if (key === `xform-data-${this.id}` && typeof value === "object" && value !== null) {
        // Set field values when they differ
        this._elements.forEach(el => {
          const name = el.getAttribute("name");
          if (!name || value[name] === undefined) return;

          if (el.tagName === "X-CHECKBOX" || el.tagName === "X-TOGGLE") {
            el.checked = Boolean(value[name]);
            return;
          }

          if (el.tagName === "X-RADIO") {
            el.checked = value[name] === el.value;
            return;
          }

          if (value[name] !== el.value) {
            el.value = value[name];
          }
        });
      }
    });

    // Watch field changes and update state
    this._attachFieldListeners();
  }

  disconnectedCallback() {
    this._observer.disconnect();
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _updateElements() {
    this._elements = this.querySelectorAll(this._supportedSelector);
    this._attachFieldListeners();
  }

  _attachFieldListeners() {
    this._elements.forEach(el => {
      if (el.__xformBoundTo === this.id) return;
      el.__xformBoundTo = this.id;
      this._fieldEvents.forEach(eventName => {
        el.addEventListener(eventName, () => {
          xtendState.set(`xform-data-${this.id}`, this.getFormData());
        });
      });
    });
  }

  _onSubmit(event) {
    event.preventDefault();

    let valid = true;
    const invalidElements = [];

    for (const el of this._elements) {
      if (typeof el.checkValidity === "function" && !el.checkValidity()) {
        valid = false;
        invalidElements.push(el);
        el.reportValidity?.();
      }
    }

    if (valid) {
      this.removeAttribute("invalid");
      if (this._statusRegion) this._statusRegion.textContent = "Form submitted.";
      if (this._errorRegion) this._errorRegion.textContent = "";
      this.dispatchEvent(new CustomEvent("submit", {
        detail: { data: this.getFormData() },
        bubbles: true,
        composed: true
      }));
      // Update state
      xtendState.set(`xform-data-${this.id}`, this.getFormData());
    } else {
      this.setAttribute("invalid", "");
      if (this._statusRegion) this._statusRegion.textContent = "";
      if (this._errorRegion) this._errorRegion.textContent = `${invalidElements.length} invalid field${invalidElements.length === 1 ? "" : "s"}.`;
      this.dispatchEvent(new CustomEvent("invalid", {
        detail: { message: "Form validation failed.", invalidElements },
        bubbles: true,
        composed: true
      }));
    }
  }

  _onReset() {
    this._elements.forEach(el => {
      if (typeof el.reset === "function") el.reset();
    });

    this.dispatchEvent(new CustomEvent("reset", {
      bubbles: true,
      composed: true
    }));

    if (this._statusRegion) this._statusRegion.textContent = "Form reset.";
    if (this._errorRegion) this._errorRegion.textContent = "";

    // Update state after reset
    xtendState.set(`xform-data-${this.id}`, this.getFormData());
  }

  getFormData() {
    const data = {};
    this._elements.forEach(el => {
      const name = el.getAttribute("name");
      if (!name) {
        console.warn(`Element ${el.tagName} is missing a "name" attribute and will be ignored.`);
        return;
      }
      if (el.tagName === "X-CHECKBOX" || el.tagName === "X-TOGGLE") {
        data[name] = Boolean(el.checked);
        return;
      }

      if (el.tagName === "X-RADIO") {
        if (el.checked) data[name] = el.value;
        return;
      }

      if (el.files && typeof el.files.length === "number") {
        data[name] = el.multiple ? Array.from(el.files) : el.files[0] || null;
        return;
      }

      data[name] = el.value;
    });
    return data;
  }

  validate() {
    return Array.from(this._elements).every((el) => {
      return typeof el.checkValidity !== "function" || el.checkValidity();
    });
  }

  submit() {
    if (typeof this._form.requestSubmit === "function") {
      this._form.requestSubmit();
      return;
    }
    this._onSubmit(new Event("submit", { bubbles: true, cancelable: true }));
  }

  reset() {
    this._form.reset();
    this._onReset();
  }
}

customElements.define("x-form", XForm);
