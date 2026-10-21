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
function createLinuxObserver({owned,binary,driver,profileRoot}){
  if(process.platform!=='linux' || process.getuid()===0)throw Error('Linux observer requires unprivileged Linux');
  const {child:launch,group}=owned,snapshots=[];let continuity;
  const stat=pid=>parseStat(fs.readFileSync(`/proc/${pid}/stat`,'utf8'),pid);
  function read(pid){
    const before=stat(pid),executable=fs.readlinkSync(`/proc/${pid}/exe`);
    const security=parseStatus(fs.readFileSync(`/proc/${pid}/status`,'utf8'));
    // Only exact owned group members are inspected; no arguments/environment are emitted.
    const args=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8').split('\0').filter(Boolean);
    const contentProcess=args.at(-1)==='tab' && args.includes('-contentproc');
    const threads=contentProcess ? fs.readdirSync(`/proc/${pid}/task`).filter(n=>/^\d+$/.test(n)).map(tid=>({tid:Number(tid),...parseStatus(fs.readFileSync(`/proc/${pid}/task/${tid}/status`,'utf8'))})):[];
    const namespaces={};
    for(const name of ['user','pid','net','ipc','mnt'])namespaces[name]=fs.readlinkSync(`/proc/${pid}/ns/${name}`);
    if(!same(before,stat(pid)))throw Error('Proc identity changed during observation');
    return {...before,executable,security,contentProcess,threads,namespaces};
  }
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
    try{rows=records.filter(live).map(r=>read(r.pid));}
    catch(error){if(['EACCES','EPERM','ENOENT','ESRCH'].includes(error.code))throw new InfrastructureBlocked('Owned /proc sandbox evidence unavailable: '+error.code);throw error;}
    if(rows.some(r=>r.security.uids.some(uid=>uid!==process.getuid())))throw Error('Unexpected owned process user');
    snapshots.push({platform:'linux',processes:rows});return rows;
  }
  const owner={assertCurrent(){
    if(owned.state.error || owned.state.closed || launch.exitCode!==null || launch.signalCode!==null)throw owned.state.error || Error('Driver stopped');
    const row=stat(group);if(!same(row,continuity?.leader)||fs.readlinkSync(`/proc/${group}/exe`)!==driver)throw Error('Driver identity changed');
  },stop:()=>owned.stop()};
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
  return {owner,sandbox,snapshots,initialize};
}
module.exports={parseStat,parseStatus,same,Continuity,validateContent,createLinuxObserver};
