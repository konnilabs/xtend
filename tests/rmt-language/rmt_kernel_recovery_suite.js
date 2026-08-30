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
  KERNEL_RECOVERY_ACTIONS,
  RMT_KERNEL_RECOVERY_CONTRACT_PATH,
  RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_RECOVERY_MODULE_PATH,
  RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
  RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT,
  RMT_KERNEL_RECOVERY_PLAN_SCHEMA,
  RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
  RMT_KERNEL_RECOVERY_REPORT_SCHEMA,
  RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
  RMT_KERNEL_RECOVERY_SCHEMA,
  RMT_KERNEL_RECOVERY_SUITE_PATH,
  RMT_KERNEL_RECOVERY_WORKPACKAGE,
  RMT_KERNEL_RECOVERY_WP_PATH,
  createKernelRecoveryContract,
  createKernelRecoveryController,
  sanitizeRecoveryHtml,
  serializeKernelRecoveryContract,
  serializeKernelRecoveryOutcome
} = require('../../tools/rmt-language/kernel-recovery');

const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-recovery.d.ts';
const RMT_KERNEL_RECOVERY_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-recovery --json';
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

function createFakeFragment(html = '') {
  return {
    nodeType: 11,
    html: String(html || ''),
    childNodes: [],
    cloneNode() {
      return createFakeFragment(this.html);
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
      this._innerHTML = nodes.map((node) => (
        node && typeof node.html === 'string' ? node.html : String(node || '')
      )).join('');
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
      if (this.tagName === 'TEMPLATE') {
        this.content = createFakeFragment(this._innerHTML);
      }
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
    context.fail(`${artifactPath} evaluates for recovery probe (${error.message})`);
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

function runStandaloneRecoveryAssertions(context) {
  assertIncludesAll(context, KERNEL_RECOVERY_ACTIONS, [
    'quarantine-scope',
    'pause-scheduler-jobs',
    'restore-last-safe-snapshot',
    'render-safe-fallback',
    'notify-host'
  ], 'recovery actions');

  const sanitized = sanitizeRecoveryHtml('<strong onclick="alert(1)">Safe</strong><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
  context.assert(sanitized.html.includes('<strong>Safe</strong>'), 'recovery sanitizer keeps safe markup');
  context.assert(!sanitized.html.includes('<script'), 'recovery sanitizer removes script');
  context.assert(!sanitized.html.includes('onclick'), 'recovery sanitizer removes event attributes');
  context.assert(!sanitized.html.includes('javascript:'), 'recovery sanitizer removes unsafe urls');

  const diagnosticsHub = createDiagnosticsHub();
  const panicMonitor = createKernelPanicMonitor({ diagnosticsHub });
  panicMonitor.recordSignal({
    critical: true,
    scope: 'template:checkout',
    correlationId: 'recovery-critical'
  });
  const controller = createKernelRecoveryController({
    diagnosticsHub,
    panicMonitor
  });
  const snapshot = controller.rememberSafeSnapshot({
    scope: 'template:checkout',
    rootId: 'checkout-root',
    html: '<strong>Last safe</strong>',
    sanitized: true,
    modelSnapshot: { title: 'Last safe' }
  });
  controller.registerPendingJob({
    jobId: 'scheduler-job-1',
    scope: 'template:checkout'
  });
  const adapterState = {
    restored: null,
    fallback: null,
    notified: false
  };
  const outcome = controller.recover({
    scope: 'template:checkout',
    rootId: 'checkout-root',
    safeFallbackHtml: '<strong onclick="alert(1)">Fallback</strong><script>alert(1)</script>'
  }, {
    restoreSnapshot(nextSnapshot) {
      adapterState.restored = nextSnapshot;
      return true;
    },
    renderSafeFallback(fallback) {
      adapterState.fallback = fallback;
      return true;
    },
    notifyHost() {
      adapterState.notified = true;
    }
  });
  context.assert(snapshot && snapshot.schema === RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA, 'safe snapshot uses recovery snapshot schema');
  context.assert(outcome.schema === RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA, 'recovery outcome uses outcome schema');
  context.assert(outcome.status === 'recovered', 'recovery controller marks restored plan recovered');
  context.assert(outcome.quarantined === true, 'recovery quarantines affected scope');
  context.assert(outcome.schedulerPaused === true, 'recovery pauses pending scheduler jobs for scope');
  context.assert(outcome.restoredSnapshotId === snapshot.snapshotId, 'recovery restores last safe snapshot');
  context.assert(outcome.hostNotified === true && adapterState.notified === true, 'recovery notifies host adapter');
  context.assert(adapterState.restored && adapterState.restored.html === '<strong>Last safe</strong>', 'restore adapter receives safe snapshot');
  context.assert(adapterState.fallback === null, 'fallback is not rendered when snapshot restore succeeds');
  context.assert(panicMonitor.getState() === 'recovered', 'successful recovery completes panic monitor');
  context.assert(controller.isScopeQuarantined({ scope: 'template:checkout' }) === true, 'quarantine state is queryable');
  context.assert(controller.listPendingJobs().some((job) => job.status === 'paused'), 'pending jobs are paused');
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL), 'recovery diagnostics are published');
  context.assert(!JSON.stringify(controller.listRecoveryOutcomes()).includes('<script>'), 'recovery outcomes redact unsafe raw output');
  context.assert(JSON.parse(serializeKernelRecoveryOutcome(outcome)).schema === RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA, 'recovery outcome serialization is parseable');

  const failingMonitor = createKernelPanicMonitor();
  failingMonitor.recordSignal({
    critical: true,
    scope: 'template:failing'
  });
  const failingController = createKernelRecoveryController({
    panicMonitor: failingMonitor,
    policy: {
      safeFallbackHtml: '',
      safeFallbackText: ''
    }
  });
  const failedOutcome = failingController.recover({
    scope: 'template:failing'
  });
  context.assert(failedOutcome.status === 'failed', 'recovery without snapshot or fallback fails deterministically');
  context.assert(failingMonitor.getState() === 'failed', 'recovery failure escalates back to panic monitor');

  const contract = createKernelRecoveryContract();
  context.assert(contract.schema === RMT_KERNEL_RECOVERY_SCHEMA, 'recovery contract exposes recovery schema');
  context.assert(contract.policySchema === RMT_KERNEL_RECOVERY_POLICY_SCHEMA, 'recovery contract exposes policy schema');
  context.assert(contract.planSchema === RMT_KERNEL_RECOVERY_PLAN_SCHEMA, 'recovery contract exposes plan schema');
  context.assert(serializeKernelRecoveryContract(contract) === serializeKernelRecoveryContract(createKernelRecoveryContract()), 'recovery contract serialization is stable');
}

function runArtifactProbe(context, rootDir, artifactPath) {
  const loaded = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!loaded) return;
  const { AppModules, documentTarget } = loaded;
  const diagnosticsHub = createDiagnosticsHub();
  const hostNotifications = [];
  const renderer = AppModules.createRmtTemplateRuntimeRenderer({
    documentTarget,
    diagnosticsHub,
    onRecoveryOutcome(outcome) {
      hostNotifications.push(outcome);
    }
  });

  const safeSibling = documentTarget.createElement('section');
  safeSibling.textContent = 'safe sibling';
  const recoveryElement = documentTarget.createElement('section');
  recoveryElement.textContent = 'last safe';
  const snapshot = renderer.rememberSafeSnapshot({
    rootId: 'recovery-root',
    scope: 'template:recovery-root',
    element: recoveryElement,
    trusted: true,
    modelSnapshot: { title: 'last safe' }
  });
  context.assert(snapshot && snapshot.schema === RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA, `${artifactPath} remembers safe snapshot`);

  renderer.applyBindings({
    rootId: 'recovery-root',
    element: recoveryElement,
    templateQualifiedId: 'recovery.template',
    bindings: [
      { kind: 'attribute', target: ':root', attribute: 'href', source: 'unsafeHref' },
      { kind: 'attribute', target: ':root', attribute: 'onclick', source: 'handler' },
      { kind: 'property', target: ':root', property: 'innerHTML', source: 'html' }
    ],
    modelSnapshot: {
      unsafeHref: 'javascript:alert(1)',
      handler: 'alert(1)',
      html: '<script>alert(1)</script>'
    }
  });

  context.assert(renderer.getPanicSnapshot().state === 'active', `${artifactPath} blocked bindings activate panic before recovery`);
  const restored = renderer.restoreLastSafeSnapshot({
    rootId: 'recovery-root',
    scope: 'template:recovery-root',
    element: recoveryElement
  });
  context.assert(restored === true, `${artifactPath} restores last safe snapshot through recovery API`);
  context.assert(recoveryElement.textContent === 'last safe', `${artifactPath} restore keeps safe text content`);

  const outcome = renderer.recoverFromPanic({
    rootId: 'recovery-root',
    scope: 'template:recovery-root',
    element: recoveryElement,
    forceFallback: true,
    safeFallbackHtml: '<strong onclick="alert(1)">Recovered</strong><script>alert(1)</script>'
  });
  context.assert(outcome && outcome.schema === RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA, `${artifactPath} returns recovery outcome`);
  context.assert(outcome.status === 'recovered', `${artifactPath} recovery outcome is recovered`);
  context.assert(outcome.quarantined === true, `${artifactPath} recovery quarantines affected scope`);
  context.assert(outcome.fallbackRendered === true, `${artifactPath} recovery renders safe fallback`);
  context.assert(outcome.hostNotified === true && hostNotifications.length === 1, `${artifactPath} notifies host adapter`);
  context.assert(renderer.isScopeQuarantined({ scope: 'template:recovery-root' }) === true, `${artifactPath} exposes quarantined scope`);
  context.assert(renderer.listRecoveryOutcomes().length === 1, `${artifactPath} records recovery outcome`);
  context.assert(renderer.getPanicSnapshot().state === 'recovered', `${artifactPath} recovery completes panic state`);
  context.assert(recoveryElement.innerHTML.includes('<strong>Recovered</strong>'), `${artifactPath} safe fallback keeps allowed markup`);
  context.assert(!recoveryElement.innerHTML.includes('<script'), `${artifactPath} safe fallback removes script`);
  context.assert(!recoveryElement.innerHTML.includes('onclick'), `${artifactPath} safe fallback removes event attributes`);
  context.assert(safeSibling.textContent === 'safe sibling', `${artifactPath} unaffected scope keeps running`);
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL), `${artifactPath} publishes recovery diagnostics`);
  context.assert(!JSON.stringify(renderer.listRecoveryOutcomes()).includes('<script>'), `${artifactPath} recovery outcome redacts unsafe raw html`);

  const session = renderer.applyBindings({
    rootId: 'session-recovery-root',
    element: documentTarget.createElement('section'),
    templateQualifiedId: 'session.recovery.template',
    bindings: [],
    modelSnapshot: {}
  });
  context.assert(typeof session.recoverFromPanic === 'function', `${artifactPath} binding session exposes recovery API`);
  context.assert(typeof renderer.listSafeSnapshots === 'function', `${artifactPath} renderer exposes safe snapshots`);
}

function runRmtKernelRecoverySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-recovery',
    label: 'RKSH-WP-05 Kernel Recovery Policy'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelRecovery;
  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-recovery');
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_RECOVERY_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_RECOVERY_WP_PATH, rootDir);
  const declaration = readText(DECLARATION_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_RECOVERY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_RECOVERY_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_KERNEL_RECOVERY_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_RECOVERY_SUITE_PATH,
    RMT_KERNEL_RECOVERY_CONTRACT_PATH,
    RMT_KERNEL_RECOVERY_WP_PATH,
    RMT_KERNEL_SECURITY_BACKLOG,
    ...RMT_ARTIFACTS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel recovery module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel recovery suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-recovery.js', 'package exports recovery module');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-recovery.d.ts', 'package exports recovery declarations');
  context.assert(packageManifest.scripts['test:rmt-kernel-recovery'] === 'node scripts/run_xtend_tests.js rmt-kernel-recovery', 'package exposes recovery script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_RECOVERY_SCHEMA, 'package metadata exposes recovery schema');
  context.assert(metadata && metadata.policySchema === RMT_KERNEL_RECOVERY_POLICY_SCHEMA, 'package metadata exposes recovery policy schema');
  context.assert(metadata && metadata.outcomeSchema === RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA, 'package metadata exposes recovery outcome schema');
  context.assert(metadata && metadata.safeSnapshotSchema === RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA, 'package metadata exposes recovery snapshot schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_RECOVERY_REPORT_SCHEMA, 'package metadata exposes recovery report schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_RECOVERY_WORKPACKAGE, 'package metadata points to RKSH-WP-05');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_RECOVERY_LOCAL_GATE, 'package metadata exposes recovery local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT, 'package metadata exposes recovery package script');
  context.assertIncludes(runner, "id: 'rmt-kernel-recovery'", 'runner registers recovery suite');
  context.assertIncludes(runner, 'runRmtKernelRecoverySuite', 'runner imports recovery suite');

  runStandaloneRecoveryAssertions(context);

  RMT_ARTIFACTS.forEach((artifactPath) => {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_KERNEL_RECOVERY_SCHEMA,
      RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
      RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
      'rememberSafeSnapshot',
      'restoreLastSafeSnapshot',
      'renderSafeFallback',
      'recoverFromPanic',
      'listRecoveryOutcomes'
    ], `${artifactPath} recovery integration`);
    runArtifactProbe(context, rootDir, artifactPath);
  });

  assertTextIncludesAll(context, declaration, [
    'RmtKernelRecoveryController',
    'RmtKernelRecoveryOutcome',
    'RmtKernelRecoverySafeSnapshot',
    'createKernelRecoveryController',
    'RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA'
  ], 'recovery declaration');
  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_RECOVERY_SCHEMA,
    RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
    'restore-last-safe-snapshot',
    'render-safe-fallback',
    RMT_KERNEL_RECOVERY_LOCAL_GATE
  ], 'recovery contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_RECOVERY_SCHEMA,
    RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
    RMT_KERNEL_RECOVERY_LOCAL_GATE
  ], 'RKSH-WP-05 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-05` | P0 | completed | Recovery | Quarantaene, Rollback und sicheren Fallback modellieren | `npm run test:rmt-kernel-recovery` |',
    RMT_KERNEL_RECOVERY_CONTRACT_PATH,
    RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_RECOVERY_REPORT_SCHEMA,
    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
    policySchema: RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
    outcomeSchema: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
    safeSnapshotSchema: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelRecoveryReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-05 Kernel Recovery Policy',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Recovery: ${summary.recoverySchema}`,
      `Outcome: ${summary.outcomeSchema}`,
      `Safe snapshot: ${summary.safeSnapshotSchema}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_RECOVERY_CONTRACT_PATH,
  RMT_KERNEL_RECOVERY_LOCAL_GATE,
  RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT,
  RMT_KERNEL_RECOVERY_REPORT_SCHEMA,
  RMT_KERNEL_RECOVERY_SCHEMA,
  RMT_KERNEL_RECOVERY_SUITE_PATH,
  RMT_KERNEL_RECOVERY_WORKPACKAGE,
  RMT_KERNEL_RECOVERY_WP_PATH,
  runRmtKernelRecoverySuite,
  printRmtKernelRecoveryReport
};
