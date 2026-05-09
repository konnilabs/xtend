const {
  createEpic10PlatformGatePlan
} = require('./epic10-platform-gates');

const EPIC10_RELEASE_HANDOFF_SCHEMA = 'xtend.epic10.release-handoff.v1';
const EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.epic10.release-handoff-report.v1';
const EPIC10_RELEASE_HANDOFF_WORKPACKAGE = 'WP-E10-16';
const EPIC10_RELEASE_HANDOFF_STATUS = 'accepted-release-handoff';
const EPIC10_RELEASE_HANDOFF_MODULE = 'catalog/epic10-release-handoff.js';
const EPIC10_RELEASE_HANDOFF_SUITE = 'tests/platform/epic10_release_handoff_suite.js';
const EPIC10_RELEASE_HANDOFF_CONTRACT = 'development/XTend-Epic10-Abschluss-und-Release-Handoff.md';
const EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC = 'development/WP-E10-16-Dokumentation-Guides-und-Release-Handoff-finalisieren.md';
const EPIC10_RELEASE_HANDOFF_DOCS = 'docs/epic10-release-handoff.md';
const RMT_FIRST_XTEND_APPS_DOCS = 'docs/rmt-first-xtend-apps.md';
const EPIC10_RELEASE_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic10-release-handoff --json';
const EPIC10_RELEASE_HANDOFF_PACKAGE_SCRIPT = 'npm run test:epic10-release-handoff';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const CANONICAL_FABRIC_BOUNDARY = 'adapter-injection-via-xtend-component-resolveFabricContext';

const REQUIRED_DOCS = Object.freeze([
  'docs/component-platform.md',
  'docs/typescript-components.md',
  RMT_FIRST_XTEND_APPS_DOCS,
  'docs/component-lab.md',
  'docs/rmt-first-demo-app.md',
  'docs/existing-component-metadata.md',
  'docs/epic10-platform-gates.md',
  EPIC10_RELEASE_HANDOFF_DOCS,
  'docs/enterprise-adoption.md',
  'docs/xtendrmt-app-dsl.md'
]);

const REQUIRED_RELEASE_GATES = Object.freeze([
  'epic10-release-handoff',
  'epic10-platform-gates',
  'component-contract-v2',
  'rmt-first-class-app',
  'rmt-first-demo-app',
  'existing-component-metadata',
  'browser',
  'a11y-hydration',
  'screenreader-signals',
  'motion-contrast',
  'fabric-performance-measurements',
  'performance-regression',
  'hydration-policy',
  'regression-priority',
  'references'
]);

const NEXT_WAVE_HANDOFFS = Object.freeze([
  'long-tail-component-runtime-migration',
  'remaining-performance-profile-authoring',
  'component-catalog-completion',
  'release-candidate-packaging',
  'xtendrmt-upstream-dsl-polish'
]);

function createEpic10ReleaseHandoffPlan(options = {}) {
  const platformGates = options.platformGates || createEpic10PlatformGatePlan(options);

  return {
    schema: EPIC10_RELEASE_HANDOFF_SCHEMA,
    reportSchema: EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: EPIC10_RELEASE_HANDOFF_WORKPACKAGE,
    status: EPIC10_RELEASE_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC10_RELEASE_HANDOFF_MODULE,
    suite: EPIC10_RELEASE_HANDOFF_SUITE,
    contract: EPIC10_RELEASE_HANDOFF_CONTRACT,
    workpackageDocument: EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC,
    docs: EPIC10_RELEASE_HANDOFF_DOCS,
    localGate: EPIC10_RELEASE_HANDOFF_LOCAL_GATE,
    packageScript: EPIC10_RELEASE_HANDOFF_PACKAGE_SCRIPT,
    kernelBoundary: KERNEL_BOUNDARY,
    canonicalFabricBoundary: CANONICAL_FABRIC_BOUNDARY,
    docsSurface: {
      requiredDocs: REQUIRED_DOCS.slice(),
      componentAuthoring: ['docs/component-platform.md', 'docs/typescript-components.md'],
      rmtAuthoring: [RMT_FIRST_XTEND_APPS_DOCS, 'docs/xtendrmt-app-dsl.md'],
      migrationNotes: EPIC10_RELEASE_HANDOFF_DOCS,
      releaseHandoff: EPIC10_RELEASE_HANDOFF_DOCS
    },
    releaseReadiness: {
      packagePrivate: true,
      publishAllowed: false,
      publishBoundary: 'private-until-release-owner-acceptance',
      fastPrGate: platformGates.ci.fastPr.command,
      releaseGate: platformGates.ci.release.command,
      requiredGates: REQUIRED_RELEASE_GATES.slice(),
      conditionalNetworkGates: ['npm audit --audit-level=moderate', 'npm sbom --json']
    },
    epicCompletion: {
      status: 'completed',
      completedWorkpackages: Array.from({ length: 16 }, (_, index) => `WP-E10-${String(index + 1).padStart(2, '0')}`),
      closedDecisions: [
        'typescript-source-esm-runtime',
        'rmt-first-app-authoring',
        'fabric-lane-ingestion',
        'component-lifecycle-telemetry',
        'component-lab-and-rmt-inspector',
        'existing-component-metadata-overlay',
        'browser-a11y-performance-visual-gates',
        'documentation-release-handoff'
      ]
    },
    knownHandoffs: NEXT_WAVE_HANDOFFS.slice()
  };
}

function validateEpic10ReleaseHandoffPlan(plan) {
  const errors = [];
  if (!plan || plan.schema !== EPIC10_RELEASE_HANDOFF_SCHEMA) {
    errors.push(`plan schema must be ${EPIC10_RELEASE_HANDOFF_SCHEMA}`);
  }
  if (!plan || plan.status !== EPIC10_RELEASE_HANDOFF_STATUS) {
    errors.push(`plan status must be ${EPIC10_RELEASE_HANDOFF_STATUS}`);
  }
  if (!plan || plan.workpackage !== EPIC10_RELEASE_HANDOFF_WORKPACKAGE) {
    errors.push(`plan workpackage must be ${EPIC10_RELEASE_HANDOFF_WORKPACKAGE}`);
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push(`plan must keep ${KERNEL_BOUNDARY}`);
  }
  if (!plan || plan.canonicalFabricBoundary !== CANONICAL_FABRIC_BOUNDARY) {
    errors.push(`plan must use ${CANONICAL_FABRIC_BOUNDARY}`);
  }
  if (!plan || !plan.docsSurface || plan.docsSurface.requiredDocs.length < REQUIRED_DOCS.length) {
    errors.push('all required docs must be part of the handoff surface');
  }
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.docsSurface.requiredDocs.includes(docPath)) {
      errors.push(`required doc missing from handoff surface: ${docPath}`);
    }
  });
  REQUIRED_RELEASE_GATES.forEach((gate) => {
    if (!plan || !plan.releaseReadiness.requiredGates.includes(gate)) {
      errors.push(`required release gate missing: ${gate}`);
    }
  });
  if (!plan || plan.releaseReadiness.publishAllowed !== false || plan.releaseReadiness.packagePrivate !== true) {
    errors.push('release handoff must keep publish blocked and package private');
  }
  if (!plan || !plan.epicCompletion || plan.epicCompletion.completedWorkpackages.length !== 16) {
    errors.push('Epic 10 completion must list all 16 workpackages');
  }
  if (!plan || !plan.knownHandoffs || plan.knownHandoffs.length === 0) {
    errors.push('next-wave handoffs must remain visible');
  }

  return {
    schema: EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic10ReleaseHandoffReport(options = {}) {
  const plan = options.plan || createEpic10ReleaseHandoffPlan(options);
  const validation = validateEpic10ReleaseHandoffPlan(plan);

  return {
    schema: EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    docsCount: plan.docsSurface.requiredDocs.length,
    releaseGateCount: plan.releaseReadiness.requiredGates.length,
    completedWorkpackageCount: plan.epicCompletion.completedWorkpackages.length,
    knownHandoffs: plan.knownHandoffs.slice()
  };
}

module.exports = {
  CANONICAL_FABRIC_BOUNDARY,
  EPIC10_RELEASE_HANDOFF_CONTRACT,
  EPIC10_RELEASE_HANDOFF_DOCS,
  EPIC10_RELEASE_HANDOFF_LOCAL_GATE,
  EPIC10_RELEASE_HANDOFF_MODULE,
  EPIC10_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA,
  EPIC10_RELEASE_HANDOFF_SCHEMA,
  EPIC10_RELEASE_HANDOFF_STATUS,
  EPIC10_RELEASE_HANDOFF_SUITE,
  EPIC10_RELEASE_HANDOFF_WORKPACKAGE,
  EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  NEXT_WAVE_HANDOFFS,
  REQUIRED_DOCS,
  REQUIRED_RELEASE_GATES,
  RMT_FIRST_XTEND_APPS_DOCS,
  createEpic10ReleaseHandoffPlan,
  createEpic10ReleaseHandoffReport,
  validateEpic10ReleaseHandoffPlan
};
