import type { XTensionInstanceAddress } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import type { FrameworkSSRResult } from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import type { MaracaXTensionBootOptions } from './browser-composition-runtime';
export const XTENSION_SSR_API_VERSION: '1.0.0';
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
  readonly build: Awaited<ReturnType<typeof import('./index').buildMaracaBundleAsync>>; readonly documentTarget: Document; readonly root: Element;
  readonly fabric: MaracaXTensionBootOptions['fabric']; readonly xtensions: MaracaXTensionBootOptions['xtensions'];
  readonly initialState?: Readonly<Record<string, unknown>>; readonly generation: string;
  readonly expiresInMs?: number; readonly now?: () => number;
  sign(canonicalPayload: string): unknown | Promise<unknown>;
}
/** Actual successful delivery-profile build; serialized reports do not confer byte authority.
 * Inject a request-local DOM and exactly matched server-renderer peers. */
export function renderMaracaXTensionSSR(options: MaracaXTensionNodeSSROptions): Promise<XTensionSSRResponse>;
