const {
  PROD_LIKE_CSP_POLICY,
  SERVER_CONTRACT
} = require('../scripts/serve_xtend_dev');
const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
  createEpic13HydrationPerformanceClosurePlan,
  createEpic13HydrationPerformanceClosureReport,
  validateEpic13HydrationPerformanceClosurePlan
} = require('./epic13-hydration-performance-closure');

const EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA = 'xtend.epic13.prod-browser-csp-smoke.v1';
const EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA = 'xtend.epic13.prod-browser-csp-smoke-fixture.v1';
const EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA = 'xtend.epic13.prod-browser-csp-smoke-report.v1';
const EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE = 'WP-E13-07';
const EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS = 'accepted-prod-browser-csp-smoke-preparation';
const EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET = 'prod-browser-csp-smoke-prepared';
const EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE = 'catalog/epic13-prod-browser-csp-smoke.js';
const EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE = 'tests/platform/epic13_prod_browser_csp_smoke_suite.js';
const EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT = 'development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md';
const EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC = 'development/WP-E13-07-PROD-nahe-Browser-Local-Server-und-CSP-Smokes-vorbereiten.md';
const EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS = 'docs/prod-browser-csp-smokes.md';
const EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json';
const EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT = 'npm run test:epic13-prod-browser-csp-smoke';
const PROD_CSP_FIXTURE = 'tests/browser/fixtures/epic13-prod-csp-smoke.html';
const PROD_CSP_RESULT_KEY = '__xtendEpic13ProdCspSmokeResult';
const PROD_CSP_NONCE = 'xtend-e13-prod-csp-smoke';
const PROD_CSP_MANIFEST = '/tests/browser/fixtures/components/manifest.json';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'npm run test:browser',
  'npm run test:manifest-policy',
  'npm run dev:local',
  'npm run test:epic13-hydration-performance-closure'
]);

const REQUIRED_PROD_SMOKE_ASSERTIONS = Object.freeze([
  'same-origin-loader',
  'same-origin-manifest',
  'nonce-script-execution',
  'loader-boot-promise',
  'manifest-import-policy',
  'local-server-csp-header',
  'no-cdn-or-importmap',
  'router-hydration-under-csp'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING,
  EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
  EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC,
  EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS,
  'development/XTend-Epic13-Hydration-Performance-Closure-Contract.md',
  'development/XTend-Epic13-Conditional-Network-Evidence-Contract.md',
  'development/XTend-Epic13-Package-Export-Lock-Contract.md',
  'development/ADR-XTend-Loader-und-Lokale-Entwicklung.md',
  'development/ADR-XTend-Security-Trust-Boundaries.md',
  'docs/xtend-loader.md',
  'docs/manifest-import-policy.md',
  'docs/hydration-performance-closure.md',
  'docs/enterprise-adoption.md'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEpic13ProdBrowserCspSmokePlan(options = {}) {
  const sourcePlan = options.sourcePlan || createEpic13HydrationPerformanceClosurePlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13HydrationPerformanceClosurePlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13HydrationPerformanceClosureReport({ ...options, plan: sourcePlan });

  return {
    schema: EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    fixtureSchema: EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA,
    reportSchema: EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
    workpackage: EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE,
    status: EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE,
    suite: EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE,
    steeringDocument: EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING,
    contract: EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
    workpackageDocument: EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC,
    docs: EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS,
    localGate: EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
    packageScript: EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT,
    sourceSchema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    sourceReportSchema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET,
    fixture: PROD_CSP_FIXTURE,
    resultKey: PROD_CSP_RESULT_KEY,
    nonce: PROD_CSP_NONCE,
    manifestUrl: PROD_CSP_MANIFEST,
    loaderUrl: '/xtend-loader.js',
    localServerContract: SERVER_CONTRACT,
    cspPolicy: PROD_LIKE_CSP_POLICY,
    requiredAssertions: REQUIRED_PROD_SMOKE_ASSERTIONS.slice(),
    sourceGates: REQUIRED_SOURCE_GATES.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    localGateMode: 'static-fixture-plus-local-server-header-probe',
    externalBrowserRequiredInLocalGate: false,
    externalNetworkAllowedInLocalGate: false,
    browserExecutionMode: 'optional-driver-or-owner-artifact',
    cspHeaderPrepared: true,
    cspMetaPrepared: true,
    sameOriginOnly: true,
    cdnAllowed: false,
    importMapAllowed: false,
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: 'WP-E13-13',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13ProdBrowserCspSmokePlan(plan = createEpic13ProdBrowserCspSmokePlan()) {
  const errors = [];

  if (!plan || plan.schema !== EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA) errors.push(`schema must be ${EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS) errors.push(`status must be ${EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA) errors.push('source schema must be hydration performance closure');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('hydration performance closure source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET) errors.push(`targetReadiness must be ${EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET}`);
  if (!plan || plan.fixture !== PROD_CSP_FIXTURE) errors.push(`fixture must be ${PROD_CSP_FIXTURE}`);
  if (!plan || plan.resultKey !== PROD_CSP_RESULT_KEY) errors.push(`resultKey must be ${PROD_CSP_RESULT_KEY}`);
  if (!plan || plan.nonce !== PROD_CSP_NONCE) errors.push(`nonce must be ${PROD_CSP_NONCE}`);
  if (!plan || plan.manifestUrl !== PROD_CSP_MANIFEST) errors.push(`manifestUrl must be ${PROD_CSP_MANIFEST}`);
  if (!plan || plan.loaderUrl !== '/xtend-loader.js') errors.push('loaderUrl must be root-local xtend-loader.js');
  if (!plan || plan.localServerContract !== SERVER_CONTRACT) errors.push(`local server contract must be ${SERVER_CONTRACT}`);
  if (!plan || !plan.cspPolicy.includes("script-src 'self' 'nonce-xtend-e13-prod-csp-smoke'")) errors.push('CSP policy must require same-origin scripts plus nonce');
  if (!plan || !plan.cspPolicy.includes("object-src 'none'")) errors.push('CSP policy must block object-src');
  REQUIRED_PROD_SMOKE_ASSERTIONS.forEach((assertion) => {
    if (!plan || !plan.requiredAssertions.includes(assertion)) errors.push(`required assertion missing: ${assertion}`);
  });
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  if (!plan || plan.localGateMode !== 'static-fixture-plus-local-server-header-probe') errors.push('local gate mode must stay static plus local server header probe');
  if (!plan || plan.externalBrowserRequiredInLocalGate !== false) errors.push('local gate must not require an external browser');
  if (!plan || plan.externalNetworkAllowedInLocalGate !== false) errors.push('local gate must not require external network');
  if (!plan || plan.cspHeaderPrepared !== true || plan.cspMetaPrepared !== true) errors.push('CSP header and meta policy must be prepared');
  if (!plan || plan.sameOriginOnly !== true || plan.cdnAllowed !== false || plan.importMapAllowed !== false) errors.push('PROD smoke must remain same-origin only without CDN/importmap');
  if (!plan || plan.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!plan || plan.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13ProdBrowserCspSmokeReport(options = {}) {
  const plan = options.plan || createEpic13ProdBrowserCspSmokePlan(options);
  const validation = validateEpic13ProdBrowserCspSmokePlan(plan);

  return {
    schema: EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    assertionCount: plan.requiredAssertions.length,
    fixture: plan.fixture,
    localServerContract: plan.localServerContract,
    cspHeaderPrepared: plan.cspHeaderPrepared,
    cspMetaPrepared: plan.cspMetaPrepared,
    sameOriginOnly: plan.sameOriginOnly,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
  EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS,
  EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT,
  EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS,
  EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING,
  EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET,
  EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC,
  PROD_CSP_FIXTURE,
  PROD_CSP_MANIFEST,
  PROD_CSP_NONCE,
  PROD_CSP_RESULT_KEY,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_PROD_SMOKE_ASSERTIONS,
  REQUIRED_SOURCE_GATES,
  createEpic13ProdBrowserCspSmokePlan,
  createEpic13ProdBrowserCspSmokeReport,
  validateEpic13ProdBrowserCspSmokePlan
};
