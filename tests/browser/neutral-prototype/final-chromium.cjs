'use strict';
// One explicit Linux session. No fallback, retry, alternative engine or authority.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const hypervisor=require('../../../tools/browser-hypervisor');
const {pin,configuredBrowser,verifySandbox}=require('../../security/sandboxed-browser.cjs');
const {spawnOwned}=require('../../security/owned-browser-process.cjs');
const hash=b=>hypervisor.sha256(b),pause=ms=>new Promise(r=>setTimeout(r,ms));
function browserEndpoint(address,websocket) {
  assert(/^(?:localhost|127\.0\.0\.1):[1-9]\d{0,4}$/.test(address),'Owned loopback debugger address required');
  const http=new URL('http://'+address);assert(Number(http.port)<=65535);http.hostname='127.0.0.1';
  if(websocket===undefined)return http.href;
  const url=new URL(websocket);
  assert(url.protocol==='ws:' && ['localhost','127.0.0.1'].includes(url.hostname) && url.port===http.port &&
    !url.username && !url.password && !url.search && !url.hash && /^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(url.pathname),'Foreign browser CDP endpoint');
  url.hostname='127.0.0.1';return url.href;
}
function safeLog(text) {
  return {noUsableSandbox:/No usable sandbox!/.test(text),
    browserExited:/Chrome instance exited|Chrome failed to start|session not created/.test(text),
    rawLogRetained:false};
}
function oneSession(request,onSession) {
  let count=0;
  return {count:()=>count,request:async function(endpoint,method,route,body) {
    const creating=method==='POST'&&route==='/session';
    if(creating)assert.equal(++count,1,'Single browser session budget exhausted');
    const value=await request(endpoint,method,route,body);
    if(creating)onSession(value.body?.value?.sessionId);
    return value;
  }};
}
async function connectCdp(address,owner) {
  owner.assertCurrent();
  const r=await fetch(browserEndpoint(address)+'json/version',{signal:AbortSignal.timeout(5000)});
  assert(r.ok,'Browser endpoint unavailable');const data=await r.json();
  const socket=new WebSocket(browserEndpoint(address,data.webSocketDebuggerUrl)),pending=new Map();let id=0,closed=false;
  const fail=e=>{for(const row of pending.values()){clearTimeout(row.timer);row.reject(e);}pending.clear();};
  socket.addEventListener('close',()=>{closed=true;fail(Error('Browser CDP closed'));});
  socket.addEventListener('error',()=>fail(Error('Browser CDP transport failed')));
  socket.addEventListener('message',event=>{
    try{assert(typeof event.data==='string'&&event.data.length<=2*1024*1024);const m=JSON.parse(event.data);if(!m.id)return;
      const row=pending.get(m.id);assert(row,'Unknown CDP response');owner.assertCurrent();pending.delete(m.id);clearTimeout(row.timer);
      m.error?row.reject(Error('Browser CDP command rejected: '+row.method)):row.resolve(m.result);
    }catch(e){fail(e);}
  });
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>{socket.close();reject(Error('Browser CDP open deadline'));},5000);
    socket.addEventListener('open',()=>{clearTimeout(t);resolve();},{once:true});socket.addEventListener('error',()=>{clearTimeout(t);reject(Error('Browser CDP open failed'));},{once:true});});
  return {command(method,params={},sessionId){owner.assertCurrent();assert(!closed,'Closed browser CDP');return new Promise((resolve,reject)=>{
    const next=++id,timer=setTimeout(()=>{pending.delete(next);reject(Error('Browser CDP deadline: '+method));},10000);
    pending.set(next,{resolve,reject,timer,method});socket.send(JSON.stringify({id:next,method,params,...(sessionId?{sessionId}:{})}));
  });},async close(){
    assert.equal(pending.size,0,'Pending CDP commands at cleanup');if(closed)return;
    await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('CDP cleanup deadline')),5000);socket.addEventListener('close',()=>{clearTimeout(t);resolve();},{once:true});socket.close();});
  }};
}
function exactContext(env,commit,dirty) {
  assert.equal(env.GITHUB_REPOSITORY,'konnilabs/xtend');assert.equal(env.GITHUB_REF,'refs/heads/qualification/firefox-initial-20261021');
  assert.equal(env.GITHUB_EVENT_NAME,'push');assert(/^[a-f0-9]{40}$/.test(commit));assert.equal(commit,env.GITHUB_SHA);assert.equal(dirty,'','Clean committed source required');
  assert(/^[1-9]\d*$/.test(env.GITHUB_RUN_ID||''));assert.equal(env.GITHUB_RUN_ATTEMPT,'1','No rerun authorized');
}
async function main([evidence,toolchain]=process.argv.slice(2)) {
  assert.equal(process.platform,'linux');assert.equal(process.arch,'x64');assert.equal(process.versions.node,'24.18.0');assert(process.getuid()>0);
  const root=path.resolve(__dirname,'../../..'),git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
  const commit=git('rev-parse','HEAD');exactContext(process.env,commit,git('status','--porcelain','--untracked-files=normal'));
  assert(path.isAbsolute(evidence)&&path.isAbsolute(toolchain));toolchain=fs.realpathSync(toolchain);
  const work=path.join(evidence,'session');fs.mkdirSync(work,{mode:0o700});const tmp=path.join(work,'private-tmp');fs.mkdirSync(tmp,{mode:0o700});
  const startedAt=new Date().toISOString(),source={type:'committed',commit};
  const identity=configuredBrowser({...process.env,CHROMIUM_PATH:toolchain+'/chrome-linux64/chrome',XTEND_SECURITY_BROWSER_ARCHIVE:toolchain+'/chrome-linux64.zip'});
  const driver=toolchain+'/chromedriver-linux64/chromedriver';
  const installed=JSON.parse(fs.readFileSync(toolchain+'/provisioning.json'));
  assert.equal(installed.archives['chromedriver-linux64.zip'],pin.archives['chromedriver-linux64.zip']);
  assert.equal(hash(fs.readFileSync(toolchain+'/chromedriver-linux64.zip')),pin.archives['chromedriver-linux64.zip']);
  assert.equal(hash(fs.readFileSync(driver)),installed.executables['chromedriver-linux64/chromedriver']);
  const driverVersion=execFileSync(driver,['--version'],{encoding:'utf8',timeout:5000}).split('\n')[0];assert(driverVersion.startsWith('ChromeDriver '+pin.version+' '));
  let sessionId,owned,owner,cdp,server,foreign,leader,output='',raw,cleanup;
  const original=hypervisor.requestJson,budget=oneSession(original,id=>{sessionId=id;});hypervisor.requestJson=budget.request;
  // Load adapter consumers only after the request observer is installed.
  const {parseStat,same}=require('./linux-observer.cjs');
  const snapshots=[];
  try {
    server=await require('./fixture-server.cjs').start();
    foreign=require('node:http').createServer((_q,r)=>{r.writeHead(200,{'content-type':'image/svg+xml'});r.end('<svg xmlns="http://www.w3.org/2000/svg"/>');});
    await new Promise((r,j)=>{foreign.once('error',j);foreign.listen(0,'127.0.0.1',r);});
    const port=await hypervisor.availablePort();
    owned=spawnOwned(driver,['--port='+port,'--allowed-ips=127.0.0.1'],{stdio:['ignore','pipe','pipe'],env:{PATH:'/usr/bin:/bin',TMPDIR:tmp,HOME:tmp,LANG:'C.UTF-8'}},{diagnostics:true});
    for(const stream of [owned.child.stdout,owned.child.stderr])stream.on('data',b=>{output=(output+b).slice(-65536);});
    await new Promise((r,j)=>{owned.child.once('spawn',r);owned.child.once('error',j);});
    const stat=pid=>parseStat(fs.readFileSync('/proc/'+pid+'/stat','utf8'),pid);leader=stat(owned.group);
    owner={assertCurrent(){
      if(owned.state.error)throw owned.state.error;assert(!owned.state.closed&&same(stat(owned.group),leader),'Driver ownership lost');
      assert.equal(leader.group,owned.group);assert.equal(leader.session,owned.group);assert.equal(fs.realpathSync('/proc/'+owned.group+'/exe'),driver);
    },observeTransition:e=>owned.observe(e),async stop(){let transportError;try{await cdp?.close();}catch(e){transportError=e;}
      cleanup=await owned.stop();if(transportError){transportError.cleanup=cleanup;throw transportError;}return cleanup;}};
    const endpointUrl='http://127.0.0.1:'+port,endpoint=hypervisor.parseEndpoint(endpointUrl),deadline=Date.now()+10000;let ready=false;
    while(Date.now()<deadline&&!owned.state.closed){try{const r=await original({...endpoint,deadline:Date.now()+500},'GET','/status');if(r.body.value.ready){ready=true;break;}}catch(_){}await pause(50);}
    assert(ready,'Driver startup deadline');
    const sandbox={async verify({identity:capabilities}) {
      owner.assertCurrent();cdp ||= await connectCdp(capabilities['goog:chromeOptions']?.debuggerAddress,owner);
      const rows=(await cdp.command('SystemInfo.getProcessInfo')).processInfo.filter(p=>p.type==='browser');assert.equal(rows.length,1);
      const pid=rows[0].id;assert(Number.isSafeInteger(pid)&&pid>0);const before=stat(pid);
      assert.equal(before.group,owned.group);assert.equal(before.session,owned.group);assert.equal(fs.realpathSync('/proc/'+pid+'/exe'),identity.binary);
      const proof=await verifySandbox(cdp.command,{pid},identity);assert(same(before,stat(pid)),'Browser identity changed during sandbox observation');
      const value={status:'passed',platform:'linux',scope:'existing Chromium namespace/seccomp/NoNewPrivs observer; bounded snapshot, not complete policy or lifetime proof',...proof,
        acceptedForRelease:false,observedAt:new Date().toISOString()};snapshots.push(value);return value;
    }};
    const {run}=require('./adapter.cjs');
    raw=await run({engine:'chromium',binary:identity.binary,version:pin.version,endpointUrl,probeUrl:server.origin+'/__neutral/preflight',fixtureUrl:server.origin+'/__neutral/security',
      resultKey:'__xtendNeutralSecurity',timeoutMs:180000,cleanupMs:10000,owner,sandbox,
      exercise:require('./qualification.cjs').exercise(server.origin,'http://127.0.0.1:'+foreign.address().port),
      required:['dom','customElements','shadowDom','trustedTypes','trustedTypesEnforced','policyAllowlistEnforced'],
      assertions:{idField:'label',verdictField:'passed',expectedChecks:['maintained sanitizer, TrustedHTML sink and SSR reparse assertions']}});
  } catch(e) {raw ||= {status:'failed',acceptedForRelease:false};raw.harnessError=e.message;}
  finally {
    if(owned&&!raw?.phases?.groupCleanup)try{cleanup=await(owner?owner.stop():owned.stop());}catch(e){cleanup=e.cleanup;raw.cleanupError=e.message;}
    hypervisor.requestJson=original;
    await server?.stop();if(foreign){foreign.closeAllConnections();await new Promise(r=>foreign.close(r));}
  }
  const diagnostics=safeLog(output);if(raw.phases?.startup?.reason)raw.phases.startup.reason=diagnostics.noUsableSandbox?'Observed Chromium diagnostic: No usable sandbox!':'WebDriver startup failed; no product assertions executed';
  Object.assign(raw,{engine:'chromium',node:process.version,platform:process.platform,arch:process.arch,acceptedForMerge:false,acceptedForRelease:false,
    evidenceKind:'real-chromium-linux-qualification',linuxExecution:'observed',browserSha256:identity.sha256,driverSha256:hash(fs.readFileSync(driver)),driverVersion});
  if(cleanup)raw.cleanup=cleanup;
  const finishedAt=new Date().toISOString(),contract=require('./result-contract.cjs');
  const summary={source,runId:process.env.GITHUB_RUN_ID,attempt:1,node:process.versions.node,startedAt,finishedAt,sessionCreationRequests:budget.count(),sessionId:sessionId||null,
    diagnostics,phases:raw.phases||null,cleanup:raw.cleanup||null,newBrowserSessionBudget:1,acceptedForMerge:false,acceptedForRelease:false,status:'failed',mapping:{status:'not-run'}};
  if(sessionId)try {
    const p={id:'chromium-linux-node24-final',engine:'chromium',browserVersion:pin.version,driverVersion:pin.version,browserSha256:raw.browserSha256,driverSha256:raw.driverSha256,
      os:'linux',node:process.versions.node,capabilities:contract.nativeRequired.map(id=>({id,implementation:'native'})),sandboxPolicy:'required',
      transport:{backend:'hypervisor-webdriver',protocol:'webdriver-cdp',adapterSha256:hash(fs.readFileSync(path.join(__dirname,'engine-adapters.cjs')))}};
    const origin={repository:'konnilabs/xtend',source,runId:process.env.GITHUB_RUN_ID,attempt:1,sessionId,startedAt,finishedAt,contractSha256:contract.contractDigest(),kind:'live-session'};
    summary.observation=contract.observe(raw,p,origin);summary.mapping={status:'passed'};summary.status=summary.observation.status;
  }catch(e){summary.mapping={status:'failed',reason:e.message};}
  else summary.mapping={status:'not-run',reason:'No WebDriver session was created; no invented session provenance'};
  for(const [file,value] of Object.entries({'report.json':raw,'summary.json':summary,'sandbox-observations.json':snapshots,'ownership-observations.json':owned?.observations||[]}))
    fs.writeFileSync(path.join(evidence,file),JSON.stringify(value,null,2)+'\n');
  assert.equal(git('rev-parse','HEAD'),commit);assert.equal(git('status','--porcelain','--untracked-files=normal'),'');
  console.log(JSON.stringify(summary));if(summary.status!=='passed')process.exitCode=1;return summary;
}
module.exports={main,browserEndpoint,safeLog,oneSession,exactContext};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
