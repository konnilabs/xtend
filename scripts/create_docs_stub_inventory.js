#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GUIDE_DOCS_INVENTORY_SCHEMA = 'xtend.docs.guide-inventory.v1';
const GUIDE_DOCS_INVENTORY_ENTRY_SCHEMA = 'xtend.docs.guide-inventory-entry.v1';
const GUIDE_DOCS_ARTICLE_SCHEMA = 'xtend.docs.guide-article-metrics.v1';
const DEFAULT_MIN_GUIDE_CHARS = 2000;
const LOCALES = Object.freeze(['de', 'en']);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function readTextIfExists(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function localizedPathForSlug(locale, slug) {
  if (slug === 'readme') return `docs/${locale}/README.md`;
  if (slug.startsWith('components-')) {
    return `docs/${locale}/components/${slug.slice('components-'.length)}.md`;
  }
  return `docs/${locale}/${slug}.md`;
}

function stripCodeBlocks(markdown) {
  return String(markdown || '').replace(/```[\s\S]*?```/g, '');
}

function bodyWithoutTitle(markdown) {
  return stripCodeBlocks(markdown).replace(/^#.*$/m, '').trim();
}

function codeBlockCount(markdown) {
  return (String(markdown || '').match(/```[^\n]*\n[\s\S]*?```/g) || []).length;
}

function headingCount(markdown) {
  return (String(markdown || '').match(/^##\s+/gm) || []).length;
}

function collectMarkdownLinks(markdown) {
  const source = stripCodeBlocks(markdown);
  const links = [];
  const pattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(source))) {
    const target = match[1].trim().replace(/^<|>$/g, '').split(/\s+/)[0];
    if (!target || target.startsWith('#')) continue;
    if (/^(?:https?:|mailto:|tel:)/i.test(target)) continue;
    links.push(target.split('#')[0].split('?')[0]);
  }
  return links.filter(Boolean);
}

function isComponentReference(menuEntry) {
  return menuEntry.group === 'components' && menuEntry.tier === 'component-reference';
}

function toArticleMetrics(rootDir, menuEntry, locale, threshold) {
  const relativePath = localizedPathForSlug(locale, menuEntry.slug);
  const absolutePath = path.join(rootDir, relativePath);
  const exists = fs.existsSync(absolutePath);
  const text = exists ? readTextIfExists(rootDir, relativePath) : '';
  const body = bodyWithoutTitle(text);
  const links = collectMarkdownLinks(text);
  const linkErrors = links.filter((target) => {
    const resolved = path.normalize(path.join(rootDir, path.dirname(relativePath), target));
    return !resolved.startsWith(rootDir) || !fs.existsSync(resolved);
  });
  const nonCodeChars = [...body].length;
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    schema: GUIDE_DOCS_ARTICLE_SCHEMA,
    locale,
    path: relativePath,
    exists,
    nonCodeChars,
    words,
    h2Count: headingCount(text),
    codeBlockCount: codeBlockCount(text),
    linkCount: links.length,
    linkErrors,
    stub: !exists || nonCodeChars < threshold
  };
}

function createDocsStubInventory(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const threshold = Number(options.threshold || options.minNonCodeChars || DEFAULT_MIN_GUIDE_CHARS);
  const menu = readJson(rootDir, 'docs/menu.json');
  const entries = menu
    .filter((entry) => !isComponentReference(entry))
    .map((entry) => {
      const articles = Object.fromEntries(LOCALES.map((locale) => [
        locale,
        toArticleMetrics(rootDir, entry, locale, threshold)
      ]));
      const articleList = Object.values(articles);
      const localizedComplete = articleList.every((article) => article.exists);
      const stub = articleList.some((article) => article.stub);
      return {
        schema: GUIDE_DOCS_INVENTORY_ENTRY_SCHEMA,
        slug: entry.slug,
        id: entry.id,
        group: entry.group || 'root',
        parent: entry.parent || 'root',
        tier: entry.tier || 'basic',
        rank: entry.rank || 0,
        labels: entry.labels || {},
        localizedComplete,
        stub,
        minNonCodeChars: Math.min(...articleList.map((article) => article.nonCodeChars)),
        minWords: Math.min(...articleList.map((article) => article.words)),
        minH2Count: Math.min(...articleList.map((article) => article.h2Count)),
        minCodeBlockCount: Math.min(...articleList.map((article) => article.codeBlockCount)),
        articles
      };
    });

  const stubEntries = entries.filter((entry) => entry.stub);
  const allArticles = entries.flatMap((entry) => Object.values(entry.articles).map((article) => ({
    slug: entry.slug,
    group: entry.group,
    parent: entry.parent,
    ...article
  })));
  const stubArticles = allArticles.filter((article) => article.stub);
  const stubGroups = {};
  stubEntries.forEach((entry) => {
    const groupKey = entry.parent || entry.group || 'root';
    stubGroups[groupKey] = (stubGroups[groupKey] || 0) + 1;
  });

  return {
    schema: GUIDE_DOCS_INVENTORY_SCHEMA,
    ok: stubEntries.length === 0 && stubArticles.length === 0,
    threshold,
    locales: LOCALES.slice(),
    menuSlugCount: menu.length,
    guideSlugCount: entries.length,
    guideArticleCount: allArticles.length,
    stubSlugCount: stubEntries.length,
    stubArticleCount: stubArticles.length,
    stubSlugs: stubEntries.map((entry) => entry.slug),
    stubGroups,
    shortestArticles: allArticles
      .filter((article) => article.exists)
      .sort((a, b) => a.nonCodeChars - b.nonCodeChars)
      .slice(0, 20),
    entries
  };
}

function parseArgs(argv) {
  const args = { threshold: DEFAULT_MIN_GUIDE_CHARS, json: false };
  argv.forEach((arg, index) => {
    if (arg === '--json') args.json = true;
    if (arg === '--threshold') args.threshold = Number(argv[index + 1]);
    if (arg.startsWith('--threshold=')) args.threshold = Number(arg.split('=')[1]);
  });
  return args;
}

function printInventory(inventory, json = false) {
  if (json) {
    console.log(JSON.stringify(inventory, null, 2));
    return;
  }
  console.log(`XTend guide docs inventory (${inventory.guideSlugCount} guide slugs, ${inventory.guideArticleCount} localized articles).`);
  console.log(`Stub threshold: ${inventory.threshold} non-code chars.`);
  console.log(`Stub slugs: ${inventory.stubSlugCount}; stub articles: ${inventory.stubArticleCount}.`);
  if (inventory.stubSlugs.length) {
    console.log(`Shortest stubs: ${inventory.stubSlugs.slice(0, 20).join(', ')}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inventory = createDocsStubInventory({ threshold: args.threshold });
  printInventory(inventory, args.json);
  if (!inventory.ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_MIN_GUIDE_CHARS,
  GUIDE_DOCS_ARTICLE_SCHEMA,
  GUIDE_DOCS_INVENTORY_ENTRY_SCHEMA,
  GUIDE_DOCS_INVENTORY_SCHEMA,
  LOCALES,
  collectMarkdownLinks,
  createDocsStubInventory,
  localizedPathForSlug,
  stripCodeBlocks
};
