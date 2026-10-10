import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XRmtLifecycleDemoVariant = 'default' | string;
export type XRmtLifecycleDemoAttributeName = 'variant' | 'aria-label';
export type XRmtLifecycleDemoEventName =
  | 'rmt-lifecycle-demo-ready'
  | 'rmt-lifecycle-demo-changed';

export interface XRmtLifecycleDemoWiring {
  schema: 'xtend.scaffold.feature-wiring.v1';
  statePrefix: 'xtend.component.x-rmt-lifecycle-demo.<id>.';
  stateKeys: string[];
  events: XRmtLifecycleDemoEventName[];
  apiNamespaces: string[];
  localUiPolicy: 'derived-render-cache-only';
}

export interface XRmtLifecycleDemoExtensionPoints {
  schema: 'xtend.scaffold.component-extension-points.v1';
  status: 'prepared-extension-points-only';
  rootLifecycle: Record<string, unknown>;
  templating: Record<string, unknown>;
  rendering: Record<string, unknown>;
  schedulerHandshake: Record<string, unknown>;
}

export interface XRmtLifecycleDemoA11yProfile {
  schema: 'xtend.a11y.profile.v1';
  componentRef: 'x-rmt-lifecycle-demo';
  primaryProfile: 'stateful';
  role: 'region';
  accessibleName: {
    source: 'aria-label';
    required: true;
    defaultText: string;
  };
}

export interface XRmtLifecycleDemoPerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-rmt-lifecycle-demo';
  primaryProfile: 'stateful';
  budgetClass: 'critical';
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  budgetsMs: Record<string, number>;
  criticalMeasurements: string[];
}

export interface XRmtLifecycleDemoEventDetail {
  schema: 'xtend.scaffold.rmt-app.lifecycle-demo.v1';
  componentRef: 'x-rmt-lifecycle-demo';
  ready?: boolean;
  variant?: XRmtLifecycleDemoVariant;
  value?: unknown;
}

export interface XRmtLifecycleDemoEventDetailMap {
  'rmt-lifecycle-demo-ready': XRmtLifecycleDemoEventDetail;
  'rmt-lifecycle-demo-changed': XRmtLifecycleDemoEventDetail;
}

export type XRmtLifecycleDemoEventMap = XtendCustomEventMap<XRmtLifecycleDemoEventDetailMap>;
export type XRmtLifecycleDemoPublicEventContract = XtendPublicEventContract<XRmtLifecycleDemoEventName, XRmtLifecycleDemoEventDetail>;

export interface XRmtLifecycleDemoElement extends HTMLElement {
  beforeHydrate(): void;
  afterHydrate(): void;
  beforeRender(): void;
  afterRender(): void;
  onDisconnect(): void;
  hydrate(): void;
  render(): void;
  addEventListener<K extends keyof XRmtLifecycleDemoEventMap>(type: K, listener: (event: XRmtLifecycleDemoEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-rmt-lifecycle-demo': XRmtLifecycleDemoElement;
  }
}

export {};
