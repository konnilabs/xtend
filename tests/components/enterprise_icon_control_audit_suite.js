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
  CONTROL_KEYWORDS,
  ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE,
  ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA,
  ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA,
  ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE,
  IGNORED_FILES,
  PRODUCTION_SCAN_PATHS,
  REQUIRED_CORE_ICONS,
  createEnterpriseIconControlAuditReport,
  isTextGlyphControlContent,
  validateEnterpriseIconControlAuditReport
} = require('../../catalog/enterprise-icon-control-audit');

const ICON_AUDIT_MODULE_PATH = 'catalog/enterprise-icon-control-audit.js';
const ICON_AUDIT_SUITE_PATH = 'tests/components/enterprise_icon_control_audit_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const XICON_DOC_PATH = 'docs/components/xicon.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runEnterpriseIconControlAuditSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-icon-control-audit',
    label: 'ECH-WP-04 Enterprise Icon Control Audit'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(ICON_AUDIT_MODULE_PATH, rootDir);
  const suiteSource = readText(ICON_AUDIT_SUITE_PATH, rootDir);
  const coreIcons = readText('components/icon-packs/core.js', rootDir);
  const xIconDocs = readText(XICON_DOC_PATH, rootDir);
  const xSidePanel = readText('components/xsidepanel.js', rootDir);
  const xSurfaceWindow = readText('components/xsurfacewindow.js', rootDir);
  const xStatus = readText('components/xstatus.js', rootDir);
  const xStatusTs = readText('src/components/x-status/x-status.ts', rootDir);
  const xCalendar = readText('components/xcalendar.js', rootDir);
  const xHero = readText('components/xhero.js', rootDir);
  const xHeader = readText('components/xheader.js', rootDir);
  const xDrawer = readText('components/xdrawer.js', rootDir);
  const xModal = readText('components/xmodal.js', rootDir);
  const xDialog = readText('components/xdialog.js', rootDir);
  const xToast = readText('components/xtoast.js', rootDir);
  const xLightbox = readText('components/xlightbox.js', rootDir);
  const xCode = readText('components/xcode.js', rootDir);
  const moduleSyntax = syntaxCheckFile(ICON_AUDIT_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(ICON_AUDIT_SUITE_PATH, { rootDir, extension: '.js' });
  const report = createEnterpriseIconControlAuditReport({ rootDir });
  const validation = validateEnterpriseIconControlAuditReport(report);
  const invalidValidation = validateEnterpriseIconControlAuditReport({
    schema: ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA,
    reportSchema: ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA,
    workpackage: ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE,
    requiredCoreIcons: [],
    summary: { total: 0 },
    findings: [],
    ok: true
  });

  context.assert(moduleSyntax.ok, `Enterprise Icon Control Audit module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Enterprise Icon Control Audit suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA, 'Icon Control report emits source schema');
  context.assert(report.reportSchema === ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA, 'Icon Control report emits report schema');
  context.assert(report.workpackage === ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE, 'Icon Control report binds ECH-WP-04');
  context.assert(report.localGate === ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE, 'Icon Control report exposes local gate');
  context.assert(validation.ok === true, 'Icon Control validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Icon Control validator rejects incomplete reports');
  context.assert(report.ok === true, 'Production icon controls contain no blocking glyph regressions');
  context.assert(report.summary.total === 0, 'Icon Control audit reports zero findings');
  assertIncludesAll(context, report.scanPaths, PRODUCTION_SCAN_PATHS, 'Icon Control scan paths');
  assertIncludesAll(context, report.ignoredFiles, IGNORED_FILES, 'Icon Control ignored files');
  assertIncludesAll(context, report.requiredCoreIcons, REQUIRED_CORE_ICONS, 'Icon Control required core icons');
  context.assert(!report.files.includes('xtend.js'), 'Icon Control audit excludes the ESM registry entry point');
  context.assert(report.files.includes('components/xsidepanel.js'), 'Icon Control audit scans x-side-panel');
  context.assert(report.files.includes('src/components/x-status/x-status.ts'), 'Icon Control audit scans TypeScript x-status source');

  context.assert(isTextGlyphControlContent('x') === true, 'Glyph detector catches x');
  context.assert(isTextGlyphControlContent('&times;') === true, 'Glyph detector catches &times;');
  context.assert(isTextGlyphControlContent('<x-icon name="close" decorative></x-icon>') === false, 'Glyph detector allows x-icon controls');
  context.assert(CONTROL_KEYWORDS.includes('dismiss'), 'Control keyword list includes dismiss');

  REQUIRED_CORE_ICONS.forEach((name) => {
    const keyPattern = name.includes('-') ? `'${name}':` : `${name}:`;
    context.assertIncludes(coreIcons, keyPattern, `Core icon pack includes ${name}`);
  });
  assertIncludesAll(context, coreIcons, [
    "aliases: ['x', 'cancel', 'dismiss']",
    "aliases: ['hamburger', 'nav']",
    "aliases: ['previous', 'left', 'collapse']",
    "aliases: ['minimize', 'remove']"
  ], 'Core icon aliases');

  assertIncludesAll(context, xSidePanel, [
    "import './xicon.js';",
    'name="pin"',
    'name="chevron-left"',
    'name="close"',
    'part="close-icon control icon"',
    'event.target.closest'
  ], 'x-side-panel icon controls');
  context.assert(!xSidePanel.includes('>x</button>'), 'x-side-panel has no x close glyph');
  context.assert(!xSidePanel.includes('&lt;</button>'), 'x-side-panel has no text chevron glyph');
  context.assert(!xSidePanel.includes('>P</button>'), 'x-side-panel has no P pin glyph');

  assertIncludesAll(context, xSurfaceWindow, [
    "import './xicon.js';",
    'name="minus"',
    'name="maximize"',
    'name="close"',
    'part="minimize-icon control icon"',
    'part="maximize-icon control icon"',
    'part="close-icon control icon"',
    'event.target.closest'
  ], 'x-surface-window icon controls');
  context.assert(!xSurfaceWindow.includes('>_</button>'), 'x-surface-window has no minimize text glyph');
  context.assert(!xSurfaceWindow.includes('>[]</button>'), 'x-surface-window has no maximize text glyph');
  context.assert(!xSurfaceWindow.includes('>x</button>'), 'x-surface-window has no x close glyph');

  assertIncludesAll(context, xStatus, [
    "import './xicon.js';",
    'name="info"',
    'name="close"',
    '_iconNameForType',
    'part="close-icon control icon"'
  ], 'x-status icon controls');
  assertIncludesAll(context, xStatusTs, [
    "import '../../../components/xicon.js';",
    'name="info"',
    'name="close"',
    'part="close-icon control icon"'
  ], 'TypeScript x-status icon controls');
  context.assert(!xStatus.includes('hidden>x</button>'), 'x-status has no x dismiss glyph');
  context.assert(!xStatusTs.includes('hidden>x</button>'), 'TypeScript x-status has no x dismiss glyph');

  assertIncludesAll(context, xCalendar, ['name="chevron-left"', 'name="chevron-right"', 'part="previous-icon control icon"', 'part="next-icon control icon"'], 'x-calendar navigation icon controls');
  assertIncludesAll(context, xHero, ['name="chevron-down"', 'part="scroll-button control"', 'part="scroll-icon control icon"'], 'x-hero scroll icon control');
  assertIncludesAll(context, xHeader, ['part="trigger control"', 'part="trigger-icon control icon"'], 'x-header menu trigger icon parts');
  assertIncludesAll(context, xDrawer, ['part="close control"', 'part="close-icon control icon"'], 'x-drawer close icon parts');
  assertIncludesAll(context, xModal, ['part="close control"', 'part="close-icon control icon"'], 'x-modal close icon parts');
  assertIncludesAll(context, xDialog, ['part="close control"', 'part="close-icon control icon"'], 'x-dialog close icon parts');
  assertIncludesAll(context, xToast, ['part="close control"', 'part="close-icon control icon"'], 'x-toast close icon parts');
  assertIncludesAll(context, xLightbox, ['part="close control"', 'part="close-icon control icon"'], 'x-lightbox close icon parts');
  assertIncludesAll(context, xCode, ['part="copy control"', 'part="copy-icon control icon"'], 'x-code copy icon parts');


  assertIncludesAll(context, xIconDocs, [
    'ECH-WP-04',
    'Keine Textglyphen als Controls',
    'part="control icon"',
    'close',
    'menu',
    'chevron-left',
    'success',
    'warning',
    'error'
  ], 'x-icon docs control rule');

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA,
    'createEnterpriseIconControlAuditReport',
    'validateEnterpriseIconControlAuditReport',
    'REQUIRED_CORE_ICONS'
  ], 'Icon Control audit module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA', 'Icon Control audit suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-04` | P0 | completed |', 'Backlog marks ECH-WP-04 completed');
  context.assertIncludes(backlog, ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE, 'Backlog exposes Icon Control local gate');
  context.assert(runner.hasSuite("enterprise-icon-control-audit"), 'Runner exposes Icon Control audit suite');
  context.assert(runner.hasImplementation({ function: "runEnterpriseIconControlAuditSuite" }), 'Runner imports Icon Control audit suite');
  context.assert(packageManifest.scripts['test:enterprise-icon-control-audit'] === 'node scripts/run_xtend_tests.js enterprise-icon-control-audit', 'Package exposes Icon Control audit script');

  return context.result({
    report: {
      schema: ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA,
      workpackage: ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE,
      requiredCoreIconCount: REQUIRED_CORE_ICONS.length,
      scannedFiles: report.files.length,
      findingCount: report.summary.total,
      localGate: ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE
    }
  });
}

function printEnterpriseIconControlAuditReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-04 Enterprise Icon Control Audit erfolgreich.',
    failureTitle: 'ECH-WP-04 Enterprise Icon Control Audit fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  ICON_AUDIT_MODULE_PATH,
  ICON_AUDIT_SUITE_PATH,
  XICON_DOC_PATH,
  printEnterpriseIconControlAuditReport,
  runEnterpriseIconControlAuditSuite
};
