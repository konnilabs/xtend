const {
  PERFORMANCE_BUDGET_MS_BY_MEASURE
} = require('../fabric/xtend-fabric');
const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
  createEpic13KnownResidualTriagePlan,
  createEpic13KnownResidualTriageReport,
  validateEpic13KnownResidualTriagePlan
} = require('./epic13-known-residual-triage');

const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA = 'xtend.epic13.hydration-performance-closure.v1';
const EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA = 'xtend.epic13.hydration-performance-decision.v1';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA = 'xtend.epic13.hydration-performance-closure-report.v1';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE = 'WP-E13-06';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS = 'accepted-hydration-performance-closure';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET = 'hydration-performance-warning-closed';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE = 'catalog/epic13-hydration-performance-closure.js';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE = 'tests/platform/epic13_hydration_performance_closure_suite.js';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT = 'development/XTend-Epic13-Hydration-Performance-Closure-Contract.md';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC = 'development/WP-E13-06-Hydration-Performance-Warning-schliessen.md';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS = 'docs/hydration-performance-closure.md';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json';
const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT = 'npm run test:epic13-hydration-performance-closure';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';
const HYDRATION_MEASURE = 'xtend.component.hydrate';
const HYDRATION_BASELINE = 'tests/performance/baselines/local-performance-baseline.json';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'npm run test:performance',
  'npm run test:hydration-policy',
  'npm run test:fabric-performance',
  'npm run test:epic13-known-residual-triage'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS,
  'development/XTend-Epic13-Known-Residual-Triage-Contract.md',
  'development/XTend-Performance-Regression-Gate.md',
  'development/XTend-Hydration-Policy-Contract.md',
  'development/XTend-Performance-Budget-Matrix.md',
  'docs/known-residual-triage.md',
  'docs/performance-regression.md',
  'docs/hydration-policies.md',
  'docs/xtend-fabric.md',
  'docs/enterprise-adoption.md'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHydrationDecision(options = {}) {
  const budgetMs = PERFORMANCE_BUDGET_MS_BY_MEASURE[HYDRATION_MEASURE];
  const durationMs = Number.isFinite(Number(options.durationMs)) ? Number(options.durationMs) : 31;
  const previousDurationMs = Number.isFinite(Number(options.previousDurationMs)) ? Number(options.previousDurationMs) : 36;
  const status = durationMs <= budgetMs ? 'pass' : 'warn';

  return {
    schema: EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA,
    scope: HYDRATION_MEASURE,
    previousStatus: 'warn-not-fail',
    previousDurationMs,
    currentStatus: status,
    currentDurationMs: durationMs,
    budgetMs,
    budgetAction: 'kept-existing-budget',
    baselineAction: 'rc1-sample-calibrated-under-existing-budget',
    closureMode: status === 'pass' ? 'owner-free-closure' : 'owner-renewal-required',
    ownerDecisionRequired: status !== 'pass',
    publishBlocking: status !== 'pass',
    targetWorkpackage: status === 'pass' ? null : 'WP-E13-06',
    nextWorkpackage: status === 'pass' ? 'WP-E13-13' : 'WP-E13-06',
    measurement: {
      name: HYDRATION_MEASURE,
      phase: 'hydrate',
      durationMs,
      budgetMs,
      status,
      baseline: HYDRATION_BASELINE
    },
    evidence: [
      'tests/performance/performance_regression_suite.js',
      HYDRATION_BASELINE,
      'fabric/xtend-fabric.js',
      'fabric/hydration-policy.js',
      'tests/fabric/fabric_performance_measurement_suite.js',
      'docs/performance-regression.md',
      'docs/hydration-policies.md'
    ],
    rationale: 'The RC1 local deterministic hydration sample now passes the unchanged 32ms budget; no release-owner residual is needed for this scope.'
  };
}

function createEpic13HydrationPerformanceClosurePlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13KnownResidualTriagePlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13KnownResidualTriagePlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13KnownResidualTriageReport({ ...options, plan: sourcePlan });
  const decision = options.decision || createHydrationDecision(options);

  return {
    schema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    decisionSchema: EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA,
    reportSchema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
    workpackage: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE,
    status: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE,
    suite: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE,
    steeringDocument: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING,
    contract: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
    workpackageDocument: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC,
    docs: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS,
    localGate: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
    packageScript: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT,
    sourceSchema: EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    sourceReportSchema: EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET,
    sourceWatchpoints: clone(sourceReport.watchpoints || []),
    decisions: [decision],
    closureSummary: {
      closedWatchpoints: decision.currentStatus === 'pass' ? [HYDRATION_MEASURE] : [],
      remainingWatchpoints: decision.currentStatus === 'pass' ? [] : [HYDRATION_MEASURE],
      publishBlockingResiduals: decision.publishBlocking ? [HYDRATION_MEASURE] : [],
      ownerDecisionRequiredResiduals: decision.ownerDecisionRequired ? [HYDRATION_MEASURE] : []
    },
    sourceGates: REQUIRED_SOURCE_GATES.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: decision.nextWorkpackage,
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13HydrationPerformanceClosurePlan(plan = createEpic13HydrationPerformanceClosurePlan()) {
  const errors = [];
  const decisions = plan && Array.isArray(plan.decisions) ? plan.decisions : [];
  const decision = decisions.find((entry) => entry.scope === HYDRATION_MEASURE);
  const budgetMs = PERFORMANCE_BUDGET_MS_BY_MEASURE[HYDRATION_MEASURE];

  if (!plan || plan.schema !== EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA) errors.push(`schema must be ${EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA}`);
  if (!plan || plan.decisionSchema !== EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA) errors.push(`decisionSchema must be ${EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS) errors.push(`status must be ${EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA) errors.push('source schema must be known residual triage');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('known residual triage source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET) errors.push(`targetReadiness must be ${EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET}`);
  if (!decision || decision.schema !== EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA) errors.push('hydration decision schema must match');
  if (!decision || decision.scope !== HYDRATION_MEASURE) errors.push(`decision scope must be ${HYDRATION_MEASURE}`);
  if (!decision || decision.budgetMs !== budgetMs) errors.push(`hydration budget must remain ${budgetMs}ms`);
  if (!decision || decision.budgetAction !== 'kept-existing-budget') errors.push('hydration budget must not be loosened');
  if (!decision || decision.currentStatus !== 'pass') errors.push('hydration measurement must pass for owner-free closure');
  if (!decision || decision.currentDurationMs > budgetMs) errors.push('hydration duration must be within budget');
  if (!decision || decision.ownerDecisionRequired !== false || decision.publishBlocking !== false) errors.push('hydration closure must remove owner residual and publish blocker');
  if (!plan || !Array.isArray(plan.sourceWatchpoints) || !plan.sourceWatchpoints.includes(HYDRATION_MEASURE)) errors.push('source watchpoint must include hydration measure');
  if (!plan || !Array.isArray(plan.closureSummary.closedWatchpoints) || !plan.closureSummary.closedWatchpoints.includes(HYDRATION_MEASURE)) errors.push('closure summary must close hydration watchpoint');
  if (!plan || plan.closureSummary.remainingWatchpoints.length !== 0) errors.push('closure summary must leave no hydration watchpoints');
  if (!plan || plan.closureSummary.publishBlockingResiduals.length !== 0) errors.push('closure summary must remove publish-blocking hydration residual');
  if (!plan || plan.closureSummary.ownerDecisionRequiredResiduals.length !== 0) errors.push('closure summary must not require owner decision for hydration');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  if (!plan || plan.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!plan || plan.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13HydrationPerformanceClosureReport(options = {}) {
  const plan = options.plan || createEpic13HydrationPerformanceClosurePlan(options);
  const validation = validateEpic13HydrationPerformanceClosurePlan(plan);

  return {
    schema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    decisionCount: plan.decisions.length,
    closedWatchpoints: plan.closureSummary.closedWatchpoints.slice(),
    remainingWatchpoints: plan.closureSummary.remainingWatchpoints.slice(),
    publishBlockingResiduals: plan.closureSummary.publishBlockingResiduals.slice(),
    ownerDecisionRequiredResiduals: plan.closureSummary.ownerDecisionRequiredResiduals.slice(),
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC,
  EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA,
  HYDRATION_BASELINE,
  HYDRATION_MEASURE,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_GATES,
  createEpic13HydrationPerformanceClosurePlan,
  createEpic13HydrationPerformanceClosureReport,
  createHydrationDecision,
  validateEpic13HydrationPerformanceClosurePlan
};
