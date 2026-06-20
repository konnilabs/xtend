export const WEB_SEARCH_TOOL_NAME = 'web_search';
export const RMT_KNOWLEDGE_TOOL_NAME = 'rmt_knowledge';

export const TOOL_DECISION_SYSTEM_PROMPT = [
  'XTEND_TOOL_DECISION',
  'You decide whether the local assistant needs a web search before answering.',
  'Use web_search only for current, time-sensitive, public web facts, or when the user explicitly asks to search the web.',
  'Do not use web_search for stable explanations, simple coding, creative writing, private data, arithmetic, or normal conversation.',
  'If a search is needed, output exactly one XML-style tool call and no prose:',
  '<tool_call>{"name":"web_search","arguments":{"query":"short search query","maxResults":5,"language":"en-US"}}</tool_call>',
  'If no search is needed, output exactly <no_tool/>.',
  'Default to non-thinking mode.'
].join('\n');

function cleanText(value, maxLength = 300) {
  const text = String(value == null ? '' : value)
    .replace(/\u0000/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function maxResultsValue(value) {
  return Number.isFinite(value) ? Math.max(1, Math.min(5, Math.floor(value))) : 5;
}

function stripRuntimeMarkup(text = '') {
  return cleanText(String(text || '')
    .replace(/\/no_think/giu, '')
    .replace(/XTEND_WEB_SEARCH_RESULTS[\s\S]*$/u, '')
    .replace(/XTEND_RMT_KNOWLEDGE_CONTEXT[\s\S]*$/u, ''), 500);
}

function userTexts(messages = []) {
  return messages
    .filter((message) => message && message.role === 'user' && typeof message.content === 'string')
    .map((message) => stripRuntimeMarkup(message.content))
    .filter(Boolean);
}

function hasCurrentSignal(text = '') {
  return /\b(today|now|current|currently|latest|recent|live|news|up[-\s]?to[-\s]?date|this week|this month|this year)\b/iu.test(text)
    || /\b(heute|jetzt|gerade|aktuell|derzeit|momentan|neueste|neusten|letzte|letzten|nachrichten|live|dieses jahr)\b/iu.test(text);
}

function hasExplicitSearchSignal(text = '') {
  return /\b(web search|search the web|look up|look this up|internet|online)\b/iu.test(text)
    || /\b(websuche|web-suche|internet|online|im web|im internet|im netz)\b/iu.test(text);
}

function hasToolApplyFollowUp(text = '') {
  const prompt = cleanText(text, 220).toLowerCase();
  return /^(wende|nutze|benutze|verwende|mach)\b.*\b(es|das|dieses|tool)\b/u.test(prompt)
    || /\b(kannst du|kannst du bitte)\b.*\b(es|das|dieses|tool)\b.*\b(anwenden|nutzen|benutzen|verwenden)\b/u.test(prompt)
    || /\b(apply|use|run)\b.*\b(it|that|the tool)\b/u.test(prompt)
    || /\b(do it|yes please|please do)\b/u.test(prompt);
}

function hasSearchToolConversation(text = '') {
  return /\b(websuche|web-suche|web search|search tool|such-tool|suchtool|tool|nachschauen|look up)\b/iu.test(text);
}

function hasRmtKnowledgeSignal(text = '') {
  return /\b(rmt|xtendrmt|maraca|\.rmt|xt\s+rmt|rmt-syntax|rmt syntax|hydrate|surface|lane|selector|datasource|resource|portal|preventdefault|validation|transition|guardrail|guardrails)\b/iu.test(text)
    || /\b(rmt[-\s]?syntax|rmt[-\s]?beispiel|codebeispiel|maraca[-\s]?strict|linter|lint)\b/iu.test(text);
}

function hasRmtToolConversation(text = '') {
  return /\b(rmt|xtendrmt|maraca|rmt_knowledge|rmt knowledge|knowledge tool|wissenstool|rmt-tool)\b/iu.test(text);
}

function hasCodeIntent(text = '') {
  return /\b(code|example|sample|snippet|recipe|beispiel|beispiele|syntax|schreib|write|implement|implementiere)\b/iu.test(text);
}

function inferRmtDomains(text = '') {
  const prompt = String(text || '').toLowerCase();
  const domains = [];
  [
    'template',
    'state',
    'selector',
    'datasource',
    'resource',
    'portal',
    'surface',
    'lane',
    'hydrate',
    'mount',
    'action',
    'payload',
    'preventDefault',
    'validation',
    'transition',
    'maraca',
    'repair',
    'lint'
  ].forEach((domain) => {
    if (prompt.includes(domain.toLowerCase())) domains.push(domain === 'lint' ? 'repair' : domain);
  });
  if (/\bevent|events|on\s+/iu.test(text)) domains.push('event');
  if (/\bcode|beispiel|example|recipe|snippet\b/iu.test(text)) domains.push('recipe');
  return Array.from(new Set(domains)).slice(0, 6);
}

function extractSearchSubject(text = '') {
  let query = stripRuntimeMarkup(text);
  query = query
    .replace(/^(hast du|kannst du|can you|do you have)\b.{0,120}\b(websuche|web-suche|web search|such-tool|search tool|tool)\b.{0,80}?(?:,\s*)?/iu, '')
    .replace(/^(wende|nutze|benutze|verwende|apply|use|run)\b.{0,60}$/iu, '')
    .trim();

  const intentMatch = query.match(/\b(?:um\s+)?(?:nachzuschauen|nachsehen|to\s+look\s+up|to\s+check)\b,?\s*(.+)$/iu);
  if (intentMatch?.[1]) query = intentMatch[1].trim();

  const whetherMatch = query.match(/\b(?:ob|whether|if)\b\s+(.+)$/iu);
  if (whetherMatch?.[1] && whetherMatch[1].length >= 6) query = whetherMatch[1].trim();

  query = query
    .replace(/^(jetzt|gerade|aktuell|current|currently|right now)\s+/iu, '')
    .replace(/[?.!]+$/u, '')
    .trim();

  return cleanText(query, 220);
}

function bestSearchQuery(messages = [], originalText = '') {
  const texts = userTexts(messages);
  const current = stripRuntimeMarkup(originalText || texts.at(-1) || '');
  const currentIsFollowUp = hasToolApplyFollowUp(current);
  if (current && !currentIsFollowUp) {
    const currentQuery = extractSearchSubject(current);
    if (currentQuery && (hasCurrentSignal(current) || hasExplicitSearchSignal(current))) return currentQuery;
  }

  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const candidate = texts[index];
    if (!candidate || candidate === current || hasToolApplyFollowUp(candidate)) continue;
    if (!hasCurrentSignal(candidate) && !hasExplicitSearchSignal(candidate) && !/[?]$/u.test(candidate)) continue;
    const query = extractSearchSubject(candidate);
    if (query) return query;
  }

  return extractSearchSubject(current);
}

function bestRmtKnowledgeQuery(messages = [], originalText = '') {
  const texts = userTexts(messages);
  const current = stripRuntimeMarkup(originalText || texts.at(-1) || '');
  if (current && !hasToolApplyFollowUp(current)) return cleanText(current, 500);
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const candidate = texts[index];
    if (!candidate || candidate === current || hasToolApplyFollowUp(candidate)) continue;
    if (hasRmtKnowledgeSignal(candidate)) return cleanText(candidate, 500);
  }
  return cleanText(current, 500);
}

export function resolveDeterministicToolCall(messages = [], originalText = '') {
  const texts = userTexts(messages);
  const current = stripRuntimeMarkup(originalText || texts.at(-1) || '');
  const context = texts.join('\n');
  const shouldUseRmtKnowledge = !hasCurrentSignal(current)
    && !hasExplicitSearchSignal(current)
    && (hasRmtKnowledgeSignal(current) || (hasToolApplyFollowUp(current) && hasRmtToolConversation(context)));
  if (shouldUseRmtKnowledge) {
    const query = bestRmtKnowledgeQuery(messages, current);
    if (!query || query.length < 3) return { type: 'none' };
    return {
      type: 'tool_call',
      reason: hasToolApplyFollowUp(current) ? 'rmt-follow-up' : 'rmt',
      toolCall: {
        name: RMT_KNOWLEDGE_TOOL_NAME,
        arguments: {
          query,
          maxRecords: 6,
          domains: inferRmtDomains(query),
          includeRecipes: hasCodeIntent(query)
        }
      }
    };
  }
  const shouldSearch = hasCurrentSignal(current)
    || hasExplicitSearchSignal(current)
    || (hasToolApplyFollowUp(current) && (hasSearchToolConversation(context) || hasCurrentSignal(context)));
  if (!shouldSearch) return { type: 'none' };

  const query = bestSearchQuery(messages, current);
  if (!query || query.length < 3) return { type: 'none' };

  return {
    type: 'tool_call',
    reason: hasToolApplyFollowUp(current) ? 'follow-up' : hasExplicitSearchSignal(current) ? 'explicit' : 'current',
    toolCall: {
      name: WEB_SEARCH_TOOL_NAME,
      arguments: {
        query,
        maxResults: 5,
        language: inferSearchLanguage(`${current}\n${query}`)
      }
    }
  };
}

export function buildForcedWebSearchToolCall(prompt = '') {
  const query = extractSearchSubject(prompt) || stripRuntimeMarkup(prompt);
  if (!query || query.length < 3) return { type: 'none' };
  return {
    type: 'tool_call',
    reason: 'forced',
    toolCall: {
      name: WEB_SEARCH_TOOL_NAME,
      arguments: {
        query: cleanText(query, 300),
        maxResults: 5,
        language: inferSearchLanguage(`${prompt}\n${query}`)
      }
    }
  };
}

export function buildForcedRmtKnowledgeToolCall(prompt = '') {
  const query = cleanText(stripRuntimeMarkup(prompt), 500);
  if (!query || query.length < 3) return { type: 'none' };
  return {
    type: 'tool_call',
    reason: 'forced',
    toolCall: {
      name: RMT_KNOWLEDGE_TOOL_NAME,
      arguments: {
        query,
        maxRecords: 6,
        domains: inferRmtDomains(query),
        includeRecipes: true
      }
    }
  };
}

export function inferSearchLanguage(text = '') {
  const prompt = String(text || '').toLowerCase();
  if (/[äöüß]/u.test(prompt)) return 'de-DE';
  if (/\b(der|die|das|und|oder|nicht|aktuell|heute|suche|websuche|nachrichten|quelle)\b/u.test(prompt)) {
    return 'de-DE';
  }
  return 'en-US';
}

export function parseToolDecision(text = '') {
  const output = String(text || '').replace(/<think>[\s\S]*?<\/think>/giu, '').trim();
  if (/<no_tool\s*\/?>/iu.test(output)) return { type: 'none' };

  const match = output.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/iu);
  if (!match) return { type: 'none' };

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed || parsed.name !== WEB_SEARCH_TOOL_NAME) return { type: 'none' };
    const args = parsed.arguments && typeof parsed.arguments === 'object' ? parsed.arguments : {};
    const query = cleanText(args.query, 300);
    if (!query) return { type: 'none' };
    return {
      type: 'tool_call',
      toolCall: {
        name: WEB_SEARCH_TOOL_NAME,
        arguments: {
          query,
          maxResults: maxResultsValue(args.maxResults),
          language: cleanText(args.language || 'auto', 32) || 'auto'
        }
      }
    };
  } catch (_error) {
    return { type: 'none' };
  }
}

export function buildToolDecisionMessages(messages = []) {
  const history = messages
    .filter((message) => message && message.role !== 'system' && typeof message.content === 'string')
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content
    }));
  return [
    { role: 'system', content: TOOL_DECISION_SYSTEM_PROMPT },
    ...history
  ];
}

export function formatWebSearchContext(toolResult = {}) {
  const results = Array.isArray(toolResult.results) ? toolResult.results : [];
  const lines = [
    'XTEND_WEB_SEARCH_RESULTS',
    `Query: ${cleanText(toolResult.query || '', 300)}`,
    `Language: ${cleanText(toolResult.language || 'en-US', 32)}`,
    ''
  ];

  if (!results.length) {
    lines.push('No usable web search results were returned.');
    return lines.join('\n');
  }

  results.slice(0, 5).forEach((result, index) => {
    lines.push(`[${index + 1}] ${cleanText(result.title || result.url || 'Untitled result', 180)}`);
    lines.push(`URL: ${cleanText(result.url || '', 300)}`);
    if (result.publishedDate) lines.push(`Published: ${cleanText(result.publishedDate, 80)}`);
    if (result.snippet) lines.push(`Snippet: ${cleanText(result.snippet, 520)}`);
    lines.push('');
  });
  return lines.join('\n').trim();
}

export function buildSearchAugmentedMessages(messages = [], toolResult = {}) {
  return [
    ...messages,
    {
      role: 'user',
      content: [
        formatWebSearchContext(toolResult),
        '',
        'Use the web search results above as factual context for the original user request.',
        `Current date: ${new Date().toISOString().slice(0, 10)}.`,
        'Answer in the same language as the original user request.',
        'Cite any factual claim from those results with bracketed source markers like [1] or [2].',
        'If the results are insufficient, say what is missing instead of inventing facts.',
        '/no_think'
      ].join('\n')
    }
  ];
}

function formatRmtKnowledgeContext(toolResult = {}) {
  if (toolResult.promptContext) return toolResult.promptContext;
  return [
    'XTEND_RMT_KNOWLEDGE_CONTEXT',
    `Query: ${cleanText(toolResult.query || '', 500)}`,
    '',
    'No RMT knowledge context was returned.'
  ].join('\n');
}

export function buildRmtKnowledgeAugmentedMessages(messages = [], toolResult = {}) {
  return [
    ...messages,
    {
      role: 'user',
      content: [
        formatRmtKnowledgeContext(toolResult),
        '',
        'Use the RMT knowledge context above as the source of truth for the original user request.',
        'Answer in the same language as the original user request.',
        'For code examples, use fenced ```rmt blocks.',
        'Do not invent RMT syntax, JavaScript, HTML or dynamic imports.',
        'If the context is insufficient, say what is missing and suggest checking the RMT AI Developer Kit JSONL.',
        '/no_think'
      ].join('\n')
    }
  ];
}

export function buildRmtKnowledgeFailureMessages(messages = [], toolCall = {}, error = {}) {
  const query = cleanText(toolCall.arguments && toolCall.arguments.query || '', 500);
  const message = cleanText(error && error.message ? error.message : String(error || 'RMT knowledge lookup failed.'), 500);
  return [
    ...messages,
    {
      role: 'user',
      content: [
        'XTEND_RMT_KNOWLEDGE_CONTEXT',
        `Query: ${query}`,
        `The RMT knowledge tool failed: ${message}`,
        '',
        'Answer only from existing conversation context if possible.',
        'If RMT syntax certainty is required, explain that the local RMT knowledge kit was unavailable.',
        '/no_think'
      ].join('\n')
    }
  ];
}

export function buildSearchFailureMessages(messages = [], toolCall = {}, error = {}) {
  const query = cleanText(toolCall.arguments && toolCall.arguments.query || '', 300);
  const message = cleanText(error && error.message ? error.message : String(error || 'Search failed.'), 500);
  return [
    ...messages,
    {
      role: 'user',
      content: [
        `XTEND_WEB_SEARCH_RESULTS`,
        `Query: ${query}`,
        `The web search tool failed: ${message}`,
        '',
        'Answer the original user request from existing conversation context if possible.',
        'If current web information is required, explain briefly that search was unavailable.',
        '/no_think'
      ].join('\n')
    }
  ];
}
