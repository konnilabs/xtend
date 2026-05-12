'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA
} = require('./vnext-remote-manifest');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA
} = require('./vnext-enterprise-registry');
const {
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('./vnext-degradation');
const {
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA
} = require('./vnext-remote-security');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('./vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('./vnext-event-governance');
const {
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA
} = require('./vnext-remote-compiler');
const {
  RMT_VNEXT_REMOTE_TOOLING_SCHEMA
} = require('./vnext-remote-tooling');
const {
  RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA
} = require('./vnext-remote-compatibility');
const {
  ENTERPRISE_BROWSER_CHECKS,
  RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
  createRmtVNextEnterpriseFixturesAdapter
} = require('./vnext-enterprise-fixtures');

const RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA = 'xtend.rmt.vnext-enterprise-release-handoff.v1';
const RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.rmt.vnext-enterprise-release-handoff-report.v1';
const RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA = 'xtend.rmt.vnext-enterprise-release-gate-matrix.v1';
const RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE = 'WP-E16-12';
const RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH = 'tools/rmt-language/vnext-enterprise-release.js';
const RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_enterprise_release_suite.js';
const RMT_VNEXT_ENTERPRISE_RELEASE_CONTRACT_PATH = 'development/XTendRMT-vNext-Enterprise-MFE-Release-Handoff-Contract.md';
const RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE_PATH = 'development/WP-E16-12-Docs-Release-Gates-und-Enterprise-MFE-Handoff-finalisieren.md';
const RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json';
const RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-enterprise-release';
const RMT_VNEXT_ENTERPRISE_TARGET_READINESS = 'rmt-vnext-enterprise-mfe-ready';

const RMT_VNEXT_REMOTE_SURFACES_DOC_PATH = 'docs/rmt-vnext-remote-surfaces.md';
const RMT_VNEXT_ENTERPRISE_REGISTRY_DOC_PATH = 'docs/rmt-vnext-surface-registry-enterprise.md';
const RMT_VNEXT_CROSS_SURFACE_EVENTS_DOC_PATH = 'docs/rmt-vnext-cross-surface-events.md';
const RMT_VNEXT_ENTERPRISE_MFE_HANDOFF_DOC_PATH = 'docs/rmt-vnext-enterprise-mfe-handoff.md';

const RMT_VNEXT_ENTERPRISE_RELEASE_DOCS = Object.freeze([
  RMT_VNEXT_REMOTE_SURFACES_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_DOC_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENTS_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_MFE_HANDOFF_DOC_PATH
]);

const RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS = Object.freeze([
  RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH
]);

const RMT_VNEXT_ENTERPRISE_RELEASE_GATES = Object.freeze([
  'npm run test:rmt-vnext-remote-manifest',
  'npm run test:rmt-vnext-enterprise-registry',
  'npm run test:rmt-vnext-degradation',
  'npm run test:rmt-vnext-remote-security',
  'npm run test:rmt-vnext-cross-surface-events',
  'npm run test:rmt-vnext-event-governance',
  'npm run test:rmt-vnext-remote-compiler',
  'npm run test:rmt-vnext-remote-tooling',
  'npm run test:rmt-vnext-remote-compatibility',
  'npm run test:rmt-vnext-enterprise-fixtures',
  RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT,
  'npm run test:browser',
  'npm run test:references'
]);

const RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS = Object.freeze([
  'xtend.rmt.vnext-remote-surfaces.v1',
  'xtend.epic16.wp01.remote-surfaces-threat-model.v1',
  'xtend.epic16.wp02.remote-surface-manifest-core.v1',
  'xtend.epic16.wp03.enterprise-surface-registry.v1',
  'xtend.epic16.wp04.degradation-policy.v1',
  'xtend.epic16.wp05.remote-security-policy.v1',
  'xtend.epic16.wp06.cross-surface-event-protocol.v1',
  'xtend.epic16.wp07.event-governance.v1',
  'xtend.epic16.wp08.remote-compiler-core.v1',
  'xtend.epic16.wp09.remote-tooling.v1',
  'xtend.epic16.wp10.remote-surface-migration.v1',
  'xtend.epic16.wp11.enterprise-mfe-fixtures.v1',
  'xtend.epic16.wp12.enterprise-mfe-release-handoff.v1',
  'xtend.rmt.vnext-remote-surfaces-threat-model.v1',
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
  RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA
]);

const RMT_VNEXT_ENTERPRISE_RELEASE_DOC_SNIPPETS = Object.freeze({
  [RMT_VNEXT_REMOTE_SURFACES_DOC_PATH]: Object.freeze([
    RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    'remote surface checkout.cart from remote',
    'no-remote-runtime-execution-in-rmt-kernel',
    RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH
  ]),
  [RMT_VNEXT_ENTERPRISE_REGISTRY_DOC_PATH]: Object.freeze([
    'surface.registry',
    RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    'byOwner',
    'byShellTarget'
  ]),
  [RMT_VNEXT_CROSS_SURFACE_EVENTS_DOC_PATH]: Object.freeze([
    RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    'checkout.cart.updated.v1',
    'user.session.changed.v1',
    'no implicit global Event Bus'
  ]),
  [RMT_VNEXT_ENTERPRISE_MFE_HANDOFF_DOC_PATH]: Object.freeze([
    RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE,
    RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH
  ])
});

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function readJson(relativePath, options = {}) {
  if (typeof options.readFile !== 'function') return {};
  try {
    return JSON.parse(options.readFile(relativePath));
  } catch (error) {
    return {
      parseError: error.message
    };
  }
}

function createRmtVNextEnterpriseReleaseGateMatrix() {
  return {
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    gates: RMT_VNEXT_ENTERPRISE_RELEASE_GATES.map((command) => ({
      command,
      required: true,
      status: 'accepted-local-gate'
    }))
  };
}

function createRmtVNextEnterpriseReleaseHandoffPlan(options = {}) {
  return {
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    reportSchema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    gateMatrixSchema: RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    status: 'accepted-vnext-enterprise-mfe-release-handoff',
    targetReadiness: RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    localGate: RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE,
    packageScript: RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT,
    docs: RMT_VNEXT_ENTERPRISE_RELEASE_DOCS.slice(),
    releaseAssets: RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS.slice(),
    demo: RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
    coreOutput: RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
    browserSmoke: RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
    fixtureMatrix: RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH,
    acceptedContracts: RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS.slice(),
    gateMatrix: createRmtVNextEnterpriseReleaseGateMatrix(),
    operationalBoundaries: [
      'no-remote-runtime-execution-in-rmt-kernel',
      'no-implicit-global-event-bus',
      'remote-surfaces-require-explicit-owner-version-integrity-and-fallback',
      'surface-registry-is-discoverability-not-runtime-manager'
    ],
    acceptedResiduals: [
      {
        id: 'productive-remote-runtime-loader',
        status: 'follow-up-host-runtime-adapter',
        owner: 'future-runtime-epic'
      },
      {
        id: 'network-backed-mfe-e2e',
        status: 'follow-up-e2e-gate',
        owner: 'future-runtime-or-ci-epic'
      },
      {
        id: 'host-specific-loader-distribution',
        status: 'follow-up-distribution',
        owner: 'future-runtime-epic'
      }
    ],
    publishBoundary: options.publishBoundary || 'enterprise-contract-ready-not-runtime-loader-release',
    networkRequired: false,
    kernelBoundary: 'no-remote-runtime-execution-in-rmt-kernel',
    eventBoundary: 'no-implicit-global-event-bus'
  };
}

function validateRmtVNextEnterpriseReleaseHandoffPlan(plan = {}) {
  const diagnostics = [];

  if (plan.schema !== RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA) diagnostics.push('schema');
  if (plan.reportSchema !== RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA) diagnostics.push('reportSchema');
  if (plan.gateMatrixSchema !== RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA) diagnostics.push('gateMatrixSchema');
  if (plan.workpackage !== RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE) diagnostics.push('workpackage');
  if (plan.status !== 'accepted-vnext-enterprise-mfe-release-handoff') diagnostics.push('status');
  if (plan.targetReadiness !== RMT_VNEXT_ENTERPRISE_TARGET_READINESS) diagnostics.push('targetReadiness');
  if (plan.localGate !== RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE) diagnostics.push('localGate');
  if (plan.packageScript !== RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT) diagnostics.push('packageScript');
  RMT_VNEXT_ENTERPRISE_RELEASE_DOCS.forEach((docPath) => {
    if (!toArray(plan.docs).includes(docPath)) diagnostics.push(`docs:${docPath}`);
  });
  RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS.forEach((assetPath) => {
    if (!toArray(plan.releaseAssets).includes(assetPath)) diagnostics.push(`releaseAssets:${assetPath}`);
  });
  RMT_VNEXT_ENTERPRISE_RELEASE_GATES.forEach((command) => {
    const hasGate = plan.gateMatrix && toArray(plan.gateMatrix.gates).some((gate) => gate.command === command);
    if (!hasGate) diagnostics.push(`gate:${command}`);
  });
  RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS.forEach((contract) => {
    if (!toArray(plan.acceptedContracts).includes(contract)) diagnostics.push(`acceptedContracts:${contract}`);
  });
  [
    'no-remote-runtime-execution-in-rmt-kernel',
    'no-implicit-global-event-bus',
    'remote-surfaces-require-explicit-owner-version-integrity-and-fallback'
  ].forEach((boundary) => {
    if (!toArray(plan.operationalBoundaries).includes(boundary)) diagnostics.push(`boundary:${boundary}`);
  });
  if (plan.networkRequired !== false) diagnostics.push('networkRequired');
  if (plan.kernelBoundary !== 'no-remote-runtime-execution-in-rmt-kernel') diagnostics.push('kernelBoundary');
  if (plan.eventBoundary !== 'no-implicit-global-event-bus') diagnostics.push('eventBoundary');

  return {
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    ok: diagnostics.length === 0,
    diagnostics
  };
}

function createRmtVNextEnterpriseDemoReleaseReport(options = {}) {
  if (typeof options.readFile !== 'function') {
    return {
      ok: false,
      status: 'missing-reader',
      diagnostics: ['readFile option required']
    };
  }

  const matrix = readJson(RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, options);
  const report = createRmtVNextEnterpriseFixturesAdapter({
    readFile: options.readFile
  }).createReport(matrix);
  const html = options.readFile(RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH);
  const bundle = report.bundle || {};
  const document = bundle.document || {};
  const enterpriseRegistry = bundle.enterpriseRegistry || {};
  const crossSurfaceEvents = bundle.crossSurfaceEvents || {};
  const eventGovernance = bundle.eventGovernance || {};
  const degradation = bundle.degradation || {};
  const checks = {
    fixtureReportPassed: report.ok === true,
    coreOutputMatches: report.coreOutputMatches === true,
    remoteSurfaceCount: toArray(document.remoteSurfaces).length === 1,
    localSurfaceCount: enterpriseRegistry.localSurfaceCount === 3,
    enterpriseSurfaceCount: enterpriseRegistry.surfaceCount === 4,
    eventCount: crossSurfaceEvents.eventCount === 2,
    eventGovernanceReady: eventGovernance.status === 'ready',
    degradationFull: degradation.status === 'full',
    browserSmokePassed: report.browserSmoke && report.browserSmoke.ok === true,
    browserSmokeOffline: !/fetch\s*\(/u.test(html) &&
      !/import\s*\(/u.test(html) &&
      !/<script[^>]+src=["']https?:/iu.test(html),
    matrixParseOk: !matrix.parseError
  };
  const ok = Object.values(checks).every(Boolean);

  return {
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    fixtureSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
    fixtureReportSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
    fixtureMatrixSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
    browserSmokeSchema: RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    sourcePath: RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
    coreOutputPath: RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
    browserSmokePath: RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
    fixtureMatrixPath: RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH,
    checks,
    counts: {
      localSurfaces: enterpriseRegistry.localSurfaceCount || 0,
      remoteSurfaces: toArray(document.remoteSurfaces).length,
      enterpriseSurfaces: enterpriseRegistry.surfaceCount || 0,
      crossSurfaceEvents: crossSurfaceEvents.eventCount || 0,
      browserChecks: report.browserSmoke ? report.browserSmoke.checkCount : 0
    },
    demoDocumentId: document.manifest ? document.manifest.documentId : null,
    browserChecks: ENTERPRISE_BROWSER_CHECKS.slice(),
    fixtureDiagnostics: toArray(report.bundle && report.bundle.diagnostics),
    report
  };
}

function createRmtVNextEnterpriseDocsReleaseReport(options = {}) {
  if (typeof options.readFile !== 'function') {
    return {
      ok: false,
      status: 'missing-reader',
      missing: ['readFile option required']
    };
  }

  const missing = [];
  const docs = RMT_VNEXT_ENTERPRISE_RELEASE_DOCS.map((docPath) => {
    const text = options.readFile(docPath);
    const snippets = RMT_VNEXT_ENTERPRISE_RELEASE_DOC_SNIPPETS[docPath] || [];
    const missingSnippets = snippets.filter((snippet) => !text.includes(snippet));
    missingSnippets.forEach((snippet) => missing.push(`${docPath}:${snippet}`));
    return {
      path: docPath,
      ok: missingSnippets.length === 0,
      missingSnippets
    };
  });

  return {
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    status: missing.length === 0 ? 'passed' : 'failed',
    ok: missing.length === 0,
    docs,
    missing
  };
}

function createRmtVNextEnterpriseReleaseHandoffReport(options = {}) {
  const plan = options.plan || createRmtVNextEnterpriseReleaseHandoffPlan(options);
  const validation = validateRmtVNextEnterpriseReleaseHandoffPlan(plan);
  const docs = createRmtVNextEnterpriseDocsReleaseReport(options);
  const demo = createRmtVNextEnterpriseDemoReleaseReport(options);
  const ok = validation.ok && docs.ok && demo.ok;

  return {
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    handoffSchema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    gateMatrixSchema: RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    targetReadiness: plan.targetReadiness,
    plan,
    validation,
    docs,
    demo,
    gateMatrix: plan.gateMatrix
  };
}

function createRmtVNextEnterpriseReleaseHandoffAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    reportSchema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    gateMatrixSchema: RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    targetReadiness: RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    createPlan: (options = {}) => createRmtVNextEnterpriseReleaseHandoffPlan({
      ...defaultOptions,
      ...options
    }),
    validatePlan: validateRmtVNextEnterpriseReleaseHandoffPlan,
    createDocsReport: (options = {}) => createRmtVNextEnterpriseDocsReleaseReport({
      ...defaultOptions,
      ...options
    }),
    createDemoReport: (options = {}) => createRmtVNextEnterpriseDemoReleaseReport({
      ...defaultOptions,
      ...options
    }),
    createReport: (options = {}) => createRmtVNextEnterpriseReleaseHandoffReport({
      ...defaultOptions,
      ...options
    }),
    createGateMatrix: createRmtVNextEnterpriseReleaseGateMatrix
  });
}

module.exports = {
  RMT_VNEXT_CORE_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS,
  RMT_VNEXT_ENTERPRISE_MFE_HANDOFF_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS,
  RMT_VNEXT_ENTERPRISE_RELEASE_CONTRACT_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_DOCS,
  RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_GATES,
  RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE,
  RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT,
  RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
  RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE_PATH,
  RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
  RMT_VNEXT_REMOTE_SURFACES_DOC_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENTS_DOC_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
  createRmtVNextEnterpriseDemoReleaseReport,
  createRmtVNextEnterpriseDocsReleaseReport,
  createRmtVNextEnterpriseReleaseGateMatrix,
  createRmtVNextEnterpriseReleaseHandoffAdapter,
  createRmtVNextEnterpriseReleaseHandoffPlan,
  createRmtVNextEnterpriseReleaseHandoffReport,
  validateRmtVNextEnterpriseReleaseHandoffPlan
};
