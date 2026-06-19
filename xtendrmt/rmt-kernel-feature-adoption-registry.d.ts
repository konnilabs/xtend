export const RMT_KERNEL_FEATURE_ADOPTION_SCHEMA: 'xtend.rmt-kernel-feature-adoption.v1';
export const RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA: 'xtend.rmt-kernel-feature-adoption-report.v1';
export const RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA: 'xtend.rmt-kernel-feature-adoption-diagnostic.v1';

export interface RmtKernelFeatureAdoptionCapability {
  schema: typeof RMT_KERNEL_FEATURE_ADOPTION_SCHEMA;
  key: string;
  label: string;
  category: string;
  supported: boolean;
  active: boolean;
  status: 'active' | 'available' | 'degraded' | 'blocked' | string;
  runtimeRequired: boolean;
  prodDefault: string;
  diagnosticsRequired: boolean;
  strictFallbackAllowed: boolean;
  requiredFactories: string[];
  missingFactories: string[];
  diagnostics: RmtKernelFeatureAdoptionDiagnostic[];
}

export interface RmtKernelFeatureAdoptionDiagnostic {
  schema: typeof RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA;
  code: string;
  severity: 'info' | 'warning' | 'error' | string;
  message: string;
  capabilityKey?: string;
  requiredFactories?: string[];
  missingFactories?: string[];
  degraded?: boolean;
  [key: string]: unknown;
}

export interface RmtKernelFeatureAdoptionReport {
  schema: typeof RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA;
  contract: typeof RMT_KERNEL_FEATURE_ADOPTION_SCHEMA;
  status: 'ready' | 'degraded' | 'blocked' | 'unavailable' | string;
  ok: boolean;
  capabilityKeys: string[];
  capabilityCount: number;
  supportedCount: number;
  activeCount: number;
  degradedCount: number;
  blockedCount: number;
  capabilities: RmtKernelFeatureAdoptionCapability[];
  diagnostics: RmtKernelFeatureAdoptionDiagnostic[];
}

export interface RmtKernelFeatureAdoptionRegistry {
  schema: typeof RMT_KERNEL_FEATURE_ADOPTION_SCHEMA;
  reportSchema: typeof RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA;
  listCapabilityKeys(): string[];
  listCapabilities(): RmtKernelFeatureAdoptionCapability[];
  getCapability(key: string): RmtKernelFeatureAdoptionCapability | null;
  snapshot(): RmtKernelFeatureAdoptionReport;
}

export const RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS: readonly string[];
export const RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES: readonly Readonly<{
  key: string;
  label: string;
  category: string;
  requiredFactories: readonly string[];
  runtimeRequired: boolean;
  prodDefault: string;
  diagnosticsRequired: boolean;
  strictFallbackAllowed: boolean;
}>[];

export function createRmtKernelFeatureAdoptionRegistry(options?: {
  manifest?: Record<string, unknown> | null;
  kernelApi?: Record<string, unknown> | null;
  runtimeApi?: Record<string, unknown> | null;
  availableFactories?: string[];
  supportedCapabilities?: Record<string, boolean>;
  activeCapabilities?: Record<string, boolean>;
  planFeatureAdoption?: RmtKernelFeatureAdoptionReport | null;
  runtimeModules?: string[];
}): RmtKernelFeatureAdoptionRegistry;
