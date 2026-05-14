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
  createKernelPanicMonitor
} = require('../../tools/rmt-language/kernel-panic-monitor');
const {
  DEFAULT_KERNEL_ESCALATION_POLICY,
  KERNEL_ESCALATION_EVENT_TYPES,
  KERNEL_ESCALATION_SEVERITIES,
  KERNEL_ESCALATION_SOURCES,
  RMT_KERNEL_ESCALATION_CONTRACT_PATH,
  RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
  RMT_KERNEL_ESCALATION_MODULE_PATH,
  RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT,
  RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
  RMT_KERNEL_ESCALATION_REPORT_SCHEMA,
  RMT_KERNEL_ESCALATION_SCHEMA,
  RMT_KERNEL_ESCALATION_SUITE_PATH,
  RMT_KERNEL_ESCALATION_WORKPACKAGE,
  RMT_KERNEL_ESCALATION_WP_PATH,
  createKernelEscalationContract,
  createKernelEscalationController,
  createKernelEscalationEnvelope,
  createKernelEscalationPolicy,
  redactEscalationMetadata,
  serializeKernelEscalationContract,
  serializeKernelEscalationEnvelope
} = require('../../tools/rmt-language/kernel-escalation');

const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-escalation.d.ts';
const RMT_KERNEL_ESCALATION_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-escalation --json';
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
      const snapshot = { channel, payload, meta };
      entries.push(snapshot);
      return snapshot;
    }
  };
}

function createPanicMonitorProbe() {
  const signals = [];
  return {
    signals,
    recordSignal(signal) {
      signals.push(signal);
      return {
        schema: 'xtend.rmt.kernel-panic-state.v1',
        state: 'active',
        trigger: signal.trigger,
        severity: signal.severity,
        scope: signal.scope || null,
        correlationId: signal.correlationId || null
      };
    }
  };
}

function createRmtAppModulesFromArtifact(context, rootDir, artifactPath) {
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = artifactPath.endsWith('.esm.js')
    ? source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
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
    context.fail(`${artifactPath} evaluates for escalation probe (${error.message})`);
    return null;
  }

  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules === 'object', `${artifactPath} exposes AppModules`)) {
    return null;
  }
  return sandbox.AppModules;
}

function runStandaloneEscalationAssertions(context) {
  assertIncludesAll(context, KERNEL_ESCALATION_SOURCES, ['diagnostics', 'command-bus'], 'escalation sources');
  assertIncludesAll(context, KERNEL_ESCALATION_EVENT_TYPES, [
    'diagnostics-subscriber-failure',
    'command-handler-failure',
    'command-response-failed',
    'command-missing-handler',
    'command-subscriber-failure'
  ], 'escalation event types');
  assertIncludesAll(context, KERNEL_ESCALATION_SEVERITIES, ['warning', 'error', 'critical', 'fatal'], 'escalation severities');

  const policy = createKernelEscalationPolicy();
  context.assert(policy.schema === RMT_KERNEL_ESCALATION_POLICY_SCHEMA, 'escalation policy uses policy schema');
  context.assert(policy.panicSeverityThreshold === DEFAULT_KERNEL_ESCALATION_POLICY.panicSeverityThreshold, 'default panic threshold is visible');

  const diagnosticsHub = createDiagnosticsHub();
  const panicMonitor = createKernelPanicMonitor({ diagnosticsHub });
  const controller = createKernelEscalationController({
    diagnosticsHub,
    panicMonitor,
    now: () => 1000
  });

  const softDiagnostic = controller.recordDiagnosticsSubscriberFailure({
    channel: 'telemetry.safe',
    severity: 'warning',
    error: new Error('telemetry subscriber failed'),
    metadata: {
      payload: '<script>alert(1)</script>'
    }
  });
  context.assert(softDiagnostic.schema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, 'soft diagnostics failure creates escalation envelope');
  context.assert(softDiagnostic.panicRelevant === false, 'soft diagnostics failure is not panic relevant');
  context.assert(panicMonitor.getState() === 'none', 'soft diagnostics failure does not activate panic');
  context.assert(!JSON.stringify(softDiagnostic).includes('<script>'), 'soft diagnostics envelope redacts raw payload');

  const criticalDiagnostic = controller.recordDiagnosticsSubscriberFailure({
    channel: 'telemetry.critical',
    severity: 'critical',
    panicRelevant: true,
    error: new Error('critical diagnostics subscriber failed'),
    correlationId: 'diag-critical'
  });
  context.assert(criticalDiagnostic.panicRelevant === true, 'critical diagnostics failure is panic relevant');
  context.assert(criticalDiagnostic.panicState && criticalDiagnostic.panicState.state === 'active', 'critical diagnostics failure activates panic');
  context.assert(panicMonitor.getSnapshot().trigger === 'diagnostics-failure', 'diagnostics failure records panic trigger');

  const softCommand = controller.recordCommandHandlerFailure({
    commandName: 'surface.soft',
    severity: 'error',
    responseStatus: 'failed',
    error: new Error('soft command failed')
  });
  context.assert(softCommand.source === 'command-bus', 'command failure is sourced from command bus');
  context.assert(softCommand.panicRelevant === false, 'non-critical command failure remains non-panic');

  const criticalCommand = controller.recordCommandHandlerFailure({
    commandName: 'surface.commit',
    severity: 'critical',
    panicRelevant: true,
    trustRelevant: true,
    responseStatus: 'failed',
    error: new Error('critical command failed'),
    correlationId: 'cmd-critical'
  });
  context.assert(criticalCommand.panicRelevant === true, 'critical command failure is panic relevant');
  context.assert(criticalCommand.panicState && criticalCommand.panicState.state === 'active', 'critical command failure activates panic');
  context.assert(criticalCommand.trigger === 'command-bus-failure', 'critical command failure maps to command-bus panic trigger');
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL), 'escalation diagnostics are published');
  context.assert(controller.listEscalations().length === 4, 'controller retains escalation envelopes');

  const directEnvelope = createKernelEscalationEnvelope({
    source: 'command-bus',
    eventType: 'command-response-failed',
    severity: 'fatal',
    commandName: 'demo',
    metadata: {
      html: '<script>alert(1)</script>'
    }
  });
  context.assert(directEnvelope.panicRelevant === true, 'fatal envelope is panic relevant');
  context.assert(JSON.parse(serializeKernelEscalationEnvelope(directEnvelope)).schema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, 'envelope serialization is parseable');
  context.assert(!JSON.stringify(redactEscalationMetadata({ rawHtml: '<script>alert(1)</script>' })).includes('<script>'), 'redaction helper removes unsafe payload samples');

  const contract = createKernelEscalationContract();
  context.assert(contract.schema === RMT_KERNEL_ESCALATION_SCHEMA, 'escalation contract exposes escalation schema');
  context.assert(contract.envelopeSchema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, 'escalation contract exposes envelope schema');
  context.assert(serializeKernelEscalationContract(contract) === serializeKernelEscalationContract(createKernelEscalationContract()), 'escalation contract serialization is stable');
}

async function runArtifactProbe(context, rootDir, artifactPath) {
  const AppModules = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!AppModules) return;

  const diagnosticsPanicProbe = createPanicMonitorProbe();
  const diagnosticsHub = AppModules.createRmtDiagnosticsHub({
    panicMonitor: diagnosticsPanicProbe
  });
  context.assert(typeof diagnosticsHub.listEscalations === 'function', `${artifactPath} diagnostics hub exposes escalation history`);
  context.assert(typeof diagnosticsHub.recordEscalation === 'function', `${artifactPath} diagnostics hub exposes explicit escalation recording`);

  diagnosticsHub.subscribe('telemetry.safe', () => {
    throw new Error('soft telemetry failure');
  }, {
    severity: 'warning',
    sourceRef: 'diagnostics:safe'
  });
  diagnosticsHub.publish('telemetry.safe', { ok: true });
  context.assert(diagnosticsHub.listEscalations().length === 1, `${artifactPath} records non-critical diagnostics subscriber failure`);
  context.assert(diagnosticsPanicProbe.signals.length === 0, `${artifactPath} keeps non-critical diagnostics failure out of panic`);

  diagnosticsHub.subscribe('telemetry.critical', () => {
    throw new Error('critical telemetry failure');
  }, {
    severity: 'critical',
    panicRelevant: true,
    trustRelevant: true,
    correlationId: 'diag-critical'
  });
  diagnosticsHub.publish('telemetry.critical', { ok: false }, { correlationId: 'diag-critical' });
  const latestDiagnosticEscalation = diagnosticsHub.listEscalations().slice(-1)[0];
  context.assert(latestDiagnosticEscalation.schema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, `${artifactPath} diagnostics escalation uses envelope schema`);
  context.assert(latestDiagnosticEscalation.eventType === 'diagnostics-subscriber-failure', `${artifactPath} diagnostics escalation classifies subscriber failure`);
  context.assert(latestDiagnosticEscalation.panicRelevant === true, `${artifactPath} critical diagnostics failure is panic relevant`);
  context.assert(diagnosticsPanicProbe.signals.some((signal) => signal.trigger === 'diagnostics-failure'), `${artifactPath} critical diagnostics failure records panic signal`);
  context.assert(diagnosticsHub.getChannelSnapshot(RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL).payload.schema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, `${artifactPath} diagnostics publishes escalation channel`);

  const commandPanicProbe = createPanicMonitorProbe();
  const commandBus = AppModules.createRmtCommandBus({
    diagnosticsHub,
    panicMonitor: commandPanicProbe
  });
  context.assert(typeof commandBus.listEscalations === 'function', `${artifactPath} command bus exposes escalation history`);
  context.assert(typeof commandBus.getEscalationPolicy === 'function', `${artifactPath} command bus exposes escalation policy`);

  commandBus.registerHandler('soft.fail', () => {
    throw new Error('soft command failure');
  });
  const softResponse = await commandBus.dispatch({
    commandName: 'soft.fail',
    correlationId: 'cmd-soft'
  });
  context.assert(softResponse.status === 'failed', `${artifactPath} soft command still returns failed response`);
  context.assert(softResponse.severity === 'error', `${artifactPath} soft command failure records error severity`);
  context.assert(softResponse.failureEscalation && softResponse.failureEscalation.panicRelevant === false, `${artifactPath} soft command failure remains non-panic`);
  context.assert(commandPanicProbe.signals.length === 0, `${artifactPath} soft command failure does not panic`);

  commandBus.registerHandler('critical.fail', () => {
    const error = new Error('critical command failure');
    error.severity = 'critical';
    error.panicRelevant = true;
    error.trustRelevant = true;
    throw error;
  });
  const criticalResponse = await commandBus.dispatch({
    commandName: 'critical.fail',
    correlationId: 'cmd-critical',
    rootId: 'root-critical',
    meta: {
      trustRelevant: true
    }
  });
  context.assert(criticalResponse.status === 'failed', `${artifactPath} critical command returns failed response`);
  context.assert(criticalResponse.severity === 'critical', `${artifactPath} critical command failure preserves severity`);
  context.assert(criticalResponse.trustRelevant === true, `${artifactPath} critical command failure preserves trust relevance`);
  context.assert(criticalResponse.failureEscalation && criticalResponse.failureEscalation.schema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, `${artifactPath} critical response links escalation envelope`);
  context.assert(criticalResponse.failureEscalation.panicRelevant === true, `${artifactPath} critical command failure is panic relevant`);
  context.assert(commandPanicProbe.signals.some((signal) => signal.trigger === 'command-bus-failure'), `${artifactPath} critical command failure records panic signal`);
  context.assert(commandBus.listEscalations().some((entry) => entry.eventType === 'command-handler-failure'), `${artifactPath} command bus records handler failure escalation`);

  commandBus.subscribe(() => {
    throw new Error('subscriber fail');
  }, {
    severity: 'critical',
    panicRelevant: true,
    sourceRef: 'command-bus:subscriber'
  });
  commandBus.registerHandler('ok', () => ({ ok: true }));
  const okResponse = await commandBus.dispatch({
    commandName: 'ok',
    correlationId: 'cmd-ok'
  });
  context.assert(okResponse.status === 'succeeded', `${artifactPath} subscriber failure does not break successful command`);
  context.assert(commandBus.listEscalations().some((entry) => entry.eventType === 'command-subscriber-failure'), `${artifactPath} command subscriber failure is escalated`);
}

async function runRmtKernelEscalationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-escalation',
    label: 'RKSH-WP-06 Diagnostics and Command Bus Escalation'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelEscalation;
  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-escalation');
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const catalog = readText('catalog/type-exports-rmt.js', rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_ESCALATION_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_ESCALATION_WP_PATH, rootDir);
  const declaration = readText(DECLARATION_PATH, rootDir);
  const coreDeclaration = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_ESCALATION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_ESCALATION_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_KERNEL_ESCALATION_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_ESCALATION_SUITE_PATH,
    RMT_KERNEL_ESCALATION_CONTRACT_PATH,
    RMT_KERNEL_ESCALATION_WP_PATH,
    RMT_KERNEL_SECURITY_BACKLOG,
    ...RMT_ARTIFACTS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel escalation module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel escalation suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-escalation.js', 'package exports escalation module');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-escalation.d.ts', 'package exports escalation declarations');
  context.assert(packageManifest.scripts['test:rmt-kernel-escalation'] === 'node scripts/run_xtend_tests.js rmt-kernel-escalation', 'package exposes escalation script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_ESCALATION_SCHEMA, 'package metadata exposes escalation schema');
  context.assert(metadata && metadata.policySchema === RMT_KERNEL_ESCALATION_POLICY_SCHEMA, 'package metadata exposes escalation policy schema');
  context.assert(metadata && metadata.envelopeSchema === RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA, 'package metadata exposes escalation envelope schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_ESCALATION_REPORT_SCHEMA, 'package metadata exposes escalation report schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_ESCALATION_WORKPACKAGE, 'package metadata points to RKSH-WP-06');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_ESCALATION_LOCAL_GATE, 'package metadata exposes escalation local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT, 'package metadata exposes escalation package script');
  context.assertIncludes(runner, "id: 'rmt-kernel-escalation'", 'runner registers escalation suite');
  context.assertIncludes(runner, 'runRmtKernelEscalationSuite', 'runner imports escalation suite');
  context.assertIncludes(catalog, './rmt-language/kernel-escalation', 'type export catalog includes escalation export');

  runStandaloneEscalationAssertions(context);

  for (const artifactPath of RMT_ARTIFACTS) {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_KERNEL_ESCALATION_SCHEMA,
      RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
      'diagnostics-subscriber-failure',
      'command-handler-failure',
      'failureEscalation',
      'listEscalations',
      'recordEscalation'
    ], `${artifactPath} escalation integration`);
    await runArtifactProbe(context, rootDir, artifactPath);
  }

  assertTextIncludesAll(context, declaration, [
    'RmtKernelEscalationController',
    'RmtKernelEscalationEnvelope',
    'createKernelEscalationController',
    'RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA'
  ], 'escalation declaration');
  assertTextIncludesAll(context, coreDeclaration, [
    'RmtKernelRuntimeEscalationEnvelope',
    'RmtKernelRuntimeEscalationPolicy',
    'xtend.rmt.kernel-escalation-envelope.v1'
  ], 'runtime escalation declaration');
  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_ESCALATION_SCHEMA,
    RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
    'diagnostics-subscriber-failure',
    'command-handler-failure',
    RMT_KERNEL_ESCALATION_LOCAL_GATE
  ], 'escalation contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_ESCALATION_SCHEMA,
    RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
    RMT_KERNEL_ESCALATION_LOCAL_GATE
  ], 'RKSH-WP-06 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-06` | P1 | completed | Diagnostics | Diagnostics und Command Bus Eskalation anbinden | `npm run test:rmt-kernel-escalation` |',
    RMT_KERNEL_ESCALATION_CONTRACT_PATH,
    RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_ESCALATION_REPORT_SCHEMA,
    escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
    policySchema: RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
    envelopeSchema: RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
    workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelEscalationReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-06 Diagnostics and Command Bus Escalation',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Escalation: ${summary.escalationSchema}`,
      `Envelope: ${summary.envelopeSchema}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_ESCALATION_CONTRACT_PATH,
  RMT_KERNEL_ESCALATION_LOCAL_GATE,
  RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT,
  RMT_KERNEL_ESCALATION_REPORT_SCHEMA,
  RMT_KERNEL_ESCALATION_SCHEMA,
  RMT_KERNEL_ESCALATION_SUITE_PATH,
  RMT_KERNEL_ESCALATION_WORKPACKAGE,
  RMT_KERNEL_ESCALATION_WP_PATH,
  runRmtKernelEscalationSuite,
  printRmtKernelEscalationReport
};
