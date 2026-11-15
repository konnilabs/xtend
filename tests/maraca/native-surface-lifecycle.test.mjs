import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createMaracaPlanRuntime } from '../../xtend-maraca/plan-runtime.mjs';
import * as state from '../../xtendrmt/rmt-state-selector-runtime.js';
import * as stateProjection from '../../xtendrmt/rmt-state-host-adapter.js';
import * as action from '../../xtendrmt/rmt-action-effect-runtime.js';
import * as app from '../../xtendrmt/rmt-app-runtime.js';
import * as renderer from '../../xtendrmt/rmt-dom-descriptor-renderer.js';
import * as viewProjection from '../../xtendrmt/rmt-maraca-view-projection-adapter.js';
import * as presentation from '../../xtendrmt/rmt-presentation-effect-adapter.js';
import * as events from '../../xtendrmt/rmt-event-routing-runtime.js';
import * as surfaces from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import * as surfaceController from '../../components/xsurfacemanager-controller.js';
import { createRmtKernelScheduler } from '../../xtendrmt/rmt-kernel-scheduler.js';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { createMaracaBuildPlan } = require('../../xtend-maraca');
const bindingRuntime = require('../../tools/xtensions/state-binding');
const { GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA } = require('../../tools/xtensions/runtime-host-controller');
const rootDir = new URL('../../', import.meta.url).pathname;
const source = `template ui {
  state view type object preserve { initial { label "one"; hidden false } }
  action rename { input label string; reduce state.view.label = input.label }
  action hide { input hidden boolean; reduce state.view.hidden = input.hidden }
  surface panel kind region component section { source state view; lane visible { mount panel.content } }
  surface sibling kind region component aside { lane idle { mount sibling.content } }
}`;

async function fixture({ legacy = false, key, invalidV2 = false, controllerOptions = {}, boundHost = false } = {}) {
  const dom = new JSDOM('<main></main>', { pretendToBeVisual: true });
  const root = dom.window.document.querySelector('main');
  const sourceText = boundHost ? source.replace(/}\s*$/, 'surface other kind region component div { lane idle { mount other.content } }\n}') : source;
  const bindings = boundHost ? { schema: bindingRuntime.XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, documentId: 'native-registry', bindings: [{ surface: 'sibling', binding: {
    schema: bindingRuntime.XTENSION_STATE_BINDING_SCHEMA, address: { documentId: 'native-registry', declarationId: 'controlled-host', keys: [] },
    props: { label: { type: 'string', state: 'view', path: ['label'] } }, intents: {}
  } }] } : null;
  const hostCounts = { created: 0, mounted: 0, updates: 0, unmounted: 0 };
  const plan = createMaracaBuildPlan({ source: 'tests/maraca/native-lifecycle.rmt', sourceText, ...(bindings ? { xtensionBindings: bindings } : {}),
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir, inspectToolchain: false });
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  const owner = plan.orchestration.artifact.render.root.children.find(node => node.surface === 'panel');
  owner.children = [{ type: 'element', tag: 'h1', text: { op: 'path', path: '$model.view.label' } }];
  if (key !== undefined) owner.key = key;
  const controller = surfaceController.createSurfaceController(controllerOptions);
  const scheduler = createRmtKernelScheduler({ preferPostTask: false });
  let graph;
  const port = viewProjection.createRmtMaracaViewProjectionAdapter({ root, documentTarget: dom.window.document,
    ...(legacy ? { adapterSchema: 'xtend.rmt.maraca-view-projection-adapter.v1' } : {}) });
  const writer = renderer.createRmtDomDescriptorRenderer({ documentTarget: dom.window.document });
  let failCommit = false;
  const domRenderer = { ...writer, commit(request) {
    if (failCommit) { failCommit = false; throw new Error('Injected native commit failure'); }
    return writer.commit(request);
  } };
  const runtime = createMaracaPlanRuntime({ plan, root, scheduler, surfaceController: controller, domRenderer,
    ...(bindings ? { xtensionBindingsRuntime: bindingRuntime, createXTensionHost() {
      // A trusted minimal graph-host port isolates registry retirement from
      // framework rendering, which is covered by the real React/Vue matrix.
      hostCounts.created++;
      return { schema: GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA, apiVersion: '4.0.0',
        async mount() { hostCounts.mounted++; return { status: 'ok' }; },
        async update() { hostCounts.updates++; return { status: 'ok' }; },
        async suspend() { return { status: 'ok' }; }, async resume() { return { status: 'ok' }; },
        async unmount() { hostCounts.unmounted++; return { status: 'ok' }; }, async whenIdle() {},
        snapshot() { return { resourceGraph: { surfaceId: 'panel' } }; } };
    } } : {}),
    hydrateOnBoot: false, ensureComponentsOnBoot: false, viewProjectionPort: invalidV2 ? { ...port, projectSurfaceLifecycle: undefined } : port,
    moduleApis: { state, stateProjection, action, app, renderer, viewProjection, presentation, events, surfaceController,
      surfaces: { ...surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } } } });
  try { await runtime.boot(); } catch (error) { runtime.dispose(); await runtime.whenXTensionsIdle(); controller.dispose(); scheduler.dispose(); dom.window.close(); throw error; }
  const panel = () => root.querySelector('[data-maraca-surface="panel"]');
  return { dom, root, plan, runtime, controller, writer, port, hostCounts, failNextCommit() { failCommit = true; }, get graph() { return graph; }, panel,
    async close() { runtime.dispose(); await runtime.whenXTensionsIdle(); controller.dispose(); scheduler.dispose(); dom.window.close(); } };
}

test('native close/commit/resume preserves identity, current Model and unrelated roots', async () => {
  const f = await fixture();
  try {
    const panel = f.panel(), header = panel.querySelector('h1'), sibling = f.root.querySelector('aside');
    f.graph.closeSurface('panel');
    assert.equal(panel.hidden, true);
    await f.runtime.dispatchCommand('rename', { label: 'closed update' });
    assert.equal(f.runtime.model.getState('view').label, 'closed update');
    assert.equal(f.panel(), panel); assert.equal(panel.hidden, true); assert.equal(header.textContent, 'closed update');
    assert.equal(f.root.querySelector('aside'), sibling);
    await f.graph.openSurface('panel');
    assert.equal(panel.hidden, false); assert.equal(f.panel(), panel); assert.equal(panel.querySelector('h1'), header);
  } finally { await f.close(); }
});

test('direct Destroy from open synchronously fences the old command before Model writes', async () => {
  const f = await fixture();
  try {
    const panel = f.panel(), boundary = f.runtime.getSurfaceBoundary('panel'), token = boundary.capture(), signal = boundary.signal;
    assert.equal(boundary.active, true);
    f.graph.destroySurface('panel');
    assert.equal(boundary.disposed, true); assert.equal(signal.aborted, true); assert.equal(panel.isConnected, false);
    const before = f.runtime.model.snapshot();
    const result = await f.runtime.dispatchCommand('rename', { label: 'forbidden' }, {}, { signal, isCurrent: () => boundary.isCurrent(token) });
    assert.equal(result.status, 'superseded'); assert.deepEqual(f.runtime.model.snapshot(), before); assert.equal(f.panel(), null);
  } finally { await f.close(); }
});

test('unscoped commands after Destroy update Model without resurrecting its native view', async () => {
  const f = await fixture();
  try {
    const sibling = f.root.querySelector('aside');
    f.graph.destroySurface('panel');
    await f.runtime.dispatchCommand('rename', { label: 'global update' });
    assert.equal(f.runtime.model.getState('view').label, 'global update'); assert.equal(f.panel(), null);
    assert.equal(f.graph.getSurface('panel').state, 'destroyed'); assert.equal(f.root.querySelector('aside'), sibling);
  } finally { await f.close(); }
});

test('explicit recreation authorizes a new native generation and never revives old tokens', async () => {
  const f = await fixture();
  try {
    const originalPanel = f.panel(), old = f.runtime.getSurfaceBoundary('panel'), token = old.capture(), signal = old.signal;
    const pending = f.runtime.dispatchCommand('rename', { label: 'stale' }, {}, { signal, isCurrent: () => old.isCurrent(token) });
    f.graph.destroySurface('panel');
    await f.graph.openSurface('panel', { recreate: true });
    assert.equal((await pending).status, 'superseded');
    const current = f.runtime.getSurfaceBoundary('panel');
    assert.notEqual(current, old); assert.equal(current.active, true); assert.equal(old.isCurrent(token), false);
    await f.runtime.dispatchCommand('rename', { label: 'fresh' });
    assert.notEqual(f.panel(), originalPanel); assert.equal(f.panel().querySelector('h1').textContent, 'fresh');
    assert.equal(f.controller.readSnapshot().surfaces.find(s => s.id === 'panel').generation, 2);
    assert.equal(old.disposed, true); assert.equal(old.isCurrent(token), false);
  } finally { await f.close(); }
});

test('a recreated native key retains evaluation of the original structured Model expression', async () => {
  const f = await fixture({ key: { op: 'path', path: '$model.view.label' } });
  try {
    assert.equal(f.panel().getAttribute('data-rmt-key'), 'one');
    f.graph.destroySurface('panel'); await f.graph.openSurface('panel', { recreate: true });
    await f.runtime.dispatchCommand('rename', { label: 'two' });
    assert.equal(f.panel().getAttribute('data-rmt-key'), 'two::surface-generation:2');
    assert.equal(f.panel().querySelector('h1').textContent, 'two');
  } finally { await f.close(); }
});

test('model hidden state survives a close/resume lifecycle overlay and subsequent Model updates', async () => {
  const f = await fixture();
  try {
    await f.runtime.dispatchCommand('hide', { hidden: true });
    const panel = f.panel(); assert.equal(panel.hidden, true);
    f.graph.closeSurface('panel'); await f.runtime.dispatchCommand('rename', { label: 'closed' }); await f.graph.openSurface('panel');
    assert.equal(panel.hidden, true); assert.equal(f.runtime.getSurfaceBoundary('panel').active, false);
    await f.runtime.dispatchCommand('hide', { hidden: false });
    assert.equal(panel.hidden, false);
  } finally { await f.close(); }
});

test('legacy v1 ViewProjectionPort remains accepted while complete lifecycle authority fences tokens', async () => {
  const f = await fixture({ legacy: true });
  try {
    const boundary = f.runtime.getSurfaceBoundary('panel'), token = boundary.capture();
    f.graph.destroySurface('panel');
    assert.equal(boundary.disposed, true); assert.equal(boundary.isCurrent(token), false);
  } finally { await f.close(); }
});


test('a claimed v2 View port missing lifecycle projection is rejected before boot', async () => {
  await assert.rejects(fixture({ invalidV2: true }), error => error.code === 'xtend.maraca.mvc.view-projection-port-invalid');
});

test('a failed native Model commit restores the closed lifecycle overlay in finally', async () => {
  const f = await fixture();
  try {
    const panel = f.panel(); f.graph.closeSurface('panel'); assert.equal(panel.hidden, true);
    f.failNextCommit();
    await assert.rejects(f.runtime.dispatchCommand('rename', { label: 'render failed' }), /Injected native commit failure/);
    assert.equal(panel.hidden, true); assert.equal(f.runtime.getSurfaceBoundary('panel').active, false);
    await f.runtime.dispatchCommand('rename', { label: 'recovered' });
    assert.equal(panel.hidden, true); assert.equal(panel.querySelector('h1').textContent, 'recovered');
  } finally { await f.close(); }
});

test('deep foreign roots survive native Destroy and do not become a recreated owner view', async () => {
  const f = await fixture();
  try {
    const panel = f.panel(), header = panel.querySelector('h1');
    const foreign = f.writer.commit({ operation: 'create-node', descriptor: { type: 'element', tag: 'article', children: [{ type: 'element', tag: 'input' }] },
      ownership: { mode: 'strict', owner: 'independent-provider', domains: Object.fromEntries(['structure','content','attributes','properties','class','part','styleTokens'].map(domain => [domain,'independent-provider'])) } }).nodes[0];
    const wrapper = f.dom.window.document.createElement('div'); wrapper.append(foreign); panel.append(wrapper);
    const input = foreign.querySelector('input'); input.focus();
    const observer = new f.dom.window.MutationObserver(() => {}); observer.observe(f.root, { childList: true, subtree: true });
    f.graph.destroySurface('panel');
    assert.equal(header.isConnected, false); assert.equal(foreign.isConnected, true); assert.equal(f.dom.window.document.activeElement, input);
    assert.equal(f.port.resolveSurface('panel'), null);
    assert(!observer.takeRecords().some(record => [...record.removedNodes].some(node => node === foreign || node.contains?.(foreign))));
    await f.runtime.dispatchCommand('rename', { label: 'global' });
    assert.equal(foreign.isConnected, true); assert.equal(f.dom.window.document.activeElement, input); assert.equal(f.port.resolveSurface('panel'), null);
    await f.graph.openSurface('panel', { recreate: true }); await f.runtime.dispatchCommand('rename', { label: 'new native owner' });
    const current = f.port.resolveSurface('panel');
    assert(current); assert.notEqual(current, panel); assert.equal(current.querySelector('h1').textContent, 'new native owner');
    assert.equal(foreign.isConnected, true); assert.equal(foreign.parentNode, wrapper); assert.equal(wrapper.parentNode, panel);
    assert.equal(f.dom.window.document.activeElement, input); observer.disconnect();
  } finally { await f.close(); }
});


test('atomic multi-Surface Destroy revokes scopes whose tombstones were evicted before publication', async () => {
  const f = await fixture({ controllerOptions: { maxTombstones: 1 } });
  try {
    const panel = f.panel(), sibling = f.root.querySelector('aside');
    const scopes = ['panel', 'sibling'].map(id => {
      const boundary = f.runtime.getSurfaceBoundary(id);
      return { id, boundary, token: boundary.capture(), signal: boundary.signal };
    });
    assert(scopes.every(scope => scope.boundary.active));
    const before = f.runtime.model.snapshot();
    const destroyed = f.controller.apply([{ operation: 'destroy', id: 'panel' }, { operation: 'destroy', id: 'sibling' }]);
    assert.equal(destroyed.ok, true);
    const authoritative = f.controller.readSnapshot({ includeDestroyed: true });
    assert.deepEqual(authoritative.surfaces.map(row => row.id), ['sibling']);
    assert.equal(authoritative.surfaces[0].status, 'destroyed');
    for (const scope of scopes) {
      assert.equal(scope.boundary.disposed, true, scope.id);
      assert.equal(scope.signal.aborted, true, scope.id);
      const result = await f.runtime.dispatchCommand('rename', { label: 'forbidden-' + scope.id }, {},
        { signal: scope.signal, isCurrent: () => scope.boundary.isCurrent(scope.token) });
      assert.equal(result.status, 'superseded', scope.id);
    }
    assert.deepEqual(f.runtime.model.snapshot(), before);
    assert.equal(panel.isConnected, false); assert.equal(sibling.isConnected, false);
    assert.equal(f.port.resolveSurface('panel'), null); assert.equal(f.port.resolveSurface('sibling'), null);
    // Native projection keeps ended scopes internally. It never inserts their
    // inferred records back into the Controller's public bounded registry.
    assert.deepEqual(f.controller.readSnapshot({ includeDestroyed: true }).surfaces.map(row => row.id), ['sibling']);
    await f.runtime.dispatchCommand('rename', { label: 'unscoped after atomic destroy' });
    assert.equal(f.runtime.model.getState('view').label, 'unscoped after atomic destroy');
    assert.equal(f.panel(), null); assert.equal(f.root.querySelector('aside'), null);
    await f.graph.openSurface('panel', { recreate: true });
    const current = f.runtime.getSurfaceBoundary('panel');
    assert.notEqual(current, scopes[0].boundary); assert.equal(current.active, true);
    await f.runtime.dispatchCommand('rename', { label: 'authorized after trimmed recreation' });
    assert.notEqual(f.panel(), panel); assert.equal(f.panel().querySelector('h1').textContent, 'authorized after trimmed recreation');
    assert.equal(f.controller.readSnapshot({ includeDestroyed: true }).surfaces.find(row => row.id === 'panel').generation, 2);
    for (const scope of scopes) assert.equal(scope.boundary.isCurrent(scope.token), false);
  } finally { await f.close(); }
});


test('trimmed owner disappearance retires its registry binding before later Model delivery', async () => {
  const f = await fixture({ controllerOptions: { maxTombstones: 1 }, boundHost: true });
  try {
    assert.equal(f.hostCounts.mounted, 1); assert.equal(f.runtime.getXTensionBindings().length, 1);
    // The target remains open. Only the trusted host's owning Surface disappears
    // from the complete registry, so target destruction cannot mask this case.
    f.controller.apply([{ operation: 'destroy', id: 'panel' }, { operation: 'destroy', id: 'other' }]);
    const rows = f.controller.readSnapshot({ includeDestroyed: true }).surfaces;
    assert(!rows.some(row => row.id === 'panel')); assert(rows.some(row => row.id === 'sibling' && row.status === 'open'));
    assert.equal(f.runtime.getXTensionBindings().length, 0);
    await f.runtime.whenXTensionsIdle(); assert.equal(f.hostCounts.unmounted, 1);
    await f.runtime.dispatchCommand('rename', { label: 'after trimmed owner' }); await f.runtime.whenXTensionsIdle();
    assert.equal(f.runtime.model.getState('view').label, 'after trimmed owner');
    assert.equal(f.hostCounts.updates, 0); assert.equal(f.hostCounts.created, 1); assert.equal(f.runtime.getXTensionBindings().length, 0);
  } finally { await f.close(); }
});
