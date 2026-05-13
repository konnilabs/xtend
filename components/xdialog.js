// Selbst-ausfuehrende asynchrone Funktion statt direktem Import
(async function() {
  let xstate;

  if (window.xstate) {
    xstate = window.xstate;
  } else {
    try {
      const module = await import('./xstate.js');
      xstate = module.xstate;
    } catch (e) {
      console.error('Fehler beim Laden von xstate in xdialog.js:', e);
      xstate = {
        get: () => null,
        set: () => {},
        subscribe: () => () => {}
      };
    }
  }

  function getDialogOpenKeys(id) {
    return [
      `xtend.component.x-dialog.${id}.open`,
      `dialog-open-${id}`,
      `xdialog-open-${id}`
    ];
  }

  function setDialogOpenState(id, isOpen) {
    if (!id) return;
    getDialogOpenKeys(id).forEach((key) => xstate.set(key, isOpen));
  }

  function getDialogEntry(id) {
    const uiState = xstate.get('ui');
    if (!uiState || !Array.isArray(uiState.dialogs)) return null;
    return uiState.dialogs.find((dialog) => dialog.id === id) || null;
  }

  function updateDialogEntry(id, updater) {
    const uiState = xstate.get('ui');
    if (!uiState || !Array.isArray(uiState.dialogs)) return;

    const dialogs = [...uiState.dialogs];
    const index = dialogs.findIndex((dialog) => dialog.id === id);
    if (index === -1) return;

    const nextEntry = updater({ ...dialogs[index] });
    if (nextEntry === null) {
      dialogs.splice(index, 1);
    } else {
      dialogs[index] = nextEntry;
    }

    xstate.set('ui', { ...uiState, dialogs });
  }

  function readDialogOpenState(id, fallbackOpen) {
    const explicitValues = getDialogOpenKeys(id)
      .map((key) => xstate.get(key))
      .filter((value) => typeof value === 'boolean');

    if (explicitValues.some((value) => value === true)) return true;
    if (explicitValues.some((value) => value === false)) return false;

    const entry = getDialogEntry(id);
    if (entry && typeof entry.open === 'boolean') {
      return entry.open;
    }

    return fallbackOpen;
  }

  class XDialog extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'overlay', 'title', 'width', 'height'];
    }

    static get xtendComponentContract() {
      return {
        schema: 'xtend.component.contract.v2',
        tag: 'x-dialog',
        maturity: 'stable',
        source: {
          strategy: 'xtend.typescript.component-source-strategy.v1',
          state: 'js-legacy-compatible',
          sourcePath: 'components/xdialog.js'
        },
        runtime: {
          format: 'esm',
          artifact: 'components/xdialog.js',
          declaration: 'components/xdialog.d.ts',
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
        tag: 'x-dialog',
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
        componentRef: 'x-dialog',
        operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
        snapshotPath: 'snapshot.componentTelemetry'
      };
    }

    static get xtendScaffoldA11yProfile() {
      return {
        schema: 'xtend.a11y.profile.v1',
        componentRef: 'x-dialog',
        role: 'dialog',
        accessibleName: 'required',
        liveRegion: 'none',
        screenreader: {
          signalContract: XDialog.xtendScreenreaderSignals
        },
        motionContrast: {
          policy: XDialog.xtendMotionContrastPolicy
        }
      };
    }

    static get xtendScaffoldPerformanceProfile() {
      return {
        schema: 'xtend.performance.component-profile.v1',
        componentRef: 'x-dialog',
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
        componentRef: 'x-dialog',
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
        componentRef: 'x-dialog',
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
        componentRef: 'x-dialog',
        family: 'dialog',
        role: 'dialog',
        modality: 'modal',
        focusTrap: 'required',
        inertStrategy: 'document-background-inert',
        escapeBehavior: 'close-topmost',
        outsideClick: 'overlay-close',
        scrollLock: 'balanced-document-lock',
        portalStrategy: 'host-local-fixed-layer',
        events: ['dialog-opened', 'dialog-closed'],
        commands: ['open', 'close', 'focus-trap', 'release-focus', 'apply-inert', 'release-inert', 'lock-scroll', 'unlock-scroll', 'snapshot'],
        stateKey: 'dialog-open-<id>',
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
        componentRef: 'x-dialog',
        surfaceType: 'dialog',
        managerSlot: 'overlays',
        managerEvent: 'surface-overlay-command',
        legacyLifecycleEvents: ['dialog-opened', 'dialog-closed'],
        legacyStateKey: 'dialog-open-<id>',
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
      this._width = this.getAttribute('width') || 'min(90vw, 480px)';
      this._height = this.getAttribute('height') || 'auto';
      this._unsubscribeState = null;
      this._synchronizingAttribute = false;
      this._lastFocusedElement = null;
      this._onDocumentKeyDown = this._handleKeyDown.bind(this);
      this._onShadowKeyDown = this._handleFocusTrap.bind(this);
    }

    connectedCallback() {
      if (!this.id) {
        this.id = `dialog-${Math.random().toString(36).slice(2, 10)}`;
      }

      document.addEventListener('keydown', this._onDocumentKeyDown);
      this.shadowRoot.addEventListener('keydown', this._onShadowKeyDown);

      if (typeof xstate.subscribe === 'function') {
        this._unsubscribeState = xstate.subscribe((key) => {
          if (
            key === null ||
            key === 'ui' ||
            getDialogOpenKeys(this.id).includes(key)
          ) {
            this._syncFromRuntime();
          }
        }, ['ui', ...getDialogOpenKeys(this.id)]);
      }

      if (this.hasAttribute('open')) {
        setDialogOpenState(this.id, true);
      }

      this._syncFromRuntime();
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onDocumentKeyDown);
      this.shadowRoot.removeEventListener('keydown', this._onShadowKeyDown);
      if (typeof this._unsubscribeState === 'function') {
        this._unsubscribeState();
        this._unsubscribeState = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;

      if (name === 'open' && !this._synchronizingAttribute && this.isConnected && this.id) {
        const shouldOpen = newValue !== null;
        setDialogOpenState(this.id, shouldOpen);
        const entry = getDialogEntry(this.id);
        if (entry) {
          updateDialogEntry(this.id, (dialog) => ({ ...dialog, open: shouldOpen }));
        }
      }

      this._syncFromRuntime();
    }

    snapshot() {
      return {
        schema: 'xtend.component.overlay-interaction-snapshot.v1',
        componentRef: 'x-dialog',
        id: this.id || null,
        open: this._open,
        overlay: this._overlay,
        stateKey: this.id ? `dialog-open-${this.id}` : 'dialog-open-<id>',
        schedule: 'diagnostics.snapshot',
        fabric: {
          lane: 'diagnostics'
        }
      };
    }

    open() {
      if (this.id) {
        setDialogOpenState(this.id, true);
        const entry = getDialogEntry(this.id);
        if (entry) {
          updateDialogEntry(this.id, (dialog) => ({ ...dialog, open: true }));
        }
      }

      this._syncFromRuntime();
    }

    close(options = {}) {
      const source = options.source || 'programmatic';
      const managedByApi = this.dataset.managed === 'api';
      const entry = getDialogEntry(this.id);

      if (this.id) {
        setDialogOpenState(this.id, false);

        if (entry) {
          if (managedByApi) {
            updateDialogEntry(this.id, () => null);
          } else {
            updateDialogEntry(this.id, (dialog) => ({ ...dialog, open: false }));
          }
        }
      }

      this._syncFromRuntime({ source });

      if (managedByApi && !getDialogEntry(this.id)) {
        this.remove();
      }
    }

    _getResolvedState() {
      const entry = getDialogEntry(this.id);
      return {
        entry,
        title: entry && typeof entry.title === 'string' ? entry.title : (this.getAttribute('title') || ''),
        overlay: entry ? entry.hasOverlay !== false : this.hasAttribute('overlay'),
        width: this.getAttribute('width') || 'min(90vw, 480px)',
        height: this.getAttribute('height') || 'auto',
        content: entry && typeof entry.content === 'string' ? entry.content : '',
        actions: entry && Array.isArray(entry.actions) ? entry.actions : null,
        open: readDialogOpenState(this.id, this.hasAttribute('open'))
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
      this._width = state.width;
      this._height = state.height;

      this._syncOpenAttribute(this._open);
      this._render(state);

      if (this._open && !previousOpen) {
        this._lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this._emitLifecycleEvent('dialog-opened', source);
        queueMicrotask(() => {
          const dialog = this.shadowRoot.querySelector('.xdialog');
          if (dialog instanceof HTMLElement) {
            dialog.focus();
          }
        });
      }

      if (!this._open && previousOpen) {
        this._emitLifecycleEvent('dialog-closed', source);
        if (this._lastFocusedElement && typeof this._lastFocusedElement.focus === 'function') {
          queueMicrotask(() => this._lastFocusedElement.focus());
        }
      }

      if (!this._open && this.dataset.managed === 'api' && !state.entry) {
        this.remove();
      }
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
            --xtend-overlay-surface: var(--xtend-surface, var(--xtend-overlay-backdrop));
            --xtend-overlay-text: var(--xtend-text-inverse, var(--xtend-color-accent, #fff));
            --xtend-overlay-elevation: var(--xtend-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.18));
            --xtend-overlay-radius: var(--xtend-radius, 18px);
            --xtend-overlay-focus-ring: var(--xtend-focus-outline, 2px solid #4fc3f7);
            --xtend-overlay-z: var(--surface-overlay-z, 2147483646);
            --xdialog-glass-bg: var(--dialog-backdrop, var(--xdialog-backdrop, var(--xtend-overlay-backdrop)));
            --xdialog-surface: var(--dialog-surface, var(--xtend-overlay-surface));
            --xdialog-glass-blur: var(--xtend-glass-blur, 18px);
            --xdialog-primary: var(--xtend-color-primary, #4fc3f7);
            --xdialog-primary-dark: var(--xtend-color-primary-dark, #0288d1);
            --xdialog-accent: var(--dialog-text, var(--xtend-overlay-text));
            --xdialog-action-text: var(--dialog-action-text, var(--xtend-on-primary, #ffffff));
            --xdialog-action-secondary-text: var(--dialog-action-secondary-text, #222222);
            --xdialog-close-bg: var(--dialog-close-bg, transparent);
            --xdialog-close-hover-bg: var(--dialog-close-hover-bg, rgba(79,195,247,0.18));
            --xdialog-border-radius: var(--dialog-radius, var(--xtend-overlay-radius));
            --xdialog-shadow: var(--dialog-shadow, var(--xtend-overlay-elevation));
            --xdialog-focus-outline: var(--dialog-focus-outline, var(--xtend-overlay-focus-ring));
            font-family: var(--xtend-font-family, 'Inter', 'Segoe UI', Arial, sans-serif);
          }
          .xdialog-wrapper {
            position: fixed;
            inset: 0;
            display: ${state.open ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            z-index: var(--xtend-overlay-z);
            min-width: 100vw;
            min-height: 100vh;
          }
          .xdialog-overlay {
            position: absolute;
            inset: 0;
            background: var(--xdialog-surface);
            backdrop-filter: blur(var(--xdialog-glass-blur));
          }
          .xdialog {
            background: var(--xdialog-glass-bg);
            color: var(--xdialog-accent);
            border-radius: var(--xdialog-border-radius);
            box-shadow: var(--xdialog-shadow);
            min-width: 320px;
            max-width: 90vw;
            max-height: 90vh;
            width: ${state.width};
            height: ${state.height};
            position: relative;
            z-index: 1;
            padding: 2em 2em 1.5em;
            animation: fadeInScale 0.25s cubic-bezier(.4,1.4,.6,1);
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            backdrop-filter: blur(var(--xdialog-glass-blur));
            border: var(--xtend-border, 1.5px solid rgba(255,255,255,0.12));
            outline: none;
          }
          .xdialog-title {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 0.7em;
            letter-spacing: 0.02em;
            color: var(--xdialog-primary);
            text-shadow: 0 2px 8px rgba(79,195,247,0.18);
          }
          .xdialog-content {
            color: inherit;
          }
          .xdialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.7em;
            margin-top: 1.5em;
          }
          .xdialog-actions button {
            background: var(--xdialog-primary);
            color: var(--xdialog-action-secondary-text);
            border: none;
            border-radius: 2em;
            padding: 0.5em 2em;
            font-size: 1em;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, transform 0.15s;
            box-shadow: 0 2px 8px rgba(79,195,247,0.10);
          }
          .xdialog-actions button.primary {
            background: var(--xdialog-primary-dark);
            color: var(--xdialog-action-text);
          }
          .xdialog-actions button:hover {
            background: var(--xdialog-primary-dark);
            color: var(--xdialog-action-text);
            transform: scale(1.08);
          }
          .xdialog-close {
            position: absolute;
            top: 1.1em;
            right: 1.3em;
            background: var(--xdialog-close-bg);
            border: none;
            width: 2.2em;
            height: 2.2em;
            border-radius: 50%;
            color: var(--xdialog-accent);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5em;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: background 0.2s, color 0.2s, transform 0.15s;
          }
          .xdialog-close:focus-visible {
            outline: var(--xdialog-focus-outline);
            outline-offset: 2px;
          }
          .xdialog-close:hover {
            background: var(--xdialog-close-hover-bg);
            color: var(--xdialog-primary);
            transform: scale(1.08);
          }
          .xdialog-fallback {
            color: #fff;
            background: #c00;
            padding: 1em;
            border-radius: 6px;
            margin-top: 1em;
            text-align: center;
            font-size: 1em;
            display: none;
          }
          @media (max-width: 600px) {
            .xdialog {
              max-width: 98vw;
              padding: 1em 0.5em;
            }
          }
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .xdialog {
              animation: none !important;
            }
            .xdialog-close {
              transition: none !important;
            }
          }
          @media (forced-colors: active) {
            .xdialog {
              forced-color-adjust: auto;
              color: CanvasText;
              background: Canvas;
              border: 1px solid CanvasText;
              box-shadow: none;
            }
            .xdialog-overlay {
              background: Canvas;
              opacity: 0.86;
            }
            .xdialog-close {
              color: ButtonText;
              background: ButtonFace;
              border: 1px solid ButtonText;
              box-shadow: none;
            }
            .xdialog-close:focus-visible {
              outline-color: Highlight;
            }
          }
        </style>
        <div class="xdialog-wrapper" part="root overlay-root" role="presentation">
          ${state.overlay ? '<div class="xdialog-overlay" part="backdrop overlay" tabindex="-1" aria-hidden="true"></div>' : ''}
          <div class="xdialog" part="surface overlay-surface" role="dialog" aria-modal="true" aria-hidden="${state.open ? 'false' : 'true'}" tabindex="0">
            <button class="xdialog-close" part="close control" aria-label="Schliessen">
              <svg part="close-icon control icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.10)"></circle>
                <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
            </button>
            <div class="xdialog-title" part="title" id="xdialog-title">${state.title}</div>
            <div class="xdialog-content" part="content"></div>
            <div class="xdialog-actions" part="actions"></div>
            <div class="xdialog-fallback">[XDialog sichtbar - kein Inhalt im Slot]</div>
          </div>
          <noscript>
            <div role="dialog" style="padding:1em;background:#fff;border-radius:4px;max-width:90vw;">
              Dialog kann nicht angezeigt werden. Bitte aktivieren Sie JavaScript.
            </div>
          </noscript>
        </div>
      `;

      const dialog = this.shadowRoot.querySelector('.xdialog');
      const overlay = this.shadowRoot.querySelector('.xdialog-overlay');
      const closeButton = this.shadowRoot.querySelector('.xdialog-close');
      const contentContainer = this.shadowRoot.querySelector('.xdialog-content');
      const actionsContainer = this.shadowRoot.querySelector('.xdialog-actions');
      const fallback = this.shadowRoot.querySelector('.xdialog-fallback');

      if (dialog) {
        dialog.setAttribute('aria-labelledby', 'xdialog-title');
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
            button.textContent = action.label || action.action || 'OK';
            if (action.primary) {
              button.classList.add('primary');
            }
            button.addEventListener('click', () => {
              if (typeof action.callback === 'function') {
                action.callback(this, action);
              }
              this.close({ source: 'action' });
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

  if (!customElements.get('x-dialog')) {
    customElements.define('x-dialog', XDialog);
  }
})();
