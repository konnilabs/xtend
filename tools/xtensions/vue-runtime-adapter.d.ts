import type { RuntimeHostOptions, RuntimeHostController } from './runtime-host-controller';
export type { RuntimeHostOptions, RuntimeHostController, ComponentCapabilities } from './runtime-host-controller';
export function createVueRuntimeAdapter(options: RuntimeHostOptions): RuntimeHostController;
export function normalizeVuePeers(peers: unknown): { versions: Record<string, string> };
