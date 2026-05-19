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
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_COMPONENT_FAMILIES,
  REQUIRED_DOCS,
  REQUIRED_RENDERER_CAPABILITIES,
  REQUIRED_TEMPLATE_PRIMITIVES,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_PACKAGE_SCRIPT,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC,
  createRmtComponentTemplatePrimitivesPlan,
  createRmtComponentTemplatePrimitivesReport,
  validateRmtComponentTemplatePrimitivesPlan
} = require('../../catalog/epic18-rmt-component-template-primitives');
const {
  RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA
} = require('../../catalog/epic18-rmt-dom-descriptor-renderer');

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

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
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
      if (selector.startsWith('[data-rmt-ref="')) {
        const ref = selector.slice(15, -2);
        return findNode(this, (node) => node.getAttribute && node.getAttribute('data-rmt-ref') === ref);
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

function collectTemplatePrimitiveCoverage(node, coverage = new Set()) {
  if (!node || typeof node !== 'object') return coverage;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectTemplatePrimitiveCoverage(entry, coverage));
    return coverage;
  }
  if (node.type) coverage.add(node.type === 'element' ? 'attributes' : node.type);
  if (node.component) coverage.add('component');
  if (node.props || node.properties) coverage.add('props');
  if (node.attributes) coverage.add('attributes');
  if (node.parts || node.part) coverage.add('parts');
  if (node.slots) coverage.add('slots');
  if (Object.prototype.hasOwnProperty.call(node, 'text')) coverage.add('text');
  if (node.key) coverage.add('key');
  if (node.ref) coverage.add('ref');
  if (node.class || node.className || node.classes) coverage.add('class');
  if (node.styleToken || node.styleTokens || node['style-token']) coverage.add('style-token');
  Object.values(node).forEach((value) => collectTemplatePrimitiveCoverage(value, coverage));
  return coverage;
}

function assertFixtureGraph(context, fixture) {
  const components = indexById(fixture.components);
  const templates = indexById(fixture.templates);
  const slots = indexById(fixture.slots);
  const componentFamilies = (fixture.componentFamilies || []).map((family) => family.id);
  assertIncludesAll(context, componentFamilies, REQUIRED_COMPONENT_FAMILIES, 'fixture component families');
  (fixture.componentFamilies || []).forEach((family) => {
    (family.components || []).forEach((componentId) => {
      context.assert(components.has(componentId), `${family.id}: component resolves ${componentId}`);
    });
  });
  (fixture.slots || []).forEach((slot) => {
    context.assert(templates.has(slot.owner), `${slot.id}: owner resolves`);
    context.assert(templates.has(slot.template), `${slot.id}: template resolves`);
  });
  (fixture.templates || []).forEach((template) => {
    context.assert(template.renderMode === 'dom_descriptor', `${template.id}: component primitive template stays dom_descriptor`);
    collectTemplatePrimitiveCoverage(template.root);
  });
  const primitiveCoverage = [...(fixture.templates || []).reduce((coverage, template) => collectTemplatePrimitiveCoverage(template.root, coverage), new Set())];
  assertIncludesAll(context, primitiveCoverage, REQUIRED_TEMPLATE_PRIMITIVES, 'fixture primitive coverage');
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'component primitive fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'component primitive fixture contains no manual HTML sinks');
}

function createHarness(fixture, rendererModule) {
  const documentTarget = createFakeDocument();
  const refs = new Map();
  const events = [];
  const renderer = rendererModule.createRmtDomDescriptorRenderer({ documentTarget });
  const model = {
    loading: false,
    density: 'compact',
    query: 'alpha',
    kind: 'all',
    onlySelected: false,
    hasError: false,
    hasItems: true,
    hasSelection: true,
    selectedTitle: 'Alpha',
    errorMessage: 'Could not load records',
    items: [
      { id: 'alpha', title: 'Alpha', kind: 'task', selected: true, disabled: false, ref: 'row.alpha', hint: 'Open Alpha' },
      { id: 'beta', title: 'Beta', kind: 'note', selected: false, disabled: false, ref: 'row.beta', hint: 'Open Beta' }
    ]
  };
  return {
    documentTarget,
    events,
    refs,
    renderer,
    options: {
      components: fixture.components,
      templates: fixture.templates,
      slots: fixture.slots,
      refs,
      model,
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

function runRendererPrimitiveAssertions(context, fixture, rendererModule) {
  const harness = createHarness(fixture, rendererModule);
  const templates = indexById(fixture.templates);
  const root = harness.documentTarget.createElement('main');
  const result = harness.renderer.render(root, templates.get('template.shell').root, harness.options);
  context.assert(result.nodeCount === 1, 'component primitive shell renders one root node');
  context.assert(root.getAttribute('data-rmt-rendered-shell') === 'true', 'component primitive render marks shell root');

  const shell = root.querySelector('[data-rmt-component="component.shell"]');
  context.assert(shell && shell.tagName === 'X-SECTION', 'component primitive shell creates x-section');
  context.assert(shell.getAttribute('class').includes('rmt-shell'), 'class primitive maps shell class tokens');
  context.assert(shell.getAttribute('part').includes('toolbar'), 'parts primitive maps component parts');
  context.assert(shell.getAttribute('data-style-token-density') === 'compact', 'style-token primitive maps density token attribute');
  context.assert(shell.style.values['--xtend-density'] === 'compact', 'style-token primitive maps density custom property');
  context.assert(harness.refs.get('shell.root') === shell, 'ref primitive captures shell root');

  const search = root.querySelector('[data-rmt-ref="filter.search"]');
  const row = root.querySelector('[data-rmt-ref="row.alpha"]');
  const detail = root.querySelector('[data-rmt-ref="detail.panel"]');
  context.assert(search && search.tagName === 'X-INPUT', 'form control family renders x-input');
  context.assert(root.querySelector('[data-rmt-component="component.kind-select"]'), 'form control family renders x-select');
  context.assert(root.querySelector('[data-rmt-component="component.boolean-filter"]'), 'form control family renders x-checkbox');
  context.assert(root.querySelector('[data-rmt-component="component.tooltip"]'), 'tooltip family renders x-tooltip');
  context.assert(root.querySelector('[data-rmt-component="component.icon.refresh"]'), 'icon family renders x-icon');
  context.assert(row && row.tagName === 'X-CARD', 'list family renders x-card row');
  context.assert(row.getAttribute('data-rmt-key') === 'alpha', 'key primitive maps repeated item key');
  context.assert(row.getAttribute('title') === 'Alpha', 'attributes primitive resolves item title');
  context.assert(row.value === 'alpha', 'props primitive resolves item value');
  context.assert(row.getAttribute('class').includes('is-selected'), 'class primitive maps item selected state');
  context.assert(row.getAttribute('data-style-token-accent') === 'task', 'style-token primitive resolves item token');
  context.assert(textContent(row).includes('Alpha'), 'text primitive renders item body');
  context.assert(detail && detail.getAttribute('label') === 'Alpha', 'selection family renders detail panel with bound attribute');
  row.dispatchEvent({ type: 'click', detail: { id: 'alpha' } });
  context.assert(harness.events.length === 1 && harness.events[0].id === 'event.item-selected', 'component primitive event binding uses addEventListener');

  const emptyRoot = harness.documentTarget.createElement('main');
  harness.renderer.render(emptyRoot, templates.get('template.collection').root, {
    ...harness.options,
    model: { ...harness.options.model, hasItems: false, hasError: false, items: [] }
  });
  context.assert(textContent(emptyRoot).includes('No records match this generic view.'), 'empty primitive renders empty-state fallback');
  context.assert(emptyRoot.querySelector('[data-rmt-component="component.empty-state"]'), 'empty-state component family renders');

  const errorRoot = harness.documentTarget.createElement('main');
  harness.renderer.render(errorRoot, templates.get('template.collection').root, {
    ...harness.options,
    model: { ...harness.options.model, hasError: true }
  });
  context.assert(textContent(errorRoot).includes('Could not load records'), 'error-state family renders error message');
  context.assert(errorRoot.querySelector('[data-rmt-component="component.error-state"]'), 'error-state component family renders');

  const fallbackRoot = harness.documentTarget.createElement('main');
  harness.renderer.render(fallbackRoot, templates.get('template.selection').root, {
    ...harness.options,
    model: { ...harness.options.model, hasSelection: false }
  });
  context.assert(textContent(fallbackRoot).includes('Select a record'), 'fallback primitive renders no-selection fallback');
}

async function runRmtComponentTemplatePrimitivesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-component-template-primitives',
    label: 'Epic 18 RMT component-native template primitives'
  });
  const plan = createRmtComponentTemplatePrimitivesPlan({ rootDir });
  const validation = validateRmtComponentTemplatePrimitivesPlan(plan);
  const report = createRmtComponentTemplatePrimitivesReport({ rootDir, plan });
  const fixture = readJson(RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE, rootDir);
  const docs = readText(RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS, rootDir);
  const workpackageDoc = readText(RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('docs/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runtimeSource = readText(RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME, rootDir);
  const typeSource = readText(RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES, rootDir);
  const rendererModule = await loadRendererModule(rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-06 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-06 doc`);
  });

  context.assert(moduleSyntax.ok, `Component template primitive contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component template primitive suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `DOM Descriptor renderer runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(plan.schema === RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA, 'Component template primitive schema is stable');
  context.assert(plan.reportSchema === RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA, 'Component template primitive report schema is stable');
  context.assert(plan.fixtureSchema === RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA, 'Component template primitive fixture schema is stable');
  context.assert(plan.rendererSchema === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'Component template primitives build on WP-E18-05 renderer');
  context.assert(plan.workpackage === RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE, 'Component template primitives belong to WP-E18-06');
  context.assert(plan.status === RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS, 'Component template primitives status is accepted');
  context.assert(plan.targetReadiness === RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET, 'Component template primitives target is ready');
  context.assert(plan.localGate === RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE, 'Component template primitives local gate is stable');
  context.assert(plan.packageScript === RMT_COMPONENT_TEMPLATE_PRIMITIVES_PACKAGE_SCRIPT, 'Component template primitives package script is stable');
  context.assert(validation.ok === true, 'Component template primitive plan validates');
  context.assert(report.ok === true, 'Component template primitive report validates');
  context.assert(report.htmlStringRendererRequired === false, 'Component template primitives require no HTML string renderer');
  assertIncludesAll(context, plan.templatePrimitives, REQUIRED_TEMPLATE_PRIMITIVES, 'required template primitives');
  assertIncludesAll(context, plan.componentFamilies, REQUIRED_COMPONENT_FAMILIES, 'required component families');
  assertIncludesAll(context, plan.rendererCapabilities, REQUIRED_RENDERER_CAPABILITIES, 'required renderer capabilities');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'component primitive boundaries');

  context.assert(fixture.kind === 'rmt_document', 'Component primitive fixture is an RMT document');
  context.assert(fixture.schema === RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA, 'Component primitive fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA, 'Component primitive fixture declares contract');
  context.assert(fixture.manifest.metadata.rendererContract === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'Component primitive fixture declares renderer contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE, 'Component primitive fixture is owned by WP-E18-06');
  context.assert(fixture.manifest.metadata.manualHtmlRendererAllowed === false, 'Component primitive fixture forbids manual HTML renderer');
  context.assert(fixture.manifest.metadata.htmlStringRendererRequired === false, 'Component primitive fixture requires no HTML string renderer');
  context.assert(fixture.acceptance.normalUiContainsHtmlStrings === false, 'Component primitive acceptance rejects HTML strings');
  assertFixtureGraph(context, fixture);
  context.assert(rendererModule.RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'renderer module schema remains WP-E18-05');
  runRendererPrimitiveAssertions(context, fixture, rendererModule);

  assertTextIncludesAll(context, runtimeSource, [
    'applyClassPrimitive',
    'applyPartPrimitive',
    'applyStyleTokens',
    'applyRefPrimitive',
    'renderSlotContent',
    "case 'fallback'"
  ], 'DOM Descriptor renderer primitive runtime');
  context.assert(!/\.\s*innerHTML\s*=/u.test(runtimeSource), 'component primitive runtime path has no innerHTML assignment sink');
  assertTextIncludesAll(context, typeSource, [
    'RmtDomDescriptorRenderOptions',
    'refs?:',
    'createRmtDomDescriptorRenderer'
  ], 'DOM Descriptor renderer primitive types');
  assertTextIncludesAll(context, docs, [
    '# RMT Component Template Primitives',
    RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
    'component',
    'style-token',
    'x-tooltip',
    'x-select',
    NEXT_WORKPACKAGE
  ], 'Component template primitive docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE,
    RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
    RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-06 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-06` | P0 | completed'), 'Backlog marks WP-E18-06 completed');
  context.assert(
    backlog.includes('| `WP-E18-07` | P0 | ready') || backlog.includes('| `WP-E18-07` | P0 | completed'),
    'Backlog marks WP-E18-07 ready or completed after component primitives'
  );
  context.assert(epic.includes('| `WP-E18-06` | P0 | completed'), 'Epic marks WP-E18-06 completed');
  context.assert(epic.includes('rmt-component-template-primitives'), 'Epic gate chain includes component primitive gate');
  context.assert(runner.includes("require('../tests/rmt/rmt_component_template_primitives_suite')"), 'Runner imports component primitive suite');
  context.assert(runner.includes("id: 'rmt-component-template-primitives'"), 'Runner registers component primitive suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-component-template-primitives'] === 'node scripts/run_xtend_tests.js rmt-component-template-primitives', 'Package exposes component primitive script');
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtComponentTemplatePrimitives;
  context.assert(metadata && metadata.schema === RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA, 'Package metadata exposes component primitive schema');
  context.assert(metadata && metadata.localGate === RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE, 'Package metadata exposes component primitive local gate');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-07 handoff');

  return context.result({
    schema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA,
    fixture: RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE,
    primitiveCount: REQUIRED_TEMPLATE_PRIMITIVES.length,
    familyCount: REQUIRED_COMPONENT_FAMILIES.length,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtComponentTemplatePrimitivesReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT Component Template Primitives erfolgreich.',
    failureTitle: 'Epic 18 RMT Component Template Primitives fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtComponentTemplatePrimitivesSuite()
    .then((result) => {
      printRmtComponentTemplatePrimitivesReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtComponentTemplatePrimitivesReport,
  runRmtComponentTemplatePrimitivesSuite
};
