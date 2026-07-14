import type {
  XTendDevApi,
  XTendLoaderBootResult,
  XTendLoaderDiagnosticDetail,
  XTendLoaderPerformanceDetail
} from './xtend-loader.js';

export const DEV_API_SCHEMA: 'xtend.devsurface.dev-api.v1';

export interface XTendClassicDevApiInstallOptions {
  globalTarget?: Window & typeof globalThis;
  getMeasurements?: () => XTendLoaderPerformanceDetail[];
  getDiagnostics?: () => XTendLoaderDiagnosticDetail[];
  getBootState?: () => Record<string, unknown>;
}

export interface XTendClassicDevApiController {
  readonly schema: 'xtend.loader.dev-api-controller.v1';
  readonly api: XTendDevApi;
  readonly installed: boolean;
  readonly preserved: boolean;
  publish(kind: string, detail?: unknown): void;
  complete(bootResult?: XTendLoaderBootResult | null, status?: 'ready' | 'degraded'): void;
}

export function installClassicDevApi(options?: XTendClassicDevApiInstallOptions): XTendClassicDevApiController;
