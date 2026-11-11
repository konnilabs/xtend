// SPDX-License-Identifier: Apache-2.0
'use strict';
const {createHash}=require('node:crypto');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const workerFile='xtend.sealed-service-worker.js',offlineFile='xtend.sealed-offline.html';
const offline=Buffer.from('<!doctype html><meta charset="utf-8"><title>XTend offline</title><main><h1>Offline</h1><p>Please reconnect to open this application.</p></main>\n');
const policySchema='xtend.maraca.xtension-deployment-runtime-policy.v1';
function validatePolicy(value){
 if(!value||Object.keys(value).sort().join(',')!=='appServices,pwa,schema'||value.schema!==policySchema||!['disabled','verified-static-cache'].includes(value.pwa)||!['disabled','separate-server'].includes(value.appServices))throw new TypeError('A closed versioned deployment runtime policy is required.');
}
function validateOrigin(value){
 const url=new URL(value);
 if(url.origin!==value||!(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new TypeError('A canonical HTTPS origin or trusted loopback origin is required.');
}
const cacheable=file=>/\.(?:mjs|js|css|webmanifest|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf)$/.test(file)&&file!==workerFile;
function pwaFor(manifest,files){
 if(manifest.runtime.pwa==='disabled')return null;
 const manifestFile=manifest.pwa?.manifestFile;
 if(typeof manifestFile!=='string'||!files.has(manifestFile)||! /\.(?:json|webmanifest)$/.test(manifestFile))throw new TypeError('The sealed PWA requires its captured Web App Manifest.');
 const webmanifest=JSON.parse(files.get(manifestFile));
 if(webmanifest.start_url!==manifest.publicPath||webmanifest.scope!==manifest.publicPath)throw new TypeError('PWA launch and scope must match the sealed public root.');
 const pins=Object.fromEntries([...files].filter(([file])=>cacheable(file)||file===offlineFile||file===manifestFile).sort(([a],[b])=>a<b?-1:1).map(([file,bytes])=>[manifest.publicPath+file,{sha256:hash(bytes),bytes:bytes.length}]));
 const cacheName='xtend-sealed-'+hash(JSON.stringify({origin:manifest.origin,pins}));
 return {workerFile,offlineFile,manifestFile,cacheName,pins};
}
function workerSource(pwa){
 return Buffer.from(`'use strict';
// Trusted worker entry: registration has no SRI option. Module execution retains native SRI.
const CACHE=${JSON.stringify(pwa.cacheName)},PINS=${JSON.stringify(pwa.pins)},FALLBACK=${JSON.stringify(Object.keys(pwa.pins).find(file=>file.endsWith('/'+offlineFile)))};
async function checked(response,pin){
 if(!response||!response.ok||response.redirected||response.type==='opaque')throw Error('Sealed static response rejected');
 const bytes=await response.clone().arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 if(bytes.byteLength!==pin.bytes||digest!==pin.sha256)throw Error('Sealed static integrity mismatch');
 return response;
}
async function network(file){
 const pin=PINS[file],integrity='sha256-'+btoa(String.fromCharCode(...Uint8Array.from(pin.sha256.match(/../g),n=>parseInt(n,16))));
 return checked(await fetch(new URL(file,self.location.origin),{credentials:'omit',cache:'no-store',redirect:'error',integrity}),pin);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const entries=await Promise.all(Object.keys(PINS).map(async file=>[file,await network(file)]));
 const cache=await caches.open(CACHE);for(const [file,response]of entries)await cache.put(new URL(file,self.location.origin),response);
})()));
// Normal update lifecycle: no skipWaiting, deletion of other caches or forced takeover.
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('authorization'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>{
   const cached=await(await caches.open(CACHE)).match(new URL(FALLBACK,self.location.origin));
   return checked(cached,PINS[FALLBACK]);
  }));return;
 }
 if(url.search||!Object.hasOwn(PINS,url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(url.href);
  if(cached)return checked(cached,PINS[url.pathname]);
  const response=await network(url.pathname);await cache.put(url.href,response.clone());return response;
 })());
});
`);
}
module.exports={workerFile,offlineFile,offline,validatePolicy,validateOrigin,pwaFor,workerSource};
