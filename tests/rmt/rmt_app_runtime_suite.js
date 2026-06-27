const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  getTemplateRegistry
} = require('../../xtend-builder/templates/registry');

const RMT_APP_RUNTIME_MODULE = 'xtendrmt/rmt-app-runtime.js';
const RMT_APP_RUNTIME_TYPES = 'xtendrmt/rmt-app-runtime.d.ts';
const RMT_APP_RUNTIME_FIXTURE = 'tests/rmt-language/fixtures/vnext-app-runtime-chat.rmt';
const COMPONENT_COMMAND_HELPER = 'components/rmt-command.js';
const RMT_APP_RUNTIME_SCHEMA = 'xtend.rmt.app-runtime.v1';
const RMT_COMMAND_SCHEMA = 'xtend.rmt.command.v1';
const RMT_STREAM_PATCH_SCHEMA = 'xtend.rmt.stream-patch.v1';
const RMT_VIEW_TEMPLATE_SCHEMA = 'xtend.rmt.view-template.v1';

let appRuntimeModulePromise = null;
let stateRuntimeModulePromise = null;
let actionRuntimeModulePromise = null;
let eventRuntimeModulePromise = null;
let rendererModulePromise = null;
let fabricModulePromise = null;
let kernelControllerModulePromise = null;
let componentCommandHelperPromise = null;

function loadAppRuntimeModule(rootDir) {
  if (!appRuntimeModulePromise) appRuntimeModulePromise = import(`file://${resolveRepoPath(RMT_APP_RUNTIME_MODULE, rootDir)}`);
  return appRuntimeModulePromise;
}

function loadStateRuntimeModule(rootDir) {
  if (!stateRuntimeModulePromise) stateRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-state-selector-runtime.js', rootDir)}`);
  return stateRuntimeModulePromise;
}

function loadActionRuntimeModule(rootDir) {
  if (!actionRuntimeModulePromise) actionRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-action-effect-runtime.js', rootDir)}`);
  return actionRuntimeModulePromise;
}

function loadEventRuntimeModule(rootDir) {
  if (!eventRuntimeModulePromise) eventRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-event-routing-runtime.js', rootDir)}`);
  return eventRuntimeModulePromise;
}

function loadRendererModule(rootDir) {
  if (!rendererModulePromise) rendererModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir)}`);
  return rendererModulePromise;
}

function loadFabricModule(rootDir) {
  if (!fabricModulePromise) fabricModulePromise = import(`file://${resolveRepoPath('fabric/xtend-fabric.js', rootDir)}`);
  return fabricModulePromise;
}

function loadKernelControllerModule(rootDir) {
  if (!kernelControllerModulePromise) kernelControllerModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-kernel-orchestration-controller.js', rootDir)}`);
  return kernelControllerModulePromise;
}

function loadComponentCommandHelper(rootDir) {
  if (!componentCommandHelperPromise) componentCommandHelperPromise = import(`file://${resolveRepoPath(COMPONENT_COMMAND_HELPER, rootDir)}`);
  return componentCommandHelperPromise;
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
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

function textContent(root) {
  if (!root) return '';
  if (root.nodeType === 3) return root.textContent || '';
  return (root.childNodes || []).map(textContent).join('');
}

function flattenNodes(root, result = []) {
  if (!root) return result;
  result.push(root);
  (root.childNodes || []).forEach((child) => flattenNodes(child, result));
  return result;
}

function createFakeEvent(type, detail, target = null) {
  return {
    type,
    detail,
    target,
    currentTarget: target,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {},
    stopImmediatePropagation() {},
    composedPath() {
      return [target].filter(Boolean);
    }
  };
}

function createFakeKernelApi() {
  return {
    createRmtPerformanceRuntime() {
      const scheduled = [];
      return {
        scheduleEndpoint(endpointName, scope, callback, options = {}) {
          const targetResult = typeof callback === 'function'
            ? callback({ endpointName, scope, options })
            : undefined;
          scheduled.push({ endpointName, scope });
          return {
            status: 'ok',
            handle: { targetResult }
          };
        },
        listScheduledEndpoints() {
          return scheduled.slice();
        }
      };
    },
    createRmtStateSchedulerDiagnosticsBridge({ performanceRuntime }) {
      return {
        scheduleEndpoint: performanceRuntime.scheduleEndpoint.bind(performanceRuntime),
        listScheduledEndpoints: performanceRuntime.listScheduledEndpoints.bind(performanceRuntime)
      };
    },
    createRmtCore() {
      return { getCapabilities: () => [] };
    },
    createRmtRuntime() {
      return { schema: 'xtend.rmt.fake-kernel-runtime.v1' };
    }
  };
}

async function runSourceToSeaAssertions(context, rootDir) {
  const [
    appRuntimeModule,
    stateRuntimeModule,
    actionRuntimeModule,
    eventRuntimeModule,
    rendererModule,
    fabricModule,
    kernelControllerModule,
    componentCommandHelper
  ] = await Promise.all([
    loadAppRuntimeModule(rootDir),
    loadStateRuntimeModule(rootDir),
    loadActionRuntimeModule(rootDir),
    loadEventRuntimeModule(rootDir),
    loadRendererModule(rootDir),
    loadFabricModule(rootDir),
    loadKernelControllerModule(rootDir),
    loadComponentCommandHelper(rootDir)
  ]);

  const sourceText = readText(RMT_APP_RUNTIME_FIXTURE, rootDir);
  const compileResult = compileRmtVNextSource({
    text: sourceText,
    filePath: resolveRepoPath(RMT_APP_RUNTIME_FIXTURE, rootDir)
  });
  context.assert(compileResult.ok === true, `app-runtime chat fixture compiles${compileResult.ok ? '' : ` (${compileResult.diagnostics.map((entry) => entry.message).join('; ')})`}`);
  context.assert(JSON.stringify(compileResult.coreDocument).includes('xtend-command'), 'compiled fixture preserves xtend-command event binding');
  context.assert(sourceText.includes('transcriptKind "messages"') && sourceText.includes('richTextKind "segments"'), 'source fixture declares collection and rich-text ownership markers');

  const fakeButtonHost = {
    id: 'chat-send',
    localName: 'x-button',
    dataset: { label: 'Send' },
    textContent: 'Send',
    getAttribute(name) {
      return name === 'command' ? 'app.runtime.chat.send' : null;
    }
  };
  const helperEnvelope = componentCommandHelper.createXtendRmtCommandDetail(fakeButtonHost, 'click', { value: 'from helper' }, {
    clock: () => 1700000000000,
    payloadBase: componentCommandHelper.createXtendButtonPayloadBase
  });
  context.assert(helperEnvelope.schema === RMT_COMMAND_SCHEMA, 'shared component command helper emits canonical schema');
  context.assert(helperEnvelope.source.id === 'chat-send' && helperEnvelope.source.event === 'click', 'shared component command helper preserves source fields');
  context.assert(helperEnvelope.payload.label === 'Send' && helperEnvelope.payload.value === 'from helper', 'shared component command helper preserves payload base and event payload');
  [
    'components/xbutton.js',
    'components/xinput.js',
    'components/xtextarea.js',
    'components/xdialog.js',
    'components/xtabs.js',
    'components/xmenu.js',
    'components/xstatus.js'
  ].forEach((relativePath) => {
    const source = readText(relativePath, rootDir);
    context.assert(source.includes('createXtendRmtCommandDetail'), `${relativePath} uses the shared command helper`);
    context.assert(!/function\s+createRmtCommandDetail/u.test(source), `${relativePath} does not carry private command envelope construction`);
  });

  const fabricApi = fabricModule.createXtendFabric ? fabricModule : fabricModule.default;
  const fabric = fabricApi.createXtendFabric({ idPrefix: 'rmt.app-runtime.test' });
  const hostCalls = [];
  const stateRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [
      {
        id: 'app.runtime.chat.shell',
        type: 'object',
        initial: {
          id: 'chat-shell',
          text: 'Ready',
          tone: 'neutral',
          messages: [],
          conversations: [],
          sources: [],
          segments: []
        }
      },
      {
        id: 'app.runtime.chat.status',
        type: 'object',
        initial: { status: 'idle', action: '' }
      }
    ],
    selectors: [
      { id: 'app.runtime.chat.shell', state: 'app.runtime.chat.shell' },
      { id: 'app.runtime.chat.status', state: 'app.runtime.chat.status' }
    ]
  });
  const hostServices = appRuntimeModule.createRmtHostServiceRegistry({
    services: [
      { id: 'llm.generate', adapter: 'llm.generate', mode: 'invoke' }
    ],
    adapters: {
      'llm.generate': {
        invoke(request) {
          hostCalls.push(request);
          const promptValue = request.payload && request.payload.value
            || request.context && request.context.commandEnvelope && request.context.commandEnvelope.payload && request.context.commandEnvelope.payload.value
            || 'Hello from source-to-sea';
          return {
            text: 'Ready',
            tone: 'success',
            messages: [
              {
                id: 'user-1',
                role: 'user',
                title: 'User',
                text: promptValue
              },
              {
                id: 'assistant-1',
                role: 'assistant',
                title: 'Assistant',
                text: 'Mock streamed response.',
                segments: [
                  { kind: 'text', text: 'Mock streamed response with ' },
                  { kind: 'code', lang: 'js', text: 'console.log("ok")' },
                  { kind: 'citation', label: '[1]', href: 'https://example.test/source' }
                ]
              }
            ],
            conversations: [{ id: 'local', title: 'Local chat', text: '2 messages' }],
            sources: [{ id: 'source-1', title: 'Mock source', url: 'https://example.test/source', snippet: 'Fixture citation' }],
            segments: [
              { kind: 'text', text: 'Bridge ' },
              { kind: 'code', lang: 'js', text: 'console.log("ok")' },
              { kind: 'citation', label: '[1]', href: 'https://example.test/source' }
            ]
          };
        }
      }
    }
  });
  const actionRuntime = actionRuntimeModule.createRmtActionEffectRuntime({
    actions: [
      {
        id: 'app.runtime.chat.send',
        datasource: 'datasource.generate',
        statusState: 'app.runtime.chat.status',
        reducers: [{
          state: 'app.runtime.chat.shell',
          patch: {
            text: '$payload.text',
            tone: '$payload.tone',
            messages: '$payload.messages',
            conversations: '$payload.conversations',
            sources: '$payload.sources',
            segments: '$payload.segments'
          }
        }]
      }
    ],
    dataSources: [
      { id: 'datasource.generate', kind: 'host-service', adapter: 'llm.generate' }
    ],
    stateRuntime,
    hostServiceRegistry: hostServices
  });
  const appRuntime = appRuntimeModule.createRmtAppRuntime({
    actionRuntime,
    hostServices,
    fabric,
    initialState: {
      stream: { text: '', tools: [] }
    }
  });
  const eventRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [
      {
        id: 'event.send',
        event: 'xtend-command',
        target: '#chat-send',
        component: 'x-button',
        action: 'app.runtime.chat.send',
        owner: 'scope.chat',
        payload: '$detail.payload',
        payloadContract: {
          type: 'object',
          required: ['value'],
          properties: { value: 'string' }
        }
      }
    ],
    actionRuntime: appRuntime
  });
  const command = appRuntimeModule.createRmtCommandEnvelope({
    source: { kind: 'component', id: 'chat-send', event: 'xtend-command', surfaceId: 'app.runtime.chat.send' },
    command: 'app.runtime.chat.send',
    payload: { value: 'Hello from source-to-sea' }
  });
  const routeResult = await eventRuntime.routeEvent('event.send', createFakeEvent('xtend-command', command));
  context.assert(routeResult.commandEnvelope && routeResult.commandEnvelope.schema === RMT_COMMAND_SCHEMA, 'event routing produces canonical command envelope');
  context.assert(routeResult.status === 'dispatched' || routeResult.status === 'success', 'xtend-command routes through app runtime');
  context.assert(appRuntime.listCommands().length === 1, 'app runtime records exactly one command dispatch');
  context.assert(hostCalls.length === 1, 'host service receives one business logic invocation');
  await appRuntime.command('app.runtime.chat.send', { value: 'Facade dispatch' }, {
    sourceKind: 'business-adapter',
    sourceId: 'test.business-adapter',
    lane: 'user-blocking'
  });
  context.assert(appRuntime.listCommands().length === 2, 'appRuntime.command creates an envelope and routes through the scheduled command path');
  context.assert(hostCalls.length === 2 && hostCalls[1].payload.value === 'Facade dispatch', 'appRuntime.command forwards payload to host service');

  const kernelController = kernelControllerModule.createRmtKernelOrchestrationController({
    kernelApi: createFakeKernelApi(),
    artifact: compileResult.orchestrationArtifacts.kernel,
    plan: {
      enabled: true,
      mode: 'strict',
      status: 'ready',
      strict: true,
      summary: compileResult.orchestrationArtifacts.kernel.summary || {}
    },
    strict: true
  });
  kernelController.boot();
  const scheduledActionRuntime = {
    runAction(actionId, payload, metadata = {}) {
      return kernelController.scheduleWork('action', () => ({
        schema: 'xtend.rmt.kernel-scheduled-action-proof.v1',
        status: 'success',
        action: actionId,
        payload
      }), {
        operation: `operation:xtend.rmt/action/${actionId}`,
        action: actionId,
        correlationId: metadata.correlationId || ''
      });
    }
  };
  const kernelScheduledAppRuntime = appRuntimeModule.createRmtAppRuntime({
    actionRuntime: scheduledActionRuntime,
    hostServices
  });
  const kernelCommand = appRuntimeModule.createRmtCommandEnvelope({
    source: { kind: 'component', id: 'chat-send', event: 'xtend-command', surfaceId: 'app.runtime.chat.send' },
    command: 'app.runtime.chat.send',
    payload: { value: 'kernel scheduled' }
  });
  await kernelController.scheduleWork('event', () => kernelScheduledAppRuntime.dispatchCommand(kernelCommand, {
    eventName: 'xtend-command'
  }), {
    operation: 'operation:xtend.maraca/orchestration/event',
    action: kernelCommand.command,
    correlationId: kernelCommand.correlationId
  });
  const kernelFibers = kernelController.snapshot().fibers.filter((entry) => entry.correlationId === kernelCommand.correlationId);
  context.assert(kernelFibers.some((entry) => entry.kind === 'event' && String(entry.fiber || '').includes('/orchestration/event')), 'kernel records generic event fiber for direct app-runtime command dispatch');
  context.assert(kernelFibers.some((entry) => entry.kind === 'action' && String(entry.fiber || '').includes('/action/app.runtime.chat.send')), 'kernel records action fiber after app-runtime command dispatch');

  const shellState = stateRuntime.getState('app.runtime.chat.shell');
  context.assert(shellState.tone === 'success', 'host service result updates RMT state through reducer');
  context.assert(Array.isArray(shellState.messages) && shellState.messages.length === 2, 'RMT state owns transcript messages');
  context.assert(Array.isArray(shellState.sources) && shellState.sources.length === 1, 'RMT state owns citation sources');

  appRuntime.applyStreamPatch({ type: 'delta', target: 'stream.text', delta: 'tok', correlationId: command.correlationId });
  appRuntime.applyStreamPatch({ type: 'tool-call', target: 'stream.tools', toolCall: { id: 'tool-1', name: 'web_search' }, correlationId: command.correlationId });
  appRuntime.applyStreamPatch({ type: 'tool-result', target: 'stream.tools', toolResult: { id: 'tool-1', text: 'result' }, correlationId: command.correlationId });
  const streamState = appRuntime.getState();
  context.assert(streamState.stream.text === 'tok', 'stream delta patch appends generated text');
  context.assert(streamState.stream.tools.length === 1 && streamState.stream.tools[0].text === 'result', 'tool-call and tool-result patches upsert tool records');
  context.assert(appRuntime.listStreamPatches().every((entry) => entry.schema === RMT_STREAM_PATCH_SCHEMA), 'stream patch history uses canonical schema');
  delete Object.prototype.xtendPollutedStream;
  delete Object.prototype.xtendPollutedReducer;
  delete Object.prototype.xtendPollutedRuntime;
  const unsafeStreamState = appRuntimeModule.applyRmtStreamPatch({}, {
    type: 'complete',
    target: '__proto__.xtendPollutedStream',
    value: 'polluted'
  });
  context.assert({}.xtendPollutedStream === undefined && !Object.prototype.hasOwnProperty.call(unsafeStreamState, 'xtendPollutedStream'), 'stream patch paths reject prototype pollution segments');
  const unsafeReducerState = appRuntimeModule.applyRmtReducer({}, {
    op: 'set',
    path: 'constructor.prototype.xtendPollutedReducer',
    value: 'polluted'
  });
  context.assert({}.xtendPollutedReducer === undefined && !Object.prototype.hasOwnProperty.call(unsafeReducerState, 'xtendPollutedReducer'), 'reducer paths reject prototype pollution segments');
  await appRuntime.handleStreamPatch({
    type: 'complete',
    target: 'prototype.xtendPollutedRuntime',
    value: 'polluted'
  });
  context.assert({}.xtendPollutedRuntime === undefined && appRuntime.getState().prototype === undefined, 'runtime stream handlers reject prototype pollution segments');
  delete Object.prototype.xtendPollutedStream;
  delete Object.prototype.xtendPollutedReducer;
  delete Object.prototype.xtendPollutedRuntime;

  appRuntime.applyRecipe({ recipe: 'open-dialog', path: 'ui.settingsDialog' });
  appRuntime.applyRecipe({ recipe: 'toggle-menu', path: 'ui.toolMenu' });
  appRuntime.applyRecipe({ recipe: 'dirty-draft', draftPath: 'ui.settingsDraft.instructions', dirtyPath: 'ui.settingsDirty', value: 'be concise' });
  appRuntime.applyRecipe({ recipe: 'clear-error', path: 'ui.error' });
  const recipeState = appRuntime.getState();
  context.assert(recipeState.ui.settingsDialog.open === true && recipeState.ui.settingsDialog.hidden === false, 'reducer recipe opens dialogs without product state repair');
  context.assert(recipeState.ui.toolMenu.open === true && recipeState.ui.settingsDirty === true, 'reducer recipes cover menu toggles and dirty drafts');
  context.assert(recipeState.ui.error.hidden === true && recipeState.ui.error.error === null, 'reducer recipe clears error state');

  appRuntime.applyReducer({
    op: 'set',
    path: 'ui.choiceMenu',
    value: {
      id: 'tool-menu',
      open: false,
      disabled: false,
      activeTool: 'auto',
      items: [
        { value: 'auto', label: 'Auto', triggerLabel: 'Use tool', activeAttr: '' },
        { value: 'web_search', label: 'Web search', triggerLabel: 'Web search', activeAttr: 'web_search' }
      ]
    }
  });
  appRuntime.applyRecipe({ recipe: 'toggle-choice-menu', path: 'ui.choiceMenu' });
  appRuntime.applyRecipe({ recipe: 'select-choice-menu', path: 'ui.choiceMenu', value: 'web_search' });
  let choiceMenuState = appRuntime.getState().ui.choiceMenu;
  context.assert(choiceMenuState.open === false && choiceMenuState.activeTool === 'web_search', 'choice-menu select closes and stores active value in RMT state');
  context.assert(choiceMenuState.activeToolLabel === 'Web search' && choiceMenuState.activeToolAttr === 'web_search', 'choice-menu projects trigger label and data-active-tool');
  appRuntime.applyRecipe({ recipe: 'toggle-choice-menu', path: 'ui.choiceMenu' });
  appRuntime.applyRecipe({ recipe: 'select-choice-menu', path: 'ui.choiceMenu', value: 'auto' });
  choiceMenuState = appRuntime.getState().ui.choiceMenu;
  context.assert(choiceMenuState.activeTool === 'auto' && choiceMenuState.activeToolLabel === 'Use tool' && choiceMenuState.activeToolAttr === '', 'choice-menu reset projects Use tool and empty data-active-tool');
  appRuntime.applyReducer({ op: 'patch', path: 'ui.choiceMenu', value: { disabled: true, open: false } });
  appRuntime.applyRecipe({ recipe: 'toggle-choice-menu', path: 'ui.choiceMenu' });
  context.assert(appRuntime.getState().ui.choiceMenu.open === false, 'choice-menu disabled toggle is a no-op');
  appRuntime.applyRecipe({ recipe: 'select-choice-menu', path: 'ui.choiceMenu', value: 'missing' });
  context.assert(appRuntime.listDiagnostics().some((entry) => entry.code === 'rmt.choice_menu.invalid_value'), 'choice-menu invalid value publishes a framework diagnostic');

  const lifecycleCalls = [];
  const lifecycleHostServices = appRuntimeModule.createRmtHostServiceRegistry({
    services: [{ id: 'llm.stream', adapter: 'llm.stream', mode: 'stream' }],
    adapters: {
      'llm.stream': {
        async stream(_request, handlers) {
          await handlers.onStart?.(null);
          await handlers.onDelta?.('A');
          await handlers.onDelta?.('B');
          await handlers.onComplete?.(null);
          return { id: 'stream-1', cancel() {} };
        }
      }
    }
  });
  const lifecycleRuntime = appRuntimeModule.createRmtAppRuntime({
    actionRuntime: {
      async runAction(actionId, payload) {
        lifecycleCalls.push({ actionId, payload });
        return { status: 'success' };
      }
    },
    hostServices: lifecycleHostServices,
    fabric,
    initialState: { generation: { text: '' } },
    streamLifecycleActions: {
      complete: 'generation.complete',
      error: 'generation.error',
      cancel: 'generation.cancel'
    }
  });
  await lifecycleRuntime.streamService('llm.stream', { prompt: 'hello' }, {
    streamId: 'stream-1',
    target: 'generation.text',
    correlationId: 'stream-correlation-1'
  });
  context.assert(lifecycleRuntime.getState().generation.text === 'AB', 'host stream lifecycle applies start/delta patches to correlated RMT state');
  context.assert(lifecycleCalls.some((entry) => entry.actionId === 'generation.complete'), 'host stream complete invokes declared lifecycle action');
  context.assert(lifecycleRuntime.listStreams()[0].patchCount === 4 && lifecycleRuntime.listStreams()[0].finalState === 'complete', 'stream telemetry records patch count and final state');
  lifecycleRuntime.applyStreamPatch({ type: 'delta', streamId: 'stream-1', target: 'generation.text', delta: 'late', correlationId: 'stream-correlation-1' });
  context.assert(lifecycleRuntime.getState().generation.text === 'AB', 'stream delta after terminal state is ignored');
  context.assert(lifecycleRuntime.listDiagnostics().some((entry) => entry.code === 'rmt.stream.patch.after_terminal'), 'stream delta after terminal state emits diagnostic');

  const derivedRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: [{
      id: 'chat.view',
      type: 'object',
      initial: {
        search: 'java',
        activeId: 'chat-2',
        conversations: [
          { id: 'chat-1', title: 'CSS notes' },
          { id: 'chat-2', title: 'JavaScript framework' }
        ],
        messages: [
          { id: 'm1', conversationId: 'chat-1', text: 'css' },
          { id: 'm2', conversationId: 'chat-2', text: 'js' }
        ]
      }
    }],
    selectors: [{
      id: 'selector.filtered-conversations',
      from: 'state.chat.view',
      path: 'conversations',
      filter: { path: 'title', op: 'contains', value: '$state.chat.view.search', ignoreCase: true, empty: 'pass' }
    }, {
      id: 'selector.active-transcript',
      from: 'state.chat.view',
      path: 'messages',
      filter: { path: 'conversationId', op: 'equals', value: '$state.chat.view.activeId' }
    }],
    derived: [
      { id: 'derive.empty-state', from: 'selector.filtered-conversations', compute: 'empty' },
      { id: 'derive.has-active-transcript', from: 'selector.active-transcript', compute: 'not-empty' }
    ]
  });
  const derivedSnapshot = derivedRuntime.snapshot();
  context.assert(derivedRuntime.select('selector.filtered-conversations').length === 1, 'derived selector support expresses filtered conversation lists in RMT');
  context.assert(derivedSnapshot.derived['derive.empty-state'] === false, 'derived selector support expresses empty states in RMT');
  context.assert(derivedRuntime.select('selector.active-transcript')[0].text === 'js' && derivedSnapshot.derived['derive.has-active-transcript'] === true, 'derived selector support expresses active transcript view models in RMT');

  const documentTarget = createFakeDocument();
  const renderer = rendererModule.createRmtDomDescriptorRenderer({ documentTarget });
  const root = createFakeElement('main');
  const descriptor = {
    type: 'element',
    tag: 'section',
    attributes: { 'data-rmt-source-to-sea': 'app-runtime-chat' },
    children: [
      {
        type: 'repeat',
        source: '$model.shell.messages',
        key: 'id',
        template: {
          type: 'element',
          tag: 'article',
          class: 'message',
          children: [
            { type: 'element', tag: 'strong', text: '$item.title' },
            {
              type: 'when',
              when: '$item.segments',
              then: { type: 'rich-text', source: '$item.segments' },
              else: { type: 'element', tag: 'p', text: '$item.text' }
            }
          ]
        }
      },
      { type: 'rich-text', source: '$model.shell.segments' }
    ]
  };
  const renderResult = renderer.render(root, descriptor, { model: { shell: shellState } });
  const renderedText = textContent(root);
  const renderedNodes = flattenNodes(root);
  context.assert(renderResult.nodeCount === 1, 'descriptor renderer owns final DOM root replacement');
  context.assert(renderedText.includes('Facade dispatch') && renderedText.includes('Mock streamed response'), `rendered DOM includes user and assistant transcript (${renderedText})`);
  context.assert(renderedNodes.some((node) => node.tagName === 'X-CODE'), 'rich text renders code through x-code component descriptor');
  context.assert(renderedNodes.some((node) => node.tagName === 'A' && node.getAttribute('data-rmt-rich-segment') === 'citation'), 'rich text renders citation as safe structured link');

  const viewTemplate = appRuntimeModule.createRmtViewTemplateDescriptor({
    schema: RMT_VIEW_TEMPLATE_SCHEMA,
    type: 'rich-text',
    segments: shellState.segments
  });
  context.assert(viewTemplate.schema === RMT_VIEW_TEMPLATE_SCHEMA && viewTemplate.children.length === 3, 'view template API lowers rich text segments to descriptors');

  const choiceMenuTemplate = appRuntimeModule.createRmtViewTemplateDescriptor({
    schema: RMT_VIEW_TEMPLATE_SCHEMA,
    type: 'choice-menu',
    source: '$model.toolMenu',
    buttonId: 'tool-menu-button',
    buttonClass: 'xtend-llm-tool-menu-button',
    optionsId: 'tool-menu-options',
    optionsClass: 'xtend-llm-tool-menu-options',
    itemClass: 'xtend-llm-tool-menu-item',
    toggleCommand: 'xtend.llm.toggleToolMenu',
    selectCommand: 'xtend.llm.selectTool',
    selectPayloadField: 'toolName'
  });
  const choiceRoot = createFakeElement('div');
  renderer.render(choiceRoot, choiceMenuTemplate, {
    model: {
      toolMenu: {
        open: true,
        disabled: false,
        activeTool: 'web_search',
        activeToolLabel: 'Web search',
        activeToolAttr: 'web_search',
        items: [
          { value: 'auto', label: 'Auto' },
          { value: 'web_search', label: 'Web search' }
        ]
      }
    }
  });
  const choiceNodes = flattenNodes(choiceRoot);
  context.assert(choiceMenuTemplate.primitive === 'choice-menu', 'choice-menu view template lowers through a framework primitive marker');
  context.assert(choiceNodes.some((node) => node.getAttribute && node.getAttribute('id') === 'tool-menu-button'), 'choice-menu descriptor renders preserved trigger id');
  context.assert(choiceNodes.some((node) => node.getAttribute && node.getAttribute('data-tool-name') === 'web_search'), 'choice-menu descriptor renders repeated option buttons');

  const legacyRuntime = eventRuntimeModule.createRmtEventRoutingRuntime({
    events: [{
      id: 'event.legacy-click',
      event: 'click',
      target: '#chat-send',
      component: 'x-button',
      action: 'app.runtime.chat.send',
      owner: 'scope.chat',
      payload: { value: 'legacy' },
      payloadContract: { type: 'object', required: ['value'], properties: { value: 'string' } }
    }],
    actionRuntime: appRuntime
  });
  await legacyRuntime.routeEvent('event.legacy-click', createFakeEvent('click', {}));
  context.assert(legacyRuntime.listDiagnostics().some((entry) => entry.code === 'rmt.event.legacy_dom_event'), 'legacy raw click binding emits deprecation diagnostic');

  let missingHostAdapterFailed = false;
  try {
    await appRuntimeModule.createRmtHostServiceRegistry().invoke('missing.adapter', {});
  } catch (_) {
    missingHostAdapterFailed = true;
  }
  context.assert(missingHostAdapterFailed, 'missing host service adapter fails deterministically');

  let unsafeRichTextFailed = false;
  try {
    renderer.renderNode({
      type: 'rich-text',
      segments: [{ kind: 'citation', href: 'javascript:alert(1)', label: 'bad' }]
    });
  } catch (_) {
    unsafeRichTextFailed = true;
  }
  context.assert(unsafeRichTextFailed, 'unsafe rich text citation URL is rejected by descriptor renderer');

  const noManualUiWiringGate = appRuntimeModule.createNoManualUiWiringGate();
  const wiringDiagnostics = noManualUiWiringGate.scanText("document.querySelector('#x').addEventListener('click', () => {})", {
    filePath: 'products/example/src/renderer/app-controller.js'
  });
  context.assert(wiringDiagnostics.length >= 2, 'manual UI wiring gate catches product-owned query and listener sinks');

  const fibers = fabric.getFibers();
  context.assert(fibers.some((fiber) => fiber.kind === 'rmt.command' && fiber.correlationId === command.correlationId), 'Fabric records correlated command fiber');
  const streamDiagnostics = fabric.getDiagnostics().filter((entry) => entry.code === 'xtend.rmt.stream.patch');
  context.assert(streamDiagnostics.some((entry) => entry.metadata && entry.metadata.backpressureSignal), `Fabric records stream patch backpressure diagnostic (${JSON.stringify(streamDiagnostics)})`);
  context.assert(fabric.contracts.appRuntimeFiberInstrumentation === 'xtend.fabric.app-runtime-fiber-instrumentation.v1', 'Fabric exposes app-runtime fiber instrumentation contract');
}

async function runRmtAppRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-app-runtime',
    label: 'RMT full app runtime'
  });
  assertFileExists(context, RMT_APP_RUNTIME_MODULE, rootDir, 'app runtime module exists');
  assertFileExists(context, RMT_APP_RUNTIME_TYPES, rootDir, 'app runtime type declarations exist');
  assertFileExists(context, RMT_APP_RUNTIME_FIXTURE, rootDir, 'app runtime source-to-sea fixture exists');
  assertFileExists(context, COMPONENT_COMMAND_HELPER, rootDir, 'shared component command helper exists');
  const moduleSyntax = syntaxCheckFile(RMT_APP_RUNTIME_MODULE, { rootDir, extension: '.js' });
  const helperSyntax = syntaxCheckFile(COMPONENT_COMMAND_HELPER, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile('tests/rmt/rmt_app_runtime_suite.js', { rootDir, extension: '.js' });
  context.assert(moduleSyntax.ok, `app runtime module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(helperSyntax.ok, `component command helper syntax passes${helperSyntax.ok ? '' : ` (${helperSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `app runtime suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  const moduleText = readText(RMT_APP_RUNTIME_MODULE, rootDir);
  context.assert(moduleText.includes(RMT_APP_RUNTIME_SCHEMA), 'app runtime declares public runtime schema');
  context.assert(moduleText.includes(RMT_COMMAND_SCHEMA), 'app runtime declares public command schema');
  context.assert(moduleText.includes(RMT_STREAM_PATCH_SCHEMA), 'app runtime declares public stream patch schema');
  context.assert(moduleText.includes(RMT_VIEW_TEMPLATE_SCHEMA), 'app runtime declares public view template schema');
  const templateRegistry = getTemplateRegistry();
  const templateIds = new Set(templateRegistry.templates.map((entry) => entry.id));
  context.assert(templateIds.has('app.rmt-owned-chat-shell'), 'scaffold registry exposes RMT-owned chat shell profile');
  context.assert(templateIds.has('app.rmt-owned-business-adapter'), 'scaffold registry exposes business-adapter-only starter profile');
  await runSourceToSeaAssertions(context, rootDir);
  return context.result({
    fixture: RMT_APP_RUNTIME_FIXTURE
  });
}

function printRmtAppRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT full app runtime suite passed.',
    failureTitle: 'RMT full app runtime suite failed:'
  });
}

module.exports = {
  RMT_APP_RUNTIME_FIXTURE,
  RMT_APP_RUNTIME_MODULE,
  RMT_APP_RUNTIME_SCHEMA,
  RMT_COMMAND_SCHEMA,
  RMT_STREAM_PATCH_SCHEMA,
  RMT_VIEW_TEMPLATE_SCHEMA,
  runRmtAppRuntimeSuite,
  printRmtAppRuntimeReport
};
