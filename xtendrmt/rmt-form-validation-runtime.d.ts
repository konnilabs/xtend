export const RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA: 'xtend.rmt.form-validation-diagnostic.v1';
export const RMT_FORM_VALIDATION_RUNTIME_SCHEMA: 'xtend.rmt.form-validation-runtime.v1';

export type RmtFormValidationRuleKind = 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';

export interface RmtFormValidationRule {
  kind: RmtFormValidationRuleKind | string;
  value?: unknown;
}

export interface RmtFormValidationField {
  state: string;
  surface?: string | null;
  component?: string | null;
  rules: RmtFormValidationRule[];
  message?: string;
}

export interface RmtFormValidationGroup {
  id: string;
  mode?: 'blocking' | string;
  fields: RmtFormValidationField[];
  includes?: string[];
  targets?: Array<{ kind: 'action' | string; id: string }>;
}

export interface RmtFormValidationPlan {
  schema?: string;
  groups: RmtFormValidationGroup[];
  actionGates?: Array<{
    id?: string;
    group: string;
    action: string;
    operation?: string;
    commandState?: string | null;
  }>;
  statePatches?: Array<{
    id?: string;
    group: string;
    targetState: string;
    path?: string;
    invalidValue?: unknown;
    validValue?: unknown;
  }>;
}

export interface RmtFormValidationRuntimeOptions {
  validationPlan: RmtFormValidationPlan;
  stateRuntime?: unknown;
  root?: ParentNode | null;
  windowTarget?: Window | typeof globalThis;
  diagnostics?: unknown[];
  publishDiagnostic?: (diagnostic: unknown) => void;
}

export interface RmtFormValidationRuntime {
  schema: typeof RMT_FORM_VALIDATION_RUNTIME_SCHEMA;
  evaluateGroup(groupId: string, metadata?: Record<string, unknown>): unknown;
  validateAction(actionId: string, metadata?: Record<string, unknown>): { valid: boolean; gated: boolean; [key: string]: unknown };
  applyValidationPatches(metadata?: Record<string, unknown>): unknown;
  refresh(metadata?: Record<string, unknown>): unknown;
  operationForAction(actionId: string): string;
  listDiagnostics(): unknown[];
  snapshot(): unknown;
}

export function createRmtFormValidationRuntime(options?: RmtFormValidationRuntimeOptions): RmtFormValidationRuntime;

declare const api: {
  RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA: typeof RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA;
  RMT_FORM_VALIDATION_RUNTIME_SCHEMA: typeof RMT_FORM_VALIDATION_RUNTIME_SCHEMA;
  createRmtFormValidationRuntime: typeof createRmtFormValidationRuntime;
};

export default api;
