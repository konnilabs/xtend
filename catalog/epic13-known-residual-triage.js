const {
  createComponentCatalogCoverageReport
} = require('./component-catalog-coverage');
const {
  createComponentLongTailMigrationPlan,
  validateComponentLongTailMigrationPlan
} = require('./component-long-tail-migration');
const {
  KERNEL_BOUNDARY,
  createEpic12Rc0GateMatrix,
  createEpic12Rc0GateMatrixReport,
  validateEpic12Rc0GateMatrix
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
  createEpic13PackageExportLockPlan,
  createEpic13PackageExportLockReport,
  validateEpic13PackageExportLockPlan
} = require('./epic13-package-export-lock');

const EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA = 'xtend.epic13.known-residual-triage.v1';
const EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA = 'xtend.epic13.known-residual-decision.v1';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA = 'xtend.epic13.known-residual-triage-report.v1';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE = 'WP-E13-05';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS = 'accepted-known-residual-triage';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET = 'known-residual-triage-ready';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE = 'catalog/epic13-known-residual-triage.js';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE = 'tests/platform/epic13_known_residual_triage_suite.js';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT = 'development/XTend-Epic13-Known-Residual-Triage-Contract.md';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC = 'development/WP-E13-05-RC0-Known-Residuals-fuer-RC1-triagieren.md';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS = 'docs/known-residual-triage.md';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-known-residual-triage --json';
const EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT = 'npm run test:epic13-known-residual-triage';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const RC0_RESIDUAL_SCOPES = Object.freeze([
  'xstate',
  'x-utils',
  'xtend.component.hydrate'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'npm run test:catalog-coverage',
  'npm run test:component-long-tail-migration',
  'npm run test:performance',
  'npm run test:hydration-policy',
  'npm run test:epic13-package-export-lock'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS,
  'development/XTend-RC0-Gate-Matrix.md',
  'development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md',
  'development/XTend-Epic13-Package-Export-Lock-Contract.md',
  'development/XTend-Performance-Regression-Gate.md',
  'development/XTend-Hydration-Policy-Contract.md',
  'docs/rc0-gate-matrix.md',
  'docs/component-long-tail-migration.md',
  'docs/package-export-lock.md',
  'docs/performance-regression.md',
  'docs/hydration-policies.md',
  'docs/enterprise-adoption.md'
]);

const RESIDUAL_DECISION_MATRIX = Object.freeze([
  {
    id: 'xstate-runtime-boundary',
    scope: 'xstate',
    rc0Status: 'contract-gated',
    rc1Decision: 'closed-as-runtime-boundary',
    rc1Status: 'accepted-runtime-boundary',
    ownerDecisionRequired: false,
    publishBlocking: false,
    targetWorkpackage: null,
    reason: 'xstate is a non-visual state adapter boundary with explicit lifecycle, RMT adapter and diagnostics probes.',
    evidence: [
      'components/xstate.js',
      'components/xstate.d.ts',
      'tests/components/xstate.component_suite.js',
      'tests/components/fixtures/xstate.component.html',
      'docs/components/xstate.md',
      'catalog/component-long-tail-migration.js'
    ]
  },
  {
    id: 'xutils-utility-boundary',
    scope: 'x-utils',
    rc0Status: 'typed-contract-gated',
    rc1Decision: 'closed-as-utility-boundary',
    rc1Status: 'accepted-utility-boundary',
    ownerDecisionRequired: false,
    publishBlocking: false,
    targetWorkpackage: null,
    reason: 'x-utils is utility infrastructure, not a Custom Element shell, and is covered by public types, fixture probe and import policy.',
    evidence: [
      'components/xutils.js',
      'components/xutils.d.ts',
      'tests/components/xutils.component_suite.js',
      'tests/components/fixtures/xutils.component.html',
      'docs/components/xutils.md',
      'catalog/component-long-tail-migration.js'
    ]
  },
  {
    id: 'hydration-performance-warning',
    scope: 'xtend.component.hydrate',
    rc0Status: 'accepted-warning',
    rc1Decision: 'defer-to-wp-e13-06-owner-free-closure',
    rc1Status: 'rc1-watchpoint',
    ownerDecisionRequired: false,
    publishBlocking: true,
    targetWorkpackage: 'WP-E13-06',
    reason: 'The deterministic local performance gate still reports warn-not-fail for hydration; RC1 needs a closure or explicit owner decision in WP-E13-06.',
    measurement: {
      name: 'xtend.component.hydrate',
      phase: 'hydrate',
      durationMs: 36,
      budgetMs: 32,
      failThresholdMs: 48,
      status: 'warn-not-fail',
      baseline: 'tests/performance/baselines/local-performance-baseline.json'
    },
    evidence: [
      'tests/performance/performance_regression_suite.js',
      'tests/performance/baselines/local-performance-baseline.json',
      'fabric/hydration-policy.js',
      'docs/performance-regression.md',
      'docs/hydration-policies.md'
    ]
  }
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function findEntryByTag(report, tag) {
  return (report.entries || []).find((entry) => entry.tag === tag);
}

function summarizeDecisions(decisions) {
  return decisions.reduce((summary, decision) => {
    summary.total += 1;
    summary.byRc1Status[decision.rc1Status] = (summary.byRc1Status[decision.rc1Status] || 0) + 1;
    if (decision.rc1Decision.startsWith('closed-as')) summary.closed.push(decision.scope);
    if (decision.rc1Status === 'rc1-watchpoint') summary.watchpoints.push(decision.scope);
    if (decision.publishBlocking) summary.publishBlocking.push(decision.scope);
    if (decision.ownerDecisionRequired) summary.ownerDecisionRequired.push(decision.scope);
    return summary;
  }, {
    total: 0,
    byRc1Status: {},
    closed: [],
    watchpoints: [],
    publishBlocking: [],
    ownerDecisionRequired: []
  });
}

function createResidualDecision(baseDecision, context = {}) {
  const catalogEntry = baseDecision.scope === 'xtend.component.hydrate'
    ? null
    : findEntryByTag(context.coverageReport || {}, baseDecision.scope);
  const migrationEntry = baseDecision.scope === 'xtend.component.hydrate'
    ? null
    : (context.migrationEntries || []).find((entry) => entry.tag === baseDecision.scope);

  return {
    schema: EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA,
    ...clone(baseDecision),
    catalogStatus: catalogEntry ? catalogEntry.status : null,
    catalogProfiles: catalogEntry ? catalogEntry.profiles.slice() : [],
    migrationKind: migrationEntry ? migrationEntry.migrationKind : null,
    targetMaturity: migrationEntry ? migrationEntry.targetMaturity : null
  };
}

function createEpic13KnownResidualTriagePlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13PackageExportLockPlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13PackageExportLockPlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13PackageExportLockReport({ ...options, plan: sourcePlan });
  const rc0GateMatrix = options.rc0GateMatrix || createEpic12Rc0GateMatrix(options);
  const rc0GateValidation = options.rc0GateValidation || validateEpic12Rc0GateMatrix(rc0GateMatrix);
  const rc0GateReport = options.rc0GateReport || createEpic12Rc0GateMatrixReport({ ...options, matrix: rc0GateMatrix });
  const coverageReport = options.coverageReport || createComponentCatalogCoverageReport(options);
  const longTailPlan = options.longTailPlan || createComponentLongTailMigrationPlan({ ...options, coverageReport });
  const longTailValidation = options.longTailValidation || validateComponentLongTailMigrationPlan(longTailPlan);
  const decisions = RESIDUAL_DECISION_MATRIX.map((entry) => createResidualDecision(entry, {
    coverageReport,
    migrationEntries: longTailPlan.entries
  }));
  const decisionSummary = summarizeDecisions(decisions);

  return {
    schema: EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    decisionSchema: EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA,
    reportSchema: EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
    workpackage: EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE,
    status: EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE,
    suite: EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE,
    steeringDocument: EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING,
    contract: EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
    workpackageDocument: EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC,
    docs: EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS,
    localGate: EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
    packageScript: EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT,
    sourceSchema: EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    sourceReportSchema: EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    rc0GateMatrixOk: rc0GateValidation.ok && rc0GateReport.ok,
    longTailPlanOk: longTailValidation.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET,
    rc0ResidualScopes: RC0_RESIDUAL_SCOPES.slice(),
    decisions,
    decisionSummary,
    sourceGates: REQUIRED_SOURCE_GATES.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    preferredClosureMode: 'owner-free-closure-before-owner-renewal',
    nextDecision: 'hydration-performance-warning-decision',
    nextWorkpackage: 'WP-E13-06',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13KnownResidualTriagePlan(plan = createEpic13KnownResidualTriagePlan()) {
  const errors = [];
  const decisions = plan && Array.isArray(plan.decisions) ? plan.decisions : [];
  const scopes = decisions.map((decision) => decision.scope);
  const xstate = decisions.find((decision) => decision.scope === 'xstate');
  const xutils = decisions.find((decision) => decision.scope === 'x-utils');
  const hydrate = decisions.find((decision) => decision.scope === 'xtend.component.hydrate');

  if (!plan || plan.schema !== EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA) errors.push(`schema must be ${EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA}`);
  if (!plan || plan.decisionSchema !== EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA) errors.push(`decisionSchema must be ${EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS) errors.push(`status must be ${EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA) errors.push('source schema must be package export lock');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('package export lock source must validate');
  if (!plan || plan.rc0GateMatrixOk !== true || plan.longTailPlanOk !== true) errors.push('RC0 matrix and long-tail plan must validate');
  if (!plan || plan.targetReadiness !== EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET) errors.push(`targetReadiness must be ${EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET}`);
  RC0_RESIDUAL_SCOPES.forEach((scope) => {
    if (!scopes.includes(scope)) errors.push(`residual scope missing: ${scope}`);
  });
  decisions.forEach((decision) => {
    if (decision.schema !== EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA) errors.push(`${decision.scope || '<unknown>'}: decision schema must match`);
    if (!Array.isArray(decision.evidence) || decision.evidence.length === 0) errors.push(`${decision.scope}: evidence must be explicit`);
  });
  if (!xstate || xstate.rc1Decision !== 'closed-as-runtime-boundary' || xstate.publishBlocking !== false || xstate.ownerDecisionRequired !== false) {
    errors.push('xstate must close as runtime boundary without owner residual');
  }
  if (!xstate || xstate.catalogStatus !== 'contract-gated' || xstate.migrationKind !== 'adapter-boundary-probe') {
    errors.push('xstate must remain traceable to catalog and long-tail boundary probe');
  }
  if (!xutils || xutils.rc1Decision !== 'closed-as-utility-boundary' || xutils.publishBlocking !== false || xutils.ownerDecisionRequired !== false) {
    errors.push('x-utils must close as utility boundary without owner residual');
  }
  if (!xutils || xutils.catalogStatus !== 'typed-contract-gated' || xutils.migrationKind !== 'adapter-boundary-probe') {
    errors.push('x-utils must remain traceable to catalog and long-tail boundary probe');
  }
  if (!hydrate || hydrate.rc1Status !== 'rc1-watchpoint' || hydrate.targetWorkpackage !== 'WP-E13-06' || hydrate.publishBlocking !== true) {
    errors.push('xtend.component.hydrate must hand off as WP-E13-06 watchpoint');
  }
  if (!hydrate || !hydrate.measurement || hydrate.measurement.status !== 'warn-not-fail') {
    errors.push('hydration residual must preserve warn-not-fail measurement evidence');
  }
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  if (!plan || plan.preferredClosureMode !== 'owner-free-closure-before-owner-renewal') errors.push('preferred closure mode must avoid unnecessary owner residuals');
  if (!plan || plan.nextDecision !== 'hydration-performance-warning-decision') errors.push('next decision must be hydration performance warning decision');
  if (!plan || plan.nextWorkpackage !== 'WP-E13-06') errors.push('next workpackage must be WP-E13-06');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13KnownResidualTriageReport(options = {}) {
  const plan = options.plan || createEpic13KnownResidualTriagePlan(options);
  const validation = validateEpic13KnownResidualTriagePlan(plan);

  return {
    schema: EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    decisionCount: plan.decisions.length,
    closedResiduals: plan.decisionSummary.closed.slice(),
    watchpoints: plan.decisionSummary.watchpoints.slice(),
    publishBlockingResiduals: plan.decisionSummary.publishBlocking.slice(),
    ownerDecisionRequiredResiduals: plan.decisionSummary.ownerDecisionRequired.slice(),
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC,
  PUBLISH_BOUNDARY,
  RC0_RESIDUAL_SCOPES,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_GATES,
  RESIDUAL_DECISION_MATRIX,
  createEpic13KnownResidualTriagePlan,
  createEpic13KnownResidualTriageReport,
  validateEpic13KnownResidualTriagePlan
};
