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
export function validateStateBindingArtifact(input: unknown, program: unknown): XTensionStateBindingArtifact;
/** Requires an artifact returned by this runtime's validator. Revalidate after serialization. */
export function materializeStateBindingArtifact(artifact: XTensionStateBindingArtifact, snapshot: { readonly states: Readonly<Record<string, unknown>> }): readonly XTensionMaterializedBinding[];
