import type { ResourceFactory, RuntimeHostSnapshot } from './runtime-host-controller';
export function createCooperativeResourceScope(options?: {
  allowedResources?: readonly string[];
  onRelease?(resource: string, error: unknown | null): void;
}): Readonly<{
  register(name: string, start: ResourceFactory): () => void;
  start(): void;
  stop(): void;
  beginShutdown(): void;
  dispose(): void;
  snapshot(): RuntimeHostSnapshot['resources'];
}>;
