'use strict';
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const root=path.resolve(__dirname,'..');
async function run(group='all',options={}){
 if(!['all','contracts','php','browser'].includes(group))throw new Error('Unknown XTend.store test group.');
 const started=performance.now(),results=[];
 if(['all','contracts'].includes(group))results.push({group:'contracts',...await require('../tests/contracts.cjs').runContracts()});
 if(['all','php'].includes(group)){
  results.push({group:'php-contracts',...await require('../tests/contracts.cjs').runContracts({php:true})});
  let output;try{output=execFileSync(process.env.XTEND_PHP_BINARY||'php',[path.join(root,'tests/domain.php')],{cwd:root,encoding:'utf8',timeout:30000});}catch(error){output=error.stdout;if(!output)throw error;}
  results.push({group:'php-domain',...JSON.parse(output)});
 }
 if(['all','browser'].includes(group))results.push({group:'browser',...await require('../tests/browser.cjs').runBrowser(options)});
 const manifest=fs.existsSync(path.join(root,'bootstrap/xtend/pages.json'))?JSON.parse(fs.readFileSync(path.join(root,'bootstrap/xtend/pages.json'))):null;
 const runtime={node:process.version,platform:process.platform,arch:process.arch,php:results.find(result=>result.runtime?.php)?.runtime || null,buildLock:hash(fs.readFileSync(path.join(root,'package-lock.json'))),hostLocks:['composer.lock','payment-provider/composer.lock'].map(file=>({file,fingerprint:hash(fs.readFileSync(path.join(root,file)))})),runtimeFingerprints:manifest?.runtimeFingerprints || null};
 const memory=process.memoryUsage();
 return {schema:'xtend.store.report.v1',ok:results.length>0&&results.every(r=>r.ok),build:manifest?.version || null,runtime,memory:{rssBytes:memory.rss,heapUsedBytes:memory.heapUsed},durationMs:performance.now()-started,results};
}
if(require.main===module)run(process.argv[2]||'all').then(result=>{
 const report=path.join(root,'storage/reports',`xtend-store-${process.argv[2]||'all'}.json`);fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
}).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={run};
