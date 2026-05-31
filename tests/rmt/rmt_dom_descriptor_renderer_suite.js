const fs = require('fs');
const path = require('path');
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
  FORBIDDEN_NORMAL_UI_SINKS,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  NO_MANUAL_HTML_GATE_SCHEMA,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DOCS,
  REQUIRED_RENDER_OPERATIONS,
  RMT_DOM_DESCRIPTOR_RENDERER_DOCS,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE,
  RMT_DOM_DESCRIPTOR_RENDERER_MODULE,
  RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT,
  RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
  RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_STATUS,
  RMT_DOM_DESCRIPTOR_RENDERER_SUITE,
  RMT_DOM_DESCRIPTOR_RENDERER_TARGET,
  RMT_DOM_DESCRIPTOR_RENDERER_TYPES,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC,
  RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA,
  TRUSTED_DOM_BOUNDARY,
  createRmtDomDescriptorRendererPlan,
  createRmtDomDescriptorRendererReport,
  validateRmtDomDescriptorRendererPlan
} = require('../../catalog/epic18-rmt-dom-descriptor-renderer');
const {
  RMT_APP_PLATFORM_AUTHORING_SCHEMA
} = require('../../catalog/epic18-rmt-app-platform-authoring');
let rendererModulePromise = null;

function loadRendererModule(rootDir) {
  if (!rendererModulePromise) {
    rendererModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir)}`);
  }
  return rendererModulePromise;
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, label) {
  const values = Array.isArray(actual) ? actual : [];
  expected.forEach((entry) => {
    context.assert(values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function createFakeText(text) {
  return {
    nodeType: 3,
    textContent: String(text || ''),
    parentNode: null
  };
}

function createFakeElement(tagName = 'div') {
  const listeners = new Map();
  const attributes = {};
  const element = {
    nodeType: 1,
    tagName: String(tagName || 'div').toUpperCase(),
    attributes,
    childNodes: [],
    children: [],
    parentNode: null,
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = String(value);
      }
    },
    appendChild(child) {
      if (child && child.nodeType === 11) {
        child.childNodes.slice().forEach((fragmentChild) => this.appendChild(fragmentChild));
        return child;
      }
      this.childNodes.push(child);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = this;
      return child;
    },
    replaceChildren(...nodes) {
      this.childNodes = [];
      this.children = [];
      nodes.forEach((node) => this.appendChild(node));
    },
    setAttribute(name, value) {
      attributes[String(name)] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, String(name)) ? attributes[String(name)] : null;
    },
    removeAttribute(name) {
      delete attributes[String(name)];
    },
    addEventListener(name, listener) {
      listeners.set(String(name), listener);
    },
    dispatchEvent(event) {
      const listener = listeners.get(String(event.type));
      if (listener) listener(event);
      return true;
    },
    querySelector(selector) {
      if (selector.startsWith('[data-rmt-component="')) {
        const componentId = selector.slice(21, -2);
        return findNode(this, (node) => node.getAttribute && node.getAttribute('data-rmt-component') === componentId);
      }
      if (selector.startsWith('[data-rmt-key="')) {
        const key = selector.slice(15, -2);
        return findNode(this, (node) => node.getAttribute && node.getAttribute('data-rmt-key') === key);
      }
      return null;
    },
    _listeners: listeners
  };
  return element;
}

function createFakeFragment() {
  return {
    nodeType: 11,
    childNodes: [],
    appendChild(child) {
      if (child && child.nodeType === 11) {
        child.childNodes.slice().forEach((fragmentChild) => this.appendChild(fragmentChild));
        return child;
      }
      this.childNodes.push(child);
      if (child) child.parentNode = this;
      return child;
    }
  };
}

function createFakeDocument() {
  return {
    createElement: createFakeElement,
    createTextNode: createFakeText,
    createDocumentFragment: createFakeFragment
  };
}

function findNode(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.childNodes || []) {
    const match = findNode(child, predicate);
    if (match) return match;
  }
  return null;
}

function textContent(root) {
  if (!root) return '';
  if (root.nodeType === 3) return root.textContent || '';
  return (root.childNodes || []).map(textContent).join('');
}

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertFixtureGraph(context, fixture) {
  const templates = indexById(fixture.templates);
  const components = indexById(fixture.components);
  const slots = indexById(fixture.slots);
  const resources = indexById(fixture.resources);
  (fixture.renderUnits || []).forEach((unit) => {
    context.assert(templates.has(unit.template), `${unit.id}: template resolves`);
    context.assert(['replace_children', 'keyed_children'].includes(unit.ownershipMode), `${unit.id}: ownership mode is renderer-supported`);
  });
  (fixture.templates || []).forEach((template) => {
    context.assert(template.renderMode === 'dom_descriptor' || template.renderMode === 'trusted_html', `${template.id}: render mode is explicit`);
    if (template.renderMode === 'trusted_html') {
      context.assert(template.trustedBoundary === TRUSTED_DOM_BOUNDARY, `${template.id}: trusted boundary resolves`);
      context.assert(resources.has(template.resource), `${template.id}: trusted resource resolves`);
    }
  });
  (fixture.components || []).forEach((component) => {
    context.assert(component.tag && /^[a-z][a-z0-9.-]*$/u.test(component.tag), `${component.id}: component has safe tag`);
  });
  (fixture.slots || []).forEach((slot) => {
    context.assert(templates.has(slot.owner), `${slot.id}: owner template resolves`);
    context.assert(templates.has(slot.template), `${slot.id}: slot template resolves`);
  });
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'renderer fixture stays product-agnostic');
  FORBIDDEN_NORMAL_UI_SINKS.forEach((sink) => {
    context.assert(!fixtureText.includes(sink), `renderer fixture does not contain ${sink}`);
  });
}

function createRendererFixtureHarness(fixture, rendererModule) {
  const documentTarget = createFakeDocument();
  const diagnosticsHub = {
    entries: [],
    publish(channel, payload, meta) {
      this.entries.push({ channel, payload, meta });
    }
  };
  const events = [];
  const renderer = rendererModule.createRmtDomDescriptorRenderer({
    documentTarget,
    diagnosticsHub
  });
  const components = fixture.components;
  const templates = fixture.templates;
  const slots = fixture.slots;
  return {
    documentTarget,
    diagnosticsHub,
    events,
    renderer,
    renderOptions: {
      components,
      templates,
      slots,
      model: {
        hasItems: true,
        items: [
          { id: 'a', title: 'Alpha', kind: 'task' },
          { id: 'b', title: 'Beta', kind: 'note' }
        ]
      },
      dispatchEvent(event) {
        events.push(event);
      },
      source: {
        documentId: fixture.manifest.id,
        templateId: 'template.shell',
        pointer: '/templates/0/root'
      }
    }
  };
}

function runRendererBehaviorAssertions(context, fixture, rendererModule) {
  const harness = createRendererFixtureHarness(fixture, rendererModule);
  const root = harness.documentTarget.createElement('main');
  const shellTemplate = indexById(fixture.templates).get('template.shell');
  const result = harness.renderer.render(root, shellTemplate.root, harness.renderOptions);
  context.assert(result.schema === 'xtend.epic18.rmt-dom-render-result.v1', 'renderer emits render result schema');
  context.assert(root.getAttribute('data-rmt-rendered-shell') === 'true', 'renderer marks rendered shell');
  context.assert(root.getAttribute('data-rmt-renderer-schema') === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'renderer marks schema on root');
  const shell = root.querySelector('[data-rmt-component="component.shell"]');
  context.assert(shell && shell.tagName === 'X-SECTION', 'renderer creates XTend shell component');
  context.assert(textContent(root).includes('Alpha') && textContent(root).includes('Beta'), 'renderer renders repeated generic records as text nodes');
  const row = root.querySelector('[data-rmt-component="component.row"]');
  context.assert(row && row.getAttribute('title') === 'Alpha', 'renderer resolves item-bound attributes');
  context.assert(row && row.value === 'a', 'renderer applies safe properties');
  row.dispatchEvent({ type: 'click', detail: { id: 'a' } });
  context.assert(harness.events.length === 1 && harness.events[0].id === 'event.item-selected', 'renderer wires events without inline handlers');
  context.assert(harness.renderer.listDiagnostics().length === 0, 'happy-path renderer has no diagnostics');

  const listRoot = harness.documentTarget.createElement('section');
  const firstPass = harness.renderer.renderKeyed(listRoot, [
    { type: 'element', tag: 'article', key: 'a', attributes: { title: 'Alpha' }, children: [{ type: 'text', text: 'Alpha' }] },
    { type: 'element', tag: 'article', key: 'b', attributes: { title: 'Beta' }, children: [{ type: 'text', text: 'Beta' }] }
  ], harness.renderOptions);
  const firstA = firstPass[0];
  const secondPass = harness.renderer.renderKeyed(listRoot, [
    { type: 'element', tag: 'article', key: 'b', attributes: { title: 'Beta changed' }, children: [{ type: 'text', text: 'Beta changed' }] },
    { type: 'element', tag: 'article', key: 'a', attributes: { title: 'Alpha changed' }, children: [{ type: 'text', text: 'Alpha changed' }] }
  ], harness.renderOptions);
  context.assert(secondPass[1] === firstA, 'keyed diff reuses existing node by data-rmt-key');
  context.assert(secondPass[1].getAttribute('title') === 'Alpha changed', 'keyed diff patches safe attributes on reused node');

  const dockDescriptor = {
    type: 'component',
    tag: 'x-section',
    component: 'x-section',
    attributes: {
      'data-maraca-surface': { op: 'literal', value: 'surface.dock' },
      'data-rmt-component': { op: 'literal', value: 'x-section' }
    },
    children: [{
      type: 'repeat',
      source: '$model.dock.items',
      key: '$item.id',
      template: {
        type: 'element',
        tag: 'button',
        attributes: {
          type: { op: 'literal', value: 'button' },
          'data-action': '$item.action',
          'data-id': '$item.id'
        },
        children: [
          { type: 'element', tag: 'span', class: 'title', text: '$item.title' },
          { type: 'element', tag: 'span', class: 'subtitle', text: '$item.subtitle' }
        ]
      }
    }]
  };
  const dock = harness.renderer.renderNode(dockDescriptor, {
    model: {
      dock: {
        items: [{ id: 'surface.player', action: 'toggle-surface', title: 'Player', subtitle: 'open' }]
      }
    }
  });
  const patchedDock = harness.renderer.patchElement(dock, dockDescriptor, {
    model: {
      dock: {
        items: [{ id: 'surface.player', action: 'toggle-surface', title: 'Player', subtitle: 'minimized' }]
      }
    }
  });
  context.assert(patchedDock === dock, 'structured patch keeps the surface host element stable');
  context.assert(textContent(dock).includes('minimized') && !textContent(dock).includes('open'), 'structured patch refreshes repeated surface dock content');
}

function runSecurityAssertions(context, fixture, rendererModule) {
  const harness = createRendererFixtureHarness(fixture, rendererModule);
  const root = harness.documentTarget.createElement('main');
  try {
    harness.renderer.render(root, {
      type: 'element',
      tag: 'section',
      attributes: {
        onclick: 'evil()'
      },
      source: {
        templateId: 'template.bad',
        pointer: '/templates/bad/root'
      }
    }, harness.renderOptions);
    context.fail('renderer rejects inline event attributes');
  } catch (error) {
    context.assert(error.code === 'rmt.dom.attribute.unsafe', 'renderer throws unsafe attribute code');
    context.assert(error.diagnostic && error.diagnostic.schema === RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA, 'renderer error carries diagnostic schema');
    context.assert(error.diagnostic && error.diagnostic.source.pointer === '/templates/bad/root', 'diagnostic maps error to RMT source pointer');
  }
  context.assert(harness.renderer.listDiagnostics().some((diagnostic) => diagnostic.code === 'rmt.dom.attribute.unsafe'), 'renderer records unsafe attribute diagnostic');

  const trustedTemplate = indexById(fixture.templates).get('template.trusted-fragment');
  try {
    harness.renderer.renderNode({
      type: 'trusted_html',
      trustedBoundary: trustedTemplate.trustedBoundary,
      resource: trustedTemplate.resource,
      source: trustedTemplate.source
    }, harness.renderOptions);
    context.fail('trusted HTML without explicit renderer is rejected');
  } catch (error) {
    context.assert(error.code === 'rmt.dom.trusted-renderer.missing', 'trusted HTML requires explicit trusted renderer');
  }
  const trustedNode = harness.renderer.renderNode({
    type: 'trusted_html',
    trustedBoundary: TRUSTED_DOM_BOUNDARY,
    resource: 'resource.trusted-fragment'
  }, {
    ...harness.renderOptions,
    trustedDomRenderer() {
      const node = harness.documentTarget.createElement('aside');
      node.setAttribute('data-rmt-trusted-boundary', TRUSTED_DOM_BOUNDARY);
      return node;
    }
  });
  context.assert(trustedNode && trustedNode.getAttribute('data-rmt-trusted-boundary') === TRUSTED_DOM_BOUNDARY, 'trusted HTML delegates to explicit boundary renderer');
}

function runNoManualHtmlGateAssertions(context, rootDir, rendererModule) {
  const runtimeSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME, rootDir);
  const fixtureSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE, rootDir);
  const demoRuntime = readText('xtendrmt/rmt-first-demo-app.js', rootDir);
  const gate = rendererModule.createNoManualHtmlGate();
  const cleanDiagnostics = gate.scanFiles({
    [RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME]: runtimeSource,
    [RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE]: fixtureSource,
    'xtendrmt/rmt-first-demo-app.js': demoRuntime
  });
  context.assert(gate.schema === NO_MANUAL_HTML_GATE_SCHEMA, 'No-Manual-HTML gate exposes schema');
  context.assert(cleanDiagnostics.length === 0, 'No-Manual-HTML gate accepts renderer and RMT shell units');
  const badDiagnostics = gate.scanText('root.innerHTML = "<x-section></x-section>";', {
    filePath: 'host-app/manual-shell.js'
  });
  context.assert(badDiagnostics.length >= 1, 'No-Manual-HTML gate rejects root.innerHTML host shell');
  context.assert(badDiagnostics.some((diagnostic) => diagnostic.sink === 'root.innerHTML'), 'No-Manual-HTML diagnostic names blocked sink');
}

async function runRmtDomDescriptorRendererSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-dom-descriptor-renderer',
    label: 'Epic 18 RMT DOM Descriptor renderer'
  });
  const plan = createRmtDomDescriptorRendererPlan({ rootDir });
  const validation = validateRmtDomDescriptorRendererPlan(plan);
  const report = createRmtDomDescriptorRendererReport({ rootDir, plan });
  const fixture = readJson(RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE, rootDir);
  const docs = readText(RMT_DOM_DESCRIPTOR_RENDERER_DOCS, rootDir);
  const workpackageDoc = readText(RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('docs/epic18-media-manager-vendor-upstream.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const runtimeSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME, rootDir);
  const typeSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_TYPES, rootDir);
  const rendererModule = await loadRendererModule(rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_DOM_DESCRIPTOR_RENDERER_MODULE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_DOM_DESCRIPTOR_RENDERER_SUITE, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-05 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-05 doc`);
  });

  context.assert(moduleSyntax.ok, `DOM Descriptor renderer contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `DOM Descriptor renderer runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `DOM Descriptor renderer suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'DOM Descriptor renderer schema is stable');
  context.assert(plan.reportSchema === RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA, 'DOM Descriptor renderer report schema is stable');
  context.assert(plan.fixtureSchema === RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA, 'DOM Descriptor renderer fixture schema is stable');
  context.assert(plan.diagnosticSchema === RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA, 'DOM Descriptor renderer diagnostic schema is stable');
  context.assert(plan.workpackage === RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE, 'DOM Descriptor renderer belongs to WP-E18-05');
  context.assert(plan.status === RMT_DOM_DESCRIPTOR_RENDERER_STATUS, 'DOM Descriptor renderer status is accepted');
  context.assert(plan.targetReadiness === RMT_DOM_DESCRIPTOR_RENDERER_TARGET, 'DOM Descriptor renderer target is ready');
  context.assert(plan.authoringSchema === RMT_APP_PLATFORM_AUTHORING_SCHEMA, 'DOM Descriptor renderer consumes WP-E18-04 authoring schema');
  context.assert(plan.localGate === RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE, 'DOM Descriptor renderer local gate is stable');
  context.assert(plan.packageScript === RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT, 'DOM Descriptor renderer package script is stable');
  context.assert(plan.trustedDomBoundary === TRUSTED_DOM_BOUNDARY, 'DOM Descriptor renderer exposes trusted boundary');
  context.assert(validation.ok === true, 'DOM Descriptor renderer plan validates');
  context.assert(report.ok === true, 'DOM Descriptor renderer report validates');
  context.assert(report.rendererImplemented === true && report.runtimeImplemented === true, 'WP-E18-05 claims runtime implementation');
  context.assert(report.normalUiAllowsManualHtml === false, 'normal UI does not allow manual HTML');
  assertIncludesAll(context, plan.requiredRenderOperations, REQUIRED_RENDER_OPERATIONS, 'required render operations');
  assertIncludesAll(context, plan.forbiddenNormalUiSinks, FORBIDDEN_NORMAL_UI_SINKS, 'forbidden normal UI sinks');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'renderer boundaries');

  context.assert(fixture.kind === 'rmt_document', 'DOM Descriptor fixture is an RMT document');
  context.assert(fixture.schema === RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA, 'DOM Descriptor fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'DOM Descriptor fixture declares renderer contract');
  context.assert(fixture.manifest.metadata.authoringContract === RMT_APP_PLATFORM_AUTHORING_SCHEMA, 'DOM Descriptor fixture links authoring contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE, 'DOM Descriptor fixture is owned by WP-E18-05');
  context.assert(fixture.manifest.metadata.manualHtmlRendererAllowed === false, 'DOM Descriptor fixture forbids manual HTML renderer');
  context.assert(fixture.manifest.metadata.normalUiAllowsManualHtml === false, 'DOM Descriptor fixture forbids normal UI manual HTML');
  context.assert(fixture.manifest.metadata.trustedHtmlBoundary === TRUSTED_DOM_BOUNDARY, 'DOM Descriptor fixture declares trusted boundary');
  assertFixtureGraph(context, fixture);
  context.assert(rendererModule.RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'runtime module exports renderer schema');
  context.assert(typeof rendererModule.createRmtDomDescriptorRenderer === 'function', 'runtime module exports renderer factory');
  context.assert(typeof rendererModule.createNoManualHtmlGate === 'function', 'runtime module exports no-manual-HTML gate');
  runRendererBehaviorAssertions(context, fixture, rendererModule);
  runSecurityAssertions(context, fixture, rendererModule);
  runNoManualHtmlGateAssertions(context, rootDir, rendererModule);

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtDomDescriptorRenderer',
    'createNoManualHtmlGate',
    'createElement',
    'createTextNode',
    'createDocumentFragment',
    'replaceChildren',
    'data-rmt-key',
    RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA,
    TRUSTED_DOM_BOUNDARY
  ], 'DOM Descriptor renderer runtime');
  context.assert(!/\.\s*innerHTML\s*=/u.test(runtimeSource), 'runtime source has no innerHTML assignment sink');
  context.assert(!/insertAdjacentHTML\s*\(/u.test(runtimeSource), 'runtime source has no insertAdjacentHTML sink');
  assertTextIncludesAll(context, typeSource, [
    'RmtDomDescriptorRenderer',
    'createRmtDomDescriptorRenderer',
    'createNoManualHtmlGate'
  ], 'DOM Descriptor renderer types');
  assertTextIncludesAll(context, docs, [
    '# RMT DOM Descriptor Renderer',
    RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    'createElement',
    'replaceChildren',
    'keyed',
    'No-Manual-HTML',
    NEXT_WORKPACKAGE
  ], 'DOM Descriptor renderer docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
    RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-05 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-05` | P0 | completed'), 'Backlog marks WP-E18-05 completed');
  context.assert(
    backlog.includes('| `WP-E18-06` | P0 | ready') || backlog.includes('| `WP-E18-06` | P0 | completed'),
    'Backlog marks WP-E18-06 ready or completed after renderer'
  );
  context.assert(epic.includes('| `WP-E18-05` | P0 | completed'), 'Epic marks WP-E18-05 completed');
  context.assert(epic.includes('rmt-dom-descriptor-renderer'), 'Epic gate chain includes DOM Descriptor renderer gate');
  context.assert(runner.includes("require('../tests/rmt/rmt_dom_descriptor_renderer_suite')"), 'Runner imports DOM Descriptor renderer suite');
  context.assert(runner.includes("id: 'rmt-dom-descriptor-renderer'"), 'Runner registers DOM Descriptor renderer suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-dom-descriptor-renderer'] === 'node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer', 'Package exposes DOM Descriptor renderer script');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/dom-descriptor-renderer'], 'Package exports DOM Descriptor renderer');
  const packageMetadata = packageManifest.xtend && packageManifest.xtend.rmtDomDescriptorRenderer;
  context.assert(packageMetadata && packageMetadata.schema === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'Package metadata exposes DOM Descriptor renderer schema');
  context.assert(packageMetadata && packageMetadata.localGate === RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE, 'Package metadata exposes DOM Descriptor renderer local gate');
  context.assert(packageMetadata && packageMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-06 handoff');

  return context.result({
    schema: RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
    fixture: RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
    runtime: RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtDomDescriptorRendererReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT DOM Descriptor Renderer erfolgreich.',
    failureTitle: 'Epic 18 RMT DOM Descriptor Renderer fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtDomDescriptorRendererSuite()
    .then((result) => {
      printRmtDomDescriptorRendererReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtDomDescriptorRendererReport,
  runRmtDomDescriptorRendererSuite
};
