#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  createComponentDocsInventory
} = require('./create_component_docs_inventory');
const {
  DEFAULT_MIN_GUIDE_CHARS,
  KNOWN_GUIDE_BOILERPLATE_PHRASES,
  createDocsStubInventory
} = require('./create_docs_stub_inventory');

const DOCS_CONTENT_DEPTH_SCHEMA = 'xtend.docs.content-depth.v1';
const DOCS_CONTENT_DEPTH_REPORT_SCHEMA = 'xtend.docs.content-depth-report.v1';
const MIN_COMPONENT_WORDS = 350;
const MIN_COMPONENT_CODE_BLOCKS = 2;
const MIN_GUIDE_NON_CODE_CHARS = DEFAULT_MIN_GUIDE_CHARS;
const MIN_GUIDE_H2_COUNT = 4;
const MIN_GUIDE_CONCRETE_ANCHORS = 1;
const MAX_REPEATED_GUIDE_PARAGRAPHS = 0;

const requiredSections = Object.freeze([
  { key: 'solves', de: '## Was es löst', en: '## What it solves' },
  { key: 'use', de: '## Einsatz', en: '## When to use it' },
  { key: 'avoid', de: '## Nicht einsetzen, wenn', en: '## Avoid when' },
  { key: 'load', de: '## Laden und registrieren', en: '## Load and register' },
  { key: 'examples', de: '## Beispiele', en: '## Examples' },
  { key: 'api', de: '## API-Referenz', en: '## API reference' },
  { key: 'integration', de: '## Integrationshinweise', en: '## Integration notes' },
  { key: 'troubleshooting', de: '## Fehlerbehebung', en: '## Troubleshooting' },
  { key: 'next', de: '## Nächste Schritte', en: '## Next steps' }
]);

const forbiddenInternalPattern = /\b(?:WP-[A-Z0-9-]+|DPF-WP|ER-WP|Epic\s*[0-9]+|epic[0-9]+|Handoff|Gate Matrix|Release Owner|Workpackage|RC0|RC1)\b/u;

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function stripCodeBlocks(markdown) {
  return String(markdown || '').replace(/```[\s\S]*?```/g, '');
}

function wordCount(markdown) {
  return stripCodeBlocks(markdown).split(/\s+/).filter(Boolean).length;
}

function codeBlocks(markdown) {
  const blocks = [];
  const pattern = /```[^\n]*\n([\s\S]*?)```/g;
  let match;
  while ((match = pattern.exec(markdown))) {
    blocks.push(match[1]);
  }
  return blocks;
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

function resolveRepoPath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function fileExists(rootDir, relativePath) {
  return fs.existsSync(resolveRepoPath(rootDir, relativePath));
}

function readText(rootDir, relativePath) {
  return fs.readFileSync(resolveRepoPath(rootDir, relativePath), 'utf8');
}

function textIncludesLiteral(text, value) {
  if (!value) return true;
  return text.includes(`\`${value}\``) || text.includes(value);
}

function methodName(signature) {
  const match = String(signature || '').match(/^([A-Za-z_$][\w$]*)/);
  return match ? match[1] : String(signature || '');
}

function assertArticle(failures, rootDir, entry, locale) {
  const relativePath = entry.docs[locale];
  if (!fileExists(rootDir, relativePath)) {
    failures.push(`${relativePath} is missing for ${entry.tag}.`);
    return null;
  }

  const text = readText(rootDir, relativePath);
  const words = wordCount(text);
  const blocks = codeBlocks(text);
  const contentWithoutCode = stripCodeBlocks(text);

  if (words < MIN_COMPONENT_WORDS) {
    failures.push(`${relativePath} has ${words} non-code words; expected at least ${MIN_COMPONENT_WORDS}.`);
  }

  const missingSections = requiredSections
    .filter((section) => !text.includes(section[locale]))
    .map((section) => section.key);
  if (missingSections.length) {
    failures.push(`${relativePath} is missing required sections: ${missingSections.join(', ')}.`);
  }

  if (blocks.length < MIN_COMPONENT_CODE_BLOCKS) {
    failures.push(`${relativePath} has ${blocks.length} code blocks; expected at least ${MIN_COMPONENT_CODE_BLOCKS}.`);
  }
  if (!blocks.some((block) => block.includes(entry.tag))) {
    failures.push(`${relativePath} has no code example containing ${entry.tag}.`);
  }

  if (!text.includes(locale === 'de' ? '## API-Referenz' : '## API reference')) {
    failures.push(`${relativePath} does not expose the API reference section.`);
  }

  entry.attributes.forEach((attribute) => {
    if (!textIncludesLiteral(text, attribute)) {
      failures.push(`${relativePath} does not document attribute ${attribute}.`);
    }
  });

  if (entry.events.length) {
    entry.events.forEach((eventName) => {
      if (!textIncludesLiteral(text, eventName)) {
        failures.push(`${relativePath} does not document event ${eventName}.`);
      }
    });
  } else {
    const marker = locale === 'de' ? 'Keine öffentlichen Events' : 'No public events';
    if (!text.includes(marker)) {
      failures.push(`${relativePath} must explicitly document ${marker}.`);
    }
  }

  entry.methods.forEach((signature) => {
    const name = methodName(signature);
    if (!text.includes(`${name}(`) && !text.includes(`\`${name}\``)) {
      failures.push(`${relativePath} does not document method ${name}.`);
    }
  });

  if (forbiddenInternalPattern.test(contentWithoutCode)) {
    failures.push(`${relativePath} contains internal planning vocabulary.`);
  }

  collectMarkdownLinks(text).forEach((target) => {
    const resolved = path.normalize(path.join(rootDir, path.dirname(relativePath), target));
    if (!resolved.startsWith(rootDir) || !fs.existsSync(resolved)) {
      failures.push(`${relativePath} links to missing Markdown target ${target}.`);
    }
  });

  return {
    path: relativePath,
    words,
    codeBlocks: blocks.length
  };
}

function assertGuideArticle(failures, rootDir, entry, locale) {
  const article = entry.articles[locale];
  if (!article || !article.exists) {
    failures.push(`${entry.slug} is missing ${locale} guide article.`);
    return null;
  }

  if (article.nonCodeChars < MIN_GUIDE_NON_CODE_CHARS) {
    failures.push(`${article.path} has ${article.nonCodeChars} non-code chars; expected at least ${MIN_GUIDE_NON_CODE_CHARS}.`);
  }
  if (article.h2Count < MIN_GUIDE_H2_COUNT) {
    failures.push(`${article.path} has ${article.h2Count} H2 sections; expected at least ${MIN_GUIDE_H2_COUNT}.`);
  }
  if (article.linkErrors.length) {
    failures.push(`${article.path} links to missing Markdown targets: ${article.linkErrors.join(', ')}.`);
  }
  if (article.boilerplatePhraseCount > 0) {
    failures.push(`${article.path} contains generated guide boilerplate: ${article.boilerplatePhrases.join('; ')}.`);
  }
  if (article.concreteAnchorCount < MIN_GUIDE_CONCRETE_ANCHORS) {
    failures.push(`${article.path} has ${article.concreteAnchorCount} concrete anchors; expected at least ${MIN_GUIDE_CONCRETE_ANCHORS}.`);
  }

  const contentWithoutCode = stripCodeBlocks(readText(rootDir, article.path));
  if (forbiddenInternalPattern.test(contentWithoutCode)) {
    failures.push(`${article.path} contains internal planning vocabulary.`);
  }

  return {
    path: article.path,
    slug: entry.slug,
    locale,
    nonCodeChars: article.nonCodeChars,
    words: article.words,
    h2Count: article.h2Count,
    codeBlockCount: article.codeBlockCount,
    commandCount: article.commandCount,
    concreteAnchorCount: article.concreteAnchorCount,
    boilerplatePhraseCount: article.boilerplatePhraseCount
  };
}

function runDocsContentDepthCheck(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const componentInventory = createComponentDocsInventory({ rootDir });
  const guideInventory = createDocsStubInventory({ rootDir, threshold: MIN_GUIDE_NON_CODE_CHARS });
  const failures = [];
  const componentArticleReports = [];
  const guideArticleReports = [];

  componentInventory.entries.forEach((entry) => {
    const de = assertArticle(failures, rootDir, entry, 'de');
    const en = assertArticle(failures, rootDir, entry, 'en');
    if (de) componentArticleReports.push(de);
    if (en) componentArticleReports.push(en);
  });

  guideInventory.entries.forEach((entry) => {
    const de = assertGuideArticle(failures, rootDir, entry, 'de');
    const en = assertGuideArticle(failures, rootDir, entry, 'en');
    if (de) guideArticleReports.push(de);
    if (en) guideArticleReports.push(en);
  });

  if (guideInventory.repeatedParagraphWarnings.length > MAX_REPEATED_GUIDE_PARAGRAPHS) {
    guideInventory.repeatedParagraphWarnings.forEach((warning) => {
      failures.push(`Guide docs repeat a long paragraph across ${warning.articleCount} articles: "${warning.paragraph}"`);
    });
  }

  const stubArticles = guideInventory.entries.flatMap((entry) => Object.values(entry.articles)
    .filter((article) => article.stub)
    .map((article) => ({
      slug: entry.slug,
      locale: article.locale,
      path: article.path,
      nonCodeChars: article.nonCodeChars
    })));

  return {
    ok: failures.length === 0,
    failures,
    passes: failures.length === 0
      ? [`${componentInventory.entryCount} component references and ${guideInventory.guideSlugCount} guide slugs have bilingual content depth.`]
      : [],
    warnings: [],
    skips: [],
    report: {
      schema: DOCS_CONTENT_DEPTH_REPORT_SCHEMA,
      componentInventorySchema: componentInventory.schema,
      guideInventorySchema: guideInventory.schema,
      componentReferenceCount: componentInventory.entryCount,
      guideSlugCount: guideInventory.guideSlugCount,
      articleCount: componentArticleReports.length + guideArticleReports.length,
      minComponentWords: MIN_COMPONENT_WORDS,
      minComponentCodeBlocks: MIN_COMPONENT_CODE_BLOCKS,
      minGuideNonCodeChars: MIN_GUIDE_NON_CODE_CHARS,
      minGuideH2Count: MIN_GUIDE_H2_COUNT,
      minGuideConcreteAnchors: MIN_GUIDE_CONCRETE_ANCHORS,
      forbiddenGuideBoilerplatePhrases: KNOWN_GUIDE_BOILERPLATE_PHRASES,
      stubSlugs: guideInventory.stubSlugs,
      stubArticles,
      stubGroups: guideInventory.stubGroups,
      boilerplateArticleCount: guideInventory.boilerplateArticleCount,
      repeatedParagraphWarnings: guideInventory.repeatedParagraphWarnings,
      shortestArticlesWithoutKnownBoilerplate: guideInventory.shortestArticlesWithoutKnownBoilerplate,
      shortestArticles: guideInventory.shortestArticles,
      componentArticles: componentArticleReports,
      guideArticles: guideArticleReports
    }
  };
}

function printDocsContentDepthReport(result) {
  if (!result.ok) {
    console.error('XTend docs content-depth check failed:');
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    return;
  }
  console.log(`XTend docs content-depth check passed (${result.report.componentReferenceCount} component references, ${result.report.guideSlugCount} guide slugs, ${result.report.articleCount} localized articles).`);
}

function main() {
  const result = runDocsContentDepthCheck();
  printDocsContentDepthReport(result);
  if (!result.ok) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  DOCS_CONTENT_DEPTH_SCHEMA,
  DOCS_CONTENT_DEPTH_REPORT_SCHEMA,
  MIN_COMPONENT_CODE_BLOCKS,
  MIN_COMPONENT_WORDS,
  MIN_GUIDE_CONCRETE_ANCHORS,
  MIN_GUIDE_H2_COUNT,
  MIN_GUIDE_NON_CODE_CHARS,
  printDocsContentDepthReport,
  runDocsContentDepthCheck
};
