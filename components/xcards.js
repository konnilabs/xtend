import { xtendState } from './xtend-state.js';

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

  static get xtendLayoutStabilityProfile() {
    return {
      schema: "xtend.layout-stability.v1",
      componentRef: "x-cards",
      minBlockSize: "var(--cards-reserved-block-size, var(--xtend-layout-reserved-block-size, 18rem))",
      intrinsicSize: "auto var(--cards-reserved-block-size, 18rem)",
      slotReserve: ["default"],
      hydrationShiftPolicy: "no-geometry-shift",
      shellFirstCompatible: true,
      lazyLoadingCompatible: true
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
      signatureDesign: {
        note: "Distinct enterprise card rhythm with tokenized glass, border, spacing and elevation instead of a generic SaaS card grid.",
        tokenStrategy: "layout tokens feed grid width, gap, card surface, text, radius, typography, media radius, focus and hover elevation.",
        themeExpectation: "external themes can flatten, sharpen, densify or rebrand the cards without component code changes."
      },
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
          --card-gap: var(--xtend-layout-gap, 2.2rem);
          --card-max-width: var(--xtend-layout-content-max, 1200px);
          --xtend-layout-grid-min: minmax(min(100%, 16rem), 1fr);
          /* margin and width removed to avoid overflow */
          min-block-size: var(--cards-reserved-block-size, var(--xtend-layout-reserved-block-size, auto));
          contain-intrinsic-size: auto var(--cards-reserved-block-size, var(--xtend-layout-reserved-block-size, 18rem));
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(var(--card-columns), minmax(0, 1fr));
          gap: var(--card-gap);
          max-width: var(--card-max-width);
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          min-width: 0;
          overflow-wrap: anywhere;
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
    // Unique ID for state management
    if (!this.id) this.id = `xcards-${Math.random().toString(36).slice(2, 10)}`;

    // Set initial state
    xtendState.set(`xcards-state-${this.id}`, {
      columns: this.getAttribute("columns") || "3",
      gap: this.getAttribute("gap") || "1.5rem"
    });

    // Subscribe to state changes, for example external columns or gap updates
    this._unsubscribeState = xtendState.subscribe((key, value) => {
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
    // Update state
    if (this.id) {
      xtendState.set(`xcards-state-${this.id}`, {
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
          background: var(--card-bg, var(--xtend-layout-surface, rgba(40,60,120,0.18)));
          border: var(--card-border, 1px solid var(--xtend-layout-border-color, rgba(255,255,255,0.14)));
          border-radius: var(--card-radius, var(--xtend-layout-radius, 1.2em));
          box-shadow: var(--card-shadow, var(--xtend-layout-elevation, 0 4px 24px 0 rgba(40,60,120,0.10), 0 1.5px 6px 0 rgba(40,60,120,0.08)));
          backdrop-filter: var(--card-backdrop-filter, blur(14px));
          padding: var(--card-padding, var(--xtend-layout-spacing, 2.2rem 2rem 2rem 2rem));
          transition: box-shadow 0.22s, transform 0.22s, background 0.22s;
          color: var(--card-fg, var(--xtend-layout-text, #fff));
          font-family: var(--card-font-family, var(--xtend-layout-font-family, inherit));
          font-size: var(--card-text-font-size, var(--xtend-layout-font-size, 1rem));
          overflow: hidden;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        :host(:hover), :host(:focus-within) {
          box-shadow: var(--card-hover-shadow, var(--xtend-layout-elevation-hover, 0 8px 32px 0 rgba(31,38,135,0.18)));
          background: var(--card-hover-bg, rgba(79,195,247,0.13));
          transform: translateY(-6px) scale(1.012);
        }
        :host(:focus-within) {
          outline: var(--xtend-layout-focus-ring, 2.5px solid var(--xtend-color-primary, #4fc3f7));
          outline-offset: 2px;
        }
        ::slotted(h3) {
          margin-top: 0;
          font-size: var(--card-title-font-size, var(--xtend-layout-heading-font-size, 1.35rem));
          color: var(--card-title-color, var(--card-fg, var(--xtend-layout-text, #fff)));
          letter-spacing: 0;
          overflow-wrap: anywhere;
        }
        ::slotted(p) {
          font-size: var(--card-text-font-size, var(--xtend-layout-font-size, 1.05rem));
          color: var(--card-text-color, var(--xtend-layout-muted-text, #e3e9f0));
          overflow-wrap: anywhere;
        }
        ::slotted(a), ::slotted(button) {
          margin-top: 1.2em;
        }
        ::slotted(img),
        ::slotted(video) {
          border-radius: var(--card-media-radius, var(--xtend-layout-media-radius, var(--card-radius, 1.2em)));
          max-width: 100%;
        }
        @media (prefers-reduced-motion: reduce) {
          :host { transition: none !important; }
        }
        @media (forced-colors: active) {
          :host {
            border: 1px solid CanvasText;
            box-shadow: none;
            forced-color-adjust: auto;
          }
        }
      </style>
      <div part="item" role="listitem" tabindex="0">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("x-card", XCard);
