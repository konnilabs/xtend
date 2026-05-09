import { xstate } from './xstate.js';

class XCards extends HTMLElement {
  static get observedAttributes() {
    return ["columns", "gap"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-cards",
      profiles: ["display"],
      maturity: "ux-ready"
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      schedule: "layout.reflow.commit",
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      role: "list",
      accessibleName: "Cards grid",
      focusStrategy: "slotted-card-focus"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-layout",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.layout.measure", "xtend.layout.reflow"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-cards",
      family: "layout-cards",
      role: "list",
      contentKind: "card-grid",
      responsiveStrategy: "auto-collapse-grid",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "no-page-overflow",
      aspectRatio: "card-content-driven",
      events: ["cards-layout"],
      commands: ["render", "measure", "layout", "snapshot"],
      stateKey: "xcards-state-<id>",
      schedule: "layout.reflow.commit",
      fabric: { lane: "visible", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._unsubscribeState = null;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --card-columns: 3;
          --card-gap: 2.2rem;
          --card-max-width: 1200px;
          /* margin und width entfernt, damit kein Overflow entsteht */
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(var(--card-columns), 1fr);
          gap: var(--card-gap);
          max-width: var(--card-max-width);
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr;
            max-width: 100vw;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .grid { scroll-behavior: auto; }
        }
        @media (forced-colors: active) {
          .grid { border: 1px solid CanvasText; }
        }
      </style>
      <div class="grid" part="root grid" role="list">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xcards-${Math.random().toString(36).slice(2, 10)}`;

    // Initialen State setzen
    xstate.set(`xcards-state-${this.id}`, {
      columns: this.getAttribute("columns") || "3",
      gap: this.getAttribute("gap") || "1.5rem"
    });

    // State-Änderungen abonnieren (z.B. externes Setzen von columns/gap)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xcards-state-${this.id}` && typeof value === "object") {
        if (typeof value.columns === "string" && value.columns !== this.getAttribute("columns")) {
          this.setAttribute("columns", value.columns);
        }
        if (typeof value.gap === "string" && value.gap !== this.getAttribute("gap")) {
          this.setAttribute("gap", value.gap);
        }
      }
    });

    this.dispatchEvent(new CustomEvent("cards-layout", {
      detail: this.snapshot(),
      bubbles: true,
      composed: true
    }));
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "columns") {
      this.style.setProperty("--card-columns", newValue);
    }
    if (name === "gap") {
      this.style.setProperty("--card-gap", newValue);
    }
    // State aktualisieren
    if (this.id) {
      xstate.set(`xcards-state-${this.id}`, {
        columns: this.getAttribute("columns") || "3",
        gap: this.getAttribute("gap") || "1.5rem"
      });
    }
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-cards",
      stateKey: `xcards-state-${this.id}`,
      schedule: "layout.reflow.commit",
      columns: this.getAttribute("columns") || "3",
      gap: this.getAttribute("gap") || "1.5rem"
    };
  }
}

customElements.define("x-cards", XCards);

class XCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--card-bg, rgba(40,60,120,0.18));
          border: none;
          border-radius: var(--card-radius, 1.2em);
          box-shadow: var(--card-shadow, 0 4px 24px 0 rgba(40,60,120,0.10), 0 1.5px 6px 0 rgba(40,60,120,0.08));
          backdrop-filter: blur(14px);
          padding: var(--card-padding, 2.2rem 2rem 2rem 2rem);
          transition: box-shadow 0.22s, transform 0.22s, background 0.22s;
          color: var(--card-fg, #fff);
          overflow: hidden;
        }
        :host(:hover), :host(:focus-within) {
          box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
          background: rgba(79,195,247,0.13);
          transform: translateY(-6px) scale(1.012);
        }
        :host(:focus-within) {
          outline: 2.5px solid #4fc3f7;
          outline-offset: 2px;
        }
        ::slotted(h3) {
          margin-top: 0;
          font-size: var(--card-title-font-size, 1.35rem);
          color: var(--card-title-color, #fff);
          letter-spacing: 0.01em;
        }
        ::slotted(p) {
          font-size: var(--card-text-font-size, 1.05rem);
          color: var(--card-text-color, #e3e9f0);
        }
        ::slotted(a), ::slotted(button) {
          margin-top: 1.2em;
        }
      </style>
      <div part="item" role="listitem" tabindex="0">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("x-card", XCard);
