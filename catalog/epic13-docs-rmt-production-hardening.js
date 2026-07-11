const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
  EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
  createEpic13RmtProductionReadinessPlan,
  createEpic13RmtProductionReadinessReport,
  validateEpic13RmtProductionReadinessPlan
} = require('./epic13-rmt-production-readiness');

const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA = 'xtend.epic13.docs-rmt-production-hardening.v1';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA = 'xtend.epic13.docs-rmt-production-hardening-report.v1';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE = 'WP-E13-10';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS = 'accepted-docs-rmt-production-hardening';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET = 'docs-rmt-parsedown-shell-prod-hardened';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE = 'catalog/epic13-docs-rmt-production-hardening.js';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE = 'tests/platform/epic13_docs_rmt_production_hardening_suite.js';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT = 'development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC = 'development/WP-E13-10-Docs-App-RMT-Parsedown-Shell-fuer-PROD-nahe-Erweiterungen-haerten.md';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS = 'docs/en/xtendrmt-parsedown-scheduling.md';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT = 'npm run test:epic13-docs-rmt-production-hardening';
const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-docs-rmt-production-hardening-report.json';
const DOCS_RMT_PILOT_SCHEMA = 'xtend.docs.parsedown-rmt-pilot.v1';
const DOCS_RMT_RENDER_SCHEMA = 'xtend.docs.parsedown-rmt-render.v1';
const DOCS_RMT_DOCUMENT = 'docs/xtendrmt-parsedown-docs.rmt';
const DOCS_RMT_HOST = 'docs/index.php';
const DOCS_RMT_PAGE_LOADER = 'docs/utils/pageloader.js';
const TRUST_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';
const NEXT_DECISION = 'rc1-gate-matrix-ci-handoff';
const NEXT_WORKPACKAGE = 'WP-E13-13';

const REQUIRED_DOCS_RMT_GATES = Object.freeze([
  'npm run test:docs-rmt-pilot',
  'npm run test:browser',
  'npm run test:epic13-rmt-production-readiness'
]);

const REQUIRED_EXTENSION_SLOTS = Object.freeze([
  {
    id: 'docs.slot.content',
    slot: 'content',
    contentKind: 'parsedownHtml',
    schedule: 'docs.markdown.parse',
    endpoint: 'xtendrmt.docs.parsedown.parse',
    adapter: 'docs.parsedown',
    required: true,
    trustBoundary: TRUST_BOUNDARY
  },
  {
    id: 'docs.slot.sidebar',
    slot: 'sidebar',
    contentKind: 'appShellTools',
    schedule: 'docs.shell.render',
    endpoint: 'xtendrmt.shell.render',
    adapter: 'docs.rich-content',
    required: true,
    trustBoundary: 'component-managed'
  },
  {
    id: 'docs.slot.related',
    slot: 'related',
    contentKind: 'routeLinks',
    schedule: 'docs.related.prepare',
    endpoint: 'xtendrmt.docs.related.prepare',
    adapter: 'docs.rich-content',
    required: false,
    trustBoundary: 'component-managed'
  },
  {
    id: 'docs.slot.component-demo',
    slot: 'component-demo',
    contentKind: 'interactiveComponentDemo',
    schedule: 'docs.demo.prepare',
    endpoint: 'xtendrmt.docs.demo.prepare',
    adapter: 'xtend.component',
    required: false,
    trustBoundary: 'component-managed'
  },
  {
    id: 'docs.slot.rich-content',
    slot: 'rich-content',
    contentKind: 'richHtml',
    schedule: 'docs.rich-content.prepare',
    endpoint: 'xtendrmt.docs.rich-content.prepare',
    adapter: 'docs.rich-content',
    required: false,
    trustBoundary: TRUST_BOUNDARY
  },
  {
    id: 'docs.slot.media',
    slot: 'rich-content',
    contentKind: 'xplayerTutorial',
    schedule: 'docs.media.lazy',
    endpoint: 'xtendrmt.docs.media.lazy',
    adapter: 'docs.rich-content',
    required: false,
    trustBoundary: 'component-managed'
  },
  {
    id: 'docs.slot.diagnostics',
    slot: 'diagnostics',
    contentKind: 'diagnostics',
    schedule: 'docs.diagnostics.snapshot',
    endpoint: 'xtendrmt.diagnostics.snapshot',
    adapter: 'rmt.state-scheduler-diagnostics',
    required: true,
    trustBoundary: 'structured-diagnostics'
  }
]);

const REQUIRED_DOCS_RMT_ARTIFACTS = Object.freeze([
  DOCS_RMT_DOCUMENT,
  DOCS_RMT_HOST,
  DOCS_RMT_PAGE_LOADER,
  'docs/utils/docs-shell-runtime.mjs',
  'docs/utils/trusted-dom-host.mjs',
  'docs/en/xtendrmt-parsedown-scheduling.md',
  'docs/en/trusted-dom-sanitizing.md',
  'development/XTend-Epic13-RMT-Production-Readiness-Contract.md'
]);

function createEpic13DocsRmtProductionHardeningPlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13RmtProductionReadinessPlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13RmtProductionReadinessPlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13RmtProductionReadinessReport({ ...options, plan: sourcePlan });
  const extensionSlots = REQUIRED_EXTENSION_SLOTS.map((slot) => ({ ...slot }));

  return {
    schema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    reportSchema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
    workpackage: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE,
    status: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE,
    suite: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE,
    steeringDocument: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING,
    contract: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT,
    workpackageDocument: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC,
    docs: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS,
    localGate: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE,
    packageScript: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT,
    reportArtifact: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT,
    sourceSchema: EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    sourceReportSchema: EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    targetReadiness: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET,
    docsPilotSchema: DOCS_RMT_PILOT_SCHEMA,
    docsRenderSchema: DOCS_RMT_RENDER_SCHEMA,
    rmtDocument: DOCS_RMT_DOCUMENT,
    activeHost: DOCS_RMT_HOST,
    pageLoader: DOCS_RMT_PAGE_LOADER,
    requiredGates: REQUIRED_DOCS_RMT_GATES.slice(),
    artifactPaths: REQUIRED_DOCS_RMT_ARTIFACTS.slice(),
    extensionSlots,
    requiredSlotIds: extensionSlots.filter((slot) => slot.required).map((slot) => slot.id),
    optionalSlotIds: extensionSlots.filter((slot) => !slot.required).map((slot) => slot.id),
    productionHardening: {
      shellFirst: true,
      parsedownOrchestrated: true,
      parsedownEmbeddedInRmtKernel: false,
      richHtmlSchedulable: true,
      xplayerTutorialSchedulable: true,
      diagnosticsSnapshotRequired: true,
      extensionSlotsStable: true,
      hostBoundaryRequired: true,
      pageLoaderRuntimeMetadataRequired: true
    },
    trustBoundary: TRUST_BOUNDARY,
    kernelBoundary: KERNEL_BOUNDARY,
    rmtKernelImportsParsedown: false,
    rmtKernelImportsPhp: false,
    rmtKernelImportsXtendTypes: false,
    frameworkAgnostic: true,
    localGateMode: 'static-docs-rmt-production-hardening',
    externalBrowserRequiredInLocalGate: false,
    externalNetworkAllowedInLocalGate: false,
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13DocsRmtProductionHardeningPlan(plan = createEpic13DocsRmtProductionHardeningPlan()) {
  const errors = [];
  const slots = plan && Array.isArray(plan.extensionSlots) ? plan.extensionSlots : [];

  if (!plan || plan.schema !== EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA) errors.push(`schema must be ${EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS) errors.push(`status must be ${EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_RMT_PRODUCTION_READINESS_SCHEMA) errors.push('source schema must be RMT production readiness');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('RMT production readiness source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET) errors.push(`targetReadiness must be ${EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET}`);
  REQUIRED_DOCS_RMT_GATES.forEach((gate) => {
    if (!plan || !plan.requiredGates.includes(gate)) errors.push(`required gate missing: ${gate}`);
  });
  REQUIRED_DOCS_RMT_ARTIFACTS.forEach((artifactPath) => {
    if (!plan || !plan.artifactPaths.includes(artifactPath)) errors.push(`artifact missing: ${artifactPath}`);
  });
  REQUIRED_EXTENSION_SLOTS.forEach((slot) => {
    const actual = slots.find((entry) => entry.id === slot.id);
    if (!actual) {
      errors.push(`extension slot missing: ${slot.id}`);
      return;
    }
    if (actual.schedule !== slot.schedule) errors.push(`extension slot ${slot.id} must use schedule ${slot.schedule}`);
    if (actual.endpoint !== slot.endpoint) errors.push(`extension slot ${slot.id} must use endpoint ${slot.endpoint}`);
    if (actual.adapter !== slot.adapter) errors.push(`extension slot ${slot.id} must use adapter ${slot.adapter}`);
  });
  if (!plan || !plan.productionHardening.shellFirst || !plan.productionHardening.parsedownOrchestrated) errors.push('Docs hardening must remain shell-first and Parsedown-orchestrated');
  if (!plan || plan.productionHardening.parsedownEmbeddedInRmtKernel !== false) errors.push('Parsedown must not be embedded in the RMT kernel');
  if (!plan || !plan.productionHardening.richHtmlSchedulable || !plan.productionHardening.xplayerTutorialSchedulable) errors.push('Rich HTML and XPlayer tutorial payloads must stay schedulable');
  if (!plan || !plan.productionHardening.diagnosticsSnapshotRequired || !plan.productionHardening.extensionSlotsStable) errors.push('Diagnostics and extension slots must be stable');
  if (!plan || plan.trustBoundary !== TRUST_BOUNDARY) errors.push(`trustBoundary must be ${TRUST_BOUNDARY}`);
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.rmtKernelImportsParsedown !== false || plan.rmtKernelImportsPhp !== false || plan.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel must not import Parsedown, PHP or XTend types');
  if (!plan || plan.frameworkAgnostic !== true) errors.push('Docs RMT hardening must remain framework agnostic');
  if (!plan || plan.localGateMode !== 'static-docs-rmt-production-hardening') errors.push('local gate mode must remain static Docs RMT hardening');
  if (!plan || plan.externalBrowserRequiredInLocalGate !== false || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require external browser or network');
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13DocsRmtProductionHardeningReport(options = {}) {
  const plan = options.plan || createEpic13DocsRmtProductionHardeningPlan(options);
  const validation = validateEpic13DocsRmtProductionHardeningPlan(plan);

  return {
    schema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    requiredGateCount: plan.requiredGates.length,
    extensionSlotCount: plan.extensionSlots.length,
    requiredSlotCount: plan.requiredSlotIds.length,
    optionalSlotCount: plan.optionalSlotIds.length,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  DOCS_RMT_DOCUMENT,
  DOCS_RMT_HOST,
  DOCS_RMT_PAGE_LOADER,
  DOCS_RMT_PILOT_SCHEMA,
  DOCS_RMT_RENDER_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS_RMT_ARTIFACTS,
  REQUIRED_DOCS_RMT_GATES,
  REQUIRED_EXTENSION_SLOTS,
  TRUST_BOUNDARY,
  createEpic13DocsRmtProductionHardeningPlan,
  createEpic13DocsRmtProductionHardeningReport,
  validateEpic13DocsRmtProductionHardeningPlan
};
