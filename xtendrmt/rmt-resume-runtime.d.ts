export const RMT_RESUME_RUNTIME_SCHEMA: 'xtend.rmt.resume-runtime.v1';
export const RMT_RESUME_ENVELOPE_SCHEMA: 'xtend.rmt.ssr-resume-envelope.v1';
export const RMT_RESUME_RESULT_SCHEMA: 'xtend.rmt.resume-result.v1';
export const RMT_RESUME_INTENT_SCHEMA: 'xtend.rmt.resume-intent.v1';
export const RMT_RESUME_ADAPTER_SCHEMA: 'xtend.xtensions.resume-adapter.v1';
export const RMT_RESUME_MAX_INTENTS: 128;

export interface RmtResumeIntegrity {
  schema?: string;
  algorithm: string;
  encoding?: 'base64url' | 'hex';
  keyId: string;
  digest: string;
  signature: string;
}

export interface RmtResumeEnvelope {
  schema: typeof RMT_RESUME_ENVELOPE_SCHEMA;
  version: 1;
  executionMode: 'server_prerender_resume';
  requestId: string;
  rootId: string;
  templateId: string;
  generation: string;
  issuedAt: string;
  expiresAt: string;
  snapshot: { schema: string; state: Record<string, unknown>; surfaces: Record<string, unknown> };
  eventReplay: { schema: string; mode: 'intent_queue'; generation: string; maxEntries: 128; replayExactlyOnce: true };
  xtensions: Array<Record<string, unknown>>;
  manifests: Array<Record<string, unknown>>;
  dom: {
    schema?: 'xtend.rmt.resume-dom-digest.v1';
    algorithm: 'SHA-256';
    encoding?: 'base64url' | 'hex';
    canonicalization?: 'resume-node-manifest.v1';
    nodeCount?: number;
    digest: string;
  };
  fallbackMode: 'server_prerender_hydrate';
  hydrationSchema: string;
  integrity: RmtResumeIntegrity;
}

export interface RmtResumeIntent {
  schema: typeof RMT_RESUME_INTENT_SCHEMA;
  sequence: number;
  generation: string;
  eventId: string;
  action: string;
  surfaceId: string;
  eventType: string;
  payload: Record<string, unknown>;
  capturedAt: number;
}

export interface RmtResumeResult {
  schema: typeof RMT_RESUME_RESULT_SCHEMA;
  ok: boolean;
  status: 'resumed' | 'fallback_hydrated' | 'rejected';
  verified: boolean;
  generation?: string;
  rootId?: string;
  rootPreserved: boolean;
  restoredStateCount?: number;
  adoptedXtensionCount?: number;
  replayedIntentCount?: number;
  duplicateIgnored?: boolean;
  fallbackAttempted: boolean;
  fallbackHydrated: boolean;
  reasons: string[];
  [key: string]: unknown;
}

export type RmtResumeVerifier = (
  canonicalPayload: string,
  integrity: RmtResumeIntegrity,
  envelope: RmtResumeEnvelope
) => boolean | { ok?: boolean; verified?: boolean; reason?: string } | Promise<boolean | { ok?: boolean; verified?: boolean; reason?: string }>;

export type RmtResumeDomVerifier = (
  canonicalDom: string,
  expectedDigest: string,
  dom: RmtResumeEnvelope['dom'],
  envelope: RmtResumeEnvelope
) => boolean | { ok?: boolean; verified?: boolean; reason?: string } | Promise<boolean | { ok?: boolean; verified?: boolean; reason?: string }>;

export type RmtResumeDigestVerifier = (
  canonicalPayload: string,
  expectedDigest: string,
  integrity: RmtResumeIntegrity
) => boolean | { ok?: boolean; verified?: boolean; reason?: string } | Promise<boolean | { ok?: boolean; verified?: boolean; reason?: string }>;

export interface RmtResumeRuntimeOptions {
  root?: Element;
  rootId?: string;
  document?: Document;
  generation?: string;
  now?: () => number;
  verify?: RmtResumeVerifier;
  verifyResumeEnvelope?: RmtResumeVerifier;
  verifyEnvelopeDigest?: RmtResumeDigestVerifier;
  verifyDomDigest?: RmtResumeDomVerifier;
  restoreState?: (state: Record<string, unknown>, snapshot: Record<string, unknown>, envelope: RmtResumeEnvelope) => unknown;
  stateRuntime?: Record<string, unknown>;
  adopters?: Map<string, unknown> | Record<string, unknown> | unknown[];
  adoptRoot?: (root: Element, envelope: RmtResumeEnvelope, response: Record<string, unknown>) => unknown;
  replayIntent?: (intent: RmtResumeIntent, envelope: RmtResumeEnvelope) => unknown;
  hydrateResponse?: (response: Record<string, unknown>, request: Record<string, unknown>, options: Record<string, unknown>) => unknown;
  publishDiagnostic?: (diagnostic: Record<string, unknown>) => unknown;
  [key: string]: unknown;
}

export interface RmtResumeRuntime {
  schema: typeof RMT_RESUME_RUNTIME_SCHEMA;
  captureIntent(input?: Record<string, unknown>): RmtResumeIntent | null;
  installPrebootCapture(root: Element, events?: Array<Record<string, unknown>>, options?: Record<string, unknown>): { status: string; generation?: string; snapshot(): RmtResumeIntent[]; dispose(): void };
  resumeResponse(response?: Record<string, unknown>, request?: Record<string, unknown>, options?: RmtResumeRuntimeOptions): Promise<RmtResumeResult>;
  resumeTemplate(request?: Record<string, unknown>, options?: RmtResumeRuntimeOptions): Promise<RmtResumeResult>;
  listDiagnostics(): Array<Record<string, unknown>>;
  listHistory(): RmtResumeResult[];
  snapshot(): Record<string, unknown>;
}

export function canonicalizeRmtResumePayload(value: unknown): string;
export function createRmtResumeRuntime(options?: RmtResumeRuntimeOptions): RmtResumeRuntime;
export function installRmtPrebootIntentCapture(root: Element, events?: Array<Record<string, unknown>>, options?: RmtResumeRuntimeOptions): ReturnType<RmtResumeRuntime['installPrebootCapture']>;
export function resumeResponse(response?: Record<string, unknown>, request?: Record<string, unknown>, options?: RmtResumeRuntimeOptions): Promise<RmtResumeResult>;
export function resumeTemplate(request?: Record<string, unknown>, options?: RmtResumeRuntimeOptions): Promise<RmtResumeResult>;

declare const api: {
  RMT_RESUME_RUNTIME_SCHEMA: typeof RMT_RESUME_RUNTIME_SCHEMA;
  RMT_RESUME_ENVELOPE_SCHEMA: typeof RMT_RESUME_ENVELOPE_SCHEMA;
  RMT_RESUME_RESULT_SCHEMA: typeof RMT_RESUME_RESULT_SCHEMA;
  RMT_RESUME_INTENT_SCHEMA: typeof RMT_RESUME_INTENT_SCHEMA;
  RMT_RESUME_ADAPTER_SCHEMA: typeof RMT_RESUME_ADAPTER_SCHEMA;
  RMT_RESUME_MAX_INTENTS: typeof RMT_RESUME_MAX_INTENTS;
  canonicalizeRmtResumePayload: typeof canonicalizeRmtResumePayload;
  createRmtResumeRuntime: typeof createRmtResumeRuntime;
  installRmtPrebootIntentCapture: typeof installRmtPrebootIntentCapture;
  resumeResponse: typeof resumeResponse;
  resumeTemplate: typeof resumeTemplate;
};

export default api;
