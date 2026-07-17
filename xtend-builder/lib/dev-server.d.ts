import type { EventEmitter } from 'node:events';
import type { Server } from 'node:http';

export interface XtendDevServerOptions {
  rootDir?: string;
  defaultPath?: string;
  host?: string;
  port?: number;
  cacheControl?: string;
  contentSecurityPolicy?: string;
}

export interface XtendDevServerHandle {
  schema: 'xtend.local-dev-server.v1';
  server: Server;
  host: string;
  port: number;
  origin: string;
  rootDir: string;
  defaultPath: string;
}

export declare const DEFAULT_HOST: '127.0.0.1';
export declare const DEFAULT_INDEX: 'index.html';
export declare const DEFAULT_PORT: 4173;
export declare const SERVER_CONTRACT: 'xtend.local-dev-server.v1';
export declare function closeServer(server: Server): Promise<void>;
export declare function contentTypeFor(filePath: string): string;
export declare function createXtendDevServer(options?: XtendDevServerOptions): Server;
export declare function listenXtendDevServer(options?: XtendDevServerOptions): Promise<XtendDevServerHandle>;
export declare function normalizeServeOptions(input?: Record<string, unknown>, options?: { rootDir?: string }): { ok: boolean; errors: string[]; value: { rootDir: string; defaultPath: string; host: string; port: number; check: boolean; json: boolean } };
export declare function pathnameFromRequestUrl(requestUrl?: string): string;
export declare function resolveSafePath(rootDir: string, requestPathname?: string, defaultPath?: string): string | null;
export declare function waitForServerShutdown(server: Server, signalTarget?: EventEmitter): Promise<void>;
