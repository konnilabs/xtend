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
  AUDIT_CATEGORIES,
  CATEGORY_SUGGESTIONS,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE,
  KNOWN_RESIDUAL_FILES,
  P0_COMPONENTS,
  SCAN_ROOTS,
  createEnterpriseComponentStyleAuditReport,
  detectLineFindings,
  isBlockingFinding,
  validateEnterpriseComponentStyleAuditReport
} = require('../../catalog/enterprise-component-style-audit');

const AUDIT_MODULE_PATH = 'catalog/enterprise-component-style-audit.js';
const AUDIT_SUITE_PATH = 'tests/components/enterprise_component_style_audit_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function hasFinding(report, predicate) {
  return report.findings.some(predicate);
}

function categoryCount(report, category) {
  return report.summary.byCategory[category] || 0;
}

function runEnterpriseComponentStyleAuditSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-component-style-audit',
    label: 'ECH-WP-02 Enterprise Component Style Audit'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(AUDIT_MODULE_PATH, rootDir);
  const suiteSource = readText(AUDIT_SUITE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(AUDIT_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(AUDIT_SUITE_PATH, { rootDir, extension: '.js' });
  const report = createEnterpriseComponentStyleAuditReport({ rootDir });
  const validation = validateEnterpriseComponentStyleAuditReport(report);
  const invalidValidation = validateEnterpriseComponentStyleAuditReport({
    schema: ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA,
    reportSchema: ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA,
    workpackage: ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE,
    categories: [],
    scanRoots: [],
    residualPolicy: { newP0FindingsBlock: false },
    summary: { blocking: 0 },
    findings: []
  });
  const glyphFindings = detectLineFindings({
    line: 'button.innerHTML = "&times;";',
    file: 'components/xheader.js',
    tag: 'x-header'
  });
  const colorFindings = detectLineFindings({
    line: '.thing { color: #fff; }',
    file: 'components/xheader.js',
    tag: 'x-header'
  });
  const typographyFindings = detectLineFindings({
    line: 'font-family: Arial, sans-serif;',
    file: 'components/xheader.js',
    tag: 'x-header'
  });
  const tokenFallbackFindings = detectLineFindings({
    line: 'color: var(--xtend-control-text, #fff);',
    file: 'components/xheader.js',
    tag: 'x-header'
  });

  context.assert(moduleSyntax.ok, `Enterprise Style Audit module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Enterprise Style Audit suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA, 'Audit report emits source schema');
  context.assert(report.reportSchema === ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA, 'Audit report emits report schema');
  context.assert(report.findingSchema === ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA, 'Audit report emits finding schema');
  context.assert(report.workpackage === ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE, 'Audit report binds ECH-WP-02');
  context.assert(report.localGate === ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE, 'Audit report exposes local gate');
  context.assert(validation.ok === true, 'Audit validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Audit validator rejects incomplete reports');
  context.assert(report.ok === true, 'Known-residual baseline has no blocking P0 findings');
  context.assert(report.summary.blocking === 0, 'Audit summary reports zero blocking findings in the baseline');
  context.assert(report.summary.total > 0, 'Audit records existing residual findings');
  context.assert(report.summary.knownResiduals > 0, 'Audit marks known residuals explicitly');
  assertIncludesAll(context, report.categories, AUDIT_CATEGORIES, 'Audit category set');
  assertIncludesAll(context, report.scanRoots, SCAN_ROOTS, 'Audit scan roots');
  assertIncludesAll(context, report.p0Components, P0_COMPONENTS, 'Audit P0 component list');
  assertIncludesAll(context, Object.keys(CATEGORY_SUGGESTIONS), AUDIT_CATEGORIES, 'Audit remediation map');
  assertIncludesAll(context, Object.keys(report.summary.byCategory), [
    'style.color.literal',
    'style.spacing.literal',
    'control.text-glyph'
  ], 'Audit baseline categories');
  context.assert(categoryCount(report, 'style.color.literal') > 0, 'Audit detects direct color literals');
  context.assert(categoryCount(report, 'style.spacing.literal') > 0, 'Audit detects direct spacing literals');
  context.assert(categoryCount(report, 'control.text-glyph') > 0, 'Audit detects text glyph controls');
  context.assert(report.files.includes('components/xheader.js'), 'Audit scans x-header source');
  context.assert(report.files.includes('tests/browser/fixtures/xtend-signature-ui-smoke.html'), 'Audit scans Signature UI fixture');
  context.assert(hasFinding(report, (finding) => finding.file === 'components/xheader.js' && finding.knownResidual === true), 'Audit classifies x-header findings as known residuals');
  context.assert(hasFinding(report, (finding) => finding.suggestion && finding.suggestion.includes('token')), 'Audit findings include remediation suggestions');
  context.assert(KNOWN_RESIDUAL_FILES.includes('components/xheader.js'), 'Audit baseline includes x-header residual file');

  context.assert(glyphFindings.some((finding) => finding.category === 'control.text-glyph'), 'Line detector catches &times; control glyphs');
  context.assert(colorFindings.some((finding) => finding.category === 'style.color.literal'), 'Line detector catches direct hex colors');
  context.assert(typographyFindings.some((finding) => finding.category === 'style.typography.literal'), 'Line detector catches direct font stacks');
  context.assert(tokenFallbackFindings.length === 0, 'Line detector allows token fallback colors');
  context.assert(isBlockingFinding({ tag: 'x-header', category: 'style.color.literal', knownResidual: false }) === true, 'Blocking policy blocks new P0 visual literals');
  context.assert(isBlockingFinding({ tag: 'x-header', category: 'style.color.literal', knownResidual: true }) === false, 'Blocking policy permits known residuals');
  context.assert(isBlockingFinding({ tag: 'x-section', category: 'style.color.literal', knownResidual: false }) === false, 'Blocking policy keeps non-P0 findings report-only');

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA,
    ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
    'createEnterpriseComponentStyleAuditReport',
    'detectLineFindings',
    'known-residual-file-baseline'
  ], 'Audit module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA', 'Audit suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-02` | P0 | completed |', 'Backlog marks ECH-WP-02 completed');
  context.assertIncludes(backlog, AUDIT_MODULE_PATH, 'Backlog links Enterprise Style Audit module');
  context.assertIncludes(backlog, AUDIT_SUITE_PATH, 'Backlog links Enterprise Style Audit suite');
  context.assertIncludes(backlog, ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE, 'Backlog exposes Enterprise Style Audit local gate');
  context.assert(runner.hasSuite("enterprise-component-style-audit"), 'Runner exposes Enterprise Style Audit suite');
  context.assert(runner.hasImplementation({ function: "runEnterpriseComponentStyleAuditSuite" }), 'Runner imports Enterprise Style Audit suite');
  context.assert(packageManifest.scripts['test:enterprise-component-style-audit'] === 'node scripts/run_xtend_tests.js enterprise-component-style-audit', 'Package exposes Enterprise Style Audit test script');

  return context.result({
    report: {
      schema: ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
      workpackage: ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE,
      totalFindings: report.summary.total,
      knownResiduals: report.summary.knownResiduals,
      blockingFindings: report.summary.blocking,
      categoryCount: AUDIT_CATEGORIES.length,
      scannedFiles: report.files.length,
      localGate: ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE
    }
  });
}

function printEnterpriseComponentStyleAuditReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-02 Enterprise Component Style Audit erfolgreich.',
    failureTitle: 'ECH-WP-02 Enterprise Component Style Audit fehlgeschlagen:'
  });
}

module.exports = {
  AUDIT_MODULE_PATH,
  AUDIT_SUITE_PATH,
  BACKLOG_PATH,
  printEnterpriseComponentStyleAuditReport,
  runEnterpriseComponentStyleAuditSuite
};
