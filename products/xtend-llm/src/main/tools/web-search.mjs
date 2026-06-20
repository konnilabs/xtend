import {
  DEFAULT_SEARXNG_URL,
  WEB_SEARCH_TOOL_NAME
} from '../constants.mjs';

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TITLE_LENGTH = 180;
const MAX_SNIPPET_LENGTH = 520;

function cleanText(value, maxLength) {
  const text = String(value == null ? '' : value)
    .replace(/<[^>]*>/gu, ' ')
    .replace(/\u0000/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trim()}...` : text;
}

function decodeHtml(value = '') {
  return String(value || '')
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&#(\d+);/gu, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch (_error) {
    return '';
  }
}

function numericScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

export function normalizeSearxngResults(payload = {}, options = {}) {
  const maxResults = Number.isFinite(options.maxResults)
    ? Math.max(1, Math.min(5, Math.floor(options.maxResults)))
    : 5;
  const seen = new Set();
  const results = [];
  const sourceResults = Array.isArray(payload.results) ? payload.results : [];

  for (const entry of sourceResults) {
    if (!entry || typeof entry !== 'object') continue;
    const url = safeHttpUrl(entry.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const title = cleanText(entry.title || url, MAX_TITLE_LENGTH);
    const snippet = cleanText(entry.content || entry.snippet || '', MAX_SNIPPET_LENGTH);
    if (!title && !snippet) continue;

    results.push({
      title,
      url,
      snippet,
      score: numericScore(entry.score),
      publishedDate: cleanText(entry.publishedDate || entry.published_date || '', 80)
    });
    if (results.length >= maxResults) break;
  }

  return results;
}

export function normalizeSearxngHtmlResults(html = '', options = {}) {
  const maxResults = Number.isFinite(options.maxResults)
    ? Math.max(1, Math.min(5, Math.floor(options.maxResults)))
    : 5;
  const seen = new Set();
  const results = [];
  const articlePattern = /<article\b[^>]*class="[^"]*\bresult\b[^"]*"[^>]*>([\s\S]*?)<\/article>/giu;
  let articleMatch;

  while ((articleMatch = articlePattern.exec(String(html || ''))) && results.length < maxResults) {
    const article = articleMatch[1] || '';
    const headingMatch = article.match(/<h3\b[^>]*>\s*<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/iu);
    const fallbackLinkMatch = article.match(/<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*\burl_header\b[^"]*"[^>]*>/iu);
    const url = safeHttpUrl(decodeHtml(headingMatch?.[1] || fallbackLinkMatch?.[1] || ''));
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const title = cleanText(decodeHtml(headingMatch?.[2] || url), MAX_TITLE_LENGTH);
    const snippetMatch = article.match(/<p\b[^>]*class="[^"]*\bcontent\b[^"]*"[^>]*>([\s\S]*?)<\/p>/iu);
    const snippet = cleanText(decodeHtml(snippetMatch?.[1] || ''), MAX_SNIPPET_LENGTH);
    if (!title && !snippet) continue;

    results.push({
      title,
      url,
      snippet,
      score: 0,
      publishedDate: ''
    });
  }

  return results;
}

async function fetchSearxngJson(fetchImpl, endpoint, controller) {
  endpoint.searchParams.set('format', 'json');
  const response = await fetchImpl(endpoint.href, {
    headers: {
      accept: 'application/json,text/plain,*/*',
      'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      'user-agent': 'XTend Local LLM/0.1'
    },
    signal: controller.signal
  });
  if (!response.ok) {
    const error = new Error(`SearXNG JSON search failed: ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function fetchSearxngHtml(fetchImpl, endpoint, controller) {
  endpoint.searchParams.delete('format');
  const response = await fetchImpl(endpoint.href, {
    headers: {
      accept: 'text/html,application/xhtml+xml,*/*',
      'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      'user-agent': 'XTend Local LLM/0.1'
    },
    signal: controller.signal
  });
  if (!response.ok) {
    throw new Error(`SearXNG HTML search failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function executeWebSearch(request, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Web search is unavailable because fetch is not available in this runtime.');
  }

  const baseUrl = String(options.baseUrl || process.env.XTEND_LLM_SEARXNG_URL || DEFAULT_SEARXNG_URL);
  const endpoint = new URL('/search', baseUrl);
  endpoint.searchParams.set('q', request.arguments.query);
  endpoint.searchParams.set('safesearch', '1');
  endpoint.searchParams.set('categories', 'general');
  const language = request.arguments.language && request.arguments.language !== 'auto'
    ? request.arguments.language
    : 'en-US';
  endpoint.searchParams.set('language', language);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    let results = [];
    let transport = 'json';
    try {
      const payload = await fetchSearxngJson(fetchImpl, new URL(endpoint.href), controller);
      results = normalizeSearxngResults(payload, { maxResults: request.arguments.maxResults });
    } catch (error) {
      if (error && error.name === 'AbortError') throw error;
      transport = 'html';
      const html = await fetchSearxngHtml(fetchImpl, new URL(endpoint.href), controller);
      results = normalizeSearxngHtmlResults(html, { maxResults: request.arguments.maxResults });
    }
    return {
      schema: 'xtend-llm.tool-result.web-search.v1',
      toolCallId: request.toolCallId,
      name: WEB_SEARCH_TOOL_NAME,
      query: request.arguments.query,
      language,
      transport,
      fetchedAt: new Date().toISOString(),
      results
    };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('SearXNG search timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
