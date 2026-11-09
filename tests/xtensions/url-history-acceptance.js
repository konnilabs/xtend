'use strict';
const { createReactRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const reference = require('../../development/rmtx-a02/url-history/reference');
const policy = require('../../development/rmtx-a02/url-history/policy.v1.json');
async function runURLHistoryAcceptance({ React, ReactDOM, document, test, check, equal, plan, modules, bindingRuntime, xtendState }) {
  const copy=value=>JSON.parse(JSON.stringify(value));
  const rejects=fn=>{let rejected=false;try{fn();}catch{rejected=true;}check(rejected,'contract operation must reject');};
  function fixture() {
    const previous=xtendState.snapshot().data,program=plan.orchestration.artifact;
    const model=modules.state.createRmtStateSelectorRuntime({states:program.state.states,stateProjectionTarget:xtendState,
      createStateProjectionPort:modules.stateProjection.createRmtStateHostAdapter,strictMaraca:true});
    const c=reference.createURLStateContract(policy,{program,bindings:plan.xtensionBindings});
    const lifetime={navigationId:()=> 'browser-nav-1',isCurrent:()=>true,isViewCommitted:()=>view};let view=false;
    c.applyRestore(c.planRestore(null,model.snapshot(),{navigationId:'browser-nav-1'}),model,lifetime);
    const artifact=bindingRuntime.validateStateBindingArtifact(plan.xtensionBindings,program);
    const registry=bindingRuntime.createXTensionStateRegistry({modelReader:model.modelReader,modelCommandPort:model.modelCommandPort});
    const handles=[];
    for(const row of bindingRuntime.materializeStateBindingArtifact(artifact,model.snapshot())){
      const container=document.createElement('section');document.body.append(container);
      const instance=registry.bind(row.binding,context=>createReactRuntimeAdapter({...context,container,peers:{React,ReactDOM},policy:{events:context.events},
        component:props=>React.createElement('output',null,`${props.query}:${props.activeId??'-'}`)}));
      handles.push({container,instance});
    }
    return {c,model,lifetime,handles,registry,viewReady(){view=true;}, async mount(){await Promise.all(handles.map(handle=>handle.instance.mount()));view=true;},
      token(entries){return c.encode({schema:'xtend.xtensions.url-state.v1',documentId:policy.documentId,policyId:policy.id,policyVersion:policy.version,entries});},
      async close(){c.dispose();await registry.dispose();handles.forEach(handle=>handle.container.remove());xtendState.clear();xtendState.batchUpdate(previous);}};
  }
  await test('A02.5: URL restore changes one real Model transaction and its typed React props',async()=>{
    const f=fixture();try{
      await f.mount();let changes=0;const stop=f.model.modelReader.subscribe(()=>changes++);
      const token=f.token([{declarationId:'filter-panel',keys:['a',1],values:{query:'URL number',activeId:'42'}},{declarationId:'filter-panel',keys:['a','1'],values:{query:'URL string'}}]);
      const p=f.c.planRestore(token,f.model.snapshot(),{navigationId:'browser-nav-1'});f.c.applyRestore(p,f.model,f.lifetime);
      await Promise.all(f.handles.map(handle=>handle.instance.whenIdle()));stop();
      equal(changes,1,'only one atomic Model transaction is published');
      equal(f.handles.map(handle=>handle.container.textContent),['URL number:42','URL string:-',':-'],'typed keys select independent actual roots');
      equal(xtendState.get('groups'),f.model.getState('groups'),'real State projection contains exactly the same restored Model');
    }finally{await f.close();}
  });
  await test('A02.5: History proposals require settled Model and current framework delivery',async()=>{
    const f=fixture();try{
      const before=document.defaultView.location.href;await f.mount();
      const token=f.token([{declarationId:'filter-panel',keys:['b',1],values:{query:'later'}}]);
      f.c.applyRestore(f.c.planRestore(token,f.model.snapshot(),{navigationId:'browser-nav-1'}),f.model,f.lifetime);
      const proposal=f.c.proposeHistory(f.model.snapshot(),{cause:'checkpoint',currentToken:null,navigationId:'browser-nav-1'});
      rejects(()=>f.c.checkHistory(proposal,f.model.snapshot(),{...f.lifetime,isViewCommitted:()=>false}));
      await Promise.all(f.handles.map(handle=>handle.instance.whenIdle()));
      check(f.c.checkHistory(proposal,f.model.snapshot(),f.lifetime),'owner may publish only after the real props delivery');
      equal(proposal.mode,'push','only explicit semantic checkpoint requests push');
      equal(document.defaultView.location.href,before,'reference performs no browser History or route mutation');
    }finally{await f.close();}
  });
  await test('A02.5: malformed tokens and deferred keys leave live roots and Model unchanged',async()=>{
    const f=fixture();try{
      await f.mount();const before=copy(f.model.snapshot().states),outputs=f.handles.map(handle=>handle.container.firstChild);
      rejects(()=>f.c.planRestore('2.invalid',f.model.snapshot(),{navigationId:'browser-nav-1'}));
      const token=f.token([{declarationId:'filter-panel',keys:['a','future'],values:{query:'wait'}}]);
      const p=f.c.planRestore(token,f.model.snapshot(),{navigationId:'browser-nav-1'});equal(p.status,'deferred','missing logical keys wait for the declared dataflow');rejects(()=>f.c.applyRestore(p,f.model,f.lifetime));
      equal(f.model.snapshot().states,before,'no partial defaults or URL values are applied');
      check(f.handles.every((handle,i)=>handle.container.firstChild===outputs[i]&&handle.instance.snapshot().phase==='active'),'invalid URL does not tear down live framework roots');
    }finally{await f.close();}
  });
  await test('A02.5: traversal defaults restore existing roots without writing another URL entry',async()=>{
    const f=fixture();try{
      await f.mount();const token=f.token([{declarationId:'filter-panel',keys:['a',1],values:{query:'changed'}}]);
      f.c.applyRestore(f.c.planRestore(token,f.model.snapshot(),{navigationId:'browser-nav-1'}),f.model,f.lifetime);await f.registry.flush();
      const nodes=f.handles.map(handle=>handle.container.firstChild);
      f.c.applyRestore(f.c.planRestore(null,f.model.snapshot(),{navigationId:'browser-nav-1'}),f.model,f.lifetime);await f.registry.flush();
      equal(f.handles.map(handle=>handle.container.textContent),[':-',':-',':-'],'absence means versioned public defaults');
      check(f.handles.every((handle,i)=>handle.container.firstChild===nodes[i]),'URL restore preserves current framework roots');
      const proposal=f.c.proposeHistory(f.model.snapshot(),{cause:'traverse',currentToken:null,navigationId:'browser-nav-1'});
      equal(proposal.mode,'none','traversal cannot echo into another History entry');
    }finally{await f.close();}
  });
}
module.exports={runURLHistoryAcceptance};
