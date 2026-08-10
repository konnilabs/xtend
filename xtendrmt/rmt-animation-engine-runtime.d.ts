export const RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA: 'xtend.rmt.animation-engine-diagnostic.v1';
export const RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA: 'xtend.rmt.animation-engine-runtime.v1';

export type RmtAnimationEffect =
  | 'fade'
  | 'crossfade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'scale'
  | 'pop'
  | 'zoom'
  | 'flip'
  | 'rotate'
  | 'expand'
  | 'collapse'
  | 'fade-blur'
  | 'shared-element'
  | 'layout-flip'
  | 'none'
  | string;

export interface RmtAnimationRecord {
  id: string;
  preset?: string | null;
  effect?: RmtAnimationEffect;
  durationMs?: number;
  easing?: string;
  spring?: Record<string, unknown> | null;
  keyframes?: unknown[];
  timeline?: unknown;
  reducedMotion?: 'instant' | 'fade' | 'none' | string;
  allowFilter?: boolean;
}

export interface RmtAnimationTransitionRecord {
  id: string;
  name?: string;
  trigger?: {
    kind?: 'action' | string;
    id?: string;
    ref?: string;
  };
  from?: string[];
  to?: string[];
  animation?: string | null;
  effect?: RmtAnimationEffect;
  durationMs?: number;
  easing?: string;
  lane?: string;
  layoutKey?: string | null;
  interrupt?: 'cancel' | 'finish' | 'replace' | string;
  reducedMotion?: 'instant' | 'fade' | 'none' | string;
  timeline?: unknown;
  keyframes?: unknown[];
  springSamples?: unknown[];
  operation?: string;
  endpointName?: string;
}

export interface RmtAnimationEnginePlan {
  schema?: string;
  animations?: RmtAnimationRecord[];
  transitions: RmtAnimationTransitionRecord[];
  supportedEffects?: string[];
  diagnostics?: unknown[];
}

export interface RmtAnimationEngineRuntimeOptions {
  animationPlan?: RmtAnimationEnginePlan;
  plan?: RmtAnimationEnginePlan;
  transitionPlan?: RmtAnimationEnginePlan;
  xUtils?: unknown;
  domRenderer?: {
    commit(request: Record<string, unknown>): unknown;
    dispose?(target?: Node, options?: { clearOwnedDom?: boolean }): void;
  };
  /** @deprecated Use domRenderer. */
  renderer?: {
    commit(request: Record<string, unknown>): unknown;
    dispose?(target?: Node, options?: { clearOwnedDom?: boolean }): void;
  };
  documentTarget?: Document | null;
  diagnosticsHub?: {
    publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown;
  };
  diagnosticChannel?: string;
  windowTarget?: Window | typeof globalThis;
  diagnostics?: unknown[];
  strict?: boolean;
  publishDiagnostic?: (diagnostic: unknown) => void;
}

export interface RmtAnimationEngineRunInput {
  target?: Element | null;
  element?: Element | null;
  exitTarget?: Element | null;
  transition?: RmtAnimationTransitionRecord | null;
  phase?: 'enter' | 'exit' | string;
  surface?: string;
  surfaceId?: string;
  action?: string;
  transitionId?: string;
  metadata?: Record<string, unknown>;
}

export interface RmtAnimationEngineRuntime {
  schema: typeof RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA;
  animationPlan: RmtAnimationEnginePlan;
  runSurfaceTransitionPhase(input: RmtAnimationEngineRunInput): Promise<unknown>;
  runTransition(input: RmtAnimationEngineRunInput): Promise<unknown>;
  replaySurfaceTransition(input: RmtAnimationEngineRunInput): Promise<unknown>;
  cancelReplay(): number;
  findTransition(metadata?: Record<string, unknown>): RmtAnimationTransitionRecord | null;
  listActiveAnimations(): unknown[];
  listDiagnostics(): unknown[];
  snapshot(): unknown;
  dispose(): {
    schema: 'xtend.rmt.animation-engine-dispose-report.v1';
    disposed: true;
    alreadyDisposed: boolean;
    cancelledCount: number;
  };
}

export function createRmtAnimationEngineRuntime(options?: RmtAnimationEngineRuntimeOptions): RmtAnimationEngineRuntime;

declare const api: {
  RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA: typeof RMT_ANIMATION_ENGINE_DIAGNOSTIC_SCHEMA;
  RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA: typeof RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA;
  createRmtAnimationEngineRuntime: typeof createRmtAnimationEngineRuntime;
};

export default api;
