'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const SHA=/^[a-f0-9]{40}$/;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function verifyCandidates(manifest,{coreSha,demoSha,directory}={}) {
 if(manifest?.schema!=='xtend.product-candidates.v1'||!SHA.test(coreSha||'')||!SHA.test(demoSha||'')||manifest.coreSha!==coreSha||manifest.demoSha!==demoSha)throw Error('Candidate SHA identity mismatch');
 if(!Array.isArray(manifest.packages)||!manifest.packages.length)throw Error('Missing candidate packages');
 const names=new Set();
 for(const item of manifest.packages) {
  if(names.has(item.name)||!item.name||!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(item.version||''))throw Error('Invalid candidate package identity');names.add(item.name);
  if(path.basename(item.file)!==item.file||!item.file.endsWith('.tgz'))throw Error('Invalid candidate tarball path');
  const file=path.resolve(directory,item.file);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()||fs.lstatSync(file).isSymbolicLink())throw Error(`Missing regular candidate tarball: ${item.name}`);
  const bytes=fs.readFileSync(file);
  if('sha512-'+crypto.createHash('sha512').update(bytes).digest('base64')!==item.integrity)throw Error(`Candidate integrity mismatch: ${item.name}`);
  if(digest(bytes)!==item.sha256)throw Error(`Candidate digest mismatch: ${item.name}`);
 }
 if(!manifest.php||path.basename(manifest.php.file)!==manifest.php.file||digest(fs.readFileSync(path.join(directory,manifest.php.file)))!==manifest.php.sha256||!Object.keys(manifest.php.sources||{}).length)throw Error('PHP candidate fingerprint mismatch');
 return manifest;
}
const internalName=name=>name.startsWith('@ccslabs/xtend')||name.startsWith('@xtend-material/');
function selectCandidateClosure(manifest,app) {
 if(!app||typeof app!=='object')throw Error('Missing app dependency declarations');
 const available=new Map(manifest.packages.map(p=>[p.name,p])),selected=new Map(),queue=[];
 function include(name,version) {
  const item=available.get(name);
  if(!item){if(internalName(name))throw Error('Unpinned transitive candidate namespace: '+name);return;}
  if(version!==item.version)throw Error('Candidate declaration must pin exact version: '+name);
  if(!selected.has(name)){selected.set(name,item);queue.push(item);}
 }
 for(const section of ['dependencies','devDependencies','optionalDependencies'])for(const [name,version] of Object.entries(app[section]||{}))include(name,version);
 for(const [name,version] of Object.entries(app.peerDependencies||{}))if(!app.peerDependenciesMeta?.[name]?.optional)include(name,version);
 for(let i=0;i<queue.length;i++){
  const item=queue[i];
  for(const section of ['dependencies','optionalDependencies'])for(const [name,version] of Object.entries(item[section]||{}))include(name,version);
  for(const [name,version] of Object.entries(item.peerDependencies||{}))if(!item.peerDependenciesMeta?.[name]?.optional)include(name,version);
 }
 // An optional peer does not introduce a dependency. If installed for another reason, its pin must agree.
 for(const item of [app,...queue])for(const [name,version] of Object.entries(item.peerDependencies||{}))if(selected.has(name))include(name,version);
 return [...selected.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
function verifyInstalledClosure(lock,manifest) {
 if(!lock.packages?.[''])throw Error('Missing app dependency declarations in candidate lock');
 const required=new Map(selectCandidateClosure(manifest,lock.packages['']).map(p=>[p.name,p]));const found=new Set();
 for(const [key,entry] of Object.entries(lock.packages||{})) {
  const name=key.split('node_modules/').at(-1);
  const expected=required.get(name);
  if(!expected) {if(internalName(name)||manifest.packages.some(p=>p.name===name))throw Error('Unpinned transitive candidate namespace: '+name);continue;}
  found.add(name);
  for(const section of ['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'])if(!isDeepStrictEqual(entry[section]||{},expected[section]||{}))throw Error(`Candidate lock metadata drift: ${key} ${section}`);
  if(entry.link||entry.version!==expected.version||!entry.resolved?.startsWith('file:')||path.basename(entry.resolved)!==expected.file||entry.integrity!==expected.integrity)throw Error(`Candidate transitive Registry fallback or linked dependency: ${key}`);
 }
 for(const name of required.keys())if(!found.has(name))throw Error(`Missing installed candidate: ${name}`);
 return true;
}
function verifyResolution(requireFrom,manifest,installRoot,app) {
 app||=JSON.parse(fs.readFileSync(path.join(path.dirname(installRoot),'package.json')));
 const root=fs.realpathSync(installRoot)+path.sep;
 for(const item of selectCandidateClosure(manifest,app)) {
  const resolved=fs.realpathSync(requireFrom.resolve(`${item.name}/package.json`));
  if(!resolved.startsWith(root))throw Error(`Candidate resolved outside isolated installation (sibling/ancestor): ${item.name}`);
  const installed=JSON.parse(fs.readFileSync(resolved));if(installed.version!==item.version)throw Error('Installed candidate version mismatch');
 }
 return true;
}
module.exports={digest,verifyCandidates,selectCandidateClosure,verifyInstalledClosure,verifyResolution};
