#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{createRequire}=require('node:module');
const hash=b=>createHash('sha256').update(b).digest('hex');
async function runUpdatesAcceptance({rootDir=path.resolve(__dirname,'..'),peerRoot=process.env.XTENSIONS_TEST_PEERS,executablePath=process.env.CHROME_BIN}={}){
 if(!peerRoot||!executablePath)throw Error('Update acceptance requires isolated real peers and Chromium; no skip is allowed.');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-a0437-browser-')),peers=createRequire(path.join(peerRoot,'package.json')),api=require('../xtend-maraca/xtension-composition'),reference=require('../development/rmtx-a04/runtime-reference.cjs');
 const routes=new Map(),cases=[];let server,browser;
 try{
  const vendor=await require('esbuild').build({stdin:{contents:`import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';const ReactDOM={...client,version:dom.version};export {React,ReactDOM,Vue};`,resolveDir:rootDir},nodePaths:[path.join(peerRoot,'node_modules')],bundle:true,format:'esm',platform:'browser',write:false,define:{'process.env.NODE_ENV':'"production"',__VUE_OPTIONS_API__:'true',__VUE_PROD_DEVTOOLS__:'false',__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:'false'}});
  server=http.createServer((req,res)=>{if(req.url==='/control.html'){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><title>Outside application scope</title>');}if(req.url.endsWith('/unknown.html')){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><title>Unannounced client</title>');}const route=[...routes].find(([prefix])=>req.url.startsWith(prefix));if(!route||!route[1].handler(req,res)){res.writeHead(404);res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  for(const framework of ['react','vue','mixed']){
   const directory=path.join(temp,framework);fs.mkdirSync(directory);const fixture=reference.createRuntimeReference(framework,directory,{services:false});
   const build=await require('../xtend-maraca').buildMaracaBundleAsync(fixture.input,{rootDir:fixture.rootDir});assert(build.ok,JSON.stringify(build.plan.diagnostics));const prefix='/updates/'+framework+'/';
   const versions=[];
   for(const label of ['A','B',...(framework==='react'?['L']:[])]){
    const legacy=label==='L';
    const app=path.join(directory,label);fs.mkdirSync(app);fs.writeFileSync(path.join(app,'vendor.mjs'),vendor.outputFiles[0].contents);
    const bootstrap=await require('esbuild').build({stdin:{contents:`
     ${legacy ? "const deployment={scope:new URL('./',import.meta.url).href,workerUrl:new URL('./xtend.sealed-service-worker.js',import.meta.url).href};" : "import {deployment,createDeploymentClient} from './xtend.deployment-client.mjs';"}import {React,ReactDOM,Vue} from './vendor.mjs';
     const {createXtendFabric}=require('./fabric/xtend-fabric'),{createRepeatedDataSourceAdapter}=require('./development/rmtx-a02/repeated-filters');
     window.__XTendMaracaDisableAutoBoot=true;window.__updateMetadata=deployment;window.__updateClient=${legacy?'null':'createDeploymentClient()'};
     window.__updateStats={label:${JSON.stringify(label)},admissions:0,factories:0,loads:0,done:false};
     window.__updateResult=(async()=>{const stats=window.__updateStats,framework=${JSON.stringify(framework)};
      globalThis.__XTendA043Observe=()=>{if(!stats.admissions)throw Error('Native admission missing');stats.factories++;};
      const actual=createXtendFabric(),fabric={...actual,createBoundary(...args){const b=actual.createBoundary(...args);return {...b,run(phase,task,metadata){if(metadata?.kernelJobId)stats.admissions++;return b.run(phase,task,metadata);}};}};
      try{const generated=await import('./xtend.maraca.mjs');const app=generated.createXtendMaraca({windowTarget:window,documentTarget:document,platformTarget:{}});window.__updateApp=app;
       const ids=framework==='mixed'?['mixed-filter-0','mixed-filter-1']:['filter-panel'],grants=Object.fromEntries(ids.map(id=>[id,{work:{scan:{lane:'background'}},workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}}}]));
       await app.boot({root:document.querySelector('main'),fabric,dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()},serviceWorkerUrl:deployment.workerUrl,serviceWorkerScope:deployment.scope,xtensions:{grants,loadPeerGroup({group}){stats.loads++;return group.framework==='react'?{React,ReactDOM}:{Vue};}}});
       stats.inputs=document.querySelectorAll('input').length;stats.booted=true;
       window.__releaseUpdate=async()=>{app.dispose();await app.facade.whenXTensionsIdle();stats.afterDispose=document.querySelectorAll('input').length;window.__updateClient?.setReadyForRetirement(true);};
      }catch(error){stats.error=String(error);}finally{stats.done=true;delete globalThis.__XTendA043Observe;}return stats;})();`,resolveDir:rootDir},external:['./vendor.mjs','./xtend.deployment-client.mjs'],bundle:true,format:'esm',platform:'browser',write:false});
    fs.writeFileSync(path.join(app,'bootstrap.mjs'),bootstrap.outputFiles[0].contents);
    const config={schema:'xtend.maraca.xtension-deployment-config.v3',build,application:{rootDir:app,bootstrap:{fileName:'bootstrap.mjs',sha256:hash(bootstrap.outputFiles[0].contents)},modules:[{fileName:'vendor.mjs',sha256:hash(vendor.outputFiles[0].contents)}]},origin,publicPath:prefix,outputDir:path.join(directory,'public-'+label),runtime:{schema:'xtend.maraca.xtension-deployment-runtime-policy.v2',pwa:'verified-static-cache',appServices:'disabled',updates:'coordinated',acknowledgementTimeoutMs:300},retainedDeployments:[...versions],retainedByteBudget:label==='A'?0:5_000_000};
    if(legacy){config.schema='xtend.maraca.xtension-deployment-config.v2';config.publicPath='/updates/legacy/';config.runtime={schema:'xtend.maraca.xtension-deployment-runtime-policy.v1',pwa:'verified-static-cache',appServices:'disabled'};delete config.retainedDeployments;delete config.retainedByteBudget;}
    const sealed=api.buildMaracaXTensionDeployment(config);
    assert(sealed.accounting.frameworkBytes<=2200000);assert(sealed.accounting.xtensionRuntimeBytes<=240000);versions.push(sealed);
   }
   const [a,b,legacy]=versions;routes.set(prefix,{a,b,current:a,handler:api.createMaracaXTensionDeploymentHandler(a)});
   if(legacy){const app=path.join(directory,'B');const migrated=api.buildMaracaXTensionDeployment({schema:'xtend.maraca.xtension-deployment-config.v3',build,application:{rootDir:app,bootstrap:{fileName:'bootstrap.mjs',sha256:hash(fs.readFileSync(path.join(app,'bootstrap.mjs')))},modules:[{fileName:'vendor.mjs',sha256:hash(vendor.outputFiles[0].contents)}]},origin,publicPath:'/updates/legacy/',outputDir:path.join(directory,'public-migrated'),runtime:{schema:'xtend.maraca.xtension-deployment-runtime-policy.v2',pwa:'verified-static-cache',appServices:'disabled',updates:'coordinated',acknowledgementTimeoutMs:300},retainedDeployments:[legacy],retainedByteBudget:5_000_000});routes.set('/updates/legacy/',{legacy:true,a:legacy,b:migrated,handler:api.createMaracaXTensionDeploymentHandler(legacy)});}
  }
  browser=await peers('playwright').chromium.launch({executablePath,headless:true});
  for(const [prefix,route]of routes){
   const framework=prefix.split('/')[2],context=await browser.newContext({serviceWorkers:'allow'}),records=[];
   const record=(scenario,data={})=>{cases.push({name:`A04.3.7: ${framework} ${scenario}`,framework,scenario,passed:true,...data});};
   async function open(label){const page=await context.newPage();page.on('response',r=>{if(r.fromServiceWorker())records.push(r.url());});await page.goto(origin+prefix);await page.waitForFunction(()=>window.__updateStats?.done,null,{timeout:20000});const stats=await page.evaluate(()=>window.__updateStats);assert(stats.booted,stats.error);assert.equal(stats.label,label);assert.equal(stats.inputs,framework==='mixed'?2:3);assert.equal(stats.factories,stats.inputs);assert(stats.admissions>0);return page;}
   try{
    const control=await context.newPage();await control.goto(origin+'/control.html');
    if(route.legacy){
     const old=await open('L');await old.waitForFunction(()=>!!navigator.serviceWorker.controller);route.handler=api.createMaracaXTensionDeploymentHandler(route.b);const upgraded=await open('B');
     await upgraded.waitForFunction(async scope=>!!(await navigator.serviceWorker.getRegistration(scope))?.waiting,origin+prefix);record('legacy-v2-and-v3-coexist');
     const blocked=await upgraded.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(blocked.status,'blocked');assert.equal(blocked.deleted.length,0);record('legacy-controller-has-no-retirement-authority');
     const status=await upgraded.evaluate(()=>window.__updateClient.checkForUpdate());assert.equal(status.revision,route.b.manifest.revision.id);assert(status.waiting);record('legacy-upgrade-status');
     await old.evaluate(()=>window.__releaseUpdate());await upgraded.evaluate(()=>window.__releaseUpdate());await old.close();await upgraded.close();
     await control.waitForFunction(async({scope,url})=>{const r=await navigator.serviceWorker.getRegistration(scope);return r?.active?.state==='activated'&&r.active.scriptURL===url&&!r.waiting&&!r.installing;},{scope:origin+prefix,url:origin+prefix+route.b.manifest.pwa.workerFile},{timeout:20000});
     const current=await open('B');await current.waitForFunction(()=>!!navigator.serviceWorker.controller);await current.evaluate(()=>window.__releaseUpdate());const retired=await current.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(retired.status,'ok');assert.deepEqual(retired.deleted,[route.a.manifest.pwa.cacheName]);record('legacy-cache-retires-after-natural-activation');continue;
    }
    const pageA=await open('A');await pageA.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await pageA.evaluate(async()=>{await(await caches.open('unrelated-application-cache')).put('/unrelated',new Response('keep'));});
    route.current=route.b;route.handler=api.createMaracaXTensionDeploymentHandler(route.b);
    const pageB=await open('B');await pageB.waitForFunction(async scope=>!!(await navigator.serviceWorker.getRegistration(scope))?.waiting,origin+prefix);
    assert.equal(await pageA.locator('input').count(),framework==='mixed'?2:3);assert.equal(await pageB.locator('input').count(),framework==='mixed'?2:3);
    record('coexisting-revisions',{revisionA:route.a.manifest.revision.id,revisionB:route.b.manifest.revision.id,accounting:route.b.accounting});
    const pending=await pageA.evaluate(()=>window.__updateClient.checkForUpdate());assert.equal(pending.status,'ok');assert.equal(pending.revision,route.b.manifest.revision.id);assert(pending.waiting);record('observable-waiting-update');
    const oldFile=route.a.manifest.bootstrap,oldUrl=origin+prefix+oldFile;
    const oldBytes=await pageA.evaluate(async({cacheName,url})=>{await(await caches.open(cacheName)).delete(url);return Array.from(new Uint8Array(await(await fetch(url,{cache:'no-store'})).arrayBuffer()));},{cacheName:route.a.manifest.pwa.cacheName,url:oldUrl});
    assert.equal(hash(Buffer.from(oldBytes)),route.a.manifest.files.find(row=>row.fileName===oldFile).sha256);record('retained-response-recovery');
    const premature=await pageB.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(premature.status,'blocked');assert.equal(premature.deleted.length,0);record('old-controller-blocks-retirement');
    const waiting=await pageB.evaluate(async({scope,revision})=>{const r=await navigator.serviceWorker.getRegistration(scope),channel=new MessageChannel();return new Promise(resolve=>{channel.port1.onmessage=e=>resolve(e.data);r.waiting.postMessage({schema:'xtend.maraca.xtension-deployment-update-request.v1',requestId:crypto.randomUUID(),action:'collect',revision},[channel.port2]);});},{scope:origin+prefix,revision:route.b.manifest.revision.id});assert.equal(waiting.reason,'update-in-progress');assert.equal(waiting.deleted.length,0);record('waiting-worker-cannot-collect');
    await pageA.evaluate(()=>window.__releaseUpdate());await pageB.evaluate(()=>window.__releaseUpdate());await pageA.close();await pageB.close();
    await control.waitForFunction(async({scope,url})=>{const r=await navigator.serviceWorker.getRegistration(scope);return r?.active?.state==='activated'&&r.active.scriptURL===url&&!r.waiting&&!r.installing;},{scope:origin+prefix,url:origin+prefix+route.b.manifest.pwa.workerFile},{timeout:20000});
    const current=await open('B');await current.waitForFunction(()=>!!navigator.serviceWorker.controller);
    let report=await current.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(report.reason,'client-not-ready');assert.equal(report.deleted.length,0);record('busy-client-blocks-retirement');
    await current.evaluate(()=>window.__releaseUpdate());assert.equal(await current.locator('input').count(),0);
    const unknown=await context.newPage();await unknown.goto(origin+prefix+'unknown.html');
    report=await current.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(report.reason,'client-not-ready');assert.equal(report.deleted.length,0);record('unknown-client-blocks-retirement');
    await unknown.evaluate(()=>navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.schema==='xtend.maraca.xtension-deployment-update-challenge.v1')event.ports[0].postMessage({schema:'xtend.maraca.xtension-deployment-update-ack.v1',nonce:'replayed',revision:event.data.revision,ready:true});}));
    report=await current.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(report.reason,'client-not-ready');assert.equal(report.deleted.length,0);record('replayed-acknowledgement-rejected');await unknown.close();
    const forged=await current.evaluate(async({revision})=>{const channel=new MessageChannel();return new Promise(resolve=>{channel.port1.onmessage=e=>resolve(e.data);navigator.serviceWorker.controller.postMessage({schema:'xtend.maraca.xtension-deployment-update-request.v1',requestId:crypto.randomUUID(),action:'collect',revision,cacheNames:['unrelated-application-cache']},[channel.port2]);});},{revision:route.b.manifest.revision.id});assert.equal(forged.reason,'invalid-request');record('arbitrary-cache-authority-rejected');
    report=await current.evaluate(()=>window.__updateClient.collectRetiredCaches());assert.equal(report.status,'ok',JSON.stringify(report));assert.deepEqual(report.deleted,[route.a.manifest.pwa.cacheName]);
    const keys=await current.evaluate(()=>caches.keys());assert(!keys.includes(route.a.manifest.pwa.cacheName));assert(keys.includes(route.b.manifest.pwa.cacheName));assert(keys.includes('unrelated-application-cache'));record('unanimous-current-clients-retire-only-owned-cache',{report});
    const restored=await current.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer())),oldUrl);assert.equal(hash(Buffer.from(restored)),route.a.manifest.files.find(row=>row.fileName===oldFile).sha256);record('late-retained-request-still-verified');
    const fresh=await open('B');assert(records.includes(origin+prefix+route.b.manifest.revision.clientFile));await fresh.evaluate(()=>window.__releaseUpdate());record('current-graph-remains-usable');
   }finally{await context.close();}
  }
  return {schema:'xtend.xtensions.deployment-update-acceptance-report.v1',ok:true,node:process.version,browser:await browser.version(),checks:cases.length,nativeBrowserExecution:true,activation:'natural',retirement:'explicit-unanimous-client-ack',trustedDocumentRequired:true,trustedWorkerRequired:true,workerRegistrationIntegrityEnforced:false,cases};
 }finally{if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)runUpdatesAcceptance().then(report=>{const i=process.argv.indexOf('--report');if(i!==-1)fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');console.log(`A04.3.7: ${report.checks} real update/cache cases pass on ${report.node} / Chromium ${report.browser}.`);}).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={runUpdatesAcceptance};
