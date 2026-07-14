export type XTendLoaderVerboseMode = 'true' | 'false' | 'auto';
export type XTendLoaderMeasurementStatus = 'completed' | 'failed' | string;
export type XTendLoaderDiagnosticLevel = 'debug' | 'info' | 'warn' | 'error' | string;
export type XTendStyleAdoptionMode = 'adoptedStyleSheet' | 'styleElement' | 'registered' | string;
export type XTendManifest = Record<string, string>;
export type XTendStyleRoot = Document | ShadowRoot | Element;

export interface XTendLoaderVerboseState {
  schema: 'xtend.loader.verbose.v1';
  mode: XTendLoaderVerboseMode;
  enabled: boolean;
  locked: boolean;
  requested?: boolean;
  changed?: boolean;
  message?: string;
}

export interface XTendThemeStylesheetState {
  schema: 'xtend.loader.style-registry.v1';
  standardFileName: 'xtend.css';
  present: boolean;
  href: string;
  role: 'optional-host-theme' | 'runtime-critical-only' | string;
}

export interface XTendStyleRegistryRecord {
  schema: 'xtend.loader.style-registry.v1';
  key: string;
  id?: string;
  mode?: XTendStyleAdoptionMode;
  tag?: string;
  cssText?: string;
  source?: string;
  sheet?: CSSStyleSheet;
  element?: HTMLStyleElement;
  target?: XTendStyleRoot | Node;
}

export interface XTendRuntimeStyleOptions {
  force?: boolean;
  source?: string;
  strategy?: 'adoptedStyleSheet' | 'style' | string;
}

export interface XTendComponentStyleOptions {
  key?: string;
  source?: string;
}

export interface XTendAdoptStyleOptions {
  key?: string;
  id?: string;
  source?: string;
  strategy?: 'adoptedStyleSheet' | 'style' | string;
}

export interface XTendStyleRegistryApi {
  readonly schema: 'xtend.loader.style-registry.v1';
  readonly runtimeStylesContract: 'xtend.loader.runtime-styles.v1';
  readonly runtimeStyleKey: 'xtend.runtime-critical';
  readonly standardThemeStylesheet: 'xtend.css';
  ensureRuntimeStyles(options?: XTendRuntimeStyleOptions): XTendStyleRegistryRecord | null;
  ensureDocumentStyle(key: string, cssText: string, options?: XTendRuntimeStyleOptions & { id?: string }): XTendStyleRegistryRecord | null;
  defineComponentStyle(tag: string, cssText: string, options?: XTendComponentStyleOptions): XTendStyleRegistryRecord;
  adopt(root: XTendStyleRoot | Element, styleOrKey: XTendStyleRegistryRecord | string, options?: XTendAdoptStyleOptions): XTendStyleRegistryRecord | null;
  adoptStyle(root: XTendStyleRoot | Element, styleOrKey: XTendStyleRegistryRecord | string, options?: XTendAdoptStyleOptions): XTendStyleRegistryRecord | null;
  get(key: string): XTendStyleRegistryRecord | null;
  getThemeStylesheetState(): XTendThemeStylesheetState;
  list(): XTendStyleRegistryRecord[];
}

export interface XTendSkeletonLoaderOptions {
  profile?: string | XTendSkeletonProfile;
  profileId?: string;
  variant?: string;
  kind?: string;
  lines?: number;
  lineCount?: number;
  minHeight?: string;
  height?: string;
  label?: string;
  ariaLabel?: string;
  source?: string;
  schedule?: string;
  layoutMode?: 'auto' | 'flow' | 'overlay';
}

export interface XTendSkeletonProfileItem {
  id?: string;
  kind?: 'line' | 'block' | 'circle';
  width?: string;
  height?: string;
  gridColumn?: string;
  column?: string;
  radius?: string;
  repeat?: number;
}

export interface XTendSkeletonProfile {
  schema?: 'xtend.loader.skeleton-profile.v1';
  id: string;
  name?: string;
  variant?: string;
  lines?: number;
  lineCount?: number;
  minHeight?: string;
  height?: string;
  columns?: string;
  gap?: string;
  responsive?: {
    breakpoint?: string;
    compact?: { minHeight?: string; height?: string; columns?: string; gap?: string };
    wide?: { minHeight?: string; height?: string; columns?: string; gap?: string };
  };
  items?: XTendSkeletonProfileItem[];
  rows?: XTendSkeletonProfileItem[];
}

export interface XTendSkeletonLoaderApi {
  readonly schema: 'xtend.loader.skeleton-loader.v1';
  readonly profileSchema: 'xtend.loader.skeleton-profile.v1';
  registerProfile(id: string, descriptor?: Partial<XTendSkeletonProfile>): XTendSkeletonProfile;
  getProfile(id: string): XTendSkeletonProfile | null;
  listProfiles(): XTendSkeletonProfile[];
  create(options?: XTendSkeletonLoaderOptions): HTMLElement;
  show(target: Element | DocumentFragment, options?: XTendSkeletonLoaderOptions): HTMLElement | null;
  hide(target: Element | DocumentFragment, options?: { preserveBusy?: boolean }): number;
}

export interface XTendLoaderDiagnosticDetail {
  schema: 'xtend.fabric.diagnostic.v1';
  code: string;
  level: XTendLoaderDiagnosticLevel;
  message: string;
  source: 'loader' | string;
  phase: 'load' | string;
  metadata: Record<string, unknown>;
}

export interface XTendLoaderPerformanceDetail {
  schema: 'xtend.performance.measurement.v1';
  id: string;
  name: string;
  phase: 'load' | 'define' | string;
  durationMs: number;
  sampleKind: 'local' | string;
  status: XTendLoaderMeasurementStatus;
  metadata: Record<string, unknown>;
}

export interface XTendDevApiSnapshot {
  schema: string;
  supported?: boolean;
  status?: string;
  [key: string]: unknown;
}

export interface XTendDevApiSubscriptionEvent {
  schema: 'xtend.devsurface.subscription-event.v1';
  sequence: number;
  kind: string;
  status: string;
  detail: unknown;
}

export interface XTendDevApi {
  readonly schema: 'xtend.devsurface.dev-api.v1';
  readonly version: '1.0.0' | string;
  getPerformanceSnapshot(): XTendDevApiSnapshot;
  getFabricTelemetrySnapshot(): XTendDevApiSnapshot;
  getKernelSnapshot(): XTendDevApiSnapshot;
  getHydrationSnapshot(): XTendDevApiSnapshot;
  subscribe(listener: (event: XTendDevApiSubscriptionEvent) => void): () => void;
}

export interface XTendHydrateTreeDetail {
  schema: 'xtend.loader.dynamic-tree-hydration.v1';
  source: string;
  reason: string;
  schedule: string;
  tags: string[];
  elementCount: number;
  hydrated: number;
}

export interface XTendEnsureComponentOptions {
  manifest?: XTendManifest;
  skipBootWait?: boolean;
  source?: string;
  reason?: string;
  schedule?: string;
  [key: string]: unknown;
}

export interface XTendHydrateTreeOptions extends XTendEnsureComponentOptions {
  tags?: string[];
}

export interface XTendInitiateOptions {
  manifestUrl?: string;
  moduleCacheBust?: string | boolean;
  devApi?: boolean;
  uiEffects?: string;
  uiEffect?: string;
  effects?: string;
  uiEffectDuration?: string | number;
  uiEffectsDuration?: string | number;
  rmtDocument?: unknown;
  rmt?: unknown;
  [key: string]: unknown;
}

export interface XTendLoaderBootResult {
  schema: 'xtend.loader.contract.v1';
  manifest: XTendManifest;
  loadedTags: string[];
  performanceMeasurements: XTendLoaderPerformanceDetail[];
  uiEffects: unknown;
  verbose: XTendLoaderVerboseState;
}

export interface XTendLoaderApi {
  readonly schema: 'xtend.loader.contract.v1';
  readonly loaderPolicy: 'xtend.security.loader-policy.v1';
  readonly manifestPolicy: 'xtend.security.manifest-policy.v1';
  readonly importPolicy: 'xtend.security.import-policy.v1';
  readonly styleRegistry: XTendStyleRegistryApi;
  readonly styles: XTendStyleRegistryApi;
  readonly styleRegistryContract: 'xtend.loader.style-registry.v1';
  readonly runtimeStylesContract: 'xtend.loader.runtime-styles.v1';
  readonly skeletonLoader: XTendSkeletonLoaderApi;
  readonly skeletonLoaderContract: 'xtend.loader.skeleton-loader.v1';
  readonly skeletonProfileContract: 'xtend.loader.skeleton-profile.v1';
  verbose(enabled?: boolean | string): XTendLoaderVerboseState;
  setVerbose(enabled?: boolean | string): XTendLoaderVerboseState;
  enableVerbose(): XTendLoaderVerboseState;
  disableVerbose(): XTendLoaderVerboseState;
  getVerboseMode(): XTendLoaderVerboseMode;
  getVerboseState(): XTendLoaderVerboseState;
  isVerbose(): boolean;
  ensureRuntimeStyles(options?: XTendRuntimeStyleOptions): XTendStyleRegistryRecord | null;
  defineComponentStyle(tag: string, cssText: string, options?: XTendComponentStyleOptions): XTendStyleRegistryRecord;
  adoptStyle(root: XTendStyleRoot | Element, styleOrKey: XTendStyleRegistryRecord | string, options?: XTendAdoptStyleOptions): XTendStyleRegistryRecord | null;
  getThemeStylesheetState(): XTendThemeStylesheetState;
  createSkeleton(options?: XTendSkeletonLoaderOptions): HTMLElement;
  showSkeleton(target: Element | DocumentFragment, options?: XTendSkeletonLoaderOptions): HTMLElement | null;
  hideSkeleton(target: Element | DocumentFragment, options?: { preserveBusy?: boolean }): number;
  ensureComponent(tag: string, options?: XTendEnsureComponentOptions): Promise<boolean>;
  hydrateTree(root?: Document | ShadowRoot | Element, options?: XTendHydrateTreeOptions): Promise<XTendHydrateTreeDetail>;
  initiateXTend(options?: XTendInitiateOptions): Promise<XTendLoaderBootResult>;
}

declare global {
  interface Window {
    XTendLoader: XTendLoaderApi;
    XTendStyleRegistry: XTendStyleRegistryApi;
    XTendSkeletonLoader: XTendSkeletonLoaderApi;
    __XTEND_DEV_API__?: XTendDevApi;
    __XTendLoaderBootPromise?: Promise<XTendLoaderBootResult>;
  }

  interface WindowEventMap {
    'xtend-loader-diagnostic': CustomEvent<XTendLoaderDiagnosticDetail>;
    'xtend-loader-performance': CustomEvent<XTendLoaderPerformanceDetail>;
    'xtend-loader-tree-hydrated': CustomEvent<XTendHydrateTreeDetail>;
  }
}
