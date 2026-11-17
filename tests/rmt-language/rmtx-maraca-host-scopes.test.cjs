'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const maraca = require('../../xtend-maraca');
const { createRmtxCompiler } = require('../../tools/rmt-language/rmtx-compiler');
const { materializeStateBindingArtifact } = require('../../tools/xtensions/state-binding-artifact');
const root = path.resolve(__dirname, '../..');
const compiler = createRmtxCompiler({ syntaxVersion: '3.0.0' });
const catalog = { items: [{ id: 'g', products: [{ id: 1, value: 'number', enabled: true }, { id: '1', value: 'string', enabled: true }] },
  { id: 'h', products: [{ id: 1, value: 'other-parent', enabled: true }] }] };
const scopedPath = ['items', { repeat: 0 }, 'products', { repeat: 1 }];
function source(initial = catalog) {
  return `import {RMT,model,item} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="bridge"><RMT.State id="catalog" type="object" initial={${JSON.stringify(initial)}}/>
<RMT.Repeat from={model.catalog.items} keyBy={item.id}><RMT.Repeat from={item.products} keyBy={item.id}>
<RMT.Surface id="host" component="div" present={item.enabled}><RMT.Lane name="visible"><RMT.Mount target="widget"/></RMT.Lane></RMT.Surface>
</RMT.Repeat></RMT.Repeat></RMT.Program>;`;
}
function bindings() {
  return { schema: 'xtend.xtensions.state-binding-artifact.v3', documentId: 'bridge', bindings: [{ surface: 'host', binding: {
    schema: 'xtend.xtensions.state-binding.v2', address: { documentId: 'bridge', declarationId: 'widget', keys: [] },
    props: { value: { state: 'catalog', path: [...scopedPath, 'value'], type: 'string' } }, intents: {}
  } }] };
}
function compile(text = source(), sidecar = bindings()) {
  const result = compiler.compileSource({ text, filePath: 'bridge.rmtx' }, { xtensionBindings: sidecar });
  assert(result.ok, JSON.stringify(result.diagnostics)); return result;
}
function plan(text = source(), sidecar = bindings(), callback = compiler.compileSource) {
  return maraca.createMaracaBuildPlan({ sourceText: text, virtualSourcePath: 'bridge.rmtx',
    ...(sidecar === undefined ? {} : { xtensionBindings: sidecar }), orchestration: 'strict', kernel: 'off', hydration: 'off',
    validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false, compileSource: callback });
}
function accepted(value) { assert.equal(value.ok, true, JSON.stringify(value.diagnostics)); return value; }
function blocked(value) {
  assert.equal(value.ok, false); assert.equal(value.status, 'compile_failed');
  assert.equal(value.xtensionBindings, undefined); assert.equal(value.orchestration.enabled, false);
  assert(value.diagnostics.some(diagnostic => diagnostic.severity === 'error')); return value;
}
function rows(value, state = catalog) { return materializeStateBindingArtifact(value.xtensionBindings, { states: { catalog: state } }); }

test('Maraca reparses productive v3 source scopes before revalidating the projected existing sidecar', () => {
  assert.equal(maraca.MARACA_RMTX_HOST_SCOPE_API_VERSION, '1.0.0');
  const input = bindings(), before = JSON.stringify(input), result = accepted(plan(source(), input));
  assert.equal(result.schema, 'xtend.maraca.build-plan.v4');
  assert.equal(result.rmt.compilerSchema, 'xtend.rmtx.compile-result.v3');
  assert.deepEqual(result.xtensionBindings, compile().xtensionBindings);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(rows(result).map(row => row.binding.address.keys), [['g', 1], ['g', '1'], ['h', 1]]);
  const reordered = structuredClone(catalog); reordered.items.reverse(); reordered.items[1].products.reverse();
  assert.deepEqual(rows(result, reordered).map(row => row.hostSurface), rows(result).map(row => row.hostSurface).reverse());
});

test('empty source collections remain valid host declarations with no materialized instances', () => {
  const empty = { items: [] }, result = accepted(plan(source(empty)));
  assert.equal(result.xtensionBindings.bindings[0].repeat.length, 2);
  assert.deepEqual(rows(result, empty), []);
});

test('forged callback parser scope metadata is ignored in favor of the actual source', () => {
  const compiled = compile(); let reads = 0;
  const parserResult = { ...compiled.parserResult };
  Object.defineProperty(parserResult, 'hostScopes', { get() { reads++; throw Error('callback scope metadata must not be read'); } });
  const result = accepted(plan(source(), bindings(), () => ({ ...compiled, parserResult })));
  assert.equal(reads, 0); assert.deepEqual(rows(result).map(row => row.binding.address.keys), [['g', 1], ['g', '1'], ['h', 1]]);
  const altered = source().replace('keyBy={item.id}', 'keyBy={item.absent}');
  blocked(plan(altered, bindings(), () => ({ ...compiled, parserResult: { hostScopes: { schema: 'xtend.rmtx.host-scopes.v1', hosts: [] } } })));
});

test('callback success cannot bypass source errors, absent bindings or contradictory source scopes', () => {
  const compiled = compile(), callback = () => compiled;
  const malformed = source().replace('RMT.Repeat', 'RMT.Unknown');
  blocked(plan(malformed, bindings(), callback));
  // Omitting the option is deliberate; the callback's returned binding is not
  // authority to erase the source-to-sidecar check.
  const missing = maraca.createMaracaBuildPlan({ sourceText: source(), virtualSourcePath: 'bridge.rmtx', orchestration: 'strict',
    kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false, compileSource: callback });
  blocked(missing);
  for (const field of ['repeat', 'presence']) {
    const input = bindings(); input.bindings[0][field] = field === 'repeat'
      ? [{ state: 'catalog', path: ['items'], key: ['wrong'] }] : { state: 'catalog', path: ['wrong'] };
    const rejected = blocked(plan(source(), input, callback));
    assert(rejected.diagnostics.some(diagnostic => /conflicts/.test(diagnostic.message)));
  }
});

test('matching source scopes are idempotent while final validation still rejects malformed keys and accessors', () => {
  const compiled = compile(); accepted(plan(source(), compiled.xtensionBindings, () => compiled));
  const negativeZero = bindings(); negativeZero.bindings[0].binding.address.keys = [-0];
  blocked(plan(source(), negativeZero, () => compiled));
  let reads = 0;
  const accessor = Object.defineProperty({}, 'schema', { enumerable: true, get() { reads++; return 'xtend.xtensions.state-binding-artifact.v3'; } });
  blocked(plan(source(), accessor, () => compiled)); assert.equal(reads, 0);
});

test('the source scope bridge requires both v3 result schema and v3 source profile', () => {
  const compiled = compile(), invalidSource = 'not a declarative source';
  for (const metadata of [
    { schema: 'xtend.rmtx.compile-result.v1', sourceProfile: { syntax: 'rmtx', version: '1.0.0' } },
    { schema: 'xtend.rmtx.compile-result.v2', sourceProfile: { syntax: 'rmtx', version: '2.0.0' } },
    { schema: 'xtend.rmtx.compile-result.v3', sourceProfile: { syntax: 'rmtx', version: '2.0.0' } },
    { schema: 'xtend.rmtx.compile-result.v2', sourceProfile: { syntax: 'rmtx', version: '3.0.0' } }
  ]) {
    // Existing explicit callbacks keep their trusted source contract. A result
    // discriminator alone cannot opt them into the new host-scope bridge.
    const result = maraca.createMaracaBuildPlan({ sourceText: invalidSource, virtualSourcePath: 'bridge.rmtx', orchestration: 'strict',
      kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' },
    { rootDir: root, inspectToolchain: false, compileSource: () => ({ ...compiled, ...metadata }) });
    accepted(result); assert.equal(result.rmt.compilerSchema, metadata.schema);
  }
  blocked(plan(invalidSource, bindings(), () => compiled));
});

test('profile3 without source host scopes does not require an invented binding sidecar', () => {
  const text = "import {RMT} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id=\"static\"><RMT.Surface id=\"panel\" component=\"div\"><RMT.Lane name=\"visible\"><RMT.Mount target=\"panel\"/></RMT.Lane></RMT.Surface></RMT.Program>;";
  const result = maraca.createMaracaBuildPlan({ sourceText: text, virtualSourcePath: 'static.rmtx', orchestration: 'strict',
    kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' },
  { rootDir: root, inspectToolchain: false, compileSource: compiler.compileSource });
  accepted(result); assert.equal(result.xtensionBindings, undefined);
});

test('native On reaches the actual owning DOM surface, Action and Model while false guards precede payload mapping', async () => {
  const { JSDOM } = require('jsdom');
  const text = `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="nativeOn">
<RMT.State id="app" type="object" initial={{ready:false,count:0,lastId:null}}/>
<RMT.Action id="save"><RMT.Input name="id" type="json"/><RMT.Reduce state="app" path="count" value={1}/><RMT.Reduce state="app" path="lastId" value={input.id}/></RMT.Action>
<RMT.Action id="setReady"><RMT.Input name="ready" type="boolean"/><RMT.Reduce state="app" path="ready" value={input.ready}/></RMT.Action>
<RMT.Portal id="rootportal" root="#app" layer="surface"/>
<RMT.Surface id="panel" kind="region" component="button" portal="rootportal"><RMT.Lane name="visible"><RMT.Mount target="panel"/></RMT.Lane>
<RMT.On event="click" action="save" payload={{id:'detail.id'}} when={model.app.ready===true}/></RMT.Surface>
</RMT.Program>`;
  const buildPlan = accepted(maraca.createMaracaBuildPlan({ sourceText: text, virtualSourcePath: 'native-on.rmtx',
    orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false },
  { rootDir: root, inspectToolchain: false, compileSource: compiler.compileSource }));
  assert.equal(buildPlan.orchestration.artifact.events[0].target, '[data-rmt-surface="panel"]');
  const apis = {};
  for (const [name, file] of Object.entries({ state: 'rmt-state-selector-runtime', stateProjection: 'rmt-state-host-adapter',
    action: 'rmt-action-effect-runtime', app: 'rmt-app-runtime', renderer: 'rmt-dom-descriptor-renderer',
    viewProjection: 'rmt-maraca-view-projection-adapter', presentation: 'rmt-presentation-effect-adapter',
    events: 'rmt-event-routing-runtime', surfaces: 'rmt-surface-resource-graph-runtime', kernel: 'rmt-kernel-orchestration-controller' }))
    apis[name] = await import('../../xtendrmt/' + file + '.js');
  apis.surfaceController = await import('../../components/xsurfacemanager-controller.js');
  const { createMaracaPlanRuntime } = await import('../../xtend-maraca/plan-runtime.mjs');
  const kernelApi = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const dom = new JSDOM('<main id="app"></main>', { url: 'https://native-on.invalid/' });
  const host = dom.window.document.querySelector('main'), scheduler = createRmtKernelScheduler({ preferPostTask: false });
  const runtime = createMaracaPlanRuntime({ plan: buildPlan, root: host, moduleApis: apis, kernelApi, scheduler,
    fabric: require('../../fabric/xtend-fabric').createXtendFabric(), documentTarget: dom.window.document, windowTarget: dom.window,
    hydrateOnBoot: false, ensureComponentsOnBoot: false,
    viewProjectionPort: apis.viewProjection.createRmtMaracaViewProjectionAdapter({ root: host, documentTarget: dom.window.document }) });
  async function waitFor(check, message) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (check()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail(message);
  }
  try {
    await runtime.boot();
    const button = host.querySelector('button'); assert(button);
    let reads = 0;
    const blockedDetail = Object.defineProperty({}, 'id', { enumerable: true, get() { reads++; return 'unused'; } });
    button.dispatchEvent(new dom.window.CustomEvent('click', { bubbles: true, detail: blockedDetail }));
    await waitFor(() => runtime.snapshot().events.some(event => event.status === 'skipped'), 'false native guard did not reach the Event Router');
    assert.equal(reads, 0);
    assert.deepEqual(runtime.model.getState('app'), { ready: false, count: 0, lastId: null });
    await runtime.dispatchCommand('setReady', { ready: true });
    assert.equal(host.querySelector('button'), button);
    const id = { kind: 'native', parts: [1, '1'] };
    button.dispatchEvent(new dom.window.CustomEvent('click', { bubbles: true, detail: { id } }));
    await waitFor(() => runtime.model.getState('app').count === 1 && runtime.snapshot().events.some(event => event.status === 'success'),
      'native DOM click did not complete Action/Model dispatch');
    assert.deepEqual(runtime.model.getState('app'), { ready: true, count: 1, lastId: id });
    const events = runtime.snapshot().events;
    assert.deepEqual(events.map(event => event.status), ['skipped', 'success']);
    assert.deepEqual(events[1].payload, { id });
  } finally { runtime.dispose(); scheduler.dispose(); dom.window.close(); }
});
