import type { XtendBuilderDiagnostic } from '../builder-public-types';

export declare const SCAFFOLD_WRITE_PLAN_SCHEMA: 'xtend.scaffold.write-plan.v1';
export declare const SCAFFOLD_WRITE_REPORT_SCHEMA: 'xtend.scaffold.write-report.v1';
export declare const SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA: 'xtend.scaffold.generated-ownership.v1';
export declare const DEFAULT_OWNERSHIP_PATH: '.xtend-build/scaffold-ownership.json';
export declare const DEFAULT_ALLOWED_ROOTS: readonly string[];

export interface XtendScaffoldWriteEntry {
  id?: string;
  path?: string;
  targetPath?: string;
  kind?: string;
  type?: string;
  action?: string;
  content?: string;
  generated?: boolean;
  owner?: string;
  templateId?: string | null;
  templatePath?: string | null;
  sourceSha256?: string | null;
  sourceHash?: string | null;
  buildSha256?: string | null;
  allowUnownedPatch?: boolean;
  patch?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface XtendScaffoldWriteOptions {
  rootDir?: string;
  allowedRoots?: string[];
  write?: boolean | string;
  check?: boolean | string;
  force?: boolean | string;
  adoptUnowned?: boolean | string;
  trustGeneratedMarkers?: boolean | string;
  ownershipPath?: string;
  generator?: string;
  owner?: string;
}

export interface XtendScaffoldOwnershipState {
  state: string;
  owned: boolean;
  safeToUpdate: boolean;
  source: string;
  markerPresent: boolean;
  manifestEntry?: XtendScaffoldOwnershipRecord | null;
}

export interface XtendScaffoldOwnershipRecord {
  schema: typeof SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA;
  owner: string;
  generator: string;
  kind: string;
  path: string;
  sha256: string;
  bytes: number;
  templateId: string | null;
  templatePath: string | null;
  sourceSha256: string | null;
  buildSha256: string;
}

export interface XtendScaffoldWriteOperation extends XtendScaffoldWriteEntry {
  id: string;
  path: string;
  requestedPath: string | null;
  content: string;
  sha256: string;
  bytes: number;
  generated: boolean;
  owner: string;
  templateId: string | null;
  templatePath: string | null;
  sourceSha256: string | null;
  buildSha256: string | null;
  requestedAction: string | null;
  allowUnownedPatch: boolean;
  patch: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  exists: boolean;
  changed: boolean;
  action: 'create' | 'update' | 'force-update' | 'skip' | 'conflict' | string;
  status: 'missing' | 'changed' | 'forced' | 'unchanged' | 'invalid' | 'conflict' | string;
  allowed: boolean;
  ownership: XtendScaffoldOwnershipState;
  recordOwnership: boolean;
  absolutePath?: string;
  currentSha256?: string | null;
  diagnostics: XtendBuilderDiagnostic[];
}

export interface XtendScaffoldWriteOperationSummary extends Omit<XtendScaffoldWriteOperation, 'content' | 'absolutePath'> {}

export interface XtendScaffoldWritePlan {
  schema: typeof SCAFFOLD_WRITE_PLAN_SCHEMA;
  ok: boolean;
  mode: 'dry-run' | 'write' | 'check' | string;
  generator: string | null;
  owner: string;
  force: boolean;
  rootDir: string;
  allowedRoots: string[];
  ownershipSchema: typeof SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA;
  ownershipPath: string;
  operationCount: number;
  changedCount: number;
  errors: string[];
  operations: XtendScaffoldWriteOperation[];
}

export interface XtendScaffoldWritePlanSummary extends Omit<XtendScaffoldWritePlan, 'operations'> {
  operations: XtendScaffoldWriteOperationSummary[];
}

export interface XtendScaffoldWriteRecord {
  id: string;
  path: string;
  action: string;
  changed: boolean;
  sha256: string;
}

export interface XtendScaffoldOwnershipManifestWrite {
  path: string;
  changed: boolean;
  sha256: string;
  schema: typeof SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA;
}

export interface XtendScaffoldWriteReport {
  schema: typeof SCAFFOLD_WRITE_REPORT_SCHEMA;
  ok: boolean;
  status: 'planned' | 'written' | 'failed' | 'blocked' | 'current' | 'outdated' | string;
  mode: 'dry-run' | 'write' | 'check' | string;
  errors: string[];
  plan: XtendScaffoldWritePlanSummary;
  writes: XtendScaffoldWriteRecord[];
  ownershipManifest: XtendScaffoldOwnershipManifestWrite | null;
}

export declare function sha256(value: unknown): string;
export declare function normalizeRelativePath(relativePath: string): { ok: true; path: string } | { ok: false; error: string };
export declare function createWritePlan(entries?: XtendScaffoldWriteEntry[], options?: XtendScaffoldWriteOptions): XtendScaffoldWritePlan;
export declare function summarizeWritePlan(plan: XtendScaffoldWritePlan): XtendScaffoldWritePlanSummary;
export declare function applyWritePlan(plan: XtendScaffoldWritePlan, options?: XtendScaffoldWriteOptions): XtendScaffoldWriteReport;
export declare function writeScaffoldFiles(entries?: XtendScaffoldWriteEntry[], options?: XtendScaffoldWriteOptions): XtendScaffoldWriteReport;
