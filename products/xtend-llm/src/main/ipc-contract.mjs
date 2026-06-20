import {
  DEFAULT_MAX_NEW_TOKENS,
  DEFAULT_THEME_MODE,
  MAX_CUSTOM_INSTRUCTIONS_LENGTH,
  RMT_KNOWLEDGE_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME
} from './constants.mjs';

const ID_PATTERN = /^[a-zA-Z0-9_.:-]{1,120}$/u;

export function createId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function assertSafeId(value, label = 'id') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new Error(`${label} must be a stable product-local identifier.`);
  }
  return value;
}

export function sanitizeText(value, options = {}) {
  const maxLength = Number.isFinite(options.maxLength) ? options.maxLength : 16000;
  const text = String(value == null ? '' : value)
    .replace(/\u0000/gu, '')
    .replace(/\r\n/gu, '\n')
    .trim();
  if (!text && options.required !== false) throw new Error(`${options.label || 'text'} is required.`);
  if (text.length > maxLength) throw new Error(`${options.label || 'text'} exceeds ${maxLength} characters.`);
  return text;
}

export function normalizeSubmitMessage(input = {}) {
  const conversationId = input.conversationId ? assertSafeId(input.conversationId, 'conversationId') : '';
  return {
    conversationId,
    text: sanitizeText(input.text, { label: 'message text', maxLength: 16000 }),
    maxNewTokens: Number.isFinite(input.maxNewTokens)
      ? Math.max(1, Math.min(2048, Math.floor(input.maxNewTokens)))
      : DEFAULT_MAX_NEW_TOKENS
  };
}

export function normalizeCancelGeneration(input = {}) {
  return {
    jobId: assertSafeId(input.jobId, 'jobId'),
    conversationId: input.conversationId ? assertSafeId(input.conversationId, 'conversationId') : ''
  };
}

export function normalizeCopyText(input = {}) {
  return {
    schema: 'xtend-llm.copy-text.v1',
    messageId: input.messageId ? assertSafeId(input.messageId, 'messageId') : '',
    text: sanitizeText(input.text, {
      label: 'clipboard text',
      maxLength: 120000
    })
  };
}

export function normalizeRegenerateAssistantMessage(input = {}) {
  return {
    schema: 'xtend-llm.regenerate-assistant-message.v1',
    conversationId: assertSafeId(input.conversationId, 'conversationId'),
    messageId: assertSafeId(input.messageId, 'messageId'),
    maxNewTokens: Number.isFinite(input.maxNewTokens)
      ? Math.max(1, Math.min(2048, Math.floor(input.maxNewTokens)))
      : DEFAULT_MAX_NEW_TOKENS
  };
}

export function normalizeDeleteConversation(input = {}) {
  const id = typeof input === 'string' ? input : input.id || input.conversationId;
  return {
    conversationId: assertSafeId(id, 'conversationId')
  };
}

export function normalizeUpdateSettings(input = {}) {
  const update = {};
  if (Object.hasOwn(input, 'themeMode')) {
    const themeMode = sanitizeText(input.themeMode || DEFAULT_THEME_MODE, {
      label: 'theme mode',
      maxLength: 24,
      required: false
    }) || DEFAULT_THEME_MODE;
    if (!['automatic', 'light', 'dark'].includes(themeMode)) {
      throw new Error('theme mode must be automatic, light or dark.');
    }
    update.themeMode = themeMode;
  }
  if (Object.hasOwn(input, 'customInstructions')) {
    update.customInstructions = sanitizeText(input.customInstructions || '', {
      label: 'custom instructions',
      maxLength: MAX_CUSTOM_INSTRUCTIONS_LENGTH,
      required: false
    });
  }
  return update;
}

export function normalizeResetApp(input = {}) {
  if (!input || input.confirm !== true) throw new Error('reset confirmation is required.');
  return {
    confirm: true
  };
}

function normalizeSearchLanguage(value) {
  const language = sanitizeText(value || 'auto', {
    label: 'search language',
    maxLength: 32,
    required: false
  }) || 'auto';
  if (/^(auto|all|[a-z]{2}(?:-[A-Z]{2})?)$/u.test(language)) return language;
  return 'auto';
}

export function normalizeExecuteTool(input = {}) {
  const call = input.toolCall && typeof input.toolCall === 'object' ? input.toolCall : input;
  const args = call.arguments && typeof call.arguments === 'object' ? call.arguments : {};
  const name = sanitizeText(call.name || input.name, {
    label: 'tool name',
    maxLength: 80
  });
  if (![WEB_SEARCH_TOOL_NAME, RMT_KNOWLEDGE_TOOL_NAME].includes(name)) {
    throw new Error(`Unsupported XTend LLM tool: ${name}`);
  }
  const base = {
    schema: 'xtend-llm.tool-call.v1',
    jobId: input.jobId ? assertSafeId(input.jobId, 'jobId') : '',
    conversationId: input.conversationId ? assertSafeId(input.conversationId, 'conversationId') : '',
    toolCallId: call.toolCallId || input.toolCallId
      ? assertSafeId(call.toolCallId || input.toolCallId, 'toolCallId')
      : createId('tool-call'),
    name
  };

  if (name === RMT_KNOWLEDGE_TOOL_NAME) {
    const maxRecords = Number.isFinite(args.maxRecords)
      ? Math.max(1, Math.min(8, Math.floor(args.maxRecords)))
      : 6;
    const domains = Array.isArray(args.domains) ? args.domains.slice(0, 6).map((domain) => sanitizeText(domain, {
      label: 'RMT knowledge domain',
      maxLength: 64,
      required: false
    })).filter(Boolean) : [];
    return {
      ...base,
      arguments: {
        query: sanitizeText(args.query, {
          label: 'RMT knowledge query',
          maxLength: 500
        }),
        maxRecords,
        domains,
        includeRecipes: args.includeRecipes !== false
      }
    };
  }

  const maxResults = Number.isFinite(args.maxResults)
    ? Math.max(1, Math.min(5, Math.floor(args.maxResults)))
    : 5;
  return {
    ...base,
    arguments: {
      query: sanitizeText(args.query, {
        label: 'search query',
        maxLength: 300
      }),
      maxResults,
      language: normalizeSearchLanguage(args.language)
    }
  };
}

function normalizeSourceUrl(value) {
  const candidate = sanitizeText(value, {
    label: 'source url',
    maxLength: 2048,
    required: false
  });
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch (_error) {
    return '';
  }
}

function clipSourceText(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/\u0000/gu, '')
    .replace(/\r\n/gu, '\n')
    .trim()
    .slice(0, maxLength);
}

export function normalizeAttachGenerationSources(input = {}) {
  const sources = Array.isArray(input.sources) ? input.sources : [];
  const normalizedSources = [];
  const seenUrls = new Set();
  sources.slice(0, 5).forEach((source, position) => {
    if (!source || typeof source !== 'object') return;
    const url = normalizeSourceUrl(source.url);
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    const sourceIndex = Number.isFinite(source.index)
      ? Math.max(1, Math.min(5, Math.floor(source.index)))
      : position + 1;
    const title = clipSourceText(source.title || '', 180) || new URL(url).hostname;
    const snippet = clipSourceText(source.snippet || source.content || '', 600);
    const publishedDate = clipSourceText(source.publishedDate || source.published_date || '', 80);
    const normalized = {
      index: sourceIndex,
      title,
      url,
      snippet
    };
    if (publishedDate) normalized.publishedDate = publishedDate;
    if (Number.isFinite(source.score)) normalized.score = source.score;
    normalizedSources.push(normalized);
  });
  return {
    schema: 'xtend-llm.generation-sources.v1',
    jobId: assertSafeId(input.jobId, 'jobId'),
    conversationId: assertSafeId(input.conversationId, 'conversationId'),
    sources: normalizedSources
  };
}

export function normalizeGenerationDelta(input = {}) {
  return {
    jobId: assertSafeId(input.jobId, 'jobId'),
    conversationId: assertSafeId(input.conversationId, 'conversationId'),
    delta: sanitizeText(input.delta, { label: 'delta', maxLength: 4096, required: false }),
    tokenCount: Number.isFinite(input.tokenCount) ? Math.max(0, Math.floor(input.tokenCount)) : 0,
    at: Number.isFinite(input.at) ? input.at : Date.now()
  };
}

export function normalizeGenerationComplete(input = {}) {
  return {
    jobId: assertSafeId(input.jobId, 'jobId'),
    conversationId: assertSafeId(input.conversationId, 'conversationId'),
    text: sanitizeText(input.text, { label: 'assistant text', maxLength: 120000, required: false }),
    finishReason: sanitizeText(input.finishReason || 'stop', { label: 'finish reason', maxLength: 80, required: false }) || 'stop',
    metrics: input.metrics && typeof input.metrics === 'object' ? input.metrics : {}
  };
}

export function normalizeGenerationError(input = {}) {
  return {
    jobId: input.jobId ? assertSafeId(input.jobId, 'jobId') : '',
    conversationId: input.conversationId ? assertSafeId(input.conversationId, 'conversationId') : '',
    message: sanitizeText(input.message || input.error || 'Generation failed.', {
      label: 'error message',
      maxLength: 2000
    }),
    code: sanitizeText(input.code || 'xtend-llm.generation_failed', {
      label: 'error code',
      maxLength: 120,
      required: false
    }) || 'xtend-llm.generation_failed'
  };
}

export function normalizeModelProgress(input = {}) {
  const phase = sanitizeText(input.phase || 'runtime', { label: 'phase', maxLength: 80, required: false }) || 'runtime';
  return {
    phase,
    status: sanitizeText(input.status || phase, { label: 'status', maxLength: 200, required: false }) || phase,
    loaded: Number.isFinite(input.loaded) ? input.loaded : 0,
    total: Number.isFinite(input.total) ? input.total : 0,
    progress: Number.isFinite(input.progress) ? Math.max(0, Math.min(1, input.progress)) : 0,
    model: sanitizeText(input.model || '', { label: 'model', maxLength: 160, required: false }),
    dtype: sanitizeText(input.dtype || '', { label: 'dtype', maxLength: 32, required: false }),
    webgpu: input.webgpu === true
  };
}
