import type { XTensionStateBinding } from './state-binding';
export const XTENSION_STATE_BINDING_ARTIFACT_SCHEMA: 'xtend.xtensions.state-binding-artifact.v1';
export interface XTensionStateBindingArtifact {
  readonly schema: typeof XTENSION_STATE_BINDING_ARTIFACT_SCHEMA;
  readonly documentId: string;
  readonly bindings: readonly { readonly surface: string; readonly binding: XTensionStateBinding }[];
}
/** Validates against the lowered states, Action inputs and static render hosts. */
export function validateStateBindingArtifact(input: unknown, program: unknown): XTensionStateBindingArtifact;
