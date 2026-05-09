import { xstate } from './xstate.js';

// <x-header>
class XHeader extends HTMLElement {
  static get observedAttributes() {
    return ["src", "logo-size", "title", "sticky", "shadow"];
  }
  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-header",
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
      role: "banner",
      accessibleName: "Seitenkopf",
      focusStrategy: "menu-button-and-navigation"
    };
  }
  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-layout",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.layout.measure", "xtend.header.render"],
      idleOrBackgroundAllowed: false
    };
  }
  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-header",
      family: "layout-header",
      role: "banner",
      contentKind: "app-shell-navigation",
      responsiveStrategy: "fixed-slot-grid-search-below-actions-full-width-drawer",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "fixed-overlay-does-not-extend-page",
      slotAlignment: {
        strategy: "fixed-responsive-slot-grid",
        desktop: "brand search actions trigger",
        tablet: "brand actions trigger / search",
        mobile: "brand actions trigger / search",
        customizationTokens: [
          "--header-slot-template-areas",
          "--header-tablet-slot-template-areas",
          "--header-mobile-slot-template-areas",
          "--header-title-grid-area",
          "--header-search-grid-area",
          "--header-actions-grid-area",
          "--header-trigger-grid-area"
        ]
      },
      aspectRatio: "content-driven",
      events: ["header-ready", "header-layout-changed", "menu-opened", "menu-closed"],
      commands: ["render", "measure", "layout", "snapshot", "toggle-menu", "close-menu"],
      stateKey: "xheader-state-<id>",
      schedule: "component.visible.mount",
      slots: ["logo", "title", "search", "actions", "utility", "nav"],
      parts: ["root", "title", "logo", "search", "actions", "utility", "trigger", "drawer", "nav"],
      fabric: { lane: "visible", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._unsubscribeState = null;
    this._drawerTracking = false;
    this._onResize = () => {
      this._syncResponsiveState();
      this._positionDrawer();
    };
    this._onWindowScroll = () => this._positionDrawer();
    this._onDocumentClick = null;
    this._onDocumentKeydown = null;
    this._render();
  }
  connectedCallback() {
    if (!this.id) this.id = `xheader-${Math.random().toString(36).slice(2, 10)}`;
    this._render();
    this._syncResponsiveState();
    window.addEventListener("resize", this._onResize);
    this._syncState(false);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xheader-state-${this.id}` && typeof value === "object") {
        if (typeof value.menuOpen === "boolean") this.toggleMenu(value.menuOpen, { source: "xstate", sync: false });
        if (typeof value.src === "string" && value.src !== this.getAttribute("src")) this.setAttribute("src", value.src);
        if (typeof value.logoSize === "string" && value.logoSize !== this.getAttribute("logo-size")) this.setAttribute("logo-size", value.logoSize);
      }
    });
    this.dispatchEvent(new CustomEvent("header-ready", {
      detail: this.snapshot(),
      bubbles: true,
      composed: true
    }));
  }
  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
    this._unsubscribeState = null;
    window.removeEventListener("resize", this._onResize);
    this._teardownBurgerMenu();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._render();
      this._syncResponsiveState();
      if (this.id) this._syncState(false);
    }
  }
  _render() {
    this._teardownBurgerMenu();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --header-bg: var(--xtend-surface, var(--section-bg, #ffffff));
          --header-fg: var(--xtend-text, var(--text-color, #1f2937));
          --header-title-color: var(--header-fg);
          --header-border: rgba(15, 23, 42, 0.16);
          --header-menu-bg: var(--xtend-surface-raised, var(--section-bg, #ffffff));
          --header-menu-fg: var(--header-fg);
          --header-menu-hover-bg: rgba(14, 78, 129, 0.12);
          --header-menu-active-bg: rgba(14, 78, 129, 0.18);
          --header-menu-active-fg: var(--primary-color, #0e4e81);
          --header-padding: 0.85rem 1rem;
          --header-gap: 0.85rem;
          --header-font-size: 1.05rem;
          --logo-size: 44px;
          --header-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
          --header-radius: 0.85rem;
          --header-blur: 10px;
          --header-drawer-inline-offset: 0.75rem;
          --header-drawer-content-max: none;
          --burger-color: var(--header-fg);
          --focus-color: #4fc3f7;
          --header-slot-template-columns: minmax(12rem, auto) minmax(14rem, 34rem) minmax(0, auto) 44px;
          --header-slot-template-areas: "brand search actions trigger";
          --header-tablet-slot-template-columns: minmax(0, 1fr) auto 44px;
          --header-tablet-slot-template-areas: "brand actions trigger" "search search search";
          --header-mobile-slot-template-columns: minmax(0, 1fr) auto 44px;
          --header-mobile-slot-template-areas: "brand actions trigger" "search search search";
          --header-title-grid-area: brand;
          --header-search-grid-area: search;
          --header-actions-grid-area: actions;
          --header-trigger-grid-area: trigger;
          --header-actions-justify: flex-end;
          --header-actions-wrap: nowrap;
          --header-mobile-actions-justify: flex-end;
          --header-mobile-actions-wrap: nowrap;
          --header-mobile-title-white-space: nowrap;
          display: block;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          color: var(--header-fg);
        }
        header {
          display: grid;
          grid-template-columns: var(--header-slot-template-columns);
          grid-template-areas: var(--header-slot-template-areas);
          align-items: center;
          gap: var(--header-gap);
          padding: var(--header-padding);
          background: var(--header-bg);
          color: var(--header-fg);
          border: 1px solid var(--header-border);
          border-radius: var(--header-radius);
          box-shadow: var(--header-shadow);
          backdrop-filter: blur(var(--header-blur));
          position: relative;
          top: 0;
          z-index: 1000;
          margin: 0.5em 0.5em 1.5em 0.5em;
          box-sizing: border-box;
          transition: box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }
        :host([sticky]) header {
          position: sticky;
        }
        .title {
          grid-area: var(--header-title-grid-area);
          display: flex;
          align-items: center;
          gap: 0.85rem;
          min-width: 0;
          font-size: var(--header-font-size);
          font-weight: 700;
          color: var(--header-title-color);
          letter-spacing: 0;
        }
        .title-text {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          width: var(--logo-size);
          height: var(--logo-size);
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.06);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.10);
        }
        .logo-container img,
        .logo-container ::slotted(*) {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }
        .search {
          grid-area: var(--header-search-grid-area);
          min-width: 0;
          width: 100%;
        }
        .search ::slotted(*) {
          max-width: 100%;
          min-width: 0;
        }
        .actions {
          grid-area: var(--header-actions-grid-area);
          display: flex;
          align-items: center;
          justify-content: var(--header-actions-justify);
          flex-wrap: var(--header-actions-wrap);
          gap: 0.55rem;
          max-width: 100%;
          min-width: 0;
        }
        .actions ::slotted(*) {
          flex: 0 1 auto;
          max-width: 100%;
          min-width: 0;
        }
        .drawer {
          position: fixed;
          left: var(--header-drawer-left, var(--header-drawer-inline-offset));
          right: var(--header-drawer-right, var(--header-drawer-inline-offset));
          top: var(--header-drawer-top, 5rem);
          margin-top: 0;
          height: auto;
          max-height: var(--header-drawer-max-height, min(72dvh, 820px));
          width: auto;
          max-width: none;
          z-index: 1100;
          visibility: hidden;
          pointer-events: none;
          opacity: 0;
          transform: translateY(-10px) scale(0.99);
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
          display: flex;
        }
        .drawer.visible {
          visibility: visible;
          pointer-events: auto;
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .drawer-inner {
          background: var(--header-menu-bg);
          color: var(--header-menu-fg);
          border: 1px solid var(--header-border);
          border-radius: var(--header-radius);
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.20);
          backdrop-filter: blur(var(--header-blur));
          flex-direction: column;
          justify-content: flex-start;
          align-items: stretch;
          width: 100%;
          max-width: var(--header-drawer-content-max);
          margin: 0 auto;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1rem;
          display: flex;
          box-sizing: border-box;
        }
        .burger-menu {
          grid-area: var(--header-trigger-grid-area);
          z-index: 1002;
          background: rgba(15, 23, 42, 0.06);
          border: 1px solid var(--header-border);
          color: var(--burger-color);
          cursor: pointer;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.10);
          transition: background 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
          position: relative;
        }
        .burger-menu:focus-visible {
          outline: 2.5px solid var(--focus-color);
          outline-offset: 2px;
        }
        .burger-menu:hover {
          background: var(--header-menu-hover-bg);
          transform: translateY(-1px);
        }
        .burger-menu span {
          display: block;
          width: 24px;
          height: 3px;
          background-color: var(--burger-color);
          border-radius: 2px;
          position: absolute;
          left: 9px;
          transition: transform 0.22s ease, opacity 0.22s ease;
        }
        .burger-menu span:nth-child(1) { top: 13px; }
        .burger-menu span:nth-child(2) { top: 20px; }
        .burger-menu span:nth-child(3) { top: 27px; }
        .burger-menu.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .burger-menu.open span:nth-child(2) { opacity: 0 !important; }
        .burger-menu.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .drawer-inner ::slotted(a),
        .drawer-inner ::slotted(x-link) {
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          font-size: 1rem;
          color: var(--header-menu-fg);
          text-decoration: none;
          margin: 0.25rem 0;
          padding: 0.7rem 0.85rem;
          display: block;
          border-radius: 0.55rem;
          background: none;
          transition: color 0.16s ease, background 0.16s ease, transform 0.16s ease;
          border: none;
          cursor: pointer;
          overflow-wrap: anywhere;
        }
        .drawer-inner ::slotted(a:hover),
        .drawer-inner ::slotted(x-link:hover),
        .drawer-inner ::slotted(x-link[active]) {
          color: var(--header-menu-active-fg);
          background: var(--header-menu-hover-bg);
        }
        .drawer-inner ::slotted(x-link[active]) {
          font-weight: 700;
        }
        .drawer-inner ::slotted([data-menu-shell]) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-wrap: anywhere;
        }
        @media (max-width: 900px) {
          header {
            grid-template-columns: var(--header-tablet-slot-template-columns);
            grid-template-areas: var(--header-tablet-slot-template-areas);
          }
          .search {
            width: 100%;
          }
        }
        @media (max-width: 620px) {
          header {
            grid-template-columns: var(--header-mobile-slot-template-columns);
            grid-template-areas: var(--header-mobile-slot-template-areas);
            align-items: center;
          }
          .actions {
            justify-content: var(--header-mobile-actions-justify);
            flex-wrap: var(--header-mobile-actions-wrap);
          }
          .title-text {
            white-space: var(--header-mobile-title-white-space);
          }
          :host {
            --header-drawer-inline-offset: 0.5rem;
          }
          .drawer {
            left: var(--header-drawer-left, var(--header-drawer-inline-offset));
            right: var(--header-drawer-right, var(--header-drawer-inline-offset));
            width: auto;
          }
          .drawer-inner {
            border-radius: var(--header-radius);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          header,
          .drawer,
          .burger-menu,
          .burger-menu span,
          .drawer-inner ::slotted(a),
          .drawer-inner ::slotted(x-link) {
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          header, .drawer-inner, .burger-menu {
            background: Canvas;
            color: CanvasText;
            border: 1px solid CanvasText;
            box-shadow: none;
            forced-color-adjust: auto;
          }
          .burger-menu span {
            background: CanvasText;
          }
        }
      </style>
      <header part="root" role="banner" aria-label="Seitenkopf">
        <div class="title" part="title">
          <div class="logo-container" part="logo"></div>
          <span class="title-text"><slot name="title">Seitentitel</slot></span>
        </div>
        <div class="search" part="search">
          <slot name="search"></slot>
        </div>
        <div class="actions" part="actions utility" id="actions-container">
          <slot name="actions"></slot>
          <slot name="utility"></slot>
        </div>
        <button class="burger-menu" part="trigger" aria-label="Menü öffnen/schließen" aria-expanded="false" aria-controls="drawer-menu">
          <span></span><span></span><span></span>
        </button>
        <div class="drawer" part="drawer nav" id="drawer-menu" role="navigation" aria-label="Hauptmenü">
          <div class="drawer-inner" part="drawer-surface nav">
            <slot name="nav"></slot>
          </div>
        </div>
      </header>
    `;
    this.renderLogo();
    this.setupBurgerMenu();
  }
  _syncResponsiveState() {
    const compact = typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width: 620px)").matches
      : false;
    const hadCompact = this.hasAttribute("compact");
    if (compact) this.setAttribute("compact", "");
    else this.removeAttribute("compact");
    if (hadCompact !== compact) {
      this.dispatchEvent(new CustomEvent("header-layout-changed", {
        detail: this.snapshot(),
        bubbles: true,
        composed: true
      }));
      this._syncState(false);
    }
  }
  _syncState(preserveMenuOpen = true) {
    if (!this.id) return;
    xstate.set(`xheader-state-${this.id}`, {
      menuOpen: preserveMenuOpen ? this.isMenuOpen() : false,
      src: this.getAttribute("src"),
      logoSize: this.getAttribute("logo-size"),
      compact: this.hasAttribute("compact"),
      slotModel: "title-search-actions-nav",
      slotAlignment: "fixed-responsive-slot-grid",
      drawerMode: "fixed-full-width-overlay"
    });
  }
  _positionDrawer() {
    if (typeof window === "undefined") return;
    const header = this.shadowRoot.querySelector("header");
    const drawer = this.shadowRoot.querySelector(".drawer");
    if (!header || !drawer) return;
    const rect = header.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const compact = window.matchMedia && window.matchMedia("(max-width: 620px)").matches;
    const inlineOffset = compact ? 8 : 12;
    const rawTop = rect.bottom + 10;
    const top = Math.max(inlineOffset, Math.min(rawTop, Math.max(inlineOffset, viewportHeight - 96)));
    const maxHeight = Math.max(160, viewportHeight - top - inlineOffset);
    drawer.style.setProperty("--header-drawer-left", `${inlineOffset}px`);
    drawer.style.setProperty("--header-drawer-right", `${inlineOffset}px`);
    drawer.style.setProperty("--header-drawer-top", `${top}px`);
    drawer.style.setProperty("--header-drawer-max-height", `${maxHeight}px`);
  }
  _startDrawerTracking() {
    if (this._drawerTracking || typeof window === "undefined") return;
    window.addEventListener("scroll", this._onWindowScroll, true);
    this._drawerTracking = true;
  }
  _stopDrawerTracking() {
    if (!this._drawerTracking || typeof window === "undefined") return;
    window.removeEventListener("scroll", this._onWindowScroll, true);
    this._drawerTracking = false;
  }
  renderLogo() {
    const logoContainer = this.shadowRoot.querySelector(".logo-container");
    logoContainer.innerHTML = "";
    const src = this.getAttribute("src");
    const size = this.getAttribute("logo-size") || "40";
    logoContainer.style.width = size.endsWith("px") ? size : size + "px";
    logoContainer.style.height = size.endsWith("px") ? size : size + "px";
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Logo";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.onload = () => this.dispatchEvent(new CustomEvent("logo-loaded", { bubbles: true, composed: true }));
      img.onerror = () => {
        console.error("Failed to load logo image.");
        logoContainer.innerHTML = "<span>Logo</span>";
      };
      logoContainer.appendChild(img);
    } else {
      const slot = document.createElement("slot");
      slot.name = "logo";
      logoContainer.appendChild(slot);
    }
  }
  _teardownBurgerMenu() {
    this._stopDrawerTracking();
    if (this._onDocumentClick) {
      document.removeEventListener("click", this._onDocumentClick);
      this._onDocumentClick = null;
    }
    if (this._onDocumentKeydown) {
      document.removeEventListener("keydown", this._onDocumentKeydown);
      this._onDocumentKeydown = null;
    }
  }
  setupBurgerMenu() {
    const burgerMenuButton = this.shadowRoot.querySelector(".burger-menu");
    const drawer = this.shadowRoot.querySelector(".drawer");
    if (!this.isConnected || !burgerMenuButton || !drawer) return;
    burgerMenuButton.addEventListener("click", () => {
      this.toggleMenu(!this.isMenuOpen(), { source: "user" });
    });
    this._onDocumentClick = (event) => {
      if (!this.contains(event.target) && this.isMenuOpen()) this.toggleMenu(false, { source: "outside-click" });
    };
    this._onDocumentKeydown = (event) => {
      if (event.key === "Escape" && this.isMenuOpen()) this.toggleMenu(false, { source: "escape" });
    };
    document.addEventListener("click", this._onDocumentClick);
    document.addEventListener("keydown", this._onDocumentKeydown);
    drawer.addEventListener("click", (event) => {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
      const activatesNavigation = path.some((node) => {
        if (!node || !node.tagName) return false;
        const tag = node.tagName.toUpperCase();
        return (tag === "A" && node.hasAttribute("href")) || tag === "X-LINK";
      });
      if (activatesNavigation) this.toggleMenu(false, { source: "navigation" });
    });
  }
  _setMenuOpen(open, options = {}) {
    const burgerMenuButton = this.shadowRoot.querySelector(".burger-menu");
    const drawer = this.shadowRoot.querySelector(".drawer");
    if (!burgerMenuButton || !drawer) return;
    const wasOpen = drawer.classList.contains("visible");
    if (open) {
      this._positionDrawer();
      drawer.classList.add("visible");
      burgerMenuButton.classList.add("open");
      burgerMenuButton.setAttribute("aria-expanded", "true");
      this._startDrawerTracking();
    } else {
      drawer.classList.remove("visible");
      burgerMenuButton.classList.remove("open");
      burgerMenuButton.setAttribute("aria-expanded", "false");
      this._stopDrawerTracking();
    }
    if (options.sync !== false && this.id) this._syncState(open);
    if (wasOpen === Boolean(open)) return;
    this.dispatchEvent(new CustomEvent(open ? "menu-opened" : "menu-closed", {
      detail: {
        ...this.snapshot(),
        source: options.source || "x-header"
      },
      bubbles: true,
      composed: true
    }));
  }
  toggleMenu(open, options = {}) {
    this._setMenuOpen(Boolean(open), options);
  }
  isMenuOpen() {
    const drawer = this.shadowRoot.querySelector(".drawer");
    return Boolean(drawer && drawer.classList.contains("visible"));
  }
  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-header",
      stateKey: `xheader-state-${this.id}`,
      schedule: "component.visible.mount",
      menuOpen: this.isMenuOpen(),
      src: this.getAttribute("src"),
      logoSize: this.getAttribute("logo-size"),
      compact: this.hasAttribute("compact"),
      slotModel: "title-search-actions-nav",
      slotAlignment: "fixed-responsive-slot-grid",
      drawerMode: "fixed-full-width-overlay"
    };
  }
}
customElements.define("x-header", XHeader);
// TypeScript: Typdefinitionen vorbereiten (z. B. xheader.d.ts)
