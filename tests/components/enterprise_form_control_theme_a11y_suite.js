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
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE,
  FORM_CONTROL_THEME_TARGETS,
  REQUIRED_DOC_MARKERS,
  REQUIRED_FIXTURE_MARKERS,
  REQUIRED_FORM_TOKENS,
  REQUIRED_SOURCE_MARKERS,
  createEnterpriseFormControlThemeA11yReport,
  validateEnterpriseFormControlThemeA11yReport
} = require('../../catalog/enterprise-form-control-theme-a11y');

const FORM_THEME_A11Y_MODULE_PATH = 'catalog/enterprise-form-control-theme-a11y.js';
const FORM_THEME_A11Y_SUITE_PATH = 'tests/components/enterprise_form_control_theme_a11y_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runEnterpriseFormControlThemeA11ySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-form-control-theme-a11y',
    label: 'ECH-WP-08 Enterprise Form Control Theme/A11y Hardening'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(FORM_THEME_A11Y_MODULE_PATH, rootDir);
  const suiteSource = readText(FORM_THEME_A11Y_SUITE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(FORM_THEME_A11Y_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(FORM_THEME_A11Y_SUITE_PATH, { rootDir, extension: '.js' });
  const report = createEnterpriseFormControlThemeA11yReport({ rootDir });
  const validation = validateEnterpriseFormControlThemeA11yReport(report);
  const invalidValidation = validateEnterpriseFormControlThemeA11yReport({
    schema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA,
    reportSchema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA,
    workpackage: ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE,
    localGate: ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE,
    requiredTokens: [],
    targets: [],
    findings: [],
    summary: { total: 0 },
    ok: true
  });

  context.assert(moduleSyntax.ok, `Form theme/a11y module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Form theme/a11y suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA, 'Form theme/a11y report emits source schema');
  context.assert(report.reportSchema === ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA, 'Form theme/a11y report emits report schema');
  context.assert(report.workpackage === ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE, 'Form theme/a11y report binds ECH-WP-08');
  context.assert(report.localGate === ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE, 'Form theme/a11y report exposes local gate');
  context.assert(validation.ok === true, 'Form theme/a11y validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Form theme/a11y validator rejects incomplete reports');
  context.assert(report.ok === true, 'Form theme/a11y audit has no blocking findings');
  context.assert(report.summary.total === 0, 'Form theme/a11y audit reports zero findings');
  context.assert(report.targets.length === FORM_CONTROL_THEME_TARGETS.length, 'Form theme/a11y report covers all target controls');
  assertIncludesAll(context, report.requiredTokens, REQUIRED_FORM_TOKENS, 'Form theme/a11y required tokens');
  assertIncludesAll(context, report.requiredSourceMarkers, REQUIRED_SOURCE_MARKERS, 'Form theme/a11y required source markers');
  assertIncludesAll(context, report.requiredDocMarkers, REQUIRED_DOC_MARKERS, 'Form theme/a11y required doc markers');
  assertIncludesAll(context, report.requiredFixtureMarkers, REQUIRED_FIXTURE_MARKERS, 'Form theme/a11y required fixture markers');

  const fixtureCorpus = FORM_CONTROL_THEME_TARGETS.map((target) => readText(target.fixture, rootDir)).join('\n');
  context.assert(fixtureCorpus.includes('density="comfortable"'), 'Fixtures cover comfortable density');
  context.assert(fixtureCorpus.includes('density="compact"'), 'Fixtures cover compact density');
  context.assert(fixtureCorpus.includes('density="dense"'), 'Fixtures cover dense density');
  context.assert(fixtureCorpus.includes('invalid'), 'Fixtures cover invalid/error state');
  context.assert(fixtureCorpus.includes('busy'), 'Fixtures cover busy state');

  FORM_CONTROL_THEME_TARGETS.forEach((target) => {
    const source = readText(target.file, rootDir);
    const docs = readText(target.docs, rootDir);
    const fixture = readText(target.fixture, rootDir);
    const syntax = syntaxCheckFile(target.file, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${target.tag} source syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    context.assert(report.targets.some((entry) => entry.tag === target.tag), `Form theme/a11y report includes ${target.tag}`);
    assertIncludesAll(context, source, REQUIRED_FORM_TOKENS, `${target.tag} source form tokens`);
    assertIncludesAll(context, source, REQUIRED_SOURCE_MARKERS, `${target.tag} source markers`);
    assertIncludesAll(context, docs, REQUIRED_DOC_MARKERS, `${target.tag} docs markers`);
    assertIncludesAll(context, docs, REQUIRED_FORM_TOKENS, `${target.tag} docs token table`);
    assertIncludesAll(context, fixture, REQUIRED_FIXTURE_MARKERS, `${target.tag} foreign theme fixture`);
    target.nonColorMarkers.forEach((marker) => {
      context.assert(source.includes(marker), `${target.tag} invalid/error state has non-color marker ${marker}`);
    });
  });

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA,
    'createEnterpriseFormControlThemeA11yReport',
    'validateEnterpriseFormControlThemeA11yReport',
    'FORM_CONTROL_THEME_TARGETS',
    'REQUIRED_FORM_TOKENS'
  ], 'Form theme/a11y module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA', 'Form theme/a11y suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-08` | P1 | completed |', 'Backlog marks ECH-WP-08 completed');
  context.assertIncludes(backlog, ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE, 'Backlog exposes Form theme/a11y local gate');
  context.assert(runner.hasSuite("enterprise-form-control-theme-a11y"), 'Runner exposes Form theme/a11y suite');
  context.assert(runner.hasImplementation({ function: "runEnterpriseFormControlThemeA11ySuite" }), 'Runner imports Form theme/a11y suite');
  context.assert(packageManifest.scripts['test:enterprise-form-control-theme-a11y'] === 'node scripts/run_xtend_tests.js enterprise-form-control-theme-a11y', 'Package exposes Form theme/a11y script');

  return context.result({
    report: {
      schema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA,
      workpackage: ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE,
      targetCount: FORM_CONTROL_THEME_TARGETS.length,
      tokenCount: REQUIRED_FORM_TOKENS.length,
      findingCount: report.summary.total,
      localGate: ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE
    }
  });
}

function printEnterpriseFormControlThemeA11yReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-08 Enterprise Form Control Theme/A11y Hardening erfolgreich.',
    failureTitle: 'ECH-WP-08 Enterprise Form Control Theme/A11y Hardening fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  FORM_THEME_A11Y_MODULE_PATH,
  FORM_THEME_A11Y_SUITE_PATH,
  printEnterpriseFormControlThemeA11yReport,
  runEnterpriseFormControlThemeA11ySuite
};
