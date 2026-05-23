class XSurfacePortal extends HTMLElement {
  static get observedAttributes() {
    return ['portal-id', 'policy', 'layer', 'for', 'z-index-start', 'z-step'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-surface-portal',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.legacy-esm.component-source',
        state: 'js-runtime',
        sourcePath: 'components/xsurfaceportal.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsurfaceportal.js',
        declaration: 'components/xsurfaceportal.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        surfaceContract: 'xtend.surface.type-capability-matrix.v1',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-surface-portal',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      portalPolicies: ['stacked', 'modal', 'nonmodal', 'toast-region', 'clipping-escape'],
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: contents;
        }
      </style>
      <slot></slot>
    `;
  }

  connectedCallback() {
    if (!this.hasAttribute('portal-id') && this.id) this.setAttribute('portal-id', this.id);
    if (!this.hasAttribute('policy')) this.setAttribute('policy', 'stacked');
    this._emitPolicy();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._emitPolicy();
  }

  get portalId() {
    return this.getAttribute('portal-id') || this.id || 'portal.app';
  }

  get policy() {
    return this.getAttribute('policy') || 'stacked';
  }

  toPortalPolicy() {
    return {
      schema: 'xtend.surface.portal-policy.v1',
      id: this.portalId,
      policy: this.policy,
      layer: this.getAttribute('layer') || this.portalId,
      target: this.getAttribute('for') || '',
      zIndexStart: Number(this.getAttribute('z-index-start') || 1000),
      zStep: Number(this.getAttribute('z-step') || 10),
      component: 'x-surface-portal',
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  _emitPolicy() {
    this.dispatchEvent(new CustomEvent('surface-portal-policy', {
      bubbles: true,
      composed: true,
      detail: this.toPortalPolicy()
    }));
  }
}

if (!customElements.get('x-surface-portal')) {
  customElements.define('x-surface-portal', XSurfacePortal);
}

export { XSurfacePortal };
