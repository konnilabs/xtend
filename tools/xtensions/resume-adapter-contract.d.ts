export declare const XTENSIONS_RESUME_ADAPTER_SCHEMA: 'xtend.xtensions.resume-adapter.v1';
export declare const XTENSIONS_RESUME_MANIFEST_SCHEMA: 'xtend.xtensions.resume-manifest.v1';
export declare const XTENSIONS_RESUME_RESULT_SCHEMA: 'xtend.xtensions.resume-result.v1';
export type XTensionResumeAdoptionStrategy = 'dom_hydrate' | 'host_activate';
export type XTensionResumeStatus = 'resumed' | 'fallback_hydrated' | 'rejected';
export interface XTensionResumeManifest {
  schema: typeof XTENSIONS_RESUME_MANIFEST_SCHEMA;
  id: string;
  clientEntry: string;
  serverEntry: string;
  bundleIntegrity: string;
  snapshotSchema: string;
  adoptionStrategy: XTensionResumeAdoptionStrategy;
  ok: boolean;
  diagnostics: Array<Record<string, unknown>>;
}
export interface XTensionResumeContext {
  schema?: typeof XTENSIONS_RESUME_ADAPTER_SCHEMA;
  generation?: string;
  rootId?: string;
  signal?: AbortSignal;
  [key: string]: unknown;
}
export interface XTensionResumeResult {
  schema: typeof XTENSIONS_RESUME_RESULT_SCHEMA;
  ok: boolean;
  status: XTensionResumeStatus;
  xtensionId: string | null;
  adoptionStrategy: XTensionResumeAdoptionStrategy | null;
  generation: string | null;
  nodeIdentityPreserved: boolean;
  diagnostics: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
}
export interface XTensionResumeController<Props = Record<string, unknown>> {
  adopt(target: object, props: Props, resumeContext: XTensionResumeContext): Promise<Record<string, unknown>> | Record<string, unknown>;
}
export declare function normalizeXTensionResumeManifest(input?: Record<string, unknown>): XTensionResumeManifest;
export declare function createXTensionResumeAdapter<Props = Record<string, unknown>>(options: {
  manifest: Record<string, unknown>;
  controller: XTensionResumeController<Props>;
  hydrate?: (target: object, props: Props, resumeContext: XTensionResumeContext) => Promise<Record<string, unknown>> | Record<string, unknown>;
}): {
  schema: typeof XTENSIONS_RESUME_ADAPTER_SCHEMA;
  manifest: XTensionResumeManifest;
  adopt(target: object, props?: Props, resumeContext?: XTensionResumeContext): Promise<XTensionResumeResult>;
  fallbackHydrate(target: object, props?: Props, resumeContext?: XTensionResumeContext): Promise<XTensionResumeResult>;
};
