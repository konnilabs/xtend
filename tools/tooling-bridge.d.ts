export type XtendToolingBridgeOperation = 'compile' | 'language-diagnostics' | 'maraca-plan' | 'safe-preview';
export interface XtendToolingBridgeEnvelope { schema?: 'xtend.compiler.tooling-bridge.v1'; requestId?: string; operation: XtendToolingBridgeOperation; payload?: Record<string, unknown>; }
export interface XtendToolingBridgeResponse { schema: 'xtend.compiler.tooling-bridge-response.v1'; bridgeSchema: 'xtend.compiler.tooling-bridge.v1'; requestId: string; operation: XtendToolingBridgeOperation; ok: boolean; status: string; diagnostics: ReadonlyArray<Record<string, unknown>>; result: unknown; }
export declare const TOOLING_BRIDGE_SCHEMA: 'xtend.compiler.tooling-bridge.v1';
export declare const TOOLING_BRIDGE_RESPONSE_SCHEMA: 'xtend.compiler.tooling-bridge-response.v1';
export declare function normalizeDiagnostics(value: unknown): ReadonlyArray<Record<string, unknown>>;
export declare function executeToolingBridgeOperation(envelope: XtendToolingBridgeEnvelope, options?: { rootDir?: string }): Promise<XtendToolingBridgeResponse>;
