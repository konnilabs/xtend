export const TAILWIND_TOOLCHAIN_SCHEMA: 'xtend.material.tailwind-toolchain.v1';
export const TAILWIND_COMPILE_REQUEST_SCHEMA: 'xtend.material.tailwind-compile-request.v1';
export const TAILWIND_COMPILE_RESULT_SCHEMA: 'xtend.material.tailwind-compile-result.v1';
export const TAILWIND_VERSION: '4.3.2';
export const DEFAULT_STYLESHEET: string;

export interface TailwindExplicitSource {
  path?: string;
  kind?: string;
  content?: string;
  fingerprint?: string | null;
}

export interface TailwindToolchainInspection {
  schema: typeof TAILWIND_TOOLCHAIN_SCHEMA;
  status: 'ready' | 'blocked' | 'unavailable';
  available: boolean;
  airGapped: true;
  runtimeBoundary: 'build-time-only';
  versions: { adapter: string; node: string | null; tailwindcss: string | null };
  packages: Array<{ name: string; version: string; license: string | null; path: string; integrity: string | null }>;
  networkPolicy: 'forbidden';
  discovery: 'explicit-sources-only';
  preflight: 'disabled';
  cache: 'memory-only';
  tempFiles: false;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
}

export interface TailwindCompileInput {
  css?: string;
  from?: string | null;
  base?: string;
  sourceRoot?: string;
  sources?: TailwindExplicitSource[];
  candidates?: string[];
  minify?: boolean;
  preflight?: 'disabled';
  output?: string | null;
}

export interface TailwindCompileResult {
  schema: typeof TAILWIND_COMPILE_RESULT_SCHEMA;
  status: 'ready';
  cssText: string;
  sourceMap: string | null;
  bytes: number;
  outputFingerprint: string;
  requestFingerprint: string;
  fingerprint: string;
  candidates: string[];
  candidateCount: number;
  sources: Array<{ path: string | null; kind: string; fingerprint: string }>;
  dependencies: string[];
  toolchain: TailwindToolchainInspection;
  airGap: {
    networkAccess: false;
    automaticDiscovery: false;
    sourceRoot: string;
    tempFiles: false;
    cache: 'memory-only';
  };
}

export interface TailwindToolchainApi {
  schema: typeof TAILWIND_TOOLCHAIN_SCHEMA;
  inspect(): TailwindToolchainInspection;
  compile(input?: TailwindCompileInput): Promise<TailwindCompileResult>;
  extractCandidates(content: string): string[];
  dispose(): Promise<{ status: 'disposed'; tempFilesRemoved: 0; cacheEntriesRemoved: 0 }>;
}

export function toolchainInspection(options?: Record<string, unknown>): TailwindToolchainInspection;
export function extractCandidates(content: string): string[];
export function compileTailwindCss(input?: TailwindCompileInput, options?: Record<string, unknown>): Promise<TailwindCompileResult>;
export function createTailwindToolchainApi(options?: Record<string, unknown>): TailwindToolchainApi;
