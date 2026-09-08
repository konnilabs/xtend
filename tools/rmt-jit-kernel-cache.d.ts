export interface RmtJitKernelArtifacts {
  key: string;
  artifacts: Record<string, { ok: boolean; content: string; [key: string]: unknown }>;
  cacheStatus: 'hit' | 'miss' | 'unavailable';
  architectureChecks: number;
  diagnostics: ReadonlyArray<{ code: string; severity: string; message: string }>;
}
export declare function prepareRmtJitKernelCache(options?: { rootDir?: string; cacheDir?: string; version?: string }): Promise<RmtJitKernelArtifacts>;
