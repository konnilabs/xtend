#!/usr/bin/env node
'use strict';
// Refresh only embedded local-package manifest metadata. Never resolve packages,
// touch node_modules, or change locked version/resolved/integrity records.
const fs=require('node:fs');
const path=require('node:path');
const {isDeepStrictEqual}=require('node:util');
const {LOCKED_MANIFEST_SECTIONS,PRODUCT_LOCK_PATHS,verifyCiDependencyLocks}=require('./verify_ci_dependency_locks');
function syncCiDependencyLockMetadata({rootDir=path.resolve(__dirname,'..')}={}){
  const changes=[];
  function refresh(record,manifest,label,sections){
    if(!record)throw Error(`Missing local lock record: ${label}`);
    if(record.version!==manifest.version)throw Error(`Refuse version change for ${label}; this command updates metadata only.`);
    for(const section of sections){
      if(isDeepStrictEqual(record[section],manifest[section]))continue;
      if(manifest[section]===undefined)delete record[section];else record[section]=structuredClone(manifest[section]);
      changes.push(`${label}: ${section}`);
    }
  }
  const rootManifest=JSON.parse(fs.readFileSync(path.join(rootDir,'package.json')));
  const pending=[];
  const file=path.join(rootDir,'package-lock.json'),rootLock=JSON.parse(fs.readFileSync(file));
  for(const directory of rootManifest.workspaces){
    if(/[?*{}]/u.test(directory))throw Error(`Unsupported workspace: ${directory}`);
    const manifest=JSON.parse(fs.readFileSync(path.join(rootDir,directory,'package.json')));
    refresh(rootLock.packages[directory],manifest,directory,LOCKED_MANIFEST_SECTIONS);
  }
  pending.push([file,rootLock]);
  for(const directory of PRODUCT_LOCK_PATHS){
    const productDir=path.join(rootDir,directory),lockPath=path.join(productDir,'package-lock.json');
    const manifest=JSON.parse(fs.readFileSync(path.join(productDir,'package.json'))),lock=JSON.parse(fs.readFileSync(lockPath));
    for(const [name,spec]of Object.entries(manifest.dependencies||{})){
      if(!spec.startsWith('file:'))continue;
      const target=path.resolve(productDir,spec.slice(5));
      if(target!==rootDir&&!target.startsWith(rootDir+path.sep))throw Error(`Local dependency escapes repository: ${name}`);
      const local=JSON.parse(fs.readFileSync(path.join(target,'package.json')));
      if(local.name!==name)throw Error(`Local dependency name mismatch: ${name}`);
      let record=lock.packages[`node_modules/${name}`];
      if(record?.link)record=lock.packages[path.relative(productDir,path.resolve(productDir,record.resolved)).split(path.sep).join('/')];
      refresh(record,local,`${directory}: ${name}`,LOCKED_MANIFEST_SECTIONS);
    }
    pending.push([lockPath,lock]);
  }
  // All inputs validated before writing. Identical files remain byte-for-byte intact.
  for(const [lockPath,lock]of pending){const content=JSON.stringify(lock,null,2)+'\n';if(content!==fs.readFileSync(lockPath,'utf8'))fs.writeFileSync(lockPath,content);}
  const report=verifyCiDependencyLocks({rootDir});
  if(!report.ok)throw Error(`Other lock drift remains: ${report.errors.join('; ')}`);
  return {ok:true,changes};
}
if(require.main===module){try{console.log(JSON.stringify(syncCiDependencyLockMetadata(),null,2));}catch(error){console.error(error);process.exitCode=1;}}
module.exports={syncCiDependencyLockMetadata};
