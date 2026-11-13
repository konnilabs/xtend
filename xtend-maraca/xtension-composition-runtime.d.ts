import type {
  HostCapabilityRequirements, KernelRuntimeHostOptions, RuntimeHostOptions, GraphRuntimeHostOptions,
  WorkBudgetPolicy, NegotiatedRuntimeHostOptions, NegotiatedRuntimeHostController
} from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import type { XTensionBindingHostContext, XTensionStateBindingArtifact } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import type { MaracaBuildPlan } from './index';
export const XTENSION_COMPOSITION_API_VERSION: '7.0.0';
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
export type XTensionPeerLoaderOptions =
  | { readonly loadPeers: XTensionHostCompositionOptions['loadPeers']; readonly loadPeerGroup?: never }
  | { readonly loadPeers?: never; loadPeerGroup(context: Readonly<{ group: XTensionPeerGroup; signal: AbortSignal }>): unknown | Promise<unknown> };
export function createMaracaXTensionCompositionPort(options: {
  readonly plan: Omit<import('./index').MaracaComposedBuildPlan, 'xtensionComposition'> & { readonly xtensionComposition: IntegratedXTensionCompositionArtifact | GraphXTensionCompositionArtifact | DeferredXTensionCompositionArtifact | SharedXTensionCompositionArtifact | DeliveryXTensionCompositionArtifact };
  readonly companion: { readonly artifact: IntegratedXTensionCompositionArtifact | GraphXTensionCompositionArtifact | DeferredXTensionCompositionArtifact | SharedXTensionCompositionArtifact | DeliveryXTensionCompositionArtifact; createHostFactory(ports: any): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController };
  readonly bindingsRuntime: XTensionCompositionBindingRuntime;
  readonly adapters: XTensionHostCompositionOptions['adapters'];
  readonly grants: XTensionHostCompositionOptions['grants'];
} & XTensionPeerLoaderOptions): MaracaXTensionCompositionPort;

/** Explicit opt-in to a pinned, closed, acyclic local static-ESM graph. */
export interface GraphXTensionCompositionManifest extends Omit<XTensionCompositionManifest, 'schema'> {
  readonly schema: 'xtend.maraca.xtension-composition-manifest.v2';
  readonly modules: readonly { readonly module: string; readonly sha256: string }[];
}
export type AnyXTensionCompositionManifest = XTensionCompositionManifest | GraphXTensionCompositionManifest | DeferredXTensionCompositionManifest | SharedXTensionCompositionManifest | DeliveryXTensionCompositionManifest;
export interface GraphXTensionCompositionArtifact extends Omit<XTensionCompositionArtifact, 'schema' | 'apiVersion' | 'plan' | 'manifest' | 'providers'> {
  readonly schema: 'xtend.maraca.xtension-composition-artifact.v3'; readonly apiVersion: '3.0.0';
  readonly plan: XTensionCompositionArtifact['plan'] | (Omit<XTensionCompositionArtifact['plan'], 'schema'> & { readonly schema: 'xtend.maraca.build-plan.v5'; readonly compositionManifest: GraphXTensionCompositionManifest });
  readonly manifest: GraphXTensionCompositionManifest;
  readonly providers: readonly { readonly id: string; readonly sha256: string; readonly fileName: string; readonly outputSha256: string }[];
  readonly modules: readonly {
    readonly module: string; readonly sha256: string; readonly sourceBytes: number;
    readonly fileName: string; readonly outputSha256: string; readonly outputBytes: number;
    readonly imports: readonly { readonly specifier: string; readonly module: string }[];
  }[];
}
export interface GraphXTensionHostCompositionOptions extends Omit<XTensionHostCompositionOptions, 'artifact' | 'plan'> {
  readonly artifact: GraphXTensionCompositionArtifact;
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
}
export function createMaracaXTensionHostFactory(options: GraphXTensionHostCompositionOptions): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;

export interface DeferredXTensionCompositionManifest extends Omit<GraphXTensionCompositionManifest, 'schema'> {
  readonly schema: 'xtend.maraca.xtension-composition-manifest.v3';
  readonly loading: { readonly provider: 'on-mount'; readonly peers: 'per-host' };
}
export interface XTensionLoadPlan {
  readonly schema: 'xtend.maraca.xtension-load-plan.v1';
  readonly providers: readonly {
    readonly providerId: string; readonly mode: 'on-mount'; readonly phase: 'kernel.fabric.mount';
    readonly entryFile: string; readonly exportName: string; readonly modules: readonly string[];
    readonly peers: { readonly mode: 'per-host'; readonly framework: 'react' | 'vue'; readonly versions: Readonly<Record<string, string>> };
  }[];
}
export interface DeferredXTensionCompositionArtifact extends Omit<GraphXTensionCompositionArtifact, 'schema' | 'apiVersion' | 'plan' | 'manifest'> {
  readonly schema: 'xtend.maraca.xtension-composition-artifact.v4'; readonly apiVersion: '4.0.0';
  readonly plan: XTensionCompositionArtifact['plan'] | (Omit<XTensionCompositionArtifact['plan'], 'schema'> & { readonly schema: 'xtend.maraca.build-plan.v5'; readonly compositionManifest: DeferredXTensionCompositionManifest });
  readonly manifest: DeferredXTensionCompositionManifest;
  readonly loadPlan: XTensionLoadPlan;
}
export interface DeferredXTensionHostCompositionOptions extends Omit<XTensionHostCompositionOptions, 'artifact' | 'plan' | 'providers'> {
  readonly artifact: DeferredXTensionCompositionArtifact;
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly providers?: never;
  /** Trusted native-import closures from the generated companion; imports cannot be transport-aborted. */
  readonly loadProviders: Readonly<Record<string, () => unknown | Promise<unknown>>>;
}
export function createMaracaXTensionHostFactory(options: DeferredXTensionHostCompositionOptions): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;

/** Exact-version sharing is opt-in; complete v3/per-host contracts remain above. */
export interface SharedXTensionCompositionManifest extends Omit<GraphXTensionCompositionManifest, 'schema'> {
  readonly schema: 'xtend.maraca.xtension-composition-manifest.v4';
  readonly loading: { readonly provider: 'on-mount'; readonly peers: 'shared' };
}
export interface XTensionPeerGroup {
  readonly id: string; readonly framework: 'react' | 'vue';
  readonly versions: Readonly<Record<string, string>>;
  readonly providerIds: readonly string[];
}
export interface SharedXTensionLoadPlan {
  readonly schema: 'xtend.maraca.xtension-load-plan.v2';
  readonly peerGroups: readonly XTensionPeerGroup[];
  readonly providers: readonly (Omit<XTensionLoadPlan['providers'][number], 'peers'> & {
    readonly peers: { readonly mode: 'shared'; readonly groupId: string };
  })[];
}
export interface SharedXTensionCompositionArtifact extends Omit<GraphXTensionCompositionArtifact, 'schema' | 'apiVersion' | 'plan' | 'manifest'> {
  readonly schema: 'xtend.maraca.xtension-composition-artifact.v5'; readonly apiVersion: '5.0.0';
  readonly plan: XTensionCompositionArtifact['plan'] | (Omit<XTensionCompositionArtifact['plan'], 'schema'> & { readonly schema: 'xtend.maraca.build-plan.v5'; readonly compositionManifest: SharedXTensionCompositionManifest });
  readonly manifest: SharedXTensionCompositionManifest;
  readonly loadPlan: SharedXTensionLoadPlan;
}
export interface SharedXTensionHostCompositionOptions extends Omit<DeferredXTensionHostCompositionOptions, 'artifact' | 'loadPeers'> {
  readonly artifact: SharedXTensionCompositionArtifact;
  readonly loadPeers?: never;
  loadPeerGroup(context: Readonly<{ group: XTensionPeerGroup; signal: AbortSignal }>): unknown | Promise<unknown>;
}
export function createMaracaXTensionHostFactory(options: SharedXTensionHostCompositionOptions): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;

/** A server-applied script policy; JSON alone does not attest live HTTP bytes. */
export interface XTensionDeliveryPolicy {
  readonly schema: 'xtend.maraca.xtension-delivery-policy.v1';
  readonly mode: 'same-origin-external-esm';
}
export interface DeliveryXTensionCompositionManifest extends Omit<SharedXTensionCompositionManifest, 'schema'> {
  readonly schema: 'xtend.maraca.xtension-composition-manifest.v5';
  readonly delivery: XTensionDeliveryPolicy;
}
export interface DeliveryXTensionCompositionArtifact extends Omit<SharedXTensionCompositionArtifact, 'schema' | 'apiVersion' | 'plan' | 'manifest'> {
  readonly schema: 'xtend.maraca.xtension-composition-artifact.v6'; readonly apiVersion: '6.0.0';
  readonly plan: XTensionCompositionArtifact['plan'] | (Omit<XTensionCompositionArtifact['plan'], 'schema'> & { readonly schema: 'xtend.maraca.build-plan.v5'; readonly compositionManifest: DeliveryXTensionCompositionManifest });
  readonly manifest: DeliveryXTensionCompositionManifest;
}
export interface DeliveryXTensionHostCompositionOptions extends Omit<SharedXTensionHostCompositionOptions, 'artifact'> {
  readonly artifact: DeliveryXTensionCompositionArtifact;
}
export function createMaracaXTensionHostFactory(options: DeliveryXTensionHostCompositionOptions): (context: XTensionCompositionHostContext) => NegotiatedRuntimeHostController;

/** Live capabilities prepared by the generated platform, never snapshot JSON. */
export interface MaracaXTensionSSRSession {
  readonly schema: 'xtend.maraca.xtension-ssr-session.v1'; readonly mode: 'server' | 'client';
  prepare(root: Element): Promise<{ readonly initialState?: Readonly<Record<string, unknown>>; readonly adoptExisting: boolean }>;
  confirmRestored(snapshot: { readonly states: Readonly<Record<string, unknown>> }): void;
  hostContext(context: XTensionCompositionHostContext, provider: XTensionCompositionProvider): import('@ccslabs/xtend-compiler/xtensions/react-runtime-adapter').SSRRuntimeHostOptions['ssr'];
  gate(context: XTensionCompositionHostContext): XTensionBindingHostContext['onEvent'];
  bind(entry: { readonly binding: import('@ccslabs/xtend-compiler/xtensions/state-binding').XTensionStateBinding }, instance: import('@ccslabs/xtend-compiler/xtensions/state-binding').XTensionResumeBoundInstance): void;
  retire(address: XTensionBindingHostContext['identity']['address']): void;
  shouldAdopt(entry: { readonly binding: import('@ccslabs/xtend-compiler/xtensions/state-binding').XTensionStateBinding }): boolean;
  finish(): Promise<import('./xtension-ssr').XTensionSSRReport>;
  capture(snapshot: { readonly states: Readonly<Record<string, unknown>> }): Promise<import('./xtension-ssr').XTensionSSRResponse>;
  getReport(): import('./xtension-ssr').XTensionSSRReport | null;
  dispose(): void;
}
export interface MaracaXTensionResumeBindingRuntime {
  readonly XTENSION_RESUME_STATE_BINDING_API_VERSION: '3.0.0';
  readonly createXTensionResumeStateRegistry: typeof import('@ccslabs/xtend-compiler/xtensions/state-binding').createXTensionResumeStateRegistry;
}
export interface MaracaXTensionSSRCompositionPort extends Omit<MaracaXTensionCompositionPort, 'schema' | 'bind'> {
  readonly schema: 'xtend.maraca.xtension-composition-port.v2';
  readonly ssrSession: MaracaXTensionSSRSession;
  readonly resumeBindingsRuntime: MaracaXTensionResumeBindingRuntime;
  bind(ports: Parameters<MaracaXTensionCompositionPort['bind']>[0]): (context: XTensionCompositionHostContext) => import('@ccslabs/xtend-compiler/xtensions/react-runtime-adapter').SSRRuntimeHostController;
}
