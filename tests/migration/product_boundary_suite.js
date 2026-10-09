'use strict';
const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
function run(rootDir,args) {
 const result=spawnSync(process.execPath,args,{cwd:rootDir,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 return {ok:result.status===0&&!result.error,exitCode:result.status,passes:result.status===0?[result.stdout]:[],failures:result.status===0?[]:[result.stderr||result.error?.message||result.stdout],skips:[]};
}
function runProductBoundarySuite({rootDir=path.resolve(__dirname,'../..')}={}) {return run(rootDir,['--test',...['tests/migration','tests/migration/manifest-initial-authority'].flatMap(directory=>fs.readdirSync(path.join(rootDir,directory)).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>directory+'/'+name))]);}
function runCandidateEvidenceSuite({rootDir=path.resolve(__dirname,'../..')}={}) {return run(rootDir,['scripts/product-candidate-evidence.cjs']);}
module.exports={runProductBoundarySuite,runCandidateEvidenceSuite};
