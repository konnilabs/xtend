const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const locales = ['de', 'en'];
const requiredLearnRmtSlugs = [
  'learn-rmt',
  'learn-rmt-syntax-basics',
  'learn-rmt-templates-surfaces',
  'learn-rmt-state-selectors',
  'learn-rmt-actions-events',
  'learn-rmt-data-resources',
  'learn-rmt-scheduling-lanes',
  'learn-rmt-security-preview',
  'learn-rmt-playground',
  'learn-rmt-next-steps'
];
const requiredRmtStackSlugs = [
  'rmt-stack-topography',
  'rmt-kernel-runtime',
  'xtend-fabric-runtime',
  'xtend-ui-runtime-layer'
];

const forbiddenInternalPattern = /\b(?:WP-[A-Z0-9-]+|DPF-WP|ER-WP|Epic\s*[0-9]+|epic[0-9]+|Handoff|Gate Matrix|Release Owner|Workpackage|RC0|RC1)\b/u;
const germanAsciiUmlautPattern = /\b(?:fuer|ueber|koennen|muessen|waehrend|enthaelt|prueft|pruefen|haerten|moeglich|laedt|fuehrt|gehoert|vollstaendig|zugehoerig|flaeche|aenderung|aenderungen|kompatibilitaet|qualitaet)\b/iu;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

function toRelative(absolutePath) {
  return path.relative(rootDir, absolutePath).replace(/\\/g, '/');
}

function slugFromLocalizedRelative(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const withoutLocale = normalized.replace(/^docs\/(?:de|en)\//u, '');
  if (withoutLocale === 'README.md') return 'readme';
  return withoutLocale
    .replace(/\.md$/iu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/giu, '-')
    .replace(/^-|-$/gu, '');
}

function localizedPathForSlug(locale, slug) {
  if (slug === 'readme') return `docs/${locale}/README.md`;
  if (slug.startsWith('components-')) {
    return `docs/${locale}/components/${slug.slice('components-'.length)}.md`;
  }
  return `docs/${locale}/${slug}.md`;
}

function stripCodeBlocks(markdown) {
  return String(markdown || '').replace(/```[\s\S]*?```/gu, '');
}

function collectMarkdownLinks(markdown) {
  const source = stripCodeBlocks(markdown);
  const links = [];
  const pattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/gu;
  let match;
  while ((match = pattern.exec(source))) {
    const target = match[1].trim().replace(/^<|>$/gu, '').split(/\s+/u)[0];
    if (!target || target.startsWith('#')) continue;
    if (/^(?:https?:|mailto:|tel:)/iu.test(target)) continue;
    links.push(target.split('#')[0].split('?')[0]);
  }
  return links.filter(Boolean);
}

function fail(failures, message) {
  failures.push(message);
}

function runDocsPublicQualityCheck() {
  const failures = [];
  const menu = readJson('docs/menu.json');
  const menuSlugs = menu.map((entry) => entry.slug);
  const menuSlugSet = new Set(menuSlugs);

  if (menuSlugs.length !== menuSlugSet.size) {
    fail(failures, 'docs/menu.json contains duplicate slugs.');
  }

  for (const entry of menu) {
    if (!entry.slug || !entry.labels || !entry.labels.de || !entry.labels.en) {
      fail(failures, `Menu entry is missing slug or localized labels: ${JSON.stringify(entry)}`);
    }
  }
  for (const slug of requiredLearnRmtSlugs) {
    if (!menuSlugSet.has(slug)) {
      fail(failures, `Learn RMT slug is missing from docs/menu.json: ${slug}`);
    }
  }
  for (const slug of requiredRmtStackSlugs) {
    if (!menuSlugSet.has(slug)) {
      fail(failures, `RMT stack slug is missing from docs/menu.json: ${slug}`);
    }
  }

  const allDocsMarkdown = walk(docsDir).filter((file) => file.endsWith('.md'));
  const nonLocalized = allDocsMarkdown
    .map(toRelative)
    .filter((relativePath) => !/^docs\/(?:de|en)\//u.test(relativePath));
  if (nonLocalized.length) {
    fail(failures, `Only docs/de and docs/en may contain public Markdown files: ${nonLocalized.join(', ')}`);
  }

  for (const locale of locales) {
    const localeFiles = walk(path.join(docsDir, locale))
      .filter((file) => file.endsWith('.md'))
      .map(toRelative);
    const localeSlugs = new Set(localeFiles.map(slugFromLocalizedRelative));

    for (const slug of menuSlugs) {
      const expectedPath = localizedPathForSlug(locale, slug);
      if (!fs.existsSync(path.join(rootDir, expectedPath))) {
        fail(failures, `Missing ${locale} article for menu slug ${slug}: ${expectedPath}`);
      }
      if (!localeSlugs.has(slug)) {
        fail(failures, `Locale ${locale} does not expose slug ${slug}.`);
      }
    }

    for (const slug of localeSlugs) {
      if (!menuSlugSet.has(slug)) {
        fail(failures, `Locale ${locale} contains non-menu article slug ${slug}.`);
      }
    }
  }

  const publicTextFiles = [
    'README.md',
    ...locales.flatMap((locale) => walk(path.join(docsDir, locale)).filter((file) => file.endsWith('.md')).map(toRelative))
  ];

  for (const relativePath of publicTextFiles) {
    const text = readText(relativePath);
    const contentWithoutCode = stripCodeBlocks(text);
    if (forbiddenInternalPattern.test(contentWithoutCode)) {
      fail(failures, `${relativePath} contains internal planning vocabulary.`);
    }
    if ((relativePath.startsWith('docs/de/') || relativePath === 'README.md') && germanAsciiUmlautPattern.test(contentWithoutCode)) {
      fail(failures, `${relativePath} contains ASCII transliterations for German umlauts.`);
    }
  }

  const rootReadme = readText('README.md');
  if (!/^# XTend\n\nXTend is /u.test(rootReadme)) {
    fail(failures, 'README.md must be English-first and npm-facing.');
  }

  for (const relativePath of publicTextFiles.filter((file) => file.startsWith('docs/'))) {
    const text = readText(relativePath);
    for (const target of collectMarkdownLinks(text)) {
      const resolved = path.normalize(path.join(rootDir, path.dirname(relativePath), target));
      if (!resolved.startsWith(rootDir) || !fs.existsSync(resolved)) {
        fail(failures, `${relativePath} links to missing Markdown target ${target}.`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    passes: failures.length === 0 ? [`${menuSlugs.length} public docs slugs are bilingual and link-clean.`] : [],
    warnings: [],
    skips: [],
    report: {
      schema: 'xtend.docs.public-quality.report.v1',
      slugCount: menuSlugs.length,
      publicMarkdownCount: publicTextFiles.length,
      canonicalDocs: locales.map((locale) => `docs/${locale}`)
    }
  };
}

function printDocsPublicQualityReport(result) {
  if (!result.ok) {
    console.error('XTend public docs quality check failed:');
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    return;
  }

  console.log(`XTend public docs quality check passed (${result.report.slugCount} slugs, ${result.report.publicMarkdownCount} public Markdown files).`);
}

function main() {
  const result = runDocsPublicQualityCheck();
  printDocsPublicQualityReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  printDocsPublicQualityReport,
  runDocsPublicQualityCheck
};
