export declare const RMT_BROWSER_SCHEDULER_SCHEMA: 'xtend.rmt.browser-scheduler.v1';
export interface RmtBrowserScheduler { readonly schema: typeof RMT_BROWSER_SCHEDULER_SCHEMA; afterPaint(callback: () => void): () => void; scheduleEndpoint(endpointName: string, scope: string, callback: (deadline?: unknown) => void, options?: { kind?: 'idle' | 'after_paint' | 'delay'; timeout?: number; delayMs?: number }): () => void; dispose(): void; snapshot(): Readonly<Record<string, unknown>>; }
export declare function createRmtBrowserScheduler(options?: { windowTarget?: Window }): RmtBrowserScheduler;
