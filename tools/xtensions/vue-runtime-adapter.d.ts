import type { RuntimeHostOptions, RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostOptions, RuntimeHostController, ComponentCapabilities } from './runtime-host-controller';
export function createVueRuntimeAdapter(options: RuntimeHostOptions): RuntimeHostController;
export function normalizeVuePeers(peers: unknown): { versions: Record<string, string> };

export type { KernelRuntimeHostOptions, KernelRuntimeHostController, KernelComponentCapabilities } from './runtime-host-controller';
export type { GraphRuntimeHostOptions, GraphRuntimeHostController } from './runtime-host-controller';
export type { BudgetRuntimeHostOptions, BudgetRuntimeHostController, WorkBudgetPolicy } from './runtime-host-controller';
export type { NegotiatedRuntimeHostOptions, NegotiatedRuntimeHostController, HostCapabilityRequirements, RuntimeCapabilityFeature } from './runtime-host-controller';
export function createVueKernelRuntimeAdapter(options: import('./runtime-host-controller').NegotiatedRuntimeHostOptions): import('./runtime-host-controller').NegotiatedRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v6' };
export function createVueKernelRuntimeAdapter(options: import('./runtime-host-controller').BudgetRuntimeHostOptions & { readonly capabilityRequirements?: never }): import('./runtime-host-controller').BudgetRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v5' };
export function createVueKernelRuntimeAdapter(options: import('./runtime-host-controller').GraphRuntimeHostOptions & { readonly workBudget?: never; readonly capabilityRequirements?: never }): import('./runtime-host-controller').GraphRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v4' };
export function createVueKernelRuntimeAdapter(options: import('./runtime-host-controller').KernelRuntimeHostOptions & { readonly resourceGraph?: never; readonly workBudget?: never; readonly capabilityRequirements?: never }): import('./runtime-host-controller').KernelRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v3' };

export type { SSRRuntimeHostOptions, SSRRuntimeHostController, FrameworkSSRResult } from './runtime-host-controller';
export function createVueSSRRuntimeAdapter(options: import('./runtime-host-controller').SSRRuntimeHostOptions): import('./runtime-host-controller').SSRRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.vue-runtime-adapter.v7' };
export function normalizeVueSSRPeers(peers: unknown): { versions: Record<string, string> };
