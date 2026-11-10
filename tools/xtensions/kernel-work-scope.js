// SPDX-License-Identifier: Apache-2.0
'use strict';
// No framework or kernel implementation is imported here. The application owns
// the real scheduler port and every request field; components receive named work only.
const { data, record, fields, name, clone, freeze } = require('./state-binding-contract');
const { createWorkBudgetPolicy } = require('./work-budget-policy');
const lanes = ['user-blocking','visible','transition','idle','background','diagnostics'];
const abortError = () => Object.assign(new Error('XTension work lifetime is no longer current.'), { name: 'AbortError' });
function requestPolicy(input = {}) {
  data(input); fields(input,['lane','priority','maxChunkMs','timeoutMs','budgetClass'],'Kernel work policy');
  const result={lane:'visible',maxChunkMs:8,...clone(input)};
  if (!lanes.includes(result.lane) || !Number.isFinite(result.maxChunkMs) || result.maxChunkMs <= 0 ||
      result.priority !== undefined && (!Number.isFinite(result.priority)||result.priority<0||result.priority>100) || result.timeoutMs !== undefined && (!Number.isFinite(result.timeoutMs)||result.timeoutMs<0)) throw new TypeError('Invalid kernel lane or cooperative budget.');
  if (result.budgetClass !== undefined) name(result.budgetClass);
  return freeze(result);
}
function createKernelWorkScope(input, identity, onFailure, runBoundary, beforeWork = () => {}, lifecycleCancelled = () => {}, budgetInput) {
  if(typeof runBoundary!=='function')throw new TypeError('Kernel work requires a Fabric boundary runner.');
  if (!input || input.scheduler?.schema !== 'xtend.rmt.kernel-scheduler.v1' || typeof input.scheduler.schedule !== 'function') throw new TypeError('Kernel adapters require the explicit RMT kernel scheduler v1 port.');
  fields(input,['scheduler','rootId','scope','lifecycle','work'],'Kernel work configuration');
  name(input.rootId); name(input.scope);
  const scheduler=input.scheduler, rootId=input.rootId, scope=input.scope, lifecycle=requestPolicy(input.lifecycle);
  const granted=input.work === undefined ? {} : input.work; data(granted); record(granted,'Named work');
  if (Array.isArray(granted) || Object.keys(granted).length>32) throw new TypeError('Named work must be a bounded policy map.');
  const policies=new Map(Object.entries(granted).map(([key,value])=>{name(key);return [key,requestPolicy(value)];}));
  const budget=budgetInput === undefined ? null : createWorkBudgetPolicy(budgetInput,scheduler,policies);
  const active=new Set(), history=[];
  let phase='mounting', epoch=0;
  function gate() { let release; const promise=new Promise(resolve=>{release=resolve;});return {promise,release}; }
  let activation=gate();
  function current(entry) { return phase==='active' && epoch===entry.epoch && !entry.abort.signal.aborted; }
  function finish(entry,error) {
    active.delete(entry); entry.abort.abort(); entry.unlink?.();
    history.push({id:entry.handle.id,kind:entry.kind,name:entry.name,lane:entry.lane,status:entry.handle.status});
    if(history.length>32)history.shift();
    if(error && entry.kind==='lifecycle' && ['aborted','cancelled','panic_blocked'].includes(entry.handle.status))lifecycleCancelled();
    if(error && entry.kind==='work' && error.code!=='xtensions.work.admission-rejected' && !['aborted','cancelled','panic_blocked'].includes(entry.handle.status)) { try { onFailure(error,entry.name); } catch (_) {} }
  }
  function submit(kind,workName,policy,callback) {
    const entry={kind,name:workName,lane:policy.lane,epoch,abort:new AbortController(),handle:null,unlink:null};
    const ready=activation.promise;
    const handle=scheduler.schedule({schema:'xtend.rmt.kernel-work.v1',rootId,scope,...policy,
      endpointName:`xtension.${kind}.${workName}`,metadata:{source:'xtension',...identity,operation:workName,workKind:kind,generation:epoch}},async context=>{
      if(context.rootId!==rootId || context.scope!==scope || context.lane!==policy.lane)throw new TypeError('Kernel context differs from the trusted request.');
      const metadata=Object.freeze({kernelJobId:context.jobId,kernelRootId:rootId,kernelScope:scope,kernelLane:context.lane});
      if(context.signal){const cancel=()=>{entry.abort.abort();if(kind==='lifecycle')lifecycleCancelled();};context.signal.addEventListener('abort',cancel,{once:true});entry.unlink=()=>context.signal.removeEventListener('abort',cancel);if(context.signal.aborted)cancel();}
      if(kind==='work') {
        await ready;
        if(!current(entry))throw abortError();
        budget?.start(workName);
        const isCurrent=()=>current(entry);
        return runBoundary(`work:${workName}`,()=>{beforeWork(workName);if(!isCurrent())throw abortError();budget?.start(workName);
          let chunkStart=budget?context.now():0;
          return callback(Object.freeze({jobId:context.jobId,signal:entry.abort.signal,isCurrent,
          shouldYield:()=>{if(!isCurrent())return true;const limit=budget?.limits(workName);return context.shouldYield()||!!limit&&context.now()-chunkStart>=limit.maxChunkMs;},
          async yield(reason){if(!isCurrent())throw abortError();await context.yield(reason);if(!isCurrent())throw abortError();if(budget)chunkStart=context.now();},
          guard(fn){if(typeof fn!=='function')throw new TypeError('Work guard requires a callback.');return (...args)=>isCurrent()?fn(...args):undefined;}}));},metadata);
      }
      if(phase==='disposed'||entry.abort.signal.aborted)throw abortError();
      return runBoundary(workName,callback,metadata);
    });
    if(!handle || handle.schema!=='xtend.rmt.kernel-job.v1' || !handle.result || typeof handle.result.then!=='function' || typeof handle.cancel!=='function') throw new TypeError('Kernel scheduler returned an invalid job handle.');
    entry.handle=handle;active.add(entry);
    handle.result.then(()=>finish(entry),error=>finish(entry,error)).catch(()=>{});
    if(phase==='disposed') {entry.abort.abort();handle.cancel('xtension-disposed');}
    else if(kind==='work' && (phase==='suspended'||entry.epoch!==epoch)) {entry.abort.abort();handle.cancel('xtension-suspended');}
    return {entry,handle};
  }
  function cancelledWork(error=abortError()) {
    const abort=new AbortController();abort.abort();const result=Promise.reject(error);result.catch(()=>{});
    return Object.freeze({jobId:null,signal:abort.signal,result,cancel:()=>false});
  }
  const work=Object.freeze({schedule(workName,callback){
    if(arguments.length!==2)throw new TypeError('Components select a granted name and callback, never scheduler options.');
    if(!policies.has(workName))throw new TypeError('Work name is not granted by the host.');
    if(typeof callback!=='function')throw new TypeError('Named work requires a cooperative callback.');
    if(phase==='disposed'||phase==='suspended')return cancelledWork();
    const admission=budget?.admit(workName,active);
    if(admission?.error)return cancelledWork(admission.error);
    try {
      if(admission?.victim){admission.victim.abort.abort();admission.victim.handle.cancel('xtension-work-replaced');}
      // Abort listeners may synchronously dispose or suspend the owning host.
      if(phase==='disposed'||phase==='suspended')return cancelledWork();
      const policy=admission?{...policies.get(workName),maxChunkMs:admission.limit.maxChunkMs}:policies.get(workName);
      const {entry,handle}=submit('work',workName,policy,callback);
      return Object.freeze({jobId:handle.id,signal:entry.abort.signal,result:handle.result,cancel(reason='component-cancelled'){entry.abort.abort();return handle.cancel(String(reason));}});
    } finally { admission?.release(); }
  }});
  return Object.freeze({work,
    ...(budget?{budgetSnapshot:()=>budget.snapshot(active)}:{}),
    runLifecycle(operation,callback){if(phase==='disposed')return Promise.reject(abortError());return submit('lifecycle',operation,lifecycle,callback).handle.result;},
    beginResume(){if(phase==='suspended')phase='resuming';},
    activate(){if(phase==='disposed')return;phase='active';activation.release();},
    suspend(){if(phase==='disposed')return;phase='suspended';epoch++;activation.release();activation=gate();for(const entry of [...active])if(entry.kind==='work'){entry.abort.abort();entry.handle.cancel('xtension-suspended');}},
    dispose(){if(phase==='disposed')return;phase='disposed';epoch++;activation.release();for(const entry of [...active]){entry.abort.abort();entry.handle.cancel('xtension-disposed');}},
    capabilities:freeze({schema:'xtend.xtensions.runtime-capabilities.v1',framework:identity.framework,lifecycle:'kernel-jobs',fabricBoundary:true,namedWork:[...policies.keys()].sort(),cooperativeResources:true,cooperativeCancellation:true,budgets:'cooperative',frameworkInternalScheduling:false,preemption:false,terminalCleanup:'immediate'}),
    snapshot(){return freeze({schema:'xtend.xtensions.kernel-work-scope.v1',phase,generation:epoch,
      pending:[...active].map(e=>({id:e.handle.id,kind:e.kind,name:e.name,lane:e.lane,status:e.handle.status})),history:clone(history)});}
  });
}
module.exports={createKernelWorkScope};
