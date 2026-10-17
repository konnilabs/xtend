'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {candidateFixture,preparedFixture}=require('./core-fixture.cjs'),{write}=require('./fixtures.cjs');
const artifact=require('../../scripts/release/artifact.cjs'),candidates=require('../../scripts/release/candidates.cjs');
const profile=require('../../scripts/release/profile.cjs'),evidence=require('../../scripts/release/release-evidence.cjs');
const consumer=require('../../scripts/release/core-evidence.cjs'),integrity=require('../../candidate-integrity.cjs');
for(const selection of [undefined,{groups:['mcp']},{groups:['material']}])test('Core adapter verifies unchanged candidate bytes with scope '+JSON.stringify(selection),async t=>{
 const f=await preparedFixture(t,{selection}),bytes=fs.readFileSync(path.join(f.directory,'manifest.json')),a=await f.verify();
 assert.equal(a.manifest.schema,profile.ARTIFACT);assert.equal(a.manifest.profile,profile.PROFILE);
 assert.equal(fs.existsSync(path.join(f.f.rootDir,'product-demos.lock.json')),false);
 assert.equal(a.manifest.candidateBinding.allPackages.length,10);await candidates.verifyCandidateBinding(a,{directory:f.directory,rootDir:f.f.rootDir});
 assert.deepEqual(fs.readFileSync(path.join(f.directory,'manifest.json')),bytes);
 assert.equal((await artifact.assertPreflightArtifact(a)).phase,'prepared');
});
for(const location of ['candidate','artifact','canary'])for(const field of ['demoSha','demoRepository','productEvidence','unionEvidence'])test('Core rejects '+location+' with foreign '+field,async t=>{
 const f=await preparedFixture(t);await f.verify();
 if(location==='candidate'){const file=path.join(f.directory,'manifest.json'),d=JSON.parse(fs.readFileSync(file));d[field]='foreign';write(file,d);await assert.rejects(candidates.inspectCandidates(f.options),/Core contract/);}
 else {const d=location==='artifact'?f.manifest:f.canary;d[field]='foreign';f.sync();await assert.rejects(f.verify(),/Core contract/);}
});
for(const field of ['schema','profile','coreSha','development','sha256','missing-package','metadata'])test('Core candidate mutation rejects '+field,async t=>{
 const f=await candidateFixture(t);await candidates.inspectCandidates(f.options);
 if(field==='schema')f.manifest.schema=['xtend','product-candidates','v1'].join('.');
 if(field==='profile')delete f.manifest.profile;
 if(field==='coreSha')f.manifest.coreSha='f'.repeat(40);
 if(field==='development')f.manifest.development=true;
 if(field==='sha256')f.manifest.packages[0].sha256='0'.repeat(64);
 if(field==='missing-package')f.manifest.packages.pop();
 if(field==='metadata')f.manifest.packages.find(p=>p.name==='@ccslabs/xtend-mcp').dependencies={};
 write(path.join(f.directory,'manifest.json'),f.manifest);await assert.rejects(candidates.inspectCandidates(f.options));
});
for(const field of ['missing-commands','wrong-order','raw-instead-of-compact','missing-prepared','future-prepared','false-canary','missing-sha256','wrong-binding','legacy-canary'])test('Core prepared contract rejects '+field,async t=>{
 const f=await preparedFixture(t);await f.verify();
 if(field==='missing-commands')delete f.build.commands;
 if(field==='wrong-order')f.build.commands.reverse();
 if(field==='raw-instead-of-compact')f.canary.buildEvidenceIntegrity=artifact.digest(fs.readFileSync(path.join(f.directory,'build.json')));
 if(field==='missing-prepared')delete f.manifest.preparedAt;
 if(field==='future-prepared')f.manifest.preparedAt=new Date(Date.now()+3600000).toISOString();
 if(field==='false-canary')f.canary.ok=false;
 if(field==='missing-sha256')delete f.manifest.packages[0].sha256;
 if(field==='wrong-binding')f.manifest.candidateBinding.allPackages[0].sha256='0'.repeat(64);
 if(field==='legacy-canary'){f.canary.schema=['xtend','release','canary','v1'].join('.');delete f.canary.profile;}
 f.sync();await assert.rejects(f.verify());
});
test('Core preparation permits a separate consumer phase but cannot self-declare a seal',async t=>{
 const f=await preparedFixture(t);delete f.manifest.canary;delete f.manifest.preparedAt;
 write(path.join(f.directory,'release-manifest.json'),f.manifest);await f.verify({phase:'adapted',requireCanary:false});
 f.manifest.preparedAt=new Date().toISOString();write(path.join(f.directory,'release-manifest.json'),f.manifest);
 await f.verify({phase:'prepared',requireCanary:false});await assert.rejects(f.verify(),/bound canary/);
 await assert.rejects(f.verify({phase:'sealed'}),/Sealed artifact phase/);
});
test('real Core publisher stops before registry for pending source and independent FirstRelease',async t=>{
 const f=await preparedFixture(t),a=await f.verify();let calls=0;const forbidden=()=>{calls++;throw Error('No registry or upload permitted');};
 const publish=require('../../scripts/release/publish.cjs').publishRelease;
 await assert.rejects(publish({artifact:a,ledgerFile:f.f.ledgerFile,registry:{version:forbidden,package:forbidden},publisher:{publish:forbidden}}),/Core source|XTEND_CORE|authenticated/i);
 await assert.rejects(publish({artifact:a,ledgerFile:f.f.ledgerFile,publish:true,registry:{version:forbidden,package:forbidden},publisher:{publish:forbidden}}),/source-level initial-authority retirement/);
 assert.equal(calls,0);assert.equal(fs.existsSync(path.join(path.dirname(f.f.ledgerFile),'npm-release.lock')),false);
});
const {installedProof}=require('./contract-proof-fixture.cjs');
for(const node of profile.lanes)test('real Core consumer validator accepts both complete controlled closures for '+node,async t=>{
 const f=await preparedFixture(t,{selection:{groups:['mcp']}}),a=await f.verify(),original=JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),p=installedProof(a,original,node);
 consumer.verifyConsumer(p.report,p.selectedLock,{artifact:a,node,now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock});
});
for(const field of ['runtime','legacy','source','stale','future','lock','sdk-lock','resolution','sdk-coverage','package-check','sdk-knowledge','registry-closure'])test('Core consumer verifier rejects controlled '+field,async t=>{
 const f=await preparedFixture(t,{selection:{groups:['mcp']}}),a=await f.verify(),original=JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),node=profile.lanes[0],p=installedProof(a,original,node),options={artifact:a,node,now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock};consumer.verifyConsumer(p.report,p.selectedLock,options);
 if(field==='runtime')p.report.runtime.node='other';if(field==='legacy')p.report.demoSha='d'.repeat(40);if(field==='source')p.report.sourceSha='e'.repeat(40);
 if(field==='stale')p.report.finishedAt=new Date(Date.now()-7200000).toISOString();if(field==='future')p.report.finishedAt=new Date(Date.now()+7200000).toISOString();
 if(field==='lock')p.selectedLock.packages[''].dependencies={};if(field==='sdk-lock')p.sdkLock.packages[''].dependencies={};if(field==='resolution')p.report.resolution=false;
 if(field==='sdk-coverage')p.report.candidateSDK.packages.pop();if(field==='package-check')p.report.packages[0].types=false;if(field==='sdk-knowledge')p.report.candidateSDK.mcpKnowledgeChecked=false;if(field==='registry-closure')p.report.registryDependencies.pop();
 assert.throws(()=>consumer.verifyConsumer(p.report,p.selectedLock,options));
});
test('historical v1 reference and current shared generic verifier preserve exact v1 bytes; Core rejects relabeling',async t=>{
 const f=await require('./legacy-runtime.cjs').load('tests/release/fixtures.cjs').packedFixture(t);
 assert.equal(f.manifest.schema,['xtend','release','artifact','v1'].join('.'));assert.ok(!Object.hasOwn(f.manifest,'profile'));
 const bytes=fs.readFileSync(path.join(f.artifactDir,'release-manifest.json'));await f.verify();assert.deepEqual(fs.readFileSync(path.join(f.artifactDir,'release-manifest.json')),bytes);
 await assert.rejects(artifact.verifyArtifact({directory:f.artifactDir,manifestIntegrity:f.integrity(),sourceSha:f.sourceSha,rootDir:f.rootDir,phase:'primitive'}),/Core contract/);
});
