import type { RmtResumeRuntimeOptions } from './rmt-resume-runtime.js';
import type { JsonValue, PortableRenderArtifact } from './rmt-portable-render.js';
import type { PageResponse, PageResult, PageSelection } from './page-contract.js';
export interface PageVisitOptions extends PageSelection { method?: string; body?: BodyInit; signal?: AbortSignal; headers?: Record<string, string>; preserveState?: boolean; preserveScroll?: boolean; replace?: boolean; fromHistory?: boolean; transition?: boolean; instant?: string; placeholder?: Record<string, JsonValue>; ttl?: number }
export interface PageClientEvent { type: string; page: PageResponse; error?: unknown; group?: string; next?: PageResult }
export interface PageDownload { kind: 'download'; filename: string; blob: Blob; url: string }
export interface PageClientOptions { viewTransitions?: boolean; activateInitial?(page: PageResponse): Promise<{resume?: import("./rmt-resume-runtime.js").RmtResumeResult}>; transition?(update: () => Promise<void>): void | Promise<void>; initialPage: PageResponse; applicationKey?: string; onDownload?(result: PageDownload): void | Promise<void>; resume?: RmtResumeRuntimeOptions; links?: boolean; forms?: boolean; window?: Window; origin?: string; fetch?: typeof fetch; root?: Element; router?: {pageClient?: {visit(url: string): Promise<unknown>} | null}; headers?(): Record<string, string>; timeoutMs?: number; cacheSize?: number; maxConcurrentRequests?: number; maxQueuedRequests?: number; onceLimit?: number; encryptHistory?: boolean; pages?: Record<string, PortableRenderArtifact>; render?(next: PageResponse, context: {previous?: PageResponse; preserveLayout: boolean; isCurrent():boolean}): void | Promise<void>; onVersionMismatch?(next: PageResult): void | Promise<void> }
export interface PageClient {
  readonly page: PageResponse;
  start(): Promise<PageResponse>;
  visit(url: string, options?: PageVisitOptions): Promise<PageResponse | null>;
  reload(options?: PageVisitOptions): Promise<PageResponse | null>;
  request(url: string, options?: PageVisitOptions): Promise<PageResult | PageDownload>;
  commit(page: PageResponse, options?: PageVisitOptions): Promise<PageResponse | null>;
  prefetch(url: string, options?: PageVisitOptions): Promise<PageResult | PageDownload>;
  download(result: PageDownload): Promise<void>;
  invalidate(): void;
  subscribe(listener: (event: PageClientEvent) => void): () => void;
  remember(key: string): JsonValue;
  remember(key: string, value: JsonValue): void;
  registerResource(dispose: () => void, options?: {layout?: boolean}): () => void;
  poll(interval: number, options?: PageVisitOptions): () => void;
  whenVisible(element: Element, options?: PageVisitOptions): () => void;
  loadMore(direction?: 'next' | 'previous'): Promise<PageResponse | null>;
  optimistic<T>(update: (props: PageResponse['props']) => PageResponse['props'], mutation: () => Promise<T>): Promise<T | null>;
  dispose(): void;
}
export function createPageClient(options: PageClientOptions): PageClient;
export function safeRemember(value: unknown): JsonValue | undefined;
