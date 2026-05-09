const {
  KERNEL_BOUNDARY,
  createEpic12Rc0HandoffReport
} = require('./epic12-rc0-handoff');
const {
  EPIC13_RC1_READINESS_REPORT_SCHEMA,
  EPIC13_RC1_READINESS_SCHEMA,
  createEpic13Rc1ReadinessModel,
  createEpic13Rc1ReadinessReport,
  validateEpic13Rc1ReadinessModel
} = require('./epic13-rc1-readiness');

const EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA = 'xtend.epic13.release-owner-acceptance.v1';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA = 'xtend.epic13.release-owner-acceptance-report.v1';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE = 'WP-E13-02';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS = 'accepted-release-owner-acceptance-contract';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET = 'release-owner-acceptance-contract-ready';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE = 'catalog/epic13-release-owner-acceptance.js';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE = 'tests/platform/epic13_release_owner_acceptance_suite.js';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT = 'development/XTend-Epic13-Release-Owner-Acceptance-Contract.md';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC = 'development/WP-E13-02-Release-Owner-Acceptance-Contract-definieren.md';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS = 'docs/release-owner-acceptance.md';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json';
const EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT = 'npm run test:epic13-release-owner-acceptance';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const OWNER_DECISION_STATES = Object.freeze([
  'accepted',
  'deferred',
  'blocked'
]);

const REQUIRED_OWNER_INPUTS = Object.freeze([
  'xtend-release-gate-report',
  'xtend-release-report',
  'xtend-rc0-gate-matrix-report',
  'xtend-epic12-rc0-handoff-report',
  'xtend-epic13-rc1-readiness-report',
  'package-dry-run-output',
  'conditional-network-gate-status',
  'known-residual-policy',
  'migration-notes',
  'publish-boundary-decision'
]);

const REQUIRED_LOCAL_GATES = Object.freeze([
  'epic12-rc0-handoff',
  'epic13-rc1-readiness',
  'release:report',
  'references'
]);

const REQUIRED_SOURCE_SCHEMAS = Object.freeze([
  'xtend.epic12.rc0-handoff.v1',
  EPIC13_RC1_READINESS_SCHEMA,
  EPIC13_RC1_READINESS_REPORT_SCHEMA,
  'xtend.release.checklist-semver-policy.v1',
  'xtend.ci.gate-matrix.v1'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS,
  'development/XTend-Epic13-RC1-Readiness-Modell.md',
  'development/XTend-Epic12-Abschluss-und-RC0-Handoff.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-CI-Gate-Matrix.md',
  'docs/rc1-readiness.md',
  'docs/enterprise-adoption.md'
]);

const OWNER_REVIEW_CHECKLIST = Object.freeze([
  {
    id: 'rc1-readiness-model',
    status: 'accepted',
    artifact: 'xtend.epic13.rc1-production-readiness.v1',
    ownerQuestion: 'Ist der RC0-zu-RC1-Schnitt formal nachvollziehbar?',
    evidence: 'catalog/epic13-rc1-readiness.js'
  },
  {
    id: 'rc0-owner-handoff',
    status: 'accepted',
    artifact: 'xtend.epic12.rc0-handoff.v1',
    ownerQuestion: 'Ist RC0 als Review-Basis akzeptiert?',
    evidence: 'development/XTend-Epic12-Abschluss-und-RC0-Handoff.md'
  },
  {
    id: 'release-report-required',
    status: 'accepted',
    artifact: 'npm run release:report',
    ownerQuestion: 'Bleibt der lokale Release Report ein Pflichtartefakt?',
    evidence: '.xtend-test-results/xtend-release-report.json'
  },
  {
    id: 'package-private-boundary',
    status: 'accepted',
    artifact: PUBLISH_BOUNDARY,
    ownerQuestion: 'Bleibt `private: true` bis zur Owner-Freigabe aktiv?',
    evidence: 'package.json'
  },
  {
    id: 'rmt-kernel-neutrality',
    status: 'accepted',
    artifact: KERNEL_BOUNDARY,
    ownerQuestion: 'Bleibt XTendRMT framework-agnostisch?',
    evidence: 'xtendrmt/rmt-core.esm.js'
  },
  {
    id: 'conditional-network-evidence',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Wurden Audit und SBOM ausgefuehrt oder begruendet deferred?',
    evidence: 'xtend.epic13.conditional-network-evidence.v1'
  },
  {
    id: 'package-dry-run-export-lock',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Ist der Paketinhalt maschinenlesbar gelockt?',
    evidence: 'xtend.epic13.package-export-lock.v1'
  },
  {
    id: 'known-residual-renewal',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Sind RC0-Residuals fuer RC1 geschlossen oder neu akzeptiert?',
    evidence: 'xtend.epic13.known-residual-triage.v1, xtend.epic13.hydration-performance-closure.v1'
  },
  {
    id: 'prod-browser-csp-smoke',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Sind PROD-nahe Browser-, Server- und Trusted-DOM-Pfade geprueft?',
    evidence: 'npm run test:browser, npm run test:manifest-policy'
  },
  {
    id: 'trusted-dom-boundary',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Ist die Trusted-DOM-Boundary fuer Parsedown und RMT HTML browsernah belegt?',
    evidence: 'xtend.epic13.trusted-dom-boundary.v1'
  },
  {
    id: 'visual-owner-artifact',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Gibt es ein fuer Owner reviewbares UI-Artefakt?',
    evidence: 'xtend.epic13.visual-owner-artifact.v1'
  },
  {
    id: 'rmt-production-readiness',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Ist die RMT-first App Shell als PROD-Pfad gebuendelt?',
    evidence: 'xtend.epic13.rmt-production-readiness.v1'
  },
  {
    id: 'docs-rmt-production-hardening',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Ist die Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen gehaertet?',
    evidence: 'xtend.epic13.docs-rmt-production-hardening.v1'
  },
  {
    id: 'rc1-migration-notes',
    status: 'accepted',
    targetWorkpackages: [],
    ownerQuestion: 'Sind Migration Notes und SemVer-Entscheid konsumierbar?',
    evidence: 'xtend.epic13.rc1-migration-notes-semver.v1'
  },
  {
    id: 'rc1-gate-matrix',
    status: 'deferred',
    targetWorkpackages: ['WP-E13-13'],
    ownerQuestion: 'Sind alle RC1-Gates in einer finalen Matrix verbunden?',
    evidence: 'development/XTend-CI-Gate-Matrix.md'
  },
  {
    id: 'automatic-publish-approval',
    status: 'blocked',
    targetWorkpackages: ['WP-E13-14'],
    ownerQuestion: 'Darf ein gruener Gate automatisch publishen?',
    evidence: 'package.json private=true'
  }
]).map((entry) => ({
  targetWorkpackages: [],
  ...entry
}));

function summarizeChecklist(checklist) {
  return checklist.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1;
    summary.total += 1;
    summary.byStatus[item.status].push(item.id);
    return summary;
  }, {
    total: 0,
    accepted: 0,
    deferred: 0,
    blocked: 0,
    byStatus: {
      accepted: [],
      deferred: [],
      blocked: []
    }
  });
}

function createEpic13ReleaseOwnerAcceptanceContract(options = {}) {
  const rc1ReadinessModel = options.rc1ReadinessModel || createEpic13Rc1ReadinessModel(options);
  const rc1ReadinessValidation = options.rc1ReadinessValidation || validateEpic13Rc1ReadinessModel(rc1ReadinessModel);
  const rc1ReadinessReport = options.rc1ReadinessReport || createEpic13Rc1ReadinessReport({ ...options, model: rc1ReadinessModel });
  const rc0HandoffReport = options.rc0HandoffReport || createEpic12Rc0HandoffReport(options);
  const reviewChecklist = OWNER_REVIEW_CHECKLIST.map((entry) => ({
    ...entry,
    targetWorkpackages: entry.targetWorkpackages.slice()
  }));
  const decisionSummary = summarizeChecklist(reviewChecklist);

  return {
    schema: EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    reportSchema: EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
    workpackage: EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE,
    status: EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE,
    suite: EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE,
    steeringDocument: EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING,
    contract: EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
    workpackageDocument: EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC,
    docs: EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS,
    localGate: EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
    packageScript: EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT,
    sourceSchema: EPIC13_RC1_READINESS_SCHEMA,
    sourceReportSchema: EPIC13_RC1_READINESS_REPORT_SCHEMA,
    sourceStatus: rc1ReadinessModel.status,
    sourceTargetReadiness: rc1ReadinessModel.targetReadiness,
    sourceReportOk: rc1ReadinessReport.ok,
    sourceValidationOk: rc1ReadinessValidation.ok,
    rc0HandoffOk: rc0HandoffReport.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET,
    ownerDecisionStates: OWNER_DECISION_STATES.slice(),
    reviewChecklist,
    decisionSummary,
    requiredOwnerInputs: REQUIRED_OWNER_INPUTS.slice(),
    requiredLocalGates: REQUIRED_LOCAL_GATES.slice(),
    requiredSourceSchemas: REQUIRED_SOURCE_SCHEMAS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    deferralPolicy: {
      allowed: true,
      ownerReasonRequired: true,
      targetWorkpackageRequired: true,
      publishAllowedForDeferredItems: false
    },
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: 'WP-E13-13',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    automaticPublishApproval: false,
    packagePrivateRequired: true
  };
}

function validateEpic13ReleaseOwnerAcceptanceContract(contract = createEpic13ReleaseOwnerAcceptanceContract()) {
  const errors = [];
  const checklist = contract && Array.isArray(contract.reviewChecklist) ? contract.reviewChecklist : [];
  const invalidStatuses = checklist.filter((entry) => !OWNER_DECISION_STATES.includes(entry.status));
  const deferredWithoutTargets = checklist.filter((entry) => entry.status === 'deferred' && (!Array.isArray(entry.targetWorkpackages) || entry.targetWorkpackages.length === 0));
  const blockedPublish = checklist.find((entry) => entry.id === 'automatic-publish-approval' && entry.status === 'blocked');

  if (!contract || contract.schema !== EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA) errors.push(`schema must be ${EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA}`);
  if (!contract || contract.reportSchema !== EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA}`);
  if (!contract || contract.workpackage !== EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE}`);
  if (!contract || contract.status !== EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS) errors.push(`status must be ${EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS}`);
  if (!contract || contract.sourceSchema !== EPIC13_RC1_READINESS_SCHEMA) errors.push('source schema must be Epic 13 RC1 readiness');
  if (!contract || contract.sourceValidationOk !== true || contract.sourceReportOk !== true || contract.rc0HandoffOk !== true) errors.push('source readiness and RC0 handoff must validate');
  if (!contract || contract.targetReadiness !== EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET) errors.push(`targetReadiness must be ${EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET}`);
  if (!contract || contract.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!contract || contract.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!contract || contract.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!contract || contract.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!contract || contract.publishAllowed !== false || contract.automaticPublishApproval !== false || contract.packagePrivateRequired !== true) errors.push('publish must remain blocked and private');
  if (!contract || !Array.isArray(contract.ownerDecisionStates) || contract.ownerDecisionStates.join('|') !== OWNER_DECISION_STATES.join('|')) errors.push('owner decision states must be accepted/deferred/blocked');
  if (invalidStatuses.length > 0) errors.push(`invalid owner decision states: ${invalidStatuses.map((entry) => entry.id).join(', ')}`);
  if (deferredWithoutTargets.length > 0) errors.push(`deferred items must name target workpackages: ${deferredWithoutTargets.map((entry) => entry.id).join(', ')}`);
  if (!blockedPublish) errors.push('automatic publish approval must be blocked');
  if (!contract || contract.decisionSummary.accepted < 5) errors.push('owner checklist must accept RC1 baseline items');
  if (!contract || contract.decisionSummary.deferred < 1) errors.push('owner checklist must defer remaining RC1 hardening items');
  if (!contract || contract.decisionSummary.blocked < 1) errors.push('owner checklist must block automatic publish');
  REQUIRED_OWNER_INPUTS.forEach((input) => {
    if (!contract || !contract.requiredOwnerInputs.includes(input)) errors.push(`owner input missing: ${input}`);
  });
  REQUIRED_LOCAL_GATES.forEach((gate) => {
    if (!contract || !contract.requiredLocalGates.includes(gate)) errors.push(`local gate missing: ${gate}`);
  });
  REQUIRED_SOURCE_SCHEMAS.forEach((schema) => {
    if (!contract || !contract.requiredSourceSchemas.includes(schema)) errors.push(`source schema missing: ${schema}`);
  });

  return {
    schema: EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13ReleaseOwnerAcceptanceReport(options = {}) {
  const contract = options.contract || createEpic13ReleaseOwnerAcceptanceContract(options);
  const validation = validateEpic13ReleaseOwnerAcceptanceContract(contract);

  return {
    schema: EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    contract,
    decisionSummary: contract.decisionSummary,
    checklistCount: contract.reviewChecklist.length,
    requiredOwnerInputCount: contract.requiredOwnerInputs.length,
    publishAllowed: contract.publishAllowed,
    automaticPublishApproval: contract.automaticPublishApproval,
    nextWorkpackage: contract.nextWorkpackage
  };
}

module.exports = {
  EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC,
  OWNER_DECISION_STATES,
  OWNER_REVIEW_CHECKLIST,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_LOCAL_GATES,
  REQUIRED_OWNER_INPUTS,
  REQUIRED_SOURCE_SCHEMAS,
  createEpic13ReleaseOwnerAcceptanceContract,
  createEpic13ReleaseOwnerAcceptanceReport,
  validateEpic13ReleaseOwnerAcceptanceContract
};
