'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRmtxSource } = require('../../tools/rmt-language/rmtx-parser');
const { compileRmtxSource, createRmtxCompiler } = require('../../tools/rmt-language/rmtx-compiler');
const { compileRmtClassicAstResult } = require('../../tools/rmt-language/classic-compiler');
const { validateRmtClassicAst } = require('../../tools/rmt-language/classic-ast-contract');
const { getRmtxOperatorProfile } = require('../../tools/rmt-language/rmtx-operator-profiles');
const { lowerRmtxNativeLifecycle, validateRmtxNativeLifecycleContract } = require('../../tools/rmt-language/rmtx-native-lifecycle');
const options = { syntaxVersion: '6.0.0' };
const source = body => `import {RMT,model,selectors,item,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="lifecycle">
<RMT.State id="ui" type="object" initial={{ready:false,title:'Waiting'}}/>
<RMT.State id="ui.detail" type="object" initial={{ready:true}}/>
<RMT.State id="rows" type="collection" initial={[{id:1,ready:true}]}/>
<RMT.Selector id="shown" from={model.rows}><RMT.Where test={item.ready===true}/></RMT.Selector>
<RMT.Selector id="selected" from={selectors.shown}><RMT.Find test={item.id===1}/></RMT.Selector>
<RMT.Action id="show"><RMT.Reduce state="ui" path="ready" value={true}/></RMT.Action>
${body}</RMT.Program>`;
const owner = (when = 'model.ui.ready', extra = '', id = 'owner') => `<RMT.Surface id="${id}"><RMT.Lane name="visible"><RMT.Mount target="${id}" when={${when}} ${extra}/></RMT.Lane><RMT.View><RMT.Text value={model.ui.title}/></RMT.View></RMT.Surface>`;
const compile = text => compileRmtxSource({ text, filePath: 'lifecycle.rmtx' }, options);
const accept = result => { assert.equal(result.ok, true, JSON.stringify(result.diagnostics)); return result; };
const reject = text => { const result = compile(text); assert.equal(result.ok, false); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null); assert.equal(result.lifecycleDependencies, null); return result; };
const backendOptions = parsed => ({ sourceProfile: parsed.sourceProfile, viewProfile: parsed.viewProfile, actionProfile: parsed.actionProfile,
  rmtxNativeView: parsed.nativeView, rmtxActionInputRules: parsed.actionInputRules, rmtxNativeLifecycle: parsed.nativeLifecycle });

test('Source6 composes explicit Action4/View5 and lowers a guard through the exact unchanged Classic AST mapping', () => {
  const result = accept(compile(source(owner()))), parsed = result.parserResult, program = result.orchestrationArtifacts;
  assert.equal(result.schema, 'xtend.rmtx.compile-result.v6'); assert.equal(parsed.schema, 'xtend.rmtx.parser-result.v6');
  assert.equal(result.apiVersion, '6.0.0'); assert.equal(program.schema, 'xtend.rmt.app-orchestration.v4');
  assert.equal(parsed.sourceProfile.version, '6.0.0'); assert.equal(parsed.viewProfile.version, '5.0.0'); assert.equal(parsed.actionProfile.version, '4.0.0');
  for (const contract of [parsed.nativeView, parsed.components, parsed.hostScopes]) assert.equal(contract.sourceProfile.version, '5.0.0');
  assert.equal(parsed.actionInputRules.sourceProfile.version, '4.0.0');
  assert.deepEqual(validateRmtClassicAst(parsed.ast), []);
  const operation = program.lifecycle.operations[0], mapping = result.coreDocument.sourceMap.find(value => value.astPointer === operation.astPointer && value.nodeType === 'RmtLifecycleStatement');
  assert.equal(mapping.id, `src:${operation.id}`); assert.equal(operation.id, 'operation:lifecycle/owner/visible/0');
  assert.equal(Object.hasOwn(operation, 'range'), false); assert.equal(operation.target, operation.ownerSurface);
  assert.deepEqual(operation.when, { kind: 'path', root: 'state', symbol: 'ui', path: ['ready'] });
  assert.equal(result.coreDocument.operations[0].condition, undefined);
  assert.equal(result.selectorDependencies.schema, 'xtend.rmtx.selector-dependencies.v5');
  assert.equal(result.lifecycleDependencies.schema, 'xtend.rmtx.lifecycle-dependencies.v1');
  assert.equal(createRmtxCompiler(options).compileSource(source(owner())).sourceProfile.version, '6.0.0');
  assert.equal(createRmtxCompiler().sourceProfile.version, '1.0.0');
});

test('Lifecycle reads retain every branch, longest declared Model prefix and transitive Selector State reads', () => {
  const result = accept(compile(source(owner('model.ui.detail.ready ? selectors.selected.ready : model.ui.ready'))));
  assert.equal(result.orchestrationArtifacts.lifecycle.operations[0].when.test.symbol, 'ui.detail');
  const dependency = result.lifecycleDependencies.operations[0];
  assert.deepEqual(dependency.reads, [
    { root: 'selector', symbol: 'selected', path: ['ready'] },
    { root: 'state', symbol: 'ui', path: ['ready'] },
    { root: 'state', symbol: 'ui.detail', path: ['ready'] }
  ]);
  assert.deepEqual(dependency.transitiveStateReads, [
    { root: 'state', symbol: 'rows', path: [] },
    { root: 'state', symbol: 'ui', path: ['ready'] },
    { root: 'state', symbol: 'ui.detail', path: ['ready'] }
  ]);
  assert.equal(dependency.allSyntacticBranches, true);
});

test('Static independent owners have distinct operation identities; unguarded Source6 has an explicit empty lifecycle plan', () => {
  const result = accept(compile(source(owner('true', '', 'first') + owner('false', '', 'second'))));
  assert.equal(new Set(result.orchestrationArtifacts.lifecycle.operations.map(value => value.id)).size, 2);
  assert.deepEqual(accept(compile(source('<RMT.Surface id="owner"><RMT.View/></RMT.Surface>'))).orchestrationArtifacts.lifecycle.operations, []);
});

for (const [name, expression] of [
  ['nonboolean literal', '1'], ['string literal', '"yes"'], ['array', '[true]'], ['object', '({ready:true})'],
  ['computed path', 'model.ui["ready"]'], ['optional path', 'model.ui?.ready'], ['method call', 'model.rows.some(item=>item.ready)'],
  ['unknown model', 'model.unknown.ready'], ['unknown selector', 'selectors.unknown.ready'], ['item scope', 'item.ready'], ['Action input', 'input.ready'],
  ['negative zero', '-0'], ['loose equality', 'model.ui.ready==true']
]) test('Source6 rejects unsupported guard: ' + name, () => { reject(source(owner(expression))); });

for (const [name, body] of [
  ['different target', owner().replace('target="owner"', 'target="other"')],
  ['missing native View', owner().replace('<RMT.View><RMT.Text value={model.ui.title}/></RMT.View>', '')],
  ['multiple guarded Mounts', owner().replace('</RMT.Lane>', '<RMT.Mount target="owner" when={true}/></RMT.Lane>')],
  ['idle lane', owner().replace('name="visible"', 'name="idle"')],
  ['user-blocking lane', owner().replace('name="visible"', 'name="user-blocking"')],
  ['Source child', owner().replace('when={model.ui.ready} />', 'when={model.ui.ready}><RMT.Source kind="state" target="ui"/></RMT.Mount>')],
  ['Policy child', owner().replace('when={model.ui.ready} />', 'when={model.ui.ready}><RMT.Policy/></RMT.Mount>')],
  ['conditional host', owner().replace('id="owner"', 'id="owner" present={model.ui.ready}')],
  ['repeated host', `<RMT.Repeat from={model.rows} keyBy={item.id}>${owner()}</RMT.Repeat>`],
  ['other lifecycle operation', owner().replace('RMT.Mount ', 'RMT.Suspend ')],
  ['nested Policy slot', `<RMT.Surface id="owner"><RMT.Lane name="visible"><RMT.Mount target="owner"><RMT.Policy><RMT.Slot name="nested"><RMT.Mount target="owner" when={true}/></RMT.Slot></RMT.Policy></RMT.Mount></RMT.Lane><RMT.View/></RMT.Surface>`]
]) test('Source6 rejects unsupported lifecycle placement: ' + name, () => { reject(source(body)); });

test('Source1–5 reject guarded Mount while their operator profiles and View-only When keep their own meaning', () => {
  for (const syntaxVersion of ['1.0.0', '2.0.0', '3.0.0', '4.0.0', '5.0.0']) {
    assert.equal(getRmtxOperatorProfile(syntaxVersion).operators.Mount.attributes.when, undefined);
    assert.equal(parseRmtxSource(source(owner()), { syntaxVersion }).ok, false);
  }
  const text = source('<RMT.Surface id="owner"><RMT.View><RMT.When test={model.ui.ready}><RMT.Text value="shown"/></RMT.When></RMT.View></RMT.Surface>');
  const native = accept(compileRmtxSource({ text, filePath: 'lifecycle.rmtx' }, { syntaxVersion: '5.0.0' }));
  assert.equal(native.orchestrationArtifacts.schema, 'xtend.rmt.app-orchestration.v3');
  assert.equal(native.orchestrationArtifacts.lifecycle, undefined);
});

test('Backend rejects forged AST joins and altered operation semantics without a partial program', () => {
  const good = accept(compile(source(owner())));
  for (const mutate of [
    contract => { contract.operations[0].astPointer = '/body/0/body/0'; },
    contract => { contract.operations[0].target = 'other'; },
    contract => { contract.operations[0].lane = 'idle'; },
    contract => { contract.operations[0].when.symbol = 'missing'; },
    contract => { contract.operations.push(structuredClone(contract.operations[0])); }
  ]) {
    const parsed = good.parserResult, contract = structuredClone(parsed.nativeLifecycle); mutate(contract);
    const result = compileRmtClassicAstResult(parsed.ast, { ...backendOptions(parsed), rmtxNativeLifecycle: contract });
    assert.equal(result.ok, false); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null);
  }
  const core = structuredClone(good.coreDocument);
  core.sourceMap.push(structuredClone(core.sourceMap.find(value => value.astPointer === good.parserResult.nativeLifecycle.operations[0].astPointer)));
  assert.throws(() => lowerRmtxNativeLifecycle(good.parserResult.nativeLifecycle, core, good.orchestrationArtifacts.render.nativeView), /exact Classic AST-to-Core/);
  const ast = structuredClone(good.parserResult.ast), path = good.parserResult.nativeLifecycle.operations[0].astPointer.slice(1).split('/');
  const statement = path.reduce((node, key) => node[key], ast);
  statement.policy = { type: 'RmtPolicyBlock', body: [] };
  const rejected = compileRmtClassicAstResult(ast, backendOptions(good.parserResult));
  assert.equal(rejected.ok, false); assert.equal(rejected.phase, 'native-lifecycle');
});

test('Raw source contract accessors are rejected before they can execute and backend requires explicit subprofiles', () => {
  const parsed = parseRmtxSource(source(owner()), options), contract = structuredClone(parsed.nativeLifecycle);
  let calls = 0;
  Object.defineProperty(contract.operations[0], 'when', { enumerable: true, get() { calls++; return { kind: 'literal', value: true }; } });
  assert.throws(() => validateRmtxNativeLifecycleContract(contract)); assert.equal(calls, 0);
  const missing = backendOptions(parsed); delete missing.viewProfile;
  assert.throws(() => compileRmtClassicAstResult(parsed.ast, missing));
});
