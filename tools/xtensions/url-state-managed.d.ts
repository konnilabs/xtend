import type { PolicyV2, ProjectionURLStateContract, ProjectionURLStateRuntime } from './url-state';
import type { XTensionManagedStateBindingArtifact } from './state-binding-managed';
export declare const MANAGED_URL_STATE_API_VERSION: '6.0.0';
export interface ManagedURLStateContract extends Omit<ProjectionURLStateContract, 'apiVersion'> { readonly apiVersion: typeof MANAGED_URL_STATE_API_VERSION }
export interface ManagedURLStateRuntime extends Omit<ProjectionURLStateRuntime, 'API_VERSION' | 'createURLStateContract'> {
  readonly API_VERSION: typeof MANAGED_URL_STATE_API_VERSION;
  createURLStateContract(policy: PolicyV2, inputs: { program: unknown; bindings: XTensionManagedStateBindingArtifact }): ManagedURLStateContract;
}
export declare function createManagedURLStateContract(policy: PolicyV2, inputs: { program: unknown; bindings: XTensionManagedStateBindingArtifact }): ManagedURLStateContract;
export declare const MANAGED_URL_STATE_RUNTIME: Readonly<ManagedURLStateRuntime>;
