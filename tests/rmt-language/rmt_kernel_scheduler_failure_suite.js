const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL } = require('url');
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
  KERNEL_SCHEDULER_FAILURE_SEVERITIES,
  KERNEL_SCHEDULER_FAILURE_STATUSES,
  KERNEL_SCHEDULER_FINAL_STATUSES,
  RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT,
  RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
  RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH,
  classifySchedulerFinalStatus,
  createKernelSchedulerFailureContract,
  createKernelSchedulerFailureController,
  createKernelSchedulerFailurePolicy,
  createKernelSchedulerFailureRecord,
  redactSchedulerFailureMetadata,
  serializeKernelSchedulerFailureContract,
  serializeKernelSchedulerFailureRecord
} = require('../../tools/rmt-language/kernel-scheduler-failure');

const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-scheduler-failure.d.ts';
const RMT_KERNEL_SCHEDULER_FAILURE_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json';
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

function createImmediateHost() {
  let current = 0;
  return {
    hostKind: 'wp07-immediate',
    now() {
      current += 1;
      return current;
    },
    scheduleTimeout(callback) {
      callback();
      return { kind: 'timeout' };
    },
    clearTimeout() {},
    scheduleAnimationFrame(callback) {
      callback();
      return { kind: 'raf' };
    },
    cancelAnimationFrame() {},
    scheduleIdleCallback(callback) {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return { kind: 'idle' };
    },
    cancelIdleCallback() {}
  };
}

function createDeferredHost() {
  let current = 0;
  let id = 0;
  const handles = [];
  function schedule(callback, kind) {
    const handle = {
      id: id += 1,
      kind,
      callback,
      cleared: false
    };
    handles.push(handle);
    return handle;
  }
  function clear(handle) {
    if (handle) handle.cleared = true;
  }
  return {
    hostKind: 'wp07-deferred',
    handles,
    now() {
      current += 1;
      return current;
    },
    scheduleTimeout(callback) {
      return schedule(callback, 'timeout');
    },
    clearTimeout: clear,
    scheduleAnimationFrame(callback) {
      return schedule(callback, 'raf');
    },
    cancelAnimationFrame: clear,
    scheduleIdleCallback(callback) {
      return schedule(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 'idle');
    },
    cancelIdleCallback: clear,
    flushOne() {
      const handle = handles.find((entry) => entry.cleared !== true);
      if (!handle) return false;
      handle.cleared = true;
      handle.callback();
      return true;
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
    context.fail(`${artifactPath} evaluates for scheduler failure probe (${error.message})`);
    return null;
  }

  if (artifactPath.endsWith('.esm.js')) vm.runInNewContext('globalThis.AppModules = AppModules;', sandbox);
  else sandbox.AppModules = sandbox.XTendRMT || sandbox['xtend.rmt'] || null;
  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules === 'object', `${artifactPath} exposes private/public factory probe`)) {
    return null;
  }
  return sandbox.AppModules;
}

function runStandaloneSchedulerFailureAssertions(context) {
  assertIncludesAll(context, KERNEL_SCHEDULER_FINAL_STATUSES, ['executed', 'failed', 'aborted', 'panic_blocked'], 'scheduler final statuses');
  assertIncludesAll(context, KERNEL_SCHEDULER_FAILURE_STATUSES, ['failed', 'aborted', 'panic_blocked'], 'scheduler failure statuses');
  assertIncludesAll(context, KERNEL_SCHEDULER_FAILURE_SEVERITIES, ['error', 'critical', 'fatal'], 'scheduler failure severities');

  const policy = createKernelSchedulerFailurePolicy();
  context.assert(policy.schema === RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA, 'scheduler failure policy uses policy schema');
  context.assert(policy.callbackFailureSeverity === 'critical', 'callback failure defaults to critical');
  context.assert(policy.backpressureActivatesPanic === true, 'backpressure panic coupling is enabled by default');

  context.assert(classifySchedulerFinalStatus({ status: 'executed', reason: 'callback_error' }) === 'failed', 'callback_error is classified as failed');
  context.assert(classifySchedulerFinalStatus({ status: 'cancelled', reason: 'recovery_aborted' }) === 'aborted', 'recovery abort is classified as aborted');
  context.assert(classifySchedulerFinalStatus({ status: 'cancelled', reason: 'panic_blocked' }) === 'panic_blocked', 'panic block is classified separately');

  const callbackRecord = createKernelSchedulerFailureRecord({
    jobId: 'job-callback',
    status: 'executed',
    reason: 'callback_error',
    error: new Error('callback boom'),
    metadata: {
      payload: '<script>alert(1)</script>'
    },
    createdAt: 1000
  });
  context.assert(callbackRecord.schema === RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA, 'callback failure creates record schema');
  context.assert(callbackRecord.status === 'failed', 'callback failure record is failed');
  context.assert(callbackRecord.panicRelevant === true, 'callback failure can activate panic');
  context.assert(!JSON.stringify(callbackRecord).includes('<script>'), 'callback failure record redacts payload samples');
  context.assert(JSON.parse(serializeKernelSchedulerFailureRecord(callbackRecord)).schema === RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA, 'record serialization is parseable');

  const diagnosticsHub = {
    entries: [],
    publish(channel, payload, meta = {}) {
      this.entries.push({ channel, payload, meta });
    }
  };
  const panicProbe = createPanicMonitorProbe();
  const controller = createKernelSchedulerFailureController({
    diagnosticsHub,
    panicMonitor: panicProbe,
    now: () => 2000
  });
  const aborted = controller.recordAbort({
    jobId: 'job-abort',
    reason: 'recovery_aborted',
    severity: 'error'
  });
  context.assert(aborted.status === 'aborted', 'controller records aborted scheduler jobs');
  context.assert(aborted.panicRelevant === false, 'non-critical abort does not force panic');

  const panicBlocked = controller.recordPanicBlocked({
    jobId: 'job-panic',
    severity: 'critical'
  });
  context.assert(panicBlocked.status === 'panic_blocked', 'controller records panic-blocked jobs');
  context.assert(panicProbe.signals.some((signal) => signal.trigger === 'scheduler-failure'), 'panic-blocked jobs record scheduler panic signal');

  const backpressure = controller.recordBackpressure({
    pressureLevel: 'critical',
    metadata: {
      rawHtml: '<script>alert(1)</script>'
    }
  });
  context.assert(backpressure.trigger === 'scheduler-backpressure', 'backpressure uses explicit panic trigger');
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL), 'scheduler failure diagnostics are published');
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL), 'scheduler failure escalation diagnostics are published');
  context.assert(controller.listFailures().length === 3, 'controller retains scheduler failure records');
  context.assert(!JSON.stringify(redactSchedulerFailureMetadata({ rawHtml: '<script>alert(1)</script>' })).includes('<script>'), 'redaction helper removes unsafe scheduler samples');

  const contract = createKernelSchedulerFailureContract();
  context.assert(contract.schema === RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA, 'scheduler failure contract exposes schema');
  context.assert(contract.recordSchema === RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA, 'scheduler failure contract exposes record schema');
  context.assert(serializeKernelSchedulerFailureContract(contract) === serializeKernelSchedulerFailureContract(createKernelSchedulerFailureContract()), 'scheduler failure contract serialization is stable');
}

async function runArtifactProbe(context, rootDir, artifactPath, createRmtKernelScheduler) {
  const AppModules = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!AppModules) return;

  const callbackScheduler = createRmtKernelScheduler();
  const callbackEngine = AppModules.createRmtEngine({
    hostAdapter: createImmediateHost(),
    scheduler: callbackScheduler
  });

  const failedHandle = callbackEngine.schedule('scope-callback-failure', () => {
    throw new Error('scheduler callback failed');
  }, {
    lane: 'critical_input'
  });
  let callbackRejected = false;
  await failedHandle.catch(() => {
    callbackRejected = true;
  });
  const callbackStats = callbackEngine.getSchedulerStats();
  context.assert(callbackRejected === true, `${artifactPath} exposes callback failure through JobHandle.result`);
  context.assert(failedHandle.status === 'failed', `${artifactPath} callback failure reaches failed state`);
  context.assert(callbackStats.executed === 0, `${artifactPath} callback failure is not counted as executed`);
  context.assert(callbackStats.failed === 1, `${artifactPath} callback failure increments failed metric`);

  const recoveryScheduler = createRmtKernelScheduler();
  const recoveryEngine = AppModules.createRmtEngine({
    hostAdapter: createDeferredHost(),
    scheduler: recoveryScheduler
  });

  let abortedRan = false;
  const abortedHandle = recoveryEngine.schedule('scope-abort', () => {
    abortedRan = true;
  }, {
    preferIdle: false,
    lane: 'critical_input'
  });
  const abortedCount = recoveryEngine.abortScope('scope-abort', 'recovery_aborted');
  const afterAbortStats = recoveryEngine.getSchedulerStats();
  context.assert(abortedCount === 1, `${artifactPath} abortScope aborts one pending scheduler job`);
  context.assert(abortedRan === false, `${artifactPath} aborted scheduler job does not run`);
  context.assert(abortedHandle.status === 'cancelled', `${artifactPath} queued scope abort exposes deterministic cancelled status`);
  context.assert(afterAbortStats.cancelled === 1, `${artifactPath} queued cancellation metric is separated`);

  let recoveredRuns = 0;
  const recoveredHandle = recoveryEngine.schedule('scope-abort', () => {
    recoveredRuns += 1;
    return 'recovered';
  }, {
    lane: 'critical_input'
  });
  context.assert(await recoveredHandle === 'recovered', `${artifactPath} recovery reschedule is awaitable`);
  const afterRecoveryStats = recoveryEngine.getSchedulerStats();
  context.assert(recoveredRuns === 1, `${artifactPath} recovery reschedule executes on fresh token`);
  context.assert(afterRecoveryStats.executed === 1, `${artifactPath} recovery reschedule increments executed metric`);

  const panicScheduler = createRmtKernelScheduler({
    isPanicBlocked: () => true
  });
  const panicEngine = AppModules.createRmtEngine({
    hostAdapter: createImmediateHost(),
    scheduler: panicScheduler
  });
  const panicHandle = panicEngine.schedule('scope-panic', () => 'blocked', { lane: 'critical_input' });
  await panicHandle.catch(() => undefined);
  context.assert(panicHandle.status === 'panic_blocked', `${artifactPath} panic monitor blocks work before execution`);
  context.assert(panicEngine.getSchedulerStats().panicBlocked === 1, `${artifactPath} panicBlocked metric is separated`);

  recoveryEngine.reportPerformanceSample({
    pressureLevel: 'critical'
  });
  context.assert(recoveryEngine.getSchedulerPressureLevel() === 'critical', `${artifactPath} critical performance sample raises scheduler pressure`);
  const diagnostics = recoveryEngine.getSchedulerDiagnostics();
  context.assert(diagnostics.schema === 'xtend.rmt.kernel-scheduler.v1', `${artifactPath} diagnostics originate from the microkernel`);
  context.assert(recoveryEngine.getScheduler() === recoveryScheduler, `${artifactPath} engine exposes the injected scheduler identity`);
}

async function runRmtKernelSchedulerFailureSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const schedulerModuleUrl = `${pathToFileURL(resolveRepoPath('xtendrmt/rmt-kernel-scheduler.js', rootDir)).href}?scheduler-failure-suite=${Date.now()}`;
  const { createRmtKernelScheduler } = await import(schedulerModuleUrl);
  const context = createSuiteContext({
    id: 'rmt-kernel-scheduler-failure',
    label: 'RKSH-WP-07 Scheduler Failure Semantics'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelSchedulerFailure;
  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-scheduler-failure');
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const catalog = readText('catalog/type-exports-rmt.js', rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH, rootDir);
  const declaration = readText(DECLARATION_PATH, rootDir);
  const coreDeclaration = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH,
    RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH,
    RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH,
    RMT_KERNEL_SECURITY_BACKLOG,
    ...RMT_ARTIFACTS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel scheduler failure module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel scheduler failure suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-scheduler-failure.js', 'package exports scheduler failure module');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-scheduler-failure.d.ts', 'package exports scheduler failure declarations');
  context.assert(packageManifest.scripts['test:rmt-kernel-scheduler-failure'] === 'node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure', 'package exposes scheduler failure script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA, 'package metadata exposes scheduler failure schema');
  context.assert(metadata && metadata.policySchema === RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA, 'package metadata exposes scheduler failure policy schema');
  context.assert(metadata && metadata.recordSchema === RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA, 'package metadata exposes scheduler failure record schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA, 'package metadata exposes scheduler failure report schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE, 'package metadata points to RKSH-WP-07');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_SCHEDULER_FAILURE_LOCAL_GATE, 'package metadata exposes scheduler failure local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT, 'package metadata exposes scheduler failure package script');
  context.assertIncludes(runner, "id: 'rmt-kernel-scheduler-failure'", 'runner registers scheduler failure suite');
  context.assertIncludes(runner, 'runRmtKernelSchedulerFailureSuite', 'runner imports scheduler failure suite');
  context.assertIncludes(catalog, './rmt-language/kernel-scheduler-failure', 'type export catalog includes scheduler failure export');

  runStandaloneSchedulerFailureAssertions(context);

  for (const artifactPath of RMT_ARTIFACTS) {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      'RMT Engine 0.8 benoetigt genau eine injizierte Kernel-Scheduler-Instanz.',
      'getScheduler: () => schedulerAuthority',
      'schedulerAuthority.schedule',
      'panic_blocked',
      'abortScope',
      'panicBlockScope'
    ], `${artifactPath} scheduler failure integration`);
    context.assert(!artifactSource.includes('createRmtQueue'), `${artifactPath} contains no legacy queue factory`);
    await runArtifactProbe(context, rootDir, artifactPath, createRmtKernelScheduler);
  }

  assertTextIncludesAll(context, declaration, [
    'RmtKernelSchedulerFailureController',
    'RmtKernelSchedulerFailureRecord',
    'createKernelSchedulerFailureController',
    'RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA'
  ], 'scheduler failure declaration');
  assertTextIncludesAll(context, coreDeclaration, [
    'RmtKernelRuntimeSchedulerFailureRecord',
    'RmtKernelRuntimeSchedulerFailurePolicy',
    'abortScope(scope: string, reason?: string): number;',
    'panicBlockScope(scope: string, reason?: string): number;',
    'xtend.rmt.kernel-scheduler-failure-record.v1'
  ], 'runtime scheduler failure declaration');
  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
    'callback_error',
    'panic_blocked',
    RMT_KERNEL_SCHEDULER_FAILURE_LOCAL_GATE
  ], 'scheduler failure contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
    RMT_KERNEL_SCHEDULER_FAILURE_LOCAL_GATE
  ], 'RKSH-WP-07 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-07` | P1 | completed | Scheduler | Scheduler-Failure-Semantik korrigieren | `npm run test:rmt-kernel-scheduler-failure` |',
    RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH,
    RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA,
    schedulerFailureSchema: RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
    policySchema: RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA,
    recordSchema: RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA,
    workpackage: RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelSchedulerFailureReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-07 Scheduler Failure Semantics',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Scheduler Failure: ${summary.schedulerFailureSchema}`,
      `Record: ${summary.recordSchema}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_LOCAL_GATE,
  RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT,
  RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA,
  RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH,
  RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE,
  RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH,
  runRmtKernelSchedulerFailureSuite,
  printRmtKernelSchedulerFailureReport
};
