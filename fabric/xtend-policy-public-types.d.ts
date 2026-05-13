export type XtendJsonPrimitive = string | number | boolean | null;
export type XtendJsonValue = XtendJsonPrimitive | XtendJsonValue[] | { [key: string]: XtendJsonValue };
export type XtendPolicySeverity = 'debug' | 'info' | 'warn' | 'error' | string;
export type XtendPolicyStatus = 'accepted' | 'refused' | 'blocked' | 'warning' | 'ok' | string;

export interface XtendPolicyDiagnostic {
  code?: string;
  message?: string;
  level?: XtendPolicySeverity;
  severity?: XtendPolicySeverity;
  source?: string;
  phase?: string;
  key?: string;
  codes?: string[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface XtendPolicyReport<TData = unknown> {
  schema?: string;
  ok: boolean;
  errors?: string[];
  warnings?: string[];
  diagnostics?: Array<string | XtendPolicyDiagnostic>;
  data?: TData;
  [key: string]: unknown;
}

export interface XtendPolicyOptions {
  rootDir?: string;
  cwd?: string;
  componentRef?: string;
  tag?: string;
  mode?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export type XtendPolicyConstant<TValue = unknown> = TValue;
export type XtendPolicyFunction<TReturn = unknown> = (...args: unknown[]) => TReturn;
export type XtendPolicyFactory<TReturn = unknown> = (...args: unknown[]) => TReturn;

export interface XtendFabricLaneProfile {
  priority?: number;
  budgetClass?: string;
  deadlineMs?: number;
  preferIdle?: boolean;
  coalesceKey?: string;
  endpointName?: string;
  scheduleId?: string;
  scope?: string;
  [key: string]: unknown;
}

export interface XtendFabricFiberInput {
  schema?: string;
  kind?: string;
  phase?: string;
  source?: string;
  componentRef?: string;
  scope?: string;
  lane?: string;
  scheduleRef?: string;
  endpointNameHint?: string;
  preferIdle?: boolean;
  deadlineMs?: number;
  budgetClass?: string;
  coalesceKey?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface XtendFabricFiberResult<TValue = unknown> {
  schema?: string;
  ok?: boolean;
  value?: TValue;
  fiber?: XtendFabricFiberInput;
  diagnostics?: XtendPolicyDiagnostic[];
  [key: string]: unknown;
}

export interface XtendRmtScheduleRecord {
  schema?: string;
  id: string;
  endpointName?: string;
  scope?: string;
  lane: string;
  priority?: number;
  deadlineMs?: number;
  preferIdle?: boolean;
  coalesceKey?: string;
  budgetClass?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface XtendHydrationDecision {
  schema?: string;
  policy: string;
  mode?: string;
  trigger?: string;
  componentRef?: string;
  lane: string;
  rmtLane?: string;
  scheduleRef?: string;
  endpointNameHint?: string;
  preferIdle?: boolean;
  nonBlocking?: boolean;
  userBlockingAllowed?: boolean;
  rmtDelegation?: boolean;
  diagnostics: XtendPolicyDiagnostic[];
  fiberInput: XtendFabricFiberInput;
  [key: string]: unknown;
}

export interface XtendA11ySignal {
  schema?: string;
  signal: string;
  componentRef?: string;
  region?: string;
  liveRegion?: string;
  required?: boolean;
  aria?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface XtendSecurityClassification {
  schema?: string;
  ok: boolean;
  status?: XtendPolicyStatus;
  diagnostics: Array<string | XtendPolicyDiagnostic>;
  [key: string]: unknown;
}
