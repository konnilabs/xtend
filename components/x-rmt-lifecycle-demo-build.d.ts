import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XRmtLifecycleDemoBuildVariant = 'default' | string;
export type XRmtLifecycleDemoBuildAttributeName = 'variant' | 'aria-label';
export type XRmtLifecycleDemoBuildEventName =
  | 'rmt-lifecycle-demo-build-ready'
  | 'rmt-lifecycle-demo-build-changed';

export interface XRmtLifecycleDemoBuildWiring {
  schema: 'xtend.scaffold.feature-wiring.v1';
  statePrefix: 'xtend.component.x-rmt-lifecycle-demo-build.<id>.';
  stateKeys: string[];
  events: XRmtLifecycleDemoBuildEventName[];
  apiNamespaces: string[];
  localUiPolicy: 'derived-render-cache-only';
}

export interface XRmtLifecycleDemoBuildExtensionPoints {
  schema: 'xtend.scaffold.component-extension-points.v1';
  status: 'prepared-extension-points-only';
  rootLifecycle: Record<string, unknown>;
  templating: Record<string, unknown>;
  rendering: Record<string, unknown>;
  schedulerHandshake: Record<string, unknown>;
}

export interface XRmtLifecycleDemoBuildA11yProfile {
  schema: 'xtend.a11y.profile.v1';
  componentRef: 'x-rmt-lifecycle-demo-build';
  primaryProfile: 'stateful';
  role: 'region';
  accessibleName: {
    source: 'aria-label';
    required: true;
    defaultText: string;
  };
}

export interface XRmtLifecycleDemoBuildPerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-rmt-lifecycle-demo-build';
  primaryProfile: 'stateful';
  budgetClass: 'critical';
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  budgetsMs: Record<string, number>;
  criticalMeasurements: string[];
}

export interface XRmtLifecycleDemoBuildEventDetail {
  schema: 'xtend.scaffold.rmt-app-build.lifecycle-demo.v1';
  componentRef: 'x-rmt-lifecycle-demo-build';
  ready?: boolean;
  variant?: XRmtLifecycleDemoBuildVariant;
  value?: unknown;
}

export interface XRmtLifecycleDemoBuildEventDetailMap {
  'rmt-lifecycle-demo-build-ready': XRmtLifecycleDemoBuildEventDetail;
  'rmt-lifecycle-demo-build-changed': XRmtLifecycleDemoBuildEventDetail;
}

export type XRmtLifecycleDemoBuildEventMap = XtendCustomEventMap<XRmtLifecycleDemoBuildEventDetailMap>;
export type XRmtLifecycleDemoBuildPublicEventContract = XtendPublicEventContract<XRmtLifecycleDemoBuildEventName, XRmtLifecycleDemoBuildEventDetail>;

export interface XRmtLifecycleDemoBuildElement extends HTMLElement {
  hydrate(): void;
  render(): void;
  addEventListener<K extends keyof XRmtLifecycleDemoBuildEventMap>(type: K, listener: (event: XRmtLifecycleDemoBuildEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-rmt-lifecycle-demo-build': XRmtLifecycleDemoBuildElement;
  }
}

export {};
