export interface RmtSafePreviewDiagnostic { schema: string; code: string; severity: 'warning' | 'error'; message: string; details: Record<string, unknown>; }
export interface RmtSafePreviewResult { readonly schema: 'xtend.rmt.safe-preview-projector.v1'; readonly ok: boolean; readonly descriptor: Record<string, unknown>; readonly diagnostics: RmtSafePreviewDiagnostic[]; readonly metrics: { nodes: number; textBytes: number }; }
export interface RmtSafePreviewProjector { readonly schema: 'xtend.rmt.safe-preview-projector.v1'; project(coreDocument: Record<string, unknown>, options?: { descriptor?: Record<string, unknown>; baseUrl?: string }): RmtSafePreviewResult; snapshot(): Readonly<Record<string, unknown>>; }
export declare const RMT_SAFE_PREVIEW_SCHEMA: 'xtend.rmt.safe-preview-projector.v1';
export declare function createRmtSafePreviewProjector(options?: { componentRegistry?: unknown; allowedElements?: string[]; allowedProtocols?: string[]; limits?: { maxDepth?: number; maxNodes?: number; maxTextBytes?: number; maxAttributes?: number } }): RmtSafePreviewProjector;
declare const api: Readonly<{ RMT_SAFE_PREVIEW_SCHEMA: typeof RMT_SAFE_PREVIEW_SCHEMA; createRmtSafePreviewProjector: typeof createRmtSafePreviewProjector }>;
export default api;
