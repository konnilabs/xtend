'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
async function inspect() {
  const codec=require('../../../tools/xtensions/url-state');
  const runtime=await import('../../../xtend-maraca/plan-runtime.mjs');
  const browser=await import('../../../xtend-maraca/browser-composition-runtime.mjs');
  const owner=await import('../../../components/xrouter-url-state.js');
  const schemas=['policy','state','restore-plan','history-proposal'].map(name=>name+'.v1.schema.json');
  for(const name of schemas)assert.equal(fs.readFileSync(path.join(__dirname,name),'utf8'),fs.readFileSync(path.join(root,'tools/xtensions/url-state-contracts',name),'utf8'),'The promoted v1 wire format remains byte-identical: '+name);
  assert.equal(codec.API_VERSION,'1.0.0');assert.equal(runtime.PLAN_RUNTIME_SCHEMA,'xtend.maraca.plan-runtime.v7');
  assert.equal(browser.MARACA_BROWSER_API_VERSION,'5.0.0');assert.equal(owner.XROUTER_URL_STATE_API_VERSION,'1.0.0');
  const sources=['tools/xtensions/url-state.js','tools/xtensions/url-state.d.ts',...schemas.map(n=>'tools/xtensions/url-state-contracts/'+n),
    'xtend-maraca/plan-runtime.mjs','xtend-maraca/plan-runtime.d.ts','xtend-maraca/plan-runtime.v6.d.ts',
    'xtend-maraca/browser-composition-runtime.mjs','xtend-maraca/browser-composition-runtime.d.ts','xtend-maraca/browser-composition-runtime.v4.d.ts',
    'components/xrouter.js','components/xrouter.d.ts','components/xrouter-url-state.js','components/xrouter-url-state.d.ts',
    'tests/xtensions/url-state-maraca-acceptance.js','tests/xtensions/xtensions_runtime_gate_suite.js','scripts/test_xtensions_runtime_adapters.cjs'];
  const report={format:1,stage:'A02.5.2-router-maraca-integration',urlStateApiVersion:codec.API_VERSION,planRuntimeSchema:runtime.PLAN_RUNTIME_SCHEMA,
    browserApiVersion:browser.MARACA_BROWSER_API_VERSION,routeOwnerApiVersion:owner.XROUTER_URL_STATE_API_VERSION,
    promotedV1WireFormatsUnchanged:true,productionIntegration:true,featureAcceptance:false,
    modelOwner:'RMT Model',historyOwner:'x-router-or-explicit-route-host',automaticHistoryWritesOnModelNotification:false,
    requiredIntegrationCases:17,requiredRuntimeCasesPerEnvironment:158,requiredCompilerChecks:88,
    sources:Object.fromEntries(sources.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]))};
  const text=JSON.stringify(report,null,2)+'\n',file=path.join(__dirname,'integration-evidence.json');
  if(process.argv.includes('--write'))fs.writeFileSync(file,text);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,'A02.5.2 integration source drift');
  console.log('A02.5.2: four unchanged v1 wire contracts, versioned Router/Maraca ports and integration gate sources verified.');return report;
}
if(require.main===module)inspect().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inspect};
