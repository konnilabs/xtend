#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {loadCoreSource,strictSourceReport}=require('./release/core-source.cjs');
async function main() {
  if(!process.env.XTEND_CORE_ARCHIVE||!process.env.XTEND_CORE_EXPECTED)throw Error('Required Core source evidence omitted');
  const rootDir=path.resolve(__dirname,'..'),sourceSha=execFileSync('git',['rev-parse','HEAD'],{cwd:rootDir,encoding:'utf8'}).trim();
  const expected=JSON.parse(fs.readFileSync(process.env.XTEND_CORE_EXPECTED));
  if(expected.sourceSha!==sourceSha||expected.context?.runId!==process.env.GITHUB_RUN_ID||expected.context?.runAttempt!==process.env.GITHUB_RUN_ATTEMPT)
    throw Error('Core source/run/attempt differs from independent workflow expectation');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-ci-source-'));
  try {
    const loaded=loadCoreSource({archive:process.env.XTEND_CORE_ARCHIVE,expected,destination:path.join(temporary,'source')});
    const report=strictSourceReport({...loaded,rootDir,typescript:require('typescript')});
    const output=path.join(rootDir,'.xtend-test-results/core-source-validation.json');fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    if(report.ok!==true)throw Error('Required Core-owned strict source validation failed');
    loaded.provider.files();
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={main};
