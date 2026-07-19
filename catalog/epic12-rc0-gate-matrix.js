const RC0_GATE_MATRIX_SCHEMA = 'xtend.epic12.rc0-gate-matrix.v1';
const RC0_GATE_RECORD_SCHEMA = 'xtend.epic12.rc0-gate-record.v1';
const RC0_GATE_MATRIX_REPORT_SCHEMA = 'xtend.epic12.rc0-gate-matrix-report.v1';
const RC0_KNOWN_RESIDUAL_POLICY_SCHEMA = 'xtend.epic12.rc0-known-residual-policy.v1';
const RC0_GATE_MATRIX_WORKPACKAGE = 'WP-E12-14';
const RC0_GATE_MATRIX_STATUS = 'accepted-rc0-gate-matrix';
const RC0_GATE_MATRIX_MODULE = 'catalog/epic12-rc0-gate-matrix.js';
const RC0_GATE_MATRIX_CONTRACT = 'development/XTend-RC0-Gate-Matrix.md';
const RC0_GATE_MATRIX_WORKPACKAGE_DOC = 'development/WP-E12-14-Release-Candidate-Gate-Matrix-fuer-RC0-schneiden.md';
const RC0_GATE_MATRIX_DOCS = 'docs/rc0-gate-matrix.md';
const RC0_GATE_MATRIX_SUITE = 'tests/platform/epic12_rc0_gate_matrix_suite.js';
const RC0_GATE_MATRIX_LOCAL_GATE = 'node scripts/run_xtend_tests.js rc0-gate-matrix --json';
const RC0_GATE_MATRIX_PACKAGE_SCRIPT = 'npm run test:rc0-gate-matrix';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const PUBLISH_BOUNDARY = 'private-until-release-owner-approval';

const RC0_FAST_PR_SUITES = Object.freeze([
  'core',
  'architecture',
  'components',
  'component-contract-v2',
  'component-shell-contract',
  'component-styling-contract',
  'builder-typescript-blueprint',
  'epic10-p0-component-wave',
  'component-lab-rmt-inspector',
  'component-lab-ux-inspector',
  'component-ux-browser-smokes',
  'component-shell-theme-matrix',
  'component-ux-authoring-docs',
  'component-long-tail-migration',
  'epic11-enterprise-ux-handoff',
  'rmt-first-demo-app',
  'existing-component-metadata',
  'epic10-platform-gates',
  'epic10-release-handoff',
  'browser',
  'a11y-hydration',
  'screenreader-signals',
  'motion-contrast',
  'runtime-a11y-contract',
  'component-ux-performance',
  'component-network-contract',
  'rmt-shell-authoring-ux',
  'form-controls-ux',
  'feedback-status-ux',
  'navigation-routing-ux',
  'overlay-interaction-ux',
  'layout-display-media-ux',
  'catalog-coverage',
  'regression-priority',
  'fabric',
  'fabric-lane-mapping',
  'fabric-lifecycle-boundary',
  'fabric-reporters',
  'fabric-runtime-bridge',
  'references',
  'supply-chain',
  'manifest-import-policy',
  'docs-rmt-pilot'
]);

const RC0_SNAPSHOT_SUITES = Object.freeze([
  'component-shell-theme-matrix',
  'visual-snapshot-automation',
  'visual-snapshots',
  'design-tokens'
]);

const RC0_AUTHORING_SUITES = Object.freeze([
  'rmt-shell-authoring-ux',
  'rmt-first-class-app',
  'rmt-first-demo-app',
  'docs-rmt-pilot',
  'rmt-dsl-authoring-polish'
]);

const RC0_RELEASE_MUST_INCLUDE = Object.freeze([
  'components',
  'browser',
  'fabric-performance-measurements',
  'performance-regression',
  'hydration-policy',
  'visual-snapshot-automation',
  'visual-snapshots',
  'design-tokens',
  'rmt-dsl-authoring-polish',
  'rmt-compatibility',
  'rmt-first-class-app',
  'rmt-component-fabric-ingestion',
  'rmt-component-lifecycle-telemetry',
  'docs-rmt-pilot',
  'references',
  'supply-chain',
  'manifest-import-policy'
]);

const CONDITIONAL_NETWORK_COMMANDS = Object.freeze([
  'npm audit --audit-level=moderate',
  'npm sbom --sbom-format=cyclonedx --json'
]);

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function commandForSuites(suiteIds) {
  return `node scripts/run_xtend_tests.js ${suiteIds.join(' ')} --json`;
}

const GATE_DEFINITIONS = Object.freeze([
  {
    id: 'rc0-pr-fast',
    tier: 'pr-fast',
    command: 'npm run test:pr:report',
    reportPath: '.xtend-test-results/xtend-pr-gate-report.json',
    artifactName: 'xtend-pr-gate-report-{artifactSuffix}',
    suiteIds: RC0_FAST_PR_SUITES.slice(),
    required: true,
    localOnly: true,
    validates: ['core-runtime', 'component-contracts', 'a11y', 'security', 'docs-rmt-pilot', 'references']
  },
  {
    id: 'rc0-full-release',
    tier: 'full-release',
    command: 'npm run test:release:full:report',
    reportPath: '.xtend-test-results/xtend-release-gate-report.json',
    artifactName: 'xtend-release-gate-report-{artifactSuffix}',
    suiteIds: ['all'],
    requiredSuites: RC0_RELEASE_MUST_INCLUDE.slice(),
    required: true,
    localOnly: true,
    validates: ['all-runner-suites', 'performance', 'hydration', 'rmt-compatibility', 'browser-smokes']
  },
  {
    id: 'rc0-snapshot',
    tier: 'snapshot',
    command: commandForSuites(RC0_SNAPSHOT_SUITES),
    reportPath: '.xtend-test-results/visual-snapshots/visual-snapshots-report.json',
    artifactName: 'xtend-rc0-snapshot-report',
    suiteIds: RC0_SNAPSHOT_SUITES.slice(),
    required: true,
    localOnly: true,
    validates: ['visual-snapshot-runner', 'design-token-alignment', 'theme-matrix']
  },
  {
    id: 'rc0-rmt-authoring',
    tier: 'authoring',
    command: commandForSuites(RC0_AUTHORING_SUITES),
    reportPath: '.xtend-test-results/xtend-rmt-authoring-gate-report.json',
    artifactName: 'xtend-rc0-rmt-authoring-report',
    suiteIds: RC0_AUTHORING_SUITES.slice(),
    required: true,
    localOnly: true,
    validates: ['rmt-shell-authoring', 'rmt-first-apps', 'docs-rmt-pilot', 'dsl-authoring-polish']
  },
  {
    id: 'rc0-conditional-network',
    tier: 'conditional-network',
    command: CONDITIONAL_NETWORK_COMMANDS.join(' && '),
    reportPath: '.xtend-test-results/xtend-network-audit-report.json',
    artifactName: 'xtend-rc0-network-audit-report',
    suiteIds: [],
    required: false,
    localOnly: false,
    condition: 'run-with-network-approval-or-document-deferral',
    validates: ['npm-audit', 'npm-sbom']
  },
  {
    id: 'rc0-package-dry-run',
    tier: 'package',
    command: 'npm run pack:dry-run',
    reportPath: '.xtend-test-results/xtend-pack-dry-run.txt',
    artifactName: 'xtend-rc0-pack-dry-run',
    suiteIds: [],
    required: true,
    localOnly: true,
    validates: ['package-files', 'exports', 'private-boundary']
  },
  {
    id: 'rc0-known-residual-policy',
    tier: 'owner-review',
    command: 'review development/XTend-RC0-Gate-Matrix.md known residual policy',
    reportPath: 'development/XTend-RC0-Gate-Matrix.md',
    artifactName: 'xtend-rc0-known-residual-policy',
    suiteIds: [],
    required: true,
    localOnly: true,
    validates: ['accepted-residuals', 'performance-warnings', 'publish-boundary']
  },
  {
    id: 'rc0-self',
    tier: 'matrix-self-check',
    command: RC0_GATE_MATRIX_LOCAL_GATE,
    reportPath: '.xtend-test-results/xtend-rc0-gate-matrix-report.json',
    artifactName: 'xtend-rc0-gate-matrix-report',
    suiteIds: ['rc0-gate-matrix'],
    required: true,
    localOnly: true,
    validates: ['matrix-consistency', 'package-metadata', 'scaffold-metadata', 'docs-handoff']
  }
]);

function createGateRecord(definition) {
  return {
    schema: RC0_GATE_RECORD_SCHEMA,
    ...definition,
    suiteIds: unique(definition.suiteIds),
    validates: unique(definition.validates)
  };
}

function createKnownResidualPolicy() {
  return {
    schema: RC0_KNOWN_RESIDUAL_POLICY_SCHEMA,
    status: 'accepted-for-rc0-owner-review',
    maxWarningCount: 2,
    failCountAllowed: 0,
    blockers: [],
    acceptedResiduals: [
      {
        id: 'xstate-nonvisual-boundary-probe',
        scope: 'xstate',
        status: 'contract-gated',
        ownerDecision: 'accepted-for-rc0',
        reason: 'xstate is infrastructure boundary, not a visible component shell.'
      },
      {
        id: 'x-utils-utility-boundary-probe',
        scope: 'x-utils',
        status: 'typed-contract-gated',
        ownerDecision: 'accepted-for-rc0',
        reason: 'x-utils is utility infrastructure and is covered by import policy and type fixtures.'
      },
      {
        id: 'performance-hydration-warning',
        scope: 'performance-regression',
        status: 'accepted-warning',
        ownerDecision: 'watch-in-rc0',
        measurement: 'xtend.component.hydrate',
        currentStatus: 'warn-not-fail',
        reason: 'Known deterministic local warning remains under fail threshold and below maxWarningCount.'
      }
    ],
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    ownerAcceptanceRequired: true
  };
}

function createEpic12Rc0GateMatrix(options = {}) {
  const gates = GATE_DEFINITIONS.map(createGateRecord);
  const knownResidualPolicy = options.knownResidualPolicy || createKnownResidualPolicy();
  return {
    schema: RC0_GATE_MATRIX_SCHEMA,
    gateRecordSchema: RC0_GATE_RECORD_SCHEMA,
    reportSchema: RC0_GATE_MATRIX_REPORT_SCHEMA,
    workpackage: RC0_GATE_MATRIX_WORKPACKAGE,
    status: RC0_GATE_MATRIX_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    releaseCandidate: 'RC0',
    module: RC0_GATE_MATRIX_MODULE,
    contract: RC0_GATE_MATRIX_CONTRACT,
    workpackageDocument: RC0_GATE_MATRIX_WORKPACKAGE_DOC,
    docs: RC0_GATE_MATRIX_DOCS,
    suite: RC0_GATE_MATRIX_SUITE,
    localGate: RC0_GATE_MATRIX_LOCAL_GATE,
    packageScript: RC0_GATE_MATRIX_PACKAGE_SCRIPT,
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true,
    sourceContracts: [
      'xtend.epic12.rc-hardening-model.v1',
      'xtend.ci.gate-matrix.v1',
      'xtend.release.checklist-semver-policy.v1',
      'xtend.epic12.visual-snapshot-runner.v1',
      'xtend.design-tokens.product-contract.v1',
      'xtend.rmt.dsl-authoring-polish.v1'
    ],
    phases: [
      {
        id: 'prepare',
        requiredGates: ['rc0-pr-fast', 'rc0-snapshot', 'rc0-rmt-authoring', 'rc0-self'],
        exitCriteria: ['all-required-local-gates-pass', 'reports-reviewable']
      },
      {
        id: 'release-full',
        requiredGates: ['rc0-full-release', 'rc0-package-dry-run'],
        exitCriteria: ['full-release-report-present', 'package-dry-run-reviewed']
      },
      {
        id: 'owner-review',
        requiredGates: ['rc0-conditional-network', 'rc0-known-residual-policy'],
        exitCriteria: ['network-gates-run-or-deferred', 'known-residuals-accepted', 'publish-remains-blocked']
      }
    ],
    gates,
    commands: {
      prFast: 'npm run test:pr:report',
      fullRelease: 'npm run test:release:full:report',
      snapshot: commandForSuites(RC0_SNAPSHOT_SUITES),
      rmtAuthoring: commandForSuites(RC0_AUTHORING_SUITES),
      conditionalNetwork: CONDITIONAL_NETWORK_COMMANDS.slice(),
      packageDryRun: 'npm run pack:dry-run',
      self: RC0_GATE_MATRIX_LOCAL_GATE
    },
    reports: {
      prFast: '.xtend-test-results/xtend-pr-gate-report.json',
      fullRelease: '.xtend-test-results/xtend-release-gate-report.json',
      snapshot: '.xtend-test-results/visual-snapshots/visual-snapshots-report.json',
      rc0Matrix: '.xtend-test-results/xtend-rc0-gate-matrix-report.json'
    },
    snapshotGate: {
      suiteIds: RC0_SNAPSHOT_SUITES.slice(),
      binaryPixelBaselineRequired: false,
      domBaseline: 'tests/browser/visual-baselines/visual-snapshots.dom-baseline.json',
      outputRoot: '.xtend-test-results/visual-snapshots'
    },
    rmtAuthoringGate: {
      suiteIds: RC0_AUTHORING_SUITES.slice(),
      kernelBoundary: KERNEL_BOUNDARY,
      upstreamDslPolishIncluded: true
    },
    conditionalNetworkGates: {
      requiredForPublish: true,
      requiredForLocalRc0: false,
      commands: CONDITIONAL_NETWORK_COMMANDS.slice(),
      deferralRequiresOwnerNote: true
    },
    packageDryRun: {
      command: 'npm run pack:dry-run',
      publishAllowedAfterDryRun: false,
      requiredFiles: ['package.json', 'README.md', 'CHANGELOG.md', 'xtend-loader.js', 'components', 'fabric', 'xtendrmt', 'xtend-builder', 'docs']
    },
    knownResidualPolicy,
    handoff: ['WP-E12-15'],
    summary: {
      requiredLocalGateCount: gates.filter((gate) => gate.required && gate.localOnly).length,
      conditionalNetworkGateCount: CONDITIONAL_NETWORK_COMMANDS.length,
      acceptedResidualCount: knownResidualPolicy.acceptedResiduals.length,
      blockerCount: knownResidualPolicy.blockers.length
    }
  };
}

function validateEpic12Rc0GateMatrix(matrix = createEpic12Rc0GateMatrix()) {
  const errors = [];
  const gates = Array.isArray(matrix.gates) ? matrix.gates : [];
  const gateIds = new Set(gates.map((gate) => gate.id));
  const requiredGateIds = GATE_DEFINITIONS.map((gate) => gate.id);

  if (!matrix || matrix.schema !== RC0_GATE_MATRIX_SCHEMA) errors.push(`schema must be ${RC0_GATE_MATRIX_SCHEMA}`);
  if (!matrix || matrix.workpackage !== RC0_GATE_MATRIX_WORKPACKAGE) errors.push(`workpackage must be ${RC0_GATE_MATRIX_WORKPACKAGE}`);
  if (!matrix || matrix.status !== RC0_GATE_MATRIX_STATUS) errors.push(`status must be ${RC0_GATE_MATRIX_STATUS}`);
  if (!matrix || matrix.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!matrix || matrix.publishAllowed !== false || matrix.packagePrivateRequired !== true) errors.push('RC0 matrix must keep publish blocked and package private');
  requiredGateIds.forEach((gateId) => {
    if (!gateIds.has(gateId)) errors.push(`missing gate ${gateId}`);
  });
  gates.forEach((gate) => {
    if (gate.schema !== RC0_GATE_RECORD_SCHEMA) errors.push(`${gate.id || '<unknown>'}: record schema must be ${RC0_GATE_RECORD_SCHEMA}`);
    if (!gate.command || !gate.tier || !Array.isArray(gate.validates) || gate.validates.length === 0) errors.push(`${gate.id || '<unknown>'}: gate must define command, tier and validation targets`);
  });
  if (!matrix.commands || matrix.commands.prFast !== 'npm run test:pr:report') errors.push('PR Fast command must reuse npm run test:pr:report');
  if (!matrix.commands || matrix.commands.fullRelease !== 'npm run test:release:full:report') errors.push('Full Release command must reuse npm run test:release:full:report');
  ['visual-snapshots', 'design-tokens'].forEach((suiteId) => {
    if (!matrix.snapshotGate || !matrix.snapshotGate.suiteIds.includes(suiteId)) errors.push(`snapshot gate missing ${suiteId}`);
  });
  ['rmt-shell-authoring-ux', 'rmt-dsl-authoring-polish'].forEach((suiteId) => {
    if (!matrix.rmtAuthoringGate || !matrix.rmtAuthoringGate.suiteIds.includes(suiteId)) errors.push(`RMT authoring gate missing ${suiteId}`);
  });
  CONDITIONAL_NETWORK_COMMANDS.forEach((command) => {
    if (!matrix.conditionalNetworkGates || !matrix.conditionalNetworkGates.commands.includes(command)) errors.push(`conditional network gate missing ${command}`);
  });
  if (!matrix.packageDryRun || matrix.packageDryRun.command !== 'npm run pack:dry-run') errors.push('package dry run command must be npm run pack:dry-run');
  if (!matrix.knownResidualPolicy || matrix.knownResidualPolicy.schema !== RC0_KNOWN_RESIDUAL_POLICY_SCHEMA) errors.push('known residual policy must declare schema');
  if (!matrix.knownResidualPolicy || matrix.knownResidualPolicy.blockers.length !== 0) errors.push('known residual policy must not contain blockers');
  if (!matrix.knownResidualPolicy || matrix.knownResidualPolicy.publishAllowed !== false) errors.push('known residual policy must block publish');
  ['xstate', 'x-utils', 'performance-regression'].forEach((scope) => {
    if (!matrix.knownResidualPolicy || !matrix.knownResidualPolicy.acceptedResiduals.some((entry) => entry.scope === scope)) {
      errors.push(`known residual policy missing ${scope}`);
    }
  });
  if (!matrix.handoff || !matrix.handoff.includes('WP-E12-15')) errors.push('RC0 matrix must hand off to WP-E12-15');

  return {
    schema: RC0_GATE_MATRIX_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic12Rc0GateMatrixReport(options = {}) {
  const matrix = options.matrix || createEpic12Rc0GateMatrix(options);
  const validation = validateEpic12Rc0GateMatrix(matrix);
  return {
    schema: RC0_GATE_MATRIX_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    matrix,
    gateCount: matrix.gates.length,
    requiredLocalGateCount: matrix.summary.requiredLocalGateCount,
    conditionalNetworkGateCount: matrix.summary.conditionalNetworkGateCount,
    acceptedResidualCount: matrix.summary.acceptedResidualCount,
    blockerCount: matrix.summary.blockerCount,
    publishAllowed: matrix.publishAllowed,
    packagePrivateRequired: matrix.packagePrivateRequired
  };
}

module.exports = {
  CONDITIONAL_NETWORK_COMMANDS,
  GATE_DEFINITIONS,
  KERNEL_BOUNDARY,
  PUBLISH_BOUNDARY,
  RC0_AUTHORING_SUITES,
  RC0_FAST_PR_SUITES,
  RC0_GATE_MATRIX_CONTRACT,
  RC0_GATE_MATRIX_DOCS,
  RC0_GATE_MATRIX_LOCAL_GATE,
  RC0_GATE_MATRIX_MODULE,
  RC0_GATE_MATRIX_PACKAGE_SCRIPT,
  RC0_GATE_MATRIX_REPORT_SCHEMA,
  RC0_GATE_MATRIX_SCHEMA,
  RC0_GATE_MATRIX_STATUS,
  RC0_GATE_MATRIX_SUITE,
  RC0_GATE_MATRIX_WORKPACKAGE,
  RC0_GATE_MATRIX_WORKPACKAGE_DOC,
  RC0_GATE_RECORD_SCHEMA,
  RC0_KNOWN_RESIDUAL_POLICY_SCHEMA,
  RC0_RELEASE_MUST_INCLUDE,
  RC0_SNAPSHOT_SUITES,
  commandForSuites,
  createEpic12Rc0GateMatrix,
  createEpic12Rc0GateMatrixReport,
  createKnownResidualPolicy,
  validateEpic12Rc0GateMatrix
};
