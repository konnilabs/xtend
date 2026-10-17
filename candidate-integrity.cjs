'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const SHA=/^[a-f0-9]{40}$/;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function verifyCandidates(manifest,options={}) {
 const {coreSha,demoSha,directory,profile}=options;
 if(!SHA.test(coreSha||'')||manifest?.coreSha!==coreSha)throw Error('Candidate SHA identity mismatch');
 if(manifest.schema==='xtend.product-candidates.v1') {
  if(Object.hasOwn(manifest,'profile')||Object.hasOwn(options,'profile')||!SHA.test(demoSha||'')||manifest.demoSha!==demoSha)throw Error('Legacy candidate requires exact paired identity; mixed profile forbidden');
 } else if(manifest.schema==='xtend.product-candidates.v2') {
  if(profile!=='xtend.npm.core-only.v1'||manifest.profile!==profile||['demoSha','demoRepository','productEvidence','unionEvidence'].some(key=>Object.hasOwn(manifest,key)||Object.hasOwn(options,key)))throw Error('Exact Core candidate profile required; legacy Demo fields forbidden');
 } else throw Error('Unsupported candidate contract version');
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
function verifyInstalledClosure(lock,manifest,{app,registryPackages=[]}={}) {
 if(!lock.packages?.[''])throw Error('Missing app dependency declarations in candidate lock');
 const sections=['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'];
 const required=new Map(selectCandidateClosure(manifest,app||lock.packages['']).map(p=>[p.name,p]));const found=new Set();
 const registry=new Map(registryPackages.map(p=>[p.name,p]));
 if(registry.size!==registryPackages.length||registryPackages.some(p=>!required.has(p.name)||!isDeepStrictEqual(required.get(p.name),p)))throw Error('Registry closure differs from exact required package metadata');
 if(app)for(const section of [...sections,'devDependencies']){
  const expected=app[section]||{},actual=lock.packages[''][section]||{};
  if(!isDeepStrictEqual(Object.keys(actual).sort(),Object.keys(expected).sort()))throw Error('Installed root declaration drift: '+section);
  for(const [name,value]of Object.entries(expected)){
   const item=required.get(name),installed=actual[name];
   if(section==='dependencies'&&item&&!registry.has(name)){
    if(!installed?.startsWith('file:')||path.basename(installed)!==item.file)throw Error('Installed root candidate archive drift: '+name);
   }else if(!isDeepStrictEqual(installed,value))throw Error('Installed root declaration drift: '+section+' '+name);
  }
 }
 for(const [key,entry] of Object.entries(lock.packages||{})) {
  const name=key.split('node_modules/').at(-1);
  const expected=required.get(name);
  if(!expected) {if(internalName(name)||manifest.packages.some(p=>p.name===name))throw Error('Unpinned transitive candidate namespace: '+name);continue;}
  found.add(name);
  for(const section of sections)if(!isDeepStrictEqual(entry[section]||{},expected[section]||{}))throw Error(`Candidate lock metadata drift: ${key} ${section}`);
  const pinnedRegistry=registry.has(name);
  if(entry.link||entry.version!==expected.version||entry.integrity!==expected.integrity||
    (pinnedRegistry?!/^https:\/\/registry\.npmjs\.org\/[^?#]+$/.test(entry.resolved||''):
      !entry.resolved?.startsWith('file:')||path.basename(entry.resolved)!==expected.file))throw Error(`Candidate transitive Registry fallback or linked dependency: ${key}`);
 }
 for(const name of required.keys())if(!found.has(name))throw Error(`Missing installed candidate: ${name}`);
 return true;
}
function verifyResolution(requireFrom,manifest,installRoot,app) {
 app||=JSON.parse(fs.readFileSync(path.join(path.dirname(installRoot),'package.json')));
 const root=fs.realpathSync(installRoot)+path.sep;
 if(fs.lstatSync(installRoot).isSymbolicLink())throw Error('Linked isolated installation forbidden');
 const required=selectCandidateClosure(manifest,app),byName=new Map(required.map(p=>[p.name,p])),locations=new Map();
 function resolve(item,from) {
  const filename=from.resolve(`${item.name}/package.json`),resolved=fs.realpathSync(filename);
  if(!resolved.startsWith(root)||filename!==resolved)throw Error(`Candidate resolved outside isolated installation (sibling/ancestor/linked): ${item.name}`);
  let current=root.slice(0,-1);
  for(const part of path.relative(current,filename).split(path.sep)){current=path.join(current,part);if(fs.lstatSync(current).isSymbolicLink())throw Error('Linked installed candidate: '+item.name);}
  const installed=JSON.parse(fs.readFileSync(resolved));if(installed.name!==item.name||installed.version!==item.version)throw Error('Installed candidate identity/version mismatch');
  for(const section of ['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'])if(!isDeepStrictEqual(installed[section]||{},item[section]||{}))throw Error('Installed candidate metadata drift: '+item.name+' '+section);
  return resolved;
 }
 for(const item of required)locations.set(item.name,resolve(item,requireFrom));
 // Check actual dependency resolution from each installed package too; a valid
 // top-level lock must not conceal sibling/ancestor or nested linked fallback.
 for(const item of required){const from=require('node:module').createRequire(locations.get(item.name));
  for(const section of ['dependencies','optionalDependencies','peerDependencies'])for(const name of Object.keys(item[section]||{}))if(byName.has(name))resolve(byName.get(name),from);}
 return true;
}
module.exports={digest,verifyCandidates,selectCandidateClosure,verifyInstalledClosure,verifyResolution};
