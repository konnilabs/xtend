'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { resolveRepoPath, resolveRootDir } = require('../utils/files');

function readText(relativePath, rootDir) {
  return fs.readFileSync(resolveRepoPath(relativePath, rootDir), 'utf8');
}

function readJson(relativePath, rootDir) {
  return JSON.parse(readText(relativePath, rootDir));
}

function fallbackLinks(menu, slug, excluded = [], limit = 7) {
  const current = menu.find((entry) => entry.slug === slug);
  if (!current) return [];
  const candidates = [];
  const sorted = (entries) => entries.slice().sort((left, right) => Number(right.rank || 0) - Number(left.rank || 0) || left.slug.localeCompare(right.slug));
  const append = (entries) => sorted(entries).forEach((entry) => candidates.push(entry.slug));
  if (current.parent) append(menu.filter((entry) => entry.slug === current.parent));
  append(menu.filter((entry) => entry.parent === slug));
  if (current.parent) append(menu.filter((entry) => entry.parent === current.parent));
  append(menu.filter((entry) => entry.section === current.section));
  append(menu.filter((entry) => entry.trunk === current.trunk));
  const seen = new Set([slug, ...excluded]);
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  }).slice(0, limit);
}

async function runDocsRelatedRecommendationsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'docs-related-recommendations', label: 'Docs related recommendations' });
  const runtime = await import(`file://${resolveRepoPath('xtendrmt/rmt-app-runtime.js', rootDir)}`);
  const menu = readJson('docs/menu.json', rootDir);
  const en = readJson('docs/generated/search/en.compact.json', rootDir);
  const de = readJson('docs/generated/search/de.compact.json', rootDir);
  const golden = readJson('tests/docs/fixtures/docs-related-recommendations.json', rootDir);
  const pageLoader = readText('docs/utils/page/route-controller.mjs', rootDir);
  const shellRuntime = readText('docs/utils/docs-shell-runtime.mjs', rootDir);
  const workerSource = runtime.createRmtSearchWorkerSource();

  context.assert(menu.length === 173 && en.entryCount === menu.length && de.entryCount === menu.length, 'localized compact indexes cover all 173 documentation articles');
  context.assert(en.entries.every((entry) => Object.hasOwn(entry, 'parent') && Object.hasOwn(entry, 'rank') && Array.isArray(entry.relatedSlugs)), 'compact entries carry navigation rank and normalized internal-link signals');
  context.assert(en.entries.every((entry) => entry.locale === 'en') && de.entries.every((entry) => entry.locale === 'de'), 'compact recommendation corpora remain locale-separated');
  context.assert(runtime.RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA === 'xtend.rmt.search-recommendation-response.v1', 'recommendation response schema is public and stable');
  context.assert(workerSource.includes("message.action!=='search_index'") && !workerSource.includes('recommendEntries'), 'prewarm worker remains restricted to search_index');

  golden.cases.forEach((record) => {
    const results = runtime.recommendEntries(en.entries, record.slug, { resultLimit: 7 });
    const slugs = results.map((entry) => entry.slug);
    context.assert(record.expectedAny.some((slug) => slugs.includes(slug)), `${record.slug} ranks an expected relevant article`);
    context.assert(record.forbidden.every((slug) => !slugs.includes(slug)), `${record.slug} excludes explicitly irrelevant golden targets`);
  });

  const typoResults = runtime.recommendEntries(en.entries, 'hydratoin-policies', { resultLimit: 7 });
  context.assert(typoResults.length >= 3 && !typoResults.some((entry) => entry.slug === 'hydration-policies'), 'typo-tolerant seed resolution recommends from, but never returns, the canonical source article');
  const linkBoostFixture = [
    { slug: 'source', title: 'Source', keywords: ['shared'], relatedSlugs: ['linked'], section: 'one', trunk: 'a', rank: 1 },
    { slug: 'linked', title: 'Linked', keywords: ['shared'], relatedSlugs: [], section: 'two', trunk: 'b', rank: 1 },
    { slug: 'plain', title: 'Plain', keywords: ['shared'], relatedSlugs: [], section: 'two', trunk: 'b', rank: 99 }
  ];
  const boosted = runtime.recommendEntries(linkBoostFixture, 'source', { resultLimit: 2, minScore: 0 });
  context.assert(boosted[0] && boosted[0].slug === 'linked' && boosted[0].navigationSignals.includes('direct-link'), 'direct linkgraph signal outranks an otherwise equivalent high-rank candidate');

  const defensive = runtime.recommendEntries(en.entries, 'xtend-classic', { resultLimit: 7 });
  defensive[0].signals.push({ kind: 'mutation', probe: 'mutation', score: 99 });
  const defensiveAgain = runtime.recommendEntries(en.entries, 'xtend-classic', { resultLimit: 7 });
  context.assert(!defensiveAgain[0].signals.some((signal) => signal.kind === 'mutation'), 'recommendation results are defensive copies');

  const validSlugs = new Set(menu.map((entry) => entry.slug));
  const aliasSlugs = new Set(menu.flatMap((entry) => Array.isArray(entry.aliases) ? entry.aliases : []));
  let corpusValid = true;
  let deterministic = true;
  for (const entry of en.entries) {
    const automatic = runtime.recommendEntries(en.entries, entry.slug, { resultLimit: 7 });
    const repeated = runtime.recommendEntries(en.entries, entry.slug, { resultLimit: 7 });
    deterministic = deterministic && automatic.map((result) => result.slug).join('|') === repeated.map((result) => result.slug).join('|');
    const parentCounts = automatic.reduce((counts, result) => {
      if (result.parent) counts.set(result.parent, Number(counts.get(result.parent) || 0) + 1);
      return counts;
    }, new Map());
    const merged = automatic.map((result) => result.slug);
    if (merged.length < 3) merged.push(...fallbackLinks(menu, entry.slug, merged, 7 - merged.length));
    const unique = new Set(merged);
    corpusValid = corpusValid
      && merged.length >= 3 && merged.length <= 7
      && unique.size === merged.length
      && !unique.has(entry.slug)
      && !merged.some((slug) => aliasSlugs.has(slug))
      && merged.every((slug) => validSlugs.has(slug))
      && Array.from(parentCounts.values()).every((count) => count <= 3);
  }
  context.assert(corpusValid, 'all 166 articles resolve to three through seven valid canonical recommendations');
  context.assert(deterministic, 'the complete recommendation corpus is deterministically ordered');

  const loadedResources = [];
  const recommendationRuntime = runtime.createRmtSearchRuntime({
    searchSources: [{ id: 'docs.en', resource: 'compact.en', fallbackResource: 'fulltext.en' }],
    resourceResolver(id) {
      loadedResources.push(id);
      return en.entries;
    },
    Worker: null
  });
  const response = await recommendationRuntime.recommend('docs.en', 'xtend-classic', { resultLimit: 7 });
  const concurrentQuery = await recommendationRuntime.query('docs.en', 'manifest', { resultLimit: 3 });
  context.assert(response.schema === runtime.RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA && response.results.length > 0, 'asynchronous recommendation runtime returns the versioned contract');
  context.assert(loadedResources.join(',') === 'compact.en' && !concurrentQuery.superseded, 'recommendations reuse only the compact cache and do not supersede interactive search generations');
  context.assert(recommendationRuntime.snapshot().recommendationCount === 1, 'search telemetry counts recommendations independently from queries');

  context.assert(pageLoader.includes('mergeDocsRelatedLinks(slug, relatedLinks, automaticLinks)') && pageLoader.includes('this.isActiveRouteToken(token)') && pageLoader.includes('recommendation && recommendation.superseded'), 'page loader merges explicit links first and rejects stale route-bound recommendation results');
  context.assert(pageLoader.includes('isGenericRelatedLinkLabel(authoredLabel)') && pageLoader.includes('? docsTitleForSlug(slug)'), 'generic editorial related-link labels resolve to the localized target title');
  context.assert(pageLoader.includes('\\b(?:read further|related|see also)\\b'), 'English related-section detection uses whole words and does not classify unrelated prose as editorial links');
  context.assert(shellRuntime.includes('async function recommendRelated(input = {})') && shellRuntime.includes('searchRuntime.recommend(') && shellRuntime.includes('recommendRelated,'), 'frozen Docs shell exposes the compact-index recommendation bridge');
  context.assert(pageLoader.includes("className = 'docs-related-link'") && pageLoader.includes("className = 'docs-related-list'") && pageLoader.includes("createDocsSidebarHeading('link', 'Read Further')"), 'existing Read Further DOM and component classes remain unchanged');

  return context.result({ articleCount: en.entryCount, goldenCaseCount: golden.cases.length });
}

function printDocsRelatedRecommendationsReport(result) {
  printSuiteReport(result, {
    successTitle: `${result.label} suite passed.`,
    failureTitle: `${result.label} suite failed:`
  });
}

module.exports = { printDocsRelatedRecommendationsReport, runDocsRelatedRecommendationsSuite };
