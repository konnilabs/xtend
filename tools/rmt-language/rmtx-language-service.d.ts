import type { RmtPosition, RmtRange, RmtTextDocument, RmtToolingDiagnostic } from './rmt-tooling-public-types';

export declare const RMTX_LANGUAGE_SERVICE_API_VERSION: '1.0.0';
export declare const RMTX_LANGUAGE_SERVICE_SCHEMA: 'xtend.rmtx.language-service.v1';
export declare const RMTX_LANGUAGE_ANALYSIS_SCHEMA: 'xtend.rmtx.language-analysis.v1';
export declare const RMTX_VIRTUAL_DOCUMENT_SCHEMA: 'xtend.rmtx.virtual-document.v1';
export declare const RMTX_PROJECT_TYPECHECK_SCHEMA: 'xtend.rmtx.project-typecheck.v1';
export interface RmtxSourceLocation { uri: string; filePath?: string; range: RmtRange }
export interface RmtxMappedSegment { readonly virtualStart: number; readonly virtualEnd: number; readonly uri: string; readonly sourceStart: number; readonly sourceEnd: number; readonly kind: 'declaration' | 'source' | 'replacement' | 'import' }
export interface RmtxVirtualDocument {
  readonly schema: typeof RMTX_VIRTUAL_DOCUMENT_SCHEMA;
  readonly apiVersion: typeof RMTX_LANGUAGE_SERVICE_API_VERSION;
  readonly document: RmtTextDocument;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: string }>;
  readonly fileName: string; readonly text: string; readonly prefixLength: number;
  readonly segments: readonly RmtxMappedSegment[];
  toVirtualOffset(position: RmtPosition | number, uri?: string): number | null;
  toOriginalSpan(start: number, length?: number): (RmtxSourceLocation & { start: number; end: number }) | null;
}
export interface RmtxLanguageServiceOptions {
  rootDir?: string; syntaxVersion?: string; rmtxSyntaxVersion?: string;
  rmtxProvidersFile?: string;
  rmtxProviders?: import('./rmt-project').RmtProjectOptions['rmtxProviders'];
  documents?: readonly RmtTextDocument[];
  componentInterfaceCatalog?: Readonly<{ records: readonly { definition: import('../xtensions/component-interface').ComponentInterface | import('../xtensions/component-interface').ComponentInterfaceV2 }[] }>;
  typescriptOptions?: import('typescript').CompilerOptions;
  project?: { analyze?(input: RmtTextDocument, options?: { recoverImports: true }): { componentInterfaceCatalog?: RmtxLanguageServiceOptions['componentInterfaceCatalog'] }; getDocuments(input: RmtTextDocument, options?: { recoverImports: true }): readonly RmtTextDocument[]; updateDocument(input: RmtTextDocument): unknown; removeDocument(uri: string): unknown; compileSource(input: RmtTextDocument, options?: { semanticCheck: false }): { diagnostics: readonly RmtToolingDiagnostic[] }; dispose(): void } | null;
  getProjectDocuments?(input: RmtTextDocument, options?: { recoverImports: true }): readonly RmtTextDocument[];
  analyzeProject?(input: RmtTextDocument): { diagnostics: readonly RmtToolingDiagnostic[] };
}
export interface RmtxLanguageAnalysis {
  readonly schema: typeof RMTX_LANGUAGE_ANALYSIS_SCHEMA; readonly apiVersion: typeof RMTX_LANGUAGE_SERVICE_API_VERSION;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: string }>;
  readonly document: RmtTextDocument; readonly diagnostics: readonly (RmtToolingDiagnostic & Partial<RmtxSourceLocation>)[];
  readonly ok: boolean; readonly compileResult: unknown;
  readonly virtualDocument: RmtxVirtualDocument | null;
}
export interface RmtxLanguageService {
  readonly schema: typeof RMTX_LANGUAGE_SERVICE_SCHEMA; readonly apiVersion: typeof RMTX_LANGUAGE_SERVICE_API_VERSION;
  readonly documents: Map<string, RmtTextDocument>;
  updateDocument(input: RmtTextDocument): boolean;
  closeDocument(uri: string): void;
  analyze(input: string | RmtTextDocument): RmtxLanguageAnalysis | null;
  completion(input: string | RmtTextDocument, position: RmtPosition): { isIncomplete: boolean; items: readonly Record<string, unknown>[] };
  hover(input: string | RmtTextDocument, position: RmtPosition): { contents: { kind: 'markdown'; value: string }; range?: RmtRange } | null;
  definition(input: string | RmtTextDocument, position: RmtPosition): RmtxSourceLocation[];
  references(input: string | RmtTextDocument, position: RmtPosition, includeDeclaration?: boolean): RmtxSourceLocation[];
  rename(input: string | RmtTextDocument, position: RmtPosition, newName: string): { changes: Record<string, { range: RmtRange; newText: string }[]> };
  prepareRename(input: string | RmtTextDocument, position: RmtPosition): { range: RmtRange; placeholder: string } | null;
  documentSymbols(input: string | RmtTextDocument): Record<string, unknown>[];
  hasRmtxDependencies(input: string | RmtTextDocument): boolean;
  dispose(): void;
}
export declare function createRmtxVirtualDocument(input: RmtTextDocument | string, options?: RmtxLanguageServiceOptions): RmtxVirtualDocument;
export declare function createRmtxLanguageService(options?: RmtxLanguageServiceOptions): RmtxLanguageService;
export declare function checkRmtxProjectTypes(documents: readonly RmtTextDocument[], options?: RmtxLanguageServiceOptions): {
  readonly schema: typeof RMTX_PROJECT_TYPECHECK_SCHEMA; readonly apiVersion: typeof RMTX_LANGUAGE_SERVICE_API_VERSION;
  readonly ok: boolean; readonly diagnostics: readonly (RmtToolingDiagnostic & Partial<RmtxSourceLocation>)[];
};
