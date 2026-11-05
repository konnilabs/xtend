'use strict';
// Temporary exact-path AppArmor lifecycle for the two regular browser gates
// and the retained isolated experiment on disposable GitHub-hosted runners.
// Only apparmor_parser and reading the loaded-profile list use sudo. The test
// and its Chromium children retain the calling user's identity and capabilities.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {isDeepStrictEqual:equal}=require('node:util');
const {configuredBrowser}=require('../tests/security/sandboxed-browser.cjs');
const {runPolicyProducer}=require('./release/core-security.cjs');
const {requirePassedGate,runPolicy}=require('../tests/security/browser-gate.cjs');
const rootDir=path.resolve(__dirname,'..');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const read=file=>fs.readFileSync(file,'utf8').trim();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const policyFiles=['/proc/sys/kernel/apparmor_restrict_unprivileged_userns',
  '/proc/sys/kernel/unprivileged_userns_clone','/proc/sys/user/max_user_namespaces',
  '/sys/module/apparmor/parameters/enabled'];
const hostPolicy=()=>Object.fromEntries(policyFiles.map(file=>[file,read(file)]));
function runnerContext(mode,env=process.env,osRelease=read('/etc/os-release')){
  check(['gate','execution','regular-gate','regular-execution'].includes(mode),'Unknown browser gate');
  const regular=mode.startsWith('regular-'),producerMode=regular?mode.slice('regular-'.length):mode;
  check(env.GITHUB_ACTIONS==='true'&&env.RUNNER_ENVIRONMENT==='github-hosted'&&
    env.GITHUB_REPOSITORY==='konnilabs/xtend'&&env.ImageOS==='ubuntu24'&&
    env.RUNNER_OS==='Linux'&&env.RUNNER_ARCH==='X64'&&
    /^ID=ubuntu$/m.test(osRelease)&&/^VERSION_ID="24\.04"$/m.test(osRelease),
    'AppArmor lifecycle requires a disposable GitHub-hosted Ubuntu 24.04 x64 runner');
  if(regular){
    const workflow=producerMode==='gate'?'security-scan-regressions.yml':'xtend-default-gates.yml';
    const job=producerMode==='gate'?'browser-security':'core-security-browser';
    const branch=/^refs\/heads\/.+$/.test(env.GITHUB_REF||'');
    check(env.GITHUB_JOB===job&&env.GITHUB_WORKFLOW_REF===
      'konnilabs/xtend/.github/workflows/'+workflow+'@'+env.GITHUB_REF,
      'Exact regular browser workflow and job required');
    check((env.GITHUB_EVENT_NAME==='workflow_dispatch'&&branch)||
      (env.GITHUB_EVENT_NAME==='push'&&['refs/heads/main','refs/heads/master','refs/heads/develop'].includes(env.GITHUB_REF))||
      (env.GITHUB_EVENT_NAME==='pull_request'&&/^refs\/pull\/[1-9]\d*\/merge$/.test(env.GITHUB_REF||'')),
      'Unsupported regular browser gate event');
  }else check(env.GITHUB_EVENT_NAME==='workflow_dispatch'||(env.GITHUB_EVENT_NAME==='push'&&
    env.GITHUB_REF==='refs/heads/experiment/apparmor-userns'),'Explicit experiment trigger required');
  check(/^[1-9]\d*$/.test(env.GITHUB_RUN_ID||'')&&/^[1-9]\d*$/.test(env.GITHUB_RUN_ATTEMPT||''),
    'Exact GitHub run/attempt required');
  check(typeof env.RUNNER_TEMP==='string'&&/^\/[A-Za-z0-9_./-]+$/.test(env.RUNNER_TEMP)&&
    path.resolve(env.RUNNER_TEMP)===env.RUNNER_TEMP,'Literal canonical runner temporary path required');
  const binary=path.join(env.RUNNER_TEMP,regular?'xtend-security-browser':'xtend-apparmor-browser','chrome-linux64/chrome');
  const profile='xtend-userns-'+hash([env.GITHUB_REPOSITORY,env.GITHUB_RUN_ID,env.GITHUB_RUN_ATTEMPT,mode].join(':')).slice(0,32);
  return {binary,profile,regular,producerMode};
}
function evidenceTarget(context,output){
  if(!context.regular)return path.join(output,context.producerMode==='gate'?'browser-gate.json':'security-execution.json');
  return path.join(rootDir,'.xtend-test-results',context.producerMode==='gate'?
    'security-browser-gate.json':'core-security/security-execution.json');
}
function producerOutcome(producer,policy){
  check(!producer.signal&&!producer.abortCause&&!producer.cleanupError,'Browser producer or owned cleanup failed');
  if(policy){
    check(policy.releaseEligible===false,'PR policy must not establish release eligibility');
    if(policy.outcome==='infrastructure-not-executed'){
      check(producer.status===1&&policy.browserSecurityCoverage==='unavailable','Contradictory PR infrastructure outcome');
      return policy.outcome;
    }
    check(policy.outcome==='passed'&&policy.browserSecurityCoverage==='executed','PR browser policy failed');
  }
  check(producer.status===0,'Strict browser producer failed');return 'passed';
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
    'AppArmor lifecycle and tests must run as the original non-root user');
  const output=path.join(rootDir,'.xtend-test-results/apparmor-'+mode);
  const recordFile=path.join(output,context.regular?'lifecycle.json':'experiment.json');
  fs.mkdirSync(output,{recursive:true});
  if(cleanupOnly){
    removeProfile(context,text);
    if(fs.existsSync(recordFile))check(equal(hostPolicy(),JSON.parse(read(recordFile)).policyBefore),
      'Host policy changed during browser gate');
    fs.writeFileSync(path.join(output,'final-cleanup.json'),JSON.stringify({profile:context.profile,absent:true,policy:hostPolicy()})+'\n');
    return;
  }
  check(process.versions.node==='24.18.0','Committed Node24 pin required');
  check(fs.realpathSync(process.env.RUNNER_TEMP)===process.env.RUNNER_TEMP,'Real runner temporary directory required');
  const before=configuredBrowser();
  check(before.binary===context.binary,'Only the pinned gate browser path may receive a profile');
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
        check(!interrupted,'Browser gate interrupted before test');
        const file=evidenceTarget(context,output);fs.mkdirSync(path.dirname(file),{recursive:true});
        if(context.regular&&process.env.GITHUB_EVENT_NAME==='pull_request'){
          // Preserve the existing PR-only policy and nonce-bound raw evidence.
          // The lifecycle receipt records unavailable coverage explicitly.
          await runPolicy(context.producerMode,file);
          const receipt=JSON.parse(read(file+'.policy.json'));
          report.producer=receipt.producer;report.policy=receipt.decision;
        }else report.producer=await runPolicyProducer({rootDir,mode:context.producerMode,file,environment:{...process.env,
          XTEND_SECURITY_HOST_DIAGNOSTICS:'1',XTEND_CORE_BROWSER_PROOF:path.join(output,'browser-proof.json')}});
        if(context.producerMode==='gate'){
          fs.writeFileSync(path.join(output,'browser.tap'),report.producer.stdout);
          fs.writeFileSync(path.join(output,'browser.stderr'),report.producer.stderr);
        }
        const outcome=producerOutcome(report.producer,report.policy);
        if(context.producerMode==='gate'){
          if(outcome==='passed')validateGate(JSON.parse(read(file)));
          check(report.producer.cleanup?.complete===true&&!report.producer.cleanupError,'Owned test group cleanup failed');
        }
        check(!interrupted,'Browser gate was interrupted');report.coverageOutcome=outcome;
        report.browserAfter=configuredBrowser();
        check(equal(before,report.browserAfter),'Browser binary, archive or identity changed during browser gate');
      },
      remove:()=>{
        try {removeProfile(context,text);report.cleanup='passed';}
        catch(error){report.cleanup='failed';report.cleanupError=error.message;throw error;}
      }
    });
    check(equal(beforePolicy,hostPolicy()),'Host userns/AppArmor settings changed during browser gate');
    report.status=report.coverageOutcome;
  }catch(error){report.error=error.message;throw error;}
  finally{
    if(previous===undefined)delete process.env.XTEND_SECURITY_APPARMOR_PROFILE;
    else process.env.XTEND_SECURITY_APPARMOR_PROFILE=previous;
    for(const name of ['SIGINT','SIGTERM','SIGHUP'])process.off(name,onSignal);
    report.finishedAt=new Date().toISOString();report.policyAfter=hostPolicy();
    fs.writeFileSync(recordFile,JSON.stringify(report,null,2)+'\n');
  }
}
module.exports={runnerContext,evidenceTarget,producerOutcome,profileText,present,withTemporaryProfile,validateGate};
if(require.main===module)main(process.argv[2],process.argv[3]==='--cleanup').catch(error=>{console.error(error.message);process.exitCode=1;});
