'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  collectTechnicalFacts,
  createDocsStubInventory
} = require('../../scripts/create_docs_stub_inventory');
const {
  createTechnicalFactDiff
} = require('../../scripts/verify_docs_content_depth');
const {
  resolveDocsAlias,
  runDocsPublicQualityCheck
} = require('../../scripts/verify_docs_public_quality');

const FIXTURE_PATH = 'tests/fixtures/docs-quality/docs-quality-negative-cases.json';

function writeFixtureFile(rootDir, relativePath, content) {
  const absolutePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function menuEntry(slug, aliases = []) {
  return {
    slug,
    group: 'fixture',
    parent: 'root',
    tier: 'basic',
    rank: 1,
    contentType: 'concept',
    labels: { de: slug, en: slug },
    aliases
  };
}

function article(locale, extra = '') {
  const introduction = locale === 'de'
    ? 'Eine isolierte Dokumentationsfixture mit konkretem Verhalten und sichtbaren Fehlergrenzen.'
    : 'An isolated documentation fixture with concrete behavior and visible failure boundaries.';
  return `# Fixture\n\n${introduction}\n\n## Model\n\n${extra || 'The model has one explicit owner and a deterministic result.'}\n\n## Boundaries\n\nThe fixture keeps input, output and failure behavior separate.\n\n## Related\n\n[Fixture](./fixture.md)\n`;
}

function createPublicFixture(options = {}) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-docs-quality-'));
  const menu = options.menu || [menuEntry('fixture')];
  writeFixtureFile(rootDir, 'README.md', '# XTend\n\nXTend is an isolated docs quality fixture.\n');
  writeFixtureFile(rootDir, 'docs/menu.json', `${JSON.stringify(menu, null, 2)}\n`);
  for (const entry of menu) {
    if (options.skipGerman !== entry.slug) {
      writeFixtureFile(rootDir, `docs/de/${entry.slug}.md`, article('de', options.germanExtra));
    }
    if (options.skipEnglish !== entry.slug) {
      writeFixtureFile(rootDir, `docs/en/${entry.slug}.md`, article('en', options.englishExtra));
    }
  }
  return rootDir;
}

function runFixturePublicQuality(rootDir, menuLength, aliasCount = 0) {
  return runDocsPublicQualityCheck({
    rootDir,
    expectedCanonicalSlugCount: menuLength,
    expectedAliasCount: aliasCount,
    requiredLearnRmtSlugs: [],
    requiredRmtStackSlugs: []
  });
}

function createInventoryFixture(fixture) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-docs-inventory-'));
  const menu = ['one', 'two', 'three', 'four'].map((slug) => menuEntry(slug));
  writeFixtureFile(rootDir, 'docs/menu.json', `${JSON.stringify(menu, null, 2)}\n`);
  for (const entry of menu) {
    writeFixtureFile(rootDir, `docs/de/${entry.slug}.md`, article('de', fixture.repeatedParagraph));
    const extra = entry.slug === 'one' ? fixture.boilerplate : `English source-specific detail for ${entry.slug}.`;
    writeFixtureFile(rootDir, `docs/en/${entry.slug}.md`, article('en', extra));
  }
  return rootDir;
}

function runDocsQualityGateSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'docs-quality-gates',
    label: 'Docs Quality Negative Fixtures'
  });
  const fixture = JSON.parse(fs.readFileSync(path.join(rootDir, FIXTURE_PATH), 'utf8'));
  const temporaryRoots = [];

  try {
    const cleanRoot = createPublicFixture();
    temporaryRoots.push(cleanRoot);
    const clean = runFixturePublicQuality(cleanRoot, 1);
    context.assert(clean.ok, 'isolated bilingual public docs fixture passes');

    const missingLocaleRoot = createPublicFixture({ skipEnglish: 'fixture' });
    temporaryRoots.push(missingLocaleRoot);
    const missingLocale = runFixturePublicQuality(missingLocaleRoot, 1);
    context.assert(!missingLocale.ok && missingLocale.failures.some((failure) => failure.includes('Missing en article')), 'missing locale pair is rejected');

    const internalRoot = createPublicFixture({ germanExtra: fixture.internalTerm });
    temporaryRoots.push(internalRoot);
    const internal = runFixturePublicQuality(internalRoot, 1);
    context.assert(!internal.ok && internal.failures.some((failure) => failure.includes('internal planning vocabulary')), 'internal planning prose is rejected');

    const mixedRoot = createPublicFixture({ englishExtra: fixture.mixedLanguage });
    temporaryRoots.push(mixedRoot);
    const mixed = runFixturePublicQuality(mixedRoot, 1);
    context.assert(!mixed.ok && mixed.failures.some((failure) => failure.includes('German prose')), 'mixed-language English prose is rejected');

    const collisionMenu = [
      menuEntry(fixture.aliasCollision.canonicalSlug),
      menuEntry(fixture.aliasCollision.ownerSlug, [fixture.aliasCollision.canonicalSlug])
    ];
    const collisionRoot = createPublicFixture({ menu: collisionMenu });
    temporaryRoots.push(collisionRoot);
    const collision = runFixturePublicQuality(collisionRoot, collisionMenu.length);
    context.assert(!collision.ok && collision.failures.some((failure) => failure.includes('collides with a canonical slug')), 'alias collision is rejected');

    const loop = resolveDocsAlias('alpha', fixture.aliasLoop);
    context.assert(!loop.ok && loop.error.includes('Alias loop detected'), 'alias resolver rejects loops');

    const inventoryRoot = createInventoryFixture(fixture);
    temporaryRoots.push(inventoryRoot);
    const inventory = createDocsStubInventory({ rootDir: inventoryRoot, threshold: 1 });
    context.assert(inventory.boilerplateArticleCount === 1, 'known boilerplate is detected in an isolated article');
    context.assert(inventory.repeatedParagraphWarnings.some((warning) => warning.articleCount === 4), 'narrative paragraph repeated in four articles is rejected');

    const factEntry = {
      articles: {
        de: { technicalFacts: collectTechnicalFacts(fixture.staleFacts.de) },
        en: { technicalFacts: collectTechnicalFacts(fixture.staleFacts.en) }
      }
    };
    for (const factName of ['schemas', 'commands', 'devApiMethods']) {
      const diff = createTechnicalFactDiff(factEntry, factName);
      context.assert(diff.missingInEnglish.length > 0 && diff.missingInGerman.length > 0, `stale bilingual ${factName} are detected`);
    }
  } finally {
    for (const temporaryRoot of temporaryRoots) {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }

  return context.result({
    report: {
      schema: 'xtend.docs.quality-negative-fixtures-report.v1',
      fixture: FIXTURE_PATH,
      caseCount: 9
    }
  });
}

function printDocsQualityGateReport(result) {
  printSuiteReport(result, {
    successTitle: 'Docs quality negative fixtures passed.',
    failureTitle: 'Docs quality negative fixtures failed:'
  });
}

if (require.main === module) {
  const result = runDocsQualityGateSuite();
  printDocsQualityGateReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  FIXTURE_PATH,
  printDocsQualityGateReport,
  runDocsQualityGateSuite
};
