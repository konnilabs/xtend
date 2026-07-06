import { xstate } from './xstate.js';

class XFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.themeObserver = null;
    this._unsubscribeState = null;
    this.render();
  }

  static get observedAttributes() {
    return ["src", "logo-size", "sticky"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-footer",
      profiles: ["display"],
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
      role: "contentinfo",
      accessibleName: "Footer",
      focusStrategy: "link-list"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-layout",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.footer.render", "xtend.layout.measure"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutStabilityProfile() {
    return {
      schema: "xtend.layout-stability.v1",
      componentRef: "x-footer",
      minBlockSize: "var(--footer-reserved-block-size, calc(var(--footer-logo-size, 40px) + 2rem + 2px))",
      intrinsicSize: "auto var(--footer-reserved-block-size, 4.75rem)",
      slotReserve: ["title", "nav", "extra"],
      hydrationShiftPolicy: "no-geometry-shift",
      shellFirstCompatible: true,
      lazyLoadingCompatible: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-footer",
      family: "layout-footer",
      role: "contentinfo",
      contentKind: "app-shell-footer",
      responsiveStrategy: "wrap-to-column",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "no-page-overflow",
      aspectRatio: "content-driven",
      signatureDesign: {
        note: "Composed enterprise footer with restrained surface contrast, logo-safe media slot and brand-neutral navigation rhythm.",
        tokenStrategy: "layout tokens provide surface, text, border, radius, spacing, typography, media radius and elevation fallbacks.",
        themeExpectation: "corporate themes can replace footer identity through XTend.css without inline color overrides."
      },
      events: ["footer-ready", "theme-applied", "logo-loaded"],
      commands: ["render", "measure", "layout", "snapshot"],
      stateKey: "xfooter-state-<id>",
      schedule: "component.visible.mount",
      fabric: { lane: "visible", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  connectedCallback() {
    this.renderLogo();
    this.applyTheme();
    this.observeThemeChanges();
    this.applySticky();

    // Unique ID for state management
    if (!this.id) this.id = `xfooter-${Math.random().toString(36).slice(2, 10)}`;

    // Set initial state
    xstate.set(`xfooter-state-${this.id}`, {
      src: this.getAttribute("src"),
      logoSize: this.getAttribute("logo-size"),
      sticky: this.hasAttribute("sticky")
    });

    // Subscribe to state changes, for example external src, logoSize, or sticky updates
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xfooter-state-${this.id}` && typeof value === "object") {
        if (typeof value.src === "string" && value.src !== this.getAttribute("src")) {
          this.setAttribute("src", value.src);
        }
        if (typeof value.logoSize === "string" && value.logoSize !== this.getAttribute("logo-size")) {
          this.setAttribute("logo-size", value.logoSize);
        }
        if (typeof value.sticky === "boolean") {
          if (value.sticky) this.setAttribute("sticky", "");
          else this.removeAttribute("sticky");
        }
      }
    });

    this.dispatchEvent(new CustomEvent("footer-ready", {
      detail: this.snapshot(),
      bubbles: true,
      composed: true
    }));
  }

  disconnectedCallback() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "src" || name === "logo-size") {
        this.renderLogo();
      } else if (name === "sticky") {
        this.applySticky();
      }
      // Update state
      if (this.id) {
        xstate.set(`xfooter-state-${this.id}`, {
          src: this.getAttribute("src"),
          logoSize: this.getAttribute("logo-size"),
          sticky: this.hasAttribute("sticky")
        });
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--footer-fg, var(--xtend-layout-text, var(--xtend-text, #172033)));
          font-family: var(--footer-font-family, var(--xtend-layout-font-family, var(--xtend-font-family-body, 'Inter', 'Segoe UI', Arial, sans-serif)));
          font-size: var(--footer-font-size, var(--xtend-layout-font-size, 1rem));
          --footer-reserved-block-size: calc(var(--footer-logo-size, 40px) + 2rem + 2px);
          --footer-grid-min: var(--xtend-layout-grid-min, minmax(10rem, 1fr));
          --footer-content-max: var(--xtend-layout-content-max, 100%);
          max-width: 100%;
          min-width: 0;
          min-block-size: var(--footer-reserved-block-size);
          contain-intrinsic-size: auto var(--footer-reserved-block-size);
          box-sizing: border-box;
        }

        :host([data-theme-dark]) {
          color: var(--footer-fg, var(--xtend-layout-text, var(--xtend-text, #f2f5f9)));
        }

        footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--footer-gap, var(--xtend-layout-gap, 1rem));
          padding: var(--footer-padding, var(--xtend-layout-spacing, 1rem));
          background: var(--footer-bg, var(--xtend-layout-surface, var(--xtend-surface, #f7f8fb)));
          color: inherit;
          border: var(--footer-border, 1px solid var(--xtend-layout-border-color, rgba(15, 23, 42, 0.14)));
          border-radius: var(--footer-radius, var(--xtend-layout-radius, var(--xtend-radius-panel, 0.85rem)));
          box-shadow: var(--footer-shadow, var(--xtend-layout-elevation, var(--xtend-shadow-subtle, 0 10px 28px rgba(15, 23, 42, 0.08))));
          font-family: inherit;
          font-size: inherit;
          overflow-wrap: anywhere;
          max-width: var(--footer-content-max);
          min-width: 0;
          min-height: var(--footer-reserved-block-size);
          box-sizing: border-box;
          transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        :host([data-theme-dark]) footer {
          background: var(--footer-bg, var(--xtend-layout-surface, var(--xtend-surface, #12161f)));
          border-color: var(--xtend-layout-border-color, rgba(255, 255, 255, 0.18));
        }

        :host([sticky]) {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          box-sizing: border-box;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: var(--footer-logo-size, 40px);
          height: var(--footer-logo-size, 40px);
          overflow: hidden;
          flex-shrink: 0;
          border-radius: var(--footer-logo-radius, var(--xtend-layout-media-radius, 50%));
          background: var(--footer-logo-bg, var(--xtend-layout-media-surface, rgba(15, 23, 42, 0.06)));
        }

        .logo-container img,
        .logo-container ::slotted(*) {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }

        .title {
          font-size: var(--footer-title-font-size, var(--xtend-layout-font-size, 1rem));
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: var(--footer-title-gap, 0.5rem);
          min-width: 0;
          overflow-wrap: anywhere;
        }

        nav {
          display: flex;
          flex-wrap: wrap;
          gap: var(--footer-nav-gap, var(--xtend-layout-gap, 1em));
          min-width: 0;
        }

        .extra {
          flex-grow: 1;
          text-align: right;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        ::slotted(a) {
          color: inherit;
          text-decoration: none;
          padding: var(--footer-link-padding, 0.25em 0.5em);
          border-radius: var(--footer-link-radius, var(--xtend-layout-radius, 0.45rem));
          overflow-wrap: anywhere;
        }

        ::slotted(a:focus-visible) {
          outline: var(--xtend-layout-focus-ring, var(--xtend-focus-ring, 2.5px solid var(--xtend-color-primary, #4fc3f7)));
          outline-offset: 2px;
        }

        @media (max-width: 600px) {
          footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .extra {
            text-align: left;
            width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          footer { transition: none !important; }
        }
        @media (forced-colors: active) {
          footer {
            border: 1px solid CanvasText;
          }
        }
      </style>
      <footer part="root" role="contentinfo" aria-label="Footer">
        <div class="title" part="title">
          <div class="logo-container" part="logo"></div>
          <slot name="title">© 2025 – Dein Unternehmen</slot>
        </div>
        <nav part="nav" role="navigation" aria-label="Footer Navigation">
          <slot name="nav"></slot>
        </nav>
        <div class="extra" part="extra">
          <slot name="extra"></slot>
        </div>
      </footer>
    `;
  }

  renderLogo() {
    const container = this.shadowRoot.querySelector(".logo-container");
    container.innerHTML = "";

    const src = this.getAttribute("src");
    const size = this.getAttribute("logo-size") || "40";

    container.style.width = `${size}px`;
    container.style.height = `${size}px`;

    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Footer Logo";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.onload = () => this.dispatchEvent(new CustomEvent("logo-loaded"));
      img.onerror = () => {
        console.error("Failed to load logo image.");
        container.innerHTML = "<span>Logo</span>";
      };
      container.appendChild(img);
    } else {
      const slot = document.createElement("slot");
      slot.name = "logo";
      container.appendChild(slot);
    }
  }

  applyTheme() {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    this.toggleAttribute("data-theme-dark", theme === "dark");
    this.dispatchEvent(new CustomEvent("theme-applied", { detail: { theme } }));
  }

  observeThemeChanges() {
    this.themeObserver = new MutationObserver(() => this.applyTheme());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }

  applySticky() {
    const isSticky = this.hasAttribute("sticky");
    this.toggleAttribute("data-sticky-enabled", isSticky);
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-footer",
      stateKey: `xfooter-state-${this.id}`,
      schedule: "component.visible.mount",
      src: this.getAttribute("src"),
      logoSize: this.getAttribute("logo-size"),
      sticky: this.hasAttribute("sticky")
    };
  }
}

customElements.define("x-footer", XFooter);
