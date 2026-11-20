'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {compileRmtxSource}=require('../../tools/rmt-language/rmtx-compiler');
const port=require('../../tools/xtensions/native-managed-view-projection');
const legacy=require('../../tools/xtensions/native-surface-projection');
const bridge=require('../../tools/xtensions/native-component-managed');
const validation=require('../../tools/xtensions/native-managed-view-validation');
const source=body=>`import {RMT,model,input,item} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="native.managed"><RMT.State id="ui" type="object" initial={{value:'a',values:['red'],selected:null}}/><RMT.State id="rows" type="collection" initial={[{id:1,value:'a'},{id:'1',value:'b'}]}/><RMT.Action id="change"><RMT.Input name="value" type="string"/><RMT.Reduce state="ui" path="value" value={input.value}/></RMT.Action>${body}</RMT.Program>`;
const compile=body=>{const result=compileRmtxSource(source(body),{syntaxVersion:'8.0.0'});assert.equal(result.ok,true,JSON.stringify(result.diagnostics));return result.orchestrationArtifacts;};
const snapshot={states:{ui:{value:'A',values:['red','green'],selected:null},rows:[{id:1,value:'A'},{id:'1',value:'B'}]},selectors:{}};
const owner=children=>`<RMT.Surface id="editor"><RMT.View>${children}</RMT.View></RMT.Surface>`;
function components(value){const rows=[];function walk(node){if(Array.isArray(node)){node.forEach(walk);return;}if(!node||typeof node!=='object')return;if(node.nativeBinding)rows.push(node);walk(node.children);}walk(value);return rows;}
test('Source8 compiles into exact Program6/Header3 and closed Port4 while Source7 rejects it',()=>{
 const program=compile(owner('<RMT.Component ref="email" tag="x-input" properties={{value:model.ui.value}}><RMT.On event="input-changed" action="change" payload={{value:"detail.value"}}/></RMT.Component>'));
 assert.equal(program.schema,'xtend.rmt.app-orchestration.v6');assert.equal(program.render.nativeView.schema,'xtend.rmt.native-view.v3');assert.equal(port.NATIVE_MANAGED_VIEW_RUNTIME.API_VERSION,'4.0.0');
 const checked=port.validateNativeManagedViewProgram(program),nodes=components(port.materializeNativeManagedView(checked,snapshot));
 assert.deepEqual(validation.validateNativeManagedViewProgram(program),checked,'platform validator must apply the same complete rules');
 assert.equal(nodes.length,1);assert.deepEqual(nodes[0].nativeBinding,{declarationId:'native:editor:0',ref:'email',surfaceId:'editor',keys:[]});assert.equal(nodes[0].properties.value.value,'A');
 assert.throws(()=>legacy.validateNativeSurfaceViewProgram(program),/Program5/);
 assert.deepEqual(port.NATIVE_MANAGED_VIEW_RUNTIME.materializeNativeEvents(checked,snapshot).events,[],'lexical component events must never enter Surface delegation');
});
test('private platform validator has no instance bridge or Renderer registry dependency',()=>{
 const fs=require('node:fs'),path=require('node:path'),seen=new Set();
 function visit(file){file=require.resolve(file);if(seen.has(file))return;seen.add(file);const source=fs.readFileSync(file,'utf8');for(const match of source.matchAll(/require\(['"](\.[^'"]+)['"]\)/g))visit(path.resolve(path.dirname(file),match[1]));}
 visit('../../tools/xtensions/native-managed-view-validation');
 for(const forbidden of ['native-component-managed.js','native-managed-component-registry.js','native-surface-projection-core.js'])assert.ok(![...seen].some(file=>file.endsWith('/'+forbidden)),'pure validation must not load '+forbidden);
});
test('ordinary Surface On retains its HTML component while lexical native On cannot become a sibling delegate',()=>{
 const program=compile('<RMT.Surface id="editor" component="article"><RMT.On event="click" action="change" payload={{value:"detail.value"}}/><RMT.View><RMT.Component ref="email" tag="x-input"><RMT.On event="input-changed" action="change" payload={{value:"detail.value"}}/></RMT.Component></RMT.View></RMT.Surface>');
 const surface=program.events.find(row=>row.schema==='xtend.rmt.native-event-binding.v2');
 const lexical=program.events.find(row=>row.schema==='xtend.rmt.native-event-binding.v3');
 assert.ok(surface);assert.ok(lexical);assert.equal(surface.component,'article');
 const result=port.NATIVE_MANAGED_VIEW_RUNTIME.materializeNativeEvents(program,snapshot);
 assert.equal(result.events.length,1);assert.equal(result.events[0].event,'click');assert.equal(result.events[0].component,'article');
 assert.ok(!result.events.some(row=>row.event==='input-changed'),'sibling input-changed must never reach a Surface Action delegate');
 for(const change of [{schema:'xtend.rmt.native-event-binding.v2'},{component:'article'},{schema:'xtend.rmt.native-event-binding.v2',component:'article'}]){
  const forged=structuredClone(program);Object.assign(forged.events.find(row=>row.id===lexical.id),change);
  assert.throws(()=>port.NATIVE_MANAGED_VIEW_RUNTIME.materializeNativeEvents(forged,snapshot),/exact Header3 join/);
 }
 const missing=structuredClone(program);missing.render.nativeView.events=[];
 assert.throws(()=>port.NATIVE_MANAGED_VIEW_RUNTIME.materializeNativeEvents(missing,snapshot),/exact Header3 join/);
});
test('structured component values stay literal data and typecheck before descriptor writes',()=>{
 const program=compile(owner('<RMT.Component ref="colors" tag="x-select" properties={{values:model.ui.values}}/>'));
 const node=components(port.materializeNativeManagedView(program,snapshot))[0];assert.deepEqual(node.properties.values,{op:'literal',value:['red','green']});
 assert.throws(()=>port.materializeNativeManagedView(program,{...snapshot,states:{...snapshot.states,ui:{...snapshot.states.ui,values:['red',2]}}}),/incompatible type/);
});
test('Source8 tab selection uses typed selectedKey and rejects the Classic positional attribute',()=>{
 const invalid=compileRmtxSource(source(owner('<RMT.Component ref="tabs" tag="x-tabs" attributes={{selected:"0"}}/>')),{syntaxVersion:'8.0.0'});
 assert.equal(invalid.ok,false);assert.ok(invalid.diagnostics.some(row=>row.code==='rmtx.native.component-sink'));
 const program=compile(owner('<RMT.Component ref="tabs" tag="x-tabs" properties={{items:[{key:1,ref:"one"},{key:"1",ref:"two"}],selectedKey:"1"}}><RMT.Element ref="one" tag="section"/><RMT.Element ref="two" tag="section"/></RMT.Component>'));
 const tabs=components(port.materializeNativeManagedView(program,snapshot))[0];assert.equal(tabs.properties.selectedKey.value,'1');assert.equal(Object.hasOwn(tabs.attributes,'selected'),false);
});
test('managed attribute types remain metadata-closed while ordinary HTML retains its Boolean rules',()=>{
 const managed=compile(owner('<RMT.Component ref="field" tag="x-input" attributes={{disabled:model.ui.value}}/>'));
 assert.throws(()=>port.materializeNativeManagedView(managed,snapshot),/incompatible type/);
 const html=compile(owner('<RMT.Element tag="button" attributes={{disabled:model.ui.value}}/>'));
 assert.throws(()=>port.materializeNativeManagedView(html,snapshot),/Boolean or null/);
 const enabled={...snapshot,states:{...snapshot.states,ui:{...snapshot.states.ui,value:true}}};
 assert.equal(components(port.materializeNativeManagedView(managed,enabled))[0].attributes.disabled.value,true);
});
test('native refs preserve full typed Surface plus View repeat identities',()=>{
 const program=compile('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="editor"><RMT.View><RMT.Component ref="email" tag="x-input" properties={{value:item.value}}/></RMT.View></RMT.Surface></RMT.Repeat>');
 const nodes=components(port.materializeNativeManagedView(program,snapshot));assert.equal(nodes.length,2);assert.deepEqual(nodes.map(row=>row.nativeBinding.keys),[[1],['1']]);assert.notEqual(nodes[0].nativeBinding.surfaceId,nodes[1].nativeBinding.surfaceId);
});
test('lexical On keys use the full View repeat tuple without becoming Surface delegates',()=>{
 const program=compile('<RMT.Action id="choose"><RMT.Input name="rowId" type="json"/><RMT.Reduce state="ui" path="selected" value={input.rowId}/></RMT.Action>'+owner('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Component ref="email" tag="x-input" properties={{value:item.value}}><RMT.On event="input-changed" action="choose" payload={{}} keys={{rowId:0}}/></RMT.Component></RMT.Repeat>'));
 const checked=port.validateNativeManagedViewProgram(program);assert.deepEqual(port.NATIVE_MANAGED_VIEW_RUNTIME.materializeNativeEvents(checked,snapshot).events,[]);
 const bindings=port.materializeNativeComponentBindings(checked,snapshot);assert.deepEqual(bindings.map(row=>row.keys),[[1],['1']]);assert.deepEqual(bindings.map(row=>row.events[0].keyFields),[{rowId:0},{rowId:0}]);
});
test('named component slots retain exact compiler ownership without widening slot attributes',()=>{
 const program=compile(owner('<RMT.Component ref="header" tag="x-header"><RMT.Slot name="actions"><RMT.Component ref="button" tag="x-button"/></RMT.Slot></RMT.Component>'));
 const nodes=components(port.materializeNativeManagedView(program,snapshot)),child=nodes.find(row=>row.tag==='x-button'),registry=port.createNativeComponentRegistry(program);
 assert.deepEqual(child.nativeSlot,{ownerDeclarationId:nodes[0].nativeBinding.declarationId,name:'actions'});
 assert.doesNotThrow(()=>registry.validateNativeComponentDescriptor(child,{}, {attributes:{slot:'actions'},properties:{}}));
 assert.throws(()=>registry.validateNativeComponentDescriptor({...child,nativeSlot:{...child.nativeSlot,name:'nav'}},{},{attributes:{slot:'nav'},properties:{}}),/slot assignment/);
});
test('native command source joins an actual Effect and resolves exact current target',()=>{
 const program=compile('<RMT.Action id="focus"><RMT.Effect kind="component-command" target="editor.email" command="focus" args={{}}/></RMT.Action>'+owner('<RMT.Component ref="email" tag="x-input"/>'));
 const command=program.render.nativeView.commands[0];assert.ok(command);assert.equal(program.actions.effects.find(row=>row.id===command.id).kind,'component-command');
 const resolved=port.resolveNativeCommand(program,command.id,snapshot,{});assert.equal(resolved.target,'editor.email');assert.deepEqual(resolved.args,{});assert.deepEqual(resolved.keys,[]);
 const changed=JSON.parse(JSON.stringify(program));changed.render.nativeView.commands=[];assert.throws(()=>port.validateNativeManagedViewProgram(changed),/sidecar|coverage|Header3/);
});
test('native HTML refs are versioned and scoped through the same stable key engine',()=>{
 const program=compile(owner('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Element ref="panel" tag="section"/></RMT.Repeat>'));
 const rendered=port.materializeNativeManagedView(program,snapshot),refs=[];function walk(node){if(Array.isArray(node)){node.forEach(walk);return;}if(node?.nativeRef)refs.push(node.nativeRef);if(node?.children)walk(node.children);}walk(rendered);
 assert.deepEqual(refs.map(row=>row.keys),[[1],['1']]);assert.ok(refs.every(row=>row.surfaceId==='editor'&&row.ref==='panel'));
});
