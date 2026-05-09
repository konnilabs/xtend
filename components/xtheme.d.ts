import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XThemeEventName = 'theme-initialized' | 'theme-changed' | 'theme-variable-changed' | 'theme-preference-changed' | 'theme-a11y-announcement' | 'theme-density-changed' | 'theme-context-changed' | 'theme-performance-measured';
export type XThemeTokenMap = Record<string, string>;
export type XThemeRegistry = Record<string, XThemeTokenMap>;
export type XThemeMotionPreference = 'default' | 'reduced';
export type XThemeContrastPreference = 'normal' | 'forced-colors';
export type XThemeDensity = 'compact' | 'comfortable' | 'dense';

export interface XThemeA11yPreferences {
  prefersReducedMotion: boolean;
  forcedColors: boolean;
  colorScheme: 'light' | 'dark';
  motion: XThemeMotionPreference;
  contrast: XThemeContrastPreference;
}

export interface XThemeDensityOptions {
  reason?: string;
  persist?: boolean;
}

export interface XThemeA11yProfile {
  schema: 'xtend.a11y.component-contract.v1';
  componentRef: 'x-theme';
  primaryProfile: 'theme';
  providerBoundary: true;
  runtimeRole: 'theme-preference-provider';
  testRefs: string[];
  [key: string]: unknown;
}

export interface XThemeMotionContrastPolicy {
  schema: 'xtend.a11y.motion-contrast-policy.v1';
  componentRef: 'x-theme';
  primaryProfile: 'theme';
  testRefs: string[];
  [key: string]: unknown;
}

export interface XThemePerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-theme';
  primaryProfile: 'theme';
  budgetClass: 'provider-core';
  lane: 'user-blocking';
  hydrationPolicy: 'eager';
  budgetsMs: Record<string, number>;
  criticalMeasurements: string[];
  [key: string]: unknown;
}

export interface XThemeRmtMetadata {
  schema: 'xtend.rmt.component-contract.v1';
  adapter: 'xtend.theme-provider';
  tag: 'x-theme';
  schedules: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  [key: string]: unknown;
}

export interface XThemeComponentNetworkContext {
  schema: 'xtend.component.network.v1';
  componentRef: 'x-theme';
  providerBoundary: true;
  contextType: 'theme-density-preference-provider';
  publishes: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  [key: string]: unknown;
}

export interface XThemeContext {
  schema: 'xtend.theme.context.v1';
  componentRef: 'x-theme';
  theme: string | null;
  density: XThemeDensity;
  availableThemes: string[];
  preferences: XThemeA11yPreferences;
  tokens: XThemeTokenMap;
  densityTokens: XThemeTokenMap;
  propagationVersion: number;
  reason: string;
  [key: string]: unknown;
}

export interface XThemePerformanceMeasurement {
  schema: 'xtend.performance.measurement.v1';
  componentRef: 'x-theme';
  name: string;
  durationMs: number;
  budgetMs: number;
  withinBudget: boolean;
  theme: string | null;
  density: XThemeDensity;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface XThemePerformanceSnapshot {
  schema: 'xtend.theme.performance-snapshot.v1';
  componentRef: 'x-theme';
  theme: string | null;
  density: XThemeDensity;
  counters: Record<string, number>;
  profile: XThemePerformanceProfile;
  lastMeasurements: XThemePerformanceMeasurement[];
  contextVersion: number;
  timestamp: number;
}

export interface XThemeDesignTokenPack {
  schema: 'xtend.design-tokens.pack.v1';
  type: 'theme' | 'density';
  name: string;
  tokens: XThemeTokenMap;
}

export interface XThemeDesignTokenContract {
  schema: 'xtend.design-tokens.product-contract.v1';
  packSchema: 'xtend.design-tokens.pack.v1';
  workpackage: 'WP-E12-12';
  runtimeProvider: 'x-theme';
  namespace: '--xtend-';
  tokenNames: string[];
  themePacks: XThemeDesignTokenPack[];
  densityPacks: XThemeDesignTokenPack[];
  cssParts: string[];
  highContrast: Record<string, unknown>;
  localOnly: boolean;
  externalNetworkAllowed: boolean;
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XThemeChangedEventDetail {
  theme: string;
  density?: XThemeDensity;
  availableThemes: string[];
  preferences?: XThemeA11yPreferences;
  a11yProfile?: XThemeA11yProfile;
  motionContrastPolicy?: XThemeMotionContrastPolicy;
  performanceProfile?: XThemePerformanceProfile;
  themeContext?: XThemeContext;
  performanceSnapshot?: XThemePerformanceSnapshot;
  reason?: string;
}

export interface XThemeVariableChangedEventDetail {
  theme: string;
  name: string;
  value: string;
}

export interface XThemePreferenceChangedEventDetail extends XThemeChangedEventDetail {
  preferences: XThemeA11yPreferences;
  reason: string;
}

export interface XThemeDensityChangedEventDetail {
  theme: string | null;
  density: XThemeDensity;
  availableDensities: XThemeDensity[];
  themeContext: XThemeContext;
  performanceSnapshot: XThemePerformanceSnapshot;
  measurement: XThemePerformanceMeasurement;
  reason: string;
}

export interface XThemeA11yAnnouncementEventDetail {
  theme: string | null;
  reason: string;
  message: string;
  preferences: XThemeA11yPreferences;
}

export interface XThemeEventDetailMap {
  'theme-initialized': XThemeChangedEventDetail;
  'theme-changed': XThemeChangedEventDetail;
  'theme-variable-changed': XThemeVariableChangedEventDetail;
  'theme-preference-changed': XThemePreferenceChangedEventDetail;
  'theme-a11y-announcement': XThemeA11yAnnouncementEventDetail;
  'theme-density-changed': XThemeDensityChangedEventDetail;
  'theme-context-changed': XThemeContext;
  'theme-performance-measured': XThemePerformanceMeasurement;
}

export type XThemeEventMap = XtendCustomEventMap<XThemeEventDetailMap>;
export type XThemePublicEventContract = XtendPublicEventContract<XThemeEventName, XThemeChangedEventDetail | XThemeVariableChangedEventDetail | XThemePreferenceChangedEventDetail | XThemeA11yAnnouncementEventDetail | XThemeDensityChangedEventDetail | XThemeContext | XThemePerformanceMeasurement>;

export interface XThemeManager {
  toggleDarkMode(): boolean;
  setTheme(themeName: string): boolean;
  setDensity(density: XThemeDensity, options?: XThemeDensityOptions): boolean;
  registerTheme(name: string, properties?: XThemeTokenMap): boolean;
  setThemeVariable(themeName: string, name: string, value: string): boolean;
  setVariable(name: string, value: string, themeName?: string): boolean;
  loadExternalTheme(themeName: string, cssUrl: string): Promise<{ theme: string; css: string; cssUrl: string }>;
  removeExternalTheme(themeName: string): boolean;
  getCurrentTheme(): string | null;
  getAvailableThemes(): string[];
  getAvailableDensities(): XThemeDensity[];
  getDensity(): XThemeDensity;
  getThemeRegistry(): XThemeRegistry;
  getDesignTokens(themeName?: string): XThemeTokenMap;
  getDesignTokenContract(): XThemeDesignTokenContract;
  getA11yProfile(): XThemeA11yProfile;
  getMotionContrastPolicy(): XThemeMotionContrastPolicy;
  getPerformanceProfile(): XThemePerformanceProfile;
  getRmtMetadata(): XThemeRmtMetadata;
  getComponentNetworkContext(): XThemeComponentNetworkContext;
  getThemeContext(): XThemeContext;
  snapshotPerformance(): XThemePerformanceSnapshot;
  getA11yPreferences(): XThemeA11yPreferences;
  getMotionPreference(): XThemeMotionPreference;
  getContrastPreference(): XThemeContrastPreference;
  hasExternalCSS(themeName: string): boolean;
  subscribe?(subscriber: (payload: XThemeChangedEventDetail) => void): () => void;
}

declare global {
  interface Document {
    addEventListener<K extends keyof XThemeEventMap>(type: K, listener: (event: XThemeEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  }
  interface Window {
    XTend?: {
      theme?: XThemeManager;
      toggleDarkMode?: () => boolean;
      [key: string]: unknown;
    };
    XTheme?: XThemeManager;
  }
}

export {};
