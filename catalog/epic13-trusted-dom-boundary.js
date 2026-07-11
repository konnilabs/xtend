const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
  createEpic13DocsRmtProductionHardeningPlan,
  createEpic13DocsRmtProductionHardeningReport,
  validateEpic13DocsRmtProductionHardeningPlan
} = require('./epic13-docs-rmt-production-hardening');
const {
  SANITIZING_BOUNDARY_CONTRACT,
  TRUSTED_DOM_POLICY_CONTRACT,
  TRUSTED_DOM_SANITIZER_CONTRACT
} = require('../security/trusted-dom-policy');

const EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA = 'xtend.epic13.trusted-dom-boundary.v1';
const EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA = 'xtend.epic13.trusted-dom-boundary-browser-smoke.v1';
const EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA = 'xtend.epic13.trusted-dom-boundary-report.v1';
const EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE = 'WP-E13-11';
const EPIC13_TRUSTED_DOM_BOUNDARY_STATUS = 'accepted-trusted-dom-boundary-browser-proof';
const EPIC13_TRUSTED_DOM_BOUNDARY_TARGET = 'trusted-dom-parsedown-rmt-html-boundary-browser-proofed';
const EPIC13_TRUSTED_DOM_BOUNDARY_MODULE = 'catalog/epic13-trusted-dom-boundary.js';
const EPIC13_TRUSTED_DOM_BOUNDARY_SUITE = 'tests/platform/epic13_trusted_dom_boundary_suite.js';
const EPIC13_TRUSTED_DOM_BOUNDARY_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT = 'development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md';
const EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC = 'development/WP-E13-11-Trusted-DOM-Parsedown-und-RMT-HTML-Boundary-browsernah-pruefen.md';
const EPIC13_TRUSTED_DOM_BOUNDARY_DOCS = 'docs/en/trusted-dom-boundary-browser-proof.md';
const EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json';
const EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT = 'npm run test:epic13-trusted-dom-boundary';
const EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-trusted-dom-boundary-report.json';
const TRUSTED_DOM_BOUNDARY_FIXTURE = 'tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html';
const TRUSTED_DOM_BOUNDARY_RESULT_KEY = '__xtendEpic13TrustedDomBoundaryResult';
const NEXT_DECISION = 'rc1-gate-matrix-ci-handoff';
const NEXT_WORKPACKAGE = 'WP-E13-13';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'npm run test:manifest-policy',
  'npm run test:docs-rmt-pilot',
  'npm run test:browser',
  'npm run test:epic13-prod-browser-csp-smoke',
  'npm run test:epic13-docs-rmt-production-hardening'
]);

const REQUIRED_BROWSER_ASSERTIONS = Object.freeze([
  'parsedown-content-sanitized-before-innerhtml-sink',
  'trusted-dom-proof-schema-marked-on-sink',
  'script-element-removed',
  'iframe-element-removed',
  'event-handler-attributes-removed',
  'javascript-urls-removed',
  'srcdoc-removed',
  'safe-parsedown-text-preserved',
  'sanitizer-records-removed-payloads',
  'malicious-script-did-not-execute',
  'rmt-shell-remained-shell-first',
  'rmt-kernel-remains-parser-neutral'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  EPIC13_TRUSTED_DOM_BOUNDARY_STEERING,
  EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
  EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC,
  EPIC13_TRUSTED_DOM_BOUNDARY_DOCS,
  TRUSTED_DOM_BOUNDARY_FIXTURE,
  'security/trusted-dom-policy.js',
  'docs/utils/pageloader.js',
  'docs/index.php',
  'docs/xtendrmt-parsedown-docs.rmt',
  'docs/en/trusted-dom-sanitizing.md',
  'development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md',
  'development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md'
]);

function createEpic13TrustedDomBoundaryPlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13DocsRmtProductionHardeningPlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13DocsRmtProductionHardeningPlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13DocsRmtProductionHardeningReport({ ...options, plan: sourcePlan });

  return {
    schema: EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    fixtureSchema: EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA,
    reportSchema: EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
    workpackage: EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE,
    status: EPIC13_TRUSTED_DOM_BOUNDARY_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_TRUSTED_DOM_BOUNDARY_MODULE,
    suite: EPIC13_TRUSTED_DOM_BOUNDARY_SUITE,
    steeringDocument: EPIC13_TRUSTED_DOM_BOUNDARY_STEERING,
    contract: EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
    workpackageDocument: EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC,
    docs: EPIC13_TRUSTED_DOM_BOUNDARY_DOCS,
    localGate: EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
    packageScript: EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT,
    reportArtifact: EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT,
    sourceSchema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    sourceReportSchema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    targetReadiness: EPIC13_TRUSTED_DOM_BOUNDARY_TARGET,
    trustedDomPolicy: TRUSTED_DOM_POLICY_CONTRACT,
    trustedDomSanitizer: TRUSTED_DOM_SANITIZER_CONTRACT,
    trustBoundary: SANITIZING_BOUNDARY_CONTRACT,
    fixture: TRUSTED_DOM_BOUNDARY_FIXTURE,
    resultKey: TRUSTED_DOM_BOUNDARY_RESULT_KEY,
    sourceGates: REQUIRED_SOURCE_GATES.slice(),
    requiredBrowserAssertions: REQUIRED_BROWSER_ASSERTIONS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    boundaryProof: {
      parsedownHtmlRequiresSanitizer: true,
      rmtHtmlFragmentRequiresSanitizer: true,
      structuredDomDescriptorPreferred: true,
      hostOwnsSanitizingSink: true,
      scriptsBlocked: true,
      inlineEventHandlersBlocked: true,
      javascriptUrlsBlocked: true,
      srcdocBlocked: true,
      cspSmokeLinked: true
    },
    localGateMode: 'static-fixture-plus-trusted-dom-sanitizer-proof',
    externalBrowserRequiredInLocalGate: false,
    externalNetworkAllowedInLocalGate: false,
    browserExecutionMode: 'optional-driver-or-owner-artifact',
    frameworkAgnostic: true,
    rmtKernelImportsSanitizer: false,
    rmtKernelImportsParsedown: false,
    rmtKernelImportsXtendTypes: false,
    kernelBoundary: KERNEL_BOUNDARY,
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13TrustedDomBoundaryPlan(plan = createEpic13TrustedDomBoundaryPlan()) {
  const errors = [];
  const proof = plan && plan.boundaryProof ? plan.boundaryProof : {};

  if (!plan || plan.schema !== EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA) errors.push(`schema must be ${EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_TRUSTED_DOM_BOUNDARY_STATUS) errors.push(`status must be ${EPIC13_TRUSTED_DOM_BOUNDARY_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA) errors.push('source schema must be Docs RMT production hardening');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('Docs RMT production hardening source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_TRUSTED_DOM_BOUNDARY_TARGET) errors.push(`targetReadiness must be ${EPIC13_TRUSTED_DOM_BOUNDARY_TARGET}`);
  if (!plan || plan.trustedDomPolicy !== TRUSTED_DOM_POLICY_CONTRACT) errors.push(`trustedDomPolicy must be ${TRUSTED_DOM_POLICY_CONTRACT}`);
  if (!plan || plan.trustedDomSanitizer !== TRUSTED_DOM_SANITIZER_CONTRACT) errors.push(`trustedDomSanitizer must be ${TRUSTED_DOM_SANITIZER_CONTRACT}`);
  if (!plan || plan.trustBoundary !== SANITIZING_BOUNDARY_CONTRACT) errors.push(`trustBoundary must be ${SANITIZING_BOUNDARY_CONTRACT}`);
  if (!plan || plan.fixture !== TRUSTED_DOM_BOUNDARY_FIXTURE) errors.push(`fixture must be ${TRUSTED_DOM_BOUNDARY_FIXTURE}`);
  if (!plan || plan.resultKey !== TRUSTED_DOM_BOUNDARY_RESULT_KEY) errors.push(`resultKey must be ${TRUSTED_DOM_BOUNDARY_RESULT_KEY}`);
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  REQUIRED_BROWSER_ASSERTIONS.forEach((assertion) => {
    if (!plan || !plan.requiredBrowserAssertions.includes(assertion)) errors.push(`browser assertion missing: ${assertion}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifact) => {
    if (!plan || !plan.artifactPaths.includes(artifact)) errors.push(`artifact missing: ${artifact}`);
  });
  if (!proof.parsedownHtmlRequiresSanitizer || !proof.rmtHtmlFragmentRequiresSanitizer) errors.push('Parsedown HTML and RMT HTML fragments must require sanitizer');
  if (!proof.structuredDomDescriptorPreferred || !proof.hostOwnsSanitizingSink) errors.push('Structured descriptors must stay preferred and host must own sanitizing sink');
  if (!proof.scriptsBlocked || !proof.inlineEventHandlersBlocked || !proof.javascriptUrlsBlocked || !proof.srcdocBlocked) errors.push('trusted DOM proof must block scripts, inline handlers, javascript URLs and srcdoc');
  if (!plan || plan.localGateMode !== 'static-fixture-plus-trusted-dom-sanitizer-proof') errors.push('local gate mode must stay static fixture plus sanitizer proof');
  if (!plan || plan.externalBrowserRequiredInLocalGate !== false || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require external browser or network');
  if (!plan || plan.frameworkAgnostic !== true) errors.push('trusted DOM boundary proof must stay framework agnostic');
  if (!plan || plan.rmtKernelImportsSanitizer !== false || plan.rmtKernelImportsParsedown !== false || plan.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel must not import sanitizer, Parsedown or XTend types');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13TrustedDomBoundaryReport(options = {}) {
  const plan = options.plan || createEpic13TrustedDomBoundaryPlan(options);
  const validation = validateEpic13TrustedDomBoundaryPlan(plan);

  return {
    schema: EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    sourceGateCount: plan.sourceGates.length,
    browserAssertionCount: plan.requiredBrowserAssertions.length,
    fixture: plan.fixture,
    trustedDomSanitizer: plan.trustedDomSanitizer,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
  EPIC13_TRUSTED_DOM_BOUNDARY_DOCS,
  EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
  EPIC13_TRUSTED_DOM_BOUNDARY_MODULE,
  EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT,
  EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT,
  EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_STATUS,
  EPIC13_TRUSTED_DOM_BOUNDARY_STEERING,
  EPIC13_TRUSTED_DOM_BOUNDARY_SUITE,
  EPIC13_TRUSTED_DOM_BOUNDARY_TARGET,
  EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE,
  EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_ARTIFACTS,
  REQUIRED_BROWSER_ASSERTIONS,
  REQUIRED_SOURCE_GATES,
  TRUSTED_DOM_BOUNDARY_FIXTURE,
  TRUSTED_DOM_BOUNDARY_RESULT_KEY,
  createEpic13TrustedDomBoundaryPlan,
  createEpic13TrustedDomBoundaryReport,
  validateEpic13TrustedDomBoundaryPlan
};
