class XLink extends HTMLElement {
  static get observedAttributes() {
    return ['href'];
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

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: var(--xtend-link-display, inline-block);
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          vertical-align: baseline;
        }
        a {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          color: inherit;
          background: inherit;
          text-decoration: var(--link-decoration, none);
          cursor: pointer;
          border: none;
          outline: none;
          overflow-wrap: anywhere;
          word-break: var(--xtend-link-word-break, normal);
          white-space: var(--xtend-link-white-space, normal);
        }
        ::slotted(*) {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        a:focus {
          outline: var(--focus-outline, 2px solid #0056b3);
        }
        a:focus-visible {
          outline: var(--xtend-link-focus, var(--focus-outline, 2px solid Highlight));
          outline-offset: 2px;
        }
        a:hover {
          text-decoration: var(--link-hover-decoration, underline);
        }
        :host([active]) a {
          font-weight: bold;
          text-decoration: var(--link-active-decoration, underline);
          color: var(--xtend-link-active-color, currentColor);
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
    this.attributeChangedCallback('href', null, this.getAttribute('href'));
    window.addEventListener('popstate', this._updateActive);
    window.addEventListener('hashchange', this._updateActive);
    window.addEventListener('xrouter-after-navigate', this._onNavigationChange);
    document.body.addEventListener('x-navigate', this._onNavigationChange);
    this._updateActive();
  }

  disconnectedCallback() {
    this._anchor.removeEventListener('click', this._onClick);
    this._anchor.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('popstate', this._updateActive);
    window.removeEventListener('hashchange', this._updateActive);
    window.removeEventListener('xrouter-after-navigate', this._onNavigationChange);
    document.body.removeEventListener('x-navigate', this._onNavigationChange);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'href') {
      if (typeof newVal === 'string') {
        this._anchor.setAttribute('href', newVal);
      } else {
        this._anchor.removeAttribute('href');
      }
      this._syncExternalAttributes();
      this._updateActive();
    }
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
    if (!href || this._isExternal(href)) {
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
    const detail = {
      href: this._normalizePath(href.replace(/^#/, '')),
      active,
      source: 'x-link',
      stateKey: `xlink-active-${this.id}`,
      scheduleRef: 'route.visible.render'
    };
    const stateApi = globalThis.xstate;
    if (stateApi && typeof stateApi.set === 'function') {
      stateApi.set(`xlink-active-${this.id}`, detail);
    }
    if (this._status) {
      this._status.textContent = active ? 'Aktiver Navigationslink' : '';
    }
  }

  _onClick(event) {
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
