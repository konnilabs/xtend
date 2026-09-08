'use strict';
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const root = path.resolve(__dirname, '../../..');
const source = fs.readFileSync(path.join(root,'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt'),'utf8');
const io = {};
for (const name of ['readFileSync','statSync','readdirSync','realpathSync','existsSync']) {
 const original=fs[name];
 fs[name]=function(...args){const start=performance.now(); try{return original.apply(this,args);}finally{const entry=io[name]||(io[name]={count:0,ms:0});entry.count++;entry.ms+=performance.now()-start;}};
}
let start=performance.now();
const bridge = require(path.join(root,'tools/tooling-bridge'));
console.log('bridge-load-ms',performance.now()-start);
(async()=>{
 for(let round=0;round<3;round++) {
  const ioBefore=JSON.parse(JSON.stringify(io));
  start=performance.now();
  const output=await bridge.executeToolingBridgeOperation({operation:'maraca-plan',payload:{source,filePath:'docs/rmt-playground-source.rmt',options:{profile:'debug',lazy:'component',css:'external',stack:'runtime',components:'document',orchestration:'auto',kernel:'auto',hydration:'auto',validation:'auto',transitions:'auto'}}},{rootDir:root});
  console.log(JSON.stringify({round,ms:performance.now()-start,ok:output.ok,io:Object.fromEntries(Object.entries(io).map(([name,v])=>[name,{count:v.count-(ioBefore[name]?.count||0),ms:v.ms-(ioBefore[name]?.ms||0)}]))}));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
