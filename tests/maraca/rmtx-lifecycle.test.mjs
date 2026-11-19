import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createMaracaNativeLifecycleRuntime } from '../../xtend-maraca/native-lifecycle-runtime.mjs';
import { createMaracaPlanRuntime } from '../../xtend-maraca/plan-runtime.mjs';
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
const { JSDOM } = require('jsdom');
const { createMaracaBuildPlan } = require('../../xtend-maraca');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const nativeViewRuntimePort = require('../../tools/xtensions/native-view-projection').NATIVE_LIFECYCLE_VIEW_RUNTIME;
const rootDir = new URL('../../', import.meta.url).pathname;
const source = (enabled = false) => `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="lifecycle-runtime">
 <RMT.State id="ui" type="object" initial={{enabled:${JSON.stringify(enabled)},title:'first'}}/>
 <RMT.Action id="replace"><RMT.Input name="ui" type="object"/><RMT.Reduce state="ui" value={input.ui}/></RMT.Action>
 <RMT.Action id="rename"><RMT.Input name="title" type="string"/><RMT.Reduce state="ui" path="title" value={input.title}/></RMT.Action>
 <RMT.Surface id="owner" component="section">
  <RMT.Lane name="visible"><RMT.Mount target="owner" when={model.ui.enabled}/></RMT.Lane>
  <RMT.On event="click" action="rename" payload={{title:'detail.title'}}/>
  <RMT.View><RMT.Element tag="h1"><RMT.Text value={model.ui.title}/></RMT.Element></RMT.View>
 </RMT.Surface>
 <RMT.Surface id="sibling" component="aside"><RMT.View><RMT.Element tag="input" properties={{value:'retained'}}/></RMT.View></RMT.Surface>
</RMT.Program>`;
function plan(enabled = false, sourceText = source(enabled)) {
  const value = createMaracaBuildPlan({ filePath: 'tests/maraca/lifecycle-runtime.rmtx', sourceText, rmtxSyntaxVersion: '6.0.0',
    orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', services: false, pwa: false }, { rootDir, inspectToolchain: false });
  assert.equal(value.ok, true, JSON.stringify(value.diagnostics));
  assert.equal(value.schema, 'xtend.maraca.build-plan.v10');
  return value;
}
async function fixture({ enabled = false, maxTombstones = 1, provider = false, url = false, blockedUndefined = false, hideOwnerRef = false } = {}) {
  const dom = new JSDOM('<main></main>', { pretendToBeVisual: true });
  const root = dom.window.document.querySelector('main'), fabric = createXtendFabric(), admissions = [];
  const scheduler = createRmtKernelScheduler({ preferPostTask: false, observer: value => admissions.push(value),
    hostPort: { queueMicrotask(callback) { if (held) pending.push(callback); else queueMicrotask(callback); } } });
  let held = false; const pending = [];
  const controller = surfaceController.createSurfaceController({ maxTombstones });
  const writer = renderer.createRmtDomDescriptorRenderer({ documentTarget: dom.window.document });
  const port = viewProjection.createRmtMaracaViewProjectionAdapter({ root, documentTarget: dom.window.document });
  let graph, kernelController; const eventRuntimes = [], hosts = []; let loads = 0;
  const savedGlobals = new Map();
  if (provider || url) for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent']) {
    savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  }
  let sourceText = provider ? source(enabled).replace("title:'first'", "title:'first',items:[{id:1,title:'numeric'},{id:'1',title:'string'}]")
    .replace('<RMT.View><RMT.Element tag="h1">', '<RMT.View><RMT.Element tag="div" attributes={{id:"host-slot"}}/><RMT.Element tag="h1">')
    .replace('</RMT.Program>', '<RMT.Portal id="host.mount" root="#host-slot"/><RMT.Surface id="host" component="div" portal="host.mount"/></RMT.Program>')
    : url ? source(enabled).replace('</RMT.Program>', '<RMT.Surface id="url-control" component="div"/></RMT.Program>') : source(enabled);
  if (blockedUndefined) sourceText = sourceText.replace('</RMT.Program>', '<RMT.Surface id="undefined"><RMT.Lane name="visible"><RMT.Mount target="undefined" when={false}/></RMT.Lane><RMT.View/></RMT.Surface></RMT.Program>');
  const buildPlan = plan(enabled, sourceText);
  const bindingsRuntime = provider || url ? require('../../tools/xtensions/state-binding') : null;
  if (provider) buildPlan.xtensionBindings = { schema: 'xtend.xtensions.state-binding-artifact.v6', documentId: 'lifecycle-runtime', bindings: [{ surface: 'host',
    repeat: [{ state: 'ui', path: ['items'], key: ['id'] }], binding: { schema: 'xtend.xtensions.state-binding.v3',
      address: { documentId: 'lifecycle-runtime', declarationId: 'rows', keys: [] },
      props: { title: { type: 'string', projection: { kind: 'path', root: 'state', symbol: 'ui', path: ['items', { repeat: 0 }, 'title'] } } }, intents: {} } }] };
  if (url) buildPlan.xtensionBindings = { schema: 'xtend.xtensions.state-binding-artifact.v6', documentId: 'lifecycle-runtime', bindings: [{ surface: 'url-control',
    binding: { schema: 'xtend.xtensions.state-binding.v3', address: { documentId: 'lifecycle-runtime', declarationId: 'url', keys: [] },
      props: { title: { type: 'string', projection: { kind: 'path', root: 'state', symbol: 'ui', path: ['title'] } },
        enabled: { type: 'boolean', projection: { kind: 'path', root: 'state', symbol: 'ui', path: ['enabled'] } } }, intents: {} } }] };
  const urlPort = url ? require('../../tools/xtensions/url-state').LIFECYCLE_URL_STATE_RUNTIME : null;
  const urlPolicy = url && { schema: 'xtend.xtensions.url-state-policy.v2', id: 'lifecycle', version: 1, documentId: 'lifecycle-runtime', exposure: 'public-url',
    fields: [{ id: 'enabled', surface: 'url-control', prop: 'enabled', default: false }],
    limits: { tokenBytes: 4096, entries: 16, valueBytes: 512, instances: 128 } };
  const urlContract = url ? urlPort.createURLStateContract(urlPolicy, { program: buildPlan.orchestration.artifact, bindings: buildPlan.xtensionBindings }) : null;
  const runtime = createMaracaNativeLifecycleRuntime({ plan: buildPlan, root, scheduler, fabric, nativeViewRuntimePort,
    ...(url ? { urlStatePolicy: urlPolicy, urlStateRuntime: urlPort } : {}),
    ...(provider || url ? { xtensionBindingsRuntime: bindingsRuntime, createXTensionHost(context) {
      const React = require('react'), ReactDOM = { ...require('react-dom'), ...require('react-dom/client') };
      const { createReactKernelRuntimeAdapter } = require('../../tools/xtensions/react-runtime-adapter');
      const native = kernelController.core.rmt, rootId = native.listRoots().find(row => native.getRootElement(row.id) === root).id;
      const host = createReactKernelRuntimeAdapter({ ...context, fabric, component: props => React.createElement('output', null, props.title),
        loadRuntime() { loads++; return { React, ReactDOM }; }, policy: { events: context.events },
        kernelWork: { scheduler, rootId, scope: context.xtensionId },
        resourceGraph: { kernel: native, surfaceGraph: graph, surfaceController: controller, surfaceId: url ? 'sibling' : 'owner' } });
      hosts.push({ host, context });
      return hideOwnerRef ? { ...host, snapshot() { const { resourceGraph, ...snapshot } = host.snapshot(); return snapshot; } } : host;
    } } : {}),
    surfaceController: controller, domRenderer: writer, viewProjectionPort: port, hydrateOnBoot: false,
    moduleApis: { state, action, app, renderer, viewProjection, presentation,
      events: { ...events, createRmtEventRoutingRuntime(options) { const value = events.createRmtEventRoutingRuntime(options); eventRuntimes.push(value); return value; } }, surfaceController,
      kernel: { ...kernel, createRmtKernelOrchestrationController(options) { kernelController = kernel.createRmtKernelOrchestrationController(options); return kernelController; } }, kernelRuntime,
      surfaces: { ...surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } } } });
  const release = () => { held = false; pending.splice(0).forEach(callback => queueMicrotask(callback)); };
  try { await runtime.boot(); } catch (error) { runtime.dispose(); controller.dispose(); scheduler.dispose(); dom.window.close(); throw error; }
  return { root, dom, runtime, controller, fabric, scheduler, admissions, get graph() { return graph; },
    hosts, urlContract, get loads() { return loads; }, get nativeKernel() { return kernelController.core.rmt; },
    attached: () => eventRuntimes.flatMap(value => value.listAttached()),
    owner: () => root.querySelector('[data-maraca-surface="owner"]'),
    async replace(ui) { return runtime.dispatchCommand('replace', { ui }); },
    hold() { held = true; }, release,
    async close() { release(); runtime.dispose(); await runtime.whenXTensionsIdle(); urlContract?.dispose(); controller.dispose(); scheduler.dispose(); dom.window.close();
      for (const [key, descriptor] of savedGlobals) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } };
}

test('Source6 requires the explicit entry and keeps older native factories closed', () => {
  const value = plan();
  assert.throws(() => createMaracaPlanRuntime({ plan: value, root: {}, fabric: createXtendFabric(), nativeViewRuntimePort }), /explicit Native lifecycle/);
  const previous = structuredClone(value); previous.schema = 'xtend.maraca.build-plan.v9';
  previous.orchestration.artifact.schema = 'xtend.rmt.app-orchestration.v3'; delete previous.orchestration.artifact.lifecycle;
  assert.throws(() => createMaracaNativeLifecycleRuntime({ plan: previous, root: {}, fabric: createXtendFabric(),
    nativeViewRuntimePort: require('../../tools/xtensions/native-view-projection') }), /own data Plan10/);
  let reads = 0; const accessor = {};
  Object.defineProperty(accessor, 'schema', { enumerable: true, get() { reads++; return value.schema; } });
  assert.throws(() => createMaracaNativeLifecycleRuntime({ plan: accessor }), /own data Plan10/); assert.equal(reads, 0);
});

test('initialfalse has a Controller shell but no content or events; re-admission preserves Controller generation and kills old tokens', async () => {
  const f = await fixture();
  try {
    assert.equal(f.runtime.schema, 'xtend.maraca.plan-runtime.v15');
    assert.equal(f.owner(), null); assert.equal(f.attached().length, 0);
    const shell = f.controller.readSnapshot().surfaces.find(value => value.id === 'owner');
    assert.equal(shell.status, 'open');
    const sibling = f.root.querySelector('aside'), input = sibling.firstChild;
    await f.replace({ enabled: true, title: 'admitted' });
    const first = f.owner(), scope = f.runtime.getSurfaceBoundary('owner'), token = scope.capture(), signal = scope.signal;
    assert.equal(first.querySelector('h1').textContent, 'admitted');
    assert.equal(f.attached().length, 1);
    first.dispatchEvent(new f.dom.window.CustomEvent('click', { bubbles: true, detail: { title: 'event update' } }));
    await f.runtime.whenXTensionsIdle(); assert.equal(first.querySelector('h1').textContent, 'event update');
    await f.replace({ enabled: false, title: 'removed' });
    assert.equal(f.owner(), null); assert.equal(f.attached().length, 0); assert.equal(signal.aborted, true);
    await f.replace({ enabled: true, title: 'readmitted' });
    assert.notEqual(f.owner(), first); assert.equal(f.owner().querySelector('h1').textContent, 'readmitted');
    assert.equal(scope.isCurrent(token), false);
    assert.equal(f.controller.readSnapshot().surfaces.find(value => value.id === 'owner').generation, shell.generation);
    assert.equal(f.root.querySelector('aside'), sibling); assert.equal(sibling.firstChild, input);
    assert(f.admissions.some(value => value.phase === 'running'));
    assert(f.fabric.getFibers().some(value => value.metadata?.schedulerJobId));
  } finally { await f.close(); }
});

test('prospective invalid guards and accessors reject before the actual Model or DOM changes', async () => {
  const f = await fixture({ enabled: true });
  try {
    const before = f.runtime.model.snapshot(), html = f.root.innerHTML;
    for (const enabled of [null, 'true', 1, {}, []]) {
      await assert.rejects(f.replace({ enabled, title: 'forbidden' }), /boolean/);
      assert.deepEqual(f.runtime.model.snapshot(), before); assert.equal(f.root.innerHTML, html);
    }
    let reads = 0; const ui = { title: 'forbidden' };
    Object.defineProperty(ui, 'enabled', { enumerable: true, get() { reads++; return false; } });
    await assert.rejects(f.replace(ui), /accessor/); assert.equal(reads, 0);
    assert.deepEqual(f.runtime.model.snapshot(), before); assert.equal(f.root.innerHTML, html);
  } finally { await f.close(); }
});

test('guard true does not reopen an inactive Owner and explicit Surface resume admits fresh content', async () => {
  const f = await fixture({ enabled: true });
  try {
    const old = f.owner(), heading = old.firstChild;
    f.graph.closeSurface('owner'); await f.runtime.dispatchCommand('rename', { title: 'closed' });
    assert.equal(f.owner(), old); assert.equal(old.firstChild, heading); assert.equal(old.hidden, true);
    await f.replace({ enabled: false, title: 'removed' }); await f.replace({ enabled: true, title: 'waiting' });
    assert.equal(f.owner(), null); assert.equal(f.controller.readSnapshot().surfaces.find(value => value.id === 'owner').status, 'closed');
    await f.graph.openSurface('owner'); await f.runtime.refresh();
    assert.equal(f.owner().querySelector('h1').textContent, 'waiting'); assert.notEqual(f.owner(), old);
    for (const inactive of ['minimize', 'collapse']) {
      if (inactive === 'minimize') f.graph.minimizeSurface('owner'); else f.controller.updateSurface('owner', { collapsed: true });
      await f.replace({ enabled: false, title: 'off' }); await f.replace({ enabled: true, title: inactive }); assert.equal(f.owner(), null);
      if (inactive === 'minimize') f.graph.restoreSurface('owner'); else f.controller.updateSurface('owner', { collapsed: false });
      await f.runtime.refresh(); assert.equal(f.owner().querySelector('h1').textContent, inactive);
    }
  } finally { await f.close(); }
});

test('actual queued render work cannot write after Close and a compacted Destroy never returns through a true guard', async () => {
  const f = await fixture({ enabled: true });
  try {
    const owner = f.owner(), scope = f.runtime.getSurfaceBoundary('owner'), token = scope.capture();
    f.hold(); const rendering = f.runtime.refresh();
    await new Promise(resolve => setImmediate(resolve));
    f.graph.closeSurface('owner'); f.release();
    await rendering;
    assert.equal(f.owner(), owner); assert.equal(owner.hidden, true);
    f.controller.apply([{ operation: 'destroy', id: 'owner' }, { operation: 'destroy', id: 'sibling' }]);
    assert(!f.controller.readSnapshot({ includeDestroyed: true }).surfaces.some(value => value.id === 'owner'));
    await f.replace({ enabled: true, title: 'not resurrected' }); assert.equal(f.owner(), null);
    await f.graph.openSurface('owner', { recreate: true }); await f.runtime.refresh();
    assert.equal(f.owner().querySelector('h1').textContent, 'not resurrected'); assert.equal(scope.isCurrent(token), false);
    assert.equal(f.controller.readSnapshot().surfaces.find(value => value.id === 'owner').generation, 2);
  } finally { await f.close(); }
});

test('a reentrant Controller close during own admission invalidation is never recaptured as a fresh grant', async () => {
  const f = await fixture();
  try {
    const boundary = f.runtime.getSurfaceBoundary('owner'); let closed = false;
    const detach = boundary.onInvalidate(reason => {
      if (reason === 'lifecycle-content-admitted' && !closed) { closed = true; f.controller.closeSurface('owner', 'reentrant-admission'); }
    });
    await f.replace({ enabled: true, title: 'cancelled admission' });
    assert.equal(closed, true); assert.equal(f.owner(), null);
    assert.equal(f.controller.readSnapshot().surfaces.find(value => value.id === 'owner').status, 'closed');
    await f.runtime.dispatchCommand('rename', { title: 'still closed' });
    assert.equal(f.owner(), null, 'an uncommitted admission cannot be mistaken for retained content');
    detach(); await f.graph.openSurface('owner'); await f.runtime.refresh();
    assert.equal(f.owner().querySelector('h1').textContent, 'still closed');
  } finally { await f.close(); }
  assert.equal(f.runtime.snapshot().phase, 'disposed');
});

test('portal-owned React hosts have independent typed keys, no false loader, and retire before their native owner disappears', async () => {
  const f = await fixture({ provider: true });
  try {
    assert.equal(f.hosts.length, 0); assert.equal(f.loads, 0); assert.equal(f.root.querySelector('#host-slot'), null);
    const initial = structuredClone(f.runtime.model.getState('ui'));
    try { await f.replace({ ...initial, enabled: true }); await f.runtime.whenXTensionsIdle(); }
    catch (error) { throw new Error(JSON.stringify({ message: error.message, hosts: f.hosts.map(row => row.host.snapshot()) }), { cause: error }); }
    assert.equal(f.loads, 2); assert.deepEqual(f.hosts.map(row => row.context.identity.address.keys), [[1], ['1']]);
    const first = [...f.root.querySelectorAll('output')], scopes = f.hosts.map(row => row.context.xtensionId);
    assert.equal(new Set(scopes).size, 2); assert.deepEqual(first.map(node => node.textContent), ['numeric', 'string']);
    assert.equal(f.nativeKernel.listResources().length, 2);
    const next = structuredClone(f.runtime.model.getState('ui')); next.items[0].title = 'only number';
    await f.replace(next); await f.runtime.whenXTensionsIdle();
    assert.deepEqual([...f.root.querySelectorAll('output')], first); assert.deepEqual(first.map(node => node.textContent), ['only number', 'string']);
    await f.replace({ ...next, enabled: false }); await f.runtime.whenXTensionsIdle();
    assert(f.hosts.every(row => row.host.snapshot().disposed)); assert.equal(f.nativeKernel.listResources().length, 0);
    assert.equal(f.owner(), null); assert.equal(f.root.querySelector('output'), null);
    await f.replace({ ...next, enabled: true }); await f.runtime.whenXTensionsIdle();
    assert.equal(f.hosts.length, 4); assert.equal(f.loads, 4);
    assert(f.hosts.slice(0, 2).every(row => row.host.snapshot().disposed));
    assert(f.hosts.slice(2).every(row => !row.host.snapshot().disposed));
    assert.notEqual(f.root.querySelector('output'), first[0]);
    f.graph.destroySurface('owner'); await f.runtime.whenXTensionsIdle();
    assert(f.hosts.every(row => row.host.snapshot().disposed)); assert.equal(f.nativeKernel.listResources().length, 0);
    await f.replace({ ...next, enabled: true }); await f.runtime.whenXTensionsIdle();
    assert.equal(f.hosts.length, 4); assert.equal(f.owner(), null);
  } finally { await f.close(); }
});

test('actual URL2 restore changes lifecycle guards through the shared Model/View barrier in both directions', async () => {
  const f = await fixture({ url: true });
  try {
    const control = f.root.querySelector('output'), lifetime = { navigationId: 'lifecycle-navigation', signal: new AbortController().signal, isCurrent: () => true };
    let first;
    for (const enabled of [true, false, true]) {
      const snapshot = structuredClone(f.runtime.model.snapshot()); snapshot.states.ui.enabled = enabled;
      const token = f.urlContract.encode(f.urlContract.capture(snapshot));
      const result = await f.runtime.restoreURLState(token, lifetime); await f.runtime.whenXTensionsIdle();
      assert.equal(result.status, 'restored'); assert.equal(f.runtime.model.getState('ui').enabled, enabled);
      assert.equal(!!f.owner(), enabled); assert.equal(f.root.querySelector('output'), control);
      if (enabled && !first) first = f.owner(); else if (enabled) assert.notEqual(f.owner(), first);
      assert.equal(f.controller.readSnapshot().surfaces.find(value => value.id === 'owner').generation, 1);
    }
    assert.equal(f.hosts.length, 1); assert.equal(f.loads, 1);
  } finally { await f.close(); }
});

test('a blocked legal undefined Surface never captures missing owner references of independent real providers', async () => {
  const f = await fixture({ provider: true, enabled: true, blockedUndefined: true, hideOwnerRef: true });
  try {
    assert.equal(f.root.querySelector('[data-maraca-surface="undefined"]'), null);
    assert.equal(f.controller.readSnapshot().surfaces.find(row => row.id === 'undefined').status, 'open');
    assert.equal(f.hosts.length, 2); assert.equal(f.loads, 2);
    assert.deepEqual(f.hosts.map(row => row.context.identity.address.keys), [[1], ['1']]);
    const outputs = [...f.root.querySelectorAll('output')];
    assert.deepEqual(outputs.map(node => node.textContent), ['numeric', 'string']);
    // A Controller notification also runs the retirement filter. The optional
    // trusted facade owner report is absent, while both real graph leases live.
    f.controller.updateSurface('sibling', { label: 'unrelated update' });
    await f.runtime.whenXTensionsIdle();
    assert(f.hosts.every(row => !row.host.snapshot().disposed)); assert.equal(f.nativeKernel.listResources().length, 2);
    const next = structuredClone(f.runtime.model.getState('ui')); next.items[0].title = 'independent numeric';
    await f.replace(next); await f.runtime.whenXTensionsIdle();
    assert.deepEqual([...f.root.querySelectorAll('output')], outputs);
    assert.deepEqual(outputs.map(node => node.textContent), ['independent numeric', 'string']);
    assert.equal(f.loads, 2); assert.equal(f.hosts.length, 2);
  } finally { await f.close(); }
});
