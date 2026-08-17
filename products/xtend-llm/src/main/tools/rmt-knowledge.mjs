import {
  RMT_KNOWLEDGE_RESULT_SCHEMA,
  createRmtKnowledgeIndex,
  executeRmtKnowledge as executeRmtKnowledgeDirect,
  loadRmtKnowledgeKit,
  resolveRmtKnowledgeDirectory
} from '@ccslabs/xtend-mcp/knowledge';
import {
  executeRmtKnowledgeViaMcp
} from '@ccslabs/xtend-mcp/client';

export {
  RMT_KNOWLEDGE_RESULT_SCHEMA,
  createRmtKnowledgeIndex,
  loadRmtKnowledgeKit,
  resolveRmtKnowledgeDirectory
};

export const XTEND_LLM_KNOWLEDGE_MODES = Object.freeze(['direct', 'mcp', 'shadow']);

export function resolveXtendLlmKnowledgeMode(options = {}) {
  const requested = String(options.mode || process.env.XTEND_LLM_KNOWLEDGE_MODE || 'direct').toLowerCase();
  return XTEND_LLM_KNOWLEDGE_MODES.includes(requested) ? requested : 'direct';
}

function parityProjection(result = {}) {
  return {
    query: result.query,
    maxRecords: result.maxRecords,
    domains: result.domains,
    includeRecipes: result.includeRecipes,
    sourceHashes: result.sourceHashes,
    records: result.records,
    recipes: result.recipes,
    guardrailsSummary: result.guardrailsSummary,
    promptContext: result.promptContext
  };
}

function parityMatches(left, right) {
  return JSON.stringify(parityProjection(left)) === JSON.stringify(parityProjection(right));
}

function mcpOptions(options = {}) {
  return {
    command: options.mcpCommand,
    args: options.mcpArgs,
    cwd: options.cwd,
    workspaceRoots: options.workspaceRoots,
    bundleDir: options.bundleDir
  };
}

export async function executeRmtKnowledge(request, options = {}) {
  const mode = resolveXtendLlmKnowledgeMode(options);
  if (mode === 'direct') return executeRmtKnowledgeDirect(request, options);
  if (mode === 'mcp') return executeRmtKnowledgeViaMcp(request, mcpOptions(options));

  const direct = await executeRmtKnowledgeDirect(request, options);
  try {
    const viaMcp = await executeRmtKnowledgeViaMcp(request, mcpOptions(options));
    if (!parityMatches(direct, viaMcp)) {
      console.error(JSON.stringify({
        schema: 'xtend-llm.mcp-shadow-parity.v1',
        status: 'diverged',
        query: direct.query,
        directRecordIds: direct.records.map((record) => record.id),
        mcpRecordIds: viaMcp.records.map((record) => record.id),
        directRecipeIds: direct.recipes.map((record) => record.id),
        mcpRecipeIds: viaMcp.recipes.map((record) => record.id)
      }));
    }
  } catch (error) {
    console.error(JSON.stringify({
      schema: 'xtend-llm.mcp-shadow-parity.v1',
      status: 'mcp-error',
      query: direct.query,
      error: error instanceof Error ? error.message : String(error)
    }));
  }
  return direct;
}
