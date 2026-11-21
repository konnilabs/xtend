import type { MaracaPlanRuntime, MaracaPlanRuntimeOptions, MaracaPlanRuntimeSnapshot } from './plan-runtime';

export const COMPONENT_COMMAND_SCHEMA: 'xtend.rmt.component-command.v1';
export const COMPONENT_COMMAND_RESULT_SCHEMA: 'xtend.maraca.component-command-result.v1';
export const MARACA_BROWSER_API_VERSION: '5.0.0';
// Keep declared boundary fields when refining an extensible boot option record.
type DeclaredBootFields<T> = {[K in keyof T as string extends K ? never : number extends K ? never : K]:T[K]};
export const LEGACY_BROWSER_COMPOSITION_SCHEMA: 'xtend.maraca.browser-composition-root.v1';

export interface MaracaBrowserFacade {
  readonly apiVersion: string;
  readonly schema: string;
  /** The browser compatibility path resolves to this same immutable MVC facade. */
  readonly orchestration: MaracaBrowserFacade;
  readonly model: MaracaPlanRuntime['model'] | null;
  boot(options?: Readonly<Record<string, unknown>>): Promise<MaracaPlanRuntimeSnapshot & Readonly<Record<string, unknown>>>;
  dispatchCommand(command: string | Readonly<Record<string, unknown>>, payload?: unknown, metadata?: Readonly<Record<string, unknown>>): Promise<unknown>;
  dispatchFastPass: MaracaPlanRuntime['dispatchFastPass'];
  getSurfaceBoundary: MaracaPlanRuntime['getSurfaceBoundary'];
  restoreURLState: MaracaPlanRuntime['restoreURLState'];
  publishURLState: MaracaPlanRuntime['publishURLState'];
  getXTensionBindings: MaracaPlanRuntime['getXTensionBindings'];
  whenXTensionsIdle: MaracaPlanRuntime['whenXTensionsIdle'];
  dispatchStreamPatch(patch: Readonly<Record<string, unknown>>, metadata?: Readonly<Record<string, unknown>>): Promise<unknown>;
  snapshot(): MaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: MaracaPlanRuntimeSnapshot) => void): () => void;
  subscribeEvents(listener: (event: Readonly<Record<string, unknown>>) => void): () => void;
  ensureComponent(tag: string): Promise<string>;
  dispose(reason?: string): Readonly<Record<string, unknown>>;
}

export interface MaracaBrowserCompositionRoot {
  readonly apiVersion: string;
  readonly schema: 'xtend.maraca.browser-composition-root.v5';
  readonly config: Readonly<Record<string, unknown>>;
  readonly facade: MaracaBrowserFacade;
  boot(options?: Readonly<Record<string, unknown>>): ReturnType<MaracaBrowserFacade['boot']>;
  invokeComponentCommand(root: ParentNode | null, command: Readonly<Record<string, unknown>>): Promise<Readonly<Record<string, unknown>>>;
  dispose(reason?: string): Readonly<Record<string, unknown>>;
}

export function freezeMaracaConfiguration<T>(value: T): Readonly<T>;
export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  schema: 'xtend.maraca.browser-composition-root.v7'; buildPlanSchema: 'xtend.maraca.build-plan.v5'; xtensionComposition: import('./xtension-composition-runtime').DeliveryXTensionCompositionArtifact | import('./xtension-composition-runtime').IntegratedXTensionCompositionArtifact | import('./xtension-composition-runtime').GraphXTensionCompositionArtifact | import('./xtension-composition-runtime').DeferredXTensionCompositionArtifact | import('./xtension-composition-runtime').SharedXTensionCompositionArtifact;
}, dependencies?: Readonly<Record<string, unknown>>): SSRComposedMaracaBrowserCompositionRoot;

export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  schema: 'xtend.maraca.browser-composition-root.v6'; buildPlanSchema: 'xtend.maraca.build-plan.v5'; xtensionComposition: import('./xtension-composition-runtime').IntegratedXTensionCompositionArtifact | import('./xtension-composition-runtime').GraphXTensionCompositionArtifact | import('./xtension-composition-runtime').DeferredXTensionCompositionArtifact | import('./xtension-composition-runtime').SharedXTensionCompositionArtifact | import('./xtension-composition-runtime').DeliveryXTensionCompositionArtifact;
}, dependencies?: Readonly<Record<string, unknown>>): ComposedMaracaBrowserCompositionRoot;

export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  schema: 'xtend.maraca.browser-composition-root.v8'; buildPlanSchema: 'xtend.maraca.build-plan.v6'; xtensionComposition: import('./xtension-composition-runtime').ComponentXTensionCompositionArtifact;
}, dependencies?: Readonly<Record<string, unknown>>): ComponentMaracaBrowserCompositionRoot;

export function createMaracaBrowserCompositionRoot(configuration:Readonly<Record<string,unknown>>&{schema:'xtend.maraca.browser-composition-root.v9';buildPlanSchema:'xtend.maraca.build-plan.v7';xtensionComposition:import('./xtension-composition-runtime').ScopedComponentArtifact},dependencies?:Readonly<Record<string,unknown>>):ScopedComponentBrowserRoot;

export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  readonly schema: 'xtend.maraca.browser-composition-root.v10'; readonly buildPlanSchema: 'xtend.maraca.build-plan.v8';
  readonly xtensionComposition: import('./xtension-composition-runtime').ProjectionComponentArtifact;
}, dependencies?: Readonly<Record<string, unknown>>): BrowserProjectionComponentRoot;

export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  readonly schema: 'xtend.maraca.browser-composition-root.v11'; readonly buildPlanSchema: 'xtend.maraca.build-plan.v9';
  readonly xtensionComposition?: import('./xtension-composition-runtime').NativeComponentArtifact;
}, dependencies?: Readonly<Record<string, unknown>> & { readonly nativeViewRuntimePort?: typeof import('@ccslabs/xtend-compiler/xtensions/native-view-projection') }): BrowserNativeComponentRoot;

export function createMaracaBrowserCompositionRoot(
  configuration?: Readonly<Record<string, unknown>>,
  dependencies?: Readonly<{
    createPlanRuntime?: (options: MaracaPlanRuntimeOptions) => MaracaPlanRuntime;
    runtimeModuleApis?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
    runtimeApis?: Readonly<Record<string, unknown>>;
    [key: string]: unknown;
  }>
): MaracaBrowserCompositionRoot;

export const MARACA_XTENSION_BROWSER_API_VERSION: '13.0.0';
export interface MaracaXTensionBootOptions extends Record<string, unknown> {
  readonly fabric: import('./xtension-composition-runtime').XTensionHostCompositionOptions['fabric'];
  readonly xtensions: Pick<import('./xtension-composition-runtime').XTensionHostCompositionOptions, 'grants'> & import('./xtension-composition-runtime').XTensionPeerLoaderOptions;
  readonly createXTensionHost?: never; readonly xtensionBindingsRuntime?: never; readonly xtensionCompositionPort?: never; readonly adoptExisting?: false;
}
export interface ComposedMaracaBrowserFacade extends Omit<MaracaBrowserFacade, 'apiVersion' | 'boot' | 'snapshot' | 'subscribe' | 'orchestration'> {
  readonly apiVersion: '6.0.0'; readonly orchestration: ComposedMaracaBrowserFacade;
  boot(options: MaracaXTensionBootOptions): Promise<Readonly<Record<string, unknown>>>;
  snapshot(): import('./plan-runtime').ComposedMaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: import('./plan-runtime').ComposedMaracaPlanRuntimeSnapshot) => void): () => void;
}
export interface ComposedMaracaBrowserCompositionRoot extends Omit<MaracaBrowserCompositionRoot, 'apiVersion' | 'schema' | 'facade' | 'boot'> {
  readonly apiVersion: '6.0.0'; readonly schema: 'xtend.maraca.browser-composition-root.v6';
  readonly facade: ComposedMaracaBrowserFacade;
  boot(options: MaracaXTensionBootOptions): ReturnType<ComposedMaracaBrowserFacade['boot']>;
}

export interface MaracaXTensionSSRBootOptions extends Omit<MaracaXTensionBootOptions, 'xtensions'> {
  readonly xtensions: MaracaXTensionBootOptions['xtensions'] & { readonly ssr?: import('./xtension-ssr').XTensionSSRClientOptions | import('./xtension-ssr').XTensionSSRServerOptions };
}
export interface SSRComposedMaracaBrowserFacade extends Omit<ComposedMaracaBrowserFacade, 'apiVersion' | 'boot' | 'orchestration' | 'snapshot' | 'subscribe'> {
  readonly apiVersion: '7.0.0'; readonly orchestration: SSRComposedMaracaBrowserFacade;
  boot(options: MaracaXTensionSSRBootOptions): Promise<Readonly<Record<string, unknown>>>;
  snapshot(): import('./plan-runtime').ComposedMaracaPlanRuntimeSnapshot | import('./plan-runtime').SSRComposedMaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: import('./plan-runtime').ComposedMaracaPlanRuntimeSnapshot | import('./plan-runtime').SSRComposedMaracaPlanRuntimeSnapshot) => void): () => void;
  captureXTensionSSR(): Promise<import('./xtension-ssr').XTensionSSRResponse>;
}
export interface SSRComposedMaracaBrowserCompositionRoot extends Omit<ComposedMaracaBrowserCompositionRoot, 'apiVersion' | 'schema' | 'facade' | 'boot'> {
  readonly apiVersion: '7.0.0'; readonly schema: 'xtend.maraca.browser-composition-root.v7';
  readonly facade: SSRComposedMaracaBrowserFacade;
  boot(options: MaracaXTensionSSRBootOptions): ReturnType<SSRComposedMaracaBrowserFacade['boot']>;
}

export interface ComponentMaracaBrowserFacade extends Omit<ComposedMaracaBrowserFacade, 'apiVersion' | 'orchestration' | 'snapshot' | 'subscribe'> {
  readonly apiVersion: '8.0.0'; readonly orchestration: ComponentMaracaBrowserFacade;
  snapshot(): import('./plan-runtime').ComponentMaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: import('./plan-runtime').ComponentMaracaPlanRuntimeSnapshot) => void): () => void;
}
export interface ComponentMaracaBrowserCompositionRoot extends Omit<ComposedMaracaBrowserCompositionRoot, 'apiVersion' | 'schema' | 'facade' | 'boot'> {
  readonly apiVersion: '8.0.0'; readonly schema: 'xtend.maraca.browser-composition-root.v8';
  readonly facade: ComponentMaracaBrowserFacade;
  boot(options: MaracaXTensionBootOptions): ReturnType<ComponentMaracaBrowserFacade['boot']>;
}

export interface ScopedComponentBootOptions extends Omit<MaracaXTensionBootOptions,'xtensions'> {readonly xtensions:MaracaXTensionBootOptions['xtensions'] & {readonly ssr?:import('./xtension-ssr').ComponentSSRServerOptions|import('./xtension-ssr').ComponentSSRClientOptions}}
export interface ScopedComponentBrowserFacade extends Omit<ComponentMaracaBrowserFacade,'apiVersion'|'orchestration'|'snapshot'|'subscribe'|'boot'> {readonly apiVersion:'9.0.0';readonly orchestration:ScopedComponentBrowserFacade;boot(options:ScopedComponentBootOptions):Promise<Readonly<Record<string,unknown>>>;snapshot():import('./plan-runtime').ScopedComponentSnapshot|import('./plan-runtime').ComponentSSRSnapshot;subscribe(listener:(snapshot:import('./plan-runtime').ScopedComponentSnapshot|import('./plan-runtime').ComponentSSRSnapshot)=>void):()=>void;captureXTensionSSR():Promise<import('./xtension-ssr').ComponentSSRResponse>}
export interface ScopedComponentBrowserRoot extends Omit<ComponentMaracaBrowserCompositionRoot,'apiVersion'|'schema'|'facade'|'boot'> {readonly apiVersion:'9.0.0';readonly schema:'xtend.maraca.browser-composition-root.v9';readonly facade:ScopedComponentBrowserFacade;boot(options:ScopedComponentBootOptions):ReturnType<ScopedComponentBrowserFacade['boot']>}

export interface ProjectionComponentBootOptions extends Record<string, unknown> {
  readonly fabric: MaracaXTensionBootOptions['fabric'];
  readonly xtensions: MaracaXTensionBootOptions['xtensions'] & { readonly ssr?: never };
  readonly urlStatePolicy?: import('@ccslabs/xtend/xtensions/url-state').PolicyV2;
  readonly urlStateRuntime?: import('@ccslabs/xtend/xtensions/url-state').ProjectionURLStateRuntime;
  readonly createXTensionHost?: never; readonly xtensionBindingsRuntime?: never; readonly xtensionCompositionPort?: never; readonly adoptExisting?: false;
}
export interface ProjectionComponentBrowserFacade extends Omit<ComponentMaracaBrowserFacade, 'apiVersion' | 'snapshot' | 'subscribe' | 'orchestration' | 'boot' | 'restoreURLState' | 'publishURLState'> {
  readonly apiVersion: '10.0.0'; readonly orchestration: ProjectionComponentBrowserFacade;
  snapshot(): import('./plan-runtime').RmtxPlanSnapshot;
  subscribe(listener: (snapshot: import('./plan-runtime').RmtxPlanSnapshot) => void): () => void;
  boot(options: ProjectionComponentBootOptions): Promise<Readonly<Record<string, unknown>>>;
  restoreURLState: import('./plan-runtime').RmtxPlanRuntime['restoreURLState'];
  publishURLState: import('./plan-runtime').RmtxPlanRuntime['publishURLState'];
}
export interface BrowserProjectionComponentRoot extends Omit<ScopedComponentBrowserRoot, 'schema' | 'apiVersion' | 'facade' | 'boot'> {
  readonly schema: 'xtend.maraca.browser-composition-root.v10'; readonly apiVersion: '10.0.0';
  readonly facade: ProjectionComponentBrowserFacade;
  boot(options: ProjectionComponentBootOptions): ReturnType<ProjectionComponentBrowserFacade['boot']>;
}

/** Native-only apps and composed native apps share browser11; SSR stays closed. */
export interface NativeComponentBootOptions extends Record<string, unknown> {
  readonly fabric: NonNullable<MaracaXTensionBootOptions['fabric']> & Pick<import('@ccslabs/xtend/fabric').XtendFabricApi, 'runFiber'>;
  readonly xtensions?: ProjectionComponentBootOptions['xtensions'];
  readonly urlStatePolicy?: import('@ccslabs/xtend/xtensions/url-state').PolicyV2;
  readonly urlStateRuntime?: import('@ccslabs/xtend/xtensions/url-state').NativeURLStateRuntime;
  readonly nativeViewRuntimePort?: typeof import('@ccslabs/xtend-compiler/xtensions/native-view-projection');
  readonly createXTensionHost?: never; readonly xtensionBindingsRuntime?: never; readonly xtensionCompositionPort?: never; readonly adoptExisting?: false;
  readonly ssr?: never; readonly ssrResponse?: never;
}
export interface NativeComponentBrowserFacade extends Omit<ProjectionComponentBrowserFacade, 'apiVersion' | 'orchestration' | 'snapshot' | 'subscribe' | 'boot' | 'restoreURLState' | 'publishURLState'> {
  readonly apiVersion: '11.0.0'; readonly orchestration: NativeComponentBrowserFacade;
  snapshot(): ReturnType<import('./plan-runtime').NativeRmtxPlanRuntime['snapshot']>;
  subscribe(listener: (snapshot: ReturnType<import('./plan-runtime').NativeRmtxPlanRuntime['snapshot']>) => void): () => void;
  boot(options: NativeComponentBootOptions): Promise<Readonly<Record<string, unknown>>>;
  restoreURLState: import('./plan-runtime').NativeRmtxPlanRuntime['restoreURLState'];
  publishURLState: import('./plan-runtime').NativeRmtxPlanRuntime['publishURLState'];
}
export interface BrowserNativeComponentRoot extends Omit<BrowserProjectionComponentRoot, 'schema' | 'apiVersion' | 'facade' | 'boot'> {
  readonly schema: 'xtend.maraca.browser-composition-root.v11'; readonly apiVersion: '11.0.0';
  readonly facade: NativeComponentBrowserFacade;
  boot(options: NativeComponentBootOptions): ReturnType<NativeComponentBrowserFacade['boot']>;
}

/** Source6 uses a distinct factory and View API2; its lifecycle integration stays private. */
export interface LifecycleComponentBootOptions extends Record<string,unknown>, Omit<DeclaredBootFields<NativeComponentBootOptions>, 'nativeViewRuntimePort' | 'urlStateRuntime'> {
  readonly nativeViewRuntimePort?: import('./plan-runtime').LifecycleNativeViewRuntimePort;
  readonly urlStateRuntime?: typeof import('@ccslabs/xtend/xtensions/url-state').LIFECYCLE_URL_STATE_RUNTIME;
}
export interface LifecycleComponentBrowserFacade extends Omit<NativeComponentBrowserFacade, 'apiVersion' | 'orchestration' | 'snapshot' | 'subscribe' | 'boot' | 'restoreURLState' | 'publishURLState'> {
  readonly apiVersion: '12.0.0'; readonly orchestration: LifecycleComponentBrowserFacade;
  snapshot(): import('./plan-runtime').LifecycleRmtxPlanSnapshot;
  subscribe(listener: (snapshot: import('./plan-runtime').LifecycleRmtxPlanSnapshot) => void): () => void;
  boot(options: LifecycleComponentBootOptions): Promise<Readonly<Record<string, unknown>>>;
  restoreURLState: import('./plan-runtime').LifecycleRmtxPlanRuntime['restoreURLState'];
  publishURLState: import('./plan-runtime').LifecycleRmtxPlanRuntime['publishURLState'];
}
export interface BrowserLifecycleComponentRoot extends Omit<BrowserNativeComponentRoot, 'schema' | 'apiVersion' | 'facade' | 'boot'> {
  readonly schema: 'xtend.maraca.browser-composition-root.v12'; readonly apiVersion: '12.0.0';
  readonly facade: LifecycleComponentBrowserFacade;
  boot(options: LifecycleComponentBootOptions): ReturnType<LifecycleComponentBrowserFacade['boot']>;
}
export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  readonly schema: 'xtend.maraca.browser-composition-root.v12'; readonly buildPlanSchema: 'xtend.maraca.build-plan.v10';
  readonly xtensionComposition?: import('./xtension-composition-runtime').LifecycleComponentArtifact;
}, dependencies: Readonly<Record<string, unknown>> & {
  readonly nativeViewRuntimePort: import('./plan-runtime').LifecycleNativeViewRuntimePort;
  readonly createLifecyclePlanRuntime: typeof import('./native-lifecycle-runtime').createMaracaNativeLifecycleRuntime;
}): BrowserLifecycleComponentRoot;

/** Source7 uses a distinct factory and View API3; its lifecycle integration stays private. */
export interface OrchestratedComponentBootOptions extends Record<string,unknown>, Omit<DeclaredBootFields<NativeComponentBootOptions>, 'nativeViewRuntimePort' | 'urlStateRuntime'> {
  readonly nativeViewRuntimePort?: typeof import('@ccslabs/xtend/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
  readonly urlStateRuntime?: typeof import('@ccslabs/xtend/xtensions/url-state').ORCHESTRATED_URL_STATE_RUNTIME;
}
export interface OrchestratedComponentBrowserFacade extends Omit<NativeComponentBrowserFacade, 'apiVersion' | 'orchestration' | 'snapshot' | 'subscribe' | 'boot' | 'restoreURLState' | 'publishURLState'> {
  readonly apiVersion: '13.0.0'; readonly orchestration: OrchestratedComponentBrowserFacade;
  snapshot(): import('./plan-runtime').OrchestratedRmtxPlanSnapshot16;
  subscribe(listener: (snapshot: import('./plan-runtime').OrchestratedRmtxPlanSnapshot16) => void): () => void;
  boot(options: OrchestratedComponentBootOptions): Promise<Readonly<Record<string, unknown>>>;
  restoreURLState: import('./plan-runtime').OrchestratedRmtxPlanRuntime16['restoreURLState'];
  publishURLState: import('./plan-runtime').OrchestratedRmtxPlanRuntime16['publishURLState'];
}
export interface BrowserOrchestratedComponentRoot extends Omit<BrowserNativeComponentRoot, 'schema' | 'apiVersion' | 'facade' | 'boot'> {
  readonly schema: 'xtend.maraca.browser-composition-root.v13'; readonly apiVersion: '13.0.0';
  readonly facade: OrchestratedComponentBrowserFacade;
  boot(options: OrchestratedComponentBootOptions): ReturnType<OrchestratedComponentBrowserFacade['boot']>;
}
export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  readonly schema: 'xtend.maraca.browser-composition-root.v13'; readonly buildPlanSchema: 'xtend.maraca.build-plan.v11';
  readonly xtensionComposition?: import('./xtension-composition-runtime').OrchestratedComponentArtifact;
}, dependencies: Readonly<Record<string, unknown>> & {
  readonly nativeViewRuntimePort: typeof import('@ccslabs/xtend/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
  readonly createOrchestratedPlanRuntime: typeof import('./native-orchestration-runtime').createMaracaNativeOrchestrationRuntime;
}): BrowserOrchestratedComponentRoot;

export const MARACA_MANAGED_BROWSER_API_VERSION: '14.0.0';
/** Source8 uses a distinct factory and View API4; its lifecycle integration stays private. */
export interface ManagedComponentBootOptions extends Record<string,unknown>, Omit<DeclaredBootFields<NativeComponentBootOptions>, 'nativeViewRuntimePort' | 'urlStateRuntime'> {
  readonly nativeViewRuntimePort?: typeof import('@ccslabs/xtend/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME;
  readonly urlStateRuntime?: typeof import('@ccslabs/xtend/xtensions/url-state-managed').MANAGED_URL_STATE_RUNTIME;
  readonly nativeServices?: import('@ccslabs/xtend/components/native-services', {with: {'resolution-mode': 'import'}}).ManagedNativeServices;
  readonly nativeComponentPorts?: import('@ccslabs/xtend/xtensions/native-component-managed').ManagedNativePorts;
  readonly routerHost?: import('./plan-runtime').ManagedNativeRouteHost;
}
export interface ManagedComponentBrowserFacade extends Omit<NativeComponentBrowserFacade, 'apiVersion' | 'orchestration' | 'snapshot' | 'subscribe' | 'boot' | 'restoreURLState' | 'publishURLState'> {
  readonly apiVersion: '14.0.0'; readonly orchestration: ManagedComponentBrowserFacade;
  snapshot(): import('./plan-runtime').ManagedRmtxPlanSnapshot17;
  subscribe(listener: (snapshot: import('./plan-runtime').ManagedRmtxPlanSnapshot17) => void): () => void;
  boot(options: ManagedComponentBootOptions): Promise<Readonly<Record<string, unknown>>>;
  restoreURLState: import('./plan-runtime').ManagedRmtxPlanRuntime17['restoreURLState'];
  publishURLState: import('./plan-runtime').ManagedRmtxPlanRuntime17['publishURLState'];
}
export interface BrowserManagedComponentRoot extends Omit<BrowserNativeComponentRoot, 'schema' | 'apiVersion' | 'facade' | 'boot'> {
  readonly schema: 'xtend.maraca.browser-composition-root.v14'; readonly apiVersion: '14.0.0';
  readonly facade: ManagedComponentBrowserFacade;
  boot(options: ManagedComponentBootOptions): ReturnType<ManagedComponentBrowserFacade['boot']>;
}
export function createMaracaBrowserCompositionRoot(configuration: Readonly<Record<string, unknown>> & {
  readonly schema: 'xtend.maraca.browser-composition-root.v14'; readonly buildPlanSchema: 'xtend.maraca.build-plan.v12';
  readonly xtensionComposition?: import('./xtension-composition-runtime').ManagedComponentArtifact;
}, dependencies: Readonly<Record<string, unknown>> & {
  readonly nativeViewRuntimePort: typeof import('@ccslabs/xtend/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME;
  readonly createManagedPlanRuntime: typeof import('./native-managed-runtime').createMaracaNativeManagedRuntime;
}): BrowserManagedComponentRoot;

export const MARACA_RMTX_SSR_BROWSER_API_VERSION:'1.0.0';
export interface RmtxSSRBootOptions extends Record<string,unknown>, Omit<DeclaredBootFields<MaracaXTensionBootOptions>,'xtensions'|'adoptExisting'> {
  readonly adoptExisting?:never;readonly ssr?:never;readonly ssrResponse?:never;
  readonly fabric:MaracaXTensionBootOptions['fabric'] & {runFiber:(...args:any[])=>unknown};
  readonly xtensions:MaracaXTensionBootOptions['xtensions'] & {readonly ssr:import('./xtension-ssr').RmtxSSRServerOptions|import('./xtension-ssr').RmtxSSRClientOptions};
}
export interface RmtxSSRBrowserFacade extends Omit<MaracaBrowserFacade,'apiVersion'|'schema'|'boot'|'snapshot'|'orchestration'|'subscribe'> {
  readonly apiVersion:'1.0.0';readonly schema:'xtend.maraca.rmtx-ssr-browser-root.v1';readonly orchestration:RmtxSSRBrowserFacade;
  boot(options:RmtxSSRBootOptions):Promise<Readonly<Record<string,unknown>>>;
  snapshot():import('./plan-runtime').RmtxSSRPlanRuntimeSnapshot18;subscribe(listener:(snapshot:import('./plan-runtime').RmtxSSRPlanRuntimeSnapshot18)=>void):()=>void;
  captureXTensionSSR():Promise<import('./xtension-ssr').RmtxSSRResponse>;
}
export interface RmtxSSRBrowserRoot extends Omit<MaracaBrowserCompositionRoot,'apiVersion'|'schema'|'facade'|'boot'> {
  readonly apiVersion:'1.0.0';readonly schema:'xtend.maraca.rmtx-ssr-browser-root.v1';readonly facade:RmtxSSRBrowserFacade;
  boot(options:RmtxSSRBootOptions):ReturnType<RmtxSSRBrowserFacade['boot']>;
}
export interface NativeOnlyRmtxSSRBootOptions extends Record<string,unknown>,Omit<DeclaredBootFields<RmtxSSRBootOptions>,'xtensions'> {
  readonly xtensions:{readonly grants:Readonly<Record<string,never>>;readonly ssr:import('./xtension-ssr').RmtxSSRServerOptions|import('./xtension-ssr').RmtxSSRClientOptions;readonly loadPeers?:never;readonly loadPeerGroup?:never};
}
export interface NativeOnlyRmtxSSRBrowserFacade extends Omit<RmtxSSRBrowserFacade,'boot'|'orchestration'> {
  readonly orchestration:NativeOnlyRmtxSSRBrowserFacade;
  boot(options:NativeOnlyRmtxSSRBootOptions):Promise<Readonly<Record<string,unknown>>>;
}
export interface NativeOnlyRmtxSSRBrowserRoot extends Omit<RmtxSSRBrowserRoot,'facade'|'boot'> {
  readonly facade:NativeOnlyRmtxSSRBrowserFacade;
  boot(options:NativeOnlyRmtxSSRBootOptions):ReturnType<NativeOnlyRmtxSSRBrowserFacade['boot']>;
}
export type NativeOnlyRmtxSSRConfiguration=Readonly<Record<string,unknown>> & {readonly xtensionComposition?:never} & (
  | {readonly schema:'xtend.maraca.browser-composition-root.v11';readonly buildPlanSchema:'xtend.maraca.build-plan.v9'}
  | {readonly schema:'xtend.maraca.browser-composition-root.v12';readonly buildPlanSchema:'xtend.maraca.build-plan.v10'}
  | {readonly schema:'xtend.maraca.browser-composition-root.v13';readonly buildPlanSchema:'xtend.maraca.build-plan.v11'}
  | {readonly schema:'xtend.maraca.browser-composition-root.v14';readonly buildPlanSchema:'xtend.maraca.build-plan.v12'}
);
export function createMaracaRmtxSSRCompositionRoot(configuration:Readonly<{schema:'xtend.maraca.rmtx-ssr-browser-root.v1';sourceIdentity:import('./xtension-rmtx-ssr-contract.mjs').RmtxSSRSourceIdentity;configuration:NativeOnlyRmtxSSRConfiguration}>,dependencies:Readonly<Record<string,unknown>>):NativeOnlyRmtxSSRBrowserRoot;
export function createMaracaRmtxSSRCompositionRoot(configuration:Readonly<{schema:'xtend.maraca.rmtx-ssr-browser-root.v1';sourceIdentity:import('./xtension-rmtx-ssr-contract.mjs').RmtxSSRSourceIdentity;configuration:Readonly<Record<string,unknown>>}>,dependencies:Readonly<Record<string,unknown>>):RmtxSSRBrowserRoot;
