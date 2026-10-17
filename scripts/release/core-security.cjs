'use strict';
// Existing runner report, one dedicated Node24 security job. No new envelope.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawnOwned,termMs,killMs}=require('../../tests/security/owned-browser-process.cjs');
const {isDeepStrictEqual}=require('node:util');
const {createSuiteContext}=require('../../tests/utils/assertions');
const {assertSourceProvider}=require('../../tools/schema-inventory/source-provider.cjs');
const {pin,browserArguments}=require('../../tests/security/sandboxed-browser.cjs');
const {check}=require('./inventory.cjs');
const id='core-security-browser',node='24.18.0',job='Core security browser (Node 24.18.0)';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceFiles=Object.freeze(['tests/security/browser.test.mjs','tests/security/sandboxed-browser.cjs',
  'tests/security/owned-browser-process.cjs','scripts/test-runner/worker.js',
  'scripts/release/core-security.cjs','scripts/node_warning_policy.cjs','security/static-files.cjs',
  'xtendrmt/html-sanitizer.mjs','xtendrmt/html-sanitizer.cjs','xtendrmt/rmt-runtime.esm.js','xtendrmt/rmt-node-ssr-adapter.js']);
const argv=Object.freeze(['--test','--test-reporter=tap','tests/security/browser.test.mjs']);
const sourceHashes=root=>Object.fromEntries(sourceFiles.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
function verifyTap(stdout){
  check(typeof stdout==='string','Raw real-browser TAP output required');
  for(const [name,expected]of [['tests',1],['pass',1],['fail',0],['cancelled',0],['skipped',0],['todo',0]]){
    const matches=[...stdout.matchAll(new RegExp('^# '+name+' (\\d+)$','gm'))];
    check(matches.length===1&&Number(matches[0][1])===expected,'Missing, skipped or contradictory real-browser TAP outcome: '+name);
  }
}
async function runBrowserTest(rootDir,proofFile,signal){
  check(signal===undefined||signal instanceof AbortSignal,'Exact AbortSignal required');
  const owned=spawnOwned(process.execPath,argv,{cwd:rootDir,env:{...process.env,
    XTEND_CORE_BROWSER_PROOF:proofFile,XTEND_CORE_SECURITY_SUPERVISOR_PID:String(process.pid)}});
  const {child}=owned;const result={status:null,signal:null,stdout:'',stderr:'',abortCause:null,cleanup:null};
  let settled=false,complete,timer;const done=new Promise(resolve=>{complete=resolve;});
  const finish=cause=>{if(cause&&!result.abortCause)result.abortCause=cause;if(settled)return;settled=true;complete();};
  let bytes=0;
  const output=(name,chunk)=>{
    bytes+=Buffer.byteLength(chunk);
    if(bytes>8*1024*1024){finish('output-limit');return;}
    result[name]+=chunk;
  };
  const abort=()=>finish('abort'),interrupt=()=>finish('SIGINT'),terminate=()=>finish('SIGTERM'),
    hangup=()=>finish('SIGHUP'),disconnect=()=>finish('IPC-disconnect');
  try{
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    child.stdout.on('data',chunk=>output('stdout',chunk));child.stderr.on('data',chunk=>output('stderr',chunk));
    child.on('error',error=>finish('spawn-error: '+error.message));
    child.on('spawn',()=>{if(owned.state.error)finish('group-identity: '+owned.state.error.message);});
    child.on('exit',(code,name)=>{result.status=code;result.signal=name;finish(null);});
    process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);process.on('SIGHUP',hangup);process.on('disconnect',disconnect);
    signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish('timeout-120000ms'),120000);
    if(signal?.aborted)abort();
    await done;
  }catch(error){finish('supervisor-error: '+error.message);}
  finally{
    clearTimeout(timer);
    // Stop the exact group even on a normal leader exit: its children may live.
    try{result.cleanup=await owned.stop();}
    catch(error){result.cleanup=error.cleanup||null;result.cleanupError=error.message;}
    finally{
      signal?.removeEventListener('abort',abort);
      process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);process.off('SIGHUP',hangup);process.off('disconnect',disconnect);
      child.stdout?.destroy();child.stderr?.destroy();
    }
  }
  return result;
}
async function runCoreSecuritySuite({rootDir,signal}){
  const context=createSuiteContext({id,label:'Core sanitizer and Trusted Types actual sandboxed Chromium'});
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-security-'));
  const report={command:['node',...argv],node:process.versions.node,startedAt:new Date().toISOString(),
    sourceHashes:sourceHashes(rootDir),exitCode:null,signal:null,browserProof:null,stdout:'',stderr:''};
  try{
    check(process.versions.node===node,'Dedicated security suite requires committed Node24 pin');
    // Launcher rejects root/unconfigured/unsupported host before any browser spawn.
    require('../../tests/security/sandboxed-browser.cjs').configuredBrowser();
    const proofFile=path.join(temporary,'browser-proof.json');
    const result=await runBrowserTest(rootDir,proofFile,signal);
    report.exitCode=result.status;report.signal=result.signal;report.stdout=result.stdout;report.stderr=result.stderr;
    report.abortCause=result.abortCause;report.cleanup=result.cleanup;report.cleanupError=result.cleanupError||null;
    check(!result.abortCause&&!result.cleanupError&&result.cleanup?.complete===true&&result.status===0&&result.signal===null,
      'Required real Chromium test/owned cleanup failed: '+(result.abortCause||result.cleanupError||report.stderr));
    verifyTap(report.stdout);
    check(fs.lstatSync(proofFile).isFile()&&fs.realpathSync(proofFile)===proofFile,'Required regular browser proof missing');
    report.browserProof=JSON.parse(fs.readFileSync(proofFile));
    check(isDeepStrictEqual(report.sourceHashes,sourceHashes(rootDir)),'Core test/runtime source changed during real browser execution');
    context.pass('Unchanged production sanitizer, runtime sink and SSR assertions passed in configured sandboxed Chromium');
  }catch(error){context.fail(error.message);}
  finally{report.finishedAt=new Date().toISOString();fs.rmSync(temporary,{recursive:true,force:true});}
  return context.result({report});
}
function verifyCoreSecurityReport(execution,{artifact,envelope,provider,now}){
  assertSourceProvider(provider);
  check(execution?.schema==='xtend.test.execution-report.v1'&&execution.profile===id&&execution.complete===true&&
    execution.status==='passed'&&execution.commit===artifact.sourceSha&&execution.run===envelope.context.runId+':'+envelope.context.runAttempt&&
    execution.sourceFingerprint===hash(Buffer.alloc(0))&&execution.runtime?.node==='v'+node&&
    execution.runtime.platform==='linux'&&execution.runtime.arch==='x64','Core browser raw execution source/run/attempt/runtime mismatch');
  const catalog=require('../test-runner/catalog');
  for(const file of ['catalog.json','catalog.js','handlers.js','executor.js','worker.js','cli.js','imported-ci.js','nightly.js','nightly-evidence.js',
    'capabilities.js','../create_xtend_nightly_manifest.js','../verify_ci_dependency_locks.js']){
    const relative=path.posix.normalize('scripts/test-runner/'+file);
    check(provider.readCurrent(relative).equals(fs.readFileSync(path.resolve(__dirname,'../test-runner',file))),
      'Current security report reader/catalog differs from authenticated Core source');
  }
  check(execution.catalogFingerprint===catalog.fingerprint()&&isDeepStrictEqual(execution.expected,[id])&&
    execution.results?.length===1&&execution.executions?.length===1&&!execution.infrastructureErrors?.length,
    'Core security exact maintained suite/report coverage mismatch');
  const verified=require('../test-runner/executor').verifyExecution({verify:id,executionReport:execution,project:false,
    provenance:{commit:artifact.sourceSha,sourceFingerprint:hash(Buffer.alloc(0)),catalogFingerprint:catalog.fingerprint(),
      run:envelope.context.runId+':'+envelope.context.runAttempt,runtime:execution.runtime}});
  check(verified.status==='passed','Required Core security suite failed, skipped, incomplete or unverified');
  const result=execution.results[0].result,report=result.report;
  check(result.status==='passed'&&result.exitCode===0&&result.skipCount===0&&result.failureCount===0&&
    isDeepStrictEqual(result.skips,[])&&isDeepStrictEqual(result.failures,[])&&report?.exitCode===0&&report.signal===null&&
    report.node===node&&isDeepStrictEqual(report.command,['node',...argv]),'Core browser actual command/no-skip proof missing');
  check(report.abortCause===null&&report.cleanupError===null&&report.cleanup?.complete===true&&report.cleanup.childReaped===true&&
    report.cleanup.groupGone===true&&isDeepStrictEqual(report.cleanup.remaining,[])&&
    Number.isSafeInteger(report.cleanup.group)&&report.cleanup.group>0&&/^[0-9]+$/.test(report.cleanup.leaderStart||'')&&
    report.cleanup.termMs===termMs&&report.cleanup.killMs===killMs&&
    [[],['SIGTERM'],['SIGTERM','SIGKILL']].some(value=>isDeepStrictEqual(value,report.cleanup.signals)),
    'Core browser owned process group cleanup/reaping proof missing or failed');
  verifyTap(report.stdout);
  const keys=Object.keys(report.sourceHashes||{}).sort();
  check(isDeepStrictEqual(keys,[...sourceFiles].sort()),'Core browser exact source set missing/changed');
  for(const file of sourceFiles)check(report.sourceHashes[file]===hash(provider.readCurrent(file)),
    'Core browser actual producer/test/runtime source hash mismatch: '+file);
  const proof=report.browserProof,browser=proof?.browser;
  check(proof?.sanitizerTrustedTypes==='passed'&&browser?.version===pin.version&&browser.archiveSha256===pin.archives['chrome-linux64.zip']&&
    /^[a-f0-9]{64}$/.test(browser.sha256||'')&&path.isAbsolute(browser.binary||'')&&Number.isInteger(browser.uid)&&browser.uid>0&&
    Number.isInteger(browser.gid)&&browser.gid>0&&Array.isArray(proof.argv)&&
    typeof proof.argv[0]==='string'&&proof.argv[0].startsWith('--user-data-dir=')&&
    isDeepStrictEqual(proof.argv,browserArguments(proof.argv[0].slice('--user-data-dir='.length)))&&Array.isArray(proof.sandboxRows),
    'Required native browser/sanitizer/Trusted Types proof missing or unsafe');
  for(const name of ['PID namespaces','Network namespaces','Seccomp-BPF sandbox'])check(
    proof.sandboxRows.filter(row=>row[0]===name).length===1&&proof.sandboxRows.find(row=>row[0]===name)[1]==='Yes',
    'Required actual Chromium sandbox capability missing');
  check(Number.isSafeInteger(proof.browserPid)&&proof.browserPid>0&&
    /^pid:\[\d+\]$/.test(proof.browserNamespaces?.pid||'')&&/^net:\[\d+\]$/.test(proof.browserNamespaces?.net||'')&&
    Array.isArray(proof.renderers)&&proof.renderers.length>0&&proof.renderers.length<=64&&
    new Set(proof.renderers.map(row=>row.pid)).size===proof.renderers.length&&proof.renderers.every(row=>
    Number.isSafeInteger(row.pid)&&row.pid>0&&row.uids?.length===4&&row.uids.every(uid=>uid===browser.uid&&uid>0)&&
    row.gids?.length===4&&row.gids.every(gid=>gid===browser.gid&&gid>0)&&/^[0]+$/.test(row.capEff)&&
    row.noNewPrivs==='1'&&row.seccomp==='2'&&typeof row.namespaces?.pid==='string'&&typeof row.namespaces?.net==='string'&&
    row.namespaces.pid!==proof.browserNamespaces?.pid&&row.namespaces.net!==proof.browserNamespaces?.net),
    'Actual unprivileged renderer namespace/seccomp/no-new-privileges proof failed');
  for(const value of [execution,report]){
    const start=Date.parse(value.startedAt),end=Date.parse(value.completedAt||value.finishedAt);
    check(Number.isFinite(start)&&Number.isFinite(end)&&start<=end&&start>=Date.parse(artifact.manifest.preparedAt)&&
      end<=now+1000&&now-end<=3600000,'Core security report stale/future at actual evidence verification time');
  }
  return true;
}
module.exports={id,node,job,runCoreSecuritySuite,verifyCoreSecurityReport};
