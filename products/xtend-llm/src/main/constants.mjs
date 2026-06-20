export const PRODUCT_ID = 'xtend-llm';
export const PRODUCT_TITLE = 'XTend Local LLM';
export const QWEN3_8B_MODEL_ID = 'onnx-community/Qwen3-8B-ONNX';
export const SMOKE_MODEL_ID = 'onnx-community/Qwen3-0.6B-ONNX';
export const TARGET_MODEL_ID = process.env.XTEND_LLM_MODEL || SMOKE_MODEL_ID;
export const DEFAULT_CONTEXT_CHAR_BUDGET = 24000;
export const DEFAULT_MAX_NEW_TOKENS = 512;
export const DEFAULT_SEARXNG_URL = 'https://search.ccs-networks.de';
export const WEB_SEARCH_TOOL_NAME = 'web_search';
export const RMT_KNOWLEDGE_TOOL_NAME = 'rmt_knowledge';
export const SETTINGS_SCHEMA = 'xtend-llm.settings.v1';
export const DEFAULT_THEME_MODE = 'automatic';
export const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 8000;
export const DEFAULT_SYSTEM_PROMPT = [
  'You are XTend Local LLM, a concise local assistant running inside an XTend RMT Electron app.',
  'Use the active conversation history for continuity.',
  'When the app provides web search results, ground current facts in those results and cite sources with bracketed numbers.',
  'When the app provides RMT knowledge context, answer RMT syntax and Maraca questions from that context and do not invent unsupported RMT syntax.',
  'Default to non-thinking mode unless the user explicitly asks for reasoning.'
].join(' ');

export const CHANNELS = Object.freeze({
  status: 'xtend-llm:status',
  createConversation: 'xtend-llm:create-conversation',
  selectConversation: 'xtend-llm:select-conversation',
  deleteConversation: 'xtend-llm:delete-conversation',
  getSettings: 'xtend-llm:get-settings',
  updateSettings: 'xtend-llm:update-settings',
  resetApp: 'xtend-llm:reset-app',
  submitMessage: 'xtend-llm:submit-message',
  copyText: 'xtend-llm:copy-text',
  regenerateAssistantMessage: 'xtend-llm:regenerate-assistant-message',
  cancelGeneration: 'xtend-llm:cancel-generation',
  executeTool: 'xtend-llm:execute-tool',
  openExternal: 'xtend-llm:open-external',
  attachGenerationSources: 'xtend-llm:attach-generation-sources',
  telemetrySnapshot: 'xtend-llm:telemetry-snapshot',
  modelProgress: 'xtend-llm:model-progress',
  conversationPatch: 'xtend-llm:conversation-patch',
  settingsPatch: 'xtend-llm:settings-patch',
  generationDelta: 'xtend-llm:generation-delta',
  generationComplete: 'xtend-llm:generation-complete',
  generationError: 'xtend-llm:generation-error',
  workerModelProgress: 'xtend-llm:worker-model-progress',
  workerGenerationDelta: 'xtend-llm:worker-generation-delta',
  workerGenerationComplete: 'xtend-llm:worker-generation-complete',
  workerGenerationError: 'xtend-llm:worker-generation-error'
});

export const PUBLIC_EVENTS = Object.freeze([
  CHANNELS.modelProgress,
  CHANNELS.conversationPatch,
  CHANNELS.settingsPatch,
  CHANNELS.generationDelta,
  CHANNELS.generationComplete,
  CHANNELS.generationError
]);
