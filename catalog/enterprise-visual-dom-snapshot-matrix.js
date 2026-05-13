const fs = require('fs');
const path = require('path');

const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA = 'xtend.enterprise.visual-dom-snapshot-matrix.v1';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA = 'xtend.enterprise.visual-dom-snapshot-matrix-record.v1';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA = 'xtend.enterprise.visual-dom-snapshot-matrix-dom-baseline.v1';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA = 'xtend.enterprise.visual-dom-snapshot-matrix-fixture.v1';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FINDING_SCHEMA = 'xtend.enterprise.visual-dom-snapshot-matrix-finding.v1';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA = 'xtend.signature-ui.visual-quality-report.v1';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE = 'ECH-WP-10';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE = 'tests/browser/fixtures/enterprise-visual-dom-snapshot-matrix.html';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE = 'tests/browser/visual-baselines/enterprise-visual-dom-snapshot-matrix.dom-baseline.json';
const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RESULT_KEY = '__xtendEnterpriseVisualDomSnapshotMatrixResult';

const VISUAL_THEMES = Object.freeze(['light', 'dark', 'high-contrast', 'forced-colors']);
const VISUAL_DENSITIES = Object.freeze(['comfortable', 'compact', 'dense']);
const VISUAL_MOTION_MODES = Object.freeze(['default-motion', 'reduced-motion']);
const VISUAL_VIEWPORTS = Object.freeze(['desktop-1280', 'tablet-768', 'mobile-390']);
const XHEADER_MENU_MODES = Object.freeze(['drawer', 'side-panel', 'popover', 'fullscreen', 'inline-main']);
const SIGNATURE_UI_STATES = Object.freeze(['default', 'hover', 'focus', 'active', 'disabled', 'empty', 'loading', 'error']);
const TYPOGRAPHY_SAMPLES = Object.freeze(['long-label', 'numeric', 'code', 'dense-navigation']);
const ANTI_GENERIC_CHECKS = Object.freeze(['palette-varied', 'no-card-dominance', 'no-unmotivated-gradient']);

const REQUIRED_FIXTURE_CHECKS = Object.freeze([
  'visual dom matrix fixture loaded local components',
  'visual dom matrix x-header modes covered',
  'visual dom matrix theme variants covered',
  'visual dom matrix densities covered',
  'visual dom matrix viewports covered',
  'visual dom matrix reduced motion covered',
  'visual dom matrix signature states covered',
  'visual dom matrix typography samples covered',
  'visual dom matrix anti generic palette covered',
  'visual dom matrix card dominance constrained',
  'visual dom matrix unmotivated gradients absent',
  'visual dom matrix remains local only'
]);

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(readFile(rootDir, relativePath));
}

function createEnterpriseVisualDomSnapshotRecords() {
  return XHEADER_MENU_MODES.map((mode) => ({
    schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA,
    id: `x-header-${mode}-signature-state`,
    component: 'x-header',
    menuMode: mode,
    root: `x-header#wp10-header-${mode}[menu-mode="${mode}"]`,
    themeVariants: VISUAL_THEMES.slice(),
    densities: VISUAL_DENSITIES.slice(),
    motionModes: VISUAL_MOTION_MODES.slice(),
    viewports: VISUAL_VIEWPORTS.slice(),
    signatureStates: SIGNATURE_UI_STATES.slice(),
    typographySamples: TYPOGRAPHY_SAMPLES.slice(),
    antiGenericChecks: ANTI_GENERIC_CHECKS.slice(),
    domAssertions: [
      'shadow-root-present',
      'menu-mode-attribute-present',
      'snapshot-menuMode-present',
      'trigger-icon-control-present',
      'active-current-selected-state-present',
      'focus-risk-visible',
      'contrast-risk-visible',
      'long-label-wrap-present'
    ],
    capturePolicy: {
      mode: 'deterministic-dom-baseline',
      fixture: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE,
      binaryBaselines: false,
      optionalScreenshotBaseline: true
    }
  }));
}

function countMatrixCombinations(records) {
  return records.reduce((count, record) => (
    count +
    record.themeVariants.length *
    record.densities.length *
    record.motionModes.length *
    record.viewports.length *
    1
  ), 0);
}

function createEnterpriseVisualDomSnapshotBaseline(options = {}) {
  const records = options.records || createEnterpriseVisualDomSnapshotRecords();
  return {
    schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA,
    matrixSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA,
    recordSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA,
    fixtureSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA,
    workpackage: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE,
    fixture: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE,
    binaryBaselines: false,
    optionalScreenshotBaselines: true,
    snapshotCount: records.length,
    headerModeCount: XHEADER_MENU_MODES.length,
    matrixCombinationCount: countMatrixCombinations(records),
    records
  };
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = comparable(value[key]);
    return result;
  }, {});
}

function addFinding(findings, category, message, pattern, file) {
  findings.push({
    schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FINDING_SCHEMA,
    category,
    file,
    message,
    pattern,
    blocking: true
  });
}

function inspectFixture(rootDir, findings) {
  const fixture = readFile(rootDir, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
  const requiredMarkers = [
    ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA,
    ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RESULT_KEY,
    'data-visual-matrix-theme',
    'data-visual-matrix-density',
    'data-visual-matrix-motion',
    'data-visual-matrix-viewport',
    'data-anti-generic="palette-varied no-card-dominance no-unmotivated-gradient"'
  ];

  requiredMarkers.forEach((marker) => {
    if (!fixture.includes(marker)) {
      addFinding(findings, 'fixture.marker.missing', `Fixture must include ${marker}`, marker, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  XHEADER_MENU_MODES.forEach((mode) => {
    const marker = `menu-mode="${mode}"`;
    if (!fixture.includes(marker)) {
      addFinding(findings, 'fixture.header-mode.missing', `Fixture must render x-header mode ${mode}`, marker, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  VISUAL_THEMES.forEach((theme) => {
    if (!fixture.includes(theme)) {
      addFinding(findings, 'fixture.theme.missing', `Fixture must cover ${theme}`, theme, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  VISUAL_DENSITIES.forEach((density) => {
    if (!fixture.includes(density)) {
      addFinding(findings, 'fixture.density.missing', `Fixture must cover ${density}`, density, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  VISUAL_MOTION_MODES.forEach((mode) => {
    if (!fixture.includes(mode)) {
      addFinding(findings, 'fixture.motion.missing', `Fixture must cover ${mode}`, mode, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  VISUAL_VIEWPORTS.forEach((viewport) => {
    if (!fixture.includes(viewport)) {
      addFinding(findings, 'fixture.viewport.missing', `Fixture must cover ${viewport}`, viewport, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  SIGNATURE_UI_STATES.forEach((state) => {
    if (!fixture.includes(state)) {
      addFinding(findings, 'fixture.signature-state.missing', `Fixture must cover signature state ${state}`, state, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  TYPOGRAPHY_SAMPLES.forEach((sample) => {
    if (!fixture.includes(`data-typography-sample="${sample}"`)) {
      addFinding(findings, 'fixture.typography.missing', `Fixture must cover typography sample ${sample}`, sample, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  REQUIRED_FIXTURE_CHECKS.forEach((check) => {
    if (!fixture.includes(`recordCheck('${check}'`)) {
      addFinding(findings, 'fixture.check.missing', `Fixture must record ${check}`, check, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
    }
  });

  if (fixture.includes('https://cdn') || fixture.includes('type="importmap"')) {
    addFinding(findings, 'fixture.local-only.violation', 'Fixture must remain local-only without CDN or import maps', 'cdn-or-importmap', ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE);
  }

  return fixture;
}

function inspectBaseline(rootDir, findings, records) {
  const baseline = readJson(rootDir, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE);
  const expected = createEnterpriseVisualDomSnapshotBaseline({ records });
  const actualComparable = JSON.stringify(comparable(baseline));
  const expectedComparable = JSON.stringify(comparable(expected));
  if (actualComparable !== expectedComparable) {
    addFinding(findings, 'baseline.diff', 'DOM baseline must match generated WP-10 records', ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE, ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE);
  }
  return baseline;
}

function inspectSource(rootDir, findings) {
  const headerSource = readFile(rootDir, 'components/xheader.js');
  const requiredMarkers = [
    'xtendNavigationRoutingUxProfile',
    'signatureDesign',
    'menuModes',
    'snapshot()',
    'trigger-icon control icon',
    'aria-current',
    'aria-selected',
    'forced-colors',
    'prefers-reduced-motion'
  ];
  requiredMarkers.forEach((marker) => {
    if (!headerSource.includes(marker)) {
      addFinding(findings, 'source.xheader.marker-missing', `x-header source must include ${marker}`, marker, 'components/xheader.js');
    }
  });
}

function createEnterpriseVisualDomSnapshotMatrixReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const records = createEnterpriseVisualDomSnapshotRecords();
  const findings = [];
  const fixture = inspectFixture(rootDir, findings);
  const baseline = inspectBaseline(rootDir, findings, records);
  inspectSource(rootDir, findings);
  const summary = findings.reduce((result, finding) => {
    result.total += 1;
    result.byCategory[finding.category] = (result.byCategory[finding.category] || 0) + 1;
    return result;
  }, { total: 0, byCategory: {} });

  return {
    schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA,
    matrixSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA,
    fixtureSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA,
    baselineSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA,
    recordSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA,
    findingSchema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FINDING_SCHEMA,
    workpackage: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE,
    localGate: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE,
    fixture: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE,
    baseline: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE,
    resultKey: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RESULT_KEY,
    themeVariants: VISUAL_THEMES.slice(),
    densities: VISUAL_DENSITIES.slice(),
    motionModes: VISUAL_MOTION_MODES.slice(),
    viewports: VISUAL_VIEWPORTS.slice(),
    headerModes: XHEADER_MENU_MODES.slice(),
    signatureStates: SIGNATURE_UI_STATES.slice(),
    typographySamples: TYPOGRAPHY_SAMPLES.slice(),
    antiGenericChecks: ANTI_GENERIC_CHECKS.slice(),
    records,
    coverage: {
      snapshotCount: records.length,
      headerModeCount: XHEADER_MENU_MODES.length,
      themeVariantCount: VISUAL_THEMES.length,
      densityCount: VISUAL_DENSITIES.length,
      motionModeCount: VISUAL_MOTION_MODES.length,
      viewportCount: VISUAL_VIEWPORTS.length,
      signatureStateCount: SIGNATURE_UI_STATES.length,
      typographySampleCount: TYPOGRAPHY_SAMPLES.length,
      matrixCombinationCount: countMatrixCombinations(records),
      fixtureBytes: fixture.length,
      baselineRecords: Array.isArray(baseline.records) ? baseline.records.length : 0
    },
    risksVisible: {
      contrast: true,
      focus: true,
      typographyOverflow: true,
      cardDominance: true,
      monotonePalette: true,
      unmotivatedGradients: true
    },
    summary,
    findings,
    ok: findings.length === 0
  };
}

function validateEnterpriseVisualDomSnapshotMatrixReport(report = {}) {
  const errors = [];
  if (report.schema !== ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA) errors.push(`schema must be ${ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA}`);
  if (report.matrixSchema !== ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA) errors.push(`matrixSchema must be ${ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA}`);
  if (report.fixtureSchema !== ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA}`);
  if (report.baselineSchema !== ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA) errors.push(`baselineSchema must be ${ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA}`);
  if (report.workpackage !== ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE}`);
  if (report.localGate !== ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE) errors.push('invalid local gate');
  if (!Array.isArray(report.records) || report.records.length !== XHEADER_MENU_MODES.length) errors.push('records must cover every x-header menu mode');
  if (!Array.isArray(report.headerModes) || !XHEADER_MENU_MODES.every((mode) => report.headerModes.includes(mode))) errors.push('headerModes must include every x-header mode');
  if (!Array.isArray(report.themeVariants) || !VISUAL_THEMES.every((theme) => report.themeVariants.includes(theme))) errors.push('themeVariants must include every required theme');
  if (!Array.isArray(report.densities) || !VISUAL_DENSITIES.every((density) => report.densities.includes(density))) errors.push('densities must include every required density');
  if (!Array.isArray(report.motionModes) || !VISUAL_MOTION_MODES.every((mode) => report.motionModes.includes(mode))) errors.push('motionModes must include every required motion mode');
  if (!Array.isArray(report.viewports) || !VISUAL_VIEWPORTS.every((viewport) => report.viewports.includes(viewport))) errors.push('viewports must include every required viewport');
  if (!Array.isArray(report.signatureStates) || !SIGNATURE_UI_STATES.every((state) => report.signatureStates.includes(state))) errors.push('signatureStates must include every required state');
  if (!Array.isArray(report.typographySamples) || !TYPOGRAPHY_SAMPLES.every((sample) => report.typographySamples.includes(sample))) errors.push('typographySamples must include every required sample');
  if (!report.coverage || report.coverage.matrixCombinationCount !== 360) errors.push('matrixCombinationCount must be 360');
  if (!report.risksVisible || !report.risksVisible.contrast || !report.risksVisible.focus) errors.push('contrast and focus risks must be visible');
  if (!Array.isArray(report.findings)) errors.push('findings must be an array');
  if (!report.summary || typeof report.summary.total !== 'number') errors.push('summary.total must be numeric');
  if (report.ok !== (Array.isArray(report.findings) && report.findings.length === 0)) errors.push('ok must reflect finding count');
  return {
    schema: ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  ANTI_GENERIC_CHECKS,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA,
  ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FINDING_SCHEMA,
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
};
