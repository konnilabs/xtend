export declare const DEFAULT_BASE_PATH: "/api/xtend/services";
export declare const DEFAULT_CLIENT_ENTRY: "src/services.ts";
export declare const DEFAULT_SERVER_ENTRY: "src/server-services.ts";
export declare const DEFAULT_PHP_ENTRY: "server/server-services.php";
export declare const MARACA_APP_SERVICE_DEMANDS_SCHEMA: "xtend.maraca.app-service-demands.v1";
export declare const MARACA_APP_SERVICE_MANIFEST_SCHEMA: "xtend.maraca.app-services-manifest.v1";
export declare const MARACA_SERVICE_BUILD_PROVIDER_SCHEMA: "xtend.maraca.service-build-provider.v1";
export declare const MARACA_SERVICE_BUILD_PLAN_SCHEMA: "xtend.maraca.service-build-plan.v1";
export declare const MARACA_SERVICE_BUILD_REPORT_SCHEMA: "xtend.maraca.service-build-report.v1";

export type MaracaServiceTarget = "browser" | "node" | "php";
export interface MaracaServicesConfig {
  clientEntry?: string;
  serverEntry?: string;
  phpEntry?: string;
  targets?: MaracaServiceTarget[];
  strict?: boolean;
  budgets?: {
    clientBytes?: number;
    serverBytes?: number;
  };
  clientBudgetBytes?: number;
  serverBudgetBytes?: number;
  transport?: {
    kind?: "http-ndjson";
    basePath?: string;
    credentials?: RequestCredentials;
  };
}

export interface MaracaServiceDiagnostic {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  details?: Record<string, unknown>;
}

export interface MaracaServiceToolchain {
  available: boolean;
  version: string | null;
  resolved: string | null;
}

export interface MaracaAppServiceManifestEntry {
  id: string;
  dataSource: string;
  mode: "invoke" | "stream";
  kind: "query" | "command" | "stream";
  target: string;
  concurrency: string;
  contract: unknown;
  actions: Array<{
    id: string;
    mode: "invoke" | "stream";
    inputs: Array<{ name: string; type: string }>;
  }>;
  implementations: { browser: boolean; node: boolean; php: boolean };
}

export interface MaracaAppServiceManifest {
  schema: typeof MARACA_APP_SERVICE_MANIFEST_SCHEMA;
  sourceDocument: string | { id: string; namespace: string } | null;
  targets: MaracaServiceTarget[];
  transport: Record<string, unknown> | null;
  services: MaracaAppServiceManifestEntry[];
  fingerprint: string;
}

export interface MaracaServiceBuildPlan {
  schema: typeof MARACA_SERVICE_BUILD_PLAN_SCHEMA;
  enabled: boolean;
  ok: boolean;
  status: string;
  strict: boolean;
  targets: MaracaServiceTarget[];
  budgets?: { clientBytes: number | null; serverBytes: number | null };
  manifest: MaracaAppServiceManifest | null;
  toolchain: MaracaServiceToolchain;
  diagnostics: MaracaServiceDiagnostic[];
  outputs: Record<string, string>;
  [key: string]: unknown;
}

export interface MaracaServiceBuildReport {
  schema: typeof MARACA_SERVICE_BUILD_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  files: string[];
  diagnostics: MaracaServiceDiagnostic[];
  manifest?: MaracaAppServiceManifest | null;
  [key: string]: unknown;
}

export interface MaracaServiceBuildProvider {
  readonly schema: typeof MARACA_SERVICE_BUILD_PROVIDER_SCHEMA;
  readonly name: "typescript";
  inspect(input?: Record<string, unknown>): MaracaServiceBuildPlan;
  plan(input?: Record<string, unknown>): MaracaServiceBuildPlan;
  build(input?: Record<string, unknown>): Promise<MaracaServiceBuildReport>;
  report(): MaracaServiceBuildReport;
  dispose(): void;
  createRollupPlugin(plan?: MaracaServiceBuildPlan, target?: "browser" | "server"): object;
}

export declare function normalizeServiceBuildOptions(
  services: false | true | MaracaServicesConfig | undefined,
  options?: { rootDir?: string }
): Record<string, unknown>;
export declare function createMaracaServiceBuildPlan(
  input?: Record<string, unknown>,
  options?: Record<string, unknown>
): MaracaServiceBuildPlan;
export declare function createTypeScriptRollupPlugin(
  plan: MaracaServiceBuildPlan,
  options?: { target?: "browser" | "server" }
): object;
export declare function createTypeScriptServiceBuildProvider(options?: Record<string, unknown>): MaracaServiceBuildProvider;
export declare function buildMaracaServiceArtifacts(
  plan: MaracaServiceBuildPlan,
  options?: { rollupModule?: { rollup(options: object): Promise<object> } }
): Promise<MaracaServiceBuildReport>;
export declare function typecheckServiceEntries(plan: MaracaServiceBuildPlan): MaracaServiceDiagnostic[];
export declare function writeServiceArtifacts(plan: MaracaServiceBuildPlan): string[];
