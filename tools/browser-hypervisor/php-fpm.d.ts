export interface FpmProxyOptions {
  binary: string;
  fixture: string;
  scriptFilename?: string;
  port?: number;
  env?: Record<string, string | undefined>;
  staticAssets?: boolean;
  timeoutMs?: number;
}
export interface FpmProxyHandle {
  url: string;
  dispose(): Promise<void>;
  readonly output: string;
  readonly requestCount: number;
}
export declare function startFpmProxy(options: FpmProxyOptions): Promise<FpmProxyHandle>;
