import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createMaracaNativeManagedRuntime} from '../../xtend-maraca/native-managed-runtime.mjs';
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
const require=createRequire(import.meta.url),{JSDOM,VirtualConsole}=require('jsdom');
const {createMaracaBuildPlan}=require('../../xtend-maraca');
const {createXtendFabric}=require('../../fabric/xtend-fabric');
const nativePort=require('../../tools/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME;
const {resolveManagedComponent}=require('../../tools/xtensions/native-component-managed');
const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM('<!doctype html><html><body><aside id="foreign-root">untouched</aside></body></html>',{pretendToBeVisual:true,url:'http://localhost/',virtualConsole});
for(const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','KeyboardEvent','customElements','MutationObserver','DOMParser','ShadowRoot','AbortController','AbortSignal'])globalThis[name]=dom.window[name];
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
window.ResizeObserver=globalThis.ResizeObserver;window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
const {managedPlatformBinding}=await import('../../components/native-platform.js');
const tags=['x-surface-region','x-surface-window','x-side-panel','x-surface-manager','x-surface-portal','x-router'];
const files=['xsurfaceregion','xsurfacewindow','xsidepanel','xsurfacemanager','xsurfaceportal','xrouter'];
const modules=new Map(await Promise.all(tags.map(async(tag,index)=>[tag,await import(`../../components/${files[index]}.definition.js`)])));
const rootDir=new URL('../../',import.meta.url).pathname;
let sequence=0;
function define(tag){const module=modules.get(tag);for(const [name,constructor]of module.nativeDependencies||[])if(!customElements.get(name))customElements.define(name,constructor);const constructor=module.default;assert.equal(typeof constructor,'function',tag+' exports its pure constructor');if(!customElements.get(tag))customElements.define(tag,constructor);else assert.ok(customElements.get(tag)===constructor,'shared Classic/managed constructor');}
function sourceFor(tag,options={}){
 const kind=options.kind||(tag==='x-surface-window'?'window':tag==='x-side-panel'?'side-panel':'region');
 const attributes=options.attributesExpression?` attributes={${options.attributesExpression}}`:options.attributes===undefined?'':` attributes={${JSON.stringify(options.attributes)}}`;
 const properties=options.properties===undefined?'':` properties={${JSON.stringify(options.properties)}}`;
 const portal=tag==='x-surface-portal'?`<RMT.Portal id="ownedPortal" root="#${options.rootId}" layer="surface"/>`:'';
 const effect=options.command?`<RMT.Action id="run"><RMT.Effect kind="component-command" target="owner.platform" command=${JSON.stringify(options.command)} args={${JSON.stringify(options.args||{})}}/></RMT.Action>`:'';
 const on=tag==='x-router'?'<RMT.On event="route-changed" action="routeChanged" payload={{path:"detail.path"}}/>':'';
 const lifecycle=options.lifecycle?'<RMT.Suspend target="owner" when={model.ui.suspended}/><RMT.Resume target="owner" when={model.ui.resume}/>' : '';
 return `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';
 export default <RMT.Program id="native.platform"><RMT.State id="ui" type="object" initial={{path:'',enabled:false,suspended:false,resume:false}}/><RMT.Action id="routeChanged"><RMT.Input name="path" type="string"/><RMT.Reduce state="ui" path="path" value={input.path}/></RMT.Action><RMT.Action id="setFlag"><RMT.Input name="value" type="boolean"/><RMT.Reduce state="ui" path="enabled" value={input.value}/></RMT.Action><RMT.Action id="replaceUi"><RMT.Input name="ui" type="object"/><RMT.Reduce state="ui" value={input.ui}/></RMT.Action>${portal}${effect}<RMT.Surface id="owner" kind=${JSON.stringify(kind)} component="section"${tag==='x-surface-portal'?' portal="ownedPortal"':''}><RMT.Lane name="visible"><RMT.Mount target="owner"/>${lifecycle}</RMT.Lane><RMT.View><RMT.Component tag=${JSON.stringify(tag)} ref="platform"${attributes}${properties}>${on}</RMT.Component></RMT.View></RMT.Surface></RMT.Program>`;
}
function historyHost(){const host=new dom.window.EventTarget();host.currentPath='/';host.calls=[];host.canNavigate=href=>href==='/next'||href==='/';host.snapshot=()=>({currentPath:host.currentPath});host.navigate=async(href,options)=>{host.calls.push({href,options});window.history[options.replace?'replaceState':'pushState'](options.state||null,'',href);host.currentPath=window.location.pathname;host.dispatchEvent(new dom.window.Event('route-changed'));return{path:host.currentPath};};return host;}
async function fixture(tag,options={}){
 const id=++sequence,root=document.createElement('main');root.id='native-platform-root-'+id;document.body.append(root);
 const text=sourceFor(tag,{...options,rootId:root.id});
 const plan=createMaracaBuildPlan({filePath:'tests/maraca/native-platform.rmtx',sourceText:text,rmtxSyntaxVersion:'8.0.0',orchestration:'strict',kernel:'strict',hydration:'off',validation:'off',transitions:'off',services:false,pwa:false},{rootDir,inspectToolchain:false});
 if(!plan.ok&&options.expectedFailure){root.remove();return{error:new Error(JSON.stringify(plan.diagnostics)),root,plan};}
 assert.equal(plan.ok,true,JSON.stringify(plan.diagnostics));
 const scheduler=createRmtKernelScheduler({preferPostTask:false}),controller=surfaceController.createSurfaceController({managerId:'native-platform-controller-'+id}),fabric=createXtendFabric();
 const foreign=controller.registerSurface({id:'foreign',type:'region',label:'Foreign',manager:controller.managerId});assert.equal(foreign.ok,true);
 const routerHost=options.routerHost||(tag==='x-router'?historyHost():undefined);
 const componentRegistry={async ensureTags(list){for(const name of list)define(name);},async hydrate(_root,list,metadata){await this.ensureTags(list);for(const target of metadata.targets||[])assert.ok(resolveManagedComponent(target));return null;}};
 const runtime=createMaracaNativeManagedRuntime({plan,root,fabric,scheduler,nativeViewRuntimePort:nativePort,componentRegistry,surfaceController:controller,routerHost,windowTarget:window,
  viewProjectionPort:viewProjection.createRmtMaracaViewProjectionAdapter({root,documentTarget:document}),moduleApis:{state,action,app,renderer,viewProjection,presentation,events,surfaces,surfaceController,kernelRuntime,kernel}});
 let closed=false;
 async function close(){if(closed)return;closed=true;await runtime.dispose();await runtime.whenXTensionsIdle();assert.ok(controller.readSnapshot({includeDestroyed:true}).surfaces.some(row=>row.id==='foreign'),'borrowed Controller and foreign record survive app cleanup');assert.equal(controller.registerSurface({id:'after-app-dispose',type:'region',manager:controller.managerId}).ok,true,'borrowed Controller remains usable');controller.dispose();scheduler.dispose();fabric.dispose();root.remove();}
 try{await runtime.boot();}catch(error){await close();if(options.expectedFailure)return{error,root,plan,controller};throw error;}
 if(options.expectedFailure){await close();assert.fail('forged native platform config was admitted');}
 const element=root.querySelector(tag);assert.ok(element,tag+' actual element mounted');const context=resolveManagedComponent(element);assert.ok(context?.isActive(),tag+' has actual admitted Controller scope');
 return{tag,plan,root,runtime,controller,fabric,scheduler,element,context,routerHost,close};
}
function record(f){return f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(row=>row.id==='owner');}
async function assertScheduled(f,command){await new Promise(resolve=>setTimeout(resolve,0));const definition=f.plan.orchestration.artifact.render.nativeView.bindings.find(row=>row.ref==='platform'),operation=nativePort.resolveNativePlatformOperation(f.plan.orchestration.artifact,definition.declarationId,command);assert.ok(f.runtime.snapshot().kernel.fibers.some(row=>row.fiber===operation.fiberId),'actual Kernel fiber '+operation.fiberId);assert.ok(f.fabric.getFibers().some(row=>row.id===operation.fiberId&&row.status==='completed'&&typeof row.metadata?.schedulerJobId==='string'),'same declared operation delegated to Fabric');assert.equal(f.runtime.snapshot().kernel.fallbackCount,0);}
test('all six platform tags bind to actual Controller/Graph and command fibers rather than local managers',async()=>{
 for(const tag of tags){const options=tag==='x-router'?{properties:{routes:[{path:'/'},{path:'/next'}]}}:{};const f=await fixture(tag,options);try{const binding=managedPlatformBinding(f.element);assert.ok(binding.controller===f.controller,'existing borrowed Controller');assert.equal(f.controller.readSnapshot({includeDestroyed:true}).surfaces.filter(row=>row.id==='owner').length,1);const command=tag==='x-surface-manager'?'snapshot':tag==='x-surface-portal'?'update':tag==='x-router'?'canNavigate':'focus';const result=await binding.command(command,tag==='x-router'?{href:'/next'}:{});if(tag==='x-surface-manager')assert.deepEqual(result.surfaces.map(row=>row.id),['owner']);if(tag==='x-router')assert.equal(result,true);if(['snapshot','canNavigate'].includes(command)){const declaration=f.plan.orchestration.artifact.render.nativeView.bindings.find(row=>row.ref==='platform');assert.ok(nativePort.resolveNativePlatformOperation(f.plan.orchestration.artifact,declaration.declarationId,command).fiberId);assert.equal(f.runtime.snapshot().kernel.fallbackCount,0);}else await assertScheduled(f,command);assert.ok(f.element.parentNode,'managed platform host is retained');}finally{await f.close();}}
});
test('real platform UI flags project false to true to false without changing Controller authority',async()=>{
 const windowFixture=await fixture('x-surface-window',{attributesExpression:'{draggable:model.ui.enabled,resizable:model.ui.enabled}'});
 try{const f=windowFixture,start=record(f).bounds.x;f.element._titlebar.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,20));assert.equal(record(f).bounds.x,start);assert.equal(f.element.hasAttribute('draggable'),false);await f.runtime.dispatchCommand('setFlag',{value:true});assert.equal(f.element.hasAttribute('draggable'),true);f.element._titlebar.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,20));const moved=record(f).bounds.x;assert.ok(moved>start,'enabled keyboard drag must call the real Graph move operation');await assertScheduled(f,'move');await f.runtime.dispatchCommand('setFlag',{value:false});assert.equal(f.element.hasAttribute('resizable'),false);f.element._titlebar.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,20));assert.equal(record(f).bounds.x,moved);}finally{await windowFixture.close();}
 const panel=await fixture('x-side-panel',{attributesExpression:'{closable:model.ui.enabled,collapsible:model.ui.enabled,pinnable:model.ui.enabled,resizable:model.ui.enabled}'});
 try{assert.equal(panel.element._closeButton.hidden,true);assert.equal(panel.element._pinButton.hidden,true);await panel.runtime.dispatchCommand('setFlag',{value:true});assert.equal(panel.element._closeButton.hidden,false);assert.equal(panel.element._pinButton.hidden,false);await panel.runtime.dispatchCommand('setFlag',{value:false});assert.equal(panel.element._closeButton.hidden,true);assert.equal(panel.element._pinButton.hidden,true);assert.ok(record(panel).capabilities.includes('close'),'UI restrictions must not rewrite Controller capabilities');}finally{await panel.close();}
});
test('all six released platform bindings stay revoked after Suspend and a fresh activation',async()=>{
 for(const tag of tags){const f=await fixture(tag,{lifecycle:true,...(tag==='x-router'?{properties:{routes:[{path:'/'},{path:'/next'}]}}:{})});try{
  const held=managedPlatformBinding(f.element),activitySignal=f.context.activitySignal;
  const command=tag==='x-surface-manager'?'snapshot':tag==='x-surface-portal'?'update':tag==='x-router'?'canNavigate':'focus';
  const args=tag==='x-router'?{href:'/next'}:{};
  await f.runtime.dispatchCommand('replaceUi',{ui:{path:'',enabled:false,suspended:true,resume:false}});
  assert.equal(f.context.isAlive(),true);assert.equal(f.context.isActive(),false);assert.equal(activitySignal.aborted,true);
  await assert.rejects(async()=>held.command(command,args),/released|abort|inactive|stale|disposed/);
  await f.runtime.dispatchCommand('replaceUi',{ui:{path:'',enabled:false,suspended:false,resume:true}});
  assert.ok(f.root.querySelector(tag)===f.element,'Resume retains the exact prepared host');
  assert.ok(resolveManagedComponent(f.element)===f.context,'Resume retains lifetime ownership');
  assert.equal(f.context.isActive(),true);
  const fresh=managedPlatformBinding(f.element);assert.ok(fresh!==held,'new activity requires a new private binding');
  await assert.rejects(async()=>held.command(command,args),/released|abort|inactive|stale|disposed/);
  await fresh.command(command,args);
 }finally{await f.close();}}
});
test('Surface platform gestures commit bounds and state through the real graph and preserve foreign records',async()=>{
 for(const tag of ['x-surface-region','x-surface-window','x-side-panel']){const f=await fixture(tag);try{const binding=managedPlatformBinding(f.element);await binding.command('update',{label:'Controlled label'});assert.equal(record(f).label,'Controlled label');if(f.element._title)assert.equal(f.element._title.textContent,'Controlled label');else assert.equal(f.element._region.getAttribute('aria-label'),'Controlled label');await assertScheduled(f,'update');if(tag!=='x-surface-region'){await binding.command('resize',{width:420,height:260});assert.equal(record(f).bounds.width,420);await assertScheduled(f,'resize');}if(tag==='x-surface-window'){await binding.command('move',{x:30,y:40});assert.equal(record(f).bounds.x,30);assert.equal(record(f).bounds.y,40);await assertScheduled(f,'move');}assert.equal(f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(row=>row.id==='foreign').label,'Foreign');await assert.rejects(binding.command('update',{capabilities:['destroy']}),/unsupported|declaration|field/);f.controller.updateSurface('owner',{disabledCapabilities:['update']});await assert.rejects(binding.command('update',{label:'Denied'}),/capabilit|support|refus/);assert.equal(record(f).label,'Controlled label');}finally{await f.close();}}
});
test('a genuine component-command Effect invokes the actual scoped platform handler inside its exact Kernel job',async()=>{
 const f=await fixture('x-surface-region',{command:'update',args:{label:'Effect update'}});try{await f.runtime.dispatchCommand('run',{});assert.equal(record(f).label,'Effect update');await new Promise(resolve=>setTimeout(resolve,0));const effect=f.plan.orchestration.artifact.render.nativeView.commands[0];const fiber=f.plan.kernel.artifact.scheduler.fibers.find(row=>row.operation===effect.id);assert.ok(fiber);assert.ok(f.fabric.getFibers().some(row=>row.id===fiber.id&&row.status==='completed'),'genuine compiled Effect reaches Fabric');assert.equal(f.runtime.snapshot().kernel.fallbackCount,0);}finally{await f.close();}
});
test('close, minimize and collapse return only genuine Controller receipts after their own scope deactivation',async()=>{
 for(const [tag,command]of [['x-surface-region','close'],['x-surface-window','minimize'],['x-side-panel','collapse']]){const f=await fixture(tag,{command});try{await f.runtime.dispatchCommand('run',{});assert.equal(f.context.isAlive(),true);assert.equal(f.context.isActive(),false);if(command==='close')assert.equal(record(f).status,'closed');if(command==='minimize')assert.equal(record(f).minimized,true);if(command==='collapse')assert.equal(record(f).collapsed,true);assert.equal(f.runtime.snapshot().kernel.fallbackCount,0);}finally{await f.close();}}
});
test('native Router delegates the captured local destination to the injected History host and publishes its Model intent',async()=>{
 const f=await fixture('x-router',{properties:{routes:[{path:'/'},{path:'/next',title:'Next'}]}});try{const binding=managedPlatformBinding(f.element);assert.equal(await binding.command('canNavigate',{href:'https://elsewhere.invalid/next'}),false);await assert.rejects(binding.command('navigate',{href:'/forbidden'}),/outside/);assert.equal(f.routerHost.calls.length,0);await binding.command('navigate',{href:'/next',replace:true,state:{selected:1}});await new Promise(resolve=>setTimeout(resolve,20));assert.equal(f.routerHost.calls.length,1);assert.equal(window.location.pathname,'/next');assert.equal(f.element.currentPath,'/next');assert.equal(f.runtime.snapshot().state.states.ui.path,'/next');assert.equal(f.runtime.snapshot().actions.filter(row=>row.id==='routeChanged').length,1,'one host navigation must produce exactly one validated Model Action');await assertScheduled(f,'navigate');}finally{await f.close();window.history.replaceState(null,'','/');}
});
test('Portal projection retains the exact declared existing Portal and rejects policy replacement',async()=>{
 const f=await fixture('x-surface-portal');try{const binding=managedPlatformBinding(f.element),policy=binding.policySnapshot();assert.equal(policy.id,'ownedPortal');assert.equal(f.element.getAttribute('portal-id'),'ownedPortal');assert.equal(f.element.getAttribute('for'),'#'+f.root.id);await binding.command('update',{});await assertScheduled(f,'update');await assert.rejects(binding.command('update',{target:'#foreign-root'}),/existing compiled/);assert.equal(document.querySelector('#foreign-root').textContent,'untouched');}finally{await f.close();}
});
test('forged authority-valued platform attributes and route data fail before managed host mutation',async()=>{
 for(const [tag,attributes]of [['x-surface-region',{'surface-id':'foreign'}],['x-surface-manager',{'manager-id':'foreign-manager'}],['x-surface-portal',{'portal-id':'foreign-portal'}],['x-surface-portal',{'for':'#foreign-root'}]]){const f=await fixture(tag,{attributes,expectedFailure:true});assert.match(f.error.message,/owning|Controller|compiled|Portal|surface-id|manager-id/);assert.ok(f.root.querySelector(tag)===null,'No forged host committed');}
 for(const routes of [[{path:'//elsewhere.invalid'}],[{path:'/a'},{path:'/a'}],[{path:'/safe',module:'evil.js'}]]){const f=await fixture('x-router',{properties:{routes},expectedFailure:true});assert.match(f.error.message,/route|Route|field|unsupported/);}
 assert.equal(document.querySelector('#foreign-root').textContent,'untouched');
});
test.after(()=>{assert.deepEqual(errors,[],'CustomElement reaction errors must not be swallowed as acceptance');dom.window.close();});
