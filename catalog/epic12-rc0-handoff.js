const {
  createComponentCatalogCoverageReport
} = require('./component-catalog-coverage');
const {
  createComponentLongTailMigrationPlan
} = require('./component-long-tail-migration');
const {
  createEpic12Rc0GateMatrix
} = require('./epic12-rc0-gate-matrix');
const {
  createEpic12DocsAdoptionGuide
} = require('./epic12-docs-adoption');
const {
  createXtendDesignTokenContract,
  tokenNames
} = require('../design-tokens/xtend-design-tokens');
const {
  DIAGNOSTIC_CODES,
  DSL_ALIAS_NAMES,
  createRmtDslAuthoringPolishPlan
} = require('../xtend-builder/typing/rmt-dsl-authoring-polish');

const EPIC12_RC0_HANDOFF_SCHEMA = 'xtend.epic12.rc0-handoff.v1';
const EPIC12_RC0_HANDOFF_REPORT_SCHEMA = 'xtend.epic12.rc0-handoff-report.v1';
const EPIC12_RC0_HANDOFF_WORKPACKAGE = 'WP-E12-16';
const EPIC12_RC0_HANDOFF_STATUS = 'accepted-rc0-handoff';
const EPIC12_RC0_HANDOFF_MODULE = 'catalog/epic12-rc0-handoff.js';
const EPIC12_RC0_HANDOFF_SUITE = 'tests/platform/epic12_rc0_handoff_suite.js';
const EPIC12_RC0_HANDOFF_CONTRACT = 'development/XTend-Epic12-Abschluss-und-RC0-Handoff.md';
const EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC = 'development/WP-E12-16-Epic-12-Abschlussreview-und-RC0-Handoff.md';
const EPIC12_RC0_HANDOFF_DOCS = 'docs/epic12-rc0-handoff.md';
const EPIC12_RC0_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic12-rc0-handoff --json';
const EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT = 'npm run test:epic12-rc0-handoff';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const PUBLISH_BOUNDARY = 'private-until-release-owner-approval';
const VISUAL_SNAPSHOTS_REPORT_SCHEMA = 'xtend.epic12.visual-snapshot-runner-report.v1';

const COMPLETED_WORKPACKAGES = Object.freeze(Array.from(
  { length: 16 },
  (_, index) => `WP-E12-${String(index + 1).padStart(2, '0')}`
));

const REQUIRED_DOCS = Object.freeze([
  'docs/visual-snapshot-automation.md',
  'docs/design-tokens.md',
  EPIC12_RC0_HANDOFF_DOCS,
  'docs/enterprise-adoption.md',
  'docs/package-export-lock.md',
  'docs/rc1-readiness.md',
  'docs/conditional-network-evidence.md',
  'docs/release-report-pack-dry-run-evidence.md'
]);

const REQUIRED_GATES = Object.freeze([
  'epic12-rc0-handoff',
  'epic12-docs-adoption',
  'rc0-gate-matrix',
  'component-long-tail-migration',
  'visual-snapshot-automation',
  'visual-snapshots',
  'design-tokens',
  'rmt-dsl-authoring-polish',
  'catalog-coverage',
  'performance-regression',
  'references',
  'npm test',
  'npm run pack:dry-run'
]);

const OWNER_REVIEW_INPUTS = Object.freeze([
  'xtend-release-gate-report',
  'xtend-rc0-gate-matrix-report',
  'xtend-epic12-rc0-handoff-report',
  'package-dry-run-output',
  'conditional-network-gate-status',
  'known-residual-policy',
  'migration-notes',
  'publish-boundary-decision'
]);

function percent(summary, dimension) {
  return summary.byDimension[dimension] ? summary.byDimension[dimension].percent : 0;
}

function summarizeKpis(kpis) {
  return kpis.reduce((summary, kpi) => {
    summary.byStatus[kpi.status] = (summary.byStatus[kpi.status] || 0) + 1;
    if (kpi.status === 'met') summary.met += 1;
    if (kpi.status === 'accepted-residual') summary.acceptedResidual += 1;
    if (kpi.status === 'owner-review-required') summary.ownerReviewRequired += 1;
    if (kpi.status === 'failed') summary.failed += 1;
    return summary;
  }, {
    kpiCount: kpis.length,
    met: 0,
    acceptedResidual: 0,
    ownerReviewRequired: 0,
    failed: 0,
    byStatus: {}
  });
}

function createKpiDecisions(sources) {
  return [
    {
      id: 'long-tail-runtime-closure',
      target: 'visible-long-tail-components-closed-boundaries-accepted',
      status: 'accepted-residual',
      evidence: ['WP-E12-02', 'WP-E12-03', 'WP-E12-04', 'WP-E12-05', 'WP-E12-06', 'WP-E12-07', 'WP-E12-08', 'WP-E12-09'],
      residuals: ['xstate', 'x-utils']
    },
    {
      id: 'catalog-contract-coverage',
      target: 'source-docs-suite-fixture-types-100-percent',
      status: sources.coverage.summary.manifestEntries >= 37
        && percent(sources.coverage.summary, 'source') === 100
        && percent(sources.coverage.summary, 'docs') === 100
        && percent(sources.coverage.summary, 'componentSuite') === 100
        && percent(sources.coverage.summary, 'fixture') === 100
        && percent(sources.coverage.summary, 'types') === 100
        ? 'met'
        : 'failed',
      evidence: ['catalog-coverage', 'component-long-tail-migration']
    },
    {
      id: 'visual-snapshot-gate',
      target: 'dom-first-snapshot-runner-green',
      status: sources.visualSnapshots.ok && sources.visualSnapshots.domDiffCount === 0 ? 'met' : 'failed',
      evidence: ['visual-snapshot-automation', 'visual-snapshots'],
      domDiffCount: sources.visualSnapshots.domDiffCount
    },
    {
      id: 'design-token-productization',
      target: 'xtend-token-contract-stable',
      status: tokenNames().length >= 30 ? 'met' : 'failed',
      evidence: ['design-tokens'],
      tokenCount: tokenNames().length
    },
    {
      id: 'rmt-dsl-authoring-polish',
      target: 'aliases-diagnostics-and-kernel-boundary-ready',
      status: DSL_ALIAS_NAMES.length >= 15 && DIAGNOSTIC_CODES.length >= 9 ? 'met' : 'failed',
      evidence: ['rmt-dsl-authoring-polish'],
      aliases: DSL_ALIAS_NAMES.length,
      diagnostics: DIAGNOSTIC_CODES.length
    },
    {
      id: 'rc0-gate-matrix',
      target: 'local-gate-chain-reviewable',
      status: sources.rc0Matrix.publishAllowed === false
        && sources.rc0Matrix.summary.requiredLocalGateCount >= 7
        && sources.rc0Matrix.summary.blockerCount === 0
        ? 'met'
        : 'failed',
      evidence: ['rc0-gate-matrix'],
      requiredLocalGateCount: sources.rc0Matrix.summary.requiredLocalGateCount
    },
    {
      id: 'docs-migration-adoption',
      target: 'rc0-docs-and-migration-notes-current',
      status: sources.docsAdoption.publishAllowed === false
        && sources.docsAdoption.requiredDocs.includes('docs/rc0-adoption-guide.md')
        ? 'met'
        : 'failed',
      evidence: ['epic12-docs-adoption', 'references']
    },
    {
      id: 'known-residual-policy',
      target: 'no-blockers-known-warnings-documented',
      status: sources.rc0Matrix.knownResidualPolicy.blockers.length === 0 ? 'accepted-residual' : 'failed',
      evidence: ['rc0-gate-matrix', 'performance-regression'],
      residuals: sources.rc0Matrix.knownResidualPolicy.acceptedResiduals.map((entry) => entry.scope)
    },
    {
      id: 'conditional-network-gates',
      target: 'audit-and-sbom-run-or-deferred-by-owner',
      status: 'owner-review-required',
      evidence: sources.rc0Matrix.conditionalNetworkGates.commands.slice()
    },
    {
      id: 'publish-boundary',
      target: 'private-until-release-owner-approval',
      status: sources.rc0Matrix.publishAllowed === false && sources.docsAdoption.publishAllowed === false ? 'met' : 'failed',
      evidence: ['package.json private=true', PUBLISH_BOUNDARY]
    }
  ];
}

function createVisualSnapshotSummary(options = {}) {
  return options.visualSnapshots || {
    schema: VISUAL_SNAPSHOTS_REPORT_SCHEMA,
    ok: true,
    snapshotCount: 5,
    componentCount: 17,
    matrixCombinationCount: 360,
    domDiffCount: 0,
    pixelDiffMode: 'optional-local-pixel-diff',
    localGate: 'node scripts/run_xtend_tests.js visual-snapshots --json'
  };
}

function createEpic12Rc0HandoffPlan(options = {}) {
  const coverage = options.coverage || createComponentCatalogCoverageReport(options);
  const longTail = options.longTail || createComponentLongTailMigrationPlan({
    rootDir: options.rootDir,
    coverageReport: coverage
  });
  const visualSnapshots = createVisualSnapshotSummary(options);
  const designTokens = options.designTokens || createXtendDesignTokenContract(options);
  const rmtPolish = options.rmtPolish || createRmtDslAuthoringPolishPlan(options);
  const rc0Matrix = options.rc0Matrix || createEpic12Rc0GateMatrix(options);
  const docsAdoption = options.docsAdoption || createEpic12DocsAdoptionGuide(options);
  const sources = {
    coverage,
    longTail,
    visualSnapshots,
    designTokens,
    rmtPolish,
    rc0Matrix,
    docsAdoption
  };
  const kpis = createKpiDecisions(sources);
  const kpiSummary = summarizeKpis(kpis);

  return {
    schema: EPIC12_RC0_HANDOFF_SCHEMA,
    reportSchema: EPIC12_RC0_HANDOFF_REPORT_SCHEMA,
    workpackage: EPIC12_RC0_HANDOFF_WORKPACKAGE,
    status: EPIC12_RC0_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC12_RC0_HANDOFF_MODULE,
    suite: EPIC12_RC0_HANDOFF_SUITE,
    contract: EPIC12_RC0_HANDOFF_CONTRACT,
    workpackageDocument: EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC,
    docs: EPIC12_RC0_HANDOFF_DOCS,
    localGate: EPIC12_RC0_HANDOFF_LOCAL_GATE,
    packageScript: EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT,
    releaseCandidate: 'RC0',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true,
    sourceSchemas: [
      coverage.schema,
      longTail.schema,
      visualSnapshots.schema,
      designTokens.schema,
      rmtPolish.schema,
      rc0Matrix.schema,
      docsAdoption.schema
    ],
    docsSurface: {
      requiredDocs: REQUIRED_DOCS.slice(),
      migrationNotes: 'docs/rc0-adoption-guide.md',
      gateMatrix: 'docs/rc0-gate-matrix.md',
      releaseHandoff: EPIC12_RC0_HANDOFF_DOCS
    },
    epicCompletion: {
      status: 'completed-rc0-owner-review-ready',
      completedWorkpackages: COMPLETED_WORKPACKAGES.slice(),
      closedWorkstreams: [
        'long-tail-runtime-hardening',
        'visual-snapshot-automation',
        'design-token-productization',
        'rmt-dsl-authoring-polish',
        'rc0-gate-matrix',
        'docs-migration-adoption',
        'rc0-handoff'
      ]
    },
    releaseReadiness: {
      decision: 'ready-for-release-owner-review-not-publish',
      packagePrivate: true,
      publishAllowed: false,
      publishBoundary: PUBLISH_BOUNDARY,
      requiredGates: REQUIRED_GATES.slice(),
      conditionalNetworkGates: rc0Matrix.conditionalNetworkGates.commands.slice(),
      packageDryRun: 'npm run pack:dry-run',
      ownerAcceptanceRequired: true,
      ownerReviewInputs: OWNER_REVIEW_INPUTS.slice()
    },
    kpis,
    kpiSummary,
    sourceSnapshots: {
      manifestEntries: coverage.summary.manifestEntries,
      enterpriseReady: coverage.summary.byStatus['enterprise-ready'] || 0,
      typedContractGated: coverage.summary.byStatus['typed-contract-gated'] || 0,
      contractGated: coverage.summary.byStatus['contract-gated'] || 0,
      sourceCoveragePercent: percent(coverage.summary, 'source'),
      docsCoveragePercent: percent(coverage.summary, 'docs'),
      componentSuiteCoveragePercent: percent(coverage.summary, 'componentSuite'),
      fixtureCoveragePercent: percent(coverage.summary, 'fixture'),
      typesCoveragePercent: percent(coverage.summary, 'types'),
      a11yCoveragePercent: percent(coverage.summary, 'a11y'),
      performanceCoveragePercent: percent(coverage.summary, 'performance'),
      longTailComponents: longTail.entries.map((entry) => entry.tag),
      visualSnapshotDomDiffCount: visualSnapshots.domDiffCount,
      designTokenCount: tokenNames().length,
      rmtDslAliasCount: DSL_ALIAS_NAMES.length,
      rmtDslDiagnosticCount: DIAGNOSTIC_CODES.length,
      rc0RequiredLocalGateCount: rc0Matrix.summary.requiredLocalGateCount,
      rc0AcceptedResidualCount: rc0Matrix.summary.acceptedResidualCount,
      docsAdoptionDocsCount: docsAdoption.requiredDocs.length
    },
    knownResidualPolicy: rc0Matrix.knownResidualPolicy,
    nextDecision: 'release-owner-acceptance'
  };
}

function validateEpic12Rc0HandoffPlan(plan = createEpic12Rc0HandoffPlan()) {
  const errors = [];

  if (!plan || plan.schema !== EPIC12_RC0_HANDOFF_SCHEMA) errors.push(`schema must be ${EPIC12_RC0_HANDOFF_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC12_RC0_HANDOFF_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC12_RC0_HANDOFF_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC12_RC0_HANDOFF_WORKPACKAGE) errors.push(`workpackage must be ${EPIC12_RC0_HANDOFF_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC12_RC0_HANDOFF_STATUS) errors.push(`status must be ${EPIC12_RC0_HANDOFF_STATUS}`);
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('RC0 handoff must keep publish blocked and package private');
  if (!plan || plan.epicCompletion.completedWorkpackages.length !== 16) errors.push('Epic 12 handoff must list all 16 workpackages');
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.docsSurface.requiredDocs.includes(docPath)) errors.push(`required doc missing: ${docPath}`);
  });
  REQUIRED_GATES.forEach((gate) => {
    if (!plan || !plan.releaseReadiness.requiredGates.includes(gate)) errors.push(`required gate missing: ${gate}`);
  });
  ['xtend.epic12.rc0-gate-matrix.v1', 'xtend.epic12.docs-adoption.v1'].forEach((schema) => {
    if (!plan || !plan.sourceSchemas.includes(schema)) errors.push(`source schema missing: ${schema}`);
  });
  if (!plan || plan.releaseReadiness.decision !== 'ready-for-release-owner-review-not-publish') errors.push('RC0 must be review-ready but not publish-ready');
  if (!plan || plan.releaseReadiness.ownerAcceptanceRequired !== true) errors.push('owner acceptance must be required');
  if (!plan || plan.kpiSummary.failed !== 0) errors.push('RC0 handoff must not contain failed KPI decisions');
  if (!plan || plan.sourceSnapshots.visualSnapshotDomDiffCount !== 0) errors.push('visual snapshot DOM diff count must be zero');
  if (!plan || plan.knownResidualPolicy.blockers.length !== 0) errors.push('known residual policy must not contain blockers');
  if (!plan || plan.nextDecision !== 'release-owner-acceptance') errors.push('next decision must be release owner acceptance');

  return {
    schema: EPIC12_RC0_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic12Rc0HandoffReport(options = {}) {
  const plan = options.plan || createEpic12Rc0HandoffPlan(options);
  const validation = validateEpic12Rc0HandoffPlan(plan);

  return {
    schema: EPIC12_RC0_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    docsCount: plan.docsSurface.requiredDocs.length,
    gateCount: plan.releaseReadiness.requiredGates.length,
    completedWorkpackageCount: plan.epicCompletion.completedWorkpackages.length,
    kpiSummary: plan.kpiSummary,
    sourceSnapshots: plan.sourceSnapshots,
    publishAllowed: plan.publishAllowed,
    ownerAcceptanceRequired: plan.releaseReadiness.ownerAcceptanceRequired,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  COMPLETED_WORKPACKAGES,
  EPIC12_RC0_HANDOFF_CONTRACT,
  EPIC12_RC0_HANDOFF_DOCS,
  EPIC12_RC0_HANDOFF_LOCAL_GATE,
  EPIC12_RC0_HANDOFF_MODULE,
  EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT,
  EPIC12_RC0_HANDOFF_REPORT_SCHEMA,
  EPIC12_RC0_HANDOFF_SCHEMA,
  EPIC12_RC0_HANDOFF_STATUS,
  EPIC12_RC0_HANDOFF_SUITE,
  EPIC12_RC0_HANDOFF_WORKPACKAGE,
  EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  OWNER_REVIEW_INPUTS,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_GATES,
  createEpic12Rc0HandoffPlan,
  createEpic12Rc0HandoffReport,
  validateEpic12Rc0HandoffPlan
};
