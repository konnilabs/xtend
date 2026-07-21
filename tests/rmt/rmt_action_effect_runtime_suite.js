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
  REQUIRED_ACTION_CAPABILITIES,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DATASOURCE_KINDS,
  REQUIRED_DOCS,
  REQUIRED_EFFECT_KINDS,
  REQUIRED_RESOURCE_KINDS,
  RMT_ACTION_EFFECT_RUNTIME_DOCS,
  RMT_ACTION_EFFECT_RUNTIME_FIXTURE,
  RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE,
  RMT_ACTION_EFFECT_RUNTIME_MODULE,
  RMT_ACTION_EFFECT_RUNTIME_PACKAGE_SCRIPT,
  RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_RUNTIME,
  RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_STATUS,
  RMT_ACTION_EFFECT_RUNTIME_SUITE,
  RMT_ACTION_EFFECT_RUNTIME_TARGET,
  RMT_ACTION_EFFECT_RUNTIME_TYPES,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC,
  createRmtActionEffectRuntimePlan,
  createRmtActionEffectRuntimeReport,
  validateRmtActionEffectRuntimePlan
} = require('../../catalog/epic18-rmt-action-effect-runtime');
const {
  RMT_STATE_SELECTOR_RUNTIME_SCHEMA
} = require('../../catalog/epic18-rmt-state-selector-runtime');

let actionRuntimeModulePromise = null;
let stateRuntimeModulePromise = null;

function loadActionRuntimeModule(rootDir) {
  if (!actionRuntimeModulePromise) {
    actionRuntimeModulePromise = import(`file://${resolveRepoPath(RMT_ACTION_EFFECT_RUNTIME_RUNTIME, rootDir)}`);
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

function assertFixtureGraph(context, fixture) {
  const states = indexById(fixture.state);
  const dataSources = indexById(fixture.dataSources);
  const effects = indexById(fixture.effects);
  const resources = indexById(fixture.resources);
  const actions = indexById(fixture.actions);
  REQUIRED_DATASOURCE_KINDS.forEach((kind) => {
    context.assert((fixture.dataSources || []).some((entry) => entry.kind === kind), `fixture covers datasource kind ${kind}`);
  });
  REQUIRED_EFFECT_KINDS.forEach((kind) => {
    context.assert((fixture.effects || []).some((entry) => entry.kind === kind), `fixture covers effect kind ${kind}`);
  });
  REQUIRED_RESOURCE_KINDS.forEach((kind) => {
    context.assert((fixture.resources || []).some((entry) => entry.kind === kind), `fixture covers resource kind ${kind}`);
  });
  (fixture.actions || []).forEach((action) => {
    context.assert(actions.has(action.id), `${action.id}: action is indexed`);
    if (action.datasource) context.assert(dataSources.has(action.datasource), `${action.id}: datasource resolves`);
    if (action.resultState) context.assert(states.has(action.resultState), `${action.id}: result state resolves`);
    if (action.loadingState) context.assert(states.has(action.loadingState), `${action.id}: loading state resolves`);
    if (action.statusState) context.assert(states.has(action.statusState), `${action.id}: status state resolves`);
    (action.effects || []).forEach((effectId) => {
      context.assert(effects.has(effectId), `${action.id}: effect resolves ${effectId}`);
    });
    (action.resources || []).forEach((resourceId) => {
      context.assert(resources.has(resourceId), `${action.id}: resource resolves ${resourceId}`);
    });
  });
  ['action.load-items', 'action.rest-search', 'action.bootstrap', 'action.host-mutate', 'action.navigate-detail', 'action.preload-preview', 'action.cancelable-load', 'action.error-flow'].forEach((id) => {
    context.assert(actions.has(id), `fixture action resolves ${id}`);
  });
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'action effect fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'action effect fixture contains no manual HTML sinks');
}

async function runRuntimeAssertions(context, fixture, stateRuntimeModule, actionRuntimeModule) {
  const feedback = [];
  const navigation = [];
  const focusTargets = [];
  const sideEffects = [];
  const objectUrls = [];
  const revokedUrls = [];
  const timers = [];
  const clearedTimers = [];
  const imports = [];
  const streams = [];
  const observers = [];
  const restCalls = [];
  const hostCalls = [];
  const diagnostics = [];
  const pending = createPending();
  let pendingSignal = null;
  let resolvePendingStart;
  const pendingStarted = new Promise((resolve) => { resolvePendingStart = resolve; });
  const stateRuntime = stateRuntimeModule.createRmtStateSelectorRuntime({
    states: fixture.state,
    selectors: fixture.selectors,
    derive: fixture.derive
  });
  const runtime = actionRuntimeModule.createRmtActionEffectRuntime({
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
    focusAdapter: {
      focus(target) {
        focusTargets.push(target);
      }
    },
    effectAdapter: {
      invoke(effect, effectContext) {
        sideEffects.push({ effectId: effect.id, actionId: effectContext.action && effectContext.action.id });
      }
    },
    objectUrlFactory: {
      create(value) {
        const url = `blob:rmt/${objectUrls.length + 1}`;
        objectUrls.push({ url, value });
        return url;
      },
      revoke(url) {
        revokedUrls.push(url);
      }
    },
    importAdapter: {
      load(id) {
        imports.push(id);
        return { id, loaded: true };
      }
    },
    timerAdapter: {
      set(delayMs) {
        const handle = { id: `timer-${timers.length + 1}`, delayMs };
        timers.push(handle);
        return handle;
      },
      clear(handle) {
        clearedTimers.push(handle);
      }
    },
    resourceAdapters: {
      stream: {
        open(resource) {
          const handle = { id: resource.id, open: true };
          streams.push(handle);
          return handle;
        },
        close(handle) {
          handle.open = false;
        }
      },
      observer: {
        open(resource) {
          const handle = { id: resource.id, observing: true };
          observers.push(handle);
          return handle;
        },
        close(handle) {
          handle.observing = false;
        }
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
          hostCalls.push({ adapter: 'host.mutate', payload: request.payload });
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
        invoke(request) {
          hostCalls.push({ adapter: 'host.pending', payload: request.payload });
          pendingSignal = request.context && request.context.signal || null;
          resolvePendingStart();
          return pending.promise;
        }
      },
      'host.error': {
        invoke() {
          throw new Error('host adapter failed');
        }
      }
    },
    diagnosticsHub: {
      publish(channel, payload) {
        diagnostics.push({ channel, payload });
      }
    }
  });

  context.assert(runtime.schema === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'action effect runtime exposes schema');
  context.assert(runtime.listActions().length === fixture.actions.length, 'runtime indexes all fixture actions');
  context.assert(runtime.listDataSources().length === fixture.dataSources.length, 'runtime indexes all fixture data sources');
  context.assert(runtime.listEffects().length === fixture.effects.length, 'runtime indexes all fixture effects');

  const loadResult = await runtime.runAction('action.load-items', { file: { name: 'preview.bin' } });
  context.assert(loadResult.status === 'success', 'fixture datasource action succeeds');
  context.assert(Array.isArray(loadResult.data) && loadResult.data.length === 2, 'fixture datasource returns records');
  context.assert(stateRuntime.getState('state.loading') === false, 'loading state resets after success');
  context.assert(stateRuntime.getState('state.items').length === 2, 'success writes collection state');
  context.assert(stateRuntime.getState('state.action-status').status === 'success', 'success patches status state');
  context.assert(feedback.some((entry) => entry.message === 'Records loaded'), 'toast feedback effect publishes loaded message');
  context.assert(focusTargets.includes('ref.search'), 'focus effect targets search ref');
  context.assert(objectUrls.length === 1, 'object URL resource is acquired');
  context.assert(timers.length === 1, 'timer resource is acquired');
  context.assert(runtime.resourceManager.listOwned('action.load-items').length === 2, 'load action owns acquired resources');
  const releaseLoad = runtime.resourceManager.releaseOwner('action.load-items');
  context.assert(releaseLoad.releasedCount === 2, 'resource manager releases load action resources');
  context.assert(revokedUrls.length === 1, 'object URL resource is revoked on release');
  context.assert(clearedTimers.length === 1, 'timer resource is cleared on release');

  const restResult = await runtime.runAction('action.rest-search', { query: 'alpha' });
  context.assert(restResult.status === 'success', 'REST datasource action succeeds through adapter');
  context.assert(restCalls.length === 1 && restCalls[0].endpoint === '/api/generic-items', 'REST adapter receives endpoint');
  context.assert(stateRuntime.getState('state.items')[0].id === 'rest-alpha', 'REST resultPath writes item list');

  const bootstrapResult = await runtime.runAction('action.bootstrap');
  context.assert(bootstrapResult.status === 'success', 'SSR datasource action succeeds');
  context.assert(stateRuntime.getState('state.bootstrap').hydrated === true, 'SSR resultPath hydrates state');

  const mutateResult = await runtime.runAction('action.host-mutate', {
    id: 'gamma',
    title: 'Gamma'
  });
  context.assert(mutateResult.status === 'success', 'host datasource action succeeds through adapter');
  context.assert(hostCalls.some((entry) => entry.adapter === 'host.mutate'), 'host mutate adapter is invoked');
  context.assert(stateRuntime.getState('state.feedback').id === 'gamma', 'host resultPath writes result state');
  context.assert(feedback.some((entry) => entry.message === 'Gamma'), 'feedback effect resolves result value');
  context.assert(sideEffects.some((entry) => entry.effectId === 'effect.side.audit'), 'side-effect adapter is invoked');
  context.assert(streams.length === 1 && observers.length === 1, 'stream and observer resources are acquired');
  const releaseMutate = runtime.resourceManager.releaseOwner('action.host-mutate');
  context.assert(releaseMutate.releasedCount === 2, 'resource manager releases host action resources');
  context.assert(streams[0].open === false && observers[0].observing === false, 'stream and observer resources close on release');

  const navigationResult = await runtime.runAction('action.navigate-detail', { path: '/items/gamma' });
  context.assert(navigationResult.status === 'success', 'navigation-only action succeeds');
  context.assert(navigation.includes('/items/gamma'), 'navigation effect resolves payload path');

  const preloadResult = await runtime.runAction('action.preload-preview');
  context.assert(preloadResult.status === 'success', 'lazy import action succeeds');
  context.assert(imports.includes('generic-preview-panel'), 'lazy import resource is loaded');
  context.assert(runtime.resourceManager.listOwned('action.preload-preview').length === 1, 'lazy import resource is owned by action');

  const errorResult = await runtime.runAction('action.error-flow');
  context.assert(errorResult.status === 'error', 'host error datasource returns error result');
  context.assert(errorResult.error && errorResult.error.message === 'host adapter failed', 'error result normalizes host error');
  context.assert(stateRuntime.getState('state.loading') === false, 'loading state resets after error');
  context.assert(stateRuntime.getState('state.action-status').status === 'error', 'error patches status state');

  const cancelPromise = runtime.runAction('action.cancelable-load', { file: { name: 'pending.bin' } });
  await pendingStarted;
  const cancelSignal = runtime.cancelAction('action.cancelable-load');
  context.assert(cancelSignal.cancelled === 1, 'cancelAction marks active run');
  context.assert(pendingSignal && pendingSignal.aborted === true, 'cancelAction propagates AbortSignal to the datasource adapter');
  pending.resolve([{ id: 'late', title: 'Late' }]);
  const cancelResult = await cancelPromise;
  context.assert(cancelResult.status === 'cancelled', 'pending action resolves as cancelled');
  context.assert(stateRuntime.getState('state.loading') === false, 'loading state resets after cancel');
  context.assert(stateRuntime.getState('state.action-status').status === 'cancelled', 'cancel patches status state');
  context.assert(runtime.resourceManager.listOwned('action.cancelable-load').length === 0, 'cancel releases action-owned resources');

  context.assert(runtime.getActionStatus('action.load-items') === 'success', 'runtime keeps success status');
  context.assert(runtime.getActionStatus('action.error-flow') === 'error', 'runtime keeps error status');
  context.assert(runtime.getActionStatus('action.cancelable-load') === 'cancelled', 'runtime keeps cancelled status');
  context.assert(runtime.listHistory().length >= 8, 'runtime records action history');
  context.assert(runtime.listDiagnostics().some((entry) => entry.code === 'rmt.action.error'), 'runtime records error diagnostics');
  context.assert(runtime.listDiagnostics().some((entry) => entry.code === 'rmt.action.cancelled'), 'runtime records cancel diagnostics');
  context.assert(diagnostics.some((entry) => entry.channel === 'rmt.app_platform.action_effect'), 'diagnostics hub receives action channel');
}

async function runComponentCommandAssertions(context, actionRuntimeModule) {
  const command = {
    schema: 'xtend.rmt.component-command.v1',
    command: 'snapshot',
    target: {
      kind: 'surface',
      id: 'demo.editor',
      ref: 'surface:demo.commands/demo.editor',
      component: 'x-textarea'
    }
  };
  const invocations = [];
  const runtime = actionRuntimeModule.createRmtActionEffectRuntime({
    actions: [{ id: 'demo.capture', effects: ['effect:demo.capture/0'] }],
    effects: [{
      id: 'effect:demo.capture/0',
      kind: 'snapshot',
      target: 'demo.editor',
      componentCommand: command
    }],
    componentCommandAdapter: {
      invoke(record) {
        invocations.push(record);
        return {
          schema: 'xtend.maraca.component-command-result.v1',
          command: record.command,
          surfaceId: record.target.id,
          component: record.target.component,
          result: { value: 'captured' }
        };
      }
    }
  });
  const result = await runtime.runAction('demo.capture');
  const effectValue = result.effects && result.effects[0] && result.effects[0].value;
  const historyValue = runtime.listHistory()[0].effects[0].value;
  context.assert(result.status === 'success' && invocations.length === 1, 'component command runs through the dedicated adapter');
  context.assert(invocations[0].command === 'snapshot' && invocations[0].target.id === 'demo.editor', 'component command adapter receives the statically compiled command target');
  context.assert(effectValue && effectValue.result && effectValue.result.schema === 'xtend.maraca.component-command-result.v1', 'component command result is exposed at effects[].value.result');
  context.assert(historyValue && historyValue.result && historyValue.result.result.value === 'captured', 'component command result remains visible in action history');

  const deferredRuntime = actionRuntimeModule.createRmtActionEffectRuntime({
    actions: [{ id: 'demo.capture', effects: ['effect:demo.capture/0'] }],
    effects: [{
      id: 'effect:demo.capture/0',
      kind: 'snapshot',
      target: 'demo.editor',
      componentCommand: command
    }],
    deferCustomEffects: true
  });
  const deferredResult = await deferredRuntime.runAction('demo.capture');
  const deferredValue = deferredResult.effects && deferredResult.effects[0] && deferredResult.effects[0].value;
  context.assert(deferredValue && deferredValue.deferred === true, 'Maraca can defer a component command until after render and hydration');
  context.assert(deferredValue && deferredValue.effect && deferredValue.effect.componentCommand.command === 'snapshot', 'deferred component command retains its fixed command contract');

  const invalidRuntime = actionRuntimeModule.createRmtActionEffectRuntime({
    actions: [{ id: 'demo.invalid', effects: ['effect:demo.invalid/0'] }],
    effects: [{
      id: 'effect:demo.invalid/0',
      kind: 'arbitrary',
      componentCommand: { ...command, command: 'arbitrary' }
    }],
    componentCommandAdapter: {
      invoke() {
        throw new Error('invalid component command reached adapter');
      }
    }
  });
  const invalidResult = await invalidRuntime.runAction('demo.invalid');
  context.assert(invalidResult.status === 'error' && invalidResult.error.message.includes('is not allowed'), 'action runtime fail-closes arbitrary component command names');
}

async function runRmtActionEffectRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-action-effect-runtime',
    label: 'Epic 18 RMT action/effect runtime'
  });
  const plan = createRmtActionEffectRuntimePlan({ rootDir });
  const validation = validateRmtActionEffectRuntimePlan(plan);
  const report = createRmtActionEffectRuntimeReport({ rootDir, plan });
  const fixture = readJson(RMT_ACTION_EFFECT_RUNTIME_FIXTURE, rootDir);
  const docs = readText(RMT_ACTION_EFFECT_RUNTIME_DOCS, rootDir);
  const workpackageDoc = readText(RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('development/docs-evidence/root/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const xtendrmtPackage = readJson('xtendrmt/package.json', rootDir);
  const runtimeSource = readText(RMT_ACTION_EFFECT_RUNTIME_RUNTIME, rootDir);
  const typeSource = readText(RMT_ACTION_EFFECT_RUNTIME_TYPES, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_ACTION_EFFECT_RUNTIME_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_ACTION_EFFECT_RUNTIME_SUITE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_ACTION_EFFECT_RUNTIME_RUNTIME, { rootDir, extension: '.js' });
  const actionRuntimeModule = await loadActionRuntimeModule(rootDir);
  const stateRuntimeModule = await loadStateRuntimeModule(rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-08 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-08 doc`);
  });

  context.assert(moduleSyntax.ok, `Action effect runtime contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Action effect runtime suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `Action effect runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(plan.schema === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Action effect runtime schema is stable');
  context.assert(plan.reportSchema === RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA, 'Action effect runtime report schema is stable');
  context.assert(plan.fixtureSchema === RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA, 'Action effect runtime fixture schema is stable');
  context.assert(plan.stateSelectorRuntimeSchema === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'Action effect runtime builds on state selector runtime');
  context.assert(plan.workpackage === RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE, 'Action effect runtime belongs to WP-E18-08');
  context.assert(plan.status === RMT_ACTION_EFFECT_RUNTIME_STATUS, 'Action effect runtime status is accepted');
  context.assert(plan.targetReadiness === RMT_ACTION_EFFECT_RUNTIME_TARGET, 'Action effect runtime target is ready');
  context.assert(plan.localGate === RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE, 'Action effect runtime local gate is stable');
  context.assert(plan.packageScript === RMT_ACTION_EFFECT_RUNTIME_PACKAGE_SCRIPT, 'Action effect runtime package script is stable');
  context.assert(validation.ok === true, 'Action effect runtime plan validates');
  context.assert(report.ok === true, 'Action effect runtime report validates');
  context.assert(report.productActionFrameworkAllowed === false, 'Action effect runtime rejects product action frameworks');
  context.assert(report.resourcesReleaseByOwner === true, 'Action effect runtime reports resource ownership cleanup');
  assertIncludesAll(context, plan.actionCapabilities, REQUIRED_ACTION_CAPABILITIES, 'required action capabilities');
  assertIncludesAll(context, plan.dataSourceKinds, REQUIRED_DATASOURCE_KINDS, 'required datasource kinds');
  assertIncludesAll(context, plan.effectKinds, REQUIRED_EFFECT_KINDS, 'required effect kinds');
  assertIncludesAll(context, plan.resourceKinds, REQUIRED_RESOURCE_KINDS, 'required resource kinds');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'required action boundaries');

  context.assert(fixture.kind === 'rmt_document', 'Action effect fixture is an RMT document');
  context.assert(fixture.schema === RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA, 'Action effect fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Action effect fixture declares contract');
  context.assert(fixture.manifest.metadata.stateSelectorContract === RMT_STATE_SELECTOR_RUNTIME_SCHEMA, 'Action effect fixture declares state selector contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE, 'Action effect fixture is owned by WP-E18-08');
  context.assert(fixture.manifest.metadata.productActionFrameworkAllowed === false, 'Action effect fixture disallows product action frameworks');
  context.assert(fixture.acceptance.loadingSuccessErrorCancel === true, 'Action effect acceptance covers loading/success/error/cancel');
  context.assert(fixture.acceptance.fixtureRestSsrHostDataSources === true, 'Action effect acceptance covers datasource kinds');
  context.assert(fixture.acceptance.resourcesReleaseByOwner === true, 'Action effect acceptance covers resource ownership');
  assertFixtureGraph(context, fixture);
  await runRuntimeAssertions(context, fixture, stateRuntimeModule, actionRuntimeModule);
  await runComponentCommandAssertions(context, actionRuntimeModule);

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtActionEffectRuntime',
    'createRmtResourceManager',
    'runAction',
    'cancelAction',
    'runEffect',
    'runDataSource',
    'object-url',
    'lazy-import',
    'RMT_COMPONENT_COMMAND_SCHEMA',
    'componentCommandAdapter',
    'rmt.action.error'
  ], 'Action effect runtime source');
  context.assert(!/components\/|xtend-loader|api\.js/u.test(runtimeSource), 'Action effect runtime avoids XTend UI imports');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(runtimeSource), 'Action effect runtime contains no HTML sinks');
  assertTextIncludesAll(context, typeSource, [
    'RmtActionEffectRuntime',
    'RmtActionDefinition',
    'RmtDataSourceDefinition',
    'RmtEffectDefinition',
    'RmtComponentCommand',
    'RmtResourceManager',
    'createRmtActionEffectRuntime'
  ], 'Action effect runtime types');
  assertTextIncludesAll(context, docs, [
    '# RMT Action Effect Runtime',
    RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
    'DataSources',
    'Resource Ownership',
    NEXT_WORKPACKAGE
  ], 'Action effect runtime docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
    RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
    RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-08 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-08` | P1 | completed'), 'Backlog marks WP-E18-08 completed');
  context.assert(
    backlog.includes('| `WP-E18-09` | P1 | ready') || backlog.includes('| `WP-E18-09` | P1 | completed'),
    'Backlog marks WP-E18-09 ready or completed after action runtime'
  );
  context.assert(epic.includes('| `WP-E18-08` | P1 | completed'), 'Epic marks WP-E18-08 completed');
  context.assert(epic.includes('rmt-action-effect-runtime'), 'Epic gate chain includes action effect runtime gate');
  context.assert(runner.includes("require('../tests/rmt/rmt_action_effect_runtime_suite')"), 'Runner imports action effect runtime suite');
  context.assert(runner.includes("id: 'rmt-action-effect-runtime'"), 'Runner registers action effect runtime suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-action-effect-runtime'] === 'node scripts/run_xtend_tests.js rmt-action-effect-runtime', 'Package exposes action effect runtime script');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/action-effect-runtime'], 'Package exports action effect runtime');
  context.assert(xtendrmtPackage.exports && xtendrmtPackage.exports['./action-effect-runtime'], 'XTendRMT package exports action effect runtime');
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtActionEffectRuntime;
  context.assert(metadata && metadata.schema === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Package metadata exposes action effect runtime schema');
  context.assert(metadata && metadata.localGate === RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE, 'Package metadata exposes action effect runtime local gate');
  context.assert(metadata && metadata.dataSourceKinds.includes('rest'), 'Package metadata exposes datasource kinds');
  context.assert(metadata && metadata.effectKinds.includes('lazy-import'), 'Package metadata exposes effect kinds');
  context.assert(metadata && metadata.resourceKinds.includes('object-url'), 'Package metadata exposes resource kinds');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-09 handoff');

  return context.result({
    schema: RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA,
    fixture: RMT_ACTION_EFFECT_RUNTIME_FIXTURE,
    actionCapabilityCount: REQUIRED_ACTION_CAPABILITIES.length,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtActionEffectRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT Action Effect Runtime erfolgreich.',
    failureTitle: 'Epic 18 RMT Action Effect Runtime fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtActionEffectRuntimeSuite()
    .then((result) => {
      printRmtActionEffectRuntimeReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtActionEffectRuntimeReport,
  runRmtActionEffectRuntimeSuite
};
