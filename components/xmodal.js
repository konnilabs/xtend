// Selbst-ausfuehrende asynchrone Funktion statt direktem Import
(async function() {
  let xtendState;

  if (window.XTend?.state) {
    xtendState = window.XTend?.state;
  } else {
    try {
      const module = await import('./xtend-state.js');
      xtendState = module.xtendState;
    } catch (e) {
      console.error('Fehler beim Laden von xtendState in xmodal.js:', e);
      xtendState = {
        get: () => null,
        set: () => {},
        subscribe: () => () => {}
      };
    }
  }

  function getModalOpenKeys(id) {
    return [
      `xtend.component.x-modal.${id}.open`,
      `modal-open-${id}`
    ];
  }

  function setModalOpenState(id, isOpen) {
    if (!id) return;
    getModalOpenKeys(id).forEach((key) => xtendState.set(key, isOpen));
  }

  function getModalEntry(id) {
    const uiState = xtendState.get('ui');
    if (!uiState || !Array.isArray(uiState.modals)) return null;
    return uiState.modals.find((modal) => modal.id === id) || null;
  }

  function updateModalEntry(id, updater) {
    const uiState = xtendState.get('ui');
    if (!uiState || !Array.isArray(uiState.modals)) return;

    const modals = [...uiState.modals];
    const index = modals.findIndex((modal) => modal.id === id);
    if (index === -1) return;

    const nextEntry = updater({ ...modals[index] });
    if (nextEntry === null) {
      modals.splice(index, 1);
    } else {
      modals[index] = nextEntry;
    }

    xtendState.set('ui', { ...uiState, modals });
  }

  function readModalOpenState(id, fallbackOpen) {
    const explicitValues = getModalOpenKeys(id)
      .map((key) => xtendState.get(key))
      .filter((value) => typeof value === 'boolean');

    if (explicitValues.some((value) => value === true)) return true;
    if (explicitValues.some((value) => value === false)) return false;

    const entry = getModalEntry(id);
    if (entry && typeof entry.open === 'boolean') {
      return entry.open;
    }

    return fallbackOpen;
  }

  class XModal extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'overlay', 'title', 'content', 'actions'];
    }

    static get xtendComponentContract() {
      return {
        schema: 'xtend.component.contract.v2',
        tag: 'x-modal',
        maturity: 'stable',
        source: {
          strategy: 'xtend.typescript.component-source-strategy.v1',
          state: 'js-legacy-compatible',
          sourcePath: 'components/xmodal.js'
        },
        runtime: {
          format: 'esm',
          artifact: 'components/xmodal.js',
          declaration: 'components/xmodal.d.ts',
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
        tag: 'x-modal',
        componentRecordKind: 'custom_element',
        templateMode: 'dom_descriptor',
        eventBindingMode: 'dom-event-to-rmt-command',
        schedules: ['component.visible.mount', 'component.idle.hydrate', 'overlay.stack.open', 'overlay.stack.close', 'overlay.focus.trap', 'overlay.inert.apply', 'overlay.scroll.lock', 'diagnostics.snapshot'],
        hydration: { policy: 'visible', lane: 'user-blocking' },
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      };
    }

    static get xtendComponentLifecycleTelemetry() {
      return {
        schema: 'xtend.component.lifecycle-telemetry.v1',
        componentRef: 'x-modal',
        operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
        snapshotPath: 'snapshot.componentTelemetry'
      };
    }

    static get xtendScaffoldA11yProfile() {
      return {
        schema: 'xtend.a11y.profile.v1',
        componentRef: 'x-modal',
        role: 'dialog',
        accessibleName: 'required',
        liveRegion: 'none',
        screenreader: {
          signalContract: XModal.xtendScreenreaderSignals
        },
        motionContrast: {
          policy: XModal.xtendMotionContrastPolicy
        }
      };
    }

    static get xtendScaffoldPerformanceProfile() {
      return {
        schema: 'xtend.performance.component-profile.v1',
        componentRef: 'x-modal',
        budgetClass: 'overlay-medium',
        lane: 'user-blocking',
        hydrationPolicy: 'visible',
        criticalMeasurements: ['mount', 'hydrate', 'event'],
        cleanup: ['document-keydown', 'shadow-keydown', 'focus-return']
      };
    }

    static get xtendScreenreaderSignals() {
      return {
        schema: 'xtend.a11y.screenreader-signals.v1',
        componentRef: 'x-modal',
        liveRegion: 'none',
        signals: ['dialog-context', 'focus-return'],
        statusRegions: [],
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
        componentRef: 'x-modal',
        motion: {
          schema: 'xtend.a11y.motion-policy.v1',
          mediaQuery: '(prefers-reduced-motion: reduce)',
          reducedMotion: 'required',
          animationPolicy: 'instant-open-close-allowed',
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
        componentRef: 'x-modal',
        family: 'modal-dialog',
        role: 'dialog',
        modality: 'modal',
        focusTrap: 'required',
        inertStrategy: 'document-background-inert',
        escapeBehavior: 'close-topmost',
        outsideClick: 'overlay-close',
        scrollLock: 'balanced-document-lock',
        portalStrategy: 'document-body-portal-layer',
        events: ['modal-opened', 'modal-closed', 'modal-action'],
        commands: ['open', 'close', 'focus-trap', 'release-focus', 'apply-inert', 'release-inert', 'lock-scroll', 'unlock-scroll', 'snapshot'],
        stateKey: 'modal-open-<id>',
        schedule: 'overlay.stack.open',
        fabric: {
          lane: 'user-blocking',
          a11yLane: 'a11y',
          diagnosticsLane: 'diagnostics'
        },
        rmt: {
          adapter: 'xtend.component',
          scheduleRefs: ['overlay.stack.open', 'overlay.stack.close', 'overlay.focus.trap', 'overlay.inert.apply', 'overlay.scroll.lock', 'diagnostics.snapshot'],
          kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
        },
        overlaySemantics: {
          topmostEscapeOnly: true,
          returnFocusRequired: true,
          ariaHiddenFallbackRequired: true,
          portalContainerStable: true
        }
      };
    }

    static get xtendSurfaceOverlayCompatibilityProfile() {
      return {
        schema: 'xtend.surface.overlay-stack-bridge.v1',
        componentRef: 'x-modal',
        surfaceType: 'modal',
        managerSlot: 'overlays',
        managerEvent: 'surface-overlay-command',
        legacyLifecycleEvents: ['modal-opened', 'modal-closed', 'modal-action'],
        legacyStateKey: 'modal-open-<id>',
        registration: 'optional',
        bridgeModule: 'components/xsurfaceoverlay-bridge.js',
        surfaceRecordSchema: 'xtend.surface.record.v1',
        legacyApiPreserved: true,
        fabric: {
          lane: 'user-blocking',
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
      this.attachShadow({ mode: 'open' });
      this._open = false;
      this._overlay = this.hasAttribute('overlay');
      this._title = this.getAttribute('title') || '';
      this._content = this.getAttribute('content') || '';
      this._actions = null;
      this._unsubscribeState = null;
      this._synchronizingAttribute = false;
      this._lastFocusedElement = null;
      this._onDocumentKeyDown = this._handleKeyDown.bind(this);
      this._onShadowKeyDown = this._handleFocusTrap.bind(this);
      this._portalParent = null;
      this._portalNextSibling = null;
      this._isPortaled = false;
      this._isMovingPortal = false;
    }

    connectedCallback() {
      if (this._isMovingPortal) return;

      if (!this.id) {
        this.id = `modal-${Math.random().toString(36).slice(2, 10)}`;
      }

      document.addEventListener('keydown', this._onDocumentKeyDown);
      this.shadowRoot.addEventListener('keydown', this._onShadowKeyDown);

      if (typeof xtendState.subscribe === 'function') {
        this._unsubscribeState = xtendState.subscribe((key) => {
          if (
            key === null ||
            key === 'ui' ||
            getModalOpenKeys(this.id).includes(key)
          ) {
            this._syncFromRuntime();
          }
        }, ['ui', ...getModalOpenKeys(this.id)]);
      }

      if (this.hasAttribute('open')) {
        setModalOpenState(this.id, true);
      }

      this._syncFromRuntime();
    }

    disconnectedCallback() {
      if (this._isMovingPortal) return;

      document.removeEventListener('keydown', this._onDocumentKeyDown);
      this.shadowRoot.removeEventListener('keydown', this._onShadowKeyDown);
      if (typeof this._unsubscribeState === 'function') {
        this._unsubscribeState();
        this._unsubscribeState = null;
      }
      this._clearPortalState();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;

      if (name === 'open' && !this._synchronizingAttribute && this.isConnected && this.id) {
        const shouldOpen = newValue !== null;
        setModalOpenState(this.id, shouldOpen);
        const entry = getModalEntry(this.id);
        if (entry) {
          updateModalEntry(this.id, (modal) => ({ ...modal, open: shouldOpen }));
        }
      }

      this._syncFromRuntime();
    }

    snapshot() {
      return {
        schema: 'xtend.component.overlay-interaction-snapshot.v1',
        componentRef: 'x-modal',
        id: this.id || null,
        open: this._open,
        overlay: this._overlay,
        stateKey: this.id ? `modal-open-${this.id}` : 'modal-open-<id>',
        schedule: 'diagnostics.snapshot',
        fabric: {
          lane: 'diagnostics'
        }
      };
    }

    open() {
      if (this.id) {
        setModalOpenState(this.id, true);
        const entry = getModalEntry(this.id);
        if (entry) {
          updateModalEntry(this.id, (modal) => ({ ...modal, open: true }));
        }
      }

      this._syncFromRuntime();
    }

    close(options = {}) {
      const source = options.source || 'programmatic';
      const managedByApi = this.dataset.managed === 'api';
      const entry = getModalEntry(this.id);

      if (this.id) {
        setModalOpenState(this.id, false);

        if (entry) {
          if (managedByApi) {
            updateModalEntry(this.id, () => null);
          } else {
            updateModalEntry(this.id, (modal) => ({ ...modal, open: false }));
          }
        }
      }

      this._syncFromRuntime({ source });

      if (managedByApi && !getModalEntry(this.id)) {
        this.remove();
      }
    }

    _getResolvedActions(entry) {
      if (entry && Array.isArray(entry.actions)) {
        return entry.actions;
      }

      const rawActions = this.getAttribute('actions');
      if (!rawActions) return null;

      try {
        const actions = JSON.parse(rawActions);
        return Array.isArray(actions) ? actions : null;
      } catch {
        return null;
      }
    }

    _getResolvedState() {
      const entry = getModalEntry(this.id);
      return {
        entry,
        title: entry && typeof entry.title === 'string' ? entry.title : (this.getAttribute('title') || ''),
        content: entry && typeof entry.content === 'string' ? entry.content : (this.getAttribute('content') || ''),
        overlay: entry ? entry.hasOverlay !== false : this.hasAttribute('overlay'),
        actions: this._getResolvedActions(entry),
        open: readModalOpenState(this.id, this.hasAttribute('open'))
      };
    }

    _syncOpenAttribute(isOpen) {
      this._synchronizingAttribute = true;
      if (isOpen) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
      this._synchronizingAttribute = false;
    }

    _syncFromRuntime(options = {}) {
      const source = options.source || 'state';
      const previousOpen = this._open;
      const state = this._getResolvedState();

      this._open = state.open;
      this._overlay = state.overlay;
      this._title = state.title;
      this._content = state.content;
      this._actions = state.actions;

      this._syncOpenAttribute(this._open);
      if (this._open && this._overlay) {
        this._ensureDocumentPortal();
      }
      this._render(state);

      if (this._open && !previousOpen) {
        this._lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this._emitLifecycleEvent('modal-opened', source);
        queueMicrotask(() => {
          const modal = this.shadowRoot.querySelector('.x-modal');
          if (modal instanceof HTMLElement) {
            modal.focus();
          }
        });
      }

      if (!this._open && previousOpen) {
        this._emitLifecycleEvent('modal-closed', source);
        this._restoreDocumentPortal();
        if (this._lastFocusedElement && typeof this._lastFocusedElement.focus === 'function') {
          queueMicrotask(() => this._lastFocusedElement.focus());
        }
      }

      if (!this._open && this.dataset.managed === 'api' && !state.entry) {
        this.remove();
      }
    }

    _ensureDocumentPortal() {
      if (this._isPortaled || !this.isConnected || !document.body || this.parentNode === document.body) {
        return;
      }

      this._portalParent = this.parentNode;
      this._portalNextSibling = this.nextSibling;
      this._isMovingPortal = true;
      document.body.appendChild(this);
      this._isMovingPortal = false;
      this._isPortaled = true;
      this.setAttribute('data-xtend-portal', 'document-body');
    }

    _restoreDocumentPortal() {
      if (!this._isPortaled) return;

      const parent = this._portalParent;
      const nextSibling = this._portalNextSibling;
      this._isMovingPortal = true;

      if (parent && parent.isConnected) {
        parent.insertBefore(this, nextSibling && nextSibling.parentNode === parent ? nextSibling : null);
      } else if (this.parentNode) {
        this._isMovingPortal = false;
        this.remove();
        this._clearPortalState();
        return;
      }

      this._isMovingPortal = false;
      this._clearPortalState();
    }

    _clearPortalState() {
      this._portalParent = null;
      this._portalNextSibling = null;
      this._isPortaled = false;
      this._isMovingPortal = false;
      this.removeAttribute('data-xtend-portal');
    }

    _emitLifecycleEvent(name, source) {
      this.dispatchEvent(new CustomEvent(name, {
        detail: {
          id: this.id,
          open: this._open,
          source
        },
        bubbles: true,
        composed: true
      }));
    }

    _render(state) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --xtend-overlay-backdrop: var(--xtend-overlay-bg, rgba(30, 34, 44, 0.55));
            --xtend-overlay-surface: var(--xtend-surface-muted, rgba(255,255,255,0.88));
            --xtend-overlay-text: var(--xtend-text, #1f2635);
            --xtend-overlay-elevation: var(--xtend-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.18));
            --xtend-overlay-radius: var(--xtend-radius, 18px);
            --xtend-overlay-focus-ring: var(--xtend-focus-outline, 2px solid #4fc3f7);
            --xtend-overlay-z: var(--surface-overlay-z, 2147483645);
            --xmodal-overlay-bg: var(--modal-backdrop, var(--xmodal-backdrop, var(--xtend-overlay-backdrop)));
            --xmodal-surface: var(--modal-surface, var(--xtend-overlay-surface));
            --xmodal-text: var(--modal-text, var(--xtend-overlay-text));
            --xmodal-accent: var(--xtend-color-primary, #4fc3f7);
            --xmodal-accent-hover: var(--xtend-color-primary-dark, #0288d1);
            --xmodal-action-text: var(--modal-action-text, var(--xtend-on-primary, #ffffff));
            --xmodal-close-bg: var(--modal-close-bg, rgba(255,255,255,0.12));
            --xmodal-close-hover-bg: var(--modal-close-hover-bg, rgba(79,195,247,0.18));
            --xmodal-shadow: var(--modal-shadow, var(--xtend-overlay-elevation));
            --xmodal-radius: var(--modal-radius, var(--xtend-overlay-radius));
            --xmodal-focus-outline: var(--modal-focus-outline, var(--xtend-overlay-focus-ring));
            font-family: var(--xtend-font-family, 'Inter', 'Segoe UI', Arial, sans-serif);
          }
          .x-modal-wrapper {
            position: fixed;
            inset: 0;
            display: ${state.open ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            z-index: var(--xtend-overlay-z);
          }
          .x-modal-overlay {
            position: absolute;
            inset: 0;
            background: var(--xmodal-overlay-bg);
            backdrop-filter: blur(var(--xtend-glass-blur, 18px));
          }
          .x-modal {
            position: relative;
            z-index: 1;
            min-width: 320px;
            max-width: 96vw;
            max-height: 90vh;
            overflow: auto;
            background: var(--xmodal-surface);
            color: var(--xmodal-text);
            border-radius: var(--xmodal-radius);
            box-shadow: var(--xmodal-shadow);
            padding: 2.2rem 1.5rem 1.5rem;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            grid-template-rows: auto minmax(0, 1fr) auto;
            grid-template-areas:
              "title close"
              "content content"
              "actions actions";
            align-items: start;
            column-gap: var(--modal-chrome-column-gap, 1rem);
            row-gap: var(--modal-chrome-row-gap, 1rem);
            outline: none;
            border: var(--xtend-border, 1.5px solid rgba(255,255,255,0.12));
            backdrop-filter: blur(var(--xtend-glass-blur, 18px));
            animation: fadeInScale 0.25s cubic-bezier(.4,1.4,.6,1);
          }
          .x-modal-title {
            grid-area: title;
            min-width: 0;
            font-size: 1.3em;
            font-weight: 600;
            margin: 0;
            color: var(--xmodal-accent);
            text-shadow: 0 2px 8px rgba(79,195,247,0.18);
          }
          .x-modal-content {
            grid-area: content;
            min-width: 0;
            overflow: auto;
            margin: 0;
          }
          .x-modal-actions {
            grid-area: actions;
            display: flex;
            flex-wrap: wrap;
            gap: 1em;
            justify-content: flex-end;
          }
          .x-modal-btn {
            background: var(--xmodal-accent);
            color: var(--xmodal-action-text);
            border: none;
            border-radius: 999px;
            padding: 0.7em 1.4em;
            font-size: 1em;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(40,60,120,0.10);
            transition: background 0.2s, transform 0.15s;
            min-width: 2.6em;
            min-height: 2.6em;
          }
          .x-modal-btn:hover {
            background: var(--xmodal-accent-hover);
            transform: scale(1.04);
          }
          .x-modal-close {
            grid-area: close;
            position: static;
            justify-self: end;
            align-self: start;
            background: var(--xmodal-close-bg);
            border: none;
            color: var(--xmodal-text);
            cursor: pointer;
            line-height: 1;
            width: 2.75em;
            height: 2.75em;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s, transform 0.15s;
          }
          .x-modal-close:focus-visible,
          .x-modal-btn:focus-visible {
            outline: var(--xmodal-focus-outline);
            outline-offset: 2px;
          }
          .x-modal-close:hover {
            background: var(--xmodal-close-hover-bg);
            color: var(--xmodal-accent);
            transform: scale(1.08);
          }
          .x-modal-close svg {
            width: 1.15em;
            height: 1.15em;
          }
          .x-modal-fallback {
            grid-area: content;
            display: none;
            padding: 0.8em;
            background: #fff0f0;
            color: #8a1f1f;
            border-radius: 0.6em;
          }
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .x-modal {
              animation: none !important;
            }
            .x-modal-close,
            .x-modal-btn {
              transition: none !important;
            }
          }
          @media (forced-colors: active) {
            .x-modal {
              forced-color-adjust: auto;
              color: CanvasText;
              background: Canvas;
              border: 1px solid CanvasText;
              box-shadow: none;
            }
            .x-modal-overlay {
              background: Canvas;
              opacity: 0.86;
            }
            .x-modal-close,
            .x-modal-btn {
              color: ButtonText;
              background: ButtonFace;
              border: 1px solid ButtonText;
            }
            .x-modal-close:focus-visible,
            .x-modal-btn:focus-visible {
              outline-color: Highlight;
            }
          }
          @media (max-width: 600px) {
            .x-modal {
              min-width: 0;
              padding: 1.2rem 0.5rem 1rem;
            }
          }
        </style>
        <div class="x-modal-wrapper" part="root overlay-root" role="presentation">
          ${state.overlay ? '<div class="x-modal-overlay" part="backdrop overlay" tabindex="-1" aria-hidden="true"></div>' : ''}
          <div class="x-modal" part="surface overlay-surface" role="dialog" aria-modal="true" aria-hidden="${state.open ? 'false' : 'true'}" tabindex="0">
            <button class="x-modal-close" part="close control" type="button" aria-label="Schliessen">
              <svg part="close-icon control icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.10)"></circle>
                <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
            </button>
            <div class="x-modal-title" part="title" id="xmodal-title">${state.title}</div>
            <div class="x-modal-content" part="content"></div>
            <div class="x-modal-actions" part="actions"></div>
            <div class="x-modal-fallback">[XModal sichtbar - kein Inhalt im Slot]</div>
          </div>
        </div>
      `;

      const modal = this.shadowRoot.querySelector('.x-modal');
      const overlay = this.shadowRoot.querySelector('.x-modal-overlay');
      const closeButton = this.shadowRoot.querySelector('.x-modal-close');
      const contentContainer = this.shadowRoot.querySelector('.x-modal-content');
      const actionsContainer = this.shadowRoot.querySelector('.x-modal-actions');
      const fallback = this.shadowRoot.querySelector('.x-modal-fallback');

      if (modal) {
        modal.setAttribute('aria-labelledby', 'xmodal-title');
      }

      if (overlay) {
        overlay.addEventListener('click', () => this.close({ source: 'overlay' }));
      }

      if (closeButton) {
        closeButton.addEventListener('click', () => this.close({ source: 'button' }));
      }

      if (contentContainer) {
        if (state.content) {
          const contentDiv = document.createElement('div');
          contentDiv.textContent = state.content;
          contentContainer.appendChild(contentDiv);
        } else {
          const slot = document.createElement('slot');
          contentContainer.appendChild(slot);
          slot.addEventListener('slotchange', () => this._updateFallbackVisibility(slot, fallback, false));
          this._updateFallbackVisibility(slot, fallback, false);
        }
      }

      if (actionsContainer) {
        if (state.actions && state.actions.length > 0) {
          state.actions.forEach((action) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'x-modal-btn';
            button.textContent = action.label || action.action || 'OK';
            button.addEventListener('click', () => {
              const detail = {
                id: this.id,
                action: action.action || action.label || 'action',
                definition: action
              };

              this.dispatchEvent(new CustomEvent('modal-action', {
                detail,
                bubbles: true,
                composed: true
              }));

              if (typeof action.callback === 'function') {
                action.callback(this, action);
              }

              if (action.close !== false) {
                this.close({ source: 'action' });
              }
            });
            actionsContainer.appendChild(button);
          });
        } else {
          const actionsSlot = document.createElement('slot');
          actionsSlot.name = 'actions';
          actionsContainer.appendChild(actionsSlot);
        }
      }

      if (state.content) {
        this._updateFallbackVisibility(null, fallback, true);
      }
    }

    _updateFallbackVisibility(slot, fallback, hasStateContent) {
      if (!fallback) return;

      if (hasStateContent) {
        fallback.style.display = 'none';
        return;
      }

      if (!slot) {
        fallback.style.display = 'block';
        return;
      }

      const hasAssignedNodes = slot.assignedNodes({ flatten: true }).length > 0;
      fallback.style.display = hasAssignedNodes ? 'none' : 'block';
    }

    _handleKeyDown(event) {
      if (!this._open) return;
      if (event.key === 'Escape') {
        this.close({ source: 'escape' });
      }
    }

    _handleFocusTrap(event) {
      if (!this._open || event.key !== 'Tab') return;

      const focusable = this.shadowRoot.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

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
  }

  if (!customElements.get('x-modal')) {
    customElements.define('x-modal', XModal);
  }
})();
