export const RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA: 'xtend.rmt.surface-transition-diagnostic.v1';
export const RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA: 'xtend.rmt.surface-transition-runtime.v1';

export type RmtSurfaceTransitionEffect =
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

export interface RmtSurfaceTransitionRecord {
  id: string;
  name?: string;
  trigger?: {
    kind?: 'action' | string;
    id?: string;
    ref?: string;
  };
  from?: string[];
  to?: string[];
  effect?: RmtSurfaceTransitionEffect;
  durationMs?: number;
  easing?: string;
  lane?: string;
  animation?: {
    id?: string;
    ref?: string;
  } | string | null;
  timeline?: unknown;
  layoutKey?: string | null;
  interrupt?: 'cancel' | 'finish' | 'replace' | string;
  reducedMotion?: 'instant' | 'fade' | 'none' | string;
  keyframes?: unknown[];
  springSamples?: unknown[];
  operation?: string;
  endpointName?: string;
}

export interface RmtSurfaceTransitionPlan {
  schema?: string;
  transitions: RmtSurfaceTransitionRecord[];
  supportedEffects?: string[];
  diagnostics?: unknown[];
}

export interface RmtSurfaceTransitionRuntimeOptions {
  transitionPlan: RmtSurfaceTransitionPlan;
  root?: ParentNode | null;
  kernelController?: unknown;
  animationEngine?: unknown;
  xstate?: unknown;
  xUtils?: unknown;
  windowTarget?: Window | typeof globalThis;
  diagnostics?: unknown[];
  strict?: boolean;
  publishDiagnostic?: (diagnostic: unknown) => void;
}

export interface RmtSurfaceTransitionPatchInput {
  surface?: string;
  surfaceId?: string;
  element?: Element | null;
  nextHidden: boolean;
  previousHidden?: boolean;
  action?: string;
  transition?: RmtSurfaceTransitionRecord | null;
  metadata?: Record<string, unknown>;
}

export interface RmtSurfaceTransitionRuntime {
  schema: typeof RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA;
  transitionPlan: RmtSurfaceTransitionPlan;
  applyVisibilityPatch(input: RmtSurfaceTransitionPatchInput): Promise<unknown> | unknown;
  findTransition(metadata?: Record<string, unknown>): RmtSurfaceTransitionRecord | null;
  listActiveTransitions(): unknown[];
  listDiagnostics(): unknown[];
  snapshot(): unknown;
}

export function createRmtSurfaceTransitionRuntime(options?: RmtSurfaceTransitionRuntimeOptions): RmtSurfaceTransitionRuntime;

declare const api: {
  RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA: typeof RMT_SURFACE_TRANSITION_DIAGNOSTIC_SCHEMA;
  RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA: typeof RMT_SURFACE_TRANSITION_RUNTIME_SCHEMA;
  createRmtSurfaceTransitionRuntime: typeof createRmtSurfaceTransitionRuntime;
};

export default api;
