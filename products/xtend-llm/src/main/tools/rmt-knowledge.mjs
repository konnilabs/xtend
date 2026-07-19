import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RMT_KNOWLEDGE_TOOL_NAME
} from '../constants.mjs';

export const RMT_KNOWLEDGE_RESULT_SCHEMA = 'xtend-llm.tool-result.rmt-knowledge.v1';

const KIT_FILES = Object.freeze({
  compact: 'rmt-ai-kit.compact.md',
  manifest: 'rmt-ai-kit.manifest.json',
  reference: 'rmt-ai-kit.reference.jsonl',
  recipes: 'rmt-ai-kit.recipes.jsonl',
  prompts: 'rmt-ai-kit.prompts.md',
  guardrails: 'rmt-ai-kit.guardrails.json'
});
const MAX_CONTEXT_CHARS = 9000;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'bei',
  'das',
  'der',
  'die',
  'do',
  'ein',
  'eine',
  'for',
  'from',
  'how',
  'ich',
  'in',
  'ist',
  'mit',
  'of',
  'oder',
  'the',
  'to',
  'und',
  'was',
  'wie',
  'with'
]);

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(moduleDir, '..', '..', '..');
const repoRoot = path.resolve(productRoot, '..', '..');

let cachedIndex = null;

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
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function existingDirectory(candidate) {
  if (!candidate) return '';
  const resolved = path.resolve(candidate);
  return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? resolved : '';
}

export function resolveRmtKnowledgeDirectory(options = {}) {
  const candidates = [
    options.knowledgeDir,
    process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR,
    path.join(repoRoot, 'tools', 'rmt-language', 'generated', 'rmt-ai-developer-kit'),
    path.join(repoRoot, 'docs', 'ai', 'rmt-ai-developer-kit'),
    path.join(productRoot, 'knowledge', 'rmt-ai-kit')
  ];
  return candidates.map(existingDirectory).find(Boolean) || '';
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
    record.id,
    record.kind,
    record.operator,
    record.code,
    record.command,
    record.title,
    record.intent,
    record.description,
    record.syntax,
    record.parameters,
    record.validExample,
    record.invalidExample,
    record.diagnostics,
    record.repairHint,
    ...(record.domains || []),
    ...(record.allowedContexts || []),
    ...(record.commands || []),
    ...(record.steps || [])
  ].filter(Boolean).join('\n');
}

function createDocument(record, group, index) {
  const domains = inferDomains(record);
  const text = recordSearchText(record);
  return {
    marker: group === 'recipe' ? `P${index + 1}` : `R${index + 1}`,
    group,
    id: record.id || `${group}:${index + 1}`,
    title: record.title || record.operator || record.command || record.code || record.id || `${group} ${index + 1}`,
    domains,
    record,
    text,
    tokens: tokenize(text)
  };
}

export function loadRmtKnowledgeKit(options = {}) {
  const knowledgeDir = resolveRmtKnowledgeDirectory(options);
  if (!knowledgeDir) {
    throw new Error('RMT knowledge kit was not found. Set XTEND_LLM_RMT_KNOWLEDGE_DIR or include knowledge/rmt-ai-kit in the app bundle.');
  }
  const manifest = readJson(path.join(knowledgeDir, KIT_FILES.manifest), {});
  const guardrails = readJson(path.join(knowledgeDir, KIT_FILES.guardrails), {});
  const compact = readText(path.join(knowledgeDir, KIT_FILES.compact));
  const prompts = readText(path.join(knowledgeDir, KIT_FILES.prompts));
  const referenceRecords = parseJsonl(readText(path.join(knowledgeDir, KIT_FILES.reference)));
  const recipeRecords = parseJsonl(readText(path.join(knowledgeDir, KIT_FILES.recipes)));
  return {
    knowledgeDir,
    manifest,
    guardrails,
    compact,
    prompts,
    referenceRecords,
    recipeRecords
  };
}

export function createRmtKnowledgeIndex(options = {}) {
  const kit = loadRmtKnowledgeKit(options);
  const documents = [
    ...kit.referenceRecords.map((record, index) => createDocument(record, 'record', index)),
    ...kit.recipeRecords.map((record, index) => createDocument(record, 'recipe', index))
  ];
  return {
    schema: 'xtend-llm.rmt-knowledge-index.v1',
    knowledgeDir: kit.knowledgeDir,
    manifest: kit.manifest,
    guardrails: kit.guardrails,
    compact: kit.compact,
    prompts: kit.prompts,
    documents
  };
}

function getCachedIndex(options = {}) {
  if (options.noCache || options.knowledgeDir) return createRmtKnowledgeIndex(options);
  if (!cachedIndex) cachedIndex = createRmtKnowledgeIndex(options);
  return cachedIndex;
}

function hasCodeIntent(query = '') {
  return /\b(code|example|sample|snippet|recipe|beispiel|beispiele|syntax|schreib|write|implement)\b/iu.test(query);
}

function scoreDocument(document, query, queryTokens, domainFilters, codeIntent) {
  const text = document.text.toLowerCase();
  const title = String(document.title || '').toLowerCase();
  const domains = document.domains.map((domain) => String(domain).toLowerCase());
  let score = 0;

  queryTokens.forEach((token) => {
    if (document.tokens.includes(token)) score += 3;
    if (title.includes(token)) score += 2;
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

function normalizeResultDocument(document, score) {
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
  if (record.operator) base.operator = record.operator;
  if (record.syntax) base.syntax = record.syntax;
  if (record.description) base.description = record.description;
  if (record.validExample) base.validExample = record.validExample;
  if (record.invalidExample) base.invalidExample = record.invalidExample;
  if (record.diagnostics) base.diagnostics = record.diagnostics;
  if (record.command) base.command = record.command;
  if (record.intent) base.intent = record.intent;
  if (record.source) base.source = record.source;
  if (record.steps) base.steps = record.steps;
  if (record.commands) base.commands = record.commands;
  return base;
}

function summarizeGuardrails(guardrails = {}) {
  const forbidden = Array.isArray(guardrails.forbiddenSyntax) ? guardrails.forbiddenSyntax : [];
  const boundaries = Array.isArray(guardrails.securityBoundaries) ? guardrails.securityBoundaries : [];
  return {
    forbiddenSyntax: forbidden.slice(0, 12),
    securityBoundaries: boundaries.slice(0, 6),
    repairPolicy: guardrails.repairPolicy || {}
  };
}

function formatRecordContext(records = []) {
  return records.map((record) => {
    const lines = [`[${record.marker}] ${record.title} (${record.kind})`];
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
    if (recipe.intent) lines.push(`Intent: ${recipe.intent}`);
    if (recipe.source) lines.push(['```rmt', recipe.source.trim(), '```'].join('\n'));
    if (recipe.sourceRef) lines.push(`SourceRef: ${recipe.sourceRef}`);
    if (recipe.steps?.length) lines.push(`Steps: ${recipe.steps.join(' ')}`);
    if (recipe.commands?.length) lines.push(`Commands: ${recipe.commands.join(' ; ')}`);
    return lines.join('\n');
  }).join('\n\n');
}

function createPromptContext(input) {
  const lines = [
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
  ];
  return lines.join('\n').slice(0, MAX_CONTEXT_CHARS).trim();
}

export async function executeRmtKnowledge(request, options = {}) {
  const index = getCachedIndex(options);
  const query = cleanText(request.arguments?.query || '', 500);
  const maxRecords = Number.isFinite(request.arguments?.maxRecords)
    ? Math.max(1, Math.min(8, Math.floor(request.arguments.maxRecords)))
    : 6;
  const domains = Array.isArray(request.arguments?.domains)
    ? request.arguments.domains.map((domain) => cleanText(domain, 64)).filter(Boolean).slice(0, 6)
    : [];
  const includeRecipes = request.arguments?.includeRecipes !== false;
  const queryTokens = tokenize(`${query} ${domains.join(' ')}`);
  const codeIntent = hasCodeIntent(query);
  const scored = index.documents
    .map((document) => ({
      document,
      score: scoreDocument(document, query, queryTokens, domains, codeIntent)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id));
  const fallback = scored.length ? scored : index.documents
    .filter((document) => document.group === 'record')
    .slice(0, maxRecords)
    .map((document) => ({ document, score: 1 }));
  const records = fallback
    .filter((entry) => entry.document.group === 'record')
    .slice(0, maxRecords)
    .map((entry) => normalizeResultDocument(entry.document, entry.score));
  const recipes = includeRecipes
    ? fallback
      .filter((entry) => entry.document.group === 'recipe')
      .slice(0, 3)
      .map((entry) => normalizeResultDocument(entry.document, entry.score))
    : [];
  if (includeRecipes && recipes.length === 0 && codeIntent) {
    const recipeFallback = index.documents
      .filter((document) => document.group === 'recipe')
      .slice(0, 2)
      .map((document) => normalizeResultDocument(document, 1));
    recipes.push(...recipeFallback);
  }
  const guardrailsSummary = summarizeGuardrails(index.guardrails);
  const promptContext = createPromptContext({
    query,
    manifest: index.manifest,
    guardrailsSummary,
    records,
    recipes
  });

  return {
    schema: RMT_KNOWLEDGE_RESULT_SCHEMA,
    toolCallId: request.toolCallId,
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
    promptContext
  };
}
