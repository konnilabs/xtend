import type { OrchestratedRmtxPlanRuntime16 } from '@ccslabs/xtend/maraca/plan-runtime';
import type { MaracaPlanRuntime, MaracaURLRestoreResult, RmtxPlanRuntime, NativeRmtxPlanRuntime, LifecycleRmtxPlanRuntime } from '@ccslabs/xtend/maraca/plan-runtime';
import type * as Codec from '@ccslabs/xtend/xtensions/url-state';
export const XROUTER_URL_STATE_API_VERSION: '1.0.0';
export const XROUTER_PROJECTION_URL_STATE_API_VERSION: '2.0.0';
export const XROUTER_NATIVE_URL_STATE_API_VERSION: '3.0.0';
export interface XRouterURLStateHost {
  readonly schema: 'xtend.router.url-state-host.v1'; readonly apiVersion: '1.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): Promise<MaracaURLRestoreResult>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<MaracaPlanRuntime['publishURLState']>;
  reset(): Promise<MaracaURLRestoreResult>; retry(): Promise<MaracaURLRestoreResult>; whenIdle(): Promise<unknown>; dispose(): boolean;
}
export function createXRouterURLStateHost(options: { runtime: Pick<MaracaPlanRuntime,'restoreURLState' | 'publishURLState'>; codec: typeof Codec; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterURLStateHost;
export interface XRouterProjectionURLStateHost extends Omit<XRouterURLStateHost, 'schema' | 'apiVersion' | 'navigate' | 'publish' | 'reset' | 'retry'> {
  readonly schema: 'xtend.router.url-state-host.v2'; readonly apiVersion: '2.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): ReturnType<RmtxPlanRuntime['restoreURLState']>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<RmtxPlanRuntime['publishURLState']>;
  reset(): ReturnType<RmtxPlanRuntime['restoreURLState']>; retry(): ReturnType<RmtxPlanRuntime['restoreURLState']>;
}
export function createXRouterProjectionURLStateHost(options: { runtime: Pick<RmtxPlanRuntime,'restoreURLState' | 'publishURLState'>; codec: Codec.ProjectionURLStateRuntime; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterProjectionURLStateHost;
export interface XRouterNativeURLStateHost extends Omit<XRouterURLStateHost, 'schema' | 'apiVersion' | 'navigate' | 'publish' | 'reset' | 'retry'> {
  readonly schema: 'xtend.router.url-state-host.v3'; readonly apiVersion: '3.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): ReturnType<NativeRmtxPlanRuntime['restoreURLState']>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<NativeRmtxPlanRuntime['publishURLState']>;
  reset(): ReturnType<NativeRmtxPlanRuntime['restoreURLState']>; retry(): ReturnType<NativeRmtxPlanRuntime['restoreURLState']>;
}
export function createXRouterNativeURLStateHost(options: { runtime: Pick<NativeRmtxPlanRuntime,'restoreURLState' | 'publishURLState'>; codec: Codec.NativeURLStateRuntime; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterNativeURLStateHost;

export const XROUTER_LIFECYCLE_URL_STATE_API_VERSION: '4.0.0';
export interface XRouterLifecycleURLStateHost extends Omit<XRouterURLStateHost, 'schema' | 'apiVersion' | 'navigate' | 'publish' | 'reset' | 'retry'> {
  readonly schema: 'xtend.router.url-state-host.v4'; readonly apiVersion: '4.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): ReturnType<LifecycleRmtxPlanRuntime['restoreURLState']>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<LifecycleRmtxPlanRuntime['publishURLState']>;
  reset(): ReturnType<LifecycleRmtxPlanRuntime['restoreURLState']>; retry(): ReturnType<LifecycleRmtxPlanRuntime['restoreURLState']>;
}
export function createXRouterLifecycleURLStateHost(options: { runtime: Pick<LifecycleRmtxPlanRuntime,'restoreURLState' | 'publishURLState'>; codec: Codec.LifecycleURLStateRuntime; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterLifecycleURLStateHost;

export const XROUTER_ORCHESTRATED_URL_STATE_API_VERSION: '5.0.0';
export interface XRouterOrchestratedURLStateHost extends Omit<XRouterURLStateHost, 'schema' | 'apiVersion' | 'navigate' | 'publish' | 'reset' | 'retry'> {
  readonly schema: 'xtend.router.url-state-host.v5'; readonly apiVersion: '5.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): ReturnType<OrchestratedRmtxPlanRuntime16['restoreURLState']>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<OrchestratedRmtxPlanRuntime16['publishURLState']>;
  reset(): ReturnType<OrchestratedRmtxPlanRuntime16['restoreURLState']>; retry(): ReturnType<OrchestratedRmtxPlanRuntime16['restoreURLState']>;
}
export function createXRouterOrchestratedURLStateHost(options: { runtime: Pick<OrchestratedRmtxPlanRuntime16,'restoreURLState' | 'publishURLState'>; codec: Codec.OrchestratedURLStateRuntime; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterOrchestratedURLStateHost;

import type { ManagedRmtxPlanRuntime17 } from '@ccslabs/xtend/maraca/plan-runtime';
export const XROUTER_MANAGED_URL_STATE_API_VERSION: '6.0.0';
export interface XRouterManagedURLStateHost extends Omit<XRouterURLStateHost, 'schema' | 'apiVersion' | 'navigate' | 'publish' | 'reset' | 'retry'> {
  readonly schema: 'xtend.router.url-state-host.v6'; readonly apiVersion: '6.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): ReturnType<ManagedRmtxPlanRuntime17['restoreURLState']>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<ManagedRmtxPlanRuntime17['publishURLState']>;
  reset(): ReturnType<ManagedRmtxPlanRuntime17['restoreURLState']>; retry(): ReturnType<ManagedRmtxPlanRuntime17['restoreURLState']>;
}
export function createXRouterManagedURLStateHost(options: { runtime: Pick<ManagedRmtxPlanRuntime17,'restoreURLState' | 'publishURLState'>; codec: import('../tools/xtensions/url-state-managed.js').ManagedURLStateRuntime; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterManagedURLStateHost;
