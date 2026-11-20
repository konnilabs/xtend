import type { RmtRange, RmtTextDocument, RmtToolingDiagnostic } from './rmt-tooling-public-types';
export declare const RMT_PROJECT_API_VERSION: '1.0.0';
export declare const RMT_PROJECT_GRAPH_SCHEMA: 'xtend.rmt.project-graph.v1';
export declare const RMT_PROJECT_REPORT_SCHEMA: 'xtend.rmt.project-report.v1';
export declare const RMT_PROJECT_COMPILER_SCHEMA: 'xtend.rmt.project-compiler.v1';
export declare const RMT_PROJECT_COMPILE_RESULT_SCHEMA: 'xtend.rmt.project-compile-result.v1';
export type RmtProjectSourceSyntax = 'rmt-vnext' | 'rmtx';
export interface RmtProjectDiagnostic extends RmtToolingDiagnostic {
  uri?: string; file?: string; filePath?: string;
}
export type RmtProjectDocument = Partial<RmtTextDocument> & { text: string; sourceSyntax?: RmtProjectSourceSyntax; syntaxVersion?: string };
export type RmtProjectInput = RmtProjectDocument | (Partial<RmtTextDocument> & { filePath: string }) | (Partial<RmtTextDocument> & { uri: string });
export interface RmtProjectOptions extends Record<string, unknown> {
  rootDir?: string; root?: string;
  sourceSyntax?: 'rmt' | 'rmt-vnext' | 'rmt-classic' | 'rmtx';
  rmtxSyntaxVersion?: '1.0.0' | '2.0.0' | '3.0.0' | '4.0.0' | '5.0.0' | '6.0.0' | '7.0.0' | '8.0.0';
  syntaxVersion?: string;
  readFile?: (filePath: string) => string;
  documents?: readonly RmtProjectDocument[] | ReadonlyMap<string, string | RmtProjectDocument> | Readonly<Record<string, string | RmtProjectDocument>>;
  semanticCheck?: boolean;
  /** Editor discovery only; original syntax errors still block compilation. */
  recoverImports?: boolean;
  /** Defaults to the optional root rmtx.providers.json; never loads provider code. */
  rmtxProvidersFile?: string;
  rmtxProviders?: { schema: 'xtend.maraca.rmtx-providers.v1'; interfaces: readonly { file: string; sha256: string }[] };
  componentInterfaceCatalog?: RmtProjectSnapshot['componentInterfaceCatalog'];
}
export interface RmtProjectDependency {
  filePath: string; exists: boolean; sha256: string | null;
  sourceSyntax?: RmtProjectSourceSyntax | null; syntaxVersion?: string;
  kind?: 'glob' | 'provider-registry' | 'provider-interface' | 'provider-module'; matches?: readonly string[];
}
export interface RmtProjectImportEdge {
  importer: string; importPath: string; mode: 'static_file' | 'static_glob';
  resolvedPaths: readonly string[]; range: RmtRange;
}
export interface RmtProjectModule extends RmtProjectDocument {
  filePath: string; uri: string; sourceSyntax: RmtProjectSourceSyntax; syntaxVersion: string;
  sha256: string; programId?: string;
  imports: readonly { path: string; mode: 'static_file' | 'static_glob'; range: RmtRange }[];
  diagnostics: readonly RmtProjectDiagnostic[];
}
export interface RmtProjectOrigin {
  filePath: string; startOffset: number; endOffset: number;
  generatedStart: number; generatedEnd: number; replacement?: boolean;
}
export interface RmtProjectReport {
  schema: typeof RMT_PROJECT_REPORT_SCHEMA; apiVersion: typeof RMT_PROJECT_API_VERSION; ok: boolean;
  identity: string; rootDir: string; entryFile: string; sourceSyntax: RmtProjectSourceSyntax | null;
  syntaxVersion: string; effectiveSourceProfile: { syntax: 'rmt' | 'rmtx'; version: string };
  dependencies: readonly RmtProjectDependency[]; edges: readonly RmtProjectImportEdge[]; order: readonly string[];
  origins: readonly RmtProjectOrigin[];
  sourceMap: readonly (Readonly<Record<string, unknown>> & { file: string; uri: string; range: RmtRange })[];
  rmtxProviders: RmtProjectOptions['rmtxProviders'] | null;
  rmtxProvidersFile: string | null;
}
export interface RmtProjectSnapshot extends Omit<RmtProjectReport, 'schema' | 'origins' | 'sourceMap'> {
  schema: typeof RMT_PROJECT_GRAPH_SCHEMA; modules: readonly RmtProjectModule[];
  diagnostics: readonly RmtProjectDiagnostic[];
  componentInterfaceCatalog: Readonly<{ records: readonly { definition: import('../xtensions/component-interface').ComponentInterface | import('../xtensions/component-interface').ComponentInterfaceV2 }[] }> | null;
}
export interface RmtProjectCompileResult {
  schema: string; apiVersion?: string; ok: boolean; status: string; phase: string;
  sourceProfile?: { syntax: string; version: string };
  diagnostics: RmtProjectDiagnostic[]; compilerDiagnostics: RmtProjectDiagnostic[];
  coreDocument: Record<string, unknown> | null; coreJson: string | null;
  orchestrationArtifacts: Record<string, unknown> | null;
  primitiveArtifacts?: Record<string, unknown> | null;
  project: RmtProjectReport;
  readonly [key: string]: unknown;
}
export declare function createRmtProjectSnapshot(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectSnapshot;
export declare function compileRmtProjectSource(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectCompileResult;
export interface RmtProjectCompiler {
  readonly name: 'RMT Project'; readonly schema: typeof RMT_PROJECT_COMPILER_SCHEMA;
  readonly apiVersion: typeof RMT_PROJECT_API_VERSION;
  compileSource(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectCompileResult;
  createSnapshot(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectSnapshot;
}
export declare function createRmtProjectCompiler(options?: RmtProjectOptions): RmtProjectCompiler;
export interface RmtProject {
  readonly apiVersion: typeof RMT_PROJECT_API_VERSION;
  updateDocument(document: RmtProjectDocument): void;
  removeDocument(fileOrUri: string | Pick<RmtProjectDocument, 'filePath' | 'uri'>): void;
  getDocuments(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectDocument[];
  analyze(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectSnapshot;
  compileSource(input?: RmtProjectInput | string, options?: RmtProjectOptions): RmtProjectCompileResult;
  dispose(): void;
}
export declare function createRmtProject(options?: RmtProjectOptions): RmtProject;
