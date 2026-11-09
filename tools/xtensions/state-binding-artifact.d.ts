import type { XTensionStateBinding } from './state-binding';
export const XTENSION_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v2';
export interface XTensionHostPresence {
  readonly state: string;
  readonly path: readonly (string | number)[];
}
export type XTensionStateBindingArtifact = {
  readonly schema: 'xtend.xtensions.state-binding-artifact.v1';
  readonly documentId: string;
  readonly bindings: readonly { readonly surface: string; readonly binding: XTensionStateBinding; readonly presence?: never }[];
} | {
  readonly schema: typeof XTENSION_STATE_BINDING_ARTIFACT_SCHEMA;
  readonly documentId: string;
  readonly bindings: readonly {
    readonly surface: string;
    readonly binding: XTensionStateBinding;
    /** Boolean Model path; false removes the host and revokes its lifetime. */
    readonly presence?: XTensionHostPresence;
  }[];
};
/** Validates lowered states, Action inputs, static host templates and optional presence. */
export function validateStateBindingArtifact(input: unknown, program: unknown): XTensionStateBindingArtifact;
