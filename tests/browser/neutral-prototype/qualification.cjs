'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createEngineAdapter}=require('./engine-adapters.cjs');
const {acceptProduct}=require('./adapter.cjs');
const contracts=require('./fixture-contracts.json');
const root=path.resolve(__dirname,'../../..');
function pinned(entry){
  const bytes=fs.readFileSync(path.join(root,entry.path));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Reviewed fixture changed: '+entry.path);
  return bytes.toString();
}
function hydrangeaPreload(){
  const match=/const preloadScript = `([\s\S]*?)`;\nconst script =/.exec(pinned(contracts.hydrangea));
  if(!match || match[1].includes('${'))throw Error('Hydrangea preload extraction changed');return match[1];
}
function negativeLifecycle(result,fixture,foreignUrl){
  const {expectedChecks}=fixture.assertions;
  assert.equal(result?.status,'failed');assert.equal(result.checks.length,expectedChecks.length);
  assert.deepEqual([...result.checks.map(r=>r.label)].sort(),[...expectedChecks].sort());
  const failed=result.checks.filter(r=>r.passed!==true);
  assert.equal(failed.length,1);assert.equal(failed[0].label,'rmt build local http assets only');
  assert.equal(failed[0].passed,false);assert(failed[0].details.includes(foreignUrl));
  assert.deepEqual(result.errors,['rmt build local http assets only']);
  assert(!result.checks.some(r=>r.skipped || r.status==='skipped'));
}
function exercise(origin,foreignOrigin,{engine='firefox',adapterFactory=createEngineAdapter}={}){return async({report,command,identity,sessionId,owner,sandbox,binary})=>{
  const names=['bidi-preload-order-fetch','bidi-context-isolation','bidi-removal','core','a11y','lifecycle','lifecycle-wrong-key','lifecycle-foreign-origin'];
  const evidence=report.qualification={acceptedForRelease:false,cases:Object.fromEntries(names.map(n=>[n,{status:'not-run'}])),
    preloadCleanup:{status:'not-run'},transportCleanup:{status:'not-run'},sandboxObservations:[],sandboxObservationStatus:'not-run'};
  let transport,secondary;const scripts=new Set();
  const exec=script=>command('POST',`/session/${sessionId}/execute/sync`,{script,args:[]});
  const navigate=url=>command('POST',`/session/${sessionId}/url`,{url});
  const poll=async(key,budget=20000)=>{const end=Date.now()+budget;while(Date.now()<end){
    const value=await exec(`return window[${JSON.stringify(key)}] || null;`);
    if(value?.status && value.status!=='pending')return value;
    await new Promise(r=>setTimeout(r,50));
  }throw Error('Fixture result deadline exceeded: '+key);};
  const guard=async()=>{try{const value=await sandbox.verify({identity,sessionId,binary});if(value.status!=='passed')throw Error('Qualification sandbox proof failed');evidence.sandboxObservations.push(value);evidence.sandboxObservationStatus='passed';}
    catch(error){evidence.sandboxObservationStatus='failed';throw error;}};
  const check=async(name,fn)=>{await guard();const start=performance.now();try{
    evidence.cases[name]={status:'passed',result:await fn(),durationMs:performance.now()-start};
  }catch(error){evidence.cases[name]={status:'failed',reason:error.message,durationMs:performance.now()-start};
    try{evidence.cases[name].diagnostics=await exec(`return {url:location.href,readyState:document.readyState,
      xtend:typeof window.XTend,loaderPromise:typeof window.__XTendLoaderBootPromise,
      routeCurrent:window.XTend?.state?.get('router-current'),
      routeLastRendered:window.XTend?.state?.get('xtend.router.lastRendered'),
      router:document.querySelector('x-router') ? {mode:document.querySelector('x-router').getAttribute('mode'),
        outletText:document.querySelector('x-router').shadowRoot?.querySelector('#outlet')?.textContent.slice(0,500),
        routeAttributes:Array.from(document.querySelectorAll('x-route')).map(r=>Object.fromEntries(Array.from(r.attributes).map(a=>[a.name,a.value])))} : null,
      resources:performance.getEntriesByType('resource').map(r=>({url:r.name,status:r.responseStatus,initiator:r.initiatorType}))};`);}catch(_){}
  }
  await guard();};
  const add=async(context,source)=>{const id=await transport.addPreload(context,source);scripts.add(id);return id;};
  const remove=async id=>{await transport.removePreload(id);scripts.delete(id);};
  try {
    for(const f of contracts.fixtures)pinned(f);
    transport=await adapterFactory({engine,command,identity,sessionId,owner});
    evidence.transport={engine,protocol:transport.protocol};
    const context=transport.primary;
    const preload=await add(context,`window.__neutralPreload={readyState:document.readyState,beforePage:!window.__pageSeen};\n`+hydrangeaPreload());
    await check('bidi-preload-order-fetch',async()=>{
      await navigate(origin+'/__neutral/bidi');const result=await poll('__bidiFixture');
      assert.equal(result.status,'passed');assert.equal(result.early,true);assert.equal(result.active,0);assert.equal(result.maxActive,1);
      assert.equal(result.requests.length,3);assert.deepEqual(result.errors,[]);
      assert(result.requests.every(r=>r.finished>=r.started && r.bytes>0 && r.sourceHash==='synthetic'));
      return result;
    });
    await check('bidi-context-isolation',async()=>{
      secondary=await transport.createContext();
      await transport.navigateContext(secondary,origin+'/__neutral/bidi');
      const result=await transport.evaluateContext(secondary,'({absent:!window.__hydrangea && !window.__neutralPreload, page:window.__pageSeen})');
      assert.equal(result.absent,true);assert.equal(result.page,true);
      await transport.closeContext(secondary);secondary=null;
      await command('POST',`/session/${sessionId}/window`,{handle:context});return result;
    });
    await remove(preload);
    await check('bidi-removal',async()=>{await navigate(origin+'/__neutral/bidi');const result=await poll('__bidiFixture');assert.equal(result.status,'absent');assert.equal(await exec('return typeof window.__neutralPreload;'),'undefined');return result;});
    for(const fixture of contracts.fixtures)await check(fixture.id,async()=>{
      await navigate(origin+'/'+fixture.path);const result=await poll(fixture.resultKey);
      assert(acceptProduct(result,fixture.assertions),JSON.stringify(result));return result;
    });
    const fixture=contracts.fixtures.find(f=>f.id==='lifecycle');
    await check('lifecycle-wrong-key',async()=>{
      await navigate(origin+'/'+fixture.path);assert(acceptProduct(await poll(fixture.resultKey),fixture.assertions));
      await assert.rejects(poll('__xtendWp1DeliberatelyWrongResultKey',1200),/Fixture result deadline exceeded/);
      return {expectation:'missing result is rejected',rejected:true};
    });
    const foreignUrl=foreignOrigin+'/probe.svg';
    // Exact injection and assertion semantics of the maintained lifecycle harness.
    const negative=await add(context,`document.addEventListener('DOMContentLoaded',()=>{const img=document.createElement('img');img.hidden=true;img.src=${JSON.stringify(foreignUrl)};document.body.append(img);},{once:true});`);
    await check('lifecycle-foreign-origin',async()=>{
      await navigate(origin+'/'+fixture.path);const result=await poll(fixture.resultKey);negativeLifecycle(result,fixture,foreignUrl);
      return {expectation:'one specific product failure must remain visible',product:result};
    });
    await remove(negative);
  } catch(error){evidence.error=error.message;}
  finally {
    try {if(!transport)throw Error('Engine adapter not established');for(const id of [...scripts])await remove(id);
      if(secondary)await transport.closeContext(secondary);
      evidence.preloadCleanup={status:'passed',remaining:scripts.size};
    }catch(error){evidence.preloadCleanup={status:'failed',reason:error.message};}
    try {if(!transport)throw Error('Engine adapter not established');evidence.transportCleanup=await transport.close();}
    catch(error){evidence.transportCleanup={status:'failed',reason:error.message};}
  }
  evidence.status=!evidence.error && Object.values(evidence.cases).every(r=>r.status==='passed') &&
    evidence.preloadCleanup.status==='passed' && evidence.transportCleanup.status==='passed' ? 'passed':'failed';
  if(evidence.status!=='passed')throw Error('BiDi/standard-fixture qualification incomplete or failed');
};}
module.exports={exercise,pinned,hydrangeaPreload,negativeLifecycle};
