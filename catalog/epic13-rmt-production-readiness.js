const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
  createEpic13VisualOwnerArtifactPlan,
  createEpic13VisualOwnerArtifactReport,
  validateEpic13VisualOwnerArtifactPlan
} = require('./epic13-visual-owner-artifact');

const EPIC13_RMT_PRODUCTION_READINESS_SCHEMA = 'xtend.epic13.rmt-production-readiness.v1';
const EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA = 'xtend.epic13.rmt-production-readiness-report.v1';
const EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE = 'WP-E13-09';
const EPIC13_RMT_PRODUCTION_READINESS_STATUS = 'accepted-rmt-production-readiness-bundling';
const EPIC13_RMT_PRODUCTION_READINESS_TARGET = 'rmt-first-production-readiness-bundled';
const EPIC13_RMT_PRODUCTION_READINESS_MODULE = 'catalog/epic13-rmt-production-readiness.js';
const EPIC13_RMT_PRODUCTION_READINESS_SUITE = 'tests/platform/epic13_rmt_production_readiness_suite.js';
const EPIC13_RMT_PRODUCTION_READINESS_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_RMT_PRODUCTION_READINESS_CONTRACT = 'development/XTend-Epic13-RMT-Production-Readiness-Contract.md';
const EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC = 'development/WP-E13-09-RMT-first-App-Production-Readiness-Gate-buendeln.md';
const EPIC13_RMT_PRODUCTION_READINESS_DOCS = 'docs/rmt-production-readiness.md';
const EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json';
const EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT = 'npm run test:epic13-rmt-production-readiness';
const EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-rmt-production-readiness-report.json';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';
const NEXT_DECISION = 'rc1-gate-matrix-ci-handoff';
const NEXT_WORKPACKAGE = 'WP-E13-13';

const REQUIRED_RMT_SOURCE_GATES = Object.freeze([
  'npm run test:rmt-compatibility',
  'npm run test:rmt-first-class-app',
  'npm run test:rmt-first-demo-app',
  'npm run test:rmt-artifact-parity',
  'npm run test:rmt-component-fabric-ingestion',
  'npm run test:rmt-component-lifecycle-telemetry',
  'npm run test:epic13-visual-owner-artifact'
]);

const REQUIRED_RMT_DOMAINS = Object.freeze([
  'app-shell',
  'routing',
  'components',
  'fabric',
  'lanes',
  'diagnostics',
  'artifact-parity',
  'kernel-boundary'
]);

const REQUIRED_RMT_ARTIFACTS = Object.freeze([
  'tests/fixtures/rmt-first-class-xtend-app.rmt',
  'xtendrmt/rmt-first-demo-app.rmt',
  'xtendrmt/rmt-first-demo-app.js',
  'tests/browser/fixtures/rmt-first-demo-app-smoke.html',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.d.ts',
  'xtendrmt/rmt.schema.json',
  'xtendrmt/rmt-manifest.json'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_RMT_PRODUCTION_READINESS_STEERING,
  EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
  EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC,
  EPIC13_RMT_PRODUCTION_READINESS_DOCS,
  'development/XTend-RMT-First-Class-App-Authoring.md',
  'development/WP-E10-13-RMT-first-Demo-App-ohne-manuelle-Shell-bauen.md',
  'development/XTend-Fabric-Component-Compatibility-v2.md',
  'development/XTend-Component-Lifecycle-Telemetry-Contract.md',
  'docs/rmt-first-xtend-apps.md',
  'docs/en/rmt-first-demo-app.md',
  'docs/xtendrmt-app-dsl.md',
  'docs/xtendrmt-native-authoring.md',
  'docs/xtend-fabric-rmt-lane-mapping.md',
  'docs/visual-owner-artifacts.md',
  'docs/enterprise-adoption.md'
]);

const RMT_EVIDENCE_RECORDS = Object.freeze([
  {
    id: 'rmt-compatibility',
    command: 'npm run test:rmt-compatibility',
    schema: 'xtend.scaffold.rmt-compatibility-binding.v1',
    domains: ['kernel-boundary', 'artifact-parity', 'diagnostics'],
    evidence: 'tests/rmt/rmt_compatibility_suite.js',
    status: 'covered'
  },
  {
    id: 'rmt-first-class-app',
    command: 'npm run test:rmt-first-class-app',
    schema: 'xtend.rmt.first-class-app-authoring.v1',
    domains: ['app-shell', 'routing', 'components', 'lanes', 'diagnostics'],
    evidence: 'tests/fixtures/rmt-first-class-xtend-app.rmt',
    status: 'covered'
  },
  {
    id: 'rmt-first-demo-app',
    command: 'npm run test:rmt-first-demo-app',
    schema: 'xtend.epic10.rmt-first-demo-app.v1',
    domains: ['app-shell', 'routing', 'components', 'fabric', 'lanes', 'diagnostics'],
    evidence: 'xtendrmt/rmt-first-demo-app.rmt',
    status: 'covered'
  },
  {
    id: 'rmt-artifact-parity',
    command: 'npm run test:rmt-artifact-parity',
    schema: 'xtend.rmt.artifact-parity.v1',
    domains: ['artifact-parity', 'kernel-boundary'],
    evidence: 'scripts/verify_xtendrmt_artifact_parity.js',
    status: 'covered'
  },
  {
    id: 'component-fabric-lane-ingestion',
    command: 'npm run test:rmt-component-fabric-ingestion',
    schema: 'xtend.component.fabric-lane-ingestion.v2',
    domains: ['fabric', 'lanes', 'components'],
    evidence: 'tests/rmt/rmt_component_fabric_lane_ingestion_suite.js',
    status: 'covered'
  },
  {
    id: 'component-lifecycle-telemetry',
    command: 'npm run test:rmt-component-lifecycle-telemetry',
    schema: 'xtend.component.lifecycle-telemetry.v1',
    domains: ['fabric', 'diagnostics', 'components'],
    evidence: 'tests/rmt/rmt_component_lifecycle_telemetry_suite.js',
    status: 'covered'
  },
  {
    id: 'visual-owner-artifact',
    command: 'npm run test:epic13-visual-owner-artifact',
    schema: EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    domains: ['diagnostics'],
    evidence: 'tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json',
    status: 'covered'
  }
]);

function unique(values) {
  return [...new Set(values)];
}

function createEpic13RmtProductionReadinessPlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13VisualOwnerArtifactPlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13VisualOwnerArtifactPlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13VisualOwnerArtifactReport({ ...options, plan: sourcePlan });
  const evidenceRecords = RMT_EVIDENCE_RECORDS.map((record) => ({
    ...record,
    domains: record.domains.slice()
  }));
  const coveredDomains = unique(evidenceRecords.flatMap((record) => record.domains));
  const missingDomains = REQUIRED_RMT_DOMAINS.filter((domain) => !coveredDomains.includes(domain));

  return {
    schema: EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    reportSchema: EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
    workpackage: EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE,
    status: EPIC13_RMT_PRODUCTION_READINESS_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_RMT_PRODUCTION_READINESS_MODULE,
    suite: EPIC13_RMT_PRODUCTION_READINESS_SUITE,
    steeringDocument: EPIC13_RMT_PRODUCTION_READINESS_STEERING,
    contract: EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
    workpackageDocument: EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC,
    docs: EPIC13_RMT_PRODUCTION_READINESS_DOCS,
    localGate: EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
    packageScript: EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT,
    reportArtifact: EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT,
    sourceSchema: EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    sourceReportSchema: EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_RMT_PRODUCTION_READINESS_TARGET,
    appAuthoringSchema: 'xtend.rmt.first-class-app-authoring.v1',
    demoAppSchema: 'xtend.epic10.rmt-first-demo-app.v1',
    artifactParitySchema: 'xtend.rmt.artifact-parity.v1',
    fabricLaneIngestionSchema: 'xtend.component.fabric-lane-ingestion.v2',
    lifecycleTelemetrySchema: 'xtend.component.lifecycle-telemetry.v1',
    requiredDomains: REQUIRED_RMT_DOMAINS.slice(),
    coveredDomains,
    missingDomains,
    sourceGates: REQUIRED_RMT_SOURCE_GATES.slice(),
    evidenceRecords,
    artifactPaths: REQUIRED_RMT_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    coverageSummary: {
      requiredDomainCount: REQUIRED_RMT_DOMAINS.length,
      coveredDomainCount: coveredDomains.length,
      missingDomainCount: missingDomains.length,
      requiredGateCount: REQUIRED_RMT_SOURCE_GATES.length,
      evidenceRecordCount: evidenceRecords.length
    },
    productionBundle: {
      shellFirst: true,
      routingNativeInRmt: true,
      componentAdapterRequired: true,
      fabricLaneIngestionRequired: true,
      lifecycleTelemetryRequired: true,
      diagnosticsRequired: true,
      artifactParityRequired: true
    },
    kernelBoundary: KERNEL_BOUNDARY,
    rmtKernelImportsXtendTypes: false,
    adapterBoundary: 'xtend-adapters-only',
    frameworkAgnostic: true,
    localGateMode: 'static-rc1-rmt-gate-bundle',
    externalBrowserRequiredInLocalGate: false,
    externalNetworkAllowedInLocalGate: false,
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13RmtProductionReadinessPlan(plan = createEpic13RmtProductionReadinessPlan()) {
  const errors = [];
  const evidence = plan && Array.isArray(plan.evidenceRecords) ? plan.evidenceRecords : [];

  if (!plan || plan.schema !== EPIC13_RMT_PRODUCTION_READINESS_SCHEMA) errors.push(`schema must be ${EPIC13_RMT_PRODUCTION_READINESS_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_RMT_PRODUCTION_READINESS_STATUS) errors.push(`status must be ${EPIC13_RMT_PRODUCTION_READINESS_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA) errors.push('source schema must be visual owner artifact');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('visual owner artifact source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_RMT_PRODUCTION_READINESS_TARGET) errors.push(`targetReadiness must be ${EPIC13_RMT_PRODUCTION_READINESS_TARGET}`);
  REQUIRED_RMT_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  REQUIRED_RMT_DOMAINS.forEach((domain) => {
    if (!plan || !plan.coveredDomains.includes(domain)) errors.push(`domain missing: ${domain}`);
  });
  REQUIRED_RMT_ARTIFACTS.forEach((artifactPath) => {
    if (!plan || !plan.artifactPaths.includes(artifactPath)) errors.push(`artifact missing: ${artifactPath}`);
  });
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.requiredDocs.includes(docPath)) errors.push(`doc missing: ${docPath}`);
  });
  if (!plan || plan.missingDomains.length !== 0) errors.push(`missing RMT readiness domains: ${plan ? plan.missingDomains.join(', ') : '<plan missing>'}`);
  if (!plan || plan.coverageSummary.requiredGateCount !== REQUIRED_RMT_SOURCE_GATES.length) errors.push('required gate count must match source gate list');
  if (!plan || plan.coverageSummary.evidenceRecordCount !== RMT_EVIDENCE_RECORDS.length) errors.push('evidence record count must match RMT evidence list');
  if (!plan || evidence.some((record) => record.status !== 'covered')) errors.push('all RMT evidence records must be covered');
  if (!plan || !plan.productionBundle.shellFirst || !plan.productionBundle.routingNativeInRmt) errors.push('RMT production bundle must be shell-first and routing-native');
  if (!plan || !plan.productionBundle.componentAdapterRequired || !plan.productionBundle.fabricLaneIngestionRequired || !plan.productionBundle.lifecycleTelemetryRequired) errors.push('component, Fabric/Lane and Lifecycle Telemetry coverage are required');
  if (!plan || !plan.productionBundle.diagnosticsRequired || !plan.productionBundle.artifactParityRequired) errors.push('diagnostics and artifact parity are required');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel must not import XTend types');
  if (!plan || plan.adapterBoundary !== 'xtend-adapters-only') errors.push('adapter boundary must remain XTend adapters only');
  if (!plan || plan.frameworkAgnostic !== true) errors.push('RMT production readiness must remain framework agnostic');
  if (!plan || plan.localGateMode !== 'static-rc1-rmt-gate-bundle') errors.push('local gate mode must remain static RC1 RMT bundle');
  if (!plan || plan.externalBrowserRequiredInLocalGate !== false || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require external browser or network');
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13RmtProductionReadinessReport(options = {}) {
  const plan = options.plan || createEpic13RmtProductionReadinessPlan(options);
  const validation = validateEpic13RmtProductionReadinessPlan(plan);

  return {
    schema: EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    sourceGateCount: plan.sourceGates.length,
    coveredDomainCount: plan.coveredDomains.length,
    evidenceRecordCount: plan.evidenceRecords.length,
    artifactCount: plan.artifactPaths.length,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
  EPIC13_RMT_PRODUCTION_READINESS_DOCS,
  EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
  EPIC13_RMT_PRODUCTION_READINESS_MODULE,
  EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT,
  EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT,
  EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
  EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
  EPIC13_RMT_PRODUCTION_READINESS_STATUS,
  EPIC13_RMT_PRODUCTION_READINESS_STEERING,
  EPIC13_RMT_PRODUCTION_READINESS_SUITE,
  EPIC13_RMT_PRODUCTION_READINESS_TARGET,
  EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE,
  EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_RMT_ARTIFACTS,
  REQUIRED_RMT_DOMAINS,
  REQUIRED_RMT_SOURCE_GATES,
  RMT_EVIDENCE_RECORDS,
  createEpic13RmtProductionReadinessPlan,
  createEpic13RmtProductionReadinessReport,
  validateEpic13RmtProductionReadinessPlan
};
