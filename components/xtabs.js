import { xstate } from './xstate.js';
import { createXtendRmtCommandDetail } from './rmt-command.js';

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
    return ["selected", "text-color", "orientation"];
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
        orientationAttribute: "orientation",
        labelAttribute: "name",
        labelAttributeAliases: ["label"],
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

  static get xtendNavigationRoutingUxProfile() {
    return {
      schema: "xtend.component.navigation-routing-ux-profile.v1",
      componentRef: "x-tabs",
      family: "tabbed-navigation",
      role: "tablist",
      navigationMode: "local-selected-panel",
      activeState: "aria-selected-and-selected-index",
      focusRestore: "roving-tabindex-preserves-selected-tab",
      routeAnnouncement: "delegated-to-router-or-tab-selected-event",
      keyboardNavigation: "arrow-left-right-up-down-home-end-enter-space",
      orientationModes: ["horizontal", "vertical"],
      events: ["xtend-command", "tab-selected"],
      commands: ["select-tab", "focus-next", "focus-previous", "snapshot"],
      stateKey: "xtabs-selected",
      schedule: "ui.user-blocking.tabs",
      stateSemantics: {
        states: ["active", "current", "selected", "hover", "focus", "disabled"],
        current: "aria-current=page-supported-for-route-tabs",
        selected: "aria-selected=true",
        disabled: "disabled-or-aria-disabled"
      },
      signatureDesign: {
        note: "Enterprise tabs with visible selected rail, wrapped labels and premium tokenized tab surfaces.",
        tokenStrategy: "shared --xtend-nav-* tokens feed x-tabs aliases while legacy tab tokens remain overrideable.",
        themeExpectation: "third-party themes can replace selected, hover, focus, disabled, typography, radius and indicator styling from CSS."
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
      overflowPolicy: "long-labels-wrap-with-overflow-wrap-anywhere",
      fabric: {
        lane: "user-blocking",
        routeLane: "transition",
        diagnosticsLane: "diagnostics"
      },
      rmt: XTabs.xtendRmtMetadata
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = 0;
    this._tabs = [];
    this._hasRenderedTabs = false;
    this._emptyTabsWarningEmitted = false;
    this._performanceSnapshots = [];
    this._instanceId = XTabs._nextInstanceId = (XTabs._nextInstanceId || 0) + 1;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --xtend-nav-surface: var(--xtend-surface-panel, var(--xtend-signature-surface-panel, Canvas));
          --xtend-nav-text: var(--xtend-text-primary, var(--xtend-text, CanvasText));
          --xtend-nav-border-color: var(--xtend-border-color, color-mix(in srgb, currentColor 18%, transparent));
          --xtend-nav-radius: var(--xtend-radius-panel, var(--xtend-radius, 0.75rem));
          --xtend-nav-gap: var(--xtend-space-2, 0.5rem);
          --xtend-nav-font-family: var(--xtend-font-family-control, var(--xtend-font-family, system-ui, sans-serif));
          --xtend-nav-font-size: var(--xtend-font-size-control, 1rem);
          --xtend-nav-active-surface: var(--xtend-color-action-subtle, var(--xtend-surface-inset, ButtonFace));
          --xtend-nav-active-text: var(--xtend-color-action, LinkText);
          --xtend-nav-current-indicator: var(--xtend-color-action, Highlight);
          --xtend-nav-hover-surface: var(--xtend-color-action-subtle, var(--xtend-surface-inset, ButtonFace));
          --xtend-nav-focus-ring: var(--xtend-focus-ring, var(--focus-outline, 2px solid Highlight));
          --xtend-nav-disabled-opacity: var(--xtend-disabled-opacity, 0.48);
          --xtend-tabs-surface: var(--xtend-nav-surface);
          --xtend-tabs-text: var(--xtend-nav-text);
          --xtend-tabs-border-color: var(--xtend-nav-border-color);
          --xtend-tabs-radius: var(--xtend-nav-radius);
          --xtend-tabs-gap: var(--xtend-nav-gap);
          --xtend-tabs-font-family: var(--xtend-nav-font-family);
          --xtend-tabs-font-size: var(--xtend-nav-font-size);
          --xtend-tabs-active-surface: var(--xtend-nav-active-surface);
          --xtend-tabs-active-text: var(--xtend-nav-active-text);
          --xtend-tabs-current-indicator: var(--xtend-nav-current-indicator);
          --xtend-tabs-hover-surface: var(--xtend-nav-hover-surface);
          --xtend-tabs-focus-ring: var(--xtend-nav-focus-ring);
          --xtend-tabs-disabled-opacity: var(--xtend-nav-disabled-opacity);
          --glass-bg: var(--xtend-tabs-surface);
          --glass-blur: 18px;
          --primary: var(--xtend-tabs-current-indicator);
          --primary-dark: var(--xtend-tabs-active-text);
          --accent: var(--xtend-tabs-text);
          --border-radius: var(--xtend-tabs-radius);
          --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
          --focus-outline: var(--xtend-tabs-focus-ring);
          --tab-bg: var(--glass-bg);
          --tab-active-bg: var(--xtend-tabs-active-surface);
          --tab-hover-bg: var(--xtend-tabs-hover-surface);
          --tab-border: 1.5px solid var(--xtend-tabs-border-color);
          --tab-radius: var(--xtend-tabs-radius);
          --tab-shadow: 0 2px 8px rgba(0,0,0,0.08);
          font-family: var(--xtend-tabs-font-family);
          color: var(--xtend-tabs-text);
        }
        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: var(--xtend-tabs-gap);
          border-bottom: 2px solid var(--xtend-tabs-current-indicator);
          overflow-y: hidden;
          align-items: center;
          background: var(--tab-bg);
          border-radius: var(--border-radius) var(--border-radius) 0 0;
          box-shadow: var(--shadow);
          padding: 0.3em 0.7em 0 0.7em;
          backdrop-filter: blur(var(--glass-blur));
        }
        .tab-panels {
          display: block;
          min-width: 0;
          min-height: 0;
        }
        :host([orientation="vertical"]) {
          display: grid;
          grid-template-columns: minmax(9rem, var(--xtend-tabs-vertical-nav-width, 30%)) minmax(0, 1fr);
          gap: var(--xtend-tabs-gap);
          align-items: stretch;
        }
        :host([orientation="vertical"]) .tabs {
          flex-direction: column;
          flex-wrap: nowrap;
          align-items: stretch;
          align-self: stretch;
          overflow-x: hidden;
          overflow-y: auto;
          border-bottom: 0;
          border-right: 2px solid var(--xtend-tabs-current-indicator);
          border-radius: var(--border-radius) 0 0 var(--border-radius);
          padding: 0.5em 0 0.5em 0.5em;
        }
        :host([orientation="vertical"]) .tab-panels {
          align-self: stretch;
          block-size: 100%;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
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
          font-size: var(--xtend-tabs-font-size);
          font-family: var(--xtend-tabs-font-family);
          box-sizing: border-box;
          line-height: 1.2;
          margin: 0;
          max-width: min(100%, var(--xtend-tabs-tab-max-width, 18rem));
          min-width: var(--xtend-tabs-tab-min-width, 7rem);
          min-height: var(--xtend-tabs-tab-min-height, 44px);
          overflow-wrap: anywhere;
          white-space: normal;
          box-shadow: var(--tab-shadow);
          transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s;
          outline: none;
          position: relative;
        }
        :host([orientation="vertical"]) .tabs button {
          width: 100%;
          max-width: none;
          border: var(--tab-border);
          border-right: none;
          border-radius: var(--tab-radius) 0 0 var(--tab-radius);
          text-align: left;
        }
        .tabs button[aria-selected="true"] {
          color: var(--primary);
          background: var(--tab-active-bg);
          border-bottom: 2.5px solid var(--primary);
          box-shadow: inset 0 -3px 0 var(--xtend-tabs-current-indicator), var(--tab-shadow);
          z-index: 2;
        }
        :host([orientation="vertical"]) .tabs button[aria-selected="true"] {
          border-bottom: var(--tab-border);
          border-right: 2.5px solid var(--primary);
          box-shadow: inset -3px 0 0 var(--xtend-tabs-current-indicator), var(--tab-shadow);
        }
        .tabs button:focus {
          outline: var(--focus-outline);
          outline-offset: 2px;
          z-index: 3;
        }
        .tabs button:hover {
          background: var(--tab-hover-bg);
          color: var(--primary-dark);
          transform: translateY(-1px);
        }
        .tabs button:disabled,
        .tabs button[aria-disabled="true"] {
          opacity: var(--xtend-tabs-disabled-opacity);
          cursor: not-allowed;
          transform: none;
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
          overflow-wrap: anywhere;
        }
        :host([orientation="vertical"]) ::slotted(x-tab) {
          box-sizing: border-box;
          block-size: 100%;
          max-block-size: 100%;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          min-width: 0;
          min-height: 0;
          overflow: auto;
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
        @media (prefers-reduced-motion: reduce) {
          .tabs button,
          ::slotted(x-tab) {
            animation: none !important;
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          .tabs {
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
            box-shadow: none;
          }
          .tabs button {
            background: Canvas;
            color: ButtonText;
            border: 1px solid ButtonText;
            box-shadow: none;
            forced-color-adjust: auto;
          }
          .tabs button[aria-selected="true"] {
            color: HighlightText;
            background: Highlight;
            outline: 2px solid Highlight;
            box-shadow: inset 0 -4px 0 CanvasText;
          }
          .tabs button:focus-visible {
            outline: 2px solid Highlight;
          }
        }
      </style>
      <div class="tabs" role="tablist"></div>
      <slot class="tab-panels"></slot>
    `;
  }

  connectedCallback() {
    const start = this._now();
    this._syncOrientation();
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
      const orientation = this._getOrientation();
      const nextKeys = orientation === "vertical" ? ["ArrowDown", "ArrowRight"] : ["ArrowRight"];
      const previousKeys = orientation === "vertical" ? ["ArrowUp", "ArrowLeft"] : ["ArrowLeft"];
      let handled = true;
      if (nextKeys.includes(e.key)) {
        e.preventDefault();
        this._activateTabFromKeyboard(this._resolveNextEnabledTabIndex(currentIndex, 1));
      } else if (previousKeys.includes(e.key)) {
        e.preventDefault();
        this._activateTabFromKeyboard(this._resolveNextEnabledTabIndex(currentIndex, -1));
      } else if (e.key === "Home") {
        e.preventDefault();
        this._activateTabFromKeyboard(this._resolveFirstEnabledTabIndex());
      } else if (e.key === "End") {
        e.preventDefault();
        this._activateTabFromKeyboard(this._resolveLastEnabledTabIndex());
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._activateTabFromKeyboard(currentIndex);
      } else {
        handled = false;
      }
      if (handled) {
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
      if (this._canUpdateSelection()) {
        this._updateSelection();
        xstate.set('xtabs-selected', this._selected); // State aktualisieren
      }
    } else if (name === "text-color" && newValue !== oldValue) {
      this._applyTextColor();
    } else if (name === "orientation" && newValue !== oldValue) {
      this._syncOrientation();
    }
  }

  _getOrientation() {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  _syncOrientation() {
    const header = this.shadowRoot.querySelector(".tabs");
    if (!header) return;
    header.setAttribute("aria-orientation", this._getOrientation());
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
      btn.textContent = tabEl.getAttribute("name") || tabEl.getAttribute("label") || `Tab ${i + 1}`;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("aria-controls", panelId);
      btn.setAttribute("tabindex", "-1");
      if (this._isTabElementDisabled(tabEl)) {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
      }
      btn.addEventListener("click", () => this.selectTab(i));
      header.appendChild(btn);
      return btn;
    });

    this._hasRenderedTabs = true;
    if (this._tabs.length === 0 && !this._emptyTabsWarningEmitted) {
      this._emptyTabsWarningEmitted = true;
      console.warn("No tabs found in <x-tabs>.");
    }

    this._updateSelection();
    this._recordPerformanceSnapshot("render", start, "renderUpdate");
  }

  _updateSelection() {
    if (!this._tabs || !Array.isArray(this._tabs) || this._tabs.length === 0) {
      if (this.isConnected && this._hasRenderedTabs && !this._emptyTabsWarningEmitted) {
        this._emptyTabsWarningEmitted = true;
        console.warn("Tabs are not initialized or empty.");
      }
      return;
    }

    if (this._tabs[this._selected] && this._isTabButtonDisabled(this._tabs[this._selected])) {
      const firstEnabled = this._resolveFirstEnabledTabIndex();
      this._selected = firstEnabled >= 0 ? firstEnabled : 0;
    }

    this._tabs.forEach((btn, i) => {
      btn.setAttribute("aria-selected", i === this._selected ? "true" : "false");
      btn.setAttribute("tabindex", !this._isTabButtonDisabled(btn) && i === this._selected ? "0" : "-1");
    });
    this._updateVisibility();
  }

  _canUpdateSelection() {
    return this._hasRenderedTabs && Array.isArray(this._tabs) && this._tabs.length > 0;
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
    if (this._isTabButtonDisabled(this._tabs[i])) {
      const firstEnabled = this._resolveFirstEnabledTabIndex();
      if (firstEnabled < 0) return;
      i = firstEnabled;
    }
    this._selected = i;
    this.setAttribute("selected", i);
    this._updateSelection();
    this.dispatchEvent(new CustomEvent("tab-selected", {
      detail: { index: i },
      bubbles: true,
      composed: true
    }));
    this.dispatchEvent(new CustomEvent("xtend-command", {
      detail: createXtendRmtCommandDetail(this, "tab-selected", { index: i, source: "x-tabs" }, { fallbackId: "x-tabs" }),
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    xstate.set('xtabs-selected', i); // State aktualisieren
    this._recordPerformanceSnapshot("tab-switch", start, "tabSwitch");
  }

  _activateTabFromKeyboard(index) {
    if (index < 0 || this._isTabButtonDisabled(this._tabs[index])) return;
    this.selectTab(index);
    const selectedTab = this._tabs[index];
    if (selectedTab && typeof selectedTab.focus === "function") {
      selectedTab.focus({ preventScroll: true });
    }
  }

  _isTabElementDisabled(tabEl) {
    return Boolean(tabEl && (
      tabEl.hasAttribute("disabled") ||
      tabEl.getAttribute("aria-disabled") === "true"
    ));
  }

  _isTabButtonDisabled(button) {
    return Boolean(button && (button.disabled || button.getAttribute("aria-disabled") === "true"));
  }

  _resolveFirstEnabledTabIndex() {
    return this._tabs.findIndex((button) => !this._isTabButtonDisabled(button));
  }

  _resolveLastEnabledTabIndex() {
    for (let index = this._tabs.length - 1; index >= 0; index -= 1) {
      if (!this._isTabButtonDisabled(this._tabs[index])) return index;
    }
    return -1;
  }

  _resolveNextEnabledTabIndex(index, direction) {
    if (!this._tabs.length) return -1;
    for (let offset = 1; offset <= this._tabs.length; offset += 1) {
      const candidateIndex = (index + (offset * direction) + this._tabs.length) % this._tabs.length;
      if (!this._isTabButtonDisabled(this._tabs[candidateIndex])) return candidateIndex;
    }
    return -1;
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
