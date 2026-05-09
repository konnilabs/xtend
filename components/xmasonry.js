import { xstate } from './xstate.js';

class XMasonry extends HTMLElement {
  static get observedAttributes() {
    return ["columns", "gap", "save-positions"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-masonry",
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
      accessibleName: "Masonry grid",
      focusStrategy: "item-toggle-and-drag"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-layout",
      lane: "visible",
      hydrationPolicy: "visible",
      criticalMeasurements: ["xtend.layout.measure", "xtend.masonry.reflow"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-masonry",
      family: "layout-masonry",
      role: "list",
      contentKind: "reorderable-card-grid",
      responsiveStrategy: "column-count-grid",
      lazyPolicy: "visible-hydrate",
      overflowPolicy: "drag-contained",
      aspectRatio: "content-driven",
      events: ["masonry-layout"],
      commands: ["render", "measure", "layout", "snapshot"],
      stateKey: "xmasonry-state-<id>",
      schedule: "layout.reflow.commit",
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
          --masonry-columns: 3;
          --masonry-gap: 1.5rem;
          --card-bg: #fff;
          --card-border: #ddd;
          --card-padding: 1.5rem;
          --card-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
          --border-radius: 8px;
          --card-title-font-size: 1.25rem;
          --card-text-font-size: 1rem;
          --card-text-color: #333;
        }

        :host([data-theme="dark"]) {
          --card-bg: #1e1e1e;
          --card-border: #444;
          --card-text-color: #eee;
          --card-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(var(--masonry-columns), 1fr);
          gap: var(--masonry-gap);
        }

        .item {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: var(--card-padding);
          box-shadow: var(--card-shadow);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          cursor: grab;
          color: var(--card-text-color);
          position: relative;
        }

        .item:hover {
          box-shadow: var(--card-shadow-hover);
          transform: translateY(-5px);
        }

        .item:active {
          cursor: grabbing;
        }

        .item.dragging {
          opacity: 0.5;
          transform: scale(1.05);
        }

        .item-header {
          font-size: var(--card-title-font-size);
          font-weight: bold;
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-content {
          font-size: var(--card-text-font-size);
          color: var(--card-text-color);
        }

        .toggle {
          cursor: pointer;
          font-size: 1rem;
          background: none;
          border: none;
          color: inherit;
        }

        .collapsed .item-content {
          display: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .item, .drop-overlay {
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          .item, .toggle {
            border: 1px solid CanvasText;
          }
        }
      </style>
      <div class="grid" part="root grid" role="list">
        <slot hidden></slot>
      </div>
    `;

    this._container = this.shadowRoot.querySelector(".grid");
    this._draggedItem = null;
    this._unsubscribeState = null;
  }

  connectedCallback() {
    if (!this.id) this.id = `xmasonry-${Math.random().toString(36).slice(2, 10)}`;

    this._applyAttributes();
    this._renderItems();
    this._enableDragAndDrop();
    this._observeThemeChange();

    xstate.set(`xmasonry-state-${this.id}`, {
      order: this._getCurrentOrder(),
      collapsed: this._getCollapsedState()
    });

    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xmasonry-state-${this.id}` && typeof value === "object") {
        if (Array.isArray(value.order)) {
          this._applyOrderFromState(value.order);
        }
        if (typeof value.collapsed === "object") {
          this._applyCollapsedFromState(value.collapsed);
        }
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "columns") {
      this.style.setProperty("--masonry-columns", newValue);
    }
    if (name === "gap") {
      this.style.setProperty("--masonry-gap", newValue);
    }
    if (name === "save-positions") {
      this._renderItems();
    }
  }

  _applyAttributes() {
    const columns = this.getAttribute("columns") || "3";
    const gap = this.getAttribute("gap") || "1.5rem";

    this.style.setProperty("--masonry-columns", columns);
    this.style.setProperty("--masonry-gap", gap);
  }

  _renderItems() {
    const slot = this.shadowRoot.querySelector("slot");
    const items = slot.assignedNodes().filter(node => node.nodeType === Node.ELEMENT_NODE);

    let orderedItems = items;
    if (this._shouldSavePositions()) {
      const savedOrder = this._getSavedOrder();
      if (savedOrder && savedOrder.length) {
        const keyToItem = Object.fromEntries(items.map(i => [i.dataset.key, i]));
        orderedItems = savedOrder.map(key => keyToItem[key]).filter(Boolean);
        orderedItems.push(...items.filter(i => !savedOrder.includes(i.dataset.key)));
      }
    }

    this._container.innerHTML = "";

    orderedItems.forEach(item => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("item");
      wrapper.setAttribute("part", "item");
      wrapper.dataset.key = item.dataset.key;

      const header = document.createElement("div");
      header.classList.add("item-header");
      header.textContent = item.getAttribute("data-title") || "Untitled";

      const toggle = document.createElement("button");
      toggle.classList.add("toggle");
      toggle.setAttribute("part", "toggle");
      toggle.textContent = "▼";
      toggle.addEventListener("click", () => {
        wrapper.classList.toggle("collapsed");
        toggle.textContent = wrapper.classList.contains("collapsed") ? "▶" : "▼";
        this._saveState();
        xstate.set(`xmasonry-state-${this.id}`, {
          order: this._getCurrentOrder(),
          collapsed: this._getCollapsedState()
        });
      });

      header.appendChild(toggle);

      const content = document.createElement("div");
      content.classList.add("item-content");
      content.setAttribute("part", "content");
      content.append(...item.cloneNode(true).childNodes);

      wrapper.appendChild(header);
      wrapper.appendChild(content);
      this._container.appendChild(wrapper);
    });

    slot.hidden = true;

    this._restoreState();
    this.dispatchEvent(new CustomEvent("masonry-layout", {
      detail: this.snapshot(),
      bubbles: true,
      composed: true
    }));
  }

  _shouldSavePositions() {
    return this.getAttribute("save-positions") === "true";
  }

  _getSavedOrder() {
    try {
      return JSON.parse(localStorage.getItem("xmasonry-order") || "[]");
    } catch {
      return [];
    }
  }

  _saveOrder() {
    if (!this._shouldSavePositions()) return;
    const order = Array.from(this._container.querySelectorAll(".item")).map(item => item.dataset.key);
    localStorage.setItem("xmasonry-order", JSON.stringify(order));
    xstate.set(`xmasonry-state-${this.id}`, {
      order,
      collapsed: this._getCollapsedState()
    });
  }

  _getCurrentOrder() {
    return Array.from(this._container.querySelectorAll(".item")).map(item => item.dataset.key);
  }

  _getCollapsedState() {
    const collapsed = {};
    this._container.querySelectorAll(".item").forEach(item => {
      collapsed[item.dataset.key] = item.classList.contains("collapsed");
    });
    return collapsed;
  }

  _applyOrderFromState(order) {
    const items = Array.from(this._container.querySelectorAll(".item"));
    const keyToItem = Object.fromEntries(items.map(i => [i.dataset.key, i]));
    this._container.innerHTML = "";
    order.forEach(key => {
      if (keyToItem[key]) this._container.appendChild(keyToItem[key]);
    });
    items.forEach(item => {
      if (!order.includes(item.dataset.key)) this._container.appendChild(item);
    });
  }

  _applyCollapsedFromState(collapsed) {
    this._container.querySelectorAll(".item").forEach(item => {
      if (collapsed[item.dataset.key]) {
        item.classList.add("collapsed");
        const toggle = item.querySelector(".toggle");
        if (toggle) toggle.textContent = "▶";
      } else {
        item.classList.remove("collapsed");
        const toggle = item.querySelector(".toggle");
        if (toggle) toggle.textContent = "▼";
      }
    });
  }

  _saveState() {
    const state = Array.from(this._container.querySelectorAll(".item")).map(item => ({
      key: item.dataset.key,
      collapsed: item.classList.contains("collapsed"),
    }));
    localStorage.setItem("masonry-state", JSON.stringify(state));
    xstate.set(`xmasonry-state-${this.id}`, {
      order: this._getCurrentOrder(),
      collapsed: this._getCollapsedState()
    });
  }

  _restoreState() {
    const state = JSON.parse(localStorage.getItem("masonry-state") || "[]");
    state.forEach(({ key, collapsed }) => {
      const item = this._container.querySelector(`.item[data-key="${key}"]`);
      if (item && collapsed) {
        item.classList.add("collapsed");
        item.querySelector(".toggle").textContent = "▶";
      }
    });
  }

  _enableDragAndDrop() {
    const items = this._container.querySelectorAll(".item");
    let dragging = false;
    let dragClone = null;
    let dragSource = null;
    let dropTarget = null;

    items.forEach(item => {
      if (!item.querySelector('.drop-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'drop-overlay';
        overlay.style.cssText = `
          position: absolute;
          inset: 0;
          background: rgba(79,195,247,0.18);
          border: 2px dashed var(--primary-color, #4fc3f7);
          border-radius: var(--border-radius, 8px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
          z-index: 10;
        `;
        item.appendChild(overlay);
      }
    });

    if (!this.shadowRoot.getElementById("drag-style")) {
      const style = document.createElement("style");
      style.id = "drag-style";
      style.textContent = `
        .drag-clone {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.8;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          border-radius: var(--border-radius, 8px);
          width: 300px;
          max-width: 90vw;
        }
        .item.dragging {
          opacity: 0.5;
          transform: scale(1.05);
        }
        .item .drop-overlay.active {
          opacity: 1 !important;
        }
      `;
      this.shadowRoot.appendChild(style);
    }

    function swapItems(itemA, itemB) {
      if (!itemA || !itemB || itemA === itemB) return;
      const parent = itemA.parentNode;
      const nextA = itemA.nextSibling === itemB ? itemA : itemA.nextSibling;
      parent.insertBefore(itemA, itemB);
      parent.insertBefore(itemB, nextA);
    }

    items.forEach(item => {
      item.setAttribute("draggable", "true");

      item.addEventListener("dragstart", event => {
        dragging = true;
        dragSource = item;
        item.classList.add("dragging");

        dragClone = item.cloneNode(true);
        dragClone.classList.add("drag-clone");
        document.body.appendChild(dragClone);
        dragClone.style.left = `${event.clientX - item.offsetWidth / 2}px`;
        dragClone.style.top = `${event.clientY - item.offsetHeight / 2}px`;

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", "");
      });

      item.addEventListener("dragend", () => {
        dragging = false;
        if (dragSource) dragSource.classList.remove("dragging");
        if (dragClone) dragClone.remove();
        dragClone = null;
        if (dropTarget) {
          dropTarget.querySelector('.drop-overlay').classList.remove('active');
          dropTarget = null;
        }
        dragSource = null;
        xstate.set(`xmasonry-state-${this.id}`, {
          order: this._getCurrentOrder(),
          collapsed: this._getCollapsedState()
        });
      });

      item.addEventListener("dragover", event => {
        event.preventDefault();
        if (!dragging || item === dragSource) return;
        if (dropTarget && dropTarget !== item) {
          dropTarget.querySelector('.drop-overlay').classList.remove('active');
        }
        item.querySelector('.drop-overlay').classList.add('active');
        dropTarget = item;
      });

      item.addEventListener("dragleave", () => {
        if (dropTarget) {
          dropTarget.querySelector('.drop-overlay').classList.remove('active');
          dropTarget = null;
        }
      });

      item.addEventListener("drop", event => {
        event.preventDefault();
        if (dragSource && dropTarget && dragSource !== dropTarget) {
          swapItems(dragSource, dropTarget);
          this._saveOrder();
          this._saveState?.();
        }
        if (dropTarget) {
          dropTarget.querySelector('.drop-overlay').classList.remove('active');
          dropTarget = null;
        }
        if (dragSource) dragSource.classList.remove("dragging");
        if (dragClone) dragClone.remove();
        dragClone = null;
        dragSource = null;
        xstate.set(`xmasonry-state-${this.id}`, {
          order: this._getCurrentOrder(),
          collapsed: this._getCollapsedState()
        });
      });
    });

    document.addEventListener("dragover", event => {
      if (dragClone) {
        dragClone.style.left = `${event.clientX - dragClone.offsetWidth / 2}px`;
        dragClone.style.top = `${event.clientY - dragClone.offsetHeight / 2}px`;
      }
    });

    let touchDragging = false;

    items.forEach(item => {
      item.addEventListener("touchstart", (e) => {
        if (e.touches.length > 1) return;
        touchDragging = true;
        dragging = true;
        dragSource = item;
        item.classList.add("dragging");

        dragClone = item.cloneNode(true);
        dragClone.classList.add("drag-clone");
        document.body.appendChild(dragClone);
        dragClone.style.left = `${e.touches[0].clientX - item.offsetWidth / 2}px`;
        dragClone.style.top = `${e.touches[0].clientY - item.offsetHeight / 2}px`;

        document.body.style.touchAction = "none";
      }, { passive: false });

      item.addEventListener("touchmove", (e) => {
        if (!touchDragging || !dragSource) return;
        e.preventDefault();
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        if (dragClone) {
          dragClone.style.left = `${touchX - dragClone.offsetWidth / 2}px`;
          dragClone.style.top = `${touchY - dragClone.offsetHeight / 2}px`;
        }
        let foundTarget = null;
        items.forEach(target => {
          if (target === dragSource) return;
          const rect = target.getBoundingClientRect();
          if (
            touchX > rect.left && touchX < rect.right &&
            touchY > rect.top && touchY < rect.bottom
          ) {
            foundTarget = target;
          }
          target.querySelector('.drop-overlay').classList.remove('active');
        });
        if (foundTarget) {
          foundTarget.querySelector('.drop-overlay').classList.add('active');
          dropTarget = foundTarget;
        } else {
          dropTarget = null;
        }
      }, { passive: false });

      item.addEventListener("touchend", (e) => {
        if (!touchDragging) return;
        touchDragging = false;
        dragging = false;
        item.classList.remove("dragging");
        if (dragClone) dragClone.remove();
        dragClone = null;
        document.body.style.touchAction = "";
        if (dropTarget && dragSource && dropTarget !== dragSource) {
          swapItems(dragSource, dropTarget);
          this._saveOrder();
          this._saveState?.();
        }
        items.forEach(it => it.querySelector('.drop-overlay').classList.remove('active'));
        dragSource = null;
        dropTarget = null;
        xstate.set(`xmasonry-state-${this.id}`, {
          order: this._getCurrentOrder(),
          collapsed: this._getCollapsedState()
        });
      });

      item.addEventListener("touchcancel", () => {
        touchDragging = false;
        dragging = false;
        item.classList.remove("dragging");
        if (dragClone) dragClone.remove();
        dragClone = null;
        document.body.style.touchAction = "";
        items.forEach(it => it.querySelector('.drop-overlay').classList.remove('active'));
        dragSource = null;
        dropTarget = null;
      });
    });
  }

  _observeThemeChange() {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute("data-theme");
      this.setAttribute("data-theme", theme);
    });

    const initialTheme = document.documentElement.getAttribute("data-theme");
    if (initialTheme) {
      this.setAttribute("data-theme", initialTheme);
    }

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-masonry",
      stateKey: `xmasonry-state-${this.id}`,
      schedule: "layout.reflow.commit",
      columns: this.getAttribute("columns") || "3",
      gap: this.getAttribute("gap") || "1.5rem",
      order: this._getCurrentOrder()
    };
  }
}

customElements.define("x-masonry", XMasonry);
