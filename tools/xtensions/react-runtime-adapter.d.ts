import type { RuntimeHostOptions, RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostOptions, RuntimeHostController, ComponentCapabilities } from './runtime-host-controller';
export function createReactRuntimeAdapter(options: RuntimeHostOptions): RuntimeHostController;
export function normalizeReactPeers(peers: unknown): { versions: Record<string, string> };

export type { KernelRuntimeHostOptions, KernelRuntimeHostController, KernelComponentCapabilities } from './runtime-host-controller';
export type { GraphRuntimeHostOptions, GraphRuntimeHostController } from './runtime-host-controller';
export type { BudgetRuntimeHostOptions, BudgetRuntimeHostController, WorkBudgetPolicy } from './runtime-host-controller';
export type { NegotiatedRuntimeHostOptions, NegotiatedRuntimeHostController, HostCapabilityRequirements, RuntimeCapabilityFeature } from './runtime-host-controller';
export function createReactKernelRuntimeAdapter(options: import('./runtime-host-controller').NegotiatedRuntimeHostOptions): import('./runtime-host-controller').NegotiatedRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.react-runtime-adapter.v6' };
export function createReactKernelRuntimeAdapter(options: import('./runtime-host-controller').BudgetRuntimeHostOptions & { readonly capabilityRequirements?: never }): import('./runtime-host-controller').BudgetRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.react-runtime-adapter.v5' };
export function createReactKernelRuntimeAdapter(options: import('./runtime-host-controller').GraphRuntimeHostOptions & { readonly workBudget?: never; readonly capabilityRequirements?: never }): import('./runtime-host-controller').GraphRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.react-runtime-adapter.v4' };
export function createReactKernelRuntimeAdapter(options: import('./runtime-host-controller').KernelRuntimeHostOptions & { readonly resourceGraph?: never; readonly workBudget?: never; readonly capabilityRequirements?: never }): import('./runtime-host-controller').KernelRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.react-runtime-adapter.v3' };

export type { SSRRuntimeHostOptions, SSRRuntimeHostController, FrameworkSSRResult } from './runtime-host-controller';
export function createReactSSRRuntimeAdapter(options: import('./runtime-host-controller').SSRRuntimeHostOptions): import('./runtime-host-controller').SSRRuntimeHostController & { readonly adapterSchema: 'xtend.xtensions.react-runtime-adapter.v7' };
export function normalizeReactSSRPeers(peers: unknown): { versions: Record<string, string> };
