import type { MaracaPlanRuntime, MaracaPlanRuntimeOptions, MaracaPlanRuntimeSnapshot } from './plan-runtime';

export const COMPONENT_COMMAND_SCHEMA: 'xtend.rmt.component-command.v1';
export const COMPONENT_COMMAND_RESULT_SCHEMA: 'xtend.maraca.component-command-result.v1';
export const MARACA_BROWSER_API_VERSION: '5.0.0';
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
  schema: 'xtend.maraca.browser-composition-root.v6'; buildPlanSchema: 'xtend.maraca.build-plan.v5'; xtensionComposition: import('./xtension-composition-runtime').IntegratedXTensionCompositionArtifact | import('./xtension-composition-runtime').GraphXTensionCompositionArtifact | import('./xtension-composition-runtime').DeferredXTensionCompositionArtifact | import('./xtension-composition-runtime').SharedXTensionCompositionArtifact | import('./xtension-composition-runtime').DeliveryXTensionCompositionArtifact;
}, dependencies?: Readonly<Record<string, unknown>>): ComposedMaracaBrowserCompositionRoot;

export function createMaracaBrowserCompositionRoot(
  configuration?: Readonly<Record<string, unknown>>,
  dependencies?: Readonly<{
    createPlanRuntime?: (options: MaracaPlanRuntimeOptions) => MaracaPlanRuntime;
    runtimeModuleApis?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
    runtimeApis?: Readonly<Record<string, unknown>>;
    [key: string]: unknown;
  }>
): MaracaBrowserCompositionRoot;

export const MARACA_XTENSION_BROWSER_API_VERSION: '6.0.0';
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
