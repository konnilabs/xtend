'use strict';
// Opt-in, disposable GitHub-hosted Ubuntu 24.04 experiment. Never a release gate.
// Only apparmor_parser and reading the loaded-profile list use sudo. The test
// and its Chromium children retain the calling user's identity and capabilities.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {isDeepStrictEqual:equal}=require('node:util');
const {configuredBrowser}=require('../tests/security/sandboxed-browser.cjs');
const {runPolicyProducer}=require('./release/core-security.cjs');
const {requirePassedGate}=require('../tests/security/browser-gate.cjs');
const rootDir=path.resolve(__dirname,'..');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const read=file=>fs.readFileSync(file,'utf8').trim();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const policyFiles=['/proc/sys/kernel/apparmor_restrict_unprivileged_userns',
  '/proc/sys/kernel/unprivileged_userns_clone','/proc/sys/user/max_user_namespaces',
  '/sys/module/apparmor/parameters/enabled'];
const hostPolicy=()=>Object.fromEntries(policyFiles.map(file=>[file,read(file)]));
function runnerContext(mode,env=process.env,osRelease=read('/etc/os-release')){
  check(['gate','execution'].includes(mode),'Select gate or execution');
  check(env.GITHUB_ACTIONS==='true'&&env.RUNNER_ENVIRONMENT==='github-hosted'&&
    env.GITHUB_REPOSITORY==='konnilabs/xtend'&&env.ImageOS==='ubuntu24'&&
    env.RUNNER_OS==='Linux'&&env.RUNNER_ARCH==='X64'&&
    /^ID=ubuntu$/m.test(osRelease)&&/^VERSION_ID="24\.04"$/m.test(osRelease),
    'Experiment requires a disposable GitHub-hosted Ubuntu 24.04 x64 runner');
  check(env.GITHUB_EVENT_NAME==='workflow_dispatch'||(env.GITHUB_EVENT_NAME==='push'&&
    env.GITHUB_REF==='refs/heads/experiment/apparmor-userns'),'Explicit experiment trigger required');
  check(/^[1-9]\d*$/.test(env.GITHUB_RUN_ID||'')&&/^[1-9]\d*$/.test(env.GITHUB_RUN_ATTEMPT||''),
    'Exact GitHub run/attempt required');
  check(typeof env.RUNNER_TEMP==='string'&&/^\/[A-Za-z0-9_./-]+$/.test(env.RUNNER_TEMP)&&
    path.resolve(env.RUNNER_TEMP)===env.RUNNER_TEMP,'Literal canonical runner temporary path required');
  const binary=path.join(env.RUNNER_TEMP,'xtend-apparmor-browser/chrome-linux64/chrome');
  const profile='xtend-userns-'+hash([env.GITHUB_REPOSITORY,env.GITHUB_RUN_ID,env.GITHUB_RUN_ATTEMPT,mode].join(':')).slice(0,32);
  return {binary,profile};
}
function profileText({binary,profile}){
  // Reject every AppArmor glob, variable, escape, quote and newline. No includes
  // of local overrides; the ABI is the system's standard AppArmor 4.0 ABI.
  check(/^\/[A-Za-z0-9_./-]+$/.test(binary)&&path.resolve(binary)===binary&&
    /^xtend-userns-[a-f0-9]{32}$/.test(profile),'Literal profile attachment required');
  return `abi <abi/4.0>,\nprofile ${profile} "${binary}" flags=(unconfined) {\n  userns,\n}\n`;
}
const sudo=(command,args,input)=>execFileSync('/usr/bin/sudo',['-n',command,...args],
  {input,encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
const loadedProfiles=()=>sudo('/usr/bin/cat',['/sys/kernel/security/apparmor/profiles']);
const present=(profiles,name)=>profiles.split('\n').some(line=>line.startsWith(name+' ('));
function removeProfile(context,text){
  if(present(loadedProfiles(),context.profile))sudo('/usr/sbin/apparmor_parser',['--remove','--skip-cache'],text);
  check(!present(loadedProfiles(),context.profile),'Temporary AppArmor profile remains loaded');
}
async function withTemporaryProfile({add,remove,run}){
  // Also remove after a partially successful load or cancellation. The workflow
  // has an independent always() cleanup step for forced termination of Node.
  try {await add();return await run();}
  finally {await remove();}
}
function validateGate(gate){requirePassedGate(gate);}
async function main(mode,cleanupOnly=false){
  const context=runnerContext(mode),text=profileText(context);
  check(typeof process.getuid==='function'&&process.getuid()>0&&process.geteuid()===process.getuid(),
    'Experiment and tests must run as the original non-root user');
  const output=path.join(rootDir,'.xtend-test-results/apparmor-'+mode);
  fs.mkdirSync(output,{recursive:true});
  if(cleanupOnly){
    removeProfile(context,text);
    const reportFile=path.join(output,'experiment.json');
    if(fs.existsSync(reportFile))check(equal(hostPolicy(),JSON.parse(read(reportFile)).policyBefore),
      'Host policy changed during experiment');
    fs.writeFileSync(path.join(output,'final-cleanup.json'),JSON.stringify({profile:context.profile,absent:true,policy:hostPolicy()})+'\n');
    return;
  }
  check(process.versions.node==='24.18.0','Committed Node24 pin required');
  check(fs.realpathSync(process.env.RUNNER_TEMP)===process.env.RUNNER_TEMP,'Real runner temporary directory required');
  const before=configuredBrowser();
  check(before.binary===context.binary,'Only the pinned experiment browser path may receive a profile');
  const beforePolicy=hostPolicy();
  check(beforePolicy[policyFiles[0]]==='1'&&beforePolicy[policyFiles[1]]==='1'&&
    Number(beforePolicy[policyFiles[2]])>0&&beforePolicy[policyFiles[3]]==='Y',
    'Expected restricted AppArmor/userns host policy is not active');
  check(!present(loadedProfiles(),context.profile),'Refusing to replace an existing profile');
  // Compile-only validation uses no elevated privileges, cache or kernel writes.
  execFileSync('/usr/sbin/apparmor_parser',['--skip-kernel-load','--skip-cache'],{input:text,timeout:15000});
  fs.writeFileSync(path.join(output,'profile.apparmor'),text,{flag:'wx',mode:0o600});
  const report={mode,profile:context.profile,attachment:context.binary,profileSha256:hash(text),
    browserBefore:before,policyBefore:beforePolicy,startedAt:new Date().toISOString(),status:'failed',cleanup:'not-run'};
  const previous=process.env.XTEND_SECURITY_APPARMOR_PROFILE;
  let interrupted=false;
  const onSignal=()=>{interrupted=true;};
  for(const name of ['SIGINT','SIGTERM','SIGHUP'])process.on(name,onSignal);
  try{
    await withTemporaryProfile({
      add:()=>{
        sudo('/usr/sbin/apparmor_parser',['--add','--skip-cache'],text);
        check(present(loadedProfiles(),context.profile),'Profile load was not observed');
        process.env.XTEND_SECURITY_APPARMOR_PROFILE=context.profile;
      },
      run:async()=>{
        check(!interrupted,'Experiment interrupted before test');
        const file=path.join(output,mode==='gate'?'browser-gate.json':'security-execution.json');
        report.producer=await runPolicyProducer({rootDir,mode,file,environment:{...process.env,
          XTEND_SECURITY_HOST_DIAGNOSTICS:'1',XTEND_CORE_BROWSER_PROOF:path.join(output,'browser-proof.json')}});
        if(mode==='gate'){
          fs.writeFileSync(path.join(output,'browser.tap'),report.producer.stdout);
          fs.writeFileSync(path.join(output,'browser.stderr'),report.producer.stderr);
          validateGate(JSON.parse(read(file)));
          check(report.producer.cleanup?.complete===true&&!report.producer.cleanupError,'Owned test group cleanup failed');
        }
        check(!interrupted&&report.producer.status===0&&!report.producer.signal&&!report.producer.abortCause,
          'Strict browser producer failed or was interrupted');
        report.browserAfter=configuredBrowser();
        check(equal(before,report.browserAfter),'Browser binary, archive or identity changed during experiment');
      },
      remove:()=>{
        try {removeProfile(context,text);report.cleanup='passed';}
        catch(error){report.cleanup='failed';report.cleanupError=error.message;throw error;}
      }
    });
    check(equal(beforePolicy,hostPolicy()),'Host userns/AppArmor settings changed during experiment');
    report.status='passed';
  }catch(error){report.error=error.message;throw error;}
  finally{
    if(previous===undefined)delete process.env.XTEND_SECURITY_APPARMOR_PROFILE;
    else process.env.XTEND_SECURITY_APPARMOR_PROFILE=previous;
    for(const name of ['SIGINT','SIGTERM','SIGHUP'])process.off(name,onSignal);
    report.finishedAt=new Date().toISOString();report.policyAfter=hostPolicy();
    fs.writeFileSync(path.join(output,'experiment.json'),JSON.stringify(report,null,2)+'\n');
  }
}
module.exports={runnerContext,profileText,present,withTemporaryProfile,validateGate};
if(require.main===module)main(process.argv[2],process.argv[3]==='--cleanup').catch(error=>{console.error(error.message);process.exitCode=1;});
