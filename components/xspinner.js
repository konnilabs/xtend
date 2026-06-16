import { xstate } from './xstate.js';

// <x-spinner>
class XSpinner extends HTMLElement {
  static get observedAttributes() {
    return ["paused", "size", "color", "speed", "type", "overlay", "aria-label", "aria-busy", "aria-valuetext"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-spinner",
      maturity: "stable",
      source: {
        strategy: "xtend.legacy-esm.component-source",
        state: "js-runtime",
        sourcePath: "components/xspinner.js"
      },
      runtime: {
        format: "esm",
        artifact: "components/xspinner.js",
        declaration: "components/xspinner.d.ts",
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: "xtend.component",
        kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
      },
      fabric: {
        api: "@xtend-fabric",
        defaultLane: "feedback"
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      tag: "x-spinner",
      schedules: ["component.visible.mount", "component.idle.hydrate", "diagnostics.snapshot"],
      hydration: { policy: "visible", lane: "feedback" },
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: "xtend.component.lifecycle-telemetry.v1",
      componentRef: "x-spinner",
      operations: ["mount", "hydrate", "render", "event", "unmount"],
      snapshotPath: "snapshot.componentTelemetry"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.profile.v1",
      componentRef: "x-spinner",
      role: "status",
      accessibleName: "required",
      liveRegion: "polite",
      screenreader: {
        signalContract: XSpinner.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XSpinner.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      componentRef: "x-spinner",
      budgetClass: "feedback-small",
      lane: "feedback",
      hydrationPolicy: "visible",
      criticalMeasurements: ["mount", "hydrate", "event"],
      cleanup: ["xstate-subscription", "overlay-parent"]
    };
  }

  static get xtendFeedbackStatusUxProfile() {
    return {
      schema: "xtend.component.feedback-status-ux-profile.v1",
      componentRef: "x-spinner",
      family: "spinner",
      role: "status",
      severityModel: "busy-paused",
      liveRegion: "polite",
      timeoutMode: "none",
      dismissMode: "none",
      events: ["spinner-started", "spinner-stopped", "paused", "resumed"],
      commands: ["pause", "resume", "snapshot"],
      stateKey: "xspinner-paused-<id>",
      schedule: "component.visible.mount",
      fabric: {
        lane: "feedback",
        a11yLane: "a11y",
        diagnosticsLane: "diagnostics"
      },
      rmt: XSpinner.xtendRmtMetadata,
      statusSemantics: {
        noColorOnlyState: true,
        ariaBusyMirroring: true
      }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      componentRef: "x-spinner",
      liveRegion: "polite",
      signals: ["spinner-started", "spinner-stopped", "scheduler-feedback"],
      statusRegions: ["role=status", "aria-live=polite"],
      errorRegions: [],
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
      componentRef: "x-spinner",
      motion: {
        schema: "xtend.a11y.motion-policy.v1",
        mediaQuery: "(prefers-reduced-motion: reduce)",
        reducedMotion: "required",
        animationPolicy: "controls-stay-readable-without-motion",
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
    const shadow = this.attachShadow({ mode: "open" });

    // Spinner Container
    const container = document.createElement("div");
    container.className = "spinner-container";
    // Spinner Visual
    this._spinner = document.createElement("div");
    this._spinner.setAttribute("role", "status");
    this._spinner.setAttribute("part", "root content");
    this._spinner.setAttribute("aria-live", "polite");
    this._spinner.setAttribute("aria-atomic", "true");
    this._spinner.setAttribute("aria-label", this.getAttribute("aria-label") || "Loading...");
    // Overlay
    this._overlay = document.createElement("div");
    this._overlay.className = "spinner-overlay";
    this._overlay.style.display = "none";
    // Slot
    const slot = document.createElement("slot");
    slot.name = "content";
    container.append(this._spinner, slot);
    // Styles
    const style = document.createElement("style");
    style.textContent = `
      .spinner-container {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .spinner-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top: 4px solid var(--spinner-color, var(--xtend-feedback-color, var(--primary-color, #007bff)));
        border-radius: 50%;
        width: var(--spinner-size, 24px);
        height: var(--spinner-size, 24px);
        animation: spin var(--spinner-speed, 1s) linear infinite;
        animation-play-state: var(--animation-state, running);
        will-change: transform;
      }
      @media (prefers-reduced-motion: reduce) {
        .spinner,
        .dot {
          animation: none !important;
          transition: none !important;
        }
        .dot {
          opacity: 1;
          transform: none;
        }
      }
      @media (forced-colors: active) {
        .spinner-container,
        .spinner-overlay {
          forced-color-adjust: auto;
          color: CanvasText;
        }
        .spinner-overlay {
          background: Canvas;
        }
        .spinner {
          border-color: CanvasText;
          border-top-color: Highlight;
        }
        .dot {
          background: Highlight;
          outline: 1px solid CanvasText;
        }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      /* Dots Spinner */
      .dots {
        display: flex;
        gap: 0.3em;
      }
      .dot {
        width: calc(var(--spinner-size, 24px) / 3);
        height: calc(var(--spinner-size, 24px) / 3);
        background: var(--spinner-color, var(--xtend-feedback-color, var(--primary-color, #007bff)));
        border-radius: 50%;
        animation: dot-bounce var(--spinner-speed, 1s) infinite alternate;
      }
      .dot:nth-child(2) { animation-delay: 0.2s; }
      .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dot-bounce {
        to { transform: translateY(-50%); opacity: 0.5; }
      }
    `;
    shadow.append(style, this._overlay, container);
    this._container = container;
    this._slot = slot;
    this._unsubscribeState = null;
  }

  connectedCallback() {
    if (!this.id) this.id = `xspinner-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xspinner-paused-${this.id}`, this.hasAttribute("paused"));
    this._renderSpinner();
    this._emitSpinnerEvent("spinner-started");
    // State-Änderungen abonnieren
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xspinner-paused-${this.id}` && typeof value === "boolean") {
        const paused = this.hasAttribute("paused");
        if (value === paused) return;
        if (value) this.setAttribute("paused", "");
        else this.removeAttribute("paused");
      }
    });
    // Overlay-Mode
    if (this.hasAttribute("overlay")) {
      this._overlay.style.display = "flex";
      this._overlay.appendChild(this._container);
      document.body.appendChild(this._overlay);
    }
    // Accessibility
    this._spinner.setAttribute("aria-busy", this.getAttribute("aria-busy") || "true");
    if (this.hasAttribute("aria-valuetext")) {
      this._spinner.setAttribute("aria-valuetext", this.getAttribute("aria-valuetext"));
    }
  }

  disconnectedCallback() {
    this._emitSpinnerEvent("spinner-stopped");
    if (this._unsubscribeState) this._unsubscribeState();
    if (this._overlay.parentNode === document.body) {
      document.body.removeChild(this._overlay);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "paused") {
      this._spinner.style.animationPlayState = newValue !== null ? "paused" : "running";
      if (this.id) {
        xstate.set(`xspinner-paused-${this.id}`, newValue !== null);
      }
      this._emitSpinnerEvent(newValue !== null ? "paused" : "resumed");
    }
    if (["size", "color", "speed", "type"].includes(name)) {
      this._renderSpinner();
    }
    if (name === "overlay") {
      if (this.hasAttribute("overlay")) {
        this._overlay.style.display = "flex";
        if (!this._overlay.contains(this._container)) this._overlay.appendChild(this._container);
        if (this._overlay.parentNode !== document.body) document.body.appendChild(this._overlay);
      } else {
        this._overlay.style.display = "none";
        if (this._overlay.parentNode === document.body) document.body.removeChild(this._overlay);
      }
    }
    if (name === "aria-label") {
      this._spinner.setAttribute("aria-label", newValue || "Loading...");
    }
    if (name === "aria-busy") {
      this._spinner.setAttribute("aria-busy", newValue || "true");
    }
    if (name === "aria-valuetext") {
      if (newValue) this._spinner.setAttribute("aria-valuetext", newValue);
      else this._spinner.removeAttribute("aria-valuetext");
    }
  }

  _renderSpinner() {
    // Remove old spinner content
    this._spinner.innerHTML = "";
    this._spinner.className = "spinner";
    // Size
    const size = this.getAttribute("size") || "24";
    this._spinner.style.setProperty('--spinner-size', size + 'px');
    // Color
    const color = this.getAttribute("color");
    if (color) this._spinner.style.setProperty('--spinner-color', color);
    else this._spinner.style.removeProperty('--spinner-color');
    // Speed
    const speed = this.getAttribute("speed");
    if (speed) this._spinner.style.setProperty('--spinner-speed', speed);
    else this._spinner.style.removeProperty('--spinner-speed');
    // Type
    const type = this.getAttribute("type") || "circle";
    if (type === "dots") {
      this._spinner.className = "dots";
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.className = "dot";
        this._spinner.appendChild(dot);
      }
    } else {
      this._spinner.className = "spinner";
    }
  }

  _emitSpinnerEvent(name) {
    this.dispatchEvent(new CustomEvent(name, {
      detail: {
        id: this.id,
        paused: this.hasAttribute("paused"),
        source: "x-spinner",
        stateKey: `xspinner-paused-${this.id}`
      },
      bubbles: true,
      composed: true
    }));
  }

  pause() {
    this.setAttribute("paused", "");
  }

  resume() {
    this.removeAttribute("paused");
  }

  snapshot() {
    return {
      id: this.id,
      paused: this.hasAttribute("paused"),
      type: this.getAttribute("type") || "circle",
      source: "x-spinner"
    };
  }
}

customElements.define("x-spinner", XSpinner);
// TypeScript-Hinweis: Typdefinitionen für Attribute und Events empfohlen.
