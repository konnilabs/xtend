'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compileRmtxSource, createRmtxCompiler } = require('../../tools/rmt-language/rmtx-compiler');
const { parseRmtxSource } = require('../../tools/rmt-language/rmtx-parser');
const { materializeStateBindingArtifact } = require('../../tools/xtensions/state-binding-artifact');
const header = "import {RMT,model,item,input} from '@ccslabs/xtend/rmt-language/rmtx';";
const catalog = {items:[{id:'g',products:[{id:1,value:'numeric',enabled:true},{id:'1',value:'text',enabled:true}]},{id:'h',products:[{id:1,value:'other-parent',enabled:true}]}]};
const host = '<RMT.Surface id="host" component="div" present={item.enabled}><RMT.Lane name="visible"><RMT.Mount target="widget"/></RMT.Lane></RMT.Surface>';
function source(content = host, state = catalog) {
 return `${header} export default <RMT.Program id="keyed"><RMT.State id="catalog" type="object" initial={${JSON.stringify(state)}}/><RMT.Repeat from={model.catalog.items} keyBy={item.id}><RMT.Repeat from={item.products} keyBy={item.id}>${content}</RMT.Repeat></RMT.Repeat></RMT.Program>`;
}
const path = ['items',{repeat:0},'products',{repeat:1}];
function sidecar() {return {schema:'xtend.xtensions.state-binding-artifact.v3',documentId:'keyed',bindings:[{surface:'host',binding:{schema:'xtend.xtensions.state-binding.v2',address:{documentId:'keyed',declarationId:'widget',keys:[]},props:{value:{state:'catalog',path:[...path,'value'],type:'string'}},intents:{}}}]};}
function compile(text = source(), ...provided) {const bindings=provided.length?provided[0]:sidecar();return compileRmtxSource({text,filePath:'keyed.rmtx'},{syntaxVersion:'3.0.0',...(bindings === undefined ? {} : {xtensionBindings:bindings})});}
function success(result) {assert.equal(result.ok,true,JSON.stringify(result.diagnostics));return result;}
function failed(result) {assert.equal(result.ok,false);for(const key of ['coreDocument','coreJson','orchestrationArtifacts','appServiceDemands','primitiveArtifacts','xtensionBindings','selectorDependencies'])if(key!=='selectorDependencies'||result.sourceProfile.version!=='1.0.0')assert.equal(result[key],null,key);assert(result.diagnostics.length);return result;}
function rows(result,state=catalog){return materializeStateBindingArtifact(result.xtensionBindings,{states:{catalog:state}});}

test('explicit profile3 has own result and source contracts while defaults and profile2 retain their data shapes',()=>{
 const text=`${header.replace(',item','')} export default <RMT.Program id="empty"/>`;
 const a=success(compileRmtxSource({text,filePath:'empty.rmtx'}));const b=success(compileRmtxSource({text,filePath:'empty.rmtx'},{syntaxVersion:'2.0.0'}));const c=success(compileRmtxSource({text,filePath:'empty.rmtx'},{syntaxVersion:'3.0.0'}));
 assert.equal(a.schema,'xtend.rmtx.compile-result.v1');assert.equal(b.schema,'xtend.rmtx.compile-result.v2');assert.equal(c.schema,'xtend.rmtx.compile-result.v3');
 assert(!Object.hasOwn(a.parserResult,'hostScopes'));assert(!Object.hasOwn(b.parserResult,'hostScopes'));assert.equal(c.parserResult.hostScopes.schema,'xtend.rmtx.host-scopes.v1');assert.deepEqual(c.parserResult.hostScopes.hosts,[]);
 assert.equal(c.selectorDependencies.schema,'xtend.rmtx.selector-dependencies.v2');assert.equal(c.selectorDependencies.sourceProfile.version,'3.0.0');
 assert.equal(createRmtxCompiler().apiVersion,'1.0.0');const factory=createRmtxCompiler({syntaxVersion:'3.0.0'});assert.equal(factory.apiVersion,'3.0.0');assert.equal(factory.compileSource({text,filePath:'e.rmtx'},{syntaxVersion:'2.0.0'}).schema,b.schema);
});

test('nested source scopes flatten only static AST hosts and project into the existing validated v3 binding',()=>{
 const input=sidecar(),original=JSON.stringify(input);const r=success(compile(source(),input));assert.equal(JSON.stringify(input),original);
 const declarations=r.parserResult.hostScopes.hosts;assert.equal(declarations.length,1);assert.deepEqual(declarations[0].repeat,[{state:'catalog',path:['items'],key:['id']},{path:['products'],key:['id']}]);assert.deepEqual(declarations[0].presence,{state:'catalog',path:[...path,'enabled']});
 const surface=r.orchestrationArtifacts.surfaces.find(s=>s.id==='host');assert(!surface.repeat&&!surface.source);assert.deepEqual(r.xtensionBindings.bindings[0].repeat,declarations[0].repeat);assert.deepEqual(r.xtensionBindings.bindings[0].presence,declarations[0].presence);
 const materialized=rows(r);assert.deepEqual(materialized.map(row=>row.binding.address.keys),[['g',1],['g','1'],['h',1]]);assert.equal(new Set(materialized.map(row=>row.hostSurface)).size,3);
});

test('source key tuples retain identity through reorder and presence removes exactly the selected typed row',()=>{
 const r=success(compile());const original=rows(r),state=structuredClone(catalog);state.items.reverse();state.items[1].products.reverse();
 const reordered=rows(r,state);for(const before of original)assert(reordered.some(after=>after.hostSurface===before.hostSurface&&JSON.stringify(after.binding.address)===JSON.stringify(before.binding.address)));
 state.items[1].products.find(item=>typeof item.id==='number').enabled=false;const visible=rows(r,state);assert.equal(visible.length,2);assert(visible.some(row=>JSON.stringify(row.binding.address.keys)===JSON.stringify(['g','1'])));assert(!visible.some(row=>JSON.stringify(row.binding.address.keys)===JSON.stringify(['g',1])));
});

test('empty root and nested collections retain declared scopes without inventing runtime hosts',()=>{
 for(const state of [{items:[]},{items:[{id:'g',products:[]}]}]) {const r=success(compile(source(host,state)));assert.equal(r.parserResult.hostScopes.hosts.length,1);assert.deepEqual(rows(r,state),[]);}
});

test('matching existing sidecar scopes are accepted independently of object member order; conflicts are rejected',()=>{
 const raw=sidecar();raw.bindings[0].repeat=[{key:['id'],path:['items'],state:'catalog'},{key:['id'],path:['products']}];raw.bindings[0].presence={path:[...path,'enabled'],state:'catalog'};success(compile(source(),raw));
 for(const field of ['repeat','presence']){const changed=structuredClone(raw);if(field==='repeat')changed.bindings[0].repeat[1].key=['other'];else changed.bindings[0].presence.path=[...path,'other'];const r=failed(compile(source(),changed));assert.match(r.diagnostics[0].message,/conflicts/);assert(r.diagnostics[0].range);}
});

test('scoped host syntax cannot silently compile without its binding or with another artifact version',()=>{
 for(const input of [null,{}, {schema:'xtend.xtensions.state-binding-artifact.v2',documentId:'keyed',bindings:[]}, {...sidecar(),bindings:[]}])failed(compile(source(),input));
 const missing=compileRmtxSource({text:source(),filePath:'keyed.rmtx'},{syntaxVersion:'3.0.0'});failed(missing);assert.equal(missing.phase,'xtension-bindings');
});

test('initial invalid keys, duplicate siblings, and non-boolean presence clear every executable artifact',()=>{
 for(const mutate of [s=>s.items[0].products[1].id=1,s=>delete s.items[0].products[0].id,s=>s.items[0].products[0].id={},s=>s.items[0].products[0].id=-1,s=>s.items[0].products[0].enabled='true']){const state=structuredClone(catalog);mutate(state);failed(compile(source(host,state)));}
 const r=success(compile());const state=structuredClone(catalog);state.items[0].products[1].id=1;assert.throws(()=>rows(r,state),/unique/);
});

test('typed zero keys remain valid and unsafe sidecar values cannot be erased by a projection clone',()=>{
 const state=structuredClone(catalog);state.items[0].products[0].id=0;const r=success(compile(source(host,state)));assert.equal(rows(r,state)[0].binding.address.keys[1],0);
 const input=sidecar();input.bindings[0].binding.address.keys=[-0];failed(compile(source(),input));
 let reads=0;const getter=Object.defineProperty({},'schema',{enumerable:true,get(){reads++;return 'xtend.xtensions.state-binding-artifact.v3';}});failed(compile(source(),getter));assert.equal(reads,0);
});

test('Model-root resolution uses the longest declared symbol in scope and presence paths',()=>{
 const text=`${header} export default <RMT.Program id="long"><RMT.State id="catalog" type="object" initial={{items:[]}}/><RMT.State id="catalog.items" type="array" initial={[]}/><RMT.Repeat from={model.catalog.items} keyBy={item.id}>${host}</RMT.Repeat></RMT.Program>`;
 const parsed=parseRmtxSource({text,filePath:'long.rmtx'},{syntaxVersion:'3.0.0'});assert.equal(parsed.ok,true,JSON.stringify(parsed.diagnostics));assert.deepEqual(parsed.hostScopes.hosts[0].repeat[0],{state:'catalog.items',path:[],key:['id']});
});

for(const [name,change] of [
 ['missing key',s=>s.replace(' keyBy={item.id}','')],['computed key',s=>s.replace('keyBy={item.id}','keyBy={item["id"]}')],['index key',s=>s.replace('keyBy={item.id}','keyBy={0}')],['whole item key',s=>s.replace('keyBy={item.id}','keyBy={item}')],['optional key',s=>s.replace('keyBy={item.id}','keyBy={item?.id}')],['unsafe key',s=>s.replace('keyBy={item.id}','keyBy={item.constructor}')],['root item scope',s=>s.replace('from={model.catalog.items}','from={item.items}')],['nested Model scope',s=>s.replace('from={item.products}','from={model.catalog.items}')],['unknown state',s=>s.replace('from={model.catalog.items}','from={model.absent.items}')],['presence call',s=>s.replace('present={item.enabled}','present={Boolean(item.enabled)}')],['presence comparison',s=>s.replace('present={item.enabled}','present={item.enabled === true}')],['presence input',s=>s.replace('present={item.enabled}','present={input.enabled}')],['native key attribute',s=>s.replace('id="host"','id="host" key="index"')]
])test(`closed source scopes reject ${name}`,()=>{failed(compile(change(source())));});

test('v1/v2 reject all new operators and fields instead of dropping orchestration',()=>{
 for(const version of ['1.0.0','2.0.0'])failed(compileRmtxSource({text:source(),filePath:'old.rmtx'},{syntaxVersion:version}));
});

test('source-scoped parser errors retain original document URI and offending range',()=>{
 const text=source().replace('keyBy={item.id}','keyBy={item["id"]}');const r=parseRmtxSource({text,uri:'file:///scopes/invalid.rmtx'},{syntaxVersion:'3.0.0'});assert.equal(r.ok,false);assert.equal(r.hostScopes,null);assert.equal(r.diagnostics[0].uri,'file:///scopes/invalid.rmtx');const range=r.diagnostics[0].range;assert.equal(text.slice(range.startOffset,range.endOffset),'item["id"]');
});

function eventSource(guard){return `${header} export default <RMT.Program id="guard"><RMT.State id="app" type="object" initial={{ready:false,count:2}}/><RMT.Action id="save"><RMT.Input name="id" type="string"/><RMT.Reduce state="app" path="count" value={3}/></RMT.Action><RMT.Surface id="button" component="button"><RMT.On event="click" action="save" payload={{id:"detail.id"}} when={${guard}}/></RMT.Surface></RMT.Program>`;}

test('On.when uses actual event routing and reads live Model before dispatch',async()=>{
 const compiled=success(compile(eventSource('model.app.ready === true && !(model.app.count < 2)'),undefined));const {createRmtStateSelectorRuntime}=await import('../../xtendrmt/rmt-state-selector-runtime.js');const model=createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state);const {createRmtEventRoutingRuntime}=await import('../../xtendrmt/rmt-event-routing-runtime.js');let commands=0;
 const binding=compiled.orchestrationArtifacts.events[0];assert(binding.condition);const router=createRmtEventRoutingRuntime({events:[binding],modelReader:model.modelReader,commandRuntime:{dispatchCommand(){commands++;return{status:'success'};}}});
 try{assert.equal((await router.routeEvent(binding.id,{detail:{id:'ok'}})).status,'skipped');assert.equal(commands,0);model.modelCommandPort.apply({operation:'set',state:'app',value:{ready:true,count:2}});assert.equal((await router.routeEvent(binding.id,{detail:{id:'ok'}})).status,'success');assert.equal(commands,1);}finally{router.dispose();}
});

for(const guard of ['model.absent.ready === true','item.ready === true','input.ready === true','model.app.ready','model.app.count == 2','!model.app.ready','contains(model.app.ready, "true")'])test(`On condition rejects ${guard}`,()=>failed(compile(eventSource(guard),undefined)));

test('unsupported Lifecycle conditions cannot appear as successful ignored guards',()=>{
 const text=`${header} export default <RMT.Program id="m"><RMT.Surface id="host"><RMT.Lane name="visible"><RMT.Mount target="widget" when={false}/></RMT.Lane></RMT.Surface></RMT.Program>`;failed(compile(text,undefined));
});

for (const payload of ['{}','{id: 1}','{id: "detail.constructor"}','{id: "global.secret"}','{id: "detail[0]"}']) test(`On rejects invalid payload map ${payload}`,()=>{
 const text=eventSource('true').replace('{id:"detail.id"}',payload);failed(compile(text,undefined));
});
test('source presence outside repeats projects a strictly boolean root Model path',()=>{
 const text=`${header} export default <RMT.Program id="single"><RMT.State id="shown" type="boolean" initial={false}/><RMT.State id="text" type="string" initial="ok"/><RMT.Surface id="host" component="div" present={model.shown}/></RMT.Program>`;
 const bindings=sidecar();bindings.bindings[0].binding.props.value={state:'text',path:[],type:'string'};
 const r=success(compile(text,bindings));assert.deepEqual(r.xtensionBindings.bindings[0].presence,{state:'shown',path:[]});assert.deepEqual(materializeStateBindingArtifact(r.xtensionBindings,{states:{shown:false,text:'ok'}}),[]);
 assert.equal(materializeStateBindingArtifact(r.xtensionBindings,{states:{shown:true,text:'ok'}}).length,1);
 failed(compile(text.replace('initial={false}','initial="false"'),bindings));
});

test('public profile3 types preserve distinct legacy results and accurately expose source scopes and dependencies',()=>{
 const ts=require('typescript'),path=require('node:path');
 const file=path.join(__dirname,'fixtures/rmtx-host-scopes-consumer.ts');
 const program=ts.createProgram([file],{noEmit:true,strict:true,skipLibCheck:false,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext});
 const diagnostics=ts.getPreEmitDiagnostics(program);
 assert.deepEqual(diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
});

test('On payload fields must exactly match the declared Action inputs',()=>{
 for(const payload of ['{wrong:"detail.id"}','{id:"detail.id",extra:"detail.extra"}'])failed(compile(eventSource('true').replace('{id:"detail.id"}',payload),undefined));
 const missing=eventSource('true').replace('<RMT.Input name="id" type="string"/>','<RMT.Input name="id" type="string"/><RMT.Input name="extra" type="number"/>');failed(compile(missing,undefined));
 const unknown=eventSource('true').replace('action="save"','action="missing"');failed(compile(unknown,undefined));
});

test('scoped XTension templates cannot bypass provider intents through native On bindings',()=>{
 const native='<RMT.On event="click" action="missing" payload={{id:"detail.id"}}/>';
 const scoped=source().replace('</RMT.Surface>',native+'</RMT.Surface>');const r=failed(compile(scoped));assert.equal(r.diagnostics[0].code,'rmtx.host-scope.native-event');
 const single=`${header} export default <RMT.Program id="s"><RMT.State id="shown" type="boolean" initial={true}/><RMT.Surface id="host" component="div" present={model.shown}>${native}</RMT.Surface></RMT.Program>`;assert.equal(failed(compile(single)).diagnostics[0].code,'rmtx.host-scope.native-event');
});
