'use strict';
const assert = require('node:assert/strict');
const {toolchainIdentity,runtimeMismatchDiagnostics} = require('../../scripts/test-runner/capabilities');
const {verifyExecution,SCHEMA} = require('../../scripts/test-runner/executor');
const {profileIds,canonicalSuite} = require('../../scripts/test-runner/catalog');
const {normalizeSuiteResult} = require('../utils/reporting');
const secret = 'DO_NOT_LOG_DIAGNOSTIC_SECRET';
const runtime = () => ({node:'v24.18.0',platform:'linux',arch:'x64',nodeOptions:'--trace-warnings',
  runnerImage:'ubuntu24:20261018.339.1',environmentFingerprint:'a'.repeat(64),
  toolchain:{configurationFingerprint:'b'.repeat(64),php:[{command:'php',available:true,value:'private PHP configuration'}],
    browser:{endpoint:null,driver:{command:'/driver',available:true,value:'ChromeDriver 155.0.8059.84'},binary:{command:'/browser',available:true,value:'Chromium 155.0.8059.0'}}}});
function fixture(value) {
  const identity = {run:'fixture',commit:'fixture',sourceFingerprint:'fixture',catalogFingerprint:'fixture',runtime:value};
  const ids=profileIds('core'),time='2026-10-19T00:00:00.000Z';
  return {identity,report:{...identity,schema:SCHEMA,executionId:'fixture',complete:true,infrastructureErrors:[],
    expected:ids,startedAt:time,completedAt:time,results:ids.map(id=>({id,executionId:canonicalSuite(id).id,startedAt:time,completedAt:time,result:normalizeSuiteResult({id,ok:true})}))}};
}
async function runRuntimeProvenanceDiagnosticsChecks({check}) {
  await check('Runtime diagnosis reports exact allowlisted changes without altering either identity', () => {
    const before=runtime(),after=structuredClone(before);
    before.toolchain.browser.binary.available=false;delete before.toolchain.browser.binary.value;
    after.toolchain.browser.binary.available=true;after.toolchain.browser.binary.value='Chromium 155.0.8059.0';
    const original=JSON.stringify([before,after]);
    const d=runtimeMismatchDiagnostics({runtime:before},{runtime:after});
    assert.deepEqual(d.differences,[
      {path:'$.runtime.toolchain.browser.binary.available',expected:false,actual:true},
      {path:'$.runtime.toolchain.browser.binary.value',expected:'[missing]',actual:'Chromium 155.0.8059.0'}]);
    assert.equal(d.unlistedFieldsDiffer,false);assert.equal(d.truncated,false);
    assert.equal(JSON.stringify([before,after]),original);
  });
  await check('Runtime diagnosis redacts secrets, arbitrary keys, paths, arguments and process output', () => {
    const before=runtime(),after=structuredClone(before);
    after.nodeOptions=`--require=/${secret} --token=${secret}`;
    after.toolchain.browser.endpoint=`https://user:${secret}@example.invalid`;
    after.toolchain.browser.driver.command=`/${secret}/driver`;
    after.toolchain.browser.driver.value=`ChromeDriver 155.0.8059.84 ${secret}`;
    after.toolchain.php[0].value=JSON.stringify({token:secret});
    after[secret]={secret};after['toolchain.browser.binary.value']=secret;
    const d=runtimeMismatchDiagnostics({runtime:before,diagnostics:{probeFailures:[{probe:secret,code:secret,signal:secret,status:secret,message:secret,stdout:secret,stderr:secret,args:[secret]}]}},{runtime:after});
    assert(!JSON.stringify(d).includes(secret));assert.equal(d.unlistedFieldsDiffer,true);
    for(const field of ['nodeOptions','toolchain.browser.endpoint','toolchain.browser.driver.command','toolchain.browser.driver.value','toolchain.php[0].value']) {
      assert.equal(d.differences.find(row=>row.path==='$.runtime.'+field).actual,'[redacted]');
    }
    assert.deepEqual(d.producerProbeFailures,[{probe:'unknown',kind:'unclassified'}]);
  });
  await check('Runtime mismatch remains blocking and matching runtime remains accepted', () => {
    const {report,identity}=fixture(runtime()),changed=structuredClone(identity);
    changed.runtime.toolchain.browser.binary.value='Chromium 155.0.8059.1';
    const options={verify:'core',executionReport:report,project:false};
    const rejected=verifyExecution({...options,provenance:changed});
    assert.equal(rejected.status,'failed');assert.deepEqual(rejected.errors,['Execution provenance mismatch: runtime.']);
    assert.equal(rejected.summary,null);assert(rejected.diagnostics.differences.length);
    const accepted=verifyExecution({...options,provenance:identity});assert.equal(accepted.status,'passed');assert.equal(accepted.diagnostics,undefined);
    for(const key of ['run','commit','sourceFingerprint','catalogFingerprint']) {
      const r=verifyExecution({...options,provenance:{...identity,[key]:'foreign'}});
      assert.equal(r.status,'failed');assert.deepEqual(r.errors,[`Execution provenance mismatch: ${key}.`]);
    }
  });
  await check('Diagnostic failures neither leak exception text nor override provenance rejection', () => {
    const {report,identity}=fixture(runtime()),changed=structuredClone(identity);changed.runtime.node='v26.5.0';
    Object.defineProperty(report,'diagnostics',{get(){throw Error(secret);}});
    const r=verifyExecution({verify:'core',executionReport:report,project:false,provenance:changed});
    assert.equal(r.status,'failed');assert.deepEqual(r.errors,['Incomplete producer toolchain identity.','Execution provenance mismatch: runtime.']);
    assert.equal(r.diagnostics.unavailable,'diagnostic-error');assert(!JSON.stringify(r).includes(secret));
    const cyclic={};cyclic.self=cyclic;
    assert.equal(runtimeMismatchDiagnostics({runtime:cyclic},{runtime:{}}).unavailable,'diagnostic-error');
    assert.equal(runtimeMismatchDiagnostics({runtime:{node:secret.repeat(5000)}},{runtime:{}}).unavailable,'diagnostic-size-limit');
  });
  await check('Runtime diagnosis is bounded and uses JSON-equivalent comparison values', () => {
    const before=runtime(),after=structuredClone(before);
    after.toolchain.php=Array.from({length:100},()=>({command:secret,available:false,value:secret}));
    for(let n=0;n<100;n++)after[secret+n]=secret;
    const d=runtimeMismatchDiagnostics({runtime:before},{runtime:after});
    assert(d.truncated);assert(d.differences.length<=32);assert(!JSON.stringify(d).includes(secret));
    const equivalent=runtimeMismatchDiagnostics({runtime:{node:'v24.18.0'}},{runtime:{node:'v24.18.0',unused:undefined}});
    assert.deepEqual(equivalent.differences,[]);assert.equal(equivalent.unlistedFieldsDiffer,false);
  });
  await check('Probe diagnostics preserve identity and classify failures without command arguments or output', () => {
    const names=['XTEND_BROWSER_HYPERVISOR_DRIVER_PATH','XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY'];
    const old=Object.fromEntries(names.map(n=>[n,process.env[n]]));
    try {
      process.env[names[0]]=process.execPath;process.env[names[1]]=`/${secret}/browser`;
      for(const [details,expected] of [
        [{code:'ETIMEDOUT',signal:'SIGTERM'},'timeout'],[{code:'ENOENT'},'spawn-error'],
        [{status:23},'nonzero-exit'],[{signal:'SIGKILL'},'signal'],[{code:secret},'unclassified']]) {
        const records=[],commandProbe=()=>{throw Object.assign(Error(secret),details,{stdout:secret,stderr:secret,args:[secret]});};
        const before=toolchainIdentity({commandProbe});
        const after=toolchainIdentity({commandProbe,onProbeFailure:row=>records.push(row)});
        assert.deepEqual(after,before);assert.equal(after.configurationFingerprint,before.configurationFingerprint);
        assert(records.some(row=>row.probe==='browser.binary'&&row.kind===expected));
        assert(!JSON.stringify(records).includes(secret));assert(!Object.hasOwn(after,'diagnostics'));
        assert.deepEqual(toolchainIdentity({commandProbe,onProbeFailure(){throw Error(secret);}}),before);
        const d=runtimeMismatchDiagnostics({runtime:runtime(),diagnostics:{probeFailures:records}},{runtime:runtime()},records);
        assert.deepEqual(d.producerProbeFailures,records.slice(0,8));assert.deepEqual(d.verifierProbeFailures,records.slice(0,8));
      }
      const error={get code(){throw Error(secret);}};const records=[];
      toolchainIdentity({commandProbe(){throw error;},onProbeFailure:row=>records.push(row)});
      assert(records.every(row=>row.kind==='diagnostic-unavailable'));assert(!JSON.stringify(records).includes(secret));
      const d=runtimeMismatchDiagnostics({runtime:runtime(),diagnostics:{probeFailures:records}},{runtime:runtime()},records);
      assert(d.producerProbeFailures.every(row=>row.kind==='diagnostic-unavailable'));
      const changing={get code(){return this.reads++ ? secret : 'ETIMEDOUT';},reads:0};const once=[];
      toolchainIdentity({commandProbe(){throw changing;},onProbeFailure:row=>once.push(row)});
      assert(!JSON.stringify(once).includes(secret));
    } finally {for(const name of names){if(old[name]===undefined)delete process.env[name];else process.env[name]=old[name];}}
  });
  await check('Strict identity rejects timeout, unavailable discovered browser and empty output without retries', () => {
    const key='XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY',previous=process.env[key];
    process.env[key]='/model/browser';
    try {
      for(const code of ['ETIMEDOUT','ENOENT','EACCES',null]) {
        let attempts=0;
        assert.throws(()=>toolchainIdentity({requireComplete:true,commandProbe(command){
          if(command!=='/model/browser')return 'identified';
          attempts++;if(code)throw Object.assign(Error(secret),{code});return '';
        }}),error=>/Incomplete toolchain identity: browser.binary/.test(error.message)&&!error.message.includes(secret));
        assert.equal(attempts,1);
      }
      const captured=toolchainIdentity({requireComplete:true,commandProbe:()=> 'identified'});
      assert.equal(captured.browser.binary.available,true);
    } finally {if(previous===undefined)delete process.env[key];else process.env[key]=previous;}
  });
  await check('Incomplete producer identity cannot pass even when later runtime matches', () => {
    for(const failure of [{probe:'browser.binary',code:'ETIMEDOUT'}, {probe:'browser.driver',code:'ENOENT'}, null]) {
      const {identity,report}=fixture(runtime());report.diagnostics={probeFailures:[failure]};
      const result=verifyExecution({verify:'core',executionReport:report,provenance:identity,project:false});
      assert.equal(result.status,'failed');assert(result.errors.includes('Incomplete producer toolchain identity.'));
    }
    const {identity,report}=fixture(runtime());
    report.runtime.toolchain.browser.binary.available=false;delete report.runtime.toolchain.browser.binary.value;
    assert.equal(verifyExecution({verify:'core',executionReport:report,provenance:identity,project:false}).status,'failed','Missing discovered identity must fail even without diagnostics');
  });
  await check('Pinned preparation verifies both exact tool versions once before exporting identity',()=>{
    const {verifyToolchainVersions}=require('../../scripts/prepare_product_browser_toolchain.cjs');
    const {pin}=require('../security/sandboxed-browser.cjs'),calls=[];
    const run=(file,args,options)=>{calls.push(file);assert.deepEqual(args,['--version']);assert.equal(options.timeout,10000);return (file==='/browser'?'Google Chrome for Testing ':'ChromeDriver ')+pin.version;};
    const identity=verifyToolchainVersions('/browser','/driver',run);
    assert.equal(identity.version,pin.version);assert.deepEqual(calls,['/browser','/driver']);
    for(const failing of ['/browser','/driver'])for(const mode of ['timeout','wrong-version','empty']) {
      let attempts=0;
      assert.throws(()=>verifyToolchainVersions('/browser','/driver',(file,args,options)=>{
        if(file!==failing)return run(file,args,options);
        attempts++;if(mode==='timeout')throw Object.assign(Error(secret),{code:'ETIMEDOUT'});
        return mode==='empty'?'':'Chromium 155.0.8059.0';
      }),error=>/probe failed|version mismatch/.test(error.message)&&!error.message.includes(secret));
      assert.equal(attempts,1);
    }
  });
}
module.exports={runRuntimeProvenanceDiagnosticsChecks};
if(require.main===module) {
  let passed=0,failed=0;
  runRuntimeProvenanceDiagnosticsChecks({check:async(name,fn)=>{try{await fn();passed++;console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack);}}})
    .then(()=>{console.log(JSON.stringify({passed,failed}));if(failed)process.exitCode=1;}).catch(error=>{console.error(error.stack);process.exitCode=1;});
}
