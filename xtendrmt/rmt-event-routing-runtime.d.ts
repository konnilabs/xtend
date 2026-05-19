export const RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-event-routing-diagnostic.v1';
export const RMT_EVENT_ROUTING_RUNTIME_SCHEMA: 'xtend.epic18.rmt-event-routing-runtime.v1';

export type RmtEventRoutingKind = 'dom' | 'custom' | 'keyboard' | 'form' | 'surface' | 'drop' | string;
export type RmtEventActionMode = 'run-action' | 'cancel-action' | string;
export type RmtEventRetargetPolicy = 'target' | 'current-target' | 'composed-path' | string;

export interface RmtEventGovernance {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  stopImmediatePropagation?: boolean;
  retarget?: RmtEventRetargetPolicy;
}

export interface RmtEventCondition {
  left?: unknown;
  op?: 'equals' | 'not-equals' | 'truthy' | 'falsy' | 'includes' | string;
  operator?: string;
  right?: unknown;
  equals?: unknown;
  value?: unknown;
}

export interface RmtPayloadContract {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'nullable' | string;
  required?: string[];
  properties?: Record<string, RmtPayloadContract | string>;
  additionalProperties?: boolean;
}

export interface RmtEventBindingDefinition {
  id: string;
  kind?: RmtEventRoutingKind;
  event?: string;
  eventName?: string;
  type?: string;
  target?: unknown;
  selector?: string;
  ref?: string;
  component?: string;
  componentId?: string;
  action?: string;
  actionId?: string;
  actionMode?: RmtEventActionMode;
  operation?: RmtEventActionMode;
  mode?: RmtEventActionMode;
  owner?: string;
  ownerId?: string;
  scope?: string;
  payload?: unknown;
  payloadContract?: RmtPayloadContract;
  contract?: RmtPayloadContract;
  governance?: RmtEventGovernance;
  condition?: RmtEventCondition;
  when?: RmtEventCondition;
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  stopImmediatePropagation?: boolean;
  retarget?: RmtEventRetargetPolicy;
  enabled?: boolean;
}

export interface RmtEventRouteDiagnostic {
  schema: typeof RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  details?: Record<string, unknown>;
}

export interface RmtEventRouteResult {
  schema: 'xtend.epic18.rmt-event-route-result.v1';
  bindingId: string;
  event: string;
  component: string;
  action: string;
  status: string;
  payload?: unknown;
  reason?: string;
  contractErrors?: string[];
  actionResult?: unknown;
  governance?: Record<string, unknown>;
}

export interface RmtEventAttachReport {
  schema: 'xtend.epic18.rmt-event-attach-report.v1';
  attachedCount: number;
  attached: Array<{ bindingId: string; owner: string; event: string; component: string }>;
}

export interface RmtEventDetachReport {
  schema: 'xtend.epic18.rmt-event-detach-report.v1';
  owner: string;
  detachedCount: number;
}

export interface RmtEventRoutingRuntime {
  schema: typeof RMT_EVENT_ROUTING_RUNTIME_SCHEMA;
  attach(root?: unknown): RmtEventAttachReport;
  detachOwner(ownerId?: string): RmtEventDetachReport;
  detachAll(): RmtEventDetachReport;
  routeEvent(bindingId: string, event?: unknown, metadata?: Record<string, unknown>): Promise<RmtEventRouteResult>;
  createPayload(binding: RmtEventBindingDefinition, event?: unknown, metadata?: Record<string, unknown>): unknown;
  listBindings(): RmtEventBindingDefinition[];
  listAttached(): Array<{ bindingId: string; owner: string; event: string }>;
  listRoutes(): RmtEventRouteResult[];
  listDiagnostics(): RmtEventRouteDiagnostic[];
}

export interface RmtEventRoutingRuntimeOptions {
  bindings?: RmtEventBindingDefinition[];
  events?: RmtEventBindingDefinition[];
  eventBindings?: RmtEventBindingDefinition[];
  actionRuntime?: {
    runAction?(actionId: string, payload?: unknown, metadata?: Record<string, unknown>): Promise<unknown> | unknown;
    cancelAction?(actionId: string): unknown;
  };
  root?: unknown;
  targets?: Record<string, unknown>;
  targetResolver?: (binding: RmtEventBindingDefinition, root?: unknown) => unknown;
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
}

export function createRmtEventRoutingRuntime(options?: RmtEventRoutingRuntimeOptions): RmtEventRoutingRuntime;
