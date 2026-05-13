import { xstate } from './xstate.js';
import './xicon.js';

// <x-hero>
class XHero extends HTMLElement {
  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-hero",
      profiles: ["display"],
      maturity: "ux-ready"
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      schedule: "component.shell.render",
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      role: "banner",
      accessibleName: "Hero Section",
      focusStrategy: "content-first"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-layout",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.hero.render", "xtend.layout.measure"],
      idleOrBackgroundAllowed: false
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-hero",
      family: "display-hero",
      role: "banner",
      contentKind: "hero-media-copy",
      responsiveStrategy: "fluid-content-box",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "viewport-bounded",
      aspectRatio: "viewport-or-content",
      signatureDesign: {
        note: "Immersive enterprise hero with editorial depth, media-safe surfaces and tokenized title/content composition.",
        tokenStrategy: "layout tokens back hero surface, text, overlay, content width, spacing, radius, media radius, focus and elevation.",
        themeExpectation: "brands can move from quiet application hero to image-led campaign surface through CSS tokens and attributes."
      },
      events: ["hero-rendered", "hero-animated"],
      commands: ["render", "measure", "layout", "snapshot"],
      stateKey: "xhero-state-<id>",
      schedule: "component.shell.render",
      fabric: { lane: "visible", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._unsubscribeState = null;
  }

  connectedCallback() {
    this.render();
    this.applyTheme();
    this.dispatchEvent(new CustomEvent("hero-rendered"));

    if (this.hasAttribute("animate")) {
      requestAnimationFrame(() => {
        const content = this.shadowRoot.querySelector(".content");
        content.classList.add("show");
        this.dispatchEvent(new CustomEvent("hero-animated"));
      });
    }

    const observer = new MutationObserver(() => this.applyTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    this._observer = observer;

    // Add scroll button functionality
    const scrollButton = this.shadowRoot.querySelector(".scroll-button");
    if (scrollButton) {
      scrollButton.addEventListener("click", () => this.scrollPast());
    }

    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xhero-${Math.random().toString(36).slice(2, 10)}`;

    // Initialen State setzen
    xstate.set(`xhero-state-${this.id}`, {
      background: this.getAttribute("background"),
      backgroundLight: this.getAttribute("background-light"),
      backgroundDark: this.getAttribute("background-dark"),
      backgroundImage: this.getAttribute("background-image"),
      align: this.getAttribute("align"),
      verticalAlign: this.getAttribute("vertical-align"),
      fullheight: this.hasAttribute("fullheight"),
      overlay: this.hasAttribute("overlay"),
      overlayLight: this.getAttribute("overlay-light"),
      overlayDark: this.getAttribute("overlay-dark"),
      animate: this.hasAttribute("animate"),
      scrollButton: this.hasAttribute("scroll-button"),
      fontColor: this.getAttribute("font-color"),
      fontColorLight: this.getAttribute("font-color-light"),
      fontColorDark: this.getAttribute("font-color-dark")
    });

    // State-Änderungen abonnieren (z.B. externe Steuerung)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xhero-state-${this.id}` && typeof value === "object") {
        if (value.background !== undefined) this.setAttribute("background", value.background);
        if (value.backgroundLight !== undefined) this.setAttribute("background-light", value.backgroundLight);
        if (value.backgroundDark !== undefined) this.setAttribute("background-dark", value.backgroundDark);
        if (value.backgroundImage !== undefined) this.setAttribute("background-image", value.backgroundImage);
        if (value.align !== undefined) this.setAttribute("align", value.align);
        if (value.verticalAlign !== undefined) this.setAttribute("vertical-align", value.verticalAlign);
        if (value.fullheight !== undefined) {
          if (value.fullheight) this.setAttribute("fullheight", "");
          else this.removeAttribute("fullheight");
        }
        if (value.overlay !== undefined) {
          if (value.overlay) this.setAttribute("overlay", "");
          else this.removeAttribute("overlay");
        }
        if (value.overlayLight !== undefined) this.setAttribute("overlay-light", value.overlayLight);
        if (value.overlayDark !== undefined) this.setAttribute("overlay-dark", value.overlayDark);
        if (value.animate !== undefined) {
          if (value.animate) this.setAttribute("animate", "");
          else this.removeAttribute("animate");
        }
        if (value.scrollButton !== undefined) {
          if (value.scrollButton) this.setAttribute("scroll-button", "");
          else this.removeAttribute("scroll-button");
        }
        if (value.fontColor !== undefined) this.setAttribute("font-color", value.fontColor);
        if (value.fontColorLight !== undefined) this.setAttribute("font-color-light", value.fontColorLight);
        if (value.fontColorDark !== undefined) this.setAttribute("font-color-dark", value.fontColorDark);
        this.render();
        this.applyTheme();
      }
    });
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
    if (this._unsubscribeState) this._unsubscribeState();
  }

  static get observedAttributes() {
    return [
      "background", "background-light", "background-dark", "background-image", "align", "vertical-align", "fullheight", "overlay", "overlay-light", "overlay-dark", "animate", "scroll-button", "font-color", "font-color-light", "font-color-dark", "text-box"
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      // State aktualisieren
      if (this.id) {
        xstate.set(`xhero-state-${this.id}`, {
          background: this.getAttribute("background"),
          backgroundLight: this.getAttribute("background-light"),
          backgroundDark: this.getAttribute("background-dark"),
          backgroundImage: this.getAttribute("background-image"),
          align: this.getAttribute("align"),
          verticalAlign: this.getAttribute("vertical-align"),
          fullheight: this.hasAttribute("fullheight"),
          overlay: this.hasAttribute("overlay"),
          overlayLight: this.getAttribute("overlay-light"),
          overlayDark: this.getAttribute("overlay-dark"),
          animate: this.hasAttribute("animate"),
          scrollButton: this.hasAttribute("scroll-button"),
          fontColor: this.getAttribute("font-color"),
          fontColorLight: this.getAttribute("font-color-light"),
          fontColorDark: this.getAttribute("font-color-dark"),
          textBox: this.getAttribute("text-box") === "true"
        });
      }
    }
  }

  applyTheme() {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const themeSuffix = theme === "dark" ? "dark" : "light";
    this.toggleAttribute("data-theme-dark", theme === "dark");
    this.shadowRoot.host.style.removeProperty("--hero-bg");
    this.shadowRoot.host.style.removeProperty("--hero-text");
    this.shadowRoot.host.style.removeProperty("--overlay-color");

    const themedBackground = this.getAttribute(`background-${themeSuffix}`);
    if (themedBackground) {
      this.shadowRoot.host.style.setProperty("--hero-bg", themedBackground);
    }

    const themedOverlay = this.getAttribute(`overlay-${themeSuffix}`);
    if (themedOverlay) {
      this.shadowRoot.host.style.setProperty("--overlay-color", themedOverlay);
    }

    // Apply custom font color if specified
    const fontColor = this.getAttribute(`font-color-${themeSuffix}`) || this.getAttribute("font-color");
    if (fontColor) {
      this.shadowRoot.host.style.setProperty("--hero-text", fontColor);
    }
  }

  scrollPast() {
    const heroHeight = this.shadowRoot.querySelector(".hero").offsetHeight;
    window.scrollBy({
      top: heroHeight,
      behavior: "smooth",
    });
  }

  render() {
    const hasThemedBackground = this.hasAttribute("background-light") || this.hasAttribute("background-dark");
    const heroSurface = "var(--hero-bg, var(--xtend-layout-surface, var(--xtend-layout-surface-default)))";
    const bg = hasThemedBackground ? heroSurface : (this.getAttribute("background") || heroSurface);
    const bgImg = this.getAttribute("background-image") || "";
    const fullHeight = this.hasAttribute("fullheight");
    const overlay = this.hasAttribute("overlay");
    const align = this.getAttribute("align") || "center";
    const verticalAlign = this.getAttribute("vertical-align") || "center";
    const scrollButton = this.hasAttribute("scroll-button");
    const textBox = this.getAttribute("text-box") === "true";

    // Determine horizontal and vertical alignment
    const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
    const alignItems = verticalAlign === "top" ? "flex-start" : verticalAlign === "bottom" ? "flex-end" : "center";

    const style = `
      <style>
        :host {
          --xtend-layout-surface-default: #ffffff;
          --xtend-layout-text-default: #000000;
          --xtend-layout-overlay-default: rgba(255, 255, 255, 0.18);
          --hero-max-width: var(--xtend-layout-content-max, 900px);
          --hero-radius: var(--xtend-layout-radius, 1.2em);
          --hero-media-radius: var(--xtend-layout-media-radius, var(--hero-radius));
          --hero-blur: var(--xtend-layout-backdrop-blur, 14px);
          --hero-shadow: var(--xtend-layout-elevation, 0 4px 24px 0 rgba(40,60,120,0.10), 0 1.5px 6px 0 rgba(40,60,120,0.08));
          --hero-content-gap: var(--xtend-layout-gap, 1rem);
          --hero-grid-min: var(--xtend-layout-grid-min, minmax(0, 1fr));
          display: block;
          color: var(--hero-text, var(--xtend-layout-text, var(--xtend-layout-text-default)));
          font-family: var(--hero-font-family, var(--xtend-layout-font-family, inherit));
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        :host([data-theme-dark]) {
          --xtend-layout-surface-default: #121212;
          --xtend-layout-text-default: #ffffff;
          --xtend-layout-overlay-default: rgba(0, 0, 0, 0.42);
        }

        .hero {
          position: relative;
          background-color: ${bg};
          ${bgImg ? `background-image: url('${bgImg}'); background-size: cover; background-position: center;` : ""}
          min-height: ${fullHeight ? "100vh" : "auto"};
          display: flex;
          justify-content: ${justify};
          align-items: ${alignItems};
          text-align: ${align};
          padding: var(--hero-padding, var(--xtend-layout-spacing, 3.5rem 1.5rem 3.5rem 1.5rem));
          box-sizing: border-box;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          margin: 0.5em 0 2.5em 0;
          border-radius: var(--hero-media-radius);
          box-shadow: var(--hero-shadow);
          backdrop-filter: blur(var(--hero-blur));
        }
        .hero[fullheight], .hero.fullheight {
          width: 100% !important;
          max-width: 100vw !important;
          min-width: 0;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none;
        }

        .hero.has-bgimg {
          background-color: var(--hero-media-bg, var(--xtend-layout-media-surface, rgba(40,60,120,0.10)));
          box-shadow: none;
          backdrop-filter: none;
        }

        .overlay {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          background: var(--overlay-color, var(--xtend-layout-overlay, var(--xtend-layout-overlay-default, rgba(0, 0, 0, 0.4))));
          z-index: 0;
          border-radius: var(--hero-media-radius);
        }

        .content {
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
          width: 100%;
          max-width: var(--hero-content-max-width, var(--xtend-layout-content-max, 700px));
          min-width: 0;
          margin: var(--hero-content-margin, 0 auto);
          font-size: var(--hero-font-size, clamp(1rem, 2.5vw, 2rem));
          background: var(--hero-content-bg, var(--xtend-layout-surface, rgba(255,255,255,0.10)));
          border-radius: var(--hero-content-radius, var(--xtend-layout-radius, 1em));
          box-shadow: var(--hero-content-shadow, var(--xtend-layout-elevation, 0 2px 8px rgba(40,60,120,0.10)));
          backdrop-filter: var(--hero-content-backdrop-filter, blur(8px));
          padding: var(--hero-content-padding, var(--xtend-layout-spacing, 2.2rem 2rem));
          box-sizing: border-box;
          overflow-wrap: anywhere;
          display: grid;
          gap: var(--hero-content-gap);
        }

        .content.show {
          opacity: 1;
          transform: translateY(0);
        }

        .scroll-button {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--scroll-button-bg, var(--xtend-layout-control-surface, rgba(0, 0, 0, 0.6)));
          color: var(--scroll-button-color, var(--xtend-layout-control-text, #fff));
          border: var(--scroll-button-border, 1px solid var(--xtend-layout-border-color, transparent));
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          font-size: var(--scroll-button-font-size, var(--xtend-layout-font-size, 1.5rem));
          z-index: 2;
          transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
        }
        .scroll-button x-icon {
          pointer-events: none;
        }

        .scroll-button:hover {
          background: var(--scroll-button-hover-bg, rgba(0, 0, 0, 0.8));
        }

        .scroll-button:focus-visible {
          outline: var(--xtend-layout-focus-ring, var(--xtend-focus-ring, 2.5px solid var(--xtend-color-primary, #4fc3f7)));
          outline-offset: 2px;
        }

        .hero-title-box {
          display: inline-block;
          background: var(--hero-title-bg, var(--xtend-layout-surface, rgba(255,255,255,0.18)));
          box-shadow: var(--hero-title-shadow, var(--xtend-layout-elevation, 0 2px 8px rgba(40,60,120,0.10)));
          border-radius: var(--hero-title-radius, var(--xtend-layout-radius, 0.7em));
          padding: var(--hero-title-padding, 0.5em 1.2em);
          margin-bottom: 0.7em;
          backdrop-filter: blur(8px);
          font-weight: 700;
          font-size: 2.1em;
          color: inherit;
        }

        ::slotted(*) {
          color: inherit;
          margin: 0.5em 0;
          max-width: 100%;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        @media (max-width: 900px) {
          .hero { width: 100%; max-width: 100%; }
          .content { max-width: 100%; }
        }
        @media (max-width: 600px) {
          .hero { padding: 2.2rem 0.5rem; }
          .content { padding: 1.2rem 0.5rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .content, .scroll-button {
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          .hero, .content {
            border: 1px solid CanvasText;
          }
        }
        :host([fullheight]) {
          padding: 0 !important;
          margin: 0 !important;
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${style}
      <section class="hero${bgImg ? ' has-bgimg' : ''}${fullHeight ? ' fullheight' : ''}" part="root" role="banner" aria-label="Hero Section"${fullHeight ? ' fullheight' : ''}>
        ${overlay ? `<div class="overlay" part="overlay"></div>` : ""}
        <div class="content" part="content">
          <slot name="hero-title"></slot>
          <slot></slot>
        </div>
        ${scrollButton ? `<button class="scroll-button" part="scroll-button control" aria-label="Scroll down"><x-icon name="chevron-down" part="scroll-icon control icon" decorative size="1.15rem"></x-icon></button>` : ""}
      </section>
    `;

    // Nach dem Rendern: Wenn textBox aktiv und <h1 slot="hero-title"> existiert, umhüllen
    if (textBox) {
      const slot = this.shadowRoot.querySelector('slot[name="hero-title"]');
      if (slot) {
        const nodes = slot.assignedNodes({flatten:true});
        nodes.forEach(node => {
          if (node.nodeType === 1 && node.tagName === 'H1' && !node.classList.contains('hero-title-box')) {
            node.classList.add('hero-title-box');
          }
        });
      }
    } else {
      // Falls deaktiviert, entferne ggf. die Klasse
      const slot = this.shadowRoot.querySelector('slot[name="hero-title"]');
      if (slot) {
        const nodes = slot.assignedNodes({flatten:true});
        nodes.forEach(node => {
          if (node.nodeType === 1 && node.tagName === 'H1' && node.classList.contains('hero-title-box')) {
            node.classList.remove('hero-title-box');
          }
        });
      }
    }
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-hero",
      stateKey: `xhero-state-${this.id}`,
      schedule: "component.shell.render",
      background: this.getAttribute("background"),
      backgroundLight: this.getAttribute("background-light"),
      backgroundDark: this.getAttribute("background-dark"),
      backgroundImage: this.getAttribute("background-image"),
      fullheight: this.hasAttribute("fullheight"),
      overlay: this.hasAttribute("overlay"),
      overlayLight: this.getAttribute("overlay-light"),
      overlayDark: this.getAttribute("overlay-dark")
    };
  }
}

customElements.define("x-hero", XHero);
