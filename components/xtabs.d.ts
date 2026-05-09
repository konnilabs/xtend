import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XTabsAttributeName = 'selected' | 'text-color';
export type XTabsEventName = 'tab-selected';
export type XTabsPerformanceBudgetKey = 'loadDefine' | 'mount' | 'hydrate' | 'renderUpdate' | 'eventAction' | 'tabSwitch' | 'keyboardAction';

export interface XTabsSelectedEventDetail {
  index: number;
}

export interface XTabsPerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-tabs';
  profiles: Array<'interactive' | 'routing'>;
  primaryProfile: 'interactive';
  budgetClass: 'critical';
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  budgetsMs: Record<XTabsPerformanceBudgetKey, number>;
  criticalMeasurements: string[];
  cleanup: string[];
  rmt: {
    scheduleRefs: string[];
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  };
}

export interface XTabsPerformanceMeasurement {
  schema: 'xtend.performance.measurement.v1';
  componentRef: 'x-tabs';
  phase: string;
  lane: 'user-blocking';
  budgetKey: XTabsPerformanceBudgetKey | string;
  budgetMs: number | null;
  durationMs: number;
  status: 'ok' | 'warn';
}

export interface XTabsPerformanceSnapshot {
  schema: 'xtend.component.performance-snapshot.v1';
  source: 'x-tabs';
  budget: Record<XTabsPerformanceBudgetKey, number>;
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  measurements: XTabsPerformanceMeasurement[];
}

export interface XTabsEventDetailMap {
  'tab-selected': XTabsSelectedEventDetail;
}

export type XTabsEventMap = XtendCustomEventMap<XTabsEventDetailMap>;
export type XTabsPublicEventContract = XtendPublicEventContract<XTabsEventName, XTabsSelectedEventDetail>;

export interface XTabElement extends HTMLElement {
  name?: string;
}

export interface XTabsElement extends HTMLElement {
  selectTab(index: number): void;
  getPerformanceBudget(): Record<XTabsPerformanceBudgetKey, number>;
  snapshotPerformance(): XTabsPerformanceSnapshot;
  addEventListener<K extends keyof XTabsEventMap>(type: K, listener: (event: XTabsEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-tabs': XTabsElement;
    'x-tab': XTabElement;
  }
}

export {};
