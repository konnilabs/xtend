import type { MaracaPlanRuntime, MaracaURLRestoreResult, RmtxPlanRuntime, NativeRmtxPlanRuntime } from '@ccslabs/xtend/maraca/plan-runtime';
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
