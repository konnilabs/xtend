import { xstate } from './xstate.js';

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
        events: ['menu-item-clicked', 'menu-navigate', 'menu-keyboard-navigation'],
        routeBinding: 'href-to-xrouter-navigation'
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
      cleanup: ['slotchange-listener', 'item-listeners', 'xstate-subscription', 'route-listeners'],
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
      activeState: 'xmenu-active-and-aria-current-page',
      focusRestore: 'roving-tabindex-preserves-focused-item',
      routeAnnouncement: 'delegated-to-x-router',
      keyboardNavigation: 'arrow-home-end-enter-space',
      events: ['menu-item-clicked', 'menu-navigate', 'menu-keyboard-navigation'],
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
      }
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
          --xtend-menu-min-touch-target: 44px;
        }
        nav {
          display: flex;
          gap: 0.5em;
          background: var(--xtend-menu-bg, rgba(40, 60, 120, 0.25));
          border-radius: var(--xtend-menu-radius, 1.2em);
          box-shadow: var(--xtend-menu-shadow, 0 4px 24px 0 rgba(40,60,120,0.10), 0 1.5px 6px 0 rgba(40,60,120,0.08));
          backdrop-filter: blur(12px) saturate(1.2);
          padding: 0.5em 1.2em;
          align-items: center;
          min-height: 3.2em;
          transition: box-shadow 0.25s, background 0.25s;
        }
        ::slotted(a),
        ::slotted(button),
        ::slotted(x-link),
        ::slotted([role="menuitem"]) {
          all: unset;
          position: relative;
          background: none;
          color: var(--button-text-color, var(--xtend-menu-color, #fff));
          border-radius: 1.2em;
          padding: 0.6em 1.6em;
          min-width: var(--xtend-menu-min-touch-target, 44px);
          min-height: var(--xtend-menu-min-touch-target, 44px);
          box-sizing: border-box;
          font-size: 1em;
          font-weight: 500;
          text-align: center;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6em;
          transition: background 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s, filter 0.2s;
          outline: none;
          border: none;
          overflow: hidden;
        }
        ::slotted(a.primary),
        ::slotted(button.primary),
        ::slotted(x-link.primary),
        ::slotted([role="menuitem"].primary) {
          background: linear-gradient(135deg, rgba(0,123,255,0.35) 0%, rgba(0,123,255,0.18) 100%);
          color: #fff;
        }
        ::slotted(a.secondary),
        ::slotted(button.secondary),
        ::slotted(x-link.secondary),
        ::slotted([role="menuitem"].secondary) {
          background: linear-gradient(135deg, rgba(108,117,125,0.35) 0%, rgba(108,117,125,0.18) 100%);
          color: #fff;
        }
        ::slotted(a.danger),
        ::slotted(button.danger),
        ::slotted(x-link.danger),
        ::slotted([role="menuitem"].danger) {
          background: linear-gradient(135deg, rgba(220,53,69,0.35) 0%, rgba(220,53,69,0.18) 100%);
          color: #fff;
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
          outline: 2.5px solid var(--focus-color, #80bfff);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(0,123,255,0.12);
        }
        ::slotted(a:disabled),
        ::slotted(button:disabled),
        ::slotted(x-link[aria-disabled="true"]),
        ::slotted([role="menuitem"]:disabled),
        ::slotted([role="menuitem"][aria-disabled="true"]) {
          opacity: 0.45;
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
          background: rgba(40,60,120,0.32);
          box-shadow: 0 6px 32px 0 rgba(40,60,120,0.16), 0 2px 8px 0 rgba(40,60,120,0.10);
          filter: brightness(1.08) saturate(1.1);
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
          nav { flex-direction: column; gap: 0.2em; padding: 0.5em 0.5em; }
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
    const firstItem = this._items[0];
    if (firstItem) firstItem.focus();
  }

  _handleRouteChanged(event) {
    const path = event && event.detail && (event.detail.path || event.detail.href);
    this._syncActiveRoute(path || this._getCurrentPath(), 'route-sync', { focus: false });
  }

  _subscribeState() {
    if (this._unsubscribeState || typeof xstate.subscribe !== 'function') return;
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (this._synchronizingState) return;
      if (key === 'xmenu-active' && value && typeof value.index === 'number') {
        this._setActiveItem(value.index, 'xstate', { focus: Boolean(value.focus) });
      }
      if (key === 'router-current' || key === 'xtend.router.current' || key === 'router-navigated') {
        const path = typeof value === 'string' ? value : value && value.path;
        this._syncActiveRoute(path, 'xstate-route', { focus: false });
      }
    }, ['xmenu-active', 'router-current', 'xtend.router.current', 'router-navigated']);
  }

  _updateMenu(reason = 'update') {
    const start = this._now();
    this._removeItemListeners();
    const items = this._collectItems();
    this._items = items;
    const activeIndex = this._resolveActiveIndex(items);

    items.forEach((item, index) => {
      item.setAttribute("role", "menuitem");
      item.setAttribute('data-xtend-menu-index', String(index));
      item.tabIndex = index === activeIndex ? 0 : -1;
      this._applyItemActiveState(item, index === activeIndex);

      const keydown = (event) => this._handleItemKeydown(event, item, index);
      const click = (event) => this._handleItemClick(event, item, index);
      item.addEventListener('keydown', keydown);
      item.addEventListener('click', click);
      this._itemHandlers.set(item, { keydown, click });
    });

    this._performanceCounters.renders += 1;
    this._syncState(reason, { activeIndex });
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
      nextIndex = (index + 1) % this._items.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = (index - 1 + this._items.length) % this._items.length;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = this._items.length - 1;
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this._activateItem(item, index, event, 'keyboard');
      return;
    } else {
      return;
    }

    event.preventDefault();
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

    const clicked = this.dispatchEvent(new CustomEvent('menu-item-clicked', {
      detail: this._createMenuItemDetail(item, index, href, source, measurement),
      cancelable: true,
      bubbles: true,
      composed: true
    }));
    if (!clicked) return;

    if (isRoutable) {
      this._performanceCounters.routeActivations += 1;
      this._navigateToHref(href, item, source, measurement);
    }
  }

  _focusItem(index) {
    const item = this._items[index];
    if (!item) return;
    this._items.forEach((candidate, candidateIndex) => {
      candidate.tabIndex = candidateIndex === index ? 0 : -1;
    });
    item.focus();
  }

  _setActiveItem(index, reason = 'update', options = {}) {
    if (!this._items.length || index < 0 || index >= this._items.length) return;
    this._items.forEach((item, itemIndex) => {
      this._applyItemActiveState(item, itemIndex === index);
      item.tabIndex = itemIndex === index ? 0 : -1;
    });
    if (options.focus) {
      this._items[index].focus();
    }
    this._syncState(reason, { activeIndex: index });
  }

  _syncActiveRoute(path, reason = 'route-sync', options = {}) {
    if (!path) return;
    const target = this._normalizePath(path);
    const index = this._items.findIndex((item) => {
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
    const activeItem = this._items[activeIndex] || null;
    const state = {
      schema: X_MENU_STATE_SCHEMA,
      id: this.id,
      reason,
      index: activeIndex,
      activeIndex,
      href: activeItem ? this._resolveItemHref(activeItem) : null,
      itemCount: this._items.length,
      lane: XMenu.xtendScaffoldPerformanceProfile.lane,
      scheduleRef: 'ui.user-blocking.navigation',
      performanceProfile: XMenu.xtendScaffoldPerformanceProfile,
      performanceSnapshot: this.snapshotPerformance()
    };
    this._performanceCounters.stateSyncs += 1;
    this._synchronizingState = true;
    try {
      xstate.set('xmenu-active', state);
      xstate.set(`xmenu-state-${this.id}`, state);
    } finally {
      this._synchronizingState = false;
    }
  }

  _resolveActiveIndex(items = this._items) {
    const state = xstate.get('xmenu-active');
    if (state && typeof state.index === 'number' && state.index >= 0 && state.index < items.length) {
      return state.index;
    }
    if (state && typeof state.activeIndex === 'number' && state.activeIndex >= 0 && state.activeIndex < items.length) {
      return state.activeIndex;
    }
    const currentPath = this._getCurrentPath();
    const routeIndex = items.findIndex((item) => {
      const href = this._resolveItemHref(item);
      return href && this._normalizePath(href.replace(/^#/, '')) === currentPath;
    });
    return routeIndex >= 0 ? routeIndex : 0;
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

    if (typeof xstate.set === 'function') {
      xstate.set('router-navigate', path);
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
