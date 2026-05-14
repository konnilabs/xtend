const {
  COMMAND_ARTIFACTS,
  DEFERRAL_REASONS,
  EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
  REQUIRED_ARTIFACTS,
  createEpic13ConditionalNetworkEvidencePlan,
  createEpic13ConditionalNetworkEvidenceReport,
  validateEpic13ConditionalNetworkEvidencePlan
} = require('./epic13-conditional-network-evidence');
const {
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
  createEpic13ReleaseReportPackDryRunEvidencePlan,
  createEpic13ReleaseReportPackDryRunEvidenceReport,
  validateEpic13ReleaseReportPackDryRunEvidencePlan
} = require('./epic13-release-report-pack-dry-run-evidence');

const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA = 'xtend.epic13.conditional-network-evidence-ci.v1';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA = 'xtend.epic13.conditional-network-evidence-ci-report.v1';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE = 'DPF-WP-03-conditional-network-evidence-ci';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS = 'accepted-conditional-network-evidence-ci';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET = 'conditional-network-evidence-ci-ready';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE = 'catalog/epic13-conditional-network-evidence-ci.js';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE = 'tests/platform/epic13_conditional_network_evidence_ci_suite.js';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT = 'development/XTend-Epic13-Conditional-Network-Evidence-CI-Contract.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC = 'development/DPF-WP-03-Conditional-Network-Evidence-CI.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS = 'docs/conditional-network-evidence-ci.md';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT = 'npm run test:epic13-conditional-network-evidence-ci';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT = './catalog/epic13-conditional-network-evidence-ci';
const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json';
const CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT = 'node scripts/capture_conditional_network_evidence.js';
const CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND = 'npm run conditional-network:evidence';
const CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE = 'scripts/capture_conditional_network_evidence.js';
const CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW = '.github/workflows/xtend-default-gates.yml';
const CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB = 'conditional-network-evidence';
const CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT = 'xtend-conditional-network-evidence-node-26';
const NEXT_WORKPACKAGE = 'DPF-WP-04-visual-pixel-evidence-storage';
const NEXT_DECISION = 'visual-pixel-evidence-storage';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const CI_EVIDENCE_ARTIFACTS = Object.freeze([
  '.xtend-test-results/xtend-npm-audit-report.json',
  '.xtend-test-results/xtend-npm-sbom.json',
  '.xtend-test-results/xtend-conditional-network-evidence-report.json'
]);

const REQUIRED_REFERENCE_PATHS = Object.freeze([
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW,
  'catalog/epic13-conditional-network-evidence.js',
  'catalog/epic13-release-report-pack-dry-run-evidence.js',
  'development/XTend-Epic13-Conditional-Network-Evidence-Contract.md',
  'development/XTend-Epic13-Release-Report-und-Pack-Dry-Run-Evidence.md',
  'development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md',
  'docs/conditional-network-evidence.md',
  'docs/release-report-pack-dry-run-evidence.md',
  'docs/rc1-gate-matrix-ci-handoff.md',
  'development/XTend-CI-Gate-Matrix.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
  'docs/README.md',
  'docs/menu.json',
  'README.md',
  'CHANGELOG.md',
  'tests/README.md',
  'package.json',
  'xtend-builder/scaffold.config.js'
]);

function getDefaultPackageManifest() {
  return require('../package.json');
}

function createEpic13ConditionalNetworkEvidenceCiPlan(options = {}) {
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const conditionalPlan = options.conditionalPlan || createEpic13ConditionalNetworkEvidencePlan(options);
  const conditionalValidation = options.conditionalValidation || validateEpic13ConditionalNetworkEvidencePlan(conditionalPlan);
  const conditionalReport = options.conditionalReport || createEpic13ConditionalNetworkEvidenceReport({ ...options, plan: conditionalPlan });
  const releaseEvidence = options.releaseEvidence || createEpic13ReleaseReportPackDryRunEvidencePlan(options);
  const releaseEvidenceValidation = options.releaseEvidenceValidation || validateEpic13ReleaseReportPackDryRunEvidencePlan(releaseEvidence);
  const releaseEvidenceReport = options.releaseEvidenceReport || createEpic13ReleaseReportPackDryRunEvidenceReport({ ...options, plan: releaseEvidence });
  const scripts = packageManifest.scripts || {};

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
    reportSchema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA,
    workpackage: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE,
    status: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE,
    suite: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE,
    contract: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT,
    workpackageDocument: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC,
    docs: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS,
    localGate: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE,
    packageScript: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT,
    packageExport: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT,
    reportArtifact: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT,
    targetReadiness: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET,
    sourceSchema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    sourceReportSchema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
    sourceValidationOk: conditionalValidation.ok,
    sourceReportOk: conditionalReport.ok,
    releaseEvidenceSchema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
    releaseEvidenceReportSchema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
    releaseEvidenceValidationOk: releaseEvidenceValidation.ok,
    releaseEvidenceReportOk: releaseEvidenceReport.ok,
    captureScript: CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT,
    captureCommand: CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND,
    captureModule: CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE,
    workflow: {
      path: CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW,
      jobId: CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB,
      nodeVersion: '26.x',
      command: CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND,
      executeEnv: 'XTEND_CONDITIONAL_NETWORK_EXECUTE=1',
      artifactName: CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT,
      artifactPaths: CI_EVIDENCE_ARTIFACTS.slice(),
      ifCondition: "github.event_name != 'pull_request'"
    },
    packageScripts: {
      capture: scripts['conditional-network:evidence'],
      localGate: scripts['test:epic13-conditional-network-evidence-ci']
    },
    commands: COMMAND_ARTIFACTS.map((entry) => ({
      id: entry.id,
      command: entry.command,
      jsonCommand: entry.jsonCommand,
      expectedArtifact: entry.expectedArtifact,
      ciMode: 'execute-or-owner-deferral',
      publishBlocking: true
    })),
    evidenceArtifacts: CI_EVIDENCE_ARTIFACTS.slice(),
    expectedDeferralSchema: EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
    allowedDeferralReasons: DEFERRAL_REASONS.slice(),
    localGateRequiresNetwork: false,
    ciJobRequiresNetwork: true,
    ownerDeferralAllowed: true,
    publishRequiresExecutedOrOwnerAcceptedDeferral: true,
    dependencyUpgradesIncluded: false,
    vulnerabilityFixesIncluded: false,
    publicPublishDecisionIncluded: false,
    docsMenuSlug: 'conditional-network-evidence-ci',
    referencePaths: REQUIRED_REFERENCE_PATHS.slice(),
    rc1HandoffReferences: [
      '.xtend-test-results/xtend-npm-audit-report.json',
      '.xtend-test-results/xtend-npm-sbom.json',
      '.xtend-test-results/xtend-conditional-network-evidence-report.json',
      EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT
    ],
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13ConditionalNetworkEvidenceCiPlan(plan = createEpic13ConditionalNetworkEvidenceCiPlan()) {
  const errors = [];
  const references = plan && Array.isArray(plan.referencePaths) ? plan.referencePaths : [];
  const artifacts = plan && Array.isArray(plan.evidenceArtifacts) ? plan.evidenceArtifacts : [];
  const workflowArtifacts = plan && plan.workflow && Array.isArray(plan.workflow.artifactPaths) ? plan.workflow.artifactPaths : [];

  if (!plan || plan.schema !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA) errors.push(`schema must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS) errors.push(`status must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS}`);
  if (!plan || plan.targetReadiness !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET) errors.push(`targetReadiness must be ${EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET}`);
  if (!plan || plan.sourceSchema !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA) errors.push('source schema must be Conditional Network Evidence');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('Conditional Network Evidence source must validate');
  if (!plan || plan.releaseEvidenceSchema !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA) errors.push('release evidence source schema must be DPF-WP-02');
  if (!plan || plan.releaseEvidenceValidationOk !== true || plan.releaseEvidenceReportOk !== true) errors.push('DPF-WP-02 release evidence source must validate');
  if (!plan || plan.packageScripts.capture !== CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT) errors.push('conditional-network:evidence must capture audit/SBOM evidence');
  if (!plan || plan.packageScripts.localGate !== 'node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci') errors.push('package local gate script missing');
  if (!plan || plan.captureScript !== CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT) errors.push('capture script must stay stable');
  if (!plan || plan.captureCommand !== CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND) errors.push('capture command must stay stable');
  if (!plan || !plan.workflow || plan.workflow.path !== CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW) errors.push('workflow path must be xtend-default-gates');
  if (!plan || !plan.workflow || plan.workflow.jobId !== CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB) errors.push('workflow job id must be conditional-network-evidence');
  if (!plan || !plan.workflow || plan.workflow.command !== CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND) errors.push('workflow must run conditional-network:evidence');
  if (!plan || !plan.workflow || plan.workflow.executeEnv !== 'XTEND_CONDITIONAL_NETWORK_EXECUTE=1') errors.push('workflow must opt into network execution');
  if (!plan || !plan.workflow || plan.workflow.artifactName !== CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT) errors.push('workflow artifact name must be stable');
  CI_EVIDENCE_ARTIFACTS.forEach((artifact) => {
    if (!artifacts.includes(artifact)) errors.push(`evidence artifact missing: ${artifact}`);
    if (!workflowArtifacts.includes(artifact)) errors.push(`workflow artifact path missing: ${artifact}`);
    if (!plan || !plan.rc1HandoffReferences.includes(artifact)) errors.push(`RC1 handoff artifact missing: ${artifact}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifact) => {
    if (!artifacts.includes(artifact)) errors.push(`existing network artifact missing: ${artifact}`);
  });
  COMMAND_ARTIFACTS.forEach((entry) => {
    const command = plan && Array.isArray(plan.commands) ? plan.commands.find((candidate) => candidate.id === entry.id) : null;
    if (!command) errors.push(`command missing: ${entry.id}`);
    if (command && command.command !== entry.command) errors.push(`command mismatch: ${entry.id}`);
    if (command && command.jsonCommand !== entry.jsonCommand) errors.push(`json command mismatch: ${entry.id}`);
    if (command && command.expectedArtifact !== entry.expectedArtifact) errors.push(`artifact mismatch: ${entry.id}`);
    if (command && command.ciMode !== 'execute-or-owner-deferral') errors.push(`ci mode mismatch: ${entry.id}`);
  });
  if (!plan || plan.expectedDeferralSchema !== EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA) errors.push('deferral schema must stay conditional network deferral');
  DEFERRAL_REASONS.forEach((reason) => {
    if (!plan || !plan.allowedDeferralReasons.includes(reason)) errors.push(`deferral reason missing: ${reason}`);
  });
  REQUIRED_REFERENCE_PATHS.forEach((referencePath) => {
    if (!references.includes(referencePath)) errors.push(`reference path missing: ${referencePath}`);
  });
  if (!plan || plan.localGateRequiresNetwork !== false) errors.push('local gate must remain network-free');
  if (!plan || plan.ciJobRequiresNetwork !== true) errors.push('CI job must be the network execution boundary');
  if (!plan || plan.ownerDeferralAllowed !== true || plan.publishRequiresExecutedOrOwnerAcceptedDeferral !== true) errors.push('owner deferral and publish blocking must stay explicit');
  if (!plan || plan.dependencyUpgradesIncluded !== false || plan.vulnerabilityFixesIncluded !== false || plan.publicPublishDecisionIncluded !== false) errors.push('dependency upgrades, vulnerability fixes and public publish must remain outside DPF-WP-03');
  if (!plan || plan.docsMenuSlug !== 'conditional-network-evidence-ci') errors.push('docs menu slug must be conditional-network-evidence-ci');
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13ConditionalNetworkEvidenceCiReport(options = {}) {
  const plan = options.plan || createEpic13ConditionalNetworkEvidenceCiPlan(options);
  const validation = validateEpic13ConditionalNetworkEvidenceCiPlan(plan);

  return {
    schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    commandCount: plan.commands.length,
    evidenceArtifactCount: plan.evidenceArtifacts.length,
    referencePathCount: plan.referencePaths.length,
    workflowJob: plan.workflow.jobId,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  CI_EVIDENCE_ARTIFACTS,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_REFERENCE_PATHS,
  createEpic13ConditionalNetworkEvidenceCiPlan,
  createEpic13ConditionalNetworkEvidenceCiReport,
  validateEpic13ConditionalNetworkEvidenceCiPlan
};
