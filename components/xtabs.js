import { xstate } from './xstate.js';

// <x-tab> – Without Shadow DOM
class XTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<slot></slot>`;
  }
}
customElements.define("x-tab", XTab);

// <x-tabs> – Fully Updated
class XTabs extends HTMLElement {
  static get observedAttributes() {
    return ["selected", "text-color"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-tabs",
      maturity: "stable",
      source: {
        strategy: "xtend.legacy-js-with-enterprise-profile.v1",
        state: "js-runtime-profiled",
        sourcePath: "components/xtabs.js"
      },
      runtime: {
        format: "esm",
        artifact: "components/xtabs.js",
        declaration: "components/xtabs.d.ts",
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: "xtend.component",
        kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
      },
      fabric: {
        api: "@xtend-fabric",
        defaultLane: "user-blocking",
        routeLane: "transition"
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      tag: "x-tabs",
      schedules: [
        "component.visible.mount",
        "component.visible.hydrate",
        "ui.user-blocking.tabs",
        "route.transition.tab",
        "diagnostics.snapshot"
      ],
      hydration: { policy: "visible", lane: "user-blocking" },
      performance: {
        profile: XTabs.xtendScaffoldPerformanceProfile,
        coalesceKey: "x-tabs:selected"
      },
      shellAuthoring: {
        schema: "xtend.rmt.shell-authoring.component.v1",
        host: "x-tabs",
        child: "x-tab",
        selectedAttribute: "selected",
        labelAttribute: "name",
        event: "tab-selected"
      },
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: "xtend.component.lifecycle-telemetry.v1",
      componentRef: "x-tabs",
      operations: ["mount", "hydrate", "render", "update", "event", "tab-switch", "keyboard", "unmount"],
      snapshotPath: "snapshot.componentTelemetry",
      fabric: {
        lane: "user-blocking",
        routeLane: "transition",
        diagnosticsLane: "diagnostics"
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      componentRef: "x-tabs",
      profiles: ["interactive", "routing"],
      primaryProfile: "interactive",
      budgetClass: "critical",
      lane: "user-blocking",
      hydrationPolicy: "visible",
      budgetsMs: {
        loadDefine: 50,
        mount: 28,
        hydrate: 36,
        renderUpdate: 28,
        eventAction: 16,
        tabSwitch: 16,
        keyboardAction: 16
      },
      criticalMeasurements: [
        "xtend.component.hydrate",
        "xtend.component.render",
        "xtend.component.update",
        "xtend.event.handler",
        "xtend.route.render"
      ],
      cleanup: ["xstate-subscription", "mutation-observer", "keyboard-listener"],
      rmt: {
        scheduleRefs: ["component.visible.hydrate", "ui.user-blocking.tabs", "route.transition.tab"],
        kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
      }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = 0;
    this._tabs = [];
    this._performanceSnapshots = [];
    this._instanceId = XTabs._nextInstanceId = (XTabs._nextInstanceId || 0) + 1;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --glass-bg: rgba(30, 34, 44, 0.55);
          --glass-blur: 18px;
          --primary: #4fc3f7;
          --primary-dark: #0288d1;
          --accent: #fff;
          --border-radius: 18px;
          --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
          --focus-outline: 2px solid var(--primary);
          --tab-bg: var(--glass-bg);
          --tab-active-bg: rgba(79,195,247,0.10);
          --tab-hover-bg: rgba(79,195,247,0.18);
          --tab-border: 1.5px solid rgba(255,255,255,0.12);
          --tab-radius: 1.2em;
          --tab-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .tabs {
          display: flex;
          gap: 0.5em;
          border-bottom: 2px solid var(--primary);
          overflow-y: hidden;
          align-items: center;
          background: var(--tab-bg);
          border-radius: var(--border-radius) var(--border-radius) 0 0;
          box-shadow: var(--shadow);
          padding: 0.3em 0.7em 0 0.7em;
          backdrop-filter: blur(var(--glass-blur));
        }
        .tabs button {
          background: var(--tab-bg);
          border: var(--tab-border);
          border-bottom: none;
          border-radius: var(--tab-radius) var(--tab-radius) 0 0;
          padding: 0.7em 2em 0.7em 2em;
          cursor: pointer;
          color: var(--text-color, var(--accent));
          font-weight: 600;
          font-size: clamp(0.95rem, 1vw, 1.2rem);
          box-sizing: border-box;
          line-height: 1.2;
          margin: 0;
          box-shadow: var(--tab-shadow);
          transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s;
          outline: none;
          position: relative;
        }
        .tabs button[aria-selected="true"] {
          color: var(--primary);
          background: var(--tab-active-bg);
          border-bottom: 2.5px solid var(--primary);
          z-index: 2;
        }
        .tabs button:focus {
          outline: var(--focus-outline);
          outline-offset: 2px;
          z-index: 3;
        }
        .tabs button:hover {
          background: var(--tab-hover-bg);
          color: var(--primary-dark);
          transform: scale(1.06);
        }
        .tabs button svg {
          width: 1.1em;
          height: 1.1em;
          margin-right: 0.5em;
          vertical-align: middle;
        }
        ::slotted(x-tab) {
          display: none;
          overflow-y: auto;
          height: 100%;
          background: var(--glass-bg);
          border-radius: 0 0 var(--border-radius) var(--border-radius);
          box-shadow: var(--shadow);
          padding: 1.2em 1.5em;
          animation: fadeInTab 0.25s cubic-bezier(.4,1.4,.6,1);
        }
        ::slotted(x-tab.active) {
          display: block;
        }
        :host(.fixed-height) {
          height: var(--fixed-tab-height, 300px);
          overflow: hidden;
        }
        :host(.fixed-height) ::slotted(x-tab) {
          height: 100%;
        }
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div class="tabs" role="tablist"></div>
      <slot></slot>
    `;
  }

  connectedCallback() {
    const start = this._now();
    this._renderTabs();
    this._updateVisibility();
    // Textfarbe aus Attribut oder CSS-Variable setzen
    this._applyTextColor();
    // Fallback: Wenn kein Attribut gesetzt, aber eine CSS-Variable existiert, diese übernehmen
    if (!this.hasAttribute('text-color')) {
      const cssColor = getComputedStyle(this).getPropertyValue('--text-color');
      if (cssColor) {
        this.shadowRoot.host.style.setProperty('--text-color', cssColor.trim());
      }
    }

    // State initialisieren
    xstate.set('xtabs-selected', this._selected);

    // State-Änderungen abonnieren (z.B. Tab-Wechsel von außen)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === 'xtabs-selected' && typeof value === 'number' && value !== this._selected) {
        this.selectTab(value);
      }
    });

    // Observe slot changes
    this._observer = new MutationObserver(() => {
      this._renderTabs();
    });
    this._observer.observe(this, { childList: true });

    // Add keyboard navigation
    this._keyboardHandler = (e) => {
      const keyStart = this._now();
      if (!Array.isArray(this._tabs) || this._tabs.length === 0) {
        return;
      }
      const focusedIndex = this._tabs.indexOf(e.target);
      const currentIndex = focusedIndex >= 0 ? focusedIndex : this._selected;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        this._activateTabFromKeyboard((currentIndex + 1) % this._tabs.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this._activateTabFromKeyboard((currentIndex - 1 + this._tabs.length) % this._tabs.length);
      } else if (e.key === "Home") {
        e.preventDefault();
        this._activateTabFromKeyboard(0);
      } else if (e.key === "End") {
        e.preventDefault();
        this._activateTabFromKeyboard(this._tabs.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._activateTabFromKeyboard(currentIndex);
      }
      if (["ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].includes(e.key)) {
        this._recordPerformanceSnapshot("keyboard", keyStart, "keyboardAction");
      }
    };
    this.shadowRoot.querySelector(".tabs").addEventListener("keydown", this._keyboardHandler);
    this._recordPerformanceSnapshot("hydrate", start, "hydrate");
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
    if (this._keyboardHandler) {
      this.shadowRoot.querySelector(".tabs").removeEventListener("keydown", this._keyboardHandler);
    }
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "selected" && newValue !== oldValue) {
      this._selected = parseInt(newValue);
      this._updateSelection();
      xstate.set('xtabs-selected', this._selected); // State aktualisieren
    } else if (name === "text-color" && newValue !== oldValue) {
      this._applyTextColor();
    }
  }

  _renderTabs() {
    const start = this._now();
    const header = this.shadowRoot.querySelector(".tabs");
    header.innerHTML = "";
    this._tabs = Array.from(this.querySelectorAll("x-tab")).map((tabEl, i) => {
      const baseId = this.id || `xtabs-${this._instanceId}`;
      const panelId = tabEl.id || `${baseId}-panel-${i + 1}`;
      const buttonId = `${baseId}-tab-${i + 1}`;
      tabEl.id = panelId;
      tabEl.setAttribute("role", "tabpanel");
      tabEl.setAttribute("aria-labelledby", buttonId);
      const btn = document.createElement("button");
      btn.id = buttonId;
      btn.textContent = tabEl.getAttribute("name") || `Tab ${i + 1}`;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("aria-controls", panelId);
      btn.setAttribute("tabindex", "-1");
      btn.addEventListener("click", () => this.selectTab(i));
      header.appendChild(btn);
      return btn;
    });

    if (this._tabs.length === 0) {
      console.warn("No tabs found in <x-tabs>.");
    }

    this._updateSelection();
    this._recordPerformanceSnapshot("render", start, "renderUpdate");
  }

  _updateSelection() {
    if (!this._tabs || !Array.isArray(this._tabs) || this._tabs.length === 0) {
      console.warn("Tabs are not initialized or empty.");
      return;
    }

    this._tabs.forEach((btn, i) => {
      btn.setAttribute("aria-selected", i === this._selected ? "true" : "false");
      btn.setAttribute("tabindex", i === this._selected ? "0" : "-1");
    });
    this._updateVisibility();
  }

  _updateVisibility() {
    this.querySelectorAll("x-tab").forEach((tabEl, i) => {
      const isActive = i === this._selected;
      tabEl.classList.toggle("active", isActive);
      tabEl.toggleAttribute("hidden", !isActive);
      tabEl.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
  }

  _applyTextColor() {
    const textColor = this.getAttribute("text-color");
    if (textColor) {
      this.shadowRoot.host.style.setProperty("--text-color", textColor);
    } else {
      this.shadowRoot.host.style.removeProperty("--text-color");
    }
  }

  selectTab(i) {
    const start = this._now();
    if (i < 0 || i >= this._tabs.length) {
      console.warn(`Invalid tab index: ${i}. Defaulting to the first tab.`);
      i = 0;
    }
    this._selected = i;
    this.setAttribute("selected", i);
    this._updateSelection();
    this.dispatchEvent(new CustomEvent("tab-selected", {
      detail: { index: i },
      bubbles: true,
      composed: true
    }));
    xstate.set('xtabs-selected', i); // State aktualisieren
    this._recordPerformanceSnapshot("tab-switch", start, "tabSwitch");
  }

  _activateTabFromKeyboard(index) {
    this.selectTab(index);
    const selectedTab = this._tabs[index];
    if (selectedTab && typeof selectedTab.focus === "function") {
      selectedTab.focus({ preventScroll: true });
    }
  }

  getPerformanceBudget() {
    return XTabs.xtendScaffoldPerformanceProfile.budgetsMs;
  }

  snapshotPerformance() {
    return {
      schema: "xtend.component.performance-snapshot.v1",
      source: "x-tabs",
      budget: this.getPerformanceBudget(),
      lane: XTabs.xtendScaffoldPerformanceProfile.lane,
      hydrationPolicy: XTabs.xtendScaffoldPerformanceProfile.hydrationPolicy,
      measurements: this._performanceSnapshots.slice(-10)
    };
  }

  _now() {
    return typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }

  _recordPerformanceSnapshot(phase, start, budgetKey) {
    const budget = XTabs.xtendScaffoldPerformanceProfile.budgetsMs[budgetKey] || null;
    const durationMs = Math.max(0, this._now() - start);
    this._performanceSnapshots.push({
      schema: "xtend.performance.measurement.v1",
      componentRef: "x-tabs",
      phase,
      lane: XTabs.xtendScaffoldPerformanceProfile.lane,
      budgetKey,
      budgetMs: budget,
      durationMs,
      status: budget === null || durationMs <= budget ? "ok" : "warn"
    });
    if (this._performanceSnapshots.length > 20) {
      this._performanceSnapshots.splice(0, this._performanceSnapshots.length - 20);
    }
  }
}

customElements.define("x-tabs", XTabs);
