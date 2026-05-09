const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
  createEpic13ProdBrowserCspSmokePlan,
  createEpic13ProdBrowserCspSmokeReport,
  validateEpic13ProdBrowserCspSmokePlan
} = require('./epic13-prod-browser-csp-smoke');
const {
  VISUAL_SNAPSHOTS_BASELINE_PATH,
  VISUAL_SNAPSHOTS_FIXTURE_PATH,
  VISUAL_SNAPSHOTS_REPORT_SCHEMA,
  createVisualSnapshotsRun,
  validateVisualSnapshotsRun
} = require('../tests/browser/visual-snapshots-runner');

const EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA = 'xtend.epic13.visual-owner-artifact.v1';
const EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA = 'xtend.epic13.visual-owner-artifact-manifest.v1';
const EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA = 'xtend.epic13.visual-owner-artifact-report.v1';
const EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE = 'WP-E13-08';
const EPIC13_VISUAL_OWNER_ARTIFACT_STATUS = 'accepted-visual-owner-artifact-normalization';
const EPIC13_VISUAL_OWNER_ARTIFACT_TARGET = 'visual-owner-artifact-normalized';
const EPIC13_VISUAL_OWNER_ARTIFACT_MODULE = 'catalog/epic13-visual-owner-artifact.js';
const EPIC13_VISUAL_OWNER_ARTIFACT_SUITE = 'tests/platform/epic13_visual_owner_artifact_suite.js';
const EPIC13_VISUAL_OWNER_ARTIFACT_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT = 'development/XTend-Epic13-Visual-Owner-Artifact-Contract.md';
const EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC = 'development/WP-E13-08-Visual-Screenshot-Pixels-als-RC1-Artefakt-normalisieren.md';
const EPIC13_VISUAL_OWNER_ARTIFACT_DOCS = 'docs/visual-owner-artifacts.md';
const EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json';
const EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT = 'npm run test:epic13-visual-owner-artifact';
const VISUAL_OWNER_ARTIFACT_ROOT = '.xtend-test-results/visual-snapshots/rc1';
const VISUAL_OWNER_ARTIFACT_MANIFEST = 'tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json';
const VISUAL_OWNER_ARTIFACT_REPORT = `${VISUAL_OWNER_ARTIFACT_ROOT}/visual-owner-artifact-report.json`;
const VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE = `${VISUAL_OWNER_ARTIFACT_ROOT}/{family}/{viewport}/{theme}/{density}/{motion}.png`;
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const DETERMINISTIC_VIEWPORTS = Object.freeze([
  { id: 'desktop-1280', width: 1280, height: 900 },
  { id: 'tablet-768', width: 768, height: 1024 },
  { id: 'mobile-390', width: 390, height: 844 }
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'npm run test:visual-snapshots',
  'npm run test:visual-snapshot-automation',
  'npm run test:component-shell-theme-matrix',
  'npm run test:epic13-prod-browser-csp-smoke'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_VISUAL_OWNER_ARTIFACT_STEERING,
  EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
  EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC,
  EPIC13_VISUAL_OWNER_ARTIFACT_DOCS,
  'development/XTend-Visual-Snapshot-Automation-Contract.md',
  'development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md',
  'docs/visual-snapshot-automation.md',
  'docs/prod-browser-csp-smokes.md',
  'docs/enterprise-adoption.md'
]);

function createCaptureEntries(snapshotRun) {
  return snapshotRun.snapshots.map((snapshot) => ({
    id: `rc1-${snapshot.family}-owner-screenshot`,
    family: snapshot.family,
    sourceSnapshot: snapshot.id,
    components: snapshot.components.slice(),
    artifactPathTemplate: VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE.replace('{family}', snapshot.family),
    domSignature: snapshot.domSignature.root,
    rmtDescriptor: snapshot.domSignature.rmtDescriptor === true
  }));
}

function createEpic13VisualOwnerArtifactPlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13ProdBrowserCspSmokePlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13ProdBrowserCspSmokePlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13ProdBrowserCspSmokeReport({ ...options, plan: sourcePlan });
  const visualRun = options.visualRun || createVisualSnapshotsRun(options);
  const visualValidation = options.visualValidation || validateVisualSnapshotsRun(visualRun);
  const captureEntries = createCaptureEntries(visualRun);

  return {
    schema: EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    manifestSchema: EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA,
    reportSchema: EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
    workpackage: EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE,
    status: EPIC13_VISUAL_OWNER_ARTIFACT_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_VISUAL_OWNER_ARTIFACT_MODULE,
    suite: EPIC13_VISUAL_OWNER_ARTIFACT_SUITE,
    steeringDocument: EPIC13_VISUAL_OWNER_ARTIFACT_STEERING,
    contract: EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
    workpackageDocument: EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC,
    docs: EPIC13_VISUAL_OWNER_ARTIFACT_DOCS,
    localGate: EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
    packageScript: EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT,
    sourceSchema: EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    sourceReportSchema: EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    visualSnapshotReportSchema: VISUAL_SNAPSHOTS_REPORT_SCHEMA,
    visualSnapshotValidationOk: visualValidation.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_VISUAL_OWNER_ARTIFACT_TARGET,
    artifactRoot: VISUAL_OWNER_ARTIFACT_ROOT,
    artifactManifest: VISUAL_OWNER_ARTIFACT_MANIFEST,
    reportPath: VISUAL_OWNER_ARTIFACT_REPORT,
    screenshotPathTemplate: VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE,
    domBaseline: VISUAL_SNAPSHOTS_BASELINE_PATH,
    fixture: VISUAL_SNAPSHOTS_FIXTURE_PATH,
    captureEntries,
    deterministicViewports: DETERMINISTIC_VIEWPORTS.map((viewport) => ({ ...viewport })),
    themeVariants: ['light', 'dark', 'high-contrast', 'forced-colors'],
    motionModes: ['default-motion', 'reduced-motion'],
    densities: ['comfortable', 'compact', 'dense'],
    sourceGates: REQUIRED_SOURCE_GATES.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    snapshotCount: visualRun.snapshotCount,
    familyCount: visualRun.familyCount,
    componentCount: visualRun.componentCount,
    matrixCombinationCount: visualRun.matrixCombinationCount,
    domDiffCount: visualRun.domDiffCount,
    localGateMode: 'static-artifact-manifest-plus-dom-snapshot-gate',
    ownerArtifactMode: 'optional-browser-driver-or-ci-artifact',
    pixelDiffMode: 'optional-owner-artifact-pixel-diff',
    pixelDiffRequiredInLocalGate: false,
    screenshotRequiredInLocalGate: false,
    binaryBaselineCommitted: false,
    externalBrowserRequiredInLocalGate: false,
    externalNetworkAllowedInLocalGate: false,
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: 'WP-E13-13',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13VisualOwnerArtifactPlan(plan = createEpic13VisualOwnerArtifactPlan()) {
  const errors = [];

  if (!plan || plan.schema !== EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA) errors.push(`schema must be ${EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA}`);
  if (!plan || plan.manifestSchema !== EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA) errors.push(`manifestSchema must be ${EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_VISUAL_OWNER_ARTIFACT_STATUS) errors.push(`status must be ${EPIC13_VISUAL_OWNER_ARTIFACT_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA) errors.push('source schema must be PROD browser CSP smoke');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('PROD browser CSP smoke source must validate');
  if (!plan || plan.visualSnapshotValidationOk !== true) errors.push('visual snapshot runner source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_VISUAL_OWNER_ARTIFACT_TARGET) errors.push(`targetReadiness must be ${EPIC13_VISUAL_OWNER_ARTIFACT_TARGET}`);
  if (!plan || plan.artifactRoot !== VISUAL_OWNER_ARTIFACT_ROOT) errors.push(`artifactRoot must be ${VISUAL_OWNER_ARTIFACT_ROOT}`);
  if (!plan || plan.artifactManifest !== VISUAL_OWNER_ARTIFACT_MANIFEST) errors.push(`artifactManifest must be ${VISUAL_OWNER_ARTIFACT_MANIFEST}`);
  if (!plan || plan.reportPath !== VISUAL_OWNER_ARTIFACT_REPORT) errors.push(`reportPath must be ${VISUAL_OWNER_ARTIFACT_REPORT}`);
  if (!plan || plan.screenshotPathTemplate !== VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE) errors.push(`screenshotPathTemplate must be ${VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE}`);
  if (!plan || plan.snapshotCount !== 5 || plan.familyCount !== 5) errors.push('visual owner artifact must preserve five snapshot families');
  if (!plan || plan.componentCount !== 17) errors.push('visual owner artifact must preserve seventeen representative components');
  if (!plan || plan.matrixCombinationCount !== 360) errors.push('visual owner artifact must preserve 360 matrix combinations');
  if (!plan || plan.domDiffCount !== 0) errors.push('visual owner artifact must be backed by a clean DOM diff');
  if (!plan || !Array.isArray(plan.captureEntries) || plan.captureEntries.length !== 5) errors.push('visual owner artifact must define five capture entries');
  if (!plan || plan.deterministicViewports.length !== 3) errors.push('visual owner artifact must define three deterministic viewports');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  if (!plan || plan.localGateMode !== 'static-artifact-manifest-plus-dom-snapshot-gate') errors.push('local gate mode must stay manifest plus DOM snapshot gate');
  if (!plan || plan.ownerArtifactMode !== 'optional-browser-driver-or-ci-artifact') errors.push('owner artifact mode must remain optional browser driver or CI artifact');
  if (!plan || plan.pixelDiffRequiredInLocalGate !== false || plan.screenshotRequiredInLocalGate !== false) errors.push('pixel and screenshot capture must remain optional in the local gate');
  if (!plan || plan.binaryBaselineCommitted !== false) errors.push('binary screenshot baselines must not be committed');
  if (!plan || plan.externalBrowserRequiredInLocalGate !== false || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require browser driver or external network');
  if (!plan || plan.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!plan || plan.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13VisualOwnerArtifactReport(options = {}) {
  const plan = options.plan || createEpic13VisualOwnerArtifactPlan(options);
  const validation = validateEpic13VisualOwnerArtifactPlan(plan);

  return {
    schema: EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    artifactManifest: plan.artifactManifest,
    captureEntryCount: plan.captureEntries.length,
    snapshotCount: plan.snapshotCount,
    matrixCombinationCount: plan.matrixCombinationCount,
    domDiffCount: plan.domDiffCount,
    pixelDiffRequiredInLocalGate: plan.pixelDiffRequiredInLocalGate,
    screenshotRequiredInLocalGate: plan.screenshotRequiredInLocalGate,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  DETERMINISTIC_VIEWPORTS,
  EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
  EPIC13_VISUAL_OWNER_ARTIFACT_DOCS,
  EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
  EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_MODULE,
  EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT,
  EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_STATUS,
  EPIC13_VISUAL_OWNER_ARTIFACT_STEERING,
  EPIC13_VISUAL_OWNER_ARTIFACT_SUITE,
  EPIC13_VISUAL_OWNER_ARTIFACT_TARGET,
  EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE,
  EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_GATES,
  VISUAL_OWNER_ARTIFACT_MANIFEST,
  VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE,
  VISUAL_OWNER_ARTIFACT_REPORT,
  VISUAL_OWNER_ARTIFACT_ROOT,
  createEpic13VisualOwnerArtifactPlan,
  createEpic13VisualOwnerArtifactReport,
  validateEpic13VisualOwnerArtifactPlan
};
