// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs=require('node:fs'),{createHash}=require('node:crypto');
const updates=require('./xtension-deployment-updates'),pwa=require('./xtension-deployment-pwa');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const headFile='xtend.deployment-head.json',protocolFile='xtend.deployment-protocol.mjs';
function revisionFor(options,files,retained){
 const generator=['xtension-deployment.js','xtension-deployment-updates.js','xtension-deployment-lifecycle.js','xtension-deployment-pwa.js','xtension-deployment-client.d.ts','xtension-deployment-lifecycle-client.d.ts'].map(file=>({file,sha256:hash(fs.readFileSync(__dirname+'/'+file))}));
 const id=hash(JSON.stringify({apiVersion:'3.0.0',generator,origin:options.origin,publicPath:options.publicPath,runtime:options.runtime,retained,files:[...files].map(([file,bytes])=>({file,sha256:hash(bytes)})).sort((a,b)=>a.file<b.file?-1:1)}));
 return {schema:'xtend.maraca.xtension-deployment-revision.v1',id,assetRoot:'_xtend/'+id+'/',clientFile:'_xtend/'+id+'/'+updates.clientFile};
}
function headSource(manifest){
 return Buffer.from(JSON.stringify({schema:'xtend.maraca.xtension-deployment-head.v1',revision:manifest.revision.id,scope:manifest.origin+manifest.publicPath,documentUrl:manifest.origin+manifest.publicPath,workerUrl:manifest.origin+manifest.publicPath+manifest.revision.assetRoot+pwa.workerFile})+'\n');
}
function clientSource(manifest){
 const metadata={schema:'xtend.maraca.xtension-deployment-client.v1',revision:manifest.revision.id,scope:manifest.origin+manifest.publicPath,workerUrl:manifest.origin+manifest.publicPath+manifest.revision.assetRoot+pwa.workerFile,acknowledgementTimeoutMs:manifest.runtime.acknowledgementTimeoutMs,headUrl:manifest.origin+manifest.publicPath+headFile};
 return Buffer.from(`import {createDeploymentClient as createProtocolClient} from './${protocolFile}';
export const DEPLOYMENT_CLIENT_API_VERSION='1.0.0';
export const deployment=Object.freeze(${JSON.stringify(metadata)});
export function createDeploymentClient(){
 const protocol=createProtocolClient(),pending=new Set();let disposed=false;
 function blocked(reason){return Object.freeze({schema:'xtend.maraca.xtension-deployment-update-response.v1',requestId:'',action:'status',candidates:[],deleted:[],status:'blocked',reason,currentRevision:deployment.revision,revision:deployment.revision,updateAvailable:false,requiresDocumentNavigation:false,documentUrl:null,workerUrl:null,waiting:false});}
 return Object.freeze({...protocol,
  async checkForUpdate(){
   if(disposed)return blocked('disposed');
   const controller=new AbortController();pending.add(controller);const timer=setTimeout(()=>controller.abort(),5000);
   try{
    const response=await fetch(deployment.headUrl,{credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
    if(!response.ok||response.redirected||response.url!==deployment.headUrl||!/^application\\/json(?:;|$)/i.test(response.headers.get('content-type')||''))return blocked('head-unavailable');
    const reader=response.body.getReader(),chunks=[];let length=0;
    for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4096){await reader.cancel();return blocked('invalid-head');}chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let head;try{head=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch(_){return blocked('invalid-head');}
    if(!head||Object.keys(head).sort().join(',')!=='documentUrl,revision,schema,scope,workerUrl'||head.schema!=='xtend.maraca.xtension-deployment-head.v1'||!/^[a-f0-9]{64}$/.test(head.revision)||head.scope!==deployment.scope||head.documentUrl!==deployment.scope||head.workerUrl!==deployment.scope+'_xtend/'+head.revision+'/xtend.sealed-service-worker.js')return blocked('invalid-head');
    const registration=await navigator.serviceWorker.getRegistration(deployment.scope);
    const changed=head.revision!==deployment.revision;
    if(disposed)return blocked('disposed');
    return Object.freeze({schema:'xtend.maraca.xtension-deployment-update-response.v1',requestId:'',action:'status',candidates:[],deleted:[],status:'ok',reason:null,currentRevision:deployment.revision,revision:head.revision,updateAvailable:changed,requiresDocumentNavigation:changed,documentUrl:head.documentUrl,workerUrl:head.workerUrl,waiting:registration?.waiting?.scriptURL===head.workerUrl});
   }catch(_){return blocked(disposed?'disposed':'head-unavailable');}finally{clearTimeout(timer);pending.delete(controller);}
  },
  dispose(){disposed=true;for(const controller of pending)controller.abort();protocol.dispose();}
 });
}
`);
}
module.exports={headFile,protocolFile,revisionFor,headSource,clientSource,declarations:()=>fs.readFileSync(__dirname+'/xtension-deployment-lifecycle-client.d.ts')};
