import type { XScalerAtcHandoff } from "@ccslabs/xtend/xscaler";

export { XSCALER_ATC_HANDOFF_SCHEMA } from "@ccslabs/xtend/xscaler";

export declare const XSURFACE_SHARD_PACKAGE = "@ccslabs/xtend-xsurface-shard";
export declare const XSURFACE_SHARD_PLAN_SCHEMA = "xtend.xsurface.shard-plan.v1";
export declare const XSURFACE_SHARD_SNAPSHOT_SCHEMA = "xtend.xsurface.shard-snapshot.v1";
export declare const XSURFACE_SHARD_HANDOFF_SCHEMA = "xtend.xsurface.shard-atc-handoff.v1";
export declare const XSURFACE_SHARD_FRAGMENT_SCHEMA = "xtend.xsurface.shard-stream-fragment.v1";
export declare const XSURFACE_SHARD_SURFACE_SCHEMA = "xtend.xsurface.shard-surface.v1";
export declare const XSURFACE_SHARD_RECORD_SCHEMA = "xtend.xsurface.shard.v1";
export declare const XSURFACE_SHARD_SECURITY_BLOCKED_CODE = "xsurface.shard.security_blocked";
export declare const XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE = "xsurface.shard.degradation_blocked";
export declare const XSURFACE_SHARD_FALLBACK_MISSING_CODE = "xsurface.shard.fallback_missing";
export declare const XSURFACE_SHARD_LIFECYCLE_INVALID_TRANSITION_CODE = "xsurface.shard.lifecycle_invalid_transition";
export declare const XSURFACE_SHARD_NON_SERIALIZABLE_PAYLOAD_CODE = "xsurface.shard.non_serializable_payload";
export declare const XSURFACE_SHARD_SURFACE_NOT_FOUND_CODE = "xsurface.shard.surface_not_found";
export declare const XSURFACE_SHARD_SERVER_DISPOSED_CODE = "xsurface.shard.server_disposed";

export declare const LIFECYCLE_INITIAL_STATE = "planned";
export declare const LIFECYCLE_ATTACH = "attached";
export declare const LIFECYCLE_DETACH = "detached";
export declare const LIFECYCLE_CANCEL = "cancelled";
export declare const LIFECYCLE_FALLBACK = "fallback_active";

export type XSurfaceShardDecision = "ready" | "degraded" | "refused";
export type XSurfaceShardLifecycleState = "planned" | "attached" | "detached" | "cancelled" | "fallback_active";
export type XSurfaceShardAtcHandoff = XScalerAtcHandoff;

export interface XSurfaceShardDiagnostic {
  code: string;
  severity: "info" | "warning" | "error" | string;
  message: string;
  [key: string]: unknown;
}

export interface XSurfaceShardOwner {
  kind: string;
  id: string;
  known?: boolean;
  [key: string]: unknown;
}

export interface XSurfaceShardShellTarget {
  lane: string;
  target: string;
  mode: string;
}

export interface XSurfaceShardSurface {
  schema: typeof XSURFACE_SHARD_SURFACE_SCHEMA;
  surfaceId: string;
  enterpriseSurfaceId?: string | null;
  manifestId?: string | null;
  name: string;
  owner: XSurfaceShardOwner;
  remote: Record<string, unknown>;
  shardId: string;
  primaryShellTarget: string;
  primaryLane: string;
  shellTargets: XSurfaceShardShellTarget[];
  capabilities: string[];
  events: Record<string, unknown>;
  fallback: Record<string, unknown> | null;
  decision: XSurfaceShardDecision;
  decisionReason: string;
  securityStatus?: string | null;
  degradationState?: string | null;
  lifecycle: {
    state: XSurfaceShardLifecycleState;
  };
  sourceRecord: Record<string, unknown>;
  diagnostics: XSurfaceShardDiagnostic[];
}

export interface XSurfaceShardRecord {
  schema: typeof XSURFACE_SHARD_RECORD_SCHEMA;
  shardId: string;
  ownerId: string;
  primaryShellTarget: string;
  decision: XSurfaceShardDecision;
  surfaceCount: number;
  surfaces: Array<{
    surfaceId: string;
    enterpriseSurfaceId?: string | null;
    name: string;
    decision: XSurfaceShardDecision;
    lifecycle: {
      state: XSurfaceShardLifecycleState;
    };
  }>;
  diagnostics: XSurfaceShardDiagnostic[];
}

export interface XSurfaceShardPlan {
  schema: typeof XSURFACE_SHARD_PLAN_SCHEMA;
  packageName: typeof XSURFACE_SHARD_PACKAGE;
  planId: string;
  generatedAt: string;
  status: XSurfaceShardDecision;
  ok: boolean;
  surfaceCount: number;
  shardCount: number;
  decisions: {
    ready: number;
    degraded: number;
    refused: number;
  };
  partitioning: {
    strategy: string;
    defaultShard: string;
  };
  runtimeBoundary: {
    remoteRuntimeExecution: false;
    kernelRemoteExecution: false;
    hostAdapterRequired: true;
    networkRequiredByKernel: false;
    networkRequiredByShardPlan: false;
  };
  shards: XSurfaceShardRecord[];
  surfaces: XSurfaceShardSurface[];
  diagnostics: XSurfaceShardDiagnostic[];
}

export interface XSurfaceShardHandoff {
  schema: typeof XSURFACE_SHARD_HANDOFF_SCHEMA;
  handoffId: string;
  packageName: typeof XSURFACE_SHARD_PACKAGE;
  status: XSurfaceShardDecision;
  ok: boolean;
  action: string;
  surfaceId: string;
  enterpriseSurfaceId?: string | null;
  shardId: string;
  atc: XSurfaceShardAtcHandoff;
  fallback: Record<string, unknown> | null;
  stream: {
    accepted: boolean;
    fragmentSchema: typeof XSURFACE_SHARD_FRAGMENT_SCHEMA;
  };
  runtimeBoundary: {
    remoteRuntimeExecution: false;
    kernelRemoteExecution: false;
    networkRequiredByHandoff: false;
  };
  diagnostics: XSurfaceShardDiagnostic[];
}

export interface XSurfaceShardFragment {
  schema: typeof XSURFACE_SHARD_FRAGMENT_SCHEMA;
  fragmentId: string;
  packageName: typeof XSURFACE_SHARD_PACKAGE;
  status: "ready" | "refused";
  ok: boolean;
  type: string;
  sequence: number;
  surfaceId: string;
  shardId: string;
  payload: unknown;
  diagnostics: XSurfaceShardDiagnostic[];
  runtimeBoundary: {
    remoteRuntimeExecution: false;
    kernelRemoteExecution: false;
    networkRequiredByFragment: false;
  };
}

export interface XSurfaceShardSnapshot {
  schema: typeof XSURFACE_SHARD_SNAPSHOT_SCHEMA;
  packageName: typeof XSURFACE_SHARD_PACKAGE;
  status: XSurfaceShardDecision | "disposed";
  ok: boolean;
  disposed: boolean;
  planId: string;
  shardCount: number;
  surfaceCount: number;
  fragmentCount: number;
  lifecycle: Array<{
    surfaceId: string;
    state: XSurfaceShardLifecycleState;
  }>;
  shards: XSurfaceShardRecord[];
  diagnostics: XSurfaceShardDiagnostic[];
}

export interface XSurfaceShardServer {
  plan(input?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardPlan;
  attach(surfaceRef: string | Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardHandoff;
  detach(surfaceRef: string | Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardHandoff;
  cancel(surfaceRef: string | Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardHandoff;
  activateFallback(surfaceRef: string | Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardHandoff;
  publishFragment(input?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardFragment;
  snapshot(): XSurfaceShardSnapshot;
  dispose(): XSurfaceShardSnapshot;
}

export declare function createXSurfaceShardPlan(input?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardPlan;
export declare function createXSurfaceShardServer(options?: Record<string, unknown>): XSurfaceShardServer;
export declare function partitionXSurfaceShardSurfaces(input?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardRecord[];
export declare function createXSurfaceAtcHandoff(input?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardHandoff;
export declare function createXSurfaceStreamFragment(input?: Record<string, unknown>, options?: Record<string, unknown>): XSurfaceShardFragment;
export declare function serializeXSurfaceShardPlan(plan: XSurfaceShardPlan): string;
