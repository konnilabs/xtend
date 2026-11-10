import type {
  HostCapabilityRequirements, KernelRuntimeHostOptions, RuntimeHostOptions, GraphRuntimeHostOptions,
  WorkBudgetPolicy, NegotiatedRuntimeHostOptions, NegotiatedRuntimeHostController
} from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import type { XTensionBindingHostContext, XTensionStateBindingArtifact } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import type { MaracaBuildPlan } from './index';
export const XTENSION_COMPOSITION_API_VERSION: '2.0.0';
export type XTensionCompositionProvider = {
  readonly id: string;
  readonly version: string;
  readonly entry: { readonly module: string; readonly exportName: string };
  readonly integrity: { readonly sha256: string };
} & (
  { readonly framework: 'react'; readonly peers: { readonly react: string; readonly 'react-dom': string } } |
  { readonly framework: 'vue'; readonly peers: { readonly vue: string } }
);
export interface XTensionCompositionManifest {
  readonly schema: 'xtend.maraca.xtension-composition-manifest.v1';
  readonly providers: readonly XTensionCompositionProvider[];
  readonly hosts: readonly {
    readonly declarationId: string; readonly providerId: string; readonly ownerSurface: string;
    /** Requests only. These never grant host authority. */
    readonly capabilityRequirements: HostCapabilityRequirements;
  }[];
}
export interface XTensionCompositionArtifact {
  readonly schema: 'xtend.maraca.xtension-composition-artifact.v1';
  readonly apiVersion: '1.0.0';
  readonly plan: { readonly schema: 'xtend.maraca.build-plan.v4'; readonly sourceHash: string; readonly program: unknown; readonly bindings: XTensionStateBindingArtifact };
  readonly manifest: XTensionCompositionManifest;
  readonly providers: readonly { readonly id: string; readonly sha256: string; readonly fileName: string }[];
  readonly entryFile: string;
  readonly runtimeExecutionVerified: false;
}
export interface XTensionCompositionBindingRuntime {
  readonly XTENSION_STATE_BINDING_API_VERSION: '2.4.0';
  validateStateBindingArtifact(input: unknown, program: unknown): XTensionStateBindingArtifact;
}
export interface XTensionCompositionGrants {
  readonly lifecycle?: KernelRuntimeHostOptions['kernelWork']['lifecycle'];
  readonly work?: KernelRuntimeHostOptions['kernelWork']['work'];
  readonly allowedResources?: readonly string[];
  readonly workBudget?: WorkBudgetPolicy;
  readonly authorize?: NonNullable<RuntimeHostOptions['policy']>['authorize'];
  readonly validateProps?: NonNullable<RuntimeHostOptions['policy']>['validateProps'];
}
export interface XTensionCompositionAdapter {
  createReactKernelRuntimeAdapter?(options: NegotiatedRuntimeHostOptions): NegotiatedRuntimeHostController;
  createVueKernelRuntimeAdapter?(options: NegotiatedRuntimeHostOptions): NegotiatedRuntimeHostController;
  normalizeReactPeers?(peers: any): any;
  normalizeVuePeers?(peers: any): any;
}
export interface XTensionHostCompositionOptions {
  readonly artifact: XTensionCompositionArtifact;
  readonly plan: MaracaBuildPlan;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime;
  /** Trusted namespaces from the generated companion. JSON hashes are not runtime byte proofs. */
  readonly providers: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly adapters: { readonly react?: XTensionCompositionAdapter; readonly vue?: XTensionCompositionAdapter };
  loadPeers(context: Readonly<{ provider: XTensionCompositionProvider; signal: AbortSignal }>): unknown | Promise<unknown>;
  readonly fabric: GraphRuntimeHostOptions['fabric'];
  readonly kernelWork: Pick<GraphRuntimeHostOptions['kernelWork'], 'scheduler' | 'rootId'>;
  readonly resourceGraph: Omit<GraphRuntimeHostOptions['resourceGraph'], 'surfaceId'>;
  readonly grants: Readonly<Record<string, XTensionCompositionGrants>>;
}
export type XTensionCompositionHostContext = XTensionBindingHostContext & {
  readonly container: Element; readonly surface: string;
  readonly binding?: { readonly address: XTensionBindingHostContext['identity']['address'] };
};
/** Produces API-6 hosts with native Kernel/Fabric/Surface ownership for each registry incarnation. */
export function createMaracaXTensionHostFactory(options: XTensionHostCompositionOptions): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;

/** A04.2 adds v5 compiled-plan identity; the complete v1 artifact remains above. */
export interface IntegratedXTensionCompositionArtifact extends Omit<XTensionCompositionArtifact, 'schema' | 'apiVersion' | 'plan'> {
  readonly schema: 'xtend.maraca.xtension-composition-artifact.v2'; readonly apiVersion: '2.0.0';
  readonly plan: Omit<XTensionCompositionArtifact['plan'], 'schema'> & { readonly schema: 'xtend.maraca.build-plan.v5'; readonly compositionManifest: XTensionCompositionManifest };
}
export interface IntegratedXTensionHostCompositionOptions extends Omit<XTensionHostCompositionOptions, 'artifact' | 'plan'> {
  readonly artifact: IntegratedXTensionCompositionArtifact;
  readonly plan: import('./index').MaracaComposedBuildPlan;
}
export function createMaracaXTensionHostFactory(options: IntegratedXTensionHostCompositionOptions): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;
export interface MaracaXTensionCompositionPort {
  readonly schema: 'xtend.maraca.xtension-composition-port.v1';
  readonly bindingsRuntime: XTensionCompositionBindingRuntime;
  bind(ports: Pick<XTensionHostCompositionOptions, 'fabric' | 'kernelWork' | 'resourceGraph'> & { readonly plan: Parameters<typeof createMaracaXTensionCompositionPort>[0]['plan'] }): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;
}
export function createMaracaXTensionCompositionPort(options: {
  readonly plan: Omit<import('./index').MaracaComposedBuildPlan, 'xtensionComposition'> & { readonly xtensionComposition: IntegratedXTensionCompositionArtifact };
  readonly companion: { readonly artifact: IntegratedXTensionCompositionArtifact; createHostFactory(ports: any): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController };
  readonly bindingsRuntime: XTensionCompositionBindingRuntime;
  readonly adapters: XTensionHostCompositionOptions['adapters'];
  readonly loadPeers: XTensionHostCompositionOptions['loadPeers'];
  readonly grants: XTensionHostCompositionOptions['grants'];
}): MaracaXTensionCompositionPort;
