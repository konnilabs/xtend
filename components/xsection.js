import { xstate } from './xstate.js';

// <x-section>
class XSection extends HTMLElement {
  static get observedAttributes() {
    return ["padding", "background", "bordered", "layout", "label"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-section",
      profiles: ["display"],
      maturity: "ux-ready"
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      schedule: "layout.measure",
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      role: "region",
      accessibleName: "label",
      focusStrategy: "container-region"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-layout",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.layout.measure", "xtend.layout.render"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutStabilityProfile() {
    return {
      schema: "xtend.layout-stability.v1",
      componentRef: "x-section",
      minBlockSize: "var(--section-reserved-block-size, var(--xtend-layout-reserved-block-size, auto))",
      intrinsicSize: "auto var(--section-reserved-block-size, 12rem)",
      slotReserve: ["default"],
      hydrationShiftPolicy: "no-geometry-shift",
      shellFirstCompatible: true,
      lazyLoadingCompatible: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-section",
      family: "layout-section",
      role: "region",
      contentKind: "sectioned-content",
      responsiveStrategy: "slot-grid-column-row",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "horizontal-scroll-contained",
      aspectRatio: "content-driven",
      signatureDesign: {
        note: "Editorial enterprise section with tokenized rhythm, optional boundary and overflow-safe content lanes.",
        tokenStrategy: "layout tokens map to padding, surface, border, radius, typography, gap, content width and focus treatment.",
        themeExpectation: "sections stay brand-neutral and can become plain, framed or editorial through CSS tokens only."
      },
      events: ["section-rendered"],
      commands: ["render", "measure", "layout", "snapshot"],
      stateKey: "xsection-state-<id>",
      schedule: "layout.measure",
      fabric: { lane: "visible", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: var(--section-padding, var(--xtend-layout-spacing, 2em));
          background: var(--section-bg, var(--xtend-layout-surface, transparent));
          color: var(--section-color, var(--xtend-layout-text, var(--xtend-text, inherit)));
          border-radius: var(--section-radius, var(--xtend-layout-radius, var(--border-radius, 6px)));
          box-shadow: var(--section-shadow, var(--xtend-layout-elevation, none));
          font-family: var(--section-font-family, var(--xtend-layout-font-family, inherit));
          font-size: var(--section-font-size, var(--xtend-layout-font-size, inherit));
          --section-media-radius: var(--xtend-layout-media-radius, var(--section-radius, 6px));
          --section-grid-min: var(--xtend-layout-grid-min, minmax(0, 1fr));
          box-sizing: border-box;
          border: none;
          max-width: var(--section-content-max, var(--xtend-layout-content-max, 100%));
          min-width: 0;
          min-block-size: var(--section-reserved-block-size, var(--xtend-layout-reserved-block-size, auto));
          contain-intrinsic-size: auto var(--section-reserved-block-size, var(--xtend-layout-reserved-block-size, 12rem));
          overflow-wrap: anywhere;
        }

        :host([bordered]) {
          border: var(--section-border-width, 1px) solid var(--section-border, var(--xtend-layout-border-color, #ddd));
        }

        :host(:focus-within) {
          outline: var(--xtend-layout-focus-ring, var(--xtend-focus-ring, none));
          outline-offset: 2px;
        }

        .container {
          display: flex;
          gap: var(--section-gap, var(--xtend-layout-gap, 1em));
          overflow-x: auto; /* Enable horizontal scrolling */
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-wrap: anywhere;
        }

        :host([layout="column"]) .container {
          flex-direction: column;
        }

        :host([layout="row"]) .container {
          flex-direction: row;
          white-space: nowrap; /* Prevent wrapping of content */
        }

        ::slotted([slot="header"]) {
          font-weight: var(--header-font-weight, bold);
          font-size: var(--header-font-size, var(--xtend-layout-heading-font-size, 1.25em));
          overflow-wrap: anywhere;
        }

        ::slotted([slot="footer"]) {
          font-size: var(--footer-font-size, 0.9em);
          color: var(--footer-color, var(--xtend-layout-muted-text, #666));
          overflow-wrap: anywhere;
        }

        ::slotted([slot="aside"]) {
          flex: 0 0 var(--aside-width, 25%);
          min-width: 0;
          overflow-wrap: anywhere;
        }

        ::slotted(:not([slot])) {
          flex: 1;
          padding: var(--main-content-padding, var(--xtend-layout-spacing, 1em));
          min-width: 0;
          overflow-wrap: anywhere;
        }

        @media (prefers-reduced-motion: reduce) {
          .container { scroll-behavior: auto; }
        }

        @media (forced-colors: active) {
          :host([bordered]) {
            border-color: CanvasText;
          }
        }
      </style>
      <div class="container" part="root container" role="region" aria-label="${this.getAttribute("label") || "Section"}">
        <header part="header"><slot name="header"></slot></header>
        <aside part="aside"><slot name="aside"></slot></aside>
        <main part="content"><slot></slot></main>
        <footer part="footer"><slot name="footer"></slot></footer>
      </div>
    `;
    this._unsubscribeState = null;
  }

  connectedCallback() {
    // Unique ID for state management
    if (!this.id) this.id = `xsection-${Math.random().toString(36).slice(2, 10)}`;

    // Set initial state
    xstate.set(`xsection-state-${this.id}`, {
      padding: this.getAttribute("padding"),
      background: this.getAttribute("background"),
      bordered: this.hasAttribute("bordered"),
      layout: this.getAttribute("layout"),
      label: this.getAttribute("label")
    });

    // Subscribe to state changes, for example external control
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xsection-state-${this.id}` && typeof value === "object") {
        if (value.padding !== undefined) this.setAttribute("padding", value.padding);
        if (value.background !== undefined) this.setAttribute("background", value.background);
        if (value.bordered !== undefined) {
          if (value.bordered) this.setAttribute("bordered", "");
          else this.removeAttribute("bordered");
        }
        if (value.layout !== undefined) this.setAttribute("layout", value.layout);
        if (value.label !== undefined) this.setAttribute("label", value.label);
      }
    });

    this.dispatchEvent(new CustomEvent("section-rendered", {
      detail: this.snapshot(),
      bubbles: true,
      composed: true
    }));
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return; // Prevent unnecessary updates

    const propertyMap = {
      padding: "--section-padding",
      background: "--section-bg",
    };

    if (propertyMap[name]) {
      this.style.setProperty(propertyMap[name], newVal);
    } else if (name === "layout") {
      const container = this.shadowRoot.querySelector(".container");
      if (container) {
        container.style.flexDirection = newVal === "row" ? "row" : "column";
      }
    } else if (name === "label") {
      const container = this.shadowRoot.querySelector(".container");
      if (container) {
        container.setAttribute("aria-label", newVal);
      }
    }

    // Update state
    if (this.id) {
      xstate.set(`xsection-state-${this.id}`, {
        padding: this.getAttribute("padding"),
        background: this.getAttribute("background"),
        bordered: this.hasAttribute("bordered"),
        layout: this.getAttribute("layout"),
        label: this.getAttribute("label")
      });
    }
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-section",
      stateKey: `xsection-state-${this.id}`,
      schedule: "layout.measure",
      layout: this.getAttribute("layout") || "column",
      label: this.getAttribute("label") || "Section"
    };
  }
}

customElements.define("x-section", XSection);
