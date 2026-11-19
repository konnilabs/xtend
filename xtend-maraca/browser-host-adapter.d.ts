export const COMPONENT_COMMAND_SCHEMA: 'xtend.rmt.component-command.v1';
export const COMPONENT_COMMAND_RESULT_SCHEMA: 'xtend.maraca.component-command-result.v1';
export const MARACA_BROWSER_HOST_API_VERSION: '5.0.0';

export interface MaracaBrowserHostAdapter {
  readonly schema: 'xtend.maraca.browser-host-adapter.v2';
  publish(name: string, detail: unknown): void;
  runtimeApi(name: string): Record<string, unknown> | null;
  readModelSnapshot(runtime: Readonly<{ model?: { snapshot(): unknown } }> | null): Readonly<Record<string, unknown>> | null;
  snapshotHandle(handle: { snapshot(): unknown } | null, schema: string): Readonly<{ schema: string; snapshot(): unknown }> | null;
  installPublicFacades(values?: Readonly<Record<string, unknown>>): boolean;
  clearPublicFacades(): boolean;
  attachCss(root: ParentNode): boolean;
  createRenderer(options?: Readonly<Record<string, unknown>>): { commit(request: Readonly<Record<string, unknown>>): unknown; dispose?(target?: Node, options?: Readonly<{ clearOwnedDom?: boolean }>): unknown };
  ensureComponent(tag: string): Promise<string>;
  ensureComponents(tags: readonly string[]): Promise<string[]>;
  invokeComponentCommand(root: ParentNode, record: Readonly<Record<string, unknown>>): Promise<Readonly<Record<string, unknown>>>;
  createHydrationPort(root: ParentNode, options?: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
  createKernelController(options?: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
  dispose(): number;
}

export interface MaracaNativeBrowserHostAdapter extends Omit<MaracaBrowserHostAdapter, 'schema'> {
  readonly schema: 'xtend.maraca.browser-host-adapter.v3';
  /** Read-only inspection; does not adopt or mutate SSR metadata. */
  inspectServerShell(root: ParentNode | null, suppliedPayload?: unknown): Readonly<{ active: boolean; hasPayload: boolean }>;
}
export interface MaracaLifecycleBrowserHostAdapter extends Omit<MaracaNativeBrowserHostAdapter, 'schema'> {
  readonly schema: 'xtend.maraca.browser-host-adapter.v4';
}
export interface MaracaOrchestratedBrowserHostAdapter extends Omit<MaracaNativeBrowserHostAdapter, 'schema'> { readonly schema: 'xtend.maraca.browser-host-adapter.v5' }
export function createMaracaBrowserHostAdapter(configuration: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.browser-composition-root.v13' }, dependencies?: Readonly<Record<string, unknown>>): MaracaOrchestratedBrowserHostAdapter;
export function createMaracaBrowserHostAdapter(
  configuration: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.browser-composition-root.v12' },
  dependencies?: Readonly<Record<string, unknown>>
): MaracaLifecycleBrowserHostAdapter;
export function createMaracaBrowserHostAdapter(
  configuration: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.browser-composition-root.v11' },
  dependencies?: Readonly<Record<string, unknown>>
): MaracaNativeBrowserHostAdapter;
export function createMaracaBrowserHostAdapter(
  configuration?: Readonly<Record<string, unknown>>,
  dependencies?: Readonly<Record<string, unknown>>
): MaracaBrowserHostAdapter;
