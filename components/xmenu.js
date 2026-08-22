import { xtendState } from './xtend-state.js';
import { createXtendRmtCommandDetail } from './rmt-command.js';

const X_MENU_PERFORMANCE_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
const X_MENU_PERFORMANCE_SNAPSHOT_SCHEMA = 'xtend.component.performance-snapshot.v1';
const X_MENU_PERFORMANCE_MEASUREMENT_SCHEMA = 'xtend.performance.measurement.v1';
const X_MENU_STATE_SCHEMA = 'xtend.component.x-menu.state.v1';

// <x-menu>
class XMenu extends HTMLElement {
  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-menu',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-js-with-enterprise-profile.v1',
        state: 'js-runtime-profiled',
        sourcePath: 'components/xmenu.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xmenu.js',
        declaration: 'components/xmenu.d.ts',
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
        routeLane: 'transition',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-menu',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: [
        'component.visible.mount',
        'component.visible.hydrate',
        'ui.user-blocking.navigation',
        'route.transition.navigate',
        'route.visible.render',
        'diagnostics.snapshot'
      ],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      performance: {
        profile: XMenu.xtendScaffoldPerformanceProfile,
        coalesceKey: 'x-menu:navigation'
      },
      shellAuthoring: {
        schema: 'xtend.rmt.shell-authoring.component.v1',
        host: 'x-menu',
        accepts: ['a', 'button', 'x-link', '[role=menuitem]'],
        stateKey: 'xmenu-active',
        events: ['xtend-command', 'menu-item-clicked', 'menu-navigate', 'menu-keyboard-navigation'],
        routeBinding: 'href-to-xrouter-navigation',
        orientation: ['horizontal', 'vertical']
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-menu',
      operations: ['mount', 'hydrate', 'render', 'slotchange', 'keyboard', 'navigate', 'state-sync', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry',
      fabric: {
        lane: 'user-blocking',
        routeLane: 'transition',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-menu',
      role: 'menubar',
      accessibleName: 'aria-label-or-nav-context',
      keyboardNavigation: 'roving-tabindex',
      activeState: 'aria-current=page',
      screenreader: {
        signalContract: XMenu.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XMenu.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: X_MENU_PERFORMANCE_PROFILE_SCHEMA,
      componentRef: 'x-menu',
      profiles: ['interactive', 'routing'],
      primaryProfile: 'interactive',
      budgetClass: 'navigation-small',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      budgetsMs: {
        mount: 24,
        hydrate: 32,
        slotchange: 18,
        renderUpdate: 18,
        keyboardAction: 10,
        routeActivation: 14,
        stateSync: 8
      },
      criticalMeasurements: [
        'xtend.component.hydrate',
        'xtend.component.render',
        'xtend.component.slotchange',
        'xtend.interaction.keyboard',
        'xtend.route.navigate',
        'xtend.state.sync'
      ],
      interaction: {
        keyboardBudgetMs: 10,
        routeActivationBudgetMs: 14,
        touchTargetMinPx: 44,
        rovingTabindexRequired: true,
        xLinkCompatible: true,
        xRouterCompatible: true
      },
      cleanup: ['slotchange-listener', 'item-listeners', 'xtend-state-subscription', 'route-listeners'],
      rmt: {
        scheduleRefs: ['component.visible.hydrate', 'ui.user-blocking.navigation', 'route.transition.navigate', 'diagnostics.snapshot'],
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        lane: 'user-blocking',
        routeLane: 'transition',
        diagnosticsLane: 'diagnostics',
        measurementEvent: 'menu-performance-measured',
        snapshotPath: 'xtend.component.x-menu.performanceSnapshot'
      }
    };
  }

  static get xtendNavigationRoutingUxProfile() {
    return {
      schema: 'xtend.component.navigation-routing-ux-profile.v1',
      componentRef: 'x-menu',
      family: 'menubar-navigation',
      role: 'menubar',
      navigationMode: 'hash-or-history',
      activeState: 'route-current-separated-from-roving-focus',
      focusRestore: 'roving-tabindex-preserves-focused-item',
      routeAnnouncement: 'delegated-to-x-router',
      keyboardNavigation: 'arrow-home-end-enter-space',
      events: ['xtend-command', 'menu-item-clicked', 'menu-navigate', 'menu-keyboard-navigation'],
      commands: ['activate-item', 'focus-next', 'focus-previous', 'sync-route', 'snapshot'],
      stateKey: 'xmenu-active',
      schedule: 'ui.user-blocking.navigation',
      fabric: {
        lane: 'user-blocking',
        routeLane: 'transition',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XMenu.xtendRmtMetadata,
      routerCompatibility: {
        xLinkHosts: true,
        xRouterNavigateEvent: 'x-navigate',
        xRouterStateSignal: 'router-navigate',
        scheduleRef: 'route.transition.navigate'
      },
      stateSemantics: {
        states: ['active', 'current', 'selected', 'hover', 'focus', 'disabled'],
        current: 'aria-current=page',
        focus: 'focusIndex-and-roving-tabindex-without-current-page-semantics',
        selected: 'aria-selected=true-supported-for-composite-hosts',
        disabled: 'disabled-or-aria-disabled'
      },
      disclosureControls: {
        nestedMenus: 'icon-controls-only',
        managedPart: 'disclosure-icon control icon'
      },
      signatureDesign: {
        note: 'Enterprise menubar with quiet shell rhythm, visible current-route rail and tokenized premium navigation states.',
        tokenStrategy: 'shared --xtend-nav-* tokens feed x-menu aliases before component-specific overrides.',
        themeExpectation: 'third-party themes can replace active, hover, focus, disabled, typography, radius and disclosure icon styling from CSS.'
      },
      themeTokens: [
        '--xtend-nav-surface',
        '--xtend-nav-text',
        '--xtend-nav-border-color',
        '--xtend-nav-radius',
        '--xtend-nav-gap',
        '--xtend-nav-font-family',
        '--xtend-nav-font-size',
        '--xtend-nav-active-surface',
        '--xtend-nav-active-text',
        '--xtend-nav-current-indicator',
        '--xtend-nav-hover-surface',
        '--xtend-nav-focus-ring',
        '--xtend-nav-disabled-opacity'
      ],
      overflowPolicy: 'long-labels-wrap-with-overflow-wrap-anywhere'
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-menu',
      liveRegion: 'delegated',
      signals: ['menu-active-item', 'menu-keyboard-navigation', 'route-navigation'],
      statusRegions: ['role=menubar', 'role=menuitem', 'aria-current=page'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.navigation',
        scheduleRef: 'a11y.user-blocking.navigation'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-menu',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'navigation-without-motion-dependency',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      },
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.preference',
        scheduleRef: 'a11y.user-blocking.preference'
      }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --xtend-nav-surface: var(--xtend-surface-panel, var(--xtend-surface-muted, Canvas));
          --xtend-nav-text: var(--xtend-text-primary, var(--xtend-text, CanvasText));
          --xtend-nav-border-color: var(--xtend-border-color, color-mix(in srgb, currentColor 18%, transparent));
          --xtend-nav-radius: var(--xtend-radius-panel, var(--xtend-radius, 0.75rem));
          --xtend-nav-gap: var(--xtend-space-1, 0.5em);
          --xtend-nav-font-family: var(--xtend-font-family-control, var(--xtend-font-family, system-ui, sans-serif));
          --xtend-nav-font-size: var(--xtend-font-size-control, 1em);
          --xtend-nav-active-surface: var(--xtend-color-action-subtle, var(--xtend-surface-inset, ButtonFace));
          --xtend-nav-active-text: var(--xtend-color-action, LinkText);
          --xtend-nav-current-indicator: var(--xtend-color-action, Highlight);
          --xtend-nav-hover-surface: var(--xtend-color-action-subtle, var(--xtend-surface-inset, ButtonFace));
          --xtend-nav-focus-ring: var(--xtend-focus-ring, var(--xtend-focus-outline, 2px solid Highlight));
          --xtend-nav-disabled-opacity: var(--xtend-disabled-opacity, 0.48);
          --xtend-menu-min-touch-target: 44px;
          --xtend-menu-surface: var(--xtend-nav-surface);
          --xtend-menu-text: var(--xtend-nav-text);
          --xtend-menu-border-color: var(--xtend-nav-border-color);
          --xtend-menu-border-width: var(--xtend-border-width, 1px);
          --xtend-menu-radius: var(--xtend-nav-radius);
          --xtend-menu-elevation: var(--xtend-elevation-1, none);
          --xtend-menu-gap: var(--xtend-nav-gap);
          --xtend-menu-padding-y: var(--xtend-space-1, 0.5em);
          --xtend-menu-padding-x: var(--xtend-space-3, 1.2em);
          --xtend-menu-item-surface: transparent;
          --xtend-menu-item-hover-surface: var(--xtend-nav-hover-surface);
          --xtend-menu-item-active-surface: var(--xtend-nav-active-surface);
          --xtend-menu-item-active-text: var(--xtend-nav-active-text);
          --xtend-menu-current-indicator: var(--xtend-nav-current-indicator);
          --xtend-menu-item-text: var(--button-text-color, var(--xtend-text-primary, var(--xtend-text, CanvasText)));
          --xtend-menu-item-primary-surface: var(--xtend-color-action, Highlight);
          --xtend-menu-item-primary-text: var(--xtend-text-on-action, HighlightText);
          --xtend-menu-item-secondary-surface: var(--xtend-surface-inset, ButtonFace);
          --xtend-menu-item-danger-surface: var(--xtend-color-danger, Mark);
          --xtend-menu-item-radius: var(--xtend-radius-control, var(--xtend-radius, 0.75rem));
          --xtend-menu-item-padding-y: var(--xtend-space-1, 0.6em);
          --xtend-menu-item-padding-x: var(--xtend-space-3, 1.6em);
          --xtend-menu-item-gap: var(--xtend-space-control-gap, 0.6em);
          --xtend-menu-font-family: var(--xtend-nav-font-family);
          --xtend-menu-font-size: var(--xtend-nav-font-size);
          --xtend-menu-font-weight: var(--xtend-font-weight-control, 560);
          --xtend-menu-focus-outline: var(--xtend-nav-focus-ring);
          --xtend-menu-focus-elevation: var(--xtend-elevation-focus, none);
          --xtend-menu-disabled-opacity: var(--xtend-nav-disabled-opacity);
          --xtend-menu-disclosure-icon-size: 1em;
          --xtend-menu-motion-duration: var(--xtend-motion-duration-fast, 160ms);
          --xtend-menu-motion-easing: var(--xtend-motion-easing-standard, ease);
        }
        nav {
          display: flex;
          gap: var(--xtend-menu-gap);
          background: var(--xtend-menu-surface);
          color: var(--xtend-menu-text);
          border: var(--xtend-menu-border-width) solid var(--xtend-menu-border-color);
          border-radius: var(--xtend-menu-radius);
          box-shadow: var(--xtend-menu-elevation);
          backdrop-filter: blur(var(--xtend-glass-blur, 0px)) saturate(1.05);
          padding: var(--xtend-menu-padding-y) var(--xtend-menu-padding-x);
          align-items: center;
          min-height: 3.2em;
          transition: box-shadow var(--xtend-menu-motion-duration) var(--xtend-menu-motion-easing), background var(--xtend-menu-motion-duration) var(--xtend-menu-motion-easing);
        }
        :host([orientation="vertical"]) nav {
          flex-direction: column;
          align-items: stretch;
        }
        :host([orientation="vertical"]) ::slotted(a),
        :host([orientation="vertical"]) ::slotted(button),
        :host([orientation="vertical"]) ::slotted(x-link),
        :host([orientation="vertical"]) ::slotted([role="menuitem"]) {
          width: 100%;
          justify-content: flex-start;
        }
        ::slotted(a),
        ::slotted(button),
        ::slotted(x-link),
        ::slotted([role="menuitem"]) {
          all: unset;
          position: relative;
          background: var(--xtend-menu-item-surface);
          color: var(--xtend-menu-item-text);
          border-radius: var(--xtend-menu-item-radius);
          padding: var(--xtend-menu-item-padding-y) var(--xtend-menu-item-padding-x);
          min-width: var(--xtend-menu-min-touch-target, 44px);
          min-height: var(--xtend-menu-min-touch-target, 44px);
          box-sizing: border-box;
          font-family: var(--xtend-menu-font-family);
          font-size: var(--xtend-menu-font-size);
          font-weight: var(--xtend-menu-font-weight);
          text-align: center;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--xtend-menu-item-gap);
          transition: background var(--xtend-menu-motion-duration) var(--xtend-menu-motion-easing), box-shadow var(--xtend-menu-motion-duration) var(--xtend-menu-motion-easing), filter var(--xtend-menu-motion-duration) var(--xtend-menu-motion-easing);
          outline: none;
          border: none;
          overflow-wrap: anywhere;
          word-break: normal;
          white-space: normal;
          max-width: 100%;
          min-inline-size: 0;
        }
        ::slotted(a.primary),
        ::slotted(button.primary),
        ::slotted(x-link.primary),
        ::slotted([role="menuitem"].primary) {
          background: var(--xtend-menu-item-primary-surface);
          color: var(--xtend-menu-item-primary-text);
        }
        ::slotted(a.secondary),
        ::slotted(button.secondary),
        ::slotted(x-link.secondary),
        ::slotted([role="menuitem"].secondary) {
          background: var(--xtend-menu-item-secondary-surface);
          color: var(--xtend-menu-item-text);
        }
        ::slotted(a.danger),
        ::slotted(button.danger),
        ::slotted(x-link.danger),
        ::slotted([role="menuitem"].danger) {
          background: var(--xtend-menu-item-danger-surface);
          color: var(--xtend-error-fg, HighlightText);
        }
        ::slotted(a.small),
        ::slotted(button.small),
        ::slotted(x-link.small),
        ::slotted([role="menuitem"].small) {
          font-size: 0.85em;
          padding: 0.3em 1em;
        }
        ::slotted(a.large),
        ::slotted(button.large),
        ::slotted(x-link.large),
        ::slotted([role="menuitem"].large) {
          font-size: 1.2em;
          padding: 0.9em 2em;
        }
        ::slotted(a[aria-busy="true"]),
        ::slotted(button[aria-busy="true"]),
        ::slotted(x-link[aria-busy="true"]),
        ::slotted([role="menuitem"][aria-busy="true"]) {
          pointer-events: none;
          opacity: 0.7;
        }
        ::slotted(a:focus-visible),
        ::slotted(button:focus-visible),
        ::slotted(x-link:focus-visible),
        ::slotted([role="menuitem"]:focus-visible) {
          outline: var(--xtend-menu-focus-outline);
          outline-offset: var(--xtend-focus-outline-offset, 2px);
          box-shadow: var(--xtend-menu-focus-elevation);
        }
        ::slotted(a:disabled),
        ::slotted(a[aria-disabled="true"]),
        ::slotted(button:disabled),
        ::slotted(button[aria-disabled="true"]),
        ::slotted(x-link[disabled]),
        ::slotted(x-link[aria-disabled="true"]),
        ::slotted([role="menuitem"]:disabled),
        ::slotted([role="menuitem"][aria-disabled="true"]) {
          opacity: var(--xtend-menu-disabled-opacity);
          cursor: not-allowed;
          filter: grayscale(0.2);
        }
        ::slotted(a:hover:not(:disabled)),
        ::slotted(button:hover:not(:disabled)),
        ::slotted(x-link:hover),
        ::slotted([role="menuitem"]:hover:not(:disabled)),
        ::slotted(a.active),
        ::slotted(button.active),
        ::slotted(x-link.active),
        ::slotted([role="menuitem"].active) {
          background: var(--xtend-menu-item-hover-surface);
          box-shadow: var(--xtend-menu-focus-elevation);
          filter: brightness(1.03) saturate(1.05);
        }
        ::slotted(a[aria-current="page"]),
        ::slotted(button[aria-current="page"]),
        ::slotted(x-link[aria-current="page"]),
        ::slotted(x-link[active]),
        ::slotted([role="menuitem"][aria-current="page"]),
        ::slotted(a[aria-selected="true"]),
        ::slotted(button[aria-selected="true"]),
        ::slotted(x-link[aria-selected="true"]),
        ::slotted([role="menuitem"][aria-selected="true"]),
        ::slotted(a.active),
        ::slotted(button.active),
        ::slotted(x-link.active),
        ::slotted([role="menuitem"].active) {
          background: var(--xtend-menu-item-active-surface);
          color: var(--xtend-menu-item-active-text);
          box-shadow: inset 0 -3px 0 var(--xtend-menu-current-indicator), var(--xtend-menu-focus-elevation);
        }
        ::slotted(.icon) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.3em;
          height: 1.3em;
        }
        @media (prefers-reduced-motion: reduce) {
          nav,
          ::slotted(a),
          ::slotted(button),
          ::slotted(x-link),
          ::slotted([role="menuitem"]) {
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          nav {
            background: Canvas;
            border: 1px solid CanvasText;
            box-shadow: none;
          }
          ::slotted(a),
          ::slotted(button),
          ::slotted(x-link),
          ::slotted([role="menuitem"]) {
            color: LinkText;
            forced-color-adjust: auto;
          }
          ::slotted(a:focus-visible),
          ::slotted(button:focus-visible),
          ::slotted(x-link:focus-visible),
          ::slotted([role="menuitem"]:focus-visible) {
            outline: 2px solid Highlight;
            box-shadow: none;
          }
        }
        @media (max-width: 700px) {
          nav {
            flex-direction: column;
            gap: 0.2em;
            padding: min(0.5em, var(--xtend-menu-padding-y)) min(0.5em, var(--xtend-menu-padding-x));
          }
          ::slotted(a), ::slotted(button), ::slotted(x-link), ::slotted([role="menuitem"]) { width: 100%; justify-content: flex-start; }
        }
      </style>
      <nav role="menubar" tabindex="0">
        <slot></slot>
      </nav>
    `;
    this._unsubscribeState = null;
    this._items = [];
    this._itemHandlers = new Map();
    this._performanceMeasurements = [];
    this._performanceCounters = {
      mounts: 0,
      renders: 0,
      slotchanges: 0,
      keyboardMoves: 0,
      activations: 0,
      routeActivations: 0,
      stateSyncs: 0
    };
    this._slot = this.shadowRoot.querySelector('slot');
    this._nav = this.shadowRoot.querySelector('nav');
    this._synchronizingState = false;
    this._onSlotChange = this._handleSlotChange.bind(this);
    this._onNavFocus = this._handleNavFocus.bind(this);
    this._onRouteChanged = this._handleRouteChanged.bind(this);
  }

  connectedCallback() {
    const start = this._now();
    if (!this.id) {
      this.id = `xmenu-${Math.random().toString(36).slice(2, 10)}`;
    }
    this._slot.addEventListener('slotchange', this._onSlotChange);
    this._nav.addEventListener('focus', this._onNavFocus);
    window.addEventListener('popstate', this._onRouteChanged);
    window.addEventListener('hashchange', this._onRouteChanged);
    window.addEventListener('xrouter-after-navigate', this._onRouteChanged);
    document.body.addEventListener('x-navigate', this._onRouteChanged);
    this._updateMenu('mount');
    this._subscribeState();
    this._performanceCounters.mounts += 1;
    this._recordPerformanceMeasurement('xtend.component.hydrate', 'hydrate', start, { reason: 'mount' });
  }

  disconnectedCallback() {
    if (this._unsubscribeState) {
      this._unsubscribeState();
      this._unsubscribeState = null;
    }
    this._removeItemListeners();
    this._slot.removeEventListener('slotchange', this._onSlotChange);
    this._nav.removeEventListener('focus', this._onNavFocus);
    window.removeEventListener('popstate', this._onRouteChanged);
    window.removeEventListener('hashchange', this._onRouteChanged);
    window.removeEventListener('xrouter-after-navigate', this._onRouteChanged);
    document.body.removeEventListener('x-navigate', this._onRouteChanged);
  }

  _handleSlotChange() {
    const start = this._now();
    this._performanceCounters.slotchanges += 1;
    this._updateMenu('slotchange');
    this._recordPerformanceMeasurement('xtend.component.slotchange', 'slotchange', start);
  }

  _handleNavFocus() {
    const focusItem = this._items.find((item) => !this._isItemDisabled(item) && item.tabIndex === 0) ||
      this._items.find((item) => !this._isItemDisabled(item));
    if (focusItem) focusItem.focus();
  }

  _handleRouteChanged(event) {
    const path = event && event.detail && (event.detail.path || event.detail.href);
    this._syncActiveRoute(path || this._getCurrentPath(), 'route-sync', { focus: false });
  }

  _subscribeState() {
    if (this._unsubscribeState || typeof xtendState.subscribe !== 'function') return;
    this._unsubscribeState = xtendState.subscribe((key, value) => {
      if (this._synchronizingState) return;
      if (key === 'xmenu-active' && value && typeof value.index === 'number' && this._stateTargetsThisMenu(value)) {
        this._setActiveItem(value.index, 'xtend-state', { focus: Boolean(value.focus) });
      }
      if (key === 'router-current' || key === 'xtend.router.current' || key === 'router-navigated') {
        const path = typeof value === 'string' ? value : value && value.path;
        this._syncActiveRoute(path, 'xtend-state-route', { focus: false });
      }
    }, ['xmenu-active', 'router-current', 'xtend.router.current', 'router-navigated']);
  }

  _updateMenu(reason = 'update') {
    const start = this._now();
    this._removeItemListeners();
    const items = this._collectItems();
    this._items = items;
    const activeIndex = this._resolveActiveIndex(items);
    const focusIndex = this._resolveFocusIndex(items, activeIndex);

    items.forEach((item, index) => {
      item.setAttribute("role", "menuitem");
      item.setAttribute('data-xtend-menu-index', String(index));
      this._syncDisclosureIconControl(item);
      item.tabIndex = !this._isItemDisabled(item) && index === focusIndex ? 0 : -1;
      this._applyItemActiveState(item, index === activeIndex);

      const keydown = (event) => this._handleItemKeydown(event, item, index);
      const click = (event) => this._handleItemClick(event, item, index);
      item.addEventListener('keydown', keydown);
      item.addEventListener('click', click);
      this._itemHandlers.set(item, { keydown, click });
    });

    this._performanceCounters.renders += 1;
    this._syncState(reason, { activeIndex, focusIndex });
    this._recordPerformanceMeasurement('xtend.component.render', 'renderUpdate', start, { reason, itemCount: items.length });
  }

  _collectItems() {
    return Array.from(this.querySelectorAll("a, button, x-link, [role='menuitem']"))
      .filter((item, index, items) => items.indexOf(item) === index);
  }

  _removeItemListeners() {
    this._itemHandlers.forEach((handlers, item) => {
      item.removeEventListener('keydown', handlers.keydown);
      item.removeEventListener('click', handlers.click);
    });
    this._itemHandlers.clear();
  }

  _handleItemKeydown(event, item, index) {
    const start = this._now();
    const key = event.key;
    let nextIndex = null;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = this._resolveNextEnabledIndex(index, 1);
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = this._resolveNextEnabledIndex(index, -1);
    } else if (key === 'Home') {
      nextIndex = this._resolveFirstEnabledIndex();
    } else if (key === 'End') {
      nextIndex = this._resolveLastEnabledIndex();
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this._activateItem(item, index, event, 'keyboard');
      return;
    } else {
      return;
    }

    event.preventDefault();
    if (nextIndex === null || nextIndex < 0) return;
    this._performanceCounters.keyboardMoves += 1;
    this._focusItem(nextIndex);
    const measurement = this._recordPerformanceMeasurement('xtend.interaction.keyboard', 'keyboardAction', start, { key, fromIndex: index, toIndex: nextIndex });
    this.dispatchEvent(new CustomEvent('menu-keyboard-navigation', {
      detail: this._createKeyboardDetail(key, index, nextIndex, measurement),
      bubbles: true,
      composed: true
    }));
  }

  _handleItemClick(event, item, index) {
    this._activateItem(item, index, event, 'click');
  }

  _activateItem(item, index, event, source) {
    if (this._isItemDisabled(item)) {
      event.preventDefault();
      return;
    }

    const start = this._now();
    const href = this._resolveItemHref(item);
    const isRoutable = href && this._isInternalHref(href);
    if (isRoutable && event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    this._performanceCounters.activations += 1;
    const measurement = this._recordPerformanceMeasurement(
      isRoutable ? 'xtend.route.navigate' : 'xtend.interaction.activate',
      isRoutable ? 'routeActivation' : 'keyboardAction',
      start,
      { href, index, source }
    );
    this._setActiveItem(index, source, { focus: source === 'keyboard' });

    const itemDetail = this._createMenuItemDetail(item, index, href, source, measurement);
    const clicked = this.dispatchEvent(new CustomEvent('menu-item-clicked', {
      detail: itemDetail,
      cancelable: true,
      bubbles: true,
      composed: true
    }));
    if (!clicked) return;
    this.dispatchEvent(new CustomEvent('xtend-command', {
      detail: createXtendRmtCommandDetail(this, 'menu-item-clicked', itemDetail, { fallbackId: 'x-menu', target: item }),
      bubbles: true,
      composed: true,
      cancelable: true
    }));

    if (isRoutable) {
      this._performanceCounters.routeActivations += 1;
      this._navigateToHref(href, item, source, measurement);
    }
  }

  _focusItem(index) {
    const item = this._items[index];
    if (!item || this._isItemDisabled(item)) return;
    this._items.forEach((candidate, candidateIndex) => {
      candidate.tabIndex = !this._isItemDisabled(candidate) && candidateIndex === index ? 0 : -1;
    });
    item.focus();
    this._syncState('keyboard-focus', {
      activeIndex: this._resolveActiveIndex(this._items),
      focusIndex: index
    });
  }

  _setActiveItem(index, reason = 'update', options = {}) {
    if (!this._items.length || index < 0 || index >= this._items.length) return;
    if (this._isItemDisabled(this._items[index])) return;
    this._items.forEach((item, itemIndex) => {
      this._applyItemActiveState(item, itemIndex === index);
      item.tabIndex = !this._isItemDisabled(item) && itemIndex === index ? 0 : -1;
    });
    if (options.focus) {
      this._items[index].focus();
    }
    this._syncState(reason, { activeIndex: index, focusIndex: index });
  }

  _syncActiveRoute(path, reason = 'route-sync', options = {}) {
    if (!path) return;
    const target = this._normalizePath(path);
    const index = this._items.findIndex((item) => {
      if (this._isItemDisabled(item)) return false;
      const href = this._resolveItemHref(item);
      return href && this._normalizePath(href.replace(/^#/, '')) === target;
    });
    if (index >= 0) {
      this._setActiveItem(index, reason, options);
    }
  }

  _applyItemActiveState(item, active) {
    if (active) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    }
  }

  _syncState(reason = 'update', detail = {}) {
    if (!this.id) return;
    const activeIndex = typeof detail.activeIndex === 'number' ? detail.activeIndex : this._resolveActiveIndex(this._items);
    const focusIndex = typeof detail.focusIndex === 'number' ? detail.focusIndex : this._resolveFocusIndex(this._items, activeIndex);
    const activeItem = this._items[activeIndex] || null;
    const focusItem = this._items[focusIndex] || null;
    const state = {
      schema: X_MENU_STATE_SCHEMA,
      id: this.id,
      reason,
      index: activeIndex,
      activeIndex,
      focusIndex,
      href: activeItem ? this._resolveItemHref(activeItem) : null,
      focusHref: focusItem ? this._resolveItemHref(focusItem) : null,
      itemCount: this._items.length,
      lane: XMenu.xtendScaffoldPerformanceProfile.lane,
      scheduleRef: 'ui.user-blocking.navigation',
      performanceProfile: XMenu.xtendScaffoldPerformanceProfile,
      performanceSnapshot: this.snapshotPerformance()
    };
    this._performanceCounters.stateSyncs += 1;
    this._synchronizingState = true;
    try {
      xtendState.set('xmenu-active', state);
      xtendState.set(`xmenu-state-${this.id}`, state);
    } finally {
      this._synchronizingState = false;
    }
  }

  _resolveActiveIndex(items = this._items) {
    const currentPath = this._getCurrentPath();
    const routeIndex = items.findIndex((item) => {
      if (this._isItemDisabled(item)) return false;
      const href = this._resolveItemHref(item);
      return href && this._normalizePath(href.replace(/^#/, '')) === currentPath;
    });
    if (routeIndex >= 0) return routeIndex;

    const explicitIndex = items.findIndex((item) => (
      !this._isItemDisabled(item) && (
        item.getAttribute('aria-current') === 'page' ||
        item.hasAttribute('active') ||
        item.classList.contains('active')
      )
    ));
    if (explicitIndex >= 0) return explicitIndex;

    const scopedState = this.id ? xtendState.get(`xmenu-state-${this.id}`) : null;
    const globalState = xtendState.get('xmenu-active');
    const state = scopedState || (this._stateTargetsThisMenu(globalState) ? globalState : null);
    if (state && typeof state.index === 'number' && state.index >= 0 && state.index < items.length && !this._isItemDisabled(items[state.index])) {
      return state.index;
    }
    if (state && typeof state.activeIndex === 'number' && state.activeIndex >= 0 && state.activeIndex < items.length && !this._isItemDisabled(items[state.activeIndex])) {
      return state.activeIndex;
    }
    return -1;
  }

  _resolveFocusIndex(items = this._items, activeIndex = this._resolveActiveIndex(items)) {
    const scopedState = this.id ? xtendState.get(`xmenu-state-${this.id}`) : null;
    const globalState = xtendState.get('xmenu-active');
    const state = scopedState || (this._stateTargetsThisMenu(globalState) ? globalState : null);
    if (state && typeof state.focusIndex === 'number' && state.focusIndex >= 0 && state.focusIndex < items.length && !this._isItemDisabled(items[state.focusIndex])) {
      return state.focusIndex;
    }
    if (activeIndex >= 0 && activeIndex < items.length && !this._isItemDisabled(items[activeIndex])) {
      return activeIndex;
    }
    return items.findIndex((item) => !this._isItemDisabled(item));
  }

  _stateTargetsThisMenu(state) {
    return Boolean(state && (!state.id || state.id === this.id));
  }

  _resolveFirstEnabledIndex() {
    return this._items.findIndex((item) => !this._isItemDisabled(item));
  }

  _resolveLastEnabledIndex() {
    for (let index = this._items.length - 1; index >= 0; index -= 1) {
      if (!this._isItemDisabled(this._items[index])) return index;
    }
    return -1;
  }

  _resolveNextEnabledIndex(index, direction) {
    if (!this._items.length) return -1;
    for (let offset = 1; offset <= this._items.length; offset += 1) {
      const candidateIndex = (index + (offset * direction) + this._items.length) % this._items.length;
      if (!this._isItemDisabled(this._items[candidateIndex])) return candidateIndex;
    }
    return -1;
  }

  _navigateToHref(href, item, source, measurement) {
    const path = this._normalizePath(href.replace(/^#/, ''));
    const mode = this._resolveRouterMode();
    const detail = {
      schema: 'xtend.component.x-menu.navigation.v1',
      href,
      path,
      mode,
      source: 'x-menu',
      inputSource: source,
      stateKey: 'xmenu-active',
      scheduleRef: 'route.transition.navigate',
      itemTag: item.tagName ? item.tagName.toLowerCase() : null,
      measurement
    };

    this.dispatchEvent(new CustomEvent('menu-navigate', {
      detail,
      bubbles: true,
      composed: true
    }));

    if (typeof xtendState.set === 'function') {
      xtendState.set('router-navigate', path);
    }
    document.body.dispatchEvent(new CustomEvent('x-navigate', {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  _resolveRouterMode() {
    const router = this.closest('x-router') || document.querySelector('x-router');
    return router && router.getAttribute('mode') === 'history' ? 'history' : 'hash';
  }

  _resolveItemHref(item) {
    if (!item) return null;
    const href = item.getAttribute && item.getAttribute('href');
    if (href) return href;
    if (typeof item.href === 'string' && item.href) return item.href;
    const anchor = item.shadowRoot && item.shadowRoot.querySelector && item.shadowRoot.querySelector('a[href]');
    return anchor ? anchor.getAttribute('href') : null;
  }

  _syncDisclosureIconControl(item) {
    if (!item || typeof item.hasAttribute !== 'function' || !item.querySelector) return;
    const isDisclosure = item.hasAttribute('aria-expanded') ||
      item.hasAttribute('data-menu-disclosure') ||
      item.getAttribute('aria-haspopup') === 'menu';
    const existing = item.querySelector('[data-xtend-disclosure-icon]');
    const hasAuthorIcon = item.querySelector('x-icon[part~="icon"], svg[part~="icon"], [data-disclosure-icon]');
    if (!isDisclosure) {
      if (existing && existing.getAttribute('data-xtend-managed') === 'true') existing.remove();
      return;
    }
    if (existing || hasAuthorIcon) return;

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.setAttribute('part', 'disclosure-icon control icon');
    icon.setAttribute('data-xtend-disclosure-icon', '');
    icon.setAttribute('data-xtend-managed', 'true');
    icon.style.width = 'var(--xtend-menu-disclosure-icon-size, 1em)';
    icon.style.height = 'var(--xtend-menu-disclosure-icon-size, 1em)';
    icon.style.flex = '0 0 auto';
    icon.style.marginInlineStart = 'var(--xtend-menu-item-gap, 0.6em)';
    icon.style.transform = item.getAttribute('aria-expanded') === 'true' ? 'rotate(180deg)' : 'rotate(0deg)';
    icon.style.transition = 'transform var(--xtend-menu-motion-duration, 160ms) var(--xtend-menu-motion-easing, ease)';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 9l6 6 6-6');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    icon.appendChild(path);
    item.appendChild(icon);
  }

  _isInternalHref(href) {
    if (!href) return false;
    return !/^(https?:|mailto:|tel:)/.test(href);
  }

  _normalizePath(path) {
    if (!path) return '/';
    const pathWithoutOrigin = path.replace(/^https?:\/\/[^/]+/, '');
    const [purePath, query = ''] = pathWithoutOrigin.split('?');
    let normalizedPath = purePath.replace(/^#/, '');
    normalizedPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    if (normalizedPath.length > 1) {
      normalizedPath = normalizedPath.replace(/\/+$/, '');
    }
    return query ? `${normalizedPath}?${query}` : normalizedPath;
  }

  _getCurrentPath() {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      return this._normalizePath(window.location.hash.replace(/^#/, ''));
    }
    return this._normalizePath(window.location.pathname + window.location.search);
  }

  _isItemDisabled(item) {
    return Boolean(
      item.disabled ||
      item.hasAttribute('disabled') ||
      item.getAttribute('aria-disabled') === 'true' ||
      item.getAttribute('aria-busy') === 'true'
    );
  }

  _createMenuItemDetail(item, index, href, source, measurement) {
    return {
      schema: 'xtend.component.x-menu.item-clicked.v1',
      id: this.id,
      href: href || null,
      index,
      label: (item.textContent || '').trim(),
      source,
      lane: XMenu.xtendScaffoldPerformanceProfile.lane,
      routeLane: XMenu.xtendScaffoldPerformanceProfile.fabric.routeLane,
      stateKey: 'xmenu-active',
      scheduleRef: href && this._isInternalHref(href) ? 'route.transition.navigate' : 'ui.user-blocking.navigation',
      measurement
    };
  }

  _createKeyboardDetail(key, fromIndex, toIndex, measurement) {
    return {
      schema: 'xtend.component.x-menu.keyboard-navigation.v1',
      id: this.id,
      key,
      fromIndex,
      toIndex,
      lane: XMenu.xtendScaffoldPerformanceProfile.lane,
      stateKey: 'xmenu-active',
      scheduleRef: 'ui.user-blocking.navigation',
      measurement
    };
  }

  _now() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  _resolvePerformanceBudget(budgetKey) {
    return XMenu.xtendScaffoldPerformanceProfile.budgetsMs[budgetKey] || null;
  }

  _recordPerformanceMeasurement(name, budgetKey, startTime, detail = {}) {
    const durationMs = Math.max(0, this._now() - startTime);
    const budgetMs = this._resolvePerformanceBudget(budgetKey);
    const measurement = {
      schema: X_MENU_PERFORMANCE_MEASUREMENT_SCHEMA,
      componentRef: 'x-menu',
      id: this.id || null,
      name,
      budgetKey,
      durationMs,
      budgetMs,
      withinBudget: typeof budgetMs === 'number' ? durationMs <= budgetMs : true,
      lane: XMenu.xtendScaffoldPerformanceProfile.lane,
      detail
    };
    this._performanceMeasurements.push(measurement);
    if (this._performanceMeasurements.length > 30) {
      this._performanceMeasurements.splice(0, this._performanceMeasurements.length - 30);
    }
    this.dispatchEvent(new CustomEvent('menu-performance-measured', {
      detail: measurement,
      bubbles: true,
      composed: true
    }));
    return measurement;
  }

  getPerformanceBudget() {
    return { ...XMenu.xtendScaffoldPerformanceProfile.budgetsMs };
  }

  getInteractionBudget() {
    return { ...XMenu.xtendScaffoldPerformanceProfile.interaction };
  }

  snapshotPerformance() {
    return {
      schema: X_MENU_PERFORMANCE_SNAPSHOT_SCHEMA,
      componentRef: 'x-menu',
      id: this.id || null,
      lane: XMenu.xtendScaffoldPerformanceProfile.lane,
      routeLane: XMenu.xtendScaffoldPerformanceProfile.fabric.routeLane,
      hydrationPolicy: XMenu.xtendScaffoldPerformanceProfile.hydrationPolicy,
      counters: { ...this._performanceCounters },
      budgetsMs: this.getPerformanceBudget(),
      measurements: this._performanceMeasurements.slice(-10)
    };
  }
}

customElements.define("x-menu", XMenu);
