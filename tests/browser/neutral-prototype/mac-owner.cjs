'use strict';
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function createMacObserver({launch,bundle,binary,driver,profileRoot}){
const snapshots=[];
let closed=false,launchError,leader,known=new Map(),cleanup;
launch.once('close',()=>{closed=true;});launch.once('error',error=>{launchError=error;});
const helper=path.join(__dirname,'mac-process-evidence.py');
function snapshot(){
  const value=JSON.parse(execFileSync('/usr/bin/python3',['-B',helper,String(launch.pid),bundle],{encoding:'utf8',timeout:5000}));
  const group=value.processes.filter(row=>row.group===launch.pid);
  const anchor=group.find(row=>known.get(row.pid)===row.start && row.state!==5);
  if(group.length && !anchor) throw Error('Owned macOS process-group continuity lost');
  for(const row of group) {
    if(row.uid!==process.getuid() || row.ruid!==row.uid || row.svuid!==row.uid)throw Error('Unexpected process privilege identity');
    known.set(row.pid,row.start);
  }
  snapshots.push(value);return value;
}
const owner={
  assertCurrent(){
    if(launchError || closed || !leader)throw Error('Owned driver not active');
    const value=snapshot();
    if(value.root?.start!==leader.start || value.root.executable!==driver || value.root.group!==launch.pid)throw Error('Driver process identity changed');
  },
  async stop(){
    if(cleanup)return cleanup;
    const signals=[];
    function remaining(){
      const rows=snapshot().processes.filter(row=>row.group===launch.pid);
      // macOS may report EPERM for a group whose last member is exiting but
      // whose child handle has not yet been reaped. Verify ESRCH after close;
      // empty snapshots alone never prove cleanup.
      if(!rows.length && closed){try{process.kill(-launch.pid,0);throw Error('Unobservable process group persists');}catch(error){if(error.code!=='ESRCH')throw error;}}
      return rows;
    }
    for(const [signal,budget] of [['SIGTERM',5000],['SIGKILL',3000]]) {
      let rows=remaining();
      if(rows.length){
        // A still-observed original process identity must witness group ownership.
        if(!rows.some(row=>known.get(row.pid)===row.start && row.state!==5))throw Error('No live continuity witness; refusing group signal');
        try{process.kill(-launch.pid,signal);signals.push(signal);}catch(error){if(error.code!=='ESRCH')throw error;}
      }
      const until=Date.now()+budget;
      while(Date.now()<until){rows=remaining();if(!rows.length && closed)break;await delay(50);}
      if(!rows.length && closed)break;
    }
    const rows=remaining();
    cleanup={complete:closed && rows.length===0,childReaped:closed,groupGone:rows.length===0,signals,remaining:rows.map(row=>row.pid)};
    return cleanup;
  }
};
const sandbox={async verify({identity}){
  owner.assertCurrent();
  const value=snapshot(),browser=value.processes.find(row=>row.pid===identity['moz:processID']);
  if(!browser || browser.executable!==binary || browser.group!==launch.pid)throw Error('Actual Firefox executable or ancestry mismatch');
  const profile=fs.realpathSync(identity['moz:profile']);
  if(!profile.startsWith(fs.realpathSync(profileRoot)+path.sep))throw Error('Firefox profile outside isolated test directory');
  const prefs=fs.readFileSync(path.join(profile,'user.js'),'utf8');
  if(/user_pref\("security\.sandbox\.(?:content|gpu|rdd)\.level",\s*0\)/.test(prefs))throw Error('Disabled sandbox preference');
  const content=value.processes.filter(row=>row.contentProcess);
  if(!content.length || content.some(row=>row.group!==launch.pid || row.seatbelt!==1))throw Error('Active owned macOS content sandbox not observed');
  return {status:'passed',scope:'macOS Seatbelt active on observed owned Firefox content processes; not Linux proof',
    browserPid:browser.pid,profile,contentProcesses:content.map(({pid,start,group,seatbelt,executable})=>({pid,start,group,seatbelt,executable})),
    limits:['Does not prove policy strength or every Firefox subprocess role','Undocumented OS query also used by Mozilla; not a Linux sandbox contract'],
    method:'sandbox_check(pid, NULL, 0) == 1',source:'https://raw.githubusercontent.com/mozilla-firefox/firefox/main/security/sandbox/mac/Sandbox.mm'};
}};

async function initialize(){
 await new Promise((resolve,reject)=>{launch.once('spawn',resolve);launch.once('error',reject);});
 const initial=JSON.parse(execFileSync('/usr/bin/python3',['-B',helper,String(launch.pid),bundle],{encoding:'utf8',timeout:5000}));
 leader=initial.root;
 if(!leader || leader.executable!==driver || leader.group!==launch.pid)throw Error('Owned driver spawn could not be identified');
 known.set(leader.pid,leader.start);snapshots.push(initial);
}
return {owner,sandbox,snapshots,initialize};
}
module.exports={createMacObserver};
