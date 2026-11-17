'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { compileRmtxSource, createRmtxCompiler, RMTX_COMPILER_API_VERSION } = require('../../tools/rmt-language/rmtx-compiler');
const { parseRmtxSource, getRmtxOperatorProfile } = require('../../tools/rmt-language/rmtx-parser');
const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
const root = path.resolve(__dirname,'../..'), directory = path.join(root,'development/rmtx-a06/selector-profile');
const source=fs.readFileSync(path.join(directory,'selectors.rmtx'),'utf8');
const compile=text=>compileRmtxSource({text,filePath:'selectors.rmtx'},{syntaxVersion:'2.0.0'});
const program=body=>`import {RMT,model,input,selectors,item,params,contains} from '@ccslabs/xtend/rmt-language/rmtx'; export default <RMT.Program id="test">${body}</RMT.Program>;`;
const rows='<RMT.State id="rows" type="array" initial={[{id:1,enabled:true,name:"Alpha"},{id:2,enabled:false,name:"Beta"}]}/>';
const selector=body=>program(`${rows}<RMT.Selector id="picked" from={model.rows}>${body}</RMT.Selector>`);
const modelModule=import('../../xtendrmt/rmt-state-selector-runtime.js');
function noArtifacts(result) {
  assert.equal(result.ok,false); assert.equal(result.schema,'xtend.rmtx.compile-result.v2');
  for(const key of ['coreDocument','coreJson','orchestrationArtifacts','appServiceDemands','primitiveArtifacts','selectorDependencies'])assert.equal(result[key],null,key);
  assert(result.diagnostics.some(d=>d.severity==='error'&&d.source==='rmtx'&&d.range));
}
function effectiveState(state) { return {...state,selectors:state.selectors.map(({clauses,...entry})=>entry)}; }

test('v2 is explicit and produces separate parser/compiler contracts while default and v1 remain unchanged',()=>{
 const old=`import{RMT}from'@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="old"/>;`;
 const a=compileRmtxSource(old),b=compileRmtxSource(old,{syntaxVersion:'1.0.0'});
 assert.equal(RMTX_COMPILER_API_VERSION,'4.0.0');assert.equal(a.schema,'xtend.rmtx.compile-result.v1');assert.equal(a.apiVersion,'1.0.0');
 assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));assert.equal(Object.hasOwn(a,'selectorDependencies'),false);
 const c=compile(old);assert.equal(c.ok,true);assert.equal(c.apiVersion,'2.0.0');assert.equal(c.schema,'xtend.rmtx.compile-result.v2');
 assert.equal(c.parserResult.schema,'xtend.rmtx.parser-result.v2');assert.deepEqual(c.selectorDependencies.topologicalOrder,[]);
 assert.equal(createRmtxCompiler().apiVersion,'1.0.0');assert.equal(createRmtxCompiler({syntaxVersion:'2.0.0'}).apiVersion,'2.0.0');
 const denied=compileRmtxSource(source,{syntaxVersion:'1.0.0'});assert.equal(denied.ok,false);
 assert.equal(denied.schema,'xtend.rmtx.compile-result.v1');assert.equal(denied.selectorDependencies,undefined);
});

test('RMTX selector fixture has the same effective executable state/selector/reducer plans as Classic',async()=>{
 const r=compile(source),c=compileRmtClassicSource({text:fs.readFileSync(path.join(directory,'selectors.rmt'),'utf8'),filePath:'selectors.rmt'});
 assert.equal(r.ok,true,JSON.stringify(r.diagnostics));assert.equal(c.ok,true,JSON.stringify(c.diagnostics));
 assert.deepEqual(effectiveState(r.orchestrationArtifacts.state),effectiveState(c.orchestrationArtifacts.state));
 assert.deepEqual(r.orchestrationArtifacts.actions,c.orchestrationArtifacts.actions);
 assert.equal(r.coreDocument.manifest.sourceSyntax,'rmtx');assert.equal(r.orchestrationArtifacts.sourceSyntax,'rmtx');
 const api=await modelModule,rm=api.createRmtStateSelectorRuntime(r.orchestrationArtifacts.state),cm=api.createRmtStateSelectorRuntime(c.orchestrationArtifacts.state);
 assert.deepEqual(rm.modelReader.select('eligible').map(x=>x.id),['a','b']); // String rank ordering: 10 before 2.
 for(const term of ['Al','Be','missing',''])assert.deepEqual(rm.modelReader.select('search',{term}),cm.modelReader.select('search',{term}));
 assert.deepEqual(rm.modelReader.select('search',{term:'Al'}).map(x=>x.id),['a']);
 assert.equal(rm.modelReader.select('chosen').id,'b');
 rm.modelCommandPort.apply({operation:'set',state:'criteria',value:{minimum:5,selectedId:'b'}});
 assert.deepEqual(rm.modelReader.select('eligible').map(x=>x.id),['a']);assert.equal(rm.modelReader.select('chosen'),null);
});

test('static readsets include all branches, row/parameter paths and transitive selector sources',()=>{
 const r=compile(source);assert.equal(r.ok,true);
 const d=r.selectorDependencies;assert.equal(d.schema,'xtend.rmtx.selector-dependencies.v1');
 assert.deepEqual(d.topologicalOrder,['eligible','search','chosen']);
 const eligible=d.selectors.find(s=>s.id==='eligible'),search=d.selectors.find(s=>s.id==='search');
 assert(eligible.stateReads.some(r=>r.symbol==='criteria'&&r.path.join('.')==='minimum'));
 assert.deepEqual(search.parameterPaths,[['term']]);assert(search.rowPaths.some(p=>p.join('.')==='label'));
 assert(search.selectorReads.some(r=>r.symbol==='eligible'));
 assert(search.transitiveStateReads.some(r=>r.symbol==='rows'));assert(search.transitiveStateReads.some(r=>r.symbol==='criteria'));
 assert.equal(d.incrementalRecomputation,false);assert.equal(d.runtimeTracking,false);assert.equal(d.parametersForwardedToDependencies,false);
});

test('longest declared symbol resolution stays consistent in dependency facts and actual Model reads',async()=>{
 const r=compile(program(`<RMT.State id="scope" type="object" initial={{id:'parent'}}/><RMT.State id="scope.id" type="string" initial="child"/>
 <RMT.State id="values" type="array" initial={['parent','child']}/><RMT.Selector id="picked" from={model.values}><RMT.Where test={item===model.scope.id}/></RMT.Selector>`));
 assert.equal(r.ok,true,JSON.stringify(r.diagnostics));
 const reads=r.selectorDependencies.selectors[0].stateReads;assert(reads.some(x=>x.symbol==='scope.id'&&x.path.length===0));
 assert(!reads.some(x=>x.symbol==='scope'&&x.path.join('.')==='id'));
 const api=await modelModule;assert.deepEqual(api.createRmtStateSelectorRuntime(r.orchestrationArtifacts.state).modelReader.select('picked'),['child']);
});

test('bare row values and strict equality preserve zero, false and empty-string Find results',async()=>{
 const body=`<RMT.State id="values" type="array" initial={[0,false,'']}/>`+[['zero','0'],['falseValue','false'],['empty',"''"]].map(([id,v])=>`<RMT.Selector id="${id}" from={model.values}><RMT.Find test={item===${v}}/></RMT.Selector>`).join('');
 const r=compile(program(body));assert.equal(r.ok,true,JSON.stringify(r.diagnostics));const api=await modelModule,m=api.createRmtStateSelectorRuntime(r.orchestrationArtifacts.state);
 assert.equal(m.modelReader.select('zero'),0);assert.equal(m.modelReader.select('falseValue'),false);assert.equal(m.modelReader.select('empty'),'');
});

test('contains follows existing case-sensitive String conversion rather than Array membership',async()=>{
 const r=compile(program(`<RMT.State id="values" type="array" initial={[["x","y"],["x"],null]}/><RMT.Selector id="joined" from={model.values}><RMT.Where test={contains(item,'x,y')}/></RMT.Selector><RMT.Selector id="caseSensitive" from={model.values}><RMT.Where test={contains(item,'X')}/></RMT.Selector>`));
 assert.equal(r.ok,true);const api=await modelModule,m=api.createRmtStateSelectorRuntime(r.orchestrationArtifacts.state);
 assert.deepEqual(m.modelReader.select('joined'),[['x','y']]);assert.deepEqual(m.modelReader.select('caseSensitive'),[]);
});

test('parameters apply to the requested selector and are not silently forwarded through selector dependencies',async()=>{
 const r=compile(program(`<RMT.State id="values" type="array" initial={[1,2]}/><RMT.Selector id="parameterized" from={model.values}><RMT.Where test={item===params.id}/></RMT.Selector><RMT.Selector id="dependent" from={selectors.parameterized}/>`));
 assert.equal(r.ok,true);const api=await modelModule,m=api.createRmtStateSelectorRuntime(r.orchestrationArtifacts.state);
 assert.deepEqual(m.modelReader.select('parameterized',{id:2}),[2]);assert.deepEqual(m.modelReader.select('dependent',{id:2}),[]);
});

test('canonical import aliases bind selectors, item, params and contains without executing source imports',async()=>{
 const s=`import{RMT as O,model as M,item as row,params as args,contains as has}from'@ccslabs/xtend-compiler/rmt-language/rmtx';export default <O.Program id="alias"><O.State id="rows" type="array" initial={['Alpha','Beta']}/><O.Selector id="picked" from={M.rows}><O.Where test={has(row,args.term)}/></O.Selector></O.Program>`;
 const r=compile(s);assert.equal(r.ok,true,JSON.stringify(r.diagnostics));const api=await modelModule;
 assert.deepEqual(api.createRmtStateSelectorRuntime(r.orchestrationArtifacts.state).modelReader.select('picked',{term:'Al'}),['Alpha']);
});

const invalid=[
 ['bare item truthiness','<RMT.Where test={item.enabled}/>'],
 ['numeric truthiness','<RMT.Where test={1}/>'],
 ['truthy logical operand','<RMT.Where test={true || item.name}/>'],
 ['unparenthesized negation','<RMT.Where test={!item.enabled}/>'],
 ['negation/comparison precedence','<RMT.Where test={!item.enabled === true}/>'],
 ['loose equality','<RMT.Where test={item.id == 1}/>'],
 ['loose inequality','<RMT.Where test={item.id != 1}/>'],
 ['arithmetic','<RMT.Where test={item.id + 1 > 0}/>'],
 ['comparison chain','<RMT.Where test={item.id < 2 < 3}/>'],
 ['conditional expression','<RMT.Where test={item.enabled ? true : false}/>'],
 ['method call','<RMT.Where test={item.name.includes("A")}/>'],
 ['unbound helper','<RMT.Where test={otherContains(item.name,"A")}/>'],
 ['helper arity','<RMT.Where test={contains(item.name)}/>'],
 ['helper type arguments','<RMT.Where test={contains<string>(item.name,"A")}/>'],
 ['nested arbitrary calls','<RMT.Where test={contains(doNotExecute(),"A")}/>'],
 ['computed path','<RMT.Where test={item["id"]===1}/>'],
 ['optional path','<RMT.Where test={item?.id===1}/>'],
 ['action input in selector','<RMT.Where test={input.id===1}/>'],
 ['prototype path','<RMT.Where test={item.__proto__===null}/>'],
 ['unknown model reference even in skipped branch','<RMT.Where test={true || model.missing===0}/>'],
 ['unknown attribute','<RMT.Where test={true} ignored="yes"/>'],
 ['invalid sort direction','<RMT.Sort by={item.name} direction="ascending"/>'],
 ['sort model scope','<RMT.Sort by={model.rows}/>'],
 ['sort bare row','<RMT.Sort by={item}/>'],
 ['unsafe sort field','<RMT.Sort by={item.constructor}/>'],
 ['multiple Find','<RMT.Find test={true}/><RMT.Find test={true}/>'],
 ['multiple Sort','<RMT.Sort by={item.name}/><RMT.Sort by={item.id}/>'],
 ['multiple Output','<RMT.Output type="object[]"/><RMT.Output type="object[]"/>']
];
for(const [name,body]of invalid)test(`v2 rejects ${name} without executable artifacts`,()=>{delete globalThis.__rmtxSelectorExecuted;noArtifacts(compile(selector(body)));assert.equal(globalThis.__rmtxSelectorExecuted,undefined);});

test('Selector source must be a whole declared symbol; item and params cannot escape their contexts',()=>{
 noArtifacts(compile(program(`<RMT.State id="product" type="object" initial={{images:[]}}/><RMT.Selector id="bad" from={model.product.images}/>`)));
 noArtifacts(compile(program(`${rows}<RMT.Selector id="bad" from={item.rows}/>`)));
 noArtifacts(compile(program(`${rows}<RMT.Action id="bad"><RMT.Reduce state="rows" value={params.rows}/></RMT.Action>`)));
 noArtifacts(compile(program(`${rows}<RMT.Action id="bad"><RMT.Reduce state="rows" value={item.rows}/></RMT.Action>`)));
});

test('selector cycles and unknown dependencies are rejected by the common semantic backend',()=>{
 noArtifacts(compile(program('<RMT.Selector id="a" from={selectors.b}/><RMT.Selector id="b" from={selectors.a}/>')));
 noArtifacts(compile(selector('<RMT.Where test={selectors.missing===null}/>')));
});

test('all static branches count as dependencies while reference-looking literals do not',()=>{
 const r=compile(program(`${rows}<RMT.State id="flag" type="boolean" initial={true}/><RMT.Selector id="picked" from={model.rows}><RMT.Where test={true || model.flag===false}/><RMT.Where test={'state.missing'==='state.missing'}/></RMT.Selector>`));
 assert.equal(r.ok,true);const d=r.selectorDependencies.selectors[0];assert(d.stateReads.some(x=>x.symbol==='flag'));assert(!d.stateReads.some(x=>x.symbol==='missing'));
});

test('predicate diagnostics retain original URI and exact offending equality operator range',()=>{
 const s=selector('<RMT.Where test={item.id == 1}/>');const r=compileRmtxSource({text:s,uri:'file:///a063/selectors.rmtx'},{syntaxVersion:'2.0.0'});noArtifacts(r);
 const d=r.diagnostics.find(d=>d.code==='rmtx.predicate.equality');assert.equal(d.uri,'file:///a063/selectors.rmtx');assert.equal(s.slice(d.range.startOffset,d.range.endOffset),'==');
});
