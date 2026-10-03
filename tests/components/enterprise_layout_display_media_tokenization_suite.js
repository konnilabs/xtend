const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE,
  LAYOUT_DISPLAY_MEDIA_TARGETS,
  REQUIRED_DOC_MARKERS,
  REQUIRED_FIXTURE_MARKERS,
  REQUIRED_LAYOUT_TOKENS,
  REQUIRED_SOURCE_MARKERS,
  TEXT_GLYPH_CONTROL_PATTERNS,
  createEnterpriseLayoutDisplayMediaTokenizationReport,
  validateEnterpriseLayoutDisplayMediaTokenizationReport
} = require('../../catalog/enterprise-layout-display-media-tokenization');

const LAYOUT_TOKENIZATION_MODULE_PATH = 'catalog/enterprise-layout-display-media-tokenization.js';
const LAYOUT_TOKENIZATION_SUITE_PATH = 'tests/components/enterprise_layout_display_media_tokenization_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runEnterpriseLayoutDisplayMediaTokenizationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-layout-display-media-tokenization',
    label: 'ECH-WP-07 Enterprise Layout Display/Media Tokenization'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(LAYOUT_TOKENIZATION_MODULE_PATH, rootDir);
  const suiteSource = readText(LAYOUT_TOKENIZATION_SUITE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(LAYOUT_TOKENIZATION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(LAYOUT_TOKENIZATION_SUITE_PATH, { rootDir, extension: '.js' });
  const report = createEnterpriseLayoutDisplayMediaTokenizationReport({ rootDir });
  const validation = validateEnterpriseLayoutDisplayMediaTokenizationReport(report);
  const invalidValidation = validateEnterpriseLayoutDisplayMediaTokenizationReport({
    schema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA,
    reportSchema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA,
    workpackage: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE,
    localGate: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE,
    requiredTokens: [],
    targets: [],
    findings: [],
    summary: { total: 0 },
    ok: true
  });

  context.assert(moduleSyntax.ok, `Layout tokenization module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Layout tokenization suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA, 'Layout tokenization report emits source schema');
  context.assert(report.reportSchema === ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA, 'Layout tokenization report emits report schema');
  context.assert(report.workpackage === ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE, 'Layout tokenization report binds ECH-WP-07');
  context.assert(report.localGate === ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE, 'Layout tokenization report exposes local gate');
  context.assert(validation.ok === true, 'Layout tokenization validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Layout tokenization validator rejects incomplete reports');
  context.assert(report.ok === true, 'Layout tokenization audit has no blocking findings');
  context.assert(report.summary.total === 0, 'Layout tokenization audit reports zero findings');
  context.assert(report.targets.length === LAYOUT_DISPLAY_MEDIA_TARGETS.length, 'Layout tokenization report covers all target components');
  assertIncludesAll(context, report.requiredTokens, REQUIRED_LAYOUT_TOKENS, 'Layout tokenization required tokens');
  assertIncludesAll(context, report.requiredDocMarkers, REQUIRED_DOC_MARKERS, 'Layout tokenization required doc markers');
  assertIncludesAll(context, report.requiredFixtureMarkers, REQUIRED_FIXTURE_MARKERS, 'Layout tokenization required fixture markers');

  LAYOUT_DISPLAY_MEDIA_TARGETS.forEach((target) => {
    const source = readText(target.file, rootDir);
    const docs = readText(target.docs, rootDir);
    const fixture = readText(target.fixture, rootDir);
    const syntax = syntaxCheckFile(target.file, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${target.tag} source syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    context.assert(report.targets.some((entry) => entry.tag === target.tag && entry.signatureRole === target.signatureRole), `Layout tokenization report includes ${target.tag}`);
    assertIncludesAll(context, source, REQUIRED_LAYOUT_TOKENS, `${target.tag} source layout tokens`);
    assertIncludesAll(context, source, REQUIRED_SOURCE_MARKERS, `${target.tag} source markers`);
    assertIncludesAll(context, docs, REQUIRED_DOC_MARKERS, `${target.tag} docs markers`);
    assertIncludesAll(context, docs, REQUIRED_LAYOUT_TOKENS, `${target.tag} docs token table`);
    assertIncludesAll(context, fixture, REQUIRED_FIXTURE_MARKERS, `${target.tag} foreign theme fixture`);
    TEXT_GLYPH_CONTROL_PATTERNS.forEach((pattern) => {
      context.assert(!source.includes(pattern), `${target.tag} avoids text glyph control pattern ${pattern}`);
    });
  });

  const masonry = readText('components/xmasonry.js', rootDir);
  context.assert(masonry.includes('part="toggle"') || masonry.includes('setAttribute("part", "toggle")'), 'x-masonry exposes toggle part');
  context.assertIncludes(masonry, 'part="toggle-icon control icon"', 'x-masonry toggle uses icon part');
  context.assertIncludes(masonry, '_setToggleIcon(toggle, wrapper.classList.contains("collapsed"))', 'x-masonry updates icon-only toggle state');

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA,
    'createEnterpriseLayoutDisplayMediaTokenizationReport',
    'validateEnterpriseLayoutDisplayMediaTokenizationReport',
    'LAYOUT_DISPLAY_MEDIA_TARGETS',
    'REQUIRED_LAYOUT_TOKENS'
  ], 'Layout tokenization module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA', 'Layout tokenization suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-07` | P1 | completed |', 'Backlog marks ECH-WP-07 completed');
  context.assertIncludes(backlog, ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE, 'Backlog exposes Layout tokenization local gate');
  context.assert(runner.hasSuite("enterprise-layout-display-media-tokenization"), 'Runner exposes Layout tokenization suite');
  context.assert(runner.hasImplementation({ function: "runEnterpriseLayoutDisplayMediaTokenizationSuite" }), 'Runner imports Layout tokenization suite');
  context.assert(packageManifest.scripts['test:enterprise-layout-display-media-tokenization'] === 'node scripts/run_xtend_tests.js enterprise-layout-display-media-tokenization', 'Package exposes Layout tokenization script');

  return context.result({
    report: {
      schema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA,
      workpackage: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE,
      targetCount: LAYOUT_DISPLAY_MEDIA_TARGETS.length,
      tokenCount: REQUIRED_LAYOUT_TOKENS.length,
      findingCount: report.summary.total,
      localGate: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE
    }
  });
}

function printEnterpriseLayoutDisplayMediaTokenizationReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-07 Enterprise Layout Display/Media Tokenization erfolgreich.',
    failureTitle: 'ECH-WP-07 Enterprise Layout Display/Media Tokenization fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  LAYOUT_TOKENIZATION_MODULE_PATH,
  LAYOUT_TOKENIZATION_SUITE_PATH,
  printEnterpriseLayoutDisplayMediaTokenizationReport,
  runEnterpriseLayoutDisplayMediaTokenizationSuite
};
