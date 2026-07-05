const {
  VISUAL_SNAPSHOT_AUTOMATION_SCHEMA,
  VISUAL_SNAPSHOT_DIFF_STRATEGY,
  VISUAL_SNAPSHOT_KERNEL_BOUNDARY,
  VISUAL_SNAPSHOT_OUTPUT_ROOT,
  createVisualSnapshotAutomationPlan
} = require('./visual-snapshot-automation-plan');

const VISUAL_SNAPSHOTS_SCHEMA = 'xtend.epic12.visual-snapshot-runner.v1';
const VISUAL_SNAPSHOTS_FIXTURE_SCHEMA = 'xtend.epic12.visual-snapshot-fixture.v1';
const VISUAL_SNAPSHOTS_RECORD_SCHEMA = 'xtend.epic12.visual-snapshot-record.v1';
const VISUAL_SNAPSHOTS_BASELINE_SCHEMA = 'xtend.epic12.visual-snapshot-dom-baseline.v1';
const VISUAL_SNAPSHOTS_REPORT_SCHEMA = 'xtend.epic12.visual-snapshot-runner-report.v1';
const VISUAL_SNAPSHOTS_WORKPACKAGE = 'WP-E12-11';
const VISUAL_SNAPSHOTS_FIXTURE_PATH = 'tests/browser/fixtures/visual-snapshots-fixture.html';
const VISUAL_SNAPSHOTS_BASELINE_PATH = 'tests/browser/visual-baselines/visual-snapshots.dom-baseline.json';
const VISUAL_SNAPSHOTS_RUNNER_PATH = 'tests/browser/visual-snapshots-runner.js';
const VISUAL_SNAPSHOTS_SUITE_PATH = 'tests/browser/visual_snapshots_suite.js';
const VISUAL_SNAPSHOTS_WP_PATH = 'development/WP-E12-11-Snapshot-Fixture-und-lokalen-Diff-Runner-vorbereiten.md';
const VISUAL_SNAPSHOTS_LOCAL_GATE = 'node scripts/run_xtend_tests.js visual-snapshots --json';
const VISUAL_SNAPSHOTS_PACKAGE_SCRIPT = 'npm run test:visual-snapshots';
const VISUAL_SNAPSHOTS_RESULT_KEY = '__xtendEpic12VisualSnapshotsResult';
const VISUAL_SNAPSHOTS_REPORT_PATH = `${VISUAL_SNAPSHOT_OUTPUT_ROOT}/visual-snapshots-report.json`;
const PRODUCT_TOKEN_KEYS = Object.freeze([
  '--xtend-surface',
  '--xtend-text',
  '--xtend-color-primary',
  '--xtend-density-spacing',
  '--xtend-radius'
]);

const VISUAL_SNAPSHOTS_PIXEL_DIFF = Object.freeze({
  mode: 'optional-local-pixel-diff',
  status: 'not-run-in-node-contract-gate',
  reason: 'WP-E12-11 ships the deterministic DOM diff runner; pixel capture is enabled only when a local browser driver is configured.'
});

const FAMILY_DOM_SIGNATURES = Object.freeze({
  'form-controls': {
    root: 'section[data-snapshot-family="form-controls"]',
    children: ['x-form#snapshot-form', 'x-input#snapshot-input', 'x-select#snapshot-select', 'x-checkbox#snapshot-checkbox', 'x-toggle#snapshot-toggle'],
    requiredAttributes: ['data-theme', 'data-density', 'data-motion', 'data-viewport', 'data-snapshot-family'],
    tokenKeys: PRODUCT_TOKEN_KEYS.slice(),
    ariaSignals: ['aria-label', 'required', 'invalid', 'disabled'],
    rmtDescriptor: false
  },
  'feedback-status': {
    root: 'section[data-snapshot-family="feedback-status"]',
    children: ['x-alert#snapshot-alert', 'x-toast#snapshot-toast', 'x-status#snapshot-status', 'x-progress#snapshot-progress'],
    requiredAttributes: ['data-theme', 'data-density', 'data-motion', 'data-viewport', 'data-snapshot-family'],
    tokenKeys: PRODUCT_TOKEN_KEYS.slice(),
    ariaSignals: ['role=status', 'aria-live', 'role=progressbar'],
    rmtDescriptor: false
  },
  'navigation-routing': {
    root: 'section[data-snapshot-family="navigation-routing"]',
    children: ['x-link#snapshot-link', 'x-router#snapshot-router', 'x-tabs#snapshot-tabs'],
    requiredAttributes: ['data-theme', 'data-density', 'data-motion', 'data-viewport', 'data-snapshot-family', 'data-rmt-shell-descriptor'],
    tokenKeys: PRODUCT_TOKEN_KEYS.slice(),
    ariaSignals: ['aria-current', 'role=tablist', 'aria-controls', 'aria-selected'],
    rmtDescriptor: true
  },
  'overlay-interaction': {
    root: 'section[data-snapshot-family="overlay-interaction"]',
    children: ['x-modal#snapshot-modal', 'x-drawer#snapshot-drawer'],
    requiredAttributes: ['data-theme', 'data-density', 'data-motion', 'data-viewport', 'data-snapshot-family'],
    tokenKeys: PRODUCT_TOKEN_KEYS.slice(),
    ariaSignals: ['role=dialog', 'aria-modal', 'focus-trap', 'escape-close'],
    rmtDescriptor: false
  },
  'layout-display-media': {
    root: 'section[data-snapshot-family="layout-display-media"]',
    children: ['x-section#snapshot-section', 'x-cards#snapshot-cards', 'x-code#snapshot-code', 'x-player#snapshot-player'],
    requiredAttributes: ['data-theme', 'data-density', 'data-motion', 'data-viewport', 'data-snapshot-family', 'data-rmt-shell-descriptor'],
    tokenKeys: PRODUCT_TOKEN_KEYS.slice(),
    ariaSignals: ['region', 'lazy-media-shell', 'code-block'],
    rmtDescriptor: true
  }
});

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function toComparable(value) {
  if (Array.isArray(value)) return value.map(toComparable);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = toComparable(value[key]);
    return result;
  }, {});
}

function sameValue(actual, expected) {
  return JSON.stringify(toComparable(actual)) === JSON.stringify(toComparable(expected));
}

function createVisualSnapshotRecord(entry) {
  return {
    schema: VISUAL_SNAPSHOTS_RECORD_SCHEMA,
    id: entry.id,
    family: entry.family,
    sourceAutomationEntry: entry.id,
    sourceMatrixEntry: entry.sourceMatrixEntry,
    components: entry.components.slice(),
    visualStates: entry.visualStates.slice(),
    snapshotScopes: entry.snapshotScopes.slice(),
    dimensions: {
      themeVariants: entry.themeVariants.slice(),
      motionModes: entry.motionModes.slice(),
      densities: entry.densities.slice(),
      viewports: entry.viewports.slice()
    },
    domSignature: FAMILY_DOM_SIGNATURES[entry.family],
    capturePolicy: {
      mode: 'deterministic-local-fixture',
      fixture: VISUAL_SNAPSHOTS_FIXTURE_PATH,
      waitFor: VISUAL_SNAPSHOT_DIFF_STRATEGY.stabilization.slice()
    },
    diff: {
      primary: 'dom-structure-and-state-diff',
      pixel: { ...VISUAL_SNAPSHOTS_PIXEL_DIFF }
    }
  };
}

function createVisualSnapshotRecords(options = {}) {
  const automationPlan = options.automationPlan || createVisualSnapshotAutomationPlan(options);
  return automationPlan.entries.map(createVisualSnapshotRecord);
}

function createVisualSnapshotsBaseline(options = {}) {
  const records = options.records || createVisualSnapshotRecords(options);
  return {
    schema: VISUAL_SNAPSHOTS_BASELINE_SCHEMA,
    sourceAutomationContract: VISUAL_SNAPSHOT_AUTOMATION_SCHEMA,
    workpackage: VISUAL_SNAPSHOTS_WORKPACKAGE,
    baselineType: 'dom-structure-json',
    binaryBaselines: false,
    snapshotCount: records.length,
    matrixCombinationCount: records.reduce((count, record) => (
      count
      + record.dimensions.themeVariants.length
      * record.dimensions.motionModes.length
      * record.dimensions.densities.length
      * record.dimensions.viewports.length
    ), 0),
    records
  };
}

function diffSnapshotRecord(actual, expected) {
  const diffs = [];
  const fields = [
    'schema',
    'id',
    'family',
    'sourceAutomationEntry',
    'sourceMatrixEntry',
    'components',
    'visualStates',
    'snapshotScopes',
    'dimensions',
    'domSignature'
  ];

  fields.forEach((field) => {
    if (!sameValue(actual[field], expected[field])) {
      diffs.push({
        record: actual.id || expected.id,
        field,
        actual: actual[field],
        expected: expected[field]
      });
    }
  });

  return diffs;
}

function createVisualSnapshotsRun(options = {}) {
  const automationPlan = options.automationPlan || createVisualSnapshotAutomationPlan(options);
  const actualRecords = createVisualSnapshotRecords({ ...options, automationPlan });
  const baseline = options.baseline || createVisualSnapshotsBaseline({ ...options, records: actualRecords });
  const expectedById = new Map((baseline.records || []).map((record) => [record.id, record]));
  const diffs = [];

  actualRecords.forEach((record) => {
    const expected = expectedById.get(record.id);
    if (!expected) {
      diffs.push({ record: record.id, field: 'record', actual: 'present', expected: 'missing' });
      return;
    }
    diffs.push(...diffSnapshotRecord(record, expected));
  });

  (baseline.records || []).forEach((record) => {
    if (!actualRecords.some((candidate) => candidate.id === record.id)) {
      diffs.push({ record: record.id, field: 'record', actual: 'missing', expected: 'present' });
    }
  });

  return {
    schema: VISUAL_SNAPSHOTS_REPORT_SCHEMA,
    runnerSchema: VISUAL_SNAPSHOTS_SCHEMA,
    fixtureSchema: VISUAL_SNAPSHOTS_FIXTURE_SCHEMA,
    sourceAutomationContract: VISUAL_SNAPSHOT_AUTOMATION_SCHEMA,
    sourceAutomationWorkpackage: 'WP-E12-10',
    workpackage: VISUAL_SNAPSHOTS_WORKPACKAGE,
    status: diffs.length === 0 ? 'passed' : 'failed',
    ok: diffs.length === 0,
    localOnly: true,
    externalNetworkAllowed: false,
    kernelBoundary: VISUAL_SNAPSHOT_KERNEL_BOUNDARY,
    fixture: VISUAL_SNAPSHOTS_FIXTURE_PATH,
    baseline: VISUAL_SNAPSHOTS_BASELINE_PATH,
    reportPath: VISUAL_SNAPSHOTS_REPORT_PATH,
    snapshotCount: actualRecords.length,
    familyCount: unique(actualRecords.map((record) => record.family)).length,
    componentCount: unique(actualRecords.flatMap((record) => record.components)).length,
    matrixCombinationCount: automationPlan.coverage.matrixCombinationCount,
    domDiffCount: diffs.length,
    pixelDiff: { ...VISUAL_SNAPSHOTS_PIXEL_DIFF },
    snapshots: actualRecords,
    diffs,
    gates: [
      'visual-snapshots',
      'visual-snapshot-automation',
      'component-shell-theme-matrix',
      'references'
    ]
  };
}

function validateVisualSnapshotsRun(report) {
  const errors = [];

  if (!report || report.schema !== VISUAL_SNAPSHOTS_REPORT_SCHEMA) {
    errors.push('visual snapshot report schema must be xtend.epic12.visual-snapshot-runner-report.v1');
  }
  if (!report || report.runnerSchema !== VISUAL_SNAPSHOTS_SCHEMA) {
    errors.push('visual snapshot runner schema must be xtend.epic12.visual-snapshot-runner.v1');
  }
  if (!report || report.fixtureSchema !== VISUAL_SNAPSHOTS_FIXTURE_SCHEMA) {
    errors.push('visual snapshot fixture schema must be xtend.epic12.visual-snapshot-fixture.v1');
  }
  if (!report || report.sourceAutomationContract !== VISUAL_SNAPSHOT_AUTOMATION_SCHEMA) {
    errors.push('visual snapshot runner must derive from WP-E12-10 automation contract');
  }
  if (!report || report.snapshotCount !== 5 || report.familyCount !== 5) {
    errors.push('visual snapshot runner must cover five family snapshots');
  }
  if (!report || report.componentCount !== 18) {
    errors.push('visual snapshot runner must cover eighteen representative components');
  }
  if (!report || report.matrixCombinationCount !== 360) {
    errors.push('visual snapshot runner must preserve 360 matrix combinations');
  }
  if (!report || report.domDiffCount !== 0 || report.ok !== true) {
    errors.push('visual snapshot DOM diff must pass without differences');
  }
  if (!report || !report.pixelDiff || report.pixelDiff.mode !== VISUAL_SNAPSHOTS_PIXEL_DIFF.mode) {
    errors.push('visual snapshot runner must expose optional local pixel-diff mode');
  }
  if (!report || report.localOnly !== true || report.externalNetworkAllowed !== false) {
    errors.push('visual snapshot runner must stay local-only and reject external network dependencies');
  }
  if (!report || report.kernelBoundary !== VISUAL_SNAPSHOT_KERNEL_BOUNDARY) {
    errors.push('visual snapshot runner must keep the RMT kernel boundary');
  }

  return {
    schema: VISUAL_SNAPSHOTS_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  FAMILY_DOM_SIGNATURES,
  VISUAL_SNAPSHOTS_BASELINE_PATH,
  VISUAL_SNAPSHOTS_BASELINE_SCHEMA,
  VISUAL_SNAPSHOTS_FIXTURE_PATH,
  VISUAL_SNAPSHOTS_FIXTURE_SCHEMA,
  VISUAL_SNAPSHOTS_LOCAL_GATE,
  VISUAL_SNAPSHOTS_PACKAGE_SCRIPT,
  VISUAL_SNAPSHOTS_RECORD_SCHEMA,
  VISUAL_SNAPSHOTS_REPORT_PATH,
  VISUAL_SNAPSHOTS_REPORT_SCHEMA,
  VISUAL_SNAPSHOTS_RESULT_KEY,
  VISUAL_SNAPSHOTS_RUNNER_PATH,
  VISUAL_SNAPSHOTS_SCHEMA,
  VISUAL_SNAPSHOTS_SUITE_PATH,
  VISUAL_SNAPSHOTS_WORKPACKAGE,
  VISUAL_SNAPSHOTS_WP_PATH,
  createVisualSnapshotRecord,
  createVisualSnapshotRecords,
  createVisualSnapshotsBaseline,
  createVisualSnapshotsRun,
  validateVisualSnapshotsRun
};
