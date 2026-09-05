const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  LIFECYCLE_OPERATIONS,
  SOURCE_KINDS,
  RESERVED_WORDS
} = require('../../tools/rmt-language/vnext-parser');
const {
  REMOTE_KEYWORDS
} = require('../../tools/rmt-language/vnext-remote-tooling');
const {
  VNEXT_LANES,
  VNEXT_PRIMITIVE_ACTION_CLAUSES,
  VNEXT_PRIMITIVE_KEYWORDS,
  VNEXT_PRIMITIVE_OVERLAY_KINDS,
  VNEXT_PRIMITIVE_RESOURCE_KINDS,
  VNEXT_PRIMITIVE_SELECTOR_CLAUSES,
  VNEXT_PRIMITIVE_STATE_CLAUSES,
  VNEXT_PRIMITIVE_SURFACE_CLAUSES,
  VNEXT_PRIMITIVE_TRANSITION_CLAUSES,
  VNEXT_PRIMITIVE_VALIDATION_CLAUSES,
  VNEXT_SOURCE_KINDS,
  VNEXT_TRANSITION_EFFECTS,
  VNEXT_TRUST_BOUNDARIES
} = require('../../tools/rmt-language/vnext-tooling');

const RMT_REFERENCE_DOCS_SCHEMA = 'xtend.docs.rmt-reference-docs.v1';
const RMT_REFERENCE_DOCS_REPORT_SCHEMA = 'xtend.docs.rmt-reference-docs-report.v1';
const RMT_REFERENCE_DOCS_SUITE_PATH = 'tests/docs/rmt_reference_docs_suite.js';
const RMT_REFERENCE_DOCS_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-reference-docs --json';
const RMT_REFERENCE_DOCS_PACKAGE_SCRIPT = 'npm run test:rmt-reference-docs';
const RMT_REFERENCE_DOCS_REPORT_SCRIPT = 'npm run test:rmt-reference-docs:report';
const RMT_REFERENCE_DOCS_REPORT_PATH = '.xtend-test-results/xtend-rmt-reference-docs-report.json';
const LOCALES = Object.freeze(['de', 'en']);
const RMT_REFERENCE_SLUGS = Object.freeze([
  'rmt-reference',
  'rmt-reference-document-template-import',
  'rmt-reference-primitives',
  'rmt-reference-state-selectors-data',
  'rmt-reference-actions-events',
  'rmt-reference-surfaces-lanes-lifecycle',
  'rmt-reference-validation-transitions',
  'rmt-reference-security-policies',
  'rmt-reference-remote-surfaces',
  'rmt-reference-conditions-expressions',
  'rmt-reference-enums-catalogs'
]);
const REQUIRED_MDN_SECTIONS = Object.freeze([
  '## Syntax',
  '## Allowed contexts',
  '## Parameters',
  '## Description',
  '## Examples',
  '## Diagnostics',
  '## Related operators'
]);
const REQUIRED_REMOTE_EVENT_TERMS = Object.freeze([
  'direction outbound',
  'direction inbound',
  'from shell.session',
  'payload'
]);
const REQUIRED_CONDITION_TERMS = Object.freeze([
  'when',
  '&&',
  '||',
  '!',
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  '()',
  'true',
  'false',
  'null',
  'Strings',
  'Integers',
  'Paths'
]);
const REQUIRED_PARSER_RESERVED_TERMS = Object.freeze([
  'remote',
  'boundary',
  'hydration',
  'isolation',
  'sanitize',
  'true',
  'false',
  'null'
]);
const REQUIRED_SURFACE_HEADER_TERMS = Object.freeze([
  'kind',
  'component',
  'bounds',
  'weight',
  'slot',
  'preventDefault',
  'with',
  'target',
  'method',
  'contract',
  'result',
  'fallback'
]);

function entryTerms(entries = []) {
  return entries.map((entry) => Array.isArray(entry) ? entry[0] : entry);
}

function uniqueTerms(terms) {
  return Array.from(new Set(terms.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function expectedReferenceTerms() {
  return uniqueTerms([
    ...entryTerms(VNEXT_PRIMITIVE_KEYWORDS),
    ...entryTerms(VNEXT_PRIMITIVE_STATE_CLAUSES),
    ...entryTerms(VNEXT_PRIMITIVE_SELECTOR_CLAUSES),
    ...entryTerms(VNEXT_PRIMITIVE_ACTION_CLAUSES),
    ...entryTerms(VNEXT_PRIMITIVE_SURFACE_CLAUSES),
    ...entryTerms(VNEXT_PRIMITIVE_VALIDATION_CLAUSES),
    ...entryTerms(VNEXT_PRIMITIVE_TRANSITION_CLAUSES),
    ...entryTerms(VNEXT_SOURCE_KINDS),
    ...entryTerms(VNEXT_LANES),
    ...entryTerms(VNEXT_PRIMITIVE_RESOURCE_KINDS),
    ...entryTerms(VNEXT_PRIMITIVE_OVERLAY_KINDS),
    ...entryTerms(VNEXT_TRANSITION_EFFECTS),
    ...entryTerms(VNEXT_TRUST_BOUNDARIES),
    ...entryTerms(REMOTE_KEYWORDS),
    ...Array.from(LIFECYCLE_OPERATIONS || []),
    ...Array.from(SOURCE_KINDS || []),
    ...REQUIRED_REMOTE_EVENT_TERMS,
    ...REQUIRED_CONDITION_TERMS,
    ...REQUIRED_PARSER_RESERVED_TERMS.filter((term) => RESERVED_WORDS && RESERVED_WORDS.has(term)),
    ...REQUIRED_SURFACE_HEADER_TERMS
  ]);
}

function localizedPathForSlug(locale, slug) {
  return `docs/${locale}/${slug}.md`;
}

function extractRmtBlocks(markdown) {
  const blocks = [];
  const pattern = /```rmt\s*([\s\S]*?)```/gu;
  let match;
  while ((match = pattern.exec(markdown))) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function normalizeTerm(term) {
  return String(term || '').replace(/\s+/gu, ' ').trim();
}

function termIsDocumented(markdown, term) {
  const normalizedMarkdown = normalizeTerm(markdown);
  const normalizedTerm = normalizeTerm(term);
  return normalizedTerm !== '' && normalizedMarkdown.includes(normalizedTerm);
}

function renderMarkdownWithParsedown(rootDir, relativePath) {
  const code = [
    'require "docs/utils/parsedown.php";',
    '$Parsedown = new Parsedown();',
    '$Parsedown->setSafeMode(true);',
    `echo $Parsedown->text(file_get_contents(${JSON.stringify(relativePath)}));`
  ].join(' ');
  return spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
}

function runMenuChecks(context, rootDir) {
  const menu = readJson('docs/menu.json', rootDir);
  const slugs = menu.map((entry) => entry.slug);
  const firstReferenceIndex = slugs.indexOf('rmt-reference');
  const learnEndIndex = slugs.indexOf('learn-rmt-next-steps');
  const maracaIndex = slugs.indexOf('xtend-maraca');

  context.assert(firstReferenceIndex > learnEndIndex, 'RMT Reference menu group is ordered after Learn RMT');
  context.assert(firstReferenceIndex >= 0 && firstReferenceIndex < maracaIndex, 'RMT Reference menu group is ordered before Maraca docs');
  RMT_REFERENCE_SLUGS.forEach((slug, index) => {
    const entry = menu.find((candidate) => candidate.slug === slug);
    context.assert(Boolean(entry), `Docs menu exposes ${slug}`);
    context.assert(entry && entry.group === 'rmt-reference', `${slug} belongs to rmt-reference group`);
    context.assert(entry && entry.labels && entry.labels.de && entry.labels.en, `${slug} has bilingual labels`);
    if (index === 0) {
      context.assert(entry && !entry.parent, 'RMT Reference root is top-level');
    } else {
      context.assert(entry && entry.parent === 'rmt-reference', `${slug} hangs below RMT Reference root`);
    }
  });
}

function runMarkdownChecks(context, rootDir) {
  const expectedTerms = expectedReferenceTerms();

  LOCALES.forEach((locale) => {
    const localeMarkdown = [];
    RMT_REFERENCE_SLUGS.forEach((slug) => {
      const relativePath = localizedPathForSlug(locale, slug);
      const absolutePath = resolveRepoPath(relativePath, rootDir);
      context.assert(fs.existsSync(absolutePath), `${relativePath} exists`);
      const markdown = readText(relativePath, rootDir);
      const rendered = renderMarkdownWithParsedown(rootDir, relativePath);
      localeMarkdown.push(markdown);
      context.assert(markdown.startsWith('# '), `${relativePath} starts with a page title`);
      context.assert(rendered.status === 0, `${relativePath} renders through safe Parsedown${rendered.status === 0 ? '' : ` (${rendered.stderr || rendered.stdout})`}`);
      context.assert(!String(rendered.stdout || '').includes('&lt;a id='), `${relativePath} does not expose escaped table anchors`);
      if (markdown.includes('<a id="')) {
        context.assert(String(rendered.stdout || '').includes('<a id="'), `${relativePath} preserves safe table anchors`);
      }
      REQUIRED_MDN_SECTIONS.forEach((section) => {
        context.assert(markdown.includes(section), `${relativePath} includes ${section}`);
      });
      extractRmtBlocks(markdown).forEach((source, blockIndex) => {
        const result = compileRmtVNextSource({
          text: source,
          filePath: `${relativePath}#${blockIndex + 1}.rmt`
        });
        const diagnostics = (result.diagnostics || result.compilerDiagnostics || [])
          .map((diagnostic) => diagnostic.message)
          .join('; ');
        context.assert(result.ok === true, `${relativePath} RMT block ${blockIndex + 1} compiles${result.ok ? '' : ` (${diagnostics})`}`);
      });
    });

    const combinedMarkdown = localeMarkdown.join('\n\n');
    expectedTerms.forEach((term) => {
      context.assert(termIsDocumented(combinedMarkdown, term), `${locale} reference documents ${term}`);
    });
    context.assert(combinedMarkdown.includes('JSON-RMT'), `${locale} reference documents JSON-RMT compatibility boundary`);
  });
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtReferenceDocs;
  const ciGateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;
  const suiteSyntax = syntaxCheckFile(RMT_REFERENCE_DOCS_SUITE_PATH, { rootDir, extension: '.js' });

  context.assert(suiteSyntax.ok, `RMT Reference docs suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(metadata && metadata.schema === RMT_REFERENCE_DOCS_SCHEMA, 'package metadata declares RMT Reference docs schema');
  context.assert(metadata && metadata.reportSchema === RMT_REFERENCE_DOCS_REPORT_SCHEMA, 'package metadata declares RMT Reference docs report schema');
  context.assert(metadata && metadata.localGate === RMT_REFERENCE_DOCS_LOCAL_GATE, 'package metadata declares RMT Reference local gate');
  context.assert(metadata && metadata.packageScript === RMT_REFERENCE_DOCS_PACKAGE_SCRIPT, 'package metadata declares RMT Reference package script');
  context.assert(metadata && metadata.reportScript === RMT_REFERENCE_DOCS_REPORT_SCRIPT, 'package metadata declares RMT Reference report script');
  context.assert(metadata && metadata.reportPath === RMT_REFERENCE_DOCS_REPORT_PATH, 'package metadata declares RMT Reference report path');
  context.assert(Array.isArray(metadata && metadata.docs) && metadata.docs.length === LOCALES.length * RMT_REFERENCE_SLUGS.length, 'package metadata lists every localized RMT Reference page');
  context.assert(packageManifest.scripts['test:rmt-reference-docs'] === 'node scripts/run_xtend_tests.js rmt-reference-docs', 'package exposes rmt-reference-docs script');
  context.assert(packageManifest.scripts['test:rmt-reference-docs:report'] === `node scripts/run_xtend_tests.js rmt-reference-docs --report ${RMT_REFERENCE_DOCS_REPORT_PATH}`, 'package exposes rmt-reference-docs report script');
  context.assert(runner.hasSuite("rmt-reference-docs"), 'test runner exposes rmt-reference-docs suite');
  context.assert(runner.hasSuite("rmt-reference-docs"), 'test runner help references rmt-reference-docs');
  context.assert(ciGateMatrix && ciGateMatrix.prFastGate && ciGateMatrix.prFastGate.suites.includes('rmt-reference-docs'), 'PR CI gate matrix includes rmt-reference-docs');
  context.assert(ciGateMatrix && ciGateMatrix.fullReleaseGate && ciGateMatrix.fullReleaseGate.suites.includes('rmt-reference-docs'), 'Full release CI gate matrix includes rmt-reference-docs');
  context.assert(ciGateMatrix && ciGateMatrix.nightlyBuild && ciGateMatrix.nightlyBuild.commandSet.includes(RMT_REFERENCE_DOCS_REPORT_SCRIPT), 'Nightly CI gate matrix runs the RMT Reference report script');
  context.assert(ciGateMatrix && ciGateMatrix.prFastGate && Array.isArray(ciGateMatrix.prFastGate.additionalReportPaths) && ciGateMatrix.prFastGate.additionalReportPaths.includes(RMT_REFERENCE_DOCS_REPORT_PATH), 'PR CI gate matrix uploads the RMT Reference report path');
  context.assert(ciGateMatrix && ciGateMatrix.fullReleaseGate && Array.isArray(ciGateMatrix.fullReleaseGate.additionalReportPaths) && ciGateMatrix.fullReleaseGate.additionalReportPaths.includes(RMT_REFERENCE_DOCS_REPORT_PATH), 'Full release CI gate matrix uploads the RMT Reference report path');
  context.assert(require("../utils/test-catalog").workflowHasScript(defaultWorkflow, "test:rmt-reference-docs:report"), 'Default GitHub Actions workflow runs the RMT Reference report');
  context.assert(defaultWorkflow.includes(RMT_REFERENCE_DOCS_REPORT_PATH), 'Default GitHub Actions workflow uploads the RMT Reference report');
  context.assert(require("../utils/test-catalog").workflowHasScript(nightlyWorkflow, "test:rmt-reference-docs:report"), 'Nightly GitHub Actions workflow runs the RMT Reference report');
  context.assert(nightlyWorkflow.includes(RMT_REFERENCE_DOCS_REPORT_PATH), 'Nightly GitHub Actions workflow uploads the RMT Reference report');
  context.assert(nightlyWorkflow.includes('RMT Reference docs gate failed'), 'Nightly GitHub Actions workflow fails on RMT Reference report failure');
}

function runRmtReferenceDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-reference-docs',
    label: 'RMT Reference Docs'
  });

  runMenuChecks(context, rootDir);
  runMarkdownChecks(context, rootDir);
  runMetadataChecks(context, rootDir);

  return context.result({
    report: {
      schema: RMT_REFERENCE_DOCS_REPORT_SCHEMA,
      docsSchema: RMT_REFERENCE_DOCS_SCHEMA,
    localGate: RMT_REFERENCE_DOCS_LOCAL_GATE,
    reportPath: RMT_REFERENCE_DOCS_REPORT_PATH,
    slugCount: RMT_REFERENCE_SLUGS.length,
      localeCount: LOCALES.length,
      expectedTermCount: expectedReferenceTerms().length,
      docs: LOCALES.flatMap((locale) => RMT_REFERENCE_SLUGS.map((slug) => localizedPathForSlug(locale, slug)))
    }
  });
}

function printRmtReferenceDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Reference docs checks passed.',
    failureTitle: 'RMT Reference docs checks failed:'
  });
}

if (require.main === module) {
  const result = runRmtReferenceDocsSuite();
  printRmtReferenceDocsReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  RMT_REFERENCE_DOCS_LOCAL_GATE,
  RMT_REFERENCE_DOCS_PACKAGE_SCRIPT,
  RMT_REFERENCE_DOCS_REPORT_SCHEMA,
  RMT_REFERENCE_DOCS_SCHEMA,
  RMT_REFERENCE_DOCS_SLUGS: RMT_REFERENCE_SLUGS,
  RMT_REFERENCE_DOCS_SUITE_PATH,
  expectedReferenceTerms,
  printRmtReferenceDocsReport,
  runRmtReferenceDocsSuite
};
