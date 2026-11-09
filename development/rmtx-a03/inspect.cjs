'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {createXtendFabric}=require('../../fabric/xtend-fabric');
const {createKernelWorkScope}=require('../../tools/xtensions/kernel-work-scope');
async function inspect(){
  const {createRmtKernelScheduler}=await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const root=path.resolve(__dirname,'../..'),events=[],fabric=createXtendFabric(),scheduler=createRmtKernelScheduler({preferPostTask:false,observer:event=>events.push(event)});
  const checked=[],check=(name,fn)=>{fn();checked.push(name);};
  const boundary=(operation,action,metadata)=>fabric.createBoundary('reference-instance',{source:'xtension',lane:metadata.kernelLane}).run(operation,action,metadata);
  const input={scheduler,rootId:'a03-reference',scope:'reference-instance',lifecycle:{lane:'visible',maxChunkMs:4},work:{scan:{lane:'background',maxChunkMs:1}}};
  const scope=createKernelWorkScope(input,{framework:'react',hostId:'h',surfaceId:'s',xtensionId:'x'},()=>{},boundary);
  try{
    check('required Fabric runner',()=>assert.throws(()=>createKernelWorkScope(input,{},()=>{})));
    for(const [name,mutate] of [['missing scheduler',x=>{x.scheduler=null;}],['unknown lane',x=>{x.lifecycle={lane:'private-render'};}],['invalid budget',x=>{x.lifecycle={maxChunkMs:0};}],['priority range',x=>{x.lifecycle={priority:101};}],['scope',x=>{x.scope='';}],['authority in grant',x=>{x.work={scan:{rootId:'other'}};}],['invalid work map',x=>{x.work=[];}]]){
      check('reject '+name,()=>{const changed={...input};mutate(changed);assert.throws(()=>createKernelWorkScope(changed,{},()=>{},boundary));});
    }
    check('closed capabilities are truthful',()=>{assert.equal(scope.capabilities.fabricBoundary,true);assert.equal(scope.capabilities.preemption,false);assert.equal(scope.capabilities.frameworkInternalScheduling,false);assert(Object.isFrozen(scope.capabilities));});
    check('unknown named work is denied',()=>assert.throws(()=>scope.work.schedule('missing',()=>{})));
    check('component request options are denied',()=>assert.throws(()=>scope.work.schedule('scan',()=>{},{})));
    const order=[];let urgent;
    const task=scope.work.schedule('scan',async context=>{order.push('start');urgent=scheduler.schedule({lane:'user-blocking',rootId:'other',scope:'other'},()=>order.push('urgent'));assert(context.shouldYield());await context.yield();order.push('end');return 42;});
    await scope.runLifecycle('mount',()=>scope.activate());
    assert.equal(await task.result,42);await urgent.result;assert.deepEqual(order,['start','urgent','end']);checked.push('real kernel admission and cooperative yield');
    const fiber=fabric.getFibers().find(x=>x.phase==='work:scan');assert.equal(fiber.metadata.kernelJobId,task.jobId);assert.equal(fiber.lane,'background');checked.push('actual Fabric job id and lane correlation');
    let enter;const entered=new Promise(resolve=>{enter=resolve;});let release;const held=new Promise(resolve=>{release=resolve;});let context,guard,hits=0;
    const late=scope.work.schedule('scan',async value=>{context=value;guard=value.guard(()=>hits++);enter();await held;guard();});await entered;
    scope.suspend();await assert.rejects(late.result);assert(context.signal.aborted);scope.beginResume();scope.activate();release();await Promise.resolve();guard();assert.equal(hits,0);checked.push('suspend cancels owned work and fences old generation');
    scope.dispose();const inert=scope.work.schedule('scan',()=>true);assert.equal(inert.jobId,null);await assert.rejects(inert.result);checked.push('terminal scope creates no replacement job');
    for(const framework of ['react','vue']){
      const title=framework[0].toUpperCase()+framework.slice(1),api=require('../../tools/xtensions/'+framework+'-runtime-adapter');
      const legacy=api['create'+title+'RuntimeAdapter']({container:{},component:{}});assert.equal(legacy.apiVersion,'2.0.0');assert.equal(legacy.schema,'xtend.xtensions.runtime-host-controller.v2');checked.push(framework+' v2 remains explicitly direct');await legacy.unmount();
      assert.throws(()=>api['create'+title+'KernelRuntimeAdapter']({container:{},component:{},kernelWork:input}));
      const current=api['create'+title+'KernelRuntimeAdapter']({container:{},component:{},kernelWork:input,fabric});assert.equal(current.apiVersion,'3.0.0');assert.equal(current.schema,'xtend.xtensions.runtime-host-controller.v3');assert.equal(current.getCapabilities().fabricBoundary,true);checked.push(framework+' v3 requires Fabric and kernel');await current.unmount();
    }
    assert.equal(require('../../tools/xtensions/state-binding').XTENSION_STATE_BINDING_API_VERSION,'2.1.0');checked.push('state registry API supports version-matched v2/v3 hosts');
    const sources=['tools/xtensions/kernel-work-scope.js','tools/xtensions/runtime-host-controller.js','tools/xtensions/runtime-host-controller.d.ts','tools/xtensions/react-runtime-adapter.js','tools/xtensions/react-runtime-adapter.d.ts','tools/xtensions/vue-runtime-adapter.js','tools/xtensions/vue-runtime-adapter.d.ts','tools/xtensions/state-binding.js','tools/xtensions/state-binding.d.ts','xtend-maraca/plan-runtime.d.ts','tests/xtensions/kernel-runtime-acceptance.js','tests/xtensions/kernel-maraca-acceptance.js','tests/types/xtensions_kernel_runtime.mts','tests/xtensions/xtensions_runtime_gate_suite.js'];
    const report={format:1,stage:'A03.1-explicit-kernel-host-work',status:'a03-in-progress',kernelAdapterApiVersion:'3.0.0',registryApiVersion:'2.1.0',fabricRequired:true,frameworkPreemption:false,frameworkExecutionInPreparationCheck:false,
      contractChecks:checked.length,names:checked,requiredRealIntegrationCases:26,requiredRuntimeCasesPerEnvironment:184,requiredCompilerChecks:88,
      sources:Object.fromEntries(sources.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')])),
      jobs:events.map(e=>({phase:e.phase,endpoint:e.endpointName,lane:e.lane,scope:e.scope,rootId:e.rootId})),capabilities:scope.capabilities};
    const text=JSON.stringify(report,null,2)+'\n',file=path.join(__dirname,'evidence.json');
    if(process.argv.includes('--write'))fs.writeFileSync(file,text);
    if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,'A03.1 contract/source drift');
    console.log(`A03.1: ${checked.length} Kernel/Fabric contract checks; real React/Vue execution remains mandatory in Runtime gates.`);return report;
  }finally{scope.dispose();scheduler.dispose();}
}
if(require.main===module)inspect().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inspect};
