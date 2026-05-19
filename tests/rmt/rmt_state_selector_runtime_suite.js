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
  REQUIRED_DOCS,
  REQUIRED_STATE_CAPABILITIES,
  REQUIRED_STATE_TYPES,
  RMT_STATE_SELECTOR_RUNTIME_DOCS,
  RMT_STATE_SELECTOR_RUNTIME_FIXTURE,
  RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE,
  RMT_STATE_SELECTOR_RUNTIME_MODULE,
  RMT_STATE_SELECTOR_RUNTIME_PACKAGE_SCRIPT,
  RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_RUNTIME,
  RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_STATUS,
  RMT_STATE_SELECTOR_RUNTIME_SUITE,
  RMT_STATE_SELECTOR_RUNTIME_TARGET,
  RMT_STATE_SELECTOR_RUNTIME_TYPES,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC,
  createRmtStateSelectorRuntimePlan,
  createRmtStateSelectorRuntimeReport,
  validateRmtStateSelectorRuntimePlan
} = require('../../catalog/epic18-rmt-state-selector-runtime');
const {
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA
} = require('../../catalog/epic18-rmt-component-template-primitives');

let stateRuntimeModulePromise = null;
let rendererModulePromise = null;

function loadStateRuntimeModule(rootDir) {
  if (!stateRuntimeModulePromise) {
    stateRuntimeModulePromise = import(`file://${resolveRepoPath(RMT_STATE_SELECTOR_RUNTIME_RUNTIME, rootDir)}`);
  }
  return stateRuntimeModulePromise;
}

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
      const attributeSelector = String(selector || '').match(/^\[([^=\]]+)="([^"]*)"\]$/u);
      if (attributeSelector) {
        const [, name, value] = attributeSelector;
        return findNode(this, (node) => node.getAttribute && node.getAttribute(name) === value);
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

function createFakeXState() {
  const store = {};
  const writes = [];
  return {
    store,
    writes,
    set(key, value) {
      store[key] = value;
      writes.push({ key, value });
    },
    get(key) {
      return store[key];
    },
    subscribe() {
      return () => undefined;
    }
  };
}

function assertFixtureGraph(context, fixture) {
  const state = indexById(fixture.state);
  const selectors = indexById(fixture.selectors);
  const derived = indexById(fixture.derive);
  const reducers = indexById(fixture.reducers);
  const components = indexById(fixture.components);
  const templates = indexById(fixture.templates);
  REQUIRED_STATE_TYPES.forEach((type) => {
    context.assert((fixture.state || []).some((entry) => entry.type === type), `fixture covers state type ${type}`);
  });
  (fixture.selectors || []).forEach((selector) => {
    context.assert(state.has(selector.from) || selectors.has(selector.from), `${selector.id}: source resolves`);
  });
  (fixture.derive || []).forEach((entry) => {
    context.assert(state.has(entry.from) || selectors.has(entry.from) || derived.has(entry.from), `${entry.id}: source resolves`);
  });
  (fixture.reducers || []).forEach((reducer) => {
    context.assert(state.has(reducer.state), `${reducer.id}: reducer state resolves`);
    context.assert(reducer.command && reducer.command.startsWith('command.'), `${reducer.id}: reducer command is declarative`);
  });
  (fixture.bindings || []).forEach((binding) => {
    context.assert(selectors.has(binding.source) || state.has(binding.source) || derived.has(binding.source), `${binding.id}: binding source resolves`);
  });
  (fixture.templates || []).forEach((template) => {
    context.assert(template.renderMode === 'dom_descriptor', `${template.id}: typed state template stays dom_descriptor`);
    const serialized = JSON.stringify(template.root);
    context.assert(
      serialized.includes('$selector.') || serialized.includes('$derive.') || ['template.shell', 'template.item-row', 'template.empty'].includes(template.id),
      `${template.id}: template consumes state runtime context or is a structural child template`
    );
  });
  ['component.shell', 'component.item-row', 'component.detail-panel', 'component.empty-state'].forEach((id) => {
    context.assert(components.has(id), `fixture component resolves ${id}`);
  });
  ['template.shell', 'template.collection', 'template.item-row', 'template.detail'].forEach((id) => {
    context.assert(templates.has(id), `fixture template resolves ${id}`);
  });
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'state selector fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'state selector fixture contains no manual HTML sinks');
}

function runRuntimeAssertions(context, fixture, stateRuntimeModule, rendererModule) {
  const xstate = createFakeXState();
  const runtime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: fixture.state,
    selectors: fixture.selectors,
    derive: fixture.derive,
    reducers: fixture.reducers,
    xstate
  });
  context.assert(runtime.schema === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'state selector runtime exposes schema');
  context.assert(runtime.select('selector.filtered-items').length === 3, 'selector returns initial collection');
  context.assert(runtime.select('selector.has-items') === true, 'selector computes has-items');
  context.assert(runtime.getDerivedValues()['derive.detail-label'] === 'Alpha', 'derived detail label resolves selected item');
  context.assert(xstate.store['state.items'].length === 3, 'xstate bridge mirrors initial state');
  context.assert(xstate.store['selector.selected-item'].id === 'alpha', 'xstate bridge mirrors selector values');

  const documentTarget = createFakeDocument();
  const renderer = rendererModule.createRmtDomDescriptorRenderer({ documentTarget });
  const root = documentTarget.createElement('main');
  const templates = indexById(fixture.templates);
  const renderResult = renderer.render(root, templates.get('template.shell').root, {
    ...runtime.createRenderContext({
      components: fixture.components,
      templates: fixture.templates
    }),
    source: {
      documentId: fixture.manifest.id,
      templateId: 'template.shell',
      pointer: '/templates/0/root'
    }
  });
  context.assert(renderResult.nodeCount === 1, 'typed state shell renders one root node');
  context.assert(textContent(root).includes('Alpha'), 'renderer consumes selector values for repeat rows');
  context.assert(textContent(root).includes('Gamma'), 'renderer renders complete selector collection');
  const alpha = root.querySelector('[data-rmt-key="alpha"]');
  const beta = root.querySelector('[data-rmt-key="beta"]');
  const gamma = root.querySelector('[data-rmt-key="gamma"]');
  context.assert(alpha && beta && gamma, 'keyed rows render from selector context');

  const initialBinding = stateRuntimeModule.applyRmtStateBindings(root, fixture.bindings, runtime);
  context.assert(initialBinding.replacedRoot === false, 'state bindings do not replace root');
  context.assert(alpha.getAttribute('aria-selected') === 'true', 'initial binding marks selected row');
  context.assert(alpha.getAttribute('class').includes('is-selected'), 'initial binding maps selected class');
  context.assert(beta.getAttribute('aria-selected') === 'false', 'initial binding marks unselected row false');
  const alphaBefore = alpha;
  const betaBefore = beta;
  const collectionBefore = alpha.parentNode;
  const events = [];
  const unsubscribe = runtime.subscribe((event) => events.push(event));
  const selectionEvent = runtime.dispatch('command.select-item', {
    id: 'beta',
    ids: ['beta']
  });
  unsubscribe();
  context.assert(selectionEvent.patchPlan.strategy === 'attribute-sync', 'selection reducer plans attribute sync');
  context.assert(selectionEvent.patchPlan.preserveDom === true, 'selection reducer preserves DOM');
  context.assert(selectionEvent.patchPlan.changedStates.includes('state.selection'), 'selection reducer reports changed state');
  context.assert(events.length === 1 && events[0].patchPlan.preserveDom === true, 'runtime subscription receives preserve patch plan');
  context.assert(runtime.select('selector.active-id') === 'beta', 'selector active id follows reducer');
  context.assert(runtime.getDerivedValues()['derive.detail-label'] === 'Beta', 'derived label follows reducer');
  context.assert(xstate.store['state.selection'].activeId === 'beta', 'xstate bridge mirrors reducer state');
  context.assert(xstate.store['selector.selected-item'].id === 'beta', 'xstate bridge mirrors updated selected item');
  const updateBinding = stateRuntimeModule.applyRmtStateBindings(root, fixture.bindings, runtime);
  context.assert(updateBinding.operationCount >= 6, 'state bindings update row attributes and classes');
  context.assert(root.querySelector('[data-rmt-key="alpha"]') === alphaBefore, 'selection update preserves alpha DOM node');
  context.assert(root.querySelector('[data-rmt-key="beta"]') === betaBefore, 'selection update preserves beta DOM node');
  context.assert(alphaBefore.parentNode === collectionBefore, 'selection update preserves list parent');
  context.assert(betaBefore.getAttribute('aria-selected') === 'true', 'selection update marks beta selected');
  context.assert(betaBefore.getAttribute('class').includes('is-selected'), 'selection update maps beta selected class');
  context.assert(alphaBefore.getAttribute('aria-selected') === 'false', 'selection update marks alpha unselected');

  const filterEvent = runtime.dispatch('command.set-filter', {
    query: 'ga'
  });
  context.assert(filterEvent.patchPlan.strategy === 'rerender', 'filter reducer plans structural rerender');
  context.assert(filterEvent.patchPlan.preserveDom === false, 'filter reducer may replace structure');
  context.assert(filterEvent.patchPlan.structuralSelectors.includes('selector.filtered-items'), 'filter reducer reports structural selector');
  context.assert(runtime.select('selector.filtered-items').length === 1, 'filter selector narrows collection');
  const filteredRoot = documentTarget.createElement('main');
  renderer.render(filteredRoot, templates.get('template.collection').root, {
    ...runtime.createRenderContext({
      components: fixture.components,
      templates: fixture.templates
    })
  });
  context.assert(textContent(filteredRoot).includes('Gamma'), 'structural rerender renders filtered item');
  context.assert(!textContent(filteredRoot).includes('Alpha'), 'structural rerender removes filtered-out item');

  const adapter = stateRuntimeModule.createRmtStateBindingAdapter();
  context.assert(adapter.apply(root, fixture.bindings, runtime).strategy === 'attribute-sync', 'state binding adapter applies attribute sync');
  context.assert(stateRuntimeModule.planRmtStatePatch(selectionEvent.previous, selectionEvent.next, {
    selectors: fixture.selectors,
    derived: fixture.derive,
    preserveStates: ['state.selection']
  }).preserveDom === true, 'standalone patch planner preserves selection DOM');
  context.assert(runtime.createRenderContext().selectorValues['selector.active-id'] === 'beta', 'render context exposes selector values');
  context.assert(runtime.getRenderModel()['selector.active-id'] === 'beta', 'render model exposes flat selector id');
  context.assert(runtime.getRenderModel().selection.activeId === 'beta', 'render model exposes state alias');
  let typeErrorThrown = false;
  try {
    runtime.setState('state.items', { invalid: true });
  } catch (_) {
    typeErrorThrown = true;
  }
  context.assert(typeErrorThrown, 'typed state rejects invalid collection value');
}

async function runRmtStateSelectorRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-state-selector-runtime',
    label: 'Epic 18 RMT typed state selector runtime'
  });
  const plan = createRmtStateSelectorRuntimePlan({ rootDir });
  const validation = validateRmtStateSelectorRuntimePlan(plan);
  const report = createRmtStateSelectorRuntimeReport({ rootDir, plan });
  const fixture = readJson(RMT_STATE_SELECTOR_RUNTIME_FIXTURE, rootDir);
  const docs = readText(RMT_STATE_SELECTOR_RUNTIME_DOCS, rootDir);
  const workpackageDoc = readText(RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('docs/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runtimeSource = readText(RMT_STATE_SELECTOR_RUNTIME_RUNTIME, rootDir);
  const typeSource = readText(RMT_STATE_SELECTOR_RUNTIME_TYPES, rootDir);
  const domRendererSource = readText('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir);
  const stateRuntimeModule = await loadStateRuntimeModule(rootDir);
  const rendererModule = await loadRendererModule(rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_STATE_SELECTOR_RUNTIME_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_STATE_SELECTOR_RUNTIME_SUITE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_STATE_SELECTOR_RUNTIME_RUNTIME, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-07 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-07 doc`);
  });

  context.assert(moduleSyntax.ok, `State selector runtime contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `State selector runtime suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `State selector runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(plan.schema === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'State selector runtime schema is stable');
  context.assert(plan.reportSchema === RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA, 'State selector runtime report schema is stable');
  context.assert(plan.fixtureSchema === RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA, 'State selector runtime fixture schema is stable');
  context.assert(plan.componentPrimitiveSchema === RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA, 'State selector runtime builds on component primitives');
  context.assert(plan.workpackage === RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE, 'State selector runtime belongs to WP-E18-07');
  context.assert(plan.status === RMT_STATE_SELECTOR_RUNTIME_STATUS, 'State selector runtime status is accepted');
  context.assert(plan.targetReadiness === RMT_STATE_SELECTOR_RUNTIME_TARGET, 'State selector runtime target is ready');
  context.assert(plan.localGate === RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE, 'State selector runtime local gate is stable');
  context.assert(plan.packageScript === RMT_STATE_SELECTOR_RUNTIME_PACKAGE_SCRIPT, 'State selector runtime package script is stable');
  context.assert(validation.ok === true, 'State selector runtime plan validates');
  context.assert(report.ok === true, 'State selector runtime report validates');
  context.assert(report.xstateImportedByRuntime === false, 'State selector runtime reports no xstate import');
  context.assert(report.selectionUpdatesPreserveDom === true, 'State selector runtime reports selection DOM preserve');
  assertIncludesAll(context, plan.stateCapabilities, REQUIRED_STATE_CAPABILITIES, 'required state capabilities');
  assertIncludesAll(context, plan.stateTypes, REQUIRED_STATE_TYPES, 'required state types');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'required state boundaries');

  context.assert(fixture.kind === 'rmt_document', 'State selector fixture is an RMT document');
  context.assert(fixture.schema === RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA, 'State selector fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'State selector fixture declares contract');
  context.assert(fixture.manifest.metadata.componentPrimitiveContract === RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA, 'State selector fixture declares component primitive contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE, 'State selector fixture is owned by WP-E18-07');
  context.assert(fixture.manifest.metadata.xstateBridgeMode === 'injected-host-adapter', 'State selector fixture keeps xstate injected');
  context.assert(fixture.acceptance.selectionUpdatesPreserveDom === true, 'State selector acceptance preserves DOM for selection');
  context.assert(fixture.acceptance.filterUpdatesMayRerenderStructure === true, 'State selector acceptance allows structural filter rerender');
  assertFixtureGraph(context, fixture);
  runRuntimeAssertions(context, fixture, stateRuntimeModule, rendererModule);

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtStateSelectorRuntime',
    'createRmtXStateBridge',
    'planRmtStatePatch',
    'applyRmtStateBindings',
    'preserveDom',
    'attribute-sync'
  ], 'State selector runtime source');
  context.assert(!/from\s+['"]xstate['"]|require\(['"]xstate['"]\)/u.test(runtimeSource), 'State selector runtime does not import xstate');
  context.assert(!/components\/|xtend-loader|api\.js/u.test(runtimeSource), 'State selector runtime avoids XTend UI imports');
  assertTextIncludesAll(context, domRendererSource, [
    '$selector.',
    'context.selectorValues',
    '$derive.'
  ], 'DOM Descriptor renderer selector context support');
  assertTextIncludesAll(context, typeSource, [
    'RmtStateSelectorRuntime',
    'RmtStateDefinition',
    'RmtSelectorDefinition',
    'RmtXStateBridge',
    'createRmtStateSelectorRuntime'
  ], 'State selector runtime types');
  assertTextIncludesAll(context, docs, [
    '# RMT State Selector Runtime',
    RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    'xstateBridge',
    'preservePatchPlan',
    NEXT_WORKPACKAGE
  ], 'State selector runtime docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE,
    RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-07 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-07` | P0 | completed'), 'Backlog marks WP-E18-07 completed');
  context.assert(
    backlog.includes('| `WP-E18-08` | P1 | ready') || backlog.includes('| `WP-E18-08` | P1 | completed'),
    'Backlog marks WP-E18-08 ready or completed after state runtime'
  );
  context.assert(epic.includes('| `WP-E18-07` | P0 | completed'), 'Epic marks WP-E18-07 completed');
  context.assert(epic.includes('rmt-state-selector-runtime'), 'Epic gate chain includes state selector runtime gate');
  context.assert(runner.includes("require('../tests/rmt/rmt_state_selector_runtime_suite')"), 'Runner imports state selector runtime suite');
  context.assert(runner.includes("id: 'rmt-state-selector-runtime'"), 'Runner registers state selector runtime suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-state-selector-runtime'] === 'node scripts/run_xtend_tests.js rmt-state-selector-runtime', 'Package exposes state selector runtime script');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/state-selector-runtime'], 'Package exports state selector runtime');
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtStateSelectorRuntime;
  context.assert(metadata && metadata.schema === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'Package metadata exposes state selector runtime schema');
  context.assert(metadata && metadata.localGate === RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE, 'Package metadata exposes state selector runtime local gate');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-08 handoff');

  return context.result({
    schema: RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA,
    fixture: RMT_STATE_SELECTOR_RUNTIME_FIXTURE,
    stateCapabilityCount: REQUIRED_STATE_CAPABILITIES.length,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtStateSelectorRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT State Selector Runtime erfolgreich.',
    failureTitle: 'Epic 18 RMT State Selector Runtime fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtStateSelectorRuntimeSuite()
    .then((result) => {
      printRmtStateSelectorRuntimeReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtStateSelectorRuntimeReport,
  runRmtStateSelectorRuntimeSuite
};
