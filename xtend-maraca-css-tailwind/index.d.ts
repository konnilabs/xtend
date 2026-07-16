import type { CssProviderImplementation } from '@ccslabs/xtend-maraca/css-provider';
import type { TailwindToolchainApi } from './toolchain';

export const TAILWIND_ADAPTER_VERSION: '0.1.0';
export const TAILWIND_PROVIDER_ID: 'tailwind';
export const TAILWIND_VERSION: '4.3.2';

export interface TailwindCssProviderOptions {
  rootDir?: string;
  toolchain?: TailwindToolchainApi;
  toolchainOptions?: Record<string, unknown>;
  tokenBridge?: { cssText: string; fingerprint?: string; [key: string]: unknown };
  designKitStyles?: string;
}

export function createTailwindCssProvider(options?: TailwindCssProviderOptions): CssProviderImplementation;
export { createTailwindToolchainApi } from './toolchain';
export { createMaterialRecipeRegistry, createMaterialRecipeStylesheet, createRmtCssSourceInventory } from './source-inventory';
