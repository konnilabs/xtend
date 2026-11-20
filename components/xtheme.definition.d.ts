export * from './xtheme.js';
import type { XThemeManager } from './xtheme.js';
import type { XTendStateRuntime } from './xtend-state.js';
export declare function createThemeManager(options: { state: Pick<XTendStateRuntime, 'get' | 'set' | 'subscribe'>; window?: Window; document?: Document; storage?: Pick<Storage, 'getItem' | 'setItem'>; fetch?: typeof fetch; getComputedStyle?: typeof getComputedStyle; signal?: AbortSignal; release?(): void }): XThemeManager & { dispose(): void };
