'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const pins=require('./toolchain-pins.json');
const cases=['bidi-preload-order-fetch','bidi-context-isolation','bidi-removal','core','a11y','lifecycle','lifecycle-wrong-key','lifecycle-foreign-origin'];
function shape(mode){if(!['diagnostic','initial','stability'].includes(mode))throw Error('Unknown campaign mode');return {replicas:mode==='stability'?3:1,cycles:mode==='stability'?2:1};}
const nodes=mode=>mode==='diagnostic'?['24.18.0']:pins.nodes;
function skipped(value){return value && typeof value==='object' && Object.entries(value).some(([key,item])=>(key==='skipped'&&Boolean(item))||(key==='status'&&item==='skipped')||skipped(item));}
function accepted(report,node){
  if(skipped(report) || report?.status!=='passed' || report.acceptedForRelease!==false || report.node!=='v'+node || report.platform!=='linux' ||
    report.evidenceKind!=='real-firefox-linux-qualification' || report.linuxExecution!=='observed' || report.identity?.browserVersion!==pins.firefox ||
    report.identity?.browserName!=='firefox' || !report.cleanup?.complete || !report.cleanup.groupGone || !report.cleanup.childReaped || report.cleanup.remaining?.length!==0)return false;
  const phases=['startup','sandbox','capabilities','product','qualification','sessionCleanup','groupCleanup'];
  if(phases.some(name=>report.phases?.[name]?.status!=='passed') || report.sandbox?.platform!=='linux')return false;
  const q=report.qualification;
  return q?.status==='passed' && q.acceptedForRelease===false && Object.keys(q.cases||{}).length===cases.length &&
    cases.every(name=>q.cases[name]?.status==='passed') && q.preloadCleanup?.status==='passed' && q.preloadCleanup.remaining===0 && q.transportCleanup?.status==='passed';
}
async function execute(evidence,toolchain,mode,replica){
  const config=shape(mode);if(!Number.isInteger(replica)||replica<1||replica>config.replicas)throw Error('Unexpected replica');
  const node=process.versions.node;if(!nodes(mode).includes(node))throw Error('Exact planned Node required');
  if(process.platform!=='linux')throw Error('Campaign execution requires real Linux');
  fs.mkdirSync(evidence,{recursive:true});
  const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA||'') || commit!==process.env.GITHUB_SHA)throw Error('Exact workflow commit required');
  const job={acceptedForRelease:false,mode,node,replica,commit,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,
    host:{imageOS:process.env.ImageOS||null,imageVersion:process.env.ImageVersion||null,kernel:os.release(),uid:process.getuid()},cycles:[],status:'running'};
  for(const file of ['/proc/sys/kernel/unprivileged_userns_clone','/proc/sys/kernel/apparmor_restrict_unprivileged_userns','/sys/module/apparmor/parameters/enabled']){
    try{(job.host.sandboxHost||={})[file]=fs.readFileSync(file,'utf8').trim();}catch(error){(job.host.sandboxHost||={})[file]={unavailable:error.code};}
  }
  const save=()=>fs.writeFileSync(path.join(evidence,'campaign.json'),JSON.stringify(job,null,2)+'\n');save();
  for(let cycle=1;cycle<=config.cycles;cycle++){
    const work=path.join(path.dirname(evidence),`session-${replica}-${cycle}`),dest=path.join(evidence,'cycle-'+cycle);
    fs.mkdirSync(dest,{recursive:false});let report;
    try{report=await require('./run-firefox.cjs').main([work,toolchain]);}
    catch(error){report={status:'failed',error:error.message,acceptedForRelease:false};}
    for(const name of ['report.json','driver.log','process-observations.json','proc-events.json','ownership-observations.json'])if(fs.existsSync(path.join(work,name)))fs.copyFileSync(path.join(work,name),path.join(dest,name));
    job.cycles.push({cycle,status:accepted(report,node)?'passed':'failed'});save();
    // Planned repetitions are not retries. Uncertain cleanup blocks later starts.
    if(!report.cleanup?.complete){for(let next=cycle+1;next<=config.cycles;next++)job.cycles.push({cycle:next,status:'not-run',reason:'preceding cleanup incomplete'});break;}
  }
  job.status=job.cycles.length===config.cycles && job.cycles.every(r=>r.status==='passed')?'passed':'failed';save();
  if(job.status!=='passed')process.exitCode=1;return job;
}
function aggregate(directory,mode){
  const config=shape(mode),result={acceptedForRelease:false,status:'failed',mode,expectedJobs:nodes(mode).length*config.replicas,expectedSessions:nodes(mode).length*config.replicas*config.cycles,errors:[],jobs:[]};
  try{
    const seen=new Set();let provenance;
    // download-artifact flattens a single match. Locate evidence, not arbitrary
    // directories (cycle-1/runtime), and reject mixed, nested or orphan layouts.
    const markers=[],reports=[];
    function scan(dir){
      for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
        const file=path.join(dir,entry.name);
        assert(!entry.isSymbolicLink(),'Symlink in qualification evidence');
        if(entry.isDirectory())scan(file);
        else if(['job-terminal.json','campaign.json'].includes(entry.name))markers.push(file);
        else if(entry.name==='report.json')reports.push(file);
      }
    }
    scan(directory);
    const roots=[...new Set(markers.map(file=>path.dirname(file)))];
    assert(roots.every(dir=>dir===directory||path.dirname(dir)===directory),'Nested job evidence');
    assert(!(roots.includes(directory)&&roots.length!==1),'Mixed flat and directory job evidence');
    const expectedReports=new Set();
    for(const dir of roots){
      assert(markers.includes(path.join(dir,'job-terminal.json'))&&markers.includes(path.join(dir,'campaign.json')),'Orphan job evidence');
      const cycleDirs=fs.readdirSync(dir).filter(name=>/^cycle-/.test(name)).sort();
      assert.deepEqual(cycleDirs,Array.from({length:config.cycles},(_,i)=>'cycle-'+(i+1)).sort(),'Unexpected cycle evidence');
      const terminal=JSON.parse(fs.readFileSync(path.join(dir,'job-terminal.json'),'utf8'));
      assert(nodes(mode).includes(terminal.node));assert(Number.isInteger(terminal.replica)&&terminal.replica>=1 && terminal.replica<=config.replicas);assert.equal(terminal.mode,mode);
      const key=terminal.node+'/'+terminal.replica;assert(!seen.has(key),'Duplicate job');seen.add(key);
      assert(['install','runtime','controls','provision','browser'].every(id=>terminal.outcomes[id]==='success'),'Failed, missing or skipped workflow step');
      const job=JSON.parse(fs.readFileSync(path.join(dir,'campaign.json'),'utf8'));
      assert.equal(job.node,terminal.node);assert.equal(job.replica,terminal.replica);assert.equal(job.mode,mode);assert.equal(job.acceptedForRelease,false);
      assert(/^[a-f0-9]{40}$/.test(job.commit));assert(/^\d+$/.test(job.runId||''));assert(/^[1-9]\d*$/.test(job.attempt||''));
      if(process.env.GITHUB_SHA)assert.equal(job.commit,process.env.GITHUB_SHA,'Wrong workflow commit');
      if(process.env.GITHUB_RUN_ID)assert.equal(job.runId,process.env.GITHUB_RUN_ID,'Wrong workflow run');
      if(process.env.GITHUB_RUN_ATTEMPT)assert.equal(job.attempt,process.env.GITHUB_RUN_ATTEMPT,'Wrong workflow attempt');
      const bound=[job.commit,job.runId,job.attempt].join('/');
      if(provenance)assert.equal(bound,provenance,'Mixed source/run evidence');else provenance=bound;
      assert.equal(job.status,'passed');assert.equal(job.cycles.length,config.cycles);
      for(let cycle=1;cycle<=config.cycles;cycle++){
        expectedReports.add(path.join(dir,'cycle-'+cycle,'report.json'));
        assert.equal(job.cycles[cycle-1].cycle,cycle);assert.equal(job.cycles[cycle-1].status,'passed');
        assert(accepted(JSON.parse(fs.readFileSync(path.join(dir,'cycle-'+cycle,'report.json'),'utf8')),job.node),'Incomplete real Linux report');
      }
      result.jobs.push({key,commit:job.commit,status:'passed'});
    }
    assert.deepEqual(reports.sort(),[...expectedReports].sort(),'Unexpected or missing report evidence');
    assert.equal(seen.size,result.expectedJobs,'Incomplete job matrix');result.status='passed';
  }catch(error){result.errors.push(error.message);}
  return result;
}
if(require.main===module){
  const [mode,...args]=process.argv.slice(2);
  if(mode==='run')execute(path.resolve(args[0]),fs.realpathSync(args[1]),args[2],Number(args[3])).catch(error=>{console.error(error);process.exitCode=1;});
  else if(mode==='aggregate'){const result=aggregate(path.resolve(args[0]),args[1]);fs.writeFileSync(args[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.status!=='passed')process.exitCode=1;}
  else throw Error('Expected run or aggregate');
}
module.exports={shape,accepted,aggregate};
