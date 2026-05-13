export type XtendCatalogJsonPrimitive = string | number | boolean | null;
export type XtendCatalogJsonValue = XtendCatalogJsonPrimitive | XtendCatalogJsonValue[] | XtendCatalogRecord;

export interface XtendCatalogRecord {
  [key: string]: XtendCatalogJsonValue | undefined;
}

export type XtendCatalogStatus =
  | 'accepted'
  | 'planned'
  | 'completed'
  | 'in-progress'
  | 'blocked'
  | 'deferred'
  | string;

export type XtendCatalogSeverity = 'info' | 'warning' | 'error';

export interface XtendCatalogDiagnostic extends XtendCatalogRecord {
  code?: string;
  message: string;
  severity?: XtendCatalogSeverity;
  filePath?: string;
  exportKey?: string;
}

export interface XtendCatalogPlan<TData extends XtendCatalogRecord = XtendCatalogRecord> extends XtendCatalogRecord {
  schema: string;
  reportSchema?: string;
  workpackage?: string;
  status?: XtendCatalogStatus;
  targetReadiness?: string;
  generatedAt?: string;
  module?: string;
  suite?: string;
  docs?: string;
  backlog?: string;
  workpackageDocument?: string;
  localGate?: string;
  packageScript?: string;
  reportArtifact?: string;
  nextWorkpackage?: string;
  nextWorkpackages?: string[];
  boundaries?: string[];
  data?: TData;
}

export interface XtendCatalogReport<TPlan extends XtendCatalogPlan = XtendCatalogPlan> extends XtendCatalogRecord {
  schema: string;
  ok: boolean;
  errors: string[];
  warnings?: string[];
  diagnostics?: XtendCatalogDiagnostic[];
  plan?: TPlan;
}

export interface XtendCatalogGate<TPlan extends XtendCatalogPlan = XtendCatalogPlan> extends XtendCatalogReport<TPlan> {
  gateId?: string;
}

export type XtendCatalogOptions = XtendCatalogRecord;
export type XtendCatalogConstant = XtendCatalogJsonValue | readonly XtendCatalogJsonValue[];
export type XtendCatalogFactory<TResult extends XtendCatalogRecord = XtendCatalogPlan> = (options?: XtendCatalogOptions) => TResult;
export type XtendCatalogValidator<TPlan = unknown> = (plan?: TPlan) => XtendCatalogReport;
export type XtendCatalogReportFactory<TPlan extends XtendCatalogPlan = XtendCatalogPlan> = (options?: XtendCatalogOptions) => XtendCatalogReport<TPlan>;
export type XtendCatalogUtility<TResult = unknown> = (...args: unknown[]) => TResult;
