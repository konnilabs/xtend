'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const modules = (async () => {
  const apis = {};
  for (const [name, file] of Object.entries({ state: 'xtendrmt/rmt-state-selector-runtime.js', stateProjection: 'xtendrmt/rmt-state-host-adapter.js',
    action: 'xtendrmt/rmt-action-effect-runtime.js', app: 'xtendrmt/rmt-app-runtime.js', renderer: 'xtendrmt/rmt-dom-descriptor-renderer.js',
    viewProjection: 'xtendrmt/rmt-maraca-view-projection-adapter.js', presentation: 'xtendrmt/rmt-presentation-effect-adapter.js',
    events: 'xtendrmt/rmt-event-routing-runtime.js', surfaces: 'xtendrmt/rmt-surface-resource-graph-runtime.js',
    surfaceController: 'components/xsurfacemanager-controller.js', kernel: 'xtendrmt/rmt-kernel-orchestration-controller.js' })) apis[name] = await import(pathToFileURL(path.join(root, file)));
  return { apis, plan: await import(pathToFileURL(path.join(root, 'xtend-maraca/plan-runtime.mjs'))),
    kernelApi: await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-runtime.esm.js'))),
    scheduler: await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-kernel-scheduler.js'))),
    projection: await import(pathToFileURL(path.join(root, 'components/xtend-state.js'))) };
})();

async function app(body, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-action-backend-'));
  const file = path.join(dir, 'app.rmt'), source = `template regression {\n${body}\nstate regressionView type object initial { ready true }\nportal rootportal root "#app" layer surface\nsurface panel kind panel component x-section {\nportal rootportal\nlane visible weight 80 { hydrate panel from state regressionView }\n}\n}`;
  fs.writeFileSync(file, source);
  const plan = require('../../xtend-maraca').createMaracaBuildPlan({ source: file, orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false }, { rootDir: root, inspectToolchain: false });
  assert(plan.ok, JSON.stringify(plan.diagnostics));
  const { mutatePlan, ...runtimeOptions } = options;
  if (mutatePlan) mutatePlan(plan);
  const { apis, plan: planModule, kernelApi, scheduler: schedModule, projection } = await modules;
  const dom = new JSDOM('<main id="app"></main>', { url: 'https://regression.invalid/' }), host = dom.window.document.querySelector('main');
  const scheduler = schedModule.createRmtKernelScheduler({ preferPostTask: false });
  const runtime = planModule.createMaracaPlanRuntime({ plan, root: host, moduleApis: apis, kernelApi, scheduler,
    fabric: require('../../fabric/xtend-fabric').createXtendFabric(), documentTarget: dom.window.document, windowTarget: dom.window,
    stateProjectionTarget: projection.xtendState, hydrateOnBoot: false, ensureComponentsOnBoot: false,
    viewProjectionPort: apis.viewProjection.createRmtMaracaViewProjectionAdapter({ root: host, documentTarget: dom.window.document }), ...runtimeOptions });
  try { await runtime.boot(); } catch (error) { runtime.dispose(); scheduler.dispose(); dom.window.close(); fs.rmSync(dir, { recursive: true, force: true }); throw error; }
  return { runtime, plan, host, dom, close() { runtime.dispose(); scheduler.dispose(); dom.window.close(); projection.xtendState.clear(); fs.rmSync(dir, { recursive: true, force: true }); } };
}

test('regular Maraca plans preserve string, zero, false and null State initial values', async () => {
  const instance = await app(`state text type string initial "seed"
    state count type number initial 0
    state enabled type boolean initial false
    state nullable type json initial null`);
  try {
    assert.equal(instance.runtime.model.getState('text'), 'seed'); assert.equal(instance.runtime.model.getState('count'), 0);
    assert.equal(instance.runtime.model.getState('enabled'), false); assert.equal(instance.runtime.model.getState('nullable'), null);
  } finally { instance.close(); }
});

test('managed reducers resolve State and Selector values against previous reductions without confusing literal reference spellings', async () => {
  const instance = await app(`
    state original type number initial 3
    state copied type number initial 0
    state literal type string initial ""
    state rows type array initial [{ id 1; label "one" }]
    state selected type object initial {}
    selector chosen from state rows { find item.id == 1 }
    action copy {
      reduce state.original = 4
      reduce state.copied = state.original
      reduce state.selected = selector.chosen
      reduce state.literal = "state.original"
    }`);
  try {
    assert.equal((await instance.runtime.dispatchCommand('copy')).status, 'success');
    assert.equal(instance.runtime.model.getState('copied'), 4);
    assert.deepEqual(instance.runtime.model.getState('selected'), { id: 1, label: 'one' });
    assert.equal(instance.runtime.model.getState('literal'), 'state.original');
  } finally { instance.close(); }
});

test('qualified State symbols resolve their longest declared owner before the field path', async () => {
  const instance = await app(`state account type object initial { label "parent" }
    state account.label type string initial "child"
    state copied type string initial ""
    action copy { reduce state.copied = state.account.label }`);
  try { await instance.runtime.dispatchCommand('copy'); assert.equal(instance.runtime.model.getState('copied'), 'child'); }
  finally { instance.close(); }
});

test('managed references work through the existing Model reader contract without an optional resolve method', async () => {
  const { apis } = await modules;
  const stateApi = { ...apis.state, createRmtStateSelectorRuntime(options) {
    const { resolve, ...model } = apis.state.createRmtStateSelectorRuntime(options); return model;
  } };
  const instance = await app(`state account type object initial { label "parent" }
    state account.label type string initial "child"
    state copied type string initial ""
    state rows type array initial [{ id 1; label "selected" }]
    state selection type object initial {}
    selector chosen from state rows { find item.id == 1 }
    action copy {
      reduce state.account.label = "updated"
      reduce state.copied = state.account.label
      reduce state.selection = selector.chosen
      emit audit.copied with value state.copied
    }`, { moduleApis: { ...apis, state: stateApi } });
  try {
    const emitted = []; instance.runtime.subscribeEvents(event => { if (event.type === 'emit') emitted.push(event); });
    await instance.runtime.dispatchCommand('copy');
    assert.equal(instance.runtime.model.getState('copied'), 'updated');
    assert.deepEqual(instance.runtime.model.getState('selection'), { id: 1, label: 'selected' });
    assert.deepEqual(emitted.map(event => event.payload), [{ value: 'updated' }]);
  } finally { instance.close(); }
});

test('unmarked managed artifact values retain the legacy input/result versus literal State/error distinction', async () => {
  const instance = await app(`state stateText type string initial ""
    state errorText type string initial ""
    state inputText type string initial ""
    action copy { input value string
      reduce state.stateText = "state.original"
      reduce state.errorText = "error.message"
      reduce state.inputText = "input.value"
    }`, { mutatePlan(plan) { plan.orchestration.artifact.state.reducers.forEach(reducer => delete reducer.valueKind); } });
  try {
    await instance.runtime.dispatchCommand('copy', { value: 'argument' });
    assert.equal(instance.runtime.model.getState('stateText'), 'state.original'); assert.equal(instance.runtime.model.getState('errorText'), 'error.message');
    assert.equal(instance.runtime.model.getState('inputText'), 'argument');
  } finally { instance.close(); }
});

const actionSource = `state flags type object initial { direct 0; success 0; error "" }
  datasource remote from endpoint "/audit" { method POST; contract Audit; result data }
  overlay feedback.toast kind toast portal rootportal
  action execute {
    input value number
    effect fetch datasource remote
    reduce state.flags.direct = input.value
    emit audit.done with value input.value
    on success -> reduce state.flags.success = result.serverValue
    on success -> emit audit.success with value state.flags.success
    on error -> reduce state.flags.error = error.message
    on error -> emit audit.failed with message error.message
    on error -> overlay feedback.toast message error.message tone "danger"
  }`;

test('success handlers commit atomically and emissions publish once only after Model and View commit', async () => {
  const instance = await app(actionSource, { dataSourceAdapters: { rest: { fetch: async () => ({ data: { serverValue: 9 } }) } } });
  try {
    const observed = [];
    instance.runtime.subscribeEvents(event => { if (event.type === 'emit') observed.push({ event, state: instance.runtime.model.getState('flags'), rendered: Boolean(instance.host.querySelector('x-section')) }); });
    assert.equal((await instance.runtime.dispatchCommand('execute', { value: 7 })).status, 'success');
    assert.deepEqual(instance.runtime.model.getState('flags'), { direct: 7, success: 9, error: '' });
    assert.deepEqual(observed.map(entry => [entry.event.event, entry.event.payload]), [['audit.done', { value: 7 }], ['audit.success', { value: 9 }]]);
    assert(observed.every(entry => entry.state.success === 9 && entry.rendered));
  } finally { instance.close(); }
});

test('error handlers resolve errors, emit only their error phase and render danger overlays through the native graph', async () => {
  const instance = await app(actionSource, { dataSourceAdapters: { rest: { fetch: async () => { throw new Error('request failed'); } } } });
  try {
    const emitted = []; instance.runtime.subscribeEvents(event => { if (event.type === 'emit') emitted.push(event); });
    assert.equal((await instance.runtime.dispatchCommand('execute', { value: 7 })).status, 'error');
    assert.deepEqual(instance.runtime.model.getState('flags'), { direct: 0, success: 0, error: 'request failed' });
    assert.deepEqual(emitted.map(event => [event.event, event.payload]), [['audit.failed', { message: 'request failed' }]]);
    const overlay = instance.host.querySelector('[data-rmt-overlay-ref="feedback.toast"]'); assert(overlay, instance.dom.window.document.body.innerHTML);
    assert.equal(overlay.textContent, 'request failed'); assert.equal(overlay.getAttribute('data-tone'), 'danger'); assert.equal(overlay.getAttribute('tone'), 'error');
    const portal = overlay.parentNode, control = instance.dom.window.document.createElement('button'); control.textContent = 'kept'; overlay.appendChild(control); control.focus();
    assert.equal(instance.dom.window.document.activeElement, control);
    await instance.runtime.dispatchCommand('execute', { value: 8 });
    assert.equal(instance.host.querySelector('[data-rmt-overlay-ref="feedback.toast"]'), overlay, 'A repeated command preserves the native singleton overlay across the View commit.');
    assert.equal(overlay.parentNode, portal); assert.equal(control.parentNode, overlay); assert.equal(instance.dom.window.document.activeElement, control);
  } finally { instance.close(); }
});

test('nested emit templates resolve reference leaves while keeping literal strings unchanged', async () => {
  const instance = await app(`state original type string initial "source"
    action emitValue { input value string
      emit audit.nested with data { value input.value; literal "input.value"; nested [state.original "state.original"] }
    }`);
  try {
    const emitted = []; instance.runtime.subscribeEvents(event => { if (event.type === 'emit') emitted.push(event); });
    await instance.runtime.dispatchCommand('emitValue', { value: 'argument' });
    assert.deepEqual(emitted.map(event => event.payload), [{ data: { value: 'argument', literal: 'input.value', nested: ['source', 'state.original'] } }]);
  } finally { instance.close(); }
});

test('a failed Model typeguard rolls all reductions back and publishes no event', async () => {
  const instance = await app(`state good type number initial 0
    state guarded type number initial 0
    action update { input value number
      reduce state.good = 8
      reduce state.guarded = input.value
      emit audit.updated with value input.value
    }`);
  try {
    const emitted = []; instance.runtime.subscribeEvents(event => { if (event.type === 'emit') emitted.push(event); });
    await assert.rejects(instance.runtime.dispatchCommand('update', { value: 'wrong type' }));
    assert.equal(instance.runtime.model.getState('good'), 0); assert.equal(instance.runtime.model.getState('guarded'), 0); assert.deepEqual(emitted, []);
  } finally { instance.close(); }
});

test('disposing during a datasource prevents late handlers, commits, and publications', async () => {
  let resolve, started; const began = new Promise(done => { started = done; });
  const instance = await app(actionSource, { dataSourceAdapters: { rest: { fetch: () => { started(); return new Promise(done => { resolve = done; }); } } } });
  const emitted = []; instance.runtime.subscribeEvents(event => { if (event.type === 'emit') emitted.push(event); });
  try {
    const command = instance.runtime.dispatchCommand('execute', { value: 7 }); command.catch(() => {});
    await began; instance.runtime.dispose(); resolve({ data: { serverValue: 9 } });
    await assert.rejects(command); assert.deepEqual(emitted, []);
  } finally { instance.close(); }
});

test('the direct Action executor executes result phases and uses only its explicit publication adapter', async () => {
  const { apis } = await modules;
  assert.equal(apis.action.RMT_ACTION_EFFECT_API_VERSION, '3.0.0');
  const compiled = require('../../tools/rmt-language/classic-compiler').compileRmtClassicSource(`state original type string initial "source"
    state copied type string initial ""
    action copy { reduce state.copied = state.original
      on success -> emit audit.done with value state.copied
    }`);
  assert(compiled.ok, JSON.stringify(compiled.diagnostics));
  const state = apis.state.createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state), emitted = [];
  const runtime = apis.action.createRmtActionEffectRuntime({ ...compiled.orchestrationArtifacts.actions, stateRuntime: state,
    modelCommandPort: state.modelCommandPort, effectAdapter: { invoke(effect) { emitted.push(effect); } } });
  try { assert.equal((await runtime.runAction('copy')).status, 'success'); assert.equal(state.getState('copied'), 'source'); assert.deepEqual(emitted.map(event => event.payload), [{ value: 'source' }]); }
  finally { runtime.dispose(); }
});

test('the direct Action executor applies only error handlers after a failed datasource', async () => {
  const { apis } = await modules;
  const compiled = require('../../tools/rmt-language/classic-compiler').compileRmtClassicSource(`state message type string initial ""
    datasource remote from endpoint "/audit" { method POST; result data }
    action execute { effect fetch datasource remote
      on error -> reduce state.message = error.message
      on error -> emit audit.failed with message state.message
    }`);
  assert(compiled.ok, JSON.stringify(compiled.diagnostics));
  const state = apis.state.createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state), emitted = [];
  const runtime = apis.action.createRmtActionEffectRuntime({ ...compiled.orchestrationArtifacts.actions, stateRuntime: state, modelCommandPort: state.modelCommandPort,
    dataSourceAdapters: { rest: { async fetch() { throw new Error('direct failure'); } } }, effectAdapter: { invoke(effect) { emitted.push(effect); } } });
  try { assert.equal((await runtime.runAction('execute')).status, 'error'); assert.equal(state.getState('message'), 'direct failure'); assert.deepEqual(emitted.map(event => event.payload), [{ message: 'direct failure' }]); }
  finally { runtime.dispose(); }
});

test('direct publications reject unsafe templates and missing publication authority', async () => {
  const { apis } = await modules;
  const absent = apis.action.createRmtActionEffectRuntime({ actions: [{ id: 'emit', emits: [{ event: 'audit.done', payload: [] }] }], modelCommandPort: { apply() {} } });
  assert.equal((await absent.runAction('emit')).status, 'error'); absent.dispose();
  let read = 0, published = 0; const dangerous = { kind: 'object', fields: [] };
  Object.defineProperty(dangerous, 'fields', { enumerable: true, get() { read += 1; return []; } });
  const runtime = apis.action.createRmtActionEffectRuntime({ actions: [{ id: 'emit', emits: [{ event: 'audit.done', payload: [{ name: 'data', value: dangerous, valueKind: 'template' }] }] }], modelCommandPort: { apply() {} }, effectAdapter: { invoke() { published += 1; } } });
  assert.equal((await runtime.runAction('emit')).status, 'error'); assert.equal(read, 0); assert.equal(published, 0); runtime.dispose();
});

test('direct unmarked values keep the previous dollar-reference syntax and unknown value kinds fail closed', async () => {
  const { apis } = await modules, events = [];
  const runtime = apis.action.createRmtActionEffectRuntime({ actions: [{ id: 'emit', emits: [{ event: 'audit.legacy', payload: [
    { name: 'rawState', value: 'state.original' }, { name: 'rawError', value: 'error.message' }, { name: 'rawInput', value: 'input.value' }, { name: 'dollarInput', value: '$payload.value' }
  ] }] }], modelCommandPort: { apply() {} }, effectAdapter: { invoke(effect) { events.push(effect); } } });
  try { assert.equal((await runtime.runAction('emit', { value: 'argument' })).status, 'success');
    assert.deepEqual(events.map(event => event.payload), [{ rawState: 'state.original', rawError: 'error.message', rawInput: 'input.value', dollarInput: 'argument' }]);
  } finally { runtime.dispose(); }
  for (const { valueKind, value } of [{ valueKind: 'future', value: 1 }, { valueKind: 'reference', value: 1 }, { valueKind: 'reference', value: '$payload.value' }]) {
    let publications = 0;
    const unknown = apis.action.createRmtActionEffectRuntime({ actions: [{ id: 'emit', emits: [{ event: 'audit.unknown', payload: [{ name: 'value', value, valueKind }] }] }], modelCommandPort: { apply() {} }, effectAdapter: { invoke() { publications += 1; } } });
    assert.equal((await unknown.runAction('emit')).status, 'error'); assert.equal(publications, 0); unknown.dispose();
  }
});

test('unsafe overlay tones are rejected before native lifecycle or DOM mutation', async () => {
  const instance = await app(`overlay feedback.toast kind toast portal rootportal
    action show { input tone string
      on success -> overlay feedback.toast message "safe text" tone input.tone
    }`);
  try {
    await assert.rejects(instance.runtime.dispatchCommand('show', { tone: 'unknown' }), /Unknown RMT overlay tone/);
    assert.equal(instance.host.querySelectorAll('[data-rmt-overlay]').length, 0);
  } finally { instance.close(); }
});

test('result overlays reject a declared portal outside the owned app root', async () => {
  const instance = await app(`portal external root "body" layer surface
    overlay feedback.toast kind toast portal external
    action show { on success -> overlay feedback.toast message "owned text" tone "info" }`);
  try {
    await assert.rejects(instance.runtime.dispatchCommand('show'), /inside the owned app root/);
    assert.equal(instance.dom.window.document.querySelectorAll('[data-rmt-overlay]').length, 0);
  } finally { instance.close(); }
});

test('native overlay portal resolution rejects ambiguous targets before mounting anything', async () => {
  const { apis } = await modules; let graph;
  const surfaces = { ...apis.surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = apis.surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } };
  const instance = await app(`portal ambiguous root ".overlay-target" layer surface
    overlay feedback.toast kind toast portal ambiguous`, { moduleApis: { ...apis, surfaces } });
  try {
    for (let index = 0; index < 2; index += 1) { const element = instance.dom.window.document.createElement('div'); element.className = 'overlay-target'; instance.host.appendChild(element); }
    await assert.rejects(graph.openOverlay('feedback.toast', { ownedRoot: instance.host, tone: 'info' }), /resolve exactly once/);
    assert.equal(instance.host.querySelectorAll('[data-rmt-overlay],[portal-id="ambiguous"]').length, 0);
  } finally { instance.close(); }
});
