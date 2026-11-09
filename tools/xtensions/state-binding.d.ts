import type { RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostController } from './runtime-host-controller';
import type { XTensionsSurfaceEvent } from './signal-bridge-contract';
export { XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact, materializeStateBindingArtifact } from './state-binding-artifact';
export type { XTensionStateBindingArtifact, XTensionHostPresence, XTensionBindingTemplate, XTensionRepeatScope, XTensionMaterializedBinding } from './state-binding-artifact';

export const XTENSION_STATE_BINDING_SCHEMA: 'xtend.xtensions.state-binding.v2';
export const XTENSION_STATE_BINDING_API_VERSION: '2.0.0';
/** Structural ports keep the standalone compiler package independent of the RMT runtime. */
export interface XTensionBindingModelReader {
  snapshot(): { readonly states: Readonly<Record<string, unknown>> };
  subscribe(listener: (change: { readonly pending: boolean; readonly next: { readonly states: Readonly<Record<string, unknown>> } }) => void): () => void;
}
export interface XTensionBindingCommandPort {
  apply(operation: { operation: 'dispatch'; command: string; payload: Record<string, unknown> }, metadata?: Record<string, unknown>): unknown;
}
export interface XTensionBindingCommandLifetime {
  readonly signal: AbortSignal;
  isCurrent(): boolean;
}
export interface XTensionBindingCommandDispatcher {
  /** The host must recheck lifetime immediately before committing Model operations. */
  dispatch(command: string, payload: Record<string, unknown>, metadata: Record<string, unknown>, lifetime: XTensionBindingCommandLifetime): unknown | Promise<unknown>;
}
export interface XTensionInstanceAddress {
  readonly documentId: string;
  readonly declarationId: string;
  /** Stable ancestor/item keys, never DOM positions. Numbers and strings are distinct. */
  readonly keys: readonly (string | number)[];
}
export type XTensionValueRule = { readonly nullable?: boolean } & (
  | { readonly type: 'string' | 'number' | 'boolean' | 'json' }
  | { readonly type: 'object'; readonly fields: Readonly<Record<string, XTensionValueRule>> }
  | { readonly type: 'array'; readonly items: XTensionValueRule }
);
export interface XTensionKeySelector { readonly key: { readonly path: readonly (string | number)[]; readonly value: string | number } }
export type XTensionBindingPath = readonly (string | number | XTensionKeySelector)[];
export interface XTensionBindingIntent {
  readonly command: string; readonly payloadSchema: string;
  readonly fields: Readonly<Record<string, XTensionValueRule>>;
}
export interface XTensionLegacyStateBinding {
  readonly schema: 'xtend.xtensions.state-binding.v1';
  readonly address: XTensionInstanceAddress;
  readonly props: Readonly<Record<string, XTensionValueRule & { readonly state: string; readonly path: readonly (string | number)[] }>>;
  readonly intents: Readonly<Record<string, XTensionBindingIntent>>;
}
export interface XTensionKeyedStateBinding {
  readonly schema: typeof XTENSION_STATE_BINDING_SCHEMA;
  readonly address: XTensionInstanceAddress;
  readonly props: Readonly<Record<string, XTensionValueRule & { readonly state: string; readonly path: XTensionBindingPath }>>;
  readonly intents: Readonly<Record<string, XTensionBindingIntent & {
    /** Injected from the trusted address after validating the untrusted event fields. */
    readonly keyFields?: Readonly<Record<string, { readonly index: number; readonly type: 'string' | 'number' | 'json' }>>;
  }>>;
}
export type XTensionStateBinding = XTensionLegacyStateBinding | XTensionKeyedStateBinding;
export interface XTensionBindingIdentity {
  readonly address: XTensionInstanceAddress;
  readonly key: string;
  /** Process-local lifetime token, never persisted or used as a State key. */
  readonly incarnation: number;
}
export interface XTensionBindingDiagnostic {
  readonly operation: string;
  readonly message: string;
  readonly identity: XTensionBindingIdentity;
}
export interface XTensionBindingHostContext {
  readonly identity: XTensionBindingIdentity;
  readonly hostId: string;
  readonly surfaceId: string;
  readonly xtensionId: string;
  readonly events: Readonly<Record<string, string>>;
  /** Trusted callback; stale, suspended and render-time intents are rejected. */
  onEvent(event: XTensionsSurfaceEvent): boolean;
}
export interface XTensionBindingSnapshot {
  readonly identity: XTensionBindingIdentity;
  readonly phase: 'created' | 'mounting' | 'active' | 'suspending' | 'suspended' | 'resuming' | 'disposed' | 'failed';
  readonly desiredRevision: number;
  readonly deliveredRevision: number | null;
  readonly props: Readonly<Record<string, unknown>> | null;
  readonly diagnostics: readonly XTensionBindingDiagnostic[];
}
export interface XTensionBoundInstance {
  readonly identity: XTensionBindingIdentity;
  snapshot(): XTensionBindingSnapshot;
  mount(target?: Element): Promise<XTensionBindingSnapshot>;
  suspend(reason?: string): Promise<XTensionBindingSnapshot>;
  resume(reason?: string): Promise<XTensionBindingSnapshot>;
  /** Drains current deliveries; suspended instances retain their latest desired snapshot. */
  whenIdle(): Promise<XTensionBindingSnapshot>;
  dispose(reason?: string): Promise<unknown>;
}
export function validateStateBinding(input: unknown): XTensionStateBinding;
export function createXTensionStateRegistry(options: {
  modelReader: XTensionBindingModelReader;
  onDiagnostic?(diagnostic: XTensionBindingDiagnostic): void;
} & ({ modelCommandPort: XTensionBindingCommandPort; commandDispatcher?: never } | { commandDispatcher: XTensionBindingCommandDispatcher; modelCommandPort?: never })): {
  readonly apiVersion: typeof XTENSION_STATE_BINDING_API_VERSION;
  bind(definition: XTensionStateBinding, createHost: (context: XTensionBindingHostContext) => RuntimeHostController): XTensionBoundInstance;
  /** Deliver committed props without waiting for the command currently publishing them. */
  flush(): Promise<void>;
  dispose(): Promise<void>;
};
