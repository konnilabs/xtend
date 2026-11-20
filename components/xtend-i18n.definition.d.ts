export * from './xtend-i18n.js';
import type { XtendI18nApi } from './xtend-i18n.js';
import type { XTendStateRuntime } from './xtend-state.js';
export declare function createXtendI18n(options?: { managed?: boolean; root?: Document | ShadowRoot | Element; signal?: AbortSignal; stateRuntime?: XTendStateRuntime }): XtendI18nApi & { dispose(): void };
