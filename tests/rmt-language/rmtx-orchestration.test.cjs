'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { parseRmtxSource } = require('../../tools/rmt-language/rmtx-parser');
const { compileRmtxSource, createRmtxCompiler } = require('../../tools/rmt-language/rmtx-compiler');
const { createMaracaBuildPlan } = require('../../xtend-maraca');
const rootDir = path.resolve(__dirname, '../..');
const compiler = createRmtxCompiler({ syntaxVersion: '4.0.0' });
const source = `import { RMT, model, input } from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="typed">
  <RMT.State id="app" type="object" initial={{ready:false, saved:'initial', visits:0}} />
  <RMT.Action id="save"><RMT.Input name="name" type="string" />
    <RMT.Reduce state="app" path="saved" value={input.name} />
  </RMT.Action>
  <RMT.Action id="enable"><RMT.Input name="ready" type="boolean" optional={true} default={true} />
    <RMT.Reduce state="app" path="ready" value={input.ready} />
  </RMT.Action>
  <RMT.Action id="visit"><RMT.Reduce state="app" path="visits" value={1} /></RMT.Action>
  <RMT.Portal id="rootportal" root="#app" layer="surface" />
  <RMT.Surface id="panel" kind="region" component="button" portal="rootportal">
    <RMT.Lane name="visible"><RMT.Mount target="panel" /></RMT.Lane>
    <RMT.On event="click" action="save" payload={{name:'detail.name'}} when={model.app.ready===true} preventDefault={true} />
    <RMT.On event="visit" action="visit" payload={{}} />
  </RMT.Surface>
</RMT.Program>`;
function compile(text = source) { return compileRmtxSource({ text, filePath: 'typed.rmtx' }, { syntaxVersion: '4.0.0' }); }
function accepted(result) { assert.equal(result.ok, true, JSON.stringify(result.diagnostics)); return result; }
function plan(text = source, callback = compiler.compileSource) {
  return createMaracaBuildPlan({ sourceText: text, virtualSourcePath: 'typed.rmtx', orchestration: 'strict', kernel: 'strict',
    hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false },
  { rootDir, inspectToolchain: false, compileSource: callback });
}

test('profile4 publishes separate source, input, orchestration and event contracts', () => {
  const result = accepted(compile());
  assert.equal(result.schema, 'xtend.rmtx.compile-result.v4');
  assert.equal(result.parserResult.hostScopes.schema, 'xtend.rmtx.host-scopes.v2');
  assert.equal(result.selectorDependencies.schema, 'xtend.rmtx.selector-dependencies.v3');
  assert.equal(result.orchestrationArtifacts.schema, 'xtend.rmt.app-orchestration.v2');
  assert.equal(result.orchestrationArtifacts.actions.schema, 'xtend.rmt.action-plan.v2');
  assert.equal(result.orchestrationArtifacts.actions.inputContract.schema, 'xtend.rmt.action-input-contract.v1');
  assert(result.orchestrationArtifacts.events.every(event => event.schema === 'xtend.rmt.native-event-binding.v2'));
  assert.equal(accepted(plan()).schema, 'xtend.maraca.build-plan.v8');
});

test('the source4 ingress derives input rules from actual source rather than caller reports', () => {
  const compiled = accepted(compile());
  const forged = { ...compiled, orchestrationArtifacts: { ...compiled.orchestrationArtifacts, actions: {} } };
  const actual = accepted(plan(source, () => forged));
  assert.equal(actual.orchestration.artifact.actions.schema, 'xtend.rmt.action-plan.v2');
  assert.equal(plan('not declarative TSX', () => compiled).ok, false);
  for (const replace of [
    ['type="string"', 'type="Customer"'],
    ['name="name" type="string"', 'name="name" type="string" default={2}'],
    ["payload={{name:'detail.name'}}", "payload={{unknown:'detail.name'}}"],
    ['<RMT.Mount target="panel" />', '<RMT.Mount target="panel" when={model.app.ready===true} />'],
    ['value={input.name}', 'value={input.name.trim()}']
  ]) assert.equal(compile(source.replace(...replace)).ok, false, replace.join(' → '));
});

test('source4 factories preserve their default for undefined overrides and omit only optional Event inputs', () => {
  assert.equal(compiler.compileSource(source, { syntaxVersion: undefined }).apiVersion, '4.0.0');
  assert.equal(compiler.compileSource(source, { syntaxVersion: '1.0.0' }).apiVersion, '1.0.0');
  accepted(compile(source.replace('<RMT.Input name="name" type="string" />',
    '<RMT.Input name="name" type="string" /><RMT.Input name="notify" type="boolean" optional={true} default={true}/>')));
  accepted(compile(source.replace('<RMT.On event="visit"', '<RMT.On event="enable" action="enable" payload={{}}/><RMT.On event="visit"')));
  accepted(compile(source.replace('<RMT.Input name="name" type="string" />', '<RMT.Input name="name" type="string" default="fallback"/>')
    .replace("payload={{name:'detail.name'}}", 'payload={{}}')));
});

test('closed reducer templates and source action helpers lower into the existing shared backend', () => {
  const text = `import {RMT,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="templates"><RMT.State id="data" type="object" initial={{name:'',nested:[]}} />
<RMT.Action id="replace"><RMT.Input name="name" type="string"/>
<RMT.Reduce state="data" value={{name:input.name,nested:[1,'1']}}/>
<RMT.Emit event="saved" payload={{name:input.name,nested:{name:input.name}}}/>
</RMT.Action></RMT.Program>`;
  const result = accepted(compile(text));
  const action = result.orchestrationArtifacts.actions.actions.find(action => action.id === 'replace');
  assert.equal(action.reducers[0].valueKind, 'template');
  const parsed = parseRmtxSource(text.replace("nested:[1,'1']", 'nested:[...input.values]'), { syntaxVersion: '4.0.0' });
  assert.equal(parsed.ok, false);
});

async function createRuntime(buildPlan) {
  const { JSDOM } = require('jsdom');
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
  const dom = new JSDOM('<main id="app"></main>', { url: 'https://typed-native.invalid/' });
  const host = dom.window.document.querySelector('main'), scheduler = createRmtKernelScheduler({ preferPostTask: false });
  const runtime = createMaracaPlanRuntime({ plan: buildPlan, root: host, moduleApis: apis, kernelApi, scheduler,
    fabric: require('../../fabric/xtend-fabric').createXtendFabric(), documentTarget: dom.window.document, windowTarget: dom.window,
    hydrateOnBoot: false, ensureComponentsOnBoot: false,
    viewProjectionPort: apis.viewProjection.createRmtMaracaViewProjectionAdapter({ root: host, documentTarget: dom.window.document }) });
  return { runtime, dom, host, scheduler, dispose() { runtime.dispose(); scheduler.dispose(); dom.window.close(); } };
}
async function waitFor(check, message) {
  for (let attempt = 0; attempt < 100; attempt++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  assert.fail(message);
}

test('typed native ingress validates before DOM governance, Action execution and Model mutation', async () => {
  const context = await createRuntime(accepted(plan())); const { runtime, dom, host } = context;
  try {
    await runtime.boot(); assert.equal(runtime.schema, 'xtend.maraca.plan-runtime.v13');
    let reads = 0;
    host.querySelector('button').dispatchEvent(new dom.window.CustomEvent('click', { bubbles: true,
      detail: Object.defineProperty({}, 'name', { enumerable: true, get() { reads++; return 'bad'; } }) }));
    await waitFor(() => runtime.snapshot().events.length === 1, 'guarded event not observed'); assert.equal(reads, 0);
    await runtime.dispatchCommand('enable', {}); assert.equal(runtime.model.getState('app').ready, true);
    const invalid = new dom.window.CustomEvent('click', { bubbles: true, cancelable: true, detail: { name: 123 } });
    host.querySelector('button').dispatchEvent(invalid);
    await waitFor(() => runtime.snapshot().events.length === 2, 'invalid native payload not observed');
    assert.equal(invalid.defaultPrevented, false); assert.equal(runtime.model.getState('app').saved, 'initial');
    await assert.rejects(runtime.dispatchCommand('save', { name: null }));
    await assert.rejects(runtime.dispatchCommand('save', { name: 'x', extra: true }));
    assert.equal(runtime.model.getState('app').saved, 'initial');
    const valid = new dom.window.CustomEvent('click', { bubbles: true, cancelable: true, detail: { name: 'typed' } });
    host.querySelector('button').dispatchEvent(valid);
    await waitFor(() => runtime.model.getState('app').saved === 'typed', 'valid native payload did not reach Model');
    assert.equal(valid.defaultPrevented, true);
    host.querySelector('button').dispatchEvent(new dom.window.CustomEvent('visit', { bubbles: true }));
    await waitFor(() => runtime.model.getState('app').visits === 1, 'empty Action payload did not execute');
  } finally { context.dispose(); }
});

test('closed action templates are executed by the real Model transaction path', async () => {
  const text = source.replace('value={input.name}', 'value={{value:input.name,list:[input.name,1]}}');
  const context = await createRuntime(accepted(plan(text)));
  try {
    await context.runtime.boot(); await context.runtime.dispatchCommand('save', { name: 'template' });
    assert.deepEqual(context.runtime.model.getState('app').saved, { value: 'template', list: ['template', 1] });
  } finally { context.dispose(); }
});

test('source4 dollar identifiers remain consistent across values, templates, handlers and the managed runtime', async () => {
  const text = `import {RMT,input,model} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="dollars">
<RMT.State id="$value" type="number" initial={0}/><RMT.State id="box" type="object" initial={{current:0}}/>
<RMT.Action id="save"><RMT.Input name="$next" type="number"/>
<RMT.Reduce state="$value" value={input.$next}/><RMT.Reduce state="box" value={{current:model.$value,next:input.$next}}/>
<RMT.Emit event="$saved" payload={{amount:input.$next}}/>
<RMT.ResultHandler phase="success" kind="reduce" state="box" value={{current:input.$next}}/>
<RMT.ResultHandler phase="success" kind="emit" event="$completed" payload={{amount:input.$next}}/>
</RMT.Action><RMT.Portal id="rootportal" root="#app" layer="surface"/>
<RMT.Surface id="panel" kind="region" component="button" portal="rootportal"><RMT.Lane name="visible"><RMT.Mount target="panel"/></RMT.Lane></RMT.Surface>
</RMT.Program>`;
  accepted(compile(text));
  const context = await createRuntime(accepted(plan(text)));
  try {
    await context.runtime.boot(); const emitted = [];
    context.runtime.subscribeEvents(event => { if (event.type === 'emit') emitted.push(event); });
    await context.runtime.dispatchCommand('save', { $next: 9 });
    assert.equal(context.runtime.model.getState('$value'), 9);
    assert.deepEqual(context.runtime.model.getState('box'), { current: 9 });
    assert.deepEqual(emitted.map(event => [event.event, event.payload]), [['$saved', { amount: 9 }], ['$completed', { amount: 9 }]]);
  } finally { context.dispose(); }
});
