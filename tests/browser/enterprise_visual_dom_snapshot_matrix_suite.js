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
  ANTI_GENERIC_CHECKS,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RESULT_KEY,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE,
  REQUIRED_FIXTURE_CHECKS,
  SIGNATURE_UI_STATES,
  TYPOGRAPHY_SAMPLES,
  VISUAL_DENSITIES,
  VISUAL_MOTION_MODES,
  VISUAL_THEMES,
  VISUAL_VIEWPORTS,
  XHEADER_MENU_MODES,
  createEnterpriseVisualDomSnapshotBaseline,
  createEnterpriseVisualDomSnapshotMatrixReport,
  createEnterpriseVisualDomSnapshotRecords,
  validateEnterpriseVisualDomSnapshotMatrixReport
} = require('../../catalog/enterprise-visual-dom-snapshot-matrix');

const VISUAL_DOM_MATRIX_MODULE_PATH = 'catalog/enterprise-visual-dom-snapshot-matrix.js';
const VISUAL_DOM_MATRIX_SUITE_PATH = 'tests/browser/enterprise_visual_dom_snapshot_matrix_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(source) && source.includes(entry), `${label} includes ${entry}`);
  });
}

function normalizeJson(value) {
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = normalizeJson(value[key]);
    return result;
  }, {});
}

function runEnterpriseVisualDomSnapshotMatrixSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-visual-dom-snapshot-matrix',
    label: 'ECH-WP-10 Enterprise Visual DOM Snapshot Matrix'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(VISUAL_DOM_MATRIX_MODULE_PATH, rootDir);
  const suiteSource = readText(VISUAL_DOM_MATRIX_SUITE_PATH, rootDir);
  const fixture = readText(ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE, rootDir);
  const baseline = readJson(ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE, rootDir);
  const headerSource = readText('components/xheader.js', rootDir);
  const records = createEnterpriseVisualDomSnapshotRecords();
  const expectedBaseline = createEnterpriseVisualDomSnapshotBaseline({ records });
  const report = createEnterpriseVisualDomSnapshotMatrixReport({ rootDir });
  const validation = validateEnterpriseVisualDomSnapshotMatrixReport(report);
  const invalidValidation = validateEnterpriseVisualDomSnapshotMatrixReport({
    schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA,
    matrixSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA,
    fixtureSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA,
    baselineSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA,
    workpackage: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE,
    localGate: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE,
    records: [],
    findings: [],
    summary: { total: 0 },
    ok: true
  });
  const moduleSyntax = syntaxCheckFile(VISUAL_DOM_MATRIX_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(VISUAL_DOM_MATRIX_SUITE_PATH, { rootDir, extension: '.js' });

  context.assert(moduleSyntax.ok, `Visual DOM matrix module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Visual DOM matrix suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA, 'Visual DOM matrix report emits Signature visual quality report schema');
  context.assert(report.matrixSchema === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA, 'Visual DOM matrix report emits matrix schema');
  context.assert(report.fixtureSchema === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA, 'Visual DOM matrix report emits fixture schema');
  context.assert(report.baselineSchema === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA, 'Visual DOM matrix report emits baseline schema');
  context.assert(report.workpackage === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE, 'Visual DOM matrix report binds ECH-WP-10');
  context.assert(report.localGate === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE, 'Visual DOM matrix report exposes local gate');
  context.assert(validation.ok === true, 'Visual DOM matrix validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Visual DOM matrix validator rejects incomplete reports');
  context.assert(report.ok === true, 'Visual DOM matrix audit has no blocking findings');
  context.assert(report.summary.total === 0, 'Visual DOM matrix audit reports zero findings');
  context.assert(report.coverage.matrixCombinationCount === 360, 'Visual DOM matrix exposes 360 mode/theme/density/motion/viewport combinations');
  context.assert(report.coverage.headerModeCount === XHEADER_MENU_MODES.length, 'Visual DOM matrix covers every x-header menu mode');
  context.assert(report.coverage.signatureStateCount === SIGNATURE_UI_STATES.length, 'Visual DOM matrix covers every Signature UI state');
  context.assert(report.coverage.typographySampleCount === TYPOGRAPHY_SAMPLES.length, 'Visual DOM matrix covers typography samples');

  context.assert(baseline.schema === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA, 'Visual DOM matrix baseline declares schema');
  context.assert(JSON.stringify(normalizeJson(baseline)) === JSON.stringify(normalizeJson(expectedBaseline)), 'Visual DOM matrix baseline matches generated records');
  context.assert(baseline.binaryBaselines === false, 'Visual DOM matrix baseline is JSON-only');
  context.assert(baseline.optionalScreenshotBaselines === true, 'Visual DOM matrix exposes optional screenshot baseline handoff');
  context.assert(baseline.snapshotCount === XHEADER_MENU_MODES.length, 'Visual DOM matrix baseline covers five header mode records');

  assertArrayIncludesAll(context, report.themeVariants, VISUAL_THEMES, 'Visual DOM matrix themes');
  assertArrayIncludesAll(context, report.densities, VISUAL_DENSITIES, 'Visual DOM matrix densities');
  assertArrayIncludesAll(context, report.motionModes, VISUAL_MOTION_MODES, 'Visual DOM matrix motion modes');
  assertArrayIncludesAll(context, report.viewports, VISUAL_VIEWPORTS, 'Visual DOM matrix viewports');
  assertArrayIncludesAll(context, report.headerModes, XHEADER_MENU_MODES, 'Visual DOM matrix header modes');
  assertArrayIncludesAll(context, report.signatureStates, SIGNATURE_UI_STATES, 'Visual DOM matrix signature states');
  assertArrayIncludesAll(context, report.typographySamples, TYPOGRAPHY_SAMPLES, 'Visual DOM matrix typography samples');
  assertArrayIncludesAll(context, report.antiGenericChecks, ANTI_GENERIC_CHECKS, 'Visual DOM matrix anti-generic checks');

  records.forEach((record) => {
    context.assert(record.schema === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA, `${record.id}: record schema is stable`);
    context.assert(record.capturePolicy.fixture === ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE, `${record.id}: record points to fixture`);
    context.assert(record.capturePolicy.binaryBaselines === false, `${record.id}: record remains binary-baseline free`);
    context.assert(record.domAssertions.includes('focus-risk-visible'), `${record.id}: record tracks focus risk`);
    context.assert(record.domAssertions.includes('contrast-risk-visible'), `${record.id}: record tracks contrast risk`);
    context.assert(record.typographySamples.includes('long-label'), `${record.id}: record covers long-label typography`);
  });

  context.assertIncludes(fixture, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA, 'Visual DOM matrix fixture declares fixture schema');
  context.assertIncludes(fixture, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RESULT_KEY, 'Visual DOM matrix fixture exposes result key');
  context.assert(!fixture.includes('type="importmap"'), 'Visual DOM matrix fixture avoids import maps');
  context.assert(!fixture.includes('https://cdn'), 'Visual DOM matrix fixture avoids CDN');
  XHEADER_MENU_MODES.forEach((mode) => {
    context.assertIncludes(fixture, `menu-mode="${mode}"`, `Visual DOM matrix fixture renders ${mode}`);
    context.assertIncludes(fixture, `id="wp10-header-${mode}"`, `Visual DOM matrix fixture has stable ${mode} id`);
  });
  VISUAL_THEMES.forEach((theme) => context.assertIncludes(fixture, theme, `Visual DOM matrix fixture covers ${theme}`));
  VISUAL_DENSITIES.forEach((density) => context.assertIncludes(fixture, density, `Visual DOM matrix fixture covers ${density}`));
  VISUAL_MOTION_MODES.forEach((mode) => context.assertIncludes(fixture, mode, `Visual DOM matrix fixture covers ${mode}`));
  VISUAL_VIEWPORTS.forEach((viewport) => context.assertIncludes(fixture, viewport, `Visual DOM matrix fixture covers ${viewport}`));
  SIGNATURE_UI_STATES.forEach((state) => context.assertIncludes(fixture, state, `Visual DOM matrix fixture covers ${state}`));
  TYPOGRAPHY_SAMPLES.forEach((sample) => context.assertIncludes(fixture, `data-typography-sample="${sample}"`, `Visual DOM matrix fixture covers ${sample}`));
  ANTI_GENERIC_CHECKS.forEach((check) => context.assertIncludes(fixture, check, `Visual DOM matrix fixture covers ${check}`));
  REQUIRED_FIXTURE_CHECKS.forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Visual DOM matrix fixture records ${check}`);
  });

  assertIncludesAll(context, headerSource, [
    ':host([menu-mode="side-panel"])',
    ':host([menu-mode="popover"])',
    ':host([menu-mode="fullscreen"])',
    ':host([menu-mode="inline-main"])',
    'trigger-icon control icon',
    'aria-current',
    'aria-selected',
    'forced-colors',
    'prefers-reduced-motion'
  ], 'x-header visual DOM matrix source support');

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA,
    ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA,
    'createEnterpriseVisualDomSnapshotMatrixReport',
    'validateEnterpriseVisualDomSnapshotMatrixReport',
    'XHEADER_MENU_MODES',
    'ANTI_GENERIC_CHECKS'
  ], 'Visual DOM matrix module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA', 'Visual DOM matrix suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-10` | P1 | completed |', 'Backlog marks ECH-WP-10 completed');
  context.assertIncludes(backlog, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE, 'Backlog exposes Visual DOM matrix local gate');
  context.assertIncludes(runner, "id: 'enterprise-visual-dom-snapshot-matrix'", 'Runner exposes Visual DOM matrix suite');
  context.assertIncludes(runner, 'runEnterpriseVisualDomSnapshotMatrixSuite', 'Runner imports Visual DOM matrix suite');
  context.assert(packageManifest.scripts['test:enterprise-visual-dom-snapshot-matrix'] === 'node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix', 'Package exposes Visual DOM matrix script');

  return context.result({
    report: {
      schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA,
      workpackage: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE,
      fixture: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE,
      baseline: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE,
      snapshotCount: report.coverage.snapshotCount,
      matrixCombinationCount: report.coverage.matrixCombinationCount,
      findingCount: report.summary.total,
      localGate: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE
    }
  });
}

function printEnterpriseVisualDomSnapshotMatrixReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-10 Enterprise Visual DOM Snapshot Matrix erfolgreich.',
    failureTitle: 'ECH-WP-10 Enterprise Visual DOM Snapshot Matrix fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  VISUAL_DOM_MATRIX_MODULE_PATH,
  VISUAL_DOM_MATRIX_SUITE_PATH,
  printEnterpriseVisualDomSnapshotMatrixReport,
  runEnterpriseVisualDomSnapshotMatrixSuite
};
