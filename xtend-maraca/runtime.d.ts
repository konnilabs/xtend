export const MARACA_INLINE_REGISTRY_SCHEMA: 'xtend.maraca.inline-registry.v1';

export interface MaracaInlineRegistryEntry {
  tag: string;
  module?: string;
  load?: () => Promise<unknown>;
}

export function createInlineComponentRegistry(entries?: MaracaInlineRegistryEntry[]): Readonly<Record<string, () => Promise<unknown>>>;
export function createPublicNameReservationSet(names?: string[]): Set<string>;
export function isPublicNameReserved(name: string, reservations?: string[] | Set<string>): boolean;
