import type {
  AppServiceInputPolicyManifest,
  AppServiceMap,
  AppServiceRegistry,
  AppServicesDefinition
} from './app-services';
import type { EventEmitter } from 'node:events';
import type {
  NodeAppServiceHost,
  NodeAppServiceHostOptions
} from './node-app-service-host';

export const MARACA_NODE_APP_HOST_SCHEMA: 'xtend.maraca.node-app-host.v1';
export const MARACA_NODE_APP_HOST_STARTUP_SCHEMA: 'xtend.maraca.node-app-host-startup.v1';
export const DEFAULT_HOST: '127.0.0.1';
export const DEFAULT_PORT: 4173;

export interface NodeAppHostOptions<TServices extends AppServiceMap = AppServiceMap> {
  services?: AppServicesDefinition<TServices> | TServices;
  registry?: AppServiceRegistry<TServices>;
  serviceHost?: NodeAppServiceHost<TServices>;
  appServices?: NodeAppServiceHostOptions<TServices>;
  manifest?: AppServiceInputPolicyManifest | null;
  manifestPath?: string | URL;
  rootDir?: string | URL;
  defaultPath?: string;
  publicPaths?: readonly string[];
  host?: string;
  port?: number;
  pathPrefix?: string;
  bodyLimit?: number;
  exposeErrors?: boolean;
  cacheControl?: string;
  contentSecurityPolicy?: string;
  shutdownSignals?: boolean;
  signalTarget?: EventEmitter;
  onError?(error: unknown, context: Record<string, unknown>): void;
}

export interface NodeAppHost<TServices extends AppServiceMap = AppServiceMap> {
  readonly schema: typeof MARACA_NODE_APP_HOST_SCHEMA;
  readonly startupSchema: typeof MARACA_NODE_APP_HOST_STARTUP_SCHEMA;
  readonly server: import('node:http').Server;
  readonly serviceHost: NodeAppServiceHost<TServices>;
  readonly rootDir: string;
  readonly defaultPath: string;
  readonly publicPaths: readonly string[];
  readonly host: string;
  readonly port: number;
  readonly origin: string;
  readonly status: 'created' | 'starting' | 'listening' | 'closing' | 'closed' | 'failed';
  listen(): Promise<this>;
  close(reason?: string): Promise<void>;
  installSignalHandlers(): boolean;
  removeSignalHandlers(): boolean;
  whenClosed(): Promise<void>;
}

export function createNodeAppHost<const TServices extends AppServiceMap = AppServiceMap>(
  options?: NodeAppHostOptions<TServices>
): NodeAppHost<TServices>;

export function listenNodeAppHost<const TServices extends AppServiceMap = AppServiceMap>(
  options?: NodeAppHostOptions<TServices>
): Promise<NodeAppHost<TServices>>;
