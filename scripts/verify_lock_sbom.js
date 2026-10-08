'use strict';
const fs=require('node:fs');
const path=require('node:path');
// Include every locked platform package, even when npm ci omits it on this OS.
function verifyLockSbom({rootDir,lock,sbom}){
  const errors=[];
  const components=new Set((sbom.components||[]).map(c=>c.purl?.startsWith('pkg:npm/') ? decodeURIComponent(c.purl.slice('pkg:npm/'.length).split('?')[0]) : `${c.name}@${c.version}`));
  let checkedPackageCount=0;
  if(sbom.bomFormat!=='CycloneDX')errors.push('Expected a CycloneDX SBOM');
  for(const [key,record]of Object.entries(lock.packages||{})){
    if(!key||record.link)continue;
    const name=record.name||(key.includes('node_modules/')?key.slice(key.lastIndexOf('node_modules/')+'node_modules/'.length):JSON.parse(fs.readFileSync(path.join(rootDir,key,'package.json'))).name);
    checkedPackageCount++;
    if(!components.has(`${name}@${record.version}`))errors.push(`SBOM omits locked ${key}: ${name}@${record.version}`);
  }
  if(!checkedPackageCount)errors.push('Dependency lock has no package records');
  return {ok:errors.length===0,errors,checkedPackageCount};
}
module.exports={verifyLockSbom};
