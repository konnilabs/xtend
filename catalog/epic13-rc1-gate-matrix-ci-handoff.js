const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const rc1Readiness = require('./epic13-rc1-readiness');
const releaseOwner = require('./epic13-release-owner-acceptance');
const conditionalNetwork = require('./epic13-conditional-network-evidence');
const packageExportLock = require('./epic13-package-export-lock');
const knownResidual = require('./epic13-known-residual-triage');
const hydrationClosure = require('./epic13-hydration-performance-closure');
const prodBrowserCsp = require('./epic13-prod-browser-csp-smoke');
const visualOwner = require('./epic13-visual-owner-artifact');
const rmtProduction = require('./epic13-rmt-production-readiness');
const docsRmtHardening = require('./epic13-docs-rmt-production-hardening');
const trustedDom = require('./epic13-trusted-dom-boundary');
const rc1MigrationNotes = require('./epic13-rc1-migration-notes');

const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA = 'xtend.epic13.rc1-gate-matrix-ci-handoff.v1';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA = 'xtend.epic13.rc1-gate-matrix-ci-handoff-report.v1';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE = 'WP-E13-13';
const DPF_WORKPACKAGE = 'DPF-WP-01-rc1-gate-matrix-ci-handoff';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS = 'accepted-rc1-gate-matrix-ci-handoff';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET = 'rc1-ci-handoff-ready';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE = 'catalog/epic13-rc1-gate-matrix-ci-handoff.js';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE = 'tests/platform/epic13_rc1_gate_matrix_ci_handoff_suite.js';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT = 'development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC = 'development/WP-E13-13-RC1-Gate-Matrix-und-CI-Handoff-erstellen.md';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS = 'docs/rc1-gate-matrix-ci-handoff.md';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT = 'npm run test:epic13-rc1-gate-matrix-ci-handoff';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json';
const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT = './catalog/epic13-rc1-gate-matrix-ci-handoff';
const NEXT_DECISION = 'epic13-final-rc1-handoff';
const NEXT_WORKPACKAGE = 'WP-E13-14';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const SOURCE_GATE_DEFINITIONS = Object.freeze([
  {
    id: 'epic13-rc1-readiness',
    label: 'RC1 Readiness',
    workpackage: rc1Readiness.EPIC13_RC1_READINESS_WORKPACKAGE,
    schema: rc1Readiness.EPIC13_RC1_READINESS_SCHEMA,
    reportSchema: rc1Readiness.EPIC13_RC1_READINESS_REPORT_SCHEMA,
    packageScript: rc1Readiness.EPIC13_RC1_READINESS_PACKAGE_SCRIPT,
    create: rc1Readiness.createEpic13Rc1ReadinessModel,
    validate: rc1Readiness.validateEpic13Rc1ReadinessModel,
    report: rc1Readiness.createEpic13Rc1ReadinessReport
  },
  {
    id: 'epic13-release-owner-acceptance',
    label: 'Release Owner Acceptance',
    workpackage: releaseOwner.EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE,
    schema: releaseOwner.EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    reportSchema: releaseOwner.EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
    packageScript: releaseOwner.EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT,
    create: releaseOwner.createEpic13ReleaseOwnerAcceptanceContract,
    validate: releaseOwner.validateEpic13ReleaseOwnerAcceptanceContract,
    report: releaseOwner.createEpic13ReleaseOwnerAcceptanceReport
  },
  {
    id: 'epic13-conditional-network-evidence',
    label: 'Conditional Network Evidence',
    workpackage: conditionalNetwork.EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE,
    schema: conditionalNetwork.EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    reportSchema: conditionalNetwork.EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
    packageScript: conditionalNetwork.EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT,
    create: conditionalNetwork.createEpic13ConditionalNetworkEvidencePlan,
    validate: conditionalNetwork.validateEpic13ConditionalNetworkEvidencePlan,
    report: conditionalNetwork.createEpic13ConditionalNetworkEvidenceReport
  },
  {
    id: 'epic13-package-export-lock',
    label: 'Package Export Lock',
    workpackage: packageExportLock.EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE,
    schema: packageExportLock.EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    reportSchema: packageExportLock.EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
    packageScript: packageExportLock.EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT,
    create: packageExportLock.createEpic13PackageExportLockPlan,
    validate: packageExportLock.validateEpic13PackageExportLockPlan,
    report: packageExportLock.createEpic13PackageExportLockReport
  },
  {
    id: 'epic13-known-residual-triage',
    label: 'Known Residual Triage',
    workpackage: knownResidual.EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE,
    schema: knownResidual.EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    reportSchema: knownResidual.EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
    packageScript: knownResidual.EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT,
    create: knownResidual.createEpic13KnownResidualTriagePlan,
    validate: knownResidual.validateEpic13KnownResidualTriagePlan,
    report: knownResidual.createEpic13KnownResidualTriageReport
  },
  {
    id: 'epic13-hydration-performance-closure',
    label: 'Hydration Performance Closure',
    workpackage: hydrationClosure.EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE,
    schema: hydrationClosure.EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    reportSchema: hydrationClosure.EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
    packageScript: hydrationClosure.EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT,
    create: hydrationClosure.createEpic13HydrationPerformanceClosurePlan,
    validate: hydrationClosure.validateEpic13HydrationPerformanceClosurePlan,
    report: hydrationClosure.createEpic13HydrationPerformanceClosureReport
  },
  {
    id: 'epic13-prod-browser-csp-smoke',
    label: 'PROD Browser CSP Smoke',
    workpackage: prodBrowserCsp.EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE,
    schema: prodBrowserCsp.EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    reportSchema: prodBrowserCsp.EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
    packageScript: prodBrowserCsp.EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT,
    create: prodBrowserCsp.createEpic13ProdBrowserCspSmokePlan,
    validate: prodBrowserCsp.validateEpic13ProdBrowserCspSmokePlan,
    report: prodBrowserCsp.createEpic13ProdBrowserCspSmokeReport
  },
  {
    id: 'epic13-visual-owner-artifact',
    label: 'Visual Owner Artifact',
    workpackage: visualOwner.EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE,
    schema: visualOwner.EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    reportSchema: visualOwner.EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
    packageScript: visualOwner.EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT,
    create: visualOwner.createEpic13VisualOwnerArtifactPlan,
    validate: visualOwner.validateEpic13VisualOwnerArtifactPlan,
    report: visualOwner.createEpic13VisualOwnerArtifactReport
  },
  {
    id: 'epic13-rmt-production-readiness',
    label: 'RMT Production Readiness',
    workpackage: rmtProduction.EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE,
    schema: rmtProduction.EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    reportSchema: rmtProduction.EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
    packageScript: rmtProduction.EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT,
    create: rmtProduction.createEpic13RmtProductionReadinessPlan,
    validate: rmtProduction.validateEpic13RmtProductionReadinessPlan,
    report: rmtProduction.createEpic13RmtProductionReadinessReport
  },
  {
    id: 'epic13-docs-rmt-production-hardening',
    label: 'Docs RMT Production Hardening',
    workpackage: docsRmtHardening.EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE,
    schema: docsRmtHardening.EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    reportSchema: docsRmtHardening.EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
    packageScript: docsRmtHardening.EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT,
    create: docsRmtHardening.createEpic13DocsRmtProductionHardeningPlan,
    validate: docsRmtHardening.validateEpic13DocsRmtProductionHardeningPlan,
    report: docsRmtHardening.createEpic13DocsRmtProductionHardeningReport
  },
  {
    id: 'epic13-trusted-dom-boundary',
    label: 'Trusted DOM Boundary',
    workpackage: trustedDom.EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE,
    schema: trustedDom.EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    reportSchema: trustedDom.EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
    packageScript: trustedDom.EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT,
    create: trustedDom.createEpic13TrustedDomBoundaryPlan,
    validate: trustedDom.validateEpic13TrustedDomBoundaryPlan,
    report: trustedDom.createEpic13TrustedDomBoundaryReport
  },
  {
    id: 'epic13-rc1-migration-notes',
    label: 'RC1 Migration Notes',
    workpackage: rc1MigrationNotes.EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE,
    schema: rc1MigrationNotes.EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    reportSchema: rc1MigrationNotes.EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
    packageScript: rc1MigrationNotes.EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT,
    create: rc1MigrationNotes.createEpic13Rc1MigrationNotesPlan,
    validate: rc1MigrationNotes.validateEpic13Rc1MigrationNotesPlan,
    report: rc1MigrationNotes.createEpic13Rc1MigrationNotesReport
  }
]);

const REQUIRED_SOURCE_GATES = Object.freeze(SOURCE_GATE_DEFINITIONS.map((entry) => entry.packageScript));

const REQUIRED_REPORT_ARTIFACTS = Object.freeze([
  '.xtend-test-results/xtend-pr-gate-report.json',
  '.xtend-test-results/xtend-release-gate-report.json',
  '.xtend-test-results/xtend-release-report.json',
  '.xtend-test-results/xtend-conditional-network-evidence-report.json',
  '.xtend-test-results/xtend-npm-audit-report.json',
  '.xtend-test-results/xtend-npm-sbom.json',
  '.xtend-test-results/xtend-pack-dry-run.json',
  '.xtend-test-results/xtend-package-export-surface-lock.json',
  '.xtend-test-results/xtend-package-export-lock-report.json',
  '.xtend-test-results/xtend-type-exports-report.json',
  '.xtend-test-results/xtend-known-residual-triage-report.json',
  '.xtend-test-results/xtend-hydration-performance-closure-report.json',
  '.xtend-test-results/visual-snapshots/rc1/visual-owner-artifact-report.json',
  '.xtend-test-results/xtend-epic13-rmt-production-readiness-report.json',
  '.xtend-test-results/xtend-epic13-docs-rmt-production-hardening-report.json',
  '.xtend-test-results/xtend-epic13-trusted-dom-boundary-report.json',
  '.xtend-test-results/xtend-epic13-rc1-migration-notes-report.json',
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT
]);

const REQUIRED_REFERENCE_PATHS = Object.freeze([
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS,
  'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
  'development/XTend-CI-Gate-Matrix.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'docs/README.md',
  'docs/menu.json',
  'README.md',
  'CHANGELOG.md',
  'tests/README.md',
  'package.json',
  'xtend-builder/scaffold.config.js'
]);

const CI_LANES = Object.freeze([
  {
    id: 'pr-fast',
    trigger: 'pull-request',
    reportArtifact: '.xtend-test-results/xtend-pr-gate-report.json',
    requiredGates: ['npm run test:pr:report', 'npm run test:type-exports:release']
  },
  {
    id: 'rc1-full-release',
    trigger: 'release-candidate',
    reportArtifact: '.xtend-test-results/xtend-release-gate-report.json',
    requiredGates: ['npm run test:release:full:report', EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT]
  },
  {
    id: 'conditional-network-evidence',
    trigger: 'owner-approved-network',
    reportArtifact: '.xtend-test-results/xtend-conditional-network-evidence-report.json',
    requiredGates: ['npm audit --audit-level=moderate', 'npm sbom --sbom-format=cyclonedx --json']
  },
  {
    id: 'owner-handoff',
    trigger: 'release-owner-review',
    reportArtifact: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT,
    requiredGates: REQUIRED_SOURCE_GATES
  }
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSourceGate(definition, options) {
  const plan = definition.create(options);
  const validation = definition.validate(plan);
  const report = definition.report(options);

  return {
    id: definition.id,
    label: definition.label,
    workpackage: definition.workpackage,
    schema: definition.schema,
    reportSchema: definition.reportSchema,
    status: plan.status,
    packageScript: definition.packageScript,
    localGate: plan.localGate || `node scripts/run_xtend_tests.js ${definition.id} --json`,
    validationOk: validation.ok === true,
    reportOk: report.ok === true,
    nextWorkpackage: plan.nextWorkpackage || null
  };
}

function createEpic13Rc1GateMatrixCiHandoffPlan(options = {}) {
  const sourceGates = SOURCE_GATE_DEFINITIONS.map((definition) => createSourceGate(definition, options));

  return {
    schema: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
    reportSchema: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
    workpackage: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE,
    dpfWorkpackage: DPF_WORKPACKAGE,
    status: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE,
    suite: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE,
    steeringDocument: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING,
    contract: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT,
    workpackageDocument: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC,
    docs: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS,
    localGate: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE,
    packageScript: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT,
    packageExport: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT,
    reportArtifact: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT,
    targetReadiness: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET,
    sourceGates,
    localGateMatrix: REQUIRED_SOURCE_GATES.map((command) => ({
      command,
      mode: 'local-static-or-fixture',
      requiredForRc1: true
    })),
    ciLanes: clone(CI_LANES),
    reportArtifacts: REQUIRED_REPORT_ARTIFACTS.slice(),
    referencePaths: REQUIRED_REFERENCE_PATHS.slice(),
    handoffContract: {
      releaseOwnerVisible: true,
      ciMaintainerVisible: true,
      localGateRequiresNetwork: false,
      conditionalNetworkMode: 'executed-or-owner-deferral',
      packDryRunReportRequired: true,
      typeExportsReleaseGateRequired: true,
      reportSchema: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
      packagePrivateRequired: true,
      publishAllowed: false
    },
    docsMenuSlug: 'rc1-gate-matrix-ci-handoff',
    frameworkAgnostic: true,
    rmtKernelImportsXtendTypes: false,
    kernelBoundary: KERNEL_BOUNDARY,
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13Rc1GateMatrixCiHandoffPlan(plan = createEpic13Rc1GateMatrixCiHandoffPlan()) {
  const errors = [];
  const sourceGates = plan && Array.isArray(plan.sourceGates) ? plan.sourceGates : [];
  const localGateCommands = plan && Array.isArray(plan.localGateMatrix) ? plan.localGateMatrix.map((entry) => entry.command) : [];
  const ciLaneIds = plan && Array.isArray(plan.ciLanes) ? plan.ciLanes.map((entry) => entry.id) : [];

  if (!plan || plan.schema !== EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA) errors.push(`schema must be ${EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE}`);
  if (!plan || plan.dpfWorkpackage !== DPF_WORKPACKAGE) errors.push(`dpfWorkpackage must be ${DPF_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS) errors.push(`status must be ${EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS}`);
  if (!plan || plan.targetReadiness !== EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET) errors.push(`targetReadiness must be ${EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET}`);
  if (!plan || plan.packageExport !== EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT) errors.push('package export must be registered');
  if (!plan || !plan.handoffContract || plan.handoffContract.releaseOwnerVisible !== true || plan.handoffContract.ciMaintainerVisible !== true) errors.push('handoff contract must be visible to release owner and CI maintainers');
  if (!plan || !plan.handoffContract || plan.handoffContract.localGateRequiresNetwork !== false) errors.push('local gate must stay network-free');
  if (!plan || !plan.handoffContract || plan.handoffContract.conditionalNetworkMode !== 'executed-or-owner-deferral') errors.push('conditional network mode must require execution or owner deferral');
  if (!plan || !plan.handoffContract || plan.handoffContract.packDryRunReportRequired !== true || plan.handoffContract.typeExportsReleaseGateRequired !== true) errors.push('handoff contract must require pack dry-run and TypeExports release evidence');

  SOURCE_GATE_DEFINITIONS.forEach((definition) => {
    const source = sourceGates.find((entry) => entry.id === definition.id);
    if (!source) errors.push(`source gate missing: ${definition.id}`);
    if (source && source.schema !== definition.schema) errors.push(`source gate schema mismatch: ${definition.id}`);
    if (source && source.workpackage !== definition.workpackage) errors.push(`source gate workpackage mismatch: ${definition.id}`);
    if (source && source.validationOk !== true) errors.push(`source gate validation failed: ${definition.id}`);
    if (source && source.reportOk !== true) errors.push(`source gate report failed: ${definition.id}`);
  });

  REQUIRED_SOURCE_GATES.forEach((command) => {
    if (!localGateCommands.includes(command)) errors.push(`local gate matrix missing: ${command}`);
  });
  REQUIRED_REPORT_ARTIFACTS.forEach((artifact) => {
    if (!plan || !plan.reportArtifacts.includes(artifact)) errors.push(`report artifact missing: ${artifact}`);
  });
  REQUIRED_REFERENCE_PATHS.forEach((referencePath) => {
    if (!plan || !plan.referencePaths.includes(referencePath)) errors.push(`reference path missing: ${referencePath}`);
  });
  ['pr-fast', 'rc1-full-release', 'conditional-network-evidence', 'owner-handoff'].forEach((lane) => {
    if (!ciLaneIds.includes(lane)) errors.push(`CI lane missing: ${lane}`);
  });
  if (!plan || plan.docsMenuSlug !== 'rc1-gate-matrix-ci-handoff') errors.push('docs menu slug must be rc1-gate-matrix-ci-handoff');
  if (!plan || plan.frameworkAgnostic !== true || plan.rmtKernelImportsXtendTypes !== false) errors.push('gate matrix must preserve RMT framework agnosticism');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13Rc1GateMatrixCiHandoffReport(options = {}) {
  const plan = options.plan || createEpic13Rc1GateMatrixCiHandoffPlan(options);
  const validation = validateEpic13Rc1GateMatrixCiHandoffPlan(plan);

  return {
    schema: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    sourceGateCount: plan.sourceGates.length,
    localGateCount: plan.localGateMatrix.length,
    reportArtifactCount: plan.reportArtifacts.length,
    ciLaneCount: plan.ciLanes.length,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  CI_LANES,
  DPF_WORKPACKAGE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_REFERENCE_PATHS,
  REQUIRED_REPORT_ARTIFACTS,
  REQUIRED_SOURCE_GATES,
  SOURCE_GATE_DEFINITIONS,
  createEpic13Rc1GateMatrixCiHandoffPlan,
  createEpic13Rc1GateMatrixCiHandoffReport,
  validateEpic13Rc1GateMatrixCiHandoffPlan
};
