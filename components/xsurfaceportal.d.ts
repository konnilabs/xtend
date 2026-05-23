export type XSurfacePortalPolicy = 'stacked' | 'modal' | 'nonmodal' | 'toast-region' | 'clipping-escape' | string;
export type XSurfacePortalAttributeName = 'portal-id' | 'policy' | 'layer' | 'for' | 'z-index-start' | 'z-step';

export interface XSurfacePortalPolicyRecord {
  schema: 'xtend.surface.portal-policy.v1';
  id: string;
  policy: XSurfacePortalPolicy;
  layer: string;
  target: string;
  zIndexStart: number;
  zStep: number;
  component: 'x-surface-portal';
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XSurfacePortalElement extends HTMLElement {
  readonly portalId: string;
  readonly policy: XSurfacePortalPolicy;
  toPortalPolicy(): XSurfacePortalPolicyRecord;
  addEventListener(type: 'surface-portal-policy', listener: (event: CustomEvent<XSurfacePortalPolicyRecord>) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-surface-portal': XSurfacePortalElement;
  }
}

export {};
