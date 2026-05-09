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

    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xfooter-${Math.random().toString(36).slice(2, 10)}`;

    // Initialen State setzen
    xstate.set(`xfooter-state-${this.id}`, {
      src: this.getAttribute("src"),
      logoSize: this.getAttribute("logo-size"),
      sticky: this.hasAttribute("sticky")
    });

    // State-Änderungen abonnieren (z.B. externes Setzen von src, logoSize, sticky)
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
      // State aktualisieren
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
        }

        footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: var(--footer-padding, 1rem);
          background-color: var(--footer-bg, #333);
          color: var(--footer-fg, white);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        :host([sticky]) {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 100;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: var(--footer-logo-size, 40px);
          height: var(--footer-logo-size, 40px);
          overflow: hidden;
          flex-shrink: 0;
        }

        .logo-container img,
        .logo-container ::slotted(*) {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }

        .title {
          font-size: var(--footer-font-size, 1rem);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        nav {
          display: flex;
          flex-wrap: wrap;
          gap: 1em;
        }

        .extra {
          flex-grow: 1;
          text-align: right;
        }

        ::slotted(a) {
          color: inherit;
          text-decoration: none;
          padding: 0.25em 0.5em;
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
    const theme = document.documentElement.getAttribute("data-theme");
    const isDark = theme === "dark";

    const variables = isDark
      ? {
          "--footer-bg": "#121212",
          "--footer-fg": "#f0f0f0"
        }
      : {
          "--footer-bg": "#f5f5f5",
          "--footer-fg": "#222222"
        };

    for (const key in variables) {
      this.style.setProperty(key, variables[key]);
    }

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
