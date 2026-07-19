const EPIC14_RMT_TOOLING_SCHEMA = 'xtend.epic14.rmt-tooling.v1';
const EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA = 'xtend.epic14.rmt-tooling-gate.record.v1';
const EPIC14_RMT_TOOLING_REPORT_SCHEMA = 'xtend.epic14.rmt-tooling-report.v1';
const EPIC14_RMT_TOOLING_WORKPACKAGE = 'WP-E14-15';
const EPIC14_RMT_TOOLING_STATUS = 'accepted-release-gate-handoff';
const EPIC14_RMT_TOOLING_MODULE = 'catalog/epic14-rmt-tooling.js';
const EPIC14_RMT_TOOLING_CONTRACT = 'development/XTend-Epic14-RMT-Tooling-Release-Gates.md';
const EPIC14_RMT_TOOLING_WORKPACKAGE_DOC = 'development/WP-E14-15-Release-Gates-Package-Metadaten-und-CI-Handoff-vorbereiten.md';
const EPIC14_RMT_TOOLING_DOCS = 'docs/en/rmt-tooling-release-gates.md';
const EPIC14_RMT_TOOLING_SUITE = 'tests/platform/epic14_rmt_tooling_release_gates_suite.js';
const EPIC14_RMT_TOOLING_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic14-rmt-tooling --json';
const EPIC14_RMT_TOOLING_PACKAGE_SCRIPT = 'npm run test:epic14-rmt-tooling';
const EPIC14_RMT_TOOLING_BUNDLE_SCRIPT = 'npm run test:rmt-tooling';
const EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT = 'npm run test:rmt-tooling:report';
const EPIC14_RMT_TOOLING_PR_SCRIPT = 'npm run test:pr:rmt';
const EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT = 'npm run test:pr:rmt:report';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const RMT_KERNEL_POLICY_PARITY_SCHEMA = 'xtend.rmt.kernel-policy-parity.v1';
const RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA = 'xtend.rmt.kernel-policy-parity-report.v1';
const RMT_KERNEL_POLICY_PARITY_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json';
const RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-policy-parity';
const RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES = Object.freeze([
  'recordTrustVerdict',
  'commitTrustedHtml',
  'commitTrustedAttribute',
  'commitTrustedProperty',
  'applyRemoteSurfacePolicy',
  'recoverFromPanic',
  'rememberSafeSnapshot',
  'listRecoveryOutcomes',
  'panicBlockScope',
  'abortScope',
  'reportPerformanceSample',
  'dispatchCommand',
  'recordEscalation',
  'listEscalations'
]);

const RMT_TOOLING_SUITE_IDS = Object.freeze([
  'rmt-source-model',
  'rmt-parser',
  'rmt-semantic-graph',
  'rmt-linter-rules',
  'rmt-linter-cli',
  'rmt-completions',
  'rmt-navigation',
  'rmt-language-server',
  'rmt-code-actions',
  'rmt-agent-report',
  'rmt-ai-developer-kit',
  'rmt-editor-packaging',
  'rmt-language-regression',
  'rmt-tooling-docs'
]);

const RMT_TOOLING_OPTIONAL_PR_SUITE_IDS = Object.freeze([
  'rmt-linter-cli',
  'rmt-language-server',
  'rmt-language-regression',
  'rmt-tooling-docs'
]);

const RMT_TOOLING_EXPORTS = Object.freeze([
  './rmt-language/source-model',
  './rmt-language/parser',
  './rmt-language/format-adapter',
  './rmt-language/semantic-graph',
  './rmt-language/diagnostics',
  './rmt-language/completions',
  './rmt-language/hover',
  './rmt-language/symbols',
  './rmt-language/definitions',
  './rmt-language/code-actions',
  './rmt-language-server',
  './rmt-language-server/protocol',
  './rmt-linter/cli',
  './rmt-linter/reporter',
  './rmt-language/rmt-ai-developer-kit',
  './rmt-language/snippets',
  './rmt-editor/vscode',
  './catalog/epic14-rmt-tooling'
]);

const GATE_DEFINITIONS = Object.freeze([
  {
    id: 'rmt-kernel-policy-parity-release',
    tier: 'release',
    command: RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
    reportCommand: RMT_KERNEL_POLICY_PARITY_LOCAL_GATE,
    reportPath: '.xtend-test-results/xtend-rmt-kernel-policy-parity-report.json',
    artifactName: 'xtend-rmt-kernel-policy-parity-report-{artifactSuffix}',
    suiteIds: ['rmt-kernel-policy-parity'],
    required: true,
    localOnly: true,
    validates: ['kernel-policy-parity', 'runtime-trust-sinks', 'surface-lifecycle', 'strict-policy-drift']
  },
  {
    id: 'rmt-tooling-pr-optional',
    tier: 'optional-pr',
    command: EPIC14_RMT_TOOLING_PR_SCRIPT,
    reportCommand: EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT,
    reportPath: '.xtend-test-results/xtend-rmt-pr-gate-report.json',
    artifactName: 'xtend-rmt-pr-gate-report-{artifactSuffix}',
    suiteIds: RMT_TOOLING_OPTIONAL_PR_SUITE_IDS.slice(),
    required: false,
    localOnly: true,
    validates: ['linter-cli', 'lsp-diagnostics', 'regression-matrix', 'tooling-docs']
  },
  {
    id: 'rmt-tooling-release',
    tier: 'release',
    command: EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
    reportCommand: EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
    reportPath: '.xtend-test-results/xtend-rmt-tooling-gate-report.json',
    artifactName: 'xtend-rmt-tooling-gate-report-{artifactSuffix}',
    suiteIds: RMT_TOOLING_SUITE_IDS.slice(),
    required: true,
    localOnly: true,
    validates: ['source-model', 'parser', 'semantic-graph', 'linter', 'completion', 'navigation', 'lsp', 'code-actions', 'agent-report', 'ai-developer-kit', 'editor-packaging', 'regression', 'docs']
  },
  {
    id: 'rmt-tooling-package-surface',
    tier: 'release',
    command: EPIC14_RMT_TOOLING_LOCAL_GATE,
    reportCommand: EPIC14_RMT_TOOLING_LOCAL_GATE,
    reportPath: '.xtend-test-results/xtend-epic14-rmt-tooling-report.json',
    artifactName: 'xtend-epic14-rmt-tooling-report-{artifactSuffix}',
    suiteIds: ['epic14-rmt-tooling'],
    required: true,
    localOnly: true,
    validates: ['package-scripts', 'exports', 'scaffold-config', 'reference-registry', 'ci-handoff']
  }
]);

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function commandForSuites(suiteIds, reportPath) {
  const command = `node scripts/run_xtend_tests.js ${suiteIds.join(' ')}`;
  return reportPath ? `${command} --report ${reportPath}` : command;
}

function createGateRecord(definition) {
  return {
    schema: EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA,
    ...definition,
    suiteIds: unique(definition.suiteIds),
    validates: unique(definition.validates)
  };
}

function summarizeGates(gates) {
  return gates.reduce((summary, gate) => {
    summary.byTier[gate.tier] = (summary.byTier[gate.tier] || 0) + 1;
    summary.suiteCount += gate.suiteIds.length;
    return summary;
  }, {
    gateCount: gates.length,
    suiteCount: 0,
    byTier: {}
  });
}

function createEpic14RmtToolingGatePlan(options = {}) {
  const gates = GATE_DEFINITIONS.map(createGateRecord);
  const policyParity = {
    schema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
    reportSchema: RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    ok: true,
    status: 'required',
    localGate: RMT_KERNEL_POLICY_PARITY_LOCAL_GATE,
    packageScript: RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
    requiredFactories: RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES.slice(),
    driftCount: 0
  };

  return {
    schema: EPIC14_RMT_TOOLING_SCHEMA,
    gateRecordSchema: EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA,
    reportSchema: EPIC14_RMT_TOOLING_REPORT_SCHEMA,
    workpackage: EPIC14_RMT_TOOLING_WORKPACKAGE,
    status: EPIC14_RMT_TOOLING_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    kernelBoundary: KERNEL_BOUNDARY,
    module: EPIC14_RMT_TOOLING_MODULE,
    contract: EPIC14_RMT_TOOLING_CONTRACT,
    workpackageDocument: EPIC14_RMT_TOOLING_WORKPACKAGE_DOC,
    docs: EPIC14_RMT_TOOLING_DOCS,
    suite: EPIC14_RMT_TOOLING_SUITE,
    localGate: EPIC14_RMT_TOOLING_LOCAL_GATE,
    packageScript: EPIC14_RMT_TOOLING_PACKAGE_SCRIPT,
    bundleScript: EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
    bundleReportScript: EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
    optionalPrCommand: EPIC14_RMT_TOOLING_PR_SCRIPT,
    optionalPrReportCommand: EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT,
    policyParity,
    releaseCommand: EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
    releaseReportCommand: EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
    fullReleaseCommand: 'npm run test:release:full:report',
    primarySuiteIds: RMT_TOOLING_SUITE_IDS.slice(),
    optionalPrSuiteIds: RMT_TOOLING_OPTIONAL_PR_SUITE_IDS.slice(),
    exportSurface: RMT_TOOLING_EXPORTS.slice(),
    gates,
    summary: summarizeGates(gates),
    ciHandoff: {
      optionalPrGate: {
        command: EPIC14_RMT_TOOLING_PR_SCRIPT,
        reportCommand: EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT,
        suiteIds: RMT_TOOLING_OPTIONAL_PR_SUITE_IDS.slice()
      },
      releaseGate: {
        command: EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
        reportCommand: EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
        suiteIds: RMT_TOOLING_SUITE_IDS.slice()
      },
      defaultReleaseGate: 'npm test'
    },
    networkRequired: false,
    requiredPackageScripts: [
      'test:rmt-linter',
      'test:rmt-language-server',
      'test:rmt-tooling',
      'test:rmt-tooling:report',
      'test:rmt-ai-developer-kit',
      'test:rmt-kernel-policy-parity',
      'test:pr:rmt',
      'test:pr:rmt:report',
      'test:epic14-rmt-tooling'
    ],
    requiredFollowUps: ['WP-E14-16']
  };
}

function validateEpic14RmtToolingGatePlan(plan) {
  const failures = [];

  if (!plan || plan.schema !== EPIC14_RMT_TOOLING_SCHEMA) {
    failures.push('schema');
  }
  if (plan && plan.workpackage !== EPIC14_RMT_TOOLING_WORKPACKAGE) {
    failures.push('workpackage');
  }
  if (plan && plan.kernelBoundary !== KERNEL_BOUNDARY) {
    failures.push('kernelBoundary');
  }
  if (!plan || plan.networkRequired !== false) {
    failures.push('networkRequired');
  }
  RMT_TOOLING_SUITE_IDS.forEach((suiteId) => {
    if (!plan || !plan.primarySuiteIds.includes(suiteId)) {
      failures.push(`primarySuite:${suiteId}`);
    }
  });
  RMT_TOOLING_OPTIONAL_PR_SUITE_IDS.forEach((suiteId) => {
    if (!plan || !plan.optionalPrSuiteIds.includes(suiteId)) {
      failures.push(`optionalPrSuite:${suiteId}`);
    }
  });
  RMT_TOOLING_EXPORTS.forEach((exportKey) => {
    if (!plan || !plan.exportSurface.includes(exportKey)) {
      failures.push(`export:${exportKey}`);
    }
  });
  (plan && plan.gates || []).forEach((gate) => {
    if (gate.schema !== EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA) {
      failures.push(`gateSchema:${gate.id}`);
    }
    if (!gate.command || !Array.isArray(gate.suiteIds)) {
      failures.push(`gateShape:${gate.id}`);
    }
    if (gate.localOnly !== true) {
      failures.push(`localOnly:${gate.id}`);
    }
  });
  if (!plan || !plan.policyParity || plan.policyParity.ok !== true) {
    failures.push('policyParity');
  }
  RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES.forEach((factoryName) => {
    if (!plan || !plan.policyParity || !Array.isArray(plan.policyParity.requiredFactories) || !plan.policyParity.requiredFactories.includes(factoryName)) {
      failures.push(`policyParityFactory:${factoryName}`);
    }
  });

  return {
    schema: EPIC14_RMT_TOOLING_REPORT_SCHEMA,
    ok: failures.length === 0,
    failures
  };
}

function createEpic14RmtToolingGateReport(options = {}) {
  const plan = options.plan || createEpic14RmtToolingGatePlan(options);
  const validation = validateEpic14RmtToolingGatePlan(plan);

  return {
    schema: EPIC14_RMT_TOOLING_REPORT_SCHEMA,
    ok: validation.ok,
    workpackage: EPIC14_RMT_TOOLING_WORKPACKAGE,
    status: validation.ok ? 'passed' : 'failed',
    localGate: EPIC14_RMT_TOOLING_LOCAL_GATE,
    bundleCommand: commandForSuites(plan.primarySuiteIds),
    bundleReportCommand: commandForSuites(plan.primarySuiteIds, '.xtend-test-results/xtend-rmt-tooling-gate-report.json'),
    optionalPrCommand: commandForSuites(plan.optionalPrSuiteIds),
    optionalPrReportCommand: commandForSuites(plan.optionalPrSuiteIds, '.xtend-test-results/xtend-rmt-pr-gate-report.json'),
    policyParity: plan.policyParity,
    failures: validation.failures,
    gateCount: plan.gates.length,
    suiteCount: plan.primarySuiteIds.length,
    exportCount: plan.exportSurface.length
  };
}

module.exports = {
  EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT,
  EPIC14_RMT_TOOLING_BUNDLE_SCRIPT,
  EPIC14_RMT_TOOLING_CONTRACT,
  EPIC14_RMT_TOOLING_DOCS,
  EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA,
  EPIC14_RMT_TOOLING_LOCAL_GATE,
  EPIC14_RMT_TOOLING_MODULE,
  EPIC14_RMT_TOOLING_PACKAGE_SCRIPT,
  EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT,
  EPIC14_RMT_TOOLING_PR_SCRIPT,
  EPIC14_RMT_TOOLING_REPORT_SCHEMA,
  EPIC14_RMT_TOOLING_SCHEMA,
  EPIC14_RMT_TOOLING_STATUS,
  EPIC14_RMT_TOOLING_SUITE,
  EPIC14_RMT_TOOLING_WORKPACKAGE,
  EPIC14_RMT_TOOLING_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  RMT_KERNEL_POLICY_PARITY_LOCAL_GATE,
  RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
  RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_REQUIRED_FACTORIES,
  RMT_KERNEL_POLICY_PARITY_SCHEMA,
  RMT_TOOLING_EXPORTS,
  RMT_TOOLING_OPTIONAL_PR_SUITE_IDS,
  RMT_TOOLING_SUITE_IDS,
  createEpic14RmtToolingGatePlan,
  createEpic14RmtToolingGateReport,
  validateEpic14RmtToolingGatePlan
};
