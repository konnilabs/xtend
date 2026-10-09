'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { packedFixture, registryFixture, write } = require('./fixtures.cjs');
const { digest, verifyArtifact, releaseSetIntegrity } = require('../../scripts/release/artifact.cjs');
const { adaptCandidates, inspectCandidates, verifyCandidateBinding } = require('../../scripts/release/candidates.cjs');
const { verifyStatements } = require('../../scripts/release/provenance.cjs');
const { gates, verifyNeeds, verifyArtifactMetadata, downloadSealedArtifact } = require('../../scripts/release/github.cjs');
const { publishRelease } = require('../../scripts/release/publish.cjs');
async function candidateFixture(t) {
  const f = await packedFixture(t), r = registryFixture(f.artifact), directory = path.join(f.directory, 'candidates');
  fs.mkdirSync(directory);
  const packages = f.manifest.packages.map(entry => {
    const bytes = fs.readFileSync(path.join(f.artifactDir, entry.file)); fs.writeFileSync(path.join(directory, entry.file), bytes);
    const manifest = f.artifact.inventory.packages.find(item => item.name === entry.name).manifest;
    return { name: entry.name, version: entry.version, file: entry.file, integrity: entry.integrity,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'), ...Object.fromEntries(['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'].filter(key=>manifest[key]).map(key=>[key,manifest[key]])) };
  });
  const php = Buffer.from('test-only PHP archive'); fs.writeFileSync(path.join(directory, 'php.tar'), php);
  const demoSha = 'd'.repeat(40), manifest = { schema: 'xtend.product-candidates.v1', coreSha: f.sourceSha, demoSha, development: false,
    packages, php: { file: 'php.tar', sha256: crypto.createHash('sha256').update(php).digest('hex'), sources: { 'runtime.php': 'a'.repeat(64) } } };
  write(path.join(directory,'manifest.json'), manifest);
  write(path.join(f.rootDir,'product-demos.lock.json'), {demoSha});
  write(path.join(f.rootDir,'scripts/release/bootstrap-plan.json'), {schema:'xtend.release.bootstrap.v1',repository:'konnilabs/xtend',packages:[]});
  return { f, r, directory, manifest, demoSha, options: { directory, sourceSha: f.sourceSha, demoSha, rootDir:f.rootDir, registry:r.registry, buildEvidence:f.artifact.buildEvidence } };
}
for (const group of ['mcp','material']) test(`reviewed candidate adapter preserves all original bytes and independently publishes ${group}-only`, async t=>{
  const {f,r,directory,options,manifest:original} = await candidateFixture(t);
  // These dependencies retain their original source identity and different SRI.
  for (const entry of f.artifact.packages) r.installed({...entry,sourceSha:'b'.repeat(40)},'latest');
  const manifest=await adaptCandidates({...options,selection:{groups:[group],packages:[]}});
  assert.equal(manifest.candidateBinding.allPackages.length,10);
  assert.equal(manifest.packages.length,group==='mcp'?1:2);
  assert.ok(manifest.registryDependencies.length>0);
  for(const entry of manifest.registryDependencies)assert.equal(entry.sourceSha,'b'.repeat(40));
  const canary={...f.canary,tarballSetIntegrity:releaseSetIntegrity(manifest),packages:f.canary.packages.filter(e=>manifest.packages.some(p=>p.name===e.name)),registryDependencies:manifest.registryDependencies.map(entry=>({...entry,consumerInstall:true}))};
  write(path.join(directory,'consumer.json'),canary);manifest.canary={file:'consumer.json',integrity:digest(fs.readFileSync(path.join(directory,'consumer.json')))};write(path.join(directory,'release-manifest.json'),manifest);
  const artifact=await verifyArtifact({directory,sourceSha:f.sourceSha,rootDir:f.rootDir,manifestIntegrity:digest(fs.readFileSync(path.join(directory,'release-manifest.json')))});
  await verifyCandidateBinding(artifact,{directory,rootDir:f.rootDir});
  for(const entry of manifest.packages){r.versions.delete(entry.name);r.packages.get(entry.name).versions=[];r.packages.get(entry.name)['dist-tags']={};}
  const ledger=await publishRelease({artifact,registry:r.registry,publisher:r.publisher,ledgerFile:f.ledgerFile,publish:true});
  assert.equal(ledger.status,'complete');assert.equal(r.calls.filter(c=>c[0]==='publish').length,manifest.packages.length);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))),original);
});
for(const damage of ['missing','private','sha256','metadata','unselected-bytes','demo-sha','development'])test(`candidate adapter rejects ${damage} before upload`,async t=>{
 const {f,directory,options,manifest}=await candidateFixture(t);
 if(damage==='missing')manifest.packages.pop();
 if(damage==='private')manifest.packages[0].name='@xtend-products/store';
 if(damage==='sha256')manifest.packages[0].sha256='0'.repeat(64);
 if(damage==='metadata')manifest.packages.find(p=>p.name==='@ccslabs/xtend-mcp').dependencies={};
 if(damage==='unselected-bytes')fs.appendFileSync(path.join(directory,manifest.packages[0].file),'tampered');
 if(damage==='demo-sha')manifest.demoSha='e'.repeat(40);
 if(damage==='development')manifest.development=true;
 write(path.join(directory,'manifest.json'),manifest);
 await assert.rejects(adaptCandidates({...options,selection:{groups:['mcp']}}));
});
test('Sigstore verifier authenticates DSSE before exposing statements and rejects invalid bundles',async()=>{
 const predicateType='https://slsa.dev/provenance/v1',statement={predicateType,subject:[]};
 const bundle={dsseEnvelope:{payloadType:'application/vnd.in-toto+json',payload:Buffer.from(JSON.stringify(statement)).toString('base64')}};
 let calls=0;assert.deepEqual(await verifyStatements({attestations:[{predicateType,bundle}]},{verifyBundle:async value=>{calls++;assert.equal(value,bundle);}}),[statement]);assert.equal(calls,1);
 await assert.rejects(verifyStatements({attestations:[{predicateType,bundle}]},{verifyBundle:async()=>{throw Error('signature rejected');}}),/signature rejected/);
 await assert.rejects(verifyStatements({attestations:[]},{verifyBundle:async()=>{}}));
 await assert.rejects(verifyStatements({attestations:[{predicateType:'https://other.invalid',bundle}]},{verifyBundle:async()=>{}}));
 const wrong={...bundle,dsseEnvelope:{...bundle.dsseEnvelope,payload:Buffer.from(JSON.stringify({predicateType:'wrong'})).toString('base64')}};
 await assert.rejects(verifyStatements({attestations:[{predicateType,bundle:wrong}]},{verifyBundle:async()=>{}}),/predicate mismatch/);
});
test('every prerequisite and both product lanes remain fail-closed',()=>{
 const needs=Object.fromEntries([...gates,'release-seal'].map(name=>[name,{result:'success'}]));verifyNeeds(needs,{sealed:true});
 for(const name of Object.keys(needs))for(const result of ['failure','skipped','cancelled',undefined])assert.throws(()=>verifyNeeds({...needs,[name]:{result}},{sealed:true}));
});
test('immutable artifact producer requires exact main repository, workflow, source and lifetime',()=>{
 const sourceSha='a'.repeat(40),now=Date.now(),metadata={id:12,name:'xtend-release-sealed',expired:false,digest:'sha256:'+'b'.repeat(64),workflow_run:{id:34,head_sha:sourceSha},created_at:new Date(now-1000).toISOString(),expires_at:new Date(now+100000).toISOString()};
 const run={id:34,head_sha:sourceSha,head_branch:'main',event:'workflow_dispatch',repository:{full_name:'konnilabs/xtend'},head_repository:{full_name:'konnilabs/xtend'},workflow_id:56},workflow={id:56,path:'.github/workflows/xtend-default-gates.yml'};
 verifyArtifactMetadata(metadata,run,workflow,{sourceSha,now});
 for(const changed of [{expired:true},{digest:undefined},{name:'prepared'},{workflow_run:{id:34,head_sha:'c'.repeat(40)}}])assert.throws(()=>verifyArtifactMetadata({...metadata,...changed},run,workflow,{sourceSha,now}));
 for(const changed of [{event:'pull_request'},{head_branch:'feature'},{repository:{full_name:'evil/xtend'}},{head_sha:'c'.repeat(40)},{workflow_id:99}])assert.throws(()=>verifyArtifactMetadata(metadata,{...run,...changed},workflow,{sourceSha,now}));
 assert.throws(()=>verifyArtifactMetadata(metadata,run,{...workflow,path:'other.yml'},{sourceSha,now}));
});
test('release workflow preserves all original gates, canonical packer, direct npm11.17 and non-aborting global serialization',()=>{
 const root=path.resolve(__dirname,'../..');
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/xtend-default-gates.yml'),'utf8');
 const job=name=>{const at=workflow.indexOf('  '+name+':\n');assert.ok(at>=0);const next=workflow.slice(at+1).search(/^  [a-z][a-z0-9-]*:\s*$/m);return next<0?workflow.slice(at):workflow.slice(at,at+1+next);};
 const publish=job('npm-publish-latest');assert.match(publish,/environment: npm-publish/);
 for(const gate of [...gates,'release-seal'])assert.ok(publish.includes('      - '+gate+'\n'));
 assert.match(publish,/github.repository == 'konnilabs\/xtend'/);assert.match(publish,/github.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/xtend-npm-publish-global/);assert.match(workflow,/cancel-in-progress: \$\{\{ github.event_name == 'pull_request' \}\}/);
 assert.match(workflow,/publish_to_npm:[\s\S]*?default: false/);
 assert.ok(!publish.includes('actions/cache@'));
 assert.ok(!/npm publish|pack:dry-run|packCandidates|product-candidate-canary.cjs/.test(publish));
 assert.match(publish,/cli.cjs publish --execute/);assert.match(publish,/npm@11.17.0/);
 assert.match(job('product-candidate-canary'),/needs: release-prepare/);
 assert.match(job('product-candidate-canary'),/pipeline.cjs consumers/);
 const packer=fs.readFileSync(path.join(root,'scripts/product-candidate-canary.cjs'),'utf8');
 const fn=source=>source.slice(source.indexOf('function packCandidates'),source.indexOf('async function main'));
 assert.equal(crypto.createHash('sha256').update(fn(packer)).digest('hex'),'c9b1a8a0a78112de934a67bfcc62d45f7de80be3ad016f605593e3d1ccdbfa45');
});
test('prepare/consumer/seal/download default to read-only plans without executing commands',()=>{
 const root=path.resolve(__dirname,'../..');
 for(const command of ['prepare','consumers','seal','download']){
  const output=execFileSync(process.execPath,['scripts/release/pipeline.cjs',command,'--artifact','/nonexistent/review-only'],{cwd:root,encoding:'utf8'});
  assert.equal(JSON.parse(output).mode,'dry-run');
 }
});
