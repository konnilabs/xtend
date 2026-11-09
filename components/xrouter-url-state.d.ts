import type { MaracaPlanRuntime, MaracaURLRestoreResult } from '../xtend-maraca/plan-runtime';
import type * as Codec from '../tools/xtensions/url-state';
export const XROUTER_URL_STATE_API_VERSION: '1.0.0';
export interface XRouterURLStateHost {
  readonly schema: 'xtend.router.url-state-host.v1'; readonly apiVersion: '1.0.0';
  navigate(cause?: 'initialize' | 'traverse' | 'reset', force?: boolean): Promise<MaracaURLRestoreResult>;
  publish(cause?: 'commit' | 'checkpoint'): ReturnType<MaracaPlanRuntime['publishURLState']>;
  reset(): Promise<MaracaURLRestoreResult>; retry(): Promise<MaracaURLRestoreResult>; whenIdle(): Promise<unknown>; dispose(): boolean;
}
export function createXRouterURLStateHost(options: { runtime: Pick<MaracaPlanRuntime,'restoreURLState' | 'publishURLState'>; codec: typeof Codec; windowTarget: Window; mode?: 'history' | 'hash'; listen?: boolean; isOwnerCurrent?(): boolean; onError?(error: unknown): void }): XRouterURLStateHost;
