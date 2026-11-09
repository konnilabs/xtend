'use strict';
const {createReactKernelRuntimeAdapter}=require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const {createXtendFabric}=require('../../fabric/xtend-fabric');
const {createRepeatedFilterPanel,createRepeatedDataSourceAdapter}=require('../../development/rmtx-a02/repeated-filters');
async function runKernelMaracaAcceptance({React,ReactDOM,document,test,check,equal,fixture,plan,xtendState,within,rejected,deferred}) {
  function make(){const fabric=createXtendFabric(),hosts=[],facades=new Map(),component=createRepeatedFilterPanel(React);let f;
    f=fixture({plan,dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()},createXTensionHost(context){
      const host=createReactKernelRuntimeAdapter({...context,fabric,component:props=>{facades.set(context.xtensionId,props.xtension);return React.createElement(component,props);},peers:{React,ReactDOM},policy:{events:context.events},
        kernelWork:{scheduler:f.scheduler,rootId:context.identity.address.documentId,scope:context.xtensionId,work:{held:{lane:'background',maxChunkMs:2}}}});
      hosts.push({host,context});return host;}});return {...f,fabric,hosts,facades};
  }
  await test('A03.1: compiled Maraca Actions deliver three scoped hosts through actual Kernel and Fabric',async()=>{
    const f=make();try{await f.runtime.boot();equal(f.runtime.getXTensionBindings().length,3,'registry API 2.1 accepts explicit v3 hosts');const input=f.root.querySelector('input');
      input.value='kernel-action';input.dispatchEvent(new document.defaultView.Event('input',{bubbles:true}));await within(f.runtime.whenXTensionsIdle());
      equal(f.runtime.model.getState('groups').items[0].filters[0].query,'kernel-action','compiled Action commits its own keyed Model field');
      equal(xtendState.get('groups'),f.runtime.model.getState('groups'),'State stays a projection of the same Model transaction');check(input===f.root.querySelector('input'),'root identity survives controlled kernel delivery');
      const scopes=new Set(f.hosts.map(x=>x.context.xtensionId));equal(scopes.size,3,'every logical host lifetime has its own job scope');
      const updates=f.fabric.getFibers().filter(x=>x.phase==='update');check(updates.length>=1,'real Fabric observes delivered props');
      for(const fiber of f.fabric.getFibers().filter(x=>x.phase==='mount'||x.phase==='update')){
        check(scopes.has(fiber.scope),'Fabric shares the concrete instance scope');const job=f.scheduler.getJob(fiber.metadata.kernelJobId);check(!!job,'Fabric identifies an actual retained kernel job');equal(job.snapshot().request.scope,fiber.scope,'scope matches across both layers');
      }
    }finally{await f.close();}
  });
  await test('A03.1: keyed removal cancels only its owned work and cannot cross a replacement lifetime',async()=>{
    const f=make(),entered=deferred(),release=deferred();try{await f.runtime.boot();const original=f.hosts[0],facade=f.facades.get(original.context.xtensionId);let stale,hits=0;
      const job=facade.work.schedule('held',async context=>{stale=context.guard(()=>hits++);entered.resolve();await release.promise;stale();});await within(entered.promise);
      const groups=JSON.parse(JSON.stringify(f.runtime.model.getState('groups'))),removed=groups.items[0].filters.shift();await f.runtime.dispatchCommand('groups.replace',{groups});
      await rejected(()=>job.result);check(original.host.snapshot().disposed,'removed host is terminal');equal(f.runtime.getXTensionBindings().length,2,'other scoped roots remain');
      groups.items[0].filters.unshift(removed);await f.runtime.dispatchCommand('groups.replace',{groups});const replacement=f.hosts.at(-1);
      check(replacement.context.xtensionId!==original.context.xtensionId,'equal address gets a new work lifetime');release.resolve();await Promise.resolve();stale();equal(hits,0,'old work cannot affect the replacement');
      const fresh=f.facades.get(replacement.context.xtensionId).work.schedule('held',context=>context.isCurrent());equal(await fresh.result,true,'replacement work owns a fresh generation');
    }finally{release.resolve();await f.close();}
  });
}
module.exports={runKernelMaracaAcceptance};
