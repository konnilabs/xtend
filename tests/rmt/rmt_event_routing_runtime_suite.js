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
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DOCS,
  REQUIRED_EVENT_CAPABILITIES,
  REQUIRED_EVENT_KINDS,
  REQUIRED_GOVERNANCE_POLICIES,
  RMT_EVENT_ROUTING_RUNTIME_DOCS,
  RMT_EVENT_ROUTING_RUNTIME_FIXTURE,
  RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE,
  RMT_EVENT_ROUTING_RUNTIME_MODULE,
  RMT_EVENT_ROUTING_RUNTIME_PACKAGE_SCRIPT,
  RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_RUNTIME,
  RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_STATUS,
  RMT_EVENT_ROUTING_RUNTIME_SUITE,
  RMT_EVENT_ROUTING_RUNTIME_TARGET,
  RMT_EVENT_ROUTING_RUNTIME_TYPES,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC,
  createRmtEventRoutingRuntimePlan,
  createRmtEventRoutingRuntimeReport,
  validateRmtEventRoutingRuntimePlan
} = require('../../catalog/epic18-rmt-event-routing-runtime');
const {
  RMT_ACTION_EFFECT_RUNTIME_SCHEMA
} = require('../../catalog/epic18-rmt-action-effect-runtime');
const {
  RMT_STATE_SELECTOR_RUNTIME_SCHEMA
} = require('../../catalog/epic18-rmt-state-selector-runtime');

let eventRuntimeModulePromise = null;
let actionRuntimeModulePromise = null;
let stateRuntimeModulePromise = null;

function loadEventRuntimeModule(rootDir) {
  if (!eventRuntimeModulePromise) {
    eventRuntimeModulePromise = import(`file://${resolveRepoPath(RMT_EVENT_ROUTING_RUNTIME_RUNTIME, rootDir)}`);
  }
  return eventRuntimeModulePromise;
}

function loadActionRuntimeModule(rootDir) {
  if (!actionRuntimeModulePromise) {
    actionRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-action-effect-runtime.js', rootDir)}`);
  }
  return actionRuntimeModulePromise;
}

function loadStateRuntimeModule(rootDir) {
  if (!stateRuntimeModulePromise) {
    stateRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-state-selector-runtime.js', rootDir)}`);
  }
  return stateRuntimeModulePromise;
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

function createPending() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createFakeTarget(id, options = {}) {
  const listeners = new Map();
  const removed = [];
  return {
    id,
    dataset: { ...(options.dataset || {}) },
    value: options.value,
    listeners,
    removed,
    addEventListener(type, listener, listenerOptions) {
      const key = String(type);
      const list = listeners.get(key) || [];
      list.push({ listener, options: listenerOptions || {} });
      listeners.set(key, list);
    },
    removeEventListener(type, listener) {
      const key = String(type);
      const list = listeners.get(key) || [];
      listeners.set(key, list.filter((entry) => entry.listener !== listener));
      removed.push(key);
    },
    async dispatch(type, event = {}) {
      const key = String(type);
      const list = listeners.get(key) || [];
      event.type = event.type || key;
      event.target = event.target || this;
      event.currentTarget = event.currentTarget || this;
      await Promise.all(list.map((entry) => entry.listener(event)));
      return event;
    }
  };
}

function createFakeEvent(type, options = {}) {
  const event = {
    type,
    target: options.target || null,
    currentTarget: options.currentTarget || options.target || null,
    detail: options.detail || {},
    key: options.key,
    dataTransfer: options.dataTransfer,
    cancelable: options.cancelable !== false,
    defaultPrevented: false,
    propagationStopped: false,
    immediatePropagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
    },
    composedPath() {
      return options.composedPath || [this.target, this.currentTarget].filter(Boolean);
    }
  };
  return event;
}

async function assertCanonicalTemplateBindingOwnership(context, rootDir, eventRuntimeModule) {
  const rendererPath = resolveRepoPath('xtendrmt/kernel/modules/rmt-template-runtime-renderer.js', rootDir);
  const rendererSource = fs.readFileSync(rendererPath, 'utf8');
  const sandbox = { AppModules: {}, console, Date };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(rendererSource.replaceAll('__XTENDRMT_GLOBAL__', 'globalThis'), sandbox, {
    filename: rendererPath
  });

  const root = createFakeTarget('template-binding-root');
  const target = createFakeTarget('template-binding-target');
  target.parentNode = root;
  target.setAttribute = function setAttribute(name, value) {
    this[name] = String(value);
  };
  target.removeAttribute = function removeAttribute(name) {
    delete this[name];
  };
  root.querySelector = (selector) => selector === '#template-save' ? target : null;
  const renderer = sandbox.AppModules.createRmtTemplateRuntimeRenderer({ documentTarget: {} });
  const session = renderer.applyBindings({
    rootId: 'template-binding-root',
    element: root,
    templateQualifiedId: 'fixture:template-binding',
    bindings: [{
      id: 'binding.template-save',
      kind: 'command',
      target: '#template-save',
      eventType: 'click',
      commandName: 'fixture.template.save',
      payload: { source: 'template' }
    }]
  });
  const commitResult = session.getApplicationBindingCommitResult();
  context.assert(
    (target.listeners.get('click') || []).length === 0
      && commitResult.bindings.length === 1
      && commitResult.bindings[0].target === target
      && commitResult.bindings[0].command === 'fixture.template.save'
      && commitResult.bindingScope.roots[0] === root,
    'template renderer returns validated actual-target bindings without installing application listeners'
  );

  const commands = [];
  const router = eventRuntimeModule.createRmtEventRoutingRuntime({
    strict: true,
    commandBus: {
      dispatchCommand(command) {
        commands.push(command);
        return { status: 'success' };
      }
    }
  });
  const reconcile = router.reconcile(root, commitResult);
  await target.dispatch('click', createFakeEvent('click', {
    target,
    detail: { ignored: true }
  }));
  context.assert(
    reconcile.attachedCount === 1
      && (target.listeners.get('click') || []).length === 1
      && commands.length === 1
      && commands[0].command === 'fixture.template.save',
    'canonical Event Router exclusively materializes and dispatches template application bindings'
  );
  session.destroy();
  const cleanup = router.reconcile(root, session.getApplicationBindingCommitResult());
  context.assert(
    cleanup.detachedCount === 1 && (target.listeners.get('click') || []).length === 0,
    'destroyed template sessions return scoped removals for Event Router cleanup'
  );

  const interactionAdapterPath = resolveRepoPath('xtendrmt/kernel/modules/rmt-template-interaction-adapter.js', rootDir);
  vm.runInNewContext(
    fs.readFileSync(interactionAdapterPath, 'utf8').replaceAll('__XTENDRMT_GLOBAL__', 'globalThis'),
    sandbox,
    { filename: interactionAdapterPath }
  );
  const integratedCommands = [];
  const integratedRouter = eventRuntimeModule.createRmtEventRoutingRuntime({
    strict: true,
    commandBus: {
      dispatchCommand(command) {
        integratedCommands.push(command);
        return { status: 'success' };
      }
    }
  });
  const interactionAdapter = sandbox.AppModules.createRmtTemplateInteractionAdapter({
    executionModel: {
      normalizeChunk(chunk) {
        return chunk;
      }
    },
    runtimeRenderer: renderer,
    eventRouter: integratedRouter,
    documentTarget: {}
  });
  const routedSession = interactionAdapter.applyRuntimeBindings(root, {
    rootId: 'template-binding-root',
    template: { qualifiedId: 'fixture:template-binding' },
    hydration: {
      bindings: [{
        id: 'binding.template-save',
        kind: 'command',
        target: '#template-save',
        eventType: 'click',
        commandName: 'fixture.template.save',
        payload: { source: 'interaction-adapter' }
      }],
      reactivityHints: {}
    },
    modelSnapshot: {}
  }, { rootId: 'template-binding-root' });
  await target.dispatch('click', createFakeEvent('click', { target }));
  context.assert(
    routedSession
      && (target.listeners.get('click') || []).length === 1
      && integratedCommands.length === 1
      && integratedCommands[0].payload.source === 'interaction-adapter',
    'template interaction adapter forwards session bindings to its injected Event Router port'
  );
  routedSession.destroy();
  context.assert(
    (target.listeners.get('click') || []).length === 0,
    'template interaction adapter reconciles Event Router cleanup with binding-session disposal'
  );
  context.assert(
    !/\.addEventListener\s*\(/u.test(rendererSource)
      && !/\.removeEventListener\s*\(/u.test(rendererSource)
      && !/\.(?:dispatchCommand|emitRootEvent|dispatchEvent)\s*\(/u.test(rendererSource),
    'template view source contains no application listener or command-dispatch implementation'
  );
}

function assertFixtureGraph(context, fixture) {
  const components = indexById(fixture.components);
  const actions = indexById(fixture.actions);
  const events = indexById(fixture.events);
  REQUIRED_EVENT_KINDS.forEach((kind) => {
    context.assert((fixture.events || []).some((entry) => entry.kind === kind), `fixture covers event kind ${kind}`);
  });
  REQUIRED_GOVERNANCE_POLICIES.forEach((policy) => {
    context.assert((fixture.events || []).some((entry) => entry.governance && Object.prototype.hasOwnProperty.call(entry.governance, policy)), `fixture covers governance policy ${policy}`);
  });
  (fixture.events || []).forEach((event) => {
    context.assert(events.has(event.id), `${event.id}: event is indexed`);
    context.assert(actions.has(event.action), `${event.id}: action resolves`);
    context.assert(components.has(event.component), `${event.id}: component resolves`);
    context.assert(event.payloadContract && event.payloadContract.type === 'object', `${event.id}: payload contract is declared`);
    context.assert(event.owner && event.owner.startsWith('scope.'), `${event.id}: owner scope is declared`);
  });
  ['event.load-click', 'event.search-input', 'event.save-submit', 'event.preview-open', 'event.row-activate', 'event.surface-close', 'event.drop-files', 'event.cancel-load'].forEach((id) => {
    context.assert(events.has(id), `fixture event resolves ${id}`);
  });
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'event routing fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'event routing fixture contains no manual HTML sinks');
  context.assert(!/closest\s*\(/u.test(fixtureText), 'event routing fixture contains no closest delegation');
}

async function runRuntimeAssertions(context, fixture, stateRuntimeModule, actionRuntimeModule, eventRuntimeModule) {
  const feedback = [];
  const navigation = [];
  const imports = [];
  const diagnostics = [];
  const restCalls = [];
  const hostCalls = [];
  const pending = createPending();
  const targets = {
    'ref.load-button': createFakeTarget('ref.load-button', { dataset: { source: 'toolbar' } }),
    'ref.search-input': createFakeTarget('ref.search-input', { value: 'alpha' }),
    'ref.save-form': createFakeTarget('ref.save-form'),
    'ref.preview-card': createFakeTarget('ref.preview-card', { dataset: { origin: 'card' } }),
    'ref.item-row': createFakeTarget('ref.item-row', { dataset: { id: 'alpha', path: '/items/alpha' } }),
    'ref.drop-zone': createFakeTarget('ref.drop-zone')
  };
  const stateRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: fixture.state,
    selectors: fixture.selectors
  });
  const actionRuntime = actionRuntimeModule.createRmtActionEffectRuntime({
    actions: fixture.actions,
    dataSources: fixture.dataSources,
    effects: fixture.effects,
    resources: fixture.resources,
    stateRuntime: stateRuntime.modelReader,
    modelCommandPort: stateRuntime.modelCommandPort,
    feedbackAdapter: {
      publish(payload) {
        feedback.push(payload);
      }
    },
    navigationAdapter: {
      navigate(route) {
        navigation.push(route);
      }
    },
    importAdapter: {
      load(id) {
        imports.push(id);
        return { id, loaded: true };
      }
    },
    dataSourceAdapters: {
      rest: {
        fetch(endpoint, request) {
          restCalls.push({ endpoint, payload: request.payload });
          return {
            items: [
              { id: 'rest-alpha', title: 'Rest Alpha', kind: 'task' }
            ]
          };
        }
      },
      'host.mutate': {
        invoke(request) {
          hostCalls.push(request.payload);
          return {
            record: {
              status: 'saved',
              id: request.payload.id,
              title: request.payload.title
            }
          };
        }
      },
      'host.pending': {
        invoke() {
          return pending.promise;
        }
      }
    }
  });
  const runtime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: fixture.events,
    actionRuntime,
    targets,
    diagnosticsHub: {
      publish(channel, payload) {
        diagnostics.push({ channel, payload });
      }
    }
  });

  context.assert(runtime.schema === RMT_EVENT_ROUTING_RUNTIME_SCHEMA, 'event routing runtime exposes schema');
  context.assert(runtime.listBindings().length === fixture.events.length, 'event routing runtime indexes all events');
  const attachReport = runtime.attach();
  context.assert(attachReport.attachedCount === fixture.events.length, 'event routing runtime attaches all listeners');
  context.assert(runtime.listAttached().length === fixture.events.length, 'runtime lists attached listeners');
  context.assert((targets['ref.search-input'].listeners.get('input') || []).length === 1, 'input listener is attached to search ref');
  context.assert((targets['ref.search-input'].listeners.get('keydown') || []).length === 1, 'keydown listener is attached to search ref');

  const loadEvent = createFakeEvent('click', { target: targets['ref.load-button'] });
  const loadResult = await runtime.routeEvent('event.load-click', loadEvent);
  context.assert(loadResult.status === 'success', 'load click routes to action success');
  context.assert(loadEvent.defaultPrevented === true, 'load click applies preventDefault governance');
  context.assert(loadEvent.propagationStopped === true, 'load click applies stopPropagation governance');
  context.assert(loadResult.payload.source === 'toolbar', 'load click payload resolves target dataset');
  context.assert(stateRuntime.getState('state.items').length === 2, 'load click action writes fixture records');
  context.assert(feedback.some((entry) => entry.message === 'Records loaded'), 'load click triggers feedback effect through action runtime');

  targets['ref.search-input'].value = 'alpha';
  const searchEvent = createFakeEvent('input', { target: targets['ref.search-input'] });
  const searchResult = await runtime.routeEvent('event.search-input', searchEvent);
  context.assert(searchResult.status === 'success', 'search input routes to REST action success');
  context.assert(restCalls.length === 1 && restCalls[0].payload.query === 'alpha', 'search input payload reaches REST datasource adapter');
  context.assert(stateRuntime.getState('state.items')[0].id === 'rest-alpha', 'search input action writes REST records');

  targets['ref.search-input'].value = 42;
  const invalidSearch = await runtime.routeEvent('event.search-input', createFakeEvent('input', { target: targets['ref.search-input'] }));
  context.assert(invalidSearch.status === 'blocked', 'invalid search payload is blocked by contract');
  context.assert(restCalls.length === 1, 'blocked payload does not invoke REST action again');
  context.assert(runtime.listDiagnostics().some((entry) => entry.code === 'rmt.event.payload_contract.invalid'), 'runtime records payload contract diagnostic');

  const commandDispatches = [];
  const commandRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [{
      id: 'event.prompt-command',
      event: 'xtend-command',
      target: '#prompt-input',
      component: 'x-textarea',
      action: 'app.route-prompt-command',
      payload: {
        command: '$detail.command',
        value: '$detail.payload.value',
        empty: '$detail.payload.empty'
      },
      payloadContract: {
        type: 'object',
        required: ['command', 'value', 'empty'],
        properties: {
          command: 'string',
          value: 'string',
          empty: 'boolean'
        }
      }
    }],
    actionRuntime: {
      dispatchCommand(commandEnvelope) {
        commandDispatches.push(commandEnvelope);
        return { status: 'success' };
      }
    },
    targets: {
      '#prompt-input': targets['ref.search-input']
    }
  });
  const promptCommand = {
    schema: 'xtend.rmt.command.v1',
    id: 'test.prompt-command',
    source: { kind: 'test', id: 'prompt-input', event: 'xtend-command' },
    command: 'xtend.llm.updatePrompt',
    payload: { value: 'Hello', empty: false },
    correlationId: 'test.correlation',
    lane: 'test',
    timestamp: new Date(0).toISOString()
  };
  const promptRoute = await commandRuntime.routeEvent('event.prompt-command', createFakeEvent('xtend-command', {
    target: targets['ref.search-input'],
    detail: promptCommand
  }));
  context.assert(promptRoute.status === 'success', 'xtend-command explicit payload mapping routes successfully');
  context.assert(promptRoute.payload.command === 'xtend.llm.updatePrompt', 'xtend-command mapping can read envelope command');
  context.assert(promptRoute.payload.value === 'Hello' && promptRoute.payload.empty === false, 'xtend-command mapping can read envelope payload fields');
  context.assert(commandDispatches.length === 1 && commandDispatches[0].payload.command === 'xtend.llm.updatePrompt', 'mapped command payload is forwarded through dispatchCommand');
  context.assert(Object.getPrototypeOf(promptRoute.payload) === null, 'resolved event payload records use a null prototype');
  let unsafeEventPathBlocked = false;
  try {
    eventRuntimeModule.createRmtEventRoutingRuntime({
      events: [{
        id: 'event.unsafe-path',
        event: 'click',
        action: 'action.unsafe-path',
        payload: '$event.constructor.prototype'
      }]
    });
  } catch (error) {
    unsafeEventPathBlocked = error && error.code === 'rmt.event.path.unsafe';
  }
  context.assert(unsafeEventPathBlocked, 'event payload paths reject reserved prototype segments before listener attachment');
  let unsafeEventRecordKeyBlocked = false;
  try {
    eventRuntimeModule.createRmtEventRoutingRuntime({
      events: [{
        id: 'event.unsafe-record',
        event: 'click',
        action: 'action.unsafe-record',
        payload: JSON.parse('{"constructor":"blocked"}')
      }]
    });
  } catch (error) {
    unsafeEventRecordKeyBlocked = error && error.code === 'rmt.event.path.unsafe';
  }
  context.assert(unsafeEventRecordKeyBlocked, 'event payload records reject reserved prototype keys');

  const resetTarget = createFakeTarget('reset-target', { value: 'clear me' });
  const postActionCommits = [];
  const resetRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [{
      id: 'event.reset-input',
      event: 'change',
      target: 'reset-target',
      component: 'x-input',
      action: 'reset-action',
      payload: {},
      postAction: ['reset-input']
    }],
    actionRuntime: {
      runAction() {
        return { status: 'success' };
      }
    },
    targets: {
      'reset-target': resetTarget
    },
    domRenderer: {
      commit(request) {
        postActionCommits.push(request);
        request.target.value = request.descriptor.properties.value;
        return {
          schema: 'xtend.rmt.dom-commit-result.v1',
          operation: request.operation,
          changed: true
        };
      }
    }
  });
  const resetResult = await resetRuntime.routeEvent(
    'event.reset-input',
    createFakeEvent('change', { target: resetTarget })
  );
  context.assert(
    resetResult.status === 'success'
      && resetTarget.value === ''
      && postActionCommits.length === 1
      && postActionCommits[0].operation === 'merge-element',
    'input reset post-actions delegate their property write to the injected DOM renderer'
  );
  const compatibilityResetTarget = createFakeTarget('compatibility-reset-target', { value: 'clear me too' });
  let compatibilityRendererCreates = 0;
  let compatibilityRendererDisposes = 0;
  const compatibilityResetRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [{
      id: 'event.compatibility-reset-input',
      event: 'change',
      target: 'compatibility-reset-target',
      component: 'x-input',
      action: 'compatibility-reset-action',
      payload: {},
      postAction: ['reset-input']
    }],
    actionRuntime: {
      runAction() {
        return { status: 'success' };
      }
    },
    targets: {
      'compatibility-reset-target': compatibilityResetTarget
    },
    documentTarget: {},
    createDomRenderer() {
      compatibilityRendererCreates += 1;
      return {
        commit(request) {
          request.target.value = request.descriptor.properties.value;
          return {
            schema: 'xtend.rmt.dom-commit-result.v1',
            operation: request.operation,
            changed: true
          };
        },
        dispose() {
          compatibilityRendererDisposes += 1;
        }
      };
    }
  });
  await compatibilityResetRuntime.routeEvent(
    'event.compatibility-reset-input',
    createFakeEvent('change', { target: compatibilityResetTarget })
  );
  await compatibilityResetRuntime.routeEvent(
    'event.compatibility-reset-input',
    createFakeEvent('change', { target: compatibilityResetTarget })
  );
  const firstCompatibilityDispose = compatibilityResetRuntime.dispose();
  const secondCompatibilityDispose = compatibilityResetRuntime.dispose();
  context.assert(
    compatibilityRendererCreates === 1
      && compatibilityResetRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1,
    'event compatibility mode owns one renderer and diagnoses missing injection once'
  );
  context.assert(
    compatibilityRendererDisposes === 1
      && firstCompatibilityDispose.alreadyDisposed === false
      && secondCompatibilityDispose.alreadyDisposed === true,
    'event compatibility renderer lifecycle follows idempotent router disposal'
  );

  const saveEvent = createFakeEvent('submit', {
    target: targets['ref.save-form'],
    currentTarget: targets['ref.save-form'],
    detail: { id: 'gamma', title: 'Gamma' }
  });
  const saveResult = await runtime.routeEvent('event.save-submit', saveEvent);
  context.assert(saveResult.status === 'success', 'submit routes to host mutation action');
  context.assert(saveEvent.defaultPrevented === true && saveEvent.propagationStopped === true, 'submit applies form governance');
  context.assert(hostCalls.some((payload) => payload.id === 'gamma' && payload.title === 'Gamma'), 'submit payload reaches host mutation adapter');
  context.assert(feedback.some((entry) => entry.message === 'Gamma'), 'submit action publishes resolved feedback');

  const previewEvent = createFakeEvent('open-preview', {
    target: createFakeTarget('preview-child'),
    detail: { id: 'alpha' },
    composedPath: [targets['ref.preview-card']]
  });
  const previewResult = await runtime.routeEvent('event.preview-open', previewEvent);
  context.assert(previewResult.status === 'success', 'custom preview event routes to preload action');
  context.assert(previewResult.payload.origin === 'card', 'custom preview retargets through composed path');
  context.assert(imports.includes('generic-preview-panel'), 'custom preview action lazy-loads resource');

  const rowEvent = createFakeEvent('item-activated', {
    target: createFakeTarget('row-child'),
    composedPath: [targets['ref.item-row']]
  });
  const rowResult = await runtime.routeEvent('event.row-activate', rowEvent);
  context.assert(rowResult.status === 'success', 'row activation routes to navigation action');
  context.assert(rowEvent.immediatePropagationStopped === true, 'row activation applies stopImmediatePropagation governance');
  context.assert(navigation.includes('/items/alpha'), 'row activation payload drives navigation effect');

  const surfaceEvent = createFakeEvent('surface-closed', {
    target: targets['ref.preview-card'],
    currentTarget: targets['ref.preview-card'],
    detail: { returnTo: '/workspace' }
  });
  const surfaceResult = await runtime.routeEvent('event.surface-close', surfaceEvent);
  context.assert(surfaceResult.status === 'success', 'surface close event routes to action');
  context.assert(surfaceEvent.propagationStopped === true, 'surface close applies stopPropagation governance');
  context.assert(navigation.includes('/workspace'), 'surface close payload drives navigation effect');

  const dropEvent = createFakeEvent('drop', {
    target: targets['ref.drop-zone'],
    detail: { id: 'drop-alpha', title: 'Dropped Alpha' },
    dataTransfer: { files: ['alpha.txt'] }
  });
  const dropResult = await runtime.routeEvent('event.drop-files', dropEvent);
  context.assert(dropResult.status === 'success', 'drop event routes to host action');
  context.assert(dropResult.payload.files.length === 1, 'drop payload maps file list');
  context.assert(dropEvent.defaultPrevented === true && dropEvent.propagationStopped === true, 'drop applies cancel and stop governance');

  const pendingRun = actionRuntime.runAction('action.cancelable-load');
  const skippedCancel = await runtime.routeEvent('event.cancel-load', createFakeEvent('keydown', {
    target: targets['ref.search-input'],
    currentTarget: targets['ref.search-input'],
    key: 'Enter'
  }));
  context.assert(skippedCancel.status === 'skipped' && skippedCancel.reason === 'condition', 'non-matching keyboard event is skipped by condition');
  const cancelResult = await runtime.routeEvent('event.cancel-load', createFakeEvent('keydown', {
    target: targets['ref.search-input'],
    currentTarget: targets['ref.search-input'],
    key: 'Escape'
  }));
  context.assert(cancelResult.status === 'cancelled', 'keyboard event routes to cancelAction');
  context.assert(cancelResult.actionResult.cancelled === 1, 'cancel event cancels one active action run');
  pending.resolve([{ id: 'late', title: 'Late' }]);
  const pendingResult = await pendingRun;
  context.assert(pendingResult.status === 'cancelled', 'pending action observes routed cancel signal');


  const surfaceActionCalls = [];
  const victimSurface = createFakeTarget('victim-surface');
  victimSurface.attributes = { 'data-maraca-surface': 'victim' };
  const attackerSurface = createFakeTarget('attacker-surface');
  const ownerDocument = createFakeTarget('owner-document');
  const surfaceRoot = {
    ownerDocument,
    addEventListener: createFakeTarget('surface-root').addEventListener,
    querySelector(selector) {
      return selector === '[data-maraca-surface="victim"]' ? victimSurface : null;
    }
  };
  const surfaceRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [{
      id: 'event.secure-surface-command',
      event: 'surface-close-command',
      target: '[data-maraca-surface="victim"]',
      closest: '[data-maraca-surface="victim"]',
      action: 'action.secure-surface',
      component: 'component.secure-surface',
      owner: 'scope.secure-surface',
      payload: '$detail'
    }],
    root: surfaceRoot,
    actionRuntime: {
      async runAction(action, payload) {
        surfaceActionCalls.push({ action, payload });
        return { status: 'ok' };
      }
    }
  });
  surfaceRuntime.attach();
  context.assert(victimSurface.listeners.has('surface-close-command'), 'surface-scoped string targets attach to matched surface element');
  context.assert(!ownerDocument.listeners.has('surface-close-command'), 'surface-scoped string targets do not attach to owner document');
  const forgedSurfaceResult = await surfaceRuntime.routeEvent('event.secure-surface-command', createFakeEvent('surface-close-command', {
    target: attackerSurface,
    currentTarget: attackerSurface,
    detail: { surfaceId: 'victim', privileged: true },
    composedPath: [attackerSurface, ownerDocument]
  }));
  context.assert(forgedSurfaceResult.status === 'skipped' && forgedSurfaceResult.reason === 'delegated-target', 'forged surface detail does not satisfy delegated target matching');
  context.assert(surfaceActionCalls.length === 0, 'forged surface detail does not invoke surface action');
  await victimSurface.dispatch('surface-close-command', createFakeEvent('surface-close-command', {
    target: victimSurface,
    currentTarget: victimSurface,
    detail: { surfaceId: 'victim', privileged: true },
    composedPath: [victimSurface, surfaceRoot]
  }));
  context.assert(surfaceActionCalls.length === 1 && surfaceActionCalls[0].action === 'action.secure-surface', 'matched surface event invokes surface action');
  surfaceRuntime.detachAll();

  context.assert(runtime.listRoutes().length >= 10, 'runtime records route history');
  context.assert(runtime.listDiagnostics().some((entry) => entry.code === 'rmt.event.route.success' && entry.details.component === 'component.toolbar' && entry.details.action === 'action.load-items'), 'diagnostics expose component and action');
  context.assert(runtime.listDiagnostics().some((entry) => entry.details && entry.details.payload), 'diagnostics expose payload');
  context.assert(diagnostics.some((entry) => entry.channel === 'rmt.app_platform.event_routing'), 'diagnostics hub receives event routing channel');

  const detachToolbar = runtime.detachOwner('scope.toolbar');
  context.assert(detachToolbar.detachedCount === 3, 'detachOwner removes toolbar listeners only');
  context.assert(runtime.listAttached().length === fixture.events.length - 3, 'owner detach preserves other listeners');
  const detachAll = runtime.detachAll();
  context.assert(detachAll.detachedCount === fixture.events.length - 3, 'detachAll removes remaining listeners');
  context.assert(runtime.listAttached().length === 0, 'runtime has no attached listeners after detachAll');

  const firstReconcileTarget = createFakeTarget('first-reconcile-target');
  const secondReconcileTarget = createFakeTarget('second-reconcile-target');
  let currentReconcileTarget = firstReconcileTarget;
  const reconcileRoot = {
    querySelector(selector) {
      return selector === '#reconcile-target' ? currentReconcileTarget : null;
    }
  };
  const reconcileCalls = [];
  const reconcileRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [{
      id: 'event.reconcile-target',
      event: 'click',
      target: '#reconcile-target',
      component: 'component.reconcile-target',
      action: 'action.reconcile-target',
      owner: 'scope.reconcile-target',
      payload: '$detail'
    }],
    actionRuntime: {
      async dispatchCommand(command) {
        reconcileCalls.push({ action: command.command, payload: command.payload });
        return { status: 'success' };
      }
    }
  });
  const firstReconcile = reconcileRuntime.reconcile(reconcileRoot, {
    schema: 'xtend.rmt.dom-commit-result.v1',
    operation: 'replace-children',
    changed: true,
    structural: true,
    nodeCount: 1
  });
  context.assert(firstReconcile.attachedCount === 1 && firstReconcile.detachedCount === 0, 'event reconcile attaches a previously missing binding');
  context.assert((firstReconcileTarget.listeners.get('click') || []).length === 1, 'event reconcile attaches one listener to the actual target');
  const stableReconcile = reconcileRuntime.reconcile(reconcileRoot, {
    schema: 'xtend.rmt.dom-commit-result.v1',
    operation: 'reconcile-element',
    changed: false,
    structural: false,
    nodeCount: 1
  });
  context.assert(stableReconcile.retainedCount === 1 && stableReconcile.changed === false, 'event reconcile retains a binding whose actual target is unchanged');
  context.assert((firstReconcileTarget.listeners.get('click') || []).length === 1, 'repeated event reconcile does not stack listeners');
  currentReconcileTarget = secondReconcileTarget;
  const movedReconcile = reconcileRuntime.reconcile(reconcileRoot, {
    schema: 'xtend.rmt.dom-commit-result.v1',
    operation: 'reconcile-children',
    changed: true,
    structural: true,
    nodeCount: 1
  });
  context.assert(movedReconcile.attachedCount === 1 && movedReconcile.detachedCount === 1, 'event reconcile replaces a listener when the actual target identity changes');
  context.assert((firstReconcileTarget.listeners.get('click') || []).length === 0, 'event reconcile detaches the stale target listener');
  context.assert((secondReconcileTarget.listeners.get('click') || []).length === 1, 'event reconcile attaches the replacement target listener once');
  await firstReconcileTarget.dispatch('click', createFakeEvent('click', { detail: { source: 'stale' } }));
  await secondReconcileTarget.dispatch('click', createFakeEvent('click', { detail: { source: 'current' } }));
  context.assert(reconcileCalls.length === 1 && reconcileCalls[0].payload.source === 'current', 'only the reconciled target routes events');
  const firstDispose = reconcileRuntime.dispose();
  const secondDispose = reconcileRuntime.dispose();
  context.assert(firstDispose.detachedCount === 1 && firstDispose.alreadyDisposed === false, 'event dispose detaches all owned listeners');
  context.assert(secondDispose.detachedCount === 0 && secondDispose.alreadyDisposed === true, 'event dispose is idempotent');
  const disposedReconcile = reconcileRuntime.reconcile(reconcileRoot);
  context.assert(disposedReconcile.disposed === true && disposedReconcile.attachedCount === 0, 'disposed event runtime cannot reattach listeners');
  context.assert((secondReconcileTarget.listeners.get('click') || []).length === 0, 'event dispose leaves no listener on the current target');

  const dynamicScopeRoot = { id: 'dynamic-scope-root', parentNode: null };
  const firstDynamicTarget = createFakeTarget('first-dynamic-target');
  const secondDynamicTarget = createFakeTarget('second-dynamic-target');
  firstDynamicTarget.parentNode = dynamicScopeRoot;
  secondDynamicTarget.parentNode = dynamicScopeRoot;
  const dynamicCommands = [];
  const dynamicRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    actionRuntime: {
      async dispatchCommand(command, metadata) {
        dynamicCommands.push({ command, metadata });
        return { status: 'success' };
      }
    },
    strict: true
  });
  const dynamicBinding = (target, command = 'app.dynamic-command') => ({
    schema: 'xtend.rmt.dom-application-binding.v1',
    id: 'binding.dynamic-command',
    bindingId: 'binding.dynamic-command',
    kind: 'application',
    target,
    event: 'click',
    command,
    action: command,
    options: { capture: false, passive: false, once: false },
    governance: {
      capture: false,
      passive: false,
      once: false,
      preventDefault: true,
      stopPropagation: false,
      stopImmediatePropagation: false,
      retarget: 'target'
    },
    owner: 'scope.dynamic-view',
    component: 'component.dynamic-view',
    payload: '$detail'
  });
  const dynamicCommit = (bindings, removedBindings = []) => ({
    schema: 'xtend.rmt.dom-commit-result.v1',
    operation: 'reconcile-children',
    changed: true,
    structural: true,
    nodeCount: 1,
    bindings,
    bindingScope: {
      schema: 'xtend.rmt.dom-binding-scope.v1',
      id: 'scope.dynamic-root',
      target: dynamicScopeRoot,
      roots: [dynamicScopeRoot],
      complete: true,
      bindingIds: bindings.map((binding) => binding.bindingId),
      removedBindings
    }
  });
  const firstDynamicReconcile = dynamicRuntime.reconcile(dynamicScopeRoot, dynamicCommit([
    dynamicBinding(firstDynamicTarget)
  ]));
  context.assert(
    firstDynamicReconcile.attachedCount === 1
      && dynamicRuntime.listBindings()[0].target === firstDynamicTarget
      && (firstDynamicTarget.listeners.get('click') || []).length === 1,
    'event reconcile owns listener materialization for actual-target DOM commit bindings'
  );
  let stableDynamicReport = null;
  for (let index = 0; index < 100; index += 1) {
    stableDynamicReport = dynamicRuntime.reconcile(dynamicScopeRoot, dynamicCommit([
      dynamicBinding(firstDynamicTarget)
    ]));
  }
  context.assert(
    stableDynamicReport.retainedCount === 1
      && stableDynamicReport.changed === false
      && (firstDynamicTarget.listeners.get('click') || []).length === 1,
    '100 identical commit-binding reconciles retain exactly one listener'
  );
  await firstDynamicTarget.dispatch('click', createFakeEvent('click', {
    target: firstDynamicTarget,
    detail: { value: 'first' }
  }));
  context.assert(
    dynamicCommands.length === 1
      && dynamicCommands[0].command.command === 'app.dynamic-command'
      && dynamicCommands[0].command.payload.value === 'first',
    'commit binding listener dispatches exclusively through dispatchCommand'
  );
  const movedDynamicReconcile = dynamicRuntime.reconcile(dynamicScopeRoot, dynamicCommit([
    dynamicBinding(secondDynamicTarget, 'app.dynamic-command-v2')
  ], [{ bindingId: 'binding.dynamic-command', target: firstDynamicTarget }]));
  context.assert(
    movedDynamicReconcile.attachedCount === 1
      && movedDynamicReconcile.detachedCount === 1
      && (firstDynamicTarget.listeners.get('click') || []).length === 0
      && (secondDynamicTarget.listeners.get('click') || []).length === 1,
    'commit binding reconcile diffs stable binding ID plus actual target identity'
  );
  await secondDynamicTarget.dispatch('click', createFakeEvent('click', {
    target: secondDynamicTarget,
    detail: { value: 'second' }
  }));
  context.assert(
    dynamicCommands.length === 2 && dynamicCommands[1].command.command === 'app.dynamic-command-v2',
    'retargeted commit binding routes the updated command definition'
  );
  const clearedDynamicReconcile = dynamicRuntime.reconcile(dynamicScopeRoot, dynamicCommit([], [
    { bindingId: 'binding.dynamic-command', target: secondDynamicTarget }
  ]));
  context.assert(
    clearedDynamicReconcile.detachedCount === 1
      && dynamicRuntime.listBindings().length === 0
      && (secondDynamicTarget.listeners.get('click') || []).length === 0,
    'complete commit scope removes stale dynamic bindings and listeners'
  );
  const dynamicDispose = dynamicRuntime.dispose();
  context.assert(dynamicDispose.detachedCount === 0, 'dynamic router dispose is safe after a cleared binding scope');

  context.assert(
    runtime.listDiagnostics().filter((entry) => entry.code === 'rmt.event.run-action.legacy-compatibility').length === 1,
    'runAction compatibility is diagnosed once while dispatchCommand remains canonical'
  );
}

async function runRmtEventRoutingRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-event-routing-runtime',
    label: 'Epic 18 RMT event routing runtime'
  });
  const plan = createRmtEventRoutingRuntimePlan({ rootDir });
  const validation = validateRmtEventRoutingRuntimePlan(plan);
  const report = createRmtEventRoutingRuntimeReport({ rootDir, plan });
  const fixture = readJson(RMT_EVENT_ROUTING_RUNTIME_FIXTURE, rootDir);
  const docs = readText(RMT_EVENT_ROUTING_RUNTIME_DOCS, rootDir);
  const workpackageDoc = readText(RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('development/docs-evidence/root/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const xtendrmtPackage = readJson('xtendrmt/package.json', rootDir);
  const runtimeSource = readText(RMT_EVENT_ROUTING_RUNTIME_RUNTIME, rootDir);
  const templateInteractionSource = readText('xtendrmt/kernel/modules/rmt-template-interaction-adapter.js', rootDir);
  const xtendComponentAdapterSource = readText('xtendrmt/kernel/modules/rmt-xtend-component-adapter.js', rootDir);
  const typeSource = readText(RMT_EVENT_ROUTING_RUNTIME_TYPES, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_EVENT_ROUTING_RUNTIME_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_EVENT_ROUTING_RUNTIME_SUITE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_EVENT_ROUTING_RUNTIME_RUNTIME, { rootDir, extension: '.js' });
  const stateRuntimeModule = await loadStateRuntimeModule(rootDir);
  const actionRuntimeModule = await loadActionRuntimeModule(rootDir);
  const eventRuntimeModule = await loadEventRuntimeModule(rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-09 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-09 doc`);
  });

  context.assert(moduleSyntax.ok, `Event routing runtime contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Event routing runtime suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `Event routing runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(plan.schema === RMT_EVENT_ROUTING_RUNTIME_SCHEMA, 'Event routing runtime schema is stable');
  context.assert(plan.reportSchema === RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA, 'Event routing runtime report schema is stable');
  context.assert(plan.fixtureSchema === RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA, 'Event routing runtime fixture schema is stable');
  context.assert(plan.actionEffectRuntimeSchema === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Event routing runtime builds on action effect runtime');
  context.assert(plan.workpackage === RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE, 'Event routing runtime belongs to WP-E18-09');
  context.assert(plan.status === RMT_EVENT_ROUTING_RUNTIME_STATUS, 'Event routing runtime status is accepted');
  context.assert(plan.targetReadiness === RMT_EVENT_ROUTING_RUNTIME_TARGET, 'Event routing runtime target is ready');
  context.assert(plan.localGate === RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE, 'Event routing runtime local gate is stable');
  context.assert(plan.packageScript === RMT_EVENT_ROUTING_RUNTIME_PACKAGE_SCRIPT, 'Event routing runtime package script is stable');
  context.assert(validation.ok === true, 'Event routing runtime plan validates');
  context.assert(report.ok === true, 'Event routing runtime report validates');
  context.assert(report.closestDelegationRequired === false, 'Event routing runtime does not require closest delegation');
  context.assert(report.diagnosticsExposeSourceComponentPayloadAction === true, 'Event routing runtime reports diagnostic detail contract');
  assertIncludesAll(context, plan.eventCapabilities, REQUIRED_EVENT_CAPABILITIES, 'required event capabilities');
  assertIncludesAll(context, plan.eventKinds, REQUIRED_EVENT_KINDS, 'required event kinds');
  assertIncludesAll(context, plan.governancePolicies, REQUIRED_GOVERNANCE_POLICIES, 'required governance policies');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'required event boundaries');

  context.assert(fixture.kind === 'rmt_document', 'Event routing fixture is an RMT document');
  context.assert(fixture.schema === RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA, 'Event routing fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_EVENT_ROUTING_RUNTIME_SCHEMA, 'Event routing fixture declares contract');
  context.assert(fixture.manifest.metadata.actionEffectContract === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Event routing fixture declares action effect contract');
  context.assert(fixture.manifest.metadata.stateSelectorContract === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'Event routing fixture declares state selector contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE, 'Event routing fixture is owned by WP-E18-09');
  context.assert(fixture.manifest.metadata.productEventFrameworkAllowed === false, 'Event routing fixture disallows product event frameworks');
  context.assert(fixture.acceptance.domAndCustomEvents === true, 'Event routing acceptance covers DOM and custom events');
  context.assert(fixture.acceptance.eventToActionMapping === true, 'Event routing acceptance covers action mapping');
  context.assert(fixture.acceptance.ownerScopedListenerCleanup === true, 'Event routing acceptance covers owner cleanup');
  context.assert(fixture.acceptance.productLocalClosestDelegationAllowed === false, 'Event routing acceptance disallows product closest delegation');
  assertFixtureGraph(context, fixture);
  await runRuntimeAssertions(context, fixture, stateRuntimeModule, actionRuntimeModule, eventRuntimeModule);
  await assertCanonicalTemplateBindingOwnership(context, rootDir, eventRuntimeModule);
  context.assert(
    templateInteractionSource.includes('routeBindingSession')
      && templateInteractionSource.includes('eventRouter.reconcile')
      && templateInteractionSource.includes('getApplicationBindingCommitResult'),
    'template interaction adapter reconciles renderer binding records through the Event Router port'
  );
  context.assert(
    xtendComponentAdapterSource.includes('reconcileApplicationBindings')
      && !xtendComponentAdapterSource.includes('dispatchXtendComponentDomEvent')
      && !xtendComponentAdapterSource.includes('modelCommandPort')
      && !/dispatchEvent\s*:\s*\(/u.test(xtendComponentAdapterSource),
    'XTend component output adapter has no private application-event or model-write path'
  );

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtEventRoutingRuntime',
    'routeEvent',
    'attach',
    'reconcile',
    'detachOwner',
    'dispose',
    'payload_contract',
    'preventDefault',
    'stopPropagation',
    'composedPath',
    'cancel-action'
  ], 'Event routing runtime source');
  context.assert(!/components\/|xtend-loader|api\.js/u.test(runtimeSource), 'Event routing runtime avoids XTend UI imports');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(runtimeSource), 'Event routing runtime contains no HTML sinks');
  context.assert(!/\.closest\s*\(/u.test(runtimeSource), 'Event routing runtime does not rely on closest delegation');
  context.assert(runtimeSource.includes('resolveEventDomRenderer') && runtimeSource.includes("operation: 'merge-element'"), 'Event Router post-actions use the shared DOM renderer');
  context.assert(
    runtimeSource.includes('normalizeCommitBindings')
      && runtimeSource.includes('commitResult.bindings')
      && runtimeSource.includes('bindingScope'),
    'Event Router reconciles scoped application bindings from DOM commit results'
  );
  context.assert(runtimeSource.includes('rmt.event.run-action.legacy-compatibility'), 'runAction remains only as diagnosed compatibility');
  context.assert(!/target\\.value\\s*=/u.test(runtimeSource), 'Event Router contains no direct input value writer');
  assertTextIncludesAll(context, typeSource, [
    'RmtEventRoutingRuntime',
    'RmtEventBindingDefinition',
    'RmtEventGovernance',
    'RmtPayloadContract',
    'RmtEventRouteResult',
    'RmtEventReconcileReport',
    'RmtEventDomCommitResult',
    'RmtEventCommitBindingScope',
    'RmtEventDisposeReport',
    'createRmtEventRoutingRuntime'
  ], 'Event routing runtime types');
  assertTextIncludesAll(context, docs, [
    '# RMT Event Routing Runtime',
    RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
    'Payload Contracts',
    'Event Governance',
    NEXT_WORKPACKAGE
  ], 'Event routing runtime docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE,
    RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
    RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-09 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-09` | P1 | completed'), 'Backlog marks WP-E18-09 completed');
  context.assert(backlog.includes('| `WP-E18-10` | P1 | completed'), 'Backlog marks WP-E18-10 completed after surface graph handoff');
  context.assert(epic.includes('| `WP-E18-09` | P1 | completed'), 'Epic marks WP-E18-09 completed');
  context.assert(epic.includes('rmt-event-routing-runtime'), 'Epic gate chain includes event routing runtime gate');
  context.assert(runner.hasImplementation({ path: "tests/rmt/rmt_event_routing_runtime_suite.js" }), 'Runner imports event routing runtime suite');
  context.assert(runner.hasSuite("rmt-event-routing-runtime"), 'Runner registers event routing runtime suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-event-routing-runtime'] === 'node scripts/run_xtend_tests.js rmt-event-routing-runtime', 'Package exposes event routing runtime script');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/event-routing-runtime'], 'Package exports event routing runtime');
  context.assert(xtendrmtPackage.exports && xtendrmtPackage.exports['./event-routing-runtime'], 'XTendRMT package exports event routing runtime');
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtEventRoutingRuntime;
  context.assert(metadata && metadata.schema === RMT_EVENT_ROUTING_RUNTIME_SCHEMA, 'Package metadata exposes event routing runtime schema');
  context.assert(metadata && metadata.localGate === RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE, 'Package metadata exposes event routing runtime local gate');
  context.assert(metadata && metadata.eventKinds.includes('custom'), 'Package metadata exposes event kinds');
  context.assert(metadata && metadata.governancePolicies.includes('preventDefault'), 'Package metadata exposes governance policies');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-10 handoff');

  return context.result({
    schema: RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA,
    fixture: RMT_EVENT_ROUTING_RUNTIME_FIXTURE,
    eventCapabilityCount: REQUIRED_EVENT_CAPABILITIES.length,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtEventRoutingRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT Event Routing Runtime erfolgreich.',
    failureTitle: 'Epic 18 RMT Event Routing Runtime fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtEventRoutingRuntimeSuite()
    .then((result) => {
      printRmtEventRoutingRuntimeReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtEventRoutingRuntimeReport,
  runRmtEventRoutingRuntimeSuite
};
