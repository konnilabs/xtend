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
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE,
  OVERLAY_TARGETS,
  createEnterpriseOverlayModeTokenParityReport,
  validateEnterpriseOverlayModeTokenParityReport
} = require('../../catalog/enterprise-overlay-mode-token-parity');

const OVERLAY_PARITY_MODULE_PATH = 'catalog/enterprise-overlay-mode-token-parity.js';
const OVERLAY_PARITY_SUITE_PATH = 'tests/components/enterprise_overlay_mode_token_parity_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runEnterpriseOverlayModeTokenParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-overlay-mode-token-parity',
    label: 'ECH-WP-06 Enterprise Overlay Mode/Token Parity'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(OVERLAY_PARITY_MODULE_PATH, rootDir);
  const suiteSource = readText(OVERLAY_PARITY_SUITE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(OVERLAY_PARITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(OVERLAY_PARITY_SUITE_PATH, { rootDir, extension: '.js' });
  const report = createEnterpriseOverlayModeTokenParityReport({ rootDir });
  const validation = validateEnterpriseOverlayModeTokenParityReport(report);
  const invalidValidation = validateEnterpriseOverlayModeTokenParityReport({
    schema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA,
    reportSchema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA,
    workpackage: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE,
    localGate: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE,
    targets: [],
    findings: [],
    summary: { total: 0 }
  });

  context.assert(moduleSyntax.ok, `Overlay parity module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Overlay parity suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA, 'Overlay parity report emits source schema');
  context.assert(report.reportSchema === ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA, 'Overlay parity report emits report schema');
  context.assert(report.workpackage === ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE, 'Overlay parity report binds ECH-WP-06');
  context.assert(report.localGate === ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE, 'Overlay parity report exposes local gate');
  context.assert(validation.ok === true, 'Overlay parity validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Overlay parity validator rejects incomplete reports');
  context.assert(report.ok === true, 'Overlay parity audit has no blocking findings');
  context.assert(report.summary.total === 0, 'Overlay parity audit reports zero findings');
  context.assert(report.targets.length === OVERLAY_TARGETS.length, 'Overlay parity report covers all target components');
  assertIncludesAll(context, report.requiredParts, ['surface', 'backdrop', 'close', 'content'], 'Overlay parity required parts');
  assertIncludesAll(context, report.requiredTokenDomains, ['surface', 'text', 'border', 'elevation', 'backdrop', 'z-index', 'focus'], 'Overlay parity token domains');

  OVERLAY_TARGETS.forEach((target) => {
    const source = readText(target.file, rootDir);
    const docs = readText(target.docs, rootDir);
    context.assert(report.targets.some((entry) => entry.tag === target.tag && entry.modeModel === target.modeModel), `Overlay parity report includes ${target.tag}`);
    assertIncludesAll(context, source, target.parts, `${target.tag} required parts`);
    assertIncludesAll(context, source, target.tokens, `${target.tag} required tokens`);
    assertIncludesAll(context, source, target.semantics, `${target.tag} mode semantics`);
    context.assert(source.includes('prefers-reduced-motion'), `${target.tag} keeps reduced motion handling`);
    context.assert(source.includes('forced-colors'), `${target.tag} keeps forced-colors handling`);
    context.assert(docs.includes('ECH-WP-06'), `${target.tag} docs describe overlay parity`);
  });

  const drawer = readText('components/xdrawer.js', rootDir);
  const sidePanel = readText('components/xsidepanel.js', rootDir);
  const modal = readText('components/xmodal.js', rootDir);
  const dialog = readText('components/xdialog.js', rootDir);
  const popover = readText('components/xpopover.js', rootDir);
  const tooltip = readText('components/xtooltip.js', rootDir);

  assertIncludesAll(context, drawer, ['part="backdrop overlay"', '--xtend-overlay-backdrop-z', '--xtend-overlay-focus-ring'], 'x-drawer overlay aliases');
  assertIncludesAll(context, sidePanel, ['part="backdrop scrim"', '--side-panel-backdrop', '--xtend-overlay-focus-ring'], 'x-side-panel overlay aliases');
  assertIncludesAll(context, modal, ['part="backdrop overlay"', '--xmodal-action-text', '--xmodal-close-hover-bg'], 'x-modal overlay aliases');
  assertIncludesAll(context, dialog, ['part="backdrop overlay"', '--xdialog-surface', '--xdialog-action-text'], 'x-dialog overlay aliases');
  assertIncludesAll(context, popover, ["import './xicon.js';", 'part="backdrop"', 'part="close control"', 'name="close"', '--xpopover-close-display'], 'x-popover optional modal parity');
  assertIncludesAll(context, tooltip, ['part="backdrop"', 'part="close"', '--xtooltip-bg', 'role="tooltip"'], 'x-tooltip non-modal parity');

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA,
    'createEnterpriseOverlayModeTokenParityReport',
    'validateEnterpriseOverlayModeTokenParityReport',
    'OVERLAY_TARGETS'
  ], 'Overlay parity module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA', 'Overlay parity suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-06` | P1 | completed |', 'Backlog marks ECH-WP-06 completed');
  context.assertIncludes(backlog, ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE, 'Backlog exposes Overlay parity local gate');
  context.assertIncludes(runner, "id: 'enterprise-overlay-mode-token-parity'", 'Runner exposes Overlay parity suite');
  context.assertIncludes(runner, 'runEnterpriseOverlayModeTokenParitySuite', 'Runner imports Overlay parity suite');
  context.assert(packageManifest.scripts['test:enterprise-overlay-mode-token-parity'] === 'node scripts/run_xtend_tests.js enterprise-overlay-mode-token-parity', 'Package exposes Overlay parity script');

  return context.result({
    report: {
      schema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA,
      workpackage: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE,
      targetCount: OVERLAY_TARGETS.length,
      findingCount: report.summary.total,
      localGate: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE
    }
  });
}

function printEnterpriseOverlayModeTokenParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-06 Enterprise Overlay Mode/Token Parity erfolgreich.',
    failureTitle: 'ECH-WP-06 Enterprise Overlay Mode/Token Parity fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  OVERLAY_PARITY_MODULE_PATH,
  OVERLAY_PARITY_SUITE_PATH,
  printEnterpriseOverlayModeTokenParityReport,
  runEnterpriseOverlayModeTokenParitySuite
};
