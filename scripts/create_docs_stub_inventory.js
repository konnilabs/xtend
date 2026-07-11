#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DOCS_CONTENT_PROFILES,
  DOCS_CONTENT_TYPES,
  profileForContentType
} = require('./docs_content_profiles');

const GUIDE_DOCS_INVENTORY_SCHEMA = 'xtend.docs.guide-inventory.v1';
const GUIDE_DOCS_INVENTORY_ENTRY_SCHEMA = 'xtend.docs.guide-inventory-entry.v1';
const GUIDE_DOCS_ARTICLE_SCHEMA = 'xtend.docs.guide-article-metrics.v1';
const DEFAULT_MIN_GUIDE_CHARS = 500;
const LOCALES = Object.freeze(['de', 'en']);
const KNOWN_GUIDE_BOILERPLATE_PHRASES = Object.freeze([
  'Wenn die Seite weiterhin zu abstrakt wirkt',
  'Dieser Abschnitt wird aus dem Guide-Inventar erzeugt',
  'If the page still feels too abstract',
  'This section is generated from the guide inventory',
  'This expanded section turns',
  'Dieser erweiterte Abschnitt macht aus',
  'The structure follows the same pattern used by mature developer documentation systems',
  'Die Struktur folgt etablierten Entwicklerdokumentationen',
  'The stable signal is not article length',
  'Stabil ist nicht die Textlänge',
  'These anchors are concrete enough for a third-party developer',
  'Diese Anker sind konkret genug, damit ein Drittentwickler',
  'Run this check when the article, an example or the named public surface changes',
  'Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird',
  'The command must finish without link errors, without known boilerplate',
  'Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate',
  'If source and article disagree, source wins',
  'Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich',
  'If a link from this article breaks, repair the local Markdown target path',
  'Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad',
  'If an example is copied, file paths, record names and commands from this section',
  'Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt',
  'beschreibt die öffentliche RMT-Oberfläche dieser Seite',
  'describes the public RMT surface for this page',
  'mit dem kleinsten Record-Beispiel',
  'with the smallest record example',
  'beschreibt den Core-Pfad über lokale Module',
  'documents the core path through local modules',
  'Lies den Überblick, kopiere das kleinste passende Beispiel',
  'Read the overview, copy the smallest suitable example',
  'Lege Budgets fest, prüfe Tastatur- und Screenreader-Signale',
  'Define budgets, check keyboard and screenreader signals',
  'Security in XTend beginnt mit expliziten Grenzen',
  'Security in XTend starts with explicit boundaries',
  'Erlaube nur lokale Module, behandle Markdown und HTML-Fragmente',
  'Allow local modules only, treat Markdown and HTML fragments'
]);
const REPEATED_PARAGRAPH_MIN_CHARS = 120;
const REPEATED_PARAGRAPH_MIN_ARTICLES = 4;

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

function stripKnownGuideBoilerplate(markdown) {
  let text = String(markdown || '');
  KNOWN_GUIDE_BOILERPLATE_PHRASES.forEach((phrase) => {
    const pattern = new RegExp(`^.*${escapeRegExp(phrase)}.*(?:\\n|$)`, 'gmi');
    text = text.replace(pattern, '');
  });
  return text;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function knownBoilerplateHits(markdown) {
  const text = String(markdown || '');
  return KNOWN_GUIDE_BOILERPLATE_PHRASES
    .filter((phrase) => text.includes(phrase));
}

function codeBlockCount(markdown) {
  return (String(markdown || '').match(/```[^\n]*\n[\s\S]*?```/g) || []).length;
}

function headingCount(markdown) {
  return (String(markdown || '').match(/^##\s+/gm) || []).length;
}

function codeBlocks(markdown) {
  const blocks = [];
  const pattern = /```[^\n]*\n([\s\S]*?)```/g;
  let match;
  while ((match = pattern.exec(String(markdown || '')))) {
    blocks.push(match[1]);
  }
  return blocks;
}

function commandLines(markdown) {
  const commands = [];
  const pattern = /^\s*(?:npm|node|npx|php|xt|curl|git|chromium|\/usr\/bin\/chromium-browser)\b[^\n]*$/gm;
  const source = String(markdown || '');
  let match;
  while ((match = pattern.exec(source))) {
    commands.push(match[0].trim());
  }
  return Array.from(new Set(commands));
}

function collectTechnicalFacts(markdown) {
  const source = String(markdown || '');
  const schemas = Array.from(new Set(source.match(/\bxtend\.[a-z0-9.-]+\.v\d+\b/gi) || [])).sort();
  const commands = commandLines(source).sort();
  const devApiMethods = Array.from(new Set(source.match(/\bget(?:PerformanceSnapshot|HydrationSnapshot|FabricTelemetrySnapshot|KernelSnapshot)\(\)/g) || [])).sort();
  return { schemas, commands, devApiMethods };
}

function collectConcreteAnchors(markdown) {
  const source = String(markdown || '');
  const anchors = [];
  const patterns = [
    /`((?:[\w.-]+\/)+[\w./@-]+)`/g,
    /`([A-Za-z0-9_.-]+\.(?:js|mjs|cjs|ts|d\.ts|json|rmt|php|md|html|css|yml|yaml))`/g,
    /`((?:npm|node|npx|php|xt|curl|git|chromium)\s+[^`]+)`/g,
    /`(x-[a-z0-9-]+|xtend-i18n|xstate)`/g,
    /\b(x-[a-z0-9-]+|xtend-i18n|xstate)\b/g,
    /`(xtend\.[a-z0-9.-]+\.v\d+)`/gi,
    /\b(xtend\.[a-z0-9.-]+\.v\d+)\b/gi,
    /`((?:create|render|compile|resolve|register|load)[A-Z][A-Za-z0-9_]*)`/g,
    /\b((?:create|render|compile|resolve|register|load)[A-Z][A-Za-z0-9_]*)\b/g,
    /`((?:template|state|selector|action|event|surface|resource|portal|validation|transition)\s+[A-Za-z0-9_.:-]+)`/g,
    /\b(data-manifest|xtend-preload|manifest\.json|components\/manifest\.json)\b/g,
    /`([a-z0-9]+(?:[-.:][a-z0-9]+){1,})`/gi
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(source))) {
      anchors.push(match[1]);
    }
  });
  commandLines(source).forEach((command) => anchors.push(command));
  return Array.from(new Set(anchors.filter((value) => String(value).trim().length > 1)));
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
  const bodyWithoutKnownBoilerplate = bodyWithoutTitle(stripKnownGuideBoilerplate(text));
  const links = collectMarkdownLinks(text);
  const linkErrors = links.filter((target) => {
    const resolved = path.normalize(path.join(rootDir, path.dirname(relativePath), target));
    return !resolved.startsWith(rootDir) || !fs.existsSync(resolved);
  });
  const nonCodeChars = [...body].length;
  const nonCodeCharsWithoutKnownBoilerplate = [...bodyWithoutKnownBoilerplate].length;
  const words = body.split(/\s+/).filter(Boolean).length;
  const commands = commandLines(text);
  const blocks = codeBlocks(text);
  const commandCodeBlockCount = blocks.filter((block) => commandLines(block).length > 0).length;
  const boilerplateHits = knownBoilerplateHits(text);
  const concreteAnchors = collectConcreteAnchors(text);
  const contentType = DOCS_CONTENT_TYPES.includes(menuEntry.contentType) ? menuEntry.contentType : 'concept';
  const profile = profileForContentType(contentType);
  const minRequiredNonCodeChars = Math.max(Number(threshold || 0), profile.minNonCodeChars);

  return {
    schema: GUIDE_DOCS_ARTICLE_SCHEMA,
    locale,
    path: relativePath,
    contentType,
    profile,
    exists,
    nonCodeChars,
    nonCodeCharsWithoutKnownBoilerplate,
    words,
    h2Count: headingCount(text),
    codeBlockCount: blocks.length,
    commandCount: commands.length,
    commandCodeBlockCount,
    codeCommandRatio: blocks.length === 0 ? 0 : commandCodeBlockCount / blocks.length,
    linkCount: links.length,
    linkErrors,
    concreteAnchorCount: concreteAnchors.length,
    concreteAnchors: concreteAnchors.slice(0, 20),
    boilerplatePhraseCount: boilerplateHits.length,
    boilerplatePhrases: boilerplateHits,
    technicalFacts: collectTechnicalFacts(text),
    minRequiredNonCodeChars,
    stub: !exists || nonCodeChars < minRequiredNonCodeChars
  };
}

function normalizeParagraph(paragraph) {
  return String(paragraph || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectRepeatedParagraphWarnings(allArticles, rootDir) {
  const byParagraph = new Map();
  allArticles
    .filter((article) => article.exists)
    .forEach((article) => {
      const text = stripCodeBlocks(readTextIfExists(rootDir, article.path));
      const seen = new Set();
      text.split(/\n{2,}/g)
        .filter((paragraph) => !paragraph.split(/\n/g).some((line) => /^\s*[-*]\s+/.test(line)))
        .filter((paragraph) => commandLines(paragraph).length === 0)
        .map(normalizeParagraph)
        .filter((paragraph) => paragraph.length >= REPEATED_PARAGRAPH_MIN_CHARS)
        .filter((paragraph) => !paragraph.startsWith('#') && !paragraph.startsWith('- '))
        .forEach((paragraph) => {
          if (seen.has(paragraph)) return;
          seen.add(paragraph);
          const current = byParagraph.get(paragraph) || [];
          current.push(article.path);
          byParagraph.set(paragraph, current);
        });
    });

  return Array.from(byParagraph.entries())
    .filter(([, paths]) => paths.length >= REPEATED_PARAGRAPH_MIN_ARTICLES)
    .map(([paragraph, paths]) => ({
      paragraph: paragraph.slice(0, 220),
      articleCount: paths.length,
      paths: paths.slice(0, 20)
    }))
    .sort((a, b) => b.articleCount - a.articleCount || a.paragraph.localeCompare(b.paragraph));
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
        contentType: entry.contentType || 'concept',
        localizedComplete,
        stub,
        minNonCodeChars: Math.min(...articleList.map((article) => article.nonCodeChars)),
        minRequiredNonCodeChars: Math.max(...articleList.map((article) => article.minRequiredNonCodeChars)),
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
  const repeatedParagraphWarnings = collectRepeatedParagraphWarnings(allArticles, rootDir);
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
    contentProfiles: DOCS_CONTENT_PROFILES,
    locales: LOCALES.slice(),
    menuSlugCount: menu.length,
    guideSlugCount: entries.length,
    guideArticleCount: allArticles.length,
    stubSlugCount: stubEntries.length,
    stubArticleCount: stubArticles.length,
    stubSlugs: stubEntries.map((entry) => entry.slug),
    stubGroups,
    boilerplateArticleCount: allArticles.filter((article) => article.boilerplatePhraseCount > 0).length,
    repeatedParagraphWarnings,
    shortestArticles: allArticles
      .filter((article) => article.exists)
      .sort((a, b) => a.nonCodeChars - b.nonCodeChars)
      .slice(0, 20),
    shortestArticlesWithoutKnownBoilerplate: allArticles
      .filter((article) => article.exists)
      .sort((a, b) => a.nonCodeCharsWithoutKnownBoilerplate - b.nonCodeCharsWithoutKnownBoilerplate)
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
  collectConcreteAnchors,
  collectTechnicalFacts,
  commandLines,
  createDocsStubInventory,
  KNOWN_GUIDE_BOILERPLATE_PHRASES,
  localizedPathForSlug,
  stripKnownGuideBoilerplate,
  stripCodeBlocks
};
