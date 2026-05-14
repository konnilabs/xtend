import { xstate } from './xstate.js';

const XHEADER_MENU_MODES = Object.freeze(['drawer', 'side-panel', 'popover', 'fullscreen', 'inline-main']);
const XHEADER_MENU_PLACEMENTS = Object.freeze(['start', 'end', 'top', 'bottom']);
const XHEADER_MENU_ALIGNS = Object.freeze(['start', 'center', 'end', 'stretch']);
const XHEADER_MENU_BREAKPOINTS = Object.freeze({
  sm: '480px',
  md: '620px',
  lg: '900px',
  xl: '1200px'
});
const XHEADER_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'x-link'
].join(',');

function normalizeAttribute(value, allowedValues, fallback) {
  const normalized = String(value || '').trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function readBooleanAttribute(element, name, fallback = false) {
  if (!element.hasAttribute(name)) return fallback;
  const value = String(element.getAttribute(name) || '').trim().toLowerCase();
  return value === '' || !['false', '0', 'off', 'no'].includes(value);
}

// <x-header>
class XHeader extends HTMLElement {
  static get observedAttributes() {
    return [
      "src",
      "logo-size",
      "title",
      "sticky",
      "shadow",
      "menu-mode",
      "menu-placement",
      "menu-modal",
      "menu-open",
      "menu-breakpoint",
      "menu-width",
      "menu-max-height",
      "menu-align"
    ];
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
      responsiveStrategy: "fixed-slot-grid-search-below-actions-menu-presentation-modes",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "mode-aware-overlay-or-inline-flow",
      menuModes: XHEADER_MENU_MODES.slice(),
      menuPlacements: XHEADER_MENU_PLACEMENTS.slice(),
      menuPresentation: {
        defaultMode: "drawer",
        legacyDrawerAlias: "fixed-full-width-overlay",
        modes: XHEADER_MENU_MODES.slice()
      },
      signatureDesign: {
        note: "Enterprise app-shell header with precise slot rhythm, calm navigation surfaces and tokenized premium defaults.",
        tokenStrategy: "layout tokens feed header, menu, logo, focus and elevation aliases before component-specific overrides.",
        themeExpectation: "third-party themes can replace surface, text, spacing, radius, typography and elevation without changing markup."
      },
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
      events: ["header-ready", "header-layout-changed", "menu-opened", "menu-closed", "menu-mode-changed", "menu-placement-changed", "menu-before-open", "menu-before-close"],
      commands: ["render", "measure", "layout", "snapshot", "toggle-menu", "close-menu", "set-menu-mode"],
      stateKey: "xheader-state-<id>",
      schedule: "component.visible.mount",
      slots: ["logo", "title", "search", "actions", "utility", "nav"],
      parts: ["root", "brand", "title", "logo", "search", "actions", "utility", "trigger", "trigger-icon", "menu", "menu-surface", "menu-content", "drawer", "drawer-surface", "nav", "backdrop"],
      fabric: { lane: "visible", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }
  static get xtendNavigationRoutingUxProfile() {
    return {
      schema: "xtend.component.navigation-routing-ux-profile.v1",
      componentRef: "x-header",
      family: "app-shell-navigation",
      role: "banner-navigation",
      navigationMode: "menu-mode-aware-shell-navigation",
      activeState: "slotted-nav-aria-current-and-active-attribute",
      focusRestore: "menu-trigger-and-overlay-focus-return",
      routeAnnouncement: "delegated-to-x-router",
      keyboardNavigation: "tab-escape-focus-trap-when-modal",
      events: ["menu-before-open", "menu-before-close", "menu-opened", "menu-closed", "menu-mode-changed", "menu-placement-changed"],
      commands: ["toggle-menu", "close-menu", "set-menu-mode", "snapshot"],
      stateKey: "xheader-state-<id>",
      schedule: "ui.user-blocking.navigation",
      stateSemantics: {
        states: ["active", "current", "selected", "hover", "focus", "disabled"],
        current: "aria-current=page",
        selected: "aria-selected=true-supported-for-slotted-navigation",
        disabled: "disabled-or-aria-disabled"
      },
      disclosureControls: {
        nestedMenus: "icon-controls-only",
        managedPart: "trigger-icon control icon",
        slottedDisclosurePart: "disclosure-icon control icon"
      },
      signatureDesign: {
        note: "Enterprise app-shell navigation with precise slot rhythm, visible current route state and premium menu surfaces.",
        tokenStrategy: "shared --xtend-nav-* tokens feed header nav/menu aliases before component-specific overrides.",
        themeExpectation: "third-party themes can replace nav active, hover, focus, disabled, typography, radius, surface and indicators from CSS."
      },
      themeTokens: [
        "--xtend-nav-surface",
        "--xtend-nav-text",
        "--xtend-nav-border-color",
        "--xtend-nav-radius",
        "--xtend-nav-gap",
        "--xtend-nav-font-family",
        "--xtend-nav-font-size",
        "--xtend-nav-active-surface",
        "--xtend-nav-active-text",
        "--xtend-nav-current-indicator",
        "--xtend-nav-hover-surface",
        "--xtend-nav-focus-ring",
        "--xtend-nav-disabled-opacity"
      ],
      overflowPolicy: "slotted-nav-long-labels-wrap-with-overflow-wrap-anywhere",
      fabric: { lane: "user-blocking", routeLane: "transition", diagnosticsLane: "diagnostics" },
      rmt: XHeader.xtendRmtMetadata
    };
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._unsubscribeState = null;
    this._drawerTracking = false;
    this._suppressMenuOpenAttribute = false;
    this._lastFocusedElement = null;
    this._onResize = () => {
      this._syncResponsiveState();
      this._positionMenu();
    };
    this._onWindowScroll = () => this._positionMenu();
    this._onDocumentClick = null;
    this._onDocumentKeydown = null;
    this._render();
  }
  connectedCallback() {
    if (!this.id) this.id = `xheader-${Math.random().toString(36).slice(2, 10)}`;
    this._render();
    this._syncResponsiveState();
    window.addEventListener("resize", this._onResize);
    this._syncState(true);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xheader-state-${this.id}` && typeof value === "object") {
        if (typeof value.menuOpen === "boolean") this.toggleMenu(value.menuOpen, { source: "xstate", sync: false });
        if (typeof value.menuMode === "string" && value.menuMode !== this.getAttribute("menu-mode")) this.setAttribute("menu-mode", value.menuMode);
        if (typeof value.menuPlacement === "string" && value.menuPlacement !== this.getAttribute("menu-placement")) this.setAttribute("menu-placement", value.menuPlacement);
        if (typeof value.menuModal === "boolean") {
          if (value.menuModal) this.setAttribute("menu-modal", "");
          else this.setAttribute("menu-modal", "false");
        }
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
    this._applyMenuModality(false);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name.startsWith("menu-")) {
        if (name === "menu-open") {
          if (!this._suppressMenuOpenAttribute) this._syncMenuPresentation({ source: "attribute" });
          if (this.id) this._syncState(true);
          return;
        }
        this._syncResponsiveState();
        this._syncMenuPresentation({ source: "attribute" });
        if (name === "menu-mode") this._emitMenuConfigurationChange("menu-mode-changed", oldValue, newValue);
        if (name === "menu-placement") this._emitMenuConfigurationChange("menu-placement-changed", oldValue, newValue);
        if (this.id) this._syncState(true);
        return;
      }
      this._render();
      this._syncResponsiveState();
      if (this.id) this._syncState(true);
    }
  }
  _render() {
    this._teardownBurgerMenu();
    const menuOpen = this.isMenuOpen();
    const menuMode = this._getMenuMode();
    const menuPlacement = this._getMenuPlacement();
    const menuModal = this._getMenuModal();
    const menuAlign = this._getMenuAlign();
    const menuRole = menuModal ? "dialog" : "navigation";
    const menuAriaModal = menuModal ? ' aria-modal="true"' : "";
    const menuInert = menuOpen ? "" : " inert";
    const menuHidden = menuOpen ? "false" : "true";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xtend-header-surface: var(--xtend-layout-surface, var(--xtend-signature-surface-panel, var(--xtend-surface, var(--section-bg, #ffffff))));
          --xtend-header-text: var(--xtend-layout-text, var(--xtend-signature-ink, var(--xtend-text, var(--text-color, #1f2937))));
          --xtend-header-border-color: var(--xtend-layout-border-color, var(--xtend-signature-edge-subtle, rgba(15, 23, 42, 0.16)));
          --xtend-header-border-width: var(--xtend-border-width, 1px);
          --xtend-header-radius: var(--xtend-layout-radius, var(--xtend-radius-panel, var(--xtend-radius-md, var(--xtend-radius, 0.85rem))));
          --xtend-header-elevation: var(--xtend-layout-elevation, var(--xtend-signature-shadow-control, var(--xtend-shadow, 0 10px 28px rgba(15, 23, 42, 0.12))));
          --xtend-header-padding-block: var(--xtend-layout-spacing-block, var(--xtend-layout-spacing, 0.85rem));
          --xtend-header-padding-inline: var(--xtend-layout-spacing-inline, var(--xtend-layout-spacing, 1rem));
          --xtend-header-gap: var(--xtend-layout-gap, var(--xtend-density-spacing, 0.85rem));
          --xtend-header-font-family: var(--xtend-layout-font-family, var(--xtend-font-family-body, 'Inter', 'Segoe UI', Arial, sans-serif));
          --xtend-header-font-size: var(--xtend-layout-font-size, var(--xtend-font-size-heading-sm, 1.05rem));
          --xtend-header-font-weight: var(--xtend-font-weight-heading, 700);
          --xtend-header-focus-ring: var(--xtend-layout-focus-ring, var(--xtend-focus-ring, 2.5px solid var(--xtend-color-primary, #4fc3f7)));
          --xtend-header-logo-size: 44px;
          --xtend-header-logo-radius: var(--xtend-layout-media-radius, 50%);
          --xtend-header-logo-surface: var(--xtend-signature-surface-inset, rgba(15, 23, 42, 0.06));
          --xtend-header-logo-elevation: var(--xtend-signature-shadow-control, 0 2px 8px rgba(15, 23, 42, 0.10));
          --xtend-header-trigger-size: var(--xtend-control-height, 44px);
          --xtend-header-trigger-radius: var(--xtend-header-control-radius, 999px);
          --xtend-header-trigger-surface: var(--xtend-signature-surface-inset, rgba(15, 23, 42, 0.06));
          --xtend-header-trigger-hover-surface: var(--xtend-signature-accent-soft, rgba(14, 78, 129, 0.12));
          --xtend-header-trigger-icon-size: 24px;
          --xtend-header-trigger-icon-stroke: 3px;
          --xtend-header-trigger-line-offset: 7px;
          --xtend-header-menu-surface: var(--xtend-signature-surface-raised, var(--xtend-surface-raised, var(--section-bg, #ffffff)));
          --xtend-header-menu-text: var(--xtend-header-text);
          --xtend-header-menu-border-color: var(--xtend-header-border-color);
          --xtend-header-menu-radius: var(--xtend-header-radius);
          --xtend-header-menu-hover-surface: var(--xtend-signature-accent-soft, rgba(14, 78, 129, 0.12));
          --xtend-header-menu-active-surface: var(--xtend-signature-accent-soft, rgba(14, 78, 129, 0.18));
          --xtend-header-menu-active-text: var(--xtend-signature-accent, var(--primary-color, #0e4e81));
          --xtend-nav-surface: var(--xtend-header-menu-surface);
          --xtend-nav-text: var(--xtend-header-menu-text);
          --xtend-nav-border-color: var(--xtend-header-menu-border-color);
          --xtend-nav-radius: var(--xtend-header-menu-radius);
          --xtend-nav-gap: var(--xtend-header-menu-gap);
          --xtend-nav-font-family: var(--xtend-header-font-family);
          --xtend-nav-font-size: var(--xtend-header-font-size);
          --xtend-nav-active-surface: var(--xtend-header-menu-active-surface);
          --xtend-nav-active-text: var(--xtend-header-menu-active-text);
          --xtend-nav-current-indicator: var(--xtend-signature-accent, var(--primary-color, Highlight));
          --xtend-nav-hover-surface: var(--xtend-header-menu-hover-surface);
          --xtend-nav-focus-ring: var(--xtend-header-focus-ring);
          --xtend-nav-disabled-opacity: var(--xtend-disabled-opacity, 0.48);
          --xtend-header-menu-current-indicator: var(--xtend-nav-current-indicator);
          --xtend-header-menu-disabled-opacity: var(--xtend-nav-disabled-opacity);
          --xtend-header-menu-elevation: var(--xtend-signature-shadow-panel, 0 18px 48px rgba(15, 23, 42, 0.20));
          --xtend-header-menu-padding: var(--xtend-density-spacing, 1rem);
          --xtend-header-menu-gap: 0.35rem;
          --xtend-header-menu-width: var(--xtend-layout-content-max, min(28rem, calc(100vw - 1.5rem)));
          --xtend-header-menu-max-width: calc(100vw - 1.5rem);
          --xtend-header-menu-max-height: min(72dvh, 820px);
          --xtend-header-menu-backdrop: var(--xtend-overlay-bg, rgba(15, 23, 42, 0.45));
          --xtend-header-menu-item-padding: 0.7rem 0.85rem;
          --xtend-header-menu-item-radius: var(--xtend-radius-sm, 0.55rem);
          --xtend-header-z-index: 1000;
          --xtend-header-menu-z-index: 1100;
          --xtend-header-motion-duration: var(--xtend-motion-duration-fast, 0.18s);
          --xtend-header-motion-easing: var(--xtend-motion-easing-standard, ease);
          --header-bg: var(--xtend-header-surface);
          --header-fg: var(--xtend-header-text);
          --header-title-color: var(--header-fg);
          --header-border: var(--xtend-header-border-color);
          --header-menu-bg: var(--xtend-header-menu-surface);
          --header-menu-fg: var(--xtend-header-menu-text);
          --header-menu-hover-bg: var(--xtend-header-menu-hover-surface);
          --header-menu-active-bg: var(--xtend-header-menu-active-surface);
          --header-menu-active-fg: var(--xtend-header-menu-active-text);
          --header-padding: var(--xtend-header-padding-block) var(--xtend-header-padding-inline);
          --header-gap: var(--xtend-header-gap);
          --header-font-size: var(--xtend-header-font-size);
          --logo-size: var(--xtend-header-logo-size);
          --header-shadow: var(--xtend-header-elevation);
          --header-radius: var(--xtend-header-radius);
          --header-blur: 10px;
          --header-drawer-inline-offset: 0.75rem;
          --header-drawer-content-max: none;
          --header-menu-width: var(--xtend-header-menu-width);
          --header-menu-max-height: var(--xtend-header-menu-max-height);
          --header-menu-backdrop: var(--xtend-header-menu-backdrop);
          --burger-color: var(--header-fg);
          --focus-color: var(--xtend-color-primary, #4fc3f7);
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
          --xtend-layout-grid-min: minmax(0, 1fr);
          display: block;
          font-family: var(--xtend-header-font-family);
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
          border: var(--xtend-header-border-width) solid var(--header-border);
          border-radius: var(--header-radius);
          box-shadow: var(--header-shadow);
          backdrop-filter: blur(var(--header-blur));
          position: relative;
          top: 0;
          z-index: var(--xtend-header-z-index);
          margin: 0.5em 0.5em 1.5em 0.5em;
          box-sizing: border-box;
          transition: box-shadow var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), background var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), border-color var(--xtend-header-motion-duration) var(--xtend-header-motion-easing);
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
          font-weight: var(--xtend-header-font-weight);
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
          border-radius: var(--xtend-header-logo-radius);
          background: var(--xtend-header-logo-surface);
          box-shadow: var(--xtend-header-logo-elevation);
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
        .backdrop {
          position: fixed;
          inset: 0;
          z-index: calc(var(--xtend-header-menu-z-index) - 1);
          background: var(--header-menu-backdrop);
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), visibility var(--xtend-header-motion-duration) var(--xtend-header-motion-easing);
          visibility: hidden;
        }
        .backdrop.visible {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        }
        .drawer {
          position: fixed;
          left: var(--header-menu-left, var(--header-drawer-left, var(--header-drawer-inline-offset)));
          right: var(--header-menu-right, var(--header-drawer-right, var(--header-drawer-inline-offset)));
          top: var(--header-menu-top, var(--header-drawer-top, 5rem));
          bottom: var(--header-menu-bottom, auto);
          margin: 0;
          height: auto;
          max-height: var(--header-drawer-max-height, var(--header-menu-max-height));
          width: auto;
          max-width: var(--xtend-header-menu-max-width);
          z-index: var(--xtend-header-menu-z-index);
          visibility: hidden;
          pointer-events: none;
          opacity: 0;
          transform: translateY(-10px) scale(0.99);
          transition: opacity var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), transform var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), visibility var(--xtend-header-motion-duration) var(--xtend-header-motion-easing);
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
          border: var(--xtend-header-border-width) solid var(--xtend-header-menu-border-color);
          border-radius: var(--xtend-header-menu-radius);
          box-shadow: var(--xtend-header-menu-elevation);
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
          padding: var(--xtend-header-menu-padding);
          gap: var(--xtend-header-menu-gap);
          display: flex;
          box-sizing: border-box;
        }
        :host([menu-align="start"]) .drawer-inner {
          align-items: flex-start;
        }
        :host([menu-align="center"]) .drawer-inner {
          align-items: center;
        }
        :host([menu-align="end"]) .drawer-inner {
          align-items: flex-end;
        }
        :host([menu-align="stretch"]) .drawer-inner,
        :host(:not([menu-align])) .drawer-inner {
          align-items: stretch;
        }
        :host([menu-mode="side-panel"]) .drawer {
          width: var(--header-menu-width);
          max-height: none;
          height: auto;
          transform: translateX(0) scale(1);
        }
        :host([menu-mode="side-panel"][menu-placement="start"]) .drawer {
          right: auto;
        }
        :host([menu-mode="side-panel"][menu-placement="end"]) .drawer {
          left: auto;
        }
        :host([menu-mode="side-panel"][menu-placement="top"]) .drawer,
        :host([menu-mode="side-panel"][menu-placement="bottom"]) .drawer {
          left: var(--header-drawer-inline-offset);
          right: var(--header-drawer-inline-offset);
          width: auto;
        }
        :host([menu-mode="popover"]) .drawer {
          width: var(--header-menu-width);
        }
        :host([menu-mode="fullscreen"]) .drawer {
          inset: 0;
          width: auto;
          max-width: none;
          max-height: none;
          transform: translateY(0) scale(1);
        }
        :host([menu-mode="fullscreen"]) .drawer-inner {
          border-radius: 0;
          width: 100%;
        }
        :host([menu-mode="inline-main"]) .drawer {
          position: static;
          inset: auto;
          width: 100%;
          max-width: none;
          max-height: none;
          transform: none;
          display: none;
          margin-block-start: var(--header-gap);
          grid-column: 1 / -1;
          grid-row: auto;
        }
        :host([menu-mode="inline-main"]) .drawer.visible {
          display: flex;
        }
        :host([menu-mode="inline-main"]) .drawer-inner {
          box-shadow: none;
        }
        .menu-content {
          display: flex;
          flex-direction: column;
          gap: var(--xtend-header-menu-gap);
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .burger-menu {
          grid-area: var(--header-trigger-grid-area);
          z-index: 1002;
          background: var(--xtend-header-trigger-surface);
          border: 1px solid var(--header-border);
          color: var(--burger-color);
          cursor: pointer;
          width: var(--xtend-header-trigger-size);
          height: var(--xtend-header-trigger-size);
          border-radius: var(--xtend-header-trigger-radius);
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: var(--xtend-signature-shadow-control, 0 2px 8px rgba(15, 23, 42, 0.10));
          transition: background var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), transform var(--xtend-header-motion-duration) var(--xtend-header-motion-easing), border-color var(--xtend-header-motion-duration) var(--xtend-header-motion-easing);
          position: relative;
        }
        .burger-menu:focus-visible {
          outline: var(--xtend-header-focus-ring);
          outline-offset: 2px;
        }
        .burger-menu:hover {
          background: var(--header-menu-hover-bg);
          transform: translateY(-1px);
        }
        .burger-menu span {
          display: block;
          width: var(--xtend-header-trigger-icon-size);
          height: var(--xtend-header-trigger-icon-stroke);
          background-color: var(--burger-color);
          border-radius: 2px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          transform-origin: center;
          transition: transform 0.22s ease, opacity 0.22s ease;
        }
        .burger-menu span:nth-child(1) { transform: translate(-50%, calc(-50% - var(--xtend-header-trigger-line-offset))); }
        .burger-menu span:nth-child(2) { transform: translate(-50%, -50%); }
        .burger-menu span:nth-child(3) { transform: translate(-50%, calc(-50% + var(--xtend-header-trigger-line-offset))); }
        .burger-menu.open span:nth-child(1) { transform: translate(-50%, -50%) rotate(45deg); }
        .burger-menu.open span:nth-child(2) { opacity: 0 !important; }
        .burger-menu.open span:nth-child(3) { transform: translate(-50%, -50%) rotate(-45deg); }
        .drawer-inner ::slotted(a),
        .drawer-inner ::slotted(button),
        .drawer-inner ::slotted([role="menuitem"]),
        .drawer-inner ::slotted(x-link) {
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          font-family: var(--xtend-nav-font-family);
          font-size: var(--xtend-nav-font-size);
          color: var(--header-menu-fg);
          text-decoration: none;
          margin: 0.25rem 0;
          padding: var(--xtend-header-menu-item-padding);
          display: block;
          border-radius: var(--xtend-header-menu-item-radius);
          background: none;
          transition: color 0.16s ease, background 0.16s ease, transform 0.16s ease;
          border: none;
          cursor: pointer;
          overflow-wrap: anywhere;
        }
        .drawer-inner ::slotted(a:hover),
        .drawer-inner ::slotted(button:hover),
        .drawer-inner ::slotted([role="menuitem"]:hover),
        .drawer-inner ::slotted(x-link:hover),
        .drawer-inner ::slotted(a[aria-current="page"]),
        .drawer-inner ::slotted(button[aria-current="page"]),
        .drawer-inner ::slotted([role="menuitem"][aria-current="page"]),
        .drawer-inner ::slotted(x-link[aria-current="page"]),
        .drawer-inner ::slotted(a[aria-selected="true"]),
        .drawer-inner ::slotted(button[aria-selected="true"]),
        .drawer-inner ::slotted([role="menuitem"][aria-selected="true"]),
        .drawer-inner ::slotted(x-link[aria-selected="true"]),
        .drawer-inner ::slotted(a[active]),
        .drawer-inner ::slotted(button[active]),
        .drawer-inner ::slotted([role="menuitem"][active]),
        .drawer-inner ::slotted(x-link[active]) {
          color: var(--header-menu-active-fg);
          background: var(--header-menu-hover-bg);
        }
        .drawer-inner ::slotted(a[aria-current="page"]),
        .drawer-inner ::slotted(button[aria-current="page"]),
        .drawer-inner ::slotted([role="menuitem"][aria-current="page"]),
        .drawer-inner ::slotted(x-link[aria-current="page"]),
        .drawer-inner ::slotted(a[aria-selected="true"]),
        .drawer-inner ::slotted(button[aria-selected="true"]),
        .drawer-inner ::slotted([role="menuitem"][aria-selected="true"]),
        .drawer-inner ::slotted(x-link[aria-selected="true"]),
        .drawer-inner ::slotted(a[active]),
        .drawer-inner ::slotted(button[active]),
        .drawer-inner ::slotted([role="menuitem"][active]),
        .drawer-inner ::slotted(x-link[active]) {
          background: var(--xtend-nav-active-surface);
          color: var(--xtend-nav-active-text);
          font-weight: 700;
          box-shadow: inset 4px 0 0 var(--xtend-header-menu-current-indicator);
        }
        .drawer-inner ::slotted(a:focus-visible),
        .drawer-inner ::slotted(button:focus-visible),
        .drawer-inner ::slotted([role="menuitem"]:focus-visible),
        .drawer-inner ::slotted(x-link:focus-visible) {
          outline: var(--xtend-nav-focus-ring);
          outline-offset: 2px;
        }
        .drawer-inner ::slotted(a[aria-disabled="true"]),
        .drawer-inner ::slotted(button:disabled),
        .drawer-inner ::slotted(button[aria-disabled="true"]),
        .drawer-inner ::slotted([role="menuitem"][aria-disabled="true"]),
        .drawer-inner ::slotted(x-link[disabled]),
        .drawer-inner ::slotted(x-link[aria-disabled="true"]) {
          opacity: var(--xtend-header-menu-disabled-opacity);
          cursor: not-allowed;
        }
        .drawer-inner ::slotted([data-menu-shell]) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          display: block;
          isolation: isolate;
          overflow: visible;
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
            left: var(--header-menu-left, var(--header-drawer-left, var(--header-drawer-inline-offset)));
            right: var(--header-menu-right, var(--header-drawer-right, var(--header-drawer-inline-offset)));
            width: auto;
          }
          .drawer-inner {
            border-radius: var(--header-radius);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          header,
          .backdrop,
          .drawer,
          .burger-menu,
          .burger-menu span,
          .drawer-inner ::slotted(a),
          .drawer-inner ::slotted(button),
          .drawer-inner ::slotted([role="menuitem"]),
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
          .backdrop {
            background: Canvas;
            opacity: 0.72;
          }
          .burger-menu span {
            background: CanvasText;
          }
          .drawer-inner ::slotted(a[aria-current="page"]),
          .drawer-inner ::slotted(button[aria-current="page"]),
          .drawer-inner ::slotted([role="menuitem"][aria-current="page"]),
          .drawer-inner ::slotted(x-link[aria-current="page"]),
          .drawer-inner ::slotted(a[aria-selected="true"]),
          .drawer-inner ::slotted(button[aria-selected="true"]),
          .drawer-inner ::slotted([role="menuitem"][aria-selected="true"]),
          .drawer-inner ::slotted(x-link[aria-selected="true"]) {
            background: Highlight;
            color: HighlightText;
            box-shadow: inset 4px 0 0 CanvasText;
          }
        }
      </style>
      <header part="root" role="banner" aria-label="Seitenkopf" data-menu-mode="${menuMode}" data-menu-placement="${menuPlacement}" data-menu-align="${menuAlign}">
        <div class="title" part="brand title">
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
        <button class="burger-menu${menuOpen ? " open" : ""}" part="trigger control" aria-label="Menü öffnen/schließen" aria-expanded="${menuOpen ? "true" : "false"}" aria-controls="drawer-menu" aria-haspopup="${menuModal ? "dialog" : "true"}">
          <span part="trigger-icon control icon"></span><span part="trigger-icon control icon"></span><span part="trigger-icon control icon"></span>
        </button>
        <div class="backdrop${menuOpen && menuModal ? " visible" : ""}" part="backdrop" ${menuOpen && menuModal ? "" : "hidden"}></div>
        <div class="drawer menu${menuOpen ? " visible" : ""}" part="menu drawer nav" id="drawer-menu" role="${menuRole}" aria-label="Hauptmenü"${menuAriaModal} aria-hidden="${menuHidden}" tabindex="-1"${menuInert} data-menu-mode="${menuMode}" data-menu-placement="${menuPlacement}">
          <div class="drawer-inner" part="menu-surface drawer-surface nav">
            <div class="menu-content" part="menu-content nav">
            <slot name="nav"></slot>
            </div>
          </div>
        </div>
      </header>
    `;
    this.renderLogo();
    this._syncMenuPresentation({ source: "render" });
    this.setupBurgerMenu();
  }
  _getMenuMode() {
    return normalizeAttribute(this.getAttribute("menu-mode"), XHEADER_MENU_MODES, "drawer");
  }
  _getMenuPlacement() {
    return normalizeAttribute(this.getAttribute("menu-placement"), XHEADER_MENU_PLACEMENTS, "end");
  }
  _getMenuAlign() {
    return normalizeAttribute(this.getAttribute("menu-align"), XHEADER_MENU_ALIGNS, "stretch");
  }
  _getMenuBreakpoint() {
    const value = String(this.getAttribute("menu-breakpoint") || "md").trim();
    return value || "md";
  }
  _resolveMenuBreakpoint() {
    const value = this._getMenuBreakpoint();
    return XHEADER_MENU_BREAKPOINTS[value] || value;
  }
  _getMenuModal() {
    const mode = this._getMenuMode();
    const fallback = mode === "fullscreen";
    return readBooleanAttribute(this, "menu-modal", fallback);
  }
  _getMenuWidth() {
    return this.getAttribute("menu-width") || null;
  }
  _getMenuMaxHeight() {
    return this.getAttribute("menu-max-height") || null;
  }
  _isOverlayMenuMode() {
    return this._getMenuMode() !== "inline-main";
  }
  _shouldShowBackdrop() {
    return this.isMenuOpen() && this._getMenuModal();
  }
  _syncMenuAttributeStyles() {
    const width = this._getMenuWidth();
    const maxHeight = this._getMenuMaxHeight();
    if (width) this.style.setProperty("--xtend-header-menu-width", width);
    else this.style.removeProperty("--xtend-header-menu-width");
    if (maxHeight) this.style.setProperty("--xtend-header-menu-max-height", maxHeight);
    else this.style.removeProperty("--xtend-header-menu-max-height");
    this.style.setProperty("--xtend-header-menu-breakpoint", this._resolveMenuBreakpoint());
  }
  _syncResponsiveState() {
    const compact = typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(`(max-width: ${this._resolveMenuBreakpoint()})`).matches
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
      this._syncState(true);
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
      menuMode: this._getMenuMode(),
      menuPlacement: this._getMenuPlacement(),
      menuModal: this._getMenuModal(),
      menuBreakpoint: this._getMenuBreakpoint(),
      menuWidth: this._getMenuWidth(),
      menuMaxHeight: this._getMenuMaxHeight(),
      menuAlign: this._getMenuAlign(),
      drawerMode: "fixed-full-width-overlay"
    });
  }
  _positionMenu() {
    if (typeof window === "undefined") return;
    const header = this.shadowRoot.querySelector("header");
    const drawer = this.shadowRoot.querySelector(".drawer");
    const trigger = this.shadowRoot.querySelector(".burger-menu");
    if (!header || !drawer) return;
    this._syncMenuAttributeStyles();
    [
      "--header-menu-left",
      "--header-menu-right",
      "--header-menu-top",
      "--header-menu-bottom",
      "--header-drawer-left",
      "--header-drawer-right",
      "--header-drawer-top",
      "--header-drawer-max-height"
    ].forEach((name) => drawer.style.removeProperty(name));
    const mode = this._getMenuMode();
    const placement = this._getMenuPlacement();
    if (mode === "inline-main") return;
    if (mode === "fullscreen") {
      drawer.style.setProperty("--header-menu-left", "0");
      drawer.style.setProperty("--header-menu-right", "0");
      drawer.style.setProperty("--header-menu-top", "0");
      drawer.style.setProperty("--header-menu-bottom", "0");
      drawer.style.setProperty("--header-drawer-max-height", "100dvh");
      return;
    }
    const rect = header.getBoundingClientRect();
    const triggerRect = trigger ? trigger.getBoundingClientRect() : rect;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const compact = window.matchMedia && window.matchMedia(`(max-width: ${this._resolveMenuBreakpoint()})`).matches;
    const inlineOffset = compact ? 8 : 12;
    const rawTop = rect.bottom + 10;
    const top = Math.max(inlineOffset, Math.min(rawTop, Math.max(inlineOffset, viewportHeight - 96)));
    const maxHeight = Math.max(160, viewportHeight - top - inlineOffset);
    if (mode === "side-panel") {
      const bottom = inlineOffset;
      drawer.style.setProperty("--header-menu-top", placement === "bottom" ? "auto" : `${top}px`);
      drawer.style.setProperty("--header-menu-bottom", placement === "top" ? "auto" : `${bottom}px`);
      drawer.style.setProperty("--header-drawer-max-height", `${Math.max(220, viewportHeight - top - bottom)}px`);
      if (placement === "top" || placement === "bottom") {
        drawer.style.setProperty("--header-menu-left", `${inlineOffset}px`);
        drawer.style.setProperty("--header-menu-right", `${inlineOffset}px`);
      } else if (placement === "start" || !placement) {
        drawer.style.setProperty("--header-menu-left", `${inlineOffset}px`);
        drawer.style.setProperty("--header-menu-right", "auto");
      } else {
        drawer.style.setProperty("--header-menu-left", "auto");
        drawer.style.setProperty("--header-menu-right", `${inlineOffset}px`);
      }
      return;
    }
    if (mode === "popover") {
      const popoverTop = placement === "top" ? Math.max(inlineOffset, rect.top - 12) : top;
      drawer.style.setProperty("--header-menu-top", `${popoverTop}px`);
      drawer.style.setProperty("--header-drawer-max-height", `${maxHeight}px`);
      if (placement === "start") {
        drawer.style.setProperty("--header-menu-left", `${Math.max(inlineOffset, triggerRect.left)}px`);
        drawer.style.setProperty("--header-menu-right", "auto");
      } else if (placement === "center") {
        drawer.style.setProperty("--header-menu-left", `${Math.max(inlineOffset, triggerRect.left - 120)}px`);
        drawer.style.setProperty("--header-menu-right", "auto");
      } else {
        drawer.style.setProperty("--header-menu-left", "auto");
        drawer.style.setProperty("--header-menu-right", `${Math.max(inlineOffset, viewportWidth - triggerRect.right)}px`);
      }
      return;
    }
    drawer.style.setProperty("--header-drawer-left", `${inlineOffset}px`);
    drawer.style.setProperty("--header-drawer-right", `${inlineOffset}px`);
    drawer.style.setProperty("--header-drawer-top", `${top}px`);
    drawer.style.setProperty("--header-drawer-max-height", `${maxHeight}px`);
  }
  _positionDrawer() {
    this._positionMenu();
  }
  _syncMenuA11y() {
    const menu = this.shadowRoot.querySelector(".drawer");
    const trigger = this.shadowRoot.querySelector(".burger-menu");
    if (!menu || !trigger) return;
    const open = this.isMenuOpen();
    const modal = this._getMenuModal();
    const mode = this._getMenuMode();
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    trigger.setAttribute("aria-haspopup", modal ? "dialog" : "true");
    menu.setAttribute("role", modal ? "dialog" : "navigation");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    menu.dataset.menuMode = mode;
    menu.dataset.menuPlacement = this._getMenuPlacement();
    if (modal) menu.setAttribute("aria-modal", "true");
    else menu.removeAttribute("aria-modal");
    if (open) {
      menu.removeAttribute("inert");
      menu.inert = false;
    } else {
      menu.setAttribute("inert", "");
      menu.inert = true;
    }
  }
  _syncMenuPresentation() {
    const menu = this.shadowRoot.querySelector(".drawer");
    const trigger = this.shadowRoot.querySelector(".burger-menu");
    const backdrop = this.shadowRoot.querySelector(".backdrop");
    if (!menu || !trigger) return;
    const open = this.hasAttribute("menu-open");
    menu.classList.toggle("visible", open);
    trigger.classList.toggle("open", open);
    if (backdrop) {
      const showBackdrop = this._shouldShowBackdrop();
      backdrop.classList.toggle("visible", showBackdrop);
      backdrop.hidden = !showBackdrop;
    }
    this._syncMenuAttributeStyles();
    this._syncMenuA11y();
    if (open && this._isOverlayMenuMode()) {
      this._positionMenu();
      this._startDrawerTracking();
    } else {
      this._stopDrawerTracking();
    }
    this._applyMenuModality(open && this._getMenuModal());
  }
  _applyMenuModality(active) {
    if (typeof document === "undefined" || !document.body) return;
    const key = "xtendHeaderMenuModal";
    if (active && !this.isConnected) return;
    if (active) {
      document.body.dataset[key] = this.id || "x-header";
      return;
    }
    if (document.body.dataset[key] === (this.id || "x-header")) {
      delete document.body.dataset[key];
    }
  }
  _emitMenuConfigurationChange(type, oldValue, newValue) {
    if (!this.isConnected) return;
    this.dispatchEvent(new CustomEvent(type, {
      detail: {
        ...this.snapshot(),
        oldValue,
        newValue
      },
      bubbles: true,
      composed: true
    }));
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
    const backdrop = this.shadowRoot.querySelector(".backdrop");
    if (!this.isConnected || !burgerMenuButton || !drawer) return;
    burgerMenuButton.addEventListener("click", () => {
      this.toggleMenu(!this.isMenuOpen(), { source: "user" });
    });
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        if (this.isMenuOpen()) this.toggleMenu(false, { source: "backdrop" });
      });
    }
    this._onDocumentClick = (event) => {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
      if (!path.includes(this) && this.isMenuOpen() && this._isOverlayMenuMode()) this.toggleMenu(false, { source: "outside-click" });
    };
    this._onDocumentKeydown = (event) => {
      if (!this.isMenuOpen()) return;
      if (event.key === "Escape") this.toggleMenu(false, { source: "escape" });
      if (event.key === "Tab" && this._getMenuModal()) this._trapMenuFocus(event);
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
  _getFocusableMenuElements() {
    const drawer = this.shadowRoot.querySelector(".drawer");
    if (!drawer) return [];
    const shadowFocusables = Array.from(drawer.querySelectorAll(XHEADER_FOCUSABLE_SELECTOR));
    const slottedFocusables = Array.from(drawer.querySelectorAll("slot")).flatMap((slot) => {
      if (typeof slot.assignedElements !== "function") return [];
      return slot.assignedElements({ flatten: true }).flatMap((element) => {
        const nested = typeof element.querySelectorAll === "function"
          ? Array.from(element.querySelectorAll(XHEADER_FOCUSABLE_SELECTOR))
          : [];
        return element.matches && element.matches(XHEADER_FOCUSABLE_SELECTOR) ? [element, ...nested] : nested;
      });
    });
    return [...shadowFocusables, ...slottedFocusables].filter((element) => {
      if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") return false;
      return typeof element.offsetParent !== "undefined" ? element.offsetParent !== null || element === document.activeElement : true;
    });
  }
  _focusMenuSurface() {
    const drawer = this.shadowRoot.querySelector(".drawer");
    const focusables = this._getFocusableMenuElements();
    const target = focusables[0] || drawer;
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
  }
  _restoreMenuFocus() {
    const burgerMenuButton = this.shadowRoot.querySelector(".burger-menu");
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (burgerMenuButton && (!active || active === document.body || this.contains(active))) {
      burgerMenuButton.focus({ preventScroll: true });
      return;
    }
    if (this._lastFocusedElement && typeof this._lastFocusedElement.focus === "function") {
      this._lastFocusedElement.focus({ preventScroll: true });
    }
  }
  _trapMenuFocus(event) {
    const focusables = this._getFocusableMenuElements();
    if (focusables.length === 0) {
      event.preventDefault();
      this._focusMenuSurface();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
  _setMenuOpen(open, options = {}) {
    const burgerMenuButton = this.shadowRoot.querySelector(".burger-menu");
    const drawer = this.shadowRoot.querySelector(".drawer");
    if (!burgerMenuButton || !drawer) return;
    const wasOpen = this.isMenuOpen();
    if (wasOpen !== Boolean(open)) {
      const beforeEvent = new CustomEvent(open ? "menu-before-open" : "menu-before-close", {
        detail: {
          ...this.snapshot(),
          source: options.source || "x-header"
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      if (!this.dispatchEvent(beforeEvent)) return;
    }
    if (wasOpen === Boolean(open)) {
      this._syncMenuPresentation({ source: options.source || "x-header" });
      if (options.sync !== false && this.id) this._syncState(true);
      return;
    }
    if (open) {
      this._lastFocusedElement = typeof document !== "undefined" ? document.activeElement : null;
      this._suppressMenuOpenAttribute = true;
      this.setAttribute("menu-open", "");
      this._suppressMenuOpenAttribute = false;
      this._syncMenuPresentation({ source: options.source || "x-header" });
      if (this._getMenuModal() && options.focus !== false) this._focusMenuSurface();
    } else {
      this._suppressMenuOpenAttribute = true;
      this.removeAttribute("menu-open");
      this._suppressMenuOpenAttribute = false;
      this._syncMenuPresentation({ source: options.source || "x-header" });
      if (options.focus !== false) this._restoreMenuFocus();
    }
    if (options.sync !== false && this.id) this._syncState(open);
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
    return this.hasAttribute("menu-open") || Boolean(drawer && drawer.classList.contains("visible"));
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
      menuMode: this._getMenuMode(),
      menuPlacement: this._getMenuPlacement(),
      menuModal: this._getMenuModal(),
      menuBreakpoint: this._getMenuBreakpoint(),
      menuWidth: this._getMenuWidth(),
      menuMaxHeight: this._getMenuMaxHeight(),
      menuAlign: this._getMenuAlign(),
      drawerMode: "fixed-full-width-overlay"
    };
  }
}
customElements.define("x-header", XHeader);
// TypeScript: Typdefinitionen vorbereiten (z. B. xheader.d.ts)
