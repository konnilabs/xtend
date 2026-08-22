import { xtendState } from './xtend-state.js';

class XDrawer extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'placement', 'modal', 'label', 'route-aware'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-drawer',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-drawer/x-drawer.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xdrawer.js',
        declaration: 'components/xdrawer.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'visible'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-drawer',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['component.visible.mount', 'component.lazy.hydrate', 'route.visible.render', 'overlay.drawer.transition', 'diagnostics.snapshot'],
      hydration: { policy: 'lazy', lane: 'visible' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-drawer',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-drawer',
      role: 'dialog',
      accessibleName: 'required',
      liveRegion: 'polite',
      screenreader: {
        signalContract: XDrawer.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XDrawer.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-drawer',
      budgetClass: 'overlay-large',
      lane: 'visible',
      hydrationPolicy: 'lazy',
      criticalMeasurements: ['mount', 'hydrate', 'route'],
      cleanup: ['document-keydown', 'route-listeners']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-drawer',
      liveRegion: 'polite',
      signals: ['drawer-open', 'drawer-close', 'route-change-announcement', 'focus-return'],
      statusRegions: ['role=status', 'aria-live=polite'],
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
      componentRef: 'x-drawer',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'instant-drawer-open-close',
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

  static get xtendOverlayInteractionUxProfile() {
    return {
      schema: 'xtend.component.overlay-interaction-ux-profile.v1',
      componentRef: 'x-drawer',
      family: 'drawer',
      role: 'dialog',
      modality: 'modal-optional',
      focusTrap: 'conditional-when-modal',
      inertStrategy: 'document-background-inert-when-modal',
      escapeBehavior: 'close-topmost',
      outsideClick: 'overlay-close',
      scrollLock: 'balanced-document-lock-when-modal',
      portalStrategy: 'host-local-fixed-layer',
      events: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
      commands: ['open', 'close', 'toggle', 'focus-trap', 'release-focus', 'apply-inert', 'release-inert', 'lock-scroll', 'unlock-scroll', 'snapshot'],
      stateKey: 'xdrawer-open-<id>',
      schedule: 'overlay.stack.open',
      fabric: {
        lane: 'visible',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: {
        adapter: 'xtend.component',
        scheduleRefs: ['overlay.stack.open', 'overlay.stack.close', 'overlay.focus.trap', 'overlay.inert.apply', 'overlay.scroll.lock', 'route.visible.render', 'diagnostics.snapshot'],
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      overlaySemantics: {
        topmostEscapeOnly: true,
        modalFocusTrapOnly: true,
        routeAwareClose: true,
        portalContainerStable: true
      }
    };
  }

  static get xtendSurfaceOverlayCompatibilityProfile() {
    return {
      schema: 'xtend.surface.overlay-stack-bridge.v1',
      componentRef: 'x-drawer',
      surfaceType: 'drawer',
      managerSlot: 'overlays',
      managerEvent: 'surface-overlay-command',
      legacyLifecycleEvents: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
      legacyStateKey: 'xdrawer-open-<id>',
      registration: 'optional',
      bridgeModule: 'components/xsurfaceoverlay-bridge.js',
      surfaceRecordSchema: 'xtend.surface.record.v1',
      legacyApiPreserved: true,
      fabric: {
        lane: 'visible',
        diagnosticsLane: 'diagnostics'
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      }
    };
  }

  constructor() {
    super();
    this._open = false;
    this._lastFocusedElement = null;
    this._unsubscribeState = null;
    this._themeObserver = null;
    this._synchronizingAttribute = false;
    this._onDocumentKeyDown = this._handleKeyDown.bind(this);
    this._onShadowKeyDown = this._handleFocusTrap.bind(this);
    this._onRouteChanged = this._handleRouteChanged.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xtend-overlay-surface: var(--xtend-surface, var(--section-bg, #ffffff));
          --xtend-overlay-text: var(--xtend-text, var(--text-color, #111827));
          --xtend-overlay-border-color: var(--xtend-border-color, var(--border-color, #e5e7eb));
          --xtend-overlay-elevation: var(--xtend-shadow-overlay, 0 24px 64px rgba(15, 23, 42, 0.24));
          --xtend-overlay-backdrop: var(--xtend-overlay-bg, rgba(15, 23, 42, 0.45));
          --xtend-overlay-focus-ring: 2px solid var(--xtend-focus-color, var(--xtend-color-primary, #2563eb));
          --xtend-overlay-backdrop-z: var(--surface-overlay-backdrop-z, 2147483602);
          --xtend-overlay-z: var(--surface-overlay-z, 2147483603);
          --xdrawer-bg: var(--drawer-bg, var(--xtend-overlay-surface));
          --xdrawer-color: var(--drawer-color, var(--xtend-overlay-text));
          --xdrawer-border: var(--drawer-border, var(--xtend-overlay-border-color));
          --xdrawer-shadow: var(--drawer-shadow, var(--xtend-overlay-elevation));
          --xdrawer-overlay-bg: var(--drawer-overlay-bg, var(--xtend-overlay-backdrop));
          --xdrawer-focus: var(--drawer-focus, var(--xtend-focus-color, var(--xtend-color-primary, #2563eb)));
          --xdrawer-close-bg: var(--drawer-close-bg, transparent);
          --xdrawer-close-size: var(--drawer-close-size, 2.5rem);
          --xdrawer-close-border: var(--drawer-close-border, var(--xdrawer-border));
          --xdrawer-close-color: var(--drawer-close-color, var(--xdrawer-color));
          --xdrawer-close-hover-bg: var(--drawer-close-hover-bg, rgba(37, 99, 235, 0.1));
          --xdrawer-close-hover-color: var(--drawer-close-hover-color, var(--xdrawer-focus));
          display: contents;
          color: var(--xdrawer-color);
          color-scheme: light;
        }
        :host([data-theme="dark"]),
        :host-context(html[data-theme="dark"]),
        :host-context([data-theme="dark"]) {
          --xdrawer-bg: var(--drawer-bg-dark, var(--drawer-bg, var(--xtend-surface, var(--section-bg, #0b0b0d))));
          --xdrawer-color: var(--drawer-color-dark, var(--drawer-color, var(--xtend-text, var(--text-color, #f4f4f5))));
          --xdrawer-border: var(--drawer-border-dark, var(--drawer-border, var(--xtend-border-color, var(--border-color, rgba(255, 255, 255, 0.14)))));
          --xdrawer-shadow: var(--drawer-shadow-dark, var(--drawer-shadow, 0 24px 72px rgba(0, 0, 0, 0.54)));
          --xdrawer-overlay-bg: var(--drawer-overlay-bg-dark, var(--drawer-overlay-bg, var(--xtend-overlay-bg, rgba(0, 0, 0, 0.72))));
          --xdrawer-close-hover-bg: var(--drawer-close-hover-bg-dark, var(--drawer-close-hover-bg, rgba(255, 255, 255, 0.1)));
          --xdrawer-close-hover-color: var(--drawer-close-hover-color-dark, var(--drawer-close-hover-color, var(--xdrawer-color)));
          color-scheme: dark;
        }
        .trigger {
          display: inline-flex;
        }
        .overlay {
          position: fixed;
          inset: 0;
          z-index: var(--xtend-overlay-backdrop-z);
          background: var(--xdrawer-overlay-bg);
          opacity: 0;
          pointer-events: none;
          transition: opacity 160ms ease;
        }
        .drawer {
          position: fixed;
          z-index: var(--xtend-overlay-z);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--xdrawer-bg);
          color: var(--xdrawer-color);
          box-shadow: var(--xdrawer-shadow);
          border: 1px solid var(--xdrawer-border);
          opacity: 0;
          pointer-events: none;
          transition: transform 180ms ease, opacity 180ms ease;
        }
        .drawer {
          top: 0;
          right: 0;
          width: min(24rem, 92vw);
          height: 100vh;
          transform: translateX(100%);
        }
        :host([placement="left"]) .drawer {
          right: auto;
          left: 0;
          transform: translateX(-100%);
        }
        :host([placement="bottom"]) .drawer {
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100vw;
          height: min(24rem, 80vh);
          transform: translateY(100%);
        }
        :host([open]) .overlay {
          opacity: 1;
          pointer-events: auto;
        }
        :host([open]) .drawer {
          opacity: 1;
          pointer-events: auto;
          transform: translate(0, 0);
        }
        header,
        footer {
          padding: 1rem;
          border-color: var(--xdrawer-border);
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--xdrawer-border);
        }
        .content {
          flex: 1;
          min-height: 0;
          overflow: auto;
          padding: 0 1rem;
        }
        footer {
          border-top: 1px solid var(--xdrawer-border);
        }
        button {
          border: 1px solid currentColor;
          border-radius: 4px;
          background: var(--xdrawer-close-bg);
          color: inherit;
          cursor: pointer;
          padding: 0.375rem 0.5rem;
          font: inherit;
        }
        .close {
          width: var(--xdrawer-close-size);
          height: var(--xdrawer-close-size);
          min-width: var(--xdrawer-close-size);
          min-height: var(--xdrawer-close-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: none;
          padding: 0;
          border-radius: 999px;
          border-color: var(--xdrawer-close-border);
          color: var(--xdrawer-close-color);
          line-height: 0;
        }
        .close svg {
          width: 1.1rem;
          height: 1.1rem;
          stroke: currentColor;
        }
        button:hover,
        .close:hover {
          background: var(--xdrawer-close-hover-bg);
          color: var(--xdrawer-close-hover-color);
        }
        button:focus-visible,
        .drawer:focus-visible {
          outline: var(--xtend-overlay-focus-ring);
          outline-offset: 2px;
        }
        .sr-status {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .overlay,
          .drawer {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .overlay,
          .drawer,
          button {
            forced-color-adjust: auto;
          }
          .overlay {
            background: Canvas;
            opacity: 0.7;
          }
          .drawer {
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
            box-shadow: none;
          }
        }
      </style>
      <span class="trigger" part="trigger"><slot name="trigger"></slot></span>
      <div class="overlay" part="backdrop overlay" aria-hidden="true"></div>
      <aside id="drawer" class="drawer" part="root surface overlay-surface" role="dialog" aria-modal="true" aria-hidden="true" tabindex="-1" inert>
        <header part="header">
          <slot name="header"><span id="label"></span></slot>
          <button type="button" class="close" part="close control" aria-label="Close drawer">
            <svg part="close-icon control icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.75 7.75L16.25 16.25M16.25 7.75L7.75 16.25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>
            </svg>
          </button>
        </header>
        <div class="content" part="content"><slot></slot></div>
        <footer part="footer"><slot name="footer"></slot></footer>
        <div class="sr-status" part="status" role="status" aria-live="polite"></div>
      </aside>
    `;
    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._overlay = this.shadowRoot.querySelector('.overlay');
    this._drawer = this.shadowRoot.querySelector('#drawer');
    this._label = this.shadowRoot.querySelector('#label');
    this._status = this.shadowRoot.querySelector('.sr-status');
    this._trigger.addEventListener('click', () => this.toggle());
    this._overlay.addEventListener('click', () => this.closeDrawer({ source: 'outside-click' }));
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.closeDrawer({ source: 'button' }));
  }

  connectedCallback() {
    if (!this.id) this.id = `xdrawer-${Math.random().toString(36).slice(2, 10)}`;
    this._drawer.id = `${this.id}-drawer`;
    this._trigger.setAttribute('aria-controls', this._drawer.id);
    this._syncThemeAttribute();
    this._observeThemeAttribute();
    document.addEventListener('keydown', this._onDocumentKeyDown);
    this.shadowRoot.addEventListener('keydown', this._onShadowKeyDown);
    document.addEventListener('route-changed', this._onRouteChanged);
    document.addEventListener('xrouter-after-navigate', this._onRouteChanged);
    this._unsubscribeState = xtendState.subscribe((key, value) => {
      if (key === `xdrawer-open-${this.id}` && typeof value === 'boolean') {
        value ? this.openDrawer({ source: 'xtend-state' }) : this.closeDrawer({ source: 'xtend-state' });
      }
    }, `xdrawer-open-${this.id}`);
    this.hasAttribute('open') ? this.openDrawer({ source: 'attribute', silent: true }) : this.closeDrawer({ source: 'initial', silent: true });
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    this.shadowRoot.removeEventListener('keydown', this._onShadowKeyDown);
    document.removeEventListener('route-changed', this._onRouteChanged);
    document.removeEventListener('xrouter-after-navigate', this._onRouteChanged);
    if (this._unsubscribeState) this._unsubscribeState();
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'open') {
      if (!this._synchronizingAttribute) {
        newValue === null ? this.closeDrawer({ source: 'attribute' }) : this.openDrawer({ source: 'attribute' });
      }
      return;
    }
    this._syncA11y();
  }

  get open() {
    return this._open;
  }

  set open(value) {
    value ? this.openDrawer() : this.closeDrawer();
  }

  get modal() {
    return this.hasAttribute('modal');
  }

  openDrawer(options = {}) {
    if (this._open) return;
    this._lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._setOpen(true, options.source || 'programmatic', options.silent);
    queueMicrotask(() => this._drawer.focus());
  }

  closeDrawer(options = {}) {
    if (!this._open && !this.hasAttribute('open')) {
      this._syncA11y();
      return;
    }
    this._releaseDrawerFocus();
    this._setOpen(false, options.source || 'programmatic', options.silent);
  }

  toggle() {
    this.open ? this.closeDrawer() : this.openDrawer();
  }

  snapshot() {
    return {
      schema: 'xtend.component.overlay-interaction-snapshot.v1',
      componentRef: 'x-drawer',
      id: this.id || null,
      open: this._open,
      modal: this.modal,
      placement: this.getAttribute('placement') || 'right',
      stateKey: this.id ? `xdrawer-open-${this.id}` : 'xdrawer-open-<id>',
      schedule: 'diagnostics.snapshot',
      fabric: {
        lane: 'diagnostics'
      }
    };
  }

  _setOpen(isOpen, source, silent = false) {
    this._open = isOpen;
    this._synchronizingAttribute = true;
    this.toggleAttribute('open', isOpen);
    this._synchronizingAttribute = false;
    this._syncA11y();
    xtendState.set(`xdrawer-open-${this.id}`, isOpen);
    if (!silent) {
      this.dispatchEvent(new CustomEvent(isOpen ? 'drawer-opened' : 'drawer-closed', {
        detail: { id: this.id, open: isOpen, source, placement: this.getAttribute('placement') || 'right', modal: this.modal },
        bubbles: true,
        composed: true
      }));
    }
  }

  _syncA11y() {
    const label = this.getAttribute('label') || 'Navigation drawer';
    this._label.textContent = label;
    this._drawer.setAttribute('aria-label', label);
    this._drawer.setAttribute('aria-modal', this.modal ? 'true' : 'false');
    if (this._open) {
      this._drawer.removeAttribute('inert');
      this._drawer.inert = false;
      this._drawer.setAttribute('aria-hidden', 'false');
    } else {
      this._releaseDrawerFocus();
      this._drawer.setAttribute('inert', '');
      this._drawer.inert = true;
      this._drawer.setAttribute('aria-hidden', 'true');
    }
    this._trigger.setAttribute('aria-expanded', this._open ? 'true' : 'false');
    this._status.textContent = this._open ? `${label} opened` : `${label} closed`;
  }

  _releaseDrawerFocus() {
    if (!this._drawerHasRetainedFocus()) return;
    const focusTarget = this._resolveFocusReturnTarget();
    if (focusTarget) {
      try {
        focusTarget.focus({ preventScroll: true });
      } catch (error) {
        focusTarget.focus();
      }
    }
    if (!this._drawerHasRetainedFocus()) return;
    const shadowActiveElement = this.shadowRoot.activeElement;
    if (shadowActiveElement && typeof shadowActiveElement.blur === 'function') {
      shadowActiveElement.blur();
    }
    const documentActiveElement = document.activeElement;
    if (documentActiveElement && this._isElementComposedIntoDrawer(documentActiveElement) && typeof documentActiveElement.blur === 'function') {
      documentActiveElement.blur();
    }
  }

  _resolveFocusReturnTarget() {
    if (
      this._lastFocusedElement &&
      this._lastFocusedElement.isConnected &&
      typeof this._lastFocusedElement.focus === 'function' &&
      !this._isElementComposedIntoDrawer(this._lastFocusedElement)
    ) {
      return this._lastFocusedElement;
    }
    const triggerSlot = this.shadowRoot.querySelector('slot[name="trigger"]');
    const triggerCandidate = triggerSlot
      ? triggerSlot.assignedElements({ flatten: true }).find((element) => element instanceof HTMLElement && typeof element.focus === 'function')
      : null;
    if (triggerCandidate && triggerCandidate.isConnected) {
      return triggerCandidate;
    }
    return document.body instanceof HTMLElement ? document.body : null;
  }

  _drawerHasRetainedFocus() {
    const shadowActiveElement = this.shadowRoot.activeElement;
    if (shadowActiveElement && this._isElementComposedIntoDrawer(shadowActiveElement)) {
      return true;
    }
    const documentActiveElement = document.activeElement;
    return Boolean(documentActiveElement && this._isElementComposedIntoDrawer(documentActiveElement));
  }

  _isElementComposedIntoDrawer(element) {
    if (!(element instanceof Element)) return false;
    if (this._drawer.contains(element)) return true;
    const slots = this._drawer.querySelectorAll('slot');
    return Array.from(slots).some((slot) => {
      return slot.assignedElements({ flatten: true }).some((assignedElement) => {
        return assignedElement === element || assignedElement.contains(element);
      });
    });
  }

  _syncThemeAttribute() {
    const root = document.documentElement;
    if (!root) return;
    const theme = root.getAttribute('data-theme');
    if (theme) {
      this.setAttribute('data-theme', theme);
    } else {
      this.removeAttribute('data-theme');
    }
  }

  _observeThemeAttribute() {
    if (this._themeObserver || typeof MutationObserver === 'undefined' || !document.documentElement) return;
    this._themeObserver = new MutationObserver(() => this._syncThemeAttribute());
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && this._open) {
      this.closeDrawer({ source: 'escape' });
    }
  }

  _handleFocusTrap(event) {
    if (!this._open || !this.modal || event.key !== 'Tab') return;
    const focusable = this.shadowRoot.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = this.shadowRoot.activeElement || document.activeElement;
    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  _handleRouteChanged(event) {
    if (!this.hasAttribute('route-aware')) return;
    const detail = event.detail || {};
    const routeRef = detail.path || detail.route || detail.href || detail.to || null;
    this.dispatchEvent(new CustomEvent('drawer-route-selected', {
      detail: { id: this.id, routeRef, source: 'x-router' },
      bubbles: true,
      composed: true
    }));
    this.closeDrawer({ source: 'route-change' });
  }
}

if (!customElements.get('x-drawer')) {
  customElements.define('x-drawer', XDrawer);
}
