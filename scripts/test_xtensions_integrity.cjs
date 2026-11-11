#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{createRequire}=require('node:module');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sri=bytes=>'sha256-'+createHash('sha256').update(bytes).digest('base64');
async function runIntegrityAcceptance({rootDir=path.resolve(__dirname,'..'),peerRoot=process.env.XTENSIONS_TEST_PEERS,executablePath=process.env.CHROME_BIN}={}){
 if(!peerRoot||!executablePath)throw Error('Native integrity acceptance requires isolated peers and Chromium; no skip is allowed.');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-native-integrity-')),peers=createRequire(path.join(peerRoot,'package.json')),api=require('../xtend-maraca/xtension-composition'),reference=require('../development/rmtx-a04/integration-reference.cjs');
 const builds={},applications={},routes=new Map(),cases=[],requests=[];let server,browser;
 try{
  const vendor=await require('esbuild').build({stdin:{contents:`import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';const ReactDOM={...client,version:dom.version};export {React,ReactDOM,Vue};`,resolveDir:rootDir},nodePaths:[path.join(peerRoot,'node_modules')],bundle:true,format:'esm',platform:'browser',write:false,define:{'process.env.NODE_ENV':'"production"',__VUE_OPTIONS_API__:'true',__VUE_PROD_DEVTOOLS__:'false',__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:'false'}});
  const bootstrap=await require('esbuild').build({stdin:{contents:`
   import {React,ReactDOM,Vue} from './vendor.mjs';
   const {createXtendFabric}=require('./fabric/xtend-fabric'),{createRepeatedDataSourceAdapter}=require('./development/rmtx-a02/repeated-filters');
   window.__XTendMaracaDisableAutoBoot=true;window.__sealedStats={admissions:0,factories:0,loads:0,done:false};
   window.__sealedResult=(async()=>{const stats=window.__sealedStats,framework=document.documentElement.dataset.framework;
    globalThis.__XTendA043Observe=()=>{if(!stats.admissions)throw Error('Native admission missing');stats.factories++;};
    const actual=createXtendFabric(),fabric={...actual,createBoundary(...args){const b=actual.createBoundary(...args);return {...b,run(phase,task,metadata){if(metadata?.kernelJobId)stats.admissions++;return b.run(phase,task,metadata);}};}};
    let app;try{const generated=await import('./xtend.maraca.mjs');app=generated.createXtendMaraca({windowTarget:window,documentTarget:document,platformTarget:{}});
     const ids=framework==='mixed'?['mixed-filter-0','mixed-filter-1']:['filter-panel'],grants=Object.fromEntries(ids.map(id=>[id,{work:{scan:{lane:'background'}},workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}}}]));
     await app.boot({root:document.querySelector('main'),fabric,dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()},xtensions:{grants,loadPeerGroup({group}){stats.loads++;return group.framework==='react'?{React,ReactDOM}:{Vue};}}});stats.booted=true;stats.inputs=document.querySelectorAll('input').length;
    }catch(error){stats.error=String(error);}finally{if(app){app.dispose();await app.facade.whenXTensionsIdle();}stats.afterDispose=document.querySelectorAll('input').length;delete globalThis.__XTendA043Observe;stats.done=true;}return stats;})();`,resolveDir:rootDir},external:['./vendor.mjs'],bundle:true,format:'esm',platform:'browser',write:false});
  for(const framework of ['react','vue','mixed']){
   const app=path.join(temp,framework);fs.mkdirSync(app);fs.writeFileSync(path.join(app,'bootstrap.mjs'),bootstrap.outputFiles[0].contents);fs.writeFileSync(path.join(app,'vendor.mjs'),vendor.outputFiles[0].contents);
   const input=reference.withDeliveryProfile(reference.createBuildInput(framework,path.join(app,'build'),{profile:framework==='vue'?'max':'production'}));
   // The generated document is the trust anchor. Framework identity is ordinary
   // immutable application data in the explicitly pinned bootstrap module.
   const bytes=Buffer.from(bootstrap.outputFiles[0].text.replace('document.documentElement.dataset.framework',JSON.stringify(framework)));fs.writeFileSync(path.join(app,'bootstrap.mjs'),bytes);
   builds[framework]=await require('../xtend-maraca').buildMaracaBundleAsync(input,{rootDir});assert(builds[framework].ok);
   applications[framework]={rootDir:app,bootstrap:{fileName:'bootstrap.mjs',sha256:hash(bytes)},modules:[{fileName:'vendor.mjs',sha256:hash(vendor.outputFiles[0].contents)}]};
  }
  const definitions=[...['react','vue','mixed'].map(framework=>['ok',framework]),...['bootstrap','peers','app','platform','kernel','companion','helper'].flatMap(role=>['react','vue'].map(framework=>['tamper-'+role,framework])),['no-map','mixed'],['no-helper-pin','react'],['sw-tamper','react'],['sw-cache','vue'],['redirect-tamper','mixed'],['unlisted','mixed']];
  for(const [scenario,framework] of definitions){
   const publicPath=`/sealed/${scenario}/${framework}/`,built=api.buildMaracaXTensionDeployment({schema:'xtend.maraca.xtension-deployment-config.v1',build:builds[framework],application:applications[framework],publicPath,outputDir:path.join(temp,'sealed-'+scenario+'-'+framework)});
   assert(built.accounting.frameworkBytes<=2200000);assert(built.accounting.xtensionRuntimeBytes<=240000);
   const loaded=api.loadMaracaXTensionDeployment({rootDir:built.outputDir,manifestSha256:built.manifestSha256}),files=loaded.manifest.files;
   const helper=files.find(row=>row.fileName.includes('/format.mjs-')).fileName,companion=files.find(row=>/^xtend\.xtensions-[a-f0-9]+\.mjs$/.test(row.fileName)).fileName;
   const role=scenario.slice(7),target=role==='bootstrap'?'bootstrap.mjs':role==='peers'?'vendor.mjs':role==='app'?'xtend.maraca.mjs':role==='platform'?'runtime/xtension-platform.mjs':role==='kernel'?'runtime/rmt-kernel-scheduler.mjs':role==='companion'?companion:helper;
   routes.set(publicPath,{scenario,framework,built,loaded,handler:api.createMaracaXTensionDeploymentHandler(loaded),helper,target});
  }
  const suffix=Buffer.from('\n;globalThis.__tamperedCodeExecuted=true;\n');
  server=http.createServer((req,res)=>{
   const route=[...routes.entries()].find(([prefix])=>req.url.startsWith(prefix));if(!route){res.writeHead(404);return res.end();}
   const [prefix,entry]=route,{scenario,loaded,helper}=entry,file=req.url.slice(prefix.length);requests.push({prefix,file});
   if(file==='seed.html'){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><body>Service worker setup</body>');}
   if(file==='seed-sw.js'){
    const target=prefix+helper,changed=scenario==='sw-tamper';
    const source=`self.addEventListener('install',e=>e.waitUntil((async()=>{const r=await fetch(${JSON.stringify(target)});const body=await r.text();const cache=await caches.open('native-integrity');await cache.put(${JSON.stringify(target)},new Response(body+${JSON.stringify(changed?suffix.toString():'')},{headers:{'Content-Type':'text/javascript'}}));await self.skipWaiting();})()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(new URL(e.request.url).pathname===${JSON.stringify(target)})e.respondWith(caches.match(${JSON.stringify(target)}));});`;
    res.writeHead(200,{'Content-Type':'text/javascript','Service-Worker-Allowed':prefix});return res.end(source);
   }
   if(scenario==='redirect-tamper'&&file===helper){res.writeHead(302,{Location:prefix+'redirected.mjs'});return res.end();}
   if(file==='redirected.mjs'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(Buffer.concat([fs.readFileSync(path.join(loaded.outputDir,helper)),suffix]));}
   let replacement;
   if((scenario==='no-map'||scenario==='no-helper-pin')&&(!file||file==='index.html')){
    let html=fs.readFileSync(path.join(loaded.outputDir,'index.html'),'utf8');const match=html.match(/<script type="importmap">(.*?)<\/script>/s);
    if(scenario==='no-map')html=html.replace(match[0],'');else{const map=JSON.parse(match[1]);delete map.integrity[prefix+helper];const next=JSON.stringify(map);html=html.replace(match[1],next);const csp=loaded.headers['Content-Security-Policy'].replace(sri(match[1]),sri(next));res.setHeader('Content-Security-Policy',csp);}
    replacement=Buffer.from(html);
   }
   const mutate=scenario.startsWith('tamper-')&&file===entry.target;
   const response={setHeader(name,value){if(name==='Content-Security-Policy'&&res.hasHeader(name))return;res.setHeader(name,value);},writeHead(status,headers){return res.writeHead(status,{...headers,...(replacement?{'Content-Length':replacement.length}:mutate?{'Content-Length':Number(headers['Content-Length'])+suffix.length}:{})});},end(bytes){res.end(replacement||mutate?replacement||Buffer.concat([bytes,suffix]):bytes);}};
   if(!entry.handler(req,response)){res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  browser=await peers('playwright').chromium.launch({executablePath,headless:true});
  for(const [prefix,entry] of routes){
   const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage(),failures=[],consoleErrors=[];page.on('requestfailed',r=>failures.push(r.url()));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
   try{
    if(entry.scenario.startsWith('sw-')){
     await page.goto(origin+prefix+'seed.html');await page.evaluate(async()=>{const registration=await navigator.serviceWorker.register('./seed-sw.js');if(!registration.active)await new Promise(resolve=>{const worker=registration.installing||registration.waiting;worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();});});await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    }
    await page.goto(origin+prefix,{waitUntil:'networkidle'});
    const early=entry.scenario==='tamper-bootstrap'||entry.scenario==='tamper-peers'||entry.scenario==='no-map';
    if(!early)await page.waitForFunction(()=>window.__sealedStats?.done,{timeout:15000});
    const stats=await page.evaluate(()=>window.__sealedStats||null),tampered=await page.evaluate(()=>!!window.__tamperedCodeExecuted);
    const success=['ok','sw-cache','unlisted'].includes(entry.scenario);
    assert(!tampered,'No changed byte stream may execute');
    if(success){assert(stats?.booted,stats?.error);assert.equal(stats.inputs,entry.framework==='mixed'?2:3);assert.equal(stats.factories,stats.inputs);assert.equal(stats.loads,entry.framework==='mixed'?2:1);assert(stats.admissions>0);assert.equal(stats.afterDispose,0);}
    else{assert(!stats?.booted);assert.equal(stats?.factories||0,0);assert.equal(stats?.loads||0,0);assert(failures.length||consoleErrors.some(text=>/integrity|Content Security|blocked/i.test(text)),'Native browser enforcement must reject the module');}
    if(entry.scenario.startsWith('sw-'))assert(await page.evaluate(()=>!!navigator.serviceWorker.controller),'The actual controlled page exercises cached responses');
    if(entry.scenario==='unlisted'){
     assert(await page.evaluate(async()=>{try{await import('./unknown.mjs');return false;}catch(_){return true;}}));assert(!requests.some(row=>row.prefix===prefix&&row.file==='unknown.mjs'),'An unpinned module cannot reach the HTTP handler');
    }
    cases.push({name:`A04.3.5: ${entry.framework} ${entry.scenario}`,passed:true,scenario:entry.scenario,framework:entry.framework,stats,requestFailures:failures,accounting:entry.built.accounting});
   }finally{await context.close();}
  }
  return {schema:'xtend.xtensions.integrity-acceptance-report.v1',ok:true,node:process.version,browser:await browser.version(),checks:cases.length,browserByteIntegrityEnforced:true,scope:'sealed-browser-javascript-graph',trustedDocumentRequired:true,cases};
 }finally{if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)runIntegrityAcceptance().then(report=>{const i=process.argv.indexOf('--report');if(i!==-1)fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');console.log(`A04.3.5: ${report.checks} native integrity cases pass on ${report.node} / Chromium ${report.browser}.`);}).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={runIntegrityAcceptance};
