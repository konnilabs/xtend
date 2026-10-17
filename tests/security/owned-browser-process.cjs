'use strict';
// Private Linux browser-test lifecycle. Only groups created here are signalled.
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const delay=()=>new Promise(resolve=>setTimeout(resolve,25));
const termMs=2000,killMs=2000;
function identity(pid){
  try{
    const raw=fs.readFileSync('/proc/'+pid+'/stat','utf8'),fields=raw.slice(raw.lastIndexOf(')')+2).trim().split(/\s+/);
    if(!Number.isSafeInteger(pid)||pid<=0||!raw.startsWith(pid+' (')||fields.length<20)throw Error('Invalid owned process identity');
    return {pid,state:fields[0],parent:Number(fields[1]),group:Number(fields[2]),session:Number(fields[3]),start:fields[19]};
  }catch(error){if(error.code==='ENOENT'||error.code==='ESRCH')return null;throw error;}
}
function groupMembers(group){
  // Read-only process enumeration; no names/executables are used to select kills.
  return fs.readdirSync('/proc').filter(name=>/^[1-9]\d*$/.test(name)).map(name=>identity(Number(name)))
    .filter(record=>record&&record.group===group);
}
function observeChild(child){
  const state={closed:false,error:null};
  child.once('close',()=>{state.closed=true;});child.once('error',error=>{state.error=error;});
  return state;
}
function spawnOwned(command,args,options){
  if(process.platform!=='linux')throw Error('Owned browser cleanup requires Linux');
  const child=spawn(command,args,{...options,detached:true}),state=observeChild(child);
  // PID is the exact session/process-group identifier allocated by this spawn.
  const group=child.pid;let leaderStart,retired=false,cleanup,ownershipError;
  const owned=new Map(),live=record=>record&&/^[RSDTtWIP]$/.test(record.state);
  const same=(record,start)=>live(record)&&record.start===start&&record.group===group&&record.session===group;
  function continuous(records,saved=owned){
    for(const record of records){
      const start=saved.get(record.pid);
      if(start&&same(record,start)&&same(identity(record.pid),start))return record;
    }
    throw Error('Owned group continuity lost; refusing to signal an uncertain/reused group');
  }
  function members(){
    if(ownershipError)throw ownershipError;
    if(!group||retired)return [];
    const records=groupMembers(group),leader=records.find(record=>record.pid===group);
    if(!records.length){
      // A zero-signal existence probe cannot kill or grant ownership. If an
      // unobserved/reused group exists, fail rather than declaring it gone.
      try{process.kill(-group,0);}catch(error){if(error.code==='ESRCH'){retired=true;return [];}throw error;}
      throw Error('Process group exists without an observable owned identity');
    }
    if(group===identity(process.pid)?.group||records.some(record=>record.session!==group))throw Error('Owned process-group identity mismatch');
    if(leader&&leader.start!==leaderStart)throw Error('Owned group leader PID was reused');
    // No reseeding from a numeric session/group after the original leader dies.
    // Learn additional members only while an already saved identity is live.
    continuous(records);
    for(const record of records)if(live(record))owned.set(record.pid,record.start);
    return records;
  }
  child.once('spawn',()=>{
    try{
      const leader=identity(group);
      if(state.closed||!live(leader)||leader.group!==group||leader.session!==group)throw Error('Launched group leader could not be authenticated');
      leaderStart=leader.start;owned.set(leader.pid,leader.start);members();
    }catch(error){ownershipError=error;state.error=error;}
  });
  // Preserve observed child identities before leader exit. Missing an entire
  // lifetime is intentionally a failed cleanup, never permission to guess.
  const monitor=setInterval(()=>{try{members();}catch(error){ownershipError=error;state.error=error;}},100);
  function signal(name){
    const saved=new Map(owned),records=members();
    if(!records.length)return false;
    // Require a fresh PID/start match saved BEFORE this signal's lookup.
    // There is no await between the final identity recheck and group syscall.
    continuous(records,saved);
    try{process.kill(-group,name);}catch(error){if(error.code!=='ESRCH')throw error;}
    return true;
  }
  async function waitUntil(deadline){
    while(performance.now()<deadline){if(!members().length&&state.closed)return true;await delay();}
    return !members().length&&state.closed;
  }
  async function stop(){
    if(cleanup)return cleanup;
    cleanup=(async()=>{
      const started=performance.now(),signals=[];
      try{
        if(signal('SIGTERM'))signals.push('SIGTERM');
        let clean=await waitUntil(started+termMs);
        // Leader exit does not authorize a new group: KILL needs continuity too.
        if(!clean&&signal('SIGKILL'))signals.push('SIGKILL');
        clean=await waitUntil(started+termMs+killMs);
        const remaining=members();
        const result={group:group||null,leaderStart:leaderStart||null,signals,remaining:remaining.map(row=>row.pid),
          childReaped:state.closed,groupGone:remaining.length===0,complete:clean,termMs,killMs};
        if(!clean){const error=Error('Owned browser process group was not gone/reaped within bounded cleanup');error.cleanup=result;throw error;}
        return result;
      }catch(error){
        if(!error.cleanup)error.cleanup={group:group||null,leaderStart:leaderStart||null,signals,remaining:null,
          childReaped:state.closed,groupGone:false,complete:false,termMs,killMs,ownershipError:error.message};
        throw error;
      }finally{clearInterval(monitor);}
    })();
    return cleanup;
  }
  return {child,group,state,stop};
}
function supervisedGroup(){
  const text=process.env.XTEND_CORE_SECURITY_SUPERVISOR_PID;
  if(text===undefined)return null;
  if(!/^[1-9]\d*$/.test(text))throw Error('Invalid Core browser supervisor identity');
  const supervisor=identity(Number(text)),self=identity(process.pid);
  if(!supervisor||!self||self.group===supervisor.group||self.session!==self.group)throw Error('Missing isolated Core browser test group');
  let current=self;const seen=new Set();
  for(let count=0;count<64&&current&&current.pid!==supervisor.pid;count++){
    if(seen.has(current.pid))throw Error('Core browser supervisor ancestry cycle');
    seen.add(current.pid);current=identity(current.parent);
  }
  if(current?.pid!==supervisor.pid)throw Error('Core browser test does not descend from its exact supervisor');
  return self.group;
}
function spawnBrowser(command,args){
  const group=supervisedGroup();
  if(group===null){
    const owned=spawnOwned(command,args);let stopping=false;
    const handlers=new Map([['SIGINT',130],['SIGTERM',143],['SIGHUP',129]].map(([name,code])=>[name,()=>{
      if(stopping)return;stopping=true;
      owned.stop().then(()=>process.exit(code),()=>process.exit(1));
    }]));
    for(const [name,handler]of handlers)process.on(name,handler);
    const stop=async()=>{try{return await owned.stop();}finally{for(const [name,handler]of handlers)process.off(name,handler);}};
    return {...owned,stop};
  }
  // The runner owns the whole isolated Node+Chromium group, even if a leader exits.
  const child=spawn(command,args,{detached:false}),state=observeChild(child);let cleanup;
  async function stop(){
    if(cleanup)return cleanup;
    cleanup=(async()=>{
      const started=performance.now();
      // This child is reaped here; surviving descendants remain in the outer
      // owned group and are unconditionally checked/stopped by the runner.
      if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');
      while(!state.closed&&performance.now()<started+termMs)await delay();
      if(!state.closed&&child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
      while(!state.closed&&performance.now()<started+termMs+killMs)await delay();
      if(!state.closed)throw Error('Owned Chromium child was not reaped within bounded cleanup');
    })();return cleanup;
  }
  return {child,group,state,stop};
}
module.exports={spawnOwned,spawnBrowser,termMs,killMs};
