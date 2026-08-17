import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const XTEND_KNOWLEDGE_INDEX_SCHEMA = 'xtend.mcp.knowledge-index.v1';
export const XTEND_KNOWLEDGE_SEARCH_SCHEMA = 'xtend.mcp.knowledge-search.v1';
export const XTEND_KNOWLEDGE_CONTEXT_SCHEMA = 'xtend.mcp.knowledge-context.v1';
export const RMT_KNOWLEDGE_RESULT_SCHEMA = 'xtend-llm.tool-result.rmt-knowledge.v1';
export const RMT_KNOWLEDGE_TOOL_NAME = 'rmt_knowledge';

const KIT_FILES = Object.freeze({
  compact: 'rmt-ai-kit.compact.md',
  manifest: 'rmt-ai-kit.manifest.json',
  reference: 'rmt-ai-kit.reference.jsonl',
  recipes: 'rmt-ai-kit.recipes.jsonl',
  prompts: 'rmt-ai-kit.prompts.md',
  guardrails: 'rmt-ai-kit.guardrails.json'
});
const DEFAULT_CONTEXT_CHARS = 9000;
const MAX_CONTEXT_CHARS = 20000;
const DEFAULT_SEARCH_LIMIT = 6;
const MAX_SEARCH_LIMIT = 10;
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'bei', 'das', 'der', 'die', 'do', 'ein', 'eine',
  'for', 'from', 'how', 'ich', 'in', 'ist', 'mit', 'of', 'oder', 'the', 'to',
  'und', 'was', 'wie', 'with'
]);

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const cache = new Map();

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function cleanText(value = '', maxLength = 2000) {
  const text = String(value == null ? '' : value)
    .replace(/\u0000/gu, '')
    .replace(/\r\n/gu, '\n')
    .replace(/[ \t]+/gu, ' ')
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function tokenize(value = '') {
  return Array.from(new Set(String(value || '')
    .toLowerCase()
    .match(/[a-z0-9_.:-]{3,}|[äöüß][a-z0-9_.:-]*/giu) || []))
    .filter((token) => !STOP_WORDS.has(token));
}

function parseJsonl(text = '') {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readJson(filePath, fallback) {
  if (!filePath || !fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function existingDirectory(candidate) {
  if (!candidate) return '';
  const resolved = path.resolve(candidate);
  return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? resolved : '';
}

function existingFile(candidate) {
  if (!candidate) return '';
  const resolved = path.resolve(candidate);
  return fs.existsSync(resolved) && fs.statSync(resolved).isFile() ? resolved : '';
}

export function resolveXtendKnowledgeBundleDirectory(options = {}) {
  const candidates = [
    options.bundleDir,
    process.env.XTEND_MCP_KNOWLEDGE_DIR,
    path.join(packageRoot, 'generated'),
    path.join(repoRoot, 'products', 'xtend-mcp', 'generated')
  ];
  return candidates.map(existingDirectory).find(Boolean) || '';
}

export function resolveRmtKnowledgeDirectory(options = {}) {
  const bundleDir = resolveXtendKnowledgeBundleDirectory(options);
  const candidates = [
    options.knowledgeDir,
    options.kitDir,
    process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR,
    bundleDir && path.join(bundleDir, 'rmt-ai-kit'),
    path.join(repoRoot, 'tools', 'rmt-language', 'generated', 'rmt-ai-developer-kit'),
    path.join(repoRoot, 'docs', 'ai', 'rmt-ai-developer-kit'),
    path.join(repoRoot, 'products', 'xtend-llm', 'knowledge', 'rmt-ai-kit')
  ];
  return candidates.map(existingDirectory).find(Boolean) || '';
}

function resolveDocsFile(options = {}) {
  const bundleDir = resolveXtendKnowledgeBundleDirectory(options);
  return [options.docsFile, bundleDir && path.join(bundleDir, 'docs.jsonl')]
    .map(existingFile)
    .find(Boolean) || '';
}

export function loadRmtKnowledgeKit(options = {}) {
  const knowledgeDir = resolveRmtKnowledgeDirectory(options);
  if (!knowledgeDir) {
    throw new Error('RMT knowledge kit was not found. Set XTEND_MCP_KNOWLEDGE_DIR or XTEND_LLM_RMT_KNOWLEDGE_DIR.');
  }
  return {
    knowledgeDir,
    manifest: readJson(path.join(knowledgeDir, KIT_FILES.manifest), {}),
    guardrails: readJson(path.join(knowledgeDir, KIT_FILES.guardrails), {}),
    compact: readText(path.join(knowledgeDir, KIT_FILES.compact)),
    prompts: readText(path.join(knowledgeDir, KIT_FILES.prompts)),
    referenceRecords: parseJsonl(readText(path.join(knowledgeDir, KIT_FILES.reference))),
    recipeRecords: parseJsonl(readText(path.join(knowledgeDir, KIT_FILES.recipes)))
  };
}

export function loadXtendKnowledgeBundle(options = {}) {
  const bundleDir = resolveXtendKnowledgeBundleDirectory(options);
  const docsFile = resolveDocsFile(options);
  const kit = loadRmtKnowledgeKit(options);
  return {
    bundleDir,
    docsFile,
    manifest: readJson(bundleDir && path.join(bundleDir, 'knowledge-manifest.json'), {}),
    docs: docsFile ? parseJsonl(readText(docsFile)) : [],
    kit
  };
}

function inferDomains(record = {}) {
  const domains = new Set();
  if (record.operator) domains.add(record.operator);
  if (record.profile) domains.add(record.profile);
  if (record.kind) domains.add(record.kind);
  (record.domains || []).forEach((domain) => domains.add(String(domain)));
  (record.allowedContexts || []).forEach((domain) => domains.add(String(domain)));
  if (record.command && /maraca/iu.test(record.command)) domains.add('maraca');
  if (record.command && /lint/iu.test(record.command)) domains.add('repair');
  return Array.from(domains).filter(Boolean);
}

function recordSearchText(record = {}) {
  return [
    record.id, record.kind, record.operator, record.code, record.command, record.title,
    record.intent, record.description, record.syntax, record.parameters,
    record.validExample, record.invalidExample, record.diagnostics, record.repairHint,
    ...(record.domains || []), ...(record.allowedContexts || []),
    ...(record.commands || []), ...(record.steps || [])
  ].filter(Boolean).join('\n');
}

function createRmtDocument(record, group, index) {
  const domains = inferDomains(record);
  const text = recordSearchText(record);
  const id = record.id || `${group}:${index + 1}`;
  return {
    marker: group === 'recipe' ? `P${index + 1}` : `R${index + 1}`,
    group,
    scope: 'rmt-kit',
    id,
    uri: `xtend://rmt/kit/${group === 'recipe' ? 'recipe' : 'reference'}/${encodeURIComponent(id)}`,
    locale: 'en',
    title: record.title || record.operator || record.command || record.code || id,
    domains,
    record,
    text,
    tokens: tokenize(text)
  };
}

function splitMarkdownSections(document) {
  const lines = String(document.content || '').split('\n');
  const sections = [];
  let inFence = false;
  let heading = document.title;
  let start = 0;

  function push(end) {
    const content = lines.slice(start, end).join('\n').trim();
    if (!content) return;
    const sectionIndex = sections.length;
    const text = [document.title, heading, ...(document.menu?.keywords || []), content].join('\n');
    sections.push({
      marker: `D${sectionIndex + 1}`,
      group: 'docs',
      scope: 'docs',
      id: `${document.locale}:${document.slug}:${sectionIndex + 1}`,
      uri: document.uri,
      locale: document.locale,
      title: document.title,
      heading,
      domains: [document.menu?.group, document.menu?.trunk, document.menu?.section].filter(Boolean),
      record: document,
      text,
      content,
      tokens: tokenize(text)
    });
  }

  lines.forEach((line, index) => {
    if (/^\s*```/u.test(line)) inFence = !inFence;
    const match = !inFence ? line.match(/^#{1,6}\s+(.+?)\s*$/u) : null;
    if (match && index > start) {
      push(index);
      start = index;
      heading = match[1].trim();
    } else if (match) {
      heading = match[1].trim();
    }
  });
  push(lines.length);
  return sections.length ? sections : [{
    marker: 'D1',
    group: 'docs',
    scope: 'docs',
    id: `${document.locale}:${document.slug}:1`,
    uri: document.uri,
    locale: document.locale,
    title: document.title,
    heading: document.title,
    domains: [],
    record: document,
    text: document.content || '',
    content: document.content || '',
    tokens: tokenize(document.content || '')
  }];
}

export function createXtendKnowledgeIndex(options = {}) {
  const bundle = loadXtendKnowledgeBundle(options);
  const rmtDocuments = [
    ...bundle.kit.referenceRecords.map((record, index) => createRmtDocument(record, 'record', index)),
    ...bundle.kit.recipeRecords.map((record, index) => createRmtDocument(record, 'recipe', index))
  ];
  const docsDocuments = bundle.docs.flatMap(splitMarkdownSections);
  return {
    schema: XTEND_KNOWLEDGE_INDEX_SCHEMA,
    bundleDir: bundle.bundleDir,
    docsFile: bundle.docsFile,
    knowledgeDir: bundle.kit.knowledgeDir,
    manifest: bundle.manifest,
    kitManifest: bundle.kit.manifest,
    guardrails: bundle.kit.guardrails,
    compact: bundle.kit.compact,
    prompts: bundle.kit.prompts,
    referenceRecords: bundle.kit.referenceRecords,
    recipeRecords: bundle.kit.recipeRecords,
    resources: bundle.docs,
    documents: [...rmtDocuments, ...docsDocuments],
    rmtDocuments,
    docsDocuments
  };
}

function cacheKey(options = {}) {
  return JSON.stringify({
    bundleDir: options.bundleDir || process.env.XTEND_MCP_KNOWLEDGE_DIR || '',
    knowledgeDir: options.knowledgeDir || process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR || '',
    docsFile: options.docsFile || ''
  });
}

function getCachedIndex(options = {}) {
  if (options.noCache) return createXtendKnowledgeIndex(options);
  const key = cacheKey(options);
  if (!cache.has(key)) cache.set(key, createXtendKnowledgeIndex(options));
  return cache.get(key);
}

export function clearXtendKnowledgeCache() {
  cache.clear();
}

function hasCodeIntent(query = '') {
  return /\b(code|example|sample|snippet|recipe|beispiel|beispiele|syntax|schreib|write|implement)\b/iu.test(query);
}

function scoreDocument(document, query, queryTokens, domainFilters, codeIntent) {
  const text = document.text.toLowerCase();
  const title = String(document.title || '').toLowerCase();
  const heading = String(document.heading || '').toLowerCase();
  const domains = document.domains.map((domain) => String(domain).toLowerCase());
  let score = 0;
  queryTokens.forEach((token) => {
    if (document.tokens.includes(token)) score += 3;
    if (title.includes(token)) score += 2;
    if (heading.includes(token)) score += 2;
    if (domains.some((domain) => domain.includes(token))) score += 2;
  });
  const compactQuery = cleanText(query, 500).toLowerCase();
  if (compactQuery && text.includes(compactQuery)) score += 8;
  domainFilters.forEach((domain) => {
    const normalized = String(domain).toLowerCase();
    if (domains.includes(normalized) || title.includes(normalized) || text.includes(normalized)) score += 8;
  });
  if (codeIntent && document.group === 'recipe') score += 7;
  if (document.record.operator && queryTokens.includes(String(document.record.operator).toLowerCase())) score += 10;
  if (document.record.command && /maraca/iu.test(query) && /maraca/iu.test(document.record.command)) score += 8;
  if (/lint|repair|repar/iu.test(query) && domains.includes('repair')) score += 8;
  return score;
}

function normalizeRmtResultDocument(document, score) {
  const record = document.record;
  const base = {
    marker: document.marker,
    id: document.id,
    title: document.title,
    kind: record.kind || document.group,
    score,
    domains: document.domains,
    sourceRefs: record.sourceRefs || [],
    sourceRef: record.sourceRef || ''
  };
  for (const key of ['operator', 'syntax', 'description', 'validExample', 'invalidExample', 'diagnostics', 'command', 'intent', 'source']) {
    if (record[key]) base[key] = record[key];
  }
  if (record.steps) base.steps = record.steps;
  if (record.commands) base.commands = record.commands;
  return base;
}

function enrichRmtProvenance(record, document, manifest) {
  const artifactName = document.group === 'recipe' ? KIT_FILES.recipes : KIT_FILES.reference;
  return {
    ...record,
    resourceUri: document.uri,
    locale: 'und',
    documentType: document.group === 'recipe' ? 'rmt-ai-kit-recipe' : 'rmt-ai-kit-reference',
    sourceHash: manifest.artifacts?.[artifactName]?.sha256 || ''
  };
}

function excerpt(content, queryTokens, maxLength = 1400) {
  const text = String(content || '').trim();
  if (text.length <= maxLength) return text;
  const lower = text.toLowerCase();
  const positions = queryTokens.map((token) => lower.indexOf(token)).filter((position) => position >= 0);
  const center = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, center - Math.floor(maxLength / 3));
  const value = text.slice(start, start + maxLength).trim();
  return `${start > 0 ? '…' : ''}${value}${start + maxLength < text.length ? '…' : ''}`;
}

export function searchXtendKnowledge(input = {}, options = {}) {
  const index = getCachedIndex(options);
  const query = cleanText(input.query, 500);
  const locale = ['de', 'en', 'all'].includes(input.locale) ? input.locale : 'all';
  const scopes = Array.isArray(input.scopes) && input.scopes.length
    ? input.scopes.filter((scope) => ['docs', 'rmt-kit'].includes(scope))
    : ['docs', 'rmt-kit'];
  const limit = Number.isFinite(input.limit)
    ? Math.max(1, Math.min(MAX_SEARCH_LIMIT, Math.floor(input.limit)))
    : DEFAULT_SEARCH_LIMIT;
  const domains = Array.isArray(input.domains)
    ? input.domains.map((domain) => cleanText(domain, 64)).filter(Boolean).slice(0, 6)
    : [];
  const queryTokens = tokenize(`${query} ${domains.join(' ')}`);
  const codeIntent = hasCodeIntent(query);
  const candidates = index.documents.filter((document) => (
    scopes.includes(document.scope) && (document.scope !== 'docs' || locale === 'all' || document.locale === locale)
  ));
  const scored = candidates
    .map((document) => ({ document, score: scoreDocument(document, query, queryTokens, domains, codeIntent) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.document.uri.localeCompare(right.document.uri) || left.document.id.localeCompare(right.document.id));
  const selected = [];
  const seen = new Set();
  for (const entry of scored) {
    const key = entry.document.scope === 'docs' ? entry.document.uri : entry.document.id;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(entry);
    if (selected.length >= limit) break;
  }
  const hits = selected.map(({ document, score }) => {
    if (document.scope === 'rmt-kit') {
      const record = normalizeRmtResultDocument(document, score);
      return {
        uri: document.uri,
        id: document.id,
        scope: document.scope,
        kind: record.kind,
        locale: document.locale,
        title: document.title,
        heading: document.title,
        score,
        excerpt: excerpt(document.text, queryTokens),
        sourceHash: index.kitManifest.artifacts?.[document.group === 'recipe' ? KIT_FILES.recipes : KIT_FILES.reference]?.sha256 || '',
        sourcePath: document.record.sourceRef || document.record.sourceRefs?.[0] || ''
      };
    }
    return {
      uri: document.uri,
      id: document.id,
      scope: 'docs',
      kind: document.record.menu?.contentType || 'documentation',
      locale: document.locale,
      title: document.title,
      heading: document.heading,
      score,
      excerpt: excerpt(
        document.content,
        queryTokens,
        codeIntent && /```(?:rmt|xtendrmt)\b/iu.test(document.content) ? 4000 : 1400
      ),
      sourceHash: document.record.sha256,
      sourcePath: document.record.sourcePath
    };
  });
  return {
    schema: XTEND_KNOWLEDGE_SEARCH_SCHEMA,
    query,
    locale,
    scopes,
    limit,
    domains,
    hitCount: hits.length,
    hits
  };
}

export function createXtendKnowledgeContext(input = {}, options = {}) {
  const maxChars = Number.isFinite(input.maxChars)
    ? Math.max(1000, Math.min(MAX_CONTEXT_CHARS, Math.floor(input.maxChars)))
    : DEFAULT_CONTEXT_CHARS;
  const search = searchXtendKnowledge(input, options);
  const chunks = [
    'XTEND_KNOWLEDGE_CONTEXT',
    `Query: ${search.query}`,
    `Locales: ${search.locale}`,
    `Scopes: ${search.scopes.join(', ')}`,
    '',
    ...search.hits.flatMap((hit, index) => [
      `[K${index + 1}] ${hit.title}${hit.heading && hit.heading !== hit.title ? ` — ${hit.heading}` : ''}`,
      `Resource: ${hit.uri}`,
      `Source: ${hit.sourcePath}#sha256:${hit.sourceHash}`,
      hit.excerpt,
      ''
    ]),
    'Use only the cited XTend resources. Do not invent APIs or RMT syntax.',
    '/no_think'
  ];
  return {
    schema: XTEND_KNOWLEDGE_CONTEXT_SCHEMA,
    ...search,
    maxChars,
    context: chunks.join('\n').slice(0, maxChars).trim()
  };
}

function summarizeGuardrails(guardrails = {}) {
  return {
    forbiddenSyntax: (Array.isArray(guardrails.forbiddenSyntax) ? guardrails.forbiddenSyntax : []).slice(0, 12),
    securityBoundaries: (Array.isArray(guardrails.securityBoundaries) ? guardrails.securityBoundaries : []).slice(0, 6),
    repairPolicy: guardrails.repairPolicy || {}
  };
}

function formatRecordContext(records = []) {
  return records.map((record) => {
    const lines = [`[${record.marker}] ${record.title} (${record.kind})`];
    lines.push(`Resource: ${record.resourceUri} · locale:${record.locale} · ${record.documentType} · sha256:${record.sourceHash}`);
    if (record.syntax) lines.push(`Syntax: ${record.syntax}`);
    if (record.description) lines.push(`Use: ${record.description}`);
    if (record.validExample) lines.push(`Valid: ${record.validExample}`);
    if (record.invalidExample) lines.push(`Invalid: ${record.invalidExample}`);
    if (record.diagnostics) lines.push(`Diagnostic hint: ${record.diagnostics}`);
    if (record.command) lines.push(`Command: ${record.command}`);
    if (record.sourceRefs?.length) lines.push(`Sources: ${record.sourceRefs.join(', ')}`);
    return lines.join('\n');
  }).join('\n\n');
}

function formatRecipeContext(recipes = []) {
  return recipes.map((recipe) => {
    const lines = [`[${recipe.marker}] ${recipe.title} (recipe)`];
    lines.push(`Resource: ${recipe.resourceUri} · locale:${recipe.locale} · ${recipe.documentType} · sha256:${recipe.sourceHash}`);
    if (recipe.intent) lines.push(`Intent: ${recipe.intent}`);
    if (recipe.source) lines.push(['```rmt', recipe.source.trim(), '```'].join('\n'));
    if (recipe.sourceRef) lines.push(`SourceRef: ${recipe.sourceRef}`);
    if (recipe.steps?.length) lines.push(`Steps: ${recipe.steps.join(' ')}`);
    if (recipe.commands?.length) lines.push(`Commands: ${recipe.commands.join(' ; ')}`);
    return lines.join('\n');
  }).join('\n\n');
}

function createRmtPromptContext(input) {
  return [
    'XTEND_RMT_KNOWLEDGE_CONTEXT',
    `Query: ${cleanText(input.query, 500)}`,
    `Knowledge schema: ${input.manifest.kitSchema || input.manifest.schema || 'xtend.rmt.ai-developer-kit.v1'}`,
    '',
    'Answer rules:',
    '- Answer only from this RMT knowledge context and the conversation.',
    '- Do not invent RMT syntax. If a needed operator is missing, say so.',
    '- Put RMT code examples in fenced ```rmt blocks.',
    '- Mention `xt rmt lint <file> --agent` for validation or repair workflows.',
    '- Keep runtime behavior separated into Compiler Record, Host Adapter and Scheduler Signal.',
    '',
    'Guardrails:',
    `Forbidden: ${input.guardrailsSummary.forbiddenSyntax.join(', ')}`,
    `Boundaries: ${input.guardrailsSummary.securityBoundaries.join(', ')}`,
    '',
    'Reference records:',
    formatRecordContext(input.records),
    '',
    'Recipes:',
    formatRecipeContext(input.recipes),
    '',
    '/no_think'
  ].join('\n').slice(0, DEFAULT_CONTEXT_CHARS).trim();
}

export function createRmtKnowledgeIndex(options = {}) {
  const index = getCachedIndex(options);
  return {
    schema: 'xtend-llm.rmt-knowledge-index.v1',
    knowledgeDir: index.knowledgeDir,
    manifest: index.kitManifest,
    guardrails: index.guardrails,
    compact: index.compact,
    prompts: index.prompts,
    documents: index.rmtDocuments
  };
}

export async function executeRmtKnowledge(request, options = {}) {
  const index = createRmtKnowledgeIndex(options);
  const query = cleanText(request?.arguments?.query || '', 500);
  const maxRecords = Number.isFinite(request?.arguments?.maxRecords)
    ? Math.max(1, Math.min(8, Math.floor(request.arguments.maxRecords)))
    : 6;
  const domains = Array.isArray(request?.arguments?.domains)
    ? request.arguments.domains.map((domain) => cleanText(domain, 64)).filter(Boolean).slice(0, 6)
    : [];
  const includeRecipes = request?.arguments?.includeRecipes !== false;
  const queryTokens = tokenize(`${query} ${domains.join(' ')}`);
  const codeIntent = hasCodeIntent(query);
  const scored = index.documents
    .map((document) => ({ document, score: scoreDocument(document, query, queryTokens, domains, codeIntent) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id));
  const fallback = scored.length ? scored : index.documents
    .filter((document) => document.group === 'record')
    .slice(0, maxRecords)
    .map((document) => ({ document, score: 1 }));
  const records = fallback
    .filter((entry) => entry.document.group === 'record')
    .slice(0, maxRecords)
    .map((entry) => enrichRmtProvenance(normalizeRmtResultDocument(entry.document, entry.score), entry.document, index.manifest));
  const recipes = includeRecipes
    ? fallback.filter((entry) => entry.document.group === 'recipe').slice(0, 3)
      .map((entry) => enrichRmtProvenance(normalizeRmtResultDocument(entry.document, entry.score), entry.document, index.manifest))
    : [];
  if (includeRecipes && recipes.length === 0 && codeIntent) {
    recipes.push(...index.documents.filter((document) => document.group === 'recipe').slice(0, 2)
      .map((document) => enrichRmtProvenance(normalizeRmtResultDocument(document, 1), document, index.manifest)));
  }
  const guardrailsSummary = summarizeGuardrails(index.guardrails);
  return {
    schema: RMT_KNOWLEDGE_RESULT_SCHEMA,
    toolCallId: request?.toolCallId,
    name: RMT_KNOWLEDGE_TOOL_NAME,
    query,
    maxRecords,
    domains,
    includeRecipes,
    knowledgeDir: index.knowledgeDir,
    sourceHashes: Array.isArray(index.manifest.sourceHashes) ? index.manifest.sourceHashes : [],
    recordCount: records.length,
    recipeCount: recipes.length,
    records,
    recipes,
    guardrailsSummary,
    promptContext: createRmtPromptContext({ query, manifest: index.manifest, guardrailsSummary, records, recipes })
  };
}

export function getXtendKnowledgeResource(uri, options = {}) {
  const index = getCachedIndex(options);
  if (uri === 'xtend://rmt/kit/manifest') return { mimeType: 'application/json', text: JSON.stringify(index.kitManifest, null, 2) };
  if (uri === 'xtend://rmt/kit/compact') return { mimeType: 'text/markdown', text: index.compact };
  const docsMatch = uri.match(/^xtend:\/\/docs\/(de|en)\/([^/?#]+)$/u);
  if (docsMatch) {
    const document = index.resources.find((entry) => entry.locale === docsMatch[1] && entry.slug === decodeURIComponent(docsMatch[2]));
    return document ? { mimeType: 'text/markdown', text: document.content, document } : null;
  }
  const kitMatch = uri.match(/^xtend:\/\/rmt\/kit\/(reference|recipe)\/([^/?#]+)$/u);
  if (kitMatch) {
    const records = kitMatch[1] === 'recipe' ? index.recipeRecords : index.referenceRecords;
    const record = records.find((entry) => String(entry.id) === decodeURIComponent(kitMatch[2]));
    return record ? { mimeType: 'application/json', text: JSON.stringify(record, null, 2), record } : null;
  }
  return null;
}

export function getXtendDocsCatalog(locale, options = {}, pagination = {}) {
  const index = getCachedIndex(options);
  const normalizedLocale = locale === 'de' || locale === 'en' ? locale : 'all';
  const allResources = index.resources
    .filter((document) => normalizedLocale === 'all' || document.locale === normalizedLocale)
    .map((document) => ({
      uri: document.uri,
      name: document.title,
      title: document.title,
      description: `${document.sourcePath} · sha256:${document.sha256}`,
      mimeType: 'text/markdown',
      locale: document.locale,
      slug: document.slug,
      sourceHash: document.sha256
    }));
  const pageSize = pagination.all === true
    ? allResources.length
    : Math.max(1, Math.min(100, Number.isInteger(pagination.pageSize) ? pagination.pageSize : 50));
  const offset = pagination.all === true
    ? 0
    : Math.max(0, Number.parseInt(String(pagination.cursor || '0'), 10) || 0);
  const resources = allResources.slice(offset, offset + pageSize);
  const nextCursor = offset + resources.length < allResources.length ? String(offset + resources.length) : null;
  return {
    schema: 'xtend.mcp.docs-catalog.v1',
    locale: normalizedLocale,
    count: allResources.length,
    pageCount: resources.length,
    cursor: offset ? String(offset) : null,
    nextCursor,
    nextUri: nextCursor ? `xtend://docs/catalog/${normalizedLocale}?cursor=${nextCursor}` : null,
    resources,
    catalogHash: sha256(JSON.stringify(allResources))
  };
}

export function getXtendRmtKitRecords(kind, options = {}) {
  const index = getCachedIndex(options);
  return kind === 'recipe' ? index.recipeRecords : index.referenceRecords;
}
