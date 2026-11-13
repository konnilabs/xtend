#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{createRequire}=require('node:module'),{pathToFileURL}=require('node:url');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function runDeploymentRuntimeAcceptance({rootDir=path.resolve(__dirname,'..'),peerRoot=process.env.XTENSIONS_TEST_PEERS,executablePath=process.env.CHROME_BIN}={}){
 if(!peerRoot||!executablePath)throw Error('Deployment runtime acceptance requires real isolated peers and Chromium.');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-a0436-browser-')),peers=createRequire(path.join(peerRoot,'package.json')),api=require('../xtend-maraca/xtension-composition'),reference=require('../development/rmtx-a04/runtime-reference.cjs');
 const builds={},applications={},routes=new Map(),cases=[],requests=[],hosts=[];let server,browser;
 try{
  const vendor=await require('esbuild').build({stdin:{contents:`import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';const ReactDOM={...client,version:dom.version};export {React,ReactDOM,Vue};`,resolveDir:rootDir},nodePaths:[path.join(peerRoot,'node_modules')],bundle:true,format:'esm',platform:'browser',write:false,define:{'process.env.NODE_ENV':'"production"',__VUE_OPTIONS_API__:'true',__VUE_PROD_DEVTOOLS__:'false',__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:'false'}});
  for(const framework of ['react','vue','mixed']){
   const directory=path.join(temp,framework);fs.mkdirSync(directory);
   const fixture=reference.createRuntimeReference(framework,directory);builds[framework]=await require('../xtend-maraca').buildMaracaBundleAsync(fixture.input,{rootDir:fixture.rootDir});assert(builds[framework].ok,JSON.stringify({status:builds[framework].status,diagnostics:builds[framework].plan.diagnostics}));
   const app=path.join(directory,'application');fs.mkdirSync(app);fs.writeFileSync(path.join(app,'vendor.mjs'),vendor.outputFiles[0].contents);
   const bootstrap=await require('esbuild').build({stdin:{contents:`
    import {React,ReactDOM,Vue} from './vendor.mjs';
    const {createXtendFabric}=require('./fabric/xtend-fabric'),{createRepeatedDataSourceAdapter}=require('./development/rmtx-a02/repeated-filters');
    window.__XTendMaracaDisableAutoBoot=true;window.__runtimeStats={admissions:0,factories:0,loads:0,done:false};
    window.__runtimeResult=(async()=>{const stats=window.__runtimeStats,framework=${JSON.stringify(framework)};
     globalThis.__XTendA043Observe=()=>{if(!stats.admissions)throw Error('Native admission missing');stats.factories++;};
     const actual=createXtendFabric(),fabric={...actual,createBoundary(...args){const b=actual.createBoundary(...args);return {...b,run(phase,task,metadata){if(metadata?.kernelJobId)stats.admissions++;return b.run(phase,task,metadata);}};}};
     let app;try{const generated=await import('./xtend.maraca.mjs');app=generated.createXtendMaraca({windowTarget:window,documentTarget:document,platformTarget:{}});
      const ids=framework==='mixed'?['mixed-filter-0','mixed-filter-1']:['filter-panel'],grants=Object.fromEntries(ids.map(id=>[id,{work:{scan:{lane:'background'}},workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}}}]));
      await app.boot({root:document.querySelector('main'),fabric,dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()},serviceWorkerUrl:new URL('./xtend.sealed-service-worker.js',import.meta.url).href,serviceWorkerScope:new URL('./',import.meta.url).href,xtensions:{grants,loadPeerGroup({group}){stats.loads++;return group.framework==='react'?{React,ReactDOM}:{Vue};}}});
      stats.inputs=document.querySelectorAll('input').length;stats.pwaRegistered=window.__XTendMaracaPwaRegistration?.registered===true;
      if(framework!=='mixed'){const result=await app.facade.dispatchCommand('app.check',{});if(result.status==='error'||result.status==='cancelled')throw Error('AppService action failed: '+JSON.stringify(result));stats.serviceChecked=true;}
      stats.booted=true;
     }catch(error){stats.error=String(error);}finally{if(app){app.dispose();await app.facade.whenXTensionsIdle();}stats.afterDispose=document.querySelectorAll('input').length;delete globalThis.__XTendA043Observe;stats.done=true;}return stats;})();`,resolveDir:rootDir},external:['./vendor.mjs'],bundle:true,format:'esm',platform:'browser',write:false});
   fs.writeFileSync(path.join(app,'bootstrap.mjs'),bootstrap.outputFiles[0].contents);
   applications[framework]={rootDir:app,bootstrap:{fileName:'bootstrap.mjs',sha256:hash(bootstrap.outputFiles[0].contents)},modules:[{fileName:'vendor.mjs',sha256:hash(vendor.outputFiles[0].contents)}]};
  }
  const definitions=[['ok','react'],['ok','vue'],['ok','mixed'],['cache-tamper','react'],['install-tamper','vue'],['install-redirect','react'],['private-http','react'],['offline','vue'],['api-network-only','react'],['legacy-worker-blocked','mixed']];
  server=http.createServer(async(req,res)=>{
   const route=[...routes.entries()].find(([prefix])=>req.url.startsWith(prefix));
   // Each service path belongs to its deployment, including paths inside the public prefix.
   const service=[...routes.values()].find(row=>row.host && req.url.startsWith(row.loaded.manifest.servicePath+'/') && String(req.headers.referer||'').startsWith(origin+row.prefix));
   if(service?.apiOffline){res.destroy();return;}
   if(service){requests.push({prefix:service.prefix,file:'api',method:req.method});return service.host.handle(req,res).catch(error=>{res.writeHead(500);res.end(String(error));});}
   if(!route){res.writeHead(404);return res.end();}
   const [prefix,entry]=route,file=req.url.slice(prefix.length);if(entry.offline){res.destroy();return;}requests.push({prefix,file,method:req.method,destination:req.headers['sec-fetch-dest']});
   const install=req.headers['sec-fetch-dest']==='empty'&&file===entry.helper;
   if(entry.scenario==='install-redirect'&&install){res.writeHead(302,{Location:prefix+'redirected.mjs'});return res.end();}
   const mutate=entry.scenario==='install-tamper'&&install,suffix=Buffer.from('\n;globalThis.__unexpectedRuntimeCode=true;\n');
   const response={setHeader(k,v){res.setHeader(k,v);},writeHead(status,headers){res.writeHead(status,{...headers,...(mutate?{'Content-Length':Number(headers['Content-Length'])+suffix.length}:{})});},end(bytes){res.end(mutate?Buffer.concat([bytes,suffix]):bytes);}};
   if(!entry.handler(req,response)){res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  for(const [scenario,framework]of definitions){
   const prefix=`/runtime/${scenario}/${framework}/`,services=framework!=='mixed';
   // Give each application its own route while preserving the captured transport path.
   const built=api.buildMaracaXTensionDeployment({schema:'xtend.maraca.xtension-deployment-config.v2',build:builds[framework],application:applications[framework],origin,publicPath:prefix,outputDir:path.join(temp,'public-'+scenario+'-'+framework),...(services?{serverOutputDir:path.join(temp,'private-'+scenario+'-'+framework)}:{}),runtime:{schema:'xtend.maraca.xtension-deployment-runtime-policy.v1',pwa:'verified-static-cache',appServices:services?'separate-server':'disabled'}});
   assert(built.accounting.frameworkBytes<=2200000);assert(built.accounting.xtensionRuntimeBytes<=240000);
   const loaded=api.loadMaracaXTensionDeployment({rootDir:built.outputDir,manifestSha256:built.manifestSha256,...(services?{serverRootDir:built.serverOutputDir}:{})});
   const helper=loaded.manifest.files.find(row=>row.fileName.includes('/format.mjs-')).fileName;
   let host;
   if(services){const definition=await import(pathToFileURL(path.join(built.serverOutputDir,'server/xtend.maraca.services.mjs')));host=require('../xtend-maraca/server-services').createNodeAppServiceHost({services:definition.default,allowedOrigins:[origin],manifest:JSON.parse(fs.readFileSync(path.join(built.serverOutputDir,'xtend.maraca.services.json')))});hosts.push(host);}
   routes.set(prefix,{prefix,framework,scenario,built,loaded,helper,host,handler:api.createMaracaXTensionDeploymentHandler(loaded)});
  }
  browser=await peers('playwright').chromium.launch({executablePath,headless:true});
  for(const [prefix,entry]of routes){
   const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage(),workerResponses=[];
   page.on('response',response=>{if(response.fromServiceWorker())workerResponses.push(response.url());});
   try{
    const before=globalThis.__XTendA0436ServerCalls||0;
    await page.goto(origin+prefix);await page.waitForFunction(()=>window.__runtimeStats?.done,null,{timeout:20000});
    let stats=await page.evaluate(()=>window.__runtimeStats);assert(stats.booted,stats.error);assert(stats.pwaRegistered);assert.equal(stats.inputs,entry.framework==='mixed'?2:3);assert.equal(stats.factories,stats.inputs);assert(stats.admissions>0);assert.equal(stats.afterDispose,0);if(entry.framework!=='mixed')assert((globalThis.__XTendA0436ServerCalls||0)>before);
    if(entry.scenario.startsWith('install-')){
     await page.evaluate(async()=>{const until=performance.now()+15000;while(performance.now()<until){const r=await navigator.serviceWorker.getRegistration();if(!r||!r.installing&&!r.waiting&&!r.active)return;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Rejected worker registration did not settle');});
     assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),false);
    }else{
     await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:20000});
     const names=await page.evaluate(()=>caches.keys());assert(names.includes(entry.loaded.manifest.pwa.cacheName));
     const keys=await page.evaluate(async name=>(await(await caches.open(name)).keys()).map(r=>r.url),entry.loaded.manifest.pwa.cacheName);
     assert(keys.some(url=>url===origin+prefix+entry.helper));assert(!keys.includes(origin+prefix));assert(!keys.some(url=>url.includes('/api/')||url.includes('/server/')||url.includes('xtend.maraca.services.')));
     if(entry.scenario==='cache-tamper'){
      await page.evaluate(async({name,url})=>{const cache=await caches.open(name),r=await cache.match(url);await cache.put(url,new Response(await r.text()+'\n;globalThis.__unexpectedRuntimeCode=true;',{headers:{'Content-Type':'text/javascript'}}));},{name:entry.loaded.manifest.pwa.cacheName,url:origin+prefix+entry.helper});
      await page.reload();await page.waitForFunction(()=>window.__runtimeStats?.done);stats=await page.evaluate(()=>window.__runtimeStats);assert(!stats.booted);assert.equal(stats.factories,0);assert.equal(stats.loads,0);assert.equal(await page.evaluate(()=>!!window.__unexpectedRuntimeCode),false);
     }else if(entry.scenario==='offline'){
      entry.offline=true;await context.setOffline(true);const response=await page.reload();assert(response.fromServiceWorker());assert((await page.textContent('body')).includes('Please reconnect'));assert.equal(await page.evaluate(()=>window.__runtimeStats||null),null);assert(response.headers()['content-security-policy'].includes("default-src 'none'"));
     }else if(entry.scenario==='private-http'){
      for(const row of entry.loaded.manifest.serverFiles){const r=await page.request.get(origin+prefix+row.fileName);assert.equal(r.status(),404);assert(!(await r.text()).includes(reference.SERVER_SENTINEL));}
      for(const row of entry.loaded.manifest.files)assert(!fs.readFileSync(path.join(entry.loaded.outputDir,row.fileName)).includes(Buffer.from(reference.SERVER_SENTINEL)));
     }else if(entry.scenario==='api-network-only'){
      entry.apiOffline=true;await context.setOffline(true);assert(await page.evaluate(async()=>{try{await fetch('/api/xtend/services/app.health',{method:'POST',body:'{}'});return false;}catch(_){return true;}}));
     }else if(entry.scenario==='legacy-worker-blocked'){
      assert(await page.evaluate(async()=>{try{await navigator.serviceWorker.register('./xtend.service-worker.js');return false;}catch(_){return true;}}));assert(!requests.some(row=>row.prefix===prefix&&row.file==='xtend.service-worker.js'));
     }else{
      await page.evaluate(async()=>{const c=await caches.open('unrelated-application-cache');await c.put('/unrelated',new Response('keep'));});
      await page.reload();await page.waitForFunction(()=>window.__runtimeStats?.done);stats=await page.evaluate(()=>window.__runtimeStats);assert(stats.booted,stats.error);assert(workerResponses.includes(origin+prefix+entry.helper),'Actual module response must come from the verified cache');assert((await page.evaluate(()=>caches.keys())).includes('unrelated-application-cache'));
     }
    }
    cases.push({name:`A04.3.6: ${entry.framework} ${entry.scenario}`,passed:true,scenario:entry.scenario,framework:entry.framework,stats,accounting:entry.built.accounting,workerResponses});
   }finally{await context.close();}
  }
  return {schema:'xtend.xtensions.deployment-runtime-acceptance-report.v1',ok:true,node:process.version,browser:await browser.version(),checks:cases.length,browserByteIntegrityEnforced:true,trustedDocumentRequired:true,trustedWorkerRequired:true,workerRegistrationIntegrityEnforced:false,offlineMode:'static-fallback',cases};
 }finally{if(browser)await browser.close();for(const host of hosts){host.dispose();await host.whenDisposed();}if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}delete globalThis.__XTendA0436ServerCalls;fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)runDeploymentRuntimeAcceptance().then(report=>{const i=process.argv.indexOf('--report');if(i!==-1)fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');console.log(`A04.3.6: ${report.checks} native PWA/AppServices cases pass on ${report.node} / Chromium ${report.browser}.`);}).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={runDeploymentRuntimeAcceptance};
