export interface MaterialAppScaffoldInput {
  rootDir?: string;
  runtime?: string;
  designKit?: string;
  'design-kit'?: string;
  out?: string;
  name?: string;
  title?: string;
  server?: 'none' | 'node' | 'php' | 'both';
  serverTarget?: 'none' | 'node' | 'php' | 'both';
  'server-target'?: 'none' | 'node' | 'php' | 'both';
  write?: boolean;
  check?: boolean;
  force?: boolean;
}
export interface MaterialAppScaffoldDiagnostic { code: string; severity: 'warning' | 'error'; message: string; repairHint?: string }
export interface MaterialAppScaffoldReport {
  schema: 'xtend.scaffold.app-preset.material-report.v1';
  scaffoldSchema?: 'xtend.scaffold.app-preset.material.v1';
  ok: boolean;
  status: string;
  preset: { runtime: string; designKit: string; cssProvider?: string; preflight?: string; services?: string; serverTarget?: string };
  packageName?: string;
  outputDir: string;
  ownershipPath?: string;
  errors: string[];
  diagnostics: MaterialAppScaffoldDiagnostic[];
  files: Array<{ id: string; path: string; kind: string; action: string; changed: boolean; sha256: string }>;
  writeReport: object | null;
  commands?: Record<'plan' | 'build' | 'serve' | 'start' | 'tune' | 'test' | 'catfood', string>;
}
export declare const MATERIAL_APP_SCAFFOLD_SCHEMA: 'xtend.scaffold.app-preset.material.v1';
export declare const MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA: 'xtend.scaffold.app-preset.material-report.v1';
export declare function createMaterialAppScaffold(input?: MaterialAppScaffoldInput, options?: { rootDir?: string; resolveAdapter?: (rootDir: string) => boolean }): MaterialAppScaffoldReport;
