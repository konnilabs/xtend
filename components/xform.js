import { xstate } from './xstate.js';

// <x-form>
class XForm extends HTMLElement {
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
      cleanup: ["mutation-observer", "xstate-subscription", "field-listeners"]
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
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
        }

        form {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          gap: var(--form-gap, 1em);
          padding: var(--form-padding, 1em);
          border: var(--form-border, none);
          background: var(--xtend-control-bg, var(--form-background, #fff));
          color: var(--xtend-control-color, var(--text-color, #000));
          border-radius: var(--xtend-control-radius, var(--border-radius, 4px));
          box-shadow: var(--form-shadow, none);
        }

        ::slotted(*) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
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
      <form part="form" role="form">
        <slot></slot>
      </form>
      <div id="status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
      <div id="error" class="sr-only" role="alert" aria-live="assertive" aria-atomic="true"></div>
    `;

    this._form = this.shadowRoot.querySelector("form");
    this._statusRegion = this.shadowRoot.querySelector("#status");
    this._errorRegion = this.shadowRoot.querySelector("#error");
    this._elements = [];
    this._fieldEvents = ["input-changed", "select-changed", "checkbox-changed", "radio-changed", "textarea-changed", "date-select", "writer:change"];
    this._supportedSelector = "x-input, x-slider, x-calendar, x-select, x-checkbox, x-radio, x-textarea, x-writer";
    this._unsubscribeState = null;
  }

  connectedCallback() {
    this._form.addEventListener("submit", this._onSubmit.bind(this));
    this._form.addEventListener("reset", this._onReset.bind(this));

    this._observer = new MutationObserver(() => this._updateElements());
    this._observer.observe(this, { childList: true, subtree: true });
    this._updateElements();

    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xform-${Math.random().toString(36).slice(2, 10)}`;

    // Initialen State setzen
    xstate.set(`xform-data-${this.id}`, this.getFormData());

    // State-Änderungen abonnieren (z.B. externes Setzen von Formulardaten)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xform-data-${this.id}` && typeof value === "object" && value !== null) {
        // Setze Werte in die Felder, falls sie unterschiedlich sind
        this._elements.forEach(el => {
          const name = el.getAttribute("name");
          if (!name || value[name] === undefined) return;

          if (el.tagName === "X-CHECKBOX") {
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

    // Änderungen an Feldern überwachen und State aktualisieren
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
          xstate.set(`xform-data-${this.id}`, this.getFormData());
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
      if (this._statusRegion) this._statusRegion.textContent = "Form submitted.";
      if (this._errorRegion) this._errorRegion.textContent = "";
      this.dispatchEvent(new CustomEvent("submit", {
        detail: { data: this.getFormData() },
        bubbles: true,
        composed: true
      }));
      // State aktualisieren
      xstate.set(`xform-data-${this.id}`, this.getFormData());
    } else {
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

    // State nach Reset aktualisieren
    xstate.set(`xform-data-${this.id}`, this.getFormData());
  }

  getFormData() {
    const data = {};
    this._elements.forEach(el => {
      const name = el.getAttribute("name");
      if (!name) {
        console.warn(`Element ${el.tagName} is missing a "name" attribute and will be ignored.`);
        return;
      }
      if (el.tagName === "X-CHECKBOX") {
        data[name] = Boolean(el.checked);
        return;
      }

      if (el.tagName === "X-RADIO") {
        if (el.checked) data[name] = el.value;
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
