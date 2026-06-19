export type RmtAiDeveloperKitProfile = 'survival' | 'compact' | 'full' | 'repair' | 'maraca';
export type RmtAiDeveloperKitFormat = 'all' | 'md' | 'json' | 'jsonl';

export interface RmtAiDeveloperKitOptions {
  rootDir?: string;
}

export interface RmtAiDeveloperKitExportOptions extends RmtAiDeveloperKitOptions {
  profile?: RmtAiDeveloperKitProfile;
  format?: RmtAiDeveloperKitFormat;
  out?: string;
  outputDir?: string;
}

export interface RmtAiDeveloperKitSourceHash {
  path: string;
  sha256: string;
  bytes: number;
}

export interface RmtAiDeveloperKitArtifactSummary {
  sha256: string;
  tokenEstimate?: number;
  lineCount?: number;
}

export interface RmtAiDeveloperKitManifest {
  schema: typeof RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA;
  kitSchema: typeof RMT_AI_DEVELOPER_KIT_SCHEMA;
  version: string;
  status: typeof RMT_AI_DEVELOPER_KIT_STATUS;
  workpackage: typeof RMT_AI_DEVELOPER_KIT_WORKPACKAGE;
  generatedAt: string;
  language: string;
  outputDir: string;
  module: typeof RMT_AI_DEVELOPER_KIT_MODULE_PATH;
  types: typeof RMT_AI_DEVELOPER_KIT_TYPES_PATH;
  suite: typeof RMT_AI_DEVELOPER_KIT_SUITE_PATH;
  localGate: typeof RMT_AI_DEVELOPER_KIT_LOCAL_GATE;
  packageScript: typeof RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT;
  loadOrder: string[];
  profiles: Record<string, { tokenBudget: number | null; purpose: string }>;
  tokenEstimates: Record<string, number>;
  recordCounts: Record<string, number>;
  artifacts: Record<string, RmtAiDeveloperKitArtifactSummary>;
  sourceHashes: RmtAiDeveloperKitSourceHash[];
  rootDir: string;
}

export interface RmtAiDeveloperKitReferenceRecord {
  schema: typeof RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA;
  kind: 'operator' | 'diagnostic' | 'cli' | string;
  id: string;
  operator?: string;
  syntax?: string;
  allowedContexts?: string[];
  parameters?: string;
  description?: string;
  validExample?: string;
  invalidExample?: string;
  diagnostics?: string;
  sourceRefs: string[];
}

export interface RmtAiDeveloperKitRecipeRecord {
  schema: typeof RMT_AI_DEVELOPER_KIT_RECIPE_RECORD_SCHEMA;
  id: string;
  profile: RmtAiDeveloperKitProfile;
  domains: string[];
  title: string;
  intent: string;
  compileExpectation: 'must-compile' | 'procedure' | string;
  negative: boolean;
  source?: string;
  sourceRef?: string;
  steps?: string[];
  commands: string[];
}

export interface RmtAiDeveloperKit {
  schema: typeof RMT_AI_DEVELOPER_KIT_SCHEMA;
  status: typeof RMT_AI_DEVELOPER_KIT_STATUS;
  workpackage: typeof RMT_AI_DEVELOPER_KIT_WORKPACKAGE;
  manifest: RmtAiDeveloperKitManifest;
  compact: string;
  referenceRecords: RmtAiDeveloperKitReferenceRecord[];
  recipeRecords: RmtAiDeveloperKitRecipeRecord[];
  referenceJsonl: string;
  recipesJsonl: string;
  prompts: string;
  guardrails: Record<string, unknown>;
  artifacts: Record<string, string>;
}

export interface RmtAiDeveloperKitExportOutput {
  id: string;
  path: string;
  kind: 'jsonl' | 'json' | 'markdown' | string;
  generated: boolean;
  bytes: number;
  sha256: string;
  content?: string;
}

export interface RmtAiDeveloperKitExportResult {
  schema: typeof RMT_AI_DEVELOPER_KIT_SCHEMA;
  status: 'exported';
  ok: boolean;
  profile: RmtAiDeveloperKitProfile;
  format: RmtAiDeveloperKitFormat;
  outputDir: string | null;
  manifest: RmtAiDeveloperKitManifest;
  outputs: RmtAiDeveloperKitExportOutput[];
}

export const ARTIFACT_PATHS: Readonly<Record<string, string>>;
export const COMPACT_TOKEN_LIMIT: 8000;
export const REPAIR_TOKEN_LIMIT: 4000;
export const RMT_AI_DEVELOPER_KIT_GUARDRAILS_SCHEMA: 'xtend.rmt.ai-developer-kit.guardrails.v1';
export const RMT_AI_DEVELOPER_KIT_LOCAL_GATE: 'node scripts/run_xtend_tests.js rmt-ai-developer-kit --json';
export const RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA: 'xtend.rmt.ai-developer-kit.manifest.v1';
export const RMT_AI_DEVELOPER_KIT_MODULE_PATH: 'tools/rmt-language/rmt-ai-developer-kit.js';
export const RMT_AI_DEVELOPER_KIT_OUTPUT_DIR: 'docs/ai/rmt-ai-developer-kit';
export const RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT: 'npm run test:rmt-ai-developer-kit';
export const RMT_AI_DEVELOPER_KIT_RECIPE_RECORD_SCHEMA: 'xtend.rmt.ai-developer-kit.recipe-record.v1';
export const RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA: 'xtend.rmt.ai-developer-kit.reference-record.v1';
export const RMT_AI_DEVELOPER_KIT_SCHEMA: 'xtend.rmt.ai-developer-kit.v1';
export const RMT_AI_DEVELOPER_KIT_STATUS: 'accepted-agent-ingest-kit';
export const RMT_AI_DEVELOPER_KIT_SUITE_PATH: 'tests/rmt-language/rmt_ai_developer_kit_suite.js';
export const RMT_AI_DEVELOPER_KIT_TYPES_PATH: 'tools/rmt-language/rmt-ai-developer-kit.d.ts';
export const RMT_AI_DEVELOPER_KIT_WORKPACKAGE: 'RMT-AI-DK-01';
export const RECIPE_RECORDS: readonly RmtAiDeveloperKitRecipeRecord[];
export const REFERENCE_RECORDS: readonly RmtAiDeveloperKitReferenceRecord[];
export const SURVIVAL_TOKEN_LIMIT: 2000;

export function createRmtAiDeveloperKit(options?: RmtAiDeveloperKitOptions): RmtAiDeveloperKit;
export function exportRmtAiDeveloperKit(options?: RmtAiDeveloperKitExportOptions): RmtAiDeveloperKitExportResult;
export function estimateTokens(text: string): number;
