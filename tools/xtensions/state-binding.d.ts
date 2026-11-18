import type { RuntimeHostController, KernelRuntimeHostController, GraphRuntimeHostController, BudgetRuntimeHostController, NegotiatedRuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostController, KernelRuntimeHostController, GraphRuntimeHostController, BudgetRuntimeHostController, NegotiatedRuntimeHostController } from './runtime-host-controller';
import type { XTensionsSurfaceEvent } from './signal-bridge-contract';
export { PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact, materializeStateBindingArtifact } from './state-binding-artifact';
export type { XTensionNativeStateBindingArtifact, XTensionProjectionStateBindingArtifact, XTensionStateBindingArtifact, XTensionHostPresence, XTensionBindingTemplate, XTensionRepeatScope, XTensionMaterializedBinding } from './state-binding-artifact';

export const XTENSION_STATE_BINDING_SCHEMA: 'xtend.xtensions.state-binding.v2';
export const XTENSION_STATE_BINDING_API_VERSION: '2.4.0';
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
export function validateStateBinding(input: XTensionProjectionStateBinding): XTensionProjectionStateBinding;
export function validateStateBinding(input: unknown): XTensionStateBinding;
export function createXTensionStateRegistry(options: {
  modelReader: XTensionBindingModelReader;
  onDiagnostic?(diagnostic: XTensionBindingDiagnostic): void;
} & ({ modelCommandPort: XTensionBindingCommandPort; commandDispatcher?: never } | { commandDispatcher: XTensionBindingCommandDispatcher; modelCommandPort?: never })): {
  readonly apiVersion: typeof XTENSION_STATE_BINDING_API_VERSION;
  bind(definition: XTensionStateBinding, createHost: (context: XTensionBindingHostContext) => RuntimeHostController | KernelRuntimeHostController | GraphRuntimeHostController | BudgetRuntimeHostController | NegotiatedRuntimeHostController): XTensionBoundInstance;
  /** Deliver committed props without waiting for the command currently publishing them. */
  flush(): Promise<void>;
  dispose(): Promise<void>;
};

export const XTENSION_RESUME_STATE_BINDING_API_VERSION: '3.0.0';
export interface XTensionResumeBoundInstance extends XTensionBoundInstance {
  adopt(target?: Element): Promise<XTensionBindingSnapshot>;
  replay(event: { type: string; payload: Readonly<Record<string, unknown>> }): unknown;
  getSSRReport(): import('./runtime-host-controller').FrameworkSSRResult | null;
}
export function createXTensionResumeStateRegistry(options: Parameters<typeof createXTensionStateRegistry>[0]): {
  readonly apiVersion: '3.0.0';
  bind(definition: XTensionStateBinding, createHost: (context: XTensionBindingHostContext) => import('./runtime-host-controller').SSRRuntimeHostController): XTensionResumeBoundInstance;
  flush(): Promise<void>;
  dispose(): Promise<void>;
};

/** Explicit Source4 projection contract; legacy v1/v2 bindings remain unchanged. */
export const PROJECTION_BINDING_SCHEMA: 'xtend.xtensions.state-binding.v3';
export const XTENSION_PROJECTION_STATE_BINDING_API_VERSION: '3.0.0';
export type XTensionProjectionPath = readonly (string | number | XTensionKeySelector | { readonly repeat: number })[];
export type XTensionProjection =
  | { readonly kind: 'literal'; readonly value: unknown }
  | { readonly kind: 'path'; readonly root: 'state' | 'selector'; readonly symbol: string; readonly path: XTensionProjectionPath }
  | { readonly kind: 'object'; readonly fields: Readonly<Record<string, XTensionProjection>> }
  | { readonly kind: 'array'; readonly items: readonly XTensionProjection[] }
  | { readonly kind: 'conditional'; readonly test: XTensionProjection; readonly then: XTensionProjection; readonly else: XTensionProjection }
  | { readonly kind: 'unary'; readonly op: '!' | '-' | '+'; readonly value: XTensionProjection }
  | { readonly kind: 'binary'; readonly op: '===' | '!==' | '<' | '<=' | '>' | '>=' | '&&' | '||' | '+' | '-' | '*' | '/' | '%'; readonly left: XTensionProjection; readonly right: XTensionProjection };
export interface XTensionProjectionStateBinding {
  readonly schema: typeof PROJECTION_BINDING_SCHEMA;
  readonly address: XTensionInstanceAddress;
  readonly props: Readonly<Record<string, XTensionValueRule & { readonly projection: XTensionProjection }>>;
  readonly intents: XTensionKeyedStateBinding['intents'];
}
export function createXTensionProjectionStateRegistry(options: Parameters<typeof createXTensionStateRegistry>[0]): Omit<ReturnType<typeof createXTensionStateRegistry>, 'apiVersion' | 'bind'> & {
  readonly apiVersion: '3.0.0';
  bind(definition: XTensionProjectionStateBinding, factory: Parameters<ReturnType<typeof createXTensionStateRegistry>['bind']>[1]): XTensionBoundInstance;
};

/** Explicit Source5 Native View capability; Binding3 itself remains unchanged. */
export const XTENSION_NATIVE_STATE_BINDING_API_VERSION: '4.0.0';
export function createXTensionNativeStateRegistry(options: Parameters<typeof createXTensionStateRegistry>[0]): Omit<ReturnType<typeof createXTensionProjectionStateRegistry>, 'apiVersion'> & {
  readonly apiVersion: '4.0.0';
};
