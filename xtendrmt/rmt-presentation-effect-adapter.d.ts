export const RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA: 'xtend.rmt.presentation-effect-adapter.v1';
export const RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA: 'xtend.rmt.presentation-effect-diagnostic.v1';

export interface RmtPresentationEffect {
  readonly id?: string;
  readonly kind?: string;
  readonly target?: string;
  readonly source?: { readonly target?: string; readonly ref?: string } | string;
  readonly componentCommand?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface RmtPresentationEffectContext extends Readonly<Record<string, unknown>> {
  readonly payload?: unknown;
  readonly result?: unknown;
  readonly actionResult?: unknown;
  readonly phase?: string;
}

export interface PresentationEffectPort {
  readonly schema?: string;
  invoke(effect: RmtPresentationEffect, context?: RmtPresentationEffectContext): unknown | Promise<unknown>;
  snapshot?(): Readonly<Record<string, unknown>>;
  listDiagnostics?(): ReadonlyArray<Readonly<Record<string, unknown>>>;
  dispose?(): boolean | void;
}

export interface RmtPresentationEffectAdapterOptions {
  root: ParentNode;
  modelReader?: {
    getState(id: string): unknown;
  } | null;
  domRenderer?: {
    commit(request: Readonly<Record<string, unknown>>): unknown;
    isUrlAllowed?(value: unknown): boolean;
  } | null;
  componentRegistry?: {
    ensureTags?(tags: string[]): unknown | Promise<unknown>;
    ensure?(tag: string): unknown | Promise<unknown>;
  } | null;
  transitionRuntime?: {
    applyVisibilityPatch(input: Readonly<Record<string, unknown>>): unknown | Promise<unknown>;
  } | null;
  surfaceRuntime?: {
    listOverlays?(): ReadonlyArray<Record<string, unknown>>;
    closeOverlay?(id: string, metadata?: Readonly<Record<string, unknown>>): unknown | Promise<unknown>;
  } | null;
  surfaceLifecyclePort?: {
    materializeSurface?(id: string, metadata?: Readonly<Record<string, unknown>>): unknown;
  } | null;
  componentCommandPort?(
    command: Readonly<Record<string, unknown>>,
    context: Readonly<Record<string, unknown>>
  ): unknown | Promise<unknown>;
  customEffectAdapter?: PresentationEffectPort | ((effect: RmtPresentationEffect, context: RmtPresentationEffectContext) => unknown | Promise<unknown>);
  /** @deprecated Use customEffectAdapter. */
  effectAdapter?: RmtPresentationEffectAdapterOptions['customEffectAdapter'];
  resolveSurface?(surfaceId: string): Element | null;
  refreshSurfaceIndex?(): unknown;
  readProjectedVisibility?(surfaceId: string, nextHidden: boolean): boolean;
  writeProjectedVisibility?(surfaceId: string, nextHidden: boolean): unknown;
  captureDisposer?(value: unknown): unknown;
  publishDiagnostic?(diagnostic: Readonly<Record<string, unknown>>): unknown;
  windowTarget?: Window | typeof globalThis;
  strict?: boolean;
  strictMaraca?: boolean;
}

export interface RmtPresentationEffectAdapter extends PresentationEffectPort {
  readonly schema: typeof RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA;
  snapshot(): Readonly<{
    schema: typeof RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA;
    disposed: boolean;
    diagnosticCount: number;
    strict: boolean;
    capabilities: Readonly<Record<string, boolean>>;
  }>;
  listDiagnostics(): ReadonlyArray<Readonly<Record<string, unknown>>>;
  dispose(): boolean;
}

export function createRmtPresentationEffectAdapter(options: RmtPresentationEffectAdapterOptions): RmtPresentationEffectAdapter;

declare const api: Readonly<{
  RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA: typeof RMT_PRESENTATION_EFFECT_ADAPTER_SCHEMA;
  RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA: typeof RMT_PRESENTATION_EFFECT_DIAGNOSTIC_SCHEMA;
  createRmtPresentationEffectAdapter: typeof createRmtPresentationEffectAdapter;
}>;

export default api;
