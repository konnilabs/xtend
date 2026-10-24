'use strict';
// Additive migration functions only. Never invokes the combined Electron gates.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const profile=require('../tests/browser/neutral-prototype/execution-profile.cjs');
const {spawnOwned}=require('../tests/security/owned-browser-process.cjs');
const {pin,configuredBrowser}=require('../tests/security/sandboxed-browser.cjs');
const groups=Object.freeze(['erp','material','appservices','shop-cli','shop-fpm']);
const nodes=Object.freeze(['24.18.0','26.5.0']);
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file));
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
function host(env=process.env,platform=process.platform,uid=process.getuid?.(),arch=process.arch,node=process.versions.node) {
  (env.GITHUB_REPOSITORY==='konnilabs/xtend-demos'?profile.requireDemoFunctionalHost:profile.requireFunctionalHost)({platform,arch,node,uid,env});
  assert(/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||''),'Exact controller source required');
  assert(/^[1-9]\d*$/.test(env.GITHUB_RUN_ID||''),'Exact run required');
  assert.equal(env.GITHUB_RUN_ATTEMPT,'1','No blind workflow retries');
}
function environment({scratch,node=process.execPath,browser,driver,fpm,group,source,ci}) {
  assert(groups.includes(group),'Unknown suite group');
  for(const value of [scratch,node,browser,driver])assert(path.isAbsolute(value)&&!/[\r\n]/.test(value),'Absolute explicit executable/profile required');
  if(group==='shop-fpm')assert(fpm&&path.isAbsolute(fpm),'Explicit FPM required');
  const env={...profile.childEnvironment(scratch),PATH:[path.dirname(node),'/usr/local/bin','/usr/bin','/bin'].join(':'),
    CI:'true',npm_config_cache:path.join(scratch,'npm-cache'),
    XTEND_REQUIRE_BROWSER:'1',XTEND_BROWSER_HYPERVISOR_ENGINE:'chromium',
    XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY:browser,XTEND_BROWSER_HYPERVISOR_DRIVER_PATH:driver,
    XTEND_CHROMIUM_PATH:browser,CHROMIUM_PATH:browser,
    XTEND_CORE_SHA:source.coreSha,XTEND_DEMO_SHA:source.demoSha,
    XTEND_CI_FUNCTIONAL_PROFILE:profile.functional};
  for(const key of ['GITHUB_ACTIONS','RUNNER_ENVIRONMENT','GITHUB_REPOSITORY','GITHUB_EVENT_NAME','GITHUB_REF','GITHUB_SHA','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','XTEND_DEMO_EVENT_SHA','XTEND_DEMO_CONTROLLER_SHA','XTEND_DEMO_HEAD_REPOSITORY','XTEND_DEMO_BASE_REF','XTEND_DEMO_PR_NUMBER'])if(ci[key]!==undefined)env[key]=ci[key];
  if(group==='shop-fpm')env.XTEND_SHOP_FPM_BINARY=fpm;
  if(ci.XTEND_SHOP_FIXTURE!==undefined){assert(path.isAbsolute(ci.XTEND_SHOP_FIXTURE)&&!/[\r\n]/.test(ci.XTEND_SHOP_FIXTURE));env.XTEND_SHOP_FIXTURE=ci.XTEND_SHOP_FIXTURE;}
  return env;
}
function accepted(value) {
  if(!value||value.ok!==true||!Array.isArray(value.passes)||value.passes.length===0||value.failures?.length||value.skips?.length)return false;
  function skipped(row){if(!row||typeof row!=='object')return false;return Object.entries(row).some(([key,item])=>(['skips','skipped','deferred'].includes(key)&&((Array.isArray(item)&&item.length)||(typeof item==='number'&&item>0)||item===true))||(item&&typeof item==='object'&&skipped(item)));}
  if(skipped(value))return false;
  return true;
}
function expectedSources(controller,env=process.env) {
  if(env.GITHUB_REPOSITORY==='konnilabs/xtend-demos') {
    assertExecutionIdentity(git(controller,'rev-parse','HEAD'),env.XTEND_DEMO_EVENT_SHA,env);
    assert(/^[a-f0-9]{40}$/.test(env.XTEND_CORE_SHA||''),'Independent installed Core source required');
    return {implementationCoreSha:env.XTEND_CORE_SHA,demoSha:env.XTEND_DEMO_EVENT_SHA};
  }
  return read(path.join(controller,'product-demos.lock.json'));
}
function sourceIdentity(controller,demo) {
  const expected=expectedSources(controller);
  const coreSha=expected.implementationCoreSha,demoSha=expected.demoSha;
  assert.equal(git(demo,'rev-parse','HEAD'),demoSha,'Demo source mismatch');
  assert.equal(read(path.join(demo,'candidate-source.lock.json')).coreSha,coreSha,'Installed Core pin mismatch');
  const manifest=read(path.join(demo,'.candidate-source/manifest.json'));
  assert.equal(manifest.coreSha,coreSha,'Candidate identity mismatch');
  assert.equal(manifest.profile,'xtend.npm.core-only.v1');
  // Candidate preparation is allowed to write only the explicitly generated locks.
  for(const name of git(demo,'diff','--name-only').split('\n').filter(Boolean))assert(/^(?:products\/[^/]+\/)?package-lock\.json$/.test(name),'Unexpected source mutation before execution: '+name);
  return {controllerSha:git(controller,'rev-parse','HEAD'),coreSha,demoSha,manifestSha256:sha(fs.readFileSync(path.join(demo,'.candidate-source/manifest.json')))};
}
function validateRecord(record,expected) {
  assert(record&&record.format===1&&record.purpose==='migration-demo-functions');
  assert.equal(record.node,expected.node);assert.deepEqual(record.source,expected.source);
  assert.equal(record.runId,expected.runId);assert.equal(record.attempt,1);
  if(expected.repository!==undefined)assert.equal(record.executionRepository,expected.repository,'Foreign evidence repository');
  assert.equal(record.sandboxEnabled,false);assert.equal(record.sandboxEvidence,'not-provided');
  assert.equal(record.acceptedForMerge,false);assert.equal(record.acceptedForRelease,false);
  assert.deepEqual(record.groups.map(row=>row.id),groups,'Missing/duplicate/reordered suites');
  for(const row of record.groups) {
    assert.equal(row.status,'passed','Required suite not passed: '+row.id);
    assert.equal(row.completion,'complete','No completed execution: '+row.id);
    assert(accepted(row.result),'Missing executed assertions: '+row.id);
    assert(row.cleanup?.complete&&row.cleanup.groupGone&&row.cleanup.childReaped,'Incomplete cleanup: '+row.id);
    assert(row.startedAt&&row.finishedAt&&Date.parse(row.finishedAt)>=Date.parse(row.startedAt),'Missing execution interval');
  }
  return true;
}
function assertExecutionIdentity(controllerSha,demoSha,env=process.env) {
  assert(/^[a-f0-9]{40}$/.test(controllerSha)&&/^[a-f0-9]{40}$/.test(demoSha),'Exact execution source required');
  if(env.GITHUB_REPOSITORY==='konnilabs/xtend-demos') {
    assert.equal(controllerSha,env.XTEND_DEMO_CONTROLLER_SHA,'Controller checkout substitution');
    assert.equal(demoSha,env.XTEND_DEMO_EVENT_SHA,'Demo PR/event source substitution');
  } else {
    assert.equal(env.GITHUB_REPOSITORY,'konnilabs/xtend');
    assert.equal(controllerSha,env.GITHUB_SHA,'Core controller event source substitution');
  }
  return true;
}
async function child(demo,group,output) {
  host();assert(groups.includes(group));assert(process.send,'Suite subprocess requires owned IPC');
  let result;
  if(group==='erp')result=await require(path.join(demo,'tests/products/erp_resumability_catfooding_suite.js')).runErpResumabilityCatfoodingSuite({rootDir:demo});
  if(group==='material')result=await require(path.join(demo,'tests/products/xtend_material_catfooding_suite.js')).runXtendMaterialCatfoodingSuite({rootDir:demo});
  if(group==='appservices')result=await require(path.join(demo,'tests/products/maraca_app_services_test_bench_suite.js')).runMaracaAppServicesTestBenchSuite({rootDir:demo});
  if(group.startsWith('shop-')) {
    const report=await require(path.join(demo,'scripts/run-shop-host-gate.cjs')).runShopHostGate({mode:group.slice(5)});
    const browser=report.results.find(row=>row.group==='browser');
    result={ok:report.ok===true,passes:browser?.checks||[],failures:browser?.failures||[],skips:[],report};
  }
  write(output,result);
  process.send({type:'complete',passed:accepted(result)});
  // Keep the authenticated group leader alive until the existing owner finishes
  // cleanup. A numeric PGID alone never becomes a new signal authorization.
  setInterval(()=>{},1000);
}
async function executeGroup({demo,group,evidence,toolchain,fpm,source,ci}) {
  const directory=path.join(evidence,group);fs.mkdirSync(directory);
  const scratch=path.join(directory,'private');fs.mkdirSync(scratch);
  const output=path.join(directory,'result.json'),startedAt=new Date().toISOString();
  const env=environment({scratch,browser:path.join(toolchain,'chrome-linux64/chrome'),driver:path.join(toolchain,'chromedriver-linux64/chromedriver'),fpm,group,source,ci});
  let stdout='',stderr='',protocolError=null,cleanup,reportedPassed=false;
  const owned=spawnOwned(process.execPath,[__filename,'child',demo,group,output],{cwd:demo,env,stdio:['ignore','pipe','pipe','ipc']},{diagnostics:true});
  for(const [key,stream] of [['out',owned.child.stdout],['err',owned.child.stderr]])stream.on('data',chunk=>{if(key==='out')stdout=(stdout+chunk).slice(-2*1024*1024);else stderr=(stderr+chunk).slice(-2*1024*1024);});
  const completed=await new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled){if(value==='complete')protocolError='Duplicate completion';return;}settled=true;clearTimeout(timer);resolve(value);};
    const timer=setTimeout(()=>finish('timeout'),12*60*1000);
    owned.child.on('message',message=>{if(message?.type!=='complete'||typeof message.passed!=='boolean'){protocolError='Invalid completion';finish('invalid');}else {reportedPassed=message.passed;finish('complete');}});
    owned.child.once('error',()=>finish('spawn-error'));owned.child.once('exit',()=>finish('unexpected-exit'));
  });
  try{cleanup=await owned.stop();}catch(error){cleanup=error.cleanup||{complete:false};protocolError=error.message;}
  let result=null;
  if(fs.existsSync(output)&&fs.statSync(output).mtimeMs>=Date.parse(startedAt))try{result=read(output);}catch{protocolError='Invalid result JSON';}
  // Raw command output stays private: failure summaries contain fixture assertions,
  // never arbitrary inherited environment, private keys, or complete process argv.
  write(path.join(directory,'output-digests.json'),{stdoutSha256:sha(stdout),stderrSha256:sha(stderr),stdoutBytes:Buffer.byteLength(stdout),stderrBytes:Buffer.byteLength(stderr)});
  write(path.join(directory,'ownership.json'),owned.observations);
  const row={id:group,status:completed==='complete'&&reportedPassed&&!protocolError&&accepted(result)&&cleanup.complete?'passed':'failed',startedAt,finishedAt:new Date().toISOString(),completion:completed,protocolError,result,cleanup};
  write(path.join(directory,'terminal.json'),row);return row;
}
function toolchainIdentity(toolchain,evidence){
  const browser=configuredBrowser({CHROMIUM_PATH:path.join(toolchain,'chrome-linux64/chrome'),XTEND_SECURITY_BROWSER_ARCHIVE:path.join(toolchain,'chrome-linux64.zip')});
  assert.equal(sha(fs.readFileSync(path.join(toolchain,'chromedriver-linux64.zip'))),pin.archives['chromedriver-linux64.zip']);
  const driverFile=path.join(toolchain,'chromedriver-linux64/chromedriver');
  assert(fs.lstatSync(driverFile).isFile()&&!(fs.statSync(driverFile).mode&0o6022),'Driver must be a regular unprivileged immutable binary');
  const driverHash=execFileSync('python3',['-c','import hashlib,zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); print(hashlib.sha256(z.read("chromedriver-linux64/chromedriver")).hexdigest())',path.join(toolchain,'chromedriver-linux64.zip')],{encoding:'utf8',timeout:30000}).trim();
  assert.equal(sha(fs.readFileSync(driverFile)),driverHash,'Installed driver/archive mismatch');
  const version=execFileSync(driverFile,['--version'],{env:profile.childEnvironment(evidence),encoding:'utf8',timeout:5000}).trim();assert(version.startsWith('ChromeDriver '+pin.version+' '),'Pinned driver version mismatch');
  return {browser,driverHash,version};
}
async function shop(demo,evidence,toolchain,fpm,mode) {
  host();assert(['cli','fpm'].includes(mode));const source=sourceIdentity(path.resolve(__dirname,'..'),demo);assertExecutionIdentity(source.controllerSha,source.demoSha);
  fs.mkdirSync(evidence,{recursive:true});const tools=toolchainIdentity(toolchain,evidence);
  const row=await executeGroup({demo,group:'shop-'+mode,evidence,toolchain,fpm,source,ci:process.env});
  write(path.join(evidence,'shop-host.json'),{format:1,purpose:'migration-shop-host',source,node:process.versions.node,runId:process.env.GITHUB_RUN_ID,attempt:1,sandboxEnabled:false,sandboxEvidence:'not-provided',acceptedForMerge:false,acceptedForRelease:false,tools,...row});
  assert.equal(row.status,'passed');assert(accepted(row.result));assert(row.cleanup?.complete&&row.cleanup.childReaped&&row.cleanup.groupGone);
}
async function run(demo,evidence,toolchain,fpm) {
  host();const controller=path.resolve(__dirname,'..');
  const source=read(path.join(evidence,'source.json')),expected=expectedSources(controller);
  assert.equal(source.controllerSha,git(controller,'rev-parse','HEAD'));assertExecutionIdentity(source.controllerSha,source.demoSha);
  assert.equal(source.demoSha,git(demo,'rev-parse','HEAD'));
  assert.equal(source.demoSha,expected.demoSha);assert.equal(source.coreSha,expected.implementationCoreSha);
  assert.equal(source.manifestSha256,sha(fs.readFileSync(path.join(demo,'.candidate-source/manifest.json'))));
  const generated=git(demo,'diff','--name-only').split('\n').filter(Boolean).map(file=>({file,sha256:sha(fs.readFileSync(path.join(demo,file)))}));
  write(path.join(evidence,'prepared-fixture-files.json'),{source,generated});
  const {browser,driverHash,version}=toolchainIdentity(toolchain,evidence);
  const record={format:1,purpose:'migration-demo-functions',source,node:process.versions.node,runId:process.env.GITHUB_RUN_ID,attempt:1,executionRepository:process.env.GITHUB_REPOSITORY,
    browser,driver:{version,sha256:driverHash,archiveSha256:pin.archives['chromedriver-linux64.zip']},sandboxEnabled:false,sandboxEvidence:'not-provided',acceptedForMerge:false,acceptedForRelease:false,groups:[]};
  const terminal=path.join(evidence,'demo-functional.json');
  for(const group of groups) {
    const row=await executeGroup({demo,group,evidence,toolchain,fpm,source,ci:process.env});record.groups.push(row);write(terminal,record);
    // No new session after uncertain ownership/cleanup. Remaining groups explicitly not-run.
    if(!row.cleanup?.complete){for(const id of groups.slice(record.groups.length))record.groups.push({id,status:'not-run',reason:'prior-cleanup-failed'});break;}
  }
  // Copy only fixed report/screenshot paths, never profiles, databases, .env,
  // credential files, PEM keys or arbitrary contents of the workspace.
  for(const [id,relative] of [['material','.xtend-test-results/xtend-material-workbench'],['appservices','products/maraca-app-services-test-bench/.xtend-test-results'],['shop-cli','products/xtend-shop/storage/reports/browser-cli'],['shop-fpm','products/xtend-shop/storage/reports/browser-fpm']]) {
    const directory=path.join(demo,relative);if(!fs.existsSync(directory))continue;
    const dest=path.join(evidence,id,'screenshots');fs.mkdirSync(dest,{recursive:true});
    for(const file of fs.readdirSync(directory))if(/^[a-zA-Z0-9_-]+\.png$/.test(file)&&fs.lstatSync(path.join(directory,file)).isFile())fs.copyFileSync(path.join(directory,file),path.join(dest,file));
  }
  write(terminal,record);validateRecord(record,{source,node:process.versions.node,runId:process.env.GITHUB_RUN_ID,repository:process.env.GITHUB_REPOSITORY});return record;
}
function reportFiles(directory) {
  const files=[];let count=0;
  function visit(current,depth){assert(depth<=5,'Unexpected artifact depth');for(const entry of fs.readdirSync(current,{withFileTypes:true})) {
    assert(++count<=1000&&!entry.isSymbolicLink(),'Unsafe/excessive artifact membership');const file=path.join(current,entry.name);
    if(entry.isDirectory())visit(file,depth+1);else if(entry.name==='demo-functional.json'){assert.equal(depth,1,'Unexpected/duplicate evidence layout');files.push(file);}
  }}visit(directory,0);assert.equal(files.length,2,'Exactly two lane reports required');return files;
}
function validateMatrix(reports,expected) {
  assert.equal(reports.length,2);const seen=new Set();
  for(const report of reports){assert(nodes.includes(report.node)&&!seen.has(report.node),'Foreign or duplicate lane');seen.add(report.node);assert.equal(report.source.controllerSha,expected.controllerSha);assert.equal(report.source.coreSha,expected.coreSha);assert.equal(report.source.demoSha,expected.demoSha);validateRecord(report,{source:reports[0].source,node:report.node,runId:expected.runId,repository:expected.repository});}
  return {format:1,ok:true,source:reports[0].source,nodes:[...seen].sort(),runId:expected.runId,attempt:1,sandboxEnabled:false,sandboxEvidence:'not-provided',acceptedForMerge:false,acceptedForRelease:false};
}
function aggregate(directory,output) {
  host();const pin=expectedSources(path.resolve(__dirname,'..'));
  const controllerSha=git(path.resolve(__dirname,'..'),'rev-parse','HEAD');assertExecutionIdentity(controllerSha,pin.demoSha);
  const result=validateMatrix(reportFiles(directory).map(read),{controllerSha,coreSha:pin.implementationCoreSha,demoSha:pin.demoSha,runId:process.env.GITHUB_RUN_ID,repository:process.env.GITHUB_REPOSITORY});write(output,result);return result;
}
if(require.main===module){const [mode,...args]=process.argv.slice(2);Promise.resolve().then(()=>{
  if(mode==='bind'){host();const source=sourceIdentity(path.resolve(__dirname,'..'),args[0]);assertExecutionIdentity(source.controllerSha,source.demoSha);write(args[1],source);return source;}
  if(mode==='shop')return shop(...args);if(mode==='child')return child(...args);if(mode==='run')return run(...args);if(mode==='aggregate')return aggregate(...args);throw Error('Unknown mode');
}).catch(error=>{console.error(error.message);process.exitCode=1;if(process.send){
  const message=String(error.message).replace(/-----BEGIN [\s\S]*?-----END [^-]+-----/g,'[redacted key]').replace(/(?:Bearer\s+|(?:token|secret|password|APP_KEY|DEMOPAY_SECRET)[=: ]+)[^\s]+/gi,'[redacted]').slice(0,2000);
  write(args[2],{ok:false,passes:[],failures:[message],skips:[]});process.send({type:'complete',passed:false});setInterval(()=>{},1000);
}});}
module.exports={groups,nodes,host,environment,accepted,validateRecord,sourceIdentity,expectedSources,assertExecutionIdentity,aggregate,reportFiles,validateMatrix};
