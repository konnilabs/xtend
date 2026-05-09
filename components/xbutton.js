import { xstate } from './xstate.js';

const X_BUTTON_PERFORMANCE_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
const X_BUTTON_PERFORMANCE_SNAPSHOT_SCHEMA = 'xtend.component.performance-snapshot.v1';
const X_BUTTON_PERFORMANCE_MEASUREMENT_SCHEMA = 'xtend.performance.measurement.v1';
const X_BUTTON_STATE_SCHEMA = 'xtend.component.x-button.state.v1';

class XButton extends HTMLElement {
  static get observedAttributes() {
    return ["disabled", "label", "variant", "size", "icon", "loading", "overlay", "aria-label", "aria-busy"];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-button',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-js-with-enterprise-profile.v1',
        state: 'js-runtime-profiled',
        sourcePath: 'components/xbutton.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xbutton.js',
        declaration: 'components/xbutton.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'user-blocking',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-button',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: [
        'component.visible.mount',
        'component.visible.hydrate',
        'ui.user-blocking.interaction',
        'a11y.user-blocking.preference',
        'diagnostics.snapshot'
      ],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      performance: {
        profile: XButton.xtendScaffoldPerformanceProfile,
        coalesceKey: 'x-button:interaction'
      },
      shellAuthoring: {
        schema: 'xtend.rmt.shell-authoring.component.v1',
        host: 'x-button',
        attributes: ['variant', 'size', 'disabled', 'loading', 'aria-label'],
        events: ['click', 'button-interaction', 'loading-start', 'loading-end']
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-button',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'keyboard', 'busy-toggle', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry',
      fabric: {
        lane: 'user-blocking',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: X_BUTTON_PERFORMANCE_PROFILE_SCHEMA,
      componentRef: 'x-button',
      profiles: ['interactive'],
      primaryProfile: 'interactive',
      budgetClass: 'interactive-small',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      budgetsMs: {
        mount: 18,
        hydrate: 22,
        renderUpdate: 12,
        eventAction: 8,
        keyboardAction: 8,
        busyToggle: 12,
        stateSync: 6
      },
      criticalMeasurements: [
        'xtend.component.hydrate',
        'xtend.component.render',
        'xtend.component.update',
        'xtend.event.handler',
        'xtend.interaction.click',
        'xtend.interaction.keyboard'
      ],
      interaction: {
        clickBudgetMs: 8,
        keyboardBudgetMs: 8,
        busyToggleBudgetMs: 12,
        touchTargetMinPx: 44,
        focusVisibleRequired: true,
        disabledBusyGuards: true
      },
      cleanup: ['button-event-listeners', 'xstate-state'],
      rmt: {
        scheduleRefs: ['component.visible.hydrate', 'ui.user-blocking.interaction', 'diagnostics.snapshot'],
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        lane: 'user-blocking',
        diagnosticsLane: 'diagnostics',
        measurementEvent: 'button-performance-measured',
        snapshotPath: 'xtend.component.x-button.performanceSnapshot'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: "xtend.a11y.motion-contrast-policy.v1",
      componentRef: "x-button",
      motion: {
        schema: "xtend.a11y.motion-policy.v1",
        mediaQuery: "(prefers-reduced-motion: reduce)",
        reducedMotion: "required",
        animationPolicy: "no-essential-motion",
        noMotionOnlyState: true
      },
      contrast: {
        schema: "xtend.a11y.contrast-policy.v1",
        mediaQuery: "(forced-colors: active)",
        highContrast: "required",
        forcedColorAdjust: "auto",
        focusVisible: "required",
        nonColorStatus: "required"
      },
      fabric: {
        lane: "a11y",
        fiberKind: "a11y.preference",
        scheduleRef: "a11y.user-blocking.preference"
      }
    };
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          all: unset;
          position: relative;
          background: rgba(40, 60, 120, 0.25);
          color: var(--button-text-color, #fff);
          border-radius: 1.2em;
          padding: 0.6em 1.6em;
          font-size: 1em;
          font-weight: 500;
          text-align: center;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6em;
          box-sizing: border-box;
          min-width: var(--xtend-button-min-touch-target, 44px);
          min-height: var(--xtend-button-min-touch-target, 44px);
          box-shadow: 0 4px 24px 0 rgba(40,60,120,0.10), 0 1.5px 6px 0 rgba(40,60,120,0.08);
          backdrop-filter: blur(12px) saturate(1.2);
          transition: background 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s, filter 0.2s;
          outline: none;
          border: none;
          overflow: hidden;
        }
        button.primary {
          background: linear-gradient(135deg, rgba(0,123,255,0.35) 0%, rgba(0,123,255,0.18) 100%);
          color: #fff;
        }
        button.secondary {
          background: linear-gradient(135deg, rgba(108,117,125,0.35) 0%, rgba(108,117,125,0.18) 100%);
          color: #fff;
        }
        button.danger {
          background: linear-gradient(135deg, rgba(220,53,69,0.35) 0%, rgba(220,53,69,0.18) 100%);
          color: #fff;
        }
        button.small {
          font-size: 0.85em;
          padding: 0.3em 1em;
          min-height: var(--xtend-button-small-min-touch-target, 40px);
        }
        button.large {
          font-size: 1.2em;
          padding: 0.9em 2em;
        }
        button[aria-busy="true"] {
          pointer-events: none;
          opacity: 0.7;
        }
        button:focus-visible {
          outline: 2.5px solid var(--focus-color, #80bfff);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(0,123,255,0.12);
        }
        button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          filter: grayscale(0.2);
        }
        button:hover:not(:disabled),
        button:active:not(:disabled) {
          background: rgba(40,60,120,0.32);
          box-shadow: 0 6px 32px 0 rgba(40,60,120,0.16), 0 2px 8px 0 rgba(40,60,120,0.10);
          filter: brightness(1.08) saturate(1.1);
        }
        .icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.3em;
          height: 1.3em;
        }
        .spinner {
          width: 1.2em; height: 1.2em;
          display: inline-block;
          border: 2.5px solid rgba(255,255,255,0.18);
          border-top: 2.5px solid var(--primary-color, #007bff);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-left: 0.3em;
          background: transparent;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          button {
            transition: none !important;
          }
          .spinner { animation: none !important; }
        }
        @media (forced-colors: active) {
          button {
            forced-color-adjust: auto;
            color: ButtonText;
            background: ButtonFace;
            border: 1px solid ButtonText;
            box-shadow: none;
            filter: none;
          }
          button:focus-visible {
            outline-color: Highlight;
            box-shadow: none;
          }
          button[aria-busy="true"]::after {
            content: " loading";
          }
          .spinner {
            border-color: ButtonText;
            border-top-color: Highlight;
          }
        }
      </style>
      <button part="button" type="button" role="button" aria-disabled="false" aria-busy="false">
        <span class="icon" part="icon"></span>
        <span class="label" part="label"><slot><span class="fallback-label" part="label-fallback"></span></slot></span>
        <span class="spinner" part="spinner" style="display:none"></span>
      </button>
    `;
    this._btn = shadow.querySelector("button");
    this._icon = shadow.querySelector(".icon");
    this._slot = shadow.querySelector("slot");
    this._fallbackLabel = shadow.querySelector(".fallback-label");
    this._spinner = shadow.querySelector(".spinner");
    this._unsubscribeState = null;
    this._eventsForwarded = false;
    this._lastLoading = null;
    this._performanceMeasurements = [];
    this._performanceCounters = {
      mounts: 0,
      renders: 0,
      interactions: 0,
      keyboardInteractions: 0,
      busyTransitions: 0,
      ignoredInteractions: 0
    };
    this._onButtonClick = this._handleButtonClick.bind(this);
    this._onButtonFocus = this._handleButtonFocus.bind(this);
    this._onButtonBlur = this._handleButtonBlur.bind(this);
    this._onButtonKeydown = this._handleButtonKeydown.bind(this);
  }

  connectedCallback() {
    const start = this._now();
    this._upgradeAttributes();
    this._forwardEvents();
    if (!this.id) this.id = `xbutton-${Math.random().toString(36).slice(2, 10)}`;
    this._renderButton();
    this._syncState('mount');
    this._performanceCounters.mounts += 1;
    this._recordPerformanceMeasurement('xtend.component.hydrate', 'hydrate', start);
    // Observe slot changes
    if (this._slot) {
      this._slot.addEventListener("slotchange", () => this._syncLabelFallback());
    }
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
    this._removeForwardedEvents();
  }

  attributeChangedCallback(name, _, newValue) {
    const start = this._now();
    if (["disabled", "label", "variant", "size", "icon", "loading", "aria-label", "aria-busy"].includes(name)) {
      this._renderButton();
      this._performanceCounters.renders += 1;
      this._recordPerformanceMeasurement(
        name === 'loading' || name === 'aria-busy' ? 'xtend.component.busy-toggle' : 'xtend.component.update',
        name === 'loading' || name === 'aria-busy' ? 'busyToggle' : 'renderUpdate',
        start,
        { attributeName: name, value: newValue }
      );
    }
    this._syncState(`attribute:${name}`);
  }

  _renderButton() {
    // Disabled
    const loading = this.hasAttribute("loading");
    const isBusy = this._isBusy();
    const isDisabled = this.hasAttribute("disabled") || loading;
    this._btn.disabled = isDisabled;
    this._btn.setAttribute("aria-disabled", isDisabled);
    this._syncLabelFallback();
    // Variant
    const variant = this.getAttribute("variant") || "primary";
    this._btn.className = variant;
    // Size
    const size = this.getAttribute("size");
    if (size) this._btn.classList.add(size);
    // Icon (SVG inline)
    const icon = this.getAttribute("icon");
    if (icon && icon.startsWith('<svg')) {
      this._icon.innerHTML = icon;
      this._icon.style.display = "inline-flex";
    } else if (icon) {
      this._icon.innerHTML = `<img src="${icon}" alt="" style="width:1.2em;height:1.2em;">`;
      this._icon.style.display = "inline-flex";
    } else {
      this._icon.innerHTML = "";
      this._icon.style.display = "none";
    }
    // Loading
    this._btn.setAttribute("aria-busy", isBusy);
    this._spinner.style.display = loading ? "inline-block" : "none";
    if (this._lastLoading !== loading) {
      this._lastLoading = loading;
      this._performanceCounters.busyTransitions += 1;
      this.dispatchEvent(new CustomEvent(loading ? "loading-start" : "loading-end", {
        detail: this._createStateDetail(),
        bubbles: true,
        composed: true
      }));
    }
    // aria-label
    if (this.hasAttribute("aria-label")) {
      this._btn.setAttribute("aria-label", this.getAttribute("aria-label"));
    }
    // aria-busy
    if (this.hasAttribute("aria-busy")) {
      this._btn.setAttribute("aria-busy", this.getAttribute("aria-busy"));
    }
  }

  _upgradeAttributes() {
    if (this.hasAttribute("disabled")) {
      this._btn.disabled = true;
      this._btn.setAttribute("aria-disabled", "true");
    }
  }

  _getFallbackLabel() {
    return this.getAttribute("label") || this.getAttribute("aria-label") || "Click";
  }

  _syncLabelFallback() {
    if (!this._fallbackLabel) return;
    this._fallbackLabel.textContent = this._getFallbackLabel();
  }

  _forwardEvents() {
    if (this._eventsForwarded) return;
    this._eventsForwarded = true;
    this._btn.addEventListener("click", this._onButtonClick);
    this._btn.addEventListener("focus", this._onButtonFocus);
    this._btn.addEventListener("blur", this._onButtonBlur);
    this._btn.addEventListener("keydown", this._onButtonKeydown);
  }

  _removeForwardedEvents() {
    if (!this._eventsForwarded) return;
    this._eventsForwarded = false;
    this._btn.removeEventListener("click", this._onButtonClick);
    this._btn.removeEventListener("focus", this._onButtonFocus);
    this._btn.removeEventListener("blur", this._onButtonBlur);
    this._btn.removeEventListener("keydown", this._onButtonKeydown);
  }

  _handleButtonClick(event) {
    const start = this._now();
    if (this._isInteractionBlocked()) {
      this._performanceCounters.ignoredInteractions += 1;
      this._recordPerformanceMeasurement('xtend.interaction.blocked', 'eventAction', start, { source: 'click' });
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this._performanceCounters.interactions += 1;
    const measurement = this._recordPerformanceMeasurement('xtend.interaction.click', 'eventAction', start, { source: 'click' });
    this._syncState('interaction:click');
    this.dispatchEvent(new CustomEvent("click", { detail: event }));
    this.dispatchEvent(new CustomEvent("button-interaction", {
      detail: this._createInteractionDetail('click', measurement),
      bubbles: true,
      composed: true
    }));
  }

  _handleButtonFocus(event) {
    this.dispatchEvent(new CustomEvent("focus", { detail: event }));
  }

  _handleButtonBlur(event) {
    this.dispatchEvent(new CustomEvent("blur", { detail: event }));
  }

  _handleButtonKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const start = this._now();
    if (this._isInteractionBlocked()) {
      this._performanceCounters.ignoredInteractions += 1;
      this._recordPerformanceMeasurement('xtend.interaction.keyboard.blocked', 'keyboardAction', start, { key: event.key });
      return;
    }
    this._performanceCounters.keyboardInteractions += 1;
    const measurement = this._recordPerformanceMeasurement('xtend.interaction.keyboard', 'keyboardAction', start, { key: event.key });
    this.dispatchEvent(new CustomEvent("button-interaction", {
      detail: this._createInteractionDetail('keyboard', measurement, { key: event.key }),
      bubbles: true,
      composed: true
    }));
  }

  _isBusy() {
    return this.hasAttribute("loading") || this.getAttribute("aria-busy") === "true";
  }

  _isInteractionBlocked() {
    return this.hasAttribute("disabled") || this.hasAttribute("loading");
  }

  _createStateDetail() {
    return {
      schema: X_BUTTON_STATE_SCHEMA,
      id: this.id,
      disabled: this.hasAttribute("disabled"),
      loading: this.hasAttribute("loading"),
      busy: this._isBusy(),
      label: this.getAttribute("label") || this.textContent.trim() || this.getAttribute("aria-label") || "Click",
      variant: this.getAttribute("variant") || "primary",
      size: this.getAttribute("size") || "normal"
    };
  }

  _syncState(reason = 'update') {
    if (!this.id) return;
    xstate.set(`xbutton-state-${this.id}`, {
      ...this._createStateDetail(),
      reason,
      performanceProfile: XButton.xtendScaffoldPerformanceProfile,
      performanceSnapshot: this.snapshotPerformance()
    });
  }

  _now() {
    return typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }

  _resolvePerformanceBudget(budgetKey) {
    return XButton.xtendScaffoldPerformanceProfile.budgetsMs[budgetKey] || null;
  }

  _recordPerformanceMeasurement(name, budgetKey, startTime, detail = {}) {
    const durationMs = Math.max(0, this._now() - startTime);
    const budgetMs = this._resolvePerformanceBudget(budgetKey);
    const measurement = {
      schema: X_BUTTON_PERFORMANCE_MEASUREMENT_SCHEMA,
      componentRef: "x-button",
      id: this.id || null,
      name,
      budgetKey,
      durationMs,
      budgetMs,
      withinBudget: typeof budgetMs === "number" ? durationMs <= budgetMs : true,
      lane: XButton.xtendScaffoldPerformanceProfile.lane,
      detail
    };
    this._performanceMeasurements.push(measurement);
    if (this._performanceMeasurements.length > 20) {
      this._performanceMeasurements.splice(0, this._performanceMeasurements.length - 20);
    }
    this.dispatchEvent(new CustomEvent("button-performance-measured", {
      detail: measurement,
      bubbles: true,
      composed: true
    }));
    return measurement;
  }

  _createInteractionDetail(type, measurement, extra = {}) {
    return {
      schema: "xtend.component.x-button.interaction.v1",
      id: this.id,
      type,
      lane: XButton.xtendScaffoldPerformanceProfile.lane,
      disabled: this.hasAttribute("disabled"),
      busy: this._isBusy(),
      measurement,
      ...extra
    };
  }

  getPerformanceBudget() {
    return { ...XButton.xtendScaffoldPerformanceProfile.budgetsMs };
  }

  getInteractionBudget() {
    return { ...XButton.xtendScaffoldPerformanceProfile.interaction };
  }

  snapshotPerformance() {
    return {
      schema: X_BUTTON_PERFORMANCE_SNAPSHOT_SCHEMA,
      componentRef: "x-button",
      id: this.id || null,
      lane: XButton.xtendScaffoldPerformanceProfile.lane,
      hydrationPolicy: XButton.xtendScaffoldPerformanceProfile.hydrationPolicy,
      counters: { ...this._performanceCounters },
      budgetsMs: this.getPerformanceBudget(),
      measurements: this._performanceMeasurements.slice(-10)
    };
  }

  setLoading(loading, options = {}) {
    if (loading) {
      this.setAttribute("loading", "");
    } else {
      this.removeAttribute("loading");
    }
    if (options.sync !== false) {
      this._syncState("api:set-loading");
    }
  }
}

customElements.define("x-button", XButton);
// TypeScript-Hinweis: Typdefinitionen für Attribute und Events empfohlen.
