'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');

function checkMaracaHtmlSecurity(configuration,rootDir){
 if(configuration===undefined || configuration===false)return null;
 const diagnostics=[],files={},sources=[];
 const add=(code,message,file)=>diagnostics.push({code,severity:'error',category:'security',message,file});
 if(!configuration || !Array.isArray(configuration.sources) || !configuration.sources.length){
  add('xtend.maraca.html_security.sources_missing','HTML security requires an explicit, non-empty list of application source files.');
 }else{
  const root=fs.realpathSync(rootDir);
  for(const file of configuration.sources){
   try{
    if(typeof file!=='string')throw Error('Invalid source path');
    const absolute=fs.realpathSync(path.resolve(root,file)),relative=path.relative(root,absolute);
    if(relative.startsWith('..'+path.sep)||relative==='..'||path.isAbsolute(relative)||!fs.statSync(absolute).isFile())throw Error('Source must be a file inside the application root');
    const key=relative.split(path.sep).join('/');if(Object.hasOwn(files,key))continue;
    files[key]=fs.readFileSync(absolute,'utf8');sources.push({file:key,sha256:crypto.createHash('sha256').update(files[key]).digest('hex')});
   }catch{add('xtend.maraca.html_security.source_invalid','HTML security could not read an application source within the configured root.',typeof file==='string'?file:undefined);}
  }
 }
 const {createDownstreamNoManualHtmlGate}=require('../tools/rmt-language/app-platform-tooling');
 const gate=createDownstreamNoManualHtmlGate({syntax:true,rootDir});
 diagnostics.push(...gate.scanFiles(files));
 return {schema:'xtend.maraca.html-security-report.v1',ok:!diagnostics.some(d=>d.severity==='error'),sources,diagnostics};
}
function applyMaracaHtmlSecurity(plan,input,options){
 const report=checkMaracaHtmlSecurity(input.htmlSecurity === undefined ? options.htmlSecurity : input.htmlSecurity,plan.rootDir);
 if(!report)return;
 plan.htmlSecurity=report;plan.diagnostics.push(...report.diagnostics);
 if(!report.ok){plan.ok=false;plan.status='blocked';}
}
module.exports={checkMaracaHtmlSecurity,applyMaracaHtmlSecurity};
