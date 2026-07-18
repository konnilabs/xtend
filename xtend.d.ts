import type { RmtBrowserScheduler } from './xtendrmt/rmt-browser-scheduler';
import type { RmtDomDescriptorRenderer, RmtDomDescriptorRenderOptions } from './xtendrmt/rmt-dom-descriptor-renderer';
import type { RmtAppRuntime } from './xtendrmt/rmt-app-runtime';
import type { RmtStateSelectorRuntime, RmtStateSelectorRuntimeOptions } from './xtendrmt/rmt-state-selector-runtime';
import type { RmtActionEffectRuntime, RmtActionEffectRuntimeOptions } from './xtendrmt/rmt-action-effect-runtime';
import type { RmtEventRoutingRuntime, RmtEventRoutingRuntimeOptions } from './xtendrmt/rmt-event-routing-runtime';
import type { RmtAnimationEngineRuntime, RmtAnimationEngineRuntimeOptions } from './xtendrmt/rmt-animation-engine-runtime';
import type { RmtFormValidationRuntime, RmtFormValidationRuntimeOptions } from './xtendrmt/rmt-form-validation-runtime';
import type { RmtSurfaceTransitionRuntime, RmtSurfaceTransitionRuntimeOptions } from './xtendrmt/rmt-surface-transition-runtime';
import type { RmtSurfaceResourceGraphRuntime, RmtSurfaceResourceGraphRuntimeOptions } from './xtendrmt/rmt-surface-resource-graph-runtime';
import type { XTendEnsureComponentOptions, XTendHydrateTreeDetail, XTendHydrateTreeOptions, XTendInitiateOptions, XTendLoaderBootResult } from './xtend-loader';
import type { XtendFabricApi } from './fabric/xtend-fabric';

export interface XTendTextDescriptor {
  type: 'text';
  text: string;
}

export interface XTendElementDescriptor {
  type: 'element';
  tag: string;
  attributes?: Record<string, string | number | boolean | null | undefined>;
  properties?: Record<string, unknown>;
  children?: XTendDescriptor[];
  key?: string;
}

export type XTendDescriptor = XTendTextDescriptor | XTendElementDescriptor;

export interface XTendAppOptions<TState extends object = Record<string, unknown>> {
  initialState?: TState;
  [option: string]: unknown;
}

export type XTendAppRuntime<TState extends object = Record<string, unknown>> =
  Omit<RmtAppRuntime, 'getState' | 'setState'> & {
    getState(): TState;
    setState(value: TState): unknown;
  };

export type XTendStateDefinition<
  TState extends object,
  TKey extends keyof TState = keyof TState
> = TKey extends keyof TState ? {
  id: TKey;
  type: string;
  schema?: string;
  initial?: TState[TKey];
  preserve?: string;
  xstateKey?: string;
} : never;

export type XTendStoreOptions<TState extends object = Record<string, unknown>> =
  Omit<RmtStateSelectorRuntimeOptions, 'states' | 'state' | 'initialState'> & {
    states?: Array<XTendStateDefinition<TState>>;
    state?: Array<XTendStateDefinition<TState>>;
    initialState?: Partial<TState>;
  };

export type XTendStore<TState extends object = Record<string, unknown>> =
  Omit<RmtStateSelectorRuntime, 'getState' | 'setState' | 'patchState'> & {
    getState<TKey extends keyof TState>(id: TKey): TState[TKey];
    setState<TKey extends keyof TState>(id: TKey, value: TState[TKey], metadata?: Record<string, unknown>): ReturnType<RmtStateSelectorRuntime['setState']>;
    patchState<TKey extends keyof TState>(id: TKey, patch: TState[TKey] extends Record<string, unknown> ? Partial<TState[TKey]> : never, metadata?: Record<string, unknown>): ReturnType<RmtStateSelectorRuntime['patchState']>;
  };

export interface XTendRegistryConfiguration {
  orchestration?: 'kernel' | 'lightweight';
  strict?: boolean;
  artifact?: Record<string, unknown>;
  schedules?: Array<Record<string, unknown>>;
  fibers?: Array<Record<string, unknown>>;
  fabric?: XtendFabricApi | false;
  ownsFabric?: boolean;
  replaceDefaults?: boolean;
  windowTarget?: Window | typeof globalThis;
  documentTarget?: Document;
  scheduler?: RmtBrowserScheduler;
  renderer?: RmtDomDescriptorRenderer;
}

export interface XTendResolvedRegistryConfiguration {
  windowTarget: XTendRegistryConfiguration['windowTarget'] | null;
  documentTarget: Document | null;
  scheduler: RmtBrowserScheduler | null;
  renderer: RmtDomDescriptorRenderer | null;
}

export interface XTendScheduleOptions {
  endpointName?: string;
  scope?: string;
  kind?: 'idle' | 'after_paint' | 'delay';
  timeout?: number;
  delayMs?: number;
  lane?: string;
  correlationId?: string;
}

export interface XTendKernelHost {
  readonly schema: string;
  readonly mode: 'kernel';
  readonly artifact: Readonly<Record<string, unknown>>;
  readonly controller: Readonly<Record<string, unknown>>;
  readonly runtime: unknown;
  readonly core: unknown;
  readonly performance: unknown;
  readonly schedulerBridge: unknown;
  readonly fabric: XtendFabricApi | null;
  snapshot(): Readonly<Record<string, unknown>>;
}

export type XTendHost = XTendKernelHost | { readonly schema: string; readonly mode: 'lightweight'; snapshot(): Readonly<Record<string, unknown>> };

export declare function configureXTend(options?: XTendRegistryConfiguration): Readonly<XTendResolvedRegistryConfiguration>;
export declare function getXTendConfiguration(): Readonly<XTendResolvedRegistryConfiguration>;
export declare function readyXTend(options?: XTendRegistryConfiguration): Promise<XTendHost>;
export declare function getXTendHost(): XTendHost;
export declare function getXTendSnapshot(): Readonly<Record<string, unknown>>;
export declare function createXTendKernelArtifact(options?: XTendRegistryConfiguration): Readonly<Record<string, unknown>>;
export declare function schedule(callback: (deadline?: unknown) => void, options?: XTendScheduleOptions): () => void;
export declare function afterPaint(callback: () => void): () => void;
export declare function render<TDescriptor extends XTendDescriptor>(root: Element, descriptor: TDescriptor, options?: RmtDomDescriptorRenderOptions): ReturnType<RmtDomDescriptorRenderer['render']>;
export declare function render(root: Element, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): ReturnType<RmtDomDescriptorRenderer['render']>;
export declare function renderNode<TDescriptor extends XTendDescriptor>(descriptor: TDescriptor, options?: RmtDomDescriptorRenderOptions): ReturnType<RmtDomDescriptorRenderer['renderNode']>;
export declare function renderNode(descriptor: unknown, options?: RmtDomDescriptorRenderOptions): ReturnType<RmtDomDescriptorRenderer['renderNode']>;
export declare function renderKeyed<TDescriptor extends XTendDescriptor>(root: Element, descriptors: TDescriptor[], options?: RmtDomDescriptorRenderOptions): ReturnType<RmtDomDescriptorRenderer['renderKeyed']>;
export declare function patchElement<TDescriptor extends XTendElementDescriptor>(element: Element, descriptor: TDescriptor, options?: RmtDomDescriptorRenderOptions): ReturnType<RmtDomDescriptorRenderer['patchElement']>;
export declare function loadComponent(tag: string, options?: XTendEnsureComponentOptions): Promise<boolean>;
export declare function hydrate(root?: Document | ShadowRoot | Element, options?: XTendHydrateTreeOptions): Promise<XTendHydrateTreeDetail>;
export declare function boot(options?: XTendInitiateOptions): Promise<XTendLoaderBootResult>;
export declare function disposeXTend(): void;

export { createRmtBrowserScheduler } from './xtendrmt/rmt-browser-scheduler';
export { createRmtDomDescriptorRenderer } from './xtendrmt/rmt-dom-descriptor-renderer';
export { createRmtAppRuntime } from './xtendrmt/rmt-app-runtime';
export { createRmtStateSelectorRuntime } from './xtendrmt/rmt-state-selector-runtime';
export { createRmtActionEffectRuntime } from './xtendrmt/rmt-action-effect-runtime';
export { createRmtEventRoutingRuntime } from './xtendrmt/rmt-event-routing-runtime';
export { createRmtAnimationEngineRuntime } from './xtendrmt/rmt-animation-engine-runtime';
export { createRmtFormValidationRuntime } from './xtendrmt/rmt-form-validation-runtime';
export { createRmtSurfaceTransitionRuntime } from './xtendrmt/rmt-surface-transition-runtime';
export { createRmtSurfaceResourceGraphRuntime } from './xtendrmt/rmt-surface-resource-graph-runtime';

export declare function createApp<TState extends object = Record<string, unknown>>(options?: XTendAppOptions<TState>): XTendAppRuntime<TState>;
export declare function createStore<TState extends object = Record<string, unknown>>(options?: XTendStoreOptions<TState>): XTendStore<TState>;
export declare function createEffects(options?: RmtActionEffectRuntimeOptions): RmtActionEffectRuntime;
export declare function createRouter(options?: RmtEventRoutingRuntimeOptions): RmtEventRoutingRuntime;
export declare function createAnimator(options?: RmtAnimationEngineRuntimeOptions): RmtAnimationEngineRuntime;
export declare function createValidator(options?: RmtFormValidationRuntimeOptions): RmtFormValidationRuntime;
export declare function createTransitions(options?: RmtSurfaceTransitionRuntimeOptions): RmtSurfaceTransitionRuntime;
export declare function createResources(options?: RmtSurfaceResourceGraphRuntimeOptions): RmtSurfaceResourceGraphRuntime;
export declare function createFabric(options?: Record<string, unknown>): Promise<XtendFabricApi>;
export { createFabric as createXtendFabric };
