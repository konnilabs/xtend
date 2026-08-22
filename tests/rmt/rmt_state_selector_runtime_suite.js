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
let stateBindingProjectorModulePromise = null;
let stateHostAdapterModulePromise = null;

function loadStateRuntimeModule(rootDir) {
  if (!stateRuntimeModulePromise) {
    stateRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-state-selector-runtime.compat.js', rootDir)}`);
  }
  return stateRuntimeModulePromise;
}

function loadRendererModule(rootDir) {
  if (!rendererModulePromise) {
    rendererModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir)}`);
  }
  return rendererModulePromise;
}

function loadStateBindingProjectorModule(rootDir) {
  if (!stateBindingProjectorModulePromise) {
    stateBindingProjectorModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-state-binding-view-projector.js', rootDir)}`);
  }
  return stateBindingProjectorModulePromise;
}

function loadStateHostAdapterModule(rootDir) {
  if (!stateHostAdapterModulePromise) {
    stateHostAdapterModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-state-host-adapter.js', rootDir)}`);
  }
  return stateHostAdapterModulePromise;
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

function createFakeStateHost() {
  const store = {};
  const writes = [];
  const batchUpdates = [];
  const listeners = new Set();
  return {
    store,
    writes,
    batchUpdates,
    set(key, value) {
      store[key] = value;
      writes.push({ key, value });
    },
    batchUpdate(updates) {
      const update = JSON.parse(JSON.stringify(updates));
      Object.assign(store, update);
      batchUpdates.push(update);
      listeners.forEach((listener) => listener('batch-update', update, JSON.parse(JSON.stringify(store))));
    },
    get(key) {
      return store[key];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
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

function runRuntimeAssertions(context, fixture, stateRuntimeModule, rendererModule, stateBindingProjectorModule, stateHostAdapterModule) {
  const stateHost = createFakeStateHost();
  const runtime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: fixture.state,
    selectors: fixture.selectors,
    derive: fixture.derive,
    reducers: fixture.reducers,
    stateProjectionTarget: stateHost
  });
  context.assert(runtime.schema === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'state selector runtime exposes schema');
  context.assert(runtime.select('selector.filtered-items').length === 3, 'selector returns initial collection');
  context.assert(runtime.select('selector.has-items') === true, 'selector computes has-items');
  context.assert(runtime.getDerivedValues()['derive.detail-label'] === 'Alpha', 'derived detail label resolves selected item');
  context.assert(stateHost.store['state.items'].length === 3, 'state projection mirrors initial state');
  context.assert(stateHost.store['selector.selected-item'].id === 'alpha', 'state projection mirrors selector values');
  context.assert(stateHost.batchUpdates.length === 1 && stateHost.writes.length === 0, 'state projection initializes through one atomic batch');

  const documentTarget = createFakeDocument();
  const componentRegistry = {
    resolveComponentCapability(tag) {
      const normalized = String(tag || '').toLowerCase();
      if (!normalized.includes('-')) return null;
      return {
        tag: normalized,
        propertyNames: normalized === 'x-card' ? ['value'] : []
      };
    }
  };
  const renderer = rendererModule.createRmtDomDescriptorRenderer({
    documentTarget,
    componentRegistry
  });
  const root = documentTarget.createElement('main');
  const bindingProjector = stateBindingProjectorModule.createRmtStateBindingViewProjector({
    domRenderer: renderer,
    componentRegistry
  });
  const templates = indexById(fixture.templates);
  const renderResult = renderer.render(root, templates.get('template.shell').root, {
    ...runtime.createRenderContext({
      components: fixture.components,
      templates: fixture.templates
    }),
    componentRegistry,
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

  const initialBinding = bindingProjector.project(root, fixture.bindings, runtime.model.snapshot());
  context.assert(initialBinding.replacedRoot === false, 'state bindings do not replace root');
  context.assert(alpha.getAttribute('aria-selected') === 'true', 'initial binding marks selected row');
  context.assert(alpha.getAttribute('class').includes('is-selected'), 'initial binding maps selected class');
  context.assert(beta.getAttribute('aria-selected') === 'false', 'initial binding marks unselected row false');
  const alphaBefore = alpha;
  const betaBefore = beta;
  const collectionBefore = alpha.parentNode;
  const events = [];
  const unsubscribe = runtime.subscribe((event) => events.push(event));
  const selectionBatchCount = stateHost.batchUpdates.length;
  const selectionEvent = runtime.dispatch('command.select-item', {
    id: 'beta',
    ids: ['beta']
  });
  unsubscribe();
  context.assert(selectionEvent.patchPlan.strategy === 'attribute-sync', 'selection reducer plans attribute sync');
  context.assert(selectionEvent.patchPlan.preserveDom === true, 'selection reducer preserves DOM');
  context.assert(selectionEvent.patchPlan.changedStates.includes('state.selection'), 'selection reducer reports changed state');
  context.assert(events.length === 1 && events[0].patchPlan.preserveDom === true, 'runtime subscription receives preserve patch plan');
  context.assert(stateHost.batchUpdates.length === selectionBatchCount + 1, 'single reducer publishes one final stateHost batch');
  context.assert(runtime.select('selector.active-id') === 'beta', 'selector active id follows reducer');
  context.assert(runtime.getDerivedValues()['derive.detail-label'] === 'Beta', 'derived label follows reducer');
  context.assert(stateHost.store['state.selection'].activeId === 'beta', 'stateHost bridge mirrors reducer state');
  context.assert(stateHost.store['selector.selected-item'].id === 'beta', 'stateHost bridge mirrors updated selected item');
  const updateBinding = bindingProjector.project(root, fixture.bindings, runtime.model.snapshot());
  context.assert(updateBinding.operationCount >= 6, 'state bindings update row attributes and classes');
  context.assert(root.querySelector('[data-rmt-key="alpha"]') === alphaBefore, 'selection update preserves alpha DOM node');
  context.assert(root.querySelector('[data-rmt-key="beta"]') === betaBefore, 'selection update preserves beta DOM node');
  context.assert(alphaBefore.parentNode === collectionBefore, 'selection update preserves list parent');
  context.assert(betaBefore.getAttribute('aria-selected') === 'true', 'selection update marks beta selected');
  context.assert(betaBefore.getAttribute('class').includes('is-selected'), 'selection update maps beta selected class');
  context.assert(alphaBefore.getAttribute('aria-selected') === 'false', 'selection update marks alpha unselected');
  const unsafeBinding = bindingProjector.project(root, [{
    id: 'binding.unsafe-sinks',
    source: '$selectors.selector.filtered-items',
    key: 'id',
    attributes: {
      onclick: 'alert(1)',
      href: 'javascript:alert(2)'
    },
    properties: {
      innerHTML: '<img src=x onerror=alert(3)>'
    }
  }], runtime.model.snapshot());
  context.assert(betaBefore.getAttribute('onclick') === null, 'state bindings reject event-handler attributes');
  context.assert(betaBefore.getAttribute('href') === null, 'state bindings reject unsafe javascript URLs');
  context.assert(typeof betaBefore.innerHTML === 'undefined', 'state bindings reject HTML sink properties');
  context.assert(unsafeBinding.operations.every((operation) => operation.skipped === true), 'state bindings report unsafe sinks as skipped operations');
  const selectorAttackSnapshot = Object.freeze({
    states: Object.freeze({}),
    selectors: Object.freeze({
      'selector.attack': Object.freeze([Object.freeze({ id: 'beta"] [data-rmt-key="alpha' })])
    }),
    derived: Object.freeze({})
  });
  const selectorAttack = bindingProjector.project(root, [{
    id: 'binding.selector-attack',
    source: 'selector.attack',
    key: 'id',
    target: { attribute: 'data-rmt-key' },
    attributes: { 'data-selector-attack': true }
  }], selectorAttackSnapshot);
  context.assert(
    selectorAttack.operationCount === 0
      && alphaBefore.getAttribute('data-selector-attack') === null
      && betaBefore.getAttribute('data-selector-attack') === null,
    'state binding escapes untrusted collection keys instead of widening the target selector'
  );
  const invalidTarget = bindingProjector.project(root, [{
    id: 'binding.invalid-target',
    source: 'selector.attack',
    target: { attribute: 'data-rmt-key][onclick' },
    attributes: { title: 'blocked' }
  }], selectorAttackSnapshot);
  context.assert(
    invalidTarget.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.state-binding.target-attribute-invalid'),
    'state binding rejects unsafe target attribute names before querying the DOM'
  );

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

  let mutableSnapshotRejected = false;
  try {
    bindingProjector.project(root, fixture.bindings, runtime.snapshot());
  } catch (error) {
    mutableSnapshotRejected = error && error.code === 'rmt.state-binding.snapshot-mutable';
  }
  context.assert(mutableSnapshotRejected, 'state binding View projector rejects mutable model snapshots');

  const legacyDiagnostics = [];
  const legacyApplication = stateRuntimeModule.applyRmtStateBindings(root, fixture.bindings, runtime, {
    domRenderer: renderer,
    publishDiagnostic: (diagnostic) => legacyDiagnostics.push(diagnostic)
  });
  context.assert(legacyApplication.projectorSchema === stateBindingProjectorModule.RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA, 'legacy binding function delegates to the canonical View projector');
  context.assert(legacyApplication.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.state-binding.legacy-adapter'), 'legacy binding function returns its one-time compatibility diagnostic');
  const adapter = stateRuntimeModule.createRmtStateBindingAdapter({
    domRenderer: renderer,
    publishDiagnostic: (diagnostic) => legacyDiagnostics.push(diagnostic)
  });
  context.assert(adapter.apply(root, fixture.bindings, runtime).strategy === 'attribute-sync', 'state binding adapter applies attribute sync');
  context.assert(
    legacyDiagnostics.filter((diagnostic) => diagnostic.code === 'rmt.state-binding.legacy-adapter').length === 1,
    'legacy state binding APIs diagnose exactly once per model runtime'
  );
  const firstAdapterDispose = adapter.dispose();
  const secondAdapterDispose = adapter.dispose();
  context.assert(
    firstAdapterDispose.alreadyDisposed === false && secondAdapterDispose.alreadyDisposed === true,
    'state binding adapter compatibility renderer lifecycle is idempotently disposable'
  );
  context.assert(stateRuntimeModule.planRmtStatePatch(selectionEvent.previous, selectionEvent.next, {
    selectors: fixture.selectors,
    derived: fixture.derive,
    preserveStates: ['state.selection']
  }).preserveDom === true, 'standalone patch planner preserves selection DOM');
  context.assert(runtime.createRenderContext().selectorValues['selector.active-id'] === 'beta', 'render context exposes selector values');
  context.assert(runtime.getRenderModel()['selector.active-id'] === 'beta', 'render model exposes flat selector id');
  context.assert(runtime.getRenderModel().selection.activeId === 'beta', 'render model exposes state alias');
  bindingProjector.dispose();

  const transactionEvents = [];
  const unsubscribeTransaction = runtime.subscribe((event) => transactionEvents.push(event));
  const transactionHostEvents = [];
  const unsubscribeTransactionHost = stateHost.subscribe((key, value) => transactionHostEvents.push({ key, value }));
  const transactionBatchCount = stateHost.batchUpdates.length;
  let nestedTransactionResult = null;
  const transactionResult = runtime.transaction((transactionRuntime) => {
    const firstMutation = transactionRuntime.dispatch('command.select-item', {
      id: 'alpha',
      ids: ['alpha']
    });
    nestedTransactionResult = transactionRuntime.transaction(() => {
      transactionRuntime.dispatch('command.set-filter', {
        query: 'al'
      });
    }, { phase: 'nested' });
    context.assert(transactionEvents.length === 0, 'state transaction delays subscriber notification until the outer commit');
    context.assert(
      stateHost.batchUpdates.length === transactionBatchCount
        && stateHost.store['state.selection'].activeId === 'beta'
        && stateHost.store['state.filters'].query === 'ga',
      'state transaction exposes no intermediate state through stateHost'
    );
    context.assert(firstMutation.pending === true && nestedTransactionResult.pending === true, 'state transaction exposes pending mutation handles while nested');
  }, { actionId: 'action.batch-state' });
  unsubscribeTransaction();
  unsubscribeTransactionHost();
  context.assert(transactionEvents.length === 1, 'nested state transaction emits one subscriber event');
  context.assert(
    stateHost.batchUpdates.length === transactionBatchCount + 1
      && transactionHostEvents.length === 1
      && transactionHostEvents[0].key === 'batch-update',
    'nested state transaction mirrors one final stateHost batch and one host notification'
  );
  context.assert(transactionResult.pending === false && nestedTransactionResult.pending === false, 'state transaction finalizes outer and nested handles together');
  context.assert(transactionResult.patchPlan === nestedTransactionResult.patchPlan, 'nested state transaction shares one common patch plan');
  context.assert(transactionResult.patchPlan.changedStates.includes('state.selection'), 'transaction patch plan includes selection state changes');
  context.assert(transactionResult.patchPlan.changedStates.includes('state.filters'), 'transaction patch plan includes filter state changes');
  context.assert(transactionResult.patchPlan.changedSelectors.includes('selector.filtered-items'), 'transaction patch plan includes selector changes');
  context.assert(transactionResult.patchPlan.changedDerived.includes('derive.detail-label'), 'transaction patch plan includes derived changes');
  context.assert(transactionResult.metadata.operation === 'transaction' && transactionResult.metadata.mutationCount === 2, 'transaction event exposes common transaction metadata');
  context.assert(transactionResult.previous.states['state.selection'].activeId === 'beta', 'transaction snapshots state once before all reducers');
  context.assert(transactionResult.next.states['state.selection'].activeId === 'alpha', 'transaction snapshots state once after all reducers');

  const modelReader = runtime.modelReader;
  context.assert(modelReader === runtime.model, 'state runtime exposes one canonical read-only model port');
  context.assert(
    Object.keys(modelReader).sort().join(',') === 'getDerivedValues,getSelectorValues,getState,schema,select,snapshot,subscribe',
    'model reader exposes no mutation or view adapter methods'
  );
  const readOnlySelection = modelReader.getState('state.selection');
  context.assert(Object.isFrozen(readOnlySelection) && Object.isFrozen(readOnlySelection.ids), 'model reader deeply freezes cloned state values');
  readOnlySelection.activeId = 'tampered';
  context.assert(modelReader.getState('state.selection').activeId === 'alpha', 'model reader values cannot mutate canonical state');
  const readOnlySnapshot = modelReader.snapshot();
  context.assert(
    Object.isFrozen(readOnlySnapshot)
      && Object.isFrozen(readOnlySnapshot.states)
      && Object.isFrozen(readOnlySnapshot.states['state.selection']),
    'model reader returns a deeply frozen snapshot'
  );

  const modelReaderEvents = [];
  const unsubscribeModelReader = modelReader.subscribe((event) => modelReaderEvents.push(event));
  const modelCommandBatchCount = stateHost.batchUpdates.length;
  const modelCommandResult = runtime.modelCommandPort.apply([
    {
      operation: 'dispatch',
      command: 'command.select-item',
      payload: { id: 'beta', ids: ['beta'] }
    },
    {
      operation: 'patch',
      state: 'state.filters',
      patch: { query: 'ga' }
    }
  ], { actionId: 'action.model-command-port' });
  unsubscribeModelReader();
  context.assert(modelReaderEvents.length === 1 && Object.isFrozen(modelReaderEvents[0]), 'model reader observes one immutable final command event');
  context.assert(stateHost.batchUpdates.length === modelCommandBatchCount + 1, 'model command port mirrors one stateHost batch for all operations');
  context.assert(
    modelCommandResult.metadata.port === 'model-command'
      && modelCommandResult.metadata.operationCount === 2
      && modelCommandResult.metadata.mutationCount === 2,
    'model command port reports one atomic operation group'
  );

  const beforeRejectedCommand = modelReader.snapshot();
  const rejectedCommandBatchCount = stateHost.batchUpdates.length;
  let rejectedCommand = false;
  try {
    runtime.modelCommandPort.apply([
      {
        operation: 'patch',
        state: 'state.filters',
        patch: { query: 'must-not-commit' }
      },
      {
        operation: 'set',
        state: 'state.items',
        value: { invalid: true }
      }
    ]);
  } catch (_) {
    rejectedCommand = true;
  }
  context.assert(
    rejectedCommand
      && JSON.stringify(modelReader.snapshot()) === JSON.stringify(beforeRejectedCommand)
      && stateHost.batchUpdates.length === rejectedCommandBatchCount,
    'model command port validates every request before its first mutation'
  );

  const beforeRollback = modelReader.snapshot();
  const rollbackEvents = [];
  const unsubscribeRollback = modelReader.subscribe((event) => rollbackEvents.push(event));
  const rollbackBatchCount = stateHost.batchUpdates.length;
  let transactionRolledBack = false;
  try {
    runtime.transaction((transactionRuntime) => {
      transactionRuntime.patchState('state.filters', { query: 'rollback-me' });
      throw new Error('expected transaction failure');
    }, { actionId: 'action.rollback' });
  } catch (_) {
    transactionRolledBack = true;
  }
  unsubscribeRollback();
  context.assert(
    transactionRolledBack
      && JSON.stringify(modelReader.snapshot()) === JSON.stringify(beforeRollback)
      && rollbackEvents.length === 0
      && stateHost.batchUpdates.length === rollbackBatchCount,
    'failed state transaction rolls back without subscriber or stateHost publication'
  );

  const beforeNestedRollback = modelReader.snapshot();
  const nestedRollbackBatchCount = stateHost.batchUpdates.length;
  let nestedFailureClosed = false;
  try {
    runtime.transaction((transactionRuntime) => {
      try {
        transactionRuntime.transaction((nestedRuntime) => {
          nestedRuntime.patchState('state.filters', { query: 'nested-rollback' });
          throw new Error('expected nested transaction failure');
        });
      } catch (_) {
        // Catching inside the application callback must not turn a failed nested scope into a commit.
      }
    });
  } catch (_) {
    nestedFailureClosed = true;
  }
  context.assert(
    nestedFailureClosed
      && JSON.stringify(modelReader.snapshot()) === JSON.stringify(beforeNestedRollback)
      && stateHost.batchUpdates.length === nestedRollbackBatchCount,
    'caught nested transaction failures still abort the complete outer transaction'
  );

  const customKeyHost = createFakeStateHost();
  stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [{
      id: 'state.internal-name',
      projectionKey: 'host.projected-name',
      type: 'string',
      initial: 'projected'
    }],
    stateProjectionTarget: customKeyHost
  });
  context.assert(
    customKeyHost.batchUpdates.length === 1
      && customKeyHost.store['host.projected-name'] === 'projected'
      && !Object.prototype.hasOwnProperty.call(customKeyHost.store, 'state.internal-name'),
    'atomic state projection preserves declared host keys'
  );
  const emptyHost = createFakeStateHost();
  const emptyRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({ stateProjectionTarget: emptyHost });
  emptyRuntime.transaction(() => undefined, { actionId: 'action.empty-commit' });
  context.assert(emptyHost.batchUpdates.length === 2, 'even an empty completed transaction emits exactly one state projection batch boundary');

  const removedOptionName = ['x', 'state'].join('');
  const ignoredAliasTarget = createFakeStateHost();
  const ignoredAliasRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [{ id: 'state.alias-ignored', type: 'boolean', initial: true }],
    [removedOptionName]: ignoredAliasTarget
  });
  context.assert(
    ignoredAliasTarget.batchUpdates.length === 0
      && ignoredAliasRuntime.getState('state.alias-ignored') === true,
    'removed state option has no adapter effect'
  );
  const directHost = createFakeStateHost();
  const directAdapter = stateHostAdapterModule.createRmtStateHostAdapter({
    target: directHost,
    strictMaraca: true
  });
  directAdapter.batchUpdate({ 'host.direct': 7 }, { actionId: 'adapter-direct' });
  context.assert(
    directAdapter.adapterSchema === 'xtend.rmt.state-host-adapter.v1'
      && directAdapter.portSchema === 'xtend.rmt.state-projection-port.v1'
      && directHost.store['host.direct'] === 7,
    'State host adapter exposes the typed projection port and performs atomic host batches'
  );
  const injectedHost = createFakeStateHost();
  const injectedPort = stateHostAdapterModule.createRmtStateHostAdapter({ target: injectedHost, strictMaraca: true });
  const portInjectedRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [{ id: 'state.port-injected', type: 'number', initial: 3 }],
    stateProjectionPort: injectedPort,
    strictMaraca: true
  });
  context.assert(
    portInjectedRuntime.stateProjectionPort === injectedPort
      && injectedHost.store['state.port-injected'] === 3,
    'Model accepts the state host adapter only through the typed stateProjectionPort'
  );
  let strictConnectionError = null;
  try {
    portInjectedRuntime.connectStateProjection({ set() {} });
  } catch (error) {
    strictConnectionError = error;
  }
  context.assert(
    strictConnectionError && strictConnectionError.code === 'rmt.state.projection-batch-required',
    'connections created after strict Model boot inherit the atomic batchUpdate requirement'
  );
  const projectionOnlyHost = createFakeStateHost();
  projectionOnlyHost.store['host.authority'] = false;
  const authoritativeRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [{ id: 'state.authority', projectionKey: 'host.authority', type: 'boolean', initial: false }],
    initialState: { 'state.authority': true },
    stateProjectionTarget: projectionOnlyHost,
    strictMaraca: true
  });
  context.assert(
    authoritativeRuntime.getState('state.authority') === true
      && projectionOnlyHost.store['host.authority'] === true,
    'verified RMT initialState is authoritative and overwrites a stale projection during boot'
  );
  const safeCountRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [{
      id: 'state.safe-items',
      type: 'collection',
      initial: [{ kind: 'one' }, { kind: 'one' }, { kind: 'two' }]
    }],
    selectors: [{
      id: 'selector.safe-counts',
      from: 'state.safe-items',
      compute: 'countBy',
      countBy: 'kind'
    }]
  });
  const safeCounts = safeCountRuntime.select('selector.safe-counts');
  context.assert(
    Object.getPrototypeOf(safeCounts) === null
      && safeCounts.one === 2
      && safeCounts.two === 1,
    'state countBy uses a null-prototype accumulator'
  );
  let unsafeSelectorPathBlocked = false;
  try {
    stateRuntimeModule.createRmtStateSelectorRuntime({
      states: [{ id: 'state.safe', type: 'object', initial: {} }],
      selectors: [{
        id: 'selector.unsafe-path',
        from: 'state.safe',
        path: '__proto__.polluted'
      }]
    });
  } catch (error) {
    unsafeSelectorPathBlocked = error && error.code === 'rmt.state.path.unsafe';
  }
  context.assert(unsafeSelectorPathBlocked, 'state selectors reject reserved prototype path segments');
  let unsafeReducerPathBlocked = false;
  try {
    stateRuntimeModule.createRmtStateSelectorRuntime({
      states: [{ id: 'state.safe', type: 'object', initial: {} }],
      reducers: [{
        id: 'reducer.unsafe-toggle',
        command: 'command.unsafe-toggle',
        state: 'state.safe',
        toggle: 'constructor.polluted'
      }]
    });
  } catch (error) {
    unsafeReducerPathBlocked = error && error.code === 'rmt.state.path.unsafe';
  }
  context.assert(unsafeReducerPathBlocked, 'state reducers reject reserved prototype write paths before dispatch');
  let unsafeCountKeyBlocked = false;
  try {
    stateRuntimeModule.createRmtStateSelectorRuntime({
      states: [{
        id: 'state.unsafe-count-items',
        type: 'collection',
        initial: [{ kind: '__proto__' }]
      }],
      selectors: [{
        id: 'selector.unsafe-counts',
        from: 'state.unsafe-count-items',
        compute: 'countBy',
        countBy: 'kind'
      }]
    });
  } catch (error) {
    unsafeCountKeyBlocked = error && error.code === 'rmt.state.path.unsafe';
  }
  context.assert(unsafeCountKeyBlocked, 'state countBy rejects reserved prototype keys');

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
  const epic = readText('development/docs-evidence/root/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runtimeSource = readText(RMT_STATE_SELECTOR_RUNTIME_RUNTIME, rootDir);
  const compatibilitySource = readText('xtendrmt/rmt-state-selector-runtime.compat.js', rootDir);
  const stateHostAdapterSource = readText('xtendrmt/rmt-state-host-adapter.js', rootDir);
  const typeSource = readText(RMT_STATE_SELECTOR_RUNTIME_TYPES, rootDir);
  const stateHostAdapterTypes = readText('xtendrmt/rmt-state-host-adapter.d.ts', rootDir);
  const stateBindingProjectorSource = readText('xtendrmt/rmt-state-binding-view-projector.js', rootDir);
  const stateBindingProjectorTypes = readText('xtendrmt/rmt-state-binding-view-projector.d.ts', rootDir);
  const domRendererSource = readText('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir);
  const stateBindingProjectorModule = await loadStateBindingProjectorModule(rootDir);
  const stateHostAdapterModule = await loadStateHostAdapterModule(rootDir);
  const stateRuntimeModule = await loadStateRuntimeModule(rootDir);
  const rendererModule = await loadRendererModule(rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_STATE_SELECTOR_RUNTIME_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_STATE_SELECTOR_RUNTIME_SUITE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_STATE_SELECTOR_RUNTIME_RUNTIME, { rootDir, extension: '.js' });
  const compatibilitySyntax = syntaxCheckFile('xtendrmt/rmt-state-selector-runtime.compat.js', { rootDir, extension: '.js' });
  const stateBindingProjectorSyntax = syntaxCheckFile('xtendrmt/rmt-state-binding-view-projector.js', { rootDir, extension: '.js' });
  const stateHostAdapterSyntax = syntaxCheckFile('xtendrmt/rmt-state-host-adapter.js', { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-07 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-07 doc`);
  });

  context.assert(moduleSyntax.ok, `State selector runtime contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `State selector runtime suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `State selector runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(compatibilitySyntax.ok, `State selector compatibility facade syntax passes${compatibilitySyntax.ok ? '' : ` (${compatibilitySyntax.message})`}`);
  context.assert(stateBindingProjectorSyntax.ok, `State binding View projector syntax passes${stateBindingProjectorSyntax.ok ? '' : ` (${stateBindingProjectorSyntax.message})`}`);
  context.assert(stateHostAdapterSyntax.ok, `State host adapter syntax passes${stateHostAdapterSyntax.ok ? '' : ` (${stateHostAdapterSyntax.message})`}`);
  assertFileExists(context, 'xtendrmt/rmt-state-host-adapter.js', rootDir, 'State host adapter runtime exists');
  assertFileExists(context, 'xtendrmt/rmt-state-host-adapter.d.ts', rootDir, 'State host adapter types exist');
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
  context.assert(report.stateRuntimeImportedByRuntime === false, 'State selector runtime reports no Classic runtime import');
  context.assert(report.selectionUpdatesPreserveDom === true, 'State selector runtime reports selection DOM preserve');
  assertIncludesAll(context, plan.stateCapabilities, REQUIRED_STATE_CAPABILITIES, 'required state capabilities');
  assertIncludesAll(context, plan.stateTypes, REQUIRED_STATE_TYPES, 'required state types');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'required state boundaries');

  context.assert(fixture.kind === 'rmt_document', 'State selector fixture is an RMT document');
  context.assert(fixture.schema === RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA, 'State selector fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'State selector fixture declares contract');
  context.assert(fixture.manifest.metadata.componentPrimitiveContract === RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA, 'State selector fixture declares component primitive contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE, 'State selector fixture is owned by WP-E18-07');
  context.assert(fixture.manifest.metadata.stateProjectionMode === 'injected-host-adapter', 'State selector fixture keeps state projection injected');
  context.assert(fixture.acceptance.selectionUpdatesPreserveDom === true, 'State selector acceptance preserves DOM for selection');
  context.assert(fixture.acceptance.filterUpdatesMayRerenderStructure === true, 'State selector acceptance allows structural filter rerender');
  assertFixtureGraph(context, fixture);
  runRuntimeAssertions(context, fixture, stateRuntimeModule, rendererModule, stateBindingProjectorModule, stateHostAdapterModule);

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtStateSelectorRuntime',
    'planRmtStatePatch',
    'transaction',
    'modelCommandPort',
    'modelReader',
    'stateProjectionPort',
    'createStateProjectionPort',
    'batchUpdate',
    'preserveDom'
  ], 'State selector runtime source');
  const removedBridgeSymbol = ['createRmt', 'X', 'StateBridge'].join('');
  context.assert(!runtimeSource.includes(removedBridgeSymbol) && !/\.(?:setState|getState)\s*\(/u.test(runtimeSource), 'Model source contains no removed bridge or host read/write implementation');
  context.assert(!/components\/xtend-state|classic-state/u.test(runtimeSource), 'State selector runtime does not import the Classic runtime');
  context.assert(!/components\/|xtend-loader|api\.js/u.test(runtimeSource), 'State selector runtime avoids XTend UI imports');
  context.assert(!/querySelector|domRenderer\.commit\s*\(/u.test(runtimeSource), 'Model runtime contains no State Binding DOM projection');
  context.assert(!/StateBindingViewProjector|applyRmtStateBindings|createRmtStateBindingAdapter/u.test(runtimeSource), 'Model runtime contains no View or compatibility composition dependency');
  assertTextIncludesAll(context, compatibilitySource, [
    'createRmtStateHostAdapter',
    'createRmtStateBindingViewProjector',
    'applyRmtStateBindings',
    'createRmtStateBindingAdapter',
    'rmt.state-binding.legacy-adapter'
  ], 'State selector compatibility facade');
  assertTextIncludesAll(context, stateHostAdapterSource, [
    'RMT_STATE_PROJECTION_PORT_SCHEMA',
    'createRmtStateHostAdapter',
    'batchUpdate',
    'setState',
    'getState'
  ], 'State output/host adapter source');
  context.assert(!stateHostAdapterSource.includes(removedBridgeSymbol), 'State host adapter exports no removed bridge alias');
  assertTextIncludesAll(context, stateBindingProjectorSource, [
    'createRmtStateBindingViewProjector',
    'domRenderer',
    "operation: 'merge-element'",
    'snapshot-mutable',
    'attribute-sync'
  ], 'State binding View projector source');
  context.assert(stateBindingProjectorSource.includes('renderer.commit({'), 'State binding View projector delegates writes to the shared DOM renderer');
  context.assert(!/\.(?:setState|patchState|dispatch)\s*\(|stateHost/iu.test(stateBindingProjectorSource), 'State binding View projector cannot mutate Model or state hosts');
  context.assert(!/element\.(?:setAttribute|removeAttribute)\s*\(|element\[[^\]]+\]\s*=/u.test(stateBindingProjectorSource), 'State binding View projector contains no direct DOM writer fallback');
  assertTextIncludesAll(context, domRendererSource, [
    '$selector.',
    'context.selectorValues',
    '$derive.'
  ], 'DOM Descriptor renderer selector context support');
  assertTextIncludesAll(context, typeSource, [
    'RmtStateSelectorRuntime',
    'RmtStateDefinition',
    'RmtSelectorDefinition',
    'RmtStateChangeEvent',
    'RmtModelReader',
    'RmtModelCommandPort',
    'RmtModelOperation',
    'createRmtStateSelectorRuntime'
  ], 'State selector runtime types');
  assertTextIncludesAll(context, stateHostAdapterTypes, [
    'RmtStateProjectionPort',
    'RmtStateProjectionPortFactory',
    'RmtStateHostAdapter',
    'createRmtStateHostAdapter'
  ], 'State output/host adapter types');
  context.assert(!stateHostAdapterTypes.includes(removedBridgeSymbol), 'State host adapter types expose no removed bridge alias');
  assertTextIncludesAll(context, stateBindingProjectorTypes, [
    'RmtStateBindingModelSnapshot',
    'RmtStateBindingViewProjector',
    'createRmtStateBindingViewProjector'
  ], 'State binding View projector types');
  assertTextIncludesAll(context, docs, [
    '# RMT State Selector Runtime',
    RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    'stateProjectionPort',
    'preservePatchPlan',
    NEXT_WORKPACKAGE
  ], 'State selector runtime docs');
  assertTextIncludesAll(context, workpackageDoc, [
    '# Migrating state APIs to XTend 0.7',
    '@ccslabs/xtend/classic-state',
    '@ccslabs/xtend/rmt/state-host-adapter',
    'stateProjectionPort'
  ], '0.7 state migration doc');
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
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/state-host-adapter'], 'Package exports the State host adapter');
  const removedSubpath = ['./rmt/', 'x', 'state-host-adapter'].join('');
  context.assert(!packageManifest.exports[removedSubpath], 'Package omits the removed State host adapter subpath');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/state-binding-view-projector'], 'Package exports state binding View projector');
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
