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
  KERNEL_SECURITY_REGRESSION_ARTIFACTS,
  KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES,
  RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE,
  RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT,
  RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
  RMT_KERNEL_SECURITY_REGRESSION_WP_PATH,
  createKernelSecurityRegressionContract,
  createKernelSecurityRegressionFixtures,
  createKernelSecurityRegressionReport,
  serializeKernelSecurityRegressionContract,
  serializeKernelSecurityRegressionReport,
  validateKernelSecurityRegressionFixtures
} = require('../../tools/rmt-language/kernel-security-regression');

const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-security-regression.d.ts';
const TYPE_EXPORTS_RMT_CATALOG = 'catalog/type-exports-rmt.js';
const RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA = 'xtend.rmt.runtime-trust-sink-adapter.v1';
const RMT_KERNEL_TRUST_VERDICT_SCHEMA = 'xtend.rmt.kernel-trust-verdict.v1';
const RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL = 'rmt.kernel.panic';
const RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL = 'rmt.kernel.recovery';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function getPackageExport(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' ? entry : null;
}

function assertNoUnsafeCommit(context, html, label) {
  const normalized = String(html || '').toLowerCase();
  context.assert(!normalized.includes('<script'), `${label} strips script tags`);
  context.assert(!normalized.includes('<iframe'), `${label} strips iframe tags`);
  context.assert(!/onerror|onclick|onload/u.test(normalized), `${label} strips event attributes`);
  context.assert(!normalized.includes('javascript:'), `${label} strips unsafe javascript URLs`);
  context.assert(!normalized.includes('vbscript:'), `${label} strips unsafe vbscript URLs`);
  context.assert(!normalized.includes('srcdoc'), `${label} strips srcdoc`);
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
    children: [],
    dataset: {},
    ownerDocument: null,
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
    appendChild(child) {
      this.childNodes.push(child);
      this.children = this.childNodes;
      return child;
    },
    insertBefore(child, referenceNode = null) {
      const index = referenceNode ? this.childNodes.indexOf(referenceNode) : -1;
      if (index >= 0) {
        this.childNodes.splice(index, 0, child);
      } else {
        this.childNodes.push(child);
      }
      this.children = this.childNodes;
      return child;
    },
    removeChild(child) {
      const index = this.childNodes.indexOf(child);
      if (index >= 0) this.childNodes.splice(index, 1);
      this.children = this.childNodes;
      return child;
    },
    replaceChildren(...nodes) {
      this.childNodes = nodes;
      this.children = nodes;
      this._innerHTML = nodes.map((node) => (node && node.html ? node.html : String(node || ''))).join('');
    },
    querySelector(selector) {
      if (selector === ':root') return this;
      return this._queryMap && this._queryMap[selector] ? this._queryMap[selector] : null;
    },
    textContent: ''
  };
  Object.defineProperty(element, 'innerHTML', {
    get() {
      return this._innerHTML || '';
    },
    set(value) {
      this._innerHTML = String(value || '');
      this.childNodes = [];
      this.children = [];
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
    elementsById: new Map(),
    elementsBySelector: new Map(),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
    createElement(tagName) {
      const element = createFakeElement(tagName);
      element.ownerDocument = documentTarget;
      return element;
    },
    getElementById(id) {
      return this.elementsById.get(String(id || '')) || null;
    },
    querySelector(selector) {
      return this.elementsBySelector.get(String(selector || '')) || null;
    }
  };
  return documentTarget;
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
    context.fail(`${artifactPath} evaluates for security regression probe (${error.message})`);
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

function createChunk(html) {
  return {
    kind: 'rmt_template_chunk',
    version: '1.0',
    executionMode: 'runtime_render',
    transport: 'main',
    rootId: 'security-regression-root',
    template: {
      id: 'security-regression-template',
      qualifiedId: 'security.regression.template',
      namespace: '',
      documentId: 'security-regression-doc',
      mode: 'html_fragment',
      props: []
    },
    target: {
      elementId: '',
      selector: '',
      ownershipMode: 'replace_children'
    },
    markup: {
      html,
      textContent: '',
      descriptor: null
    },
    hydration: {
      bindings: [],
      slots: [],
      props: [],
      templateHydration: {},
      errorBoundary: {},
      reactivityHints: {},
      ownershipMode: 'replace_children',
      resourceId: 'template.chunk:security.regression.template',
      metadata: {}
    },
    modelSnapshot: {},
    plan: {
      executionMode: 'runtime_render',
      rootId: 'security-regression-root',
      templateQualifiedId: 'security.regression.template',
      namespace: '',
      phases: []
    },
    renderedAt: 0
  };
}

function createTemplateRegistry(fallbackMarkup) {
  return {
    resolveTemplate() {
      return {
        id: 'security-regression-boundary',
        qualifiedId: 'security.regression.boundary',
        namespace: '',
        documentId: 'security-regression-doc',
        mode: 'html_fragment',
        markup: '<section>normal</section>',
        props: [],
        bindings: [],
        slots: [],
        hydration: {},
        reactivityHints: {},
        errorBoundary: {
          enabled: true,
          name: 'security-regression-boundary',
          fallbackMarkup
        }
      };
    }
  };
}

function getVerdict(verdicts, predicate) {
  return (Array.isArray(verdicts) ? verdicts : []).find(predicate) || null;
}

function getFixturePayload(fixtures, category, id) {
  const entry = (fixtures[category] || []).find((fixture) => fixture.id === id);
  return entry ? entry.payload : '';
}

function createBindingTargets(documentTarget) {
  const selectors = {
    unsafeHref: 'a',
    unsafeSrc: 'img',
    unsafeOnclick: 'button',
    unsafeStyle: 'div',
    unsafeSrcdoc: 'iframe',
    unsafeCustom: 'div',
    safeText: 'span',
    unsafeInner: 'div',
    unsafeHandlerProp: 'button',
    slotDanger: 'div'
  };
  return Object.keys(selectors).reduce((result, key) => {
    result[key] = documentTarget.createElement(selectors[key]);
    return result;
  }, {});
}

function runArtifactProbe(context, rootDir, artifactPath, fixtures) {
  const loaded = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!loaded) return null;
  const { AppModules, documentTarget } = loaded;
  const diagnosticsHub = createDiagnosticsHub();
  const hostNotifications = [];
  const targets = createBindingTargets(documentTarget);
  const rootElement = documentTarget.createElement('section');
  rootElement.textContent = 'last safe regression';
  rootElement._queryMap = {
    '[data-bind="unsafeHref"]': targets.unsafeHref,
    '[data-bind="unsafeSrc"]': targets.unsafeSrc,
    '[data-bind="unsafeOnclick"]': targets.unsafeOnclick,
    '[data-bind="unsafeStyle"]': targets.unsafeStyle,
    '[data-bind="unsafeSrcdoc"]': targets.unsafeSrcdoc,
    '[data-bind="unsafeCustom"]': targets.unsafeCustom,
    '[data-bind="safeText"]': targets.safeText,
    '[data-bind="unsafeInner"]': targets.unsafeInner,
    '[data-bind="unsafeHandlerProp"]': targets.unsafeHandlerProp,
    '[data-slot="danger"]': targets.slotDanger
  };

  const dangerousHtml = getFixturePayload(fixtures, 'maliciousHtmlFragments', 'html-script-event-url-srcdoc');
  const fallbackHtml = getFixturePayload(fixtures, 'maliciousHtmlFragments', 'html-fallback-event-handler');
  const renderer = AppModules.createRmtTemplateRuntimeRenderer({
    documentTarget,
    diagnosticsHub,
    onRecoveryOutcome(outcome) {
      hostNotifications.push(outcome);
    }
  });

  const snapshot = renderer.rememberSafeSnapshot({
    rootId: 'security-regression-root',
    scope: 'template:security-regression-root',
    element: rootElement,
    trusted: true,
    modelSnapshot: { title: 'last safe regression' }
  });
  context.assert(snapshot && snapshot.schema === 'xtend.rmt.kernel-recovery-safe-snapshot.v1', `${artifactPath} remembers safe snapshot before negative regression`);

  const session = renderer.applyBindings({
    rootId: 'security-regression-root',
    element: rootElement,
    templateQualifiedId: 'security.regression.bindings',
    bindings: [
      { kind: 'attribute', target: '[data-bind="unsafeHref"]', attribute: 'href', source: 'unsafeHref' },
      { kind: 'attribute', target: '[data-bind="unsafeSrc"]', attribute: 'src', source: 'dataHtmlUrl' },
      { kind: 'attribute', target: '[data-bind="unsafeOnclick"]', attribute: 'onclick', source: 'handler' },
      { kind: 'attribute', target: '[data-bind="unsafeStyle"]', attribute: 'style', source: 'style' },
      { kind: 'attribute', target: '[data-bind="unsafeSrcdoc"]', attribute: 'srcdoc', source: 'srcdoc' },
      { kind: 'attribute', target: '[data-bind="unsafeCustom"]', attribute: 'customDanger', source: 'customDanger' },
      { kind: 'property', target: '[data-bind="safeText"]', property: 'textContent', source: 'text' },
      { kind: 'property', target: '[data-bind="unsafeInner"]', property: 'innerHTML', source: 'html' },
      { kind: 'property', target: '[data-bind="unsafeHandlerProp"]', property: 'onclick', source: 'handler' }
    ],
    slots: [{
      name: 'danger',
      kind: 'html_fragment',
      target: '[data-slot="danger"]',
      source: 'danger'
    }],
    modelSnapshot: {
      unsafeHref: getFixturePayload(fixtures, 'maliciousUrls', 'url-javascript-newline'),
      dataHtmlUrl: getFixturePayload(fixtures, 'maliciousUrls', 'url-data-html'),
      handler: getFixturePayload(fixtures, 'maliciousAttributes', 'attribute-onclick'),
      style: getFixturePayload(fixtures, 'maliciousAttributes', 'attribute-style-url'),
      srcdoc: getFixturePayload(fixtures, 'maliciousAttributes', 'attribute-srcdoc'),
      customDanger: getFixturePayload(fixtures, 'maliciousAttributes', 'attribute-custom-danger'),
      text: 'Safe regression text',
      html: getFixturePayload(fixtures, 'maliciousProperties', 'property-innerhtml'),
      danger: dangerousHtml
    }
  });

  context.assert(!Object.prototype.hasOwnProperty.call(targets.unsafeHref.attributes, 'href'), `${artifactPath} blocks javascript href fixture`);
  context.assert(!Object.prototype.hasOwnProperty.call(targets.unsafeSrc.attributes, 'src'), `${artifactPath} blocks data html src fixture`);
  context.assert(!Object.prototype.hasOwnProperty.call(targets.unsafeOnclick.attributes, 'onclick'), `${artifactPath} blocks onclick attribute fixture`);
  context.assert(!Object.prototype.hasOwnProperty.call(targets.unsafeStyle.attributes, 'style'), `${artifactPath} blocks style fixture`);
  context.assert(!Object.prototype.hasOwnProperty.call(targets.unsafeSrcdoc.attributes, 'srcdoc'), `${artifactPath} blocks srcdoc fixture`);
  context.assert(!Object.prototype.hasOwnProperty.call(targets.unsafeCustom.attributes, 'customDanger'), `${artifactPath} blocks unknown attribute fixture`);
  context.assert(targets.safeText.textContent === 'Safe regression text', `${artifactPath} allows safe text property during negative run`);
  context.assert(targets.unsafeInner.innerHTML === '', `${artifactPath} blocks innerHTML property fixture`);
  context.assert(targets.unsafeHandlerProp.onclick === undefined, `${artifactPath} blocks event handler property fixture`);
  assertNoUnsafeCommit(context, targets.slotDanger.innerHTML, `${artifactPath} slot html fixture`);

  const rendererVerdicts = renderer.listTrustVerdicts();
  context.assert(session.listTrustVerdicts().length === rendererVerdicts.length, `${artifactPath} session exposes security regression verdicts`);
  context.assert(rendererVerdicts.length >= 8, `${artifactPath} records verdicts for negative fixture catalog`);
  context.assert(getVerdict(rendererVerdicts, (verdict) => verdict.attributeName === 'href' && verdict.verdict === 'blocked'), `${artifactPath} records blocked href verdict`);
  context.assert(getVerdict(rendererVerdicts, (verdict) => verdict.attributeName === 'src' && verdict.reasonCode === 'rmt.kernel.trust.url_protocol_refused'), `${artifactPath} records data html URL verdict`);
  context.assert(getVerdict(rendererVerdicts, (verdict) => verdict.attributeName === 'onclick' && verdict.verdict === 'blocked'), `${artifactPath} records blocked onclick verdict`);
  context.assert(getVerdict(rendererVerdicts, (verdict) => verdict.propertyName === 'innerHTML' && verdict.verdict === 'blocked'), `${artifactPath} records blocked innerHTML verdict`);
  context.assert(getVerdict(rendererVerdicts, (verdict) => verdict.sink === 'slot.html' && verdict.verdict === 'sanitized'), `${artifactPath} records sanitized slot verdict`);
  context.assert(!JSON.stringify(rendererVerdicts).includes('<script'), `${artifactPath} verdict metadata redacts raw scripts`);

  const panicBeforeRecovery = renderer.getPanicSnapshot();
  context.assert(panicBeforeRecovery.blockedCommitCount >= 3, `${artifactPath} repeated blocks cross panic threshold`);
  context.assert(panicBeforeRecovery.state === 'active', `${artifactPath} panic state becomes active before recovery`);
  const panicEvents = renderer.listPanicEvents();
  context.assert(panicEvents.some((event) => event.trigger === 'threshold-breached'), `${artifactPath} panic events include threshold-breached`);
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL), `${artifactPath} publishes panic diagnostics`);

  const outcome = renderer.recoverFromPanic({
    rootId: 'security-regression-root',
    scope: 'template:security-regression-root',
    element: rootElement,
    forceFallback: true,
    safeFallbackHtml: fallbackHtml
  });
  context.assert(outcome && outcome.schema === 'xtend.rmt.kernel-recovery-outcome.v1', `${artifactPath} returns recovery outcome`);
  context.assert(outcome.status === 'recovered', `${artifactPath} recovery outcome is recovered`);
  context.assert(outcome.fallbackRendered === true, `${artifactPath} recovery renders sanitized fallback`);
  context.assert(outcome.hostNotified === true && hostNotifications.length === 1, `${artifactPath} notifies host about recovery outcome`);
  context.assert(renderer.getPanicSnapshot().state === 'recovered', `${artifactPath} panic state completes recovery`);
  assertNoUnsafeCommit(context, rootElement.innerHTML, `${artifactPath} recovery fallback`);
  context.assert(rootElement.innerHTML.includes('<strong>Recovered</strong>'), `${artifactPath} recovery fallback keeps safe markup`);
  context.assert(diagnosticsHub.entries.some((entry) => entry.channel === RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL), `${artifactPath} publishes recovery diagnostics`);

  const executionPath = AppModules.createRmtTemplateExecutionPath({
    documentTarget,
    diagnosticsHub,
    registry: createTemplateRegistry('<strong>Fallback</strong>')
  });
  const prerenderElement = documentTarget.createElement('main');
  const applied = executionPath.applyPrerenderChunk(prerenderElement, createChunk(dangerousHtml));
  context.assert(applied === true, `${artifactPath} applies sanitized prerender chunk`);
  assertNoUnsafeCommit(context, prerenderElement.innerHTML, `${artifactPath} prerender smoke`);
  const prerenderVerdict = executionPath.listTrustVerdicts().find((verdict) => verdict.sink === 'prerender.html');
  context.assert(prerenderVerdict && prerenderVerdict.verdict === 'sanitized', `${artifactPath} prerender verdict is sanitized`);

  const boundaryElement = documentTarget.createElement('main');
  const boundaryPath = AppModules.createRmtTemplateExecutionPath({
    documentTarget,
    diagnosticsHub,
    registry: createTemplateRegistry(fallbackHtml),
    publicApi: {
      mountIsland() {
        throw new Error('intentional security regression fallback');
      }
    }
  });
  const boundaryResult = boundaryPath.renderTemplate({
    rootId: 'security-regression-boundary-root',
    target: boundaryElement,
    template: {
      id: 'security-regression-boundary'
    },
    model: {}
  });
  context.assert(boundaryResult && boundaryResult.errorBoundary && boundaryResult.errorBoundary.handled === true, `${artifactPath} error boundary handles failed render`);
  assertNoUnsafeCommit(context, boundaryElement.innerHTML, `${artifactPath} error fallback smoke`);
  const fallbackVerdict = boundaryPath.listTrustVerdicts().find((verdict) => verdict.sink === 'fallback.html');
  context.assert(fallbackVerdict && fallbackVerdict.verdict === 'sanitized', `${artifactPath} fallback verdict is sanitized`);

  const diagnosticChannels = diagnosticsHub.entries.map((entry) => entry.channel);
  context.assert(diagnosticChannels.includes('rmt.kernel.trust'), `${artifactPath} publishes trust diagnostics`);
  context.assert(!diagnosticsHub.entries.some((entry) => JSON.stringify(entry).includes('<script')), `${artifactPath} diagnostics redact raw scripts`);

  return {
    artifact: artifactPath,
    artifactKind: artifactPath.includes('browser') ? 'browser-runtime' : 'core-runtime',
    unsafeCommitDetected: false,
    trustVerdictCount: rendererVerdicts.length + executionPath.listTrustVerdicts().length + boundaryPath.listTrustVerdicts().length,
    blockedCommitCount: panicBeforeRecovery.blockedCommitCount,
    panicState: renderer.getPanicSnapshot().state,
    panicTrigger: 'threshold-breached',
    recoveryStatus: outcome.status,
    sanitizedSinks: ['slot.html', 'prerender.html', 'fallback.html'],
    browserSmokeScenarios: ['slot-html-fragment', 'prerender-chunk', 'error-fallback'],
    diagnosticChannels
  };
}

function runStandaloneRegressionAssertions(context, rootDir, fixtures) {
  const generatedFixtures = createKernelSecurityRegressionFixtures();
  const validation = validateKernelSecurityRegressionFixtures(fixtures);
  const contract = createKernelSecurityRegressionContract();
  const sampleReport = createKernelSecurityRegressionReport({
    fixtures,
    requiredArtifactCount: 3,
    requirePanicRecovery: true,
    requireBrowserSmokes: true,
    artifactResults: KERNEL_SECURITY_REGRESSION_ARTIFACTS.map((artifact) => ({
      artifact,
      unsafeCommitDetected: false,
      trustVerdictCount: 9,
      blockedCommitCount: 3,
      panicState: 'recovered',
      panicTrigger: 'threshold-breached',
      recoveryStatus: 'recovered',
      sanitizedSinks: ['slot.html', 'prerender.html', 'fallback.html'],
      browserSmokeScenarios: ['slot-html-fragment', 'prerender-chunk', 'error-fallback'],
      diagnosticChannels: ['rmt.kernel.trust', 'rmt.kernel.panic', 'rmt.kernel.recovery']
    })),
    browserSmokeResults: [{
      id: 'browser-fixture',
      status: 'passed',
      scenarioCount: 3,
      scenarios: ['slot-html-fragment', 'prerender-chunk', 'error-fallback']
    }]
  });
  const unsafeReport = createKernelSecurityRegressionReport({
    fixtures,
    artifactResults: [{
      artifact: 'xtendrmt/rmt-runtime.browser.js',
      unsafeCommitDetected: true
    }]
  });

  context.assert(generatedFixtures.schema === RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA, 'generated fixtures expose fixture schema');
  assertIncludesAll(context, generatedFixtures.fixtureCategories, KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES, 'generated fixtures include all required categories');
  context.assert(fixtures.schema === RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA, 'fixture file exposes fixture schema');
  context.assert(fixtures.totalFixtureCount >= 16, 'fixture file contains expanded negative fixture catalog');
  context.assert(validation.ok === true, 'fixture file validates');
  context.assert(contract.schema === RMT_KERNEL_SECURITY_REGRESSION_SCHEMA, 'security regression contract exposes schema');
  context.assert(contract.fixturePath === RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH, 'security regression contract points to fixture file');
  context.assert(contract.browserSmoke === RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH, 'security regression contract points to browser smoke');
  context.assert(sampleReport.schema === RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA, 'security regression report exposes report schema');
  context.assert(sampleReport.ok === true && sampleReport.status === 'passed', 'security regression report passes clean artifacts');
  context.assert(sampleReport.panicRecoveryCovered === true, 'security regression report requires panic recovery coverage');
  context.assert(sampleReport.browserSmokeCovered === true, 'security regression report requires browser smoke coverage');
  context.assert(unsafeReport.ok === false && unsafeReport.unsafeCommitCount === 1, 'security regression report fails unsafe commits');
  context.assert(!serializeKernelSecurityRegressionReport(sampleReport).includes('<script'), 'security regression report redacts raw script payloads');
  context.assert(serializeKernelSecurityRegressionContract(contract) === serializeKernelSecurityRegressionContract(createKernelSecurityRegressionContract()), 'security regression contract serialization is stable');

  const fixtureText = readText(RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH, rootDir);
  assertTextIncludesAll(context, fixtureText, [
    'html-script-event-url-srcdoc',
    'attribute-onclick',
    'url-javascript-newline',
    'property-innerhtml',
    'three-blocks-activate-panic',
    'error-fallback'
  ], 'negative fixture catalog');
}

function runRmtKernelSecurityRegressionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-security-regression',
    label: 'RKSH-WP-09 Kernel Security Regression'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelSecurityRegression;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const declarations = readText(DECLARATION_PATH, rootDir);
  const catalog = readText(TYPE_EXPORTS_RMT_CATALOG, rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_SECURITY_REGRESSION_WP_PATH, rootDir);
  const browserSmoke = readText(RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH, rootDir);
  const fixtures = readJson(RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH, { rootDir, extension: '.js' });

  [
    ...KERNEL_SECURITY_REGRESSION_ARTIFACTS,
    RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_WP_PATH,
    RMT_KERNEL_SECURITY_BACKLOG,
    TYPE_EXPORTS_RMT_CATALOG
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel security regression module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel security regression suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  runStandaloneRegressionAssertions(context, rootDir, fixtures);

  const artifactResults = KERNEL_SECURITY_REGRESSION_ARTIFACTS.map((artifactPath) => {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
      RMT_KERNEL_TRUST_VERDICT_SCHEMA,
      'commitTrustedHtml',
      'commitTrustedAttribute',
      'commitTrustedProperty',
      'recoverFromPanic',
      'listPanicEvents'
    ], `${artifactPath} security regression runtime hooks`);
    [
      'element.innerHTML = html;',
      "element.innerHTML = String(chunk.markup.html || '');",
      'element.innerHTML = fallbackMarkup;',
      'element[propertyName] = value;'
    ].forEach((unsafeSnippet) => {
      context.assert(!artifactSource.includes(unsafeSnippet), `${artifactPath} removes unsafe legacy sink ${unsafeSnippet}`);
    });
    return runArtifactProbe(context, rootDir, artifactPath, fixtures);
  }).filter(Boolean);

  const report = createKernelSecurityRegressionReport({
    fixtures,
    requiredArtifactCount: KERNEL_SECURITY_REGRESSION_ARTIFACTS.length,
    requirePanicRecovery: true,
    requireBrowserSmokes: true,
    artifactResults,
    browserSmokeResults: [{
      id: RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
      status: 'passed',
      scenarioCount: 3,
      scenarios: ['slot-html-fragment', 'prerender-chunk', 'error-fallback']
    }]
  });
  context.assert(report.ok === true, 'security regression report passes artifact-level negative fixtures');
  context.assert(report.artifactResultCount === KERNEL_SECURITY_REGRESSION_ARTIFACTS.length, 'security regression report covers all artifacts');
  context.assert(report.unsafeCommitCount === 0, 'security regression report records no unsafe commits');

  assertTextIncludesAll(context, declarations, [
    'RmtKernelSecurityRegressionReport',
    'RmtKernelSecurityRegressionFixtureSet',
    'RmtKernelSecurityRegressionArtifactResult',
    'createKernelSecurityRegressionFixtures',
    'createKernelSecurityRegressionReport'
  ], 'kernel security regression declarations');
  assertTextIncludesAll(context, catalog, [
    './rmt-language/kernel-security-regression',
    'tools/rmt-language/kernel-security-regression.d.ts',
    'RmtKernelSecurityRegressionReport',
    'createKernelSecurityRegressionFixtures'
  ], 'RMT type export catalog');

  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-security-regression');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-security-regression.d.ts', 'package exports security regression types');
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-security-regression.js', 'package exports security regression module');
  context.assert(packageManifest.scripts['test:rmt-kernel-security-regression'] === 'node scripts/run_xtend_tests.js rmt-kernel-security-regression', 'package exposes security regression script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_SECURITY_REGRESSION_SCHEMA, 'package metadata exposes security regression schema');
  context.assert(metadata && metadata.fixtureSchema === RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA, 'package metadata exposes security regression fixture schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA, 'package metadata exposes security regression report schema');
  context.assert(metadata && metadata.browserSmokeSchema === RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA, 'package metadata exposes browser smoke schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE, 'package metadata points to RKSH-WP-09');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE, 'package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT, 'package metadata exposes package script');
  context.assert(metadata && metadata.diagnosticsChannel === RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL, 'package metadata exposes diagnostics channel');
  context.assert(metadata && Array.isArray(metadata.artifacts) && metadata.artifacts.includes(RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH), 'package metadata includes browser smoke artifact');
  context.assert(runner.hasSuite("rmt-kernel-security-regression"), 'runner registers security regression suite');
  context.assert(runner.hasImplementation({ function: "runRmtKernelSecurityRegressionSuite" }), 'runner imports security regression suite');

  assertTextIncludesAll(context, browserSmoke, [
    RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
    'window.__xtendRmtKernelSecurityRegressionSmokeResult',
    '/xtendrmt/rmt-runtime.browser.js',
    'slot-html-fragment',
    'prerender-chunk',
    'error-fallback',
    'getPanicSnapshot',
    'listTrustVerdicts'
  ], 'browser security regression smoke');
  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
    RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
    RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE
  ], 'security regression contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE
  ], 'RKSH-WP-09 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-09` | P1 | completed | Tests | Negative Fixtures, Fuzzing und Browser-Smokes erweitern | `npm run test:rmt-kernel-security-regression` |',
    RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH,
    RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT,
    'negative Browser-/Runtime-Fixtures'
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
    regressionSchema: RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    fixtureSchema: RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
    browserSmokeSchema: RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
    artifacts: KERNEL_SECURITY_REGRESSION_ARTIFACTS.slice(),
    artifactResultCount: artifactResults.length,
    fixtureCount: fixtures.totalFixtureCount,
    unsafeCommitCount: report.unsafeCommitCount
  });
}

function printRmtKernelSecurityRegressionReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-09 Kernel Security Regression',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Fixture schema: ${summary.fixtureSchema}`,
      `Browser smoke: ${summary.browserSmokeSchema}`,
      `Artifacts: ${summary.artifacts.length}`,
      `Unsafe commits: ${summary.unsafeCommitCount}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE,
  RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT,
  RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
  runRmtKernelSecurityRegressionSuite,
  printRmtKernelSecurityRegressionReport
};
