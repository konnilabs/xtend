import type {
  XtendSurfaceController,
  XtendSurfaceOperationResult,
  XtendSurfaceSnapshot
} from './xsurfacemanager-controller';

export type XSurfaceManagerPersistenceMode = 'none' | 'memory' | 'session' | 'local';
export type XSurfaceManagerRestorePolicy = 'auto' | 'manual' | 'reset';
export type XSurfaceManagerLoadingPolicy = 'eager' | 'visible' | 'open' | 'idle' | 'route' | 'warm' | 'prewarm';
export type XSurfaceManagerRouteLifecyclePolicy = 'global' | 'open-close' | 'open-collapse' | 'open-minimize' | 'open-keep' | 'hydrate-only' | 'manual';
export type XSurfaceManagerModalPolicy = 'topmost' | 'none' | 'all-modal' | 'surface-modal';
export type XSurfaceManagerLayoutEngine = 'freeform' | 'docked' | 'split' | 'tile' | 'stacked' | 'document-flow';
export type XSurfaceManagerAttributeName =
  | 'layout'
  | 'restore-key'
  | 'route-aware'
  | 'modal-policy'
  | 'manager-id'
  | 'state-key'
  | 'persistence-mode'
  | 'restore-policy'
  | 'surface-loading-policy'
  | 'surface-skeleton'
  | 'surface-hydration-timeout'
  | 'route-lifecycle-policy'
  | 'layout-engine'
  | 'surface-layout-gap'
  | 'surface-layout-snap'
  | 'remote-surface-policy'
  | 'remote-origin-allowlist'
  | 'remote-capabilities';
export type XSurfaceManagerEventName =
  | 'surface-manager-ready'
  | 'surface-registered'
  | 'surface-opened'
  | 'surface-closed'
  | 'surface-destroyed'
  | 'surface-destroy-error'
  | 'surface-focused'
  | 'surface-materialized'
  | 'surface-updated'
  | 'surface-layout-changed'
  | 'surface-snapshot-persisted'
  | 'surface-snapshot-restored'
  | 'surface-snapshot-cleared'
  | 'surface-snapshot-reset'
  | 'surface-restore-skipped'
  | 'surface-persistence-error'
  | 'surface-content-loading'
  | 'surface-content-hydrated'
  | 'surface-content-hydration-skipped'
  | 'surface-content-hydration-error'
  | 'surface-route-lifecycle-applied'
  | 'surface-route-lifecycle-skipped'
  | 'surface-stack-policy-applied'
  | 'surface-stack-policy-escape'
  | 'surface-stack-policy-focus'
  | 'surface-stack-policy-focus-restored'
  | 'surface-stack-policy-error'
  | 'surface-layout-engine-applied'
  | 'surface-region-command'
  | 'surface-portal-policy'
  | 'remote-surface-mounted'
  | 'remote-surface-degraded'
  | 'remote-surface-refused'
  | 'remote-surface-event-governed'
  | 'remote-surface-event-refused';

export interface XSurfaceManagerEventDetail {
  managerId: string;
  result:
    | XtendSurfaceOperationResult
    | XSurfaceManagerPersistenceResult
    | XSurfaceManagerLoadingResult
    | XSurfaceManagerRouteLifecycleResult
    | XSurfaceManagerStackPolicyResult
    | XSurfaceManagerLayoutEngineResult
    | XSurfaceManagerRemotePolicyResult
    | null;
  snapshot: XtendSurfaceSnapshot;
  loading?: XSurfaceManagerLoadingSnapshot;
  routeLifecycle?: XSurfaceManagerRouteLifecycleSnapshot;
  stackPolicy?: XSurfaceManagerStackPolicySnapshot;
  layout?: XSurfaceManagerLayoutEngineSnapshot;
  remotePolicy?: XSurfaceManagerRemotePolicySnapshot;
}

export interface XSurfaceManagerPersistenceSnapshot {
  schema: 'xtend.surface.manager-persistence.v1';
  version: number;
  managerId: string;
  restoreKey: string;
  stateKey: string;
  mode: XSurfaceManagerPersistenceMode;
  policy: XSurfaceManagerRestorePolicy;
  key: string;
  storageAvailable: boolean;
  hasSnapshot: boolean;
  noContentPayload: true;
  createsSecondRegistry: false;
}

export interface XSurfaceManagerPersistenceResult {
  ok: boolean;
  persisted?: boolean;
  restored?: boolean;
  cleared?: boolean;
  reset?: boolean;
  skipped?: boolean;
  key?: string;
  mode?: XSurfaceManagerPersistenceMode;
  snapshot?: XtendSurfaceSnapshot | Record<string, unknown>;
  diagnostic?: Record<string, unknown>;
  restoredCount?: number;
  skippedCount?: number;
}

export interface XSurfaceManagerLoadingSurface {
  surfaceId: string;
  label?: string;
  type?: string;
  status: string;
  policy: XSurfaceManagerLoadingPolicy;
  hydrated: boolean;
  skeleton: boolean;
  pendingRoute: boolean;
  contentReady: boolean;
  tags: string[];
  unresolvedTags: string[];
  durationMs: number;
  diagnosticCount: number;
}

export interface XSurfaceManagerLoadingSnapshot {
  schema: 'xtend.surface.loading-report.v1';
  policySchema: 'xtend.surface.loading-policy.v1';
  managerId: string;
  stateKey: string;
  defaultPolicy: XSurfaceManagerLoadingPolicy;
  timeoutMs: number;
  surfaceCount: number;
  skeletonCount: number;
  hydratedCount: number;
  pendingCount: number;
  routePendingCount: number;
  surfaces: XSurfaceManagerLoadingSurface[];
  shellFirst: true;
  protectsUnstyledContent: true;
  usesXTendLoader: boolean;
  createsSecondRegistry: false;
}

export interface XSurfaceManagerLoadingResult {
  ok: boolean;
  hydrated?: boolean;
  skipped?: boolean;
  surfaceId?: string | null;
  policy?: XSurfaceManagerLoadingPolicy;
  schedule?: string;
  durationMs?: number;
  tags?: string[];
  unresolvedTags?: string[];
  hydration?: Record<string, unknown>;
  diagnostic?: Record<string, unknown>;
}

export interface XSurfaceManagerRouteLifecycleSurface {
  surfaceId: string;
  label?: string;
  type?: string;
  status: string;
  routeRef: string;
  routeScope: string;
  policy: XSurfaceManagerRouteLifecyclePolicy;
  global: boolean;
  persistent: boolean;
  matched: boolean;
  activeRoute: string | null;
  lastRoute: string | null;
  lastAction: string | null;
  diagnostic: Record<string, unknown> | null;
}

export interface XSurfaceManagerRouteLifecycleSnapshot {
  schema: 'xtend.surface.route-lifecycle-report.v1';
  policySchema: 'xtend.surface.route-lifecycle.v1';
  managerId: string;
  stateKey: string;
  routeAware: boolean;
  defaultPolicy: XSurfaceManagerRouteLifecyclePolicy;
  currentRoute: Record<string, unknown> | null;
  surfaceCount: number;
  routeBoundCount: number;
  globalCount: number;
  matchedCount: number;
  surfaces: XSurfaceManagerRouteLifecycleSurface[];
  controllerRemainsRegistryTruth: true;
  createsSecondRegistry: false;
  xrouterOwnsRouteState: true;
}

export interface XSurfaceManagerRouteLifecycleResult {
  schema?: 'xtend.surface.route-lifecycle-report.v1';
  ok: boolean;
  skipped?: boolean;
  route?: Record<string, unknown>;
  matchedCount?: number;
  globalCount?: number;
  actionCount?: number;
  actions?: Array<Record<string, unknown>>;
  snapshot?: XtendSurfaceSnapshot;
  diagnostic?: Record<string, unknown>;
}

export interface XSurfaceManagerStackPolicySurface {
  schema: 'xtend.surface.stack-policy.v1';
  surfaceId: string;
  label?: string;
  type?: string;
  status: string;
  open: boolean;
  modal: boolean;
  activeModal: boolean;
  inert: boolean;
  ariaHidden: boolean;
  ariaModal: boolean;
  focusable: boolean;
  escapeTarget: boolean;
  topmost: boolean;
  stackIndex: number;
  zIndex: number;
  layerToken: string;
}

export interface XSurfaceManagerStackPolicySnapshot {
  schema: 'xtend.surface.stack-policy-report.v1';
  policySchema: 'xtend.surface.stack-policy.v1';
  managerId: string;
  stateKey: string;
  modalPolicy: XSurfaceManagerModalPolicy;
  surfaceCount: number;
  openSurfaceCount: number;
  modalSurfaceCount: number;
  inertSurfaceCount: number;
  topmostSurfaceId: string | null;
  activeModalSurfaceId: string | null;
  escapeTargetSurfaceId: string | null;
  scrollLocked: boolean;
  focusRestoreTargetCount: number;
  diagnostics: Array<Record<string, unknown>>;
  surfaces: XSurfaceManagerStackPolicySurface[];
  overlayCompatibilityPreserved: true;
  controllerRemainsRegistryTruth: true;
  createsSecondRegistry: false;
}

export interface XSurfaceManagerStackPolicyResult {
  schema?: 'xtend.surface.stack-policy-report.v1';
  ok: boolean;
  source?: string;
  surfaceId?: string;
  modalPolicy?: XSurfaceManagerModalPolicy;
  topmostSurfaceId?: string | null;
  activeModalSurfaceId?: string | null;
  escapeTargetSurfaceId?: string | null;
  inertSurfaceCount?: number;
  diagnostics?: Array<Record<string, unknown>>;
  snapshot?: XtendSurfaceSnapshot;
  stackPolicy?: XSurfaceManagerStackPolicySnapshot;
  diagnostic?: Record<string, unknown>;
}

export interface XSurfaceManagerLayoutSurface {
  schema: 'xtend.surface.layout-engine.v1';
  surfaceId: string;
  type?: string;
  status: string;
  engine: XSurfaceManagerLayoutEngine;
  zone: string;
  placement: string;
  mode: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };
  changed: boolean;
  snapshotCompatible: true;
  responsiveFallback: string | null;
  collisionAdjusted: boolean;
  viewportConstrained: boolean;
}

export interface XSurfaceManagerLayoutEngineSnapshot {
  schema: 'xtend.surface.layout-engine-report.v1';
  policySchema: 'xtend.surface.layout-engine.v1';
  managerId: string;
  stateKey: string;
  engine: XSurfaceManagerLayoutEngine;
  requestedEngine: XSurfaceManagerLayoutEngine;
  viewport: {
    width: number;
    height: number;
    compact: boolean;
  };
  gap: number;
  snap: number;
  surfaceCount: number;
  changedCount: number;
  responsiveFallback: boolean;
  surfaces: XSurfaceManagerLayoutSurface[];
  diagnostics: Array<Record<string, unknown>>;
  snapshotCompatible: true;
  controllerRemainsRegistryTruth: true;
  createsSecondRegistry: false;
  lastAppliedAt?: string | null;
}

export interface XSurfaceManagerLayoutEngineResult extends XSurfaceManagerLayoutEngineSnapshot {
  ok: boolean;
  source: string;
  committed: boolean;
  snapshot: XtendSurfaceSnapshot;
}

export type XSurfaceManagerRemotePolicyMode = 'strict' | 'audit' | 'off';
export type XSurfaceManagerRemotePolicyDecision = 'mounted' | 'degraded' | 'refused';

export interface XSurfaceManagerRemotePolicySurface {
  schema: 'xtend.surface.remote-policy-bridge.v1';
  surfaceId: string | null;
  decision: XSurfaceManagerRemotePolicyDecision;
  mounted: boolean;
  degraded: boolean;
  refused: boolean;
  ownerId: string | null;
  origin: string | null;
  trustBoundary: 'xtend.security.remote-surface.v1' | string;
  fallbackRef: string | null;
  enterpriseSurfaceId: string | null;
  enterpriseRegistryHit: boolean;
  degradationState: string | null;
  diagnosticCount: number;
  kernelRemoteExecution: false;
}

export interface XSurfaceManagerRemotePolicySnapshot {
  schema: 'xtend.surface.remote-policy-report.v1';
  policySchema: 'xtend.surface.remote-policy-bridge.v1';
  diagnosticSchema: 'xtend.surface.remote-policy-diagnostic.v1';
  managerId: string;
  stateKey: string;
  policyMode: XSurfaceManagerRemotePolicyMode;
  trustBoundary: 'xtend.security.remote-surface.v1' | string;
  allowedOrigins: string[];
  allowedCapabilities: string[];
  surfaceCount: number;
  mountedCount: number;
  degradedCount: number;
  refusedCount: number;
  decisions: XSurfaceManagerRemotePolicyDecision[];
  surfaces: XSurfaceManagerRemotePolicySurface[];
  diagnostics: Array<Record<string, unknown>>;
  hostDecisionBoundary: true;
  eventGovernance: true;
  rmtKernelRemoteExecution: false;
  createsSecondRegistry: false;
}

export interface XSurfaceManagerRemotePolicyResult {
  schema: 'xtend.surface.remote-policy-report.v1' | 'xtend.surface.remote-policy-bridge.v1' | string;
  operation?: string;
  ok: boolean;
  decision?: XSurfaceManagerRemotePolicyDecision;
  mounted?: boolean;
  degraded?: boolean;
  refused?: boolean;
  governed?: boolean;
  surfaceId?: string | null;
  event?: string | null;
  direction?: string | null;
  ownerId?: string | null;
  origin?: string | null;
  fallbackRef?: string | null;
  enterpriseSurfaceId?: string | null;
  diagnostics?: Array<Record<string, unknown>>;
  remoteSurface?: Record<string, unknown>;
  controllerResult?: XtendSurfaceOperationResult | Record<string, unknown> | null;
  payload?: Record<string, unknown>;
  snapshot?: XtendSurfaceSnapshot;
  source?: string;
  kernelBoundary?: {
    remoteRuntimeExecution: false;
    hostAdapterRequired: boolean;
    networkRequiredByKernel: false;
  };
  createsSecondRegistry?: false;
}

export interface XSurfaceManagerElement extends HTMLElement {
  readonly surfaces: XtendSurfaceSnapshot['surfaces'];
  readonly activeSurfaceId: string | null;
  readonly layoutSnapshot: XtendSurfaceSnapshot;
  readonly surfaceController: XtendSurfaceController;
  readonly persistenceSnapshot: XSurfaceManagerPersistenceSnapshot;
  readonly loadingSnapshot: XSurfaceManagerLoadingSnapshot;
  readonly routeLifecycleSnapshot: XSurfaceManagerRouteLifecycleSnapshot;
  readonly stackPolicySnapshot: XSurfaceManagerStackPolicySnapshot;
  readonly layoutEngineSnapshot: XSurfaceManagerLayoutEngineSnapshot;
  readonly remoteSurfacePolicySnapshot: XSurfaceManagerRemotePolicySnapshot;
  registerSurface(surface: HTMLElement | Record<string, unknown>): XtendSurfaceOperationResult;
  openSurface(id: string, input?: Record<string, unknown>): XtendSurfaceOperationResult;
  closeSurface(id: string, reason?: string): XtendSurfaceOperationResult;
  destroySurface(id: string, options?: Record<string, unknown>): XtendSurfaceOperationResult;
  registerSurfacePrewarmHandle(surfaceId: string, handle: unknown, options?: Record<string, unknown>): Record<string, unknown>;
  registerSurfaceChunkHandle(surfaceId: string, handle: unknown, options?: Record<string, unknown>): Record<string, unknown>;
  applyWarmReentryBackpressure(input?: string | { level?: string; pressureLevel?: string }): Record<string, unknown>;
  focusSurface(id: string): XtendSurfaceOperationResult;
  updateSurface(id: string, patch?: Record<string, unknown>): XtendSurfaceOperationResult;
  moveSurface(id: string, bounds: Record<string, unknown>): XtendSurfaceOperationResult;
  resizeSurface(id: string, bounds: Record<string, unknown>): XtendSurfaceOperationResult;
  minimizeSurface(id: string): XtendSurfaceOperationResult;
  maximizeSurface(id: string): XtendSurfaceOperationResult;
  restoreSurface(id: string): XtendSurfaceOperationResult;
  materializeSurface(id: string, input?: Record<string, unknown>): XtendSurfaceOperationResult;
  toggleSurface(id: string, input?: Record<string, unknown>): XtendSurfaceOperationResult;
  pinSurface(id: string, pinned?: boolean): XtendSurfaceOperationResult;
  collapseSurface(id: string): XtendSurfaceOperationResult;
  expandSurface(id: string, mode?: string): XtendSurfaceOperationResult;
  dockSurface(id: string, placement?: string, mode?: string): XtendSurfaceOperationResult;
  undockSurface(id: string, bounds?: Record<string, unknown>): XtendSurfaceOperationResult;
  snapshot(options?: Record<string, unknown>): XtendSurfaceSnapshot;
  readSnapshot(options?: Record<string, unknown>): XtendSurfaceSnapshot;
  snapshotSurfaceLoading(): XSurfaceManagerLoadingSnapshot;
  hydrateSurfaceContent(surfaceRef: string | HTMLElement | Record<string, unknown>, options?: Record<string, unknown>): Promise<XSurfaceManagerLoadingResult>;
  snapshotRouteLifecycle(): XSurfaceManagerRouteLifecycleSnapshot;
  applyRouteLifecycle(routeInput?: string | Event | Record<string, unknown> | null, options?: Record<string, unknown>): XSurfaceManagerRouteLifecycleResult;
  snapshotStackPolicy(): XSurfaceManagerStackPolicySnapshot;
  applyStackPolicy(options?: Record<string, unknown>): XSurfaceManagerStackPolicyResult;
  snapshotSurfaceLayout(): XSurfaceManagerLayoutEngineSnapshot;
  applyLayoutEngine(engine?: XSurfaceManagerLayoutEngine, options?: Record<string, unknown>): XSurfaceManagerLayoutEngineResult;
  evaluateRemoteSurfacePolicy(surfaceInput?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceManagerRemotePolicyResult;
  applyRemoteSurfacePolicy(surfaceInput?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceManagerRemotePolicyResult;
  registerRemoteSurface(remoteSurface?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceManagerRemotePolicyResult;
  snapshotRemoteSurfacePolicy(): XSurfaceManagerRemotePolicySnapshot;
  governRemoteSurfaceEvent(eventInput?: Record<string, unknown>, payload?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceManagerRemotePolicyResult;
  snapshotPersistence(options?: Record<string, unknown>): XSurfaceManagerPersistenceSnapshot;
  persistSnapshot(snapshot?: XtendSurfaceSnapshot, options?: Record<string, unknown>): XSurfaceManagerPersistenceResult;
  restorePersistedSnapshot(options?: Record<string, unknown>): XSurfaceManagerPersistenceResult;
  clearPersistedSnapshot(options?: Record<string, unknown>): XSurfaceManagerPersistenceResult;
  resetSurfaceLayout(options?: Record<string, unknown>): XSurfaceManagerPersistenceResult;
  addEventListener(type: XSurfaceManagerEventName, listener: (event: CustomEvent<XSurfaceManagerEventDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-surface-manager': XSurfaceManagerElement;
  }
}

export {};
