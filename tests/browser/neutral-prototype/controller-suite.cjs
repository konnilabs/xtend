'use strict';
const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
function runNeutralControllerSuite({rootDir}) {
  const directory=path.join(rootDir,'tests/browser/neutral-prototype');
  const files=fs.readdirSync(directory).filter(name=>name.endsWith('.test.cjs')).sort();
  const result=spawnSync(process.execPath,['--trace-warnings','--trace-deprecation','--require',path.join(rootDir,'scripts/node_warning_policy.cjs'),
    '--test','--test-reporter=tap',...files.map(name=>path.join(directory,name))],
    {cwd:rootDir,encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
  const output=result.stdout||'';console.log(output);
  const count=name=>Number(output.match(new RegExp('^# '+name+' (\\d+)$','m'))?.[1]);
  const complete=!result.error && result.status===0 && count('tests')>=40 && count('tests')===count('pass') &&
    ['fail','cancelled','skipped','todo'].every(name=>count(name)===0);
  const passes=[...output.matchAll(/^ok \d+ - (.+)$/gm)].map(match=>match[1]);
  return {ok:complete,passes,failures:complete?[]:[result.error?.message||result.stderr||'Incomplete or failed controller assertions'],skips:[],
    report:{acceptedForRelease:false,evidenceKind:'controller-and-kernel-model-tests',tests:count('tests'),passed:count('pass'),exitCode:result.status}};
}
module.exports={runNeutralControllerSuite};
