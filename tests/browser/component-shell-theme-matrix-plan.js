const {
  COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
  COMPONENT_UX_BROWSER_SMOKE_FLOWS,
  COMPONENT_UX_BROWSER_SMOKE_SCHEMA,
  COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE,
  KERNEL_BOUNDARY,
  createComponentUxBrowserSmokePlan
} = require('./component-ux-browser-smoke-plan');
const {
  COMPONENT_REGRESSION_PRIORITY_SCHEMA,
  CORE_THEME_VARIANTS,
  CORE_VIEWPORTS
} = require('../../catalog/component-regression-priority');

const COMPONENT_SHELL_THEME_MATRIX_SCHEMA = 'xtend.epic11.component-shell-theme-matrix.v1';
const COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA = 'xtend.epic11.component-shell-theme-matrix-entry.v1';
const COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA = 'xtend.epic11.component-shell-theme-matrix-report.v1';
const COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE = 'WP-E11-15';
const COMPONENT_SHELL_THEME_MATRIX_NEXT_WORKPACKAGE = 'WP-E11-16';
const COMPONENT_SHELL_THEME_MATRIX_DOC_PATH = 'development/XTend-Epic11-Component-Shell-Visual-Theme-Matrix.md';
const COMPONENT_SHELL_THEME_MATRIX_WP_PATH = 'development/WP-E11-15-Visual-Regression-und-Theme-Matrix-fuer-Component-Shells-aufbauen.md';
const COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH = 'tests/browser/fixtures/epic11-theme-matrix-smoke.html';
const COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH = 'tests/browser/component_shell_theme_matrix_suite.js';
const COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE = 'node scripts/run_xtend_tests.js component-shell-theme-matrix --json';
const COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY = '__xtendEpic11ThemeMatrixResult';
const COMPONENT_SHELL_THEME_MATRIX_CONTRACT_META = COMPONENT_SHELL_THEME_MATRIX_SCHEMA;

const COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS = Object.freeze([
  'light',
  'dark',
  'high-contrast',
  'forced-colors'
]);

const COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES = Object.freeze([
  'default-motion',
  'reduced-motion'
]);

const COMPONENT_SHELL_THEME_MATRIX_DENSITIES = Object.freeze([
  'comfortable',
  'compact',
  'dense'
]);

const COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS = Object.freeze([
  'desktop-1280',
  'tablet-768',
  'mobile-390'
]);

const FAMILY_VISUAL_STATES = Object.freeze({
  'form-controls': ['default', 'focus', 'invalid', 'disabled'],
  'feedback-status': ['info', 'success', 'warning', 'error', 'progress'],
  'navigation-routing': ['initial-route', 'active-route', 'route-announced', 'tab-selected', 'tab-focus-visible'],
  'overlay-interaction': ['closed', 'open', 'focus-trapped', 'reduced-motion-open'],
  'layout-display-media': ['default-layout', 'narrow-layout', 'lazy-media-shell']
});

const FAMILY_REQUIRED_CHECKS = Object.freeze({
  'form-controls': [
    'form controls visual states covered',
    'form controls density tokens covered',
    'form controls invalid state contrast visible'
  ],
  'feedback-status': [
    'feedback status visual states covered',
    'feedback status live region visual shell covered',
    'feedback progress visual shell covered'
  ],
  'navigation-routing': [
    'navigation routing visual states covered',
    'navigation active route contrast visible',
    'navigation route announcement shell visible',
    'navigation tabs aria states covered',
    'navigation tabs keyboard states covered'
  ],
  'overlay-interaction': [
    'overlay interaction visual states covered',
    'overlay focus trap shell visible',
    'overlay reduced motion shell visible'
  ],
  'layout-display-media': [
    'layout display media visual states covered',
    'layout responsive shells covered',
    'layout lazy media shell visible'
  ]
});

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function createMatrixEntry(flow) {
  const visualStates = FAMILY_VISUAL_STATES[flow.family] || ['default'];
  const requiredChecks = FAMILY_REQUIRED_CHECKS[flow.family] || [`${flow.family} visual states covered`];

  return {
    schema: COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA,
    id: `${flow.id}-theme-matrix`,
    family: flow.family,
    sourceFlow: flow.id,
    sourceWorkpackage: COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE,
    sourceFixture: COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
    components: flow.components.slice(),
    verifies: flow.verifies.slice(),
    visualStates: visualStates.slice(),
    themeVariants: COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS.slice(),
    motionModes: COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES.slice(),
    densities: COMPONENT_SHELL_THEME_MATRIX_DENSITIES.slice(),
    viewports: COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS.slice(),
    requiredChecks: requiredChecks.slice(),
    resultKey: COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY,
    status: 'accepted'
  };
}

function countMatrixCombinations(entries) {
  return entries.reduce((count, entry) => (
    count
    + entry.themeVariants.length
      * entry.motionModes.length
      * entry.densities.length
      * entry.viewports.length
  ), 0);
}

function createComponentShellThemeMatrixPlan(options = {}) {
  const sourceBrowserSmokes = options.sourceBrowserSmokes || createComponentUxBrowserSmokePlan(options);
  const sourceFlows = Array.isArray(sourceBrowserSmokes.flows) && sourceBrowserSmokes.flows.length > 0
    ? sourceBrowserSmokes.flows
    : COMPONENT_UX_BROWSER_SMOKE_FLOWS;
  const entries = sourceFlows.map(createMatrixEntry);

  return {
    schema: COMPONENT_SHELL_THEME_MATRIX_SCHEMA,
    entrySchema: COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA,
    reportSchema: COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
    status: 'accepted-theme-matrix',
    workpackage: COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE,
    contract: COMPONENT_SHELL_THEME_MATRIX_DOC_PATH,
    workpackageDocument: COMPONENT_SHELL_THEME_MATRIX_WP_PATH,
    fixture: COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH,
    suite: COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH,
    localGate: COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE,
    resultKey: COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY,
    contractMeta: COMPONENT_SHELL_THEME_MATRIX_CONTRACT_META,
    renderMode: 'shell-first',
    localOnly: true,
    externalNetworkAllowed: false,
    browserHarness: {
      defaultMode: 'self-checking-fixture-contract',
      optionalDriver: 'XTEND_BROWSER_SMOKE_DRIVER=safari',
      suite: 'browser',
      fixturePath: COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH,
      resultKey: COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY
    },
    sourceBrowserSmokes: {
      schema: COMPONENT_UX_BROWSER_SMOKE_SCHEMA,
      workpackage: COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE,
      fixture: COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
      flowCount: sourceBrowserSmokes.coverage && sourceBrowserSmokes.coverage.flowCount
    },
    sourceRegressionPriority: {
      schema: COMPONENT_REGRESSION_PRIORITY_SCHEMA,
      coreThemeVariants: CORE_THEME_VARIANTS.slice(),
      coreViewports: CORE_VIEWPORTS.slice()
    },
    themeVariants: COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS.slice(),
    motionModes: COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES.slice(),
    densities: COMPONENT_SHELL_THEME_MATRIX_DENSITIES.slice(),
    viewports: COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS.slice(),
    entries,
    coverage: {
      flowCount: entries.length,
      familyCount: unique(entries.map((entry) => entry.family)).length,
      componentCount: unique(entries.flatMap((entry) => entry.components)).length,
      themeVariantCount: COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS.length,
      motionModeCount: COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES.length,
      densityCount: COMPONENT_SHELL_THEME_MATRIX_DENSITIES.length,
      viewportCount: COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS.length,
      matrixCombinationCount: countMatrixCombinations(entries)
    },
    gates: [
      'component-shell-theme-matrix',
      'component-ux-browser-smokes',
      'browser',
      'regression-priority',
      'component-styling-contract',
      'motion-contrast',
      'references'
    ],
    handoff: {
      nextWorkpackage: COMPONENT_SHELL_THEME_MATRIX_NEXT_WORKPACKAGE,
      reason: 'Docs und Authoring Guides koennen die akzeptierte Theme-, Motion-, Density- und Viewport-Matrix als UX-Reifevertrag dokumentieren.'
    },
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateComponentShellThemeMatrixPlan(plan) {
  const errors = [];
  const entries = plan && Array.isArray(plan.entries) ? plan.entries : [];
  const themeVariants = plan && Array.isArray(plan.themeVariants) ? plan.themeVariants : [];
  const motionModes = plan && Array.isArray(plan.motionModes) ? plan.motionModes : [];
  const densities = plan && Array.isArray(plan.densities) ? plan.densities : [];
  const viewports = plan && Array.isArray(plan.viewports) ? plan.viewports : [];

  if (!plan || plan.schema !== COMPONENT_SHELL_THEME_MATRIX_SCHEMA) {
    errors.push('plan schema must be xtend.epic11.component-shell-theme-matrix.v1');
  }
  if (!plan || plan.workpackage !== COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE) {
    errors.push('plan workpackage must be WP-E11-15');
  }
  if (!plan || plan.fixture !== COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH) {
    errors.push('plan fixture path must point to the Epic 11 theme matrix fixture');
  }
  if (!plan || plan.resultKey !== COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY) {
    errors.push('plan result key must expose the Epic 11 theme matrix result');
  }
  if (!plan || plan.localOnly !== true || plan.externalNetworkAllowed !== false) {
    errors.push('theme matrix must be local-only and reject external network dependencies');
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('theme matrix must preserve the RMT kernel boundary');
  }
  if (!plan || !plan.sourceBrowserSmokes || plan.sourceBrowserSmokes.schema !== COMPONENT_UX_BROWSER_SMOKE_SCHEMA) {
    errors.push('theme matrix must derive from the WP-E11-14 browser UX smoke plan');
  }
  if (!plan || !plan.sourceRegressionPriority || plan.sourceRegressionPriority.schema !== COMPONENT_REGRESSION_PRIORITY_SCHEMA) {
    errors.push('theme matrix must link the regression priority source plan');
  }
  ['light', 'dark', 'high-contrast', 'forced-colors'].forEach((theme) => {
    if (!themeVariants.includes(theme)) {
      errors.push(`theme matrix must include ${theme}`);
    }
  });
  ['default-motion', 'reduced-motion'].forEach((mode) => {
    if (!motionModes.includes(mode)) {
      errors.push(`theme matrix must include ${mode}`);
    }
  });
  ['comfortable', 'compact', 'dense'].forEach((density) => {
    if (!densities.includes(density)) {
      errors.push(`theme matrix must include ${density} density`);
    }
  });
  CORE_VIEWPORTS.forEach((viewport) => {
    if (!viewports.includes(viewport)) {
      errors.push(`theme matrix must include core viewport ${viewport}`);
    }
  });
  if (!viewports.includes('tablet-768')) {
    errors.push('theme matrix must include tablet-768 viewport');
  }
  if (entries.length !== COMPONENT_UX_BROWSER_SMOKE_FLOWS.length) {
    errors.push('theme matrix must expose five browser-near UX matrix entries');
  }

  Object.keys(FAMILY_VISUAL_STATES).forEach((familyId) => {
    if (!entries.some((entry) => entry.family === familyId)) {
      errors.push(`missing theme matrix entry for family ${familyId}`);
    }
  });

  entries.forEach((entry) => {
    if (entry.schema !== COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA) {
      errors.push(`${entry.id || '<unknown>'}: entry schema must be xtend.epic11.component-shell-theme-matrix-entry.v1`);
    }
    if (!Array.isArray(entry.components) || entry.components.length < 2) {
      errors.push(`${entry.id}: entry must cover at least two components`);
    }
    if (!Array.isArray(entry.visualStates) || entry.visualStates.length < 3) {
      errors.push(`${entry.id}: entry must expose at least three visual states`);
    }
    if (!Array.isArray(entry.requiredChecks) || entry.requiredChecks.length < 3) {
      errors.push(`${entry.id}: entry must expose at least three fixture checks`);
    }
    if (entry.resultKey !== COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY) {
      errors.push(`${entry.id}: entry result key must match fixture result key`);
    }
    if (entry.sourceWorkpackage !== COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE) {
      errors.push(`${entry.id}: entry must link WP-E11-14 as source workpackage`);
    }
    ['light', 'dark', 'high-contrast', 'forced-colors'].forEach((theme) => {
      if (!entry.themeVariants.includes(theme)) {
        errors.push(`${entry.id}: entry must include ${theme}`);
      }
    });
    ['default-motion', 'reduced-motion'].forEach((mode) => {
      if (!entry.motionModes.includes(mode)) {
        errors.push(`${entry.id}: entry must include ${mode}`);
      }
    });
    ['comfortable', 'compact', 'dense'].forEach((density) => {
      if (!entry.densities.includes(density)) {
        errors.push(`${entry.id}: entry must include ${density} density`);
      }
    });
    ['desktop-1280', 'tablet-768', 'mobile-390'].forEach((viewport) => {
      if (!entry.viewports.includes(viewport)) {
        errors.push(`${entry.id}: entry must include ${viewport}`);
      }
    });
  });

  return {
    schema: COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createComponentShellThemeMatrixGate(options = {}) {
  const plan = options.plan || createComponentShellThemeMatrixPlan(options);
  const validation = validateComponentShellThemeMatrixPlan(plan);
  return {
    schema: COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings: []
  };
}

module.exports = {
  COMPONENT_SHELL_THEME_MATRIX_CONTRACT_META,
  COMPONENT_SHELL_THEME_MATRIX_DENSITIES,
  COMPONENT_SHELL_THEME_MATRIX_DOC_PATH,
  COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH,
  COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE,
  COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES,
  COMPONENT_SHELL_THEME_MATRIX_NEXT_WORKPACKAGE,
  COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY,
  COMPONENT_SHELL_THEME_MATRIX_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH,
  COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS,
  COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS,
  COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE,
  COMPONENT_SHELL_THEME_MATRIX_WP_PATH,
  FAMILY_REQUIRED_CHECKS,
  FAMILY_VISUAL_STATES,
  createComponentShellThemeMatrixGate,
  createComponentShellThemeMatrixPlan,
  validateComponentShellThemeMatrixPlan
};
