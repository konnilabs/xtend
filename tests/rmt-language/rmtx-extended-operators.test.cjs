'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { parseRmtxSource } = require('../../tools/rmt-language/rmtx-parser');
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const { validateRmtClassicAst } = require('../../tools/rmt-language/classic-ast-contract');
const { getRmtxOperatorProfile } = require('../../tools/rmt-language/rmtx-operator-profiles');
const { RMTX_EXTENDED_OPERATOR_RULES: rules, RMTX_CLASSIC_AST_COVERAGE: coverage } = require('../../tools/rmt-language/rmtx-operator-coverage');
const options = { syntaxVersion: '4.0.0' };
const header = "import {RMT,model,input,selectors,item,params,contains,result,error,payload} from '@ccslabs/xtend/rmt-language/rmtx';";
const source = body => ({ text: `${header}export default <RMT.Program id="app">${body}</RMT.Program>;`, filePath: 'extended.rmtx' });
const parse = body => parseRmtxSource(source(body), options);
const compile = body => compileRmtxSource(source(body), options);
const visit = (node, type) => {
  if (!node || typeof node !== 'object') return false;
  return node.type === type || Object.values(node).some(value => Array.isArray(value) ? value.some(item => visit(item, type)) : visit(value, type));
};

function attributes(tag, overrides = {}) {
  const contract = getRmtxOperatorProfile('4.0.0').operators[tag];
  const defaults = {};
  for (const [name, attr] of Object.entries(contract.attributes)) {
    if (!attr.required) continue;
    defaults[name] = attr.values ? JSON.stringify(attr.values[0]) : ['json-literal', 'number'].includes(attr.kind) ? '{0}'
      : attr.kind === 'boolean' ? '{true}' : attr.kind === 'policy-values' ? '{["close","topmost"]}'
      : attr.kind === 'primitive-expression' ? '{"value"}' : JSON.stringify('sample');
  }
  if (tag === 'ResultHandler') Object.assign(defaults, { state: '"value"', value: '{1}' });
  if (['Hydration', 'Resumability', 'Isolation'].includes(tag)) defaults.mode = '"resume"';
  return Object.entries({ ...defaults, ...overrides }).map(([key, value]) => `${key}=${value}`).join(' ');
}
function tag(name, children = '', overrides) { return `<RMT.${name} ${attributes(name, overrides)}>${children}</RMT.${name}>`; }
function routeTo(target) {
  const operators = getRmtxOperatorProfile('4.0.0').operators;
  const queue = [['Program']], seen = new Set(['Program']);
  while (queue.length) {
    const route = queue.shift(), current = route.at(-1);
    if (current === target) return route;
    for (const child of operators[current].children) if (!seen.has(child)) { seen.add(child); queue.push([...route, child]); }
  }
  throw new Error(`Unreachable operator ${target}.`);
}
function minimal(tagName) {
  let body = ['AnimationTimeline', 'TransitionTimeline'].includes(tagName) ? tag(tagName + 'Step') : '';
  if (tagName === 'Stream') body = tag('Source');
  for (const name of routeTo(tagName).slice(1).reverse()) body = tag(name, body);
  return body;
}

test('all 122 Classic nodes have exactly one explicit source, helper or native UI classification', () => {
  const definitions = require('../../tools/rmt-language/contracts/classic-ast.v1.schema.json').definitions;
  assert.deepEqual(coverage.nodes.map(node => node.type).sort(), Object.keys(definitions).filter(key => key.startsWith('Rmt')).sort());
  assert.equal(new Set(coverage.nodes.map(node => node.type)).size, 122);
  assert.deepEqual(coverage.counts, { 'helper-or-attribute': 21, 'source-operator': 99, 'deferred-native-ui': 2 });
  assert.equal(coverage.operatorTags, Object.keys(getRmtxOperatorProfile('4.0.0').operators).length);
  assert.deepEqual(coverage.nodes.filter(node => node.classification === 'deferred-native-ui').map(node => node.type).sort(), ['RmtSurfaceKeyClause', 'RmtSurfaceRepeatClause']);
  for (const node of coverage.nodes.filter(node => node.classification === 'source-operator')) {
    assert(node.operators.length);
    for (const name of node.operators) assert.equal(getRmtxOperatorProfile('4.0.0').operators[name].astType, node.type);
  }
});

test('source4 additions preserve complete byte-equivalent catalog data for profiles 1, 2 and 3', () => {
  const expected = {
    '1.0.0': 'd40079c970f88ee4c66e547f81d1d35052643a86c3d79712b79d4e8cc4aff4ec',
    '2.0.0': '27f9d25ba4e730b0db9812a451af631d14bb1fa11cd16abd9ef35d19002f55c1',
    '3.0.0': '5185b4cee48e10a0300b0dbb693a6b6ee5ec135f9ad09b0aa8f51f8c74afb434'
  };
  for (const [version, hash] of Object.entries(expected)) assert.equal(createHash('sha256').update(JSON.stringify(getRmtxOperatorProfile(version))).digest('hex'), hash);
  assert.equal(getRmtxOperatorProfile().syntaxVersion, '1.0.0');
  assert.equal(getRmtxOperatorProfile('4.0.0').schema, 'xtend.rmtx.operator-profile.v3');
  assert.equal(getRmtxOperatorProfile('4.0.0').apiVersion, '3.0.0');
  assert.equal(getRmtxOperatorProfile('4.0.0').semantics.components.providerInterface, 'xtend.xtensions.component-interface.v2');
  assert.deepEqual(getRmtxOperatorProfile('4.0.0').semantics.components.acceptedProviderInterfaces,
    ['xtend.xtensions.component-interface.v1', 'xtend.xtensions.component-interface.v2']);
  assert.equal(getRmtxOperatorProfile('4.0.0').semantics.events.inputNames, 'all-required-and-only-declared-action-inputs');
});

test('every extended tag closes its attributes and requires an explicit source4 opt-in', () => {
  for (const name of Object.keys(rules)) {
    const unexpected = minimal(name).replace(`<RMT.${name} `, `<RMT.${name} unexpected="forged" `);
    const rejected = parse(unexpected);
    assert.equal(rejected.ok, false, name);
    assert.equal(rejected.diagnostics[0].code, 'rmtx.attribute.unknown', name);
    for (const version of ['1.0.0', '2.0.0', '3.0.0']) {
      if (Object.hasOwn(getRmtxOperatorProfile(version).operators, name)) continue;
      const input = source(minimal(name));
      input.text = input.text.replace(',result,error,payload', '');
      assert.equal(parseRmtxSource(input, { syntaxVersion: version }).ok, false, `${version}:${name}`);
    }
  }
});

for (const [name, rule] of Object.entries(rules)) test(`closed ${name} attributes lower to formal ${rule.astType}`, () => {
  const parsed = parse(minimal(name));
  assert(parsed.ok, JSON.stringify(parsed.diagnostics));
  assert.deepEqual(validateRmtClassicAst(parsed.ast), []);
  assert(visit(parsed.ast, rule.astType));
});

test('DataSource, Effects, Emit and result handlers reach actual backend artifacts', () => {
  const result = compile(`<RMT.State id="value" type="string" initial="before"/>
    <RMT.DataSource id="records" sourceKind="endpoint" source="/api/items" mode="invoke" method="GET" result="data"/>
    <RMT.Action id="load"><RMT.Input name="next" type="string"/><RMT.Status path="state.value"/>
      <RMT.Effect kind="fetch" sourceKind="datasource" source="records"/>
      <RMT.Emit event="done" payload={{name:input.next}}/>
      <RMT.ResultHandler phase="success" kind="reduce" state="value" value={result.id}/>
      <RMT.ResultHandler phase="error" kind="emit" event="failed" payload={{message:error.message}}/>
    </RMT.Action>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.deepEqual(validateRmtClassicAst(result.parserResult.ast), []);
  assert.equal(result.coreDocument.dataSources[0].target, '/api/items');
  assert.equal(result.coreDocument.effects[0].kind, 'fetch');
  const action = result.orchestrationArtifacts.actions.actions.find(action => action.id === 'load');
  assert.equal(action.emits[0].payload[0].valueKind, 'reference');
  assert.equal(action.handlers[0].kind, 'reduce');
  assert.equal(action.handlers[1].kind, 'emit');
});

test('Validation, Animation and Transition compile structured configuration and generated timeline tokens', () => {
  const result = compile(`<RMT.State id="email" type="string" initial=""/>
    <RMT.Action id="submit"/><RMT.Surface id="first" component="div"/><RMT.Surface id="second" component="div"/>
    <RMT.Validation id="form"><RMT.ValidationMode mode="blocking"/><RMT.ValidationTarget kind="action" target="submit"/>
      <RMT.ValidationField field="email"><RMT.ValidationRule kind="required"/><RMT.ValidationRule kind="email"/>
        <RMT.ValidationRule kind="minLength" value={3}/><RMT.ValidationRule kind="message" value="Enter email"/>
      </RMT.ValidationField></RMT.Validation>
    <RMT.Animation id="motion"><RMT.AnimationEffect effect="fade"/><RMT.AnimationDuration value={120}/><RMT.AnimationEasing value="ease"/>
      <RMT.AnimationSpring stiffness={170} damping={26}/><RMT.AnimationKeyframe phase="enter" opacity={0} offset={0}/>
      <RMT.AnimationTimeline><RMT.AnimationTimelineStep kind="enter" durationMs={120}/></RMT.AnimationTimeline>
    </RMT.Animation>
    <RMT.Transition id="next"><RMT.TransitionTrigger kind="action" target="submit"/><RMT.TransitionFrom value="first"/>
      <RMT.TransitionTo value={["second"]}/><RMT.TransitionUseAnimation ref="motion"/><RMT.TransitionDuration value={120}/>
      <RMT.TransitionTimeline><RMT.TransitionTimelineStep kind="stagger" eachMs={20} phase="enter"/></RMT.TransitionTimeline>
    </RMT.Transition>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.equal(result.coreDocument.validations[0].fields[0].rules[0].kind, 'required');
  assert.equal(result.coreDocument.animations[0].durationMs, 120);
  assert.equal(result.coreDocument.animations[0].timeline.steps[0].durationMs, 120);
  assert.equal(result.coreDocument.transitions[0].timeline.steps[0].eachMs, 20);
});

test('Portal, Overlay, Resource and Surface contracts generate data without admitting source text', () => {
  const result = compile(`<RMT.Portal id="root" root="#root" layer="surface" z={1}><RMT.PortalPolicy name="focus" values={["retain"]}/></RMT.Portal>
    <RMT.Overlay id="notice" kind="toast" portal="root"><RMT.OverlayPolicy name="escape" values={["close","topmost"]}/></RMT.Overlay>
    <RMT.Resource id="socket" kind="subscription" owner="surface.panel"><RMT.ResourceSource kind="endpoint" ref="/stream"/>
      <RMT.ResourceDispose on="surface.destroy"/></RMT.Resource>
    <RMT.Surface id="panel" component="div" portal="root"><RMT.SurfaceBounds mode="responsive" scope="viewport" width="100vw" height="100vh"/>
      <RMT.SurfacePreserve value="state"/><RMT.SurfaceDestroy resource="socket"/>
      <RMT.Lane name="visible" weight={1}><RMT.Mount target="view"><RMT.Policy><RMT.TrustBoundary boundary="local"/>
        <RMT.Hydration mode="eager"/><RMT.Isolation mode="shared"/></RMT.Policy></RMT.Mount></RMT.Lane>
    </RMT.Surface>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.equal(result.coreDocument.overlays[0].policies[0], 'escape close topmost');
  assert.equal(result.coreDocument.resources[0].dispose.text, 'on surface.destroy');
  const surface = result.coreDocument.surfaces.find(surface => surface.name === 'panel');
  assert.equal(surface.bounds.width, '100vw');
  assert.equal(surface.resourceRefs[0].target, 'socket');
});

test('SearchSource closes references, numeric settings and field weights through the existing backend', () => {
  const result = compile(`<RMT.State id="query" type="string" initial=""/>
    <RMT.Surface id="panel" component="div"/>
    <RMT.Resource id="index" kind="search-index" owner="surface.panel"><RMT.ResourceImport value="local-index"/></RMT.Resource>
    <RMT.SearchSource id="search"><RMT.SearchQuery kind="state" ref="query"/><RMT.SearchResource kind="resource" ref="index"/>
      <RMT.SearchWeight field="title" value={4}/><RMT.SearchValue name="minQueryLength" value={1}/>
      <RMT.SearchValue name="debounceMs" value={20}/><RMT.SearchValue name="a11y" value={{label:"Search"}}/>
    </RMT.SearchSource>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.equal(result.coreDocument.searchSources[0].queryState, 'query');
  assert.equal(result.coreDocument.searchSources[0].resource, 'index');
  assert.equal(result.coreDocument.searchSources[0].fieldWeights.title, 4);
  assert.equal(result.coreDocument.searchSources[0].a11y.label, 'Search');
});

test('remote declarations hoist into the document and retain real cross-surface target contracts', () => {
  const result = compile(`<RMT.Surface id="root"><RMT.Lane name="critical" weight={10}>
      <RMT.Hydrate target="shell.root"><RMT.Source kind="endpoint" target="shell.root"/></RMT.Hydrate>
    </RMT.Lane></RMT.Surface>
    <RMT.RemoteSurface id="checkout.cart" remoteId="@xtend/checkout-cart">
      <RMT.RemoteOwner id="checkout-platform"/><RMT.RemoteVersion value="^2.4.0"/><RMT.RemoteOrigin value="https://cdn.xtend.example"/>
      <RMT.RemoteIntegrity algorithm="sha256" digest="sha256-remotecompilercheckoutcart000000000000000000000001"/>
      <RMT.RemoteTrustBoundary boundary="xtend.security.remote-surface.v1"/><RMT.RemoteFallback ref="checkout.cart.fallback"/>
      <RMT.RemoteExpose surface="checkout.cart" lane="critical" targetKind="shell.slot" target="sidebar.cart"/>
      <RMT.RemoteEvent surface="checkout.cart" kind="emits" event="checkout.cart.updated.v1">
        <RMT.RemoteOwner id="checkout-platform"/><RMT.RemoteEventDirection direction="outbound"/><RMT.RemoteEventLane lane="critical"/>
        <RMT.RemoteEventPayload value="xtend.schemas.cartUpdated.v1"/>
      </RMT.RemoteEvent>
      <RMT.RemoteEvent surface="checkout.cart" kind="consumes" event="user.session.changed.v1">
        <RMT.RemoteOwner id="identity-platform"/><RMT.RemoteEventDirection direction="inbound"/>
        <RMT.RemoteEventFrom kind="shell.session" ref="current"/><RMT.RemoteEventLane lane="critical"/>
        <RMT.RemoteEventPayload value="xtend.schemas.sessionChanged.v1"/>
      </RMT.RemoteEvent>
    </RMT.RemoteSurface>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  assert.deepEqual(validateRmtClassicAst(result.parserResult.ast), []);
  const remote = result.parserResult.ast.body.find(node => node.type === 'RmtRemoteSurfaceDeclaration');
  assert(remote);
  assert.equal(remote.body.find(node => node.type === 'RmtRemoteExposeClause').target.ref, 'shell.slot:sidebar.cart');
  assert.equal(remote.body.find(node => node.type === 'RmtRemoteEventClause' && node.kind === 'consumes').body.find(node => node.type === 'RmtRemoteEventFromClause').source.ref, 'shell.session:current');
  assert(result.coreDocument.remoteSurfaces.length);
});

test('generated Recipe and result-handler text preserves nested reference trees and escaped literals', () => {
  const result = compile(`<RMT.State id="value" type="object" initial={{}}/><RMT.Overlay id="notice"/>
    <RMT.Action id="save"><RMT.Input name="name" type="string"/>
      <RMT.Recipe recipe="set" state="value" value={{name:input.name,nested:[1,"1",{message:"line\\nbreak; harmless"}]}}/>
      <RMT.ResultHandler phase="success" kind="reduce" state="value" value={{name:result.name,list:[1,"1"]}}/>
      <RMT.ResultHandler phase="success" kind="emit" event="done" payload={{record:{name:result.name,list:[1,"1"]}}}/>
      <RMT.ResultHandler phase="error" kind="overlay" target="notice" message={error.message} tone="error"/>
    </RMT.Action>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  const action = result.orchestrationArtifacts.actions.actions.find(action => action.id === 'save');
  assert.equal(action.reducers[0].valueKind, 'template');
  assert.equal(action.handlers[0].reducer.valueKind, 'template');
  assert.equal(action.handlers[1].emit.payload[0].valueKind, 'template');
  assert.equal(action.handlers[2].options.message.valueKind, 'reference');
});

test('multi-attribute policy syntax lowers one formal clause per policy value including false', () => {
  const parsed = parse('<RMT.Surface id="panel"><RMT.Lane name="visible"><RMT.Mount target="widget"><RMT.Policy><RMT.Hydration mode="eager" insularHydration={false}/><RMT.Resumability mode="snapshot" snapshot="deep" eventReplay="on" integrity="sha256"/><RMT.Isolation boundary="local" mode="shared"/></RMT.Policy></RMT.Mount></RMT.Lane></RMT.Surface>');
  assert(parsed.ok, JSON.stringify(parsed.diagnostics));
  assert.deepEqual(validateRmtClassicAst(parsed.ast), []);
  const policy = parsed.ast.body[0].body[0].body[0].body[0].policy;
  assert.equal(policy.body.length, 8);
  assert.equal(policy.body.filter(node => node.type === 'RmtHydrationPolicy').find(node => node.insularHydration !== null).insularHydration, false);
});

test('source4 safe dollar symbols survive generated nested values, recipes and result operations', () => {
  const result = compile(`<RMT.State id="$value" type="object" initial={{}}/><RMT.State id="$number" type="number" initial={1}/>
    <RMT.Overlay id="$notice"/><RMT.Action id="$save"><RMT.Input name="$next" type="number"/>
      <RMT.Reduce state="$number" value={input.$next}/>
      <RMT.Recipe recipe="set" state="$value" value={{number:input.$next,previous:model.$number}}/>
      <RMT.Emit event="$direct" payload={{$field:input.$next}}/>
      <RMT.ResultHandler phase="success" kind="reduce" state="$value" value={{number:result.$next}}/>
      <RMT.ResultHandler phase="success" kind="emit" event="$done" payload={{$field:result.$next}}/>
      <RMT.ResultHandler phase="error" kind="overlay" target="$notice" message={error.$message}/>
    </RMT.Action>`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  const action = result.orchestrationArtifacts.actions.actions.find(action => action.id === '$save');
  assert.equal(action.reducers[0].value, 'input.$next');
  assert.equal(action.reducers[1].value.fields[0].value.value, 'input.$next');
  assert.equal(action.emits[0].event, '$direct');
  assert.equal(action.emits[0].payload[0].name, '$field');
  assert.equal(action.handlers[1].emit.event, '$done');
  assert.equal(action.handlers[1].emit.payload[0].name, '$field');
  assert.equal(action.handlers[1].emit.payload[0].value, 'result.$next');
  assert.equal(action.handlers[2].target, '$notice');
  assert.equal(action.handlers[2].options.message.value, 'error.$message');
});

test('closed attributes reject AST, DSL text, wrong primitive kinds, duplicate clauses and lifecycle when', () => {
  const cases = [
    '<RMT.Resource id="r"><RMT.ResourceDispose text="on surface.destroy"/></RMT.Resource>',
    '<RMT.Animation id="a"><RMT.AnimationTimeline text="enter durationMs 5"/></RMT.Animation>',
    '<RMT.Action id="a"><RMT.Effect kind="fetch" ast={{type:"RmtEffectStatement"}}/></RMT.Action>',
    '<RMT.Action id="a"><RMT.ResultHandler phase="success" kind="reduce" state="value" value={evil()}/></RMT.Action>',
    '<RMT.Action id="a"><RMT.ResultHandler phase="success" kind="reduce" state="value" value={0} event="forged"/></RMT.Action>',
    '<RMT.Animation id="a"><RMT.AnimationDuration value="120"/></RMT.Animation>',
    '<RMT.DataSource id="d" mode="fetch"><RMT.DataSourceMode value="stream"/></RMT.DataSource>',
    '<RMT.Validation id="v"><RMT.ValidationField field="value"><RMT.ValidationRule kind="minLength" value={-1}/></RMT.ValidationField></RMT.Validation>',
    '<RMT.Surface id="panel"><RMT.Lane name="visible"><RMT.Mount target="x" when={true}/></RMT.Lane></RMT.Surface>',
    '<RMT.Surface id="panel"><RMT.Lane name="visible"><RMT.Stream target="x"/></RMT.Lane></RMT.Surface>',
    '<RMT.Surface id="panel"><RMT.Lane name="visible"><RMT.Mount target="x"><RMT.Policy><RMT.Hydration mode="eager"/><RMT.Hydration mode="idle"/></RMT.Policy></RMT.Mount></RMT.Lane></RMT.Surface>',
    '<RMT.Action id="a"><RMT.ResultHandler phase="success" kind="emit" event="done" payload={{"x; reduce state.value = 0":1}}/></RMT.Action>'
  ];
  for (const body of cases) {
    const result = compile(body); assert.equal(result.ok, false, body);
    assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null);
    assert(result.diagnostics.every(diagnostic => diagnostic.source === 'rmtx'));
  }
});

test('source4 contracts, all authoring names and declarations are immutable data and closed types', () => {
  const profile = getRmtxOperatorProfile('4.0.0'), authoring = require('../../tools/rmt-language/rmtx');
  assert.equal(authoring.RMTX_AUTHORING_API_VERSION, '4.0.0');
  assert.deepEqual(Object.keys(authoring.RMT), Object.keys(profile.operators));
  assert(Object.isFrozen(profile)); assert(Object.isFrozen(rules)); assert(Object.isFrozen(coverage));
  for (const fn of Object.values(authoring.RMT)) assert.throws(() => fn({}), /must be compiled/);
  const ts = require('typescript'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'rmtx-source4-types-'));
  try {
    const file = path.join(temporary, 'consumer.cts'), modulePath = path.resolve(__dirname, '../../tools/rmt-language/rmtx').replaceAll('\\', '/');
    fs.writeFileSync(file, `import {RMT,type RmtxAuthoringNamespaceV3,type RmtxAuthoringNamespaceV2} from '${modulePath}';
const legacy3 = {} as RmtxAuthoringNamespaceV3; const legacy2 = {} as RmtxAuthoringNamespaceV2;
legacy3.On({event:'click',action:'save',payload:{id:'detail.id'}});
// @ts-expect-error source4 tags must not widen the named v3 interface
legacy3.Effect({kind:'fetch'});
// @ts-expect-error source3 tags must not widen the named v2 interface
legacy2.Repeat({from:0,keyBy:0});
RMT.Effect({kind:'fetch',sourceKind:'datasource',source:'records'});
RMT.Input({name:'value',type:'string',optional:true,nullable:true,default:'value'});
RMT.XTension({id:'widget',provider:'gallery',owner:'panel',lane:'visible',props:{value:'literal'},intents:{}});
// @ts-expect-error no raw AST input
RMT.Effect({kind:'fetch',ast:{type:'RmtEffectStatement'}});
// @ts-expect-error timeline text is generated from structured attributes
RMT.AnimationTimeline({text:'enter durationMs 120'});
// @ts-expect-error lifecycle conditions remain outside source4
RMT.Mount({target:'view',when:true});
// @ts-expect-error closed action phases
RMT.ResultHandler({phase:'always',kind:'reduce'});
`);
    const program = ts.createProgram([file], { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.Node16, moduleResolution: ts.ModuleResolutionKind.Node16 });
    assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), []);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
