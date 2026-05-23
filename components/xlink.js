class XLink extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'disabled'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-link',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-esm.component-source',
        state: 'js-runtime',
        sourcePath: 'components/xlink.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xlink.js',
        declaration: 'components/xlink.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'user-blocking'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-link',
      schedules: ['component.visible.mount', 'ui.user-blocking.navigation', 'route.visible.render', 'a11y.announce', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-link',
      operations: ['mount', 'hydrate', 'activate', 'update-active', 'event', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-link',
      role: 'link',
      accessibleName: 'slot-or-aria-label',
      liveRegion: 'delegated-to-router',
      screenreader: {
        signalContract: XLink.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XLink.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-link',
      budgetClass: 'interactive',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'activate', 'update-active'],
      cleanup: ['window-listeners', 'document-listeners']
    };
  }

  static get xtendNavigationRoutingUxProfile() {
    return {
      schema: 'xtend.component.navigation-routing-ux-profile.v1',
      componentRef: 'x-link',
      family: 'router-link',
      role: 'link',
      navigationMode: 'hash-or-history',
      activeState: 'aria-current-page',
      focusRestore: 'preserve-link-focus',
      routeAnnouncement: 'delegated-to-router',
      keyboardNavigation: 'enter-space-activation',
      events: ['before-navigate', 'after-navigate', 'x-navigate'],
      commands: ['navigate', 'update-active', 'snapshot'],
      stateKey: 'xlink-active-<id>',
      schedule: 'ui.user-blocking.navigation',
      fabric: {
        lane: 'user-blocking',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XLink.xtendRmtMetadata,
      statusSemantics: {
        feedbackStatusCompatible: true,
        activeStateMirrorsRouter: true
      },
      stateSemantics: {
        states: ['active', 'current', 'selected', 'hover', 'focus', 'disabled'],
        current: 'aria-current=page',
        selected: 'aria-selected-supported-for-composite-navigation-hosts',
        disabled: 'disabled-or-aria-disabled'
      },
      signatureDesign: {
        note: 'Enterprise router link with visible current-route underline, compact typography rhythm and host-controlled nav states.',
        tokenStrategy: 'shared --xtend-nav-* tokens feed x-link aliases while legacy link tokens remain overrideable.',
        themeExpectation: 'third-party themes can restyle active, hover, focus, disabled, radius, typography and current indicator from CSS.'
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
      overflowPolicy: 'inline-overflow-wraps-in-constrained-containers'
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-link',
      liveRegion: 'delegated',
      signals: ['route-link-active-state', 'keyboard-activation'],
      statusRegions: ['aria-current=page', 'aria-live=polite', 'aria-atomic=true'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.announce',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-link',
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

  static _getShadowTemplate() {
    if (XLink.__shadowTemplate) return XLink.__shadowTemplate;
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: var(--xtend-link-display, inline-block);
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          vertical-align: baseline;
          --xtend-nav-surface: transparent;
          --xtend-nav-text: var(--xtend-text-primary, var(--xtend-text, currentColor));
          --xtend-nav-border-color: transparent;
          --xtend-nav-radius: var(--xtend-radius-control, var(--xtend-radius, 0.45rem));
          --xtend-nav-gap: var(--xtend-space-control-gap, 0.45rem);
          --xtend-nav-font-family: var(--xtend-font-family-control, var(--xtend-font-family, inherit));
          --xtend-nav-font-size: var(--xtend-font-size-control, inherit);
          --xtend-nav-active-surface: var(--xtend-color-action-subtle, transparent);
          --xtend-nav-active-text: var(--xtend-color-action, currentColor);
          --xtend-nav-current-indicator: var(--xtend-color-action, currentColor);
          --xtend-nav-hover-surface: var(--xtend-color-action-subtle, transparent);
          --xtend-nav-focus-ring: var(--xtend-focus-ring, var(--focus-outline, 2px solid Highlight));
          --xtend-nav-disabled-opacity: var(--xtend-disabled-opacity, 0.48);
          --xtend-link-surface: var(--xtend-nav-surface);
          --xtend-link-text: var(--xtend-nav-text);
          --xtend-link-radius: var(--xtend-nav-radius);
          --xtend-link-gap: var(--xtend-nav-gap);
          --xtend-link-font-family: var(--xtend-nav-font-family);
          --xtend-link-font-size: var(--xtend-nav-font-size);
          --xtend-link-active-surface: var(--xtend-nav-active-surface);
          --xtend-link-active-text: var(--xtend-nav-active-text);
          --xtend-link-current-indicator: var(--xtend-nav-current-indicator);
          --xtend-link-hover-surface: var(--xtend-nav-hover-surface);
          --xtend-link-focus: var(--xtend-nav-focus-ring);
          --xtend-link-disabled-opacity: var(--xtend-nav-disabled-opacity);
          --xtend-link-padding-block: var(--xtend-link-padding-y, 0);
          --xtend-link-padding-inline: var(--xtend-link-padding-x, 0);
        }
        a {
          display: inline-flex;
          align-items: center;
          gap: var(--xtend-link-gap);
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          color: var(--xtend-link-text);
          background: var(--xtend-link-surface);
          text-decoration: var(--link-decoration, none);
          cursor: pointer;
          border: none;
          border-radius: var(--xtend-link-radius);
          padding: var(--xtend-link-padding-block) var(--xtend-link-padding-inline);
          font-family: var(--xtend-link-font-family);
          font-size: var(--xtend-link-font-size);
          outline: none;
          overflow-wrap: anywhere;
          word-break: var(--xtend-link-word-break, normal);
          white-space: var(--xtend-link-white-space, normal);
          position: relative;
          transition: background var(--xtend-motion-duration-fast, 160ms) var(--xtend-motion-easing-standard, ease), color var(--xtend-motion-duration-fast, 160ms) var(--xtend-motion-easing-standard, ease), box-shadow var(--xtend-motion-duration-fast, 160ms) var(--xtend-motion-easing-standard, ease);
        }
        ::slotted(*) {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        a:focus {
          outline: var(--xtend-link-focus, var(--focus-outline, 2px solid Highlight));
        }
        a:focus-visible {
          outline: var(--xtend-link-focus, var(--focus-outline, 2px solid Highlight));
          outline-offset: 2px;
        }
        a:hover {
          text-decoration: var(--link-hover-decoration, underline);
          background: var(--xtend-link-hover-surface);
        }
        :host([active]) a {
          font-weight: var(--xtend-link-active-font-weight, 700);
          text-decoration: var(--link-active-decoration, underline);
          color: var(--xtend-link-active-color, var(--xtend-link-active-text));
          background: var(--xtend-link-active-surface);
          box-shadow: inset 0 -2px 0 var(--xtend-link-current-indicator);
        }
        :host([disabled]) a,
        :host([aria-disabled="true"]) a {
          opacity: var(--xtend-link-disabled-opacity);
          cursor: not-allowed;
          pointer-events: none;
        }
        .link-status {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          a {
            transition: none;
          }
        }
        @media (forced-colors: active) {
          a:focus-visible {
            outline: 2px solid CanvasText;
          }
        }
      </style>
      <a part="root link" role="link" tabindex="0"><slot></slot></a>
      <span class="link-status" part="announcer" role="status" aria-live="polite" aria-atomic="true"></span>
    `;
    XLink.__shadowTemplate = template;
    return XLink.__shadowTemplate;
  }

  static _getNavigationRegistry() {
    if (XLink.__navigationRegistry) return XLink.__navigationRegistry;
    const registry = {
      links: new Set(),
      scheduled: false,
      attached: false,
      body: null,
      sync() {
        registry.scheduled = false;
        registry.links.forEach((link) => {
          if (link && typeof link._updateActive === 'function' && link.isConnected) {
            link._updateActive();
          }
        });
      },
      schedule() {
        if (registry.scheduled) return;
        registry.scheduled = true;
        const run = () => registry.sync();
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(run);
          return;
        }
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(run);
          return;
        }
        setTimeout(run, 0);
      },
      onNavigation() {
        registry.schedule();
      }
    };
    XLink.__navigationRegistry = registry;
    return registry;
  }

  static _attachNavigationListeners(registry = XLink._getNavigationRegistry()) {
    if (registry.attached || typeof window === 'undefined') return;
    window.addEventListener('popstate', registry.onNavigation);
    window.addEventListener('hashchange', registry.onNavigation);
    window.addEventListener('xrouter-after-navigate', registry.onNavigation);
    if (typeof document !== 'undefined' && document.body) {
      document.body.addEventListener('x-navigate', registry.onNavigation);
      registry.body = document.body;
    }
    registry.attached = true;
  }

  static _detachNavigationListeners(registry = XLink._getNavigationRegistry()) {
    if (!registry.attached || registry.links.size > 0 || typeof window === 'undefined') return;
    window.removeEventListener('popstate', registry.onNavigation);
    window.removeEventListener('hashchange', registry.onNavigation);
    window.removeEventListener('xrouter-after-navigate', registry.onNavigation);
    if (registry.body) {
      registry.body.removeEventListener('x-navigate', registry.onNavigation);
      registry.body = null;
    }
    registry.attached = false;
    registry.scheduled = false;
  }

  static _registerNavigationLink(link) {
    const registry = XLink._getNavigationRegistry();
    registry.links.add(link);
    XLink._attachNavigationListeners(registry);
  }

  static _unregisterNavigationLink(link) {
    const registry = XLink._getNavigationRegistry();
    registry.links.delete(link);
    XLink._detachNavigationListeners(registry);
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(XLink._getShadowTemplate().content.cloneNode(true));
    this._anchor = this.shadowRoot.querySelector('a');
    this._status = this.shadowRoot.querySelector('.link-status');
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._updateActive = this._updateActive.bind(this);
    this._onNavigationChange = this._updateActive.bind(this);
  }

  connectedCallback() {
    if (!this.id) {
      this.id = `link-${Math.random().toString(36).slice(2, 10)}`;
    }
    this._anchor.addEventListener('click', this._onClick);
    this._anchor.addEventListener('keydown', this._onKeyDown);
    this._syncAnchorState();
    XLink._registerNavigationLink(this);
    this._updateActive();
  }

  disconnectedCallback() {
    this._anchor.removeEventListener('click', this._onClick);
    this._anchor.removeEventListener('keydown', this._onKeyDown);
    XLink._unregisterNavigationLink(this);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'href' || name === 'disabled') {
      this._syncAnchorState();
      this._updateActive();
    }
  }

  _isDisabled() {
    return this.hasAttribute('disabled') ||
      (this.getAttribute('aria-disabled') === 'true' && this.getAttribute('data-xtend-managed-disabled') !== 'true');
  }

  _syncAnchorState() {
    const href = this.getAttribute('href');
    const disabled = this._isDisabled();
    if (disabled) {
      if (this.hasAttribute('disabled')) {
        this.setAttribute('aria-disabled', 'true');
        this.setAttribute('data-xtend-managed-disabled', 'true');
      }
      this._anchor.removeAttribute('href');
      this._anchor.setAttribute('aria-disabled', 'true');
      this._anchor.setAttribute('tabindex', '-1');
      return;
    }
    if (this.getAttribute('data-xtend-managed-disabled') === 'true') {
      this.removeAttribute('aria-disabled');
      this.removeAttribute('data-xtend-managed-disabled');
    }
    if (this.getAttribute('aria-disabled') !== 'true') {
      this._anchor.removeAttribute('aria-disabled');
      this._anchor.setAttribute('tabindex', '0');
    }
    if (typeof href === 'string') {
      this._anchor.setAttribute('href', href);
    } else {
      this._anchor.removeAttribute('href');
    }
    this._syncExternalAttributes();
  }

  _isExternal(href) {
    return /^(https?:|mailto:|tel:)/.test(href);
  }

  _getCurrentPath() {
    // Unterstützt Hash- und History-Mode
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      return window.location.hash.replace(/^#/, '');
    }
    return window.location.pathname + window.location.search;
  }

  _normalizePath(path) {
    if (!path) return '/';
    const [purePath, query = ''] = path.split('?');
    let normalizedPath = purePath.startsWith('/') ? purePath : '/' + purePath;
    if (normalizedPath.length > 1) {
      normalizedPath = normalizedPath.replace(/\/+$/, '');
    }
    return query ? `${normalizedPath}?${query}` : normalizedPath;
  }

  _syncExternalAttributes() {
    const href = this.getAttribute('href') || '';
    if (this._isExternal(href)) {
      this._anchor.setAttribute('target', this.getAttribute('target') || '_blank');
      this._anchor.setAttribute('rel', this.getAttribute('rel') || 'noopener noreferrer');
      return;
    }

    this._anchor.removeAttribute('target');
    this._anchor.removeAttribute('rel');
  }

  _updateActive() {
    const href = this.getAttribute('href') || '';
    if (!href || this._isDisabled() || this._isExternal(href)) {
      this.removeAttribute('active');
      this._anchor.removeAttribute('aria-current');
      this._syncActiveState(false);
      return;
    }

    const current = this._normalizePath(this._getCurrentPath());
    const target = this._normalizePath(href.replace(/^#/, ''));
    if (target === current || (target === '/' && (current === '/' || current === ''))) {
      this.setAttribute('active', '');
      this._anchor.setAttribute('aria-current', 'page');
      this._syncActiveState(true);
    } else {
      this.removeAttribute('active');
      this._anchor.removeAttribute('aria-current');
      this._syncActiveState(false);
    }
  }

  updateActive() {
    this._updateActive();
    return this.hasAttribute('active');
  }

  _syncActiveState(active) {
    const href = this.getAttribute('href') || '';
    const normalizedHref = this._normalizePath(href.replace(/^#/, ''));
    const previousActive = this._lastActiveState;
    if (previousActive === active && this._lastActiveHref === normalizedHref) {
      return;
    }
    this._lastActiveState = active;
    this._lastActiveHref = normalizedHref;
    const detail = {
      href: normalizedHref,
      active,
      source: 'x-link',
      stateKey: `xlink-active-${this.id}`,
      scheduleRef: 'route.visible.render'
    };
    const stateApi = globalThis.xstate;
    if (stateApi && typeof stateApi.set === 'function' && (active || previousActive !== undefined)) {
      stateApi.set(`xlink-active-${this.id}`, detail);
    }
    if (this._status) {
      this._status.textContent = active ? 'Aktiver Navigationslink' : '';
    }
  }

  _onClick(event) {
    if (this._isDisabled()) {
      event.preventDefault();
      return;
    }
    const href = this.getAttribute('href');
    if (!href) return;
    if (this._isExternal(href)) {
      this._syncExternalAttributes();
      return; // Standardverhalten für externe Links
    }
    event.preventDefault();
    // Hash- oder History-Mode erkennen
    let mode = 'hash';
    const router = document.querySelector('x-router');
    if (router && router.getAttribute('mode') === 'history') mode = 'history';
    // Query-String und State-Objekt unterstützen (optional)
    let state = undefined;
    if (this.hasAttribute('state')) {
      try { state = JSON.parse(this.getAttribute('state')); } catch {}
    }
    const normalizedHref = this._normalizePath(href.replace(/^#/, ''));
    // before-navigate Event
    const before = this.dispatchEvent(new CustomEvent('before-navigate', {
      detail: {
        href: normalizedHref,
        mode,
        state,
        source: 'x-link',
        stateKey: `xlink-active-${this.id}`,
        scheduleRef: 'ui.user-blocking.navigation'
      },
      cancelable: true,
      bubbles: true,
      composed: true
    }));
    if (!before) return;

    if (mode === 'history') {
      if (normalizedHref !== this._normalizePath(window.location.pathname + window.location.search)) {
        history.pushState(state || {}, '', normalizedHref);
        document.body.dispatchEvent(new CustomEvent('x-navigate', {
          bubbles: true,
          composed: true,
          detail: {
            path: normalizedHref,
            state,
            mode,
            source: 'x-link',
            stateKey: `xlink-active-${this.id}`,
            scheduleRef: 'ui.user-blocking.navigation'
          }
        }));
      } else {
        this._updateActive();
      }
    } else {
      const currentHashPath = this._normalizePath(window.location.hash.replace(/^#/, ''));
      if (currentHashPath !== normalizedHref) {
        window.location.hash = normalizedHref;
      } else {
        document.body.dispatchEvent(new CustomEvent('x-navigate', {
          bubbles: true,
          composed: true,
          detail: {
            path: normalizedHref,
            state,
            mode,
            source: 'x-link',
            stateKey: `xlink-active-${this.id}`,
            scheduleRef: 'ui.user-blocking.navigation'
          }
        }));
      }
    }
    this._updateActive();
    // after-navigate Event
    this.dispatchEvent(new CustomEvent('after-navigate', {
      detail: {
        href: normalizedHref,
        mode,
        state,
        source: 'x-link',
        stateKey: `xlink-active-${this.id}`,
        scheduleRef: 'ui.user-blocking.navigation'
      },
      bubbles: true,
      composed: true
    }));
  }

  _onKeyDown(e) {
    if (this._isDisabled()) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._anchor.click();
    }
  }

  focus(options) {
    this._anchor.focus(options);
  }

  snapshot() {
    return {
      schema: 'xtend.component.navigation-routing-snapshot.v1',
      source: 'x-link',
      stateKey: `xlink-active-${this.id}`,
      href: this.getAttribute('href') || '',
      active: this.hasAttribute('active'),
      external: this._isExternal(this.getAttribute('href') || ''),
      scheduleRef: 'diagnostics.snapshot'
    };
  }
}
customElements.define('x-link', XLink);
