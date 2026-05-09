import { xstate } from './xstate.js';
import './xsurfacemanager-controller.js';
import {
  OVERLAY_LIFECYCLE_EVENTS,
  SURFACE_OVERLAY_SELECTOR,
  applyOverlaySurfaceSnapshot,
  findSurfaceOverlayElement,
  isSurfaceOverlayElement,
  overlaySurfaceId,
  toOverlaySurfaceRecord
} from './xsurfaceoverlay-bridge.js';

const SURFACE_MANAGED_ELEMENT_SELECTOR = `x-surface-window, x-side-panel, ${SURFACE_OVERLAY_SELECTOR}`;

function surfaceControllerApi() {
  return globalThis.XTendSurfaceController || null;
}

function fabricBridge() {
  const candidates = [
    globalThis.xtendFabric,
    globalThis.XTendFabricRuntime,
    globalThis.XTendFabric && globalThis.XTendFabric.runtime
  ];
  return candidates.find((candidate) => candidate && typeof candidate.emitDiagnostic === 'function') || null;
}

function composedSurfaceElements(slot) {
  return slot.assignedElements({ flatten: true })
    .flatMap((element) => {
      if (element.matches && element.matches(SURFACE_MANAGED_ELEMENT_SELECTOR)) return [element];
      return Array.from(element.querySelectorAll ? element.querySelectorAll(SURFACE_MANAGED_ELEMENT_SELECTOR) : []);
    });
}

function cssAttributeValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function surfaceElementSelector(surfaceId) {
  const id = cssAttributeValue(surfaceId);
  const overlayBySurfaceId = SURFACE_OVERLAY_SELECTOR
    .split(',')
    .map((selector) => `${selector.trim()}[surface-id="${id}"]`)
    .join(', ');
  const overlayById = SURFACE_OVERLAY_SELECTOR
    .split(',')
    .map((selector) => `${selector.trim()}[id="${id}"]`)
    .join(', ');
  return `x-surface-window[surface-id="${id}"], x-side-panel[surface-id="${id}"], ${overlayBySurfaceId}, ${overlayById}`;
}

class XSurfaceManager extends HTMLElement {
  static get observedAttributes() {
    return ['layout', 'restore-key', 'route-aware', 'modal-policy', 'manager-id', 'state-key'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-surface-manager',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-surface-manager/x-surface-manager.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsurfacemanager.js',
        declaration: 'components/xsurfacemanager.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        surfaceContract: 'xtend.surface.manager.v1',
        overlayCompatibility: 'xtend.surface.overlay-stack-bridge.v1',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'visible',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-surface-manager',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['surface.visible.render', 'surface.user-blocking.open', 'surface.user-blocking.close', 'surface.transition.layout', 'surface.diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'visible' },
      surface: {
        schema: 'xtend.surface.manager.v1',
        controller: 'xtend.surface.controller.v1',
        overlayBridge: 'xtend.surface.overlay-stack-bridge.v1',
        snapshot: 'xtend.surface.snapshot.v1',
        stateKey: 'xtend.surface.registry'
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-surface-manager',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'unmount'],
      snapshotPath: 'snapshot.surfaceManager'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-surface-manager',
      role: 'application',
      accessibleName: 'required',
      keyboard: ['surface-focus', 'delegated-window-keys'],
      screenreader: {
        signalContract: XSurfaceManager.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XSurfaceManager.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-surface-manager',
      budgetClass: 'interactive-shell',
      lane: 'visible',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'register-surface', 'snapshot'],
      cleanup: ['slotchange', 'surface-window-command', 'surface-panel-command', 'surface-overlay-command']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-surface-manager',
      liveRegion: 'polite',
      signals: ['surface-opened', 'surface-closed', 'surface-focused', 'surface-layout-changed'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.surface',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-surface-manager',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'delegated-surface-motion',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      }
    };
  }

  constructor() {
    super();
    this._controller = null;
    this._registeredElements = new Map();
    this._syncingOverlayElements = new WeakSet();
    this._handleSlotChange = this._registerAssignedSurfaces.bind(this);
    this._handleSurfaceCommand = this._onSurfaceCommand.bind(this);
    this._handlePanelCommand = this._onSurfaceCommand.bind(this);
    this._handleOverlayCommand = this._onSurfaceCommand.bind(this);
    this._handleOverlayLifecycle = this._onOverlayLifecycle.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          min-height: var(--surface-manager-min-height, 480px);
          color: var(--surface-manager-color, #111827);
          background: var(--surface-manager-bg, #f8fafc);
          overflow: hidden;
          isolation: isolate;
        }
        .root {
          position: relative;
          min-height: inherit;
          width: 100%;
          height: 100%;
        }
        .workspace,
        .panels,
        .overlays {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .workspace ::slotted(*),
        .panels ::slotted(*),
        .overlays ::slotted(*) {
          pointer-events: auto;
        }
        .status {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          clip-path: inset(50%);
          white-space: nowrap;
        }
        @media (forced-colors: active) {
          :host {
            background: Canvas;
            color: CanvasText;
          }
        }
      </style>
      <section class="root" part="root" role="application" aria-label="Surface workspace">
        <div class="workspace" part="workspace"><slot name="windows"></slot></div>
        <div class="panels" part="panels"><slot name="panels"></slot></div>
        <div class="overlays" part="overlays"><slot name="overlays"></slot></div>
        <slot></slot>
        <span class="status" role="status" aria-live="polite"></span>
      </section>
    `;
    this._slots = Array.from(this.shadowRoot.querySelectorAll('slot'));
    this._status = this.shadowRoot.querySelector('.status');
  }

  connectedCallback() {
    this._ensureController();
    this._slots.forEach((slot) => slot.addEventListener('slotchange', this._handleSlotChange));
    this.addEventListener('surface-window-command', this._handleSurfaceCommand);
    this.addEventListener('surface-panel-command', this._handlePanelCommand);
    this.addEventListener('surface-overlay-command', this._handleOverlayCommand);
    OVERLAY_LIFECYCLE_EVENTS.forEach((eventName) => {
      this.addEventListener(eventName, this._handleOverlayLifecycle);
    });
    this._registerAssignedSurfaces();
    this._dispatchManagerEvent('surface-manager-ready', { result: null });
  }

  disconnectedCallback() {
    this._slots.forEach((slot) => slot.removeEventListener('slotchange', this._handleSlotChange));
    this.removeEventListener('surface-window-command', this._handleSurfaceCommand);
    this.removeEventListener('surface-panel-command', this._handlePanelCommand);
    this.removeEventListener('surface-overlay-command', this._handleOverlayCommand);
    OVERLAY_LIFECYCLE_EVENTS.forEach((eventName) => {
      this.removeEventListener(eventName, this._handleOverlayLifecycle);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'manager-id' || name === 'state-key') {
      this._controller = null;
      this._registeredElements.clear();
      this._ensureController();
      this._registerAssignedSurfaces();
    }
  }

  get surfaces() {
    return this.snapshot().surfaces;
  }

  get activeSurfaceId() {
    return this.snapshot().activeSurfaceId;
  }

  get layoutSnapshot() {
    return this.snapshot();
  }

  get surfaceController() {
    return this._ensureController();
  }

  _managerId() {
    return this.getAttribute('manager-id') || this.id || 'xtend.surface.manager';
  }

  _stateKey() {
    return this.getAttribute('state-key') || 'xtend.surface.registry';
  }

  _ensureController() {
    if (this._controller) return this._controller;
    const api = surfaceControllerApi();
    if (!api || typeof api.createSurfaceController !== 'function') {
      throw new Error('x-surface-manager requires components/xsurfacemanager-controller.js');
    }
    this._controller = api.createSurfaceController({
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      xstate,
      fabric: fabricBridge()
    });
    return this._controller;
  }

  _registerAssignedSurfaces() {
    const surfaceElements = this._slots.flatMap((slot) => composedSurfaceElements(slot));
    surfaceElements.forEach((element) => this.registerSurface(element));
  }

  registerSurface(surface) {
    const controller = this._ensureController();
    const element = surface instanceof HTMLElement ? surface : null;
    let record = surface;
    if (element && isSurfaceOverlayElement(element)) {
      record = toOverlaySurfaceRecord(element, this._managerId());
    } else if (element && typeof element.toSurfaceRecord === 'function') {
      record = element.toSurfaceRecord(this._managerId());
    }
    const result = controller.registerSurface(record);

    if (element) {
      this._registeredElements.set(record.id, element);
      element.surfaceManager = this;
      if (element.hasAttribute('open')) {
        this.openSurface(record.id);
      } else {
        this._applySnapshot();
      }
    } else {
      this._applySnapshot();
    }

    this._dispatchManagerEvent('surface-registered', { result });
    return result;
  }

  openSurface(id, input) {
    return this._commit('openSurface', 'surface-opened', id, input);
  }

  closeSurface(id, reason) {
    return this._commit('closeSurface', 'surface-closed', id, reason);
  }

  focusSurface(id) {
    return this._commit('focusSurface', 'surface-focused', id);
  }

  updateSurface(id, patch) {
    return this._commit('updateSurface', 'surface-updated', id, patch);
  }

  moveSurface(id, bounds) {
    return this._commit('moveSurface', 'surface-layout-changed', id, bounds);
  }

  resizeSurface(id, bounds) {
    return this._commit('resizeSurface', 'surface-layout-changed', id, bounds);
  }

  minimizeSurface(id) {
    return this._commit('minimizeSurface', 'surface-layout-changed', id);
  }

  maximizeSurface(id) {
    return this._commit('maximizeSurface', 'surface-layout-changed', id);
  }

  restoreSurface(id) {
    return this._commit('restoreSurface', 'surface-layout-changed', id);
  }

  pinSurface(id, pinned = true) {
    return this.updateSurface(id, { pinned: Boolean(pinned), mode: pinned ? 'pinned' : 'docked' });
  }

  collapseSurface(id) {
    return this.updateSurface(id, { collapsed: true, mode: 'collapsed' });
  }

  expandSurface(id, mode = 'docked') {
    return this.updateSurface(id, { collapsed: false, mode });
  }

  dockSurface(id, placement = 'right', mode = 'docked') {
    return this.updateSurface(id, { placement, mode, collapsed: false });
  }

  snapshot() {
    return this._ensureController().snapshot();
  }

  _commit(method, eventName, id, payload) {
    const controller = this._ensureController();
    const result = controller[method](id, payload);
    const snapshot = this._applySnapshot();
    this._dispatchManagerEvent(eventName, { result, snapshot });
    return result;
  }

  _applySnapshot() {
    const snapshot = this.snapshot();
    snapshot.surfaces.forEach((record) => {
      const element = this._registeredElements.get(record.id)
        || this.querySelector(surfaceElementSelector(record.id));
      if (element && isSurfaceOverlayElement(element)) {
        this._syncingOverlayElements.add(element);
        try {
          applyOverlaySurfaceSnapshot(element, record);
        } finally {
          queueMicrotask(() => this._syncingOverlayElements.delete(element));
        }
      } else if (element && typeof element.applySurfaceSnapshot === 'function') {
        element.applySurfaceSnapshot(record);
      }
    });
    this._status.textContent = snapshot.activeSurfaceId ? `Active surface ${snapshot.activeSurfaceId}` : 'No active surface';
    return snapshot;
  }

  _onSurfaceCommand(event) {
    const detail = event.detail || {};
    const { command, payload } = detail;
    const surfaceId = detail.surfaceId || detail.id;
    if (!surfaceId || !command) return;
    event.stopPropagation();
    const commands = {
      open: () => this.openSurface(surfaceId, payload),
      close: () => this.closeSurface(surfaceId, payload && payload.reason),
      focus: () => this.focusSurface(surfaceId),
      move: () => this.moveSurface(surfaceId, payload),
      resize: () => this.resizeSurface(surfaceId, payload),
      minimize: () => this.minimizeSurface(surfaceId),
      maximize: () => this.maximizeSurface(surfaceId),
      restore: () => this.restoreSurface(surfaceId),
      pin: () => this.pinSurface(surfaceId, payload && payload.pinned !== false),
      unpin: () => this.pinSurface(surfaceId, false),
      collapse: () => this.collapseSurface(surfaceId),
      expand: () => this.expandSurface(surfaceId, payload && payload.mode || 'docked'),
      dock: () => this.dockSurface(surfaceId, payload && payload.placement || 'right', payload && payload.mode || 'docked'),
      update: () => this.updateSurface(surfaceId, payload)
    };
    if (commands[command]) commands[command]();
  }

  _onOverlayLifecycle(event) {
    const element = findSurfaceOverlayElement(event);
    if (!element || !this.contains(element) || this._syncingOverlayElements.has(element)) return;
    const surfaceId = overlaySurfaceId(element);
    const wasRegistered = this._registeredElements.has(surfaceId);

    if (!wasRegistered) {
      this.registerSurface(element);
      return;
    }

    const detail = event.detail || {};
    if (event.type.endsWith('-opened')) {
      this.openSurface(surfaceId, {
        source: detail.source || event.type,
        legacyEvent: event.type
      });
      return;
    }

    if (event.type.endsWith('-closed')) {
      this.closeSurface(surfaceId, detail.source || event.type);
      return;
    }

    if (event.type === 'drawer-route-selected') {
      this.updateSurface(surfaceId, {
        routeRef: detail.routeRef || null,
        legacyEvent: event.type
      });
    }
  }

  _dispatchManagerEvent(type, detail) {
    const snapshot = detail.snapshot || this.snapshot();
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result: detail.result,
        snapshot
      }
    }));
  }
}

if (!customElements.get('x-surface-manager')) {
  customElements.define('x-surface-manager', XSurfaceManager);
}

export { XSurfaceManager };
