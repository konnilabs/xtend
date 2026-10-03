export const RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA: 'xtend.rmt.form-validation-diagnostic.v1';
export const RMT_FORM_VALIDATION_RUNTIME_SCHEMA: 'xtend.rmt.form-validation-runtime.v2';

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
  domRenderer?: {
    commit(request: Record<string, unknown>): unknown;
    dispose?(target?: Node, options?: { clearOwnedDom?: boolean }): void;
  };
  /** @deprecated Use domRenderer. */
  renderer?: {
    commit(request: Record<string, unknown>): unknown;
    dispose?(target?: Node, options?: { clearOwnedDom?: boolean }): void;
  };
  documentTarget?: Document | null;
  diagnosticsHub?: {
    publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown;
  };
  diagnosticChannel?: string;
  windowTarget?: Window | typeof globalThis;
  diagnostics?: unknown[];
  strict?: boolean;
  strictMaraca?: boolean;
  publishDiagnostic?: (diagnostic: unknown) => void;
  modelReader?: RmtFormValidationModelReader;
  modelCommandPort?: RmtFormValidationModelCommandPort;
  globalTarget?: typeof globalThis;
  resolveTarget?: (target: RmtFormValidationViewTarget, root?: ParentNode | null) => Element | null;
}

export interface RmtFormValidationModelReader {
  getState<T = unknown>(id: string): T;
  snapshot?(): { states?: Record<string, unknown>; [key: string]: unknown };
}

export interface RmtFormValidationEvaluationRequest {
  /** Host validation messages, scoped to the selected action's declared fields. */
  serverErrors?: Record<string, string | string[]>;
  model?: Record<string, unknown>;
  states?: Record<string, unknown>;
  snapshot?: { states?: Record<string, unknown>; [key: string]: unknown };
  revealedFields?: string[];
  reveal?: boolean;
  report?: boolean;
  [key: string]: unknown;
}

export interface RmtFormValidationModelOperation {
  operation: 'set';
  state: string;
  value: unknown;
  metadata: {
    operation: 'validation.patch';
    validationGroup: string;
    validationPatch: string | null;
    valid: boolean;
  };
}

export interface RmtFormValidationModelCommandPort {
  apply(
    operations: readonly RmtFormValidationModelOperation[],
    metadata?: Record<string, unknown>
  ): unknown;
}

export interface RmtFormValidationViewTarget {
  readonly state: string;
  readonly surface: string | null;
  readonly component: string | null;
  readonly field: string | null;
}

export interface RmtFormValidationViewProjection {
  readonly schema: 'xtend.rmt.form-validation-view-projection.v1';
  readonly group: string;
  readonly target: RmtFormValidationViewTarget;
  readonly invalid: boolean;
  readonly revealed: boolean;
  readonly report: boolean;
  readonly message: string;
}

export interface RmtFormValidationEvaluation {
  readonly schema: 'xtend.rmt.form-validation-evaluation.v1';
  readonly valid: boolean;
  readonly results: readonly unknown[];
  readonly modelOperations: readonly RmtFormValidationModelOperation[];
  readonly viewProjection: readonly RmtFormValidationViewProjection[];
  readonly diagnostics: readonly unknown[];
}

export interface RmtFormValidationViewProjectionPlan {
  readonly schema: 'xtend.rmt.form-validation-view-projection-plan.v1';
  readonly valid: boolean;
  readonly projectionCount: number;
  readonly projections: readonly RmtFormValidationViewProjection[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RmtFormValidationViewFinalizeReport {
  readonly schema: 'xtend.rmt.form-validation-view-finalize-report.v1';
  readonly valid: boolean;
  readonly projectionCount: number;
  readonly reportedCount: number;
  readonly missingCount: number;
  readonly reported: readonly RmtFormValidationViewTarget[];
  readonly missing: readonly RmtFormValidationViewTarget[];
}

export interface RmtFormValidationEvaluator {
  readonly schema: 'xtend.rmt.form-validation-evaluator.v1';
  evaluate(request?: RmtFormValidationEvaluationRequest, groupIds?: string[] | null): RmtFormValidationEvaluation;
  evaluateGroup(groupId: string, request?: RmtFormValidationEvaluationRequest): Readonly<Record<string, unknown>>;
  evaluateAction(actionId: string, request?: RmtFormValidationEvaluationRequest): Readonly<Record<string, unknown>>;
  operationForAction(actionId: string): string;
  snapshot(): Readonly<Record<string, unknown>>;
}

export interface RmtFormValidationViewProjector {
  readonly schema: 'xtend.rmt.form-validation-view-projector.v1';
  prepare(evaluation: RmtFormValidationEvaluation, metadata?: Record<string, unknown>): RmtFormValidationViewProjectionPlan;
  finalize(
    planOrEvaluation: RmtFormValidationViewProjectionPlan | RmtFormValidationEvaluation,
    metadata?: Record<string, unknown>
  ): RmtFormValidationViewFinalizeReport;
  project(evaluation: RmtFormValidationEvaluation, metadata?: Record<string, unknown>): Readonly<{
    schema: 'xtend.rmt.form-validation-view-project-report.v1';
    valid: boolean;
    projectionCount: number;
    appliedCount: number;
    missingCount: number;
    applied: readonly RmtFormValidationViewTarget[];
    missing: readonly RmtFormValidationViewTarget[];
    finalization: RmtFormValidationViewFinalizeReport;
  }>;
  publish(name: string, detail: unknown): boolean;
  dispose(): Readonly<{
    schema: 'xtend.rmt.form-validation-view-projector.v1';
    disposed: true;
    alreadyDisposed: boolean;
  }>;
}

export interface RmtFormValidationRuntime {
  schema: typeof RMT_FORM_VALIDATION_RUNTIME_SCHEMA;
  readonly evaluator: RmtFormValidationEvaluator;
  readonly viewProjector: RmtFormValidationViewProjector;
  evaluate(metadata?: Record<string, unknown>, groupIds?: string[] | null): {
    schema: 'xtend.rmt.form-validation-evaluation.v1';
    valid: boolean;
    results: unknown[];
  };
  apply(evaluation: unknown, metadata?: Record<string, unknown>): {
    schema: 'xtend.rmt.form-validation-apply-report.v1';
    valid: boolean;
    groupCount: number;
    patchReport: unknown;
  };
  evaluateGroup(groupId: string, metadata?: Record<string, unknown>): unknown;
  validateAction(actionId: string, metadata?: Record<string, unknown>): { valid: boolean; gated: boolean; [key: string]: unknown };
  applyValidationPatches(metadata?: Record<string, unknown>, evaluation?: unknown): unknown;
  refresh(metadata?: Record<string, unknown>): unknown;
  operationForAction(actionId: string): string;
  listDiagnostics(): unknown[];
  snapshot(): unknown;
  dispose(): {
    schema: 'xtend.rmt.form-validation-dispose-report.v1';
    disposed: true;
    alreadyDisposed: boolean;
  };
}

export function createRmtFormValidationRuntime(options?: RmtFormValidationRuntimeOptions): RmtFormValidationRuntime;
export function createRmtFormValidationEvaluator(options?: {
  validationPlan?: RmtFormValidationPlan;
  plan?: RmtFormValidationPlan;
  modelReader?: RmtFormValidationModelReader;
  model?: RmtFormValidationModelReader;
  stateRuntime?: RmtFormValidationModelReader;
}): RmtFormValidationEvaluator;
export function createRmtFormValidationViewProjector(options?: {
  root?: ParentNode | null;
  domRenderer?: RmtFormValidationRuntimeOptions['domRenderer'];
  renderer?: RmtFormValidationRuntimeOptions['renderer'];
  strict?: boolean;
  resolveTarget?: (target: RmtFormValidationViewTarget, root?: ParentNode | null) => Element | null;
  windowTarget?: Window | typeof globalThis | null;
  globalTarget?: typeof globalThis;
  documentTarget?: Document | null;
  publishDiagnostic?: (diagnostic: unknown) => void;
}): RmtFormValidationViewProjector;

declare const api: {
  RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA: typeof RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA;
  RMT_FORM_VALIDATION_RUNTIME_SCHEMA: typeof RMT_FORM_VALIDATION_RUNTIME_SCHEMA;
  createRmtFormValidationEvaluator: typeof createRmtFormValidationEvaluator;
  createRmtFormValidationViewProjector: typeof createRmtFormValidationViewProjector;
  createRmtFormValidationRuntime: typeof createRmtFormValidationRuntime;
};

export default api;
