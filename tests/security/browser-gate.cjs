'use strict';
// Internal diagnostics only. A blocked preflight never supplies security proof.
class InfrastructureBlocked extends Error {}
function startupFailure({stderr, exitCode, signalCode}) {
  const message = String(stderr || 'Chromium did not expose a DevTools endpoint').slice(-65536);
  // Classify only an observed failed launch. Timeouts, assertions, unsafe
  // configuration and later browser failures must not become infrastructure.
  const error = ((Number.isInteger(exitCode) && exitCode !== 0) || typeof signalCode === 'string') && /No usable sandbox!/.test(message)
    ? new InfrastructureBlocked(message) : new Error(message);
  if (error instanceof InfrastructureBlocked) error.startup = {stderr:message, exitCode, signalCode};
  return error;
}
function outcome(phases) {
  if (phases.cleanup.status === 'failed' || phases.preflight.status === 'failed' || phases.product.status === 'failed') return 'failed';
  if (phases.preflight.status === 'infrastructure-blocked' && phases.product.status === 'not-run' && phases.cleanup.status === 'passed') return 'infrastructure-blocked';
  if ([phases.preflight, phases.product, phases.cleanup].every(row => row.status === 'passed')) return 'passed';
  return 'not-provided';
}
async function runBrowserGate({preflight, product, cleanup}) {
  const phases = {preflight:{status:'not-run'}, product:{status:'not-run'}, cleanup:{status:'not-run'}};
  let session;
  try {
    try {
      session = await preflight();
      phases.preflight = {status:'passed'};
    } catch (error) {
      phases.preflight = {status:error instanceof InfrastructureBlocked ? 'infrastructure-blocked' : 'failed', reason:error.message};
      if (error.startup) phases.preflight.startup = error.startup;
    }
    if (phases.preflight.status === 'passed') {
      try { await product(session); phases.product = {status:'passed'}; }
      catch (error) { phases.product = {status:'failed', reason:error.message}; }
    }
  } finally {
    try { await cleanup(session); phases.cleanup = {status:'passed'}; }
    catch (error) {
      phases.cleanup = {status:'failed', reason:error.message};
      if (error.cleanup) phases.cleanup.details = error.cleanup;
    }
  }
  return {...phases, status:outcome(phases)};
}
function requirePassedGate(gate) {
  if (!gate || gate.status !== 'passed' || outcome(gate) !== 'passed') {
    throw Error('Browser preflight, product assertions and cleanup evidence must all pass');
  }
}

// PR policy is a separate decision. Raw test/runner outcomes remain strict.
const blockedFailure='Required real Chromium sandbox startup infrastructure unavailable';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual:equal}=require('node:util');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
function requireCleanup(value){
  const {termMs,killMs}=require('./owned-browser-process.cjs');
  check(value?.complete===true&&value.childReaped===true&&value.groupGone===true&&equal(value.remaining,[])&&
    Number.isSafeInteger(value.group)&&value.group>0&&/^[0-9]+$/.test(value.leaderStart||'')&&
    value.termMs===termMs&&value.killMs===killMs&&
    [[],['SIGTERM'],['SIGTERM','SIGKILL']].some(signals=>equal(signals,value.signals)), 'Incomplete owned process cleanup');
}
function requireTap(stdout,blocked){
  check(typeof stdout==='string','Missing raw browser TAP');
  for(const [name,count]of [['tests',1],['pass',blocked?0:1],['fail',blocked?1:0],['cancelled',0],['skipped',0],['todo',0]]){
    const values=[...stdout.matchAll(new RegExp('^# '+name+' (\\d+)$','gm'))];
    check(values.length===1&&Number(values[0][1])===count,'Unexpected browser TAP outcome: '+name);
  }
  check(!/^Bail out!/m.test(stdout),'Browser TAP bailout');
  if(blocked)check(/^not ok 1 - Chromium reparses production sanitizer output and preserves TrustedHTML through the runtime sink$/m.test(stdout)&&
    /^  failureType: 'testCodeFailure'$/m.test(stdout)&&/^  code: 'ERR_ASSERTION'$/m.test(stdout)&&
    /^  expected: 'passed'$/m.test(stdout)&&/^  actual: 'infrastructure-blocked'$/m.test(stdout)&&
    !/generated asynchronous activity|uncaughtException|unhandledRejection/.test(stdout),'Unexpected browser test failure');
}
function requireBlockedStartup(gate,startedAt,finishedAt){
  check(gate?.status==='infrastructure-blocked'&&outcome(gate)==='infrastructure-blocked'&&gate.preflightProof===null,
    'Missing exact blocked preflight/product-not-run/cleanup-passed evidence');
  const launch=gate.launch,diagnostic=gate.preflight.startup,browser=launch?.browser;
  const {pin,browserArguments}=require('./sandboxed-browser.cjs');
  check(launch?.devTools===false&&launch.spawnError===null&&Number.isSafeInteger(launch.pid)&&launch.pid>0,
    'Missing observed pre-DevTools launch');
  check(browser?.version===pin.version&&browser.archiveSha256===pin.archives['chrome-linux64.zip']&&
    /^[a-f0-9]{64}$/.test(browser.sha256||'')&&Number.isSafeInteger(browser.size)&&browser.size>0&&
    typeof browser.binary==='string'&&path.isAbsolute(browser.binary)&&Number.isSafeInteger(browser.uid)&&browser.uid>0&&
    Number.isSafeInteger(browser.gid)&&browser.gid>0&&Array.isArray(launch.argv)&&
    typeof launch.argv[0]==='string'&&launch.argv[0].startsWith('--user-data-dir=')&&
    equal(launch.argv,browserArguments(launch.argv[0].slice('--user-data-dir='.length))), 'Unverified browser identity/configuration');
  check(diagnostic&&diagnostic.exitCode===launch.exitCode&&diagnostic.signalCode===launch.signalCode&&
    ((Number.isInteger(launch.exitCode)&&launch.exitCode>0&&launch.signalCode===null)||
      (launch.exitCode===null&&['SIGABRT','SIGTRAP'].includes(launch.signalCode)))&&
    typeof diagnostic.stderr==='string'&&diagnostic.stderr===gate.preflight.reason&&
    /(?:^|\n)\[\d+:\d+:[^\n]*:FATAL:content\/browser\/zygote_host\/zygote_host_impl_linux\.cc:\d+\] No usable sandbox!/.test(diagnostic.stderr),
    'Unrecognized sandbox startup termination');
  const start=Date.parse(launch.startedAt),end=Date.parse(launch.finishedAt);
  check(Number.isFinite(start)&&Number.isFinite(end)&&start>=Date.parse(startedAt)&&start<=end&&end<=Date.parse(finishedAt),
    'Stale or contradictory browser launch evidence');
}
function sourceIdentity(rootDir){
  const git=args=>require('node:child_process').execFileSync('git',args,{cwd:rootDir,maxBuffer:256*1024*1024});
  const untracked=git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean).sort();
  return {commit:git(['rev-parse','HEAD']).toString().trim(),sourceFingerprint:hash(Buffer.concat([git(['diff','HEAD','--binary']),
    Buffer.from(untracked.map(file=>`${file}\0${hash(fs.readFileSync(path.join(rootDir,file)))}`).join('\n'))])),
    catalogFingerprint:require('../../scripts/test-runner/catalog').fingerprint(),
    sourceHashes:require('../../scripts/release/core-security.cjs').sourceHashes(rootDir)};
}
function policyContext(env,mode,source){
  const workflow=mode==='gate'?'security-scan-regressions.yml':'xtend-default-gates.yml';
  check(['gate','execution'].includes(mode)&&env.GITHUB_ACTIONS==='true'&&env.GITHUB_EVENT_NAME==='pull_request'&&
    env.GITHUB_REPOSITORY==='konnilabs/xtend'&&/^refs\/pull\/[1-9][0-9]*\/merge$/.test(env.GITHUB_REF||'')&&
    env.GITHUB_WORKFLOW_REF==='konnilabs/xtend/.github/workflows/'+workflow+'@'+env.GITHUB_REF&&
    /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID||'')&&/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT||'')&&
    /^[a-f0-9]{40}$/.test(env.XTEND_POLICY_SOURCE_SHA||'')&&env.XTEND_POLICY_SOURCE_SHA===source.commit,
    'PR-only browser policy requires exact workflow/source/run/attempt context');
  return {repository:env.GITHUB_REPOSITORY,workflow:env.GITHUB_WORKFLOW_REF,ref:env.GITHUB_REF,
    run:env.GITHUB_RUN_ID+':'+env.GITHUB_RUN_ATTEMPT,sourceSha:source.commit,node:process.version,
    platform:process.platform,arch:process.arch,nodeOptions:env.NODE_OPTIONS||''};
}
function evaluatePolicy(raw,receipt){
  const outer=receipt.producer;
  check(receipt.policy==='pull-request'&&['gate','execution'].includes(receipt.mode)&&/^[a-f0-9]{64}$/.test(receipt.invocation||''),
    'Missing PR invocation receipt');
  check(outer&&!outer.abortCause&&!outer.cleanupError&&outer.signal===null&&[0,1].includes(outer.status),'Unexpected producer failure');
  check(outer.kind===(receipt.mode==='gate'?'process':'runner'),'Unexpected producer supervision');
  if(receipt.mode==='gate'){
    requireCleanup(outer.cleanup);
    check(typeof outer.stderr==='string'&&outer.stderr.trim()==='','Unexpected browser command stderr');
  }
  let gate=raw,stdout=outer.stdout,blocked;
  if(receipt.mode==='execution'){
    const security=require('../../scripts/release/core-security.cjs'),source=receipt.source,context=receipt.context;
    check(raw?.schema===require('../../scripts/test-runner/executor').SCHEMA&&raw.profile===security.id&&raw.complete===true&&
      raw.commit===source.commit&&raw.sourceFingerprint===source.sourceFingerprint&&raw.catalogFingerprint===source.catalogFingerprint&&
      context.node==='v'+security.node&&raw.run===context.run&&raw.runtime?.node===context.node&&raw.runtime.platform===context.platform&&raw.runtime.arch===context.arch&&
      raw.runtime.nodeOptions===context.nodeOptions&&equal(raw.expected,[security.id])&&raw.results?.length===1&&raw.executions?.length===1&&
      !raw.infrastructureErrors?.length,'Core execution provenance/coverage mismatch');
    const verified=require('../../scripts/test-runner/executor').verifyExecution({verify:security.id,executionReport:raw,project:false,
      provenance:{commit:source.commit,sourceFingerprint:source.sourceFingerprint,catalogFingerprint:source.catalogFingerprint,
        run:context.run,runtime:raw.runtime}});
    check(verified.errors.length===0,'Core execution verification errors');
    const entry=raw.results[0],result=entry.result,report=result?.report;
    check(entry.id===security.id&&entry.executionId===security.id&&raw.executions[0].executionId===security.id&&
      entry.abortCause===null&&raw.executions[0].abortCause===null&&result.id===security.id&&
      result.skipCount===0&&equal(result.skips,[])&&report?.node===security.node&&
      equal(report.command,['node','--test','--test-reporter=tap','tests/security/browser.test.mjs'])&&
      report.sourceIntegrity==='passed'&&equal(report.sourceHashes,source.sourceHashes)&&report.abortCause===null&&report.cleanupError===null&&
      report.signal===null&&typeof report.stderr==='string'&&report.stderr.trim()==='',
      'Unexpected Core suite/command/source/supervisor outcome');
    requireCleanup(report.cleanup);gate=report.browserGate;stdout=report.stdout;blocked=gate?.status==='infrastructure-blocked';
    check(raw.status===(blocked?'failed':'passed')&&verified.status===raw.status&&result.status===raw.status&&
      result.exitCode===(blocked?1:0)&&report.exitCode===(blocked?1:0)&&result.failureCount===(blocked?1:0)&&
      equal(result.failures,blocked?[blockedFailure]:[])&&(!blocked||report.browserProof===null), 'Extra or contradictory Core failure');
    for(const value of [raw,entry,raw.executions[0],report]){
      const start=Date.parse(value.startedAt),end=Date.parse(value.completedAt||value.finishedAt);
      check(Number.isFinite(start)&&Number.isFinite(end)&&start>=Date.parse(receipt.startedAt)&&start<=end&&end<=Date.parse(receipt.finishedAt),
        'Stale Core execution evidence');
    }
  }
  check(gate?.invocation===receipt.invocation,'Browser evidence belongs to another invocation');
  blocked=gate.status==='infrastructure-blocked';
  check(outer.status===(blocked?1:0),'Contradictory producer exit');requireTap(stdout,blocked);
  if(blocked){
    requireBlockedStartup(gate,receipt.startedAt,receipt.finishedAt);
    check(equal(gate.launch.browser,receipt.configuredBrowser),'Launch differs from independently verified browser configuration');
  }else requirePassedGate(gate);
  return {outcome:blocked?'infrastructure-not-executed':'passed',browserSecurityCoverage:blocked?'unavailable':'executed',
    releaseEligible:false};
}
function readRegular(file){
  check(fs.lstatSync(file).isFile()&&fs.realpathSync(file)===file&&fs.statSync(file).size<=16*1024*1024,'Missing regular bounded evidence');
  return fs.readFileSync(file);
}
function printPolicy(decision){
  const text=['## Browser PR policy', '', '- outcome: '+decision.outcome,
    '- browser security coverage: '+decision.browserSecurityCoverage,
    '- release eligible: false (release requires separate strict authenticated evidence)', ''].join('\n');
  console.log(text);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
}
async function runPolicy(mode,file){
  const rootDir=path.resolve(__dirname,'../..');file=path.resolve(file);
  check(file.startsWith(path.join(rootDir,'.xtend-test-results')+path.sep),'Policy report must be in the checkout results directory');
  for(let parent=path.dirname(file);parent!==path.dirname(parent);parent=path.dirname(parent)){
    try{check(fs.lstatSync(parent).isDirectory()&&fs.realpathSync(parent)===parent,'Symlinked/non-directory report parent');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const policyFile=file+'.policy.json';
  for(const target of [file,policyFile]){
    try{fs.lstatSync(target);throw Error('Fresh raw report and policy receipt required');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const source=sourceIdentity(rootDir),context=policyContext(process.env,mode,source),invocation=crypto.randomBytes(32).toString('hex');
  const receipt={policy:'pull-request',mode,invocation,source,context,startedAt:new Date().toISOString()};
  try{
    receipt.configuredBrowser=require('./sandboxed-browser.cjs').configuredBrowser();
    receipt.producer=await require('../../scripts/release/core-security.cjs').runPolicyProducer({rootDir,mode,file,
      environment:{...process.env,XTEND_BROWSER_POLICY_INVOCATION:invocation}});
    receipt.finishedAt=new Date().toISOString();
    check(equal(source,sourceIdentity(rootDir)),'Source changed during browser policy execution');
    check(equal(receipt.configuredBrowser,require('./sandboxed-browser.cjs').configuredBrowser()),'Browser configuration changed during execution');
    const bytes=readRegular(file);receipt.rawSha256=hash(bytes);
    receipt.decision=evaluatePolicy(JSON.parse(bytes),receipt);
  }catch(error){receipt.error=error.message;receipt.decision={outcome:'failed',browserSecurityCoverage:'not-accepted',releaseEligible:false};}
  receipt.finishedAt ||= new Date().toISOString();
  fs.writeFileSync(policyFile,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});printPolicy(receipt.decision);
  if(receipt.error)throw Error(receipt.error);
}
function summarizePolicy(file){
  const rootDir=path.resolve(__dirname,'../..');file=path.resolve(file);
  const receipt=JSON.parse(readRegular(file+'.policy.json')),source=sourceIdentity(rootDir);
  check(!receipt.error&&equal(receipt.source,source)&&equal(receipt.context,policyContext(process.env,receipt.mode,source)),
    'Failed, substituted or changed-source policy receipt');
  const start=Date.parse(receipt.startedAt),end=Date.parse(receipt.finishedAt),now=Date.now();
  check(Number.isFinite(start)&&Number.isFinite(end)&&start<=end&&end<=now&&now-start<=15*60*1000,'Stale policy receipt');
  const bytes=readRegular(file);check(hash(bytes)===receipt.rawSha256,'Substituted raw browser report');
  const decision=evaluatePolicy(JSON.parse(bytes),receipt);check(equal(decision,receipt.decision),'Contradictory policy decision');
  printPolicy(decision);
}
async function main() {
  const [action,argument,target]=process.argv.slice(2);
  if(action==='--run-pr'&&process.argv.length===5)return runPolicy(argument,target);
  if(action==='--policy'&&process.argv.length===4)return summarizePolicy(argument);
  const fs = require('node:fs'), [mode, file] = process.argv.slice(2);
  if (!['--gate', '--execution'].includes(mode) || !file || process.argv.length !== 4) throw Error('Expected --gate|--execution FILE');
  let gate, supervisor;
  if (fs.existsSync(file)) {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (mode === '--gate') gate = value;
    else {
      const report = value.results?.find(row => row.id === 'core-security-browser')?.result?.report;
      gate = report?.browserGate;
      supervisor = report?.cleanupError || report?.cleanup?.complete !== true ? 'failed or not-provided' : 'passed';
    }
  }
  const lines = ['## Chromium preflight and product evidence', '',
    ...['preflight', 'product', 'cleanup'].map(name => `- ${name}: ${gate?.[name]?.status || 'not-provided'}`),
    ...(supervisor ? ['- outer process-group cleanup: ' + supervisor] : []),
    '', 'Infrastructure-blocked or missing coverage is not a security pass. Release proof remains separately required.', ''];
  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  // A successful summary step cannot turn a blocked/missing test into green.
  process.exitCode = gate && outcome(gate) === 'passed' && gate.status === 'passed' &&
    (mode === '--gate' || supervisor === 'passed') ? 0 : 1;
}
module.exports = {InfrastructureBlocked, startupFailure, runBrowserGate, outcome, requirePassedGate, blockedFailure,
  requireBlockedStartup, requireCleanup, requireTap, policyContext, evaluatePolicy, runPolicy, summarizePolicy};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
