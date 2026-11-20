'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseRmtxSource, RMTX_PARSER_API_VERSION } = require('../../tools/rmt-language/rmtx-parser');
const { compileRmtxSource, createRmtxCompiler, RMTX_COMPILER_API_VERSION } = require('../../tools/rmt-language/rmtx-compiler');
const { getRmtxOperatorProfile } = require('../../tools/rmt-language/rmtx-operator-profiles');
const { lowerRmtxNativeViews } = require('../../tools/rmt-language/rmtx-native-view');
const options = { syntaxVersion: '5.0.0' };
const source = body => `import {RMT,model,selectors,item} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="native">
  <RMT.State id="meta" type="object" initial={{title:'Product',enabled:true}}/>
  <RMT.State id="rows" type="collection" initial={[{id:1,title:'Number',enabled:true},{id:'1',title:'String',enabled:false}]}/>
  <RMT.State id="groups" type="collection" initial={[{id:'g',rows:[{id:1,title:'Nested'}]}]}/>
  <RMT.Selector id="shown" from={model.rows}><RMT.Where test={item.enabled===true}/></RMT.Selector>
  <RMT.Action id="rename"><RMT.Input name="title" type="string"/><RMT.Reduce state="meta" path="title" value={input.title}/></RMT.Action>
  ${body}
</RMT.Program>`.replace('{RMT,model,selectors,item}', '{RMT,model,selectors,item,input}');
const view = children => `<RMT.Surface id="owner"><RMT.View>${children}</RMT.View></RMT.Surface>`;
const compile = text => compileRmtxSource({ text, filePath: 'native.rmtx' }, options);
const accepted = result => { assert.equal(result.ok, true, JSON.stringify(result.diagnostics)); return result; };
const rejected = result => { assert.equal(result.ok, false); assert.equal(result.coreDocument, null); assert.equal(result.orchestrationArtifacts, null); assert.equal(result.nativeDependencies, null); return result; };

test('source5 is explicit, carries its native contract and names the unchanged Action subprofile', () => {
  assert.equal(RMTX_PARSER_API_VERSION, '8.0.0'); assert.equal(RMTX_COMPILER_API_VERSION, '8.0.0');
  const result = accepted(compile(source(view('<RMT.Text value={model.meta.title}/>'))));
  assert.equal(result.schema, 'xtend.rmtx.compile-result.v5');
  assert.equal(result.parserResult.schema, 'xtend.rmtx.parser-result.v5');
  assert.deepEqual(result.sourceProfile, { syntax: 'rmtx', version: '5.0.0' });
  assert.deepEqual(result.parserResult.actionProfile, { syntax: 'rmtx', version: '4.0.0' });
  assert.equal(result.parserResult.actionInputRules.sourceProfile.version, '4.0.0');
  assert.equal(result.orchestrationArtifacts.schema, 'xtend.rmt.app-orchestration.v3');
  assert.equal(result.orchestrationArtifacts.actions.schema, 'xtend.rmt.action-plan.v2');
  assert.equal(result.orchestrationArtifacts.actions.inputContract.schema, 'xtend.rmt.action-input-contract.v1');
  assert.deepEqual(result.orchestrationArtifacts.render.nativeView, { schema: 'xtend.rmt.native-view.v1', documentId: 'native', surfaces: ['owner'] });
  assert.equal(result.parserResult.ast.schema, 'xtend.rmt.vnext.ast.v1');
  const factory = createRmtxCompiler(options);
  assert.equal(factory.apiVersion, '5.0.0');
  assert.equal(factory.compileSource(source(view('')), { syntaxVersion: undefined }).sourceProfile.version, '5.0.0');
  assert.equal(createRmtxCompiler().sourceProfile.version, '1.0.0');
  assert.equal(parseRmtxSource(source(view(''))).ok, false);
});

test('source5 fixes implicit Surface kind and component without rewriting source4 defaults', () => {
  const result = accepted(compile(source(view('<RMT.Text value="Header"/>'))));
  const surface = result.orchestrationArtifacts.surfaces.find(value => value.id === 'owner');
  assert.equal(surface.kind, 'region'); assert.equal(surface.component, 'div');
  const descriptor = result.orchestrationArtifacts.render.descriptors.find(value => value.surface === 'owner');
  assert.deepEqual(descriptor.parts, ['surface', 'region']);
  const legacy = parseRmtxSource(source('<RMT.Surface id="owner"/>'), { syntaxVersion: '4.0.0' });
  assert.equal(legacy.ok, true); assert.deepEqual(legacy.ast.body[0].body.find(node => node.type === 'RmtSurfaceDeclaration').metadata, []);
});

test('Source5 preserves ordinary zero through State, Action defaults and native scalar serialization', () => {
  const text = source(view('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Text value={0}/></RMT.Repeat>'))
    .replace("{id:1,title:'Number'", "{id:0,title:'Number'")
    .replace('<RMT.Input name="title" type="string"/>', '<RMT.Input name="title" type="number" default={0}/>');
  const result = accepted(compile(text));
  const serialized = JSON.parse(JSON.stringify(result.orchestrationArtifacts));
  assert.deepEqual(serialized.state.states.find(value => value.id === 'rows').initial[0].id, 0);
  assert.deepEqual(serialized.render.descriptors[0].children[0].children[0].value, { op: 'literal', value: 0 });
});

for (const [label, text] of [
  ['initial typed key', source(view('<RMT.Text value="zero"/>')).replace("{id:1,title:'Number'", "{id:-0,title:'Number'")],
  ['Action default', source(view('<RMT.Text value="zero"/>')).replace('<RMT.Input name="title" type="string"/>', '<RMT.Input name="title" type="number" default={-0}/>')],
  ['native text', source(view('<RMT.Text value={-0}/>'))],
  ['parenthesized native text', source(view('<RMT.Text value={-(0)}/>'))],
  ['native attribute', source(view('<RMT.Element tag="p" attributes={{"data-count":-0}}/>'))],
  ['native property', source(view('<RMT.Element tag="input" properties={{value:-0}}/>'))],
  ['nested initial underflow', source(view('<RMT.Text value="zero"/>')).replace("title:'Product'", "title:'Product',nested:[{value:-1e-9999}]")]
]) test('Source5 rejects negative zero in ' + label + ' before JSON erases its sign', () => {
  const result = rejected(compile(text));
  assert.equal(result.diagnostics[0].code, 'rmtx.literal.number');
});

test('literal text and attribute spellings cannot turn into Model lookups or interpolation', () => {
  const text = source(view('<RMT.Element tag="h1" attributes={{id:"heading",title:"$model.meta.title","data-label":"${model.meta.title}"}}><RMT.Text value="$model.meta.title"/><RMT.Text value="${model.meta.title}"/><RMT.Text value="&lt;img src=x onerror=evil()&gt;"/></RMT.Element>'));
  const result = accepted(compile(text));
  const element = result.orchestrationArtifacts.render.descriptors[0].children[0];
  assert.deepEqual(element.attributes.id, { op: 'literal', value: 'heading' });
  assert.deepEqual(element.attributes.title, { op: 'literal', value: '$model.meta.title' });
  assert.deepEqual(element.attributes['data-label'], { op: 'literal', value: '${model.meta.title}' });
  assert.deepEqual(element.children.map(node => node.value), [
    { op: 'literal', value: '$model.meta.title' }, { op: 'literal', value: '${model.meta.title}' }, { op: 'literal', value: '<img src=x onerror=evil()>' }
  ]);
});

test('native property DOM ids use the canonical static Portal target before Surface composition', () => {
  const text = source(`<RMT.Portal id="local" root="#target"/>
    ${view('<RMT.Element tag="div" properties={{id:"target",title:"owner"}}/>')}
    <RMT.Surface id="child" portal="local"><RMT.View><RMT.Text value="nested"/></RMT.View></RMT.Surface>`);
  const result = accepted(compile(text));
  const root = result.orchestrationArtifacts.render.root;
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].surface, 'owner');
  const target = root.children[0].children[0];
  assert.deepEqual(target.attributes.id, { op: 'literal', value: 'target' });
  assert.equal(Object.hasOwn(target.properties, 'id'), false);
  assert.deepEqual(target.properties.title, { op: 'literal', value: 'owner' });
  assert.equal(target.children[0].surface, 'child');
});

test('a null property DOM id is canonicalized without inventing a static target', () => {
  const result = accepted(compile(source(view('<RMT.Element tag="div" properties={{id:null}}/>'))));
  const element = result.orchestrationArtifacts.render.descriptors[0].children[0];
  assert.deepEqual(element.attributes.id, { op: 'literal', value: null });
  assert.equal(Object.hasOwn(element, 'properties'), false);
});

for (const [attributeId, propertyId] of [['"same"', '"same"'], ['"one"', '"two"'], ['null', '"target"'], ['"target"', 'null'], ['null', 'null']])
  test(`native DOM identity rejects two source id sinks (${attributeId}, ${propertyId})`, () => {
    const result = rejected(compile(source(view(`<RMT.Element tag="div" attributes={{id:${attributeId}}} properties={{id:${propertyId}}}/>`))));
    assert.equal(result.diagnostics[0].code, 'rmtx.native.contract');
  });

test('nested native repeats retain the complete typed parent-key scope and structural declarations', () => {
  const result = accepted(compile(source(view(`<RMT.Repeat from={model.groups} keyBy={item.id}>
    <RMT.Element tag="section"><RMT.Text value={item.id}/><RMT.Repeat from={item.rows} keyBy={item.id}>
      <RMT.Element tag="p"><RMT.Text value={item.title}/></RMT.Element>
    </RMT.Repeat></RMT.Element></RMT.Repeat>`))));
  const repeat = result.parserResult.nativeView.views[0].children[0];
  const nested = repeat.children[0].children[1];
  assert.deepEqual(nested.repeat, [{ state: 'groups', path: [], key: ['id'] }, { path: ['rows'], key: ['id'] }]);
  assert.deepEqual(nested.children[0].children[0].value, { kind: 'path', root: 'state', symbol: 'groups', path: [{ repeat: 0 }, 'rows', { repeat: 1 }, 'title'] });
  assert.notEqual(repeat.nativeDeclarationId, nested.nativeDeclarationId);
  const reads = result.nativeDependencies.surfaces[0].reads;
  assert(reads.some(read => JSON.stringify(read.path) === JSON.stringify([{ repeat: 0 }, 'id'])));
  assert(reads.some(read => JSON.stringify(read.path) === JSON.stringify([{ repeat: 0 }, 'rows', { repeat: 1 }, 'id'])));
});

test('native readsets include selectors, all conditional branches, keys and transitive State reads', () => {
  const result = accepted(compile(source(view('<RMT.When test={model.meta.enabled}><RMT.Text value={model.meta.enabled ? selectors.shown.length : model.meta.title}/></RMT.When>'))));
  assert.equal(result.selectorDependencies.schema, 'xtend.rmtx.selector-dependencies.v4');
  assert.equal(result.nativeDependencies.schema, 'xtend.rmtx.native-view-dependencies.v1');
  const report = result.nativeDependencies.surfaces[0];
  assert(report.reads.some(read => read.root === 'selector' && read.symbol === 'shown'));
  assert(report.reads.some(read => read.symbol === 'meta' && read.path.at(-1) === 'title'));
  assert(report.transitiveStateReads.some(read => read.symbol === 'rows'));
  assert.equal(report.allSyntacticBranches, true);
  assert.equal(Object.isFrozen(report), true);
  const binding = result.orchestrationArtifacts.patchPlan.bindings.find(value => value.surface === 'owner');
  assert(binding.sources.includes('meta')); assert(binding.sources.includes('shown'));
});

test('canonical lowering rejects forged scope markers and foreign Model symbols', () => {
  const parsed = parseRmtxSource(source(view('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Text value={item.title}/></RMT.Repeat>')), options);
  assert.equal(parsed.ok, true);
  const bad = structuredClone(parsed.nativeView); bad.views[0].children[0].children[0].value.path[0].repeat = -0;
  assert.throws(() => lowerRmtxNativeViews(bad, { state: [{ id: 'rows' }], surfaces: [{ id: 'owner' }] }), /canonical indices/);
  const missing = structuredClone(parsed.nativeView); missing.views[0].children[0].repeat[0].state = 'missing';
  assert.throws(() => lowerRmtxNativeViews(missing, { state: [{ id: 'rows' }], surfaces: [{ id: 'owner' }] }), /undeclared Model/);
  let reads = 0;
  const accessor = Object.defineProperty({}, 'schema', { enumerable: true, get() { reads++; return 'xtend.rmtx.native-view.v1'; } });
  assert.throws(() => lowerRmtxNativeViews(accessor, {}), /accessor/); assert.equal(reads, 0);
});

for (const [label, body] of [
  ['unqualified HTML', view('<h1/>')],
  ['free JSX expression', view('{model.meta.title}')],
  ['raw native text', view('Product')],
  ['event handler child', view('<RMT.Element tag="button"><RMT.On event="click" action="rename" payload={{title:"target.value"}}/></RMT.Element>')],
  ['provider child', view('<RMT.XTension id="x" provider="p" owner="owner" lane="visible" props={{}}/>')],
  ['Surface child', view('<RMT.Surface id="foreign"/>')],
  ['unknown View field', '<RMT.Surface id="owner"><RMT.View html="x"/></RMT.Surface>'],
  ['duplicate View', '<RMT.Surface id="owner"><RMT.View/><RMT.View/></RMT.Surface>'],
  ['View outside Surface', '<RMT.View/>'],
  ['View on repeated host', '<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="owner"><RMT.View/></RMT.Surface></RMT.Repeat>'],
  ['View on provider host', '<RMT.Surface id="owner"><RMT.View/><RMT.XTension id="x" provider="p" owner="owner" lane="visible" props={{}}/></RMT.Surface>'],
  ['View on conditional host', '<RMT.Surface id="owner" present={model.meta.enabled}><RMT.View/></RMT.Surface>'],
  ['unsafe Surface kind', '<RMT.Surface id="owner" kind="named_surface"><RMT.View/></RMT.Surface>'],
  ...['style','script','svg','template','iframe','unknown','x-custom'].map(component => ['unsafe Surface wrapper ' + component, `<RMT.Surface id="owner" component="${component}"><RMT.View/></RMT.Surface>`]),
  ['script', view('<RMT.Element tag="script"/>')],
  ['style', view('<RMT.Element tag="style"/>')],
  ['custom unregistered element', view('<RMT.Element tag="x-unregistered"/>')],
  ['void children', view('<RMT.Element tag="input"><RMT.Text value="x"/></RMT.Element>')],
  ['unknown native property', view('<RMT.Element tag="div" properties={{innerHTML:"x"}}/>')],
  ['event attribute', view('<RMT.Element tag="button" attributes={{onclick:"evil()"}}/>')],
  ['inline style', view('<RMT.Element tag="div" attributes={{style:"color:red"}}/>')],
  ['internal identity attribute', view('<RMT.Element tag="div" attributes={{"data-rmt-surface":"other"}}/>')],
  ['internal transition attribute', view('<RMT.Element tag="div" attributes={{"data-xt-transition":"other"}}/>')],
  ['dynamic attributes object', view('<RMT.Element tag="div" attributes={model.meta}/>')],
  ['object text', view('<RMT.Text value={{title:"x"}}/>')],
  ['array property', view('<RMT.Element tag="input" properties={{value:[1]}}/>')],
  ['numeric condition', view('<RMT.When test={1}><RMT.Text value="x"/></RMT.When>')],
  ['missing item scope', view('<RMT.Text value={item.title}/>')],
  ['unknown Model', view('<RMT.Text value={model.missing.title}/>')],
  ['computed path', view('<RMT.Text value={model.meta["title"]}/>')],
  ['optional path', view('<RMT.Text value={model.meta?.title}/>')],
  ['call expression', view('<RMT.Text value={model.rows.map(x=>x.title)}/>')],
  ['spread map', view('<RMT.Element tag="div" attributes={{...model.meta}}/>')],
  ['missing native key', view('<RMT.Repeat from={model.rows}><RMT.Text value={item.title}/></RMT.Repeat>')],
  ['empty native Repeat', view('<RMT.Repeat from={model.rows} keyBy={item.id}/>')],
  ['repeated DOM id', view('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Element tag="p" attributes={{id:"row"}}/></RMT.Repeat>')],
  ['dynamic DOM id', view('<RMT.Element tag="p" attributes={{id:model.meta.title}}/>')],
  ['unsafe DOM id punctuation', view('<RMT.Element tag="p" attributes={{id:"target.bad"}}/>')],
  ['native tags in host Repeat', '<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Text value="x"/></RMT.Repeat>']
]) test('Source5 rejects ' + label + ' before producing runtime artifacts', () => rejected(compile(source(body))));

test('closed native expressions cannot execute source code', () => {
  delete globalThis.__rmtxNativeExecuted;
  rejected(compile(source(view('<RMT.Text value={(()=>{globalThis.__rmtxNativeExecuted=true;return "x"})()}/>'))));
  assert.equal(globalThis.__rmtxNativeExecuted, undefined);
});

test('provider composition remains on the existing typed materializer in Source5', () => {
  const reference = require('../../development/rmtx-a06/orchestration-profile/reference.cjs');
  const text = fs.readFileSync(path.resolve(__dirname, '../..', reference.source), 'utf8');
  const result = accepted(compileRmtxSource({ text, filePath: 'providers.rmtx' }, { ...options, componentInterfaceCatalog: reference.catalog() }));
  assert.equal(result.parserResult.components.schema, 'xtend.rmtx.components.v2');
  assert.equal(result.xtensionBindings.schema, 'xtend.xtensions.state-binding-artifact.v5');
  assert.equal(result.xtensionComposition.schema, 'xtend.maraca.xtension-composition-manifest.v9');
  assert.equal(result.componentDependencies.schema, 'xtend.rmtx.component-dependencies.v2');
  assert(result.xtensionBindings.bindings.every(entry => entry.binding.schema === 'xtend.xtensions.state-binding.v3'));
});
