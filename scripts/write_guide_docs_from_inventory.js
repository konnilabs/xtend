#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_MIN_GUIDE_CHARS,
  createDocsStubInventory
} = require('./create_docs_stub_inventory');

const GUIDE_DOCS_AUDIT_SCHEMA = 'xtend.docs.guide-authoring-audit.v1';
const WAVE_GUIDE_SLUGS = Object.freeze([
  'readme',
  'quick-start-guide',
  'about',
  'best-practices',
  'enterprise-adoption',
  'changelog',
  'manifest',
  'api',
  'xtend-loader',
  'design-tokens',
  'components',
  'typescript-components',
  'type-exports',
  'public-component-types',
  'learn-rmt',
  'learn-rmt-syntax-basics',
  'learn-rmt-templates-surfaces',
  'learn-rmt-state-selectors',
  'learn-rmt-actions-events',
  'learn-rmt-data-resources',
  'learn-rmt-scheduling-lanes',
  'learn-rmt-security-preview',
  'learn-rmt-playground',
  'learn-rmt-next-steps',
  'xtendrmt-overview',
  'rmt-vnext-authoring',
  'xtendrmt-app-dsl',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-state-selector-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-vnext-component-primitives',
  'rmt-component-template-primitives',
  'rmt-dom-descriptor-renderer',
  'rmt-vnext-remote-surfaces',
  'rmt-vnext-cross-surface-events',
  'rmt-first-xtend-apps',
  'rmt-first-demo-app',
  'rmt-lifecycle-demo',
  'xtendrmt-migration-guide',
  'rmt-app-platform-migration-guide',
  'rmt-linter',
  'rmt-language-server',
  'rmt-app-platform-tooling',
  'xtend-fabric',
  'xtend-fabric-runtime',
  'xtend-fabric-rmt-lane-mapping',
  'surface-manager-authoring-guide',
  'surface-manager-controller',
  'surface-manager-runtime',
  'surface-manager-remote-surfaces',
  'surface-manager-migration-guide',
  'xtendrmt-runtime-bridge',
  'xtendrmt-parsedown-scheduling',
  'rmt-php-ssr-adapter',
  'rmt-node-ssr-adapter',
  'xtendrmt-native-authoring',
  'performance',
  'hydration-policies',
  'visual-browser-regression',
  'visual-snapshot-automation',
  'a11y-keyboard-smokes',
  'screenreader-signals',
  'motion-contrast',
  'trusted-dom-sanitizing',
  'manifest-import-policy',
  'supply-chain-gates',
  'rmt-stack-topography'
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readTextIfExists(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function profileForSlug(slug, group) {
  if (slug.startsWith('learn-rmt')) return 'learn';
  if (slug.includes('surface-manager')) return 'surface';
  if (slug.includes('fabric')) return 'fabric';
  if (slug.includes('performance') || slug.includes('hydration') || slug.includes('visual') || slug.includes('a11y') || slug.includes('screenreader') || slug.includes('motion') || slug.includes('trusted') || slug.includes('supply') || slug.includes('manifest-import-policy')) return 'quality';
  if (slug.includes('ssr') || slug.includes('parsedown')) return 'runtime';
  if (slug.startsWith('rmt') || slug.startsWith('xtendrmt')) return 'rmt';
  if (['manifest', 'api', 'xtend-loader', 'design-tokens', 'components', 'typescript-components', 'public-component-types', 'type-exports'].includes(slug)) return 'reference';
  if (group === 'start') return 'start';
  return 'reference';
}

function existingPaths(rootDir, candidates) {
  return Array.from(new Set(candidates))
    .filter((candidate) => fs.existsSync(path.join(rootDir, candidate)))
    .slice(0, 10);
}

function evidencePaths(rootDir, entry, locale, profile) {
  const slug = entry.slug;
  const base = [
    `docs/${locale}/${slug === 'readme' ? 'README' : slug}.md`,
    'docs/menu.json',
    'package.json'
  ];
  const core = [
    'components/manifest.json',
    'xtend-loader.js',
    'api.js',
    'api.d.ts',
    'design-tokens/xtend-design-tokens.js',
    'design-tokens/xtend-design-tokens.d.ts'
  ];
  const rmt = [
    'docs/xtendrmt-docs-shell-vnext.rmt',
    'tools/rmt-language/parser.js',
    'tools/rmt-language/vnext-compiler.js',
    'tools/rmt-language/vnext-scheduler.js',
    'tools/rmt-language/vnext-surfaces.js',
    'tools/rmt-language/vnext-events.js',
    'tools/rmt-linter/cli.js',
    'tools/rmt-language-server/server.js'
  ];
  const surface = [
    'components/xsurfacemanager.js',
    'components/xsurfacewindow.js',
    'components/xsurfaceportal.js',
    'src/components/x-surface-manager/x-surface-manager.ts',
    'src/components/x-surface-manager/surface-controller.ts',
    'src/components/x-surface-manager/surface-record.ts'
  ];
  const fabric = [
    'fabric/xtend-fabric.js',
    'fabric/rmt-lane-mapping.js',
    'fabric/rmt-lane-mapping.d.ts',
    'docs/utils/fabric-runtime.js'
  ];
  const quality = [
    'scripts/verify_docs_public_quality.js',
    'scripts/verify_docs_content_depth.js',
    'security/manifest-import-policy.js',
    'security/trusted-dom-policy.js',
    'security/supply-chain-gate-policy.js',
    'a11y/screenreader-signals.js',
    'a11y/motion-contrast-policy.js'
  ];

  const byProfile = {
    start: ['README.md', 'docs/de/quick-start-guide.md', 'docs/en/quick-start-guide.md', ...core],
    reference: core,
    learn: rmt,
    rmt,
    runtime: [...rmt, 'docs/index.php', 'docs/utils/pageloader.js', 'docs/utils/parsedown.php'],
    surface,
    fabric,
    quality
  };
  return existingPaths(rootDir, [...base, ...(byProfile[profile] || core)]);
}

function focusForProfile(profile) {
  return {
    start: 'Orientation pages should identify the fastest local entry point and name the next operational page.',
    reference: 'Reference pages should name stable files, exports, attributes, manifest keys and host wiring.',
    learn: 'Learning pages should keep runnable RMT fragments close to the parser, linter and playground checks.',
    rmt: 'RMT runtime pages should separate source records, compiled records, host adapters and scheduler behavior.',
    runtime: 'Runtime pages should show adapter boundaries, server/browser entry points and local verification commands.',
    surface: 'Surface pages should name controller records, portals, windows, ownership and routing boundaries.',
    fabric: 'Fabric pages should connect lanes, fibers, hydration policy and diagnostics with concrete scripts.',
    quality: 'Quality pages should tie claims to local gates, policies and failure evidence.'
  }[profile] || 'The article should replace repeated prose with source-backed integration guidance.';
}

function createGuideDocsAudit(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const threshold = Number(options.threshold || DEFAULT_MIN_GUIDE_CHARS);
  const inventory = createDocsStubInventory({ rootDir, threshold });
  const plannedSlugs = new Set(options.all ? inventory.entries.map((entry) => entry.slug) : WAVE_GUIDE_SLUGS);
  const articles = [];

  inventory.entries
    .filter((entry) => plannedSlugs.has(entry.slug))
    .forEach((entry) => {
      const profile = profileForSlug(entry.slug, entry.group);
      ['de', 'en'].forEach((locale) => {
        const article = entry.articles[locale];
        if (!article || !article.exists) return;
        articles.push({
          slug: entry.slug,
          group: entry.group,
          parent: entry.parent,
          tier: entry.tier,
          locale,
          profile,
          path: article.path,
          title: (readTextIfExists(rootDir, article.path).match(/^#\s+(.+)$/m) || [null, entry.slug])[1],
          focus: focusForProfile(profile),
          evidencePaths: evidencePaths(rootDir, entry, locale, profile),
          concreteAnchorCount: article.concreteAnchorCount,
          concreteAnchors: article.concreteAnchors,
          commandCount: article.commandCount,
          codeBlockCount: article.codeBlockCount,
          nonCodeChars: article.nonCodeChars,
          nonCodeCharsWithoutKnownBoilerplate: article.nonCodeCharsWithoutKnownBoilerplate,
          boilerplatePhrases: article.boilerplatePhrases
        });
      });
    });

  const needsAuthoring = articles.filter((article) => (
    article.boilerplatePhrases.length > 0
    || article.concreteAnchorCount < 1
    || article.nonCodeCharsWithoutKnownBoilerplate < threshold
  ));

  return {
    schema: GUIDE_DOCS_AUDIT_SCHEMA,
    threshold,
    plannedSlugCount: plannedSlugs.size,
    articleCount: articles.length,
    needsAuthoringCount: needsAuthoring.length,
    repeatedParagraphWarnings: inventory.repeatedParagraphWarnings,
    articles,
    needsAuthoring
  };
}

function writeGuideDocs(options = {}) {
  const audit = createGuideDocsAudit(options);
  return {
    ...audit,
    written: [],
    warning: 'write_guide_docs_from_inventory now audits guide docs only; public prose must be authored or generated by a dedicated non-boilerplate workflow.'
  };
}

function parseArgs(argv) {
  const args = { json: false, all: false, threshold: DEFAULT_MIN_GUIDE_CHARS };
  argv.forEach((arg, index) => {
    if (arg === '--json') args.json = true;
    if (arg === '--all') args.all = true;
    if (arg === '--threshold') args.threshold = Number(argv[index + 1]);
    if (arg.startsWith('--threshold=')) args.threshold = Number(arg.split('=')[1]);
  });
  return args;
}

function printAudit(audit, json = false) {
  if (json) {
    process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
    return;
  }
  console.log(`XTend guide docs authoring audit (${audit.articleCount} localized articles).`);
  console.log(`Needs authoring: ${audit.needsAuthoringCount}.`);
  console.log(`Repeated long paragraphs: ${audit.repeatedParagraphWarnings.length}.`);
  audit.needsAuthoring.slice(0, 20).forEach((article) => {
    console.log(`- ${article.path}: ${article.boilerplatePhrases.length} boilerplate phrases, ${article.concreteAnchorCount} concrete anchors`);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const audit = createGuideDocsAudit(args);
  printAudit(audit, args.json);
}

if (require.main === module) {
  main();
}

module.exports = {
  GUIDE_DOCS_AUDIT_SCHEMA,
  WAVE_GUIDE_SLUGS,
  createGuideDocsAudit,
  evidencePaths,
  profileForSlug,
  writeGuideDocs
};
