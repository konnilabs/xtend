import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XButtonVariant = 'primary' | 'secondary' | 'danger' | string;
export type XButtonSize = 'small' | 'large' | string;
export type XButtonAttributeName = 'disabled' | 'label' | 'variant' | 'size' | 'icon' | 'loading' | 'overlay' | 'aria-label' | 'aria-busy';
export type XButtonEventName = 'loading-start' | 'loading-end' | 'click' | 'focus' | 'blur' | 'button-interaction' | 'button-performance-measured';

export interface XButtonPerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-button';
  profiles: string[];
  primaryProfile: 'interactive';
  budgetClass: 'interactive-small';
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  budgetsMs: Record<string, number>;
  criticalMeasurements: string[];
  interaction: XButtonInteractionBudget;
  cleanup: string[];
}

export interface XButtonInteractionBudget {
  clickBudgetMs: number;
  keyboardBudgetMs: number;
  busyToggleBudgetMs: number;
  touchTargetMinPx: number;
  focusVisibleRequired: boolean;
  disabledBusyGuards: boolean;
}

export interface XButtonRmtMetadata {
  schema: 'xtend.rmt.component-contract.v1';
  adapter: 'xtend.component';
  tag: 'x-button';
  schedules: string[];
  hydration: {
    policy: 'visible';
    lane: 'user-blocking';
  };
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XButtonPerformanceMeasurement {
  schema: 'xtend.performance.measurement.v1';
  componentRef: 'x-button';
  id: string | null;
  name: string;
  budgetKey: string;
  durationMs: number;
  budgetMs: number | null;
  withinBudget: boolean;
  lane: 'user-blocking';
  detail?: Record<string, unknown>;
}

export interface XButtonPerformanceSnapshot {
  schema: 'xtend.component.performance-snapshot.v1';
  componentRef: 'x-button';
  id: string | null;
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  counters: {
    mounts: number;
    renders: number;
    interactions: number;
    keyboardInteractions: number;
    busyTransitions: number;
    ignoredInteractions: number;
  };
  budgetsMs: Record<string, number>;
  measurements: XButtonPerformanceMeasurement[];
}

export interface XButtonStateEventDetail {
  id?: string;
  schema?: 'xtend.component.x-button.state.v1';
  disabled?: boolean;
  loading?: boolean;
  busy?: boolean;
  label?: string;
  variant?: string;
  size?: string;
}

export interface XButtonInteractionEventDetail {
  schema: 'xtend.component.x-button.interaction.v1';
  id: string;
  type: 'click' | 'keyboard' | string;
  lane: 'user-blocking';
  disabled: boolean;
  busy: boolean;
  measurement: XButtonPerformanceMeasurement;
  key?: string;
}

export interface XButtonForwardedEventDetail {
  originalEvent: Event;
}

export interface XButtonEventDetailMap {
  'loading-start': XButtonStateEventDetail;
  'loading-end': XButtonStateEventDetail;
  click: Event;
  focus: Event;
  blur: Event;
  'button-interaction': XButtonInteractionEventDetail;
  'button-performance-measured': XButtonPerformanceMeasurement;
}

export type XButtonEventMap = XtendCustomEventMap<XButtonEventDetailMap>;
export type XButtonPublicEventContract = XtendPublicEventContract<XButtonEventName, XButtonStateEventDetail | XButtonInteractionEventDetail | XButtonPerformanceMeasurement | Event>;

export interface XButtonElement extends HTMLElement {
  addEventListener<K extends keyof XButtonEventMap>(type: K, listener: (event: XButtonEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  getPerformanceBudget(): Record<string, number>;
  getInteractionBudget(): XButtonInteractionBudget;
  snapshotPerformance(): XButtonPerformanceSnapshot;
  setLoading(loading: boolean, options?: { sync?: boolean }): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-button': XButtonElement;
  }
}

export {};
