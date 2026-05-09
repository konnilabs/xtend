// <x-section>
class XSection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.themeObserver = null;
  }

  connectedCallback() {
    this.render();
    this.syncThemeVariables();
    this.observeThemeChanges();
    this.applyAnimation();
  }

  disconnectedCallback() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  render() {
    const bgColor = this.getAttribute("background") || "transparent";
    const bgImage = this.getAttribute("background-image") || "";
    const fullHeight = this.hasAttribute("fullheight") || this.hasAttribute("hero");
    const hasOverlay = this.hasAttribute("overlay");
    const overlayColor = this.getAttribute("overlay-color") || "rgba(0, 0, 0, 0.5)";
    const overlayOpacity = this.getAttribute("overlay-opacity") || "0.5";
    const align = this.getAttribute("align") || "center";
    const animate = this.hasAttribute("animate");
    const isHero = this.hasAttribute("hero");
    const layout = this.getAttribute("layout") || "default";
    const reverse = this.hasAttribute("reverse");

    const contentClasses = ["content"];
    if (animate) contentClasses.push("animate");
    if (layout === "grid") contentClasses.push("grid");
    if (layout === "grid" && reverse) contentClasses.push("reverse");

    const style = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          width: 100%;
          overflow-x: hidden;
          --text-color: #000000;
          --background-color: #ffffff;
          --primary-color: #0d6efd;
          --secondary-color: #6c757d;
          --info-color: #0dcaf0;
          --success-color: #198754;
          --warning-color: #ffc107;
          --error-color: #dc3545;
          --min-size: 1rem;
          --max-size: 2rem;
          color: var(--text-color);
          background-color: var(--background-color);
          font-size: clamp(var(--min-size), 2vw, var(--max-size));
        }

        ::slotted(*) {
          color: inherit;
          background-color: transparent;
        }

        .wrapper {
          position: relative;
          background-color: ${bgColor};
          ${bgImage ? `background-image: url('${bgImage}'); background-size: cover; background-position: center;` : ""}
          ${fullHeight ? "min-height: 100vh;" : ""}
          padding: 2em;
          display: flex;
          justify-content: ${this.getJustify(align)};
          align-items: center;
          text-align: ${align};
          overflow: hidden;
          box-sizing: border-box;
          width: 100%;
        }

        .overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          background-color: ${overlayColor};
          opacity: ${overlayOpacity};
          pointer-events: none;
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 1;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .content.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2em;
        }

        @media (min-width: 768px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }

          .grid.reverse {
            direction: rtl;
          }

          .grid.reverse ::slotted(*) {
            direction: ltr;
          }
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${style}
      <section class="wrapper">
        ${hasOverlay ? `<div class="overlay"></div>` : ""}
        <div class="${contentClasses.join(" ")}"><slot></slot></div>
      </section>
    `;
  }

  applyAnimation() {
    const content = this.shadowRoot.querySelector(".content");
    if (!content) return;

    if (this.hasAttribute("animate")) {
      requestAnimationFrame(() => content.classList.add("animate"));
    } else {
      content.style.opacity = "1";
      content.style.transform = "none";
    }
  }

  syncThemeVariables() {
    const theme = document.documentElement.getAttribute("data-theme") || "light";

    const variables = {
      light: {
        '--background-color': '#ffffff',
        '--text-color': '#000000',
        '--primary-color': '#0d6efd',
        '--secondary-color': '#6c757d',
        '--info-color': '#0dcaf0',
        '--success-color': '#198754',
        '--warning-color': '#ffc107',
        '--error-color': '#dc3545',
        '--min-size': '1rem',
        '--max-size': '2rem'
      },
      dark: {
        '--background-color': '#121212',
        '--text-color': '#f0f0f0',
        '--primary-color': '#0d6efd',
        '--secondary-color': '#adb5bd',
        '--info-color': '#17a2b8',
        '--success-color': '#28a745',
        '--warning-color': '#ffc107',
        '--error-color': '#dc3545',
        '--min-size': '1rem',
        '--max-size': '2rem'
      }
    };

    const values = variables[theme] || variables.light;

    for (const key in values) {
      this.shadowRoot.host.style.setProperty(key, values[key]);
    }
  }

  observeThemeChanges() {
    this.themeObserver = new MutationObserver(() => this.syncThemeVariables());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  getJustify(align) {
    switch (align) {
      case "left": return "flex-start";
      case "right": return "flex-end";
      default: return "center";
    }
  }
}

customElements.define("x-section", XSection);

       