const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  SECURITY_SANITIZE_MISSING_CODE,
  RMT_VNEXT_SECURITY_POLICY_SCHEMA
} = require('../../tools/rmt-language/vnext-security');
const {
  REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-remote-security');
const {
  DEGRADATION_SURFACE_BLOCKED_CODE,
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-degradation');
const {
  STREAM_ERROR_PATH_MISSING_CODE,
  RMT_VNEXT_STREAMING_SCHEMA
} = require('../../tools/rmt-language/vnext-streaming');
const {
  EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-event-governance');
const {
  KERNEL_POLICY_PARITY_RUNTIME_HOOKS,
  RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH,
  RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_MODULE_PATH,
  RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
  RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_SUITE_PATH,
  RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
  RMT_KERNEL_POLICY_PARITY_WP_PATH,
  collectCompileTimeBlocks,
  createKernelPolicyParityContract,
  createKernelPolicyParityController,
  createKernelPolicyParityMatrix,
  createKernelPolicyParityRuntimeReport,
  createRuntimeCapabilitySnapshot,
  serializeKernelPolicyParityContract,
  serializeKernelPolicyParityReport
} = require('../../tools/rmt-language/kernel-policy-parity');

const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-policy-parity.d.ts';
const RMT_KERNEL_POLICY_PARITY_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json';
const RMT_ARTIFACTS = [
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function getPackageExport(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' ? entry : null;
}

function createDiagnosticsHub() {
  const entries = [];
  return {
    entries,
    publish(channel, payload, meta = {}) {
      const entry = { channel, payload, meta };
      entries.push(entry);
      return entry;
    },
    getChannelSnapshot(channel) {
      return entries.filter((entry) => entry.channel === channel).slice(-1)[0] || null;
    }
  };
}

function createRmtAppModulesFromArtifact(context, rootDir, artifactPath) {
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = artifactPath.endsWith('.esm.js')
    ? source
      .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/^\s*import\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-test' },
    CustomEvent,
    document: {}
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, {
      filename: artifactPath
    });
  } catch (error) {
    context.fail(`${artifactPath} evaluates for policy parity probe (${error.message})`);
    return null;
  }

  if (artifactPath.endsWith('.esm.js')) vm.runInNewContext('globalThis.AppModules = AppModules;', sandbox);
  else sandbox.AppModules = sandbox.XTendRMT || sandbox['xtend.rmt'] || null;
  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules === 'object', `${artifactPath} exposes private/public factory probe`)) {
    return null;
  }
  return sandbox.AppModules;
}

function createSampleCompileReports() {
  return {
    securityContract: {
      schema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
      diagnostics: [
        {
          code: SECURITY_SANITIZE_MISSING_CODE,
          severity: 'error',
          message: 'Unsafe output needs sanitize policy.'
        }
      ]
    },
    remoteSecurityReport: {
      schema: RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA,
      policySchema: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
      diagnostics: [
        {
          code: REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
          severity: 'error',
          message: 'Origin is not allowed.'
        }
      ]
    },
    degradationReport: {
      schema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
      policySchema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
      diagnostics: [
        {
          code: DEGRADATION_SURFACE_BLOCKED_CODE,
          severity: 'error',
          message: 'Surface is blocked.'
        }
      ]
    },
    streamingContract: {
      schema: RMT_VNEXT_STREAMING_SCHEMA,
      diagnostics: [
        {
          code: STREAM_ERROR_PATH_MISSING_CODE,
          severity: 'error',
          message: 'Stream error path is missing.'
        }
      ]
    },
    eventGovernanceReport: {
      schema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
      policySchema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
      diagnostics: [
        {
          code: EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
          severity: 'error',
          message: 'Delivery policy is missing.'
        }
      ]
    }
  };
}

function createFullRuntimeHooks() {
  return [
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
  ];
}

function runStandalonePolicyParityAssertions(context) {
  const matrix = createKernelPolicyParityMatrix();
  context.assert(matrix.schema === RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA, 'policy parity matrix exposes matrix schema');
  context.assert(matrix.entryCount >= 6, 'policy parity matrix covers required policy families');
  assertIncludesAll(context, matrix.entries.map((entry) => entry.sourceSchema), [
    RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    RMT_VNEXT_STREAMING_SCHEMA,
    RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA
  ], 'policy parity source schemas');
  assertIncludesAll(context, matrix.entries.flatMap((entry) => entry.runtimeScope), [
    'remote-output',
    'streaming-output',
    'event-delivery'
  ], 'policy parity runtime scopes');
  assertIncludesAll(context, KERNEL_POLICY_PARITY_RUNTIME_HOOKS, [
    'recordTrustVerdict',
    'applyRemoteSurfacePolicy',
    'recoverFromPanic',
    'reportPerformanceSample',
    'recordEscalation'
  ], 'policy parity runtime hooks');

  const sampleReports = createSampleCompileReports();
  const compileBlocks = collectCompileTimeBlocks(sampleReports);
  context.assert(compileBlocks.length === 5, 'sample compile reports expose five blocking rules');

  const readyReport = createKernelPolicyParityRuntimeReport({
    ...sampleReports,
    runtimeHooks: createFullRuntimeHooks()
  });
  context.assert(readyReport.schema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'runtime report exposes report schema');
  context.assert(readyReport.status === 'ready', 'full runtime hook set satisfies policy parity');
  context.assert(readyReport.compileTimeBlockCount === 5, 'runtime report counts compile-time blocks');
  context.assert(readyReport.appliedPolicyCount >= 5, 'runtime report links applied policies');
  context.assert(readyReport.appliedPolicies.every((entry) => entry.verdict === 'blocked'), 'runtime report exposes blocked runtime verdicts');
  assertIncludesAll(context, readyReport.appliedPolicies.map((entry) => entry.runtimeScope), [
    'trusted-runtime-output',
    'remote-output',
    'degraded-or-blocked-surface',
    'streaming-output',
    'event-delivery'
  ], 'runtime report scopes');
  context.assert(JSON.parse(serializeKernelPolicyParityReport(readyReport)).schema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'runtime report serialization is parseable');

  const driftReport = createKernelPolicyParityRuntimeReport({
    ...sampleReports,
    runtimeHooks: ['recordTrustVerdict', 'commitTrustedHtml']
  });
  context.assert(driftReport.status === 'drift', 'partial runtime hook set reports drift');
  context.assert(driftReport.drift.some((entry) => entry.type === 'missing-runtime-hook'), 'drift report exposes missing runtime hooks');
  context.assert(driftReport.drift.some((entry) => entry.schema === RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA), 'drift entries expose drift schema');

  const unknownReport = createKernelPolicyParityRuntimeReport({
    reports: [
      {
        schema: 'xtend.rmt.unknown-policy.v1',
        diagnostics: [
          {
            code: 'xtend.unknown.blocked',
            severity: 'error',
            message: 'Unknown blocked policy.'
          }
        ]
      }
    ],
    runtimeHooks: createFullRuntimeHooks()
  });
  context.assert(unknownReport.drift.some((entry) => entry.type === 'missing-runtime-mapping'), 'unknown blocking policy reports missing runtime mapping');

  const runtimeSurface = {
    recordTrustVerdict() {},
    commitTrustedHtml() {},
    getCommandBus() {
      return {
        dispatch() {},
        recordEscalation() {},
        listEscalations() {}
      };
    }
  };
  const capabilitySnapshot = createRuntimeCapabilitySnapshot({ runtime: runtimeSurface });
  assertIncludesAll(context, capabilitySnapshot.hooks, ['recordTrustVerdict', 'commitTrustedHtml', 'dispatchCommand', 'recordEscalation', 'listEscalations'], 'runtime capability discovery');

  const diagnosticsHub = createDiagnosticsHub();
  const controller = createKernelPolicyParityController({ diagnosticsHub });
  const controlledReport = controller.createRuntimeReport({
    ...sampleReports,
    runtimeHooks: createFullRuntimeHooks()
  });
  context.assert(controlledReport.status === 'ready', 'controller creates ready report');
  context.assert(controller.listReports().length === 1, 'controller retains parity report');
  context.assert(diagnosticsHub.getChannelSnapshot(RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL).payload.schema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'controller publishes policy parity diagnostics');

  const contract = createKernelPolicyParityContract();
  context.assert(contract.schema === RMT_KERNEL_POLICY_PARITY_SCHEMA, 'contract exposes policy parity schema');
  context.assert(contract.reportSchema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'contract exposes runtime report schema');
  context.assert(serializeKernelPolicyParityContract(contract) === serializeKernelPolicyParityContract(createKernelPolicyParityContract()), 'policy parity contract serialization is stable');
}

async function runArtifactProbe(context, rootDir, artifactPath) {
  const AppModules = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!AppModules) return;
  context.assert(typeof AppModules.createRmtKernelPolicyParity === 'function', `${artifactPath} exposes runtime policy parity factory`);
  context.assert(typeof AppModules.createRmtKernelPolicyParity === 'function', `${artifactPath} exposes legacy policy parity alias`);

  const diagnosticsHub = createDiagnosticsHub();
  const controller = AppModules.createRmtKernelPolicyParity({ diagnosticsHub });
  const matrix = controller.getMatrix();
  context.assert(matrix.entryCount >= 6, `${artifactPath} runtime policy parity matrix is available`);

  const readyReport = controller.createRuntimeReport({
    ...createSampleCompileReports(),
    runtimeHooks: createFullRuntimeHooks()
  });
  context.assert(readyReport.status === 'ready', `${artifactPath} runtime policy parity reports ready when hooks are present`);
  context.assert(readyReport.appliedPolicies.some((entry) => entry.runtimeScope === 'remote-output'), `${artifactPath} remote security maps to remote-output runtime scope`);
  context.assert(readyReport.appliedPolicies.some((entry) => entry.panicTrigger === 'scheduler-backpressure'), `${artifactPath} streaming errors map to scheduler backpressure panic trigger`);
  context.assert(readyReport.appliedPolicies.some((entry) => entry.runtimeScope === 'event-delivery'), `${artifactPath} event governance maps to runtime delivery signal`);
  context.assert(diagnosticsHub.getChannelSnapshot(RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL).payload.schema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, `${artifactPath} publishes policy parity diagnostics`);

  const driftReport = controller.createRuntimeReport({
    ...createSampleCompileReports(),
    runtimeHooks: ['recordTrustVerdict', 'commitTrustedHtml']
  });
  context.assert(driftReport.status === 'drift', `${artifactPath} runtime policy parity reports drift when hooks are missing`);
  context.assert(driftReport.drift.some((entry) => entry.type === 'missing-runtime-hook'), `${artifactPath} drift includes missing runtime hooks`);
}

async function runRmtKernelPolicyParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-policy-parity',
    label: 'RKSH-WP-08 Compile-Time Runtime Policy Parity'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelPolicyParity;
  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-policy-parity');
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const catalog = readText('catalog/type-exports-rmt.js', rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_POLICY_PARITY_WP_PATH, rootDir);
  const declaration = readText(DECLARATION_PATH, rootDir);
  const coreDeclaration = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_POLICY_PARITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_POLICY_PARITY_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_KERNEL_POLICY_PARITY_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_POLICY_PARITY_SUITE_PATH,
    RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH,
    RMT_KERNEL_POLICY_PARITY_WP_PATH,
    RMT_KERNEL_SECURITY_BACKLOG,
    ...RMT_ARTIFACTS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel policy parity module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel policy parity suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-policy-parity.js', 'package exports policy parity module');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-policy-parity.d.ts', 'package exports policy parity declarations');
  context.assert(packageManifest.scripts['test:rmt-kernel-policy-parity'] === 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity', 'package exposes policy parity script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_POLICY_PARITY_SCHEMA, 'package metadata exposes policy parity schema');
  context.assert(metadata && metadata.matrixSchema === RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA, 'package metadata exposes policy parity matrix schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, 'package metadata exposes policy parity report schema');
  context.assert(metadata && metadata.driftSchema === RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA, 'package metadata exposes policy parity drift schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_POLICY_PARITY_WORKPACKAGE, 'package metadata points to RKSH-WP-08');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_POLICY_PARITY_LOCAL_GATE, 'package metadata exposes policy parity local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT, 'package metadata exposes policy parity package script');
  context.assert(runner.hasSuite("rmt-kernel-policy-parity"), 'runner registers policy parity suite');
  context.assert(runner.hasImplementation({ function: "runRmtKernelPolicyParitySuite" }), 'runner imports policy parity suite');
  context.assertIncludes(catalog, './rmt-language/kernel-policy-parity', 'type export catalog includes policy parity export');

  runStandalonePolicyParityAssertions(context);

  for (const artifactPath of RMT_ARTIFACTS) {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_KERNEL_POLICY_PARITY_SCHEMA,
      RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
      'createRmtKernelPolicyParity',
      'remote-output',
      'streaming-output',
      'event-delivery',
      'missing-runtime-hook'
    ], `${artifactPath} policy parity integration`);
    await runArtifactProbe(context, rootDir, artifactPath);
  }

  assertTextIncludesAll(context, declaration, [
    'RmtKernelPolicyParityController',
    'RmtKernelPolicyParityReport',
    'createKernelPolicyParityController',
    'RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA'
  ], 'policy parity declaration');
  assertTextIncludesAll(context, coreDeclaration, [
    'RmtKernelRuntimePolicyParityReport',
    'createRmtKernelPolicyParity',
    'xtend.rmt.kernel-policy-parity-report.v1'
  ], 'runtime policy parity declaration');
  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_POLICY_PARITY_SCHEMA,
    RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    'remote-output',
    'streaming-output',
    'event-delivery',
    RMT_KERNEL_POLICY_PARITY_LOCAL_GATE
  ], 'policy parity contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_POLICY_PARITY_SCHEMA,
    RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    RMT_KERNEL_POLICY_PARITY_LOCAL_GATE
  ], 'RKSH-WP-08 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-08` | P1 | completed | Policy | Compile-Time-/Runtime-Policy-Paritaet herstellen | `npm run test:rmt-kernel-policy-parity` |',
    RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH,
    RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    paritySchema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
    matrixSchema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
    driftSchema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
    workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelPolicyParityReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-08 Compile-Time Runtime Policy Parity',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Parity: ${summary.paritySchema}`,
      `Matrix: ${summary.matrixSchema}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH,
  RMT_KERNEL_POLICY_PARITY_LOCAL_GATE,
  RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT,
  RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_SCHEMA,
  RMT_KERNEL_POLICY_PARITY_SUITE_PATH,
  RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
  RMT_KERNEL_POLICY_PARITY_WP_PATH,
  runRmtKernelPolicyParitySuite,
  printRmtKernelPolicyParityReport
};
