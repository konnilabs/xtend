'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');const digest=b=>createHash('sha256').update(b).digest('hex');
// Controlled report-chain fixture only; never claims actual application execution.
function fixture(directory){
 const coreSha='a'.repeat(40),demoSha='b'.repeat(40),generatedAt=new Date().toISOString(),zip='edcfae0a8cf2a75ceee8a9842a0117521283164708b193495f4cb60ab2d6aa0d',dist='/usr/lib/xtend-electron/42.10.0/'+zip+'/dist';
 const sourceHashes=Object.fromEntries(['src/main/electron-main.mjs','src/main/preload.cjs','src/renderer/app-controller.mjs','src/main/app-server.mjs','src/main/app-server-session.mjs','site/index.html','scripts/electron-sandbox-policy.mjs'].map(source=>[source,digest(Buffer.from(source))]));
 const app={format:1,proofKind:'actual-application-main-frame',mainFrameAttestation:true,coreSha,demoSha,generatedAt,applicationUid:1000,rendererPid:123,rendererSeccomp:'2',sandboxed:true,contextIsolated:true,nodeIntegration:false,sandboxPreference:true,preloadPath:'/fixture/products/xtend-llm/src/main/preload.cjs',sources:sourceHashes,runtimeIdentity:{attestationMode:'mandatory-ci',electronVersion:'42.10.0',executable:dist+'/electron',helper:dist+'/chrome-sandbox',executableSha256:'0636c96f07de2c74a3eaf8692fc1743d81259c0bf66c8ebde7f7179211a8aff9',helperSha256:'2015304df43beff0b74409cdc4d858107efcde650d9bc8afb1288041d62cec4b',helperUid:0,helperGid:0,helperMode:0o4755}};
 const write=(file,value)=>{const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');fs.writeFileSync(path.join(directory,file),bytes);return {file,sha256:digest(bytes)};};
 const appBinding=write('electron-sandbox-attestation.json',app),consumer={ok:true,proofKind:'consumed-actual-application-main-frame',coreSha,demoSha,generatedAt,sourceHashes,reportSha256:appBinding.sha256,provisioningReceiptSha256:'c'.repeat(64)};
 const consumerBinding=write('electron-app-attestation-consumer.json',consumer),suite={schema:'xtend.product-suite-result.v1',id:'electron-actual-app-attestation',coreSha,demoSha,status:'passed',exitCode:0,skips:[],failures:[],attestation:{coreSha,demoSha,sourceHashes,provisioningReceiptSha256:consumer.provisioningReceiptSha256,app:appBinding,consumer:consumerBinding}};
 fs.mkdirSync(path.join(directory,'reports'));const report=()=>({...write('reports/'+suite.id+'.json',suite),id:suite.id,status:'passed'});
 return {app,consumer,suite,report,write,options:{directory,coreSha,demoSha}};
}
module.exports={fixture};
