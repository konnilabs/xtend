'use strict';

const MATERIAL_BROWSER_EVIDENCE_SCHEMA = 'xtend.material.browser-evidence.v1';
const MATERIAL_BROWSER_BASELINE_SCHEMA = 'xtend.material.browser-baseline.v1';
const MATERIAL_BROWSER_FIXTURE_SCHEMA = 'xtend.material.browser-fixture.v1';
const MATERIAL_BROWSER_FIXTURE_PATH = 'tests/browser/fixtures/material-browser-evidence.html';
const MATERIAL_BROWSER_BASELINE_PATH = 'tests/browser/visual-baselines/material-browser-evidence.dom-baseline.json';
const MATERIAL_BROWSER_REPORT_PATH = '.xtend-test-results/material-browser-evidence/report.json';
const MATERIAL_BROWSER_ARTIFACT_ROOT = '.xtend-test-results/material-browser-evidence';
const MATERIAL_BROWSER_POLICY_PATH = 'development/XTend-Material-Browser-Evidence.md';
const MATERIAL_BROWSER_LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-browser-evidence visual-snapshots component-runtime-a11y --json';
const MATERIAL_BROWSER_RESULT_ID = 'xtend-material-browser-evidence-result';

const MATERIAL_BROWSER_DIMENSIONS = Object.freeze({
  themes: Object.freeze(['light', 'dark', 'high-contrast', 'forced-colors']),
  densities: Object.freeze(['comfortable', 'compact', 'dense']),
  viewports: Object.freeze([
    Object.freeze({ id: 'narrow-mobile', width: 360, height: 800 }),
    Object.freeze({ id: 'tablet', width: 768, height: 900 }),
    Object.freeze({ id: 'desktop', width: 1280, height: 900 }),
    Object.freeze({ id: 'wide-desktop', width: 1600, height: 1000 })
  ]),
  motions: Object.freeze(['standard', 'reduced']),
  scenarios: Object.freeze(['app-shell', 'form-flow', 'dashboard', 'dialog-toast'])
});

function createMaterialBrowserMatrix() {
  const records = [];
  MATERIAL_BROWSER_DIMENSIONS.viewports.forEach((viewport) => {
    MATERIAL_BROWSER_DIMENSIONS.themes.forEach((theme) => {
      MATERIAL_BROWSER_DIMENSIONS.densities.forEach((density) => {
        MATERIAL_BROWSER_DIMENSIONS.motions.forEach((motion) => {
          MATERIAL_BROWSER_DIMENSIONS.scenarios.forEach((scenario) => {
            records.push({
              id: [scenario, theme, density, viewport.id, motion].join(':'),
              scenario,
              theme,
              density,
              viewport: viewport.id,
              viewportWidth: viewport.width,
              motion,
              expected: Object.freeze({
                horizontalOverflow: false,
                landmarkOrder: true,
                keyboardFocus: true,
                focusVisible: true,
                focusRestore: true,
                statusAnnouncements: true,
                readable: true,
                privateShadowRootAccess: false
              })
            });
          });
        });
      });
    });
  });
  return records;
}

function createMaterialBrowserBaseline() {
  const records = createMaterialBrowserMatrix();
  return {
    schema: MATERIAL_BROWSER_BASELINE_SCHEMA,
    evidenceSchema: MATERIAL_BROWSER_EVIDENCE_SCHEMA,
    baselineType: 'dom-interaction-and-viewport-screenshot-contract',
    matrixCellCount: records.length,
    dimensions: {
      themes: MATERIAL_BROWSER_DIMENSIONS.themes.slice(),
      densities: MATERIAL_BROWSER_DIMENSIONS.densities.slice(),
      viewports: MATERIAL_BROWSER_DIMENSIONS.viewports.map((viewport) => ({ ...viewport })),
      motions: MATERIAL_BROWSER_DIMENSIONS.motions.slice(),
      scenarios: MATERIAL_BROWSER_DIMENSIONS.scenarios.slice()
    },
    expected: { ...records[0].expected },
    screenshotBaselines: MATERIAL_BROWSER_DIMENSIONS.viewports.map((viewport) => ({
      id: viewport.id,
      width: viewport.width,
      height: viewport.height,
      artifact: `${MATERIAL_BROWSER_ARTIFACT_ROOT}/${viewport.id}.png`,
      scenarios: MATERIAL_BROWSER_DIMENSIONS.scenarios.slice()
    }))
  };
}

function validateMaterialBrowserBaseline(baseline) {
  const expected = createMaterialBrowserBaseline();
  const errors = [];
  if (!baseline || baseline.schema !== MATERIAL_BROWSER_BASELINE_SCHEMA) errors.push('baseline schema mismatch');
  if (!baseline || baseline.evidenceSchema !== MATERIAL_BROWSER_EVIDENCE_SCHEMA) errors.push('evidence schema mismatch');
  if (!baseline || baseline.matrixCellCount !== 384) errors.push('baseline must contain 384 matrix cells');
  if (!baseline || JSON.stringify(baseline.dimensions) !== JSON.stringify(expected.dimensions)) errors.push('matrix dimension drift');
  if (!baseline || JSON.stringify(baseline.expected) !== JSON.stringify(expected.expected)) errors.push('DOM/interaction baseline drift');
  if (!baseline || JSON.stringify(baseline.screenshotBaselines) !== JSON.stringify(expected.screenshotBaselines)) errors.push('screenshot baseline drift');
  return { ok: errors.length === 0, errors };
}

function createMaterialBrowserEvidenceReport(options = {}) {
  const baseline = options.baseline || createMaterialBrowserBaseline();
  const browserRuns = Array.isArray(options.browserRuns) ? options.browserRuns : [];
  const chromiumRun = browserRuns.find((run) => run.browser === 'chromium');
  const cells = chromiumRun && Array.isArray(chromiumRun.cells) ? chromiumRun.cells : [];
  const failures = cells.filter((cell) => cell.status !== 'passed');
  const severeA11yFindings = cells.flatMap((cell) => cell.findings || [])
    .filter((finding) => finding.severity === 'critical' || finding.severity === 'severe');
  const residuals = browserRuns.filter((run) => run.status === 'residual').map((run) => ({
    browser: run.browser,
    owner: run.owner,
    reason: run.reason
  }));
  const baselineValidation = validateMaterialBrowserBaseline(baseline);
  const chromiumComplete = Boolean(chromiumRun && chromiumRun.status === 'passed' && cells.length === 384);
  const screenshotCount = chromiumRun && Array.isArray(chromiumRun.screenshots) ? chromiumRun.screenshots.length : 0;
  const ok = baselineValidation.ok && chromiumComplete && failures.length === 0 && severeA11yFindings.length === 0 && screenshotCount === 4;

  return {
    schema: MATERIAL_BROWSER_EVIDENCE_SCHEMA,
    status: ok ? 'passed' : 'failed',
    ok,
    generatedAt: new Date().toISOString(),
    localOnly: true,
    externalNetworkAllowed: false,
    fixture: MATERIAL_BROWSER_FIXTURE_PATH,
    baseline: MATERIAL_BROWSER_BASELINE_PATH,
    reportPath: MATERIAL_BROWSER_REPORT_PATH,
    matrixCellCount: baseline.matrixCellCount,
    evidencedCellCount: cells.length,
    passedCellCount: cells.length - failures.length,
    failedCellCount: failures.length,
    residualCellCount: chromiumComplete ? 0 : baseline.matrixCellCount - cells.length,
    screenshotCount,
    severeA11yFindingCount: severeA11yFindings.length,
    horizontalOverflowCount: cells.filter((cell) => cell.checks && cell.checks.horizontalOverflow === true).length,
    privateShadowRootAccess: false,
    browserRuns,
    residuals,
    failures,
    baselineErrors: baselineValidation.errors
  };
}

module.exports = {
  MATERIAL_BROWSER_ARTIFACT_ROOT,
  MATERIAL_BROWSER_BASELINE_PATH,
  MATERIAL_BROWSER_BASELINE_SCHEMA,
  MATERIAL_BROWSER_DIMENSIONS,
  MATERIAL_BROWSER_EVIDENCE_SCHEMA,
  MATERIAL_BROWSER_FIXTURE_PATH,
  MATERIAL_BROWSER_FIXTURE_SCHEMA,
  MATERIAL_BROWSER_LOCAL_GATE,
  MATERIAL_BROWSER_POLICY_PATH,
  MATERIAL_BROWSER_REPORT_PATH,
  MATERIAL_BROWSER_RESULT_ID,
  createMaterialBrowserBaseline,
  createMaterialBrowserEvidenceReport,
  createMaterialBrowserMatrix,
  validateMaterialBrowserBaseline
};
