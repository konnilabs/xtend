'use strict';
const fs=require('node:fs'),path=require('node:path');
const {InfrastructureBlocked}=require('./adapter.cjs');
function parseStat(text,pid){
  const fields=text.slice(text.lastIndexOf(')')+2).trim().split(/\s+/);
  if(!text.startsWith(pid+' (') || fields.length<20 || !/^\d+$/.test(fields[19]))throw Error('Invalid proc identity');
  return {pid,state:fields[0],parent:Number(fields[1]),group:Number(fields[2]),session:Number(fields[3]),start:fields[19]};
}
function parseStatus(text){
  const map=Object.fromEntries(text.trim().split('\n').map(line=>{const i=line.indexOf(':');return [line.slice(0,i),line.slice(i+1).trim()];}));
  const number=key=>{if(!/^\d+$/.test(map[key]||''))throw Error('Missing kernel field '+key);return Number(map[key]);};
  if(!/^\d+(\s+\d+){3}$/.test(map.Uid||'') || !/^[0-9a-f]+$/i.test(map.CapEff||''))throw Error('Missing privilege identity');
  return {uids:map.Uid.split(/\s+/).map(Number),noNewPrivs:number('NoNewPrivs'),seccomp:number('Seccomp'),filters:number('Seccomp_filters'),capEff:map.CapEff};
}
function same(a,b){return a && b && a.pid===b.pid && a.start===b.start && a.group===b.group && a.session===b.session;}
function live(row){return row && !['Z','X','x'].includes(row.state);}
// Firefox 158 ForkServer/SetProcessTitle also exposes one space-joined title.
// Role text never substitutes for executable/start/UID/thread authentication.
function processRole(text){
  const unknown={role:'unknown',format:'unrecognized',contentProcess:false};
  if(typeof text!=='string' || !text.endsWith('\0') || /[\r\n\t]/.test(text))return unknown;
  const args=text.split('\0').filter(Boolean),joined=args.length===1;
  const tokens=joined ? args[0].split(' ') : args;
  if(!tokens.length || tokens.some(s=>!s) || tokens.filter(s=>s==='-contentproc').length!==1 ||
    tokens.some(s=>s!=='-contentproc' && s.includes('-contentproc')))return unknown;
  // Flattened paths containing spaces are ambiguous: never guess boundaries.
  if(!/^\/(?:[^\0\r\n\t]+\/)*firefox(?:-bin)?$/.test(tokens[0]) || (joined&&/\s/.test(tokens[0])) || tokens[1]!=='-contentproc')return unknown;
  const roles=['tab','socket','rdd','gpu','utility','gmplugin','vr','forkserver'],role=tokens.at(-1);
  if(!roles.includes(role) || tokens.slice(2,-1).some(s=>roles.includes(s)))return unknown;
  return {role,format:joined?'joined-title':'nul-argv',contentProcess:role==='tab'};
}
class Continuity {
  constructor(leader){this.group=leader.group;this.leader=leader;this.known=new Map([[leader.pid,leader.start]]);}
  observe(rows){
    if(!rows.length)throw Error('Owned group is no longer observable');
    if(rows.some(r=>r.group!==this.group || r.session!==this.group))throw Error('Owned session/group mismatch');
    const leader=rows.find(r=>r.pid===this.leader.pid);
    if(leader && !same(leader,this.leader))throw Error('Owned leader PID reused');
    if(!rows.some(r=>live(r) && this.known.get(r.pid)===r.start))throw Error('Owned process-group continuity lost');
    for(const r of rows)if(live(r))this.known.set(r.pid,r.start);
  }
}
function validateContent(rows,browser,uid,executables){
  const content=rows.filter(r=>r.contentProcess);
  if(!content.length)throw new InfrastructureBlocked('No authenticated Firefox content process observed');
  for(const row of content){
    if(!executables.includes(row.executable) || !live(row) || row.group!==browser.group || row.session!==browser.session)throw Error('Content executable/ownership mismatch');
    if(!row.threads?.length)throw new InfrastructureBlocked('Content thread sandbox evidence missing');
    for(const thread of row.threads){
      if(thread.uids.some(value=>value!==uid) || !/^0+$/.test(thread.capEff))throw Error('Content process has unexpected privileges');
      if(thread.seccomp!==2 || thread.noNewPrivs!==1 || thread.filters<=browser.security.filters)
        throw new InfrastructureBlocked('Content-specific seccomp/NoNewPrivs evidence absent');
    }
  }
  return content;
}
// Every tolerated departure needs a previously read kernel identity and a fresh
// absence/terminal-state observation. No missing security field becomes a pass.
const threadObservationLimits=Object.freeze({milliseconds:250,rounds:8,identities:256});
function createProcReader({io=fs,events=[],now=()=>performance.now()}={}){
  const absent=error=>['ENOENT','ESRCH'].includes(error.code);
  const identity=(pid,tid)=>{
    try{return parseStat(io.readFileSync(tid===undefined?`/proc/${pid}/stat`:`/proc/${pid}/task/${tid}/stat`,'utf8'),tid??pid);}
    catch(error){if(absent(error))return null;throw error;}
  };
  function note(expected,tid,thread,stage,error,processNow,threadNow,outcome){
    const value={event:'proc-read-transition',observedAt:new Date().toISOString(),monotonicMs:performance.now(),
      object:tid===undefined?'process':'thread',process:expected,thread:tid===undefined?null:thread||{pid:tid,start:null},
      stage,errno:/^[A-Z0-9]+$/.test(error.code||'')?error.code:null,processNow,threadNow:threadNow||null,outcome};
    events.push(value);return value;
  }
  function failure(expected,tid,thread,stage,error){
    let current,task;
    try{
      current=identity(expected.pid);
      if(current&&!same(current,expected))throw Error('Process identity changed during observation');
      if(absent(error)&&(!current||!live(current))){
        note(expected,tid,thread,stage,error,current,null,'process-ended');return 'process-ended';
      }
      if(tid!==undefined&&current){
        task=identity(expected.pid,tid);
        if(thread&&task&&!same(task,thread))throw Error('Thread identity changed during observation');
        if(absent(error)&&thread&&(!task||!live(task))){
          // The parent remains the same live process across the task lookup.
          const after=identity(expected.pid);
          if(!same(current,after))throw Error('Parent identity changed while confirming thread exit');
          note(expected,tid,thread,stage,error,after,task,'thread-ended');return 'thread-ended';
        }
      }
    }catch(check){note(expected,tid,thread,stage,error,current||null,task,'identity-unresolved');throw check;}
    note(expected,tid,thread,stage,error,current||null,task,'security-evidence-unavailable');
    throw new InfrastructureBlocked(`Owned /proc evidence unavailable: pid=${expected.pid}`+
      (tid===undefined?'':` tid=${tid}`)+` stage=${stage} errno=${error.code||'unknown'}`);
  }
  const ended=()=>Object.assign(Error('Kernel object ended'),{code:'ENOENT'});
  function read(expected){
    let stage='process-identity';
    try{
      const before=identity(expected.pid);
      if(!before||!live(before))throw ended();
      if(!same(before,expected))throw Error('Process identity changed before observation');
      stage='process-executable';const executable=io.readlinkSync(`/proc/${before.pid}/exe`);
      stage='process-status';const security=parseStatus(io.readFileSync(`/proc/${before.pid}/status`,'utf8'));
      stage='process-role';const role=processRole(io.readFileSync(`/proc/${before.pid}/cmdline`,'utf8'));
      const threads=[],knownThreads=new Map(),measured=new Map(),departed=new Set();let threadObservation;
      if(role.contentProcess){
        const started=now();let rounds=0;
        function limit(reason){
          note(before,undefined,undefined,'thread-observation-limit',{},before,null,reason);
          throw new InfrastructureBlocked(`Content thread observation ${reason}: pid=${before.pid}`);
        }
        const budget=()=>{if(now()-started>=threadObservationLimits.milliseconds)limit('time limit exceeded');};
        function remember(tid,current){
          const saved=knownThreads.get(tid);
          if(saved&&!same(saved,current)){
            note(before,tid,saved,'thread-identity-continuity',{},before,current,'identity-unresolved');
            throw Error('Thread identity changed during observation');
          }
          if(!saved&&knownThreads.size>=threadObservationLimits.identities)limit('identity limit exceeded');
          knownThreads.set(tid,current);
        }
        function list(){
          budget();const ids=io.readdirSync(`/proc/${before.pid}/task`).filter(n=>/^[1-9]\d*$/.test(n)).map(Number);budget();
          if(ids.length>threadObservationLimits.identities)limit('identity limit exceeded');
          return ids;
        }
        stage='thread-list';let pending=list();
        for(;;){
          budget();if(++rounds>threadObservationLimits.rounds)limit('round limit exceeded');
          // Only newly observed identities are measured. A failed read is never
          // retried, and successful samples remain subject to validateContent.
          for(const tid of pending){
            budget();let thread=knownThreads.get(tid),threadStage='thread-identity';
            try{
              const current=identity(before.pid,tid);if(!current)throw ended();remember(tid,current);thread=current;
              if(!live(thread))throw ended();
              if(thread.group!==before.group||thread.session!==before.session)throw Error('Thread ownership mismatch');
              budget();threadStage='thread-status';const status=parseStatus(io.readFileSync(`/proc/${before.pid}/task/${tid}/status`,'utf8'));
              budget();threadStage='thread-identity-after';const after=identity(before.pid,tid);if(!after||!live(after))throw ended();
              if(!same(thread,after))throw Error('Thread identity changed during observation');
              const sample={tid,identity:thread,...status};threads.push(sample);measured.set(tid,sample);
            }catch(error){
              if(!absent(error)&&!['EACCES','EPERM'].includes(error.code))throw error;
              if(failure(before,tid,thread,threadStage,error)==='process-ended')return null;
              departed.add(tid);
            }
          }
          stage='thread-list-after';pending=[];let liveAtEnd=0;
          for(const tid of list()){
            budget();let current;
            try{current=identity(before.pid,tid);if(!current||!live(current))throw ended();}
            catch(error){if(!absent(error))throw error;if(failure(before,tid,knownThreads.get(tid),'thread-final-identity',error)==='process-ended')return null;departed.add(tid);continue;}
            const known=knownThreads.has(tid);remember(tid,current);liveAtEnd++;
            if(departed.has(tid))throw Error('Ended thread identity became live during observation');
            if(!measured.has(tid)){
              pending.push(tid);
              if(!known)note(before,tid,current,'thread-discovery',{},before,current,'pending-security-measurement');
            }
          }
          budget();
          if(!pending.length){
            if(!liveAtEnd)throw new InfrastructureBlocked('No surviving content thread evidence');
            const elapsedMs=now()-started;if(elapsedMs>=threadObservationLimits.milliseconds)limit('time limit exceeded');
            threadObservation={rounds,identities:knownThreads.size,measured:measured.size,departed:departed.size,
              liveAtEnd,elapsedMs,limits:threadObservationLimits,scope:'bounded snapshot; not continuous lifetime coverage'};
            break;
          }
        }
      }
      const namespaces={};
      for(const name of ['user','pid','net','ipc','mnt']){stage='namespace-'+name;namespaces[name]=io.readlinkSync(`/proc/${before.pid}/ns/${name}`);}
      stage='process-identity-after';const after=identity(before.pid);if(!after||!live(after))throw ended();
      if(!same(before,after))throw Error('Proc identity changed during observation');
      return {...before,executable,security,contentProcess:role.contentProcess,role:role.role,argumentFormat:role.format,threads,threadObservation,namespaces};
    }catch(error){
      if(!absent(error)&&!['EACCES','EPERM'].includes(error.code))throw error;
      failure(expected,undefined,undefined,stage,error);return null;
    }
  }
  return {read,identity};
}
function createLinuxObserver({owned,binary,driver,profileRoot}){
  if(process.platform!=='linux' || process.getuid()===0)throw Error('Linux observer requires unprivileged Linux');
  const {child:launch,group}=owned,snapshots=[],procEvents=[];let continuity;
  const reader=createProcReader({events:procEvents});
  const stat=pid=>{const row=reader.identity(pid);if(!row)throw Object.assign(Error('Process absent'),{code:'ENOENT'});return row;};
  function snapshot(){
    if(owned.state.error)throw owned.state.error;
    const records=[],all=[];
    for(const name of fs.readdirSync('/proc').filter(n=>/^[1-9]\d*$/.test(n))){
      try {const row=stat(Number(name));all.push(row);if(row.group===group)records.push(row);}
      catch(error){if(!['ENOENT','ESRCH'].includes(error.code))throw error;}
    }
    const descendants=new Set([group]);
    for(let changed=true;changed;){changed=false;for(const row of all)if(descendants.has(row.parent)&&!descendants.has(row.pid)){descendants.add(row.pid);changed=true;}}
    if(all.some(row=>live(row) && row.group!==group && (descendants.has(row.pid)||continuity.known.get(row.pid)===row.start)))throw Error('Owned descendant escaped the original process group');
    continuity.observe(records);
    let rows;
    try{rows=records.filter(live).map(r=>reader.read(r)).filter(Boolean);}
    catch(error){if(['EACCES','EPERM','ENOENT','ESRCH'].includes(error.code))throw new InfrastructureBlocked('Owned /proc sandbox evidence unavailable: '+error.code);throw error;}
    if(rows.some(r=>r.security.uids.some(uid=>uid!==process.getuid())))throw Error('Unexpected owned process user');
    snapshots.push({platform:'linux',observedAt:new Date().toISOString(),monotonicMs:performance.now(),processes:rows});return rows;
  }
  const owner={assertCurrent(){
    if(owned.state.error || owned.state.closed || launch.exitCode!==null || launch.signalCode!==null)throw owned.state.error || Error('Driver stopped');
    const row=stat(group);if(!same(row,continuity?.leader)||fs.readlinkSync(`/proc/${group}/exe`)!==driver)throw Error('Driver identity changed');
  },observeTransition:event=>owned.observe?.(event),stop:()=>owned.stop()};
  const sandbox={async verify({identity}){
    owner.assertCurrent();const rows=snapshot(),browser=rows.find(r=>r.pid===identity['moz:processID']);
    const candidates=[binary,path.join(path.dirname(binary),'firefox-bin')].filter(p=>fs.existsSync(p)).map(p=>fs.realpathSync(p));
    if(!browser || !candidates.includes(browser.executable))throw Error('Firefox executable identity mismatch');
    const profile=fs.realpathSync(identity['moz:profile']);
    if(!profile.startsWith(fs.realpathSync(profileRoot)+path.sep))throw Error('Profile outside owned root');
    const prefs=fs.readFileSync(path.join(profile,'user.js'),'utf8');
    if(/user_pref\("security\.sandbox\.[^"]+",\s*(?:0|false)\)/.test(prefs))throw Error('Unexpected sandbox override');
    const content=validateContent(rows,browser,process.getuid(),candidates);
    return {status:'passed',platform:'linux',scope:'owned Firefox content threads: extra seccomp filter, NoNewPrivs, zero effective capabilities',
      browserPid:browser.pid,profile,contentProcesses:content,
      namespaceIsolation:content.map(r=>({pid:r.pid,differentFromBrowser:Object.keys(r.namespaces).filter(k=>r.namespaces[k]!==browser.namespaces[k])})),
      limits:['Kernel filter presence does not prove filter rules, broker policy or every subprocess role','Namespace observations are reported separately, never substituted for missing seccomp evidence'],acceptedForRelease:false};
  }};
  async function initialize(){
    await new Promise((resolve,reject)=>{launch.once('spawn',resolve);launch.once('error',reject);});
    const leader=stat(group);if(leader.group!==group || leader.session!==group || !live(leader))throw Error('Unowned Linux leader');
    continuity=new Continuity(leader);owner.assertCurrent();
  }
  return {owner,sandbox,snapshots,procEvents,initialize};
}
module.exports={parseStat,parseStatus,same,processRole,threadObservationLimits,createProcReader,Continuity,validateContent,createLinuxObserver};
