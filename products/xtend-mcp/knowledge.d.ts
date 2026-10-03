export interface XtendKnowledgeOptions {
  bundleDir?: string;
  knowledgeDir?: string;
  docsFile?: string;
  noCache?: boolean;
}

export interface XtendKnowledgeSearchInput {
  query: string;
  locale?: 'de' | 'en' | 'all';
  scopes?: Array<'docs' | 'rmt-kit'>;
  limit?: number;
  domains?: string[];
}

export declare const RMT_KNOWLEDGE_RESULT_SCHEMA: 'xtend-llm.tool-result.rmt-knowledge.v1';
export declare function loadXtendKnowledgeBundle(options?: XtendKnowledgeOptions): unknown;
export declare function createXtendKnowledgeIndex(options?: XtendKnowledgeOptions): unknown;
export declare function searchXtendKnowledge(input: XtendKnowledgeSearchInput, options?: XtendKnowledgeOptions): unknown;
export declare function createXtendKnowledgeContext(input: XtendKnowledgeSearchInput & { maxChars?: number }, options?: XtendKnowledgeOptions): unknown;
export declare function executeRmtKnowledge(request: unknown, options?: XtendKnowledgeOptions): Promise<unknown>;
export declare function resolveRmtKnowledgeDirectory(options?: XtendKnowledgeOptions): string;
export declare function getXtendKnowledgeResource(uri: string, options?: XtendKnowledgeOptions): unknown;
export declare function getXtendDocsCatalog(locale: 'de' | 'en' | 'all', options?: XtendKnowledgeOptions, pagination?: { cursor?: string; pageSize?: number; all?: boolean }): unknown;
export declare function getXtendRmtKitRecords(kind: 'reference' | 'recipe', options?: XtendKnowledgeOptions): unknown[];
export declare function clearXtendKnowledgeCache(): void;
