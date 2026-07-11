const {
  CONDITIONAL_NETWORK_COMMANDS,
  createEpic12Rc0GateMatrix,
  createEpic12Rc0GateMatrixReport,
  validateEpic12Rc0GateMatrix
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
  createEpic13ReleaseOwnerAcceptanceContract,
  createEpic13ReleaseOwnerAcceptanceReport,
  validateEpic13ReleaseOwnerAcceptanceContract
} = require('./epic13-release-owner-acceptance');
const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-handoff');

const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA = 'xtend.epic13.conditional-network-evidence.v1';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA = 'xtend.epic13.conditional-network-evidence-report.v1';
const EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA = 'xtend.epic13.conditional-network-deferral.v1';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE = 'WP-E13-03';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS = 'accepted-conditional-network-evidence-contract';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET = 'conditional-network-evidence-ready';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE = 'catalog/epic13-conditional-network-evidence.js';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE = 'tests/platform/epic13_conditional_network_evidence_suite.js';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT = 'development/XTend-Epic13-Conditional-Network-Evidence-Contract.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC = 'development/WP-E13-03-Conditional-Network-Gate-Evidence-vorbereiten.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS = 'docs/conditional-network-evidence.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT = 'npm run test:epic13-conditional-network-evidence';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const EVIDENCE_STATUSES = Object.freeze([
  'executed',
  'deferred'
]);

const DEFERRAL_REASONS = Object.freeze([
  'network-restricted-local-default',
  'sandbox-network-unavailable',
  'registry-auth-unavailable',
  'owner-approved-offline-run'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  '.xtend-test-results/xtend-npm-audit-report.json',
  '.xtend-test-results/xtend-npm-sbom.json',
  '.xtend-test-results/xtend-conditional-network-evidence-report.json'
]);

const REQUIRED_SOURCE_SCHEMAS = Object.freeze([
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
  'xtend.epic12.rc0-gate-matrix.v1',
  'xtend.security.supply-chain-gate-plan.v1',
  'xtend.security.vulnerability-policy.v1'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS,
  'development/XTend-Epic13-Release-Owner-Acceptance-Contract.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-CI-Gate-Matrix.md',
  'development/XTend-RC0-Gate-Matrix.md',
  'development/docs-evidence/legacy-routes/en/release-owner-acceptance.md',
  'docs/supply-chain-gates.md',
  'docs/enterprise-adoption.md'
]);

const COMMAND_ARTIFACTS = Object.freeze([
  {
    id: 'npm-audit-moderate',
    command: 'npm audit --audit-level=moderate',
    jsonCommand: 'npm audit --audit-level=moderate --json',
    expectedArtifact: '.xtend-test-results/xtend-npm-audit-report.json',
    validates: ['vulnerability-policy', 'moderate-or-higher-findings'],
    publishRequired: true
  },
  {
    id: 'npm-sbom-json',
    command: 'npm sbom --sbom-format=cyclonedx --json',
    jsonCommand: 'npm sbom --sbom-format=cyclonedx --json',
    expectedArtifact: '.xtend-test-results/xtend-npm-sbom.json',
    validates: ['dependency-inventory', 'sbom-export'],
    publishRequired: true
  }
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEvidenceRecord(commandArtifact, execution = {}) {
  const status = execution.status || 'deferred';
  const reason = execution.reason || 'network-restricted-local-default';

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
    id: commandArtifact.id,
    command: commandArtifact.command,
    jsonCommand: commandArtifact.jsonCommand,
    expectedArtifact: commandArtifact.expectedArtifact,
    status,
    reason: status === 'deferred' ? reason : null,
    executedAt: execution.executedAt || null,
    artifactPresent: execution.artifactPresent === true,
    ownerDecisionRequired: status === 'deferred',
    localGateBlocking: false,
    publishBlocking: commandArtifact.publishRequired,
    requiredBefore: 'release-owner-publish-acceptance',
    validates: commandArtifact.validates.slice()
  };
}

function summarizeEvidence(records) {
  return records.reduce((summary, record) => {
    summary.total += 1;
    summary.byStatus[record.status] = (summary.byStatus[record.status] || 0) + 1;
    if (record.publishBlocking) summary.publishBlocking.push(record.id);
    if (record.status === 'deferred') summary.deferred.push(record.id);
    if (record.status === 'executed') summary.executed.push(record.id);
    return summary;
  }, {
    total: 0,
    byStatus: {},
    executed: [],
    deferred: [],
    publishBlocking: []
  });
}

function createEpic13ConditionalNetworkEvidencePlan(options = {}) {
  const ownerAcceptance = options.ownerAcceptance || createEpic13ReleaseOwnerAcceptanceContract(options);
  const ownerAcceptanceValidation = options.ownerAcceptanceValidation || validateEpic13ReleaseOwnerAcceptanceContract(ownerAcceptance);
  const ownerAcceptanceReport = options.ownerAcceptanceReport || createEpic13ReleaseOwnerAcceptanceReport({ ...options, contract: ownerAcceptance });
  const rc0Matrix = options.rc0Matrix || createEpic12Rc0GateMatrix(options);
  const rc0MatrixValidation = options.rc0MatrixValidation || validateEpic12Rc0GateMatrix(rc0Matrix);
  const rc0MatrixReport = options.rc0MatrixReport || createEpic12Rc0GateMatrixReport({ ...options, matrix: rc0Matrix });
  const executions = options.executions || {};
  const evidenceRecords = COMMAND_ARTIFACTS.map((commandArtifact) => {
    return createEvidenceRecord(commandArtifact, executions[commandArtifact.id]);
  });
  const evidenceSummary = summarizeEvidence(evidenceRecords);

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    reportSchema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
    deferralSchema: EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
    workpackage: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE,
    status: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE,
    suite: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE,
    steeringDocument: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING,
    contract: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
    workpackageDocument: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC,
    docs: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS,
    localGate: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
    packageScript: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT,
    sourceSchema: EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    sourceReportSchema: EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
    sourceStatus: ownerAcceptance.status,
    sourceReportOk: ownerAcceptanceReport.ok,
    sourceValidationOk: ownerAcceptanceValidation.ok,
    rc0GateMatrixOk: rc0MatrixValidation.ok && rc0MatrixReport.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET,
    commands: CONDITIONAL_NETWORK_COMMANDS.slice(),
    commandArtifacts: clone(COMMAND_ARTIFACTS),
    evidenceRecords,
    evidenceSummary,
    allowedEvidenceStatuses: EVIDENCE_STATUSES.slice(),
    allowedDeferralReasons: DEFERRAL_REASONS.slice(),
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    requiredSourceSchemas: REQUIRED_SOURCE_SCHEMAS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    localDefaultMode: 'defer-with-owner-reason',
    externalNetworkAllowedInLocalGate: false,
    ownerDeferralAllowed: true,
    ownerDeferralRequiredWhenNotExecuted: true,
    publishRequiresExecutedOrOwnerAcceptedDeferral: true,
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: 'WP-E13-13',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13ConditionalNetworkEvidencePlan(plan = createEpic13ConditionalNetworkEvidencePlan()) {
  const errors = [];
  const records = plan && Array.isArray(plan.evidenceRecords) ? plan.evidenceRecords : [];
  const invalidStatuses = records.filter((record) => !EVIDENCE_STATUSES.includes(record.status));
  const invalidReasons = records.filter((record) => record.status === 'deferred' && !DEFERRAL_REASONS.includes(record.reason));

  if (!plan || plan.schema !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA) errors.push(`schema must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA}`);
  if (!plan || plan.deferralSchema !== EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA) errors.push(`deferralSchema must be ${EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS) errors.push(`status must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA) errors.push('source schema must be Release Owner Acceptance');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true || plan.rc0GateMatrixOk !== true) errors.push('source acceptance and RC0 gate matrix must validate');
  if (!plan || plan.targetReadiness !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET) errors.push(`targetReadiness must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET}`);
  CONDITIONAL_NETWORK_COMMANDS.forEach((command) => {
    if (!plan || !plan.commands.includes(command)) errors.push(`conditional network command missing: ${command}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifact) => {
    if (!plan || !plan.requiredArtifacts.includes(artifact)) errors.push(`required artifact missing: ${artifact}`);
  });
  REQUIRED_SOURCE_SCHEMAS.forEach((schema) => {
    if (!plan || !plan.requiredSourceSchemas.includes(schema)) errors.push(`source schema missing: ${schema}`);
  });
  if (!plan || plan.evidenceRecords.length !== COMMAND_ARTIFACTS.length) errors.push('all conditional network commands must have evidence records');
  if (invalidStatuses.length > 0) errors.push(`invalid evidence statuses: ${invalidStatuses.map((record) => record.id).join(', ')}`);
  if (invalidReasons.length > 0) errors.push(`invalid deferral reasons: ${invalidReasons.map((record) => record.id).join(', ')}`);
  if (!plan || plan.evidenceRecords.some((record) => record.localGateBlocking !== false)) errors.push('conditional network records must not block local gate');
  if (!plan || plan.evidenceRecords.some((record) => record.publishBlocking !== true)) errors.push('conditional network records must block publish until executed or owner-accepted');
  if (!plan || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require external network');
  if (!plan || plan.ownerDeferralAllowed !== true || plan.ownerDeferralRequiredWhenNotExecuted !== true) errors.push('owner deferral must be explicit when commands are not executed');
  if (!plan || plan.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!plan || plan.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13ConditionalNetworkEvidenceReport(options = {}) {
  const plan = options.plan || createEpic13ConditionalNetworkEvidencePlan(options);
  const validation = validateEpic13ConditionalNetworkEvidencePlan(plan);

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    commandCount: plan.commands.length,
    evidenceSummary: plan.evidenceSummary,
    requiredArtifactCount: plan.requiredArtifacts.length,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  COMMAND_ARTIFACTS,
  DEFERRAL_REASONS,
  EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC,
  EVIDENCE_STATUSES,
  PUBLISH_BOUNDARY,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_SCHEMAS,
  createEpic13ConditionalNetworkEvidencePlan,
  createEpic13ConditionalNetworkEvidenceReport,
  validateEpic13ConditionalNetworkEvidencePlan
};
