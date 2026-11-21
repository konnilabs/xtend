import type { XTensionInstanceAddress } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import type { FrameworkSSRResult } from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import type { MaracaXTensionBootOptions } from './browser-composition-runtime';
export const XTENSION_SSR_API_VERSION: '2.0.0';
export interface XTensionSSRIntent {
  readonly schema: 'xtend.maraca.xtension-ssr-intent.v1';
  readonly id: string; readonly generation: string; readonly address: XTensionInstanceAddress;
  readonly event: string; readonly payload: Readonly<Record<string, unknown>>;
}
export interface XTensionSSRHostSnapshot {
  readonly address: XTensionInstanceAddress; readonly hostSurface: string; readonly surface: string;
  readonly providerId: string; readonly framework: 'react' | 'vue'; readonly version: string;
  readonly peers: Readonly<Record<string, string>>; readonly identifierPrefix: string;
  readonly props: Readonly<Record<string, unknown>>; readonly dom: readonly unknown[];
}
export interface XTensionSSRPayload {
  readonly schema: 'xtend.maraca.xtension-ssr-payload.v1'; readonly generation: string;
  readonly sourceHash: string; readonly compositionSha256: string; readonly rootId: string;
  readonly issuedAt: number; readonly expiresAt: number; readonly state: Readonly<Record<string, unknown>>;
  readonly hosts: readonly XTensionSSRHostSnapshot[]; readonly shell: readonly unknown[];
}
export interface XTensionSSRSnapshot {
  readonly schema: 'xtend.maraca.xtension-ssr-snapshot.v1';
  readonly payload: XTensionSSRPayload;
  /** Application-specific signature data; a digest alone supplies no authority. */
  readonly signature: unknown;
}
export interface XTensionSSRServerOptions {
  readonly schema: 'xtend.maraca.xtension-ssr-options.v1'; readonly mode: 'server';
  readonly generation: string; readonly expiresInMs?: number; readonly now?: () => number;
  sign(canonicalPayload: string): unknown | Promise<unknown>;
  readonly snapshot?: never; readonly verify?: never; readonly intents?: never; readonly fallback?: 'reject';
}
export interface XTensionSSRClientOptions {
  readonly schema: 'xtend.maraca.xtension-ssr-options.v1'; readonly mode: 'client';
  readonly snapshot: XTensionSSRSnapshot;
  verify(canonicalPayload: string, signature: unknown): boolean | Promise<boolean>;
  readonly intents?: readonly XTensionSSRIntent[] | (() => readonly XTensionSSRIntent[]);
  readonly fallback?: 'reject' | 'mount'; readonly now?: () => number;
  readonly sign?: never; readonly generation?: never; readonly expiresInMs?: never;
}
export interface XTensionSSRReport {
  readonly schema: 'xtend.maraca.xtension-ssr-report.v1'; readonly apiVersion: '1.0.0';
  readonly mode: 'server' | 'client'; readonly generation: string;
  readonly status: 'server-rendered' | 'resumed' | 'fallback-mounted';
  readonly hosts: readonly { readonly address: XTensionInstanceAddress; readonly result: FrameworkSSRResult }[];
  readonly replayedIntents: number; readonly phases: readonly string[];
}
export interface XTensionSSRResponse {
  readonly schema: 'xtend.maraca.xtension-ssr-response.v1'; readonly apiVersion: '1.0.0';
  readonly html: string; readonly snapshot: XTensionSSRSnapshot; readonly report: XTensionSSRReport;
}
export interface MaracaXTensionNodeSSROptions {
  readonly build: {readonly ok:boolean;readonly plan:import('./index').MaracaComposedBuildPlan;readonly [key:string]:unknown}; readonly documentTarget: Document; readonly root: Element;
  readonly fabric: MaracaXTensionBootOptions['fabric']; readonly xtensions: MaracaXTensionBootOptions['xtensions'];
  readonly initialState?: Readonly<Record<string, unknown>>; readonly generation: string;
  readonly expiresInMs?: number; readonly now?: () => number;
  sign(canonicalPayload: string): unknown | Promise<unknown>;
}
/** Actual successful delivery-profile build; serialized reports do not confer byte authority.
 * Inject a request-local DOM and exactly matched server-renderer peers. */
export function renderMaracaXTensionSSR(options: MaracaXTensionNodeSSROptions): Promise<XTensionSSRResponse>;

export interface ComponentSSRIntent extends Omit<XTensionSSRIntent,'schema'> {readonly schema:'xtend.maraca.xtension-ssr-intent.v2';readonly payloadOrigin:'provider'}
export interface ComponentSSRHostSnapshot extends XTensionSSRHostSnapshot {readonly ownerSurface:string;readonly targetSurface:string;readonly interfaceVersion:string;readonly interfaceSha256:string;readonly moduleSha256:string}
export interface ComponentSSRPayload extends Omit<XTensionSSRPayload,'schema'|'hosts'> {readonly schema:'xtend.maraca.xtension-ssr-payload.v2';readonly hosts:readonly ComponentSSRHostSnapshot[]}
export interface ComponentSSRSnapshot extends Omit<XTensionSSRSnapshot,'schema'|'payload'> {readonly schema:'xtend.maraca.xtension-ssr-snapshot.v2';readonly payload:ComponentSSRPayload}
export interface ComponentSSRServerOptions extends Omit<XTensionSSRServerOptions,'schema'> {readonly schema:'xtend.maraca.xtension-ssr-options.v2'}
export interface ComponentSSRClientOptions extends Omit<XTensionSSRClientOptions,'schema'|'snapshot'|'intents'> {readonly schema:'xtend.maraca.xtension-ssr-options.v2';readonly snapshot:ComponentSSRSnapshot;readonly intents?:readonly ComponentSSRIntent[]|(()=>readonly ComponentSSRIntent[])}
export interface ComponentSSRReport extends Omit<XTensionSSRReport,'schema'|'apiVersion'> {readonly schema:'xtend.maraca.xtension-ssr-report.v2';readonly apiVersion:'2.0.0'}
export interface ComponentSSRResponse extends Omit<XTensionSSRResponse,'schema'|'apiVersion'|'snapshot'|'report'> {readonly schema:'xtend.maraca.xtension-ssr-response.v2';readonly apiVersion:'2.0.0';readonly snapshot:ComponentSSRSnapshot;readonly report:ComponentSSRReport}
export interface ComponentNodeSSROptions extends Omit<MaracaXTensionNodeSSROptions,'build'> {readonly build:{readonly ok:boolean;readonly plan:import('./index').MaracaScopedComponentBuildPlan;readonly [key:string]:unknown}}
export function renderMaracaXTensionSSR(options:ComponentNodeSSROptions):Promise<ComponentSSRResponse>;

/** Separate RMTX wire profile; no v1/v2 snapshot is widened implicitly. */
export const RMTX_XTENSION_SSR_API_VERSION: '3.0.0';
export type RmtxSSRSourceIdentity = import('./xtension-rmtx-ssr-contract.mjs').RmtxSSRSourceIdentity;
export interface RmtxSSRIntent extends Omit<ComponentSSRIntent,'schema'> {readonly schema:'xtend.maraca.xtension-ssr-intent.v3'}
export interface RmtxSSRHostSnapshot extends ComponentSSRHostSnapshot {readonly ownerInstance:string}
export interface RmtxSSRPayload extends Omit<ComponentSSRPayload,'schema'|'hosts'> {
  readonly schema:'xtend.maraca.xtension-ssr-payload.v3';readonly sourceIdentity:RmtxSSRSourceIdentity;readonly hosts:readonly RmtxSSRHostSnapshot[];
}
export interface RmtxSSRSnapshot extends Omit<ComponentSSRSnapshot,'schema'|'payload'> {readonly schema:'xtend.maraca.xtension-ssr-snapshot.v3';readonly payload:RmtxSSRPayload}
export interface RmtxSSRServerOptions extends Omit<ComponentSSRServerOptions,'schema'> {readonly schema:'xtend.maraca.xtension-ssr-options.v3'}
export interface RmtxSSRClientOptions extends Omit<ComponentSSRClientOptions,'schema'|'snapshot'|'intents'> {
  readonly schema:'xtend.maraca.xtension-ssr-options.v3';readonly snapshot:RmtxSSRSnapshot;
  readonly intents?:readonly RmtxSSRIntent[]|(()=>readonly RmtxSSRIntent[]);
}
export interface RmtxSSRReport extends Omit<ComponentSSRReport,'schema'|'apiVersion'> {readonly schema:'xtend.maraca.xtension-ssr-report.v3';readonly apiVersion:'3.0.0'}
export interface RmtxSSRResponse extends Omit<ComponentSSRResponse,'schema'|'apiVersion'|'snapshot'|'report'> {
  readonly schema:'xtend.maraca.xtension-ssr-response.v3';readonly apiVersion:'3.0.0';readonly snapshot:RmtxSSRSnapshot;readonly report:RmtxSSRReport;
}
export interface RmtxNodeSSROptions extends Omit<MaracaXTensionNodeSSROptions,'build'|'xtensions'|'fabric'> {
  readonly schema:'xtend.maraca.xtension-ssr-render-options.v3';
  /** Actual deployed entry URL; required for external CSS/import.meta.url.
   * This authoritative HTTP(S) base stays fixed for the genuine build. */
  readonly moduleBaseURL?:string;
  /** Successful inner build from the separately registered RMTX SSR builder. */
  readonly build:NonNullable<import('./index').MaracaRmtxSSRBuildResult['build']>;
  readonly fabric:MaracaXTensionNodeSSROptions['fabric'] & {runFiber:(...args: any[])=>unknown};
  /** Omitted only for a native-only build with no provider declarations. */
  readonly xtensions?:MaracaXTensionNodeSSROptions['xtensions'] & {readonly ssr?:never};
}
export function renderMaracaXTensionSSR(options:RmtxNodeSSROptions):Promise<RmtxSSRResponse>;
