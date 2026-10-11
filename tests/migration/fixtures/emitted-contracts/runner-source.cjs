'use strict';
const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {evaluateResult}=require('./product-result-evidence.cjs');
const root=path.resolve(__dirname,'..');
async function run() {
 const commands=[];
 function saveReport(record){const target=path.join(root,'.xtend-test-results/suites',record.id+'.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({schema:'xtend.product-suite-result.v1',coreSha:process.env.XTEND_CORE_SHA,demoSha:process.env.XTEND_DEMO_SHA,...record},null,2)+'\n');}
 function execute(id,args,cwd=root,reports=[],env=process.env) {
  const startedAt=Date.now();
  const result=spawnSync(args[0],args.slice(1),{cwd,env,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
  const outcome=evaluateResult({...result,reports,startedAt}),status=outcome.status;
  const log=path.join(root,'.xtend-test-results',id+'.log');fs.mkdirSync(path.dirname(log),{recursive:true});fs.writeFileSync(log,`${args.join(' ')}\n${result.stdout||''}\n${result.stderr||''}\n${result.error?.message||''}`);
  const record={id,command:args,cwd:path.relative(root,cwd)||'.',exitCode:result.status,status,skips:outcome.skips,failures:outcome.failures,sourceReports:outcome.sources,log:path.relative(root,log)};commands.push(record);return status==='passed';
 }
 execute('migration-runner-contracts',[process.execPath,'--test','--test-reporter=tap','tests/migration/result-evidence.test.cjs','tests/migration/runtime-probes.test.cjs','tests/migration/fpm-runtime.test.cjs','tests/migration/shop-host-workflow.test.cjs','tests/migration/candidate-closure.test.cjs']);
 execute('http-security',[process.execPath,'--test','--test-reporter=tap','tests/security/http.test.mjs']);
 const xss=await require('../tests/security/product_xss_suite.cjs').runProductXss({rootDir:root}).catch(error=>({ok:false,failures:[error.message]}));
 commands.push({id:'product-xss',command:['runProductXss'],exitCode:xss.ok?0:1,status:xss.ok?'passed':'failed',skips:xss.skips||[],failures:xss.failures||[]});
 const builds=[];
 for(const product of fs.readdirSync(path.join(root,'products'))) {
  const target=path.join(root,'products',product),p=JSON.parse(fs.readFileSync(path.join(target,'package.json')));
  if(p.scripts?.build)builds.push(execute('build-'+product,['npm','run','build'],target));
 }
 commands.push({id:'product-builds',command:['all product builds'],status:builds.every(Boolean)?'passed':'failed',exitCode:builds.every(Boolean)?0:1,skips:[]});
 const suites=[['xscaler-testbench','xscaler_testbench_suite.js','runXScalerTestbenchSuite'],['product-node-host','node_host_contract_suite.js','runProductNodeHost'],['product-business-ui-boundary','product_boundary_suite.js','runProductBoundarySuite'],['erp-resumability-catfood','erp_resumability_catfooding_suite.js','runErpResumabilityCatfoodingSuite'],['maraca-app-services-test-bench','maraca_app_services_test_bench_suite.js','runMaracaAppServicesTestBenchSuite'],['xtend-llm-app-services-catfood','xtend_llm_app_services_catfood_suite.js','runXtendLlmAppServicesCatfoodSuite'],['xtend-material-catfooding','xtend_material_catfooding_suite.js','runXtendMaterialCatfoodingSuite']];
 let all=true;
 for(const [id,file,fn] of suites) {
  let result;try{result=await require('../tests/products/'+file)[fn]({rootDir:root});}catch(error){result={ok:false,failures:[error.message]};}
  const ok=result.ok===true&&!(result.skips?.length);all&&=ok;commands.push({id,command:[fn],exitCode:ok?0:1,status:ok?'passed':'failed',skips:result.skips||[],failures:result.failures||[]});
 }
 commands.push({id:'product-owned-suites',command:['all transferred suite IDs'],exitCode:all?0:1,status:all?'passed':'failed',skips:[]});
 for(const [id,group] of [['shop-php','php'],['shop-browser','browser'],['shop-contracts','contracts']]) {const ok=execute(id,['npm','run','test:'+group],path.join(root,'products/xtend-shop'),[path.join(root,'products/xtend-shop/storage/reports/xtend-store-'+group+'.json')],{...process.env,XTEND_SHOP_FPM_BINARY:''});const original=commands.at(-1);commands.push({...original,id:'xtend-shop-'+group,aliasOf:id});}
 execute('shop-browser-fpm',[process.execPath,'scripts/run-shop-host-gate.cjs','fpm'],root,[path.join(root,'products/xtend-shop/storage/reports/xtend-store-browser-fpm.json')]);
 execute('electron-shell-import-worker',['xvfb-run','-a',process.execPath,'scripts/run-electron.mjs','tests/llm-terminal-runner.mjs','--','--fake'],path.join(root,'products/xtend-llm'),[path.join(root,'products/xtend-llm/.xtend-llm-results/llm-terminal-fake.json')]);
 const lane=process.versions.node.startsWith('26.')?'node26':'node24';
 const llm=path.join(root,'products/xtend-llm'),laneName=lane==='node26'?'node-26-current':'node-24-lts';
 execute('electron-runtime',['xvfb-run','-a','npm','run','test:electron:'+lane+':product'],llm,['app-services-catfood.json','layout-smoke.json','electron-runtime-'+laneName+'.json','native-runtime-'+laneName+'.json'].map(file=>path.join(llm,'.xtend-llm-results',file)));
 execute('llm-contracts',['npm','test'],path.join(root,'products/xtend-llm'));
 execute('workbench-contracts',['npm','test'],path.join(root,'products/xtend-material-workbench'));
 execute('testbench-contracts',['npm','test'],path.join(root,'products/maraca-app-services-test-bench'));
 for(const record of commands)saveReport(record);
 const ok=commands.every(c=>c.status==='passed'&&!c.skips.length);
 const report={schema:'xtend.product-execution.v1',coreSha:process.env.XTEND_CORE_SHA,demoSha:process.env.XTEND_DEMO_SHA,ok,status:ok?'passed':'failed',generatedAt:new Date().toISOString(),commands};
 const index=process.argv.indexOf('--report'),output=index<0?path.join(root,'.xtend-test-results/products.json'):process.argv[index+1];fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!ok)process.exitCode=1;
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={run};
