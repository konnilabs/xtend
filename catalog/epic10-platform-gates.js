const {
  EXPECTED_COMPONENT_ORDER
} = require('./epic10-p0-component-wave');
const {
  TARGET_COMPONENTS,
  createExistingComponentMetadataPlan
} = require('./epic10-existing-component-metadata');
const {
  CORE_THEME_VARIANTS,
  CORE_VIEWPORTS,
  createComponentRegressionPriorityPlan
} = require('./component-regression-priority');

const EPIC10_PLATFORM_GATES_SCHEMA = 'xtend.epic10.platform-gates.v1';
const EPIC10_PLATFORM_GATE_RECORD_SCHEMA = 'xtend.epic10.platform-gate.record.v1';
const EPIC10_PLATFORM_GATES_REPORT_SCHEMA = 'xtend.epic10.platform-gates-report.v1';
const EPIC10_PLATFORM_GATES_WORKPACKAGE = 'WP-E10-15';
const EPIC10_PLATFORM_GATES_STATUS = 'accepted-gate-chain';
const EPIC10_PLATFORM_GATES_DOC = 'development/XTend-Epic10-Platform-Gates.md';
const EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC = 'development/WP-E10-15-Browser-A11y-Performance-und-Visual-Gates-erweitern.md';
const EPIC10_PLATFORM_GATES_DEVELOPER_DOCS = 'docs/epic10-platform-gates.md';
const EPIC10_PLATFORM_GATES_SUITE = 'tests/platform/epic10_platform_gates_suite.js';
const EPIC10_PLATFORM_GATES_MODULE = 'catalog/epic10-platform-gates.js';
const EPIC10_PLATFORM_GATES_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic10-platform-gates --json';
const EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT = 'npm run test:epic10-platform-gates';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const REQUIRED_GATE_DOMAINS = Object.freeze([
  'component-contract',
  'rmt-first-app',
  'browser-smoke',
  'a11y',
  'performance',
  'visual-browser-regression',
  'ci-handoff'
]);

const BROWSER_FIXTURES = Object.freeze([
  'tests/browser/fixtures/custom-elements-smoke.html',
  'tests/browser/fixtures/core-flows-smoke.html',
  'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html',
  'tests/browser/fixtures/rmt-first-demo-app-smoke.html',
  'tests/browser/fixtures/a11y-focus-keyboard-smoke.html'
]);

const FAST_PR_SUITE_IDS = Object.freeze([
  'component-contract-v2',
  'epic10-p0-component-wave',
  'component-lab-rmt-inspector',
  'rmt-first-demo-app',
  'existing-component-metadata',
  'epic10-release-handoff',
  'browser',
  'a11y-hydration',
  'screenreader-signals',
  'motion-contrast',
  'regression-priority',
  'references'
]);

const RELEASE_SUITE_IDS = Object.freeze([
  ...FAST_PR_SUITE_IDS,
  'components',
  'rmt-first-class-app',
  'rmt-component-fabric-ingestion',
  'rmt-component-lifecycle-telemetry',
  'rmt-compatibility',
  'fabric-performance-measurements',
  'performance-regression',
  'hydration-policy',
  'catalog-coverage',
  'docs-rmt-pilot'
]);

const GATE_DEFINITIONS = Object.freeze([
  {
    id: 'component-contract-v2',
    domain: 'component-contract',
    tier: 'fast-pr',
    source: 'WP-E10-03',
    suiteId: 'component-contract-v2',
    command: 'node scripts/run_xtend_tests.js component-contract-v2 --json',
    packageScript: 'npm run test:component-contract-v2',
    validates: ['xtend.component.contract.v2', 'rmt-metadata', 'fabric-boundary', 'component-maturity'],
    target: 'new-and-migrated-components'
  },
  {
    id: 'existing-component-metadata',
    domain: 'component-contract',
    tier: 'fast-pr',
    source: 'WP-E10-14',
    suiteId: 'existing-component-metadata',
    command: 'node scripts/run_xtend_tests.js existing-component-metadata --json',
    packageScript: 'npm run test:existing-component-metadata',
    validates: ['js-legacy-contract-overlay', 'xtend.rmt.component-contract.v1', 'xtend.component.fabric-boundary.v2'],
    target: 'prioritized-existing-components'
  },
  {
    id: 'rmt-first-demo-app',
    domain: 'rmt-first-app',
    tier: 'fast-pr',
    source: 'WP-E10-13',
    suiteId: 'rmt-first-demo-app',
    command: 'node scripts/run_xtend_tests.js rmt-first-demo-app --json',
    packageScript: 'npm run test:rmt-first-demo-app',
    validates: ['shell-first-rendering', 'no-manual-shell', 'rmt-owned-templates', 'rmt-owned-routes'],
    target: 'rmt-first-demo-app'
  },
  {
    id: 'browser-smoke',
    domain: 'browser-smoke',
    tier: 'fast-pr',
    source: 'ER-WP-24/WP-E10-13',
    suiteId: 'browser',
    command: 'node scripts/run_xtend_tests.js browser --json',
    packageScript: 'npm run test:browser',
    validates: ['local-loader', 'rmt-xrouter-smoke', 'rmt-first-demo-smoke', 'a11y-keyboard-smoke'],
    target: 'browser-near-fixtures'
  },
  {
    id: 'a11y-hydration',
    domain: 'a11y',
    tier: 'fast-pr',
    source: 'ER-WP-24/ER-WP-25/ER-WP-26',
    suiteId: 'a11y-hydration',
    command: 'node scripts/run_xtend_tests.js a11y-hydration --json',
    packageScript: 'npm run test:a11y',
    validates: ['labels', 'keyboard', 'focus-visible', 'hydration-safe-a11y'],
    target: 'interactive-components'
  },
  {
    id: 'screenreader-signals',
    domain: 'a11y',
    tier: 'fast-pr',
    source: 'ER-WP-25',
    suiteId: 'screenreader-signals',
    command: 'node scripts/run_xtend_tests.js screenreader-signals --json',
    packageScript: 'npm run test:screenreader-signals',
    validates: ['aria-live', 'status-region', 'error-region', 'announcement-policy'],
    target: 'feedback-and-form-components'
  },
  {
    id: 'motion-contrast',
    domain: 'a11y',
    tier: 'fast-pr',
    source: 'ER-WP-26',
    suiteId: 'motion-contrast',
    command: 'node scripts/run_xtend_tests.js motion-contrast --json',
    packageScript: 'npm run test:motion-contrast',
    validates: ['reduced-motion', 'forced-colors', 'non-color-status'],
    target: 'visual-and-overlay-components'
  },
  {
    id: 'performance-regression',
    domain: 'performance',
    tier: 'release',
    source: 'ER-WP-19',
    suiteId: 'performance-regression',
    command: 'node scripts/run_xtend_tests.js performance-regression --json',
    packageScript: 'npm run test:performance',
    validates: ['deterministic-baseline', 'budget-matrix', 'fabric-measurement-input'],
    target: 'performance-critical-components'
  },
  {
    id: 'fabric-performance-measurements',
    domain: 'performance',
    tier: 'release',
    source: 'ER-WP-18',
    suiteId: 'fabric-performance-measurements',
    command: 'node scripts/run_xtend_tests.js fabric-performance-measurements --json',
    packageScript: 'npm run test:fabric-performance',
    validates: ['loader-measurements', 'hydration-measurements', 'route-render-measurements'],
    target: 'fabric-telemetry-snapshots'
  },
  {
    id: 'hydration-policy',
    domain: 'performance',
    tier: 'release',
    source: 'ER-WP-20',
    suiteId: 'hydration-policy',
    command: 'node scripts/run_xtend_tests.js hydration-policy --json',
    packageScript: 'npm run test:hydration-policy',
    validates: ['visible-hydration', 'idle-hydration', 'lazy-hydration', 'rmt-schedule-delegation'],
    target: 'component-hydration-policies'
  },
  {
    id: 'visual-browser-regression',
    domain: 'visual-browser-regression',
    tier: 'fast-pr',
    source: 'ER-WP-35',
    suiteId: 'regression-priority',
    command: 'node scripts/run_xtend_tests.js regression-priority --json',
    packageScript: 'npm run test:regression-priority',
    validates: ['desktop-mobile-viewports', 'theme-variants', 'browser-smoke-priority', 'visual-state-priority'],
    target: 'all-manifest-components'
  },
  {
    id: 'ci-handoff',
    domain: 'ci-handoff',
    tier: 'fast-pr',
    source: 'WP-E10-15',
    suiteId: 'epic10-platform-gates',
    command: EPIC10_PLATFORM_GATES_LOCAL_GATE,
    packageScript: EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT,
    validates: ['fast-pr-suite-list', 'release-suite-list', 'package-metadata', 'reference-docs'],
    target: 'epic10-release-readiness'
  }
]);

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function createGateRecord(definition) {
  return {
    schema: EPIC10_PLATFORM_GATE_RECORD_SCHEMA,
    ...definition
  };
}

function summarizeGates(gates) {
  return gates.reduce((summary, gate) => {
    summary.byDomain[gate.domain] = (summary.byDomain[gate.domain] || 0) + 1;
    summary.byTier[gate.tier] = (summary.byTier[gate.tier] || 0) + 1;
    return summary;
  }, {
    gateCount: gates.length,
    byDomain: {},
    byTier: {}
  });
}

function createEpic10PlatformGatePlan(options = {}) {
  const existingMetadata = options.existingMetadata || createExistingComponentMetadataPlan();
  const regressionPriority = options.regressionPriority || createComponentRegressionPriorityPlan(options);
  const gates = GATE_DEFINITIONS.map(createGateRecord);
  const prioritizedRegressionTargets = unique([
    ...EXPECTED_COMPONENT_ORDER,
    ...TARGET_COMPONENTS
  ]);

  return {
    schema: EPIC10_PLATFORM_GATES_SCHEMA,
    reportSchema: EPIC10_PLATFORM_GATES_REPORT_SCHEMA,
    gateRecordSchema: EPIC10_PLATFORM_GATE_RECORD_SCHEMA,
    workpackage: EPIC10_PLATFORM_GATES_WORKPACKAGE,
    status: EPIC10_PLATFORM_GATES_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    kernelBoundary: KERNEL_BOUNDARY,
    contract: EPIC10_PLATFORM_GATES_DOC,
    workpackageDocument: EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC,
    docs: EPIC10_PLATFORM_GATES_DEVELOPER_DOCS,
    module: EPIC10_PLATFORM_GATES_MODULE,
    suite: EPIC10_PLATFORM_GATES_SUITE,
    localGate: EPIC10_PLATFORM_GATES_LOCAL_GATE,
    packageScript: EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT,
    requiredDomains: REQUIRED_GATE_DOMAINS.slice(),
    gates,
    browser: {
      fixtures: BROWSER_FIXTURES.slice(),
      requiredResultKeys: [
        '__xtendBrowserSmokeResult',
        '__xtendCoreSmokeResult',
        '__xtendRmtBrowserSmokeResult',
        '__xtendRmtFirstDemoSmokeResult',
        '__xtendA11yKeyboardSmokeResult'
      ],
      localOnly: true,
      cdnAllowed: false
    },
    a11y: {
      suites: ['a11y-hydration', 'screenreader-signals', 'motion-contrast'],
      requiredSignals: ['keyboard', 'aria-live', 'focus-visible', 'forced-colors', 'reduced-motion'],
      lane: 'a11y'
    },
    performance: {
      suites: ['fabric-performance-measurements', 'performance-regression', 'hydration-policy'],
      requiredContracts: [
        'xtend.performance.measurement.v1',
        'xtend.performance.regression-report.v1',
        'xtend.fabric.hydration-policy.v1'
      ],
      releaseOnlyInFastPr: true
    },
    visualRegression: {
      sourceSchema: regressionPriority.schema,
      componentCount: regressionPriority.summary.componentCount,
      viewports: CORE_VIEWPORTS.slice(),
      themeVariants: CORE_THEME_VARIANTS.slice(),
      prioritizedTargets: prioritizedRegressionTargets,
      requiredGate: 'regression-priority'
    },
    componentTargets: {
      typescriptFirst: EXPECTED_COMPONENT_ORDER.slice(),
      existingMetadata: existingMetadata.targetComponents.slice()
    },
    ci: {
      fastPr: {
        suiteIds: FAST_PR_SUITE_IDS.slice(),
        command: `node scripts/run_xtend_tests.js ${FAST_PR_SUITE_IDS.join(' ')} --json`,
        excludesReleaseOnlyPerformance: true
      },
      release: {
        suiteIds: RELEASE_SUITE_IDS.slice(),
        command: 'node scripts/run_xtend_tests.js --json',
        packageScript: 'npm run test:release:full'
      },
      handoff: 'WP-E10-16'
    },
    summary: summarizeGates(gates)
  };
}

function validateEpic10PlatformGatePlan(plan) {
  const errors = [];
  if (!plan || plan.schema !== EPIC10_PLATFORM_GATES_SCHEMA) {
    errors.push(`plan schema must be ${EPIC10_PLATFORM_GATES_SCHEMA}`);
  }
  if (!plan || plan.status !== EPIC10_PLATFORM_GATES_STATUS) {
    errors.push(`plan status must be ${EPIC10_PLATFORM_GATES_STATUS}`);
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push(`plan must keep ${KERNEL_BOUNDARY}`);
  }
  if (!plan || !Array.isArray(plan.gates) || plan.gates.length !== GATE_DEFINITIONS.length) {
    errors.push('plan must expose all Epic 10 platform gate records');
  }

  const domains = new Set((plan && plan.gates || []).map((gate) => gate.domain));
  REQUIRED_GATE_DOMAINS.forEach((domain) => {
    if (!domains.has(domain)) {
      errors.push(`missing gate domain ${domain}`);
    }
  });

  (plan && plan.gates || []).forEach((gate) => {
    if (gate.schema !== EPIC10_PLATFORM_GATE_RECORD_SCHEMA) {
      errors.push(`${gate.id || '<unknown>'}: gate record schema must be ${EPIC10_PLATFORM_GATE_RECORD_SCHEMA}`);
    }
    if (!gate.suiteId || !gate.command || !gate.packageScript) {
      errors.push(`${gate.id || '<unknown>'}: gate must expose suiteId, command and packageScript`);
    }
    if (!Array.isArray(gate.validates) || gate.validates.length === 0) {
      errors.push(`${gate.id || '<unknown>'}: gate must declare validation targets`);
    }
  });

  if (!plan || !plan.browser || !plan.browser.fixtures.includes('tests/browser/fixtures/rmt-first-demo-app-smoke.html')) {
    errors.push('browser gates must include the RMT-first demo smoke fixture');
  }
  if (!plan || !plan.browser || !plan.browser.fixtures.includes('tests/browser/fixtures/a11y-focus-keyboard-smoke.html')) {
    errors.push('browser gates must include the A11y keyboard smoke fixture');
  }
  if (!plan || !plan.visualRegression || !plan.visualRegression.viewports.includes('desktop-1280') || !plan.visualRegression.viewports.includes('mobile-390')) {
    errors.push('visual regression must include desktop and mobile viewports');
  }
  if (!plan || !plan.visualRegression || !plan.visualRegression.themeVariants.includes('forced-colors') || !plan.visualRegression.themeVariants.includes('reduced-motion')) {
    errors.push('visual regression must include forced-colors and reduced-motion variants');
  }
  if (!plan || !plan.componentTargets || plan.componentTargets.typescriptFirst.length !== EXPECTED_COMPONENT_ORDER.length) {
    errors.push('all TypeScript-first Epic 10 targets must be included');
  }
  if (!plan || !plan.componentTargets || plan.componentTargets.existingMetadata.length !== TARGET_COMPONENTS.length) {
    errors.push('all existing metadata targets must be included');
  }
  if (!plan || !plan.ci || !plan.ci.fastPr.suiteIds.includes('browser') || !plan.ci.fastPr.suiteIds.includes('existing-component-metadata')) {
    errors.push('fast PR gate must include browser and existing-component-metadata suites');
  }
  if (!plan || !plan.ci || plan.ci.fastPr.suiteIds.includes('performance-regression')) {
    errors.push('fast PR gate must keep performance-regression release-only');
  }
  if (!plan || !plan.ci || !plan.ci.release.suiteIds.includes('performance-regression') || !plan.ci.release.suiteIds.includes('fabric-performance-measurements')) {
    errors.push('release gate must include performance regression and Fabric measurements');
  }

  return {
    schema: EPIC10_PLATFORM_GATES_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic10PlatformGateReport(options = {}) {
  const plan = options.plan || createEpic10PlatformGatePlan(options);
  const validation = validateEpic10PlatformGatePlan(plan);
  const releaseOnlyPerformance = plan.gates
    .filter((gate) => gate.domain === 'performance')
    .map((gate) => gate.suiteId);

  return {
    schema: EPIC10_PLATFORM_GATES_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    localGate: plan.localGate,
    fastPrSuites: plan.ci.fastPr.suiteIds.slice(),
    releaseSuites: plan.ci.release.suiteIds.slice(),
    releaseOnlyPerformance,
    domains: plan.requiredDomains.slice()
  };
}

module.exports = {
  BROWSER_FIXTURES,
  EPIC10_PLATFORM_GATES_DEVELOPER_DOCS,
  EPIC10_PLATFORM_GATES_DOC,
  EPIC10_PLATFORM_GATES_LOCAL_GATE,
  EPIC10_PLATFORM_GATES_MODULE,
  EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT,
  EPIC10_PLATFORM_GATES_REPORT_SCHEMA,
  EPIC10_PLATFORM_GATES_SCHEMA,
  EPIC10_PLATFORM_GATES_STATUS,
  EPIC10_PLATFORM_GATES_SUITE,
  EPIC10_PLATFORM_GATES_WORKPACKAGE,
  EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC,
  EPIC10_PLATFORM_GATE_RECORD_SCHEMA,
  FAST_PR_SUITE_IDS,
  GATE_DEFINITIONS,
  KERNEL_BOUNDARY,
  RELEASE_SUITE_IDS,
  REQUIRED_GATE_DOMAINS,
  createEpic10PlatformGatePlan,
  createEpic10PlatformGateReport,
  validateEpic10PlatformGatePlan
};
