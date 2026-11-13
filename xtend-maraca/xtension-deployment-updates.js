// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs=require('node:fs'),{createHash}=require('node:crypto');
const legacy=require('./xtension-deployment-pwa');
const hash=b=>createHash('sha256').update(b).digest('hex');
const clientFile='xtend.deployment-client.mjs',declarationFile='xtend.deployment-client.d.mts';
function validatePolicy(value){
 if(!value||Object.keys(value).sort().join(',')!=='acknowledgementTimeoutMs,appServices,pwa,schema,updates'||value.schema!=='xtend.maraca.xtension-deployment-runtime-policy.v2'||value.pwa!=='verified-static-cache'||!['disabled','separate-server'].includes(value.appServices)||value.updates!=='coordinated'||!Number.isSafeInteger(value.acknowledgementTimeoutMs)||value.acknowledgementTimeoutMs<100||value.acknowledgementTimeoutMs>5000)throw new TypeError('A closed coordinated runtime policy v2 is required.');
}
function revisionFor(options,files,retained){
 const id=hash(JSON.stringify({apiVersion:'3.0.0',generator:hash(Buffer.concat(['xtension-deployment.js','xtension-deployment-updates.js','xtension-deployment-pwa.js','xtension-deployment-client.d.ts'].map(file=>fs.readFileSync(__dirname+'/'+file)))),origin:options.origin,publicPath:options.publicPath,runtime:options.runtime,retained,
  files:[...files].map(([file,bytes])=>({file,sha256:hash(bytes)})).sort((a,b)=>a.file<b.file?-1:1)}));
 return {schema:'xtend.maraca.xtension-deployment-revision.v1',id,assetRoot:'_xtend/'+id+'/',clientFile:'_xtend/'+id+'/'+clientFile};
}
function clientSource(manifest){
 const metadata={schema:'xtend.maraca.xtension-deployment-client.v1',revision:manifest.revision.id,scope:manifest.origin+manifest.publicPath,workerUrl:manifest.origin+manifest.publicPath+manifest.revision.assetRoot+legacy.workerFile,acknowledgementTimeoutMs:manifest.runtime.acknowledgementTimeoutMs};
 return Buffer.from(`export const DEPLOYMENT_CLIENT_API_VERSION='1.0.0';
export const deployment=Object.freeze(${JSON.stringify(metadata)});
export function createDeploymentClient(){
 const container=navigator.serviceWorker,channels=new Set();let ready=false,disposed=false;
 function release(port){channels.delete(port);port.close();}
 function challenge(event){
  const data=event.data,port=event.ports[0];
  if(!port||event.source!==container.controller||event.source?.scriptURL!==deployment.workerUrl||data?.schema!=='xtend.maraca.xtension-deployment-update-challenge.v1'||typeof data.nonce!=='string')return;
  const granted=!disposed&&ready&&data.revision===deployment.revision;
  port.postMessage({schema:'xtend.maraca.xtension-deployment-update-ack.v1',nonce:data.nonce,revision:deployment.revision,ready:granted});
  if(!granted){port.close();return;}
  channels.add(port);const timer=setTimeout(()=>release(port),deployment.acknowledgementTimeoutMs+10000);
  port.onmessage=()=>{clearTimeout(timer);release(port);};port.start();
 }
 container.addEventListener('message',challenge);
 function blocked(action,reason){return Object.freeze({schema:'xtend.maraca.xtension-deployment-update-response.v1',requestId:'',action,status:'blocked',reason,revision:deployment.revision,waiting:false,candidates:[],deleted:[]});}
 function rpc(target,action){
  if(disposed)return Promise.resolve(blocked(action,'disposed'));
  if(!target||!(target.scriptURL===deployment.workerUrl||action==='status'&&target.scriptURL.startsWith(deployment.scope+'_xtend/')&&target.scriptURL.endsWith('/xtend.sealed-service-worker.js')))return Promise.resolve(blocked(action,'no-matching-worker'));
  return new Promise(resolve=>{const channel=new MessageChannel(),requestId=crypto.randomUUID();
   const timer=setTimeout(()=>{channel.port1.close();resolve(blocked(action,'worker-timeout'));},deployment.acknowledgementTimeoutMs+10000);
   channel.port1.onmessage=event=>{const value=event.data;if(value?.schema!=='xtend.maraca.xtension-deployment-update-response.v1'||value.requestId!==requestId||value.action!==action||!['ok','blocked'].includes(value.status)||!Array.isArray(value.deleted)||!Array.isArray(value.candidates))return;clearTimeout(timer);channel.port1.close();resolve(Object.freeze(value));};
   try{target.postMessage({schema:'xtend.maraca.xtension-deployment-update-request.v1',requestId,action,revision:deployment.revision},[channel.port2]);}catch(_){clearTimeout(timer);channel.port1.close();resolve(blocked(action,'worker-unavailable'));}
  });
 }
 return Object.freeze({
  setReadyForRetirement(value){if(typeof value!=='boolean')throw TypeError('A boolean retirement lease is required');ready=value;if(!ready)for(const port of channels)port.postMessage({cancel:true});},
  async status(){const registration=await container.getRegistration(deployment.scope);return rpc(registration?.active,'status');},
  async checkForUpdate(){const registration=await container.getRegistration(deployment.scope);if(!registration)return blocked('status','no-registration');try{await registration.update();}catch(_){return blocked('status','update-failed');}return rpc(registration.waiting||registration.active,'status');},
  async collectRetiredCaches(){const registration=await container.getRegistration(deployment.scope);return rpc(registration?.active,'collect');},
  dispose(){disposed=true;ready=false;container.removeEventListener('message',challenge);for(const port of channels){port.postMessage({cancel:true});release(port);}}
 });
}
`);
}
function declarations(){return fs.readFileSync(__dirname+'/xtension-deployment-client.d.ts');}
function pwaFor(manifest,files){
 const manifestFile=manifest.pwa?.manifestFile,offlineFile=manifest.revision.assetRoot+legacy.offlineFile;
 if(!manifestFile||!files.has(manifestFile))throw new TypeError('A revision-owned Web App Manifest is required.');
 const webmanifest=JSON.parse(files.get(manifestFile));if(webmanifest.start_url!==manifest.publicPath||webmanifest.scope!==manifest.publicPath)throw new TypeError('PWA launch/scope mismatch.');
 const pins=Object.fromEntries([...files].filter(([file])=>file.startsWith(manifest.revision.assetRoot)&&file!==manifest.revision.assetRoot+legacy.workerFile&&(/\.(?:mjs|js|css|webmanifest|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf)$/.test(file)||file===manifestFile||file===offlineFile)).sort(([a],[b])=>a<b?-1:1).map(([file,bytes])=>[manifest.publicPath+file,{sha256:hash(bytes),bytes:bytes.length}]));
 return {workerFile:manifest.revision.assetRoot+legacy.workerFile,offlineFile,manifestFile,cacheName:'xtend-sealed-'+hash(JSON.stringify({origin:manifest.origin,pins})),pins};
}
function workerSource(pwa,manifest){
 const inherited=legacy.workerSource({...pwa,offlineFile:legacy.offlineFile});
 // The v2 transport is retained verbatim; only its lifecycle/fetch listeners are replaced below.
 const checkedSource=inherited.toString().slice(0,inherited.toString().indexOf("self.addEventListener('install'"));
 const archives=manifest.retained.filter(row=>row.cacheName).map(row=>({cacheName:row.cacheName,pins:row.pins}));
 return Buffer.from(checkedSource+`
const REVISION=${JSON.stringify(manifest.revision.id)},SCOPE=${JSON.stringify(manifest.origin+manifest.publicPath)},ARCHIVES=${JSON.stringify(archives)},ACK_TIMEOUT=${manifest.runtime.acknowledgementTimeoutMs};
let collecting=false,unlock=()=>{},barrier=Promise.resolve();
const inScope=url=>typeof url==='string'&&url.startsWith(SCOPE);
const windows=async()=> (await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(client=>inScope(client.url));
self.addEventListener('install',event=>event.waitUntil((async()=>{const entries=await Promise.all(Object.keys(PINS).map(async file=>[file,await network(file)]));const cache=await caches.open(CACHE);for(const [file,response]of entries)await cache.put(new URL(file,self.location.origin),response);})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
function answer(client,nonce){
 const channel=new MessageChannel();let cancelled=false;
 const result=new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),ACK_TIMEOUT);channel.port1.onmessage=event=>{const d=event.data;if(d?.cancel===true){cancelled=true;return;}clearTimeout(timer);resolve(d&&Object.keys(d).sort().join(',')==='nonce,ready,revision,schema'&&d.schema==='xtend.maraca.xtension-deployment-update-ack.v1'&&d.nonce===nonce&&d.revision===REVISION&&d.ready===true);};});
 client.postMessage({schema:'xtend.maraca.xtension-deployment-update-challenge.v1',nonce,revision:REVISION},[channel.port2]);
 return {result,cancelled:()=>cancelled,close(){channel.port1.postMessage({finished:true});channel.port1.close();}};
}
self.addEventListener('message',event=>{
 const d=event.data,port=event.ports[0];if(!port)return;
 event.waitUntil((async()=>{
  const response={schema:'xtend.maraca.xtension-deployment-update-response.v1',requestId:d?.requestId,action:d?.action,status:'blocked',reason:'invalid-request',revision:REVISION,waiting:!!self.registration.waiting,candidates:[...new Set(ARCHIVES.map(row=>row.cacheName))].filter(name=>name!==CACHE),deleted:[]};
  const reply=()=>{port.postMessage(response);port.close();};
  if(!d||Object.keys(d).sort().join(',')!=='action,requestId,revision,schema'||d.schema!=='xtend.maraca.xtension-deployment-update-request.v1'||!['status','collect'].includes(d.action)||typeof d.requestId!=='string'||d.requestId.length>64||typeof d.revision!=='string'||!event.source?.id||event.source.type!=='window')return reply();
  const source=await self.clients.get(event.source.id);if(!source||!inScope(source.url))return reply();
  if(d.action==='status'){response.status='ok';response.reason=null;return reply();}
  if(d.revision!==REVISION){response.reason='controller-mismatch';return reply();}
  if(self.registration.active?.scriptURL!==self.location.href||self.registration.waiting||self.registration.installing){response.reason='update-in-progress';return reply();}
  if(collecting){response.reason='retirement-in-progress';return reply();}
  collecting=true;barrier=new Promise(resolve=>{unlock=resolve;});const leases=[];
  try{
   const clients=await windows(),identity=clients.map(c=>c.id+' '+c.url).sort().join('\\n');
   const nonce=crypto.randomUUID();for(const client of clients)leases.push(answer(client,nonce));
   if(!(await Promise.all(leases.map(lease=>lease.result))).every(Boolean)||leases.some(lease=>lease.cancelled())){response.reason='client-not-ready';return;}
   const current=await windows();
   if(identity!==current.map(c=>c.id+' '+c.url).sort().join('\\n')||self.registration.waiting||self.registration.installing||leases.some(lease=>lease.cancelled())){response.reason='clients-changed';return;}
   for(const name of response.candidates){if(leases.some(lease=>lease.cancelled())){response.reason='lease-revoked';return;}if(await caches.delete(name))response.deleted.push(name);}
   response.status='ok';response.reason=null;
  }finally{for(const lease of leases)lease.close();collecting=false;unlock();reply();}
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('authorization'))return;
 if(request.mode==='navigate'){const wait=barrier;event.respondWith(wait.then(()=>fetch(request)).catch(async()=>checked(await(await caches.open(CACHE)).match(new URL(FALLBACK,self.location.origin)),PINS[FALLBACK])));return;}
 if(url.search)return;
 let cacheName=CACHE,pin=PINS[url.pathname];
 if(!pin){const previous=ARCHIVES.find(row=>Object.hasOwn(row.pins,url.pathname));if(!previous)return;cacheName=previous.cacheName;pin=previous.pins[url.pathname];}
 event.respondWith((async()=>{const cache=await caches.open(cacheName),cached=await cache.match(url.href);if(cached)return checked(cached,pin);
  const integrity='sha256-'+btoa(String.fromCharCode(...Uint8Array.from(pin.sha256.match(/../g),n=>parseInt(n,16))));
  const response=await checked(await fetch(url.href,{credentials:'omit',cache:'no-store',redirect:'error',integrity}),pin);await cache.put(url.href,response.clone());return response;})());
});
`);
}
module.exports={clientFile,declarationFile,validatePolicy,revisionFor,clientSource,declarations,pwaFor,workerSource};
