import type { JsonValue, PortableRenderArtifact, PortableDescriptor } from './rmt-portable-render.js';
import type { RmtNodeSsrPrerenderResponseEnvelope, RmtNodeSsrRenderInput } from './rmt-node-ssr-adapter.js';
export const PAGE_RESPONSE_SCHEMA: 'xtend.page-response.v1';
export const PAGE_MANIFEST_SCHEMA: 'xtend.page-manifest.v1';
export type HeadRecord = { tag: 'title' | 'meta'; text?: string; attributes?: { name?: string; property?: string; content?: string; charset?: string } } | {tag:'link'; attributes:{rel:'canonical'; href:string}} | {tag:'json-ld'; key:string; data:JsonValue};
export function headRecordKey(record: HeadRecord): string;
export interface PageManifest { schema: typeof PAGE_MANIFEST_SCHEMA; version: string; configurationFingerprint?: string; assetFingerprints?: Record<string,string>; runtimeFingerprints?: {node?: Record<string,string>; php?: Record<string,string>}; assets?: { entry?: string; css?: string[] }; layouts?: Record<string, {artifact: PortableRenderArtifact; head?: HeadRecord[]}>; pages: Record<string, { artifact?: PortableRenderArtifact; maraca?: {entry:string;integrity?:string;sourceFingerprint?:string;files?:Record<string,string>}; input?: RmtNodeSsrRenderInput; layout?: string | null; head?: HeadRecord[] }> }
export interface PageSelection { only?: string[] | null; deferred?: string[] | null; once?: string[]; prefetch?: boolean }
export interface MergeRule { mode: 'replace' | 'append' | 'prepend'; key?: string | null }
export interface PageData { props: Record<string, JsonValue>; deferred: Record<string, string[]>; merge: Record<string, MergeRule>; once: Record<string, { key: string; ttl: number }> }
export interface PageIdentity { schema: typeof PAGE_RESPONSE_SCHEMA; version: string; contextKey: string }
export interface PageResponse extends PageIdentity, PageData { maraca?: {entry:string;integrity?:string;sourceFingerprint?:string;files?:Record<string,string>} | null; kind: 'page'; csrfToken?: string; page: string; url: string; layout: string | null; head: HeadRecord[]; shared: Record<string, JsonValue>; flash: Record<string, JsonValue>; errors: Record<string, Record<string, string[]>>; partial: boolean; pagination?: { next?: string | null; previous?: string | null; props: string[] } | null; renderArtifact?: PortableRenderArtifact | null; layoutArtifact?: PortableRenderArtifact | null; ssr?: RmtNodeSsrPrerenderResponseEnvelope }
export interface PageRedirect extends PageIdentity { kind: 'redirect' | 'reload'; location: string }
export type PageResult = PageResponse | PageRedirect;
export interface PageProviderContext { signal?: AbortSignal; selection?: PageSelection }
export interface PageProvider<T extends JsonValue = JsonValue> { readonly kind: 'lazy' | 'defer' | 'merge' | 'once'; readonly resolve: T | ((context: PageProviderContext) => T | Promise<T>) }
export const Prop: {
  lazy<T extends JsonValue>(resolve: (context: PageProviderContext) => T | Promise<T>): PageProvider<T>;
  defer<T extends JsonValue>(resolve: (context: PageProviderContext) => T | Promise<T>, group?: string): PageProvider<T>;
  merge<T extends JsonValue>(resolve: T | ((context: PageProviderContext) => T | Promise<T>), options?: Partial<MergeRule>): PageProvider<T>;
  once<T extends JsonValue>(resolve: T | ((context: PageProviderContext) => T | Promise<T>), options?: { key?: string; ttl?: number }): PageProvider<T>;
};
export function pageError(code: string, message: string, status?: number): Error & {code: string; status: number};
export function assertKey(key: string): string;
export function parsePageSelection(headers: Headers | Record<string, string | string[] | undefined>): PageSelection;
export function resolvePageProps(input: Record<string, JsonValue | PageProvider>, context?: PageProviderContext, selection?: PageSelection): Promise<PageData>;
export function mergePageProps(previous: Record<string, JsonValue>, incoming: Record<string, JsonValue>, rules?: Record<string, MergeRule>): Record<string, JsonValue>;
export function safePageJson(value: unknown): string;
export function validatePageResponse(value: unknown): PageResult;

export function mergePageHead(layout?: HeadRecord[], page?: HeadRecord[]): HeadRecord[];
export function composePageDescriptor(layout: PortableDescriptor | null, page: PortableDescriptor): PortableDescriptor;

export function pagePagination(input: {next?: string | null; previous?: string | null; props: string[]}): {next: string | null; previous: string | null; props:string[]};
