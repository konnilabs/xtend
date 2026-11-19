'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const nativeViewRuntimePort = require('../../tools/xtensions/native-view-projection').NATIVE_LIFECYCLE_VIEW_RUNTIME;
function configuration() {
  const result = compileRmtxSource(`import {RMT,model} from '@ccslabs/xtend/rmt-language/rmtx'; export default <RMT.Program id="browser-lifecycle"><RMT.State id="ui" type="object" initial={{ready:false}}/><RMT.Surface id="owner"><RMT.Lane name="visible"><RMT.Mount target="owner" when={model.ui.ready}/></RMT.Lane><RMT.View><RMT.Text value="hello"/></RMT.View></RMT.Surface></RMT.Program>`, { syntaxVersion: '6.0.0' });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  return { schema: 'xtend.maraca.browser-composition-root.v12', buildPlanSchema: 'xtend.maraca.build-plan.v10', sourceHash: 'a'.repeat(64),
    orchestration: { enabled: true, artifact: result.orchestrationArtifacts }, components: [], surfaces: [] };
}
test('Browser12 requires its explicit lifecycle factory and API2 while preserving the Browser11 instance contract', async () => {
  const api = await import('../../xtend-maraca/browser-composition-runtime.mjs');
  const dependencies = { nativeViewRuntimePort, createLifecyclePlanRuntime() {} };
  const root = api.createMaracaBrowserCompositionRoot(configuration(), dependencies);
  assert.equal(root.schema, 'xtend.maraca.browser-composition-root.v12'); assert.equal(root.apiVersion, '12.0.0');
  assert.equal(root.facade.snapshot().schema, 'xtend.maraca.plan-runtime.v15');
  assert.throws(() => api.createMaracaBrowserCompositionRoot(configuration(), { nativeViewRuntimePort, createPlanRuntime() {} }), /createLifecyclePlanRuntime/);
  assert.throws(() => api.createMaracaBrowserCompositionRoot(configuration(), { ...dependencies, nativeViewRuntimePort: require('../../tools/xtensions/native-view-projection') }), /API2/);
  for (const update of [{ buildPlanSchema: 'xtend.maraca.build-plan.v9' }, { orchestration: { enabled: true, artifact: { schema: 'xtend.rmt.app-orchestration.v3' } } }])
    assert.throws(() => api.createMaracaBrowserCompositionRoot({ ...configuration(), ...update }, dependencies), /exact/);
});
test('Browser12 validates raw configuration without executing getters before clone or host work', async () => {
  const api = await import('../../xtend-maraca/browser-composition-runtime.mjs'), dependencies = { nativeViewRuntimePort, createLifecyclePlanRuntime() {} };
  let calls = 0;
  const config = configuration(); Object.defineProperty(config.orchestration.artifact.state.states[0], 'initial', { enumerable: true, get() { calls++; return { ready: true }; } });
  assert.throws(() => api.createMaracaBrowserCompositionRoot(config, dependencies)); assert.equal(calls, 0);
  const schema = Object.defineProperty({}, 'schema', { enumerable: true, get() { calls++; return 'xtend.maraca.browser-composition-root.v12'; } });
  assert.throws(() => api.createMaracaBrowserCompositionRoot(schema, dependencies)); assert.equal(calls, 0);
});
test('Browser12 rejects SSR and invalid initial data before renderer creation or metadata writes', async () => {
  const { JSDOM } = require('jsdom'), api = await import('../../xtend-maraca/browser-composition-runtime.mjs');
  const dom = new JSDOM('<main data-rmt-resume-root="true"><span>preserved</span></main>'), root = dom.window.document.querySelector('main');
  const before = root.outerHTML; let calls = 0;
  const app = api.createMaracaBrowserCompositionRoot(configuration(), { nativeViewRuntimePort, createLifecyclePlanRuntime() {}, windowTarget: dom.window, documentTarget: dom.window.document });
  try {
    await assert.rejects(app.boot({ root, fabric: { runFiber() {} }, get domRenderer() { calls++; throw Error('unreachable'); } }), /SSR/);
    for (const option of [{ ssr: {} }, { ssrResponse: {} }, { adoptExisting: true }, { xtensions: { ssr: {} } }]) await assert.rejects(app.boot(option), /SSR/);
    const initialState = Object.defineProperty({}, 'ui', { enumerable: true, get() { calls++; return { ready: true }; } });
    await assert.rejects(app.boot({ root, fabric: { runFiber() {} }, initialState }));
    assert.equal(calls, 0); assert.equal(root.outerHTML, before);
  } finally { app.dispose(); dom.window.close(); }
});
test('Browser12 forwards Plan10/API2/Fabric only to the explicit factory and never exposes its private integration port', async () => {
  const { JSDOM } = require('jsdom'), api = await import('../../xtend-maraca/browser-composition-runtime.mjs');
  const dom = new JSDOM('<main></main>'), root = dom.window.document.querySelector('main'), stop = new Error('configuration seam');
  let received, oldCalls = 0, disposed = false;
  const fabric = { runFiber() {} }, kernel = { dispose() { disposed = true; } };
  const app = api.createMaracaBrowserCompositionRoot(configuration(), { nativeViewRuntimePort,
    windowTarget: dom.window, documentTarget: dom.window.document,
    createPlanRuntime() { oldCalls++; }, createLifecyclePlanRuntime(options) { received = options; throw stop; } });
  try {
    await assert.rejects(app.boot({ root, fabric, kernelController: kernel, domRenderer: { commit() {}, dispose() {} } }), error => error === stop);
    assert.equal(oldCalls, 0); assert.equal(received.plan.schema, 'xtend.maraca.build-plan.v10');
    assert.equal(received.plan.orchestration.artifact.schema, 'xtend.rmt.app-orchestration.v4');
    assert.equal(received.nativeViewRuntimePort, nativeViewRuntimePort); assert.equal(received.fabric, fabric); assert.equal(received.kernelController, kernel);
    assert.equal(Object.hasOwn(received, 'nativeLifecycleRuntimePort'), false); assert.equal(disposed, false);
  } finally { app.dispose(); dom.window.close(); }
});
test('BrowserHost4 retains pure SSR inspection and the exact Fabric/Kernel scheduler handles', async () => {
  const { JSDOM } = require('jsdom'), api = await import('../../xtend-maraca/browser-host-adapter.mjs');
  const dom = new JSDOM('<main data-rmt-resume-root="true"></main>'), root = dom.window.document.querySelector('main'); let received;
  const fabric = { runFiber() {} }, scheduler = { schedule() {} };
  const host = api.createMaracaBrowserHostAdapter({ schema: 'xtend.maraca.browser-composition-root.v12', kernel: { enabled: true, artifact: {} } }, {
    windowTarget: dom.window, documentTarget: dom.window.document, runtimeApis: { XTendRmtKernelOrchestrationController: { createRmtKernelOrchestrationController(options) { received = options; return { boot() {} }; } } } });
  try {
    assert.equal(host.schema, 'xtend.maraca.browser-host-adapter.v4'); const before = root.outerHTML;
    assert.equal(host.inspectServerShell(root).active, true); assert.equal(root.outerHTML, before);
    host.createKernelController({ fabric, kernelScheduler: scheduler }); assert.equal(received.fabric, fabric); assert.equal(received.kernelScheduler, scheduler);
  } finally { host.dispose(); dom.window.close(); }
});
