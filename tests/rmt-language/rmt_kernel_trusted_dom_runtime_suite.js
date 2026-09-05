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

const RMT_KERNEL_TRUSTED_DOM_RUNTIME_SCHEMA = 'xtend.rmt.kernel-trusted-dom-runtime.v1';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_REPORT_SCHEMA = 'xtend.rmt.kernel-trusted-dom-runtime-report.v1';
const RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA = 'xtend.rmt.runtime-trust-sink-adapter.v1';
const RMT_KERNEL_TRUST_VERDICT_SCHEMA = 'xtend.rmt.kernel-trust-verdict.v1';
const RMT_KERNEL_TRUST_AUTHORITY_SCHEMA = 'xtend.rmt.kernel-trust-authority.v1';
const RMT_TRUSTED_DOM_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_WORKPACKAGE = 'RKSH-WP-02';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_SUITE = 'tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_CONTRACT = 'development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_WP = 'development/WP-RKSH-02-Runtime-Trust-Sink-Adapter-anbinden.md';
const RMT_KERNEL_SECURITY_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json';
const RMT_KERNEL_TRUSTED_DOM_RUNTIME_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-trusted-dom-runtime';
const RMT_ARTIFACTS = [
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js'
];
const DANGEROUS_HTML = '<img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script><p srcdoc="x">Ok</p><iframe src="/frame"></iframe><a href="/safe">Safe</a>';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function assertTrustedHtml(context, html, label) {
  const normalized = String(html || '').toLowerCase();
  context.assert(!normalized.includes('<script'), `${label} strips script tags`);
  context.assert(!normalized.includes('<iframe'), `${label} strips iframe tags`);
  context.assert(!normalized.includes('onerror'), `${label} strips event attributes`);
  context.assert(!normalized.includes('javascript:'), `${label} strips unsafe urls`);
  context.assert(!normalized.includes('srcdoc'), `${label} strips srcdoc attributes`);
  context.assert(normalized.includes('ok') || normalized.includes('safe') || normalized.includes('oops'), `${label} keeps safe content`);
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
      const snapshot = {
        channel,
        payload,
        meta
      };
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
    context.fail(`${artifactPath} evaluates for trusted DOM runtime probe (${error.message})`);
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
    rootId: 'trusted-dom-root',
    template: {
      id: 'trusted-dom-template',
      qualifiedId: 'trusted.dom.template',
      namespace: '',
      documentId: 'trusted-dom-doc',
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
      resourceId: 'template.chunk:trusted.dom.template',
      metadata: {}
    },
    modelSnapshot: {},
    plan: {
      executionMode: 'runtime_render',
      rootId: 'trusted-dom-root',
      templateQualifiedId: 'trusted.dom.template',
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
        id: 'trusted-dom-boundary',
        qualifiedId: 'trusted.dom.boundary',
        namespace: '',
        documentId: 'trusted-dom-doc',
        mode: 'html_fragment',
        markup: '<section>normal</section>',
        props: [],
        bindings: [],
        slots: [],
        hydration: {},
        reactivityHints: {},
        errorBoundary: {
          enabled: true,
          name: 'trusted-dom-boundary',
          fallbackMarkup
        }
      };
    }
  };
}

function runArtifactProbe(context, rootDir, artifactPath) {
  const loaded = createRmtAppModulesFromArtifact(context, rootDir, artifactPath);
  if (!loaded) return;
  const { AppModules, documentTarget } = loaded;
  const diagnosticsHub = createDiagnosticsHub();
  const slotElement = documentTarget.createElement('div');
  const rootElement = documentTarget.createElement('section');
  rootElement._queryMap = {
    '[data-slot="danger"]': slotElement
  };

  const renderer = AppModules.createRmtTemplateRuntimeRenderer({
    documentTarget,
    diagnosticsHub
  });
  const session = renderer.applyBindings({
    rootId: 'trusted-dom-renderer-root',
    element: rootElement,
    templateQualifiedId: 'trusted.dom.renderer',
    slots: [{
      name: 'danger',
      kind: 'html_fragment',
      target: '[data-slot="danger"]',
      source: 'danger'
    }],
    modelSnapshot: {
      danger: DANGEROUS_HTML
    }
  });

  assertTrustedHtml(context, slotElement.innerHTML, `${artifactPath} slot html`);
  const rendererVerdicts = renderer.listTrustVerdicts();
  context.assert(rendererVerdicts.length >= 1, `${artifactPath} renderer records trust verdicts`);
  context.assert(session.listTrustVerdicts().length === rendererVerdicts.length, `${artifactPath} session exposes trust verdicts`);
  const slotVerdict = rendererVerdicts.find((verdict) => verdict.sink === 'slot.html');
  context.assert(slotVerdict && slotVerdict.schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, `${artifactPath} slot verdict uses trust verdict schema`);
  context.assert(slotVerdict && slotVerdict.authoritySchema === RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, `${artifactPath} slot verdict points to authority schema`);
  context.assert(slotVerdict && slotVerdict.verdict === 'sanitized', `${artifactPath} slot verdict is sanitized`);
  context.assert(slotVerdict && slotVerdict.commitAllowed === true, `${artifactPath} slot verdict allows sanitized commit`);
  context.assert(slotVerdict && slotVerdict.sanitized === true, `${artifactPath} slot verdict marks sanitized`);
  context.assert(slotVerdict && slotVerdict.trustBoundary === RMT_TRUSTED_DOM_BOUNDARY, `${artifactPath} slot verdict records trusted DOM boundary`);
  context.assert(slotVerdict && slotVerdict.metadata && slotVerdict.metadata.removedCount >= 4, `${artifactPath} slot verdict records removals`);
  context.assert(!JSON.stringify(slotVerdict.metadata || {}).includes('<script'), `${artifactPath} slot verdict metadata redacts raw html`);

  const executionPath = AppModules.createRmtTemplateExecutionPath({
    documentTarget,
    diagnosticsHub,
    registry: createTemplateRegistry('<strong>Fallback</strong>')
  });
  const prerenderElement = documentTarget.createElement('main');
  const applied = executionPath.applyPrerenderChunk(prerenderElement, createChunk(DANGEROUS_HTML));
  context.assert(applied === true, `${artifactPath} applies sanitized prerender chunk`);
  assertTrustedHtml(context, prerenderElement.innerHTML, `${artifactPath} prerender html`);
  const prerenderVerdict = executionPath.listTrustVerdicts().find((verdict) => verdict.sink === 'prerender.html');
  context.assert(prerenderVerdict && prerenderVerdict.verdict === 'sanitized', `${artifactPath} prerender verdict is sanitized`);

  const boundaryElement = documentTarget.createElement('main');
  const boundaryPath = AppModules.createRmtTemplateExecutionPath({
    documentTarget,
    diagnosticsHub,
    registry: createTemplateRegistry('<strong onclick="alert(1)">Oops</strong><script>alert(1)</script>'),
    publicApi: {
      mountIsland() {
        throw new Error('mount failed');
      }
    }
  });
  const boundaryResult = boundaryPath.renderTemplate({
    rootId: 'trusted-dom-boundary-root',
    target: boundaryElement,
    template: {
      id: 'trusted-dom-boundary'
    },
    model: {}
  });
  context.assert(boundaryResult && boundaryResult.errorBoundary && boundaryResult.errorBoundary.handled === true, `${artifactPath} error boundary handles failed render`);
  assertTrustedHtml(context, boundaryElement.innerHTML, `${artifactPath} error boundary fallback`);
  const fallbackVerdict = boundaryPath.listTrustVerdicts().find((verdict) => verdict.sink === 'fallback.html');
  context.assert(fallbackVerdict && fallbackVerdict.verdict === 'sanitized', `${artifactPath} fallback verdict is sanitized`);

  context.assert(
    diagnosticsHub.entries.some((entry) => entry.channel === 'rmt.kernel.trust' && entry.payload && entry.payload.sinkAdapterSchema === RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA),
    `${artifactPath} publishes trust diagnostics`
  );
}

function runRmtKernelTrustedDomRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-trusted-dom-runtime',
    label: 'RKSH-WP-02 Runtime Trust-Sink Adapter'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelTrustedDomRuntime;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const declarations = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const backlog = readText(RMT_KERNEL_SECURITY_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_TRUSTED_DOM_RUNTIME_CONTRACT, rootDir);
  const workpackage = readText(RMT_KERNEL_TRUSTED_DOM_RUNTIME_WP, rootDir);
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_TRUSTED_DOM_RUNTIME_SUITE, { rootDir, extension: '.js' });

  [
    ...RMT_ARTIFACTS,
    'xtendrmt/rmt-core.d.ts',
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_SUITE,
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_CONTRACT,
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_WP,
    RMT_KERNEL_SECURITY_BACKLOG
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(suiteSyntax.ok, `Trusted DOM runtime suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  RMT_ARTIFACTS.forEach((artifactPath) => {
    const artifactSource = readText(artifactPath, rootDir);
    const syntax = syntaxCheckFile(artifactPath, { rootDir, extension: artifactPath.endsWith('.browser.js') ? '.js' : '.mjs' });
    context.assert(syntax.ok, `${artifactPath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    assertTextIncludesAll(context, artifactSource, [
      RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
      RMT_KERNEL_TRUST_VERDICT_SCHEMA,
      RMT_TRUSTED_DOM_BOUNDARY,
      'commitTrustedHtml',
      'listTrustVerdicts'
    ], `${artifactPath} trust adapter`);
    [
      'element.innerHTML = html;',
      "element.innerHTML = String(chunk.markup.html || '');",
      'element.innerHTML = fallbackMarkup;',
      "bindingRecord.element.innerHTML = fallbackMarkup.join('');",
      'record.element.innerHTML = safeEmptyMarkup;'
    ].forEach((unsafeSnippet) => {
      context.assert(!artifactSource.includes(unsafeSnippet), `${artifactPath} removes legacy unsafe snippet ${unsafeSnippet}`);
    });
    runArtifactProbe(context, rootDir, artifactPath);
  });

  assertTextIncludesAll(context, declarations, [
    'RmtKernelRuntimeTrustVerdict',
    'listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[]'
  ], 'RMT declarations');

  context.assert(packageManifest.scripts['test:rmt-kernel-trusted-dom-runtime'] === 'node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime', 'package exposes trusted DOM runtime script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_TRUSTED_DOM_RUNTIME_SCHEMA, 'package metadata exposes trusted DOM runtime schema');
  context.assert(metadata && metadata.trustSinkAdapterSchema === RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA, 'package metadata exposes trust sink adapter schema');
  context.assert(metadata && metadata.verdictSchema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, 'package metadata exposes verdict schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_TRUSTED_DOM_RUNTIME_WORKPACKAGE, 'package metadata points to RKSH-WP-02');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_TRUSTED_DOM_RUNTIME_LOCAL_GATE, 'package metadata exposes trusted DOM runtime local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_TRUSTED_DOM_RUNTIME_PACKAGE_SCRIPT, 'package metadata exposes trusted DOM runtime package script');
  context.assert(runner.hasSuite("rmt-kernel-trusted-dom-runtime"), 'runner registers trusted DOM runtime suite');
  context.assert(runner.hasImplementation({ function: "runRmtKernelTrustedDomRuntimeSuite" }), 'runner imports trusted DOM runtime suite');

  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_SCHEMA,
    RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
    RMT_TRUSTED_DOM_BOUNDARY,
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_LOCAL_GATE
  ], 'trusted DOM runtime contract');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_SCHEMA,
    RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_LOCAL_GATE
  ], 'RKSH-WP-02 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-02` | P0 | completed | DOM | Runtime Trust-Sink-Adapter anbinden | `npm run test:rmt-kernel-trusted-dom-runtime` |',
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_CONTRACT,
    RMT_KERNEL_TRUSTED_DOM_RUNTIME_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_TRUSTED_DOM_RUNTIME_REPORT_SCHEMA,
    trustedDomRuntimeSchema: RMT_KERNEL_TRUSTED_DOM_RUNTIME_SCHEMA,
    trustSinkAdapterSchema: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
    verdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    trustBoundary: RMT_TRUSTED_DOM_BOUNDARY,
    workpackage: RMT_KERNEL_TRUSTED_DOM_RUNTIME_WORKPACKAGE,
    artifacts: RMT_ARTIFACTS.slice()
  });
}

function printRmtKernelTrustedDomRuntimeReport(result) {
  printSuiteReport(result, {
    title: 'RKSH-WP-02 Runtime Trust-Sink Adapter',
    summary: (summary) => [
      `Schema: ${summary.schema}`,
      `Adapter: ${summary.trustSinkAdapterSchema}`,
      `Verdict schema: ${summary.verdictSchema}`,
      `Trust boundary: ${summary.trustBoundary}`,
      `Artifacts: ${summary.artifacts.length}`
    ]
  });
}

module.exports = {
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_CONTRACT,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_LOCAL_GATE,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_PACKAGE_SCRIPT,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_REPORT_SCHEMA,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_SCHEMA,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_SUITE,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_WORKPACKAGE,
  RMT_KERNEL_TRUSTED_DOM_RUNTIME_WP,
  RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
  runRmtKernelTrustedDomRuntimeSuite,
  printRmtKernelTrustedDomRuntimeReport
};
