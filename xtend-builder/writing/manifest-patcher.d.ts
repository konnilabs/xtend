export declare const SCAFFOLD_PATCHERS_SCHEMA: 'xtend.scaffold.patchers.v1';
export declare const SCAFFOLD_MANIFEST_PATCHER_SCHEMA: 'xtend.scaffold.manifest-patcher.v1';
export declare const SCAFFOLD_BUILD_REPORT_SCHEMA: 'xtend.scaffold.build-report.v1';
export declare const DEFAULT_MANIFEST_PATH: 'components/manifest.json';
export declare const BUILD_REPORT_ROOT: '.xtend-build/component-files/';

export interface XtendManifestPatch {
  schema: typeof SCAFFOLD_MANIFEST_PATCHER_SCHEMA;
  patchersSchema: typeof SCAFFOLD_PATCHERS_SCHEMA;
  operation: string;
  targetPath: string;
  tag: string;
  source: string;
  previousSource: string | null;
  decision: 'insert-entry' | 'update-existing-entry' | 'already-current' | string;
  changed: boolean;
  existingEntryCount: number;
  nextEntryCount: number;
  policies: Record<string, unknown>;
  diagnostics: Array<Record<string, unknown>>;
}

export interface XtendManifestPatchResult {
  ok: boolean;
  schema: typeof SCAFFOLD_MANIFEST_PATCHER_SCHEMA;
  errors: string[];
  manifest: Record<string, string>;
  patch: XtendManifestPatch | null;
  entry: Record<string, unknown> | null;
}

export interface XtendComponentBuildReportResult {
  ok: boolean;
  schema: typeof SCAFFOLD_BUILD_REPORT_SCHEMA;
  errors: string[];
  report: Record<string, unknown>;
  entry: Record<string, unknown>;
}

export declare function normalizeManifestSource(source: string, manifestPath?: string): { ok: true; source: string } | { ok: false; error: string };
export declare function readManifest(rootDir: string, manifestPath?: string): {
  ok: boolean;
  exists: boolean;
  path: string;
  manifest: Record<string, string>;
  errors: string[];
};
export declare function createManifestPatchEntry(options?: Record<string, unknown>): XtendManifestPatchResult;
export declare function createComponentBuildReportEntry(options?: Record<string, unknown>): XtendComponentBuildReportResult;
