import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Readable } from 'node:stream';
import type { RmtNodeSsrAdapter, RmtNodeSsrOptions } from './rmt-node-ssr-adapter.js';
import type { JsonValue } from './rmt-portable-render.js';
import type { HeadRecord, PageManifest, PageProvider, PageResponse, PageSelection, PageResult } from './page-contract.js';
export interface NodePageContext { request: IncomingMessage; signal: AbortSignal; contextKey: string; csrfToken?: string; origin?: string; selection: PageSelection }
export interface NodePageResolution { page: string; props?: Record<string, JsonValue | PageProvider>; url?: string; status?: number; head?: HeadRecord[]; layout?: string; flash?: Record<string, JsonValue>; errors?: PageResponse['errors']; pagination?: PageResponse['pagination']; renderOptions?: RmtNodeSsrOptions }
export interface NodePageHostOptions<C extends NodePageContext = NodePageContext> {
  manifest: PageManifest; adapter?: RmtNodeSsrAdapter; ssr?: RmtNodeSsrOptions; timeoutMs?: number; cleanupTimeoutMs?: number;
  appServiceHost?: {handle(request: IncomingMessage, response: ServerResponse): Promise<boolean>};
  createContext(request: IncomingMessage, signal: AbortSignal): Omit<C, 'request' | 'signal' | 'selection'> | Promise<Omit<C, 'request' | 'signal' | 'selection'>>;
  resolvePage(context: C): NodePageResolution | { redirect: string; status?: number } | { download: Readable | ReadableStream<Uint8Array>; headers?: Record<string, string>; status?: number } | null | Promise<NodePageResolution | { redirect: string; status?: number } | { download: Readable | ReadableStream<Uint8Array>; headers?: Record<string, string>; status?: number } | null>;
  share?(context: C): Record<string, JsonValue> | Promise<Record<string, JsonValue>>;
  validate?(context: C, fields: string[]): {errors: Record<string,string[]>} | Promise<{errors: Record<string,string[]>}>;
  cleanup?(context?: C): void | Promise<void>;
  onError?(error: unknown, context?: C): void;
  onCleanupError?(error: unknown, context?: C): void;
}
export interface NodePageHost { handle(request: IncomingMessage, response: ServerResponse): Promise<boolean>; dispose(reason?: Error): void }
export function createNodePageHost<C extends {contextKey: string}>(options: Omit<NodePageHostOptions<Omit<C, 'request' | 'signal' | 'selection'> & NodePageContext>, 'createContext'> & {createContext(request: IncomingMessage, signal: AbortSignal): C | Promise<C>}): NodePageHost;
export function createNodePageHost<C extends NodePageContext = NodePageContext>(options: NodePageHostOptions<C>): NodePageHost;
export function renderPageDocument(page: PageResponse, html: string, assets?: PageManifest['assets'], nonce?: string): string;
export interface NodePageRoute { name: string; uri: string; methods: string[]; parameters?: string[]; domain?: string | null }
export function createNodePageRouteManifest(routes: Iterable<NodePageRoute>): {schema:'xtend.page-routes.v1';host:'node';routes:Record<string,Omit<NodePageRoute,'name'>>};
