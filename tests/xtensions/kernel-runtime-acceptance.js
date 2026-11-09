'use strict';
const react=require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const vue=require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
const {createXtendFabric}=require('../../fabric/xtend-fabric');
async function runKernelRuntimeAcceptance({React:R,ReactDOM,Vue:V,document,test,check,equal}) {
  const {createRmtKernelScheduler}=await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
  const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
  async function within(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('Kernel host work did not settle.')),1500))]);}finally{clearTimeout(timer);}}
  async function rejected(action){let error;try{await action();}catch(e){error=e;}check(!!error,'work must reject');return error;}
  function fixture(framework,extra={}) {
    const events=[], fabric=createXtendFabric(),container=document.createElement('section');document.body.append(container);
    let holding=!!extra.hold,panic=false;const callbacks=[];
    const scheduler=createRmtKernelScheduler({preferPostTask:false,isPanicBlocked:()=>panic,observer:e=>{events.push(e);extra.observe?.(e);},
      hostPort:{queueMicrotask(callback){if(holding)callbacks.push(callback);else queueMicrotask(callback);}}});
    const stats={mounted:0,destroyed:0,renders:0,handle:null,mountWork:null,resourceStarts:0,resourceStops:0};
    let component;
    if(framework==='react')component=function Panel({title,xtension}){stats.renders++;const [count,setCount]=R.useState(0);R.useLayoutEffect(()=>{stats.handle=xtension;stats.mounted++;
      if(extra.mountWork)stats.mountWork=xtension.work.schedule('scan',ctx=>extra.mountWork(ctx,stats));
      const stop=xtension.resources.register('timer',()=>{stats.resourceStarts++;return ()=>stats.resourceStops++;});return ()=>{stats.destroyed++;stop();};},[]);
      return R.createElement('div',null,R.createElement('output',null,title),extra.localState?R.createElement('button',{onClick:()=>setCount(n=>n+1)},String(count)):null);};
    else component={props:['title','xtension'],setup(props){const count=V.ref(0);V.onMounted(()=>{stats.handle=props.xtension;stats.mounted++;if(extra.mountWork)stats.mountWork=props.xtension.work.schedule('scan',ctx=>extra.mountWork(ctx,stats));});
      let stop;V.onMounted(()=>{stop=props.xtension.resources.register('timer',()=>{stats.resourceStarts++;return ()=>stats.resourceStops++;});});V.onUnmounted(()=>{stats.destroyed++;stop?.();});
      return ()=>{stats.renders++;return V.h('div',[V.h('output',null,props.title),extra.localState?V.h('button',{onClick:()=>count.value++},String(count.value)):null]);};}};
    const api=framework==='react'?react:vue,title=framework==='react'?'React':'Vue';
    const config={container,component,peers:framework==='react'?{React:R,ReactDOM}:{Vue:V},fabric,policy:{allowedResources:['timer']},
      kernelWork:{scheduler,rootId:'a03-reference',scope:`${framework}-instance`,lifecycle:{lane:'visible',maxChunkMs:4},work:{scan:{lane:'background',maxChunkMs:1},held:{lane:'idle'}}},...extra.options};
    const adapter=api[`create${title}KernelRuntimeAdapter`](config);
    return {adapter,config,api,title,scheduler,fabric,container,events,stats,panic(value){panic=value;},release(){holding=false;callbacks.splice(0).forEach(cb=>queueMicrotask(cb));},
      async close(){holding=false;callbacks.splice(0).forEach(cb=>queueMicrotask(cb));await adapter.unmount();scheduler.dispose();container.remove();}};
  }
  for(const framework of ['react','vue']){
    await test(`A03.1: ${framework} requires Fabric and captures only trusted kernel policy`,async()=>{
      const f=fixture(framework);try{
        const factory=f.api[`create${f.title}KernelRuntimeAdapter`];
        for(const changed of [{fabric:null},{kernelWork:null},{kernelWork:{...f.config.kernelWork,scheduler:{...f.scheduler,schema:f.scheduler.schema+'.unsupported'}}},{kernelWork:{...f.config.kernelWork,lifecycle:{lane:'render'}}},{kernelWork:{...f.config.kernelWork,work:{scan:{rootId:'forged'}}}}]){
          let error;try{factory({...f.config,...changed});}catch(e){error=e;}check(!!error,'invalid authority must fail before a kernel job or root');
        }
        equal(f.events.length,0,'construction schedules no work');equal(f.stats.mounted,0,'no root was rendered');
        const capabilities=f.adapter.getCapabilities();equal(capabilities.schema,'xtend.xtensions.runtime-capabilities.v1','capabilities are versioned');
        check(capabilities.preemption===false&&capabilities.frameworkInternalScheduling===false&&capabilities.terminalCleanup==='immediate','capabilities describe the actual cooperative boundary');
        equal(f.adapter.schema,'xtend.xtensions.runtime-host-controller.v3','v3 is explicit');equal(f.adapter.apiVersion,'3.0.0','API major differs from legacy');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} lifecycle waits in the real queue before entering Fabric`,async()=>{
      const f=fixture(framework,{hold:true,options:{lane:'background'}});try{
        const mounting=f.adapter.mount(f.container,{title:'queued',private:'not-in-kernel-metadata'});await Promise.resolve();await Promise.resolve();
        check(f.events.some(e=>e.phase==='queued'),'actual kernel reports a queued job');equal(f.fabric.getFibers().length,0,'Fabric has not executed while kernel queue is held');equal(f.stats.renders,0,'no framework render before admission');
        f.release();check((await within(mounting)).ok,'mount commits');equal(f.container.textContent,'queued','actual framework root rendered');
        check(f.fabric.getFibers().some(e=>e.phase==='mount'&&e.status==='completed'),'real Fabric observes completion');
        const request=f.scheduler.getJob(f.events[0].jobId).snapshot().request;
        equal([request.rootId,request.scope,request.lane,request.maxChunkMs],['a03-reference',`${framework}-instance`,'visible',4],'trusted scope and budget reach the kernel');
        check(!JSON.stringify(request).includes('not-in-kernel-metadata'),'props never become job metadata');
        await f.adapter.update({type:'props.update',props:{title:'updated'}});equal(f.container.textContent,'updated','update awaits framework commit');
        await f.adapter.suspend();await f.adapter.resume();
        const operations=f.adapter.snapshot().kernelWork.history.filter(x=>x.kind==='lifecycle').map(x=>x.name);equal(operations,['mount','update','suspend','resume'],'all retained host operations are actual jobs');
        await f.adapter.unmount();equal(f.fabric.getFibers().find(x=>x.phase==='unmount').lane,'visible','immediate Fabric cleanup uses the captured lifecycle lane as well');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} mount effects wait for host readiness before named work starts`,async()=>{
      let adapter;const seen=[];const f=fixture(framework,{mountWork:async ctx=>{seen.push(adapter.snapshot().phase);return ctx.jobId;}});adapter=f.adapter;
      try{await f.adapter.mount(f.container,{title:'ready'});const id=await within(f.stats.mountWork.result);equal(seen,['ready'],'effect work starts only after verified mount/resources');
        equal(f.scheduler.getJob(id).snapshot().request.lane,'background','component cannot replace host-selected lane');
        const fiber=f.fabric.getFibers().find(x=>x.phase==='work:scan');equal(fiber.metadata.kernelJobId,id,'Fabric and kernel records share the actual job id');equal(fiber.lane,'background','Fabric observes the effective kernel lane');
        check(f.fabric.getFibers().some(x=>x.phase==='work:scan'&&x.status==='completed'),'cooperative work also runs through real Fabric');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} named work yields to higher priority kernel work`,async()=>{
      const f=fixture(framework);try{await f.adapter.mount(f.container,{title:'chunks'});const order=[];let urgent;
        const work=f.stats.handle.work.schedule('scan',async ctx=>{order.push('first');urgent=f.scheduler.schedule({lane:'user-blocking',scope:'other-root',rootId:'other-root'},()=>order.push('urgent'));
          check(ctx.shouldYield(),'higher priority pending work requests a cooperative yield');await ctx.yield('next-chunk');order.push('second');return 42;});
        equal(await within(work.result),42,'result comes from the real kernel handle');await urgent.result;equal(order,['first','urgent','second'],'kernel interleaves actual work chunks');
        check(f.events.some(e=>e.jobId===work.jobId&&e.phase==='yielded'),'real yield event is observable');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} component inputs cannot supply scheduler authority`,async()=>{
      const f=fixture(framework);try{await f.adapter.mount(f.container,{title:'authority'});const work=f.stats.handle.work;
        for(const action of [()=>work.schedule('unknown',()=>{}),()=>work.schedule('scan',()=>{},{lane:'user-blocking',rootId:'other'}),()=>work.schedule('scan',{})])await rejected(action);
        const before=f.events.filter(e=>e.phase==='queued').length;
        check((await f.adapter.update({type:'props.update',props:{title:'forged'},kernelWork:{rootId:'other'}})).status==='policy-blocked','lifecycle data rejects kernel authority');
        equal(f.events.filter(e=>e.phase==='queued').length,before,'invalid lifecycle input creates no job');
        f.config.kernelWork.lifecycle.lane='background';await f.adapter.update({type:'props.update',props:{title:'captured'}});equal(f.adapter.snapshot().kernelWork.history.filter(x=>x.name==='update').at(-1).lane,'visible','lifecycle policy is captured before caller mutation');equal(f.adapter.getLifecycleRecords().filter(x=>x.operation==='update').at(-1).lane,'visible','lifecycle telemetry preserves the same captured lane');const next=work.schedule('scan',()=> 'safe');await next.result;
        equal(f.scheduler.getJob(next.jobId).snapshot().request.lane,'background','captured named grant stays its original lane');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} suspension aborts owned work and fences its old callbacks across resume`,async()=>{
      const release=defer(),entered=defer();const f=fixture(framework);try{await f.adapter.mount(f.container,{title:'lifetime'});let stale,context,hits=0;
        const first=f.stats.handle.work.schedule('held',async ctx=>{context=ctx;stale=ctx.guard(()=>hits++);entered.resolve();await release.promise;stale();});
        await within(entered.promise);await f.adapter.suspend();await rejected(()=>first.result);check(context.signal.aborted&&!context.isCurrent(),'suspend revokes active named-work generation');
        equal(f.stats.resourceStops,1,'cooperative resources are stopped too');
        const refused=f.stats.handle.work.schedule('scan',()=>hits++);equal(refused.jobId,null,'paused host creates no new kernel work');await rejected(()=>refused.result);
        await f.adapter.resume();release.resolve();await tick();stale();equal(hits,0,'old work cannot cross into resumed lifetime');
        const second=f.stats.handle.work.schedule('scan',ctx=>{check(ctx.isCurrent(),'new work is live');return 'fresh';});equal(await second.result,'fresh','resume grants fresh work');
      }finally{release.resolve();await f.close();}
    });
    await test(`A03.1: ${framework} terminal cleanup bypasses a blocked or panicked kernel`,async()=>{
      const f=fixture(framework);try{await f.adapter.mount(f.container,{title:'dispose'});const entered=defer(),held=defer();let stale,hits=0;
        const work=f.stats.handle.work.schedule('held',async ctx=>{stale=ctx.guard(()=>hits++);entered.resolve();await held.promise;stale();});await entered.promise;
        f.panic(true);const before=f.events.filter(e=>e.phase==='queued').length;check((await within(f.adapter.unmount())).ok,'cleanup settles without kernel admission');
        equal(f.stats.destroyed,1,'real framework root is destroyed once');equal(f.container.childNodes.length,0,'owned DOM is removed');equal(f.events.filter(e=>e.phase==='queued').length,before,'unmount creates no queued cleanup job');
        await rejected(()=>work.result);held.resolve();await tick();stale();equal(hits,0,'late work loses authority');
        check(f.fabric.getFibers().some(x=>x.phase==='unmount'),'immediate cleanup still passes through Fabric');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} cancellation before admission prevents loader and Fabric work`,async()=>{
      let loads=0;const f=fixture(framework,{hold:true,options:{loadRuntime:()=>{loads++;return framework==='react'?{React:R,ReactDOM}:{Vue:V};}}});
      try{const mounting=f.adapter.mount(f.container,{title:'cancelled'});await Promise.resolve();await Promise.resolve();check(f.events.some(e=>e.phase==='queued'),'mount reached actual queue');
        await within(f.adapter.unmount());f.release();await within(mounting);equal(loads,0,'cancelled queue never calls the provider');equal(f.stats.mounted,0,'no root can resurrect');
        check(!f.fabric.getFibers().some(x=>x.phase==='mount'),'cancelled mount never entered Fabric');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} scheduler shutdown immediately fences an in-flight provider`,async()=>{
      const loaded=defer(),entered=defer();let signal,created=0;
      const peers=framework==='react'?{React:R,ReactDOM:{...ReactDOM,createRoot(...args){created++;return ReactDOM.createRoot(...args);}}}:{Vue:{...V,createApp(...args){created++;return V.createApp(...args);}}};
      const f=fixture(framework,{observe:event=>{if(event.phase==='aborted')loaded.resolve(peers);},options:{loadRuntime:context=>{signal=context.signal;entered.resolve();return loaded.promise;}}});
      try{const mounting=f.adapter.mount(f.container,{title:'never-mounted'});await within(entered.promise);f.scheduler.dispose();check(signal.aborted,'kernel shutdown revokes provider authority synchronously');
        await within(mounting);await within(f.adapter.unmount());equal(created,0,'a provider resolving during kernel cancellation never creates a root');equal(f.container.childNodes.length,0,'no orphan DOM');
      }finally{loaded.resolve(peers);await f.close();}
    });
    await test(`A03.1: ${framework} current host policy fences named work and reentrant disposal`,async()=>{
      let revoke=false,f;f=fixture(framework,{options:{policy:{allowedResources:['timer'],authorize(context){
        if(!context.operation.startsWith('work:'))return true;
        if(revoke){f.adapter.unmount('policy-revocation');return true;}return context.props.title==='allowed';
      }}}});
      try{await f.adapter.mount(f.container,{title:'blocked'});let calls=0;const blocked=f.stats.handle.work.schedule('scan',()=>calls++);await rejected(()=>blocked.result);equal(calls,0,'granted name still obeys the current host policy');
        await f.adapter.update({type:'props.update',props:{title:'allowed'}});equal(await f.stats.handle.work.schedule('scan',()=>42).result,42,'authorization reads current committed props');
        revoke=true;const obsolete=f.stats.handle.work.schedule('scan',()=>calls++);await rejected(()=>obsolete.result);await f.adapter.unmount();equal(calls,0,'authorization cannot reenter dispose and then revive a callback');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} capabilities do not claim control of autonomous framework updates`,async()=>{
      const f=fixture(framework,{localState:true});try{await f.adapter.mount(f.container,{title:'local'});await f.adapter.suspend();const before=f.events.filter(e=>e.phase==='queued').length;
        f.container.querySelector('button').click();await tick();equal(f.container.querySelector('button').textContent,'1','framework-local state remains autonomous while cooperative work is paused');
        equal(f.events.filter(e=>e.phase==='queued').length,before,'local render is not falsely reported as a kernel job');
        const capability=f.adapter.getCapabilities();check(capability.fabricBoundary===true&&!capability.frameworkInternalScheduling&&!capability.preemption,'report separates explicit host work from framework internals');
      }finally{await f.close();}
    });
    await test(`A03.1: ${framework} failed cooperative work is observable without inventing framework preemption`,async()=>{
      const f=fixture(framework);try{await f.adapter.mount(f.container,{title:'healthy'});const job=f.stats.handle.work.schedule('scan',()=>{throw new Error('cooperative-failure');});await rejected(()=>job.result);
        equal(f.scheduler.getJob(job.jobId).status,'failed','kernel records actual callback failure');
        check(f.adapter.snapshot().diagnostics.some(x=>x.details.operation==='work:scan'),'host exposes failed named work');equal(f.container.textContent,'healthy','business-work failure does not fabricate framework teardown');
        check(f.fabric.getFibers().some(x=>x.phase==='work:scan'&&x.status==='failed'),'Fabric failure is observable too');
      }finally{await f.close();}
    });
  }
}
module.exports={runKernelRuntimeAcceptance};
