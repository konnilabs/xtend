'use strict';
const codec=require('@ccslabs/xtend/xtensions/url-state');
const policy=require('../../development/rmtx-a02/url-history/policy.v1.json');
async function runURLStateMaracaAcceptance({ React, ReactDOM, document, test, check, equal, fixture, plan, modules, xtendState, deferred, rejected, within }) {
  const { createXRouterURLStateHost }=await import('../../components/xrouter-url-state.js');
  const win=document.defaultView,copy=x=>JSON.parse(JSON.stringify(x));
  const token=(query,keys=['a',1])=>codec.createURLStateContract(policy,{program:plan.orchestration.artifact,bindings:plan.xtensionBindings}).encode({
    schema:'xtend.xtensions.url-state.v1',documentId:policy.documentId,policyId:policy.id,policyVersion:policy.version,
    entries:[{declarationId:'filter-panel',keys,values:{query}}]});
  const base=win.location.origin;
  function make(mode='history',query='',extra={}) {
    const previous=win.location.href;
    win.history.replaceState({ unrelated:'retained' },'',mode==='hash'?base+'/url-shell?locale=de#/filters?x=a+b'+(query?'&xtend-state='+query:''):base+'/filters?locale=de&x=a%20b'+(query?'&xtend-state='+query:'')+'#anchor');
    const f=fixture({plan,urlStatePolicy:policy,urlStateRuntime:codec,...extra});
    const owner=createXRouterURLStateHost({windowTarget:win,runtime:f.runtime,codec,mode,listen:true});
    return {...f,owner,async close(){owner.dispose();await f.close();win.history.replaceState(null,'',previous);}};
  }
  const values=f=>[...f.root.querySelectorAll('output')].map(e=>e.textContent);
  const update=async(f,value)=>{const groups=copy(f.runtime.model.getState('groups'));groups.items[0].filters[0].query=value;await f.runtime.dispatchCommand('groups.replace',{groups});};
  async function traverse(f,direction) {
    const event=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{win.removeEventListener('popstate',done);reject(new Error('No native History traversal.'));},1000);function done(){clearTimeout(timer);resolve();}win.addEventListener('popstate',done,{once:true});});
    win.history[direction]();await event;await f.owner.whenIdle();await f.runtime.whenXTensionsIdle();
  }
  for(const mode of ['history','hash']){
    await test(`A02.5.2: ${mode} route owner restores typed Model/State/React data through one Maraca commit`,async()=>{
      const f=make(mode,token('deep'));try{
        await f.runtime.boot();const nodes=[...f.root.querySelectorAll('input')];let commits=0;const stop=f.runtime.model.subscribe(()=>commits++);
        const result=await f.owner.navigate('initialize');stop();equal(result.status,'restored','route restore completes');equal(commits,1,'one Model transaction');
        equal(values(f),['deep:-',':-',':-'],'only public typed instance and declared defaults are restored');
        equal(xtendState.get('groups'),f.runtime.model.getState('groups'),'State is the committed Model projection');check(nodes.every((n,i)=>n===f.root.querySelectorAll('input')[i]),'existing foreign roots survive restore');
        equal(win.history.state,{unrelated:'retained'},'History state belongs to the route owner');
      }finally{await f.close();}
    });
    await test(`A02.5.2: ${mode} native Back/Forward restores without History echo`,async()=>{
      const f=make(mode);try{
        await f.runtime.boot();await f.owner.navigate('initialize');const start=win.location.href, length=win.history.length;
        await update(f,'checkpoint');equal(win.location.href,start,'Model commits never publish on their own');await f.owner.publish('checkpoint');
        equal(win.history.length,length+1,'explicit checkpoint pushes exactly once');const checkpoint=win.location.href;
        await traverse(f,'back');equal(values(f),[':-',':-',':-'],'Back restores explicit defaults');equal(win.history.length,length+1,'Back adds no History entries');
        await traverse(f,'forward');equal(values(f),['checkpoint:-',':-',':-'],'Forward restores the checkpoint');equal(win.location.href,checkpoint,'Forward leaves the traversed token untouched');
      }finally{await f.close();}
    });
    await test(`A02.5.2: ${mode} commit replaces and preserves unrelated route/query/fragment bytes`,async()=>{
      const f=make(mode);try{
        await f.runtime.boot();await f.owner.navigate('initialize');const length=win.history.length;
        await update(f,'typing');await f.owner.publish();equal(win.history.length,length,'ordinary commit replaces');
        check(win.location.href.includes(mode==='hash'?'?locale=de#/filters?x=a+b&xtend-state=':'/filters?locale=de&x=a%20b&xtend-state='),'unrelated raw query segments survive');
        if(mode==='history')equal(win.location.hash,'#anchor','fragment retained');
        const unchanged=win.location.href;await f.owner.publish('checkpoint');equal(win.location.href,unchanged,'equal token is a no-op');equal(win.history.length,length,'equal checkpoint does not push');
      }finally{await f.close();}
    });
  }
  await test('A02.5.2: malformed/duplicate tokens preserve live roots and need explicit reset',async()=>{
    const f=make();try{
      await f.runtime.boot();await f.owner.navigate('initialize');await update(f,'retained');const roots=[...f.root.querySelectorAll('input')],before=copy(f.runtime.model.snapshot());
      win.history.replaceState(win.history.state,'',base+'/filters?locale=de&xtend-state=%ZZ&%78tend-state=bad#anchor');
      await rejected(()=>f.owner.navigate('traverse'));equal(f.runtime.model.snapshot(),before,'invalid query performs no Model transaction');
      await f.owner.publish('checkpoint');check(win.location.search.includes('%ZZ'),'ordinary publication cannot erase an invalid URL');
      await f.owner.reset();equal(values(f),[':-',':-',':-'],'explicit reset restores all policy defaults');equal(win.location.search,'?locale=de','explicit reset removes invalid aliases');
      check(roots.every((node,i)=>node===f.root.querySelectorAll('input')[i]),'reset retains framework root identity');
    }finally{await f.close();}
  });
  await test('A02.5.2: deferred keyed restore waits for declared data and explicit retry',async()=>{
    const f=make('history',token('future-value',['a','future']));try{
      await f.runtime.boot();const before=copy(f.runtime.model.snapshot());equal((await f.owner.navigate('initialize')).status,'deferred','missing key defers all public fields');equal(f.runtime.model.snapshot(),before,'no partial defaults or Model write');
      const groups=copy(f.runtime.model.getState('groups'));groups.items[0].filters.push({id:'future',query:'initial',selection:{activeId:null},enabled:true});await f.runtime.dispatchCommand('groups.replace',{groups});
      equal(f.runtime.model.getState('groups').items[0].filters[2].query,'initial','data arrival does not perform an implicit restore');
      equal((await f.owner.retry()).status,'restored','owner retries the same current route');equal(values(f),[':-',':-','future-value:-',':-'],'new logical key receives URL data');
    }finally{await f.close();}
  });
  await test('A02.5.2: queued navigation replacement cannot apply an obsolete token',async()=>{
    const hold=deferred(),entered=deferred();const action={...modules.action,createRmtActionEffectRuntime(options){const actual=modules.action.createRmtActionEffectRuntime(options);return {...actual,async runAction(...args){entered.resolve();await hold.promise;return actual.runAction(...args);}};}};
    const f=make('history',token('obsolete'),{moduleApis:{...modules,action}});try{
      await f.runtime.boot();const groups=copy(f.runtime.model.getState('groups'));const command=f.runtime.dispatchCommand('groups.replace',{groups});await within(entered.promise);
      const first=f.owner.navigate('initialize');win.history.replaceState(null,'',base+'/filters?xtend-state='+token('current'));const second=f.owner.navigate('traverse');
      hold.resolve();await command;equal((await first).status,'superseded','old navigation is revoked while queued');equal((await second).status,'restored','new navigation commits');equal(values(f),['current:-',':-',':-'],'obsolete token never becomes the final Model/View');
    }finally{hold.resolve();await f.close();}
  });
  await test('A02.5.2: navigation loss during asynchronous props delivery forbids History publication',async()=>{
    const held=deferred(),entered=deferred();let block=false;
    const { createReactRuntimeAdapter }=require('@ccslabs/xtend/xtensions/react-runtime-adapter');
    const { createFilterPanel }=require('../../development/rmtx-a02/controlled-filters');
    const f=make('history',token(''),{createXTensionHost(context){
      const actual=createReactRuntimeAdapter({...context,component:createFilterPanel(React),peers:{React,ReactDOM},policy:{events:context.events}});
      return {...actual,async update(...args){if(block){entered.resolve();await held.promise;}return actual.update(...args);}};
    }});
    try{
      await f.runtime.boot();const host=f.runtime.getXTensionBindings()[0].instance;
      block=true;const restoring=f.owner.navigate('initialize');await within(entered.promise);f.owner.dispose();held.resolve();
      const result=await restoring;equal(result.status,'superseded','disposed owner cannot finalize navigation');check(win.location.search.includes('xtend-state='),'zero-delta token is not removed after navigation loss');
      check(host.snapshot().phase==='active','navigation cancellation does not fabricate rollback or dispose unrelated Model hosts');
    }finally{held.resolve();await f.close();}
  });
  await test('A02.5.2: hash outer-query fallback and empty hash query keep their owner area',async()=>{
    const previous=win.location.href;win.history.replaceState(null,'',base+'/url-shell?locale=de&xtend-state='+token('outer')+'#/filters');
    const f=fixture({plan,urlStatePolicy:policy,urlStateRuntime:codec});const owner=createXRouterURLStateHost({runtime:f.runtime,codec,windowTarget:win,mode:'hash',listen:true});
    try{await f.runtime.boot();await owner.navigate('initialize');equal(values(f),['outer:-',':-',':-'],'outer query is the existing hash fallback');
      win.history.replaceState(null,'',base+'/url-shell?xtend-state='+token('ignored')+'#/filters?xtend-state='+token('inner'));await owner.navigate('traverse');equal(values(f),['inner:-',':-',':-'],'explicit hash query wins');
      await owner.reset();check(win.location.href.endsWith('#/filters?'),'empty hash query keeps outer token inactive');equal(values(f),[':-',':-',':-'],'reset does not activate the outer token');
    }finally{owner.dispose();await f.close();win.history.replaceState(null,'',previous);}
  });
  await test('A02.5.2: policy-free runtimes and forged URL command envelopes cannot acquire restore authority',async()=>{
    const f=fixture({plan});try{await f.runtime.boot();const abort=new AbortController(),before=copy(f.runtime.model.snapshot());await rejected(()=>f.runtime.restoreURLState(null,{navigationId:'n1',signal:abort.signal,isCurrent:()=>true}));equal(f.runtime.model.snapshot(),before,'no policy means no URL writes');await rejected(()=>f.runtime.dispatchCommand('xtend.system.url-restore',{modelOperations:[{operation:'set',state:'groups',value:{items:[]}}]}));equal(f.runtime.model.snapshot(),before,'ordinary command payload cannot use the private URL ingress');}finally{await f.close();}
  });
  await test('A02.5.2: suspended roots block History until current props are actually resumed',async()=>{
    const f=make();try{await f.runtime.boot();await f.owner.navigate('initialize');const instance=f.runtime.getXTensionBindings()[0].instance;
      await instance.suspend();await update(f,'buffered');const before=win.location.href;
      await rejected(()=>f.owner.publish('checkpoint'));equal(win.location.href,before,'undelivered suspended props cannot authorize History');
      await instance.resume();await f.owner.publish('checkpoint');check(win.location.search.includes('xtend-state='),'current props release explicit publication');equal(values(f),['buffered:-',':-',':-'],'resume delivers the current Model');
    }finally{await f.close();}
  });
  await test('A02.5.2: restoration reports pending View delivery until a paused host resumes',async()=>{
    const f=make('history',token(''));try{await f.runtime.boot();const instance=f.runtime.getXTensionBindings()[0].instance;await instance.suspend();
      equal((await f.owner.navigate('initialize')).status,'pending-view','committed Model with paused props is not reported as completed');
      check(win.location.search.includes('xtend-state='),'pending View cannot remove the zero-delta parameter');
      await instance.resume();equal((await f.owner.retry()).status,'restored','explicit retry confirms delivered props without another Model write');
      equal(values(f),[':-',':-',':-'],'resumed roots match the current Model');check(!win.location.search.includes('xtend-state='),'retry retains initialization provenance and only now canonicalizes the entry');
    }finally{await f.close();}
  });
  await test('A02.5.2: publication never waits for an intent queued behind its own command slot',async()=>{
    const {createRepeatedDataSourceAdapter}=require('../../development/rmtx-a02/repeated-filters');const f=make('history','',{dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()}});
    try{await f.runtime.boot();await f.owner.navigate('initialize');await update(f,'publish-first');const publishing=f.owner.publish('checkpoint');
      f.hosts[0].host.emit({type:'change',payload:{query:'intent-after-publication'}});
      await within(publishing);await within(f.runtime.whenXTensionsIdle());equal(f.runtime.model.getState('groups').items[0].filters[0].query,'intent-after-publication','later intent commits without a queue cycle');
    }finally{await f.close();}
  });
  await test('A02.5.2: actual x-router delegates same-route query navigation and disconnect revokes its owner',async()=>{
    if(!globalThis.customElements)Object.defineProperty(globalThis,'customElements',{configurable:true,value:win.customElements});
    await import('../../components/xrouter.js');const previous=win.location.href;win.history.replaceState(null,'',base+'/filters');
    const f=fixture({plan,urlStatePolicy:policy,urlStateRuntime:codec});const router=document.createElement('x-router');router.setAttribute('mode','history');
    let owner;try{await f.runtime.boot();document.body.append(router);router.shadowRoot.querySelector('#outlet').append(f.root);owner=router.connectURLState(f.runtime,codec);await owner.whenIdle();await new Promise(resolve=>setTimeout(resolve,0));
      const root=f.root.querySelector('input');check(router.navigate('/filters?xtend-state='+token('router-value')),'public router navigation is accepted');await owner.whenIdle();
      equal(values(f),['router-value:-',':-',':-'],'real router delegates query restore');check(root===f.root.querySelector('input'),'router retains the bound foreign root');
      owner.dispose();equal((await owner.publish('checkpoint')).status,'superseded','disconnected route owner cannot publish');
    }finally{owner?.dispose();await f.close();router.remove();win.history.replaceState(null,'',previous);}
  });
  await test('A02.5.2: route departure immediately revokes pending Model and History authority',async()=>{
    const f=make('history',token('old-route'));try{await f.runtime.boot();win.history.replaceState(null,'',base+'/different-route?xtend-state='+token('other'));equal((await f.owner.navigate('traverse')).status,'superseded','owner cannot restore a different route');equal((await f.owner.publish('checkpoint')).status,'superseded','departed route cannot write History');}finally{await f.close();}
  });
}
module.exports={runURLStateMaracaAcceptance};
