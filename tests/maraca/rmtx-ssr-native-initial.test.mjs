import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createMaracaRmtxSSRNativeOrchestrationRuntime} from '../../xtend-maraca/native-orchestration-ssr-runtime.mjs';
import {createMaracaRmtxSSRNativeManagedRuntime} from '../../xtend-maraca/native-managed-ssr-runtime.mjs';
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
const {createMaracaBuildPlan}=require('../../xtend-maraca'),{createXtendFabric}=require('../../fabric/xtend-fabric');
const {createRMTXSSRBindingAdmissionRuntime}=require('../../tools/xtensions/state-binding-resume-admission');
const rootDir=new URL('../../',import.meta.url).pathname;
const defaults={mount:true,hydrate:true,suspend:false,resume:false,detach:false,reattach:false,dispose:false,recycle:false,invalidate:false,prewarm:false};
function planFor(version,patch) {
  const initial={...defaults,...patch},operators=['Mount','Hydrate','Suspend','Resume','Detach','Reattach','Dispose','Recycle','Invalidate','Prewarm'];
  const source=`import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="ssr-initial-${version}"><RMT.State id="ui" type="object" initial={${JSON.stringify(initial)}}/><RMT.Action id="replace"><RMT.Input name="ui" type="object"/><RMT.Reduce state="ui" value={input.ui}/></RMT.Action><RMT.Surface id="owner" component="section"><RMT.Lane name="visible">${operators.map(op=>`<RMT.${op} target="owner" when={model.ui.${op.toLowerCase()}}/>`).join('')}</RMT.Lane><RMT.View><RMT.Element tag="h1"><RMT.Text value="retained"/></RMT.Element></RMT.View></RMT.Surface><RMT.Surface id="sibling" component="aside"><RMT.View><RMT.Text value="sibling"/></RMT.View></RMT.Surface></RMT.Program>`;
  const plan=createMaracaBuildPlan({filePath:'tests/maraca/ssr-initial.rmtx',sourceText:source,rmtxSyntaxVersion:`${version}.0.0`,orchestration:'strict',kernel:'strict',hydration:'off',validation:'off',transitions:'off',services:false,pwa:false},{rootDir,inspectToolchain:false});
  assert.equal(plan.ok,true,JSON.stringify(plan.diagnostics));return plan;
}
async function fixture(plan,mode,html='') {
  const dom=new JSDOM('<main>'+html+'</main>',{pretendToBeVisual:true}),root=dom.window.document.querySelector('main');
  const scheduler=createRmtKernelScheduler({preferPostTask:false}),controller=surfaceController.createSurfaceController(),fabric=createXtendFabric();
  const version=plan.schema==='xtend.maraca.build-plan.v12'?8:7;
  const lifecycle=require(version===8?'../../tools/xtensions/native-managed-lifecycle':'../../tools/xtensions/native-orchestration-lifecycle');
  const createRMTXSSRBindingAdmission=createRMTXSSRBindingAdmissionRuntime({programSchema:plan.orchestration.artifact.schema,
    validateLifecyclePlan:lifecycle.validateNativeOrchestrationLifecyclePlan,evaluateLifecyclePlan:lifecycle.evaluateNativeOrchestrationLifecyclePlan,nativeOrchestrationAdmission:lifecycle.nativeOrchestrationLifecycleAdmission});
  const nativeViewRuntimePort=require(version===8?'../../tools/xtensions/native-managed-view-projection':'../../tools/xtensions/native-surface-projection')[version===8?'NATIVE_MANAGED_VIEW_RUNTIME':'NATIVE_ORCHESTRATION_VIEW_RUNTIME'];
  let report=null;
  // This focused runtime test supplies the trusted prepared session port.
  // Signature/provenance are exercised by the separate real SSR acceptance.
  const rmtxSSRSession={schema:'xtend.maraca.xtension-ssr-session.v3',mode,
    confirmRestored(snapshot){assert.ok(snapshot.states.ui);},async finish(){report={status:mode==='server'?'server-rendered':'resumed'};return report;},getReport:()=>report,dispose(){}};
  const create=version===8?createMaracaRmtxSSRNativeManagedRuntime:createMaracaRmtxSSRNativeOrchestrationRuntime;
  const runtime=create({plan,root,fabric,scheduler,nativeViewRuntimePort,surfaceController:controller,adoptExisting:mode==='client',rmtxSSRSession,
    rmtxSSRBindingAdmission:snapshot=>createRMTXSSRBindingAdmission(plan.orchestration.artifact,snapshot),
    viewProjectionPort:viewProjection.createRmtMaracaViewProjectionAdapter({root,documentTarget:dom.window.document}),documentTarget:dom.window.document,
    moduleApis:{state,action,app,renderer,viewProjection,presentation,events,surfaces,surfaceController,kernel,kernelRuntime}});
  return {dom,root,runtime,controller,scheduler,owner:()=>root.querySelector('[data-maraca-surface="owner"]'),
    async boot(){await runtime.boot();},async replace(patch){return runtime.dispatchCommand('replace',{ui:{...runtime.snapshot().state.states.ui,...patch}});},
    async close(){runtime.dispose();await runtime.whenXTensionsIdle();controller.dispose();scheduler.dispose();dom.window.close();}};
}

for(const version of [7,8])for(const [name,patch,present] of [
  ['dispose',{dispose:true},false],['detach',{detach:true},false],['recycle',{recycle:true},true],['suspend',{suspend:true},true],['mount-false',{mount:false},false],['hydrate-false',{hydrate:false},true],['prewarm-mount-false',{mount:false,prewarm:true},false]
])test(`Source${version} SSR initial ${name} preserves its derived shell and consumes initial destructive edges once`,async()=>{
  const plan=planFor(version,patch),server=await fixture(plan,'server');let client;
  try{
    await server.boot();assert.equal(!!server.owner(),present,'server native-content policy');
    client=await fixture(plan,'client',server.root.innerHTML);const before=client.owner();
    await client.boot();assert.equal(!!client.owner(),present,'client native-content policy');
    if(present)assert.equal(client.owner(),before,'adoption preserves the actual server shell');
    assert.equal(client.runtime.snapshot().schema,'xtend.maraca.plan-runtime.v18');
    const lifecycle=client.runtime.snapshot().nativeLifecycle;
    assert.ok(lifecycle);
    assert.equal(lifecycle.operations.some(op=>['dispose','detach','recycle','suspend'].includes(op.op)),false,'initial phase derivation never fabricates completed Kernel operations');
    if(name==='prewarm-mount-false'){
      assert.equal(server.runtime.snapshot().nativeLifecycle.operations.some(op=>op.op==='prewarm'),false,'server does not claim client warmup work');
      assert.ok(lifecycle.operations.some(op=>op.op==='prewarm'),'initial client Prewarm still executes through the actual Kernel job');
    }
    if(name==='recycle'){
      await client.replace({recycle:false});assert.equal(client.owner(),before);
      await client.replace({recycle:true});assert.ok(client.owner());assert.notEqual(client.owner(),before,'a future rising edge still executes real Recycle');
      assert.ok(client.runtime.snapshot().nativeLifecycle.operations.some(op=>op.op==='recycle'));
    }
    if(name==='mount-false'){
      await client.replace({mount:true});assert.ok(client.owner(),'a later admitted Mount renders native content');
    }
  }finally{await client?.close();await server.close();}
});
