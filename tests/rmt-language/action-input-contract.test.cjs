'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { createRmtActionInputContract } = require('../../tools/rmt-language/action-input-contract');
const profile = { syntax: 'rmtx', version: '4.0.0' };
const modules = Promise.all([import('../../xtendrmt/rmt-action-effect-runtime.js'), import('../../xtendrmt/rmt-event-routing-runtime.js')]);
function contract(actions, changes = {}) {
  return createRmtActionInputContract({ actions }, { schema: 'xtend.rmtx.action-input-rules.v1', sourceProfile: profile,
    actions: actions.map(action => ({ id: action.id, inputs: (action.inputs || []).map(input => ({ ...input, ...(changes[action.id]?.[input.name] || {}) })) })) });
}
const actions = [{ id: 'save', inputs: [{ name: 'name', type: 'string' }, { name: 'count', type: 'number' }, { name: 'value', type: 'json' }] },
  { id: 'visit', inputs: [] }];
const payload = { name: 'ok', count: 2, value: { nested: [true, null] } };
function binding(action = 'save', mapping = { name: '$detail.name', count: '$detail.count', value: '$detail.value' }) {
  return { schema: 'xtend.rmt.native-event-binding.v2', inputContract: action, id: action, event: 'change', action,
    payload: mapping, governance: { preventDefault: true }, guard: { kind: 'confirm' } };
}

test('the closed compiler contract binds every Action and supports JSON types, typed arrays and no-input Actions', () => {
  const definitions = [...actions, { id: 'many', inputs: [{ name: 'values', type: 'number[][]' }, { name: 'record', type: 'object' }] }];
  const c = contract(definitions);
  assert.equal(c.schema, 'xtend.rmt.action-input-contract.v1'); assert.equal(c.apiVersion, '1.0.0');
  assert.deepEqual(c.sourceProfile, profile); assert.deepEqual(c.actions[1].fields, {});
  assert.equal(c.actions[0].fields.name.required, true); assert.equal(c.actions[0].fields.name.nullable, false);
  assert.equal(c.actions[0].fields.value.nullable, true);
  assert.equal(c.actions[2].fields.values.items.items.type, 'number');
  assert(Object.isFrozen(c.actions[2].fields.values.items));
});

test('source metadata is complete, safe and type-bound rather than an alternate Action declaration', () => {
  for (const mutate of [r => r.actions.pop(), r => r.actions[0].inputs.pop(), r => r.actions[0].inputs[0].type = 'json',
    r => r.actions[0].inputs[0].nullable = 'yes', r => r.actions[0].inputs[0].default = 2,
    r => r.actions[0].inputs[0].extra = true, r => r.actions[0].id = 'missing']) {
    const r = { schema: 'xtend.rmtx.action-input-rules.v1', sourceProfile: profile,
      actions: actions.map(action => ({ id: action.id, inputs: action.inputs.map(input => ({ ...input })) })) };
    mutate(r); assert.throws(() => createRmtActionInputContract({ actions }, r));
  }
  assert.throws(() => contract([{ id: 'bad', inputs: [{ name: 'item', type: 'UncapturedApplicationType' }] }]));
  let reads = 0; const r = Object.defineProperty({}, 'schema', { enumerable: true, get() { reads++; return 'ignored'; } });
  assert.throws(() => createRmtActionInputContract({ actions }, r)); assert.equal(reads, 0);
});

test('defaults apply only to missing fields and nullable/default rules are checked before runtime startup', async () => {
  const [api] = await modules;
  const declarations = [{ id: 'save', inputs: [{ name: 'name', type: 'string' }, { name: 'optional', type: 'number' }, { name: 'nullable', type: 'string' }] }];
  const policy = contract(declarations, { save: { name: { default: 'default' }, optional: { optional: true }, nullable: { nullable: true } } });
  const port = api.createRmtActionInputValidationPort(policy, declarations);
  assert.deepEqual(port.validate('save', { nullable: null }), { name: 'default', nullable: null });
  assert.deepEqual(port.validate('save', { name: '', optional: -0, nullable: '' }), { name: '', optional: -0, nullable: '' });
  assert.throws(() => port.validate('save', { name: null, nullable: null }), /null/);
  assert.throws(() => port.validate('save', { optional: null, nullable: null }), /null/);
  assert.throws(() => port.validate('save', {}), /missing/);
  const bad = structuredClone(policy); bad.actions[0].fields.name.default = 2;
  assert.throws(() => api.createRmtActionInputValidationPort(bad, declarations));
  const empty = api.createRmtActionInputValidationPort(contract([actions[1]]), [actions[1]]);
  assert.deepEqual(empty.validate('visit', {}), {});
  for (const value of [null, [], { extra: true }]) assert.throws(() => empty.validate('visit', value));
});

test('runtime policy validation requires complete Actions and their actual declared input types', async () => {
  const [api] = await modules;
  for (const mutate of [p => p.actions.pop(), p => p.actions.push(p.actions[0]), p => p.schema = 'future',
    p => p.actions[0].fields.name.type = 'json', p => p.actions[0].fields.name.required = 'yes',
    p => p.actions[0].fields.name.extra = true]) {
    const policy = structuredClone(contract(actions)); mutate(policy);
    assert.throws(() => api.createRmtActionInputValidationPort(policy, actions));
  }
  assert.throws(() => api.createRmtActionInputValidationPort(contract(actions), []));
  const duplicate = [{ id: 'save', inputs: [{ name: 'name', type: 'string' }, { name: 'name', type: 'string' }] }];
  assert.throws(() => api.createRmtActionInputValidationPort({ ...contract([actions[0]]), actions: [{ id: 'save', fields: {
    name: { type: 'string', required: true, nullable: false }, other: { type: 'string', required: true, nullable: false } } }] }, duplicate));
});

test('invalid direct Action input is rejected before run allocation, resources, effects or Model writes', async () => {
  const [api] = await modules; let sideEffects = 0, getterReads = 0;
  const runtime = api.createRmtActionEffectRuntime({ actions: actions.map(action => ({ ...action, loadingState: 'loading', statusState: 'status', effects: ['effect'] })),
    inputContract: contract(actions), hostPort: { createRunId() { sideEffects++; }, createAbortController() { sideEffects++; throw Error('not reached'); } },
    modelCommandPort: { apply() { sideEffects++; } }, effectAdapter: { invoke() { sideEffects++; } },
    resourceManager: { acquire() { sideEffects++; }, releaseOwner() { sideEffects++; } } });
  const getter = Object.defineProperty({ ...payload }, 'name', { enumerable: true, get() { getterReads++; return 'read'; } });
  const hidden = Object.defineProperty({ ...payload }, 'hidden', { value: true });
  const symbol = { ...payload, [Symbol('hidden')]: true };
  const cycle = {}; cycle.self = cycle;
  const sparse = []; sparse.length = 1;
  const customArray = [1]; Object.setPrototypeOf(customArray, { injected: true });
  for (const candidate of [null, [], {}, { ...payload, name: 1 }, { ...payload, count: NaN }, { ...payload, count: Infinity },
    { ...payload, extra: true }, { ...payload, value: undefined }, { ...payload, value: () => {} }, { ...payload, value: 1n },
    { ...payload, value: new Date() }, { ...payload, value: sparse }, { ...payload, value: customArray }, { ...payload, value: cycle }, getter, hidden, symbol]) {
    const result = await runtime.runAction('save', candidate);
    assert.equal(result.schema, 'xtend.epic18.rmt-action-result.v2'); assert.equal(result.status, 'error');
    assert.equal(result.runId, ''); assert.equal(result.error.code, 'rmt.action.input.invalid');
    assert.deepEqual(result.effects, []); assert.deepEqual(result.modelOperations, []); assert.deepEqual(result.postCommitEffects, []);
  }
  assert.equal(sideEffects, 0); assert.equal(getterReads, 0); assert.deepEqual(runtime.listHistory(), []);
  assert.equal(runtime.getActionStatus('save'), 'idle');
});

test('accepted Action input is frozen, defaulted and exposed only by the opt-in result schema', async () => {
  const [api] = await modules;
  const declarations = [{ id: 'save', inputs: [{ name: 'count', type: 'number' }] }];
  const runtime = api.createRmtActionEffectRuntime({ actions: declarations, inputContract: contract(declarations, { save: { count: { default: -0 } } }) });
  assert.equal(runtime.schema, 'xtend.epic18.rmt-action-effect-runtime.v2');
  const result = await runtime.runAction('save', {});
  assert.equal(result.status, 'success'); assert.equal(Object.is(result.validatedInput.count, -0), true);
  assert(Object.isFrozen(result.validatedInput));
  const legacy = api.createRmtActionEffectRuntime({ actions: [{ id: 'save' }] });
  assert.equal(legacy.schema, 'xtend.epic18.rmt-action-effect-runtime.v1');
  assert.equal(Object.hasOwn(legacy, 'inputValidationPort'), false);
  const old = await legacy.runAction('save', { any: true });
  assert.equal(old.schema, 'xtend.epic18.rmt-action-result.v1'); assert.equal(Object.hasOwn(old, 'validatedInput'), false);
});

test('typed array and opaque object validation uses finite JSON without coercion or inferred nested schemas', async () => {
  const [api] = await modules;
  const declarations = [{ id: 'many', inputs: [{ name: 'numbers', type: 'number[][]' }, { name: 'object', type: 'object' }] }];
  const port = api.createRmtActionInputValidationPort(contract(declarations), declarations);
  assert.deepEqual(port.validate('many', { numbers: [[1, -0]], object: { free: ['json'] } }), { numbers: [[1, -0]], object: { free: ['json'] } });
  for (const candidate of [{ numbers: [['1']], object: {} }, { numbers: [1], object: {} }, { numbers: [], object: [] }])
    assert.throws(() => port.validate('many', candidate));
  const weakened = structuredClone(contract(declarations)); weakened.actions[0].fields.numbers.items.items.nullable = true;
  assert.throws(() => api.createRmtActionInputValidationPort(weakened, declarations));
});

test('native invalid input blocks before preventDefault, confirmation and dispatch', async () => {
  const [actionApi, eventApi] = await modules; let effects = 0;
  const port = actionApi.createRmtActionInputValidationPort(contract(actions), actions);
  const router = eventApi.createRmtEventRoutingRuntime({ bindings: [binding()], inputValidationPort: port,
    confirmAdapter: { confirm() { effects++; return true; } }, commandRuntime: { dispatchCommand() { effects++; } } });
  assert.equal(router.schema, 'xtend.epic18.rmt-event-routing-runtime.v3');
  const result = await router.routeEvent('save', { detail: { ...payload, name: 1 }, preventDefault() { effects++; } });
  assert.equal(result.schema, 'xtend.epic18.rmt-event-route-result.v2'); assert.equal(result.reason, 'action-input');
  assert.equal(result.status, 'blocked'); assert.equal(result.payload, null); assert.equal(effects, 0); router.dispose();
});

test('a false native Model guard skips input reads and validation before DOM governance', async () => {
  const [actionApi, eventApi] = await modules; let reads = 0, effects = 0;
  const port = actionApi.createRmtActionInputValidationPort(contract(actions), actions);
  const guardedPort = { ...port, validate() { effects++; throw Error('must not validate'); } };
  const router = eventApi.createRmtEventRoutingRuntime({ bindings: [{ ...binding(), condition: false }], inputValidationPort: guardedPort,
    commandRuntime: { dispatchCommand() { effects++; } } });
  const detail = Object.defineProperty({}, 'name', { enumerable: true, get() { reads++; return 'no'; } });
  const result = await router.routeEvent('save', { detail, preventDefault() { effects++; } });
  assert.equal(result.status, 'skipped'); assert.equal(result.reason, 'condition'); assert.equal(reads, 0); assert.equal(effects, 0); router.dispose();
});

test('native mappings dispatch validated JSON and no-input mappings ignore unrelated event detail', async () => {
  const [actionApi, eventApi] = await modules; const commands = [];
  const port = actionApi.createRmtActionInputValidationPort(contract(actions), actions);
  const router = eventApi.createRmtEventRoutingRuntime({ bindings: [{ ...binding(), guard: null }, { ...binding('visit', {}), guard: null }], inputValidationPort: port,
    commandRuntime: { dispatchCommand(command) { commands.push(command); return { status: 'success' }; } } });
  assert.equal((await router.routeEvent('save', { detail: payload })).status, 'success');
  assert.deepEqual(structuredClone(commands[0].payload), payload);
  assert.equal((await router.routeEvent('visit', { detail: { unrelated: 1 } })).status, 'success');
  assert.deepEqual(structuredClone(commands[1].payload), {}); router.dispose();
});

test('native mapping construction fails closed on schema, reference, fields and accessor paths', async () => {
  const [actionApi, eventApi] = await modules;
  const port = actionApi.createRmtActionInputValidationPort(contract(actions), actions);
  assert.throws(() => eventApi.createRmtEventRoutingRuntime({ bindings: [binding()] }));
  for (const change of [{ schema: undefined }, { inputContract: 'visit' }, { actionMode: 'cancel-action' }, { payload: {} },
    { payload: { ...binding().payload, unknown: '$detail.id' } }, { payload: { ...binding().payload, name: '$detail.constructor' } },
    { payload: { ...binding().payload, name: '$detail' } }])
    assert.throws(() => eventApi.createRmtEventRoutingRuntime({ bindings: [{ ...binding(), ...change }], inputValidationPort: port }));
  let reads = 0; const mapping = Object.defineProperty({}, 'name', { enumerable: true, get() { reads++; return '$detail.name'; } });
  assert.throws(() => eventApi.createRmtEventRoutingRuntime({ bindings: [binding('save', mapping)], inputValidationPort: port }));
  assert.equal(reads, 0);
  const changed = structuredClone(port.contract); changed.actions.pop();
  assert.throws(() => eventApi.createRmtEventRoutingRuntime({ bindings: [binding()], inputValidationPort: port, inputContract: changed }));
});

test('native missing optional mappings use declared defaults and reject event detail accessors without reading them', async () => {
  const [actionApi, eventApi] = await modules;
  const declarations = [{ id: 'save', inputs: [{ name: 'name', type: 'string' }] }], commands = [];
  const port = actionApi.createRmtActionInputValidationPort(contract(declarations, { save: { name: { default: 'fallback' } } }), declarations);
  const router = eventApi.createRmtEventRoutingRuntime({ bindings: [{ ...binding('save', { name: '$detail.name' }), guard: null }], inputValidationPort: port,
    commandRuntime: { dispatchCommand(command) { commands.push(command); return { status: 'success' }; } } });
  assert.equal((await router.routeEvent('save', { detail: {} })).status, 'success'); assert.deepEqual(structuredClone(commands[0].payload), { name: 'fallback' });
  let reads = 0; const detail = Object.defineProperty({}, 'name', { enumerable: true, get() { reads++; return 'unsafe'; } });
  assert.equal((await router.routeEvent('save', { detail })).reason, 'action-input'); assert.equal(reads, 0); assert.equal(commands.length, 1);
  for (const name of [undefined, () => 'unsafe']) assert.equal((await router.routeEvent('save', { detail: { name } })).reason, 'action-input');
  assert.equal(commands.length, 1);
  router.dispose();
});

test('unmapped native event detail cannot inject command metadata or execute getters', async () => {
  const [actionApi, eventApi] = await modules; let reads = 0; const commands = [];
  const port = actionApi.createRmtActionInputValidationPort(contract([actions[1]]), [actions[1]]);
  const router = eventApi.createRmtEventRoutingRuntime({ bindings: [{ ...binding('visit', {}), guard: null }], inputValidationPort: port,
    commandRuntime: { dispatchCommand(command) { commands.push(command); return { status: 'success' }; } } });
  const detail = { lane: 'background', correlationId: 'injected' };
  for (const name of ['schema', 'command', 'source', 'target']) Object.defineProperty(detail, name, { enumerable: true, get() { reads++; throw Error('unmapped detail'); } });
  assert.equal((await router.routeEvent('visit', { detail })).status, 'success');
  assert.equal(reads, 0); assert.equal(commands[0].lane, 'user-blocking'); assert.notEqual(commands[0].correlationId, 'injected'); router.dispose();
});

test('strict consumers distinguish legacy and opt-in native runtime factories and result schemas', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), ts = require('typescript');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-input-contract-types-'));
  try {
    const root = path.resolve(__dirname, '../..').replaceAll('\\', '/'), file = path.join(temporary, 'consumer.ts');
    fs.writeFileSync(file, `import {createRmtActionInputContract,type RmtxActionInputRules} from '${root}/tools/rmt-language/action-input-contract';
import {createRmtActionEffectRuntime,type RmtActionEffectRuntime,type RmtActionEffectRuntimeV2,type RmtActionEffectRuntimeOptionsV2} from '${root}/xtendrmt/rmt-action-effect-runtime';
import {createRmtEventRoutingRuntime,type RmtEventRoutingRuntime,type RmtEventRoutingRuntimeV3,type RmtEventRoutingRuntimeOptionsV3} from '${root}/xtendrmt/rmt-event-routing-runtime';
const rules:RmtxActionInputRules={schema:'xtend.rmtx.action-input-rules.v1',sourceProfile:{syntax:'rmtx',version:'4.0.0'},actions:[{id:'save',inputs:[{name:'name',type:'string',default:'default'}]}]};
const actions=[{id:'save',inputs:[{name:'name',type:'string'}]}];
const inputContract=createRmtActionInputContract({actions},rules);
const legacy:RmtActionEffectRuntime=createRmtActionEffectRuntime();
const modernOptions:RmtActionEffectRuntimeOptionsV2={actions,inputContract};
const modern:RmtActionEffectRuntimeV2=createRmtActionEffectRuntime(modernOptions);
const oldActionSchema:'xtend.epic18.rmt-action-effect-runtime.v1'=legacy.schema;
const newActionSchema:'xtend.epic18.rmt-action-effect-runtime.v2'=modern.schema;
const legacyEvents:RmtEventRoutingRuntime=createRmtEventRoutingRuntime();
const eventOptions:RmtEventRoutingRuntimeOptionsV3={inputValidationPort:modern.inputValidationPort,inputContract,bindings:[{schema:'xtend.rmt.native-event-binding.v2',inputContract:'save',id:'save',event:'save',action:'save',payload:{name:'$detail.name'}}]};
const events:RmtEventRoutingRuntimeV3=createRmtEventRoutingRuntime(eventOptions);
const oldEventSchema:'xtend.epic18.rmt-event-routing-runtime.v2'=legacyEvents.schema;
const newEventSchema:'xtend.epic18.rmt-event-routing-runtime.v3'=events.schema;
async function resultSchemas(){const a:'xtend.epic18.rmt-action-result.v1'=(await legacy.runAction('save')).schema;const b:'xtend.epic18.rmt-action-result.v2'=(await modern.runAction('save')).schema;const c:'xtend.epic18.rmt-event-route-result.v2'=(await events.routeEvent('save')).schema;void[a,b,c];}
// @ts-expect-error legacy Action interfaces remain legacy
const badLegacy:RmtActionEffectRuntime=modern;
// @ts-expect-error legacy Event interfaces remain legacy
const badEvents:RmtEventRoutingRuntime=events;
void[oldActionSchema,newActionSchema,oldEventSchema,newEventSchema,resultSchemas,badLegacy,badEvents];
`);
    const program = ts.createProgram([file], { noEmit: true, strict: true, skipLibCheck: false, types: [], target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10 });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => temporary,
      getCanonicalFileName: value => value, getNewLine: () => '\n' }));
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('closed template lowering is explicitly Source4 opt-in and legacy helper results stay byte identical', () => {
  const { lowerActionExpression, lowerActionResultHandler } = require('../../tools/rmt-language/action-execution-lowering');
  const { parseRmtxSource } = require('../../tools/rmt-language/rmtx-parser');
  const { compileRmtVNextAstResult } = require('../../tools/rmt-language/vnext-compiler');
  for (const expression of ['input.name', 'true', '2', 'null', '"input.name"'])
    assert.equal(JSON.stringify(lowerActionExpression(expression)), JSON.stringify(lowerActionExpression(expression, { allowTemplates: false })));
  const effect = { phase: 'success', effect: { kind: 'reduce', text: 'reduce state.app = input.name' } };
  assert.equal(JSON.stringify(lowerActionResultHandler(effect)), JSON.stringify(lowerActionResultHandler(effect, { allowTemplates: false })));
  for (const options of [undefined, { allowTemplates: false }])
    assert.throws(() => lowerActionExpression('{ "name" input.name }', options));
  assert.equal(lowerActionExpression('{ "name" input.name }', { allowTemplates: true }).valueKind, 'template');
  const parsed = parseRmtxSource(`import {RMT,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="scope"><RMT.State id="app" type="object" initial={{}}/>
<RMT.Action id="save"><RMT.Input name="name" type="string"/><RMT.Reduce state="app" value={{name:input.name}}/></RMT.Action></RMT.Program>`, { syntaxVersion: '4.0.0' });
  assert.equal(parsed.ok, true, JSON.stringify(parsed.diagnostics));
  for (const version of ['1.0.0', '2.0.0', '3.0.0']) {
    const result = compileRmtVNextAstResult(parsed.ast, { sourceProfile: { syntax: 'rmtx', version }, allowTemplates: true, allowActionTemplates: true });
    assert.equal(result.ok, false, version); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null);
  }
  assert.equal(compileRmtVNextAstResult(parsed.ast, { sourceProfile: profile }).ok, true);
});

test('runEffect is a trusted host effect port and cannot start or bypass an Action', async () => {
  const [api] = await modules; let effects = 0;
  const runtime = api.createRmtActionEffectRuntime({ actions: [{ ...actions[0], effects: ['go'] }, actions[1]], inputContract: contract(actions), planningOnly: false,
    modelCommandPort: { apply() { throw Error('unexpected Model write'); } }, effects: [{ id: 'go', kind: 'navigation', path: '/next' }],
    navigationAdapter: { navigate() { effects++; } } });
  await runtime.runEffect('go', { payload: { name: 123 } });
  assert.equal(effects, 1); assert.equal(runtime.getActionStatus('save'), 'idle'); assert.deepEqual(runtime.listHistory(), []);
  assert.equal((await runtime.runAction('save', { ...payload, name: 123 })).status, 'error');
  assert.equal(effects, 1); assert.equal(runtime.getActionStatus('save'), 'idle');
});

test('Source4 dollar paths execute through the real Model and publication port while legacy references remain closed', async () => {
  const [api] = await modules;
  const compiled = require('../../tools/rmt-language/rmtx-compiler').compileRmtxSource(`import {RMT,input,model,result} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="dollars"><RMT.State id="$value" type="string" initial={'initial'}/>
<RMT.Action id="save"><RMT.Input name="$next" type="string"/>
<RMT.Reduce state="$value" value={input.$next}/>
<RMT.Emit event="saved" payload={{value:model.$value}}/>
<RMT.ResultHandler phase="success" kind="reduce" state="$value" value={result.$next}/>
<RMT.ResultHandler phase="success" kind="emit" event="handled" payload={{value:result.$next}}/>
</RMT.Action></RMT.Program>`, { syntaxVersion: '4.0.0' });
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  const { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const state = createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state), emitted = [];
  const artifact = compiled.orchestrationArtifacts.actions;
  const runtime = api.createRmtActionEffectRuntime({ ...artifact, stateRuntime: state, modelCommandPort: state.modelCommandPort,
    effectAdapter: { invoke(effect) { emitted.push(effect); } } });
  const outcome = await runtime.runAction('save', { $next: 'selected' });
  assert.equal(outcome.status, 'success', JSON.stringify(outcome)); assert.equal(state.modelReader.getState('$value'), 'selected');
  assert.deepEqual(emitted.map(effect => [effect.event, effect.payload]), [['saved', { value: 'selected' }], ['handled', { value: 'selected' }]]);
  const { inputContract: ignored, ...legacyArtifact } = artifact;
  const legacy = api.createRmtActionEffectRuntime({ ...legacyArtifact, stateRuntime: state, modelCommandPort: state.modelCommandPort });
  const rejected = await legacy.runAction('save', { $next: 'legacy' });
  assert.equal(rejected.schema, 'xtend.epic18.rmt-action-result.v1'); assert.equal(rejected.status, 'error');
  assert.equal(state.modelReader.getState('$value'), 'selected');
});
