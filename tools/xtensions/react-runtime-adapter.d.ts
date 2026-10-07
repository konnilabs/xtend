import type { RuntimeHostOptions, RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostOptions, RuntimeHostController, ComponentCapabilities } from './runtime-host-controller';
export function createReactRuntimeAdapter(options: RuntimeHostOptions): RuntimeHostController;
export function normalizeReactPeers(peers: unknown): { versions: Record<string, string> };
