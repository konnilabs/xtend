'use strict';
// Ten miniature real tarballs, with authentic current Core adapter/verification.
// No Source/Authority/FirstRelease grant is created by this fixture.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {packedFixture,registryFixture,write}=require('./fixtures.cjs');
const artifact=require('../../scripts/release/artifact.cjs'),candidates=require('../../scripts/release/candidates.cjs');
const profile=require('../../scripts/release/profile.cjs'),contracts=require('../../scripts/release/contracts.cjs');
async function candidateFixture(t){
 const f=await packedFixture(t),r=registryFixture(f.artifact),directory=path.join(f.directory,'core-candidates');fs.mkdirSync(directory);
 const packages=f.manifest.packages.map(entry=>{const bytes=fs.readFileSync(path.join(f.artifactDir,entry.file));fs.writeFileSync(path.join(directory,entry.file),bytes);const manifest=f.artifact.inventory.packages.find(p=>p.name===entry.name).manifest;return {name:entry.name,version:entry.version,file:entry.file,integrity:entry.integrity,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),...Object.fromEntries(['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'].filter(k=>manifest[k]).map(k=>[k,manifest[k]]))};});
 const php=Buffer.from('controlled Core PHP package');fs.writeFileSync(path.join(directory,'php.tar'),php);
 const manifest={schema:profile.CANDIDATES,profile:profile.PROFILE,coreSha:f.sourceSha,development:false,packages,php:{file:'php.tar',sha256:crypto.createHash('sha256').update(php).digest('hex'),sources:{'runtime.php':'a'.repeat(64)}}};write(path.join(directory,'manifest.json'),manifest);
 write(path.join(f.rootDir,'scripts/release/bootstrap-plan.json'),{schema:['xtend','release','bootstrap','v1'].join('.'),repository:'konnilabs/xtend',packages:[]});
 const buildEvidence={...f.artifact.buildEvidence,commands:contracts.buildCommands()};
 return {f,r,directory,manifest,options:{directory,sourceSha:f.sourceSha,rootDir:f.rootDir,registry:r.registry,buildEvidence}};
}
async function preparedFixture(t,{selection}={}){
 const f=await candidateFixture(t);for(const entry of f.f.artifact.packages)f.r.installed({...entry,sourceSha:'b'.repeat(40)},'latest');
 const manifest=await candidates.adaptCandidates({...f.options,selection});manifest.preparedAt=new Date(Date.now()-1000).toISOString();
 const build=f.options.buildEvidence,canary={...f.f.canary,buildEvidenceIntegrity:contracts.buildCanaryIntegrity(build),tarballSetIntegrity:artifact.releaseSetIntegrity(manifest),packages:f.f.canary.packages.filter(p=>manifest.packages.some(e=>e.name===p.name)),registryDependencies:manifest.registryDependencies.map(e=>({...e,consumerInstall:true}))};
 manifest.canary={file:'consumer.json',integrity:artifact.digest(Buffer.from(JSON.stringify(canary,null,2)+'\n'))};
 const sync=()=>{write(path.join(f.directory,'consumer.json'),canary);manifest.canary.integrity=artifact.digest(fs.readFileSync(path.join(f.directory,'consumer.json')));write(path.join(f.directory,'build.json'),build);manifest.buildEvidence.integrity=artifact.digest(fs.readFileSync(path.join(f.directory,'build.json')));write(path.join(f.directory,'release-manifest.json'),manifest);};sync();
 const verify=options=>artifact.verifyArtifact({directory:f.directory,manifestIntegrity:artifact.digest(fs.readFileSync(path.join(f.directory,'release-manifest.json'))),sourceSha:f.f.sourceSha,rootDir:f.f.rootDir,...options});
 return {...f,manifest,build,canary,sync,verify};
}
module.exports={candidateFixture,preparedFixture};
