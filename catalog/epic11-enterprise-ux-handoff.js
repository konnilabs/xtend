const {
  createComponentCatalogCoverageReport
} = require('./component-catalog-coverage');
const {
  createComponentRegressionPriorityPlan
} = require('./component-regression-priority');
const {
  createComponentLongTailMigrationPlan
} = require('./component-long-tail-migration');

const EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA = 'xtend.epic11.enterprise-ux-handoff.v1';
const EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA = 'xtend.epic11.enterprise-ux-handoff-report.v1';
const EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE = 'WP-E11-18';
const EPIC11_ENTERPRISE_UX_HANDOFF_STATUS = 'accepted-enterprise-ux-handoff';
const EPIC11_ENTERPRISE_UX_HANDOFF_MODULE = 'catalog/epic11-enterprise-ux-handoff.js';
const EPIC11_ENTERPRISE_UX_HANDOFF_SUITE = 'tests/platform/epic11_enterprise_ux_handoff_suite.js';
const EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT = 'development/XTend-Epic11-Abschluss-und-Enterprise-UX-Handoff.md';
const EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC = 'development/WP-E11-18-Epic-11-Abschlussreview-und-Enterprise-UX-Handoff.md';
const EPIC11_ENTERPRISE_UX_HANDOFF_DOCS = 'docs/epic11-enterprise-ux-handoff.md';
const EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff --json';
const EPIC11_ENTERPRISE_UX_HANDOFF_PACKAGE_SCRIPT = 'npm run test:epic11-enterprise-ux-handoff';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const COMPLETED_WORKPACKAGES = Object.freeze(Array.from(
  { length: 18 },
  (_, index) => `WP-E11-${String(index + 1).padStart(2, '0')}`
));

const REQUIRED_DOCS = Object.freeze([
  'docs/component-ux-authoring.md',
  'docs/component-ux-app-authoring.md',
  'development/docs-evidence/root/component-ux-gates.md',
  'docs/en/component-long-tail-migration.md',
  EPIC11_ENTERPRISE_UX_HANDOFF_DOCS,
  'development/docs-evidence/root/component-platform.md',
  'docs/rmt-first-xtend-apps.md',
  'docs/enterprise-adoption.md',
  'docs/visual-browser-regression.md'
]);

const REQUIRED_GATES = Object.freeze([
  'component-shell-contract',
  'component-styling-contract',
  'runtime-a11y-contract',
  'component-ux-performance',
  'component-network-contract',
  'rmt-shell-authoring-ux',
  'form-controls-ux',
  'feedback-status-ux',
  'navigation-routing-ux',
  'overlay-interaction-ux',
  'layout-display-media-ux',
  'component-lab-ux-inspector',
  'component-ux-browser-smokes',
  'component-shell-theme-matrix',
  'component-ux-authoring-docs',
  'component-long-tail-migration',
  'catalog-coverage',
  'regression-priority',
  'references',
  'npm test'
]);

const NEXT_WAVE_HANDOFFS = Object.freeze([
  'long-tail-runtime-implementation',
  'visual-snapshot-automation',
  'enterprise-design-system-token-productization',
  'rmt-dsl-authoring-polish',
  'release-candidate-owner-acceptance'
]);

function readCoveragePercent(coverageReport, dimension) {
  return coverageReport.summary.byDimension[dimension]
    ? coverageReport.summary.byDimension[dimension].percent
    : 0;
}

function tagsMissingDimension(coverageReport, dimension) {
  return coverageReport.summary.missingByDimension[dimension]
    ? coverageReport.summary.missingByDimension[dimension].slice()
    : [];
}

function createCatalogSnapshot(coverageReport, longTailPlan) {
  return {
    manifestEntries: coverageReport.summary.manifestEntries,
    enterpriseReady: coverageReport.summary.byStatus['enterprise-ready'] || 0,
    typedContractGated: coverageReport.summary.byStatus['typed-contract-gated'] || 0,
    contractGated: coverageReport.summary.byStatus['contract-gated'] || 0,
    documented: coverageReport.summary.byStatus.documented || 0,
    sourceCoveragePercent: readCoveragePercent(coverageReport, 'source'),
    docsCoveragePercent: readCoveragePercent(coverageReport, 'docs'),
    componentSuiteCoveragePercent: readCoveragePercent(coverageReport, 'componentSuite'),
    fixtureCoveragePercent: readCoveragePercent(coverageReport, 'fixture'),
    typesCoveragePercent: readCoveragePercent(coverageReport, 'types'),
    a11yCoveragePercent: readCoveragePercent(coverageReport, 'a11y'),
    performanceCoveragePercent: readCoveragePercent(coverageReport, 'performance'),
    longTailComponentCount: longTailPlan.summary.componentCount,
    longTailComponents: longTailPlan.entries.map((entry) => entry.tag)
  };
}

function createKpiDecisions(coverageReport, longTailPlan) {
  const performanceResiduals = tagsMissingDimension(coverageReport, 'performance');
  const a11yResiduals = tagsMissingDimension(coverageReport, 'a11y');
  const p0PerformanceResiduals = longTailPlan.entries
    .filter((entry) => entry.priority === 'P0' && entry.missingDimensions.includes('performance'))
    .map((entry) => entry.tag);

  return [
    {
      id: 'p0-component-shell-coverage',
      target: '100-percent',
      status: 'met',
      evidence: ['component-shell-contract', 'component-ux-browser-smokes', 'component-shell-theme-matrix']
    },
    {
      id: 'p0-runtime-a11y-coverage',
      target: '100-percent',
      status: a11yResiduals.length === 0 ? 'met' : 'accepted-handoff',
      residuals: a11yResiduals,
      evidence: ['runtime-a11y-contract', 'screenreader-signals', 'component-ux-browser-smokes']
    },
    {
      id: 'p0-styling-contract-coverage',
      target: '100-percent',
      status: 'met',
      evidence: ['component-styling-contract', 'component-shell-theme-matrix']
    },
    {
      id: 'p0-performance-profile-coverage',
      target: '100-percent',
      status: p0PerformanceResiduals.length === 0 ? 'met' : 'accepted-handoff',
      residuals: p0PerformanceResiduals,
      evidence: ['component-ux-performance', 'component-long-tail-migration', 'regression-priority']
    },
    {
      id: 'p0-browser-ux-smoke-coverage',
      target: '100-percent',
      status: 'met',
      evidence: ['component-ux-browser-smokes', 'browser']
    },
    {
      id: 'p1-component-shell-coverage',
      target: 'at-least-80-percent',
      status: 'met',
      evidence: ['component-shell-contract', 'component-lab-ux-inspector', 'component-shell-theme-matrix']
    },
    {
      id: 'catalog-component-suite-coverage',
      target: 'at-least-85-percent',
      actualPercent: readCoveragePercent(coverageReport, 'componentSuite'),
      status: readCoveragePercent(coverageReport, 'componentSuite') >= 85 ? 'met' : 'failed',
      residuals: tagsMissingDimension(coverageReport, 'componentSuite'),
      evidence: ['catalog-coverage', 'component-long-tail-migration']
    },
    {
      id: 'catalog-fixture-coverage',
      target: 'at-least-85-percent',
      actualPercent: readCoveragePercent(coverageReport, 'fixture'),
      status: readCoveragePercent(coverageReport, 'fixture') >= 85 ? 'met' : 'failed',
      residuals: tagsMissingDimension(coverageReport, 'fixture'),
      evidence: ['catalog-coverage', 'component-long-tail-migration']
    },
    {
      id: 'catalog-types-coverage',
      target: 'at-least-85-percent',
      actualPercent: readCoveragePercent(coverageReport, 'types'),
      status: readCoveragePercent(coverageReport, 'types') >= 85 ? 'met' : 'failed',
      residuals: tagsMissingDimension(coverageReport, 'types'),
      evidence: ['catalog-coverage', 'public-component-types']
    },
    {
      id: 'performance-warning-budget',
      target: 'no-failures-known-warnings-documented',
      status: performanceResiduals.length === 0 ? 'met' : 'accepted-warning',
      residuals: performanceResiduals,
      evidence: ['component-ux-performance', 'performance-regression', 'component-long-tail-migration']
    },
    {
      id: 'rmt-shell-authoring-compatibility',
      target: 'form-feedback-overlay-navigation-covered',
      status: 'met',
      evidence: ['rmt-shell-authoring-ux', 'form-controls-ux', 'feedback-status-ux', 'navigation-routing-ux', 'overlay-interaction-ux']
    }
  ];
}

function summarizeKpis(kpis) {
  return kpis.reduce((summary, kpi) => {
    summary.byStatus[kpi.status] = (summary.byStatus[kpi.status] || 0) + 1;
    if (kpi.status === 'failed') summary.failed += 1;
    if (kpi.status === 'accepted-handoff') summary.acceptedHandoff += 1;
    if (kpi.status === 'accepted-warning') summary.acceptedWarnings += 1;
    if (kpi.status === 'met') summary.met += 1;
    return summary;
  }, {
    kpiCount: kpis.length,
    met: 0,
    acceptedHandoff: 0,
    acceptedWarnings: 0,
    failed: 0,
    byStatus: {}
  });
}

function createEpic11EnterpriseUxHandoffPlan(options = {}) {
  const coverageReport = options.coverageReport || createComponentCatalogCoverageReport(options);
  const regressionPlan = options.regressionPlan || createComponentRegressionPriorityPlan({
    rootDir: options.rootDir,
    coverageReport
  });
  const longTailPlan = options.longTailPlan || createComponentLongTailMigrationPlan({
    rootDir: options.rootDir,
    coverageReport,
    regressionPlan
  });
  const kpis = createKpiDecisions(coverageReport, longTailPlan);

  return {
    schema: EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA,
    reportSchema: EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA,
    workpackage: EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE,
    status: EPIC11_ENTERPRISE_UX_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC11_ENTERPRISE_UX_HANDOFF_MODULE,
    suite: EPIC11_ENTERPRISE_UX_HANDOFF_SUITE,
    contract: EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT,
    workpackageDocument: EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC,
    docs: EPIC11_ENTERPRISE_UX_HANDOFF_DOCS,
    localGate: EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE,
    packageScript: EPIC11_ENTERPRISE_UX_HANDOFF_PACKAGE_SCRIPT,
    kernelBoundary: KERNEL_BOUNDARY,
    sourceSchemas: [
      coverageReport.schema,
      regressionPlan.schema,
      longTailPlan.schema,
      'xtend.epic11.component-ux-authoring-docs.v1',
      'xtend.epic11.component-ux-browser-smokes.v1',
      'xtend.epic11.component-shell-theme-matrix.v1'
    ],
    docsSurface: {
      requiredDocs: REQUIRED_DOCS.slice(),
      authoringDocs: ['docs/component-ux-authoring.md', 'docs/component-ux-app-authoring.md', 'development/docs-evidence/root/component-ux-gates.md'],
      migrationDocs: 'docs/en/component-long-tail-migration.md',
      releaseHandoff: EPIC11_ENTERPRISE_UX_HANDOFF_DOCS
    },
    releaseReadiness: {
      packagePrivate: true,
      publishAllowed: false,
      publishBoundary: 'private-until-release-owner-acceptance',
      fastPrGate: 'npm run test:pr:report',
      releaseGate: 'npm run test:release:full:report',
      requiredGates: REQUIRED_GATES.slice(),
      conditionalBrowserGates: [
        'XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js component-ux-browser-smokes --json',
        'XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js component-shell-theme-matrix --json'
      ]
    },
    epicCompletion: {
      status: 'completed-with-accepted-long-tail-handoff',
      completedWorkpackages: COMPLETED_WORKPACKAGES.slice(),
      closedDecisions: [
        'component-shell-contract',
        'styling-token-part-contract',
        'runtime-a11y-contract',
        'component-performance-profile-contract',
        'component-network-contract',
        'rmt-shell-authoring-component-ux',
        'ux-family-contracts',
        'component-lab-ux-inspector',
        'browser-ux-smoke-matrix',
        'component-shell-theme-matrix',
        'component-ux-authoring-docs',
        'legacy-long-tail-migration-plan',
        'enterprise-ux-handoff'
      ],
      acceptedResiduals: longTailPlan.entries.map((entry) => ({
        tag: entry.tag,
        priority: entry.priority,
        wave: entry.wave,
        targetMaturity: entry.targetMaturity,
        missingDimensions: entry.missingDimensions.slice()
      }))
    },
    catalogSnapshot: createCatalogSnapshot(coverageReport, longTailPlan),
    kpis,
    kpiSummary: summarizeKpis(kpis),
    knownRisks: [
      'x-tabs P0 performance-profile residual is closed by WP-E12-02; browser UX coverage is closed by WP-E12-03',
      'x-theme runtime residual is closed by WP-E12-05; xtend-state and x-utils keep explicit boundary-probe follow-ups',
      'x-button interaction residual is closed by WP-E12-06; x-menu routing interaction residual is closed by WP-E12-07',
      'component-shell-theme-matrix is deterministic contract coverage, not screenshot diff automation',
      'publish remains blocked until release-owner acceptance'
    ],
    nextWaveHandoffs: NEXT_WAVE_HANDOFFS.slice()
  };
}

function validateEpic11EnterpriseUxHandoffPlan(plan) {
  const errors = [];
  if (!plan || plan.schema !== EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA) {
    errors.push(`plan schema must be ${EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA}`);
  }
  if (!plan || plan.reportSchema !== EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA) {
    errors.push(`report schema must be ${EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA}`);
  }
  if (!plan || plan.workpackage !== EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE) {
    errors.push(`plan workpackage must be ${EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE}`);
  }
  if (!plan || plan.status !== EPIC11_ENTERPRISE_UX_HANDOFF_STATUS) {
    errors.push(`plan status must be ${EPIC11_ENTERPRISE_UX_HANDOFF_STATUS}`);
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push(`plan must keep ${KERNEL_BOUNDARY}`);
  }
  if (!plan || !plan.epicCompletion || plan.epicCompletion.completedWorkpackages.length !== 18) {
    errors.push('Epic 11 completion must list all 18 workpackages');
  }
  if (!plan || !plan.epicCompletion.completedWorkpackages.includes('WP-E11-18')) {
    errors.push('Epic 11 completion must include WP-E11-18');
  }
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.docsSurface.requiredDocs.includes(docPath)) {
      errors.push(`required doc missing from handoff surface: ${docPath}`);
    }
  });
  REQUIRED_GATES.forEach((gate) => {
    if (!plan || !plan.releaseReadiness.requiredGates.includes(gate)) {
      errors.push(`required handoff gate missing: ${gate}`);
    }
  });
  if (!plan || plan.releaseReadiness.packagePrivate !== true || plan.releaseReadiness.publishAllowed !== false) {
    errors.push('Epic 11 handoff must keep package private and publishing blocked');
  }
  if (!plan || plan.catalogSnapshot.componentSuiteCoveragePercent < 85) {
    errors.push('component suite coverage must remain at least 85 percent');
  }
  if (!plan || plan.catalogSnapshot.fixtureCoveragePercent < 85) {
    errors.push('fixture coverage must remain at least 85 percent');
  }
  if (!plan || plan.catalogSnapshot.typesCoveragePercent < 85) {
    errors.push('types coverage must remain at least 85 percent');
  }
  if (!plan || plan.catalogSnapshot.longTailComponents.includes('x-tabs')) {
    errors.push('P0 x-tabs residual must be closed after WP-E12-02');
  }
  if (!plan || plan.kpiSummary.failed !== 0) {
    errors.push('KPI summary must not contain failed decisions');
  }
  if (!plan || !plan.kpis.some((kpi) => kpi.id === 'p0-performance-profile-coverage' && kpi.status === 'met')) {
    errors.push('P0 performance residual must be met after WP-E12-02');
  }
  if (!plan || !plan.nextWaveHandoffs.includes('visual-snapshot-automation')) {
    errors.push('visual snapshot automation must remain a next-wave handoff');
  }

  return {
    schema: EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic11EnterpriseUxHandoffReport(options = {}) {
  const plan = options.plan || createEpic11EnterpriseUxHandoffPlan(options);
  const validation = validateEpic11EnterpriseUxHandoffPlan(plan);

  return {
    schema: EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    docsCount: plan.docsSurface.requiredDocs.length,
    gateCount: plan.releaseReadiness.requiredGates.length,
    completedWorkpackageCount: plan.epicCompletion.completedWorkpackages.length,
    catalogSnapshot: plan.catalogSnapshot,
    kpiSummary: plan.kpiSummary,
    nextWaveHandoffs: plan.nextWaveHandoffs.slice()
  };
}

module.exports = {
  COMPLETED_WORKPACKAGES,
  EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT,
  EPIC11_ENTERPRISE_UX_HANDOFF_DOCS,
  EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE,
  EPIC11_ENTERPRISE_UX_HANDOFF_MODULE,
  EPIC11_ENTERPRISE_UX_HANDOFF_PACKAGE_SCRIPT,
  EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA,
  EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA,
  EPIC11_ENTERPRISE_UX_HANDOFF_STATUS,
  EPIC11_ENTERPRISE_UX_HANDOFF_SUITE,
  EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE,
  EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  NEXT_WAVE_HANDOFFS,
  REQUIRED_DOCS,
  REQUIRED_GATES,
  createEpic11EnterpriseUxHandoffPlan,
  createEpic11EnterpriseUxHandoffReport,
  validateEpic11EnterpriseUxHandoffPlan
};
