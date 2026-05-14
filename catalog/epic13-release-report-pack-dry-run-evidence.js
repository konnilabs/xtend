const {
  createEpic13Rc1GateMatrixCiHandoffPlan,
  createEpic13Rc1GateMatrixCiHandoffReport,
  validateEpic13Rc1GateMatrixCiHandoffPlan
} = require('./epic13-rc1-gate-matrix-ci-handoff');
const {
  PACKAGE_DRY_RUN_ARTIFACT,
  PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
  PACKAGE_EXPORT_SURFACE_ARTIFACT
} = require('./epic13-package-export-lock');

const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA = 'xtend.epic13.release-report-pack-dry-run-evidence.v1';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA = 'xtend.epic13.release-report-pack-dry-run-evidence-report.v1';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE = 'DPF-WP-02-release-report-pack-dry-run';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS = 'accepted-release-report-pack-dry-run-evidence';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET = 'release-owner-artifacts-reproducible';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE = 'catalog/epic13-release-report-pack-dry-run-evidence.js';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE = 'tests/platform/epic13_release_report_pack_dry_run_evidence_suite.js';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT = 'development/XTend-Epic13-Release-Report-und-Pack-Dry-Run-Evidence.md';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC = 'development/DPF-WP-02-Release-Report-und-Pack-Dry-Run-Evidence.md';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS = 'docs/release-report-pack-dry-run-evidence.md';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence --json';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT = 'npm run test:epic13-release-report-pack-dry-run-evidence';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json';
const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT = './catalog/epic13-release-report-pack-dry-run-evidence';
const RELEASE_REPORT_COMMAND = 'npm run release:report';
const RELEASE_REPORT_ARTIFACT = '.xtend-test-results/xtend-release-report.json';
const PACK_DRY_RUN_COMMAND = 'npm run pack:dry-run';
const PACK_DRY_RUN_REPORT_COMMAND = 'npm run pack:dry-run:report';
const PACK_DRY_RUN_RAW_COMMAND = 'npm run pack:dry-run:raw';
const NEXT_WORKPACKAGE = 'DPF-WP-03-conditional-network-evidence-ci';
const NEXT_DECISION = 'conditional-network-evidence-ci';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const REQUIRED_OWNER_EVIDENCE = Object.freeze([
  {
    id: 'release-report',
    command: RELEASE_REPORT_COMMAND,
    artifact: RELEASE_REPORT_ARTIFACT,
    schema: 'xtend.test.report.v1',
    reproducible: true,
    ownerVisible: true,
    networkRequired: false
  },
  {
    id: 'pack-dry-run',
    command: PACK_DRY_RUN_COMMAND,
    artifact: PACKAGE_DRY_RUN_ARTIFACT,
    schema: 'npm-pack-dry-run-json-array',
    reproducible: true,
    ownerVisible: true,
    networkRequired: false
  },
  {
    id: 'package-export-surface-lock',
    command: PACK_DRY_RUN_COMMAND,
    artifact: PACKAGE_EXPORT_SURFACE_ARTIFACT,
    schema: 'xtend.epic13.package-export-surface.v1',
    reproducible: true,
    ownerVisible: true,
    networkRequired: false
  },
  {
    id: 'package-export-lock-report',
    command: PACK_DRY_RUN_COMMAND,
    artifact: PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
    schema: 'xtend.epic13.package-export-lock-report.v1',
    reproducible: true,
    ownerVisible: true,
    networkRequired: false
  }
]);

const REQUIRED_REFERENCE_PATHS = Object.freeze([
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS,
  'scripts/capture_pack_dry_run.js',
  'development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md',
  'docs/rc1-gate-matrix-ci-handoff.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-CI-Gate-Matrix.md',
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

function createEpic13ReleaseReportPackDryRunEvidencePlan(options = {}) {
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const rc1Handoff = options.rc1Handoff || createEpic13Rc1GateMatrixCiHandoffPlan(options);
  const rc1HandoffValidation = options.rc1HandoffValidation || validateEpic13Rc1GateMatrixCiHandoffPlan(rc1Handoff);
  const rc1HandoffReport = options.rc1HandoffReport || createEpic13Rc1GateMatrixCiHandoffReport({ ...options, plan: rc1Handoff });
  const scripts = packageManifest.scripts || {};

  return {
    schema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
    reportSchema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
    workpackage: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE,
    status: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE,
    suite: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE,
    contract: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT,
    workpackageDocument: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC,
    docs: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS,
    localGate: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE,
    packageScript: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT,
    packageExport: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT,
    reportArtifact: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT,
    targetReadiness: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET,
    sourceSchema: rc1Handoff.schema,
    sourceReportSchema: rc1Handoff.reportSchema,
    sourceValidationOk: rc1HandoffValidation.ok,
    sourceReportOk: rc1HandoffReport.ok,
    releaseReportCommand: RELEASE_REPORT_COMMAND,
    releaseReportArtifact: RELEASE_REPORT_ARTIFACT,
    packDryRunCommand: PACK_DRY_RUN_COMMAND,
    packDryRunReportCommand: PACK_DRY_RUN_REPORT_COMMAND,
    packDryRunRawCommand: PACK_DRY_RUN_RAW_COMMAND,
    packDryRunArtifact: PACKAGE_DRY_RUN_ARTIFACT,
    packageExportSurfaceArtifact: PACKAGE_EXPORT_SURFACE_ARTIFACT,
    packageExportLockReportArtifact: PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
    packageScripts: {
      releaseReport: scripts['release:report'],
      packDryRun: scripts['pack:dry-run'],
      packDryRunReport: scripts['pack:dry-run:report'],
      packDryRunRaw: scripts['pack:dry-run:raw']
    },
    ownerEvidence: REQUIRED_OWNER_EVIDENCE.map((entry) => ({ ...entry })),
    referencePaths: REQUIRED_REFERENCE_PATHS.slice(),
    rc1HandoffReferences: [
      RELEASE_REPORT_ARTIFACT,
      PACKAGE_DRY_RUN_ARTIFACT,
      PACKAGE_EXPORT_SURFACE_ARTIFACT,
      PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
      EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT
    ],
    auditSbomIncluded: false,
    publicPublishDecisionIncluded: false,
    licenseDecisionIncluded: false,
    docsMenuSlug: 'release-report-pack-dry-run-evidence',
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13ReleaseReportPackDryRunEvidencePlan(plan = createEpic13ReleaseReportPackDryRunEvidencePlan()) {
  const errors = [];
  const evidence = plan && Array.isArray(plan.ownerEvidence) ? plan.ownerEvidence : [];
  const references = plan && Array.isArray(plan.referencePaths) ? plan.referencePaths : [];

  if (!plan || plan.schema !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA) errors.push(`schema must be ${EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS) errors.push(`status must be ${EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS}`);
  if (!plan || plan.targetReadiness !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET) errors.push(`targetReadiness must be ${EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET}`);
  if (!plan || plan.sourceSchema !== 'xtend.epic13.rc1-gate-matrix-ci-handoff.v1') errors.push('source schema must be RC1 gate matrix CI handoff');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('RC1 gate matrix source must validate');
  if (!plan || plan.packageExport !== EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT) errors.push('package export must be registered');
  if (!plan || plan.packageScripts.releaseReport !== 'node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-release-report.json') errors.push('release:report must write xtend-release-report.json');
  if (!plan || plan.packageScripts.packDryRun !== 'node scripts/capture_pack_dry_run.js') errors.push('pack:dry-run must write reproducible pack artifacts');
  if (!plan || plan.packageScripts.packDryRunReport !== 'node scripts/capture_pack_dry_run.js') errors.push('pack:dry-run:report must stay as compatibility alias');
  if (!plan || plan.packageScripts.packDryRunRaw !== 'npm pack --dry-run') errors.push('pack:dry-run:raw must expose raw npm dry-run output');

  REQUIRED_OWNER_EVIDENCE.forEach((required) => {
    const entry = evidence.find((candidate) => candidate.id === required.id);
    if (!entry) errors.push(`owner evidence missing: ${required.id}`);
    if (entry && entry.artifact !== required.artifact) errors.push(`owner evidence artifact mismatch: ${required.id}`);
    if (entry && entry.reproducible !== true) errors.push(`owner evidence must be reproducible: ${required.id}`);
    if (entry && entry.ownerVisible !== true) errors.push(`owner evidence must be owner-visible: ${required.id}`);
    if (entry && entry.networkRequired !== false) errors.push(`owner evidence must stay network-free: ${required.id}`);
  });
  REQUIRED_REFERENCE_PATHS.forEach((referencePath) => {
    if (!references.includes(referencePath)) errors.push(`reference path missing: ${referencePath}`);
  });
  [RELEASE_REPORT_ARTIFACT, PACKAGE_DRY_RUN_ARTIFACT, PACKAGE_EXPORT_SURFACE_ARTIFACT, PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT].forEach((artifact) => {
    if (!plan || !plan.rc1HandoffReferences.includes(artifact)) errors.push(`RC1 handoff reference missing: ${artifact}`);
  });
  if (!plan || plan.auditSbomIncluded !== false || plan.publicPublishDecisionIncluded !== false || plan.licenseDecisionIncluded !== false) errors.push('audit/SBOM, public publish and license decisions must remain outside DPF-WP-02');
  if (!plan || plan.docsMenuSlug !== 'release-report-pack-dry-run-evidence') errors.push('docs menu slug must be release-report-pack-dry-run-evidence');
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13ReleaseReportPackDryRunEvidenceReport(options = {}) {
  const plan = options.plan || createEpic13ReleaseReportPackDryRunEvidencePlan(options);
  const validation = validateEpic13ReleaseReportPackDryRunEvidencePlan(plan);

  return {
    schema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    ownerEvidenceCount: plan.ownerEvidence.length,
    referencePathCount: plan.referencePaths.length,
    releaseReportArtifact: plan.releaseReportArtifact,
    packDryRunArtifact: plan.packDryRunArtifact,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PACK_DRY_RUN_COMMAND,
  PACK_DRY_RUN_RAW_COMMAND,
  PACK_DRY_RUN_REPORT_COMMAND,
  PUBLISH_BOUNDARY,
  RELEASE_REPORT_ARTIFACT,
  RELEASE_REPORT_COMMAND,
  REQUIRED_OWNER_EVIDENCE,
  REQUIRED_REFERENCE_PATHS,
  createEpic13ReleaseReportPackDryRunEvidencePlan,
  createEpic13ReleaseReportPackDryRunEvidenceReport,
  validateEpic13ReleaseReportPackDryRunEvidencePlan
};
