'use strict';
// Only the two rebuilt local archives may change; registry dependencies stay locked.
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
function refreshLocalLock(root=path.resolve(__dirname,'..')) {
  const filename=path.join(root,'package-lock.json'),before=JSON.parse(fs.readFileSync(filename));
  const local=new Set(['node_modules/@ccslabs/xtend','node_modules/@xtend-material/core']);
  execFileSync(process.platform==='win32'?'npm.cmd':'npm',['install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund','--offline','./.packages/ccslabs-xtend-0.8.0.tgz','./.packages/xtend-material-core-0.1.0.tgz'],{cwd:root,stdio:'pipe',timeout:120000,maxBuffer:4*1024*1024});
  const after=JSON.parse(fs.readFileSync(filename));
  for(const key of new Set([...Object.keys(before.packages),...Object.keys(after.packages)])) {
    if(key===''||local.has(key))continue;
    if(JSON.stringify(before.packages[key])!==JSON.stringify(after.packages[key])) {
      fs.writeFileSync(filename,JSON.stringify(before,null,2)+'\n');
      throw new Error('Refreshing local packages changed a registry dependency: '+key);
    }
  }
  return {ok:true,localPackages:[...local]};
}
if(require.main===module)console.log(JSON.stringify(refreshLocalLock()));
module.exports={refreshLocalLock};
