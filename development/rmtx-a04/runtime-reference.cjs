'use strict';
const fs=require('node:fs'),path=require('node:path'),{deflateSync}=require('node:zlib');
const root=path.resolve(__dirname,'../..'),reference=require('./integration-reference.cjs');
const SERVER_SENTINEL='A0436_PRIVATE_SERVER_IMPLEMENTATION';
// Small, valid project-owned branding. Every emitted asset remains fully budgeted.
function icon(size){
 function chunk(name,data){const type=Buffer.from(name),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);type.copy(out,4);data.copy(out,8);let crc=0xffffffff;for(const byte of Buffer.concat([type,data])){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}out.writeUInt32BE((crc^0xffffffff)>>>0,data.length+8);return out;}
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 const pixels=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const p=y*(size*4+1)+1+x*4;pixels.set([18,40,65,255],p);}
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
function createRuntimeReference(framework,directory,{pwa=true,services=framework!=='mixed',extra={}}={}){
 const project=path.join(directory,'project');fs.mkdirSync(project,{recursive:true});
 const providers=path.join(project,'development/rmtx-a04/providers');fs.mkdirSync(path.dirname(providers),{recursive:true});fs.cpSync(path.join(root,'development/rmtx-a04/providers'),providers,{recursive:true});
 fs.symlinkSync(path.join(root,'node_modules'),path.join(project,'node_modules'),'dir');
 const input=reference.withDeliveryProfile(reference.createBuildInput(framework,path.join(directory,'build'),{profile:framework==='vue'?'max':'production',pwa:{enabled:pwa},services:false,...extra}));
 const source=path.join(project,input.source);fs.mkdirSync(path.dirname(source),{recursive:true});let text=fs.readFileSync(path.join(root,input.source),'utf8');
 if(services){
  text=text.replace(/\n}\s*$/,'\n  datasource app.health from host app.health { mode invoke; contract "xtend.maraca.health.v1" }\n  action app.check { effect fetch datasource app.health }\n}\n');
  fs.writeFileSync(path.join(project,'client.ts'),`import {defineAppServices,service} from '@ccslabs/xtend-maraca/app-services';\nexport default defineAppServices({'app.health':service({kind:'query',target:'server'})});\n`);
  fs.writeFileSync(path.join(project,'server.ts'),`import {defineServerServices,service} from '@ccslabs/xtend-maraca/server-services';\nconst secret=${JSON.stringify(SERVER_SENTINEL)};\nconst probe=globalThis as typeof globalThis & {__XTendA0436ServerCalls?:number};\nexport default defineServerServices({'app.health':service({kind:'query',target:'server',async invoke(input: {probe?:string}){probe.__XTendA0436ServerCalls=(probe.__XTendA0436ServerCalls||0)+1;return {ok:secret.includes(String(input.probe||''))};}})});\n`);
  input.services={clientEntry:'client.ts',serverEntry:'server.ts',phpEntry:'missing.php',targets:['browser','node'],strict:true};
 }
 fs.writeFileSync(source,text);
 if(pwa){
  const icons=path.join(project,'icons');fs.mkdirSync(icons);for(const [file,size]of [['android-chrome-192x192.png',192],['android-chrome-512x512.png',512],['apple-touch-icon.png',180],['favicon-32x32.png',32],['favicon-16x16.png',16]])fs.writeFileSync(path.join(icons,file),icon(size));
  fs.writeFileSync(path.join(icons,'favicon.ico'),fs.readFileSync(path.join(root,'icons/favicon.ico')));
  fs.writeFileSync(path.join(project,'XTend-Logo.png'),icon(512));
 }
 return {rootDir:project,input};
}
module.exports={createRuntimeReference,SERVER_SENTINEL};
