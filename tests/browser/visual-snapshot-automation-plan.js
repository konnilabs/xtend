const {
  COMPONENT_SHELL_THEME_MATRIX_DENSITIES,
  COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES,
  COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS,
  COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS,
  COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE,
  createComponentShellThemeMatrixPlan
} = require('./component-shell-theme-matrix-plan');
const {
  COMPONENT_REGRESSION_PRIORITY_SCHEMA,
  CORE_THEME_VARIANTS,
  CORE_VIEWPORTS,
  createComponentRegressionPriorityPlan
} = require('../../catalog/component-regression-priority');

const VISUAL_SNAPSHOT_AUTOMATION_SCHEMA = 'xtend.epic12.visual-snapshot-automation-contract.v1';
const VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA = 'xtend.epic12.visual-snapshot-automation-entry.v1';
const VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA = 'xtend.epic12.visual-snapshot-automation-report.v1';
const VISUAL_SNAPSHOT_AUTOMATION_WORKPACKAGE = 'WP-E12-10';
const VISUAL_SNAPSHOT_AUTOMATION_NEXT_WORKPACKAGE = 'WP-E12-11';
const VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH = 'development/XTend-Visual-Snapshot-Automation-Contract.md';
const VISUAL_SNAPSHOT_AUTOMATION_WP_PATH = 'development/WP-E12-10-Visual-Snapshot-Automation-Contract-definieren.md';
const VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH = 'tests/browser/visual-snapshot-automation-plan.js';
const VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH = 'tests/browser/visual_snapshot_automation_suite.js';
const VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE = 'node scripts/run_xtend_tests.js visual-snapshot-automation --json';
const VISUAL_SNAPSHOT_AUTOMATION_PACKAGE_SCRIPT = 'npm run test:visual-snapshot-automation';
const VISUAL_SNAPSHOT_OUTPUT_ROOT = '.xtend-test-results/visual-snapshots';
const VISUAL_SNAPSHOT_BASELINE_ROOT = 'tests/browser/visual-baselines';
const VISUAL_SNAPSHOT_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const VISUAL_SNAPSHOT_SCOPES = Object.freeze([
  'shell-structure',
  'visual-state',
  'theme-token-state',
  'motion-density-state',
  'viewport-layout',
  'focus-a11y-state',
  'rmt-shell-descriptor'
]);

const VISUAL_SNAPSHOT_FAMILY_SCOPES = Object.freeze({
  'form-controls': ['shell-structure', 'visual-state', 'theme-token-state', 'viewport-layout', 'focus-a11y-state'],
  'feedback-status': ['shell-structure', 'visual-state', 'theme-token-state', 'motion-density-state', 'focus-a11y-state'],
  'navigation-routing': ['shell-structure', 'visual-state', 'theme-token-state', 'viewport-layout', 'rmt-shell-descriptor'],
  'overlay-interaction': ['shell-structure', 'visual-state', 'motion-density-state', 'viewport-layout', 'focus-a11y-state'],
  'layout-display-media': ['shell-structure', 'visual-state', 'theme-token-state', 'viewport-layout', 'rmt-shell-descriptor']
});

const VISUAL_SNAPSHOT_DIFF_STRATEGY = Object.freeze({
  schema: 'xtend.epic12.visual-snapshot-diff-strategy.v1',
  mode: 'dom-first-pixel-ready',
  primary: 'dom-structure-and-state-diff',
  secondary: 'pixel-diff-deferred-to-wp-e12-11',
  tolerances: {
    domStructuralChanges: 0,
    cssTokenChanges: 0,
    maxPixelMismatchRatio: 0.01,
    antialiasingTolerance: 0.02,
    layoutShiftPx: 1
  },
  stabilization: [
    'custom-elements-defined',
    'document-fonts-ready',
    'xtend-loader-complete',
    'animation-frame-flushed'
  ]
});

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function createSnapshotEntry(matrixEntry) {
  const scopes = VISUAL_SNAPSHOT_FAMILY_SCOPES[matrixEntry.family] || ['shell-structure', 'visual-state'];

  return {
    schema: VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA,
    id: `${matrixEntry.family}-visual-snapshot`,
    family: matrixEntry.family,
    sourceSchema: COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA,
    sourceMatrixEntry: matrixEntry.id,
    sourceFlow: matrixEntry.sourceFlow,
    components: matrixEntry.components.slice(),
    visualStates: matrixEntry.visualStates.slice(),
    snapshotScopes: scopes.slice(),
    themeVariants: matrixEntry.themeVariants.slice(),
    motionModes: matrixEntry.motionModes.slice(),
    densities: matrixEntry.densities.slice(),
    viewports: matrixEntry.viewports.slice(),
    capturePolicy: {
      mode: 'deterministic-local-fixture',
      shellFirst: true,
      waitFor: VISUAL_SNAPSHOT_DIFF_STRATEGY.stabilization.slice(),
      fixtureState: `${matrixEntry.family}.ready`
    },
    diffStrategy: {
      mode: VISUAL_SNAPSHOT_DIFF_STRATEGY.mode,
      primary: VISUAL_SNAPSHOT_DIFF_STRATEGY.primary,
      secondary: VISUAL_SNAPSHOT_DIFF_STRATEGY.secondary,
      tolerances: { ...VISUAL_SNAPSHOT_DIFF_STRATEGY.tolerances }
    },
    artifacts: {
      baselinePath: `${VISUAL_SNAPSHOT_BASELINE_ROOT}/${matrixEntry.family}`,
      reportPath: `${VISUAL_SNAPSHOT_OUTPUT_ROOT}/${matrixEntry.family}.json`,
      imageOutputPath: `${VISUAL_SNAPSHOT_OUTPUT_ROOT}/${matrixEntry.family}`
    },
    status: 'contract-defined'
  };
}

function countEntryCombinations(entry) {
  return entry.themeVariants.length
    * entry.motionModes.length
    * entry.densities.length
    * entry.viewports.length;
}

function createVisualSnapshotAutomationPlan(options = {}) {
  const sourceThemeMatrix = options.sourceThemeMatrix || createComponentShellThemeMatrixPlan(options);
  const sourceRegressionPriority = options.sourceRegressionPriority || createComponentRegressionPriorityPlan(options);
  const entries = sourceThemeMatrix.entries.map(createSnapshotEntry);

  return {
    schema: VISUAL_SNAPSHOT_AUTOMATION_SCHEMA,
    entrySchema: VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA,
    reportSchema: VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA,
    status: 'accepted-snapshot-contract',
    workpackage: VISUAL_SNAPSHOT_AUTOMATION_WORKPACKAGE,
    contract: VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH,
    workpackageDocument: VISUAL_SNAPSHOT_AUTOMATION_WP_PATH,
    module: VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH,
    suite: VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH,
    localGate: VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE,
    packageScript: VISUAL_SNAPSHOT_AUTOMATION_PACKAGE_SCRIPT,
    sourceThemeMatrix: {
      schema: COMPONENT_SHELL_THEME_MATRIX_SCHEMA,
      reportSchema: COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
      workpackage: COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE,
      combinationCount: sourceThemeMatrix.coverage.matrixCombinationCount,
      flowCount: sourceThemeMatrix.coverage.flowCount,
      componentCount: sourceThemeMatrix.coverage.componentCount
    },
    sourceRegressionPriority: {
      schema: COMPONENT_REGRESSION_PRIORITY_SCHEMA,
      coreThemeVariants: CORE_THEME_VARIANTS.slice(),
      coreViewports: CORE_VIEWPORTS.slice(),
      performanceProfileOpen: sourceRegressionPriority.summary.requiresPerformanceProfile
    },
    renderMode: 'shell-first',
    runnerImplementation: 'deferred-to-WP-E12-11',
    localOnly: true,
    externalNetworkAllowed: false,
    snapshotScopes: VISUAL_SNAPSHOT_SCOPES.slice(),
    themeVariants: COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS.slice(),
    motionModes: COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES.slice(),
    densities: COMPONENT_SHELL_THEME_MATRIX_DENSITIES.slice(),
    viewports: COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS.slice(),
    diffStrategy: {
      ...VISUAL_SNAPSHOT_DIFF_STRATEGY,
      tolerances: { ...VISUAL_SNAPSHOT_DIFF_STRATEGY.tolerances },
      stabilization: VISUAL_SNAPSHOT_DIFF_STRATEGY.stabilization.slice()
    },
    artifactPolicy: {
      outputRoot: VISUAL_SNAPSHOT_OUTPUT_ROOT,
      baselineRoot: VISUAL_SNAPSHOT_BASELINE_ROOT,
      baselineCommitPolicy: 'no-binary-baselines-in-WP-E12-10',
      reportFormat: 'json',
      ciUpload: 'deferred-to-WP-E12-11',
      retainOnFailure: true
    },
    entries,
    coverage: {
      entryCount: entries.length,
      familyCount: unique(entries.map((entry) => entry.family)).length,
      componentCount: unique(entries.flatMap((entry) => entry.components)).length,
      visualStateCount: unique(entries.flatMap((entry) => entry.visualStates)).length,
      snapshotScopeCount: VISUAL_SNAPSHOT_SCOPES.length,
      matrixCombinationCount: entries.reduce((count, entry) => count + countEntryCombinations(entry), 0)
    },
    gates: [
      'visual-snapshot-automation',
      'component-shell-theme-matrix',
      'regression-priority',
      'component-styling-contract',
      'motion-contrast',
      'references'
    ],
    handoff: {
      nextWorkpackage: VISUAL_SNAPSHOT_AUTOMATION_NEXT_WORKPACKAGE,
      runnerContract: 'xtend.epic12.visual-snapshot-runner.v1',
      fixtureContract: 'xtend.epic12.visual-snapshot-fixture.v1',
      reason: 'WP-E12-11 darf aus diesem Contract lokale Fixture-, DOM-Diff- und Pixel-Diff-Gates implementieren.'
    },
    kernelBoundary: VISUAL_SNAPSHOT_KERNEL_BOUNDARY
  };
}

function validateVisualSnapshotAutomationPlan(plan) {
  const errors = [];
  const entries = plan && Array.isArray(plan.entries) ? plan.entries : [];

  if (!plan || plan.schema !== VISUAL_SNAPSHOT_AUTOMATION_SCHEMA) {
    errors.push('plan schema must be xtend.epic12.visual-snapshot-automation-contract.v1');
  }
  if (!plan || plan.entrySchema !== VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA) {
    errors.push('plan entry schema must be xtend.epic12.visual-snapshot-automation-entry.v1');
  }
  if (!plan || plan.reportSchema !== VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA) {
    errors.push('plan report schema must be xtend.epic12.visual-snapshot-automation-report.v1');
  }
  if (!plan || plan.workpackage !== VISUAL_SNAPSHOT_AUTOMATION_WORKPACKAGE) {
    errors.push('plan workpackage must be WP-E12-10');
  }
  if (!plan || plan.status !== 'accepted-snapshot-contract') {
    errors.push('plan status must be accepted-snapshot-contract');
  }
  if (!plan || plan.runnerImplementation !== 'deferred-to-WP-E12-11') {
    errors.push('runner implementation must be deferred to WP-E12-11');
  }
  if (!plan || plan.localOnly !== true || plan.externalNetworkAllowed !== false) {
    errors.push('visual snapshot automation must be local-only and reject external network dependencies');
  }
  if (!plan || plan.kernelBoundary !== VISUAL_SNAPSHOT_KERNEL_BOUNDARY) {
    errors.push('visual snapshot automation must preserve the RMT kernel boundary');
  }
  if (!plan || !plan.sourceThemeMatrix || plan.sourceThemeMatrix.schema !== COMPONENT_SHELL_THEME_MATRIX_SCHEMA) {
    errors.push('visual snapshot automation must derive from the Component Shell Theme Matrix');
  }
  if (!plan || !plan.sourceRegressionPriority || plan.sourceRegressionPriority.schema !== COMPONENT_REGRESSION_PRIORITY_SCHEMA) {
    errors.push('visual snapshot automation must link the Regression Priority plan');
  }
  if (!plan || !plan.handoff || plan.handoff.nextWorkpackage !== VISUAL_SNAPSHOT_AUTOMATION_NEXT_WORKPACKAGE) {
    errors.push('visual snapshot automation must hand off to WP-E12-11');
  }
  if (!plan || !plan.artifactPolicy || plan.artifactPolicy.outputRoot !== VISUAL_SNAPSHOT_OUTPUT_ROOT) {
    errors.push('visual snapshot automation must use the local visual snapshot output root');
  }
  if (!plan || !plan.diffStrategy || plan.diffStrategy.mode !== 'dom-first-pixel-ready') {
    errors.push('visual snapshot automation must use dom-first-pixel-ready diff strategy');
  }
  if (plan && plan.diffStrategy && plan.diffStrategy.tolerances) {
    const tolerances = plan.diffStrategy.tolerances;
    if (tolerances.domStructuralChanges !== 0 || tolerances.cssTokenChanges !== 0) {
      errors.push('DOM and CSS token diffs must have zero tolerance in the contract');
    }
    if (tolerances.maxPixelMismatchRatio > 0.01) {
      errors.push('pixel mismatch ratio must not exceed 0.01');
    }
    if (tolerances.layoutShiftPx > 1) {
      errors.push('layout shift tolerance must not exceed 1px');
    }
  }

  ['light', 'dark', 'high-contrast', 'forced-colors'].forEach((theme) => {
    if (!plan || !plan.themeVariants.includes(theme)) {
      errors.push(`visual snapshot automation must include ${theme}`);
    }
  });
  ['default-motion', 'reduced-motion'].forEach((mode) => {
    if (!plan || !plan.motionModes.includes(mode)) {
      errors.push(`visual snapshot automation must include ${mode}`);
    }
  });
  ['comfortable', 'compact', 'dense'].forEach((density) => {
    if (!plan || !plan.densities.includes(density)) {
      errors.push(`visual snapshot automation must include ${density} density`);
    }
  });
  ['desktop-1280', 'tablet-768', 'mobile-390'].forEach((viewport) => {
    if (!plan || !plan.viewports.includes(viewport)) {
      errors.push(`visual snapshot automation must include ${viewport}`);
    }
  });
  VISUAL_SNAPSHOT_SCOPES.forEach((scope) => {
    if (!plan || !plan.snapshotScopes.includes(scope)) {
      errors.push(`visual snapshot automation must include scope ${scope}`);
    }
  });

  if (entries.length !== 5) {
    errors.push('visual snapshot automation must expose five family snapshot entries');
  }
  if (!plan || !plan.coverage || plan.coverage.matrixCombinationCount !== 360) {
    errors.push('visual snapshot automation must preserve the 360 matrix combinations from the theme matrix');
  }

  entries.forEach((entry) => {
    if (entry.schema !== VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA) {
      errors.push(`${entry.id || '<unknown>'}: entry schema must be xtend.epic12.visual-snapshot-automation-entry.v1`);
    }
    if (entry.sourceSchema !== COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA) {
      errors.push(`${entry.id}: entry must link the Component Shell Theme Matrix entry schema`);
    }
    if (!Array.isArray(entry.components) || entry.components.length < 2) {
      errors.push(`${entry.id}: entry must cover at least two components`);
    }
    if (!Array.isArray(entry.visualStates) || entry.visualStates.length < 3) {
      errors.push(`${entry.id}: entry must preserve at least three visual states`);
    }
    if (!Array.isArray(entry.snapshotScopes) || entry.snapshotScopes.length < 4) {
      errors.push(`${entry.id}: entry must expose at least four snapshot scopes`);
    }
    if (!entry.capturePolicy || entry.capturePolicy.mode !== 'deterministic-local-fixture') {
      errors.push(`${entry.id}: entry must use deterministic local fixture capture`);
    }
    if (!entry.diffStrategy || entry.diffStrategy.mode !== VISUAL_SNAPSHOT_DIFF_STRATEGY.mode) {
      errors.push(`${entry.id}: entry diff strategy must match plan strategy`);
    }
    if (!entry.artifacts || !entry.artifacts.reportPath.startsWith(VISUAL_SNAPSHOT_OUTPUT_ROOT)) {
      errors.push(`${entry.id}: entry report path must use the visual snapshot output root`);
    }
  });

  return {
    schema: VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createVisualSnapshotAutomationGate(options = {}) {
  const plan = options.plan || createVisualSnapshotAutomationPlan(options);
  const validation = validateVisualSnapshotAutomationPlan(plan);

  return {
    schema: VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings: []
  };
}

module.exports = {
  VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH,
  VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA,
  VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE,
  VISUAL_SNAPSHOT_AUTOMATION_NEXT_WORKPACKAGE,
  VISUAL_SNAPSHOT_AUTOMATION_PACKAGE_SCRIPT,
  VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH,
  VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA,
  VISUAL_SNAPSHOT_AUTOMATION_SCHEMA,
  VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH,
  VISUAL_SNAPSHOT_AUTOMATION_WORKPACKAGE,
  VISUAL_SNAPSHOT_AUTOMATION_WP_PATH,
  VISUAL_SNAPSHOT_BASELINE_ROOT,
  VISUAL_SNAPSHOT_DIFF_STRATEGY,
  VISUAL_SNAPSHOT_FAMILY_SCOPES,
  VISUAL_SNAPSHOT_KERNEL_BOUNDARY,
  VISUAL_SNAPSHOT_OUTPUT_ROOT,
  VISUAL_SNAPSHOT_SCOPES,
  createVisualSnapshotAutomationGate,
  createVisualSnapshotAutomationPlan,
  validateVisualSnapshotAutomationPlan
};
