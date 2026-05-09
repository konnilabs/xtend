import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XMenuEventName =
  | 'menu-item-clicked'
  | 'menu-navigate'
  | 'menu-keyboard-navigation'
  | 'menu-performance-measured';

export interface XMenuPerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-menu';
  profiles: Array<'interactive' | 'routing'>;
  primaryProfile: 'interactive';
  budgetClass: 'navigation-small';
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  budgetsMs: Record<string, number>;
  criticalMeasurements: string[];
  interaction: XMenuInteractionBudget;
}

export interface XMenuInteractionBudget {
  keyboardBudgetMs: number;
  routeActivationBudgetMs: number;
  touchTargetMinPx: number;
  rovingTabindexRequired: boolean;
  xLinkCompatible: boolean;
  xRouterCompatible: boolean;
}

export interface XMenuPerformanceMeasurement {
  schema: 'xtend.performance.measurement.v1';
  componentRef: 'x-menu';
  id: string | null;
  name: string;
  budgetKey: string;
  durationMs: number;
  budgetMs: number | null;
  withinBudget: boolean;
  lane: 'user-blocking';
  detail: Record<string, unknown>;
}

export interface XMenuPerformanceSnapshot {
  schema: 'xtend.component.performance-snapshot.v1';
  componentRef: 'x-menu';
  id: string | null;
  lane: 'user-blocking';
  routeLane: 'transition';
  hydrationPolicy: 'visible';
  counters: Record<string, number>;
  budgetsMs: Record<string, number>;
  measurements: XMenuPerformanceMeasurement[];
}

export interface XMenuItemClickedEventDetail {
  schema?: 'xtend.component.x-menu.item-clicked.v1';
  id?: string;
  href: string | null;
  index: number;
  label?: string;
  source?: 'click' | 'keyboard' | string;
  lane?: 'user-blocking';
  routeLane?: 'transition';
  stateKey?: 'xmenu-active';
  scheduleRef?: string;
  measurement?: XMenuPerformanceMeasurement;
}

export interface XMenuNavigateEventDetail {
  schema: 'xtend.component.x-menu.navigation.v1';
  href: string;
  path: string;
  mode: 'hash' | 'history';
  source: 'x-menu';
  inputSource: 'click' | 'keyboard' | string;
  stateKey: 'xmenu-active';
  scheduleRef: 'route.transition.navigate';
  itemTag: string | null;
  measurement: XMenuPerformanceMeasurement;
}

export interface XMenuKeyboardNavigationEventDetail {
  schema: 'xtend.component.x-menu.keyboard-navigation.v1';
  id: string;
  key: string;
  fromIndex: number;
  toIndex: number;
  lane: 'user-blocking';
  stateKey: 'xmenu-active';
  scheduleRef: 'ui.user-blocking.navigation';
  measurement: XMenuPerformanceMeasurement;
}

export interface XMenuEventDetailMap {
  'menu-item-clicked': XMenuItemClickedEventDetail;
  'menu-navigate': XMenuNavigateEventDetail;
  'menu-keyboard-navigation': XMenuKeyboardNavigationEventDetail;
  'menu-performance-measured': XMenuPerformanceMeasurement;
}

export type XMenuEventMap = XtendCustomEventMap<XMenuEventDetailMap>;
export type XMenuPublicEventContract = XtendPublicEventContract<XMenuEventName, XMenuItemClickedEventDetail | XMenuNavigateEventDetail | XMenuKeyboardNavigationEventDetail | XMenuPerformanceMeasurement>;

export interface XMenuElement extends HTMLElement {
  addEventListener<K extends keyof XMenuEventMap>(type: K, listener: (event: XMenuEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  getPerformanceBudget(): Record<string, number>;
  getInteractionBudget(): XMenuInteractionBudget;
  snapshotPerformance(): XMenuPerformanceSnapshot;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-menu': XMenuElement;
  }
}

export {};
