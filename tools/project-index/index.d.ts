export interface Position { line: number; character: number }
export interface Range { start: Position; end: Position; startOffset?: number; endOffset?: number }
export interface Location { uri: string; range: Range }
export interface Provenance { provider: string; evidence: 'semantic' | 'declared' | 'static'; path: string }
export interface IndexDocument {
  id: string; uri: string; filePath: string; rootDir: string; projectId: string;
  relativePath: string; workspacePath: string; language: 'rmt' | 'module' | 'data';
  fingerprint: string; version: number | null; origin: 'disk' | 'buffer';
  status: 'unanalysed' | 'complete' | 'incomplete' | 'recorded';
  analysisProvider?: string; moduleExports?: { text: string; range: Range }[];
}
export interface IndexSymbol {
  id: string; documentId: string; projectId: string; name: string; domain: string;
  scope: string[]; declaredIdentity: string; aliases: string[]; pointer: string | null;
  astPointer: string | null; definition: Location; nameLocation: Location; provenance: Provenance;
}
export interface IndexReference {
  id: string; documentId: string; projectId: string; source: Location; pointer: string | null;
  relationship: string; targetDomain: string; targetName: string; targetId: string | null;
  status: 'resolved' | 'unresolved' | 'ambiguous'; candidates: string[]; provenance: Provenance;
}
export interface Relationship {
  id: string; from: string; to: string;
  kind: 'rmt-import' | 'module-import' | 'package-manifest' | 'package-member' | 'package-export' | 'file-input' | 'suite-implementation' | 'test-metadata' | 'contract-definition' | 'contract-use' | 'generated-from';
  provenance: Provenance; source?: Location; specifier?: string; mode?: string;
  importKind?: string; conditions?: string[]; module?: string; access?: string;
  function?: string; arguments?: string[]; role?: string;
}
export interface CoverageGap { path: string; provider?: string; documentId?: string; code: string; detail: string; range?: Range }
export interface IndexPackage { id: string; name: string; directory: string; rootDir: string; manifestPath: string }
export interface ContractDefinition { path: string; symbol: string | null; definitionType: string; role: string; visibility: string }
export interface IndexContract { id: string; schemaId: string; canonicalDefinition: ContractDefinition | null; lifecycle: { status: string; rollout: string }; aliasOf: string | null; replacedBy: string | null; inventoryPath: string; inventoryFingerprint: string }
export interface SuiteImplementation { id: string; path: string; function: string; arguments: string[] }
export interface IndexSuite { id: string; suiteId: string; runnerPath: string; defaultIncluded: boolean; implementations: SuiteImplementation[] }
export interface ProjectSnapshot {
  schema: 'xtend.project-index.v1'; analyzerVersion: string; profile: 'rmt' | 'repository';
  workspaceRoots: string[]; configurationFingerprint: string; contentFingerprint: string;
  documents: IndexDocument[]; symbols: IndexSymbol[]; references: IndexReference[];
  relationships: Relationship[]; packages: IndexPackage[]; contracts: IndexContract[];
  suites: IndexSuite[]; coverage: CoverageGap[];
}
export interface ImpactReason { changedPath: string; reason: (Relationship & { snapshots: ('base' | 'head')[] })[] }
export interface ImpactReport {
  schema: 'xtend.project-index.impact.v1'; mode: 'report-only'; changedPaths: string[];
  files: (IndexDocument & ImpactReason)[]; packages: (IndexPackage & ImpactReason)[];
  contracts: (IndexContract & ImpactReason)[]; possibleSuites: (IndexSuite & ImpactReason)[];
  unknownMappings: CoverageGap[];
  possibleDuplicateExecutions: { implementation: string; suites: { suiteId: string; arguments: string[] }[]; sameArguments: boolean }[];
  testSelection: 'not-performed'; complete: boolean; recommendation: string;
}
export interface ProjectIndexOptions { rootDir?: string; workspaceRoots?: string[]; profile?: 'rmt' | 'repository'; importRoots?: string[]; git?: boolean }
export interface DocumentUpdate { uri?: string; filePath?: string; text: string; version?: number; languageId?: string }
export interface NavigationQuery { symbolId?: string; uri?: string; position?: Position; pointer?: string }
export interface ProjectIndex {
  readonly stats: { analyses: number; rmtAnalyses: number; moduleAnalyses: number; cacheHits: number };
  build(): ProjectIndex; updateDocument(document: DocumentUpdate): boolean;
  closeDocument(uriOrPath: string): boolean; removeDocument(uriOrPath: string): boolean;
  refreshDocument(uriOrPath: string): boolean; snapshot(): ProjectSnapshot;
  searchSymbols(query?: string, options?: { projectId?: string; uri?: string; limit?: number }): IndexSymbol[];
  definitions(query: NavigationQuery): Location[];
  references(query: NavigationQuery & { includeDeclaration?: boolean }): Location[];
  dispose(): void;
}
export declare const SCHEMA: 'xtend.project-index.v1';
export declare const ANALYZER_VERSION: string;
export declare function createProjectIndex(options: ProjectIndexOptions): ProjectIndex;
export declare function computeImpact(input: { baseSnapshot?: ProjectSnapshot; headSnapshot: ProjectSnapshot; changedPaths: string[] }): ImpactReport;
