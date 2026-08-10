import type { MaracaPlanRuntime, MaracaPlanRuntimeOptions, MaracaPlanRuntimeSnapshot } from './plan-runtime';

export const COMPONENT_COMMAND_SCHEMA: 'xtend.rmt.component-command.v1';
export const COMPONENT_COMMAND_RESULT_SCHEMA: 'xtend.maraca.component-command-result.v1';

export interface MaracaBrowserFacade {
  readonly schema: string;
  /** The browser compatibility path resolves to this same immutable MVC facade. */
  readonly orchestration: MaracaBrowserFacade;
  readonly model: MaracaPlanRuntime['model'] | null;
  boot(options?: Readonly<Record<string, unknown>>): Promise<MaracaPlanRuntimeSnapshot & Readonly<Record<string, unknown>>>;
  dispatchCommand(command: string | Readonly<Record<string, unknown>>, payload?: unknown, metadata?: Readonly<Record<string, unknown>>): Promise<unknown>;
  dispatchStreamPatch(patch: Readonly<Record<string, unknown>>, metadata?: Readonly<Record<string, unknown>>): Promise<unknown>;
  snapshot(): MaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: MaracaPlanRuntimeSnapshot) => void): () => void;
  ensureComponent(tag: string): Promise<string>;
  dispose(reason?: string): Readonly<Record<string, unknown>>;
}

export interface MaracaBrowserCompositionRoot {
  readonly schema: 'xtend.maraca.browser-composition-root.v1';
  readonly config: Readonly<Record<string, unknown>>;
  readonly facade: MaracaBrowserFacade;
  boot(options?: Readonly<Record<string, unknown>>): ReturnType<MaracaBrowserFacade['boot']>;
  invokeComponentCommand(root: ParentNode | null, command: Readonly<Record<string, unknown>>): Promise<Readonly<Record<string, unknown>>>;
  dispose(reason?: string): Readonly<Record<string, unknown>>;
}

export function freezeMaracaConfiguration<T>(value: T): Readonly<T>;
export function createMaracaBrowserCompositionRoot(
  configuration?: Readonly<Record<string, unknown>>,
  dependencies?: Readonly<{
    createPlanRuntime?: (options: MaracaPlanRuntimeOptions) => MaracaPlanRuntime;
    runtimeModuleApis?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
    runtimeApis?: Readonly<Record<string, unknown>>;
    [key: string]: unknown;
  }>
): MaracaBrowserCompositionRoot;
