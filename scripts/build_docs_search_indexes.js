'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const GENERATED_DIR = path.join(DOCS_DIR, 'generated/search');
const COMPACT_SCHEMA = 'xtend.docs.search-index.v1';
const FULLTEXT_SCHEMA = 'xtend.docs.search-fulltext-index.v1';
const COMPACT_BUDGET = 25 * 1024;
const FULLTEXT_BUDGET = 150 * 1024;
const LOCALES = Object.freeze(['de', 'en']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function articlePath(locale, slug) {
  if (slug === 'readme') return path.join(DOCS_DIR, locale, 'README.md');
  if (slug.startsWith('components-')) {
    return path.join(DOCS_DIR, locale, 'components', `${slug.slice('components-'.length)}.md`);
  }
  return path.join(DOCS_DIR, locale, `${slug}.md`);
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[>*_|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArticle(markdown, fallbackTitle) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const headings = Array.from(markdown.matchAll(/^##+\s+(.+)$/gm))
    .map((match) => stripMarkdown(match[1]))
    .filter(Boolean)
    .slice(0, 12);
  const withoutTitle = markdown.replace(/^#\s+.+$/m, '');
  const paragraphs = withoutTitle
    .split(/\n\s*\n/)
    .map(stripMarkdown)
    .filter((paragraph) => paragraph && paragraph.length >= 24);
  return {
    title: stripMarkdown(titleMatch ? titleMatch[1] : fallbackTitle),
    headings,
    summary: (paragraphs[0] || '').slice(0, 280)
  };
}

function compactBody(markdown) {
  const normalized = stripMarkdown(markdown)
    .normalize('NFKC')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLocaleLowerCase('en');
  const tokens = normalized.match(/[\p{L}\p{N}_.:/-]{2,}/gu) || [];
  const seen = new Set();
  const result = [];
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    result.push(token);
    if (result.length >= 520) break;
  }
  return result.join(' ');
}

function buildLocale(locale, menu) {
  const compactEntries = [];
  const fulltextEntries = [];
  const sourceParts = [];

  menu.forEach((entry) => {
    const filePath = articlePath(locale, entry.slug);
    if (!fs.existsSync(filePath)) throw new Error(`Missing ${locale} article for ${entry.slug}: ${filePath}`);
    const markdown = fs.readFileSync(filePath, 'utf8');
    const parsed = parseArticle(markdown, entry.labels && entry.labels[locale] || entry.label);
    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    const keywords = entry.keywords && Array.isArray(entry.keywords[locale]) ? entry.keywords[locale] : [];
    const common = {
      id: entry.id,
      slug: entry.slug,
      route: `/docs/${locale}/${entry.slug}`,
      title: parsed.title,
      aliases,
      keywords,
      headings: parsed.headings,
      summary: parsed.summary,
      trunk: entry.trunk,
      section: entry.section
    };
    compactEntries.push(common);
    fulltextEntries.push({ ...common, body: compactBody(markdown) });
    sourceParts.push(`${entry.slug}\0${markdown}`);
  });

  const sourceFingerprint = sha256(sourceParts.join('\n'));
  return {
    compact: {
      schema: COMPACT_SCHEMA,
      locale,
      sourceFingerprint,
      entryCount: compactEntries.length,
      fields: ['title', 'aliases', 'keywords', 'headings', 'summary'],
      entries: compactEntries
    },
    fulltext: {
      schema: FULLTEXT_SCHEMA,
      locale,
      sourceFingerprint,
      entryCount: fulltextEntries.length,
      fields: ['body'],
      entries: fulltextEntries
    }
  };
}

function serialize(value) {
  return `${JSON.stringify(value)}\n`;
}

function artifactRecord(locale, kind, value, budget) {
  const content = serialize(value);
  const gzipBytes = zlib.gzipSync(content, { level: 9 }).length;
  if (gzipBytes > budget) {
    throw new Error(`${locale} ${kind} search index is ${gzipBytes} gzip bytes; budget is ${budget}.`);
  }
  return {
    path: path.join(GENERATED_DIR, `${locale}.${kind}.json`),
    content,
    gzipBytes,
    budget
  };
}

function main() {
  const write = process.argv.includes('--write');
  const menu = readJson(path.join(DOCS_DIR, 'menu.json'));
  if (menu.length !== 166) throw new Error(`Expected 166 docs entries, received ${menu.length}.`);
  const artifacts = [];
  LOCALES.forEach((locale) => {
    const indexes = buildLocale(locale, menu);
    artifacts.push(artifactRecord(locale, 'compact', indexes.compact, COMPACT_BUDGET));
    artifacts.push(artifactRecord(locale, 'fulltext', indexes.fulltext, FULLTEXT_BUDGET));
  });

  if (write) fs.mkdirSync(GENERATED_DIR, { recursive: true });
  let drift = false;
  artifacts.forEach((artifact) => {
    if (write) {
      fs.writeFileSync(artifact.path, artifact.content);
    } else if (!fs.existsSync(artifact.path) || fs.readFileSync(artifact.path, 'utf8') !== artifact.content) {
      drift = true;
      process.stderr.write(`Search index drift: ${path.relative(ROOT, artifact.path)}\n`);
    }
    process.stdout.write(`${path.relative(ROOT, artifact.path)} ${artifact.gzipBytes}/${artifact.budget} gzip bytes\n`);
  });
  if (drift) process.exitCode = 1;
}

main();
