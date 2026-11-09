import type { RuntimeHostOptions, RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostOptions, RuntimeHostController, ComponentCapabilities } from './runtime-host-controller';
export function createReactRuntimeAdapter(options: RuntimeHostOptions): RuntimeHostController;
export function normalizeReactPeers(peers: unknown): { versions: Record<string, string> };

export type { KernelRuntimeHostOptions, KernelRuntimeHostController, KernelComponentCapabilities } from './runtime-host-controller';
export function createReactKernelRuntimeAdapter(options: import('./runtime-host-controller').KernelRuntimeHostOptions): import('./runtime-host-controller').KernelRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.react-runtime-adapter.v3' };
