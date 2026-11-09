import type { RuntimeHostOptions, RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostOptions, RuntimeHostController, ComponentCapabilities } from './runtime-host-controller';
export function createVueRuntimeAdapter(options: RuntimeHostOptions): RuntimeHostController;
export function normalizeVuePeers(peers: unknown): { versions: Record<string, string> };

export type { KernelRuntimeHostOptions, KernelRuntimeHostController, KernelComponentCapabilities } from './runtime-host-controller';
export type { GraphRuntimeHostOptions, GraphRuntimeHostController } from './runtime-host-controller';
export function createVueKernelRuntimeAdapter(options: import('./runtime-host-controller').GraphRuntimeHostOptions): import('./runtime-host-controller').GraphRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v4' };
export function createVueKernelRuntimeAdapter(options: import('./runtime-host-controller').KernelRuntimeHostOptions): import('./runtime-host-controller').KernelRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v3' };
