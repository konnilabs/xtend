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

const RMT_KERNEL_BINDING_SECURITY_SCHEMA = 'xtend.rmt.kernel-binding-security.v1';
const RMT_KERNEL_BINDING_SECURITY_REPORT_SCHEMA = 'xtend.rmt.kernel-binding-security-report.v1';
const RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA = 'xtend.rmt.runtime-trust-sink-adapter.v1';
const RMT_KERNEL_TRUST_VERDICT_SCHEMA = 'xtend.rmt.kernel-trust-verdict.v1';
const RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE = 'RKSH-WP-03';
const RMT_KERNEL_BINDING_SECURITY_SUITE = 'tests/rmt-language/rmt_kernel_binding_security_suite.js';
const RMT_KERNEL_BINDING_SECURITY_CONTRACT = 'development/XTendRMT-Kernel-Binding-Security-Contract.md';
const RMT_KERNEL_BINDING_SECURITY_WP = 'development/WP-RKSH-03-Attribute-URL-und-Property-Policies-haerten.md';
const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const RMT_KERNEL_BINDING_SECURITY_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-binding-security --json';
const RMT_KERNEL_BINDING_SECURITY_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-binding-security';
const RMT_ARTIFACTS = [
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
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
    context.fail(`${artifactPath} evaluates for binding security probe (${error.message})`);
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

function getVerdict(verdicts, predicate) {
  return (Array.isArray(verdicts) ? verdicts : []).find(predicate) || null;
}

function runArtifactProbe(context, rootDir, artifactPath) {
  const loaded = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!loaded) return;
  const { AppModules, documentTarget } = loaded;
  const diagnosticsHub = createDiagnosticsHub();
  const selectors = [
    'safeData',
    'safeAria',
    'safeHref',
    'unsafeHref',
    'unsafeOnclick',
    'unsafeStyle',
    'unknownAttribute',
    'safeText',
    'unsafeInner',
    'unsafeHandlerProp',
    'safeAction',
    'unsafeAction'
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
    rootId: 'binding-security-root',
    element: rootElement,
    templateQualifiedId: 'binding.security.template',
    bindings: [
      { kind: 'attribute', target: '[data-bind="safeData"]', attribute: 'data-state', source: 'state' },
      { kind: 'attribute', target: '[data-bind="safeAria"]', attribute: 'aria-label', source: 'label' },
      { kind: 'attribute', target: '[data-bind="safeHref"]', attribute: 'href', source: 'safeHref' },
      { kind: 'attribute', target: '[data-bind="unsafeHref"]', attribute: 'href', source: 'unsafeHref' },
      { kind: 'attribute', target: '[data-bind="unsafeOnclick"]', attribute: 'onclick', source: 'handler' },
      { kind: 'attribute', target: '[data-bind="unsafeStyle"]', attribute: 'style', source: 'style' },
      { kind: 'attribute', target: '[data-bind="unknownAttribute"]', attribute: 'customDanger', source: 'customDanger' },
      { kind: 'property', target: '[data-bind="safeText"]', property: 'textContent', source: 'text' },
      { kind: 'property', target: '[data-bind="unsafeInner"]', property: 'innerHTML', source: 'html' },
      { kind: 'property', target: '[data-bind="unsafeHandlerProp"]', property: 'onclick', source: 'handler' },
      { kind: 'command', target: '[data-bind="safeAction"]', eventType: 'click', commandName: 'save', action: 'save' },
      { kind: 'command', target: '[data-bind="unsafeAction"]', eventType: 'click', commandName: 'save', action: 'evil', actionAttribute: 'onclick' }
    ],
    modelSnapshot: {
      state: 'ready',
      label: 'A11y label',
      safeHref: '/docs/index.php',
      unsafeHref: 'java\nscript:alert(1)',
      handler: 'alert(1)',
      style: 'background:url(javascript:alert(1))',
      customDanger: 'unknown',
      text: 'Safe text',
      html: '<script>alert(1)</script>'
    }
  });

  context.assert(elements.safeData.attributes['data-state'] === 'ready', `${artifactPath} allows data-* attributes`);
  context.assert(elements.safeAria.attributes['aria-label'] === 'A11y label', `${artifactPath} allows aria-* attributes`);
  context.assert(elements.safeHref.attributes.href === '/docs/index.php', `${artifactPath} allows safe href`);
  context.assert(!Object.prototype.hasOwnProperty.call(elements.unsafeHref.attributes, 'href'), `${artifactPath} blocks unsafe href`);
  context.assert(!Object.prototype.hasOwnProperty.call(elements.unsafeOnclick.attributes, 'onclick'), `${artifactPath} blocks onclick attribute`);
  context.assert(!Object.prototype.hasOwnProperty.call(elements.unsafeStyle.attributes, 'style'), `${artifactPath} blocks style attribute`);
  context.assert(!Object.prototype.hasOwnProperty.call(elements.unknownAttribute.attributes, 'customDanger'), `${artifactPath} blocks unknown attributes`);
  context.assert(elements.safeText.textContent === 'Safe text', `${artifactPath} allows safe textContent property`);
  context.assert(elements.unsafeInner.innerHTML === '', `${artifactPath} blocks innerHTML property`);
  context.assert(elements.unsafeHandlerProp.onclick === undefined, `${artifactPath} blocks event handler property`);
  context.assert(elements.safeAction.attributes['data-rm-action'] === 'save', `${artifactPath} allows default data-rm-action`);
  context.assert(!Object.prototype.hasOwnProperty.call(elements.unsafeAction.attributes, 'onclick'), `${artifactPath} blocks command actionAttribute onclick`);
  context.assert(session.listTrustVerdicts().length === renderer.listTrustVerdicts().length, `${artifactPath} session exposes binding trust verdicts`);

  const verdicts = renderer.listTrustVerdicts();
  const safeDataVerdict = getVerdict(verdicts, (verdict) => verdict.attributeName === 'data-state');
  const unsafeHrefVerdict = getVerdict(verdicts, (verdict) => verdict.attributeName === 'href' && verdict.reasonCode === 'rmt.kernel.trust.url_protocol_refused');
  const onclickVerdict = getVerdict(verdicts, (verdict) => verdict.attributeName === 'onclick' && verdict.reasonCode === 'rmt.kernel.trust.attribute_refused');
  const styleVerdict = getVerdict(verdicts, (verdict) => verdict.attributeName === 'style');
  const unknownAttributeVerdict = getVerdict(verdicts, (verdict) => verdict.attributeName === 'customDanger');
  const textPropertyVerdict = getVerdict(verdicts, (verdict) => verdict.propertyName === 'textContent');
  const innerHtmlPropertyVerdict = getVerdict(verdicts, (verdict) => verdict.propertyName === 'innerHTML');
  const eventPropertyVerdict = getVerdict(verdicts, (verdict) => verdict.propertyName === 'onclick');

  context.assert(safeDataVerdict && safeDataVerdict.schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, `${artifactPath} safe data verdict uses trust schema`);
  context.assert(safeDataVerdict && safeDataVerdict.verdict === 'trusted', `${artifactPath} safe data attribute is trusted`);
  context.assert(safeDataVerdict && safeDataVerdict.workpackage === RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE, `${artifactPath} safe data verdict points to WP-03`);
  context.assert(unsafeHrefVerdict && unsafeHrefVerdict.sink === 'url-attribute', `${artifactPath} unsafe href is classified as url-attribute`);
  context.assert(unsafeHrefVerdict && unsafeHrefVerdict.verdict === 'blocked', `${artifactPath} unsafe href is blocked`);
  context.assert(unsafeHrefVerdict && unsafeHrefVerdict.diagnosticCode === 'rmt.kernel.trust.url_protocol_refused', `${artifactPath} unsafe href diagnostic is url protocol refused`);
  context.assert(onclickVerdict && onclickVerdict.verdict === 'blocked', `${artifactPath} onclick attribute verdict is blocked`);
  context.assert(styleVerdict && styleVerdict.verdict === 'blocked', `${artifactPath} style attribute verdict is blocked`);
  context.assert(unknownAttributeVerdict && unknownAttributeVerdict.severity === 'warning', `${artifactPath} unknown attribute is warning-level blocked`);
  context.assert(textPropertyVerdict && textPropertyVerdict.verdict === 'trusted', `${artifactPath} textContent property is trusted`);
  context.assert(innerHtmlPropertyVerdict && innerHtmlPropertyVerdict.verdict === 'blocked', `${artifactPath} innerHTML property is blocked`);
  context.assert(innerHtmlPropertyVerdict && innerHtmlPropertyVerdict.reasonCode === 'rmt.kernel.trust.property_refused', `${artifactPath} innerHTML property uses property refused reason`);
  context.assert(eventPropertyVerdict && eventPropertyVerdict.verdict === 'blocked', `${artifactPath} event handler property is blocked`);
  context.assert(!JSON.stringify(verdicts).includes('<script>'), `${artifactPath} binding verdicts redact raw script content`);

  const diagnosticCodes = diagnosticsHub.entries
    .filter((entry) => entry.channel === 'rmt.kernel.trust' && entry.payload)
    .map((entry) => entry.payload.code);
  context.assert(diagnosticCodes.includes('rmt.kernel.trust.url_protocol_refused'), `${artifactPath} publishes url protocol diagnostic`);
  context.assert(diagnosticCodes.includes('rmt.kernel.trust.attribute_refused'), `${artifactPath} publishes attribute refused diagnostic`);
  context.assert(diagnosticCodes.includes('rmt.kernel.trust.property_refused'), `${artifactPath} publishes property refused diagnostic`);
}

function runRmtKernelBindingSecuritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-binding-security',
    label: 'RKSH-WP-03 Attribute, URL and Property Policies'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelBindingSecurity;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_BINDING_SECURITY_CONTRACT, rootDir);
  const workpackage = readText(RMT_KERNEL_BINDING_SECURITY_WP, rootDir);
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_BINDING_SECURITY_SUITE, { rootDir, extension: '.js' });

  [
    ...RMT_ARTIFACTS,
    RMT_KERNEL_BINDING_SECURITY_SUITE,
    RMT_KERNEL_BINDING_SECURITY_CONTRACT,
    RMT_KERNEL_BINDING_SECURITY_WP,
    RMT_KERNEL_SECURITY_BACKLOG
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(suiteSyntax.ok, `Binding security suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  RMT_ARTIFACTS.forEach((artifactPath) => {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
      'RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE',
      'commitTrustedAttribute',
      'commitTrustedProperty',
      'rmt.kernel.trust.url_protocol_refused',
      'rmt.kernel.trust.property_refused'
    ], `${artifactPath} binding security adapter`);
    [
      'element[propertyName] = value;',
      'element.setAttribute(attributeName, safeAction);',
      'element.attributes[attributeName] = safeAction;'
    ].forEach((unsafeSnippet) => {
      context.assert(!artifactSource.includes(unsafeSnippet), `${artifactPath} removes legacy unsafe snippet ${unsafeSnippet}`);
    });
    runArtifactProbe(context, rootDir, artifactPath);
  });

  context.assert(packageManifest.scripts['test:rmt-kernel-binding-security'] === 'node scripts/run_xtend_tests.js rmt-kernel-binding-security', 'package exposes binding security script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_BINDING_SECURITY_SCHEMA, 'package metadata exposes binding security schema');
  context.assert(metadata && metadata.trustSinkAdapterSchema === RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA, 'package metadata exposes trust sink adapter schema');
  context.assert(metadata && metadata.verdictSchema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, 'package metadata exposes verdict schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE, 'package metadata points to RKSH-WP-03');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_BINDING_SECURITY_LOCAL_GATE, 'package metadata exposes binding security local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_BINDING_SECURITY_PACKAGE_SCRIPT, 'package metadata exposes binding security package script');
  context.assert(runner.hasSuite("rmt-kernel-binding-security"), 'runner registers binding security suite');
  context.assert(runner.hasImplementation({ function: "runRmtKernelBindingSecuritySuite" }), 'runner imports binding security suite');

  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_BINDING_SECURITY_SCHEMA,
    RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
    'url-attribute',
    RMT_KERNEL_BINDING_SECURITY_LOCAL_GATE
  ], 'binding security contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_BINDING_SECURITY_SCHEMA,
    RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
    RMT_KERNEL_BINDING_SECURITY_LOCAL_GATE
  ], 'RKSH-WP-03 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-03` | P0 | completed | Bindings | Attribute-, URL- und Property-Policies haerten | `npm run test:rmt-kernel-binding-security` |',
    RMT_KERNEL_BINDING_SECURITY_CONTRACT,
    RMT_KERNEL_BINDING_SECURITY_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_BINDING_SECURITY_REPORT_SCHEMA,
    bindingSecuritySchema: RMT_KERNEL_BINDING_SECURITY_SCHEMA,
    trustSinkAdapterSchema: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
    verdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    workpackage: RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelBindingSecurityReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-03 Attribute, URL and Property Policies',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Adapter: ${summary.trustSinkAdapterSchema}`,
      `Verdict schema: ${summary.verdictSchema}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_BINDING_SECURITY_CONTRACT,
  RMT_KERNEL_BINDING_SECURITY_LOCAL_GATE,
  RMT_KERNEL_BINDING_SECURITY_PACKAGE_SCRIPT,
  RMT_KERNEL_BINDING_SECURITY_REPORT_SCHEMA,
  RMT_KERNEL_BINDING_SECURITY_SCHEMA,
  RMT_KERNEL_BINDING_SECURITY_SUITE,
  RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE,
  RMT_KERNEL_BINDING_SECURITY_WP,
  RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
  runRmtKernelBindingSecuritySuite,
  printRmtKernelBindingSecurityReport
};
