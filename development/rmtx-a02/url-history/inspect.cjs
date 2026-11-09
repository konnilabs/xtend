'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function inspect() {
  const result=await require('../../../tests/xtensions/url-history-contract-checks.cjs').runURLHistoryContractChecks();
  const schemas=['policy','state','restore-plan','history-proposal'].map(name=>name+'.v1.schema.json');
  const report={format:1,stage:'A02.5.1-contract-reference',apiVersion:require('./reference').API_VERSION,productionIntegration:false,
    sources:Object.fromEntries(['reference.js','reference.d.ts','policy.v1.json',...schemas].map(name=>[name,hash(fs.readFileSync(path.join(__dirname,name)))])),
    checksSourceSha256:hash(fs.readFileSync(path.join(root,'tests/xtensions/url-history-contract-checks.cjs'))),
    schemas:schemas.map(name=>require('./'+name).$id),checks:result.checks,names:result.names,
    tokenSha256:hash(result.token),programEvidenceSha256:hash(fs.readFileSync(path.join(root,'development/rmtx-a02/repeated-evidence.json'))),
    routerOwner:'x-router-or-trusted-route-host',modelOwner:'RMT Model',automaticHistoryWrites:false};
  const outputs={'evidence.json':report,'examples.v1.json':{...result.samples,token:result.token}};
  for(const [name,value] of Object.entries(outputs)) {
    const text=JSON.stringify(value,null,2)+'\n',file=path.join(__dirname,name);
    if(process.argv.includes('--write'))fs.writeFileSync(file,text);
    if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,'URL/History contract drift: '+name);
  }
  console.log(`A02.5.1: ${result.checks} URL/History contract checks; production integration pending.`);
  return {result,report};
}
if(require.main===module)inspect().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inspect};
