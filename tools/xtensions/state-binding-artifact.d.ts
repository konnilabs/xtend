import type { XTensionStateBinding, XTensionLegacyStateBinding, XTensionKeyedStateBinding, XTensionValueRule, XTensionKeySelector, XTensionBindingPath } from './state-binding';
export const XTENSION_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v3';
export interface XTensionHostPresence { readonly state: string; readonly path: readonly (string | number)[] }
export type XTensionTemplatePath = readonly (string | number | XTensionKeySelector | { readonly repeat: number })[];
export type XTensionBindingTemplate = Omit<XTensionKeyedStateBinding, 'props'> & {
  readonly props: Readonly<Record<string, XTensionValueRule & { readonly state: string; readonly path: XTensionTemplatePath }>>;
};
export type XTensionRepeatScope = { readonly path: readonly (string | number)[]; readonly key: readonly (string | number)[] };
export type XTensionStateBindingArtifact = {
  readonly schema: 'xtend.xtensions.state-binding-artifact.v1'; readonly documentId: string;
  readonly bindings: readonly { readonly surface: string; readonly binding: XTensionLegacyStateBinding; readonly presence?: never; readonly repeat?: never }[];
} | {
  readonly schema: 'xtend.xtensions.state-binding-artifact.v2'; readonly documentId: string;
  readonly bindings: readonly { readonly surface: string; readonly binding: XTensionLegacyStateBinding; readonly presence?: XTensionHostPresence; readonly repeat?: never }[];
} | {
  readonly schema: typeof XTENSION_STATE_BINDING_ARTIFACT_SCHEMA; readonly documentId: string;
  readonly bindings: readonly ({
    readonly surface: string; readonly binding: XTensionStateBinding; readonly repeat?: never;
    readonly presence?: { readonly state: string; readonly path: XTensionBindingPath };
  } | {
    readonly surface: string; readonly binding: XTensionBindingTemplate;
    readonly presence?: { readonly state: string; readonly path: XTensionTemplatePath };
    /** First source is absolute; following paths are relative to the parent item. */
    readonly repeat: readonly [XTensionRepeatScope & { readonly state: string }, ...XTensionRepeatScope[]];
  })[];
};
export interface XTensionMaterializedBinding {
  readonly surface: string; readonly hostSurface: string; readonly binding: XTensionStateBinding;
}
export function validateStateBindingArtifact(input: XTensionProjectionStateBindingArtifact, program: unknown): XTensionProjectionStateBindingArtifact;
export function validateLifecycleStateBindingArtifact(input: XTensionLifecycleStateBindingArtifact, program: unknown): XTensionLifecycleStateBindingArtifact;
export function validateStateBindingArtifact(input: XTensionNativeStateBindingArtifact, program: unknown): XTensionNativeStateBindingArtifact;
export function validateStateBindingArtifact(input: unknown, program: unknown): XTensionStateBindingArtifact;
/** Requires an artifact returned by this runtime's validator. Revalidate after serialization. */
export function materializeStateBindingArtifact(artifact: XTensionStateBindingArtifact, snapshot: { readonly states: Readonly<Record<string, unknown>> }): readonly XTensionMaterializedBinding[];

export const PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v4';
export interface XTensionProjectionStateBindingArtifact {
  readonly schema: typeof PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA;
  readonly documentId: string;
  readonly bindings: readonly {
    readonly surface: string;
    readonly binding: import('./state-binding').XTensionProjectionStateBinding;
    readonly repeat?: readonly [XTensionRepeatScope & { readonly state: string }, ...XTensionRepeatScope[]];
    readonly presence?: { readonly state: string; readonly path: XTensionTemplatePath };
  }[];
}
export function materializeStateBindingArtifact(artifact: XTensionProjectionStateBindingArtifact, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }): readonly {
  readonly surface: string; readonly hostSurface: string; readonly binding: import('./state-binding').XTensionProjectionStateBinding;
}[];

/** Source5 is paired only with app-orchestration.v3; Source4 remains paired with v4/Program2. */
export const NATIVE_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v5';
export interface XTensionNativeStateBindingArtifact extends Omit<XTensionProjectionStateBindingArtifact, 'schema'> {
  readonly schema: typeof NATIVE_STATE_BINDING_ARTIFACT_SCHEMA;
}
export function materializeStateBindingArtifact(artifact: XTensionNativeStateBindingArtifact, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }): readonly {
  readonly surface: string; readonly hostSurface: string; readonly binding: import('./state-binding').XTensionProjectionStateBinding;
}[];

/** Source6 is paired exclusively with Program4; Binding3 itself is retained. */
export const LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v6';
export interface XTensionLifecycleStateBindingArtifact extends Omit<XTensionProjectionStateBindingArtifact, 'schema'> {
  readonly schema: typeof LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA;
}
export function materializeStateBindingArtifact(artifact: XTensionLifecycleStateBindingArtifact, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }, admission?: Readonly<Record<string, boolean>>): readonly {
  readonly surface: string; readonly hostSurface: string; readonly binding: import('./state-binding').XTensionProjectionStateBinding;
}[];

/** Source7 owns concrete native Surface instances; its old materializer remains closed. */
export const ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v7';
export const MANAGED_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v8';
export interface XTensionManagedStateBindingArtifact extends Omit<XTensionOrchestratedStateBindingArtifact, 'schema'> { readonly schema: typeof MANAGED_STATE_BINDING_ARTIFACT_SCHEMA }
export interface XTensionOrchestratedStateBindingArtifact extends Omit<XTensionProjectionStateBindingArtifact, 'schema' | 'bindings'> {
  readonly schema: typeof ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA;
  readonly bindings: readonly (XTensionProjectionStateBindingArtifact['bindings'][number] & { readonly ownerSurface: string })[];
}
