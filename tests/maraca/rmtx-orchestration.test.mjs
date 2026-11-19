import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createMaracaNativeOrchestrationRuntime} from '../../xtend-maraca/native-orchestration-runtime.mjs';
import * as state from '../../xtendrmt/rmt-state-selector-runtime.js';
import * as action from '../../xtendrmt/rmt-action-effect-runtime.js';
import * as app from '../../xtendrmt/rmt-app-runtime.js';
import * as renderer from '../../xtendrmt/rmt-dom-descriptor-renderer.js';
import * as viewProjection from '../../xtendrmt/rmt-maraca-view-projection-adapter.js';
import * as presentation from '../../xtendrmt/rmt-presentation-effect-adapter.js';
import * as events from '../../xtendrmt/rmt-event-routing-runtime.js';
import * as surfaces from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import * as surfaceController from '../../components/xsurfacemanager-controller.js';
import * as kernel from '../../xtendrmt/rmt-kernel-orchestration-controller.js';
import * as kernelRuntime from '../../xtendrmt/rmt-runtime.esm.js';
import {createRmtKernelScheduler} from '../../xtendrmt/rmt-kernel-scheduler.js';
const require=createRequire(import.meta.url), {JSDOM}=require('jsdom');
const {createMaracaBuildPlan}=require('../../xtend-maraca'), {createXtendFabric}=require('../../fabric/xtend-fabric');
const nativeViewRuntimePort=require('../../tools/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
const rootDir=new URL('../../',import.meta.url).pathname;
const defaults={enabled:true,title:'first',hydrate:true,suspend:false,resume:false,detach:false,reattach:false,dispose:false,recycle:false,invalidate:false,prewarm:false};
const operatorNames=['Mount','Hydrate','Suspend','Resume','Detach','Reattach','Dispose','Recycle','Invalidate','Prewarm'];
function source(initial={}) {return `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="ops"><RMT.State id="ui" type="object" initial={${JSON.stringify({...defaults,...initial})}}/>
<RMT.Action id="replace"><RMT.Input name="ui" type="object"/><RMT.Reduce state="ui" value={input.ui}/></RMT.Action>
<RMT.Action id="rename"><RMT.Input name="title" type="string"/><RMT.Reduce state="ui" path="title" value={input.title}/></RMT.Action>
<RMT.Surface id="owner" component="section"><RMT.Lane name="visible">${operatorNames.map(op=>`<RMT.${op} target="owner" when={model.ui.${op==='Mount'?'enabled':op.toLowerCase()}}/>`).join('')}</RMT.Lane>
<RMT.On event="click" action="rename" payload={{title:'detail.title'}}/>
<RMT.View><RMT.Element tag="h1"><RMT.Text value={model.ui.title}/></RMT.Element><RMT.Element tag="input"/><RMT.Element tag="div"><RMT.Element tag="span"><RMT.Text value="nested"/></RMT.Element></RMT.Element></RMT.View></RMT.Surface>
<RMT.Surface id="sibling" component="aside"><RMT.View><RMT.Text value="sibling"/></RMT.View></RMT.Surface></RMT.Program>`;}
function build(initial={},text=source(initial)) {const plan=createMaracaBuildPlan({filePath:'tests/maraca/ops.rmtx',sourceText:text,rmtxSyntaxVersion:'7.0.0',orchestration:'strict',kernel:'strict',hydration:'off',validation:'off',transitions:'off',services:false,pwa:false},{rootDir,inspectToolchain:false});assert.equal(plan.ok,true,JSON.stringify(plan.diagnostics));assert.equal(plan.schema,'xtend.maraca.build-plan.v11');return plan;}
async function fixture({initial={},text,componentRegistry,provider=false,defaultRenderer=false,providerPortal=false}={}) {
  const dom=new JSDOM('<main></main>',{pretendToBeVisual:true}),root=dom.window.document.querySelector('main'),fabric=createXtendFabric(),admissions=[];
  const scheduler=createRmtKernelScheduler({preferPostTask:false,observer:row=>admissions.push(row)}),controller=surfaceController.createSurfaceController();
  const writer=defaultRenderer?null:renderer.createRmtDomDescriptorRenderer({documentTarget:dom.window.document}),port=viewProjection.createRmtMaracaViewProjectionAdapter({root,documentTarget:dom.window.document});
  let sourceText=text||source(initial);
  if(provider){
    sourceText=sourceText.replace('</RMT.View></RMT.Surface>',`</RMT.View><RMT.Surface id="host" component="div"${providerPortal?' portal="neutral"':''}/></RMT.Surface>`);
    if(providerPortal){root.id='app-root';sourceText=sourceText.replace('<RMT.State id="ui"','<RMT.Portal id="neutral" root="#app-root" layer="surface"/><RMT.State id="ui"');}
  }
  const plan=build(initial,sourceText);let graph,graphController,kernelController;
  const savedGlobals=new Map(),hosts=[];let loads=0;
  if(provider)for(const key of ['window','document','Node','Element','HTMLElement','navigator','MutationObserver','Event','CustomEvent']){savedGlobals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});}
  const hostScope=plan.orchestration.artifact.render.nativeView.scopes.find(row=>row.surface==='host');
  if(provider)plan.xtensionBindings={schema:'xtend.xtensions.state-binding-artifact.v7',documentId:'ops',bindings:[{surface:'host',ownerSurface:'owner',...(hostScope?.repeat?{repeat:hostScope.repeat}:{}),binding:{schema:'xtend.xtensions.state-binding.v3',address:{documentId:'ops',declarationId:'provider',keys:[]},props:{title:{type:'string',projection:{kind:'path',root:'state',symbol:'ui',path:['title']}}},intents:{}}}]};
  const createXTensionHost=provider?context=>{
    const React=require('react'),ReactDOM={...require('react-dom'),...require('react-dom/client')};
    const {createReactKernelRuntimeAdapter}=require('../../tools/xtensions/react-runtime-adapter');
    const native=kernelController.core.rmt,rootId=native.listRoots().find(row=>native.getRootElement(row.id)===root).id;
    const host=createReactKernelRuntimeAdapter({...context,fabric,component:props=>React.createElement('output',null,props.title),loadRuntime(){loads++;return{React,ReactDOM};},policy:{events:context.events},kernelWork:{scheduler,rootId,scope:context.xtensionId},resourceGraph:{kernel:native,surfaceGraph:graph,surfaceController:graphController,surfaceId:nativeViewRuntimePort.resolveSurfaceInstance(plan.orchestration.artifact,'owner',context.identity.address.keys)}});
    hosts.push(host);return host;
  }:null;
  if(createXTensionHost)Object.defineProperty(createXTensionHost,'prewarm',{value:async()=>{}});
  if(typeof componentRegistry==='function')componentRegistry=componentRegistry(dom);

  const runtime=createMaracaNativeOrchestrationRuntime({plan,root,fabric,scheduler,nativeViewRuntimePort,componentRegistry,surfaceController:controller,...(defaultRenderer?{}:{domRenderer:writer}),viewProjectionPort:port,
    ...(provider?{xtensionBindingsRuntime:require('../../tools/xtensions/state-binding').ORCHESTRATED_STATE_BINDING_RUNTIME,createXTensionHost}:{}),
    moduleApis:{state,action,app,renderer,viewProjection,presentation,events,surfaceController,kernelRuntime,
      kernel:{...kernel,createRmtKernelOrchestrationController(options){return kernelController=kernel.createRmtKernelOrchestrationController(options);}},
      surfaces:{...surfaces,createRmtSurfaceResourceGraphRuntime(options){graphController=options.surfaceController;return graph=surfaces.createRmtSurfaceResourceGraphRuntime(options);}}}});
  try {await runtime.boot();}catch(error){runtime.dispose();controller.dispose();scheduler.dispose();dom.window.close();throw error;}
  return{dom,root,runtime,controller,fabric,scheduler,admissions,plan,hosts,get loads(){return loads;},get graph(){return graph;},get nativeKernel(){return kernelController.core.rmt;},owner:()=>root.querySelector('[data-maraca-surface="owner"]'),
    async replace(patch){return runtime.dispatchCommand('replace',{ui:{...runtime.snapshot().state.states.ui,...patch}});},
    async close(){runtime.dispose();await runtime.whenXTensionsIdle();controller.dispose();scheduler.dispose();dom.window.close();for(const[key,descriptor]of savedGlobals)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}

test('Source7 exposes its explicit runtime and all ten actual compiled lifecycle operations',async()=>{const f=await fixture();try{assert.equal(f.runtime.schema,'xtend.maraca.plan-runtime.v16');assert.deepEqual(new Set(f.plan.orchestration.artifact.lifecycle.operations.map(row=>row.op)),new Set(operatorNames.map(row=>row.toLowerCase())));assert.equal(f.owner().querySelector('h1').textContent,'first');}finally{await f.close();}});

test('Suspend/Resume gates native events while retaining mounted native identity and local input state',async()=>{const f=await fixture();try{const node=f.owner(),input=node.querySelector('input'),nested=node.querySelector('span');input.value='local';const generation=f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation;
  await f.replace({suspend:true});assert.ok(f.owner() === node, "Retained native/provider identity must remain stable");assert.ok(node.querySelector('span') === nested, "Retained native/provider identity must remain stable");node.dispatchEvent(new f.dom.window.CustomEvent('click',{detail:{title:'ignored'}}));await new Promise(resolve=>setImmediate(resolve));assert.equal(f.runtime.snapshot().state.states.ui.title,'first');
  await f.replace({suspend:false,resume:true});assert.ok(f.owner() === node, "Retained native/provider identity must remain stable");assert.equal(input.value,'local');assert.equal(f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation,generation);
  node.dispatchEvent(new f.dom.window.CustomEvent('click',{detail:{title:'active'}}));await new Promise(resolve=>setTimeout(resolve,30));assert.equal(f.runtime.snapshot().state.states.ui.title,'active');
}finally{await f.close();}});

test('Detach/Reattach parks the real native subtree and restores the same outer and nested nodes',async()=>{const f=await fixture();try{const node=f.owner(),input=node.querySelector('input'),nested=node.querySelector('span'),sibling=f.root.querySelector('aside');input.value='local';const token=f.runtime.getSurfaceBoundary('owner').capture();
  await f.replace({detach:true});assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(node.isConnected,false);assert.ok(f.root.querySelector('aside') === sibling, "Retained native/provider identity must remain stable");assert.equal(f.runtime.getSurfaceBoundary('owner').isCurrent(token),false);
  await f.replace({detach:false,reattach:true,title:'updated'});assert.ok(f.owner() === node, "Retained native/provider identity must remain stable");assert.ok(node.querySelector('span') === nested, "Retained native/provider identity must remain stable");assert.ok(node.querySelector('input') === input, "Retained native/provider identity must remain stable");assert.equal(input.value,'local');assert.equal(node.querySelector('h1').textContent,'updated');
}finally{await f.close();}});

test('Dispose is content-terminal until Recycle without changing Controller generation',async()=>{const f=await fixture();try{const node=f.owner(),boundary=f.runtime.getSurfaceBoundary('owner'),token=boundary.capture(),generation=f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation;
  await f.replace({dispose:true,hydrate:false});assert.ok(f.owner() === null, 'Native content must be absent');await f.replace({dispose:false,title:'still absent'});assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(boundary.isCurrent(token),false);
  await f.replace({recycle:true,hydrate:true});assert.ok(f.owner());assert.ok(f.owner() !== node, 'Recycle creates a fresh native content lifetime');assert.equal(f.owner().querySelector('h1').textContent,'still absent');assert.equal(f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation,generation);
}finally{await f.close();}});

test('Prewarm runs under a live Controller shell while Mount is false',async()=>{const f=await fixture({initial:{enabled:false,prewarm:true,hydrate:false}});try{assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').status,'open');assert.ok(f.admissions.some(row=>JSON.stringify(row).includes('prewarm')));await f.replace({enabled:true});assert.ok(f.owner());}finally{await f.close();}});

test('atomic conflicting lifecycle guards fail before Model and DOM writes',async()=>{const f=await fixture();try{const before=f.runtime.snapshot().state,node=f.owner();for(const patch of [{suspend:true,resume:true},{detach:true,reattach:true},{dispose:true,recycle:true}]){await assert.rejects(f.replace(patch),/Conflicting lifecycle/);assert.deepEqual(f.runtime.snapshot().state,before);assert.ok(f.owner() === node, 'Conflicting commands do not change native identity');}}finally{await f.close();}});


test('paused and detached provider controllers preserve their mounted React root and resume latest props',async()=>{
 const f=await fixture({provider:true});try{
   assert.equal(f.hosts.length,1);const host=f.hosts[0],output=f.root.querySelector('output'),owner=f.owner();assert.equal(output.textContent,'first');
   await f.replace({suspend:true,title:'paused'});assert.equal(f.hosts.length,1);assert.equal(host.snapshot().phase,'suspended','Suspend must retain a suspended provider controller');assert.equal(output.textContent,'first');
   await f.replace({suspend:false,resume:true});assert.ok(f.hosts[0] === host, "Retained native/provider identity must remain stable");assert.equal(host.snapshot().phase,'active');assert.ok(f.root.querySelector('output') === output, "Retained native/provider identity must remain stable");assert.equal(output.textContent,'paused');
   await f.replace({resume:false,detach:true,title:'detached'});assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(host.snapshot().phase,'suspended');assert.equal(output.textContent,'paused');
   await f.replace({detach:false,reattach:true});assert.ok(f.owner() === owner, "Retained native/provider identity must remain stable");assert.ok(f.hosts[0] === host, "Retained native/provider identity must remain stable");assert.ok(f.root.querySelector('output') === output, "Retained native/provider identity must remain stable");assert.equal(host.snapshot().phase,'active');assert.equal(output.textContent,'detached');
 }finally{await f.close();}
});

test('explicit Hydrate gates native events and provider imports until its CSR edge',async()=>{
 const f=await fixture({provider:true,initial:{hydrate:false}});try{const node=f.owner();assert.equal(f.loads,0);assert.equal(f.hosts.length,0);node.dispatchEvent(new f.dom.window.CustomEvent('click',{detail:{title:'ignored'}}));await new Promise(resolve=>setImmediate(resolve));assert.equal(f.runtime.snapshot().state.states.ui.title,'first');await f.replace({hydrate:true});assert.equal(f.loads,1);assert.equal(f.hosts.length,1);assert.equal(f.root.querySelector('output').textContent,'first');}finally{await f.close();}
});

test('captured Shadow controls remain the same through Detach and receive scoped Dispose cleanup once',async()=>{
 const counts={construct:0,hydrate:0,dispose:0,ensure:0};
 const text=source().replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button" attributes={{label:"Run"}}/><RMT.Element tag="h1">');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(tags){counts.ensure++;if(tags.includes('x-button')&&!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{constructor(){super();counts.construct++;this.attachShadow({mode:'open'}).innerHTML='<button><slot></slot></button>';}});},async hydrate(target,tags,metadata){assert.equal(target.localName,'x-button');assert.deepEqual(tags,['x-button']);assert.equal(metadata.ownerSurface,'owner');counts.hydrate++;return()=>{counts.dispose++;};}})});
 try{const control=f.owner().querySelector('x-button'),inner=control.shadowRoot.firstChild;assert.equal(counts.construct,1);assert.equal(counts.hydrate,1);
 await f.replace({detach:true});assert.equal(counts.dispose,0);await f.replace({detach:false,reattach:true});assert.ok(f.owner().querySelector('x-button') === control, "Retained native/provider identity must remain stable");assert.ok(control.shadowRoot.firstChild === inner, "Retained native/provider identity must remain stable");assert.equal(counts.construct,1);assert.equal(counts.hydrate,1);
 await f.replace({reattach:false,hydrate:false,dispose:true});assert.equal(counts.dispose,1);await f.replace({dispose:false,recycle:true,hydrate:true});assert.equal(counts.construct,2);assert.equal(counts.hydrate,2);
 }finally{await f.close();}assert.equal(counts.dispose,2);
});

const waitFor = async predicate => { for (let i=0;i<100;i++) { if (predicate()) return; await new Promise(resolve=>setTimeout(resolve,5)); } assert.fail('Expected authoritative lifecycle work did not complete'); };

test('provider Dispose finishes before native removal and explicit Recycle creates a fresh foreign root',async()=>{
 const f=await fixture({provider:true});try{
  const first=f.hosts[0],owner=f.owner(),output=f.root.querySelector('output'),generation=f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation;
  await f.replace({dispose:true});assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(first.snapshot().disposed,true);
  await f.replace({dispose:false,title:'terminal'});assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(f.hosts.length,1);
  await f.replace({recycle:true,hydrate:true});assert.equal(f.hosts.length,2);assert.ok(f.hosts[1]!==first,'Recycle creates a fresh provider controller');assert.ok(f.owner()!==owner,'Recycle replaces native content');assert.ok(f.root.querySelector('output')!==output,'Recycle replaces the foreign root');assert.equal(f.root.querySelector('output').textContent,'terminal');assert.equal(f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation,generation);
 }finally{await f.close();}
});

test('provider Invalidate refreshes authority and controlled props without replacing native or foreign nodes',async()=>{
 const f=await fixture({provider:true});try{
  const host=f.hosts[0],owner=f.owner(),output=f.root.querySelector('output'),boundary=f.runtime.getSurfaceBoundary('owner'),token=boundary.capture();
  await f.replace({invalidate:true,title:'fresh'});assert.equal(f.hosts.length,1);assert.ok(f.hosts[0]===host&&f.owner()===owner&&f.root.querySelector('output')===output,'Invalidate retains native and framework instances');assert.equal(boundary.isCurrent(token),false);assert.equal(output.textContent,'fresh');assert.equal(host.snapshot().phase,'active');
 }finally{await f.close();}
});

test('closed Controller keeps a rising command pending until an authoritative Open notification',async()=>{
 const f=await fixture();try{
  const owner=f.owner(),generation=f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation;
  f.graph.closeSurface('owner');await f.replace({detach:true});
  assert.ok(f.owner()===owner,'A command cannot detach content while its Controller is closed');
  assert.equal(f.runtime.snapshot().nativeLifecycle.operations.filter(row=>row.op==='detach').length,0);
  f.graph.openSurface('owner');await waitFor(()=>f.runtime.snapshot().nativeLifecycle.surfaces.find(row=>row.id==='owner')?.detached===true);
  assert.ok(f.owner() === null, 'Native content must be absent');assert.equal(f.runtime.snapshot().nativeLifecycle.operations.filter(row=>row.op==='detach').length,1);assert.equal(f.controller.readSnapshot().surfaces.find(row=>row.id==='owner').generation,generation);
 }finally{await f.close();}
});

test('scoped control hooks survive Model updates, pause for Detach and retire their own signal on cleanup',async()=>{
 const hooks=[];let disposed=0;
 const text=source().replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button"/><RMT.Element tag="h1">');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(_target,_tags,metadata){hooks.push(metadata);return()=>{disposed++;};}})});
 try{
  const first=hooks[0];assert.equal(first.isCurrent(),true);assert.equal(first.signal.aborted,false);
  await f.replace({title:'changed'});assert.equal(hooks.length,1);assert.equal(first.isCurrent(),true,'Model updates keep retained control hooks current');
  await f.replace({detach:true});assert.equal(first.isCurrent(),false);assert.equal(first.signal.aborted,false,'Detached hooks retain their lifetime but cannot act');
  await f.replace({detach:false,reattach:true});assert.equal(hooks.length,1);assert.equal(first.isCurrent(),true);
  await f.replace({reattach:false,invalidate:true});assert.equal(disposed,1);assert.equal(first.signal.aborted,true);assert.equal(first.isCurrent(),false);assert.equal(hooks.length,2);assert.equal(hooks[1].isCurrent(),true);
 }finally{await f.close();}assert.equal(disposed,2);assert(hooks.every(row=>row.signal.aborted&&!row.isCurrent()));
});

test('global disposal awaits native control cleanup before clearing its DOM and resolves the shared idle boundary',async()=>{
 let release,begin,completed=false;const gate=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{begin=resolve;});
 const text=source().replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button"/><RMT.Element tag="h1">');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(){return async()=>{begin();await gate;completed=true;};}})});
 try{
  f.runtime.dispose();await started;let idle=false;const drain=f.runtime.whenXTensionsIdle().then(()=>{idle=true;});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(idle,false);assert.ok(f.root.querySelector('x-button'),'Native control DOM must remain until its asynchronous disposer finishes');
  release();await drain;assert.equal(completed,true);assert.equal(f.root.childNodes.length,0);
 }finally{release();await f.close();}
});

for(const explicit of [true,false]) test(`${explicit?'explicit pending Hydrate':'implicit control initialization'} is independent of View reads when repeated native content enters`,async()=>{
 let constructed=0,hydrated=0;
 const text=source({enabled:false,hydrate:false})
  .replace('{RMT,model,input}','{RMT,model,item,input}')
  .replace('<RMT.State id="ui"','<RMT.State id="rows" type="collection" initial={[{id:1},{id:"1"}]}/><RMT.State id="ui"')
  .replace('<RMT.Surface id="owner"','<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="owner"')
  .replace('</RMT.Surface>\n<RMT.Surface id="sibling"','</RMT.Surface></RMT.Repeat>\n<RMT.Surface id="sibling"')
  .replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button"/><RMT.Element tag="h1">')
  .replace('<RMT.Text value={model.ui.title}/>','<RMT.Text value="Static"/>')
  .replace('<RMT.Hydrate target="owner" when={model.ui.hydrate}/>',explicit?'<RMT.Hydrate target="owner" when={model.ui.hydrate}/>':'');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{constructor(){super();constructed++;this.attachShadow({mode:'open'}).innerHTML='<button><slot></slot></button>';}});},async hydrate(){hydrated++;}})});
 try{
  assert.equal(f.root.querySelectorAll('section').length,0);assert.equal(constructed,0);assert.equal(hydrated,0);
  await f.replace({enabled:true,hydrate:true});assert.equal(f.root.querySelectorAll('section').length,2);assert.equal(constructed,2);assert.equal(hydrated,2);
  assert.equal(f.runtime.snapshot().nativeLifecycle.surfaces.filter(row=>row.id.startsWith('owner:rmtx:')&&row.hydrated).length,2);
 }finally{await f.close();}
});

for(const explicit of [true,false]) test(`new conditional controls inherit ${explicit?'explicit':'implicit'} CSR activation and retire independently`,async()=>{
 const hooks=[];let disposed=0;
 let text=source({show:false}).replace('<RMT.Element tag="h1">','<RMT.When test={model.ui.show}><RMT.Component tag="x-button"/></RMT.When><RMT.Element tag="h1">');
 if(!explicit)text=text.replace('<RMT.Hydrate target="owner" when={model.ui.hydrate}/>','');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(target,_tags,metadata){hooks.push({target,...metadata});return()=>{disposed++;};}})});
 try{
  const owner=f.owner();assert.equal(hooks.length,0);
  await f.replace({show:true});assert.equal(hooks.length,1);const first=hooks[0];assert.equal(first.isCurrent(),true);
  await f.replace({show:false});assert.equal(disposed,1);assert.equal(first.signal.aborted,true);assert.equal(first.isCurrent(),false);assert.ok(f.owner()===owner,'Control retirement retains its owning native Surface');
  await f.replace({show:true});assert.equal(hooks.length,2);assert.ok(hooks[1].target!==first.target,'A returning conditional control receives a fresh target lifetime');assert.equal(hooks[1].isCurrent(),true);
 }finally{await f.close();}assert.equal(disposed,2);
});

test('native control repeats retain reordered target hooks and retire only removed typed targets',async()=>{
 const hooks=[];let disposed=0;
 const text=source().replace('{RMT,model,input}','{RMT,model,item,input}')
  .replace('<RMT.State id="ui"','<RMT.State id="controls" type="object" initial={{items:[{id:1,label:"Numeric"},{id:"1",label:"Text"}]}}/><RMT.State id="ui"')
  .replace('<RMT.Action id="replace">','<RMT.Action id="controls.replace"><RMT.Input name="rows" type="object"/><RMT.Reduce state="controls" value={input.rows}/></RMT.Action><RMT.Action id="replace">')
  .replace('<RMT.Element tag="h1">','<RMT.Repeat from={model.controls.items} keyBy={item.id}><RMT.Component tag="x-button" attributes={{label:item.label}}/></RMT.Repeat><RMT.Element tag="h1">');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(target,_tags,metadata){hooks.push({target,...metadata});return()=>{disposed++;};}})});
 try{
  const values=structuredClone(f.runtime.snapshot().state.states.controls.items),initial=[...f.root.querySelectorAll('x-button')];assert.equal(hooks.length,2);
  await f.runtime.dispatchCommand('controls.replace',{rows:{items:[...values].reverse()}});assert.equal(hooks.length,2);assert.ok(f.root.querySelectorAll('x-button')[0]===initial[1],'Reordered controls retain exact target identities');
  await f.runtime.dispatchCommand('controls.replace',{rows:{items:values.filter(row=>typeof row.id==='string')}});assert.equal(disposed,1);assert.equal(hooks[0].signal.aborted,true);assert.equal(hooks[1].isCurrent(),true);
  await f.runtime.dispatchCommand('controls.replace',{rows:{items:values}});assert.equal(hooks.length,3);assert.equal(hooks[2].isCurrent(),true);assert.ok(hooks[2].target!==initial[0],'Reintroduced typed key creates a fresh control hook');
 }finally{await f.close();}assert.equal(disposed,3);
});

test('destroyed repeat tombstones do not suppress later Model commands or typed provider reentry after Recycle',async()=>{
 const text=source().replace('{RMT,model,input}','{RMT,model,item,input}')
  .replace('<RMT.State id="ui"','<RMT.State id="rows" type="object" initial={{items:[{id:1},{id:"1"}]}}/><RMT.State id="ui"')
  .replace('<RMT.Action id="replace">','<RMT.Action id="rows.replace"><RMT.Input name="rows" type="object"/><RMT.Reduce state="rows" value={input.rows}/></RMT.Action><RMT.Action id="replace">')
  .replace('<RMT.Surface id="owner"','<RMT.Repeat from={model.rows.items} keyBy={item.id}><RMT.Surface id="owner"')
  .replace('</RMT.Surface>\n<RMT.Surface id="sibling"','</RMT.Surface></RMT.Repeat>\n<RMT.Surface id="sibling"');
 const f=await fixture({text,provider:true});try{
  const original=structuredClone(f.runtime.snapshot().state.states.rows),ownerId=nativeViewRuntimePort.resolveSurfaceInstance(f.plan.orchestration.artifact,'owner',[1]);
  assert.equal(f.hosts.length,2);await f.replace({dispose:true});assert.equal(f.root.querySelectorAll('output').length,0);
  await f.replace({dispose:false,recycle:true});assert.equal(f.hosts.length,4);await f.replace({recycle:false});
  const leaving=f.hosts.findLast(host=>host.snapshot().resourceGraph.surfaceId===ownerId),stale=f.runtime.getSurfaceBoundary(ownerId).capture();
  await f.runtime.dispatchCommand('rows.replace',{rows:{items:original.items.filter(row=>typeof row.id==='string')}});
  assert.equal(f.root.querySelectorAll('section').length,1);assert.equal(leaving.snapshot().disposed,true);
  assert.equal(f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(row=>row.id===ownerId).status,'destroyed');
  const result=await f.runtime.dispatchCommand('rows.replace',{rows:original});assert.notEqual(result?.status,'superseded','Already-destroyed tombstones must not invalidate a newly captured command lease');
  assert.deepEqual(f.runtime.snapshot().state.states.rows.items.map(row=>row.id),[1,'1']);assert.equal(f.root.querySelectorAll('section').length,2);assert.equal(f.root.querySelectorAll('output').length,2);assert.equal(f.hosts.length,5);
  assert.equal(f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(row=>row.id===ownerId).generation,2);assert.equal(f.runtime.getSurfaceBoundary(ownerId).isCurrent(stale),false);
 }finally{await f.close();}
});

test('asynchronous definition completes before a mounted public control receives a prototype property setter',async()=>{
 const order=[];let writes=0,hydrated=0;
 const text=source({hydrate:false}).replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button" properties={{title:model.ui.title}}/><RMT.Element tag="h1">');
 const f=await fixture({text,componentRegistry:dom=>({resolveComponentCapability(tag){return tag==='x-button'?{properties:['title']}:null;},async ensureTags(tags){if(!tags.includes('x-button')||dom.window.customElements.get('x-button'))return;order.push('ensure');await new Promise(resolve=>setImmediate(resolve));dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{constructor(){super();order.push('construct');this.attachShadow({mode:'open'}).innerHTML='<button><slot></slot></button>';}set title(value){writes++;order.push('set:'+value);this._receivedTitle=value;}get title(){return this._receivedTitle||'';}});order.push('defined');},async hydrate(){hydrated++;}})});
 try{
  const control=f.owner().querySelector('x-button');assert.deepEqual(order,['ensure','defined','construct','set:first']);assert.equal(writes,1);assert.equal(control.title,'first');assert.equal(Object.hasOwn(control,'title'),false,'Property assignment must reach the defined prototype setter rather than shadow a later upgrade');assert.equal(hydrated,0);
  await f.replace({title:'second',hydrate:true});assert.ok(f.owner().querySelector('x-button')===control,'CSR activation retains the same already-defined control');assert.equal(control.title,'second');assert.equal(writes,2);assert.equal(hydrated,1);
 }finally{await f.close();}
});

test('the default Source7 renderer derives exact property capabilities from captured metadata',async()=>{
 let writes=0,hydrated=0;
 const text=source().replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button" properties={{title:model.ui.title}}/><RMT.Element tag="h1">');
 const f=await fixture({text,defaultRenderer:true,componentRegistry:dom=>({resolveComponentCapability(){assert.fail('Caller capabilities cannot replace the captured Source7 property whitelist');},async ensureTags(tags){if(tags.includes('x-button')&&!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{set title(value){writes++;this._receivedTitle=value;}get title(){return this._receivedTitle||'';}});},async hydrate(){hydrated++;}})});
 try{
  const control=f.owner().querySelector('x-button');assert.equal(control.title,'first');assert.equal(writes,1);assert.equal(hydrated,1);assert.equal(Object.hasOwn(control,'title'),false);
  await f.replace({title:'second'});assert.ok(f.owner().querySelector('x-button')===control,'Default property projection retains the same control');assert.equal(control.title,'second');assert.equal(writes,2);
 }finally{await f.close();}
});

test('Detach retains a logically owned provider portal outside its native owning subtree',async()=>{
 const f=await fixture({provider:true,providerPortal:true});try{
  const owner=f.owner(),container=f.root.querySelector('[data-maraca-surface="host"]'),output=container.querySelector('output'),host=f.hosts[0];
  assert.ok(!owner.contains(container)&&f.root.contains(container),'The provider portal must physically live outside its logical native Owner');
  await f.replace({detach:true,title:'parked'});assert.ok(f.owner()===null,'Detach parks the native owner');assert.equal(container.isConnected,false);assert.equal(host.snapshot().phase,'suspended');
  await f.replace({detach:false,reattach:true});assert.ok(f.owner()===owner&&f.root.querySelector('[data-maraca-surface="host"]')===container,'Reattach must restore the same owner and portal container');assert.ok(container.querySelector('output')===output,'The retained provider root must survive portal parking');assert.ok(f.hosts[0]===host&&f.hosts.length===1,'Portal parking cannot recreate its provider');assert.equal(output.textContent,'parked');assert.equal(host.snapshot().phase,'active');
 }finally{await f.close();}
});

test('nested native control hooks remain paused rather than disposed inside a detached parent',async()=>{
 const hooks=[];let disposed=0;
 const text=source().replace('</RMT.View></RMT.Surface>','</RMT.View><RMT.Surface id="child"><RMT.View><RMT.Component tag="x-button"/></RMT.View></RMT.Surface></RMT.Surface>');
 const f=await fixture({text,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(target,_tags,metadata){hooks.push({target,...metadata});return()=>{disposed++;};}})});
 try{
  const owner=f.owner(),child=f.root.querySelector('[data-maraca-surface="child"]'),control=child.querySelector('x-button');assert.equal(hooks.length,1);
  await f.replace({detach:true});assert.equal(disposed,0);assert.equal(hooks[0].signal.aborted,false);assert.equal(hooks[0].isCurrent(),false);
  await f.replace({detach:false,reattach:true});assert.ok(f.owner()===owner&&owner.querySelector('[data-maraca-surface="child"]')===child&&child.querySelector('x-button')===control,'Parent parking retains its native descendants');assert.equal(hooks.length,1);assert.equal(hooks[0].isCurrent(),true);
 }finally{await f.close();}assert.equal(disposed,1);
});

test('reattaching a parent preserves an independently detached child until its own Reattach',async()=>{
 const text=source({childDetach:false,childReattach:false}).replace('</RMT.View></RMT.Surface>','</RMT.View><RMT.Surface id="child"><RMT.View><RMT.Text value="Child"/></RMT.View><RMT.Lane name="visible"><RMT.Detach target="child" when={model.ui.childDetach}/><RMT.Reattach target="child" when={model.ui.childReattach}/></RMT.Lane></RMT.Surface></RMT.Surface>');
 const f=await fixture({text});try{
  const owner=f.owner(),child=f.root.querySelector('[data-maraca-surface="child"]');await f.replace({childDetach:true});assert.ok(!f.root.contains(child),'Child has its own parked root');
  await f.replace({childDetach:false,detach:true});await f.replace({detach:false,reattach:true});assert.ok(f.owner()===owner&&!owner.contains(child),'Parent Reattach cannot consume the child parking lease');
  await f.replace({reattach:false,childReattach:true});assert.ok(owner.querySelector('[data-maraca-surface="child"]')===child,'Only the child Reattach restores its original node');
 }finally{await f.close();}
});

for(const mode of ['dispose','external-destroy'])test(`${mode} retires provider portals and control hooks while their parent is detached`,async()=>{
 const hooks=[];let disposed=0;
 const text=source().replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button"/><RMT.Element tag="h1">');
 const f=await fixture({text,provider:true,providerPortal:true,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(target,_tags,metadata){hooks.push({target,...metadata});return()=>{disposed++;};}})});
 try{
  const owner=f.owner(),portal=f.root.querySelector('[data-maraca-surface="host"]'),host=f.hosts[0];await f.replace({detach:true});assert.equal(disposed,0);
  if(mode==='dispose')await f.replace({detach:false,dispose:true});else{f.graph.destroySurface('owner');try{await waitFor(()=>disposed===1&&owner.parentNode===null&&portal.parentNode===null);}catch(error){throw new Error(JSON.stringify({message:error.message,disposed,ownerParked:!!owner.parentNode,portalParked:!!portal.parentNode,host:host.snapshot().phase,phase:f.runtime.snapshot().phase,diagnostics:f.runtime.snapshot().diagnostics.slice(-4),controller:f.controller.readSnapshot({includeDestroyed:true}).surfaces.map(row=>({id:row.id,status:row.status}))}));}await f.runtime.whenXTensionsIdle();}
  assert.equal(host.snapshot().disposed,true);assert.equal(disposed,1);assert.equal(hooks[0].signal.aborted,true);assert.equal(hooks[0].isCurrent(),false);assert.ok(owner.parentNode===null&&portal.parentNode===null,'Every associated parked root is released');
  if(mode==='dispose'){
   await f.replace({dispose:false,reattach:true});assert.equal(f.root.querySelectorAll('section').length,0);await f.replace({reattach:false,recycle:true});assert.equal(f.hosts.length,2);assert.ok(f.owner()!==owner&&f.root.querySelector('[data-maraca-surface="host"]')!==portal,'Recycle creates fresh roots after parked content disposal');
  }else {
   const sibling=f.root.querySelector('aside'),boundary=f.runtime.getSurfaceBoundary('sibling'),fresh=boundary.capture(),result=await f.replace({title:'active sibling'});
   assert.notEqual(result?.status,'superseded','Disposed logical children cannot suppress a freshly captured sibling command');assert.equal(f.runtime.snapshot().state.states.ui.title,'active sibling');assert.ok(f.root.querySelector('aside')===sibling&&boundary.isCurrent(fresh),'The active sibling keeps its live content lease');assert.equal(f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(row=>row.id==='owner').status,'destroyed');
  }
 }finally{await f.close();}
});

test('leaving repeat membership clears every parked portal of only the removed logical owner',async()=>{
 const hooks=[];let disposed=0;
 const text=source().replace('{RMT,model,input}','{RMT,model,item,input}')
  .replace('<RMT.State id="ui"','<RMT.State id="rows" type="object" initial={{items:[{id:1},{id:"1"}]}}/><RMT.State id="ui"')
  .replace('<RMT.Action id="replace">','<RMT.Action id="rows.replace"><RMT.Input name="rows" type="object"/><RMT.Reduce state="rows" value={input.rows}/></RMT.Action><RMT.Action id="replace">')
  .replace('<RMT.Surface id="owner"','<RMT.Repeat from={model.rows.items} keyBy={item.id}><RMT.Surface id="owner"')
  .replace('</RMT.Surface>\n<RMT.Surface id="sibling"','</RMT.Surface></RMT.Repeat>\n<RMT.Surface id="sibling"')
  .replace('<RMT.Element tag="h1">','<RMT.Component tag="x-button"/><RMT.Element tag="h1">');
 const f=await fixture({text,provider:true,providerPortal:true,componentRegistry:dom=>({async ensureTags(){if(!dom.window.customElements.get('x-button'))dom.window.customElements.define('x-button',class extends dom.window.HTMLElement{});},async hydrate(target,_tags,metadata){hooks.push({target,...metadata});return()=>{disposed++;};}})});
 try{
  const original=structuredClone(f.runtime.snapshot().state.states.rows),scope=(name,key)=>nativeViewRuntimePort.resolveSurfaceInstance(f.plan.orchestration.artifact,name,[key]);
  const byId=id=>[...f.root.querySelectorAll('[data-maraca-surface]')].find(node=>node.getAttribute('data-maraca-surface')===id);
  const numericOwner=byId(scope('owner',1)),numericPortal=byId(scope('host',1)),textOwner=byId(scope('owner','1')),textPortal=byId(scope('host','1'));
  const leaving=f.hosts.find(host=>host.snapshot().resourceGraph.surfaceId===scope('owner',1)),numericHook=hooks.find(row=>row.ownerSurface===scope('owner',1)),textHook=hooks.find(row=>row.ownerSurface===scope('owner','1'));
  await f.replace({detach:true});assert.equal(disposed,0);
  await f.runtime.dispatchCommand('rows.replace',{rows:{items:original.items.filter(row=>typeof row.id==='string')}});
  assert.equal(leaving.snapshot().disposed,true);assert.equal(disposed,1);assert.ok(numericOwner.parentNode===null&&numericPortal.parentNode===null,'Removed membership clears both parked native and portal roots');assert.equal(numericHook.signal.aborted,true);assert.equal(textHook.signal.aborted,false);
  await f.replace({detach:false,reattach:true});assert.ok(byId(scope('owner','1'))===textOwner&&byId(scope('host','1'))===textPortal,'The independent surviving typed owner restores its own original roots');assert.equal(textHook.isCurrent(),true);assert.equal(f.root.querySelectorAll('output').length,1);
  await f.runtime.dispatchCommand('rows.replace',{rows:original});assert.equal(f.root.querySelectorAll('output').length,2);assert.equal(f.hosts.length,3);assert.ok(byId(scope('owner',1))!==numericOwner&&byId(scope('host',1))!==numericPortal,'Returning membership creates fresh roots without reviving disposed parks');
 }finally{await f.close();}
});
