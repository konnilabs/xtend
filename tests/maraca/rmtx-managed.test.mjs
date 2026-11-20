import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createMaracaNativeManagedRuntime } from '../../xtend-maraca/native-managed-runtime.mjs';
import * as state from '../../xtendrmt/rmt-state-selector-runtime.js';
import * as action from '../../xtendrmt/rmt-action-effect-runtime.js';
import * as app from '../../xtendrmt/rmt-app-runtime.js';
import * as renderer from '../../xtendrmt/rmt-dom-descriptor-renderer.js';
import * as viewProjection from '../../xtendrmt/rmt-maraca-view-projection-adapter.js';
import * as presentation from '../../xtendrmt/rmt-presentation-effect-adapter.js';
import * as events from '../../xtendrmt/rmt-event-routing-runtime.js';
import * as surfaces from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import * as surfaceController from '../../components/xsurfacemanager-controller.js';
import * as kernel from '../../xtendrmt/rmt-kernel-orchestration-controller.js';
import * as kernelRuntime from '../../xtendrmt/rmt-runtime.esm.js';
import { createRmtKernelScheduler } from '../../xtendrmt/rmt-kernel-scheduler.js';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const { createMaracaBuildPlan, createMaracaTuneConfig } = require('../../xtend-maraca');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const nativeViewRuntimePort = require('../../tools/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME;
const { resolveManagedComponent } = require('../../tools/xtensions/native-component-managed');
const domErrors = [];
const virtualConsole = new VirtualConsole(); virtualConsole.on('jsdomError', error => domErrors.push(error.message));
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost/', virtualConsole });
for (const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','customElements','MutationObserver','DOMParser','ShadowRoot','AbortController','AbortSignal']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
// jsdom's form internals omit these browser APIs; the real component still runs.
HTMLElement.prototype.attachInternals = function() { return { setFormValue() {}, setValidity() {}, checkValidity() { return true; }, reportValidity() { return true; } }; };
const inputDefinition = await import('../../components/xinput.definition.js');
const rootDir = new URL('../../', import.meta.url).pathname;
const source = `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="managed-test">
<RMT.State id="ui" type="object" initial={{title:'first',suspended:false,resume:false}}/>
<RMT.Action id="rename"><RMT.Input name="value" type="string"/><RMT.Reduce state="ui" path="title" value={input.value}/></RMT.Action>
<RMT.Action id="replace"><RMT.Input name="ui" type="object"/><RMT.Reduce state="ui" value={input.ui}/></RMT.Action>
<RMT.Action id="focus"><RMT.Effect kind="component-command" target="owner.editor" command="focus" args={{}}/></RMT.Action>
<RMT.Surface id="owner" component="section"><RMT.Lane name="visible"><RMT.Mount target="owner"/><RMT.Suspend target="owner" when={model.ui.suspended}/><RMT.Resume target="owner" when={model.ui.resume}/></RMT.Lane>
<RMT.View><RMT.Component tag="x-input" ref="editor" properties={{value:model.ui.title}}><RMT.On event="input-changed" action="rename" payload={{value:'detail.value'}}/></RMT.Component></RMT.View>
</RMT.Surface></RMT.Program>`;
function planFor(text = source, version = '8.0.0') {
  return createMaracaBuildPlan({ filePath:'tests/maraca/managed.rmtx', sourceText:text, rmtxSyntaxVersion:version, orchestration:'strict', kernel:'strict', hydration:'off', validation:'off', transitions:'off', services:false, pwa:false }, { rootDir, inspectToolchain:false });
}
async function fixture(text = source) {
  const plan = planFor(text); assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  const root = document.createElement('main'); document.body.append(root);
  const scheduler = createRmtKernelScheduler({ preferPostTask:false });
  const controller = surfaceController.createSurfaceController();
  const fabric = createXtendFabric();
  const registry = {
    async ensureTags(tags) {
      for (const tag of tags) {
        assert.equal(tag, 'x-input');
        const constructor = inputDefinition.default;
        if (!customElements.get(tag)) customElements.define(tag, constructor);
        else assert.equal(customElements.get(tag), constructor);
      }
    },
    async hydrate(root, tags, metadata) {
      await this.ensureTags(tags);
      for (const target of metadata.targets || []) assert.ok(resolveManagedComponent(target));
      return null;
    }
  };
  const runtime = createMaracaNativeManagedRuntime({ plan, root, fabric, scheduler, nativeViewRuntimePort, componentRegistry:registry, surfaceController:controller,
    viewProjectionPort:viewProjection.createRmtMaracaViewProjectionAdapter({ root, documentTarget:document }),
    moduleApis:{ state, action, app, renderer, viewProjection, presentation, events, surfaces, surfaceController, kernelRuntime, kernel } });
  try { await runtime.boot(); } catch (error) { runtime.dispose(); controller.dispose(); scheduler.dispose(); root.remove(); throw error; }
  return { plan, root, runtime, controller, scheduler, async close() { runtime.dispose(); await runtime.whenXTensionsIdle(); controller.dispose(); scheduler.dispose(); root.remove(); } };
}

test('Source8 plan/config use explicit versions and Source7 refuses managed interfaces', () => {
  const plan = planFor(); assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  assert.equal(plan.schema, 'xtend.maraca.build-plan.v12');
  assert.equal(plan.orchestration.artifact.schema, 'xtend.rmt.app-orchestration.v6');
  assert.equal(plan.orchestration.artifact.render.nativeView.schema, 'xtend.rmt.native-view.v3');
  assert.equal(plan.orchestration.artifact.actions.schema, 'xtend.rmt.action-plan.v3');
  assert.equal(createMaracaTuneConfig({ options:{ rmtxSyntaxVersion:'8.0.0' } }).schema, 'xtend.maraca.build-config.v12');
  assert.equal(planFor(source, '7.0.0').ok, false);
});

test('Source8 real input emits validated Action and model updates preserve the controlled host', async () => {
  const f = await fixture();
  try {
    assert.equal(f.runtime.schema, 'xtend.maraca.plan-runtime.v17');
    const input = f.root.querySelector('x-input'); assert.ok(input); assert.equal(input.value, 'first');
    input._input.value = 'edited'; input._input.dispatchEvent(new dom.window.Event('input', { bubbles:true }));
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(f.runtime.snapshot().state.states.ui.title, 'edited');
    assert.ok(f.root.querySelector('x-input') === input, 'Controlled native host identity must remain stable');
    f.root.querySelector('section').dispatchEvent(new dom.window.CustomEvent('input-changed', { bubbles:true, detail:{ value:'forged sibling' } }));
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(f.runtime.snapshot().state.states.ui.title, 'edited');
    await f.runtime.dispatchCommand('rename', { value:'external' });
    assert.equal(input.value, 'external');
    assert.deepEqual(domErrors, []);
  } finally { await f.close(); }
});

test('Source8 focus Effect uses exact Kernel sidecar and Suspend retains lifetime identity', async () => {
  const f = await fixture();
  try {
    const input = f.root.querySelector('x-input'); const context = resolveManagedComponent(input); assert.ok(context);
    if (process.env.XTEND_DEBUG_NATIVE_COMMAND === '1') console.error(JSON.stringify({ commands:f.plan.orchestration.artifact.render.nativeView.commands, kernel:f.plan.kernel.artifact }, null, 2));
    await f.runtime.dispatchCommand('focus', {});
    assert.ok(input.shadowRoot.activeElement === input._input, 'The exact owned input must receive focus');
    await f.runtime.dispatchCommand('replace', { ui:{ title:'first', suspended:true, resume:false } });
    assert.ok(f.root.querySelector('x-input') === input, 'Suspend must retain the exact native host');
    assert.ok(resolveManagedComponent(input) === context, 'Suspend must retain the native owner context');
    assert.equal(context.isAlive(), true); assert.equal(context.isActive(), false);
    await f.runtime.dispatchCommand('replace', { ui:{ title:'resumed', suspended:false, resume:true } });
    assert.ok(f.root.querySelector('x-input') === input, 'Resume must retain the exact native host'); assert.equal(context.isActive(), true);
    assert.equal(input.value, 'resumed');
    f.controller.destroySurface('owner');
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(context.isAlive(), false);
  } finally { await f.close(); }
});

test('Source8 explicit Hydrate=false keeps real controls inactive until its compiled Hydrate is admitted', async () => {
  const text = source.replace("resume:false}}/>", "resume:false,hydrate:false}}/>")
    .replace('<RMT.Mount target="owner"/>', '<RMT.Mount target="owner"/><RMT.Hydrate target="owner" when={model.ui.hydrate}/>');
  const f = await fixture(text);
  try {
    const input = f.root.querySelector('x-input'), context = resolveManagedComponent(input);
    assert.equal(context.isAlive(), true); assert.equal(context.isActive(), false);
    input._input.value = 'cold'; input._input.dispatchEvent(new dom.window.Event('input', { bubbles:true }));
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(f.runtime.snapshot().state.states.ui.title, 'first');
    await f.runtime.dispatchCommand('replace', { ui:{ title:'warm', suspended:false, resume:false, hydrate:true } });
    assert.ok(f.root.querySelector('x-input') === input, 'Hydrate must activate the same native host'); assert.equal(context.isActive(), true);
    input._input.value = 'active'; input._input.dispatchEvent(new dom.window.Event('input', { bubbles:true }));
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(f.runtime.snapshot().state.states.ui.title, 'active');
  } finally { await f.close(); }
});

test('Source8 lexical On.when evaluates the live Model before its validated Action', async () => {
  const text=source.replace("resume:false}}/>","resume:false,enabled:false}}/>")
    .replace('event="input-changed" action="rename"','event="input-changed" action="rename" when={model.ui.enabled === true}');
  const f=await fixture(text);
  try {
    const input=f.root.querySelector('x-input');
    input._input.value='blocked';input._input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(f.runtime.snapshot().state.states.ui.title,'first');
    await f.runtime.dispatchCommand('replace',{ui:{title:'allowed',suspended:false,resume:false,enabled:true}});
    input._input.value='accepted';input._input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,30));
    assert.equal(f.runtime.snapshot().state.states.ui.title,'accepted');
  } finally { await f.close(); }
});
