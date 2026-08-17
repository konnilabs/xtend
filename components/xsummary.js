import { xstate } from './xstate.js';

// <x-summary>
class XSummary extends HTMLElement {
  static get observedAttributes() {
    return ["open", "type"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-summary",
      profiles: ["display", "stateful"],
      maturity: "ux-ready"
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      schedule: "component.visible.mount",
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      role: "button",
      accessibleName: "summary",
      focusStrategy: "native-details-summary"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-content",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.summary.toggle", "xtend.layout.measure"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-summary",
      family: "display-disclosure",
      role: "button",
      contentKind: "collapsible-content",
      responsiveStrategy: "block-disclosure",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "content-contained",
      aspectRatio: "content-driven",
      events: ["open", "close"],
      commands: ["expand", "collapse", "snapshot"],
      stateKey: "xsummary-open-<id>",
      schedule: "component.visible.mount",
      fabric: { lane: "visible", a11yLane: "a11y", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._details = null;
    this._summary = null;
    this._stateKey = "";
    this._unsubscribeState = null;
    this._syncingAttribute = false;
    this._onDetailsToggle = this._onDetailsToggle.bind(this);
    this._onSummaryKeydown = this._onSummaryKeydown.bind(this);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          --glass-bg: rgba(30, 34, 44, 0.55);
          --glass-blur: 18px;
          --primary: #4fc3f7;
          --primary-dark: #0288d1;
          --accent: #fff;
          --border-radius: 18px;
          --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
          --focus-outline: 2px solid var(--primary);
        }
        details {
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: var(--border-radius);
          padding: 0.7em 1.2em;
          background: var(--glass-bg);
          color: var(--accent);
          box-shadow: var(--shadow);
          backdrop-filter: blur(var(--glass-blur));
          transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
          margin-bottom: 1em;
        }
        details[open] {
          background-color: rgba(30,34,44,0.68);
          box-shadow: 0 12px 32px 0 rgba(31, 38, 135, 0.22);
        }
        summary {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
          list-style: none;
          position: relative;
          outline: none;
          font-size: 1.1em;
          padding: 0.2em 0;
          user-select: none;
        }
        summary:focus {
          outline: var(--focus-outline);
          outline-offset: 2px;
        }
        summary::-webkit-details-marker {
          display: none;
        }
        .icon {
          margin-right: 0.7em;
          transition: transform 0.2s cubic-bezier(.4,1.4,.6,1);
          display: flex;
          align-items: center;
          transform: rotate(0deg);
          transform-origin: center;
        }
        .icon svg {
          width: 1.2em;
          height: 1.2em;
          display: block;
        }
        details[open] .icon {
          transform: rotate(180deg);
        }
        .content ::slotted(*) {
          margin: 0.5em 0 0;
        }
        /* Type variants */
        :host([type="info"]) details { border-left: 4px solid var(--info-color, #17a2b8); }
        :host([type="success"]) details { border-left: 4px solid var(--success-color, #28a745); }
        :host([type="warning"]) details { border-left: 4px solid var(--warning-color, #ffc107); }
        :host([type="danger"]) details { border-left: 4px solid var(--error-color, #dc3545); }
        @media (prefers-color-scheme: dark) {
          :host, :host([dark]) details {
            --glass-bg: rgba(30, 34, 44, 0.85);
            --accent: #f1f1f1;
          }
        }
        @media (max-width: 600px) {
          details { padding: 0.5em 0.5em; }
        }
        @media (prefers-reduced-motion: reduce) {
          details, .icon { transition: none !important; }
        }
        @media (forced-colors: active) {
          details {
            border: 1px solid CanvasText;
          }
        }
      </style>
      <details part="container">
        <summary part="summary">
          <span class="icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <slot name="title">Mehr anzeigen</slot>
        </summary>
        <div class="content">
          <slot></slot>
        </div>
      </details>
    `;

    this._details = this.shadowRoot.querySelector("details");
    this._summary = this.shadowRoot.querySelector("summary");
  }

  connectedCallback() {
    if (!this.id) this.id = `xsummary-${Math.random().toString(36).slice(2, 10)}`;
    this._stateKey = `xsummary-open-${this.id}`;
    this._applyOpenState(this.hasAttribute("open"), { syncState: false });
    this._setXStateOpen(this._isOpen());

    // Subscribe to state changes, for example open or close from outside
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === this._stateKey && typeof value === "boolean") {
        if (value === this._isOpen()) return;
        this._applyOpenState(value, { syncState: false });
      }
    }, this._stateKey);

    this._details.addEventListener("toggle", this._onDetailsToggle);
    this._summary.addEventListener("keydown", this._onSummaryKeydown);

  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
    this._unsubscribeState = null;
    this._details.removeEventListener("toggle", this._onDetailsToggle);
    this._summary.removeEventListener("keydown", this._onSummaryKeydown);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === "open") {
      if (this._syncingAttribute) return;
      this._applyOpenState(this.hasAttribute("open"), { syncState: this.isConnected });
    }
  }

  open() {
    this._applyOpenState(true);
  }

  close() {
    this._applyOpenState(false);
  }

  toggle() {
    this._applyOpenState(!this._isOpen());
  }

  _isOpen() {
    return Boolean(this._details && this._details.open);
  }

  _setXStateOpen(isOpen) {
    if (!this._stateKey) return;
    if (typeof xstate.get === "function" && xstate.get(this._stateKey) === isOpen) return;
    xstate.set(this._stateKey, Boolean(isOpen));
  }

  _applyOpenState(isOpen, options = {}) {
    const nextOpen = Boolean(isOpen);
    if (this._details && this._details.open !== nextOpen) {
      this._details.open = nextOpen;
    }
    if (this.hasAttribute("open") !== nextOpen) {
      this._syncingAttribute = true;
      try {
        this.toggleAttribute("open", nextOpen);
      } finally {
        this._syncingAttribute = false;
      }
    }
    if (options.syncState !== false) {
      this._setXStateOpen(nextOpen);
    }
  }

  _onDetailsToggle() {
    const isOpen = this._isOpen();
    this._applyOpenState(isOpen);
    this.dispatchEvent(new CustomEvent(isOpen ? "open" : "close", {
      detail: { open: isOpen },
      bubbles: true,
      composed: true
    }));
  }

  _onSummaryKeydown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle();
    }
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-summary",
      stateKey: `xsummary-open-${this.id}`,
      schedule: "component.visible.mount",
      open: this._details.open,
      type: this.getAttribute("type") || "default"
    };
  }
}

customElements.define("x-summary", XSummary);
