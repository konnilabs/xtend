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
  RMT_KERNEL_TRUST_VERDICT_SCHEMA,
  createKernelTrustVerdict
} = require('../../tools/rmt-language/kernel-trust-authority');
const {
  DEFAULT_ESCALATION_POLICY,
  KERNEL_PANIC_RECOVERY_ACTIONS,
  KERNEL_PANIC_STATES,
  KERNEL_PANIC_TRIGGERS,
  RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_PANIC_EVENT_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH,
  RMT_KERNEL_PANIC_MONITOR_MODULE_PATH,
  RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT,
  RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_SUITE_PATH,
  RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
  RMT_KERNEL_PANIC_MONITOR_WP_PATH,
  RMT_KERNEL_PANIC_STATE_SCHEMA,
  createKernelPanicMonitor,
  createKernelPanicMonitorContract,
  serializeKernelPanicMonitorContract,
  serializeKernelPanicState
} = require('../../tools/rmt-language/kernel-panic-monitor');

const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-panic-monitor.d.ts';
const RMT_KERNEL_PANIC_MONITOR_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json';
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

function createFakeElement(tagName = 'div') {
  const listeners = new Map();
  const element = {
    tagName: String(tagName || 'div').toUpperCase(),
    attributes: {},
    childNodes: [],
    dataset: {},
    textContent: '',
    addEventListener(type, listener) {
      listeners.set(String(type || ''), listener);
    },
    removeEventListener(type) {
      listeners.delete(String(type || ''));
    },
    setAttribute(name, value) {
      this.attributes[String(name)] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[String(name)];
    },
    replaceChildren(...nodes) {
      this.childNodes = nodes;
    },
    querySelector(selector) {
      return this._queryMap && this._queryMap[selector] ? this._queryMap[selector] : null;
    }
  };
  Object.defineProperty(element, 'innerHTML', {
    get() {
      return this._innerHTML || '';
    },
    set(value) {
      this._innerHTML = String(value || '');
    }
  });
  element.innerHTML = '';
  return element;
}

function createFakeDocument() {
  const documentTarget = {
    createElement(tagName) {
      const element = createFakeElement(tagName);
      element.ownerDocument = documentTarget;
      return element;
    },
    querySelector() {
      return null;
    },
    getElementById() {
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    }
  };
  return documentTarget;
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
  const documentTarget = createFakeDocument();
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-test' },
    CustomEvent,
    document: documentTarget
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, {
      filename: artifactPath
    });
  } catch (error) {
    context.fail(`${artifactPath} evaluates for panic monitor probe (${error.message})`);
    return null;
  }

  if (artifactPath.endsWith('.esm.js')) vm.runInNewContext('globalThis.AppModules = AppModules;', sandbox);
  else sandbox.AppModules = sandbox.XTendRMT || sandbox['xtend.rmt'] || null;
  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules === 'object', `${artifactPath} exposes private/public factory probe`)) {
    return null;
  }
  return {
    AppModules: sandbox.AppModules,
    documentTarget
  };
}

function runStandalonePanicMonitorAssertions(context) {
  assertIncludesAll(context, KERNEL_PANIC_STATES, ['none', 'suspected', 'active', 'recovering', 'recovered', 'failed'], 'panic states');
  assertIncludesAll(context, KERNEL_PANIC_TRIGGERS, [
    'trust-verdict-blocked',
    'trust-verdict-panic',
    'scheduler-failure',
    'command-bus-failure',
    'diagnostics-failure',
    'adapter-output-blocked',
    'recovery-failure'
  ], 'panic triggers');
  assertIncludesAll(context, KERNEL_PANIC_RECOVERY_ACTIONS, [
    'quarantine-scope',
    'rollback-last-safe-snapshot',
    'render-safe-fallback',
    'notify-host'
  ], 'panic recovery actions');

  const diagnosticsHub = createDiagnosticsHub();
  let tick = 1000;
  const monitor = createKernelPanicMonitor({
    diagnosticsHub,
    now: () => {
      tick += 1;
      return tick;
    }
  });
  context.assert(monitor.schema === RMT_KERNEL_PANIC_MONITOR_SCHEMA, 'monitor exposes panic schema');
  context.assert(monitor.getSnapshot().schema === RMT_KERNEL_PANIC_STATE_SCHEMA, 'initial snapshot uses panic state schema');
  context.assert(monitor.getState() === 'none', 'initial panic state is none');
  context.assert(monitor.getEscalationPolicy().repeatedBlockThreshold === DEFAULT_ESCALATION_POLICY.repeatedBlockThreshold, 'default escalation policy is visible');

  const blockedVerdict = createKernelTrustVerdict({
    scope: 'binding',
    sink: 'attribute',
    attributeName: 'onclick',
    value: 'alert(1)',
    sourceRef: 'template:demo/button',
    correlationId: 'panic-demo-blocked'
  });
  const suspected = monitor.recordTrustVerdict(blockedVerdict);
  context.assert(suspected.state === 'suspected', 'first non-critical blocked verdict moves to suspected');
  context.assert(suspected.blockedCommitCount === 1, 'first block increments blocked count');
  context.assert(suspected.correlationId === 'panic-demo-blocked', 'blocked verdict correlation id is preserved');
  context.assert(suspected.lastVerdict && suspected.lastVerdict.schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, 'panic snapshot stores redacted trust verdict summary');

  monitor.recordTrustVerdict({
    ...blockedVerdict,
    correlationId: 'panic-demo-blocked-2'
  });
  const activeByThreshold = monitor.recordTrustVerdict({
    ...blockedVerdict,
    correlationId: 'panic-demo-blocked-3'
  });
  context.assert(activeByThreshold.state === 'active', 'repeated blocked verdicts move to active');
  context.assert(activeByThreshold.trigger === 'threshold-breached', 'threshold breach is a structured trigger');
  context.assert(activeByThreshold.blockedCommitCount === 3, 'threshold keeps blocked count');
  context.assert(activeByThreshold.panicId && activeByThreshold.panicId.startsWith('panic:'), 'active snapshot has panic id');

  const recovering = monitor.beginRecovery({
    recoveryAction: 'quarantine-scope',
    correlationId: activeByThreshold.correlationId
  });
  context.assert(recovering.state === 'recovering', 'recovery start is visible');
  context.assert(recovering.recoveryAttemptCount === 1, 'recovery attempt count increments');
  context.assert(recovering.recoveryAction === 'quarantine-scope', 'recovery action is preserved');

  const recovered = monitor.completeRecovery({
    recoveryAction: 'render-safe-fallback'
  });
  context.assert(recovered.state === 'recovered', 'recovery completion is visible');
  context.assert(recovered.recoveredAt !== null, 'recovered snapshot has timestamp');

  const criticalMonitor = createKernelPanicMonitor({ diagnosticsHub });
  const criticalVerdict = createKernelTrustVerdict({
    scope: 'kernel',
    sink: 'diagnostic-event',
    critical: true,
    sourceRef: 'kernel:diagnostics',
    correlationId: 'critical-trust-violation'
  });
  const activeCritical = criticalMonitor.recordTrustVerdict(criticalVerdict);
  context.assert(activeCritical.state === 'active', 'critical trust verdict deterministically moves to active');
  context.assert(activeCritical.criticalViolationCount === 1, 'critical trust verdict increments critical count');
  context.assert(activeCritical.trigger === 'trust-verdict-panic', 'critical trust verdict is a panic trigger');
  context.assert(activeCritical.severity === 'fatal' || activeCritical.severity === 'critical', 'critical trust verdict is high severity');

  const failed = criticalMonitor.failRecovery({
    recoveryAction: 'rollback-last-safe-snapshot',
    metadata: {
      rawHtml: '<script>alert(1)</script>'
    }
  });
  context.assert(failed.state === 'failed', 'recovery failure is visible');
  context.assert(failed.recoveryFailureCount === 1, 'recovery failure count increments');
  context.assert(!JSON.stringify(criticalMonitor.listEvents()).includes('<script>'), 'panic events redact raw unsafe output');

  const channels = diagnosticsHub.entries.map((entry) => entry.channel);
  context.assert(channels.includes(RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL), 'panic monitor publishes diagnostics events');
  context.assert(criticalMonitor.listEvents().every((event) => event.schema === RMT_KERNEL_PANIC_EVENT_SCHEMA), 'panic events use panic event schema');
  context.assert(JSON.parse(serializeKernelPanicState(activeCritical)).schema === RMT_KERNEL_PANIC_STATE_SCHEMA, 'panic state serialization is parseable JSON');
  context.assert(serializeKernelPanicMonitorContract(createKernelPanicMonitorContract()) === serializeKernelPanicMonitorContract(createKernelPanicMonitorContract()), 'panic contract serialization is stable');
}

function runArtifactProbe(context, rootDir, artifactPath) {
  const loaded = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!loaded) return;
  const { AppModules, documentTarget } = loaded;
  const diagnosticsHub = createDiagnosticsHub();
  const selectors = [
    'safeText',
    'unsafeHref',
    'unsafeOnclick',
    'unsafeInner'
  ];
  const elements = selectors.reduce((result, name) => {
    result[name] = documentTarget.createElement('div');
    return result;
  }, {});
  const rootElement = documentTarget.createElement('section');
  rootElement._queryMap = selectors.reduce((result, name) => {
    result[`[data-bind="${name}"]`] = elements[name];
    return result;
  }, {});

  const renderer = AppModules.createRmtTemplateRuntimeRenderer({
    documentTarget,
    diagnosticsHub
  });
  const session = renderer.applyBindings({
    rootId: 'panic-monitor-root',
    element: rootElement,
    templateQualifiedId: 'panic.monitor.template',
    bindings: [
      { kind: 'property', target: '[data-bind="safeText"]', property: 'textContent', source: 'text' },
      { kind: 'attribute', target: '[data-bind="unsafeHref"]', attribute: 'href', source: 'unsafeHref' },
      { kind: 'attribute', target: '[data-bind="unsafeOnclick"]', attribute: 'onclick', source: 'handler' },
      { kind: 'property', target: '[data-bind="unsafeInner"]', property: 'innerHTML', source: 'html' }
    ],
    modelSnapshot: {
      text: 'Safe text',
      unsafeHref: 'javascript:alert(1)',
      handler: 'alert(1)',
      html: '<script>alert(1)</script>'
    }
  });

  context.assert(typeof renderer.getPanicSnapshot === 'function', `${artifactPath} renderer exposes panic snapshot`);
  context.assert(typeof renderer.listPanicEvents === 'function', `${artifactPath} renderer exposes panic events`);
  context.assert(typeof session.getPanicSnapshot === 'function', `${artifactPath} session exposes panic snapshot`);
  context.assert(renderer.getPanicSnapshot().schema === RMT_KERNEL_PANIC_STATE_SCHEMA, `${artifactPath} renderer panic snapshot uses schema`);
  context.assert(renderer.getPanicSnapshot().state === 'active', `${artifactPath} repeated binding blocks activate panic state`);
  context.assert(renderer.getPanicSnapshot().blockedCommitCount >= 3, `${artifactPath} panic snapshot counts blocked commits`);
  context.assert(renderer.listPanicEvents().some((event) => event.trigger === 'threshold-breached'), `${artifactPath} panic events include threshold trigger`);
  context.assert(session.getPanicSnapshot().state === renderer.getPanicSnapshot().state, `${artifactPath} session shares renderer panic snapshot`);
  context.assert(renderer.beginPanicRecovery({ recoveryAction: 'quarantine-scope' }).state === 'recovering', `${artifactPath} runtime recovery start is visible`);
  context.assert(renderer.completePanicRecovery({ recoveryAction: 'render-safe-fallback' }).state === 'recovered', `${artifactPath} runtime recovery completion is visible`);
  context.assert(renderer.failPanicRecovery({ metadata: { rawHtml: '<script>alert(1)</script>' } }).state === 'failed', `${artifactPath} runtime recovery failure is visible`);
  context.assert(renderer.listPanicEvents().some((event) => event.type === 'recovery-started'), `${artifactPath} panic events include recovery start`);
  context.assert(renderer.listPanicEvents().some((event) => event.type === 'recovery-completed'), `${artifactPath} panic events include recovery completion`);
  context.assert(renderer.listPanicEvents().some((event) => event.type === 'recovery-failed'), `${artifactPath} panic events include recovery failure`);
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL), `${artifactPath} publishes panic diagnostics`);
  context.assert(!JSON.stringify(renderer.listPanicEvents()).includes('<script>'), `${artifactPath} runtime panic events redact raw script output`);
}

function runRmtKernelPanicMonitorSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-panic-monitor',
    label: 'RKSH-WP-04 PanicMonitor State Machine'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelPanicMonitor;
  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-panic-monitor');
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_PANIC_MONITOR_WP_PATH, rootDir);
  const declaration = readText(DECLARATION_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_PANIC_MONITOR_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_PANIC_MONITOR_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_KERNEL_PANIC_MONITOR_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_PANIC_MONITOR_SUITE_PATH,
    RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH,
    RMT_KERNEL_PANIC_MONITOR_WP_PATH,
    RMT_KERNEL_SECURITY_BACKLOG,
    ...RMT_ARTIFACTS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel panic monitor module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel panic monitor suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-panic-monitor.js', 'package exports panic monitor module');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-panic-monitor.d.ts', 'package exports panic monitor declarations');
  context.assert(packageManifest.scripts['test:rmt-kernel-panic-monitor'] === 'node scripts/run_xtend_tests.js rmt-kernel-panic-monitor', 'package exposes panic monitor script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_PANIC_MONITOR_SCHEMA, 'package metadata exposes panic monitor schema');
  context.assert(metadata && metadata.stateSchema === RMT_KERNEL_PANIC_STATE_SCHEMA, 'package metadata exposes panic state schema');
  context.assert(metadata && metadata.eventSchema === RMT_KERNEL_PANIC_EVENT_SCHEMA, 'package metadata exposes panic event schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA, 'package metadata exposes panic report schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE, 'package metadata points to RKSH-WP-04');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_PANIC_MONITOR_LOCAL_GATE, 'package metadata exposes panic local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT, 'package metadata exposes panic package script');
  context.assert(runner.hasSuite("rmt-kernel-panic-monitor"), 'runner registers panic monitor suite');
  context.assert(runner.hasImplementation({ function: "runRmtKernelPanicMonitorSuite" }), 'runner imports panic monitor suite');

  runStandalonePanicMonitorAssertions(context);

  RMT_ARTIFACTS.forEach((artifactPath) => {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_KERNEL_PANIC_MONITOR_SCHEMA,
      RMT_KERNEL_PANIC_STATE_SCHEMA,
      RMT_KERNEL_PANIC_EVENT_SCHEMA,
      'createRuntimePanicMonitor',
      'recordRuntimePanicTrustVerdict',
      'getPanicSnapshot',
      'listPanicEvents'
    ], `${artifactPath} panic monitor integration`);
    runArtifactProbe(context, rootDir, artifactPath);
  });

  assertTextIncludesAll(context, declaration, [
    'RmtKernelPanicMonitor',
    'RmtKernelPanicState',
    'RmtKernelPanicEvent',
    'createKernelPanicMonitor',
    'RMT_KERNEL_PANIC_STATE_SCHEMA'
  ], 'panic monitor declaration');
  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    RMT_KERNEL_PANIC_STATE_SCHEMA,
    'trust-verdict-panic',
    'recovery-started',
    RMT_KERNEL_PANIC_MONITOR_LOCAL_GATE
  ], 'panic monitor contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    RMT_KERNEL_PANIC_STATE_SCHEMA,
    RMT_KERNEL_PANIC_MONITOR_LOCAL_GATE
  ], 'RKSH-WP-04 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-04` | P0 | completed | Panic | `PanicMonitor` State Machine bauen | `npm run test:rmt-kernel-panic-monitor` |',
    RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH,
    RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    stateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    eventSchema: RMT_KERNEL_PANIC_EVENT_SCHEMA,
    workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelPanicMonitorReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-04 PanicMonitor State Machine',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Monitor: ${summary.panicMonitorSchema}`,
      `State: ${summary.stateSchema}`,
      `Event: ${summary.eventSchema}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH,
  RMT_KERNEL_PANIC_MONITOR_LOCAL_GATE,
  RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT,
  RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_MONITOR_SUITE_PATH,
  RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
  RMT_KERNEL_PANIC_MONITOR_WP_PATH,
  runRmtKernelPanicMonitorSuite,
  printRmtKernelPanicMonitorReport
};
