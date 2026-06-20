export interface XtendRmtCommandSource {
  kind: string;
  id: string;
  event: string;
  surfaceId: string;
}

export interface XtendRmtCommandDetail<TPayload = unknown> {
  schema: typeof XTEND_RMT_COMMAND_SCHEMA;
  id: string;
  source: XtendRmtCommandSource;
  command: string;
  payload: TPayload;
  target: unknown;
  correlationId: string;
  runId: string;
  lane: string;
  timestamp: string;
}

export interface XtendRmtCommandOptions<THost = Element, TPayload = unknown> {
  id?: string;
  command?: string | ((host: THost, eventName: string, payload: TPayload) => string);
  sourceId?: string;
  sourceKind?: string;
  fallbackId?: string;
  surfaceId?: string;
  payloadBase?: Record<string, unknown> | ((host: THost, eventName: string, payload: TPayload) => Record<string, unknown>);
  payloadActionFallback?: boolean;
  mergePayload?: boolean;
  target?: unknown;
  correlationId?: string;
  runId?: string;
  lane?: string;
  defaultLane?: string;
  timestamp?: string;
  clock?: () => number;
}

export declare const XTEND_RMT_COMMAND_SCHEMA: 'xtend.rmt.command.v1';
export declare function createXtendRmtCommandDetail<THost = Element, TPayload = unknown>(
  host: THost,
  eventName: string,
  payload?: TPayload,
  options?: XtendRmtCommandOptions<THost, TPayload>
): XtendRmtCommandDetail<TPayload | Record<string, unknown>>;
export declare function createXtendButtonPayloadBase(host: Element): { id: string; label: string };
export declare function dispatchXtendRmtCommand<THost extends EventTarget = Element, TPayload = unknown>(
  host: THost,
  eventName: string,
  payload?: TPayload,
  options?: XtendRmtCommandOptions<THost, TPayload>
): boolean;
