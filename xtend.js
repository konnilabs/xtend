(function () {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  window.toggleDarkMode = function () {
    const current = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", current === "dark" ? "light" : "dark");
  };
})();

function xtendLegacyControlIcon(name) {
  const icons = {
    close: '<span class="xtend-control-icon" part="close-icon control icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M18 6 6 18"></path><path d="M6 6l12 12"></path></svg></span>'
  };
  return icons[name] || '';
}

// <x-button>
class XButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const button = document.createElement("button");
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.textContent = this.getAttribute("label") || "Click";
    const style = document.createElement("style");
    style.textContent = `
      button {
        background-color: var(--primary-color);
        color: #fff;
        border: none;
        border-radius: var(--border-radius);
        padding: var(--padding);
      }
      button:hover {
        filter: brightness(1.1);
      }
    `;
    shadow.append(style, button);
  }
}
customElements.define("x-button", XButton);

// <x-spinner>
class XSpinner extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const spinner = document.createElement("div");
    const style = document.createElement("style");
    style.textContent = `
      div {
        border: 4px solid rgba(0,0,0,0.1);
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    shadow.append(style, spinner);
  }
}
customElements.define("x-spinner", XSpinner);

// <x-tabs>
class XTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .tabs {
          display: flex;
          gap: 0.5em;
          border-bottom: 2px solid var(--secondary-color);
        }
        .tab {
          background: transparent;
          border: none;
          padding: var(--padding);
          font-weight: bold;
          cursor: pointer;
          color: var(--text-color);
        }
        .tab[aria-selected="true"] {
          color: var(--primary-color);
          border-bottom: 2px solid var(--primary-color);
        }
        .panel {
          display: none;
          padding: 1em 0;
        }
        .panel.active {
          display: block;
        }
      </style>
      <div class="tabs" role="tablist"></div>
      <div class="panels"></div>
    `;
  }

  connectedCallback() {
    const tabsContainer = this.shadowRoot.querySelector(".tabs");
    const panelsContainer = this.shadowRoot.querySelector(".panels");

    const tabs = this.querySelectorAll("[data-tab]");
    tabs.forEach((tab, i) => {
      const btn = document.createElement("button");
      btn.textContent = tab.getAttribute("data-title") || `Tab ${i + 1}`;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", i === 0);
      btn.classList.add("tab");
      btn.addEventListener("click", () => this.selectTab(i));
      tabsContainer.appendChild(btn);

      const panel = document.createElement("div");
      panel.classList.add("panel");
      if (i === 0) panel.classList.add("active");
      panel.innerHTML = tab.innerHTML;
      panelsContainer.appendChild(panel);
    });

    this._tabs = tabsContainer.querySelectorAll("button");
    this._panels = panelsContainer.querySelectorAll(".panel");
  }

  selectTab(index) {
    this._tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", i === index);
    });
    this._panels.forEach((panel, i) => {
      panel.classList.toggle("active", i === index);
    });
  }
}
customElements.define("x-tabs", XTabs);

// <x-menu>
class XMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        nav {
          display: flex;
          gap: 1em;
          background: var(--secondary-color);
          padding: var(--padding);
        }
        a {
          color: #fff;
          text-decoration: none;
        }
        a:focus {
          outline: var(--focus-outline);
        }
      </style>
      <nav role="menubar">
        <slot></slot>
      </nav>
    `;
  }
}
customElements.define("x-menu", XMenu);


// <x-footer>
class XFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        footer {
          background: var(--secondary-color);
          color: #fff;
          text-align: center;
          padding: 1em;
        }
      </style>
      <footer role="contentinfo">
        <slot>&copy; 2025 – Dein Unternehmen</slot>
      </footer>
    `;
  }
}
customElements.define("x-footer", XFooter);
// <x-alert>
class XAlert extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const type = this.getAttribute("type") || "info";
    const closable = this.hasAttribute("closable");

    const container = document.createElement("div");
    container.setAttribute("role", "alert");
    container.className = `alert ${type}`;
    container.innerHTML = `
      <slot></slot>
      ${closable ? `<button class="close" part="close control" aria-label="Schließen">${xtendLegacyControlIcon('close')}</button>` : ''}
    `;

    const style = document.createElement("style");
    style.textContent = `
      .alert {
        padding: 1em;
        border-radius: var(--border-radius);
        margin: 1em 0;
        color: #fff;
      }
      .info { background: #17a2b8; }
      .success { background: #28a745; }
      .warning { background: #ffc107; color: #212529; }
      .error { background: #dc3545; }

      .close {
        background: none;
        border: none;
        float: right;
        font-size: 1.2em;
        cursor: pointer;
        color: inherit;
      }
    `;

    if (closable) {
      container.querySelector(".close").addEventListener("click", () => {
        this.remove();
      });
    }

    this.shadowRoot.append(style, container);
  }
}
customElements.define("x-alert", XAlert);
// <x-toast>
class XToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const type = this.getAttribute("type") || "info";
    const duration = parseInt(this.getAttribute("duration") || "3000", 10);

    const wrapper = document.createElement("div");
    wrapper.setAttribute("role", "status");
    wrapper.className = `toast ${type}`;
    wrapper.innerHTML = `
      <slot></slot>
      <button class="close" part="close control" aria-label="Schließen">${xtendLegacyControlIcon('close')}</button>
    `;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        position: fixed;
        bottom: 1.5em;
        right: 1.5em;
        z-index: 9999;
        display: block;
        animation: fadein 0.3s ease;
      }

      .toast {
        min-width: 200px;
        padding: 1em;
        border-radius: var(--border-radius);
        color: #fff;
        background: #333;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        position: relative;
      }

      .info { background: #17a2b8; }
      .success { background: #28a745; }
      .warning { background: #ffc107; color: #212529; }
      .error { background: #dc3545; }

      .close {
        background: none;
        border: none;
        font-size: 1.2em;
        color: inherit;
        position: absolute;
        top: 0.4em;
        right: 0.6em;
        cursor: pointer;
      }

      @keyframes fadein {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;

    this.shadowRoot.append(style, wrapper);

    wrapper.querySelector(".close").addEventListener("click", () => this.remove());

    if (duration > 0) {
      setTimeout(() => this.remove(), duration);
    }
  }
}
customElements.define("x-toast", XToast);
window.showToast = function (message, type = "info", duration = 3000) {
  const toast = document.createElement("x-toast");
  toast.setAttribute("type", type);
  toast.setAttribute("duration", duration);
  toast.textContent = message;
  document.body.appendChild(toast);
};
// <x-dialog>
class XDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const useOverlay = this.hasAttribute("overlay");

    this.wrapper = document.createElement("div");
    this.wrapper.className = "dialog-wrapper";
    this.wrapper.style.display = "none"; // initially hidden
    this.wrapper.innerHTML = `
      ${useOverlay ? '<div class="overlay"></div>' : ''}
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button class="close-btn" part="close control" aria-label="Schließen">${xtendLegacyControlIcon('close')}</button>
        <div class="content">
          <slot name="title" id="dialog-title"></slot>
          <slot></slot>
          <div class="actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      .dialog-wrapper {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .dialog-wrapper[open] {
        display: flex;
      }

      .overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
      }

      .dialog {
        background: var(--background-color);
        color: var(--text-color);
        border-radius: var(--border-radius);
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        max-width: 90%;
        min-width: 300px;
        z-index: 10000;
        position: relative;
        padding: 1em 1.5em;
        animation: fadeIn 0.2s ease-out;
      }

      .close-btn {
        position: absolute;
        top: 0.5em;
        right: 0.7em;
        background: none;
        border: none;
        font-size: 1.2em;
        color: var(--text-color);
        cursor: pointer;
      }

      .content > ::slotted([slot="title"]) {
        font-weight: bold;
        font-size: 1.2em;
        margin-bottom: 0.5em;
        display: block;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5em;
        margin-top: 1em;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;

    this.shadowRoot.append(style, this.wrapper);

    this.shadowRoot.querySelector(".close-btn").addEventListener("click", () => this.close());
    if (useOverlay) {
      this.shadowRoot.querySelector(".overlay").addEventListener("click", () => this.close());
    }

    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    document.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  open() {
    this.wrapper.setAttribute("open", "");
    this.wrapper.style.display = "flex";
    this.setAttribute("open", "");
  }

  close() {
    this.wrapper.removeAttribute("open");
    this.wrapper.style.display = "none";
    this.removeAttribute("open");
  }

  _handleKeyDown(e) {
    if (e.key === "Escape") this.close();
  }
}
customElements.define("x-dialog", XDialog);

// <x-lightbox>
class XLightbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
        }

        @keyframes fadeImageIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeImageOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.95); }
        }

        .overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .content {
          position: relative;
          max-width: 90vw;
          max-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: var(--border-radius, 0.5rem);
          box-shadow: 0 0 2rem rgba(0, 0, 0, 0.5);
          animation: fadeImageIn 0.3s ease-out;
        }

        .content.closing img {
          animation: fadeImageOut 0.2s ease-in forwards;
        }

        .close-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(255, 255, 255, 0.85);
          border: none;
          font-size: 1.5rem;
          padding: 0.25em 0.5em;
          cursor: pointer;
          border-radius: 0.25rem;
          z-index: 2;
        }

        .close-btn:hover {
          background: white;
        }
      </style>

      <div class="overlay" role="dialog" aria-hidden="true">
        <div class="content">
          <button class="close-btn" part="close control" aria-label="Schließen">${xtendLegacyControlIcon('close')}</button>
          <img src="" alt="">
        </div>
      </div>
    `;

    this._overlay = this.shadowRoot.querySelector('.overlay');
    this._content = this.shadowRoot.querySelector('.content');
    this._img = this.shadowRoot.querySelector('img');
    this._btn = this.shadowRoot.querySelector('.close-btn');
  }

  connectedCallback() {
    this._btn.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });
    this._escHandler = (e) => e.key === 'Escape' && this.close();
    document.addEventListener('keydown', this._escHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._escHandler);
  }

  open(src) {
    this._img.src = src;
    this._overlay.style.display = 'flex';
    this._overlay.setAttribute('aria-hidden', 'false');
    this._content.classList.remove('closing');
  }

  close() {
    this._content.classList.add('closing');
    setTimeout(() => {
      this._overlay.style.display = 'none';
      this._overlay.setAttribute('aria-hidden', 'true');
      this._img.src = '';
      this._content.classList.remove('closing');
    }, 200); // match fadeImageOut duration
  }
}
customElements.define('x-lightbox', XLightbox);

window.showLightbox = function (src) {
  let lb = document.querySelector('x-lightbox');
  if (!lb) {
    lb = document.createElement('x-lightbox');
    document.body.appendChild(lb);
  }
  lb.open(src);
};
// <x-masonry>
class XMasonry extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .masonry {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1em;
        }
        .box {
          background: var(--background-color);
          color: var(--text-color);
          border: 1px solid var(--secondary-color);
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .box-header {
          padding: 0.5em;
          background: var(--secondary-color);
          color: #fff;
          font-weight: bold;
        }
        .box-content {
          padding: 0.5em;
        }
        .ghost-box {
          border: 2px dashed var(--primary-color);
          background: repeating-linear-gradient(45deg, #ccc, #ccc 10px, transparent 10px, transparent 20px);
          height: 100px;
        }
        .highlight {
          outline: 2px dashed var(--primary-color);
        }
      </style>
      <div class="masonry"></div>
    `;
    this._container = this.shadowRoot.querySelector(".masonry");
    this._dragged = null;
    this._ghost = document.createElement("div");
    this._ghost.className = "ghost-box";
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    const slots = Array.from(this.querySelectorAll("[data-key]"));
    const order = JSON.parse(localStorage.getItem("masonry-order") || "null");

    const sorted = order
      ? order.map(key => slots.find(s => s.dataset.key === key)).filter(Boolean)
      : slots;

    sorted.forEach(el => this._addBox(el));

    if (this.hasAttribute("draggable")) {
      this._enableDrag();
    }
  }

  _addBox(el) {
    const box = document.createElement("div");
    box.className = "box";
    box.setAttribute("draggable", true);
    box.dataset.key = el.dataset.key;

    const header = document.createElement("div");
    header.className = "box-header";
    header.textContent = el.getAttribute("data-title") || el.dataset.key;

    const content = document.createElement("div");
    content.className = "box-content";
    content.innerHTML = el.innerHTML;

    box.appendChild(header);
    box.appendChild(content);
    this._container.appendChild(box);
  }

  _enableDrag() {
    this._container.addEventListener("dragstart", e => {
      if (!e.target.classList.contains("box")) return;
      this._dragged = e.target;
      e.target.classList.add("dragging");
      this._container.insertBefore(this._ghost, e.target.nextSibling);
    });

    this._container.addEventListener("dragover", e => {
      e.preventDefault();
      const target = [...this._container.children].find(
        el => el !== this._ghost && el !== this._dragged && el.matches(".box") && this._isBefore(e.clientY, el)
      );
      if (target) {
        this._container.insertBefore(this._ghost, target);
      } else {
        this._container.appendChild(this._ghost);
      }
    });

    this._container.addEventListener("drop", () => {
      if (!this._ghost.parentElement) return;
      this._container.insertBefore(this._dragged, this._ghost);
      this._ghost.remove();
      this._dragged.classList.remove("dragging");
      this._saveOrder();
    });

    this._container.addEventListener("dragend", () => {
      this._ghost.remove();
      if (this._dragged) {
        this._dragged.classList.remove("dragging");
        this._dragged = null;
      }
    });
  }

  _isBefore(mouseY, element) {
    const rect = element.getBoundingClientRect();
    return mouseY < rect.top + rect.height / 2;
  }

  _saveOrder() {
    const order = [...this._container.children]
      .filter(el => el.classList.contains("box"))
      .map(el => el.dataset.key);
    localStorage.setItem("masonry-order", JSON.stringify(order));
  }
}

customElements.define("x-masonry", XMasonry);
// <x-code>
class XCode extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const rawCode = this.innerHTML.trim();
    const lang = this.getAttribute('lang') || 'text';
    const escapedCode = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          font-family: monospace;
          background: var(--background-color, #f5f5f5);
          color: var(--text-color, #212529);
          border: 1px solid var(--secondary-color, #ccc);
          border-radius: var(--border-radius, 4px);
          overflow: auto;
          padding: 1em;
        }

        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .copy-btn {
          position: absolute;
          top: 0.5em;
          right: 0.5em;
          background: var(--primary-color, #007bff);
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0.25em 0.5em;
          font-size: 0.9em;
          cursor: pointer;
        }

        .copy-btn:focus {
          outline: var(--focus-outline, 2px solid #0056b3);
        }

        .copy-btn.success {
          background: var(--success-color, #28a745);
        }
      </style>
      <button class="copy-btn">Kopieren</button>
      <pre><code class="language-${lang}">${escapedCode}</code></pre>
    `;

    const copyBtn = this.shadowRoot.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(rawCode);
        copyBtn.textContent = 'Kopiert!';
        copyBtn.classList.add('success');
        setTimeout(() => {
          copyBtn.textContent = 'Kopieren';
          copyBtn.classList.remove('success');
        }, 1500);
      } catch (err) {
        copyBtn.textContent = 'Fehler';
      }
    });
  }
}

customElements.define('x-code', XCode);
// <x-header>
class XHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: var(--header-bg, #222);
          color: var(--header-fg, white);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: bold;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .logo-container img,
        .logo-container ::slotted(*) {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }
        nav {
          display: flex;
          gap: 1em;
        }
        ::slotted(a) {
          color: inherit;
          text-decoration: none;
          padding: 0.5em;
        }
      </style>
      <header>
        <div class="title">
          <div class="logo-container"></div>
          <slot name="title">Seitentitel</slot>
        </div>
        <nav>
          <slot name="nav"></slot>
        </nav>
      </header>
    `;
  }

  connectedCallback() {
    this.renderLogo();
  }

  static get observedAttributes() {
    return ["src", "logo-size"];
  }

  attributeChangedCallback() {
    this.renderLogo();
  }

  renderLogo() {
    const logoContainer = this.shadowRoot.querySelector(".logo-container");
    logoContainer.innerHTML = "";

    const src = this.getAttribute("src");
    const size = this.getAttribute("logo-size") || "40";

    logoContainer.style.width = size + "px";
    logoContainer.style.height = size + "px";

    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Logo";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      logoContainer.appendChild(img);
    } else {
      // Fallback auf slotted content
      const slot = document.createElement("slot");
      slot.name = "logo";
      logoContainer.appendChild(slot);
    }
  }
}

customElements.define("x-header", XHeader);

