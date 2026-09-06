'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn,execFileSync}=require('node:child_process');const {once}=require('node:events');
const packageRoot=path.dirname(require.resolve('@ccslabs/xtend/package.json'));
const {runFixture,availablePort}=require(path.join(packageRoot,'tools/browser-hypervisor'));
const product=path.resolve(__dirname,'..');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function stop(child){if(!child?.pid||child.exitCode!==null||child.signalCode!==null)return;const exited=once(child,'exit');child.kill('SIGTERM');let timer;await Promise.race([exited,new Promise(resolve=>{timer=setTimeout(resolve,3000);})]);clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}}
async function runBrowser(options={}){
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-store-browser-')),deployment=path.join(temporary,'shop');
 const checks=[],failures=[],scenarios=[],processes=[],proxies=[];let logs='';const assets=[],hostMeasurements=[];
 const reportDirectory=options.reportDirectory||path.join(product,'storage/reports/browser');fs.mkdirSync(reportDirectory,{recursive:true});
 const php=process.env.XTEND_PHP_BINARY||'php';
 const shopPort=await availablePort(),providerPort=await availablePort();const shopOrigin=`http://127.0.0.1:${shopPort}`,providerOrigin=`http://127.0.0.1:${providerPort}`;
 const env={...process.env,APP_URL:shopOrigin,DEMOPAY_ORIGIN:providerOrigin,PROVIDER_ORIGIN:providerOrigin,SHOP_ORIGIN:shopOrigin,APP_ENV:'production',APP_DEBUG:'false',XTEND_STORE_PROVIDER_METRICS_FILE:path.join(deployment,'storage/provider-metrics.log'),XTEND_STORE_REQUEST_METRICS_FILE:path.join(deployment,'storage/request-metrics.jsonl')};
 const providerExecutions=()=>{const result={};if(fs.existsSync(env.XTEND_STORE_PROVIDER_METRICS_FILE))for(const line of fs.readFileSync(env.XTEND_STORE_PROVIDER_METRICS_FILE,'utf8').trim().split('\n'))if(line)result[line]=(result[line]||0)+1;return result;};
 const check=async(name,run)=>{try{await run();checks.push(name);}catch(error){failures.push({name,message:error.message});}const partial=path.join(reportDirectory,'partial.json');fs.writeFileSync(partial+'.tmp',JSON.stringify({complete:false,checks,failures,scenarios},null,2)+'\n');fs.renameSync(partial+'.tmp',partial);};
 try{
  execFileSync(process.execPath,[path.join(product,'scripts/build.cjs')],{cwd:product,env,stdio:'pipe',timeout:180000,maxBuffer:16*1024*1024});
  for(const host of ['', 'payment-provider']){const directory=path.join(product,host,'public/build');for(const file of fs.readdirSync(directory,{recursive:true}))if(fs.statSync(path.join(directory,file)).isFile())assets.push({host:host||'shop',file,bytes:fs.statSync(path.join(directory,file)).size});}
  fs.cpSync(product,deployment,{recursive:true,filter:file=>!path.relative(product,file).split(path.sep).some(part=>['node_modules','.packages','storage','.git'].includes(part))&&!/\.sqlite(?:-|$)/u.test(file)});
  fs.mkdirSync(path.join(deployment,'storage'),{recursive:true});fs.copyFileSync(path.join(product,'storage/resume.pem'),path.join(deployment,'storage/resume.pem'));
  env.DB_DATABASE=path.join(deployment,'database/test.sqlite');
  execFileSync(php,[path.join(deployment,'scripts/setup.php')],{cwd:deployment,env,stdio:'pipe',timeout:30000});
  if(fs.existsSync(path.join(deployment,'node_modules')))throw new Error('Production fixture contains node_modules.');
  function serve(directory,port,router){const child=spawn(php,['-d','disable_functions=exec,shell_exec,system,passthru,proc_open,popen','-S',`127.0.0.1:${port}`,router],{cwd:directory,env:{...env,NODE_PATH:'',PATH:path.dirname(php)},stdio:['ignore','pipe','pipe']});child.on('error',error=>{logs+=error.message;});child.requestCount=0;for(const stream of [child.stdout,child.stderr]){let pending='';stream.on('data',chunk=>{logs=(logs+chunk).slice(-6000);pending+=chunk;const lines=pending.split('\n');pending=lines.pop();child.requestCount+=lines.filter(line=>line.endsWith(' Accepted')).length;});}processes.push(child);return child;}
  async function startHost(provider=false){
   const directory=provider?path.join(deployment,'payment-provider'):deployment;
   const port=provider?providerPort:shopPort;
   if(process.env.XTEND_SHOP_FPM_BINARY){
    const host=await require(path.join(packageRoot,'tools/browser-hypervisor/php-fpm')).startFpmProxy({binary:process.env.XTEND_SHOP_FPM_BINARY,fixture:directory,scriptFilename:path.join(directory,'public/index.php'),port,env,staticAssets:!provider,timeoutMs:35000});proxies.push(host);return host;
   }
   return serve(path.join(directory,'public'),port,provider?'index.php':'../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php');
  }
  const stopHost=host=>host.dispose?host.dispose():stop(host);
  let shop=await startHost();
  const provider=await startHost(true);
  const deadline=Date.now()+10000;
  for(const url of [shopOrigin,providerOrigin+'/health']){let ready=false;while(Date.now()<deadline&&!ready){try{ready=(await fetch(url,{signal:AbortSignal.timeout(1500)})).ok;}catch{}if(!ready)await pause(50);}if(!ready)throw new Error('Isolated PHP host did not become ready.');}
  const driverOptions={engine:'chromium',...options.browser};
  async function fixture(name,configuration){const before=providerExecutions();const result=await runFixture({...driverOptions,url:shopOrigin+'/produkt/nova-studio-kopfhoerer?sku=TEC-01-2',timeoutMs:90000,resultKey:'__STORE_TEST__',width:1440,height:1100,...configuration,screenshotPath:path.join(reportDirectory,name+'.png')});const calls=Object.fromEntries(Object.entries(providerExecutions()).map(([key,value])=>[key,value-(before[key]||0)]));scenarios.push({name,...result.result,providerExecutions:calls,screenshot:name+'.png',browser:result.browser});if(!result.result.ok)throw new Error(result.result.failure||'Browser scenario failed.');return result;}
  await check('PHP SSR emits indexable content and no provider request',async()=>{await pause(50);const before=provider.requestCount;const started=performance.now();const response=await fetch(shopOrigin+'/produkt/nova-studio-kopfhoerer');const html=await response.text();const responseMs=performance.now()-started;if(response.status!==200||!html.includes('NOVA Studio Kopfhörer')||!html.includes('application/ld+json')||!html.includes('rel="canonical"'))throw new Error('SSR metadata or product content absent.');if(!html.includes('data-rmt-resume-root="true"'))throw new Error('Signed resume root absent.');const missing=await fetch(shopOrigin+'/produkt/does-not-exist');if(missing.status!==404)throw new Error('Invalid product did not return 404.');await pause(50);if(provider.requestCount!==before)throw new Error('SSR unexpectedly contacted DemoPay.');scenarios.push({name:'ssr',ok:true,responseBytes:Buffer.byteLength(html),responseMs,providerRequests:provider.requestCount-before,runtime:process.env.XTEND_SHOP_FPM_BINARY?'php-fpm-proxy':'php'});});
  await check('missing page artifacts, mismatched runtimes and missing packaged dependencies fail closed',async()=>{
   const manifestFile=path.join(deployment,'bootstrap/xtend/pages.json');const original=fs.readFileSync(manifestFile);
   const runtime=path.join(deployment,'vendor/ccslabs/xtend-laravel/runtime/rmt-php-app-service-adapter.php');
   for(const scenario of ['artifact','fingerprint','dependency']){
    try{
     if(scenario==='artifact')fs.renameSync(manifestFile,manifestFile+'.test-hidden');
     if(scenario==='fingerprint'){const manifest=JSON.parse(original);manifest.runtimeFingerprints.php['rmt-php-app-service-adapter.php']='0'.repeat(64);fs.writeFileSync(manifestFile,JSON.stringify(manifest));}
     if(scenario==='dependency')fs.renameSync(runtime,runtime+'.test-hidden');
     const response=await fetch(shopOrigin+'/');if(response.status<500)throw new Error('Invalid deployment was accepted: '+scenario);
    }finally{
     if(fs.existsSync(manifestFile+'.test-hidden'))fs.renameSync(manifestFile+'.test-hidden',manifestFile);
     if(scenario==='fingerprint')fs.writeFileSync(manifestFile,original);
     if(fs.existsSync(runtime+'.test-hidden'))fs.renameSync(runtime+'.test-hidden',runtime);
    }
   }
  });
  await check('native search, filtering and persistent cart work with JavaScript disabled',async()=>{
   await fixture('without-javascript',{capabilities:{'goog:chromeOptions':{prefs:{'profile.managed_default_content_settings.javascript':2}}},scripts:[
    {script:"if(window.XTendPage)throw new Error('Application JavaScript was active');document.getElementById('product-cart-form').requestSubmit();"},
    {waitFor:"location.pathname==='/warenkorb'",script:"if(!document.querySelector('.cart-line-form'))throw new Error('Native add failed');document.querySelector('.cart-line-form [name=quantity]').value='2';document.querySelector('.cart-line-form').requestSubmit();"},
    {waitFor:"document.getElementById('cart-count')?.textContent.trim()==='2'",script:"document.querySelector('.remove-line').click();"},
    {waitFor:"document.getElementById('cart-count')?.textContent.trim()==='0'",script:"document.getElementById('store-search').value='Leuchte';document.querySelector('form[role=search]').requestSubmit();"},
    {waitFor:"location.pathname==='/suche'",script:"const ok=!window.XTendPage&&document.querySelector('.store-card-name')?.textContent.toLocaleLowerCase('de').includes('leuchte');window.__STORE_TEST__={status:ok?'passed':'failed',ok,failure:ok?null:'Native search failed'};"}
   ]});
  });
  await check('an early action is captured and replayed exactly once after signed resume',()=>fixture('early-action',{
   preloadScript:`window.addEventListener('xtend-page:capturing',()=>{window.__EARLY_BUTTON__=document.getElementById('add-cart');window.__EARLY_BUTTON__.click();},{once:true});`,
   scripts:[{waitFor:"window.XTendPage?.getRuntime()?.model.snapshot().states['shop.data'].cart.count===1",script:`setTimeout(()=>{const root=document.getElementById('xtend-page');const ok=root.dataset.rmtResumeStatus==='resumed'&&document.getElementById('add-cart')===window.__EARLY_BUTTON__&&window.XTendPage.getRuntime().model.snapshot().states['shop.data'].cart.count===1;window.__STORE_TEST__={ok,status:ok?'passed':'failed',failure:ok?null:'Early action was lost, duplicated or replaced its SSR control'};},500);`}]
  }));
  await check('a rejected verification key permits exactly one visible hydration fallback',()=>fixture('invalid-key',{
   preloadScript:`const original=SubtleCrypto.prototype.importKey;SubtleCrypto.prototype.importKey=function(format,key,...rest){if(format==='jwk'&&key?.crv==='P-256')return Promise.reject(new Error('Deliberately rejected test key'));return original.call(this,format,key,...rest);};`,
   scripts:[{waitFor:"window.XTendPage",script:`const status=document.getElementById('xtend-page').dataset.rmtResumeStatus;const ok=status==='fallback_hydrated';window.__STORE_TEST__={ok,status:ok?'passed':'failed',resumeStatus:status,failure:ok?null:'Missing explicit hydration fallback'};`}]
  }));
  const source=fs.readFileSync(path.join(__dirname,'purchase.browser.js'),'utf8');
  for(const scenario of (options.scenarios||['success','declined','cancel','timeout','integrity','foreign-patch','interrupted','navigation','preview']))await check(`guest checkout: ${scenario}`,async()=>{
   const adapter=path.join(deployment,'payment-provider/public/build/adapter.mjs'),original=fs.readFileSync(adapter);
   let preloadScript;
   if(scenario==='success')preloadScript=`const original=window.fetch;window.fetch=async function(url,options){if(String(url).includes('/shop.payment.complete')){const responses=await Promise.all([original.call(this,url,options),original.call(this,url,options)]);const payloads=await Promise.all(responses.map(response=>response.clone().json()));window.__STORE_DUPLICATE__={ok:responses.every(response=>response.ok)&&payloads[0].value?.id===payloads[1].value?.id};return responses[0];}return original.call(this,url,options);};`;

   if(scenario==='integrity')fs.appendFileSync(adapter,'\n// Deliberate integrity mismatch for the negative acceptance.\n');
   if(['foreign-patch','interrupted'].includes(scenario))preloadScript=`const original=window.fetch;window.fetch=async function(url,options){const response=await original.call(this,url,options);if(!String(url).includes('/demopay.fragments'))return response;const text=await response.text();const frames=text.trim().split('\\n').map(line=>JSON.parse(line));${scenario==='foreign-patch'?"frames.find(frame=>frame.type==='delta').value.target='shop.data';":"frames.splice(frames.findIndex(frame=>frame.type==='complete'));"}return new Response(frames.map(frame=>JSON.stringify(frame)).join('\\n')+'\\n',{status:response.status,headers:response.headers});};`;
   try{await fixture('checkout-'+scenario,{preloadScript,scripts:[{script:source,args:[scenario]}],width:scenario==='cancel'?390:1440,height:scenario==='cancel'?844:1100});}finally{if(scenario==='integrity')fs.writeFileSync(adapter,original);}
  });
  await check('PHP restart preserves a real guest session and cart',async()=>{
   const cookies=new Map();
   async function request(url,options={}) {const response=await fetch(shopOrigin+url,{...options,redirect:'manual',headers:{...options.headers,Cookie:[...cookies].map(([key,value])=>key+'='+value).join('; ')},signal:AbortSignal.timeout(5000)});for(const entry of response.headers.getSetCookie()){const pair=entry.split(';')[0],index=pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));}return response;}
   const initial=await (await request('/warenkorb')).text();
   const token=initial.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1];if(!token)throw new Error('Missing native CSRF token.');
   const added=await request('/cart/add',{method:'POST',body:new URLSearchParams({_token:token,sku:'WOH-01-2',quantity:'1',version:'0'})});if(added.status!==302)throw new Error('Persistence setup failed.');
   await stopHost(shop);shop=await startHost();await pause(300);
   const html=await(await request('/warenkorb')).text();const page=JSON.parse(html.match(/<script[^>]*id="xtend-page-data"[^>]*>([\s\S]*?)<\/script>/)?.[1]||'null');
   if(page?.props?.['shop.data']?.cart?.count!==1)throw new Error('The guest cart did not survive a host restart.');
  });
 }catch(error){failures.push({name:'fixture',message:error.message});}
 finally{for(const proxy of proxies.reverse())await proxy.dispose();for(const child of processes.reverse())await stop(child);if(fs.existsSync(env.XTEND_STORE_REQUEST_METRICS_FILE))for(const line of fs.readFileSync(env.XTEND_STORE_REQUEST_METRICS_FILE,'utf8').trim().split('\n'))if(line)hostMeasurements.push(JSON.parse(line));fs.rmSync(temporary,{recursive:true,force:true});}
 return {ok:failures.length===0,checks,failures,scenarios,assets,hostMeasurements,diagnostics:failures.length?logs.replace(/(?:Bearer|token|secret|key)[=: ]+[^\s]+/giu,'[redacted]'):undefined};
}
module.exports={runBrowser};
