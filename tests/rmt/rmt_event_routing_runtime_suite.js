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
    stateRuntime,
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
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const xtendrmtPackage = readJson('xtendrmt/package.json', rootDir);
  const runtimeSource = readText(RMT_EVENT_ROUTING_RUNTIME_RUNTIME, rootDir);
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

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtEventRoutingRuntime',
    'routeEvent',
    'attach',
    'detachOwner',
    'payload_contract',
    'preventDefault',
    'stopPropagation',
    'composedPath',
    'cancel-action'
  ], 'Event routing runtime source');
  context.assert(!/components\/|xtend-loader|api\.js/u.test(runtimeSource), 'Event routing runtime avoids XTend UI imports');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(runtimeSource), 'Event routing runtime contains no HTML sinks');
  context.assert(!/\.closest\s*\(/u.test(runtimeSource), 'Event routing runtime does not rely on closest delegation');
  assertTextIncludesAll(context, typeSource, [
    'RmtEventRoutingRuntime',
    'RmtEventBindingDefinition',
    'RmtEventGovernance',
    'RmtPayloadContract',
    'RmtEventRouteResult',
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
  context.assert(runner.includes("require('../tests/rmt/rmt_event_routing_runtime_suite')"), 'Runner imports event routing runtime suite');
  context.assert(runner.includes("id: 'rmt-event-routing-runtime'"), 'Runner registers event routing runtime suite');
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
