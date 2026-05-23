class XSurfaceRegion extends HTMLElement {
  static get observedAttributes() {
    return [
      'surface-id',
      'label',
      'kind',
      'open',
      'active',
      'hidden',
      'mode',
      'placement',
      'initial-x',
      'initial-y',
      'initial-width',
      'initial-height',
      'role'
    ];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-surface-region',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.legacy-esm.component-source',
        state: 'js-runtime',
        sourcePath: 'components/xsurfaceregion.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsurfaceregion.js',
        declaration: 'components/xsurfaceregion.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        surfaceContract: 'xtend.surface.record.v1',
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
      tag: 'x-surface-region',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['surface.visible.render', 'surface.user-blocking.open', 'surface.transition.layout', 'surface.diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'visible' },
      surface: {
        schema: 'xtend.surface.record.v1',
        type: 'region',
        kinds: ['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'],
        controller: 'xtend.surface.controller.v1'
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      budgetClass: 'surface-content',
      lane: 'surface.region.visible',
      hydrationPolicy: 'visible',
      measurements: ['surface-record-sync', 'bounds-application', 'command-dispatch']
    };
  }

  constructor() {
    super();
    this.surfaceManager = null;
    this._applyingSnapshot = false;
    this._onPointerDown = this.focusRegion.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --surface-region-x: 0px;
          --surface-region-y: 0px;
          --surface-region-width: auto;
          --surface-region-height: auto;
          --surface-region-z: 0;
          display: block;
          position: relative;
          min-width: 0;
          min-height: 0;
          z-index: var(--surface-region-z);
          box-sizing: border-box;
        }
        :host([mode="floating"]) {
          position: absolute;
          left: var(--surface-region-x);
          top: var(--surface-region-y);
          width: var(--surface-region-width);
          height: var(--surface-region-height);
        }
        :host([hidden]),
        :host(:not([open])) {
          display: none;
        }
        :host([active]) {
          outline: var(--surface-region-active-outline, 0);
        }
        .region {
          box-sizing: border-box;
          min-width: 0;
          min-height: 0;
          width: 100%;
          height: 100%;
        }
        :host(:not([mode="floating"])) .region {
          width: auto;
          height: auto;
        }
      </style>
      <section class="region" part="region" tabindex="-1">
        <slot></slot>
      </section>
    `;
    this._region = this.shadowRoot.querySelector('.region');
  }

  connectedCallback() {
    if (!this.hasAttribute('surface-id') && this.id) this.setAttribute('surface-id', this.id);
    if (!this.hasAttribute('kind')) this.setAttribute('kind', this.getAttribute('data-surface-kind') || 'region');
    if (!this.hasAttribute('open') && !this.hasAttribute('hidden')) this.setAttribute('open', '');
    this._syncA11y();
    this._applyInitialBounds();
    this.addEventListener('pointerdown', this._onPointerDown);
    this.surfaceManager = this.closest('x-surface-manager');
    if (this.surfaceManager && typeof this.surfaceManager.registerSurface === 'function') {
      this.surfaceManager.registerSurface(this);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('pointerdown', this._onPointerDown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'label' || name === 'surface-id' || name === 'role') this._syncA11y();
    if (name.startsWith('initial-')) this._applyInitialBounds();
    if (this._applyingSnapshot || !this.isConnected) return;
    if (name === 'open') {
      this.hasAttribute('open') ? this.openRegion() : this.closeRegion('attribute');
    }
  }

  get surfaceId() {
    return this.getAttribute('surface-id') || this.id || 'surface.region';
  }

  get kind() {
    return this.getAttribute('kind') || this.getAttribute('data-surface-kind') || 'region';
  }

  get open() {
    return this.hasAttribute('open') && !this.hasAttribute('hidden');
  }

  set open(value) {
    this.toggleAttribute('open', Boolean(value));
    this.toggleAttribute('hidden', !value);
  }

  toSurfaceRecord(managerId) {
    const mode = this.getAttribute('mode') || 'region';
    return {
      schema: 'xtend.surface.record.v1',
      id: this.surfaceId,
      type: 'region',
      kind: this.kind,
      manager: managerId,
      label: this.getAttribute('label') || this.surfaceId,
      placement: this.getAttribute('placement') || null,
      mode,
      initialBounds: this._readBounds(),
      capabilities: ['open', 'focus', 'close', 'update', 'restore', 'snapshot'],
      defaultOpen: this.open,
      modal: false,
      metadata: {
        source: 'x-surface-region',
        surfaceKind: this.kind
      }
    };
  }

  applySurfaceSnapshot(record) {
    this._applyingSnapshot = true;
    const bounds = record.bounds || this._readBounds();
    this.style.setProperty('--surface-region-x', `${Number(bounds.x) || 0}px`);
    this.style.setProperty('--surface-region-y', `${Number(bounds.y) || 0}px`);
    this.style.setProperty('--surface-region-width', `${Number(bounds.width) || 640}px`);
    this.style.setProperty('--surface-region-height', `${Number(bounds.height) || 360}px`);
    this.style.setProperty('--surface-region-z', String(record.zIndex || 0));
    this.toggleAttribute('open', record.status !== 'closed');
    this.toggleAttribute('hidden', record.status === 'closed');
    this.toggleAttribute('active', Boolean(record.active));
    if (record.kind) this.setAttribute('kind', record.kind);
    if (record.mode) this.setAttribute('mode', record.mode);
    if (record.placement) this.setAttribute('placement', record.placement);
    this._syncA11y(record);
    this._applyingSnapshot = false;
  }

  openRegion() {
    return this._command('open');
  }

  closeRegion(reason) {
    return this._command('close', { reason });
  }

  focusRegion() {
    return this._command('focus');
  }

  restoreRegion() {
    return this._command('restore');
  }

  updateRegion(payload = {}) {
    return this._command('update', payload);
  }

  _readBounds() {
    return {
      x: Number(this.getAttribute('initial-x') || 0),
      y: Number(this.getAttribute('initial-y') || 0),
      width: Number(this.getAttribute('initial-width') || 640),
      height: Number(this.getAttribute('initial-height') || 360),
      minWidth: 160,
      minHeight: 96
    };
  }

  _applyInitialBounds() {
    const bounds = this._readBounds();
    this.style.setProperty('--surface-region-x', `${bounds.x}px`);
    this.style.setProperty('--surface-region-y', `${bounds.y}px`);
    this.style.setProperty('--surface-region-width', `${bounds.width}px`);
    this.style.setProperty('--surface-region-height', `${bounds.height}px`);
  }

  _syncA11y(record = null) {
    if (!this._region) return;
    const label = this.getAttribute('label') || this.surfaceId;
    const role = this.getAttribute('role') || (this.kind === 'page' ? 'main' : 'region');
    this._region.setAttribute('role', role);
    this._region.setAttribute('aria-label', label);
    this._region.setAttribute('aria-hidden', record && record.status === 'closed' || this.hasAttribute('hidden') ? 'true' : 'false');
  }

  _command(command, payload = {}) {
    const detail = {
      surfaceId: this.surfaceId,
      command,
      payload
    };
    this.dispatchEvent(new CustomEvent('surface-region-command', {
      bubbles: true,
      composed: true,
      detail
    }));
    return detail;
  }
}

if (!customElements.get('x-surface-region')) {
  customElements.define('x-surface-region', XSurfaceRegion);
}

export { XSurfaceRegion };
