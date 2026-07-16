export interface XtendMaterialBudgetContract {
  css: { rawBytes: number; gzipBytes: number };
  build: { coldMs: number; incrementalMs: number };
  runtime: { tailwindBytes: 0 };
  unusedRecipeRatio: Record<'utility-app' | 'enterprise-workspace', number>;
}
export interface XtendMaterialPerformanceReport {
  schema: 'xtend.material.performance-report.v1';
  referenceApps: Array<{ id: 'utility-app' | 'enterprise-workspace'; deterministic: boolean; css: { rawBytes: number; gzipBytes: number }; build: { coldMs: number; incrementalMs: number }; inventory: { unusedRecipeRatio: number } }>;
  runtime: { tailwindBytes: number };
  nativeProviderExit: { ok: boolean };
  supplyChain: { ok: boolean };
  packageDryRun: { ok: boolean };
  cleanup: { ok: boolean };
  monkeypatchAudit: { ok: boolean };
}
export declare const XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA: 'xtend.material.performance-report.v1';
export declare const XTEND_MATERIAL_QUALITY_POLICY_SCHEMA: 'xtend.material.quality-policy.v1';
export declare const XTEND_MATERIAL_BUDGETS: Readonly<XtendMaterialBudgetContract>;
export declare const MONKEYPATCH_RULES: ReadonlyArray<{ id: string; pattern: string; message: string }>;
export declare function createXtendMaterialQualityPolicy(): object;
export declare function auditXtendMaterialMonkeypatching(sources?: Array<{ path?: string; content?: string; runtime?: boolean }>): { schema: 'xtend.material.monkeypatch-audit.v1'; ok: boolean; status: 'passed' | 'blocked'; sourceCount: number; findings: Array<{ code: string; severity: 'error'; path: string; offset: number; evidence: string; message: string }> };
export declare function validateXtendMaterialPerformanceReport(report: XtendMaterialPerformanceReport): { schema: 'xtend.material.performance-validation.v1'; ok: boolean; status: 'passed' | 'blocked'; errors: string[] };
